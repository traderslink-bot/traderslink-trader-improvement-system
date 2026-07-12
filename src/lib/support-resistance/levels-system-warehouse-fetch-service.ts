import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type {
  Candle,
  CandleFetchTimeframe,
  CandleProviderResponse,
  HistoricalFetchRequest,
} from "levels-system-v2/support-resistance-engine";

type CandleProviderName = CandleProviderResponse["provider"];

type CandleFetchClient = {
  getProviderName?: () => CandleProviderName;
  fetchCandles(request: HistoricalFetchRequest): Promise<CandleProviderResponse>;
};

type WarehouseMode = "read_write" | "refresh" | "replay";

type WarehouseRow = Candle & {
  provider?: CandleProviderName;
  symbol?: string;
  timeframe?: CandleFetchTimeframe;
  sourceFetchedAt?: number;
  adjustmentMode?: string;
  sourceMetadata?: Record<string, unknown>;
};

type ValidationCacheEntry = {
  cachedAt?: number;
  request?: {
    endTimeMs?: number;
    lookbackBars?: number;
    provider?: CandleProviderName;
    symbol?: string;
    timeframe?: CandleFetchTimeframe;
  };
  response?: CandleProviderResponse;
  schemaVersion?: number;
};

export class LevelsSystemWarehouseBackedFetchService implements CandleFetchClient {
  constructor(
    private readonly options: {
      delegate: CandleFetchClient;
      mode: WarehouseMode;
      warehouseDirectoryPath: string;
    },
  ) {}

  getProviderName(): CandleProviderName {
    return this.options.delegate.getProviderName?.() ?? "ibkr";
  }

  async fetchCandles(
    request: HistoricalFetchRequest,
  ): Promise<CandleProviderResponse> {
    const provider = request.preferredProvider ?? this.getProviderName();

    if (this.options.mode !== "refresh") {
      const storedRows = await this.readRows({
        provider,
        request,
      });

      if (storedRows.length >= request.lookbackBars) {
        return buildResponseFromRows({
          metadata: { durableWarehouse: "hit" },
          provider,
          request,
          rows: storedRows.slice(-request.lookbackBars),
        });
      }

      if (
        storedRows.length > 0 &&
        (this.options.mode === "replay" ||
          request.timeframe === "daily" ||
          request.timeframe === "4h" ||
          request.timeframe === "5m")
      ) {
        return buildResponseFromRows({
          metadata: {
            durableWarehouse: "partial_hit",
            durableWarehousePartial: true,
            durableWarehouseRequestedLookbackBars: request.lookbackBars,
            durableWarehouseStoredCandles: storedRows.length,
          },
          provider,
          request,
          rows: storedRows,
        });
      }

      if (this.options.mode === "replay") {
        throw new Error(
          `Durable candle warehouse miss for ${normalizeSymbol(
            request.symbol,
          )} ${request.timeframe}; found ${storedRows.length}/${request.lookbackBars} candles.`,
        );
      }
    }

    const fresh = await this.options.delegate.fetchCandles(request);

    if (
      (this.options.mode === "read_write" || this.options.mode === "refresh") &&
      fresh.candles.length > 0
    ) {
      await this.writeRows(fresh);
    }

    return {
      ...fresh,
      providerMetadata: {
        ...fresh.providerMetadata,
        durableWarehouse: "write_through",
        durableWarehouseMode: this.options.mode,
      },
    };
  }

  private async readRows(args: {
    provider: CandleProviderName;
    request: HistoricalFetchRequest;
  }): Promise<WarehouseRow[]> {
    const range = buildRequestedRange(args.request);
    const rows: WarehouseRow[] = [];

    const [rowsByDate, validationCacheRows] = await Promise.all(
      [
        Promise.all(
          dateKeysBetween(range.startTimestamp, range.endTimestamp).map((key) =>
            readJsonlRows(
              warehouseFilePath({
                provider: args.provider,
                root: this.options.warehouseDirectoryPath,
                symbol: args.request.symbol,
                timeframe: args.request.timeframe,
                dateKey: key,
              }),
            ),
          ),
        ),
        readValidationCacheRows({
          provider: args.provider,
          request: args.request,
          root: this.options.warehouseDirectoryPath,
        }),
      ],
    );

    for (const dateRows of rowsByDate) {
      rows.push(...dateRows);
    }
    rows.push(...validationCacheRows);

    return uniqueSortedRows(rows)
      .filter(
        (row) =>
          row.timestamp >= range.startTimestamp &&
          row.timestamp <= range.endTimestamp,
      )
      .filter((row) => isValidCandle(row));
  }

