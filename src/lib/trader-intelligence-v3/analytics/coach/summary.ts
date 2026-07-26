import { compareUnicodeCodePoints } from "../../domain/canonical";
import { compareExactDecimals, validateExactDecimal, type ExactResult } from "../../domain/exact";
import { finalizeContentAddressedAuthority, type AnalyticalContractFailure, type ExactMetricValue } from "../contracts";
import type { AnalyticalPartitionReceipt } from "../dataset";
import type { TradeQueryFilter } from "../query";
import type { VerifiedTradeQueryDatasetSource } from "../query/gateway";
import {
  COACH_SUMMARY_CAPABILITY_KEYS,
} from "./registry";
import {
  executeCoachCapability,
} from "./coach-analytics";
import {
  COACH_SUMMARY_RESULT_VERSION,
  COACH_SUMMARY_SEMANTIC_VERSION,
  type CoachAnalyticsResult,
  type CoachCapabilityKey,
  type CoachFinding,
  type CoachSummaryConfidence,
  type CoachSummaryMetricCategory,
  type CoachSummaryRankedFinding,
  type CoachSummaryResult,
  type CoachSummarySourceReference,
  type CoachSummaryUnsupportedData,
  type CoachSummaryWeakSource,
} from "./contracts";

export interface CoachSummaryRequest {
  readonly source: VerifiedTradeQueryDatasetSource;
  readonly partitionReceipt: AnalyticalPartitionReceipt;
  readonly filters?: readonly TradeQueryFilter[];
  readonly baselineFilters?: readonly TradeQueryFilter[];
  readonly capabilityKeys?: readonly CoachCapabilityKey[];
}

function sourceReference(result: CoachAnalyticsResult): CoachSummarySourceReference {
  return Object.freeze({
    capabilityKey: result.capabilityKey,
    coachResultDigest: result.coachResultDigest,
    queryPlanDigest: result.digestReplayIdentity.queryPlanDigest,
    queryResultDigest: result.digestReplayIdentity.queryResultDigest,
    comparisonDigest: result.digestReplayIdentity.comparisonDigest,
    authorityStatus: result.authorityStatus,
    sampleSizeStatus: result.sampleSizeStatus,
    includedTradeCount: result.includedTradeCount,
    limitationCodes: Object.freeze([...result.limitationCodes]),
    unsupportedData: result.unsupportedData === null ? null : Object.freeze({
      code: result.unsupportedData.code,
      requiredData: Object.freeze([...result.unsupportedData.requiredData]),
    }),
  });
}

function metricCategory(finding: CoachFinding): CoachSummaryMetricCategory {
  switch (finding.metric?.metricKey) {
    case "net_pnl": return "performance_pnl";
    case "maximum_peak_profit_giveback": return "giveback_money";
    case "maximum_intraday_drawdown": return "drawdown_money";
    case "profitable_day_percentage": return "day_consistency_ratio";
    default: return "other";
  }
}

function confidence(result: CoachAnalyticsResult, finding: CoachFinding | null): CoachSummaryConfidence {
  if (result.authorityStatus === "unsupported") return "unsupported";
  if (result.sampleSizeStatus !== "meets_minimum_sample" || result.authorityStatus !== "verified_execution_only" || finding === null || finding.evidence.length === 0) return "weak";
  if (result.unsupportedData !== null) return "unsupported";
  return result.limitationCodes.length === 0 && finding.limitationCodes.length === 0 ? "strong" : "qualified";
}

function ranked(result: CoachAnalyticsResult, finding: CoachFinding): CoachSummaryRankedFinding {
  return Object.freeze({
    source: sourceReference(result),
    finding,
    confidence: confidence(result, finding),
    metricCategory: metricCategory(finding),
  });
}

function compareMetric(left: ExactMetricValue | null, right: ExactMetricValue | null): number {
  if (left?.kind !== "exact_decimal" || right?.kind !== "exact_decimal") return 0;
  const leftValue = validateExactDecimal(left.value);
  const rightValue = validateExactDecimal(right.value);
  if (!leftValue.ok || !rightValue.ok) return 0;
  return compareExactDecimals(leftValue.value, rightValue.value);
}

