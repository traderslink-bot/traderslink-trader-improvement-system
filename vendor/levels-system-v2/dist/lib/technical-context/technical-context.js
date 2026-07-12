import { buildDynamicLevelsFromCandles } from "../support-resistance/indicators/dynamic-levels.js";
function utcDate(timestamp) {
    return new Date(timestamp).toISOString().slice(0, 10);
}
function validPrice(value) {
    return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}
function pctFromPrice(price, level) {
    return level === null
        ? null
        : Number((((price - level) / Math.max(Math.abs(price), 0.0001)) * 100).toFixed(4));
}
function confidenceForTechnicalContext(params) {
    if (params.candleCount === 0 ||
        (params.vwap === null && params.ema9 === null && params.ema20 === null) ||
        params.diagnostics.includes("5m:unavailable")) {
        return "unavailable";
    }
    if (params.candleCount >= 30 &&
        params.vwap !== null &&
        params.ema9 !== null &&
        params.ema20 !== null &&
        params.diagnostics.length === 0) {
        return "high";
    }
    if (params.candleCount >= 20 &&
        params.vwap !== null &&
        params.ema9 !== null &&
        params.ema20 !== null) {
        return "medium";
    }
    return "low";
}
export function refreshTechnicalContextForPrice(context, currentPriceInput) {
    const currentPrice = validPrice(currentPriceInput);
    if (currentPrice === null) {
        return {
            ...context,
            currentPrice: null,
            priceVsVwapPct: null,
            priceVsEma9Pct: null,
            priceVsEma20Pct: null,
            aboveVwap: null,
            aboveEma9: null,
            aboveEma20: null,
        };
    }
    return {
        ...context,
        currentPrice,
        priceVsVwapPct: pctFromPrice(currentPrice, context.vwap),
        priceVsEma9Pct: pctFromPrice(currentPrice, context.ema9),
        priceVsEma20Pct: pctFromPrice(currentPrice, context.ema20),
        aboveVwap: context.vwap === null ? null : currentPrice >= context.vwap,
        aboveEma9: context.ema9 === null ? null : currentPrice >= context.ema9,
        aboveEma20: context.ema20 === null ? null : currentPrice >= context.ema20,
    };
}
export function buildTechnicalContextFromCandles(request) {
    const sorted = [...request.candles].sort((left, right) => left.timestamp - right.timestamp);
    const latestTimestamp = sorted.at(-1)?.timestamp ?? null;
    const sessionDate = request.sessionDate ?? (latestTimestamp === null ? null : utcDate(latestTimestamp));
    const sessionCandles = sessionDate === null
        ? []
        : sorted.filter((candle) => utcDate(candle.timestamp) === sessionDate);
    const currentPrice = validPrice(request.currentPrice) ?? validPrice(sessionCandles.at(-1)?.close) ?? null;
    const dynamicLevels = buildDynamicLevelsFromCandles(sessionCandles, {
        sessionDate: sessionDate ?? undefined,
        emaPeriods: [9, 20],
        currentPrice: currentPrice ?? undefined,
    });
    const diagnostics = [
        ...(request.dataQualityFlags ?? []),
        ...dynamicLevels.diagnostics.map((diagnostic) => diagnostic.code),
    ];
    const baseContext = {
        source: "levels_system_intraday",
        sourceTimeframe: "5m",
        provider: request.provider ?? null,
        sessionDate,
        updatedAt: latestTimestamp,
        candleCount: sessionCandles.length,
        currentPrice: null,
        vwap: dynamicLevels.vwap,
        ema9: dynamicLevels.ema9,
        ema20: dynamicLevels.ema20,
        priceVsVwapPct: null,
        priceVsEma9Pct: null,
        priceVsEma20Pct: null,
        aboveVwap: null,
        aboveEma9: null,
        aboveEma20: null,
        confidence: confidenceForTechnicalContext({
            candleCount: sessionCandles.length,
            vwap: dynamicLevels.vwap,
            ema9: dynamicLevels.ema9,
            ema20: dynamicLevels.ema20,
            diagnostics,
        }),
        diagnostics,
    };
    return refreshTechnicalContextForPrice(baseContext, currentPrice);
}
