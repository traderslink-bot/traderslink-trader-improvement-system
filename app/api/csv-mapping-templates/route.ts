import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";
import { SqliteImportCommitRepository } from "@/src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository";
import {
  saveOwnerCsvMappingTemplate,
  type CsvMappingTemplateInput,
} from "@/src/lib/trader-analytics/server/csv-mapping-template-service";
import { resolveConfiguredOwnerWorkspaceImportContext } from "@/src/lib/trader-analytics/server/owner-workspace-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseInput(value: unknown): CsvMappingTemplateInput {
  if (!isRecord(value) || !isRecord(value.template)) throw new Error("template is required.");
  const template = value.template;
  if (typeof template.name !== "string" || !Array.isArray(template.normalizedHeaders) || !template.normalizedHeaders.every((item) => typeof item === "string") || typeof template.delimiter !== "string" || !isRecord(template.columnMapping) || !isRecord(template.sideValueMapping)) throw new Error("template is malformed.");
  return {
    name: template.name,
    normalizedHeaders: template.normalizedHeaders,
    delimiter: template.delimiter,
    columnMapping: template.columnMapping,
    sideValueMapping: template.sideValueMapping as Record<string, "buy" | "sell">,
    timestampTimezone: typeof template.timestampTimezone === "string" ? template.timestampTimezone : undefined,
    optionsHandling: template.optionsHandling === "reject" || template.optionsHandling === "skip" || template.optionsHandling === "allow" ? template.optionsHandling : undefined,
  };
}

async function POSTHandler(request: Request): Promise<Response> {
  try {
    const repository = new SqliteImportCommitRepository();
    const context = resolveConfiguredOwnerWorkspaceImportContext({ repository });
    const document = await request.json();
    const template = saveOwnerCsvMappingTemplate({ context, repository, input: parseInput(document) });
    return Response.json({ contractVersion: "owner_csv_mapping_template_api_v1", template }, { status: 201 });
  } catch (error) {
    return Response.json({ contractVersion: "owner_csv_mapping_template_error_v1", error: { code: "invalid_template", message: error instanceof Error ? error.message : "Template was rejected." } }, { status: 400 });
  }
}

export const POST = withTraderIntelligenceOwnerRoute("app/api/csv-mapping-templates/route.ts", POSTHandler);
