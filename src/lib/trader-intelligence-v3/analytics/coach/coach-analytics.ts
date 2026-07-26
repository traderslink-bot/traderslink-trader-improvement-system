import { compareUnicodeCodePoints } from "../../domain/canonical";
import { compareExactDecimals, validateExactDecimal, type ExactResult } from "../../domain/exact";
import { contractFailure, finalizeContentAddressedAuthority, type AnalyticalContractFailure, type ExactMetricValue } from "../contracts";
import type { AnalyticalPartitionReceipt } from "../dataset";
import {
  buildTradeQueryPlan,
  compileGa1BPreset,
  executeGa1BPreset,
  executeTradeQuery,
  openReadOnlyTradeQueryGateway,
  type Ga1BPresetKey,
  type TradeQueryFilter,
  type TradeQueryComparison,
  type TradeQueryMetricKey,
  type TradeQueryResult,
} from "../query";
import type { VerifiedTradeQueryDatasetSource } from "../query/gateway";
import {
  COACH_INTENT_CAPABILITY_MAP,
  getCoachCapability,
} from "./registry";
import {
  COACH_ANALYTICS_RESULT_VERSION,
  COACH_ANALYTICS_SEMANTIC_VERSION,
  type CoachAnalyticsResult,
  type CoachCapabilityKey,
  type CoachFinding,
  type CoachIntentKey,
} from "./contracts";

export interface CoachCapabilityRequest {
  readonly intentKey: CoachIntentKey;
  readonly capabilityKey: CoachCapabilityKey;
  readonly source: VerifiedTradeQueryDatasetSource;
  readonly partitionReceipt: AnalyticalPartitionReceipt;
  readonly filters?: readonly TradeQueryFilter[];
  readonly baselineFilters?: readonly TradeQueryFilter[];
}

export interface CoachIntentRequest {
  readonly intentKey: CoachIntentKey;
  readonly source: VerifiedTradeQueryDatasetSource;
  readonly partitionReceipt: AnalyticalPartitionReceipt;
  readonly filters?: readonly TradeQueryFilter[];
  readonly baselineFilters?: readonly TradeQueryFilter[];
}

function rowMetric(
  row: TradeQueryResult["rows"][number],
  metricKey: TradeQueryMetricKey,
): ExactMetricValue | null {
  return row.metrics.find((metric) => metric.metricKey === metricKey) ?? null;
}

function comparePnl(left: ExactMetricValue | null, right: ExactMetricValue | null): number {
  if (left?.kind !== "exact_decimal" || right?.kind !== "exact_decimal") return 0;
  const leftValue = validateExactDecimal(left.value);
  const rightValue = validateExactDecimal(right.value);
  if (!leftValue.ok || !rightValue.ok) return 0;
  return compareExactDecimals(leftValue.value, rightValue.value);
}

function resultFindings(
  capabilityKey: CoachCapabilityKey,
  result: TradeQueryResult,
  findingCode: CoachFinding["findingCode"],
  ruleCandidateKey: string | null,
  findingMetricKey: TradeQueryMetricKey,
  findingSort: "ascending" | "descending",
): readonly CoachFinding[] {
  const evidenceByDigest = new Map(result.evidence.map((item) => [item.evidenceDigest, item]));
  const ranked = [...result.rows].sort((left, right) => {
    const compared = comparePnl(rowMetric(left, findingMetricKey), rowMetric(right, findingMetricKey));
    return (findingSort === "ascending" ? compared : -compared) || compareUnicodeCodePoints(left.groupIdentity, right.groupIdentity);
  });
  return Object.freeze(ranked.map((row, index) => Object.freeze({
    findingCode: index === 0 ? findingCode : "biggest_positive_strength",
    capabilityKey,
    groupIdentity: row.groupIdentity,
    groupLabel: row.groupLabel,
    metric: rowMetric(row, findingMetricKey),
    sampleSize: row.includedCount,
    evidence: evidenceByDigest.get(row.evidenceDigest)?.candidates ?? Object.freeze([]),
    limitationCodes: row.limitationCodes,
    ruleCandidateKey: index === 0 ? ruleCandidateKey : null,
    ruleCandidateStatus: index === 0 && ruleCandidateKey !== null ? "rule_to_test" : "not_applicable",
  })));
}

function evidenceOmitted(result: TradeQueryResult): string {
  let omitted = BigInt("0");
  for (const item of result.evidence) {
    omitted += BigInt(item.populationCount) - BigInt(item.candidates.length);
  }
  return omitted.toString();
}

function trendFinding(
  capabilityKey: CoachCapabilityKey,
  result: TradeQueryResult,
  comparison: TradeQueryComparison,
  baseline: TradeQueryResult,
): readonly CoachFinding[] {
  const netPnl = comparison.metrics.find((metric) => metric.metricKey === "net_pnl");
  if (netPnl === undefined) return Object.freeze([]);
  const evidence = Object.freeze([
    ...result.evidence.flatMap((item) => item.candidates),
    ...baseline.evidence.flatMap((item) => item.candidates),
  ]);
  return Object.freeze([Object.freeze({
    findingCode: "period_trend" as const,
    capabilityKey,
    groupIdentity: "comparison:current_vs_prior",
    groupLabel: "Current period versus prior period",
    metric: netPnl.difference,
    sampleSize: result.includedCount,
    evidence,
    limitationCodes: comparison.limitationCodes,
    ruleCandidateKey: null,
    ruleCandidateStatus: "not_applicable" as const,
  })]);
}

