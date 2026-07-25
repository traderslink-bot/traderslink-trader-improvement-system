import { compareUnicodeCodePoints, serializeCanonicalValue } from "../../../domain/canonical";
import type { CanonicalContentDigest } from "../../../domain/identity";
import {
  contractFailure,
  validateCanonicalCount,
  validateClaimedDigest,
  validateContractKey,
  validateContractRecord,
  validateReasonCodes,
  verifyExactMetricValue,
  type AnalyticalContractFailure,
  type ExactMetricValue,
} from "../../contracts";
import type { AnalyticalPartitionReceipt } from "../../dataset";
import type { TradeQueryAuthority, TradeQueryResult } from "../contracts";
import { verifyTradeQueryResultShape } from "../contracts";
import { isVerifiedTradeQueryExecution } from "../execution/verified-execution";
import { openReadOnlyTradeQueryGateway, type VerifiedTradeQueryDatasetSource } from "../gateway";
import { getTradeQueryMetricDeclaration } from "../metrics";
import {
  SIMILAR_TRADE_SEARCH_RESULT_VERSION,
  compareSimilarTradeMatch,
  searchSimilarTrades,
  verifySimilarTradeSearchPlan,
  type SimilarTradeDimensionExplanation,
  type SimilarTradeEvidenceReference,
  type SimilarTradeMatch,
  type SimilarTradeMatchingPolicy,
  type SimilarTradeSearchPlan,
  type SimilarTradeSearchResult,
} from "./similar-trade-search";

const MAXIMUM_EMITTED_CANDIDATES = 256;
const SUMMARY_METRIC_KEYS = Object.freeze([
  "candidate_count",
  "included_count",
  "excluded_count",
  "net_pnl",
  "average_pnl",
  "win_rate",
  "profit_factor",
] as const);
const RESULT_KEYS = Object.freeze([
  "schemaVersion",
  "resultKey",
  "resultVersion",
  "searchPlan",
  "searchPlanDigest",
  "queryPlanDigest",
  "sourceResultDigest",
  "datasetReceiptDigest",
  "datasetDerivationDigest",
  "partitionDigest",
  "ownerScope",
  "accountScope",
  "currency",
  "targetTradeKey",
  "normalizedFilters",
  "dimensions",
  "policies",
  "orderingPolicy",
  "evidencePolicy",
  "unavailableDimensionPolicy",
  "limitationPolicy",
  "candidateCount",
  "totalExactMatchCount",
  "emittedExactMatchCount",
  "totalNearMissCount",
  "emittedNearMissCount",
  "matches",
  "nearMisses",
  "summaryMetricPopulation",
  "summaryMetrics",
  "evidenceReferences",
  "limitationCodes",
  "resultDigest",
] as const);

function sameCanonical(left: unknown, right: unknown): boolean {
  const leftValue = serializeCanonicalValue(left);
  const rightValue = serializeCanonicalValue(right);
  return leftValue.ok && rightValue.ok && leftValue.value.json === rightValue.value.json;
}

function stringOrNull(input: unknown): input is string | null {
  return input === null || typeof input === "string";
}

