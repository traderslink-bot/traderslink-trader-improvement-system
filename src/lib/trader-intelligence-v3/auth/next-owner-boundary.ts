import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";

import { findTraderIntelligenceRouteContainment } from "../contracts";
import type { TraderIntelligenceOwnerContext } from "../domain";
import {
  authorizeTraderIntelligenceOwner,
  type TraderIntelligenceAuthorizationReasonCode,
} from "./owner-authorization";
import { validateTraderIntelligenceMutationOrigin } from "./mutation-origin";
import {
  applyTraderIntelligencePrivateCachePolicy,
  traderIntelligencePrivateJson,
} from "./private-response";
import {
  provisionalDiscordSessionResolver,
  TRADER_INTELLIGENCE_PROVISIONAL_DISCORD_COOKIE,
} from "./provisional-discord-session-adapter";

function tokenFromCookieHeader(cookieHeader: string | null): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }
  for (const part of cookieHeader.split(";")) {
    const [name, ...valueParts] = part.trim().split("=");
    if (name === TRADER_INTELLIGENCE_PROVISIONAL_DISCORD_COOKIE) {
      return decodeURIComponent(valueParts.join("="));
    }
  }
  return undefined;
}

function isConfigurationReason(
  code: TraderIntelligenceAuthorizationReasonCode,
): boolean {
  return (
    code.includes("deployment_profile") ||
    code.includes("hosting_mode") ||
    code.includes("hosted_environment") ||
    code.includes("owner_id_missing") ||
    code.includes("owner_subject_missing") ||
    code.includes("storage_mode") ||
    code.includes("data_mode") ||
    code.includes("local_bypass") ||
    code.includes("local_request") ||
    code.includes("approved_origin") ||
    code.includes("db_path") ||
    code.includes("private_data_root") ||
    code.includes("sample_data_db_path") ||
    code === "ti_v3_route_unclassified"
  );
}

function authorizationFailureResponse(
  code: TraderIntelligenceAuthorizationReasonCode,
): Response {
  if (isConfigurationReason(code)) {
    return traderIntelligencePrivateJson(
      {
        contractVersion: "trader_intelligence_v3_boundary_error_v1",
        error: { code, message: "Trader Intelligence is unavailable." },
      },
      { status: 503 },
    );
  }
  return traderIntelligencePrivateJson(
    {
      contractVersion: "trader_intelligence_v3_boundary_error_v1",
      error: {
        code: "ti_v3_resource_unavailable",
        message: "Resource unavailable.",
      },
    },
    { status: 404 },
  );
}

export async function requireTraderIntelligenceOwnerPageAccess(
  modulePath?: string,
): Promise<TraderIntelligenceOwnerContext> {
  const [cookieStore, requestHeaders] = await Promise.all([
    cookies(),
    headers(),
  ]);
  const token = cookieStore.get(
    TRADER_INTELLIGENCE_PROVISIONAL_DISCORD_COOKIE,
  )?.value;
  const authorization = await authorizeTraderIntelligenceOwner({
    environment: process.env,
    modulePath,
    sessionResolver: provisionalDiscordSessionResolver(token),
    localRequest: { headers: requestHeaders },
  });
  if (!authorization.ok) {
    console.error("Trader Intelligence page access denied.", {
      code: authorization.code,
      modulePath: modulePath ?? "app/intelligence/layout.tsx",
    });
    notFound();
  }
  return authorization.owner;
}

export function withTraderIntelligenceOwnerRoute<
  TRequest extends Request,
  TArgs extends unknown[],
>(
  modulePath: string,
  handler: (
    request: TRequest,
    ...args: TArgs
  ) => Response | Promise<Response>,
): (request: TRequest, ...args: TArgs) => Promise<Response> {
  return async (request, ...args) => {
    if (!request) {
      return traderIntelligencePrivateJson(
        {
          contractVersion: "trader_intelligence_v3_boundary_error_v1",
          error: {
            code: "ti_v3_request_context_missing",
            message: "Request rejected.",
          },
        },
        { status: 400 },
      );
    }
    const containment = findTraderIntelligenceRouteContainment(modulePath);
    const authorization = await authorizeTraderIntelligenceOwner({
      environment: process.env,
      modulePath,
      sessionResolver: provisionalDiscordSessionResolver(
        tokenFromCookieHeader(request.headers.get("cookie")),
      ),
      localRequest: { headers: request.headers, requestUrl: request.url },
    });
    if (!authorization.ok) {
      return authorizationFailureResponse(authorization.code);
    }
    if (!containment) {
      return authorizationFailureResponse("ti_v3_route_unclassified");
    }

    const originValidation = validateTraderIntelligenceMutationOrigin({
      request,
      config: authorization.config,
      routeMethods: containment.methods,
    });
    if (!originValidation.ok) {
      const status =
        originValidation.code === "ti_v3_mutation_method_not_allowed"
          ? 405
          : 403;
      return traderIntelligencePrivateJson(
        {
          contractVersion: "trader_intelligence_v3_boundary_error_v1",
          error: {
            code: originValidation.code,
            message: "Request rejected.",
          },
        },
        { status },
      );
    }

    if (
      containment.realOwnerDataMethods.includes(request.method.toUpperCase()) &&
      authorization.config.dataMode !== "real_owner_data"
    ) {
      return traderIntelligencePrivateJson(
        {
          contractVersion: "trader_intelligence_v3_boundary_error_v1",
          error: {
            code: "ti_v3_real_owner_data_mode_required",
            message: "Request rejected.",
          },
        },
        { status: 403 },
      );
    }

    if (!new Set(["GET", "HEAD", "OPTIONS"]).has(request.method)) {
      console.info("Trader Intelligence non-durable local mutation diagnostic.", {
        eventCode: "ti_v3_local_mutation_diagnostic",
        method: request.method,
        routePath: containment.routePath,
      });
    }
    try {
      return applyTraderIntelligencePrivateCachePolicy(
        await handler(request, ...args),
      );
    } catch (error) {
      console.error("Trader Intelligence handler failed.", {
        eventCode: "ti_v3_handler_failure",
        errorName: error instanceof Error ? error.name : "UnknownError",
        method: request.method,
        modulePath,
      });
      return traderIntelligencePrivateJson(
        {
          contractVersion: "trader_intelligence_v3_boundary_error_v1",
          error: {
            code: "ti_v3_handler_failure",
            message: "Request failed.",
          },
        },
        { status: 500 },
      );
    }
  };
}
