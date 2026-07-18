export const TRADER_INTELLIGENCE_LOOPBACK_HOSTS = [
  "localhost",
  "127.0.0.1",
  "[::1]",
] as const;

export const TRADER_INTELLIGENCE_LOCAL_LISTENER_HOST = "127.0.0.1";
export const TRADER_INTELLIGENCE_LOCAL_LISTENER_ASSERTION_HEADER =
  "x-trader-intelligence-local-listener";
export const TRADER_INTELLIGENCE_LOCAL_LISTENER_TOKEN_ENV =
  "TRADER_INTELLIGENCE_LOCAL_LISTENER_TOKEN";

export type TraderIntelligenceLoopbackHost =
  (typeof TRADER_INTELLIGENCE_LOOPBACK_HOSTS)[number];

export type TraderIntelligenceLocalRequestReasonCode =
  | "ti_v3_local_request_context_missing"
  | "ti_v3_local_request_host_missing"
  | "ti_v3_local_request_host_malformed"
  | "ti_v3_local_request_host_not_loopback"
  | "ti_v3_local_request_url_malformed"
  | "ti_v3_local_request_url_not_loopback"
  | "ti_v3_local_request_host_url_mismatch"
  | "ti_v3_local_request_remote_address_not_loopback"
  | "ti_v3_local_request_forwarded_header_forbidden"
  | "ti_v3_local_request_proxy_or_tunnel_header_forbidden";

export type TraderIntelligenceLoopbackAuthorityValidation =
  | {
      ok: true;
      hostname: TraderIntelligenceLoopbackHost;
      port: string | null;
      authority: string;
    }
  | {
      ok: false;
      code:
        | "ti_v3_local_request_host_malformed"
        | "ti_v3_local_request_host_not_loopback";
    };

export type TraderIntelligenceLocalRequestValidation =
  | {
      ok: true;
      hostname: TraderIntelligenceLoopbackHost;
      port: string | null;
    }
  | { ok: false; code: TraderIntelligenceLocalRequestReasonCode };

export interface TraderIntelligenceLocalRequestEvidence {
  headers: Headers;
  requestUrl?: string;
}

const FORWARDED_HEADERS = [
  "forwarded",
  "x-forwarded-host",
  "x-forwarded-for",
  "x-forwarded-proto",
] as const;

const PROXY_OR_TUNNEL_HEADERS = [
  "cf-connecting-ip",
  "cf-ray",
  "cf-visitor",
  "client-ip",
  "fly-client-ip",
  "ngrok-skip-browser-warning",
  "true-client-ip",
  "via",
  "x-envoy-external-address",
  "x-forwarded-port",
  "x-forwarded-server",
  "x-ngrok-id",
  "x-original-forwarded-for",
  "x-original-host",
  "x-real-ip",
  "x-tunnel-id",
] as const;

const NEXT_SYNTHESIZED_FORWARDED_HEADERS = [
  "x-forwarded-host",
  "x-forwarded-for",
  "x-forwarded-proto",
  "x-forwarded-port",
] as const;

function hasTrustedLocalListenerAssertion(headers: Headers): boolean {
  const configured = process.env[TRADER_INTELLIGENCE_LOCAL_LISTENER_TOKEN_ENV];
  const supplied = headers.get(
    TRADER_INTELLIGENCE_LOCAL_LISTENER_ASSERTION_HEADER,
  );
  return Boolean(configured && supplied && configured === supplied);
}

export function isTraderIntelligenceLoopbackPeerAddress(
  value: string | undefined,
): boolean {
  return (
    value === "127.0.0.1" ||
    value === "::1" ||
    value === "::ffff:127.0.0.1"
  );
}

function validPort(port: string | undefined): string | null | false {
  if (port === undefined) {
    return null;
  }
  if (!/^\d{1,5}$/.test(port)) {
    return false;
  }
  const parsed = Number(port);
  return parsed >= 1 && parsed <= 65_535 ? String(parsed) : false;
}

