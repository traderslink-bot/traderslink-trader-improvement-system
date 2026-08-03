import {
  validateTradeAnalysisRequest,
  type TradeAnalysisRequestIssue,
  type UserTradeAnalysisRequest,
} from "../../trade-analysis/request/trade-analysis-request-contract";
import {
  buildBrokerExecutionCsvFileFingerprint,
  buildTradeAnalysisRequestFingerprint,
} from "../import-fingerprints";
import { buildSessionTimeContextFromExecutions } from "../../raw-trade-timeline/session/classify-session-time";
import type { ProviderExecution } from "../types/provider-execution";
import {
  validateParserHardeningInput,
  type ParserHardeningResult,
} from "../../trader-intelligence-v3/ingestion/parser-hardening";

export type BrokerExecutionCsvFormat =
  | "auto"
  | "ibkr_activity_statement"
  | "moomoo_trade_history"
  | "webull_order_history"
  | "robinhood_transaction_history"
  | "schwab_transactions"
  | "generic_execution_csv";

export type ResolvedBrokerExecutionCsvFormat = Exclude<
  BrokerExecutionCsvFormat,
  "auto"
>;

export type BrokerExecutionCsvImportIssueSeverity = "error" | "warning";

export type BrokerExecutionCsvImportIssueCode =
  | "empty_csv"
  | "missing_header"
  | "auto_detected_format"
  | "auto_detect_low_confidence"
  | "missing_required_column"
  | "non_trade_row_skipped"
  | "non_filled_order_skipped"
  | "row_missing_symbol"
  | "row_missing_timestamp"
  | "row_invalid_timestamp"
  | "row_missing_side"
  | "row_missing_quantity"
  | "row_invalid_quantity"
  | "row_missing_price"
  | "row_invalid_price"
  | "invalid_timestamp_timezone"
  | "options_row_rejected"
  | "options_row_skipped"
  | "options_row_allowed"
  | "over_reducing_execution_split"
  | "trade_grouping_time_gap_split"
  | "trade_grouping_session_boundary_split"
  | "prior_position_close_skipped"
  | "sell_starting_trade_skipped"
  | "duplicate_trade_in_import"
  | "trade_request_validation_error"
  | "trade_request_validation_warning"
  | "parser_duplicate_raw_header"
  | "parser_duplicate_normalized_header"
  | "parser_mapping_collision"
  | "parser_unclosed_quote"
  | "parser_inconsistent_row_width"
  | "parser_unsupported_encoding"
  | "parser_control_character"
  | "parser_oversized_cell"
  | "parser_ambiguous_delimiter"
  | "parser_conflicting_duplicate_execution_id"
  | "parser_payload_oversized";

export interface BrokerExecutionCsvImportIssue {
  severity: BrokerExecutionCsvImportIssueSeverity;
  code: BrokerExecutionCsvImportIssueCode;
  message: string;
  rowIndex?: number;
  field?: string;
  requestIndex?: number;
}

export interface BrokerExecutionCsvImportArgs {
  csvText: string;
  broker: BrokerExecutionCsvFormat;
  defaultSessionBucket?: string;
  sourceLabel?: string;
  timestampTimezone?: string;
  optionsHandling?: BrokerExecutionCsvOptionsHandling;
  columnMapping?: BrokerExecutionCsvColumnMapping;
  tradeGroupingRules?: BrokerExecutionCsvTradeGroupingRules;
}

export type BrokerExecutionCsvOptionsHandling = "reject" | "skip" | "allow";

export interface BrokerExecutionCsvFormatInfo {
  id: ResolvedBrokerExecutionCsvFormat;
  label: string;
  stableHeaderConfidence: "official" | "observed" | "best_effort";
  notes: string[];
}

export interface BrokerExecutionCsvDetectedColumn {
  field: CanonicalCsvField;
  header: string;
  normalizedHeader: string;
}

export type BrokerExecutionCsvRowOutcomeStatus =
  | "accepted"
  | "skipped"
  | "rejected";

export interface BrokerExecutionCsvRowOutcome {
  rowIndex: number;
  status: BrokerExecutionCsvRowOutcomeStatus;
  symbol: string | null;
  issueCodes: BrokerExecutionCsvImportIssueCode[];
}

export interface BrokerExecutionCsvDuplicateRequestFingerprint {
  fingerprint: string;
  requestIndexes: number[];
}

export type BrokerExecutionCsvMappingConfidenceLevel = "high" | "medium" | "low";

export interface BrokerExecutionCsvMappingConfidence {
  level: BrokerExecutionCsvMappingConfidenceLevel;
  score: number;
  detectedColumnCount: number;
  requiredFieldCount: number;
  matchedRequiredFieldCount: number;
  reasons: string[];
}

export type BrokerExecutionCsvTradeGroupingLifecycleStatus =
  | "closed"
  | "open";

export type BrokerExecutionCsvTradeGroupingReason =
  | "flat_position"
  | "end_of_symbol"
  | "over_reduction_split"
  | "time_gap_split"
  | "session_boundary_split";

export type BrokerExecutionCsvColumnMapping = Partial<
  Record<CanonicalCsvField, string | string[]>
>;

export interface BrokerExecutionCsvTradeGroupingRules {
  maxGapMinutes?: number;
  splitAtSessionBoundary?: boolean;
  allowSellStartingTrades?: boolean;
}

export interface BrokerExecutionCsvTradeGroupingDiagnostic {
  requestIndex: number;
  symbol: string;
  tradeDirection: "long" | "short";
  lifecycleStatus: BrokerExecutionCsvTradeGroupingLifecycleStatus;
  groupingReason: BrokerExecutionCsvTradeGroupingReason;
  rowIndexes: number[];
  executionCount: number;
  firstTimestamp: string;
  lastTimestamp: string;
  finalPositionShares: number;
  notes: string[];
}

export interface BrokerExecutionCsvImportDiagnostics {
  requestedBroker: BrokerExecutionCsvFormat;
  resolvedBroker: ResolvedBrokerExecutionCsvFormat;
  fileFingerprint: string;
  delimiter: "," | ";" | "\t" | null;
  timestampTimezone: string;
  optionsHandling: BrokerExecutionCsvOptionsHandling;
  columnMapping: BrokerExecutionCsvColumnMapping;
  tradeGroupingRules: BrokerExecutionCsvTradeGroupingRules;
  headerRowIndex: number | null;
  headerRowNumber: number | null;
  headers: string[];
  detectedColumns: BrokerExecutionCsvDetectedColumn[];
  missingRequiredFields: CanonicalCsvField[];
  rowOutcomes: BrokerExecutionCsvRowOutcome[];
  issueCountsByCode: Partial<Record<BrokerExecutionCsvImportIssueCode, number>>;
  duplicateRequestFingerprints: BrokerExecutionCsvDuplicateRequestFingerprint[];
  mappingConfidence: BrokerExecutionCsvMappingConfidence;
  groupingDiagnostics: BrokerExecutionCsvTradeGroupingDiagnostic[];
  brokerNotes: string[];
}

export interface BrokerExecutionCsvImportResult {
  contractVersion: "broker_execution_csv_import_v1";
  broker: ResolvedBrokerExecutionCsvFormat;
  brokerLabel: string;
  stableHeaderConfidence: BrokerExecutionCsvFormatInfo["stableHeaderConfidence"];
  fileFingerprint: string;
  rowCount: number;
  acceptedExecutionCount: number;
  rejectedRowCount: number;
  skippedRowCount: number;
  requestCount: number;
  requestFingerprints: string[];
  mappingConfidence: BrokerExecutionCsvMappingConfidence;
  groupingDiagnostics: BrokerExecutionCsvTradeGroupingDiagnostic[];
  diagnostics: BrokerExecutionCsvImportDiagnostics;
  issues: BrokerExecutionCsvImportIssue[];
  executions: ProviderExecution[];
  requests: UserTradeAnalysisRequest[];
}

export type BrokerExecutionCsvCanonicalField =
  | "symbol"
  | "timestamp"
  | "date"
  | "time"
  | "side"
  | "quantity"
  | "price"
  | "status"
  | "orderId"
  | "executionId"
  | "assetType"
  | "description"
  | "commission"
  | "fees"
  | "netAmount"
  | "currency";

type CanonicalCsvField = BrokerExecutionCsvCanonicalField;

type HeaderAliasMap = Record<CanonicalCsvField, string[]>;

interface ParsedCsvDocument {
  headerRowIndex: number;
  headers: string[];
  normalizedHeaders: string[];
  delimiter: "," | ";" | "\t";
  rows: Array<Record<string, string>>;
}

interface CsvFormatSpec extends BrokerExecutionCsvFormatInfo {
  aliases: HeaderAliasMap;
  requiredFields: CanonicalCsvField[];
  tradeActionHints?: string[];
}

const EMPTY_ALIASES: HeaderAliasMap = {
  symbol: [],
  timestamp: [],
  date: [],
  time: [],
  side: [],
  quantity: [],
  price: [],
  status: [],
  orderId: [],
  executionId: [],
  assetType: [],
  description: [],
  commission: [],
  fees: [],
  netAmount: [],
  currency: [],
};

