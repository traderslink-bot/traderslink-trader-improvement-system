import {
  previewBrokerExecutionCsvImport,
  type BrokerExecutionCsvSavedTradeImportPreview,
  type PreviewBrokerExecutionCsvImportArgs,
} from "./import-preview";
import { buildProductCopyQualitySystem } from "./import-trial-experience";
import { runExecutionFeedback } from "../../execution-feedback";
import type { ExecutionFeedbackPoint } from "../../execution-feedback/types/execution-feedback-point";
import type {
  CsvDryRunBrokerHelpPanel,
  CsvDryRunBrokerCoveragePanel,
  CsvDryRunCalibrationQueue,
  CsvDryRunColumnMappingAssistant,
  CsvDryRunColumnMappingRow,
  CsvDryRunConfidenceGate,
  CsvDryRunCopyAudit,
  CsvDryRunCostVisibilityItem,
  CsvDryRunCostVisibilityPanel,
  CsvDryRunBrokerMappingLearningConsole,
  CsvDryRunBrokerMappingLearningField,
  CsvDryRunDecisionCaptureItem,
  CsvDryRunDecisionCaptureModel,
  CsvDryRunEditableRow,
  CsvDryRunEditableRowRepairTable,
  CsvDryRunErrorLibrary,
  CsvDryRunErrorLibraryEntry,
  CsvDryRunEvidenceDrillIn,
  CsvDryRunEvidenceRecord,
  CsvDryRunExecutionAnomaly,
  CsvDryRunExecutionAnomalyDetector,
  CsvDryRunExecutionFeedbackPreview,
  CsvDryRunExecutionFeedbackPreviewItem,
  CsvDryRunFeedbackComparison,
  CsvDryRunFeedbackComparisonTradeRef,
  CsvDryRunFirstTradeReviewWalkthrough,
  CsvDryRunGroupingDecisionKind,
  CsvDryRunGroupingDecisionOption,
  CsvDryRunGroupingDecisionReview,
  CsvDryRunImportExperience,
  CsvDryRunMobileQaPanel,
  CsvDryRunPnlReconciliationAssistant,
  CsvDryRunPnlReconciliationAssistantItem,
  CsvDryRunPostImportReviewQueueItem,
  CsvDryRunPostImportReviewQueuePreview,
  CsvDryRunPrivacyNotice,
  CsvDryRunReadinessDimension,
  CsvDryRunReadinessScoreBreakdown,
  CsvDryRunRepairImpactSnapshot,
  CsvDryRunReplayPreview,
  CsvDryRunReplayPreviewStep,
  CsvDryRunSamplePreset,
  CsvDryRunSessionStage,
  CsvDryRunSessionState,
  CsvDryRunSessionSummary,
  CsvDryRunSetupTagKind,
  CsvDryRunSetupTagOption,
  CsvDryRunSetupTaggingModel,
  CsvDryRunTradeGroupingReview,
  CsvDryRunTradeGroupingReviewItem,
  ProductTraderAnalyticsViewModel,
} from "./types";
import type {
  BrokerExecutionCsvCanonicalField,
  BrokerExecutionCsvColumnMapping,
  BrokerExecutionCsvFormat,
  BrokerExecutionCsvImportIssueCode,
  BrokerExecutionCsvTradeGroupingRules,
} from "../../execution-sources/csv";
import { mapUserFacingBehavior } from "../../user-facing-behavior";

type DryRunAnalyticsContext = Omit<
  ProductTraderAnalyticsViewModel,
  "importTrialExperience"
>;

const REQUIRED_MAPPING_FIELDS: BrokerExecutionCsvCanonicalField[] = [
  "symbol",
  "side",
  "quantity",
  "price",
];

const REVIEW_MAPPING_FIELDS: BrokerExecutionCsvCanonicalField[] = [
  "timestamp",
  "date",
  "time",
  "status",
  "commission",
  "fees",
  "netAmount",
];

function primaryExecutionFeedbackPreviewLabel(
  point: ExecutionFeedbackPoint | null | undefined,
): string | null {
  if (!point) {
    return null;
  }

  const behavior = mapUserFacingBehavior({
    behaviorId: point.id,
    rawLabel: point.label,
    route: "/intelligence/trades",
  });

  return behavior.canDrivePrimaryConclusion ? behavior.label : null;
}

const SAMPLE_PRESETS: CsvDryRunSamplePreset[] = [
  {
    id: "preset:ibkr",
    label: "IBKR closed trade",
    broker: "ibkr_activity_statement",
    description: "Representative IBKR activity statement trade rows.",
    csvText: [
      "Statement,Account,SYNTHETIC-ACCOUNT",
      "Generated,2026-05-02",
      "Trades,Header,Asset Category,Currency,Symbol,Date/Time,Quantity,T. Price,Trade ID,Proceeds,Comm/Fee",
      'Trades,Data,Stocks,USD,AAPL,"2026-05-01, 09:35:00",100,182.10,IB-1,-18210.00,-1.00',
      'Trades,Data,Stocks,USD,AAPL,"2026-05-01, 10:05:00",-100,184.25,IB-2,18425.00,-1.00',
    ].join("\n"),
  },
  {
    id: "preset:webull",
    label: "Webull with skipped cancel",
    broker: "webull_order_history",
    description: "Representative Webull order history with a cancelled row.",
    csvText: [
      "Symbol,Side,Filled Qty,Avg Price,Filled Time,Status,Order ID",
      "TSLA,Buy,10,175.25,2026-05-01 09:45:00,Filled,WB-1",
      "TSLA,Sell,10,176.50,2026-05-01 10:15:00,Filled,WB-2",
      "TSLA,Buy,5,177.00,2026-05-01 10:30:00,Cancelled,WB-3",
    ].join("\n"),
  },
  {
    id: "preset:webull-partial-cancel",
    label: "Webull partial fill with cancel",
    broker: "webull_order_history",
    description: "Synthetic Webull order export with a partial fill and a cancelled row.",
    csvText: [
      "Symbol,Side,Filled Qty,Avg Price,Filled Time,Status,Order ID",
      "RBLX,Buy,40,39.50,2026-05-01 09:42:00,Partially Filled,WB-PF-1",
      "RBLX,Buy,60,39.75,2026-05-01 09:43:30,Filled,WB-PF-1",
      "RBLX,Sell,100,40.20,2026-05-01 10:22:00,Filled,WB-PF-2",
      "RBLX,Sell,25,40.50,2026-05-01 10:25:00,Cancelled,WB-PF-3",
    ].join("\n"),
  },
  {
    id: "preset:robinhood",
    label: "Robinhood transaction history",
    broker: "robinhood_transaction_history",
    description: "Representative Robinhood account activity rows.",
    csvText: [
      "Activity Date,Instrument,Transaction Type,Quantity,Average Price",
      "05/01/2026,NVDA,Market Buy,25,875.50",
      "05/01/2026,NVDA,Market Sell,25,889.10",
    ].join("\n"),
  },
  {
    id: "preset:moomoo",
    label: "Moomoo trade history",
    broker: "moomoo_trade_history",
    description: "Representative Moomoo trade history columns.",
    csvText: [
      "Date of Trade,Instrument Code,Transaction Type,Filled Quantity,Average Price",
      "2026/05/01,META,Buy,8,312.40",
      "2026/05/01,META,Sell,8,318.75",
    ].join("\n"),
  },
  {
    id: "preset:moomoo-partial-fills",
    label: "Moomoo partial fills",
    broker: "moomoo_trade_history",
    description: "Synthetic Moomoo trade history with split fills under common trade-history headers.",
    csvText: [
      "Date of Trade,Instrument Code,Transaction Type,Filled Quantity,Average Price",
      "2026/05/01,UBER,Buy,30,68.10",
      "2026/05/01,UBER,Buy,20,68.20",
      "2026/05/01,UBER,Sell,50,69.05",
    ].join("\n"),
  },
  {
    id: "preset:schwab",
    label: "Schwab with account activity",
    broker: "schwab_transactions",
    description: "Representative Schwab transaction rows with a skipped dividend.",
    csvText: [
      "Date,Action,Symbol,Description,Quantity,Price,Fees & Comm,Amount",
      "05/01/2026,Buy,AMD,ADVANCED MICRO DEVICES INC,50,95.00,0,-4750.00",
      "05/01/2026,Sell,AMD,ADVANCED MICRO DEVICES INC,50,97.50,0,4875.00",
      "05/01/2026,Dividend,AMD,QUALIFIED DIVIDEND,0,0,0,12.00",
    ].join("\n"),
  },
  {
    id: "preset:schwab-mixed-activity",
    label: "Schwab mixed activity",
    broker: "schwab_transactions",
    description: "Synthetic Schwab transactions export with trades and non-trade account activity.",
    csvText: [
      "Date,Action,Symbol,Description,Quantity,Price,Fees & Comm,Amount",
      "05/01/2026,Buy,AMD,ADVANCED MICRO DEVICES INC,25,95.00,0,-2375.00",
      "05/01/2026,Buy,AMD,ADVANCED MICRO DEVICES INC,25,95.50,0,-2387.50",
      "05/01/2026,Sell,AMD,ADVANCED MICRO DEVICES INC,50,97.50,0,4875.00",
      "05/01/2026,MoneyLink Transfer,,CASH MOVEMENT,0,0,0,1000.00",
      "05/01/2026,Dividend,AMD,QUALIFIED DIVIDEND,0,0,0,12.00",
    ].join("\n"),
  },
  {
    id: "preset:generic-short",
    label: "Generic short trade",
    broker: "generic_execution_csv",
    description: "Plain execution ledger for a closed short trade.",
    csvText: [
      "Date,Time,Ticker,Action,Shares,Price",
      "2026-05-01,09:30:00,SPY,Sell,100,510.00",
      "2026-05-01,10:00:00,SPY,Buy,100,508.25",
    ].join("\n"),
  },
  {
    id: "preset:generic-short-cover",
    label: "Generic short sale and cover",
    broker: "generic_execution_csv",
    description: "Short-sale wording with a later buy-to-cover exit.",
    csvText: [
      "Date,Time,Symbol,Action,Shares,Price,Commission,Fees",
      "2026-05-01,09:34:00,IWM,Short Sell,200,205.00,1.00,0.12",
      "2026-05-01,10:18:00,IWM,Buy to Cover,200,203.75,1.00,0.12",
    ].join("\n"),
  },
  {
    id: "preset:generic-partial-exits",
    label: "Generic partial exits",
    broker: "generic_execution_csv",
    description: "A long trade with adds and multiple partial exits.",
    csvText: [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:31:00,MSFT,Buy,50,410.00",
      "2026-05-01,09:44:00,MSFT,Buy,50,411.00",
      "2026-05-01,10:05:00,MSFT,Sell,40,412.00",
      "2026-05-01,10:42:00,MSFT,Sell,60,413.00",
    ].join("\n"),
  },
  {
    id: "preset:generic-extended-hours",
    label: "Generic extended-hours trades",
    broker: "generic_execution_csv",
    description: "Executions that begin premarket and after-hours for session-time checks.",
    csvText: [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,04:15:00,SOFI,Buy,100,8.00",
      "2026-05-01,09:35:00,SOFI,Sell,100,8.40",
      "2026-05-01,16:05:00,HOOD,Buy,50,18.00",
      "2026-05-01,19:30:00,HOOD,Sell,50,18.30",
    ].join("\n"),
  },
  {
    id: "preset:unknown-mapping",
    label: "Unknown headers needing mapping",
    broker: "generic_execution_csv",
    description: "A generic file shape that needs explicit column mapping.",
    csvText: [
      "Trading Symbol,Executed At,Instruction,Filled Shares,Fill Price",
      "PLTR,2026-05-01 09:30:00,Buy,100,20.00",
      "PLTR,2026-05-01 10:00:00,Sell,100,21.00",
    ].join("\n"),
  },
  {
    id: "preset:open-position",
    label: "Open position review",
    broker: "generic_execution_csv",
    description: "An import that leaves shares open after the last execution.",
    csvText: [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,QQQ,Buy,100,420.00",
      "2026-05-01,10:00:00,QQQ,Sell,25,421.00",
    ].join("\n"),
  },
  {
    id: "preset:row-repair",
    label: "Missing row field",
    broker: "generic_execution_csv",
    description: "A row-level repair sample with a missing ticker.",
    csvText: [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,,Buy,100,10.00",
      "2026-05-01,09:35:00,ABCD,Sell,100,11.00",
    ].join("\n"),
  },
];

