import { serializeCanonicalValue } from "../../../domain/canonical";
import type { CanonicalContentDigest } from "../../../domain/identity";
import {
  contractFailure,
  finalizeContentAddressedAuthority,
  validateClaimedDigest,
  validateContractRecord,
  type AnalyticalContractFailure,
} from "../../contracts";
import type { AnalyticalPartitionReceipt } from "../../dataset";
import { verifyTradeQueryResultShape } from "../contracts";
import { isVerifiedTradeQueryExecution } from "../execution/verified-execution";
import { openReadOnlyTradeQueryGateway, type VerifiedTradeQueryDatasetSource } from "../gateway";
import {
  searchSimilarTrades,
  verifySimilarTradeSearchPlan,
  type SimilarTradeSearchPlan,
  type SimilarTradeSearchResult,
} from "./similar-trade-search";
import {
  verifySimilarTradeSearchResult,
  verifySimilarTradeSearchResultShape,
} from "./similar-trade-result";

export const SIMILAR_TRADE_REPLAY_VERSION = "ti_v3_trade_query_similarity_replay_v1" as const;
export const SIMILAR_TRADE_REPLAY_STAGES = Object.freeze([
  "source_result_verification",
  "plan_reconstruction",
  "target_trade_resolution",
  "candidate_population",
  "normalized_filter_application",
  "policy_evaluation",
  "explanation_generation",
  "exact_match_classification",
  "near_miss_classification",
  "deterministic_ordering",
  "output_bounding",
  "summary_metric_calculation",
  "evidence_selection",
  "limitation_generation",
  "final_result_digest",
] as const);
export type SimilarTradeReplayStage = typeof SIMILAR_TRADE_REPLAY_STAGES[number] | "artifact_shape" | "replay_receipt";

export interface SimilarTradeSearchReplayArtifact {
  readonly schemaVersion: typeof SIMILAR_TRADE_REPLAY_VERSION;
  readonly replayPolicyKey: "ti_v3_deterministic_similarity_reconstruction";
  readonly replayPolicyVersion: "v1";
  readonly sourceResultDigest: CanonicalContentDigest;
  readonly searchPlan: SimilarTradeSearchPlan;
  readonly searchPlanDigest: CanonicalContentDigest;
  readonly similarityResult: SimilarTradeSearchResult;
  readonly similarityResultDigest: CanonicalContentDigest;
  readonly datasetReceiptDigest: CanonicalContentDigest;
  readonly datasetDerivationDigest: CanonicalContentDigest;
  readonly partitionDigest: CanonicalContentDigest;
  readonly verifiedStages: typeof SIMILAR_TRADE_REPLAY_STAGES;
  readonly replayReceiptDigest: CanonicalContentDigest;
}

export interface SimilarTradeReplayFailure {
  readonly code: "ti_v3_similarity_replay_mismatch";
  readonly stage: SimilarTradeReplayStage;
  readonly path: string;
}

function replayFailure(
  stage: SimilarTradeReplayStage,
  path: string,
): { readonly ok: false; readonly error: SimilarTradeReplayFailure } {
  return { ok: false, error: { code: "ti_v3_similarity_replay_mismatch", stage, path } };
}

function canonicalEqual(left: unknown, right: unknown): boolean {
  const leftValue = serializeCanonicalValue(left);
  const rightValue = serializeCanonicalValue(right);
  return leftValue.ok && rightValue.ok && leftValue.value.json === rightValue.value.json;
}

