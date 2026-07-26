import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";

import { buildSavedOrSampleTraderAnalyticsViewModel } from "../../../../src/lib/trader-analytics/server/saved-trader-analytics-data";
import { buildLatestSavedImportSourceCautionReadModel } from "../../../../src/lib/trader-analytics/server/saved-import-source-caution";
import { resolveConfiguredOwnerWorkspaceImportContext } from "../../../../src/lib/trader-analytics/server/owner-workspace-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function GETHandler(): Promise<Response> {
  const ownerContext = resolveConfiguredOwnerWorkspaceImportContext({});
  const data = buildSavedOrSampleTraderAnalyticsViewModel({ userId: ownerContext.ownerId });

  return Response.json({
    contractVersion: "latest_coach_api_v1",
    source: data.mode === "saved" ? "saved_sqlite" : "sample_fallback",
    coach: data.viewModel.coachActionLoop.coachHome,
    emptyState: data.viewModel.coachActionLoop.emptyState,
    focusQueue: data.viewModel.focusQueue,
    savedImportSourceCaution:
      data.mode === "saved"
        ? buildLatestSavedImportSourceCautionReadModel({
            repository: data.repository,
            accountId: ownerContext.account.id,
          })
        : null,
  });
}

export const GET = withTraderIntelligenceOwnerRoute("app/api/coach/latest/route.ts", GETHandler);
