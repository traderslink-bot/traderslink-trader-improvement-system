// =========================
// 2026-04-12 03:42 PM America/Toronto
// TRADE DURATION PATTERNS
// =========================
//
// PURPOSE:
// Detects notable duration states from PatternInput.
//
// CURRENT DESIGN:
// These are atomic edge-state detections.
//
// FUTURE NOTE:
// This family may later add an explicit normal_duration_trade pattern.
//

import type { PatternDefinition } from "../types/pattern-detection-types";
import {
  PATTERN_FAMILIES,
  THRESHOLDS,
} from "../types/pattern-detection-types";

export const QUICK_TRADE: PatternDefinition = {
  id: "quick_trade",
  name: "Quick Trade",
  family: PATTERN_FAMILIES.TRADE_DURATION,
  patternType: "atomic",
  structuralLevel: "atomic",

  evaluate: (input) => {
    const threshold =
      THRESHOLDS.TRADE_DURATION.QUICK_MAX_DURATION_SECONDS;

    return {
      matched: input.tradeDurationSeconds <= threshold,
      evidence: {
        tradeDurationSeconds: input.tradeDurationSeconds,
      },
      thresholdsUsed: {
        maxDurationSeconds: threshold,
      },
    };
  },
};

export const EXTENDED_TRADE: PatternDefinition = {
  id: "extended_trade",
  name: "Extended Trade",
  family: PATTERN_FAMILIES.TRADE_DURATION,
  patternType: "atomic",
  structuralLevel: "atomic",

  evaluate: (input) => {
    const threshold =
      THRESHOLDS.TRADE_DURATION.EXTENDED_MIN_DURATION_SECONDS;

    return {
      matched: input.tradeDurationSeconds >= threshold,
      evidence: {
        tradeDurationSeconds: input.tradeDurationSeconds,
      },
      thresholdsUsed: {
        minDurationSeconds: threshold,
      },
    };
  },
};

export const TRADE_DURATION_PATTERNS: PatternDefinition[] = [
  QUICK_TRADE,
  EXTENDED_TRADE,
];