const SHARED_ALIASES = {
  symbol: [
    "symbol",
    "ticker",
    "underlyingsymbol",
    "underlyingsymbol",
    "instrument",
    "instrumentcode",
    "security",
    "securitysymbol",
  ],
  timestamp: [
    "datetime",
    "date/time",
    "dateandtime",
    "executiontime",
    "executiondatetime",
    "executiondateandtime",
    "executiondate",
    "filledtime",
    "filltime",
    "filldatetime",
    "filldateandtime",
    "tradetime",
    "tradedatetime",
    "tradedateandtime",
    "transactiondatetime",
    "transactiondateandtime",
    "executedat",
    "executed at",
    "executeddate",
    "executedtime",
    "exectime",
    "exec time",
    "execution timestamp",
    "executiontimestamp",
    "timeplaced",
  ],
  date: [
    "date",
    "tradedate",
    "trade date",
    "executiondate",
    "execution date",
    "executeddate",
    "executed date",
    "filldate",
    "fill date",
    "filleddate",
    "filled date",
    "transactiondate",
    "transaction date",
    "activitydate",
    "activity date",
    "processdate",
    "rundate",
  ],
  time: [
    "time",
    "executiontime",
    "execution time",
    "executedtime",
    "executed time",
    "filledtime",
    "filled time",
    "filltime",
    "fill time",
    "transactiontime",
    "transaction time",
  ],
  side: [
    "side",
    "buysell",
    "buy/sell",
    "buy sell",
    "action",
    "instruction",
    "orderinstruction",
    "order instruction",
    "transactiontype",
    "type",
    "orderaction",
    "tradingaction",
    "tradeaction",
    "trade action",
  ],
  quantity: [
    "quantity",
    "qty",
    "shares",
    "sharequantity",
    "share quantity",
    "filledshares",
    "filled shares",
    "filledqty",
    "filled qty",
    "filledquantity",
    "filled quantity",
    "fillqty",
    "fill qty",
    "fillquantity",
    "fill quantity",
    "executedqty",
    "executed qty",
    "executedquantity",
    "executed quantity",
    "exchangequantity",
    "exchange quantity",
  ],
  price: [
    "price",
    "tradeprice",
    "trade price",
    "tprice",
    "t.price",
    "avgprice",
    "avg price",
    "averageprice",
    "average price",
    "averagefillprice",
    "average fill price",
    "avgfillprice",
    "avg fill price",
    "filledprice",
    "filled price",
    "fillprice",
    "fill price",
    "executedprice",
    "executed price",
    "executionprice",
    "execution price",
    "pricepershare",
    "price per share",
    "price($)",
    "priceusd",
  ],
  status: ["status", "orderstatus", "state"],
  orderId: [
    "orderid",
    "order id",
    "ordernumber",
    "order number",
    "clientorderid",
    "client order id",
    "orderref",
    "order ref",
  ],
  executionId: ["executionid", "execid", "tradeid", "brokerexecutionid"],
  assetType: ["assettype", "securitytype", "product", "instrumenttype"],
  description: ["description", "securitydescription", "name", "instrumentname"],
  commission: [
    "commission",
    "commissions",
    "comm",
    "comm/fee",
    "commfee",
    "comm fee",
    "ibcommission",
    "ib commission",
    "brokerage",
    "commissionfee",
  ],
  fees: [
    "fee",
    "fees",
    "totalfee",
    "totalfees",
    "total fee",
    "total fees",
    "regfee",
    "regfees",
    "secfee",
    "secfees",
    "sec fee",
    "sec fees",
    "taf",
    "taffee",
    "taf fee",
    "clearingfee",
    "clearing fee",
    "ecnfee",
    "ecn fee",
    "regulatoryfee",
    "regulatory fee",
    "feescomm",
    "feesandcomm",
    "feescommission",
  ],
  netAmount: [
    "amount",
    "netamount",
    "net amount",
    "net amt",
    "netproceeds",
    "net proceeds",
    "proceedsnet",
    "proceeds net",
    "cashamount",
    "cash amount",
  ],
  currency: ["currency", "curr", "ccy"],
} satisfies HeaderAliasMap;

function aliases(
  overrides: Partial<Record<CanonicalCsvField, string[]>>,
): HeaderAliasMap {
  const merged = { ...EMPTY_ALIASES };

  for (const field of Object.keys(merged) as CanonicalCsvField[]) {
    merged[field] = [
      ...(SHARED_ALIASES[field] ?? []),
      ...(overrides[field] ?? []),
    ];
  }

  return merged;
}

function normalizeColumnMapping(
  mapping: BrokerExecutionCsvColumnMapping | undefined,
): BrokerExecutionCsvColumnMapping {
  if (!mapping) {
    return {};
  }

  return Object.fromEntries(
    (Object.keys(mapping) as CanonicalCsvField[])
      .map((field) => {
        const value = mapping[field];
        const values = Array.isArray(value) ? value : value ? [value] : [];
        const cleaned = values
          .map((header) => header.trim())
          .filter((header) => header !== "");

        return [field, cleaned];
      })
      .filter(([, values]) => (values as string[]).length > 0),
  ) as BrokerExecutionCsvColumnMapping;
}

function applyColumnMappingToSpec(
  spec: CsvFormatSpec,
  columnMapping: BrokerExecutionCsvColumnMapping,
): CsvFormatSpec {
  const mappedAliases = { ...spec.aliases };

  for (const field of Object.keys(mappedAliases) as CanonicalCsvField[]) {
    const value = columnMapping[field];
    const values = Array.isArray(value) ? value : value ? [value] : [];

    mappedAliases[field] = [...values, ...mappedAliases[field]];
  }

  return {
    ...spec,
    aliases: mappedAliases,
  };
}

export const BROKER_EXECUTION_CSV_FORMATS: Record<
  ResolvedBrokerExecutionCsvFormat,
  CsvFormatSpec
> = {
  ibkr_activity_statement: {
    id: "ibkr_activity_statement",
    label: "Interactive Brokers Activity Statement / Flex Trades CSV",
    stableHeaderConfidence: "official",
    requiredFields: ["symbol", "quantity", "price"],
    tradeActionHints: ["buy", "sell", "bot", "sld"],
    notes: [
      "IBKR activity statement trades include symbol, trade date/date-time, quantity, and price fields.",
      "IBKR trade confirmation flex exports may use Buy/Sell and TradePrice style headers.",
    ],
    aliases: aliases({
      timestamp: ["trade date", "tradedate", "date/time", "datetime"],
      side: ["buy/sell", "buysell", "action"],
      quantity: ["quantity", "qty"],
      price: ["price", "trade price", "tradeprice", "t price", "tprice"],
      executionId: ["tradeid", "trade id", "ibexecid"],
      commission: ["ibcommission", "commission"],
      fees: ["ibfee", "fee", "fees"],
      currency: ["currency"],
    }),
  },
  moomoo_trade_history: {
    id: "moomoo_trade_history",
    label: "Moomoo Trade History CSV",
    stableHeaderConfidence: "observed",
    requiredFields: ["symbol", "quantity", "price"],
    tradeActionHints: ["buy", "sell"],
    notes: [
      "Moomoo order history is accessible from account/trade history screens; exact CSV headers can vary by region.",
      "The parser accepts common Moomoo import headers plus a generic Date, Symbol, Side, Quantity, Price shape.",
    ],
    aliases: aliases({
      symbol: ["code", "stockcode", "instrument code", "instrumentcode"],
      timestamp: ["createdtime", "dealtime", "filledtime", "tradedatetime"],
      date: ["dateoftrade", "trade date", "tradedate", "orderdate"],
      side: ["transactiontype", "direction", "tradingaction"],
      quantity: ["filledqty", "filled quantity", "shares"],
      price: ["pricepershare", "average price", "averageprice", "avgprice"],
      fees: ["fee", "fees", "commission"],
      currency: ["currency"],
    }),
  },
  webull_order_history: {
    id: "webull_order_history",
    label: "Webull Order History CSV",
    stableHeaderConfidence: "official",
    requiredFields: ["symbol", "quantity", "price"],
    tradeActionHints: ["buy", "sell"],
    notes: [
      "Webull exports order history CSV files that may include filled, partially filled, pending, working, cancelled, and failed orders.",
      "The parser skips non-filled rows when a status column is present.",
    ],
    aliases: aliases({
      timestamp: ["filledtime", "filled time", "timefilled", "updatedtime"],
      side: ["side", "action"],
      quantity: ["filledqty", "filled qty", "filledquantity"],
      price: ["avgprice", "avg price", "filledprice", "filled price"],
      status: ["status", "orderstatus", "order status"],
      fees: ["fees", "fee", "commission"],
    }),
  },
  robinhood_transaction_history: {
    id: "robinhood_transaction_history",
    label: "Robinhood Transaction History CSV",
    stableHeaderConfidence: "official",
    requiredFields: ["symbol", "quantity", "price"],
    tradeActionHints: ["buy", "sell"],
    notes: [
      "Robinhood transaction history reports include transaction date/time, transaction type, symbol/amount/price details, and fees where applicable.",
      "The parser accepts common Account Activity and transaction-history field variants.",
    ],
    aliases: aliases({
      timestamp: ["transactiondatetime", "transaction date/time", "date/time"],
      date: ["activitydate", "transactiondate", "date"],
      side: ["type", "transactiontype", "action"],
      quantity: ["quantity", "shares", "amount"],
      price: ["price", "averageprice", "average price", "pricepershare"],
      fees: ["fees", "fee"],
      netAmount: ["amount", "netamount"],
    }),
  },
  schwab_transactions: {
    id: "schwab_transactions",
    label: "Charles Schwab Transactions CSV",
    stableHeaderConfidence: "official",
    requiredFields: ["date", "side", "symbol", "quantity", "price"],
    tradeActionHints: ["buy", "sell", "sell short"],
    notes: [
      "Schwab transaction history can be exported to CSV and includes Date, Action, Quantity, Symbol, Description, and Price fields.",
      "Schwab rows without trade actions are skipped.",
    ],
    aliases: aliases({
      date: ["date"],
      side: ["action"],
      quantity: ["quantity"],
      price: ["price"],
      fees: ["fees & comm", "feescomm", "fees and comm"],
      netAmount: ["amount"],
      orderId: ["id", "transactionid"],
    }),
  },
  generic_execution_csv: {
    id: "generic_execution_csv",
    label: "Generic Execution CSV",
    stableHeaderConfidence: "best_effort",
    requiredFields: ["symbol", "quantity", "price"],
    tradeActionHints: ["buy", "sell"],
    notes: [
      "Generic imports accept Date/Time or Date plus Time, Symbol/Ticker, Side/Action, Quantity/Shares, and Price/Average Price.",
      "Use this for broker exports that can be mapped into a plain execution ledger.",
    ],
    aliases: aliases({}),
  },
};

