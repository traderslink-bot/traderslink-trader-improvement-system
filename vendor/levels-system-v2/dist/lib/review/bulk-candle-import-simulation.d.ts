import { type BulkCandleBackfillTradeInput, type CandleFetchTimeframe, type CandleProviderName, type WarehouseMissingCandleBackfillPlan } from "../support-resistance/index.js";
export type BulkCandleImportSimulationOptions = {
    warehouseDirectoryPath?: string;
    provider?: CandleProviderName;
    symbolCount?: number;
    sessionCount?: number;
    tradesPerSymbolSession?: number;
    timeframes?: CandleFetchTimeframe[];
    startSessionDate?: string;
};
export type WriteBulkCandleImportSimulationOptions = BulkCandleImportSimulationOptions & {
    jsonPath: string;
    markdownPath: string;
};
export type BulkCandleImportSimulationReport = {
    generatedAt: string;
    provider: CandleProviderName;
    warehouseDirectoryPath: string;
    input: {
        symbolCount: number;
        sessionCount: number;
        tradesPerSymbolSession: number;
        timeframes: CandleFetchTimeframe[];
        startSessionDate: string;
    };
    totals: {
        generatedTradeRows: number;
        naiveProviderTasks: number;
        dedupedProviderTasks: number;
        avoidedProviderTasks: number;
        avoidedProviderTaskPct: number;
        plannedWarehouseTasks: number;
        fullyCoveredWarehouseTasks: number;
        missingWarehouseTasks: number;
        missingCandleCountEstimate: number;
        providerBatchCount: number;
        maxTaskEstimatedCandles: number;
    };
    plan: WarehouseMissingCandleBackfillPlan;
    sampleTrades: BulkCandleBackfillTradeInput[];
};
export declare function buildBulkCandleImportSimulationReport(options?: BulkCandleImportSimulationOptions): Promise<BulkCandleImportSimulationReport>;
export declare function formatBulkCandleImportSimulationReport(report: BulkCandleImportSimulationReport): string;
export declare function writeBulkCandleImportSimulationReport(options: WriteBulkCandleImportSimulationOptions): Promise<BulkCandleImportSimulationReport>;
//# sourceMappingURL=bulk-candle-import-simulation.d.ts.map