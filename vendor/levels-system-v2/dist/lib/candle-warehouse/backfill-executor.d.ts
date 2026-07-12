import type { CandleFetchTimeframe, CandleProviderName, CandleProviderResponse } from "../market-data/candle-types.js";
import type { HistoricalFetchRequest } from "../market-data/candle-fetch-service.js";
import { type PlanWarehouseMissingCandleBackfillRequest, type WarehouseMissingCandleBackfillPlan } from "./bulk-backfill-planner.js";
import type { CandleWarehouseCoverage, CandleWarehouseUpsertRequest } from "./durable-candle-warehouse.js";
type BackfillFetchClient = {
    getProviderName(): CandleProviderName;
    fetchCandles(request: HistoricalFetchRequest): Promise<CandleProviderResponse>;
};
type BackfillWarehouse = PlanWarehouseMissingCandleBackfillRequest["warehouse"] & {
    upsertCandles(request: CandleWarehouseUpsertRequest): Promise<CandleWarehouseCoverage>;
};
export type CandleWarehouseBackfillMode = "dry_run" | "execute";
export type CandleWarehouseBackfillReadiness = "already_covered" | "safe_to_fetch" | "refreshed" | "provider_risk";
export type CandleWarehouseBackfillTaskResult = {
    symbol: string;
    timeframe: CandleFetchTimeframe;
    sessionDate: string;
    status: "planned" | "fetched" | "skipped" | "failed";
    readiness: CandleWarehouseBackfillReadiness;
    requestedLookbackBars: number;
    missingRangeCount: number;
    missingCandleCountEstimate: number;
    fetchedCandles: number;
    storedCandles: number;
    error: string | null;
};
export type CandleWarehouseBackfillTaskKey = {
    provider?: CandleProviderName;
    symbol: string;
    sessionDate: string;
    timeframe: CandleFetchTimeframe;
};
export type CandleWarehouseBackfillResult = {
    generatedAt: string;
    mode: CandleWarehouseBackfillMode;
    provider: CandleProviderName;
    plan: WarehouseMissingCandleBackfillPlan;
    totals: {
        plannedTasks: number;
        attemptedTasks: number;
        fetchedTasks: number;
        skippedTasks: number;
        failedTasks: number;
        fetchedCandles: number;
        storedCandles: number;
    };
    taskResults: CandleWarehouseBackfillTaskResult[];
};
export type ExecuteCandleWarehouseBackfillRequest = Omit<PlanWarehouseMissingCandleBackfillRequest, "warehouse"> & {
    warehouse: BackfillWarehouse;
    fetchClient: BackfillFetchClient;
    mode?: CandleWarehouseBackfillMode;
    concurrency?: number;
    throttleMs?: number;
    maxTasks?: number;
    taskFilterKeys?: CandleWarehouseBackfillTaskKey[];
};
export declare function executeCandleWarehouseBackfill(request: ExecuteCandleWarehouseBackfillRequest): Promise<CandleWarehouseBackfillResult>;
export {};
//# sourceMappingURL=backfill-executor.d.ts.map