function pushIssue(
  issues: BrokerExecutionCsvImportIssue[],
  issue: BrokerExecutionCsvImportIssue,
): void {
  issues.push(issue);
}

function normalizeHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[$#]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function countDelimiterOutsideQuotes(line: string, delimiter: "," | ";" | "\t"): number {
  let count = 0;
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      count += 1;
    }
  }

  return count;
}

function detectCsvDelimiter(csvText: string): "," | ";" | "\t" {
  const physicalLines = csvText
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== "")
    .slice(0, 8);
  const candidates = [",", "\t", ";"] as const;
  const scores = candidates.map((delimiter) => ({
    delimiter,
    score: physicalLines.reduce(
      (total, line) => total + countDelimiterOutsideQuotes(line, delimiter),
      0,
    ),
  }));
  const best = scores.sort((left, right) => right.score - left.score)[0];

  return best && best.score > 0 ? best.delimiter : ",";
}

function parseCsvRows(csvText: string, delimiter = detectCsvDelimiter(csvText)): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const next = csvText[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        currentCell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += char;
  }

  currentRow.push(currentCell);
  rows.push(currentRow);

  return rows.filter((row) =>
    row.some((cell) => cell.replace(/^\uFEFF/, "").trim() !== ""),
  );
}

function rowContainsAnyAlias(
  row: string[],
  field: CanonicalCsvField,
  columnMapping: BrokerExecutionCsvColumnMapping,
): boolean {
  const normalizedCells = row.map(normalizeHeader);
  const mapped = columnMapping[field];
  const mappedHeaders = Array.isArray(mapped) ? mapped : mapped ? [mapped] : [];

  return hasHeader(normalizedCells, [
    ...mappedHeaders,
    ...SHARED_ALIASES[field],
  ]);
}

function findHeaderRowIndex(
  rows: string[][],
  columnMapping: BrokerExecutionCsvColumnMapping,
): number {
  const candidateIndex = rows.findIndex((row) => {
    const hasSymbol = rowContainsAnyAlias(row, "symbol", columnMapping);
    const hasQuantity = rowContainsAnyAlias(row, "quantity", columnMapping);
    const hasPrice = rowContainsAnyAlias(row, "price", columnMapping);
    const hasSideOrTime =
      rowContainsAnyAlias(row, "side", columnMapping) ||
      rowContainsAnyAlias(row, "timestamp", columnMapping) ||
      rowContainsAnyAlias(row, "date", columnMapping);

    return hasSymbol && hasQuantity && hasPrice && hasSideOrTime;
  });

  return candidateIndex === -1 ? 0 : candidateIndex;
}

function parseCsvDocument(
  csvText: string,
  issues: BrokerExecutionCsvImportIssue[],
  columnMapping: BrokerExecutionCsvColumnMapping,
  hardening: ParserHardeningResult,
): ParsedCsvDocument | null {
  if (csvText.trim() === "") {
    pushIssue(issues, {
      severity: "error",
      code: "empty_csv",
      message: "CSV text is empty.",
    });
    return null;
  }

  if (!hardening.ok) {
    for (const issue of hardening.issues) {
      pushIssue(issues, {
        severity: "error",
        code: issue.code.replace(/^ti_v3_/, "") as BrokerExecutionCsvImportIssueCode,
        message: `CSV input failed closed with ${issue.code}.`,
        rowIndex: issue.rowIndex,
        field: issue.field,
      });
    }
    return null;
  }

  const delimiter = detectCsvDelimiter(csvText);
  const rows = parseCsvRows(csvText, delimiter);

  if (rows.length === 0) {
    pushIssue(issues, {
      severity: "error",
      code: "empty_csv",
      message: "CSV text does not contain rows.",
    });
    return null;
  }

  const headerRowIndex = findHeaderRowIndex(rows, columnMapping);
  const headers = rows[headerRowIndex].map((header) => header.trim());
  const normalizedHeaders = headers.map(normalizeHeader);

  if (headers.length === 0 || normalizedHeaders.every((header) => header === "")) {
    pushIssue(issues, {
      severity: "error",
      code: "missing_header",
      message: "CSV is missing a header row.",
    });
    return null;
  }

  const dataRows = rows.slice(headerRowIndex + 1).map((row) => {
    const record: Record<string, string> = {};

    headers.forEach((header, index) => {
      record[normalizeHeader(header)] = row[index]?.trim() ?? "";
    });

    return record;
  });

  return {
    headerRowIndex,
    headers,
    normalizedHeaders,
    delimiter,
    rows: dataRows,
  };
}

function hasHeader(
  normalizedHeaders: string[],
  aliasesForField: string[],
): boolean {
  const normalizedAliases = new Set(aliasesForField.map(normalizeHeader));

  return normalizedHeaders.some((header) => normalizedAliases.has(header));
}

function hasAnyHeader(
  normalizedHeaders: string[],
  candidates: string[],
): boolean {
  return hasHeader(normalizedHeaders, candidates);
}

function resolveFormat(
  requested: BrokerExecutionCsvFormat,
  document: ParsedCsvDocument,
  issues: BrokerExecutionCsvImportIssue[],
): ResolvedBrokerExecutionCsvFormat {
  if (requested !== "auto") {
    return requested;
  }

  const headers = document.normalizedHeaders;

  let resolved: ResolvedBrokerExecutionCsvFormat | null = null;

  if (
    hasAnyHeader(headers, ["filled qty", "filledqty"]) &&
    hasAnyHeader(headers, ["avg price", "avgprice", "filled price"])
  ) {
    resolved = "webull_order_history";
  } else if (
    hasAnyHeader(headers, ["t. price", "tprice", "trade price", "tradeprice"]) &&
    hasAnyHeader(headers, ["trade id", "tradeid", "date/time"])
  ) {
    resolved = "ibkr_activity_statement";
  } else if (
    hasAnyHeader(headers, ["instrument code", "instrumentcode", "date of trade"]) ||
    hasAnyHeader(headers, ["filled quantity"])
  ) {
    resolved = "moomoo_trade_history";
  } else if (
    hasAnyHeader(headers, ["activity date", "activitydate"]) ||
    (hasAnyHeader(headers, ["transaction type", "transactiontype"]) &&
      hasAnyHeader(headers, ["average price", "averageprice"]))
  ) {
    resolved = "robinhood_transaction_history";
  } else if (
    hasAnyHeader(headers, ["fees & comm", "feescomm"]) &&
    hasAnyHeader(headers, ["amount"]) &&
    hasAnyHeader(headers, ["action"])
  ) {
    resolved = "schwab_transactions";
  }

  if (resolved) {
    pushIssue(issues, {
      severity: "warning",
      code: "auto_detected_format",
      message: `Detected ${BROKER_EXECUTION_CSV_FORMATS[resolved].label}.`,
    });

    return resolved;
  }

  const scores = Object.values(BROKER_EXECUTION_CSV_FORMATS)
    .filter((spec) => spec.id !== "generic_execution_csv")
    .map((spec) => {
      const matches = (Object.keys(spec.aliases) as CanonicalCsvField[]).filter(
        (field) => hasHeader(document.normalizedHeaders, spec.aliases[field]),
      );

      const requiredMatches = spec.requiredFields.filter((field) =>
        hasHeader(document.normalizedHeaders, spec.aliases[field]),
      );

      return {
        id: spec.id,
        score: matches.length + requiredMatches.length * 3,
        requiredMatches: requiredMatches.length,
      };
    })
    .sort((left, right) => right.score - left.score);

  const best = scores[0];
  resolved =
    best && best.requiredMatches >= 3 && best.score >= 12
      ? best.id
      : "generic_execution_csv";

  pushIssue(issues, {
    severity: resolved === "generic_execution_csv" ? "warning" : "warning",
    code:
      resolved === "generic_execution_csv"
        ? "auto_detect_low_confidence"
        : "auto_detected_format",
    message:
      resolved === "generic_execution_csv"
        ? "Broker format could not be confidently detected; using the generic execution CSV mapper."
        : `Detected ${BROKER_EXECUTION_CSV_FORMATS[resolved].label}.`,
  });

  return resolved;
}

