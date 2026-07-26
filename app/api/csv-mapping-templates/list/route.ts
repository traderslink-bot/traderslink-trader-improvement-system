import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";
import { SqliteImportCommitRepository } from "@/src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository";
import { listOwnerCsvMappingTemplates } from "@/src/lib/trader-analytics/server/csv-mapping-template-service";
import { resolveConfiguredOwnerWorkspaceImportContext } from "@/src/lib/trader-analytics/server/owner-workspace-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function GETHandler(): Promise<Response> {
  const repository = new SqliteImportCommitRepository();
  const context = resolveConfiguredOwnerWorkspaceImportContext({ repository });
  return Response.json({ contractVersion: "owner_csv_mapping_templates_api_v1", account: { id: context.account.id, label: context.account.label }, templates: listOwnerCsvMappingTemplates({ context, repository }) });
}

export const GET = withTraderIntelligenceOwnerRoute("app/api/csv-mapping-templates/list/route.ts", GETHandler);
