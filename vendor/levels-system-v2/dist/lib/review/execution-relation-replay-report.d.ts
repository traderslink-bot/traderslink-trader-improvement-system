import { type CandleProviderName, type FinalLevelZone } from "../support-resistance/index.js";
export type ExecutionRelationReplayRecommendation = "already_explained" | "useful_context_available" | "needs_candle_evidence";
export type ExecutionRelationReplaySample = {
    symbol: string;
    timestamp: number;
    timestampIso: string;
    sessionDate: string | null;
    operation?: string;
    title?: string;
    eventType?: string;
    price: number | null;
    recommendation: ExecutionRelationReplayRecommendation;
    reason: string;
    candles: {
        daily: number;
        fourHour: number;
        fiveMinute: number;
    };
    nearestSupportBelow: LevelSummary | null;
    nearestResistanceAbove: LevelSummary | null;
    nearestResistanceBelow: LevelSummary | null;
    roomAbovePct: number | null;
    roomBelowPct: number | null;
    stackedResistanceAboveCount: number | null;
    stackedSupportBelowCount: number | null;
    occurredInOpenAir: boolean | null;
    nearestReferenceLabel: string | null;
    nearestReferencePrice: number | null;
    dynamicContext: {
        vwapDistancePct: number | null;
        ema9DistancePct: number | null;
        ema20DistancePct: number | null;
    };
    marketStructure: {
        state: string | null;
        trend: string | null;
        confidence: string | null;
    };
    excerpt: string;
};
export type LevelSummary = {
    price: number;
    zoneLow: number;
    zoneHigh: number;
    strengthLabel: FinalLevelZone["strengthLabel"];
    timeframeSources: string[];
};
export type ExecutionRelationReplaySymbolReport = {
    symbol: string;
    postsReviewed: number;
    validRelationSamples: number;
    needsCandleEvidenceCount: number;
    usefulContextCount: number;
    alreadyExplainedCount: number;
    openAirCount: number;
    missingForwardResistanceCount: number;
    samples: ExecutionRelationReplaySample[];
};
export type ExecutionRelationReplayReport = {
    generatedAt: string;
    sourceAuditPath: string;
    sourceAuditPaths: string[];
    cacheDirectoryPath: string;
    provider: CandleProviderName;
    totals: {
        postsReviewed: number;
        validRelationSamples: number;
        needsCandleEvidenceCount: number;
        usefulContextCount: number;
        alreadyExplainedCount: number;
        openAirCount: number;
        missingForwardResistanceCount: number;
        symbolsReviewed: number;
    };
    symbols: ExecutionRelationReplaySymbolReport[];
    examples: {
        usefulContextAvailable: ExecutionRelationReplaySample[];
        needsCandleEvidence: ExecutionRelationReplaySample[];
        noForwardResistance: ExecutionRelationReplaySample[];
    };
};
export type GenerateExecutionRelationReplayReportOptions = {
    auditPath: string;
    cacheDirectoryPath?: string;
    provider?: CandleProviderName;
    maxSymbols?: number;
};
export type WriteExecutionRelationReplayReportOptions = GenerateExecutionRelationReplayReportOptions & {
    jsonPath: string;
    markdownPath: string;
};
export declare function generateExecutionRelationReplayReport(options: GenerateExecutionRelationReplayReportOptions): Promise<ExecutionRelationReplayReport>;
export declare function formatExecutionRelationReplayReport(report: ExecutionRelationReplayReport): string;
export declare function writeExecutionRelationReplayReport(options: WriteExecutionRelationReplayReportOptions): Promise<ExecutionRelationReplayReport>;
//# sourceMappingURL=execution-relation-replay-report.d.ts.map