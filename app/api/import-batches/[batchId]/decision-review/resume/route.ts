import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";

import { after } from "next/server";
import { readLevelsSystemRuntimeConfigFromEnv } from "../../../../../../src/lib/support-resistance/levels-system-runtime-options";
import { SqliteImportCommitRepository } from "../../../../../../src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository";
import { importCommitErrorResponse } from "../../../../../../src/lib/trader-analytics/server/import-commit-service";
import {
  runPersistedDecisionReviewJobs,
  type PersistedDecisionReviewRunResult,
} from "../../../../../../src/lib/trader-analytics/server/saved-decision-review-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_MAX_TRADES = 1;
const MAX_TRADES_LIMIT = 10;

type ResumeMode = "queued" | "refresh_missing_replay_candles";
type ResumeModeWithRetry = ResumeMode | "retry_failed_chart_data";

function maxTradesFromBody(body: unknown): number {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return DEFAULT_MAX_TRADES;
  }

  const value =
    "maxTrades" in body ? Number(body.maxTrades) : DEFAULT_MAX_TRADES;

  if (!Number.isFinite(value)) {
    return DEFAULT_MAX_TRADES;
  }

  return Math.max(1, Math.min(MAX_TRADES_LIMIT, Math.floor(value)));
}

function savedTradeIdFromBody(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return undefined;
  }

  const value = "savedTradeId" in body ? body.savedTradeId : undefined;

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function runInBackgroundFromBody(body: unknown): boolean {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return false;
  }

  return "runInBackground" in body && body.runInBackground === true;
}

async function readRequestBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function runDecisionReview(args: {
  importBatchId: string;
  generatedAt: string;
  maxTrades: number;
  refreshMissingReplayCandleWindows?: boolean;
  retryFailedChartDataReview?: boolean;
  savedTradeId?: string;
}): Promise<PersistedDecisionReviewRunResult> {
  return runPersistedDecisionReviewJobs({
    repository: new SqliteImportCommitRepository(),
    importBatchId: args.importBatchId,
    levelsSystem: readLevelsSystemRuntimeConfigFromEnv(),
    generatedAt: args.generatedAt,
    maxTrades: args.maxTrades,
    deferRemaining: true,
    refreshMissingReplayCandleWindows: args.refreshMissingReplayCandleWindows,
    retryFailedChartDataReview: args.retryFailedChartDataReview,
    savedTradeIds: args.savedTradeId ? [args.savedTradeId] : undefined,
  });
}

function scheduleDecisionReviewRun(args: {
  importBatchId: string;
  generatedAt: string;
  maxTrades: number;
  refreshMissingReplayCandleWindows?: boolean;
  retryFailedChartDataReview?: boolean;
  savedTradeId?: string;
}): void {
  const run = async () => {
    try {
      await runDecisionReview(args);
    } catch (error) {
      console.error("Saved chart data review background resume failed.", {
        error: error instanceof Error ? error.message : String(error),
        importBatchId: args.importBatchId,
      });
    }
  };

  try {
    after(run);
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      void run();
      console.warn("Scheduled chart data review without Next after().", {
        error: error instanceof Error ? error.message : String(error),
        importBatchId: args.importBatchId,
      });
    }
  }
}

