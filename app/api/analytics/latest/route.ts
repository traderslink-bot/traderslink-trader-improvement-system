import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";

import { buildSavedOrSampleTraderAnalyticsViewModel } from "../../../../src/lib/trader-analytics/server/saved-trader-analytics-data";
import { buildLatestSavedImportSourceCautionReadModel } from "../../../../src/lib/trader-analytics/server/saved-import-source-caution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function GETHandler(): Promise<Response> {
  const data = buildSavedOrSampleTraderAnalyticsViewModel();

  return Response.json({
    contractVersion: "latest_analytics_api_v1",
    source: data.mode === "saved" ? "saved_sqlite" : "sample_fallback",
    latestReport: data.viewModel.latestReport,
    onboarding: data.viewModel.onboarding,
    savedImportSourceCaution:
      data.mode === "saved"
        ? buildLatestSavedImportSourceCautionReadModel({
            repository: data.repository,
          })
        : null,
  });
}

export const GET = withTraderIntelligenceOwnerRoute("app/api/analytics/latest/route.ts", GETHandler);
