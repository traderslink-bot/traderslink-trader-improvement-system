// 2026-04-12 08:18 PM America/Toronto
// PURPOSE:
// Provides one end to end entry point for creating a canonical raw trade timeline
// from normalize-ready candle and execution inputs.
// This file stays strictly factual and interpretation free.
//
// filename: create-raw-trade-timeline.ts

import { buildEntryOutcomeTimingSignals } from "../derived/build-entry-outcome-timing-signals";
import { buildAddContextDerivedSignals } from "../derived/build-add-context-derived-signals";
import { buildBetweenExecutionPriceBehaviorSignals } from "../derived/build-between-execution-price-behavior-signals";
import { buildDangerWindowDerivedSignals } from "../derived/build-danger-window-derived-signals";
import { buildEntryContextDerivedSignals } from "../derived/build-entry-context-derived-signals";
import { buildExecutionDerivedSignals } from "../derived/build-execution-derived-signals";
import { buildExecutionLocalStructureSignals } from "../derived/build-execution-local-structure-signals";
import { buildPartialExitOutcomeSignals } from "../derived/build-partial-exit-outcome-signals";
import { buildPostExitDerivedSignals } from "../derived/build-post-exit-derived-signals";
import { buildPositionChangeDerivedSignals } from "../derived/build-position-change-derived-signals";
import { buildProfitProtectionDerivedSignals } from "../derived/build-profit-protection-derived-signals";
import { buildReductionContextDerivedSignals } from "../derived/build-reduction-context-derived-signals";
import { buildReductionReaddSequenceSignals } from "../derived/build-reduction-readd-sequence-signals";
import { buildReaddOutcomeSignals } from "../derived/build-readd-outcome-signals";
import { buildTradeLifecycleMilestoneSignals } from "../derived/build-trade-lifecycle-milestone-signals";
import { buildTimelineRelationshipSignals } from "../derived/build-timeline-relationship-signals";
import { buildTradeDerivedSignals } from "../derived/build-trade-derived-signals";
import {
  normalizeCandles,
  type NormalizeCandleInput,
} from "../normalizers/normalize-candle";
import { normalizeRequiredSessionBucketValue } from "../session/normalize-session-bucket";
import { buildSupportResistanceContext } from "../../support-resistance/build-support-resistance-context";
import {
  normalizeExecutions,
  type NormalizeExecutionInput,
} from "../normalizers/normalize-execution";
import type { RawTradeTimelineBuildResult } from "../types/raw-trade-timeline-build-result";
import type { SessionContext, SessionContextInput } from "../types/session-context";
import type { TradeDirection } from "../types/trade-timeline-input";
import { buildTradeTimeline } from "./build-trade-timeline";

export interface CreateRawTradeTimelineArgs {
  symbol: string;
  timeframe: string;
  tradeDirection: TradeDirection;
  preTradeCandles: NormalizeCandleInput[];
  tradeCandles: NormalizeCandleInput[];
  postTradeCandles: NormalizeCandleInput[];
  executions: NormalizeExecutionInput[];
  sessionContext: SessionContextInput;
  executionWindowCandlesBeforeCount?: number;
  executionWindowCandlesAfterCount?: number;
}

function normalizeSessionContext(sessionContext: SessionContextInput): SessionContext {
  return {
    sessionBucket: normalizeRequiredSessionBucketValue(sessionContext.sessionBucket),
    sessionDate: sessionContext.sessionDate.trim(),
  };
}

