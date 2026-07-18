import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";

import {
  getTradeDetailLevelFactsForApi,
  journalLevelAnalysisTradeLinkErrorResponse,
} from "../../../../../../src/lib/level-analysis/level-analysis-journal-delivery-trade-link-api-service";
import { isLevelAnalysisTradeDetailLevelFactsEnabled } from "../../../../../../src/lib/level-analysis/level-analysis-journal-delivery-trade-link-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function GETHandler(
  _request: Request,
  context: { params: Promise<{ tradeId: string }> },
): Promise<Response> {
  if (!isLevelAnalysisTradeDetailLevelFactsEnabled()) {
    return journalLevelAnalysisTradeLinkErrorResponse(
      404,
      "feature_disabled",
      "Level analysis trade-detail facts API is disabled.",
    );
  }

  const params = await context.params;
  return Response.json(
    getTradeDetailLevelFactsForApi({
      savedTradeId: params.tradeId,
      featureEnabled: true,
    }),
  );
}

export const GET = withTraderIntelligenceOwnerRoute("app/api/trades/[tradeId]/level-analysis/facts/route.ts", GETHandler);
