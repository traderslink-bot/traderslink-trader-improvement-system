import { describe, expect, it } from "vitest";
import {
  assertValidTradeAnalysisRequest,
  parseTradeAnalysisRequestDocument,
  toLevelsSystemCandleTradeRequest,
  validateTradeAnalysisRequest,
} from "../request/trade-analysis-request-contract";

const validLongRequest = {
  symbol: " abcd ",
  tradeDirection: "long",
  sessionContext: {
    sessionDate: "2026-05-01",
    sessionBucket: "market_open",
  },
  provider: {
    preferredProvider: "ibkr",
    asOfTimestamp: "2026-05-01T20:00:00.000Z",
    lookbackBars: {
      daily: "520",
      "4h": 180,
      "5m": 120,
    },
  },
  executions: [
    {
      symbol: "ABCD",
      timestamp: "2026-05-01T13:35:00.000Z",
      side: "buy",
      shares: "100",
      price: "1.24",
      source: "manual",
    },
    {
      symbol: "ABCD",
      timestamp: "2026-05-01T13:46:00.000Z",
      side: "sell",
      shares: 100,
      price: 1.31,
      source: "manual",
    },
  ],
  tradeWindow: {
    timeframe: "1m",
    preTradeMinutes: 60,
    postTradeMinutes: 60,
  },
};

