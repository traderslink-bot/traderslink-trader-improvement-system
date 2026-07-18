import type { TraderIntelligenceDeploymentConfig } from "../deployment";

export type TraderIntelligenceMutationOriginReasonCode =
  | "ti_v3_mutation_method_not_allowed"
  | "ti_v3_mutation_origin_missing"
  | "ti_v3_mutation_origin_invalid";

export type TraderIntelligenceMutationOriginValidation =
  | { ok: true }
  | { ok: false; code: TraderIntelligenceMutationOriginReasonCode };

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function normalizeOrigin(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.username || parsed.password || parsed.origin === "null") {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

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

  const suppliedOrigin = args.request.headers.get("origin");
  if (!suppliedOrigin) {
    return { ok: false, code: "ti_v3_mutation_origin_missing" };
  }
  const normalizedSuppliedOrigin = normalizeOrigin(suppliedOrigin);
  if (!normalizedSuppliedOrigin) {
    return { ok: false, code: "ti_v3_mutation_origin_invalid" };
  }

  const requestOrigin = normalizeOrigin(args.request.url);
  const allowedOrigins = new Set(
    [requestOrigin, ...args.config.approvedOrigins.map(normalizeOrigin)].filter(
      (origin): origin is string => Boolean(origin),
    ),
  );
  return allowedOrigins.has(normalizedSuppliedOrigin)
    ? { ok: true }
    : { ok: false, code: "ti_v3_mutation_origin_invalid" };
}
