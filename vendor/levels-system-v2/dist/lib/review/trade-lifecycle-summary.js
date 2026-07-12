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
function isPosted(row) {
    return row.status === "posted" || row.status === "success";
}
function text(row) {
    return [row.title, row.body, row.bodyPreview].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}
function extractPrice(row) {
    if (typeof row.triggerPrice === "number" && Number.isFinite(row.triggerPrice)) {
        return row.triggerPrice;
    }
    if (typeof row.targetPrice === "number" && Number.isFinite(row.targetPrice)) {
        return row.targetPrice;
    }
    const match = text(row).match(/\b(?:Price|Triggered near):\s*(\d+(?:\.\d{1,4})?)/i);
    const value = match?.[1] ? Number(match[1]) : NaN;
    return Number.isFinite(value) ? value : null;
}
function extractArea(row, label) {
    const value = text(row);
    const regex = label === "support"
        ? /\b(?:Main support|Support that matters|Support):\s*([^.;\n]+)/i
        : /\b(?:Main resistance|Cleaner above|Resistance):\s*([^.;\n]+)/i;
    const match = value.match(regex);
    return match?.[1]?.trim() ?? null;
}
function deriveFinalState(rows) {
    if (rows.length === 0) {
        return "insufficient_data";
    }
    const latest = rows[rows.length - 1];
    if (latest.behaviorBudgetLabel === "extreme_runner") {
        return "extended_runner";
    }
    if (latest.tradeStoryState === "breakout_accepted") {
        return "breakout_working";
    }
    if (latest.tradeStoryState === "breakout_failed") {
        return "breakout_failed";
    }
    if (latest.tradeStoryState === "support_lost") {
        return "support_damaged";
    }
    if (latest.behaviorBudgetLabel === "boring_range" || latest.tradeStoryState === "building") {
        return "range_bound";
    }
    if (Date.now() - (latest.timestamp ?? Date.now()) > 24 * 60 * 60 * 1000) {
        return "dead_thread";
    }
    return "still_valid";
}
export function buildTradeLifecycleSummaryReport(auditPath) {
    const rows = readRows(auditPath)
        .filter((row) => row.symbol && row.operation === "post_alert" && isPosted(row))
        .sort((left, right) => (left.timestamp ?? 0) - (right.timestamp ?? 0));
    const bySymbol = new Map();
    for (const row of rows) {
        const symbol = row.symbol.trim().toUpperCase();
        bySymbol.set(symbol, [...(bySymbol.get(symbol) ?? []), row]);
    }
    const symbols = [...bySymbol.entries()].map(([symbol, symbolRows]) => {
        const prices = symbolRows.map(extractPrice).filter((price) => price !== null);
        const breakout = symbolRows.find((row) => row.eventType === "breakout");
        const support = symbolRows.find((row) => row.eventType === "level_touch" && /support/i.test(text(row)));
        const mainSupport = symbolRows.map((row) => extractArea(row, "support")).find(Boolean) ?? null;
        const mainResistance = symbolRows.map((row) => extractArea(row, "resistance")).find(Boolean) ?? null;
        const finalState = deriveFinalState(symbolRows);
        const recap = [
            `${symbol} finished as ${finalState.replaceAll("_", " ")}.`,
            prices.length > 0 ? `Price evidence moved from ${prices[0]} to ${prices[prices.length - 1]}.` : "No usable price markers were available in posted audit rows.",
            mainSupport ? `Main support reference: ${mainSupport}.` : "Main support was not clearly extractable from saved posts.",
            mainResistance ? `Main resistance reference: ${mainResistance}.` : "Main resistance was not clearly extractable from saved posts.",
        ];
        return {
            symbol,
            finalState,
            postCount: symbolRows.length,
            firstPostAt: symbolRows[0]?.timestamp ?? null,
            lastPostAt: symbolRows[symbolRows.length - 1]?.timestamp ?? null,
            startingPrice: prices[0] ?? null,
            endingPrice: prices[prices.length - 1] ?? null,
            mainSupport,
            mainResistance,
            bestBreakoutAttempt: breakout ? text(breakout).slice(0, 220) : null,
            bestSupportEvent: support ? text(support).slice(0, 220) : null,
            recap,
        };
    }).sort((left, right) => right.postCount - left.postCount || left.symbol.localeCompare(right.symbol));
    return {
        generatedAt: new Date().toISOString(),
        sourceAuditPath: auditPath,
        symbols,
    };
}
export function formatTradeLifecycleSummaryMarkdown(report) {
    const lines = [
        "# Trade Lifecycle Summary",
        "",
        `Generated: ${report.generatedAt}`,
        `Source: ${report.sourceAuditPath}`,
        "",
    ];
    for (const symbol of report.symbols.slice(0, 50)) {
        lines.push(`## ${symbol.symbol} - ${symbol.finalState}`);
        lines.push(`- posts: ${symbol.postCount}`);
        lines.push(`- starting price: ${symbol.startingPrice ?? "n/a"}`);
        lines.push(`- ending price: ${symbol.endingPrice ?? "n/a"}`);
        for (const item of symbol.recap) {
            lines.push(`- ${item}`);
        }
        if (symbol.bestBreakoutAttempt) {
            lines.push(`- breakout evidence: ${symbol.bestBreakoutAttempt}`);
        }
        if (symbol.bestSupportEvent) {
            lines.push(`- support evidence: ${symbol.bestSupportEvent}`);
        }
        lines.push("");
    }
    return lines.join("\n");
}
export function writeTradeLifecycleSummaryReport(params) {
    const report = buildTradeLifecycleSummaryReport(params.auditPath);
    mkdirSync(dirname(params.jsonPath), { recursive: true });
    writeFileSync(params.jsonPath, `${JSON.stringify(report, null, 2)}\n`);
    writeFileSync(params.markdownPath, formatTradeLifecycleSummaryMarkdown(report));
    return report;
}
