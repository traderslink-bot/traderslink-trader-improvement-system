import type { LiveWatchlistCardContent } from "./live-watchlist-types";

export type WatchlistHighRiskCountry = "China" | "Hong Kong" | "Malaysia";

export type WatchlistHighRiskWarning = {
  countryName: WatchlistHighRiskCountry;
  message: string;
};

type BuildWatchlistHighRiskWarningArgs = {
  country: unknown;
  aiReadCard: LiveWatchlistCardContent | null | undefined;
  referenceTime: number;
};

function normalizeCountry(value: unknown): string {
  return typeof value === "string"
    ? value
        .toLowerCase()
        .replace(/\(high risk country\)/g, "")
        .replace(/[._-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    : "";
}

export function getWatchlistHighRiskCountry(value: unknown): WatchlistHighRiskCountry | null {
  const country = normalizeCountry(value);
  if (["china", "cn", "prc", "people's republic of china"].includes(country)) {
    return "China";
  }
  if (["hong kong", "hk", "hong kong sar", "hong kong sar china"].includes(country)) {
    return "Hong Kong";
  }
  if (["malaysia", "my"].includes(country)) {
    return "Malaysia";
  }
  return null;
}

function newYorkDateKey(timestamp: number): string | null {
  if (!Number.isFinite(timestamp)) {
    return null;
  }
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return values.year && values.month && values.day
    ? `${values.year}-${values.month}-${values.day}`
    : null;
}

function normalizeUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }
    url.hash = "";
    return url.href.replace(/\/$/, "");
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function hasConfirmedSameDayCatalyst(
  card: LiveWatchlistCardContent | null | undefined,
  referenceTime: number,
): boolean {
  if (!card) {
    return false;
  }

  let read: unknown;
  try {
    read = JSON.parse(card.body);
  } catch {
    return false;
  }
  if (!isRecord(read) || !isRecord(read.catalystRealityCheck)) {
    return false;
  }

  const catalyst = read.catalystRealityCheck;
  if (catalyst.status !== "confirmed" || !Array.isArray(catalyst.sourceUrls)) {
    return false;
  }
  const catalystUrls = new Set(
    catalyst.sourceUrls
      .map(normalizeUrl)
      .filter((url): url is string => Boolean(url)),
  );
  const referenceDate = newYorkDateKey(referenceTime);
  if (!referenceDate || catalystUrls.size === 0 || !Array.isArray(read.sources)) {
    return false;
  }

  return read.sources.some((source) => {
    if (!isRecord(source) || !isRecord(source.evidence)) {
      return false;
    }
    const sourceUrl = normalizeUrl(source.url);
    const publishedAt = source.evidence.publishedAt;
    const publishedAtMs = typeof publishedAt === "string" ? Date.parse(publishedAt) : NaN;
    return Boolean(
      sourceUrl &&
      catalystUrls.has(sourceUrl) &&
      Number.isFinite(publishedAtMs) &&
      newYorkDateKey(publishedAtMs) === referenceDate,
    );
  });
}

export function buildWatchlistHighRiskWarning({
  country,
  aiReadCard,
  referenceTime,
}: BuildWatchlistHighRiskWarningArgs): WatchlistHighRiskWarning | null {
  const countryName = getWatchlistHighRiskCountry(country);
  if (!countryName || hasConfirmedSameDayCatalyst(aiReadCard, referenceTime)) {
    return null;
  }

  return {
    countryName,
    message:
      `This ticker is associated with ${countryName} and has no confirmed same-day catalyst. ` +
      "Stocks with this profile can be especially vulnerable to pump-and-dump activity and dilution, so treat price-only momentum with extra caution.",
  };
}
