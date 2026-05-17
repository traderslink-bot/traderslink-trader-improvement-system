import type { PatternDefinition } from "../../types/pattern-detection-types";
import { BASE_SCALING_SETUP_PATTERNS } from "./base-scaling-setup-patterns";
import { SCALING_OUTCOME_OVERLAY_PATTERNS } from "./outcome-overlay-patterns";
import { RECOVERY_OVERLAY_PATTERNS } from "./recovery-overlay-patterns";
import { REPEATED_CYCLE_OVERLAY_PATTERNS } from "./repeated-cycle-overlay-patterns";
import { SCALING_QUALITY_PATTERNS as SCALING_QUALITY_PATTERN_BANK } from "./scaling-quality-pattern-bank";
import { SUPPORT_RESISTANCE_OVERLAY_PATTERNS } from "./support-resistance-overlay-patterns";

const SCALING_PATTERN_LANES: PatternDefinition[][] = [
  BASE_SCALING_SETUP_PATTERNS,
  SCALING_OUTCOME_OVERLAY_PATTERNS,
  RECOVERY_OVERLAY_PATTERNS,
  REPEATED_CYCLE_OVERLAY_PATTERNS,
  SUPPORT_RESISTANCE_OVERLAY_PATTERNS,
];

export const SCALING_QUALITY_PATTERNS: PatternDefinition[] = (() => {
  const seenPatternIds = new Set<string>();
  const assembledPatterns: PatternDefinition[] = [];

  for (const lane of SCALING_PATTERN_LANES) {
    for (const pattern of lane) {
      if (seenPatternIds.has(pattern.id)) {
        continue;
      }

      seenPatternIds.add(pattern.id);
      assembledPatterns.push(pattern);
    }
  }

  if (assembledPatterns.length !== SCALING_QUALITY_PATTERN_BANK.length) {
    throw new Error(
      `Scaling-quality pattern assembly mismatch: assembled ${assembledPatterns.length} but bank contains ${SCALING_QUALITY_PATTERN_BANK.length}.`,
    );
  }

  return assembledPatterns;
})();
