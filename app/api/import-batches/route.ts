import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";

import {
  DEMO_ACCOUNT_ID,
  SqliteImportCommitRepository,
} from "../../../src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository";
import { buildImportRecoveryReadModel } from "../../../src/lib/trader-analytics/server/import-recovery-read-model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function GETHandler(): Promise<Response> {
  const repository = new SqliteImportCommitRepository();
  const history = repository.listImportBatchHistory(DEMO_ACCOUNT_ID);
  const recoveryQueue = history
    .flatMap((item) => {
      const plan = repository.getPreviewPlan(item.batch.id);
      const batch = repository.getImportBatch(item.batch.id);

      if (!plan || !batch) {
        return [];
      }

      return [buildImportRecoveryReadModel({ repository, plan, batch })];
    })
    .filter(
      (item) =>
        item.status !== "committed" &&
        item.status !== "discarded" &&
        item.status !== "ready_to_save",
    );

  return Response.json({
    contractVersion: "import_batch_history_api_v1",
    source: history.length > 0 ? "saved_sqlite" : "empty",
    history,
    recoveryQueue,
    unresolvedRepairs: repository.listUnresolvedImportRepairInbox(DEMO_ACCOUNT_ID),
  });
}

export const GET = withTraderIntelligenceOwnerRoute("app/api/import-batches/route.ts", GETHandler);
