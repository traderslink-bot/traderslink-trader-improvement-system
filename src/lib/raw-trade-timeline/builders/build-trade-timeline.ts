// 2026-04-12 09:22 AM America/Toronto
// PURPOSE:
// Assembles the canonical raw trade timeline object from normalized input.
// This file stays strictly factual and interpretation free.
// It preserves the timeline structure of the trade but does not assign
// patterns, coaching, or quality judgments.

import { buildTradeTimelineSegments } from "./build-trade-timeline-segments";
import { buildTradeStateSeries } from "../state/build-trade-state-series";
import type { Candle } from "../types/candle";
import type { Execution } from "../types/execution";
import type { RawTradeTimelineBuildResult } from "../types/raw-trade-timeline-build-result";
import type { SessionContext } from "../types/session-context";
import type {
  TradeTimelineInput,
  TradeTimelineInputBuildSource,
} from "../types/trade-timeline-input";
import type { TradeTimeline } from "../types/trade-timeline";
import { normalizeRequiredSessionBucketValue } from "../session/normalize-session-bucket";
import { validateTradeTimeline } from "../validators/validate-trade-timeline";
import { validateTradeTimelineInput } from "../validators/validate-trade-timeline-input";
import { buildExecutionContextWindows } from "../windows/build-execution-context-windows";

export interface BuildTradeTimelineArgs {
  input: TradeTimelineInputBuildSource;
  executionWindowCandlesBeforeCount?: number;
  executionWindowCandlesAfterCount?: number;
}

function sortCandles(candles: Candle[]): Candle[] {
  return [...candles].sort(
    (left, right) => Date.parse(left.timestamp) - Date.parse(right.timestamp),
  );
}

function sortExecutions(executions: Execution[]): Execution[] {
  return [...executions].sort((left, right) => {
    const timeDifference = Date.parse(left.timestamp) - Date.parse(right.timestamp);

    if (timeDifference !== 0) {
      return timeDifference;
    }

    return left.executionIndex - right.executionIndex;
  });
}

function normalizeExecutionIndexes(executions: Execution[]): Execution[] {
  return executions.map((execution, index) => ({
    ...execution,
    executionIndex: index,
  }));
}

export function buildTradeTimeline(
  args: BuildTradeTimelineArgs,
): RawTradeTimelineBuildResult {
  const symbol = args.input.symbol.trim().toUpperCase();
  const timeframe = args.input.timeframe.trim();
  const sessionContext: SessionContext = {
    sessionBucket: normalizeRequiredSessionBucketValue(
      args.input.sessionContext.sessionBucket,
    ),
    sessionDate: args.input.sessionContext.sessionDate.trim(),
  };

  const preTradeCandles = sortCandles(args.input.preTradeCandles);
  const tradeCandles = sortCandles(args.input.tradeCandles);
  const postTradeCandles = sortCandles(args.input.postTradeCandles);
  const executions = normalizeExecutionIndexes(sortExecutions(args.input.executions));
  const allCandles = [...preTradeCandles, ...tradeCandles, ...postTradeCandles];

  const normalizedInput: TradeTimelineInput = {
    symbol,
    timeframe,
    tradeDirection: args.input.tradeDirection,
    executions,
    preTradeCandles,
    tradeCandles,
    postTradeCandles,
    sessionContext,
  };

  const warnings: string[] = [
    ...validateTradeTimelineInput({
      input: normalizedInput,
    }),
  ];

  const executionContextWindows = buildExecutionContextWindows({
    executions,
    allCandles,
    candlesBeforeCount: args.executionWindowCandlesBeforeCount,
    candlesAfterCount: args.executionWindowCandlesAfterCount,
  });

  const tradeStateSeries = buildTradeStateSeries({
    executions,
    tradeDirection: normalizedInput.tradeDirection,
  });

  const timelineSegments = buildTradeTimelineSegments({
    preTradeCandles,
    tradeCandles,
    postTradeCandles,
    executions,
  });

  const timeline: TradeTimeline = {
    symbol,
    timeframe,
    tradeDirection: normalizedInput.tradeDirection,
    sessionContext,
    executions,
    preTradeCandles,
    tradeCandles,
    postTradeCandles,
    allCandles,
    executionContextWindows,
    tradeStateSeries,
    timelineSegments,
  };

  warnings.push(
    ...validateTradeTimeline({
      timeline,
    }),
  );

  return {
    input: normalizedInput,
    timeline,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
