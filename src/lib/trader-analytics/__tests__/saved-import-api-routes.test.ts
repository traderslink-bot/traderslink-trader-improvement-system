import { mkdtempSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST as previewImportBatch } from "../../../../app/api/import-batches/preview/route";
import { GET as listImportBatches } from "../../../../app/api/import-batches/route";
import { POST as commitImportBatch } from "../../../../app/api/import-batches/[batchId]/commit/route";
import { GET as getImportBatch } from "../../../../app/api/import-batches/[batchId]/route";
import { GET as getDecisionReviewStatus } from "../../../../app/api/import-batches/[batchId]/decision-review/status/route";
import { POST as resumeDecisionReview } from "../../../../app/api/import-batches/[batchId]/decision-review/resume/route";
import { POST as setImportRepairStatus } from "../../../../app/api/import-batches/[batchId]/repair-items/[repairItemId]/route";
import { GET as listTrades } from "../../../../app/api/trades/route";
import { GET as getTrade } from "../../../../app/api/trades/[tradeId]/route";
import { POST as addTradeNote } from "../../../../app/api/trades/[tradeId]/notes/route";
import { POST as setReviewStatus } from "../../../../app/api/trades/[tradeId]/review-status/route";
import { POST as setReviewItemStatus } from "../../../../app/api/trades/[tradeId]/review-items/[itemId]/route";
import { POST as markTradeClosed } from "../../../../app/api/trades/[tradeId]/mark-closed/route";
import { GET as latestAnalytics } from "../../../../app/api/analytics/latest/route";
import { GET as latestCoach } from "../../../../app/api/coach/latest/route";
import { GET as latestReview } from "../../../../app/api/review/latest/route";
import {
  resetTraderIntelligenceDatabaseForTests,
  SqliteImportCommitRepository,
} from "../product/import-commit/sqlite-import-commit-repository";
import { runPersistedDecisionReviewJobs } from "../server/saved-decision-review-service";
import {
  buildSampleLevelsSystemSupportResistanceOptions,
} from "../../support-resistance/__fixtures__/sample-levels-system-fetch-service";
import {
  createTraderIntelligenceTestRequest,
  installTraderIntelligenceLocalTestEnvironment,
} from "../../../test/trader-intelligence-request";

let tempDir = "";
let originalDbPath: string | undefined;
let originalTier: string | undefined;
let originalDataMode: string | undefined;
let restoreEnvironment: () => void;

const csvText = [
  "Date,Time,Symbol,Side,Quantity,Price",
  "2026-05-01,09:30:00,APIX,Buy,100,10.00",
  "2026-05-01,10:00:00,APIX,Sell,100,10.50",
].join("\n");

const brokerLikeGenericLongCsv = [
  "Ticker,Executed At,Action,Qty,Fill Price,Status,Commission,Fees,Net Amount",
  "GLNG,05/01/2026 09:30:00 AM,BOT,60,$10.00,Filled,$0.50,$0.02,-600.52",
  "GLNG,2026-05-01 09:34:00,BOT,40,10.10,Filled,0.50,0.02,-404.52",
  "GLNG,2026-05-01 09:56:00,SLD,50,10.45,Filled,0.50,0.02,521.98",
  "GLNG,2026-05-01 10:15:00,SLD,50,10.80,Filled,0.50,0.02,539.48",
].join("\n");

const cleanFullExitLongCsv = [
  "Date,Time,Symbol,Side,Quantity,Price",
  "2026-05-01,09:30:00,CLNX,Buy,100,10.00",
  "2026-05-01,10:00:00,CLNX,Sell,100,10.60",
].join("\n");

const adverseAddLongCsv = [
  "Date,Time,Symbol,Side,Quantity,Price",
  "2026-05-01,09:30:00,ADDL,Buy,100,10.00",
  "2026-05-01,09:40:00,ADDL,Buy,100,9.70",
  "2026-05-01,10:10:00,ADDL,Sell,200,9.50",
].join("\n");

const openLongCsv = [
  "Date,Time,Symbol,Side,Quantity,Price",
  "2026-05-01,09:30:00,OPNL,Buy,100,10.00",
  "2026-05-01,10:00:00,OPNL,Sell,25,10.30",
  "2026-05-01,10:30:00,SVED,Buy,50,8.00",
  "2026-05-01,10:45:00,SVED,Sell,50,8.20",
].join("\n");

