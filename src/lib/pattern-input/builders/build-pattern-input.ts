// =========================
// 2026-04-12 05:36 PM America/Toronto
// BUILD PATTERN INPUT
// filename build-pattern-input.ts
// =========================
//
// PURPOSE:
// Builds the pattern input object from raw trade timeline output.
// This is a pure aggregation layer that prepares data for pattern detection.
// No interpretation, no scoring, no labeling.
//
// IMPORTANT:
// This builder is the ONLY place where raw timeline output should be converted
// into PatternInput fields for the pattern detection layer.
//

import type { RawTradeTimelineBuildResult } from "../../raw-trade-timeline/types/raw-trade-timeline-build-result";
import {
  createPatternInputFromCore,
  type PatternInput,
} from "../types/pattern-input";

function round(value: number, decimals = 6): number {
  return Number(value.toFixed(decimals));
}

function calculateDistanceFromLevelPct(
  price: number,
  level: number | null | undefined,
): number | null {
  if (level === null || level === undefined || price <= 0) {
    return null;
  }

  return round(Math.abs(price - level) / price);
}

function getSecondsBetweenTimestamps(
  earlierTimestamp: string | null,
  laterTimestamp: string | null,
): number | null {
  if (!earlierTimestamp || !laterTimestamp) {
    return null;
  }

  const earlierMs = Date.parse(earlierTimestamp);
  const laterMs = Date.parse(laterTimestamp);

  if (Number.isNaN(earlierMs) || Number.isNaN(laterMs) || laterMs < earlierMs) {
    return null;
  }

  return round((laterMs - earlierMs) / 1000);
}

// 2026-04-12 05:36 PM America/Toronto
// Returns a normalized 0..1 position for a price within the eventual trade range.
//
// For long trades:
// 0 = trade low
// 1 = trade high
//
// For short trades:
// 0 = trade high
// 1 = trade low
//
// Returns null if the required values are missing or the range is zero.
function calculatePricePositionInTradeRangePct(args: {
  tradeDirection: PatternInput["tradeDirection"];
  price: number;
  peakPriceDuringTrade: number | null;
  worstPriceDuringTrade: number | null;
}): number | null {
  const { tradeDirection, price, peakPriceDuringTrade, worstPriceDuringTrade } =
    args;

  if (peakPriceDuringTrade === null || worstPriceDuringTrade === null) {
    return null;
  }

  const tradeHigh = Math.max(peakPriceDuringTrade, worstPriceDuringTrade);
  const tradeLow = Math.min(peakPriceDuringTrade, worstPriceDuringTrade);
  const tradeRange = tradeHigh - tradeLow;

  if (tradeRange <= 0) {
    return null;
  }

  if (tradeDirection === "long") {
    return round((price - tradeLow) / tradeRange);
  }

  return round((tradeHigh - price) / tradeRange);
}

// 2026-04-12 05:36 PM America/Toronto
// Returns the entry distance from the favorable side of the trade range.
//
// For long trades:
// distance from trade low
//
// For short trades:
// distance from trade high
function calculateFirstEntryDistanceFromTradeLowPct(args: {
  tradeDirection: PatternInput["tradeDirection"];
  entryPrice: number;
  peakPriceDuringTrade: number | null;
  worstPriceDuringTrade: number | null;
}): number | null {
  const {
    tradeDirection,
    entryPrice,
    peakPriceDuringTrade,
    worstPriceDuringTrade,
  } = args;

  if (peakPriceDuringTrade === null || worstPriceDuringTrade === null) {
    return null;
  }

  if (tradeDirection === "long") {
    const tradeLow = Math.min(peakPriceDuringTrade, worstPriceDuringTrade);

    if (tradeLow <= 0) {
      return null;
    }

    return round((entryPrice - tradeLow) / tradeLow);
  }

  const tradeHigh = Math.max(peakPriceDuringTrade, worstPriceDuringTrade);

  if (tradeHigh <= 0) {
    return null;
  }

  return round((tradeHigh - entryPrice) / tradeHigh);
}

// 2026-04-12 05:36 PM America/Toronto
// Returns the entry distance from the unfavorable side of the trade range.
//
// For long trades:
// distance from trade high
//
// For short trades:
// distance from trade low
function calculateFirstEntryDistanceFromTradeHighPct(args: {
  tradeDirection: PatternInput["tradeDirection"];
  entryPrice: number;
  peakPriceDuringTrade: number | null;
  worstPriceDuringTrade: number | null;
}): number | null {
  const {
    tradeDirection,
    entryPrice,
    peakPriceDuringTrade,
    worstPriceDuringTrade,
  } = args;

  if (peakPriceDuringTrade === null || worstPriceDuringTrade === null) {
    return null;
  }

  if (tradeDirection === "long") {
    const tradeHigh = Math.max(peakPriceDuringTrade, worstPriceDuringTrade);

    if (tradeHigh <= 0) {
      return null;
    }

    return round((tradeHigh - entryPrice) / tradeHigh);
  }

  const tradeLow = Math.min(peakPriceDuringTrade, worstPriceDuringTrade);

  if (entryPrice <= 0) {
    return null;
  }

  return round((entryPrice - tradeLow) / entryPrice);
}

// 2026-04-12 05:36 PM America/Toronto
// Returns the favorable move remaining after first entry.
//
// For long trades:
// move from entry to peak
//
// For short trades:
// move from entry down to worst
function calculateFirstEntryToPeakMovePct(args: {
  tradeDirection: PatternInput["tradeDirection"];
  entryPrice: number;
  peakPriceDuringTrade: number | null;
  worstPriceDuringTrade: number | null;
}): number | null {
  const {
    tradeDirection,
    entryPrice,
    peakPriceDuringTrade,
    worstPriceDuringTrade,
  } = args;

  if (entryPrice <= 0) {
    return null;
  }

  if (tradeDirection === "long") {
    if (peakPriceDuringTrade === null) {
      return null;
    }

    return round((peakPriceDuringTrade - entryPrice) / entryPrice);
  }

  if (worstPriceDuringTrade === null) {
    return null;
  }

  return round((entryPrice - worstPriceDuringTrade) / entryPrice);
}

