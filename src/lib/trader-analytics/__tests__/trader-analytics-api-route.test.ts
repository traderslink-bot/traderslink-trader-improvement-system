import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  GET,
  POST,
} from "../../../../app/api/trader-analytics/debug/route";
import {
  createTraderIntelligenceTestRequest,
  installTraderIntelligenceLocalTestEnvironment,
} from "../../../test/trader-intelligence-request";

let restoreEnvironment: () => void;

beforeEach(() => {
  restoreEnvironment = installTraderIntelligenceLocalTestEnvironment();
});

afterEach(() => restoreEnvironment());

const validRequest = {
  symbol: "ABCD",
  tradeDirection: "long",
  sessionContext: {
    sessionDate: "2026-05-01",
    sessionBucket: "market_open",
  },
  executions: [
    {
      symbol: "ABCD",
      timestamp: "2026-05-01T13:30:00.000Z",
      side: "buy",
      shares: 100,
      price: 10,
    },
    {
      symbol: "ABCD",
      timestamp: "2026-05-01T13:45:00.000Z",
      side: "sell",
      shares: 100,
      price: 11,
    },
  ],
};

function jsonPost(body: unknown): Request {
  return createTraderIntelligenceTestRequest("http://localhost/api/trader-analytics/debug", {
    method: "POST",
    origin: "http://localhost",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("/api/trader-analytics/debug", () => {
  it("describes the debug route contract", async () => {
    const response = await GET(
      createTraderIntelligenceTestRequest("http://localhost/api/trader-analytics/debug"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      contractVersion: "trader_analytics_debug_api_v1",
      route: "/api/trader-analytics/debug",
      outputContract: "trader_analytics_report_v1",
      dataSource: "execution_feedback_summaries",
      marketContextUsed: false,
    });
  });

  it("returns trader analytics for a wrapped request batch", async () => {
    const response = await POST(
      jsonPost({
        requests: [validRequest],
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      contractVersion: "trader_analytics_report_v1",
      source: "api:/api/trader-analytics/debug",
      sampleSize: {
        requestCount: 1,
        completedTradeCount: 1,
        failedTradeCount: 0,
      },
      charts: {
        grossPnlByTrade: {
          id: "gross_pnl_by_trade",
        },
      },
    });
  });

  it("keeps validate-only analytics explicit and execution-only", async () => {
    const response = await POST(
      jsonPost({
        validateOnly: true,
        request: validRequest,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      sourceBatch: {
        validateOnly: true,
      },
      sampleSize: {
        requestCount: 1,
        validatedOnlyCount: 1,
        completedTradeCount: 0,
      },
    });
  });

  it("returns a 400 contract error for invalid JSON", async () => {
    const response = await POST(
      createTraderIntelligenceTestRequest("http://localhost/api/trader-analytics/debug", {
        method: "POST",
        origin: "http://localhost",
        body: "{",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      contractVersion: "trader_analytics_api_error_v1",
      error: {
        code: "invalid_json",
      },
    });
  });
});
