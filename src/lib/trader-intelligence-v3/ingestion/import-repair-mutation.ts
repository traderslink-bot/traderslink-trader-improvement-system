import type {
  ImportRepairRow,
  ImportRepairRowValues,
  PersistedImportRepairRecord,
} from "./import-repair-record";
import type { PersistedRawBrokerCsvImport } from "./persisted-raw-broker-csv-import";

export const IMPORT_REPAIR_MUTATION_VERSION =
  "ti_v3_import_repair_mutation_v1" as const;

export type ImportRepairMutationAction =
  | "save_correction"
  | "keep_as_imported"
  | "exclude_row"
  | "reset_to_source";

export type ImportRepairEditableValues = Readonly<{
  timestamp: string | null;
  symbol: string | null;
  side: "buy" | "sell" | null;
  quantity: string | null;
  price: string | null;
  currency: string | null;
  commission: string | null;
  fees: string | null;
  orderId: string | null;
  executionId: string | null;
}>;

export type ImportRepairRowMutation = Readonly<{
  sourceRowNumber: string;
  action: ImportRepairMutationAction;
  values: ImportRepairEditableValues | null;
}>;

export type ImportRepairMutationRequest = Readonly<{
  contractVersion: typeof IMPORT_REPAIR_MUTATION_VERSION;
  persistenceDigest: string;
  rows: readonly ImportRepairRowMutation[];
}>;

export type ImportRepairMutationFailure = Readonly<{
  code:
    | "import_repair_mutation_invalid"
    | "import_repair_statement_mismatch"
    | "import_repair_row_not_found"
    | "import_repair_duplicate_row"
    | "import_repair_value_invalid";
  path: string;
  message: string;
}>;

export type ImportRepairMutationValidation =
  | Readonly<{ ok: true; value: ImportRepairMutationRequest }>
  | Readonly<{ ok: false; error: ImportRepairMutationFailure }>;

export type ImportRepairReplacement = Readonly<{
  normalizedCsv: string;
  rows: readonly ImportRepairRow[];
  chargeCoverageState: "complete" | "unknown";
}>;

const ACTIONS = new Set<ImportRepairMutationAction>([
  "save_correction",
  "keep_as_imported",
  "exclude_row",
  "reset_to_source",
]);

