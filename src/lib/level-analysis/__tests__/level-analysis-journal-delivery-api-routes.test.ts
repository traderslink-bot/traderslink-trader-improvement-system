import { mkdtempSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET as getRawDeliveryPayload } from "../../../../app/api/admin/level-analysis/deliveries/[deliveryId]/raw/route";
import { POST as ingestDelivery } from "../../../../app/api/level-analysis/deliveries/route";
import { GET as getLatestDelivery } from "../../../../app/api/level-analysis/deliveries/latest/route";
import { GET as getLatestSymbolSummary } from "../../../../app/api/level-analysis/deliveries/latest/symbols/[symbol]/route";
import { POST as validateDelivery } from "../../../../app/api/level-analysis/deliveries/validate/route";
import { resetTraderIntelligenceDatabaseForTests } from "../../trader-analytics/product/import-commit/sqlite-import-commit-repository";
import deliveryFixture from "../__fixtures__/level-analysis-journal-delivery-package-v1.compact.json";
import oldSnapshotFixture from "../__fixtures__/journal-connector-level-analysis-snapshot-v1.json";
import {
  LEVEL_ANALYSIS_DELIVERY_API_FEATURE_FLAG,
  LEVEL_ANALYSIS_DELIVERY_RAW_DEBUG_FEATURE_FLAG,
} from "../level-analysis-journal-delivery-persistence-storage";
import {
  createTraderIntelligenceTestRequest,
  installTraderIntelligenceLocalTestEnvironment,
} from "../../../test/trader-intelligence-request";

