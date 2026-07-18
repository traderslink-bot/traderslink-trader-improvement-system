export const TRADER_INTELLIGENCE_PRIVATE_CACHE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
  Pragma: "no-cache",
  Expires: "0",
} as const;

export function mergeTraderIntelligenceVaryCookie(
  value: string | null,
): string {
  const tokens = (value ?? "")
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const deduplicated = tokens.filter((token) => {
    const normalized = token.toLowerCase();
    if (seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
  if (!seen.has("cookie")) {
    deduplicated.push("Cookie");
  }
  return deduplicated.join(", ");
}

export function applyTraderIntelligencePrivateCachePolicy(
  response: Response,
): Response {
  for (const [name, value] of Object.entries(
    TRADER_INTELLIGENCE_PRIVATE_CACHE_HEADERS,
  )) {
    response.headers.set(name, value);
  }
  response.headers.set(
    "Vary",
    mergeTraderIntelligenceVaryCookie(response.headers.get("Vary")),
  );
  return response;
}

export function traderIntelligencePrivateJson(
  body: unknown,
  init?: ResponseInit,
): Response {
  return applyTraderIntelligencePrivateCachePolicy(Response.json(body, init));
}