async function POSTHandler(
  request: Request,
  context: { params: Promise<{ batchId: string }> },
): Promise<Response> {
  const routeParams = await context.params;
  const batchId = decodeURIComponent(routeParams.batchId);
  const repository = new SqliteImportCommitRepository();
  const plan = repository.getPreviewPlan(batchId);
  const batch = repository.getImportBatch(batchId);

  if (!plan || !batch) {
    return importCommitErrorResponse(
      404,
      "not_found",
      `Import batch ${batchId} was not found.`,
    );
  }

  if (batch.status !== "committed") {
    return importCommitErrorResponse(
      409,
      "commit_rejected",
      "Save the import before resuming chart data review.",
    );
  }

  const body = await readRequestBody(request);
  const maxTrades = maxTradesFromBody(body);
  const savedTradeId = savedTradeIdFromBody(body);
  const runInBackground = runInBackgroundFromBody(body);
  const queuedJobs = repository
    .listDecisionReviewJobs(batchId)
    .filter(
      (job) =>
        job.status === "queued" &&
        (!savedTradeId || job.savedTradeId === savedTradeId),
    );
  const snapshotsByTradeId = new Map(
    repository
      .listDecisionReviewSnapshotsForBatch(batchId)
      .map((snapshot) => [snapshot.savedTradeId, snapshot]),
  );
  const refreshableJobs = repository
    .listDecisionReviewJobs(batchId)
    .filter((job) => {
      if (savedTradeId && job.savedTradeId !== savedTradeId) {
        return false;
      }

      if (job.status !== "completed") {
        return false;
      }

      const snapshot = snapshotsByTradeId.get(job.savedTradeId);

      return (
        !snapshot ||
        (snapshot.review.tradeWindowEvidenceSource ===
          "levels_system_trade_window" &&
          !snapshot.review.replayCandleWindow)
      );
    });
  const retryableFailedJobs = repository
    .listDecisionReviewJobs(batchId)
    .filter(
      (job) =>
        (!savedTradeId || job.savedTradeId === savedTradeId) &&
        (job.status === "analysis_failed" ||
          job.status === "market_context_unavailable"),
    );

  if (
    queuedJobs.length === 0 &&
    refreshableJobs.length === 0 &&
    retryableFailedJobs.length === 0
  ) {
    return Response.json({
      contractVersion: "persisted_decision_review_resume_result_v1",
      importBatchId: batchId,
      queuedBefore: 0,
      refreshableBefore: 0,
      retryableFailedBefore: 0,
      selectedJobCount: 0,
      maxTrades,
      mode: "queued" satisfies ResumeModeWithRetry,
      message:
        "No queued chart data review jobs, failed chart-data retries, or candle replay refreshes are waiting for this import.",
      run: null,
    });
  }

  const generatedAt = new Date().toISOString();
  const refreshMissingReplayCandleWindows = queuedJobs.length === 0;
  const retryFailedChartDataReview =
    queuedJobs.length === 0 &&
    refreshableJobs.length === 0 &&
    retryableFailedJobs.length > 0;
  const selectedPoolSize = retryFailedChartDataReview
    ? retryableFailedJobs.length
    : refreshMissingReplayCandleWindows
      ? refreshableJobs.length
      : queuedJobs.length;
  const selectedJobCount = Math.min(selectedPoolSize, maxTrades);
  const mode = retryFailedChartDataReview
    ? ("retry_failed_chart_data" satisfies ResumeModeWithRetry)
    : refreshMissingReplayCandleWindows
      ? ("refresh_missing_replay_candles" satisfies ResumeModeWithRetry)
      : ("queued" satisfies ResumeModeWithRetry);

  if (runInBackground) {
    scheduleDecisionReviewRun({
      importBatchId: batchId,
      generatedAt,
      maxTrades,
      refreshMissingReplayCandleWindows:
        refreshMissingReplayCandleWindows && !retryFailedChartDataReview,
      retryFailedChartDataReview,
      savedTradeId,
    });

    return Response.json(
      {
        contractVersion: "persisted_decision_review_resume_result_v1",
        importBatchId: batchId,
        queuedBefore: queuedJobs.length,
        refreshableBefore: refreshableJobs.length,
        retryableFailedBefore: retryableFailedJobs.length,
        selectedJobCount,
        maxTrades,
        mode,
        background: true,
        message:
          "Chart data review is running in the background. Keep this page open to watch progress, or continue reviewing saved executions.",
        run: null,
      },
      { status: 202 },
    );
  }

  const run = await runDecisionReview({
    importBatchId: batchId,
    generatedAt,
    maxTrades,
    refreshMissingReplayCandleWindows:
      refreshMissingReplayCandleWindows && !retryFailedChartDataReview,
    retryFailedChartDataReview,
    savedTradeId,
  });

  return Response.json({
    contractVersion: "persisted_decision_review_resume_result_v1",
    importBatchId: batchId,
    queuedBefore: queuedJobs.length,
    refreshableBefore: refreshableJobs.length,
    retryableFailedBefore: retryableFailedJobs.length,
    selectedJobCount,
    maxTrades,
    mode,
    background: false,
    message: retryFailedChartDataReview
      ? "Chart data review retried. If market data is connected, chart evidence will attach to saved trades."
      : refreshMissingReplayCandleWindows
      ? "Saved chart review refreshed so candle replay data can appear on trade pages."
      : "Chart data review resumed. You can keep reviewing trades while chart evidence updates.",
    run,
  });
}

export const POST = withTraderIntelligenceOwnerRoute("app/api/import-batches/[batchId]/decision-review/resume/route.ts", POSTHandler);
