import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";

import { buildGuidedReviewSession } from "../../../../src/lib/trader-analytics";
import { buildSavedOrSampleTraderAnalyticsViewModel } from "../../../../src/lib/trader-analytics/server/saved-trader-analytics-data";
import { buildSavedDecisionReviewReadModel } from "../../../../src/lib/trader-analytics/server/saved-decision-review-service";
import { buildSavedReviewQueueReadModel } from "../../../../src/lib/trader-analytics/server/saved-review-queue";
import { buildLatestSavedImportSourceCautionReadModel } from "../../../../src/lib/trader-analytics/server/saved-import-source-caution";
import { resolveConfiguredOwnerWorkspaceImportContext } from "../../../../src/lib/trader-analytics/server/owner-workspace-context";
import {
  canUseChartContext,
  readTraderIntelligenceTierFromEnv,
} from "../../../../src/lib/trader-analytics/product/tier-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function GETHandler(): Promise<Response> {
  const ownerContext = resolveConfiguredOwnerWorkspaceImportContext({});
  const data = buildSavedOrSampleTraderAnalyticsViewModel({ userId: ownerContext.ownerId });
  const activeTier = readTraderIntelligenceTierFromEnv();
  const chartContextAllowed = canUseChartContext(activeTier);

  return Response.json({
    contractVersion: "latest_review_api_v1",
    source: data.mode === "saved" ? "saved_sqlite" : "sample_fallback",
    review: buildGuidedReviewSession({ analytics: data.viewModel }),
    savedDecisionReview:
      data.mode === "saved" && chartContextAllowed
        ? buildSavedDecisionReviewReadModel({
            repository: data.repository,
            accountId: ownerContext.account.id,
          })
        : null,
    savedReviewQueue:
      data.mode === "saved"
        ? buildSavedReviewQueueReadModel({
            includeChartContext: chartContextAllowed,
            repository: data.repository,
            accountId: ownerContext.account.id,
            userId: ownerContext.ownerId,
          })
        : null,
    savedImportSourceCaution:
      data.mode === "saved"
        ? buildLatestSavedImportSourceCautionReadModel({
            repository: data.repository,
            accountId: ownerContext.account.id,
          })
        : null,
  });
}

export const GET = withTraderIntelligenceOwnerRoute("app/api/review/latest/route.ts", GETHandler);
