import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";

import type { SavedReviewStatus } from "../../../../../src/lib/trader-analytics/product/types";
import { SqliteImportCommitRepository } from "../../../../../src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository";
import { resolveConfiguredOwnerWorkspaceImportContext } from "../../../../../src/lib/trader-analytics/server/owner-workspace-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set<SavedReviewStatus>([
  "new",
  "reviewed",
  "in_progress",
  "resolved",
  "ignored",
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
  context: { params: Promise<{ tradeId: string }> },
): Promise<Response> {
  const routeParams = await context.params;
  const tradeId = decodeURIComponent(routeParams.tradeId);
  const body = await readBody(request);

  if (
    typeof body.status !== "string" ||
    !VALID_STATUSES.has(body.status as SavedReviewStatus)
  ) {
    return Response.json(
      {
        contractVersion: "trade_review_status_error_v1",
        error: { code: "invalid_request", message: "Invalid review status." },
      },
      { status: 400 },
    );
  }

  const repository = new SqliteImportCommitRepository();
  const ownerContext = resolveConfiguredOwnerWorkspaceImportContext({ repository });
  const trade = repository.setTradeReviewStatus({
    userId: ownerContext.ownerId,
    tradeId,
    status: body.status as SavedReviewStatus,
  });

  if (!trade) {
    return Response.json(
      {
        contractVersion: "trade_review_status_error_v1",
        error: { code: "not_found", message: `Trade ${tradeId} was not found.` },
      },
      { status: 404 },
    );
  }

  return Response.json({
    contractVersion: "trade_review_status_v1",
    trade,
  });
}

export const POST = withTraderIntelligenceOwnerRoute("app/api/trades/[tradeId]/review-status/route.ts", POSTHandler);
