import type {
  NormalizedDetectedPattern,
} from "../../pattern-normalization/types/normalized-pattern-result";
import type { StructuralLevel } from "../../pattern-detection/types/pattern-detection-types";
import type { NormalizationRole } from "../../pattern-normalization/pattern-metadata";

export type PatternScorePolarity =
  | "positive"
  | "negative"
  | "mixed";

export type PatternScorePolaritySource =
  | "explicit_map"
  | "fallback_mixed";

export type PatternScoreFamilyInfluenceSource =
  | "default"
  | "family_adjusted";

export type PatternScoreRichnessContainmentSource =
  | "none"
  | "storyline_family_contained"
  | "storyline_family_contained_with_supporting_decay";

export type PatternScoreContextContainmentSource =
  | "none"
  | "light_context_family_contained";

export type PatternScoreDominanceContainmentSource =
  | "none"
  | "family_dominance_soft_capped";

export type PatternScoreBand =
  | "strong_negative"
  | "negative"
  | "mixed"
  | "positive"
  | "strong_positive";

export interface PatternScoringBonusConfig {
  familyAnchorBonus: number;
  topAnchorBonus: number;
}

export interface PatternScoreContribution {
  patternId: string;
  family: string;
  normalizedRole: NormalizationRole;
  structuralLevel: StructuralLevel;
  polarity: PatternScorePolarity;
  polaritySource: PatternScorePolaritySource;
  baseWeight: number;
  roleWeightedBaseScore: number;
  roleMultiplier: number;
  familyInfluenceMultiplier: number;
  familyInfluenceSource: PatternScoreFamilyInfluenceSource;
  richnessContainmentMultiplier: number;
  richnessContainmentSource: PatternScoreRichnessContainmentSource;
  contextContainmentMultiplier: number;
  contextContainmentSource: PatternScoreContextContainmentSource;
  dominanceContainmentMultiplier: number;
  dominanceContainmentSource: PatternScoreDominanceContainmentSource;
  familyAnchorBonus: number;
  topAnchorBonus: number;
  magnitudeBeforeFamilyInfluence: number;
  magnitudeAfterFamilyInfluence: number;
  magnitudeAfterRichnessContainment: number;
  magnitudeAfterContextContainment: number;
  finalWeightedMagnitude: number;
  contributionScore: number;
  isPrimaryFamilyAnchor: boolean;
  isTopOverallAnchor: boolean;
  transformationTrace: PatternScoreTransformationStep[];
}

export interface PatternScoreTransformationStep {
  step:
    | "base_role_bonus"
    | "family_influence"
    | "richness_containment"
    | "context_containment"
    | "dominance_soft_cap";
  source: string;
  inputMagnitude: number;
  multiplier: number;
  outputMagnitude: number;
  delta: number;
}

export type ScoringDominanceFlag =
  | "single_family_dominant"
  | "stacked_pattern_dominant"
  | "balanced_distribution";

export type PatternScoringConfidence =
  | "high"
  | "moderate"
  | "low";

export interface PatternScoringTraceFamily {
  family: string;
  rawFamilyPressure: number;
  adjustedFamilyPressure: number;
  effectiveDirectionalImpact: number;
  familyInfluenceRatio: number;
  dominanceScore: number;
  topContributorPatternId: string | null;
  topContributorShareOfFamily: number;
  directionalPatternCount: number;
  nonDirectionalPatternCount: number;
  flags: string[];
  contributionPatternIds: string[];
}

export interface PatternScoringTraceSummary {
  rawTotalMagnitude: number;
  adjustedTotalMagnitude: number;
  effectiveDirectionalTotal: number;
  deltaByTransformationType: {
    familyInfluence: number;
    richnessContainment: number;
    contextContainment: number;
    dominanceSoftCap: number;
  };
  dominanceFlags: ScoringDominanceFlag[];
  dominantFamily: string | null;
  highestDominanceScore: number;
  confidence: PatternScoringConfidence;
}

export interface PatternScoringTrace {
  orderedContributions: PatternScoreContribution[];
  groupedByFamily: PatternScoringTraceFamily[];
  summary: PatternScoringTraceSummary;
}

export interface PatternScoringSuppressionSummary {
  familyAdjustedFamilies: string[];
  richnessContainedFamilies: string[];
  contextContainedFamilies: string[];
  dominanceSoftCappedFamilies: string[];
}

export interface PatternScoringSummary {
  topOverallAnchorPattern: NormalizedDetectedPattern | null;
  primaryPatternCount: number;
  supportingPatternCount: number;
  contextualPatternCount: number;
  familyAnchorCount: number;
  appliedBonusConfig: PatternScoringBonusConfig;
  dominantFamily: string | null;
  dominanceFlags: ScoringDominanceFlag[];
  confidence: PatternScoringConfidence;
}

export interface PatternScoringResult {
  // Conservative 0-100 trade-level score for the first architecture slice.
  overallScore: number;

  // Raw directional totals before final normalization.
  positiveScore: number;
  negativeScore: number;
  netScore: number;

  scoreBand: PatternScoreBand;
  contributions: PatternScoreContribution[];
  trace: PatternScoringTrace;
  suppressionSummary: PatternScoringSuppressionSummary;
  summary: PatternScoringSummary;
}
