// =========================
// 2026-04-12 06:28 PM America/Toronto
// EXIT QUALITY PATTERNS
// =========================
//
// PURPOSE:
// Detects higher-order final-exit quality structure from PatternInput.
//
// IMPORTANT:
// These are composite patterns.
// They combine realized capture, remaining favorable excursion left on the
// table, and final exit location within the eventual trade range.
//
// THESE PATTERNS DO NOT:
// - assign scores
// - generate coaching
// - claim specific intratrade management events like partialing into strength
//
// FUTURE EXPANSION MAY INCLUDE:
// - richer reduction-aware exit quality patterns
// - explicit profit-protection families
// - dependency metadata linking atomic exit facts to composite exit patterns
//

import type { PatternDefinition } from "../types/pattern-detection-types";
import {
  PATTERN_FAMILIES,
  THRESHOLDS,
} from "../types/pattern-detection-types";

// =========================
// HIGH CAPTURE EXIT STRUCTURE
// =========================
//
// Structural meaning:
// - realized a large share of the available favorable excursion
// - final exit was not far from the favorable side of the trade range
//
export const HIGH_CAPTURE_EXIT_STRUCTURE: PatternDefinition = {
  id: "high_capture_exit_structure",
  name: "High Capture Exit Structure",
  family: PATTERN_FAMILIES.EXIT_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const realizedCapture = input.realizedCapturePercentOfTradeMfe;
    const exitRangePosition = input.exitPricePositionInTradeRangePct;

    const minRealizedCapture =
      THRESHOLDS.EXIT_QUALITY.HIGH_CAPTURE_MIN_REALIZED_CAPTURE;
    const minExitRangePosition =
      THRESHOLDS.EXIT_QUALITY.HIGH_CAPTURE_MIN_EXIT_RANGE_POSITION;

    const matched =
      realizedCapture !== null &&
      exitRangePosition !== null &&
      realizedCapture >= minRealizedCapture &&
      exitRangePosition >= minExitRangePosition;

    return {
      matched,
      evidence: {
        realizedCapturePercentOfTradeMfe: realizedCapture,
        exitPricePositionInTradeRangePct: exitRangePosition,
      },
      thresholdsUsed: {
        minRealizedCapture,
        minExitRangePosition,
      },
    };
  },
};

// =========================
// MODERATE CAPTURE EXIT STRUCTURE
// =========================
//
// Structural meaning:
// - realized a meaningful but not elite share of the available move
//
export const MODERATE_CAPTURE_EXIT_STRUCTURE: PatternDefinition = {
  id: "moderate_capture_exit_structure",
  name: "Moderate Capture Exit Structure",
  family: PATTERN_FAMILIES.EXIT_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const realizedCapture = input.realizedCapturePercentOfTradeMfe;

    const minRealizedCapture =
      THRESHOLDS.EXIT_QUALITY.MODERATE_CAPTURE_MIN_REALIZED_CAPTURE;
    const maxRealizedCapture =
      THRESHOLDS.EXIT_QUALITY.MODERATE_CAPTURE_MAX_REALIZED_CAPTURE;

    const matched =
      realizedCapture !== null &&
      realizedCapture >= minRealizedCapture &&
      realizedCapture < maxRealizedCapture;

    return {
      matched,
      evidence: {
        realizedCapturePercentOfTradeMfe: realizedCapture,
      },
      thresholdsUsed: {
        minRealizedCapture,
        maxRealizedCapture,
      },
    };
  },
};

// =========================
// LOW CAPTURE EXIT STRUCTURE
// =========================
//
// Structural meaning:
// - realized only a limited share of the available move
//
export const LOW_CAPTURE_EXIT_STRUCTURE: PatternDefinition = {
  id: "low_capture_exit_structure",
  name: "Low Capture Exit Structure",
  family: PATTERN_FAMILIES.EXIT_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const realizedCapture = input.realizedCapturePercentOfTradeMfe;

    const maxRealizedCapture =
      THRESHOLDS.EXIT_QUALITY.LOW_CAPTURE_MAX_REALIZED_CAPTURE;

    const matched =
      realizedCapture !== null &&
      realizedCapture <= maxRealizedCapture;

    return {
      matched,
      evidence: {
        realizedCapturePercentOfTradeMfe: realizedCapture,
      },
      thresholdsUsed: {
        maxRealizedCapture,
      },
    };
  },
};

// =========================
// EXIT WITH LIMITED GIVEBACK
// =========================
//
// Structural meaning:
// - only a limited amount of favorable excursion was left unrealized
//
export const EXIT_WITH_LIMITED_GIVEBACK: PatternDefinition = {
  id: "exit_with_limited_giveback",
  name: "Exit With Limited Giveback",
  family: PATTERN_FAMILIES.EXIT_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const leftOnTable = input.favorableExcursionLeftOnTablePct;

    const maxLeftOnTable =
      THRESHOLDS.EXIT_QUALITY.LIMITED_GIVEBACK_MAX_LEFT_ON_TABLE;

    const matched =
      leftOnTable !== null &&
      leftOnTable <= maxLeftOnTable;

    return {
      matched,
      evidence: {
        favorableExcursionLeftOnTablePct: leftOnTable,
      },
      thresholdsUsed: {
        maxLeftOnTable,
      },
    };
  },
};

// =========================
// EXIT WITH MEANINGFUL GIVEBACK
// =========================
//
// Structural meaning:
// - a meaningful amount of favorable excursion was not converted into realized result
//
export const EXIT_WITH_MEANINGFUL_GIVEBACK: PatternDefinition = {
  id: "exit_with_meaningful_giveback",
  name: "Exit With Meaningful Giveback",
  family: PATTERN_FAMILIES.EXIT_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const leftOnTable = input.favorableExcursionLeftOnTablePct;

    const minLeftOnTable =
      THRESHOLDS.EXIT_QUALITY.MEANINGFUL_GIVEBACK_MIN_LEFT_ON_TABLE;

    const matched =
      leftOnTable !== null &&
      leftOnTable >= minLeftOnTable;

    return {
      matched,
      evidence: {
        favorableExcursionLeftOnTablePct: leftOnTable,
      },
      thresholdsUsed: {
        minLeftOnTable,
      },
    };
  },
};

// =========================
// EXIT NEAR FAVORABLE EXTREME
// =========================
//
// Structural meaning:
// - final exit occurred close to the favorable side of the trade range
//
export const EXIT_NEAR_FAVORABLE_EXTREME: PatternDefinition = {
  id: "exit_near_favorable_extreme",
  name: "Exit Near Favorable Extreme",
  family: PATTERN_FAMILIES.EXIT_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const exitWasNearTradeHigh = input.exitWasNearTradeHigh;

    return {
      matched: exitWasNearTradeHigh,
      evidence: {
        exitWasNearTradeHigh,
      },
      thresholdsUsed: {
        nearFavorableExtremeThreshold:
          THRESHOLDS.EXIT_QUALITY.NEAR_FAVORABLE_EXTREME_MIN_RANGE_POSITION,
      },
    };
  },
};

// =========================
// PEAK PROFIT GIVEBACK STRUCTURE
// =========================

export const PEAK_PROFIT_GIVEBACK_STRUCTURE: PatternDefinition = {
  id: "peak_profit_giveback_structure",
  name: "Peak Profit Giveback Structure",
  family: PATTERN_FAMILIES.EXIT_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const givebackPct = input.maxGivebackFromPeakOpenProfitPct;
    const peakOpenProfitPctOfBasis = input.peakOpenProfitPctOfBasis;

    const minGivebackPct =
      THRESHOLDS.EXIT_QUALITY.PEAK_PROFIT_GIVEBACK_MIN_PCT;
    const minOpenProfitPctOfBasis =
      THRESHOLDS.EXIT_QUALITY.PEAK_PROFIT_GIVEBACK_MIN_OPEN_PROFIT_PCT_OF_BASIS;

    const matched =
      givebackPct !== null &&
      peakOpenProfitPctOfBasis !== null &&
      givebackPct >= minGivebackPct &&
      peakOpenProfitPctOfBasis >= minOpenProfitPctOfBasis;

    return {
      matched,
      evidence: {
        maxGivebackFromPeakOpenProfitPct: givebackPct,
        peakOpenProfitPctOfBasis,
      },
      thresholdsUsed: {
        minGivebackPct,
        minOpenProfitPctOfBasis,
      },
    };
  },
};

// =========================
// PARTIAL EXIT WITH ADVERSE FOLLOWTHROUGH
// =========================