  private async writeRows(response: CandleProviderResponse): Promise<void> {
    const byDate = new Map<string, WarehouseRow[]>();
    const sourceFetchedAt = response.fetchEndTimestamp || Date.now();

    for (const candle of response.candles) {
      const key = dateKey(candle.timestamp);
      const rows = byDate.get(key) ?? [];

      rows.push({
        ...candle,
        adjustmentMode: "raw",
        provider: response.provider,
        sourceFetchedAt,
        sourceMetadata: {
          ...response.providerMetadata,
          actualBarsReturned: response.actualBarsReturned,
          completenessStatus: response.completenessStatus,
          requestedEndTimestamp: response.requestedEndTimestamp,
          requestedLookbackBars: response.requestedLookbackBars,
          requestedStartTimestamp: response.requestedStartTimestamp,
          validationIssueCodes: response.validationIssues.map(
            (issue) => issue.code,
          ),
        },
        symbol: response.symbol,
        timeframe: response.timeframe,
      });
      byDate.set(key, rows);
    }

    for (const [key, rows] of byDate.entries()) {
      const path = warehouseFilePath({
        provider: response.provider,
        root: this.options.warehouseDirectoryPath,
        symbol: response.symbol,
        timeframe: response.timeframe,
        dateKey: key,
      });
      const existingRows = await readJsonlRows(path);
      const mergedRows = uniqueSortedRows([...existingRows, ...rows]);
      const content = `${mergedRows.map((row) => JSON.stringify(row)).join("\n")}\n`;
      const tempPath = `${path}.${Date.now()}.tmp`;

      await mkdir(dirname(path), { recursive: true });
      await writeFile(tempPath, content, "utf8");
      await rename(tempPath, path);
    }
  }
}

function buildResponseFromRows(args: {
  metadata: Record<string, string | number | boolean | null>;
  provider: CandleProviderName;
  request: HistoricalFetchRequest;
  rows: WarehouseRow[];
}): CandleProviderResponse {
  const range = buildRequestedRange(args.request);
  const candles = uniqueSortedRows(args.rows).map((row) => ({
    close: row.close,
    high: row.high,
    low: row.low,
    open: row.open,
    timestamp: row.timestamp,
    volume: row.volume,
  }));
  const validationIssues = buildValidationIssues({
    candles,
    request: args.request,
  });

  return {
    actualBarsReturned: candles.length,
    candles,
    completenessStatus:
      candles.length === 0
        ? "empty"
        : candles.length >= args.request.lookbackBars
          ? "complete"
          : "partial",
    fetchEndTimestamp: Date.now(),
    fetchStartTimestamp: Date.now(),
    provider: args.provider,
    providerMetadata: {
      durableWarehouse: "read",
      durableWarehouseDirectory: "configured",
      ibkrRequestedSymbol: normalizeSymbol(args.request.symbol),
      ibkrResolvedSymbol: normalizeSymbol(args.request.symbol),
      ...metadataFromRows(args.rows),
      ...args.metadata,
    },
    requestedEndTimestamp: range.endTimestamp,
    requestedLookbackBars: args.request.lookbackBars,
    requestedStartTimestamp: range.startTimestamp,
    sessionMetadataAvailable: args.request.timeframe === "5m",
    sessionSummary: null,
    stale: validationIssues.some((issue) => issue.code === "stale_final_candle"),
    symbol: normalizeSymbol(args.request.symbol),
    timeframe: args.request.timeframe,
    validationIssues,
  };
}

function buildRequestedRange(request: HistoricalFetchRequest): {
  endTimestamp: number;
  intervalMs: number;
  startTimestamp: number;
} {
  const intervalMs = timeframeMs(request.timeframe);
  const rawEnd = request.endTimeMs ?? Date.now();
  const endTimestamp = Math.floor(rawEnd / intervalMs) * intervalMs;

  return {
    endTimestamp,
    intervalMs,
    startTimestamp: endTimestamp - request.lookbackBars * intervalMs,
  };
}

