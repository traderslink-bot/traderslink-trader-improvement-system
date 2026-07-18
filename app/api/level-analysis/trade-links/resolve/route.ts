import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";

import {
  journalLevelAnalysisTradeLinkErrorResponse,
  readJournalLevelAnalysisTradeLinkApiRequest,
  resolveJournalLevelAnalysisTradeLinkForApi,
} from "../../../../../src/lib/level-analysis/level-analysis-journal-delivery-trade-link-api-service";
import { isLevelAnalysisTradeLinkApiEnabled } from "../../../../../src/lib/level-analysis/level-analysis-journal-delivery-trade-link-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function POSTHandler(request: Request): Promise<Response> {
  if (!isLevelAnalysisTradeLinkApiEnabled()) {
    return journalLevelAnalysisTradeLinkErrorResponse(
      404,
      "feature_disabled",
      "Level analysis trade-link API is disabled.",
    );
  }

  try {
    const input = await readJournalLevelAnalysisTradeLinkApiRequest(request);
    const response = resolveJournalLevelAnalysisTradeLinkForApi(input);
    return Response.json(response, {
      status: response.status === "matched" ? 200 : 422,
    });
  } catch (error) {
    return journalLevelAnalysisTradeLinkErrorResponse(
      400,
      error instanceof Error && error.message.startsWith("Invalid JSON")
        ? "invalid_json"
        : "invalid_request",
      error instanceof Error ? error.message : String(error),
    );
  }
}

export const POST = withTraderIntelligenceOwnerRoute("app/api/level-analysis/trade-links/resolve/route.ts", POSTHandler);