export const PARTIAL_EXIT_WITH_ADVERSE_FOLLOWTHROUGH: PatternDefinition = {
  id: "partial_exit_with_adverse_followthrough",
  name: "Partial Exit With Adverse Followthrough",
  family: PATTERN_FAMILIES.EXIT_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const hadPartialExit = input.hadPartialExit;
    const adversePct = input.maxAdverseMoveAfterPartialExitPct;

    const minAdversePct =
      THRESHOLDS.EXIT_QUALITY.PARTIAL_EXIT_ADVERSE_FOLLOWTHROUGH_MIN_PCT;

    const matched =
      hadPartialExit &&
      adversePct !== null &&
      adversePct >= minAdversePct;

    return {
      matched,
      evidence: {
        hadPartialExit,
        maxAdverseMoveAfterPartialExitPct: adversePct,
      },
      thresholdsUsed: {
        minAdversePct,
      },
    };
  },
};

// =========================
// MISSED POST-EXIT CONTINUATION
// =========================

export const MISSED_POST_EXIT_CONTINUATION: PatternDefinition = {
  id: "missed_post_exit_continuation",
  name: "Missed Post-Exit Continuation",
  family: PATTERN_FAMILIES.EXIT_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const postExitCandleCount = input.postExitCandleCount;
    const favorablePct = input.maxFavorableMovePctAfterExit;
    const adversePct = input.maxAdverseMovePctAfterExit;
    const netEndPct = input.netMovePctAtEndOfPostExitWindow;

    const minFavorablePct =
      THRESHOLDS.EXIT_QUALITY.MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
    const minNetEndPct =
      THRESHOLDS.EXIT_QUALITY.MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

    const matched =
      input.closedToFlat &&
      postExitCandleCount > 0 &&
      favorablePct !== null &&
      favorablePct >= minFavorablePct &&
      netEndPct !== null &&
      netEndPct >= minNetEndPct &&
      favorablePct >
        (adversePct ?? Number.NEGATIVE_INFINITY);

    return {
      matched,
      evidence: {
        closedToFlat: input.closedToFlat,
        postExitCandleCount,
        maxFavorableMovePctAfterExit: favorablePct,
        maxAdverseMovePctAfterExit: adversePct,
        netMovePctAtEndOfPostExitWindow: netEndPct,
      },
      thresholdsUsed: {
        minFavorablePct,
        minNetEndPct,
      },
    };
  },
};

// =========================
// EXIT AVOIDED ADVERSE FOLLOWTHROUGH
// =========================

export const EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH: PatternDefinition = {
  id: "exit_avoided_adverse_followthrough",
  name: "Exit Avoided Adverse Followthrough",
  family: PATTERN_FAMILIES.EXIT_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const postExitCandleCount = input.postExitCandleCount;
    const favorablePct = input.maxFavorableMovePctAfterExit;
    const adversePct = input.maxAdverseMovePctAfterExit;
    const netEndPct = input.netMovePctAtEndOfPostExitWindow;

    const minAdversePct =
      THRESHOLDS.EXIT_QUALITY
        .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
    const maxNetEndPct =
      THRESHOLDS.EXIT_QUALITY
        .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

    const matched =
      input.closedToFlat &&
      postExitCandleCount > 0 &&
      adversePct !== null &&
      adversePct >= minAdversePct &&
      netEndPct !== null &&
      netEndPct <= maxNetEndPct &&
      adversePct >
        (favorablePct ?? Number.NEGATIVE_INFINITY);

    return {
      matched,
      evidence: {
        closedToFlat: input.closedToFlat,
        postExitCandleCount,
        maxFavorableMovePctAfterExit: favorablePct,
        maxAdverseMovePctAfterExit: adversePct,
        netMovePctAtEndOfPostExitWindow: netEndPct,
      },
      thresholdsUsed: {
        minAdversePct,
        maxNetEndPct,
      },
    };
  },
};

// =========================
// DEFENSIVE EXIT AFTER DETERIORATION
// =========================

export const DEFENSIVE_EXIT_AFTER_DETERIORATION: PatternDefinition = {
  id: "defensive_exit_after_deterioration",
  name: "Defensive Exit After Deterioration",
  family: PATTERN_FAMILIES.EXIT_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const postExitCandleCount = input.postExitCandleCount;
    const favorablePct = input.maxFavorableMovePctAfterExit;
    const adversePct = input.maxAdverseMovePctAfterExit;
    const netEndPct = input.netMovePctAtEndOfPostExitWindow;
    const givebackPct = input.maxGivebackFromPeakOpenProfitPct;

    const minAdversePct =
      THRESHOLDS.EXIT_QUALITY
        .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
    const maxNetEndPct =
      THRESHOLDS.EXIT_QUALITY
        .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;
    const minGivebackPct =
      THRESHOLDS.EXIT_QUALITY
        .DEFENSIVE_EXIT_AFTER_DETERIORATION_MIN_GIVEBACK_PCT;

    const matched =
      input.closedToFlat &&
      postExitCandleCount > 0 &&
      adversePct !== null &&
      adversePct >= minAdversePct &&
      netEndPct !== null &&
      netEndPct <= maxNetEndPct &&
      adversePct >
        (favorablePct ?? Number.NEGATIVE_INFINITY) &&
      givebackPct !== null &&
      givebackPct >= minGivebackPct;

    return {
      matched,
      evidence: {
        closedToFlat: input.closedToFlat,
        postExitCandleCount,
        maxAdverseMovePctAfterExit: adversePct,
        maxFavorableMovePctAfterExit: favorablePct,
        netMovePctAtEndOfPostExitWindow: netEndPct,
        maxGivebackFromPeakOpenProfitPct: givebackPct,
      },
      thresholdsUsed: {
        minAdversePct,
        maxNetEndPct,
        minGivebackPct,
      },
    };
  },
};

// =========================
// PREMATURE FINAL EXIT AFTER CONSTRUCTIVE MANAGEMENT
// =========================

export const PREMATURE_FINAL_EXIT_AFTER_CONSTRUCTIVE_MANAGEMENT: PatternDefinition =
  {
    id: "premature_final_exit_after_constructive_management",
    name: "Premature Final Exit After Constructive Management",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const postExitCandleCount = input.postExitCandleCount;
      const favorablePct = input.maxFavorableMovePctAfterExit;
      const adversePct = input.maxAdverseMovePctAfterExit;
      const netEndPct = input.netMovePctAtEndOfPostExitWindow;
      const givebackPct = input.maxGivebackFromPeakOpenProfitPct;

      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;
      const maxGivebackPct =
        THRESHOLDS.EXIT_QUALITY.PREMATURE_FINAL_EXIT_MAX_GIVEBACK_PCT;

      const matched =
        input.closedToFlat &&
        postExitCandleCount > 0 &&
        input.totalPositionDecreaseCount > 0 &&
        favorablePct !== null &&
        favorablePct >= minFavorablePct &&
        netEndPct !== null &&
        netEndPct >= minNetEndPct &&
        favorablePct >
          (adversePct ?? Number.NEGATIVE_INFINITY) &&
        givebackPct !== null &&
        givebackPct <= maxGivebackPct;

      return {
        matched,
        evidence: {
          closedToFlat: input.closedToFlat,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          postExitCandleCount,
          maxFavorableMovePctAfterExit: favorablePct,
          maxAdverseMovePctAfterExit: adversePct,
          netMovePctAtEndOfPostExitWindow: netEndPct,
          maxGivebackFromPeakOpenProfitPct: givebackPct,
        },
        thresholdsUsed: {
          minFavorablePct,
          minNetEndPct,
          maxGivebackPct,
        },
      };
    },
  };

// =========================
// FEARFUL EXIT AFTER WEAKENING
// =========================

export const FEARFUL_EXIT_AFTER_WEAKENING: PatternDefinition = {
  id: "fearful_exit_after_weakening",
  name: "Fearful Exit After Weakening",
  family: PATTERN_FAMILIES.EXIT_QUALITY,
  patternType: "composite",
  structuralLevel: "storyline_composite",

  evaluate: (input) => {
    const postExitCandleCount = input.postExitCandleCount;
    const favorablePct = input.maxFavorableMovePctAfterExit;
    const adversePct = input.maxAdverseMovePctAfterExit;
    const netEndPct = input.netMovePctAtEndOfPostExitWindow;
    const realizedCapture = input.realizedCapturePercentOfTradeMfe;

    const minFavorablePct =
      THRESHOLDS.EXIT_QUALITY.MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
    const minNetEndPct =
      THRESHOLDS.EXIT_QUALITY.MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;
    const maxRealizedCapture =
      THRESHOLDS.EXIT_QUALITY.FEARFUL_EXIT_AFTER_WEAKENING_MAX_REALIZED_CAPTURE;

    const matched =
      input.closedToFlat &&
      postExitCandleCount > 0 &&
      input.exitWasNearTradeLow &&
      realizedCapture !== null &&
      realizedCapture <= maxRealizedCapture &&
      favorablePct !== null &&
      favorablePct >= minFavorablePct &&
      netEndPct !== null &&
      netEndPct >= minNetEndPct &&
      favorablePct >
        (adversePct ?? Number.NEGATIVE_INFINITY);

    return {
      matched,
      evidence: {
        closedToFlat: input.closedToFlat,
        exitWasNearTradeLow: input.exitWasNearTradeLow,
        realizedCapturePercentOfTradeMfe: realizedCapture,
        postExitCandleCount,
        maxFavorableMovePctAfterExit: favorablePct,
        maxAdverseMovePctAfterExit: adversePct,
        netMovePctAtEndOfPostExitWindow: netEndPct,
      },
      thresholdsUsed: {
        minFavorablePct,
        minNetEndPct,
        maxRealizedCapture,
      },
    };
  },
};

