export const TRADER_INTELLIGENCE_PRIVATE_CACHE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
  Pragma: "no-cache",
  Expires: "0",
  Vary: "Cookie",
} as const;

export function applyTraderIntelligencePrivateCachePolicy(
  response: Response,
): Response {
  for (const [name, value] of Object.entries(
    TRADER_INTELLIGENCE_PRIVATE_CACHE_HEADERS,
  )) {
    response.headers.set(name, value);
  }
  return response;
}

export function traderIntelligencePrivateJson(
  body: unknown,
  init?: ResponseInit,
): Response {
  return applyTraderIntelligencePrivateCachePolicy(Response.json(body, init));
}
