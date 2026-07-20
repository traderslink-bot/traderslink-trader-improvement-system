import type {
  TradersLinkAiReadBias,
  TradersLinkAiReadCatalystContext,
  TradersLinkAiReadCatalystStatus,
  TradersLinkAiReadConfidence,
  TradersLinkAiReadDilutionLevel,
  TradersLinkAiReadDilutionRisk,
  TradersLinkAiReadDilutionTimingLane,
  TradersLinkAiReadDilutionTimingStatus,
  TradersLinkAiReadDilutionTrigger,
  TradersLinkAiReadLevel,
  TradersLinkAiReadListingContext,
  TradersLinkAiReadListingImmediacy,
  TradersLinkAiReadListingStatus,
  TradersLinkAiReadMarketSession,
  TradersLinkAiReadPayload,
  TradersLinkAiReadSource,
  TradersLinkAiReadTarget,
  TradersLinkAiReadUsage,
} from "./live-watchlist-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNullablePrice(value: unknown): value is number | null {
  return value === null || (isFiniteNumber(value) && value > 0);
}

function isLevel(value: unknown): value is TradersLinkAiReadLevel {
  return (
    isRecord(value) &&
    typeof value.label === "string" &&
    isNullablePrice(value.price) &&
    typeof value.rationale === "string"
  );
}

function isTarget(value: unknown): value is TradersLinkAiReadTarget {
  return (
    isRecord(value) &&
    typeof value.label === "string" &&
    isNullablePrice(value.price) &&
    typeof value.condition === "string"
  );
}

function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isSourceEvidence(value: unknown): boolean {
  return (
    isRecord(value) &&
    isNullableString(value.publishedAt) &&
    isNullableString(value.filingType) &&
    isNullableString(value.retrievedAt) &&
    isNullableString(value.supportingExcerpt) &&
    (value.excerptKind === "article_summary" || value.excerptKind === "article_title" || value.excerptKind === "web_search_title") &&
    (value.supersessionStatus === "latest_in_retrieved_window" || value.supersessionStatus === "not_checked")
  );
}

function isSource(value: unknown): value is TradersLinkAiReadSource {
  return (
    isRecord(value) &&
    typeof value.title === "string" &&
    typeof value.url === "string" &&
    isSafeHttpUrl(value.url) &&
    (value.sourceType === "press_release_sec_database" || value.sourceType === "web_search") &&
    (value.evidence === undefined || isSourceEvidence(value.evidence))
  );
}

function isSafeUrlArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= 6 &&
    value.every((url) => typeof url === "string" && isSafeHttpUrl(url))
  );
}

const CATALYST_STATUSES = new Set<TradersLinkAiReadCatalystStatus>([
  "confirmed",
  "conditional",
  "unverified",
  "none",
]);
const DILUTION_LEVELS = new Set<TradersLinkAiReadDilutionLevel>([
  "none",
  "low",
  "medium",
  "high",
  "unknown",
]);
const DILUTION_TIMING_STATUSES = new Set<TradersLinkAiReadDilutionTimingStatus>([
  "immediate",
  "near_term",
  "conditional",
  "delayed",
  "unknown",
  "none",
]);
const DILUTION_TRIGGERS = new Set<TradersLinkAiReadDilutionTrigger>([
  "already_issued",
  "closing",
  "settlement",
  "shareholder_approval",
  "registration_effective",
  "resale_registration",
  "warrant_exercise",
  "conversion",
  "purchase_trigger",
  "lockup_expiry",
  "merger_closing",
  "unknown",
  "none",
]);
const LISTING_STATUSES = new Set<TradersLinkAiReadListingStatus>([
  "none",
  "deficiency_notice",
  "staff_determination",
  "hearing_requested",
  "hearing_pending",
  "extension_or_exception",
  "suspension_scheduled",
  "delisted",
  "unknown",
]);
const LISTING_IMMEDIACY = new Set<TradersLinkAiReadListingImmediacy>([
  "background",
  "monitor",
  "near_term",
  "immediate",
  "unknown",
]);

