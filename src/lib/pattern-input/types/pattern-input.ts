// =========================
// 2026-04-16 01:05 PM America/Toronto
// PATTERN INPUT CONTRACT
// file name: pattern-input.ts
// =========================
//
// PURPOSE:
// Defines the PatternInput contract consumed by Layer 2 pattern detection.
//
// CURRENT SHAPE:
// - nested context groups are now the primary organization
// - a temporary flat compatibility layer is still exposed to preserve behavior
//   during the migration away from the older god-contract surface
//
// CRITICAL CONTRACT:
// Pattern detection must consume PatternInput only.
// No Layer 2 code should reach back into the raw timeline result directly.

import type { TradeDirection } from "../../raw-trade-timeline/types/trade-timeline-input";
import type { ReferenceLevelLabel } from "../../raw-trade-timeline/types/reference-level-label";
import type { SessionBucket } from "../../raw-trade-timeline/types/session-context";

export interface PatternInputTradeStructureContext {
  executionCount: number;
  executionTimestamps: string[];
  firstExecutionTimestamp: string;
  lastExecutionTimestamp: string;
  tradeDurationSeconds: number;
  tradeDurationMinutes: number;
  tradeCandleCount: number;
  totalPositionIncreaseCount: number;
  totalPositionDecreaseCount: number;
  totalPositionUnchangedCount: number;
  openedFromFlat: boolean;
  closedToFlat: boolean;
  hadMultipleIncreases: boolean;
  hadMultipleDecreases: boolean;
  maxPositionSize: number;
  finalPositionSize: number;
  entryPrice: number;
  exitPrice: number;
  tradeMfe: number | null;
  tradeMae: number | null;
  tradeMfePct: number | null;
  tradeMaePct: number | null;
  peakPriceDuringTrade: number | null;
  worstPriceDuringTrade: number | null;
  maxExecutionMfePct: number | null;
  maxExecutionMaePct: number | null;
  averageExecutionMfePct: number | null;
  averageExecutionMaePct: number | null;
}

export interface PatternInputEntryContext {
  firstEntryPricePositionInTradeRangePct: number | null;
  firstEntryDistanceFromTradeLowPct: number | null;
  firstEntryDistanceFromTradeHighPct: number | null;
  firstEntryOccurredDuringMarketOpenSession: boolean;
  firstEntryOpeningRangeCandlesCountBeforeEntry: number;
  firstEntryOpeningRangeHighBeforeEntry: number | null;
  firstEntryOpeningRangeLowBeforeEntry: number | null;
  firstEntryOccurredBeyondOpeningRangeInTradeDirection: boolean;
  firstEntryDistanceBeyondOpeningRangePct: number | null;
  firstEntryOpeningRangeReferenceLevelBeforeEntry: number | null;
  firstEntryOpeningRangeReferenceBreakDepthPctBeforeEntry: number | null;
  firstEntryHadOpeningRangeReclaimBeforeEntry: boolean;
  firstEntryOpeningRangeReclaimHeldIntoEntry: boolean;
  firstEntryOpeningRangeConfirmationCandlesCount: number;
  firstEntryDistanceFromOpeningRangeReferenceLevelPct: number | null;
  firstEntryOccurredBeyondPreEntryRangeInTradeDirection: boolean;
  firstEntryDistanceBeyondPreEntryRangePct: number | null;
  firstEntryToPeakMovePct: number | null;
  firstEntryToWorstMovePct: number | null;
  firstEntryCapturedPercentOfTradeMfe: number | null;
  firstEntryWasNearTradeLow: boolean;
  firstEntryWasNearTradeHigh: boolean;
  firstEntryRecentRunUpPctBeforeEntry: number | null;
  firstEntryRecentDropPctBeforeEntry: number | null;
  firstEntryRecentNetMovePctBeforeEntry: number | null;
  firstEntryRecentReferenceLevelBeforeEntry: number | null;
  firstEntryRecentReferenceBreakDepthPctBeforeEntry: number | null;
  firstEntryHadRecentReferenceReclaimBeforeEntry: boolean;
  firstEntryRecentReferenceReclaimHeldIntoEntry: boolean;
  firstEntryRecentReferenceConfirmationCandlesCount: number;
  firstEntryDistanceFromRecentReferenceLevelPct: number | null;
  firstEntryBullishCandlesBeforeEntryCount: number;
  firstEntryBearishCandlesBeforeEntryCount: number;
}

