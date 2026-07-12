import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
function readRows(path) {
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
    });
}
function symbolOf(row) {
    return row.symbol?.trim().toUpperCase() || "UNKNOWN";
}
function isPosted(row) {
    return (row.messageKind !== "stock_context" &&
        (row.status === "posted" || row.status === "success") &&
        ["post_alert", "post_level_snapshot", "post_level_extension"].includes(String(row.operation)));
}
function text(row) {
    return [row.title, row.body, row.bodyPreview].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}
function excerpt(row, maxLength = 320) {
    const value = text(row);
    return value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`;
}
function increment(table, key) {
    const normalized = key?.trim() || "unknown";
    table[normalized] = (table[normalized] ?? 0) + 1;
}
function levelReference(row) {
    if (typeof row.triggerPrice === "number" && Number.isFinite(row.triggerPrice)) {
        return row.triggerPrice;
    }
    if (typeof row.targetPrice === "number" && Number.isFinite(row.targetPrice)) {
        return row.targetPrice;
    }
    const match = text(row).match(/\b(?:Price|Triggered near|near):\s*(\d+(?:\.\d{1,4})?)/i);
    if (!match?.[1]) {
        return null;
    }
    const value = Number(match[1]);
    return Number.isFinite(value) ? value : null;
}
function extractLevels(row) {
    return (text(row).match(/\b\d+(?:\.\d{1,4})\b/g) ?? [])
        .map(Number)
        .filter((value) => Number.isFinite(value) && value > 0 && value < 10_000);
}
function formatLevel(value) {
    if (value === null) {
        return "n/a";
    }
    return value >= 1 ? value.toFixed(2) : value.toFixed(4);
}
function deriveBudgetStyle(rows, priceRangePct) {
    const postCount = rows.length;
    const weakProbe = rows.filter((row) => row.acceptanceLabel === "weak_probe" || row.failedLevelOutcome === "probe_only").length;
    const rangeBox = rows.filter((row) => row.rangeBoxLabel === "active" || row.behaviorBudgetLabel === "boring_range").length;
    const accepted = rows.filter((row) => row.acceptanceLabel === "accepted").length;
    const major = rows.filter((row) => row.levelImportanceLabel === "major_decision").length;
    if ((priceRangePct ?? 0) >= 45 || (postCount >= 35 && major >= 6)) {
        return "extreme_runner";
    }
    if ((priceRangePct ?? 0) >= 18 || accepted >= 4) {
        return "active_runner";
    }
    if (rangeBox + weakProbe >= 4 && accepted <= 1) {
        return "low_volume_chop";
    }
    if (rangeBox >= 2) {
        return "range_bound_small_cap";
    }
    return "mixed_or_unknown";
}
function budgetMax(style) {
    switch (style) {
        case "low_volume_chop":
            return 8;
        case "range_bound_small_cap":
            return 12;
        case "active_runner":
            return 25;
        case "extreme_runner":
            return 40;
        default:
            return 16;
    }
}
function budgetStatus(postCount, max) {
    if (postCount <= max) {
        return "within_budget";
    }
    if (postCount <= Math.ceil(max * 1.3)) {
        return "watch";
    }
    return "over_budget";
}
function sameMinuteBurstCount(rows) {
    const buckets = new Map();
    for (const row of rows) {
        const timestamp = row.timestamp ?? 0;
        const bucket = Math.floor(timestamp / 60_000);
        buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
    }
    return [...buckets.values()].filter((count) => count >= 3).length;
}
function isUseful(row) {
    return (row.acceptanceLabel === "accepted" ||
        row.levelImportanceLabel === "major_decision" ||
        row.messageKind === "snapshot" ||
        row.operation === "post_level_snapshot" ||
        /breakout|breakdown|reclaim|resistance crossed|support crossed/i.test(`${row.eventType ?? ""} ${row.title ?? ""}`));
}
function noPostCoverage(rows) {
    if (rows.some((row) => row.whyPosted)) {
        return rows.every((row) => row.whyPosted || row.messageKind === "stock_context") ? "good" : "partial";
    }
    return "missing";
}
function isLateTraderStoryPost(row) {
    return (row.messageKind !== "stock_context" &&
        typeof row.deliveryLagMs === "number" &&
        row.deliveryLagMs > 90_000);
}
function buildExamples(rows, best) {
    const scored = rows.map((row) => {
        let score = 0;
        const reasons = [];
        if (isUseful(row)) {
            score += 4;
            reasons.push("material or structural context");
        }
        if (row.whyPosted) {
            score += 1;
        }
        if (row.noLevelReason || /none currently surfaced|no higher resistance|no lower support/i.test(text(row))) {
            score -= 5;
            reasons.push("missing next-level context");
        }
        if (row.acceptanceLabel === "weak_probe" || row.failedLevelOutcome === "probe_only") {
            score -= 2;
            reasons.push("weak probe/testing post");
        }
        if (isLateTraderStoryPost(row)) {
            score -= 3;
            reasons.push("late delivery");
        }
        return { row, score, reason: reasons.join("; ") || (best ? "clean trader context" : "needs review") };
    });
    scored.sort((left, right) => best ? right.score - left.score : left.score - right.score);
    return scored.slice(0, 4).map((item) => ({
        title: item.row.title ?? item.row.messageKind ?? "post",
        reason: item.reason,
        excerpt: excerpt(item.row),
    }));
}
function buildRecapLines(symbol, rows, params) {
    const lines = [
        `${symbol} behaved like ${params.style.replace(/_/g, " ")} and finished ${params.budgetStatus.replace(/_/g, " ")} for post count.`,
    ];
    if (params.mainSupport !== null || params.mainResistance !== null) {
        lines.push(`Main reviewed area: support ${formatLevel(params.mainSupport)} / resistance ${formatLevel(params.mainResistance)}.`);
    }
    if (params.priceRangePct !== null) {
        lines.push(`Approximate posted price range: ${params.priceRangePct.toFixed(1)}%.`);
    }
    if (params.weakProbeCount > 0) {
        lines.push(`${params.weakProbeCount} weak-probe/testing posts should be checked for repeat noise.`);
    }
    if (params.noLevelCount > 0) {
        lines.push(`${params.noLevelCount} posts had missing next-level context.`);
    }
    if (params.latePostCount > 0) {
        lines.push(`${params.latePostCount} posts had late delivery evidence.`);
    }
    if (params.sameMinuteBurstCount > 0) {
        lines.push(`${params.sameMinuteBurstCount} one-minute buckets had three or more posts.`);
    }
    const last = rows.at(-1);
    if (last?.title) {
        lines.push(`Last visible story: ${last.title}.`);
    }
    return lines;
}
export function buildDailyTraderReviewReport(auditPath) {
    const posted = readRows(auditPath)
        .filter((row) => row.symbol && isPosted(row))
        .sort((left, right) => (left.timestamp ?? 0) - (right.timestamp ?? 0));
    const bySymbol = new Map();
    for (const row of posted) {
        const symbol = symbolOf(row);
        bySymbol.set(symbol, [...(bySymbol.get(symbol) ?? []), row]);
    }
    const symbols = [...bySymbol.entries()].map(([symbol, rows]) => {
        const eventCounts = {};
        const messageKindCounts = {};
        const prices = rows.map(levelReference).filter((value) => value !== null);
        const priceLow = prices.length > 0 ? Math.min(...prices) : null;
        const priceHigh = prices.length > 0 ? Math.max(...prices) : null;
        const priceRangePct = priceLow !== null && priceHigh !== null && priceLow > 0
            ? ((priceHigh - priceLow) / priceLow) * 100
            : null;
        for (const row of rows) {
            increment(eventCounts, row.eventType);
            increment(messageKindCounts, row.messageKind ?? row.operation);
        }
        const allLevels = rows.flatMap(extractLevels);
        const supportLevels = allLevels.filter((level) => priceLow === null || level <= priceLow * 1.02);
        const resistanceLevels = allLevels.filter((level) => priceHigh === null || level >= priceHigh * 0.98);
        const mainSupport = supportLevels.length > 0 ? supportLevels.sort((left, right) => right - left)[0] : null;
        const mainResistance = resistanceLevels.length > 0 ? resistanceLevels.sort((left, right) => left - right)[0] : null;
        const expectedBudgetStyle = deriveBudgetStyle(rows, priceRangePct);
        const expectedPostBudgetMax = budgetMax(expectedBudgetStyle);
        const weakProbeCount = rows.filter((row) => row.acceptanceLabel === "weak_probe" || row.failedLevelOutcome === "probe_only" || row.acceptanceLabel === "testing").length;
        const noLevelCount = rows.filter((row) => row.noLevelReason || /none currently surfaced|no higher resistance|no lower support/i.test(text(row))).length;
        const latePostCount = rows.filter(isLateTraderStoryPost).length;
        const burstCount = sameMinuteBurstCount(rows);
        const status = budgetStatus(rows.length, expectedPostBudgetMax);
        const symbolReport = {
            symbol,
            postCount: rows.length,
            expectedBudgetStyle,
            expectedPostBudgetMax,
            budgetStatus: status,
            firstPostAt: rows[0]?.timestamp ?? 0,
            lastPostAt: rows.at(-1)?.timestamp ?? 0,
            firstTitle: rows[0]?.title,
            lastTitle: rows.at(-1)?.title,
            eventCounts,
            messageKindCounts,
            priceLow,
            priceHigh,
            priceRangePct,
            mainSupport,
            mainResistance,
            usefulPostCount: rows.filter(isUseful).length,
            weakProbeCount,
            noLevelCount,
            missingWhyPostedCount: rows.filter((row) => !row.whyPosted && row.messageKind !== "stock_context").length,
            latePostCount,
            sameMinuteBurstCount: burstCount,
            noPostEvidenceCoverage: noPostCoverage(rows),
            recapLines: [],
            bestExamples: buildExamples(rows, true),
            worstExamples: buildExamples(rows, false),
        };
        symbolReport.recapLines = buildRecapLines(symbol, rows, {
            style: expectedBudgetStyle,
            budgetStatus: status,
            mainSupport,
            mainResistance,
            priceRangePct,
            weakProbeCount,
            noLevelCount,
            latePostCount,
            sameMinuteBurstCount: burstCount,
        });
        return symbolReport;
    }).sort((left, right) => {
        const statusRank = { over_budget: 2, watch: 1, within_budget: 0 };
        return statusRank[right.budgetStatus] - statusRank[left.budgetStatus] ||
            right.postCount - left.postCount ||
            left.symbol.localeCompare(right.symbol);
    });
    return {
        generatedAt: new Date().toISOString(),
        sourceAuditPath: auditPath,
        totals: {
            symbols: symbols.length,
            posts: symbols.reduce((sum, symbol) => sum + symbol.postCount, 0),
            overBudgetSymbols: symbols.filter((symbol) => symbol.budgetStatus === "over_budget").length,
            missingNoPostEvidenceSymbols: symbols.filter((symbol) => symbol.noPostEvidenceCoverage === "missing").length,
            latePosts: symbols.reduce((sum, symbol) => sum + symbol.latePostCount, 0),
            sameMinuteBursts: symbols.reduce((sum, symbol) => sum + symbol.sameMinuteBurstCount, 0),
        },
        symbols,
    };
}
export function formatDailyTraderReviewMarkdown(report) {
    const lines = [
        "# Daily Trader Review",
        "",
        "Operator-only review of whether each symbol thread told a useful trader story without overposting.",
        "",
        `Generated: ${report.generatedAt}`,
        `Source: ${report.sourceAuditPath}`,
        "",
        "## Totals",
        "",
        `- symbols: ${report.totals.symbols}`,
        `- posts: ${report.totals.posts}`,
        `- over-budget symbols: ${report.totals.overBudgetSymbols}`,
        `- symbols missing no-post evidence: ${report.totals.missingNoPostEvidenceSymbols}`,
        `- late posts: ${report.totals.latePosts}`,
        `- same-minute bursts: ${report.totals.sameMinuteBursts}`,
        "",
    ];
    for (const symbol of report.symbols.slice(0, 80)) {
        lines.push(`## ${symbol.symbol}`, "");
        lines.push(`- post budget: ${symbol.postCount}/${symbol.expectedPostBudgetMax} (${symbol.expectedBudgetStyle}, ${symbol.budgetStatus})`);
        lines.push(`- useful / weak-probe / missing-level / late: ${symbol.usefulPostCount} / ${symbol.weakProbeCount} / ${symbol.noLevelCount} / ${symbol.latePostCount}`);
        lines.push(`- no-post evidence coverage: ${symbol.noPostEvidenceCoverage}`);
        lines.push(`- posted price range: ${formatLevel(symbol.priceLow)} - ${formatLevel(symbol.priceHigh)}${symbol.priceRangePct === null ? "" : ` (${symbol.priceRangePct.toFixed(1)}%)`}`);
        for (const line of symbol.recapLines) {
            lines.push(`- ${line}`);
        }
        lines.push("", "Best examples:");
        for (const example of symbol.bestExamples.slice(0, 2)) {
            lines.push(`- ${example.title}: ${example.reason} | ${example.excerpt}`);
        }
        lines.push("", "Worst examples:");
        for (const example of symbol.worstExamples.slice(0, 2)) {
            lines.push(`- ${example.title}: ${example.reason} | ${example.excerpt}`);
        }
        lines.push("");
    }
    return `${lines.join("\n")}\n`;
}
function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}
export function formatDailyTraderReviewHtml(report) {
    const cards = report.symbols.map((symbol) => `
    <section class="card ${symbol.budgetStatus}">
      <h2>${escapeHtml(symbol.symbol)} <span>${symbol.postCount}/${symbol.expectedPostBudgetMax} ${escapeHtml(symbol.expectedBudgetStyle)}</span></h2>
      <p>${escapeHtml(symbol.recapLines.join(" "))}</p>
      <div class="grid">
        <div><strong>Useful</strong>${symbol.usefulPostCount}</div>
        <div><strong>Weak probes</strong>${symbol.weakProbeCount}</div>
        <div><strong>Missing levels</strong>${symbol.noLevelCount}</div>
        <div><strong>Bursts</strong>${symbol.sameMinuteBurstCount}</div>
      </div>
      <h3>Best</h3>
      <ul>${symbol.bestExamples.slice(0, 3).map((example) => `<li>${escapeHtml(example.title)} - ${escapeHtml(example.reason)}</li>`).join("")}</ul>
      <h3>Worst</h3>
      <ul>${symbol.worstExamples.slice(0, 3).map((example) => `<li>${escapeHtml(example.title)} - ${escapeHtml(example.reason)}</li>`).join("")}</ul>
    </section>
  `).join("\n");
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Daily Trader Review</title>
<style>
body { font-family: Arial, sans-serif; background: #f6f8fb; color: #17202a; margin: 24px; }
.card { background: white; border: 1px solid #dbe3ee; border-left: 6px solid #16a34a; border-radius: 8px; padding: 16px; margin-bottom: 14px; }
.card.watch { border-left-color: #f59e0b; }
.card.over_budget { border-left-color: #dc2626; }
h1 { margin-bottom: 4px; }
h2 { margin: 0 0 8px; }
h2 span { color: #64748b; font-size: 13px; font-weight: normal; }
.meta { color: #64748b; margin-bottom: 20px; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; margin: 12px 0; }
.grid div { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; }
.grid strong { display: block; font-size: 12px; color: #64748b; margin-bottom: 3px; }
li { margin-bottom: 5px; }
</style>
</head>
<body>
<h1>Daily Trader Review</h1>
<div class="meta">Generated ${escapeHtml(report.generatedAt)} from ${escapeHtml(report.sourceAuditPath)}</div>
${cards || "<p>No posted rows found.</p>"}
</body>
</html>`;
}
export function writeDailyTraderReview(params) {
    const report = buildDailyTraderReviewReport(params.auditPath);
    mkdirSync(dirname(params.jsonPath), { recursive: true });
    writeFileSync(params.jsonPath, `${JSON.stringify(report, null, 2)}\n`);
    writeFileSync(params.markdownPath, formatDailyTraderReviewMarkdown(report));
    writeFileSync(params.htmlPath, formatDailyTraderReviewHtml(report));
    return report;
}
