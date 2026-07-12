import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { buildCandleMarketStructureContext, buildStableMarketStructureContext, } from "../structure/index.js";
const DEFAULT_CACHE_DIRECTORY = join(process.cwd(), ".validation-cache", "candles", "ibkr");
const DEFAULT_MAX_FILES_PER_SYMBOL = 2;
const DEFAULT_MIN_CANDLES = 12;
const DEFAULT_ROLLING_STEP_BARS = 1;
function normalizeSymbols(symbols) {
    const normalized = (symbols ?? [])
        .flatMap((symbol) => symbol.split(","))
        .map((symbol) => symbol.trim().toUpperCase())
        .filter(Boolean);
    return normalized.length > 0 ? new Set(normalized) : null;
}
function parseCacheFileName(path, symbol, filename) {
    if (filename.endsWith(".jsonl")) {
        const date = filename.slice(0, -".jsonl".length);
        const endTimeMs = Date.parse(`${date}T23:59:59.999Z`);
        return Number.isFinite(endTimeMs)
            ? {
                path: join(path, filename),
                symbol,
                lookbackBars: 0,
                endTimeMs,
                format: "warehouse_jsonl",
            }
            : null;
    }
    if (!filename.endsWith(".json")) {
        return null;
    }
    const separator = filename.indexOf("-");
    if (separator <= 0) {
        return null;
    }
    const lookbackBars = Number(filename.slice(0, separator));
    const endTimeMs = Number(filename.slice(separator + 1, -".json".length));
    if (!Number.isFinite(lookbackBars) || !Number.isFinite(endTimeMs)) {
        return null;
    }
    return {
        path: join(path, filename),
        symbol,
        lookbackBars,
        endTimeMs,
        format: "validation_json",
    };
}
function discoverCacheFiles(cacheDirectory, symbols, maxFilesPerSymbol) {
    if (!existsSync(cacheDirectory)) {
        return { discoveredSymbols: 0, files: [] };
    }
    const symbolDirectories = readdirSync(cacheDirectory, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name.toUpperCase())
        .filter((symbol) => !symbols || symbols.has(symbol))
        .sort();
    const files = [];
    for (const symbol of symbolDirectories) {
        const timeframeDirectory = join(cacheDirectory, symbol, "5m");
        if (!existsSync(timeframeDirectory) || !statSync(timeframeDirectory).isDirectory()) {
            continue;
        }
        const symbolFiles = readdirSync(timeframeDirectory)
            .map((filename) => parseCacheFileName(timeframeDirectory, symbol, filename))
            .filter((file) => file !== null)
            .sort((left, right) => right.endTimeMs - left.endTimeMs || right.lookbackBars - left.lookbackBars)
            .slice(0, maxFilesPerSymbol);
        files.push(...symbolFiles);
    }
    return {
        discoveredSymbols: symbolDirectories.length,
        files,
    };
}
function readCandles(file) {
    if (file.format === "warehouse_jsonl") {
        return readFileSync(file.path, "utf8")
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
            .filter((candle) => Number.isFinite(candle.timestamp) &&
            Number.isFinite(candle.open) &&
            Number.isFinite(candle.high) &&
            Number.isFinite(candle.low) &&
            Number.isFinite(candle.close))
            .sort((left, right) => left.timestamp - right.timestamp);
    }
    const entry = JSON.parse(readFileSync(file.path, "utf8"));
    const candles = entry.response?.candles ?? [];
    return [...candles]
        .filter((candle) => Number.isFinite(candle.timestamp) &&
        Number.isFinite(candle.open) &&
        Number.isFinite(candle.high) &&
        Number.isFinite(candle.low) &&
        Number.isFinite(candle.close))
        .sort((left, right) => left.timestamp - right.timestamp);
}
function priceRangePct(candles) {
    if (candles.length === 0) {
        return 0;
    }
    const high = Math.max(...candles.map((candle) => candle.high));
    const low = Math.min(...candles.map((candle) => candle.low));
    const reference = Math.max(candles.at(-1)?.close ?? 0, 0.0001);
    return Number(((high - low) / reference).toFixed(4));
}
function incrementStateCount(counts, state) {
    counts[state] = (counts[state] ?? 0) + 1;
}
function buildRollingSummary(params) {
    const states = [];
    const closes = [];
    const confidenceLabels = [];
    const stateCounts = {};
    for (let end = params.minCandles; end <= params.candles.length; end += params.stepBars) {
        const context = buildCandleMarketStructureContext({
            symbol: params.symbol,
            candles: params.candles.slice(0, end),
        });
        states.push(context.state);
        closes.push(params.candles[end - 1]?.close ?? 0);
        confidenceLabels.push(context.confidence.label);
        incrementStateCount(stateCounts, context.state);
    }
    let transitionCount = 0;
    let immaterialTransitionCount = 0;
    for (let index = 1; index < states.length; index += 1) {
        if (states[index] !== states[index - 1]) {
            transitionCount += 1;
            const previousClose = closes[index - 1] ?? 0;
            const currentClose = closes[index] ?? previousClose;
            const movePct = Math.abs(currentClose - previousClose) / Math.max(Math.abs(previousClose), 0.0001);
            const minimumMaterialPct = previousClose < 1
                ? 0.025
                : previousClose < 2
                    ? 0.02
                    : previousClose < 10
                        ? 0.012
                        : 0.008;
            if (movePct < minimumMaterialPct) {
                immaterialTransitionCount += 1;
            }
        }
    }
    return {
        evaluatedWindows: states.length,
        stateCounts,
        transitionCount,
        immaterialTransitionCount,
        immaterialTransitionRatio: transitionCount > 0 ? Number((immaterialTransitionCount / transitionCount).toFixed(3)) : 0,
        rangeBoundRatio: states.length > 0 ? Number(((stateCounts.range_bound ?? 0) / states.length).toFixed(3)) : 0,
        lowConfidenceRatio: confidenceLabels.length > 0
            ? Number((confidenceLabels.filter((label) => label === "low").length / confidenceLabels.length).toFixed(3))
            : 0,
        lastStates: states.slice(-8),
    };
}
function buildFindings(params) {
    const findings = [];
    const base = {
        symbol: params.file.symbol,
        sourcePath: params.file.path,
    };
    if (params.candles.length < DEFAULT_MIN_CANDLES || params.caseState === "insufficient_data") {
        findings.push({
            ...base,
            severity: "review",
            reason: "insufficient_structure_data",
            detail: `${params.candles.length} candle(s) available; market structure is not reliable yet.`,
        });
    }
    if (params.confidenceLabel === "low") {
        findings.push({
            ...base,
            severity: "watch",
            reason: "low_structure_confidence",
            detail: "Structure context produced low confidence on the latest cached window.",
        });
    }
    if (params.rolling.evaluatedWindows >= 12 &&
        params.rolling.transitionCount >= Math.ceil(params.rolling.evaluatedWindows * 0.35) &&
        params.stable.stableTransitionCount >= Math.ceil(params.rolling.evaluatedWindows * 0.25)) {
        findings.push({
            ...base,
            severity: "review",
            reason: "high_stable_state_flip_count",
            detail: `${params.stable.stableTransitionCount} stable transitions after smoothing (${params.rolling.transitionCount} raw) across ${params.rolling.evaluatedWindows} rolling windows; still too jumpy for live wording.`,
        });
    }
    if (params.rolling.transitionCount >= 4 &&
        params.rolling.immaterialTransitionRatio >= 0.4) {
        findings.push({
            ...base,
            severity: "review",
            reason: "small_cap_immaterial_structure_flips",
            detail: `${params.rolling.immaterialTransitionCount}/${params.rolling.transitionCount} raw structure flips happened on small price movement; this should be suppressed as small-cap wiggle unless candles later prove acceptance.`,
        });
    }
    if (params.rolling.transitionCount > 0 &&
        params.rolling.immaterialTransitionCount > 0 &&
        params.rolling.immaterialTransitionRatio >= 0.5) {
        findings.push({
            ...base,
            severity: "watch",
            reason: "small_cap_immaterial_structure_transition",
            detail: `${params.rolling.immaterialTransitionCount}/${params.rolling.transitionCount} structure transition(s) were below small-cap materiality thresholds; trader-facing wording should wait for stronger candle evidence.`,
        });
    }
    if (params.rolling.evaluatedWindows >= 12 &&
        params.rolling.transitionCount >= Math.ceil(params.rolling.evaluatedWindows * 0.35) &&
        params.stable.transitionReductionPct >= 0.35) {
        findings.push({
            ...base,
            severity: "info",
            reason: "smoothing_reduced_state_flips",
            detail: `Stable interpreter reduced transitions by ${Math.round(params.stable.transitionReductionPct * 100)}% (${params.rolling.transitionCount} raw -> ${params.stable.stableTransitionCount} stable).`,
        });
    }
    if (params.rolling.rangeBoundRatio >= 0.5) {
        findings.push({
            ...base,
            severity: "info",
            reason: "range_bound_majority",
            detail: `${Math.round(params.rolling.rangeBoundRatio * 100)}% of rolling windows were range_bound; this should help suppress repeated chop posts if later wired into policy.`,
        });
    }
    if (params.rangeQuality === "choppy") {
        findings.push({
            ...base,
            severity: "watch",
            reason: "choppy_range",
            detail: "Latest structure range is choppy; trader-facing wording should avoid overexplaining tiny moves inside it.",
        });
    }
    if (params.diagnosticCodes.includes("no_confirmed_pivots")) {
        findings.push({
            ...base,
            severity: "watch",
            reason: "no_confirmed_pivots",
            detail: "No confirmed 5m pivots were found; structure should stay observational only.",
        });
    }
    return findings;
}
export function buildMarketStructureReplayAuditReport(options = {}) {
    const cacheDirectory = options.cacheDirectory ?? DEFAULT_CACHE_DIRECTORY;
    const symbolFilter = normalizeSymbols(options.symbols);
    const maxFilesPerSymbol = Math.max(1, options.maxFilesPerSymbol ?? DEFAULT_MAX_FILES_PER_SYMBOL);
    const minCandles = Math.max(6, options.minCandles ?? DEFAULT_MIN_CANDLES);
    const rollingStepBars = Math.max(1, options.rollingStepBars ?? DEFAULT_ROLLING_STEP_BARS);
    const { discoveredSymbols, files } = discoverCacheFiles(cacheDirectory, symbolFilter, maxFilesPerSymbol);
    const skipped = [];
    const cases = [];
    const findings = [];
    const stateCounts = {};
    const confidenceCounts = { low: 0, medium: 0, high: 0 };
    for (const file of files) {
        let candles;
        try {
            candles = readCandles(file);
        }
        catch (error) {
            skipped.push({
                symbol: file.symbol,
                path: file.path,
                reason: error instanceof Error ? error.message : "failed to read cache file",
            });
            continue;
        }
        if (candles.length === 0) {
            skipped.push({ symbol: file.symbol, path: file.path, reason: "cache file had no usable candles" });
            continue;
        }
        const context = buildCandleMarketStructureContext({
            symbol: file.symbol,
            candles,
        });
        const rolling = buildRollingSummary({
            symbol: file.symbol,
            candles,
            minCandles,
            stepBars: rollingStepBars,
        });
        const stableContext = buildStableMarketStructureContext({
            symbol: file.symbol,
            candles,
            minCandles,
            stepBars: rollingStepBars,
        });
        const stable = {
            state: stableContext.current?.stableState ?? null,
            materialityScore: stableContext.current?.materialityScore ?? null,
            rawTransitionCount: stableContext.rawTransitionCount,
            stableTransitionCount: stableContext.stableTransitionCount,
            suppressedTransitionCount: stableContext.suppressedTransitionCount,
            transitionReductionPct: stableContext.rawTransitionCount > 0
                ? Number(((stableContext.rawTransitionCount - stableContext.stableTransitionCount) / stableContext.rawTransitionCount).toFixed(3))
                : 0,
            latestReason: stableContext.current?.reason ?? null,
            latestAccepted: stableContext.current?.accepted ?? null,
            lastStates: stableContext.decisions.slice(-8).map((decision) => decision.stableState),
        };
        const diagnosticCodes = context.diagnostics.map((diagnostic) => diagnostic.code);
        const caseFindings = buildFindings({
            file,
            candles,
            caseState: context.state,
            confidenceLabel: context.confidence.label,
            rolling,
            stable,
            diagnosticCodes,
            rangeQuality: context.range?.quality ?? null,
        });
        findings.push(...caseFindings);
        incrementStateCount(stateCounts, context.state);
        confidenceCounts[context.confidence.label] += 1;
        cases.push({
            caseId: `${file.symbol}-${file.endTimeMs}`,
            symbol: file.symbol,
            sourcePath: file.path,
            candleCount: candles.length,
            startTimestamp: candles[0].timestamp,
            endTimestamp: candles.at(-1).timestamp,
            latestClose: candles.at(-1).close,
            priceRangePct: priceRangePct(candles),
            state: context.state,
            confidenceLabel: context.confidence.label,
            confidenceScore: context.confidence.score,
            confidenceReasons: context.confidence.reasons,
            range: context.range,
            trend: {
                direction: context.trend.direction,
                higherLowCount: context.trend.higherLowCount,
                lowerHighCount: context.trend.lowerHighCount,
                higherHighCount: context.trend.higherHighCount,
                lowerLowCount: context.trend.lowerLowCount,
            },
            pivotEvent: context.pivotEvent
                ? {
                    type: context.pivotEvent.type,
                    triggerPrice: context.pivotEvent.triggerPrice,
                    confirmation: context.pivotEvent.confirmation,
                }
                : null,
            pivotCounts: {
                swingHighs: context.pivots.confirmedHighs.length,
                swingLows: context.pivots.confirmedLows.length,
            },
            traderLine: context.traderLine ?? null,
            diagnosticCodes,
            rolling,
            stable,
            findings: caseFindings,
        });
    }
    const findingCounts = findings.reduce((counts, finding) => {
        counts[finding.severity] += 1;
        return counts;
    }, { review: 0, watch: 0, info: 0 });
    return {
        generatedAt: new Date().toISOString(),
        cacheDirectory,
        symbolsRequested: symbolFilter ? [...symbolFilter].sort() : null,
        symbolsDiscovered: discoveredSymbols,
        symbolsScanned: new Set(cases.map((item) => item.symbol)).size,
        filesScanned: cases.length,
        skipped,
        summary: {
            stateCounts,
            confidenceCounts,
            findingCounts,
            rangeBoundCases: cases.filter((item) => item.state === "range_bound").length,
            highTransitionCases: cases.filter((item) => item.rolling.evaluatedWindows >= 12 &&
                item.rolling.transitionCount >= Math.ceil(item.rolling.evaluatedWindows * 0.35)).length,
            highStableTransitionCases: cases.filter((item) => item.rolling.evaluatedWindows >= 12 &&
                item.stable.stableTransitionCount >= Math.ceil(item.rolling.evaluatedWindows * 0.25)).length,
            averageTransitionReductionPct: cases.length > 0
                ? Number((cases.reduce((sum, item) => sum + item.stable.transitionReductionPct, 0) / cases.length).toFixed(3))
                : 0,
            insufficientCases: cases.filter((item) => item.state === "insufficient_data").length,
        },
        cases,
        findings,
    };
}
function formatPct(value) {
    return `${(value * 100).toFixed(1)}%`;
}
function formatTimestamp(timestamp) {
    return new Date(timestamp).toISOString();
}
export function formatMarketStructureReplayAuditMarkdown(report) {
    const lines = [
        "# Market Structure Replay Audit",
        "",
        `Generated: ${report.generatedAt}`,
        `Cache: ${report.cacheDirectory}`,
        `Symbols scanned: ${report.symbolsScanned} / discovered ${report.symbolsDiscovered}`,
        `Files scanned: ${report.filesScanned}`,
        "",
        "## Summary",
        "",
        `- state counts: ${JSON.stringify(report.summary.stateCounts)}`,
        `- confidence counts: ${JSON.stringify(report.summary.confidenceCounts)}`,
        `- finding counts: ${JSON.stringify(report.summary.findingCounts)}`,
        `- range-bound latest cases: ${report.summary.rangeBoundCases}`,
        `- high-transition cases: ${report.summary.highTransitionCases}`,
        `- high stable-transition cases: ${report.summary.highStableTransitionCases}`,
        `- average transition reduction: ${formatPct(report.summary.averageTransitionReductionPct)}`,
        `- insufficient cases: ${report.summary.insufficientCases}`,
        "",
    ];
    if (report.findings.length > 0) {
        lines.push("## Findings", "");
        for (const finding of report.findings.slice(0, 80)) {
            lines.push(`- **${finding.severity}** ${finding.symbol}: ${finding.reason} - ${finding.detail}`);
        }
        if (report.findings.length > 80) {
            lines.push(`- ... ${report.findings.length - 80} more finding(s) omitted from markdown.`);
        }
        lines.push("");
    }
    lines.push("## Cases", "");
    for (const item of report.cases.slice(0, 120)) {
        lines.push(`### ${item.symbol} ${formatTimestamp(item.endTimestamp)}`, "", `- state: ${item.state}`, `- confidence: ${item.confidenceLabel} (${item.confidenceScore})`, `- candles: ${item.candleCount} | latest close: ${item.latestClose} | range: ${formatPct(item.priceRangePct)}`, `- pivots: highs ${item.pivotCounts.swingHighs}, lows ${item.pivotCounts.swingLows}`, `- trend: ${item.trend.direction} | HL ${item.trend.higherLowCount} | LH ${item.trend.lowerHighCount} | HH ${item.trend.higherHighCount} | LL ${item.trend.lowerLowCount}`, item.range
            ? `- active range: ${item.range.active} | ${item.range.low}-${item.range.high} | ${item.range.quality} | width ${formatPct(item.range.widthPct)}`
            : "- active range: none", item.pivotEvent
            ? `- pivot event: ${item.pivotEvent.type} ${item.pivotEvent.triggerPrice ?? ""} (${item.pivotEvent.confirmation})`
            : "- pivot event: none", `- rolling: ${item.rolling.transitionCount} transitions / ${item.rolling.evaluatedWindows} windows | immaterial ${item.rolling.immaterialTransitionCount} (${formatPct(item.rolling.immaterialTransitionRatio)}) | range_bound ${formatPct(item.rolling.rangeBoundRatio)} | low confidence ${formatPct(item.rolling.lowConfidenceRatio)}`, `- stable: ${item.stable.state ?? "n/a"} | transitions ${item.stable.stableTransitionCount}/${item.stable.rawTransitionCount} raw | suppressed ${item.stable.suppressedTransitionCount} | reduction ${formatPct(item.stable.transitionReductionPct)} | latest ${item.stable.latestReason ?? "n/a"}`, item.traderLine ? `- trader line: ${item.traderLine}` : "- trader line: n/a", "");
    }
    if (report.cases.length > 120) {
        lines.push(`_Markdown truncated after 120 cases; JSON contains all ${report.cases.length} cases._`, "");
    }
    if (report.skipped.length > 0) {
        lines.push("## Skipped", "");
        for (const skipped of report.skipped.slice(0, 80)) {
            lines.push(`- ${skipped.symbol ?? "unknown"}: ${skipped.reason}`);
        }
    }
    return `${lines.join("\n")}\n`;
}
