// =========================
// 2026-04-12 03:42 PM America/Toronto
// EXECUTION FREQUENCY PATTERNS
// =========================
//
// PURPOSE:
// Detects execution pacing patterns from PatternInput.
//
// CURRENT DESIGN:
// These are atomic patterns because each one describes a single,
// isolated structural pacing condition.
//
// FUTURE NOTE:
// This family may later become a full state family with an explicit
// normal_frequency_execution pattern.
//

import type { PatternDefinition } from "../types/pattern-detection-types";
import {
  PATTERN_FAMILIES,
  THRESHOLDS,
} from "../types/pattern-detection-types";

export const HIGH_FREQUENCY_EXECUTION: PatternDefinition = {
  id: "high_frequency_execution",
  name: "High Frequency Execution",
  family: PATTERN_FAMILIES.EXECUTION_FREQUENCY,
  patternType: "atomic",
  structuralLevel: "atomic",

  evaluate: (input) => {
    const threshold =
      THRESHOLDS.EXECUTION_FREQUENCY.HIGH_MIN_EXECUTIONS_PER_MINUTE;
    const value = input.executionsPerMinute ?? 0;

    return {
      matched: value >= threshold,
      evidence: {
        executionsPerMinute: value,
      },
      thresholdsUsed: {
        minExecutionsPerMinute: threshold,
      },
    };
  },
};

export const LOW_FREQUENCY_EXECUTION: PatternDefinition = {
  id: "low_frequency_execution",
  name: "Low Frequency Execution",
  family: PATTERN_FAMILIES.EXECUTION_FREQUENCY,
  patternType: "atomic",
  structuralLevel: "atomic",

  evaluate: (input) => {
    const threshold =
      THRESHOLDS.EXECUTION_FREQUENCY.LOW_MAX_EXECUTIONS_PER_MINUTE;
    const value = input.executionsPerMinute ?? 0;

    return {
      matched: value <= threshold,
      evidence: {
        executionsPerMinute: value,
      },
      thresholdsUsed: {
        maxExecutionsPerMinute: threshold,
      },
    };
  },
};

export const EXECUTION_FREQUENCY_PATTERNS: PatternDefinition[] = [
  HIGH_FREQUENCY_EXECUTION,
  LOW_FREQUENCY_EXECUTION,
];