export const EXIT_INTO_SUPPORT_STRUCTURE: PatternDefinition = {
  id: "exit_into_support_structure",
  name: "Exit Into Support Structure",
  family: PATTERN_FAMILIES.EXIT_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const matched =
      input.hadSupportResistanceContextAvailable &&
      input.finalExitOccurredNearSupport;

    return {
      matched,
      evidence: {
        hadSupportResistanceContextAvailable:
          input.hadSupportResistanceContextAvailable,
        finalExitOccurredNearSupport: input.finalExitOccurredNearSupport,
        finalExitDistanceToNearestSupportPct:
          input.finalExitDistanceToNearestSupportPct,
      },
      thresholdsUsed: {},
    };
  },
};

export const EXIT_INTO_SUPPORT_WITH_RELIEF_AFTER_EXIT: PatternDefinition = {
  id: "exit_into_support_with_relief_after_exit",
  name: "Exit Into Support With Relief After Exit",
  family: PATTERN_FAMILIES.EXIT_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const matched =
      input.hadSupportResistanceContextAvailable &&
      input.finalExitOccurredNearSupport &&
      input.maxFavorableMovePctAfterExit !== null &&
      input.maxFavorableMovePctAfterExit >= 0.02 &&
      input.netMovePctAtEndOfPostExitWindow !== null &&
      input.netMovePctAtEndOfPostExitWindow >= 0;

    return {
      matched,
      evidence: {
        hadSupportResistanceContextAvailable:
          input.hadSupportResistanceContextAvailable,
        finalExitOccurredNearSupport: input.finalExitOccurredNearSupport,
        finalExitDistanceToNearestSupportPct:
          input.finalExitDistanceToNearestSupportPct,
        maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
        netMovePctAtEndOfPostExitWindow:
          input.netMovePctAtEndOfPostExitWindow,
      },
      thresholdsUsed: {
        minMaxFavorableMovePctAfterExit: 0.02,
        minNetMovePctAtEndOfPostExitWindow: 0,
      },
    };
  },
};

export const EXIT_INTO_SUPPORT_BEFORE_BREAKDOWN: PatternDefinition = {
  id: "exit_into_support_before_breakdown",
  name: "Exit Into Support Before Breakdown",
  family: PATTERN_FAMILIES.EXIT_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const matched =
      input.hadSupportResistanceContextAvailable &&
      input.finalExitOccurredNearSupport &&
      input.maxAdverseMovePctAfterExit !== null &&
      input.maxAdverseMovePctAfterExit >= 0.02 &&
      input.netMovePctAtEndOfPostExitWindow !== null &&
      input.netMovePctAtEndOfPostExitWindow < 0;

    return {
      matched,
      evidence: {
        hadSupportResistanceContextAvailable:
          input.hadSupportResistanceContextAvailable,
        finalExitOccurredNearSupport: input.finalExitOccurredNearSupport,
        finalExitDistanceToNearestSupportPct:
          input.finalExitDistanceToNearestSupportPct,
        finalExitSupportLevelsBelowWithinClusterCount:
          input.finalExitSupportLevelsBelowWithinClusterCount,
        finalExitHasStackedSupportBelow:
          input.finalExitHasStackedSupportBelow,
        maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
        netMovePctAtEndOfPostExitWindow:
          input.netMovePctAtEndOfPostExitWindow,
      },
      thresholdsUsed: {
        minMaxAdverseMovePctAfterExit: 0.02,
        maxNetMovePctAtEndOfPostExitWindow: 0,
      },
    };
  },
};

export const EXIT_INTO_STACKED_SUPPORT_WITH_RELIEF_AFTER_EXIT: PatternDefinition =
  {
    id: "exit_into_stacked_support_with_relief_after_exit",
    name: "Exit Into Stacked Support With Relief After Exit",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    structuralLevel: "structural_composite",

    evaluate: (input) => {
      const matched =
        input.hadSupportResistanceContextAvailable &&
        input.finalExitOccurredNearSupport &&
        input.finalExitHasStackedSupportBelow &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= 0.02 &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= 0;

      return {
        matched,
        evidence: {
          hadSupportResistanceContextAvailable:
            input.hadSupportResistanceContextAvailable,
          finalExitOccurredNearSupport: input.finalExitOccurredNearSupport,
          finalExitDistanceToNearestSupportPct:
            input.finalExitDistanceToNearestSupportPct,
          finalExitSupportLevelsBelowWithinClusterCount:
            input.finalExitSupportLevelsBelowWithinClusterCount,
          finalExitHasStackedSupportBelow:
            input.finalExitHasStackedSupportBelow,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minMaxFavorableMovePctAfterExit: 0.02,
          minNetMovePctAtEndOfPostExitWindow: 0,
        },
      };
    },
  };

export const EXIT_INTO_THIN_SUPPORT_BEFORE_BREAKDOWN: PatternDefinition = {
  id: "exit_into_thin_support_before_breakdown",
  name: "Exit Into Thin Support Before Breakdown",
  family: PATTERN_FAMILIES.EXIT_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const matched =
      input.hadSupportResistanceContextAvailable &&
      input.finalExitOccurredNearSupport &&
      !input.finalExitHasStackedSupportBelow &&
      input.maxAdverseMovePctAfterExit !== null &&
      input.maxAdverseMovePctAfterExit >= 0.02 &&
      input.netMovePctAtEndOfPostExitWindow !== null &&
      input.netMovePctAtEndOfPostExitWindow < 0;

    return {
      matched,
      evidence: {
        hadSupportResistanceContextAvailable:
          input.hadSupportResistanceContextAvailable,
        finalExitOccurredNearSupport: input.finalExitOccurredNearSupport,
        finalExitDistanceToNearestSupportPct:
          input.finalExitDistanceToNearestSupportPct,
        finalExitSupportLevelsBelowWithinClusterCount:
          input.finalExitSupportLevelsBelowWithinClusterCount,
        finalExitHasStackedSupportBelow:
          input.finalExitHasStackedSupportBelow,
        maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
        netMovePctAtEndOfPostExitWindow:
          input.netMovePctAtEndOfPostExitWindow,
      },
      thresholdsUsed: {
        minMaxAdverseMovePctAfterExit: 0.02,
        maxNetMovePctAtEndOfPostExitWindow: 0,
      },
    };
  },
};

