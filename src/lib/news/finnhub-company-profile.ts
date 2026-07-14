type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit & { next?: { revalidate?: number } },
) => Promise<Response>;

export type FinnhubCompanyProfile = {
  country: string | null;
  exchange: string | null;
  industry: string | null;
  marketCapitalization: number | null;
  name: string | null;
  shareOutstanding: number | null;
  weburl: string | null;
};

type FinnhubCompanyProfileOptions = {
  apiKey?: string | null;
  fetchImpl?: FetchLike;
};

function normalizedText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized || null;
}

function positiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

function normalizeSymbol(value: string): string | null {
  const symbol = value.trim().toUpperCase();
  return /^[A-Z0-9.-]{1,15}$/.test(symbol) ? symbol : null;
}

export function normalizeFinnhubCompanyProfile(
  value: unknown,
): FinnhubCompanyProfile | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const profile = value as Record<string, unknown>;
  const normalized: FinnhubCompanyProfile = {
    country: normalizedText(profile.country),
    exchange: normalizedText(profile.exchange),
    industry: normalizedText(profile.finnhubIndustry),
    marketCapitalization: positiveNumber(profile.marketCapitalization),
    name: normalizedText(profile.name),
    shareOutstanding: positiveNumber(profile.shareOutstanding),
    weburl: normalizedText(profile.weburl),
  };

  return Object.values(normalized).some((field) => field !== null)
    ? normalized
    : null;
}

export async function getFinnhubCompanyProfile(
  symbolInput: string,
  options: FinnhubCompanyProfileOptions = {},
): Promise<FinnhubCompanyProfile | null> {
  const symbol = normalizeSymbol(symbolInput);
  const apiKey =
    options.apiKey === undefined
      ? process.env.FINNHUB_API_KEY?.trim()
      : options.apiKey?.trim();
  if (!symbol || !apiKey) return null;

  const url = new URL("https://finnhub.io/api/v1/stock/profile2");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("token", apiKey);

  try {
    const response = await (options.fetchImpl ?? fetch)(url, {
      method: "GET",
      next: { revalidate: 86_400 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return null;

    return normalizeFinnhubCompanyProfile(await response.json());
  } catch {
    return null;
  }
}

export function formatFinnhubMarketCap(value: number | null): string | null {
  if (value === null) return null;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}B`;
  if (value >= 1) return `${value.toFixed(2)}M`;
  return `${(value * 1_000).toFixed(2)}K`;
}

export function formatFinnhubExchange(value: string | null): string | null {
  if (!value) return null;

  const upper = value.toUpperCase();
  if (upper.includes("NASDAQ")) return "Nasdaq";
  if (upper.includes("NYSE AMERICAN")) return "NYSE American";
  if (upper.includes("NYSE ARCA")) return "NYSE Arca";
  if (upper.includes("NEW YORK STOCK EXCHANGE") || upper === "NYSE") {
    return "NYSE";
  }

  return value
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatFinnhubWebsite(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.replace(/\/+$/g, "");
  return /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;
}

export function formatFinnhubCountry(value: string | null): string | null {
  if (!value) return null;
  const highRiskCountries = new Set(["china", "cn", "singapore", "sg", "israel", "il"]);
  return highRiskCountries.has(value.trim().toLowerCase())
    ? `${value} (High Risk Country)`
    : value;
}