function validateExplanation(
  input: unknown,
  policy: SimilarTradeMatchingPolicy,
  path: string,
): { readonly ok: true; readonly value: SimilarTradeDimensionExplanation } | {
  readonly ok: false; readonly error: AnalyticalContractFailure;
} {
  const record = validateContractRecord(input, [
    "dimension",
    "policyKey",
    "policyVersion",
    "targetAvailability",
    "candidateAvailability",
    "targetValue",
    "candidateValue",
    "targetBucketIdentity",
    "candidateBucketIdentity",
    "rangeMinimum",
    "rangeMaximum",
    "exactDistance",
    "relativeDistance",
    "threshold",
    "outcome",
    "reasonCode",
    "limitationCodes",
  ], [], path);
  if (!record.ok) return record;
  if (
    record.value.dimension !== policy.dimension ||
    record.value.policyKey !== policy.policyKey ||
    record.value.policyVersion !== policy.policyVersion ||
    (record.value.targetAvailability !== "available" && record.value.targetAvailability !== "unavailable") ||
    (record.value.candidateAvailability !== "available" && record.value.candidateAvailability !== "unavailable") ||
    (record.value.outcome !== "matched" && record.value.outcome !== "unmatched" && record.value.outcome !== "unavailable") ||
    !stringOrNull(record.value.targetValue) ||
    !stringOrNull(record.value.candidateValue) ||
    !stringOrNull(record.value.targetBucketIdentity) ||
    !stringOrNull(record.value.candidateBucketIdentity) ||
    !stringOrNull(record.value.rangeMinimum) ||
    !stringOrNull(record.value.rangeMaximum) ||
    !stringOrNull(record.value.exactDistance) ||
    !stringOrNull(record.value.relativeDistance) ||
    !stringOrNull(record.value.threshold) ||
    typeof record.value.reasonCode !== "string"
  ) {
    return contractFailure("ti_v3_analytics_contract_invalid", path);
  }
  const targetAvailability = record.value.targetAvailability as "available" | "unavailable";
  const candidateAvailability = record.value.candidateAvailability as "available" | "unavailable";
  const outcome = record.value.outcome as "matched" | "unmatched" | "unavailable";
  if (
    (targetAvailability === "available") !== (record.value.targetValue !== null) ||
    (candidateAvailability === "available") !== (record.value.candidateValue !== null) ||
    (outcome === "unavailable") !==
      (targetAvailability === "unavailable" || candidateAvailability === "unavailable") ||
    (outcome !== "unavailable" &&
      (targetAvailability !== "available" || candidateAvailability !== "available"))
  ) {
    return contractFailure("ti_v3_analytics_contract_invalid", `${path}.availability`);
  }
  const expectedReason = outcome === "unavailable"
    ? `ti_v3_similarity_unavailable_${
      targetAvailability === "unavailable" && candidateAvailability === "unavailable"
        ? "both"
        : targetAvailability === "unavailable"
          ? "target"
          : "candidate"}`
    : `ti_v3_similarity_${outcome}_${policy.policyKey}`;
  if (record.value.reasonCode !== expectedReason) {
    return contractFailure("ti_v3_analytics_contract_reference_mismatch", `${path}.reasonCode`);
  }
  const limitations = validateReasonCodes(record.value.limitationCodes, `${path}.limitationCodes`);
  if (!limitations.ok) return limitations;
  const expectedLimitations = [
    ...(targetAvailability === "unavailable" ? ["ti_v3_similarity_target_dimension_unavailable"] : []),
    ...(candidateAvailability === "unavailable" ? ["ti_v3_similarity_candidate_dimension_unavailable"] : []),
  ].sort(compareUnicodeCodePoints);
  if (!sameCanonical(limitations.value, expectedLimitations)) {
    return contractFailure("ti_v3_analytics_contract_reference_mismatch", `${path}.limitationCodes`);
  }
  const bucketPolicy =
    policy.policyKey === "canonical_bucket" ||
    policy.policyKey === "normalized_entry_time_bucket";
  if (
    (bucketPolicy && outcome !== "unavailable") !==
      (record.value.targetBucketIdentity !== null && record.value.candidateBucketIdentity !== null) ||
    (!bucketPolicy &&
      (record.value.targetBucketIdentity !== null || record.value.candidateBucketIdentity !== null))
  ) {
    return contractFailure("ti_v3_analytics_contract_invalid", `${path}.bucketIdentity`);
  }
  if (
    policy.policyKey === "inclusive_range"
      ? record.value.rangeMinimum !== policy.minimum || record.value.rangeMaximum !== policy.maximum
      : record.value.rangeMinimum !== null || record.value.rangeMaximum !== null
  ) {
    return contractFailure("ti_v3_analytics_contract_reference_mismatch", `${path}.range`);
  }
  if (
    policy.policyKey === "absolute_exact_distance"
      ? record.value.threshold !== policy.threshold ||
        (outcome === "unavailable" ? record.value.exactDistance !== null : record.value.exactDistance === null)
      : record.value.threshold !== null || record.value.exactDistance !== null
  ) {
    return contractFailure("ti_v3_analytics_contract_reference_mismatch", `${path}.distance`);
  }
  if (record.value.relativeDistance !== null) {
    return contractFailure("ti_v3_analytics_contract_invalid", `${path}.relativeDistance`);
  }
  return {
    ok: true,
    value: Object.freeze({
      dimension: policy.dimension,
      policyKey: policy.policyKey,
      policyVersion: policy.policyVersion,
      targetAvailability,
      candidateAvailability,
      targetValue: record.value.targetValue,
      candidateValue: record.value.candidateValue,
      targetBucketIdentity: record.value.targetBucketIdentity,
      candidateBucketIdentity: record.value.candidateBucketIdentity,
      rangeMinimum: record.value.rangeMinimum,
      rangeMaximum: record.value.rangeMaximum,
      exactDistance: record.value.exactDistance,
      relativeDistance: null,
      threshold: record.value.threshold,
      outcome,
      reasonCode: expectedReason,
      limitationCodes: limitations.value,
    }),
  };
}

