import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

import type {
  BrokerExecutionCsvImportIssue,
  BrokerExecutionCsvImportResult,
  BrokerExecutionCsvRowOutcome,
} from "../../execution-sources/csv";

export const IMPORT_REPAIR_RECORD_VERSION =
  "ti_v3_import_repair_record_v2" as const;
const LEGACY_IMPORT_REPAIR_RECORD_VERSION =
  "ti_v3_import_repair_record_v1" as const;

export type ImportRepairRowStatus = "accepted" | "rejected" | "skipped";
export type ImportRepairRowDecision =
  | "needs_attention"
  | "corrected"
  | "kept_as_imported"
  | "excluded";

export type ImportRepairRowValues = Readonly<{
  symbol: string | null;
  timestamp: string | null;
  side: string | null;
  quantity: string | null;
  price: string | null;
  currency: string | null;
  commission: string | null;
  fees: string | null;
  orderId: string | null;
  executionId: string | null;
}>;

export type ImportRepairIssue = Readonly<{
  code: string;
  message: string;
  severity: "error" | "warning";
  field: string | null;
}>;

export type ImportRepairRow = Readonly<{
  sourceRowNumber: string;
  status: ImportRepairRowStatus;
  symbol: string | null;
  timestamp: string | null;
  side: string | null;
  quantity: string | null;
  price: string | null;
  currency: string | null;
  commission: string | null;
  fees: string | null;
  orderId: string | null;
  executionId: string | null;
  issues: readonly ImportRepairIssue[];
  originalValues: ImportRepairRowValues;
  currentValues: ImportRepairRowValues;
  decision: ImportRepairRowDecision;
}>;

export type PersistedImportRepairRecord = Readonly<{
  schemaVersion: typeof IMPORT_REPAIR_RECORD_VERSION;
  canonicalOwnerKey: string;
  canonicalAccountKey: string;
  persistenceDigest: string;
  brokerCode: string;
  originalCsvBase64: string;
  originalCsvDigest: string;
  rows: readonly ImportRepairRow[];
  documentIssues: readonly ImportRepairIssue[];
}>;

function asText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

function issuePacket(issue: BrokerExecutionCsvImportIssue): ImportRepairIssue {
  const field = issue.field ?? null;
  return Object.freeze({
    code: issue.code,
    message: plainLanguageIssueMessage({
      code: issue.code,
      field,
      fallback: issue.message,
    }),
    severity: issue.severity,
    field,
  });
}

function plainLanguageIssueMessage(args: Readonly<{
  code: string;
  field: string | null;
  fallback: string;
}>): string {
  if (args.code === "non_trade_row_skipped") {
    return "This broker row is not a completed stock execution. It remains visible here but is not sent to Trades or Analytics.";
  }
  if (args.code === "non_filled_order_skipped") {
    return "This order was not filled. It remains visible here but is not treated as a trade, and no correction is needed.";
  }
  if (args.code === "options_row_rejected" || args.code === "options_row_skipped") {
    return "This is an options execution. It remains visible here but is not sent through the stock-trade analytics path.";
  }
  if (args.code === "options_row_allowed") {
    return "This is an options execution. Stock-specific results may not apply to it, so review those results with that limitation in mind.";
  }
  if (args.code === "prior_position_close_skipped") {
    return "This row closes shares opened before this statement period. It remains visible here but is not forced into a completed trade without its opening execution.";
  }
  if (args.code === "sell_starting_trade_skipped") {
    return "This sell could not be matched to an earlier buy in this statement period. It remains visible here until an opening position can be verified.";
  }
  if (args.code === "over_reducing_execution_split") {
    return "This execution closed the current position and opened one in the opposite direction. Import Repair split those two effects; no broker value was invented.";
  }
  if (args.code === "trade_grouping_time_gap_split") {
    return "This execution starts a separate trade because of the time gap from the earlier execution. The broker values were not changed.";
  }
  if (args.code === "trade_grouping_session_boundary_split") {
    return "This execution starts a separate trade because it crosses the configured session boundary. The broker values were not changed.";
  }
  const field = args.field?.trim().toLowerCase() ?? "";
  if (field === "timestamp" || field === "date" || field === "time") {
    return "The trade date or time is missing or is not in a format Import Repair can verify. Enter the exact value shown on the broker statement.";
  }
  if (field === "symbol" || field === "instrument") {
    return "The stock symbol is missing or could not be verified. Enter the exact symbol shown on the broker statement.";
  }
  if (field === "side" || field === "direction") {
    return "The row does not clearly say whether this was a buy or sell. Choose the side shown on the broker statement.";
  }
  if (field === "quantity" || field === "shares") {
    return "The share quantity is missing or is not a valid number. Enter the exact quantity shown on the broker statement.";
  }
  if (field === "price") {
    return "The execution price is missing or is not a valid number. Enter the exact price shown on the broker statement.";
  }
  if (field === "currency") {
    return "The trade currency is missing or could not be verified. Enter the currency shown on the broker statement.";
  }
  if (field === "commission" || field === "fees" || field === "charges") {
    return "A commission or fee is not a valid amount. Enter the exact amount shown on the broker statement.";
  }
  if (
    args.code.toLowerCase().includes("duplicate") ||
    args.fallback.toLowerCase().includes("duplicate")
  ) {
    return "This row appears to repeat another execution in the statement. Compare both broker rows before choosing whether to keep or exclude it.";
  }
  return "This broker row could not be verified as imported. Compare it with the statement, correct the values shown here, or exclude the row.";
}

