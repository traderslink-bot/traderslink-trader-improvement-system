import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  GET,
  POST,
} from "../../../../app/api/trade-analysis/debug/route";
import { sampleCreateRawTradeTimelineInput } from "../../raw-trade-timeline/__fixtures__/sample-create-raw-trade-timeline-input";
import {
  createTraderIntelligenceTestRequest,
  installTraderIntelligenceLocalTestEnvironment,
} from "../../../test/trader-intelligence-request";

let restoreEnvironment: () => void;

beforeEach(() => {
  restoreEnvironment = installTraderIntelligenceLocalTestEnvironment();
});

afterEach(() => restoreEnvironment());

function buildSampleRequest() {
  return {
    symbol: sampleCreateRawTradeTimelineInput.symbol,
    tradeDirection: sampleCreateRawTradeTimelineInput.tradeDirection,
    executions: sampleCreateRawTradeTimelineInput.executions,
    sessionContext: sampleCreateRawTradeTimelineInput.sessionContext,
    provider: {
      preferredProvider: "stub",
    },
    tradeWindow: {
      timeframe: "1m",
      preTradeMinutes: 60,
      postTradeMinutes: 60,
    },
  };
}

function jsonPost(body: unknown): Request {
  return createTraderIntelligenceTestRequest("http://localhost/api/trade-analysis/debug", {
    method: "POST",
    origin: "http://localhost",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("/api/trade-analysis/debug", () => {
  it("describes the debug route contract", async () => {
    const response = await GET(
      createTraderIntelligenceTestRequest("http://localhost/api/trade-analysis/debug"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      contractVersion: "trade_analysis_debug_api_v1",
      route: "/api/trade-analysis/debug",
      outputContract: "batch_trade_analysis_v1",
    });
  });

  it("validates a single wrapped request without provider analysis", async () => {
    const response = await POST(
      jsonPost({
        validateOnly: true,
        request: buildSampleRequest(),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      contractVersion: "batch_trade_analysis_v1",
      source: "api:/api/trade-analysis/debug",
      validateOnly: true,
      totals: {
        requests: 1,
        validated: 1,
        completed: 0,
        failed: 0,
      },
    });
  });

  it("validates batch request documents and returns local validation failures", async () => {
    const response = await POST(
      jsonPost({
        validateOnly: true,
        requests: [
          buildSampleRequest(),
          {
            symbol: "ABCD",
            tradeDirection: "sideways",
            sessionContext: {
              sessionDate: "2026-05-01",
              sessionBucket: "market_open",
            },
            executions: [],
          },
        ],
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      totals: {
        requests: 2,
        validated: 1,
        failed: 1,
      },
      failureCounts: {
        invalid_trade_request: 1,
      },
      items: [
        {
          status: "validated",
        },
        {
          status: "failed",
          failure: {
            source: "local_validation",
          },
        },
      ],
    });
  });

  it("returns a 400 contract error for invalid JSON", async () => {
    const response = await POST(
      createTraderIntelligenceTestRequest("http://localhost/api/trade-analysis/debug", {
        method: "POST",
        origin: "http://localhost",
        body: "{",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      contractVersion: "trade_analysis_api_error_v1",
      error: {
        code: "invalid_json",
      },
    });
  });
});
