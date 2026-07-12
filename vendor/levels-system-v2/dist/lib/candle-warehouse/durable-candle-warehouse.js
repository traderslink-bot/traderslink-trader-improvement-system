import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { finalizeCandleProviderResponse } from "../market-data/candle-quality.js";
import { CandleFetchService, StubHistoricalCandleProvider, } from "../market-data/candle-fetch-service.js";
import { ibkrHistoricalContractAliasMetadata } from "../market-data/ibkr-historical-candle-provider.js";
const ONE_MINUTE_MS = 60_000;
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
function dateKey(timestamp) {
    return new Date(timestamp).toISOString().slice(0, 10);
}
function dateKeysBetween(startTimestamp, endTimestamp) {
    const keys = [];
    const dayMs = 24 * 60 * 60 * 1000;
    const start = Math.floor(startTimestamp / dayMs) * dayMs;
    const end = Math.floor(endTimestamp / dayMs) * dayMs;
    for (let timestamp = start; timestamp <= end; timestamp += dayMs) {
        keys.push(dateKey(timestamp));
    }
    return keys;
}
function rowKey(row) {
    return String(row.timestamp);
}
function sortCandles(candles) {
    return [...candles].sort((left, right) => left.timestamp - right.timestamp);
}
function uniqueSortedCandles(candles) {
    const byTimestamp = new Map();
    for (const candle of candles) {
        if (Number.isFinite(candle.timestamp)) {
            byTimestamp.set(candle.timestamp, candle);
        }
    }
    return sortCandles([...byTimestamp.values()]);
}
function buildRequestedRange(request) {
    const intervalMs = timeframeMs(request.timeframe);
    const rawEnd = request.endTimeMs ?? Date.now();
    const endTimestamp = Math.floor(rawEnd / intervalMs) * intervalMs;
    return {
        endTimestamp,
        startTimestamp: endTimestamp - request.lookbackBars * intervalMs,
        intervalMs,
    };
}
function sessionMetadataAvailable(timeframe) {
    return timeframe === "1m" || timeframe === "5m";
}
function warehouseProviderMetadata(params) {
    if (params.provider === "ibkr") {
        return ibkrHistoricalContractAliasMetadata(params.symbol);
    }
    return {};
}
function metadataString(metadata, key) {
    const value = metadata?.[key];
    return typeof value === "string" && value.trim() ? value : null;
}
function metadataNumber(metadata, key) {
    const value = metadata?.[key];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function metadataBoolean(metadata, key) {
    return metadata?.[key] === true;
}
function adjustmentModeFrom(value, fallback) {
    return value === "raw" || value === "split_adjusted" || value === "unknown" ? value : fallback;
}
function buildSourceMetadata(params) {
    const symbol = normalizeSymbol(params.symbol);
    const providerMetadata = {
        ...warehouseProviderMetadata({
            provider: params.provider,
            symbol,
        }),
        ...params.providerMetadata,
    };
    const warehouseAdjustmentMode = adjustmentModeFrom(params.sourceMetadata?.warehouseAdjustmentMode, "raw");
    const providerAdjustmentMode = adjustmentModeFrom(params.sourceMetadata?.providerAdjustmentMode ?? metadataString(providerMetadata, "providerAdjustmentMode"), warehouseAdjustmentMode);
    return {
        provider: params.sourceMetadata?.provider ?? params.provider,
        requestedSymbol: params.sourceMetadata?.requestedSymbol ??
            metadataString(providerMetadata, "ibkrRequestedSymbol") ??
            symbol,
        resolvedSymbol: params.sourceMetadata?.resolvedSymbol ??
            metadataString(providerMetadata, "ibkrResolvedSymbol") ??
            symbol,
        resolvedConId: params.sourceMetadata?.resolvedConId ??
            metadataNumber(providerMetadata, "ibkrResolvedConId"),
        resolvedExchange: params.sourceMetadata?.resolvedExchange ??
            metadataString(providerMetadata, "ibkrResolvedExchange"),
        resolvedPrimaryExchange: params.sourceMetadata?.resolvedPrimaryExchange ??
            metadataString(providerMetadata, "ibkrResolvedPrimaryExchange"),
        sourceFetchedAt: params.sourceMetadata?.sourceFetchedAt ?? params.sourceFetchedAt,
        whatToShow: params.sourceMetadata?.whatToShow ??
            metadataString(providerMetadata, "whatToShow"),
        useRTH: params.sourceMetadata?.useRTH ??
            (typeof providerMetadata?.useRTH === "boolean" ? providerMetadata.useRTH : null),
        providerAdjustmentMode,
        warehouseAdjustmentMode,
        aliasUsed: params.sourceMetadata?.aliasUsed ??
            metadataBoolean(providerMetadata, "ibkrContractAliasUsed"),
        aliasReason: params.sourceMetadata?.aliasReason ??
            metadataString(providerMetadata, "ibkrHistoricalAliasReason"),
        basisValidationStatus: params.sourceMetadata?.basisValidationStatus ??
            "basis_unchecked",
        requestedStartTimestamp: params.sourceMetadata?.requestedStartTimestamp,
        requestedEndTimestamp: params.sourceMetadata?.requestedEndTimestamp,
        requestedLookbackBars: params.sourceMetadata?.requestedLookbackBars,
        actualBarsReturned: params.sourceMetadata?.actualBarsReturned,
        completenessStatus: params.sourceMetadata?.completenessStatus,
        validationIssueCodes: params.sourceMetadata?.validationIssueCodes,
    };
}
function candleFromRow(row) {
    return {
        timestamp: row.timestamp,
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
        volume: row.volume,
    };
}
function rowMetadataForReplay(rows) {
    return rows.find((row) => row.sourceMetadata)?.sourceMetadata ?? null;
}
function replayProviderMetadata(params) {
    const source = rowMetadataForReplay(params.rows);
    const fallback = warehouseProviderMetadata({
        provider: params.provider,
        symbol: params.symbol,
    });
    if (!source) {
        return fallback;
    }
    return {
        ...fallback,
        warehouseRequestedSymbol: source.requestedSymbol,
        warehouseResolvedSymbol: source.resolvedSymbol,
        warehouseResolvedConId: source.resolvedConId,
        warehouseResolvedExchange: source.resolvedExchange,
        warehouseResolvedPrimaryExchange: source.resolvedPrimaryExchange,
        warehouseSourceFetchedAt: source.sourceFetchedAt,
        warehouseWhatToShow: source.whatToShow,
        warehouseUseRTH: source.useRTH,
        warehouseProviderAdjustmentMode: source.providerAdjustmentMode,
        warehouseAdjustmentMode: source.warehouseAdjustmentMode,
        warehouseAliasUsed: source.aliasUsed,
        warehouseAliasReason: source.aliasReason,
        warehouseBasisValidationStatus: source.basisValidationStatus,
        warehouseRequestedStartTimestamp: source.requestedStartTimestamp ?? null,
        warehouseRequestedEndTimestamp: source.requestedEndTimestamp ?? null,
        warehouseRequestedLookbackBars: source.requestedLookbackBars ?? null,
        warehouseActualBarsReturned: source.actualBarsReturned ?? null,
        warehouseCompletenessStatus: source.completenessStatus ?? null,
        warehouseValidationIssueCodes: source.validationIssueCodes?.join(",") ?? null,
        ibkrRequestedSymbol: source.requestedSymbol,
        ibkrResolvedSymbol: source.resolvedSymbol,
        ibkrResolvedConId: source.resolvedConId,
        ibkrResolvedExchange: source.resolvedExchange,
        ibkrResolvedPrimaryExchange: source.resolvedPrimaryExchange,
        ibkrContractAliasUsed: source.aliasUsed,
        ibkrHistoricalAliasReason: source.aliasReason,
    };
}
export class DurableCandleWarehouse {
    rootDirectoryPath;
    constructor(rootDirectoryPath) {
        this.rootDirectoryPath = rootDirectoryPath;
    }
    directoryPath(params) {
        return join(this.rootDirectoryPath, params.provider, normalizeSymbol(params.symbol), params.timeframe);
    }
    filePath(params) {
        return join(this.directoryPath(params), `${params.date}.jsonl`);
    }
    async upsertCandles(request) {
        const symbol = normalizeSymbol(request.symbol);
        const candles = uniqueSortedCandles(request.candles);
        const sourceFetchedAt = request.sourceFetchedAt ?? Date.now();
        const sourceMetadata = buildSourceMetadata({
            provider: request.provider,
            symbol,
            sourceFetchedAt,
            sourceMetadata: request.sourceMetadata,
        });
        const byDate = new Map();
        for (const candle of candles) {
            const key = dateKey(candle.timestamp);
            byDate.set(key, [
                ...(byDate.get(key) ?? []),
                {
                    ...candle,
                    symbol,
                    provider: request.provider,
                    timeframe: request.timeframe,
                    sourceFetchedAt,
                    adjustmentMode: sourceMetadata.warehouseAdjustmentMode,
                    sourceMetadata,
                },
            ]);
        }
        for (const [date, rows] of byDate) {
            const path = this.filePath({
                provider: request.provider,
                symbol,
                timeframe: request.timeframe,
                date,
            });
            const existing = await this.readRowsFromFile(path);
            const merged = new Map();
            for (const row of [...existing, ...rows]) {
                merged.set(rowKey(row), row);
            }
            await this.writeRowsToFile(path, sortCandles([...merged.values()]));
        }
        return this.getCoverage({
            provider: request.provider,
            symbol,
            timeframe: request.timeframe,
            startTimestamp: candles[0]?.timestamp ?? 0,
            endTimestamp: candles.at(-1)?.timestamp ?? 0,
        });
    }
    async getCandles(request) {
        return (await this.getCandleRows(request)).map(candleFromRow);
    }
    async getCandleRows(request) {
        const rows = [];
        for (const date of dateKeysBetween(request.startTimestamp, request.endTimestamp)) {
            const path = this.filePath({
                provider: request.provider,
                symbol: request.symbol,
                timeframe: request.timeframe,
                date,
            });
            rows.push(...await this.readRowsFromFile(path));
        }
        return uniqueSortedCandles(rows
            .filter((row) => row.timestamp >= request.startTimestamp && row.timestamp <= request.endTimestamp));
    }
    async getCoverage(request) {
        const candles = await this.getCandles(request);
        return {
            provider: request.provider,
            symbol: normalizeSymbol(request.symbol),
            timeframe: request.timeframe,
            candleCount: candles.length,
            startTimestamp: candles[0]?.timestamp ?? null,
            endTimestamp: candles.at(-1)?.timestamp ?? null,
        };
    }
    async findMissingRanges(request) {
        const intervalMs = timeframeMs(request.timeframe);
        const candles = await this.getCandles(request);
        const existing = new Set(candles.map((candle) => candle.timestamp));
        const missing = [];
        let currentMissingStart = null;
        for (let timestamp = Math.floor(request.startTimestamp / intervalMs) * intervalMs; timestamp <= request.endTimestamp; timestamp += intervalMs) {
            const hasCandle = existing.has(timestamp);
            if (!hasCandle && currentMissingStart === null) {
                currentMissingStart = timestamp;
            }
            if (hasCandle && currentMissingStart !== null) {
                missing.push({
                    startTimestamp: currentMissingStart,
                    endTimestamp: timestamp - intervalMs,
                });
                currentMissingStart = null;
            }
        }
        if (currentMissingStart !== null) {
            missing.push({
                startTimestamp: currentMissingStart,
                endTimestamp: Math.floor(request.endTimestamp / intervalMs) * intervalMs,
            });
        }
        return missing;
    }
    async listSymbols(provider) {
        try {
            const entries = await readdir(join(this.rootDirectoryPath, provider), { withFileTypes: true });
            return entries
                .filter((entry) => entry.isDirectory())
                .map((entry) => entry.name.toUpperCase())
                .sort();
        }
        catch (error) {
            if (error.code === "ENOENT") {
                return [];
            }
            throw error;
        }
    }
    async readRowsFromFile(path) {
        try {
            const raw = await readFile(path, "utf8");
            return raw
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(Boolean)
                .flatMap((line) => {
                try {
                    const parsed = JSON.parse(line);
                    return Number.isFinite(parsed.timestamp) ? [parsed] : [];
                }
                catch {
                    return [];
                }
            });
        }
        catch (error) {
            if (error.code === "ENOENT") {
                return [];
            }
            throw error;
        }
    }
    async writeRowsToFile(path, rows) {
        await mkdir(dirname(path), { recursive: true });
        const tempPath = `${path}.tmp`;
        await writeFile(tempPath, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");
        await rename(tempPath, path);
    }
}
export class DurableCandleWarehouseFetchService extends CandleFetchService {
    warehouse;
    delegate;
    mode;
    constructor(options) {
        super(new StubHistoricalCandleProvider());
        this.warehouse = options.warehouse;
        this.delegate = options.delegate;
        this.mode = options.mode ?? "read_write";
    }
    getProviderName() {
        return this.delegate.getProviderName();
    }
    async fetchCandles(request) {
        const symbol = normalizeSymbol(request.symbol);
        const provider = request.preferredProvider ?? this.delegate.getProviderName();
        const range = buildRequestedRange(request);
        const warehouseRequest = {
            provider,
            symbol,
            timeframe: request.timeframe,
            startTimestamp: range.startTimestamp,
            endTimestamp: range.endTimestamp,
        };
        if (this.mode !== "refresh") {
            const storedRows = await this.warehouse.getCandleRows(warehouseRequest);
            const storedCandles = storedRows.map(candleFromRow);
            if (storedRows.length >= request.lookbackBars) {
                return this.buildWarehouseResponse(request, provider, storedRows.slice(-request.lookbackBars), {
                    cacheStatus: "hit",
                });
            }
            if (this.canReplayStoredPartialProviderResponse({
                request,
                range,
                rows: storedRows,
            })) {
                return this.buildWarehouseResponse(request, provider, storedRows, {
                    cacheStatus: "provider_partial_hit",
                    durableWarehousePartial: true,
                    durableWarehouseStoredCandles: storedCandles.length,
                    durableWarehouseRequestedLookbackBars: request.lookbackBars,
                });
            }
            if (this.mode === "replay" && storedRows.length > 0) {
                return this.buildWarehouseResponse(request, provider, storedRows, {
                    cacheStatus: "partial_hit",
                    durableWarehousePartial: true,
                    durableWarehouseStoredCandles: storedCandles.length,
                    durableWarehouseRequestedLookbackBars: request.lookbackBars,
                });
            }
            if (this.mode === "replay") {
                throw new Error(`Durable candle warehouse miss for ${symbol} ${request.timeframe}; found ${storedCandles.length}/${request.lookbackBars} candles.`);
            }
        }
        const fresh = await this.delegate.fetchCandles(request);
        await this.warehouse.upsertCandles({
            provider: fresh.provider,
            symbol: fresh.symbol,
            timeframe: fresh.timeframe,
            candles: fresh.candles,
            sourceFetchedAt: fresh.fetchEndTimestamp,
            sourceMetadata: buildSourceMetadata({
                provider: fresh.provider,
                symbol: fresh.symbol,
                sourceFetchedAt: fresh.fetchEndTimestamp,
                providerMetadata: fresh.providerMetadata,
                sourceMetadata: {
                    requestedStartTimestamp: fresh.requestedStartTimestamp,
                    requestedEndTimestamp: fresh.requestedEndTimestamp,
                    requestedLookbackBars: fresh.requestedLookbackBars,
                    actualBarsReturned: fresh.actualBarsReturned,
                    completenessStatus: fresh.completenessStatus,
                    validationIssueCodes: fresh.validationIssues.map((issue) => issue.code),
                },
            }),
        });
        return {
            ...fresh,
            providerMetadata: {
                ...fresh.providerMetadata,
                durableWarehouse: "write_through",
                durableWarehouseMode: this.mode,
            },
        };
    }
    buildWarehouseResponse(request, provider, rows, metadata) {
        const range = buildRequestedRange(request);
        const candles = rows.map(candleFromRow);
        const response = {
            provider,
            symbol: normalizeSymbol(request.symbol),
            timeframe: request.timeframe,
            requestedLookbackBars: request.lookbackBars,
            candles: sortCandles(candles),
            fetchStartTimestamp: Date.now(),
            fetchEndTimestamp: Date.now(),
            requestedStartTimestamp: range.startTimestamp,
            requestedEndTimestamp: range.endTimestamp,
            sessionMetadataAvailable: sessionMetadataAvailable(request.timeframe),
            providerMetadata: {
                durableWarehouse: "read",
                ...replayProviderMetadata({
                    provider,
                    symbol: request.symbol,
                    rows,
                }),
                ...metadata,
            },
        };
        return finalizeCandleProviderResponse(response);
    }
    canReplayStoredPartialProviderResponse(params) {
        if (params.rows.length === 0) {
            return false;
        }
        const source = rowMetadataForReplay(params.rows);
        if (!source) {
            return false;
        }
        const previousRequestWasAtLeastAsWide = typeof source.requestedStartTimestamp === "number" &&
            typeof source.requestedEndTimestamp === "number" &&
            source.requestedStartTimestamp <=
                ((params.request.endTimeMs ?? params.range.endTimestamp) -
                    params.request.lookbackBars * params.range.intervalMs) &&
            source.requestedEndTimestamp >= params.range.endTimestamp &&
            source.requestedEndTimestamp <=
                (params.request.endTimeMs ?? params.range.endTimestamp);
        const previousLookbackWasAtLeastAsLarge = typeof source.requestedLookbackBars === "number" &&
            source.requestedLookbackBars >= params.request.lookbackBars;
        const storedRowsMatchPreviousProviderCount = typeof source.actualBarsReturned === "number" &&
            source.actualBarsReturned === params.rows.length;
        const previousResponseWasShortButUsable = source.completenessStatus === "partial" &&
            (source.validationIssueCodes ?? []).every((code) => code === "insufficient_bars" || code === "suspicious_gap");
        return (previousRequestWasAtLeastAsWide &&
            previousLookbackWasAtLeastAsLarge &&
            storedRowsMatchPreviousProviderCount &&
            previousResponseWasShortButUsable);
    }
}
