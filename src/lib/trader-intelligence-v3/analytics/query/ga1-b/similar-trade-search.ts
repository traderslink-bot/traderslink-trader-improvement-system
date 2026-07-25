import { compareUnicodeCodePoints, serializeCanonicalValue } from "../../../domain/canonical";
import {
  compareExactRatios,
  createExactRatio,
  decimalToExactRatio,
  validateExactDecimal,
  type ExactRatio,
} from "../../../domain/exact";
import type { CanonicalContentDigest } from "../../../domain/identity";
import {
  contractFailure,
  finalizeContentAddressedAuthority,
  validateContractKey,
  validateContractRecord,
  type AnalyticalContractFailure,
  type ExactMetricValue,
} from "../../contracts";
import type { AnalyticalPartitionReceipt } from "../../dataset";
import { applyTradeQueryFilters } from "../filters";
import { openReadOnlyTradeQueryGateway, type VerifiedTradeQueryDatasetSource } from "../gateway";
import { buildQueryRowSemantics, type QueryRowSemantics } from "../execution";
import { isVerifiedTradeQueryExecution } from "../execution/verified-execution";
import { calculateTradeQueryMetrics } from "../metrics";
import type { TradeQueryAuthority, TradeQueryFilter, TradeQueryPlan } from "../contracts";
import {
  buildTradeQueryPlan,
  TRADE_QUERY_PLAN_KEY,
  TRADE_QUERY_PLAN_SEMANTIC_VERSION,
  TRADE_QUERY_PLAN_VERSION,
  TRADE_QUERY_POLICY,
  verifyTradeQueryResultShape,
} from "../contracts";

export const SIMILAR_TRADE_SEARCH_RESULT_VERSION = "ti_v3_trade_query_similarity_search_result_v1" as const;
export const TRADE_QUERY_SIMILARITY_SEARCH_VERSION = SIMILAR_TRADE_SEARCH_RESULT_VERSION;
export const SIMILAR_TRADE_SEARCH_PLAN_VERSION = "ti_v3_similar_trade_search_plan_v1" as const;
export const SIMILAR_TRADE_ORDERING_POLICY =
  "unmatched_then_unavailable_then_dimension_priority_then_exact_distance_vector_then_trade_identity_v1" as const;

export type SimilarTradeDimension =
  | "direction"
  | "entry_price"
  | "entry_time"
  | "share_quantity"
  | "entry_notional"
  | "holding_time"
  | "sequence_in_session"
  | "previous_completed_outcome"
  | "repeat_attempt"
  | "symbol"
  | "account";

export type SimilarTradePolicyKey =
  | "exact_identity"
  | "exact_numeric"
  | "canonical_bucket"
  | "inclusive_range"
  | "absolute_exact_distance"
  | "normalized_entry_time_bucket";

interface SimilarTradePolicyBase {
  readonly dimension: SimilarTradeDimension;
  readonly policyKey: SimilarTradePolicyKey;
  readonly policyVersion: "v1";
}

export type SimilarTradeMatchingPolicy =
  | Readonly<SimilarTradePolicyBase & { readonly policyKey: "exact_identity" }>
  | Readonly<SimilarTradePolicyBase & { readonly policyKey: "exact_numeric" }>
  | Readonly<SimilarTradePolicyBase & { readonly policyKey: "canonical_bucket"; readonly boundaries: readonly string[] }>
  | Readonly<SimilarTradePolicyBase & { readonly policyKey: "inclusive_range"; readonly minimum: string; readonly maximum: string }>
  | Readonly<SimilarTradePolicyBase & { readonly policyKey: "absolute_exact_distance"; readonly threshold: string }>
  | Readonly<SimilarTradePolicyBase & { readonly policyKey: "normalized_entry_time_bucket"; readonly bucketMinutes: string }>;

export interface SimilarTradeDimensionExplanation {
  readonly dimension: SimilarTradeDimension;
  readonly policyKey: SimilarTradePolicyKey;
  readonly policyVersion: "v1";
  readonly targetAvailability: "available" | "unavailable";
  readonly candidateAvailability: "available" | "unavailable";
  readonly targetValue: string | null;
  readonly candidateValue: string | null;
  readonly targetBucketIdentity: string | null;
  readonly candidateBucketIdentity: string | null;
  readonly rangeMinimum: string | null;
  readonly rangeMaximum: string | null;
  readonly exactDistance: string | null;
  readonly relativeDistance: string | null;
  readonly threshold: string | null;
  readonly outcome: "matched" | "unmatched" | "unavailable";
  readonly reasonCode: string;
  readonly limitationCodes: readonly string[];
}

export interface SimilarTradeSearchRequest {
  readonly targetTradeKey: string;
  readonly dimensions: readonly SimilarTradeDimension[];
  readonly policies: readonly SimilarTradeMatchingPolicy[];
  readonly filters: readonly TradeQueryFilter[];
  readonly includeNearMisses: boolean;
  readonly maximumMatches: string;
  readonly maximumNearMisses: string;
}

export interface SimilarTradeMatch {
  readonly semanticRoundTripKey: string;
  readonly rowDigest: CanonicalContentDigest;
  readonly executionDigests: readonly CanonicalContentDigest[];
  readonly occurrenceKeys: readonly string[];
  readonly explanations: readonly SimilarTradeDimensionExplanation[];
  readonly matchedDimensions: readonly SimilarTradeDimension[];
  readonly unmatchedDimensions: readonly SimilarTradeDimension[];
  readonly unavailableDimensions: readonly SimilarTradeDimension[];
  readonly kind: "match" | "near_miss";
}

export interface SimilarTradeEvidenceReference {
  readonly semanticRoundTripKey: string;
  readonly rowDigest: CanonicalContentDigest;
  readonly executionDigests: readonly CanonicalContentDigest[];
  readonly occurrenceKeys: readonly string[];
  readonly role: "exact_match" | "near_miss";
}