function validateMatch(
  input: unknown,
  kind: "match" | "near_miss",
  plan: SimilarTradeSearchPlan,
  path: string,
): { readonly ok: true; readonly value: SimilarTradeMatch } | {
  readonly ok: false; readonly error: AnalyticalContractFailure;
} {
  const record = validateContractRecord(input, [
    "semanticRoundTripKey",
    "rowDigest",
    "executionDigests",
    "occurrenceKeys",
    "explanations",
    "matchedDimensions",
    "unmatchedDimensions",
    "unavailableDimensions",
    "kind",
  ], [], path);
  if (record.ok && record.value.kind !== kind) {
    return contractFailure("ti_v3_analytics_contract_reference_mismatch", `${path}.classification`);
  }
  if (
    !record.ok ||
    !Array.isArray(record.value.executionDigests) ||
    !Array.isArray(record.value.occurrenceKeys) ||
    !Array.isArray(record.value.explanations) ||
    !Array.isArray(record.value.matchedDimensions) ||
    !Array.isArray(record.value.unmatchedDimensions) ||
    !Array.isArray(record.value.unavailableDimensions) ||
    record.value.executionDigests.length !== record.value.occurrenceKeys.length ||
    record.value.explanations.length !== plan.dimensions.length
  ) {
    return record.ok
      ? contractFailure("ti_v3_analytics_contract_invalid", path)
      : record;
  }
  const identity = validateContractKey(record.value.semanticRoundTripKey, `${path}.semanticRoundTripKey`);
  const rowDigest = validateClaimedDigest(record.value.rowDigest, `${path}.rowDigest`, "analytical_row");
  if (!identity.ok) return identity;
  if (!rowDigest.ok) return rowDigest;
  const executionDigests: CanonicalContentDigest[] = [];
  for (let index = 0; index < record.value.executionDigests.length; index += 1) {
    const digest = validateClaimedDigest(
      record.value.executionDigests[index],
      `${path}.executionDigests[${index}]`,
      "canonical_execution",
    );
    if (!digest.ok) return digest;
    executionDigests.push(digest.value);
    const occurrence = validateContractKey(
      record.value.occurrenceKeys[index],
      `${path}.occurrenceKeys[${index}]`,
    );
    if (!occurrence.ok) return occurrence;
  }
  if (
    new Set(executionDigests).size !== executionDigests.length ||
    new Set(record.value.occurrenceKeys).size !== record.value.occurrenceKeys.length
  ) {
    return contractFailure("ti_v3_analytics_contract_duplicate_identity", `${path}.evidence`);
  }
  const explanations: SimilarTradeDimensionExplanation[] = [];
  for (let index = 0; index < plan.policies.length; index += 1) {
    const verified = validateExplanation(
      record.value.explanations[index],
      plan.policies[index],
      `${path}.explanations[${index}]`,
    );
    if (!verified.ok) return verified;
    explanations.push(verified.value);
  }
  const matchedDimensions = explanations.filter((item) => item.outcome === "matched").map((item) => item.dimension);
  const unmatchedDimensions = explanations.filter((item) => item.outcome === "unmatched").map((item) => item.dimension);
  const unavailableDimensions = explanations.filter((item) => item.outcome === "unavailable").map((item) => item.dimension);
  if (
    !sameCanonical(record.value.matchedDimensions, matchedDimensions) ||
    !sameCanonical(record.value.unmatchedDimensions, unmatchedDimensions) ||
    !sameCanonical(record.value.unavailableDimensions, unavailableDimensions) ||
    (kind === "match" && (unmatchedDimensions.length !== 0 || unavailableDimensions.length !== 0)) ||
    (kind === "near_miss" && unmatchedDimensions.length === 0 && unavailableDimensions.length === 0)
  ) {
    return contractFailure("ti_v3_analytics_contract_reference_mismatch", `${path}.classification`);
  }
  return {
    ok: true,
    value: Object.freeze({
      semanticRoundTripKey: identity.value,
      rowDigest: rowDigest.value,
      executionDigests: Object.freeze(executionDigests),
      occurrenceKeys: Object.freeze(record.value.occurrenceKeys as string[]),
      explanations: Object.freeze(explanations),
      matchedDimensions: Object.freeze(matchedDimensions),
      unmatchedDimensions: Object.freeze(unmatchedDimensions),
      unavailableDimensions: Object.freeze(unavailableDimensions),
      kind,
    }),
  };
}

