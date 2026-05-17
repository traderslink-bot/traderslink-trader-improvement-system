// =========================
// 2026-04-12 05:08 PM America/Toronto
// ENTRY CONTEXT PATTERNS
// =========================
//
// PURPOSE:
// Detects structural entry positioning within the eventual trade range.
//
// IMPORTANT:
// These are atomic patterns.
// They describe WHERE entry occurred, not whether it was good or bad.
//
// FUTURE:
// These will later support:
// - early entry
// - late entry
// - chase detection
// - execution quality scoring
//

import type { PatternDefinition } from "../types/pattern-detection-types";
import {
  PATTERN_FAMILIES,
  THRESHOLDS,
} from "../types/pattern-detection-types";

// =========================
// LOW RANGE ENTRY
// =========================

export const LOW_RANGE_ENTRY: PatternDefinition = {
  id: "low_range_entry",
  name: "Low Range Entry",
  family: PATTERN_FAMILIES.ENTRY_CONTEXT,
  patternType: "atomic",
  structuralLevel: "atomic",

  evaluate: (input) => {
    const value = input.firstEntryPricePositionInTradeRangePct;
    const threshold =
      THRESHOLDS.ENTRY_CONTEXT.LOW_RANGE_ENTRY_MAX_POSITION;

    const matched = value !== null && value <= threshold;

    return {
      matched,
      evidence: {
        firstEntryPricePositionInTradeRangePct: value,
      },
      thresholdsUsed: {
        maxRangePosition: threshold,
      },
    };
  },
};

// =========================
// HIGH RANGE ENTRY
// =========================

export const HIGH_RANGE_ENTRY: PatternDefinition = {
  id: "high_range_entry",
  name: "High Range Entry",
  family: PATTERN_FAMILIES.ENTRY_CONTEXT,
  patternType: "atomic",
  structuralLevel: "atomic",

  evaluate: (input) => {
    const value = input.firstEntryPricePositionInTradeRangePct;
    const threshold =
      THRESHOLDS.ENTRY_CONTEXT.HIGH_RANGE_ENTRY_MIN_POSITION;

    const matched = value !== null && value >= threshold;

    return {
      matched,
      evidence: {
        firstEntryPricePositionInTradeRangePct: value,
      },
      thresholdsUsed: {
        minRangePosition: threshold,
      },
    };
  },
};

// =========================
// ENTRY NEAR TRADE LOW
// =========================

export const ENTRY_NEAR_TRADE_LOW: PatternDefinition = {
  id: "entry_near_trade_low",
  name: "Entry Near Trade Low",
  family: PATTERN_FAMILIES.ENTRY_CONTEXT,
  patternType: "atomic",
  structuralLevel: "atomic",

  evaluate: (input) => {
    return {
      matched: input.firstEntryWasNearTradeLow,
      evidence: {
        firstEntryWasNearTradeLow: input.firstEntryWasNearTradeLow,
      },
      thresholdsUsed: {
        nearLowThreshold:
          THRESHOLDS.ENTRY_CONTEXT.NEAR_LOW_MAX_POSITION,
      },
    };
  },
};

// =========================
// ENTRY NEAR TRADE HIGH
// =========================

export const ENTRY_NEAR_TRADE_HIGH: PatternDefinition = {
  id: "entry_near_trade_high",
  name: "Entry Near Trade High",
  family: PATTERN_FAMILIES.ENTRY_CONTEXT,
  patternType: "atomic",
  structuralLevel: "atomic",

  evaluate: (input) => {
    return {
      matched: input.firstEntryWasNearTradeHigh,
      evidence: {
        firstEntryWasNearTradeHigh: input.firstEntryWasNearTradeHigh,
      },
      thresholdsUsed: {
        nearHighThreshold:
          THRESHOLDS.ENTRY_CONTEXT.NEAR_HIGH_MIN_POSITION,
      },
    };
  },
};

// =========================
// FAVORABLE REMAINING UPSIDE
// =========================

export const ENTRY_WITH_FAVORABLE_REMAINING_UPSIDE: PatternDefinition = {
  id: "entry_with_favorable_remaining_upside",
  name: "Entry With Favorable Remaining Upside",
  family: PATTERN_FAMILIES.ENTRY_CONTEXT,
  patternType: "atomic",
  structuralLevel: "atomic",

  evaluate: (input) => {
    const value = input.firstEntryCapturedPercentOfTradeMfe;
    const threshold =
      THRESHOLDS.ENTRY_CONTEXT.FAVORABLE_REMAINING_UPSIDE_MIN_CAPTURED_MFE;

    const matched = value !== null && value >= threshold;

    return {
      matched,
      evidence: {
        firstEntryCapturedPercentOfTradeMfe: value,
      },
      thresholdsUsed: {
        minCapturedMfePercent: threshold,
      },
    };
  },
};

