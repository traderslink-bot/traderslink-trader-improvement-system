import { compareUnicodeCodePoints, serializeCanonicalValue } from "../../../domain/canonical";
import type { CanonicalContentDigest } from "../../../domain/identity";
import {
  contractFailure,
  finalizeContentAddressedAuthority,
  type AnalyticalContractFailure,
} from "../../contracts";
import type { AnalyticalPartitionReceipt } from "../../dataset";
import { applyTradeQueryFilters } from "../filters";
import { tradeQueryGroupAssignment } from "../grouping";
import { openReadOnlyTradeQueryGateway, type VerifiedTradeQueryDatasetSource } from "../gateway";
import { buildQueryRowSemantics, type QueryRowSemantics } from "../execution";
import { isVerifiedTradeQueryExecution } from "../execution/verified-execution";
import { TRADE_QUERY_METRIC_REGISTRY } from "../metrics";
import {
  verifyTradeQueryResultShape,
  verifyTradeQueryComparison,
  type TradeQueryComparison,
  type TradeQueryResult,
} from "../contracts";

export const TRADE_QUERY_EVIDENCE_RETRIEVAL_VERSION =
  "ti_v3_trade_query_evidence_retrieval_v1" as const;

export type TradeQueryEvidenceTarget = Readonly<
  | { readonly kind: "result" }
  | { readonly kind: "group"; readonly groupIdentity: string }
  | { readonly kind: "metric"; readonly groupIdentity: string; readonly metricKey: string }
  | { readonly kind: "evidence"; readonly evidenceDigest: CanonicalContentDigest }
  | { readonly kind: "trade"; readonly semanticRoundTripKey: string }
>;

export interface TradeQueryEvidenceRetrievalRequest {
  readonly target: TradeQueryEvidenceTarget;
  readonly maximumTrades: string;
  readonly maximumExecutions: string;
}

export interface TradeQueryEvidenceTrade {
  readonly semanticRoundTripKey: string;
  readonly rowDigest: CanonicalContentDigest;
  readonly executionDigests: readonly CanonicalContentDigest[];
  readonly occurrenceKeys: readonly string[];
  readonly groupIdentity: string;
  readonly inclusionState: "included" | "filter_excluded";
  readonly roles: readonly ("included" | "supporting" | "counterexample")[];
  readonly exclusionReasonCodes: readonly string[];
  readonly limitationCodes: readonly string[];
}

export interface TradeQueryEvidenceRetrieval {
  readonly schemaVersion: typeof TRADE_QUERY_EVIDENCE_RETRIEVAL_VERSION;
  readonly retrievalKey: "ti_v3_deterministic_trade_query_evidence_retrieval";
  readonly retrievalVersion: "v1";
  readonly queryPlanDigest: CanonicalContentDigest;
  readonly resultDigest: CanonicalContentDigest;
  readonly comparisonDigest: CanonicalContentDigest | null;
  readonly datasetReceiptDigest: CanonicalContentDigest;
  readonly datasetDerivationDigest: CanonicalContentDigest;
  readonly partitionDigest: CanonicalContentDigest;
  readonly metricRegistryDigest: CanonicalContentDigest;
  readonly target: TradeQueryEvidenceTarget;
  readonly totalResolvedTradeCount: string;
  readonly trades: readonly TradeQueryEvidenceTrade[];
  readonly sourceExclusionKeys: readonly string[];
  readonly limitationCodes: readonly string[];
  readonly retrievalDigest: CanonicalContentDigest;
}

const MAXIMUM_TRADES = 128;
const MAXIMUM_EXECUTIONS = 512;

function boundedCount(value: unknown, maximum: number, path: string): bigint | null {
  if (typeof value !== "string" || !/^(?:0|[1-9][0-9]*)$/.test(value)) return null;
  const parsed = BigInt(value);
  return parsed <= BigInt(maximum) ? parsed : null;
}

