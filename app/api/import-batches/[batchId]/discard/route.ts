import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";

import {
  importCommitErrorResponse,
} from "../../../../../src/lib/trader-analytics/server/import-commit-service";
import { SqliteImportCommitRepository } from "../../../../../src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function POSTHandler(
  _request: Request,
  context: { params: Promise<{ batchId: string }> },
): Promise<Response> {
  const routeParams = await context.params;
  const batchId = decodeURIComponent(routeParams.batchId);
  const repository = new SqliteImportCommitRepository();
  const batch = repository.getImportBatch(batchId);

  if (!batch) {
    return importCommitErrorResponse(
      404,
      "not_found",
      `Import batch ${batchId} was not found.`,
    );
  }

  repository.discardImportBatch(batchId);

  return Response.json({
    contractVersion: "import_commit_api_discard_result_v1",
    batchId,
    status: "discarded",
  });
}

export const POST = withTraderIntelligenceOwnerRoute("app/api/import-batches/[batchId]/discard/route.ts", POSTHandler);