function missingRequiredFields(
  spec: CsvFormatSpec,
  headers: string[],
): CanonicalCsvField[] {
  return spec.requiredFields.filter(
    (field) => !hasHeader(headers, spec.aliases[field]),
  );
}

function matchedHeaderForField(
  document: ParsedCsvDocument,
  spec: CsvFormatSpec,
  field: CanonicalCsvField,
): BrokerExecutionCsvDetectedColumn | null {
  const aliasesForField = new Set(spec.aliases[field].map(normalizeHeader));
  const headerIndex = document.normalizedHeaders.findIndex((header) =>
    aliasesForField.has(header),
  );

  if (headerIndex === -1) {
    return null;
  }

  return {
    field,
    header: document.headers[headerIndex],
    normalizedHeader: document.normalizedHeaders[headerIndex],
  };
}

function buildDetectedColumns(
  document: ParsedCsvDocument,
  spec: CsvFormatSpec,
): BrokerExecutionCsvDetectedColumn[] {
  return (Object.keys(spec.aliases) as CanonicalCsvField[])
    .map((field) => matchedHeaderForField(document, spec, field))
    .filter(
      (column): column is BrokerExecutionCsvDetectedColumn => column !== null,
    );
}

function buildIssueCountsByCode(
  issues: BrokerExecutionCsvImportIssue[],
): Partial<Record<BrokerExecutionCsvImportIssueCode, number>> {
  return issues.reduce<Partial<Record<BrokerExecutionCsvImportIssueCode, number>>>(
    (counts, issue) => {
      counts[issue.code] = (counts[issue.code] ?? 0) + 1;
      return counts;
    },
    {},
  );
}

function issueCountsAgainstMappingConfidence(
  issue: BrokerExecutionCsvImportIssue,
): boolean {
  if (issue.severity !== "warning") {
    return false;
  }

  return (
    issue.code !== "auto_detected_format" &&
    issue.code !== "non_trade_row_skipped" &&
    issue.code !== "non_filled_order_skipped" &&
    issue.code !== "trade_grouping_time_gap_split" &&
    issue.code !== "trade_grouping_session_boundary_split" &&
    issue.code !== "trade_request_validation_warning"
  );
}

function duplicateRequestFingerprints(
  requestFingerprints: string[],
): BrokerExecutionCsvDuplicateRequestFingerprint[] {
  const indexesByFingerprint = new Map<string, number[]>();

  requestFingerprints.forEach((fingerprint, requestIndex) => {
    const indexes = indexesByFingerprint.get(fingerprint) ?? [];
    indexes.push(requestIndex);
    indexesByFingerprint.set(fingerprint, indexes);
  });

  return [...indexesByFingerprint.entries()]
    .filter(([, requestIndexes]) => requestIndexes.length > 1)
    .map(([fingerprint, requestIndexes]) => ({
      fingerprint,
      requestIndexes,
    }));
}

function buildMappingConfidence(args: {
  requestedBroker: BrokerExecutionCsvFormat;
  resolvedBroker: ResolvedBrokerExecutionCsvFormat;
  spec: CsvFormatSpec;
  document: ParsedCsvDocument | null;
  missingRequiredFields: CanonicalCsvField[];
  rowOutcomes: BrokerExecutionCsvRowOutcome[];
  issues: BrokerExecutionCsvImportIssue[];
}): BrokerExecutionCsvMappingConfidence {
  const detectedColumns = args.document
    ? buildDetectedColumns(args.document, args.spec)
    : [];
  const matchedRequiredFieldCount = args.spec.requiredFields.length -
    args.missingRequiredFields.length;
  const rowCount = args.rowOutcomes.length;
  const rejectedCount = args.rowOutcomes.filter(
    (outcome) => outcome.status === "rejected",
  ).length;
  const warningCount = args.issues.filter(issueCountsAgainstMappingConfidence)
    .length;
  const reasons: string[] = [];
  let score =
    args.spec.stableHeaderConfidence === "official"
      ? 50
      : args.spec.stableHeaderConfidence === "observed"
        ? 40
        : 28;

  score += Math.min(25, detectedColumns.length * 3);
  score += matchedRequiredFieldCount === args.spec.requiredFields.length ? 20 : 0;
  score += args.requestedBroker !== "auto" ? 5 : 0;
  score -= args.missingRequiredFields.length * 25;
  score -= rowCount > 0 ? Math.round((rejectedCount / rowCount) * 30) : 0;
  score -= Math.min(15, warningCount * 2);
  score = Math.max(0, Math.min(100, score));

  if (args.spec.stableHeaderConfidence === "official") {
    reasons.push("Broker format is backed by official export documentation.");
  } else if (args.spec.stableHeaderConfidence === "observed") {
    reasons.push("Broker format is based on observed public import/export guidance.");
  } else {
    reasons.push("Generic mapping is best effort and should be reviewed.");
  }

  if (args.missingRequiredFields.length > 0) {
    reasons.push(
      `Missing required fields: ${args.missingRequiredFields.join(", ")}.`,
    );
  } else {
    reasons.push("All required execution fields were detected.");
  }

  if (rejectedCount > 0) {
    reasons.push(`${rejectedCount} row(s) were rejected.`);
  }

  if (warningCount > 0) {
    reasons.push(`${warningCount} warning(s) need review.`);
  }

  return {
    level: score >= 80 ? "high" : score >= 55 ? "medium" : "low",
    score,
    detectedColumnCount: detectedColumns.length,
    requiredFieldCount: args.spec.requiredFields.length,
    matchedRequiredFieldCount,
    reasons,
  };
}

function buildDiagnostics(args: {
  requestedBroker: BrokerExecutionCsvFormat;
  resolvedBroker: ResolvedBrokerExecutionCsvFormat;
  fileFingerprint: string;
  timestampTimezone: string;
  optionsHandling: BrokerExecutionCsvOptionsHandling;
  columnMapping: BrokerExecutionCsvColumnMapping;
  tradeGroupingRules: BrokerExecutionCsvTradeGroupingRules;
  document: ParsedCsvDocument | null;
  spec: CsvFormatSpec;
  missingRequiredFields: CanonicalCsvField[];
  rowOutcomes: BrokerExecutionCsvRowOutcome[];
  requestFingerprints: string[];
  groupingDiagnostics: BrokerExecutionCsvTradeGroupingDiagnostic[];
  issues: BrokerExecutionCsvImportIssue[];
}): BrokerExecutionCsvImportDiagnostics {
  const mappingConfidence = buildMappingConfidence({
    requestedBroker: args.requestedBroker,
    resolvedBroker: args.resolvedBroker,
    spec: args.spec,
    document: args.document,
    missingRequiredFields: args.missingRequiredFields,
    rowOutcomes: args.rowOutcomes,
    issues: args.issues,
  });

  return {
    requestedBroker: args.requestedBroker,
    resolvedBroker: args.resolvedBroker,
    fileFingerprint: args.fileFingerprint,
    delimiter: args.document?.delimiter ?? null,
    timestampTimezone: args.timestampTimezone,
    optionsHandling: args.optionsHandling,
    columnMapping: args.columnMapping,
    tradeGroupingRules: args.tradeGroupingRules,
    headerRowIndex: args.document?.headerRowIndex ?? null,
    headerRowNumber:
      args.document?.headerRowIndex === undefined
        ? null
        : args.document.headerRowIndex + 1,
    headers: args.document?.headers ?? [],
    detectedColumns: args.document
      ? buildDetectedColumns(args.document, args.spec)
      : [],
    missingRequiredFields: args.missingRequiredFields,
    rowOutcomes: args.rowOutcomes,
    issueCountsByCode: buildIssueCountsByCode(args.issues),
    duplicateRequestFingerprints: duplicateRequestFingerprints(
      args.requestFingerprints,
    ),
    mappingConfidence,
    groupingDiagnostics: args.groupingDiagnostics,
    brokerNotes: args.spec.notes,
  };
}

function valueForField(
  row: Record<string, string>,
  spec: CsvFormatSpec,
  field: CanonicalCsvField,
): string | null {
  for (const alias of spec.aliases[field]) {
    const value = row[normalizeHeader(alias)];

    if (value !== undefined && value.trim() !== "") {
      return value.trim();
    }
  }

  return null;
}

