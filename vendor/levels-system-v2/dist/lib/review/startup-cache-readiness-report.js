import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
const DEFAULT_WATCHLIST_STATE_PATH = "artifacts/manual-watchlist-state.json";
const DEFAULT_CACHE_DIRECTORY = ".validation-cache/candles";
const DEFAULT_REQUIRED_CANDLES = {
    daily: 520,
    "4h": 180,
    "5m": 100,
};
const DEFAULT_MAX_AGE_MS = {
    daily: 14 * 24 * 60 * 60 * 1000,
    "4h": 7 * 24 * 60 * 60 * 1000,
    "5m": 3 * 24 * 60 * 60 * 1000,
};
const TIMEFRAMES = ["daily", "4h", "5m"];
function normalizeSymbol(value) {
    if (typeof value !== "string") {
        return null;
    }
    const normalized = value.trim().toUpperCase();
    return normalized.length > 0 ? normalized : null;
}
function loadWatchlistEntries(path) {
    try {
        const parsed = JSON.parse(readFileSync(path, "utf8"));
        return Array.isArray(parsed.entries) ? parsed.entries : [];
    }
    catch {
        return [];
    }
}
function walkJsonFiles(directoryPath) {
    if (!existsSync(directoryPath)) {
        return [];
    }
    const files = [];
    for (const entry of readdirSync(directoryPath, { withFileTypes: true })) {
        const path = join(directoryPath, entry.name);
        if (entry.isDirectory()) {
            files.push(...walkJsonFiles(path));
        }
        else if (entry.isFile() && entry.name.endsWith(".json")) {
            files.push(path);
        }
    }
    return files;
}
function extractCandles(path) {
    try {
        const parsed = JSON.parse(readFileSync(path, "utf8"));
        const candles = parsed.response?.candles ?? parsed.candles ?? [];
        return candles.filter((candle) => [candle.timestamp, candle.open, candle.high, candle.low, candle.close, candle.volume].every((value) => typeof value === "number" && Number.isFinite(value)));
    }
    catch {
        return [];
    }
}
function loadCachedCandles(params) {
    const directory = join(params.cacheDirectoryPath, params.provider, params.symbol, params.timeframe);
    const byTimestamp = new Map();
    for (const file of walkJsonFiles(directory)) {
        for (const candle of extractCandles(file)) {
            byTimestamp.set(candle.timestamp, candle);
        }
    }
    return [...byTimestamp.values()].sort((left, right) => left.timestamp - right.timestamp);
}
function buildTimeframeReadiness(params) {
    const earliestTimestamp = params.candles.at(0)?.timestamp ?? null;
    const latestTimestamp = params.candles.at(-1)?.timestamp ?? null;
    const latestAgeMinutes = latestTimestamp === null
        ? null
        : Number(((params.now - latestTimestamp) / 60_000).toFixed(1));
    return {
        timeframe: params.timeframe,
        candleCount: params.candles.length,
        requiredCount: params.requiredCount,
        earliestTimestamp,
        latestTimestamp,
        latestAgeMinutes,
        enoughCandles: params.candles.length >= params.requiredCount,
        stale: latestTimestamp === null || params.now - latestTimestamp > params.maxAgeMs,
    };
}
function classifySymbol(params) {
    if (!params.active) {
        return {
            status: "inactive",
            reason: "symbol is not active in the persisted watchlist",
            canRestoreLevelsFromCache: false,
        };
    }
    const rows = TIMEFRAMES.map((timeframe) => params.timeframes[timeframe]);
    if (rows.every((row) => row.enoughCandles && !row.stale)) {
        return {
            status: "ready_for_fast_restore",
            reason: "all required startup candle groups are cached and fresh enough for fast level restore",
            canRestoreLevelsFromCache: true,
        };
    }
    if (rows.every((row) => row.enoughCandles)) {
        return {
            status: "usable_but_stale",
            reason: "all required candle groups are cached, but at least one group is stale; restore can warm the UI, Discord snapshot still waits for fresh candles",
            canRestoreLevelsFromCache: true,
        };
    }
    if (rows.some((row) => row.candleCount > 0)) {
        return {
            status: "partial_cache",
            reason: "some candles exist but one or more required groups are missing or below the startup lookback",
            canRestoreLevelsFromCache: false,
        };
    }
    return {
        status: "blocked",
        reason: "no usable startup candle cache was found for the symbol",
        canRestoreLevelsFromCache: false,
    };
}
export function buildStartupCacheReadinessReport(options = {}) {
    const now = options.now ?? Date.now();
    const watchlistStatePath = resolve(options.watchlistStatePath ?? DEFAULT_WATCHLIST_STATE_PATH);
    const cacheDirectoryPath = options.cacheDirectoryPath ?? DEFAULT_CACHE_DIRECTORY;
    const provider = options.provider ?? "ibkr";
    const requiredCandles = {
        ...DEFAULT_REQUIRED_CANDLES,
        ...options.requiredCandles,
    };
    const maxAgeMs = {
        ...DEFAULT_MAX_AGE_MS,
        ...options.maxAgeMs,
    };
    const entries = loadWatchlistEntries(watchlistStatePath)
        .map((entry) => ({
        symbol: normalizeSymbol(entry.symbol),
        active: entry.active === true,
        lifecycle: typeof entry.lifecycle === "string" ? entry.lifecycle : null,
        hasDiscordThread: typeof entry.discordThreadId === "string" && entry.discordThreadId.trim().length > 0,
    }))
        .filter((entry) => entry.symbol !== null && ((options.activeOnly ?? true) === false || entry.active))
        .sort((left, right) => left.symbol.localeCompare(right.symbol));
    const symbols = entries.map((entry) => {
        const timeframes = Object.fromEntries(TIMEFRAMES.map((timeframe) => {
            const candles = loadCachedCandles({ cacheDirectoryPath, provider, symbol: entry.symbol, timeframe });
            return [
                timeframe,
                buildTimeframeReadiness({
                    candles,
                    timeframe,
                    requiredCount: requiredCandles[timeframe],
                    maxAgeMs: maxAgeMs[timeframe],
                    now,
                }),
            ];
        }));
        const classification = classifySymbol({ active: entry.active, timeframes });
        return {
            symbol: entry.symbol,
            active: entry.active,
            lifecycle: entry.lifecycle,
            hasDiscordThread: entry.hasDiscordThread,
            ...classification,
            timeframes,
            discordSnapshotPolicy: classification.canRestoreLevelsFromCache
                ? "wait_for_fresh_refresh"
                : "do_not_post_from_cache",
            freshRefreshRequiredBeforeDiscordSnapshot: true,
        };
    });
    return {
        generatedAt: new Date(now).toISOString(),
        watchlistStatePath,
        cacheDirectoryPath,
        provider,
        requiredCandles,
        totals: {
            symbols: symbols.length,
            activeSymbols: symbols.filter((symbol) => symbol.active).length,
            readyForFastRestore: symbols.filter((symbol) => symbol.status === "ready_for_fast_restore").length,
            usableButStale: symbols.filter((symbol) => symbol.status === "usable_but_stale").length,
            partialCache: symbols.filter((symbol) => symbol.status === "partial_cache").length,
            blocked: symbols.filter((symbol) => symbol.status === "blocked").length,
            inactive: symbols.filter((symbol) => symbol.status === "inactive").length,
        },
        symbols,
    };
}
function formatTimestamp(timestamp) {
    return timestamp === null ? "n/a" : new Date(timestamp).toISOString();
}
export function formatStartupCacheReadinessMarkdown(report) {
    const lines = [
        "# Startup Cache Readiness Report",
        "",
        "Operator-only report. It checks whether active watchlist symbols have enough cached daily, 4h, and 5m candles to restore levels quickly on restart. Cached levels can warm the UI, but Discord snapshots still wait for fresh candle refresh.",
        "",
        `Generated: ${report.generatedAt}`,
        `Watchlist state: ${report.watchlistStatePath}`,
        `Cache: ${report.cacheDirectoryPath}`,
        `Provider: ${report.provider}`,
        "",
        "## Totals",
        "",
        `- symbols: ${report.totals.symbols}`,
        `- active symbols: ${report.totals.activeSymbols}`,
        `- ready for fast restore: ${report.totals.readyForFastRestore}`,
        `- usable but stale: ${report.totals.usableButStale}`,
        `- partial cache: ${report.totals.partialCache}`,
        `- blocked: ${report.totals.blocked}`,
        `- inactive: ${report.totals.inactive}`,
        "",
        "## Symbol Evidence",
        "",
    ];
    for (const symbol of report.symbols) {
        lines.push(`### ${symbol.symbol} - ${symbol.status}`, "", `- reason: ${symbol.reason}`, `- active: ${symbol.active}; lifecycle: ${symbol.lifecycle ?? "n/a"}; Discord thread: ${symbol.hasDiscordThread}`, `- restore from cache: ${symbol.canRestoreLevelsFromCache}; Discord snapshot policy: ${symbol.discordSnapshotPolicy}; fresh refresh required before Discord snapshot: ${symbol.freshRefreshRequiredBeforeDiscordSnapshot}`);
        for (const timeframe of TIMEFRAMES) {
            const row = symbol.timeframes[timeframe];
            lines.push(`- ${timeframe}: ${row.candleCount}/${row.requiredCount}; latest ${formatTimestamp(row.latestTimestamp)}; age minutes ${row.latestAgeMinutes ?? "n/a"}; stale ${row.stale}`);
        }
        lines.push("");
    }
    return `${lines.join("\n")}\n`;
}
export function writeStartupCacheReadinessReport(options) {
    const report = buildStartupCacheReadinessReport(options);
    mkdirSync(dirname(resolve(options.jsonPath)), { recursive: true });
    mkdirSync(dirname(resolve(options.markdownPath)), { recursive: true });
    writeFileSync(options.jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    writeFileSync(options.markdownPath, formatStartupCacheReadinessMarkdown(report), "utf8");
    return report;
}