function isCatalystContext(value: unknown): value is TradersLinkAiReadCatalystContext {
  return (
    isRecord(value) &&
    typeof value.summary === "string" &&
    CATALYST_STATUSES.has(value.status as TradersLinkAiReadCatalystStatus) &&
    typeof value.dayTradeRelevance === "string" &&
    isSafeUrlArray(value.sourceUrls)
  );
}

function isIsoDate(value: unknown): value is string | null {
  if (value === null) {
    return true;
  }
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
}

function isDilutionTimingLane(value: unknown): value is TradersLinkAiReadDilutionTimingLane {
  return (
    isRecord(value) &&
    DILUTION_TIMING_STATUSES.has(value.status as TradersLinkAiReadDilutionTimingStatus) &&
    isIsoDate(value.earliestDate) &&
    DILUTION_TRIGGERS.has(value.trigger as TradersLinkAiReadDilutionTrigger) &&
    typeof value.summary === "string"
  );
}

function isDilutionRisk(value: unknown): value is TradersLinkAiReadDilutionRisk {
  return (
    isRecord(value) &&
    DILUTION_LEVELS.has(value.level as TradersLinkAiReadDilutionLevel) &&
    typeof value.summary === "string" &&
    typeof value.dayTradeRelevance === "string" &&
    isSafeUrlArray(value.sourceUrls) &&
    (value.canCompanyIssueToday === undefined ||
      value.canCompanyIssueToday === null ||
      typeof value.canCompanyIssueToday === "boolean") &&
    (value.companyIssuance === undefined || isDilutionTimingLane(value.companyIssuance)) &&
    (value.publicResale === undefined || isDilutionTimingLane(value.publicResale))
  );
}

function isNullableNonNegativeNumber(value: unknown): value is number | null {
  return value === null || (isFiniteNumber(value) && value >= 0);
}

function isUsage(value: unknown): value is TradersLinkAiReadUsage {
  return (
    isRecord(value) &&
    [
      value.inputTokens,
      value.cachedInputTokens,
      value.outputTokens,
      value.totalTokens,
      value.webSearchCallCount,
      value.webSearchCostUsd,
    ].every((item) => isFiniteNumber(item) && item >= 0) &&
    isNullableNonNegativeNumber(value.tokenCostUsd) &&
    isNullableNonNegativeNumber(value.estimatedTotalCostUsd) &&
    isRecord(value.pricing) &&
    (value.pricing.source === "built_in" ||
      value.pricing.source === "env_override" ||
      value.pricing.source === "unknown") &&
    isNullableNonNegativeNumber(value.pricing.inputPer1M) &&
    isNullableNonNegativeNumber(value.pricing.cachedInputPer1M) &&
    isNullableNonNegativeNumber(value.pricing.outputPer1M) &&
    isFiniteNumber(value.pricing.webSearchPer1KCalls) &&
    value.pricing.webSearchPer1KCalls >= 0
  );
}

function isListingContext(value: unknown): value is TradersLinkAiReadListingContext {
  return (
    isRecord(value) &&
    LISTING_STATUSES.has(value.status as TradersLinkAiReadListingStatus) &&
    LISTING_IMMEDIACY.has(value.immediacy as TradersLinkAiReadListingImmediacy) &&
    typeof value.summary === "string" &&
    typeof value.dayTradeRelevance === "string" &&
    isSafeUrlArray(value.sourceUrls)
  );
}

const BIASES = new Set<TradersLinkAiReadBias>(["bullish", "neutral", "bearish", "mixed"]);
const CONFIDENCE = new Set<TradersLinkAiReadConfidence>(["low", "medium", "high"]);
const SESSIONS = new Set<TradersLinkAiReadMarketSession>([
  "premarket",
  "regular",
  "postmarket",
  "closed",
  "unknown",
]);

export type TradersLinkAiPullbackPlanState =
  | "watch"
  | "testing"
  | "reclaim_required";

export type TradersLinkAiPullbackPlan = {
  state: TradersLinkAiPullbackPlanState;
  zoneLow: number;
  zoneHigh: number;
  reclaimPrice: number;
  invalidationPrice: number;
  firstBounceTarget: number | null;
};

/**
 * Builds the optional pullback plan exclusively from independently grounded
 * AI-read boundaries. It intentionally never promotes arbitrary nearby support
 * into a dip-buy call.
 */
