import { type BuildCandleImportReadinessReportOptions } from "./candle-import-readiness-report.js";
import type { CandleFetchTimeframe, CandleProviderName } from "../support-resistance/index.js";
export type CandleBackfillPriorityLevel = "fetch_first" | "fetch_next" | "fetch_later";
export type CandleBackfillPriorityTask = {
    provider: CandleProviderName;
    symbol: string;
    sessionDate: string;
    timeframe: CandleFetchTimeframe;
    priority: CandleBackfillPriorityLevel;
    score: number;
    reasons: string[];
    startTimestamp: number;
    endTimestamp: number;
    estimatedCandleCount: number;
    missingCandleCountEstimate: number;
    likelyNoBarMissingCandleCountEstimate: number;
    storedCandles: number;
    tradeRequestCount: number;
};
export type CandleBackfillPrioritySymbolSession = {
    symbol: string;
    sessionDate: string;
    priority: CandleBackfillPriorityLevel;
    score: number;
    missingTimeframes: CandleFetchTimeframe[];
    taskCount: number;
    estimatedMissingCandles: number;
    likelyNoBarMissingCandles: number;
    reasons: string[];
};
export type CandleBackfillPriorityStage = {
    stageIndex: number;
    priority: CandleBackfillPriorityLevel;
    taskCount: number;
    estimatedCandleCount: number;
    symbols: string[];
    timeframes: CandleFetchTimeframe[];
    tasks: CandleBackfillPriorityTask[];
};
export type CandleBackfillPriorityReport = {
    generatedAt: string;
    sourceAuditPath: string;
    sourceAuditPaths: string[];
    warehouseDirectoryPath: string;
    cacheDirectoryPath: string;
    provider: CandleProviderName;
    totals: {
        missingTasks: number;
        fetchFirstTasks: number;
        fetchNextTasks: number;
        fetchLaterTasks: number;
        estimatedMissingCandles: number;
        likelyNoBarMissingCandles: number;
        priorityStages: number;
        quietMayHideSymbols: number;
        runtimeSilenceSymbols: number;
        unprovenQuietSymbols: number;
        postNoiseBudgetSymbols: number;
        supportResistanceWatchSymbols: number;
        supportResistanceBrokenSymbols: number;
        supportResistanceUnprovenSymbols: number;
    };
    rankedTasks: CandleBackfillPriorityTask[];
    priorityBySymbolSession: CandleBackfillPrioritySymbolSession[];
    providerStages: CandleBackfillPriorityStage[];
};
export type BuildCandleBackfillPriorityReportOptions = BuildCandleImportReadinessReportOptions & {
    cacheDirectoryPath?: string;
    maxTasksPerStage?: number;
    maxEstimatedCandlesPerStage?: number;
};
export type WriteCandleBackfillPriorityReportOptions = BuildCandleBackfillPriorityReportOptions & {
    jsonPath: string;
    markdownPath: string;
};
export declare function buildCandleBackfillPriorityReport(options: BuildCandleBackfillPriorityReportOptions): Promise<CandleBackfillPriorityReport>;
export declare function formatCandleBackfillPriorityReport(report: CandleBackfillPriorityReport): string;
export declare function writeCandleBackfillPriorityReport(options: WriteCandleBackfillPriorityReportOptions): Promise<CandleBackfillPriorityReport>;
//# sourceMappingURL=candle-backfill-priority-report.d.ts.map