export const STABILIZED_RECOVERY_WITH_EXIT_INTO_STACKED_SUPPORT_AND_RELIEF: PatternDefinition =
  {
    id: "stabilized_recovery_with_exit_into_stacked_support_and_relief",
    name: "Stabilized Recovery With Exit Into Stacked Support And Relief",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const postExitCandleCount = input.postExitCandleCount;
      const favorablePct = input.maxFavorableMovePctAfterExit;
      const adversePct = input.maxAdverseMovePctAfterExit;
      const netEndPct = input.netMovePctAtEndOfPostExitWindow;
      const givebackPct = input.maxGivebackFromPeakOpenProfitPct;

      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY.CONSTRUCTIVE_RECOVERY_MAX_GIVEBACK_PCT;
      const maxSecondsToFirstReduction =
        THRESHOLDS.POSITION_REDUCTION
          .TIMELY_RISK_RESPONSE_MAX_SECONDS_TO_FIRST_REDUCTION;
      const minFavorablePct = 0.02;
      const minNetEndPct = 0;

      const matched =
        input.closedToFlat &&
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
        input.secondsFromPeakOpenProfitToFirstReduction !== null &&
        input.secondsFromPeakOpenProfitToFirstReduction <=
          maxSecondsToFirstReduction &&
        givebackPct !== null &&
        givebackPct <= maxGivebackPct &&
        input.hadSupportResistanceContextAvailable &&
        input.finalExitOccurredNearSupport &&
        input.finalExitHasStackedSupportBelow &&
        postExitCandleCount > 0 &&
        favorablePct !== null &&
        favorablePct >= minFavorablePct &&
        netEndPct !== null &&
        netEndPct >= minNetEndPct &&
        favorablePct > (adversePct ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          closedToFlat: input.closedToFlat,
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          hadReductionAfterPeakOpenProfitBeforeWorstDrawdown:
            input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown,
          secondsFromPeakOpenProfitToFirstReduction:
            input.secondsFromPeakOpenProfitToFirstReduction,
          maxGivebackFromPeakOpenProfitPct: givebackPct,
          hadSupportResistanceContextAvailable:
            input.hadSupportResistanceContextAvailable,
          finalExitOccurredNearSupport: input.finalExitOccurredNearSupport,
          finalExitSupportLevelsBelowWithinClusterCount:
            input.finalExitSupportLevelsBelowWithinClusterCount,
          finalExitHasStackedSupportBelow:
            input.finalExitHasStackedSupportBelow,
          postExitCandleCount,
          maxFavorableMovePctAfterExit: favorablePct,
          maxAdverseMovePctAfterExit: adversePct,
          netMovePctAtEndOfPostExitWindow: netEndPct,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          maxGivebackPct,
          maxSecondsToFirstReduction,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const STABILIZED_RECOVERY_WITH_EXIT_INTO_THIN_SUPPORT_BEFORE_BREAKDOWN: PatternDefinition =
  {
    id: "stabilized_recovery_with_exit_into_thin_support_before_breakdown",
    name: "Stabilized Recovery With Exit Into Thin Support Before Breakdown",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const postExitCandleCount = input.postExitCandleCount;
      const favorablePct = input.maxFavorableMovePctAfterExit;
      const adversePct = input.maxAdverseMovePctAfterExit;
      const netEndPct = input.netMovePctAtEndOfPostExitWindow;
      const givebackPct = input.maxGivebackFromPeakOpenProfitPct;

      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY.CONSTRUCTIVE_RECOVERY_MAX_GIVEBACK_PCT;
      const maxSecondsToFirstReduction =
        THRESHOLDS.POSITION_REDUCTION
          .TIMELY_RISK_RESPONSE_MAX_SECONDS_TO_FIRST_REDUCTION;
      const minAdversePct = 0.02;
      const maxNetEndPct = 0;

      const matched =
        input.closedToFlat &&
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
        input.secondsFromPeakOpenProfitToFirstReduction !== null &&
        input.secondsFromPeakOpenProfitToFirstReduction <=
          maxSecondsToFirstReduction &&
        givebackPct !== null &&
        givebackPct <= maxGivebackPct &&
        input.hadSupportResistanceContextAvailable &&
        input.finalExitOccurredNearSupport &&
        !input.finalExitHasStackedSupportBelow &&
        postExitCandleCount > 0 &&
        adversePct !== null &&
        adversePct >= minAdversePct &&
        netEndPct !== null &&
        netEndPct < maxNetEndPct &&
        adversePct > (favorablePct ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          closedToFlat: input.closedToFlat,
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          hadReductionAfterPeakOpenProfitBeforeWorstDrawdown:
            input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown,
          secondsFromPeakOpenProfitToFirstReduction:
            input.secondsFromPeakOpenProfitToFirstReduction,
          maxGivebackFromPeakOpenProfitPct: givebackPct,
          hadSupportResistanceContextAvailable:
            input.hadSupportResistanceContextAvailable,
          finalExitOccurredNearSupport: input.finalExitOccurredNearSupport,
          finalExitSupportLevelsBelowWithinClusterCount:
            input.finalExitSupportLevelsBelowWithinClusterCount,
          finalExitHasStackedSupportBelow:
            input.finalExitHasStackedSupportBelow,
          postExitCandleCount,
          maxFavorableMovePctAfterExit: favorablePct,
          maxAdverseMovePctAfterExit: adversePct,
          netMovePctAtEndOfPostExitWindow: netEndPct,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          maxGivebackPct,
          maxSecondsToFirstReduction,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const EXIT_INTO_RESISTANCE_WITH_REVERSAL_AFTER_EXIT: PatternDefinition =
  {
    id: "exit_into_resistance_with_reversal_after_exit",
    name: "Exit Into Resistance With Reversal After Exit",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    structuralLevel: "structural_composite",

    evaluate: (input) => {
      const matched =
        input.hadSupportResistanceContextAvailable &&
        input.finalExitOccurredNearResistance &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= 0.02 &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= 0 &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadSupportResistanceContextAvailable:
            input.hadSupportResistanceContextAvailable,
          finalExitOccurredNearResistance:
            input.finalExitOccurredNearResistance,
          finalExitDistanceToNearestResistancePct:
            input.finalExitDistanceToNearestResistancePct,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minMaxAdverseMovePctAfterExit: 0.02,
          maxNetMovePctAtEndOfPostExitWindow: 0,
        },
      };
    },
  };

export const EXIT_INTO_RESISTANCE_BEFORE_BREAKOUT: PatternDefinition = {
  id: "exit_into_resistance_before_breakout",
  name: "Exit Into Resistance Before Breakout",
  family: PATTERN_FAMILIES.EXIT_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const matched =
      input.hadSupportResistanceContextAvailable &&
      input.finalExitOccurredNearResistance &&
      input.maxFavorableMovePctAfterExit !== null &&
      input.maxFavorableMovePctAfterExit >= 0.02 &&
      input.netMovePctAtEndOfPostExitWindow !== null &&
      input.netMovePctAtEndOfPostExitWindow >= 0 &&
      input.maxFavorableMovePctAfterExit >
        (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

    return {
      matched,
      evidence: {
        hadSupportResistanceContextAvailable:
          input.hadSupportResistanceContextAvailable,
        finalExitOccurredNearResistance:
          input.finalExitOccurredNearResistance,
        finalExitDistanceToNearestResistancePct:
          input.finalExitDistanceToNearestResistancePct,
        maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
        maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
        netMovePctAtEndOfPostExitWindow:
          input.netMovePctAtEndOfPostExitWindow,
      },
      thresholdsUsed: {
        minMaxFavorableMovePctAfterExit: 0.02,
        minNetMovePctAtEndOfPostExitWindow: 0,
      },
    };
  },
};

export const STABILIZED_RECOVERY_WITH_EXIT_INTO_RESISTANCE_AND_REVERSAL: PatternDefinition =
  {
    id: "stabilized_recovery_with_exit_into_resistance_and_reversal",
    name: "Stabilized Recovery With Exit Into Resistance And Reversal",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const postExitCandleCount = input.postExitCandleCount;
      const favorablePct = input.maxFavorableMovePctAfterExit;
      const adversePct = input.maxAdverseMovePctAfterExit;
      const netEndPct = input.netMovePctAtEndOfPostExitWindow;
      const givebackPct = input.maxGivebackFromPeakOpenProfitPct;

      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY.CONSTRUCTIVE_RECOVERY_MAX_GIVEBACK_PCT;
      const maxSecondsToFirstReduction =
        THRESHOLDS.POSITION_REDUCTION
          .TIMELY_RISK_RESPONSE_MAX_SECONDS_TO_FIRST_REDUCTION;
      const minAdversePct = 0.02;
      const maxNetEndPct = 0;

      const matched =
        input.closedToFlat &&
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
        input.secondsFromPeakOpenProfitToFirstReduction !== null &&
        input.secondsFromPeakOpenProfitToFirstReduction <=
          maxSecondsToFirstReduction &&
        givebackPct !== null &&
        givebackPct <= maxGivebackPct &&
        input.hadSupportResistanceContextAvailable &&
        input.finalExitOccurredNearResistance &&
        postExitCandleCount > 0 &&
        adversePct !== null &&
        adversePct >= minAdversePct &&
        netEndPct !== null &&
        netEndPct <= maxNetEndPct &&
        adversePct > (favorablePct ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          closedToFlat: input.closedToFlat,
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          hadReductionAfterPeakOpenProfitBeforeWorstDrawdown:
            input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown,
          secondsFromPeakOpenProfitToFirstReduction:
            input.secondsFromPeakOpenProfitToFirstReduction,
          maxGivebackFromPeakOpenProfitPct: givebackPct,
          hadSupportResistanceContextAvailable:
            input.hadSupportResistanceContextAvailable,
          finalExitOccurredNearResistance:
            input.finalExitOccurredNearResistance,
          finalExitDistanceToNearestResistancePct:
            input.finalExitDistanceToNearestResistancePct,
          postExitCandleCount,
          maxFavorableMovePctAfterExit: favorablePct,
          maxAdverseMovePctAfterExit: adversePct,
          netMovePctAtEndOfPostExitWindow: netEndPct,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          maxGivebackPct,
          maxSecondsToFirstReduction,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const STABILIZED_RECOVERY_WITH_EXIT_INTO_RESISTANCE_BEFORE_BREAKOUT: PatternDefinition =
  {
    id: "stabilized_recovery_with_exit_into_resistance_before_breakout",
    name: "Stabilized Recovery With Exit Into Resistance Before Breakout",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const postExitCandleCount = input.postExitCandleCount;
      const favorablePct = input.maxFavorableMovePctAfterExit;
      const adversePct = input.maxAdverseMovePctAfterExit;
      const netEndPct = input.netMovePctAtEndOfPostExitWindow;
      const givebackPct = input.maxGivebackFromPeakOpenProfitPct;

      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY.CONSTRUCTIVE_RECOVERY_MAX_GIVEBACK_PCT;
      const maxSecondsToFirstReduction =
        THRESHOLDS.POSITION_REDUCTION
          .TIMELY_RISK_RESPONSE_MAX_SECONDS_TO_FIRST_REDUCTION;
      const minFavorablePct = 0.02;
      const minNetEndPct = 0;

      const matched =
        input.closedToFlat &&
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
        input.secondsFromPeakOpenProfitToFirstReduction !== null &&
        input.secondsFromPeakOpenProfitToFirstReduction <=
          maxSecondsToFirstReduction &&
        givebackPct !== null &&
        givebackPct <= maxGivebackPct &&
        input.hadSupportResistanceContextAvailable &&
        input.finalExitOccurredNearResistance &&
        postExitCandleCount > 0 &&
        favorablePct !== null &&
        favorablePct >= minFavorablePct &&
        netEndPct !== null &&
        netEndPct >= minNetEndPct &&
        favorablePct > (adversePct ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          closedToFlat: input.closedToFlat,
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          hadReductionAfterPeakOpenProfitBeforeWorstDrawdown:
            input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown,
          secondsFromPeakOpenProfitToFirstReduction:
            input.secondsFromPeakOpenProfitToFirstReduction,
          maxGivebackFromPeakOpenProfitPct: givebackPct,
          hadSupportResistanceContextAvailable:
            input.hadSupportResistanceContextAvailable,
          finalExitOccurredNearResistance:
            input.finalExitOccurredNearResistance,
          finalExitDistanceToNearestResistancePct:
            input.finalExitDistanceToNearestResistancePct,
          postExitCandleCount,
          maxFavorableMovePctAfterExit: favorablePct,
          maxAdverseMovePctAfterExit: adversePct,
          netMovePctAtEndOfPostExitWindow: netEndPct,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          maxGivebackPct,
          maxSecondsToFirstReduction,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

// =========================
// DISCIPLINED DEFENSIVE EXIT
// =========================

export const DISCIPLINED_DEFENSIVE_EXIT: PatternDefinition = {
  id: "disciplined_defensive_exit",
  name: "Disciplined Defensive Exit",
  family: PATTERN_FAMILIES.EXIT_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const postExitCandleCount = input.postExitCandleCount;
    const favorablePct = input.maxFavorableMovePctAfterExit;
    const adversePct = input.maxAdverseMovePctAfterExit;
    const netEndPct = input.netMovePctAtEndOfPostExitWindow;
    const givebackPct = input.maxGivebackFromPeakOpenProfitPct;

    const minAdversePct =
      THRESHOLDS.EXIT_QUALITY
        .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
    const maxNetEndPct =
      THRESHOLDS.EXIT_QUALITY
        .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;
    const maxGivebackPct =
      THRESHOLDS.EXIT_QUALITY.DISCIPLINED_DEFENSIVE_EXIT_MAX_GIVEBACK_PCT;

    const matched =
      input.closedToFlat &&
      input.totalPositionDecreaseCount > 0 &&
      postExitCandleCount > 0 &&
      adversePct !== null &&
      adversePct >= minAdversePct &&
      netEndPct !== null &&
      netEndPct <= maxNetEndPct &&
      adversePct >
        (favorablePct ?? Number.NEGATIVE_INFINITY) &&
      givebackPct !== null &&
      givebackPct <= maxGivebackPct;

    return {
      matched,
      evidence: {
        closedToFlat: input.closedToFlat,
        totalPositionDecreaseCount: input.totalPositionDecreaseCount,
        postExitCandleCount,
        maxAdverseMovePctAfterExit: adversePct,
        maxFavorableMovePctAfterExit: favorablePct,
        netMovePctAtEndOfPostExitWindow: netEndPct,
        maxGivebackFromPeakOpenProfitPct: givebackPct,
      },
      thresholdsUsed: {
        minAdversePct,
        maxNetEndPct,
        maxGivebackPct,
      },
    };
  },
};

// =========================
// STOP-LIKE FORCED EXIT AFTER BREAKDOWN
// =========================

export const STOP_LIKE_FORCED_EXIT_AFTER_BREAKDOWN: PatternDefinition = {
  id: "stop_like_forced_exit_after_breakdown",
  name: "Stop-Like Forced Exit After Breakdown",
  family: PATTERN_FAMILIES.EXIT_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const postExitCandleCount = input.postExitCandleCount;
    const favorablePct = input.maxFavorableMovePctAfterExit;
    const adversePct = input.maxAdverseMovePctAfterExit;
    const netEndPct = input.netMovePctAtEndOfPostExitWindow;
    const givebackPct = input.maxGivebackFromPeakOpenProfitPct;
    const realizedCapture = input.realizedCapturePercentOfTradeMfe;
    const drawdownFromPeakPct = input.drawdownFromPeakOpenProfitPctOfBasis;

    const minAdversePct =
      THRESHOLDS.EXIT_QUALITY
        .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
    const maxNetEndPct =
      THRESHOLDS.EXIT_QUALITY
        .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;
    const minGivebackPct =
      THRESHOLDS.EXIT_QUALITY
        .DEFENSIVE_EXIT_AFTER_DETERIORATION_MIN_GIVEBACK_PCT;
    const maxRealizedCapture =
      THRESHOLDS.EXIT_QUALITY.STOP_LIKE_FORCED_EXIT_MAX_REALIZED_CAPTURE;
    const minDrawdownFromPeakPct =
      THRESHOLDS.EXIT_QUALITY
        .STOP_LIKE_FORCED_EXIT_MIN_DRAWDOWN_FROM_PEAK_PCT_OF_BASIS;

    const matched =
      input.closedToFlat &&
      input.totalPositionDecreaseCount > 0 &&
      input.exitWasNearTradeLow &&
      postExitCandleCount > 0 &&
      realizedCapture !== null &&
      realizedCapture <= maxRealizedCapture &&
      givebackPct !== null &&
      givebackPct >= minGivebackPct &&
      drawdownFromPeakPct !== null &&
      drawdownFromPeakPct >= minDrawdownFromPeakPct &&
      adversePct !== null &&
      adversePct >= minAdversePct &&
      netEndPct !== null &&
      netEndPct <= maxNetEndPct &&
      adversePct > (favorablePct ?? Number.NEGATIVE_INFINITY);

    return {
      matched,
      evidence: {
        closedToFlat: input.closedToFlat,
        totalPositionDecreaseCount: input.totalPositionDecreaseCount,
        exitWasNearTradeLow: input.exitWasNearTradeLow,
        realizedCapturePercentOfTradeMfe: realizedCapture,
        maxGivebackFromPeakOpenProfitPct: givebackPct,
        drawdownFromPeakOpenProfitPctOfBasis: drawdownFromPeakPct,
        postExitCandleCount,
        maxAdverseMovePctAfterExit: adversePct,
        maxFavorableMovePctAfterExit: favorablePct,
        netMovePctAtEndOfPostExitWindow: netEndPct,
      },
      thresholdsUsed: {
        minAdversePct,
        maxNetEndPct,
        minGivebackPct,
        maxRealizedCapture,
        minDrawdownFromPeakPct,
      },
    };
  },
};

// =========================
// STOP-LIKE FORCED EXIT BEFORE REBOUND
// =========================

export const STOP_LIKE_FORCED_EXIT_BEFORE_REBOUND: PatternDefinition = {
  id: "stop_like_forced_exit_before_rebound",
  name: "Stop-Like Forced Exit Before Rebound",
  family: PATTERN_FAMILIES.EXIT_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const postExitCandleCount = input.postExitCandleCount;
    const favorablePct = input.maxFavorableMovePctAfterExit;
    const adversePct = input.maxAdverseMovePctAfterExit;
    const netEndPct = input.netMovePctAtEndOfPostExitWindow;
    const givebackPct = input.maxGivebackFromPeakOpenProfitPct;
    const realizedCapture = input.realizedCapturePercentOfTradeMfe;
    const drawdownFromPeakPct = input.drawdownFromPeakOpenProfitPctOfBasis;

    const minFavorablePct =
      THRESHOLDS.EXIT_QUALITY.MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
    const minNetEndPct =
      THRESHOLDS.EXIT_QUALITY.MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;
    const minGivebackPct =
      THRESHOLDS.EXIT_QUALITY
        .DEFENSIVE_EXIT_AFTER_DETERIORATION_MIN_GIVEBACK_PCT;
    const maxRealizedCapture =
      THRESHOLDS.EXIT_QUALITY.STOP_LIKE_FORCED_EXIT_MAX_REALIZED_CAPTURE;
    const minDrawdownFromPeakPct =
      THRESHOLDS.EXIT_QUALITY
        .STOP_LIKE_FORCED_EXIT_MIN_DRAWDOWN_FROM_PEAK_PCT_OF_BASIS;

    const matched =
      input.closedToFlat &&
      input.totalPositionDecreaseCount > 0 &&
      input.exitWasNearTradeLow &&
      postExitCandleCount > 0 &&
      realizedCapture !== null &&
      realizedCapture <= maxRealizedCapture &&
      givebackPct !== null &&
      givebackPct >= minGivebackPct &&
      drawdownFromPeakPct !== null &&
      drawdownFromPeakPct >= minDrawdownFromPeakPct &&
      favorablePct !== null &&
      favorablePct >= minFavorablePct &&
      netEndPct !== null &&
      netEndPct >= minNetEndPct &&
      favorablePct > (adversePct ?? Number.NEGATIVE_INFINITY);

    return {
      matched,
      evidence: {
        closedToFlat: input.closedToFlat,
        totalPositionDecreaseCount: input.totalPositionDecreaseCount,
        exitWasNearTradeLow: input.exitWasNearTradeLow,
        realizedCapturePercentOfTradeMfe: realizedCapture,
        maxGivebackFromPeakOpenProfitPct: givebackPct,
        drawdownFromPeakOpenProfitPctOfBasis: drawdownFromPeakPct,
        postExitCandleCount,
        maxFavorableMovePctAfterExit: favorablePct,
        maxAdverseMovePctAfterExit: adversePct,
        netMovePctAtEndOfPostExitWindow: netEndPct,
      },
      thresholdsUsed: {
        minFavorablePct,
        minNetEndPct,
        minGivebackPct,
        maxRealizedCapture,
        minDrawdownFromPeakPct,
      },
    };
  },
};

export const HELD_THROUGH_DANGER_WITH_STOP_LIKE_FORCED_EXIT_AFTER_BREAKDOWN: PatternDefinition =
  {
    id: "held_through_danger_with_stop_like_forced_exit_after_breakdown",
    name: "Held Through Danger With Stop-Like Forced Exit After Breakdown",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;
      const minGivebackPct =
        THRESHOLDS.EXIT_QUALITY
          .DEFENSIVE_EXIT_AFTER_DETERIORATION_MIN_GIVEBACK_PCT;
      const maxRealizedCapture =
        THRESHOLDS.EXIT_QUALITY.STOP_LIKE_FORCED_EXIT_MAX_REALIZED_CAPTURE;
      const minDrawdownFromPeakPct =
        THRESHOLDS.EXIT_QUALITY
          .STOP_LIKE_FORCED_EXIT_MIN_DRAWDOWN_FROM_PEAK_PCT_OF_BASIS;

      const matched =
        input.closedToFlat &&
        input.totalPositionDecreaseCount > 0 &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.drawdownFromPeakOpenProfitPctOfBasis !== null &&
        input.drawdownFromPeakOpenProfitPctOfBasis >=
          minDrawdownFromPeakPct &&
        !input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
        input.exitWasNearTradeLow &&
        input.postExitCandleCount > 0 &&
        input.realizedCapturePercentOfTradeMfe !== null &&
        input.realizedCapturePercentOfTradeMfe <= maxRealizedCapture &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          drawdownFromPeakOpenProfitPctOfBasis:
            input.drawdownFromPeakOpenProfitPctOfBasis,
          hadReductionAfterPeakOpenProfitBeforeWorstDrawdown:
            input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown,
          closedToFlat: input.closedToFlat,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          exitWasNearTradeLow: input.exitWasNearTradeLow,
          realizedCapturePercentOfTradeMfe:
            input.realizedCapturePercentOfTradeMfe,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minAdversePct,
          maxNetEndPct,
          minGivebackPct,
          maxRealizedCapture,
          minDrawdownFromPeakPct,
        },
      };
    },
  };

