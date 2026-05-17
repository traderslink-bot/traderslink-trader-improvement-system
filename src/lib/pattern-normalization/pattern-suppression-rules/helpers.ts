// =========================
// PATTERN SUPPRESSION HELPERS
// =========================
//
// PURPOSE:
// Tiny identity helpers that keep registry modules explicit without changing
// the underlying rule data.

import type {
  PatternDominanceRule,
  PatternSuppressionGroup,
} from "./types";

export function defineDominanceRule(
  rule: PatternDominanceRule,
): PatternDominanceRule {
  return rule;
}

export function defineSuppressionGroup(
  group: PatternSuppressionGroup,
): PatternSuppressionGroup {
  return group;
}
