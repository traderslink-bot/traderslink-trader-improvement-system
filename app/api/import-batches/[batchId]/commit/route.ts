import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";

import { after } from "next/server";
import {
  buildDurableImportCommitPlan,
  importCommitErrorResponse,
  parseImportCommitRequestInput,
  readJsonRequest,
} from "../../../../../src/lib/trader-analytics/server/import-commit-service";
import { readLevelsSystemRuntimeConfigFromEnv } from "../../../../../src/lib/support-resistance/levels-system-runtime-options";
import { runPersistedDecisionReviewJobs } from "../../../../../src/lib/trader-analytics/server/saved-decision-review-service";
import { SqliteImportCommitRepository } from "../../../../../src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function scheduleDecisionReviewRun(args: {
  importBatchId: string;
  generatedAt: string;
}): void {
  const run = async () => {
    try {
      await runPersistedDecisionReviewJobs({
        repository: new SqliteImportCommitRepository(),
        importBatchId: args.importBatchId,
        levelsSystem: readLevelsSystemRuntimeConfigFromEnv(),
        generatedAt: args.generatedAt,
      });
    } catch (error) {
      console.error("Saved chart data review failed after import commit.", {
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
  let plan = repository.getPreviewPlan(batchId);

  if (!plan) {
    return importCommitErrorResponse(
      404,
      "not_found",
      `Import batch ${batchId} was not found.`,
    );
  }

  let document: unknown = {};
  try {
    document = await readJsonRequest(request);
  } catch {
    document = {};
  }

  if (
    typeof document === "object" &&
    document !== null &&
    !Array.isArray(document) &&
    "csvText" in document
  ) {
    try {
      const input = parseImportCommitRequestInput(document);
      plan = buildDurableImportCommitPlan({
        input,
        repository,
        batchId,
        generatedAt: plan.generatedAt,
      });
    } catch (error) {
      return importCommitErrorResponse(
        400,
        "invalid_request",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  if (plan.batch.id !== batchId) {
    return importCommitErrorResponse(
      400,
      "invalid_request",
      "Commit payload did not rebuild the same import batch.",
    );
  }

  const result = repository.commitImportPlan(plan);

  if (result.status === "rejected") {
    return importCommitErrorResponse(409, "commit_rejected", result.message);
  }

  const decisionReviewRun = {
    contractVersion: "persisted_decision_review_run_scheduled_v1",
    importBatchId: batchId,
    requestedJobCount: result.decisionReviewJobCount,
    queuedJobCount: plan.decisionReviewJobs.filter(
      (job) => job.status === "queued",
    ).length,
    blockedOpenTradeCount: plan.decisionReviewJobs.filter(
      (job) => job.status === "blocked_open_trade",
    ).length,
    message:
      "Import saved. Chart data review was queued to continue after the upload response.",
  };

  if (result.status === "committed" && result.decisionReviewJobCount > 0) {
    scheduleDecisionReviewRun({
      importBatchId: batchId,
      generatedAt: plan.generatedAt,
    });
  }

  return Response.json({
    contractVersion: "import_commit_api_commit_result_v1",
    result,
    decisionReviewRun,
  });
}

export const POST = withTraderIntelligenceOwnerRoute("app/api/import-batches/[batchId]/commit/route.ts", POSTHandler);