export interface SimilarTradeSearchResult {
  readonly schemaVersion: typeof SIMILAR_TRADE_SEARCH_RESULT_VERSION;
  readonly resultKey: "ti_v3_execution_only_similar_trade_search_result";
  readonly resultVersion: "v1";
  readonly searchPlan: SimilarTradeSearchPlan;
  readonly searchPlanDigest: CanonicalContentDigest;
  readonly queryPlanDigest: CanonicalContentDigest;
  readonly sourceResultDigest: CanonicalContentDigest;
  readonly datasetReceiptDigest: CanonicalContentDigest;
  readonly datasetDerivationDigest: CanonicalContentDigest;
  readonly partitionDigest: CanonicalContentDigest;
  readonly ownerScope: readonly string[];
  readonly accountScope: readonly string[];
  readonly currency: string;
  readonly targetTradeKey: string;
  readonly normalizedFilters: readonly TradeQueryFilter[];
  readonly dimensions: readonly SimilarTradeDimension[];
  readonly policies: readonly SimilarTradeMatchingPolicy[];
  readonly orderingPolicy: SimilarTradeSearchPlan["orderingPolicy"];
  readonly evidencePolicy: SimilarTradeSearchPlan["evidencePolicy"];
  readonly unavailableDimensionPolicy: SimilarTradeSearchPlan["unavailableDimensionPolicy"];
  readonly limitationPolicy: SimilarTradeSearchPlan["limitationPolicy"];
  readonly candidateCount: string;
  readonly totalExactMatchCount: string;
  readonly emittedExactMatchCount: string;
  readonly totalNearMissCount: string;
  readonly emittedNearMissCount: string;
  readonly matches: readonly SimilarTradeMatch[];
  readonly nearMisses: readonly SimilarTradeMatch[];
  readonly summaryMetricPopulation: "emitted_exact_matches";
  readonly summaryMetrics: readonly ExactMetricValue[];
  readonly evidenceReferences: readonly SimilarTradeEvidenceReference[];
  readonly limitationCodes: readonly string[];
  readonly resultDigest: CanonicalContentDigest;
}

export interface SimilarTradeSearchPlan {
  readonly schemaVersion: typeof SIMILAR_TRADE_SEARCH_PLAN_VERSION;
  readonly planKey: "ti_v3_execution_only_similar_trade_search";
  readonly planVersion: "v1";
  readonly sourceResultDigest: CanonicalContentDigest;
  readonly targetTradeKey: string;
  readonly dimensions: readonly SimilarTradeDimension[];
  readonly policies: readonly SimilarTradeMatchingPolicy[];
  readonly normalizedFilterPlan: TradeQueryPlan;
  readonly includeNearMisses: boolean;
  readonly maximumMatches: string;
  readonly maximumNearMisses: string;
  readonly orderingPolicy: typeof SIMILAR_TRADE_ORDERING_POLICY;
  readonly evidencePolicy: "exact_row_execution_occurrence_links";
  readonly unavailableDimensionPolicy: "explicit_unavailable";
  readonly limitationPolicy: "deterministic_bounded_limitations";
  readonly searchPlanDigest: CanonicalContentDigest;
}

const MAXIMUM_RESULTS = 128;
const DIMENSION_VALUES = Object.freeze([
  "direction",
  "entry_price",
  "entry_time",
  "share_quantity",
  "entry_notional",
  "holding_time",
  "sequence_in_session",
  "previous_completed_outcome",
  "repeat_attempt",
  "symbol",
  "account",
] as const satisfies readonly SimilarTradeDimension[]);
const DIMENSIONS = new Set<SimilarTradeDimension>(DIMENSION_VALUES);
const RATIO_DIMENSIONS = new Set<SimilarTradeDimension>([
  "entry_price",
  "share_quantity",
  "entry_notional",
]);
const INTEGER_DIMENSIONS = new Set<SimilarTradeDimension>([
  "sequence_in_session",
  "repeat_attempt",
]);
const DURATION_DIMENSIONS = new Set<SimilarTradeDimension>(["holding_time"]);
const NUMERIC_POLICY_KEYS = Object.freeze([
  "exact_numeric",
  "canonical_bucket",
  "inclusive_range",
  "absolute_exact_distance",
] as const satisfies readonly SimilarTradePolicyKey[]);

export const SIMILAR_TRADE_DIMENSION_POLICY_COMPATIBILITY: Readonly<
  Record<SimilarTradeDimension, readonly SimilarTradePolicyKey[]>
> = Object.freeze({
  direction: Object.freeze(["exact_identity"] as const),
  entry_price: NUMERIC_POLICY_KEYS,
  entry_time: Object.freeze(["normalized_entry_time_bucket"] as const),
  share_quantity: NUMERIC_POLICY_KEYS,
  entry_notional: NUMERIC_POLICY_KEYS,
  holding_time: NUMERIC_POLICY_KEYS,
  sequence_in_session: NUMERIC_POLICY_KEYS,
  previous_completed_outcome: Object.freeze(["exact_identity"] as const),
  repeat_attempt: NUMERIC_POLICY_KEYS,
  symbol: Object.freeze(["exact_identity"] as const),
  account: Object.freeze(["exact_identity"] as const),
});

type ExactComparableValue = Readonly<{
  readonly ratio: ExactRatio;
  readonly display: string;
}>;

type DimensionValue = Readonly<{
  readonly display: string;
  readonly exact: ExactComparableValue | null;
  readonly entryTimeSeconds: bigint | null;
}>;

function limit(value: unknown): bigint | null {
  if (typeof value !== "string" || !/^(?:0|[1-9][0-9]*)$/.test(value)) return null;
  const parsed = BigInt(value);
  return parsed <= BigInt(MAXIMUM_RESULTS) ? parsed : null;
}