export function getCsvDryRunSamplePresets(): CsvDryRunSamplePreset[] {
  return SAMPLE_PRESETS;
}

function parseCsvGrid(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const next = csvText[index + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        currentCell += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
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

  return rows.filter((row) => row.some((cell) => cell.trim() !== ""));
}

function serializeCsvGrid(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");

          return /[",\n\r]/.test(value)
            ? `"${value.replace(/"/g, "\"\"")}"`
            : value;
        })
        .join(","),
    )
    .join("\n");
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function countBy<T>(items: T[], getKey: (item: T) => string | null): Map<string, number> {
  return items.reduce((counts, item) => {
    const key = getKey(item);

    if (!key) {
      return counts;
    }

    counts.set(key, (counts.get(key) ?? 0) + 1);

    return counts;
  }, new Map<string, number>());
}

export function applyCsvDryRunCellEdit(args: {
  csvText: string;
  rowNumber: number;
  header: string;
  value: string;
}): string {
  const rows = parseCsvGrid(args.csvText);
  const headers = rows[0] ?? [];
  const columnIndex = headers.findIndex((header) => header === args.header);
  const rowIndex = args.rowNumber - 1;

  if (columnIndex === -1 || rowIndex <= 0 || !rows[rowIndex]) {
    return args.csvText;
  }

  while (rows[rowIndex].length < headers.length) {
    rows[rowIndex].push("");
  }

  rows[rowIndex][columnIndex] = args.value;

  return serializeCsvGrid(rows);
}

function importantHeader(header: string): boolean {
  const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, "");

  return [
    "symbol",
    "ticker",
    "instrument",
    "instrumentcode",
    "tradingsymbol",
    "datetime",
    "date",
    "time",
    "executedat",
    "side",
    "action",
    "instruction",
    "quantity",
    "shares",
    "filledshares",
    "price",
    "fillprice",
    "avgprice",
    "averageprice",
  ].includes(normalized);
}

function suggestedActionForRow(
  status: CsvDryRunEditableRow["status"],
  issueCodes: BrokerExecutionCsvImportIssueCode[],
): string {
  if (status === "accepted") {
    return "No row repair needed.";
  }

  if (issueCodes.includes("row_missing_symbol")) {
    return "Add the missing ticker symbol, then review the preview again.";
  }

  if (
    issueCodes.includes("row_missing_timestamp") ||
    issueCodes.includes("row_invalid_timestamp")
  ) {
    return "Fix the date/time cell or confirm the account timezone.";
  }

  if (
    issueCodes.includes("row_missing_quantity") ||
    issueCodes.includes("row_invalid_quantity")
  ) {
    return "Enter a non-zero share quantity.";
  }

  if (
    issueCodes.includes("row_missing_price") ||
    issueCodes.includes("row_invalid_price")
  ) {
    return "Enter a positive execution price.";
  }

  if (issueCodes.includes("non_filled_order_skipped")) {
    return "Skipped orders can stay skipped if they were not filled.";
  }

  if (issueCodes.includes("options_row_rejected")) {
    return "Leave options out of stock analytics until options support exists.";
  }

  return status === "rejected"
    ? "Fix the row before trusting this import."
    : "Review this row before continuing.";
}

function buildRowRepairTable(
  csvText: string,
  preview: CsvDryRunImportExperience["preview"],
): CsvDryRunEditableRowRepairTable {
  const grid = parseCsvGrid(csvText);
  const headers = grid[0] ?? [];
  const outcomesByRow = new Map(
    preview.importResult.diagnostics.rowOutcomes.map((outcome) => [
      outcome.rowIndex,
      outcome,
    ]),
  );
  const editableRows = grid.slice(1, 21).map((row, index) => {
    const rowNumber = index + 2;
    const outcome = outcomesByRow.get(rowNumber);
    const status = (outcome?.status ??
      "unknown") as CsvDryRunEditableRow["status"];
    const issueCodes = outcome?.issueCodes ?? [];

    return {
      rowNumber,
      status,
      issueCodes,
      cells: headers.map((header, cellIndex) => ({
        header,
        value: row[cellIndex] ?? "",
        important: importantHeader(header),
      })),
      suggestedAction: suggestedActionForRow(status, issueCodes),
    };
  });

  return {
    headers,
    totalRows: Math.max(0, grid.length - 1),
    rejectedRowCount: editableRows.filter((row) => row.status === "rejected")
      .length,
    skippedRowCount: editableRows.filter((row) => row.status === "skipped")
      .length,
    editableRows,
    privacyReminder:
      "Edits update this dry-run CSV text only. Nothing is saved by this flow.",
  };
}

function cleanColumnMapping(
  mapping: BrokerExecutionCsvColumnMapping | undefined,
): BrokerExecutionCsvColumnMapping {
  if (!mapping) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(mapping)
      .map(([field, header]) => {
        const values = Array.isArray(header) ? header : header ? [header] : [];
        const cleaned = values.map((value) => value.trim()).filter(Boolean);

        return [field, cleaned];
      })
      .filter(([, values]) => (values as string[]).length > 0),
  ) as BrokerExecutionCsvColumnMapping;
}

function fieldHelper(field: BrokerExecutionCsvCanonicalField): string {
  switch (field) {
    case "symbol":
      return "Ticker or symbol column.";
    case "timestamp":
      return "Combined execution date/time column.";
    case "date":
      return "Date column when time is separate or absent.";
    case "time":
      return "Time column when date is separate.";
    case "side":
      return "Buy/sell action column.";
    case "quantity":
      return "Shares or filled quantity column.";
    case "price":
      return "Execution price or average fill price.";
    case "status":
      return "Filled/cancelled status column when present.";
    case "commission":
      return "Broker commission column when present.";
    case "fees":
      return "Fees column when present.";
    case "netAmount":
      return "Broker net amount column when present.";
    default:
      return "Optional broker column.";
  }
}

function buildColumnMappingAssistant(
  preview: CsvDryRunImportExperience["preview"],
  columnMapping: BrokerExecutionCsvColumnMapping,
): CsvDryRunColumnMappingAssistant {
  const detectedByField = new Map(
    preview.importResult.diagnostics.detectedColumns.map((column) => [
      column.field,
      column.header,
    ]),
  );
  const missing = preview.importResult.diagnostics.missingRequiredFields;
  const rows: CsvDryRunColumnMappingRow[] = [
    ...REQUIRED_MAPPING_FIELDS,
    ...REVIEW_MAPPING_FIELDS,
  ].map((field) => {
    const explicit = columnMapping[field];
    const explicitHeader = Array.isArray(explicit)
      ? explicit[0] ?? null
      : explicit ?? null;
    const detectedHeader = detectedByField.get(field) ?? null;
    const required = REQUIRED_MAPPING_FIELDS.includes(field);
    const status =
      detectedHeader || explicitHeader
        ? "mapped"
        : required || missing.includes(field)
          ? "missing"
          : "optional";

    return {
      field,
      required,
      detectedHeader,
      explicitHeader,
      status,
      helperText: fieldHelper(field),
    };
  });
  const timestampReady = Boolean(
    detectedByField.get("timestamp") ||
      columnMapping.timestamp ||
      detectedByField.get("date") ||
      columnMapping.date,
  );
  const missingRequiredFields = rows
    .filter((row) => row.required && row.status === "missing")
    .map((row) => row.field);
  const status: CsvDryRunColumnMappingAssistant["status"] =
    missingRequiredFields.length > 0 || !timestampReady
      ? "blocked"
      : preview.importResult.mappingConfidence.level === "low"
        ? "needs_review"
        : "ready";

  return {
    status,
    headers: preview.importResult.diagnostics.headers,
    rows,
    missingRequiredFields,
    suggestedNextMappingField:
      missingRequiredFields[0] ?? (!timestampReady ? "timestamp" : null),
    nextAction:
      status === "blocked"
        ? "Map the missing required columns before trusting the preview."
        : status === "needs_review"
          ? "Review the detected columns before continuing."
          : "Column mapping is ready for this dry run.",
  };
}

function buildConfidenceGate(
  preview: CsvDryRunImportExperience["preview"],
): CsvDryRunConfidenceGate {
  const quality = preview.productDiagnostics.qualityScore;
  const blockedReasons = [
    ...preview.productDiagnostics.commitPlan.blockedReasons,
    ...(preview.importResult.acceptedExecutionCount === 0
      ? ["No executions were accepted."]
      : []),
  ];
  const reviewReasons = [
    ...preview.productDiagnostics.commitPlan.reviewReasons,
    ...quality.reasons.filter((reason) => reason.toLowerCase().includes("review")),
  ];
  const status: CsvDryRunConfidenceGate["status"] =
    blockedReasons.length > 0 || quality.status === "blocked"
      ? "blocked"
      : reviewReasons.length > 0 || quality.status === "needs_review"
        ? "needs_review"
        : "ready";

  return {
    status,
    score: quality.score,
    title:
      status === "ready"
        ? "Ready for review"
        : status === "needs_review"
          ? "Needs review"
          : "Blocked",
    reasons: quality.reasons,
    blockedReasons,
    reviewReasons,
    canStartAnalysisLater: status === "ready",
    nextAction:
      status === "ready"
        ? "Review grouped trades before saving this import later."
        : status === "needs_review"
          ? "Inspect the warnings, mapping, and grouped trades before analysis."
          : "Fix blocking import issues before analysis can start.",
  };
}

function buildSessionState(
  args: {
    csvText: string;
    gate: CsvDryRunConfidenceGate;
    mapping: CsvDryRunColumnMappingAssistant;
    grouping: CsvDryRunTradeGroupingReview;
  },
): CsvDryRunSessionState {
  const hasCsv = args.csvText.trim().length > 0;
  const parsed = hasCsv && args.gate.score > 0;
  const mapped = args.mapping.status !== "blocked";
  const repaired = args.gate.status !== "blocked";
  const grouped = args.grouping.totalCount > 0;
  const ready = args.gate.status === "ready" && grouped;

  const stages: CsvDryRunSessionStage[] = [
    {
      id: "selected",
      label: "Choose data",
      status: hasCsv ? "complete" : "current",
      detail: hasCsv ? "CSV text is present." : "Paste CSV text or choose a sample.",
    },
    {
      id: "parsed",
      label: "Parse rows",
      status: parsed ? "complete" : hasCsv ? "current" : "upcoming",
      detail: parsed ? "Rows were parsed by the import preview." : "Parser is waiting for usable CSV data.",
    },
    {
      id: "mapped",
      label: "Map columns",
      status: mapped ? "complete" : parsed ? "blocked" : "upcoming",
      detail: args.mapping.nextAction,
    },
    {
      id: "repaired",
      label: "Resolve repairs",
      status: repaired ? "complete" : mapped ? "blocked" : "upcoming",
      detail: args.gate.nextAction,
    },
    {
      id: "grouped",
      label: "Review trades",
      status: grouped ? "complete" : repaired ? "current" : "upcoming",
      detail: grouped
        ? `${args.grouping.totalCount} grouped trade(s) are ready to inspect.`
        : "Grouped trades will appear after executions are accepted.",
    },
    {
      id: "ready_for_analysis",
      label: "Ready later",
      status: ready ? "complete" : args.gate.status === "blocked" ? "blocked" : "upcoming",
      detail: ready
        ? "This dry run could become saved analysis after persistence exists."
        : "Saving and analysis are intentionally deferred in this rough UI.",
    },
  ];

  return {
    id: "csv-dry-run-session",
    status: ready
      ? "ready_for_analysis"
      : args.gate.status === "blocked"
        ? "blocked"
        : hasCsv
          ? "in_progress"
          : "not_started",
    stages,
    nextAction:
      stages.find((stage) => stage.status === "blocked" || stage.status === "current")
        ?.detail ?? "Review the dry-run preview.",
  };
}

