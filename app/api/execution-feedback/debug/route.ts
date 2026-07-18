import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";

import { runBatchExecutionFeedback } from "../../../../src/lib/execution-feedback/batch/run-execution-feedback-batch";
import { parseTradeAnalysisRequestDocument } from "../../../../src/lib/trade-analysis/request/trade-analysis-request-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ApiErrorBody {
  contractVersion: "execution_feedback_api_error_v1";
  error: {
    code: "invalid_json" | "invalid_request_document";
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
      contractVersion: "execution_feedback_api_error_v1",
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
    contractVersion: "execution_feedback_debug_api_v1",
    route: "/api/execution-feedback/debug",
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
        "Set validateOnly: true on the POST body to validate shape without building feedback summaries.",
    },
    outputContract: "batch_execution_feedback_v1",
    dataSource: "executions_only",
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

  return Response.json(
    runBatchExecutionFeedback({
      source: "api:/api/execution-feedback/debug",
      requests,
      validateOnly: getValidateOnly(document),
    }),
  );
}

export const GET = withTraderIntelligenceOwnerRoute("app/api/execution-feedback/debug/route.ts", GETHandler);

export const POST = withTraderIntelligenceOwnerRoute("app/api/execution-feedback/debug/route.ts", POSTHandler);
