import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";

import {
  DEMO_USER_ID,
  SqliteImportCommitRepository,
} from "../../../../../src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function POSTHandler(
  _request: Request,
  context: { params: Promise<{ tradeId: string }> },
): Promise<Response> {
  const routeParams = await context.params;
  const tradeId = decodeURIComponent(routeParams.tradeId);
  const repository = new SqliteImportCommitRepository();
  const trade = repository.markTradeClosedByUser({
    userId: DEMO_USER_ID,
    tradeId,
  });

  if (!trade) {
    return Response.json(
      {
        contractVersion: "trade_mark_closed_error_v1",
        error: { code: "not_found", message: `Trade ${tradeId} was not found.` },
      },
      { status: 404 },
    );
  }

  return Response.json({
    contractVersion: "trade_mark_closed_v1",
    trade,
  });
}

export const POST = withTraderIntelligenceOwnerRoute("app/api/trades/[tradeId]/mark-closed/route.ts", POSTHandler);
