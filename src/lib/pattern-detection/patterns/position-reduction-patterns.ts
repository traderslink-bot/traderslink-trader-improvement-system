// =========================
// 2026-04-12 03:42 PM America/Toronto
// POSITION REDUCTION PATTERNS
// =========================
//
// PURPOSE:
// Detects isolated reduction structure from PatternInput.
//
// CURRENT DESIGN:
// This is atomic because it describes one structural reduction fact.
//

import type { PatternDefinition } from "../types/pattern-detection-types";
import {
  PATTERN_FAMILIES,
  THRESHOLDS,
} from "../types/pattern-detection-types";

export const SCALED_OUT_OF_POSITION: PatternDefinition = {
  id: "scaled_out_of_position",
  name: "Scaled Out of Position",
  family: PATTERN_FAMILIES.POSITION_REDUCTION,
  patternType: "atomic",
  structuralLevel: "atomic",

  evaluate: (input) => {
    const threshold =
      THRESHOLDS.POSITION_REDUCTION.MULTI_DECREASE_MIN_EVENTS;

    return {
      matched: input.totalPositionDecreaseCount >= threshold,
      evidence: {
        totalPositionDecreaseCount: input.totalPositionDecreaseCount,
        hadMultipleDecreases: input.hadMultipleDecreases,
      },
      thresholdsUsed: {
        minDecreaseEvents: threshold,
      },
    };
  },
};

export const REDUCTION_INTO_STRENGTH: PatternDefinition = {
  id: "reduction_into_strength",
  name: "Reduction Into Strength",
  family: PATTERN_FAMILIES.POSITION_REDUCTION,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const reductionCount = input.totalPositionDecreaseCount;
    const nearHighCount = input.reductionsNearRecentHighCount;
    const averageReductionVsBasis =
      input.averageReductionPriceVsPreviousAverageEntryPct;

    const minRangePosition =
      THRESHOLDS.POSITION_REDUCTION.INTO_STRENGTH_MIN_RANGE_POSITION;
    const minAveragePct =
      THRESHOLDS.POSITION_REDUCTION.ABOVE_BASIS_MIN_AVERAGE_PCT;

    const matched =
      reductionCount > 0 &&
      nearHighCount > 0 &&
      averageReductionVsBasis !== null &&
      averageReductionVsBasis >= minAveragePct;

    return {
      matched,
      evidence: {
        totalPositionDecreaseCount: reductionCount,
        reductionsNearRecentHighCount: nearHighCount,
        averageReductionPriceVsPreviousAverageEntryPct:
          averageReductionVsBasis,
      },
      thresholdsUsed: {
        minRangePosition,
        minAveragePct,
      },
    };
  },
};

export const REDUCTION_INTO_WEAKNESS: PatternDefinition = {
  id: "reduction_into_weakness",
  name: "Reduction Into Weakness",
  family: PATTERN_FAMILIES.POSITION_REDUCTION,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const reductionCount = input.totalPositionDecreaseCount;
    const nearLowCount = input.reductionsNearRecentLowCount;
    const averageReductionVsBasis =
      input.averageReductionPriceVsPreviousAverageEntryPct;

    const maxRangePosition =
      THRESHOLDS.POSITION_REDUCTION.INTO_WEAKNESS_MAX_RANGE_POSITION;
    const maxAveragePct =
      THRESHOLDS.POSITION_REDUCTION.BELOW_BASIS_MAX_AVERAGE_PCT;

    const matched =
      reductionCount > 0 &&
      nearLowCount > 0 &&
      averageReductionVsBasis !== null &&
      averageReductionVsBasis <= maxAveragePct;

    return {
      matched,
      evidence: {
        totalPositionDecreaseCount: reductionCount,
        reductionsNearRecentLowCount: nearLowCount,
        averageReductionPriceVsPreviousAverageEntryPct:
          averageReductionVsBasis,
      },
      thresholdsUsed: {
        maxRangePosition,
        maxAveragePct,
      },
    };
  },
};