function validateMatchInventory(
  input: unknown,
  kind: "match" | "near_miss",
  plan: SimilarTradeSearchPlan,
  path: string,
): { readonly ok: true; readonly value: readonly SimilarTradeMatch[] } | {
  readonly ok: false; readonly error: AnalyticalContractFailure;
} {
  if (!Array.isArray(input) || input.length > MAXIMUM_EMITTED_CANDIDATES) {
    return contractFailure("ti_v3_analytics_contract_oversized", path);
  }
  const matches: SimilarTradeMatch[] = [];
  for (let index = 0; index < input.length; index += 1) {
    const verified = validateMatch(input[index], kind, plan, `${path}[${index}]`);
    if (!verified.ok) return verified;
    matches.push(verified.value);
  }
  if (new Set(matches.map((item) => item.semanticRoundTripKey)).size !== matches.length) {
    return contractFailure("ti_v3_analytics_contract_duplicate_identity", path);
  }
  const sorted = [...matches].sort((left, right) =>
    compareSimilarTradeMatch(left, right, plan.dimensions, plan.policies));
  if (!sameCanonical(matches, sorted)) {
    return contractFailure("ti_v3_analytics_contract_reference_mismatch", `${path}.ordering`);
  }
  return { ok: true, value: Object.freeze(matches) };
}

function validateSummaryMetrics(
  input: unknown,
  candidateCount: string,
  emittedExactMatchCount: string,
  currency: string,
): { readonly ok: true; readonly value: readonly ExactMetricValue[] } | {
  readonly ok: false; readonly error: AnalyticalContractFailure;
} {
  if (!Array.isArray(input) || input.length !== SUMMARY_METRIC_KEYS.length) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.summaryMetrics");
  }
  const metrics: ExactMetricValue[] = [];
  for (let index = 0; index < input.length; index += 1) {
    const metric = verifyExactMetricValue(input[index]);
    if (!metric.ok) return metric;
    const key = SUMMARY_METRIC_KEYS[index];
    const declaration = getTradeQueryMetricDeclaration(key);
    if (
      metric.value.metricKey !== key ||
      metric.value.unit !== declaration.unit ||
      metric.value.currency !==
        (declaration.currencyBehavior === "selected_partition" ? currency : null)
    ) {
      return contractFailure("ti_v3_analytics_contract_reference_mismatch", `$.summaryMetrics[${index}]`);
    }
    metrics.push(metric.value);
  }
  const expectedCounts = new Map([
    ["candidate_count", candidateCount],
    ["included_count", emittedExactMatchCount],
    ["excluded_count", (BigInt(candidateCount) - BigInt(emittedExactMatchCount)).toString()],
  ]);
  for (const metric of metrics) {
    const expected = expectedCounts.get(metric.metricKey);
    if (expected !== undefined && (metric.kind !== "integer" || metric.value !== expected)) {
      return contractFailure("ti_v3_analytics_contract_count_mismatch", "$.summaryMetrics");
    }
  }
  return { ok: true, value: Object.freeze(metrics) };
}