function mismatchStage(
  supplied: SimilarTradeSearchResult,
  rebuilt: SimilarTradeSearchResult,
): SimilarTradeReplayStage | null {
  if (supplied.targetTradeKey !== rebuilt.targetTradeKey) return "target_trade_resolution";
  if (supplied.candidateCount !== rebuilt.candidateCount) return "candidate_population";
  if (!canonicalEqual(supplied.normalizedFilters, rebuilt.normalizedFilters)) return "normalized_filter_application";
  if (!canonicalEqual(supplied.policies, rebuilt.policies)) return "policy_evaluation";
  const suppliedExplanations = [...supplied.matches, ...supplied.nearMisses].map((item) => item.explanations);
  const rebuiltExplanations = [...rebuilt.matches, ...rebuilt.nearMisses].map((item) => item.explanations);
  if (!canonicalEqual(suppliedExplanations, rebuiltExplanations)) return "explanation_generation";
  if (!canonicalEqual(supplied.matches.map((item) => item.kind), rebuilt.matches.map((item) => item.kind))) {
    return "exact_match_classification";
  }
  if (!canonicalEqual(supplied.nearMisses.map((item) => item.kind), rebuilt.nearMisses.map((item) => item.kind))) {
    return "near_miss_classification";
  }
  if (
    !canonicalEqual(
      supplied.matches.map((item) => item.semanticRoundTripKey),
      rebuilt.matches.map((item) => item.semanticRoundTripKey),
    ) ||
    !canonicalEqual(
      supplied.nearMisses.map((item) => item.semanticRoundTripKey),
      rebuilt.nearMisses.map((item) => item.semanticRoundTripKey),
    )
  ) return "deterministic_ordering";
  if (
    supplied.totalExactMatchCount !== rebuilt.totalExactMatchCount ||
    supplied.emittedExactMatchCount !== rebuilt.emittedExactMatchCount ||
    supplied.totalNearMissCount !== rebuilt.totalNearMissCount ||
    supplied.emittedNearMissCount !== rebuilt.emittedNearMissCount
  ) return "output_bounding";
  if (!canonicalEqual(supplied.summaryMetrics, rebuilt.summaryMetrics)) return "summary_metric_calculation";
  if (!canonicalEqual(supplied.evidenceReferences, rebuilt.evidenceReferences)) return "evidence_selection";
  if (!canonicalEqual(supplied.limitationCodes, rebuilt.limitationCodes)) return "limitation_generation";
  if (supplied.resultDigest !== rebuilt.resultDigest) return "final_result_digest";
  return canonicalEqual(supplied, rebuilt) ? null : "final_result_digest";
}

function shapeFailureStage(path: string): SimilarTradeReplayStage {
  if (path.includes(".matches") && path.includes("classification")) return "exact_match_classification";
  if (path.includes(".nearMisses") && path.includes("classification")) return "near_miss_classification";
  if (path.includes("targetTradeKey")) return "target_trade_resolution";
  if (path.includes("normalizedFilters")) return "normalized_filter_application";
  if (path.includes("policies")) return "policy_evaluation";
  if (path.includes("explanation")) return "explanation_generation";
  if (path.toLowerCase().includes("metric")) return "summary_metric_calculation";
  if (path.includes("evidence")) return "evidence_selection";
  if (path.includes("limitation")) return "limitation_generation";
  if (path.includes("ordering")) return "deterministic_ordering";
  if (path.includes("count")) return "output_bounding";
  if (path.includes("authority") || path.includes("sourceResult")) return "source_result_verification";
  return "final_result_digest";
}

export function buildSimilarTradeSearchReplayArtifact(args: Readonly<{
  readonly source: VerifiedTradeQueryDatasetSource;
  readonly partitionReceipt: AnalyticalPartitionReceipt;
  readonly sourceResult: unknown;
  readonly plan: unknown;
  readonly result: unknown;
}>): { readonly ok: true; readonly value: SimilarTradeSearchReplayArtifact } | {
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
  const result = verifySimilarTradeSearchResult({
    source: args.source,
    partitionReceipt: args.partitionReceipt,
    sourceResult: args.sourceResult,
    plan: plan.value,
    result: args.result,
  });
  if (!result.ok) return result;
  const built = finalizeContentAddressedAuthority("trade_query_similarity_replay", {
    schemaVersion: SIMILAR_TRADE_REPLAY_VERSION,
    replayPolicyKey: "ti_v3_deterministic_similarity_reconstruction",
    replayPolicyVersion: "v1",
    sourceResultDigest: sourceResult.value.resultDigest,
    searchPlan: plan.value,
    searchPlanDigest: plan.value.searchPlanDigest,
    similarityResult: result.value,
    similarityResultDigest: result.value.resultDigest,
    datasetReceiptDigest: gateway.value.authority.datasetReceipt.receiptDigest,
    datasetDerivationDigest: gateway.value.authority.datasetDerivationReceipt.derivationDigest,
    partitionDigest: gateway.value.authority.partitionReceipt.partitionDigest,
    verifiedStages: SIMILAR_TRADE_REPLAY_STAGES,
  }, "replayReceiptDigest");
  return built.ok
    ? { ok: true, value: built.value as SimilarTradeSearchReplayArtifact }
    : built;
}

