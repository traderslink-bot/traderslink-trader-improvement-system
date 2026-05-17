// =========================
// 2026-04-12 06:28 PM America/Toronto
// SCALING QUALITY PATTERNS
// =========================
//
// PURPOSE:
// Detects higher-order position sizing and scaling behavior.
//
// IMPORTANT:
// These are composite patterns.
// They describe HOW size was built and managed during the trade.
//
// THESE PATTERNS DO NOT:
// - judge correctness of idea
// - assign scores
// - generate coaching
//
// FUTURE EXPANSION:
// - add timing-aware scaling (early vs late adds)
// - detect add into extension vs pullback
// - detect add-after-failure patterns
//

import type { PatternDefinition } from "../../types/pattern-detection-types";
import {
  PATTERN_FAMILIES,
  THRESHOLDS,
} from "../../types/pattern-detection-types";

// =========================
// STRUCTURED POSITION BUILDING
// =========================
//
// Meaning:
// - trader built size intentionally through multiple increases
//
export const STRUCTURED_POSITION_BUILDING: PatternDefinition = {
  id: "structured_position_building",
  name: "Structured Position Building",
  family: PATTERN_FAMILIES.SCALING_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const increases = input.totalPositionIncreaseCount;

    const minIncreases =
      THRESHOLDS.SCALING_QUALITY.STRUCTURED_MIN_INCREASES;

    const matched = increases >= minIncreases;

    return {
      matched,
      evidence: {
        totalPositionIncreaseCount: increases,
      },
      thresholdsUsed: {
        minIncreases,
      },
    };
  },
};

// =========================
// BALANCED POSITION MANAGEMENT
// =========================
//
// Meaning:
// - trader both built AND reduced size
// - indicates active management, not one-directional behavior
//
export const BALANCED_POSITION_MANAGEMENT: PatternDefinition = {
  id: "balanced_position_management",
  name: "Balanced Position Management",
  family: PATTERN_FAMILIES.SCALING_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const increases = input.totalPositionIncreaseCount;
    const decreases = input.totalPositionDecreaseCount;

    const minIncreases =
      THRESHOLDS.SCALING_QUALITY.BALANCED_MIN_INCREASES;
    const minDecreases =
      THRESHOLDS.SCALING_QUALITY.BALANCED_MIN_DECREASES;

    const matched =
      increases >= minIncreases &&
      decreases >= minDecreases;

    return {
      matched,
      evidence: {
        totalPositionIncreaseCount: increases,
        totalPositionDecreaseCount: decreases,
      },
      thresholdsUsed: {
        minIncreases,
        minDecreases,
      },
    };
  },
};

// =========================
// ONE-SIDED AGGRESSIVE BUILDING
// =========================
//
// Meaning:
// - trader kept adding but did not reduce
// - risk of overexposure or lack of management
//
export const ONE_SIDED_AGGRESSIVE_BUILDING: PatternDefinition = {
  id: "one_sided_aggressive_building",
  name: "One-Sided Aggressive Building",
  family: PATTERN_FAMILIES.SCALING_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const increases = input.totalPositionIncreaseCount;
    const decreases = input.totalPositionDecreaseCount;

    const minIncreases =
      THRESHOLDS.SCALING_QUALITY.ONE_SIDED_MIN_INCREASES;
    const requiredDecreases =
      THRESHOLDS.SCALING_QUALITY.ONE_SIDED_REQUIRED_DECREASES;

    const matched =
      increases >= minIncreases &&
      decreases === requiredDecreases;

    return {
      matched,
      evidence: {
        totalPositionIncreaseCount: increases,
        totalPositionDecreaseCount: decreases,
      },
      thresholdsUsed: {
        minIncreases,
        requiredDecreases,
      },
    };
  },
};

// =========================
// UNDERUTILIZED POSITION BUILDING
// =========================
//
// Meaning:
// - trader did not build size meaningfully
// - even if trade worked, position sizing stayed limited
//
export const UNDERUTILIZED_POSITION_BUILDING: PatternDefinition = {
  id: "underutilized_position_building",
  name: "Underutilized Position Building",
  family: PATTERN_FAMILIES.SCALING_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const increases = input.totalPositionIncreaseCount;
    const mfe = input.tradeMfePct;

    const maxIncreases =
      THRESHOLDS.SCALING_QUALITY.UNDERUTILIZED_MAX_INCREASES;
    const minMfePct =
      THRESHOLDS.SCALING_QUALITY.UNDERUTILIZED_MIN_MFE_PCT;

    const matched =
      increases <= maxIncreases &&
      mfe !== null &&
      mfe >= minMfePct;

    return {
      matched,
      evidence: {
        totalPositionIncreaseCount: increases,
        tradeMfePct: mfe,
      },
      thresholdsUsed: {
        maxIncreases,
        minMfePct,
      },
    };
  },
};

export const UNDERUTILIZED_WINNER_WITH_CONSTRUCTIVE_EXIT: PatternDefinition = {
  id: "underutilized_winner_with_constructive_exit",
  name: "Underutilized Winner With Constructive Exit",
  family: PATTERN_FAMILIES.SCALING_QUALITY,
  patternType: "composite",
  structuralLevel: "storyline_composite",

  evaluate: (input) => {
    const increases = input.totalPositionIncreaseCount;
    const mfe = input.tradeMfePct;
    const postExitCandleCount = input.postExitCandleCount;
    const favorablePct = input.maxFavorableMovePctAfterExit;
    const adversePct = input.maxAdverseMovePctAfterExit;
    const netEndPct = input.netMovePctAtEndOfPostExitWindow;

    const maxIncreases =
      THRESHOLDS.SCALING_QUALITY.UNDERUTILIZED_MAX_INCREASES;
    const minMfePct =
      THRESHOLDS.SCALING_QUALITY.UNDERUTILIZED_MIN_MFE_PCT;
    const minAdversePct =
      THRESHOLDS.EXIT_QUALITY
        .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
    const maxNetEndPct =
      THRESHOLDS.EXIT_QUALITY
        .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

    const matched =
      increases <= maxIncreases &&
      mfe !== null &&
      mfe >= minMfePct &&
      input.closedToFlat &&
      postExitCandleCount > 0 &&
      adversePct !== null &&
      adversePct >= minAdversePct &&
      netEndPct !== null &&
      netEndPct <= maxNetEndPct &&
      adversePct > (favorablePct ?? Number.NEGATIVE_INFINITY);

    return {
      matched,
      evidence: {
        totalPositionIncreaseCount: increases,
        tradeMfePct: mfe,
        closedToFlat: input.closedToFlat,
        postExitCandleCount,
        maxAdverseMovePctAfterExit: adversePct,
        maxFavorableMovePctAfterExit: favorablePct,
        netMovePctAtEndOfPostExitWindow: netEndPct,
      },
      thresholdsUsed: {
        maxIncreases,
        minMfePct,
        minAdversePct,
        maxNetEndPct,
      },
    };
  },
};

