import { mkdtempSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET as getAdminTradeLink } from "../../../../app/api/admin/level-analysis/trade-links/[linkId]/route";
import { POST as persistTradeLink } from "../../../../app/api/level-analysis/trade-links/route";
import { POST as resolveTradeLink } from "../../../../app/api/level-analysis/trade-links/resolve/route";
import { GET as getTradeLevelAnalysis } from "../../../../app/api/trades/[tradeId]/level-analysis/route";
import { GET as getTradeDetailLevelFacts } from "../../../../app/api/trades/[tradeId]/level-analysis/facts/route";
import { resetTraderIntelligenceDatabaseForTests } from "../../trader-analytics/product/import-commit/sqlite-import-commit-repository";
import deliveryFixture from "../__fixtures__/level-analysis-journal-delivery-package-v1.compact.json";
import oldSnapshotFixture from "../__fixtures__/journal-connector-level-analysis-snapshot-v1.json";
import { ingestJournalLevelAnalysisDeliveryForApi } from "../level-analysis-journal-delivery-api-service";
import { getTradeDetailLevelFactsForApi } from "../level-analysis-journal-delivery-trade-link-api-service";
import {
  LEVEL_ANALYSIS_DELIVERY_API_FEATURE_FLAG,
} from "../level-analysis-journal-delivery-persistence-storage";
import {
  LEVEL_ANALYSIS_TRADE_DETAIL_LEVEL_FACTS_FEATURE_FLAG,
  LEVEL_ANALYSIS_TRADE_LINK_ADMIN_DEBUG_FEATURE_FLAG,
  LEVEL_ANALYSIS_TRADE_LINK_API_FEATURE_FLAG,
} from "../level-analysis-journal-delivery-trade-link-storage";
import {
  createTraderIntelligenceTestRequest,
  installTraderIntelligenceLocalTestEnvironment,
} from "../../../test/trader-intelligence-request";

let tempDir = "";
let originalDbPath: string | undefined;
let originalDeliveryApiFlag: string | undefined;
let originalTradeLinkApiFlag: string | undefined;
let originalTradeLinkAdminFlag: string | undefined;
let originalTradeDetailFactsFlag: string | undefined;
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

function expectNoRawPayload(value: unknown): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      expectNoRawPayload(item);
    }
    return;
  }

  if (typeof value !== "object" || value === null) {
    return;
  }

  expect(Object.hasOwn(value, "rawPayload")).toBe(false);
  for (const item of Object.values(value)) {
    expectNoRawPayload(item);
  }
}

beforeEach(() => {
  originalDbPath = process.env.TRADER_INTELLIGENCE_DB_PATH;
  originalDeliveryApiFlag = process.env[LEVEL_ANALYSIS_DELIVERY_API_FEATURE_FLAG];
  originalTradeLinkApiFlag = process.env[LEVEL_ANALYSIS_TRADE_LINK_API_FEATURE_FLAG];
  originalTradeLinkAdminFlag =
    process.env[LEVEL_ANALYSIS_TRADE_LINK_ADMIN_DEBUG_FEATURE_FLAG];
  originalTradeDetailFactsFlag =
    process.env[LEVEL_ANALYSIS_TRADE_DETAIL_LEVEL_FACTS_FEATURE_FLAG];
  originalDataMode = process.env.TRADER_INTELLIGENCE_DATA_MODE;
  tempDir = mkdtempSync(join(homedir(), ".level-analysis-trade-link-api-"));
  restoreEnvironment = installTraderIntelligenceLocalTestEnvironment({
    TRADER_INTELLIGENCE_DB_PATH: join(tempDir, "test.sqlite"),
    TRADER_INTELLIGENCE_DATA_MODE: "real_owner_data",
  });
  process.env[LEVEL_ANALYSIS_DELIVERY_API_FEATURE_FLAG] = "1";
  process.env[LEVEL_ANALYSIS_TRADE_LINK_API_FEATURE_FLAG] = "1";
  process.env[LEVEL_ANALYSIS_TRADE_LINK_ADMIN_DEBUG_FEATURE_FLAG] = "1";
  process.env[LEVEL_ANALYSIS_TRADE_DETAIL_LEVEL_FACTS_FEATURE_FLAG] = "1";
  resetTraderIntelligenceDatabaseForTests();
});

