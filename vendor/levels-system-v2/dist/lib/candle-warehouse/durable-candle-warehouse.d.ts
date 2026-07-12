import { CandleFetchService, type HistoricalFetchRequest } from "../market-data/candle-fetch-service.js";
import type { Candle, CandleFetchCompletenessStatus, CandleFetchTimeframe, CandleProviderName, CandleProviderResponse, CandleValidationCode } from "../market-data/candle-types.js";
export type DurableCandleWarehouseRow = Candle & {
    symbol: string;
    provider: CandleProviderName;
    timeframe: CandleFetchTimeframe;
    sourceFetchedAt: number;
    adjustmentMode: CandleWarehouseAdjustmentMode;
    sourceMetadata?: CandleWarehouseSourceMetadata;
};
export type CandleWarehouseAdjustmentMode = "raw" | "split_adjusted" | "unknown";
export type CandleBasisValidationStatus = "basis_unchecked" | "basis_aligned" | "basis_mismatch" | "basis_adjustment_multiple_likely" | "basis_insufficient_evidence";
export type CandleWarehouseSourceMetadata = {
    provider: CandleProviderName;
    requestedSymbol: string;
    resolvedSymbol: string;
    resolvedConId: number | null;
    resolvedExchange: string | null;
    resolvedPrimaryExchange: string | null;
    sourceFetchedAt: number;
    whatToShow: string | null;
    useRTH: boolean | null;
    providerAdjustmentMode: CandleWarehouseAdjustmentMode | "unknown";
    warehouseAdjustmentMode: CandleWarehouseAdjustmentMode;
    aliasUsed: boolean;
    aliasReason: string | null;
    basisValidationStatus: CandleBasisValidationStatus;
    requestedStartTimestamp?: number;
    requestedEndTimestamp?: number;
    requestedLookbackBars?: number;
    actualBarsReturned?: number;
    completenessStatus?: CandleFetchCompletenessStatus;
    validationIssueCodes?: CandleValidationCode[];
};
export type CandleWarehouseRangeRequest = {
    provider: CandleProviderName;
    symbol: string;
    timeframe: CandleFetchTimeframe;
    startTimestamp: number;
    endTimestamp: number;
};
export type CandleWarehouseUpsertRequest = {
    provider: CandleProviderName;
    symbol: string;
    timeframe: CandleFetchTimeframe;
    candles: Candle[];
    sourceFetchedAt?: number;
    sourceMetadata?: Partial<CandleWarehouseSourceMetadata>;
};
export type CandleWarehouseCoverage = {
    provider: CandleProviderName;
    symbol: string;
    timeframe: CandleFetchTimeframe;
    candleCount: number;
    startTimestamp: number | null;
    endTimestamp: number | null;
};
export type CandleWarehouseMissingRange = {
    startTimestamp: number;
    endTimestamp: number;
};
type CandleFetchClient = {
    getProviderName(): CandleProviderName;
    fetchCandles(request: HistoricalFetchRequest): Promise<CandleProviderResponse>;
};
export type DurableCandleWarehouseFetchServiceOptions = {
    warehouse: DurableCandleWarehouse;
    delegate: CandleFetchClient;
    mode?: "read_write" | "refresh" | "replay";
};
export declare class DurableCandleWarehouse {
    readonly rootDirectoryPath: string;
    constructor(rootDirectoryPath: string);
    private directoryPath;
    private filePath;
    upsertCandles(request: CandleWarehouseUpsertRequest): Promise<CandleWarehouseCoverage>;
    getCandles(request: CandleWarehouseRangeRequest): Promise<Candle[]>;
    getCandleRows(request: CandleWarehouseRangeRequest): Promise<DurableCandleWarehouseRow[]>;
    getCoverage(request: CandleWarehouseRangeRequest): Promise<CandleWarehouseCoverage>;
    findMissingRanges(request: CandleWarehouseRangeRequest): Promise<CandleWarehouseMissingRange[]>;
    listSymbols(provider: CandleProviderName): Promise<string[]>;
    private readRowsFromFile;
    private writeRowsToFile;
}
export declare class DurableCandleWarehouseFetchService extends CandleFetchService {
    private readonly warehouse;
    private readonly delegate;
    private readonly mode;
    constructor(options: DurableCandleWarehouseFetchServiceOptions);
    getProviderName(): CandleProviderName;
    fetchCandles(request: HistoricalFetchRequest): Promise<CandleProviderResponse>;
    private buildWarehouseResponse;
    private canReplayStoredPartialProviderResponse;
}
export {};
//# sourceMappingURL=durable-candle-warehouse.d.ts.map