export const RECOVERY_TO_UNDERUTILIZED_WINNER_WITH_CONSTRUCTIVE_EXIT: PatternDefinition =
  {
    id: "recovery_to_underutilized_winner_with_constructive_exit",
    name: "Recovery To Underutilized Winner With Constructive Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const increases = input.totalPositionIncreaseCount;
      const mfe = input.tradeMfePct;
      const postExitCandleCount = input.postExitCandleCount;
      const favorablePct = input.maxFavorableMovePctAfterExit;
      const adversePct = input.maxAdverseMovePctAfterExit;
      const netEndPct = input.netMovePctAtEndOfPostExitWindow;

      const maxIncreases =
        THRESHOLDS.SCALING_QUALITY.UNDERUTILIZED_MAX_INCREASES;
      const minMfePct =
        THRESHOLDS.SCALING_QUALITY.UNDERUTILIZED_MIN_MFE_PCT;
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY.CONSTRUCTIVE_RECOVERY_MAX_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        increases <= maxIncreases &&
        mfe !== null &&
        mfe >= minMfePct &&
        input.closedToFlat &&
        postExitCandleCount > 0 &&
        adversePct !== null &&
        adversePct >= minAdversePct &&
        netEndPct !== null &&
        netEndPct <= maxNetEndPct &&
        adversePct > (favorablePct ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          realizedReturnPct: input.realizedReturnPct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          totalPositionIncreaseCount: increases,
          tradeMfePct: mfe,
          closedToFlat: input.closedToFlat,
          postExitCandleCount,
          maxAdverseMovePctAfterExit: adversePct,
          maxFavorableMovePctAfterExit: favorablePct,
          netMovePctAtEndOfPostExitWindow: netEndPct,
        },
        thresholdsUsed: {
          maxIncreases,
          minMfePct,
          minPeakOpenProfitPctOfBasis,
          maxGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const UNDERUTILIZED_WINNER_WITH_TIMELY_PROFIT_PROTECTION_AND_CONSTRUCTIVE_EXIT: PatternDefinition =
  {
    id: "underutilized_winner_with_timely_profit_protection_and_constructive_final_exit",
    name: "Underutilized Winner With Timely Profit Protection And Constructive Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const increases = input.totalPositionIncreaseCount;
      const mfe = input.tradeMfePct;
      const postExitCandleCount = input.postExitCandleCount;
      const favorablePct = input.maxFavorableMovePctAfterExit;
      const adversePct = input.maxAdverseMovePctAfterExit;
      const netEndPct = input.netMovePctAtEndOfPostExitWindow;

      const maxIncreases =
        THRESHOLDS.SCALING_QUALITY.UNDERUTILIZED_MAX_INCREASES;
      const minMfePct =
        THRESHOLDS.SCALING_QUALITY.UNDERUTILIZED_MIN_MFE_PCT;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .BALANCED_WITH_PROFIT_PROTECTION_MAX_GIVEBACK_PCT;
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
        increases <= maxIncreases &&
        mfe !== null &&
        mfe >= minMfePct &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
        input.secondsFromPeakOpenProfitToFirstReduction !== null &&
        input.secondsFromPeakOpenProfitToFirstReduction <=
          maxSecondsToFirstReduction &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        postExitCandleCount > 0 &&
        adversePct !== null &&
        adversePct >= minAdversePct &&
        netEndPct !== null &&
        netEndPct <= maxNetEndPct &&
        adversePct > (favorablePct ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          totalPositionIncreaseCount: increases,
          tradeMfePct: mfe,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          hadReductionAfterPeakOpenProfitBeforeWorstDrawdown:
            input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown,
          secondsFromPeakOpenProfitToFirstReduction:
            input.secondsFromPeakOpenProfitToFirstReduction,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount,
          maxAdverseMovePctAfterExit: adversePct,
          maxFavorableMovePctAfterExit: favorablePct,
          netMovePctAtEndOfPostExitWindow: netEndPct,
        },
        thresholdsUsed: {
          maxIncreases,
          minMfePct,
          maxGivebackPct,
          maxSecondsToFirstReduction,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const UNDERUTILIZED_WINNER_WITH_PREMATURE_FINAL_EXIT: PatternDefinition =
  {
    id: "underutilized_winner_with_premature_final_exit",
    name: "Underutilized Winner With Premature Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const increases = input.totalPositionIncreaseCount;
      const mfe = input.tradeMfePct;
      const postExitCandleCount = input.postExitCandleCount;
      const favorablePct = input.maxFavorableMovePctAfterExit;
      const adversePct = input.maxAdverseMovePctAfterExit;
      const netEndPct = input.netMovePctAtEndOfPostExitWindow;

      const maxIncreases =
        THRESHOLDS.SCALING_QUALITY.UNDERUTILIZED_MAX_INCREASES;
      const minMfePct =
        THRESHOLDS.SCALING_QUALITY.UNDERUTILIZED_MIN_MFE_PCT;
      const maxGivebackPct =
        THRESHOLDS.EXIT_QUALITY.PREMATURE_FINAL_EXIT_MAX_GIVEBACK_PCT;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        increases <= maxIncreases &&
        mfe !== null &&
        mfe >= minMfePct &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        postExitCandleCount > 0 &&
        favorablePct !== null &&
        favorablePct >= minFavorablePct &&
        netEndPct !== null &&
        netEndPct >= minNetEndPct &&
        favorablePct > (adversePct ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          totalPositionIncreaseCount: increases,
          tradeMfePct: mfe,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount,
          maxFavorableMovePctAfterExit: favorablePct,
          maxAdverseMovePctAfterExit: adversePct,
          netMovePctAtEndOfPostExitWindow: netEndPct,
        },
        thresholdsUsed: {
          maxIncreases,
          minMfePct,
          maxGivebackPct,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const RECOVERY_TO_UNDERUTILIZED_WINNER_WITH_TIMELY_PROFIT_PROTECTION_AND_CONSTRUCTIVE_EXIT: PatternDefinition =
  {
    id: "recovery_to_underutilized_winner_with_timely_profit_protection_and_constructive_final_exit",
    name: "Recovery To Underutilized Winner With Timely Profit Protection And Constructive Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const increases = input.totalPositionIncreaseCount;
      const mfe = input.tradeMfePct;
      const postExitCandleCount = input.postExitCandleCount;
      const favorablePct = input.maxFavorableMovePctAfterExit;
      const adversePct = input.maxAdverseMovePctAfterExit;
      const netEndPct = input.netMovePctAtEndOfPostExitWindow;

      const maxIncreases =
        THRESHOLDS.SCALING_QUALITY.UNDERUTILIZED_MAX_INCREASES;
      const minMfePct =
        THRESHOLDS.SCALING_QUALITY.UNDERUTILIZED_MIN_MFE_PCT;
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .BALANCED_WITH_PROFIT_PROTECTION_MAX_GIVEBACK_PCT;
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
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        increases <= maxIncreases &&
        mfe !== null &&
        mfe >= minMfePct &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
        input.secondsFromPeakOpenProfitToFirstReduction !== null &&
        input.secondsFromPeakOpenProfitToFirstReduction <=
          maxSecondsToFirstReduction &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        postExitCandleCount > 0 &&
        adversePct !== null &&
        adversePct >= minAdversePct &&
        netEndPct !== null &&
        netEndPct <= maxNetEndPct &&
        adversePct > (favorablePct ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          realizedReturnPct: input.realizedReturnPct,
          totalPositionIncreaseCount: increases,
          tradeMfePct: mfe,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          hadReductionAfterPeakOpenProfitBeforeWorstDrawdown:
            input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown,
          secondsFromPeakOpenProfitToFirstReduction:
            input.secondsFromPeakOpenProfitToFirstReduction,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount,
          maxAdverseMovePctAfterExit: adversePct,
          maxFavorableMovePctAfterExit: favorablePct,
          netMovePctAtEndOfPostExitWindow: netEndPct,
        },
        thresholdsUsed: {
          maxIncreases,
          minMfePct,
          minPeakOpenProfitPctOfBasis,
          maxGivebackPct,
          maxSecondsToFirstReduction,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const RECOVERY_TO_UNDERUTILIZED_WINNER_WITH_PREMATURE_FINAL_EXIT: PatternDefinition =
  {
    id: "recovery_to_underutilized_winner_with_premature_final_exit",
    name: "Recovery To Underutilized Winner With Premature Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const increases = input.totalPositionIncreaseCount;
      const mfe = input.tradeMfePct;
      const postExitCandleCount = input.postExitCandleCount;
      const favorablePct = input.maxFavorableMovePctAfterExit;
      const adversePct = input.maxAdverseMovePctAfterExit;
      const netEndPct = input.netMovePctAtEndOfPostExitWindow;

      const maxIncreases =
        THRESHOLDS.SCALING_QUALITY.UNDERUTILIZED_MAX_INCREASES;
      const minMfePct =
        THRESHOLDS.SCALING_QUALITY.UNDERUTILIZED_MIN_MFE_PCT;
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const maxGivebackPct =
        THRESHOLDS.EXIT_QUALITY.PREMATURE_FINAL_EXIT_MAX_GIVEBACK_PCT;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        increases <= maxIncreases &&
        mfe !== null &&
        mfe >= minMfePct &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        postExitCandleCount > 0 &&
        favorablePct !== null &&
        favorablePct >= minFavorablePct &&
        netEndPct !== null &&
        netEndPct >= minNetEndPct &&
        favorablePct > (adversePct ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          realizedReturnPct: input.realizedReturnPct,
          totalPositionIncreaseCount: increases,
          tradeMfePct: mfe,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount,
          maxFavorableMovePctAfterExit: favorablePct,
          maxAdverseMovePctAfterExit: adversePct,
          netMovePctAtEndOfPostExitWindow: netEndPct,
        },
        thresholdsUsed: {
          maxIncreases,
          minMfePct,
          minPeakOpenProfitPctOfBasis,
          maxGivebackPct,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const UNDERUTILIZED_WINNER_WITH_MISSED_FINAL_CONTINUATION: PatternDefinition =
  {
    id: "underutilized_winner_with_missed_final_continuation",
    name: "Underutilized Winner With Missed Final Continuation",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const increases = input.totalPositionIncreaseCount;
      const mfe = input.tradeMfePct;
      const postExitCandleCount = input.postExitCandleCount;
      const favorablePct = input.maxFavorableMovePctAfterExit;
      const adversePct = input.maxAdverseMovePctAfterExit;
      const netEndPct = input.netMovePctAtEndOfPostExitWindow;

      const maxIncreases =
        THRESHOLDS.SCALING_QUALITY.UNDERUTILIZED_MAX_INCREASES;
      const minMfePct =
        THRESHOLDS.SCALING_QUALITY.UNDERUTILIZED_MIN_MFE_PCT;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        increases <= maxIncreases &&
        mfe !== null &&
        mfe >= minMfePct &&
        input.closedToFlat &&
        postExitCandleCount > 0 &&
        favorablePct !== null &&
        favorablePct >= minFavorablePct &&
        netEndPct !== null &&
        netEndPct >= minNetEndPct &&
        favorablePct > (adversePct ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          totalPositionIncreaseCount: increases,
          tradeMfePct: mfe,
          closedToFlat: input.closedToFlat,
          postExitCandleCount,
          maxFavorableMovePctAfterExit: favorablePct,
          maxAdverseMovePctAfterExit: adversePct,
          netMovePctAtEndOfPostExitWindow: netEndPct,
        },
        thresholdsUsed: {
          maxIncreases,
          minMfePct,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const RECOVERY_TO_UNDERUTILIZED_WINNER_WITH_MISSED_FINAL_CONTINUATION: PatternDefinition =
  {
    id: "recovery_to_underutilized_winner_with_missed_final_continuation",
    name: "Recovery To Underutilized Winner With Missed Final Continuation",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const increases = input.totalPositionIncreaseCount;
      const mfe = input.tradeMfePct;
      const postExitCandleCount = input.postExitCandleCount;
      const favorablePct = input.maxFavorableMovePctAfterExit;
      const adversePct = input.maxAdverseMovePctAfterExit;
      const netEndPct = input.netMovePctAtEndOfPostExitWindow;

      const maxIncreases =
        THRESHOLDS.SCALING_QUALITY.UNDERUTILIZED_MAX_INCREASES;
      const minMfePct =
        THRESHOLDS.SCALING_QUALITY.UNDERUTILIZED_MIN_MFE_PCT;
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        increases <= maxIncreases &&
        mfe !== null &&
        mfe >= minMfePct &&
        input.closedToFlat &&
        postExitCandleCount > 0 &&
        favorablePct !== null &&
        favorablePct >= minFavorablePct &&
        netEndPct !== null &&
        netEndPct >= minNetEndPct &&
        favorablePct > (adversePct ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          realizedReturnPct: input.realizedReturnPct,
          totalPositionIncreaseCount: increases,
          tradeMfePct: mfe,
          closedToFlat: input.closedToFlat,
          postExitCandleCount,
          maxFavorableMovePctAfterExit: favorablePct,
          maxAdverseMovePctAfterExit: adversePct,
          netMovePctAtEndOfPostExitWindow: netEndPct,
        },
        thresholdsUsed: {
          maxIncreases,
          minMfePct,
          minPeakOpenProfitPctOfBasis,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

// =========================
// RE-ADD AFTER REDUCTION
// =========================

export const READD_AFTER_REDUCTION: PatternDefinition = {
  id: "readd_after_reduction",
  name: "Re-Add After Reduction",
  family: PATTERN_FAMILIES.SCALING_QUALITY,
  patternType: "atomic",
  structuralLevel: "atomic",

  evaluate: (input) => {
    return {
      matched: input.hadReaddAfterReduction,
      evidence: {
        hadReaddAfterReduction: input.hadReaddAfterReduction,
        readdAfterReductionCount: input.readdAfterReductionCount,
      },
      thresholdsUsed: {
        minReaddAfterReductionCount: 1,
      },
    };
  },
};

// =========================
// ADDING ABOVE PRIOR BASIS
// =========================

export const ADDING_ABOVE_PRIOR_BASIS: PatternDefinition = {
  id: "adding_above_prior_basis",
  name: "Adding Above Prior Basis",
  family: PATTERN_FAMILIES.SCALING_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const addCount = input.addCountAfterInitialEntry;
    const addAboveBasisCount = input.addAbovePreviousAverageEntryCount;
    const averageAddPct = input.averageAddPriceVsPreviousAverageEntryPct;

    const minAverageAddPct =
      THRESHOLDS.SCALING_QUALITY.ADD_ABOVE_BASIS_MIN_AVERAGE_PCT;

    const matched =
      addCount > 0 &&
      addAboveBasisCount === addCount &&
      averageAddPct !== null &&
      averageAddPct >= minAverageAddPct;

    return {
      matched,
      evidence: {
        addCountAfterInitialEntry: addCount,
        addAbovePreviousAverageEntryCount: addAboveBasisCount,
        averageAddPriceVsPreviousAverageEntryPct: averageAddPct,
      },
      thresholdsUsed: {
        minAverageAddPct,
      },
    };
  },
};

// =========================
// ADD INTO STRENGTH
// =========================

export const ADD_INTO_STRENGTH: PatternDefinition = {
  id: "add_into_strength",
  name: "Add Into Strength",
  family: PATTERN_FAMILIES.SCALING_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const addCount = input.addCountAfterInitialEntry;
    const addAboveBasisCount = input.addAbovePreviousAverageEntryCount;
    const averageAddPct = input.averageAddPriceVsPreviousAverageEntryPct;
    const averageAddRangePosition =
      input.averageAddPricePositionInRecentRangePct;

    const minRangePosition =
      THRESHOLDS.SCALING_QUALITY.ADD_INTO_STRENGTH_MIN_RANGE_POSITION;
    const minAverageAddPct =
      THRESHOLDS.SCALING_QUALITY.ADD_INTO_STRENGTH_MIN_AVERAGE_PCT;

    const matched =
      addCount > 0 &&
      addAboveBasisCount === addCount &&
      averageAddPct !== null &&
      averageAddPct >= minAverageAddPct &&
      averageAddRangePosition !== null &&
      averageAddRangePosition >= minRangePosition;

    return {
      matched,
      evidence: {
        addCountAfterInitialEntry: addCount,
        addAbovePreviousAverageEntryCount: addAboveBasisCount,
        averageAddPriceVsPreviousAverageEntryPct: averageAddPct,
        averageAddPricePositionInRecentRangePct: averageAddRangePosition,
      },
      thresholdsUsed: {
        minRangePosition,
        minAverageAddPct,
      },
    };
  },
};

// =========================
// ADD INTO WEAKNESS
// =========================

export const ADD_INTO_WEAKNESS: PatternDefinition = {
  id: "add_into_weakness",
  name: "Add Into Weakness",
  family: PATTERN_FAMILIES.SCALING_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const addCount = input.addCountAfterInitialEntry;
    const addBelowBasisCount = input.addBelowPreviousAverageEntryCount;
    const averageAddPct = input.averageAddPriceVsPreviousAverageEntryPct;
    const averageAddRangePosition =
      input.averageAddPricePositionInRecentRangePct;

    const maxRangePosition =
      THRESHOLDS.SCALING_QUALITY.ADD_INTO_WEAKNESS_MAX_RANGE_POSITION;
    const maxAverageAddPct =
      THRESHOLDS.SCALING_QUALITY.ADD_INTO_WEAKNESS_MAX_AVERAGE_PCT;

    const matched =
      addCount > 0 &&
      addBelowBasisCount === addCount &&
      averageAddPct !== null &&
      averageAddPct <= maxAverageAddPct &&
      averageAddRangePosition !== null &&
      averageAddRangePosition <= maxRangePosition;

    return {
      matched,
      evidence: {
        addCountAfterInitialEntry: addCount,
        addBelowPreviousAverageEntryCount: addBelowBasisCount,
        averageAddPriceVsPreviousAverageEntryPct: averageAddPct,
        averageAddPricePositionInRecentRangePct: averageAddRangePosition,
      },
      thresholdsUsed: {
        maxRangePosition,
        maxAverageAddPct,
      },
    };
  },
};

// =========================
// ADD AFTER RECENT RUN-UP
// =========================

export const ADD_AFTER_RECENT_RUN_UP: PatternDefinition = {
  id: "add_after_recent_run_up",
  name: "Add After Recent Run-Up",
  family: PATTERN_FAMILIES.SCALING_QUALITY,
  patternType: "atomic",
  structuralLevel: "atomic",

  evaluate: (input) => {
    const addCount = input.addCountAfterInitialEntry;
    const addsWithRecentRunUpCount = input.addsWithRecentRunUpCount;
    const averageRunUp = input.averageAddRecentRunUpPctBeforeExecution;

    const minRunUp =
      THRESHOLDS.SCALING_QUALITY.ADD_AFTER_RECENT_RUN_UP_MIN_PCT;

    const matched =
      addCount > 0 &&
      addsWithRecentRunUpCount > 0 &&
      averageRunUp !== null &&
      averageRunUp >= minRunUp;

    return {
      matched,
      evidence: {
        addCountAfterInitialEntry: addCount,
        addsWithRecentRunUpCount,
        averageAddRecentRunUpPctBeforeExecution: averageRunUp,
      },
      thresholdsUsed: {
        minRunUp,
      },
    };
  },
};

// =========================
// ADD AFTER RECENT DROP
// =========================

export const ADD_AFTER_RECENT_DROP: PatternDefinition = {
  id: "add_after_recent_drop",
  name: "Add After Recent Drop",
  family: PATTERN_FAMILIES.SCALING_QUALITY,
  patternType: "atomic",
  structuralLevel: "atomic",

  evaluate: (input) => {
    const addCount = input.addCountAfterInitialEntry;
    const addsWithRecentDropCount = input.addsWithRecentDropCount;
    const averageDrop = input.averageAddRecentDropPctBeforeExecution;

    const minDrop =
      THRESHOLDS.SCALING_QUALITY.ADD_AFTER_RECENT_DROP_MIN_PCT;

    const matched =
      addCount > 0 &&
      addsWithRecentDropCount > 0 &&
      averageDrop !== null &&
      averageDrop >= minDrop;

    return {
      matched,
      evidence: {
        addCountAfterInitialEntry: addCount,
        addsWithRecentDropCount,
        averageAddRecentDropPctBeforeExecution: averageDrop,
      },
      thresholdsUsed: {
        minDrop,
      },
    };
  },
};

// =========================
// BALANCED SCALING WITH PROFIT PROTECTION
// =========================

export const BALANCED_SCALING_WITH_PROFIT_PROTECTION: PatternDefinition = {
  id: "balanced_scaling_with_profit_protection",
  name: "Balanced Scaling With Profit Protection",
  family: PATTERN_FAMILIES.SCALING_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const addCount = input.addCountAfterInitialEntry;
    const reductionCount = input.totalPositionDecreaseCount;
    const maxGivebackPct = input.maxGivebackFromPeakOpenProfitPct;

    const maxAllowedGivebackPct =
      THRESHOLDS.SCALING_QUALITY.BALANCED_WITH_PROFIT_PROTECTION_MAX_GIVEBACK_PCT;

    const matched =
      addCount > 0 &&
      reductionCount > 0 &&
      maxGivebackPct !== null &&
      maxGivebackPct <= maxAllowedGivebackPct;

    return {
      matched,
      evidence: {
        addCountAfterInitialEntry: addCount,
        totalPositionDecreaseCount: reductionCount,
        maxGivebackFromPeakOpenProfitPct: maxGivebackPct,
      },
      thresholdsUsed: {
        maxAllowedGivebackPct,
      },
    };
  },
};

export const ADD_INTO_STRENGTH_WITH_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "add_into_strength_with_constructive_final_exit",
    name: "Add Into Strength With Constructive Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minRangePosition =
        THRESHOLDS.SCALING_QUALITY.ADD_INTO_STRENGTH_MIN_RANGE_POSITION;
      const minAverageAddPct =
        THRESHOLDS.SCALING_QUALITY.ADD_INTO_STRENGTH_MIN_AVERAGE_PCT;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .BALANCED_WITH_PROFIT_PROTECTION_MAX_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.addCountAfterInitialEntry > 0 &&
        input.addAbovePreviousAverageEntryCount ===
          input.addCountAfterInitialEntry &&
        input.averageAddPriceVsPreviousAverageEntryPct !== null &&
        input.averageAddPriceVsPreviousAverageEntryPct >= minAverageAddPct &&
        input.averageAddPricePositionInRecentRangePct !== null &&
        input.averageAddPricePositionInRecentRangePct >= minRangePosition &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          addCountAfterInitialEntry: input.addCountAfterInitialEntry,
          addAbovePreviousAverageEntryCount:
            input.addAbovePreviousAverageEntryCount,
          averageAddPriceVsPreviousAverageEntryPct:
            input.averageAddPriceVsPreviousAverageEntryPct,
          averageAddPricePositionInRecentRangePct:
            input.averageAddPricePositionInRecentRangePct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minRangePosition,
          minAverageAddPct,
          maxGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const RECOVERY_WITH_ADD_INTO_STRENGTH_AND_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "recovery_with_add_into_strength_and_constructive_final_exit",
    name: "Recovery With Add Into Strength And Constructive Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minRangePosition =
        THRESHOLDS.SCALING_QUALITY.ADD_INTO_STRENGTH_MIN_RANGE_POSITION;
      const minAverageAddPct =
        THRESHOLDS.SCALING_QUALITY.ADD_INTO_STRENGTH_MIN_AVERAGE_PCT;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .BALANCED_WITH_PROFIT_PROTECTION_MAX_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.addCountAfterInitialEntry > 0 &&
        input.addAbovePreviousAverageEntryCount ===
          input.addCountAfterInitialEntry &&
        input.averageAddPriceVsPreviousAverageEntryPct !== null &&
        input.averageAddPriceVsPreviousAverageEntryPct >= minAverageAddPct &&
        input.averageAddPricePositionInRecentRangePct !== null &&
        input.averageAddPricePositionInRecentRangePct >= minRangePosition &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          realizedReturnPct: input.realizedReturnPct,
          addCountAfterInitialEntry: input.addCountAfterInitialEntry,
          addAbovePreviousAverageEntryCount:
            input.addAbovePreviousAverageEntryCount,
          averageAddPriceVsPreviousAverageEntryPct:
            input.averageAddPriceVsPreviousAverageEntryPct,
          averageAddPricePositionInRecentRangePct:
            input.averageAddPricePositionInRecentRangePct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minRangePosition,
          minAverageAddPct,
          maxGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const ADD_INTO_STRENGTH_WITH_TIMELY_PROFIT_PROTECTION_AND_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "add_into_strength_with_timely_profit_protection_and_constructive_final_exit",
    name: "Add Into Strength With Timely Profit Protection And Constructive Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minRangePosition =
        THRESHOLDS.SCALING_QUALITY.ADD_INTO_STRENGTH_MIN_RANGE_POSITION;
      const minAverageAddPct =
        THRESHOLDS.SCALING_QUALITY.ADD_INTO_STRENGTH_MIN_AVERAGE_PCT;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .BALANCED_WITH_PROFIT_PROTECTION_MAX_GIVEBACK_PCT;
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
        input.addCountAfterInitialEntry > 0 &&
        input.addAbovePreviousAverageEntryCount ===
          input.addCountAfterInitialEntry &&
        input.averageAddPriceVsPreviousAverageEntryPct !== null &&
        input.averageAddPriceVsPreviousAverageEntryPct >= minAverageAddPct &&
        input.averageAddPricePositionInRecentRangePct !== null &&
        input.averageAddPricePositionInRecentRangePct >= minRangePosition &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
        input.secondsFromPeakOpenProfitToFirstReduction !== null &&
        input.secondsFromPeakOpenProfitToFirstReduction <=
          maxSecondsToFirstReduction &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          addCountAfterInitialEntry: input.addCountAfterInitialEntry,
          addAbovePreviousAverageEntryCount:
            input.addAbovePreviousAverageEntryCount,
          averageAddPriceVsPreviousAverageEntryPct:
            input.averageAddPriceVsPreviousAverageEntryPct,
          averageAddPricePositionInRecentRangePct:
            input.averageAddPricePositionInRecentRangePct,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          hadReductionAfterPeakOpenProfitBeforeWorstDrawdown:
            input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown,
          secondsFromPeakOpenProfitToFirstReduction:
            input.secondsFromPeakOpenProfitToFirstReduction,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minRangePosition,
          minAverageAddPct,
          maxGivebackPct,
          maxSecondsToFirstReduction,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const ADD_INTO_STRENGTH_WITH_PREMATURE_FINAL_EXIT: PatternDefinition =
  {
    id: "add_into_strength_with_premature_final_exit",
    name: "Add Into Strength With Premature Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minRangePosition =
        THRESHOLDS.SCALING_QUALITY.ADD_INTO_STRENGTH_MIN_RANGE_POSITION;
      const minAverageAddPct =
        THRESHOLDS.SCALING_QUALITY.ADD_INTO_STRENGTH_MIN_AVERAGE_PCT;
      const maxGivebackPct =
        THRESHOLDS.EXIT_QUALITY.PREMATURE_FINAL_EXIT_MAX_GIVEBACK_PCT;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.addCountAfterInitialEntry > 0 &&
        input.addAbovePreviousAverageEntryCount ===
          input.addCountAfterInitialEntry &&
        input.averageAddPriceVsPreviousAverageEntryPct !== null &&
        input.averageAddPriceVsPreviousAverageEntryPct >= minAverageAddPct &&
        input.averageAddPricePositionInRecentRangePct !== null &&
        input.averageAddPricePositionInRecentRangePct >= minRangePosition &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          addCountAfterInitialEntry: input.addCountAfterInitialEntry,
          addAbovePreviousAverageEntryCount:
            input.addAbovePreviousAverageEntryCount,
          averageAddPriceVsPreviousAverageEntryPct:
            input.averageAddPriceVsPreviousAverageEntryPct,
          averageAddPricePositionInRecentRangePct:
            input.averageAddPricePositionInRecentRangePct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minRangePosition,
          minAverageAddPct,
          maxGivebackPct,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const RECOVERY_WITH_ADD_INTO_STRENGTH_AND_TIMELY_PROFIT_PROTECTION_AND_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "recovery_with_add_into_strength_and_timely_profit_protection_and_constructive_final_exit",
    name: "Recovery With Add Into Strength And Timely Profit Protection And Constructive Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minRangePosition =
        THRESHOLDS.SCALING_QUALITY.ADD_INTO_STRENGTH_MIN_RANGE_POSITION;
      const minAverageAddPct =
        THRESHOLDS.SCALING_QUALITY.ADD_INTO_STRENGTH_MIN_AVERAGE_PCT;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .BALANCED_WITH_PROFIT_PROTECTION_MAX_GIVEBACK_PCT;
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
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.addCountAfterInitialEntry > 0 &&
        input.addAbovePreviousAverageEntryCount ===
          input.addCountAfterInitialEntry &&
        input.averageAddPriceVsPreviousAverageEntryPct !== null &&
        input.averageAddPriceVsPreviousAverageEntryPct >= minAverageAddPct &&
        input.averageAddPricePositionInRecentRangePct !== null &&
        input.averageAddPricePositionInRecentRangePct >= minRangePosition &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
        input.secondsFromPeakOpenProfitToFirstReduction !== null &&
        input.secondsFromPeakOpenProfitToFirstReduction <=
          maxSecondsToFirstReduction &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          realizedReturnPct: input.realizedReturnPct,
          addCountAfterInitialEntry: input.addCountAfterInitialEntry,
          addAbovePreviousAverageEntryCount:
            input.addAbovePreviousAverageEntryCount,
          averageAddPriceVsPreviousAverageEntryPct:
            input.averageAddPriceVsPreviousAverageEntryPct,
          averageAddPricePositionInRecentRangePct:
            input.averageAddPricePositionInRecentRangePct,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          hadReductionAfterPeakOpenProfitBeforeWorstDrawdown:
            input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown,
          secondsFromPeakOpenProfitToFirstReduction:
            input.secondsFromPeakOpenProfitToFirstReduction,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minRangePosition,
          minAverageAddPct,
          maxGivebackPct,
          maxSecondsToFirstReduction,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const RECOVERY_WITH_ADD_INTO_STRENGTH_AND_PREMATURE_FINAL_EXIT: PatternDefinition =
  {
    id: "recovery_with_add_into_strength_and_premature_final_exit",
    name: "Recovery With Add Into Strength And Premature Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minRangePosition =
        THRESHOLDS.SCALING_QUALITY.ADD_INTO_STRENGTH_MIN_RANGE_POSITION;
      const minAverageAddPct =
        THRESHOLDS.SCALING_QUALITY.ADD_INTO_STRENGTH_MIN_AVERAGE_PCT;
      const maxGivebackPct =
        THRESHOLDS.EXIT_QUALITY.PREMATURE_FINAL_EXIT_MAX_GIVEBACK_PCT;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.addCountAfterInitialEntry > 0 &&
        input.addAbovePreviousAverageEntryCount ===
          input.addCountAfterInitialEntry &&
        input.averageAddPriceVsPreviousAverageEntryPct !== null &&
        input.averageAddPriceVsPreviousAverageEntryPct >= minAverageAddPct &&
        input.averageAddPricePositionInRecentRangePct !== null &&
        input.averageAddPricePositionInRecentRangePct >= minRangePosition &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          realizedReturnPct: input.realizedReturnPct,
          addCountAfterInitialEntry: input.addCountAfterInitialEntry,
          addAbovePreviousAverageEntryCount:
            input.addAbovePreviousAverageEntryCount,
          averageAddPriceVsPreviousAverageEntryPct:
            input.averageAddPriceVsPreviousAverageEntryPct,
          averageAddPricePositionInRecentRangePct:
            input.averageAddPricePositionInRecentRangePct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minRangePosition,
          minAverageAddPct,
          maxGivebackPct,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const ADD_INTO_STRENGTH_WITH_MISSED_FINAL_CONTINUATION: PatternDefinition =
  {
    id: "add_into_strength_with_missed_final_continuation",
    name: "Add Into Strength With Missed Final Continuation",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minRangePosition =
        THRESHOLDS.SCALING_QUALITY.ADD_INTO_STRENGTH_MIN_RANGE_POSITION;
      const minAverageAddPct =
        THRESHOLDS.SCALING_QUALITY.ADD_INTO_STRENGTH_MIN_AVERAGE_PCT;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.addCountAfterInitialEntry > 0 &&
        input.addAbovePreviousAverageEntryCount ===
          input.addCountAfterInitialEntry &&
        input.averageAddPriceVsPreviousAverageEntryPct !== null &&
        input.averageAddPriceVsPreviousAverageEntryPct >= minAverageAddPct &&
        input.averageAddPricePositionInRecentRangePct !== null &&
        input.averageAddPricePositionInRecentRangePct >= minRangePosition &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          addCountAfterInitialEntry: input.addCountAfterInitialEntry,
          addAbovePreviousAverageEntryCount:
            input.addAbovePreviousAverageEntryCount,
          averageAddPriceVsPreviousAverageEntryPct:
            input.averageAddPriceVsPreviousAverageEntryPct,
          averageAddPricePositionInRecentRangePct:
            input.averageAddPricePositionInRecentRangePct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minRangePosition,
          minAverageAddPct,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const RECOVERY_WITH_ADD_INTO_STRENGTH_AND_MISSED_FINAL_CONTINUATION: PatternDefinition =
  {
    id: "recovery_with_add_into_strength_and_missed_final_continuation",
    name: "Recovery With Add Into Strength And Missed Final Continuation",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minRangePosition =
        THRESHOLDS.SCALING_QUALITY.ADD_INTO_STRENGTH_MIN_RANGE_POSITION;
      const minAverageAddPct =
        THRESHOLDS.SCALING_QUALITY.ADD_INTO_STRENGTH_MIN_AVERAGE_PCT;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.addCountAfterInitialEntry > 0 &&
        input.addAbovePreviousAverageEntryCount ===
          input.addCountAfterInitialEntry &&
        input.averageAddPriceVsPreviousAverageEntryPct !== null &&
        input.averageAddPriceVsPreviousAverageEntryPct >= minAverageAddPct &&
        input.averageAddPricePositionInRecentRangePct !== null &&
        input.averageAddPricePositionInRecentRangePct >= minRangePosition &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          realizedReturnPct: input.realizedReturnPct,
          addCountAfterInitialEntry: input.addCountAfterInitialEntry,
          addAbovePreviousAverageEntryCount:
            input.addAbovePreviousAverageEntryCount,
          averageAddPriceVsPreviousAverageEntryPct:
            input.averageAddPriceVsPreviousAverageEntryPct,
          averageAddPricePositionInRecentRangePct:
            input.averageAddPricePositionInRecentRangePct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minRangePosition,
          minAverageAddPct,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const CONSTRUCTIVE_READD_AFTER_REDUCTION: PatternDefinition = {
  id: "constructive_readd_after_reduction",
  name: "Constructive Re-Add After Reduction",
  family: PATTERN_FAMILIES.SCALING_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const minRangePosition =
      THRESHOLDS.SCALING_QUALITY.ADD_INTO_STRENGTH_MIN_RANGE_POSITION;
    const minAverageAddPct =
      THRESHOLDS.SCALING_QUALITY.ADD_INTO_STRENGTH_MIN_AVERAGE_PCT;
    const maxGivebackPct =
      THRESHOLDS.SCALING_QUALITY.CONSTRUCTIVE_READD_MAX_GIVEBACK_PCT;

    const matched =
      input.hadReaddAfterReduction &&
      input.addAbovePreviousAverageEntryCount > 0 &&
      input.averageAddPriceVsPreviousAverageEntryPct !== null &&
      input.averageAddPriceVsPreviousAverageEntryPct >= minAverageAddPct &&
      input.averageAddPricePositionInRecentRangePct !== null &&
      input.averageAddPricePositionInRecentRangePct >= minRangePosition &&
      input.maxGivebackFromPeakOpenProfitPct !== null &&
      input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct;

    return {
      matched,
      evidence: {
        hadReaddAfterReduction: input.hadReaddAfterReduction,
        addAbovePreviousAverageEntryCount:
          input.addAbovePreviousAverageEntryCount,
        averageAddPriceVsPreviousAverageEntryPct:
          input.averageAddPriceVsPreviousAverageEntryPct,
        averageAddPricePositionInRecentRangePct:
          input.averageAddPricePositionInRecentRangePct,
        maxGivebackFromPeakOpenProfitPct:
          input.maxGivebackFromPeakOpenProfitPct,
      },
      thresholdsUsed: {
        minRangePosition,
        minAverageAddPct,
        maxGivebackPct,
      },
    };
  },
};

export const BALANCED_MANAGEMENT_WITH_CONSTRUCTIVE_EXIT: PatternDefinition = {
  id: "balanced_management_with_constructive_exit",
  name: "Balanced Management With Constructive Exit",
  family: PATTERN_FAMILIES.SCALING_QUALITY,
  patternType: "composite",
  structuralLevel: "storyline_composite",

  evaluate: (input) => {
    const maxAllowedGivebackPct =
      THRESHOLDS.SCALING_QUALITY.BALANCED_WITH_PROFIT_PROTECTION_MAX_GIVEBACK_PCT;
    const minAdversePct =
      THRESHOLDS.EXIT_QUALITY
        .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
    const maxNetEndPct =
      THRESHOLDS.EXIT_QUALITY
        .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

    const matched =
      input.addCountAfterInitialEntry > 0 &&
      input.totalPositionDecreaseCount > 0 &&
      input.maxGivebackFromPeakOpenProfitPct !== null &&
      input.maxGivebackFromPeakOpenProfitPct <= maxAllowedGivebackPct &&
      input.closedToFlat &&
      input.postExitCandleCount > 0 &&
      input.maxAdverseMovePctAfterExit !== null &&
      input.maxAdverseMovePctAfterExit >= minAdversePct &&
      input.netMovePctAtEndOfPostExitWindow !== null &&
      input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
      input.maxAdverseMovePctAfterExit >
        (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

    return {
      matched,
      evidence: {
        addCountAfterInitialEntry: input.addCountAfterInitialEntry,
        totalPositionDecreaseCount: input.totalPositionDecreaseCount,
        maxGivebackFromPeakOpenProfitPct:
          input.maxGivebackFromPeakOpenProfitPct,
        closedToFlat: input.closedToFlat,
        postExitCandleCount: input.postExitCandleCount,
        maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
        maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
        netMovePctAtEndOfPostExitWindow:
          input.netMovePctAtEndOfPostExitWindow,
      },
      thresholdsUsed: {
        maxAllowedGivebackPct,
        minAdversePct,
        maxNetEndPct,
      },
    };
  },
};

export const RECOVERY_WITH_BALANCED_MANAGEMENT_AND_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "recovery_with_balanced_management_and_constructive_final_exit",
    name: "Recovery With Balanced Management And Constructive Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const maxAllowedGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .BALANCED_WITH_PROFIT_PROTECTION_MAX_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.addCountAfterInitialEntry > 0 &&
        input.totalPositionDecreaseCount > 0 &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxAllowedGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          addCountAfterInitialEntry: input.addCountAfterInitialEntry,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          maxAllowedGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const BALANCED_MANAGEMENT_WITH_PREMATURE_FINAL_EXIT: PatternDefinition =
  {
    id: "balanced_management_with_premature_final_exit",
    name: "Balanced Management With Premature Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const maxGivebackPct =
        THRESHOLDS.EXIT_QUALITY.PREMATURE_FINAL_EXIT_MAX_GIVEBACK_PCT;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.addCountAfterInitialEntry > 0 &&
        input.totalPositionDecreaseCount > 0 &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          addCountAfterInitialEntry: input.addCountAfterInitialEntry,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          realizedReturnPct: input.realizedReturnPct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          maxGivebackPct,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const RECOVERY_WITH_BALANCED_MANAGEMENT_AND_PREMATURE_FINAL_EXIT: PatternDefinition =
  {
    id: "recovery_with_balanced_management_and_premature_final_exit",
    name: "Recovery With Balanced Management And Premature Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const maxGivebackPct =
        THRESHOLDS.EXIT_QUALITY.PREMATURE_FINAL_EXIT_MAX_GIVEBACK_PCT;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.addCountAfterInitialEntry > 0 &&
        input.totalPositionDecreaseCount > 0 &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          addCountAfterInitialEntry: input.addCountAfterInitialEntry,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          realizedReturnPct: input.realizedReturnPct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          maxGivebackPct,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const BALANCED_MANAGEMENT_WITH_MISSED_FINAL_CONTINUATION: PatternDefinition =
  {
    id: "balanced_management_with_missed_final_continuation",
    name: "Balanced Management With Missed Final Continuation",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.addCountAfterInitialEntry > 0 &&
        input.totalPositionDecreaseCount > 0 &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          addCountAfterInitialEntry: input.addCountAfterInitialEntry,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          realizedReturnPct: input.realizedReturnPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const RECOVERY_WITH_BALANCED_MANAGEMENT_AND_MISSED_FINAL_CONTINUATION: PatternDefinition =
  {
    id: "recovery_with_balanced_management_and_missed_final_continuation",
    name: "Recovery With Balanced Management And Missed Final Continuation",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.addCountAfterInitialEntry > 0 &&
        input.totalPositionDecreaseCount > 0 &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          addCountAfterInitialEntry: input.addCountAfterInitialEntry,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          realizedReturnPct: input.realizedReturnPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const BALANCED_MANAGEMENT_WITH_FEARFUL_FINAL_EXIT: PatternDefinition = {
  id: "balanced_management_with_fearful_final_exit",
  name: "Balanced Management With Fearful Final Exit",
  family: PATTERN_FAMILIES.SCALING_QUALITY,
  patternType: "composite",
  structuralLevel: "storyline_composite",

  evaluate: (input) => {
    const maxRealizedCapture =
      THRESHOLDS.EXIT_QUALITY.FEARFUL_EXIT_AFTER_WEAKENING_MAX_REALIZED_CAPTURE;
    const minFavorablePct =
      THRESHOLDS.EXIT_QUALITY
        .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
    const minNetEndPct =
      THRESHOLDS.EXIT_QUALITY.MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

    const matched =
      input.addCountAfterInitialEntry > 0 &&
      input.totalPositionDecreaseCount > 0 &&
      input.closedToFlat &&
      input.exitWasNearTradeLow &&
      input.realizedCapturePercentOfTradeMfe !== null &&
      input.realizedCapturePercentOfTradeMfe <= maxRealizedCapture &&
      input.postExitCandleCount > 0 &&
      input.maxFavorableMovePctAfterExit !== null &&
      input.maxFavorableMovePctAfterExit >= minFavorablePct &&
      input.netMovePctAtEndOfPostExitWindow !== null &&
      input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
      input.maxFavorableMovePctAfterExit >
        (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

    return {
      matched,
      evidence: {
        addCountAfterInitialEntry: input.addCountAfterInitialEntry,
        totalPositionDecreaseCount: input.totalPositionDecreaseCount,
        closedToFlat: input.closedToFlat,
        exitWasNearTradeLow: input.exitWasNearTradeLow,
        realizedCapturePercentOfTradeMfe:
          input.realizedCapturePercentOfTradeMfe,
        postExitCandleCount: input.postExitCandleCount,
        maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
        maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
        netMovePctAtEndOfPostExitWindow:
          input.netMovePctAtEndOfPostExitWindow,
      },
      thresholdsUsed: {
        maxRealizedCapture,
        minFavorablePct,
        minNetEndPct,
      },
    };
  },
};

export const RECOVERY_WITH_BALANCED_MANAGEMENT_AND_FEARFUL_FINAL_EXIT: PatternDefinition =
  {
    id: "recovery_with_balanced_management_and_fearful_final_exit",
    name: "Recovery With Balanced Management And Fearful Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const maxRealizedCapture =
        THRESHOLDS.EXIT_QUALITY
          .FEARFUL_EXIT_AFTER_WEAKENING_MAX_REALIZED_CAPTURE;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.addCountAfterInitialEntry > 0 &&
        input.totalPositionDecreaseCount > 0 &&
        input.closedToFlat &&
        input.exitWasNearTradeLow &&
        input.realizedCapturePercentOfTradeMfe !== null &&
        input.realizedCapturePercentOfTradeMfe <= maxRealizedCapture &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          addCountAfterInitialEntry: input.addCountAfterInitialEntry,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          closedToFlat: input.closedToFlat,
          exitWasNearTradeLow: input.exitWasNearTradeLow,
          realizedCapturePercentOfTradeMfe:
            input.realizedCapturePercentOfTradeMfe,
          postExitCandleCount: input.postExitCandleCount,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          maxRealizedCapture,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const BALANCED_MANAGEMENT_WITH_DEFENSIVE_FINAL_EXIT_AFTER_DETERIORATION: PatternDefinition =
  {
    id: "balanced_management_with_defensive_final_exit_after_deterioration",
    name: "Balanced Management With Defensive Final Exit After Deterioration",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
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

      const matched =
        input.addCountAfterInitialEntry > 0 &&
        input.totalPositionDecreaseCount > 0 &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          addCountAfterInitialEntry: input.addCountAfterInitialEntry,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          realizedReturnPct: input.realizedReturnPct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
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
        },
      };
    },
  };

export const RECOVERY_WITH_BALANCED_MANAGEMENT_AND_DEFENSIVE_FINAL_EXIT_AFTER_DETERIORATION: PatternDefinition =
  {
    id: "recovery_with_balanced_management_and_defensive_final_exit_after_deterioration",
    name: "Recovery With Balanced Management And Defensive Final Exit After Deterioration",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
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
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.addCountAfterInitialEntry > 0 &&
        input.totalPositionDecreaseCount > 0 &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          addCountAfterInitialEntry: input.addCountAfterInitialEntry,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          realizedReturnPct: input.realizedReturnPct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minAdversePct,
          maxNetEndPct,
          minGivebackPct,
        },
      };
    },
  };

export const BALANCED_MANAGEMENT_WITH_STOP_LIKE_FORCED_EXIT_AFTER_BREAKDOWN: PatternDefinition =
  {
    id: "balanced_management_with_stop_like_forced_exit_after_breakdown",
    name: "Balanced Management With Stop-Like Forced Exit After Breakdown",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
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
        input.addCountAfterInitialEntry > 0 &&
        input.totalPositionDecreaseCount > 0 &&
        input.closedToFlat &&
        input.exitWasNearTradeLow &&
        input.postExitCandleCount > 0 &&
        input.realizedCapturePercentOfTradeMfe !== null &&
        input.realizedCapturePercentOfTradeMfe <= maxRealizedCapture &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.drawdownFromPeakOpenProfitPctOfBasis !== null &&
        input.drawdownFromPeakOpenProfitPctOfBasis >= minDrawdownFromPeakPct &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          addCountAfterInitialEntry: input.addCountAfterInitialEntry,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          closedToFlat: input.closedToFlat,
          exitWasNearTradeLow: input.exitWasNearTradeLow,
          realizedCapturePercentOfTradeMfe:
            input.realizedCapturePercentOfTradeMfe,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          drawdownFromPeakOpenProfitPctOfBasis:
            input.drawdownFromPeakOpenProfitPctOfBasis,
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

export const BALANCED_MANAGEMENT_WITH_STOP_LIKE_FORCED_EXIT_BEFORE_REBOUND: PatternDefinition =
  {
    id: "balanced_management_with_stop_like_forced_exit_before_rebound",
    name: "Balanced Management With Stop-Like Forced Exit Before Rebound",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
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
        input.addCountAfterInitialEntry > 0 &&
        input.totalPositionDecreaseCount > 0 &&
        input.closedToFlat &&
        input.exitWasNearTradeLow &&
        input.postExitCandleCount > 0 &&
        input.realizedCapturePercentOfTradeMfe !== null &&
        input.realizedCapturePercentOfTradeMfe <= maxRealizedCapture &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.drawdownFromPeakOpenProfitPctOfBasis !== null &&
        input.drawdownFromPeakOpenProfitPctOfBasis >= minDrawdownFromPeakPct &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          addCountAfterInitialEntry: input.addCountAfterInitialEntry,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          closedToFlat: input.closedToFlat,
          exitWasNearTradeLow: input.exitWasNearTradeLow,
          realizedCapturePercentOfTradeMfe:
            input.realizedCapturePercentOfTradeMfe,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          drawdownFromPeakOpenProfitPctOfBasis:
            input.drawdownFromPeakOpenProfitPctOfBasis,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
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

export const RECOVERY_WITH_BALANCED_MANAGEMENT_AND_STOP_LIKE_FORCED_EXIT_AFTER_BREAKDOWN: PatternDefinition =
  {
    id: "recovery_with_balanced_management_and_stop_like_forced_exit_after_breakdown",
    name: "Recovery With Balanced Management And Stop-Like Forced Exit After Breakdown",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
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
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.addCountAfterInitialEntry > 0 &&
        input.totalPositionDecreaseCount > 0 &&
        input.closedToFlat &&
        input.exitWasNearTradeLow &&
        input.postExitCandleCount > 0 &&
        input.realizedCapturePercentOfTradeMfe !== null &&
        input.realizedCapturePercentOfTradeMfe <= maxRealizedCapture &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.drawdownFromPeakOpenProfitPctOfBasis !== null &&
        input.drawdownFromPeakOpenProfitPctOfBasis >= minDrawdownFromPeakPct &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          addCountAfterInitialEntry: input.addCountAfterInitialEntry,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          realizedReturnPct: input.realizedReturnPct,
          closedToFlat: input.closedToFlat,
          exitWasNearTradeLow: input.exitWasNearTradeLow,
          realizedCapturePercentOfTradeMfe:
            input.realizedCapturePercentOfTradeMfe,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          drawdownFromPeakOpenProfitPctOfBasis:
            input.drawdownFromPeakOpenProfitPctOfBasis,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minAdversePct,
          maxNetEndPct,
          minGivebackPct,
          maxRealizedCapture,
          minDrawdownFromPeakPct,
        },
      };
    },
  };

export const RECOVERY_WITH_BALANCED_MANAGEMENT_AND_STOP_LIKE_FORCED_EXIT_BEFORE_REBOUND: PatternDefinition =
  {
    id: "recovery_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    name: "Recovery With Balanced Management And Stop-Like Forced Exit Before Rebound",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
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
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.addCountAfterInitialEntry > 0 &&
        input.totalPositionDecreaseCount > 0 &&
        input.closedToFlat &&
        input.exitWasNearTradeLow &&
        input.postExitCandleCount > 0 &&
        input.realizedCapturePercentOfTradeMfe !== null &&
        input.realizedCapturePercentOfTradeMfe <= maxRealizedCapture &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.drawdownFromPeakOpenProfitPctOfBasis !== null &&
        input.drawdownFromPeakOpenProfitPctOfBasis >= minDrawdownFromPeakPct &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          addCountAfterInitialEntry: input.addCountAfterInitialEntry,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          realizedReturnPct: input.realizedReturnPct,
          closedToFlat: input.closedToFlat,
          exitWasNearTradeLow: input.exitWasNearTradeLow,
          realizedCapturePercentOfTradeMfe:
            input.realizedCapturePercentOfTradeMfe,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          drawdownFromPeakOpenProfitPctOfBasis:
            input.drawdownFromPeakOpenProfitPctOfBasis,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minFavorablePct,
          minNetEndPct,
          minGivebackPct,
          maxRealizedCapture,
          minDrawdownFromPeakPct,
        },
      };
    },
  };

export const TRIM_INTO_STRENGTH_WITH_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "trim_into_strength_with_constructive_final_exit",
    name: "Trim Into Strength With Constructive Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minAverageReductionPct =
        THRESHOLDS.POSITION_REDUCTION.ABOVE_BASIS_MIN_AVERAGE_PCT;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .BALANCED_WITH_PROFIT_PROTECTION_MAX_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.hadPartialExit &&
        input.totalPositionDecreaseCount > 0 &&
        input.reductionsNearRecentHighCount > 0 &&
        input.averageReductionPriceVsPreviousAverageEntryPct !== null &&
        input.averageReductionPriceVsPreviousAverageEntryPct >=
          minAverageReductionPct &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadPartialExit: input.hadPartialExit,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          reductionsNearRecentHighCount: input.reductionsNearRecentHighCount,
          averageReductionPriceVsPreviousAverageEntryPct:
            input.averageReductionPriceVsPreviousAverageEntryPct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minAverageReductionPct,
          maxGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const TRIM_INTO_STRENGTH_WITH_PREMATURE_FINAL_EXIT: PatternDefinition =
  {
    id: "trim_into_strength_with_premature_final_exit",
    name: "Trim Into Strength With Premature Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minAverageReductionPct =
        THRESHOLDS.POSITION_REDUCTION.ABOVE_BASIS_MIN_AVERAGE_PCT;
      const maxGivebackPct =
        THRESHOLDS.EXIT_QUALITY.PREMATURE_FINAL_EXIT_MAX_GIVEBACK_PCT;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.hadPartialExit &&
        input.totalPositionDecreaseCount > 0 &&
        input.reductionsNearRecentHighCount > 0 &&
        input.averageReductionPriceVsPreviousAverageEntryPct !== null &&
        input.averageReductionPriceVsPreviousAverageEntryPct >=
          minAverageReductionPct &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadPartialExit: input.hadPartialExit,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          reductionsNearRecentHighCount: input.reductionsNearRecentHighCount,
          averageReductionPriceVsPreviousAverageEntryPct:
            input.averageReductionPriceVsPreviousAverageEntryPct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minAverageReductionPct,
          maxGivebackPct,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const TIMELY_PROFIT_PROTECTION_WITH_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "timely_profit_protection_with_constructive_final_exit",
    name: "Timely Profit Protection With Constructive Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .BALANCED_WITH_PROFIT_PROTECTION_MAX_GIVEBACK_PCT;
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
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
        input.secondsFromPeakOpenProfitToFirstReduction !== null &&
        input.secondsFromPeakOpenProfitToFirstReduction <=
          maxSecondsToFirstReduction &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
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
          hadReductionAfterPeakOpenProfitBeforeWorstDrawdown:
            input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown,
          secondsFromPeakOpenProfitToFirstReduction:
            input.secondsFromPeakOpenProfitToFirstReduction,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          maxGivebackPct,
          maxSecondsToFirstReduction,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const TIMELY_PROFIT_PROTECTION_WITH_PREMATURE_FINAL_EXIT: PatternDefinition =
  {
    id: "timely_profit_protection_with_premature_final_exit",
    name: "Timely Profit Protection With Premature Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
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
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
        input.secondsFromPeakOpenProfitToFirstReduction !== null &&
        input.secondsFromPeakOpenProfitToFirstReduction <=
          maxSecondsToFirstReduction &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
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
          hadReductionAfterPeakOpenProfitBeforeWorstDrawdown:
            input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown,
          secondsFromPeakOpenProfitToFirstReduction:
            input.secondsFromPeakOpenProfitToFirstReduction,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          maxGivebackPct,
          maxSecondsToFirstReduction,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const TIMELY_RISK_RESPONSE_WITH_DEFENSIVE_FINAL_EXIT_AFTER_DETERIORATION: PatternDefinition =
  {
    id: "timely_risk_response_with_defensive_final_exit_after_deterioration",
    name: "Timely Risk Response With Defensive Final Exit After Deterioration",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const maxSecondsToFirstReduction =
        THRESHOLDS.POSITION_REDUCTION
          .TIMELY_RISK_RESPONSE_MAX_SECONDS_TO_FIRST_REDUCTION;
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
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
        input.secondsFromPeakOpenProfitToFirstReduction !== null &&
        input.secondsFromPeakOpenProfitToFirstReduction <=
          maxSecondsToFirstReduction &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
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
          hadReductionAfterPeakOpenProfitBeforeWorstDrawdown:
            input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown,
          secondsFromPeakOpenProfitToFirstReduction:
            input.secondsFromPeakOpenProfitToFirstReduction,
          realizedReturnPct: input.realizedReturnPct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          maxSecondsToFirstReduction,
          minAdversePct,
          maxNetEndPct,
          minGivebackPct,
        },
      };
    },
  };

export const TIMELY_RISK_RESPONSE_WITH_STOP_LIKE_FORCED_EXIT_AFTER_BREAKDOWN: PatternDefinition =
  {
    id: "timely_risk_response_with_stop_like_forced_exit_after_breakdown",
    name: "Timely Risk Response With Stop-Like Forced Exit After Breakdown",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minDrawdownFromPeakPctOfBasis =
        THRESHOLDS.POSITION_REDUCTION
          .DELAYED_RISK_RESPONSE_MIN_DRAWDOWN_FROM_PEAK_PCT_OF_BASIS;
      const maxSecondsToFirstReduction =
        THRESHOLDS.POSITION_REDUCTION
          .TIMELY_RISK_RESPONSE_MAX_SECONDS_TO_FIRST_REDUCTION;
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
      const minStopLikeDrawdownPctOfBasis =
        THRESHOLDS.EXIT_QUALITY
          .STOP_LIKE_FORCED_EXIT_MIN_DRAWDOWN_FROM_PEAK_PCT_OF_BASIS;

      const matched =
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.drawdownFromPeakOpenProfitPctOfBasis !== null &&
        input.drawdownFromPeakOpenProfitPctOfBasis >=
          minDrawdownFromPeakPctOfBasis &&
        input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
        input.secondsFromPeakOpenProfitToFirstReduction !== null &&
        input.secondsFromPeakOpenProfitToFirstReduction <
          maxSecondsToFirstReduction &&
        input.closedToFlat &&
        input.totalPositionDecreaseCount > 0 &&
        input.exitWasNearTradeLow &&
        input.postExitCandleCount > 0 &&
        input.realizedCapturePercentOfTradeMfe !== null &&
        input.realizedCapturePercentOfTradeMfe <= maxRealizedCapture &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.drawdownFromPeakOpenProfitPctOfBasis >=
          minStopLikeDrawdownPctOfBasis &&
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
          minDrawdownFromPeakPctOfBasis,
          maxSecondsToFirstReduction,
          minAdversePct,
          maxNetEndPct,
          minGivebackPct,
          maxRealizedCapture,
          minStopLikeDrawdownPctOfBasis,
        },
      };
    },
  };

export const TIMELY_RISK_RESPONSE_WITH_STOP_LIKE_FORCED_EXIT_BEFORE_REBOUND: PatternDefinition =
  {
    id: "timely_risk_response_with_stop_like_forced_exit_before_rebound",
    name: "Timely Risk Response With Stop-Like Forced Exit Before Rebound",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minDrawdownFromPeakPctOfBasis =
        THRESHOLDS.POSITION_REDUCTION
          .DELAYED_RISK_RESPONSE_MIN_DRAWDOWN_FROM_PEAK_PCT_OF_BASIS;
      const maxSecondsToFirstReduction =
        THRESHOLDS.POSITION_REDUCTION
          .TIMELY_RISK_RESPONSE_MAX_SECONDS_TO_FIRST_REDUCTION;
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
      const minStopLikeDrawdownPctOfBasis =
        THRESHOLDS.EXIT_QUALITY
          .STOP_LIKE_FORCED_EXIT_MIN_DRAWDOWN_FROM_PEAK_PCT_OF_BASIS;

      const matched =
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.drawdownFromPeakOpenProfitPctOfBasis !== null &&
        input.drawdownFromPeakOpenProfitPctOfBasis >=
          minDrawdownFromPeakPctOfBasis &&
        input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
        input.secondsFromPeakOpenProfitToFirstReduction !== null &&
        input.secondsFromPeakOpenProfitToFirstReduction <
          maxSecondsToFirstReduction &&
        input.closedToFlat &&
        input.totalPositionDecreaseCount > 0 &&
        input.exitWasNearTradeLow &&
        input.postExitCandleCount > 0 &&
        input.realizedCapturePercentOfTradeMfe !== null &&
        input.realizedCapturePercentOfTradeMfe <= maxRealizedCapture &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.drawdownFromPeakOpenProfitPctOfBasis >=
          minStopLikeDrawdownPctOfBasis &&
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
          minDrawdownFromPeakPctOfBasis,
          maxSecondsToFirstReduction,
          minFavorablePct,
          minNetEndPct,
          minGivebackPct,
          maxRealizedCapture,
          minStopLikeDrawdownPctOfBasis,
        },
      };
    },
  };

export const RECOVERY_WITH_TRIM_INTO_STRENGTH_AND_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "recovery_with_trim_into_strength_and_constructive_final_exit",
    name: "Recovery With Trim Into Strength And Constructive Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minAverageReductionPct =
        THRESHOLDS.POSITION_REDUCTION.ABOVE_BASIS_MIN_AVERAGE_PCT;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .BALANCED_WITH_PROFIT_PROTECTION_MAX_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.hadPartialExit &&
        input.totalPositionDecreaseCount > 0 &&
        input.reductionsNearRecentHighCount > 0 &&
        input.averageReductionPriceVsPreviousAverageEntryPct !== null &&
        input.averageReductionPriceVsPreviousAverageEntryPct >=
          minAverageReductionPct &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          realizedReturnPct: input.realizedReturnPct,
          hadPartialExit: input.hadPartialExit,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          reductionsNearRecentHighCount: input.reductionsNearRecentHighCount,
          averageReductionPriceVsPreviousAverageEntryPct:
            input.averageReductionPriceVsPreviousAverageEntryPct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minAverageReductionPct,
          maxGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const RECOVERY_WITH_TRIM_INTO_STRENGTH_AND_PREMATURE_FINAL_EXIT: PatternDefinition =
  {
    id: "recovery_with_trim_into_strength_and_premature_final_exit",
    name: "Recovery With Trim Into Strength And Premature Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minAverageReductionPct =
        THRESHOLDS.POSITION_REDUCTION.ABOVE_BASIS_MIN_AVERAGE_PCT;
      const maxGivebackPct =
        THRESHOLDS.EXIT_QUALITY.PREMATURE_FINAL_EXIT_MAX_GIVEBACK_PCT;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.hadPartialExit &&
        input.totalPositionDecreaseCount > 0 &&
        input.reductionsNearRecentHighCount > 0 &&
        input.averageReductionPriceVsPreviousAverageEntryPct !== null &&
        input.averageReductionPriceVsPreviousAverageEntryPct >=
          minAverageReductionPct &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          realizedReturnPct: input.realizedReturnPct,
          hadPartialExit: input.hadPartialExit,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          reductionsNearRecentHighCount: input.reductionsNearRecentHighCount,
          averageReductionPriceVsPreviousAverageEntryPct:
            input.averageReductionPriceVsPreviousAverageEntryPct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minAverageReductionPct,
          maxGivebackPct,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const TIMELY_TRIM_INTO_STRENGTH_WITH_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "timely_trim_into_strength_with_constructive_final_exit",
    name: "Timely Trim Into Strength With Constructive Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minAverageReductionPct =
        THRESHOLDS.POSITION_REDUCTION.ABOVE_BASIS_MIN_AVERAGE_PCT;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .BALANCED_WITH_PROFIT_PROTECTION_MAX_GIVEBACK_PCT;
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
        input.hadPartialExit &&
        input.totalPositionDecreaseCount > 0 &&
        input.reductionsNearRecentHighCount > 0 &&
        input.averageReductionPriceVsPreviousAverageEntryPct !== null &&
        input.averageReductionPriceVsPreviousAverageEntryPct >=
          minAverageReductionPct &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
        input.secondsFromPeakOpenProfitToFirstReduction !== null &&
        input.secondsFromPeakOpenProfitToFirstReduction <=
          maxSecondsToFirstReduction &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadPartialExit: input.hadPartialExit,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          reductionsNearRecentHighCount: input.reductionsNearRecentHighCount,
          averageReductionPriceVsPreviousAverageEntryPct:
            input.averageReductionPriceVsPreviousAverageEntryPct,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          hadReductionAfterPeakOpenProfitBeforeWorstDrawdown:
            input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown,
          secondsFromPeakOpenProfitToFirstReduction:
            input.secondsFromPeakOpenProfitToFirstReduction,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minAverageReductionPct,
          maxGivebackPct,
          maxSecondsToFirstReduction,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const RECOVERY_WITH_TIMELY_TRIM_INTO_STRENGTH_AND_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "recovery_with_timely_trim_into_strength_and_constructive_final_exit",
    name: "Recovery With Timely Trim Into Strength And Constructive Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minAverageReductionPct =
        THRESHOLDS.POSITION_REDUCTION.ABOVE_BASIS_MIN_AVERAGE_PCT;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .BALANCED_WITH_PROFIT_PROTECTION_MAX_GIVEBACK_PCT;
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
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.hadPartialExit &&
        input.totalPositionDecreaseCount > 0 &&
        input.reductionsNearRecentHighCount > 0 &&
        input.averageReductionPriceVsPreviousAverageEntryPct !== null &&
        input.averageReductionPriceVsPreviousAverageEntryPct >=
          minAverageReductionPct &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
        input.secondsFromPeakOpenProfitToFirstReduction !== null &&
        input.secondsFromPeakOpenProfitToFirstReduction <=
          maxSecondsToFirstReduction &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          realizedReturnPct: input.realizedReturnPct,
          hadPartialExit: input.hadPartialExit,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          reductionsNearRecentHighCount: input.reductionsNearRecentHighCount,
          averageReductionPriceVsPreviousAverageEntryPct:
            input.averageReductionPriceVsPreviousAverageEntryPct,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          hadReductionAfterPeakOpenProfitBeforeWorstDrawdown:
            input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown,
          secondsFromPeakOpenProfitToFirstReduction:
            input.secondsFromPeakOpenProfitToFirstReduction,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minAverageReductionPct,
          maxGivebackPct,
          maxSecondsToFirstReduction,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const RECOVERY_WITH_TIMELY_PROFIT_PROTECTION_AND_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "recovery_with_timely_profit_protection_and_constructive_final_exit",
    name: "Recovery With Timely Profit Protection And Constructive Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .BALANCED_WITH_PROFIT_PROTECTION_MAX_GIVEBACK_PCT;
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
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
        input.secondsFromPeakOpenProfitToFirstReduction !== null &&
        input.secondsFromPeakOpenProfitToFirstReduction <=
          maxSecondsToFirstReduction &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          hadReductionAfterPeakOpenProfitBeforeWorstDrawdown:
            input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown,
          secondsFromPeakOpenProfitToFirstReduction:
            input.secondsFromPeakOpenProfitToFirstReduction,
          realizedReturnPct: input.realizedReturnPct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
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

export const RECOVERY_WITH_TIMELY_PROFIT_PROTECTION_AND_PREMATURE_FINAL_EXIT: PatternDefinition =
  {
    id: "recovery_with_timely_profit_protection_and_premature_final_exit",
    name: "Recovery With Timely Profit Protection And Premature Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
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
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
        input.secondsFromPeakOpenProfitToFirstReduction !== null &&
        input.secondsFromPeakOpenProfitToFirstReduction <=
          maxSecondsToFirstReduction &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          hadReductionAfterPeakOpenProfitBeforeWorstDrawdown:
            input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown,
          secondsFromPeakOpenProfitToFirstReduction:
            input.secondsFromPeakOpenProfitToFirstReduction,
          realizedReturnPct: input.realizedReturnPct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
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

export const RECOVERY_WITH_TIMELY_RISK_RESPONSE_AND_DEFENSIVE_FINAL_EXIT_AFTER_DETERIORATION: PatternDefinition =
  {
    id: "recovery_with_timely_risk_response_and_defensive_final_exit_after_deterioration",
    name: "Recovery With Timely Risk Response And Defensive Final Exit After Deterioration",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const maxSecondsToFirstReduction =
        THRESHOLDS.POSITION_REDUCTION
          .TIMELY_RISK_RESPONSE_MAX_SECONDS_TO_FIRST_REDUCTION;
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
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
        input.secondsFromPeakOpenProfitToFirstReduction !== null &&
        input.secondsFromPeakOpenProfitToFirstReduction <=
          maxSecondsToFirstReduction &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          hadReductionAfterPeakOpenProfitBeforeWorstDrawdown:
            input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown,
          secondsFromPeakOpenProfitToFirstReduction:
            input.secondsFromPeakOpenProfitToFirstReduction,
          realizedReturnPct: input.realizedReturnPct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          maxSecondsToFirstReduction,
          minAdversePct,
          maxNetEndPct,
          minGivebackPct,
        },
      };
    },
  };

export const RECOVERY_WITH_TIMELY_RISK_RESPONSE_AND_STOP_LIKE_FORCED_EXIT_AFTER_BREAKDOWN: PatternDefinition =
  {
    id: "recovery_with_timely_risk_response_and_stop_like_forced_exit_after_breakdown",
    name: "Recovery With Timely Risk Response And Stop-Like Forced Exit After Breakdown",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minDrawdownFromPeakPctOfBasis =
        THRESHOLDS.POSITION_REDUCTION
          .DELAYED_RISK_RESPONSE_MIN_DRAWDOWN_FROM_PEAK_PCT_OF_BASIS;
      const maxSecondsToFirstReduction =
        THRESHOLDS.POSITION_REDUCTION
          .TIMELY_RISK_RESPONSE_MAX_SECONDS_TO_FIRST_REDUCTION;
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
      const minStopLikeDrawdownPctOfBasis =
        THRESHOLDS.EXIT_QUALITY
          .STOP_LIKE_FORCED_EXIT_MIN_DRAWDOWN_FROM_PEAK_PCT_OF_BASIS;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.drawdownFromPeakOpenProfitPctOfBasis !== null &&
        input.drawdownFromPeakOpenProfitPctOfBasis >=
          minDrawdownFromPeakPctOfBasis &&
        input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
        input.secondsFromPeakOpenProfitToFirstReduction !== null &&
        input.secondsFromPeakOpenProfitToFirstReduction <
          maxSecondsToFirstReduction &&
        input.closedToFlat &&
        input.totalPositionDecreaseCount > 0 &&
        input.exitWasNearTradeLow &&
        input.postExitCandleCount > 0 &&
        input.realizedCapturePercentOfTradeMfe !== null &&
        input.realizedCapturePercentOfTradeMfe <= maxRealizedCapture &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.drawdownFromPeakOpenProfitPctOfBasis >=
          minStopLikeDrawdownPctOfBasis &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          realizedReturnPct: input.realizedReturnPct,
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
          minPeakOpenProfitPctOfBasis,
          minDrawdownFromPeakPctOfBasis,
          maxSecondsToFirstReduction,
          minAdversePct,
          maxNetEndPct,
          minGivebackPct,
          maxRealizedCapture,
          minStopLikeDrawdownPctOfBasis,
        },
      };
    },
  };