function makeUnsupportedResult(
  request: CoachCapabilityRequest,
  requiredData: readonly string[],
): CoachAnalyticsResult {
  const content = {
    schemaVersion: COACH_ANALYTICS_RESULT_VERSION,
    semanticVersion: COACH_ANALYTICS_SEMANTIC_VERSION,
    intentKey: request.intentKey,
    capabilityKey: request.capabilityKey,
    normalizedFilters: Object.freeze([...(request.filters ?? [])]),
    normalizedMetrics: Object.freeze([] as TradeQueryMetricKey[]),
    normalizedDimensions: Object.freeze([] as string[]),
    comparisonType: "none" as const,
    includedTradeCount: "0",
    excludedTradeCount: "0",
    unavailableTradeCount: "0",
    sampleSizeStatus: "insufficient_sample_size" as const,
    authorityStatus: "unsupported" as const,
    limitationCodes: Object.freeze(requiredData.map((item) => `ti_v3_coach_${item}`)),
    primaryFinding: null,
    secondaryFindings: Object.freeze([] as CoachFinding[]),
    rankedFindingList: Object.freeze([] as CoachFinding[]),
    metricTables: Object.freeze([]),
    evidenceTradeReferences: Object.freeze([]),
    evidenceOmittedCount: "0",
    comparison: null,
    digestReplayIdentity: Object.freeze({ queryPlanDigest: null, queryResultDigest: null, queryExecutionReceiptDigest: null, baselineQueryPlanDigest: null, baselineQueryResultDigest: null, comparisonDigest: null }),
    unsupportedData: Object.freeze({ code: requiredData[0] ?? "unsupported_data", requiredData: Object.freeze([...requiredData]) }),
  };
  const built = finalizeContentAddressedAuthority("coach_analytics_result", content, "coachResultDigest");
  if (!built.ok) throw new Error(`${built.error.code}:${built.error.path}`);
  return built.value as CoachAnalyticsResult;
}

function buildResult(
  request: CoachCapabilityRequest,
  result: TradeQueryResult,
  comparison: TradeQueryComparison | null = null,
  baseline: TradeQueryResult | null = null,
): CoachAnalyticsResult {
  const capability = getCoachCapability(request.capabilityKey);
  const meetsMinimumSample = BigInt(result.includedCount) >= BigInt(capability.minimumSample);
  const comparisonMeetsMinimumSample = comparison !== null && baseline !== null &&
    meetsMinimumSample && BigInt(baseline.includedCount) >= BigInt(capability.minimumSample);
  const findings = comparison !== null && baseline !== null
    ? comparisonMeetsMinimumSample
      ? trendFinding(request.capabilityKey, result, comparison, baseline)
      : Object.freeze([] as CoachFinding[])
    : meetsMinimumSample
      ? resultFindings(
        request.capabilityKey,
        result,
        capability.findingCode,
        capability.ruleCandidateKey,
        capability.findingMetricKey,
        capability.findingSort,
      )
      : Object.freeze([] as CoachFinding[]);
  const primary = findings[0] ?? null;
  const evidence = Object.freeze(result.evidence.flatMap((item) => item.candidates));
  const content = {
    schemaVersion: COACH_ANALYTICS_RESULT_VERSION,
    semanticVersion: COACH_ANALYTICS_SEMANTIC_VERSION,
    intentKey: request.intentKey,
    capabilityKey: request.capabilityKey,
    normalizedFilters: result.normalizedQueryPlan.filters,
    normalizedMetrics: result.normalizedQueryPlan.metrics,
    normalizedDimensions: capability.dimensions,
    comparisonType: capability.comparisonType,
    includedTradeCount: result.includedCount,
    excludedTradeCount: result.excludedCount,
    unavailableTradeCount: "0",
    sampleSizeStatus: meetsMinimumSample && (baseline === null || BigInt(baseline.includedCount) >= BigInt(capability.minimumSample))
      ? "meets_minimum_sample" as const : "insufficient_sample_size" as const,
    authorityStatus: result.limitationCodes.length === 0 ? "verified_execution_only" as const : "limited" as const,
    limitationCodes: Object.freeze([...new Set([
      ...result.limitationCodes,
      ...(comparison?.limitationCodes ?? []),
    ])].sort(compareUnicodeCodePoints)),
    primaryFinding: primary,
    secondaryFindings: Object.freeze(findings.slice(1, 4)),
    rankedFindingList: findings,
    metricTables: Object.freeze([
      { sourceQueryResultDigest: result.resultDigest, rows: result.rows },
      ...(baseline === null ? [] : [{ sourceQueryResultDigest: baseline.resultDigest, rows: baseline.rows }]),
    ]),
    evidenceTradeReferences: evidence,
    evidenceOmittedCount: evidenceOmitted(result),
    comparison,
    digestReplayIdentity: Object.freeze({
      queryPlanDigest: result.normalizedQueryPlan.queryPlanDigest,
      queryResultDigest: result.resultDigest,
      queryExecutionReceiptDigest: result.executionReceipt.receiptDigest,
      baselineQueryPlanDigest: baseline?.normalizedQueryPlan.queryPlanDigest ?? null,
      baselineQueryResultDigest: baseline?.resultDigest ?? null,
      comparisonDigest: comparison?.comparisonDigest ?? null,
    }),
    unsupportedData: meetsMinimumSample && (baseline === null || BigInt(baseline.includedCount) >= BigInt(capability.minimumSample))
      ? null
      : Object.freeze({ code: "insufficient_sample_size", requiredData: Object.freeze(["insufficient_sample_size"]) }),
  };
  const built = finalizeContentAddressedAuthority("coach_analytics_result", content, "coachResultDigest");
  if (!built.ok) throw new Error(`${built.error.code}:${built.error.path}`);
  return built.value as CoachAnalyticsResult;
}

