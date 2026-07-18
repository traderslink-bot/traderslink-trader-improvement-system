import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";

import {
  importCommitErrorResponse,
} from "../../../../src/lib/trader-analytics/server/import-commit-service";
import { SqliteImportCommitRepository } from "../../../../src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository";
import { buildSavedDecisionReviewReadModel } from "../../../../src/lib/trader-analytics/server/saved-decision-review-service";
import { buildImportRecoveryReadModel } from "../../../../src/lib/trader-analytics/server/import-recovery-read-model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  return Response.json({
    contractVersion: "import_commit_api_batch_v1",
    batch,
    readModel: plan.readModel,
    recovery: buildImportRecoveryReadModel({ repository, plan, batch }),
    repairItems: plan.repairItems,
    repairEvents: repository.listImportRepairEvents(batchId),
    requiredDecisions: plan.requiredDecisions,
    savedTradeCount: plan.savedTrades.length,
    executionCount: plan.executions.length,
    decisionReviewJobCount: plan.decisionReviewJobs.length,
    decisionReview: {
      jobs: repository.listDecisionReviewJobs(batchId),
      snapshots: repository.listDecisionReviewSnapshotsForBatch(batchId),
      diagnostics: repository.listDecisionReviewDiagnosticsForBatch(batchId),
      latestReadModel: buildSavedDecisionReviewReadModel({ repository }),
    },
  });
}

export const GET = withTraderIntelligenceOwnerRoute("app/api/import-batches/[batchId]/route.ts", GETHandler);