function takeBounded<T>(values: readonly T[], maximum: bigint): readonly T[] {
  const result: T[] = [];
  for (const value of values) {
    if (BigInt(result.length) >= maximum) break;
    result.push(value);
  }
  return Object.freeze(result);
}

function ratioDisplay(value: ExactRatio): string {
  return `${value.numerator}/${value.denominator}`;
}

function exactInteger(value: bigint, suffix = ""): ExactComparableValue {
  const ratio = createExactRatio(value.toString(), "1");
  if (!ratio.ok) throw new Error(ratio.error.code);
  return Object.freeze({ ratio: ratio.value, display: `${value.toString()}${suffix}` });
}

function parseEntryTimeSeconds(value: string): bigint {
  const match = /^(\d{2}):(\d{2}):(\d{2})$/.exec(value);
  if (match === null) throw new Error("ti_v3_similarity_entry_time_invalid");
  return BigInt(match[1]) * BigInt("3600") + BigInt(match[2]) * BigInt("60") + BigInt(match[3]);
}

function valueFor(row: QueryRowSemantics, dimension: SimilarTradeDimension): DimensionValue | null {
  switch (dimension) {
    case "direction":
      return Object.freeze({ display: row.row.direction, exact: null, entryTimeSeconds: null });
    case "entry_price":
      return row.entryPrice === null
        ? null
        : Object.freeze({
          display: ratioDisplay(row.entryPrice),
          exact: Object.freeze({ ratio: row.entryPrice, display: ratioDisplay(row.entryPrice) }),
          entryTimeSeconds: null,
        });
    case "entry_time":
      return Object.freeze({
        display: row.entryTime,
        exact: null,
        entryTimeSeconds: parseEntryTimeSeconds(row.entryTime),
      });
    case "share_quantity":
      return row.shareQuantity === null
        ? null
        : Object.freeze({
          display: ratioDisplay(row.shareQuantity),
          exact: Object.freeze({ ratio: row.shareQuantity, display: ratioDisplay(row.shareQuantity) }),
          entryTimeSeconds: null,
        });
    case "entry_notional":
      return row.entryNotional === null
        ? null
        : Object.freeze({
          display: ratioDisplay(row.entryNotional),
          exact: Object.freeze({ ratio: row.entryNotional, display: ratioDisplay(row.entryNotional) }),
          entryTimeSeconds: null,
        });
    case "holding_time": {
      const exact = exactInteger(row.holdingNanoseconds, "ns");
      return Object.freeze({ display: exact.display, exact, entryTimeSeconds: null });
    }
    case "sequence_in_session": {
      const exact = exactInteger(row.sequenceInSession);
      return Object.freeze({ display: exact.display, exact, entryTimeSeconds: null });
    }
    case "previous_completed_outcome":
      return Object.freeze({ display: row.previousCompletedOutcome, exact: null, entryTimeSeconds: null });
    case "repeat_attempt": {
      const exact = exactInteger(row.repeatAttempt);
      return Object.freeze({ display: exact.display, exact, entryTimeSeconds: null });
    }
    case "symbol":
      return Object.freeze({ display: row.row.stableInstrumentKey, exact: null, entryTimeSeconds: null });
    case "account":
      return Object.freeze({ display: row.row.canonicalAccountKey, exact: null, entryTimeSeconds: null });
  }
}

function parseRatioPolicyValue(input: unknown): ExactComparableValue | null {
  if (typeof input !== "string") return null;
  const ratioMatch = /^(-?(?:0|[1-9][0-9]*))\/([1-9][0-9]*)$/.exec(input);
  if (ratioMatch !== null) {
    const ratio = createExactRatio(ratioMatch[1], ratioMatch[2]);
    return ratio.ok && ratioDisplay(ratio.value) === input
      ? Object.freeze({ ratio: ratio.value, display: input })
      : null;
  }
  const decimal = validateExactDecimal(input);
  if (!decimal.ok || decimal.value !== input) return null;
  const ratio = decimalToExactRatio(decimal.value);
  return ratio.ok
    ? Object.freeze({ ratio: ratio.value, display: ratioDisplay(ratio.value) })
    : null;
}

function parsePolicyValue(dimension: SimilarTradeDimension, input: unknown): ExactComparableValue | null {
  if (RATIO_DIMENSIONS.has(dimension)) return parseRatioPolicyValue(input);
  if (INTEGER_DIMENSIONS.has(dimension)) {
    if (typeof input !== "string" || !/^(?:0|[1-9][0-9]*)$/.test(input)) return null;
    return exactInteger(BigInt(input));
  }
  if (DURATION_DIMENSIONS.has(dimension)) {
    if (typeof input !== "string" || !/^(?:0|[1-9][0-9]*)ns$/.test(input)) return null;
    return exactInteger(BigInt(input.slice(0, -2)), "ns");
  }
  return null;
}

function comparePolicyValues(left: ExactComparableValue, right: ExactComparableValue): -1 | 0 | 1 {
  return compareExactRatios(left.ratio, right.ratio);
}

function absoluteDistance(left: ExactComparableValue, right: ExactComparableValue): ExactComparableValue {
  const numerator =
    BigInt(left.ratio.numerator) * BigInt(right.ratio.denominator) -
    BigInt(right.ratio.numerator) * BigInt(left.ratio.denominator);
  const ratio = createExactRatio(
    (numerator < BigInt("0") ? -numerator : numerator).toString(),
    (BigInt(left.ratio.denominator) * BigInt(right.ratio.denominator)).toString(),
  );
  if (!ratio.ok) throw new Error(ratio.error.code);
  return Object.freeze({ ratio: ratio.value, display: ratioDisplay(ratio.value) });
}

