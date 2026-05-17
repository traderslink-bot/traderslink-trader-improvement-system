import type { StructuralLevel } from "../../pattern-detection/types/pattern-detection-types";
import type { NormalizationRole } from "../../pattern-normalization/pattern-metadata";
import type {
  PatternScorePolarity,
  PatternScorePolaritySource,
  PatternScoringConfidence,
  ScoringDominanceFlag,
} from "./pattern-scoring-result";

export type FamilyShapeClassification =
  | "light_context"
  | "structural"
  | "storyline_heavy"
  | "mixed_shape";

export type FamilyCalibrationNote =
  | "storyline_heavy"
  | "fallback_heavy"
  | "explicit_non_directional"
  | "light_context_like"
  | "context_stack_guarded"
  | "richness_contained"
  | "adjustment_heavy"
  | "contribution_concentrated";

export interface FamilyCalibrationTopContributor {
  patternId: string;
  contributionScore: number;
  absoluteContribution: number;
  structuralLevel: StructuralLevel;
  normalizedRole: NormalizationRole;
  polarity: PatternScorePolarity;
  polaritySource: PatternScorePolaritySource;
}

export interface FamilyCalibrationEntry {
  family: string;
  totalPatternCount: number;
  structuralLevelCounts: Record<StructuralLevel, number>;
  normalizedRoleCounts: Record<NormalizationRole, number>;
  polaritySourceBreakdown: Record<PatternScorePolaritySource, number>;
  explicitPolarityCount: number;
  fallbackPolarityCount: number;
  directionalPatternCount: number;
  nonDirectionalPatternCount: number;
  familyAdjustedContributionCount: number;
  richnessContainedContributionCount: number;
  contextContainedContributionCount: number;
  summedAbsoluteRawMagnitude: number;
  summedAbsoluteAdjustedMagnitude: number;
  magnitudeAdjustmentDelta: number;
  magnitudeAdjustmentRatio: number;
  summedAbsoluteContribution: number;
  averageAbsoluteContribution: number;
  absoluteContributionShare: number;
  topContributorShareOfFamily: number;
  effectiveDirectionalImpact: number;
  topContributingPattern: FamilyCalibrationTopContributor | null;
  familyShape: FamilyShapeClassification;
  notes: FamilyCalibrationNote[];
}

export interface FamilyCalibrationReport {
  totalFamilies: number;
  totalPatterns: number;
  totalAbsoluteContribution: number;
  dominantFamilies: string[];
  suppressedFamilies: string[];
  overContainedFamilies: string[];
  dominanceSummary: {
    flags: ScoringDominanceFlag[];
    dominantFamily: string | null;
    highestDominanceScore: number;
    balancedDistribution: boolean;
  };
  suppressionSummary: {
    familyAdjustedFamilies: string[];
    richnessContainedFamilies: string[];
    contextContainedFamilies: string[];
    dominanceSoftCappedFamilies: string[];
  };
  traceSummary: {
    rawTotalPressure: number;
    adjustedTotalPressure: number;
    effectiveDirectionalTotal: number;
    dominantFamily: string | null;
  };
  confidenceIndicators: {
    reliability: PatternScoringConfidence;
    fallbackHeavyFamilyCount: number;
    explicitNonDirectionalFamilyCount: number;
    overContainedFamilyCount: number;
  };
  families: FamilyCalibrationEntry[];
}
