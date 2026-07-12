import { CandleFetchService, } from "../market-data/candle-fetch-service.js";
import { finalizeCandleProviderResponse } from "../market-data/candle-quality.js";
import { filterCandlesByCloseAsOf, } from "../market-data/candle-as-of-filter.js";
import { buildSupportResistanceContextFromNormalizedCandles, parseSharedCandleTimestamp, sortSharedCandles, } from "./build-support-resistance-context.js";
const DEFAULT_LOOKBACK_BARS = {
    daily: 520,
    "4h": 180,
    "5m": 120,
};
const ONE_MINUTE_MS = 60 * 1000;
const FIVE_MINUTE_MS = 5 * ONE_MINUTE_MS;
function normalizeSymbol(symbol) {
    const normalized = symbol.trim().toUpperCase();
    if (!normalized) {
        throw new Error("symbol is required.");
    }
    return normalized;
}
function buildFetchService(request) {
    return (request.fetchService ??
        new CandleFetchService({
            ...request.fetchServiceOptions,
            providerName: request.preferredProvider ?? request.fetchServiceOptions?.providerName,
        }));
}
function fetchSummary(response) {
    const freshnessStatus = response.completenessStatus === "empty"
        ? "missing"
        : response.stale
            ? "stale"
            : response.completenessStatus === "partial"
                ? "partial"
                : response.validationIssues.some((issue) => issue.severity === "warning")
                    ? "usable"
                    : "fresh";
    return {
        timeframe: response.timeframe,
        provider: response.provider,
        freshnessStatus,
        requestedLookbackBars: response.requestedLookbackBars,
        actualBarsReturned: response.actualBarsReturned,
        requestedStartTimestamp: response.requestedStartTimestamp,
        requestedEndTimestamp: response.requestedEndTimestamp,
        newestCandleTimestamp: response.candles.at(-1)?.timestamp ?? null,
        completenessStatus: response.completenessStatus,
        stale: response.stale,
        validationIssues: response.validationIssues,
    };
}
function aggregateCandlesToFiveMinutes(candles) {
    const sorted = [...candles].sort((left, right) => left.timestamp - right.timestamp);
    const buckets = new Map();
    for (const candle of sorted) {
        const bucketStart = Math.floor(candle.timestamp / FIVE_MINUTE_MS) * FIVE_MINUTE_MS;
        const bucket = buckets.get(bucketStart) ?? [];
        bucket.push(candle);
        buckets.set(bucketStart, bucket);
    }
    return [...buckets.entries()]
        .sort(([left], [right]) => left - right)
        .map(([timestamp, bucket]) => ({
        timestamp,
        open: bucket[0].open,
        high: Math.max(...bucket.map((candle) => candle.high)),
        low: Math.min(...bucket.map((candle) => candle.low)),
        close: bucket.at(-1).close,
        volume: bucket.reduce((sum, candle) => sum + candle.volume, 0),
    }));
}
function shouldTryOneMinuteFallbackForFiveMinuteResponse(response, preferredProvider) {
    if (response && response.provider !== "eodhd") {
        return false;
    }
    if (!response && preferredProvider !== "eodhd") {
        return false;
    }
    return (response === undefined ||
        response.completenessStatus === "empty" ||
        response.stale ||
        response.validationIssues.some((issue) => issue.code === "zero_results" ||
            issue.code === "stale_final_candle" ||
            issue.code === "missing_recent_candles" ||
            issue.code === "incomplete_current_session_data"));
}
async function fetchOneMinuteAggregatedFiveMinuteResponse(params) {
    const oneMinuteResponse = await params.fetchService.fetchCandles({
        symbol: params.symbol,
        timeframe: "1m",
        lookbackBars: params.lookbackBars * 5,
        endTimeMs: params.endTimeMs,
        preferredProvider: params.preferredProvider,
    });
    const candles = aggregateCandlesToFiveMinutes(oneMinuteResponse.candles)
        .slice(-params.lookbackBars);
    const baseResponse = {
        provider: oneMinuteResponse.provider,
        symbol: oneMinuteResponse.symbol,
        timeframe: "5m",
        requestedLookbackBars: params.lookbackBars,
        candles,
        fetchStartTimestamp: oneMinuteResponse.fetchStartTimestamp,
        fetchEndTimestamp: oneMinuteResponse.fetchEndTimestamp,
        requestedStartTimestamp: oneMinuteResponse.requestedStartTimestamp,
        requestedEndTimestamp: oneMinuteResponse.requestedEndTimestamp,
        sessionMetadataAvailable: oneMinuteResponse.sessionMetadataAvailable,
        providerMetadata: {
            ...(oneMinuteResponse.providerMetadata ?? {}),
            sourceTimeframe: "1m",
            derivedTimeframe: "5m",
            aggregationMethod: "ohlcv_1m_to_5m",
            sourceActualBarsReturned: oneMinuteResponse.actualBarsReturned,
        },
    };
    return finalizeCandleProviderResponse(baseResponse);
}
function diagnosticsFromResponses(responses) {
    const diagnostics = [];
    for (const timeframe of ["daily", "4h"]) {
        const response = responses[timeframe];
        if (!response || response.completenessStatus === "empty") {
            diagnostics.push({
                code: "missing_required_higher_timeframe",
                severity: "error",
                timeframe,
                message: `${timeframe} candles are required for full support/resistance context.`,
            });
        }
    }
    if (!responses["5m"] || responses["5m"]?.completenessStatus === "empty") {
        diagnostics.push({
            code: "missing_optional_5m_candles",
            severity: "warning",
            timeframe: "5m",
            message: "5m candles are optional, but missing 5m data limits dynamic and intraday context.",
        });
    }
    for (const response of Object.values(responses)) {
        if (!response) {
            continue;
        }
        diagnostics.push({
            code: "fetched_candle_group",
            severity: "info",
            timeframe: response.timeframe,
            message: `Fetched ${response.actualBarsReturned} ${response.timeframe} candles from ${response.provider}.`,
        });
        for (const issue of response.validationIssues) {
            diagnostics.push({
                code: "provider_warning",
                severity: issue.severity,
                timeframe: response.timeframe,
                message: issue.message,
            });
        }
    }
    return diagnostics;
}
function diagnosticsFromCandleFilters(diagnostics) {
    return diagnostics.map((diagnostic) => ({
        code: diagnostic.code,
        severity: diagnostic.severity,
        timeframe: diagnostic.timeframe === "1m" ? "5m" : diagnostic.timeframe,
        message: diagnostic.message,
    }));
}
export async function buildSupportResistanceContextForSymbol(request) {
    const symbol = normalizeSymbol(request.symbol);
    const fetchService = buildFetchService(request);
    const endTimeMs = request.asOfTimestamp === undefined
        ? undefined
        : parseSharedCandleTimestamp(request.asOfTimestamp);
    const endTimeMsByTimeframe = {};
    for (const timeframe of ["daily", "4h", "5m"]) {
        const timestamp = request.asOfTimestampByTimeframe?.[timeframe];
        if (timestamp !== undefined) {
            endTimeMsByTimeframe[timeframe] = parseSharedCandleTimestamp(timestamp);
        }
    }
    const requestedTimeframes = ["daily", "4h", "5m"];
    const settled = await Promise.allSettled(requestedTimeframes.map((timeframe) => fetchService.fetchCandles({
        symbol,
        timeframe,
        lookbackBars: request.lookbackBars?.[timeframe] ?? DEFAULT_LOOKBACK_BARS[timeframe],
        endTimeMs: endTimeMsByTimeframe[timeframe] ?? endTimeMs,
        preferredProvider: request.preferredProvider,
    })));
    const responses = {};
    let failedDiagnostics = [];
    for (const [index, result] of settled.entries()) {
        const timeframe = requestedTimeframes[index];
        if (result.status === "fulfilled") {
            responses[timeframe] = result.value;
            continue;
        }
        failedDiagnostics.push({
            code: timeframe === "5m" ? "missing_optional_5m_candles" : "missing_required_higher_timeframe",
            severity: timeframe === "5m" ? "warning" : "error",
            timeframe,
            message: result.reason instanceof Error
                ? result.reason.message
                : `Failed to fetch ${timeframe} candles for ${symbol}.`,
        });
    }
    if (shouldTryOneMinuteFallbackForFiveMinuteResponse(responses["5m"], request.preferredProvider)) {
        try {
            const fallbackResponse = await fetchOneMinuteAggregatedFiveMinuteResponse({
                fetchService,
                symbol,
                lookbackBars: request.lookbackBars?.["5m"] ?? DEFAULT_LOOKBACK_BARS["5m"],
                endTimeMs: endTimeMsByTimeframe["5m"] ?? endTimeMs,
                preferredProvider: request.preferredProvider,
            });
            if (fallbackResponse.actualBarsReturned > 0 && !fallbackResponse.stale) {
                responses["5m"] = fallbackResponse;
                failedDiagnostics = failedDiagnostics.filter((diagnostic) => diagnostic.timeframe !== "5m");
            }
        }
        catch {
            // Keep the original optional 5m diagnostics when the 1m fallback is unavailable.
        }
    }
    const responseDiagnostics = diagnosticsFromResponses(responses);
    const preliminaryDiagnostics = [...failedDiagnostics, ...responseDiagnostics];
    const daily = responses.daily;
    const fourHour = responses["4h"];
    if (!daily || !fourHour) {
        const diagnosticSummary = preliminaryDiagnostics
            .filter((diagnostic) => diagnostic.severity === "error" || diagnostic.timeframe === "daily" || diagnostic.timeframe === "4h")
            .map((diagnostic) => `${diagnostic.timeframe ?? "context"}: ${diagnostic.message}`)
            .join(" | ");
        throw new Error(`Cannot build full support/resistance context for ${symbol}: daily and 4h candles are required.${diagnosticSummary ? ` Higher-timeframe diagnostics: ${diagnosticSummary}` : ""}`);
    }
    const dailyFilter = filterCandlesByCloseAsOf({
        candles: daily.candles,
        timeframe: "daily",
        asOfTimestamp: endTimeMsByTimeframe.daily ?? endTimeMs,
    });
    const fourHourFilter = filterCandlesByCloseAsOf({
        candles: fourHour.candles,
        timeframe: "4h",
        asOfTimestamp: endTimeMsByTimeframe["4h"] ?? endTimeMs,
    });
    const fiveMinuteFilter = filterCandlesByCloseAsOf({
        candles: responses["5m"]?.candles ?? [],
        timeframe: "5m",
        asOfTimestamp: endTimeMsByTimeframe["5m"] ?? endTimeMs,
    });
    const candleFilterDiagnostics = [
        ...dailyFilter.diagnostics,
        ...fourHourFilter.diagnostics,
        ...fiveMinuteFilter.diagnostics,
    ];
    const diagnostics = [
        ...preliminaryDiagnostics,
        ...diagnosticsFromCandleFilters(candleFilterDiagnostics),
    ];
    const baseContext = await buildSupportResistanceContextFromNormalizedCandles({
        symbol,
        candlesByTimeframe: {
            daily: sortSharedCandles(dailyFilter.candles),
            "4h": sortSharedCandles(fourHourFilter.candles),
            "5m": sortSharedCandles(fiveMinuteFilter.candles),
        },
        providerByTimeframe: {
            daily: daily.provider,
            "4h": fourHour.provider,
            ...(responses["5m"] ? { "5m": responses["5m"].provider } : {}),
        },
        sessionDate: request.sessionDate,
        asOfTimestamp: endTimeMs,
        currentPrice: request.currentPrice,
        bid: request.bid,
        ask: request.ask,
        stockContext: request.stockContext,
        knownCatalyst: request.knownCatalyst,
        config: request.config,
        runtimeOptions: request.runtimeOptions,
    });
    return {
        ...baseContext,
        mode: "symbol",
        candleFetchingOwnedBy: "levels-system",
        requestedTimeframes,
        fetches: Object.values(responses).map(fetchSummary),
        candleFilterDiagnostics,
        diagnostics,
    };
}
