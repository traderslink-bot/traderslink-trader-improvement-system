// =========================
// PATTERN SUPPRESSION RULE TYPES
// =========================
//
// PURPOSE:
// Shared Layer 3 suppression contracts used by registry modules and the thin
// assembly entrypoint.

export type SuppressionOutcome =
  | "demote_to_supporting"
  | "demote_to_contextual";

export interface PatternDominanceRule {
  dominantPatternId: string;
  suppressedPatternId: string;
  outcome: SuppressionOutcome;
  reason: string;
}

export interface PatternSuppressionGroup {
  groupId: string;
  description: string;
  patternIds: string[];
}