export interface PatternInputExitContext {
  realizedReturnPct: number | null;
  realizedCapturePercentOfTradeMfe: number | null;
  favorableExcursionLeftOnTablePct: number | null;
  exitPricePositionInTradeRangePct: number | null;
  finalExitToPeakDistancePct: number | null;
  exitWasNearTradeHigh: boolean;
  exitWasNearTradeLow: boolean;
  postExitCandleCount: number;
  maxFavorableMovePctAfterExit: number | null;
  maxAdverseMovePctAfterExit: number | null;
  netMovePctAtEndOfPostExitWindow: number | null;
  partialExitCount: number;
  hadPartialExit: boolean;
  maxFavorableMoveAfterPartialExitPct: number | null;
  maxAdverseMoveAfterPartialExitPct: number | null;
  reductionAbovePreviousAverageEntryCount: number;
  reductionBelowPreviousAverageEntryCount: number;
  averageReductionPriceVsPreviousAverageEntryPct: number | null;
  averageReductionPricePositionInRecentRangePct: number | null;
  reductionsNearRecentHighCount: number;
  reductionsNearRecentLowCount: number;
  averageReductionRecentRunUpPctBeforeExecution: number | null;
  averageReductionRecentDropPctBeforeExecution: number | null;
  reductionsWithRecentRunUpCount: number;
  reductionsWithRecentDropCount: number;
}

export interface PatternInputScalingContext {
  readdAfterReductionCount: number;
  hadReaddAfterReduction: boolean;
  averageReaddPriceChangeFromPriorReductionPct: number | null;
  averageFavorableMovePctAfterPartialExitBeforeReadd: number | null;
  averageAdverseMovePctAfterPartialExitBeforeReadd: number | null;
  averageFavorableMovePctAfterReaddBeforeNextExecution: number | null;
  averageAdverseMovePctAfterReaddBeforeNextExecution: number | null;
  readdsWithStrongerFavorableFollowthroughCount: number;
  readdsWithStrongerAdverseFollowthroughCount: number;
  readdsAfterRecentRunUpCount: number;
  readdsAfterRecentDropCount: number;
  addCountAfterInitialEntry: number;
  addAbovePreviousAverageEntryCount: number;
  addBelowPreviousAverageEntryCount: number;
  averageAddPriceVsPreviousAverageEntryPct: number | null;
  averageAddPricePositionInRecentRangePct: number | null;
  averageAddRecentRunUpPctBeforeExecution: number | null;
  averageAddRecentDropPctBeforeExecution: number | null;
  addsWithRecentRunUpCount: number;
  addsWithRecentDropCount: number;
}

export interface PatternInputTimingContext {
  averageTimeBetweenExecutionsSeconds: number | null;
  minTimeBetweenExecutionsSeconds: number | null;
  maxTimeBetweenExecutionsSeconds: number | null;
  averageCandlesBetweenExecutions: number | null;
  executionsPerMinute: number | null;
}