function formatDistance(dimension: SimilarTradeDimension, value: ExactComparableValue): string {
  if (INTEGER_DIMENSIONS.has(dimension) && value.ratio.denominator === "1") return value.ratio.numerator;
  if (DURATION_DIMENSIONS.has(dimension) && value.ratio.denominator === "1") return `${value.ratio.numerator}ns`;
  return value.display;
}

function validatePolicy(
  input: unknown,
  path: string,
): { readonly ok: true; readonly value: SimilarTradeMatchingPolicy } | {
  readonly ok: false; readonly error: AnalyticalContractFailure;
} {
  const envelope = validateContractRecord(
    input,
    ["dimension", "policyKey", "policyVersion"],
    ["boundaries", "minimum", "maximum", "threshold", "bucketMinutes"],
    path,
  );
  if (
    !envelope.ok ||
    typeof envelope.value.dimension !== "string" ||
    !DIMENSIONS.has(envelope.value.dimension as SimilarTradeDimension) ||
    typeof envelope.value.policyKey !== "string" ||
    envelope.value.policyVersion !== "v1"
  ) {
    return contractFailure("ti_v3_analytics_contract_invalid", path);
  }
  const dimension = envelope.value.dimension as SimilarTradeDimension;
  const policyKey = envelope.value.policyKey as SimilarTradePolicyKey;
  if (!SIMILAR_TRADE_DIMENSION_POLICY_COMPATIBILITY[dimension].includes(policyKey)) {
    return contractFailure("ti_v3_analytics_contract_invalid", `${path}.policyKey`);
  }
  if (policyKey === "exact_identity" || policyKey === "exact_numeric") {
    const exact = validateContractRecord(input, ["dimension", "policyKey", "policyVersion"], [], path);
    return exact.ok
      ? { ok: true, value: Object.freeze({ dimension, policyKey, policyVersion: "v1" }) }
      : exact;
  }
  if (policyKey === "canonical_bucket") {
    const exact = validateContractRecord(input, ["dimension", "policyKey", "policyVersion", "boundaries"], [], path);
    if (!exact.ok || !Array.isArray(exact.value.boundaries) || exact.value.boundaries.length === 0 || exact.value.boundaries.length > 128) {
      return contractFailure("ti_v3_analytics_contract_invalid", `${path}.boundaries`);
    }
    const boundaries: string[] = [];
    let previous: ExactComparableValue | null = null;
    for (let index = 0; index < exact.value.boundaries.length; index += 1) {
      const parsed = parsePolicyValue(dimension, exact.value.boundaries[index]);
      if (parsed === null || (previous !== null && comparePolicyValues(previous, parsed) >= 0)) {
        return contractFailure("ti_v3_analytics_contract_invalid", `${path}.boundaries[${index}]`);
      }
      boundaries.push(parsed.display);
      previous = parsed;
    }
    return {
      ok: true,
      value: Object.freeze({
        dimension,
        policyKey,
        policyVersion: "v1",
        boundaries: Object.freeze(boundaries),
      }),
    };
  }
  if (policyKey === "inclusive_range") {
    const exact = validateContractRecord(input, ["dimension", "policyKey", "policyVersion", "minimum", "maximum"], [], path);
    if (!exact.ok) return exact;
    const minimum = parsePolicyValue(dimension, exact.value.minimum);
    const maximum = parsePolicyValue(dimension, exact.value.maximum);
    if (minimum === null || maximum === null || comparePolicyValues(minimum, maximum) > 0) {
      return contractFailure("ti_v3_analytics_contract_invalid", `${path}.minimum`);
    }
    return {
      ok: true,
      value: Object.freeze({
        dimension,
        policyKey,
        policyVersion: "v1",
        minimum: minimum.display,
        maximum: maximum.display,
      }),
    };
  }
  if (policyKey === "absolute_exact_distance") {
    const exact = validateContractRecord(input, ["dimension", "policyKey", "policyVersion", "threshold"], [], path);
    if (!exact.ok) return exact;
    const threshold = parsePolicyValue(dimension, exact.value.threshold);
    if (threshold === null || BigInt(threshold.ratio.numerator) < BigInt("0")) {
      return contractFailure("ti_v3_analytics_contract_invalid", `${path}.threshold`);
    }
    return {
      ok: true,
      value: Object.freeze({
        dimension,
        policyKey,
        policyVersion: "v1",
        threshold: threshold.display,
      }),
    };
  }
  const exact = validateContractRecord(input, ["dimension", "policyKey", "policyVersion", "bucketMinutes"], [], path);
  if (
    !exact.ok ||
    typeof exact.value.bucketMinutes !== "string" ||
    !/^[1-9][0-9]*$/.test(exact.value.bucketMinutes) ||
    BigInt(exact.value.bucketMinutes) > BigInt("1440")
  ) {
    return contractFailure("ti_v3_analytics_contract_invalid", `${path}.bucketMinutes`);
  }
  return {
    ok: true,
    value: Object.freeze({
      dimension,
      policyKey: "normalized_entry_time_bucket",
      policyVersion: "v1",
      bucketMinutes: exact.value.bucketMinutes,
    }),
  };
}

function validatePolicyInventory(
  dimensions: readonly SimilarTradeDimension[],
  input: unknown,
): { readonly ok: true; readonly value: readonly SimilarTradeMatchingPolicy[] } | {
  readonly ok: false; readonly error: AnalyticalContractFailure;
} {
  if (!Array.isArray(input) || input.length !== dimensions.length) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.policies");
  }
  const byDimension = new Map<SimilarTradeDimension, SimilarTradeMatchingPolicy>();
  for (let index = 0; index < input.length; index += 1) {
    const policy = validatePolicy(input[index], `$.policies[${index}]`);
    if (!policy.ok) return policy;
    if (byDimension.has(policy.value.dimension)) {
      return contractFailure("ti_v3_analytics_contract_duplicate_identity", "$.policies");
    }
    byDimension.set(policy.value.dimension, policy.value);
  }
  if (byDimension.size !== dimensions.length || dimensions.some((dimension) => !byDimension.has(dimension))) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.policies");
  }
  return {
    ok: true,
    value: Object.freeze(dimensions.map((dimension) => byDimension.get(dimension)!)),
  };
}

