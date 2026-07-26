import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";
import {
  applyGenericCsvMappingReview,
  inferGenericCsvSchema,
  normalizeGenericCsvMappingReviewCsv,
  resolveCsvMappingTimestampTimezone,
  type BrokerExecutionCsvColumnMapping,
  type BrokerExecutionCsvOptionsHandling,
} from "@/src/lib/execution-sources/csv";
import { SqliteImportCommitRepository } from "@/src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository";
import { buildDurableImportCommitPlan } from "@/src/lib/trader-analytics/server/import-commit-service";
import { validateCsvMappingTemplateInput } from "@/src/lib/trader-analytics/server/csv-mapping-template-service";
import { resolveConfiguredOwnerWorkspaceImportContext } from "@/src/lib/trader-analytics/server/owner-workspace-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSubmission(document: unknown): {
  csvText: string;
  columnMapping: BrokerExecutionCsvColumnMapping;
  sideValueMapping: Record<string, "buy" | "sell">;
  ignoredHeaders: string[];
  timezoneOverride?: string;
  templateId?: string;
  optionsHandling?: BrokerExecutionCsvOptionsHandling;
} {
  if (!isRecord(document) || typeof document.csvText !== "string" || !isRecord(document.columnMapping) || !isRecord(document.sideValueMapping)) throw new Error("CSV review submission is malformed.");
  if (document.csvText.length === 0 || document.csvText.length > 8_000_000) throw new Error("CSV payload is empty or exceeds the import limit.");
  return {
    csvText: document.csvText,
    columnMapping: document.columnMapping as BrokerExecutionCsvColumnMapping,
    sideValueMapping: document.sideValueMapping as Record<string, "buy" | "sell">,
    ignoredHeaders: Array.isArray(document.ignoredHeaders) && document.ignoredHeaders.every((item) => typeof item === "string") ? document.ignoredHeaders : [],
    timezoneOverride: typeof document.timezoneOverride === "string" ? document.timezoneOverride : undefined,
    templateId: typeof document.templateId === "string" ? document.templateId : undefined,
    optionsHandling: (document.optionsHandling === "reject" || document.optionsHandling === "skip" || document.optionsHandling === "allow" ? document.optionsHandling : undefined) as BrokerExecutionCsvOptionsHandling | undefined,
  };
}

async function POSTHandler(request: Request): Promise<Response> {
  try {
    const submission = parseSubmission(await request.json());
    const repository = new SqliteImportCommitRepository();
    const context = resolveConfiguredOwnerWorkspaceImportContext({ repository });
    const inference = inferGenericCsvSchema(submission.csvText);
    // Validates canonical fields, source-header membership, collisions, side
    // mappings, and IANA timezone before any durable batch is written.
    validateCsvMappingTemplateInput({
      name: "reviewed mapping",
      normalizedHeaders: inference.headers,
      delimiter: inference.delimiter,
      columnMapping: submission.columnMapping,
      sideValueMapping: submission.sideValueMapping,
      timestampTimezone: submission.timezoneOverride,
      optionsHandling: submission.optionsHandling,
    });
    const template = submission.templateId
      ? repository.listCsvMappingTemplates(context.ownerId, context.account.id).find((item) => item.id === submission.templateId) ?? null
      : null;
    if (submission.templateId && !template) throw new Error("Selected mapping template does not belong to the active account.");
    const review = applyGenericCsvMappingReview({
      csvText: submission.csvText,
      inference,
      corrections: submission.columnMapping,
      ignoredHeaders: submission.ignoredHeaders,
      sideValueMapping: submission.sideValueMapping,
      timestampTimezone: resolveCsvMappingTimestampTimezone({
        importOverride: submission.timezoneOverride,
        savedTemplateOverride: template?.timestampTimezone,
        accountImportDefault: context.account.importDefaults.timestampTimezone,
        accountTimezone: context.account.timezone,
      }),
      optionsHandling: submission.optionsHandling ?? template?.optionsHandling ?? context.account.importDefaults.optionsHandling,
      tradeGroupingRules: {
        maxGapMinutes: context.account.importDefaults.maxTradeGroupingGapMinutes ?? undefined,
        splitAtSessionBoundary: context.account.importDefaults.splitTradesAtSessionBoundary,
      },
    });
    if (review.status === "blocked" || !review.importResult) {
      return Response.json({ contractVersion: "csv_mapping_continue_result_v1", status: "blocked", conflicts: review.conflicts, message: "Resolve the mapping before continuing." }, { status: 422 });
    }
    const normalizedCsvText = normalizeGenericCsvMappingReviewCsv({ csvText: submission.csvText, inference, columnMapping: review.effectiveMapping, sideValueMapping: review.sideValueMapping });
    const plan = buildDurableImportCommitPlan({
      repository,
      context,
      input: {
        csvText: normalizedCsvText,
        broker: "generic_execution_csv",
        columnMapping: review.effectiveMapping,
        timestampTimezone: resolveCsvMappingTimestampTimezone({ importOverride: submission.timezoneOverride, savedTemplateOverride: template?.timestampTimezone, accountImportDefault: context.account.importDefaults.timestampTimezone, accountTimezone: context.account.timezone }),
        optionsHandling: submission.optionsHandling ?? template?.optionsHandling ?? context.account.importDefaults.optionsHandling,
      },
    });
    repository.savePreviewPlan(plan);
    if (template) repository.markCsvMappingTemplateUsed(context.ownerId, context.account.id, template.id);
    return Response.json({ contractVersion: "csv_mapping_continue_result_v1", status: plan.canCommitNow ? "ready_to_commit" : "needs_review", batchId: plan.batch.id, href: `/intelligence/imports/${encodeURIComponent(plan.batch.id)}`, commitPlan: plan.readModel });
  } catch (error) {
    return Response.json({ contractVersion: "csv_mapping_continue_error_v1", error: { code: "review_rejected", message: error instanceof Error ? error.message : "CSV review was rejected." } }, { status: 400 });
  }
}

export const POST = withTraderIntelligenceOwnerRoute("app/api/csv-mapping-review/continue/route.ts", POSTHandler);