function buildTradeGroupingReview(
  preview: CsvDryRunImportExperience["preview"],
): CsvDryRunTradeGroupingReview {
  const reconstructionByIndex = new Map(
    preview.productDiagnostics.reconstructionPreview.items.map((item) => [
      item.requestIndex,
      item,
    ]),
  );
  const items: CsvDryRunTradeGroupingReviewItem[] =
    preview.importResult.groupingDiagnostics.map((diagnostic) => {
      const reconstruction = reconstructionByIndex.get(diagnostic.requestIndex);
      const request = preview.importResult.requests[diagnostic.requestIndex];
      const session = request?.sessionContext;

      return {
        requestIndex: diagnostic.requestIndex,
        symbol: diagnostic.symbol,
        tradeDirection: diagnostic.tradeDirection,
        lifecycleStatus: diagnostic.lifecycleStatus,
        groupingReason: diagnostic.groupingReason,
        executionCount: diagnostic.executionCount,
        rowIndexes: diagnostic.rowIndexes,
        finalPositionShares: diagnostic.finalPositionShares,
        entrySessionBucket: String(
          session?.entrySessionBucket ?? session?.sessionBucket ?? "unknown",
        ),
        entryHourLabelEt: session?.entryHourLabelEt ?? "",
        heldSessionBuckets: (session?.heldSessionBuckets ?? []).map(String),
        heldHourBucketsEt: session?.heldHourBucketsEt ?? [],
        heldPremarketIntoOpen: session?.heldPremarketIntoOpen ?? false,
        heldOpenIntoMidday: session?.heldOpenIntoMidday ?? false,
        heldMiddayIntoPostmarket:
          session?.heldMiddayIntoPostmarket ?? false,
        heldPostmarketIntoOvernight:
          session?.heldPostmarketIntoOvernight ?? false,
        heldOvernight: session?.heldOvernight ?? false,
        needsReview:
          diagnostic.lifecycleStatus === "open" ||
          diagnostic.groupingReason !== "flat_position" ||
          (reconstruction?.needsReview ?? false),
        warnings: [
          ...diagnostic.notes,
          ...(reconstruction?.warnings ?? []),
        ],
        timeline:
          reconstruction?.timeline.map((step) => ({
            index: step.index,
            rowIndex: step.rowIndex,
            timestamp: step.timestamp,
            side: step.side,
            shares: step.shares,
            price: step.price,
            positionAfterExecution: step.positionAfterExecution,
          })) ?? [],
      };
    });

  return {
    totalCount: items.length,
    needsReviewCount: items.filter((item) => item.needsReview).length,
    items,
  };
}

function option(
  kind: CsvDryRunGroupingDecisionKind,
  label: string,
  detail: string,
  recommended: boolean,
): CsvDryRunGroupingDecisionOption {
  return {
    kind,
    label,
    detail,
    recommended,
  };
}

function recommendedGroupingDecision(
  item: CsvDryRunTradeGroupingReviewItem,
): CsvDryRunGroupingDecisionKind {
  if (item.lifecycleStatus === "open") {
    return "review_open_position";
  }

  if (item.groupingReason === "time_gap_split") {
    return "split_later";
  }

  if (item.groupingReason === "session_boundary_split") {
    return "mark_separate_trade";
  }

  return item.needsReview ? "confirm_grouping" : "confirm_grouping";
}

function buildGroupingDecisionReview(
  grouping: CsvDryRunTradeGroupingReview,
): CsvDryRunGroupingDecisionReview {
  const items = grouping.items.map((item) => {
    const recommendation = recommendedGroupingDecision(item);

    return {
      requestIndex: item.requestIndex,
      symbol: item.symbol,
      currentRecommendation: recommendation,
      options: [
        option(
          "confirm_grouping",
          "Confirm grouping",
          "These executions should remain one grouped trade later.",
          recommendation === "confirm_grouping",
        ),
        option(
          "split_later",
          "Split later",
          "The user thinks this grouped result should become multiple trades.",
          recommendation === "split_later",
        ),
        option(
          "merge_later",
          "Merge later",
          "The user thinks this trade should be merged with another grouped result.",
          recommendation === "merge_later",
        ),
        option(
          "mark_separate_trade",
          "Mark separate",
          "The user agrees this should stay separate from adjacent activity.",
          recommendation === "mark_separate_trade",
        ),
        option(
          "review_open_position",
          "Review open position",
          "The import leaves shares open, so final feedback should wait.",
          recommendation === "review_open_position",
        ),
      ],
      persistenceStatus: "client_state_only" as const,
    };
  });

  return {
    totalCount: items.length,
    reviewNeededCount: items.filter(
      (item) => item.currentRecommendation !== "confirm_grouping",
    ).length,
    items,
  };
}

function buildExecutionFeedbackPreview(
  preview: CsvDryRunImportExperience["preview"],
): CsvDryRunExecutionFeedbackPreview {
  const items: CsvDryRunExecutionFeedbackPreviewItem[] =
    preview.importResult.requests.map((request, requestIndex) => {
      const result = runExecutionFeedback(request, {
        generatedAt: "2026-05-03T19:00:00.000Z",
      });
      const summary = result.summary;

      return {
        requestIndex,
        symbol: result.symbol,
        status: result.status,
        tradeLabel: summary
          ? `${summary.symbol} ${summary.tradeDirection}`
          : result.symbol ?? `Trade ${requestIndex + 1}`,
        grossRealizedPnl: summary?.executionOnlyPnl.grossRealizedPnl ?? null,
        primaryFocusLabel: primaryExecutionFeedbackPreviewLabel(
          summary?.points.primaryFocus,
        ),
        topRiskLabel: primaryExecutionFeedbackPreviewLabel(
          summary?.points.risks[0],
        ),
        topStrengthLabel: primaryExecutionFeedbackPreviewLabel(
          summary?.points.strengths[0],
        ),
        warningCount:
          (summary?.warnings.length ?? 0) + result.validation.issues.length,
        limitations: summary?.limitations ?? [
          "Execution feedback could not be produced for this grouped trade.",
        ],
      };
    });

  return {
    totalCount: items.length,
    completedCount: items.filter((item) => item.status === "completed").length,
    failedCount: items.filter((item) => item.status !== "completed").length,
    source: "executions_only",
    marketContextUsed: false,
    items,
  };
}

function roleForReplayStep(args: {
  index: number;
  previousPosition: number;
  nextPosition: number;
  sawReduction: boolean;
}): { roleLabel: string; riskDirection: CsvDryRunReplayPreviewStep["riskDirection"] } {
  const previousAbs = Math.abs(args.previousPosition);
  const nextAbs = Math.abs(args.nextPosition);
  const increased = nextAbs > previousAbs;
  const reduced = previousAbs > 0 && nextAbs < previousAbs;
  const closed = previousAbs > 0 && nextAbs === 0;

  if (args.index === 0) {
    return { roleLabel: "Initial entry", riskDirection: "increased" };
  }

  if (closed) {
    return { roleLabel: "Full exit", riskDirection: "closed" };
  }

  if (reduced) {
    return { roleLabel: "Trim", riskDirection: "reduced" };
  }

  if (increased && args.sawReduction) {
    return { roleLabel: "Re-add", riskDirection: "increased" };
  }

  if (increased) {
    return { roleLabel: "Add", riskDirection: "increased" };
  }

  return { roleLabel: "Unchanged", riskDirection: "unchanged" };
}

function buildReplayPreview(
  grouping: CsvDryRunTradeGroupingReview,
): CsvDryRunReplayPreview {
  const first = grouping.items[0] ?? null;

  if (!first) {
    return {
      tradeLabel: null,
      lifecycleStatus: "none",
      openPositionWarning: null,
      steps: [],
    };
  }

  let previousPosition = 0;
  let sawReduction = false;
  const steps = first.timeline.map((step) => {
    const role = roleForReplayStep({
      index: step.index,
      previousPosition,
      nextPosition: step.positionAfterExecution,
      sawReduction,
    });

    if (role.riskDirection === "reduced" || role.riskDirection === "closed") {
      sawReduction = true;
    }

    previousPosition = step.positionAfterExecution;

    return {
      index: step.index,
      timestamp: step.timestamp,
      side: step.side,
      shares: step.shares,
      price: step.price,
      positionAfterExecution: step.positionAfterExecution,
      roleLabel: role.roleLabel,
      riskDirection: role.riskDirection,
    };
  });

  return {
    tradeLabel: `${first.symbol} ${first.tradeDirection}`,
    lifecycleStatus: first.lifecycleStatus,
    openPositionWarning:
      first.lifecycleStatus === "open"
        ? "This preview ends with shares still open."
        : null,
    steps,
  };
}

function buildFirstTradeWalkthrough(args: {
  gate: CsvDryRunConfidenceGate;
  grouping: CsvDryRunTradeGroupingReview;
  feedback: CsvDryRunExecutionFeedbackPreview;
}): CsvDryRunFirstTradeReviewWalkthrough {
  const first = args.grouping.items[0] ?? null;
  const blocked = args.gate.status === "blocked";
  const hasFeedback = args.feedback.completedCount > 0;

  return {
    title: "First Trade Review Walkthrough",
    tradeLabel: first ? `${first.symbol} ${first.tradeDirection}` : null,
    steps: [
      {
        id: "choose_csv",
        label: "Choose or paste CSV",
        status: first || args.gate.score > 0 ? "complete" : "current",
        detail: "Select a sample, open a local CSV, or paste CSV text.",
        href: null,
      },
      {
        id: "confirm_broker",
        label: "Confirm broker",
        status: args.gate.score > 0 ? "complete" : "upcoming",
        detail: "Make sure the selected broker/export shape matches the CSV.",
        href: null,
      },
      {
        id: "confirm_columns",
        label: "Confirm columns",
        status: blocked ? "blocked" : "complete",
        detail: "Check symbol, side, quantity, price, and time mapping.",
        href: null,
      },
      {
        id: "repair_rows",
        label: "Repair rows",
        status: blocked ? "current" : "complete",
        detail: args.gate.nextAction,
        href: null,
      },
      {
        id: "confirm_grouping",
        label: "Confirm grouped executions",
        status: first ? "complete" : blocked ? "blocked" : "current",
        detail: first
          ? `${first.executionCount} execution(s) grouped as ${first.lifecycleStatus}.`
          : "No grouped trade is ready yet.",
        href: null,
      },
      {
        id: "preview_feedback",
        label: "Preview feedback",
        status: hasFeedback ? "complete" : blocked ? "blocked" : "upcoming",
        detail: hasFeedback
          ? "Execution-only feedback preview is available in this dry run."
          : "Feedback preview appears after at least one valid grouped trade.",
        href: null,
      },
      {
        id: "inspect_replay",
        label: "Inspect replay",
        status: first && !blocked ? "complete" : "upcoming",
        detail: "Use the dry-run replay before saving exists.",
        href: null,
      },
      {
        id: "review_warnings",
        label: "Check warnings",
        status: first?.needsReview ? "current" : first ? "complete" : "upcoming",
        detail:
          first?.warnings[0] ??
          "No grouping warnings are attached to the first grouped trade.",
        href: null,
      },
      {
        id: "save_later",
        label: "Save later",
        status: args.gate.status === "ready" ? "upcoming" : "blocked",
        detail: "Saving and full analytics start after persistence exists.",
        href: null,
      },
    ],
    nextAction:
      first && !blocked
        ? "Inspect grouping, feedback, and replay before saving exists."
        : "Fix the dry-run import before starting a trade review.",
  };
}

function brokerLabel(broker: BrokerExecutionCsvFormat): string {
  switch (broker) {
    case "auto":
      return "Auto detect";
    case "ibkr_activity_statement":
      return "IBKR";
    case "moomoo_trade_history":
      return "Moomoo";
    case "webull_order_history":
      return "Webull";
    case "robinhood_transaction_history":
      return "Robinhood";
    case "schwab_transactions":
      return "Schwab";
    case "generic_execution_csv":
      return "Generic CSV";
  }
}