function bucketIdentity(value: ExactComparableValue, boundaries: readonly ExactComparableValue[]): string {
  let index = 0;
  while (index < boundaries.length && comparePolicyValues(value, boundaries[index]) >= 0) index += 1;
  const minimum = index === 0 ? "-infinity" : boundaries[index - 1].display;
  const maximum = index === boundaries.length ? "+infinity" : boundaries[index].display;
  return `[${minimum},${maximum})`;
}

function unavailableExplanation(
  dimension: SimilarTradeDimension,
  policy: SimilarTradeMatchingPolicy,
  target: DimensionValue | null,
  candidate: DimensionValue | null,
): SimilarTradeDimensionExplanation {
  const limitations = [
    ...(target === null ? ["ti_v3_similarity_target_dimension_unavailable"] : []),
    ...(candidate === null ? ["ti_v3_similarity_candidate_dimension_unavailable"] : []),
  ].sort(compareUnicodeCodePoints);
  const unavailableParty = target === null && candidate === null
    ? "both"
    : target === null
      ? "target"
      : "candidate";
  return Object.freeze({
    dimension,
    policyKey: policy.policyKey,
    policyVersion: policy.policyVersion,
    targetAvailability: target === null ? "unavailable" : "available",
    candidateAvailability: candidate === null ? "unavailable" : "available",
    targetValue: target?.display ?? null,
    candidateValue: candidate?.display ?? null,
    targetBucketIdentity: null,
    candidateBucketIdentity: null,
    rangeMinimum: policy.policyKey === "inclusive_range" ? policy.minimum : null,
    rangeMaximum: policy.policyKey === "inclusive_range" ? policy.maximum : null,
    exactDistance: null,
    relativeDistance: null,
    threshold: policy.policyKey === "absolute_exact_distance" ? policy.threshold : null,
    outcome: "unavailable",
    reasonCode: `ti_v3_similarity_unavailable_${unavailableParty}`,
    limitationCodes: Object.freeze(limitations),
  });
}

function explanation(
  targetRow: QueryRowSemantics,
  candidateRow: QueryRowSemantics,
  policy: SimilarTradeMatchingPolicy,
): SimilarTradeDimensionExplanation {
  const dimension = policy.dimension;
  const target = valueFor(targetRow, dimension);
  const candidate = valueFor(candidateRow, dimension);
  if (target === null || candidate === null) {
    return unavailableExplanation(dimension, policy, target, candidate);
  }

  let matched = false;
  let targetBucketIdentity: string | null = null;
  let candidateBucketIdentity: string | null = null;
  let rangeMinimum: string | null = null;
  let rangeMaximum: string | null = null;
  let exactDistance: string | null = null;
  let threshold: string | null = null;

  if (policy.policyKey === "exact_identity") {
    matched = target.display === candidate.display;
  } else if (policy.policyKey === "exact_numeric") {
    if (target.exact === null || candidate.exact === null) throw new Error("ti_v3_similarity_numeric_value_missing");
    matched = comparePolicyValues(target.exact, candidate.exact) === 0;
  } else if (policy.policyKey === "canonical_bucket") {
    if (target.exact === null || candidate.exact === null) throw new Error("ti_v3_similarity_numeric_value_missing");
    const boundaries = policy.boundaries.map((value) => {
      const parsed = parsePolicyValue(dimension, value);
      if (parsed === null) throw new Error("ti_v3_similarity_policy_invalid");
      return parsed;
    });
    targetBucketIdentity = bucketIdentity(target.exact, boundaries);
    candidateBucketIdentity = bucketIdentity(candidate.exact, boundaries);
    matched = targetBucketIdentity === candidateBucketIdentity;
  } else if (policy.policyKey === "inclusive_range") {
    if (target.exact === null || candidate.exact === null) throw new Error("ti_v3_similarity_numeric_value_missing");
    const minimum = parsePolicyValue(dimension, policy.minimum);
    const maximum = parsePolicyValue(dimension, policy.maximum);
    if (minimum === null || maximum === null) throw new Error("ti_v3_similarity_policy_invalid");
    rangeMinimum = minimum.display;
    rangeMaximum = maximum.display;
    const targetInside = comparePolicyValues(target.exact, minimum) >= 0 && comparePolicyValues(target.exact, maximum) <= 0;
    const candidateInside = comparePolicyValues(candidate.exact, minimum) >= 0 && comparePolicyValues(candidate.exact, maximum) <= 0;
    matched = targetInside && candidateInside;
  } else if (policy.policyKey === "absolute_exact_distance") {
    if (target.exact === null || candidate.exact === null) throw new Error("ti_v3_similarity_numeric_value_missing");
    const accepted = parsePolicyValue(dimension, policy.threshold);
    if (accepted === null) throw new Error("ti_v3_similarity_policy_invalid");
    const distance = absoluteDistance(target.exact, candidate.exact);
    exactDistance = formatDistance(dimension, distance);
    threshold = accepted.display;
    matched = comparePolicyValues(distance, accepted) <= 0;
  } else {
    if (target.entryTimeSeconds === null || candidate.entryTimeSeconds === null) {
      throw new Error("ti_v3_similarity_entry_time_value_missing");
    }
    const bucketSeconds = BigInt(policy.bucketMinutes) * BigInt("60");
    const targetBucket = target.entryTimeSeconds / bucketSeconds;
    const candidateBucket = candidate.entryTimeSeconds / bucketSeconds;
    const targetStart = targetBucket * bucketSeconds;
    const candidateStart = candidateBucket * bucketSeconds;
    targetBucketIdentity = `${targetStart.toString()}-${(targetStart + bucketSeconds).toString()}s`;
    candidateBucketIdentity = `${candidateStart.toString()}-${(candidateStart + bucketSeconds).toString()}s`;
    matched = targetBucket === candidateBucket;
  }

  const outcome = matched ? "matched" as const : "unmatched" as const;
  return Object.freeze({
    dimension,
    policyKey: policy.policyKey,
    policyVersion: policy.policyVersion,
    targetAvailability: "available",
    candidateAvailability: "available",
    targetValue: target.display,
    candidateValue: candidate.display,
    targetBucketIdentity,
    candidateBucketIdentity,
    rangeMinimum,
    rangeMaximum,
    exactDistance,
    relativeDistance: null,
    threshold,
    outcome,
    reasonCode: `ti_v3_similarity_${outcome}_${policy.policyKey}`,
    limitationCodes: Object.freeze([]),
  });
}