function validateEvidenceReferences(
  input: unknown,
  matches: readonly SimilarTradeMatch[],
  nearMisses: readonly SimilarTradeMatch[],
): { readonly ok: true; readonly value: readonly SimilarTradeEvidenceReference[] } | {
  readonly ok: false; readonly error: AnalyticalContractFailure;
} {
  if (!Array.isArray(input) || input.length !== matches.length + nearMisses.length) {
    return contractFailure("ti_v3_analytics_contract_count_mismatch", "$.evidenceReferences");
  }
  const candidates = [...matches, ...nearMisses];
  const references: SimilarTradeEvidenceReference[] = [];
  for (let index = 0; index < input.length; index += 1) {
    const path = `$.evidenceReferences[${index}]`;
    const record = validateContractRecord(input[index], [
      "semanticRoundTripKey",
      "rowDigest",
      "executionDigests",
      "occurrenceKeys",
      "role",
    ], [], path);
    const candidate = candidates[index];
    const expectedRole = index < matches.length ? "exact_match" : "near_miss";
    if (
      !record.ok ||
      record.value.role !== expectedRole ||
      record.value.semanticRoundTripKey !== candidate.semanticRoundTripKey ||
      record.value.rowDigest !== candidate.rowDigest ||
      !sameCanonical(record.value.executionDigests, candidate.executionDigests) ||
      !sameCanonical(record.value.occurrenceKeys, candidate.occurrenceKeys)
    ) {
      return record.ok
        ? contractFailure("ti_v3_analytics_contract_reference_mismatch", path)
        : record;
    }
    references.push(Object.freeze({
      semanticRoundTripKey: candidate.semanticRoundTripKey,
      rowDigest: candidate.rowDigest,
      executionDigests: candidate.executionDigests,
      occurrenceKeys: candidate.occurrenceKeys,
      role: expectedRole,
    }));
  }
  return { ok: true, value: Object.freeze(references) };
}

