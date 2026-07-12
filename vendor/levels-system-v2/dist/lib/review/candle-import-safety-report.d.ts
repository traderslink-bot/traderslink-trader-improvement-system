import { type BuildCandleImportReadinessReportOptions, type CandleImportReadinessReport } from "./candle-import-readiness-report.js";
export type CandleImportSafetyVerdict = "safe_to_plan" | "provider_pressure_watch" | "warehouse_gap" | "no_trade_rows";
export type CandleImportSafetyReport = {
    generatedAt: string;
    sourceAuditPath: string;
    sourceAuditPaths: string[];
    warehouseDirectoryPath: string;
    provider: CandleImportReadinessReport["provider"];
    verdict: CandleImportSafetyVerdict;
    totals: {
        tradeProxies: number;
        symbols: number;
        sessions: number;
        timeframes: number;
        naiveProviderTasks: number;
        plannedProviderTasks: number;
        avoidedProviderTasks: number;
        avoidedProviderTaskPct: number;
        missingTasks: number;
        fullyCoveredTasks: number;
        estimatedMissingCandles: number;
        providerBatchCount: number;
        maxBatchTasks: number;
        maxBatchEstimatedCandles: number;
        maxTaskEstimatedCandles: number;
    };
    reasons: string[];
    providerBatches: Array<{
        batchIndex: number;
        taskCount: number;
        estimatedCandleCount: number;
        symbols: string[];
        timeframes: string[];
    }>;
    topMissingTasks: Array<{
        symbol: string;
        sessionDate: string;
        timeframe: string;
        missingRanges: number;
        storedCandles: number;
        missingCandleCountEstimate: number;
        estimatedCandleCount: number | null;
    }>;
    symbolSessionCoverage: Array<{
        symbol: string;
        sessionDate: string;
        status: "covered" | "partial" | "missing";
        coveredTimeframes: string[];
        missingTimeframes: string[];
        estimatedMissingCandles: number;
    }>;
};
export type BuildCandleImportSafetyReportOptions = BuildCandleImportReadinessReportOptions;
export type WriteCandleImportSafetyReportOptions = BuildCandleImportSafetyReportOptions & {
    jsonPath: string;
    markdownPath: string;
};
export declare function buildCandleImportSafetyReport(options: BuildCandleImportSafetyReportOptions): Promise<CandleImportSafetyReport>;
export declare function formatCandleImportSafetyReport(report: CandleImportSafetyReport): string;
export declare function writeCandleImportSafetyReport(options: WriteCandleImportSafetyReportOptions): Promise<CandleImportSafetyReport>;
//# sourceMappingURL=candle-import-safety-report.d.ts.map