function buildBrokerCoveragePanel(
  broker: BrokerExecutionCsvFormat,
): CsvDryRunBrokerCoveragePanel {
  const confidence =
    broker === "generic_execution_csv" || broker === "auto"
      ? "best_effort"
      : broker === "moomoo_trade_history"
        ? "observed"
        : "official";

  return {
    selectedBroker: broker,
    selectedBrokerLabel: brokerLabel(broker),
    confidence,
    supportCopy:
      broker === "generic_execution_csv" || broker === "auto"
        ? "Generic mapping works best when the file has clear symbol, side, shares, price, and time columns."
        : `${brokerLabel(broker)} support is represented by synthetic compatibility fixtures and parser tests.`,
    coverageLabels: [
      "Closed stock trade preview",
      "Column mapping diagnostics",
      "Grouped trade review",
      "Repair workflow",
    ],
    limitation:
      "Broker coverage is representative and will need anonymized real examples before product calibration.",
  };
}

function buildBrokerHelpPanel(
  broker: BrokerExecutionCsvFormat,
): CsvDryRunBrokerHelpPanel {
  const label = brokerLabel(broker);
  const common = {
    requiredFields: ["symbol", "side/action", "quantity/shares", "price", "date/time"],
    fallbackPath:
      "Use Generic CSV with explicit column mapping when the broker export does not match a known fixture.",
    limitation:
      "This is representative import guidance, not exhaustive broker certification.",
  };

  switch (broker) {
    case "ibkr_activity_statement":
      return {
        broker,
        title: "IBKR Import Help",
        expectedExportName: "Activity Statement or Flex Trades CSV",
        requiredFields: ["Symbol", "Date/Time or Trade Date", "Quantity", "T. Price"],
        commonGotchas: [
          "IBKR may use signed quantities instead of a separate side column.",
          "Statement preamble rows are allowed if a trade header row exists.",
        ],
        supportConfidence: "official",
        fallbackPath: common.fallbackPath,
        limitation: common.limitation,
      };
    case "webull_order_history":
      return {
        broker,
        title: "Webull Import Help",
        expectedExportName: "Order History CSV",
        requiredFields: ["Symbol", "Side", "Filled Qty", "Avg Price", "Filled Time"],
        commonGotchas: [
          "Cancelled or working orders are skipped when a status column is present.",
          "Partially filled rows should still include filled quantity and average price.",
        ],
        supportConfidence: "official",
        fallbackPath: common.fallbackPath,
        limitation: common.limitation,
      };
    case "robinhood_transaction_history":
      return {
        broker,
        title: "Robinhood Import Help",
        expectedExportName: "Transaction History or Account Activity CSV",
        requiredFields: ["Activity Date", "Instrument", "Transaction Type", "Quantity", "Average Price"],
        commonGotchas: [
          "Some rows may be account activity rather than executions.",
          "Dates without times are treated as broker-local session rows.",
        ],
        supportConfidence: "official",
        fallbackPath: common.fallbackPath,
        limitation: common.limitation,
      };
    case "moomoo_trade_history":
      return {
        broker,
        title: "Moomoo Import Help",
        expectedExportName: "Trade History CSV",
        requiredFields: ["Instrument Code", "Transaction Type", "Filled Quantity", "Average Price"],
        commonGotchas: [
          "Headers can vary by region.",
          "Use explicit column mapping if the export labels differ.",
        ],
        supportConfidence: "observed",
        fallbackPath: common.fallbackPath,
        limitation: common.limitation,
      };
    case "schwab_transactions":
      return {
        broker,
        title: "Schwab Import Help",
        expectedExportName: "Transactions CSV",
        requiredFields: ["Date", "Action", "Symbol", "Quantity", "Price"],
        commonGotchas: [
          "Dividend and account activity rows should be skipped.",
          "Fees & Comm can help net P/L preview when present.",
        ],
        supportConfidence: "official",
        fallbackPath: common.fallbackPath,
        limitation: common.limitation,
      };
    case "auto":
    case "generic_execution_csv":
      return {
        broker,
        title: `${label} Import Help`,
        expectedExportName: "Plain execution ledger CSV",
        requiredFields: common.requiredFields,
        commonGotchas: [
          "Unknown headers may need explicit mapping.",
          "One row should represent one filled execution.",
        ],
        supportConfidence: "best_effort",
        fallbackPath: common.fallbackPath,
        limitation: common.limitation,
      };
  }
}

const ERROR_LIBRARY: CsvDryRunErrorLibraryEntry[] = [
  {
    issueCode: "missing_required_column",
    title: "Required column missing",
    whyItHappened: "The parser could not find a required execution field.",
    howToFix: "Map the missing column or paste a CSV with symbol, side, quantity, price, and time fields.",
    canContinue: false,
  },
  {
    issueCode: "row_missing_symbol",
    title: "Missing symbol",
    whyItHappened: "At least one execution row does not include a ticker.",
    howToFix: "Edit the row symbol cell, then let the dry run re-parse the CSV.",
    canContinue: false,
  },
  {
    issueCode: "row_invalid_timestamp",
    title: "Invalid timestamp",
    whyItHappened: "A row date/time could not be parsed.",
    howToFix: "Correct the timestamp or choose the correct account timezone.",
    canContinue: false,
  },
  {
    issueCode: "row_missing_side",
    title: "Missing side",
    whyItHappened: "The row does not say buy or sell and does not use a signed quantity the parser can infer.",
    howToFix: "Map or edit the side/action column.",
    canContinue: false,
  },
  {
    issueCode: "row_invalid_quantity",
    title: "Invalid quantity",
    whyItHappened: "The share quantity is missing, zero, or not numeric.",
    howToFix: "Edit the quantity cell to the filled share amount.",
    canContinue: false,
  },
  {
    issueCode: "row_invalid_price",
    title: "Invalid price",
    whyItHappened: "The execution price is missing or not positive.",
    howToFix: "Edit the price cell to the execution or average fill price.",
    canContinue: false,
  },
  {
    issueCode: "low_mapping_confidence",
    title: "Low mapping confidence",
    whyItHappened: "The headers do not strongly match a known broker shape.",
    howToFix: "Confirm or enter explicit column mappings.",
    canContinue: true,
  },
  {
    issueCode: "non_filled_order_skipped",
    title: "Non-filled row skipped",
    whyItHappened: "The broker row looks cancelled, working, pending, or not filled.",
    howToFix: "Continue if this row was not an execution.",
    canContinue: true,
  },
  {
    issueCode: "options_row_rejected",
    title: "Options row rejected",
    whyItHappened: "The stock analytics flow does not treat option contracts as stock shares.",
    howToFix: "Keep this row out until a dedicated options workflow exists.",
    canContinue: false,
  },
  {
    issueCode: "pnl_reconciliation_mismatch",
    title: "P/L mismatch",
    whyItHappened: "Broker net amount and app gross-minus-costs do not agree.",
    howToFix: "Review fees, commissions, and amount columns before saving later.",
    canContinue: true,
  },
  {
    issueCode: "open_position",
    title: "Open position",
    whyItHappened: "The import ends with shares still open.",
    howToFix: "Review the grouped trade and wait for closing executions before final closed-trade conclusions.",
    canContinue: true,
  },
  {
    issueCode: "duplicate_trade_in_import",
    title: "Duplicate file or trade",
    whyItHappened: "The app has seen the same file or request fingerprint.",
    howToFix: "Use the existing result instead of saving duplicate data later.",
    canContinue: false,
  },
];

function buildErrorLibrary(args: {
  preview: CsvDryRunImportExperience["preview"];
  grouping: CsvDryRunTradeGroupingReview;
}): CsvDryRunErrorLibrary {
  const issueCodes = new Set<string>([
    ...args.preview.importResult.issues.map((issue) => issue.code),
    ...args.preview.productDiagnostics.repairWorkflow.items.map(
      (item) => item.issueCode,
    ),
    ...(args.preview.productDiagnostics.pnlReconciliation.mismatchCount > 0
      ? ["pnl_reconciliation_mismatch"]
      : []),
    ...(args.grouping.items.some((item) => item.lifecycleStatus === "open")
      ? ["open_position"]
      : []),
  ]);
  const entries = ERROR_LIBRARY.filter((entry) =>
    issueCodes.has(entry.issueCode),
  );

  return {
    totalCount: ERROR_LIBRARY.length,
    matchedCount: entries.length,
    entries,
  };
}

function buildEvidenceDrillIn(args: {
  preview: CsvDryRunImportExperience["preview"];
  gate: CsvDryRunConfidenceGate;
  grouping: CsvDryRunTradeGroupingReview;
  feedback: CsvDryRunExecutionFeedbackPreview;
  analytics?: DryRunAnalyticsContext;
}): CsvDryRunEvidenceDrillIn {
  const repairRecords: CsvDryRunEvidenceRecord[] =
    args.preview.productDiagnostics.repairWorkflow.items.slice(0, 6).map((item) => ({
      id: `evidence:${item.id}`,
      title: item.title,
      source: "import_repair",
      evidenceLabels: [item.issueCode, item.severity],
      sourceFacts: [
        item.detail,
        item.suggestedFix,
        item.rowIndex ? `Row ${item.rowIndex}` : "No row number attached",
      ],
      relatedTradeIds: [],
      limitation: "Repair evidence comes from CSV diagnostics, not market context.",
    }));
  const gateRecord: CsvDryRunEvidenceRecord = {
    id: "evidence:confidence-gate",
    title: args.gate.title,
    source: "confidence_gate",
    evidenceLabels: [`Score ${args.gate.score}`, args.gate.status],
    sourceFacts: [
      ...args.gate.blockedReasons,
      ...args.gate.reviewReasons,
      ...args.gate.reasons,
    ].slice(0, 6),
    relatedTradeIds: [],
    limitation: "The gate protects analysis readiness; it does not score trader skill.",
  };
  const groupingRecords: CsvDryRunEvidenceRecord[] =
    args.grouping.items.filter((item) => item.needsReview).slice(0, 4).map((item) => ({
      id: `evidence:grouping:${item.requestIndex}`,
      title: `${item.symbol} grouping review`,
      source: "grouping",
      evidenceLabels: [item.groupingReason, item.lifecycleStatus],
      sourceFacts: [
        `${item.executionCount} execution(s)`,
        `Rows ${item.rowIndexes.join(", ")}`,
        `Final position ${item.finalPositionShares}`,
        ...item.warnings,
      ],
      relatedTradeIds: [],
      limitation: "Grouping evidence explains execution reconstruction before saved analysis.",
    }));
  const sampleMistakeRecords: CsvDryRunEvidenceRecord[] =
    args.analytics?.productIntelligence.mistakeTaxonomy.observations
      .slice(0, 3)
      .map((observation) => ({
        id: `evidence:sample-mistake:${observation.taxonomyId}`,
        title: observation.label,
        source: "sample_mistake",
        evidenceLabels: [
          `${observation.occurrenceCount} occurrence(s)`,
          observation.confidence,
        ],
        sourceFacts: [observation.reason, observation.suggestedReviewAction],
        relatedTradeIds: observation.tradeIds,
        limitation: "Sample mistake evidence comes from existing saved sample trades.",
      })) ?? [];
  const feedbackRecords: CsvDryRunEvidenceRecord[] = args.feedback.items
    .slice(0, 3)
    .map((item) => ({
      id: `evidence:feedback:${item.requestIndex}`,
      title: item.tradeLabel,
      source: "feedback_preview",
      evidenceLabels: [
        item.primaryFocusLabel ?? "No primary focus",
        item.status,
      ],
      sourceFacts: [
        item.topRiskLabel ?? "No top risk",
        item.topStrengthLabel ?? "No top strength",
        `Execution-only P/L ${item.grossRealizedPnl ?? "n/a"}`,
      ],
      relatedTradeIds: [],
      limitation: "Feedback preview is not saved and does not use market context.",
    }));
  const records = [
    gateRecord,
    ...repairRecords,
    ...groupingRecords,
    ...feedbackRecords,
    ...sampleMistakeRecords,
  ];

  return {
    totalCount: records.length,
    records,
  };
}

