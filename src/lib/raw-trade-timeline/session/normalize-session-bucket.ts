// 2026-04-14
// PURPOSE:
// Provides one canonical normalization boundary for session bucket labels.
// This keeps provider-specific naming quirks out of the raw timeline, PatternInput,
// and downstream pattern logic.

import type { SessionBucket } from "../types/session-context";

const SESSION_BUCKET_ALIASES: Record<string, SessionBucket> = {
  open: "market_open",
  market_open: "market_open",
  regular_open: "market_open",
  opening: "market_open",
  premarket: "pre_market",
  pre_market: "pre_market",
  premarket_session: "pre_market",
  regular: "midday",
  regular_session: "midday",
  intraday: "midday",
  midday: "midday",
  market_close: "close",
  close: "close",
  closing: "close",
  afterhours: "after_hours",
  after_hours: "after_hours",
  post_market: "after_hours",
};

export function normalizeSessionBucketValue(value: string): SessionBucket | "" {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return "";
  }

  return SESSION_BUCKET_ALIASES[normalized] ?? "unknown";
}

export function normalizeRequiredSessionBucketValue(value: string): SessionBucket {
  const normalized = normalizeSessionBucketValue(value);

  if (!normalized) {
    throw new Error("Session bucket cannot be empty.");
  }

  return normalized;
}

export function normalizeOptionalSessionBucketValue(
  value: string | null | undefined,
): SessionBucket | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const normalized = normalizeSessionBucketValue(value);

  return normalized || undefined;
}

export function isMarketOpenSessionBucket(value: string | null | undefined): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  return normalizeSessionBucketValue(value) === "market_open";
}