const defensiveShortCsv = [
  "Date,Time,Ticker,Action,Shares,Average Fill Price",
  "2026-05-01,09:30:00,DSCP,SELL SHORT,100,20.00",
  "2026-05-01,10:15:00,DSCP,BUY TO COVER,100,19.10",
].join("\n");

function jsonRequest(body: unknown): Request {
  return createTraderIntelligenceTestRequest("http://localhost/api/import-batches/preview", {
    method: "POST",
    origin: "http://localhost",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function localGet(url: string): Request {
  return createTraderIntelligenceTestRequest(url);
}

beforeEach(() => {
  originalDbPath = process.env.TRADER_INTELLIGENCE_DB_PATH;
  originalTier = process.env.TRADER_INTELLIGENCE_TIER;
  originalDataMode = process.env.TRADER_INTELLIGENCE_DATA_MODE;
  tempDir = mkdtempSync(join(homedir(), ".trader-intelligence-api-"));
  restoreEnvironment = installTraderIntelligenceLocalTestEnvironment({
    TRADER_INTELLIGENCE_DB_PATH: join(tempDir, "test.sqlite"),
    TRADER_INTELLIGENCE_DATA_MODE: "real_owner_data",
  });
  resetTraderIntelligenceDatabaseForTests();
});

afterEach(() => {
  resetTraderIntelligenceDatabaseForTests();
  if (originalDbPath === undefined) {
    delete process.env.TRADER_INTELLIGENCE_DB_PATH;
  } else {
    process.env.TRADER_INTELLIGENCE_DB_PATH = originalDbPath;
  }
  if (originalTier === undefined) {
    delete process.env.TRADER_INTELLIGENCE_TIER;
  } else {
    process.env.TRADER_INTELLIGENCE_TIER = originalTier;
  }
  if (originalDataMode === undefined) {
    delete process.env.TRADER_INTELLIGENCE_DATA_MODE;
  } else {
    process.env.TRADER_INTELLIGENCE_DATA_MODE = originalDataMode;
  }
  restoreEnvironment();
  rmSync(tempDir, { recursive: true, force: true });
});

describe("saved import API routes", () => {
  it("previews, commits, and exposes saved trades plus latest analytics/coach", async () => {
    const payload = {
      csvText,
      broker: "generic_execution_csv",
      accountTimezone: "America/New_York",
      acknowledgements: {
        mappingReview: true,
        pnlReview: true,
      },
    };
    const preview = await previewImportBatch(jsonRequest(payload));
    const previewBody = await preview.json();

    expect(preview.status).toBe(200);
    expect(previewBody.plan.canCommitNow).toBe(true);

    const batchId = previewBody.plan.batch.id;
    const commit = await commitImportBatch(jsonRequest(payload), {
      params: Promise.resolve({ batchId }),
    });
    const commitBody = await commit.json();

    expect(commit.status).toBe(200);
    expect(commitBody.result.status).toBe("committed");
    expect(commitBody.decisionReviewRun).toMatchObject({
      contractVersion: "persisted_decision_review_run_scheduled_v1",
      requestedJobCount: 1,
      queuedJobCount: 1,
    });

    const decisionReviewStatus = await (
      await getDecisionReviewStatus(
        localGet(
          `http://localhost/api/import-batches/${encodeURIComponent(
            batchId,
          )}/decision-review/status`,
        ),
        { params: Promise.resolve({ batchId }) },
      )
    ).json();
    expect(decisionReviewStatus).toMatchObject({
      contractVersion: "persisted_decision_review_status_v1",
      importBatchId: batchId,
      batchStatus: "committed",
      totalJobCount: 1,
      queuedCount: 1,
      completedCount: 0,
      retryableCount: 0,
      pendingWorkCount: 1,
      canResume: true,
      nextAction: "Continue chart data review for queued saved trades.",
    });

    const backgroundResume = await resumeDecisionReview(
      jsonRequest({ maxTrades: 1, runInBackground: true }),
      { params: Promise.resolve({ batchId }) },
    );
    const backgroundResumeBody = await backgroundResume.json();

    expect(backgroundResume.status).toBe(202);
    expect(backgroundResumeBody).toMatchObject({
      contractVersion: "persisted_decision_review_resume_result_v1",
      importBatchId: batchId,
      queuedBefore: 1,
      selectedJobCount: 1,
      maxTrades: 1,
      mode: "queued",
      background: true,
      run: null,
    });
    expect(backgroundResumeBody.message).toContain(
      "Chart data review is running in the background",
    );

    const statusAfterBackgroundResume = await (
      await getDecisionReviewStatus(
        localGet(
          `http://localhost/api/import-batches/${encodeURIComponent(
            batchId,
          )}/decision-review/status`,
        ),
        { params: Promise.resolve({ batchId }) },
      )
    ).json();
    expect(statusAfterBackgroundResume).toMatchObject({
      queuedCount: 1,
      completedCount: 0,
      canResume: true,
    });

    const trades = await (await listTrades(localGet("http://localhost/api/trades"))).json();
    expect(trades.source).toBe("saved_sqlite");
    expect(trades.trades).toMatchObject([{ symbol: "APIX", sampleData: false }]);
    const tradeId = trades.trades[0].id;

    const note = await addTradeNote(jsonRequest({ body: "Review saved from API." }), {
      params: Promise.resolve({ tradeId }),
    });
    expect(note.status).toBe(200);

    const reviewItem = await setReviewItemStatus(
      jsonRequest({ status: "complete" }),
      {
        params: Promise.resolve({ tradeId, itemId: "lesson_review" }),
      },
    );
    expect(reviewItem.status).toBe(200);

    const tradeDetail = await (
      await getTrade(localGet(`http://localhost/api/trades/${tradeId}`), {
        params: Promise.resolve({ tradeId }),
      })
    ).json();
    expect(tradeDetail.trade.notes).toMatchObject([
      { body: "Review saved from API." },
    ]);
    expect(tradeDetail.reviewItemStates).toMatchObject([
      { itemId: "lesson_review", status: "complete" },
    ]);
    expect(tradeDetail.decisionReviewSnapshot).toBeNull();
    expect(tradeDetail.decisionReviewDiagnostics).toEqual([]);

    const analytics = await (await latestAnalytics(localGet("http://localhost/api/analytics/latest"))).json();
    expect(analytics.source).toBe("saved_sqlite");
    expect(analytics.latestReport.sampleData).toBe(false);

    const coach = await (await latestCoach(localGet("http://localhost/api/coach/latest"))).json();
    expect(coach.source).toBe("saved_sqlite");
    expect(coach.emptyState.kind).not.toBe("sample_data");

    const review = await (await latestReview(localGet("http://localhost/api/review/latest"))).json();
    expect(review.source).toBe("saved_sqlite");
    expect(review.savedDecisionReview).toMatchObject({
      totalJobCount: 1,
      analysisFailedCount: 0,
      queuedCount: 1,
      marketContextUnavailableCount: 0,
      completedCount: 0,
      diagnosticCodeCounts: {},
      diagnosticStatusCounts: {},
      nextAction: "Run saved chart data review for queued closed trades.",
    });
    expect(review.savedReviewQueue.activeFilter).toBe("highest_priority");
    expect(review.savedReviewQueue.allItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          symbol: "APIX",
          lane: "queued",
          priorityLabel: "medium",
        }),
      ]),
    );

    const status = await setReviewStatus(jsonRequest({ status: "resolved" }), {
      params: Promise.resolve({ tradeId }),
    });
    expect(status.status).toBe(200);

    const resolvedReview = await (await latestReview(localGet("http://localhost/api/review/latest"))).json();
    expect(resolvedReview.savedReviewQueue.allItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ symbol: "APIX", reviewStatus: "resolved" }),
      ]),
    );
    expect(resolvedReview.savedReviewQueue.items).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ symbol: "APIX" })]),
    );

    const batch = await (
      await getImportBatch(localGet(`http://localhost/api/import-batches/${batchId}`), {
        params: Promise.resolve({ batchId }),
      })
    ).json();
    expect(batch.decisionReview.jobs).toMatchObject([
      { status: "queued", symbol: "APIX" },
    ]);
    expect(batch.decisionReview.diagnostics).toEqual([]);

    const duplicatePreview = await previewImportBatch(jsonRequest(payload));
    const duplicateBody = await duplicatePreview.json();

    expect(duplicateBody.plan.status).toBe("needs_user_review");
    expect(duplicateBody.plan.batch.id).not.toBe(batchId);

    const duplicateBatch = await (
      await getImportBatch(
        localGet(
          `http://localhost/api/import-batches/${duplicateBody.plan.batch.id}`,
        ),
        { params: Promise.resolve({ batchId: duplicateBody.plan.batch.id }) },
      )
    ).json();
    expect(duplicateBatch.recovery).toMatchObject({
      status: "duplicate_review",
      duplicate: {
        duplicateFile: true,
        originalBatchId: batchId,
        duplicateTrades: [expect.objectContaining({ symbol: "APIX" })],
      },
      primaryAction: expect.objectContaining({
        id: "open_original_import",
      }),
    });

    const history = await (await listImportBatches(localGet("http://localhost/api/import-batches"))).json();
    expect(history.history).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          duplicateFile: true,
          duplicateTradeCount: 1,
          summaryStatus: "needs_review",
        }),
        expect.objectContaining({
          summaryStatus: "committed",
        }),
      ]),
    );
    expect(history.recoveryQueue).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          batchId: duplicateBody.plan.batch.id,
          status: "duplicate_review",
        }),
      ]),
    );
  });

  it("keeps latest review execution-only in the free tier even when chart snapshots exist", async () => {
    const payload = {
      csvText: csvText.replaceAll("APIX", "TIER"),
      broker: "generic_execution_csv",
      accountTimezone: "America/New_York",
      acknowledgements: {
        mappingReview: true,
        pnlReview: true,
      },
    };
    const previewBody = await (
      await previewImportBatch(jsonRequest(payload))
    ).json();

    await commitImportBatch(jsonRequest(payload), {
      params: Promise.resolve({ batchId: previewBody.plan.batch.id }),
    });

    const repository = new SqliteImportCommitRepository();
    const reviewRun = await runPersistedDecisionReviewJobs({
      repository,
      importBatchId: previewBody.plan.batch.id,
      generatedAt: "2026-05-07T12:00:00.000Z",
      levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
    });
    expect(reviewRun.completedSnapshotCount).toBe(1);

    process.env.TRADER_INTELLIGENCE_TIER = "chart_context";
    const chartTierReview = await (await latestReview(localGet("http://localhost/api/review/latest"))).json();
    expect(chartTierReview.source).toBe("saved_sqlite");
    expect(chartTierReview.review).toMatchObject({
      title: "Guided Review Session",
    });
    expect(chartTierReview.savedDecisionReview).toMatchObject({
      completedCount: 1,
      queuedCount: 0,
    });
    expect(chartTierReview.savedReviewQueue.allItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          symbol: "TIER",
          lane: "completed",
          hasSnapshot: true,
        }),
      ]),
    );

    process.env.TRADER_INTELLIGENCE_TIER = "free_execution";
    const freeTierReview = await (await latestReview(localGet("http://localhost/api/review/latest"))).json();
    expect(freeTierReview.source).toBe("saved_sqlite");
    expect(freeTierReview.review).toMatchObject({
      title: "Guided Review Session",
    });
    expect(freeTierReview.savedDecisionReview).toBeNull();
    expect(freeTierReview.savedReviewQueue.allItems).toEqual([]);
    expect(
      freeTierReview.savedReviewQueue.tabs.some(
        (tab: { id: string }) => tab.id === "completed",
      ),
    ).toBe(false);
    expect(
      freeTierReview.savedReviewQueue.tabs.map((tab: { id: string }) => tab.id),
    ).toEqual(["all", "blocked_open_trade", "unresolved"]);
  });

  it("commits a ready stored preview from the batch recovery action path", async () => {
    const payload = {
      csvText: csvText.replaceAll("APIX", "RDSV"),
      broker: "generic_execution_csv",
      accountTimezone: "America/New_York",
      acknowledgements: {
        mappingReview: true,
        pnlReview: true,
      },
    };
    const previewBody = await (await previewImportBatch(jsonRequest(payload))).json();
    const batchId = previewBody.plan.batch.id;
    const batchBeforeCommit = await (
      await getImportBatch(
        localGet(`http://localhost/api/import-batches/${batchId}`),
        { params: Promise.resolve({ batchId }) },
      )
    ).json();

    expect(batchBeforeCommit.recovery).toMatchObject({
      status: "ready_to_save",
      canSaveStoredPlan: true,
      primaryAction: expect.objectContaining({ kind: "save_import" }),
    });

    const commit = await commitImportBatch(jsonRequest({}), {
      params: Promise.resolve({ batchId }),
    });
    expect(commit.status).toBe(200);

    const trades = await (await listTrades(localGet("http://localhost/api/trades"))).json();
    expect(trades.trades).toEqual(
      expect.arrayContaining([expect.objectContaining({ symbol: "RDSV" })]),
    );

    const batchAfterCommit = await (
      await getImportBatch(
        localGet(`http://localhost/api/import-batches/${batchId}`),
        { params: Promise.resolve({ batchId }) },
      )
    ).json();
    expect(batchAfterCommit.recovery).toMatchObject({
      status: "committed",
      canSaveStoredPlan: false,
      primaryAction: expect.objectContaining({ id: "review_trades" }),
    });
  });

  it("keeps committed trades and review queue items available after repository reload", async () => {
    const payload = {
      csvText: csvText.replaceAll("APIX", "REST"),
      broker: "generic_execution_csv",
      accountTimezone: "America/New_York",
      acknowledgements: {
        mappingReview: true,
        pnlReview: true,
      },
    };
    const previewBody = await (await previewImportBatch(jsonRequest(payload))).json();

    await commitImportBatch(jsonRequest(payload), {
      params: Promise.resolve({ batchId: previewBody.plan.batch.id }),
    });
    resetTraderIntelligenceDatabaseForTests();

    const trades = await (await listTrades(localGet("http://localhost/api/trades"))).json();
    const review = await (await latestReview(localGet("http://localhost/api/review/latest"))).json();

    expect(trades.source).toBe("saved_sqlite");
    expect(trades.trades).toEqual(
      expect.arrayContaining([expect.objectContaining({ symbol: "REST" })]),
    );
    expect(review.savedReviewQueue.allItems).toEqual(
      expect.arrayContaining([expect.objectContaining({ symbol: "REST" })]),
    );
  });

  it("persists import repair item actions through the batch API", async () => {
    const repairCsv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,,Buy,100,10.00",
      "2026-05-01,10:00:00,REPR,Sell,100,10.50",
    ].join("\n");

    const preview = await previewImportBatch(
      jsonRequest({
        csvText: repairCsv,
        broker: "generic_execution_csv",
        accountTimezone: "America/New_York",
      }),
    );
    const previewBody = await preview.json();
    const repairItem = previewBody.plan.repairItems[0];

    expect(repairItem).toBeDefined();

    const update = await setImportRepairStatus(
      jsonRequest({ status: "resolved" }),
      {
        params: Promise.resolve({
          batchId: previewBody.plan.batch.id,
          repairItemId: repairItem.id,
        }),
      },
    );
    expect(update.status).toBe(200);

    const batch = await (
      await getImportBatch(
        localGet(
          `http://localhost/api/import-batches/${previewBody.plan.batch.id}`,
        ),
        { params: Promise.resolve({ batchId: previewBody.plan.batch.id }) },
      )
    ).json();
    expect(batch.repairItems[0]).toMatchObject({ status: "resolved" });
    expect(batch.repairEvents).toMatchObject([
      { repairItemId: repairItem.id, status: "resolved" },
    ]);
  });

  it("commits a repaired CSV preview and updates saved analytics, coach, and review read models", async () => {
    const repairedCsv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,RAPI,Buy,100,10.00",
      "2026-05-01,09:35:00,RAPI,Sell,100,11.00",
    ].join("\n");
    const payload = {
      csvText: repairedCsv,
      broker: "generic_execution_csv",
      accountTimezone: "America/New_York",
      acknowledgements: {
        mappingReview: true,
        pnlReview: true,
      },
      repairSource: "repaired_csv",
    };
    const previewBody = await (await previewImportBatch(jsonRequest(payload))).json();

    expect(previewBody.plan.canCommitNow).toBe(true);
    expect(previewBody.plan.batch).toMatchObject({
      repairSource: "repaired_csv",
    });
    expect(previewBody.plan.savedTrades).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          symbol: "RAPI",
          repairSource: "repaired_csv",
        }),
      ]),
    );

    const commit = await commitImportBatch(jsonRequest(payload), {
      params: Promise.resolve({ batchId: previewBody.plan.batch.id }),
    });
    const commitBody = await commit.json();

    expect(commit.status).toBe(200);
    expect(commitBody.result.status).toBe("committed");

    const trades = await (await listTrades(localGet("http://localhost/api/trades"))).json();
    expect(trades.trades).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          symbol: "RAPI",
          repairSource: "repaired_csv",
          sourceLabel: expect.stringContaining("repaired CSV"),
        }),
      ]),
    );
    const tradeId = trades.trades.find(
      (trade: { symbol: string }) => trade.symbol === "RAPI",
    )?.id;
    expect(tradeId).toBeTruthy();

    const analytics = await (await latestAnalytics(localGet("http://localhost/api/analytics/latest"))).json();
    expect(analytics.source).toBe("saved_sqlite");
    expect(analytics.latestReport.sampleData).toBe(false);
    expect(JSON.stringify(analytics.latestReport)).toContain("RAPI");
    expect(analytics.savedImportSourceCaution).toMatchObject({
      repairedImport: true,
      importBatchId: previewBody.plan.batch.id,
      title: "Repaired CSV source",
      detail:
        "This saved import came from repaired CSV rows. Review repaired row values before trusting coaching evidence.",
    });

    const coach = await (await latestCoach(localGet("http://localhost/api/coach/latest"))).json();
    expect(coach.source).toBe("saved_sqlite");
    expect(coach.emptyState.kind).not.toBe("sample_data");
    expect(coach.savedImportSourceCaution).toMatchObject({
      repairedImport: true,
      relatedTradeIds: expect.arrayContaining([tradeId]),
    });

    const review = await (await latestReview(localGet("http://localhost/api/review/latest"))).json();
    expect(review.source).toBe("saved_sqlite");
    expect(review.savedImportSourceCaution).toMatchObject({
      repairedImport: true,
      href: `/intelligence/imports/${encodeURIComponent(previewBody.plan.batch.id)}`,
    });
    expect(review.savedReviewQueue.allItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          symbol: "RAPI",
          lane: "queued",
          stateLabel: "Chart data waiting",
          reviewScopeLabel: "execution now, chart data waiting",
          stateDetail:
            "Execution review is available now. Chart evidence has not been attached to this saved trade yet.",
          nextAction:
            "Open the execution review now, or resume chart-data review from the saved import details.",
        }),
      ]),
    );

    const tradeDetail = await (
      await getTrade(localGet(`http://localhost/api/trades/${tradeId}`), {
        params: Promise.resolve({ tradeId }),
      })
    ).json();
    expect(tradeDetail.importSourceCaution).toMatchObject({
      repairedImport: true,
      relatedTradeIds: [tradeId],
    });
  });

  it("saves a broker-like generic long import through analytics, coach, and review read models", async () => {
    const payload = {
      csvText: brokerLikeGenericLongCsv,
      broker: "generic_execution_csv",
      accountTimezone: "America/New_York",
      acknowledgements: {
        mappingReview: true,
        pnlReview: true,
      },
    };

    const preview = await previewImportBatch(jsonRequest(payload));
    const previewBody = await preview.json();

    expect(preview.status).toBe(200);
    expect(previewBody.plan).toMatchObject({
      canCommitNow: true,
    });
    expect(previewBody.plan.readModel).toMatchObject({
      acceptedExecutionCount: 4,
      groupedTradeCount: 1,
    });
    expect(previewBody.plan.savedTrades).toHaveLength(1);
    expect(previewBody.plan.executionFeedbackSummaries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          summary: expect.objectContaining({
            symbol: "GLNG",
            tradeDirection: "long",
          }),
        }),
      ]),
    );

    const commit = await commitImportBatch(jsonRequest(payload), {
      params: Promise.resolve({ batchId: previewBody.plan.batch.id }),
    });
    const commitBody = await commit.json();

    expect(commit.status).toBe(200);
    expect(commitBody.result).toMatchObject({
      status: "committed",
      savedTradeCount: 1,
    });

    const trades = await (await listTrades(localGet("http://localhost/api/trades"))).json();
    expect(trades.source).toBe("saved_sqlite");
    expect(trades.trades).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          symbol: "GLNG",
          tradeDirection: "long",
          sampleData: false,
        }),
      ]),
    );

    const analytics = await (await latestAnalytics(localGet("http://localhost/api/analytics/latest"))).json();
    expect(analytics.source).toBe("saved_sqlite");
    expect(analytics.latestReport.sampleData).toBe(false);
    expect(JSON.stringify(analytics.latestReport)).toContain("GLNG");

    const coach = await (await latestCoach(localGet("http://localhost/api/coach/latest"))).json();
    expect(coach.source).toBe("saved_sqlite");
    expect(coach.emptyState.kind).not.toBe("sample_data");

    const review = await (await latestReview(localGet("http://localhost/api/review/latest"))).json();
    expect(review.source).toBe("saved_sqlite");
    expect(review.savedReviewQueue.allItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          symbol: "GLNG",
          lane: "queued",
          priorityLabel: "medium",
        }),
      ]),
    );
  });

  it.each([
    {
      label: "profitable partial exits",
      csvText: brokerLikeGenericLongCsv,
      symbol: "GLNG",
      expectedStrengthIds: [
        "structured_partial_exit_sequence",
        "profitable_reduction_sequence",
        "decisive_full_exit",
      ],
      expectedRiskIds: [],
    },
    {
      label: "clean full exit",
      csvText: cleanFullExitLongCsv,
      symbol: "CLNX",
      expectedStrengthIds: [
        "profitable_reduction_sequence",
        "decisive_full_exit",
      ],
      expectedRiskIds: [],
      expectedPrimaryId: "clean_single_entry_full_exit",
    },
    {
      label: "adverse add",
      csvText: adverseAddLongCsv,
      symbol: "ADDL",
      expectedStrengthIds: ["decisive_full_exit"],
      expectedRiskIds: ["size_expansion_after_adverse_price"],
    },
  ])(
    "locks long-side saved execution feedback for $label",
    async ({
      csvText,
      symbol,
      expectedStrengthIds,
      expectedRiskIds,
      expectedPrimaryId,
    }) => {
      const payload = {
        csvText,
        broker: "generic_execution_csv",
        accountTimezone: "America/New_York",
        acknowledgements: {
          mappingReview: true,
          pnlReview: true,
        },
      };

      const preview = await previewImportBatch(jsonRequest(payload));
      const previewBody = await preview.json();
      const summary =
        previewBody.plan.executionFeedbackSummaries.find(
          (item: { summary: { symbol: string } }) => item.summary.symbol === symbol,
        )?.summary ?? null;

      expect(preview.status).toBe(200);
      expect(previewBody.plan.canCommitNow).toBe(true);
      expect(summary).toMatchObject({
        symbol,
        tradeDirection: "long",
      });

      const strengthIds =
        summary?.points.strengths.map((point: { id: string }) => point.id) ?? [];
      const riskIds =
        summary?.points.risks.map((point: { id: string }) => point.id) ?? [];

      for (const expected of expectedStrengthIds) {
        expect(strengthIds).toContain(expected);
      }
      for (const expected of expectedRiskIds) {
        expect(riskIds).toContain(expected);
      }
      expect(summary?.points.primaryFocus?.id).toBe(
        expectedPrimaryId ?? expectedRiskIds[0] ?? expectedStrengthIds[0],
      );
    },
  );

  it("keeps open saved long imports blocked from completed-trade coaching", async () => {
    const payload = {
      csvText: openLongCsv,
      broker: "generic_execution_csv",
      accountTimezone: "America/New_York",
      acknowledgements: {
        mappingReview: true,
        pnlReview: true,
        groupingReview: true,
        anomalyTypes: ["open_leftover"],
        openPositions: true,
      },
    };
    const previewBody = await (await previewImportBatch(jsonRequest(payload))).json();

    expect(previewBody.plan.canCommitNow).toBe(true);
    expect(previewBody.plan.readModel).toMatchObject({
      groupedTradeCount: 2,
      openPositionCount: 1,
    });
    expect(previewBody.plan.savedTrades).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          symbol: "OPNL",
          tradeDirection: "long",
          lifecycleStatus: "open",
        }),
      ]),
    );
    expect(previewBody.plan.decisionReviewJobs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          symbol: "OPNL",
          status: "blocked_open_trade",
          reason: "Open or swing trade is excluded from completed-trade decision review until flat.",
        }),
      ]),
    );

    const commit = await commitImportBatch(jsonRequest(payload), {
      params: Promise.resolve({ batchId: previewBody.plan.batch.id }),
    });
    expect(commit.status).toBe(200);

    const review = await (await latestReview(localGet("http://localhost/api/review/latest"))).json();
    expect(review.savedReviewQueue.allItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          symbol: "OPNL",
          lane: "blocked_open_trade",
          stateLabel: "Open or swing trade",
          reviewScopeLabel: "open or swing trade, execution-only",
          stateDetail:
            "The position was still open at the end of the import, so completed-trade review waits until the position is flat.",
          nextAction:
            "Keep the trade saved for execution review now, then review the completed trade once the position is flat.",
        }),
      ]),
    );

    const openTradeId = review.savedReviewQueue.allItems.find(
      (item: { symbol: string }) => item.symbol === "OPNL",
    )?.savedTradeId;
    expect(openTradeId).toBeTruthy();

    const markClosed = await markTradeClosed(
      createTraderIntelligenceTestRequest(
        `http://localhost/api/trades/${encodeURIComponent(openTradeId)}/mark-closed`,
        { method: "POST", origin: "http://localhost" },
      ),
      { params: Promise.resolve({ tradeId: openTradeId }) },
    );
    const markClosedBody = await markClosed.json();
    expect(markClosed.status).toBe(200);
    expect(markClosedBody).toMatchObject({
      contractVersion: "trade_mark_closed_v1",
      trade: {
        id: openTradeId,
        reviewStatus: "ignored",
        symbol: "OPNL",
      },
    });

    const reviewAfterClose = await (await latestReview(localGet("http://localhost/api/review/latest"))).json();
    expect(reviewAfterClose.savedReviewQueue.allItems).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          symbol: "OPNL",
          lane: "blocked_open_trade",
        }),
      ]),
    );

    const repository = new SqliteImportCommitRepository();
    expect(repository.getSavedTrade(openTradeId)).toMatchObject({
      lifecycleStatus: "closed",
      reviewStatus: "ignored",
      userLifecycleOverride: {
        reason: "marked_closed_by_user",
        status: "closed",
      },
    });
  });

  it("keeps sell-side imports limited without creating short-coaching claims", async () => {
    const payload = {
      csvText: defensiveShortCsv,
      broker: "generic_execution_csv",
      accountTimezone: "America/New_York",
      acknowledgements: {
        mappingReview: true,
        pnlReview: true,
      },
    };
    const previewBody = await (await previewImportBatch(jsonRequest(payload))).json();

    expect(previewBody.plan.canCommitNow).toBe(true);
    expect(previewBody.plan.savedTrades).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          symbol: "DSCP",
          tradeDirection: "short",
          lifecycleStatus: "closed",
        }),
      ]),
    );
    expect(previewBody.plan.blockingReasons).toEqual([]);
    expect(
      previewBody.plan.issues.map((issue: { issueCode: string }) => issue.issueCode),
    ).not.toContain("sell_starting_trade_skipped");

    const combinedSavedReadModels = JSON.stringify({
      preview: previewBody,
      trades: await (await listTrades(localGet("http://localhost/api/trades"))).json(),
      analytics: await (await latestAnalytics(localGet("http://localhost/api/analytics/latest"))).json(),
      coach: await (await latestCoach(localGet("http://localhost/api/coach/latest"))).json(),
      review: await (await latestReview(localGet("http://localhost/api/review/latest"))).json(),
    }).toLowerCase();

    for (const forbidden of [
      "short-seller coaching",
      "short seller coaching",
      "short squeeze alert",
      "short squeeze alerts",
      "short-specific trade signal",
      "short-specific trade signals",
      "borrow/locate",
      "borrow or locate",
    ]) {
      expect(combinedSavedReadModels).not.toContain(forbidden);
    }
  });

  it("exposes unresolved repair inbox items through import history API", async () => {
    const repairCsv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,,Buy,100,10.00",
      "2026-05-01,10:00:00,INBX,Sell,100,10.50",
    ].join("\n");

    const preview = await previewImportBatch(
      jsonRequest({
        csvText: repairCsv,
        broker: "generic_execution_csv",
        accountTimezone: "America/New_York",
      }),
    );
    const previewBody = await preview.json();
    const history = await (await listImportBatches(localGet("http://localhost/api/import-batches"))).json();

    expect(history.unresolvedRepairs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          importBatchId: previewBody.plan.batch.id,
          severity: "fix_required",
          batchStatus: "needs_repair",
        }),
      ]),
    );
    expect(history.recoveryQueue).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          batchId: previewBody.plan.batch.id,
          status: "blocked_by_repairs",
          counts: expect.objectContaining({ fixRequiredRepairs: 1 }),
        }),
      ]),
    );
  });
});
