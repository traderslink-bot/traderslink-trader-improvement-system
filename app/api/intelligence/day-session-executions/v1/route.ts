import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";

import {
  authorizeTraderIntelligenceOwner,
  withTraderIntelligenceOwnerRoute,
} from "@/src/lib/trader-intelligence-v3/auth";
import {
  canonicalOwnerKeyForServerImport,
  createNeonPreviewExecutionSourceStore,
  ingestAndBuildPersistedRawBrokerCsvImport,
  parseServerInstrumentResolutionMap,
} from "@/src/lib/trader-intelligence-v3/ingestion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_PATH =
  "app/api/intelligence/day-session-executions/v1/route.ts";
const MAX_EXECUTIONS = 200;
const NEW_YORK_TIMESTAMP_FORMATTER = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
  month: "2-digit",
  second: "2-digit",
  timeZone: "America/New_York",
  year: "numeric",
});

type ExecutionInput = {
  fees: string;
  price: string;
  quantity: string;
  side: "BUY" | "SELL";
  symbol: string;
  time: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseExecution(value: unknown): ExecutionInput | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.symbol !== "string" ||
    !/^[A-Z0-9._-]{1,32}$/.test(value.symbol) ||
    (value.side !== "BUY" && value.side !== "SELL") ||
    typeof value.time !== "string" ||
    !/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value.time) ||
    typeof value.quantity !== "string" ||
    !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value.quantity) ||
    Number(value.quantity) <= 0 ||
    typeof value.price !== "string" ||
    !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value.price) ||
    Number(value.price) <= 0 ||
    typeof value.fees !== "string" ||
    (value.fees !== "" &&
      (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value.fees) ||
        Number(value.fees) < 0))
  ) {
    return null;
  }
  return {
    fees: value.fees,
    price: value.price,
    quantity: value.quantity,
    side: value.side,
    symbol: value.symbol,
    time: value.time,
  };
}

function csvCell(value: string): string {
  return /[",\r\n]/.test(value)
    ? `"${value.replaceAll('"', '""')}"`
    : value;
}

function newYorkExecutionTimestamp(date: string, time: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute, second = 0] = time.split(":").map(Number);
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  const localAtGuess = Object.fromEntries(
    NEW_YORK_TIMESTAMP_FORMATTER.formatToParts(new Date(localAsUtc))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
  const offsetAtGuess =
    Date.UTC(
      localAtGuess.year,
      localAtGuess.month - 1,
      localAtGuess.day,
      localAtGuess.hour,
      localAtGuess.minute,
      localAtGuess.second,
    ) - localAsUtc;
  return new Date(localAsUtc - offsetAtGuess)
    .toISOString()
    .replace(".000Z", "Z");
}

function executionCsv(date: string, executions: readonly ExecutionInput[]) {
  const rows = executions.map((execution) =>
    [
      newYorkExecutionTimestamp(date, execution.time),
      execution.symbol,
      execution.side,
      execution.quantity,
      execution.price,
      "0",
      execution.fees || "0",
      "USD",
    ]
      .map(csvCell)
      .join(","),
  );
  return [
    "ExecutedAt,Symbol,Side,Quantity,Price,Commission,Fees,Currency",
    ...rows,
  ].join("\n");
}

function manualEntryInstrumentKey(symbol: string): string {
  return `instrument_manual_${symbol.toLowerCase().replaceAll(/[._-]/g, "_")}`;
}

function errorResponse(status: number, code: string): Response {
  return Response.json(
    {
      contractVersion: "ti_v3_day_session_execution_response_v1",
      error: { code, message: "Executions could not be saved." },
    },
    { status },
  );
}

async function POSTHandler(request: Request): Promise<Response> {
  let document: unknown;
  try {
    document = await request.json();
  } catch {
    return errorResponse(400, "ti_v3_day_session_execution_payload_invalid");
  }
  if (!isRecord(document) || !Array.isArray(document.executions)) {
    return errorResponse(400, "ti_v3_day_session_execution_payload_invalid");
  }
  const date = document.date;
  const executions = document.executions.map(parseExecution);
  if (
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    executions.length === 0 ||
    executions.length > MAX_EXECUTIONS ||
    executions.some((execution) => execution === null)
  ) {
    return errorResponse(400, "ti_v3_day_session_execution_payload_invalid");
  }

  const authorization = await authorizeTraderIntelligenceOwner({
    environment: process.env,
    modulePath: ROUTE_PATH,
    localRequest: { headers: request.headers, requestUrl: request.url },
  });
  if (!authorization.ok) {
    return errorResponse(503, "ti_v3_day_session_execution_unavailable");
  }
  const accountKey =
    process.env.TRADER_INTELLIGENCE_V3_EXECUTION_ACCOUNT_KEY?.trim();
  if (!accountKey || !/^account_[a-z0-9][a-z0-9_-]{0,87}$/.test(accountKey)) {
    return errorResponse(503, "ti_v3_server_import_account_key_missing");
  }
  const instrumentMap = parseServerInstrumentResolutionMap(
    process.env.TRADER_INTELLIGENCE_V3_EXECUTION_INSTRUMENTS_JSON,
  );
  if (!instrumentMap.ok) return errorResponse(503, instrumentMap.error.code);
  const store = await createNeonPreviewExecutionSourceStore(process.env);
  if (!store.ok) return errorResponse(503, store.error.code);

  const csv = executionCsv(date, executions as readonly ExecutionInput[]);
  const sourceHash = createHash("sha256")
    .update(csv, "utf8")
    .digest("hex")
    .slice(0, 32);
  const persisted = ingestAndBuildPersistedRawBrokerCsvImport({
    brokerCode: "manual_entry",
    canonicalAccountKey: accountKey,
    canonicalOwnerKey: canonicalOwnerKeyForServerImport(authorization.owner),
    chargeCoverageState: "complete",
    columnMapping: {
      commission: "Commission",
      currency: "Currency",
      executedAt: "ExecutedAt",
      fees: "Fees",
      price: "Price",
      quantity: "Quantity",
      side: "Side",
      symbol: "Symbol",
    },
    csvUtf8: new Uint8Array(Buffer.from(csv, "utf8")),
    defaultCurrency: "USD",
    resolveInstrument: (symbol) =>
      instrumentMap.value.get(symbol) ?? {
        basisContinuityState: "resolved",
        securityType: "unclassified_security",
        stableInstrumentKey: manualEntryInstrumentKey(symbol),
        state: "resolved",
      },
    sourceIdentity: `source_manual_${sourceHash}`,
    sourceSystem: "manual_entry",
    sourceTimezoneEvidence: "America/New_York",
    timestampPrecision: "second",
  });
  if (!persisted.ok) return errorResponse(400, persisted.error.code);

  const written = await store.value.persist(persisted.value);
  if (!written.ok) return errorResponse(503, written.error.code);
  return Response.json(
    {
      acceptedExecutionCount: written.value.acceptedExecutionCount,
      contractVersion: "ti_v3_day_session_execution_response_v1",
      persistenceDigest: written.value.persistenceDigest,
      rejectedRowCount: written.value.rejectedRowCount,
      status: "persisted",
    },
    { status: 201 },
  );
}

export const POST = withTraderIntelligenceOwnerRoute(ROUTE_PATH, POSTHandler);
