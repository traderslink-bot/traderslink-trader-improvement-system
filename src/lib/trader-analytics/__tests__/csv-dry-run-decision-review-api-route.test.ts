import { homedir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  GET,
  POST,
} from "../../../../app/api/import-dry-run/decision-review/route";
import {
  createTraderIntelligenceTestRequest,
  installTraderIntelligenceLocalTestEnvironment,
} from "../../../test/trader-intelligence-request";

let restoreEnvironment: () => void;

function jsonPost(body: unknown): Request {
  return createTraderIntelligenceTestRequest("http://localhost/api/import-dry-run/decision-review", {
    method: "POST",
    origin: "http://localhost",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("/api/import-dry-run/decision-review", () => {
  const previousProvider = process.env.LEVELS_SYSTEM_PROVIDER;
  beforeEach(() => {
    restoreEnvironment = installTraderIntelligenceLocalTestEnvironment({
      TRADER_INTELLIGENCE_DATA_MODE: "real_owner_data",
      TRADER_INTELLIGENCE_DB_PATH: join(
        homedir(),
        ".trader-intelligence-tests",
        "dry-run.sqlite",
      ),
    });
  });

  afterEach(() => {
    if (previousProvider === undefined) {
      delete process.env.LEVELS_SYSTEM_PROVIDER;
    } else {
      process.env.LEVELS_SYSTEM_PROVIDER = previousProvider;
    }
    restoreEnvironment();
  });

  it("describes the decision-review route contract", async () => {
    const response = await GET(
      createTraderIntelligenceTestRequest("http://localhost/api/import-dry-run/decision-review"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      contractVersion: "csv_dry_run_decision_review_api_v1",
      route: "/api/import-dry-run/decision-review",
      outputContract: "csv_dry_run_decision_review_bridge_v1",
    });
    expect(body.diagnosticCodes).toContain("market_context_unavailable");
  });

  it("returns a 400 contract error for invalid JSON", async () => {
    const response = await POST(
      createTraderIntelligenceTestRequest("http://localhost/api/import-dry-run/decision-review", {
        method: "POST",
        origin: "http://localhost",
        body: "{",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      contractVersion: "csv_dry_run_decision_review_api_error_v1",
      error: {
        code: "invalid_json",
      },
    });
  });

  it("returns a 400 contract error for invalid request shape", async () => {
    const response = await POST(
      jsonPost({
        csvText: "",
        broker: "not_a_broker",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      error: {
        code: "invalid_request",
      },
    });
  });

  it("returns a 400 contract error for invalid column mapping values", async () => {
    const response = await POST(
      jsonPost({
        broker: "generic_execution_csv",
        csvText: "Date,Time,Symbol,Side,Quantity,Price",
        columnMapping: {
          symbol: 123,
        },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      error: {
        code: "invalid_request",
        message: "columnMapping.symbol must be a string or string array when provided.",
      },
    });
  });

  it("returns blocked diagnostics without provider analysis", async () => {
    const response = await POST(
      jsonPost({
        broker: "generic_execution_csv",
        csvText: [
          "Date,Time,Symbol,Side,Quantity,Price",
          "2024-04-12,09:33:30,,Buy,100,1.185",
          "2024-04-12,09:39:10,ABCD,Sell,100,1.295",
        ].join("\n"),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      contractVersion: "csv_dry_run_decision_review_bridge_v1",
      importStatus: "blocked",
      completedReviewCount: 0,
    });
    expect(body.diagnostics[0]).toMatchObject({
      code: "import_blocked",
    });
  });

  it("returns decision-review snapshots for completed dry-run trades", async () => {
    process.env.LEVELS_SYSTEM_PROVIDER = "stub";

    const response = await POST(
      jsonPost({
        broker: "generic_execution_csv",
        maxTrades: 1,
        csvText: [
          "Date,Time,Symbol,Side,Quantity,Price",
          "2026-05-01,09:30:00,ABCD,Buy,100,10.00",
          "2026-05-01,09:32:00,ABCD,Buy,100,9.50",
          "2026-05-01,09:34:00,ABCD,Buy,100,9.00",
          "2026-05-01,09:36:00,ABCD,Buy,100,8.50",
          "2026-05-01,10:05:00,ABCD,Sell,400,8.25",
        ].join("\n"),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      contractVersion: "csv_dry_run_decision_review_bridge_v1",
      completedReviewCount: 1,
    });
    expect(body.decisionReviews[0]).toMatchObject({
      marketContextSource: "none",
    });
  }, 120_000);
});