describe("trade analysis request contract", () => {
  it("validates and normalizes a user-entered long trade request", () => {
    const validation = validateTradeAnalysisRequest(validLongRequest);

    expect(validation.valid).toBe(true);
    expect(validation.request).toMatchObject({
      symbol: "ABCD",
      tradeDirection: "long",
      sessionContext: {
        sessionDate: "2026-05-01",
        sessionBucket: "market_open",
      },
      levelsSystem: {
        preferredProvider: "ibkr",
        asOfTimestamp: "2026-05-01T20:00:00.000Z",
        lookbackBars: {
          daily: 520,
          "4h": 180,
          "5m": 120,
        },
      },
    });
    expect(validation.request?.executions).toHaveLength(2);

    const trade = toLevelsSystemCandleTradeRequest(validation.request!);

    expect(trade).toMatchObject({
      symbol: "ABCD",
      tradeDirection: "long",
      tradeWindow: {
        timeframe: "1m",
      },
    });
  });

  it("passes supplied trade-window candles through to the v2 analysis request", () => {
    const suppliedCandle = {
      symbol: "ABCD",
      timestamp: "2026-05-01T13:36:00.000Z",
      timeframe: "1m",
      open: 1.24,
      high: 1.28,
      low: 1.23,
      close: 1.27,
      volume: 10000,
    };
    const validation = validateTradeAnalysisRequest({
      ...validLongRequest,
      preTradeCandles: [{ ...suppliedCandle, timestamp: "2026-05-01T13:34:00.000Z" }],
      tradeCandles: [suppliedCandle],
      postTradeCandles: [{ ...suppliedCandle, timestamp: "2026-05-01T13:47:00.000Z" }],
    });

    expect(validation.valid).toBe(true);

    const trade = toLevelsSystemCandleTradeRequest(validation.request!);

    expect(trade.preTradeCandles).toHaveLength(1);
    expect(trade.tradeCandles).toEqual([suppliedCandle]);
    expect(trade.postTradeCandles).toHaveLength(1);
  });

  it("accepts a short trade sequence that opens with sell and covers with buy", () => {
    const validation = validateTradeAnalysisRequest({
      ...validLongRequest,
      tradeDirection: "short",
      executions: [
        {
          symbol: "ABCD",
          timestamp: "2026-05-01T13:35:00.000Z",
          side: "sell",
          shares: 100,
          price: 1.24,
        },
        {
          symbol: "ABCD",
          timestamp: "2026-05-01T13:46:00.000Z",
          side: "buy",
          shares: 100,
          price: 1.17,
        },
      ],
    });

    expect(validation.valid).toBe(true);
    expect(validation.issues).toEqual([]);
  });

  it("rejects obvious user-input problems before calling levels-system", () => {
    const validation = validateTradeAnalysisRequest({
      symbol: "ABCD",
      tradeDirection: "long",
      sessionContext: {
        sessionDate: "2026/05/01",
        sessionBucket: "not-a-session",
      },
      provider: {
        preferredProvider: "made_up_provider",
      },
      executions: [
        {
          symbol: "WXYZ",
          timestamp: "",
          side: "hold",
          shares: 0,
          price: -1,
        },
      ],
    });

    expect(validation.valid).toBe(false);
    expect(validation.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "invalid_session_date",
        "invalid_session_bucket",
        "unsupported_provider",
        "mixed_execution_symbols",
        "invalid_execution_timestamp",
        "invalid_execution_side",
        "invalid_execution_shares",
        "invalid_execution_price",
      ]),
    );
    expect(
      validation.issues.find((issue) => issue.code === "unsupported_provider")
        ?.message,
    ).toBe(
      "provider.preferredProvider must be one of ibkr, eodhd, yahoo, or stub.",
    );
  });

  it("accepts the current EODHD levels-system provider", () => {
    const validation = validateTradeAnalysisRequest({
      ...validLongRequest,
      provider: {
        preferredProvider: "eodhd",
      },
    });

    expect(validation.valid).toBe(true);
    expect(validation.request?.levelsSystem.preferredProvider).toBe("eodhd");
  });

  it("does not accept removed historical candle providers in app requests", () => {
    const validation = validateTradeAnalysisRequest({
      ...validLongRequest,
      provider: {
        preferredProvider: "external_vendor",
      },
    });

    expect(validation.valid).toBe(false);
    expect(validation.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "unsupported_provider",
          message:
            "provider.preferredProvider must be one of ibkr, eodhd, yahoo, or stub.",
        }),
      ]),
    );
  });

  it("rejects long trades that try to sell before opening a position", () => {
    const validation = validateTradeAnalysisRequest({
      ...validLongRequest,
      executions: [
        {
          symbol: "ABCD",
          timestamp: "2026-05-01T13:35:00.000Z",
          side: "sell",
          shares: 100,
          price: 1.24,
        },
      ],
    });

    expect(validation.valid).toBe(false);
    expect(validation.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "exit_before_entry",
          severity: "error",
        }),
      ]),
    );
  });

  it("warns but still validates when executions are unsorted or position remains open", () => {
    const validation = validateTradeAnalysisRequest({
      ...validLongRequest,
      executions: [
        {
          symbol: "ABCD",
          timestamp: "2026-05-01T13:46:00.000Z",
          side: "buy",
          shares: 50,
          price: 1.31,
        },
        {
          symbol: "ABCD",
          timestamp: "2026-05-01T13:35:00.000Z",
          side: "buy",
          shares: 100,
          price: 1.24,
        },
      ],
    });

    expect(validation.valid).toBe(true);
    expect(validation.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "execution_order_will_be_normalized",
          severity: "warning",
        }),
        expect.objectContaining({
          code: "open_position",
          severity: "warning",
        }),
      ]),
    );
    expect(validation.request?.executions[0].timestamp).toBe(
      "2026-05-01T13:35:00.000Z",
    );
  });

  it("parses common request document wrappers", () => {
    expect(
      parseTradeAnalysisRequestDocument({ request: validLongRequest }).requests,
    ).toHaveLength(1);
    expect(
      parseTradeAnalysisRequestDocument({ trades: [validLongRequest] })
        .requests,
    ).toHaveLength(1);
    expect(
      parseTradeAnalysisRequestDocument([validLongRequest]).requests,
    ).toHaveLength(1);
  });

  it("throws a compact validation error for app-facing callers", () => {
    expect(() => assertValidTradeAnalysisRequest({})).toThrowError(
      /invalid trade analysis request/i,
    );
  });
});
