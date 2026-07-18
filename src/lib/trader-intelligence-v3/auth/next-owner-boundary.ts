import { cookies } from "next/headers";
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
  const token = (await cookies()).get(
    TRADER_INTELLIGENCE_PROVISIONAL_DISCORD_COOKIE,
  )?.value;
  const authorization = await authorizeTraderIntelligenceOwner({
    environment: process.env,
    modulePath,
    sessionResolver: provisionalDiscordSessionResolver(token),
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
): (request?: TRequest, ...args: TArgs) => Promise<Response> {
  const handlerMethod = handler.name.replace(/Handler$/, "").toUpperCase();

  return async (request, ...args) => {
    if (!request && process.env.NODE_ENV !== "test") {
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
    const effectiveRequest =
      request ??
      (new Request("http://localhost", {
        method: handlerMethod,
        headers: { Origin: "http://localhost" },
      }) as TRequest);
    const containment = findTraderIntelligenceRouteContainment(modulePath);
    const authorization = await authorizeTraderIntelligenceOwner({
      environment: process.env,
      modulePath,
      sessionResolver: provisionalDiscordSessionResolver(
        tokenFromCookieHeader(effectiveRequest.headers.get("cookie")),
      ),
    });
    if (!authorization.ok) {
      return authorizationFailureResponse(authorization.code);
    }
    if (!containment) {
      return authorizationFailureResponse("ti_v3_route_unclassified");
    }

    const originValidation = validateTraderIntelligenceMutationOrigin({
      request: effectiveRequest,
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

    if (!new Set(["GET", "HEAD", "OPTIONS"]).has(effectiveRequest.method)) {
      console.info("Trader Intelligence owner mutation authorized.", {
        eventCode: "ti_v3_owner_mutation_authorized",
        method: effectiveRequest.method,
        routePath: containment.routePath,
      });
    }
    return applyTraderIntelligencePrivateCachePolicy(
      await handler(effectiveRequest, ...args),
    );
  };
}
