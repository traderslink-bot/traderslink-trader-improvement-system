import { type CandleFetchTimeframe, type CandleProviderName } from "../support-resistance/index.js";
export type ProviderTimeframeComparisonStatus = "both_available" | "primary_only" | "comparison_only" | "missing_both";
export type ProviderTimeframeComparison = {
    symbol: string;
    timeframe: CandleFetchTimeframe;
    status: ProviderTimeframeComparisonStatus;
    primaryCount: number;
    comparisonCount: number;
    primaryLatestTimestamp: number | null;
    comparisonLatestTimestamp: number | null;
    latestTimestampDriftMinutes: number | null;
    latestCloseDriftPct: number | null;
    averageVolumeDriftPct: number | null;
    vwapDriftPct: number | null;
    ema9DriftPct: number | null;
    ema20DriftPct: number | null;
    missingBehavior: string[];
};
export type ProviderLevelComparison = {
    symbol: string;
    status: "compared" | "insufficient_data" | "error";
    reason: string;
    primarySupportCount: number | null;
    primaryResistanceCount: number | null;
    comparisonSupportCount: number | null;
    comparisonResistanceCount: number | null;
    supportCountDelta: number | null;
    resistanceCountDelta: number | null;
    primaryHasForwardResistance: boolean | null;
    comparisonHasForwardResistance: boolean | null;
};
export type ProviderStructureComparison = {
    symbol: string;
    status: "compared" | "insufficient_data" | "error";
    reason: string;
    primaryState: string | null;
    comparisonState: string | null;
    primaryConfidence: string | null;
    comparisonConfidence: string | null;
    stateMatches: boolean | null;
    confidenceScoreDrift: number | null;
};
export type ProviderComparisonSymbolReport = {
    symbol: string;
    timeframeComparisons: ProviderTimeframeComparison[];
    levelComparison: ProviderLevelComparison;
    structureComparison: ProviderStructureComparison;
};
export type ProviderComparisonReadinessReport = {
    generatedAt: string;
    cacheDirectoryPath: string;
    primaryProvider: CandleProviderName;
    comparisonProvider: CandleProviderName;
    timeframes: CandleFetchTimeframe[];
    totals: {
        symbolsCompared: number;
        commonSymbols: number;
        primaryOnlySymbols: number;
        comparisonOnlySymbols: number;
        timeframeComparisons: number;
        bothAvailable: number;
        primaryOnly: number;
        comparisonOnly: number;
        missingBoth: number;
        highCloseDriftCount: number;
        highVolumeDriftCount: number;
        highDynamicDriftCount: number;
        levelDriftWatchCount: number;
        marketStructureDriftWatchCount: number;
        providerMissingBehaviorCount: number;
    };
    symbols: ProviderComparisonSymbolReport[];
};
export type GenerateProviderComparisonReadinessReportOptions = {
    cacheDirectoryPath?: string;
    primaryProvider?: CandleProviderName;
    comparisonProvider?: CandleProviderName;
    timeframes?: CandleFetchTimeframe[];
    symbols?: string[];
    maxSymbols?: number;
    highCloseDriftPct?: number;
    highVolumeDriftPct?: number;
    highDynamicDriftPct?: number;
};
export type WriteProviderComparisonReadinessReportOptions = GenerateProviderComparisonReadinessReportOptions & {
    jsonPath: string;
    markdownPath: string;
};
export declare function generateProviderComparisonReadinessReport(options?: GenerateProviderComparisonReadinessReportOptions): Promise<ProviderComparisonReadinessReport>;
export declare function formatProviderComparisonReadinessReport(report: ProviderComparisonReadinessReport): string;
export declare function writeProviderComparisonReadinessReport(options: WriteProviderComparisonReadinessReportOptions): Promise<ProviderComparisonReadinessReport>;
//# sourceMappingURL=provider-comparison-readiness-report.d.ts.map