function buildValidationIssues(args: {
  candles: Candle[];
  request: HistoricalFetchRequest;
}): CandleProviderResponse["validationIssues"] {
  const issues: CandleProviderResponse["validationIssues"] = [];

  if (args.candles.length === 0) {
    issues.push({
      code: "zero_results",
      message: `Warehouse returned zero candles for ${args.request.symbol} ${args.request.timeframe}.`,
      severity: "error",
    });
    return issues;
  }

  if (args.candles.length < args.request.lookbackBars) {
    issues.push({
      code: "insufficient_bars",
      message: `Requested ${args.request.lookbackBars} bars but warehouse returned ${args.candles.length} for ${args.request.symbol} ${args.request.timeframe}.`,
      severity: "warning",
    });
  }

  const range = buildRequestedRange(args.request);
  const lastCandle = args.candles.at(-1);

  if (lastCandle && range.endTimestamp - lastCandle.timestamp > range.intervalMs * 3) {
    issues.push({
      code: "stale_final_candle",
      message: `Final warehouse candle appears stale for ${args.request.symbol} ${args.request.timeframe}.`,
      severity: "warning",
    });
  }

  return issues;
}

function dateKey(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function dateKeysBetween(startTimestamp: number, endTimestamp: number): string[] {
  const keys: string[] = [];
  const dayMs = 24 * 60 * 60_000;
  const start = Math.floor(startTimestamp / dayMs) * dayMs;
  const end = Math.floor(endTimestamp / dayMs) * dayMs;

  for (let timestamp = start; timestamp <= end; timestamp += dayMs) {
    keys.push(dateKey(timestamp));
  }

  return keys;
}

function isValidCandle(row: WarehouseRow): boolean {
  return (
    Number.isFinite(row.timestamp) &&
    Number.isFinite(row.open) &&
    Number.isFinite(row.high) &&
    Number.isFinite(row.low) &&
    Number.isFinite(row.close) &&
    Number.isFinite(row.volume) &&
    row.high >= row.low &&
    row.high >= row.open &&
    row.high >= row.close &&
    row.low <= row.open &&
    row.low <= row.close
  );
}

function metadataFromRows(
  rows: WarehouseRow[],
): Record<string, string | number | boolean | null> {
  const source = rows.find((row) => row.sourceMetadata)?.sourceMetadata;

  if (!source) {
    return {};
  }

  return {
    cacheWrapper:
      typeof source.cacheWrapper === "string" ? source.cacheWrapper : null,
    ibkrContractAliasUsed:
      typeof source.aliasUsed === "boolean" ? source.aliasUsed : null,
    ibkrHistoricalAliasReason:
      typeof source.aliasReason === "string" ? source.aliasReason : null,
    ibkrResolvedConId:
      typeof source.resolvedConId === "number" ? source.resolvedConId : null,
    ibkrResolvedExchange:
      typeof source.resolvedExchange === "string"
        ? source.resolvedExchange
        : null,
    ibkrResolvedPrimaryExchange:
      typeof source.resolvedPrimaryExchange === "string"
        ? source.resolvedPrimaryExchange
        : null,
    ibkrResolvedSymbol:
      typeof source.resolvedSymbol === "string" ? source.resolvedSymbol : null,
    warehouseAdjustmentMode:
      typeof source.warehouseAdjustmentMode === "string"
        ? source.warehouseAdjustmentMode
        : null,
    warehouseBasisValidationStatus:
      typeof source.basisValidationStatus === "string"
        ? source.basisValidationStatus
        : null,
  };
}

function normalizeSymbol(symbol: string): string {
  const normalized = symbol.trim().toUpperCase();

  if (!normalized) {
    throw new Error("symbol is required.");
  }

  return normalized;
}

async function readJsonlRows(path: string): Promise<WarehouseRow[]> {
  try {
    const content = await readFile(path, "utf8");

    return content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as WarehouseRow);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function readValidationCacheRows(args: {
  provider: CandleProviderName;
  request: HistoricalFetchRequest;
  root: string;
}): Promise<WarehouseRow[]> {
  const directoryPath = validationCacheDirectoryPath({
    provider: args.provider,
    root: args.root,
    symbol: args.request.symbol,
    timeframe: args.request.timeframe,
  });
  let filenames: string[];

  try {
    filenames = await readdir(directoryPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }

  const candidateFilenames = filenames.filter((filename) =>
    isValidationCacheCandidate(filename, args.request),
  );
  const entries = await Promise.all(
    candidateFilenames.map((filename) =>
      readValidationCacheEntry(join(directoryPath, filename)),
    ),
  );
  const rows: WarehouseRow[] = [];

  for (const entry of entries) {
    rows.push(
      ...validationCacheEntryRows({
        entry,
        provider: args.provider,
        request: args.request,
      }),
    );
  }

  return rows;
}

async function readValidationCacheEntry(
  path: string,
): Promise<ValidationCacheEntry | null> {
  try {
    const parsed = JSON.parse(await readFile(path, "utf8")) as ValidationCacheEntry;

    return parsed.schemaVersion === 1 ? parsed : null;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    return null;
  }
}

function validationCacheEntryRows(args: {
  entry: ValidationCacheEntry | null;
  provider: CandleProviderName;
  request: HistoricalFetchRequest;
}): WarehouseRow[] {
  const response = args.entry?.response;

  if (!response || response.timeframe !== args.request.timeframe) {
    return [];
  }

  const responseSymbol = normalizeSymbol(response.symbol);
  const requestSymbol = normalizeSymbol(args.request.symbol);

  if (responseSymbol !== requestSymbol) {
    return [];
  }

  const provider = response.provider ?? args.provider;

  return response.candles.map((candle) => ({
    ...candle,
    adjustmentMode: "raw",
    provider,
    sourceFetchedAt: args.entry?.cachedAt,
    sourceMetadata: {
      ...response.providerMetadata,
      actualBarsReturned: response.actualBarsReturned,
      cacheSchemaVersion: args.entry?.schemaVersion,
      cacheWrapper: "levels-system-v2-validation-cache",
      cachedAt: args.entry?.cachedAt,
      completenessStatus: response.completenessStatus,
      requestedEndTimestamp: response.requestedEndTimestamp,
      requestedLookbackBars: response.requestedLookbackBars,
      requestedStartTimestamp: response.requestedStartTimestamp,
      validationIssueCodes: (response.validationIssues ?? []).map(
        (issue) => issue.code,
      ),
    },
    symbol: responseSymbol,
    timeframe: response.timeframe,
  }));
}

function isValidationCacheCandidate(
  filename: string,
  request: HistoricalFetchRequest,
): boolean {
  if (!filename.endsWith(".json")) {
    return false;
  }

  const separatorIndex = filename.indexOf("-");

  if (separatorIndex <= 0) {
    return false;
  }

  const lookbackBars = Number(filename.slice(0, separatorIndex));
  const endTimeMs = Number(filename.slice(separatorIndex + 1, -".json".length));

  if (!Number.isFinite(lookbackBars) || !Number.isFinite(endTimeMs)) {
    return false;
  }

  const range = buildRequestedRange(request);

  return endTimeMs >= range.startTimestamp;
}

function timeframeMs(timeframe: CandleFetchTimeframe): number {
  if (timeframe === "daily") {
    return 24 * 60 * 60_000;
  }

  if (timeframe === "4h") {
    return 4 * 60 * 60_000;
  }

  if (timeframe === "1m") {
    return 60_000;
  }

  return 5 * 60_000;
}

function uniqueSortedRows<T extends Candle>(rows: T[]): T[] {
  const byTimestamp = new Map<number, T>();

  for (const row of rows) {
    if (Number.isFinite(row.timestamp)) {
      byTimestamp.set(row.timestamp, row);
    }
  }

  return [...byTimestamp.values()].sort(
    (left, right) => left.timestamp - right.timestamp,
  );
}

function warehouseFilePath(args: {
  dateKey: string;
  provider: CandleProviderName;
  root: string;
  symbol: string;
  timeframe: CandleFetchTimeframe;
}): string {
  return join(
    /* turbopackIgnore: true */
    args.root,
    args.provider,
    normalizeSymbol(args.symbol),
    args.timeframe,
    `${args.dateKey}.jsonl`,
  );
}

function validationCacheDirectoryPath(args: {
  provider: CandleProviderName;
  root: string;
  symbol: string;
  timeframe: CandleFetchTimeframe;
}): string {
  return join(
    /* turbopackIgnore: true */
    args.root,
    args.provider,
    normalizeSymbol(args.symbol),
    args.timeframe,
  );
}
