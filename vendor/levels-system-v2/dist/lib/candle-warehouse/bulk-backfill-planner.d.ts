import type { CandleFetchTimeframe, CandleProviderName } from "../market-data/candle-types.js";
import type { CandleWarehouseCoverage, CandleWarehouseMissingRange } from "./durable-candle-warehouse.js";
export type BulkCandleBackfillTradeInput = {
    symbol: string;
    sessionDate: string;
    asOfTimestamp?: number | string | Date;
    startTimestamp?: number | string | Date;
};
export type BulkCandleBackfillTask = {
    provider: CandleProviderName;
    symbol: string;
    timeframe: CandleFetchTimeframe;
    sessionDate: string;
    startTimestamp: number;
    endTimestamp: number;
    lookbackBars: number;
    tradeRequestCount?: number;
    estimatedCandleCount?: number;
};
export type BulkCandleBackfillProviderBatch = {
    provider: CandleProviderName;
    batchIndex: number;
    taskCount: number;
    estimatedCandleCount: number;
    symbols: string[];
    timeframes: CandleFetchTimeframe[];
    startTimestamp: number;
    endTimestamp: number;
    tasks: BulkCandleBackfillTask[];
};
export type BulkCandleBackfillBatchingOptions = {
    maxTasksPerBatch?: number;
    maxEstimatedCandlesPerBatch?: number;
};
export type BulkCandleBackfillPlan = {
    provider: CandleProviderName;
    tasks: BulkCandleBackfillTask[];
    providerBatches?: BulkCandleBackfillProviderBatch[];
    symbolCount: number;
    sessionCount: number;
    naiveTaskCount?: number;
    dedupedTaskCount: number;
    avoidedTaskCount?: number;
    avoidedTaskPct?: number;
    estimatedCandleCount?: number;
    maxTaskEstimatedCandles?: number;
};
export type WarehouseMissingCandleBackfillTask = BulkCandleBackfillTask & {
    coverage: CandleWarehouseCoverage;
    missingRanges: CandleWarehouseMissingRange[];
    likelyNoBarMissingRanges?: CandleWarehouseMissingRange[];
    missingCandleCountEstimate: number;
    likelyNoBarMissingCandleCountEstimate?: number;
};
export type WarehouseMissingCandleBackfillPlan = Omit<BulkCandleBackfillPlan, "tasks" | "dedupedTaskCount"> & {
    tasks: WarehouseMissingCandleBackfillTask[];
    plannedTaskCount: number;
    missingTaskCount: number;
    fullyCoveredTaskCount: number;
    missingCandleCountEstimate: number;
    likelyNoBarMissingTaskCount: number;
    likelyNoBarMissingCandleCountEstimate: number;
};
export type PlanBulkCandleBackfillRequest = {
    trades: BulkCandleBackfillTradeInput[];
    provider?: CandleProviderName;
    timeframes?: CandleFetchTimeframe[];
    lookbackBars?: Partial<Record<CandleFetchTimeframe, number>>;
    batching?: BulkCandleBackfillBatchingOptions;
};
export type PlanWarehouseMissingCandleBackfillRequest = PlanBulkCandleBackfillRequest & {
    warehouse: {
        getCoverage(request: {
            provider: CandleProviderName;
            symbol: string;
            timeframe: CandleFetchTimeframe;
            startTimestamp: number;
            endTimestamp: number;
        }): Promise<CandleWarehouseCoverage>;
        findMissingRanges(request: {
            provider: CandleProviderName;
            symbol: string;
            timeframe: CandleFetchTimeframe;
            startTimestamp: number;
            endTimestamp: number;
        }): Promise<CandleWarehouseMissingRange[]>;
    };
};
export declare function groupBackfillTasksIntoProviderBatches(tasks: BulkCandleBackfillTask[], options?: BulkCandleBackfillBatchingOptions): BulkCandleBackfillProviderBatch[];
export declare function planBulkCandleBackfill(request: PlanBulkCandleBackfillRequest): BulkCandleBackfillPlan;
export declare function planWarehouseMissingCandleBackfill(request: PlanWarehouseMissingCandleBackfillRequest): Promise<WarehouseMissingCandleBackfillPlan>;
//# sourceMappingURL=bulk-backfill-planner.d.ts.map