export const RECOVERY_WITH_TIMELY_RISK_RESPONSE_AND_STOP_LIKE_FORCED_EXIT_BEFORE_REBOUND: PatternDefinition =
  {
    id: "recovery_with_timely_risk_response_and_stop_like_forced_exit_before_rebound",
    name: "Recovery With Timely Risk Response And Stop-Like Forced Exit Before Rebound",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minDrawdownFromPeakPctOfBasis =
        THRESHOLDS.POSITION_REDUCTION
          .DELAYED_RISK_RESPONSE_MIN_DRAWDOWN_FROM_PEAK_PCT_OF_BASIS;
      const maxSecondsToFirstReduction =
        THRESHOLDS.POSITION_REDUCTION
          .TIMELY_RISK_RESPONSE_MAX_SECONDS_TO_FIRST_REDUCTION;
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
      const minStopLikeDrawdownPctOfBasis =
        THRESHOLDS.EXIT_QUALITY
          .STOP_LIKE_FORCED_EXIT_MIN_DRAWDOWN_FROM_PEAK_PCT_OF_BASIS;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.drawdownFromPeakOpenProfitPctOfBasis !== null &&
        input.drawdownFromPeakOpenProfitPctOfBasis >=
          minDrawdownFromPeakPctOfBasis &&
        input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
        input.secondsFromPeakOpenProfitToFirstReduction !== null &&
        input.secondsFromPeakOpenProfitToFirstReduction <
          maxSecondsToFirstReduction &&
        input.closedToFlat &&
        input.totalPositionDecreaseCount > 0 &&
        input.exitWasNearTradeLow &&
        input.postExitCandleCount > 0 &&
        input.realizedCapturePercentOfTradeMfe !== null &&
        input.realizedCapturePercentOfTradeMfe <= maxRealizedCapture &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.drawdownFromPeakOpenProfitPctOfBasis >=
          minStopLikeDrawdownPctOfBasis &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          realizedReturnPct: input.realizedReturnPct,
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
          minPeakOpenProfitPctOfBasis,
          minDrawdownFromPeakPctOfBasis,
          maxSecondsToFirstReduction,
          minFavorablePct,
          minNetEndPct,
          minGivebackPct,
          maxRealizedCapture,
          minStopLikeDrawdownPctOfBasis,
        },
      };
    },
  };

export const TRIM_READD_WITH_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition = {
  id: "trim_readd_with_constructive_final_exit",
  name: "Trim Re-Add With Constructive Final Exit",
  family: PATTERN_FAMILIES.SCALING_QUALITY,
  patternType: "composite",
  structuralLevel: "storyline_composite",

  evaluate: (input) => {
    const maxAllowedGivebackPct =
      THRESHOLDS.SCALING_QUALITY.BALANCED_WITH_PROFIT_PROTECTION_MAX_GIVEBACK_PCT;
    const minAdversePct =
      THRESHOLDS.EXIT_QUALITY
        .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
    const maxNetEndPct =
      THRESHOLDS.EXIT_QUALITY
        .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

    const matched =
      input.hadPartialExit &&
      input.hadReaddAfterReduction &&
      input.closedToFlat &&
      input.maxGivebackFromPeakOpenProfitPct !== null &&
      input.maxGivebackFromPeakOpenProfitPct <= maxAllowedGivebackPct &&
      input.postExitCandleCount > 0 &&
      input.maxAdverseMovePctAfterExit !== null &&
      input.maxAdverseMovePctAfterExit >= minAdversePct &&
      input.netMovePctAtEndOfPostExitWindow !== null &&
      input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
      input.maxAdverseMovePctAfterExit >
        (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

    return {
      matched,
      evidence: {
        hadPartialExit: input.hadPartialExit,
        hadReaddAfterReduction: input.hadReaddAfterReduction,
        closedToFlat: input.closedToFlat,
        maxGivebackFromPeakOpenProfitPct:
          input.maxGivebackFromPeakOpenProfitPct,
        postExitCandleCount: input.postExitCandleCount,
        maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
        maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
        netMovePctAtEndOfPostExitWindow:
          input.netMovePctAtEndOfPostExitWindow,
      },
      thresholdsUsed: {
        maxAllowedGivebackPct,
        minAdversePct,
        maxNetEndPct,
      },
    };
  },
};

export const TRIM_READD_WITH_MISSED_FINAL_CONTINUATION: PatternDefinition = {
  id: "trim_readd_with_missed_final_continuation",
  name: "Trim Re-Add With Missed Final Continuation",
  family: PATTERN_FAMILIES.SCALING_QUALITY,
  patternType: "composite",
  structuralLevel: "storyline_composite",

  evaluate: (input) => {
    const minFavorablePct =
      THRESHOLDS.EXIT_QUALITY.MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
    const minNetEndPct =
      THRESHOLDS.EXIT_QUALITY.MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

    const matched =
      input.hadPartialExit &&
      input.hadReaddAfterReduction &&
      input.closedToFlat &&
      input.postExitCandleCount > 0 &&
      input.maxFavorableMovePctAfterExit !== null &&
      input.maxFavorableMovePctAfterExit >= minFavorablePct &&
      input.netMovePctAtEndOfPostExitWindow !== null &&
      input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
      input.maxFavorableMovePctAfterExit >
        (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

    return {
      matched,
      evidence: {
        hadPartialExit: input.hadPartialExit,
        hadReaddAfterReduction: input.hadReaddAfterReduction,
        closedToFlat: input.closedToFlat,
        postExitCandleCount: input.postExitCandleCount,
        maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
        maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
        netMovePctAtEndOfPostExitWindow:
          input.netMovePctAtEndOfPostExitWindow,
      },
      thresholdsUsed: {
        minFavorablePct,
        minNetEndPct,
      },
    };
  },
};

export const CONSTRUCTIVE_RECOVERY_AFTER_EARLY_ADVERSITY: PatternDefinition = {
  id: "constructive_recovery_after_early_adversity",
  name: "Constructive Recovery After Early Adversity",
  family: PATTERN_FAMILIES.SCALING_QUALITY,
  patternType: "composite",
  structuralLevel: "storyline_composite",

  evaluate: (input) => {
    const minPeakOpenProfitPctOfBasis =
      THRESHOLDS.SCALING_QUALITY
        .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
    const maxGivebackPct =
      THRESHOLDS.SCALING_QUALITY.CONSTRUCTIVE_RECOVERY_MAX_GIVEBACK_PCT;

    const matched =
      input.hadOpenLossBeforePeakOpenProfit &&
      input.peakOpenProfitPctOfBasis !== null &&
      input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
      input.realizedReturnPct !== null &&
      input.realizedReturnPct > 0 &&
      input.maxGivebackFromPeakOpenProfitPct !== null &&
      input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct;

    return {
      matched,
      evidence: {
        hadOpenLossBeforePeakOpenProfit: input.hadOpenLossBeforePeakOpenProfit,
        secondsFromFirstOpenLossToPeakOpenProfit:
          input.secondsFromFirstOpenLossToPeakOpenProfit,
        peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
        realizedReturnPct: input.realizedReturnPct,
        maxGivebackFromPeakOpenProfitPct:
          input.maxGivebackFromPeakOpenProfitPct,
      },
      thresholdsUsed: {
        minPeakOpenProfitPctOfBasis,
        maxGivebackPct,
      },
    };
  },
};

export const RECOVERY_AFTER_EARLY_ADVERSITY_WITH_FAILED_PROTECTION: PatternDefinition =
  {
    id: "recovery_after_early_adversity_with_failed_protection",
    name: "Recovery After Early Adversity With Failed Protection",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .RECOVERY_FAILED_PROTECTION_MIN_GIVEBACK_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct;

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          secondsFromFirstOpenLossToPeakOpenProfit:
            input.secondsFromFirstOpenLossToPeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minGivebackPct,
        },
      };
    },
  };

