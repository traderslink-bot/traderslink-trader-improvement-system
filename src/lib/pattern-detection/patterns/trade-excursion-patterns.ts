// =========================
// 2026-04-12 03:42 PM America/Toronto
// TRADE EXCURSION PATTERNS
// =========================
//
// PURPOSE:
// Detects isolated favorable and adverse excursion facts from PatternInput.
//
// CURRENT DESIGN:
// These are atomic patterns.
//

import type { PatternDefinition } from "../types/pattern-detection-types";
import {
  PATTERN_FAMILIES,
  THRESHOLDS,
} from "../types/pattern-detection-types";

export const HIGH_MFE_TRADE: PatternDefinition = {
  id: "high_mfe_trade",
  name: "High MFE Trade",
  family: PATTERN_FAMILIES.TRADE_EXCURSION,
  patternType: "atomic",
  structuralLevel: "atomic",

  evaluate: (input) => {
    const threshold = THRESHOLDS.TRADE_EXCURSION.HIGH_MFE_MIN_PCT;
    const value = input.tradeMfePct ?? 0;

    return {
      matched: value >= threshold,
      evidence: {
        tradeMfePct: value,
      },
      thresholdsUsed: {
        minMfePct: threshold,
      },
    };
  },
};

export const HIGH_MAE_TRADE: PatternDefinition = {
  id: "high_mae_trade",
  name: "High MAE Trade",
  family: PATTERN_FAMILIES.TRADE_EXCURSION,
  patternType: "atomic",
  structuralLevel: "atomic",

  evaluate: (input) => {
    const threshold = THRESHOLDS.TRADE_EXCURSION.HIGH_MAE_MIN_PCT;
    const value = input.tradeMaePct ?? 0;

    return {
      matched: value >= threshold,
      evidence: {
        tradeMaePct: value,
      },
      thresholdsUsed: {
        minMaePct: threshold,
      },
    };
  },
};

export const TRADE_EXCURSION_PATTERNS: PatternDefinition[] = [
  HIGH_MFE_TRADE,
  HIGH_MAE_TRADE,
];
