import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";

import {
  getJournalLevelAnalysisForTradeApi,
  journalLevelAnalysisTradeLinkErrorResponse,
} from "../../../../../src/lib/level-analysis/level-analysis-journal-delivery-trade-link-api-service";
import { isLevelAnalysisTradeLinkApiEnabled } from "../../../../../src/lib/level-analysis/level-analysis-journal-delivery-trade-link-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function GETHandler(
  _request: Request,
  context: { params: Promise<{ tradeId: string }> },
): Promise<Response> {
  if (!isLevelAnalysisTradeLinkApiEnabled()) {
    return journalLevelAnalysisTradeLinkErrorResponse(
      404,
      "feature_disabled",
      "Level analysis trade-link API is disabled.",
    );
  }

  const params = await context.params;
  return Response.json(
    getJournalLevelAnalysisForTradeApi({
      savedTradeId: params.tradeId,
    }),
  );
}

export const GET = withTraderIntelligenceOwnerRoute("app/api/trades/[tradeId]/level-analysis/route.ts", GETHandler);
