import type {
  BrokerExecutionCsvCanonicalField,
  BrokerExecutionCsvColumnMapping,
  BrokerExecutionCsvOptionsHandling,
} from "../../execution-sources/csv";
import type { OwnerWorkspaceImportContext } from "./owner-workspace-context";
import {
  SqliteImportCommitRepository,
  type PersistedCsvMappingTemplate,
} from "../product/import-commit/sqlite-import-commit-repository";

export const PERSISTED_CSV_MAPPING_TEMPLATE_VERSION =
  "owner_csv_mapping_template_v1" as const;

export interface CsvMappingTemplateInput {
  name: string;
  normalizedHeaders: string[];
  delimiter: string;
  columnMapping: BrokerExecutionCsvColumnMapping;
  sideValueMapping: Record<string, "buy" | "sell">;
  timestampTimezone?: string;
  optionsHandling?: BrokerExecutionCsvOptionsHandling;
}

const CANONICAL_FIELDS = new Set<BrokerExecutionCsvCanonicalField>([
  "symbol", "timestamp", "date", "time", "side", "quantity", "price",
  "status", "orderId", "executionId", "assetType", "description",
  "commission", "fees", "netAmount", "currency",
]);

function normalized(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/gu, "");
}

function validateTimezone(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value });
    return value;
  } catch {
    throw new Error("timestampTimezone must be a valid IANA timezone.");
  }
}

export function validateCsvMappingTemplateInput(input: CsvMappingTemplateInput): CsvMappingTemplateInput {
  const name = input.name.trim();
  if (!name || name.length > 120) throw new Error("template name is required and must be at most 120 characters.");
  if (![",", ";", "\t", "|"].includes(input.delimiter)) throw new Error("delimiter is unsupported.");
  const normalizedHeaders = [...new Set(input.normalizedHeaders.map(normalized).filter(Boolean))];
  if (normalizedHeaders.length === 0 || normalizedHeaders.length > 200) throw new Error("normalizedHeaders must contain between 1 and 200 headers.");
  const headers = new Set(normalizedHeaders);
  const claimed = new Set<string>();
  const columnMapping: BrokerExecutionCsvColumnMapping = {};
  for (const [field, source] of Object.entries(input.columnMapping)) {
    if (!CANONICAL_FIELDS.has(field as BrokerExecutionCsvCanonicalField)) throw new Error(`Unknown canonical field: ${field}.`);
    const values = (Array.isArray(source) ? source : source ? [source] : []).map(normalized).filter(Boolean);
    if (values.length === 0) continue;
    for (const header of values) {
      if (!headers.has(header)) throw new Error(`Mapped header ${header} is not in the header signature.`);
      if (claimed.has(header)) throw new Error(`Header ${header} maps to more than one canonical field.`);
      claimed.add(header);
    }
    columnMapping[field as BrokerExecutionCsvCanonicalField] = values;
  }
  const sideValueMapping: Record<string, "buy" | "sell"> = {};
  for (const [source, side] of Object.entries(input.sideValueMapping)) {
    const key = source.trim().toLowerCase();
    if (!key || key.length > 80 || (side !== "buy" && side !== "sell")) throw new Error("sideValueMapping is malformed.");
    sideValueMapping[key] = side;
  }
  return { ...input, name, normalizedHeaders, columnMapping, sideValueMapping, timestampTimezone: validateTimezone(input.timestampTimezone) };
}

export function listOwnerCsvMappingTemplates(args: { context: OwnerWorkspaceImportContext; repository: SqliteImportCommitRepository }): PersistedCsvMappingTemplate[] {
  return args.repository.listCsvMappingTemplates(args.context.ownerId, args.context.account.id);
}

export function saveOwnerCsvMappingTemplate(args: { context: OwnerWorkspaceImportContext; repository: SqliteImportCommitRepository; input: CsvMappingTemplateInput; templateId?: string }): PersistedCsvMappingTemplate {
  return args.repository.saveCsvMappingTemplate({
    ownerId: args.context.ownerId,
    accountId: args.context.account.id,
    templateId: args.templateId,
    input: validateCsvMappingTemplateInput(args.input),
  });
}

export function deleteOwnerCsvMappingTemplate(args: { context: OwnerWorkspaceImportContext; repository: SqliteImportCommitRepository; templateId: string }): boolean {
  return args.repository.deleteCsvMappingTemplate(args.context.ownerId, args.context.account.id, args.templateId);
}
