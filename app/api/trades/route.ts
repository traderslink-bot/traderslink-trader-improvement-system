import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";

import {
  DEMO_USER_ID,
  SqliteImportCommitRepository,
} from "../../../src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function GETHandler(): Promise<Response> {
  const repository = new SqliteImportCommitRepository();
  const trades = repository.listTrades(DEMO_USER_ID);

  return Response.json({
    contractVersion: "saved_trades_api_v1",
    source: trades.length > 0 ? "saved_sqlite" : "empty",
    trades,
  });
}

export const GET = withTraderIntelligenceOwnerRoute("app/api/trades/route.ts", GETHandler);
