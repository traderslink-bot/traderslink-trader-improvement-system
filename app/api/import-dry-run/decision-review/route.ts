import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";

import { readLevelsSystemRuntimeConfigFromEnv } from "../../../../src/lib/support-resistance/levels-system-runtime-options";
import {
  buildCsvDryRunDecisionReviewBridge,
  type BuildCsvDryRunDecisionReviewBridgeArgs,
} from "../../../../src/lib/trader-analytics/server/build-csv-dry-run-decision-review-bridge";
import type {
  BrokerExecutionCsvColumnMapping,
  BrokerExecutionCsvFormat,
} from "../../../../src/lib/execution-sources/csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ApiErrorBody {
  contractVersion: "csv_dry_run_decision_review_api_error_v1";
  error: {
    code:
      | "invalid_json"
      | "invalid_request"
      | "runtime_config_error"
      | "analysis_error";
    message: string;
  };
}

const VALID_BROKERS = new Set<BrokerExecutionCsvFormat>([
  "auto",
  "ibkr_activity_statement",
  "moomoo_trade_history",
  "webull_order_history",
  "robinhood_transaction_history",
  "schwab_transactions",
  "generic_execution_csv",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseColumnMapping(value: unknown): BrokerExecutionCsvColumnMapping | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isRecord(value)) {
    throw new Error("columnMapping must be an object when provided.");
  }

  for (const [field, mappingValue] of Object.entries(value)) {
    const values = Array.isArray(mappingValue) ? mappingValue : [mappingValue];

    if (
      values.some(
        (item) => item !== undefined && typeof item !== "string",
      )
    ) {
      throw new Error(
        `columnMapping.${field} must be a string or string array when provided.`,
      );
    }
  }

  return value as BrokerExecutionCsvColumnMapping;
}

function errorResponse(
  status: number,
  code: ApiErrorBody["error"]["code"],
  message: string,
): Response {
  return Response.json(
    {
      contractVersion: "csv_dry_run_decision_review_api_error_v1",
      error: {
        code,
        message,
      },
    } satisfies ApiErrorBody,
    { status },
  );
}

function parseBody(document: unknown): Omit<
  BuildCsvDryRunDecisionReviewBridgeArgs,
  "levelsSystem"
> {
  if (!isRecord(document)) {
    throw new Error("Request body must be an object.");
  }

  if (typeof document.csvText !== "string") {
    throw new Error("csvText is required.");
  }

  if (
    typeof document.broker !== "string" ||
    !VALID_BROKERS.has(document.broker as BrokerExecutionCsvFormat)
  ) {
    throw new Error("broker must be a supported CSV broker id.");
  }

  if (
    document.accountTimezone !== undefined &&
    typeof document.accountTimezone !== "string"
  ) {
    throw new Error("accountTimezone must be a string when provided.");
  }

  const columnMapping = parseColumnMapping(document.columnMapping);

  const maxTrades = document.maxTrades;

  if (
    maxTrades !== undefined &&
    (typeof maxTrades !== "number" ||
      !Number.isInteger(maxTrades) ||
      maxTrades < 0)
  ) {
    throw new Error("maxTrades must be a non-negative integer when provided.");
  }

  return {
    csvText: document.csvText,
    broker: document.broker as BrokerExecutionCsvFormat,
    accountTimezone: document.accountTimezone as string | undefined,
    columnMapping,
    maxTrades,
  };
}

async function GETHandler(): Promise<Response> {
  return Response.json({
    contractVersion: "csv_dry_run_decision_review_api_v1",
    route: "/api/import-dry-run/decision-review",
    methods: ["GET", "POST"],
    outputContract: "csv_dry_run_decision_review_bridge_v1",
    diagnosticCodes: [
      "import_blocked",
      "trade_open",
      "trade_not_completed",
      "market_context_unavailable",
      "analysis_failed",
      "limit_reached",
    ],
    boundary:
      "Server-only route. The browser posts import inputs and receives lightweight decision-review snapshots.",
  });
}

async function POSTHandler(request: Request): Promise<Response> {
  let document: unknown;

  try {
    document = await request.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return errorResponse(400, "invalid_json", message);
  }

  let body: Omit<BuildCsvDryRunDecisionReviewBridgeArgs, "levelsSystem">;

  try {
    body = parseBody(document);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return errorResponse(400, "invalid_request", message);
  }

  let levelsSystem;

  try {
    levelsSystem = readLevelsSystemRuntimeConfigFromEnv();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return errorResponse(500, "runtime_config_error", message);
  }

  try {
    const result = await buildCsvDryRunDecisionReviewBridge({
      ...body,
      levelsSystem,
      maxTrades: body.maxTrades ?? 3,
    });

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return errorResponse(500, "analysis_error", message);
  }
}

export const GET = withTraderIntelligenceOwnerRoute("app/api/import-dry-run/decision-review/route.ts", GETHandler);

export const POST = withTraderIntelligenceOwnerRoute("app/api/import-dry-run/decision-review/route.ts", POSTHandler);