function selectedRows(
  target: TradeQueryEvidenceTarget,
  result: TradeQueryResult,
  semantics: readonly QueryRowSemantics[],
): readonly QueryRowSemantics[] | null {
  const filtered = applyTradeQueryFilters(semantics, result.normalizedQueryPlan.filters).included;
  if (target.kind === "result") return filtered;
  if (target.kind === "trade") {
    return semantics.filter((item) => item.row.semanticRoundTripKey === target.semanticRoundTripKey);
  }
  if (target.kind === "group" || target.kind === "metric") {
    const row = result.rows.find((item) => item.groupIdentity === target.groupIdentity);
    if (row === undefined || (target.kind === "metric" && !row.metrics.some((metric) => metric.metricKey === target.metricKey))) {
      return null;
    }
    return filtered.filter((item) =>
      tradeQueryGroupAssignment(item, result.normalizedQueryPlan.grouping).groupIdentity === target.groupIdentity);
  }
  const evidence = result.evidence.find((item) => item.evidenceDigest === target.evidenceDigest);
  if (evidence === undefined) return null;
  const keys = new Set(evidence.candidates.map((item) => item.semanticRoundTripKey));
  return semantics.filter((item) => keys.has(item.row.semanticRoundTripKey));
}

function toTrade(
  semantic: QueryRowSemantics,
  result: TradeQueryResult,
  includedRows: readonly QueryRowSemantics[],
): TradeQueryEvidenceTrade {
  const evidenceCandidates = result.evidence.flatMap((evidence) => evidence.candidates)
    .filter((candidate) => candidate.semanticRoundTripKey === semantic.row.semanticRoundTripKey);
  const included = includedRows.some((item) => item.row.semanticRoundTripKey === semantic.row.semanticRoundTripKey);
  const roles = new Set<TradeQueryEvidenceTrade["roles"][number]>();
  if (included) roles.add("included");
  for (const candidate of evidenceCandidates) roles.add(candidate.role);
  return Object.freeze({
    semanticRoundTripKey: semantic.row.semanticRoundTripKey,
    rowDigest: semantic.row.rowDigest,
    executionDigests: Object.freeze([...semantic.row.supportingExecutionDigests]),
    occurrenceKeys: Object.freeze([...semantic.row.supportingOccurrenceKeys]),
    groupIdentity: tradeQueryGroupAssignment(semantic, result.normalizedQueryPlan.grouping).groupIdentity,
    inclusionState: included ? "included" : "filter_excluded",
    roles: Object.freeze([...roles].sort(compareUnicodeCodePoints)),
    exclusionReasonCodes: Object.freeze(included ? [] : result.normalizedQueryPlan.filters
      .filter((filter) => applyTradeQueryFilters([semantic], [filter]).excluded.length === 1)
      .map((filter) => `ti_v3_query_filter_excluded_${filter.kind}`)
      .sort(compareUnicodeCodePoints)),
    limitationCodes: Object.freeze([...semantic.row.limitationCodes].sort(compareUnicodeCodePoints)),
  });
}

