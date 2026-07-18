import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";

import {
  getLatestJournalLevelAnalysisSymbolSummaryForApi,
  journalLevelAnalysisDeliveryErrorResponse,
} from "../../../../../../../src/lib/level-analysis/level-analysis-journal-delivery-api-service";
import { isLevelAnalysisDeliveryApiEnabled } from "../../../../../../../src/lib/level-analysis/level-analysis-journal-delivery-persistence-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function GETHandler(
  request: Request,
  context: { params: Promise<{ symbol: string }> },
): Promise<Response> {
  if (!isLevelAnalysisDeliveryApiEnabled()) {
    return journalLevelAnalysisDeliveryErrorResponse(
      404,
      "feature_disabled",
      "Level analysis delivery API is disabled.",
    );
  }

  const params = await context.params;
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider") ?? undefined;

  return Response.json(
    getLatestJournalLevelAnalysisSymbolSummaryForApi({
      symbol: params.symbol,
      provider,
    }),
  );
}

export const GET = withTraderIntelligenceOwnerRoute("app/api/level-analysis/deliveries/latest/symbols/[symbol]/route.ts", GETHandler);