function rowStatus(outcome: BrokerExecutionCsvRowOutcome | undefined): ImportRepairRowStatus {
  return outcome?.status ?? "accepted";
}

function financialIssues(
  execution: BrokerExecutionCsvImportResult["executions"][number] | undefined,
): readonly ImportRepairIssue[] {
  if (
    execution === undefined ||
    execution.commission !== null && execution.commission !== undefined ||
    execution.fees !== null && execution.fees !== undefined
  ) return [];
  return [Object.freeze({
    code: "fees_missing",
    severity: "warning" as const,
    field: "fees",
    message: "This row has no commission or fee amount. Fee-based results will be omitted until you add the amount shown by your broker.",
  })];
}

/**
 * Keeps the broker's row number separate from V3's normalized import row.
 * The record is companion metadata: it never participates in V3 analytics.
 */
export function buildImportRepairRecord(args: Readonly<{
  persistenceDigest: string;
  canonicalOwnerKey: string;
  canonicalAccountKey: string;
  brokerCode: string;
  originalCsvText: string;
  parsed: BrokerExecutionCsvImportResult;
}>): PersistedImportRepairRecord {
  const outcomes = new Map<number, BrokerExecutionCsvRowOutcome>();
  for (const outcome of args.parsed.diagnostics.rowOutcomes) {
    outcomes.set(outcome.rowIndex, outcome);
  }

  const issuesByRow = new Map<number, BrokerExecutionCsvImportIssue[]>();
  const documentIssues: ImportRepairIssue[] = [];
  for (const issue of args.parsed.issues) {
    if (typeof issue.rowIndex !== "number") {
      documentIssues.push(issuePacket(issue));
      continue;
    }
    const current = issuesByRow.get(issue.rowIndex) ?? [];
    current.push(issue);
    issuesByRow.set(issue.rowIndex, current);
  }

  const executionsByRow = new Map<number, (typeof args.parsed.executions)[number]>();
  for (const execution of args.parsed.executions) {
    const row = Number(execution.executionIndex);
    if (Number.isInteger(row) && row > 0) executionsByRow.set(row, execution);
  }

  const rowNumbers = new Set<number>([
    ...outcomes.keys(),
    ...issuesByRow.keys(),
    ...executionsByRow.keys(),
  ]);
  const rows = [...rowNumbers]
    .sort((left, right) => left - right)
    .map((rowNumber) => {
      const execution = executionsByRow.get(rowNumber);
      const outcome = outcomes.get(rowNumber);
      const values = Object.freeze({
        symbol: execution?.symbol ?? outcome?.symbol ?? null,
        timestamp: execution ? asText(execution.timestamp) : null,
        side: execution ? asText(execution.side) : null,
        quantity: execution ? asText(execution.shares) : null,
        price: execution ? asText(execution.price) : null,
        currency: execution?.currency ?? null,
        commission: execution ? asText(execution.commission) : null,
        fees: execution ? asText(execution.fees) : null,
        orderId: execution?.orderId ?? null,
        executionId: execution?.brokerExecutionId ?? null,
      });
      return Object.freeze({
        sourceRowNumber: String(rowNumber),
        status: rowStatus(outcome),
        ...values,
        issues: Object.freeze([
          ...(issuesByRow.get(rowNumber) ?? []).map(issuePacket),
          ...financialIssues(execution),
        ]),
        originalValues: values,
        currentValues: values,
        decision: "needs_attention" as const,
      });
    });

  return Object.freeze({
    schemaVersion: IMPORT_REPAIR_RECORD_VERSION,
    canonicalOwnerKey: args.canonicalOwnerKey,
    canonicalAccountKey: args.canonicalAccountKey,
    persistenceDigest: args.persistenceDigest,
    brokerCode: args.brokerCode,
    originalCsvBase64: Buffer.from(args.originalCsvText, "utf8").toString("base64"),
    originalCsvDigest: createHash("sha256")
      .update(args.originalCsvText, "utf8")
      .digest("hex"),
    rows: Object.freeze(rows),
    documentIssues: Object.freeze(documentIssues),
  });
}