export const RECOVERY_AFTER_EARLY_ADVERSITY_WITH_STABILIZED_MANAGEMENT: PatternDefinition =
  {
    id: "recovery_after_early_adversity_with_stabilized_management",
    name: "Recovery After Early Adversity With Stabilized Management",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY.CONSTRUCTIVE_RECOVERY_MAX_GIVEBACK_PCT;
      const maxSecondsToFirstReduction =
        THRESHOLDS.POSITION_REDUCTION
          .TIMELY_RISK_RESPONSE_MAX_SECONDS_TO_FIRST_REDUCTION;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
        input.secondsFromPeakOpenProfitToFirstReduction !== null &&
        input.secondsFromPeakOpenProfitToFirstReduction <=
          maxSecondsToFirstReduction &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct;

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          hadReductionAfterPeakOpenProfitBeforeWorstDrawdown:
            input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown,
          secondsFromPeakOpenProfitToFirstReduction:
            input.secondsFromPeakOpenProfitToFirstReduction,
          realizedReturnPct: input.realizedReturnPct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          maxGivebackPct,
          maxSecondsToFirstReduction,
        },
      };
    },
  };

export const REPEATED_TRIM_READD_WITH_CONSTRUCTIVE_MANAGEMENT: PatternDefinition =
  {
    id: "repeated_trim_readd_with_constructive_management",
    name: "Repeated Trim Re-Add With Constructive Management",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .MULTI_CYCLE_CONSTRUCTIVE_MAX_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.closedToFlat &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          maxGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const REPEATED_TRIM_READD_WITH_UNSTABLE_MANAGEMENT: PatternDefinition = {
  id: "repeated_trim_readd_with_unstable_management",
  name: "Repeated Trim Re-Add With Unstable Management",
  family: PATTERN_FAMILIES.SCALING_QUALITY,
  patternType: "composite",
  structuralLevel: "storyline_composite",

  evaluate: (input) => {
    const minPartialExits =
      THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
    const minReadds =
      THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
    const minGivebackPct =
      THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_UNSTABLE_MIN_GIVEBACK_PCT;

    const matched =
      input.partialExitCount >= minPartialExits &&
      input.readdAfterReductionCount >= minReadds &&
      input.maxGivebackFromPeakOpenProfitPct !== null &&
      input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct;

    return {
      matched,
      evidence: {
        partialExitCount: input.partialExitCount,
        readdAfterReductionCount: input.readdAfterReductionCount,
        maxGivebackFromPeakOpenProfitPct:
          input.maxGivebackFromPeakOpenProfitPct,
      },
      thresholdsUsed: {
        minPartialExits,
        minReadds,
        minGivebackPct,
      },
    };
  },
};

export const REPEATED_RESCUE_ATTEMPTS_WITH_RENEWED_DETERIORATION: PatternDefinition =
  {
    id: "repeated_rescue_attempts_with_renewed_deterioration",
    name: "Repeated Rescue Attempts With Renewed Deterioration",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minGivebackPct =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_UNSTABLE_MIN_GIVEBACK_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct;

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          minPeakOpenProfitPctOfBasis,
          minGivebackPct,
        },
      };
    },
  };

export const LATE_CHASE_REENTRY_AFTER_CONSTRUCTIVE_TRIM: PatternDefinition = {
  id: "late_chase_reentry_after_constructive_trim",
  name: "Late Chase Re-Entry After Constructive Trim",
  family: PATTERN_FAMILIES.SCALING_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const minReaddRunUpCount =
      THRESHOLDS.SCALING_QUALITY.LATE_CHASE_REENTRY_MIN_READD_RUN_UP_COUNT;
    const minFavorableMoveAfterTrimPct =
      THRESHOLDS.SCALING_QUALITY
        .LATE_CHASE_REENTRY_MIN_FAVORABLE_MOVE_AFTER_TRIM_PCT;

    const matched =
      input.hadPartialExit &&
      input.hadReaddAfterReduction &&
      input.readdsAfterRecentRunUpCount >= minReaddRunUpCount &&
      input.averageFavorableMovePctAfterPartialExitBeforeReadd !== null &&
      input.averageFavorableMovePctAfterPartialExitBeforeReadd >=
        minFavorableMoveAfterTrimPct;

    return {
      matched,
      evidence: {
        hadPartialExit: input.hadPartialExit,
        hadReaddAfterReduction: input.hadReaddAfterReduction,
        readdsAfterRecentRunUpCount: input.readdsAfterRecentRunUpCount,
        averageFavorableMovePctAfterPartialExitBeforeReadd:
          input.averageFavorableMovePctAfterPartialExitBeforeReadd,
        averageReaddPriceChangeFromPriorReductionPct:
          input.averageReaddPriceChangeFromPriorReductionPct,
      },
      thresholdsUsed: {
        minReaddRunUpCount,
        minFavorableMoveAfterTrimPct,
      },
    };
  },
};

export const GOOD_PULLBACK_REENTRY_AFTER_CONSTRUCTIVE_TRIM: PatternDefinition = {
  id: "good_pullback_reentry_after_constructive_trim",
  name: "Good Pullback Re-Entry After Constructive Trim",
  family: PATTERN_FAMILIES.SCALING_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const minReaddDropCount =
      THRESHOLDS.SCALING_QUALITY.GOOD_PULLBACK_REENTRY_MIN_READD_DROP_COUNT;
    const maxAdverseMoveAfterTrimPct =
      THRESHOLDS.SCALING_QUALITY
        .GOOD_PULLBACK_REENTRY_MAX_ADVERSE_MOVE_AFTER_TRIM_PCT;

    const matched =
      input.hadPartialExit &&
      input.hadReaddAfterReduction &&
      input.readdsAfterRecentDropCount >= minReaddDropCount &&
      input.averageAdverseMovePctAfterPartialExitBeforeReadd !== null &&
      input.averageAdverseMovePctAfterPartialExitBeforeReadd <=
        maxAdverseMoveAfterTrimPct;

    return {
      matched,
      evidence: {
        hadPartialExit: input.hadPartialExit,
        hadReaddAfterReduction: input.hadReaddAfterReduction,
        readdsAfterRecentDropCount: input.readdsAfterRecentDropCount,
        averageAdverseMovePctAfterPartialExitBeforeReadd:
          input.averageAdverseMovePctAfterPartialExitBeforeReadd,
        averageReaddPriceChangeFromPriorReductionPct:
          input.averageReaddPriceChangeFromPriorReductionPct,
      },
      thresholdsUsed: {
        minReaddDropCount,
        maxAdverseMoveAfterTrimPct,
      },
    };
  },
};

export const CONSTRUCTIVE_REENTRY_FOLLOWTHROUGH_AFTER_TRIM: PatternDefinition = {
  id: "constructive_reentry_followthrough_after_trim",
  name: "Constructive Re-Entry Followthrough After Trim",
  family: PATTERN_FAMILIES.SCALING_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const minReaddDropCount =
      THRESHOLDS.SCALING_QUALITY.GOOD_PULLBACK_REENTRY_MIN_READD_DROP_COUNT;
    const maxAdverseMoveAfterTrimPct =
      THRESHOLDS.SCALING_QUALITY
        .GOOD_PULLBACK_REENTRY_MAX_ADVERSE_MOVE_AFTER_TRIM_PCT;
    const minStrongerFavorableCount =
      THRESHOLDS.SCALING_QUALITY
        .CONSTRUCTIVE_REENTRY_MIN_STRONGER_FAVORABLE_COUNT;
    const minFavorableFollowthroughPct =
      THRESHOLDS.SCALING_QUALITY
        .CONSTRUCTIVE_REENTRY_MIN_FAVORABLE_FOLLOWTHROUGH_PCT;

    const matched =
      input.hadPartialExit &&
      input.hadReaddAfterReduction &&
      input.readdsAfterRecentDropCount >= minReaddDropCount &&
      input.averageAdverseMovePctAfterPartialExitBeforeReadd !== null &&
      input.averageAdverseMovePctAfterPartialExitBeforeReadd <=
        maxAdverseMoveAfterTrimPct &&
      input.readdsWithStrongerFavorableFollowthroughCount >=
        minStrongerFavorableCount &&
      input.averageFavorableMovePctAfterReaddBeforeNextExecution !== null &&
      input.averageFavorableMovePctAfterReaddBeforeNextExecution >=
        minFavorableFollowthroughPct &&
      input.averageFavorableMovePctAfterReaddBeforeNextExecution >
        (input.averageAdverseMovePctAfterReaddBeforeNextExecution ??
          Number.NEGATIVE_INFINITY);

    return {
      matched,
      evidence: {
        hadPartialExit: input.hadPartialExit,
        hadReaddAfterReduction: input.hadReaddAfterReduction,
        readdsAfterRecentDropCount: input.readdsAfterRecentDropCount,
        averageAdverseMovePctAfterPartialExitBeforeReadd:
          input.averageAdverseMovePctAfterPartialExitBeforeReadd,
        readdsWithStrongerFavorableFollowthroughCount:
          input.readdsWithStrongerFavorableFollowthroughCount,
        averageFavorableMovePctAfterReaddBeforeNextExecution:
          input.averageFavorableMovePctAfterReaddBeforeNextExecution,
        averageAdverseMovePctAfterReaddBeforeNextExecution:
          input.averageAdverseMovePctAfterReaddBeforeNextExecution,
      },
      thresholdsUsed: {
        minReaddDropCount,
        maxAdverseMoveAfterTrimPct,
        minStrongerFavorableCount,
        minFavorableFollowthroughPct,
      },
    };
  },
};

export const CONSTRUCTIVE_REENTRY_WITH_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "constructive_reentry_with_constructive_final_exit",
    name: "Constructive Re-Entry With Constructive Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minReaddDropCount =
        THRESHOLDS.SCALING_QUALITY.GOOD_PULLBACK_REENTRY_MIN_READD_DROP_COUNT;
      const maxAdverseMoveAfterTrimPct =
        THRESHOLDS.SCALING_QUALITY
          .GOOD_PULLBACK_REENTRY_MAX_ADVERSE_MOVE_AFTER_TRIM_PCT;
      const minStrongerFavorableCount =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_STRONGER_FAVORABLE_COUNT;
      const minFavorableFollowthroughPct =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_FAVORABLE_FOLLOWTHROUGH_PCT;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .BALANCED_WITH_PROFIT_PROTECTION_MAX_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.hadPartialExit &&
        input.hadReaddAfterReduction &&
        input.readdsAfterRecentDropCount >= minReaddDropCount &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd !== null &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd <=
          maxAdverseMoveAfterTrimPct &&
        input.readdsWithStrongerFavorableFollowthroughCount >=
          minStrongerFavorableCount &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution !== null &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >=
          minFavorableFollowthroughPct &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >
          (input.averageAdverseMovePctAfterReaddBeforeNextExecution ??
            Number.NEGATIVE_INFINITY) &&
        input.closedToFlat &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadPartialExit: input.hadPartialExit,
          hadReaddAfterReduction: input.hadReaddAfterReduction,
          readdsAfterRecentDropCount: input.readdsAfterRecentDropCount,
          averageAdverseMovePctAfterPartialExitBeforeReadd:
            input.averageAdverseMovePctAfterPartialExitBeforeReadd,
          readdsWithStrongerFavorableFollowthroughCount:
            input.readdsWithStrongerFavorableFollowthroughCount,
          averageFavorableMovePctAfterReaddBeforeNextExecution:
            input.averageFavorableMovePctAfterReaddBeforeNextExecution,
          averageAdverseMovePctAfterReaddBeforeNextExecution:
            input.averageAdverseMovePctAfterReaddBeforeNextExecution,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minReaddDropCount,
          maxAdverseMoveAfterTrimPct,
          minStrongerFavorableCount,
          minFavorableFollowthroughPct,
          maxGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const CONSTRUCTIVE_REENTRY_WITH_PREMATURE_FINAL_EXIT: PatternDefinition =
  {
    id: "constructive_reentry_with_premature_final_exit",
    name: "Constructive Re-Entry With Premature Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minReaddDropCount =
        THRESHOLDS.SCALING_QUALITY.GOOD_PULLBACK_REENTRY_MIN_READD_DROP_COUNT;
      const maxAdverseMoveAfterTrimPct =
        THRESHOLDS.SCALING_QUALITY
          .GOOD_PULLBACK_REENTRY_MAX_ADVERSE_MOVE_AFTER_TRIM_PCT;
      const minStrongerFavorableCount =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_STRONGER_FAVORABLE_COUNT;
      const minFavorableFollowthroughPct =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_FAVORABLE_FOLLOWTHROUGH_PCT;
      const maxGivebackPct =
        THRESHOLDS.EXIT_QUALITY.PREMATURE_FINAL_EXIT_MAX_GIVEBACK_PCT;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.hadPartialExit &&
        input.hadReaddAfterReduction &&
        input.readdsAfterRecentDropCount >= minReaddDropCount &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd !== null &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd <=
          maxAdverseMoveAfterTrimPct &&
        input.readdsWithStrongerFavorableFollowthroughCount >=
          minStrongerFavorableCount &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution !== null &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >=
          minFavorableFollowthroughPct &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >
          (input.averageAdverseMovePctAfterReaddBeforeNextExecution ??
            Number.NEGATIVE_INFINITY) &&
        input.closedToFlat &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadPartialExit: input.hadPartialExit,
          hadReaddAfterReduction: input.hadReaddAfterReduction,
          readdsAfterRecentDropCount: input.readdsAfterRecentDropCount,
          averageAdverseMovePctAfterPartialExitBeforeReadd:
            input.averageAdverseMovePctAfterPartialExitBeforeReadd,
          readdsWithStrongerFavorableFollowthroughCount:
            input.readdsWithStrongerFavorableFollowthroughCount,
          averageFavorableMovePctAfterReaddBeforeNextExecution:
            input.averageFavorableMovePctAfterReaddBeforeNextExecution,
          averageAdverseMovePctAfterReaddBeforeNextExecution:
            input.averageAdverseMovePctAfterReaddBeforeNextExecution,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minReaddDropCount,
          maxAdverseMoveAfterTrimPct,
          minStrongerFavorableCount,
          minFavorableFollowthroughPct,
          maxGivebackPct,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const CONSTRUCTIVE_REENTRY_WITH_STOP_LIKE_FORCED_EXIT_AFTER_BREAKDOWN: PatternDefinition =
  {
    id: "constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    name: "Constructive Re-Entry With Stop-Like Forced Exit After Breakdown",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minReaddDropCount =
        THRESHOLDS.SCALING_QUALITY.GOOD_PULLBACK_REENTRY_MIN_READD_DROP_COUNT;
      const maxAdverseMoveAfterTrimPct =
        THRESHOLDS.SCALING_QUALITY
          .GOOD_PULLBACK_REENTRY_MAX_ADVERSE_MOVE_AFTER_TRIM_PCT;
      const minStrongerFavorableCount =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_STRONGER_FAVORABLE_COUNT;
      const minFavorableFollowthroughPct =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_FAVORABLE_FOLLOWTHROUGH_PCT;
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
        input.hadPartialExit &&
        input.hadReaddAfterReduction &&
        input.readdsAfterRecentDropCount >= minReaddDropCount &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd !== null &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd <=
          maxAdverseMoveAfterTrimPct &&
        input.readdsWithStrongerFavorableFollowthroughCount >=
          minStrongerFavorableCount &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution !== null &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >=
          minFavorableFollowthroughPct &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >
          (input.averageAdverseMovePctAfterReaddBeforeNextExecution ??
            Number.NEGATIVE_INFINITY) &&
        input.closedToFlat &&
        input.totalPositionDecreaseCount > 0 &&
        input.exitWasNearTradeLow &&
        input.postExitCandleCount > 0 &&
        input.realizedCapturePercentOfTradeMfe !== null &&
        input.realizedCapturePercentOfTradeMfe <= maxRealizedCapture &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.drawdownFromPeakOpenProfitPctOfBasis !== null &&
        input.drawdownFromPeakOpenProfitPctOfBasis >= minDrawdownFromPeakPct &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadPartialExit: input.hadPartialExit,
          hadReaddAfterReduction: input.hadReaddAfterReduction,
          readdsAfterRecentDropCount: input.readdsAfterRecentDropCount,
          averageAdverseMovePctAfterPartialExitBeforeReadd:
            input.averageAdverseMovePctAfterPartialExitBeforeReadd,
          readdsWithStrongerFavorableFollowthroughCount:
            input.readdsWithStrongerFavorableFollowthroughCount,
          averageFavorableMovePctAfterReaddBeforeNextExecution:
            input.averageFavorableMovePctAfterReaddBeforeNextExecution,
          averageAdverseMovePctAfterReaddBeforeNextExecution:
            input.averageAdverseMovePctAfterReaddBeforeNextExecution,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          exitWasNearTradeLow: input.exitWasNearTradeLow,
          realizedCapturePercentOfTradeMfe:
            input.realizedCapturePercentOfTradeMfe,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          drawdownFromPeakOpenProfitPctOfBasis:
            input.drawdownFromPeakOpenProfitPctOfBasis,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minReaddDropCount,
          maxAdverseMoveAfterTrimPct,
          minStrongerFavorableCount,
          minFavorableFollowthroughPct,
          minAdversePct,
          maxNetEndPct,
          minGivebackPct,
          maxRealizedCapture,
          minDrawdownFromPeakPct,
        },
      };
    },
  };

export const CONSTRUCTIVE_REENTRY_WITH_STOP_LIKE_FORCED_EXIT_BEFORE_REBOUND: PatternDefinition =
  {
    id: "constructive_reentry_with_stop_like_forced_exit_before_rebound",
    name: "Constructive Re-Entry With Stop-Like Forced Exit Before Rebound",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minReaddDropCount =
        THRESHOLDS.SCALING_QUALITY.GOOD_PULLBACK_REENTRY_MIN_READD_DROP_COUNT;
      const maxAdverseMoveAfterTrimPct =
        THRESHOLDS.SCALING_QUALITY
          .GOOD_PULLBACK_REENTRY_MAX_ADVERSE_MOVE_AFTER_TRIM_PCT;
      const minStrongerFavorableCount =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_STRONGER_FAVORABLE_COUNT;
      const minFavorableFollowthroughPct =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_FAVORABLE_FOLLOWTHROUGH_PCT;
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
        input.hadPartialExit &&
        input.hadReaddAfterReduction &&
        input.readdsAfterRecentDropCount >= minReaddDropCount &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd !== null &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd <=
          maxAdverseMoveAfterTrimPct &&
        input.readdsWithStrongerFavorableFollowthroughCount >=
          minStrongerFavorableCount &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution !== null &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >=
          minFavorableFollowthroughPct &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >
          (input.averageAdverseMovePctAfterReaddBeforeNextExecution ??
            Number.NEGATIVE_INFINITY) &&
        input.closedToFlat &&
        input.totalPositionDecreaseCount > 0 &&
        input.exitWasNearTradeLow &&
        input.postExitCandleCount > 0 &&
        input.realizedCapturePercentOfTradeMfe !== null &&
        input.realizedCapturePercentOfTradeMfe <= maxRealizedCapture &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.drawdownFromPeakOpenProfitPctOfBasis !== null &&
        input.drawdownFromPeakOpenProfitPctOfBasis >= minDrawdownFromPeakPct &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadPartialExit: input.hadPartialExit,
          hadReaddAfterReduction: input.hadReaddAfterReduction,
          readdsAfterRecentDropCount: input.readdsAfterRecentDropCount,
          averageAdverseMovePctAfterPartialExitBeforeReadd:
            input.averageAdverseMovePctAfterPartialExitBeforeReadd,
          readdsWithStrongerFavorableFollowthroughCount:
            input.readdsWithStrongerFavorableFollowthroughCount,
          averageFavorableMovePctAfterReaddBeforeNextExecution:
            input.averageFavorableMovePctAfterReaddBeforeNextExecution,
          averageAdverseMovePctAfterReaddBeforeNextExecution:
            input.averageAdverseMovePctAfterReaddBeforeNextExecution,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          exitWasNearTradeLow: input.exitWasNearTradeLow,
          realizedCapturePercentOfTradeMfe:
            input.realizedCapturePercentOfTradeMfe,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          drawdownFromPeakOpenProfitPctOfBasis:
            input.drawdownFromPeakOpenProfitPctOfBasis,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minReaddDropCount,
          maxAdverseMoveAfterTrimPct,
          minStrongerFavorableCount,
          minFavorableFollowthroughPct,
          minFavorablePct,
          minNetEndPct,
          minGivebackPct,
          maxRealizedCapture,
          minDrawdownFromPeakPct,
        },
      };
    },
  };

export const RECOVERY_WITH_CONSTRUCTIVE_FINAL_EXIT_AFTER_CONSTRUCTIVE_REENTRY: PatternDefinition =
  {
    id: "recovery_with_constructive_final_exit_after_constructive_reentry",
    name: "Recovery With Constructive Final Exit After Constructive Re-Entry",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minReaddDropCount =
        THRESHOLDS.SCALING_QUALITY.GOOD_PULLBACK_REENTRY_MIN_READD_DROP_COUNT;
      const maxAdverseMoveAfterTrimPct =
        THRESHOLDS.SCALING_QUALITY
          .GOOD_PULLBACK_REENTRY_MAX_ADVERSE_MOVE_AFTER_TRIM_PCT;
      const minStrongerFavorableCount =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_STRONGER_FAVORABLE_COUNT;
      const minFavorableFollowthroughPct =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_FAVORABLE_FOLLOWTHROUGH_PCT;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .BALANCED_WITH_PROFIT_PROTECTION_MAX_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.hadPartialExit &&
        input.hadReaddAfterReduction &&
        input.readdsAfterRecentDropCount >= minReaddDropCount &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd !== null &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd <=
          maxAdverseMoveAfterTrimPct &&
        input.readdsWithStrongerFavorableFollowthroughCount >=
          minStrongerFavorableCount &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution !== null &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >=
          minFavorableFollowthroughPct &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >
          (input.averageAdverseMovePctAfterReaddBeforeNextExecution ??
            Number.NEGATIVE_INFINITY) &&
        input.closedToFlat &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          hadPartialExit: input.hadPartialExit,
          hadReaddAfterReduction: input.hadReaddAfterReduction,
          readdsAfterRecentDropCount: input.readdsAfterRecentDropCount,
          averageAdverseMovePctAfterPartialExitBeforeReadd:
            input.averageAdverseMovePctAfterPartialExitBeforeReadd,
          readdsWithStrongerFavorableFollowthroughCount:
            input.readdsWithStrongerFavorableFollowthroughCount,
          averageFavorableMovePctAfterReaddBeforeNextExecution:
            input.averageFavorableMovePctAfterReaddBeforeNextExecution,
          averageAdverseMovePctAfterReaddBeforeNextExecution:
            input.averageAdverseMovePctAfterReaddBeforeNextExecution,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minReaddDropCount,
          maxAdverseMoveAfterTrimPct,
          minStrongerFavorableCount,
          minFavorableFollowthroughPct,
          maxGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const RECOVERY_WITH_PREMATURE_FINAL_EXIT_AFTER_CONSTRUCTIVE_REENTRY: PatternDefinition =
  {
    id: "recovery_with_premature_final_exit_after_constructive_reentry",
    name: "Recovery With Premature Final Exit After Constructive Re-Entry",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minReaddDropCount =
        THRESHOLDS.SCALING_QUALITY.GOOD_PULLBACK_REENTRY_MIN_READD_DROP_COUNT;
      const maxAdverseMoveAfterTrimPct =
        THRESHOLDS.SCALING_QUALITY
          .GOOD_PULLBACK_REENTRY_MAX_ADVERSE_MOVE_AFTER_TRIM_PCT;
      const minStrongerFavorableCount =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_STRONGER_FAVORABLE_COUNT;
      const minFavorableFollowthroughPct =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_FAVORABLE_FOLLOWTHROUGH_PCT;
      const maxGivebackPct =
        THRESHOLDS.EXIT_QUALITY.PREMATURE_FINAL_EXIT_MAX_GIVEBACK_PCT;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.hadPartialExit &&
        input.hadReaddAfterReduction &&
        input.readdsAfterRecentDropCount >= minReaddDropCount &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd !== null &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd <=
          maxAdverseMoveAfterTrimPct &&
        input.readdsWithStrongerFavorableFollowthroughCount >=
          minStrongerFavorableCount &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution !== null &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >=
          minFavorableFollowthroughPct &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >
          (input.averageAdverseMovePctAfterReaddBeforeNextExecution ??
            Number.NEGATIVE_INFINITY) &&
        input.closedToFlat &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          realizedReturnPct: input.realizedReturnPct,
          hadPartialExit: input.hadPartialExit,
          hadReaddAfterReduction: input.hadReaddAfterReduction,
          readdsAfterRecentDropCount: input.readdsAfterRecentDropCount,
          averageAdverseMovePctAfterPartialExitBeforeReadd:
            input.averageAdverseMovePctAfterPartialExitBeforeReadd,
          readdsWithStrongerFavorableFollowthroughCount:
            input.readdsWithStrongerFavorableFollowthroughCount,
          averageFavorableMovePctAfterReaddBeforeNextExecution:
            input.averageFavorableMovePctAfterReaddBeforeNextExecution,
          averageAdverseMovePctAfterReaddBeforeNextExecution:
            input.averageAdverseMovePctAfterReaddBeforeNextExecution,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minReaddDropCount,
          maxAdverseMoveAfterTrimPct,
          minStrongerFavorableCount,
          minFavorableFollowthroughPct,
          maxGivebackPct,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const RECOVERY_WITH_STOP_LIKE_FORCED_EXIT_AFTER_CONSTRUCTIVE_REENTRY: PatternDefinition =
  {
    id: "recovery_with_stop_like_forced_exit_after_constructive_reentry",
    name: "Recovery With Stop-Like Forced Exit After Constructive Re-Entry",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minReaddDropCount =
        THRESHOLDS.SCALING_QUALITY.GOOD_PULLBACK_REENTRY_MIN_READD_DROP_COUNT;
      const maxAdverseMoveAfterTrimPct =
        THRESHOLDS.SCALING_QUALITY
          .GOOD_PULLBACK_REENTRY_MAX_ADVERSE_MOVE_AFTER_TRIM_PCT;
      const minStrongerFavorableCount =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_STRONGER_FAVORABLE_COUNT;
      const minFavorableFollowthroughPct =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_FAVORABLE_FOLLOWTHROUGH_PCT;
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
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.hadPartialExit &&
        input.hadReaddAfterReduction &&
        input.readdsAfterRecentDropCount >= minReaddDropCount &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd !== null &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd <=
          maxAdverseMoveAfterTrimPct &&
        input.readdsWithStrongerFavorableFollowthroughCount >=
          minStrongerFavorableCount &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution !== null &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >=
          minFavorableFollowthroughPct &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >
          (input.averageAdverseMovePctAfterReaddBeforeNextExecution ??
            Number.NEGATIVE_INFINITY) &&
        input.closedToFlat &&
        input.totalPositionDecreaseCount > 0 &&
        input.exitWasNearTradeLow &&
        input.postExitCandleCount > 0 &&
        input.realizedCapturePercentOfTradeMfe !== null &&
        input.realizedCapturePercentOfTradeMfe <= maxRealizedCapture &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.drawdownFromPeakOpenProfitPctOfBasis !== null &&
        input.drawdownFromPeakOpenProfitPctOfBasis >= minDrawdownFromPeakPct &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          realizedReturnPct: input.realizedReturnPct,
          hadPartialExit: input.hadPartialExit,
          hadReaddAfterReduction: input.hadReaddAfterReduction,
          readdsAfterRecentDropCount: input.readdsAfterRecentDropCount,
          averageAdverseMovePctAfterPartialExitBeforeReadd:
            input.averageAdverseMovePctAfterPartialExitBeforeReadd,
          readdsWithStrongerFavorableFollowthroughCount:
            input.readdsWithStrongerFavorableFollowthroughCount,
          averageFavorableMovePctAfterReaddBeforeNextExecution:
            input.averageFavorableMovePctAfterReaddBeforeNextExecution,
          averageAdverseMovePctAfterReaddBeforeNextExecution:
            input.averageAdverseMovePctAfterReaddBeforeNextExecution,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          exitWasNearTradeLow: input.exitWasNearTradeLow,
          realizedCapturePercentOfTradeMfe:
            input.realizedCapturePercentOfTradeMfe,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          drawdownFromPeakOpenProfitPctOfBasis:
            input.drawdownFromPeakOpenProfitPctOfBasis,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minReaddDropCount,
          maxAdverseMoveAfterTrimPct,
          minStrongerFavorableCount,
          minFavorableFollowthroughPct,
          minAdversePct,
          maxNetEndPct,
          minGivebackPct,
          maxRealizedCapture,
          minDrawdownFromPeakPct,
        },
      };
    },
  };