export interface PatternInputSupportResistanceContext {
  firstEntryNearestSupportBelowPrice: number | null;
  firstEntryNearestResistanceBelowPrice: number | null;
  firstEntryNearestResistanceAbovePrice: number | null;
  firstEntryDistanceToNearestSupportPct: number | null;
  firstEntryDistanceAboveNearestResistanceBelowPct: number | null;
  firstEntryDistanceToNearestResistancePct: number | null;
  firstEntryOccurredNearSupport: boolean;
  firstEntryOccurredNearResistance: boolean;
  firstEntryClearedNearestResistanceBelow: boolean;
  firstEntryHadRoomAboveAfterClearingResistance: boolean;
  firstEntryOccurredBelowNearestSupport: boolean;
  firstEntryOccurredInOpenAir: boolean;
  firstEntryNearestReferenceLevelLabel: ReferenceLevelLabel | null;
  firstEntryWasAboveVwap: boolean;
  firstEntryWasBelowVwap: boolean;
  firstEntryDistanceFromVwapPct: number | null;
  firstEntryDistanceFromEma9Pct: number | null;
  firstEntryDistanceFromEma20Pct: number | null;
  firstEntryHasNearbyStructureOnBothSides: boolean;
  firstEntryDistanceBetweenNearestSupportAndResistancePct: number | null;
  firstEntryResistanceLevelsAboveWithinClusterCount: number;
  firstEntryHasStackedResistanceAbove: boolean;
  finalExitDistanceToNearestSupportPct: number | null;
  finalExitDistanceToNearestResistancePct: number | null;
  finalExitOccurredNearSupport: boolean;
  finalExitOccurredNearResistance: boolean;
  finalExitSupportLevelsBelowWithinClusterCount: number;
  finalExitHasStackedSupportBelow: boolean;
  reductionsNearSupportCount: number;
  reductionsNearResistanceCount: number;
  addsNearSupportCount: number;
  addsNearResistanceCount: number;
  addsAboveResistanceCount: number;
  addsAboveResistanceWithRoomCount: number;
  addsBelowSupportCount: number;
  averageAddDistanceToNearestSupportPct: number | null;
  averageAddDistanceToNearestResistancePct: number | null;
  averageAddRoomToNextResistancePct: number | null;
  hadInsufficientCandleDataForStructuralContext: boolean;
  hadSupportResistanceContextAvailable: boolean;
}

export interface PatternInputRecoveryContext {
  maxGivebackFromPeakOpenProfitPct: number | null;
  peakOpenProfitPctOfBasis: number | null;
  worstDrawdownPctOfBasis: number | null;
  hadOpenLossBeforePeakOpenProfit: boolean;
  secondsFromFirstOpenLossToPeakOpenProfit: number | null;
  hadPeakOpenProfitBeforeWorstDrawdown: boolean;
  drawdownFromPeakOpenProfitPctOfBasis: number | null;
  hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: boolean;
  reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: number;
  secondsFromPeakOpenProfitToWorstDrawdown: number | null;
  secondsFromPeakOpenProfitToFirstReduction: number | null;
}

export interface PatternInputIdentity {
  symbol: string;
  tradeDirection: TradeDirection;
  sessionBucket: SessionBucket;
}

export interface PatternInputCore extends PatternInputIdentity {
  tradeStructure: PatternInputTradeStructureContext;
  entryContext: PatternInputEntryContext;
  exitContext: PatternInputExitContext;
  scalingContext: PatternInputScalingContext;
  timingContext: PatternInputTimingContext;
  supportResistanceContext: PatternInputSupportResistanceContext;
  recoveryContext: PatternInputRecoveryContext;
}

export type PatternInputLegacyFlatFields =
  PatternInputTradeStructureContext &
  PatternInputEntryContext &
  PatternInputExitContext &
  PatternInputScalingContext &
  PatternInputTimingContext &
  PatternInputSupportResistanceContext &
  PatternInputRecoveryContext;

export type LegacyPatternInputShape = PatternInputIdentity &
  PatternInputLegacyFlatFields;

// TODO(phase-out-flat-pattern-input): once all Layer 2 consumers and fixtures
// read from the grouped contexts directly, narrow `PatternInput` back to
// `PatternInputCore` and remove the flattened compatibility fields plus
// `buildPatternInputCoreFromLegacyFlat(...)`.
export type PatternInput = PatternInputCore & PatternInputLegacyFlatFields;

function hasNestedPatternInputGroups(
  input: PatternInputCore | LegacyPatternInputShape,
): input is PatternInputCore {
  return (
    "tradeStructure" in input &&
    "entryContext" in input &&
    "exitContext" in input &&
    "scalingContext" in input &&
    "timingContext" in input &&
    "supportResistanceContext" in input &&
    "recoveryContext" in input
  );
}

function flattenPatternInputCore(
  input: PatternInputCore,
): PatternInputLegacyFlatFields {
  return {
    ...input.tradeStructure,
    ...input.entryContext,
    ...input.exitContext,
    ...input.scalingContext,
    ...input.timingContext,
    ...input.supportResistanceContext,
    ...input.recoveryContext,
  };
}