export function replaySimilarTradeSearch(args: Readonly<{
  readonly source: VerifiedTradeQueryDatasetSource;
  readonly partitionReceipt: AnalyticalPartitionReceipt;
  readonly sourceResult: unknown;
  readonly replay: unknown;
}>): { readonly ok: true; readonly value: Readonly<{
  readonly replay: SimilarTradeSearchReplayArtifact;
  readonly result: SimilarTradeSearchResult;
}> } | { readonly ok: false; readonly error: SimilarTradeReplayFailure } {
  const record = validateContractRecord(args.replay, [
    "schemaVersion",
    "replayPolicyKey",
    "replayPolicyVersion",
    "sourceResultDigest",
    "searchPlan",
    "searchPlanDigest",
    "similarityResult",
    "similarityResultDigest",
    "datasetReceiptDigest",
    "datasetDerivationDigest",
    "partitionDigest",
    "verifiedStages",
    "replayReceiptDigest",
  ], []);
  if (
    !record.ok ||
    record.value.schemaVersion !== SIMILAR_TRADE_REPLAY_VERSION ||
    record.value.replayPolicyKey !== "ti_v3_deterministic_similarity_reconstruction" ||
    record.value.replayPolicyVersion !== "v1" ||
    !canonicalEqual(record.value.verifiedStages, SIMILAR_TRADE_REPLAY_STAGES)
  ) return replayFailure("artifact_shape", "$.replay");
  const gateway = openReadOnlyTradeQueryGateway(args.source, args.partitionReceipt);
  if (!gateway.ok) return replayFailure("source_result_verification", gateway.error.path);
  const sourceResult = verifyTradeQueryResultShape(args.sourceResult, gateway.value.authority);
  if (!sourceResult.ok || !isVerifiedTradeQueryExecution(args.sourceResult)) {
    return replayFailure("source_result_verification", "$.sourceResult");
  }
  if (
    record.value.sourceResultDigest !== sourceResult.value.resultDigest ||
    record.value.datasetReceiptDigest !== gateway.value.authority.datasetReceipt.receiptDigest ||
    record.value.datasetDerivationDigest !== gateway.value.authority.datasetDerivationReceipt.derivationDigest ||
    record.value.partitionDigest !== gateway.value.authority.partitionReceipt.partitionDigest
  ) return replayFailure("source_result_verification", "$.replay.authority");
  const plan = verifySimilarTradeSearchPlan(
    record.value.searchPlan,
    gateway.value.authority,
    sourceResult.value.resultDigest,
  );
  if (!plan.ok || record.value.searchPlanDigest !== plan.value.searchPlanDigest) {
    return replayFailure("plan_reconstruction", plan.ok ? "$.searchPlanDigest" : plan.error.path);
  }
  const shape = verifySimilarTradeSearchResultShape(
    record.value.similarityResult,
    plan.value,
    gateway.value.authority,
    sourceResult.value,
  );
  if (!shape.ok) {
    return replayFailure(shapeFailureStage(shape.error.path), shape.error.path);
  }
  const rebuilt = searchSimilarTrades({
    source: args.source,
    partitionReceipt: args.partitionReceipt,
    result: args.sourceResult,
    plan: plan.value,
  });
  if (!rebuilt.ok) {
    const stage: SimilarTradeReplayStage = rebuilt.error.path.includes("targetTradeKey")
      ? "target_trade_resolution"
      : "candidate_population";
    return replayFailure(stage, rebuilt.error.path);
  }
  const stage = mismatchStage(shape.value, rebuilt.value);
  if (stage !== null) return replayFailure(stage, `$.similarityResult.${stage}`);
  if (record.value.similarityResultDigest !== rebuilt.value.resultDigest) {
    return replayFailure("final_result_digest", "$.similarityResultDigest");
  }
  const receipt = validateClaimedDigest(
    record.value.replayReceiptDigest,
    "$.replayReceiptDigest",
    "trade_query_similarity_replay",
  );
  if (!receipt.ok) return replayFailure("replay_receipt", receipt.error.path);
  const reconstructed = buildSimilarTradeSearchReplayArtifact({
    source: args.source,
    partitionReceipt: args.partitionReceipt,
    sourceResult: args.sourceResult,
    plan: plan.value,
    result: rebuilt.value,
  });
  if (
    !reconstructed.ok ||
    reconstructed.value.replayReceiptDigest !== receipt.value ||
    !canonicalEqual(args.replay, reconstructed.value)
  ) return replayFailure("replay_receipt", "$.replayReceiptDigest");
  return {
    ok: true,
    value: Object.freeze({ replay: reconstructed.value, result: rebuilt.value }),
  };
}