export function retrieveTradeQueryEvidence(args: Readonly<{
  readonly source: VerifiedTradeQueryDatasetSource;
  readonly partitionReceipt: AnalyticalPartitionReceipt;
  readonly result: unknown;
  readonly comparison?: Readonly<{ readonly comparison: unknown; readonly targetResult: unknown; readonly baselineResult: unknown }> | null;
  readonly request: TradeQueryEvidenceRetrievalRequest;
}>): { readonly ok: true; readonly value: TradeQueryEvidenceRetrieval } | {
  readonly ok: false; readonly error: AnalyticalContractFailure;
} {
  const maximumTrades = boundedCount(args.request.maximumTrades, MAXIMUM_TRADES, "$.request.maximumTrades");
  const maximumExecutions = boundedCount(args.request.maximumExecutions, MAXIMUM_EXECUTIONS, "$.request.maximumExecutions");
  if (maximumTrades === null || maximumExecutions === null) {
    return contractFailure("ti_v3_analytics_contract_oversized", "$.request.limits");
  }
  const gateway = openReadOnlyTradeQueryGateway(args.source, args.partitionReceipt);
  if (!gateway.ok) return gateway;
  const result = verifyTradeQueryResultShape(args.result, gateway.value.authority);
  if (!result.ok || !isVerifiedTradeQueryExecution(args.result)) {
    return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.result");
  }
  const comparison = args.comparison === undefined || args.comparison === null ? null : verifyTradeQueryComparison(
    args.comparison.comparison, args.comparison.targetResult, args.comparison.baselineResult, gateway.value.authority,
  );
  if (comparison !== null && !comparison.ok) return comparison;
  if (comparison !== null && comparison.value.targetResultDigest !== result.value.resultDigest && comparison.value.baselineResultDigest !== result.value.resultDigest) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.comparison");
  const dataset = gateway.value.readBoundedRows(result.value.normalizedQueryPlan);
  if (!dataset.ok) return dataset;
  const semantics = buildQueryRowSemantics(dataset.value.rows);
  const selected = selectedRows(args.request.target, result.value, semantics);
  if (selected === null) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.request.target");
  const ordered = [...selected].sort((left, right) =>
    compareUnicodeCodePoints(left.row.semanticRoundTripKey, right.row.semanticRoundTripKey));
  const bounded: QueryRowSemantics[] = [];
  let executionCount = BigInt("0");
  for (const item of ordered) {
    if (BigInt(bounded.length) >= maximumTrades || executionCount + BigInt(item.row.supportingExecutionDigests.length) > maximumExecutions) break;
    bounded.push(item);
    executionCount += BigInt(item.row.supportingExecutionDigests.length);
  }
  const included = applyTradeQueryFilters(semantics, result.value.normalizedQueryPlan.filters).included;
  const built = finalizeContentAddressedAuthority("trade_query_evidence_retrieval", {
    schemaVersion: TRADE_QUERY_EVIDENCE_RETRIEVAL_VERSION,
    retrievalKey: "ti_v3_deterministic_trade_query_evidence_retrieval",
    retrievalVersion: "v1",
    queryPlanDigest: result.value.normalizedQueryPlan.queryPlanDigest,
    resultDigest: result.value.resultDigest,
    comparisonDigest: comparison?.value.comparisonDigest ?? null,
    datasetReceiptDigest: result.value.normalizedQueryPlan.authority.datasetReceiptDigest,
    datasetDerivationDigest: result.value.normalizedQueryPlan.authority.datasetDerivationDigest,
    partitionDigest: result.value.normalizedQueryPlan.authority.partitionDigest,
    metricRegistryDigest: TRADE_QUERY_METRIC_REGISTRY.registryDigest,
    target: args.request.target,
    totalResolvedTradeCount: String(selected.length),
    trades: bounded.map((item) => toTrade(item, result.value, included)),
    sourceExclusionKeys: dataset.value.excludedCandidates.map((item) => item.candidateKey).sort(compareUnicodeCodePoints),
    limitationCodes: Object.freeze([
      ...result.value.limitationCodes,
      ...(bounded.length < ordered.length ? ["ti_v3_evidence_retrieval_bounded"] : []),
    ].sort(compareUnicodeCodePoints)),
  }, "retrievalDigest");
  return built.ok
    ? { ok: true, value: built.value as TradeQueryEvidenceRetrieval }
    : built;
}

export function verifyTradeQueryEvidenceRetrieval(
  input: unknown,
  args: Parameters<typeof retrieveTradeQueryEvidence>[0],
): { readonly ok: true; readonly value: TradeQueryEvidenceRetrieval } | {
  readonly ok: false; readonly error: AnalyticalContractFailure;
} {
  const rebuilt = retrieveTradeQueryEvidence(args);
  if (!rebuilt.ok) return rebuilt;
  const supplied = serializeCanonicalValue(input);
  const accepted = serializeCanonicalValue(rebuilt.value);
  return supplied.ok && accepted.ok && supplied.value.json === accepted.value.json
    ? rebuilt
    : contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.retrievalDigest");
}
