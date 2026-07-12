import { classifyCandleSessions } from "../market-data/candle-session-classifier.js";
function sortCandles(candles) {
    return [...candles].sort((left, right) => left.timestamp - right.timestamp);
}
function utcDate(timestamp) {
    return new Date(timestamp).toISOString().slice(0, 10);
}
function high(candles) {
    return candles.length === 0 ? null : Math.max(...candles.map((candle) => candle.high));
}
function low(candles) {
    return candles.length === 0 ? null : Math.min(...candles.map((candle) => candle.low));
}
function midpoint(left, right) {
    return left === null || right === null ? null : Number(((left + right) / 2).toFixed(4));
}
function inferSessionDate(params) {
    if (params.supplied) {
        return params.supplied;
    }
    const annotated = classifyCandleSessions(params.intradayCandles, "5m")
        .filter((item) => item.session === "opening_range" || item.session === "regular");
    const latestAnnotatedDate = annotated.at(-1)?.sessionDate;
    if (latestAnnotatedDate) {
        return latestAnnotatedDate;
    }
    const latestDaily = params.dailyCandles.at(-1);
    return latestDaily ? utcDate(latestDaily.timestamp) : null;
}
export function buildReferenceLevels(request) {
    const dailyCandles = sortCandles(request.dailyCandles);
    const intradayCandles = sortCandles(request.intradayCandles ?? []);
    const diagnostics = [];
    const sessionDate = inferSessionDate({
        supplied: request.sessionDate,
        intradayCandles,
        dailyCandles,
    });
    if (dailyCandles.length === 0) {
        diagnostics.push({
            code: "missing_daily_candles",
            message: "Daily candles are required to derive previous-day reference levels.",
        });
    }
    if (intradayCandles.length === 0) {
        diagnostics.push({
            code: "missing_intraday_candles",
            message: "Intraday candles are required to derive premarket, opening-range, and current-session references.",
        });
    }
    const previousDaily = sessionDate === null
        ? dailyCandles.at(-2) ?? null
        : [...dailyCandles].reverse().find((candle) => utcDate(candle.timestamp) < sessionDate) ?? null;
    if (!previousDaily) {
        diagnostics.push({
            code: "missing_previous_day",
            message: "Previous-day candle was not available before the requested session date.",
        });
    }
    const annotated = classifyCandleSessions(intradayCandles, "5m")
        .filter((item) => sessionDate === null || item.sessionDate === sessionDate);
    const premarket = annotated.filter((item) => item.session === "premarket").map((item) => item.candle);
    const openingRange = annotated.filter((item) => item.session === "opening_range").map((item) => item.candle);
    const currentSession = annotated
        .filter((item) => item.session === "opening_range" || item.session === "regular")
        .map((item) => item.candle);
    if (premarket.length === 0) {
        diagnostics.push({
            code: "missing_premarket",
            message: "Premarket candles were not available for the requested session.",
        });
    }
    if (openingRange.length === 0) {
        diagnostics.push({
            code: "missing_opening_range",
            message: "Opening-range candles were not available for the requested session.",
        });
    }
    if (currentSession.length === 0) {
        diagnostics.push({
            code: "missing_current_session",
            message: "Current-session regular candles were not available for the requested session.",
        });
    }
    const premarketHigh = high(premarket);
    const premarketLow = low(premarket);
    return {
        sessionDate,
        previousDayHigh: previousDaily?.high ?? null,
        previousDayLow: previousDaily?.low ?? null,
        previousDayClose: previousDaily?.close ?? null,
        premarketHigh,
        premarketLow,
        premarketBase: midpoint(premarketHigh, premarketLow),
        openingRangeHigh: high(openingRange),
        openingRangeLow: low(openingRange),
        currentSessionHigh: high(currentSession),
        currentSessionLow: low(currentSession),
        diagnostics,
    };
}
