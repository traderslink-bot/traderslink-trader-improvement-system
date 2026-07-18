import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";

import {
  getJournalLevelAnalysisTradeLinkForAdminApi,
  journalLevelAnalysisTradeLinkErrorResponse,
} from "../../../../../../src/lib/level-analysis/level-analysis-journal-delivery-trade-link-api-service";
import {
  isLevelAnalysisTradeLinkAdminDebugEnabled,
  isLevelAnalysisTradeLinkApiEnabled,
} from "../../../../../../src/lib/level-analysis/level-analysis-journal-delivery-trade-link-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function GETHandler(
  _request: Request,
  context: { params: Promise<{ linkId: string }> },
): Promise<Response> {
  if (
    !isLevelAnalysisTradeLinkApiEnabled() ||
    !isLevelAnalysisTradeLinkAdminDebugEnabled()
  ) {
    return journalLevelAnalysisTradeLinkErrorResponse(
      404,
      "feature_disabled",
      "Level analysis trade-link admin debug API is disabled.",
    );
  }

  const params = await context.params;
  return Response.json(
    getJournalLevelAnalysisTradeLinkForAdminApi({
      linkId: params.linkId,
    }),
  );
}

export const GET = withTraderIntelligenceOwnerRoute("app/api/admin/level-analysis/trade-links/[linkId]/route.ts", GETHandler);