export const HELD_THROUGH_DANGER_WITH_STOP_LIKE_FORCED_EXIT_BEFORE_REBOUND: PatternDefinition =
  {
    id: "held_through_danger_with_stop_like_forced_exit_before_rebound",
    name: "Held Through Danger With Stop-Like Forced Exit Before Rebound",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;
      const minGivebackPct =
        THRESHOLDS.EXIT_QUALITY
          .DEFENSIVE_EXIT_AFTER_DETERIORATION_MIN_GIVEBACK_PCT;
      const maxRealizedCapture =
        THRESHOLDS.EXIT_QUALITY.STOP_LIKE_FORCED_EXIT_MAX_REALIZED_CAPTURE;
      const minDrawdownFromPeakPct =
        THRESHOLDS.EXIT_QUALITY
          .STOP_LIKE_FORCED_EXIT_MIN_DRAWDOWN_FROM_PEAK_PCT_OF_BASIS;

      const matched =
        input.closedToFlat &&
        input.totalPositionDecreaseCount > 0 &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.drawdownFromPeakOpenProfitPctOfBasis !== null &&
        input.drawdownFromPeakOpenProfitPctOfBasis >=
          minDrawdownFromPeakPct &&
        !input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
        input.exitWasNearTradeLow &&
        input.postExitCandleCount > 0 &&
        input.realizedCapturePercentOfTradeMfe !== null &&
        input.realizedCapturePercentOfTradeMfe <= maxRealizedCapture &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          drawdownFromPeakOpenProfitPctOfBasis:
            input.drawdownFromPeakOpenProfitPctOfBasis,
          hadReductionAfterPeakOpenProfitBeforeWorstDrawdown:
            input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown,
          closedToFlat: input.closedToFlat,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          exitWasNearTradeLow: input.exitWasNearTradeLow,
          realizedCapturePercentOfTradeMfe:
            input.realizedCapturePercentOfTradeMfe,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          postExitCandleCount: input.postExitCandleCount,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minFavorablePct,
          minNetEndPct,
          minGivebackPct,
          maxRealizedCapture,
          minDrawdownFromPeakPct,
        },
      };
    },
  };

