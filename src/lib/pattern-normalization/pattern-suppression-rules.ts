// =========================
// 2026-04-16 03:05 PM America/Toronto
// PATTERN SUPPRESSION RULES
// =========================
//
// PURPOSE:
// Thin Layer 3 assembly entrypoint for suppression groups, manual dominance
// registries, metadata-inferred dominance, and lookup helpers.
//
// MODULE BOUNDARIES:
// - suppression-groups.ts: overlap-group registry
// - manual-dominance-rules/: preserved manual dominance split by logical domain
// - metadata-inferred-dominance-rules.ts: metadata-driven dominance assembly
// - lookups.ts: query helpers over the assembled registries

export type {
  PatternDominanceRule,
  PatternSuppressionGroup,
  SuppressionOutcome,
} from "./pattern-suppression-rules/types";

export { PATTERN_SUPPRESSION_GROUPS } from "./pattern-suppression-rules/suppression-groups";
export { LEGACY_MANUAL_PATTERN_DOMINANCE_RULES } from "./pattern-suppression-rules/manual-dominance-rules";
export {
  MANUAL_EXCEPTION_PATTERN_DOMINANCE_RULES,
  METADATA_DRIVEN_SUPPRESSION_CLASSES,
  METADATA_INFERRED_DOMINANCE_RULE_SUMMARY,
  METADATA_INFERRED_DOMINANCE_RULE_SUMMARY_BY_CLASS,
  METADATA_INFERRED_PATTERN_DOMINANCE_RULES,
  PATTERN_DOMINANCE_RULES,
} from "./pattern-suppression-rules/metadata-inferred-dominance-rules";
export {
  getDominanceRulesForDominantPattern,
  getDominanceRulesForSuppressedPattern,
  getSuppressionGroupsForPattern,
  PATTERN_DOMINANCE_RULES_BY_DOMINANT_ID,
  PATTERN_DOMINANCE_RULES_BY_SUPPRESSED_ID,
} from "./pattern-suppression-rules/lookups";