function valuesForField(
  row: Record<string, string>,
  spec: CsvFormatSpec,
  field: CanonicalCsvField,
): string[] {
  const values: string[] = [];
  const seenHeaders = new Set<string>();

  for (const alias of spec.aliases[field]) {
    const normalized = normalizeHeader(alias);

    if (seenHeaders.has(normalized)) {
      continue;
    }

    seenHeaders.add(normalized);
    const value = row[normalized];

    if (value !== undefined && value.trim() !== "") {
      values.push(value.trim());
    }
  }

  return values;
}

function parseNumeric(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  const negative = /^\(.*\)$/.test(trimmed);
  const normalized = trimmed
    .replace(/[,$%]/g, "")
    .replace(/[()]/g, "")
    .replace(/\s+/g, "");
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return negative ? -parsed : parsed;
}

function parseNumericSum(values: string[]): number | null {
  const parsedValues = values
    .map((value) => parseNumeric(value))
    .filter((value): value is number => value !== null);

  if (parsedValues.length === 0) {
    return null;
  }

  return parsedValues.reduce((total, value) => total + value, 0);
}

function normalizeTimestampTimezone(
  value: string | undefined,
  issues: BrokerExecutionCsvImportIssue[],
): string {
  const timezone = value?.trim() || "America/New_York";

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
    return timezone;
  } catch {
    pushIssue(issues, {
      severity: "warning",
      code: "invalid_timestamp_timezone",
      message: `Timestamp timezone ${timezone} is not supported by this runtime; using UTC for this import.`,
    });
    return "UTC";
  }
}

function timeZoneOffsetMillis(date: Date, timeZone: string): number {
  if (timeZone === "UTC") {
    return 0;
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  const year = Number(values.get("year"));
  const month = Number(values.get("month"));
  const day = Number(values.get("day"));
  const hour = Number(values.get("hour")) % 24;
  const minute = Number(values.get("minute"));
  const second = Number(values.get("second"));
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);

  return localAsUtc - date.getTime();
}

function dateTimePartsToIso(
  parts: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  },
  timeZone: string,
): string {
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  const firstOffset = timeZoneOffsetMillis(new Date(localAsUtc), timeZone);
  const firstUtc = localAsUtc - firstOffset;
  const secondOffset = timeZoneOffsetMillis(new Date(firstUtc), timeZone);
  const finalUtc = localAsUtc - secondOffset;

  return new Date(finalUtc).toISOString();
}

function normalizeSymbol(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const symbol = value.trim().toUpperCase();

  return /^[A-Z0-9._-]{1,24}$/.test(symbol) ? symbol : null;
}

function parseDateParts(value: string): { year: number; month: number; day: number } | null {
  const trimmed = value.trim();
  let match = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(trimmed);

  if (match) {
    return {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
    };
  }

  match = /^(\d{8})$/.exec(trimmed);

  if (match) {
    return {
      year: Number(trimmed.slice(0, 4)),
      month: Number(trimmed.slice(4, 6)),
      day: Number(trimmed.slice(6, 8)),
    };
  }

  match = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(trimmed);

  if (match) {
    const rawYear = Number(match[3]);

    return {
      year: rawYear < 100 ? 2000 + rawYear : rawYear,
      month: Number(match[1]),
      day: Number(match[2]),
    };
  }

  return null;
}

function parseTimeParts(
  value: string | null,
): { hour: number; minute: number; second: number } | null {
  if (!value || value.trim() === "") {
    return { hour: 0, minute: 0, second: 0 };
  }

  const trimmed = value.trim();
  let match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i.exec(trimmed);

  if (match) {
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const second = Number(match[3] ?? 0);
    const meridiem = match[4]?.toUpperCase();

    if (meridiem === "PM" && hour < 12) {
      hour += 12;
    }

    if (meridiem === "AM" && hour === 12) {
      hour = 0;
    }

    return { hour, minute, second };
  }

  match = /^(\d{2})(\d{2})(\d{2})$/.exec(trimmed);

  if (match) {
    return {
      hour: Number(match[1]),
      minute: Number(match[2]),
      second: Number(match[3]),
    };
  }

  return null;
}

function isValidDateTimeParts(parts: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}): boolean {
  const date = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second),
  );

  return (
    date.getUTCFullYear() === parts.year &&
    date.getUTCMonth() === parts.month - 1 &&
    date.getUTCDate() === parts.day &&
    date.getUTCHours() === parts.hour &&
    date.getUTCMinutes() === parts.minute &&
    date.getUTCSeconds() === parts.second
  );
}

function parseTimestamp(
  timestamp: string | null,
  date: string | null,
  time: string | null,
  timeZone: string,
): string | null {
  const rawTimestamp = timestamp?.trim() ?? "";
  const compactIbkrMatch = /^(\d{8})[;\sT]+(\d{6})$/.exec(rawTimestamp);

  if (compactIbkrMatch) {
    const dateParts = parseDateParts(compactIbkrMatch[1]);
    const timeParts = parseTimeParts(compactIbkrMatch[2]);

    if (dateParts && timeParts) {
      const parts = { ...dateParts, ...timeParts };

      if (isValidDateTimeParts(parts)) {
        return dateTimePartsToIso(parts, timeZone);
      }
    }
  }

  const splitTimestampMatch =
    /^(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(.+)$/.exec(
      rawTimestamp,
    );

  if (splitTimestampMatch) {
    const dateParts = parseDateParts(splitTimestampMatch[1]);
    const timeParts = parseTimeParts(splitTimestampMatch[2]);

    if (dateParts && timeParts) {
      const parts = { ...dateParts, ...timeParts };

      if (isValidDateTimeParts(parts)) {
        return dateTimePartsToIso(parts, timeZone);
      }
    }
  }

  const dateParts = parseDateParts(date ?? rawTimestamp);
  const timeParts = parseTimeParts(time);

  if (dateParts && timeParts) {
    const parts = { ...dateParts, ...timeParts };

    if (isValidDateTimeParts(parts)) {
      return dateTimePartsToIso(parts, timeZone);
    }
  }

  if (rawTimestamp !== "") {
    const parsed = Date.parse(rawTimestamp);

    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }

  return null;
}

function normalizeSide(rawSide: string | null, quantity: number | null): "buy" | "sell" | null {
  const value = rawSide?.trim().toLowerCase() ?? "";

  if (
    /\bbuy\b/.test(value) ||
    /\bbot\b/.test(value) ||
    value === "b" ||
    value === "bto" ||
    value === "btc" ||
    value.includes("cover") ||
    value.includes("bought")
  ) {
    return "buy";
  }

  if (
    /\bsell\b/.test(value) ||
    /\bsold\b/.test(value) ||
    /\bsld\b/.test(value) ||
    /\bshort\b/.test(value) ||
    value === "s" ||
    value === "sto" ||
    value === "stc"
  ) {
    return "sell";
  }

  if (quantity !== null && quantity !== 0) {
    return quantity > 0 ? "buy" : "sell";
  }

  return null;
}

function rowLooksLikeTrade(
  row: Record<string, string>,
  spec: CsvFormatSpec,
): boolean {
  const rawSide = valueForField(row, spec, "side")?.toLowerCase() ?? "";
  const rawAssetType = valueForField(row, spec, "assetType")?.toLowerCase() ?? "";
  const rawDescription =
    valueForField(row, spec, "description")?.toLowerCase() ?? "";
  const hasExecutionCore =
    valueForField(row, spec, "symbol") !== null &&
    valueForField(row, spec, "quantity") !== null &&
    valueForField(row, spec, "price") !== null;
  const hints = spec.tradeActionHints ?? ["buy", "sell"];
  const text = `${rawSide} ${rawAssetType} ${rawDescription}`;

  if (
    text.includes("dividend") ||
    text.includes("deposit") ||
    text.includes("withdraw") ||
    text.includes("transfer") ||
    text.includes("interest") ||
    text.includes("fee")
  ) {
    return false;
  }

  if (hasExecutionCore && rawSide === "") {
    return true;
  }

  if (hasExecutionCore && normalizeSide(rawSide, null)) {
    return true;
  }

  return hints.some((hint) => text.includes(hint));
}

function hasCsvColumn(
  row: Record<string, string>,
  header: string,
): boolean {
  return Object.prototype.hasOwnProperty.call(row, normalizeHeader(header));
}

function csvColumnValue(
  row: Record<string, string>,
  header: string,
): string {
  return row[normalizeHeader(header)]?.trim().toLowerCase() ?? "";
}

function csvColumnRawValue(
  row: Record<string, string>,
  header: string,
): string {
  return row[normalizeHeader(header)]?.trim() ?? "";
}

function ibkrPositionEffect(
  row: Record<string, string>,
  spec: CsvFormatSpec,
): ProviderExecution["positionEffect"] {
  if (spec.id !== "ibkr_activity_statement" || !hasCsvColumn(row, "Code")) {
    return undefined;
  }

  const codes = csvColumnRawValue(row, "Code")
    .split(";")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);
  const opens = codes.includes("O");
  const closes = codes.includes("C");

  if (opens && closes) {
    return "mixed";
  }

  if (opens) {
    return "opening";
  }

  if (closes) {
    return "closing";
  }

  return codes.length > 0 ? "unknown" : undefined;
}

