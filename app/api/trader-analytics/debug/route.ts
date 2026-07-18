import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth";

import { runTraderAnalyticsReport } from "../../../../src/lib/trader-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ApiErrorBody {
  contractVersion: "trader_analytics_api_error_v1";
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
      contractVersion: "trader_analytics_api_error_v1",
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
    contractVersion: "trader_analytics_debug_api_v1",
    route: "/api/trader-analytics/debug",
    methods: ["GET", "POST"],
    requestShapes: [
      "single trade request",
      "{ request }",
      "{ trade }",
      "{ requests: [...] }",
      "{ trades: [...] }",
      "{ summaries: [...] }",
      "execution_feedback_summary_v1[]",
    ],
    options: {
      validateOnly:
        "Set validateOnly: true on the POST body to validate request shape without building execution summaries.",
    },
    outputContract: "trader_analytics_report_v1",
    dataSource: "execution_feedback_summaries",
    executionOnly: true,
    marketContextUsed: false,
    debugOnly: true,
    endUserExportSupported: false,
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

  try {
    return Response.json(
      runTraderAnalyticsReport({
        source: "api:/api/trader-analytics/debug",
        document,
        validateOnly: getValidateOnly(document),
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return errorResponse(400, "invalid_request_document", message);
  }
}

export const GET = withTraderIntelligenceOwnerRoute("app/api/trader-analytics/debug/route.ts", GETHandler);

export const POST = withTraderIntelligenceOwnerRoute("app/api/trader-analytics/debug/route.ts", POSTHandler);
