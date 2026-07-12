import type { CandleFetchTimeframe, CandleProviderName } from "../market-data/candle-types.js";
import type { FinalLevelZone } from "../levels/level-types.js";
import { type CandleMarketStructureConfidence, type CandleMarketStructureState } from "../structure/index.js";
import { type ForwardReactionLevelResult, type ForwardReactionVolumeSummary } from "../validation/forward-reaction-validator.js";
export type SupportResistanceCalibrationVerdict = "trusted" | "watch" | "broken" | "unproven";
export type SupportResistanceCalibrationCoveragePriority = "fetch_first" | "fetch_next" | "fetch_later";
export type SupportResistanceCalibrationCoverageGap = {
    symbol: string;
    sessionDate: string | null;
    timeframe: CandleFetchTimeframe;
    priority: SupportResistanceCalibrationCoveragePriority;
    reason: string;
    suggestedStartAt: number | null;
    suggestedEndAt: number | null;
    storedCandles: number;
    minimumUsefulCandles: number;
};
export type SupportResistanceCalibrationLevelSummary = {
    price: number;
    kind: "support" | "resistance";
    strengthLabel: FinalLevelZone["strengthLabel"];
    timeframeBias: FinalLevelZone["timeframeBias"];
    source: "surfaced" | "extension";
};
export type SupportResistanceForwardLadderAudit = {
    verdict: SupportResistanceCalibrationVerdict;
    nearestSupport: SupportResistanceCalibrationLevelSummary | null;
    nearestResistance: SupportResistanceCalibrationLevelSummary | null;
    nextSupport: SupportResistanceCalibrationLevelSummary | null;
    nextResistance: SupportResistanceCalibrationLevelSummary | null;
    firstSupportGapPct: number | null;
    firstResistanceGapPct: number | null;
    tightSupportClusterCount: number;
    tightResistanceClusterCount: number;
    futureHighPct: number | null;
    futureLowPct: number | null;
    reasons: string[];
};
export type SupportResistanceForwardReactionAudit = {
    verdict: SupportResistanceCalibrationVerdict;
    totalLevelsEvaluated: number;
    surfacedLevelsEvaluated: number;
    extensionLevelsEvaluated: number;
    surfacedTouchRate: number;
    surfacedUsefulWhenTouchedRate: number;
    surfacedBreakRate: number;
    extensionTouchRate: number;
    extensionUsefulWhenTouchedRate: number;
    extensionBreakRate: number;
    volumeEvidence: ForwardReactionVolumeSummary;
    examples: ForwardReactionLevelResult[];
    reasons: string[];
};
export type SupportResistanceRankingProofBucket = {
    bucket: string;
    evaluated: number;
    touched: number;
    usefulnessRate: number;
    usefulWhenTouchedRate: number;
    breakRate: number;
    conclusion: SupportResistanceCalibrationVerdict;
};
export type SupportResistanceRankingProof = {
    verdict: SupportResistanceCalibrationVerdict;
    buckets: SupportResistanceRankingProofBucket[];
    strongestEvidence: string[];
    weakestEvidence: string[];
};
export type SupportResistanceMarketStructureLink = {
    state: CandleMarketStructureState | "unavailable";
    confidenceLabel: CandleMarketStructureConfidence["label"] | "none";
    confidenceScore: number;
    rangeLow: number | null;
    rangeHigh: number | null;
    rangeWidthPct: number | null;
    latestSwingLow: number | null;
    latestSwingHigh: number | null;
    alignment: "supports_ladder" | "questions_ladder" | "neutral" | "insufficient";
    reasons: string[];
};
export type SupportResistanceCalibrationSymbolReport = {
    symbol: string;
    verdict: SupportResistanceCalibrationVerdict;
    postCount: number;
    firstPostAt: number | null;
    lastPostAt: number | null;
    currentPrice: number | null;
    candles: {
        daily: number;
        fourHour: number;
        fiveMinute: number;
        futureFiveMinute: number;
    };
    levelCounts: {
        surfacedSupport: number;
        surfacedResistance: number;
        extensionSupport: number;
        extensionResistance: number;
    };
    forwardReaction: SupportResistanceForwardReactionAudit;
    forwardLadder: SupportResistanceForwardLadderAudit;
    rankingProof: SupportResistanceRankingProof;
    marketStructure: SupportResistanceMarketStructureLink;
    coverageGaps: SupportResistanceCalibrationCoverageGap[];
    examples: string[];
};
export type SupportResistanceCalibrationReport = {
    generatedAt: string;
    sourceAuditPath: string;
    sourceAuditPaths: string[];
    cacheDirectoryPath: string;
    warehouseDirectoryPath: string | null;
    provider: CandleProviderName;
    symbolsReviewed: number;
    totals: {
        trusted: number;
        watch: number;
        broken: number;
        unproven: number;
        missingCandleSymbols: number;
        wideForwardGapSymbols: number;
        noForwardResistanceSymbols: number;
        noForwardSupportSymbols: number;
        crowdedForwardSymbols: number;
        coverageGapTasks: number;
        fetchFirstCoverageGaps: number;
        rankingWatchSymbols: number;
        structureQuestionSymbols: number;
    };
    symbols: SupportResistanceCalibrationSymbolReport[];
};
export type SupportResistanceCalibrationGateStatus = "pass" | "review" | "fail";
export type SupportResistanceCalibrationGateOptions = {
    maxBrokenSymbols?: number;
    maxWatchSymbols?: number;
    maxUnprovenPct?: number;
    maxFetchFirstCoverageGaps?: number;
    maxNoForwardResistanceSymbols?: number;
    maxRankingWatchSymbols?: number;
    maxStructureQuestionSymbols?: number;
};
export type SupportResistanceCalibrationGateViolation = {
    status: Exclude<SupportResistanceCalibrationGateStatus, "pass">;
    code: string;
    reason: string;
    observed: number;
    allowed: number;
};
export type SupportResistanceCalibrationGateResult = {
    generatedAt: string;
    status: SupportResistanceCalibrationGateStatus;
    sourceAuditPath: string;
    totals: SupportResistanceCalibrationReport["totals"] & {
        symbolsReviewed: number;
        unprovenPct: number;
    };
    thresholds: Required<SupportResistanceCalibrationGateOptions>;
    violations: SupportResistanceCalibrationGateViolation[];
};
export type BuildSupportResistanceCalibrationReportOptions = {
    auditPath: string;
    cacheDirectoryPath?: string;
    warehouseDirectoryPath?: string;
    provider?: CandleProviderName;
    maxSymbols?: number;
    maxAuditFiles?: number;
};
export type WriteSupportResistanceCalibrationReportOptions = BuildSupportResistanceCalibrationReportOptions & {
    jsonPath: string;
    markdownPath: string;
};
export declare function buildSupportResistanceCalibrationReport(options: BuildSupportResistanceCalibrationReportOptions): Promise<SupportResistanceCalibrationReport>;
export declare function formatSupportResistanceCalibrationReport(report: SupportResistanceCalibrationReport): string;
export declare function evaluateSupportResistanceCalibrationGate(report: SupportResistanceCalibrationReport, options?: SupportResistanceCalibrationGateOptions): SupportResistanceCalibrationGateResult;
export declare function formatSupportResistanceCalibrationGate(result: SupportResistanceCalibrationGateResult): string;
export declare function writeSupportResistanceCalibrationGate(params: {
    report: SupportResistanceCalibrationReport;
    options?: SupportResistanceCalibrationGateOptions;
    jsonPath: string;
    markdownPath: string;
}): SupportResistanceCalibrationGateResult;
export declare function writeSupportResistanceCalibrationReport(options: WriteSupportResistanceCalibrationReportOptions): Promise<SupportResistanceCalibrationReport>;
//# sourceMappingURL=support-resistance-calibration-report.d.ts.map