export const RECOVERY_WITH_STOP_LIKE_FORCED_EXIT_BEFORE_REBOUND_AFTER_CONSTRUCTIVE_REENTRY: PatternDefinition =
  {
    id: "recovery_with_stop_like_forced_exit_before_rebound_after_constructive_reentry",
    name: "Recovery With Stop-Like Forced Exit Before Rebound After Constructive Re-Entry",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minReaddDropCount =
        THRESHOLDS.SCALING_QUALITY.GOOD_PULLBACK_REENTRY_MIN_READD_DROP_COUNT;
      const maxAdverseMoveAfterTrimPct =
        THRESHOLDS.SCALING_QUALITY
          .GOOD_PULLBACK_REENTRY_MAX_ADVERSE_MOVE_AFTER_TRIM_PCT;
      const minStrongerFavorableCount =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_STRONGER_FAVORABLE_COUNT;
      const minFavorableFollowthroughPct =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_FAVORABLE_FOLLOWTHROUGH_PCT;
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
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.hadPartialExit &&
        input.hadReaddAfterReduction &&
        input.readdsAfterRecentDropCount >= minReaddDropCount &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd !== null &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd <=
          maxAdverseMoveAfterTrimPct &&
        input.readdsWithStrongerFavorableFollowthroughCount >=
          minStrongerFavorableCount &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution !== null &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >=
          minFavorableFollowthroughPct &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >
          (input.averageAdverseMovePctAfterReaddBeforeNextExecution ??
            Number.NEGATIVE_INFINITY) &&
        input.closedToFlat &&
        input.totalPositionDecreaseCount > 0 &&
        input.exitWasNearTradeLow &&
        input.postExitCandleCount > 0 &&
        input.realizedCapturePercentOfTradeMfe !== null &&
        input.realizedCapturePercentOfTradeMfe <= maxRealizedCapture &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.drawdownFromPeakOpenProfitPctOfBasis !== null &&
        input.drawdownFromPeakOpenProfitPctOfBasis >= minDrawdownFromPeakPct &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          realizedReturnPct: input.realizedReturnPct,
          hadPartialExit: input.hadPartialExit,
          hadReaddAfterReduction: input.hadReaddAfterReduction,
          readdsAfterRecentDropCount: input.readdsAfterRecentDropCount,
          averageAdverseMovePctAfterPartialExitBeforeReadd:
            input.averageAdverseMovePctAfterPartialExitBeforeReadd,
          readdsWithStrongerFavorableFollowthroughCount:
            input.readdsWithStrongerFavorableFollowthroughCount,
          averageFavorableMovePctAfterReaddBeforeNextExecution:
            input.averageFavorableMovePctAfterReaddBeforeNextExecution,
          averageAdverseMovePctAfterReaddBeforeNextExecution:
            input.averageAdverseMovePctAfterReaddBeforeNextExecution,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          exitWasNearTradeLow: input.exitWasNearTradeLow,
          realizedCapturePercentOfTradeMfe:
            input.realizedCapturePercentOfTradeMfe,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          drawdownFromPeakOpenProfitPctOfBasis:
            input.drawdownFromPeakOpenProfitPctOfBasis,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minReaddDropCount,
          maxAdverseMoveAfterTrimPct,
          minStrongerFavorableCount,
          minFavorableFollowthroughPct,
          minFavorablePct,
          minNetEndPct,
          minGivebackPct,
          maxRealizedCapture,
          minDrawdownFromPeakPct,
        },
      };
    },
  };

export const DETERIORATING_REENTRY_AFTER_TRIM: PatternDefinition = {
  id: "deteriorating_reentry_after_trim",
  name: "Deteriorating Re-Entry After Trim",
  family: PATTERN_FAMILIES.SCALING_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const minReaddRunUpCount =
      THRESHOLDS.SCALING_QUALITY.LATE_CHASE_REENTRY_MIN_READD_RUN_UP_COUNT;
    const minFavorableMoveAfterTrimPct =
      THRESHOLDS.SCALING_QUALITY
        .LATE_CHASE_REENTRY_MIN_FAVORABLE_MOVE_AFTER_TRIM_PCT;
    const minStrongerAdverseCount =
      THRESHOLDS.SCALING_QUALITY
        .DETERIORATING_REENTRY_MIN_STRONGER_ADVERSE_COUNT;
    const minAdverseFollowthroughPct =
      THRESHOLDS.SCALING_QUALITY
        .DETERIORATING_REENTRY_MIN_ADVERSE_FOLLOWTHROUGH_PCT;

    const matched =
      input.hadPartialExit &&
      input.hadReaddAfterReduction &&
      input.readdsAfterRecentRunUpCount >= minReaddRunUpCount &&
      input.averageFavorableMovePctAfterPartialExitBeforeReadd !== null &&
      input.averageFavorableMovePctAfterPartialExitBeforeReadd >=
        minFavorableMoveAfterTrimPct &&
      input.readdsWithStrongerAdverseFollowthroughCount >=
        minStrongerAdverseCount &&
      input.averageAdverseMovePctAfterReaddBeforeNextExecution !== null &&
      input.averageAdverseMovePctAfterReaddBeforeNextExecution >=
        minAdverseFollowthroughPct &&
      input.averageAdverseMovePctAfterReaddBeforeNextExecution >
        (input.averageFavorableMovePctAfterReaddBeforeNextExecution ??
          Number.NEGATIVE_INFINITY);

    return {
      matched,
      evidence: {
        hadPartialExit: input.hadPartialExit,
        hadReaddAfterReduction: input.hadReaddAfterReduction,
        readdsAfterRecentRunUpCount: input.readdsAfterRecentRunUpCount,
        averageFavorableMovePctAfterPartialExitBeforeReadd:
          input.averageFavorableMovePctAfterPartialExitBeforeReadd,
        readdsWithStrongerAdverseFollowthroughCount:
          input.readdsWithStrongerAdverseFollowthroughCount,
        averageAdverseMovePctAfterReaddBeforeNextExecution:
          input.averageAdverseMovePctAfterReaddBeforeNextExecution,
        averageFavorableMovePctAfterReaddBeforeNextExecution:
          input.averageFavorableMovePctAfterReaddBeforeNextExecution,
      },
      thresholdsUsed: {
        minReaddRunUpCount,
        minFavorableMoveAfterTrimPct,
        minStrongerAdverseCount,
        minAdverseFollowthroughPct,
      },
    };
  },
};

export const REPEATED_TRIM_READD_WITH_CONSTRUCTIVE_REENTRY_FOLLOWTHROUGH: PatternDefinition =
  {
    id: "repeated_trim_readd_with_constructive_reentry_followthrough",
    name: "Repeated Trim Re-Add With Constructive Re-Entry Followthrough",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minReaddDropCount =
        THRESHOLDS.SCALING_QUALITY.GOOD_PULLBACK_REENTRY_MIN_READD_DROP_COUNT;
      const maxAdverseMoveAfterTrimPct =
        THRESHOLDS.SCALING_QUALITY
          .GOOD_PULLBACK_REENTRY_MAX_ADVERSE_MOVE_AFTER_TRIM_PCT;
      const minStrongerFavorableCount =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_STRONGER_FAVORABLE_COUNT;
      const minFavorableFollowthroughPct =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_FAVORABLE_FOLLOWTHROUGH_PCT;

      const matched =
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.readdsAfterRecentDropCount >= minReaddDropCount &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd !== null &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd <=
          maxAdverseMoveAfterTrimPct &&
        input.readdsWithStrongerFavorableFollowthroughCount >=
          minStrongerFavorableCount &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution !== null &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >=
          minFavorableFollowthroughPct &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >
          (input.averageAdverseMovePctAfterReaddBeforeNextExecution ??
            Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          readdsAfterRecentDropCount: input.readdsAfterRecentDropCount,
          averageAdverseMovePctAfterPartialExitBeforeReadd:
            input.averageAdverseMovePctAfterPartialExitBeforeReadd,
          readdsWithStrongerFavorableFollowthroughCount:
            input.readdsWithStrongerFavorableFollowthroughCount,
          averageFavorableMovePctAfterReaddBeforeNextExecution:
            input.averageFavorableMovePctAfterReaddBeforeNextExecution,
          averageAdverseMovePctAfterReaddBeforeNextExecution:
            input.averageAdverseMovePctAfterReaddBeforeNextExecution,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          minReaddDropCount,
          maxAdverseMoveAfterTrimPct,
          minStrongerFavorableCount,
          minFavorableFollowthroughPct,
        },
      };
    },
  };

export const REPEATED_TRIM_READD_WITH_DETERIORATING_REENTRY: PatternDefinition =
  {
    id: "repeated_trim_readd_with_deteriorating_reentry",
    name: "Repeated Trim Re-Add With Deteriorating Re-Entry",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minReaddRunUpCount =
        THRESHOLDS.SCALING_QUALITY.LATE_CHASE_REENTRY_MIN_READD_RUN_UP_COUNT;
      const minFavorableMoveAfterTrimPct =
        THRESHOLDS.SCALING_QUALITY
          .LATE_CHASE_REENTRY_MIN_FAVORABLE_MOVE_AFTER_TRIM_PCT;
      const minStrongerAdverseCount =
        THRESHOLDS.SCALING_QUALITY
          .DETERIORATING_REENTRY_MIN_STRONGER_ADVERSE_COUNT;
      const minAdverseFollowthroughPct =
        THRESHOLDS.SCALING_QUALITY
          .DETERIORATING_REENTRY_MIN_ADVERSE_FOLLOWTHROUGH_PCT;

      const matched =
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.readdsAfterRecentRunUpCount >= minReaddRunUpCount &&
        input.averageFavorableMovePctAfterPartialExitBeforeReadd !== null &&
        input.averageFavorableMovePctAfterPartialExitBeforeReadd >=
          minFavorableMoveAfterTrimPct &&
        input.readdsWithStrongerAdverseFollowthroughCount >=
          minStrongerAdverseCount &&
        input.averageAdverseMovePctAfterReaddBeforeNextExecution !== null &&
        input.averageAdverseMovePctAfterReaddBeforeNextExecution >=
          minAdverseFollowthroughPct &&
        input.averageAdverseMovePctAfterReaddBeforeNextExecution >
          (input.averageFavorableMovePctAfterReaddBeforeNextExecution ??
            Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          readdsAfterRecentRunUpCount: input.readdsAfterRecentRunUpCount,
          averageFavorableMovePctAfterPartialExitBeforeReadd:
            input.averageFavorableMovePctAfterPartialExitBeforeReadd,
          readdsWithStrongerAdverseFollowthroughCount:
            input.readdsWithStrongerAdverseFollowthroughCount,
          averageAdverseMovePctAfterReaddBeforeNextExecution:
            input.averageAdverseMovePctAfterReaddBeforeNextExecution,
          averageFavorableMovePctAfterReaddBeforeNextExecution:
            input.averageFavorableMovePctAfterReaddBeforeNextExecution,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          minReaddRunUpCount,
          minFavorableMoveAfterTrimPct,
          minStrongerAdverseCount,
          minAdverseFollowthroughPct,
        },
      };
    },
  };

export const REPEATED_CONSTRUCTIVE_REENTRY_WITH_PREMATURE_FINAL_EXIT: PatternDefinition =
  {
    id: "repeated_constructive_reentry_with_premature_final_exit",
    name: "Repeated Constructive Re-Entry With Premature Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minReaddDropCount =
        THRESHOLDS.SCALING_QUALITY.GOOD_PULLBACK_REENTRY_MIN_READD_DROP_COUNT;
      const maxAdverseMoveAfterTrimPct =
        THRESHOLDS.SCALING_QUALITY
          .GOOD_PULLBACK_REENTRY_MAX_ADVERSE_MOVE_AFTER_TRIM_PCT;
      const minStrongerFavorableCount =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_STRONGER_FAVORABLE_COUNT;
      const minFavorableFollowthroughPct =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_FAVORABLE_FOLLOWTHROUGH_PCT;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.readdsAfterRecentDropCount >= minReaddDropCount &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd !== null &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd <=
          maxAdverseMoveAfterTrimPct &&
        input.readdsWithStrongerFavorableFollowthroughCount >=
          minStrongerFavorableCount &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution !== null &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >=
          minFavorableFollowthroughPct &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >
          (input.averageAdverseMovePctAfterReaddBeforeNextExecution ??
            Number.NEGATIVE_INFINITY) &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          readdsAfterRecentDropCount: input.readdsAfterRecentDropCount,
          averageAdverseMovePctAfterPartialExitBeforeReadd:
            input.averageAdverseMovePctAfterPartialExitBeforeReadd,
          readdsWithStrongerFavorableFollowthroughCount:
            input.readdsWithStrongerFavorableFollowthroughCount,
          averageFavorableMovePctAfterReaddBeforeNextExecution:
            input.averageFavorableMovePctAfterReaddBeforeNextExecution,
          averageAdverseMovePctAfterReaddBeforeNextExecution:
            input.averageAdverseMovePctAfterReaddBeforeNextExecution,
          postExitCandleCount: input.postExitCandleCount,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          minReaddDropCount,
          maxAdverseMoveAfterTrimPct,
          minStrongerFavorableCount,
          minFavorableFollowthroughPct,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const REPEATED_BALANCED_MANAGEMENT_WITH_PREMATURE_FINAL_EXIT: PatternDefinition =
  {
    id: "repeated_balanced_management_with_premature_final_exit",
    name: "Repeated Balanced Management With Premature Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const maxGivebackPct =
        THRESHOLDS.EXIT_QUALITY.PREMATURE_FINAL_EXIT_MAX_GIVEBACK_PCT;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          realizedReturnPct: input.realizedReturnPct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          postExitCandleCount: input.postExitCandleCount,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          maxGivebackPct,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const REPEATED_BALANCED_MANAGEMENT_WITH_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "repeated_balanced_management_with_constructive_final_exit",
    name: "Repeated Balanced Management With Constructive Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .MULTI_CYCLE_CONSTRUCTIVE_MAX_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          maxGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const REPEATED_BALANCED_MANAGEMENT_WITH_MISSED_FINAL_CONTINUATION: PatternDefinition =
  {
    id: "repeated_balanced_management_with_missed_final_continuation",
    name: "Repeated Balanced Management With Missed Final Continuation",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          postExitCandleCount: input.postExitCandleCount,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const REPEATED_BALANCED_MANAGEMENT_WITH_DEFENSIVE_FINAL_EXIT_AFTER_DETERIORATION: PatternDefinition =
  {
    id: "repeated_balanced_management_with_defensive_final_exit_after_deterioration",
    name: "Repeated Balanced Management With Defensive Final Exit After Deterioration",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minGivebackPct =
        THRESHOLDS.EXIT_QUALITY
          .DEFENSIVE_EXIT_AFTER_DETERIORATION_MIN_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.closedToFlat &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          realizedReturnPct: input.realizedReturnPct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          minGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const REPEATED_RESCUE_ATTEMPTS_WITH_BALANCED_MANAGEMENT_AND_DEFENSIVE_FINAL_EXIT_AFTER_DETERIORATION: PatternDefinition =
  {
    id: "repeated_rescue_attempts_with_balanced_management_and_defensive_final_exit_after_deterioration",
    name: "Repeated Rescue Attempts With Balanced Management And Defensive Final Exit After Deterioration",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minGivebackPct =
        THRESHOLDS.EXIT_QUALITY
          .DEFENSIVE_EXIT_AFTER_DETERIORATION_MIN_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.closedToFlat &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          realizedReturnPct: input.realizedReturnPct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          minPeakOpenProfitPctOfBasis,
          minGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const REPEATED_BALANCED_MANAGEMENT_WITH_FEARFUL_FINAL_EXIT: PatternDefinition =
  {
    id: "repeated_balanced_management_with_fearful_final_exit",
    name: "Repeated Balanced Management With Fearful Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const maxRealizedCapture =
        THRESHOLDS.EXIT_QUALITY
          .FEARFUL_EXIT_AFTER_WEAKENING_MAX_REALIZED_CAPTURE;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.closedToFlat &&
        input.exitWasNearTradeLow &&
        input.realizedCapturePercentOfTradeMfe !== null &&
        input.realizedCapturePercentOfTradeMfe <= maxRealizedCapture &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          closedToFlat: input.closedToFlat,
          exitWasNearTradeLow: input.exitWasNearTradeLow,
          realizedCapturePercentOfTradeMfe:
            input.realizedCapturePercentOfTradeMfe,
          postExitCandleCount: input.postExitCandleCount,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          maxRealizedCapture,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const REPEATED_RESCUE_ATTEMPTS_WITH_BALANCED_MANAGEMENT_AND_FEARFUL_FINAL_EXIT: PatternDefinition =
  {
    id: "repeated_rescue_attempts_with_balanced_management_and_fearful_final_exit",
    name: "Repeated Rescue Attempts With Balanced Management And Fearful Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const maxRealizedCapture =
        THRESHOLDS.EXIT_QUALITY
          .FEARFUL_EXIT_AFTER_WEAKENING_MAX_REALIZED_CAPTURE;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.closedToFlat &&
        input.exitWasNearTradeLow &&
        input.realizedCapturePercentOfTradeMfe !== null &&
        input.realizedCapturePercentOfTradeMfe <= maxRealizedCapture &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          closedToFlat: input.closedToFlat,
          exitWasNearTradeLow: input.exitWasNearTradeLow,
          realizedCapturePercentOfTradeMfe:
            input.realizedCapturePercentOfTradeMfe,
          postExitCandleCount: input.postExitCandleCount,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          minPeakOpenProfitPctOfBasis,
          maxRealizedCapture,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const REPEATED_BALANCED_MANAGEMENT_WITH_STOP_LIKE_FORCED_EXIT_AFTER_BREAKDOWN: PatternDefinition =
  {
    id: "repeated_balanced_management_with_stop_like_forced_exit_after_breakdown",
    name: "Repeated Balanced Management With Stop-Like Forced Exit After Breakdown",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
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
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.totalPositionDecreaseCount > 0 &&
        input.closedToFlat &&
        input.exitWasNearTradeLow &&
        input.postExitCandleCount > 0 &&
        input.realizedCapturePercentOfTradeMfe !== null &&
        input.realizedCapturePercentOfTradeMfe <= maxRealizedCapture &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.drawdownFromPeakOpenProfitPctOfBasis !== null &&
        input.drawdownFromPeakOpenProfitPctOfBasis >= minDrawdownFromPeakPct &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          closedToFlat: input.closedToFlat,
          exitWasNearTradeLow: input.exitWasNearTradeLow,
          realizedCapturePercentOfTradeMfe:
            input.realizedCapturePercentOfTradeMfe,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          drawdownFromPeakOpenProfitPctOfBasis:
            input.drawdownFromPeakOpenProfitPctOfBasis,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          minAdversePct,
          maxNetEndPct,
          minGivebackPct,
          maxRealizedCapture,
          minDrawdownFromPeakPct,
        },
      };
    },
  };

export const REPEATED_BALANCED_MANAGEMENT_WITH_STOP_LIKE_FORCED_EXIT_BEFORE_REBOUND: PatternDefinition =
  {
    id: "repeated_balanced_management_with_stop_like_forced_exit_before_rebound",
    name: "Repeated Balanced Management With Stop-Like Forced Exit Before Rebound",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
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
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.totalPositionDecreaseCount > 0 &&
        input.closedToFlat &&
        input.exitWasNearTradeLow &&
        input.postExitCandleCount > 0 &&
        input.realizedCapturePercentOfTradeMfe !== null &&
        input.realizedCapturePercentOfTradeMfe <= maxRealizedCapture &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.drawdownFromPeakOpenProfitPctOfBasis !== null &&
        input.drawdownFromPeakOpenProfitPctOfBasis >= minDrawdownFromPeakPct &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          closedToFlat: input.closedToFlat,
          exitWasNearTradeLow: input.exitWasNearTradeLow,
          realizedCapturePercentOfTradeMfe:
            input.realizedCapturePercentOfTradeMfe,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          drawdownFromPeakOpenProfitPctOfBasis:
            input.drawdownFromPeakOpenProfitPctOfBasis,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          minFavorablePct,
          minNetEndPct,
          minGivebackPct,
          maxRealizedCapture,
          minDrawdownFromPeakPct,
        },
      };
    },
  };

export const REPEATED_CONSTRUCTIVE_REENTRY_WITH_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "repeated_constructive_reentry_with_constructive_final_exit",
    name: "Repeated Constructive Re-Entry With Constructive Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minReaddDropCount =
        THRESHOLDS.SCALING_QUALITY.GOOD_PULLBACK_REENTRY_MIN_READD_DROP_COUNT;
      const maxAdverseMoveAfterTrimPct =
        THRESHOLDS.SCALING_QUALITY
          .GOOD_PULLBACK_REENTRY_MAX_ADVERSE_MOVE_AFTER_TRIM_PCT;
      const minStrongerFavorableCount =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_STRONGER_FAVORABLE_COUNT;
      const minFavorableFollowthroughPct =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_FAVORABLE_FOLLOWTHROUGH_PCT;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .MULTI_CYCLE_CONSTRUCTIVE_MAX_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.readdsAfterRecentDropCount >= minReaddDropCount &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd !== null &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd <=
          maxAdverseMoveAfterTrimPct &&
        input.readdsWithStrongerFavorableFollowthroughCount >=
          minStrongerFavorableCount &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution !== null &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >=
          minFavorableFollowthroughPct &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >
          (input.averageAdverseMovePctAfterReaddBeforeNextExecution ??
            Number.NEGATIVE_INFINITY) &&
        input.closedToFlat &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          readdsAfterRecentDropCount: input.readdsAfterRecentDropCount,
          averageAdverseMovePctAfterPartialExitBeforeReadd:
            input.averageAdverseMovePctAfterPartialExitBeforeReadd,
          readdsWithStrongerFavorableFollowthroughCount:
            input.readdsWithStrongerFavorableFollowthroughCount,
          averageFavorableMovePctAfterReaddBeforeNextExecution:
            input.averageFavorableMovePctAfterReaddBeforeNextExecution,
          averageAdverseMovePctAfterReaddBeforeNextExecution:
            input.averageAdverseMovePctAfterReaddBeforeNextExecution,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          minReaddDropCount,
          maxAdverseMoveAfterTrimPct,
          minStrongerFavorableCount,
          minFavorableFollowthroughPct,
          maxGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const REPEATED_CONSTRUCTIVE_REENTRY_WITH_STOP_LIKE_FORCED_EXIT_AFTER_BREAKDOWN: PatternDefinition =
  {
    id: "repeated_constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    name: "Repeated Constructive Re-Entry With Stop-Like Forced Exit After Breakdown",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minReaddDropCount =
        THRESHOLDS.SCALING_QUALITY.GOOD_PULLBACK_REENTRY_MIN_READD_DROP_COUNT;
      const maxAdverseMoveAfterTrimPct =
        THRESHOLDS.SCALING_QUALITY
          .GOOD_PULLBACK_REENTRY_MAX_ADVERSE_MOVE_AFTER_TRIM_PCT;
      const minStrongerFavorableCount =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_STRONGER_FAVORABLE_COUNT;
      const minFavorableFollowthroughPct =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_FAVORABLE_FOLLOWTHROUGH_PCT;
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
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.readdsAfterRecentDropCount >= minReaddDropCount &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd !== null &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd <=
          maxAdverseMoveAfterTrimPct &&
        input.readdsWithStrongerFavorableFollowthroughCount >=
          minStrongerFavorableCount &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution !== null &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >=
          minFavorableFollowthroughPct &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >
          (input.averageAdverseMovePctAfterReaddBeforeNextExecution ??
            Number.NEGATIVE_INFINITY) &&
        input.closedToFlat &&
        input.totalPositionDecreaseCount > 0 &&
        input.exitWasNearTradeLow &&
        input.postExitCandleCount > 0 &&
        input.realizedCapturePercentOfTradeMfe !== null &&
        input.realizedCapturePercentOfTradeMfe <= maxRealizedCapture &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.drawdownFromPeakOpenProfitPctOfBasis !== null &&
        input.drawdownFromPeakOpenProfitPctOfBasis >= minDrawdownFromPeakPct &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          readdsAfterRecentDropCount: input.readdsAfterRecentDropCount,
          averageAdverseMovePctAfterPartialExitBeforeReadd:
            input.averageAdverseMovePctAfterPartialExitBeforeReadd,
          readdsWithStrongerFavorableFollowthroughCount:
            input.readdsWithStrongerFavorableFollowthroughCount,
          averageFavorableMovePctAfterReaddBeforeNextExecution:
            input.averageFavorableMovePctAfterReaddBeforeNextExecution,
          averageAdverseMovePctAfterReaddBeforeNextExecution:
            input.averageAdverseMovePctAfterReaddBeforeNextExecution,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          exitWasNearTradeLow: input.exitWasNearTradeLow,
          realizedCapturePercentOfTradeMfe:
            input.realizedCapturePercentOfTradeMfe,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          drawdownFromPeakOpenProfitPctOfBasis:
            input.drawdownFromPeakOpenProfitPctOfBasis,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          minReaddDropCount,
          maxAdverseMoveAfterTrimPct,
          minStrongerFavorableCount,
          minFavorableFollowthroughPct,
          minAdversePct,
          maxNetEndPct,
          minGivebackPct,
          maxRealizedCapture,
          minDrawdownFromPeakPct,
        },
      };
    },
  };

export const REPEATED_CONSTRUCTIVE_REENTRY_WITH_STOP_LIKE_FORCED_EXIT_BEFORE_REBOUND: PatternDefinition =
  {
    id: "repeated_constructive_reentry_with_stop_like_forced_exit_before_rebound",
    name: "Repeated Constructive Re-Entry With Stop-Like Forced Exit Before Rebound",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minReaddDropCount =
        THRESHOLDS.SCALING_QUALITY.GOOD_PULLBACK_REENTRY_MIN_READD_DROP_COUNT;
      const maxAdverseMoveAfterTrimPct =
        THRESHOLDS.SCALING_QUALITY
          .GOOD_PULLBACK_REENTRY_MAX_ADVERSE_MOVE_AFTER_TRIM_PCT;
      const minStrongerFavorableCount =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_STRONGER_FAVORABLE_COUNT;
      const minFavorableFollowthroughPct =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_FAVORABLE_FOLLOWTHROUGH_PCT;
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
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.readdsAfterRecentDropCount >= minReaddDropCount &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd !== null &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd <=
          maxAdverseMoveAfterTrimPct &&
        input.readdsWithStrongerFavorableFollowthroughCount >=
          minStrongerFavorableCount &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution !== null &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >=
          minFavorableFollowthroughPct &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >
          (input.averageAdverseMovePctAfterReaddBeforeNextExecution ??
            Number.NEGATIVE_INFINITY) &&
        input.closedToFlat &&
        input.totalPositionDecreaseCount > 0 &&
        input.exitWasNearTradeLow &&
        input.postExitCandleCount > 0 &&
        input.realizedCapturePercentOfTradeMfe !== null &&
        input.realizedCapturePercentOfTradeMfe <= maxRealizedCapture &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.drawdownFromPeakOpenProfitPctOfBasis !== null &&
        input.drawdownFromPeakOpenProfitPctOfBasis >= minDrawdownFromPeakPct &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          readdsAfterRecentDropCount: input.readdsAfterRecentDropCount,
          averageAdverseMovePctAfterPartialExitBeforeReadd:
            input.averageAdverseMovePctAfterPartialExitBeforeReadd,
          readdsWithStrongerFavorableFollowthroughCount:
            input.readdsWithStrongerFavorableFollowthroughCount,
          averageFavorableMovePctAfterReaddBeforeNextExecution:
            input.averageFavorableMovePctAfterReaddBeforeNextExecution,
          averageAdverseMovePctAfterReaddBeforeNextExecution:
            input.averageAdverseMovePctAfterReaddBeforeNextExecution,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          exitWasNearTradeLow: input.exitWasNearTradeLow,
          realizedCapturePercentOfTradeMfe:
            input.realizedCapturePercentOfTradeMfe,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          drawdownFromPeakOpenProfitPctOfBasis:
            input.drawdownFromPeakOpenProfitPctOfBasis,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          minReaddDropCount,
          maxAdverseMoveAfterTrimPct,
          minStrongerFavorableCount,
          minFavorableFollowthroughPct,
          minFavorablePct,
          minNetEndPct,
          minGivebackPct,
          maxRealizedCapture,
          minDrawdownFromPeakPct,
        },
      };
    },
  };

