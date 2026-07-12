import type { LevelSurfacedValidationInput, SurfacedValidationComparison, SurfacedValidationWinner } from "./level-surfaced-validation.js";
export type SurfacedShadowTag = "support_hold" | "resistance_rejection" | "clean_breakout" | "weak_clutter" | "anchor_case" | "broken_level_case" | "support_case" | "resistance_case" | "near_price_case" | "mixed_case" | "first_interaction_case" | "flipped_case" | "untagged";
export type LevelSurfacedShadowCaseInput = LevelSurfacedValidationInput & {
    tags?: string[];
};
export type LevelSurfacedShadowEvaluationInput = {
    cases: LevelSurfacedShadowCaseInput[];
    reviewQueueSize?: number;
};
export type SurfacedShadowMetricWins = {
    old: number;
    new: number;
    tied: number;
};
export type SurfacedShadowManualReviewReason = "closest_score_delta" | "old_clear_win" | "contradictory_result" | "limited_evidence";
export type SurfacedShadowManualReviewItem = {
    caseId: string;
    symbol: string;
    winner: SurfacedValidationWinner;
    scoreDelta: number;
    reason: SurfacedShadowManualReviewReason;
    notes: string[];
    tags: string[];
};
export type SurfacedShadowCaseResult = {
    caseId: string;
    symbol: string;
    tags: string[];
    validation: SurfacedValidationComparison;
    winner: SurfacedValidationWinner;
    scoreDelta: number;
    keyReason: string;
    notableSurfacedDifference: string;
    limitedEvidence: boolean;
};
export type SurfacedShadowCategoryBreakdown = {
    tag: string;
    totalCases: number;
    oldWins: number;
    newWins: number;
    mixed: number;
    inconclusive: number;
    averageValidationScoreOld: number;
    averageValidationScoreNew: number;
    averageScoreDelta: number;
};
export type SurfacedShadowMigrationReadiness = "continue_shadow_mode" | "ready_for_more_real_case_expansion" | "needs_surface_calibration" | "ready_for_optional_runtime_flag_exploration" | "blocked_by_old_path_strength_in_key_categories";
export type SurfacedShadowAggregateSummary = {
    totalCases: number;
    oldWins: number;
    newWins: number;
    mixed: number;
    inconclusive: number;
    averageValidationScoreOld: number;
    averageValidationScoreNew: number;
    averageScoreDelta: number;
    practicalMetricWins: {
        clutterReduction: SurfacedShadowMetricWins;
        firstInteractionAlignment: SurfacedShadowMetricWins;
        actionableNearPriceQuality: SurfacedShadowMetricWins;
        structuralSanity: SurfacedShadowMetricWins;
        anchorUsefulness: SurfacedShadowMetricWins;
    };
    biggestNewWins: Array<{
        caseId: string;
        symbol: string;
        scoreDelta: number;
    }>;
    biggestOldWins: Array<{
        caseId: string;
        symbol: string;
        scoreDelta: number;
    }>;
    manualReviewQueue: SurfacedShadowManualReviewItem[];
    migrationReadiness: SurfacedShadowMigrationReadiness;
};
export type SurfacedShadowEvaluationReport = {
    caseResults: SurfacedShadowCaseResult[];
    aggregateSummary: SurfacedShadowAggregateSummary;
    categoryBreakdowns: SurfacedShadowCategoryBreakdown[];
};
export declare function summarizeSurfacedShadowResults(caseResults: SurfacedShadowCaseResult[], reviewQueueSize?: number): Pick<SurfacedShadowEvaluationReport, "aggregateSummary" | "categoryBreakdowns">;
export declare function evaluateSurfacedShadowBatch(input: LevelSurfacedShadowEvaluationInput): SurfacedShadowEvaluationReport;
export declare function buildDefaultSurfacedShadowCases(): LevelSurfacedShadowCaseInput[];
//# sourceMappingURL=level-surfaced-shadow-evaluation.d.ts.map