export function executeCoachCapability(
  request: CoachCapabilityRequest,
): ExactResult<CoachAnalyticsResult, AnalyticalContractFailure> {
  const capability = getCoachCapability(request.capabilityKey);
  if (capability.execution === "unsupported") {
    return { ok: true, value: makeUnsupportedResult(request, capability.unsupportedData) };
  }
  const gateway = openReadOnlyTradeQueryGateway(request.source, request.partitionReceipt);
  if (!gateway.ok) return gateway;
  const authority = gateway.value.authority;
  if (capability.execution === "ga1_b_preset") {
    if (capability.presetKey === "compare_periods" && request.baselineFilters === undefined) {
      return { ok: true, value: makeUnsupportedResult(request, ["period_comparison_required"]) };
    }
    const preset = compileGa1BPreset({
      presetKey: capability.presetKey as Ga1BPresetKey,
      authority,
      filters: request.filters,
      baselineFilters: request.baselineFilters,
    });
    if (!preset.ok) return preset;
    const executed = executeGa1BPreset({ source: request.source, partitionReceipt: request.partitionReceipt, preset: preset.value });
    return executed.ok ? {
      ok: true,
      value: buildResult(request, executed.value.primaryResult, executed.value.comparison, executed.value.baselineResult),
    } : executed;
  }
  const plan = buildTradeQueryPlan({
    schemaVersion: "ti_v3_trade_query_plan_v1",
    queryPlanKey: "generic_deterministic_trade_query",
    queryPlanVersion: "v1",
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
    filters: request.filters ?? [],
    grouping: capability.grouping ?? { kind: "aggregate" },
    metrics: capability.metrics,
    ordering: [{ by: "metric", metricKey: "net_pnl", direction: "ascending" }],
    limits: { groupLimit: "64", resultRowLimit: "64", evidencePerGroup: "8", totalEvidenceLimit: "128", diagnosticLimit: "32" },
    policies: {
      temporalPolicyKey: "ti_v3_strictly_completed_trade_context", temporalPolicyVersion: "v1",
      sequencePolicyKey: "ti_v3_owner_account_session_entry_sequence", sequencePolicyVersion: "v1",
      repeatAttemptPolicyKey: "ti_v3_owner_account_session_symbol_entry_attempt", repeatAttemptPolicyVersion: "v1",
      groupingPolicyKey: "ti_v3_deterministic_trade_query_grouping", groupingPolicyVersion: "v1",
      exactMetricPolicyKey: "ti_v3_exact_trade_query_metrics", exactMetricPolicyVersion: "v1",
      evidencePolicyKey: "ti_v3_bounded_support_counterexample_evidence", evidencePolicyVersion: "v1",
      limitationPolicyKey: "ti_v3_query_limitation_union", limitationPolicyVersion: "v1",
      emptyBucketPolicy: "omit_empty_buckets",
    },
  }, authority);
  if (!plan.ok) return plan;
  const executed = executeTradeQuery({ source: request.source, partitionReceipt: request.partitionReceipt, queryPlan: plan.value });
  return executed.ok ? { ok: true, value: buildResult(request, executed.value) } : executed;
}

export function executeCoachIntent(
  request: CoachIntentRequest,
): ExactResult<readonly CoachAnalyticsResult[], AnalyticalContractFailure> {
  const capabilities = COACH_INTENT_CAPABILITY_MAP[request.intentKey];
  if (capabilities === undefined) return contractFailure("ti_v3_analytics_contract_invalid", "$.intentKey");
  const results: CoachAnalyticsResult[] = [];
  for (const capabilityKey of capabilities) {
    const result = executeCoachCapability({ ...request, capabilityKey });
    if (!result.ok) return result;
    results.push(result.value);
  }
  return { ok: true, value: Object.freeze(results) };
}
