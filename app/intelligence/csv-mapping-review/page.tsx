import { requireTraderIntelligenceOwnerPageAccess } from "@/src/lib/trader-intelligence-v3/auth";
import { SqliteImportCommitRepository } from "@/src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository";
import { resolveOwnerWorkspaceImportContext } from "@/src/lib/trader-analytics/server/owner-workspace-context";
import CsvMappingReviewClient from "./csv-mapping-review-client";

export const dynamic = "force-dynamic";

export default async function CsvMappingReviewPage() {
  const owner = await requireTraderIntelligenceOwnerPageAccess(
    "app/intelligence/csv-mapping-review/page.tsx",
  );
  const context = resolveOwnerWorkspaceImportContext({
    owner,
    repository: new SqliteImportCommitRepository(),
  });

  return (
    <CsvMappingReviewClient
      accountLabel={context.account.label}
      accountTimezone={context.account.timezone}
      importDefaultTimezone={context.account.importDefaults.timestampTimezone}
      accountId={context.account.id}
    />
  );
}
