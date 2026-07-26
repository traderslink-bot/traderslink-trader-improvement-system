import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";

import type {
  TradeReviewChecklistItemId,
  TradeReviewChecklistItemStatus,
} from "../../../../../../src/lib/trader-analytics/product/types";
import { SqliteImportCommitRepository } from "../../../../../../src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository";
import { resolveConfiguredOwnerWorkspaceImportContext } from "../../../../../../src/lib/trader-analytics/server/owner-workspace-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_ITEM_IDS = new Set<TradeReviewChecklistItemId>([
  "entry_review",
  "add_review",
  "exit_review",
  "sizing_review",
  "risk_review",
  "lesson_review",
  "rule_review",
]);

const VALID_STATUSES = new Set<TradeReviewChecklistItemStatus>([
  "complete",
  "attention",
  "todo",
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
  context: { params: Promise<{ tradeId: string; itemId: string }> },
): Promise<Response> {
  const routeParams = await context.params;
  const tradeId = decodeURIComponent(routeParams.tradeId);
  const itemId = decodeURIComponent(routeParams.itemId);
  const body = await readBody(request);

  if (!VALID_ITEM_IDS.has(itemId as TradeReviewChecklistItemId)) {
    return Response.json(
      {
        contractVersion: "trade_review_item_error_v1",
        error: { code: "invalid_request", message: "Unknown review item." },
      },
      { status: 400 },
    );
  }
  if (
    typeof body.status !== "string" ||
    !VALID_STATUSES.has(body.status as TradeReviewChecklistItemStatus)
  ) {
    return Response.json(
      {
        contractVersion: "trade_review_item_error_v1",
        error: { code: "invalid_request", message: "Invalid review status." },
      },
      { status: 400 },
    );
  }

  const repository = new SqliteImportCommitRepository();
  const ownerContext = resolveConfiguredOwnerWorkspaceImportContext({ repository });
  const state = repository.setTradeReviewItemStatus({
    userId: ownerContext.ownerId,
    tradeId,
    itemId: itemId as TradeReviewChecklistItemId,
    status: body.status as TradeReviewChecklistItemStatus,
  });

  if (!state) {
    return Response.json(
      {
        contractVersion: "trade_review_item_error_v1",
        error: { code: "not_found", message: `Trade ${tradeId} was not found.` },
      },
      { status: 404 },
    );
  }

  return Response.json({
    contractVersion: "trade_review_item_state_v1",
    state,
  });
}

export const POST = withTraderIntelligenceOwnerRoute("app/api/trades/[tradeId]/review-items/[itemId]/route.ts", POSTHandler);