export function createRawTradeTimeline(
  args: CreateRawTradeTimelineArgs,
): RawTradeTimelineBuildResult {
  const symbol = args.symbol.trim().toUpperCase();
  const timeframe = args.timeframe.trim();

  if (!symbol) {
    throw new Error("createRawTradeTimeline symbol cannot be empty.");
  }

  if (!timeframe) {
    throw new Error("createRawTradeTimeline timeframe cannot be empty.");
  }

  const normalizedSessionContext = normalizeSessionContext(args.sessionContext);

  if (!normalizedSessionContext.sessionDate) {
    throw new Error("createRawTradeTimeline session date cannot be empty.");
  }

  const preTradeCandles = normalizeCandles(args.preTradeCandles);
  const tradeCandles = normalizeCandles(args.tradeCandles);
  const postTradeCandles = normalizeCandles(args.postTradeCandles);
  const executions = normalizeExecutions(args.executions);

  const result = buildTradeTimeline({
    input: {
      symbol,
      timeframe,
      tradeDirection: args.tradeDirection,
      executions,
      preTradeCandles,
      tradeCandles,
      postTradeCandles,
      sessionContext: normalizedSessionContext,
    },
    executionWindowCandlesBeforeCount: args.executionWindowCandlesBeforeCount,
    executionWindowCandlesAfterCount: args.executionWindowCandlesAfterCount,
  });

  const executionDerivedSignals = buildExecutionDerivedSignals({
    executions: result.timeline.executions,
    executionContextWindows: result.timeline.executionContextWindows,
    tradeDirection: result.timeline.tradeDirection,
  });

  const positionChangeDerivedSignals = buildPositionChangeDerivedSignals({
    executions: result.timeline.executions,
    tradeStateSnapshots: result.timeline.tradeStateSeries.snapshots,
    tradeDirection: result.timeline.tradeDirection,
  });

  const timelineRelationshipSignals = buildTimelineRelationshipSignals({
    executions: result.timeline.executions,
    tradeCandles: result.timeline.tradeCandles,
  });

  const tradeDerivedSignals = buildTradeDerivedSignals({
    symbol: result.timeline.symbol,
    tradeDirection: result.timeline.tradeDirection,
    executions: result.timeline.executions,
    tradeCandles: result.timeline.tradeCandles,
  });

  const betweenExecutionPriceBehaviorSignals =
    buildBetweenExecutionPriceBehaviorSignals({
      executions: result.timeline.executions,
      tradeCandles: result.timeline.tradeCandles,
      tradeDirection: result.timeline.tradeDirection,
    });

  const reductionReaddSequenceSignals = buildReductionReaddSequenceSignals({
    positionChangeDerivedSignals,
    tradeCandles: result.timeline.tradeCandles,
  });

  const readdOutcomeSignals = buildReaddOutcomeSignals({
    executions: result.timeline.executions,
    reductionReaddSequenceSignals,
    tradeCandles: result.timeline.tradeCandles,
    tradeDirection: result.timeline.tradeDirection,
  });

  const profitProtectionDerivedSignals = buildProfitProtectionDerivedSignals({
    positionChangeDerivedSignals,
    tradeCandles: result.timeline.tradeCandles,
    tradeDirection: result.timeline.tradeDirection,
  });

  const partialExitOutcomeSignals = buildPartialExitOutcomeSignals({
    executions: result.timeline.executions,
    positionChangeDerivedSignals,
    tradeCandles: result.timeline.tradeCandles,
    tradeDirection: result.timeline.tradeDirection,
  });
  const supportResistanceContext = buildSupportResistanceContext({
    timeline: result.timeline,
  });

  // 2026-04-12 08:18 PM America/Toronto
  // Build higher-value raw relationship signals after the core timeline and
  // first-pass derived signals are available.
  const baseBuildResult: RawTradeTimelineBuildResult = {
    ...result,
    executionDerivedSignals,
    positionChangeDerivedSignals,
    timelineRelationshipSignals,
    tradeDerivedSignals,
    betweenExecutionPriceBehaviorSignals,
    reductionReaddSequenceSignals,
    readdOutcomeSignals,
    profitProtectionDerivedSignals,
    partialExitOutcomeSignals,
    structuralContextWindow: supportResistanceContext.structuralContextWindow,
    referenceLevels: supportResistanceContext.referenceLevels,
    dynamicLevels: supportResistanceContext.dynamicLevels,
    supportLevels: supportResistanceContext.supportLevels,
    resistanceLevels: supportResistanceContext.resistanceLevels,
    gapStructure: supportResistanceContext.gapStructure,
    executionLevelRelations: supportResistanceContext.executionLevelRelations,
    hadInsufficientCandleDataForStructure:
      supportResistanceContext.hadInsufficientCandleDataForStructure,
  };

  const postExitDerivedSignals = buildPostExitDerivedSignals(baseBuildResult);

  const entryOutcomeTimingSignals =
    buildEntryOutcomeTimingSignals(baseBuildResult);

  const executionLocalStructureSignals =
    buildExecutionLocalStructureSignals(baseBuildResult);

  const entryContextDerivedSignals =
    buildEntryContextDerivedSignals(baseBuildResult);

  const addContextDerivedSignals = buildAddContextDerivedSignals({
    positionChangeDerivedSignals,
    executionLocalStructureSignals,
  });

  const reductionContextDerivedSignals = buildReductionContextDerivedSignals({
    positionChangeDerivedSignals,
    executionLocalStructureSignals,
  });

  const tradeLifecycleMilestoneSignals =
    buildTradeLifecycleMilestoneSignals(baseBuildResult);
  const dangerWindowDerivedSignals = buildDangerWindowDerivedSignals({
    tradeLifecycleMilestoneSignals,
    positionChangeDerivedSignals,
  });

  return {
    ...baseBuildResult,
    postExitDerivedSignals,
    entryOutcomeTimingSignals,
    executionLocalStructureSignals,
    entryContextDerivedSignals,
    addContextDerivedSignals,
    reductionContextDerivedSignals,
    tradeLifecycleMilestoneSignals,
    dangerWindowDerivedSignals,
  };
}
