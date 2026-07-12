// 2026-05-02 America/Toronto
// Runtime bridge from live price ticks into stable 5-minute candle market-structure facts.
import { buildStableMarketStructureContext, } from "../structure/index.js";
const DEFAULT_BUCKET_MS = 5 * 60 * 1000;
const DEFAULT_MIN_CANDLES = 12;
const DEFAULT_MAX_CANDLES = 96;
function bucketStart(timestamp, bucketMs) {
    return Math.floor(timestamp / bucketMs) * bucketMs;
}
function roundPrice(value) {
    if (value >= 10) {
        return value.toFixed(2);
    }
    if (value >= 1) {
        return value.toFixed(3);
    }
    return value.toFixed(4);
}
function volumeDelta(update, state) {
    const volume = update.volume;
    if (!Number.isFinite(volume) || volume === undefined || volume < 0) {
        return 0;
    }
    if (state.lastCumulativeVolume === undefined) {
        state.lastCumulativeVolume = volume;
        return 0;
    }
    if (volume < state.lastCumulativeVolume) {
        state.lastCumulativeVolume = volume;
        return 0;
    }
    const delta = volume - state.lastCumulativeVolume;
    state.lastCumulativeVolume = volume;
    return Number.isFinite(delta) && delta > 0 ? delta : 0;
}
function buildStructureKey(decision) {
    const context = decision.context;
    const range = context.range;
    if (range?.active) {
        return `${decision.stableState}|range:${roundPrice(range.low)}-${roundPrice(range.high)}`;
    }
    const latestLow = context.pivots.latestSwingLow?.price;
    const latestHigh = context.pivots.latestSwingHigh?.price;
    if (latestLow !== undefined || latestHigh !== undefined) {
        return `${decision.stableState}|low:${latestLow !== undefined ? roundPrice(latestLow) : "none"}|high:${latestHigh !== undefined ? roundPrice(latestHigh) : "none"}`;
    }
    return `${decision.stableState}|candles:${decision.context.asOfTimestamp ?? decision.timestamp}`;
}
function buildRuntimeContext(decision, candleCount) {
    const previousState = decision.previousStableState;
    return {
        state: decision.stableState,
        previousState,
        structureKey: buildStructureKey(decision),
        materialChange: decision.accepted &&
            previousState !== null &&
            previousState !== decision.stableState,
        confidence: decision.context.confidence.label,
        materialityScore: decision.materialityScore,
        rawState: decision.rawState,
        reason: decision.reason,
        candleCount,
        rawRunLength: decision.rawRunLength,
        trendDirection: decision.context.trend.direction,
        higherLowCount: decision.context.trend.higherLowCount,
        lowerHighCount: decision.context.trend.lowerHighCount,
        higherHighCount: decision.context.trend.higherHighCount,
        lowerLowCount: decision.context.trend.lowerLowCount,
        latestSwingLow: decision.context.pivots.latestSwingLow?.price,
        latestSwingHigh: decision.context.pivots.latestSwingHigh?.price,
        priorSwingLow: decision.context.pivots.priorSwingLow?.price,
        priorSwingHigh: decision.context.pivots.priorSwingHigh?.price,
        activeRangeLow: decision.context.range?.active ? decision.context.range.low : undefined,
        activeRangeHigh: decision.context.range?.active ? decision.context.range.high : undefined,
        activeRangeWidthPct: decision.context.range?.active ? decision.context.range.widthPct : undefined,
        activeRangeQuality: decision.context.range?.active ? decision.context.range.quality : undefined,
        pivotEventType: decision.context.pivotEvent?.type,
        pivotEventTriggerPrice: decision.context.pivotEvent?.triggerPrice,
    };
}
function normalizeSeedCandles(candles, asOfTimestamp, bucketMs) {
    const completedCutoff = bucketStart(asOfTimestamp, bucketMs);
    const byTimestamp = new Map();
    for (const candle of candles) {
        if (!Number.isFinite(candle.timestamp) ||
            !Number.isFinite(candle.open) ||
            !Number.isFinite(candle.high) ||
            !Number.isFinite(candle.low) ||
            !Number.isFinite(candle.close) ||
            candle.open <= 0 ||
            candle.high <= 0 ||
            candle.low <= 0 ||
            candle.close <= 0 ||
            candle.high < candle.low ||
            candle.timestamp >= completedCutoff) {
            continue;
        }
        byTimestamp.set(candle.timestamp, { ...candle });
    }
    return [...byTimestamp.values()].sort((left, right) => left.timestamp - right.timestamp);
}
export class LiveStableMarketStructureTracker {
    options;
    bucketMs;
    minCandles;
    maxCandles;
    states = new Map();
    constructor(options = {}) {
        this.options = options;
        this.bucketMs = options.bucketMs ?? DEFAULT_BUCKET_MS;
        this.minCandles = Math.max(6, options.minCandles ?? DEFAULT_MIN_CANDLES);
        this.maxCandles = Math.max(this.minCandles, options.maxCandles ?? DEFAULT_MAX_CANDLES);
    }
    reset(symbol) {
        this.states.delete(symbol.toUpperCase());
    }
    getContext(symbol) {
        return this.states.get(symbol.toUpperCase())?.context;
    }
    seed(symbolInput, candles, asOfTimestamp = Date.now()) {
        const symbol = symbolInput.toUpperCase();
        const state = this.ensureState(symbol);
        const completedCandles = normalizeSeedCandles(candles, asOfTimestamp, this.bucketMs)
            .slice(-this.maxCandles);
        if (completedCandles.length === 0) {
            return state.context;
        }
        const currentBucket = bucketStart(asOfTimestamp, this.bucketMs);
        const currentCandle = state.currentCandle && state.currentCandle.timestamp >= currentBucket
            ? state.currentCandle
            : undefined;
        state.completedCandles = completedCandles;
        state.currentCandle = currentCandle;
        state.lastCumulativeVolume = undefined;
        const context = this.recompute(symbol, state);
        if (context) {
            state.context = {
                ...context,
                materialChange: false,
            };
        }
        return state.context;
    }
    update(update) {
        if (!Number.isFinite(update.timestamp) ||
            !Number.isFinite(update.lastPrice) ||
            update.lastPrice <= 0) {
            return this.getContext(update.symbol);
        }
        const symbol = update.symbol.toUpperCase();
        const state = this.ensureState(symbol);
        const start = bucketStart(update.timestamp, this.bucketMs);
        const deltaVolume = volumeDelta(update, state);
        if (!state.currentCandle) {
            state.currentCandle = this.buildNewCandle(start, update.lastPrice, deltaVolume);
            return this.recompute(symbol, state);
        }
        if (start > state.currentCandle.timestamp) {
            state.completedCandles.push(state.currentCandle);
            state.completedCandles = state.completedCandles.slice(-this.maxCandles);
            state.currentCandle = this.buildNewCandle(start, update.lastPrice, deltaVolume);
            return this.recompute(symbol, state);
        }
        if (start < state.currentCandle.timestamp) {
            return state.context;
        }
        state.currentCandle.high = Math.max(state.currentCandle.high, update.lastPrice);
        state.currentCandle.low = Math.min(state.currentCandle.low, update.lastPrice);
        state.currentCandle.close = update.lastPrice;
        state.currentCandle.volume += deltaVolume;
        return this.recompute(symbol, state);
    }
    recompute(symbol, state) {
        const candles = [
            ...state.completedCandles,
            ...(state.currentCandle ? [state.currentCandle] : []),
        ].slice(-this.maxCandles);
        if (candles.length < this.minCandles) {
            return state.context;
        }
        const stable = buildStableMarketStructureContext({
            symbol,
            candles,
            minCandles: this.minCandles,
            persistenceBars: this.options.persistenceBars,
            materialityThreshold: this.options.materialityThreshold,
            highMaterialityThreshold: this.options.highMaterialityThreshold,
        });
        if (!stable.current) {
            return state.context;
        }
        state.context = buildRuntimeContext(stable.current, candles.length);
        return state.context;
    }
    buildNewCandle(timestamp, price, volume) {
        return {
            timestamp,
            open: price,
            high: price,
            low: price,
            close: price,
            volume,
        };
    }
    ensureState(symbol) {
        const normalized = symbol.toUpperCase();
        const existing = this.states.get(normalized);
        if (existing) {
            return existing;
        }
        const created = {
            completedCandles: [],
        };
        this.states.set(normalized, created);
        return created;
    }
}
