import { describe, expect, it } from "vitest";
import {
  normalizePatternInputShape,
  type LegacyPatternInputShape,
  type PatternInput,
} from "../../pattern-input/types/pattern-input";
import { detectPatterns } from "../../pattern-detection/detect-patterns";
import type {
  DetectedPattern,
  PatternDetectionResult,
  PatternType,
  StructuralLevel,
} from "../../pattern-detection/types/pattern-detection-types";
import sampleDetectedPatterns from "../../../docs/layer2-pattern-detection/sample-detected-patterns.json";
import { normalizeDetectedPatterns } from "../normalize-detected-patterns";

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

const canonicalSampleDetectedPatterns: PatternDetectionResult = {
  detectedPatterns: sampleDetectedPatterns.detectedPatterns.map((pattern) => {
    const detectedPattern = pattern as unknown as DetectedPattern & {
      structuralLevel?: StructuralLevel;
    };

    return {
      patternId: pattern.patternId,
      patternName: pattern.patternName,
      family: pattern.family,
      patternType: pattern.patternType as PatternType,
      structuralLevel: (
        detectedPattern.structuralLevel ??
        (pattern.patternType === "atomic"
          ? "atomic"
          : "structural_composite")
      ) as StructuralLevel,
      evidence: pattern.evidence as Record<string, unknown>,
      thresholdsUsed: Object.fromEntries(
        Object.entries(pattern.thresholdsUsed).filter(
          (
            entry,
          ): entry is [string, number] => typeof entry[1] === "number",
        ),
      ),
    };
  }),
};

