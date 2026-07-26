import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";

import { SqliteImportCommitRepository } from "../../../../src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository";
import { resolveConfiguredOwnerWorkspaceImportContext } from "../../../../src/lib/trader-analytics/server/owner-workspace-context";
import { buildTradeImportSourceCautionReadModel } from "../../../../src/lib/trader-analytics/server/saved-import-source-caution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function GETHandler(
  _request: Request,
  context: { params: Promise<{ tradeId: string }> },
): Promise<Response> {
  const routeParams = await context.params;
  const tradeId = decodeURIComponent(routeParams.tradeId);
  const repository = new SqliteImportCommitRepository();
  const ownerContext = resolveConfiguredOwnerWorkspaceImportContext({ repository });
  const trade = repository.getTrade(ownerContext.ownerId, tradeId);

  if (!trade) {
    return Response.json(
      {
        contractVersion: "saved_trades_api_error_v1",
        error: { code: "not_found", message: `Trade ${tradeId} was not found.` },
      },
      { status: 404 },
    );
  }

  return Response.json({
    contractVersion: "saved_trade_api_v1",
    trade,
    importSourceCaution: buildTradeImportSourceCautionReadModel({
      repository,
      trade,
    }),
    reviewItemStates: repository.listTradeReviewItemStates(tradeId),
    decisionReviewSnapshot: repository.getDecisionReviewSnapshotForTrade(tradeId),
    decisionReviewDiagnostics:
      repository.listDecisionReviewDiagnosticsForTrade(tradeId),
  });
}

export const GET = withTraderIntelligenceOwnerRoute("app/api/trades/[tradeId]/route.ts", GETHandler);
