const ONE_MINUTE_MS = 60_000;
const NEW_YORK_TIMEZONE = "America/New_York";
const newYorkFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: NEW_YORK_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
});
function timeframeDurationMs(timeframe) {
    switch (timeframe) {
        case "1m":
            return ONE_MINUTE_MS;
        case "5m":
            return 5 * ONE_MINUTE_MS;
        case "4h":
            return 4 * 60 * ONE_MINUTE_MS;
        case "daily":
            return 24 * 60 * ONE_MINUTE_MS;
    }
}
function newYorkParts(timestamp) {
    const parts = newYorkFormatter.formatToParts(new Date(timestamp));
    const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const year = Number(byType.year);
    const month = Number(byType.month);
    const day = Number(byType.day);
    const hour = Number(byType.hour);
    const minute = Number(byType.minute);
    const second = Number(byType.second);
    return {
        sessionDate: `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
            .toString()
            .padStart(2, "0")}`,
        year,
        month,
        day,
        hour,
        minute,
        second,
    };
}
function utcDateKey(timestamp) {
    return new Date(timestamp).toISOString().slice(0, 10);
}
function dailySessionDate(timestamp) {
    const parts = newYorkParts(timestamp);
    const utc = new Date(timestamp);
    if (utc.getUTCHours() === 0 &&
        utc.getUTCMinutes() === 0 &&
        utc.getUTCSeconds() === 0 &&
        parts.hour >= 19) {
        return utcDateKey(timestamp);
    }
    return parts.sessionDate;
}
function wallClockAsUtc(year, month, day, hour, minute, second = 0) {
    return Date.UTC(year, month - 1, day, hour, minute, second);
}
function newYorkWallClockTimestamp(sessionDate, hour, minute) {
    const [yearRaw, monthRaw, dayRaw] = sessionDate.split("-").map(Number);
    const year = yearRaw ?? 0;
    const month = monthRaw ?? 1;
    const day = dayRaw ?? 1;
    const targetWallClock = wallClockAsUtc(year, month, day, hour, minute);
    let guess = targetWallClock;
    for (let index = 0; index < 4; index += 1) {
        const parts = newYorkParts(guess);
        const observedWallClock = wallClockAsUtc(parts.year, parts.month, parts.day, parts.hour, parts.minute, parts.second);
        const delta = targetWallClock - observedWallClock;
        guess += delta;
        if (delta === 0) {
            break;
        }
    }
    return guess;
}
export function candleCloseTimestamp(candle, timeframe) {
    if (timeframe === "daily") {
        return newYorkWallClockTimestamp(dailySessionDate(candle.timestamp), 16, 0);
    }
    return candle.timestamp + timeframeDurationMs(timeframe);
}
export function candleIsClosedAsOf(candle, timeframe, asOfTimestamp) {
    return candleCloseTimestamp(candle, timeframe) <= asOfTimestamp;
}
export function filterCandlesByCloseAsOf(request) {
    const sorted = [...request.candles].sort((left, right) => left.timestamp - right.timestamp);
    if (request.asOfTimestamp === undefined || request.asOfTimestamp === null) {
        return {
            candles: sorted,
            diagnostics: [],
            excludedFutureCount: 0,
            excludedPartialCount: 0,
        };
    }
    const asOfTimestamp = request.asOfTimestamp;
    let excludedFutureCount = 0;
    let excludedPartialCount = 0;
    const filtered = [];
    for (const candle of sorted) {
        if (candle.timestamp > asOfTimestamp) {
            excludedFutureCount += 1;
            continue;
        }
        if (!candleIsClosedAsOf(candle, request.timeframe, asOfTimestamp)) {
            excludedPartialCount += 1;
            continue;
        }
        filtered.push(candle);
    }
    const diagnostics = [];
    if (excludedFutureCount > 0) {
        diagnostics.push({
            code: "future_candles_filtered",
            severity: "info",
            timeframe: request.timeframe,
            excludedCount: excludedFutureCount,
            message: `${excludedFutureCount} ${request.timeframe} candle(s) starting after the as-of timestamp were excluded ` +
                "to prevent future-candle leakage.",
        });
    }
    if (excludedPartialCount > 0) {
        diagnostics.push({
            code: "partial_candles_filtered",
            severity: "info",
            timeframe: request.timeframe,
            excludedCount: excludedPartialCount,
            message: `${excludedPartialCount} ${request.timeframe} candle(s) whose close was after the as-of timestamp were ` +
                "excluded to enforce candle-close no-lookahead semantics.",
        });
    }
    return {
        candles: filtered,
        diagnostics,
        excludedFutureCount,
        excludedPartialCount,
    };
}