// 2026-04-12 05:36 PM America/Toronto
// Returns the adverse move after first entry.
//
// For long trades:
// move from entry down to worst
//
// For short trades:
// move from entry up to peak
function calculateFirstEntryToWorstMovePct(args: {
  tradeDirection: PatternInput["tradeDirection"];
  entryPrice: number;
  peakPriceDuringTrade: number | null;
  worstPriceDuringTrade: number | null;
}): number | null {
  const {
    tradeDirection,
    entryPrice,
    peakPriceDuringTrade,
    worstPriceDuringTrade,
  } = args;

  if (entryPrice <= 0) {
    return null;
  }

  if (tradeDirection === "long") {
    if (worstPriceDuringTrade === null) {
      return null;
    }

    return round((entryPrice - worstPriceDuringTrade) / entryPrice);
  }

  if (peakPriceDuringTrade === null) {
    return null;
  }

  return round((peakPriceDuringTrade - entryPrice) / entryPrice);
}

// 2026-04-12 05:36 PM America/Toronto
// Returns the normalized realized return from entry to final exit.
//
// For long trades:
// positive when exit > entry
//
// For short trades:
// positive when exit < entry
function calculateRealizedReturnPct(args: {
  tradeDirection: PatternInput["tradeDirection"];
  entryPrice: number;
  exitPrice: number;
}): number | null {
  const { tradeDirection, entryPrice, exitPrice } = args;

  if (entryPrice <= 0) {
    return null;
  }

  if (tradeDirection === "long") {
    return round((exitPrice - entryPrice) / entryPrice);
  }

  return round((entryPrice - exitPrice) / entryPrice);
}

// 2026-04-12 05:36 PM America/Toronto
// Returns the distance from final exit to the best favorable price reached.
//
// For long trades:
// distance from exit to peak
//
// For short trades:
// distance from exit to worst
function calculateFinalExitToPeakDistancePct(args: {
  tradeDirection: PatternInput["tradeDirection"];
  exitPrice: number;
  peakPriceDuringTrade: number | null;
  worstPriceDuringTrade: number | null;
}): number | null {
  const {
    tradeDirection,
    exitPrice,
    peakPriceDuringTrade,
    worstPriceDuringTrade,
  } = args;

  if (exitPrice <= 0) {
    return null;
  }

  if (tradeDirection === "long") {
    if (peakPriceDuringTrade === null) {
      return null;
    }

    return round((peakPriceDuringTrade - exitPrice) / exitPrice);
  }

  if (worstPriceDuringTrade === null) {
    return null;
  }

  return round((exitPrice - worstPriceDuringTrade) / exitPrice);
}