export const PROFIT_PROTECTION_PRESENT: PatternDefinition = {
  id: "profit_protection_present",
  name: "Profit Protection Present",
  family: PATTERN_FAMILIES.POSITION_REDUCTION,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const reductionCount = input.totalPositionDecreaseCount;
    const peakOpenProfitPctOfBasis = input.peakOpenProfitPctOfBasis;
    const maxGivebackPct = input.maxGivebackFromPeakOpenProfitPct;

    const maxGivebackPctThreshold =
      THRESHOLDS.POSITION_REDUCTION.PROFIT_PROTECTION_MAX_GIVEBACK_PCT;

    const matched =
      reductionCount > 0 &&
      peakOpenProfitPctOfBasis !== null &&
      peakOpenProfitPctOfBasis > 0 &&
      maxGivebackPct !== null &&
      maxGivebackPct < maxGivebackPctThreshold;

    return {
      matched,
      evidence: {
        totalPositionDecreaseCount: reductionCount,
        peakOpenProfitPctOfBasis,
        maxGivebackFromPeakOpenProfitPct: maxGivebackPct,
      },
      thresholdsUsed: {
        maxGivebackPct: maxGivebackPctThreshold,
      },
    };
  },
};

export const FAILED_PROFIT_PROTECTION_STRUCTURE: PatternDefinition = {
  id: "failed_profit_protection_structure",
  name: "Failed Profit Protection Structure",
  family: PATTERN_FAMILIES.POSITION_REDUCTION,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const reductionCount = input.totalPositionDecreaseCount;
    const peakOpenProfitPctOfBasis = input.peakOpenProfitPctOfBasis;
    const maxGivebackPct = input.maxGivebackFromPeakOpenProfitPct;

    const minGivebackPct =
      THRESHOLDS.POSITION_REDUCTION.FAILED_PROFIT_PROTECTION_MIN_GIVEBACK_PCT;
    const minPeakOpenProfitPctOfBasis =
      THRESHOLDS.POSITION_REDUCTION
        .FAILED_PROFIT_PROTECTION_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;

    const matched =
      reductionCount > 0 &&
      peakOpenProfitPctOfBasis !== null &&
      peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
      maxGivebackPct !== null &&
      maxGivebackPct >= minGivebackPct;

    return {
      matched,
      evidence: {
        totalPositionDecreaseCount: reductionCount,
        peakOpenProfitPctOfBasis,
        maxGivebackFromPeakOpenProfitPct: maxGivebackPct,
      },
      thresholdsUsed: {
        minGivebackPct,
        minPeakOpenProfitPctOfBasis,
      },
    };
  },
};

export const REDUCTION_AFTER_RECENT_RUN_UP: PatternDefinition = {
  id: "reduction_after_recent_run_up",
  name: "Reduction After Recent Run-Up",
  family: PATTERN_FAMILIES.POSITION_REDUCTION,
  patternType: "atomic",
  structuralLevel: "atomic",

  evaluate: (input) => {
    const reductionCount = input.totalPositionDecreaseCount;
    const reductionsWithRecentRunUpCount =
      input.reductionsWithRecentRunUpCount;
    const averageRunUp =
      input.averageReductionRecentRunUpPctBeforeExecution;

    const minRunUp =
      THRESHOLDS.POSITION_REDUCTION.REDUCTION_AFTER_RECENT_RUN_UP_MIN_PCT;

    const matched =
      reductionCount > 0 &&
      reductionsWithRecentRunUpCount > 0 &&
      averageRunUp !== null &&
      averageRunUp >= minRunUp;

    return {
      matched,
      evidence: {
        totalPositionDecreaseCount: reductionCount,
        reductionsWithRecentRunUpCount,
        averageReductionRecentRunUpPctBeforeExecution: averageRunUp,
      },
      thresholdsUsed: {
        minRunUp,
      },
    };
  },
};

export const REDUCTION_AFTER_RECENT_DROP: PatternDefinition = {
  id: "reduction_after_recent_drop",
  name: "Reduction After Recent Drop",
  family: PATTERN_FAMILIES.POSITION_REDUCTION,
  patternType: "atomic",
  structuralLevel: "atomic",

  evaluate: (input) => {
    const reductionCount = input.totalPositionDecreaseCount;
    const reductionsWithRecentDropCount =
      input.reductionsWithRecentDropCount;
    const averageDrop =
      input.averageReductionRecentDropPctBeforeExecution;

    const minDrop =
      THRESHOLDS.POSITION_REDUCTION.REDUCTION_AFTER_RECENT_DROP_MIN_PCT;

    const matched =
      reductionCount > 0 &&
      reductionsWithRecentDropCount > 0 &&
      averageDrop !== null &&
      averageDrop >= minDrop;

    return {
      matched,
      evidence: {
        totalPositionDecreaseCount: reductionCount,
        reductionsWithRecentDropCount,
        averageReductionRecentDropPctBeforeExecution: averageDrop,
      },
      thresholdsUsed: {
        minDrop,
      },
    };
  },
};