// =========================
// LIMITED REMAINING UPSIDE
// =========================

export const ENTRY_WITH_LIMITED_REMAINING_UPSIDE: PatternDefinition = {
  id: "entry_with_limited_remaining_upside",
  name: "Entry With Limited Remaining Upside",
  family: PATTERN_FAMILIES.ENTRY_CONTEXT,
  patternType: "atomic",
  structuralLevel: "atomic",

  evaluate: (input) => {
    const value = input.firstEntryCapturedPercentOfTradeMfe;
    const threshold =
      THRESHOLDS.ENTRY_CONTEXT.LIMITED_REMAINING_UPSIDE_MAX_CAPTURED_MFE;

    const matched = value !== null && value <= threshold;

    return {
      matched,
      evidence: {
        firstEntryCapturedPercentOfTradeMfe: value,
      },
      thresholdsUsed: {
        maxCapturedMfePercent: threshold,
      },
    };
  },
};

// =========================
// ENTRY AFTER RECENT RUN-UP
// =========================

export const ENTRY_AFTER_RECENT_RUN_UP: PatternDefinition = {
  id: "entry_after_recent_run_up",
  name: "Entry After Recent Run-Up",
  family: PATTERN_FAMILIES.ENTRY_CONTEXT,
  patternType: "atomic",
  structuralLevel: "atomic",

  evaluate: (input) => {
    const runUp = input.firstEntryRecentRunUpPctBeforeEntry;
    const bullishCount = input.firstEntryBullishCandlesBeforeEntryCount;
    const bearishCount = input.firstEntryBearishCandlesBeforeEntryCount;

    const minRunUp = THRESHOLDS.ENTRY_CONTEXT.RECENT_RUN_UP_MIN_PCT;
    const directionalCandleEdge =
      THRESHOLDS.ENTRY_CONTEXT.RECENT_DIRECTIONAL_CANDLE_EDGE;

    const matched =
      runUp !== null &&
      runUp >= minRunUp &&
      bullishCount >= bearishCount + directionalCandleEdge;

    return {
      matched,
      evidence: {
        firstEntryRecentRunUpPctBeforeEntry: runUp,
        firstEntryBullishCandlesBeforeEntryCount: bullishCount,
        firstEntryBearishCandlesBeforeEntryCount: bearishCount,
      },
      thresholdsUsed: {
        minRunUp,
        directionalCandleEdge,
      },
    };
  },
};

// =========================
// ENTRY AFTER RECENT DROP
// =========================

export const ENTRY_AFTER_RECENT_DROP: PatternDefinition = {
  id: "entry_after_recent_drop",
  name: "Entry After Recent Drop",
  family: PATTERN_FAMILIES.ENTRY_CONTEXT,
  patternType: "atomic",
  structuralLevel: "atomic",

  evaluate: (input) => {
    const drop = input.firstEntryRecentDropPctBeforeEntry;
    const bullishCount = input.firstEntryBullishCandlesBeforeEntryCount;
    const bearishCount = input.firstEntryBearishCandlesBeforeEntryCount;

    const minDrop = THRESHOLDS.ENTRY_CONTEXT.RECENT_DROP_MIN_PCT;
    const directionalCandleEdge =
      THRESHOLDS.ENTRY_CONTEXT.RECENT_DIRECTIONAL_CANDLE_EDGE;

    const matched =
      drop !== null &&
      drop >= minDrop &&
      bearishCount >= bullishCount + directionalCandleEdge;

    return {
      matched,
      evidence: {
        firstEntryRecentDropPctBeforeEntry: drop,
        firstEntryBullishCandlesBeforeEntryCount: bullishCount,
        firstEntryBearishCandlesBeforeEntryCount: bearishCount,
      },
      thresholdsUsed: {
        minDrop,
        directionalCandleEdge,
      },
    };
  },
};

// =========================
// EXPORT
// =========================

export const ENTRY_CONTEXT_PATTERNS: PatternDefinition[] = [
  LOW_RANGE_ENTRY,
  HIGH_RANGE_ENTRY,
  ENTRY_NEAR_TRADE_LOW,
  ENTRY_NEAR_TRADE_HIGH,
  ENTRY_WITH_FAVORABLE_REMAINING_UPSIDE,
  ENTRY_WITH_LIMITED_REMAINING_UPSIDE,
  ENTRY_AFTER_RECENT_RUN_UP,
  ENTRY_AFTER_RECENT_DROP,
];