function rowIsIbkrActivityStatementStockOrder(
  row: Record<string, string>,
  spec: CsvFormatSpec,
): boolean | null {
  if (spec.id !== "ibkr_activity_statement") {
    return null;
  }

  const hasIbkrStatementMarkers =
    hasCsvColumn(row, "Trades") &&
    hasCsvColumn(row, "Header") &&
    hasCsvColumn(row, "Asset Category");

  if (!hasIbkrStatementMarkers) {
    return null;
  }

  const section = csvColumnValue(row, "Trades");
  const rowKind = csvColumnValue(row, "Header");
  const assetCategory = csvColumnValue(row, "Asset Category");

  if (section !== "trades" || rowKind !== "data" || assetCategory !== "stocks") {
    return false;
  }

  if (
    hasCsvColumn(row, "DataDiscriminator") &&
    csvColumnValue(row, "DataDiscriminator") !== "order"
  ) {
    return false;
  }

  return true;
}

function rowIsFilledOrder(
  row: Record<string, string>,
  spec: CsvFormatSpec,
): boolean {
  const status = valueForField(row, spec, "status");

  if (!status) {
    return true;
  }

  const normalized = status.trim().toLowerCase();

  if (normalized === "") {
    return true;
  }

  const usesCanceledBoolean = spec.aliases.status.some(
    (alias) => normalizeHeader(alias) === "canceled",
  );

  return (
    normalized === "fill" ||
    normalized === "partial_fill" ||
    normalized === "partial fill" ||
    (usesCanceledBoolean && normalized === "false") ||
    normalized.includes("filled") ||
    normalized.includes("executed") ||
    normalized.includes("complete")
  );
}

function rowLooksLikeOption(
  row: Record<string, string>,
  spec: CsvFormatSpec,
): boolean {
  const rawSymbol = valueForField(row, spec, "symbol") ?? "";
  const rawAssetType = valueForField(row, spec, "assetType") ?? "";
  const rawDescription = valueForField(row, spec, "description") ?? "";
  const text = `${rawSymbol} ${rawAssetType} ${rawDescription}`;

  return (
    /\boptions?\b/i.test(text) ||
    /\b(call|put)\b/i.test(text) ||
    /\b\d{6}[cp]\d{8}\b/i.test(text) ||
    /\b\d{2}[a-z]{3}\d{2}\s+\d+(?:\.\d+)?\s+[cp]\b/i.test(text)
  );
}

function mapCsvRowToExecution(args: {
  row: Record<string, string>;
  rowIndex: number;
  spec: CsvFormatSpec;
  sourceLabel: string;
  timestampTimezone: string;
  optionsHandling: BrokerExecutionCsvOptionsHandling;
  issues: BrokerExecutionCsvImportIssue[];
}): ProviderExecution | null {
  const {
    row,
    rowIndex,
    spec,
    sourceLabel,
    timestampTimezone,
    optionsHandling,
    issues,
  } = args;

  const ibkrStockOrder = rowIsIbkrActivityStatementStockOrder(row, spec);

  if (ibkrStockOrder === false) {
    pushIssue(issues, {
      severity: "warning",
      code: "non_trade_row_skipped",
      message:
        "IBKR activity statement row is not a stock execution order and was skipped.",
      rowIndex,
    });
    return null;
  }

  if (!rowLooksLikeTrade(row, spec)) {
    pushIssue(issues, {
      severity: "warning",
      code: "non_trade_row_skipped",
      message: "CSV row does not appear to be an execution trade and was skipped.",
      rowIndex,
    });
    return null;
  }

  if (rowLooksLikeOption(row, spec)) {
    if (optionsHandling === "reject") {
      pushIssue(issues, {
        severity: "error",
        code: "options_row_rejected",
        message:
          "Options executions are not supported by the stock execution import path yet.",
        rowIndex,
        field: "assetType",
      });
      return null;
    }

    if (optionsHandling === "skip") {
      pushIssue(issues, {
        severity: "warning",
        code: "options_row_skipped",
        message:
          "Options execution row was skipped by the current import settings.",
        rowIndex,
        field: "assetType",
      });
      return null;
    }

    pushIssue(issues, {
      severity: "warning",
      code: "options_row_allowed",
      message:
        "Options execution row was allowed, but downstream stock analytics may not support it yet.",
      rowIndex,
      field: "assetType",
    });
  }

  if (!rowIsFilledOrder(row, spec)) {
    pushIssue(issues, {
      severity: "warning",
      code: "non_filled_order_skipped",
      message: "CSV row is not filled/executed and was skipped.",
      rowIndex,
      field: "status",
    });
    return null;
  }

  const symbol = normalizeSymbol(valueForField(row, spec, "symbol"));
  const quantity = parseNumeric(valueForField(row, spec, "quantity"));
  const price = parseNumeric(valueForField(row, spec, "price"));
  const commission = parseNumericSum(valuesForField(row, spec, "commission"));
  const fees = parseNumericSum(valuesForField(row, spec, "fees"));
  const netAmount = parseNumeric(valueForField(row, spec, "netAmount"));
  const currency = valueForField(row, spec, "currency");
  const side = normalizeSide(valueForField(row, spec, "side"), quantity);
  const timestamp = parseTimestamp(
    valueForField(row, spec, "timestamp"),
    valueForField(row, spec, "date"),
    valueForField(row, spec, "time"),
    timestampTimezone,
  );

  if (!symbol) {
    pushIssue(issues, {
      severity: "error",
      code: "row_missing_symbol",
      message: "CSV row is missing a valid symbol.",
      rowIndex,
      field: "symbol",
    });
  }

  if (!timestamp) {
    const hasAnyTimestamp =
      valueForField(row, spec, "timestamp") !== null ||
      valueForField(row, spec, "date") !== null;

    pushIssue(issues, {
      severity: "error",
      code: hasAnyTimestamp ? "row_invalid_timestamp" : "row_missing_timestamp",
      message: hasAnyTimestamp
        ? "CSV row has a timestamp/date that could not be parsed."
        : "CSV row is missing a timestamp or date.",
      rowIndex,
      field: "timestamp",
    });
  }

  if (!side) {
    pushIssue(issues, {
      severity: "error",
      code: "row_missing_side",
      message: "CSV row is missing a buy/sell side and quantity sign was not enough to infer it.",
      rowIndex,
      field: "side",
    });
  }

  if (quantity === null) {
    pushIssue(issues, {
      severity: "error",
      code: "row_missing_quantity",
      message: "CSV row is missing quantity/shares.",
      rowIndex,
      field: "quantity",
    });
  } else if (quantity === 0) {
    pushIssue(issues, {
      severity: "error",
      code: "row_invalid_quantity",
      message: "CSV row quantity must be non-zero.",
      rowIndex,
      field: "quantity",
    });
  }

  if (price === null) {
    pushIssue(issues, {
      severity: "error",
      code: "row_missing_price",
      message: "CSV row is missing execution price.",
      rowIndex,
      field: "price",
    });
  } else if (price <= 0) {
    pushIssue(issues, {
      severity: "error",
      code: "row_invalid_price",
      message: "CSV row execution price must be greater than zero.",
      rowIndex,
      field: "price",
    });
  }

  if (!symbol || !timestamp || !side || quantity === null || quantity === 0 || price === null || price <= 0) {
    return null;
  }

  return {
    symbol,
    timestamp,
    side,
    shares: Math.abs(quantity),
    price,
    executionIndex: rowIndex - 1,
    orderId: valueForField(row, spec, "orderId") ?? undefined,
    brokerExecutionId: valueForField(row, spec, "executionId") ?? undefined,
    commission: commission ?? undefined,
    fees: fees ?? undefined,
    netAmount: netAmount ?? undefined,
    currency: currency?.toUpperCase() ?? undefined,
    positionEffect: ibkrPositionEffect(row, spec),
    source: sourceLabel,
  };
}

function sortExecutions(executions: ProviderExecution[]): ProviderExecution[] {
  return [...executions].sort((left, right) => {
    const timeDelta =
      Date.parse(String(left.timestamp)) - Date.parse(String(right.timestamp));

    if (timeDelta !== 0) {
      return timeDelta;
    }

    return Number(left.executionIndex ?? 0) - Number(right.executionIndex ?? 0);
  });
}

function positionDelta(
  direction: "long" | "short",
  execution: ProviderExecution,
): number {
  const side = execution.side.trim().toLowerCase();
  const shares = Number(execution.shares);

  if (direction === "long") {
    return side === "buy" ? shares : -shares;
  }

  return side === "sell" ? shares : -shares;
}

function directionFromExecution(execution: ProviderExecution): "long" | "short" {
  return execution.side.trim().toLowerCase() === "buy" ? "long" : "short";
}

function executionClosesPriorPosition(execution: ProviderExecution): boolean {
  return execution.positionEffect === "closing";
}

function allowsSellStartingTrades(
  rules: BrokerExecutionCsvTradeGroupingRules,
): boolean {
  return rules.allowSellStartingTrades === true;
}