export const REPEATED_DETERIORATING_REENTRY_WITH_DEFENSIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "repeated_deteriorating_reentry_with_defensive_final_exit",
    name: "Repeated Deteriorating Re-Entry With Defensive Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minReaddRunUpCount =
        THRESHOLDS.SCALING_QUALITY.LATE_CHASE_REENTRY_MIN_READD_RUN_UP_COUNT;
      const minFavorableMoveAfterTrimPct =
        THRESHOLDS.SCALING_QUALITY
          .LATE_CHASE_REENTRY_MIN_FAVORABLE_MOVE_AFTER_TRIM_PCT;
      const minStrongerAdverseCount =
        THRESHOLDS.SCALING_QUALITY
          .DETERIORATING_REENTRY_MIN_STRONGER_ADVERSE_COUNT;
      const minAdverseFollowthroughPct =
        THRESHOLDS.SCALING_QUALITY
          .DETERIORATING_REENTRY_MIN_ADVERSE_FOLLOWTHROUGH_PCT;
      const minGivebackPct =
        THRESHOLDS.EXIT_QUALITY
          .DEFENSIVE_EXIT_AFTER_DETERIORATION_MIN_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.readdsAfterRecentRunUpCount >= minReaddRunUpCount &&
        input.averageFavorableMovePctAfterPartialExitBeforeReadd !== null &&
        input.averageFavorableMovePctAfterPartialExitBeforeReadd >=
          minFavorableMoveAfterTrimPct &&
        input.readdsWithStrongerAdverseFollowthroughCount >=
          minStrongerAdverseCount &&
        input.averageAdverseMovePctAfterReaddBeforeNextExecution !== null &&
        input.averageAdverseMovePctAfterReaddBeforeNextExecution >=
          minAdverseFollowthroughPct &&
        input.averageAdverseMovePctAfterReaddBeforeNextExecution >
          (input.averageFavorableMovePctAfterReaddBeforeNextExecution ??
            Number.NEGATIVE_INFINITY) &&
        input.closedToFlat &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          readdsAfterRecentRunUpCount: input.readdsAfterRecentRunUpCount,
          averageFavorableMovePctAfterPartialExitBeforeReadd:
            input.averageFavorableMovePctAfterPartialExitBeforeReadd,
          readdsWithStrongerAdverseFollowthroughCount:
            input.readdsWithStrongerAdverseFollowthroughCount,
          averageAdverseMovePctAfterReaddBeforeNextExecution:
            input.averageAdverseMovePctAfterReaddBeforeNextExecution,
          averageFavorableMovePctAfterReaddBeforeNextExecution:
            input.averageFavorableMovePctAfterReaddBeforeNextExecution,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          minReaddRunUpCount,
          minFavorableMoveAfterTrimPct,
          minStrongerAdverseCount,
          minAdverseFollowthroughPct,
          minGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const REPEATED_RESCUE_ATTEMPTS_WITH_PREMATURE_FINAL_EXIT_AFTER_CONSTRUCTIVE_REENTRIES: PatternDefinition =
  {
    id: "repeated_rescue_attempts_with_premature_final_exit_after_constructive_reentries",
    name: "Repeated Rescue Attempts With Premature Final Exit After Constructive Re-Entries",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minReaddDropCount =
        THRESHOLDS.SCALING_QUALITY.GOOD_PULLBACK_REENTRY_MIN_READD_DROP_COUNT;
      const maxAdverseMoveAfterTrimPct =
        THRESHOLDS.SCALING_QUALITY
          .GOOD_PULLBACK_REENTRY_MAX_ADVERSE_MOVE_AFTER_TRIM_PCT;
      const minStrongerFavorableCount =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_STRONGER_FAVORABLE_COUNT;
      const minFavorableFollowthroughPct =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_FAVORABLE_FOLLOWTHROUGH_PCT;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.readdsAfterRecentDropCount >= minReaddDropCount &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd !== null &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd <=
          maxAdverseMoveAfterTrimPct &&
        input.readdsWithStrongerFavorableFollowthroughCount >=
          minStrongerFavorableCount &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution !== null &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >=
          minFavorableFollowthroughPct &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >
          (input.averageAdverseMovePctAfterReaddBeforeNextExecution ??
            Number.NEGATIVE_INFINITY) &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          readdsAfterRecentDropCount: input.readdsAfterRecentDropCount,
          averageAdverseMovePctAfterPartialExitBeforeReadd:
            input.averageAdverseMovePctAfterPartialExitBeforeReadd,
          readdsWithStrongerFavorableFollowthroughCount:
            input.readdsWithStrongerFavorableFollowthroughCount,
          averageFavorableMovePctAfterReaddBeforeNextExecution:
            input.averageFavorableMovePctAfterReaddBeforeNextExecution,
          averageAdverseMovePctAfterReaddBeforeNextExecution:
            input.averageAdverseMovePctAfterReaddBeforeNextExecution,
          postExitCandleCount: input.postExitCandleCount,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minPartialExits,
          minReadds,
          minReaddDropCount,
          maxAdverseMoveAfterTrimPct,
          minStrongerFavorableCount,
          minFavorableFollowthroughPct,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const REPEATED_RESCUE_ATTEMPTS_WITH_BALANCED_MANAGEMENT_AND_PREMATURE_FINAL_EXIT: PatternDefinition =
  {
    id: "repeated_rescue_attempts_with_balanced_management_and_premature_final_exit",
    name: "Repeated Rescue Attempts With Balanced Management And Premature Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const maxGivebackPct =
        THRESHOLDS.EXIT_QUALITY.PREMATURE_FINAL_EXIT_MAX_GIVEBACK_PCT;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          realizedReturnPct: input.realizedReturnPct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          postExitCandleCount: input.postExitCandleCount,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          minPeakOpenProfitPctOfBasis,
          maxGivebackPct,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const REPEATED_RESCUE_ATTEMPTS_WITH_BALANCED_MANAGEMENT_AND_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "repeated_rescue_attempts_with_balanced_management_and_constructive_final_exit",
    name: "Repeated Rescue Attempts With Balanced Management And Constructive Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .MULTI_CYCLE_CONSTRUCTIVE_MAX_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          minPeakOpenProfitPctOfBasis,
          maxGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const REPEATED_RESCUE_ATTEMPTS_WITH_BALANCED_MANAGEMENT_AND_MISSED_FINAL_CONTINUATION: PatternDefinition =
  {
    id: "repeated_rescue_attempts_with_balanced_management_and_missed_final_continuation",
    name: "Repeated Rescue Attempts With Balanced Management And Missed Final Continuation",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          postExitCandleCount: input.postExitCandleCount,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          minPeakOpenProfitPctOfBasis,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const REPEATED_RESCUE_ATTEMPTS_WITH_BALANCED_MANAGEMENT_AND_STOP_LIKE_FORCED_EXIT_AFTER_BREAKDOWN: PatternDefinition =
  {
    id: "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_after_breakdown",
    name: "Repeated Rescue Attempts With Balanced Management And Stop-Like Forced Exit After Breakdown",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
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
        input.hadOpenLossBeforePeakOpenProfit &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.totalPositionDecreaseCount > 0 &&
        input.closedToFlat &&
        input.exitWasNearTradeLow &&
        input.postExitCandleCount > 0 &&
        input.realizedCapturePercentOfTradeMfe !== null &&
        input.realizedCapturePercentOfTradeMfe <= maxRealizedCapture &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.drawdownFromPeakOpenProfitPctOfBasis !== null &&
        input.drawdownFromPeakOpenProfitPctOfBasis >= minDrawdownFromPeakPct &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          closedToFlat: input.closedToFlat,
          exitWasNearTradeLow: input.exitWasNearTradeLow,
          realizedCapturePercentOfTradeMfe:
            input.realizedCapturePercentOfTradeMfe,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          drawdownFromPeakOpenProfitPctOfBasis:
            input.drawdownFromPeakOpenProfitPctOfBasis,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          minPeakOpenProfitPctOfBasis,
          minAdversePct,
          maxNetEndPct,
          minGivebackPct,
          maxRealizedCapture,
          minDrawdownFromPeakPct,
        },
      };
    },
  };

export const REPEATED_RESCUE_ATTEMPTS_WITH_BALANCED_MANAGEMENT_AND_STOP_LIKE_FORCED_EXIT_BEFORE_REBOUND: PatternDefinition =
  {
    id: "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    name: "Repeated Rescue Attempts With Balanced Management And Stop-Like Forced Exit Before Rebound",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
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
        input.hadOpenLossBeforePeakOpenProfit &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.totalPositionDecreaseCount > 0 &&
        input.closedToFlat &&
        input.exitWasNearTradeLow &&
        input.postExitCandleCount > 0 &&
        input.realizedCapturePercentOfTradeMfe !== null &&
        input.realizedCapturePercentOfTradeMfe <= maxRealizedCapture &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.drawdownFromPeakOpenProfitPctOfBasis !== null &&
        input.drawdownFromPeakOpenProfitPctOfBasis >= minDrawdownFromPeakPct &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          closedToFlat: input.closedToFlat,
          exitWasNearTradeLow: input.exitWasNearTradeLow,
          realizedCapturePercentOfTradeMfe:
            input.realizedCapturePercentOfTradeMfe,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          drawdownFromPeakOpenProfitPctOfBasis:
            input.drawdownFromPeakOpenProfitPctOfBasis,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          minPeakOpenProfitPctOfBasis,
          minFavorablePct,
          minNetEndPct,
          minGivebackPct,
          maxRealizedCapture,
          minDrawdownFromPeakPct,
        },
      };
    },
  };

export const REPEATED_RESCUE_ATTEMPTS_WITH_CONSTRUCTIVE_FINAL_EXIT_AFTER_CONSTRUCTIVE_REENTRIES: PatternDefinition =
  {
    id: "repeated_rescue_attempts_with_constructive_final_exit_after_constructive_reentries",
    name: "Repeated Rescue Attempts With Constructive Final Exit After Constructive Re-Entries",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minReaddDropCount =
        THRESHOLDS.SCALING_QUALITY.GOOD_PULLBACK_REENTRY_MIN_READD_DROP_COUNT;
      const maxAdverseMoveAfterTrimPct =
        THRESHOLDS.SCALING_QUALITY
          .GOOD_PULLBACK_REENTRY_MAX_ADVERSE_MOVE_AFTER_TRIM_PCT;
      const minStrongerFavorableCount =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_STRONGER_FAVORABLE_COUNT;
      const minFavorableFollowthroughPct =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_FAVORABLE_FOLLOWTHROUGH_PCT;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .MULTI_CYCLE_CONSTRUCTIVE_MAX_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.readdsAfterRecentDropCount >= minReaddDropCount &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd !== null &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd <=
          maxAdverseMoveAfterTrimPct &&
        input.readdsWithStrongerFavorableFollowthroughCount >=
          minStrongerFavorableCount &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution !== null &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >=
          minFavorableFollowthroughPct &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >
          (input.averageAdverseMovePctAfterReaddBeforeNextExecution ??
            Number.NEGATIVE_INFINITY) &&
        input.closedToFlat &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          readdsAfterRecentDropCount: input.readdsAfterRecentDropCount,
          averageAdverseMovePctAfterPartialExitBeforeReadd:
            input.averageAdverseMovePctAfterPartialExitBeforeReadd,
          readdsWithStrongerFavorableFollowthroughCount:
            input.readdsWithStrongerFavorableFollowthroughCount,
          averageFavorableMovePctAfterReaddBeforeNextExecution:
            input.averageFavorableMovePctAfterReaddBeforeNextExecution,
          averageAdverseMovePctAfterReaddBeforeNextExecution:
            input.averageAdverseMovePctAfterReaddBeforeNextExecution,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minPartialExits,
          minReadds,
          minReaddDropCount,
          maxAdverseMoveAfterTrimPct,
          minStrongerFavorableCount,
          minFavorableFollowthroughPct,
          maxGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const REPEATED_RESCUE_ATTEMPTS_WITH_STOP_LIKE_FORCED_EXIT_AFTER_CONSTRUCTIVE_REENTRIES: PatternDefinition =
  {
    id: "repeated_rescue_attempts_with_stop_like_forced_exit_after_constructive_reentries",
    name: "Repeated Rescue Attempts With Stop-Like Forced Exit After Constructive Re-Entries",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minReaddDropCount =
        THRESHOLDS.SCALING_QUALITY.GOOD_PULLBACK_REENTRY_MIN_READD_DROP_COUNT;
      const maxAdverseMoveAfterTrimPct =
        THRESHOLDS.SCALING_QUALITY
          .GOOD_PULLBACK_REENTRY_MAX_ADVERSE_MOVE_AFTER_TRIM_PCT;
      const minStrongerFavorableCount =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_STRONGER_FAVORABLE_COUNT;
      const minFavorableFollowthroughPct =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_FAVORABLE_FOLLOWTHROUGH_PCT;
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
        input.hadOpenLossBeforePeakOpenProfit &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.readdsAfterRecentDropCount >= minReaddDropCount &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd !== null &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd <=
          maxAdverseMoveAfterTrimPct &&
        input.readdsWithStrongerFavorableFollowthroughCount >=
          minStrongerFavorableCount &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution !== null &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >=
          minFavorableFollowthroughPct &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >
          (input.averageAdverseMovePctAfterReaddBeforeNextExecution ??
            Number.NEGATIVE_INFINITY) &&
        input.closedToFlat &&
        input.totalPositionDecreaseCount > 0 &&
        input.exitWasNearTradeLow &&
        input.postExitCandleCount > 0 &&
        input.realizedCapturePercentOfTradeMfe !== null &&
        input.realizedCapturePercentOfTradeMfe <= maxRealizedCapture &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.drawdownFromPeakOpenProfitPctOfBasis !== null &&
        input.drawdownFromPeakOpenProfitPctOfBasis >= minDrawdownFromPeakPct &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          readdsAfterRecentDropCount: input.readdsAfterRecentDropCount,
          averageAdverseMovePctAfterPartialExitBeforeReadd:
            input.averageAdverseMovePctAfterPartialExitBeforeReadd,
          readdsWithStrongerFavorableFollowthroughCount:
            input.readdsWithStrongerFavorableFollowthroughCount,
          averageFavorableMovePctAfterReaddBeforeNextExecution:
            input.averageFavorableMovePctAfterReaddBeforeNextExecution,
          averageAdverseMovePctAfterReaddBeforeNextExecution:
            input.averageAdverseMovePctAfterReaddBeforeNextExecution,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          exitWasNearTradeLow: input.exitWasNearTradeLow,
          realizedCapturePercentOfTradeMfe:
            input.realizedCapturePercentOfTradeMfe,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          drawdownFromPeakOpenProfitPctOfBasis:
            input.drawdownFromPeakOpenProfitPctOfBasis,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minPartialExits,
          minReadds,
          minReaddDropCount,
          maxAdverseMoveAfterTrimPct,
          minStrongerFavorableCount,
          minFavorableFollowthroughPct,
          minAdversePct,
          maxNetEndPct,
          minGivebackPct,
          maxRealizedCapture,
          minDrawdownFromPeakPct,
        },
      };
    },
  };

export const REPEATED_RESCUE_ATTEMPTS_WITH_STOP_LIKE_FORCED_EXIT_BEFORE_REBOUND_AFTER_CONSTRUCTIVE_REENTRIES: PatternDefinition =
  {
    id: "repeated_rescue_attempts_with_stop_like_forced_exit_before_rebound_after_constructive_reentries",
    name: "Repeated Rescue Attempts With Stop-Like Forced Exit Before Rebound After Constructive Re-Entries",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minReaddDropCount =
        THRESHOLDS.SCALING_QUALITY.GOOD_PULLBACK_REENTRY_MIN_READD_DROP_COUNT;
      const maxAdverseMoveAfterTrimPct =
        THRESHOLDS.SCALING_QUALITY
          .GOOD_PULLBACK_REENTRY_MAX_ADVERSE_MOVE_AFTER_TRIM_PCT;
      const minStrongerFavorableCount =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_STRONGER_FAVORABLE_COUNT;
      const minFavorableFollowthroughPct =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_REENTRY_MIN_FAVORABLE_FOLLOWTHROUGH_PCT;
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
        input.hadOpenLossBeforePeakOpenProfit &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.readdsAfterRecentDropCount >= minReaddDropCount &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd !== null &&
        input.averageAdverseMovePctAfterPartialExitBeforeReadd <=
          maxAdverseMoveAfterTrimPct &&
        input.readdsWithStrongerFavorableFollowthroughCount >=
          minStrongerFavorableCount &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution !== null &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >=
          minFavorableFollowthroughPct &&
        input.averageFavorableMovePctAfterReaddBeforeNextExecution >
          (input.averageAdverseMovePctAfterReaddBeforeNextExecution ??
            Number.NEGATIVE_INFINITY) &&
        input.closedToFlat &&
        input.totalPositionDecreaseCount > 0 &&
        input.exitWasNearTradeLow &&
        input.postExitCandleCount > 0 &&
        input.realizedCapturePercentOfTradeMfe !== null &&
        input.realizedCapturePercentOfTradeMfe <= maxRealizedCapture &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.drawdownFromPeakOpenProfitPctOfBasis !== null &&
        input.drawdownFromPeakOpenProfitPctOfBasis >= minDrawdownFromPeakPct &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          readdsAfterRecentDropCount: input.readdsAfterRecentDropCount,
          averageAdverseMovePctAfterPartialExitBeforeReadd:
            input.averageAdverseMovePctAfterPartialExitBeforeReadd,
          readdsWithStrongerFavorableFollowthroughCount:
            input.readdsWithStrongerFavorableFollowthroughCount,
          averageFavorableMovePctAfterReaddBeforeNextExecution:
            input.averageFavorableMovePctAfterReaddBeforeNextExecution,
          averageAdverseMovePctAfterReaddBeforeNextExecution:
            input.averageAdverseMovePctAfterReaddBeforeNextExecution,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          exitWasNearTradeLow: input.exitWasNearTradeLow,
          realizedCapturePercentOfTradeMfe:
            input.realizedCapturePercentOfTradeMfe,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          drawdownFromPeakOpenProfitPctOfBasis:
            input.drawdownFromPeakOpenProfitPctOfBasis,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minPartialExits,
          minReadds,
          minReaddDropCount,
          maxAdverseMoveAfterTrimPct,
          minStrongerFavorableCount,
          minFavorableFollowthroughPct,
          minFavorablePct,
          minNetEndPct,
          minGivebackPct,
          maxRealizedCapture,
          minDrawdownFromPeakPct,
        },
      };
    },
  };

