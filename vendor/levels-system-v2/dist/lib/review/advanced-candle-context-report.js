import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { buildSupportResistanceContextFromCandles, } from "../support-resistance/index.js";
const DEFAULT_CACHE_DIRECTORY = ".validation-cache/candles";
function walkJsonFiles(directoryPath) {
    if (!existsSync(directoryPath)) {
        return [];
    }
    const output = [];
    for (const entry of readdirSync(directoryPath, { withFileTypes: true })) {
        const path = join(directoryPath, entry.name);
        if (entry.isDirectory()) {
            output.push(...walkJsonFiles(path));
        }
        else if (entry.isFile() && entry.name.endsWith(".json")) {
            output.push(path);
        }
    }
    return output;
}
function walkJsonlFiles(directoryPath) {
    if (!existsSync(directoryPath)) {
        return [];
    }
    const output = [];
    for (const entry of readdirSync(directoryPath, { withFileTypes: true })) {
        const path = join(directoryPath, entry.name);
        if (entry.isDirectory()) {
            output.push(...walkJsonlFiles(path));
        }
        else if (entry.isFile() && entry.name.endsWith(".jsonl")) {
            output.push(path);
        }
    }
    return output;
}
function parseEntry(path) {
    try {
        return JSON.parse(readFileSync(path, "utf8"));
    }
    catch {
        return null;
    }
}
function readWarehouseCandles(path) {
    return readFileSync(path, "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .flatMap((line) => {
        try {
            return [JSON.parse(line)];
        }
        catch {
            return [];
        }
    })
        .filter((candle) => [candle.timestamp, candle.open, candle.high, candle.low, candle.close, candle.volume].every((value) => typeof value === "number" && Number.isFinite(value)));
}
function extractCandles(entry) {
    const candles = entry?.response?.candles ?? entry?.candles ?? [];
    return candles.filter((candle) => [candle.timestamp, candle.open, candle.high, candle.low, candle.close, candle.volume].every((value) => typeof value === "number" && Number.isFinite(value)));
}
function loadCandles(params) {
    const directory = join(params.cacheDirectoryPath, params.provider, params.symbol, params.timeframe);
    const byTimestamp = new Map();
    for (const file of walkJsonFiles(directory)) {
        for (const candle of extractCandles(parseEntry(file))) {
            byTimestamp.set(candle.timestamp, candle);
        }
    }
    for (const file of walkJsonlFiles(directory)) {
        for (const candle of readWarehouseCandles(file)) {
            byTimestamp.set(candle.timestamp, candle);
        }
    }
    return [...byTimestamp.values()].sort((left, right) => left.timestamp - right.timestamp);
}
function providerSymbols(cacheDirectoryPath, provider) {
    const root = join(cacheDirectoryPath, provider);
    if (!existsSync(root)) {
        return [];
    }
    return readdirSync(root, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name.toUpperCase())
        .sort();
}
function supportCount(context) {
    return context.levels.majorSupport.length +
        context.levels.intermediateSupport.length +
        context.levels.intradaySupport.length +
        context.levels.extensionLevels.support.length;
}
function resistanceCount(context) {
    return context.levels.majorResistance.length +
        context.levels.intermediateResistance.length +
        context.levels.intradayResistance.length +
        context.levels.extensionLevels.resistance.length;
}
function referenceCount(referenceLevels) {
    return Object.values(referenceLevels).filter((value) => typeof value === "number" && Number.isFinite(value)).length;
}
function gapLabel(gap) {
    if (!gap) {
        return null;
    }
    return `${gap.direction} ${gap.start.toFixed(4)}-${gap.end.toFixed(4)} ${gap.filled ? "filled" : "open"}`;
}
function blockedSymbol(symbol, daily, fourHour, fiveMinute) {
    const missingFacts = [
        daily.length === 0 ? "daily" : null,
        fourHour.length === 0 ? "4h" : null,
        fiveMinute.length === 0 ? "5m" : null,
    ].filter((value) => value !== null);
    const missing = missingFacts.join(", ");
    return {
        symbol,
        status: daily.length === 0 && fourHour.length === 0 && fiveMinute.length === 0 ? "blocked" : "partial",
        reason: `missing required candle timeframe(s): ${missing || "n/a"}`,
        candleCounts: { daily: daily.length, "4h": fourHour.length, "5m": fiveMinute.length },
        currentPrice: fiveMinute.at(-1)?.close ?? daily.at(-1)?.close ?? null,
        supportCount: null,
        resistanceCount: null,
        referenceLevelsAvailable: 0,
        gapCount: null,
        nearestGapAbove: null,
        nearestGapBelow: null,
        dynamicAvailability: { vwap: false, ema9: false, ema20: false },
        marketStructure: { state: null, confidence: null, traderLine: null },
        traderContext: {
            sessionGap: null,
            candleReaction: null,
            moveExtension: null,
            openingRange: null,
            haltAwareness: null,
            levelQuality: null,
            dataQuality: null,
            dataQualityScore: null,
            dataQualityReasons: [`missing required candle timeframe(s): ${missing || "n/a"}`],
            dataQualityPrimaryCause: "candle_coverage",
            missingFacts: missingFacts.map((timeframe) => `missing ${timeframe} candles`),
            tradeIdea: null,
            firstPostLines: [],
        },
    };
}
function dataQualityPrimaryCause(reasons) {
    const normalized = reasons.join(" | ").toLowerCase();
    if (!normalized || normalized === "data quality checks passed") {
        return null;
    }
    const causes = [];
    if (/level data|level ladder|level quality|support|resistance/.test(normalized)) {
        causes.push("level_ladder");
    }
    if (/liquidity|spread/.test(normalized)) {
        causes.push("liquidity_context");
    }
    if (/halt|stale|pause/.test(normalized)) {
        causes.push("halt_or_stale_candles");
    }
    if (/session|candle reaction|move extension|volatility/.test(normalized)) {
        causes.push("candle_context");
    }
    if (causes.length === 1) {
        return causes[0];
    }
    return causes.length > 1 ? "mixed" : "unknown";
}
function missingFactsForContext(context) {
    const missing = [];
    if (context.dynamicLevels.vwap === null) {
        missing.push("VWAP unavailable");
    }
    if (context.dynamicLevels.ema9 === null) {
        missing.push("EMA9 unavailable");
    }
    if (context.dynamicLevels.ema20 === null) {
        missing.push("EMA20 unavailable");
    }
    if (referenceCount(context.referenceLevels) < 3) {
        missing.push("limited reference levels");
    }
    if (supportCount(context) < 3) {
        missing.push("thin support ladder");
    }
    if (resistanceCount(context) < 3) {
        missing.push("thin resistance ladder");
    }
    if (context.traderContext.openingRange.label === "unavailable") {
        missing.push("opening range unavailable");
    }
    if (context.traderContext.dataQuality.label === "degraded" || context.traderContext.dataQuality.label === "unusable") {
        missing.push(...context.traderContext.dataQuality.reasons.map((reason) => `data quality: ${reason}`));
    }
    return [...new Set(missing)];
}
export async function buildAdvancedCandleContextReport(options = {}) {
    const cacheDirectoryPath = options.cacheDirectoryPath ?? DEFAULT_CACHE_DIRECTORY;
    const provider = options.provider ?? "ibkr";
    const selectedSymbols = options.symbols
        ? options.symbols.map((symbol) => symbol.trim().toUpperCase()).filter(Boolean)
        : providerSymbols(cacheDirectoryPath, provider);
    const symbolsToScan = selectedSymbols.slice(0, options.maxSymbols ?? Number.POSITIVE_INFINITY);
    const symbols = [];
    for (const symbol of symbolsToScan) {
        const daily = loadCandles({ cacheDirectoryPath, provider, symbol, timeframe: "daily" });
        const fourHour = loadCandles({ cacheDirectoryPath, provider, symbol, timeframe: "4h" });
        const fiveMinute = loadCandles({ cacheDirectoryPath, provider, symbol, timeframe: "5m" });
        if (daily.length === 0 || fourHour.length === 0 || fiveMinute.length === 0) {
            symbols.push(blockedSymbol(symbol, daily, fourHour, fiveMinute));
            continue;
        }
        try {
            const currentPrice = fiveMinute.at(-1)?.close ?? daily.at(-1)?.close;
            const context = await buildSupportResistanceContextFromCandles({
                symbol,
                currentPrice,
                candlesByTimeframe: {
                    daily,
                    "4h": fourHour,
                    "5m": fiveMinute,
                },
            });
            const missingFacts = missingFactsForContext(context);
            symbols.push({
                symbol,
                status: "ready",
                reason: "advanced candle context built from cached daily, 4h, and 5m candles",
                candleCounts: { daily: daily.length, "4h": fourHour.length, "5m": fiveMinute.length },
                currentPrice: currentPrice ?? null,
                supportCount: supportCount(context),
                resistanceCount: resistanceCount(context),
                referenceLevelsAvailable: referenceCount(context.referenceLevels),
                gapCount: context.gapStructure.recentGaps.length,
                nearestGapAbove: gapLabel(context.gapStructure.nearestGapAbove),
                nearestGapBelow: gapLabel(context.gapStructure.nearestGapBelow),
                dynamicAvailability: {
                    vwap: context.dynamicLevels.vwap !== null,
                    ema9: context.dynamicLevels.ema9 !== null,
                    ema20: context.dynamicLevels.ema20 !== null,
                },
                marketStructure: {
                    state: context.marketStructure.state,
                    confidence: context.marketStructure.confidence.label,
                    traderLine: context.marketStructure.traderLine ?? null,
                },
                traderContext: {
                    sessionGap: context.traderContext.sessionGap.label,
                    candleReaction: context.traderContext.candleReaction.label,
                    moveExtension: context.traderContext.moveExtension.label,
                    openingRange: context.traderContext.openingRange.label,
                    haltAwareness: context.traderContext.haltAwareness.label,
                    levelQuality: context.traderContext.levelQuality.label,
                    dataQuality: context.traderContext.dataQuality.label,
                    dataQualityScore: context.traderContext.dataQuality.score,
                    dataQualityReasons: context.traderContext.dataQuality.reasons,
                    dataQualityPrimaryCause: dataQualityPrimaryCause(context.traderContext.dataQuality.reasons),
                    missingFacts,
                    tradeIdea: context.traderContext.tradeIdea.label,
                    firstPostLines: context.traderContext.firstPostPlan.lines.slice(0, 6),
                },
            });
        }
        catch (error) {
            symbols.push({
                ...blockedSymbol(symbol, daily, fourHour, fiveMinute),
                status: "error",
                reason: error instanceof Error ? error.message : String(error),
            });
        }
    }
    return {
        generatedAt: new Date().toISOString(),
        cacheDirectoryPath,
        provider,
        totals: {
            symbols: symbols.length,
            ready: symbols.filter((symbol) => symbol.status === "ready").length,
            partial: symbols.filter((symbol) => symbol.status === "partial").length,
            blocked: symbols.filter((symbol) => symbol.status === "blocked").length,
            error: symbols.filter((symbol) => symbol.status === "error").length,
            vwapAvailable: symbols.filter((symbol) => symbol.dynamicAvailability.vwap).length,
            emaAvailable: symbols.filter((symbol) => symbol.dynamicAvailability.ema9 && symbol.dynamicAvailability.ema20).length,
            gapsDetected: symbols.filter((symbol) => (symbol.gapCount ?? 0) > 0).length,
            openingRangeAvailable: symbols.filter((symbol) => symbol.traderContext.openingRange !== "unavailable" && symbol.traderContext.openingRange !== null).length,
            haltWatch: symbols.filter((symbol) => symbol.traderContext.haltAwareness === "possible_halt" || symbol.traderContext.haltAwareness === "paused_after_fast_move").length,
            weakDataQuality: symbols.filter((symbol) => symbol.traderContext.dataQuality === "degraded" || symbol.traderContext.dataQuality === "unusable").length,
        },
        symbols,
    };
}
export function formatAdvancedCandleContextMarkdown(report) {
    const lines = [
        "# Advanced Candle Context Report",
        "",
        `Generated: ${report.generatedAt}`,
        `Cache: ${report.cacheDirectoryPath}`,
        `Provider: ${report.provider}`,
        "",
        "## Totals",
        "",
        `- symbols: ${report.totals.symbols}`,
        `- ready: ${report.totals.ready}`,
        `- partial: ${report.totals.partial}`,
        `- blocked: ${report.totals.blocked}`,
        `- errors: ${report.totals.error}`,
        `- VWAP available: ${report.totals.vwapAvailable}`,
        `- EMA9/EMA20 available: ${report.totals.emaAvailable}`,
        `- gaps detected: ${report.totals.gapsDetected}`,
        `- opening range available: ${report.totals.openingRangeAvailable}`,
        `- halt watch: ${report.totals.haltWatch}`,
        `- weak data quality: ${report.totals.weakDataQuality}`,
        "",
        "## Symbol Evidence",
        "",
    ];
    for (const symbol of report.symbols.slice(0, 120)) {
        lines.push(`### ${symbol.symbol} - ${symbol.status}`, "", `- reason: ${symbol.reason}`, `- candles: daily ${symbol.candleCounts.daily}; 4h ${symbol.candleCounts["4h"]}; 5m ${symbol.candleCounts["5m"]}`, `- current price: ${symbol.currentPrice ?? "n/a"}; supports ${symbol.supportCount ?? "n/a"}; resistances ${symbol.resistanceCount ?? "n/a"}; reference levels ${symbol.referenceLevelsAvailable}`, `- dynamic: VWAP=${symbol.dynamicAvailability.vwap}; EMA9=${symbol.dynamicAvailability.ema9}; EMA20=${symbol.dynamicAvailability.ema20}`, `- gaps: count ${symbol.gapCount ?? "n/a"}; above ${symbol.nearestGapAbove ?? "n/a"}; below ${symbol.nearestGapBelow ?? "n/a"}`, `- structure: ${symbol.marketStructure.state ?? "n/a"} (${symbol.marketStructure.confidence ?? "n/a"}); ${symbol.marketStructure.traderLine ?? "no trader line"}`, `- context labels: session=${symbol.traderContext.sessionGap ?? "n/a"}; reaction=${symbol.traderContext.candleReaction ?? "n/a"}; extension=${symbol.traderContext.moveExtension ?? "n/a"}; opening=${symbol.traderContext.openingRange ?? "n/a"}; halt=${symbol.traderContext.haltAwareness ?? "n/a"}; levelQuality=${symbol.traderContext.levelQuality ?? "n/a"}; data=${symbol.traderContext.dataQuality ?? "n/a"}; idea=${symbol.traderContext.tradeIdea ?? "n/a"}`, `- data quality proof: score ${symbol.traderContext.dataQualityScore ?? "n/a"}; cause ${symbol.traderContext.dataQualityPrimaryCause ?? "n/a"}; reasons ${symbol.traderContext.dataQualityReasons.join(" | ") || "none"}`, `- missing facts: ${symbol.traderContext.missingFacts.join(" | ") || "none"}`, `- first-post plan lines: ${symbol.traderContext.firstPostLines.join(" | ") || "none"}`, "");
    }
    return `${lines.join("\n")}\n`;
}
export async function writeAdvancedCandleContextReport(options) {
    const report = await buildAdvancedCandleContextReport(options);
    mkdirSync(dirname(resolve(options.jsonPath)), { recursive: true });
    mkdirSync(dirname(resolve(options.markdownPath)), { recursive: true });
    writeFileSync(options.jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    writeFileSync(options.markdownPath, formatAdvancedCandleContextMarkdown(report), "utf8");
    return report;
}