function fileFor(parentPath: string, persistenceDigest: string): string {
  const fileName = createHash("sha256").update(persistenceDigest).digest("hex");
  return join(parentPath, "trader-intelligence-v3-import-repair", `${fileName}.json`);
}

export function writeImportRepairRecord(args: Readonly<{
  parentPath: string;
  record: PersistedImportRepairRecord;
}>): boolean {
  const file = fileFor(args.parentPath, args.record.persistenceDigest);
  const directory = join(args.parentPath, "trader-intelligence-v3-import-repair");
  try {
    mkdirSync(directory, { recursive: true });
    if (existsSync(file)) return true;
    const temporary = `${file}.pending`;
    writeFileSync(temporary, JSON.stringify(args.record), {
      encoding: "utf8",
      flag: "wx",
    });
    renameSync(temporary, file);
    return true;
  } catch {
    return false;
  }
}

export function readImportRepairRecord(args: Readonly<{
  parentPath: string;
  persistenceDigest: string;
}>): PersistedImportRepairRecord | null {
  try {
    const parsed: unknown = JSON.parse(
      readFileSync(fileFor(args.parentPath, args.persistenceDigest), "utf8"),
    );
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      (
        (parsed as { schemaVersion?: unknown }).schemaVersion !==
          IMPORT_REPAIR_RECORD_VERSION &&
        (parsed as { schemaVersion?: unknown }).schemaVersion !==
          LEGACY_IMPORT_REPAIR_RECORD_VERSION
      )
    ) return null;
    return upgradeImportRepairRecord(parsed as PersistedImportRepairRecord);
  } catch {
    return null;
  }
}

export function removeImportRepairRecord(args: Readonly<{
  parentPath: string;
  persistenceDigest: string;
  canonicalOwnerKey: string;
  canonicalAccountKey: string;
}>): boolean {
  const current = readImportRepairRecord(args);
  if (
    current === null ||
    current.canonicalOwnerKey !== args.canonicalOwnerKey ||
    current.canonicalAccountKey !== args.canonicalAccountKey
  ) {
    return false;
  }
  try {
    unlinkSync(fileFor(args.parentPath, args.persistenceDigest));
    return true;
  } catch {
    return false;
  }
}

export function listImportRepairRecords(args: Readonly<{
  parentPath: string;
  canonicalOwnerKey: string;
  canonicalAccountKey: string;
}>): readonly PersistedImportRepairRecord[] {
  const directory = join(args.parentPath, "trader-intelligence-v3-import-repair");
  try {
    return readdirSync(directory)
      .filter((name) => name.endsWith(".json"))
      .flatMap((name) => {
        try {
          const parsed: unknown = JSON.parse(readFileSync(join(directory, name), "utf8"));
          if (
            typeof parsed !== "object" ||
            parsed === null ||
            (
              (parsed as { schemaVersion?: unknown }).schemaVersion !==
                IMPORT_REPAIR_RECORD_VERSION &&
              (parsed as { schemaVersion?: unknown }).schemaVersion !==
                LEGACY_IMPORT_REPAIR_RECORD_VERSION
            ) ||
            (parsed as PersistedImportRepairRecord).canonicalOwnerKey !== args.canonicalOwnerKey ||
            (parsed as PersistedImportRepairRecord).canonicalAccountKey !== args.canonicalAccountKey
          ) return [];
          return [upgradeImportRepairRecord(parsed as PersistedImportRepairRecord)];
        } catch {
          return [];
        }
      })
      .sort((left, right) => right.persistenceDigest.localeCompare(left.persistenceDigest));
  } catch {
    return [];
  }
}

function upgradeImportRepairRecord(
  record: PersistedImportRepairRecord,
): PersistedImportRepairRecord {
  if (record.schemaVersion === IMPORT_REPAIR_RECORD_VERSION) return record;
  return Object.freeze({
    ...record,
    schemaVersion: IMPORT_REPAIR_RECORD_VERSION,
    rows: Object.freeze(record.rows.map((row) => {
      const values = Object.freeze({
        symbol: row.symbol,
        timestamp: row.timestamp,
        side: row.side,
        quantity: row.quantity,
        price: row.price,
        currency: row.currency,
        commission: row.commission,
        fees: row.fees,
        orderId: row.orderId,
        executionId: row.executionId,
      });
      return Object.freeze({
        ...row,
        originalValues: values,
        currentValues: values,
        decision: "needs_attention" as const,
      });
    })),
  });
}
