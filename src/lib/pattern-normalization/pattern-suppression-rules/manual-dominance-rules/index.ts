// =========================
// LEGACY MANUAL DOMINANCE RULE REGISTRY
// =========================
//
// PURPOSE:
// Assembles the preserved manual Layer 3 dominance graph from smaller logical
// domain modules without changing rule meaning.

import type { PatternDominanceRule } from "../types";
import { ENTRY_PATTERN_DOMINANCE_RULES } from "./entry-dominance-rules";
import { EXIT_PATTERN_DOMINANCE_RULES } from "./exit-dominance-rules";
import { POSITION_PATTERN_DOMINANCE_RULES } from "./position-dominance-rules";
import { SCALING_PATTERN_DOMINANCE_RULES } from "./scaling-dominance-rules";

export const LEGACY_MANUAL_PATTERN_DOMINANCE_RULES: PatternDominanceRule[] = [
  ...ENTRY_PATTERN_DOMINANCE_RULES,
  ...POSITION_PATTERN_DOMINANCE_RULES,
  ...SCALING_PATTERN_DOMINANCE_RULES,
  ...EXIT_PATTERN_DOMINANCE_RULES,
];
