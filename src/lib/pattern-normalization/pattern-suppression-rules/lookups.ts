// =========================
// PATTERN SUPPRESSION LOOKUPS
// =========================
//
// PURPOSE:
// Builds deterministic lookup tables and query helpers over the assembled
// dominance and overlap registries.

import { PATTERN_DOMINANCE_RULES } from "./metadata-inferred-dominance-rules";
import { PATTERN_SUPPRESSION_GROUPS } from "./suppression-groups";
import type {
  PatternDominanceRule,
  PatternSuppressionGroup,
} from "./types";

export const PATTERN_DOMINANCE_RULES_BY_DOMINANT_ID: Record<
  string,
  PatternDominanceRule[]
> = PATTERN_DOMINANCE_RULES.reduce<Record<string, PatternDominanceRule[]>>(
  (accumulator, rule) => {
    if (!accumulator[rule.dominantPatternId]) {
      accumulator[rule.dominantPatternId] = [];
    }

    accumulator[rule.dominantPatternId].push(rule);
    return accumulator;
  },
  {},
);

export const PATTERN_DOMINANCE_RULES_BY_SUPPRESSED_ID: Record<
  string,
  PatternDominanceRule[]
> = PATTERN_DOMINANCE_RULES.reduce<Record<string, PatternDominanceRule[]>>(
  (accumulator, rule) => {
    if (!accumulator[rule.suppressedPatternId]) {
      accumulator[rule.suppressedPatternId] = [];
    }

    accumulator[rule.suppressedPatternId].push(rule);
    return accumulator;
  },
  {},
);

export function getDominanceRulesForDominantPattern(
  patternId: string,
): PatternDominanceRule[] {
  return PATTERN_DOMINANCE_RULES_BY_DOMINANT_ID[patternId] ?? [];
}

export function getDominanceRulesForSuppressedPattern(
  patternId: string,
): PatternDominanceRule[] {
  return PATTERN_DOMINANCE_RULES_BY_SUPPRESSED_ID[patternId] ?? [];
}

export function getSuppressionGroupsForPattern(
  patternId: string,
): PatternSuppressionGroup[] {
  return PATTERN_SUPPRESSION_GROUPS.filter((group) =>
    group.patternIds.includes(patternId),
  );
}