export const REPEATED_RESCUE_ATTEMPTS_WITH_DEFENSIVE_FINAL_EXIT_AFTER_DETERIORATING_REENTRIES: PatternDefinition =
  {
    id: "repeated_rescue_attempts_with_defensive_final_exit_after_deteriorating_reentries",
    name: "Repeated Rescue Attempts With Defensive Final Exit After Deteriorating Re-Entries",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minReaddRunUpCount =
        THRESHOLDS.SCALING_QUALITY.LATE_CHASE_REENTRY_MIN_READD_RUN_UP_COUNT;
      const minFavorableMoveAfterTrimPct =
        THRESHOLDS.SCALING_QUALITY
          .LATE_CHASE_REENTRY_MIN_FAVORABLE_MOVE_AFTER_TRIM_PCT;
      const minStrongerAdverseCount =
        THRESHOLDS.SCALING_QUALITY
          .DETERIORATING_REENTRY_MIN_STRONGER_ADVERSE_COUNT;
      const minAdverseFollowthroughPct =
        THRESHOLDS.SCALING_QUALITY
          .DETERIORATING_REENTRY_MIN_ADVERSE_FOLLOWTHROUGH_PCT;
      const minGivebackPct =
        THRESHOLDS.EXIT_QUALITY
          .DEFENSIVE_EXIT_AFTER_DETERIORATION_MIN_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.readdsAfterRecentRunUpCount >= minReaddRunUpCount &&
        input.averageFavorableMovePctAfterPartialExitBeforeReadd !== null &&
        input.averageFavorableMovePctAfterPartialExitBeforeReadd >=
          minFavorableMoveAfterTrimPct &&
        input.readdsWithStrongerAdverseFollowthroughCount >=
          minStrongerAdverseCount &&
        input.averageAdverseMovePctAfterReaddBeforeNextExecution !== null &&
        input.averageAdverseMovePctAfterReaddBeforeNextExecution >=
          minAdverseFollowthroughPct &&
        input.averageAdverseMovePctAfterReaddBeforeNextExecution >
          (input.averageFavorableMovePctAfterReaddBeforeNextExecution ??
            Number.NEGATIVE_INFINITY) &&
        input.closedToFlat &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          readdsAfterRecentRunUpCount: input.readdsAfterRecentRunUpCount,
          averageFavorableMovePctAfterPartialExitBeforeReadd:
            input.averageFavorableMovePctAfterPartialExitBeforeReadd,
          readdsWithStrongerAdverseFollowthroughCount:
            input.readdsWithStrongerAdverseFollowthroughCount,
          averageAdverseMovePctAfterReaddBeforeNextExecution:
            input.averageAdverseMovePctAfterReaddBeforeNextExecution,
          averageFavorableMovePctAfterReaddBeforeNextExecution:
            input.averageFavorableMovePctAfterReaddBeforeNextExecution,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minPartialExits,
          minReadds,
          minReaddRunUpCount,
          minFavorableMoveAfterTrimPct,
          minStrongerAdverseCount,
          minAdverseFollowthroughPct,
          minGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const REPEATED_TRIM_READD_WITH_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "repeated_trim_readd_with_constructive_final_exit",
    name: "Repeated Trim Re-Add With Constructive Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .MULTI_CYCLE_CONSTRUCTIVE_MAX_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.closedToFlat &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          maxGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const REPEATED_TRIM_READD_WITH_FEARFUL_FINAL_EXIT: PatternDefinition = {
  id: "repeated_trim_readd_with_fearful_final_exit",
  name: "Repeated Trim Re-Add With Fearful Final Exit",
  family: PATTERN_FAMILIES.SCALING_QUALITY,
  patternType: "composite",
  structuralLevel: "storyline_composite",

  evaluate: (input) => {
    const minPartialExits =
      THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
    const minReadds =
      THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
    const minFavorablePct =
      THRESHOLDS.EXIT_QUALITY.MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
    const minNetEndPct =
      THRESHOLDS.EXIT_QUALITY.MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;
    const maxRealizedCapture =
      THRESHOLDS.EXIT_QUALITY.FEARFUL_EXIT_AFTER_WEAKENING_MAX_REALIZED_CAPTURE;

    const matched =
      input.partialExitCount >= minPartialExits &&
      input.readdAfterReductionCount >= minReadds &&
      input.closedToFlat &&
      input.exitWasNearTradeLow &&
      input.realizedCapturePercentOfTradeMfe !== null &&
      input.realizedCapturePercentOfTradeMfe <= maxRealizedCapture &&
      input.postExitCandleCount > 0 &&
      input.maxFavorableMovePctAfterExit !== null &&
      input.maxFavorableMovePctAfterExit >= minFavorablePct &&
      input.netMovePctAtEndOfPostExitWindow !== null &&
      input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
      input.maxFavorableMovePctAfterExit >
        (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

    return {
      matched,
      evidence: {
        partialExitCount: input.partialExitCount,
        readdAfterReductionCount: input.readdAfterReductionCount,
        exitWasNearTradeLow: input.exitWasNearTradeLow,
        realizedCapturePercentOfTradeMfe: input.realizedCapturePercentOfTradeMfe,
        postExitCandleCount: input.postExitCandleCount,
        maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
        maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
        netMovePctAtEndOfPostExitWindow:
          input.netMovePctAtEndOfPostExitWindow,
      },
      thresholdsUsed: {
        minPartialExits,
        minReadds,
        maxRealizedCapture,
        minFavorablePct,
        minNetEndPct,
      },
    };
  },
};

export const REPEATED_TRIM_READD_WITH_DEFENSIVE_FINAL_EXIT_AFTER_DETERIORATION: PatternDefinition =
  {
    id: "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    name: "Repeated Trim Re-Add With Defensive Final Exit After Deterioration",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minGivebackPct =
        THRESHOLDS.EXIT_QUALITY
          .DEFENSIVE_EXIT_AFTER_DETERIORATION_MIN_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.closedToFlat &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          minGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const REPEATED_RESCUE_ATTEMPTS_WITH_DEFENSIVE_FINAL_EXIT_AFTER_DETERIORATION: PatternDefinition =
  {
    id: "repeated_rescue_attempts_with_defensive_final_exit_after_deterioration",
    name: "Repeated Rescue Attempts With Defensive Final Exit After Deterioration",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minGivebackPct =
        THRESHOLDS.EXIT_QUALITY
          .DEFENSIVE_EXIT_AFTER_DETERIORATION_MIN_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.closedToFlat &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          minPeakOpenProfitPctOfBasis,
          minGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const REPEATED_TRIM_READD_WITH_PREMATURE_FINAL_EXIT: PatternDefinition = {
  id: "repeated_trim_readd_with_premature_final_exit",
  name: "Repeated Trim Re-Add With Premature Final Exit",
  family: PATTERN_FAMILIES.SCALING_QUALITY,
  patternType: "composite",
  structuralLevel: "storyline_composite",

  evaluate: (input) => {
    const minPartialExits =
      THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
    const minReadds =
      THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
    const minFavorablePct =
      THRESHOLDS.EXIT_QUALITY.MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
    const minNetEndPct =
      THRESHOLDS.EXIT_QUALITY.MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

    const matched =
      input.partialExitCount >= minPartialExits &&
      input.readdAfterReductionCount >= minReadds &&
      input.closedToFlat &&
      input.postExitCandleCount > 0 &&
      input.maxFavorableMovePctAfterExit !== null &&
      input.maxFavorableMovePctAfterExit >= minFavorablePct &&
      input.netMovePctAtEndOfPostExitWindow !== null &&
      input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
      input.maxFavorableMovePctAfterExit >
        (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

    return {
      matched,
      evidence: {
        partialExitCount: input.partialExitCount,
        readdAfterReductionCount: input.readdAfterReductionCount,
        postExitCandleCount: input.postExitCandleCount,
        maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
        maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
        netMovePctAtEndOfPostExitWindow:
          input.netMovePctAtEndOfPostExitWindow,
      },
      thresholdsUsed: {
        minPartialExits,
        minReadds,
        minFavorablePct,
        minNetEndPct,
      },
    };
  },
};

export const REPEATED_TRIM_READD_WITH_MISSED_FINAL_CONTINUATION: PatternDefinition =
  {
    id: "repeated_trim_readd_with_missed_final_continuation",
    name: "Repeated Trim Re-Add With Missed Final Continuation",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

// =========================
// AGGRESSIVE ADDING WITH FAILED PROFIT PROTECTION
// =========================

export const AGGRESSIVE_ADDING_WITH_FAILED_PROFIT_PROTECTION: PatternDefinition =
  {
    id: "aggressive_adding_with_failed_profit_protection",
    name: "Aggressive Adding With Failed Profit Protection",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const addCount = input.addCountAfterInitialEntry;
      const maxGivebackPct = input.maxGivebackFromPeakOpenProfitPct;
      const peakOpenProfitPctOfBasis = input.peakOpenProfitPctOfBasis;

      const minAddEvents =
        THRESHOLDS.SCALING_QUALITY.AGGRESSIVE_ADDING_MIN_ADD_EVENTS;
      const minGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .AGGRESSIVE_ADDING_FAILED_PROTECTION_MIN_GIVEBACK_PCT;
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .AGGRESSIVE_ADDING_FAILED_PROTECTION_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;

      const matched =
        addCount >= minAddEvents &&
        maxGivebackPct !== null &&
        maxGivebackPct >= minGivebackPct &&
        peakOpenProfitPctOfBasis !== null &&
        peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis;

      return {
        matched,
        evidence: {
          addCountAfterInitialEntry: addCount,
          maxGivebackFromPeakOpenProfitPct: maxGivebackPct,
          peakOpenProfitPctOfBasis,
        },
        thresholdsUsed: {
          minAddEvents,
          minGivebackPct,
          minPeakOpenProfitPctOfBasis,
        },
      };
    },
  };

export const REVENGE_ADDING_AFTER_WEAKNESS: PatternDefinition = {
  id: "revenge_adding_after_weakness",
  name: "Revenge Adding After Weakness",
  family: PATTERN_FAMILIES.SCALING_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const addCount = input.addCountAfterInitialEntry;
    const addBelowBasisCount = input.addBelowPreviousAverageEntryCount;
    const averageAddPct = input.averageAddPriceVsPreviousAverageEntryPct;
    const averageAddRangePosition =
      input.averageAddPricePositionInRecentRangePct;
    const addsWithRecentDropCount = input.addsWithRecentDropCount;
    const averageAddDrop = input.averageAddRecentDropPctBeforeExecution;
    const decreaseCount = input.totalPositionDecreaseCount;

    const minAddEvents =
      THRESHOLDS.SCALING_QUALITY.AGGRESSIVE_ADDING_MIN_ADD_EVENTS;
    const maxRangePosition =
      THRESHOLDS.SCALING_QUALITY.ADD_INTO_WEAKNESS_MAX_RANGE_POSITION;
    const maxAverageAddPct =
      THRESHOLDS.SCALING_QUALITY.ADD_INTO_WEAKNESS_MAX_AVERAGE_PCT;
    const minDropPct =
      THRESHOLDS.SCALING_QUALITY.ADD_AFTER_RECENT_DROP_MIN_PCT;

    const matched =
      addCount >= minAddEvents &&
      decreaseCount === 0 &&
      addBelowBasisCount === addCount &&
      averageAddPct !== null &&
      averageAddPct <= maxAverageAddPct &&
      averageAddRangePosition !== null &&
      averageAddRangePosition <= maxRangePosition &&
      addsWithRecentDropCount > 0 &&
      averageAddDrop !== null &&
      averageAddDrop >= minDropPct;

    return {
      matched,
      evidence: {
        addCountAfterInitialEntry: addCount,
        totalPositionDecreaseCount: decreaseCount,
        addBelowPreviousAverageEntryCount: addBelowBasisCount,
        averageAddPriceVsPreviousAverageEntryPct: averageAddPct,
        averageAddPricePositionInRecentRangePct: averageAddRangePosition,
        addsWithRecentDropCount,
        averageAddRecentDropPctBeforeExecution: averageAddDrop,
      },
      thresholdsUsed: {
        minAddEvents,
        maxRangePosition,
        maxAverageAddPct,
        minDropPct,
      },
    };
  },
};

export const REVENGE_ADDING_WITH_FAILED_PROFIT_PROTECTION: PatternDefinition = {
  id: "revenge_adding_with_failed_profit_protection",
  name: "Revenge Adding With Failed Profit Protection",
  family: PATTERN_FAMILIES.SCALING_QUALITY,
  patternType: "composite",
  structuralLevel: "storyline_composite",

  evaluate: (input) => {
    const addCount = input.addCountAfterInitialEntry;
    const addBelowBasisCount = input.addBelowPreviousAverageEntryCount;
    const averageAddPct = input.averageAddPriceVsPreviousAverageEntryPct;
    const averageAddRangePosition =
      input.averageAddPricePositionInRecentRangePct;
    const addsWithRecentDropCount = input.addsWithRecentDropCount;
    const averageAddDrop = input.averageAddRecentDropPctBeforeExecution;
    const decreaseCount = input.totalPositionDecreaseCount;
    const maxGivebackPct = input.maxGivebackFromPeakOpenProfitPct;
    const peakOpenProfitPctOfBasis = input.peakOpenProfitPctOfBasis;

    const minAddEvents =
      THRESHOLDS.SCALING_QUALITY.AGGRESSIVE_ADDING_MIN_ADD_EVENTS;
    const maxRangePosition =
      THRESHOLDS.SCALING_QUALITY.ADD_INTO_WEAKNESS_MAX_RANGE_POSITION;
    const maxAverageAddPct =
      THRESHOLDS.SCALING_QUALITY.ADD_INTO_WEAKNESS_MAX_AVERAGE_PCT;
    const minDropPct =
      THRESHOLDS.SCALING_QUALITY.ADD_AFTER_RECENT_DROP_MIN_PCT;
    const minGivebackPct =
      THRESHOLDS.SCALING_QUALITY
        .AGGRESSIVE_ADDING_FAILED_PROTECTION_MIN_GIVEBACK_PCT;
    const minPeakOpenProfitPctOfBasis =
      THRESHOLDS.SCALING_QUALITY
        .AGGRESSIVE_ADDING_FAILED_PROTECTION_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;

    const matched =
      addCount >= minAddEvents &&
      decreaseCount === 0 &&
      addBelowBasisCount === addCount &&
      averageAddPct !== null &&
      averageAddPct <= maxAverageAddPct &&
      averageAddRangePosition !== null &&
      averageAddRangePosition <= maxRangePosition &&
      addsWithRecentDropCount > 0 &&
      averageAddDrop !== null &&
      averageAddDrop >= minDropPct &&
      maxGivebackPct !== null &&
      maxGivebackPct >= minGivebackPct &&
      peakOpenProfitPctOfBasis !== null &&
      peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis;

    return {
      matched,
      evidence: {
        addCountAfterInitialEntry: addCount,
        totalPositionDecreaseCount: decreaseCount,
        addBelowPreviousAverageEntryCount: addBelowBasisCount,
        averageAddPriceVsPreviousAverageEntryPct: averageAddPct,
        averageAddPricePositionInRecentRangePct: averageAddRangePosition,
        addsWithRecentDropCount,
        averageAddRecentDropPctBeforeExecution: averageAddDrop,
        maxGivebackFromPeakOpenProfitPct: maxGivebackPct,
        peakOpenProfitPctOfBasis,
      },
      thresholdsUsed: {
        minAddEvents,
        maxRangePosition,
        maxAverageAddPct,
        minDropPct,
        minGivebackPct,
        minPeakOpenProfitPctOfBasis,
      },
    };
  },
};

export const ADD_INTO_RESISTANCE_STRUCTURE: PatternDefinition = {
  id: "add_into_resistance_structure",
  name: "Add Into Resistance Structure",
  family: PATTERN_FAMILIES.SCALING_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const matched =
      input.hadSupportResistanceContextAvailable &&
      input.addCountAfterInitialEntry >= 1 &&
      input.addsNearResistanceCount >= 1;

    return {
      matched,
      evidence: {
        hadSupportResistanceContextAvailable:
          input.hadSupportResistanceContextAvailable,
        addCountAfterInitialEntry: input.addCountAfterInitialEntry,
        addsNearResistanceCount: input.addsNearResistanceCount,
        addsAboveResistanceCount: input.addsAboveResistanceCount,
        averageAddDistanceToNearestResistancePct:
          input.averageAddDistanceToNearestResistancePct,
      },
        thresholdsUsed: {
          minAddCountAfterInitialEntry: 1,
          minAddsNearResistanceCount: 1,
        },
      };
    },
  };

export const ADD_ABOVE_RESISTANCE_STRUCTURE: PatternDefinition = {
  id: "add_above_resistance_structure",
  name: "Add Above Resistance Structure",
  family: PATTERN_FAMILIES.SCALING_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const matched =
      input.hadSupportResistanceContextAvailable &&
      input.addCountAfterInitialEntry >= 1 &&
      input.addsAboveResistanceWithRoomCount >= 1;

    return {
      matched,
      evidence: {
        hadSupportResistanceContextAvailable:
          input.hadSupportResistanceContextAvailable,
        addCountAfterInitialEntry: input.addCountAfterInitialEntry,
        addsAboveResistanceCount: input.addsAboveResistanceCount,
        addsAboveResistanceWithRoomCount:
          input.addsAboveResistanceWithRoomCount,
        averageAddRoomToNextResistancePct:
          input.averageAddRoomToNextResistancePct,
      },
      thresholdsUsed: {
        minAddCountAfterInitialEntry: 1,
        minAddsAboveResistanceWithRoomCount: 1,
      },
    };
  },
};

export const ADD_ABOVE_RESISTANCE_WITH_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "add_above_resistance_with_constructive_final_exit",
    name: "Add Above Resistance With Constructive Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .BALANCED_WITH_PROFIT_PROTECTION_MAX_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.hadSupportResistanceContextAvailable &&
        input.addCountAfterInitialEntry >= 1 &&
        input.addsAboveResistanceWithRoomCount >= 1 &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadSupportResistanceContextAvailable:
            input.hadSupportResistanceContextAvailable,
          addCountAfterInitialEntry: input.addCountAfterInitialEntry,
          addsAboveResistanceWithRoomCount:
            input.addsAboveResistanceWithRoomCount,
          averageAddRoomToNextResistancePct:
            input.averageAddRoomToNextResistancePct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          maxGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const ADD_ABOVE_RESISTANCE_WITH_FAILED_PROFIT_PROTECTION: PatternDefinition =
  {
    id: "add_above_resistance_with_failed_profit_protection",
    name: "Add Above Resistance With Failed Profit Protection",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .AGGRESSIVE_ADDING_FAILED_PROTECTION_MIN_GIVEBACK_PCT;
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .AGGRESSIVE_ADDING_FAILED_PROTECTION_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;

      const matched =
        input.hadSupportResistanceContextAvailable &&
        input.addCountAfterInitialEntry >= 1 &&
        input.addsAboveResistanceWithRoomCount >= 1 &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis;

      return {
        matched,
        evidence: {
          hadSupportResistanceContextAvailable:
            input.hadSupportResistanceContextAvailable,
          addCountAfterInitialEntry: input.addCountAfterInitialEntry,
          addsAboveResistanceWithRoomCount:
            input.addsAboveResistanceWithRoomCount,
          averageAddRoomToNextResistancePct:
            input.averageAddRoomToNextResistancePct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
        },
        thresholdsUsed: {
          minGivebackPct,
          minPeakOpenProfitPctOfBasis,
        },
      };
    },
  };

export const RECOVERY_WITH_ADD_ABOVE_RESISTANCE_AND_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "recovery_with_add_above_resistance_and_constructive_final_exit",
    name: "Recovery With Add Above Resistance And Constructive Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .BALANCED_WITH_PROFIT_PROTECTION_MAX_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.hadSupportResistanceContextAvailable &&
        input.addCountAfterInitialEntry >= 1 &&
        input.addsAboveResistanceWithRoomCount >= 1 &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          realizedReturnPct: input.realizedReturnPct,
          hadSupportResistanceContextAvailable:
            input.hadSupportResistanceContextAvailable,
          addCountAfterInitialEntry: input.addCountAfterInitialEntry,
          addsAboveResistanceWithRoomCount:
            input.addsAboveResistanceWithRoomCount,
          averageAddRoomToNextResistancePct:
            input.averageAddRoomToNextResistancePct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          maxGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const RECOVERY_WITH_ADD_ABOVE_RESISTANCE_AND_FAILED_PROFIT_PROTECTION: PatternDefinition =
  {
    id: "recovery_with_add_above_resistance_and_failed_profit_protection",
    name: "Recovery With Add Above Resistance And Failed Profit Protection",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minRecoveryPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .AGGRESSIVE_ADDING_FAILED_PROTECTION_MIN_GIVEBACK_PCT;
      const minPeakOpenProfitForFailurePctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .AGGRESSIVE_ADDING_FAILED_PROTECTION_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minRecoveryPeakOpenProfitPctOfBasis &&
        input.hadSupportResistanceContextAvailable &&
        input.addCountAfterInitialEntry >= 1 &&
        input.addsAboveResistanceWithRoomCount >= 1 &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitForFailurePctOfBasis;

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          hadSupportResistanceContextAvailable:
            input.hadSupportResistanceContextAvailable,
          addCountAfterInitialEntry: input.addCountAfterInitialEntry,
          addsAboveResistanceWithRoomCount:
            input.addsAboveResistanceWithRoomCount,
          averageAddRoomToNextResistancePct:
            input.averageAddRoomToNextResistancePct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
        },
        thresholdsUsed: {
          minRecoveryPeakOpenProfitPctOfBasis,
          minGivebackPct,
          minPeakOpenProfitForFailurePctOfBasis,
        },
      };
    },
  };

export const REPEATED_ADDS_ABOVE_RESISTANCE_WITH_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "repeated_adds_above_resistance_with_constructive_final_exit",
    name: "Repeated Adds Above Resistance With Constructive Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .BALANCED_WITH_PROFIT_PROTECTION_MAX_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.hadSupportResistanceContextAvailable &&
        input.addCountAfterInitialEntry >= 2 &&
        input.addsAboveResistanceWithRoomCount >= 2 &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadSupportResistanceContextAvailable:
            input.hadSupportResistanceContextAvailable,
          addCountAfterInitialEntry: input.addCountAfterInitialEntry,
          addsAboveResistanceCount: input.addsAboveResistanceCount,
          addsAboveResistanceWithRoomCount:
            input.addsAboveResistanceWithRoomCount,
          averageAddRoomToNextResistancePct:
            input.averageAddRoomToNextResistancePct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minAddCountAfterInitialEntry: 2,
          minAddsAboveResistanceWithRoomCount: 2,
          maxGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const REPEATED_ADDS_ABOVE_RESISTANCE_WITH_FAILED_PROFIT_PROTECTION: PatternDefinition =
  {
    id: "repeated_adds_above_resistance_with_failed_profit_protection",
    name: "Repeated Adds Above Resistance With Failed Profit Protection",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .AGGRESSIVE_ADDING_FAILED_PROTECTION_MIN_GIVEBACK_PCT;
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .AGGRESSIVE_ADDING_FAILED_PROTECTION_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;

      const matched =
        input.hadSupportResistanceContextAvailable &&
        input.addCountAfterInitialEntry >= 2 &&
        input.addsAboveResistanceWithRoomCount >= 2 &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis;

      return {
        matched,
        evidence: {
          hadSupportResistanceContextAvailable:
            input.hadSupportResistanceContextAvailable,
          addCountAfterInitialEntry: input.addCountAfterInitialEntry,
          addsAboveResistanceCount: input.addsAboveResistanceCount,
          addsAboveResistanceWithRoomCount:
            input.addsAboveResistanceWithRoomCount,
          averageAddRoomToNextResistancePct:
            input.averageAddRoomToNextResistancePct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
        },
        thresholdsUsed: {
          minAddCountAfterInitialEntry: 2,
          minAddsAboveResistanceWithRoomCount: 2,
          minGivebackPct,
          minPeakOpenProfitPctOfBasis,
        },
      };
    },
  };

export const TRIM_INTO_RESISTANCE_WITH_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "trim_into_resistance_with_constructive_final_exit",
    name: "Trim Into Resistance With Constructive Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minAverageReductionPct =
        THRESHOLDS.POSITION_REDUCTION.ABOVE_BASIS_MIN_AVERAGE_PCT;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .BALANCED_WITH_PROFIT_PROTECTION_MAX_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.hadSupportResistanceContextAvailable &&
        input.hadPartialExit &&
        input.totalPositionDecreaseCount > 0 &&
        input.reductionsNearResistanceCount > 0 &&
        input.averageReductionPriceVsPreviousAverageEntryPct !== null &&
        input.averageReductionPriceVsPreviousAverageEntryPct >=
          minAverageReductionPct &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadSupportResistanceContextAvailable:
            input.hadSupportResistanceContextAvailable,
          hadPartialExit: input.hadPartialExit,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          reductionsNearResistanceCount: input.reductionsNearResistanceCount,
          averageReductionPriceVsPreviousAverageEntryPct:
            input.averageReductionPriceVsPreviousAverageEntryPct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minAverageReductionPct,
          maxGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const TRIM_INTO_RESISTANCE_WITH_PREMATURE_FINAL_EXIT: PatternDefinition =
  {
    id: "trim_into_resistance_with_premature_final_exit",
    name: "Trim Into Resistance With Premature Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minAverageReductionPct =
        THRESHOLDS.POSITION_REDUCTION.ABOVE_BASIS_MIN_AVERAGE_PCT;
      const maxGivebackPct =
        THRESHOLDS.EXIT_QUALITY.PREMATURE_FINAL_EXIT_MAX_GIVEBACK_PCT;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.hadSupportResistanceContextAvailable &&
        input.hadPartialExit &&
        input.totalPositionDecreaseCount > 0 &&
        input.reductionsNearResistanceCount > 0 &&
        input.averageReductionPriceVsPreviousAverageEntryPct !== null &&
        input.averageReductionPriceVsPreviousAverageEntryPct >=
          minAverageReductionPct &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadSupportResistanceContextAvailable:
            input.hadSupportResistanceContextAvailable,
          hadPartialExit: input.hadPartialExit,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          reductionsNearResistanceCount: input.reductionsNearResistanceCount,
          averageReductionPriceVsPreviousAverageEntryPct:
            input.averageReductionPriceVsPreviousAverageEntryPct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minAverageReductionPct,
          maxGivebackPct,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const BALANCED_MANAGEMENT_WITH_TAKE_PROFIT_INTO_RESISTANCE_AND_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "balanced_management_with_take_profit_into_resistance_and_constructive_final_exit",
    name: "Balanced Management With Take Profit Into Resistance And Constructive Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minIncreases =
        THRESHOLDS.SCALING_QUALITY.BALANCED_MIN_INCREASES;
      const minDecreases =
        THRESHOLDS.SCALING_QUALITY.BALANCED_MIN_DECREASES;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .BALANCED_WITH_PROFIT_PROTECTION_MAX_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.hadSupportResistanceContextAvailable &&
        input.hadPartialExit &&
        input.totalPositionIncreaseCount >= minIncreases &&
        input.totalPositionDecreaseCount >= minDecreases &&
        input.reductionsNearResistanceCount > 0 &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadSupportResistanceContextAvailable:
            input.hadSupportResistanceContextAvailable,
          hadPartialExit: input.hadPartialExit,
          totalPositionIncreaseCount: input.totalPositionIncreaseCount,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          reductionsNearResistanceCount: input.reductionsNearResistanceCount,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minIncreases,
          minDecreases,
          maxGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const BALANCED_MANAGEMENT_WITH_TAKE_PROFIT_INTO_RESISTANCE_AND_PREMATURE_FINAL_EXIT: PatternDefinition =
  {
    id: "balanced_management_with_take_profit_into_resistance_and_premature_final_exit",
    name: "Balanced Management With Take Profit Into Resistance And Premature Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minIncreases =
        THRESHOLDS.SCALING_QUALITY.BALANCED_MIN_INCREASES;
      const minDecreases =
        THRESHOLDS.SCALING_QUALITY.BALANCED_MIN_DECREASES;
      const maxGivebackPct =
        THRESHOLDS.EXIT_QUALITY.PREMATURE_FINAL_EXIT_MAX_GIVEBACK_PCT;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.hadSupportResistanceContextAvailable &&
        input.hadPartialExit &&
        input.totalPositionIncreaseCount >= minIncreases &&
        input.totalPositionDecreaseCount >= minDecreases &&
        input.reductionsNearResistanceCount > 0 &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadSupportResistanceContextAvailable:
            input.hadSupportResistanceContextAvailable,
          hadPartialExit: input.hadPartialExit,
          totalPositionIncreaseCount: input.totalPositionIncreaseCount,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          reductionsNearResistanceCount: input.reductionsNearResistanceCount,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minIncreases,
          minDecreases,
          maxGivebackPct,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const RECOVERY_WITH_TRIM_INTO_RESISTANCE_AND_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "recovery_with_trim_into_resistance_and_constructive_final_exit",
    name: "Recovery With Trim Into Resistance And Constructive Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minAverageReductionPct =
        THRESHOLDS.POSITION_REDUCTION.ABOVE_BASIS_MIN_AVERAGE_PCT;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .BALANCED_WITH_PROFIT_PROTECTION_MAX_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.hadSupportResistanceContextAvailable &&
        input.hadPartialExit &&
        input.totalPositionDecreaseCount > 0 &&
        input.reductionsNearResistanceCount > 0 &&
        input.averageReductionPriceVsPreviousAverageEntryPct !== null &&
        input.averageReductionPriceVsPreviousAverageEntryPct >=
          minAverageReductionPct &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          realizedReturnPct: input.realizedReturnPct,
          hadSupportResistanceContextAvailable:
            input.hadSupportResistanceContextAvailable,
          hadPartialExit: input.hadPartialExit,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          reductionsNearResistanceCount: input.reductionsNearResistanceCount,
          averageReductionPriceVsPreviousAverageEntryPct:
            input.averageReductionPriceVsPreviousAverageEntryPct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minAverageReductionPct,
          maxGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const RECOVERY_WITH_TRIM_INTO_RESISTANCE_AND_PREMATURE_FINAL_EXIT: PatternDefinition =
  {
    id: "recovery_with_trim_into_resistance_and_premature_final_exit",
    name: "Recovery With Trim Into Resistance And Premature Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minAverageReductionPct =
        THRESHOLDS.POSITION_REDUCTION.ABOVE_BASIS_MIN_AVERAGE_PCT;
      const maxGivebackPct =
        THRESHOLDS.EXIT_QUALITY.PREMATURE_FINAL_EXIT_MAX_GIVEBACK_PCT;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.hadSupportResistanceContextAvailable &&
        input.hadPartialExit &&
        input.totalPositionDecreaseCount > 0 &&
        input.reductionsNearResistanceCount > 0 &&
        input.averageReductionPriceVsPreviousAverageEntryPct !== null &&
        input.averageReductionPriceVsPreviousAverageEntryPct >=
          minAverageReductionPct &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          realizedReturnPct: input.realizedReturnPct,
          hadSupportResistanceContextAvailable:
            input.hadSupportResistanceContextAvailable,
          hadPartialExit: input.hadPartialExit,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          reductionsNearResistanceCount: input.reductionsNearResistanceCount,
          averageReductionPriceVsPreviousAverageEntryPct:
            input.averageReductionPriceVsPreviousAverageEntryPct,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minAverageReductionPct,
          maxGivebackPct,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const RECOVERY_WITH_BALANCED_MANAGEMENT_AND_TAKE_PROFIT_INTO_RESISTANCE_AND_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "recovery_with_balanced_management_and_take_profit_into_resistance_and_constructive_final_exit",
    name: "Recovery With Balanced Management And Take Profit Into Resistance And Constructive Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minIncreases =
        THRESHOLDS.SCALING_QUALITY.BALANCED_MIN_INCREASES;
      const minDecreases =
        THRESHOLDS.SCALING_QUALITY.BALANCED_MIN_DECREASES;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .BALANCED_WITH_PROFIT_PROTECTION_MAX_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.hadSupportResistanceContextAvailable &&
        input.hadPartialExit &&
        input.totalPositionIncreaseCount >= minIncreases &&
        input.totalPositionDecreaseCount >= minDecreases &&
        input.reductionsNearResistanceCount > 0 &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          realizedReturnPct: input.realizedReturnPct,
          hadSupportResistanceContextAvailable:
            input.hadSupportResistanceContextAvailable,
          hadPartialExit: input.hadPartialExit,
          totalPositionIncreaseCount: input.totalPositionIncreaseCount,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          reductionsNearResistanceCount: input.reductionsNearResistanceCount,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minIncreases,
          minDecreases,
          maxGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const RECOVERY_WITH_BALANCED_MANAGEMENT_AND_TAKE_PROFIT_INTO_RESISTANCE_AND_PREMATURE_FINAL_EXIT: PatternDefinition =
  {
    id: "recovery_with_balanced_management_and_take_profit_into_resistance_and_premature_final_exit",
    name: "Recovery With Balanced Management And Take Profit Into Resistance And Premature Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minIncreases =
        THRESHOLDS.SCALING_QUALITY.BALANCED_MIN_INCREASES;
      const minDecreases =
        THRESHOLDS.SCALING_QUALITY.BALANCED_MIN_DECREASES;
      const maxGivebackPct =
        THRESHOLDS.EXIT_QUALITY.PREMATURE_FINAL_EXIT_MAX_GIVEBACK_PCT;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.realizedReturnPct !== null &&
        input.realizedReturnPct > 0 &&
        input.hadSupportResistanceContextAvailable &&
        input.hadPartialExit &&
        input.totalPositionIncreaseCount >= minIncreases &&
        input.totalPositionDecreaseCount >= minDecreases &&
        input.reductionsNearResistanceCount > 0 &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          realizedReturnPct: input.realizedReturnPct,
          hadSupportResistanceContextAvailable:
            input.hadSupportResistanceContextAvailable,
          hadPartialExit: input.hadPartialExit,
          totalPositionIncreaseCount: input.totalPositionIncreaseCount,
          totalPositionDecreaseCount: input.totalPositionDecreaseCount,
          reductionsNearResistanceCount: input.reductionsNearResistanceCount,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          closedToFlat: input.closedToFlat,
          postExitCandleCount: input.postExitCandleCount,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minIncreases,
          minDecreases,
          maxGivebackPct,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const REPEATED_BALANCED_MANAGEMENT_WITH_EXIT_INTO_STACKED_SUPPORT_AND_RELIEF: PatternDefinition =
  {
    id: "repeated_balanced_management_with_exit_into_stacked_support_and_relief",
    name: "Repeated Balanced Management With Exit Into Stacked Support And Relief",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;

      const matched =
        input.hadSupportResistanceContextAvailable &&
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.finalExitOccurredNearSupport &&
        input.finalExitHasStackedSupportBelow &&
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
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          finalExitOccurredNearSupport: input.finalExitOccurredNearSupport,
          finalExitHasStackedSupportBelow: input.finalExitHasStackedSupportBelow,
          finalExitSupportLevelsBelowWithinClusterCount:
            input.finalExitSupportLevelsBelowWithinClusterCount,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          minMaxFavorableMovePctAfterExit: 0.02,
          minNetMovePctAtEndOfPostExitWindow: 0,
        },
      };
    },
  };

export const REPEATED_BALANCED_MANAGEMENT_WITH_EXIT_INTO_THIN_SUPPORT_BEFORE_BREAKDOWN: PatternDefinition =
  {
    id: "repeated_balanced_management_with_exit_into_thin_support_before_breakdown",
    name: "Repeated Balanced Management With Exit Into Thin Support Before Breakdown",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;

      const matched =
        input.hadSupportResistanceContextAvailable &&
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.finalExitOccurredNearSupport &&
        !input.finalExitHasStackedSupportBelow &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= 0.02 &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow < 0 &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadSupportResistanceContextAvailable:
            input.hadSupportResistanceContextAvailable,
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          finalExitOccurredNearSupport: input.finalExitOccurredNearSupport,
          finalExitHasStackedSupportBelow: input.finalExitHasStackedSupportBelow,
          finalExitSupportLevelsBelowWithinClusterCount:
            input.finalExitSupportLevelsBelowWithinClusterCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          minMaxAdverseMovePctAfterExit: 0.02,
          maxNetMovePctAtEndOfPostExitWindow: 0,
        },
      };
    },
  };