export const DELAYED_RISK_RESPONSE_WITH_STOP_LIKE_FORCED_EXIT_AFTER_BREAKDOWN: PatternDefinition =
  {
    id: "delayed_risk_response_with_stop_like_forced_exit_after_breakdown",
    name: "Delayed Risk Response With Stop-Like Forced Exit After Breakdown",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;
      const minGivebackPct =
        THRESHOLDS.EXIT_QUALITY
          .DEFENSIVE_EXIT_AFTER_DETERIORATION_MIN_GIVEBACK_PCT;
      const maxRealizedCapture =
        THRESHOLDS.EXIT_QUALITY.STOP_LIKE_FORCED_EXIT_MAX_REALIZED_CAPTURE;
      const minDrawdownFromPeakPct =
        THRESHOLDS.EXIT_QUALITY
          .STOP_LIKE_FORCED_EXIT_MIN_DRAWDOWN_FROM_PEAK_PCT_OF_BASIS;
      const minSecondsToFirstReduction =
        THRESHOLDS.POSITION_REDUCTION
          .DELAYED_RISK_RESPONSE_MIN_SECONDS_TO_FIRST_REDUCTION;

      const matched =
        input.closedToFlat &&
        input.totalPositionDecreaseCount > 0 &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.drawdownFromPeakOpenProfitPctOfBasis !== null &&
        input.drawdownFromPeakOpenProfitPctOfBasis >=
          minDrawdownFromPeakPct &&
        input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
        input.secondsFromPeakOpenProfitToFirstReduction !== null &&
        input.secondsFromPeakOpenProfitToFirstReduction >=
          minSecondsToFirstReduction &&
        input.exitWasNearTradeLow &&
        input.postExitCandleCount > 0 &&
        input.realizedCapturePercentOfTradeMfe !== null &&
        input.realizedCapturePercentOfTradeMfe <= maxRealizedCapture &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          drawdownFromPeakOpenProfitPctOfBasis:
            input.drawdownFromPeakOpenProfitPctOfBasis,
          hadReductionAfterPeakOpenProfitBeforeWorstDrawdown:
            input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown,
          secondsFromPeakOpenProfitToFirstReduction:
            input.secondsFromPeakOpenProfitToFirstReduction,
          closedToFlat: input.closedToFlat,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          exitWasNearTradeLow: input.exitWasNearTradeLow,
          realizedCapturePercentOfTradeMfe:
            input.realizedCapturePercentOfTradeMfe,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minAdversePct,
          maxNetEndPct,
          minGivebackPct,
          maxRealizedCapture,
          minDrawdownFromPeakPct,
          minSecondsToFirstReduction,
        },
      };
    },
  };

