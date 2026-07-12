import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
const DEFAULT_FORWARD_WINDOW_MINUTES = 90;
const DEFAULT_CONTINUATION_THRESHOLD_PCT = 1;
const DEFAULT_FAILURE_THRESHOLD_PCT = 1;
function readJsonLines(path) {
    if (!existsSync(path)) {
        throw new Error(`Audit file not found: ${path}`);
    }
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
function normalizeSymbol(symbol) {
    return symbol?.trim().toUpperCase() || "UNKNOWN";
}
function isoTimestamp(timestamp) {
    return Number.isFinite(timestamp) && timestamp > 0
        ? new Date(timestamp).toISOString()
        : "unknown";
}
function finiteNumber(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function eventDirection(eventType) {
    if (eventType.endsWith("_bullish")) {
        return "bullish";
    }
    if (eventType.endsWith("_bearish")) {
        return "bearish";
    }
    return "unknown";
}
function isBosChoch(eventType) {
    return (eventType === "bos_bullish" ||
        eventType === "bos_bearish" ||
        eventType === "choch_bullish" ||
        eventType === "choch_bearish");
}
function normalizeTimeframe(value) {
    return value === "daily" || value === "4h" || value === "5m" ? value : "unknown";
}
function formatPriceKey(value) {
    if (value === null || value === undefined || !Number.isFinite(value)) {
        return "na";
    }
    if (value >= 10) {
        return value.toFixed(2);
    }
    if (value >= 1) {
        return value.toFixed(3);
    }
    return value.toFixed(4);
}
function formalStructureKey(formal) {
    return formal.structureKey || [
        formal.eventType,
        formal.bias,
        formal.confirmation,
        formal.triggerTimestamp ?? "na",
        formatPriceKey(formal.brokenSwingPrice),
        formatPriceKey(formal.sweptSwingPrice),
        formatPriceKey(formal.protectedHigh),
        formatPriceKey(formal.protectedLow),
    ].join("|");
}
function prefixedFormalKey(params) {
    const timeframe = normalizeTimeframe(params.timeframe);
    if (timeframe === "unknown" || !params.key || !isBosChoch(params.eventType)) {
        return null;
    }
    return `${timeframe}|formal|${params.key}`;
}
function parseEventTypeFromKey(key) {
    const match = key.match(/\b(?:bos|choch)_(?:bullish|bearish)\b/);
    return match?.[0] ?? null;
}
function parseTimeframeFromKey(key) {
    const timeframe = key.split("|")[0];
    return normalizeTimeframe(timeframe);
}
function pushUniqueEvent(events, event) {
    if (events.some((existing) => existing.storyKey === event.storyKey)) {
        return;
    }
    events.push(event);
}
function extractRowPrice(row) {
    const referencePrice = finiteNumber(row.snapshotAudit?.referencePrice);
    if (referencePrice !== null) {
        return { price: referencePrice, source: "snapshot_reference_price" };
    }
    const body = `${row.body ?? ""}\n${row.bodyPreview ?? ""}`;
    const arrowMatch = body.match(/->\s*\$?([0-9]+(?:\.[0-9]+)?)/);
    if (arrowMatch) {
        return { price: Number(arrowMatch[1]), source: "body_outcome_price" };
    }
    const labeledMatch = body.match(/\b(?:price|last|current)\s*[:=]?\s*\$?([0-9]+(?:\.[0-9]+)?)/i);
    if (labeledMatch) {
        return { price: Number(labeledMatch[1]), source: "body_price" };
    }
    const clusterLow = finiteNumber(row.clusterLow);
    const clusterHigh = finiteNumber(row.clusterHigh);
    if (clusterLow !== null && clusterHigh !== null) {
        return { price: (clusterLow + clusterHigh) / 2, source: "cluster_midpoint" };
    }
    return null;
}
function candidateBasePrice(row, triggerPrice) {
    if (triggerPrice !== null) {
        return { price: triggerPrice, source: "broken_swing_price" };
    }
    return extractRowPrice(row);
}
function extractStructureEvents(row) {
    if (row.type !== "discord_delivery_audit" || row.status !== "posted") {
        return [];
    }
    const timestamp = row.timestamp ?? 0;
    const symbol = normalizeSymbol(row.symbol);
    const events = [];
    const explicitKeys = new Set(row.marketStructureStoryKeys?.filter(Boolean) ?? []);
    const addMetadataEvent = (params) => {
        if (params.materialChange !== true || params.freshness !== "fresh" || !isBosChoch(params.eventType)) {
            return;
        }
        const storyKey = prefixedFormalKey(params);
        if (!storyKey) {
            return;
        }
        const base = candidateBasePrice(row, finiteNumber(params.triggerPrice));
        pushUniqueEvent(events, {
            timestamp,
            isoTimestamp: isoTimestamp(timestamp),
            symbol,
            timeframe: normalizeTimeframe(params.timeframe),
            eventType: params.eventType,
            direction: eventDirection(params.eventType),
            storyKey,
            source: params.source,
            basePrice: base?.price ?? null,
            basePriceSource: base?.source ?? null,
            evidenceRows: 0,
            maxFavorablePct: null,
            maxAdversePct: null,
            bestFavorablePrice: null,
            worstAdversePrice: null,
            verdict: "insufficient_price_evidence",
            title: row.title ?? null,
        });
    };
    addMetadataEvent({
        timeframe: row.selectedFormalStructureTimeframe,
        eventType: row.selectedFormalStructureEventType,
        freshness: row.selectedFormalStructureEventFreshness,
        materialChange: row.selectedFormalStructureMaterialChange,
        key: row.selectedFormalStructureKey,
        triggerPrice: row.selectedFormalStructureBrokenSwingPrice,
        source: "selected_formal_metadata",
    });
    addMetadataEvent({
        timeframe: row.formalStructureTimeframe,
        eventType: row.formalStructureEventType,
        freshness: row.formalStructureEventFreshness,
        materialChange: row.formalStructureMaterialChange,
        key: row.formalStructureKey,
        triggerPrice: row.formalStructureBrokenSwingPrice,
        source: "formal_metadata",
    });
    for (const [timeframe, context] of Object.entries(row.marketStructure?.timeframes ?? {})) {
        const formal = context.formal;
        if (formal?.materialChange !== true ||
            formal.eventFreshness !== "fresh" ||
            !isBosChoch(formal.eventType)) {
            continue;
        }
        const storyKey = `${timeframe}|formal|${formalStructureKey(formal)}`;
        if (explicitKeys.size > 0 && !explicitKeys.has(storyKey)) {
            continue;
        }
        const base = candidateBasePrice(row, finiteNumber(formal.brokenSwingPrice));
        pushUniqueEvent(events, {
            timestamp,
            isoTimestamp: isoTimestamp(timestamp),
            symbol,
            timeframe: normalizeTimeframe(timeframe),
            eventType: formal.eventType,
            direction: eventDirection(formal.eventType),
            storyKey,
            source: "runtime_market_structure",
            basePrice: base?.price ?? null,
            basePriceSource: base?.source ?? null,
            evidenceRows: 0,
            maxFavorablePct: null,
            maxAdversePct: null,
            bestFavorablePrice: null,
            worstAdversePrice: null,
            verdict: "insufficient_price_evidence",
            title: row.title ?? null,
        });
    }
    for (const key of explicitKeys) {
        if (events.some((event) => event.storyKey === key)) {
            continue;
        }
        const eventType = parseEventTypeFromKey(key);
        if (!eventType || !isBosChoch(eventType)) {
            continue;
        }
        const base = candidateBasePrice(row, null);
        pushUniqueEvent(events, {
            timestamp,
            isoTimestamp: isoTimestamp(timestamp),
            symbol,
            timeframe: parseTimeframeFromKey(key),
            eventType,
            direction: eventDirection(eventType),
            storyKey: key,
            source: "story_key",
            basePrice: base?.price ?? null,
            basePriceSource: base?.source ?? null,
            evidenceRows: 0,
            maxFavorablePct: null,
            maxAdversePct: null,
            bestFavorablePrice: null,
            worstAdversePrice: null,
            verdict: "insufficient_price_evidence",
            title: row.title ?? null,
        });
    }
    return events;
}
function pctMove(basePrice, price, direction) {
    if (direction === "bearish") {
        return {
            favorablePct: ((basePrice - price) / basePrice) * 100,
            adversePct: ((price - basePrice) / basePrice) * 100,
        };
    }
    return {
        favorablePct: ((price - basePrice) / basePrice) * 100,
        adversePct: ((basePrice - price) / basePrice) * 100,
    };
}
function verdictFor(params) {
    const continued = params.maxFavorablePct >= params.continuationThresholdPct;
    const failed = params.maxAdversePct >= params.failureThresholdPct;
    if (continued && failed) {
        return "mixed";
    }
    if (continued) {
        return "continued";
    }
    if (failed) {
        return "failed";
    }
    return "no_follow_through";
}
function dedupeStructureEvents(events) {
    const byStory = new Map();
    for (const event of events) {
        const key = `${event.symbol}|${event.storyKey}`;
        const existing = byStory.get(key);
        if (!existing || event.timestamp < existing.timestamp) {
            byStory.set(key, event);
        }
    }
    return [...byStory.values()].sort((left, right) => left.timestamp - right.timestamp);
}
function averageNullable(values) {
    const finite = values.filter((value) => value !== null && Number.isFinite(value));
    if (finite.length === 0) {
        return null;
    }
    return Number((finite.reduce((sum, value) => sum + value, 0) / finite.length).toFixed(2));
}
function calibrateEvents(rows, settings) {
    const priceTape = new Map();
    for (const row of rows) {
        const timestamp = row.timestamp ?? 0;
        const evidence = extractRowPrice(row);
        if (!Number.isFinite(timestamp) || !evidence) {
            continue;
        }
        const symbol = normalizeSymbol(row.symbol);
        priceTape.set(symbol, [
            ...(priceTape.get(symbol) ?? []),
            {
                timestamp,
                price: evidence.price,
                source: evidence.source,
            },
        ]);
    }
    for (const entries of priceTape.values()) {
        entries.sort((left, right) => left.timestamp - right.timestamp);
    }
    const forwardWindowMs = settings.forwardWindowMinutes * 60 * 1000;
    return dedupeStructureEvents(rows.flatMap(extractStructureEvents)).map((event) => {
        if (!event.basePrice || event.basePrice <= 0 || event.direction === "unknown") {
            return event;
        }
        const future = (priceTape.get(event.symbol) ?? [])
            .filter((entry) => entry.timestamp > event.timestamp &&
            entry.timestamp <= event.timestamp + forwardWindowMs);
        if (future.length === 0) {
            return event;
        }
        let maxFavorablePct = Number.NEGATIVE_INFINITY;
        let maxAdversePct = Number.NEGATIVE_INFINITY;
        let bestFavorablePrice = null;
        let worstAdversePrice = null;
        for (const entry of future) {
            const move = pctMove(event.basePrice, entry.price, event.direction);
            if (move.favorablePct > maxFavorablePct) {
                maxFavorablePct = move.favorablePct;
                bestFavorablePrice = entry.price;
            }
            if (move.adversePct > maxAdversePct) {
                maxAdversePct = move.adversePct;
                worstAdversePrice = entry.price;
            }
        }
        const favorable = Math.max(0, maxFavorablePct);
        const adverse = Math.max(0, maxAdversePct);
        return {
            ...event,
            evidenceRows: future.length,
            maxFavorablePct: Number(favorable.toFixed(2)),
            maxAdversePct: Number(adverse.toFixed(2)),
            bestFavorablePrice,
            worstAdversePrice,
            verdict: verdictFor({
                maxFavorablePct: favorable,
                maxAdversePct: adverse,
                continuationThresholdPct: settings.continuationThresholdPct,
                failureThresholdPct: settings.failureThresholdPct,
            }),
        };
    });
}
function summarizeSymbols(events) {
    const bySymbol = new Map();
    for (const event of events) {
        bySymbol.set(event.symbol, [...(bySymbol.get(event.symbol) ?? []), event]);
    }
    return [...bySymbol.entries()].map(([symbol, symbolEvents]) => ({
        symbol,
        events: symbolEvents.length,
        continued: symbolEvents.filter((event) => event.verdict === "continued").length,
        failed: symbolEvents.filter((event) => event.verdict === "failed").length,
        mixed: symbolEvents.filter((event) => event.verdict === "mixed").length,
        noFollowThrough: symbolEvents.filter((event) => event.verdict === "no_follow_through").length,
        insufficientPriceEvidence: symbolEvents.filter((event) => event.verdict === "insufficient_price_evidence").length,
        averageMaxFavorablePct: averageNullable(symbolEvents.map((event) => event.maxFavorablePct)),
        averageMaxAdversePct: averageNullable(symbolEvents.map((event) => event.maxAdversePct)),
    })).sort((left, right) => right.events - left.events || left.symbol.localeCompare(right.symbol));
}
function buildFindings(symbols) {
    const findings = [];
    for (const symbol of symbols) {
        if (symbol.insufficientPriceEvidence > 0) {
            findings.push({
                severity: "watch",
                symbol: symbol.symbol,
                reason: "missing_forward_price_evidence",
                detail: `${symbol.insufficientPriceEvidence} BOS/CHOCH event(s) did not have later audit price rows to score.`,
            });
        }
        if (symbol.events >= 3 && symbol.failed + symbol.mixed >= Math.ceil(symbol.events * 0.5)) {
            findings.push({
                severity: "review",
                symbol: symbol.symbol,
                reason: "structure_follow_through_failure_rate",
                detail: `${symbol.failed + symbol.mixed}/${symbol.events} BOS/CHOCH event(s) failed or became mixed inside the forward window.`,
            });
        }
    }
    return findings;
}
export function buildMarketStructureOutcomeCalibrationReport(options) {
    const rows = readJsonLines(options.auditPath);
    const settings = {
        forwardWindowMinutes: options.forwardWindowMinutes ?? DEFAULT_FORWARD_WINDOW_MINUTES,
        continuationThresholdPct: options.continuationThresholdPct ?? DEFAULT_CONTINUATION_THRESHOLD_PCT,
        failureThresholdPct: options.failureThresholdPct ?? DEFAULT_FAILURE_THRESHOLD_PCT,
    };
    const events = calibrateEvents(rows, settings);
    const symbols = summarizeSymbols(events);
    const findings = buildFindings(symbols);
    return {
        generatedAt: new Date().toISOString(),
        sourceAuditPath: options.auditPath,
        settings,
        totals: {
            rowsScanned: rows.length,
            structureEvents: events.length,
            evaluatedWithPriceEvidence: events.filter((event) => event.evidenceRows > 0).length,
            continued: events.filter((event) => event.verdict === "continued").length,
            failed: events.filter((event) => event.verdict === "failed").length,
            mixed: events.filter((event) => event.verdict === "mixed").length,
            noFollowThrough: events.filter((event) => event.verdict === "no_follow_through").length,
            insufficientPriceEvidence: events.filter((event) => event.verdict === "insufficient_price_evidence").length,
            symbols: symbols.length,
            findings: findings.length,
        },
        symbols,
        events,
        findings,
    };
}
export function formatMarketStructureOutcomeCalibrationMarkdown(report) {
    const lines = [
        "# Market Structure Outcome Calibration",
        "",
        `Generated: ${report.generatedAt}`,
        `Source: ${report.sourceAuditPath}`,
        `Forward window: ${report.settings.forwardWindowMinutes} minutes`,
        "",
        "## Summary",
        "",
        `- Rows scanned: ${report.totals.rowsScanned}`,
        `- BOS/CHOCH events: ${report.totals.structureEvents}`,
        `- Evaluated with later price evidence: ${report.totals.evaluatedWithPriceEvidence}`,
        `- Continued: ${report.totals.continued}`,
        `- Failed: ${report.totals.failed}`,
        `- Mixed: ${report.totals.mixed}`,
        `- No follow-through: ${report.totals.noFollowThrough}`,
        `- Insufficient price evidence: ${report.totals.insufficientPriceEvidence}`,
    ];
    if (report.findings.length > 0) {
        lines.push("", "## Findings", "");
        for (const finding of report.findings) {
            lines.push(`- ${finding.severity.toUpperCase()} ${finding.symbol ?? "ALL"}: ${finding.reason} - ${finding.detail}`);
        }
    }
    lines.push("", "## Symbols", "");
    if (report.symbols.length === 0) {
        lines.push("- No posted BOS/CHOCH structure events found.");
    }
    else {
        for (const symbol of report.symbols) {
            lines.push(`- ${symbol.symbol}: events ${symbol.events}, continued ${symbol.continued}, failed ${symbol.failed}, mixed ${symbol.mixed}, no-follow ${symbol.noFollowThrough}, insufficient ${symbol.insufficientPriceEvidence}, avg favorable ${symbol.averageMaxFavorablePct ?? "n/a"}%, avg adverse ${symbol.averageMaxAdversePct ?? "n/a"}%`);
        }
    }
    lines.push("", "## Recent Events", "");
    for (const event of report.events.slice(-60)) {
        lines.push(`- ${event.isoTimestamp} ${event.symbol} ${event.timeframe} ${event.eventType} ${event.verdict}; base ${event.basePrice ?? "n/a"} (${event.basePriceSource ?? "n/a"}), favorable ${event.maxFavorablePct ?? "n/a"}%, adverse ${event.maxAdversePct ?? "n/a"}%, evidence rows ${event.evidenceRows}`);
    }
    return `${lines.join("\n")}\n`;
}
export function writeMarketStructureOutcomeCalibrationReport(params) {
    mkdirSync(dirname(params.jsonPath), { recursive: true });
    mkdirSync(dirname(params.markdownPath), { recursive: true });
    writeFileSync(params.jsonPath, `${JSON.stringify(params.report, null, 2)}\n`, "utf8");
    writeFileSync(params.markdownPath, formatMarketStructureOutcomeCalibrationMarkdown(params.report), "utf8");
}