function buildCopyAudit(args: {
  gate: CsvDryRunConfidenceGate;
  mapping: CsvDryRunColumnMappingAssistant;
  walkthrough: CsvDryRunFirstTradeReviewWalkthrough;
  calibration: CsvDryRunCalibrationQueue;
  privacy: CsvDryRunPrivacyNotice;
  brokerHelp: CsvDryRunBrokerHelpPanel;
}): CsvDryRunCopyAudit {
  const safeCopyExamples = [
    {
      id: "dry_run",
      label: "Dry run",
      copy: "Preview this CSV before saving trades later.",
    },
    {
      id: "mapping",
      label: "Mapping",
      copy: "Confirm the columns the app will use for symbol, side, shares, price, and time.",
    },
    {
      id: "confidence",
      label: "Confidence",
      copy: args.gate.nextAction,
    },
    {
      id: "calibration",
      label: "Calibration",
      copy: "Calibration waits for real imports and review outcomes.",
    },
  ];
  const audit = buildProductCopyQualitySystem({
    texts: [
      { sourceId: "gate", text: args.gate.nextAction },
      { sourceId: "mapping", text: args.mapping.nextAction },
      { sourceId: "walkthrough", text: args.walkthrough.nextAction },
      { sourceId: "privacy", text: `${args.privacy.title}: ${args.privacy.body}` },
      { sourceId: "broker-help", text: args.brokerHelp.limitation },
      ...args.calibration.items.map((item) => ({
        sourceId: item.id,
        text: `${item.label}: ${item.reason}`,
      })),
      ...safeCopyExamples.map((item) => ({
        sourceId: `safe:${item.id}`,
        text: item.copy,
      })),
    ],
  });

  return {
    passed: audit.passed,
    checkedTextCount: audit.checkedTextCount,
    forbiddenPhrases: audit.forbiddenPhrases,
    issues: audit.issues,
    safeCopyExamples,
  };
}

function buildPrivacyNotice(): CsvDryRunPrivacyNotice {
  return {
    title: "Dry-run privacy",
    body:
      "This flow previews pasted or local CSV text in the current app session and does not save imported trades.",
    bullets: [
      "No saved import is created here.",
      "No broker CSV export or download feature is added.",
      "Full analytics starts later after persistence exists.",
    ],
    savedInThisFlow: false,
  };
}

