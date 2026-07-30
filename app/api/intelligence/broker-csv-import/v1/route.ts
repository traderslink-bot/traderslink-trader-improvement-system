import { createHash } from "node:crypto";

import {
  authorizeTraderIntelligenceOwner,
  withTraderIntelligenceOwnerRoute,
} from "@/src/lib/trader-intelligence-v3/auth";
import {
  BROKER_EXECUTION_CSV_FORMATS,
  IMPORTABLE_BROKER_PRESETS,
  isImportableBrokerPresetId,
  parseBrokerExecutionCsv,
  parseImportableBrokerCsv,
  type BrokerExecutionCsvColumnMapping,
  type BrokerExecutionCsvFormat,
} from "@/src/lib/execution-sources/csv";
import {
  buildImportRepairRecord,
  readConfiguredImportCatalog,
  resolveConfiguredServerRawBrokerCsvImportService,
  type PersistedRawBrokerCsvImport,
  type RawBrokerCsvColumnMapping,
  writeImportRepairRecord,
  writeConfiguredImportAuthorityBinding,
} from "@/src/lib/trader-intelligence-v3/ingestion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_PATH = "app/api/intelligence/broker-csv-import/v1/route.ts";
const MAX_CSV_CHARS = 12_000_000;
const CUSTOM_FIELDS = [
  "timestamp",
  "date",
  "time",
  "symbol",
  "side",
  "quantity",
  "price",
  "currency",
  "commission",
  "fees",
  "netAmount",
  "orderId",
  "executionId",
] as const;

