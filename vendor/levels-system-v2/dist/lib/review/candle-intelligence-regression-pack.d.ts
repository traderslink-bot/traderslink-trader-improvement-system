import type { CandleProviderName } from "../support-resistance/index.js";
export type CandleIntelligenceRegressionCaseType = "weak_first_snapshot" | "volume_may_help" | "volume_should_hide" | "execution_relation_context" | "execution_relation_missing_evidence" | "missing_forward_resistance" | "first_snapshot_map_failure" | "market_structure_chop_watch" | "advanced_context_missing" | "provider_readiness_watch" | "quiet_may_hide_move" | "runtime_feed_silence" | "post_noise_budget_watch" | "support_resistance_watch" | "support_resistance_broken" | "support_resistance_unproven_coverage";
export type CandleIntelligenceRegressionCaseSeverity = "watch" | "test_candidate" | "major_candidate";
export type CandleIntelligenceRegressionCase = {
    id: string;
    type: CandleIntelligenceRegressionCaseType;
    severity: CandleIntelligenceRegressionCaseSeverity;
    symbol: string;
    timestampIso: string | null;
    reason: string;
    evidence: string;
    sourceReport: string;
};
export type CandleIntelligenceRegressionPack = {
    generatedAt: string;
    sourceAuditPath: string;
    cacheDirectoryPath: string;
    warehouseDirectoryPath: string | null;
    provider: CandleProviderName;
    totals: {
        cases: number;
        weakFirstSnapshot: number;
        volumeMayHelp: number;
        volumeShouldHide: number;
        executionRelationContext: number;
        executionRelationMissingEvidence: number;
        missingForwardResistance: number;
        firstSnapshotMapFailure: number;
        marketStructureChopWatch: number;
        advancedContextMissing: number;
        providerReadinessWatch: number;
        quietMayHideMove: number;
        runtimeFeedSilence: number;
        postNoiseBudgetWatch: number;
        supportResistanceWatch: number;
        supportResistanceBroken: number;
        supportResistanceUnprovenCoverage: number;
    };
    cases: CandleIntelligenceRegressionCase[];
};
export type GenerateCandleIntelligenceRegressionPackOptions = {
    auditPath: string;
    cacheDirectoryPath?: string;
    warehouseDirectoryPath?: string;
    provider?: CandleProviderName;
    comparisonProvider?: CandleProviderName;
    maxCasesPerType?: number;
};
export type WriteCandleIntelligenceRegressionPackOptions = GenerateCandleIntelligenceRegressionPackOptions & {
    jsonPath: string;
    markdownPath: string;
};
export type CandleIntelligenceRegressionGateStatus = "pass" | "review" | "fail";
export type CandleIntelligenceRegressionGateOptions = {
    maxMajorCandidateCases?: number;
    maxWeakFirstSnapshotCases?: number;
    maxMissingForwardResistanceCases?: number;
    maxExecutionRelationMissingEvidenceCases?: number;
    maxFirstSnapshotMapFailureCases?: number;
    maxMarketStructureChopWatchCases?: number;
    maxAdvancedContextMissingCases?: number;
    maxProviderReadinessWatchCases?: number;
    maxQuietMayHideMoveCases?: number;
    maxRuntimeFeedSilenceCases?: number;
    maxPostNoiseBudgetWatchCases?: number;
    maxSupportResistanceWatchCases?: number;
    maxSupportResistanceBrokenCases?: number;
    maxSupportResistanceUnprovenCoverageCases?: number;
    requiredCaseTypes?: CandleIntelligenceRegressionCaseType[];
};
export type CandleIntelligenceRegressionGateViolation = {
    status: Exclude<CandleIntelligenceRegressionGateStatus, "pass">;
    code: string;
    reason: string;
    observed: number;
    allowed: number;
};
export type CandleIntelligenceRegressionGateResult = {
    generatedAt: string;
    status: CandleIntelligenceRegressionGateStatus;
    sourceAuditPath: string;
    totals: CandleIntelligenceRegressionPack["totals"] & {
        majorCandidateCases: number;
    };
    thresholds: Required<Omit<CandleIntelligenceRegressionGateOptions, "requiredCaseTypes">> & {
        requiredCaseTypes: CandleIntelligenceRegressionCaseType[];
    };
    violations: CandleIntelligenceRegressionGateViolation[];
};
export declare function generateCandleIntelligenceRegressionPack(options: GenerateCandleIntelligenceRegressionPackOptions): Promise<CandleIntelligenceRegressionPack>;
export declare function formatCandleIntelligenceRegressionPack(pack: CandleIntelligenceRegressionPack): string;
export declare function evaluateCandleIntelligenceRegressionGate(pack: CandleIntelligenceRegressionPack, options?: CandleIntelligenceRegressionGateOptions): CandleIntelligenceRegressionGateResult;
export declare function formatCandleIntelligenceRegressionGate(result: CandleIntelligenceRegressionGateResult): string;
export declare function writeCandleIntelligenceRegressionGate(params: {
    pack: CandleIntelligenceRegressionPack;
    options?: CandleIntelligenceRegressionGateOptions;
    jsonPath: string;
    markdownPath: string;
}): CandleIntelligenceRegressionGateResult;
export declare function writeCandleIntelligenceRegressionPack(options: WriteCandleIntelligenceRegressionPackOptions): Promise<CandleIntelligenceRegressionPack>;
//# sourceMappingURL=candle-intelligence-regression-pack.d.ts.map