export function buildPatternInput(
  result: RawTradeTimelineBuildResult,
): PatternInput {
  const {
    timeline,
    addContextDerivedSignals = [],
    entryContextDerivedSignals,
    executionDerivedSignals = [],
    partialExitOutcomeSignals = [],
    readdOutcomeSignals = [],
    positionChangeDerivedSignals = [],
    profitProtectionDerivedSignals = [],
    reductionContextDerivedSignals = [],
    reductionReaddSequenceSignals = [],
    postExitDerivedSignals,
    tradeLifecycleMilestoneSignals,
    dangerWindowDerivedSignals,
    timelineRelationshipSignals,
    tradeDerivedSignals,
  } = result;

  if (!tradeDerivedSignals) {
    throw new Error("Missing tradeDerivedSignals for pattern input.");
  }

  const executions = timeline.executions;
  const firstExecutionLevelRelation = result.executionLevelRelations?.[0] ?? null;
  const finalExecutionLevelRelation =
    result.executionLevelRelations?.[result.executionLevelRelations.length - 1] ??
    null;

  if (executions.length === 0) {
    throw new Error("Cannot build PatternInput with zero executions.");
  }

  // ===== POSITION COUNTS =====
  const totalPositionIncreaseCount = positionChangeDerivedSignals.filter(
    (s) => s.positionIncreased,
  ).length;

  const totalPositionDecreaseCount = positionChangeDerivedSignals.filter(
    (s) => s.positionDecreased,
  ).length;

  const totalPositionUnchangedCount = positionChangeDerivedSignals.filter(
    (s) => s.positionUnchanged,
  ).length;

  const openedFromFlat = positionChangeDerivedSignals.some(
    (s) => s.openedPositionFromFlat,
  );

  const closedToFlat = positionChangeDerivedSignals.some(
    (s) => s.closedPositionToFlat,
  );

  const hadMultipleIncreases = totalPositionIncreaseCount > 1;
  const hadMultipleDecreases = totalPositionDecreaseCount > 1;

  const maxPositionSize = Math.max(
    ...positionChangeDerivedSignals.map((s) => s.currentPositionSize),
    0,
  );

  const finalPositionSize =
    positionChangeDerivedSignals.length > 0
      ? positionChangeDerivedSignals[positionChangeDerivedSignals.length - 1]
          .currentPositionSize
      : 0;

  // ===== EXECUTION AGGREGATES =====
  const executionMfePcts = executionDerivedSignals
    .map((s) => s.mfePct)
    .filter((v): v is number => v !== null);

  const executionMaePcts = executionDerivedSignals
    .map((s) => s.maePct)
    .filter((v): v is number => v !== null);

  const maxExecutionMfePct =
    executionMfePcts.length > 0 ? Math.max(...executionMfePcts) : null;

  const maxExecutionMaePct =
    executionMaePcts.length > 0 ? Math.max(...executionMaePcts) : null;

  const averageExecutionMfePct =
    executionMfePcts.length > 0
      ? round(
          executionMfePcts.reduce((sum, v) => sum + v, 0) /
            executionMfePcts.length,
        )
      : null;

  const averageExecutionMaePct =
    executionMaePcts.length > 0
      ? round(
          executionMaePcts.reduce((sum, v) => sum + v, 0) /
            executionMaePcts.length,
        )
      : null;

  const partialExitSignals = partialExitOutcomeSignals.filter(
    (signal) => signal.executionWasPartialExit,
  );

  const partialExitCount = partialExitSignals.length;
  const hadPartialExit = partialExitCount > 0;

  const maxFavorableMoveAfterPartialExitPct =
    partialExitSignals.length > 0
      ? Math.max(
          ...partialExitSignals.map(
            (signal) =>
              signal.maxFavorableMovePctAfterReductionBeforeNextExecution ?? 0,
          ),
        )
      : null;

  const maxAdverseMoveAfterPartialExitPct =
    partialExitSignals.length > 0
      ? Math.max(
          ...partialExitSignals.map(
            (signal) =>
              signal.maxAdverseMovePctAfterReductionBeforeNextExecution ?? 0,
          ),
        )
      : null;

  const givebackPctValues = profitProtectionDerivedSignals
    .map((signal) => signal.givebackFromPeakOpenProfitPct)
    .filter((value): value is number => value !== null);

  const maxGivebackFromPeakOpenProfitPct =
    givebackPctValues.length > 0 ? Math.max(...givebackPctValues) : null;

  const readdAfterReductionCount = reductionReaddSequenceSignals.filter(
    (signal) => signal.executionIsReaddAfterReduction,
  ).length;

  const hadReaddAfterReduction = readdAfterReductionCount > 0;

  const readdSignals = reductionReaddSequenceSignals.filter(
    (signal) => signal.executionIsReaddAfterReduction,
  );

  const averageReaddPriceChangeFromPriorReductionPct =
    readdSignals.length > 0
      ? round(
          readdSignals.reduce((sum, signal) => {
            return sum + (signal.priceChangeSinceMostRecentReductionPct ?? 0);
          }, 0) / readdSignals.length,
        )
      : null;

  const actualAdds = addContextDerivedSignals.filter(
    (signal) =>
      signal.executionIncreasedPosition && !signal.executionOpenedFromFlat,
  );

  const actualReadds = actualAdds.filter((signal) => {
    const matchingReaddSignal = reductionReaddSequenceSignals.find(
      (readdSignal) =>
        readdSignal.executionIndex === signal.executionIndex &&
        readdSignal.executionIsReaddAfterReduction,
    );

    return matchingReaddSignal !== undefined;
  });

  const actualReductions = reductionContextDerivedSignals.filter(
    (signal) => signal.executionDecreasedPosition,
  );

  const addCountAfterInitialEntry = actualAdds.length;

  const addAbovePreviousAverageEntryCount = actualAdds.filter(
    (signal) => signal.addWasAbovePreviousAverageEntry,
  ).length;

  const addBelowPreviousAverageEntryCount = actualAdds.filter(
    (signal) => signal.addWasBelowPreviousAverageEntry,
  ).length;

  const averageAddPriceVsPreviousAverageEntryPct =
    actualAdds.length > 0
      ? round(
          actualAdds.reduce((sum, signal) => {
            return (
              sum + (signal.executionPriceVsPreviousAverageEntryPct ?? 0)
            );
          }, 0) / actualAdds.length,
        )
      : null;

  const addPricePositionValues = actualAdds
    .map((signal) => signal.executionPricePositionInRecentRangePct)
    .filter((value): value is number => value !== null);

  const averageAddPricePositionInRecentRangePct =
    addPricePositionValues.length > 0
      ? round(
          addPricePositionValues.reduce((sum, value) => sum + value, 0) /
            addPricePositionValues.length,
        )
      : null;

  const addRecentRunUpValues = actualAdds
    .map((signal) => signal.recentRunUpPctBeforeExecution)
    .filter((value): value is number => value !== null);

  const addRecentDropValues = actualAdds
    .map((signal) => signal.recentDropPctBeforeExecution)
    .filter((value): value is number => value !== null);

  const averageAddRecentRunUpPctBeforeExecution =
    addRecentRunUpValues.length > 0
      ? round(
          addRecentRunUpValues.reduce((sum, value) => sum + value, 0) /
            addRecentRunUpValues.length,
        )
      : null;

  const averageAddRecentDropPctBeforeExecution =
    addRecentDropValues.length > 0
      ? round(
          addRecentDropValues.reduce((sum, value) => sum + value, 0) /
            addRecentDropValues.length,
        )
      : null;

  const addsWithRecentRunUpCount = actualAdds.filter((signal) => {
    return signal.recentRunUpPctBeforeExecution !== null &&
      signal.recentRunUpPctBeforeExecution >= 0.05;
  }).length;

  const addsWithRecentDropCount = actualAdds.filter((signal) => {
    return signal.recentDropPctBeforeExecution !== null &&
      signal.recentDropPctBeforeExecution >= 0.05;
  }).length;
  const addExecutionIndexes = new Set(
    actualAdds.map((signal) => signal.executionIndex),
  );
  const addRelations =
    result.executionLevelRelations?.filter((relation) =>
      addExecutionIndexes.has(relation.executionIndex)
    ) ?? [];
  const addsNearSupportCount = addRelations.filter((relation) => relation.isNearSupport).length;
  const addsNearResistanceCount = addRelations.filter((relation) => relation.isNearResistance).length;
  const addsAboveResistanceCount = addRelations.filter(
    (relation) => relation.clearedNearestResistanceBelow,
  ).length;
  const addsAboveResistanceWithRoomCount = addRelations.filter(
    (relation) => relation.clearedNearestResistanceBelow &&
      relation.hasRoomAboveAfterClearingResistance,
  ).length;
  const addsBelowSupportCount = addRelations.filter(
    (relation) => relation.occurredBelowNearestSupport,
  ).length;
  const addDistanceToSupportValues = addRelations
    .map((relation) => relation.distanceToNearestSupportPct)
    .filter((value): value is number => value !== null);
  const addDistanceToResistanceValues = addRelations
    .map((relation) => relation.distanceToNearestResistancePct)
    .filter((value): value is number => value !== null);
  const averageAddDistanceToNearestSupportPct =
    addDistanceToSupportValues.length > 0
      ? round(
          addDistanceToSupportValues.reduce((sum, value) => sum + value, 0) /
            addDistanceToSupportValues.length,
        )
      : null;
  const averageAddDistanceToNearestResistancePct =
    addDistanceToResistanceValues.length > 0
      ? round(
          addDistanceToResistanceValues.reduce((sum, value) => sum + value, 0) /
            addDistanceToResistanceValues.length,
        )
      : null;
  const addRoomToNextResistanceValues = addRelations
    .map((relation) => relation.roomToNearestResistancePct)
    .filter((value): value is number => value !== null);
  const averageAddRoomToNextResistancePct =
    addRoomToNextResistanceValues.length > 0
      ? round(
          addRoomToNextResistanceValues.reduce((sum, value) => sum + value, 0) /
            addRoomToNextResistanceValues.length,
        )
      : null;

  const readdsAfterRecentRunUpCount = actualReadds.filter((signal) => {
    return signal.recentRunUpPctBeforeExecution !== null &&
      signal.recentRunUpPctBeforeExecution >= 0.05;
  }).length;

  const readdsAfterRecentDropCount = actualReadds.filter((signal) => {
    return signal.recentDropPctBeforeExecution !== null &&
      signal.recentDropPctBeforeExecution >= 0.05;
  }).length;

  const partialExitsFollowedByReadd = partialExitOutcomeSignals.filter(
    (signal) =>
      signal.executionWasPartialExit &&
      signal.nextExecutionIndex !== null &&
      reductionReaddSequenceSignals.some(
        (readdSignal) =>
          readdSignal.executionIndex === signal.nextExecutionIndex &&
          readdSignal.executionIsReaddAfterReduction,
      ),
  );

  const averageFavorableMovePctAfterPartialExitBeforeReadd =
    partialExitsFollowedByReadd.length > 0
      ? round(
          partialExitsFollowedByReadd.reduce((sum, signal) => {
            return (
              sum +
              (signal.maxFavorableMovePctAfterReductionBeforeNextExecution ?? 0)
            );
          }, 0) / partialExitsFollowedByReadd.length,
        )
      : null;

  const averageAdverseMovePctAfterPartialExitBeforeReadd =
    partialExitsFollowedByReadd.length > 0
      ? round(
          partialExitsFollowedByReadd.reduce((sum, signal) => {
            return (
              sum +
              (signal.maxAdverseMovePctAfterReductionBeforeNextExecution ?? 0)
            );
          }, 0) / partialExitsFollowedByReadd.length,
        )
      : null;

  const actualReaddOutcomeSignals = readdOutcomeSignals.filter(
    (signal) => signal.executionWasReaddAfterReduction,
  );

  const averageFavorableMovePctAfterReaddBeforeNextExecution =
    actualReaddOutcomeSignals.length > 0
      ? round(
          actualReaddOutcomeSignals.reduce((sum, signal) => {
            return (
              sum +
              (signal.maxFavorableMovePctAfterReaddBeforeNextExecution ?? 0)
            );
          }, 0) / actualReaddOutcomeSignals.length,
        )
      : null;

  const averageAdverseMovePctAfterReaddBeforeNextExecution =
    actualReaddOutcomeSignals.length > 0
      ? round(
          actualReaddOutcomeSignals.reduce((sum, signal) => {
            return (
              sum +
              (signal.maxAdverseMovePctAfterReaddBeforeNextExecution ?? 0)
            );
          }, 0) / actualReaddOutcomeSignals.length,
        )
      : null;

  const readdsWithStrongerFavorableFollowthroughCount =
    actualReaddOutcomeSignals.filter((signal) => {
      return (
        signal.maxFavorableMovePctAfterReaddBeforeNextExecution !== null &&
        signal.maxAdverseMovePctAfterReaddBeforeNextExecution !== null &&
        signal.maxFavorableMovePctAfterReaddBeforeNextExecution >
          signal.maxAdverseMovePctAfterReaddBeforeNextExecution
      );
    }).length;

  const readdsWithStrongerAdverseFollowthroughCount =
    actualReaddOutcomeSignals.filter((signal) => {
      return (
        signal.maxFavorableMovePctAfterReaddBeforeNextExecution !== null &&
        signal.maxAdverseMovePctAfterReaddBeforeNextExecution !== null &&
        signal.maxAdverseMovePctAfterReaddBeforeNextExecution >
          signal.maxFavorableMovePctAfterReaddBeforeNextExecution
      );
    }).length;

  const reductionAbovePreviousAverageEntryCount = actualReductions.filter(
    (signal) => signal.reductionWasAbovePreviousAverageEntry,
  ).length;

  const reductionBelowPreviousAverageEntryCount = actualReductions.filter(
    (signal) => signal.reductionWasBelowPreviousAverageEntry,
  ).length;

  const averageReductionPriceVsPreviousAverageEntryPct =
    actualReductions.length > 0
      ? round(
          actualReductions.reduce((sum, signal) => {
            return sum + (signal.executionPriceVsPreviousAverageEntryPct ?? 0);
          }, 0) / actualReductions.length,
        )
      : null;

  const reductionPricePositionValues = actualReductions
    .map((signal) => signal.executionPricePositionInRecentRangePct)
    .filter((value): value is number => value !== null);

  const averageReductionPricePositionInRecentRangePct =
    reductionPricePositionValues.length > 0
      ? round(
          reductionPricePositionValues.reduce((sum, value) => sum + value, 0) /
            reductionPricePositionValues.length,
        )
      : null;

  const reductionsNearRecentHighCount = actualReductions.filter((signal) => {
    return (
      signal.executionPricePositionInRecentRangePct !== null &&
      signal.executionPricePositionInRecentRangePct >= 0.7
    );
  }).length;

  const reductionsNearRecentLowCount = actualReductions.filter((signal) => {
    return (
      signal.executionPricePositionInRecentRangePct !== null &&
      signal.executionPricePositionInRecentRangePct <= 0.3
    );
  }).length;

  const reductionRecentRunUpValues = actualReductions
    .map((signal) => signal.recentRunUpPctBeforeExecution)
    .filter((value): value is number => value !== null);

  const reductionRecentDropValues = actualReductions
    .map((signal) => signal.recentDropPctBeforeExecution)
    .filter((value): value is number => value !== null);

  const averageReductionRecentRunUpPctBeforeExecution =
    reductionRecentRunUpValues.length > 0
      ? round(
          reductionRecentRunUpValues.reduce((sum, value) => sum + value, 0) /
            reductionRecentRunUpValues.length,
        )
      : null;

  const averageReductionRecentDropPctBeforeExecution =
    reductionRecentDropValues.length > 0
      ? round(
          reductionRecentDropValues.reduce((sum, value) => sum + value, 0) /
            reductionRecentDropValues.length,
        )
      : null;

  const reductionsWithRecentRunUpCount = actualReductions.filter((signal) => {
    return signal.recentRunUpPctBeforeExecution !== null &&
      signal.recentRunUpPctBeforeExecution >= 0.05;
  }).length;

  const reductionsWithRecentDropCount = actualReductions.filter((signal) => {
    return signal.recentDropPctBeforeExecution !== null &&
      signal.recentDropPctBeforeExecution >= 0.05;
  }).length;
  const reductionExecutionIndexes = new Set(
    actualReductions.map((signal) => signal.executionIndex),
  );
  const reductionsNearSupportCount =
    result.executionLevelRelations?.filter((relation) => {
      return reductionExecutionIndexes.has(relation.executionIndex) &&
        relation.isNearSupport;
    }).length ?? 0;
  const reductionsNearResistanceCount =
    result.executionLevelRelations?.filter((relation) => {
      return reductionExecutionIndexes.has(relation.executionIndex) &&
        relation.isNearResistance;
    }).length ?? 0;

  // ===== TIMING =====
  const averageTimeBetweenExecutionsSeconds =
    timelineRelationshipSignals?.averageTimeBetweenExecutionsSeconds ?? null;

  const minTimeBetweenExecutionsSeconds =
    timelineRelationshipSignals?.minimumTimeBetweenExecutionsMs !== null &&
    timelineRelationshipSignals?.minimumTimeBetweenExecutionsMs !== undefined
      ? round(
          timelineRelationshipSignals.minimumTimeBetweenExecutionsMs / 1000,
        )
      : null;

  const maxTimeBetweenExecutionsSeconds =
    timelineRelationshipSignals?.maximumTimeBetweenExecutionsMs !== null &&
    timelineRelationshipSignals?.maximumTimeBetweenExecutionsMs !== undefined
      ? round(
          timelineRelationshipSignals.maximumTimeBetweenExecutionsMs / 1000,
        )
      : null;

  // ===== ENTRY CONTEXT =====
  const firstEntryPrice = tradeDerivedSignals.firstExecutionPrice;
  const finalExitPrice = tradeDerivedSignals.lastExecutionPrice;
  const peakPriceDuringTrade = tradeDerivedSignals.peakPriceDuringTrade;
  const worstPriceDuringTrade = tradeDerivedSignals.worstPriceDuringTrade;

  const firstEntryPricePositionInTradeRangePct =
    calculatePricePositionInTradeRangePct({
      tradeDirection: timeline.tradeDirection,
      price: firstEntryPrice,
      peakPriceDuringTrade,
      worstPriceDuringTrade,
    });

  const firstEntryDistanceFromTradeLowPct =
    calculateFirstEntryDistanceFromTradeLowPct({
      tradeDirection: timeline.tradeDirection,
      entryPrice: firstEntryPrice,
      peakPriceDuringTrade,
      worstPriceDuringTrade,
    });

  const firstEntryDistanceFromTradeHighPct =
    calculateFirstEntryDistanceFromTradeHighPct({
      tradeDirection: timeline.tradeDirection,
      entryPrice: firstEntryPrice,
      peakPriceDuringTrade,
      worstPriceDuringTrade,
    });

  const firstEntryToPeakMovePct = calculateFirstEntryToPeakMovePct({
    tradeDirection: timeline.tradeDirection,
    entryPrice: firstEntryPrice,
    peakPriceDuringTrade,
    worstPriceDuringTrade,
  });

  const firstEntryToWorstMovePct = calculateFirstEntryToWorstMovePct({
    tradeDirection: timeline.tradeDirection,
    entryPrice: firstEntryPrice,
    peakPriceDuringTrade,
    worstPriceDuringTrade,
  });

  const firstEntryCapturedPercentOfTradeMfe =
    firstEntryToPeakMovePct !== null &&
    tradeDerivedSignals.tradeMfePct !== null &&
    tradeDerivedSignals.tradeMfePct > 0
      ? round(firstEntryToPeakMovePct / tradeDerivedSignals.tradeMfePct)
      : null;

  const firstEntryWasNearTradeLow =
    firstEntryPricePositionInTradeRangePct !== null &&
    firstEntryPricePositionInTradeRangePct <= 0.2;

  const firstEntryWasNearTradeHigh =
    firstEntryPricePositionInTradeRangePct !== null &&
    firstEntryPricePositionInTradeRangePct >= 0.8;

  // ===== EXIT CONTEXT =====
  const realizedReturnPct = calculateRealizedReturnPct({
    tradeDirection: timeline.tradeDirection,
    entryPrice: firstEntryPrice,
    exitPrice: finalExitPrice,
  });

  const realizedCapturePercentOfTradeMfe =
    realizedReturnPct !== null &&
    tradeDerivedSignals.tradeMfePct !== null &&
    tradeDerivedSignals.tradeMfePct > 0
      ? round(realizedReturnPct / tradeDerivedSignals.tradeMfePct)
      : null;

  const favorableExcursionLeftOnTablePct =
    tradeDerivedSignals.tradeMfePct !== null &&
    realizedReturnPct !== null &&
    tradeDerivedSignals.tradeMfePct > 0
      ? round(tradeDerivedSignals.tradeMfePct - realizedReturnPct)
      : null;

  const exitPricePositionInTradeRangePct =
    calculatePricePositionInTradeRangePct({
      tradeDirection: timeline.tradeDirection,
      price: finalExitPrice,
      peakPriceDuringTrade,
      worstPriceDuringTrade,
    });

  const finalExitToPeakDistancePct = calculateFinalExitToPeakDistancePct({
    tradeDirection: timeline.tradeDirection,
    exitPrice: finalExitPrice,
    peakPriceDuringTrade,
    worstPriceDuringTrade,
  });

  const exitWasNearTradeHigh =
    exitPricePositionInTradeRangePct !== null &&
    exitPricePositionInTradeRangePct >= 0.8;

  const exitWasNearTradeLow =
    exitPricePositionInTradeRangePct !== null &&
    exitPricePositionInTradeRangePct <= 0.2;

  const hadOpenLossBeforePeakOpenProfit =
    tradeLifecycleMilestoneSignals?.firstTimestampTradeHadOpenLoss !== null &&
    tradeLifecycleMilestoneSignals?.firstTimestampTradeHadOpenLoss !==
      undefined &&
    tradeLifecycleMilestoneSignals?.timestampOfPeakOpenProfit !== null &&
    tradeLifecycleMilestoneSignals?.timestampOfPeakOpenProfit !== undefined &&
    Date.parse(tradeLifecycleMilestoneSignals.firstTimestampTradeHadOpenLoss) <
      Date.parse(tradeLifecycleMilestoneSignals.timestampOfPeakOpenProfit);

  const secondsFromFirstOpenLossToPeakOpenProfit = getSecondsBetweenTimestamps(
    tradeLifecycleMilestoneSignals?.firstTimestampTradeHadOpenLoss ?? null,
    tradeLifecycleMilestoneSignals?.timestampOfPeakOpenProfit ?? null,
  );

  return createPatternInputFromCore({
    symbol: timeline.symbol,
    tradeDirection: timeline.tradeDirection,
    sessionBucket: timeline.sessionContext.sessionBucket,
    tradeStructure: {
      executionCount: executions.length,
      executionTimestamps: executions.map((e) => e.timestamp),
      firstExecutionTimestamp: executions[0].timestamp,
      lastExecutionTimestamp: executions[executions.length - 1].timestamp,
      tradeDurationSeconds: tradeDerivedSignals.tradeDurationSeconds,
      tradeDurationMinutes: round(tradeDerivedSignals.tradeDurationSeconds / 60),
      tradeCandleCount: tradeDerivedSignals.tradeCandleCount,
      totalPositionIncreaseCount,
      totalPositionDecreaseCount,
      totalPositionUnchangedCount,
      openedFromFlat,
      closedToFlat,
      hadMultipleIncreases,
      hadMultipleDecreases,
      maxPositionSize,
      finalPositionSize,
      entryPrice: firstEntryPrice,
      exitPrice: finalExitPrice,
      tradeMfe: tradeDerivedSignals.tradeMfe,
      tradeMae: tradeDerivedSignals.tradeMae,
      tradeMfePct: tradeDerivedSignals.tradeMfePct,
      tradeMaePct: tradeDerivedSignals.tradeMaePct,
      peakPriceDuringTrade,
      worstPriceDuringTrade,
      maxExecutionMfePct,
      maxExecutionMaePct,
      averageExecutionMfePct,
      averageExecutionMaePct,
    },
    entryContext: {
      firstEntryPricePositionInTradeRangePct,
      firstEntryDistanceFromTradeLowPct,
      firstEntryDistanceFromTradeHighPct,
      firstEntryOccurredDuringMarketOpenSession:
        entryContextDerivedSignals?.entryOccurredDuringMarketOpenSession ?? false,
      firstEntryOpeningRangeCandlesCountBeforeEntry:
        entryContextDerivedSignals?.openingRangeCandlesCountBeforeEntry ?? 0,
      firstEntryOpeningRangeHighBeforeEntry:
        entryContextDerivedSignals?.openingRangeHighBeforeEntry ?? null,
      firstEntryOpeningRangeLowBeforeEntry:
        entryContextDerivedSignals?.openingRangeLowBeforeEntry ?? null,
      firstEntryOccurredBeyondOpeningRangeInTradeDirection:
        entryContextDerivedSignals?.entryOccurredBeyondOpeningRangeInTradeDirection ??
        false,
      firstEntryDistanceBeyondOpeningRangePct:
        entryContextDerivedSignals?.entryDistanceBeyondOpeningRangePct ?? null,
      firstEntryOpeningRangeReferenceLevelBeforeEntry:
        entryContextDerivedSignals?.openingRangeReferenceLevelBeforeEntry ?? null,
      firstEntryOpeningRangeReferenceBreakDepthPctBeforeEntry:
        entryContextDerivedSignals?.openingRangeReferenceBreakDepthPctBeforeEntry ??
        null,
      firstEntryHadOpeningRangeReclaimBeforeEntry:
        entryContextDerivedSignals?.hadOpeningRangeReclaimBeforeEntry ?? false,
      firstEntryOpeningRangeReclaimHeldIntoEntry:
        entryContextDerivedSignals?.openingRangeReclaimHeldIntoEntry ?? false,
      firstEntryOpeningRangeConfirmationCandlesCount:
        entryContextDerivedSignals?.openingRangeConfirmationCandlesCount ?? 0,
      firstEntryDistanceFromOpeningRangeReferenceLevelPct:
        entryContextDerivedSignals?.entryDistanceFromOpeningRangeReferenceLevelPct ??
        null,
      firstEntryOccurredBeyondPreEntryRangeInTradeDirection:
        entryContextDerivedSignals?.entryOccurredBeyondPreEntryRangeInTradeDirection ??
        false,
      firstEntryDistanceBeyondPreEntryRangePct:
        entryContextDerivedSignals?.entryDistanceBeyondPreEntryRangePct ?? null,
      firstEntryToPeakMovePct,
      firstEntryToWorstMovePct,
      firstEntryCapturedPercentOfTradeMfe,
      firstEntryWasNearTradeLow,
      firstEntryWasNearTradeHigh,
      firstEntryRecentRunUpPctBeforeEntry:
        entryContextDerivedSignals?.recentRunUpPctBeforeEntry ?? null,
      firstEntryRecentDropPctBeforeEntry:
        entryContextDerivedSignals?.recentDropPctBeforeEntry ?? null,
      firstEntryRecentNetMovePctBeforeEntry:
        entryContextDerivedSignals?.recentNetMovePctBeforeEntry ?? null,
      firstEntryRecentReferenceLevelBeforeEntry:
        entryContextDerivedSignals?.recentReferenceLevelBeforeEntry ?? null,
      firstEntryRecentReferenceBreakDepthPctBeforeEntry:
        entryContextDerivedSignals?.recentReferenceBreakDepthPctBeforeEntry ??
        null,
      firstEntryHadRecentReferenceReclaimBeforeEntry:
        entryContextDerivedSignals?.hadRecentReferenceReclaimBeforeEntry ??
        false,
      firstEntryRecentReferenceReclaimHeldIntoEntry:
        entryContextDerivedSignals?.recentReferenceReclaimHeldIntoEntry ?? false,
      firstEntryRecentReferenceConfirmationCandlesCount:
        entryContextDerivedSignals?.recentReferenceConfirmationCandlesCount ?? 0,
      firstEntryDistanceFromRecentReferenceLevelPct:
        entryContextDerivedSignals?.entryDistanceFromRecentReferenceLevelPct ??
        null,
      firstEntryBullishCandlesBeforeEntryCount:
        entryContextDerivedSignals?.bullishCandlesBeforeEntryCount ?? 0,
      firstEntryBearishCandlesBeforeEntryCount:
        entryContextDerivedSignals?.bearishCandlesBeforeEntryCount ?? 0,
    },
    exitContext: {
      realizedReturnPct,
      realizedCapturePercentOfTradeMfe,
      favorableExcursionLeftOnTablePct,
      exitPricePositionInTradeRangePct,
      finalExitToPeakDistancePct,
      exitWasNearTradeHigh,
      exitWasNearTradeLow,
      postExitCandleCount: postExitDerivedSignals?.postExitCandleCount ?? 0,
      maxFavorableMovePctAfterExit:
        postExitDerivedSignals?.maxFavorableMovePctAfterExit ?? null,
      maxAdverseMovePctAfterExit:
        postExitDerivedSignals?.maxAdverseMovePctAfterExit ?? null,
      netMovePctAtEndOfPostExitWindow:
        postExitDerivedSignals?.netMovePctAtEndOfPostExitWindow ?? null,
      partialExitCount,
      hadPartialExit,
      maxFavorableMoveAfterPartialExitPct,
      maxAdverseMoveAfterPartialExitPct,
      reductionAbovePreviousAverageEntryCount,
      reductionBelowPreviousAverageEntryCount,
      averageReductionPriceVsPreviousAverageEntryPct,
      averageReductionPricePositionInRecentRangePct,
      reductionsNearRecentHighCount,
      reductionsNearRecentLowCount,
      averageReductionRecentRunUpPctBeforeExecution,
      averageReductionRecentDropPctBeforeExecution,
      reductionsWithRecentRunUpCount,
      reductionsWithRecentDropCount,
    },
    scalingContext: {
      readdAfterReductionCount,
      hadReaddAfterReduction,
      averageReaddPriceChangeFromPriorReductionPct,
      averageFavorableMovePctAfterPartialExitBeforeReadd,
      averageAdverseMovePctAfterPartialExitBeforeReadd,
      averageFavorableMovePctAfterReaddBeforeNextExecution,
      averageAdverseMovePctAfterReaddBeforeNextExecution,
      readdsWithStrongerFavorableFollowthroughCount,
      readdsWithStrongerAdverseFollowthroughCount,
      readdsAfterRecentRunUpCount,
      readdsAfterRecentDropCount,
      addCountAfterInitialEntry,
      addAbovePreviousAverageEntryCount,
      addBelowPreviousAverageEntryCount,
      averageAddPriceVsPreviousAverageEntryPct,
      averageAddPricePositionInRecentRangePct,
      averageAddRecentRunUpPctBeforeExecution,
      averageAddRecentDropPctBeforeExecution,
      addsWithRecentRunUpCount,
      addsWithRecentDropCount,
    },
    timingContext: {
      averageTimeBetweenExecutionsSeconds,
      minTimeBetweenExecutionsSeconds,
      maxTimeBetweenExecutionsSeconds,
      averageCandlesBetweenExecutions:
        timelineRelationshipSignals?.averageCandlesBetweenExecutions ?? null,
      executionsPerMinute:
        timelineRelationshipSignals?.executionsPerMinute ?? null,
    },
    supportResistanceContext: {
      firstEntryNearestSupportBelowPrice:
        firstExecutionLevelRelation?.nearestSupportBelow?.price ?? null,
      firstEntryNearestResistanceBelowPrice:
        firstExecutionLevelRelation?.nearestResistanceBelow?.price ?? null,
      firstEntryNearestResistanceAbovePrice:
        firstExecutionLevelRelation?.nearestResistanceAbove?.price ?? null,
      firstEntryDistanceToNearestSupportPct:
        firstExecutionLevelRelation?.distanceToNearestSupportPct ?? null,
      firstEntryDistanceAboveNearestResistanceBelowPct:
        firstExecutionLevelRelation?.distanceAboveNearestResistanceBelowPct ??
        null,
      firstEntryDistanceToNearestResistancePct:
        firstExecutionLevelRelation?.distanceToNearestResistancePct ?? null,
      firstEntryOccurredNearSupport:
        firstExecutionLevelRelation?.isNearSupport ?? false,
      firstEntryOccurredNearResistance:
        firstExecutionLevelRelation?.isNearResistance ?? false,
      firstEntryClearedNearestResistanceBelow:
        firstExecutionLevelRelation?.clearedNearestResistanceBelow ?? false,
      firstEntryHadRoomAboveAfterClearingResistance:
        firstExecutionLevelRelation?.hasRoomAboveAfterClearingResistance ?? false,
      firstEntryOccurredBelowNearestSupport:
        firstExecutionLevelRelation?.occurredBelowNearestSupport ?? false,
      firstEntryOccurredInOpenAir:
        firstExecutionLevelRelation?.occurredInOpenAir ?? false,
      firstEntryNearestReferenceLevelLabel:
        firstExecutionLevelRelation?.nearestReferenceLevelLabel ?? null,
      firstEntryWasAboveVwap:
        result.dynamicLevels?.vwap !== null &&
        result.dynamicLevels?.vwap !== undefined &&
        firstEntryPrice > result.dynamicLevels.vwap,
      firstEntryWasBelowVwap:
        result.dynamicLevels?.vwap !== null &&
        result.dynamicLevels?.vwap !== undefined &&
        firstEntryPrice < result.dynamicLevels.vwap,
      firstEntryDistanceFromVwapPct: calculateDistanceFromLevelPct(
        firstEntryPrice,
        result.dynamicLevels?.vwap,
      ),
      firstEntryDistanceFromEma9Pct: calculateDistanceFromLevelPct(
        firstEntryPrice,
        result.dynamicLevels?.ema9,
      ),
      firstEntryDistanceFromEma20Pct: calculateDistanceFromLevelPct(
        firstEntryPrice,
        result.dynamicLevels?.ema20,
      ),
      firstEntryHasNearbyStructureOnBothSides:
        firstExecutionLevelRelation?.hasNearbyStructureOnBothSides ?? false,
      firstEntryDistanceBetweenNearestSupportAndResistancePct:
        firstExecutionLevelRelation?.distanceBetweenNearestSupportAndResistancePct ??
        null,
      firstEntryResistanceLevelsAboveWithinClusterCount:
        firstExecutionLevelRelation?.resistanceLevelsAboveWithinClusterCount ?? 0,
      firstEntryHasStackedResistanceAbove:
        firstExecutionLevelRelation?.hasStackedResistanceAbove ?? false,
      finalExitDistanceToNearestSupportPct:
        finalExecutionLevelRelation?.distanceToNearestSupportPct ?? null,
      finalExitDistanceToNearestResistancePct:
        finalExecutionLevelRelation?.distanceToNearestResistancePct ?? null,
      finalExitOccurredNearSupport:
        finalExecutionLevelRelation?.isNearSupport ?? false,
      finalExitOccurredNearResistance:
        finalExecutionLevelRelation?.isNearResistance ?? false,
      finalExitSupportLevelsBelowWithinClusterCount:
        finalExecutionLevelRelation?.supportLevelsBelowWithinClusterCount ?? 0,
      finalExitHasStackedSupportBelow:
        finalExecutionLevelRelation?.hasStackedSupportBelow ?? false,
      reductionsNearSupportCount,
      reductionsNearResistanceCount,
      addsNearSupportCount,
      addsNearResistanceCount,
      addsAboveResistanceCount,
      addsAboveResistanceWithRoomCount,
      addsBelowSupportCount,
      averageAddDistanceToNearestSupportPct,
      averageAddDistanceToNearestResistancePct,
      averageAddRoomToNextResistancePct,
      hadInsufficientCandleDataForStructuralContext:
        result.hadInsufficientCandleDataForStructure ?? true,
      hadSupportResistanceContextAvailable:
        result.structuralContextWindow !== undefined &&
        result.executionLevelRelations !== undefined,
    },
    recoveryContext: {
      maxGivebackFromPeakOpenProfitPct,
      peakOpenProfitPctOfBasis:
        tradeLifecycleMilestoneSignals?.peakOpenProfitPctOfBasis ?? null,
      worstDrawdownPctOfBasis:
        tradeLifecycleMilestoneSignals?.worstDrawdownPctOfBasis ?? null,
      hadOpenLossBeforePeakOpenProfit,
      secondsFromFirstOpenLossToPeakOpenProfit,
      hadPeakOpenProfitBeforeWorstDrawdown:
        dangerWindowDerivedSignals?.hadPeakOpenProfitBeforeWorstDrawdown ?? false,
      drawdownFromPeakOpenProfitPctOfBasis:
        dangerWindowDerivedSignals?.drawdownFromPeakOpenProfitPctOfBasis ?? null,
      hadReductionAfterPeakOpenProfitBeforeWorstDrawdown:
        dangerWindowDerivedSignals?.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown ??
        false,
      reductionCountAfterPeakOpenProfitBeforeWorstDrawdown:
        dangerWindowDerivedSignals?.reductionCountAfterPeakOpenProfitBeforeWorstDrawdown ??
        0,
      secondsFromPeakOpenProfitToWorstDrawdown:
        dangerWindowDerivedSignals?.secondsFromPeakOpenProfitToWorstDrawdown ??
        null,
      secondsFromPeakOpenProfitToFirstReduction:
        dangerWindowDerivedSignals?.secondsFromPeakOpenProfitToFirstReduction ??
        null,
    },
  });
}
