import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";

import { SqliteImportCommitRepository } from "../../../src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository";
import { resolveConfiguredOwnerWorkspaceImportContext } from "../../../src/lib/trader-analytics/server/owner-workspace-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function GETHandler(): Promise<Response> {
  const repository = new SqliteImportCommitRepository();
  const context = resolveConfiguredOwnerWorkspaceImportContext({ repository });
  const trades = repository.listTrades(context.ownerId);

  return Response.json({
    contractVersion: "saved_trades_api_v1",
    source: trades.length > 0 ? "saved_sqlite" : "empty",
    trades,
  });
}

export const GET = withTraderIntelligenceOwnerRoute("app/api/trades/route.ts", GETHandler);