export function verifySimilarTradeSearchResultShape(
  input: unknown,
  plan: SimilarTradeSearchPlan,
  authority: TradeQueryAuthority,
  sourceResult: TradeQueryResult,
): { readonly ok: true; readonly value: SimilarTradeSearchResult } | {
  readonly ok: false; readonly error: AnalyticalContractFailure;
} {
  const record = validateContractRecord(input, RESULT_KEYS, []);
  if (!record.ok) return record;
  if (
    record.value.schemaVersion !== SIMILAR_TRADE_SEARCH_RESULT_VERSION ||
    record.value.resultKey !== "ti_v3_execution_only_similar_trade_search_result" ||
    record.value.resultVersion !== "v1" ||
    record.value.searchPlanDigest !== plan.searchPlanDigest ||
    !sameCanonical(record.value.searchPlan, plan) ||
    record.value.queryPlanDigest !== sourceResult.normalizedQueryPlan.queryPlanDigest ||
    record.value.sourceResultDigest !== sourceResult.resultDigest ||
    record.value.datasetReceiptDigest !== authority.datasetReceipt.receiptDigest ||
    record.value.datasetDerivationDigest !== authority.datasetDerivationReceipt.derivationDigest ||
    record.value.partitionDigest !== authority.partitionReceipt.partitionDigest ||
    !sameCanonical(record.value.ownerScope, authority.partitionReceipt.ownerScope) ||
    !sameCanonical(record.value.accountScope, authority.partitionReceipt.accountScope) ||
    record.value.currency !== authority.partitionReceipt.currency ||
    record.value.targetTradeKey !== plan.targetTradeKey ||
    !sameCanonical(record.value.normalizedFilters, plan.normalizedFilterPlan.filters) ||
    !sameCanonical(record.value.dimensions, plan.dimensions) ||
    !sameCanonical(record.value.policies, plan.policies) ||
    record.value.orderingPolicy !== plan.orderingPolicy ||
    record.value.evidencePolicy !== plan.evidencePolicy ||
    record.value.unavailableDimensionPolicy !== plan.unavailableDimensionPolicy ||
    record.value.limitationPolicy !== plan.limitationPolicy ||
    record.value.summaryMetricPopulation !== "emitted_exact_matches"
  ) {
    return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.authority");
  }
  const candidateCount = validateCanonicalCount(record.value.candidateCount, "$.candidateCount");
  const totalExactMatchCount = validateCanonicalCount(record.value.totalExactMatchCount, "$.totalExactMatchCount");
  const emittedExactMatchCount = validateCanonicalCount(record.value.emittedExactMatchCount, "$.emittedExactMatchCount");
  const totalNearMissCount = validateCanonicalCount(record.value.totalNearMissCount, "$.totalNearMissCount");
  const emittedNearMissCount = validateCanonicalCount(record.value.emittedNearMissCount, "$.emittedNearMissCount");
  if (!candidateCount.ok) return candidateCount;
  if (!totalExactMatchCount.ok) return totalExactMatchCount;
  if (!emittedExactMatchCount.ok) return emittedExactMatchCount;
  if (!totalNearMissCount.ok) return totalNearMissCount;
  if (!emittedNearMissCount.ok) return emittedNearMissCount;
  const matches = validateMatchInventory(record.value.matches, "match", plan, "$.matches");
  const nearMisses = validateMatchInventory(record.value.nearMisses, "near_miss", plan, "$.nearMisses");
  if (!matches.ok) return matches;
  if (!nearMisses.ok) return nearMisses;
  const identities = [...matches.value, ...nearMisses.value].map((item) => item.semanticRoundTripKey);
  if (
    new Set(identities).size !== identities.length ||
    identities.includes(plan.targetTradeKey) ||
    BigInt(candidateCount.value) !== BigInt(totalExactMatchCount.value) + BigInt(totalNearMissCount.value) ||
    BigInt(emittedExactMatchCount.value) !== BigInt(matches.value.length) ||
    BigInt(emittedNearMissCount.value) !== BigInt(nearMisses.value.length) ||
    BigInt(emittedExactMatchCount.value) > BigInt(totalExactMatchCount.value) ||
    BigInt(emittedNearMissCount.value) > BigInt(totalNearMissCount.value) ||
    BigInt(emittedExactMatchCount.value) > BigInt(plan.maximumMatches) ||
    BigInt(emittedNearMissCount.value) > BigInt(plan.maximumNearMisses) ||
    (!plan.includeNearMisses && nearMisses.value.length !== 0)
  ) {
    return contractFailure("ti_v3_analytics_contract_count_mismatch", "$.counts");
  }
  const metrics = validateSummaryMetrics(
    record.value.summaryMetrics,
    candidateCount.value,
    emittedExactMatchCount.value,
    authority.partitionReceipt.currency,
  );
  if (!metrics.ok) return metrics;
  const evidence = validateEvidenceReferences(record.value.evidenceReferences, matches.value, nearMisses.value);
  if (!evidence.ok) return evidence;
  const limitations = validateReasonCodes(record.value.limitationCodes, "$.limitationCodes");
  if (!limitations.ok) return limitations;
  const allowedLimitations = new Set([
    "ti_v3_similar_trade_matches_bounded",
    "ti_v3_similar_trade_near_misses_bounded",
    "ti_v3_similar_trade_zero_matches",
    "ti_v3_similarity_target_dimension_unavailable",
    "ti_v3_similarity_candidate_dimension_unavailable",
    "ti_v3_similarity_exact_distance_unavailable",
  ]);
  const requiredLimitations = [
    ...(BigInt(emittedExactMatchCount.value) < BigInt(totalExactMatchCount.value)
      ? ["ti_v3_similar_trade_matches_bounded"]
      : []),
    ...(plan.includeNearMisses &&
      BigInt(emittedNearMissCount.value) < BigInt(totalNearMissCount.value)
      ? ["ti_v3_similar_trade_near_misses_bounded"]
      : []),
    ...(totalExactMatchCount.value === "0" ? ["ti_v3_similar_trade_zero_matches"] : []),
    ...([...matches.value, ...nearMisses.value].some((item) =>
      item.explanations.some((explanation) => explanation.targetAvailability === "unavailable"))
      ? ["ti_v3_similarity_target_dimension_unavailable"]
      : []),
    ...([...matches.value, ...nearMisses.value].some((item) =>
      item.explanations.some((explanation) => explanation.candidateAvailability === "unavailable"))
      ? ["ti_v3_similarity_candidate_dimension_unavailable"]
      : []),
    ...([...matches.value, ...nearMisses.value].some((item) =>
      item.explanations.some((explanation) =>
        explanation.policyKey === "absolute_exact_distance" &&
        explanation.outcome === "unavailable"))
      ? ["ti_v3_similarity_exact_distance_unavailable"]
      : []),
  ];
  if (
    limitations.value.some((code) => !allowedLimitations.has(code)) ||
    requiredLimitations.some((code) => !limitations.value.includes(code)) ||
    !sameCanonical(record.value.limitationCodes, limitations.value)
  ) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.limitationCodes");
  }
  const digest = validateClaimedDigest(record.value.resultDigest, "$.resultDigest", "trade_query_similarity_result");
  if (!digest.ok) return digest;
  return { ok: true, value: record.value as unknown as SimilarTradeSearchResult };
}