afterEach(() => {
  resetTraderIntelligenceDatabaseForTests();
  if (originalDbPath === undefined) {
    delete process.env.TRADER_INTELLIGENCE_DB_PATH;
  } else {
    process.env.TRADER_INTELLIGENCE_DB_PATH = originalDbPath;
  }
  if (originalDeliveryApiFlag === undefined) {
    delete process.env[LEVEL_ANALYSIS_DELIVERY_API_FEATURE_FLAG];
  } else {
    process.env[LEVEL_ANALYSIS_DELIVERY_API_FEATURE_FLAG] = originalDeliveryApiFlag;
  }
  if (originalTradeLinkApiFlag === undefined) {
    delete process.env[LEVEL_ANALYSIS_TRADE_LINK_API_FEATURE_FLAG];
  } else {
    process.env[LEVEL_ANALYSIS_TRADE_LINK_API_FEATURE_FLAG] = originalTradeLinkApiFlag;
  }
  if (originalTradeLinkAdminFlag === undefined) {
    delete process.env[LEVEL_ANALYSIS_TRADE_LINK_ADMIN_DEBUG_FEATURE_FLAG];
  } else {
    process.env[LEVEL_ANALYSIS_TRADE_LINK_ADMIN_DEBUG_FEATURE_FLAG] =
      originalTradeLinkAdminFlag;
  }
  if (originalTradeDetailFactsFlag === undefined) {
    delete process.env[LEVEL_ANALYSIS_TRADE_DETAIL_LEVEL_FACTS_FEATURE_FLAG];
  } else {
    process.env[LEVEL_ANALYSIS_TRADE_DETAIL_LEVEL_FACTS_FEATURE_FLAG] =
      originalTradeDetailFactsFlag;
  }
  if (originalDataMode === undefined) {
    delete process.env.TRADER_INTELLIGENCE_DATA_MODE;
  } else {
    process.env.TRADER_INTELLIGENCE_DATA_MODE = originalDataMode;
  }
  restoreEnvironment();
  rmSync(tempDir, { recursive: true, force: true });
});