export const HELD_THROUGH_DANGER_AFTER_PEAK_PROFIT: PatternDefinition = {
  id: "held_through_danger_after_peak_profit",
  name: "Held Through Danger After Peak Profit",
  family: PATTERN_FAMILIES.POSITION_REDUCTION,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const minDrawdownFromPeakPctOfBasis =
      THRESHOLDS.POSITION_REDUCTION
        .HELD_THROUGH_DANGER_MIN_DRAWDOWN_FROM_PEAK_PCT_OF_BASIS;

    const matched =
      input.hadPeakOpenProfitBeforeWorstDrawdown &&
      input.drawdownFromPeakOpenProfitPctOfBasis !== null &&
      input.drawdownFromPeakOpenProfitPctOfBasis >=
        minDrawdownFromPeakPctOfBasis &&
      !input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown;

    return {
      matched,
      evidence: {
        hadPeakOpenProfitBeforeWorstDrawdown:
          input.hadPeakOpenProfitBeforeWorstDrawdown,
        drawdownFromPeakOpenProfitPctOfBasis:
          input.drawdownFromPeakOpenProfitPctOfBasis,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown:
          input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown,
      },
      thresholdsUsed: {
        minDrawdownFromPeakPctOfBasis,
      },
    };
  },
};

export const DELAYED_RISK_RESPONSE_AFTER_PEAK_PROFIT: PatternDefinition = {
  id: "delayed_risk_response_after_peak_profit",
  name: "Delayed Risk Response After Peak Profit",
  family: PATTERN_FAMILIES.POSITION_REDUCTION,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const minDrawdownFromPeakPctOfBasis =
      THRESHOLDS.POSITION_REDUCTION
        .DELAYED_RISK_RESPONSE_MIN_DRAWDOWN_FROM_PEAK_PCT_OF_BASIS;
    const minSecondsToFirstReduction =
      THRESHOLDS.POSITION_REDUCTION
        .DELAYED_RISK_RESPONSE_MIN_SECONDS_TO_FIRST_REDUCTION;

    const matched =
      input.hadPeakOpenProfitBeforeWorstDrawdown &&
      input.drawdownFromPeakOpenProfitPctOfBasis !== null &&
      input.drawdownFromPeakOpenProfitPctOfBasis >=
        minDrawdownFromPeakPctOfBasis &&
      input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
      input.secondsFromPeakOpenProfitToFirstReduction !== null &&
      input.secondsFromPeakOpenProfitToFirstReduction >=
        minSecondsToFirstReduction;

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
      },
      thresholdsUsed: {
        minDrawdownFromPeakPctOfBasis,
        minSecondsToFirstReduction,
      },
    };
  },
};

export const TIMELY_RISK_RESPONSE_AFTER_PEAK_PROFIT: PatternDefinition = {
  id: "timely_risk_response_after_peak_profit",
  name: "Timely Risk Response After Peak Profit",
  family: PATTERN_FAMILIES.POSITION_REDUCTION,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const minDrawdownFromPeakPctOfBasis =
      THRESHOLDS.POSITION_REDUCTION
        .DELAYED_RISK_RESPONSE_MIN_DRAWDOWN_FROM_PEAK_PCT_OF_BASIS;
    const maxSecondsToFirstReduction =
      THRESHOLDS.POSITION_REDUCTION
        .TIMELY_RISK_RESPONSE_MAX_SECONDS_TO_FIRST_REDUCTION;

    const matched =
      input.hadPeakOpenProfitBeforeWorstDrawdown &&
      input.drawdownFromPeakOpenProfitPctOfBasis !== null &&
      input.drawdownFromPeakOpenProfitPctOfBasis >=
        minDrawdownFromPeakPctOfBasis &&
      input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
      input.secondsFromPeakOpenProfitToFirstReduction !== null &&
      input.secondsFromPeakOpenProfitToFirstReduction <
        maxSecondsToFirstReduction;

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
      },
      thresholdsUsed: {
        minDrawdownFromPeakPctOfBasis,
        maxSecondsToFirstReduction,
      },
    };
  },
};