export const REPEATED_BALANCED_MANAGEMENT_WITH_TRIM_INTO_RESISTANCE_AND_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "repeated_balanced_management_with_trim_into_resistance_and_constructive_final_exit",
    name: "Repeated Balanced Management With Trim Into Resistance And Constructive Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .MULTI_CYCLE_CONSTRUCTIVE_MAX_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.hadSupportResistanceContextAvailable &&
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.reductionsNearResistanceCount >= minPartialExits &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadSupportResistanceContextAvailable:
            input.hadSupportResistanceContextAvailable,
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          reductionsNearResistanceCount: input.reductionsNearResistanceCount,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          maxGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const REPEATED_BALANCED_MANAGEMENT_WITH_TRIM_INTO_RESISTANCE_AND_PREMATURE_FINAL_EXIT: PatternDefinition =
  {
    id: "repeated_balanced_management_with_trim_into_resistance_and_premature_final_exit",
    name: "Repeated Balanced Management With Trim Into Resistance And Premature Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const maxGivebackPct =
        THRESHOLDS.EXIT_QUALITY.PREMATURE_FINAL_EXIT_MAX_GIVEBACK_PCT;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.hadSupportResistanceContextAvailable &&
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.reductionsNearResistanceCount >= minPartialExits &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadSupportResistanceContextAvailable:
            input.hadSupportResistanceContextAvailable,
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          reductionsNearResistanceCount: input.reductionsNearResistanceCount,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          maxGivebackPct,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const REPEATED_BALANCED_MANAGEMENT_WITH_TAKE_PROFIT_INTO_RESISTANCE_AND_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "repeated_balanced_management_with_take_profit_into_resistance_and_constructive_final_exit",
    name: "Repeated Balanced Management With Take Profit Into Resistance And Constructive Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .MULTI_CYCLE_CONSTRUCTIVE_MAX_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.hadSupportResistanceContextAvailable &&
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.reductionsNearResistanceCount >= 1 &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadSupportResistanceContextAvailable:
            input.hadSupportResistanceContextAvailable,
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          reductionsNearResistanceCount: input.reductionsNearResistanceCount,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          maxGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const REPEATED_BALANCED_MANAGEMENT_WITH_TAKE_PROFIT_INTO_RESISTANCE_AND_PREMATURE_FINAL_EXIT: PatternDefinition =
  {
    id: "repeated_balanced_management_with_take_profit_into_resistance_and_premature_final_exit",
    name: "Repeated Balanced Management With Take Profit Into Resistance And Premature Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const maxGivebackPct =
        THRESHOLDS.EXIT_QUALITY.PREMATURE_FINAL_EXIT_MAX_GIVEBACK_PCT;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.hadSupportResistanceContextAvailable &&
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.reductionsNearResistanceCount >= 1 &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadSupportResistanceContextAvailable:
            input.hadSupportResistanceContextAvailable,
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          reductionsNearResistanceCount: input.reductionsNearResistanceCount,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPartialExits,
          minReadds,
          maxGivebackPct,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const REPEATED_RESCUE_ATTEMPTS_WITH_BALANCED_MANAGEMENT_AND_EXIT_INTO_STACKED_SUPPORT_AND_RELIEF: PatternDefinition =
  {
    id: "repeated_rescue_attempts_with_balanced_management_and_exit_into_stacked_support_and_relief",
    name: "Repeated Rescue Attempts With Balanced Management And Exit Into Stacked Support And Relief",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.hadSupportResistanceContextAvailable &&
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.finalExitOccurredNearSupport &&
        input.finalExitHasStackedSupportBelow &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= 0.02 &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= 0 &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          hadSupportResistanceContextAvailable:
            input.hadSupportResistanceContextAvailable,
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          finalExitOccurredNearSupport: input.finalExitOccurredNearSupport,
          finalExitHasStackedSupportBelow: input.finalExitHasStackedSupportBelow,
          finalExitSupportLevelsBelowWithinClusterCount:
            input.finalExitSupportLevelsBelowWithinClusterCount,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minPartialExits,
          minReadds,
          minMaxFavorableMovePctAfterExit: 0.02,
          minNetMovePctAtEndOfPostExitWindow: 0,
        },
      };
    },
  };

export const REPEATED_RESCUE_ATTEMPTS_WITH_BALANCED_MANAGEMENT_AND_EXIT_INTO_THIN_SUPPORT_BEFORE_BREAKDOWN: PatternDefinition =
  {
    id: "repeated_rescue_attempts_with_balanced_management_and_exit_into_thin_support_before_breakdown",
    name: "Repeated Rescue Attempts With Balanced Management And Exit Into Thin Support Before Breakdown",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.hadSupportResistanceContextAvailable &&
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.finalExitOccurredNearSupport &&
        !input.finalExitHasStackedSupportBelow &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= 0.02 &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow < 0 &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          hadSupportResistanceContextAvailable:
            input.hadSupportResistanceContextAvailable,
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          finalExitOccurredNearSupport: input.finalExitOccurredNearSupport,
          finalExitHasStackedSupportBelow: input.finalExitHasStackedSupportBelow,
          finalExitSupportLevelsBelowWithinClusterCount:
            input.finalExitSupportLevelsBelowWithinClusterCount,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minPartialExits,
          minReadds,
          minMaxAdverseMovePctAfterExit: 0.02,
          maxNetMovePctAtEndOfPostExitWindow: 0,
        },
      };
    },
  };

export const REPEATED_RESCUE_ATTEMPTS_WITH_BALANCED_MANAGEMENT_AND_TRIM_INTO_RESISTANCE_AND_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "repeated_rescue_attempts_with_balanced_management_and_trim_into_resistance_and_constructive_final_exit",
    name: "Repeated Rescue Attempts With Balanced Management And Trim Into Resistance And Constructive Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .MULTI_CYCLE_CONSTRUCTIVE_MAX_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.hadSupportResistanceContextAvailable &&
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.reductionsNearResistanceCount >= minPartialExits &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          reductionsNearResistanceCount: input.reductionsNearResistanceCount,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minPartialExits,
          minReadds,
          maxGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const REPEATED_RESCUE_ATTEMPTS_WITH_BALANCED_MANAGEMENT_AND_TRIM_INTO_RESISTANCE_AND_PREMATURE_FINAL_EXIT: PatternDefinition =
  {
    id: "repeated_rescue_attempts_with_balanced_management_and_trim_into_resistance_and_premature_final_exit",
    name: "Repeated Rescue Attempts With Balanced Management And Trim Into Resistance And Premature Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const maxGivebackPct =
        THRESHOLDS.EXIT_QUALITY.PREMATURE_FINAL_EXIT_MAX_GIVEBACK_PCT;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.hadSupportResistanceContextAvailable &&
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.reductionsNearResistanceCount >= minPartialExits &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          reductionsNearResistanceCount: input.reductionsNearResistanceCount,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minPartialExits,
          minReadds,
          maxGivebackPct,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const REPEATED_RESCUE_ATTEMPTS_WITH_BALANCED_MANAGEMENT_AND_TAKE_PROFIT_INTO_RESISTANCE_AND_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "repeated_rescue_attempts_with_balanced_management_and_take_profit_into_resistance_and_constructive_final_exit",
    name: "Repeated Rescue Attempts With Balanced Management And Take Profit Into Resistance And Constructive Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .MULTI_CYCLE_CONSTRUCTIVE_MAX_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.hadSupportResistanceContextAvailable &&
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.reductionsNearResistanceCount >= 1 &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxAdverseMovePctAfterExit !== null &&
        input.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.maxAdverseMovePctAfterExit >
          (input.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          reductionsNearResistanceCount: input.reductionsNearResistanceCount,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minPartialExits,
          minReadds,
          maxGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const REPEATED_RESCUE_ATTEMPTS_WITH_BALANCED_MANAGEMENT_AND_TAKE_PROFIT_INTO_RESISTANCE_AND_PREMATURE_FINAL_EXIT: PatternDefinition =
  {
    id: "repeated_rescue_attempts_with_balanced_management_and_take_profit_into_resistance_and_premature_final_exit",
    name: "Repeated Rescue Attempts With Balanced Management And Take Profit Into Resistance And Premature Final Exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPartialExits =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_PARTIAL_EXITS;
      const minReadds =
        THRESHOLDS.SCALING_QUALITY.MULTI_CYCLE_MIN_READD_COUNT;
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const maxGivebackPct =
        THRESHOLDS.EXIT_QUALITY.PREMATURE_FINAL_EXIT_MAX_GIVEBACK_PCT;
      const minFavorablePct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_FAVORABLE_PCT;
      const minNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .MISSED_POST_EXIT_CONTINUATION_MIN_NET_END_PCT;

      const matched =
        input.hadOpenLossBeforePeakOpenProfit &&
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.peakOpenProfitPctOfBasis !== null &&
        input.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.hadSupportResistanceContextAvailable &&
        input.partialExitCount >= minPartialExits &&
        input.readdAfterReductionCount >= minReadds &&
        input.reductionsNearResistanceCount >= 1 &&
        input.maxGivebackFromPeakOpenProfitPct !== null &&
        input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.closedToFlat &&
        input.postExitCandleCount > 0 &&
        input.maxFavorableMovePctAfterExit !== null &&
        input.maxFavorableMovePctAfterExit >= minFavorablePct &&
        input.netMovePctAtEndOfPostExitWindow !== null &&
        input.netMovePctAtEndOfPostExitWindow >= minNetEndPct &&
        input.maxFavorableMovePctAfterExit >
          (input.maxAdverseMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.hadOpenLossBeforePeakOpenProfit,
          hadPeakOpenProfitBeforeWorstDrawdown:
            input.hadPeakOpenProfitBeforeWorstDrawdown,
          peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
          partialExitCount: input.partialExitCount,
          readdAfterReductionCount: input.readdAfterReductionCount,
          reductionsNearResistanceCount: input.reductionsNearResistanceCount,
          maxGivebackFromPeakOpenProfitPct:
            input.maxGivebackFromPeakOpenProfitPct,
          maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
          maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minPartialExits,
          minReadds,
          maxGivebackPct,
          minFavorablePct,
          minNetEndPct,
        },
      };
    },
  };

export const READD_AFTER_DELAYED_RISK_RESPONSE: PatternDefinition = {
  id: "readd_after_delayed_risk_response",
  name: "Re-Add After Delayed Risk Response",
  family: PATTERN_FAMILIES.SCALING_QUALITY,
  patternType: "composite",
  structuralLevel: "storyline_composite",

  evaluate: (input) => {
    const minGivebackPct =
      THRESHOLDS.SCALING_QUALITY
        .READD_AFTER_DELAYED_RISK_RESPONSE_MIN_GIVEBACK_PCT;
    const minSecondsToFirstReduction =
      THRESHOLDS.POSITION_REDUCTION
        .DELAYED_RISK_RESPONSE_MIN_SECONDS_TO_FIRST_REDUCTION;
    const minDrawdownFromPeakPctOfBasis =
      THRESHOLDS.POSITION_REDUCTION
        .DELAYED_RISK_RESPONSE_MIN_DRAWDOWN_FROM_PEAK_PCT_OF_BASIS;

    const matched =
      input.hadPeakOpenProfitBeforeWorstDrawdown &&
      input.drawdownFromPeakOpenProfitPctOfBasis !== null &&
      input.drawdownFromPeakOpenProfitPctOfBasis >=
        minDrawdownFromPeakPctOfBasis &&
      input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
      input.secondsFromPeakOpenProfitToFirstReduction !== null &&
      input.secondsFromPeakOpenProfitToFirstReduction >=
        minSecondsToFirstReduction &&
      input.hadReaddAfterReduction &&
      input.maxGivebackFromPeakOpenProfitPct !== null &&
      input.maxGivebackFromPeakOpenProfitPct >= minGivebackPct;

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
        hadReaddAfterReduction: input.hadReaddAfterReduction,
        maxGivebackFromPeakOpenProfitPct:
          input.maxGivebackFromPeakOpenProfitPct,
      },
      thresholdsUsed: {
        minDrawdownFromPeakPctOfBasis,
        minSecondsToFirstReduction,
        minGivebackPct,
      },
    };
  },
};

export const SCALING_QUALITY_PATTERNS: PatternDefinition[] = [
  STRUCTURED_POSITION_BUILDING,
  BALANCED_POSITION_MANAGEMENT,
  ONE_SIDED_AGGRESSIVE_BUILDING,
  UNDERUTILIZED_POSITION_BUILDING,
  UNDERUTILIZED_WINNER_WITH_CONSTRUCTIVE_EXIT,
  RECOVERY_TO_UNDERUTILIZED_WINNER_WITH_CONSTRUCTIVE_EXIT,
  UNDERUTILIZED_WINNER_WITH_TIMELY_PROFIT_PROTECTION_AND_CONSTRUCTIVE_EXIT,
  UNDERUTILIZED_WINNER_WITH_PREMATURE_FINAL_EXIT,
  RECOVERY_TO_UNDERUTILIZED_WINNER_WITH_TIMELY_PROFIT_PROTECTION_AND_CONSTRUCTIVE_EXIT,
  RECOVERY_TO_UNDERUTILIZED_WINNER_WITH_PREMATURE_FINAL_EXIT,
  UNDERUTILIZED_WINNER_WITH_MISSED_FINAL_CONTINUATION,
  RECOVERY_TO_UNDERUTILIZED_WINNER_WITH_MISSED_FINAL_CONTINUATION,
  READD_AFTER_REDUCTION,
  ADDING_ABOVE_PRIOR_BASIS,
  ADD_INTO_STRENGTH,
  ADD_INTO_WEAKNESS,
  ADD_AFTER_RECENT_RUN_UP,
  ADD_AFTER_RECENT_DROP,
  REVENGE_ADDING_AFTER_WEAKNESS,
  BALANCED_SCALING_WITH_PROFIT_PROTECTION,
  ADD_INTO_STRENGTH_WITH_CONSTRUCTIVE_FINAL_EXIT,
  RECOVERY_WITH_ADD_INTO_STRENGTH_AND_CONSTRUCTIVE_FINAL_EXIT,
  ADD_INTO_STRENGTH_WITH_TIMELY_PROFIT_PROTECTION_AND_CONSTRUCTIVE_FINAL_EXIT,
  ADD_INTO_STRENGTH_WITH_PREMATURE_FINAL_EXIT,
  RECOVERY_WITH_ADD_INTO_STRENGTH_AND_TIMELY_PROFIT_PROTECTION_AND_CONSTRUCTIVE_FINAL_EXIT,
  RECOVERY_WITH_ADD_INTO_STRENGTH_AND_PREMATURE_FINAL_EXIT,
  ADD_INTO_STRENGTH_WITH_MISSED_FINAL_CONTINUATION,
  RECOVERY_WITH_ADD_INTO_STRENGTH_AND_MISSED_FINAL_CONTINUATION,
  CONSTRUCTIVE_READD_AFTER_REDUCTION,
  BALANCED_MANAGEMENT_WITH_CONSTRUCTIVE_EXIT,
  RECOVERY_WITH_BALANCED_MANAGEMENT_AND_CONSTRUCTIVE_FINAL_EXIT,
  BALANCED_MANAGEMENT_WITH_MISSED_FINAL_CONTINUATION,
  RECOVERY_WITH_BALANCED_MANAGEMENT_AND_MISSED_FINAL_CONTINUATION,
  BALANCED_MANAGEMENT_WITH_FEARFUL_FINAL_EXIT,
  RECOVERY_WITH_BALANCED_MANAGEMENT_AND_FEARFUL_FINAL_EXIT,
  BALANCED_MANAGEMENT_WITH_PREMATURE_FINAL_EXIT,
  RECOVERY_WITH_BALANCED_MANAGEMENT_AND_PREMATURE_FINAL_EXIT,
  BALANCED_MANAGEMENT_WITH_DEFENSIVE_FINAL_EXIT_AFTER_DETERIORATION,
  RECOVERY_WITH_BALANCED_MANAGEMENT_AND_DEFENSIVE_FINAL_EXIT_AFTER_DETERIORATION,
  BALANCED_MANAGEMENT_WITH_STOP_LIKE_FORCED_EXIT_AFTER_BREAKDOWN,
  BALANCED_MANAGEMENT_WITH_STOP_LIKE_FORCED_EXIT_BEFORE_REBOUND,
  RECOVERY_WITH_BALANCED_MANAGEMENT_AND_STOP_LIKE_FORCED_EXIT_AFTER_BREAKDOWN,
  RECOVERY_WITH_BALANCED_MANAGEMENT_AND_STOP_LIKE_FORCED_EXIT_BEFORE_REBOUND,
  TRIM_INTO_STRENGTH_WITH_CONSTRUCTIVE_FINAL_EXIT,
  TRIM_INTO_STRENGTH_WITH_PREMATURE_FINAL_EXIT,
  TRIM_INTO_RESISTANCE_WITH_CONSTRUCTIVE_FINAL_EXIT,
  TRIM_INTO_RESISTANCE_WITH_PREMATURE_FINAL_EXIT,
  BALANCED_MANAGEMENT_WITH_TAKE_PROFIT_INTO_RESISTANCE_AND_CONSTRUCTIVE_FINAL_EXIT,
  BALANCED_MANAGEMENT_WITH_TAKE_PROFIT_INTO_RESISTANCE_AND_PREMATURE_FINAL_EXIT,
  TIMELY_PROFIT_PROTECTION_WITH_CONSTRUCTIVE_FINAL_EXIT,
  TIMELY_PROFIT_PROTECTION_WITH_PREMATURE_FINAL_EXIT,
  TIMELY_RISK_RESPONSE_WITH_DEFENSIVE_FINAL_EXIT_AFTER_DETERIORATION,
  TIMELY_RISK_RESPONSE_WITH_STOP_LIKE_FORCED_EXIT_AFTER_BREAKDOWN,
  TIMELY_RISK_RESPONSE_WITH_STOP_LIKE_FORCED_EXIT_BEFORE_REBOUND,
  RECOVERY_WITH_TRIM_INTO_STRENGTH_AND_CONSTRUCTIVE_FINAL_EXIT,
  RECOVERY_WITH_TRIM_INTO_STRENGTH_AND_PREMATURE_FINAL_EXIT,
  RECOVERY_WITH_TRIM_INTO_RESISTANCE_AND_CONSTRUCTIVE_FINAL_EXIT,
  RECOVERY_WITH_TRIM_INTO_RESISTANCE_AND_PREMATURE_FINAL_EXIT,
  RECOVERY_WITH_BALANCED_MANAGEMENT_AND_TAKE_PROFIT_INTO_RESISTANCE_AND_CONSTRUCTIVE_FINAL_EXIT,
  RECOVERY_WITH_BALANCED_MANAGEMENT_AND_TAKE_PROFIT_INTO_RESISTANCE_AND_PREMATURE_FINAL_EXIT,
  TIMELY_TRIM_INTO_STRENGTH_WITH_CONSTRUCTIVE_FINAL_EXIT,
  RECOVERY_WITH_TIMELY_TRIM_INTO_STRENGTH_AND_CONSTRUCTIVE_FINAL_EXIT,
  RECOVERY_WITH_TIMELY_PROFIT_PROTECTION_AND_CONSTRUCTIVE_FINAL_EXIT,
  RECOVERY_WITH_TIMELY_PROFIT_PROTECTION_AND_PREMATURE_FINAL_EXIT,
  RECOVERY_WITH_TIMELY_RISK_RESPONSE_AND_DEFENSIVE_FINAL_EXIT_AFTER_DETERIORATION,
  RECOVERY_WITH_TIMELY_RISK_RESPONSE_AND_STOP_LIKE_FORCED_EXIT_AFTER_BREAKDOWN,
  RECOVERY_WITH_TIMELY_RISK_RESPONSE_AND_STOP_LIKE_FORCED_EXIT_BEFORE_REBOUND,
  TRIM_READD_WITH_CONSTRUCTIVE_FINAL_EXIT,
  TRIM_READD_WITH_MISSED_FINAL_CONTINUATION,
  CONSTRUCTIVE_RECOVERY_AFTER_EARLY_ADVERSITY,
  RECOVERY_AFTER_EARLY_ADVERSITY_WITH_FAILED_PROTECTION,
  RECOVERY_AFTER_EARLY_ADVERSITY_WITH_STABILIZED_MANAGEMENT,
  REPEATED_TRIM_READD_WITH_CONSTRUCTIVE_MANAGEMENT,
  REPEATED_TRIM_READD_WITH_UNSTABLE_MANAGEMENT,
  REPEATED_RESCUE_ATTEMPTS_WITH_RENEWED_DETERIORATION,
  LATE_CHASE_REENTRY_AFTER_CONSTRUCTIVE_TRIM,
  GOOD_PULLBACK_REENTRY_AFTER_CONSTRUCTIVE_TRIM,
  CONSTRUCTIVE_REENTRY_FOLLOWTHROUGH_AFTER_TRIM,
  CONSTRUCTIVE_REENTRY_WITH_CONSTRUCTIVE_FINAL_EXIT,
  CONSTRUCTIVE_REENTRY_WITH_PREMATURE_FINAL_EXIT,
  CONSTRUCTIVE_REENTRY_WITH_STOP_LIKE_FORCED_EXIT_AFTER_BREAKDOWN,
  CONSTRUCTIVE_REENTRY_WITH_STOP_LIKE_FORCED_EXIT_BEFORE_REBOUND,
  RECOVERY_WITH_CONSTRUCTIVE_FINAL_EXIT_AFTER_CONSTRUCTIVE_REENTRY,
  RECOVERY_WITH_PREMATURE_FINAL_EXIT_AFTER_CONSTRUCTIVE_REENTRY,
  RECOVERY_WITH_STOP_LIKE_FORCED_EXIT_AFTER_CONSTRUCTIVE_REENTRY,
  RECOVERY_WITH_STOP_LIKE_FORCED_EXIT_BEFORE_REBOUND_AFTER_CONSTRUCTIVE_REENTRY,
  DETERIORATING_REENTRY_AFTER_TRIM,
  REPEATED_TRIM_READD_WITH_CONSTRUCTIVE_REENTRY_FOLLOWTHROUGH,
  REPEATED_TRIM_READD_WITH_DETERIORATING_REENTRY,
  REPEATED_CONSTRUCTIVE_REENTRY_WITH_PREMATURE_FINAL_EXIT,
  REPEATED_BALANCED_MANAGEMENT_WITH_PREMATURE_FINAL_EXIT,
  REPEATED_BALANCED_MANAGEMENT_WITH_CONSTRUCTIVE_FINAL_EXIT,
  REPEATED_BALANCED_MANAGEMENT_WITH_MISSED_FINAL_CONTINUATION,
  REPEATED_BALANCED_MANAGEMENT_WITH_EXIT_INTO_STACKED_SUPPORT_AND_RELIEF,
  REPEATED_BALANCED_MANAGEMENT_WITH_EXIT_INTO_THIN_SUPPORT_BEFORE_BREAKDOWN,
  REPEATED_BALANCED_MANAGEMENT_WITH_TRIM_INTO_RESISTANCE_AND_CONSTRUCTIVE_FINAL_EXIT,
  REPEATED_BALANCED_MANAGEMENT_WITH_TRIM_INTO_RESISTANCE_AND_PREMATURE_FINAL_EXIT,
  REPEATED_BALANCED_MANAGEMENT_WITH_TAKE_PROFIT_INTO_RESISTANCE_AND_CONSTRUCTIVE_FINAL_EXIT,
  REPEATED_BALANCED_MANAGEMENT_WITH_TAKE_PROFIT_INTO_RESISTANCE_AND_PREMATURE_FINAL_EXIT,
  REPEATED_BALANCED_MANAGEMENT_WITH_FEARFUL_FINAL_EXIT,
  REPEATED_BALANCED_MANAGEMENT_WITH_DEFENSIVE_FINAL_EXIT_AFTER_DETERIORATION,
  REPEATED_BALANCED_MANAGEMENT_WITH_STOP_LIKE_FORCED_EXIT_AFTER_BREAKDOWN,
  REPEATED_BALANCED_MANAGEMENT_WITH_STOP_LIKE_FORCED_EXIT_BEFORE_REBOUND,
  REPEATED_CONSTRUCTIVE_REENTRY_WITH_CONSTRUCTIVE_FINAL_EXIT,
  REPEATED_CONSTRUCTIVE_REENTRY_WITH_STOP_LIKE_FORCED_EXIT_AFTER_BREAKDOWN,
  REPEATED_CONSTRUCTIVE_REENTRY_WITH_STOP_LIKE_FORCED_EXIT_BEFORE_REBOUND,
  REPEATED_DETERIORATING_REENTRY_WITH_DEFENSIVE_FINAL_EXIT,
  REPEATED_RESCUE_ATTEMPTS_WITH_PREMATURE_FINAL_EXIT_AFTER_CONSTRUCTIVE_REENTRIES,
  REPEATED_RESCUE_ATTEMPTS_WITH_BALANCED_MANAGEMENT_AND_PREMATURE_FINAL_EXIT,
  REPEATED_RESCUE_ATTEMPTS_WITH_BALANCED_MANAGEMENT_AND_CONSTRUCTIVE_FINAL_EXIT,
  REPEATED_RESCUE_ATTEMPTS_WITH_BALANCED_MANAGEMENT_AND_MISSED_FINAL_CONTINUATION,
  REPEATED_RESCUE_ATTEMPTS_WITH_BALANCED_MANAGEMENT_AND_EXIT_INTO_STACKED_SUPPORT_AND_RELIEF,
  REPEATED_RESCUE_ATTEMPTS_WITH_BALANCED_MANAGEMENT_AND_EXIT_INTO_THIN_SUPPORT_BEFORE_BREAKDOWN,
  REPEATED_RESCUE_ATTEMPTS_WITH_BALANCED_MANAGEMENT_AND_TRIM_INTO_RESISTANCE_AND_CONSTRUCTIVE_FINAL_EXIT,
  REPEATED_RESCUE_ATTEMPTS_WITH_BALANCED_MANAGEMENT_AND_TRIM_INTO_RESISTANCE_AND_PREMATURE_FINAL_EXIT,
  REPEATED_RESCUE_ATTEMPTS_WITH_BALANCED_MANAGEMENT_AND_TAKE_PROFIT_INTO_RESISTANCE_AND_CONSTRUCTIVE_FINAL_EXIT,
  REPEATED_RESCUE_ATTEMPTS_WITH_BALANCED_MANAGEMENT_AND_TAKE_PROFIT_INTO_RESISTANCE_AND_PREMATURE_FINAL_EXIT,
  REPEATED_RESCUE_ATTEMPTS_WITH_BALANCED_MANAGEMENT_AND_FEARFUL_FINAL_EXIT,
  REPEATED_RESCUE_ATTEMPTS_WITH_BALANCED_MANAGEMENT_AND_DEFENSIVE_FINAL_EXIT_AFTER_DETERIORATION,
  REPEATED_RESCUE_ATTEMPTS_WITH_BALANCED_MANAGEMENT_AND_STOP_LIKE_FORCED_EXIT_AFTER_BREAKDOWN,
  REPEATED_RESCUE_ATTEMPTS_WITH_BALANCED_MANAGEMENT_AND_STOP_LIKE_FORCED_EXIT_BEFORE_REBOUND,
  REPEATED_RESCUE_ATTEMPTS_WITH_CONSTRUCTIVE_FINAL_EXIT_AFTER_CONSTRUCTIVE_REENTRIES,
  REPEATED_RESCUE_ATTEMPTS_WITH_STOP_LIKE_FORCED_EXIT_AFTER_CONSTRUCTIVE_REENTRIES,
  REPEATED_RESCUE_ATTEMPTS_WITH_STOP_LIKE_FORCED_EXIT_BEFORE_REBOUND_AFTER_CONSTRUCTIVE_REENTRIES,
  REPEATED_RESCUE_ATTEMPTS_WITH_DEFENSIVE_FINAL_EXIT_AFTER_DETERIORATING_REENTRIES,
  REPEATED_TRIM_READD_WITH_CONSTRUCTIVE_FINAL_EXIT,
  REPEATED_TRIM_READD_WITH_FEARFUL_FINAL_EXIT,
  REPEATED_TRIM_READD_WITH_DEFENSIVE_FINAL_EXIT_AFTER_DETERIORATION,
  REPEATED_RESCUE_ATTEMPTS_WITH_DEFENSIVE_FINAL_EXIT_AFTER_DETERIORATION,
  REPEATED_TRIM_READD_WITH_PREMATURE_FINAL_EXIT,
  REPEATED_TRIM_READD_WITH_MISSED_FINAL_CONTINUATION,
  AGGRESSIVE_ADDING_WITH_FAILED_PROFIT_PROTECTION,
  ADD_INTO_RESISTANCE_STRUCTURE,
  ADD_ABOVE_RESISTANCE_STRUCTURE,
  ADD_ABOVE_RESISTANCE_WITH_CONSTRUCTIVE_FINAL_EXIT,
  ADD_ABOVE_RESISTANCE_WITH_FAILED_PROFIT_PROTECTION,
  RECOVERY_WITH_ADD_ABOVE_RESISTANCE_AND_CONSTRUCTIVE_FINAL_EXIT,
  RECOVERY_WITH_ADD_ABOVE_RESISTANCE_AND_FAILED_PROFIT_PROTECTION,
  REPEATED_ADDS_ABOVE_RESISTANCE_WITH_CONSTRUCTIVE_FINAL_EXIT,
  REPEATED_ADDS_ABOVE_RESISTANCE_WITH_FAILED_PROFIT_PROTECTION,
  REVENGE_ADDING_WITH_FAILED_PROFIT_PROTECTION,
  READD_AFTER_DELAYED_RISK_RESPONSE,
];