function executionStartsSellSideTrade(execution: ProviderExecution): boolean {
  return directionFromExecution(execution) === "short";
}

function pushSellStartingTradeSkippedIssue(
  issues: BrokerExecutionCsvImportIssue[],
  execution: ProviderExecution,
): void {
  pushIssue(issues, {
    severity: "warning",
    code: "sell_starting_trade_skipped",
    message:
      `${execution.symbol} sell ${execution.shares} share${Number(execution.shares) === 1 ? "" : "s"} at ${String(execution.timestamp)} could not be matched to an earlier buy in this CSV window, so it was set aside from normal long-side analytics.`,
    rowIndex: executionRowIndex(execution),
  });
}

function sessionDateFromExecution(execution: ProviderExecution): string {
  return buildSessionTimeContextFromExecutions([execution]).sessionDate;
}

function cloneWithShares(
  execution: ProviderExecution,
  shares: number,
  notes: string,
): ProviderExecution {
  return {
    ...execution,
    shares,
    notes: execution.notes ? `${execution.notes}; ${notes}` : notes,
  };
}

function executionRowIndex(execution: ProviderExecution): number {
  const executionIndex = Number(execution.executionIndex ?? 0);

  return Number.isFinite(executionIndex) ? executionIndex + 1 : 0;
}

function minutesBetweenExecutions(
  left: ProviderExecution,
  right: ProviderExecution,
): number | null {
  const leftTime = Date.parse(String(left.timestamp));
  const rightTime = Date.parse(String(right.timestamp));

  if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) {
    return null;
  }

  return Math.abs(rightTime - leftTime) / 60000;
}

function groupingSplitReason(args: {
  currentExecutions: ProviderExecution[];
  nextExecution: ProviderExecution;
  rules: BrokerExecutionCsvTradeGroupingRules;
}): BrokerExecutionCsvTradeGroupingReason | null {
  const lastExecution = args.currentExecutions[args.currentExecutions.length - 1];

  if (!lastExecution) {
    return null;
  }

  if (
    args.rules.splitAtSessionBoundary &&
    sessionDateFromExecution(lastExecution) !==
      sessionDateFromExecution(args.nextExecution)
  ) {
    return "session_boundary_split";
  }

  const maxGapMinutes = args.rules.maxGapMinutes;

  if (typeof maxGapMinutes === "number" && maxGapMinutes > 0) {
    const gapMinutes = minutesBetweenExecutions(
      lastExecution,
      args.nextExecution,
    );

    if (gapMinutes !== null && gapMinutes > maxGapMinutes) {
      return "time_gap_split";
    }
  }

  return null;
}

interface BuildRequestsFromExecutionsResult {
  requests: UserTradeAnalysisRequest[];
  groupingDiagnostics: BrokerExecutionCsvTradeGroupingDiagnostic[];
}

function buildRequestsFromExecutions(args: {
  executions: ProviderExecution[];
  defaultSessionBucket: string;
  tradeGroupingRules: BrokerExecutionCsvTradeGroupingRules;
  issues: BrokerExecutionCsvImportIssue[];
}): BuildRequestsFromExecutionsResult {
  const { executions, defaultSessionBucket, tradeGroupingRules, issues } = args;
  const requests: UserTradeAnalysisRequest[] = [];
  const groupingDiagnostics: BrokerExecutionCsvTradeGroupingDiagnostic[] = [];
  const bySymbol = new Map<string, ProviderExecution[]>();

  for (const execution of sortExecutions(executions)) {
    const symbolExecutions = bySymbol.get(execution.symbol) ?? [];
    symbolExecutions.push(execution);
    bySymbol.set(execution.symbol, symbolExecutions);
  }

  for (const [symbol, symbolExecutions] of bySymbol) {
    let currentDirection: "long" | "short" | null = null;
    let currentPosition = 0;
    let currentExecutions: ProviderExecution[] = [];
    let unsupportedSellPosition = 0;

    const flushCurrent = (
      groupingReason: BrokerExecutionCsvTradeGroupingReason,
    ): void => {
      if (!currentDirection || currentExecutions.length === 0) {
        return;
      }

      const requestIndex = requests.length;
      const lifecycleStatus =
        currentPosition === 0 ? "closed" : "open";
      const sessionContext = buildSessionTimeContextFromExecutions(
        currentExecutions,
      );

      requests.push({
        symbol,
        tradeDirection: currentDirection,
        executions: currentExecutions,
        sessionContext: {
          ...sessionContext,
          sessionBucket: sessionContext.sessionBucket || defaultSessionBucket,
        },
      });
      groupingDiagnostics.push({
        requestIndex,
        symbol,
        tradeDirection: currentDirection,
        lifecycleStatus,
        groupingReason,
        rowIndexes: currentExecutions.map(executionRowIndex),
        executionCount: currentExecutions.length,
        firstTimestamp: String(currentExecutions[0].timestamp),
        lastTimestamp: String(
          currentExecutions[currentExecutions.length - 1].timestamp,
        ),
        finalPositionShares: currentPosition,
        notes: [
          lifecycleStatus === "closed"
            ? "Grouped because executions returned the position to flat."
            : "Grouped at the end of the symbol sequence with open shares remaining.",
          groupingReason === "over_reduction_split"
            ? "An over-reducing execution crossed through flat and started an opposite-direction trade."
            : "",
          groupingReason === "time_gap_split"
            ? "Grouped separately because the next execution exceeded the configured max time gap."
            : "",
          groupingReason === "session_boundary_split"
            ? "Grouped separately because the next execution crossed a session/date boundary."
            : "",
        ].filter((note) => note !== ""),
      });

      currentDirection = null;
      currentPosition = 0;
      currentExecutions = [];
    };

    for (const execution of symbolExecutions) {
      let groupingExecution = execution;

      if (
        unsupportedSellPosition > 0 &&
        !allowsSellStartingTrades(tradeGroupingRules)
      ) {
        const shares = Number(execution.shares);

        if (executionStartsSellSideTrade(execution)) {
          unsupportedSellPosition += shares;
          pushSellStartingTradeSkippedIssue(issues, execution);
          continue;
        }

        if (shares <= unsupportedSellPosition) {
          unsupportedSellPosition -= shares;
          continue;
        }

        groupingExecution = cloneWithShares(
          execution,
          shares - unsupportedSellPosition,
          "partially used by CSV import after an unmatched sell-side sequence returned to flat",
        );
        unsupportedSellPosition = 0;
      }

      if (!currentDirection) {
        if (executionClosesPriorPosition(groupingExecution)) {
          pushIssue(issues, {
            severity: "warning",
            code: "prior_position_close_skipped",
            message:
              `${groupingExecution.symbol} ${groupingExecution.side} ${groupingExecution.shares} share${Number(groupingExecution.shares) === 1 ? "" : "s"} at ${String(groupingExecution.timestamp)} was marked by IBKR as closing shares from before this CSV window, so it was set aside from normal long-side analytics.`,
            rowIndex: executionRowIndex(groupingExecution),
          });
          continue;
        }

        if (
          executionStartsSellSideTrade(groupingExecution) &&
          !allowsSellStartingTrades(tradeGroupingRules)
        ) {
          unsupportedSellPosition += Number(groupingExecution.shares);
          pushSellStartingTradeSkippedIssue(issues, groupingExecution);
          continue;
        }

        currentDirection = directionFromExecution(groupingExecution);
        currentPosition = Number(groupingExecution.shares);
        currentExecutions = [groupingExecution];
        continue;
      }

      const safetySplitReason = groupingSplitReason({
        currentExecutions,
        nextExecution: groupingExecution,
        rules: tradeGroupingRules,
      });

      if (safetySplitReason) {
        pushIssue(issues, {
          severity: "warning",
          code:
            safetySplitReason === "time_gap_split"
              ? "trade_grouping_time_gap_split"
              : "trade_grouping_session_boundary_split",
          message:
            safetySplitReason === "time_gap_split"
              ? "Execution was grouped into a new trade because it exceeded the configured max time gap."
              : "Execution was grouped into a new trade because it crossed the configured session boundary.",
          rowIndex: executionRowIndex(groupingExecution),
        });
        flushCurrent(safetySplitReason);

        if (
          executionStartsSellSideTrade(groupingExecution) &&
          !allowsSellStartingTrades(tradeGroupingRules)
        ) {
          unsupportedSellPosition += Number(groupingExecution.shares);
          pushSellStartingTradeSkippedIssue(issues, groupingExecution);
          continue;
        }

        currentDirection = directionFromExecution(groupingExecution);
        currentPosition = Number(groupingExecution.shares);
        currentExecutions = [groupingExecution];
        continue;
      }

      const delta = positionDelta(currentDirection, groupingExecution);
      const nextPosition = currentPosition + delta;

      if (nextPosition < 0) {
        const closingShares = currentPosition;
        const openingShares = Math.abs(nextPosition);

        if (closingShares > 0) {
          currentExecutions.push(
            cloneWithShares(
              groupingExecution,
              closingShares,
              "split by CSV import because execution over-reduced the current trade",
            ),
          );
        }

        pushIssue(issues, {
          severity: "warning",
          code: "over_reducing_execution_split",
          message:
            "One execution reduced more shares than the open trade; the importer split it into a closing execution and a new opposite-direction trade.",
          rowIndex:
            typeof groupingExecution.executionIndex === "number"
              ? groupingExecution.executionIndex + 1
            : undefined,
        });

        currentPosition = 0;
        flushCurrent("over_reduction_split");

        if (
          directionFromExecution(groupingExecution) === "short" &&
          !allowsSellStartingTrades(tradeGroupingRules)
        ) {
          unsupportedSellPosition += openingShares;
          pushSellStartingTradeSkippedIssue(
            issues,
            cloneWithShares(
              groupingExecution,
              openingShares,
              "skipped by CSV import because it would start an unsupported sell-side sequence",
            ),
          );
          continue;
        }

        currentDirection = directionFromExecution(groupingExecution);
        currentPosition = openingShares;
        currentExecutions = [
          cloneWithShares(
            groupingExecution,
            openingShares,
            "split by CSV import as the opening remainder after over-reduction",
          ),
        ];
        continue;
      }

      currentExecutions.push(groupingExecution);
      currentPosition = nextPosition;

      if (currentPosition === 0) {
        flushCurrent("flat_position");
      }
    }

    flushCurrent("end_of_symbol");
  }

  return { requests, groupingDiagnostics };
}