function appearsSyntacticallyValidHost(value: string): boolean {
  if (
    value.length === 0 ||
    value !== value.trim() ||
    /[\s,@/\\?#\u0000-\u001f\u007f]/.test(value)
  ) {
    return false;
  }
  try {
    const parsed = new URL(`http://${value}`);
    return Boolean(
      parsed.hostname &&
        !parsed.username &&
        !parsed.password &&
        parsed.pathname === "/" &&
        !parsed.search &&
        !parsed.hash,
    );
  } catch {
    return false;
  }
}

export function validateTraderIntelligenceLoopbackAuthority(
  value: string,
): TraderIntelligenceLoopbackAuthorityValidation {
  if (!appearsSyntacticallyValidHost(value)) {
    return { ok: false, code: "ti_v3_local_request_host_malformed" };
  }

  const ipv6Match = /^\[::1\](?::(\d{1,5}))?$/i.exec(value);
  const hostnameMatch = /^(localhost|127\.0\.0\.1)(?::(\d{1,5}))?$/i.exec(
    value,
  );
  const match = ipv6Match ?? hostnameMatch;
  if (!match) {
    return { ok: false, code: "ti_v3_local_request_host_not_loopback" };
  }

  const port = validPort(ipv6Match ? ipv6Match[1] : hostnameMatch?.[2]);
  if (port === false) {
    return { ok: false, code: "ti_v3_local_request_host_malformed" };
  }

  const hostname = (ipv6Match
    ? "[::1]"
    : hostnameMatch?.[1].toLowerCase()) as TraderIntelligenceLoopbackHost;
  return {
    ok: true,
    hostname,
    port,
    authority: `${hostname}${port ? `:${port}` : ""}`,
  };
}

function authorityFromRequestUrl(
  requestUrl: string,
): TraderIntelligenceLoopbackAuthorityValidation | {
  ok: false;
  code: "ti_v3_local_request_url_malformed";
} {
  const authorityMatch = /^(https?):\/\/([^/?#]+)(?:[/?#]|$)/i.exec(requestUrl);
  if (!authorityMatch || authorityMatch[2].includes("@")) {
    return { ok: false, code: "ti_v3_local_request_url_malformed" };
  }
  try {
    const parsed = new URL(requestUrl);
    if (
      parsed.protocol !== "http:" &&
      parsed.protocol !== "https:"
    ) {
      return { ok: false, code: "ti_v3_local_request_url_malformed" };
    }
    if (parsed.username || parsed.password) {
      return { ok: false, code: "ti_v3_local_request_url_malformed" };
    }
  } catch {
    return { ok: false, code: "ti_v3_local_request_url_malformed" };
  }
  return validateTraderIntelligenceLoopbackAuthority(authorityMatch[2]);
}

export function validateTraderIntelligenceLocalRequest(
  evidence: TraderIntelligenceLocalRequestEvidence | undefined,
): TraderIntelligenceLocalRequestValidation {
  if (!evidence) {
    return { ok: false, code: "ti_v3_local_request_context_missing" };
  }
  const hasTrustedListenerAssertion = hasTrustedLocalListenerAssertion(
    evidence.headers,
  );
  if (
    evidence.headers.has("forwarded") ||
    (!hasTrustedListenerAssertion &&
      FORWARDED_HEADERS.some((name) => evidence.headers.has(name)))
  ) {
    return {
      ok: false,
      code: "ti_v3_local_request_forwarded_header_forbidden",
    };
  }
  if (
    PROXY_OR_TUNNEL_HEADERS.some(
      (name) =>
        evidence.headers.has(name) &&
        !(hasTrustedListenerAssertion && name === "x-forwarded-port"),
    )
  ) {
    return {
      ok: false,
      code: "ti_v3_local_request_proxy_or_tunnel_header_forbidden",
    };
  }

  const host = evidence.headers.get("host");
  if (!host) {
    return { ok: false, code: "ti_v3_local_request_host_missing" };
  }
  const hostValidation = validateTraderIntelligenceLoopbackAuthority(host);
  if (!hostValidation.ok) {
    return hostValidation;
  }

  if (evidence.requestUrl) {
    const urlValidation = authorityFromRequestUrl(evidence.requestUrl);
    if (!urlValidation.ok) {
      return {
        ok: false,
        code:
          urlValidation.code === "ti_v3_local_request_host_not_loopback"
            ? "ti_v3_local_request_url_not_loopback"
            : urlValidation.code === "ti_v3_local_request_host_malformed"
              ? "ti_v3_local_request_url_malformed"
              : urlValidation.code,
      };
    }
    if (
      hostValidation.authority !== urlValidation.authority &&
      (!hasTrustedListenerAssertion ||
        hostValidation.port !== urlValidation.port)
    ) {
      return {
        ok: false,
        code: "ti_v3_local_request_host_url_mismatch",
      };
    }
  }

  if (hasTrustedListenerAssertion) {
    const expectedPort = hostValidation.port ?? "80";
    const synthesizedForwardingIsExact =
      NEXT_SYNTHESIZED_FORWARDED_HEADERS.every((name) =>
        evidence.headers.has(name),
      ) &&
      evidence.headers.get("x-forwarded-host") === host &&
      isTraderIntelligenceLoopbackPeerAddress(
        evidence.headers.get("x-forwarded-for") ?? undefined,
      ) &&
      evidence.headers.get("x-forwarded-proto") === "http" &&
      evidence.headers.get("x-forwarded-port") === expectedPort;
    if (!synthesizedForwardingIsExact) {
      return {
        ok: false,
        code: "ti_v3_local_request_forwarded_header_forbidden",
      };
    }
  }

  return {
    ok: true,
    hostname: hostValidation.hostname,
    port: hostValidation.port,
  };
}

export type TraderIntelligenceOriginNormalization =
  | { ok: true; origin: string }
  | { ok: false };

export function normalizeTraderIntelligenceLoopbackOrigin(
  value: string,
): TraderIntelligenceOriginNormalization {
  if (value !== value.trim() || value === "null") {
    return { ok: false };
  }
  const authorityMatch = /^(https?):\/\/([^/?#]+)\/?$/i.exec(value);
  if (!authorityMatch || authorityMatch[2].includes("@")) {
    return { ok: false };
  }
  const authority = validateTraderIntelligenceLoopbackAuthority(
    authorityMatch[2],
  );
  if (!authority.ok) {
    return { ok: false };
  }
  try {
    const parsed = new URL(value);
    if (
      (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) {
      return { ok: false };
    }
    return { ok: true, origin: parsed.origin };
  } catch {
    return { ok: false };
  }
}
