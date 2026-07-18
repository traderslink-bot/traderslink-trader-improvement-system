import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";

import {
  DEMO_USER_ID,
  SqliteImportCommitRepository,
} from "../../../../../src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  if (typeof body.body !== "string" || body.body.trim().length === 0) {
    return Response.json(
      {
        contractVersion: "saved_trade_note_error_v1",
        error: { code: "invalid_request", message: "Note body is required." },
      },
      { status: 400 },
    );
  }

  const repository = new SqliteImportCommitRepository();
  const note = repository.addTradeNote({
    userId: DEMO_USER_ID,
    tradeId,
    body: body.body,
  });

  if (!note) {
    return Response.json(
      {
        contractVersion: "saved_trade_note_error_v1",
        error: { code: "not_found", message: `Trade ${tradeId} was not found.` },
      },
      { status: 404 },
    );
  }

  return Response.json({
    contractVersion: "saved_trade_note_v1",
    note,
  });
}

export const POST = withTraderIntelligenceOwnerRoute("app/api/trades/[tradeId]/notes/route.ts", POSTHandler);
