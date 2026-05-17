// =========================
// ROLE: BEHAVIOR ANALYSIS TUNING
// =========================
//
// Centralizes the numeric and family-level tuning values that shape
// trade-level behavior scoring.
//
// Add here:
// - stable thresholds
// - weighting constants
// - family sets used by behavior-analysis scoring
//
// Do not add here:
// - behavior registry entries
// - coaching copy
// - trader-profile logic

import type { BehaviorClass, BehaviorSeverity } from "../types/behavior-analysis-types";

export const OUTCOME_SENSITIVE_FAMILIES = new Set([
  "exit_quality",
  "position_reduction",
  "scaling_quality",
]);

export const BEHAVIOR_SEVERITY_THRESHOLDS = {
  high: 4.5,
  moderate: 2,
} as const;

export const BEHAVIOR_SEVERITY_WEIGHTS: Record<BehaviorSeverity, number> = {
  high: 3,
  moderate: 1.75,
  low: 0.8,
};

export const CLASS_BIAS_BY_BEHAVIOR_CLASS: Record<BehaviorClass, number> = {
  destructive_mistake: 1.3,
  costly_mistake: 0.8,
  edge: 1.1,
  improving: 0.5,
  neutral: 0,
};

export const STRUCTURAL_CORRECTNESS_THRESHOLDS = {
  correctSignedImpactFloor: 0.75,
  incorrectSignedImpactCeiling: -0.75,
} as const;

export const DESTRUCTIVE_CLASS_THRESHOLDS = {
  signedImpactCeiling: -2,
  outcomeImpactFloor: 0.7,
  costlyMistakeSignedImpactCeiling: -0.75,
} as const;

export const POSITIVE_CLASS_THRESHOLDS = {
  edgeSignedImpactFloor: 3,
  edgeOutcomeImpactFloor: 0.75,
  improvingSignedImpactFloor: 0.75,
} as const;

export const OUTCOME_IMPACT_WEIGHTS = {
  storylineOrOutcomeLinkedEvidence: 0.65,
  signedImpact: 0.18,
  maxScore: 2.5,
} as const;

export const PRIORITY_SCORE_WEIGHTS = {
  signalStrength: 1.15,
  familyInfluenceDelta: 3,
} as const;

export const SIGNAL_STRENGTH_WEIGHTS = {
  primaryEvidence: 0.5,
  explicitEvidence: 0.25,
} as const;

export const CONFLICT_PENALTY_WEIGHTS = {
  maxPenalty: 2.5,
  strengthGapMultiplier: 0.2,
  minimumPenaltyPerStrongerOpponent: 0.35,
} as const;

export const SECONDARY_SIGNAL_THRESHOLDS = {
  absoluteFloor: 1.5,
  primaryShare: 0.45,
} as const;