function buildMobileQaPanel(): CsvDryRunMobileQaPanel {
  const panels = [
    "CSV input",
    "Mapping table",
    "Row repair table",
    "Grouped trade review",
    "Feedback preview",
    "Replay preview",
    "Broker help",
  ];

  return {
    totalCount: panels.length,
    items: panels.map((panel) => ({
      id: `mobile-qa:import-dry-run:${panel.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      route: "/intelligence/import-dry-run",
      viewport: "mobile" as const,
      status: "contract_ready" as const,
      checks: [
        `${panel} stacks without horizontal page scrolling.`,
        "No export or download controls are visible.",
        "Primary next action remains readable on mobile.",
      ],
    })),
  };
}

function buildRepairImpactDiff(args: {
  preview: CsvDryRunImportExperience["preview"];
  gate: CsvDryRunConfidenceGate;
  grouping: CsvDryRunTradeGroupingReview;
  baseline?: CsvDryRunRepairImpactSnapshot | null;
}) {
  const currentSnapshot: CsvDryRunRepairImpactSnapshot = {
    acceptedExecutionCount: args.preview.importResult.acceptedExecutionCount,
    rejectedRowCount: args.preview.importResult.rejectedRowCount,
    skippedRowCount: args.preview.importResult.skippedRowCount,
    groupedTradeCount: args.grouping.totalCount,
    confidenceScore: args.gate.score,
  };
  const baselineSnapshot = args.baseline ?? null;
  const delta = baselineSnapshot
    ? {
        acceptedExecutions:
          currentSnapshot.acceptedExecutionCount -
          baselineSnapshot.acceptedExecutionCount,
        rejectedRows:
          baselineSnapshot.rejectedRowCount - currentSnapshot.rejectedRowCount,
        skippedRows:
          baselineSnapshot.skippedRowCount - currentSnapshot.skippedRowCount,
        groupedTrades:
          currentSnapshot.groupedTradeCount - baselineSnapshot.groupedTradeCount,
        confidenceScore:
          currentSnapshot.confidenceScore - baselineSnapshot.confidenceScore,
      }
    : {
        acceptedExecutions: 0,
        rejectedRows: 0,
        skippedRows: 0,
        groupedTrades: 0,
        confidenceScore: 0,
      };
  const remainingRepairCount =
    args.preview.productDiagnostics.repairWorkflow.fixRequiredCount;

  return {
    hasBaseline: Boolean(baselineSnapshot),
    baselineSnapshot,
    currentSnapshot,
    delta,
    remainingRepairCount,
    summary: baselineSnapshot
      ? `Repair impact: ${delta.acceptedExecutions >= 0 ? "+" : ""}${delta.acceptedExecutions} accepted execution(s), ${delta.rejectedRows >= 0 ? "+" : ""}${delta.rejectedRows} rejected row(s) fixed, ${delta.confidenceScore >= 0 ? "+" : ""}${delta.confidenceScore} confidence.`
      : "Edit a repair row to compare this preview against the previous parser state.",
    nextAction:
      remainingRepairCount > 0
        ? "Fix the remaining rejected rows before trusting the preview."
        : args.gate.status === "ready"
          ? "Review grouped trades and feedback preview before saving exists."
          : args.gate.nextAction,
  };
}

function readinessDimension(args: {
  id: CsvDryRunReadinessDimension["id"];
  label: string;
  score: number;
  status: CsvDryRunReadinessDimension["status"];
  detail: string;
  nextAction: string;
  weight: number;
}): CsvDryRunReadinessDimension {
  return {
    ...args,
    score: clampScore(args.score),
  };
}

function buildReadinessScoreBreakdown(args: {
  preview: CsvDryRunImportExperience["preview"];
  mapping: CsvDryRunColumnMappingAssistant;
  grouping: CsvDryRunTradeGroupingReview;
  brokerCoverage: CsvDryRunBrokerCoveragePanel;
}) {
  const importResult = args.preview.importResult;
  const rowCount = Math.max(1, importResult.rowCount);
  const duplicateCount =
    importResult.diagnostics.duplicateRequestFingerprints.length +
    (args.preview.fileAlreadyImported ? 1 : 0);
  const pnl = args.preview.productDiagnostics.pnlReconciliation;
  const brokerScore =
    args.brokerCoverage.confidence === "official"
      ? 95
      : args.brokerCoverage.confidence === "observed"
        ? 80
        : 65;
  const dimensions = [
    readinessDimension({
      id: "column_mapping",
      label: "Column mapping",
      score:
        args.mapping.status === "blocked"
          ? 25
          : importResult.mappingConfidence.score,
      status: args.mapping.status === "blocked" ? "blocked" : args.mapping.status === "needs_review" ? "needs_review" : "ready",
      detail:
        args.mapping.missingRequiredFields.length > 0
          ? `${args.mapping.missingRequiredFields.join(", ")} still need mapping.`
          : `${importResult.mappingConfidence.detectedColumnCount} detected column(s) matched.`,
      nextAction: args.mapping.nextAction,
      weight: 0.24,
    }),
    readinessDimension({
      id: "row_validity",
      label: "Row validity",
      score:
        importResult.rowCount === 0
          ? 0
          : 100 - (importResult.rejectedRowCount / rowCount) * 100,
      status:
        importResult.rejectedRowCount > 0
          ? "blocked"
          : importResult.skippedRowCount > 0
            ? "needs_review"
            : "ready",
      detail: `${importResult.acceptedExecutionCount} accepted, ${importResult.rejectedRowCount} rejected, ${importResult.skippedRowCount} skipped.`,
      nextAction:
        importResult.rejectedRowCount > 0
          ? "Repair rejected rows first."
          : importResult.skippedRowCount > 0
            ? "Confirm skipped rows were not filled executions."
            : "Rows are usable for this dry run.",
      weight: 0.24,
    }),
    readinessDimension({
      id: "grouping_confidence",
      label: "Grouping confidence",
      score:
        args.grouping.totalCount === 0
          ? 20
          : 100 - (args.grouping.needsReviewCount / Math.max(1, args.grouping.totalCount)) * 45,
      status:
        args.grouping.totalCount === 0
          ? "blocked"
          : args.grouping.needsReviewCount > 0
            ? "needs_review"
            : "ready",
      detail: `${args.grouping.totalCount} grouped trade(s), ${args.grouping.needsReviewCount} need review.`,
      nextAction:
        args.grouping.needsReviewCount > 0
          ? "Review open or unusual grouped trades."
          : "Grouped trades look ready for this dry run.",
      weight: 0.18,
    }),
    readinessDimension({
      id: "pnl_confidence",
      label: "P/L confidence",
      score:
        pnl.mismatchCount > 0
          ? 55
          : pnl.needsReviewCount > 0
            ? 70
            : pnl.items.length > 0
              ? 90
              : 60,
      status:
        pnl.mismatchCount > 0 || pnl.needsReviewCount > 0
          ? "needs_review"
          : "ready",
      detail: `${pnl.matchedCount} matched, ${pnl.mismatchCount} mismatch, ${pnl.needsReviewCount} need review.`,
      nextAction:
        pnl.mismatchCount > 0
          ? "Review broker net amount, fees, commissions, and app P/L."
          : pnl.needsReviewCount > 0
            ? "Treat open or insufficient P/L as review-only."
            : "P/L diagnostics are ready for this dry run.",
      weight: 0.14,
    }),
    readinessDimension({
      id: "duplicate_risk",
      label: "Duplicate risk",
      score: duplicateCount > 0 ? 35 : 100,
      status: duplicateCount > 0 ? "blocked" : "ready",
      detail:
        duplicateCount > 0
          ? `${duplicateCount} duplicate fingerprint signal(s) found.`
          : "No duplicate fingerprint signals found.",
      nextAction:
        duplicateCount > 0
          ? "Resolve duplicate import risk before saving later."
          : "No duplicate action needed in this dry run.",
      weight: 0.1,
    }),
    readinessDimension({
      id: "broker_support",
      label: "Broker support",
      score: brokerScore,
      status:
        args.brokerCoverage.confidence === "best_effort"
          ? "needs_review"
          : "ready",
      detail: args.brokerCoverage.supportCopy,
      nextAction: args.brokerCoverage.limitation,
      weight: 0.1,
    }),
  ];
  const overallScore = clampScore(
    dimensions.reduce((total, dimension) => total + dimension.score * dimension.weight, 0),
  );
  const blockerCount = dimensions.filter((dimension) => dimension.status === "blocked").length;
  const reviewCount = dimensions.filter((dimension) => dimension.status === "needs_review").length;
  const status: CsvDryRunReadinessScoreBreakdown["status"] =
    blockerCount > 0 ? "blocked" : reviewCount > 0 ? "needs_review" : "ready";

  return {
    overallScore,
    status,
    blockerCount,
    reviewCount,
    dimensions,
    nextAction:
      dimensions.find((dimension) => dimension.status === "blocked")
        ?.nextAction ??
      dimensions.find((dimension) => dimension.status === "needs_review")
        ?.nextAction ??
      "Import is ready for this dry-run review.",
  };
}

function pnlExplanation(status: string): string {
  switch (status) {
    case "matched":
      return "Broker net and app gross-minus-known-costs are inside tolerance.";
    case "mismatch":
      return "Broker net and app gross-minus-known-costs differ outside tolerance.";
    case "broker_net_only":
      return "Broker net amount exists, but the app lacks enough cost detail for a full comparison.";
    case "no_broker_net":
      return "The file does not include broker net amount, so the app can only show its own gross/cost view.";
    case "open_or_insufficient":
      return "The grouped trade is open or missing enough information for final P/L reconciliation.";
    default:
      return "P/L reconciliation needs review.";
  }
}

function pnlAction(status: string): string {
  switch (status) {
    case "matched":
      return "No P/L repair action needed for this dry run.";
    case "mismatch":
      return "Review fees, commissions, net amount, and execution prices.";
    case "broker_net_only":
      return "Keep broker net visible and collect costs later if needed.";
    case "no_broker_net":
      return "Use gross execution-only P/L until broker net data exists.";
    case "open_or_insufficient":
      return "Wait for closing executions before final closed-trade P/L conclusions.";
    default:
      return "Review the P/L inputs before trusting this trade.";
  }
}

function buildPnlReconciliationAssistant(
  preview: CsvDryRunImportExperience["preview"],
): CsvDryRunPnlReconciliationAssistant {
  const items: CsvDryRunPnlReconciliationAssistantItem[] =
    preview.productDiagnostics.pnlReconciliation.items.map((item) => ({
      requestIndex: item.requestIndex,
      symbol: item.symbol,
      lifecycleStatus: item.lifecycleStatus,
      brokerNetAmountTotal: item.brokerNetAmountTotal,
      grossMinusKnownCosts: item.grossMinusKnownCosts,
      difference: item.difference,
      status: item.status,
      explanation: pnlExplanation(item.status),
      suggestedReviewAction: pnlAction(item.status),
    }));
  const mismatches = items.filter((item) => item.status === "mismatch");
  const worstMismatch =
    mismatches.sort(
      (left, right) =>
        Math.abs(right.difference ?? 0) - Math.abs(left.difference ?? 0),
    )[0] ?? null;
  const needsReviewCount = items.filter(
    (item) => item.status !== "matched",
  ).length;
  const status =
    items.length === 0
      ? "insufficient_data"
      : mismatches.length > 0 || needsReviewCount > 0
        ? "needs_review"
        : "ready";

  return {
    status,
    summary:
      status === "ready"
        ? "P/L reconciliation is clean for this dry run."
        : status === "needs_review"
          ? "P/L needs review before final saved analytics later."
          : "P/L reconciliation will appear after grouped trades exist.",
    mismatchCount: mismatches.length,
    needsReviewCount,
    worstMismatch,
    items,
  };
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildCostVisibility(
  preview: CsvDryRunImportExperience["preview"],
): CsvDryRunCostVisibilityPanel {
  const executions = preview.importResult.executions;
  const hasCommission = executions.some(
    (execution) => toNumber(execution.commission) !== null,
  );
  const hasFees = executions.some((execution) => toNumber(execution.fees) !== null);
  const hasBrokerNetAmount = executions.some(
    (execution) => toNumber(execution.netAmount) !== null,
  );
  const currencies = [
    ...new Set(
      executions
        .map((execution) =>
          typeof execution.currency === "string"
            ? execution.currency.trim().toUpperCase()
            : "",
        )
        .filter((currency) => currency !== ""),
    ),
  ].sort();
  const mixedCurrencies = currencies.length > 1;
  const items: CsvDryRunCostVisibilityItem[] =
    preview.productDiagnostics.netPnlPreview.items.map((item) => {
      const itemHasCosts = item.totalCommission > 0 || item.totalFees > 0;
      const status = mixedCurrencies
        ? "needs_review"
        : itemHasCosts || item.brokerNetAmountTotal !== null
          ? "costs_detected"
          : "no_costs_detected";

      return {
        requestIndex: item.requestIndex,
        symbol: item.symbol,
        lifecycleStatus: item.lifecycleStatus,
        currency: item.currency,
        totalCommission: roundMoney(item.totalCommission),
        totalFees: roundMoney(item.totalFees),
        totalCosts: roundMoney(item.totalCosts),
        brokerNetAmountTotal:
          item.brokerNetAmountTotal === null
            ? null
            : roundMoney(item.brokerNetAmountTotal),
        grossMinusKnownCosts: item.grossMinusKnownCosts,
        hasBrokerNetAmount: item.brokerNetAmountTotal !== null,
        status,
        detail:
          status === "needs_review"
            ? "Mixed currencies were detected; review costs before comparing net P/L."
            : itemHasCosts
              ? "Fees or commissions were parsed for this grouped trade."
              : item.brokerNetAmountTotal !== null
                ? "Broker net amount was parsed, but no separate fee or commission total was detected."
                : "No fee, commission, or broker net amount was parsed for this grouped trade.",
      };
    });
  const totalCommission = roundMoney(
    items.reduce((total, item) => total + item.totalCommission, 0),
  );
  const totalFees = roundMoney(
    items.reduce((total, item) => total + item.totalFees, 0),
  );
  const totalCosts = roundMoney(totalCommission + totalFees);
  const status =
    mixedCurrencies
      ? "needs_review"
      : hasCommission || hasFees || hasBrokerNetAmount || totalCosts > 0
        ? "costs_detected"
        : "no_costs_detected";

  return {
    status,
    summary:
      status === "needs_review"
        ? "Costs were parsed, but mixed currencies need review before net P/L is trusted."
        : status === "costs_detected"
          ? "Fees, commissions, or broker net amounts were detected and are visible for review."
          : "No fee, commission, or broker net amount data was detected in accepted executions.",
    acceptedExecutionCount: preview.importResult.acceptedExecutionCount,
    hasCommission,
    hasFees,
    hasBrokerNetAmount,
    totalCommission,
    totalFees,
    totalCosts,
    currencies,
    mixedCurrencies,
    scoringPolicy: "gross_execution_pnl_only",
    scoringPolicyDetail:
      "Execution feedback scoring remains gross-only; fees, commissions, and broker net amounts are import-review context for now.",
    items,
    marketContextUsed: false,
  };
}

function buildExecutionAnomalyDetector(args: {
  preview: CsvDryRunImportExperience["preview"];
  grouping: CsvDryRunTradeGroupingReview;
}): CsvDryRunExecutionAnomalyDetector {
  const items: CsvDryRunExecutionAnomaly[] = [];
  const rowOutcomes = args.preview.importResult.diagnostics.rowOutcomes;
  const issueRows = (code: string) =>
    rowOutcomes
      .filter((row) => row.issueCodes.includes(code as never))
      .map((row) => row.rowIndex);
  const invalidRows = rowOutcomes
    .filter((row) =>
      row.issueCodes.some((code) =>
        [
          "row_invalid_price",
          "row_missing_price",
          "row_invalid_quantity",
          "row_missing_quantity",
        ].includes(code),
      ),
    )
    .map((row) => row.rowIndex);

  if (invalidRows.length > 0) {
    items.push({
      id: "anomaly:invalid-price-or-size",
      type: "invalid_price_or_size",
      severity: "urgent",
      confidence: "high",
      title: "Invalid price or share size",
      evidence: [`Rows ${invalidRows.join(", ")} failed price/share validation.`],
      relatedRowIndexes: invalidRows,
      relatedRequestIndexes: [],
      suggestedAction: "Fix invalid price or share cells before trusting the preview.",
    });
  }

  const skippedRows = issueRows("non_filled_order_skipped");
  if (skippedRows.length > 0) {
    items.push({
      id: "anomaly:skipped-non-filled-order",
      type: "skipped_non_filled_order",
      severity: "info",
      confidence: "high",
      title: "Non-filled order skipped",
      evidence: [`Rows ${skippedRows.join(", ")} looked cancelled, working, or not filled.`],
      relatedRowIndexes: skippedRows,
      relatedRequestIndexes: [],
      suggestedAction: "Continue only if those rows were not real fills.",
    });
  }

  const optionRows = issueRows("options_row_rejected");
  if (optionRows.length > 0) {
    items.push({
      id: "anomaly:options-rejected",
      type: "options_row_rejected",
      severity: "review",
      confidence: "high",
      title: "Options row rejected",
      evidence: [`Rows ${optionRows.join(", ")} looked like options rows.`],
      relatedRowIndexes: optionRows,
      relatedRequestIndexes: [],
      suggestedAction: "Keep options out until a dedicated options workflow exists.",
    });
  }

  args.grouping.items
    .filter((item) => item.lifecycleStatus === "open")
    .forEach((item) => {
      items.push({
        id: `anomaly:open-leftover:${item.requestIndex}`,
        type: "open_leftover",
        severity: "info",
        confidence: "high",
        title: `${item.symbol} was not flat inside this CSV`,
        evidence: [`The selected CSV window ends with ${item.finalPositionShares} unmatched share(s).`],
        relatedRowIndexes: item.rowIndexes,
        relatedRequestIndexes: [item.requestIndex],
        suggestedAction:
          "Keep as an import-window note; completed-trade coaching should wait for a matched open and close.",
      });
    });

  args.grouping.items
    .filter((item) => item.groupingReason === "over_reduction_split")
    .forEach((item) => {
      items.push({
        id: `anomaly:over-reduction:${item.requestIndex}`,
        type: "over_reduction_or_reversal",
        severity: "review",
        confidence: "medium",
        title: `${item.symbol} over-reduction or reversal split`,
        evidence: [`Grouping reason: ${item.groupingReason}.`],
        relatedRowIndexes: item.rowIndexes,
        relatedRequestIndexes: [item.requestIndex],
        suggestedAction: "Confirm whether this should be one trade, a split, or a reversal.",
      });
    });

  args.grouping.items.forEach((item) => {
    const firstShares = Math.abs(item.timeline[0]?.shares ?? 0);
    const sizeJump = item.timeline.find(
      (step) => firstShares > 0 && Math.abs(step.shares) >= firstShares * 3,
    );

    if (sizeJump) {
      items.push({
        id: `anomaly:size-jump:${item.requestIndex}:${sizeJump.index}`,
        type: "huge_size_jump",
        severity: "info",
        confidence: "medium",
        title: `${item.symbol} share size changed`,
        evidence: [
          `Execution #${sizeJump.index + 1} used ${sizeJump.shares} shares vs first fill ${firstShares}.`,
        ],
        relatedRowIndexes: sizeJump.rowIndex ? [sizeJump.rowIndex] : item.rowIndexes,
        relatedRequestIndexes: [item.requestIndex],
        suggestedAction: "Keep as an advanced note unless the broker file itself looks wrong.",
      });
    }
  });

  const duplicateGroups = countBy(args.preview.importResult.executions, (execution) =>
    [
      execution.symbol,
      String(execution.timestamp),
      execution.side,
      String(execution.shares),
      String(execution.price),
    ].join("|"),
  );
  duplicateGroups.forEach((count, key) => {
    if (count > 1) {
      items.push({
        id: `anomaly:duplicate-like:${key}`,
        type: "duplicate_like_fill",
        severity:
          args.preview.importResult.broker === "generic_execution_csv"
            ? "review"
            : "info",
        confidence: "medium",
        title: "Duplicate-like fill cluster",
        evidence: [`${count} fills share the same symbol, timestamp, side, shares, and price.`],
        relatedRowIndexes: [],
        relatedRequestIndexes: [],
        suggestedAction: "Confirm whether these are separate fills or duplicate rows.",
      });
    }
  });

  const timestampGroups = countBy(args.preview.importResult.executions, (execution) =>
    `${execution.symbol}|${String(execution.timestamp)}`,
  );
  timestampGroups.forEach((count, key) => {
    if (count >= 3) {
      items.push({
        id: `anomaly:same-timestamp:${key}`,
        type: "same_timestamp_cluster",
        severity: "info",
        confidence: "medium",
        title: "Same-timestamp execution cluster",
        evidence: [`${count} fills share ${key.split("|")[1]}.`],
        relatedRowIndexes: [],
        relatedRequestIndexes: [],
        suggestedAction: "Confirm this is normal broker fill batching.",
      });
    }
  });

  args.preview.importResult.executions.forEach((execution, index) => {
    const shares = Math.abs(toNumber(execution.shares) ?? 0);
    const price = Math.abs(toNumber(execution.price) ?? 0);
    const commission = Math.abs(toNumber(execution.commission) ?? 0);
    const fees = Math.abs(toNumber(execution.fees) ?? 0);
    const tradeValue = shares * price;

    if (tradeValue > 0 && commission + fees > tradeValue) {
      items.push({
        id: `anomaly:fees-larger:${index}`,
        type: "fees_larger_than_trade_value",
        severity: "urgent",
        confidence: "high",
        title: "Fees larger than trade value",
        evidence: [`Fees/commission ${commission + fees} exceed trade value ${tradeValue}.`],
        relatedRowIndexes: [],
        relatedRequestIndexes: [],
        suggestedAction: "Check fee, commission, quantity, and price columns.",
      });
    }
  });

  return {
    totalCount: items.length,
    urgentCount: items.filter((item) => item.severity === "urgent").length,
    reviewCount: items.filter((item) => item.severity === "review").length,
    marketContextUsed: false,
    items,
  };
}

