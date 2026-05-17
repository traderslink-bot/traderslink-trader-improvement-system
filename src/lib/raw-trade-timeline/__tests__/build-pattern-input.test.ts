// 2026-04-12 01:50 PM America/Toronto
// PURPOSE:
// Validates the pattern input builder.
// Ensures correct aggregation from raw timeline result.

import { describe, expect, it } from "vitest";
import { createRawTradeTimeline } from "../../raw-trade-timeline/builders/create-raw-trade-timeline";
import { buildPatternInput } from "../../pattern-input/builders/build-pattern-input";
import { sampleCreateRawTradeTimelineInput } from "../../raw-trade-timeline/__fixtures__/sample-create-raw-trade-timeline-input";

describe("buildPatternInput", () => {
  it("builds a clean pattern input object from raw trade timeline", () => {
    const rawResult = createRawTradeTimeline(
      sampleCreateRawTradeTimelineInput,
    );

    const patternInput = buildPatternInput(rawResult);

    expect(patternInput.symbol).toBe("ABCD");
    expect(patternInput.tradeDirection).toBe("long");
    expect(patternInput.sessionBucket).toBe("market_open");
    expect(patternInput.tradeStructure.executionCount).toBe(3);
    expect(patternInput.entryContext.firstEntryOccurredDuringMarketOpenSession).toBe(true);
    expect(patternInput.supportResistanceContext.hadSupportResistanceContextAvailable).toBe(true);
    expect(patternInput.recoveryContext.hadPeakOpenProfitBeforeWorstDrawdown).toBe(false);

    expect(patternInput.executionCount).toBe(3);
    expect(patternInput.tradeDurationSeconds).toBe(340);
    expect(patternInput.tradeCandleCount).toBe(6);

    expect(patternInput.totalPositionIncreaseCount).toBe(2);
    expect(patternInput.totalPositionDecreaseCount).toBe(1);

    expect(patternInput.openedFromFlat).toBe(true);
    expect(patternInput.closedToFlat).toBe(true);

    expect(patternInput.entryPrice).toBe(1.185);
    expect(patternInput.exitPrice).toBe(1.295);

    expect(patternInput.tradeMfePct).toBe(0.147679);
    expect(patternInput.tradeMaePct).toBe(0.012658);

    expect(patternInput.maxExecutionMfePct).toBeGreaterThan(0);
    expect(patternInput.averageExecutionMfePct).toBeGreaterThan(0);

    expect(patternInput.averageTimeBetweenExecutionsSeconds).toBe(170);
    expect(patternInput.executionsPerMinute).toBeGreaterThan(0);

    expect(patternInput.firstEntryRecentRunUpPctBeforeEntry).not.toBeNull();
    expect(patternInput.firstEntryRecentReferenceLevelBeforeEntry).not.toBeNull();
    expect(patternInput.firstEntryHadRecentReferenceReclaimBeforeEntry).toBe(true);
    expect(patternInput.firstEntryRecentReferenceConfirmationCandlesCount).toBeGreaterThan(0);
    expect(patternInput.firstEntryOccurredDuringMarketOpenSession).toBe(true);
    expect(patternInput.firstEntryOpeningRangeCandlesCountBeforeEntry).toBe(3);
    expect(patternInput.firstEntryOpeningRangeHighBeforeEntry).not.toBeNull();
    expect(patternInput.firstEntryOpeningRangeLowBeforeEntry).not.toBeNull();
    expect(patternInput.firstEntryOpeningRangeReferenceLevelBeforeEntry).not.toBeNull();
    expect(patternInput.firstEntryHadOpeningRangeReclaimBeforeEntry).toBe(true);
    expect(patternInput.hadSupportResistanceContextAvailable).toBe(true);
    expect(patternInput.hadInsufficientCandleDataForStructuralContext).toBe(false);
    expect(patternInput.firstEntryOccurredInOpenAir).toBe(true);
    expect(patternInput.firstEntryDistanceFromVwapPct).not.toBeNull();
    expect(patternInput.firstEntryDistanceFromEma9Pct).not.toBeNull();
    expect(patternInput.firstEntryDistanceFromEma20Pct).not.toBeNull();
    expect(typeof patternInput.firstEntryClearedNearestResistanceBelow).toBe("boolean");
    expect(typeof patternInput.firstEntryHadRoomAboveAfterClearingResistance).toBe("boolean");
    expect(patternInput.firstEntryHasNearbyStructureOnBothSides).toBe(false);
    expect(patternInput.postExitCandleCount).toBe(1);
    expect(patternInput.maxFavorableMovePctAfterExit).toBe(0.011583);
    expect(patternInput.maxAdverseMovePctAfterExit).toBe(0.027027);
    expect(patternInput.netMovePctAtEndOfPostExitWindow).toBe(-0.019305);
    expect(patternInput.maxGivebackFromPeakOpenProfitPct).not.toBeNull();
    expect(patternInput.peakOpenProfitPctOfBasis).not.toBeNull();
    expect(patternInput.worstDrawdownPctOfBasis).not.toBeNull();
    expect(patternInput.hadPeakOpenProfitBeforeWorstDrawdown).toBe(false);
    expect(patternInput.hadPartialExit).toBe(false);
    expect(patternInput.hadReaddAfterReduction).toBe(false);
    expect(patternInput.averageReaddPriceChangeFromPriorReductionPct).toBeNull();
    expect(patternInput.averageFavorableMovePctAfterPartialExitBeforeReadd).toBeNull();
    expect(patternInput.averageAdverseMovePctAfterPartialExitBeforeReadd).toBeNull();
    expect(patternInput.averageFavorableMovePctAfterReaddBeforeNextExecution).toBeNull();
    expect(patternInput.averageAdverseMovePctAfterReaddBeforeNextExecution).toBeNull();
    expect(patternInput.readdsWithStrongerFavorableFollowthroughCount).toBe(0);
    expect(patternInput.readdsWithStrongerAdverseFollowthroughCount).toBe(0);
    expect(patternInput.readdsAfterRecentRunUpCount).toBe(0);
    expect(patternInput.readdsAfterRecentDropCount).toBe(0);
    expect(patternInput.addCountAfterInitialEntry).toBe(1);
    expect(patternInput.reductionAbovePreviousAverageEntryCount).toBe(1);
    expect(patternInput.reductionBelowPreviousAverageEntryCount).toBe(0);
    expect(patternInput.averageAddRecentRunUpPctBeforeExecution).not.toBeNull();
    expect(patternInput.averageReductionRecentRunUpPctBeforeExecution).not.toBeNull();
    expect(patternInput.addsNearResistanceCount).toBe(0);
    expect(patternInput.addsAboveResistanceWithRoomCount).toBe(0);
    expect(patternInput.addsNearSupportCount).toBe(0);
    expect(patternInput.reductionsNearSupportCount).toBe(0);
    expect(patternInput.reductionsNearResistanceCount).toBe(0);
  });
});
