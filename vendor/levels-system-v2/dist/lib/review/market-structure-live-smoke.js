import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { buildFormalMarketStructureGateAuditReport } from "./formal-market-structure-gate-audit.js";
function discoverAuditFiles(root) {
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
    return found.sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs);
}
function resolveAuditPath(input) {
    const resolvedInput = resolve(input ?? join("artifacts", "long-run"));
    if (existsSync(resolvedInput) && statSync(resolvedInput).isFile()) {
        return resolvedInput;
    }
    const direct = join(resolvedInput, "discord-delivery-audit.jsonl");
    if (existsSync(direct)) {
        return direct;
    }
    const latest = discoverAuditFiles(resolvedInput)[0];
    if (!latest) {
        throw new Error(`No discord-delivery-audit.jsonl file found under ${resolvedInput}`);
    }
    return latest;
}
function readJsonLines(path) {
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
function visibleStoryKeys(row) {
    if (row.status !== "posted" || row.marketStructureStoryVisible !== true) {
        return [];
    }
    return row.marketStructureStoryKeys?.filter(Boolean) ?? [];
}
function check(name, status, detail, count) {
    return { name, status, detail, ...(count !== undefined ? { count } : {}) };
}
export function buildMarketStructureLiveSmokeReport(options = {}) {
    const auditPath = resolveAuditPath(options.input);
    const rows = readJsonLines(auditPath).filter((row) => row.type === "discord_delivery_audit");
    const gateReport = buildFormalMarketStructureGateAuditReport(auditPath);
    const postedRows = rows.filter((row) => row.status === "posted").length;
    const visibleKeys = rows.flatMap(visibleStoryKeys);
    const visibleFormal5mStoryKeys = visibleKeys.filter((key) => key.startsWith("5m|formal|")).length;
    const visibleHigherTimeframeFormalStoryKeys = visibleKeys.filter((key) => key.startsWith("4h|formal|") || key.startsWith("daily|formal|")).length;
    const visibleStable5mStoryKeys = visibleKeys.filter((key) => key.startsWith("5m|stable|")).length;
    const actionableFormalEvents = gateReport.events.filter((event) => event.decision === "actionable").length;
    const metadataOnlyFormalEvents = gateReport.events.filter((event) => event.decision === "metadata_only").length;
    const actionableTacticalFormalEvents = gateReport.events.filter((event) => event.timeframe === "5m" && event.decision === "actionable").length;
    const checks = [
        check("audit_rows_present", rows.length > 0 && postedRows > 0 ? "pass" : "fail", `${rows.length} audit row(s), ${postedRows} posted row(s) found.`, rows.length),
        check("tactical_formal_hidden", visibleFormal5mStoryKeys === 0 && actionableTacticalFormalEvents === 0 ? "pass" : "fail", `${visibleFormal5mStoryKeys} visible 5m formal story key(s), ${actionableTacticalFormalEvents} actionable 5m formal event(s).`, visibleFormal5mStoryKeys + actionableTacticalFormalEvents),
        check("higher_timeframe_formal_lane", visibleHigherTimeframeFormalStoryKeys > 0 || actionableFormalEvents > 0 ? "pass" : "warn", `${visibleHigherTimeframeFormalStoryKeys} visible 4h/daily formal story key(s), ${actionableFormalEvents} actionable formal event(s). No event is acceptable if the session did not print fresh higher-timeframe BOS/CHOCH.`, Math.max(visibleHigherTimeframeFormalStoryKeys, actionableFormalEvents)),
        check("stable_5m_lane", visibleStable5mStoryKeys > 0 ? "pass" : "warn", `${visibleStable5mStoryKeys} visible 5m stable story key(s). No event is acceptable if the session did not produce a material stable 5m change.`, visibleStable5mStoryKeys),
        check("formal_metadata_lane", metadataOnlyFormalEvents > 0 ? "pass" : "warn", `${metadataOnlyFormalEvents} formal BOS/CHOCH event(s) kept metadata-only.`, metadataOnlyFormalEvents),
    ];
    return {
        generatedAt: new Date().toISOString(),
        sourceAuditPath: auditPath,
        session: basename(dirname(auditPath)),
        ok: checks.every((item) => item.status !== "fail"),
        totals: {
            rowsScanned: rows.length,
            postedRows,
            visibleFormal5mStoryKeys,
            visibleHigherTimeframeFormalStoryKeys,
            visibleStable5mStoryKeys,
            actionableFormalEvents,
            metadataOnlyFormalEvents,
        },
        checks,
    };
}
export function formatMarketStructureLiveSmokeMarkdown(report) {
    const lines = [
        "# Market Structure Live Smoke",
        "",
        `Generated: ${report.generatedAt}`,
        `Source: ${report.sourceAuditPath}`,
        `Session: ${report.session}`,
        `Overall: ${report.ok ? "pass" : "fail"}`,
        "",
        "## Totals",
        "",
        `- rows scanned: ${report.totals.rowsScanned}`,
        `- posted rows: ${report.totals.postedRows}`,
        `- visible 5m formal story keys: ${report.totals.visibleFormal5mStoryKeys}`,
        `- visible 4h/daily formal story keys: ${report.totals.visibleHigherTimeframeFormalStoryKeys}`,
        `- visible 5m stable story keys: ${report.totals.visibleStable5mStoryKeys}`,
        `- actionable formal events: ${report.totals.actionableFormalEvents}`,
        `- metadata-only formal events: ${report.totals.metadataOnlyFormalEvents}`,
        "",
        "## Checks",
        "",
        "| Check | Status | Detail |",
        "| --- | --- | --- |",
        ...report.checks.map((item) => `| ${item.name} | ${item.status} | ${item.detail.replace(/\|/g, "\\|")} |`),
        "",
    ];
    return `${lines.join("\n")}\n`;
}
export function writeMarketStructureLiveSmokeReport(params) {
    mkdirSync(dirname(params.jsonPath), { recursive: true });
    mkdirSync(dirname(params.markdownPath), { recursive: true });
    writeFileSync(params.jsonPath, `${JSON.stringify(params.report, null, 2)}\n`, "utf8");
    writeFileSync(params.markdownPath, formatMarketStructureLiveSmokeMarkdown(params.report), "utf8");
}