describe("normalizeDetectedPatterns", () => {
  it("demotes broader entry overlap and keeps a single entry-family primary anchor", () => {
    const detected = detectPatterns(createBasePatternInput());
    const normalized = normalizeDetectedPatterns(detected);

    const lateExtensionEntry = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "late_favorable_extension_entry_structure",
    );
    const disadvantagedEntry = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "disadvantaged_entry_structure",
    );
    const inefficientEntry = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "inefficient_entry_structure",
    );
    const recentRunUpEntry = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "entry_after_recent_run_up",
    );

    expect(lateExtensionEntry?.normalizedRole).toBe("primary_candidate");
    expect(disadvantagedEntry?.normalizedRole).toBe("supporting_candidate");
    expect(inefficientEntry?.normalizedRole).toBe("supporting_candidate");
    expect(recentRunUpEntry?.normalizedRole).toBe("supporting_candidate");
    expect(
      normalized.primaryPatterns.filter(
        (pattern) => pattern.family === "entry_quality",
      ),
    ).toHaveLength(1);
  });

  it("demotes broader constructive entry overlap when a richer constructive pullback entry storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const constructivePullback = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "constructive_pullback_entry_structure",
    );
    const advantagedEntry = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "advantaged_entry_structure",
    );
    const favorableUpside = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "entry_with_favorable_remaining_upside",
    );

    expect(constructivePullback?.normalizedRole).toBe("primary_candidate");
    expect(advantagedEntry?.normalizedRole).toBe("supporting_candidate");
    expect(favorableUpside?.normalizedRole).toBe("supporting_candidate");
    expect(
      advantagedEntry?.suppressionReasons.some((reason) =>
        reason.includes("constructive_pullback_entry_structure"),
      ),
    ).toBe(true);
  });

  it("demotes the broad constructive pullback subtype when a richer deep constructive pullback storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const deepConstructivePullback = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "deep_constructive_pullback_entry_structure",
    );
    const constructivePullback = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "constructive_pullback_entry_structure",
    );

    expect(deepConstructivePullback?.normalizedRole).toBe("primary_candidate");
    expect(constructivePullback?.normalizedRole).toBe("supporting_candidate");
    expect(
      constructivePullback?.suppressionReasons.some((reason) =>
        reason.includes("deep_constructive_pullback_entry_structure"),
      ),
    ).toBe(true);
  });

  it("demotes the broad overextended chase subtype when a richer breakout-chase storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const breakoutChase = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "breakout_chase_entry_structure",
    );
    const overextendedChase = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "overextended_chase_entry_structure",
    );

    expect(breakoutChase?.normalizedRole).toBe("primary_candidate");
    expect(overextendedChase?.normalizedRole).toBe("supporting_candidate");
    expect(
      overextendedChase?.suppressionReasons.some((reason) =>
        reason.includes("breakout_chase_entry_structure"),
      ),
    ).toBe(true);
  });

  it("demotes the broad measured continuation subtype when a richer breakout entry storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        sessionBucket: "midday",
        firstEntryOccurredDuringMarketOpenSession: false,
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

    const normalized = normalizeDetectedPatterns(detected);

    const breakoutEntry = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "breakout_entry_structure",
    );
    const measuredExtension = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "measured_favorable_extension_entry_structure",
    );

    expect(breakoutEntry?.normalizedRole).toBe("primary_candidate");
    expect(measuredExtension?.normalizedRole).toBe("supporting_candidate");
    expect(
      measuredExtension?.suppressionReasons.some((reason) =>
        reason.includes("breakout_entry_structure"),
      ),
    ).toBe(true);
  });

  it("demotes the broad chase subtype when a richer breakout-chase storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const breakoutChase = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "breakout_chase_entry_structure",
    );
    const overextendedChase = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "overextended_chase_entry_structure",
    );

    expect(breakoutChase?.normalizedRole).toBe("primary_candidate");
    expect(overextendedChase?.normalizedRole).toBe("supporting_candidate");
    expect(
      overextendedChase?.suppressionReasons.some((reason) =>
        reason.includes("breakout_chase_entry_structure"),
      ),
    ).toBe(true);
  });

  it("demotes broad weak-entry overlap when a named failed-breakout storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const failedBreakout = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "failed_breakout_entry_structure",
    );
    const inefficientEntry = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "inefficient_entry_structure",
    );
    expect(failedBreakout?.normalizedRole).toBe("primary_candidate");
    expect(inefficientEntry?.normalizedRole).toBe("supporting_candidate");
    expect(
      inefficientEntry?.suppressionReasons.some((reason) =>
        reason.includes("failed_breakout_entry_structure"),
      ),
    ).toBe(true);
  });

  it("demotes broad constructive pullback overlap when a named reclaim storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        sessionBucket: "midday",
        firstEntryOccurredDuringMarketOpenSession: false,
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

    const normalized = normalizeDetectedPatterns(detected);

    const reclaimEntry = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "reclaim_entry_structure",
    );
    const advantagedEntry = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "advantaged_entry_structure",
    );

    expect(reclaimEntry?.normalizedRole).toBe("primary_candidate");
    expect(advantagedEntry?.normalizedRole).toBe("supporting_candidate");
    expect(
      advantagedEntry?.suppressionReasons.some((reason) =>
        reason.includes("reclaim_entry_structure"),
      ),
    ).toBe(true);
  });

  it("demotes broad weak pullback overlap when a named failed reclaim storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        sessionBucket: "midday",
        firstEntryOccurredDuringMarketOpenSession: false,
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

    const normalized = normalizeDetectedPatterns(detected);

    const failedReclaim = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "failed_reclaim_entry_structure",
    );
    const inefficientEntry = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "inefficient_entry_structure",
    );

    expect(failedReclaim?.normalizedRole).toBe("primary_candidate");
    expect(inefficientEntry?.normalizedRole).toBe("supporting_candidate");
    expect(
      inefficientEntry?.suppressionReasons.some((reason) =>
        reason.includes("failed_reclaim_entry_structure"),
      ),
    ).toBe(true);
  });

  it("demotes reclaim overlap when a named mean reversion storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        sessionBucket: "midday",
        firstEntryOccurredDuringMarketOpenSession: false,
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

    const normalized = normalizeDetectedPatterns(detected);

    const meanReversion = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "mean_reversion_entry_structure",
    );
    const reclaimEntry = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "reclaim_entry_structure",
    );

    expect(meanReversion?.normalizedRole).toBe("primary_candidate");
    expect(reclaimEntry?.normalizedRole).toBe("supporting_candidate");
    expect(
      reclaimEntry?.suppressionReasons.some((reason) =>
        reason.includes("mean_reversion_entry_structure"),
      ),
    ).toBe(true);
  });

  it("demotes failed reclaim overlap when a named failed mean reversion storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        sessionBucket: "midday",
        firstEntryOccurredDuringMarketOpenSession: false,
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

    const normalized = normalizeDetectedPatterns(detected);

    const failedMeanReversion = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "failed_mean_reversion_entry_structure",
    );
    const failedReclaim = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "failed_reclaim_entry_structure",
    );

    expect(failedMeanReversion?.normalizedRole).toBe("primary_candidate");
    expect(failedReclaim?.normalizedRole).toBe("supporting_candidate");
    expect(
      failedReclaim?.suppressionReasons.some((reason) =>
        reason.includes("failed_mean_reversion_entry_structure"),
      ),
    ).toBe(true);
  });

  it("demotes broad breakout overlap when a named market-open breakout storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const marketOpenBreakout = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "market_open_breakout_entry_structure",
    );
    const breakoutEntry = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "breakout_entry_structure",
    );

    expect(marketOpenBreakout?.normalizedRole).toBe("primary_candidate");
    expect(breakoutEntry?.normalizedRole).toBe("supporting_candidate");
    expect(
      breakoutEntry?.suppressionReasons.some((reason) =>
        reason.includes("market_open_breakout_entry_structure"),
      ),
    ).toBe(true);
  });

  it("demotes the market-open breakout overlap when a richer opening-range breakout storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const openingRangeBreakout = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "opening_range_breakout_entry_structure",
    );
    const marketOpenBreakout = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "market_open_breakout_entry_structure",
    );

    expect(openingRangeBreakout?.normalizedRole).toBe("primary_candidate");
    expect(marketOpenBreakout?.normalizedRole).toBe("supporting_candidate");
    expect(
      marketOpenBreakout?.suppressionReasons.some((reason) =>
        reason.includes("opening_range_breakout_entry_structure"),
      ),
    ).toBe(true);
  });

  it("demotes the market-open breakout-chase overlap when a richer opening-range breakout-chase storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const openingRangeBreakoutChase = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "opening_range_breakout_chase_entry_structure",
    );
    const marketOpenBreakoutChase = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "market_open_breakout_chase_entry_structure",
    );

    expect(openingRangeBreakoutChase?.normalizedRole).toBe("primary_candidate");
    expect(marketOpenBreakoutChase?.normalizedRole).toBe("supporting_candidate");
    expect(
      marketOpenBreakoutChase?.suppressionReasons.some((reason) =>
        reason.includes("opening_range_breakout_chase_entry_structure"),
      ),
    ).toBe(true);
  });

  it("demotes the failed market-open breakout overlap when a richer failed opening-range breakout storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const failedOpeningRangeBreakout = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "failed_opening_range_breakout_entry_structure",
    );
    const failedMarketOpenBreakout = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "failed_market_open_breakout_entry_structure",
    );

    expect(failedOpeningRangeBreakout?.normalizedRole).toBe("primary_candidate");
    expect(failedMarketOpenBreakout?.normalizedRole).toBe("supporting_candidate");
    expect(
      failedMarketOpenBreakout?.suppressionReasons.some((reason) =>
        reason.includes("failed_opening_range_breakout_entry_structure"),
      ),
    ).toBe(true);
  });

  it("demotes broad breakout-chase overlap when a named market-open breakout chase storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const marketOpenBreakoutChase = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "market_open_breakout_chase_entry_structure",
    );
    const breakoutChase = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "breakout_chase_entry_structure",
    );

    expect(marketOpenBreakoutChase?.normalizedRole).toBe("primary_candidate");
    expect(breakoutChase?.normalizedRole).toBe("supporting_candidate");
    expect(
      breakoutChase?.suppressionReasons.some((reason) =>
        reason.includes("market_open_breakout_chase_entry_structure"),
      ),
    ).toBe(true);
  });

  it("demotes broad reclaim overlap when a named market-open reclaim storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const marketOpenReclaim = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "market_open_reclaim_entry_structure",
    );
    const reclaimEntry = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "reclaim_entry_structure",
    );

    expect(marketOpenReclaim?.normalizedRole).toBe("primary_candidate");
    expect(reclaimEntry?.normalizedRole).toBe("supporting_candidate");
    expect(
      reclaimEntry?.suppressionReasons.some((reason) =>
        reason.includes("market_open_reclaim_entry_structure"),
      ),
    ).toBe(true);
  });

  it("demotes broad failed reclaim overlap when a named failed market-open reclaim storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const failedMarketOpenReclaim = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "failed_market_open_reclaim_entry_structure",
    );
    const failedReclaim = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "failed_reclaim_entry_structure",
    );

    expect(failedMarketOpenReclaim?.normalizedRole).toBe("primary_candidate");
    expect(failedReclaim?.normalizedRole).toBe("supporting_candidate");
    expect(
      failedReclaim?.suppressionReasons.some((reason) =>
        reason.includes("failed_market_open_reclaim_entry_structure"),
      ),
    ).toBe(true);
  });

  it("demotes the market-open reclaim overlap when a richer opening-range reclaim storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const openingRangeReclaim = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "opening_range_reclaim_entry_structure",
    );
    const marketOpenReclaim = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "market_open_reclaim_entry_structure",
    );

    expect(openingRangeReclaim?.normalizedRole).toBe("primary_candidate");
    expect(marketOpenReclaim?.normalizedRole).toBe("supporting_candidate");
    expect(
      marketOpenReclaim?.suppressionReasons.some((reason) =>
        reason.includes("opening_range_reclaim_entry_structure"),
      ),
    ).toBe(true);
  });

  it("demotes the failed market-open reclaim overlap when a richer failed opening-range reclaim storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const failedOpeningRangeReclaim = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "failed_opening_range_reclaim_entry_structure",
    );
    const failedMarketOpenReclaim = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "failed_market_open_reclaim_entry_structure",
    );

    expect(failedOpeningRangeReclaim?.normalizedRole).toBe("primary_candidate");
    expect(failedMarketOpenReclaim?.normalizedRole).toBe("supporting_candidate");
    expect(
      failedMarketOpenReclaim?.suppressionReasons.some((reason) =>
        reason.includes("failed_opening_range_reclaim_entry_structure"),
      ),
    ).toBe(true);
  });

  it("demotes weaker overlap when aggressive add management failure is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        totalPositionDecreaseCount: 0,
        hadMultipleDecreases: false,
        partialExitCount: 0,
        hadPartialExit: false,
        maxAdverseMoveAfterPartialExitPct: null,
        addCountAfterInitialEntry: 2,
        addAbovePreviousAverageEntryCount: 2,
        addBelowPreviousAverageEntryCount: 0,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        peakOpenProfitPctOfBasis: 0.08,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    expect(
      normalized.primaryPatterns.map((pattern) => pattern.patternId),
    ).toContain("aggressive_adding_with_failed_profit_protection");

    const oneSidedAggressive = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "one_sided_aggressive_building",
    );
    const peakProfitGiveback = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "peak_profit_giveback_structure",
    );

    expect(oneSidedAggressive?.normalizedRole).toBe("supporting_candidate");
    expect(peakProfitGiveback?.normalizedRole).toBe("supporting_candidate");
    expect(
      oneSidedAggressive?.suppressionReasons.some((reason) =>
        reason.includes("aggressive_adding_with_failed_profit_protection"),
      ),
    ).toBe(true);
  });

  it("demotes broad weakness-add overlap when a named revenge-adding storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const revengeAdding = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "revenge_adding_after_weakness",
    );
    const addIntoWeakness = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "add_into_weakness",
    );

    expect(revengeAdding?.normalizedRole).toBe("primary_candidate");
    expect(addIntoWeakness?.normalizedRole).toBe("supporting_candidate");
    expect(
      addIntoWeakness?.suppressionReasons.some((reason) =>
        reason.includes("revenge_adding_after_weakness"),
      ),
    ).toBe(true);
  });

  it("demotes the broader aggressive add-failure pattern when a revenge-add failure storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const revengeAddFailure = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "revenge_adding_with_failed_profit_protection",
    );
    const aggressiveAddFailure = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "aggressive_adding_with_failed_profit_protection",
    );

    expect(revengeAddFailure?.normalizedRole).toBe("primary_candidate");
    expect(aggressiveAddFailure?.normalizedRole).toBe("supporting_candidate");
    expect(
      aggressiveAddFailure?.suppressionReasons.some((reason) =>
        reason.includes("revenge_adding_with_failed_profit_protection"),
      ),
    ).toBe(true);
  });

  it("demotes broader balanced management overlap when a richer profit-protection scaling storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        maxGivebackFromPeakOpenProfitPct: 0.2,
        peakOpenProfitPctOfBasis: 0.06,
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 1,
        addAbovePreviousAverageEntryCount: 0,
        addBelowPreviousAverageEntryCount: 0,
        averageAddPriceVsPreviousAverageEntryPct: null,
        averageAddPricePositionInRecentRangePct: null,
        hadPartialExit: false,
        partialExitCount: 0,
        hadReaddAfterReduction: false,
        readdAfterReductionCount: 0,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const scalingPrimaryIds = normalized.primaryPatterns
      .filter((pattern) => pattern.family === "scaling_quality")
      .map((pattern) => pattern.patternId);

    const balancedPositionManagement = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "balanced_position_management",
    );
    const balancedManagementStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "balanced_management_with_constructive_exit",
    );
    const profitProtectionPresent = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "profit_protection_present",
    );
    const balancedScaling = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "balanced_scaling_with_profit_protection",
    );

    expect(
      scalingPrimaryIds.includes("balanced_management_with_constructive_exit") ||
        scalingPrimaryIds.includes("balanced_scaling_with_profit_protection"),
    ).toBe(true);
    expect(balancedPositionManagement?.normalizedRole).toBe(
      "supporting_candidate",
    );
    expect(profitProtectionPresent?.normalizedRole).toBe(
      "supporting_candidate",
    );
    if (balancedScaling) {
      expect(["primary_candidate", "supporting_candidate"]).toContain(
        balancedScaling.normalizedRole,
      );
    }
    if (balancedManagementStory) {
      expect(["primary_candidate", "supporting_candidate"]).toContain(
        balancedManagementStory.normalizedRole,
      );
    }
  });

  it("demotes broader balanced-management overlap when a broad premature balanced-management storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 1,
        realizedReturnPct: 0.04,
        addAbovePreviousAverageEntryCount: 0,
        addBelowPreviousAverageEntryCount: 0,
        averageAddPriceVsPreviousAverageEntryPct: null,
        averageAddPricePositionInRecentRangePct: null,
        hadPartialExit: false,
        partialExitCount: 0,
        reductionAbovePreviousAverageEntryCount: 0,
        reductionBelowPreviousAverageEntryCount: 0,
        averageReductionPriceVsPreviousAverageEntryPct: null,
        averageReductionPricePositionInRecentRangePct: null,
        reductionsNearRecentHighCount: 0,
        reductionsNearRecentLowCount: 0,
        hadReaddAfterReduction: false,
        readdAfterReductionCount: 0,
        maxGivebackFromPeakOpenProfitPct: 0.2,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const balancedPremature = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "balanced_management_with_premature_final_exit",
    );
    const prematureExit = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "premature_final_exit_after_constructive_management",
    );
    const balancedPositionManagement = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "balanced_position_management",
    );

    expect(balancedPremature?.normalizedRole).toBe("primary_candidate");
    expect(prematureExit?.normalizedRole).toBe("supporting_candidate");
    expect(balancedPositionManagement?.normalizedRole).toBe(
      "supporting_candidate",
    );
  });

  it("keeps only one scaling-quality primary anchor when multiple primary candidates coexist", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        maxGivebackFromPeakOpenProfitPct: 0.2,
        peakOpenProfitPctOfBasis: 0.06,
        addCountAfterInitialEntry: 1,
        closedToFlat: false,
        postExitCandleCount: 0,
        maxAdverseMovePctAfterExit: null,
        maxFavorableMovePctAfterExit: null,
        netMovePctAtEndOfPostExitWindow: null,
        addAbovePreviousAverageEntryCount: 0,
        addBelowPreviousAverageEntryCount: 0,
        averageAddPriceVsPreviousAverageEntryPct: null,
        averageAddPricePositionInRecentRangePct: null,
        hadPartialExit: false,
        partialExitCount: 0,
        hadReaddAfterReduction: false,
        readdAfterReductionCount: 0,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const scalingPrimaryIds = normalized.primaryPatterns
      .filter((pattern) => pattern.family === "scaling_quality")
      .map((pattern) => pattern.patternId);

    const structuredPositionBuilding = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "structured_position_building",
    );

    expect(scalingPrimaryIds).toEqual(["balanced_scaling_with_profit_protection"]);
    expect(structuredPositionBuilding?.normalizedRole).toBe(
      "supporting_candidate",
    );
    expect(
      structuredPositionBuilding?.suppressionReasons.some((reason) =>
        reason.includes("balanced_position_management"),
      ),
    ).toBe(true);
  });

  it("demotes broad overlap when a balanced-management missed-continuation storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 1,
        realizedReturnPct: 0.04,
        addAbovePreviousAverageEntryCount: 0,
        addBelowPreviousAverageEntryCount: 0,
        averageAddPriceVsPreviousAverageEntryPct: null,
        averageAddPricePositionInRecentRangePct: null,
        hadPartialExit: false,
        partialExitCount: 0,
        reductionAbovePreviousAverageEntryCount: 0,
        reductionBelowPreviousAverageEntryCount: 0,
        averageReductionPriceVsPreviousAverageEntryPct: null,
        averageReductionPricePositionInRecentRangePct: null,
        reductionsNearRecentHighCount: 0,
        reductionsNearRecentLowCount: 0,
        hadReaddAfterReduction: false,
        readdAfterReductionCount: 0,
        maxGivebackFromPeakOpenProfitPct: 0.4,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const balancedMissed = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "balanced_management_with_missed_final_continuation",
    );
    const missedContinuation = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "missed_post_exit_continuation",
    );
    const balancedPositionManagement = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "balanced_position_management",
    );

    expect(balancedMissed?.normalizedRole).toBe("primary_candidate");
    expect(missedContinuation?.normalizedRole).toBe("supporting_candidate");
    expect(balancedPositionManagement?.normalizedRole).toBe(
      "supporting_candidate",
    );
  });

  it("demotes the broad balanced-management missed-continuation summary when the stricter premature variant is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 1,
        realizedReturnPct: 0.04,
        addAbovePreviousAverageEntryCount: 0,
        addBelowPreviousAverageEntryCount: 0,
        averageAddPriceVsPreviousAverageEntryPct: null,
        averageAddPricePositionInRecentRangePct: null,
        hadPartialExit: false,
        partialExitCount: 0,
        reductionAbovePreviousAverageEntryCount: 0,
        reductionBelowPreviousAverageEntryCount: 0,
        averageReductionPriceVsPreviousAverageEntryPct: null,
        averageReductionPricePositionInRecentRangePct: null,
        reductionsNearRecentHighCount: 0,
        reductionsNearRecentLowCount: 0,
        hadReaddAfterReduction: false,
        readdAfterReductionCount: 0,
        maxGivebackFromPeakOpenProfitPct: 0.2,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const balancedPremature = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "balanced_management_with_premature_final_exit",
    );
    const balancedMissed = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "balanced_management_with_missed_final_continuation",
    );

    expect(balancedPremature?.normalizedRole).toBe("primary_candidate");
    expect(balancedMissed?.normalizedRole).toBe("supporting_candidate");
    expect(
      balancedMissed?.suppressionReasons.some((reason) =>
        reason.includes("balanced_management_with_premature_final_exit"),
      ),
    ).toBe(true);
  });

  it("demotes the broad recovery-aware missed-continuation summary when the stricter recovery premature variant is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.04,
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 1,
        addAbovePreviousAverageEntryCount: 0,
        addBelowPreviousAverageEntryCount: 0,
        averageAddPriceVsPreviousAverageEntryPct: null,
        averageAddPricePositionInRecentRangePct: null,
        hadPartialExit: false,
        partialExitCount: 0,
        reductionAbovePreviousAverageEntryCount: 0,
        reductionBelowPreviousAverageEntryCount: 0,
        averageReductionPriceVsPreviousAverageEntryPct: null,
        averageReductionPricePositionInRecentRangePct: null,
        reductionsNearRecentHighCount: 0,
        reductionsNearRecentLowCount: 0,
        hadReaddAfterReduction: false,
        readdAfterReductionCount: 0,
        maxGivebackFromPeakOpenProfitPct: 0.2,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryPremature = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_balanced_management_and_premature_final_exit",
    );
    const recoveryMissed = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_balanced_management_and_missed_final_continuation",
    );

    expect(recoveryPremature?.normalizedRole).toBe("primary_candidate");
    expect(recoveryMissed?.normalizedRole).toBe("supporting_candidate");
    expect(
      recoveryMissed?.suppressionReasons.some((reason) =>
        reason.includes(
          "recovery_with_balanced_management_and_premature_final_exit",
        ),
      ),
    ).toBe(true);
  });

  it("demotes the broad timely-risk-response and defensive-exit ingredients when a timely defensive-save storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const combinedStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "timely_risk_response_with_defensive_final_exit_after_deterioration",
    );
    const timelyRiskResponse = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "timely_risk_response_after_peak_profit",
    );
    const defensiveExit = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "defensive_exit_after_deterioration",
    );

    expect(combinedStory?.normalizedRole).toMatch(
      /primary_candidate|supporting_candidate/,
    );
    expect(timelyRiskResponse?.normalizedRole).toBe("supporting_candidate");
    expect(defensiveExit?.normalizedRole).toBe("supporting_candidate");
    expect(
      defensiveExit?.suppressionReasons.some((reason) =>
        reason.includes(
          "timely_risk_response_with_defensive_final_exit_after_deterioration",
        ),
      ),
    ).toBe(true);
  });

  it("demotes the one-cycle timely-protection defensive storyline when the recovery-aware variant is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 0,
        totalPositionDecreaseCount: 0,
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

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_timely_risk_response_and_defensive_final_exit_after_deterioration",
    );
    const oneCycleStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "timely_risk_response_with_defensive_final_exit_after_deterioration",
    );

    expect(recoveryStory?.normalizedRole).toBe("primary_candidate");
    expect(oneCycleStory?.normalizedRole).toBe("supporting_candidate");
    expect(
      oneCycleStory?.suppressionReasons.some((reason) =>
        reason.includes(
          "recovery_with_timely_risk_response_and_defensive_final_exit_after_deterioration",
        ),
      ),
    ).toBe(true);
  });

  it("demotes broader missed-continuation and fearful-exit overlap when balanced management with fearful final exit is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 1,
        maxGivebackFromPeakOpenProfitPct: 0.9,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.2,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const combinedStory = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "balanced_management_with_fearful_final_exit",
    );
    const fearfulExit = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "fearful_exit_after_weakening",
    );
    const missedContinuation = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "balanced_management_with_missed_final_continuation",
    );

    expect(combinedStory?.normalizedRole).toMatch(
      /primary_candidate|supporting_candidate/,
    );
    expect(fearfulExit?.normalizedRole).toBe("supporting_candidate");
    expect(missedContinuation?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes the one-cycle balanced fearful storyline when the recovery-aware variant is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 1,
        maxGivebackFromPeakOpenProfitPct: 0.9,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.2,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_balanced_management_and_fearful_final_exit",
    );
    const oneCycleStory = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "balanced_management_with_fearful_final_exit",
    );

    expect(recoveryStory?.normalizedRole).toBe("primary_candidate");
    expect(oneCycleStory?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes broader constructive recovery overlap when stabilized recovery management is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const stabilizedRecovery = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_after_early_adversity_with_stabilized_management",
    );
    const constructiveRecovery = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "constructive_recovery_after_early_adversity",
    );
    const timelyProtectedResponse = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "timely_risk_response_with_profit_protection",
    );

    expect(stabilizedRecovery?.normalizedRole).toMatch(
      /primary_candidate|supporting_candidate/,
    );
    expect(constructiveRecovery?.normalizedRole).toBe("supporting_candidate");
    expect(timelyProtectedResponse?.normalizedRole).toBe(
      "supporting_candidate",
    );
  });

  it("demotes broader constructive exit and recovery overlap when a richer recovery-aware constructive-exit storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        addCountAfterInitialEntry: 0,
        addAbovePreviousAverageEntryCount: 0,
        addBelowPreviousAverageEntryCount: 0,
        averageAddPriceVsPreviousAverageEntryPct: null,
        averageAddPricePositionInRecentRangePct: null,
        reductionsNearRecentHighCount: 0,
        maxGivebackFromPeakOpenProfitPct: 0.2,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    expect(
      normalized.primaryPatterns.map((pattern) => pattern.patternId),
    ).toContain(
      "recovery_with_timely_profit_protection_and_constructive_final_exit",
    );

    const disciplinedExit = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "disciplined_defensive_exit",
    );
    const reliefExit = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "exit_avoided_adverse_followthrough",
    );
    const stabilizedRecovery = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "stabilized_recovery_with_constructive_final_exit",
    );

    expect(disciplinedExit?.normalizedRole).toBe("supporting_candidate");
    expect(reliefExit?.normalizedRole).toBe("supporting_candidate");
    expect(stabilizedRecovery?.normalizedRole).toBe("supporting_candidate");
    expect(
      reliefExit?.suppressionReasons.some((reason) =>
        reason.includes(
          "recovery_with_timely_profit_protection_and_constructive_final_exit",
        ),
      ) ||
      stabilizedRecovery?.suppressionReasons.some((reason) =>
        reason.includes(
          "recovery_with_timely_profit_protection_and_constructive_final_exit",
        ),
      ),
    ).toBe(true);
  });

  it("demotes broader premature-exit and recovery overlap when a richer recovery-aware timely-protection premature storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    expect(
      normalized.primaryPatterns.map((pattern) => pattern.patternId),
    ).toContain("recovery_with_timely_profit_protection_and_premature_final_exit");

    const prematureExit = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "premature_final_exit_after_constructive_management",
    );
    const missedContinuation = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "missed_post_exit_continuation",
    );
    const stabilizedRecovery = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "stabilized_recovery_with_premature_final_exit",
    );

    expect(prematureExit?.normalizedRole).toBe("supporting_candidate");
    expect(missedContinuation?.normalizedRole).toBe("supporting_candidate");
    expect(stabilizedRecovery?.normalizedRole).toBe("supporting_candidate");
    expect(
      stabilizedRecovery?.suppressionReasons.some((reason) =>
        reason.includes(
          "recovery_with_timely_profit_protection_and_premature_final_exit",
        ),
      ),
    ).toBe(true);
  });

  it("demotes broader stop-like and recovery overlap when a recovery-aware timely-response stop-like breakdown storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    expect(
      normalized.primaryPatterns.map((pattern) => pattern.patternId),
    ).toContain(
      "recovery_with_timely_risk_response_and_stop_like_forced_exit_after_breakdown",
    );

    const timelyStopLike = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "timely_risk_response_with_stop_like_forced_exit_after_breakdown",
    );
    const stabilizedStopLike = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "stabilized_recovery_with_stop_like_forced_exit_after_breakdown",
    );
    const failedProtectionRecovery = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_after_early_adversity_with_failed_protection",
    );

    expect(timelyStopLike?.normalizedRole).toBe("supporting_candidate");
    expect(stabilizedStopLike?.normalizedRole).toBe("supporting_candidate");
    expect(failedProtectionRecovery?.normalizedRole).toBe(
      "supporting_candidate",
    );
  });

  it("demotes broader stop-like and recovery overlap when a recovery-aware timely-response stop-like rebound storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    expect(
      normalized.primaryPatterns.map((pattern) => pattern.patternId),
    ).toContain(
      "recovery_with_timely_risk_response_and_stop_like_forced_exit_before_rebound",
    );

    const timelyStopLike = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "timely_risk_response_with_stop_like_forced_exit_before_rebound",
    );
    const stabilizedStopLike = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "stabilized_recovery_with_stop_like_forced_exit_before_rebound",
    );
    const failedProtectionRecovery = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_after_early_adversity_with_failed_protection",
    );

    expect(timelyStopLike?.normalizedRole).toBe("supporting_candidate");
    expect(stabilizedStopLike?.normalizedRole).toBe("supporting_candidate");
    expect(failedProtectionRecovery?.normalizedRole).toBe(
      "supporting_candidate",
    );
  });

  it("demotes broader repeated-cycle and exit overlap when repeated trim re-add with constructive final exit is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    expect(
      normalized.primaryPatterns.map((pattern) => pattern.patternId),
    ).toContain("repeated_balanced_management_with_constructive_final_exit");

    const repeatedBroadConstructive = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_balanced_management_with_constructive_final_exit",
    );
    const repeatedConstructiveExit = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "repeated_trim_readd_with_constructive_final_exit",
    );
    const repeatedConstructiveManagement = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_trim_readd_with_constructive_management",
    );
    const oneCycleConstructive = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "trim_readd_with_constructive_final_exit",
    );

    expect(repeatedBroadConstructive?.normalizedRole).toBe("primary_candidate");
    expect(repeatedConstructiveExit?.normalizedRole).toBe(
      "supporting_candidate",
    );
    expect(repeatedConstructiveManagement?.normalizedRole).toBe(
      "supporting_candidate",
    );
    expect(oneCycleConstructive?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes broader repeated-cycle and exit overlap when repeated trim re-add with fearful final exit is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    expect(
      normalized.primaryPatterns.map((pattern) => pattern.patternId),
    ).toContain("repeated_balanced_management_with_fearful_final_exit");

    const repeatedFearfulSummary = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "repeated_balanced_management_with_fearful_final_exit",
    );
    const repeatedUnstable = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "repeated_trim_readd_with_unstable_management",
    );
    const fearfulExit = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "fearful_exit_after_weakening",
    );
    const rawRepeatedFearful = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "repeated_trim_readd_with_fearful_final_exit",
    );

    expect(repeatedFearfulSummary?.normalizedRole).toBe("primary_candidate");
    expect(rawRepeatedFearful?.normalizedRole).toBe("supporting_candidate");
    expect(repeatedUnstable?.normalizedRole).toBe("supporting_candidate");
    expect(fearfulExit?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes broader repeated-cycle and exit overlap when repeated trim re-add with defensive final exit after deterioration is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    expect(
      normalized.primaryPatterns.map((pattern) => pattern.patternId),
    ).toContain(
      "repeated_balanced_management_with_defensive_final_exit_after_deterioration",
    );

    const repeatedDefensiveSummary = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_balanced_management_with_defensive_final_exit_after_deterioration",
    );
    const repeatedUnstable = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "repeated_trim_readd_with_unstable_management",
    );
    const defensiveExit = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "defensive_exit_after_deterioration",
    );
    const rawRepeatedDefensive = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    );

    expect(repeatedDefensiveSummary?.normalizedRole).toBe("primary_candidate");
    expect(rawRepeatedDefensive?.normalizedRole).toBe("supporting_candidate");
    expect(repeatedUnstable?.normalizedRole).toBe("supporting_candidate");
    expect(defensiveExit?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes broader rescue and deterioration overlap when repeated rescue attempts with defensive final exit after deterioration is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    expect(
      normalized.primaryPatterns.map((pattern) => pattern.patternId),
    ).toContain(
      "repeated_rescue_attempts_with_balanced_management_and_defensive_final_exit_after_deterioration",
    );

    const repeatedRescueSummary = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_rescue_attempts_with_balanced_management_and_defensive_final_exit_after_deterioration",
    );
    const repeatedDefensive = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    );
    const renewedDeterioration = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_rescue_attempts_with_renewed_deterioration",
    );

    expect(repeatedRescueSummary?.normalizedRole).toBe("primary_candidate");
    expect(repeatedDefensive?.normalizedRole).toBe("supporting_candidate");
    expect(renewedDeterioration?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes weaker rescue-failure overlap when repeated rescue attempts with renewed deterioration is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const repeatedRescueDeterioration = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "repeated_rescue_attempts_with_renewed_deterioration",
    );
    const repeatedRescueDefensive = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_rescue_attempts_with_defensive_final_exit_after_deterioration",
    );
    const unstableManagement = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "repeated_trim_readd_with_unstable_management",
    );
    const failedRecovery = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_after_early_adversity_with_failed_protection",
    );

    expect(repeatedRescueDeterioration?.normalizedRole).toBe(
      "supporting_candidate",
    );
    expect(repeatedRescueDefensive?.normalizedRole).toMatch(
      /primary_candidate|supporting_candidate/,
    );
    expect(unstableManagement?.normalizedRole).toBe("supporting_candidate");
    expect(failedRecovery?.normalizedRole).toBe("supporting_candidate");
  });

  it("matches the canonical normalized output for the saved Layer 2 sample", () => {
    const normalized = normalizeDetectedPatterns(canonicalSampleDetectedPatterns);

    expect(normalized.primaryPatterns.map((pattern) => pattern.patternId)).toEqual([
      "advantaged_entry_structure",
      "moderate_capture_exit_structure",
      "multi_build_full_exit",
      "balanced_position_management",
    ]);

    expect(
      normalized.supportingPatterns.map((pattern) => pattern.patternId),
    ).toEqual([
      "efficient_entry_structure",
      "exit_with_meaningful_giveback",
      "structured_position_building",
      "entry_near_trade_low",
      "entry_with_favorable_remaining_upside",
      "high_mfe_trade",
    ]);

    expect(
      normalized.contextualPatterns.map((pattern) => pattern.patternId),
    ).toEqual([
      "low_range_entry",
      "scaled_into_position",
      "fully_closed_trade",
    ]);

    expect(normalized.primaryPatternsByFamily.entry_quality.patternId).toBe(
      "advantaged_entry_structure",
    );
    expect(normalized.primaryPatternsByFamily.exit_quality.patternId).toBe(
      "moderate_capture_exit_structure",
    );
    expect(normalized.primaryPatternsByFamily.position_structure.patternId).toBe(
      "multi_build_full_exit",
    );
    expect(normalized.primaryPatternsByFamily.scaling_quality.patternId).toBe(
      "balanced_position_management",
    );
    expect(normalized.topOverallAnchorPattern?.patternId).toBe(
      "advantaged_entry_structure",
    );
  });

  it("demotes broader repeated-cycle overlap when repeated balanced management with fearful final exit is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const repeatedFearful = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "repeated_balanced_management_with_fearful_final_exit",
    );
    const rawRepeatedFearful = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "repeated_trim_readd_with_fearful_final_exit",
    );
    const repeatedMissed = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "repeated_balanced_management_with_missed_final_continuation",
    );

    expect(repeatedFearful?.normalizedRole).toBe("primary_candidate");
    expect(rawRepeatedFearful?.normalizedRole).toBe("supporting_candidate");
    expect(repeatedMissed?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes the broad repeated fearful storyline when the recovery-aware repeated variant is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_rescue_attempts_with_balanced_management_and_fearful_final_exit",
    );
    const broadStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "repeated_balanced_management_with_fearful_final_exit",
    );

    expect(recoveryStory?.normalizedRole).toBe("primary_candidate");
    expect(broadStory?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes weaker risk-response ingredients when a richer delayed-risk sequence pattern is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 0,
        totalPositionDecreaseCount: 0,
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

    const normalized = normalizeDetectedPatterns(detected);

    const sequencePattern = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "readd_after_delayed_risk_response",
    );
    const delayedRiskPattern = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "delayed_risk_response_with_failed_profit_protection",
    );
    const readdFact = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "readd_after_reduction",
    );

    expect(sequencePattern?.normalizedRole).toBe("primary_candidate");
    expect(delayedRiskPattern?.normalizedRole).toBe("supporting_candidate");
    expect(readdFact?.normalizedRole).toBe("supporting_candidate");
    expect(
      delayedRiskPattern?.suppressionReasons.some((reason) =>
        reason.includes("readd_after_delayed_risk_response"),
      ),
    ).toBe(true);
  });

  it("demotes weaker constructive-management ingredients when a richer constructive storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 1,
        secondsFromPeakOpenProfitToWorstDrawdown: 180,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        addAbovePreviousAverageEntryCount: 0,
        addBelowPreviousAverageEntryCount: 0,
        averageAddPriceVsPreviousAverageEntryPct: null,
        averageAddPricePositionInRecentRangePct: null,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        peakOpenProfitPctOfBasis: 0.08,
        hadPartialExit: false,
        partialExitCount: 0,
        hadReaddAfterReduction: false,
        readdAfterReductionCount: 0,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const balancedStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "balanced_management_with_constructive_exit",
    );
    const timelyStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "timely_profit_protection_with_constructive_final_exit",
    );
    const balancedScaling = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "balanced_scaling_with_profit_protection",
    );
    const constructiveReadd = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "constructive_readd_after_reduction",
    );
    const timelyProtected = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "timely_risk_response_with_profit_protection",
    );
    const timelyRisk = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "timely_risk_response_after_peak_profit",
    );

    expect(timelyStory?.normalizedRole).toBe("primary_candidate");
    expect(balancedStory?.normalizedRole).toBe("supporting_candidate");
    expect(balancedScaling?.normalizedRole).toBe("supporting_candidate");
    expect(constructiveReadd).toBeUndefined();
    expect(timelyProtected?.normalizedRole).toBe("supporting_candidate");
    expect(timelyRisk?.normalizedRole).toBe("supporting_candidate");
    expect(
      balancedScaling?.suppressionReasons.some((reason) =>
        reason.includes("balanced_management_with_constructive_exit") ||
        reason.includes("timely_profit_protection_with_constructive_final_exit"),
      ),
    ).toBe(true);
    expect(
      timelyRisk?.suppressionReasons.some((reason) =>
        reason.includes("timely_risk_response_with_profit_protection") ||
        reason.includes("timely_profit_protection_with_constructive_final_exit"),
      ),
    ).toBe(true);
  });

  it("demotes weaker constructive-management ingredients when a richer timely-protection constructive storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 1,
        secondsFromPeakOpenProfitToWorstDrawdown: 180,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        addCountAfterInitialEntry: 1,
        addAbovePreviousAverageEntryCount: 0,
        addBelowPreviousAverageEntryCount: 0,
        averageAddPriceVsPreviousAverageEntryPct: null,
        averageAddPricePositionInRecentRangePct: null,
        reductionsNearRecentHighCount: 0,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        peakOpenProfitPctOfBasis: 0.08,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const timelyStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "timely_profit_protection_with_constructive_final_exit",
    );
    const balancedStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "balanced_management_with_constructive_exit",
    );
    const timelyProtected = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "timely_risk_response_with_profit_protection",
    );

    expect(timelyStory?.normalizedRole).toBe("primary_candidate");
    expect(balancedStory?.normalizedRole).toBe("supporting_candidate");
    expect(timelyProtected?.normalizedRole).toBe("supporting_candidate");
    expect(
      balancedStory?.suppressionReasons.some((reason) =>
        reason.includes("timely_profit_protection_with_constructive_final_exit"),
      ),
    ).toBe(true);
  });

  it("demotes broader balanced-management and recovery ingredients when a recovery-aware balanced-management constructive storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_balanced_management_and_constructive_final_exit",
    );
    const balancedStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "balanced_management_with_constructive_exit",
    );
    const constructiveRecovery = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "constructive_recovery_after_early_adversity",
    );

    expect(recoveryStory?.normalizedRole).toBe("primary_candidate");
    expect(balancedStory?.normalizedRole).toBe("supporting_candidate");
    expect(constructiveRecovery?.normalizedRole).toBe("supporting_candidate");
    expect(
      balancedStory?.suppressionReasons.some((reason) =>
        reason.includes(
          "recovery_with_balanced_management_and_constructive_final_exit",
        ),
      ),
    ).toBe(true);
  });

  it("demotes the recovery-aware balanced-management constructive summary when a richer recovery-aware timely-protection constructive storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.04,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 1,
        secondsFromPeakOpenProfitToWorstDrawdown: 180,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        reductionAbovePreviousAverageEntryCount: 0,
        reductionBelowPreviousAverageEntryCount: 0,
        averageReductionPriceVsPreviousAverageEntryPct: null,
        averageReductionPricePositionInRecentRangePct: null,
        reductionsNearRecentHighCount: 0,
        reductionsNearRecentLowCount: 0,
        reductionsWithRecentRunUpCount: 0,
        reductionsWithRecentDropCount: 0,
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

    const normalized = normalizeDetectedPatterns(detected);

    const timelyRecoveryStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_timely_profit_protection_and_constructive_final_exit",
    );
    const broadRecoveryStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_balanced_management_and_constructive_final_exit",
    );

    expect(timelyRecoveryStory?.normalizedRole).toBe("primary_candidate");
    expect(broadRecoveryStory?.normalizedRole).toBe("supporting_candidate");
    expect(
      broadRecoveryStory?.suppressionReasons.some((reason) =>
        reason.includes(
          "recovery_with_timely_profit_protection_and_constructive_final_exit",
        ),
      ),
    ).toBe(true);
  });

  it("demotes broader timely-protection and premature-exit overlap when a richer timely-protection premature storyline is present", () => {
    const detected = detectPatterns(
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
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const timelyPremature = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "timely_profit_protection_with_premature_final_exit",
    );
    const timelyProtected = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "timely_risk_response_with_profit_protection",
    );
    const prematureExit = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "premature_final_exit_after_constructive_management",
    );

    expect(timelyPremature?.normalizedRole).toBe("primary_candidate");
    expect(timelyProtected?.normalizedRole).toBe("supporting_candidate");
    expect(prematureExit?.normalizedRole).toBe("supporting_candidate");
    expect(
      prematureExit?.suppressionReasons.some((reason) =>
        reason.includes("timely_profit_protection_with_premature_final_exit"),
      ),
    ).toBe(true);
  });

  it("demotes broader recovery and premature-exit overlap when a recovery-aware timely-protection premature storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        drawdownFromPeakOpenProfitPctOfBasis: 0.09,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        realizedReturnPct: 0.04,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryPremature = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_timely_profit_protection_and_premature_final_exit",
    );
    const timelyPremature = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "timely_profit_protection_with_premature_final_exit",
    );
    const stabilizedPremature = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "stabilized_recovery_with_premature_final_exit",
    );

    expect(recoveryPremature?.normalizedRole).toBe("primary_candidate");
    expect(timelyPremature?.normalizedRole).toBe("supporting_candidate");
    expect(stabilizedPremature?.normalizedRole).toBe("supporting_candidate");
    expect(
      stabilizedPremature?.suppressionReasons.some((reason) =>
        reason.includes(
          "recovery_with_timely_profit_protection_and_premature_final_exit",
        ),
      ),
    ).toBe(true);
  });

  it("demotes the broad balanced-management premature branch when a richer timely-protection premature storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 1,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.04,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const timelyPremature = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "timely_profit_protection_with_premature_final_exit",
    );
    const balancedPremature = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "balanced_management_with_premature_final_exit",
    );

    expect(timelyPremature?.normalizedRole).toBe("primary_candidate");
    expect(balancedPremature?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes the broad recovery-aware balanced-management premature branch when a richer recovery-aware timely-protection premature storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        drawdownFromPeakOpenProfitPctOfBasis: 0.09,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 1,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        realizedReturnPct: 0.04,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryPremature = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_timely_profit_protection_and_premature_final_exit",
    );
    const recoveryBalancedPremature = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_balanced_management_and_premature_final_exit",
    );

    expect(recoveryPremature?.normalizedRole).toBe("primary_candidate");
    expect(recoveryBalancedPremature?.normalizedRole).toBe(
      "supporting_candidate",
    );
  });

  it("demotes broader balanced-management overlap when a broad stop-like breakdown balanced-management storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 1,
        realizedReturnPct: 0.04,
        addAbovePreviousAverageEntryCount: 0,
        addBelowPreviousAverageEntryCount: 0,
        averageAddPriceVsPreviousAverageEntryPct: null,
        averageAddPricePositionInRecentRangePct: null,
        hadPartialExit: false,
        partialExitCount: 0,
        reductionAbovePreviousAverageEntryCount: 0,
        reductionBelowPreviousAverageEntryCount: 0,
        averageReductionPriceVsPreviousAverageEntryPct: null,
        averageReductionPricePositionInRecentRangePct: null,
        reductionsNearRecentHighCount: 0,
        reductionsNearRecentLowCount: 0,
        hadReaddAfterReduction: false,
        readdAfterReductionCount: 0,
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

    const normalized = normalizeDetectedPatterns(detected);

    const balancedStopLike = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "balanced_management_with_stop_like_forced_exit_after_breakdown",
    );
    const stopLike = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "stop_like_forced_exit_after_breakdown",
    );
    const balancedPositionManagement = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "balanced_position_management",
    );

    expect(balancedStopLike?.normalizedRole).toBe("primary_candidate");
    expect(stopLike?.normalizedRole).toBe("supporting_candidate");
    expect(balancedPositionManagement?.normalizedRole).toBe(
      "supporting_candidate",
    );
  });

  it("demotes the broad balanced-management stop-like breakdown branch when a richer timely-risk-response stop-like breakdown storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        secondsFromPeakOpenProfitToFirstReduction: 30,
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

    const normalized = normalizeDetectedPatterns(detected);

    const timelyStopLike = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "timely_risk_response_with_stop_like_forced_exit_after_breakdown",
    );
    const balancedStopLike = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "balanced_management_with_stop_like_forced_exit_after_breakdown",
    );

    expect(timelyStopLike?.normalizedRole).toBe("primary_candidate");
    expect(balancedStopLike?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes broader balanced-management overlap when a broad defensive-save balanced-management storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 1,
        realizedReturnPct: 0.04,
        addAbovePreviousAverageEntryCount: 0,
        addBelowPreviousAverageEntryCount: 0,
        averageAddPriceVsPreviousAverageEntryPct: null,
        averageAddPricePositionInRecentRangePct: null,
        hadPartialExit: false,
        partialExitCount: 0,
        reductionAbovePreviousAverageEntryCount: 0,
        reductionBelowPreviousAverageEntryCount: 0,
        averageReductionPriceVsPreviousAverageEntryPct: null,
        averageReductionPricePositionInRecentRangePct: null,
        reductionsNearRecentHighCount: 0,
        reductionsNearRecentLowCount: 0,
        hadReaddAfterReduction: false,
        readdAfterReductionCount: 0,
        maxGivebackFromPeakOpenProfitPct: 0.65,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        postExitCandleCount: 2,
        maxAdverseMovePctAfterExit: 0.03,
        maxFavorableMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const balancedDefensive = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "balanced_management_with_defensive_final_exit_after_deterioration",
    );
    const defensiveExit = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "defensive_exit_after_deterioration",
    );
    const balancedPositionManagement = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "balanced_position_management",
    );

    expect(balancedDefensive?.normalizedRole).toBe("primary_candidate");
    expect(defensiveExit?.normalizedRole).toBe("supporting_candidate");
    expect(balancedPositionManagement?.normalizedRole).toBe(
      "supporting_candidate",
    );
  });

  it("demotes the broad balanced-management defensive-save branch when a richer timely-risk-response defensive-save storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        secondsFromPeakOpenProfitToFirstReduction: 30,
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

    const normalized = normalizeDetectedPatterns(detected);

    const timelyDefensive = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "timely_risk_response_with_defensive_final_exit_after_deterioration",
    );
    const balancedDefensive = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "balanced_management_with_defensive_final_exit_after_deterioration",
    );

    expect(timelyDefensive?.normalizedRole).toBe("primary_candidate");
    expect(balancedDefensive?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes the broad recovery-aware balanced-management defensive-save branch when a richer recovery-aware timely-risk-response defensive-save storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        secondsFromPeakOpenProfitToFirstReduction: 30,
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

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryTimelyDefensive = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_timely_risk_response_and_defensive_final_exit_after_deterioration",
    );
    const recoveryBalancedDefensive = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_balanced_management_and_defensive_final_exit_after_deterioration",
    );

    expect(recoveryTimelyDefensive?.normalizedRole).toBe("primary_candidate");
    expect(recoveryBalancedDefensive?.normalizedRole).toBe(
      "supporting_candidate",
    );
  });

  it("demotes the broad recovery-aware balanced-management stop-like breakdown branch when a richer recovery-aware timely-risk-response stop-like breakdown storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        secondsFromPeakOpenProfitToFirstReduction: 30,
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

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryTimelyStopLike = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_timely_risk_response_and_stop_like_forced_exit_after_breakdown",
    );
    const recoveryBalancedStopLike = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_balanced_management_and_stop_like_forced_exit_after_breakdown",
    );

    expect(recoveryTimelyStopLike?.normalizedRole).toBe("primary_candidate");
    expect(recoveryBalancedStopLike?.normalizedRole).toBe(
      "supporting_candidate",
    );
  });

  it("demotes broader timely-response and stop-like breakdown overlap when a timely-response stop-like breakdown storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 1,
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

    const normalized = normalizeDetectedPatterns(detected);

    const timelyStopLike = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "timely_risk_response_with_stop_like_forced_exit_after_breakdown",
    );
    const timelyRisk = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "timely_risk_response_after_peak_profit",
    );
    const stopLike = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "stop_like_forced_exit_after_breakdown",
    );

    expect(timelyStopLike?.normalizedRole).toBe("primary_candidate");
    expect(timelyRisk?.normalizedRole).toBe("supporting_candidate");
    expect(stopLike?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes broader timely-response and stop-like rebound overlap when a timely-response stop-like rebound storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 1,
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

    const normalized = normalizeDetectedPatterns(detected);

    const timelyStopLike = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "timely_risk_response_with_stop_like_forced_exit_before_rebound",
    );
    const timelyRisk = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "timely_risk_response_after_peak_profit",
    );
    const stopLike = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "stop_like_forced_exit_before_rebound",
    );

    expect(timelyStopLike?.normalizedRole).toBe("primary_candidate");
    expect(timelyRisk?.normalizedRole).toBe("supporting_candidate");
    expect(stopLike?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes broader recovery and stop-like breakdown overlap when a recovery-aware timely-response stop-like breakdown storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.02,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 1,
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

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryTimelyStopLike = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_timely_risk_response_and_stop_like_forced_exit_after_breakdown",
    );
    const timelyStopLike = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "timely_risk_response_with_stop_like_forced_exit_after_breakdown",
    );
    const stabilizedStopLike = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "stabilized_recovery_with_stop_like_forced_exit_after_breakdown",
    );

    expect(recoveryTimelyStopLike?.normalizedRole).toBe("primary_candidate");
    expect(timelyStopLike?.normalizedRole).toBe("supporting_candidate");
    expect(stabilizedStopLike?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes broader recovery and stop-like rebound overlap when a recovery-aware timely-response stop-like rebound storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.02,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 1,
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

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryTimelyStopLike = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_timely_risk_response_and_stop_like_forced_exit_before_rebound",
    );
    const timelyStopLike = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "timely_risk_response_with_stop_like_forced_exit_before_rebound",
    );
    const stabilizedStopLike = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "stabilized_recovery_with_stop_like_forced_exit_before_rebound",
    );

    expect(recoveryTimelyStopLike?.normalizedRole).toBe("primary_candidate");
    expect(timelyStopLike?.normalizedRole).toBe("supporting_candidate");
    expect(stabilizedStopLike?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes broader positive entry ingredients when a disciplined favorable-extension entry storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const disciplinedExtension = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "disciplined_favorable_extension_entry_structure",
    );
    const advantagedEntry = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "advantaged_entry_structure",
    );
    const efficientEntry = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "efficient_entry_structure",
    );

    expect(disciplinedExtension?.normalizedRole).toBe("primary_candidate");
    expect(advantagedEntry?.normalizedRole).toBe("supporting_candidate");
    expect(efficientEntry?.normalizedRole).toBe("supporting_candidate");
    expect(
      advantagedEntry?.suppressionReasons.some((reason) =>
        reason.includes("disciplined_favorable_extension_entry_structure"),
      ),
    ).toBe(true);
  });

  it("demotes the broad measured continuation subtype when a richer breakout-entry storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const breakoutEntry = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "breakout_entry_structure",
    );
    const measuredExtension = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "measured_favorable_extension_entry_structure",
    );

    expect(breakoutEntry?.normalizedRole).toBe("primary_candidate");
    expect(measuredExtension?.normalizedRole).toBe("supporting_candidate");
    expect(
      measuredExtension?.suppressionReasons.some((reason) =>
        reason.includes("breakout_entry_structure"),
      ),
    ).toBe(true);
  });

  it("demotes the broad weak pullback subtype when a richer deep weak pullback storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const deepWeakPullback = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "deep_weak_pullback_entry_structure",
    );
    const weakPullback = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "weak_pullback_entry_structure",
    );

    expect(deepWeakPullback?.normalizedRole).toBe("primary_candidate");
    expect(weakPullback?.normalizedRole).toBe("supporting_candidate");
    expect(
      weakPullback?.suppressionReasons.some((reason) =>
        reason.includes("deep_weak_pullback_entry_structure"),
      ),
    ).toBe(true);
  });

  it("demotes weaker underutilized and constructive-exit ingredients when an underutilized winner constructive storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const underutilizedWinner = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "underutilized_winner_with_constructive_exit",
    );
    const underutilized = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "underutilized_position_building",
    );
    const constructiveExit = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "exit_avoided_adverse_followthrough",
    );

    expect(underutilizedWinner?.normalizedRole).toBe("primary_candidate");
    expect(underutilized?.normalizedRole).toBe("supporting_candidate");
    expect(constructiveExit?.normalizedRole).toBe("supporting_candidate");
    expect(
      underutilized?.suppressionReasons.some((reason) =>
        reason.includes("underutilized_winner_with_constructive_exit"),
      ),
    ).toBe(true);
  });

  it("demotes weaker recovery and underutilized-winner ingredients when the recovery-aware underutilized winner storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryUnderutilizedWinner = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_to_underutilized_winner_with_constructive_exit",
    );
    const underutilizedWinner = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "underutilized_winner_with_constructive_exit",
    );
    const recoveryStory = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "constructive_recovery_after_early_adversity",
    );

    expect(recoveryUnderutilizedWinner?.normalizedRole).toBe(
      "primary_candidate",
    );
    expect(underutilizedWinner?.normalizedRole).toBe("supporting_candidate");
    expect(recoveryStory?.normalizedRole).toBe("supporting_candidate");
    expect(
      underutilizedWinner?.suppressionReasons.some((reason) =>
        reason.includes(
          "recovery_to_underutilized_winner_with_constructive_exit",
        ),
      ),
    ).toBe(true);
  });

  it("demotes weaker underutilized-winner and timely-protection ingredients when a richer underutilized timely-protection storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const timelyUnderutilizedWinner = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "underutilized_winner_with_timely_profit_protection_and_constructive_final_exit",
    );
    const underutilizedWinner = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "underutilized_winner_with_constructive_exit",
    );
    const timelyStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "timely_profit_protection_with_constructive_final_exit",
    );

    expect(timelyUnderutilizedWinner?.normalizedRole).toBe(
      "primary_candidate",
    );
    expect(underutilizedWinner?.normalizedRole).toBe("supporting_candidate");
    expect(timelyStory?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes weaker recovery-aware underutilized and timely-protection ingredients when a richer recovery-aware underutilized timely storyline is present", () => {
    const detected = detectPatterns(
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
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 1,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryTimelyUnderutilizedWinner =
      normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "recovery_to_underutilized_winner_with_timely_profit_protection_and_constructive_final_exit",
      );
    const recoveryUnderutilizedWinner = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_to_underutilized_winner_with_constructive_exit",
    );
    const recoveryTimelyStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_timely_profit_protection_and_constructive_final_exit",
    );

    expect(recoveryTimelyUnderutilizedWinner?.normalizedRole).toBe(
      "primary_candidate",
    );
    expect(recoveryUnderutilizedWinner?.normalizedRole).toBe(
      "supporting_candidate",
    );
    expect(recoveryTimelyStory?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes broader underutilized and premature-exit overlap when an underutilized premature storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const underutilizedPremature = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "underutilized_winner_with_premature_final_exit",
    );
    const underutilized = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "underutilized_position_building",
    );
    const prematureExit = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "premature_final_exit_after_constructive_management",
    );

    expect(underutilizedPremature?.normalizedRole).toBe("primary_candidate");
    expect(underutilized?.normalizedRole).toBe("supporting_candidate");
    expect(
      prematureExit === undefined ||
        prematureExit.normalizedRole === "supporting_candidate",
    ).toBe(true);
  });

  it("demotes weaker underutilized and missed-continuation ingredients when an underutilized missed-continuation storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        totalPositionIncreaseCount: 1,
        addCountAfterInitialEntry: 0,
        hadPartialExit: false,
        partialExitCount: 0,
        reductionsNearRecentHighCount: 0,
        tradeMfePct: 0.08,
        maxGivebackFromPeakOpenProfitPct: 0.3,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const underutilizedMissedWinner = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "underutilized_winner_with_missed_final_continuation",
    );
    const underutilized = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "underutilized_position_building",
    );
    const missedContinuation = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "missed_post_exit_continuation",
    );

    expect(underutilizedMissedWinner?.normalizedRole).toBe(
      "primary_candidate",
    );
    expect(underutilized?.normalizedRole).toBe("supporting_candidate");
    expect(missedContinuation?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes broader recovery and premature-exit overlap when the recovery-aware underutilized premature storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryUnderutilizedPremature =
      normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "recovery_to_underutilized_winner_with_premature_final_exit",
      );
    const underutilizedPremature = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "underutilized_winner_with_premature_final_exit",
    );
    const recoveryStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "constructive_recovery_after_early_adversity",
    );

    expect(recoveryUnderutilizedPremature?.normalizedRole).toBe(
      "primary_candidate",
    );
    expect(underutilizedPremature?.normalizedRole).toBe("supporting_candidate");
    expect(recoveryStory?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes weaker recovery and underutilized missed-continuation ingredients when the recovery-aware underutilized missed-continuation storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.05,
        maxGivebackFromPeakOpenProfitPct: 0.3,
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

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryUnderutilizedMissedWinner =
      normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "recovery_to_underutilized_winner_with_missed_final_continuation",
      );
    const underutilizedMissedWinner = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "underutilized_winner_with_missed_final_continuation",
    );
    const recoveryStory = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "constructive_recovery_after_early_adversity",
    );

    expect(recoveryUnderutilizedMissedWinner?.normalizedRole).toBe(
      "primary_candidate",
    );
    expect(underutilizedMissedWinner?.normalizedRole).toBe(
      "supporting_candidate",
    );
    expect(recoveryStory?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes weaker add-into-strength and constructive-exit ingredients when a richer constructive pressing storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 1,
        addAbovePreviousAverageEntryCount: 1,
        averageAddPriceVsPreviousAverageEntryPct: 0.05,
        averageAddPricePositionInRecentRangePct: 0.82,
        totalPositionDecreaseCount: 1,
        hadPartialExit: false,
        partialExitCount: 0,
        reductionAbovePreviousAverageEntryCount: 0,
        reductionBelowPreviousAverageEntryCount: 0,
        averageReductionPriceVsPreviousAverageEntryPct: null,
        averageReductionPricePositionInRecentRangePct: null,
        reductionsNearRecentHighCount: 0,
        reductionsNearRecentLowCount: 0,
        hadReaddAfterReduction: false,
        readdAfterReductionCount: 0,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const addIntoStrengthStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "add_into_strength_with_constructive_final_exit",
    );
    const addIntoStrength = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "add_into_strength",
    );
    const constructiveExit = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "exit_avoided_adverse_followthrough",
    );

    expect(addIntoStrengthStory?.normalizedRole).toBe("primary_candidate");
    expect(addIntoStrength?.normalizedRole).toBe("supporting_candidate");
    expect(constructiveExit?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes weaker recovery and constructive-pressing ingredients when a richer recovery-aware pressing storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.05,
        addCountAfterInitialEntry: 1,
        addAbovePreviousAverageEntryCount: 1,
        averageAddPriceVsPreviousAverageEntryPct: 0.05,
        averageAddPricePositionInRecentRangePct: 0.82,
        totalPositionDecreaseCount: 0,
        hadPartialExit: false,
        partialExitCount: 0,
        reductionAbovePreviousAverageEntryCount: 0,
        reductionBelowPreviousAverageEntryCount: 0,
        averageReductionPriceVsPreviousAverageEntryPct: null,
        averageReductionPricePositionInRecentRangePct: null,
        reductionsNearRecentHighCount: 0,
        reductionsNearRecentLowCount: 0,
        hadReaddAfterReduction: false,
        readdAfterReductionCount: 0,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryAddStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_add_into_strength_and_constructive_final_exit",
    );
    const addIntoStrengthStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "add_into_strength_with_constructive_final_exit",
    );
    const recoveryStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "constructive_recovery_after_early_adversity",
    );

    expect(recoveryAddStory?.normalizedRole).toBe("primary_candidate");
    expect(addIntoStrengthStory?.normalizedRole).toBe("supporting_candidate");
    expect(recoveryStory?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes weaker constructive-pressing and timely-protection ingredients when a richer timely constructive pressing storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 1,
        addAbovePreviousAverageEntryCount: 1,
        averageAddPriceVsPreviousAverageEntryPct: 0.05,
        averageAddPricePositionInRecentRangePct: 0.82,
        totalPositionDecreaseCount: 0,
        hadPartialExit: false,
        partialExitCount: 0,
        reductionAbovePreviousAverageEntryCount: 0,
        reductionBelowPreviousAverageEntryCount: 0,
        averageReductionPriceVsPreviousAverageEntryPct: null,
        averageReductionPricePositionInRecentRangePct: null,
        reductionsNearRecentHighCount: 0,
        reductionsNearRecentLowCount: 0,
        hadReaddAfterReduction: false,
        readdAfterReductionCount: 0,
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

    const normalized = normalizeDetectedPatterns(detected);

    const timelyAddStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "add_into_strength_with_timely_profit_protection_and_constructive_final_exit",
    );
    const addStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "add_into_strength_with_constructive_final_exit",
    );
    const timelyStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "timely_profit_protection_with_constructive_final_exit",
    );

    expect(timelyAddStory?.normalizedRole).toBe("primary_candidate");
    expect(addStory?.normalizedRole).toBe("supporting_candidate");
    expect(timelyStory?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes weaker recovery-aware pressing and timely-protection ingredients when a richer recovery-aware timely pressing storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.05,
        addCountAfterInitialEntry: 1,
        addAbovePreviousAverageEntryCount: 1,
        averageAddPriceVsPreviousAverageEntryPct: 0.05,
        averageAddPricePositionInRecentRangePct: 0.82,
        totalPositionDecreaseCount: 0,
        hadPartialExit: false,
        partialExitCount: 0,
        reductionAbovePreviousAverageEntryCount: 0,
        reductionBelowPreviousAverageEntryCount: 0,
        averageReductionPriceVsPreviousAverageEntryPct: null,
        averageReductionPricePositionInRecentRangePct: null,
        reductionsNearRecentHighCount: 0,
        reductionsNearRecentLowCount: 0,
        hadReaddAfterReduction: false,
        readdAfterReductionCount: 0,
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

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryTimelyAddStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_add_into_strength_and_timely_profit_protection_and_constructive_final_exit",
    );
    const recoveryAddStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_add_into_strength_and_constructive_final_exit",
    );
    const recoveryTimelyStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_timely_profit_protection_and_constructive_final_exit",
    );

    expect(recoveryTimelyAddStory?.normalizedRole).toBe("primary_candidate");
    expect(recoveryAddStory?.normalizedRole).toBe("supporting_candidate");
    expect(recoveryTimelyStory?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes broader pressing and premature-exit overlap when a richer pressing premature storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 1,
        addAbovePreviousAverageEntryCount: 1,
        averageAddPriceVsPreviousAverageEntryPct: 0.05,
        averageAddPricePositionInRecentRangePct: 0.82,
        totalPositionDecreaseCount: 0,
        hadPartialExit: false,
        partialExitCount: 0,
        reductionAbovePreviousAverageEntryCount: 0,
        reductionBelowPreviousAverageEntryCount: 0,
        averageReductionPriceVsPreviousAverageEntryPct: null,
        averageReductionPricePositionInRecentRangePct: null,
        reductionsNearRecentHighCount: 0,
        reductionsNearRecentLowCount: 0,
        hadReaddAfterReduction: false,
        readdAfterReductionCount: 0,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const addPrematureStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "add_into_strength_with_premature_final_exit",
    );
    const addStory = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "add_into_strength",
    );
    const prematureExit = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "premature_final_exit_after_constructive_management",
    );

    expect(addPrematureStory?.normalizedRole).toBe("primary_candidate");
    expect(addStory?.normalizedRole).toBe("supporting_candidate");
    expect(
      prematureExit === undefined ||
        prematureExit.normalizedRole === "supporting_candidate",
    ).toBe(true);
  });

  it("demotes broader recovery and premature-exit overlap when a richer recovery-aware pressing premature storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.05,
        addCountAfterInitialEntry: 1,
        addAbovePreviousAverageEntryCount: 1,
        averageAddPriceVsPreviousAverageEntryPct: 0.05,
        averageAddPricePositionInRecentRangePct: 0.82,
        totalPositionDecreaseCount: 0,
        hadPartialExit: false,
        partialExitCount: 0,
        reductionAbovePreviousAverageEntryCount: 0,
        reductionBelowPreviousAverageEntryCount: 0,
        averageReductionPriceVsPreviousAverageEntryPct: null,
        averageReductionPricePositionInRecentRangePct: null,
        reductionsNearRecentHighCount: 0,
        reductionsNearRecentLowCount: 0,
        hadReaddAfterReduction: false,
        readdAfterReductionCount: 0,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryAddPrematureStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_add_into_strength_and_premature_final_exit",
    );
    const addPrematureStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "add_into_strength_with_premature_final_exit",
    );
    const recoveryStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "constructive_recovery_after_early_adversity",
    );

    expect(recoveryAddPrematureStory?.normalizedRole).toBe("primary_candidate");
    expect(addPrematureStory?.normalizedRole).toBe("supporting_candidate");
    expect(recoveryStory?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes weaker pressing and missed-continuation ingredients when a richer pressing missed-continuation storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 1,
        addAbovePreviousAverageEntryCount: 1,
        averageAddPriceVsPreviousAverageEntryPct: 0.05,
        averageAddPricePositionInRecentRangePct: 0.82,
        totalPositionDecreaseCount: 0,
        hadPartialExit: false,
        partialExitCount: 0,
        reductionAbovePreviousAverageEntryCount: 0,
        reductionBelowPreviousAverageEntryCount: 0,
        averageReductionPriceVsPreviousAverageEntryPct: null,
        averageReductionPricePositionInRecentRangePct: null,
        reductionsNearRecentHighCount: 0,
        reductionsNearRecentLowCount: 0,
        hadReaddAfterReduction: false,
        readdAfterReductionCount: 0,
        maxGivebackFromPeakOpenProfitPct: 0.3,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const addMissedStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "add_into_strength_with_missed_final_continuation",
    );
    const addIntoStrength = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "add_into_strength",
    );
    const missedContinuation = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "missed_post_exit_continuation",
    );

    expect(addMissedStory?.normalizedRole).toBe("primary_candidate");
    expect(addIntoStrength?.normalizedRole).toBe("supporting_candidate");
    expect(missedContinuation?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes weaker recovery and pressing missed-continuation ingredients when a richer recovery-aware pressing missed-continuation storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.05,
        maxGivebackFromPeakOpenProfitPct: 0.3,
        addCountAfterInitialEntry: 1,
        addAbovePreviousAverageEntryCount: 1,
        averageAddPriceVsPreviousAverageEntryPct: 0.05,
        averageAddPricePositionInRecentRangePct: 0.82,
        totalPositionDecreaseCount: 0,
        hadPartialExit: false,
        partialExitCount: 0,
        reductionAbovePreviousAverageEntryCount: 0,
        reductionBelowPreviousAverageEntryCount: 0,
        averageReductionPriceVsPreviousAverageEntryPct: null,
        averageReductionPricePositionInRecentRangePct: null,
        reductionsNearRecentHighCount: 0,
        reductionsNearRecentLowCount: 0,
        hadReaddAfterReduction: false,
        readdAfterReductionCount: 0,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryAddMissedStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_add_into_strength_and_missed_final_continuation",
    );
    const addMissedStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "add_into_strength_with_missed_final_continuation",
    );
    const recoveryStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "constructive_recovery_after_early_adversity",
    );

    expect(recoveryAddMissedStory?.normalizedRole).toBe("primary_candidate");
    expect(addMissedStory?.normalizedRole).toBe("supporting_candidate");
    expect(recoveryStory?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes weaker trim and timely-protection ingredients when a timely trim-into-strength constructive storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const timelyTrimStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "timely_trim_into_strength_with_constructive_final_exit",
    );
    const trimStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "trim_into_strength_with_constructive_final_exit",
    );
    const timelyStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "timely_profit_protection_with_constructive_final_exit",
    );

    expect(timelyTrimStory?.normalizedRole).toBe("primary_candidate");
    expect(trimStory?.normalizedRole).toBe("supporting_candidate");
    expect(timelyStory?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes broader trim and premature-exit overlap when the trim-into-strength premature storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const trimPrematureStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "trim_into_strength_with_premature_final_exit",
    );
    const trimStory = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "reduction_into_strength",
    );
    const prematureExit = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "premature_final_exit_after_constructive_management",
    );

    expect(trimPrematureStory?.normalizedRole).toBe("primary_candidate");
    expect(trimStory?.normalizedRole).toBe("supporting_candidate");
    expect(prematureExit?.normalizedRole).toBe("supporting_candidate");
    expect(
      prematureExit?.suppressionReasons.some((reason) =>
        reason.includes("trim_into_strength_with_premature_final_exit"),
      ),
    ).toBe(true);
  });

  it("demotes broader trim and reduction overlap when the trim-into-resistance constructive storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadSupportResistanceContextAvailable: true,
        hadPartialExit: true,
        partialExitCount: 1,
        totalPositionDecreaseCount: 1,
        reductionsNearRecentHighCount: 1,
        reductionsNearResistanceCount: 1,
        averageReductionPriceVsPreviousAverageEntryPct: 0.05,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        closedToFlat: true,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const trimResistanceStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "trim_into_resistance_with_constructive_final_exit",
    );
    const trimStrengthStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "trim_into_strength_with_constructive_final_exit",
    );

    expect(trimResistanceStory?.normalizedRole).toBe("primary_candidate");
    expect(trimStrengthStory?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes broader trim, premature-exit, and exit-into-resistance overlap when the trim-into-resistance premature storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadSupportResistanceContextAvailable: true,
        hadPartialExit: true,
        partialExitCount: 1,
        totalPositionDecreaseCount: 1,
        reductionsNearRecentHighCount: 1,
        reductionsNearResistanceCount: 1,
        averageReductionPriceVsPreviousAverageEntryPct: 0.05,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        closedToFlat: true,
        finalExitOccurredNearResistance: true,
        finalExitDistanceToNearestResistancePct: 0.15,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const trimResistancePrematureStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "trim_into_resistance_with_premature_final_exit",
    );
    const trimStrengthPrematureStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "trim_into_strength_with_premature_final_exit",
    );
    const exitIntoResistance = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "exit_into_resistance_before_breakout",
    );

    expect(trimResistancePrematureStory?.normalizedRole).toBe(
      "primary_candidate",
    );
    expect(trimStrengthPrematureStory?.normalizedRole).toBe(
      "supporting_candidate",
    );
    expect(exitIntoResistance?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes weaker recovery-aware trim and timely-protection ingredients when the recovery-aware timely trim storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryTimelyTrimStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_timely_trim_into_strength_and_constructive_final_exit",
    );
    const recoveryTrimStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_trim_into_strength_and_constructive_final_exit",
    );
    const recoveryTimelyStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_timely_profit_protection_and_constructive_final_exit",
    );

    expect(recoveryTimelyTrimStory?.normalizedRole).toBe("primary_candidate");
    expect(recoveryTrimStory?.normalizedRole).toBe("supporting_candidate");
    expect(recoveryTimelyStory?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes weaker recovery-aware trim ingredients when the recovery-aware trim-into-resistance constructive storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.06,
        hadSupportResistanceContextAvailable: true,
        hadPartialExit: true,
        partialExitCount: 1,
        totalPositionDecreaseCount: 1,
        reductionsNearRecentHighCount: 1,
        reductionsNearResistanceCount: 1,
        averageReductionPriceVsPreviousAverageEntryPct: 0.05,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        closedToFlat: true,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryTrimResistanceStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_trim_into_resistance_and_constructive_final_exit",
    );
    const recoveryTrimStrengthStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_trim_into_strength_and_constructive_final_exit",
    );

    expect(recoveryTrimResistanceStory?.normalizedRole).toBe(
      "primary_candidate",
    );
    expect(recoveryTrimStrengthStory?.normalizedRole).toBe(
      "supporting_candidate",
    );
  });

  it("demotes weaker recovery-aware trim and resistance-exit overlap when the recovery-aware trim-into-resistance premature storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.05,
        hadSupportResistanceContextAvailable: true,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        hadPartialExit: true,
        partialExitCount: 1,
        totalPositionDecreaseCount: 1,
        reductionsNearRecentHighCount: 1,
        reductionsNearResistanceCount: 1,
        averageReductionPriceVsPreviousAverageEntryPct: 0.05,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        closedToFlat: true,
        finalExitOccurredNearResistance: true,
        finalExitDistanceToNearestResistancePct: 0.15,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryTrimResistancePrematureStory =
      normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "recovery_with_trim_into_resistance_and_premature_final_exit",
      );
    const recoveryTrimStrengthPrematureStory =
      normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "recovery_with_trim_into_strength_and_premature_final_exit",
      );
    const recoveryExitIntoResistance = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "stabilized_recovery_with_exit_into_resistance_before_breakout",
    );

    expect(recoveryTrimResistancePrematureStory?.normalizedRole).toBe(
      "primary_candidate",
    );
    expect(recoveryTrimStrengthPrematureStory?.normalizedRole).toBe(
      "supporting_candidate",
    );
    expect(recoveryExitIntoResistance?.normalizedRole).toBe(
      "supporting_candidate",
    );
  });

  it("demotes the broader constructive take-profit summary when the trim-into-resistance constructive storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadSupportResistanceContextAvailable: true,
        addCountAfterInitialEntry: 1,
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

    const normalized = normalizeDetectedPatterns(detected);

    const trimResistanceStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "trim_into_resistance_with_constructive_final_exit",
    );
    const takeProfitSummary = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "balanced_management_with_take_profit_into_resistance_and_constructive_final_exit",
    );

    expect(trimResistanceStory?.normalizedRole).toBe("primary_candidate");
    expect(takeProfitSummary?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes the broader premature take-profit summary when the trim-into-resistance premature storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadSupportResistanceContextAvailable: true,
        addCountAfterInitialEntry: 1,
        hadPartialExit: true,
        partialExitCount: 1,
        totalPositionDecreaseCount: 1,
        realizedReturnPct: 0.05,
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

    const normalized = normalizeDetectedPatterns(detected);

    const trimResistancePrematureStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "trim_into_resistance_with_premature_final_exit",
    );
    const takeProfitPrematureSummary = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "balanced_management_with_take_profit_into_resistance_and_premature_final_exit",
    );

    expect(trimResistancePrematureStory?.normalizedRole).toBe(
      "primary_candidate",
    );
    expect(takeProfitPrematureSummary?.normalizedRole).toBe(
      "supporting_candidate",
    );
  });

  it("demotes the broader recovery-aware constructive take-profit summary when the recovery trim-into-resistance constructive storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadSupportResistanceContextAvailable: true,
        addCountAfterInitialEntry: 1,
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

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryTrimResistanceStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_trim_into_resistance_and_constructive_final_exit",
    );
    const recoveryTakeProfitSummary = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_balanced_management_and_take_profit_into_resistance_and_constructive_final_exit",
    );

    expect(recoveryTrimResistanceStory?.normalizedRole).toBe(
      "primary_candidate",
    );
    expect(recoveryTakeProfitSummary?.normalizedRole).toBe(
      "supporting_candidate",
    );
  });

  it("demotes the broader recovery-aware premature take-profit summary when the recovery trim-into-resistance premature storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.05,
        hadSupportResistanceContextAvailable: true,
        addCountAfterInitialEntry: 1,
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

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryTrimResistancePrematureStory =
      normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "recovery_with_trim_into_resistance_and_premature_final_exit",
      );
    const recoveryTakeProfitPrematureSummary =
      normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "recovery_with_balanced_management_and_take_profit_into_resistance_and_premature_final_exit",
      );

    expect(recoveryTrimResistancePrematureStory?.normalizedRole).toBe(
      "primary_candidate",
    );
    expect(recoveryTakeProfitPrematureSummary?.normalizedRole).toBe(
      "supporting_candidate",
    );
  });

  it("demotes broader repeated constructive overlap when the repeated trim-into-resistance constructive storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const repeatedTrimResistanceStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_balanced_management_with_trim_into_resistance_and_constructive_final_exit",
    );
    const repeatedConstructiveStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "repeated_balanced_management_with_constructive_final_exit",
    );

    expect(repeatedTrimResistanceStory?.normalizedRole).toBe(
      "primary_candidate",
    );
    expect(repeatedConstructiveStory?.normalizedRole).toBe(
      "supporting_candidate",
    );
  });

  it("demotes broader repeated constructive overlap when the repeated take-profit-into-resistance constructive summary is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const repeatedTakeProfitResistanceStory =
      normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "repeated_balanced_management_with_take_profit_into_resistance_and_constructive_final_exit",
      );
    const repeatedConstructiveStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "repeated_balanced_management_with_constructive_final_exit",
    );

    expect(repeatedTakeProfitResistanceStory?.normalizedRole).toBe(
      "primary_candidate",
    );
    expect(repeatedConstructiveStory?.normalizedRole).toBe(
      "supporting_candidate",
    );
  });

  it("demotes broader repeated premature overlap when the repeated trim-into-resistance premature storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const repeatedTrimResistancePrematureStory =
      normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "repeated_balanced_management_with_trim_into_resistance_and_premature_final_exit",
      );
    const repeatedPrematureStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "repeated_balanced_management_with_premature_final_exit",
    );

    expect(repeatedTrimResistancePrematureStory?.normalizedRole).toBe(
      "primary_candidate",
    );
    expect(repeatedPrematureStory?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes broader repeated premature overlap when the repeated take-profit-into-resistance premature summary is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const repeatedTakeProfitResistancePrematureStory =
      normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "repeated_balanced_management_with_take_profit_into_resistance_and_premature_final_exit",
      );
    const repeatedPrematureStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "repeated_balanced_management_with_premature_final_exit",
    );

    expect(repeatedTakeProfitResistancePrematureStory?.normalizedRole).toBe(
      "primary_candidate",
    );
    expect(repeatedPrematureStory?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes broader repeated recovery-aware constructive overlap when the repeated recovery trim-into-resistance constructive storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const repeatedRecoveryTrimResistanceStory =
      normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "repeated_rescue_attempts_with_balanced_management_and_trim_into_resistance_and_constructive_final_exit",
      );
    const repeatedRecoveryConstructiveStory =
      normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "repeated_rescue_attempts_with_balanced_management_and_constructive_final_exit",
      );

    expect(repeatedRecoveryTrimResistanceStory?.normalizedRole).toBe(
      "primary_candidate",
    );
    expect(repeatedRecoveryConstructiveStory?.normalizedRole).toBe(
      "supporting_candidate",
    );
  });

  it("demotes broader repeated recovery-aware constructive overlap when the repeated recovery take-profit-into-resistance constructive summary is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const repeatedRecoveryTakeProfitResistanceStory =
      normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "repeated_rescue_attempts_with_balanced_management_and_take_profit_into_resistance_and_constructive_final_exit",
      );
    const repeatedRecoveryConstructiveStory =
      normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "repeated_rescue_attempts_with_balanced_management_and_constructive_final_exit",
      );

    expect(repeatedRecoveryTakeProfitResistanceStory?.normalizedRole).toBe(
      "primary_candidate",
    );
    expect(repeatedRecoveryConstructiveStory?.normalizedRole).toBe(
      "supporting_candidate",
    );
  });

  it("demotes broader repeated recovery-aware premature overlap when the repeated recovery trim-into-resistance premature storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const repeatedRecoveryTrimResistancePrematureStory =
      normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "repeated_rescue_attempts_with_balanced_management_and_trim_into_resistance_and_premature_final_exit",
      );
    const repeatedRecoveryPrematureStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_rescue_attempts_with_balanced_management_and_premature_final_exit",
    );

    expect(repeatedRecoveryTrimResistancePrematureStory?.normalizedRole).toBe(
      "primary_candidate",
    );
    expect(repeatedRecoveryPrematureStory?.normalizedRole).toBe(
      "supporting_candidate",
    );
  });

  it("demotes broader repeated recovery-aware premature overlap when the repeated recovery take-profit-into-resistance premature summary is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const repeatedRecoveryTakeProfitResistancePrematureStory =
      normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "repeated_rescue_attempts_with_balanced_management_and_take_profit_into_resistance_and_premature_final_exit",
      );
    const repeatedRecoveryPrematureStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_rescue_attempts_with_balanced_management_and_premature_final_exit",
    );

    expect(
      repeatedRecoveryTakeProfitResistancePrematureStory?.normalizedRole,
    ).toBe("primary_candidate");
    expect(repeatedRecoveryPrematureStory?.normalizedRole).toBe(
      "supporting_candidate",
    );
  });

  it("keeps the repeated trim-into-resistance constructive storyline primary over the broader repeated take-profit-into-resistance constructive summary", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const trimStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_balanced_management_with_trim_into_resistance_and_constructive_final_exit",
    );
    const summaryStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_balanced_management_with_take_profit_into_resistance_and_constructive_final_exit",
    );

    expect(trimStory?.normalizedRole).toBe("primary_candidate");
    expect(summaryStory?.normalizedRole).toBe("supporting_candidate");
  });

  it("keeps the repeated trim-into-resistance premature storyline primary over the broader repeated take-profit-into-resistance premature summary", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const trimStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_balanced_management_with_trim_into_resistance_and_premature_final_exit",
    );
    const summaryStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_balanced_management_with_take_profit_into_resistance_and_premature_final_exit",
    );

    expect(trimStory?.normalizedRole).toBe("primary_candidate");
    expect(summaryStory?.normalizedRole).toBe("supporting_candidate");
  });

  it("keeps the repeated recovery trim-into-resistance constructive storyline primary over the broader repeated recovery take-profit-into-resistance constructive summary", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const trimStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_rescue_attempts_with_balanced_management_and_trim_into_resistance_and_constructive_final_exit",
    );
    const summaryStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_rescue_attempts_with_balanced_management_and_take_profit_into_resistance_and_constructive_final_exit",
    );

    expect(trimStory?.normalizedRole).toBe("primary_candidate");
    expect(summaryStory?.normalizedRole).toBe("supporting_candidate");
  });

  it("keeps the repeated recovery trim-into-resistance premature storyline primary over the broader repeated recovery take-profit-into-resistance premature summary", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const trimStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_rescue_attempts_with_balanced_management_and_trim_into_resistance_and_premature_final_exit",
    );
    const summaryStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_rescue_attempts_with_balanced_management_and_take_profit_into_resistance_and_premature_final_exit",
    );

    expect(trimStory?.normalizedRole).toBe("primary_candidate");
    expect(summaryStory?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes broader recovery and premature-exit overlap when the recovery-aware trim-into-strength premature storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        realizedReturnPct: 0.04,
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

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryTrimPrematureStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_trim_into_strength_and_premature_final_exit",
    );
    const trimPrematureStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "trim_into_strength_with_premature_final_exit",
    );
    const recoveryStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "constructive_recovery_after_early_adversity",
    );

    expect(recoveryTrimPrematureStory?.normalizedRole).toBe(
      "primary_candidate",
    );
    expect(trimPrematureStory?.normalizedRole).toBe("supporting_candidate");
    expect(recoveryStory?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes broader weak entry ingredients when a weak pullback entry storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const weakPullback = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "weak_pullback_entry_structure",
    );
    const disadvantagedEntry = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "disadvantaged_entry_structure",
    );
    const inefficientEntry = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "inefficient_entry_structure",
    );

    expect(weakPullback?.normalizedRole).toBe("primary_candidate");
    expect(disadvantagedEntry?.normalizedRole).toBe("supporting_candidate");
    expect(inefficientEntry?.normalizedRole).toBe("supporting_candidate");
    expect(
      disadvantagedEntry?.suppressionReasons.some((reason) =>
        reason.includes("weak_pullback_entry_structure"),
      ),
    ).toBe(true);
  });

  it("demotes weaker trim, reduction, and exit ingredients when a richer trim-into-strength constructive storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const trimIntoStrengthStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "trim_into_strength_with_constructive_final_exit",
    );
    const balancedStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "balanced_management_with_constructive_exit",
    );
    const directionalTrim = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "reduction_into_strength",
    );

    expect(trimIntoStrengthStory?.normalizedRole).toBe("primary_candidate");
    expect(balancedStory?.normalizedRole).toBe("supporting_candidate");
    expect(directionalTrim?.normalizedRole).toBe("supporting_candidate");
    expect(
      balancedStory?.suppressionReasons.some((reason) =>
        reason.includes("trim_into_strength_with_constructive_final_exit"),
      ),
    ).toBe(true);
  });

  it("demotes weaker recovery and constructive-trim ingredients when a richer recovery-aware trim-into-strength storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryTrimStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_trim_into_strength_and_constructive_final_exit",
    );
    const trimIntoStrengthStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "trim_into_strength_with_constructive_final_exit",
    );
    const recoveryStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "constructive_recovery_after_early_adversity",
    );

    expect(recoveryTrimStory?.normalizedRole).toBe("primary_candidate");
    expect(trimIntoStrengthStory?.normalizedRole).toBe("supporting_candidate");
    expect(recoveryStory?.normalizedRole).toBe("supporting_candidate");
    expect(
      trimIntoStrengthStory?.suppressionReasons.some((reason) =>
        reason.includes(
          "recovery_with_trim_into_strength_and_constructive_final_exit",
        ),
      ),
    ).toBe(true);
  });

  it("demotes weaker trim and exit ingredients when a richer trim re-add constructive storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const trimReaddStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "trim_readd_with_constructive_final_exit",
    );
    const constructiveReadd = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "constructive_readd_after_reduction",
    );
    const constructiveExit = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "exit_avoided_adverse_followthrough",
    );

    expect(trimReaddStory?.normalizedRole).toBe("primary_candidate");
    expect(constructiveReadd?.normalizedRole).toBe("supporting_candidate");
    expect(constructiveExit?.normalizedRole).toBe("supporting_candidate");
    expect(
      constructiveReadd?.suppressionReasons.some((reason) =>
        reason.includes("trim_readd_with_constructive_final_exit"),
      ),
    ).toBe(true);
  });

  it("demotes weaker one-cycle constructive re-entry and constructive-exit ingredients when a richer combined one-cycle storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const combinedStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "constructive_reentry_with_constructive_final_exit",
    );
    const reentryStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "constructive_reentry_followthrough_after_trim",
    );
    const constructiveExit = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "trim_readd_with_constructive_final_exit",
    );

    expect(combinedStory?.normalizedRole).toBe("primary_candidate");
    expect(reentryStory?.normalizedRole).toBe("supporting_candidate");
    expect(constructiveExit?.normalizedRole).toBe("supporting_candidate");
    expect(
      constructiveExit?.suppressionReasons.some((reason) =>
        reason.includes("constructive_reentry_with_constructive_final_exit"),
      ),
    ).toBe(true);
  });

  it("demotes weaker re-add and post-exit ingredients when a richer trim re-add continuation failure storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const trimReaddFailure = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "trim_readd_with_missed_final_continuation",
    );
    const readdFact = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "readd_after_reduction",
    );
    const missedContinuation = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "missed_post_exit_continuation",
    );

    expect(trimReaddFailure?.normalizedRole).toBe("primary_candidate");
    expect(readdFact?.normalizedRole).toBe("supporting_candidate");
    expect(missedContinuation?.normalizedRole).toBe("supporting_candidate");
    expect(
      missedContinuation?.suppressionReasons.some((reason) =>
        reason.includes("trim_readd_with_missed_final_continuation"),
      ),
    ).toBe(true);
  });

  it("demotes weaker one-cycle constructive re-entry and premature-exit ingredients when a richer one-cycle constructive re-entry premature storyline is present", () => {
    const detected = detectPatterns(
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
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const combinedStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "constructive_reentry_with_premature_final_exit",
    );
    const reentryStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "constructive_reentry_followthrough_after_trim",
    );
    const prematureExit = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "premature_final_exit_after_constructive_management",
    );

    expect(combinedStory?.normalizedRole).toBe("primary_candidate");
    expect(reentryStory?.normalizedRole).toBe("supporting_candidate");
    expect(prematureExit?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes weaker one-cycle constructive re-entry and stop-like breakdown ingredients when a richer one-cycle constructive re-entry stop-like breakdown storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const combinedStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    );
    const reentryStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "constructive_reentry_followthrough_after_trim",
    );
    const stopLikeExit = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "stop_like_forced_exit_after_breakdown",
    );

    expect(combinedStory?.normalizedRole).toBe("primary_candidate");
    expect(reentryStory?.normalizedRole).toBe("supporting_candidate");
    expect(stopLikeExit?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes weaker one-cycle constructive re-entry and stop-like rebound ingredients when a richer one-cycle constructive re-entry stop-like rebound storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const combinedStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "constructive_reentry_with_stop_like_forced_exit_before_rebound",
    );
    const reentryStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "constructive_reentry_followthrough_after_trim",
    );
    const stopLikeExit = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "stop_like_forced_exit_before_rebound",
    );

    expect(combinedStory?.normalizedRole).toBe("primary_candidate");
    expect(reentryStory?.normalizedRole).toBe("supporting_candidate");
    expect(stopLikeExit?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes weaker relief-exit ingredients when a richer defensive-exit storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 0,
        totalPositionDecreaseCount: 0,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
        maxGivebackFromPeakOpenProfitPct: 0.6,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const defensiveExit = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "defensive_exit_after_deterioration",
    );
    const reliefExit = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "exit_avoided_adverse_followthrough",
    );
    const peakGiveback = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "peak_profit_giveback_structure",
    );

    expect(defensiveExit?.normalizedRole).toBe("primary_candidate");
    expect(reliefExit?.normalizedRole).toBe("supporting_candidate");
    expect(peakGiveback?.normalizedRole).toBe("supporting_candidate");
    expect(
      reliefExit?.suppressionReasons.some((reason) =>
        reason.includes("defensive_exit_after_deterioration"),
      ),
    ).toBe(true);
  });

  it("demotes weaker continuation ingredients when a richer premature-final-exit storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        totalPositionDecreaseCount: 2,
        hadMultipleDecreases: true,
        hadPartialExit: false,
        partialExitCount: 0,
        reductionsNearRecentHighCount: 0,
        averageReductionPriceVsPreviousAverageEntryPct: null,
        addCountAfterInitialEntry: 0,
        addAbovePreviousAverageEntryCount: 0,
        addBelowPreviousAverageEntryCount: 0,
        averageAddPriceVsPreviousAverageEntryPct: null,
        averageAddPricePositionInRecentRangePct: null,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const prematureExit = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "premature_final_exit_after_constructive_management",
    );
    const missedContinuation = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "missed_post_exit_continuation",
    );

    expect(prematureExit?.normalizedRole).toBe("primary_candidate");
    expect(missedContinuation?.normalizedRole).toBe("supporting_candidate");
    expect(
      missedContinuation?.suppressionReasons.some((reason) =>
        reason.includes("premature_final_exit_after_constructive_management"),
      ),
    ).toBe(true);
  });

  it("demotes weaker weak-exit ingredients when a richer fearful-exit storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 0,
        totalPositionDecreaseCount: 0,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.25,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const fearfulExit = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "fearful_exit_after_weakening",
    );
    const missedContinuation = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "missed_post_exit_continuation",
    );
    const lowCapture = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "low_capture_exit_structure",
    );

    expect(fearfulExit?.normalizedRole).toBe("primary_candidate");
    expect(missedContinuation?.normalizedRole).toBe("supporting_candidate");
    expect(lowCapture?.normalizedRole).toBe("supporting_candidate");
    expect(
      missedContinuation?.suppressionReasons.some((reason) =>
        reason.includes("fearful_exit_after_weakening"),
      ),
    ).toBe(true);
  });

  it("demotes broader deterioration and relief overlap when a richer stop-like breakdown exit storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 0,
        totalPositionIncreaseCount: 1,
        totalPositionDecreaseCount: 1,
        addAbovePreviousAverageEntryCount: 0,
        addBelowPreviousAverageEntryCount: 0,
        averageAddPriceVsPreviousAverageEntryPct: null,
        averageAddPricePositionInRecentRangePct: null,
        hadPartialExit: false,
        partialExitCount: 0,
        reductionAbovePreviousAverageEntryCount: 0,
        reductionBelowPreviousAverageEntryCount: 0,
        averageReductionPriceVsPreviousAverageEntryPct: null,
        averageReductionPricePositionInRecentRangePct: null,
        reductionsNearRecentHighCount: 0,
        reductionsNearRecentLowCount: 0,
        hadReaddAfterReduction: false,
        readdAfterReductionCount: 0,
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

    const normalized = normalizeDetectedPatterns(detected);

    const stopLikeExit = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "stop_like_forced_exit_after_breakdown",
    );
    const defensiveExit = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "defensive_exit_after_deterioration",
    );
    const reliefExit = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "exit_avoided_adverse_followthrough",
    );

    expect(stopLikeExit?.normalizedRole).toBe("primary_candidate");
    expect(defensiveExit?.normalizedRole).toBe("supporting_candidate");
    expect(reliefExit?.normalizedRole).toBe("supporting_candidate");
    expect(
      defensiveExit?.suppressionReasons.some((reason) =>
        reason.includes("stop_like_forced_exit_after_breakdown"),
      ),
    ).toBe(true);
  });

  it("demotes broader fearful-exit overlap when a richer stop-like rebound storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 0,
        totalPositionIncreaseCount: 1,
        totalPositionDecreaseCount: 1,
        addAbovePreviousAverageEntryCount: 0,
        addBelowPreviousAverageEntryCount: 0,
        averageAddPriceVsPreviousAverageEntryPct: null,
        averageAddPricePositionInRecentRangePct: null,
        hadPartialExit: false,
        partialExitCount: 0,
        reductionAbovePreviousAverageEntryCount: 0,
        reductionBelowPreviousAverageEntryCount: 0,
        averageReductionPriceVsPreviousAverageEntryPct: null,
        averageReductionPricePositionInRecentRangePct: null,
        reductionsNearRecentHighCount: 0,
        reductionsNearRecentLowCount: 0,
        hadReaddAfterReduction: false,
        readdAfterReductionCount: 0,
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

    const normalized = normalizeDetectedPatterns(detected);

    const stopLikeRebound = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "stop_like_forced_exit_before_rebound",
    );
    const fearfulExit = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "fearful_exit_after_weakening",
    );
    const missedContinuation = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "missed_post_exit_continuation",
    );

    expect(stopLikeRebound?.normalizedRole).toBe("primary_candidate");
    expect(fearfulExit?.normalizedRole).toBe("supporting_candidate");
    expect(missedContinuation?.normalizedRole).toBe("supporting_candidate");
    expect(
      fearfulExit?.suppressionReasons.some((reason) =>
        reason.includes("stop_like_forced_exit_before_rebound"),
      ),
    ).toBe(true);
  });

  it("demotes weaker held-through-danger and stop-like ingredients when a richer held-through-danger stop-like breakdown storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: false,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.22,
        maxGivebackFromPeakOpenProfitPct: 0.7,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const heldStopStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "held_through_danger_with_stop_like_forced_exit_after_breakdown",
    );
    const heldDanger = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "held_through_danger_after_peak_profit",
    );
    const stopLike = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "stop_like_forced_exit_after_breakdown",
    );

    expect(heldStopStory?.normalizedRole).toBe("primary_candidate");
    expect(heldDanger?.normalizedRole).toBe("supporting_candidate");
    expect(stopLike?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes weaker delayed-risk and stop-like ingredients when a richer delayed-risk stop-like rebound storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        drawdownFromPeakOpenProfitPctOfBasis: 0.12,
        secondsFromPeakOpenProfitToFirstReduction: 90,
        peakOpenProfitPctOfBasis: 0.08,
        exitWasNearTradeLow: true,
        realizedCapturePercentOfTradeMfe: 0.22,
        maxGivebackFromPeakOpenProfitPct: 0.7,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const delayedStopStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "delayed_risk_response_with_stop_like_forced_exit_before_rebound",
    );
    const delayedRisk = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "delayed_risk_response_with_failed_profit_protection",
    );
    const stopLike = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "stop_like_forced_exit_before_rebound",
    );

    expect(delayedStopStory?.normalizedRole).toBe("primary_candidate");
    expect(delayedRisk?.normalizedRole).toBe("supporting_candidate");
    expect(stopLike?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes weaker relief-exit ingredients when a richer disciplined defensive-exit storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        maxGivebackFromPeakOpenProfitPct: 0.2,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const disciplinedExit = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "disciplined_defensive_exit",
    );
    const reliefExit = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "exit_avoided_adverse_followthrough",
    );

    expect(disciplinedExit?.normalizedRole).toBe("primary_candidate");
    expect(reliefExit?.normalizedRole).toBe("supporting_candidate");
    expect(
      reliefExit?.suppressionReasons.some((reason) =>
        reason.includes("disciplined_defensive_exit"),
      ),
    ).toBe(true);
  });

  it("demotes weaker constructive-management ingredients when a richer recovery-aware balanced constructive storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 1,
        hadOpenLossBeforePeakOpenProfit: true,
        secondsFromFirstOpenLossToPeakOpenProfit: 120,
        peakOpenProfitPctOfBasis: 0.08,
        maxGivebackFromPeakOpenProfitPct: 0.2,
        realizedReturnPct: 0.04,
        addAbovePreviousAverageEntryCount: 0,
        addBelowPreviousAverageEntryCount: 0,
        averageAddPriceVsPreviousAverageEntryPct: null,
        averageAddPricePositionInRecentRangePct: null,
        hadPartialExit: false,
        partialExitCount: 0,
        hadReaddAfterReduction: false,
        readdAfterReductionCount: 0,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_balanced_management_and_constructive_final_exit",
    );
    const balancedConstructiveManagement = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "balanced_position_management",
    );

    expect(recoveryStory?.normalizedRole).toBe("primary_candidate");
    expect(balancedConstructiveManagement?.normalizedRole).toBe(
      "supporting_candidate",
    );
  });

  it("demotes weaker recovery and constructive-management ingredients when a richer recovery-aware timely-protection storyline is present", () => {
    const detected = detectPatterns(
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
        addCountAfterInitialEntry: 0,
        addAbovePreviousAverageEntryCount: 0,
        addBelowPreviousAverageEntryCount: 0,
        averageAddPriceVsPreviousAverageEntryPct: null,
        averageAddPricePositionInRecentRangePct: null,
        reductionsNearRecentHighCount: 0,
        realizedReturnPct: 0.04,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_timely_profit_protection_and_constructive_final_exit",
    );
    const timelyStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "timely_profit_protection_with_constructive_final_exit",
    );
    const stabilizedRecovery = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "stabilized_recovery_with_constructive_final_exit",
    );

    expect(recoveryStory?.normalizedRole).toBe("primary_candidate");
    expect(timelyStory?.normalizedRole).toBe("supporting_candidate");
    expect(stabilizedRecovery?.normalizedRole).toBe("supporting_candidate");
    expect(
      stabilizedRecovery?.suppressionReasons.some((reason) =>
        reason.includes(
          "recovery_with_timely_profit_protection_and_constructive_final_exit",
        ),
      ),
    ).toBe(true);
  });

  it("demotes weaker recovery and one-cycle constructive re-entry ingredients when a richer recovery-aware constructive re-entry storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: true,
        secondsFromPeakOpenProfitToFirstReduction: 30,
        hadPartialExit: true,
        partialExitCount: 1,
        reductionsNearRecentHighCount: 0,
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
        realizedReturnPct: 0.04,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_constructive_final_exit_after_constructive_reentry",
    );
    const reentryStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "constructive_reentry_with_constructive_final_exit",
    );
    const stabilizedRecovery = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "stabilized_recovery_with_constructive_final_exit",
    );

    expect(recoveryStory?.normalizedRole).toBe("primary_candidate");
    expect(reentryStory?.normalizedRole).toBe("supporting_candidate");
    expect(stabilizedRecovery?.normalizedRole).toBe("supporting_candidate");
    expect(
      stabilizedRecovery?.suppressionReasons.some((reason) =>
        reason.includes(
          "recovery_with_constructive_final_exit_after_constructive_reentry",
        ),
      ),
    ).toBe(true);
  });

  it("demotes weaker failed-protection ingredients when a richer failed-recovery storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 0,
        totalPositionDecreaseCount: 1,
        hadPartialExit: true,
        partialExitCount: 1,
        hadOpenLossBeforePeakOpenProfit: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: false,
        reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 0,
        secondsFromPeakOpenProfitToFirstReduction: null,
        secondsFromFirstOpenLossToPeakOpenProfit: 120,
        peakOpenProfitPctOfBasis: 0.08,
        maxGivebackFromPeakOpenProfitPct: 0.65,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const failedRecovery = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_after_early_adversity_with_failed_protection",
    );
    const failedProtection = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "failed_profit_protection_structure",
    );

    expect(failedRecovery?.normalizedRole).toBe("primary_candidate");
    expect(failedProtection?.normalizedRole).toBe("supporting_candidate");
    expect(
      failedProtection?.suppressionReasons.some((reason) =>
        reason.includes("recovery_after_early_adversity_with_failed_protection"),
      ),
    ).toBe(true);
  });

  it("demotes weaker recovery-aware re-entry and premature-exit ingredients when a richer recovery-aware constructive re-entry premature storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_premature_final_exit_after_constructive_reentry",
    );
    const reentryStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "constructive_reentry_with_premature_final_exit",
    );
    const constructiveRecovery = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "constructive_recovery_after_early_adversity",
    );

    expect(recoveryStory?.normalizedRole).toBe("primary_candidate");
    expect(reentryStory?.normalizedRole).toBe("supporting_candidate");
    expect(constructiveRecovery?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes weaker recovery-aware re-entry and stop-like breakdown ingredients when a richer recovery-aware constructive re-entry stop-like breakdown storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_stop_like_forced_exit_after_constructive_reentry",
    );
    const reentryStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    );
    const failedRecovery = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_after_early_adversity_with_failed_protection",
    );

    expect(recoveryStory?.normalizedRole).toBe("primary_candidate");
    expect(reentryStory?.normalizedRole).toBe("supporting_candidate");
    expect(failedRecovery?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes weaker recovery-aware re-entry and stop-like rebound ingredients when a richer recovery-aware constructive re-entry stop-like rebound storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const recoveryStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_with_stop_like_forced_exit_before_rebound_after_constructive_reentry",
    );
    const reentryStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "constructive_reentry_with_stop_like_forced_exit_before_rebound",
    );
    const failedRecovery = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_after_early_adversity_with_failed_protection",
    );

    expect(recoveryStory?.normalizedRole).toBe("primary_candidate");
    expect(reentryStory?.normalizedRole).toBe("supporting_candidate");
    expect(failedRecovery?.normalizedRole).toBe("supporting_candidate");
  });

  it("demotes weaker one-cycle constructive trim/readd ingredients when a richer repeated-cycle constructive storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const repeatedBroadConstructive = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_balanced_management_with_constructive_final_exit",
    );
    const repeatedConstructive = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "repeated_trim_readd_with_constructive_final_exit",
    );
    const repeatedConstructiveManagement = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "repeated_trim_readd_with_constructive_management",
    );
    const oneCycleConstructive = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "trim_readd_with_constructive_final_exit",
    );

    expect(repeatedBroadConstructive?.normalizedRole).toBe("primary_candidate");
    expect(repeatedConstructive?.normalizedRole).toBe("supporting_candidate");
    expect(repeatedConstructiveManagement?.normalizedRole).toBe(
      "supporting_candidate",
    );
    expect(oneCycleConstructive?.normalizedRole).toBe("supporting_candidate");
    expect(
      oneCycleConstructive?.suppressionReasons.some((reason) =>
        reason.includes(
          "repeated_balanced_management_with_constructive_final_exit",
        ) ||
        reason.includes("repeated_trim_readd_with_constructive_final_exit"),
      ),
    ).toBe(true);
  });

  it("demotes weaker one-cycle constructive re-entry ingredients when a richer repeated-cycle constructive followthrough storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        postExitCandleCount: 0,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 2,
        averageAdverseMovePctAfterPartialExitBeforeReadd: 0.02,
        averageFavorableMovePctAfterReaddBeforeNextExecution: 0.03,
        averageAdverseMovePctAfterReaddBeforeNextExecution: 0.01,
        readdsWithStrongerFavorableFollowthroughCount: 2,
        readdsWithStrongerAdverseFollowthroughCount: 0,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const repeatedConstructiveReentry = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_trim_readd_with_constructive_reentry_followthrough",
    );
    const oneCycleConstructiveReentry =
      normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "constructive_reentry_followthrough_after_trim",
      );

    expect(repeatedConstructiveReentry?.normalizedRole).toBe(
      "primary_candidate",
    );
    expect(oneCycleConstructiveReentry?.normalizedRole).toBe(
      "supporting_candidate",
    );
    expect(
      oneCycleConstructiveReentry?.suppressionReasons.some((reason) =>
        reason.includes(
          "repeated_trim_readd_with_constructive_reentry_followthrough",
        ),
      ),
    ).toBe(true);
  });

  it("demotes weaker repeated constructive re-entry and premature-exit ingredients when a richer combined storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const combinedStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_constructive_reentry_with_premature_final_exit",
    );
    const repeatedConstructiveReentry = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_trim_readd_with_constructive_reentry_followthrough",
    );
    const repeatedPrematureExit = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "repeated_trim_readd_with_premature_final_exit",
    );

    expect(combinedStory?.normalizedRole).toBe("primary_candidate");
    expect(repeatedConstructiveReentry?.normalizedRole).toBe(
      "supporting_candidate",
    );
    expect(repeatedPrematureExit?.normalizedRole).toBe("supporting_candidate");
    expect(
      repeatedPrematureExit?.suppressionReasons.some((reason) =>
        reason.includes("repeated_constructive_reentry_with_premature_final_exit"),
      ),
    ).toBe(true);
  });

  it("demotes the broad repeated premature-exit ingredients when a repeated balanced-management summary is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const broadSummary = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_balanced_management_with_premature_final_exit",
    );
    const repeatedPrematureExit = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "repeated_trim_readd_with_premature_final_exit",
    );

    expect(broadSummary?.normalizedRole).toBe("primary_candidate");
    expect(repeatedPrematureExit?.normalizedRole).toBe("supporting_candidate");
    expect(
      repeatedPrematureExit?.suppressionReasons.some((reason) =>
        reason.includes("repeated_balanced_management_with_premature_final_exit"),
      ),
    ).toBe(true);
  });

  it("demotes the broad repeated constructive-exit ingredients when a repeated balanced-management constructive summary is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const broadSummary = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_balanced_management_with_constructive_final_exit",
    );
    const repeatedConstructiveExit = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "repeated_trim_readd_with_constructive_final_exit",
    );

    expect(broadSummary?.normalizedRole).toBe("primary_candidate");
    expect(repeatedConstructiveExit?.normalizedRole).toBe(
      "supporting_candidate",
    );
    expect(
      repeatedConstructiveExit?.suppressionReasons.some((reason) =>
        reason.includes(
          "repeated_balanced_management_with_constructive_final_exit",
        ),
      ),
    ).toBe(true);
  });

  it("demotes the broad repeated missed-continuation ingredients when a repeated balanced-management missed-continuation summary is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const broadSummary = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_balanced_management_with_missed_final_continuation",
    );
    const repeatedMissedContinuation = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "repeated_trim_readd_with_missed_final_continuation",
    );

    expect(broadSummary?.normalizedRole).toBe("primary_candidate");
    expect(repeatedMissedContinuation?.normalizedRole).toBe(
      "supporting_candidate",
    );
    expect(
      repeatedMissedContinuation?.suppressionReasons.some((reason) =>
        reason.includes(
          "repeated_balanced_management_with_missed_final_continuation",
        ),
      ),
    ).toBe(true);
  });

  it("demotes the broad repeated balanced-management summary when a richer repeated constructive re-entry premature-exit storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        realizedReturnPct: 0.04,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 2,
        averageAdverseMovePctAfterPartialExitBeforeReadd: 0.02,
        averageFavorableMovePctAfterReaddBeforeNextExecution: 0.03,
        averageAdverseMovePctAfterReaddBeforeNextExecution: 0.01,
        readdsWithStrongerFavorableFollowthroughCount: 2,
        readdsWithStrongerAdverseFollowthroughCount: 0,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const repeatedConstructivePremature = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_constructive_reentry_with_premature_final_exit",
    );
    const broadSummary = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_balanced_management_with_premature_final_exit",
    );

    expect(repeatedConstructivePremature?.normalizedRole).toBe(
      "primary_candidate",
    );
    expect(broadSummary?.normalizedRole).toBe("supporting_candidate");
    expect(
      broadSummary?.suppressionReasons.some((reason) =>
        reason.includes("repeated_constructive_reentry_with_premature_final_exit"),
      ),
    ).toBe(true);
  });

  it("demotes weaker repeated constructive re-entry and constructive-exit ingredients when a richer positive combined storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const combinedStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_constructive_reentry_with_constructive_final_exit",
    );
    const repeatedConstructiveReentry = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_trim_readd_with_constructive_reentry_followthrough",
    );
    const repeatedConstructiveExit = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "repeated_trim_readd_with_constructive_final_exit",
    );

    expect(combinedStory?.normalizedRole).toBe("primary_candidate");
    expect(repeatedConstructiveReentry?.normalizedRole).toBe(
      "supporting_candidate",
    );
    expect(repeatedConstructiveExit?.normalizedRole).toBe(
      "supporting_candidate",
    );
    expect(
      repeatedConstructiveExit?.suppressionReasons.some((reason) =>
        reason.includes(
          "repeated_constructive_reentry_with_constructive_final_exit",
        ),
      ),
    ).toBe(true);
  });

  it("demotes the broad repeated balanced-management constructive summary when a richer repeated constructive re-entry constructive-exit storyline is present", () => {
    const detected = detectPatterns(
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
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const repeatedConstructiveStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_constructive_reentry_with_constructive_final_exit",
    );
    const broadSummary = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_balanced_management_with_constructive_final_exit",
    );

    expect(repeatedConstructiveStory?.normalizedRole).toBe(
      "primary_candidate",
    );
    expect(broadSummary?.normalizedRole).toBe("supporting_candidate");
    expect(
      broadSummary?.suppressionReasons.some((reason) =>
        reason.includes(
          "repeated_constructive_reentry_with_constructive_final_exit",
        ),
      ),
    ).toBe(true);
  });

  it("demotes weaker repeated constructive re-entry ingredients when a richer repeated stop-like breakdown storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const combinedStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    );
    const repeatedConstructiveReentry = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_trim_readd_with_constructive_reentry_followthrough",
    );

    expect(combinedStory?.normalizedRole).toBe("primary_candidate");
    expect(repeatedConstructiveReentry?.normalizedRole).toBe(
      "supporting_candidate",
    );
    expect(
      repeatedConstructiveReentry?.suppressionReasons.some((reason) =>
        reason.includes(
          "repeated_constructive_reentry_with_stop_like_forced_exit_after_breakdown",
        ),
      ),
    ).toBe(true);
  });

  it("demotes the broad repeated defensive-exit ingredient when a repeated balanced-management stop-like breakdown summary is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const broadSummary = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_balanced_management_with_stop_like_forced_exit_after_breakdown",
    );
    const repeatedDefensiveExit = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    );

    expect(broadSummary?.normalizedRole).toBe("primary_candidate");
    expect(repeatedDefensiveExit?.normalizedRole).toBe("supporting_candidate");
    expect(
      repeatedDefensiveExit?.suppressionReasons.some((reason) =>
        reason.includes(
          "repeated_balanced_management_with_stop_like_forced_exit_after_breakdown",
        ),
      ),
    ).toBe(true);
  });

  it("demotes weaker repeated constructive re-entry ingredients when a richer repeated stop-like rebound storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const combinedStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_constructive_reentry_with_stop_like_forced_exit_before_rebound",
    );
    const repeatedConstructiveReentry = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_trim_readd_with_constructive_reentry_followthrough",
    );

    expect(combinedStory?.normalizedRole).toBe("primary_candidate");
    expect(repeatedConstructiveReentry?.normalizedRole).toBe(
      "supporting_candidate",
    );
    expect(
      repeatedConstructiveReentry?.suppressionReasons.some((reason) =>
        reason.includes(
          "repeated_constructive_reentry_with_stop_like_forced_exit_before_rebound",
        ),
      ),
    ).toBe(true);
  });

  it("demotes the broad repeated fearful-exit ingredient when a repeated balanced-management stop-like rebound summary is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const broadSummary = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_balanced_management_with_stop_like_forced_exit_before_rebound",
    );
    const repeatedFearfulExit = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "repeated_trim_readd_with_fearful_final_exit",
    );

    expect(broadSummary?.normalizedRole).toBe("primary_candidate");
    expect(repeatedFearfulExit?.normalizedRole).toBe("supporting_candidate");
    expect(
      repeatedFearfulExit?.suppressionReasons.some((reason) =>
        reason.includes(
          "repeated_balanced_management_with_stop_like_forced_exit_before_rebound",
        ),
      ),
    ).toBe(true);
  });

  it("demotes weaker recovery and repeated constructive re-entry ingredients when a richer rescue storyline with premature final exit is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const rescueStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_rescue_attempts_with_premature_final_exit_after_constructive_reentries",
    );
    const repeatedConstructiveReentry = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_constructive_reentry_with_premature_final_exit",
    );
    const repeatedPrematureExit = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "repeated_trim_readd_with_premature_final_exit",
    );
    const stabilizedRecovery = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_after_early_adversity_with_stabilized_management",
    );

    expect(rescueStory?.normalizedRole).toBe("primary_candidate");
    expect(repeatedConstructiveReentry?.normalizedRole).toBe(
      "supporting_candidate",
    );
    expect(repeatedPrematureExit?.normalizedRole).toBe("supporting_candidate");
    expect(stabilizedRecovery?.normalizedRole).toBe("supporting_candidate");
    expect(
      repeatedPrematureExit?.suppressionReasons.some((reason) =>
        reason.includes(
          "repeated_rescue_attempts_with_premature_final_exit_after_constructive_reentries",
        ),
      ),
    ).toBe(true);
  });

  it("demotes the broad repeated balanced-management summary when a recovery-aware repeated balanced-management premature-exit storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const rescueSummary = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_rescue_attempts_with_balanced_management_and_premature_final_exit",
    );
    const broadSummary = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_balanced_management_with_premature_final_exit",
    );
    const stabilizedRecovery = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_after_early_adversity_with_stabilized_management",
    );

    expect(rescueSummary?.normalizedRole).toBe("primary_candidate");
    expect(broadSummary?.normalizedRole).toBe("supporting_candidate");
    expect(stabilizedRecovery?.normalizedRole).toBe("supporting_candidate");
    expect(
      broadSummary?.suppressionReasons.some((reason) =>
        reason.includes(
          "repeated_rescue_attempts_with_balanced_management_and_premature_final_exit",
        ),
      ),
    ).toBe(true);
  });

  it("demotes the broad repeated balanced-management constructive summary when a recovery-aware repeated balanced-management constructive storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        hadOpenLossBeforePeakOpenProfit: true,
        peakOpenProfitPctOfBasis: 0.08,
        hadPeakOpenProfitBeforeWorstDrawdown: true,
        hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: false,
        secondsFromPeakOpenProfitToFirstReduction: null,
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        reductionAbovePreviousAverageEntryCount: 0,
        reductionBelowPreviousAverageEntryCount: 0,
        averageReductionPriceVsPreviousAverageEntryPct: null,
        averageReductionPricePositionInRecentRangePct: null,
        reductionsNearRecentHighCount: 0,
        reductionsNearRecentLowCount: 0,
        averageReductionRecentRunUpPctBeforeExecution: null,
        averageReductionRecentDropPctBeforeExecution: null,
        reductionsWithRecentRunUpCount: 0,
        reductionsWithRecentDropCount: 0,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 0,
        readdsWithStrongerFavorableFollowthroughCount: 0,
        readdsWithStrongerAdverseFollowthroughCount: 0,
        addCountAfterInitialEntry: 0,
        addAbovePreviousAverageEntryCount: 0,
        addBelowPreviousAverageEntryCount: 0,
        averageAddPriceVsPreviousAverageEntryPct: null,
        averageAddPricePositionInRecentRangePct: null,
        averageAddRecentRunUpPctBeforeExecution: null,
        averageAddRecentDropPctBeforeExecution: null,
        addsWithRecentRunUpCount: 0,
        addsWithRecentDropCount: 0,
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const rescueSummary = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_rescue_attempts_with_balanced_management_and_constructive_final_exit",
    );
    const broadSummary = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_balanced_management_with_constructive_final_exit",
    );

    expect(rescueSummary?.normalizedRole).toBe("primary_candidate");
    expect(broadSummary?.normalizedRole).toBe("supporting_candidate");
    expect(
      broadSummary?.suppressionReasons.some((reason) =>
        reason.includes(
          "repeated_rescue_attempts_with_balanced_management_and_constructive_final_exit",
        ),
      ),
    ).toBe(true);
  });

  it("demotes the broad repeated balanced-management missed-continuation summary when a recovery-aware repeated balanced-management missed-continuation storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const rescueSummary = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_rescue_attempts_with_balanced_management_and_missed_final_continuation",
    );
    const broadSummary = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_balanced_management_with_missed_final_continuation",
    );

    expect(rescueSummary?.normalizedRole).toBe("primary_candidate");
    expect(broadSummary?.normalizedRole).toBe("supporting_candidate");
    expect(
      broadSummary?.suppressionReasons.some((reason) =>
        reason.includes(
          "repeated_rescue_attempts_with_balanced_management_and_missed_final_continuation",
        ),
      ),
    ).toBe(true);
  });

  it("demotes the recovery-aware broad repeated balanced-management summary when a richer rescue storyline with constructive re-entries and premature final exit is present", () => {
    const detected = detectPatterns(
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
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.05,
        maxAdverseMovePctAfterExit: 0.01,
        netMovePctAtEndOfPostExitWindow: 0.03,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const rescueConstructiveStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_rescue_attempts_with_premature_final_exit_after_constructive_reentries",
    );
    const rescueBroadSummary = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_rescue_attempts_with_balanced_management_and_premature_final_exit",
    );

    expect(rescueConstructiveStory?.normalizedRole).toBe("primary_candidate");
    expect(rescueBroadSummary?.normalizedRole).toBe("supporting_candidate");
    expect(
      rescueBroadSummary?.suppressionReasons.some((reason) =>
        reason.includes(
          "repeated_rescue_attempts_with_premature_final_exit_after_constructive_reentries",
        ),
      ),
    ).toBe(true);
  });

  it("demotes the recovery-aware broad repeated balanced-management constructive summary when a richer rescue storyline with constructive re-entries and constructive final exit is present", () => {
    const detected = detectPatterns(
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
        maxGivebackFromPeakOpenProfitPct: 0.18,
        postExitCandleCount: 2,
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const rescueConstructiveStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_rescue_attempts_with_constructive_final_exit_after_constructive_reentries",
    );
    const rescueBroadSummary = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_rescue_attempts_with_balanced_management_and_constructive_final_exit",
    );

    expect(rescueConstructiveStory?.normalizedRole).toBe("primary_candidate");
    expect(rescueBroadSummary?.normalizedRole).toBe("supporting_candidate");
    expect(
      rescueBroadSummary?.suppressionReasons.some((reason) =>
        reason.includes(
          "repeated_rescue_attempts_with_constructive_final_exit_after_constructive_reentries",
        ),
      ),
    ).toBe(true);
  });

  it("demotes the broad repeated balanced-management stop-like breakdown summary when a recovery-aware repeated balanced-management stop-like breakdown storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const rescueSummary = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_after_breakdown",
    );
    const broadSummary = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_balanced_management_with_stop_like_forced_exit_after_breakdown",
    );
    const failedRecovery = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_after_early_adversity_with_failed_protection",
    );

    expect(rescueSummary?.normalizedRole).toBe("primary_candidate");
    expect(broadSummary?.normalizedRole).toBe("supporting_candidate");
    expect(failedRecovery?.normalizedRole).toBe("supporting_candidate");
    expect(
      broadSummary?.suppressionReasons.some((reason) =>
        reason.includes(
          "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_after_breakdown",
        ),
      ),
    ).toBe(true);
  });

  it("demotes the broad repeated balanced-management stop-like rebound summary when a recovery-aware repeated balanced-management stop-like rebound storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const rescueSummary = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    );
    const broadSummary = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_balanced_management_with_stop_like_forced_exit_before_rebound",
    );
    const failedRecovery = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_after_early_adversity_with_failed_protection",
    );

    expect(rescueSummary?.normalizedRole).toBe("primary_candidate");
    expect(broadSummary?.normalizedRole).toBe("supporting_candidate");
    expect(failedRecovery?.normalizedRole).toBe("supporting_candidate");
    expect(
      broadSummary?.suppressionReasons.some((reason) =>
        reason.includes(
          "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_before_rebound",
        ),
      ),
    ).toBe(true);
  });

  it("demotes weaker recovery and repeated constructive re-entry ingredients when a richer rescue storyline with constructive final exit is present", () => {
    const detected = detectPatterns(
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
        maxFavorableMovePctAfterExit: 0.01,
        maxAdverseMovePctAfterExit: 0.04,
        netMovePctAtEndOfPostExitWindow: -0.02,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const rescueStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_rescue_attempts_with_constructive_final_exit_after_constructive_reentries",
    );
    const repeatedConstructiveReentry = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_constructive_reentry_with_constructive_final_exit",
    );
    const repeatedConstructiveExit = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "repeated_trim_readd_with_constructive_final_exit",
    );
    const stabilizedRecovery = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "stabilized_recovery_with_constructive_final_exit",
    );

    expect(rescueStory?.normalizedRole).toBe("primary_candidate");
    expect(repeatedConstructiveReentry?.normalizedRole).toBe(
      "supporting_candidate",
    );
    expect(repeatedConstructiveExit?.normalizedRole).toBe(
      "supporting_candidate",
    );
    expect(stabilizedRecovery?.normalizedRole).toBe("supporting_candidate");
    expect(
      repeatedConstructiveExit?.suppressionReasons.some((reason) =>
        reason.includes(
          "repeated_rescue_attempts_with_constructive_final_exit_after_constructive_reentries",
        ),
      ),
    ).toBe(true);
  });

  it("demotes weaker recovery and repeated constructive re-entry ingredients when a richer rescue storyline with stop-like breakdown exit is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const rescueStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_rescue_attempts_with_stop_like_forced_exit_after_constructive_reentries",
    );
    const repeatedConstructiveReentry = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    );
    const failedProtectionRecovery = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_after_early_adversity_with_failed_protection",
    );

    expect(rescueStory?.normalizedRole).toBe("primary_candidate");
    expect(repeatedConstructiveReentry?.normalizedRole).toBe(
      "supporting_candidate",
    );
    expect(failedProtectionRecovery?.normalizedRole).toBe(
      "supporting_candidate",
    );
  });

  it("demotes weaker recovery and repeated constructive re-entry ingredients when a richer rescue storyline with stop-like rebound exit is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const rescueStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_rescue_attempts_with_stop_like_forced_exit_before_rebound_after_constructive_reentries",
    );
    const repeatedConstructiveReentry = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_constructive_reentry_with_stop_like_forced_exit_before_rebound",
    );
    const failedProtectionRecovery = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_after_early_adversity_with_failed_protection",
    );

    expect(rescueStory?.normalizedRole).toBe("primary_candidate");
    expect(repeatedConstructiveReentry?.normalizedRole).toBe(
      "supporting_candidate",
    );
    expect(failedProtectionRecovery?.normalizedRole).toBe(
      "supporting_candidate",
    );
  });

  it("demotes weaker one-cycle unstable trim/readd ingredients when a richer repeated-cycle unstable storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        partialExitCount: 2,
        hadPartialExit: true,
        readdAfterReductionCount: 2,
        hadReaddAfterReduction: true,
        maxGivebackFromPeakOpenProfitPct: 0.65,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const repeatedUnstable = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "repeated_trim_readd_with_unstable_management",
    );
    const repeatedDefensive = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    );
    const readdFact = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "readd_after_reduction",
    );

    expect(repeatedDefensive?.normalizedRole).toBe("supporting_candidate");
    expect(repeatedUnstable?.normalizedRole).toBe("supporting_candidate");
    expect(readdFact?.normalizedRole).toBe("supporting_candidate");
    expect(
      readdFact?.suppressionReasons.some((reason) =>
        reason.includes(
          "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
        ) || reason.includes("repeated_trim_readd_with_unstable_management"),
      ),
    ).toBe(true);
  });

  it("demotes weaker one-cycle deteriorating re-entry ingredients when a richer repeated-cycle deteriorating re-entry storyline is present", () => {
    const detected = detectPatterns(
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
        postExitCandleCount: 0,
        maxFavorableMovePctAfterExit: null,
        maxAdverseMovePctAfterExit: null,
        netMovePctAtEndOfPostExitWindow: null,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const repeatedDeterioratingReentry =
      normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "repeated_trim_readd_with_deteriorating_reentry",
      );
    const oneCycleDeterioratingReentry =
      normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId === "deteriorating_reentry_after_trim",
      );

    expect(repeatedDeterioratingReentry?.normalizedRole).toBe(
      "primary_candidate",
    );
    expect(oneCycleDeterioratingReentry?.normalizedRole).toBe(
      "supporting_candidate",
    );
    expect(
      oneCycleDeterioratingReentry?.suppressionReasons.some((reason) =>
        reason.includes("repeated_trim_readd_with_deteriorating_reentry"),
      ),
    ).toBe(true);
  });

  it("demotes weaker repeated deteriorating re-entry and defensive-exit ingredients when a richer combined storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const combinedStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_deteriorating_reentry_with_defensive_final_exit",
    );
    const repeatedDeterioratingReentry =
      normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "repeated_trim_readd_with_deteriorating_reentry",
      );
    const repeatedDefensiveExit = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    );

    expect(combinedStory?.normalizedRole).toBe("primary_candidate");
    expect(repeatedDeterioratingReentry?.normalizedRole).toBe(
      "supporting_candidate",
    );
    expect(repeatedDefensiveExit?.normalizedRole).toBe("supporting_candidate");
    expect(
      repeatedDefensiveExit?.suppressionReasons.some((reason) =>
        reason.includes(
          "repeated_deteriorating_reentry_with_defensive_final_exit",
        ),
      ),
    ).toBe(true);
  });

  it("demotes weaker recovery and repeated deteriorating re-entry ingredients when a richer rescue storyline with defensive final exit is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const rescueStory = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_rescue_attempts_with_defensive_final_exit_after_deteriorating_reentries",
    );
    const repeatedDeterioratingReentry =
      normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "repeated_deteriorating_reentry_with_defensive_final_exit",
      );
    const repeatedDefensiveExit = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    );
    const failedRecovery = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "recovery_after_early_adversity_with_failed_protection",
    );

    expect(rescueStory?.normalizedRole).toBe("primary_candidate");
    expect(repeatedDeterioratingReentry?.normalizedRole).toBe(
      "supporting_candidate",
    );
    expect(repeatedDefensiveExit?.normalizedRole).toBe("supporting_candidate");
    expect(failedRecovery?.normalizedRole).toBe("supporting_candidate");
    expect(
      repeatedDefensiveExit?.suppressionReasons.some((reason) =>
        reason.includes(
          "repeated_rescue_attempts_with_defensive_final_exit_after_deteriorating_reentries",
        ),
      ),
    ).toBe(true);
  });

  it("demotes weaker chase re-entry ingredients when a richer chase re-entry storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 0,
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

    const normalized = normalizeDetectedPatterns(detected);

    const chaseReentry = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "late_chase_reentry_after_constructive_trim",
    );
    const runUpAdd = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "add_after_recent_run_up",
    );

    expect(chaseReentry?.normalizedRole).toBe("primary_candidate");
    expect(runUpAdd?.normalizedRole).toBe("supporting_candidate");
    expect(
      runUpAdd?.suppressionReasons.some((reason) =>
        reason.includes("late_chase_reentry_after_constructive_trim"),
      ),
    ).toBe(true);
  });

  it("demotes weaker re-entry setup ingredients when a richer constructive post-reentry followthrough storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 0,
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

    const normalized = normalizeDetectedPatterns(detected);

    const constructiveReentry = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "constructive_reentry_followthrough_after_trim",
    );
    const pullbackReentry = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "good_pullback_reentry_after_constructive_trim",
    );

    expect(constructiveReentry?.normalizedRole).toBe("primary_candidate");
    expect(pullbackReentry?.normalizedRole).toBe("supporting_candidate");
    expect(
      pullbackReentry?.suppressionReasons.some((reason) =>
        reason.includes("constructive_reentry_followthrough_after_trim"),
      ),
    ).toBe(true);
  });

  it("demotes weaker re-entry setup ingredients when a richer deteriorating post-reentry storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const deterioratingReentry = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "deteriorating_reentry_after_trim",
    );
    const chaseReentry = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "late_chase_reentry_after_constructive_trim",
    );

    expect(deterioratingReentry?.normalizedRole).toBe("primary_candidate");
    expect(chaseReentry?.normalizedRole).toBe("supporting_candidate");
    expect(
      chaseReentry?.suppressionReasons.some((reason) =>
        reason.includes("deteriorating_reentry_after_trim"),
      ),
    ).toBe(true);
  });

  it("demotes weaker pullback re-entry ingredients when a richer pullback re-entry storyline is present", () => {
    const detected = detectPatterns(
      createBasePatternInput({
        addCountAfterInitialEntry: 1,
        totalPositionDecreaseCount: 0,
        hadPartialExit: true,
        partialExitCount: 1,
        hadReaddAfterReduction: true,
        readdAfterReductionCount: 1,
        averageFavorableMovePctAfterPartialExitBeforeReadd: 0.01,
        averageAdverseMovePctAfterPartialExitBeforeReadd: 0.02,
        readdsAfterRecentRunUpCount: 0,
        readdsAfterRecentDropCount: 1,
        readdsWithStrongerFavorableFollowthroughCount: 0,
        readdsWithStrongerAdverseFollowthroughCount: 0,
        averageFavorableMovePctAfterReaddBeforeNextExecution: null,
        averageAdverseMovePctAfterReaddBeforeNextExecution: null,
      }),
    );

    const normalized = normalizeDetectedPatterns(detected);

    const pullbackReentry = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "good_pullback_reentry_after_constructive_trim",
    );
    const readdFact = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "readd_after_reduction",
    );

    expect(pullbackReentry?.normalizedRole).toBe("primary_candidate");
    expect(readdFact?.normalizedRole).toBe("supporting_candidate");
    expect(
      readdFact?.suppressionReasons.some((reason) =>
        reason.includes("good_pullback_reentry_after_constructive_trim"),
      ),
    ).toBe(true);
  });

  it("demotes weaker repeated-cycle continuation ingredients when a richer repeated-cycle missed-continuation storyline is present", () => {
    const detected = detectPatterns(
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

    const normalized = normalizeDetectedPatterns(detected);

    const repeatedMissedContinuation = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId ===
        "repeated_balanced_management_with_missed_final_continuation",
    );
    const missedContinuation = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "missed_post_exit_continuation",
    );

    expect(repeatedMissedContinuation?.normalizedRole).toBe("primary_candidate");
    expect(missedContinuation?.normalizedRole).toBe("supporting_candidate");
    expect(
      missedContinuation?.suppressionReasons.some((reason) =>
        reason.includes("repeated_balanced_management_with_missed_final_continuation"),
      ),
    ).toBe(true);
  });

  it("demotes broad low-range entry when the richer support-aware entry pattern is present", () => {
    const normalized = normalizeDetectedPatterns(
      detectPatterns(
        createBasePatternInput({
          firstEntryPricePositionInTradeRangePct: 0.2,
          firstEntryOccurredNearSupport: true,
          firstEntryOccurredNearResistance: false,
          hadSupportResistanceContextAvailable: true,
        }),
      ),
    );

    const supportAware = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "entry_near_support_structure",
    );
    const lowRange = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "low_range_entry",
    );

    expect(supportAware?.normalizedRole).toBe("primary_candidate");
    expect(lowRange?.normalizedRole).toBe("supporting_candidate");
  });

    it("demotes the broader support-aware exit fact when the richer relief-after-exit variant is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
        createBasePatternInput({
          hadSupportResistanceContextAvailable: true,
          finalExitOccurredNearSupport: true,
          finalExitDistanceToNearestSupportPct: 0.001,
          maxFavorableMovePctAfterExit: 0.03,
          netMovePctAtEndOfPostExitWindow: 0.01,
        }),
      ),
    );

    const richer = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "exit_into_support_with_relief_after_exit",
    );
    const broader = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "exit_into_support_structure",
    );

      expect(richer?.normalizedRole).toBe("primary_candidate");
      expect(broader?.normalizedRole).toBe("supporting_candidate");
    });

    it("demotes the generic breakout entry when the support-aware breakout with room-above variant is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
          createBasePatternInput({
            hadSupportResistanceContextAvailable: true,
            firstEntryPricePositionInTradeRangePct: 0.2,
            firstEntryRecentNetMovePctBeforeEntry: 0.05,
            firstEntryClearedNearestResistanceBelow: true,
            firstEntryHadRoomAboveAfterClearingResistance: true,
            firstEntryDistanceAboveNearestResistanceBelowPct: 0.006,
            firstEntryDistanceToNearestResistancePct: 0.028,
            firstEntryOccurredNearResistance: false,
            firstEntryCapturedPercentOfTradeMfe: 0.8,
            firstEntryToWorstMovePct: 0.01,
            maxGivebackFromPeakOpenProfitPct: 0.4,
            postExitCandleCount: 0,
          }),
        ),
      );

      const richer = normalized.prioritizedPatterns.find(
        (pattern) => pattern.patternId === "breakout_with_room_above_structure",
      );
      const broader = normalized.prioritizedPatterns.find(
        (pattern) => pattern.patternId === "breakout_entry_structure",
      );

      expect(richer?.normalizedRole).toBe("primary_candidate");
      expect(broader?.normalizedRole).toBe("supporting_candidate");
    });

    it("demotes the broad room-above breakout fact when the constructive final-exit variant is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
          createBasePatternInput({
            hadSupportResistanceContextAvailable: true,
            firstEntryPricePositionInTradeRangePct: 0.2,
            firstEntryRecentNetMovePctBeforeEntry: 0.05,
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
        ),
      );

      const richer = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "breakout_with_room_above_and_constructive_final_exit",
      );
      const broader = normalized.prioritizedPatterns.find(
        (pattern) => pattern.patternId === "breakout_with_room_above_structure",
      );

      expect(richer?.normalizedRole).toBe("primary_candidate");
      expect(broader?.normalizedRole).toBe("supporting_candidate");
    });

    it("demotes the broad room-above breakout fact when the failed-profit-protection variant is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
          createBasePatternInput({
            hadSupportResistanceContextAvailable: true,
            firstEntryPricePositionInTradeRangePct: 0.2,
            firstEntryRecentNetMovePctBeforeEntry: 0.05,
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
        ),
      );

      const richer = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "breakout_with_room_above_and_failed_profit_protection",
      );
      const broader = normalized.prioritizedPatterns.find(
        (pattern) => pattern.patternId === "breakout_with_room_above_structure",
      );

      expect(richer?.normalizedRole).toBe("primary_candidate");
      expect(broader?.normalizedRole).toBe("supporting_candidate");
    });

    it("demotes the non-recovery room-above constructive branch when the recovery-aware constructive variant is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
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
        ),
      );

      const richer = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "recovery_with_breakout_with_room_above_and_constructive_final_exit",
      );
      const broader = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId === "breakout_with_room_above_and_constructive_final_exit",
      );

      expect(richer?.normalizedRole).toBe("primary_candidate");
      expect(broader?.normalizedRole).toBe("supporting_candidate");
    });

    it("demotes the non-recovery room-above failed-protection branch when the recovery-aware failed-protection variant is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
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
        ),
      );

      const richer = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "recovery_with_breakout_with_room_above_and_failed_profit_protection",
      );
      const broader = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId === "breakout_with_room_above_and_failed_profit_protection",
      );

      expect(richer?.normalizedRole).toBe("primary_candidate");
      expect(broader?.normalizedRole).toBe("supporting_candidate");
    });

    it("demotes entry-under-resistance when the overhead-resistance breakout variant is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
          createBasePatternInput({
            hadSupportResistanceContextAvailable: true,
            firstEntryClearedNearestResistanceBelow: true,
            firstEntryHadRoomAboveAfterClearingResistance: false,
            firstEntryHasStackedResistanceAbove: true,
            firstEntryResistanceLevelsAboveWithinClusterCount: 2,
            firstEntryOccurredNearResistance: true,
            firstEntryCapturedPercentOfTradeMfe: 0.2,
            firstEntryToWorstMovePct: 0.03,
            closedToFlat: false,
            totalPositionDecreaseCount: 0,
            postExitCandleCount: 0,
            maxGivebackFromPeakOpenProfitPct: 0.3,
            peakOpenProfitPctOfBasis: 0.02,
          }),
        ),
      );

      const richer = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId === "breakout_into_overhead_resistance_structure",
      );
      const broaderResistance = normalized.prioritizedPatterns.find(
        (pattern) => pattern.patternId === "entry_under_resistance_structure",
      );

      expect(richer?.normalizedRole).toBe("primary_candidate");
      expect(broaderResistance?.normalizedRole).toBe("supporting_candidate");
    });

    it("demotes the broad overhead-resistance breakout fact when the defensive-final-exit variant is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
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
        ),
      );

      const richer = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "breakout_into_overhead_resistance_with_defensive_final_exit",
      );
      const broader = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId === "breakout_into_overhead_resistance_structure",
      );

      expect(richer?.normalizedRole).toBe("primary_candidate");
      expect(broader?.normalizedRole).toBe("supporting_candidate");
    });

    it("demotes the broad overhead-resistance breakout fact when the failed-profit-protection variant is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
          createBasePatternInput({
            hadSupportResistanceContextAvailable: true,
            firstEntryClearedNearestResistanceBelow: true,
            firstEntryHadRoomAboveAfterClearingResistance: false,
            firstEntryHasStackedResistanceAbove: true,
            firstEntryResistanceLevelsAboveWithinClusterCount: 2,
            firstEntryCapturedPercentOfTradeMfe: 0.2,
            firstEntryToWorstMovePct: 0.03,
            maxGivebackFromPeakOpenProfitPct: 0.6,
            peakOpenProfitPctOfBasis: 0.08,
          }),
        ),
      );

      const richer = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "breakout_into_overhead_resistance_with_failed_profit_protection",
      );
      const broader = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId === "breakout_into_overhead_resistance_structure",
      );

      expect(richer?.normalizedRole).toBe("primary_candidate");
      expect(broader?.normalizedRole).toBe("supporting_candidate");
    });

    it("demotes the non-recovery overhead-resistance defensive branch when the recovery-aware defensive variant is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
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
        ),
      );

      const richer = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "recovery_with_breakout_into_overhead_resistance_and_defensive_final_exit",
      );
      const broader = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "breakout_into_overhead_resistance_with_defensive_final_exit",
      );

      expect(richer?.normalizedRole).toBe("primary_candidate");
      expect(broader?.normalizedRole).toBe("supporting_candidate");
    });

    it("demotes the non-recovery overhead-resistance failed-protection branch when the recovery-aware failed-protection variant is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
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
        ),
      );

      const richer = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "recovery_with_breakout_into_overhead_resistance_and_failed_profit_protection",
      );
      const broader = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "breakout_into_overhead_resistance_with_failed_profit_protection",
      );

      expect(richer?.normalizedRole).toBe("primary_candidate");
      expect(broader?.normalizedRole).toBe("supporting_candidate");
    });

    it("demotes add into resistance when the richer add-above-resistance variant is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
          createBasePatternInput({
            hadSupportResistanceContextAvailable: true,
            totalPositionIncreaseCount: 1,
            hadMultipleIncreases: false,
            addCountAfterInitialEntry: 1,
            addsNearResistanceCount: 1,
            addsAboveResistanceCount: 1,
            addsAboveResistanceWithRoomCount: 1,
            averageAddRoomToNextResistancePct: 0.021,
            addAbovePreviousAverageEntryCount: 0,
            averageAddPriceVsPreviousAverageEntryPct: null,
            averageAddPricePositionInRecentRangePct: 0.5,
            averageAddRecentRunUpPctBeforeExecution: 0.01,
            averageAddRecentDropPctBeforeExecution: 0.01,
            addsWithRecentRunUpCount: 0,
            addsWithRecentDropCount: 0,
          }),
        ),
      );

      const richer = normalized.prioritizedPatterns.find(
        (pattern) => pattern.patternId === "add_above_resistance_structure",
      );
      const broader = normalized.prioritizedPatterns.find(
        (pattern) => pattern.patternId === "add_into_resistance_structure",
      );

      expect(richer).toBeDefined();
      expect(broader?.normalizedRole).toBe("supporting_candidate");
    });

    it("demotes the broad add-above-resistance fact when the constructive final-exit variant is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
          createBasePatternInput({
            hadSupportResistanceContextAvailable: true,
            totalPositionIncreaseCount: 1,
            hadMultipleIncreases: false,
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
        ),
      );

      const richer = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "add_above_resistance_with_constructive_final_exit",
      );
      const broader = normalized.prioritizedPatterns.find(
        (pattern) => pattern.patternId === "add_above_resistance_structure",
      );

      expect(richer?.normalizedRole).toBe("primary_candidate");
      expect(broader?.normalizedRole).toBe("supporting_candidate");
    });

    it("demotes the broad add-above-resistance fact when the failed-profit-protection variant is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
          createBasePatternInput({
            hadSupportResistanceContextAvailable: true,
            totalPositionIncreaseCount: 1,
            hadMultipleIncreases: false,
            addCountAfterInitialEntry: 1,
            addsAboveResistanceCount: 1,
            addsAboveResistanceWithRoomCount: 1,
            averageAddRoomToNextResistancePct: 0.021,
            maxGivebackFromPeakOpenProfitPct: 0.6,
            peakOpenProfitPctOfBasis: 0.08,
          }),
        ),
      );

      const richer = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "add_above_resistance_with_failed_profit_protection",
      );
      const broader = normalized.prioritizedPatterns.find(
        (pattern) => pattern.patternId === "add_above_resistance_structure",
      );

      expect(richer?.normalizedRole).toBe("primary_candidate");
      expect(broader?.normalizedRole).toBe("supporting_candidate");
    });

    it("demotes the non-recovery add-above-resistance constructive branch when the recovery-aware variant is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
          createBasePatternInput({
            hadOpenLossBeforePeakOpenProfit: true,
            peakOpenProfitPctOfBasis: 0.08,
            realizedReturnPct: 0.03,
            hadSupportResistanceContextAvailable: true,
            totalPositionIncreaseCount: 1,
            hadMultipleIncreases: false,
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
        ),
      );

      const richer = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "recovery_with_add_above_resistance_and_constructive_final_exit",
      );
      const broader = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId === "add_above_resistance_with_constructive_final_exit",
      );

      expect(richer?.normalizedRole).toBe("primary_candidate");
      expect(broader?.normalizedRole).toBe("supporting_candidate");
    });

    it("demotes the non-recovery add-above-resistance failed-protection branch when the recovery-aware variant is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
          createBasePatternInput({
            hadOpenLossBeforePeakOpenProfit: true,
            peakOpenProfitPctOfBasis: 0.08,
            hadSupportResistanceContextAvailable: true,
            totalPositionIncreaseCount: 1,
            hadMultipleIncreases: false,
            addCountAfterInitialEntry: 1,
            addsAboveResistanceCount: 1,
            addsAboveResistanceWithRoomCount: 1,
            averageAddRoomToNextResistancePct: 0.021,
            addAbovePreviousAverageEntryCount: 0,
            averageAddPriceVsPreviousAverageEntryPct: null,
            averageAddPricePositionInRecentRangePct: 0.5,
            maxGivebackFromPeakOpenProfitPct: 0.6,
          }),
        ),
      );

      const richer = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "recovery_with_add_above_resistance_and_failed_profit_protection",
      );
      const broader = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId === "add_above_resistance_with_failed_profit_protection",
      );

      expect(richer?.normalizedRole).toBe("primary_candidate");
      expect(broader?.normalizedRole).toBe("supporting_candidate");
    });

    it("demotes the one-cycle add-above-resistance constructive branch when the repeated variant is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
          createBasePatternInput({
            hadSupportResistanceContextAvailable: true,
            totalPositionIncreaseCount: 2,
            hadMultipleIncreases: true,
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
        ),
      );

      const richer = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "repeated_adds_above_resistance_with_constructive_final_exit",
      );
      const broader = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId === "add_above_resistance_with_constructive_final_exit",
      );

      expect(richer?.normalizedRole).toBe("primary_candidate");
      expect(broader?.normalizedRole).toBe("supporting_candidate");
    });

    it("demotes the one-cycle add-above-resistance failed-protection branch when the repeated variant is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
          createBasePatternInput({
            hadSupportResistanceContextAvailable: true,
            totalPositionIncreaseCount: 2,
            hadMultipleIncreases: true,
            addCountAfterInitialEntry: 2,
            addsAboveResistanceCount: 2,
            addsAboveResistanceWithRoomCount: 2,
            averageAddRoomToNextResistancePct: 0.021,
            maxGivebackFromPeakOpenProfitPct: 0.6,
            peakOpenProfitPctOfBasis: 0.08,
          }),
        ),
      );

      const richer = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "repeated_adds_above_resistance_with_failed_profit_protection",
      );
      const broader = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId === "add_above_resistance_with_failed_profit_protection",
      );

      expect(richer?.normalizedRole).toBe("primary_candidate");
      expect(broader?.normalizedRole).toBe("supporting_candidate");
    });

    it("demotes the broader exit-into-support fact when the breakdown-after-exit variant is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
          createBasePatternInput({
            hadSupportResistanceContextAvailable: true,
            finalExitOccurredNearSupport: true,
            finalExitDistanceToNearestSupportPct: 0.001,
            finalExitSupportLevelsBelowWithinClusterCount: 2,
            finalExitHasStackedSupportBelow: true,
            maxFavorableMovePctAfterExit: 0.005,
            maxAdverseMovePctAfterExit: 0.03,
            netMovePctAtEndOfPostExitWindow: -0.02,
          }),
        ),
      );

      const richer = normalized.prioritizedPatterns.find(
        (pattern) => pattern.patternId === "exit_into_support_before_breakdown",
      );
      const broader = normalized.prioritizedPatterns.find(
        (pattern) => pattern.patternId === "exit_into_support_structure",
      );

      expect(richer?.normalizedRole).toBe("primary_candidate");
      expect(broader?.normalizedRole).toBe("supporting_candidate");
    });

    it("demotes the broader relief-after-exit support fact when the stacked-support variant is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
          createBasePatternInput({
            hadSupportResistanceContextAvailable: true,
            finalExitOccurredNearSupport: true,
            finalExitDistanceToNearestSupportPct: 0.001,
            finalExitSupportLevelsBelowWithinClusterCount: 2,
            finalExitHasStackedSupportBelow: true,
            maxFavorableMovePctAfterExit: 0.03,
            netMovePctAtEndOfPostExitWindow: 0.01,
          }),
        ),
      );

      const richer = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId === "exit_into_stacked_support_with_relief_after_exit",
      );
      const broader = normalized.prioritizedPatterns.find(
        (pattern) => pattern.patternId === "exit_into_support_with_relief_after_exit",
      );

      expect(richer?.normalizedRole).toBe("primary_candidate");
      expect(broader?.normalizedRole).toBe("supporting_candidate");
    });

    it("demotes the broader breakdown-after-exit support fact when the thin-support variant is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
          createBasePatternInput({
            hadSupportResistanceContextAvailable: true,
            finalExitOccurredNearSupport: true,
            finalExitDistanceToNearestSupportPct: 0.001,
            finalExitSupportLevelsBelowWithinClusterCount: 1,
            finalExitHasStackedSupportBelow: false,
            maxAdverseMovePctAfterExit: 0.03,
            netMovePctAtEndOfPostExitWindow: -0.02,
          }),
        ),
      );

      const richer = normalized.prioritizedPatterns.find(
        (pattern) => pattern.patternId === "exit_into_thin_support_before_breakdown",
      );
      const broader = normalized.prioritizedPatterns.find(
        (pattern) => pattern.patternId === "exit_into_support_before_breakdown",
      );

      expect(richer?.normalizedRole).toBe("primary_candidate");
      expect(broader?.normalizedRole).toBe("supporting_candidate");
    });

    it("demotes the stacked-support relief branch when the stabilized-recovery variant is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
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
        ),
      );

      const richer = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "stabilized_recovery_with_exit_into_stacked_support_and_relief",
      );
      const broader = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId === "exit_into_stacked_support_with_relief_after_exit",
      );

      expect(richer?.normalizedRole).toBe("primary_candidate");
      expect(broader?.normalizedRole).toBe("supporting_candidate");
    });

    it("demotes the thin-support breakdown branch when the stabilized-recovery variant is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
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
        ),
      );

      const richer = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "stabilized_recovery_with_exit_into_thin_support_before_breakdown",
      );
      const broader = normalized.prioritizedPatterns.find(
        (pattern) => pattern.patternId === "exit_into_thin_support_before_breakdown",
      );

      expect(richer?.normalizedRole).toBe("primary_candidate");
      expect(broader?.normalizedRole).toBe("supporting_candidate");
    });

    it("demotes broad avoided-adverse-followthrough when the resistance-reversal exit variant is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
          createBasePatternInput({
            hadSupportResistanceContextAvailable: true,
            finalExitOccurredNearResistance: true,
            finalExitDistanceToNearestResistancePct: 0.001,
            closedToFlat: true,
            postExitCandleCount: 1,
            maxAdverseMovePctAfterExit: 0.03,
            maxFavorableMovePctAfterExit: 0.005,
            netMovePctAtEndOfPostExitWindow: -0.01,
          }),
        ),
      );

      const richer = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId === "exit_into_resistance_with_reversal_after_exit",
      );
      const broader = normalized.prioritizedPatterns.find(
        (pattern) => pattern.patternId === "exit_avoided_adverse_followthrough",
      );

      expect(richer?.normalizedRole).toBe("primary_candidate");
      expect(broader?.normalizedRole).toBe("supporting_candidate");
    });

    it("demotes broad missed-post-exit continuation when the resistance-before-breakout variant is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
          createBasePatternInput({
            hadSupportResistanceContextAvailable: true,
            finalExitOccurredNearResistance: true,
            finalExitDistanceToNearestResistancePct: 0.001,
            closedToFlat: true,
            postExitCandleCount: 1,
            maxFavorableMovePctAfterExit: 0.03,
            maxAdverseMovePctAfterExit: 0.005,
            netMovePctAtEndOfPostExitWindow: 0.01,
          }),
        ),
      );

      const richer = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId === "exit_into_resistance_before_breakout",
      );
      const broader = normalized.prioritizedPatterns.find(
        (pattern) => pattern.patternId === "missed_post_exit_continuation",
      );

      expect(richer?.normalizedRole).toBe("primary_candidate");
      expect(broader?.normalizedRole).toBe("supporting_candidate");
    });

    it("demotes the resistance-reversal branch when the stabilized-recovery resistance-reversal variant is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
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
        ),
      );

      const richer = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId === "stabilized_recovery_with_exit_into_resistance_and_reversal",
      );
      const broader = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId === "exit_into_resistance_with_reversal_after_exit",
      );

      expect(richer?.normalizedRole).toBe("primary_candidate");
      expect(broader?.normalizedRole).toBe("supporting_candidate");
    });

    it("demotes the resistance-before-breakout branch when the stabilized-recovery resistance-before-breakout variant is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
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
        ),
      );

      const richer = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId === "stabilized_recovery_with_exit_into_resistance_before_breakout",
      );
      const broader = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId === "exit_into_resistance_before_breakout",
      );

      expect(richer?.normalizedRole).toBe("primary_candidate");
      expect(broader?.normalizedRole).toBe("supporting_candidate");
    });

    it("demotes the broad repeated missed-continuation summary when the repeated stacked-support relief branch is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
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
        ),
      );

      const richer = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "repeated_balanced_management_with_exit_into_stacked_support_and_relief",
      );
      const broader = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "repeated_balanced_management_with_missed_final_continuation",
      );

      expect(richer?.normalizedRole).toBe("primary_candidate");
      expect(broader?.normalizedRole).toBe("supporting_candidate");
    });

    it("demotes the broad repeated defensive-save summary when the repeated thin-support breakdown branch is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
          createBasePatternInput({
            partialExitCount: 2,
            hadPartialExit: true,
            readdAfterReductionCount: 2,
            hadReaddAfterReduction: true,
            realizedReturnPct: 0.03,
            maxGivebackFromPeakOpenProfitPct: 0.65,
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
        ),
      );

      const richer = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "repeated_balanced_management_with_exit_into_thin_support_before_breakdown",
      );
      const broader = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "repeated_balanced_management_with_defensive_final_exit_after_deterioration",
      );

      expect(richer?.normalizedRole).toBe("primary_candidate");
      expect(broader?.normalizedRole).toBe("supporting_candidate");
    });

    it("demotes the broad repeated stacked-support branch when the recovery-aware repeated stacked-support variant is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
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
        ),
      );

      const richer = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "repeated_rescue_attempts_with_balanced_management_and_exit_into_stacked_support_and_relief",
      );
      const broader = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "repeated_balanced_management_with_exit_into_stacked_support_and_relief",
      );

      expect(richer?.normalizedRole).toBe("primary_candidate");
      expect(broader?.normalizedRole).toBe("supporting_candidate");
    });

    it("demotes the broad repeated thin-support breakdown branch when the recovery-aware repeated thin-support variant is present", () => {
      const normalized = normalizeDetectedPatterns(
        detectPatterns(
          createBasePatternInput({
            hadOpenLossBeforePeakOpenProfit: true,
            hadPeakOpenProfitBeforeWorstDrawdown: true,
            peakOpenProfitPctOfBasis: 0.08,
            partialExitCount: 2,
            hadPartialExit: true,
            readdAfterReductionCount: 2,
            hadReaddAfterReduction: true,
            realizedReturnPct: 0.03,
            maxGivebackFromPeakOpenProfitPct: 0.65,
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
        ),
      );

      const richer = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "repeated_rescue_attempts_with_balanced_management_and_exit_into_thin_support_before_breakdown",
      );
      const broader = normalized.prioritizedPatterns.find(
        (pattern) =>
          pattern.patternId ===
          "repeated_balanced_management_with_exit_into_thin_support_before_breakdown",
      );

      expect(richer?.normalizedRole).toBe("primary_candidate");
      expect(broader?.normalizedRole).toBe("supporting_candidate");
    });
  });
