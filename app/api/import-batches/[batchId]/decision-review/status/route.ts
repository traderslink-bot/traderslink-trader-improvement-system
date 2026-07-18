import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";

import { SqliteImportCommitRepository } from "../../../../../../src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository";
import { importCommitErrorResponse } from "../../../../../../src/lib/trader-analytics/server/import-commit-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function countBy(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

async function GETHandler(
  _request: Request,
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

  const jobs = repository.listDecisionReviewJobs(batchId);
  const snapshots = repository.listDecisionReviewSnapshotsForBatch(batchId);
  const diagnostics = repository.listDecisionReviewDiagnosticsForBatch(batchId);
  const statusCounts = countBy(jobs.map((job) => job.status));
  const queuedCount = statusCounts.queued ?? 0;
  const completedCount = statusCounts.completed ?? 0;
  const blockedOpenTradeCount = statusCounts.blocked_open_trade ?? 0;
  const marketContextUnavailableCount =
    statusCounts.market_context_unavailable ?? 0;
  const analysisFailedCount = statusCounts.analysis_failed ?? 0;
  const skippedLimitCount = statusCounts.skipped_limit ?? 0;
  const processedCount =
    completedCount +
    blockedOpenTradeCount +
    marketContextUnavailableCount +
    analysisFailedCount +
    skippedLimitCount;
  const retryableCount = marketContextUnavailableCount + analysisFailedCount;
  const pendingWorkCount = queuedCount + retryableCount;

  return Response.json({
    contractVersion: "persisted_decision_review_status_v1",
    importBatchId: batchId,
    generatedAt: new Date().toISOString(),
    batchStatus: batch.status,
    totalJobCount: jobs.length,
    savedTradeCount: plan.savedTrades.length,
    executionCount: plan.executions.length,
    queuedCount,
    completedCount,
    blockedOpenTradeCount,
    marketContextUnavailableCount,
    analysisFailedCount,
    skippedLimitCount,
    retryableCount,
    pendingWorkCount,
    processedCount,
    snapshotCount: snapshots.length,
    diagnosticCount: diagnostics.length,
    statusCounts,
    canResume: batch.status === "committed" && pendingWorkCount > 0,
    nextAction:
      queuedCount > 0
        ? "Continue chart data review for queued saved trades."
        : retryableCount > 0
          ? "Retry failed chart data review after market data is connected."
          : completedCount > 0
            ? "Use saved chart evidence snapshots in guided review."
            : "No chart-data review work is waiting for this import.",
  });
}

export const GET = withTraderIntelligenceOwnerRoute("app/api/import-batches/[batchId]/decision-review/status/route.ts", GETHandler);
