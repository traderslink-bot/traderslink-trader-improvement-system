import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";

import { readLevelsSystemRuntimeConfigFromEnv } from "../../../../src/lib/support-resistance/levels-system-runtime-options";
import { runBatchTradeAnalysis } from "../../../../src/lib/trade-analysis/batch/run-trade-analysis-batch";
import { parseTradeAnalysisRequestDocument } from "../../../../src/lib/trade-analysis/request/trade-analysis-request-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ApiErrorBody {
  contractVersion: "trade_analysis_api_error_v1";
  error: {
    code: "invalid_json" | "invalid_request_document" | "runtime_config_error";
    message: string;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getValidateOnly(document: unknown): boolean {
  return isRecord(document) && document.validateOnly === true;
}

function errorResponse(
  status: number,
  code: ApiErrorBody["error"]["code"],
  message: string,
): Response {
  return Response.json(
    {
      contractVersion: "trade_analysis_api_error_v1",
      error: {
        code,
        message,
      },
    } satisfies ApiErrorBody,
    { status },
  );
}

async function GETHandler(): Promise<Response> {
  return Response.json({
    contractVersion: "trade_analysis_debug_api_v1",
    route: "/api/trade-analysis/debug",
    methods: ["GET", "POST"],
    requestShapes: [
      "single trade request",
      "{ request }",
      "{ trade }",
      "{ requests: [...] }",
      "{ trades: [...] }",
    ],
    options: {
      validateOnly:
        "Set validateOnly: true on the POST body to validate shape without provider or shared-engine candle work.",
    },
    outputContract: "batch_trade_analysis_v1",
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

  let requests: unknown[];

  try {
    requests = parseTradeAnalysisRequestDocument(document).requests;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return errorResponse(400, "invalid_request_document", message);
  }

  let levelsSystem;

  try {
    levelsSystem = readLevelsSystemRuntimeConfigFromEnv();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return errorResponse(500, "runtime_config_error", message);
  }

  const batch = await runBatchTradeAnalysis({
    source: "api:/api/trade-analysis/debug",
    requests,
    levelsSystem,
    validateOnly: getValidateOnly(document),
  });

  return Response.json(batch);
}

export const GET = withTraderIntelligenceOwnerRoute("app/api/trade-analysis/debug/route.ts", GETHandler);

export const POST = withTraderIntelligenceOwnerRoute("app/api/trade-analysis/debug/route.ts", POSTHandler);
