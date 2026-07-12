import { classifyIntradayCandleTimestamp } from "./candle-session-classifier.js";
const DEFAULT_BASE_URL = "https://query1.finance.yahoo.com";
function toYahooInterval(timeframe) {
    switch (timeframe) {
        case "1m":
            return "1m";
        case "5m":
            return "5m";
        case "4h":
            return "60m";
        case "daily":
            return "1d";
    }
}
function sourceIntervalMs(timeframe) {
    switch (timeframe) {
        case "1m":
            return 60_000;
        case "5m":
            return 5 * 60_000;
        case "4h":
            return 60 * 60_000;
        case "daily":
            return 24 * 60 * 60_000;
    }
}
function toFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function toVolume(value) {
    return typeof value === "number" && Number.isFinite(value) && value > 0
        ? Math.round(value)
        : 0;
}
function hasTradableOhlc(candle) {
    return (Number.isFinite(candle.open) &&
        Number.isFinite(candle.high) &&
        Number.isFinite(candle.low) &&
        Number.isFinite(candle.close) &&
        Number.isFinite(candle.volume) &&
        candle.high >= candle.low &&
        candle.high >= candle.open &&
        candle.high >= candle.close &&
        candle.low <= candle.open &&
        candle.low <= candle.close &&
        candle.open > 0 &&
        candle.high > 0 &&
        candle.low > 0 &&
        candle.close > 0 &&
        candle.volume >= 0);
}
function filterInvalidOhlcCandles(candles) {
    const filtered = candles.filter(hasTradableOhlc);
    return {
        candles: filtered,
        droppedInvalidOhlcBars: candles.length - filtered.length,
    };
}
function aggregateHourlyToFourHour(candles) {
    const bySessionDate = new Map();
    for (const candle of candles) {
        const sessionDate = classifyIntradayCandleTimestamp(candle.timestamp).sessionDate;
        bySessionDate.set(sessionDate, [...(bySessionDate.get(sessionDate) ?? []), candle]);
    }
    const aggregated = [];
    for (const sessionCandles of bySessionDate.values()) {
        const sorted = [...sessionCandles].sort((left, right) => left.timestamp - right.timestamp);
        for (let index = 0; index < sorted.length; index += 4) {
            const bucketCandles = sorted.slice(index, index + 4);
            aggregated.push({
                timestamp: bucketCandles[0].timestamp,
                open: bucketCandles[0].open,
                high: Math.max(...bucketCandles.map((candle) => candle.high)),
                low: Math.min(...bucketCandles.map((candle) => candle.low)),
                close: bucketCandles.at(-1).close,
                volume: bucketCandles.reduce((sum, candle) => sum + candle.volume, 0),
            });
        }
    }
    return aggregated.sort((left, right) => left.timestamp - right.timestamp);
}
export class YahooHistoricalCandleProvider {
    providerName = "yahoo";
    baseUrl;
    fetchFn;
    includePrePost;
    constructor(options = {}) {
        this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
        this.fetchFn = options.fetchFn ?? fetch;
        this.includePrePost = options.includePrePost ?? true;
    }
    async fetchCandles(request, plan) {
        const symbol = request.symbol.trim().toUpperCase();
        if (!symbol) {
            throw new Error("symbol is required.");
        }
        const fetchStartTimestamp = Date.now();
        const result = await this.fetchYahooCandles(symbol, request.timeframe, plan);
        const fetchEndTimestamp = Date.now();
        const sorted = result.candles.sort((left, right) => left.timestamp - right.timestamp).slice(-plan.plannedBarCount);
        return {
            provider: this.providerName,
            symbol,
            timeframe: request.timeframe,
            requestedLookbackBars: request.lookbackBars,
            candles: sorted,
            fetchStartTimestamp,
            fetchEndTimestamp,
            requestedStartTimestamp: plan.requestStartTimestamp,
            requestedEndTimestamp: plan.requestEndTimestamp,
            sessionMetadataAvailable: plan.sessionMetadataAvailable,
            providerMetadata: {
                yahooInterval: toYahooInterval(request.timeframe),
                yahooIncludePrePost: this.includePrePost,
                yahooDroppedInvalidOhlcBars: result.droppedInvalidOhlcBars,
            },
        };
    }
    async fetchYahooCandles(symbol, timeframe, plan) {
        const interval = toYahooInterval(timeframe);
        const expandedStartTimestamp = timeframe === "4h"
            ? plan.requestStartTimestamp - 3 * sourceIntervalMs(timeframe)
            : plan.requestStartTimestamp;
        const url = this.buildUrl(`/v8/finance/chart/${encodeURIComponent(symbol)}`, {
            period1: String(Math.floor(expandedStartTimestamp / 1000)),
            period2: String(Math.floor(plan.requestEndTimestamp / 1000)),
            interval,
            includePrePost: this.includePrePost ? "true" : "false",
            events: "div,splits",
        });
        const payload = await this.fetchJson(url);
        const result = payload.chart?.result?.[0];
        if (!result) {
            const error = payload.chart?.error;
            const message = error?.description ?? error?.code ?? "Yahoo returned no chart result.";
            throw new Error(`Yahoo chart request failed for ${symbol}: ${message}`);
        }
        const mapped = this.mapChartResult(symbol, result);
        const filtered = filterInvalidOhlcCandles(mapped);
        return {
            candles: timeframe === "4h" ? aggregateHourlyToFourHour(filtered.candles) : filtered.candles,
            droppedInvalidOhlcBars: filtered.droppedInvalidOhlcBars,
        };
    }
    mapChartResult(symbol, result) {
        const timestamps = result.timestamp ?? [];
        const quote = result.indicators?.quote?.[0];
        if (!quote) {
            throw new Error(`Yahoo chart response has no quote arrays for ${symbol}.`);
        }
        const candles = [];
        for (let index = 0; index < timestamps.length; index += 1) {
            const timestampSeconds = timestamps[index];
            const open = toFiniteNumber(quote.open?.[index]);
            const high = toFiniteNumber(quote.high?.[index]);
            const low = toFiniteNumber(quote.low?.[index]);
            const close = toFiniteNumber(quote.close?.[index]);
            if (typeof timestampSeconds !== "number" ||
                !Number.isFinite(timestampSeconds) ||
                open === null ||
                high === null ||
                low === null ||
                close === null) {
                candles.push({
                    timestamp: Number.isFinite(timestampSeconds) ? timestampSeconds * 1000 : Number.NaN,
                    open: open ?? Number.NaN,
                    high: high ?? Number.NaN,
                    low: low ?? Number.NaN,
                    close: close ?? Number.NaN,
                    volume: toVolume(quote.volume?.[index]),
                });
                continue;
            }
            candles.push({
                timestamp: timestampSeconds * 1000,
                open,
                high,
                low,
                close,
                volume: toVolume(quote.volume?.[index]),
            });
        }
        return candles;
    }
    buildUrl(path, params) {
        const url = new URL(`${this.baseUrl.replace(/\/$/, "")}${path}`);
        for (const [key, value] of Object.entries(params)) {
            url.searchParams.set(key, value);
        }
        return url.toString();
    }
    async fetchJson(url) {
        const response = await this.fetchFn(url, {
            headers: {
                "User-Agent": "Mozilla/5.0",
            },
        });
        if (!response.ok) {
            throw new Error(`Yahoo chart request failed with HTTP ${response.status}.`);
        }
        return await response.json();
    }
}