export const TIMELY_RISK_RESPONSE_WITH_PROFIT_PROTECTION: PatternDefinition = {
  id: "timely_risk_response_with_profit_protection",
  name: "Timely Risk Response With Profit Protection",
  family: PATTERN_FAMILIES.POSITION_REDUCTION,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const minDrawdownFromPeakPctOfBasis =
      THRESHOLDS.POSITION_REDUCTION
        .DELAYED_RISK_RESPONSE_MIN_DRAWDOWN_FROM_PEAK_PCT_OF_BASIS;
    const maxSecondsToFirstReduction =
      THRESHOLDS.POSITION_REDUCTION
        .TIMELY_RISK_RESPONSE_MAX_SECONDS_TO_FIRST_REDUCTION;
    const maxGivebackPct =
      THRESHOLDS.POSITION_REDUCTION.PROFIT_PROTECTION_MAX_GIVEBACK_PCT;

    const matched =
      input.hadPeakOpenProfitBeforeWorstDrawdown &&
      input.drawdownFromPeakOpenProfitPctOfBasis !== null &&
      input.drawdownFromPeakOpenProfitPctOfBasis >=
        minDrawdownFromPeakPctOfBasis &&
      input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
      input.secondsFromPeakOpenProfitToFirstReduction !== null &&
      input.secondsFromPeakOpenProfitToFirstReduction <
        maxSecondsToFirstReduction &&
      input.maxGivebackFromPeakOpenProfitPct !== null &&
      input.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct;

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
        maxGivebackFromPeakOpenProfitPct:
          input.maxGivebackFromPeakOpenProfitPct,
      },
      thresholdsUsed: {
        minDrawdownFromPeakPctOfBasis,
        maxSecondsToFirstReduction,
        maxGivebackPct,
      },
    };
  },
};

export const DELAYED_RISK_RESPONSE_WITH_FAILED_PROFIT_PROTECTION: PatternDefinition =
  {
    id: "delayed_risk_response_with_failed_profit_protection",
    name: "Delayed Risk Response With Failed Profit Protection",
    family: PATTERN_FAMILIES.POSITION_REDUCTION,
    patternType: "composite",
    structuralLevel: "structural_composite",

    evaluate: (input) => {
      const minDrawdownFromPeakPctOfBasis =
        THRESHOLDS.POSITION_REDUCTION
          .DELAYED_RISK_RESPONSE_MIN_DRAWDOWN_FROM_PEAK_PCT_OF_BASIS;
      const minSecondsToFirstReduction =
        THRESHOLDS.POSITION_REDUCTION
          .DELAYED_RISK_RESPONSE_MIN_SECONDS_TO_FIRST_REDUCTION;
      const minGivebackPct =
        THRESHOLDS.POSITION_REDUCTION
          .DELAYED_RISK_RESPONSE_FAILED_PROTECTION_MIN_GIVEBACK_PCT;

      const matched =
        input.hadPeakOpenProfitBeforeWorstDrawdown &&
        input.drawdownFromPeakOpenProfitPctOfBasis !== null &&
        input.drawdownFromPeakOpenProfitPctOfBasis >=
          minDrawdownFromPeakPctOfBasis &&
        input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown &&
        input.secondsFromPeakOpenProfitToFirstReduction !== null &&
        input.secondsFromPeakOpenProfitToFirstReduction >=
          minSecondsToFirstReduction &&
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

export const POSITION_REDUCTION_PATTERNS: PatternDefinition[] = [
  SCALED_OUT_OF_POSITION,
  REDUCTION_INTO_STRENGTH,
  REDUCTION_INTO_WEAKNESS,
  PROFIT_PROTECTION_PRESENT,
  FAILED_PROFIT_PROTECTION_STRUCTURE,
  REDUCTION_AFTER_RECENT_RUN_UP,
  REDUCTION_AFTER_RECENT_DROP,
  HELD_THROUGH_DANGER_AFTER_PEAK_PROFIT,
  DELAYED_RISK_RESPONSE_AFTER_PEAK_PROFIT,
  TIMELY_RISK_RESPONSE_AFTER_PEAK_PROFIT,
  TIMELY_RISK_RESPONSE_WITH_PROFIT_PROTECTION,
  DELAYED_RISK_RESPONSE_WITH_FAILED_PROFIT_PROTECTION,
];
