// 2026-05-13 America/Toronto
// Runtime bridge from live price ticks into confirmed formal BOS/CHOCH structure.
import { buildFormalMarketStructureContext, } from "../structure/index.js";
const DEFAULT_BUCKET_MS = 5 * 60 * 1000;
const DEFAULT_MIN_CANDLES = 24;
const DEFAULT_MAX_CANDLES = 144;
function bucketStart(timestamp, bucketMs) {
    return Math.floor(timestamp / bucketMs) * bucketMs;
}
function roundKeyPrice(value) {
    if (value === null || value === undefined || !Number.isFinite(value))
        return "none";
    return value >= 10 ? value.toFixed(2) : value >= 1 ? value.toFixed(3) : value.toFixed(4);
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
function eventKey(context) {
    const event = context.latestEvent;
    return [
        context.timeframe,
        event.type,
        event.biasAfter,
        event.brokenSwingId ?? "none",
        event.sweptSwingId ?? "none",
        roundKeyPrice(event.brokenSwingPrice ?? event.sweptSwingPrice),
    ].join("|");
}
function structureKey(context) {
    const event = context.latestEvent;
    if (event.type !== "none") {
        return eventKey(context);
    }
    return [
        context.timeframe,
        context.bias,
        `protectedHigh:${roundKeyPrice(context.protectedHigh?.price)}`,
        `protectedLow:${roundKeyPrice(context.protectedLow?.price)}`,
        `latestHigh:${roundKeyPrice(context.latestHigh?.price)}`,
        `latestLow:${roundKeyPrice(context.latestLow?.price)}`,
    ].join("|");
}
function isMaterialEvent(eventType, confidence) {
    if (eventType === "none" || confidence === "low")
        return false;
    if (eventType === "bos_bullish" ||
        eventType === "bos_bearish" ||
        eventType === "choch_bullish" ||
        eventType === "choch_bearish") {
        return true;
    }
    return confidence === "high";
}
function eventFreshness(eventType, materialChange) {
    if (eventType === "none") {
        return "context";
    }
    return materialChange ? "fresh" : "prior";
}
function buildRuntimeContext(context, materialChange) {
    const event = context.latestEvent;
    return {
        timeframe: context.timeframe,
        bias: context.bias,
        previousBias: context.previousBias,
        eventType: event.type,
        eventFreshness: eventFreshness(event.type, materialChange),
        triggerTimestamp: event.triggerTimestamp,
        confirmation: event.confirmation,
        confidence: event.confidence,
        confidenceScore: event.confidenceScore,
        materialChange,
        brokenSwingPrice: event.brokenSwingPrice,
        sweptSwingPrice: event.sweptSwingPrice,
        protectedHigh: context.protectedHigh?.price ?? event.protectedHighPrice,
        protectedLow: context.protectedLow?.price ?? event.protectedLowPrice,
        latestHigh: context.latestHigh?.price ?? null,
        latestLow: context.latestLow?.price ?? null,
        swingSequence: context.swings.slice(-8).map((swing) => swing.label),
        structureKey: structureKey(context),
        traderLine: event.traderLine,
        debug: {
            candleCount: context.candleCount,
            reasons: [...event.reasonCodes, ...context.diagnostics.map((diagnostic) => diagnostic.code)],
        },
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
export class LiveFormalMarketStructureTracker {
    options;
    bucketMs;
    minCandles;
    maxCandles;
    timeframe;
    states = new Map();
    constructor(options = {}) {
        this.options = options;
        this.bucketMs = options.bucketMs ?? DEFAULT_BUCKET_MS;
        this.timeframe = options.timeframe ?? "5m";
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
        state.completedCandles = completedCandles;
        state.currentCandle = undefined;
        state.lastCumulativeVolume = undefined;
        if (completedCandles.length < this.minCandles) {
            return state.context;
        }
        const context = buildFormalMarketStructureContext({
            symbol,
            candles: completedCandles,
            timeframe: this.timeframe,
            options: {
                minCandles: this.minCandles,
                internalLeftBars: this.options.internalLeftBars,
                internalRightBars: this.options.internalRightBars,
                externalLeftBars: this.options.externalLeftBars,
                externalRightBars: this.options.externalRightBars,
                equalLevelTolerancePct: this.options.equalLevelTolerancePct,
                displacementRangeMultiplier: this.options.displacementRangeMultiplier,
                followThroughBars: this.options.followThroughBars,
            },
        });
        if (isMaterialEvent(context.latestEvent.type, context.latestEvent.confidence)) {
            state.lastAcceptedEventKey = eventKey(context);
        }
        state.context = buildRuntimeContext(context, false);
        return state.context;
    }
    update(update) {
        if (!Number.isFinite(update.timestamp) || !Number.isFinite(update.lastPrice) || update.lastPrice <= 0) {
            return this.getContext(update.symbol);
        }
        const symbol = update.symbol.toUpperCase();
        const state = this.ensureState(symbol);
        const start = bucketStart(update.timestamp, this.bucketMs);
        const deltaVolume = volumeDelta(update, state);
        if (!state.currentCandle) {
            state.currentCandle = this.buildNewCandle(start, update.lastPrice, deltaVolume);
            return state.context;
        }
        if (start > state.currentCandle.timestamp) {
            state.completedCandles.push(state.currentCandle);
            state.completedCandles = state.completedCandles.slice(-this.maxCandles);
            state.currentCandle = this.buildNewCandle(start, update.lastPrice, deltaVolume);
            return this.recomputeConfirmed(symbol, state);
        }
        if (start < state.currentCandle.timestamp) {
            return state.context;
        }
        state.currentCandle.high = Math.max(state.currentCandle.high, update.lastPrice);
        state.currentCandle.low = Math.min(state.currentCandle.low, update.lastPrice);
        state.currentCandle.close = update.lastPrice;
        state.currentCandle.volume += deltaVolume;
        return state.context;
    }
    recomputeConfirmed(symbol, state) {
        const candles = state.completedCandles.slice(-this.maxCandles);
        if (candles.length < this.minCandles) {
            return state.context;
        }
        const context = buildFormalMarketStructureContext({
            symbol,
            candles,
            timeframe: this.timeframe,
            options: {
                minCandles: this.minCandles,
                internalLeftBars: this.options.internalLeftBars,
                internalRightBars: this.options.internalRightBars,
                externalLeftBars: this.options.externalLeftBars,
                externalRightBars: this.options.externalRightBars,
                equalLevelTolerancePct: this.options.equalLevelTolerancePct,
                displacementRangeMultiplier: this.options.displacementRangeMultiplier,
                followThroughBars: this.options.followThroughBars,
            },
        });
        const key = eventKey(context);
        const materialCandidate = isMaterialEvent(context.latestEvent.type, context.latestEvent.confidence);
        const materialChange = materialCandidate && key !== state.lastAcceptedEventKey;
        if (materialChange) {
            state.lastAcceptedEventKey = key;
        }
        const runtimeContext = buildRuntimeContext(context, materialChange);
        state.context = materialChange
            ? { ...runtimeContext, materialChange: false, eventFreshness: "prior" }
            : runtimeContext;
        return runtimeContext;
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