function relayTradeRequestIssues(
  requests: UserTradeAnalysisRequest[],
  issues: BrokerExecutionCsvImportIssue[],
): void {
  requests.forEach((request, requestIndex) => {
    const validation = validateTradeAnalysisRequest(request);

    for (const issue of validation.issues) {
      pushIssue(issues, {
        severity: issue.severity,
        code:
          issue.severity === "error"
            ? "trade_request_validation_error"
            : "trade_request_validation_warning",
        message: formatTradeRequestIssue(issue),
        requestIndex,
      });
    }
  });
}

function formatTradeRequestIssue(issue: TradeAnalysisRequestIssue): string {
  return `${issue.path}: ${issue.message}`;
}

export function parseBrokerExecutionCsv(
  args: BrokerExecutionCsvImportArgs,
): BrokerExecutionCsvImportResult {
  const issues: BrokerExecutionCsvImportIssue[] = [];
  const columnMapping = normalizeColumnMapping(args.columnMapping);
  const tradeGroupingRules = args.tradeGroupingRules ?? {};
  const timestampTimezone = normalizeTimestampTimezone(
    args.timestampTimezone,
    issues,
  );
  const optionsHandling = args.optionsHandling ?? "reject";
  const hardening = validateParserHardeningInput(args.csvText, columnMapping as Readonly<Record<string, string | readonly string[] | undefined>>);
  const fingerprintInput = hardening.issues.some((issue) => issue.code === "ti_v3_parser_payload_oversized")
    ? `ti_v3_rejected_oversized_csv:${args.csvText.length}`
    : args.csvText;
  const fileFingerprint = buildBrokerExecutionCsvFileFingerprint(fingerprintInput);
  const document = parseCsvDocument(args.csvText, issues, columnMapping, hardening);

  if (!document) {
    const broker =
      args.broker === "auto" ? "generic_execution_csv" : args.broker;
    const spec = BROKER_EXECUTION_CSV_FORMATS[broker];
    const effectiveSpec = applyColumnMappingToSpec(spec, columnMapping);
    const diagnostics = buildDiagnostics({
      requestedBroker: args.broker,
      resolvedBroker: broker,
      fileFingerprint,
      timestampTimezone,
      optionsHandling,
      columnMapping,
      tradeGroupingRules,
      document: null,
      spec: effectiveSpec,
      missingRequiredFields: [],
      rowOutcomes: [],
      requestFingerprints: [],
      groupingDiagnostics: [],
      issues,
    });

    return {
      contractVersion: "broker_execution_csv_import_v1",
      broker,
      brokerLabel: effectiveSpec.label,
      stableHeaderConfidence: effectiveSpec.stableHeaderConfidence,
      fileFingerprint,
      rowCount: 0,
      acceptedExecutionCount: 0,
      rejectedRowCount: 0,
      skippedRowCount: 0,
      requestCount: 0,
      requestFingerprints: [],
      mappingConfidence: diagnostics.mappingConfidence,
      groupingDiagnostics: [],
      diagnostics,
      issues,
      executions: [],
      requests: [],
    };
  }

  const broker = resolveFormat(args.broker, document, issues);
  const spec = applyColumnMappingToSpec(
    BROKER_EXECUTION_CSV_FORMATS[broker],
    columnMapping,
  );
  const missing = missingRequiredFields(spec, document.normalizedHeaders);

  for (const field of missing) {
    pushIssue(issues, {
      severity: "error",
      code: "missing_required_column",
      message: `${spec.label} import is missing a required ${field} column.`,
      field,
    });
  }

  if (missing.length > 0) {
    const diagnostics = buildDiagnostics({
      requestedBroker: args.broker,
      resolvedBroker: broker,
      fileFingerprint,
      timestampTimezone,
      optionsHandling,
      columnMapping,
      tradeGroupingRules,
      document,
      spec,
      missingRequiredFields: missing,
      rowOutcomes: [],
      requestFingerprints: [],
      groupingDiagnostics: [],
      issues,
    });

    return {
      contractVersion: "broker_execution_csv_import_v1",
      broker,
      brokerLabel: spec.label,
      stableHeaderConfidence: spec.stableHeaderConfidence,
      fileFingerprint,
      rowCount: document.rows.length,
      acceptedExecutionCount: 0,
      rejectedRowCount: document.rows.length,
      skippedRowCount: 0,
      requestCount: 0,
      requestFingerprints: [],
      mappingConfidence: diagnostics.mappingConfidence,
      groupingDiagnostics: [],
      diagnostics,
      issues,
      executions: [],
      requests: [],
    };
  }

  const sourceLabel = args.sourceLabel ?? `broker_csv:${broker}`;
  const executions: ProviderExecution[] = [];
  const rowOutcomes: BrokerExecutionCsvRowOutcome[] = [];
  let skippedRowCount = 0;
  let rejectedRowCount = 0;

  document.rows.forEach((row, rowOffset) => {
    const issueCountBefore = issues.length;
    const rowIndex = document.headerRowIndex + rowOffset + 2;
    const execution = mapCsvRowToExecution({
      row,
      rowIndex,
      spec,
      sourceLabel,
      timestampTimezone,
      optionsHandling,
      issues,
    });
    const rowIssues = issues.slice(issueCountBefore);

    if (execution) {
      executions.push(execution);
      rowOutcomes.push({
        rowIndex,
        status: "accepted",
        symbol: execution.symbol,
        issueCodes: rowIssues.map((issue) => issue.code),
      });
      return;
    }

    if (rowIssues.some((issue) => issue.severity === "error")) {
      rejectedRowCount += 1;
      rowOutcomes.push({
        rowIndex,
        status: "rejected",
        symbol: normalizeSymbol(valueForField(row, spec, "symbol")),
        issueCodes: rowIssues.map((issue) => issue.code),
      });
    } else {
      skippedRowCount += 1;
      rowOutcomes.push({
        rowIndex,
        status: "skipped",
        symbol: normalizeSymbol(valueForField(row, spec, "symbol")),
        issueCodes: rowIssues.map((issue) => issue.code),
      });
    }
  });

  const groupingResult = buildRequestsFromExecutions({
    executions,
    defaultSessionBucket: args.defaultSessionBucket ?? "unknown",
    tradeGroupingRules,
    issues,
  });
  const { requests, groupingDiagnostics } = groupingResult;

  relayTradeRequestIssues(requests, issues);

  const requestFingerprints = requests.map(buildTradeAnalysisRequestFingerprint);
  const duplicateFingerprints =
    duplicateRequestFingerprints(requestFingerprints);

  for (const duplicate of duplicateFingerprints) {
    pushIssue(issues, {
      severity: "warning",
      code: "duplicate_trade_in_import",
      message: `Duplicate trade request fingerprint ${duplicate.fingerprint} appears at request indexes ${duplicate.requestIndexes.join(", ")}.`,
      requestIndex: duplicate.requestIndexes[0],
    });
  }

  const diagnostics = buildDiagnostics({
    requestedBroker: args.broker,
    resolvedBroker: broker,
    fileFingerprint,
    timestampTimezone,
    optionsHandling,
    columnMapping,
    tradeGroupingRules,
    document,
    spec,
    missingRequiredFields: missing,
    rowOutcomes,
    requestFingerprints,
    groupingDiagnostics,
    issues,
  });

  return {
    contractVersion: "broker_execution_csv_import_v1",
    broker,
    brokerLabel: spec.label,
    stableHeaderConfidence: spec.stableHeaderConfidence,
    fileFingerprint,
    rowCount: document.rows.length,
    acceptedExecutionCount: executions.length,
    rejectedRowCount,
    skippedRowCount,
    requestCount: requests.length,
    requestFingerprints,
    mappingConfidence: diagnostics.mappingConfidence,
    groupingDiagnostics,
    diagnostics,
    issues,
    executions,
    requests,
  };
}
