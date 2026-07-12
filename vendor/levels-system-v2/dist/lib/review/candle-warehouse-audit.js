import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
async function listDirectories(path) {
    try {
        const entries = await readdir(path, { withFileTypes: true });
        return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
    }
    catch (error) {
        if (error.code === "ENOENT") {
            return [];
        }
        throw error;
    }
}
async function listJsonlFiles(path) {
    try {
        const entries = await readdir(path, { withFileTypes: true });
        return entries.filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl")).map((entry) => entry.name).sort();
    }
    catch (error) {
        if (error.code === "ENOENT") {
            return [];
        }
        throw error;
    }
}
function validOhlc(row) {
    return (Number.isFinite(row.timestamp) &&
        Number.isFinite(row.open) &&
        Number.isFinite(row.high) &&
        Number.isFinite(row.low) &&
        Number.isFinite(row.close) &&
        Number.isFinite(row.volume) &&
        row.high >= Math.max(row.open, row.close, row.low) &&
        row.low <= Math.min(row.open, row.close, row.high));
}
async function readRows(path) {
    const raw = await readFile(path, "utf8");
    const rows = [];
    let invalidRows = 0;
    for (const line of raw.split(/\r?\n/)) {
        if (!line.trim()) {
            continue;
        }
        try {
            const parsed = JSON.parse(line);
            if (!validOhlc(parsed)) {
                invalidRows += 1;
            }
            rows.push(parsed);
        }
        catch {
            invalidRows += 1;
        }
    }
    return { rows, invalidRows };
}
export async function buildCandleWarehouseAuditReport(rootDirectoryPath = "data/candles") {
    const providers = await listDirectories(rootDirectoryPath);
    const symbols = [];
    for (const provider of providers) {
        for (const symbol of await listDirectories(join(rootDirectoryPath, provider))) {
            for (const timeframe of await listDirectories(join(rootDirectoryPath, provider, symbol))) {
                const directory = join(rootDirectoryPath, provider, symbol, timeframe);
                const files = await listJsonlFiles(directory);
                const timestamps = new Set();
                let rows = 0;
                let invalidRows = 0;
                let duplicateTimestamps = 0;
                let zeroVolumeRows = 0;
                let firstTimestamp = null;
                let lastTimestamp = null;
                for (const file of files) {
                    const parsed = await readRows(join(directory, file));
                    invalidRows += parsed.invalidRows;
                    for (const row of parsed.rows) {
                        rows += 1;
                        if (timestamps.has(row.timestamp)) {
                            duplicateTimestamps += 1;
                        }
                        timestamps.add(row.timestamp);
                        if (row.volume <= 0) {
                            zeroVolumeRows += 1;
                        }
                        firstTimestamp = firstTimestamp === null ? row.timestamp : Math.min(firstTimestamp, row.timestamp);
                        lastTimestamp = lastTimestamp === null ? row.timestamp : Math.max(lastTimestamp, row.timestamp);
                    }
                }
                const status = invalidRows > 0 || rows === 0
                    ? "broken"
                    : duplicateTimestamps > 0 || zeroVolumeRows > Math.max(5, rows * 0.25)
                        ? "watch"
                        : "healthy";
                symbols.push({
                    provider,
                    symbol,
                    timeframe,
                    files: files.length,
                    rows,
                    duplicateTimestamps,
                    invalidRows,
                    zeroVolumeRows,
                    firstTimestamp,
                    lastTimestamp,
                    status,
                });
            }
        }
    }
    return {
        rootDirectoryPath,
        generatedAt: new Date().toISOString(),
        providerCount: providers.length,
        symbolTimeframeCount: symbols.length,
        totalRows: symbols.reduce((sum, item) => sum + item.rows, 0),
        brokenCount: symbols.filter((item) => item.status === "broken").length,
        watchCount: symbols.filter((item) => item.status === "watch").length,
        symbols,
    };
}
export function formatCandleWarehouseAuditReport(report) {
    const lines = [
        "# Candle Warehouse Audit",
        "",
        `Generated: ${report.generatedAt}`,
        `Root: ${report.rootDirectoryPath}`,
        "",
        `- providers: ${report.providerCount}`,
        `- symbol/timeframe groups: ${report.symbolTimeframeCount}`,
        `- total rows: ${report.totalRows}`,
        `- watch groups: ${report.watchCount}`,
        `- broken groups: ${report.brokenCount}`,
        "",
        "| Provider | Symbol | Timeframe | Status | Files | Rows | Duplicates | Invalid | Zero Volume | First | Last |",
        "| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |",
    ];
    for (const item of report.symbols) {
        lines.push(`| ${item.provider} | ${item.symbol} | ${item.timeframe} | ${item.status} | ${item.files} | ${item.rows} | ${item.duplicateTimestamps} | ${item.invalidRows} | ${item.zeroVolumeRows} | ${item.firstTimestamp ? new Date(item.firstTimestamp).toISOString() : "n/a"} | ${item.lastTimestamp ? new Date(item.lastTimestamp).toISOString() : "n/a"} |`);
    }
    return `${lines.join("\n")}\n`;
}
export async function writeCandleWarehouseAuditReport(params) {
    const outDir = params.outDir ?? "artifacts/candle-warehouse-audit";
    await mkdir(outDir, { recursive: true });
    const jsonPath = join(outDir, "candle-warehouse-audit.json");
    const markdownPath = join(outDir, "candle-warehouse-audit.md");
    await writeFile(jsonPath, `${JSON.stringify(params.report, null, 2)}\n`, "utf8");
    await writeFile(markdownPath, formatCandleWarehouseAuditReport(params.report), "utf8");
    return { jsonPath, markdownPath };
}
