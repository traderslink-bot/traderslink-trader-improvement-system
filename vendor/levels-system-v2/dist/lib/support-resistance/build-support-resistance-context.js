import { filterCandlesByCloseAsOf, } from "../market-data/candle-as-of-filter.js";
import { CandleFetchService } from "../market-data/candle-fetch-service.js";
import { LevelEngine } from "../levels/level-engine.js";
import { buildCandleMarketStructureContext, } from "../structure/index.js";
import { buildDynamicLevelsFromCandles, } from "./indicators/index.js";
import { buildGapStructure, } from "./gap-structure.js";
import { buildReferenceLevels, } from "./reference-levels.js";
import { buildTraderIntelligenceContext, } from "../trader-context/index.js";
export async function buildSupportResistanceContextFromNormalizedCandles(params) {
    const dailyFilter = filterCandlesByCloseAsOf({
        candles: params.candlesByTimeframe.daily,
        timeframe: "daily",
        asOfTimestamp: params.asOfTimestamp,
    });
    const fourHourFilter = filterCandlesByCloseAsOf({
        candles: params.candlesByTimeframe["4h"],
        timeframe: "4h",
        asOfTimestamp: params.asOfTimestamp,
    });
    const fiveMinuteFilter = filterCandlesByCloseAsOf({
        candles: params.candlesByTimeframe["5m"] ?? [],
        timeframe: "5m",
        asOfTimestamp: params.asOfTimestamp,
    });
    const candlesByTimeframe = {
        daily: dailyFilter.candles,
        "4h": fourHourFilter.candles,
        "5m": fiveMinuteFilter.candles,
    };
    const candleFilterDiagnostics = [
        ...dailyFilter.diagnostics,
        ...fourHourFilter.diagnostics,
        ...fiveMinuteFilter.diagnostics,
    ];
    const provider = new InMemoryHistoricalCandleProvider(params.symbol, candlesByTimeframe, params.providerByTimeframe);
    const fetchService = new CandleFetchService(provider);
    const engine = new LevelEngine(fetchService, params.config, params.runtimeOptions);
    const levels = await engine.generateLevels({
        symbol: params.symbol,
        historicalRequests: {
            daily: requestForSeries(params.symbol, "daily", candlesByTimeframe.daily),
            "4h": requestForSeries(params.symbol, "4h", candlesByTimeframe["4h"]),
            "5m": requestForSeries(params.symbol, "5m", candlesByTimeframe["5m"] ?? []),
        },
    });
    const currentPrice = params.currentPrice ?? candlesByTimeframe["5m"]?.at(-1)?.close;
    const referenceLevels = buildReferenceLevels({
        dailyCandles: candlesByTimeframe.daily,
        intradayCandles: candlesByTimeframe["5m"] ?? [],
        sessionDate: params.sessionDate,
    });
    const gapStructure = buildGapStructure({
        candles: candlesByTimeframe.daily,
        currentPrice,
    });
    const dynamicLevels = buildDynamicLevelsFromCandles(candlesByTimeframe["5m"], {
        sessionDate: params.sessionDate,
        emaPeriods: [9, 20],
        currentPrice,
    });
    return {
        symbol: params.symbol,
        levels,
        referenceLevels,
        gapStructure,
        dynamicLevels,
        marketStructure: buildCandleMarketStructureContext({
            symbol: params.symbol,
            candles: candlesByTimeframe["5m"] ?? [],
            asOfTimestamp: params.asOfTimestamp,
            currentPrice,
        }),
        traderContext: buildTraderIntelligenceContext({
            symbol: params.symbol,
            dailyCandles: candlesByTimeframe.daily,
            intradayCandles: candlesByTimeframe["5m"] ?? [],
            currentPrice,
            bid: params.bid,
            ask: params.ask,
            dynamicLevels,
            stockContext: params.stockContext,
            knownCatalyst: params.knownCatalyst,
            levels,
            timestamp: params.asOfTimestamp,
        }),
        candleFilterDiagnostics,
    };
}
function timeframeIntervalMs(timeframe) {
    switch (timeframe) {
        case "daily":
            return 24 * 60 * 60 * 1000;
        case "4h":
            return 4 * 60 * 60 * 1000;
        case "5m":
            return 5 * 60 * 1000;
    }
}
export function parseSharedCandleTimestamp(timestamp) {
    if (typeof timestamp === "number") {
        if (Number.isFinite(timestamp)) {
            return timestamp;
        }
        throw new Error("candle timestamp number must be finite.");
    }
    if (timestamp instanceof Date) {
        const value = timestamp.getTime();
        if (Number.isFinite(value)) {
            return value;
        }
        throw new Error("candle timestamp Date must be valid.");
    }
    const value = Date.parse(timestamp);
    if (Number.isFinite(value)) {
        return value;
    }
    throw new Error(`candle timestamp string is not parseable: ${timestamp}`);
}
function assertFinitePrice(value, field) {
    if (!Number.isFinite(value)) {
        throw new Error(`candle ${field} must be finite.`);
    }
    return value;
}
function normalizeCandle(candle) {
    return {
        timestamp: parseSharedCandleTimestamp(candle.timestamp),
        open: assertFinitePrice(candle.open, "open"),
        high: assertFinitePrice(candle.high, "high"),
        low: assertFinitePrice(candle.low, "low"),
        close: assertFinitePrice(candle.close, "close"),
        volume: assertFinitePrice(candle.volume, "volume"),
    };
}
export function sortSharedCandles(candles) {
    return [...(candles ?? [])].sort((left, right) => left.timestamp - right.timestamp);
}
export function normalizeSharedSupportResistanceCandles(candles, asOfTimestamp, options = {}) {
    const normalized = (candles ?? []).map(normalizeCandle);
    return filterCandlesByCloseAsOf({
        candles: normalized,
        timeframe: options.timeframe ?? "5m",
        asOfTimestamp,
    }).candles;
}
function requestForSeries(symbol, timeframe, candles) {
    return {
        symbol,
        timeframe,
        lookbackBars: Math.max(candles.length, 1),
        endTimeMs: candles.at(-1)?.timestamp ?? Date.now(),
        preferredProvider: "stub",
    };
}
class InMemoryHistoricalCandleProvider {
    providerByTimeframe;
    providerName = "stub";
    candlesByTimeframe;
    constructor(symbol, candlesByTimeframe, providerByTimeframe = {}) {
        this.providerByTimeframe = providerByTimeframe;
        this.candlesByTimeframe = {
            daily: sortSharedCandles(candlesByTimeframe.daily),
            "4h": sortSharedCandles(candlesByTimeframe["4h"]),
            "5m": sortSharedCandles(candlesByTimeframe["5m"]),
        };
        for (const [timeframe, candles] of Object.entries(this.candlesByTimeframe)) {
            if (timeframe !== "5m" && candles.length === 0) {
                throw new Error(`${symbol.toUpperCase()} requires ${timeframe} candles to build support/resistance context.`);
            }
        }
    }
    async fetchCandles(request, plan) {
        if (request.timeframe === "1m") {
            throw new Error("In-memory support/resistance context provider does not serve 1m candles.");
        }
        const candles = this.candlesByTimeframe[request.timeframe] ?? [];
        const requestedEndTimestamp = request.endTimeMs ?? candles.at(-1)?.timestamp ?? Date.now();
        const intervalMs = timeframeIntervalMs(request.timeframe);
        const requestedStartTimestamp = candles[0]?.timestamp ??
            requestedEndTimestamp - Math.max(request.lookbackBars, plan.plannedBarCount, 1) * intervalMs;
        return {
            provider: this.providerByTimeframe[request.timeframe] ?? this.providerName,
            symbol: request.symbol.toUpperCase(),
            timeframe: request.timeframe,
            requestedLookbackBars: Math.max(request.lookbackBars, candles.length, 1),
            candles,
            fetchStartTimestamp: Date.now(),
            fetchEndTimestamp: Date.now(),
            requestedStartTimestamp,
            requestedEndTimestamp,
            sessionMetadataAvailable: request.timeframe === "5m",
            providerMetadata: {
                source: "provided_candles",
            },
        };
    }
}
export async function buildSupportResistanceContextFromCandles(request) {
    const symbol = request.symbol.trim().toUpperCase();
    if (!symbol) {
        throw new Error("symbol is required.");
    }
    const asOfTimestamp = request.asOfTimestamp === undefined ? undefined : parseSharedCandleTimestamp(request.asOfTimestamp);
    const normalizedCandles = {
        daily: normalizeSharedSupportResistanceCandles(request.candlesByTimeframe.daily, asOfTimestamp, { timeframe: "daily" }),
        "4h": normalizeSharedSupportResistanceCandles(request.candlesByTimeframe["4h"], asOfTimestamp, { timeframe: "4h" }),
        "5m": normalizeSharedSupportResistanceCandles(request.candlesByTimeframe["5m"], asOfTimestamp, { timeframe: "5m" }),
    };
    return buildSupportResistanceContextFromNormalizedCandles({
        symbol,
        candlesByTimeframe: normalizedCandles,
        sessionDate: request.sessionDate,
        asOfTimestamp,
        currentPrice: request.currentPrice,
        bid: request.bid,
        ask: request.ask,
        stockContext: request.stockContext,
        knownCatalyst: request.knownCatalyst,
        config: request.config,
        runtimeOptions: request.runtimeOptions,
    });
}
