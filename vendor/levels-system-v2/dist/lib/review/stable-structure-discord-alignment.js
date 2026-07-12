import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { buildStableMarketStructureContext } from "../structure/index.js";
const DEFAULT_AUDIT_ROOT = join(process.cwd(), "artifacts");
const DEFAULT_CACHE_DIRECTORY = join(process.cwd(), ".validation-cache", "candles", "ibkr");
const DEFAULT_MIN_CANDLES = 12;
const DEFAULT_MAX_CACHE_LAG_MINUTES = 90;
const DEFAULT_REPEAT_WINDOW_MINUTES = 30;
const STRUCTURE_STORY_OPERATIONS = new Set(["post_alert", "post_level_snapshot", "post_level_extension"]);
function normalizeSymbols(symbols) {
    const normalized = (symbols ?? [])
        .flatMap((symbol) => symbol.split(","))
        .map((symbol) => symbol.trim().toUpperCase())
        .filter(Boolean);
    return normalized.length > 0 ? new Set(normalized) : null;
}
function discoverAuditFiles(root, limit) {
    if (!existsSync(root)) {
        return [];
    }
    const stats = statSync(root);
    if (stats.isFile()) {
        return basename(root).toLowerCase() === "discord-delivery-audit.jsonl" ? [root] : [];
    }
    const found = [];
    const walk = (directory) => {
        for (const entry of readdirSync(directory, { withFileTypes: true })) {
            const fullPath = join(directory, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            }
            else if (entry.isFile() && entry.name.toLowerCase() === "discord-delivery-audit.jsonl") {
                found.push(fullPath);
            }
        }
    };
    walk(root);
    const sorted = found.sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs);
    return limit === null ? sorted : sorted.slice(0, Math.max(0, limit));
}
function parseCacheFile(path, symbol, filename) {
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
function discoverCacheFiles(cacheDirectory, symbols) {
    const bySymbol = new Map();
    if (!existsSync(cacheDirectory)) {
        return { discoveredSymbols: 0, bySymbol };
    }
    const symbolDirectories = readdirSync(cacheDirectory, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name.toUpperCase())
        .filter((symbol) => !symbols || symbols.has(symbol))
        .sort();
    for (const symbol of symbolDirectories) {
        const timeframeDirectory = join(cacheDirectory, symbol, "5m");
        if (!existsSync(timeframeDirectory) || !statSync(timeframeDirectory).isDirectory()) {
            continue;
        }
        const files = readdirSync(timeframeDirectory)
            .map((filename) => parseCacheFile(timeframeDirectory, symbol, filename))
            .filter((file) => file !== null)
            .sort((left, right) => left.endTimeMs - right.endTimeMs || right.lookbackBars - left.lookbackBars);
        if (files.length > 0) {
            bySymbol.set(symbol, files);
        }
    }
    return {
        discoveredSymbols: symbolDirectories.length,
        bySymbol,
    };
}
function readAuditRows(auditPath, symbolFilter) {
    return readFileSync(auditPath, "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => JSON.parse(line))
        .filter((row) => row.type === "discord_delivery_audit")
        .filter((row) => row.status === "posted")
        .filter((row) => STRUCTURE_STORY_OPERATIONS.has(String(row.operation)))
        .filter((row) => row.messageKind !== "stock_context")
        .filter((row) => typeof row.timestamp === "number" && Number.isFinite(row.timestamp))
        .filter((row) => typeof row.symbol === "string" && row.symbol.trim().length > 0)
        .filter((row) => !symbolFilter || symbolFilter.has(row.symbol.trim().toUpperCase()))
        .sort((left, right) => (left.timestamp ?? 0) - (right.timestamp ?? 0));
}
function cleanText(text) {
    return (text ?? "").replace(/\s+/g, " ").trim();
}
function rowExcerpt(row) {
    const text = [row.title, row.body ?? row.bodyPreview].filter(Boolean).join(" | ");
    return cleanText(text).slice(0, 260);
}
function storyKey(row) {
    const symbol = row.symbol?.trim().toUpperCase() ?? "";
    const title = cleanText(row.title).toLowerCase();
    const normalizedTitle = title
        .replace(new RegExp(`^${symbol.toLowerCase()}\\s+`), "")
        .replace(/\b\d+(?:\.\d+)?\b/g, "#")
        .replace(/\s+/g, " ")
        .trim();
    return row.signalCategory ?? row.messageKind ?? row.eventType ?? (normalizedTitle || "unknown_story");
}
function sessionName(auditPath) {
    return auditPath.split(/[\\/]/).at(-2) ?? "unknown-session";
}
function readCache(file) {
    const rawCandles = file.format === "warehouse_jsonl"
        ? readFileSync(file.path, "utf8")
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
        : (() => {
            const entry = JSON.parse(readFileSync(file.path, "utf8"));
            return entry.response?.candles ?? [];
        })();
    const candles = [...rawCandles]
        .filter((candle) => Number.isFinite(candle.timestamp) &&
        Number.isFinite(candle.open) &&
        Number.isFinite(candle.high) &&
        Number.isFinite(candle.low) &&
        Number.isFinite(candle.close))
        .sort((left, right) => left.timestamp - right.timestamp);
    return {
        ...file,
        candles,
        startTimestamp: candles[0]?.timestamp ?? file.endTimeMs,
        endTimestamp: candles.at(-1)?.timestamp ?? file.endTimeMs,
    };
}
function chooseCacheFile(files, timestamp) {
    if (!files || files.length === 0) {
        return null;
    }
    const coveringOrFuture = files.filter((file) => file.endTimeMs >= timestamp);
    if (coveringOrFuture.length > 0) {
        return coveringOrFuture.sort((left, right) => left.endTimeMs - right.endTimeMs || right.lookbackBars - left.lookbackBars)[0] ?? null;
    }
    return [...files].sort((left, right) => right.endTimeMs - left.endTimeMs || right.lookbackBars - left.lookbackBars)[0] ?? null;
}
function incrementString(counts, key) {
    counts.set(key, (counts.get(key) ?? 0) + 1);
}
function topMapEntries(counts, limit) {
    return [...counts.entries()]
        .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
        .slice(0, limit)
        .map(([state, count]) => ({ state, count }));
}
function topStoryEntries(counts, limit) {
    return [...counts.entries()]
        .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
        .slice(0, limit)
        .map(([key, count]) => ({ storyKey: key, count }));
}
function classifyAlignedPost(params) {
    if (params.cacheLagMinutes > params.maxCacheLagMinutes) {
        return "cache_stale";
    }
    const stableChanged = params.previousStableState !== null && params.previousStableState !== params.stableState;
    if (stableChanged) {
        return "structure_transition_post";
    }
    const rawChanged = params.previousRawState !== null && params.previousRawState !== params.rawState;
    if (rawChanged && params.previousStableState === params.stableState) {
        return "raw_chop_suppressed";
    }
    if (params.previousStableState === params.stableState && params.minutesSincePreviousPost !== null) {
        if (params.minutesSincePreviousPost <= params.repeatWindowMinutes) {
            return "same_structure_repeat";
        }
        return "same_structure_refresh";
    }
    return "aligned_context";
}
function nullPost(params) {
    const timestamp = params.row.timestamp ?? 0;
    return {
        auditPath: params.auditPath,
        session: sessionName(params.auditPath),
        symbol: params.row.symbol.trim().toUpperCase(),
        timestamp,
        isoTimestamp: new Date(timestamp).toISOString(),
        operation: params.row.operation ?? null,
        title: params.row.title ?? null,
        messageKind: params.row.messageKind ?? null,
        eventType: params.row.eventType ?? null,
        signalCategory: params.row.signalCategory ?? null,
        storyKey: storyKey(params.row),
        classification: params.classification,
        stableState: null,
        rawState: null,
        previousStableState: null,
        stableChangedSincePreviousPost: false,
        rawChangedSincePreviousPost: false,
        minutesSincePreviousPost: null,
        materialityScore: null,
        decisionReason: null,
        cachePath: null,
        cacheLagMinutes: null,
        candleCountUsed: params.candleCountUsed ?? 0,
        traderLine: null,
        excerpt: rowExcerpt(params.row),
    };
}
export function buildStableStructureDiscordAlignmentReport(options = {}) {
    const auditRoot = options.auditRoot ?? DEFAULT_AUDIT_ROOT;
    const cacheDirectory = options.cacheDirectory ?? DEFAULT_CACHE_DIRECTORY;
    const symbolFilter = normalizeSymbols(options.symbols);
    const auditLimit = options.auditLimit === undefined ? 30 : options.auditLimit;
    const minCandles = Math.max(6, options.minCandles ?? DEFAULT_MIN_CANDLES);
    const maxCacheLagMinutes = Math.max(1, options.maxCacheLagMinutes ?? DEFAULT_MAX_CACHE_LAG_MINUTES);
    const repeatWindowMinutes = Math.max(1, options.repeatWindowMinutes ?? DEFAULT_REPEAT_WINDOW_MINUTES);
    const auditFiles = discoverAuditFiles(auditRoot, auditLimit);
    const { discoveredSymbols, bySymbol } = discoverCacheFiles(cacheDirectory, symbolFilter);
    const parsedCache = new Map();
    const previousBySymbol = new Map();
    const posts = [];
    const skippedAuditFiles = [];
    for (const auditPath of auditFiles) {
        let rows;
        try {
            rows = readAuditRows(auditPath, symbolFilter);
        }
        catch (error) {
            skippedAuditFiles.push({
                auditPath,
                reason: error instanceof Error ? error.message : "failed to read audit file",
            });
            continue;
        }
        for (const row of rows) {
            const symbol = row.symbol.trim().toUpperCase();
            const timestamp = row.timestamp;
            const cacheFile = chooseCacheFile(bySymbol.get(symbol), timestamp);
            if (!cacheFile) {
                posts.push(nullPost({ auditPath, row, classification: "cache_unavailable" }));
                continue;
            }
            let parsed = parsedCache.get(cacheFile.path);
            if (!parsed) {
                parsed = readCache(cacheFile);
                parsedCache.set(cacheFile.path, parsed);
            }
            const candles = parsed.candles.filter((candle) => candle.timestamp <= timestamp);
            if (candles.length < minCandles) {
                posts.push(nullPost({ auditPath, row, classification: "insufficient_candles", candleCountUsed: candles.length }));
                continue;
            }
            const stable = buildStableMarketStructureContext({
                symbol,
                candles,
                minCandles,
            });
            const decision = stable.current;
            if (!decision) {
                posts.push(nullPost({ auditPath, row, classification: "insufficient_candles", candleCountUsed: candles.length }));
                continue;
            }
            const previous = previousBySymbol.get(symbol);
            const minutesSincePreviousPost = previous ? Number(((timestamp - previous.timestamp) / 60_000).toFixed(2)) : null;
            const cacheLagMinutes = Number((Math.max(0, timestamp - parsed.endTimestamp) / 60_000).toFixed(2));
            const classification = classifyAlignedPost({
                stableState: decision.stableState,
                rawState: decision.rawState,
                previousStableState: previous?.stableState ?? null,
                previousRawState: previous?.rawState ?? null,
                minutesSincePreviousPost,
                repeatWindowMinutes,
                cacheLagMinutes,
                maxCacheLagMinutes,
            });
            const aligned = {
                auditPath,
                session: sessionName(auditPath),
                symbol,
                timestamp,
                isoTimestamp: new Date(timestamp).toISOString(),
                operation: row.operation ?? null,
                title: row.title ?? null,
                messageKind: row.messageKind ?? null,
                eventType: row.eventType ?? null,
                signalCategory: row.signalCategory ?? null,
                storyKey: storyKey(row),
                classification,
                stableState: decision.stableState,
                rawState: decision.rawState,
                previousStableState: previous?.stableState ?? null,
                stableChangedSincePreviousPost: previous?.stableState !== null && previous?.stableState !== undefined
                    ? previous.stableState !== decision.stableState
                    : false,
                rawChangedSincePreviousPost: previous?.rawState !== null && previous?.rawState !== undefined
                    ? previous.rawState !== decision.rawState
                    : false,
                minutesSincePreviousPost,
                materialityScore: decision.materialityScore,
                decisionReason: decision.reason,
                cachePath: parsed.path,
                cacheLagMinutes,
                candleCountUsed: candles.length,
                traderLine: decision.context.traderLine ?? null,
                excerpt: rowExcerpt(row),
            };
            posts.push(aligned);
            previousBySymbol.set(symbol, aligned);
        }
    }
    const perSymbol = summarizeBySymbol(posts);
    const findings = buildFindings(perSymbol, posts, { maxCacheLagMinutes, repeatWindowMinutes });
    const summary = {
        postedRows: posts.length,
        alignedRows: posts.filter((post) => post.stableState !== null).length,
        cacheUnavailableRows: posts.filter((post) => post.classification === "cache_unavailable").length,
        staleCacheRows: posts.filter((post) => post.classification === "cache_stale").length,
        insufficientRows: posts.filter((post) => post.classification === "insufficient_candles").length,
        stableTransitionPosts: posts.filter((post) => post.classification === "structure_transition_post").length,
        sameStructureRepeats: posts.filter((post) => post.classification === "same_structure_repeat").length,
        sameStructureRefreshes: posts.filter((post) => post.classification === "same_structure_refresh").length,
        rawChopSuppressedRows: posts.filter((post) => post.classification === "raw_chop_suppressed").length,
        symbolsWithRepeatedStructure: perSymbol.filter((symbol) => symbol.sameStructureRepeats > 0).length,
        reviewFindings: findings.filter((finding) => finding.severity === "review").length,
        watchFindings: findings.filter((finding) => finding.severity === "watch").length,
        infoFindings: findings.filter((finding) => finding.severity === "info").length,
    };
    return {
        generatedAt: new Date().toISOString(),
        auditRoot,
        cacheDirectory,
        auditFilesDiscovered: discoverAuditFiles(auditRoot, null).length,
        auditFilesScanned: auditFiles.length,
        cacheSymbolsDiscovered: discoveredSymbols,
        summary,
        perSymbol,
        posts,
        findings,
        skippedAuditFiles,
    };
}
function summarizeBySymbol(posts) {
    const symbols = [...new Set(posts.map((post) => post.symbol))].sort();
    return symbols.map((symbol) => {
        const symbolPosts = posts.filter((post) => post.symbol === symbol);
        const stateCounts = new Map();
        const storyCounts = new Map();
        for (const post of symbolPosts) {
            if (post.stableState) {
                stateCounts.set(post.stableState, (stateCounts.get(post.stableState) ?? 0) + 1);
            }
            incrementString(storyCounts, post.storyKey);
        }
        return {
            symbol,
            postedRows: symbolPosts.length,
            alignedRows: symbolPosts.filter((post) => post.stableState !== null).length,
            cacheUnavailableRows: symbolPosts.filter((post) => post.classification === "cache_unavailable").length,
            staleCacheRows: symbolPosts.filter((post) => post.classification === "cache_stale").length,
            insufficientRows: symbolPosts.filter((post) => post.classification === "insufficient_candles").length,
            stableTransitionPosts: symbolPosts.filter((post) => post.classification === "structure_transition_post").length,
            sameStructureRepeats: symbolPosts.filter((post) => post.classification === "same_structure_repeat").length,
            sameStructureRefreshes: symbolPosts.filter((post) => post.classification === "same_structure_refresh").length,
            rawChopSuppressedRows: symbolPosts.filter((post) => post.classification === "raw_chop_suppressed").length,
            dominantStableStates: topMapEntries(stateCounts, 5),
            repeatedStoryKeys: topStoryEntries(storyCounts, 8).filter((entry) => entry.count > 1),
            representativeRepeats: symbolPosts.filter((post) => post.classification === "same_structure_repeat").slice(0, 5),
        };
    });
}
function buildFindings(perSymbol, posts, options) {
    const findings = [];
    for (const symbol of perSymbol) {
        if (symbol.sameStructureRepeats >= 10) {
            findings.push({
                severity: "review",
                symbol: symbol.symbol,
                reason: "high_same_structure_repeat_count",
                detail: `${symbol.sameStructureRepeats} posts repeated while stable 5m structure was unchanged; review this symbol for noisy level flicker.`,
            });
        }
        else if (symbol.sameStructureRepeats >= 4) {
            findings.push({
                severity: "watch",
                symbol: symbol.symbol,
                reason: "same_structure_repeat_cluster",
                detail: `${symbol.sameStructureRepeats} posts repeated inside a ${options.repeatWindowMinutes} minute structure window.`,
            });
        }
        if (symbol.rawChopSuppressedRows >= 4) {
            findings.push({
                severity: "watch",
                symbol: symbol.symbol,
                reason: "raw_structure_chop",
                detail: `${symbol.rawChopSuppressedRows} posts happened while raw structure changed but stable structure did not; this is a candidate for post-policy smoothing.`,
            });
        }
        if (symbol.staleCacheRows > 0) {
            findings.push({
                severity: "watch",
                symbol: symbol.symbol,
                reason: "stale_market_structure_cache",
                detail: `${symbol.staleCacheRows} post(s) could only be aligned to candles more than ${options.maxCacheLagMinutes} minutes stale.`,
            });
        }
        if (symbol.cacheUnavailableRows > 0 && symbol.alignedRows === 0) {
            findings.push({
                severity: "info",
                symbol: symbol.symbol,
                reason: "no_cached_5m_structure_data",
                detail: `${symbol.cacheUnavailableRows} posted row(s) had no matching cached 5m candles.`,
            });
        }
    }
    const cacheUnavailable = posts.filter((post) => post.classification === "cache_unavailable").length;
    if (cacheUnavailable > 0) {
        findings.push({
            severity: "info",
            reason: "cache_coverage_gap",
            detail: `${cacheUnavailable} posted row(s) could not be aligned because cached 5m candles were unavailable for those symbols.`,
        });
    }
    return findings.sort((left, right) => {
        const severityRank = { review: 0, watch: 1, info: 2 };
        return severityRank[left.severity] - severityRank[right.severity] || (left.symbol ?? "").localeCompare(right.symbol ?? "");
    });
}
function formatTimestamp(timestamp) {
    return new Date(timestamp).toISOString();
}
export function formatStableStructureDiscordAlignmentMarkdown(report) {
    const lines = [
        "# Stable Structure / Discord Alignment Audit",
        "",
        `Generated: ${report.generatedAt}`,
        `Audit root: ${report.auditRoot}`,
        `Cache: ${report.cacheDirectory}`,
        `Audit files scanned: ${report.auditFilesScanned} / discovered ${report.auditFilesDiscovered}`,
        "",
        "## Summary",
        "",
        `- posted rows inspected: ${report.summary.postedRows}`,
        `- aligned with 5m structure: ${report.summary.alignedRows}`,
        `- same-structure repeats: ${report.summary.sameStructureRepeats}`,
        `- stable transition posts: ${report.summary.stableTransitionPosts}`,
        `- raw chop suppressed candidates: ${report.summary.rawChopSuppressedRows}`,
        `- cache unavailable: ${report.summary.cacheUnavailableRows}`,
        `- stale cache: ${report.summary.staleCacheRows}`,
        `- findings: review ${report.summary.reviewFindings}, watch ${report.summary.watchFindings}, info ${report.summary.infoFindings}`,
        "",
    ];
    if (report.findings.length > 0) {
        lines.push("## Findings", "");
        for (const finding of report.findings.slice(0, 80)) {
            lines.push(`- **${finding.severity}** ${finding.symbol ?? "all"}: ${finding.reason} - ${finding.detail}`);
        }
        if (report.findings.length > 80) {
            lines.push(`- ... ${report.findings.length - 80} more finding(s) omitted from markdown.`);
        }
        lines.push("");
    }
    lines.push("## Symbols", "");
    for (const symbol of report.perSymbol.slice(0, 80)) {
        lines.push(`### ${symbol.symbol}`, "", `- posts: ${symbol.postedRows} | aligned: ${symbol.alignedRows} | transitions: ${symbol.stableTransitionPosts}`, `- repeats: ${symbol.sameStructureRepeats} | refreshes: ${symbol.sameStructureRefreshes} | raw-chop candidates: ${symbol.rawChopSuppressedRows}`, `- cache unavailable: ${symbol.cacheUnavailableRows} | stale: ${symbol.staleCacheRows} | insufficient: ${symbol.insufficientRows}`, `- stable states: ${symbol.dominantStableStates.map((item) => `${item.state} ${item.count}`).join(", ") || "n/a"}`, `- repeated stories: ${symbol.repeatedStoryKeys.map((item) => `${item.storyKey} ${item.count}`).join(", ") || "n/a"}`, "");
        for (const repeat of symbol.representativeRepeats.slice(0, 3)) {
            lines.push(`  - repeat ${formatTimestamp(repeat.timestamp)} | ${repeat.stableState ?? "n/a"} | ${repeat.title ?? repeat.storyKey}`, `    ${repeat.excerpt}`);
        }
        if (symbol.representativeRepeats.length > 0) {
            lines.push("");
        }
    }
    const notablePosts = report.posts
        .filter((post) => post.classification === "same_structure_repeat" ||
        post.classification === "raw_chop_suppressed" ||
        post.classification === "structure_transition_post")
        .slice(0, 120);
    if (notablePosts.length > 0) {
        lines.push("## Notable Aligned Posts", "");
        for (const post of notablePosts) {
            lines.push(`- **${post.classification}** ${post.symbol} ${formatTimestamp(post.timestamp)} | stable ${post.stableState ?? "n/a"} | raw ${post.rawState ?? "n/a"} | ${post.title ?? post.storyKey}`);
        }
        lines.push("");
    }
    if (report.skippedAuditFiles.length > 0) {
        lines.push("## Skipped Audit Files", "");
        for (const skipped of report.skippedAuditFiles.slice(0, 80)) {
            lines.push(`- ${skipped.auditPath}: ${skipped.reason}`);
        }
        lines.push("");
    }
    return `${lines.join("\n")}\n`;
}
