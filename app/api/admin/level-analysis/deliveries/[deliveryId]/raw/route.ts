import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";

import {
  getJournalLevelAnalysisRawPayloadForAdminApi,
  journalLevelAnalysisDeliveryErrorResponse,
} from "../../../../../../../src/lib/level-analysis/level-analysis-journal-delivery-api-service";
import {
  isLevelAnalysisDeliveryApiEnabled,
  isLevelAnalysisDeliveryRawDebugEnabled,
} from "../../../../../../../src/lib/level-analysis/level-analysis-journal-delivery-persistence-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function GETHandler(
  _request: Request,
  context: { params: Promise<{ deliveryId: string }> },
): Promise<Response> {
  if (
    !isLevelAnalysisDeliveryApiEnabled() ||
    !isLevelAnalysisDeliveryRawDebugEnabled()
  ) {
    return journalLevelAnalysisDeliveryErrorResponse(
      404,
      "feature_disabled",
      "Level analysis delivery raw debug API is disabled.",
    );
  }

  const params = await context.params;
  return Response.json(
    getJournalLevelAnalysisRawPayloadForAdminApi({
      deliveryId: params.deliveryId,
    }),
  );
}

export const GET = withTraderIntelligenceOwnerRoute("app/api/admin/level-analysis/deliveries/[deliveryId]/raw/route.ts", GETHandler);
