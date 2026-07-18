import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  GET,
  POST,
} from "../../../../app/api/execution-feedback/debug/route";
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
  return createTraderIntelligenceTestRequest("http://localhost/api/execution-feedback/debug", {
    method: "POST",
    origin: "http://localhost",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("/api/execution-feedback/debug", () => {
  it("describes the debug route contract", async () => {
    const response = await GET(
      createTraderIntelligenceTestRequest("http://localhost/api/execution-feedback/debug"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      contractVersion: "execution_feedback_debug_api_v1",
      route: "/api/execution-feedback/debug",
      outputContract: "batch_execution_feedback_v1",
      dataSource: "executions_only",
    });
  });

  it("runs execution-only feedback for a wrapped single request", async () => {
    const response = await POST(
      jsonPost({
        request: validRequest,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      contractVersion: "batch_execution_feedback_v1",
      source: "api:/api/execution-feedback/debug",
      totals: {
        requests: 1,
        validated: 1,
        completed: 1,
        failed: 0,
      },
      items: [
        {
          status: "completed",
          summary: {
            contractVersion: "execution_feedback_summary_v1",
            dataSource: "executions_only",
          },
        },
      ],
    });
  });

  it("validates batch request documents without building summaries", async () => {
    const response = await POST(
      jsonPost({
        validateOnly: true,
        requests: [
          validRequest,
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
      validateOnly: true,
      totals: {
        requests: 2,
        validated: 1,
        completed: 0,
        failed: 1,
      },
      items: [
        {
          status: "validated",
          summary: null,
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
      createTraderIntelligenceTestRequest("http://localhost/api/execution-feedback/debug", {
        method: "POST",
        origin: "http://localhost",
        body: "{",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      contractVersion: "execution_feedback_api_error_v1",
      error: {
        code: "invalid_json",
      },
    });
  });
});
