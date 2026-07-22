export const DEFAULT_DISCORD_AUTH_RETURN_TO = "/watchlist";

export function normalizeDiscordAuthReturnTo(
  value: string | null | undefined,
): string {
  const candidate = value?.trim();

  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return DEFAULT_DISCORD_AUTH_RETURN_TO;
  }

  try {
    const parsed = new URL(candidate, "https://traderslink.pro");
    if (parsed.origin !== "https://traderslink.pro") {
      return DEFAULT_DISCORD_AUTH_RETURN_TO;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return DEFAULT_DISCORD_AUTH_RETURN_TO;
  }
}

export function isWatchlistAuthReturnTo(returnTo: string): boolean {
  const pathname = new URL(returnTo, "https://traderslink.pro").pathname;
  return pathname === "/watchlist" || pathname.startsWith("/watchlist/");
}

export function buildDiscordAuthResultUrl(args: {
  origin: string;
  returnTo: string;
  status: string;
}): URL {
  const url = new URL(normalizeDiscordAuthReturnTo(args.returnTo), args.origin);
  url.searchParams.set("auth", args.status);
  return url;
}