export const DELAYED_RISK_RESPONSE_WITH_STOP_LIKE_FORCED_EXIT_BEFORE_REBOUND: PatternDefinition =
  {
    id: "delayed_risk_response_with_stop_like_forced_exit_before_rebound",
    name: "Delayed Risk Response With Stop-Like Forced Exit Before Rebound",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;
      const minGivebackPct =
        THRESHOLDS.EXIT_QUALITY
          .DEFENSIVE_EXIT_AFTER_DETERIORATION_MIN_GIVEBACK_PCT;
      const maxRealizedCapture =
        THRESHOLDS.EXIT_QUALITY.STOP_LIKE_FORCED_EXIT_MAX_REALIZED_CAPTURE;
      const minDrawdownFromPeakPct =
        THRESHOLDS.EXIT_QUALITY
          .STOP_LIKE_FORCED_EXIT_MIN_DRAWDOWN_FROM_PEAK_PCT_OF_BASIS;
      const minSecondsToFirstReduction =
        THRESHOLDS.POSITION_REDUCTION
          .DELAYED_RISK_RESPONSE_MIN_SECONDS_TO_FIRST_REDUCTION;

      const matched =
        input.closedToFlat &&
        input.totalPositionDecreaseCount > 0 &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.drawdownFromPeakOpenProfitPctOfBasis !== null &&
        input.drawdownFromPeakOpenProfitPctOfBasis >=
          minDrawdownFromPeakPct &&
        input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
        input.secondsFromPeakOpenProfitToFirstReduction !== null &&
        input.secondsFromPeakOpenProfitToFirstReduction >=
          minSecondsToFirstReduction &&
        input.exitWasNearTradeLow &&
        input.postExitCandleCount > 0 &&
        input.realizedCapturePercentOfTradeMfe !== null &&
        input.realizedCapturePercentOfTradeMfe <= maxRealizedCapture &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          drawdownFromPeakOpenProfitPctOfBasis:
            input.drawdownFromPeakOpenProfitPctOfBasis,
          hadReductionAfterPeakOpenProfitBeforeWorstDrawdown:
            input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown,
          secondsFromPeakOpenProfitToFirstReduction:
            input.secondsFromPeakOpenProfitToFirstReduction,
          closedToFlat: input.closedToFlat,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          exitWasNearTradeLow: input.exitWasNearTradeLow,
          realizedCapturePercentOfTradeMfe:
            input.realizedCapturePercentOfTradeMfe,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          postExitCandleCount: input.postExitCandleCount,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minFavorablePct,
          minNetEndPct,
          minGivebackPct,
          maxRealizedCapture,
          minDrawdownFromPeakPct,
          minSecondsToFirstReduction,
        },
      };
    },
  };

// =========================
// STABILIZED RECOVERY WITH CONSTRUCTIVE FINAL EXIT
// =========================