describe("level-analysis journal trade-link API routes", () => {
  it("resolves, persists, deduplicates, and retrieves a trade link", async () => {
    const delivery = ingestJournalLevelAnalysisDeliveryForApi({
      payload: clone(deliveryFixture),
      createdAt: "2026-06-06T19:40:00.000Z",
    });
    expect(delivery.status).toBe("accepted");

    const requestBody = {
      savedTradeId: "trade_DEVS_2026_06_01_001",
      workspaceId: "local-demo-workspace",
      accountId: "local-demo-account",
      userId: "local-demo-user",
      importBatchId: "import_batch_2026_06_01_001",
      symbol: "DEVS",
      provider: "ibkr",
      tradeEndedAt: "2026-06-01T16:05:00.000Z",
      createdAt: "2026-06-06T19:45:00.000Z",
    };

    const resolveResponse = await resolveTradeLink(
      jsonRequest("/api/level-analysis/trade-links/resolve", requestBody),
    );
    const resolveBody = await resolveResponse.json();

    expect(resolveResponse.status).toBe(200);
    expect(resolveBody).toMatchObject({
      contractVersion: "journal_level_analysis_trade_link_resolution_api_v1",
      status: "matched",
      savedTradeId: requestBody.savedTradeId,
      symbol: "DEVS",
      provider: "ibkr",
      candidate: {
        deliveryId: delivery.deliveryId,
        fifteenMinuteContextOnlyStatus: "context_only",
      },
    });

    const persistResponse = await persistTradeLink(
      jsonRequest("/api/level-analysis/trade-links", requestBody),
    );
    const persistBody = await persistResponse.json();

    expect(persistResponse.status).toBe(200);
    expect(persistBody).toMatchObject({
      contractVersion: "journal_level_analysis_trade_link_api_v1",
      status: "linked",
      savedTradeId: requestBody.savedTradeId,
      deliveryId: delivery.deliveryId,
      symbol: "DEVS",
      provider: "ibkr",
      duplicate: false,
    });

    const duplicateBody = await (
      await persistTradeLink(jsonRequest("/api/level-analysis/trade-links", requestBody))
    ).json();
    expect(duplicateBody).toMatchObject({
      status: "linked",
      duplicate: true,
      linkId: persistBody.linkId,
    });

    const tradeBody = await (
      await getTradeLevelAnalysis(
        localGet(
          `http://localhost/api/trades/${requestBody.savedTradeId}/level-analysis`,
        ),
        { params: Promise.resolve({ tradeId: requestBody.savedTradeId }) },
      )
    ).json();
    expect(tradeBody).toMatchObject({
      contractVersion: "journal_trade_level_analysis_api_v1",
      status: "found",
      savedTradeId: requestBody.savedTradeId,
      link: {
        linkStatus: "linked",
        linkedSymbolSummary: {
          densityMetricSummary: {
            classification: "dense_clustered",
          },
          candidateInventoryGapSummary: {
            overall: "no_gap",
          },
          volumeSessionContextSummary: {
            outcome: "surfaced_has_more_session_volume_context",
          },
        },
      },
    });

    const factsBody = await (
      await getTradeDetailLevelFacts(
        localGet(
          `http://localhost/api/trades/${requestBody.savedTradeId}/level-analysis/facts`,
        ),
        { params: Promise.resolve({ tradeId: requestBody.savedTradeId }) },
      )
    ).json();
    expect(factsBody).toMatchObject({
      contractVersion: "trade_detail_level_facts_read_model_v1",
      savedTradeId: requestBody.savedTradeId,
      featureEnabled: true,
      availability: {
        availability: "attached",
        sourceKind: "packaged_review_delivery",
        fifteenMinuteContextOnlyStatus: "context_only",
      },
      display: {
        shouldShowFactsPanel: true,
      },
      attachedFacts: {
        sourceKind: "packaged_review_delivery",
        symbol: "DEVS",
        provider: "ibkr",
        densityMetricSummary: {
          classification: "dense_clustered",
        },
        candidateInventoryGapSummary: {
          overall: "no_gap",
        },
        volumeSessionContextSummary: {
          outcome: "surfaced_has_more_session_volume_context",
        },
        cacheFingerprintSourceIntegrity: {
          mismatchCount: 0,
          prohibitedLanguageHitCount: 0,
        },
        fifteenMinuteContextOnlyStatus: "context_only",
      },
    });
    expect(factsBody.attachedFacts.sourceFiles["15m"]).toContain("/15m/");

    const disabledModel = getTradeDetailLevelFactsForApi({
      savedTradeId: requestBody.savedTradeId,
      featureEnabled: false,
    });
    expect(disabledModel).toMatchObject({
      featureEnabled: false,
      availability: {
        availability: "feature_disabled",
      },
    });
    expect(disabledModel.attachedFacts).toBeUndefined();

    const adminBody = await (
      await getAdminTradeLink(
        localGet(
          `http://localhost/api/admin/level-analysis/trade-links/${persistBody.linkId}`,
        ),
        { params: Promise.resolve({ linkId: persistBody.linkId }) },
      )
    ).json();
    expect(adminBody).toMatchObject({
      contractVersion: "journal_level_analysis_trade_link_api_v1",
      status: "found",
      linkId: persistBody.linkId,
      savedTradeId: requestBody.savedTradeId,
      rawPayloadHash: delivery.rawPayloadHash,
    });

    expectNoRawPayload({
      resolveBody,
      persistBody,
      duplicateBody,
      tradeBody,
      factsBody,
      adminBody,
    });
    expectNoAdviceLanguage({
      resolveBody,
      persistBody,
      duplicateBody,
      tradeBody,
      factsBody,
    });
  });

  it("blocks candidates after the selected as-of boundary", async () => {
    ingestJournalLevelAnalysisDeliveryForApi({
      payload: clone(deliveryFixture),
      createdAt: "2026-06-06T19:50:00.000Z",
    });

    const response = await resolveTradeLink(
      jsonRequest("/api/level-analysis/trade-links/resolve", {
        savedTradeId: "trade_DEVS_2026_06_01_early",
        symbol: "DEVS",
        provider: "ibkr",
        tradeEndedAt: "2026-06-01T15:00:00.000Z",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body).toMatchObject({
      status: "blocked",
      matchResult: {
        reason: "as_of_after_allowed_boundary",
      },
    });
    expect(body.candidate).toBeUndefined();
  });

  it("persists old LevelAnalysisSnapshot v1 trade links through manual selection", async () => {
    const delivery = ingestJournalLevelAnalysisDeliveryForApi({
      payload: clone(oldSnapshotFixture),
      createdAt: "2026-06-06T19:55:00.000Z",
    });
    expect(delivery.status).toBe("accepted");

    const response = await persistTradeLink(
      jsonRequest("/api/level-analysis/trade-links", {
        savedTradeId: "trade_SNAP_2026_05_01_001",
        symbol: "SNAP",
        provider: "fixture",
        deliveryId: delivery.deliveryId,
        linkSource: "manual_review",
        matchPolicy: {
          providerMatch: "explicit_provider",
          asOfPolicy: "manual_delivery_selection",
        },
        createdAt: "2026-06-06T20:00:00.000Z",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: "linked",
      deliveryId: delivery.deliveryId,
      symbol: "SNAP",
      provider: "fixture",
    });

    const factsBody = await (
      await getTradeDetailLevelFacts(
        localGet(
          "http://localhost/api/trades/trade_SNAP_2026_05_01_001/level-analysis/facts",
        ),
        { params: Promise.resolve({ tradeId: "trade_SNAP_2026_05_01_001" }) },
      )
    ).json();
    expect(factsBody).toMatchObject({
      contractVersion: "trade_detail_level_facts_read_model_v1",
      savedTradeId: "trade_SNAP_2026_05_01_001",
      availability: {
        availability: "attached",
        sourceKind: "single_snapshot_v1",
        fifteenMinuteContextOnlyStatus: "not_supplied",
      },
      attachedFacts: {
        sourceKind: "single_snapshot_v1",
        symbol: "SNAP",
        provider: "fixture",
        fifteenMinuteContextOnlyStatus: "not_supplied",
        missingFacts: [
          "density_metric",
          "candidate_inventory_gap_summary",
          "cache_fingerprint_summary",
        ],
      },
    });
    expectNoRawPayload(factsBody);
    expectNoAdviceLanguage(factsBody);
  });

  it("returns a not-checked facts read model when a trade has no persisted link", async () => {
    const response = await getTradeDetailLevelFacts(
      localGet(
        "http://localhost/api/trades/trade_MISSING_2026_06_01_001/level-analysis/facts",
      ),
      { params: Promise.resolve({ tradeId: "trade_MISSING_2026_06_01_001" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      contractVersion: "trade_detail_level_facts_read_model_v1",
      savedTradeId: "trade_MISSING_2026_06_01_001",
      featureEnabled: true,
      availability: {
        availability: "not_checked",
      },
      display: {
        shouldShowFactsPanel: false,
      },
    });
    expect(body.attachedFacts).toBeUndefined();
    expectNoRawPayload(body);
    expectNoAdviceLanguage(body);
  });

  it("keeps trade-link routes behind the feature flag", async () => {
    delete process.env[LEVEL_ANALYSIS_TRADE_LINK_API_FEATURE_FLAG];

    const response = await resolveTradeLink(
      jsonRequest("/api/level-analysis/trade-links/resolve", {
        savedTradeId: "trade_DEVS_2026_06_01_001",
        symbol: "DEVS",
        provider: "ibkr",
        tradeEndedAt: "2026-06-01T16:05:00.000Z",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toMatchObject({
      ok: false,
      code: "feature_disabled",
    });
  });

  it("keeps trade-detail facts route behind the display feature flag", async () => {
    delete process.env[LEVEL_ANALYSIS_TRADE_DETAIL_LEVEL_FACTS_FEATURE_FLAG];

    const response = await getTradeDetailLevelFacts(
      localGet(
        "http://localhost/api/trades/trade_DEVS_2026_06_01_001/level-analysis/facts",
      ),
      { params: Promise.resolve({ tradeId: "trade_DEVS_2026_06_01_001" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toMatchObject({
      ok: false,
      code: "feature_disabled",
    });
  });
});
