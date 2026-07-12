import { type CandleProviderName } from "../support-resistance/index.js";
export type AdvancedCandleContextSymbolReport = {
    symbol: string;
    status: "ready" | "partial" | "blocked" | "error";
    reason: string;
    candleCounts: Record<"daily" | "4h" | "5m", number>;
    currentPrice: number | null;
    supportCount: number | null;
    resistanceCount: number | null;
    referenceLevelsAvailable: number;
    gapCount: number | null;
    nearestGapAbove: string | null;
    nearestGapBelow: string | null;
    dynamicAvailability: {
        vwap: boolean;
        ema9: boolean;
        ema20: boolean;
    };
    marketStructure: {
        state: string | null;
        confidence: string | null;
        traderLine: string | null;
    };
    traderContext: {
        sessionGap: string | null;
        candleReaction: string | null;
        moveExtension: string | null;
        openingRange: string | null;
        haltAwareness: string | null;
        levelQuality: string | null;
        dataQuality: string | null;
        dataQualityScore: number | null;
        dataQualityReasons: string[];
        dataQualityPrimaryCause: string | null;
        missingFacts: string[];
        tradeIdea: string | null;
        firstPostLines: string[];
    };
};
export type AdvancedCandleContextReport = {
    generatedAt: string;
    cacheDirectoryPath: string;
    provider: CandleProviderName;
    totals: {
        symbols: number;
        ready: number;
        partial: number;
        blocked: number;
        error: number;
        vwapAvailable: number;
        emaAvailable: number;
        gapsDetected: number;
        openingRangeAvailable: number;
        haltWatch: number;
        weakDataQuality: number;
    };
    symbols: AdvancedCandleContextSymbolReport[];
};
export type BuildAdvancedCandleContextReportOptions = {
    cacheDirectoryPath?: string;
    provider?: CandleProviderName;
    symbols?: string[];
    maxSymbols?: number;
};
export type WriteAdvancedCandleContextReportOptions = BuildAdvancedCandleContextReportOptions & {
    jsonPath: string;
    markdownPath: string;
};
export declare function buildAdvancedCandleContextReport(options?: BuildAdvancedCandleContextReportOptions): Promise<AdvancedCandleContextReport>;
export declare function formatAdvancedCandleContextMarkdown(report: AdvancedCandleContextReport): string;
export declare function writeAdvancedCandleContextReport(options: WriteAdvancedCandleContextReportOptions): Promise<AdvancedCandleContextReport>;
//# sourceMappingURL=advanced-candle-context-report.d.ts.map