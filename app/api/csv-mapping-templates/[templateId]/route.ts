import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";
import { SqliteImportCommitRepository } from "@/src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository";
import { deleteOwnerCsvMappingTemplate, saveOwnerCsvMappingTemplate, type CsvMappingTemplateInput } from "@/src/lib/trader-analytics/server/csv-mapping-template-service";
import { resolveConfiguredOwnerWorkspaceImportContext } from "@/src/lib/trader-analytics/server/owner-workspace-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseTemplate(document: unknown): CsvMappingTemplateInput {
  if (typeof document !== "object" || !document || Array.isArray(document) || !("template" in document)) throw new Error("template is required.");
  const template = (document as { template: unknown }).template;
  if (typeof template !== "object" || !template || Array.isArray(template)) throw new Error("template is malformed.");
  const record = template as Record<string, unknown>;
  if (typeof record.name !== "string" || !Array.isArray(record.normalizedHeaders) || !record.normalizedHeaders.every((item) => typeof item === "string") || typeof record.delimiter !== "string" || typeof record.columnMapping !== "object" || !record.columnMapping || Array.isArray(record.columnMapping) || typeof record.sideValueMapping !== "object" || !record.sideValueMapping || Array.isArray(record.sideValueMapping)) throw new Error("template is malformed.");
  return { name: record.name, normalizedHeaders: record.normalizedHeaders, delimiter: record.delimiter, columnMapping: record.columnMapping as CsvMappingTemplateInput["columnMapping"], sideValueMapping: record.sideValueMapping as Record<string, "buy" | "sell">, timestampTimezone: typeof record.timestampTimezone === "string" ? record.timestampTimezone : undefined, optionsHandling: record.optionsHandling === "reject" || record.optionsHandling === "skip" || record.optionsHandling === "allow" ? record.optionsHandling : undefined };
}

async function PATCHHandler(request: Request, context: { params: Promise<{ templateId: string }> }): Promise<Response> {
  try {
    const repository = new SqliteImportCommitRepository();
    const ownerContext = resolveConfiguredOwnerWorkspaceImportContext({ repository });
    const { templateId } = await context.params;
    const template = saveOwnerCsvMappingTemplate({ context: ownerContext, repository, templateId: decodeURIComponent(templateId), input: parseTemplate(await request.json()) });
    return Response.json({ contractVersion: "owner_csv_mapping_template_api_v1", template });
  } catch (error) {
    return Response.json({ contractVersion: "owner_csv_mapping_template_error_v1", error: { code: "invalid_template", message: error instanceof Error ? error.message : "Template was rejected." } }, { status: 400 });
  }
}

async function DELETEHandler(_request: Request, context: { params: Promise<{ templateId: string }> }): Promise<Response> {
  const repository = new SqliteImportCommitRepository();
  const ownerContext = resolveConfiguredOwnerWorkspaceImportContext({ repository });
  const { templateId } = await context.params;
  const deleted = deleteOwnerCsvMappingTemplate({ context: ownerContext, repository, templateId: decodeURIComponent(templateId) });
  return deleted ? new Response(null, { status: 204 }) : Response.json({ contractVersion: "owner_csv_mapping_template_error_v1", error: { code: "not_found", message: "Template was not found." } }, { status: 404 });
}

export const PATCH = withTraderIntelligenceOwnerRoute("app/api/csv-mapping-templates/[templateId]/route.ts", PATCHHandler);
export const DELETE = withTraderIntelligenceOwnerRoute("app/api/csv-mapping-templates/[templateId]/route.ts", DELETEHandler);
