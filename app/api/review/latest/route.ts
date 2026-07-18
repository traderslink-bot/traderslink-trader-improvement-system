import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";

import { buildGuidedReviewSession } from "../../../../src/lib/trader-analytics";
import { buildSavedOrSampleTraderAnalyticsViewModel } from "../../../../src/lib/trader-analytics/server/saved-trader-analytics-data";
import { buildSavedDecisionReviewReadModel } from "../../../../src/lib/trader-analytics/server/saved-decision-review-service";
import { buildSavedReviewQueueReadModel } from "../../../../src/lib/trader-analytics/server/saved-review-queue";
import { buildLatestSavedImportSourceCautionReadModel } from "../../../../src/lib/trader-analytics/server/saved-import-source-caution";
import {
  canUseChartContext,
  readTraderIntelligenceTierFromEnv,
} from "../../../../src/lib/trader-analytics/product/tier-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function GETHandler(): Promise<Response> {
  const data = buildSavedOrSampleTraderAnalyticsViewModel();
  const activeTier = readTraderIntelligenceTierFromEnv();
  const chartContextAllowed = canUseChartContext(activeTier);

  return Response.json({
    contractVersion: "latest_review_api_v1",
    source: data.mode === "saved" ? "saved_sqlite" : "sample_fallback",
    review: buildGuidedReviewSession({ analytics: data.viewModel }),
    savedDecisionReview:
      data.mode === "saved" && chartContextAllowed
        ? buildSavedDecisionReviewReadModel({ repository: data.repository })
        : null,
    savedReviewQueue:
      data.mode === "saved"
        ? buildSavedReviewQueueReadModel({
            includeChartContext: chartContextAllowed,
            repository: data.repository,
          })
        : null,
    savedImportSourceCaution:
      data.mode === "saved"
        ? buildLatestSavedImportSourceCautionReadModel({
            repository: data.repository,
          })
        : null,
  });
}

export const GET = withTraderIntelligenceOwnerRoute("app/api/review/latest/route.ts", GETHandler);
