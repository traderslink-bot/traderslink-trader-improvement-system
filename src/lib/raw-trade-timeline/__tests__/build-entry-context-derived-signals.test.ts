import { describe, expect, it } from "vitest";
import { buildEntryContextDerivedSignals } from "../derived/build-entry-context-derived-signals";
import { normalizeCandles } from "../normalizers/normalize-candle";
import { normalizeExecutions } from "../normalizers/normalize-execution";
import type { RawTradeTimelineBuildResult } from "../types/raw-trade-timeline-build-result";

describe("buildEntryContextDerivedSignals", () => {
  it("builds factual first-entry context from pre-trade candles", () => {
    const result: RawTradeTimelineBuildResult = {
      input: {
        symbol: "ABCD",
        timeframe: "1m",
        tradeDirection: "long",
        executions: normalizeExecutions([
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:33:30.000Z",
            side: "buy",
            shares: 100,
            price: 1.185,
          },
        ]),
        preTradeCandles: normalizeCandles([
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:30:00.000Z",
            timeframe: "1m",
            open: 1.1,
            high: 1.14,
            low: 1.09,
            close: 1.13,
            volume: 10000,
          },
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:31:00.000Z",
            timeframe: "1m",
            open: 1.13,
            high: 1.17,
            low: 1.12,
            close: 1.16,
            volume: 14000,
          },
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:32:00.000Z",
            timeframe: "1m",
            open: 1.16,
            high: 1.19,
            low: 1.15,
            close: 1.18,
            volume: 16000,
          },
        ]),
        tradeCandles: [],
        postTradeCandles: [],
        sessionContext: {
          sessionBucket: "market_open",
          sessionDate: "2024-04-12",
        },
      },
      timeline: {
        symbol: "ABCD",
        timeframe: "1m",
        tradeDirection: "long",
        sessionContext: {
          sessionBucket: "market_open",
          sessionDate: "2024-04-12",
        },
        executions: normalizeExecutions([
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:33:30.000Z",
            side: "buy",
            shares: 100,
            price: 1.185,
          },
        ]),
        preTradeCandles: normalizeCandles([
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:30:00.000Z",
            timeframe: "1m",
            open: 1.1,
            high: 1.14,
            low: 1.09,
            close: 1.13,
            volume: 10000,
          },
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:31:00.000Z",
            timeframe: "1m",
            open: 1.13,
            high: 1.17,
            low: 1.12,
            close: 1.16,
            volume: 14000,
          },
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:32:00.000Z",
            timeframe: "1m",
            open: 1.16,
            high: 1.19,
            low: 1.15,
            close: 1.18,
            volume: 16000,
          },
        ]),
        tradeCandles: [],
        postTradeCandles: [],
        allCandles: normalizeCandles([
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:30:00.000Z",
            timeframe: "1m",
            open: 1.1,
            high: 1.14,
            low: 1.09,
            close: 1.13,
            volume: 10000,
          },
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:31:00.000Z",
            timeframe: "1m",
            open: 1.13,
            high: 1.17,
            low: 1.12,
            close: 1.16,
            volume: 14000,
          },
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:32:00.000Z",
            timeframe: "1m",
            open: 1.16,
            high: 1.19,
            low: 1.15,
            close: 1.18,
            volume: 16000,
          },
        ]),
        executionContextWindows: [],
        tradeStateSeries: {
          snapshots: [],
        },
        timelineSegments: [],
      },
    };

    const signals = buildEntryContextDerivedSignals(result);

    expect(signals).toMatchObject({
      entryExecutionIndex: 0,
      entryPrice: 1.185,
      sessionBucketAtEntry: "market_open",
      entryOccurredDuringMarketOpenSession: true,
      openingRangeCandlesCountBeforeEntry: 3,
      openingRangeHighBeforeEntry: 1.19,
      openingRangeLowBeforeEntry: 1.09,
      entryOccurredBeyondOpeningRangeInTradeDirection: false,
      entryDistanceBeyondOpeningRangePct: null,
      preTradeCandlesCount: 3,
      recentHighBeforeEntry: 1.19,
      recentLowBeforeEntry: 1.09,
      recentRangeBeforeEntry: 0.1,
      averageCandleRangeBeforeEntry: 0.046667,
      entryPricePositionInRecentRangePct: 0.95,
      entryDistanceFromFavorableExtremePct: 0.080169,
      entryDistanceFromUnfavorableExtremePct: 0.004202,
      entryOccurredBeyondPreEntryRangeInTradeDirection: false,
      entryDistanceBeyondPreEntryRangePct: null,
      recentRunUpPctBeforeEntry: 0.081818,
      recentDropPctBeforeEntry: 0.009091,
      recentNetMovePctBeforeEntry: 0.072727,
      recentReferenceLevelBeforeEntry: 1.1,
      recentReferenceBreakDepthPctBeforeEntry: 0.009091,
      hadRecentReferenceReclaimBeforeEntry: true,
      recentReferenceReclaimHeldIntoEntry: true,
      recentReferenceConfirmationCandlesCount: 3,
      entryDistanceFromRecentReferenceLevelPct: 0.077273,
      bullishCandlesBeforeEntryCount: 3,
      bearishCandlesBeforeEntryCount: 0,
    });
  });

  it("detects a recent reference reclaim before entry from candle-only pre-trade structure", () => {
    const result: RawTradeTimelineBuildResult = {
      input: {
        symbol: "ABCD",
        timeframe: "1m",
        tradeDirection: "long",
        executions: normalizeExecutions([
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:33:30.000Z",
            side: "buy",
            shares: 100,
            price: 1.03,
          },
        ]),
        preTradeCandles: normalizeCandles([
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:30:00.000Z",
            timeframe: "1m",
            open: 1,
            high: 1.01,
            low: 0.98,
            close: 0.985,
            volume: 10000,
          },
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:31:00.000Z",
            timeframe: "1m",
            open: 0.985,
            high: 0.995,
            low: 0.97,
            close: 0.99,
            volume: 12000,
          },
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:32:00.000Z",
            timeframe: "1m",
            open: 0.99,
            high: 1.025,
            low: 0.989,
            close: 1.02,
            volume: 15000,
          },
        ]),
        tradeCandles: [],
        postTradeCandles: [],
        sessionContext: {
          sessionBucket: "market_open",
          sessionDate: "2024-04-12",
        },
      },
      timeline: {
        symbol: "ABCD",
        timeframe: "1m",
        tradeDirection: "long",
        sessionContext: {
          sessionBucket: "market_open",
          sessionDate: "2024-04-12",
        },
        executions: normalizeExecutions([
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:33:30.000Z",
            side: "buy",
            shares: 100,
            price: 1.03,
          },
        ]),
        preTradeCandles: normalizeCandles([
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:30:00.000Z",
            timeframe: "1m",
            open: 1,
            high: 1.01,
            low: 0.98,
            close: 0.985,
            volume: 10000,
          },
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:31:00.000Z",
            timeframe: "1m",
            open: 0.985,
            high: 0.995,
            low: 0.97,
            close: 0.99,
            volume: 12000,
          },
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:32:00.000Z",
            timeframe: "1m",
            open: 0.99,
            high: 1.025,
            low: 0.989,
            close: 1.02,
            volume: 15000,
          },
        ]),
        tradeCandles: [],
        postTradeCandles: [],
        allCandles: normalizeCandles([
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:30:00.000Z",
            timeframe: "1m",
            open: 1,
            high: 1.01,
            low: 0.98,
            close: 0.985,
            volume: 10000,
          },
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:31:00.000Z",
            timeframe: "1m",
            open: 0.985,
            high: 0.995,
            low: 0.97,
            close: 0.99,
            volume: 12000,
          },
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:32:00.000Z",
            timeframe: "1m",
            open: 0.99,
            high: 1.025,
            low: 0.989,
            close: 1.02,
            volume: 15000,
          },
        ]),
        executionContextWindows: [],
        tradeStateSeries: {
          snapshots: [],
        },
        timelineSegments: [],
      },
    };

    const signals = buildEntryContextDerivedSignals(result);

    expect(signals.recentReferenceLevelBeforeEntry).toBe(1);
    expect(signals.recentReferenceBreakDepthPctBeforeEntry).toBe(0.03);
    expect(signals.hadRecentReferenceReclaimBeforeEntry).toBe(true);
    expect(signals.recentReferenceReclaimHeldIntoEntry).toBe(true);
    expect(signals.recentReferenceConfirmationCandlesCount).toBe(1);
    expect(signals.entryDistanceFromRecentReferenceLevelPct).toBe(0.03);
    expect(signals.openingRangeCandlesCountBeforeEntry).toBe(3);
    expect(signals.openingRangeHighBeforeEntry).toBe(1.025);
    expect(signals.openingRangeLowBeforeEntry).toBe(0.97);
    expect(signals.entryOccurredBeyondOpeningRangeInTradeDirection).toBe(true);
    expect(signals.entryDistanceBeyondOpeningRangePct).toBe(0.004878);
    expect(signals.entryOccurredBeyondPreEntryRangeInTradeDirection).toBe(true);
    expect(signals.entryDistanceBeyondPreEntryRangePct).toBe(0.004878);
  });

  it("detects an opening-range reclaim before entry when price broke the opening-range boundary and reclaimed it later", () => {
    const result: RawTradeTimelineBuildResult = {
      input: {
        symbol: "ABCD",
        timeframe: "1m",
        tradeDirection: "long",
        executions: normalizeExecutions([
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:35:30.000Z",
            side: "buy",
            shares: 100,
            price: 1.15,
          },
        ]),
        preTradeCandles: normalizeCandles([
          { symbol: "ABCD", timestamp: "2024-04-12T13:30:00.000Z", timeframe: "1m", open: 1.08, high: 1.1, low: 1.07, close: 1.095, volume: 10000 },
          { symbol: "ABCD", timestamp: "2024-04-12T13:31:00.000Z", timeframe: "1m", open: 1.095, high: 1.12, low: 1.09, close: 1.115, volume: 12000 },
          { symbol: "ABCD", timestamp: "2024-04-12T13:32:00.000Z", timeframe: "1m", open: 1.115, high: 1.12, low: 1.1, close: 1.11, volume: 13000 },
          { symbol: "ABCD", timestamp: "2024-04-12T13:33:00.000Z", timeframe: "1m", open: 1.11, high: 1.115, low: 1.09, close: 1.1, volume: 11000 },
          { symbol: "ABCD", timestamp: "2024-04-12T13:34:00.000Z", timeframe: "1m", open: 1.1, high: 1.145, low: 1.099, close: 1.14, volume: 15000 },
          { symbol: "ABCD", timestamp: "2024-04-12T13:35:00.000Z", timeframe: "1m", open: 1.14, high: 1.152, low: 1.138, close: 1.149, volume: 14000 },
        ]),
        tradeCandles: [],
        postTradeCandles: [],
        sessionContext: { sessionBucket: "market_open", sessionDate: "2024-04-12" },
      },
      timeline: {
        symbol: "ABCD",
        timeframe: "1m",
        tradeDirection: "long",
        sessionContext: { sessionBucket: "market_open", sessionDate: "2024-04-12" },
        executions: normalizeExecutions([
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:35:30.000Z",
            side: "buy",
            shares: 100,
            price: 1.15,
          },
        ]),
        preTradeCandles: normalizeCandles([
          { symbol: "ABCD", timestamp: "2024-04-12T13:30:00.000Z", timeframe: "1m", open: 1.08, high: 1.1, low: 1.07, close: 1.095, volume: 10000 },
          { symbol: "ABCD", timestamp: "2024-04-12T13:31:00.000Z", timeframe: "1m", open: 1.095, high: 1.12, low: 1.09, close: 1.115, volume: 12000 },
          { symbol: "ABCD", timestamp: "2024-04-12T13:32:00.000Z", timeframe: "1m", open: 1.115, high: 1.12, low: 1.1, close: 1.11, volume: 13000 },
          { symbol: "ABCD", timestamp: "2024-04-12T13:33:00.000Z", timeframe: "1m", open: 1.11, high: 1.115, low: 1.09, close: 1.1, volume: 11000 },
          { symbol: "ABCD", timestamp: "2024-04-12T13:34:00.000Z", timeframe: "1m", open: 1.1, high: 1.145, low: 1.099, close: 1.14, volume: 15000 },
          { symbol: "ABCD", timestamp: "2024-04-12T13:35:00.000Z", timeframe: "1m", open: 1.14, high: 1.152, low: 1.138, close: 1.149, volume: 14000 },
        ]),
        tradeCandles: [],
        postTradeCandles: [],
        allCandles: normalizeCandles([
          { symbol: "ABCD", timestamp: "2024-04-12T13:30:00.000Z", timeframe: "1m", open: 1.08, high: 1.1, low: 1.07, close: 1.095, volume: 10000 },
          { symbol: "ABCD", timestamp: "2024-04-12T13:31:00.000Z", timeframe: "1m", open: 1.095, high: 1.12, low: 1.09, close: 1.115, volume: 12000 },
          { symbol: "ABCD", timestamp: "2024-04-12T13:32:00.000Z", timeframe: "1m", open: 1.115, high: 1.12, low: 1.1, close: 1.11, volume: 13000 },
          { symbol: "ABCD", timestamp: "2024-04-12T13:33:00.000Z", timeframe: "1m", open: 1.11, high: 1.115, low: 1.09, close: 1.1, volume: 11000 },
          { symbol: "ABCD", timestamp: "2024-04-12T13:34:00.000Z", timeframe: "1m", open: 1.1, high: 1.145, low: 1.099, close: 1.14, volume: 15000 },
          { symbol: "ABCD", timestamp: "2024-04-12T13:35:00.000Z", timeframe: "1m", open: 1.14, high: 1.152, low: 1.138, close: 1.149, volume: 14000 },
        ]),
        executionContextWindows: [],
        tradeStateSeries: { snapshots: [] },
        timelineSegments: [],
      },
    };

    const signals = buildEntryContextDerivedSignals(result);

    expect(signals.openingRangeReferenceLevelBeforeEntry).toBe(1.12);
    expect(signals.openingRangeReferenceBreakDepthPctBeforeEntry).toBe(0.026786);
    expect(signals.hadOpeningRangeReclaimBeforeEntry).toBe(true);
    expect(signals.openingRangeReclaimHeldIntoEntry).toBe(true);
    expect(signals.openingRangeConfirmationCandlesCount).toBe(2);
    expect(signals.entryDistanceFromOpeningRangeReferenceLevelPct).toBe(0.026786);
  });

  it("treats provider session alias values as canonical market-open context", () => {
    const result: RawTradeTimelineBuildResult = {
      input: {
        symbol: "ABCD",
        timeframe: "1m",
        tradeDirection: "long",
        executions: normalizeExecutions([
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:33:30.000Z",
            side: "buy",
            shares: 100,
            price: 1.185,
          },
        ]),
        preTradeCandles: normalizeCandles([
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:30:00.000Z",
            timeframe: "1m",
            open: 1.1,
            high: 1.14,
            low: 1.09,
            close: 1.13,
            volume: 10000,
            sessionBucket: "open",
          },
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:31:00.000Z",
            timeframe: "1m",
            open: 1.13,
            high: 1.17,
            low: 1.12,
            close: 1.16,
            volume: 14000,
            sessionBucket: "open",
          },
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:32:00.000Z",
            timeframe: "1m",
            open: 1.16,
            high: 1.19,
            low: 1.15,
            close: 1.18,
            volume: 16000,
            sessionBucket: "open",
          },
        ]),
        tradeCandles: [],
        postTradeCandles: [],
        sessionContext: {
          sessionBucket: "market_open",
          sessionDate: "2024-04-12",
        },
      },
      timeline: {
        symbol: "ABCD",
        timeframe: "1m",
        tradeDirection: "long",
        sessionContext: {
          sessionBucket: "market_open",
          sessionDate: "2024-04-12",
        },
        executions: normalizeExecutions([
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:33:30.000Z",
            side: "buy",
            shares: 100,
            price: 1.185,
          },
        ]),
        preTradeCandles: normalizeCandles([
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:30:00.000Z",
            timeframe: "1m",
            open: 1.1,
            high: 1.14,
            low: 1.09,
            close: 1.13,
            volume: 10000,
            sessionBucket: "open",
          },
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:31:00.000Z",
            timeframe: "1m",
            open: 1.13,
            high: 1.17,
            low: 1.12,
            close: 1.16,
            volume: 14000,
            sessionBucket: "open",
          },
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:32:00.000Z",
            timeframe: "1m",
            open: 1.16,
            high: 1.19,
            low: 1.15,
            close: 1.18,
            volume: 16000,
            sessionBucket: "open",
          },
        ]),
        tradeCandles: [],
        postTradeCandles: [],
        allCandles: normalizeCandles([
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:30:00.000Z",
            timeframe: "1m",
            open: 1.1,
            high: 1.14,
            low: 1.09,
            close: 1.13,
            volume: 10000,
            sessionBucket: "open",
          },
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:31:00.000Z",
            timeframe: "1m",
            open: 1.13,
            high: 1.17,
            low: 1.12,
            close: 1.16,
            volume: 14000,
            sessionBucket: "open",
          },
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:32:00.000Z",
            timeframe: "1m",
            open: 1.16,
            high: 1.19,
            low: 1.15,
            close: 1.18,
            volume: 16000,
            sessionBucket: "open",
          },
        ]),
        executionContextWindows: [],
        tradeStateSeries: {
          snapshots: [],
        },
        timelineSegments: [],
      },
    };

    const signals = buildEntryContextDerivedSignals(result);

    expect(signals.sessionBucketAtEntry).toBe("market_open");
    expect(signals.entryOccurredDuringMarketOpenSession).toBe(true);
    expect(signals.openingRangeCandlesCountBeforeEntry).toBe(3);
  });
});
