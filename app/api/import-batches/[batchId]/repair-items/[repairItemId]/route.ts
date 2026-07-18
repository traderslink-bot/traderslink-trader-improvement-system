import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";

import type { ImportCommitRepairItemRecord } from "../../../../../../src/lib/trader-analytics/product/import-commit/import-commit-planner";
import { SqliteImportCommitRepository } from "../../../../../../src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set<ImportCommitRepairItemRecord["status"]>([
  "open",
  "resolved",
  "skipped",
  "dismissed",
]);

async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const value = await request.json();
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

async function POSTHandler(
  request: Request,
  context: { params: Promise<{ batchId: string; repairItemId: string }> },
): Promise<Response> {
  const routeParams = await context.params;
  const batchId = decodeURIComponent(routeParams.batchId);
  const repairItemId = decodeURIComponent(routeParams.repairItemId);
  const body = await readBody(request);

  if (
    typeof body.status !== "string" ||
    !VALID_STATUSES.has(body.status as ImportCommitRepairItemRecord["status"])
  ) {
    return Response.json(
      {
        contractVersion: "import_repair_item_error_v1",
        error: { code: "invalid_request", message: "Invalid repair status." },
      },
      { status: 400 },
    );
  }

  const repository = new SqliteImportCommitRepository();
  const repairItem = repository.updateRepairItemStatus({
    importBatchId: batchId,
    repairItemId,
    status: body.status as ImportCommitRepairItemRecord["status"],
  });

  if (!repairItem) {
    return Response.json(
      {
        contractVersion: "import_repair_item_error_v1",
        error: {
          code: "not_found",
          message: `Repair item ${repairItemId} was not found.`,
        },
      },
      { status: 404 },
    );
  }

  return Response.json({
    contractVersion: "import_repair_item_state_v1",
    repairItem,
  });
}

export const POST = withTraderIntelligenceOwnerRoute("app/api/import-batches/[batchId]/repair-items/[repairItemId]/route.ts", POSTHandler);
