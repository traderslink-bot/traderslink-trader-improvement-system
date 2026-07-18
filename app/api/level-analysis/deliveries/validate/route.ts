import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";

import {
  journalLevelAnalysisDeliveryErrorResponse,
  readJournalLevelAnalysisDeliveryApiRequest,
  validateJournalLevelAnalysisDeliveryForApi,
} from "../../../../../src/lib/level-analysis/level-analysis-journal-delivery-api-service";
import { isLevelAnalysisDeliveryApiEnabled } from "../../../../../src/lib/level-analysis/level-analysis-journal-delivery-persistence-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function POSTHandler(request: Request): Promise<Response> {
  if (!isLevelAnalysisDeliveryApiEnabled()) {
    return journalLevelAnalysisDeliveryErrorResponse(
      404,
      "feature_disabled",
      "Level analysis delivery API is disabled.",
    );
  }

  try {
    const input = await readJournalLevelAnalysisDeliveryApiRequest(request);
    return Response.json(validateJournalLevelAnalysisDeliveryForApi(input));
  } catch (error) {
    return journalLevelAnalysisDeliveryErrorResponse(
      400,
      error instanceof Error && error.message.startsWith("Invalid JSON")
        ? "invalid_json"
        : "invalid_request",
      error instanceof Error ? error.message : String(error),
    );
  }
}

export const POST = withTraderIntelligenceOwnerRoute("app/api/level-analysis/deliveries/validate/route.ts", POSTHandler);