function failure(
  code: ImportRepairMutationFailure["code"],
  path: string,
  message: string,
): ImportRepairMutationValidation {
  return { ok: false, error: { code, path, message } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalText(
  value: unknown,
  maximumLength: number,
): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length <= maximumLength ? trimmed || null : undefined;
}

function exactDecimal(
  value: string | null,
  requirement: "positive" | "signed",
): boolean {
  if (value === null) return true;
  if (!/^-?(?:0|[1-9][0-9]{0,17})(?:\.[0-9]{1,12})?$/.test(value)) {
    return false;
  }
  const number = Number(value);
  return Number.isFinite(number) &&
    (requirement === "positive" ? number > 0 : true);
}

function editableValues(
  value: unknown,
  path: string,
): ImportRepairEditableValues | ImportRepairMutationValidation {
  if (!isRecord(value)) {
    return failure(
      "import_repair_value_invalid",
      path,
      "Enter the broker values for this row.",
    );
  }
  const timestamp = optionalText(value.timestamp, 64);
  const symbol = optionalText(value.symbol, 32);
  const currency = optionalText(value.currency, 3);
  const quantity = optionalText(value.quantity, 32);
  const price = optionalText(value.price, 32);
  const commission = optionalText(value.commission, 32);
  const fees = optionalText(value.fees, 32);
  const orderId = optionalText(value.orderId, 128);
  const executionId = optionalText(value.executionId, 128);
  const side = value.side;
  if (
    timestamp === undefined ||
    symbol === undefined ||
    currency === undefined ||
    quantity === undefined ||
    price === undefined ||
    commission === undefined ||
    fees === undefined ||
    orderId === undefined ||
    executionId === undefined ||
    (side !== "buy" && side !== "sell")
  ) {
    return failure(
      "import_repair_value_invalid",
      path,
      "One or more corrected values are not valid.",
    );
  }
  if (
    timestamp === null ||
    !Number.isFinite(new Date(timestamp).getTime())
  ) {
    return failure(
      "import_repair_value_invalid",
      `${path}.timestamp`,
      "Enter the exact trade date and time shown by the broker.",
    );
  }
  if (
    symbol === null ||
    !/^[A-Z0-9._-]{1,32}$/.test(symbol.toUpperCase())
  ) {
    return failure(
      "import_repair_value_invalid",
      `${path}.symbol`,
      "Enter a valid stock symbol.",
    );
  }
  if (currency === null || !/^[A-Z]{3}$/.test(currency.toUpperCase())) {
    return failure(
      "import_repair_value_invalid",
      `${path}.currency`,
      "Enter the three-letter currency shown by the broker.",
    );
  }
  if (!exactDecimal(quantity, "positive")) {
    return failure(
      "import_repair_value_invalid",
      `${path}.quantity`,
      "Enter a quantity greater than zero.",
    );
  }
  if (!exactDecimal(price, "positive")) {
    return failure(
      "import_repair_value_invalid",
      `${path}.price`,
      "Enter a price greater than zero.",
    );
  }
  if (
    !exactDecimal(commission, "signed") ||
    !exactDecimal(fees, "signed")
  ) {
    return failure(
      "import_repair_value_invalid",
      `${path}.fees`,
      "Enter exact commission and fee amounts, or leave them blank when the broker does not provide them.",
    );
  }
  return Object.freeze({
    timestamp,
    symbol: symbol.toUpperCase(),
    side,
    quantity,
    price,
    currency: currency.toUpperCase(),
    commission,
    fees,
    orderId,
    executionId,
  });
}

export function validateImportRepairMutation(
  value: unknown,
  statement: PersistedImportRepairRecord,
): ImportRepairMutationValidation {
  if (
    !isRecord(value) ||
    value.contractVersion !== IMPORT_REPAIR_MUTATION_VERSION ||
    typeof value.persistenceDigest !== "string" ||
    !Array.isArray(value.rows) ||
    value.rows.length === 0 ||
    value.rows.length > statement.rows.length
  ) {
    return failure(
      "import_repair_mutation_invalid",
      "$",
      "The Import Repair request is not valid.",
    );
  }
  if (value.persistenceDigest !== statement.persistenceDigest) {
    return failure(
      "import_repair_statement_mismatch",
      "$.persistenceDigest",
      "This statement changed. Refresh Import Repair before saving.",
    );
  }
  const sourceRows = new Set(
    statement.rows.map((row) => row.sourceRowNumber),
  );
  const seen = new Set<string>();
  const rows: ImportRepairRowMutation[] = [];
  for (let index = 0; index < value.rows.length; index += 1) {
    const candidate = value.rows[index];
    const path = `$.rows[${index}]`;
    if (
      !isRecord(candidate) ||
      typeof candidate.sourceRowNumber !== "string" ||
      !/^[1-9][0-9]{0,9}$/.test(candidate.sourceRowNumber) ||
      typeof candidate.action !== "string" ||
      !ACTIONS.has(candidate.action as ImportRepairMutationAction)
    ) {
      return failure(
        "import_repair_mutation_invalid",
        path,
        "Choose a valid action for this broker row.",
      );
    }
    if (!sourceRows.has(candidate.sourceRowNumber)) {
      return failure(
        "import_repair_row_not_found",
        `${path}.sourceRowNumber`,
        "This broker row is no longer available. Refresh Import Repair.",
      );
    }
    if (seen.has(candidate.sourceRowNumber)) {
      return failure(
        "import_repair_duplicate_row",
        `${path}.sourceRowNumber`,
        "Each broker row can be changed only once per save.",
      );
    }
    seen.add(candidate.sourceRowNumber);
    const action = candidate.action as ImportRepairMutationAction;
    let values: ImportRepairEditableValues | null = null;
    if (action === "save_correction") {
      const parsed = editableValues(candidate.values, `${path}.values`);
      if ("ok" in parsed) return parsed;
      values = parsed;
    } else if (candidate.values !== null && candidate.values !== undefined) {
      return failure(
        "import_repair_mutation_invalid",
        `${path}.values`,
        "Only a saved correction can include edited values.",
      );
    }
    rows.push(Object.freeze({
      sourceRowNumber: candidate.sourceRowNumber,
      action,
      values,
    }));
  }
  return {
    ok: true,
    value: Object.freeze({
      contractVersion: IMPORT_REPAIR_MUTATION_VERSION,
      persistenceDigest: value.persistenceDigest,
      rows: Object.freeze(rows),
    }),
  };
}

function csvCell(value: string | null): string {
  const text = value ?? "";
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function mutationValues(values: ImportRepairEditableValues): ImportRepairRowValues {
  return Object.freeze({
    symbol: values.symbol,
    timestamp: values.timestamp === null
      ? null
      : new Date(values.timestamp).toISOString(),
    side: values.side,
    quantity: values.quantity,
    price: values.price,
    currency: values.currency,
    commission: values.commission,
    fees: values.fees,
    orderId: values.orderId,
    executionId: values.executionId,
  });
}

export function buildImportRepairReplacement(args: Readonly<{
  source: PersistedRawBrokerCsvImport;
  statement: PersistedImportRepairRecord;
  mutation: ImportRepairMutationRequest;
}>): ImportRepairReplacement {
  const actions = new Map(
    args.mutation.rows.map((row) => [row.sourceRowNumber, row]),
  );
  const accepted = args.source.acceptedExecutions;
  let acceptedIndex = 0;
  const outputValues: ImportRepairRowValues[] = [];
  const rows = args.statement.rows.map((row) => {
    const action = actions.get(row.sourceRowNumber);
    const sourceAccepted = row.status === "accepted"
      ? accepted[acceptedIndex++]
      : undefined;
    const sourceValues: ImportRepairRowValues = sourceAccepted
      ? Object.freeze({
          symbol: sourceAccepted.content.rawBrokerSymbol,
          timestamp: sourceAccepted.content.executedAt,
          side: sourceAccepted.content.side,
          quantity: sourceAccepted.content.quantity,
          price: sourceAccepted.content.price,
          currency: sourceAccepted.content.currency,
          commission: sourceAccepted.content.charges
            .find((charge) => charge.kind === "commission")?.amount ?? null,
          fees: sourceAccepted.content.charges
            .find((charge) => charge.kind === "fee")?.amount ?? null,
          orderId: sourceAccepted.content.orderId,
          executionId: sourceAccepted.content.executionId,
        })
      : row.currentValues;
    const values = action?.action === "save_correction" && action.values
      ? mutationValues(action.values)
      : action?.action === "reset_to_source"
        ? row.originalValues
        : sourceValues;
    const decision = action?.action === "save_correction"
      ? "corrected"
      : action?.action === "keep_as_imported"
        ? "kept_as_imported"
        : action?.action === "exclude_row"
          ? "excluded"
          : action?.action === "reset_to_source"
            ? "needs_attention"
            : row.decision;
    const analyticallyIncluded =
      decision !== "excluded" &&
      (sourceAccepted !== undefined || decision === "corrected");
    if (analyticallyIncluded) outputValues.push(values);
    return Object.freeze({
      ...row,
      ...values,
      currentValues: values,
      decision,
      status: analyticallyIncluded ? "accepted" as const : row.status,
      issues: decision === "corrected" ? Object.freeze([]) : row.issues,
    });
  });
  const header = [
    "symbol", "executedAt", "side", "quantity", "price", "currency",
    "commission", "fees", "orderId", "executionId",
  ];
  const normalizedCsv = [
    header,
    ...outputValues.map((value) => [
      value.symbol, value.timestamp, value.side, value.quantity, value.price,
      value.currency, value.commission, value.fees, value.orderId,
      value.executionId,
    ]),
  ].map((line) => line.map(csvCell).join(",")).join("\r\n");
  return Object.freeze({
    normalizedCsv,
    rows: Object.freeze(rows),
    chargeCoverageState: outputValues.every(
      (value) => value.commission !== null || value.fees !== null,
    ) ? "complete" : "unknown",
  });
}