export function deriveTradersLinkAiPullbackPlan(
  read: TradersLinkAiReadPayload,
): TradersLinkAiPullbackPlan | null {
  const needsToHold = read.needsToHold.price;
  const cautionBelow = read.cautionBelow.price;
  const zoneHigh = read.momentumFailure.price;
  const zoneLow = (read.downsideCheckpoints ?? [])
    .map((checkpoint) => checkpoint.price)
    .find((price): price is number => price !== null && zoneHigh !== null && price < zoneHigh) ?? null;

  if (
    read.confidence === "low" ||
    (read.bias !== "bullish" && read.bias !== "mixed") ||
    needsToHold === null ||
    cautionBelow === null ||
    zoneHigh === null ||
    zoneLow === null ||
    !(needsToHold > cautionBelow && cautionBelow > zoneHigh && zoneHigh > zoneLow) ||
    read.currentPrice < zoneLow
  ) {
    return null;
  }

  const state: TradersLinkAiPullbackPlanState = read.currentPrice >= zoneHigh
    ? "watch"
    : read.currentPrice >= zoneLow
      ? "testing"
      : "reclaim_required";
  const firstBounceTarget = cautionBelow > zoneHigh ? cautionBelow : needsToHold;

  return {
    state,
    zoneLow,
    zoneHigh,
    reclaimPrice: zoneHigh,
    invalidationPrice: zoneLow,
    firstBounceTarget,
  };
}

export function parseTradersLinkAiRead(body: string): TradersLinkAiReadPayload | null {
  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch {
    return null;
  }
  if (!isRecord(value)) {
    return null;
  }
  if (
    value.version !== 2 ||
    typeof value.symbol !== "string" ||
    !isFiniteNumber(value.generatedAt) ||
    !isFiniteNumber(value.dataAsOf) ||
    !isFiniteNumber(value.currentPrice) ||
    !BIASES.has(value.bias as TradersLinkAiReadBias) ||
    !CONFIDENCE.has(value.confidence as TradersLinkAiReadConfidence) ||
    !SESSIONS.has(value.marketSession as TradersLinkAiReadMarketSession) ||
    typeof value.currentRead !== "string" ||
    !isLevel(value.needsToHold) ||
    !isLevel(value.cautionBelow) ||
    !isLevel(value.momentumFailure) ||
    !isLevel(value.mustClear) ||
    !isLevel(value.breakoutContinuation) ||
    !Array.isArray(value.targets) ||
    !value.targets.every(isTarget) ||
    (value.downsideCheckpoints !== undefined &&
      (!Array.isArray(value.downsideCheckpoints) || !value.downsideCheckpoints.every(isTarget))) ||
    !isCatalystContext(value.catalystRealityCheck) ||
    !isDilutionRisk(value.dilutionRisk) ||
    !isListingContext(value.listingStatus) ||
    !Array.isArray(value.riskSummary) ||
    !value.riskSummary.every((risk) => typeof risk === "string") ||
    !Array.isArray(value.sources) ||
    !value.sources.every(isSource) ||
    typeof value.model !== "string" ||
    (value.externalResearchEnabled !== undefined &&
      typeof value.externalResearchEnabled !== "boolean") ||
    typeof value.usedWebSearch !== "boolean" ||
    (value.usage !== undefined && !isUsage(value.usage))
  ) {
    return null;
  }

  const allowedSourceUrls = new Set(
    (value.sources as TradersLinkAiReadSource[]).map((source) => source.url),
  );
  const contextSourceUrls = [
    ...(value.catalystRealityCheck as TradersLinkAiReadCatalystContext).sourceUrls,
    ...(value.dilutionRisk as TradersLinkAiReadDilutionRisk).sourceUrls,
    ...(value.listingStatus as TradersLinkAiReadListingContext).sourceUrls,
  ];
  if (contextSourceUrls.some((url) => !allowedSourceUrls.has(url))) {
    return null;
  }
  return value as TradersLinkAiReadPayload;
}

export function formatAiReadSession(session: TradersLinkAiReadMarketSession): string {
  switch (session) {
    case "premarket":
      return "Premarket";
    case "regular":
      return "Regular session";
    case "postmarket":
      return "Postmarket";
    case "closed":
      return "Market closed";
    default:
      return "Session unknown";
  }
}
