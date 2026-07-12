import {
  CandleFetchService,
  type Candle,
  type CandleFetchTimeframe,
  type HistoricalCandleProvider,
  type HistoricalFetchRequest,
} from "levels-system-v2/support-resistance-engine";
import type { BuildLevelsSystemSupportResistanceContextOptions } from "../build-support-resistance-context";

export const SAMPLE_LEVELS_SYSTEM_SESSION_DATE = "2024-04-12";
export const SAMPLE_LEVELS_SYSTEM_AS_OF_TIMESTAMP =
  "2024-04-12T13:45:00.000Z";

function getTimeframeIntervalMs(timeframe: CandleFetchTimeframe): number {
  switch (timeframe) {
    case "daily":
      return 86_400_000;
    case "4h":
      return 14_400_000;
    case "5m":
      return 300_000;
    case "1m":
      return 60_000;
  }
}

function toCandle(args: {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}): Candle {
  return {
    timestamp: args.timestamp,
    open: Number(args.open.toFixed(4)),
    high: Number(args.high.toFixed(4)),
    low: Number(args.low.toFixed(4)),
    close: Number(args.close.toFixed(4)),
    volume: args.volume,
  };
}

function buildSampleCandles(args: {
  timeframe: CandleFetchTimeframe;
  count: number;
  endTimestamp: number;
}): Candle[] {
  const { timeframe, count, endTimestamp } = args;
  const intervalMs = getTimeframeIntervalMs(timeframe);
  const basePrice = timeframe === "daily" ? 1.18 : 1.2;

  return Array.from({ length: count }, (_, index) => {
    const timestamp = endTimestamp - (count - 1 - index) * intervalMs;
    const cycle = index % 12;
    const wave = Math.sin(index / 3) * 0.04;
    const open = basePrice + wave + index * 0.0002;
    const close = open + Math.sin(index / 2) * 0.015;
    const ordinaryHigh = Math.max(open, close) + 0.025;
    const ordinaryLow = Math.min(open, close) - 0.025;
    const high =
      cycle === 4 ? 1.31 : cycle === 8 ? 1.36 : ordinaryHigh;
    const low = cycle === 1 ? 1.1 : cycle === 6 ? 1.15 : ordinaryLow;

    return toCandle({
      timestamp,
      open,
      high: Math.max(high, open, close),
      low: Math.min(low, open, close),
      close,
      volume: 100_000 + index * 1_000,
    });
  });
}

export class SampleTradeAlignedHistoricalCandleProvider
  implements HistoricalCandleProvider
{
  readonly providerName = "stub" as const;

  async fetchCandles(
    request: HistoricalFetchRequest,
    plan: Parameters<HistoricalCandleProvider["fetchCandles"]>[1],
  ) {
    const candles = buildSampleCandles({
      timeframe: request.timeframe,
      count: request.lookbackBars,
      endTimestamp: plan.requestEndTimestamp,
    });

    return {
      provider: "stub" as const,
      symbol: request.symbol,
      timeframe: request.timeframe,
      requestedLookbackBars: request.lookbackBars,
      candles,
      fetchStartTimestamp:
        candles[0]?.timestamp ?? plan.requestStartTimestamp,
      fetchEndTimestamp:
        candles[candles.length - 1]?.timestamp ?? plan.requestEndTimestamp,
      requestedStartTimestamp: plan.requestStartTimestamp,
      requestedEndTimestamp: plan.requestEndTimestamp,
      sessionMetadataAvailable: plan.sessionMetadataAvailable,
      providerMetadata: {
        fixture: "sample-trade-aligned",
      },
    };
  }
}

export function createSampleLevelsSystemFetchService(): CandleFetchService {
  return new CandleFetchService(new SampleTradeAlignedHistoricalCandleProvider());
}

export function buildSampleLevelsSystemSupportResistanceOptions(): BuildLevelsSystemSupportResistanceContextOptions {
  return {
    fetchService: createSampleLevelsSystemFetchService(),
    asOfTimestamp: SAMPLE_LEVELS_SYSTEM_AS_OF_TIMESTAMP,
    sessionDate: SAMPLE_LEVELS_SYSTEM_SESSION_DATE,
    lookbackBars: {
      daily: 80,
      "4h": 80,
      "5m": 120,
    },
  };
}
