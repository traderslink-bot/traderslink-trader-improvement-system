import { CandleFetchService, type CandleFetchTimeframe, type CandleProviderName, type CandleWarehouseBackfillMode, type CandleWarehouseBackfillResult } from "../support-resistance/index.js";
import type { CandleBackfillPriorityLevel } from "./candle-backfill-priority-report.js";
export type WriteCandleWarehouseBackfillReportOptions = {
    auditPath: string;
    warehouseDirectoryPath?: string;
    provider?: CandleProviderName;
    timeframes?: CandleFetchTimeframe[];
    mode?: CandleWarehouseBackfillMode;
    maxTrades?: number;
    maxTasks?: number;
    concurrency?: number;
    throttleMs?: number;
    priorityReportPath?: string;
    priorityStage?: number;
    priority?: CandleBackfillPriorityLevel;
    fetchClient?: {
        getProviderName(): CandleProviderName;
        fetchCandles(request: Parameters<CandleFetchService["fetchCandles"]>[0]): ReturnType<CandleFetchService["fetchCandles"]>;
    };
    jsonPath: string;
    markdownPath: string;
};
export declare function formatCandleWarehouseBackfillReport(result: CandleWarehouseBackfillResult): string;
export declare function writeCandleWarehouseBackfillReport(options: WriteCandleWarehouseBackfillReportOptions): Promise<CandleWarehouseBackfillResult>;
//# sourceMappingURL=candle-warehouse-backfill-report.d.ts.map