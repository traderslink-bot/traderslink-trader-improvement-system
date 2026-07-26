import {
  buildCsvDryRunImportExperience,
  buildImportCommitPlan,
  type ImportCommitPlannerAcknowledgements,
  type ImportCommitPlanResult,
  type ImportCommitRepairSource,
} from "../index";
import {
  DEMO_ACCOUNT_ID,
  DEMO_USER_ID,
  DEMO_WORKSPACE_ID,
  SqliteImportCommitRepository,
} from "../product/import-commit/sqlite-import-commit-repository";
import type {
  BrokerExecutionCsvSelection,
  BrokerExecutionCsvColumnMapping,
  BrokerExecutionCsvFormat,
} from "../../execution-sources/csv";
import {
  isImportableBrokerPresetId,
  resolveBrokerExecutionCsvSelection,
} from "../../execution-sources/csv";
import type { OwnerWorkspaceImportContext } from "./owner-workspace-context";

const VALID_BROKERS = new Set<BrokerExecutionCsvFormat>([
  "auto",
  "ibkr_activity_statement",
  "moomoo_trade_history",
  "webull_order_history",
  "robinhood_transaction_history",
  "schwab_transactions",
  "generic_execution_csv",
]);

export interface ImportCommitRequestInput {
  csvText: string;
  broker: BrokerExecutionCsvFormat;
  accountTimezone?: string;
  columnMapping?: BrokerExecutionCsvColumnMapping;
  acknowledgements?: ImportCommitPlannerAcknowledgements;
  repairSource?: ImportCommitRepairSource;
  timestampTimezone?: string;
  optionsHandling?: "reject" | "skip" | "allow";
}

export interface ImportCommitApiPlanResponse {
  contractVersion: "import_commit_api_plan_v1";
  plan: ImportCommitPlanResult;
}

export interface ImportCommitApiError {
  contractVersion: "import_commit_api_error_v1";
  error: {
    code: "invalid_json" | "invalid_request" | "not_found" | "commit_rejected";
    message: string;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseColumnMapping(value: unknown): BrokerExecutionCsvColumnMapping | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!isRecord(value)) {
    throw new Error("columnMapping must be an object.");
  }
  return value as BrokerExecutionCsvColumnMapping;
}

function parseAcknowledgements(
  value: unknown,
): ImportCommitPlannerAcknowledgements | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!isRecord(value)) {
    throw new Error("acknowledgements must be an object.");
  }
  return value as ImportCommitPlannerAcknowledgements;
}

function parseRepairSource(value: unknown): ImportCommitRepairSource | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === "original_csv" || value === "repaired_csv") {
    return value;
  }
  throw new Error("repairSource must be original_csv or repaired_csv.");
}

export function parseImportCommitRequestInput(
  document: unknown,
): ImportCommitRequestInput {
  if (!isRecord(document)) {
    throw new Error("Request body must be an object.");
  }
  if (typeof document.csvText !== "string") {
    throw new Error("csvText is required.");
  }
  if (
    typeof document.broker !== "string" ||
    (!VALID_BROKERS.has(document.broker as BrokerExecutionCsvFormat) &&
      !isImportableBrokerPresetId(document.broker))
  ) {
    throw new Error("broker must be a supported CSV broker id.");
  }
  if (
    document.accountTimezone !== undefined &&
    typeof document.accountTimezone !== "string"
  ) {
    throw new Error("accountTimezone must be a string.");
  }

  const resolvedSelection = resolveBrokerExecutionCsvSelection({
    broker: document.broker as BrokerExecutionCsvSelection,
    columnMapping: parseColumnMapping(document.columnMapping),
  });

  return {
    csvText: document.csvText,
    broker: resolvedSelection.broker,
    accountTimezone: document.accountTimezone as string | undefined,
    columnMapping: resolvedSelection.columnMapping,
    acknowledgements: parseAcknowledgements(document.acknowledgements),
    repairSource: parseRepairSource(document.repairSource),
    timestampTimezone: typeof document.timestampTimezone === "string" ? document.timestampTimezone : undefined,
    optionsHandling: document.optionsHandling === "reject" || document.optionsHandling === "skip" || document.optionsHandling === "allow" ? document.optionsHandling : undefined,
  };
}

export function buildDurableImportCommitPlan(args: {
  input: ImportCommitRequestInput;
  repository: SqliteImportCommitRepository;
  context?: OwnerWorkspaceImportContext;
  batchId?: string;
  generatedAt?: string;
}): ImportCommitPlanResult {
  const account = args.context?.account;
  const accountId = account?.id ?? DEMO_ACCOUNT_ID;
  // Do not replace broker defaults with an otherwise-empty account policy:
  // generic CSV needs its default sell-starting-trade allowance, while IBKR
  // keeps its own long-gap grouping behavior. Account settings only override
  // those defaults when the owner has changed one.
  const tradeGroupingRules =
    account &&
    (account.importDefaults.maxTradeGroupingGapMinutes !== null ||
      !account.importDefaults.splitTradesAtSessionBoundary)
      ? {
          maxGapMinutes:
            account.importDefaults.maxTradeGroupingGapMinutes ?? undefined,
          splitAtSessionBoundary:
            account.importDefaults.splitTradesAtSessionBoundary,
        }
      : undefined;
  const experience = buildCsvDryRunImportExperience({
    csvText: args.input.csvText,
    broker: args.input.broker,
    accountTimezone: args.input.timestampTimezone ?? account?.importDefaults.timestampTimezone ?? args.input.accountTimezone,
    columnMapping: args.input.columnMapping,
    optionsHandling: args.input.optionsHandling ?? account?.importDefaults.optionsHandling,
    tradeGroupingRules,
  });

  return buildImportCommitPlan({
    workspaceId: args.context?.workspaceId ?? DEMO_WORKSPACE_ID,
    userId: args.context?.ownerId ?? DEMO_USER_ID,
    accountId,
    batchId: args.batchId,
    experience,
    generatedAt: args.generatedAt,
    existingFileFingerprints: args.repository.listCommittedFileFingerprints(
      accountId,
    ),
    existingTradeFingerprints: args.repository.listCommittedTradeFingerprints(
      accountId,
    ),
    acknowledgements: args.input.acknowledgements,
    repairSource: args.input.repairSource,
  });
}

export function importCommitErrorResponse(
  status: number,
  code: ImportCommitApiError["error"]["code"],
  message: string,
): Response {
  return Response.json(
    {
      contractVersion: "import_commit_api_error_v1",
      error: { code, message },
    } satisfies ImportCommitApiError,
    { status },
  );
}

export async function readJsonRequest(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON: ${message}`);
  }
}