export const STABILIZED_RECOVERY_WITH_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "stabilized_recovery_with_constructive_final_exit",
    name: "Stabilized Recovery With Constructive Final Exit",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    structuralLevel: "structural_composite",

    evaluate: (input) => {
      const postExitCandleCount = input.postExitCandleCount;
      const favorablePct = input.maxFavorableMovePctAfterExit;
      const adversePct = input.maxAdverseMovePctAfterExit;
      const netEndPct = input.netMovePctAtEndOfPostExitWindow;
      const givebackPct = input.maxGivebackFromPeakOpenProfitPct;

      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY.CONSTRUCTIVE_RECOVERY_MAX_GIVEBACK_PCT;
      const maxSecondsToFirstReduction =
        THRESHOLDS.POSITION_REDUCTION
          .TIMELY_RISK_RESPONSE_MAX_SECONDS_TO_FIRST_REDUCTION;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.closedToFlat &&
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
        input.secondsFromPeakOpenProfitToFirstReduction !== null &&
        input.secondsFromPeakOpenProfitToFirstReduction <=
          maxSecondsToFirstReduction &&
        givebackPct !== null &&
        givebackPct <= maxGivebackPct &&
        postExitCandleCount > 0 &&
        adversePct !== null &&
        adversePct >= minAdversePct &&
        netEndPct !== null &&
        netEndPct <= maxNetEndPct &&
        adversePct >
          (favorablePct ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          closedToFlat: input.closedToFlat,
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          hadReductionAfterPeakOpenProfitBeforeWorstDrawdown:
            input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown,
          secondsFromPeakOpenProfitToFirstReduction:
            input.secondsFromPeakOpenProfitToFirstReduction,
          maxGivebackFromPeakOpenProfitPct: givebackPct,
          postExitCandleCount,
          maxAdverseMovePctAfterExit: adversePct,
          maxFavorableMovePctAfterExit: favorablePct,
          netMovePctAtEndOfPostExitWindow: netEndPct,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          maxGivebackPct,
          maxSecondsToFirstReduction,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

// =========================
// STABILIZED RECOVERY WITH PREMATURE FINAL EXIT
// =========================

export const STABILIZED_RECOVERY_WITH_PREMATURE_FINAL_EXIT: PatternDefinition =
  {
    id: "stabilized_recovery_with_premature_final_exit",
    name: "Stabilized Recovery With Premature Final Exit",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    structuralLevel: "structural_composite",

    evaluate: (input) => {
      const postExitCandleCount = input.postExitCandleCount;
      const favorablePct = input.maxFavorableMovePctAfterExit;
      const adversePct = input.maxAdverseMovePctAfterExit;
      const netEndPct = input.netMovePctAtEndOfPostExitWindow;
      const givebackPct = input.maxGivebackFromPeakOpenProfitPct;

      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const maxGivebackPct =
        THRESHOLDS.EXIT_QUALITY.PREMATURE_FINAL_EXIT_MAX_GIVEBACK_PCT;
      const maxSecondsToFirstReduction =
        THRESHOLDS.POSITION_REDUCTION
          .TIMELY_RISK_RESPONSE_MAX_SECONDS_TO_FIRST_REDUCTION;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.closedToFlat &&
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
        input.secondsFromPeakOpenProfitToFirstReduction !== null &&
        input.secondsFromPeakOpenProfitToFirstReduction <=
          maxSecondsToFirstReduction &&
        givebackPct !== null &&
        givebackPct <= maxGivebackPct &&
        postExitCandleCount > 0 &&
        favorablePct !== null &&
        favorablePct >= minFavorablePct &&
        netEndPct !== null &&
        netEndPct >= minNetEndPct &&
        favorablePct >
          (adversePct ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          closedToFlat: input.closedToFlat,
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          hadReductionAfterPeakOpenProfitBeforeWorstDrawdown:
            input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown,
          secondsFromPeakOpenProfitToFirstReduction:
            input.secondsFromPeakOpenProfitToFirstReduction,
          maxGivebackFromPeakOpenProfitPct: givebackPct,
          postExitCandleCount,
          maxFavorableMovePctAfterExit: favorablePct,
          maxAdverseMovePctAfterExit: adversePct,
          netMovePctAtEndOfPostExitWindow: netEndPct,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          maxGivebackPct,
          maxSecondsToFirstReduction,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const STABILIZED_RECOVERY_WITH_STOP_LIKE_FORCED_EXIT_AFTER_BREAKDOWN: PatternDefinition =
  {
    id: "stabilized_recovery_with_stop_like_forced_exit_after_breakdown",
    name: "Stabilized Recovery With Stop-Like Forced Exit After Breakdown",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    structuralLevel: "structural_composite",

    evaluate: (input) => {
      const postExitCandleCount = input.postExitCandleCount;
      const favorablePct = input.maxFavorableMovePctAfterExit;
      const adversePct = input.maxAdverseMovePctAfterExit;
      const netEndPct = input.netMovePctAtEndOfPostExitWindow;
      const givebackPct = input.maxGivebackFromPeakOpenProfitPct;
      const drawdownFromPeakPct = input.drawdownFromPeakOpenProfitPctOfBasis;
      const realizedCapture = input.realizedCapturePercentOfTradeMfe;

      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const maxSecondsToFirstReduction =
        THRESHOLDS.POSITION_REDUCTION
          .TIMELY_RISK_RESPONSE_MAX_SECONDS_TO_FIRST_REDUCTION;
      const minGivebackPct =
        THRESHOLDS.EXIT_QUALITY
          .DEFENSIVE_EXIT_AFTER_DETERIORATION_MIN_GIVEBACK_PCT;
      const maxRealizedCapture =
        THRESHOLDS.EXIT_QUALITY.STOP_LIKE_FORCED_EXIT_MAX_REALIZED_CAPTURE;
      const minDrawdownFromPeakPct =
        THRESHOLDS.EXIT_QUALITY
          .STOP_LIKE_FORCED_EXIT_MIN_DRAWDOWN_FROM_PEAK_PCT_OF_BASIS;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.closedToFlat &&
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
        input.secondsFromPeakOpenProfitToFirstReduction !== null &&
        input.secondsFromPeakOpenProfitToFirstReduction <=
          maxSecondsToFirstReduction &&
        drawdownFromPeakPct !== null &&
        drawdownFromPeakPct >= minDrawdownFromPeakPct &&
        givebackPct !== null &&
        givebackPct >= minGivebackPct &&
        input.exitWasNearTradeLow &&
        realizedCapture !== null &&
        realizedCapture <= maxRealizedCapture &&
        postExitCandleCount > 0 &&
        adversePct !== null &&
        adversePct >= minAdversePct &&
        netEndPct !== null &&
        netEndPct <= maxNetEndPct &&
        adversePct >
          (favorablePct ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          closedToFlat: input.closedToFlat,
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          hadReductionAfterPeakOpenProfitBeforeWorstDrawdown:
            input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown,
          secondsFromPeakOpenProfitToFirstReduction:
            input.secondsFromPeakOpenProfitToFirstReduction,
          drawdownFromPeakOpenProfitPctOfBasis: drawdownFromPeakPct,
          maxGivebackFromPeakOpenProfitPct: givebackPct,
          exitWasNearTradeLow: input.exitWasNearTradeLow,
          realizedCapturePercentOfTradeMfe: realizedCapture,
          postExitCandleCount,
          maxAdverseMovePctAfterExit: adversePct,
          maxFavorableMovePctAfterExit: favorablePct,
          netMovePctAtEndOfPostExitWindow: netEndPct,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          maxSecondsToFirstReduction,
          minGivebackPct,
          maxRealizedCapture,
          minDrawdownFromPeakPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const STABILIZED_RECOVERY_WITH_STOP_LIKE_FORCED_EXIT_BEFORE_REBOUND: PatternDefinition =
  {
    id: "stabilized_recovery_with_stop_like_forced_exit_before_rebound",
    name: "Stabilized Recovery With Stop-Like Forced Exit Before Rebound",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    structuralLevel: "structural_composite",

    evaluate: (input) => {
      const postExitCandleCount = input.postExitCandleCount;
      const favorablePct = input.maxFavorableMovePctAfterExit;
      const adversePct = input.maxAdverseMovePctAfterExit;
      const netEndPct = input.netMovePctAtEndOfPostExitWindow;
      const givebackPct = input.maxGivebackFromPeakOpenProfitPct;
      const drawdownFromPeakPct = input.drawdownFromPeakOpenProfitPctOfBasis;
      const realizedCapture = input.realizedCapturePercentOfTradeMfe;

      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const maxSecondsToFirstReduction =
        THRESHOLDS.POSITION_REDUCTION
          .TIMELY_RISK_RESPONSE_MAX_SECONDS_TO_FIRST_REDUCTION;
      const minGivebackPct =
        THRESHOLDS.EXIT_QUALITY
          .DEFENSIVE_EXIT_AFTER_DETERIORATION_MIN_GIVEBACK_PCT;
      const maxRealizedCapture =
        THRESHOLDS.EXIT_QUALITY.STOP_LIKE_FORCED_EXIT_MAX_REALIZED_CAPTURE;
      const minDrawdownFromPeakPct =
        THRESHOLDS.EXIT_QUALITY
          .STOP_LIKE_FORCED_EXIT_MIN_DRAWDOWN_FROM_PEAK_PCT_OF_BASIS;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.closedToFlat &&
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
        input.secondsFromPeakOpenProfitToFirstReduction !== null &&
        input.secondsFromPeakOpenProfitToFirstReduction <=
          maxSecondsToFirstReduction &&
        drawdownFromPeakPct !== null &&
        drawdownFromPeakPct >= minDrawdownFromPeakPct &&
        givebackPct !== null &&
        givebackPct >= minGivebackPct &&
        input.exitWasNearTradeLow &&
        realizedCapture !== null &&
        realizedCapture <= maxRealizedCapture &&
        postExitCandleCount > 0 &&
        favorablePct !== null &&
        favorablePct >= minFavorablePct &&
        netEndPct !== null &&
        netEndPct >= minNetEndPct &&
        favorablePct >
          (adversePct ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          closedToFlat: input.closedToFlat,
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          hadReductionAfterPeakOpenProfitBeforeWorstDrawdown:
            input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown,
          secondsFromPeakOpenProfitToFirstReduction:
            input.secondsFromPeakOpenProfitToFirstReduction,
          drawdownFromPeakOpenProfitPctOfBasis: drawdownFromPeakPct,
          maxGivebackFromPeakOpenProfitPct: givebackPct,
          exitWasNearTradeLow: input.exitWasNearTradeLow,
          realizedCapturePercentOfTradeMfe: realizedCapture,
          postExitCandleCount,
          maxFavorableMovePctAfterExit: favorablePct,
          maxAdverseMovePctAfterExit: adversePct,
          netMovePctAtEndOfPostExitWindow: netEndPct,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          maxSecondsToFirstReduction,
          minGivebackPct,
          maxRealizedCapture,
          minDrawdownFromPeakPct,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const EXIT_QUALITY_PATTERNS: PatternDefinition[] = [
  HIGH_CAPTURE_EXIT_STRUCTURE,
  MODERATE_CAPTURE_EXIT_STRUCTURE,
  LOW_CAPTURE_EXIT_STRUCTURE,
  EXIT_WITH_LIMITED_GIVEBACK,
  EXIT_WITH_MEANINGFUL_GIVEBACK,
  EXIT_NEAR_FAVORABLE_EXTREME,
  PEAK_PROFIT_GIVEBACK_STRUCTURE,
  PARTIAL_EXIT_WITH_ADVERSE_FOLLOWTHROUGH,
  MISSED_POST_EXIT_CONTINUATION,
  EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH,
  DEFENSIVE_EXIT_AFTER_DETERIORATION,
  PREMATURE_FINAL_EXIT_AFTER_CONSTRUCTIVE_MANAGEMENT,
  FEARFUL_EXIT_AFTER_WEAKENING,
  EXIT_INTO_SUPPORT_STRUCTURE,
  EXIT_INTO_SUPPORT_WITH_RELIEF_AFTER_EXIT,
  EXIT_INTO_SUPPORT_BEFORE_BREAKDOWN,
  EXIT_INTO_STACKED_SUPPORT_WITH_RELIEF_AFTER_EXIT,
  EXIT_INTO_THIN_SUPPORT_BEFORE_BREAKDOWN,
  EXIT_INTO_RESISTANCE_WITH_REVERSAL_AFTER_EXIT,
  EXIT_INTO_RESISTANCE_BEFORE_BREAKOUT,
  DISCIPLINED_DEFENSIVE_EXIT,
  STOP_LIKE_FORCED_EXIT_AFTER_BREAKDOWN,
  STOP_LIKE_FORCED_EXIT_BEFORE_REBOUND,
  HELD_THROUGH_DANGER_WITH_STOP_LIKE_FORCED_EXIT_AFTER_BREAKDOWN,
  HELD_THROUGH_DANGER_WITH_STOP_LIKE_FORCED_EXIT_BEFORE_REBOUND,
  DELAYED_RISK_RESPONSE_WITH_STOP_LIKE_FORCED_EXIT_AFTER_BREAKDOWN,
  DELAYED_RISK_RESPONSE_WITH_STOP_LIKE_FORCED_EXIT_BEFORE_REBOUND,
  STABILIZED_RECOVERY_WITH_CONSTRUCTIVE_FINAL_EXIT,
  STABILIZED_RECOVERY_WITH_EXIT_INTO_STACKED_SUPPORT_AND_RELIEF,
  STABILIZED_RECOVERY_WITH_EXIT_INTO_THIN_SUPPORT_BEFORE_BREAKDOWN,
  STABILIZED_RECOVERY_WITH_EXIT_INTO_RESISTANCE_AND_REVERSAL,
  STABILIZED_RECOVERY_WITH_EXIT_INTO_RESISTANCE_BEFORE_BREAKOUT,
  STABILIZED_RECOVERY_WITH_PREMATURE_FINAL_EXIT,
  STABILIZED_RECOVERY_WITH_STOP_LIKE_FORCED_EXIT_AFTER_BREAKDOWN,
  STABILIZED_RECOVERY_WITH_STOP_LIKE_FORCED_EXIT_BEFORE_REBOUND,
];