export function verifySimilarTradeSearchResult(args: Readonly<{
  readonly source: VerifiedTradeQueryDatasetSource;
  readonly partitionReceipt: AnalyticalPartitionReceipt;
  readonly sourceResult: unknown;
  readonly plan: unknown;
  readonly result: unknown;
}>): { readonly ok: true; readonly value: SimilarTradeSearchResult } | {
  readonly ok: false; readonly error: AnalyticalContractFailure;
} {
  const gateway = openReadOnlyTradeQueryGateway(args.source, args.partitionReceipt);
  if (!gateway.ok) return gateway;
  const sourceResult = verifyTradeQueryResultShape(args.sourceResult, gateway.value.authority);
  if (!sourceResult.ok || !isVerifiedTradeQueryExecution(args.sourceResult)) {
    return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.sourceResult");
  }
  const plan = verifySimilarTradeSearchPlan(
    args.plan,
    gateway.value.authority,
    sourceResult.value.resultDigest,
  );
  if (!plan.ok) return plan;
  const shape = verifySimilarTradeSearchResultShape(
    args.result,
    plan.value,
    gateway.value.authority,
    sourceResult.value,
  );
  if (!shape.ok) return shape;
  const rebuilt = searchSimilarTrades({
    source: args.source,
    partitionReceipt: args.partitionReceipt,
    result: args.sourceResult,
    plan: plan.value,
  });
  if (!rebuilt.ok) return rebuilt;
  const supplied = serializeCanonicalValue(args.result);
  const accepted = serializeCanonicalValue(rebuilt.value);
  if (
    !supplied.ok ||
    !accepted.ok ||
    supplied.value.json !== accepted.value.json ||
    shape.value.resultDigest !== rebuilt.value.resultDigest
  ) {
    return contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.result.resultDigest");
  }
  return rebuilt;
}
