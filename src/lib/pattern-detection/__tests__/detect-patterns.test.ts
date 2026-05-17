import { describe, expect, it } from "vitest";
import {
  normalizePatternInputShape,
  type LegacyPatternInputShape,
  type PatternInput,
} from "../../pattern-input/types/pattern-input";
import { detectPatterns } from "../detect-patterns";

function createBasePatternInput(
  overrides: Partial<LegacyPatternInputShape> = {},
): PatternInput {
  return normalizePatternInputShape({
    symbol: "ABCD",
    tradeDirection: "long",
    sessionBucket: "market_open",
    executionCount: 3,
    executionTimestamps: [
      "2024-04-12T13:33:30.000Z",
      "2024-04-12T13:36:15.000Z",
      "2024-04-12T13:39:10.000Z",
    ],
    firstExecutionTimestamp: "2024-04-12T13:33:30.000Z",
    lastExecutionTimestamp: "2024-04-12T13:39:10.000Z",
    tradeDurationSeconds: 340,
    tradeDurationMinutes: 5.666667,
    tradeCandleCount: 6,
    totalPositionIncreaseCount: 2,
    totalPositionDecreaseCount: 1,
    totalPositionUnchangedCount: 0,
    openedFromFlat: true,
    closedToFlat: true,
    hadMultipleIncreases: true,
    hadMultipleDecreases: false,
    maxPositionSize: 150,
    finalPositionSize: 0,
    entryPrice: 1.185,
    exitPrice: 1.295,
    tradeMfe: 0.175,
    tradeMae: 0.015,
    tradeMfePct: 0.147679,
    tradeMaePct: 0.012658,
    peakPriceDuringTrade: 1.36,
    worstPriceDuringTrade: 1.17,
    firstEntryPricePositionInTradeRangePct: 0.78,
    firstEntryDistanceFromTradeLowPct: 0.06,
    firstEntryDistanceFromTradeHighPct: 0.01,
    firstEntryOccurredDuringMarketOpenSession: true,
    firstEntryOpeningRangeCandlesCountBeforeEntry: 3,
    firstEntryOpeningRangeHighBeforeEntry: 1.18,
    firstEntryOpeningRangeLowBeforeEntry: 1.1,
    firstEntryOccurredBeyondOpeningRangeInTradeDirection: false,
    firstEntryDistanceBeyondOpeningRangePct: null,
    firstEntryOpeningRangeReferenceLevelBeforeEntry: null,
    firstEntryOpeningRangeReferenceBreakDepthPctBeforeEntry: null,
    firstEntryHadOpeningRangeReclaimBeforeEntry: false,
    firstEntryOpeningRangeReclaimHeldIntoEntry: false,
    firstEntryOpeningRangeConfirmationCandlesCount: 0,
    firstEntryDistanceFromOpeningRangeReferenceLevelPct: null,
    firstEntryOccurredBeyondPreEntryRangeInTradeDirection: false,
    firstEntryDistanceBeyondPreEntryRangePct: null,
    firstEntryToPeakMovePct: 0.03,
    firstEntryToWorstMovePct: 0.025,
    firstEntryCapturedPercentOfTradeMfe: 0.22,
    firstEntryWasNearTradeLow: false,
    firstEntryWasNearTradeHigh: false,
    firstEntryRecentRunUpPctBeforeEntry: 0.08,
    firstEntryRecentDropPctBeforeEntry: 0.01,
    firstEntryRecentNetMovePctBeforeEntry: 0.07,
    firstEntryRecentReferenceLevelBeforeEntry: 1.12,
    firstEntryRecentReferenceBreakDepthPctBeforeEntry: null,
    firstEntryHadRecentReferenceReclaimBeforeEntry: false,
    firstEntryRecentReferenceReclaimHeldIntoEntry: false,
    firstEntryRecentReferenceConfirmationCandlesCount: 0,
    firstEntryDistanceFromRecentReferenceLevelPct: null,
    firstEntryBullishCandlesBeforeEntryCount: 3,
    firstEntryBearishCandlesBeforeEntryCount: 0,
    firstEntryNearestSupportBelowPrice: 1.15,
    firstEntryNearestResistanceBelowPrice: 1.17,
    firstEntryNearestResistanceAbovePrice: 1.21,
    firstEntryDistanceToNearestSupportPct: 0.029536,
    firstEntryDistanceAboveNearestResistanceBelowPct: 0.012658,
    firstEntryDistanceToNearestResistancePct: 0.021097,
    firstEntryOccurredNearSupport: false,
    firstEntryOccurredNearResistance: false,
    firstEntryClearedNearestResistanceBelow: false,
    firstEntryHadRoomAboveAfterClearingResistance: false,
    firstEntryOccurredBelowNearestSupport: false,
    firstEntryOccurredInOpenAir: true,
    firstEntryNearestReferenceLevelLabel: null,
    firstEntryWasAboveVwap: true,
    firstEntryWasBelowVwap: false,
    firstEntryDistanceFromVwapPct: 0.012658,
    firstEntryDistanceFromEma9Pct: 0.009283,
    firstEntryDistanceFromEma20Pct: 0.01519,
    firstEntryHasNearbyStructureOnBothSides: true,
    firstEntryDistanceBetweenNearestSupportAndResistancePct: 0.050633,
    firstEntryResistanceLevelsAboveWithinClusterCount: 0,
    firstEntryHasStackedResistanceAbove: false,
    realizedReturnPct: 0.092827,
    realizedCapturePercentOfTradeMfe: 0.628573,
    favorableExcursionLeftOnTablePct: 0.054852,
    exitPricePositionInTradeRangePct: 0.657895,
    finalExitToPeakDistancePct: 0.050193,
    exitWasNearTradeHigh: false,
    exitWasNearTradeLow: false,
    postExitCandleCount: 1,
    maxFavorableMovePctAfterExit: 0.011583,
    maxAdverseMovePctAfterExit: 0.027027,
    netMovePctAtEndOfPostExitWindow: -0.019305,
    maxGivebackFromPeakOpenProfitPct: 0.6,
    partialExitCount: 1,
    hadPartialExit: true,
    maxFavorableMoveAfterPartialExitPct: 0.01,
    maxAdverseMoveAfterPartialExitPct: 0.04,
    reductionAbovePreviousAverageEntryCount: 1,
    reductionBelowPreviousAverageEntryCount: 0,
    averageReductionPriceVsPreviousAverageEntryPct: 0.04,
    averageReductionPricePositionInRecentRangePct: 0.82,
    reductionsNearRecentHighCount: 1,
    reductionsNearRecentLowCount: 0,
    averageReductionRecentRunUpPctBeforeExecution: 0.07,
    averageReductionRecentDropPctBeforeExecution: 0.01,
    reductionsWithRecentRunUpCount: 1,
    reductionsWithRecentDropCount: 0,
    readdAfterReductionCount: 1,
    hadReaddAfterReduction: true,
    averageReaddPriceChangeFromPriorReductionPct: 0.03,
    averageFavorableMovePctAfterPartialExitBeforeReadd: 0.02,
    averageAdverseMovePctAfterPartialExitBeforeReadd: 0.01,
    averageFavorableMovePctAfterReaddBeforeNextExecution: 0.02,
    averageAdverseMovePctAfterReaddBeforeNextExecution: 0.01,
    readdsWithStrongerFavorableFollowthroughCount: 1,
    readdsWithStrongerAdverseFollowthroughCount: 0,
    readdsAfterRecentRunUpCount: 1,
    readdsAfterRecentDropCount: 0,
    peakOpenProfitPctOfBasis: 0.07,
    worstDrawdownPctOfBasis: -0.02,
    hadOpenLossBeforePeakOpenProfit: false,
    secondsFromFirstOpenLossToPeakOpenProfit: null,
    hadPeakOpenProfitBeforeWorstDrawdown: false,
    drawdownFromPeakOpenProfitPctOfBasis: null,
    hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: false,
    reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 0,
    secondsFromPeakOpenProfitToWorstDrawdown: null,
    secondsFromPeakOpenProfitToFirstReduction: null,
    finalExitDistanceToNearestSupportPct: 0.081081,
    finalExitDistanceToNearestResistancePct: null,
    finalExitOccurredNearSupport: false,
    finalExitOccurredNearResistance: false,
    finalExitSupportLevelsBelowWithinClusterCount: 0,
    finalExitHasStackedSupportBelow: false,
    reductionsNearSupportCount: 0,
    reductionsNearResistanceCount: 0,
    addsNearSupportCount: 0,
    addsNearResistanceCount: 0,
    addsAboveResistanceCount: 0,
    addsAboveResistanceWithRoomCount: 0,
    addsBelowSupportCount: 0,
    averageAddDistanceToNearestSupportPct: 0.03,
    averageAddDistanceToNearestResistancePct: 0.02,
    averageAddRoomToNextResistancePct: null,
    hadInsufficientCandleDataForStructuralContext: false,
    hadSupportResistanceContextAvailable: true,
    maxExecutionMfePct: 0.097046,
    maxExecutionMaePct: 0.027888,
    averageExecutionMfePct: 0.064098,
    averageExecutionMaePct: 0.022524,
    averageTimeBetweenExecutionsSeconds: 170,
    minTimeBetweenExecutionsSeconds: 165,
    maxTimeBetweenExecutionsSeconds: 175,
    averageCandlesBetweenExecutions: 3,
    executionsPerMinute: 0.529412,
    addCountAfterInitialEntry: 1,
    addAbovePreviousAverageEntryCount: 1,
    addBelowPreviousAverageEntryCount: 0,
    averageAddPriceVsPreviousAverageEntryPct: 0.05,
    averageAddPricePositionInRecentRangePct: 0.82,
    averageAddRecentRunUpPctBeforeExecution: 0.07,
    averageAddRecentDropPctBeforeExecution: 0.01,
    addsWithRecentRunUpCount: 1,
    addsWithRecentDropCount: 0,
    ...overrides,
  });
}