function compareIdentity(left: CoachSummaryRankedFinding, right: CoachSummaryRankedFinding): number {
  return compareUnicodeCodePoints(left.source.capabilityKey, right.source.capabilityKey)
    || compareUnicodeCodePoints(left.source.coachResultDigest, right.source.coachResultDigest)
    || compareUnicodeCodePoints(left.finding.groupIdentity ?? "", right.finding.groupIdentity ?? "");
}

function compareConfidence(left: CoachSummaryRankedFinding, right: CoachSummaryRankedFinding): number {
  const order: Readonly<Record<CoachSummaryConfidence, number>> = Object.freeze({ strong: 0, qualified: 1, weak: 2, unsupported: 3 });
  return order[left.confidence] - order[right.confidence]
    || right.finding.evidence.length - left.finding.evidence.length
    || left.source.limitationCodes.length - right.source.limitationCodes.length
    || compareIdentity(left, right);
}

function actionable(item: CoachSummaryRankedFinding): boolean {
  return item.confidence === "strong" || item.confidence === "qualified";
}

function weakSources(results: readonly CoachAnalyticsResult[]): readonly CoachSummaryWeakSource[] {
  return Object.freeze(results.flatMap((result) => {
    if (result.authorityStatus === "unsupported") return [];
    const value = confidence(result, result.primaryFinding);
    if (value !== "weak") return [];
    const reason = result.sampleSizeStatus !== "meets_minimum_sample"
      ? "insufficient_sample_size" as const
      : result.authorityStatus !== "verified_execution_only"
        ? "limited_authority" as const
        : "missing_bounded_evidence" as const;
    return [Object.freeze({ source: sourceReference(result), confidence: value, reason })];
  }).sort((left, right) => compareUnicodeCodePoints(left.source.capabilityKey, right.source.capabilityKey)
    || compareUnicodeCodePoints(left.source.coachResultDigest, right.source.coachResultDigest)));
}

function unsupportedSummary(results: readonly CoachAnalyticsResult[]): readonly CoachSummaryUnsupportedData[] {
  const grouped = new Map<string, { requiredData: readonly string[]; sources: CoachSummarySourceReference[] }>();
  for (const result of results) {
    if (result.unsupportedData === null) continue;
    const current = grouped.get(result.unsupportedData.code) ?? { requiredData: result.unsupportedData.requiredData, sources: [] };
    current.sources.push(sourceReference(result));
    grouped.set(result.unsupportedData.code, current);
  }
  return Object.freeze([...grouped.entries()].sort((left, right) => compareUnicodeCodePoints(left[0], right[0]))
    .map(([code, value]) => Object.freeze({
      code,
      requiredData: Object.freeze([...value.requiredData]),
      sources: Object.freeze([...value.sources].sort((left, right) => compareUnicodeCodePoints(left.capabilityKey, right.capabilityKey))),
    })));
}

function sum(values: readonly string[]): string {
  return values.reduce((total, value) => total + BigInt(value), BigInt("0")).toString();
}