type ImportDocument = Readonly<{
  csvText: string;
  broker: string;
  defaultCurrency: string;
  timestampTimezone?: string;
  customMapping?: BrokerExecutionCsvColumnMapping;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeBroker(value: string): boolean {
  return (
    value === "auto" ||
    value === "custom" ||
    Object.hasOwn(BROKER_EXECUTION_CSV_FORMATS, value) ||
    isImportableBrokerPresetId(value)
  );
}

function parseDocument(value: unknown): ImportDocument | null {
  if (!isRecord(value)) return null;
  const csvText = value.csvText;
  const broker = value.broker;
  const defaultCurrency = value.defaultCurrency ?? "USD";
  if (
    typeof csvText !== "string" ||
    csvText.length === 0 ||
    csvText.length > MAX_CSV_CHARS ||
    typeof broker !== "string" ||
    !safeBroker(broker) ||
    typeof defaultCurrency !== "string" ||
    !/^[A-Z]{3}$/.test(defaultCurrency) ||
    (value.timestampTimezone !== undefined &&
      (typeof value.timestampTimezone !== "string" ||
        value.timestampTimezone.length > 64))
  ) {
    return null;
  }
  let customMapping: BrokerExecutionCsvColumnMapping | undefined;
  if (broker === "custom") {
    if (!isRecord(value.customMapping)) return null;
    const mapping: Record<string, string> = {};
    for (const [key, header] of Object.entries(value.customMapping)) {
      if (
        !CUSTOM_FIELDS.includes(key as (typeof CUSTOM_FIELDS)[number]) ||
        typeof header !== "string" ||
        header.trim().length === 0 ||
        header.length > 128
      ) {
        return null;
      }
      mapping[key] = header.trim();
    }
    if (
      !["symbol", "side", "quantity", "price"].every((key) => mapping[key]) ||
      (!mapping.timestamp && !mapping.date)
    ) {
      return null;
    }
    customMapping = mapping;
  }
  return {
    csvText,
    broker,
    defaultCurrency,
    timestampTimezone: value.timestampTimezone as string | undefined,
    customMapping,
  };
}

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function normalizedSide(value: string): "buy" | "sell" {
  return value.trim().toLowerCase().includes("sell") ||
    ["sld", "short"].includes(value.trim().toLowerCase())
    ? "sell"
    : "buy";
}

function normalizedTimestamp(value: string | number | Date): string | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function historyPacket(
  items: ReturnType<typeof readConfiguredImportCatalog>,
): readonly Readonly<{
  persistenceDigest: string;
  importedAt: string;
  broker: string;
  acceptedRows: string;
  rowsNeedingAttention: string;
  firstExecutionAt: string | null;
  lastExecutionAt: string | null;
}>[] {
  return items.map(({ record, importedAt }) => {
    const timestamps = record.acceptedExecutions
      .map((execution) => execution.content.executedAt)
      .sort();
    return Object.freeze({
      persistenceDigest: record.persistenceDigest,
      importedAt,
      broker: record.brokerCode,
      acceptedRows: record.acceptedExecutionCount,
      rowsNeedingAttention: record.rejectedRowCount,
      firstExecutionAt: timestamps[0] ?? null,
      lastExecutionAt: timestamps[timestamps.length - 1] ?? null,
    });
  });
}

function errorResponse(status: number, code: string, message: string): Response {
  return Response.json(
    {
      contractVersion: "ti_v3_broker_csv_import_response_v1",
      error: { code, message },
    },
    { status },
  );
}

async function authorizedContext(request: Request) {
  return authorizeTraderIntelligenceOwner({
    environment: process.env,
    modulePath: ROUTE_PATH,
    localRequest: { headers: request.headers, requestUrl: request.url },
  });
}

async function POSTHandler(request: Request): Promise<Response> {
  let document: ImportDocument | null = null;
  try {
    const raw = await request.text();
    if (raw.length <= MAX_CSV_CHARS * 2) {
      document = parseDocument(JSON.parse(raw));
    }
  } catch {
    document = null;
  }
  if (document === null) {
    return errorResponse(
      400,
      "ti_v3_broker_csv_import_payload_invalid",
      "Choose a valid broker CSV and try again.",
    );
  }

  const authorization = await authorizedContext(request);
  if (
    !authorization.ok ||
    authorization.config.persistence.kind !== "file"
  ) {
    return errorResponse(
      503,
      "ti_v3_broker_csv_import_unavailable",
      "The local V3 import store is unavailable.",
    );
  }

  const timezone =
    document.timestampTimezone?.trim() ||
    (document.broker === "custom" ? "" : "America/New_York");
  if (!timezone) {
    return errorResponse(
      400,
      "ti_v3_broker_csv_import_timezone_required",
      "Choose the timezone used by the custom CSV timestamps.",
    );
  }

  const parsed = isImportableBrokerPresetId(document.broker)
    ? parseImportableBrokerCsv({
        csvText: document.csvText,
        broker: document.broker,
        timestampTimezone: timezone,
        optionsHandling: "skip",
        tradeGroupingRules: { allowSellStartingTrades: true },
      })
    : parseBrokerExecutionCsv({
        csvText: document.csvText,
        broker:
          document.broker === "custom"
            ? "generic_execution_csv"
            : (document.broker as BrokerExecutionCsvFormat),
        timestampTimezone: timezone,
        optionsHandling: "skip",
        columnMapping: document.customMapping,
        tradeGroupingRules: { allowSellStartingTrades: true },
      });

  if (parsed.executions.length === 0) {
    const firstError = parsed.issues.find((issue) => issue.severity === "error");
    return errorResponse(
      422,
      "ti_v3_broker_csv_import_no_executions",
      firstError?.message ?? "No stock executions were found in this CSV.",
    );
  }

  const header = [
    "symbol",
    "executedAt",
    "side",
    "quantity",
    "price",
    "currency",
    "commission",
    "fees",
    "orderId",
    "executionId",
  ];
  const rows = parsed.executions.flatMap((execution) => {
    const executedAt = normalizedTimestamp(execution.timestamp);
    if (executedAt === null) return [];
    return [
      [
        execution.symbol.toUpperCase(),
        executedAt,
        normalizedSide(execution.side),
        execution.shares,
        execution.price,
        execution.currency?.toUpperCase() || document.defaultCurrency,
        execution.commission ?? "",
        execution.fees ?? "",
        execution.orderId ?? "",
        execution.brokerExecutionId ?? "",
      ],
    ];
  });
  const normalizedCsv = [header, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
  const symbols = [...new Set(rows.map((row) => String(row[0])))].sort();
  const chargeCoverageState = parsed.executions.every(
    (execution) =>
      (execution.commission !== null &&
        execution.commission !== undefined) ||
      (execution.fees !== null && execution.fees !== undefined),
  )
    ? "complete"
    : "unknown";
  const instrumentMap = Object.fromEntries(
    symbols.map((symbol) => [
      symbol,
      {
        securityType: "common_stock",
        stableInstrumentKey: `instrument_${symbol
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")}`,
      },
    ]),
  );
  const previousInstrumentMap =
    process.env.TRADER_INTELLIGENCE_V3_EXECUTION_INSTRUMENTS_JSON;
  process.env.TRADER_INTELLIGENCE_V3_EXECUTION_INSTRUMENTS_JSON =
    JSON.stringify(instrumentMap);
  const service = resolveConfiguredServerRawBrokerCsvImportService({
    owner: authorization.owner,
    config: authorization.config,
    environment: process.env,
  });
  if (previousInstrumentMap === undefined) {
    delete process.env.TRADER_INTELLIGENCE_V3_EXECUTION_INSTRUMENTS_JSON;
  } else {
    process.env.TRADER_INTELLIGENCE_V3_EXECUTION_INSTRUMENTS_JSON =
      previousInstrumentMap;
  }
  if (!service.ok) {
    return errorResponse(503, service.error.code, "The V3 import service is unavailable.");
  }

  const brokerCode =
    document.broker === "auto" ? parsed.broker : document.broker;
  const sourceDigest = createHash("sha256")
    .update(document.csvText, "utf8")
    .digest("hex");
  const mapping: RawBrokerCsvColumnMapping = {
    symbol: "symbol",
    executedAt: "executedAt",
    side: "side",
    quantity: "quantity",
    price: "price",
    currency: "currency",
    commission: "commission",
    fees: "fees",
    orderId: "orderId",
    executionId: "executionId",
  };
  const previouslyStored = readConfiguredImportCatalog({
    parentPath: authorization.config.persistence.parentPath,
    canonicalOwnerKey: service.value.canonicalOwnerKey,
    canonicalAccountKey: service.value.canonicalAccountKey,
  });
  const persisted = service.value.persist({
    csvUtf8: new TextEncoder().encode(normalizedCsv),
    sourceIdentity: `source_${sourceDigest}`,
    sourceSystem: brokerCode,
    brokerCode,
    columnMapping: mapping,
    defaultCurrency: document.defaultCurrency,
    timestampPrecision: "millisecond",
    sourceTimezoneEvidence: `normalized_${timezone.replace(
      /[^A-Za-z0-9]+/g,
      "_",
    )}`,
    chargeCoverageState,
  });
  if (!persisted.ok) {
    return errorResponse(422, persisted.error.code, "The CSV could not be persisted.");
  }

  const duplicateIgnored = previouslyStored.some(
    ({ record }) =>
      record.persistenceDigest === persisted.value.persistenceDigest,
  );
  const stored = readConfiguredImportCatalog({
    parentPath: authorization.config.persistence.parentPath,
    canonicalOwnerKey: service.value.canonicalOwnerKey,
    canonicalAccountKey: service.value.canonicalAccountKey,
  });
  const repairRecordReady = writeImportRepairRecord({
    parentPath: authorization.config.persistence.parentPath,
    record: buildImportRepairRecord({
      persistenceDigest: persisted.value.persistenceDigest,
      canonicalOwnerKey: service.value.canonicalOwnerKey,
      canonicalAccountKey: service.value.canonicalAccountKey,
      brokerCode,
      originalCsvText: document.csvText,
      parsed,
    }),
  });
  const analyticsReady = writeConfiguredImportAuthorityBinding({
    parentPath: authorization.config.persistence.parentPath,
    records: stored.map(({ record }) => record),
  });
  return Response.json(
    {
      contractVersion: "ti_v3_broker_csv_import_response_v1",
      status: duplicateIgnored ? "duplicate_ignored" : "persisted",
      duplicateIgnored,
      broker: brokerCode,
      brokerLabel:
        document.broker === "auto" || document.broker === "custom"
          ? parsed.brokerLabel
          : isImportableBrokerPresetId(document.broker)
            ? IMPORTABLE_BROKER_PRESETS[document.broker].label
            : BROKER_EXECUTION_CSV_FORMATS[
                document.broker as keyof typeof BROKER_EXECUTION_CSV_FORMATS
              ].label,
      acceptedExecutionCount: persisted.value.acceptedExecutionCount,
      rowsNeedingAttention: persisted.value.rejectedRowCount,
      skippedNonTradeRows: String(parsed.skippedRowCount),
      analyticsReady,
      repairRecordReady,
      persistenceDigest: persisted.value.persistenceDigest,
      imports: historyPacket(stored),
    },
    { status: duplicateIgnored ? 200 : 201 },
  );
}

export const POST = withTraderIntelligenceOwnerRoute(
  "app/api/intelligence/broker-csv-import/v1/route.ts",
  POSTHandler,
);