let tempDir = "";
let originalDbPath: string | undefined;
let originalApiFlag: string | undefined;
let originalRawDebugFlag: string | undefined;
let originalDataMode: string | undefined;
let restoreEnvironment: () => void;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function jsonRequest(path: string, body: unknown): Request {
  return createTraderIntelligenceTestRequest(`http://localhost${path}`, {
    method: "POST",
    origin: "http://localhost",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function localGet(url: string): Request {
  return createTraderIntelligenceTestRequest(url);
}

function collectStringValues(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    out.push(value);
    return out;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectStringValues(item, out);
    }
    return out;
  }

  if (typeof value === "object" && value !== null) {
    for (const item of Object.values(value)) {
      collectStringValues(item, out);
    }
  }

  return out;
}

function expectNoAdviceLanguage(value: unknown): void {
  const text = collectStringValues(value).join("\n").toLowerCase();

  for (const [label, pattern] of [
    ["grading", /\bgrading\b|\btrade grade\b/],
    ["coaching", /\bcoaching\b|\bcoach\b/],
    ["p/l", /\bp\/l\b|\bpnl\b/],
    ["giveback", /\bgiveback\b/],
    ["behavior scoring", /\bbehavior score\b|\bbehavior scoring\b/],
    ["recommendation", /\brecommendation\b/],
    ["buy/sell/hold", /\bbuy\b|\bsell\b|\bhold\b/],
    ["trade advice", /\btrade advice\b/],
  ] as const) {
    expect(pattern.test(text), `Unexpected ${label} language`).toBe(false);
  }
}

beforeEach(() => {
  originalDbPath = process.env.TRADER_INTELLIGENCE_DB_PATH;
  originalApiFlag = process.env[LEVEL_ANALYSIS_DELIVERY_API_FEATURE_FLAG];
  originalRawDebugFlag = process.env[LEVEL_ANALYSIS_DELIVERY_RAW_DEBUG_FEATURE_FLAG];
  originalDataMode = process.env.TRADER_INTELLIGENCE_DATA_MODE;
  tempDir = mkdtempSync(join(homedir(), ".level-analysis-delivery-api-"));
  restoreEnvironment = installTraderIntelligenceLocalTestEnvironment({
    TRADER_INTELLIGENCE_DB_PATH: join(tempDir, "test.sqlite"),
    TRADER_INTELLIGENCE_DATA_MODE: "real_owner_data",
  });
  process.env[LEVEL_ANALYSIS_DELIVERY_API_FEATURE_FLAG] = "1";
  process.env[LEVEL_ANALYSIS_DELIVERY_RAW_DEBUG_FEATURE_FLAG] = "1";
  resetTraderIntelligenceDatabaseForTests();
});

afterEach(() => {
  resetTraderIntelligenceDatabaseForTests();
  if (originalDbPath === undefined) {
    delete process.env.TRADER_INTELLIGENCE_DB_PATH;
  } else {
    process.env.TRADER_INTELLIGENCE_DB_PATH = originalDbPath;
  }
  if (originalApiFlag === undefined) {
    delete process.env[LEVEL_ANALYSIS_DELIVERY_API_FEATURE_FLAG];
  } else {
    process.env[LEVEL_ANALYSIS_DELIVERY_API_FEATURE_FLAG] = originalApiFlag;
  }
  if (originalRawDebugFlag === undefined) {
    delete process.env[LEVEL_ANALYSIS_DELIVERY_RAW_DEBUG_FEATURE_FLAG];
  } else {
    process.env[LEVEL_ANALYSIS_DELIVERY_RAW_DEBUG_FEATURE_FLAG] = originalRawDebugFlag;
  }
  if (originalDataMode === undefined) {
    delete process.env.TRADER_INTELLIGENCE_DATA_MODE;
  } else {
    process.env.TRADER_INTELLIGENCE_DATA_MODE = originalDataMode;
  }
  restoreEnvironment();
  rmSync(tempDir, { recursive: true, force: true });
});

describe("level-analysis journal delivery API routes", () => {
  it("validates, ingests, deduplicates, and retrieves packaged delivery facts", async () => {
    const validateResponse = await validateDelivery(
      jsonRequest("/api/level-analysis/deliveries/validate", {
        payload: clone(deliveryFixture),
      }),
    );
    const validateBody = await validateResponse.json();

    expect(validateResponse.status).toBe(200);
    expect(validateBody).toMatchObject({
      contractVersion: "level_analysis_delivery_validate_api_v1",
      status: "accepted",
      sourceKind: "packaged_review_delivery",
      compactSummary: {
        provider: "ibkr",
        cacheFingerprintCounts: {
          fifteenMinuteContextOnlyCount: 2,
        },
      },
    });

    const ingestResponse = await ingestDelivery(
      jsonRequest("/api/level-analysis/deliveries", {
        payload: clone(deliveryFixture),
      }),
    );
    const ingestBody = await ingestResponse.json();

    expect(ingestResponse.status).toBe(200);
    expect(ingestBody).toMatchObject({
      contractVersion: "level_analysis_delivery_ingest_api_v1",
      status: "accepted",
      duplicate: false,
      compactSummary: {
        symbolCount: 2,
        mismatchCount: 0,
        allFifteenMinuteContextOnly: true,
      },
    });
    expect(ingestBody.perSymbolSummary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          symbol: "DEVS",
          densityMetricSummary: expect.objectContaining({
            classification: "dense_clustered",
          }),
          candidateInventoryGapSummary: expect.objectContaining({
            overall: "no_gap",
          }),
          volumeSessionContextSummary: expect.objectContaining({
            outcome: "surfaced_has_more_session_volume_context",
          }),
        }),
      ]),
    );

    const duplicateResponse = await ingestDelivery(
      jsonRequest("/api/level-analysis/deliveries", {
        payload: clone(deliveryFixture),
      }),
    );
    const duplicateBody = await duplicateResponse.json();
    expect(duplicateBody).toMatchObject({
      status: "accepted",
      duplicate: true,
      deliveryId: ingestBody.deliveryId,
      rawPayloadHash: ingestBody.rawPayloadHash,
    });

    const latestBody = await (
      await getLatestDelivery(
        localGet("http://localhost/api/level-analysis/deliveries/latest?provider=ibkr"),
      )
    ).json();
    expect(latestBody).toMatchObject({
      contractVersion: "level_analysis_delivery_latest_api_v1",
      status: "found",
      deliveryId: ingestBody.deliveryId,
      symbols: ["DEVS", "QUBT"],
    });

    const symbolBody = await (
      await getLatestSymbolSummary(
        localGet(
          "http://localhost/api/level-analysis/deliveries/latest/symbols/qubt?provider=ibkr",
        ),
        { params: Promise.resolve({ symbol: "qubt" }) },
      )
    ).json();
    expect(symbolBody).toMatchObject({
      contractVersion: "level_analysis_delivery_symbol_latest_api_v1",
      status: "found",
      deliveryId: ingestBody.deliveryId,
      symbol: "QUBT",
      summary: {
        fifteenMinuteContextOnlyStatus: "context_only",
        candidateInventoryGapSummary: {
          overall: "closer_unsurfaced_candidate",
        },
        volumeSessionContextSummary: {
          outcome: "candidate_identifier_unavailable",
        },
      },
    });

    const rawBody = await (
      await getRawDeliveryPayload(
        localGet(
          `http://localhost/api/admin/level-analysis/deliveries/${ingestBody.deliveryId}/raw`,
        ),
        { params: Promise.resolve({ deliveryId: ingestBody.deliveryId }) },
      )
    ).json();
    expect(rawBody).toMatchObject({
      contractVersion: "level_analysis_delivery_raw_admin_api_v1",
      status: "found",
      deliveryId: ingestBody.deliveryId,
      rawPayloadHash: ingestBody.rawPayloadHash,
      validationStatus: "accepted",
    });
    expect(rawBody.rawPayload).toEqual(deliveryFixture);
    expectNoAdviceLanguage({
      validateBody,
      ingestBody,
      latestBody,
      symbolBody,
    });
  });

  it("persists malformed payloads as quarantine records", async () => {
    const malformed = clone(deliveryFixture) as Record<string, unknown>;
    delete malformed.entries;

    const response = await ingestDelivery(
      jsonRequest("/api/level-analysis/deliveries", { payload: malformed }),
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body).toMatchObject({
      contractVersion: "level_analysis_delivery_ingest_api_v1",
      status: "quarantined",
    });
    expect(body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "missing_entries" })]),
    );

    const rawBody = await (
      await getRawDeliveryPayload(
        localGet(
          `http://localhost/api/admin/level-analysis/deliveries/${body.deliveryId}/raw`,
        ),
        { params: Promise.resolve({ deliveryId: body.deliveryId }) },
      )
    ).json();

    expect(rawBody).toMatchObject({
      status: "found",
      validationStatus: "quarantined",
    });
    expect(rawBody.rawPayload).toEqual(malformed);
  });

  it("keeps old LevelAnalysisSnapshot v1 payloads ingestible through the API", async () => {
    const response = await ingestDelivery(
      jsonRequest("/api/level-analysis/deliveries", {
        payload: clone(oldSnapshotFixture),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: "accepted",
      duplicate: false,
      compactSummary: {
        sourceKind: "single_snapshot_v1",
        symbolCount: 1,
      },
      perSymbolSummary: [
        expect.objectContaining({
          symbol: "SNAP",
          fifteenMinuteContextOnlyStatus: "not_supplied",
        }),
      ],
    });
  });

  it("keeps production API access behind the feature flag", async () => {
    delete process.env[LEVEL_ANALYSIS_DELIVERY_API_FEATURE_FLAG];

    const response = await validateDelivery(
      jsonRequest("/api/level-analysis/deliveries/validate", {
        payload: clone(deliveryFixture),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toMatchObject({
      ok: false,
      code: "feature_disabled",
    });
  });
});