function buildSummary(results: readonly CoachAnalyticsResult[]): CoachSummaryResult {
  const sourceResults = Object.freeze(results.map(sourceReference));
  const primary = results.flatMap((result) => result.primaryFinding === null ? [] : [ranked(result, result.primaryFinding)]);
  const performanceLeaks = primary.filter((item) => actionable(item) && item.metricCategory === "performance_pnl")
    .sort((left, right) => compareMetric(left.finding.metric, right.finding.metric) || compareIdentity(left, right));
  const performanceStrengths = results.flatMap((result) => {
    const finding = result.rankedFindingList.at(-1) ?? null;
    if (finding === null) return [];
    const item = ranked(result, finding);
    return actionable(item) && item.metricCategory === "performance_pnl" ? [item] : [];
  }).sort((left, right) => -compareMetric(left.finding.metric, right.finding.metric) || compareIdentity(left, right));
  const category = (key: CoachSummaryMetricCategory, descending: boolean) => Object.freeze(primary
    .filter((item) => actionable(item) && item.metricCategory === key)
    .sort((left, right) => (descending ? -1 : 1) * compareMetric(left.finding.metric, right.finding.metric) || compareIdentity(left, right))
    .slice(0, 3));
  const rules = results.flatMap((result) => result.rankedFindingList
    .filter((finding) => finding.ruleCandidateStatus === "rule_to_test" && finding.ruleCandidateKey !== null)
    .map((finding) => ranked(result, finding))
    .filter(actionable))
    .sort(compareConfidence);
  const uniqueRules = Object.freeze(rules.filter((item, index, values) => values.findIndex((candidate) => candidate.finding.ruleCandidateKey === item.finding.ruleCandidateKey) === index));
  const topNegativeLeaks = Object.freeze(performanceLeaks.slice(0, 3));
  const topPositiveStrengths = Object.freeze(performanceStrengths.slice(0, 3));
  const highestConfidenceFinding = [...primary.filter(actionable)].sort(compareConfidence)[0] ?? null;
  const nextFocus = topNegativeLeaks[0] !== undefined
    ? Object.freeze({ kind: "finding" as const, finding: topNegativeLeaks[0], ruleCandidateKey: null })
    : uniqueRules[0] !== undefined
      ? Object.freeze({ kind: "rule_to_test" as const, finding: uniqueRules[0], ruleCandidateKey: uniqueRules[0].finding.ruleCandidateKey })
      : Object.freeze({ kind: "unavailable" as const, finding: null, ruleCandidateKey: null });
  const content = {
    schemaVersion: COACH_SUMMARY_RESULT_VERSION,
    semanticVersion: COACH_SUMMARY_SEMANTIC_VERSION,
    sourceResults,
    topNegativeLeaks,
    topPositiveStrengths,
    categorizedFindings: Object.freeze({
      givebackMoney: category("giveback_money", true),
      drawdownMoney: category("drawdown_money", false),
      dayConsistencyRatio: category("day_consistency_ratio", true),
    }),
    highestConfidenceFinding,
    weakFindings: weakSources(results),
    limitationWarnings: Object.freeze([...new Set(results.flatMap((result) => result.limitationCodes))].sort(compareUnicodeCodePoints)),
    unsupportedDataSummary: unsupportedSummary(results),
    evidenceCoverage: Object.freeze({
      sourceResultCount: String(results.length),
      actionableFindingCount: String(primary.filter(actionable).length),
      sourceWithEvidenceCount: String(results.filter((result) => result.evidenceTradeReferences.length > 0).length),
      evidenceReferenceCount: sum(results.map((result) => String(result.evidenceTradeReferences.length))),
      evidenceOmittedCount: sum(results.map((result) => result.evidenceOmittedCount)),
    }),
    nextFocus,
    ruleToTestRanking: uniqueRules,
  };
  const built = finalizeContentAddressedAuthority("coach_summary_result", content, "summaryResultDigest");
  if (!built.ok) throw new Error(`${built.error.code}:${built.error.path}`);
  return built.value as CoachSummaryResult;
}

export function executeCoachSummary(
  request: CoachSummaryRequest,
): ExactResult<CoachSummaryResult, AnalyticalContractFailure> {
  const keys = request.capabilityKeys ?? COACH_SUMMARY_CAPABILITY_KEYS;
  const results: CoachAnalyticsResult[] = [];
  for (const capabilityKey of keys) {
    const executed = executeCoachCapability({
      intentKey: "coach_summary_analysis",
      capabilityKey,
      source: request.source,
      partitionReceipt: request.partitionReceipt,
      filters: request.filters,
      baselineFilters: request.baselineFilters,
    });
    if (!executed.ok) return executed;
    results.push(executed.value);
  }
  return { ok: true, value: buildSummary(results) };
}
