import { classifyIntradayCandleTimestamp } from "./candle-session-classifier.js";
const DEFAULT_BASE_URL = "https://eodhd.com/api";
const DEFAULT_EXCHANGE_SUFFIX = "US";
const ADJUSTMENT_MODE = "adjusted_close_ratio";
function envText(...names) {
    return names.map((name) => process.env[name]?.trim()).find(Boolean);
}
function toFiniteNumber(value, field, symbol) {
    const numberValue = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(numberValue)) {
        throw new Error(`EODHD returned invalid ${field} for ${symbol}: ${String(value)}`);
    }
    return numberValue;
}
function toVolume(value) {
    const numberValue = typeof value === "number" ? value : Number(value ?? 0);
    return Number.isFinite(numberValue) && numberValue > 0 ? Math.round(numberValue) : 0;
}
function roundAdjustedPrice(value) {
    return Number(value.toFixed(6));
}
function isoDate(timestamp) {
    return new Date(timestamp).toISOString().slice(0, 10);
}
function eodDateTimestamp(date, symbol) {
    const timestamp = Date.parse(`${String(date)}T00:00:00.000Z`);
    if (!Number.isFinite(timestamp)) {
        throw new Error(`EODHD returned invalid daily date for ${symbol}: ${String(date)}`);
    }
    return timestamp;
}
function dailyAdjustmentFactor(bar, symbol) {
    const close = toFiniteNumber(bar.close, "close", symbol);
    if (bar.adjusted_close === undefined || bar.adjusted_close === null) {
        return 1;
    }
    const adjustedClose = toFiniteNumber(bar.adjusted_close, "adjusted_close", symbol);
    return adjustedClose > 0 && close > 0 ? adjustedClose / close : 1;
}
function normalizeEodhdSymbol(symbol, exchangeSuffix) {
    const normalized = symbol.trim().toUpperCase();
    if (!normalized) {
        throw new Error("symbol is required.");
    }
    return normalized.includes(".") ? normalized : `${normalized}.${exchangeSuffix}`;
}
function eodhdInterval(timeframe) {
    if (timeframe === "1m") {
        return "1m";
    }
    if (timeframe === "5m") {
        return "5m";
    }
    return "1h";
}
function eodhdSourceIntervalMs(timeframe) {
    if (timeframe === "1m") {
        return 60_000;
    }
    if (timeframe === "5m") {
        return 5 * 60_000;
    }
    return 60 * 60_000;
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
export class EodhdHistoricalCandleProvider {
    providerName = "eodhd";
    apiToken;
    exchangeSuffix;
    baseUrl;
    fetchFn;
    constructor(options = {}) {
        const apiToken = options.apiToken ?? envText("EODHD_API_TOKEN", "LEVEL_EODHD_API_TOKEN");
        if (!apiToken) {
            throw new Error("EODHD_API_TOKEN is required to use the EODHD historical candle provider.");
        }
        this.apiToken = apiToken;
        this.exchangeSuffix = options.exchangeSuffix ?? envText("EODHD_EXCHANGE_SUFFIX", "LEVEL_EODHD_EXCHANGE_SUFFIX") ?? DEFAULT_EXCHANGE_SUFFIX;
        this.baseUrl = options.baseUrl ?? envText("EODHD_BASE_URL", "LEVEL_EODHD_BASE_URL") ?? DEFAULT_BASE_URL;
        this.fetchFn = options.fetchFn ?? fetch;
    }
    async fetchCandles(request, plan) {
        const symbol = request.symbol.trim().toUpperCase();
        const eodhdSymbol = normalizeEodhdSymbol(symbol, this.exchangeSuffix);
        const fetchStartTimestamp = Date.now();
        const result = request.timeframe === "daily"
            ? await this.fetchDailyCandles(eodhdSymbol, symbol, plan)
            : await this.fetchIntradayCandles(eodhdSymbol, symbol, request.timeframe, plan);
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
                eodhdSymbol,
                eodhdInterval: request.timeframe === "daily" ? "d" : eodhdInterval(request.timeframe),
                eodhdExchangeSuffix: this.exchangeSuffix,
                providerAdjustmentMode: ADJUSTMENT_MODE,
                eodhdDroppedInvalidOhlcBars: result.droppedInvalidOhlcBars,
                useRTH: false,
            },
        };
    }
    async fetchDailyBars(eodhdSymbol, fromTimestamp, toTimestamp) {
        const url = this.buildUrl(`/eod/${encodeURIComponent(eodhdSymbol)}`, {
            fmt: "json",
            period: "d",
            from: isoDate(fromTimestamp),
            to: isoDate(toTimestamp),
        });
        return this.fetchJson(url);
    }
    async fetchDailyCandles(eodhdSymbol, requestedSymbol, plan) {
        const payload = await this.fetchDailyBars(eodhdSymbol, plan.requestStartTimestamp, plan.requestEndTimestamp);
        const candles = payload.map((bar) => {
            const timestamp = eodDateTimestamp(bar.date, requestedSymbol);
            return this.mapCandle({
                symbol: requestedSymbol,
                timestamp,
                open: bar.open,
                high: bar.high,
                low: bar.low,
                close: bar.close,
                adjustedClose: bar.adjusted_close,
                volume: bar.volume,
            });
        });
        return filterInvalidOhlcCandles(candles);
    }
    async fetchDailyAdjustmentFactors(eodhdSymbol, requestedSymbol, fromTimestamp, toTimestamp) {
        const payload = await this.fetchDailyBars(eodhdSymbol, fromTimestamp, toTimestamp);
        const factors = new Map();
        for (const bar of payload) {
            if (bar.date === undefined || bar.date === null) {
                continue;
            }
            eodDateTimestamp(bar.date, requestedSymbol);
            factors.set(String(bar.date), dailyAdjustmentFactor(bar, requestedSymbol));
        }
        return factors;
    }
    intradayAdjustmentFactor(timestamp, adjustmentFactorsBySessionDate) {
        const sessionDate = classifyIntradayCandleTimestamp(timestamp).sessionDate;
        return adjustmentFactorsBySessionDate.get(sessionDate) ?? 1;
    }
    async fetchIntradayCandles(eodhdSymbol, requestedSymbol, timeframe, plan) {
        const interval = eodhdInterval(timeframe);
        const intervalMultiplier = timeframe === "4h" ? 4 : 1;
        const expandedStartTimestamp = timeframe === "4h"
            ? plan.requestStartTimestamp - (intervalMultiplier - 1) * eodhdSourceIntervalMs(timeframe)
            : plan.requestStartTimestamp;
        const url = this.buildUrl(`/intraday/${encodeURIComponent(eodhdSymbol)}`, {
            fmt: "json",
            interval,
            from: String(Math.floor(expandedStartTimestamp / 1000)),
            to: String(Math.floor(plan.requestEndTimestamp / 1000)),
        });
        const payload = await this.fetchJson(url);
        const adjustmentFactorsBySessionDate = await this.fetchDailyAdjustmentFactors(eodhdSymbol, requestedSymbol, expandedStartTimestamp - 24 * 60 * 60 * 1000, plan.requestEndTimestamp + 24 * 60 * 60 * 1000);
        const mappedCandles = payload.map((bar) => this.mapIntradayBar(bar, requestedSymbol, adjustmentFactorsBySessionDate));
        const filtered = filterInvalidOhlcCandles(mappedCandles);
        return {
            candles: timeframe === "4h" ? aggregateHourlyToFourHour(filtered.candles) : filtered.candles,
            droppedInvalidOhlcBars: filtered.droppedInvalidOhlcBars,
        };
    }
    mapIntradayBar(bar, symbol, adjustmentFactorsBySessionDate) {
        const timestampSeconds = typeof bar.timestamp === "number" ? bar.timestamp : Number(bar.timestamp);
        const timestamp = Number.isFinite(timestampSeconds)
            ? timestampSeconds * 1000
            : this.parseEodhdUtcDatetime(bar.datetime);
        if (!Number.isFinite(timestamp)) {
            throw new Error(`EODHD returned invalid intraday timestamp for ${symbol}: ${String(bar.timestamp ?? bar.datetime)}`);
        }
        return this.mapCandle({
            symbol,
            timestamp,
            open: bar.open,
            high: bar.high,
            low: bar.low,
            close: bar.close,
            adjustmentFactor: this.intradayAdjustmentFactor(timestamp, adjustmentFactorsBySessionDate),
            volume: bar.volume,
        });
    }
    parseEodhdUtcDatetime(datetime) {
        if (typeof datetime !== "string" || !datetime.trim()) {
            return Number.NaN;
        }
        return Date.parse(`${datetime.trim().replace(" ", "T")}Z`);
    }
    mapCandle(params) {
        const close = toFiniteNumber(params.close, "close", params.symbol);
        const adjustedClose = params.adjustedClose === undefined || params.adjustedClose === null
            ? Number.NaN
            : toFiniteNumber(params.adjustedClose, "adjusted_close", params.symbol);
        const adjustmentFactor = Number.isFinite(adjustedClose) && adjustedClose > 0 && close > 0
            ? adjustedClose / close
            : Number.isFinite(params.adjustmentFactor) && params.adjustmentFactor > 0
                ? params.adjustmentFactor
                : 1;
        return {
            timestamp: params.timestamp,
            open: roundAdjustedPrice(toFiniteNumber(params.open, "open", params.symbol) * adjustmentFactor),
            high: roundAdjustedPrice(toFiniteNumber(params.high, "high", params.symbol) * adjustmentFactor),
            low: roundAdjustedPrice(toFiniteNumber(params.low, "low", params.symbol) * adjustmentFactor),
            close: roundAdjustedPrice(close * adjustmentFactor),
            volume: toVolume(params.volume),
        };
    }
    buildUrl(path, params) {
        const url = new URL(`${this.baseUrl.replace(/\/$/, "")}${path}`);
        url.searchParams.set("api_token", this.apiToken);
        for (const [key, value] of Object.entries(params)) {
            url.searchParams.set(key, value);
        }
        return url.toString();
    }
    async fetchJson(url) {
        const response = await this.fetchFn(url);
        if (!response.ok) {
            throw new Error(`EODHD request failed with HTTP ${response.status}.`);
        }
        const payload = await response.json();
        if (!Array.isArray(payload)) {
            const message = this.extractErrorPayloadMessage(payload);
            if (message) {
                throw new Error(`EODHD returned an error payload: ${message}`);
            }
            throw new Error("EODHD returned a non-array candle payload.");
        }
        return payload;
    }
    extractErrorPayloadMessage(payload) {
        if (payload === null || typeof payload !== "object") {
            return null;
        }
        const record = payload;
        const message = record.error ?? record.message;
        return typeof message === "string" && message.trim() ? message.trim() : null;
    }
}
