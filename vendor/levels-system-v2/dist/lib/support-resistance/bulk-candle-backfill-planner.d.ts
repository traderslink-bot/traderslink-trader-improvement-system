import type { CandleFetchTimeframe, CandleProviderName } from "../market-data/candle-types.js";
import type { DurableCandleWarehouse } from "../candle-warehouse/index.js";
import { type SharedCandleTimestamp } from "./build-support-resistance-context.js";
import type { TradeAnalysisExecutionInput } from "./trade-analysis-context.js";
export type BulkTradeAnalysisBackfillInput = {
    symbol: string;
    sessionDate?: string;
    asOfTimestamp?: SharedCandleTimestamp;
    executions?: TradeAnalysisExecutionInput[];
    tradeStartTimestamp?: SharedCandleTimestamp;
    tradeEndTimestamp?: SharedCandleTimestamp;
};
export type BulkCandleBackfillTimeframeConfig = {
    timeframe: CandleFetchTimeframe;
    preTradeMinutes?: number;
    postTradeMinutes?: number;
    lookbackBars?: number;
};
export type BulkCandleBackfillPlanRequest = {
    trades: BulkTradeAnalysisBackfillInput[];
    provider: CandleProviderName;
    warehouse?: DurableCandleWarehouse;
    timeframes?: BulkCandleBackfillTimeframeConfig[];
};
export type BulkCandleBackfillPlanItem = {
    symbol: string;
    provider: CandleProviderName;
    timeframe: CandleFetchTimeframe;
    startTimestamp: number;
    endTimestamp: number;
    tradeCount: number;
    existingCandles: number;
    missingRanges: Array<{
        startTimestamp: number;
        endTimestamp: number;
    }>;
};
export type BulkCandleBackfillPlan = {
    generatedAt: string;
    provider: CandleProviderName;
    tradeCount: number;
    uniqueSymbols: string[];
    items: BulkCandleBackfillPlanItem[];
    estimatedFetchCount: number;
};
export declare function planBulkCandleBackfill(request: BulkCandleBackfillPlanRequest): Promise<BulkCandleBackfillPlan>;
//# sourceMappingURL=bulk-candle-backfill-planner.d.ts.map