function buildPostImportReviewQueuePreview(args: {
  preview: CsvDryRunImportExperience["preview"];
  grouping: CsvDryRunTradeGroupingReview;
  feedback: CsvDryRunExecutionFeedbackPreview;
  pnl: CsvDryRunPnlReconciliationAssistant;
  anomalies: CsvDryRunExecutionAnomalyDetector;
}): CsvDryRunPostImportReviewQueuePreview {
  const items: CsvDryRunPostImportReviewQueueItem[] = [
    ...args.preview.productDiagnostics.repairWorkflow.items
      .filter((item) => item.severity !== "info")
      .slice(0, 8)
      .map((item) => ({
        id: `queue:repair:${item.id}`,
        lane: "repair" as const,
        priority: item.severity === "fix_required" ? 95 : 70,
        severity: item.severity === "fix_required" ? ("urgent" as const) : ("review" as const),
        title: item.title,
        reason: item.detail,
        relatedRowIndexes: item.rowIndex ? [item.rowIndex] : [],
        relatedRequestIndexes:
          item.requestIndex !== null && item.requestIndex !== undefined
            ? [item.requestIndex]
            : [],
        suggestedNextAction: item.suggestedFix,
      })),
    ...args.grouping.items
      .filter((item) => item.needsReview)
      .map((item) => ({
        id: `queue:grouping:${item.requestIndex}`,
        lane: "grouping" as const,
        priority: item.lifecycleStatus === "open" ? 88 : 76,
        severity: "review" as const,
        title: `${item.symbol} grouping review`,
        reason:
          item.lifecycleStatus === "open"
            ? "This grouped trade ends with shares still open."
            : item.warnings[0] ?? `Grouping reason: ${item.groupingReason}.`,
        relatedRowIndexes: item.rowIndexes,
        relatedRequestIndexes: [item.requestIndex],
        suggestedNextAction: "Confirm grouping, split later, or mark as open-position review.",
      })),
    ...args.pnl.items
      .filter((item) => item.status === "mismatch")
      .map((item) => ({
        id: `queue:pnl:${item.requestIndex}`,
        lane: "pnl" as const,
        priority: 74,
        severity: "review" as const,
        title: `${item.symbol} P/L reconciliation`,
        reason: item.explanation,
        relatedRowIndexes: [],
        relatedRequestIndexes: [item.requestIndex],
        suggestedNextAction: item.suggestedReviewAction,
      })),
    ...args.feedback.items
      .filter((item) => item.topRiskLabel)
      .map((item) => ({
        id: `queue:feedback:${item.requestIndex}`,
        lane: "feedback" as const,
        priority: 58,
        severity: "info" as const,
        title: item.topRiskLabel!,
        reason: `Execution-only preview focus for ${item.tradeLabel}.`,
        relatedRowIndexes: [],
        relatedRequestIndexes: [item.requestIndex],
        suggestedNextAction: "Review the execution sequence before saving exists.",
      })),
    ...args.anomalies.items.map((item) => ({
      id: `queue:${item.id}`,
      lane: "anomaly" as const,
      priority:
        item.severity === "urgent" ? 92 : item.severity === "review" ? 72 : 45,
      severity: item.severity,
      title: item.title,
      reason: item.evidence[0] ?? "Execution anomaly detected.",
      relatedRowIndexes: item.relatedRowIndexes,
      relatedRequestIndexes: item.relatedRequestIndexes,
      suggestedNextAction: item.suggestedAction,
    })),
    ...args.grouping.items
      .filter((item) => !item.needsReview)
      .map((item) => ({
        id: `queue:ready:${item.requestIndex}`,
        lane: "ready" as const,
        priority: 20,
        severity: "info" as const,
        title: `${item.symbol} ready for feedback preview`,
        reason: "Grouped trade is closed and ready for dry-run feedback review.",
        relatedRowIndexes: item.rowIndexes,
        relatedRequestIndexes: [item.requestIndex],
        suggestedNextAction: "Inspect feedback preview and replay.",
      })),
  ].sort((left, right) => right.priority - left.priority || left.id.localeCompare(right.id));

  return {
    totalCount: items.length,
    urgentCount: items.filter((item) => item.severity === "urgent").length,
    reviewCount: items.filter((item) => item.severity === "review").length,
    readyCount: items.filter((item) => item.lane === "ready").length,
    items,
    nextAction: items[0]?.suggestedNextAction ?? "Paste CSV text to build a review queue preview.",
  };
}

function feedbackRef(
  item: CsvDryRunExecutionFeedbackPreviewItem | null,
  label: string | null,
): CsvDryRunFeedbackComparisonTradeRef | null {
  if (!item) {
    return null;
  }

  return {
    requestIndex: item.requestIndex,
    tradeLabel: item.tradeLabel,
    symbol: item.symbol,
    grossRealizedPnl: item.grossRealizedPnl,
    label,
  };
}

