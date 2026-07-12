import { type CandleFetchTimeframe, type CandleProviderName, type WarehouseMissingCandleBackfillPlan } from "../support-resistance/index.js";
export type CandleImportReadinessReport = {
    generatedAt: string;
    sourceAuditPath: string;
    sourceAuditPaths: string[];
    warehouseDirectoryPath: string;
    provider: CandleProviderName;
    timeframes: CandleFetchTimeframe[];
    tradeCount: number;
    symbolCount: number;
    sessionCount: number;
    plan: WarehouseMissingCandleBackfillPlan;
    samples: Array<{
        symbol: string;
        sessionDate: string;
        asOfTimestamp: number;
    }>;
    coverageBySymbolSession: Array<{
        symbol: string;
        sessionDate: string;
        asOfTimestamp: number;
        status: "covered" | "partial" | "missing";
        coveredTimeframes: CandleFetchTimeframe[];
        missingTimeframes: CandleFetchTimeframe[];
        missingTaskCount: number;
        storedCandles: number;
        estimatedMissingCandles: number;
    }>;
};
export type BuildCandleImportReadinessReportOptions = {
    auditPath: string;
    warehouseDirectoryPath?: string;
    provider?: CandleProviderName;
    timeframes?: CandleFetchTimeframe[];
    maxTrades?: number;
    maxAuditFiles?: number;
};
export type WriteCandleImportReadinessReportOptions = BuildCandleImportReadinessReportOptions & {
    jsonPath: string;
    markdownPath: string;
};
export declare function buildCandleImportReadinessReport(options: BuildCandleImportReadinessReportOptions): Promise<CandleImportReadinessReport>;
export declare function formatCandleImportReadinessReport(report: CandleImportReadinessReport): string;
export declare function writeCandleImportReadinessReport(options: WriteCandleImportReadinessReportOptions): Promise<CandleImportReadinessReport>;
//# sourceMappingURL=candle-import-readiness-report.d.ts.map