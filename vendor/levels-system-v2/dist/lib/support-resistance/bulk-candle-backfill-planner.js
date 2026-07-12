import { parseSharedCandleTimestamp, } from "./build-support-resistance-context.js";
const ONE_MINUTE_MS = 60_000;
const DEFAULT_TIMEFRAMES = [
    { timeframe: "daily", lookbackBars: 520 },
    { timeframe: "4h", lookbackBars: 180 },
    { timeframe: "5m", preTradeMinutes: 720, postTradeMinutes: 120 },
    { timeframe: "1m", preTradeMinutes: 120, postTradeMinutes: 120 },
];
function normalizeSymbol(symbol) {
    const normalized = symbol.trim().toUpperCase();
    if (!normalized) {
        throw new Error("symbol is required.");
    }
    return normalized;
}
function timeframeMs(timeframe) {
    if (timeframe === "1m") {
        return ONE_MINUTE_MS;
    }
    if (timeframe === "5m") {
        return 5 * ONE_MINUTE_MS;
    }
    if (timeframe === "4h") {
        return 4 * 60 * ONE_MINUTE_MS;
    }
    return 24 * 60 * ONE_MINUTE_MS;
}
function parseOptionalTimestamp(value) {
    return value === undefined ? null : parseSharedCandleTimestamp(value);
}
function resolveTradeBounds(trade) {
    const executionTimes = (trade.executions ?? [])
        .map((execution) => parseSharedCandleTimestamp(execution.timestamp))
        .sort((left, right) => left - right);
    const explicitStart = parseOptionalTimestamp(trade.tradeStartTimestamp);
    const explicitEnd = parseOptionalTimestamp(trade.tradeEndTimestamp);
    const asOf = parseOptionalTimestamp(trade.asOfTimestamp);
    const start = explicitStart ?? executionTimes[0] ?? asOf;
    const end = explicitEnd ?? executionTimes.at(-1) ?? start;
    if (start === null || end === null) {
        throw new Error(`Trade for ${trade.symbol} needs executions, explicit trade timestamps, or asOfTimestamp.`);
    }
    return {
        start,
        end: Math.max(start, end),
        asOf,
    };
}
function rangeForTimeframe(bounds, config) {
    const intervalMs = timeframeMs(config.timeframe);
    const endBase = bounds.asOf ?? bounds.end;
    if (config.lookbackBars && config.lookbackBars > 0) {
        const endTimestamp = Math.floor(endBase / intervalMs) * intervalMs;
        return {
            startTimestamp: endTimestamp - config.lookbackBars * intervalMs,
            endTimestamp,
        };
    }
    const pre = Math.max(0, config.preTradeMinutes ?? 0) * ONE_MINUTE_MS;
    const post = Math.max(0, config.postTradeMinutes ?? 0) * ONE_MINUTE_MS;
    const unclampedEnd = bounds.end + post;
    const endTimestamp = Math.floor(Math.min(unclampedEnd, bounds.asOf ?? unclampedEnd) / intervalMs) * intervalMs;
    return {
        startTimestamp: Math.floor((bounds.start - pre) / intervalMs) * intervalMs,
        endTimestamp,
    };
}
export async function planBulkCandleBackfill(request) {
    const timeframes = request.timeframes ?? DEFAULT_TIMEFRAMES;
    const grouped = new Map();
    for (const trade of request.trades) {
        const symbol = normalizeSymbol(trade.symbol);
        const bounds = resolveTradeBounds(trade);
        for (const timeframe of timeframes) {
            const range = rangeForTimeframe(bounds, timeframe);
            const key = `${symbol}:${timeframe.timeframe}`;
            const existing = grouped.get(key);
            if (!existing) {
                grouped.set(key, {
                    symbol,
                    timeframe: timeframe.timeframe,
                    startTimestamp: range.startTimestamp,
                    endTimestamp: range.endTimestamp,
                    tradeCount: 1,
                });
                continue;
            }
            existing.startTimestamp = Math.min(existing.startTimestamp, range.startTimestamp);
            existing.endTimestamp = Math.max(existing.endTimestamp, range.endTimestamp);
            existing.tradeCount += 1;
        }
    }
    const items = [];
    for (const item of grouped.values()) {
        const existingCandles = request.warehouse
            ? (await request.warehouse.getCoverage({
                provider: request.provider,
                symbol: item.symbol,
                timeframe: item.timeframe,
                startTimestamp: item.startTimestamp,
                endTimestamp: item.endTimestamp,
            })).candleCount
            : 0;
        const missingRanges = request.warehouse
            ? await request.warehouse.findMissingRanges({
                provider: request.provider,
                symbol: item.symbol,
                timeframe: item.timeframe,
                startTimestamp: item.startTimestamp,
                endTimestamp: item.endTimestamp,
            })
            : [{ startTimestamp: item.startTimestamp, endTimestamp: item.endTimestamp }];
        items.push({
            provider: request.provider,
            ...item,
            existingCandles,
            missingRanges,
        });
    }
    const uniqueSymbols = [...new Set(items.map((item) => item.symbol))].sort();
    return {
        generatedAt: new Date().toISOString(),
        provider: request.provider,
        tradeCount: request.trades.length,
        uniqueSymbols,
        items: items.sort((left, right) => left.symbol.localeCompare(right.symbol) || left.timeframe.localeCompare(right.timeframe)),
        estimatedFetchCount: items.reduce((count, item) => count + item.missingRanges.length, 0),
    };
}