function asMatch(
  target: QueryRowSemantics,
  candidate: QueryRowSemantics,
  policies: readonly SimilarTradeMatchingPolicy[],
): SimilarTradeMatch {
  const explanations = policies.map((policy) => explanation(target, candidate, policy));
  const matched = explanations.filter((item) => item.outcome === "matched").map((item) => item.dimension);
  const unmatched = explanations.filter((item) => item.outcome === "unmatched").map((item) => item.dimension);
  const unavailable = explanations.filter((item) => item.outcome === "unavailable").map((item) => item.dimension);
  return Object.freeze({
    semanticRoundTripKey: candidate.row.semanticRoundTripKey,
    rowDigest: candidate.row.rowDigest,
    executionDigests: Object.freeze([...candidate.row.supportingExecutionDigests]),
    occurrenceKeys: Object.freeze([...candidate.row.supportingOccurrenceKeys]),
    explanations: Object.freeze(explanations),
    matchedDimensions: Object.freeze(matched),
    unmatchedDimensions: Object.freeze(unmatched),
    unavailableDimensions: Object.freeze(unavailable),
    kind: unmatched.length === 0 && unavailable.length === 0 ? "match" : "near_miss",
  });
}

export function compareSimilarTradeMatch(
  left: SimilarTradeMatch,
  right: SimilarTradeMatch,
  dimensions: readonly SimilarTradeDimension[],
  policies: readonly SimilarTradeMatchingPolicy[],
): number {
  const countComparison =
    left.unmatchedDimensions.length - right.unmatchedDimensions.length ||
    left.unavailableDimensions.length - right.unavailableDimensions.length;
  if (countComparison !== 0) return countComparison;
  for (const dimension of dimensions) {
    const leftOutcome = left.explanations.find((item) => item.dimension === dimension)?.outcome;
    const rightOutcome = right.explanations.find((item) => item.dimension === dimension)?.outcome;
    const rank = (outcome: SimilarTradeDimensionExplanation["outcome"] | undefined) =>
      outcome === "matched" ? 0 : outcome === "unmatched" ? 1 : 2;
    const priority = rank(leftOutcome) - rank(rightOutcome);
    if (priority !== 0) return priority;
  }
  for (const policy of policies) {
    if (policy.policyKey !== "absolute_exact_distance") continue;
    const leftDistance = left.explanations.find((item) => item.dimension === policy.dimension)?.exactDistance;
    const rightDistance = right.explanations.find((item) => item.dimension === policy.dimension)?.exactDistance;
    if (leftDistance === null || leftDistance === undefined || rightDistance === null || rightDistance === undefined) {
      continue;
    }
    const leftValue = parsePolicyValue(policy.dimension, leftDistance);
    const rightValue = parsePolicyValue(policy.dimension, rightDistance);
    if (leftValue === null || rightValue === null) continue;
    const distance = comparePolicyValues(leftValue, rightValue);
    if (distance !== 0) return distance;
  }
  return compareUnicodeCodePoints(left.semanticRoundTripKey, right.semanticRoundTripKey);
}

