// 2026-04-12 08:39 AM America/Toronto
// PURPOSE:
// Defines the full raw input required to analyze one trade timeline.
// This file groups normalized executions and candle segments without adding interpretation.

// file name trade-timeline-inputs.ts

import type { Candle } from "./candle";
import type { Execution } from "./execution";
import type { SessionContext, SessionContextInput } from "./session-context";

export type TradeDirection = "long" | "short";

export interface TradeTimelineInput {
  symbol: string;
  timeframe: string;
  tradeDirection: TradeDirection;
  executions: Execution[];
  preTradeCandles: Candle[];
  tradeCandles: Candle[];
  postTradeCandles: Candle[];
  sessionContext: SessionContext;
}

export interface TradeTimelineInputBuildSource {
  symbol: string;
  timeframe: string;
  tradeDirection: TradeDirection;
  executions: Execution[];
  preTradeCandles: Candle[];
  tradeCandles: Candle[];
  postTradeCandles: Candle[];
  sessionContext: SessionContextInput;
}
