const COUNTRY_CODE_ALIASES: Record<string, string> = {
  australia: "AU",
  bermuda: "BM",
  canada: "CA",
  china: "CN",
  "hong kong": "HK",
  ireland: "IE",
  israel: "IL",
  japan: "JP",
  malaysia: "MY",
  singapore: "SG",
  "south korea": "KR",
  taiwan: "TW",
  "united kingdom": "GB",
  "united states": "US",
  "united states of america": "US",
  uk: "GB",
  usa: "US",
};

export type WatchlistCountryFlag = {
  code: string;
  label: string;
};

function countryCodeFromValue(value: string): string | null {
  const normalized = value
    .replace(/\s*\(high risk country\)\s*$/i, "")
    .trim();
  if (!normalized) {
    return null;
  }

  const alias = COUNTRY_CODE_ALIASES[normalized.toLowerCase()];
  if (alias) {
    return alias;
  }

  if (/^[a-z]{2}$/i.test(normalized)) {
    return normalized.toUpperCase();
  }

  return null;
}

function countryLabel(code: string, fallback: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? fallback;
  } catch {
    return fallback;
  }
}

export function getWatchlistCountryFlag(country: unknown): WatchlistCountryFlag | null {
  if (typeof country !== "string") {
    return null;
  }

  const code = countryCodeFromValue(country);
  if (!code) {
    return null;
  }

  return {
    code,
    label: countryLabel(code, country.trim()),
  };
}