export function buildSimilarTradeSearchPlan(
  input: unknown,
  authority: TradeQueryAuthority,
  sourceResultDigest: CanonicalContentDigest,
): { readonly ok: true; readonly value: SimilarTradeSearchPlan } | {
  readonly ok: false; readonly error: AnalyticalContractFailure;
} {
  const record = validateContractRecord(
    input,
    ["targetTradeKey", "dimensions", "policies", "filters", "includeNearMisses", "maximumMatches", "maximumNearMisses"],
    [],
  );
  if (!record.ok) return record;
  const targetTradeKey = validateContractKey(record.value.targetTradeKey, "$.targetTradeKey");
  if (
    !targetTradeKey.ok ||
    !Array.isArray(record.value.dimensions) ||
    !Array.isArray(record.value.filters) ||
    typeof record.value.includeNearMisses !== "boolean"
  ) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.searchPlan");
  }
  const maximumMatches = limit(record.value.maximumMatches);
  const maximumNearMisses = limit(record.value.maximumNearMisses);
  if (
    maximumMatches === null ||
    maximumNearMisses === null ||
    record.value.dimensions.length === 0 ||
    record.value.dimensions.length > DIMENSIONS.size ||
    new Set(record.value.dimensions).size !== record.value.dimensions.length ||
    record.value.dimensions.some((item) => typeof item !== "string" || !DIMENSIONS.has(item as SimilarTradeDimension))
  ) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.searchPlan");
  }
  const dimensions = Object.freeze([...record.value.dimensions] as SimilarTradeDimension[]);
  const policies = validatePolicyInventory(dimensions, record.value.policies);
  if (!policies.ok) return policies;
  const normalized = buildTradeQueryPlan({
    schemaVersion: TRADE_QUERY_PLAN_VERSION,
    queryPlanKey: TRADE_QUERY_PLAN_KEY,
    queryPlanVersion: TRADE_QUERY_PLAN_SEMANTIC_VERSION,
    authority: {
      snapshotDigest: authority.datasetReceipt.snapshotDigest,
      canonicalFilterDigest: authority.datasetReceipt.filterDigest,
      datasetReceiptDigest: authority.datasetReceipt.receiptDigest,
      datasetDerivationDigest: authority.datasetDerivationReceipt.derivationDigest,
      partitionDigest: authority.partitionReceipt.partitionDigest,
      currency: authority.partitionReceipt.currency,
      ownerScope: authority.partitionReceipt.ownerScope,
      accountScope: authority.partitionReceipt.accountScope,
    },
    filters: record.value.filters,
    grouping: { kind: "aggregate" },
    metrics: ["net_pnl"],
    ordering: [{ by: "group_identity", metricKey: null, direction: "ascending" }],
    limits: {
      groupLimit: "1",
      resultRowLimit: "1",
      evidencePerGroup: "1",
      totalEvidenceLimit: "1",
      diagnosticLimit: "1",
    },
    policies: TRADE_QUERY_POLICY,
  }, authority);
  if (!normalized.ok) return normalized;
  const built = finalizeContentAddressedAuthority("trade_query_similarity_search", {
    schemaVersion: SIMILAR_TRADE_SEARCH_PLAN_VERSION,
    planKey: "ti_v3_execution_only_similar_trade_search",
    planVersion: "v1",
    sourceResultDigest,
    targetTradeKey: targetTradeKey.ok ? targetTradeKey.value : "",
    dimensions,
    policies: policies.value,
    normalizedFilterPlan: normalized.value,
    includeNearMisses: record.value.includeNearMisses,
    maximumMatches: record.value.maximumMatches,
    maximumNearMisses: record.value.maximumNearMisses,
    orderingPolicy: SIMILAR_TRADE_ORDERING_POLICY,
    evidencePolicy: "exact_row_execution_occurrence_links",
    unavailableDimensionPolicy: "explicit_unavailable",
    limitationPolicy: "deterministic_bounded_limitations",
  }, "searchPlanDigest");
  return built.ok ? { ok: true, value: built.value as SimilarTradeSearchPlan } : built;
}

export function verifySimilarTradeSearchPlan(
  input: unknown,
  authority: TradeQueryAuthority,
  sourceResultDigest: CanonicalContentDigest,
): { readonly ok: true; readonly value: SimilarTradeSearchPlan } | {
  readonly ok: false; readonly error: AnalyticalContractFailure;
} {
  const record = validateContractRecord(input, [
    "schemaVersion",
    "planKey",
    "planVersion",
    "sourceResultDigest",
    "targetTradeKey",
    "dimensions",
    "policies",
    "normalizedFilterPlan",
    "includeNearMisses",
    "maximumMatches",
    "maximumNearMisses",
    "orderingPolicy",
    "evidencePolicy",
    "unavailableDimensionPolicy",
    "limitationPolicy",
    "searchPlanDigest",
  ], []);
  if (
    !record.ok ||
    !Array.isArray(record.value.dimensions) ||
    !Array.isArray(record.value.policies)
  ) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.plan");
  }
  const normalizedFilterPlan = validateContractRecord(record.value.normalizedFilterPlan, [
    "schemaVersion",
    "queryPlanKey",
    "queryPlanVersion",
    "authority",
    "filters",
    "grouping",
    "metrics",
    "ordering",
    "limits",
    "policies",
    "queryPlanDigest",
  ], [], "$.plan.normalizedFilterPlan");
  if (!normalizedFilterPlan.ok || !Array.isArray(normalizedFilterPlan.value.filters)) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.plan.normalizedFilterPlan");
  }
  const rebuilt = buildSimilarTradeSearchPlan({
    targetTradeKey: record.value.targetTradeKey,
    dimensions: record.value.dimensions,
    policies: record.value.policies,
    filters: normalizedFilterPlan.value.filters,
    includeNearMisses: record.value.includeNearMisses,
    maximumMatches: record.value.maximumMatches,
    maximumNearMisses: record.value.maximumNearMisses,
  }, authority, sourceResultDigest);
  if (!rebuilt.ok) return rebuilt;
  const supplied = serializeCanonicalValue(input);
  const accepted = serializeCanonicalValue(rebuilt.value);
  return supplied.ok && accepted.ok && supplied.value.json === accepted.value.json
    ? rebuilt
    : contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.plan.searchPlanDigest");
}