function buildFeedbackComparison(args: {
  feedback: CsvDryRunExecutionFeedbackPreview;
  queue: CsvDryRunPostImportReviewQueuePreview;
}): CsvDryRunFeedbackComparison {
  const scored = args.feedback.items.filter(
    (item) => item.grossRealizedPnl !== null,
  );
  const sortedByPnl = [...scored].sort(
    (left, right) =>
      (right.grossRealizedPnl ?? 0) - (left.grossRealizedPnl ?? 0),
  );
  const riskCounts = countBy(args.feedback.items, (item) => item.topRiskLabel);
  const strengthCounts = countBy(args.feedback.items, (item) => item.topStrengthLabel);
  const topRisk =
    [...riskCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    null;
  const topStrength =
    [...strengthCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    null;

  return {
    bestPreviewTrade: feedbackRef(sortedByPnl[0] ?? args.feedback.items[0] ?? null, "Best preview trade"),
    worstPreviewTrade: feedbackRef(sortedByPnl.at(-1) ?? args.feedback.items[0] ?? null, "Worst preview trade"),
    mostRiskyExecutionBehavior: topRisk,
    mostRepeatableStrength: topStrength,
    highestPriorityReviewItemTitle: args.queue.items[0]?.title ?? null,
    sampleSizeWarning: args.feedback.completedCount < 5,
    marketContextUsed: false,
    limitation:
      "This comparison uses execution-only dry-run feedback and is not saved analysis.",
  };
}

function buildBrokerMappingLearningConsole(args: {
  preview: CsvDryRunImportExperience["preview"];
  mapping: CsvDryRunColumnMappingAssistant;
  broker: BrokerExecutionCsvFormat;
  columnMapping: BrokerExecutionCsvColumnMapping;
}): CsvDryRunBrokerMappingLearningConsole {
  const detectedHeaders = new Set(
    args.preview.importResult.diagnostics.detectedColumns.map(
      (column) => column.header,
    ),
  );
  const explicitHeaders = new Set(
    Object.values(args.columnMapping)
      .flatMap((value) => (Array.isArray(value) ? value : value ? [value] : []))
      .map((value) => value.trim())
      .filter(Boolean),
  );
  const fields: CsvDryRunBrokerMappingLearningField[] = args.mapping.rows.map(
    (row) => ({
      field: row.field,
      detectedHeader: row.detectedHeader,
      explicitHeader: row.explicitHeader,
      status: row.status,
    }),
  );
  const unknownHeaders = args.preview.importResult.diagnostics.headers.filter(
    (header) => !detectedHeaders.has(header) && !explicitHeaders.has(header),
  );
  const explicitMappingCount = explicitHeaders.size;
  const learningUrgency =
    args.mapping.status === "blocked" ||
    args.preview.importResult.mappingConfidence.level === "low"
      ? "high"
      : explicitMappingCount > 0 || unknownHeaders.length > 0
        ? "medium"
        : "low";

  return {
    selectedBroker: args.broker,
    confidenceLevel: args.preview.importResult.mappingConfidence.level,
    confidenceScore: args.preview.importResult.mappingConfidence.score,
    detectedHeaders: args.preview.importResult.diagnostics.headers,
    mappedFields: fields,
    missingRequiredFields: args.mapping.missingRequiredFields,
    unknownHeaders,
    explicitMappingCount,
    learningUrgency,
    recommendation:
      learningUrgency === "high"
        ? "Capture this header shape later once persistence exists; it needs mapping learning."
        : learningUrgency === "medium"
          ? "Review this mapping shape after real imports exist."
          : "Known headers look stable for this dry run.",
    persistenceStatus: "not_saved",
  };
}

function buildImportSessionSummary(args: {
  preview: CsvDryRunImportExperience["preview"];
  gate: CsvDryRunConfidenceGate;
  grouping: CsvDryRunTradeGroupingReview;
  feedback: CsvDryRunExecutionFeedbackPreview;
  queue: CsvDryRunPostImportReviewQueuePreview;
}): CsvDryRunSessionSummary {
  const status =
    args.preview.importResult.rowCount === 0
      ? "not_started"
      : args.gate.status === "blocked"
        ? "blocked"
        : args.gate.status === "needs_review" || args.grouping.needsReviewCount > 0
          ? "needs_review"
          : "ready";

  return {
    status,
    rowsParsed: args.preview.importResult.rowCount,
    acceptedExecutionCount: args.preview.importResult.acceptedExecutionCount,
    rejectedRowCount: args.preview.importResult.rejectedRowCount,
    skippedRowCount: args.preview.importResult.skippedRowCount,
    groupedTradeCount: args.grouping.totalCount,
    readyTradeCount: args.grouping.items.filter((item) => !item.needsReview).length,
    tradesNeedingReviewCount: args.grouping.needsReviewCount,
    feedbackPreviewCount: args.feedback.completedCount,
    highestPriorityNextAction: args.queue.nextAction,
    summary:
      status === "not_started"
        ? "Choose or paste CSV text to start a dry-run import."
        : status === "blocked"
          ? "The import is blocked until repair items are fixed."
          : status === "needs_review"
            ? "The import parsed, but some trades or diagnostics need review."
            : "The import is ready for dry-run feedback review.",
  };
}

const SETUP_TAG_OPTIONS: CsvDryRunSetupTagOption[] = [
  {
    kind: "scalp",
    label: "Scalp",
    detail: "User-labeled short-duration trade.",
  },
  {
    kind: "breakout",
    label: "Breakout",
    detail: "User-labeled breakout idea.",
  },
  {
    kind: "reversal",
    label: "Reversal",
    detail: "User-labeled reversal idea.",
  },
  {
    kind: "dip_buy",
    label: "Dip buy",
    detail: "User-labeled pullback or dip-buy idea.",
  },
  {
    kind: "momentum",
    label: "Momentum",
    detail: "User-labeled momentum idea.",
  },
  {
    kind: "unknown",
    label: "Unknown",
    detail: "No setup label chosen yet.",
  },
];

function buildSetupTaggingModel(args: {
  grouping: CsvDryRunTradeGroupingReview;
  selections?: Record<number, CsvDryRunSetupTagKind>;
}): CsvDryRunSetupTaggingModel {
  return {
    options: SETUP_TAG_OPTIONS,
    items: args.grouping.items.map((item) => ({
      requestIndex: item.requestIndex,
      symbol: item.symbol,
      selectedTag: args.selections?.[item.requestIndex] ?? "unknown",
      suggestedTag: "unknown",
      reason:
        "This is a user playbook label only; chart setup quality waits for calibrated market context later.",
      persistenceStatus: "client_state_only" as const,
    })),
    marketValidated: false,
    limitation:
      "Setup tags are user labels in this dry run and do not affect feedback or scoring.",
  };
}

function buildDecisionCaptureModel(args: {
  mapping: CsvDryRunColumnMappingAssistant;
  rowRepairTable: CsvDryRunEditableRowRepairTable;
  groupingDecisionReview: CsvDryRunGroupingDecisionReview;
  setupTagging: CsvDryRunSetupTaggingModel;
  feedback: CsvDryRunExecutionFeedbackPreview;
  gate: CsvDryRunConfidenceGate;
}): CsvDryRunDecisionCaptureModel {
  const items: CsvDryRunDecisionCaptureItem[] = [
    ...(args.mapping.status !== "blocked"
      ? [
          {
            id: "decision:confirmed-mapping",
            type: "confirmed_mapping" as const,
            label: "Confirmed mapping",
            detail: "Column mapping is ready enough for this dry run.",
            persistenceStatus: "client_state_only" as const,
          },
        ]
      : []),
    ...args.rowRepairTable.editableRows
      .filter((row) => row.status === "rejected")
      .slice(0, 3)
      .map((row) => ({
        id: `decision:edited-row:${row.rowNumber}`,
        type: "edited_row" as const,
        label: `Repair row ${row.rowNumber}`,
        detail: row.suggestedAction,
        persistenceStatus: "client_state_only" as const,
      })),
    ...args.groupingDecisionReview.items.slice(0, 4).map((item) => ({
      id: `decision:grouping:${item.requestIndex}`,
      type:
        item.currentRecommendation === "split_later"
          ? ("requested_split_later" as const)
          : item.currentRecommendation === "merge_later"
            ? ("requested_merge_later" as const)
            : ("confirmed_grouping" as const),
      label: `${item.symbol} grouping decision`,
      detail:
        item.options.find((option) => option.recommended)?.detail ??
        "Review grouping before saving later.",
        persistenceStatus: "client_state_only" as const,
      })),
    ...args.setupTagging.items
      .filter((item) => item.selectedTag !== "unknown")
      .slice(0, 4)
      .map((item) => ({
        id: `decision:setup-tag:${item.requestIndex}`,
        type: "selected_setup_tag" as const,
        label: `${item.symbol} setup tag`,
        detail: `User selected ${item.selectedTag.replace(/_/g, " ")}. This is not chart-validated.`,
        persistenceStatus: "client_state_only" as const,
      })),
    ...(args.feedback.completedCount > 0
      ? [
          {
            id: "decision:approved-feedback-preview",
            type: "approved_feedback_preview" as const,
            label: "Approved feedback preview",
            detail: "Execution-only preview is available for review.",
            persistenceStatus: "client_state_only" as const,
          },
        ]
      : []),
    ...(args.gate.status !== "ready"
      ? [
          {
            id: "decision:deferred-import",
            type: "deferred_import" as const,
            label: "Deferred import",
            detail: args.gate.nextAction,
            persistenceStatus: "client_state_only" as const,
          },
        ]
      : []),
  ];

  return {
    totalCount: items.length,
    items,
    nextAction:
      items.length > 0
        ? "These local decisions show what future saved-import events should capture."
        : "No decisions are ready to capture yet.",
  };
}

function buildCalibrationQueue(): CsvDryRunCalibrationQueue {
  const labels = [
    ["real_headers", "Real broker header examples", "Anonymized header rows by broker.", false],
    ["repair_outcomes", "Real repair outcomes", "Which user repair steps resolved imports.", false],
    ["parse_rate", "Parse success rate", "How often imports parse without repair.", false],
    ["mapping_corrections", "Column mapping corrections", "Which fields users most often remap.", false],
    ["grouping_corrections", "Grouping correction rate", "How often grouped trades need manual review.", false],
    ["open_position_rate", "Open-position rate", "How often imports leave shares open.", false],
    ["pnl_mismatch_rate", "P/L mismatch rate", "How often broker net and app P/L differ.", false],
    ["first_review_completion", "First review completion", "Whether users complete the first walkthrough.", false],
    ["rule_draft_conversion", "Rule draft conversion", "Whether users save or ignore draft rules later.", false],
    ["market_context_observation", "Market context observation", "Saved-trade market context from levels-system later.", true],
  ] as const;
  const items = labels.map(([id, label, dataNeeded, marketContextRequired]) => ({
    id,
    label,
    status: "waiting_for_real_imports" as const,
    dataNeeded,
    reason:
      "This should be measured only after real imports exist, not from synthetic fixtures.",
    marketContextRequired,
  }));

  return {
    totalCount: items.length,
    waitingCount: items.length,
    marketContextUsedNow: false,
    items,
  };
}

function dryRunTradeGroupingRulesForBroker(
  broker: BrokerExecutionCsvFormat,
): BrokerExecutionCsvTradeGroupingRules {
  if (broker === "ibkr_activity_statement") {
    return {
      maxGapMinutes: 10080,
      splitAtSessionBoundary: false,
    };
  }

  return {
    allowSellStartingTrades:
      broker === "generic_execution_csv" || broker === "auto",
    maxGapMinutes: 240,
    splitAtSessionBoundary: true,
  };
}

function previewBrokerExecutionCsvImportWithResolvedGrouping(
  args: PreviewBrokerExecutionCsvImportArgs,
): BrokerExecutionCsvSavedTradeImportPreview {
  const firstPreview = previewBrokerExecutionCsvImport(args);
  const resolvedBroker = firstPreview.importResult.broker;

  if (args.broker !== "auto") {
    return firstPreview;
  }

  return previewBrokerExecutionCsvImport({
    ...args,
    broker: resolvedBroker,
    tradeGroupingRules: dryRunTradeGroupingRulesForBroker(resolvedBroker),
  });
}

export function buildCsvDryRunImportExperience(args: {
  csvText: string;
  broker: BrokerExecutionCsvFormat;
  accountTimezone?: string;
  columnMapping?: BrokerExecutionCsvColumnMapping;
  optionsHandling?: PreviewBrokerExecutionCsvImportArgs["optionsHandling"];
  tradeGroupingRules?: PreviewBrokerExecutionCsvImportArgs["tradeGroupingRules"];
  repairImpactBaseline?: CsvDryRunRepairImpactSnapshot | null;
  setupTagSelections?: Record<number, CsvDryRunSetupTagKind>;
  analytics?: DryRunAnalyticsContext;
}): CsvDryRunImportExperience {
  const columnMapping = cleanColumnMapping(args.columnMapping);
  const previewArgs: PreviewBrokerExecutionCsvImportArgs = {
    csvText: args.csvText,
    broker: args.broker,
    accountTimezone: args.accountTimezone ?? "America/New_York",
    columnMapping,
    optionsHandling: args.optionsHandling ?? "reject",
    tradeGroupingRules:
      args.tradeGroupingRules ?? dryRunTradeGroupingRulesForBroker(args.broker),
  };
  const preview = previewBrokerExecutionCsvImportWithResolvedGrouping(previewArgs);
  const effectiveBroker = preview.importResult.broker;
  const confidenceGate = buildConfidenceGate(preview);
  const columnMappingAssistant = buildColumnMappingAssistant(
    preview,
    columnMapping,
  );
  const tradeGroupingReview = buildTradeGroupingReview(preview);
  const sessionState = buildSessionState({
    csvText: args.csvText,
    gate: confidenceGate,
    mapping: columnMappingAssistant,
    grouping: tradeGroupingReview,
  });
  const brokerCoverage = buildBrokerCoveragePanel(effectiveBroker);
  const brokerHelp = buildBrokerHelpPanel(effectiveBroker);
  const calibrationQueue = buildCalibrationQueue();
  const rowRepairTable = buildRowRepairTable(args.csvText, preview);
  const groupingDecisionReview = buildGroupingDecisionReview(
    tradeGroupingReview,
  );
  const executionFeedbackPreview = buildExecutionFeedbackPreview(preview);
  const replayPreview = buildReplayPreview(tradeGroupingReview);
  const pnlReconciliationAssistant = buildPnlReconciliationAssistant(preview);
  const costVisibility = buildCostVisibility(preview);
  const executionAnomalyDetector = buildExecutionAnomalyDetector({
    preview,
    grouping: tradeGroupingReview,
  });
  const postImportReviewQueuePreview = buildPostImportReviewQueuePreview({
    preview,
    grouping: tradeGroupingReview,
    feedback: executionFeedbackPreview,
    pnl: pnlReconciliationAssistant,
    anomalies: executionAnomalyDetector,
  });
  const feedbackComparison = buildFeedbackComparison({
    feedback: executionFeedbackPreview,
    queue: postImportReviewQueuePreview,
  });
  const brokerMappingLearningConsole = buildBrokerMappingLearningConsole({
    preview,
    mapping: columnMappingAssistant,
    broker: effectiveBroker,
    columnMapping,
  });
  const repairImpactDiff = buildRepairImpactDiff({
    preview,
    gate: confidenceGate,
    grouping: tradeGroupingReview,
    baseline: args.repairImpactBaseline,
  });
  const readinessScoreBreakdown = buildReadinessScoreBreakdown({
    preview,
    mapping: columnMappingAssistant,
    grouping: tradeGroupingReview,
    brokerCoverage,
  });
  const importSessionSummary = buildImportSessionSummary({
    preview,
    gate: confidenceGate,
    grouping: tradeGroupingReview,
    feedback: executionFeedbackPreview,
    queue: postImportReviewQueuePreview,
  });
  const setupTagging = buildSetupTaggingModel({
    grouping: tradeGroupingReview,
    selections: args.setupTagSelections,
  });
  const firstTradeWalkthrough = buildFirstTradeWalkthrough({
    gate: confidenceGate,
    grouping: tradeGroupingReview,
    feedback: executionFeedbackPreview,
  });
  const errorLibrary = buildErrorLibrary({
    preview,
    grouping: tradeGroupingReview,
  });
  const privacyNotice = buildPrivacyNotice();
  const mobileQaPanel = buildMobileQaPanel();
  const decisionCapture = buildDecisionCaptureModel({
    mapping: columnMappingAssistant,
    rowRepairTable,
    groupingDecisionReview,
    setupTagging,
    feedback: executionFeedbackPreview,
    gate: confidenceGate,
  });
  const evidenceDrillIn = buildEvidenceDrillIn({
    preview,
    gate: confidenceGate,
    grouping: tradeGroupingReview,
    feedback: executionFeedbackPreview,
    analytics: args.analytics,
  });
  const copyAudit = buildCopyAudit({
    gate: confidenceGate,
    mapping: columnMappingAssistant,
    walkthrough: firstTradeWalkthrough,
    calibration: calibrationQueue,
    privacy: privacyNotice,
    brokerHelp,
  });

  return {
    source: "client_dry_run",
    broker: effectiveBroker,
    accountTimezone: args.accountTimezone ?? "America/New_York",
    csvText: args.csvText,
    columnMapping,
    preview,
    confidenceGate,
    columnMappingAssistant,
    sessionState,
    tradeGroupingReview,
    firstTradeWalkthrough,
    brokerCoverage,
    evidenceDrillIn,
    copyAudit,
    calibrationQueue,
    rowRepairTable,
    groupingDecisionReview,
    executionFeedbackPreview,
    replayPreview,
    brokerHelp,
    errorLibrary,
    privacyNotice,
    mobileQaPanel,
    decisionCapture,
    repairImpactDiff,
    readinessScoreBreakdown,
    pnlReconciliationAssistant,
    costVisibility,
    postImportReviewQueuePreview,
    feedbackComparison,
    brokerMappingLearningConsole,
    importSessionSummary,
    executionAnomalyDetector,
    setupTagging,
    marketContextUsedForConclusions: false,
  };
}