describe("detectPatterns", () => {
  it("detects new entry, exit, and scaling patterns from expanded PatternInput", () => {
    const result = detectPatterns(createBasePatternInput());
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("entry_after_recent_run_up");
    expect(ids).toContain("late_favorable_extension_entry_structure");
    expect(ids).toContain("readd_after_reduction");
    expect(ids).toContain("adding_above_prior_basis");
    expect(ids).toContain("add_into_strength");
    expect(ids).toContain("add_after_recent_run_up");
    expect(ids).not.toContain("balanced_scaling_with_profit_protection");
    expect(ids).not.toContain("aggressive_adding_with_failed_profit_protection");
    expect(ids).toContain("peak_profit_giveback_structure");
    expect(ids).toContain("partial_exit_with_adverse_followthrough");
    expect(ids).toContain("exit_avoided_adverse_followthrough");
    expect(ids).not.toContain("missed_post_exit_continuation");
    expect(ids).toContain("reduction_into_strength");
    expect(ids).toContain("reduction_after_recent_run_up");
    expect(ids).toContain("failed_profit_protection_structure");
    expect(ids).not.toContain("held_through_danger_after_peak_profit");
    expect(ids).not.toContain("delayed_risk_response_after_peak_profit");
    expect(ids).not.toContain("constructive_readd_after_reduction");
    expect(ids).not.toContain("balanced_management_with_constructive_exit");
  });

  it("does not detect recent run-up entry when the pre-entry structure is not directional", () => {
    const result = detectPatterns(
      createBasePatternInput({
        firstEntryRecentRunUpPctBeforeEntry: 0.02,
        firstEntryBullishCandlesBeforeEntryCount: 1,
        firstEntryBearishCandlesBeforeEntryCount: 1,
        hadReaddAfterReduction: false,
        readdAfterReductionCount: 0,
        addAbovePreviousAverageEntryCount: 0,
        averageAddPriceVsPreviousAverageEntryPct: null,
        averageAddRecentRunUpPctBeforeExecution: 0.01,
        averageAddRecentDropPctBeforeExecution: 0.07,
        addsWithRecentRunUpCount: 0,
        addsWithRecentDropCount: 1,
        hadPartialExit: false,
        partialExitCount: 0,
        maxAdverseMoveAfterPartialExitPct: null,
        postExitCandleCount: 1,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.005,
        netMovePctAtEndOfPostExitWindow: -0.002,
        reductionAbovePreviousAverageEntryCount: 0,
        reductionBelowPreviousAverageEntryCount: 1,
        averageReductionPriceVsPreviousAverageEntryPct: -0.03,
        averageReductionPricePositionInRecentRangePct: 0.2,
        reductionsNearRecentHighCount: 0,
        reductionsNearRecentLowCount: 1,
        averageReductionRecentRunUpPctBeforeExecution: 0.01,
        averageReductionRecentDropPctBeforeExecution: 0.06,
        reductionsWithRecentRunUpCount: 0,
        reductionsWithRecentDropCount: 1,
        maxGivebackFromPeakOpenProfitPct: 0.2,
        peakOpenProfitPctOfBasis: 0.04,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).not.toContain("entry_after_recent_run_up");
    expect(ids).not.toContain("late_favorable_extension_entry_structure");
    expect(ids).not.toContain("readd_after_reduction");
    expect(ids).not.toContain("adding_above_prior_basis");
    expect(ids).not.toContain("add_into_strength");
    expect(ids).not.toContain("add_after_recent_run_up");
    expect(ids).not.toContain("partial_exit_with_adverse_followthrough");
    expect(ids).not.toContain("peak_profit_giveback_structure");
    expect(ids).toContain("reduction_into_weakness");
    expect(ids).toContain("reduction_after_recent_drop");
    expect(ids).toContain("profit_protection_present");
    expect(ids).toContain("balanced_scaling_with_profit_protection");
    expect(ids).not.toContain("failed_profit_protection_structure");
  });

  it("detects add into weakness when adds happen below basis and low in recent range", () => {
    const result = detectPatterns(
      createBasePatternInput({
        addAbovePreviousAverageEntryCount: 0,
        addBelowPreviousAverageEntryCount: 1,
        averageAddPriceVsPreviousAverageEntryPct: -0.03,
        averageAddPricePositionInRecentRangePct: 0.22,
        averageAddRecentRunUpPctBeforeExecution: 0.01,
        averageAddRecentDropPctBeforeExecution: 0.06,
        addsWithRecentRunUpCount: 0,
        addsWithRecentDropCount: 1,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("add_into_weakness");
    expect(ids).not.toContain("add_into_strength");
    expect(ids).toContain("add_after_recent_drop");
  });

  it("detects constructive pullback entry structure when a favorable entry followed a direction-aware pullback", () => {
    const result = detectPatterns(
      createBasePatternInput({
        firstEntryPricePositionInTradeRangePct: 0.22,
        firstEntryCapturedPercentOfTradeMfe: 0.74,
        firstEntryToWorstMovePct: 0.01,
        firstEntryRecentRunUpPctBeforeEntry: 0.01,
        firstEntryRecentDropPctBeforeEntry: 0.07,
        firstEntryRecentNetMovePctBeforeEntry: -0.04,
        firstEntryBullishCandlesBeforeEntryCount: 0,
        firstEntryBearishCandlesBeforeEntryCount: 3,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("constructive_pullback_entry_structure");
    expect(ids).toContain("advantaged_entry_structure");
    expect(ids).toContain("entry_after_recent_drop");
    expect(ids).not.toContain("late_favorable_extension_entry_structure");
  });

  it("detects deep constructive pullback entry structure when a larger pullback still led to a strong entry", () => {
    const result = detectPatterns(
      createBasePatternInput({
        firstEntryPricePositionInTradeRangePct: 0.22,
        firstEntryCapturedPercentOfTradeMfe: 0.74,
        firstEntryToWorstMovePct: 0.01,
        firstEntryRecentRunUpPctBeforeEntry: 0.01,
        firstEntryRecentDropPctBeforeEntry: 0.1,
        firstEntryRecentNetMovePctBeforeEntry: -0.06,
        firstEntryBullishCandlesBeforeEntryCount: 1,
        firstEntryBearishCandlesBeforeEntryCount: 4,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("deep_constructive_pullback_entry_structure");
    expect(ids).toContain("constructive_pullback_entry_structure");
    expect(ids).not.toContain("weak_pullback_entry_structure");
  });

  it("detects add into strength with constructive final exit when constructive pressing still ended with a disciplined exit", () => {
    const result = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 1,
        addAbovePreviousAverageEntryCount: 1,
        averageAddPriceVsPreviousAverageEntryPct: 0.05,
        averageAddPricePositionInRecentRangePct: 0.82,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("add_into_strength_with_constructive_final_exit");
    expect(ids).toContain("add_into_strength");
  });

  it("detects recovery with add into strength and constructive final exit when early adversity recovered into constructive pressing", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.05,
        addCountAfterInitialEntry: 1,
        addAbovePreviousAverageEntryCount: 1,
        averageAddPriceVsPreviousAverageEntryPct: 0.05,
        averageAddPricePositionInRecentRangePct: 0.82,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "recovery_with_add_into_strength_and_constructive_final_exit",
    );
    expect(ids).toContain("add_into_strength_with_constructive_final_exit");
  });

  it("detects add into strength with timely profit protection and constructive final exit when constructive pressing was also protected in time", () => {
    const result = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 1,
        addAbovePreviousAverageEntryCount: 1,
        averageAddPriceVsPreviousAverageEntryPct: 0.05,
        averageAddPricePositionInRecentRangePct: 0.82,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 1,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "add_into_strength_with_timely_profit_protection_and_constructive_final_exit",
    );
    expect(ids).toContain("add_into_strength_with_constructive_final_exit");
    expect(ids).toContain("timely_profit_protection_with_constructive_final_exit");
  });

  it("detects recovery with add into strength and timely profit protection and constructive final exit when early adversity recovered into protected constructive pressing", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.05,
        addCountAfterInitialEntry: 1,
        addAbovePreviousAverageEntryCount: 1,
        averageAddPriceVsPreviousAverageEntryPct: 0.05,
        averageAddPricePositionInRecentRangePct: 0.82,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 1,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "recovery_with_add_into_strength_and_timely_profit_protection_and_constructive_final_exit",
    );
    expect(ids).toContain(
      "add_into_strength_with_timely_profit_protection_and_constructive_final_exit",
    );
  });

  it("detects add into strength with missed final continuation when constructive pressing still left favorable continuation behind", () => {
    const result = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 1,
        addAbovePreviousAverageEntryCount: 1,
        averageAddPriceVsPreviousAverageEntryPct: 0.05,
        averageAddPricePositionInRecentRangePct: 0.82,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("add_into_strength_with_missed_final_continuation");
    expect(ids).toContain("missed_post_exit_continuation");
  });

  it("detects recovery with add into strength and missed final continuation when early adversity recovered but the constructive pressing exit still left continuation behind", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.05,
        addCountAfterInitialEntry: 1,
        addAbovePreviousAverageEntryCount: 1,
        averageAddPriceVsPreviousAverageEntryPct: 0.05,
        averageAddPricePositionInRecentRangePct: 0.82,
        maxGivebackFromPeakOpenProfitPct: 0.2,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "recovery_with_add_into_strength_and_missed_final_continuation",
    );
    expect(ids).toContain("add_into_strength_with_missed_final_continuation");
  });

  it("detects disciplined favorable extension entry structure when continuation context still led to a strong entry", () => {
    const result = detectPatterns(
      createBasePatternInput({
        firstEntryPricePositionInTradeRangePct: 0.24,
        firstEntryCapturedPercentOfTradeMfe: 0.72,
        firstEntryToWorstMovePct: 0.01,
        firstEntryRecentRunUpPctBeforeEntry: 0.08,
        firstEntryRecentDropPctBeforeEntry: 0.01,
        firstEntryRecentNetMovePctBeforeEntry: 0.07,
        firstEntryBullishCandlesBeforeEntryCount: 3,
        firstEntryBearishCandlesBeforeEntryCount: 0,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("disciplined_favorable_extension_entry_structure");
    expect(ids).toContain("advantaged_entry_structure");
    expect(ids).toContain("entry_after_recent_run_up");
    expect(ids).not.toContain("late_favorable_extension_entry_structure");
  });

  it("detects measured favorable extension entry structure when a real but controlled extension still led to a strong entry", () => {
    const result = detectPatterns(
      createBasePatternInput({
        firstEntryPricePositionInTradeRangePct: 0.24,
        firstEntryCapturedPercentOfTradeMfe: 0.72,
        firstEntryToWorstMovePct: 0.01,
        firstEntryRecentRunUpPctBeforeEntry: 0.08,
        firstEntryRecentDropPctBeforeEntry: 0.01,
        firstEntryRecentNetMovePctBeforeEntry: 0.05,
        firstEntryBullishCandlesBeforeEntryCount: 3,
        firstEntryBearishCandlesBeforeEntryCount: 0,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("measured_favorable_extension_entry_structure");
    expect(ids).toContain("disciplined_favorable_extension_entry_structure");
    expect(ids).not.toContain("overextended_chase_entry_structure");
  });

  it("detects breakout entry structure when a measured favorable extension still led to a strong continuation entry", () => {
    const result = detectPatterns(
      createBasePatternInput({
        firstEntryPricePositionInTradeRangePct: 0.24,
        firstEntryCapturedPercentOfTradeMfe: 0.72,
        firstEntryToWorstMovePct: 0.01,
        firstEntryRecentRunUpPctBeforeEntry: 0.08,
        firstEntryRecentDropPctBeforeEntry: 0.01,
        firstEntryRecentNetMovePctBeforeEntry: 0.05,
        firstEntryBullishCandlesBeforeEntryCount: 3,
        firstEntryBearishCandlesBeforeEntryCount: 0,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("breakout_entry_structure");
    expect(ids).toContain("measured_favorable_extension_entry_structure");
  });

  it("detects overextended chase entry structure when a very stretched extension still led to a late weak entry", () => {
    const result = detectPatterns(
      createBasePatternInput({
        firstEntryPricePositionInTradeRangePct: 0.86,
        firstEntryCapturedPercentOfTradeMfe: 0.22,
        firstEntryToWorstMovePct: 0.035,
        firstEntryRecentRunUpPctBeforeEntry: 0.1,
        firstEntryRecentDropPctBeforeEntry: 0.01,
        firstEntryRecentNetMovePctBeforeEntry: 0.07,
        firstEntryBullishCandlesBeforeEntryCount: 4,
        firstEntryBearishCandlesBeforeEntryCount: 1,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("overextended_chase_entry_structure");
    expect(ids).toContain("late_favorable_extension_entry_structure");
    expect(ids).not.toContain("constructive_pullback_entry_structure");
  });

  it("detects breakout chase entry structure when a stretched breakout-style entry was chased too late", () => {
    const result = detectPatterns(
      createBasePatternInput({
        firstEntryPricePositionInTradeRangePct: 0.86,
        firstEntryCapturedPercentOfTradeMfe: 0.22,
        firstEntryToWorstMovePct: 0.035,
        firstEntryRecentRunUpPctBeforeEntry: 0.1,
        firstEntryRecentDropPctBeforeEntry: 0.01,
        firstEntryRecentNetMovePctBeforeEntry: 0.05,
        firstEntryBullishCandlesBeforeEntryCount: 4,
        firstEntryBearishCandlesBeforeEntryCount: 1,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);
    const breakoutChase = result.detectedPatterns.find(
      (pattern) => pattern.patternId === "breakout_chase_entry_structure",
    );

    expect(ids).toContain("breakout_chase_entry_structure");
    expect(ids).not.toContain("overextended_chase_entry_structure");
    expect(breakoutChase?.thresholdsUsed.minNetMovePct).toBe(0.03);
    expect(breakoutChase?.thresholdsUsed.maxNetMovePct).toBeUndefined();
  });

  it("detects failed breakout entry structure when a measured favorable extension still led to weak post-entry structure", () => {
    const result = detectPatterns(
      createBasePatternInput({
        firstEntryPricePositionInTradeRangePct: 0.56,
        firstEntryCapturedPercentOfTradeMfe: 0.24,
        firstEntryToWorstMovePct: 0.03,
        firstEntryRecentRunUpPctBeforeEntry: 0.08,
        firstEntryRecentDropPctBeforeEntry: 0.01,
        firstEntryRecentNetMovePctBeforeEntry: 0.05,
        firstEntryBullishCandlesBeforeEntryCount: 3,
        firstEntryBearishCandlesBeforeEntryCount: 0,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("failed_breakout_entry_structure");
    expect(ids).toContain("inefficient_entry_structure");
  });

  it("detects reclaim entry structure when price reclaimed a recent reference level and held it into a strong entry", () => {
    const result = detectPatterns(
      createBasePatternInput({
        firstEntryPricePositionInTradeRangePct: 0.24,
        firstEntryCapturedPercentOfTradeMfe: 0.72,
        firstEntryToWorstMovePct: 0.01,
        firstEntryRecentRunUpPctBeforeEntry: 0.02,
        firstEntryRecentDropPctBeforeEntry: 0.05,
        firstEntryRecentNetMovePctBeforeEntry: 0.01,
        firstEntryRecentReferenceLevelBeforeEntry: 1.12,
        firstEntryRecentReferenceBreakDepthPctBeforeEntry: 0.025,
        firstEntryHadRecentReferenceReclaimBeforeEntry: true,
        firstEntryRecentReferenceReclaimHeldIntoEntry: true,
        firstEntryRecentReferenceConfirmationCandlesCount: 2,
        firstEntryDistanceFromRecentReferenceLevelPct: 0.018,
        firstEntryBullishCandlesBeforeEntryCount: 2,
        firstEntryBearishCandlesBeforeEntryCount: 2,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("reclaim_entry_structure");
    expect(ids).toContain("advantaged_entry_structure");
    expect(ids).not.toContain("failed_reclaim_entry_structure");
  });

  it("detects failed reclaim entry structure when a recent reference reclaim still led to weak post-entry structure", () => {
    const result = detectPatterns(
      createBasePatternInput({
        firstEntryPricePositionInTradeRangePct: 0.58,
        firstEntryCapturedPercentOfTradeMfe: 0.24,
        firstEntryToWorstMovePct: 0.03,
        firstEntryRecentRunUpPctBeforeEntry: 0.02,
        firstEntryRecentDropPctBeforeEntry: 0.05,
        firstEntryRecentNetMovePctBeforeEntry: 0.01,
        firstEntryRecentReferenceLevelBeforeEntry: 1.12,
        firstEntryRecentReferenceBreakDepthPctBeforeEntry: 0.025,
        firstEntryHadRecentReferenceReclaimBeforeEntry: true,
        firstEntryRecentReferenceReclaimHeldIntoEntry: true,
        firstEntryRecentReferenceConfirmationCandlesCount: 2,
        firstEntryDistanceFromRecentReferenceLevelPct: 0.018,
        firstEntryBullishCandlesBeforeEntryCount: 2,
        firstEntryBearishCandlesBeforeEntryCount: 2,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("failed_reclaim_entry_structure");
    expect(ids).toContain("inefficient_entry_structure");
    expect(ids).not.toContain("reclaim_entry_structure");
  });

  it("detects mean reversion entry structure when a deeper pullback reclaimed a recent reference and still led to a strong reversal entry", () => {
    const result = detectPatterns(
      createBasePatternInput({
        firstEntryPricePositionInTradeRangePct: 0.22,
        firstEntryCapturedPercentOfTradeMfe: 0.74,
        firstEntryToWorstMovePct: 0.01,
        firstEntryRecentRunUpPctBeforeEntry: 0.01,
        firstEntryRecentDropPctBeforeEntry: 0.1,
        firstEntryRecentNetMovePctBeforeEntry: -0.03,
        firstEntryRecentReferenceLevelBeforeEntry: 1.12,
        firstEntryRecentReferenceBreakDepthPctBeforeEntry: 0.025,
        firstEntryHadRecentReferenceReclaimBeforeEntry: true,
        firstEntryRecentReferenceReclaimHeldIntoEntry: true,
        firstEntryRecentReferenceConfirmationCandlesCount: 2,
        firstEntryDistanceFromRecentReferenceLevelPct: 0.018,
        firstEntryBullishCandlesBeforeEntryCount: 2,
        firstEntryBearishCandlesBeforeEntryCount: 4,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("mean_reversion_entry_structure");
    expect(ids).toContain("reclaim_entry_structure");
    expect(ids).not.toContain("failed_mean_reversion_entry_structure");
  });

  it("detects failed mean reversion entry structure when a deeper reversal attempt still led to weak post-entry structure", () => {
    const result = detectPatterns(
      createBasePatternInput({
        firstEntryPricePositionInTradeRangePct: 0.58,
        firstEntryCapturedPercentOfTradeMfe: 0.24,
        firstEntryToWorstMovePct: 0.03,
        firstEntryRecentRunUpPctBeforeEntry: 0.01,
        firstEntryRecentDropPctBeforeEntry: 0.1,
        firstEntryRecentNetMovePctBeforeEntry: -0.03,
        firstEntryRecentReferenceLevelBeforeEntry: 1.12,
        firstEntryRecentReferenceBreakDepthPctBeforeEntry: 0.025,
        firstEntryHadRecentReferenceReclaimBeforeEntry: true,
        firstEntryRecentReferenceReclaimHeldIntoEntry: true,
        firstEntryRecentReferenceConfirmationCandlesCount: 2,
        firstEntryDistanceFromRecentReferenceLevelPct: 0.018,
        firstEntryBullishCandlesBeforeEntryCount: 2,
        firstEntryBearishCandlesBeforeEntryCount: 4,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("failed_mean_reversion_entry_structure");
    expect(ids).toContain("failed_reclaim_entry_structure");
    expect(ids).not.toContain("mean_reversion_entry_structure");
  });

  it("detects market open breakout entry structure when a market-open breakout stayed controlled and worked", () => {
    const result = detectPatterns(
      createBasePatternInput({
        sessionBucket: "market_open",
        firstEntryOccurredDuringMarketOpenSession: true,
        firstEntryOccurredBeyondPreEntryRangeInTradeDirection: true,
        firstEntryDistanceBeyondPreEntryRangePct: 0.012,
        firstEntryPricePositionInTradeRangePct: 0.24,
        firstEntryCapturedPercentOfTradeMfe: 0.72,
        firstEntryToWorstMovePct: 0.01,
        firstEntryRecentRunUpPctBeforeEntry: 0.08,
        firstEntryRecentDropPctBeforeEntry: 0.01,
        firstEntryRecentNetMovePctBeforeEntry: 0.05,
        firstEntryBullishCandlesBeforeEntryCount: 3,
        firstEntryBearishCandlesBeforeEntryCount: 0,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("market_open_breakout_entry_structure");
    expect(ids).toContain("breakout_entry_structure");
  });

  it("does not detect market-open setup patterns when session context is unknown", () => {
    const result = detectPatterns(
      createBasePatternInput({
        sessionBucket: "unknown",
        firstEntryOccurredDuringMarketOpenSession: false,
        firstEntryOpeningRangeCandlesCountBeforeEntry: 0,
        firstEntryOccurredBeyondOpeningRangeInTradeDirection: false,
        firstEntryDistanceBeyondOpeningRangePct: null,
        firstEntryOpeningRangeReferenceLevelBeforeEntry: null,
        firstEntryOpeningRangeReferenceBreakDepthPctBeforeEntry: null,
        firstEntryHadOpeningRangeReclaimBeforeEntry: false,
        firstEntryOpeningRangeReclaimHeldIntoEntry: false,
        firstEntryOpeningRangeConfirmationCandlesCount: 0,
        firstEntryDistanceFromOpeningRangeReferenceLevelPct: null,
        firstEntryOccurredBeyondPreEntryRangeInTradeDirection: true,
        firstEntryDistanceBeyondPreEntryRangePct: 0.012,
        firstEntryPricePositionInTradeRangePct: 0.24,
        firstEntryCapturedPercentOfTradeMfe: 0.72,
        firstEntryToWorstMovePct: 0.01,
        firstEntryRecentRunUpPctBeforeEntry: 0.08,
        firstEntryRecentDropPctBeforeEntry: 0.01,
        firstEntryRecentNetMovePctBeforeEntry: 0.05,
        firstEntryBullishCandlesBeforeEntryCount: 3,
        firstEntryBearishCandlesBeforeEntryCount: 0,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("breakout_entry_structure");
    expect(ids).not.toContain("market_open_breakout_entry_structure");
    expect(ids).not.toContain("market_open_breakout_chase_entry_structure");
    expect(ids).not.toContain("failed_market_open_breakout_entry_structure");
    expect(ids).not.toContain("market_open_reclaim_entry_structure");
    expect(ids).not.toContain("failed_market_open_reclaim_entry_structure");
    expect(ids).not.toContain("opening_range_breakout_entry_structure");
    expect(ids).not.toContain("opening_range_reclaim_entry_structure");
  });

  it("detects opening range breakout entry structure when a true opening-range breakout stayed controlled and worked", () => {
    const result = detectPatterns(
      createBasePatternInput({
        sessionBucket: "market_open",
        firstEntryOccurredDuringMarketOpenSession: true,
        firstEntryOpeningRangeCandlesCountBeforeEntry: 3,
        firstEntryOccurredBeyondOpeningRangeInTradeDirection: true,
        firstEntryDistanceBeyondOpeningRangePct: 0.012,
        firstEntryOccurredBeyondPreEntryRangeInTradeDirection: true,
        firstEntryDistanceBeyondPreEntryRangePct: 0.012,
        firstEntryPricePositionInTradeRangePct: 0.24,
        firstEntryCapturedPercentOfTradeMfe: 0.72,
        firstEntryToWorstMovePct: 0.01,
        firstEntryRecentRunUpPctBeforeEntry: 0.08,
        firstEntryRecentDropPctBeforeEntry: 0.01,
        firstEntryRecentNetMovePctBeforeEntry: 0.05,
        firstEntryBullishCandlesBeforeEntryCount: 3,
        firstEntryBearishCandlesBeforeEntryCount: 0,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("opening_range_breakout_entry_structure");
    expect(ids).toContain("market_open_breakout_entry_structure");
  });

  it("detects opening range breakout chase entry structure when a true opening-range breakout was already stretched and weak", () => {
    const result = detectPatterns(
      createBasePatternInput({
        sessionBucket: "market_open",
        firstEntryOccurredDuringMarketOpenSession: true,
        firstEntryOpeningRangeCandlesCountBeforeEntry: 3,
        firstEntryOccurredBeyondOpeningRangeInTradeDirection: true,
        firstEntryDistanceBeyondOpeningRangePct: 0.04,
        firstEntryOccurredBeyondPreEntryRangeInTradeDirection: true,
        firstEntryDistanceBeyondPreEntryRangePct: 0.04,
        firstEntryPricePositionInTradeRangePct: 0.86,
        firstEntryCapturedPercentOfTradeMfe: 0.22,
        firstEntryToWorstMovePct: 0.035,
        firstEntryRecentRunUpPctBeforeEntry: 0.1,
        firstEntryRecentDropPctBeforeEntry: 0.01,
        firstEntryRecentNetMovePctBeforeEntry: 0.07,
        firstEntryBullishCandlesBeforeEntryCount: 4,
        firstEntryBearishCandlesBeforeEntryCount: 1,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("opening_range_breakout_chase_entry_structure");
    expect(ids).toContain("market_open_breakout_chase_entry_structure");
  });

  it("detects failed opening range breakout entry structure when a true opening-range breakout attempt failed quickly", () => {
    const result = detectPatterns(
      createBasePatternInput({
        sessionBucket: "market_open",
        firstEntryOccurredDuringMarketOpenSession: true,
        firstEntryOpeningRangeCandlesCountBeforeEntry: 3,
        firstEntryOccurredBeyondOpeningRangeInTradeDirection: true,
        firstEntryDistanceBeyondOpeningRangePct: 0.012,
        firstEntryOccurredBeyondPreEntryRangeInTradeDirection: true,
        firstEntryDistanceBeyondPreEntryRangePct: 0.012,
        firstEntryPricePositionInTradeRangePct: 0.56,
        firstEntryCapturedPercentOfTradeMfe: 0.24,
        firstEntryToWorstMovePct: 0.03,
        firstEntryRecentRunUpPctBeforeEntry: 0.08,
        firstEntryRecentDropPctBeforeEntry: 0.01,
        firstEntryRecentNetMovePctBeforeEntry: 0.05,
        firstEntryBullishCandlesBeforeEntryCount: 3,
        firstEntryBearishCandlesBeforeEntryCount: 0,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("failed_opening_range_breakout_entry_structure");
    expect(ids).toContain("failed_market_open_breakout_entry_structure");
  });

  it("detects opening range reclaim entry structure when the opening-range boundary was reclaimed and held into a strong entry", () => {
    const result = detectPatterns(
      createBasePatternInput({
        sessionBucket: "market_open",
        firstEntryOccurredDuringMarketOpenSession: true,
        firstEntryOpeningRangeCandlesCountBeforeEntry: 3,
        firstEntryOpeningRangeReferenceLevelBeforeEntry: 1.12,
        firstEntryOpeningRangeReferenceBreakDepthPctBeforeEntry: 0.02,
        firstEntryHadOpeningRangeReclaimBeforeEntry: true,
        firstEntryOpeningRangeReclaimHeldIntoEntry: true,
        firstEntryOpeningRangeConfirmationCandlesCount: 2,
        firstEntryDistanceFromOpeningRangeReferenceLevelPct: 0.018,
        firstEntryPricePositionInTradeRangePct: 0.24,
        firstEntryCapturedPercentOfTradeMfe: 0.72,
        firstEntryToWorstMovePct: 0.01,
        firstEntryRecentRunUpPctBeforeEntry: 0.02,
        firstEntryRecentDropPctBeforeEntry: 0.05,
        firstEntryRecentNetMovePctBeforeEntry: 0.01,
        firstEntryRecentReferenceLevelBeforeEntry: 1.12,
        firstEntryRecentReferenceBreakDepthPctBeforeEntry: 0.025,
        firstEntryHadRecentReferenceReclaimBeforeEntry: true,
        firstEntryRecentReferenceReclaimHeldIntoEntry: true,
        firstEntryRecentReferenceConfirmationCandlesCount: 2,
        firstEntryDistanceFromRecentReferenceLevelPct: 0.018,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("opening_range_reclaim_entry_structure");
    expect(ids).toContain("market_open_reclaim_entry_structure");
  });

  it("detects failed opening range reclaim entry structure when the opening-range reclaim still led to weak post-entry structure", () => {
    const result = detectPatterns(
      createBasePatternInput({
        sessionBucket: "market_open",
        firstEntryOccurredDuringMarketOpenSession: true,
        firstEntryOpeningRangeCandlesCountBeforeEntry: 3,
        firstEntryOpeningRangeReferenceLevelBeforeEntry: 1.12,
        firstEntryOpeningRangeReferenceBreakDepthPctBeforeEntry: 0.02,
        firstEntryHadOpeningRangeReclaimBeforeEntry: true,
        firstEntryOpeningRangeReclaimHeldIntoEntry: true,
        firstEntryOpeningRangeConfirmationCandlesCount: 2,
        firstEntryDistanceFromOpeningRangeReferenceLevelPct: 0.018,
        firstEntryPricePositionInTradeRangePct: 0.58,
        firstEntryCapturedPercentOfTradeMfe: 0.24,
        firstEntryToWorstMovePct: 0.03,
        firstEntryRecentRunUpPctBeforeEntry: 0.02,
        firstEntryRecentDropPctBeforeEntry: 0.05,
        firstEntryRecentNetMovePctBeforeEntry: 0.01,
        firstEntryRecentReferenceLevelBeforeEntry: 1.12,
        firstEntryRecentReferenceBreakDepthPctBeforeEntry: 0.025,
        firstEntryHadRecentReferenceReclaimBeforeEntry: true,
        firstEntryRecentReferenceReclaimHeldIntoEntry: true,
        firstEntryRecentReferenceConfirmationCandlesCount: 2,
        firstEntryDistanceFromRecentReferenceLevelPct: 0.018,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("failed_opening_range_reclaim_entry_structure");
    expect(ids).toContain("failed_market_open_reclaim_entry_structure");
  });

  it("detects market open breakout chase entry structure when a market-open breakout was already stretched and weak", () => {
    const result = detectPatterns(
      createBasePatternInput({
        sessionBucket: "market_open",
        firstEntryOccurredDuringMarketOpenSession: true,
        firstEntryOccurredBeyondPreEntryRangeInTradeDirection: true,
        firstEntryDistanceBeyondPreEntryRangePct: 0.04,
        firstEntryPricePositionInTradeRangePct: 0.86,
        firstEntryCapturedPercentOfTradeMfe: 0.22,
        firstEntryToWorstMovePct: 0.035,
        firstEntryRecentRunUpPctBeforeEntry: 0.1,
        firstEntryRecentDropPctBeforeEntry: 0.01,
        firstEntryRecentNetMovePctBeforeEntry: 0.07,
        firstEntryBullishCandlesBeforeEntryCount: 4,
        firstEntryBearishCandlesBeforeEntryCount: 1,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("market_open_breakout_chase_entry_structure");
    expect(ids).toContain("breakout_chase_entry_structure");
  });

  it("detects failed market open breakout entry structure when a market-open breakout attempt failed quickly", () => {
    const result = detectPatterns(
      createBasePatternInput({
        sessionBucket: "market_open",
        firstEntryOccurredDuringMarketOpenSession: true,
        firstEntryOccurredBeyondPreEntryRangeInTradeDirection: true,
        firstEntryDistanceBeyondPreEntryRangePct: 0.012,
        firstEntryPricePositionInTradeRangePct: 0.56,
        firstEntryCapturedPercentOfTradeMfe: 0.24,
        firstEntryToWorstMovePct: 0.03,
        firstEntryRecentRunUpPctBeforeEntry: 0.08,
        firstEntryRecentDropPctBeforeEntry: 0.01,
        firstEntryRecentNetMovePctBeforeEntry: 0.05,
        firstEntryBullishCandlesBeforeEntryCount: 3,
        firstEntryBearishCandlesBeforeEntryCount: 0,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("failed_market_open_breakout_entry_structure");
    expect(ids).toContain("failed_breakout_entry_structure");
  });

  it("detects market open reclaim entry structure when a market-open reclaim held into a strong entry", () => {
    const result = detectPatterns(
      createBasePatternInput({
        sessionBucket: "market_open",
        firstEntryOccurredDuringMarketOpenSession: true,
        firstEntryPricePositionInTradeRangePct: 0.24,
        firstEntryCapturedPercentOfTradeMfe: 0.72,
        firstEntryToWorstMovePct: 0.01,
        firstEntryRecentRunUpPctBeforeEntry: 0.02,
        firstEntryRecentDropPctBeforeEntry: 0.05,
        firstEntryRecentNetMovePctBeforeEntry: 0.01,
        firstEntryRecentReferenceLevelBeforeEntry: 1.12,
        firstEntryRecentReferenceBreakDepthPctBeforeEntry: 0.025,
        firstEntryHadRecentReferenceReclaimBeforeEntry: true,
        firstEntryRecentReferenceReclaimHeldIntoEntry: true,
        firstEntryRecentReferenceConfirmationCandlesCount: 2,
        firstEntryDistanceFromRecentReferenceLevelPct: 0.018,
        firstEntryBullishCandlesBeforeEntryCount: 2,
        firstEntryBearishCandlesBeforeEntryCount: 2,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("market_open_reclaim_entry_structure");
    expect(ids).toContain("reclaim_entry_structure");
  });

  it("detects failed market open reclaim entry structure when a market-open reclaim still led to weak post-entry structure", () => {
    const result = detectPatterns(
      createBasePatternInput({
        sessionBucket: "market_open",
        firstEntryOccurredDuringMarketOpenSession: true,
        firstEntryPricePositionInTradeRangePct: 0.58,
        firstEntryCapturedPercentOfTradeMfe: 0.24,
        firstEntryToWorstMovePct: 0.03,
        firstEntryRecentRunUpPctBeforeEntry: 0.02,
        firstEntryRecentDropPctBeforeEntry: 0.05,
        firstEntryRecentNetMovePctBeforeEntry: 0.01,
        firstEntryRecentReferenceLevelBeforeEntry: 1.12,
        firstEntryRecentReferenceBreakDepthPctBeforeEntry: 0.025,
        firstEntryHadRecentReferenceReclaimBeforeEntry: true,
        firstEntryRecentReferenceReclaimHeldIntoEntry: true,
        firstEntryRecentReferenceConfirmationCandlesCount: 2,
        firstEntryDistanceFromRecentReferenceLevelPct: 0.018,
        firstEntryBullishCandlesBeforeEntryCount: 2,
        firstEntryBearishCandlesBeforeEntryCount: 2,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("failed_market_open_reclaim_entry_structure");
    expect(ids).toContain("failed_reclaim_entry_structure");
  });

  it("detects weak pullback entry structure when a pullback setup still led to a weak entry", () => {
    const result = detectPatterns(
      createBasePatternInput({
        firstEntryPricePositionInTradeRangePct: 0.78,
        firstEntryCapturedPercentOfTradeMfe: 0.22,
        firstEntryToWorstMovePct: 0.03,
        firstEntryRecentRunUpPctBeforeEntry: 0.01,
        firstEntryRecentDropPctBeforeEntry: 0.07,
        firstEntryRecentNetMovePctBeforeEntry: -0.04,
        firstEntryBullishCandlesBeforeEntryCount: 0,
        firstEntryBearishCandlesBeforeEntryCount: 3,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("weak_pullback_entry_structure");
    expect(ids).toContain("disadvantaged_entry_structure");
    expect(ids).toContain("entry_after_recent_drop");
    expect(ids).not.toContain("constructive_pullback_entry_structure");
  });

  it("detects deep weak pullback entry structure when a larger pullback still led to a weak entry", () => {
    const result = detectPatterns(
      createBasePatternInput({
        firstEntryPricePositionInTradeRangePct: 0.78,
        firstEntryCapturedPercentOfTradeMfe: 0.22,
        firstEntryToWorstMovePct: 0.03,
        firstEntryRecentRunUpPctBeforeEntry: 0.01,
        firstEntryRecentDropPctBeforeEntry: 0.1,
        firstEntryRecentNetMovePctBeforeEntry: -0.06,
        firstEntryBullishCandlesBeforeEntryCount: 1,
        firstEntryBearishCandlesBeforeEntryCount: 4,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("deep_weak_pullback_entry_structure");
    expect(ids).toContain("weak_pullback_entry_structure");
    expect(ids).not.toContain("disciplined_favorable_extension_entry_structure");
  });

  it("detects late favorable extension entry structure for shorts after a direction-aware pre-entry extension", () => {
    const result = detectPatterns(
      createBasePatternInput({
        tradeDirection: "short",
        firstEntryPricePositionInTradeRangePct: 0.82,
        firstEntryCapturedPercentOfTradeMfe: 0.18,
        firstEntryToWorstMovePct: 0.03,
        firstEntryRecentRunUpPctBeforeEntry: 0.01,
        firstEntryRecentDropPctBeforeEntry: 0.09,
        firstEntryRecentNetMovePctBeforeEntry: -0.06,
        firstEntryBullishCandlesBeforeEntryCount: 0,
        firstEntryBearishCandlesBeforeEntryCount: 3,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("late_favorable_extension_entry_structure");
    expect(ids).toContain("disadvantaged_entry_structure");
    expect(ids).toContain("entry_after_recent_drop");
    expect(ids).not.toContain("constructive_pullback_entry_structure");
  });

  it("detects aggressive adding with failed profit protection on larger multi-add giveback structures", () => {
    const result = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 2,
        addAbovePreviousAverageEntryCount: 2,
        addBelowPreviousAverageEntryCount: 0,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        peakOpenProfitPctOfBasis: 0.08,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("aggressive_adding_with_failed_profit_protection");
    expect(ids).not.toContain("balanced_scaling_with_profit_protection");
  });

  it("detects revenge adding after weakness when repeated below-basis adds kept occurring into weakness without reduction", () => {
    const result = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 2,
        totalPositionIncreaseCount: 3,
        totalPositionDecreaseCount: 0,
        hadPartialExit: false,
        partialExitCount: 0,
        maxFavorableMoveAfterPartialExitPct: null,
        maxAdverseMoveAfterPartialExitPct: null,
        hadReaddAfterReduction: false,
        readdAfterReductionCount: 0,
        addAbovePreviousAverageEntryCount: 0,
        addBelowPreviousAverageEntryCount: 2,
        averageAddPriceVsPreviousAverageEntryPct: -0.03,
        averageAddPricePositionInRecentRangePct: 0.22,
        averageAddRecentRunUpPctBeforeExecution: 0.01,
        averageAddRecentDropPctBeforeExecution: 0.07,
        addsWithRecentRunUpCount: 0,
        addsWithRecentDropCount: 2,
        maxGivebackFromPeakOpenProfitPct: 0.2,
        peakOpenProfitPctOfBasis: 0.04,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("revenge_adding_after_weakness");
    expect(ids).toContain("add_into_weakness");
    expect(ids).toContain("one_sided_aggressive_building");
  });

  it("detects revenge adding with failed profit protection when repeated below-basis adds into weakness later gave too much back", () => {
    const result = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 2,
        totalPositionIncreaseCount: 3,
        totalPositionDecreaseCount: 0,
        hadPartialExit: false,
        partialExitCount: 0,
        maxFavorableMoveAfterPartialExitPct: null,
        maxAdverseMoveAfterPartialExitPct: null,
        hadReaddAfterReduction: false,
        readdAfterReductionCount: 0,
        addAbovePreviousAverageEntryCount: 0,
        addBelowPreviousAverageEntryCount: 2,
        averageAddPriceVsPreviousAverageEntryPct: -0.03,
        averageAddPricePositionInRecentRangePct: 0.22,
        averageAddRecentRunUpPctBeforeExecution: 0.01,
        averageAddRecentDropPctBeforeExecution: 0.07,
        addsWithRecentRunUpCount: 0,
        addsWithRecentDropCount: 2,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        peakOpenProfitPctOfBasis: 0.08,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("revenge_adding_with_failed_profit_protection");
    expect(ids).toContain("revenge_adding_after_weakness");
    expect(ids).toContain("aggressive_adding_with_failed_profit_protection");
  });

  it("detects underutilized winner with constructive exit when meaningful opportunity was not pressed but the final exit stayed disciplined", () => {
    const result = detectPatterns(
      createBasePatternInput({
        totalPositionIncreaseCount: 1,
        addCountAfterInitialEntry: 0,
        hadPartialExit: false,
        partialExitCount: 0,
        reductionsNearRecentHighCount: 0,
        tradeMfePct: 0.08,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("underutilized_winner_with_constructive_exit");
    expect(ids).toContain("underutilized_position_building");
  });

  it("detects recovery to underutilized winner with constructive exit when early adversity recovered but sizing still stayed limited", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.05,
        maxGivebackFromPeakOpenProfitPct: 0.2,
        totalPositionIncreaseCount: 1,
        addCountAfterInitialEntry: 0,
        hadPartialExit: false,
        partialExitCount: 0,
        reductionsNearRecentHighCount: 0,
        tradeMfePct: 0.08,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "recovery_to_underutilized_winner_with_constructive_exit",
    );
    expect(ids).toContain("underutilized_winner_with_constructive_exit");
  });

  it("detects underutilized winner with timely profit protection and constructive final exit when a small winner was still protected in time and closed well", () => {
    const result = detectPatterns(
      createBasePatternInput({
        totalPositionIncreaseCount: 1,
        addCountAfterInitialEntry: 0,
        hadPartialExit: false,
        partialExitCount: 0,
        reductionsNearRecentHighCount: 0,
        tradeMfePct: 0.08,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 1,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "underutilized_winner_with_timely_profit_protection_and_constructive_final_exit",
    );
    expect(ids).toContain("underutilized_winner_with_constructive_exit");
    expect(ids).toContain("timely_profit_protection_with_constructive_final_exit");
  });

  it("detects recovery to underutilized winner with timely profit protection and constructive final exit when an early loser recovered but still stayed under-sized", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.05,
        totalPositionIncreaseCount: 1,
        addCountAfterInitialEntry: 0,
        hadPartialExit: false,
        partialExitCount: 0,
        reductionsNearRecentHighCount: 0,
        tradeMfePct: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 1,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "recovery_to_underutilized_winner_with_timely_profit_protection_and_constructive_final_exit",
    );
    expect(ids).toContain(
      "underutilized_winner_with_timely_profit_protection_and_constructive_final_exit",
    );
  });

  it("detects underutilized winner with premature final exit when a small winner was still sold too early", () => {
    const result = detectPatterns(
      createBasePatternInput({
        totalPositionIncreaseCount: 1,
        addCountAfterInitialEntry: 0,
        hadPartialExit: false,
        partialExitCount: 0,
        reductionsNearRecentHighCount: 0,
        tradeMfePct: 0.08,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("underutilized_winner_with_premature_final_exit");
    expect(ids).toContain("underutilized_position_building");
    expect(ids).toContain("premature_final_exit_after_constructive_management");
  });

  it("detects recovery to underutilized winner with premature final exit when an early loser recovered but still sold the under-sized winner too early", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.05,
        totalPositionIncreaseCount: 1,
        addCountAfterInitialEntry: 0,
        hadPartialExit: false,
        partialExitCount: 0,
        reductionsNearRecentHighCount: 0,
        tradeMfePct: 0.08,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "recovery_to_underutilized_winner_with_premature_final_exit",
    );
    expect(ids).toContain("underutilized_winner_with_premature_final_exit");
    expect(ids).toContain("constructive_recovery_after_early_adversity");
  });

  it("detects underutilized winner with missed final continuation when a small winner still left favorable continuation behind", () => {
    const result = detectPatterns(
      createBasePatternInput({
        totalPositionIncreaseCount: 1,
        addCountAfterInitialEntry: 0,
        hadPartialExit: false,
        partialExitCount: 0,
        reductionsNearRecentHighCount: 0,
        tradeMfePct: 0.08,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("underutilized_winner_with_missed_final_continuation");
    expect(ids).toContain("missed_post_exit_continuation");
  });

  it("detects recovery to underutilized winner with missed final continuation when an early loser recovered but still exited before the continuation finished", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.05,
        totalPositionIncreaseCount: 1,
        addCountAfterInitialEntry: 0,
        hadPartialExit: false,
        partialExitCount: 0,
        reductionsNearRecentHighCount: 0,
        tradeMfePct: 0.08,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "recovery_to_underutilized_winner_with_missed_final_continuation",
    );
    expect(ids).toContain("underutilized_winner_with_missed_final_continuation");
  });

  it("detects timely trim into strength with constructive final exit when directional trimming also happened with timely protection", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadPartialExit: true,
        partialExitCount: 1,
        reductionsNearRecentHighCount: 1,
        averageReductionPriceVsPreviousAverageEntryPct: 0.05,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "timely_trim_into_strength_with_constructive_final_exit",
    );
    expect(ids).toContain("trim_into_strength_with_constructive_final_exit");
    expect(ids).toContain("timely_profit_protection_with_constructive_final_exit");
  });

  it("detects trim into strength with premature final exit when directional trimming still ended with early exit and later continuation", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadPartialExit: true,
        partialExitCount: 1,
        reductionsNearRecentHighCount: 1,
        averageReductionPriceVsPreviousAverageEntryPct: 0.05,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("trim_into_strength_with_premature_final_exit");
    expect(ids).toContain("reduction_into_strength");
    expect(ids).toContain("premature_final_exit_after_constructive_management");
  });

  it("detects recovery with timely trim into strength and constructive final exit when early adversity recovered into a timely constructive trim", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.06,
        hadPartialExit: true,
        partialExitCount: 1,
        reductionsNearRecentHighCount: 1,
        averageReductionPriceVsPreviousAverageEntryPct: 0.05,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "recovery_with_timely_trim_into_strength_and_constructive_final_exit",
    );
    expect(ids).toContain(
      "timely_trim_into_strength_with_constructive_final_exit",
    );
  });

  it("detects missed post-exit continuation when favorable continuation persisted after the final exit", () => {
    const result = detectPatterns(
      createBasePatternInput({
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("missed_post_exit_continuation");
    expect(ids).not.toContain("exit_avoided_adverse_followthrough");
  });

  it("detects defensive exit after deterioration when the final exit avoided further damage after meaningful giveback", () => {
    const result = detectPatterns(
      createBasePatternInput({
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
        maxGivebackFromPeakOpenProfitPct: 0.6,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("defensive_exit_after_deterioration");
    expect(ids).not.toContain(
      "premature_final_exit_after_constructive_management",
    );
  });

  it("detects premature final exit after constructive management when continuation persisted despite limited giveback", () => {
    const result = detectPatterns(
      createBasePatternInput({
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        totalPositionDecreaseCount: 2,
        hadMultipleDecreases: true,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "premature_final_exit_after_constructive_management",
    );
    expect(ids).not.toContain("defensive_exit_after_deterioration");
  });

  it("detects fearful exit after weakening when the final exit happened near the weak side and price recovered afterward", () => {
    const result = detectPatterns(
      createBasePatternInput({
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.25,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("fearful_exit_after_weakening");
    expect(ids).not.toContain("disciplined_defensive_exit");
  });

  it("detects stop-like forced exit after breakdown when deterioration continued after a weak-side final exit", () => {
    const result = detectPatterns(
      createBasePatternInput({
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.22,
        drawdownFromPeakOpenProfitPctOfBasis: 0.11,
        maxGivebackFromPeakOpenProfitPct: 0.7,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("stop_like_forced_exit_after_breakdown");
    expect(ids).toContain("defensive_exit_after_deterioration");
    expect(ids).not.toContain("stop_like_forced_exit_before_rebound");
  });

  it("detects stop-like forced exit before rebound when a breakdown-driven weak-side final exit was followed by recovery", () => {
    const result = detectPatterns(
      createBasePatternInput({
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.22,
        drawdownFromPeakOpenProfitPctOfBasis: 0.11,
        maxGivebackFromPeakOpenProfitPct: 0.7,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("stop_like_forced_exit_before_rebound");
    expect(ids).toContain("fearful_exit_after_weakening");
    expect(ids).not.toContain("stop_like_forced_exit_after_breakdown");
  });

  it("detects disciplined defensive exit when the final exit limited giveback and price kept deteriorating afterward", () => {
    const result = detectPatterns(
      createBasePatternInput({
        maxGivebackFromPeakOpenProfitPct: 0.2,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("disciplined_defensive_exit");
    expect(ids).not.toContain("fearful_exit_after_weakening");
  });

  it("detects trim into strength with constructive final exit when a favorable trim still led to a relieving final exit", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadPartialExit: true,
        partialExitCount: 1,
        hadReaddAfterReduction: false,
        readdAfterReductionCount: 0,
        reductionsNearRecentHighCount: 1,
        averageReductionPriceVsPreviousAverageEntryPct: 0.05,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("trim_into_strength_with_constructive_final_exit");
    expect(ids).toContain("balanced_management_with_constructive_exit");
    expect(ids).toContain("reduction_into_strength");
  });

  it("detects balanced management with premature final exit when balanced scaling still exited before continuation persisted", () => {
    const result = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 1,
        realizedReturnPct: 0.04,
        maxGivebackFromPeakOpenProfitPct: 0.2,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("balanced_management_with_premature_final_exit");
    expect(ids).toContain("premature_final_exit_after_constructive_management");
    expect(ids).toContain("balanced_position_management");
  });

  it("detects balanced management with missed final continuation when active management still left continuation behind without requiring the premature-exit giveback constraint", () => {
    const result = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 1,
        realizedReturnPct: 0.04,
        maxGivebackFromPeakOpenProfitPct: 0.4,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("balanced_management_with_missed_final_continuation");
    expect(ids).toContain("missed_post_exit_continuation");
    expect(ids).toContain("balanced_position_management");
    expect(ids).not.toContain("balanced_management_with_premature_final_exit");
  });

  it("detects recovery with trim into strength and constructive final exit when early adversity recovered into a favorable trim and disciplined final exit", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.06,
        hadPartialExit: true,
        partialExitCount: 1,
        hadReaddAfterReduction: false,
        readdAfterReductionCount: 0,
        reductionsNearRecentHighCount: 1,
        averageReductionPriceVsPreviousAverageEntryPct: 0.05,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "recovery_with_trim_into_strength_and_constructive_final_exit",
    );
    expect(ids).toContain("trim_into_strength_with_constructive_final_exit");
  });

  it("detects recovery with balanced management and missed final continuation when early adversity recovered but active management still left continuation behind", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.04,
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 1,
        maxGivebackFromPeakOpenProfitPct: 0.4,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "recovery_with_balanced_management_and_missed_final_continuation",
    );
    expect(ids).toContain("balanced_management_with_missed_final_continuation");
    expect(ids).not.toContain(
      "recovery_with_balanced_management_and_premature_final_exit",
    );
  });

  it("detects recovery with trim into strength and premature final exit when early adversity still ended with a strong trim but early final exit", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.04,
        hadPartialExit: true,
        partialExitCount: 1,
        hadReaddAfterReduction: false,
        readdAfterReductionCount: 0,
        reductionsNearRecentHighCount: 1,
        averageReductionPriceVsPreviousAverageEntryPct: 0.05,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "recovery_with_trim_into_strength_and_premature_final_exit",
    );
    expect(ids).toContain("trim_into_strength_with_premature_final_exit");
    expect(ids).toContain("constructive_recovery_after_early_adversity");
  });

  it("detects stabilized recovery with constructive final exit when an early-adversity recovery later exited defensively and avoided more damage", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        maxGivebackFromPeakOpenProfitPct: 0.2,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "stabilized_recovery_with_constructive_final_exit",
    );
    expect(ids).toContain("disciplined_defensive_exit");
    expect(ids).toContain(
      "recovery_after_early_adversity_with_stabilized_management",
    );
  });

  it("detects stabilized recovery with premature final exit when an early-adversity recovery later exited before continuation persisted", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        maxGivebackFromPeakOpenProfitPct: 0.2,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("stabilized_recovery_with_premature_final_exit");
    expect(ids).toContain(
      "premature_final_exit_after_constructive_management",
    );
    expect(ids).toContain(
      "recovery_after_early_adversity_with_stabilized_management",
    );
  });

  it("detects stabilized recovery with stop-like forced exit after breakdown when an early-adversity recovery later still broke down into a stop-like exit", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.22,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.04,
        maxFavorableMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "stabilized_recovery_with_stop_like_forced_exit_after_breakdown",
    );
    expect(ids).toContain("stop_like_forced_exit_after_breakdown");
    expect(ids).toContain("recovery_after_early_adversity_with_failed_protection");
  });

  it("detects stabilized recovery with stop-like forced exit before rebound when an early-adversity recovery later still exited weak-side before rebound", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.22,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.01,
        maxFavorableMovePctAfterExit: 0.05,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "stabilized_recovery_with_stop_like_forced_exit_before_rebound",
    );
    expect(ids).toContain("stop_like_forced_exit_before_rebound");
    expect(ids).toContain("recovery_after_early_adversity_with_failed_protection");
  });

  it("detects constructive recovery after early adversity when the trade recovered from open loss and still finished constructively", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        secondsFromFirstOpenLossToPeakOpenProfit: 120,
        peakOpenProfitPctOfBasis: 0.08,
        maxGivebackFromPeakOpenProfitPct: 0.2,
        realizedReturnPct: 0.04,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("constructive_recovery_after_early_adversity");
    expect(ids).not.toContain(
      "recovery_after_early_adversity_with_failed_protection",
    );
  });

  it("detects recovery after early adversity with failed protection when the trade recovered but still gave back too much later", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        secondsFromFirstOpenLossToPeakOpenProfit: 120,
        peakOpenProfitPctOfBasis: 0.08,
        maxGivebackFromPeakOpenProfitPct: 0.65,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "recovery_after_early_adversity_with_failed_protection",
    );
    expect(ids).not.toContain("constructive_recovery_after_early_adversity");
  });

  it("detects recovery after early adversity with stabilized management when the trade recovered and then stabilized after peak profit", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        secondsFromFirstOpenLossToPeakOpenProfit: 120,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        drawdownFromPeakOpenProfitPctOfBasis: 0.09,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 1,
        secondsFromPeakOpenProfitToWorstDrawdown: 90,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        maxGivebackFromPeakOpenProfitPct: 0.2,
        realizedReturnPct: 0.04,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "recovery_after_early_adversity_with_stabilized_management",
    );
    expect(ids).toContain("constructive_recovery_after_early_adversity");
    expect(ids).toContain("timely_risk_response_with_profit_protection");
  });

  it("detects recovery with timely profit protection and constructive final exit when early adversity still led to a disciplined protected winner", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        secondsFromFirstOpenLossToPeakOpenProfit: 120,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        drawdownFromPeakOpenProfitPctOfBasis: 0.09,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 1,
        secondsFromPeakOpenProfitToWorstDrawdown: 90,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        realizedReturnPct: 0.04,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "recovery_with_timely_profit_protection_and_constructive_final_exit",
    );
    expect(ids).toContain(
      "timely_profit_protection_with_constructive_final_exit",
    );
  });

  it("detects timely profit protection with premature final exit when profit was protected in time but continuation still persisted after exit", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        drawdownFromPeakOpenProfitPctOfBasis: 0.09,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 1,
        secondsFromPeakOpenProfitToWorstDrawdown: 90,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("timely_profit_protection_with_premature_final_exit");
    expect(ids).toContain("timely_risk_response_with_profit_protection");
    expect(ids).toContain("premature_final_exit_after_constructive_management");
  });

  it("detects recovery with timely profit protection and premature final exit when early adversity still ended in a protected but early exit", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        secondsFromFirstOpenLossToPeakOpenProfit: 120,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        drawdownFromPeakOpenProfitPctOfBasis: 0.09,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 1,
        secondsFromPeakOpenProfitToWorstDrawdown: 90,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        realizedReturnPct: 0.04,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "recovery_with_timely_profit_protection_and_premature_final_exit",
    );
    expect(ids).toContain("timely_profit_protection_with_premature_final_exit");
    expect(ids).toContain("stabilized_recovery_with_premature_final_exit");
  });

  it("detects timely profit protection with defensive final exit after deterioration when profit was protected in time but the trade later needed a real save", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        drawdownFromPeakOpenProfitPctOfBasis: 0.09,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 1,
        secondsFromPeakOpenProfitToWorstDrawdown: 90,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        realizedReturnPct: 0.04,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "timely_risk_response_with_defensive_final_exit_after_deterioration",
    );
    expect(ids).toContain("timely_risk_response_after_peak_profit");
    expect(ids).toContain("defensive_exit_after_deterioration");
  });

  it("detects recovery with timely profit protection and defensive final exit after deterioration when early adversity still ended in a protected but later defensive save", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        secondsFromFirstOpenLossToPeakOpenProfit: 120,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        drawdownFromPeakOpenProfitPctOfBasis: 0.09,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 1,
        secondsFromPeakOpenProfitToWorstDrawdown: 90,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        realizedReturnPct: 0.04,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "recovery_with_timely_risk_response_and_defensive_final_exit_after_deterioration",
    );
    expect(ids).toContain(
      "timely_risk_response_with_defensive_final_exit_after_deterioration",
    );
    expect(ids).toContain("recovery_after_early_adversity_with_failed_protection");
  });

  it("detects recovery with balanced management and premature final exit when early adversity still ended in a managed but early exit", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        secondsFromFirstOpenLossToPeakOpenProfit: 120,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.04,
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 1,
        maxGivebackFromPeakOpenProfitPct: 0.2,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "recovery_with_balanced_management_and_premature_final_exit",
    );
    expect(ids).toContain("balanced_management_with_premature_final_exit");
    expect(ids).toContain("constructive_recovery_after_early_adversity");
  });

  it("detects balanced management with stop-like forced exit after breakdown when balanced management still later broke down into a forced exit", () => {
    const result = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 1,
        realizedReturnPct: 0.04,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.22,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.04,
        maxFavorableMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "balanced_management_with_stop_like_forced_exit_after_breakdown",
    );
    expect(ids).toContain("stop_like_forced_exit_after_breakdown");
    expect(ids).toContain("balanced_position_management");
  });

  it("detects balanced management with stop-like forced exit before rebound when balanced management still later exited weak-side before rebound", () => {
    const result = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 1,
        realizedReturnPct: 0.04,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.22,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.01,
        maxFavorableMovePctAfterExit: 0.05,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "balanced_management_with_stop_like_forced_exit_before_rebound",
    );
    expect(ids).toContain("stop_like_forced_exit_before_rebound");
    expect(ids).toContain("balanced_position_management");
  });

  it("detects recovery with balanced management and stop-like forced exit after breakdown when early adversity recovered but the trade still later broke down", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.04,
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 1,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.22,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.04,
        maxFavorableMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "recovery_with_balanced_management_and_stop_like_forced_exit_after_breakdown",
    );
    expect(ids).toContain(
      "balanced_management_with_stop_like_forced_exit_after_breakdown",
    );
    expect(ids).toContain("recovery_after_early_adversity_with_failed_protection");
  });

  it("detects recovery with balanced management and stop-like forced exit before rebound when early adversity recovered but the trade still later exited weak-side before rebound", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.04,
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 1,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.22,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.01,
        maxFavorableMovePctAfterExit: 0.05,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "recovery_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    );
    expect(ids).toContain(
      "balanced_management_with_stop_like_forced_exit_before_rebound",
    );
    expect(ids).toContain("recovery_after_early_adversity_with_failed_protection");
  });

  it("detects balanced management with defensive final exit after deterioration when active management still later needed a defensive save", () => {
    const result = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 1,
        realizedReturnPct: 0.04,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.03,
        maxFavorableMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "balanced_management_with_defensive_final_exit_after_deterioration",
    );
    expect(ids).toContain("defensive_exit_after_deterioration");
    expect(ids).toContain("balanced_position_management");
  });

  it("detects recovery with balanced management and defensive final exit after deterioration when early adversity recovered but the trade still later needed a defensive save", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 1,
        realizedReturnPct: 0.04,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.03,
        maxFavorableMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "recovery_with_balanced_management_and_defensive_final_exit_after_deterioration",
    );
    expect(ids).toContain(
      "balanced_management_with_defensive_final_exit_after_deterioration",
    );
    expect(ids).toContain("recovery_after_early_adversity_with_failed_protection");
  });

  it("detects balanced management with fearful final exit when active management still later exited weak-side before rebound", () => {
    const result = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 1,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.2,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("balanced_management_with_fearful_final_exit");
    expect(ids).toContain("fearful_exit_after_weakening");
    expect(ids).toContain("balanced_position_management");
  });

  it("detects recovery with balanced management and fearful final exit when early adversity recovered but the trade still later exited fearfully before rebound", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 1,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.2,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "recovery_with_balanced_management_and_fearful_final_exit",
    );
    expect(ids).toContain("balanced_management_with_fearful_final_exit");
  });

  it("detects timely risk response with stop-like forced exit after breakdown when early reduction still ended in a stop-like breakdown exit", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 1,
        secondsFromPeakOpenProfitToWorstDrawdown: 90,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.22,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.04,
        maxFavorableMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "timely_risk_response_with_stop_like_forced_exit_after_breakdown",
    );
    expect(ids).toContain("timely_risk_response_after_peak_profit");
    expect(ids).toContain("stop_like_forced_exit_after_breakdown");
  });

  it("detects timely risk response with stop-like forced exit before rebound when early reduction still ended in a stop-like weak-side exit before rebound", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 1,
        secondsFromPeakOpenProfitToWorstDrawdown: 90,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.22,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.01,
        maxFavorableMovePctAfterExit: 0.05,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "timely_risk_response_with_stop_like_forced_exit_before_rebound",
    );
    expect(ids).toContain("timely_risk_response_after_peak_profit");
    expect(ids).toContain("stop_like_forced_exit_before_rebound");
  });

  it("detects recovery with timely risk response and stop-like forced exit after breakdown when early adversity recovered, risk was reduced in time, and the trade still later broke down", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.02,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 1,
        secondsFromPeakOpenProfitToWorstDrawdown: 90,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.22,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.04,
        maxFavorableMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "recovery_with_timely_risk_response_and_stop_like_forced_exit_after_breakdown",
    );
    expect(ids).toContain(
      "timely_risk_response_with_stop_like_forced_exit_after_breakdown",
    );
    expect(ids).toContain(
      "stabilized_recovery_with_stop_like_forced_exit_after_breakdown",
    );
  });

  it("detects recovery with timely risk response and stop-like forced exit before rebound when early adversity recovered, risk was reduced in time, and the trade still later exited weak-side before rebound", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.02,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 1,
        secondsFromPeakOpenProfitToWorstDrawdown: 90,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.22,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.01,
        maxFavorableMovePctAfterExit: 0.05,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "recovery_with_timely_risk_response_and_stop_like_forced_exit_before_rebound",
    );
    expect(ids).toContain(
      "timely_risk_response_with_stop_like_forced_exit_before_rebound",
    );
    expect(ids).toContain(
      "stabilized_recovery_with_stop_like_forced_exit_before_rebound",
    );
  });

  it("detects add into strength with premature final exit when pressing still ended with early exit and later continuation", () => {
    const result = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 1,
        addAbovePreviousAverageEntryCount: 1,
        averageAddPriceVsPreviousAverageEntryPct: 0.05,
        averageAddPricePositionInRecentRangePct: 0.82,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("add_into_strength_with_premature_final_exit");
    expect(ids).toContain("add_into_strength");
    expect(ids).toContain("premature_final_exit_after_constructive_management");
  });

  it("detects recovery with add into strength and premature final exit when early adversity still ended with strong pressing but early exit", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.05,
        addCountAfterInitialEntry: 1,
        addAbovePreviousAverageEntryCount: 1,
        averageAddPriceVsPreviousAverageEntryPct: 0.05,
        averageAddPricePositionInRecentRangePct: 0.82,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "recovery_with_add_into_strength_and_premature_final_exit",
    );
    expect(ids).toContain("add_into_strength_with_premature_final_exit");
    expect(ids).toContain("constructive_recovery_after_early_adversity");
  });

  it("detects repeated trim re-add with constructive management when multiple trim/re-add cycles still ended stably", () => {
    const result = detectPatterns(
      createBasePatternInput({
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        maxGivebackFromPeakOpenProfitPct: 0.2,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("repeated_trim_readd_with_constructive_management");
    expect(ids).not.toContain("repeated_trim_readd_with_unstable_management");
  });

  it("detects repeated trim re-add with constructive re-entry followthrough when repeated pullback re-entries kept resolving favorably", () => {
    const result = detectPatterns(
      createBasePatternInput({
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 2,
        averageAdverseMovePctAfterPartialExitBeforeReadd: 0.02,
        averageFavorableMovePctAfterReaddBeforeNextExecution: 0.03,
        averageAdverseMovePctAfterReaddBeforeNextExecution: 0.01,
        readdsWithStrongerFavorableFollowthroughCount: 2,
        readdsWithStrongerAdverseFollowthroughCount: 0,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "repeated_trim_readd_with_constructive_reentry_followthrough",
    );
    expect(ids).toContain("constructive_reentry_followthrough_after_trim");
    expect(ids).not.toContain("repeated_trim_readd_with_deteriorating_reentry");
  });

  it("detects repeated trim re-add with unstable management when multiple trim/re-add cycles still led to major giveback", () => {
    const result = detectPatterns(
      createBasePatternInput({
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        maxGivebackFromPeakOpenProfitPct: 0.65,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("repeated_trim_readd_with_unstable_management");
    expect(ids).not.toContain("repeated_trim_readd_with_constructive_management");
  });

  it("detects repeated trim re-add with deteriorating re-entry when repeated chase-style re-entries kept weakening afterward", () => {
    const result = detectPatterns(
      createBasePatternInput({
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        readdsAfterRecentRunUpCount: 2,
        readdsAfterRecentDropCount: 0,
        averageFavorableMovePctAfterPartialExitBeforeReadd: 0.04,
        averageFavorableMovePctAfterReaddBeforeNextExecution: 0.01,
        averageAdverseMovePctAfterReaddBeforeNextExecution: 0.03,
        readdsWithStrongerFavorableFollowthroughCount: 0,
        readdsWithStrongerAdverseFollowthroughCount: 2,
        maxGivebackFromPeakOpenProfitPct: 0.65,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("repeated_trim_readd_with_deteriorating_reentry");
    expect(ids).toContain("deteriorating_reentry_after_trim");
    expect(ids).not.toContain(
      "repeated_trim_readd_with_constructive_reentry_followthrough",
    );
  });

  it("detects repeated rescue attempts with renewed deterioration when the trade recovered early but repeated rescue cycles still ended in major giveback", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        secondsFromFirstOpenLossToPeakOpenProfit: 150,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        drawdownFromPeakOpenProfitPctOfBasis: 0.11,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 2,
        secondsFromPeakOpenProfitToWorstDrawdown: 180,
        secondsFromPeakOpenProfitToFirstReduction: 90,
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        maxGivebackFromPeakOpenProfitPct: 0.65,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "repeated_rescue_attempts_with_renewed_deterioration",
    );
    expect(ids).toContain("repeated_trim_readd_with_unstable_management");
    expect(ids).toContain(
      "recovery_after_early_adversity_with_failed_protection",
    );
  });

  it("detects late chase re-entry after constructive trim when re-entry followed continued strength after the trim", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadPartialExit: true,
        partialExitCount: 1,
        hadReaddAfterReduction: true,
        readdAfterReductionCount: 1,
        averageFavorableMovePctAfterPartialExitBeforeReadd: 0.04,
        averageAdverseMovePctAfterPartialExitBeforeReadd: 0.01,
        readdsAfterRecentRunUpCount: 1,
        readdsAfterRecentDropCount: 0,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("late_chase_reentry_after_constructive_trim");
    expect(ids).not.toContain("good_pullback_reentry_after_constructive_trim");
  });

  it("detects constructive re-entry followthrough after trim when the re-entry was followed by stronger favorable continuation", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadPartialExit: true,
        partialExitCount: 1,
        hadReaddAfterReduction: true,
        readdAfterReductionCount: 1,
        averageFavorableMovePctAfterPartialExitBeforeReadd: 0.01,
        averageAdverseMovePctAfterPartialExitBeforeReadd: 0.02,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 1,
        averageFavorableMovePctAfterReaddBeforeNextExecution: 0.03,
        averageAdverseMovePctAfterReaddBeforeNextExecution: 0.01,
        readdsWithStrongerFavorableFollowthroughCount: 1,
        readdsWithStrongerAdverseFollowthroughCount: 0,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("constructive_reentry_followthrough_after_trim");
    expect(ids).toContain("good_pullback_reentry_after_constructive_trim");
    expect(ids).not.toContain("deteriorating_reentry_after_trim");
  });

  it("detects constructive re-entry with constructive final exit when a one-cycle constructive reload still ended with a disciplined positive close", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadPartialExit: true,
        partialExitCount: 1,
        hadReaddAfterReduction: true,
        readdAfterReductionCount: 1,
        averageFavorableMovePctAfterPartialExitBeforeReadd: 0.01,
        averageAdverseMovePctAfterPartialExitBeforeReadd: 0.02,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 1,
        averageFavorableMovePctAfterReaddBeforeNextExecution: 0.03,
        averageAdverseMovePctAfterReaddBeforeNextExecution: 0.01,
        readdsWithStrongerFavorableFollowthroughCount: 1,
        readdsWithStrongerAdverseFollowthroughCount: 0,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("constructive_reentry_with_constructive_final_exit");
    expect(ids).toContain("constructive_reentry_followthrough_after_trim");
    expect(ids).toContain("trim_readd_with_constructive_final_exit");
  });

  it("detects constructive re-entry with premature final exit when favorable re-entry followthrough still ended before continuation finished", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadPartialExit: true,
        partialExitCount: 1,
        hadReaddAfterReduction: true,
        readdAfterReductionCount: 1,
        averageFavorableMovePctAfterPartialExitBeforeReadd: 0.01,
        averageAdverseMovePctAfterPartialExitBeforeReadd: 0.02,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 1,
        averageFavorableMovePctAfterReaddBeforeNextExecution: 0.03,
        averageAdverseMovePctAfterReaddBeforeNextExecution: 0.01,
        readdsWithStrongerFavorableFollowthroughCount: 1,
        readdsWithStrongerAdverseFollowthroughCount: 0,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("constructive_reentry_with_premature_final_exit");
    expect(ids).toContain("constructive_reentry_followthrough_after_trim");
    expect(ids).toContain("trim_readd_with_missed_final_continuation");
  });

  it("detects constructive re-entry with stop-like forced exit after breakdown when favorable re-entry followthrough still later unraveled into a stop-like breakdown exit", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadPartialExit: true,
        partialExitCount: 1,
        hadReaddAfterReduction: true,
        readdAfterReductionCount: 1,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 1,
        averageFavorableMovePctAfterPartialExitBeforeReadd: 0.01,
        averageAdverseMovePctAfterPartialExitBeforeReadd: 0.02,
        averageFavorableMovePctAfterReaddBeforeNextExecution: 0.03,
        averageAdverseMovePctAfterReaddBeforeNextExecution: 0.01,
        readdsWithStrongerFavorableFollowthroughCount: 1,
        readdsWithStrongerAdverseFollowthroughCount: 0,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.22,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.04,
        maxFavorableMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    );
    expect(ids).toContain("constructive_reentry_followthrough_after_trim");
    expect(ids).toContain("stop_like_forced_exit_after_breakdown");
  });

  it("detects constructive re-entry with stop-like forced exit before rebound when favorable re-entry followthrough still later ended in a stop-like weak-side exit before rebound", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadPartialExit: true,
        partialExitCount: 1,
        hadReaddAfterReduction: true,
        readdAfterReductionCount: 1,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 1,
        averageFavorableMovePctAfterPartialExitBeforeReadd: 0.01,
        averageAdverseMovePctAfterPartialExitBeforeReadd: 0.02,
        averageFavorableMovePctAfterReaddBeforeNextExecution: 0.03,
        averageAdverseMovePctAfterReaddBeforeNextExecution: 0.01,
        readdsWithStrongerFavorableFollowthroughCount: 1,
        readdsWithStrongerAdverseFollowthroughCount: 0,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.22,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.01,
        maxFavorableMovePctAfterExit: 0.05,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "constructive_reentry_with_stop_like_forced_exit_before_rebound",
    );
    expect(ids).toContain("constructive_reentry_followthrough_after_trim");
    expect(ids).toContain("stop_like_forced_exit_before_rebound");
  });

  it("detects deteriorating re-entry after trim when the re-entry was followed by stronger adverse followthrough", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadPartialExit: true,
        partialExitCount: 1,
        hadReaddAfterReduction: true,
        readdAfterReductionCount: 1,
        averageFavorableMovePctAfterPartialExitBeforeReadd: 0.04,
        averageAdverseMovePctAfterPartialExitBeforeReadd: 0.01,
        readdsAfterRecentRunUpCount: 1,
        readdsAfterRecentDropCount: 0,
        averageFavorableMovePctAfterReaddBeforeNextExecution: 0.01,
        averageAdverseMovePctAfterReaddBeforeNextExecution: 0.03,
        readdsWithStrongerFavorableFollowthroughCount: 0,
        readdsWithStrongerAdverseFollowthroughCount: 1,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("deteriorating_reentry_after_trim");
    expect(ids).toContain("late_chase_reentry_after_constructive_trim");
    expect(ids).not.toContain("constructive_reentry_followthrough_after_trim");
  });

  it("detects good pullback re-entry after constructive trim when re-entry followed a calmer pullback", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadPartialExit: true,
        partialExitCount: 1,
        hadReaddAfterReduction: true,
        readdAfterReductionCount: 1,
        averageFavorableMovePctAfterPartialExitBeforeReadd: 0.01,
        averageAdverseMovePctAfterPartialExitBeforeReadd: 0.02,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 1,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("good_pullback_reentry_after_constructive_trim");
    expect(ids).not.toContain("late_chase_reentry_after_constructive_trim");
  });

  it("detects repeated trim re-add with premature final exit when multiple trim/re-add cycles still exited before continuation persisted", () => {
    const result = detectPatterns(
      createBasePatternInput({
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("repeated_trim_readd_with_premature_final_exit");
  });

  it("detects repeated trim re-add with constructive final exit when multiple trim/re-add cycles still ended with a constructive defensive finish", () => {
    const result = detectPatterns(
      createBasePatternInput({
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        maxGivebackFromPeakOpenProfitPct: 0.2,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("repeated_trim_readd_with_constructive_final_exit");
    expect(ids).toContain("repeated_trim_readd_with_constructive_management");
  });

  it("detects repeated constructive re-entry with premature final exit when repeated favorable reloads still ended before continuation persisted", () => {
    const result = detectPatterns(
      createBasePatternInput({
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 2,
        averageAdverseMovePctAfterPartialExitBeforeReadd: 0.02,
        averageFavorableMovePctAfterReaddBeforeNextExecution: 0.03,
        averageAdverseMovePctAfterReaddBeforeNextExecution: 0.01,
        readdsWithStrongerFavorableFollowthroughCount: 2,
        readdsWithStrongerAdverseFollowthroughCount: 0,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "repeated_constructive_reentry_with_premature_final_exit",
    );
    expect(ids).toContain(
      "repeated_trim_readd_with_constructive_reentry_followthrough",
    );
  });

  it("detects repeated balanced management with premature final exit when repeated trim re-add management still ended before continuation persisted without stronger re-entry subtype evidence", () => {
    const result = detectPatterns(
      createBasePatternInput({
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        realizedReturnPct: 0.04,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 0,
        readdsWithStrongerFavorableFollowthroughCount: 0,
        readdsWithStrongerAdverseFollowthroughCount: 0,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "repeated_balanced_management_with_premature_final_exit",
    );
    expect(ids).toContain("repeated_trim_readd_with_premature_final_exit");
    expect(ids).not.toContain(
      "repeated_constructive_reentry_with_premature_final_exit",
    );
  });

  it("detects repeated balanced management with constructive final exit when repeated trim re-add management still ended well without stronger re-entry subtype evidence", () => {
    const result = detectPatterns(
      createBasePatternInput({
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 0,
        readdsWithStrongerFavorableFollowthroughCount: 0,
        readdsWithStrongerAdverseFollowthroughCount: 0,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "repeated_balanced_management_with_constructive_final_exit",
    );
    expect(ids).toContain("repeated_trim_readd_with_constructive_final_exit");
    expect(ids).not.toContain(
      "repeated_constructive_reentry_with_constructive_final_exit",
    );
  });

  it("detects repeated balanced management with missed final continuation when repeated trim re-add management still left continuation without stronger re-entry subtype evidence", () => {
    const result = detectPatterns(
      createBasePatternInput({
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 0,
        readdsWithStrongerFavorableFollowthroughCount: 0,
        readdsWithStrongerAdverseFollowthroughCount: 0,
        maxGivebackFromPeakOpenProfitPct: 0.45,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "repeated_balanced_management_with_missed_final_continuation",
    );
    expect(ids).toContain("repeated_trim_readd_with_missed_final_continuation");
    expect(ids).not.toContain(
      "repeated_constructive_reentry_with_premature_final_exit",
    );
  });

  it("detects repeated constructive re-entry with constructive final exit when repeated favorable reloads still ended in a disciplined positive close", () => {
    const result = detectPatterns(
      createBasePatternInput({
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 2,
        averageAdverseMovePctAfterPartialExitBeforeReadd: 0.02,
        averageFavorableMovePctAfterReaddBeforeNextExecution: 0.03,
        averageAdverseMovePctAfterReaddBeforeNextExecution: 0.01,
        readdsWithStrongerFavorableFollowthroughCount: 2,
        readdsWithStrongerAdverseFollowthroughCount: 0,
        maxGivebackFromPeakOpenProfitPct: 0.2,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "repeated_constructive_reentry_with_constructive_final_exit",
    );
    expect(ids).toContain(
      "repeated_trim_readd_with_constructive_reentry_followthrough",
    );
    expect(ids).toContain("repeated_trim_readd_with_constructive_final_exit");
  });

  it("detects repeated constructive re-entry with stop-like forced exit after breakdown when repeated favorable reloads still later broke down hard", () => {
    const result = detectPatterns(
      createBasePatternInput({
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 2,
        averageAdverseMovePctAfterPartialExitBeforeReadd: 0.02,
        averageFavorableMovePctAfterReaddBeforeNextExecution: 0.03,
        averageAdverseMovePctAfterReaddBeforeNextExecution: 0.01,
        readdsWithStrongerFavorableFollowthroughCount: 2,
        readdsWithStrongerAdverseFollowthroughCount: 0,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.22,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.04,
        maxFavorableMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "repeated_constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    );
    expect(ids).toContain(
      "repeated_trim_readd_with_constructive_reentry_followthrough",
    );
  });

  it("detects repeated constructive re-entry with stop-like forced exit before rebound when repeated favorable reloads still later exited weak-side before rebound", () => {
    const result = detectPatterns(
      createBasePatternInput({
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 2,
        averageAdverseMovePctAfterPartialExitBeforeReadd: 0.02,
        averageFavorableMovePctAfterReaddBeforeNextExecution: 0.03,
        averageAdverseMovePctAfterReaddBeforeNextExecution: 0.01,
        readdsWithStrongerFavorableFollowthroughCount: 2,
        readdsWithStrongerAdverseFollowthroughCount: 0,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.22,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.01,
        maxFavorableMovePctAfterExit: 0.05,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "repeated_constructive_reentry_with_stop_like_forced_exit_before_rebound",
    );
    expect(ids).toContain(
      "repeated_trim_readd_with_constructive_reentry_followthrough",
    );
  });

  it("detects repeated balanced management with stop-like forced exit after breakdown when repeated trim re-add management still later broke down without stronger re-entry subtype evidence", () => {
    const result = detectPatterns(
      createBasePatternInput({
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        totalPositionDecreaseCount: 2,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 0,
        readdsWithStrongerFavorableFollowthroughCount: 0,
        readdsWithStrongerAdverseFollowthroughCount: 0,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.22,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.04,
        maxFavorableMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "repeated_balanced_management_with_stop_like_forced_exit_after_breakdown",
    );
    expect(ids).toContain(
      "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    );
    expect(ids).not.toContain(
      "repeated_constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    );
  });

  it("detects repeated balanced management with stop-like forced exit before rebound when repeated trim re-add management still later exited weak-side before rebound without stronger re-entry subtype evidence", () => {
    const result = detectPatterns(
      createBasePatternInput({
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        totalPositionDecreaseCount: 2,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 0,
        readdsWithStrongerFavorableFollowthroughCount: 0,
        readdsWithStrongerAdverseFollowthroughCount: 0,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.22,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.01,
        maxFavorableMovePctAfterExit: 0.05,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "repeated_balanced_management_with_stop_like_forced_exit_before_rebound",
    );
    expect(ids).toContain("repeated_trim_readd_with_fearful_final_exit");
    expect(ids).not.toContain(
      "repeated_constructive_reentry_with_stop_like_forced_exit_before_rebound",
    );
  });

  it("detects repeated trim re-add with fearful final exit when repeated cycles still ended with a weak low-side final exit", () => {
    const result = detectPatterns(
      createBasePatternInput({
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.25,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("repeated_trim_readd_with_fearful_final_exit");
    expect(ids).toContain("fearful_exit_after_weakening");
  });

  it("detects repeated deteriorating re-entry with defensive final exit when repeated weak reloads still ended with a true save", () => {
    const result = detectPatterns(
      createBasePatternInput({
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        readdsAfterRecentRunUpCount: 2,
        readdsAfterRecentDropCount: 0,
        averageFavorableMovePctAfterPartialExitBeforeReadd: 0.04,
        averageFavorableMovePctAfterReaddBeforeNextExecution: 0.01,
        averageAdverseMovePctAfterReaddBeforeNextExecution: 0.03,
        readdsWithStrongerFavorableFollowthroughCount: 0,
        readdsWithStrongerAdverseFollowthroughCount: 2,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "repeated_deteriorating_reentry_with_defensive_final_exit",
    );
    expect(ids).toContain("repeated_trim_readd_with_deteriorating_reentry");
  });

  it("detects repeated trim re-add with defensive final exit after deterioration when repeated cycles still ended with a true defensive save", () => {
    const result = detectPatterns(
      createBasePatternInput({
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    );
    expect(ids).toContain("defensive_exit_after_deterioration");
  });

  it("detects repeated rescue attempts with defensive final exit after deterioration when an early recovery still ended in a repeated rescue breakdown and final save", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        secondsFromFirstOpenLossToPeakOpenProfit: 150,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "repeated_rescue_attempts_with_defensive_final_exit_after_deterioration",
    );
    expect(ids).toContain(
      "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    );
    expect(ids).toContain("repeated_rescue_attempts_with_renewed_deterioration");
  });

  it("detects repeated balanced management with defensive final exit after deterioration when repeated active management still later needed a defensive save", () => {
    const result = detectPatterns(
      createBasePatternInput({
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        realizedReturnPct: 0.04,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "repeated_balanced_management_with_defensive_final_exit_after_deterioration",
    );
    expect(ids).toContain(
      "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    );
  });

  it("detects repeated rescue attempts with balanced management and defensive final exit after deterioration when repeated rescue management still later needed a defensive save", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        secondsFromFirstOpenLossToPeakOpenProfit: 150,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        realizedReturnPct: 0.04,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "repeated_rescue_attempts_with_balanced_management_and_defensive_final_exit_after_deterioration",
    );
    expect(ids).toContain(
      "repeated_balanced_management_with_defensive_final_exit_after_deterioration",
    );
  });

  it("detects repeated balanced management with fearful final exit when repeated active management still later exited weak-side before rebound", () => {
    const result = detectPatterns(
      createBasePatternInput({
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.2,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("repeated_balanced_management_with_fearful_final_exit");
    expect(ids).toContain("repeated_trim_readd_with_fearful_final_exit");
  });

  it("detects repeated rescue attempts with balanced management and fearful final exit when repeated rescue management still later exited fearfully before rebound", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        secondsFromFirstOpenLossToPeakOpenProfit: 150,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.2,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "repeated_rescue_attempts_with_balanced_management_and_fearful_final_exit",
    );
    expect(ids).toContain("repeated_balanced_management_with_fearful_final_exit");
  });

  it("detects recovery with constructive final exit after constructive re-entry when early adversity still led to a one-cycle constructive reload and positive close", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadPartialExit: true,
        partialExitCount: 1,
        hadReaddAfterReduction: true,
        readdAfterReductionCount: 1,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 1,
        averageFavorableMovePctAfterPartialExitBeforeReadd: 0.01,
        averageAdverseMovePctAfterPartialExitBeforeReadd: 0.02,
        averageFavorableMovePctAfterReaddBeforeNextExecution: 0.03,
        averageAdverseMovePctAfterReaddBeforeNextExecution: 0.01,
        readdsWithStrongerFavorableFollowthroughCount: 1,
        readdsWithStrongerAdverseFollowthroughCount: 0,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "recovery_with_constructive_final_exit_after_constructive_reentry",
    );
    expect(ids).toContain("constructive_reentry_with_constructive_final_exit");
  });

  it("detects recovery with premature final exit after constructive re-entry when early adversity still led to a one-cycle constructive reload but the final exit came too early", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.04,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadPartialExit: true,
        partialExitCount: 1,
        hadReaddAfterReduction: true,
        readdAfterReductionCount: 1,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 1,
        averageFavorableMovePctAfterPartialExitBeforeReadd: 0.01,
        averageAdverseMovePctAfterPartialExitBeforeReadd: 0.02,
        averageFavorableMovePctAfterReaddBeforeNextExecution: 0.03,
        averageAdverseMovePctAfterReaddBeforeNextExecution: 0.01,
        readdsWithStrongerFavorableFollowthroughCount: 1,
        readdsWithStrongerAdverseFollowthroughCount: 0,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "recovery_with_premature_final_exit_after_constructive_reentry",
    );
    expect(ids).toContain("constructive_reentry_with_premature_final_exit");
    expect(ids).toContain("constructive_recovery_after_early_adversity");
  });

  it("detects recovery with stop-like forced exit after constructive re-entry when early adversity recovered but the trade still later broke down after a constructive reload", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.04,
        hadPartialExit: true,
        partialExitCount: 1,
        hadReaddAfterReduction: true,
        readdAfterReductionCount: 1,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 1,
        averageFavorableMovePctAfterPartialExitBeforeReadd: 0.01,
        averageAdverseMovePctAfterPartialExitBeforeReadd: 0.02,
        averageFavorableMovePctAfterReaddBeforeNextExecution: 0.03,
        averageAdverseMovePctAfterReaddBeforeNextExecution: 0.01,
        readdsWithStrongerFavorableFollowthroughCount: 1,
        readdsWithStrongerAdverseFollowthroughCount: 0,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.22,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.04,
        maxFavorableMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "recovery_with_stop_like_forced_exit_after_constructive_reentry",
    );
    expect(ids).toContain(
      "constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    );
    expect(ids).toContain("recovery_after_early_adversity_with_failed_protection");
  });

  it("detects recovery with stop-like forced exit before rebound after constructive re-entry when early adversity recovered but the trade still later exited weak-side before rebound", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.04,
        hadPartialExit: true,
        partialExitCount: 1,
        hadReaddAfterReduction: true,
        readdAfterReductionCount: 1,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 1,
        averageFavorableMovePctAfterPartialExitBeforeReadd: 0.01,
        averageAdverseMovePctAfterPartialExitBeforeReadd: 0.02,
        averageFavorableMovePctAfterReaddBeforeNextExecution: 0.03,
        averageAdverseMovePctAfterReaddBeforeNextExecution: 0.01,
        readdsWithStrongerFavorableFollowthroughCount: 1,
        readdsWithStrongerAdverseFollowthroughCount: 0,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.22,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.01,
        maxFavorableMovePctAfterExit: 0.05,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "recovery_with_stop_like_forced_exit_before_rebound_after_constructive_reentry",
    );
    expect(ids).toContain(
      "constructive_reentry_with_stop_like_forced_exit_before_rebound",
    );
    expect(ids).toContain("recovery_after_early_adversity_with_failed_protection");
  });

  it("detects repeated rescue attempts with premature final exit after constructive re-entries when an early recovery still exited before continuation persisted", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 2,
        averageAdverseMovePctAfterPartialExitBeforeReadd: 0.02,
        averageFavorableMovePctAfterReaddBeforeNextExecution: 0.03,
        averageAdverseMovePctAfterReaddBeforeNextExecution: 0.01,
        readdsWithStrongerFavorableFollowthroughCount: 2,
        readdsWithStrongerAdverseFollowthroughCount: 0,
        maxGivebackFromPeakOpenProfitPct: 0.2,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "repeated_rescue_attempts_with_premature_final_exit_after_constructive_reentries",
    );
    expect(ids).toContain(
      "repeated_constructive_reentry_with_premature_final_exit",
    );
  });

  it("detects repeated rescue attempts with balanced management and premature final exit when an early recovery still ended in repeated balanced management but exited before continuation persisted without stronger re-entry subtype evidence", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        realizedReturnPct: 0.04,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 0,
        readdsWithStrongerFavorableFollowthroughCount: 0,
        readdsWithStrongerAdverseFollowthroughCount: 0,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "repeated_rescue_attempts_with_balanced_management_and_premature_final_exit",
    );
    expect(ids).toContain(
      "repeated_balanced_management_with_premature_final_exit",
    );
    expect(ids).not.toContain(
      "repeated_rescue_attempts_with_premature_final_exit_after_constructive_reentries",
    );
  });

  it("detects repeated rescue attempts with balanced management and constructive final exit when an early recovery still ended in repeated balanced management with a disciplined close but without stronger re-entry subtype evidence", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 0,
        readdsWithStrongerFavorableFollowthroughCount: 0,
        readdsWithStrongerAdverseFollowthroughCount: 0,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "repeated_rescue_attempts_with_balanced_management_and_constructive_final_exit",
    );
    expect(ids).toContain(
      "repeated_balanced_management_with_constructive_final_exit",
    );
    expect(ids).not.toContain(
      "repeated_rescue_attempts_with_constructive_final_exit_after_constructive_reentries",
    );
  });

  it("detects repeated rescue attempts with balanced management and missed final continuation when an early recovery still ended in repeated balanced management but left continuation without stronger re-entry subtype evidence", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 0,
        readdsWithStrongerFavorableFollowthroughCount: 0,
        readdsWithStrongerAdverseFollowthroughCount: 0,
        maxGivebackFromPeakOpenProfitPct: 0.45,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "repeated_rescue_attempts_with_balanced_management_and_missed_final_continuation",
    );
    expect(ids).toContain(
      "repeated_balanced_management_with_missed_final_continuation",
    );
    expect(ids).not.toContain(
      "repeated_rescue_attempts_with_premature_final_exit_after_constructive_reentries",
    );
  });

  it("detects repeated rescue attempts with balanced management and stop-like forced exit after breakdown when an early recovery still later broke down without stronger repeated constructive re-entry evidence", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        totalPositionDecreaseCount: 2,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 0,
        readdsWithStrongerFavorableFollowthroughCount: 0,
        readdsWithStrongerAdverseFollowthroughCount: 0,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.22,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.04,
        maxFavorableMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_after_breakdown",
    );
    expect(ids).toContain(
      "repeated_balanced_management_with_stop_like_forced_exit_after_breakdown",
    );
    expect(ids).not.toContain(
      "repeated_rescue_attempts_with_stop_like_forced_exit_after_constructive_reentries",
    );
  });

  it("detects repeated rescue attempts with balanced management and stop-like forced exit before rebound when an early recovery still later exited weak-side before rebound without stronger repeated constructive re-entry evidence", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        totalPositionDecreaseCount: 2,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 0,
        readdsWithStrongerFavorableFollowthroughCount: 0,
        readdsWithStrongerAdverseFollowthroughCount: 0,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.22,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.01,
        maxFavorableMovePctAfterExit: 0.05,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    );
    expect(ids).toContain(
      "repeated_balanced_management_with_stop_like_forced_exit_before_rebound",
    );
    expect(ids).not.toContain(
      "repeated_rescue_attempts_with_stop_like_forced_exit_before_rebound_after_constructive_reentries",
    );
  });

  it("detects repeated rescue attempts with constructive final exit after constructive re-entries when an early recovery still finished with a disciplined positive close", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 2,
        averageAdverseMovePctAfterPartialExitBeforeReadd: 0.02,
        averageFavorableMovePctAfterReaddBeforeNextExecution: 0.03,
        averageAdverseMovePctAfterReaddBeforeNextExecution: 0.01,
        readdsWithStrongerFavorableFollowthroughCount: 2,
        readdsWithStrongerAdverseFollowthroughCount: 0,
        maxGivebackFromPeakOpenProfitPct: 0.2,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "repeated_rescue_attempts_with_constructive_final_exit_after_constructive_reentries",
    );
    expect(ids).toContain(
      "repeated_constructive_reentry_with_constructive_final_exit",
    );
  });

  it("detects repeated rescue attempts with stop-like forced exit after constructive re-entries when an early recovery still later broke down after repeated constructive reloads", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 2,
        averageAdverseMovePctAfterPartialExitBeforeReadd: 0.02,
        averageFavorableMovePctAfterReaddBeforeNextExecution: 0.03,
        averageAdverseMovePctAfterReaddBeforeNextExecution: 0.01,
        readdsWithStrongerFavorableFollowthroughCount: 2,
        readdsWithStrongerAdverseFollowthroughCount: 0,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.22,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.04,
        maxFavorableMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "repeated_rescue_attempts_with_stop_like_forced_exit_after_constructive_reentries",
    );
    expect(ids).toContain(
      "repeated_constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    );
  });

  it("detects repeated rescue attempts with stop-like forced exit before rebound after constructive re-entries when an early recovery still later exited weak-side before rebound", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 2,
        averageAdverseMovePctAfterPartialExitBeforeReadd: 0.02,
        averageFavorableMovePctAfterReaddBeforeNextExecution: 0.03,
        averageAdverseMovePctAfterReaddBeforeNextExecution: 0.01,
        readdsWithStrongerFavorableFollowthroughCount: 2,
        readdsWithStrongerAdverseFollowthroughCount: 0,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.22,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.01,
        maxFavorableMovePctAfterExit: 0.05,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "repeated_rescue_attempts_with_stop_like_forced_exit_before_rebound_after_constructive_reentries",
    );
    expect(ids).toContain(
      "repeated_constructive_reentry_with_stop_like_forced_exit_before_rebound",
    );
  });

  it("detects repeated rescue attempts with defensive final exit after deteriorating re-entries when an early recovery still needed a final save", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        readdsAfterRecentRunUpCount: 2,
        readdsAfterRecentDropCount: 0,
        averageFavorableMovePctAfterPartialExitBeforeReadd: 0.04,
        averageFavorableMovePctAfterReaddBeforeNextExecution: 0.01,
        averageAdverseMovePctAfterReaddBeforeNextExecution: 0.03,
        readdsWithStrongerFavorableFollowthroughCount: 0,
        readdsWithStrongerAdverseFollowthroughCount: 2,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "repeated_rescue_attempts_with_defensive_final_exit_after_deteriorating_reentries",
    );
    expect(ids).toContain(
      "repeated_deteriorating_reentry_with_defensive_final_exit",
    );
  });

  it("detects held through danger after peak profit when no reduction occurred in the danger window", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: false,
        reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 0,
        secondsFromPeakOpenProfitToWorstDrawdown: 180,
        secondsFromPeakOpenProfitToFirstReduction: null,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("held_through_danger_after_peak_profit");
    expect(ids).not.toContain("delayed_risk_response_after_peak_profit");
  });

  it("detects delayed risk response after peak profit when reduction happened late in the danger window", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 1,
        secondsFromPeakOpenProfitToWorstDrawdown: 180,
        secondsFromPeakOpenProfitToFirstReduction: 90,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("delayed_risk_response_after_peak_profit");
    expect(ids).not.toContain("held_through_danger_after_peak_profit");
  });

  it("detects timely risk response with profit protection when reduction happens promptly and retained protection stays intact", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 1,
        secondsFromPeakOpenProfitToWorstDrawdown: 180,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        peakOpenProfitPctOfBasis: 0.08,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("timely_risk_response_after_peak_profit");
    expect(ids).toContain("timely_risk_response_with_profit_protection");
    expect(ids).toContain("constructive_readd_after_reduction");
    expect(ids).toContain("balanced_management_with_constructive_exit");
    expect(ids).not.toContain("delayed_risk_response_after_peak_profit");
    expect(ids).not.toContain(
      "delayed_risk_response_with_failed_profit_protection",
    );
  });

  it("detects recovery with balanced management and constructive final exit when early adversity was followed by broad active management and a disciplined positive close", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.04,
        addCountAfterInitialEntry: 1,
        addAbovePreviousAverageEntryCount: 0,
        addBelowPreviousAverageEntryCount: 0,
        averageAddPriceVsPreviousAverageEntryPct: null,
        averageAddPricePositionInRecentRangePct: null,
        addsWithRecentRunUpCount: 0,
        addsWithRecentDropCount: 0,
        hadPartialExit: false,
        partialExitCount: 0,
        hadReaddAfterReduction: false,
        readdAfterReductionCount: 0,
        totalPositionDecreaseCount: 1,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "recovery_with_balanced_management_and_constructive_final_exit",
    );
    expect(ids).toContain("balanced_management_with_constructive_exit");
    expect(ids).toContain("constructive_recovery_after_early_adversity");
  });

  it("detects timely profit protection with constructive final exit when timely protection still ended with a disciplined positive close", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 1,
        secondsFromPeakOpenProfitToWorstDrawdown: 180,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        peakOpenProfitPctOfBasis: 0.08,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "timely_profit_protection_with_constructive_final_exit",
    );
    expect(ids).toContain("timely_risk_response_with_profit_protection");
    expect(ids).toContain("balanced_management_with_constructive_exit");
  });

  it("detects trim re-add with constructive final exit when the trade reloaded and the final exit avoided later damage", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadPartialExit: true,
        partialExitCount: 1,
        hadReaddAfterReduction: true,
        readdAfterReductionCount: 1,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("trim_readd_with_constructive_final_exit");
    expect(ids).not.toContain("trim_readd_with_missed_final_continuation");
  });

  it("detects trim re-add with missed final continuation when the final exit left continued upside after the re-add cycle", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadPartialExit: true,
        partialExitCount: 1,
        hadReaddAfterReduction: true,
        readdAfterReductionCount: 1,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain("trim_readd_with_missed_final_continuation");
    expect(ids).not.toContain("trim_readd_with_constructive_final_exit");
  });

  it("detects sequence-level delayed risk response failures when reduction was late, failed, and later re-added", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 1,
        secondsFromPeakOpenProfitToWorstDrawdown: 180,
        secondsFromPeakOpenProfitToFirstReduction: 90,
        hadReaddAfterReduction: true,
        readdAfterReductionCount: 1,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        peakOpenProfitPctOfBasis: 0.08,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "delayed_risk_response_with_failed_profit_protection",
    );
    expect(ids).toContain("readd_after_delayed_risk_response");
  });

  it("detects held through danger with stop-like forced exit after breakdown when danger was held and the weak-side exit still broke down further", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: false,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.22,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.04,
        maxFavorableMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "held_through_danger_with_stop_like_forced_exit_after_breakdown",
    );
    expect(ids).toContain("held_through_danger_after_peak_profit");
    expect(ids).toContain("stop_like_forced_exit_after_breakdown");
  });

  it("detects held through danger with stop-like forced exit before rebound when danger was held and the weak-side exit still rebounded", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: false,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.22,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.01,
        maxFavorableMovePctAfterExit: 0.05,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "held_through_danger_with_stop_like_forced_exit_before_rebound",
    );
    expect(ids).toContain("held_through_danger_after_peak_profit");
    expect(ids).toContain("stop_like_forced_exit_before_rebound");
  });

  it("detects delayed risk response with stop-like forced exit after breakdown when reduction came late and the final exit still deteriorated", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        secondsFromPeakOpenProfitToFirstReduction: 90,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        peakOpenProfitPctOfBasis: 0.08,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.22,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.04,
        maxFavorableMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "delayed_risk_response_with_stop_like_forced_exit_after_breakdown",
    );
    expect(ids).toContain("delayed_risk_response_with_failed_profit_protection");
    expect(ids).toContain("stop_like_forced_exit_after_breakdown");
  });

  it("detects delayed risk response with stop-like forced exit before rebound when reduction came late and the final exit still rebounded", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        secondsFromPeakOpenProfitToFirstReduction: 90,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        peakOpenProfitPctOfBasis: 0.08,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.22,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.01,
        maxFavorableMovePctAfterExit: 0.05,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );
    const ids = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(ids).toContain(
      "delayed_risk_response_with_stop_like_forced_exit_before_rebound",
    );
    expect(ids).toContain("delayed_risk_response_with_failed_profit_protection");
    expect(ids).toContain("stop_like_forced_exit_before_rebound");
  });

  it("detects first support/resistance-aware entry and exit patterns from PatternInput bridge facts", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadSupportResistanceContextAvailable: true,
        firstEntryOccurredNearSupport: true,
        firstEntryOccurredNearResistance: false,
        firstEntryNearestSupportBelowPrice: 1.18,
        firstEntryDistanceToNearestSupportPct: 0.2,
        firstEntryNearestReferenceLevelLabel: "premarket_base",
        finalExitOccurredNearSupport: true,
        finalExitDistanceToNearestSupportPct: 0.15,
      }),
    );

    const detectedIds = result.detectedPatterns.map((pattern) => pattern.patternId);

    expect(detectedIds).toContain("entry_near_support_structure");
    expect(detectedIds).toContain("exit_into_support_structure");
  });

  it("detects the first level-aware weak-side entry pattern when entry sits under resistance", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadSupportResistanceContextAvailable: true,
        firstEntryOccurredNearSupport: false,
        firstEntryOccurredNearResistance: true,
        firstEntryNearestResistanceAbovePrice: 1.19,
        firstEntryDistanceToNearestResistancePct: 0.18,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "entry_under_resistance_structure",
    );
  });

  it("detects entry far from support when support context exists but entry is meaningfully stretched away from support", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadSupportResistanceContextAvailable: true,
        firstEntryOccurredNearSupport: false,
        firstEntryDistanceToNearestSupportPct: 0.04,
        firstEntryOccurredInOpenAir: true,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "entry_far_from_support_structure",
    );
  });

  it("detects add into resistance when later adds occur near or above nearby resistance", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadSupportResistanceContextAvailable: true,
        addCountAfterInitialEntry: 1,
        addsNearResistanceCount: 1,
        addsAboveResistanceCount: 0,
        addsAboveResistanceWithRoomCount: 0,
        averageAddDistanceToNearestResistancePct: 0.002,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "add_into_resistance_structure",
    );
  });

  it("detects trim into resistance with constructive final exit when a partial exit happens near resistance and the final exit still avoids later damage", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadSupportResistanceContextAvailable: true,
        hadPartialExit: true,
        partialExitCount: 1,
        totalPositionDecreaseCount: 1,
        reductionsNearResistanceCount: 1,
        averageReductionPriceVsPreviousAverageEntryPct: 0.05,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        closedToFlat: true,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.04,
        maxFavorableMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "trim_into_resistance_with_constructive_final_exit",
    );
  });

  it("detects trim into resistance with premature final exit when a partial exit happens near resistance but the final exit still comes before breakout continuation", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadSupportResistanceContextAvailable: true,
        hadPartialExit: true,
        partialExitCount: 1,
        totalPositionDecreaseCount: 1,
        reductionsNearResistanceCount: 1,
        averageReductionPriceVsPreviousAverageEntryPct: 0.05,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        closedToFlat: true,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "trim_into_resistance_with_premature_final_exit",
    );
  });

  it("detects recovery with trim into resistance and constructive final exit when early adversity recovers and the resistance-aware trim still finishes well", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.05,
        hadSupportResistanceContextAvailable: true,
        hadPartialExit: true,
        partialExitCount: 1,
        totalPositionDecreaseCount: 1,
        reductionsNearResistanceCount: 1,
        averageReductionPriceVsPreviousAverageEntryPct: 0.05,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        closedToFlat: true,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.04,
        maxFavorableMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "recovery_with_trim_into_resistance_and_constructive_final_exit",
    );
  });

  it("detects recovery with trim into resistance and premature final exit when early adversity recovers but the final exit still comes before breakout continuation", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.05,
        hadSupportResistanceContextAvailable: true,
        hadPartialExit: true,
        partialExitCount: 1,
        totalPositionDecreaseCount: 1,
        reductionsNearResistanceCount: 1,
        averageReductionPriceVsPreviousAverageEntryPct: 0.05,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        closedToFlat: true,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "recovery_with_trim_into_resistance_and_premature_final_exit",
    );
  });

  it("detects balanced management with take profit into resistance and constructive final exit when balanced management still includes reductions into nearby resistance before a disciplined finish", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadSupportResistanceContextAvailable: true,
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 1,
        reductionsNearResistanceCount: 1,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        closedToFlat: true,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.04,
        maxFavorableMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "balanced_management_with_take_profit_into_resistance_and_constructive_final_exit",
    );
  });

  it("detects balanced management with take profit into resistance and premature final exit when balanced management still includes reductions into nearby resistance before missed breakout continuation", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadSupportResistanceContextAvailable: true,
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 1,
        realizedReturnPct: 0.05,
        reductionsNearResistanceCount: 1,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        closedToFlat: true,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "balanced_management_with_take_profit_into_resistance_and_premature_final_exit",
    );
  });

  it("detects recovery with balanced management and take profit into resistance and constructive final exit when early adversity recovers into a disciplined resistance-aware finish", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadSupportResistanceContextAvailable: true,
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 1,
        reductionsNearResistanceCount: 1,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        closedToFlat: true,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.04,
        maxFavorableMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "recovery_with_balanced_management_and_take_profit_into_resistance_and_constructive_final_exit",
    );
  });

  it("detects recovery with balanced management and take profit into resistance and premature final exit when early adversity recovers but the final exit still comes before breakout continuation", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.05,
        hadSupportResistanceContextAvailable: true,
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 1,
        reductionsNearResistanceCount: 1,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        closedToFlat: true,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "recovery_with_balanced_management_and_take_profit_into_resistance_and_premature_final_exit",
    );
  });

  it("detects breakout with room above when entry clears nearby resistance and still has room overhead", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadSupportResistanceContextAvailable: true,
        firstEntryClearedNearestResistanceBelow: true,
        firstEntryHadRoomAboveAfterClearingResistance: true,
        firstEntryDistanceAboveNearestResistanceBelowPct: 0.006,
        firstEntryDistanceToNearestResistancePct: 0.028,
        firstEntryOccurredNearResistance: false,
        firstEntryCapturedPercentOfTradeMfe: 0.8,
        firstEntryToWorstMovePct: 0.01,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "breakout_with_room_above_structure",
    );
  });

  it("detects breakout with room above and constructive final exit when the breakout clears resistance and the trade still finishes well", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadSupportResistanceContextAvailable: true,
        firstEntryClearedNearestResistanceBelow: true,
        firstEntryHadRoomAboveAfterClearingResistance: true,
        firstEntryDistanceAboveNearestResistanceBelowPct: 0.006,
        firstEntryDistanceToNearestResistancePct: 0.028,
        firstEntryOccurredNearResistance: false,
        firstEntryCapturedPercentOfTradeMfe: 0.8,
        firstEntryToWorstMovePct: 0.01,
        maxGivebackFromPeakOpenProfitPct: 0.2,
        closedToFlat: true,
        postExitCandleCount: 1,
        maxAdverseMovePctAfterExit: 0.03,
        maxFavorableMovePctAfterExit: 0.005,
        netMovePctAtEndOfPostExitWindow: -0.01,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "breakout_with_room_above_and_constructive_final_exit",
    );
  });

  it("detects breakout with room above and failed profit protection when the breakout had room but later profit protection still failed", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadSupportResistanceContextAvailable: true,
        firstEntryClearedNearestResistanceBelow: true,
        firstEntryHadRoomAboveAfterClearingResistance: true,
        firstEntryDistanceAboveNearestResistanceBelowPct: 0.006,
        firstEntryDistanceToNearestResistancePct: 0.028,
        firstEntryOccurredNearResistance: false,
        firstEntryCapturedPercentOfTradeMfe: 0.8,
        firstEntryToWorstMovePct: 0.01,
        maxGivebackFromPeakOpenProfitPct: 0.6,
        peakOpenProfitPctOfBasis: 0.08,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "breakout_with_room_above_and_failed_profit_protection",
    );
  });

  it("detects recovery with breakout with room above and constructive final exit when early adversity recovers and the breakout still finishes constructively", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.03,
        hadSupportResistanceContextAvailable: true,
        firstEntryClearedNearestResistanceBelow: true,
        firstEntryHadRoomAboveAfterClearingResistance: true,
        firstEntryDistanceAboveNearestResistanceBelowPct: 0.006,
        firstEntryDistanceToNearestResistancePct: 0.028,
        firstEntryOccurredNearResistance: false,
        firstEntryCapturedPercentOfTradeMfe: 0.8,
        firstEntryToWorstMovePct: 0.01,
        maxGivebackFromPeakOpenProfitPct: 0.2,
        closedToFlat: true,
        postExitCandleCount: 1,
        maxAdverseMovePctAfterExit: 0.03,
        maxFavorableMovePctAfterExit: 0.005,
        netMovePctAtEndOfPostExitWindow: -0.01,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "recovery_with_breakout_with_room_above_and_constructive_final_exit",
    );
  });

  it("detects recovery with breakout with room above and failed profit protection when early adversity recovers but the breakout still later gives too much back", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadSupportResistanceContextAvailable: true,
        firstEntryClearedNearestResistanceBelow: true,
        firstEntryHadRoomAboveAfterClearingResistance: true,
        firstEntryDistanceAboveNearestResistanceBelowPct: 0.006,
        firstEntryDistanceToNearestResistancePct: 0.028,
        firstEntryOccurredNearResistance: false,
        firstEntryCapturedPercentOfTradeMfe: 0.8,
        firstEntryToWorstMovePct: 0.01,
        maxGivebackFromPeakOpenProfitPct: 0.6,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "recovery_with_breakout_with_room_above_and_failed_profit_protection",
    );
  });

  it("detects breakout into overhead resistance when entry clears nearby resistance directly into stacked overhead levels", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadSupportResistanceContextAvailable: true,
        firstEntryClearedNearestResistanceBelow: true,
        firstEntryHadRoomAboveAfterClearingResistance: false,
        firstEntryHasStackedResistanceAbove: true,
        firstEntryResistanceLevelsAboveWithinClusterCount: 2,
        firstEntryCapturedPercentOfTradeMfe: 0.2,
        firstEntryToWorstMovePct: 0.03,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "breakout_into_overhead_resistance_structure",
    );
  });

  it("detects breakout into overhead resistance with defensive final exit when the weak breakout later needs a disciplined defensive save", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadSupportResistanceContextAvailable: true,
        firstEntryClearedNearestResistanceBelow: true,
        firstEntryHadRoomAboveAfterClearingResistance: false,
        firstEntryHasStackedResistanceAbove: true,
        firstEntryResistanceLevelsAboveWithinClusterCount: 2,
        firstEntryCapturedPercentOfTradeMfe: 0.2,
        firstEntryToWorstMovePct: 0.03,
        closedToFlat: true,
        totalPositionDecreaseCount: 1,
        postExitCandleCount: 1,
        maxAdverseMovePctAfterExit: 0.03,
        maxFavorableMovePctAfterExit: 0.005,
        netMovePctAtEndOfPostExitWindow: -0.01,
        maxGivebackFromPeakOpenProfitPct: 0.2,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "breakout_into_overhead_resistance_with_defensive_final_exit",
    );
  });

  it("detects breakout into overhead resistance with failed profit protection when the weak breakout still builds open profit and then badly gives it back", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadSupportResistanceContextAvailable: true,
        firstEntryClearedNearestResistanceBelow: true,
        firstEntryHadRoomAboveAfterClearingResistance: false,
        firstEntryHasStackedResistanceAbove: true,
        firstEntryResistanceLevelsAboveWithinClusterCount: 2,
        firstEntryCapturedPercentOfTradeMfe: 0.2,
        firstEntryToWorstMovePct: 0.03,
        maxGivebackFromPeakOpenProfitPct: 0.6,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "breakout_into_overhead_resistance_with_failed_profit_protection",
    );
  });

  it("detects recovery with breakout into overhead resistance and defensive final exit when early adversity recovers but the weak breakout still later needs a disciplined save", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.03,
        hadSupportResistanceContextAvailable: true,
        firstEntryClearedNearestResistanceBelow: true,
        firstEntryHadRoomAboveAfterClearingResistance: false,
        firstEntryHasStackedResistanceAbove: true,
        firstEntryResistanceLevelsAboveWithinClusterCount: 2,
        firstEntryCapturedPercentOfTradeMfe: 0.2,
        firstEntryToWorstMovePct: 0.03,
        closedToFlat: true,
        totalPositionDecreaseCount: 1,
        postExitCandleCount: 1,
        maxAdverseMovePctAfterExit: 0.03,
        maxFavorableMovePctAfterExit: 0.005,
        netMovePctAtEndOfPostExitWindow: -0.01,
        maxGivebackFromPeakOpenProfitPct: 0.2,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "recovery_with_breakout_into_overhead_resistance_and_defensive_final_exit",
    );
  });

  it("detects recovery with breakout into overhead resistance and failed profit protection when early adversity recovers but the weak breakout still later gives too much back", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadSupportResistanceContextAvailable: true,
        firstEntryClearedNearestResistanceBelow: true,
        firstEntryHadRoomAboveAfterClearingResistance: false,
        firstEntryHasStackedResistanceAbove: true,
        firstEntryResistanceLevelsAboveWithinClusterCount: 2,
        firstEntryCapturedPercentOfTradeMfe: 0.2,
        firstEntryToWorstMovePct: 0.03,
        maxGivebackFromPeakOpenProfitPct: 0.6,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "recovery_with_breakout_into_overhead_resistance_and_failed_profit_protection",
    );
  });

  it("detects add above resistance separately when later adds clear nearby resistance with room above", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadSupportResistanceContextAvailable: true,
        addCountAfterInitialEntry: 1,
        addsNearResistanceCount: 0,
        addsAboveResistanceCount: 1,
        addsAboveResistanceWithRoomCount: 1,
        averageAddRoomToNextResistancePct: 0.021,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "add_above_resistance_structure",
    );
  });

  it("detects add above resistance with constructive final exit when the later add clears resistance and the trade still finishes well", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadSupportResistanceContextAvailable: true,
        addCountAfterInitialEntry: 1,
        addsAboveResistanceCount: 1,
        addsAboveResistanceWithRoomCount: 1,
        averageAddRoomToNextResistancePct: 0.021,
        addAbovePreviousAverageEntryCount: 0,
        averageAddPriceVsPreviousAverageEntryPct: null,
        averageAddPricePositionInRecentRangePct: 0.5,
        maxGivebackFromPeakOpenProfitPct: 0.2,
        closedToFlat: true,
        postExitCandleCount: 1,
        maxAdverseMovePctAfterExit: 0.03,
        maxFavorableMovePctAfterExit: 0.005,
        netMovePctAtEndOfPostExitWindow: -0.01,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "add_above_resistance_with_constructive_final_exit",
    );
  });

  it("detects add above resistance with failed profit protection when the later add clears resistance but profits are badly given back", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadSupportResistanceContextAvailable: true,
        addCountAfterInitialEntry: 1,
        addsAboveResistanceCount: 1,
        addsAboveResistanceWithRoomCount: 1,
        averageAddRoomToNextResistancePct: 0.021,
        maxGivebackFromPeakOpenProfitPct: 0.6,
        peakOpenProfitPctOfBasis: 0.08,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "add_above_resistance_with_failed_profit_protection",
    );
  });

  it("detects recovery with add above resistance and constructive final exit when an early loser recovers, later adds clear resistance, and the trade still finishes well", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.03,
        hadSupportResistanceContextAvailable: true,
        addCountAfterInitialEntry: 1,
        addsAboveResistanceCount: 1,
        addsAboveResistanceWithRoomCount: 1,
        averageAddRoomToNextResistancePct: 0.021,
        maxGivebackFromPeakOpenProfitPct: 0.2,
        closedToFlat: true,
        postExitCandleCount: 1,
        maxAdverseMovePctAfterExit: 0.03,
        maxFavorableMovePctAfterExit: 0.005,
        netMovePctAtEndOfPostExitWindow: -0.01,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "recovery_with_add_above_resistance_and_constructive_final_exit",
    );
  });

  it("detects recovery with add above resistance and failed profit protection when an early loser recovers, later adds clear resistance, and profits are still badly given back", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadSupportResistanceContextAvailable: true,
        addCountAfterInitialEntry: 1,
        addsAboveResistanceCount: 1,
        addsAboveResistanceWithRoomCount: 1,
        averageAddRoomToNextResistancePct: 0.021,
        addAbovePreviousAverageEntryCount: 0,
        averageAddPriceVsPreviousAverageEntryPct: null,
        averageAddPricePositionInRecentRangePct: 0.5,
        maxGivebackFromPeakOpenProfitPct: 0.6,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "recovery_with_add_above_resistance_and_failed_profit_protection",
    );
  });

  it("detects repeated adds above resistance with constructive final exit when multiple later adds clear resistance and the trade still finishes well", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadSupportResistanceContextAvailable: true,
        addCountAfterInitialEntry: 2,
        addsAboveResistanceCount: 2,
        addsAboveResistanceWithRoomCount: 2,
        averageAddRoomToNextResistancePct: 0.021,
        maxGivebackFromPeakOpenProfitPct: 0.2,
        closedToFlat: true,
        postExitCandleCount: 1,
        maxAdverseMovePctAfterExit: 0.03,
        maxFavorableMovePctAfterExit: 0.005,
        netMovePctAtEndOfPostExitWindow: -0.01,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "repeated_adds_above_resistance_with_constructive_final_exit",
    );
  });

  it("detects repeated adds above resistance with failed profit protection when multiple later adds clear resistance but profits are still badly given back", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadSupportResistanceContextAvailable: true,
        addCountAfterInitialEntry: 2,
        addsAboveResistanceCount: 2,
        addsAboveResistanceWithRoomCount: 2,
        averageAddRoomToNextResistancePct: 0.021,
        maxGivebackFromPeakOpenProfitPct: 0.6,
        peakOpenProfitPctOfBasis: 0.08,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "repeated_adds_above_resistance_with_failed_profit_protection",
    );
  });

  it("detects richer exit into support with relief when the final exit occurs into support and price relieves afterward", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadSupportResistanceContextAvailable: true,
        finalExitOccurredNearSupport: true,
        finalExitDistanceToNearestSupportPct: 0.001,
        maxFavorableMovePctAfterExit: 0.03,
        netMovePctAtEndOfPostExitWindow: 0.01,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "exit_into_support_with_relief_after_exit",
    );
  });

  it("detects exit into support before breakdown when the final exit occurs into support but price still breaks lower", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadSupportResistanceContextAvailable: true,
        finalExitOccurredNearSupport: true,
        finalExitDistanceToNearestSupportPct: 0.001,
        finalExitSupportLevelsBelowWithinClusterCount: 1,
        finalExitHasStackedSupportBelow: false,
        maxFavorableMovePctAfterExit: 0.005,
        maxAdverseMovePctAfterExit: 0.03,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "exit_into_support_before_breakdown",
    );
  });

  it("detects exit into stacked support with relief after exit when the final exit occurs into denser support and price relieves higher", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadSupportResistanceContextAvailable: true,
        finalExitOccurredNearSupport: true,
        finalExitDistanceToNearestSupportPct: 0.001,
        finalExitSupportLevelsBelowWithinClusterCount: 2,
        finalExitHasStackedSupportBelow: true,
        maxFavorableMovePctAfterExit: 0.03,
        netMovePctAtEndOfPostExitWindow: 0.01,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "exit_into_stacked_support_with_relief_after_exit",
    );
  });

  it("detects exit into thin support before breakdown when the final exit occurs into thin support and price still breaks lower", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadSupportResistanceContextAvailable: true,
        finalExitOccurredNearSupport: true,
        finalExitDistanceToNearestSupportPct: 0.001,
        finalExitSupportLevelsBelowWithinClusterCount: 1,
        finalExitHasStackedSupportBelow: false,
        maxAdverseMovePctAfterExit: 0.03,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "exit_into_thin_support_before_breakdown",
    );
  });

  it("detects stabilized recovery with exit into stacked support and relief when early adversity stabilizes and the final exit lands into denser support that relieves", () => {
    const result = detectPatterns(
      createBasePatternInput({
        closedToFlat: true,
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        maxGivebackFromPeakOpenProfitPct: 0.2,
        hadSupportResistanceContextAvailable: true,
        finalExitOccurredNearSupport: true,
        finalExitSupportLevelsBelowWithinClusterCount: 2,
        finalExitHasStackedSupportBelow: true,
        postExitCandleCount: 1,
        maxFavorableMovePctAfterExit: 0.03,
        maxAdverseMovePctAfterExit: 0.005,
        netMovePctAtEndOfPostExitWindow: 0.01,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "stabilized_recovery_with_exit_into_stacked_support_and_relief",
    );
  });

  it("detects stabilized recovery with exit into thin support before breakdown when early adversity stabilizes but the final exit still lands into thinner support that fails", () => {
    const result = detectPatterns(
      createBasePatternInput({
        closedToFlat: true,
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        maxGivebackFromPeakOpenProfitPct: 0.2,
        hadSupportResistanceContextAvailable: true,
        finalExitOccurredNearSupport: true,
        finalExitSupportLevelsBelowWithinClusterCount: 1,
        finalExitHasStackedSupportBelow: false,
        postExitCandleCount: 1,
        maxFavorableMovePctAfterExit: 0.005,
        maxAdverseMovePctAfterExit: 0.03,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "stabilized_recovery_with_exit_into_thin_support_before_breakdown",
    );
  });

  it("detects exit into resistance with reversal after exit when the final exit occurs into nearby resistance and price later reverses lower", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadSupportResistanceContextAvailable: true,
        finalExitOccurredNearResistance: true,
        finalExitDistanceToNearestResistancePct: 0.001,
        maxAdverseMovePctAfterExit: 0.03,
        maxFavorableMovePctAfterExit: 0.005,
        netMovePctAtEndOfPostExitWindow: -0.01,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "exit_into_resistance_with_reversal_after_exit",
    );
  });

  it("detects exit into resistance before breakout when the final exit occurs into nearby resistance but price later breaks higher", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadSupportResistanceContextAvailable: true,
        finalExitOccurredNearResistance: true,
        finalExitDistanceToNearestResistancePct: 0.001,
        maxFavorableMovePctAfterExit: 0.03,
        maxAdverseMovePctAfterExit: 0.005,
        netMovePctAtEndOfPostExitWindow: 0.01,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "exit_into_resistance_before_breakout",
    );
  });

  it("detects stabilized recovery with exit into resistance and reversal when early adversity stabilizes and the final exit lands into resistance before price reverses lower", () => {
    const result = detectPatterns(
      createBasePatternInput({
        closedToFlat: true,
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        maxGivebackFromPeakOpenProfitPct: 0.2,
        hadSupportResistanceContextAvailable: true,
        finalExitOccurredNearResistance: true,
        finalExitDistanceToNearestResistancePct: 0.001,
        postExitCandleCount: 1,
        maxAdverseMovePctAfterExit: 0.03,
        maxFavorableMovePctAfterExit: 0.005,
        netMovePctAtEndOfPostExitWindow: -0.01,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "stabilized_recovery_with_exit_into_resistance_and_reversal",
    );
  });

  it("detects stabilized recovery with exit into resistance before breakout when early adversity stabilizes but the final exit still lands into resistance before price breaks higher", () => {
    const result = detectPatterns(
      createBasePatternInput({
        closedToFlat: true,
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        maxGivebackFromPeakOpenProfitPct: 0.2,
        hadSupportResistanceContextAvailable: true,
        finalExitOccurredNearResistance: true,
        finalExitDistanceToNearestResistancePct: 0.001,
        postExitCandleCount: 1,
        maxFavorableMovePctAfterExit: 0.03,
        maxAdverseMovePctAfterExit: 0.005,
        netMovePctAtEndOfPostExitWindow: 0.01,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "stabilized_recovery_with_exit_into_resistance_before_breakout",
    );
  });

  it("detects repeated balanced management with exit into stacked support and relief when repeated trim-readd management later exits into denser support that relieves", () => {
    const result = detectPatterns(
      createBasePatternInput({
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        closedToFlat: true,
        hadSupportResistanceContextAvailable: true,
        finalExitOccurredNearSupport: true,
        finalExitSupportLevelsBelowWithinClusterCount: 2,
        finalExitHasStackedSupportBelow: true,
        postExitCandleCount: 1,
        maxFavorableMovePctAfterExit: 0.03,
        maxAdverseMovePctAfterExit: 0.005,
        netMovePctAtEndOfPostExitWindow: 0.01,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "repeated_balanced_management_with_exit_into_stacked_support_and_relief",
    );
  });

  it("detects repeated balanced management with trim into resistance and constructive final exit when repeated trim-readd management keeps trimming into nearby resistance and still finishes constructively", () => {
    const result = detectPatterns(
      createBasePatternInput({
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        hadSupportResistanceContextAvailable: true,
        reductionsNearResistanceCount: 2,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        closedToFlat: true,
        postExitCandleCount: 1,
        maxAdverseMovePctAfterExit: 0.03,
        maxFavorableMovePctAfterExit: 0.005,
        netMovePctAtEndOfPostExitWindow: -0.01,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "repeated_balanced_management_with_trim_into_resistance_and_constructive_final_exit",
    );
  });

  it("detects repeated balanced management with take profit into resistance and constructive final exit when repeated balanced management includes nearby-resistance profit taking and still finishes constructively", () => {
    const result = detectPatterns(
      createBasePatternInput({
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        hadSupportResistanceContextAvailable: true,
        reductionsNearResistanceCount: 1,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        closedToFlat: true,
        postExitCandleCount: 1,
        maxAdverseMovePctAfterExit: 0.03,
        maxFavorableMovePctAfterExit: 0.005,
        netMovePctAtEndOfPostExitWindow: -0.01,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "repeated_balanced_management_with_take_profit_into_resistance_and_constructive_final_exit",
    );
  });

  it("detects repeated balanced management with trim into resistance and premature final exit when repeated trim-readd management keeps trimming into nearby resistance but the final exit still comes before breakout continuation", () => {
    const result = detectPatterns(
      createBasePatternInput({
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        realizedReturnPct: 0.05,
        hadSupportResistanceContextAvailable: true,
        reductionsNearResistanceCount: 2,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        closedToFlat: true,
        postExitCandleCount: 1,
        maxFavorableMovePctAfterExit: 0.03,
        maxAdverseMovePctAfterExit: 0.005,
        netMovePctAtEndOfPostExitWindow: 0.01,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "repeated_balanced_management_with_trim_into_resistance_and_premature_final_exit",
    );
  });

  it("detects repeated balanced management with take profit into resistance and premature final exit when repeated balanced management includes nearby-resistance profit taking but the final exit still comes before breakout continuation", () => {
    const result = detectPatterns(
      createBasePatternInput({
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        realizedReturnPct: 0.05,
        hadSupportResistanceContextAvailable: true,
        reductionsNearResistanceCount: 1,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        closedToFlat: true,
        postExitCandleCount: 1,
        maxFavorableMovePctAfterExit: 0.03,
        maxAdverseMovePctAfterExit: 0.005,
        netMovePctAtEndOfPostExitWindow: 0.01,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "repeated_balanced_management_with_take_profit_into_resistance_and_premature_final_exit",
    );
  });

  it("detects repeated balanced management with exit into thin support before breakdown when repeated trim-readd management later exits into thinner support that fails", () => {
    const result = detectPatterns(
      createBasePatternInput({
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        closedToFlat: true,
        hadSupportResistanceContextAvailable: true,
        finalExitOccurredNearSupport: true,
        finalExitSupportLevelsBelowWithinClusterCount: 1,
        finalExitHasStackedSupportBelow: false,
        postExitCandleCount: 1,
        maxFavorableMovePctAfterExit: 0.005,
        maxAdverseMovePctAfterExit: 0.03,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "repeated_balanced_management_with_exit_into_thin_support_before_breakdown",
    );
  });

  it("detects repeated rescue attempts with balanced management and exit into stacked support and relief when early adversity still leads to repeated balanced management before a denser-support relief exit", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        peakOpenProfitPctOfBasis: 0.08,
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        closedToFlat: true,
        hadSupportResistanceContextAvailable: true,
        finalExitOccurredNearSupport: true,
        finalExitSupportLevelsBelowWithinClusterCount: 2,
        finalExitHasStackedSupportBelow: true,
        postExitCandleCount: 1,
        maxFavorableMovePctAfterExit: 0.03,
        maxAdverseMovePctAfterExit: 0.005,
        netMovePctAtEndOfPostExitWindow: 0.01,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "repeated_rescue_attempts_with_balanced_management_and_exit_into_stacked_support_and_relief",
    );
  });

  it("detects repeated rescue attempts with balanced management and trim into resistance and constructive final exit when early adversity still leads to repeated resistance-aware trimming before a constructive finish", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        peakOpenProfitPctOfBasis: 0.08,
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        hadSupportResistanceContextAvailable: true,
        reductionsNearResistanceCount: 2,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        closedToFlat: true,
        postExitCandleCount: 1,
        maxAdverseMovePctAfterExit: 0.03,
        maxFavorableMovePctAfterExit: 0.005,
        netMovePctAtEndOfPostExitWindow: -0.01,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "repeated_rescue_attempts_with_balanced_management_and_trim_into_resistance_and_constructive_final_exit",
    );
  });

  it("detects repeated rescue attempts with balanced management and take profit into resistance and constructive final exit when early adversity still leads to repeated balanced management with nearby-resistance profit taking before a constructive finish", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        peakOpenProfitPctOfBasis: 0.08,
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        hadSupportResistanceContextAvailable: true,
        reductionsNearResistanceCount: 1,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        closedToFlat: true,
        postExitCandleCount: 1,
        maxAdverseMovePctAfterExit: 0.03,
        maxFavorableMovePctAfterExit: 0.005,
        netMovePctAtEndOfPostExitWindow: -0.01,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "repeated_rescue_attempts_with_balanced_management_and_take_profit_into_resistance_and_constructive_final_exit",
    );
  });

  it("detects repeated rescue attempts with balanced management and trim into resistance and premature final exit when early adversity still leads to repeated resistance-aware trimming before a premature breakout miss", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.05,
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        hadSupportResistanceContextAvailable: true,
        reductionsNearResistanceCount: 2,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        closedToFlat: true,
        postExitCandleCount: 1,
        maxFavorableMovePctAfterExit: 0.03,
        maxAdverseMovePctAfterExit: 0.005,
        netMovePctAtEndOfPostExitWindow: 0.01,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "repeated_rescue_attempts_with_balanced_management_and_trim_into_resistance_and_premature_final_exit",
    );
  });

  it("detects repeated rescue attempts with balanced management and take profit into resistance and premature final exit when early adversity still leads to repeated balanced management with nearby-resistance profit taking before a premature breakout miss", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.05,
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        hadSupportResistanceContextAvailable: true,
        reductionsNearResistanceCount: 1,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        closedToFlat: true,
        postExitCandleCount: 1,
        maxFavorableMovePctAfterExit: 0.03,
        maxAdverseMovePctAfterExit: 0.005,
        netMovePctAtEndOfPostExitWindow: 0.01,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "repeated_rescue_attempts_with_balanced_management_and_take_profit_into_resistance_and_premature_final_exit",
    );
  });

  it("detects repeated rescue attempts with balanced management and exit into thin support before breakdown when early adversity still leads to repeated balanced management before a thin-support failure exit", () => {
    const result = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        peakOpenProfitPctOfBasis: 0.08,
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        closedToFlat: true,
        hadSupportResistanceContextAvailable: true,
        finalExitOccurredNearSupport: true,
        finalExitSupportLevelsBelowWithinClusterCount: 1,
        finalExitHasStackedSupportBelow: false,
        postExitCandleCount: 1,
        maxFavorableMovePctAfterExit: 0.005,
        maxAdverseMovePctAfterExit: 0.03,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );

    expect(result.detectedPatterns.map((pattern) => pattern.patternId)).toContain(
      "repeated_rescue_attempts_with_balanced_management_and_exit_into_thin_support_before_breakdown",
    );
  });
});