export function buildPatternInputCoreFromLegacyFlat(
  input: LegacyPatternInputShape,
): PatternInputCore {
  return {
    symbol: input.symbol,
    tradeDirection: input.tradeDirection,
    sessionBucket: input.sessionBucket,
    tradeStructure: {
      executionCount: input.executionCount,
      executionTimestamps: input.executionTimestamps,
      firstExecutionTimestamp: input.firstExecutionTimestamp,
      lastExecutionTimestamp: input.lastExecutionTimestamp,
      tradeDurationSeconds: input.tradeDurationSeconds,
      tradeDurationMinutes: input.tradeDurationMinutes,
      tradeCandleCount: input.tradeCandleCount,
      totalPositionIncreaseCount: input.totalPositionIncreaseCount,
      totalPositionDecreaseCount: input.totalPositionDecreaseCount,
      totalPositionUnchangedCount: input.totalPositionUnchangedCount,
      openedFromFlat: input.openedFromFlat,
      closedToFlat: input.closedToFlat,
      hadMultipleIncreases: input.hadMultipleIncreases,
      hadMultipleDecreases: input.hadMultipleDecreases,
      maxPositionSize: input.maxPositionSize,
      finalPositionSize: input.finalPositionSize,
      entryPrice: input.entryPrice,
      exitPrice: input.exitPrice,
      tradeMfe: input.tradeMfe,
      tradeMae: input.tradeMae,
      tradeMfePct: input.tradeMfePct,
      tradeMaePct: input.tradeMaePct,
      peakPriceDuringTrade: input.peakPriceDuringTrade,
      worstPriceDuringTrade: input.worstPriceDuringTrade,
      maxExecutionMfePct: input.maxExecutionMfePct,
      maxExecutionMaePct: input.maxExecutionMaePct,
      averageExecutionMfePct: input.averageExecutionMfePct,
      averageExecutionMaePct: input.averageExecutionMaePct,
    },
    entryContext: {
      firstEntryPricePositionInTradeRangePct:
        input.firstEntryPricePositionInTradeRangePct,
      firstEntryDistanceFromTradeLowPct: input.firstEntryDistanceFromTradeLowPct,
      firstEntryDistanceFromTradeHighPct:
        input.firstEntryDistanceFromTradeHighPct,
      firstEntryOccurredDuringMarketOpenSession:
        input.firstEntryOccurredDuringMarketOpenSession,
      firstEntryOpeningRangeCandlesCountBeforeEntry:
        input.firstEntryOpeningRangeCandlesCountBeforeEntry,
      firstEntryOpeningRangeHighBeforeEntry:
        input.firstEntryOpeningRangeHighBeforeEntry,
      firstEntryOpeningRangeLowBeforeEntry:
        input.firstEntryOpeningRangeLowBeforeEntry,
      firstEntryOccurredBeyondOpeningRangeInTradeDirection:
        input.firstEntryOccurredBeyondOpeningRangeInTradeDirection,
      firstEntryDistanceBeyondOpeningRangePct:
        input.firstEntryDistanceBeyondOpeningRangePct,
      firstEntryOpeningRangeReferenceLevelBeforeEntry:
        input.firstEntryOpeningRangeReferenceLevelBeforeEntry,
      firstEntryOpeningRangeReferenceBreakDepthPctBeforeEntry:
        input.firstEntryOpeningRangeReferenceBreakDepthPctBeforeEntry,
      firstEntryHadOpeningRangeReclaimBeforeEntry:
        input.firstEntryHadOpeningRangeReclaimBeforeEntry,
      firstEntryOpeningRangeReclaimHeldIntoEntry:
        input.firstEntryOpeningRangeReclaimHeldIntoEntry,
      firstEntryOpeningRangeConfirmationCandlesCount:
        input.firstEntryOpeningRangeConfirmationCandlesCount,
      firstEntryDistanceFromOpeningRangeReferenceLevelPct:
        input.firstEntryDistanceFromOpeningRangeReferenceLevelPct,
      firstEntryOccurredBeyondPreEntryRangeInTradeDirection:
        input.firstEntryOccurredBeyondPreEntryRangeInTradeDirection,
      firstEntryDistanceBeyondPreEntryRangePct:
        input.firstEntryDistanceBeyondPreEntryRangePct,
      firstEntryToPeakMovePct: input.firstEntryToPeakMovePct,
      firstEntryToWorstMovePct: input.firstEntryToWorstMovePct,
      firstEntryCapturedPercentOfTradeMfe:
        input.firstEntryCapturedPercentOfTradeMfe,
      firstEntryWasNearTradeLow: input.firstEntryWasNearTradeLow,
      firstEntryWasNearTradeHigh: input.firstEntryWasNearTradeHigh,
      firstEntryRecentRunUpPctBeforeEntry:
        input.firstEntryRecentRunUpPctBeforeEntry,
      firstEntryRecentDropPctBeforeEntry: input.firstEntryRecentDropPctBeforeEntry,
      firstEntryRecentNetMovePctBeforeEntry:
        input.firstEntryRecentNetMovePctBeforeEntry,
      firstEntryRecentReferenceLevelBeforeEntry:
        input.firstEntryRecentReferenceLevelBeforeEntry,
      firstEntryRecentReferenceBreakDepthPctBeforeEntry:
        input.firstEntryRecentReferenceBreakDepthPctBeforeEntry,
      firstEntryHadRecentReferenceReclaimBeforeEntry:
        input.firstEntryHadRecentReferenceReclaimBeforeEntry,
      firstEntryRecentReferenceReclaimHeldIntoEntry:
        input.firstEntryRecentReferenceReclaimHeldIntoEntry,
      firstEntryRecentReferenceConfirmationCandlesCount:
        input.firstEntryRecentReferenceConfirmationCandlesCount,
      firstEntryDistanceFromRecentReferenceLevelPct:
        input.firstEntryDistanceFromRecentReferenceLevelPct,
      firstEntryBullishCandlesBeforeEntryCount:
        input.firstEntryBullishCandlesBeforeEntryCount,
      firstEntryBearishCandlesBeforeEntryCount:
        input.firstEntryBearishCandlesBeforeEntryCount,
    },
    exitContext: {
      realizedReturnPct: input.realizedReturnPct,
      realizedCapturePercentOfTradeMfe: input.realizedCapturePercentOfTradeMfe,
      favorableExcursionLeftOnTablePct: input.favorableExcursionLeftOnTablePct,
      exitPricePositionInTradeRangePct: input.exitPricePositionInTradeRangePct,
      finalExitToPeakDistancePct: input.finalExitToPeakDistancePct,
      exitWasNearTradeHigh: input.exitWasNearTradeHigh,
      exitWasNearTradeLow: input.exitWasNearTradeLow,
      postExitCandleCount: input.postExitCandleCount,
      maxFavorableMovePctAfterExit: input.maxFavorableMovePctAfterExit,
      maxAdverseMovePctAfterExit: input.maxAdverseMovePctAfterExit,
      netMovePctAtEndOfPostExitWindow: input.netMovePctAtEndOfPostExitWindow,
      partialExitCount: input.partialExitCount,
      hadPartialExit: input.hadPartialExit,
      maxFavorableMoveAfterPartialExitPct:
        input.maxFavorableMoveAfterPartialExitPct,
      maxAdverseMoveAfterPartialExitPct:
        input.maxAdverseMoveAfterPartialExitPct,
      reductionAbovePreviousAverageEntryCount:
        input.reductionAbovePreviousAverageEntryCount,
      reductionBelowPreviousAverageEntryCount:
        input.reductionBelowPreviousAverageEntryCount,
      averageReductionPriceVsPreviousAverageEntryPct:
        input.averageReductionPriceVsPreviousAverageEntryPct,
      averageReductionPricePositionInRecentRangePct:
        input.averageReductionPricePositionInRecentRangePct,
      reductionsNearRecentHighCount: input.reductionsNearRecentHighCount,
      reductionsNearRecentLowCount: input.reductionsNearRecentLowCount,
      averageReductionRecentRunUpPctBeforeExecution:
        input.averageReductionRecentRunUpPctBeforeExecution,
      averageReductionRecentDropPctBeforeExecution:
        input.averageReductionRecentDropPctBeforeExecution,
      reductionsWithRecentRunUpCount: input.reductionsWithRecentRunUpCount,
      reductionsWithRecentDropCount: input.reductionsWithRecentDropCount,
    },
    scalingContext: {
      readdAfterReductionCount: input.readdAfterReductionCount,
      hadReaddAfterReduction: input.hadReaddAfterReduction,
      averageReaddPriceChangeFromPriorReductionPct:
        input.averageReaddPriceChangeFromPriorReductionPct,
      averageFavorableMovePctAfterPartialExitBeforeReadd:
        input.averageFavorableMovePctAfterPartialExitBeforeReadd,
      averageAdverseMovePctAfterPartialExitBeforeReadd:
        input.averageAdverseMovePctAfterPartialExitBeforeReadd,
      averageFavorableMovePctAfterReaddBeforeNextExecution:
        input.averageFavorableMovePctAfterReaddBeforeNextExecution,
      averageAdverseMovePctAfterReaddBeforeNextExecution:
        input.averageAdverseMovePctAfterReaddBeforeNextExecution,
      readdsWithStrongerFavorableFollowthroughCount:
        input.readdsWithStrongerFavorableFollowthroughCount,
      readdsWithStrongerAdverseFollowthroughCount:
        input.readdsWithStrongerAdverseFollowthroughCount,
      readdsAfterRecentRunUpCount: input.readdsAfterRecentRunUpCount,
      readdsAfterRecentDropCount: input.readdsAfterRecentDropCount,
      addCountAfterInitialEntry: input.addCountAfterInitialEntry,
      addAbovePreviousAverageEntryCount:
        input.addAbovePreviousAverageEntryCount,
      addBelowPreviousAverageEntryCount:
        input.addBelowPreviousAverageEntryCount,
      averageAddPriceVsPreviousAverageEntryPct:
        input.averageAddPriceVsPreviousAverageEntryPct,
      averageAddPricePositionInRecentRangePct:
        input.averageAddPricePositionInRecentRangePct,
      averageAddRecentRunUpPctBeforeExecution:
        input.averageAddRecentRunUpPctBeforeExecution,
      averageAddRecentDropPctBeforeExecution:
        input.averageAddRecentDropPctBeforeExecution,
      addsWithRecentRunUpCount: input.addsWithRecentRunUpCount,
      addsWithRecentDropCount: input.addsWithRecentDropCount,
    },
    timingContext: {
      averageTimeBetweenExecutionsSeconds:
        input.averageTimeBetweenExecutionsSeconds,
      minTimeBetweenExecutionsSeconds: input.minTimeBetweenExecutionsSeconds,
      maxTimeBetweenExecutionsSeconds: input.maxTimeBetweenExecutionsSeconds,
      averageCandlesBetweenExecutions: input.averageCandlesBetweenExecutions,
      executionsPerMinute: input.executionsPerMinute,
    },
    supportResistanceContext: {
      firstEntryNearestSupportBelowPrice: input.firstEntryNearestSupportBelowPrice,
      firstEntryNearestResistanceBelowPrice:
        input.firstEntryNearestResistanceBelowPrice,
      firstEntryNearestResistanceAbovePrice:
        input.firstEntryNearestResistanceAbovePrice,
      firstEntryDistanceToNearestSupportPct:
        input.firstEntryDistanceToNearestSupportPct,
      firstEntryDistanceAboveNearestResistanceBelowPct:
        input.firstEntryDistanceAboveNearestResistanceBelowPct,
      firstEntryDistanceToNearestResistancePct:
        input.firstEntryDistanceToNearestResistancePct,
      firstEntryOccurredNearSupport: input.firstEntryOccurredNearSupport,
      firstEntryOccurredNearResistance: input.firstEntryOccurredNearResistance,
      firstEntryClearedNearestResistanceBelow:
        input.firstEntryClearedNearestResistanceBelow,
      firstEntryHadRoomAboveAfterClearingResistance:
        input.firstEntryHadRoomAboveAfterClearingResistance,
      firstEntryOccurredBelowNearestSupport:
        input.firstEntryOccurredBelowNearestSupport,
      firstEntryOccurredInOpenAir: input.firstEntryOccurredInOpenAir,
      firstEntryNearestReferenceLevelLabel:
        input.firstEntryNearestReferenceLevelLabel,
      firstEntryWasAboveVwap: input.firstEntryWasAboveVwap,
      firstEntryWasBelowVwap: input.firstEntryWasBelowVwap,
      firstEntryDistanceFromVwapPct: input.firstEntryDistanceFromVwapPct,
      firstEntryDistanceFromEma9Pct: input.firstEntryDistanceFromEma9Pct,
      firstEntryDistanceFromEma20Pct: input.firstEntryDistanceFromEma20Pct,
      firstEntryHasNearbyStructureOnBothSides:
        input.firstEntryHasNearbyStructureOnBothSides,
      firstEntryDistanceBetweenNearestSupportAndResistancePct:
        input.firstEntryDistanceBetweenNearestSupportAndResistancePct,
      firstEntryResistanceLevelsAboveWithinClusterCount:
        input.firstEntryResistanceLevelsAboveWithinClusterCount,
      firstEntryHasStackedResistanceAbove:
        input.firstEntryHasStackedResistanceAbove,
      finalExitDistanceToNearestSupportPct:
        input.finalExitDistanceToNearestSupportPct,
      finalExitDistanceToNearestResistancePct:
        input.finalExitDistanceToNearestResistancePct,
      finalExitOccurredNearSupport: input.finalExitOccurredNearSupport,
      finalExitOccurredNearResistance: input.finalExitOccurredNearResistance,
      finalExitSupportLevelsBelowWithinClusterCount:
        input.finalExitSupportLevelsBelowWithinClusterCount,
      finalExitHasStackedSupportBelow: input.finalExitHasStackedSupportBelow,
      reductionsNearSupportCount: input.reductionsNearSupportCount,
      reductionsNearResistanceCount: input.reductionsNearResistanceCount,
      addsNearSupportCount: input.addsNearSupportCount,
      addsNearResistanceCount: input.addsNearResistanceCount,
      addsAboveResistanceCount: input.addsAboveResistanceCount,
      addsAboveResistanceWithRoomCount: input.addsAboveResistanceWithRoomCount,
      addsBelowSupportCount: input.addsBelowSupportCount,
      averageAddDistanceToNearestSupportPct:
        input.averageAddDistanceToNearestSupportPct,
      averageAddDistanceToNearestResistancePct:
        input.averageAddDistanceToNearestResistancePct,
      averageAddRoomToNextResistancePct: input.averageAddRoomToNextResistancePct,
      hadInsufficientCandleDataForStructuralContext:
        input.hadInsufficientCandleDataForStructuralContext,
      hadSupportResistanceContextAvailable:
        input.hadSupportResistanceContextAvailable,
    },
    recoveryContext: {
      maxGivebackFromPeakOpenProfitPct:
        input.maxGivebackFromPeakOpenProfitPct,
      peakOpenProfitPctOfBasis: input.peakOpenProfitPctOfBasis,
      worstDrawdownPctOfBasis: input.worstDrawdownPctOfBasis,
      hadOpenLossBeforePeakOpenProfit: input.hadOpenLossBeforePeakOpenProfit,
      secondsFromFirstOpenLossToPeakOpenProfit:
        input.secondsFromFirstOpenLossToPeakOpenProfit,
      hadPeakOpenProfitBeforeWorstDrawdown:
        input.hadPeakOpenProfitBeforeWorstDrawdown,
      drawdownFromPeakOpenProfitPctOfBasis:
        input.drawdownFromPeakOpenProfitPctOfBasis,
      hadReductionAfterPeakOpenProfitBeforeWorstDrawdown:
        input.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown,
      reductionCountAfterPeakOpenProfitBeforeWorstDrawdown:
        input.reductionCountAfterPeakOpenProfitBeforeWorstDrawdown,
      secondsFromPeakOpenProfitToWorstDrawdown:
        input.secondsFromPeakOpenProfitToWorstDrawdown,
      secondsFromPeakOpenProfitToFirstReduction:
        input.secondsFromPeakOpenProfitToFirstReduction,
    },
  };
}

export function createPatternInputFromCore(
  input: PatternInputCore,
): PatternInput {
  return {
    ...input,
    ...flattenPatternInputCore(input),
  };
}

export function normalizePatternInputShape(
  input: PatternInputCore | LegacyPatternInputShape,
): PatternInput {
  if (hasNestedPatternInputGroups(input)) {
    return createPatternInputFromCore(input);
  }

  return createPatternInputFromCore(
    buildPatternInputCoreFromLegacyFlat(input),
  );
}
