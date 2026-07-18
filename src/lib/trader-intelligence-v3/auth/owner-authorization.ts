import type { TraderIntelligenceOwnerContext } from "../domain";
import {
  validateTraderIntelligenceLocalRequest,
  validateTraderIntelligenceDeployment,
  type TraderIntelligenceLocalRequestEvidence,
  type TraderIntelligenceLocalRequestReasonCode,
  type TraderIntelligenceDeploymentConfig,
  type TraderIntelligenceDeploymentReasonCode,
  type TraderIntelligenceEnvironment,
} from "../deployment";
import { findTraderIntelligenceRouteContainment } from "../contracts";

export interface TraderIntelligenceAuthenticatedSubject {
  subject: string;
}

export interface TraderIntelligenceOwnerSessionResolver {
  resolveOwnerSubject(): Promise<TraderIntelligenceAuthenticatedSubject | null>;
}

export type TraderIntelligenceAuthorizationReasonCode =
  | TraderIntelligenceDeploymentReasonCode
  | TraderIntelligenceLocalRequestReasonCode
  | "ti_v3_route_unclassified"
  | "ti_v3_route_disabled_for_hosting_mode"
  | "ti_v3_owner_session_resolver_missing"
  | "ti_v3_owner_session_resolution_failed"
  | "ti_v3_owner_session_missing"
  | "ti_v3_authenticated_subject_not_owner";

export type TraderIntelligenceOwnerAuthorization =
  | {
      ok: true;
      config: TraderIntelligenceDeploymentConfig;
      owner: TraderIntelligenceOwnerContext;
    }
  | { ok: false; code: TraderIntelligenceAuthorizationReasonCode };

export async function authorizeTraderIntelligenceOwner(args: {
  environment: TraderIntelligenceEnvironment;
  modulePath?: string;
  sessionResolver?: TraderIntelligenceOwnerSessionResolver;
  localRequest?: TraderIntelligenceLocalRequestEvidence;
}): Promise<TraderIntelligenceOwnerAuthorization> {
  const deployment = validateTraderIntelligenceDeployment(args.environment);
  if (!deployment.ok) {
    return deployment;
  }

  const containment = args.modulePath
    ? findTraderIntelligenceRouteContainment(args.modulePath)
    : null;
  if (args.modulePath && !containment) {
    return { ok: false, code: "ti_v3_route_unclassified" };
  }
  if (
    deployment.config.hostingMode === "private_hosted" &&
    containment &&
    (containment.classification === "internal_diagnostics" ||
      containment.classification === "local_only_or_disabled")
  ) {
    return {
      ok: false,
      code: "ti_v3_route_disabled_for_hosting_mode",
    };
  }

  if (deployment.config.hostingMode === "local_only") {
    const localRequest = validateTraderIntelligenceLocalRequest(
      args.localRequest,
    );
    if (!localRequest.ok) {
      return localRequest;
    }
    return {
      ok: true,
      config: deployment.config,
      owner: {
        identity: { ownerId: deployment.config.ownerId },
        authorizationMode: "local_owner_adapter",
      },
    };
  }

  if (!args.sessionResolver) {
    return { ok: false, code: "ti_v3_owner_session_resolver_missing" };
  }

  let authenticatedSubject: TraderIntelligenceAuthenticatedSubject | null;
  try {
    authenticatedSubject = await args.sessionResolver.resolveOwnerSubject();
  } catch {
    return { ok: false, code: "ti_v3_owner_session_resolution_failed" };
  }
  if (!authenticatedSubject) {
    return { ok: false, code: "ti_v3_owner_session_missing" };
  }
  if (authenticatedSubject.subject !== deployment.config.ownerSubject) {
    return { ok: false, code: "ti_v3_authenticated_subject_not_owner" };
  }

  return {
    ok: true,
    config: deployment.config,
    owner: {
      identity: { ownerId: deployment.config.ownerId },
      authorizationMode: "provisional_discord_session_adapter",
    },
  };
}
