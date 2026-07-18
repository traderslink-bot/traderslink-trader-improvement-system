import type { TraderIntelligenceDeploymentConfig } from "../deployment";
import { normalizeTraderIntelligenceLoopbackOrigin } from "../deployment";

export type TraderIntelligenceMutationOriginReasonCode =
  | "ti_v3_mutation_method_not_allowed"
  | "ti_v3_mutation_origin_not_configured"
  | "ti_v3_mutation_origin_missing"
  | "ti_v3_mutation_origin_invalid";

export type TraderIntelligenceMutationOriginValidation =
  | { ok: true }
  | { ok: false; code: TraderIntelligenceMutationOriginReasonCode };

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function validateTraderIntelligenceMutationOrigin(args: {
  request: Request;
  config: TraderIntelligenceDeploymentConfig;
  routeMethods: readonly string[];
}): TraderIntelligenceMutationOriginValidation {
  const method = args.request.method.toUpperCase();
  if (!args.routeMethods.includes(method)) {
    return { ok: false, code: "ti_v3_mutation_method_not_allowed" };
  }
  if (SAFE_METHODS.has(method)) {
    return { ok: true };
  }

  if (args.config.approvedOrigins.length === 0) {
    return { ok: false, code: "ti_v3_mutation_origin_not_configured" };
  }

  const suppliedOrigin = args.request.headers.get("origin");
  if (!suppliedOrigin) {
    return { ok: false, code: "ti_v3_mutation_origin_missing" };
  }
  const normalizedSuppliedOrigin =
    normalizeTraderIntelligenceLoopbackOrigin(suppliedOrigin);
  if (!normalizedSuppliedOrigin.ok) {
    return { ok: false, code: "ti_v3_mutation_origin_invalid" };
  }
  return args.config.approvedOrigins.includes(normalizedSuppliedOrigin.origin)
    ? { ok: true }
    : { ok: false, code: "ti_v3_mutation_origin_invalid" };
}