export function searchSimilarTrades(args: Readonly<{
  readonly source: VerifiedTradeQueryDatasetSource;
  readonly partitionReceipt: AnalyticalPartitionReceipt;
  readonly result: unknown;
  readonly plan: unknown;
}>): { readonly ok: true; readonly value: SimilarTradeSearchResult } | {
  readonly ok: false; readonly error: AnalyticalContractFailure;
} {
  const gateway = openReadOnlyTradeQueryGateway(args.source, args.partitionReceipt);
  if (!gateway.ok) return gateway;
  const result = verifyTradeQueryResultShape(args.result, gateway.value.authority);
  if (!result.ok || !isVerifiedTradeQueryExecution(args.result)) {
    return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.result");
  }
  const plan = verifySimilarTradeSearchPlan(args.plan, gateway.value.authority, result.value.resultDigest);
  if (!plan.ok) return plan;
  if (plan.value.normalizedFilterPlan.authority.partitionDigest !== result.value.normalizedQueryPlan.authority.partitionDigest) {
    return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.result");
  }
  const maximumMatches = limit(plan.value.maximumMatches);
  const maximumNearMisses = limit(plan.value.maximumNearMisses);
  if (maximumMatches === null || maximumNearMisses === null) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.plan");
  }
  const read = gateway.value.readBoundedRows(result.value.normalizedQueryPlan);
  if (!read.ok) return read;
  const semantics = buildQueryRowSemantics(read.value.rows);
  const target = semantics.find((item) => item.row.semanticRoundTripKey === plan.value.targetTradeKey);
  if (target === undefined) {
    return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.plan.targetTradeKey");
  }
  const filtered = applyTradeQueryFilters(semantics, plan.value.normalizedFilterPlan.filters).included
    .filter((item) => item.row.semanticRoundTripKey !== target.row.semanticRoundTripKey);
  const inspected = filtered
    .map((item) => asMatch(target, item, plan.value.policies))
    .sort((left, right) =>
      compareSimilarTradeMatch(left, right, plan.value.dimensions, plan.value.policies));
  const allMatches = inspected.filter((item) => item.kind === "match");
  const allNearMisses = inspected.filter((item) => item.kind === "near_miss");
  const matches = takeBounded(allMatches, maximumMatches);
  const nearMisses = plan.value.includeNearMisses
    ? takeBounded(allNearMisses, maximumNearMisses)
    : Object.freeze([]);
  const includedRows = semantics.filter((item) =>
    matches.some((match) => match.semanticRoundTripKey === item.row.semanticRoundTripKey));
  const summaryMetrics = calculateTradeQueryMetrics(
    ["candidate_count", "included_count", "excluded_count", "net_pnl", "average_pnl", "win_rate", "profit_factor"],
    includedRows,
    {
      candidateCount: String(filtered.length),
      includedCount: String(includedRows.length),
      excludedCount: String(filtered.length - includedRows.length),
    },
    result.value.normalizedQueryPlan.authority.currency,
  );
  const evidenceReferences = Object.freeze([
    ...matches.map((match) => Object.freeze({
      semanticRoundTripKey: match.semanticRoundTripKey,
      rowDigest: match.rowDigest,
      executionDigests: match.executionDigests,
      occurrenceKeys: match.occurrenceKeys,
      role: "exact_match" as const,
    })),
    ...nearMisses.map((match) => Object.freeze({
      semanticRoundTripKey: match.semanticRoundTripKey,
      rowDigest: match.rowDigest,
      executionDigests: match.executionDigests,
      occurrenceKeys: match.occurrenceKeys,
      role: "near_miss" as const,
    })),
  ]);
  const targetAuthorityUnavailable = plan.value.policies.some((policy) =>
    valueFor(target, policy.dimension) === null);
  const candidateAuthorityUnavailable = inspected.some((candidate) =>
    candidate.explanations.some((item) => item.candidateAvailability === "unavailable"));
  const exactDistanceUnavailable = inspected.some((candidate) =>
    candidate.explanations.some((item) =>
      item.policyKey === "absolute_exact_distance" && item.outcome === "unavailable"));
  const built = finalizeContentAddressedAuthority("trade_query_similarity_result", {
    schemaVersion: SIMILAR_TRADE_SEARCH_RESULT_VERSION,
    resultKey: "ti_v3_execution_only_similar_trade_search_result",
    resultVersion: "v1",
    searchPlan: plan.value,
    searchPlanDigest: plan.value.searchPlanDigest,
    queryPlanDigest: result.value.normalizedQueryPlan.queryPlanDigest,
    sourceResultDigest: result.value.resultDigest,
    datasetReceiptDigest: gateway.value.authority.datasetReceipt.receiptDigest,
    datasetDerivationDigest: gateway.value.authority.datasetDerivationReceipt.derivationDigest,
    partitionDigest: result.value.normalizedQueryPlan.authority.partitionDigest,
    ownerScope: Object.freeze([...gateway.value.authority.partitionReceipt.ownerScope]),
    accountScope: Object.freeze([...gateway.value.authority.partitionReceipt.accountScope]),
    currency: result.value.normalizedQueryPlan.authority.currency,
    targetTradeKey: plan.value.targetTradeKey,
    normalizedFilters: plan.value.normalizedFilterPlan.filters,
    dimensions: Object.freeze([...plan.value.dimensions]),
    policies: plan.value.policies,
    orderingPolicy: plan.value.orderingPolicy,
    evidencePolicy: plan.value.evidencePolicy,
    unavailableDimensionPolicy: plan.value.unavailableDimensionPolicy,
    limitationPolicy: plan.value.limitationPolicy,
    candidateCount: String(filtered.length),
    totalExactMatchCount: String(allMatches.length),
    emittedExactMatchCount: String(matches.length),
    totalNearMissCount: String(allNearMisses.length),
    emittedNearMissCount: String(nearMisses.length),
    matches: Object.freeze(matches),
    nearMisses: Object.freeze(nearMisses),
    summaryMetricPopulation: "emitted_exact_matches",
    summaryMetrics,
    evidenceReferences,
    limitationCodes: Object.freeze([
      ...(matches.length < allMatches.length ? ["ti_v3_similar_trade_matches_bounded"] : []),
      ...(nearMisses.length < allNearMisses.length && plan.value.includeNearMisses
        ? ["ti_v3_similar_trade_near_misses_bounded"]
        : []),
      ...(allMatches.length === 0 ? ["ti_v3_similar_trade_zero_matches"] : []),
      ...(targetAuthorityUnavailable ? ["ti_v3_similarity_target_dimension_unavailable"] : []),
      ...(candidateAuthorityUnavailable ? ["ti_v3_similarity_candidate_dimension_unavailable"] : []),
      ...(exactDistanceUnavailable ? ["ti_v3_similarity_exact_distance_unavailable"] : []),
    ].sort(compareUnicodeCodePoints)),
  }, "resultDigest");
  return built.ok ? { ok: true, value: built.value as SimilarTradeSearchResult } : built;
}
