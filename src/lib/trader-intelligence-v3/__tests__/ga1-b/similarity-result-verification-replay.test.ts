import { describe, expect, it } from "vitest";

import { createCanonicalContentIdentity } from "../../domain/identity";
import {
  buildSimilarTradeSearchPlan,
  buildSimilarTradeSearchReplayArtifact,
  buildSyntheticQueryFixture,
  executeTradeQuery,
  replaySimilarTradeSearch,
  searchSimilarTrades,
  verifySimilarTradeSearchResult,
  type SimilarTradeSearchPlan,
  type SimilarTradeSearchResult,
} from "../../analytics";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function redigestResult(value: SimilarTradeSearchResult): SimilarTradeSearchResult {
  const { resultDigest: _resultDigest, ...body } = value;
  void _resultDigest;
  const identity = createCanonicalContentIdentity("trade_query_similarity_result", "v1", body);
  if (!identity.ok) throw new Error(identity.error.code);
  return Object.freeze({
    ...(identity.value.canonicalValue as unknown as Omit<SimilarTradeSearchResult, "resultDigest">),
    resultDigest: identity.value.identifier,
  });
}

function setup(options: Readonly<{
  maximumMatches?: string;
  maximumNearMisses?: string;
  includeNearMisses?: boolean;
  filters?: readonly unknown[];
  dimensions?: readonly string[];
  policies?: readonly unknown[];
  unavailableShareQuantityIndices?: readonly number[];
}> = {}) {
  const fixture = buildSyntheticQueryFixture(
    30,
    false,
    { unavailableShareQuantityIndices: options.unavailableShareQuantityIndices },
  );
  const sourceResult = executeTradeQuery({
    source: fixture.source,
    partitionReceipt: fixture.partition,
    queryPlan: fixture.plan(),
  });
  if (!sourceResult.ok) throw new Error(`${sourceResult.error.code}:${sourceResult.error.path}`);
  const targetTradeKey = fixture.derived.datasetReceipt.rows[0].semanticRoundTripKey;
  const dimensions = options.dimensions ?? ["direction", "symbol", "entry_time"];
  const policies = options.policies ?? [
    { dimension: "direction", policyKey: "exact_identity", policyVersion: "v1" },
    { dimension: "symbol", policyKey: "exact_identity", policyVersion: "v1" },
    {
      dimension: "entry_time",
      policyKey: "normalized_entry_time_bucket",
      policyVersion: "v1",
      bucketMinutes: "60",
    },
  ];
  const plan = buildSimilarTradeSearchPlan({
    targetTradeKey,
    dimensions,
    policies,
    filters: options.filters ?? [],
    includeNearMisses: options.includeNearMisses ?? true,
    maximumMatches: options.maximumMatches ?? "128",
    maximumNearMisses: options.maximumNearMisses ?? "128",
  }, fixture.authority, sourceResult.value.resultDigest);
  if (!plan.ok) throw new Error(`${plan.error.code}:${plan.error.path}`);
  const result = searchSimilarTrades({
    source: fixture.source,
    partitionReceipt: fixture.partition,
    result: sourceResult.value,
    plan: plan.value,
  });
  if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
  return {
    fixture,
    sourceResult: sourceResult.value,
    plan: plan.value,
    result: result.value,
  };
}

function verify(state: ReturnType<typeof setup>, result: unknown = state.result, plan: unknown = state.plan) {
  return verifySimilarTradeSearchResult({
    source: state.fixture.source,
    partitionReceipt: state.fixture.partition,
    sourceResult: state.sourceResult,
    plan,
    result,
  });
}

describe("GA1-B similarity result verification and deterministic replay", () => {
  it("verifies exact matches, near misses, zero matches, bounded results, and replay", () => {
    const ordinary = setup();
    expect(ordinary.result.matches.length).toBeGreaterThan(0);
    expect(ordinary.result.nearMisses.length).toBeGreaterThan(0);
    expect(verify(ordinary)).toMatchObject({ ok: true });
    expect(ordinary.result.matches.every((item) =>
      item.explanations.every((explanation) => explanation.outcome === "matched"))).toBe(true);
    expect(ordinary.result.nearMisses.every((item) =>
      item.explanations.some((explanation) => explanation.outcome !== "matched"))).toBe(true);
    expect([...ordinary.result.matches, ...ordinary.result.nearMisses].some((item) =>
      item.semanticRoundTripKey === ordinary.plan.targetTradeKey)).toBe(false);
    expect(ordinary.result.candidateCount).toBe(
      (BigInt(ordinary.result.totalExactMatchCount) + BigInt(ordinary.result.totalNearMissCount)).toString(),
    );

    const bounded = setup({ maximumMatches: "1", maximumNearMisses: "1" });
    expect(verify(bounded)).toMatchObject({ ok: true });
    expect(bounded.result.emittedExactMatchCount).toBe("1");
    expect(bounded.result.emittedNearMissCount).toBe("1");
    expect(BigInt(bounded.result.totalExactMatchCount)).toBeGreaterThan(BigInt("1"));
    expect(BigInt(bounded.result.totalNearMissCount)).toBeGreaterThan(BigInt("1"));
    expect(bounded.result.limitationCodes).toContain("ti_v3_similar_trade_matches_bounded");
    expect(bounded.result.limitationCodes).toContain("ti_v3_similar_trade_near_misses_bounded");

    const zero = setup({
      dimensions: ["symbol"],
      policies: [{ dimension: "symbol", policyKey: "exact_identity", policyVersion: "v1" }],
      filters: [{ kind: "entry_price_range", minimum: "999999", maximum: null }],
    });
    expect(verify(zero)).toMatchObject({ ok: true });
    expect(zero.result.totalExactMatchCount).toBe("0");
    expect(zero.result.limitationCodes).toContain("ti_v3_similar_trade_zero_matches");

    const replay = buildSimilarTradeSearchReplayArtifact({
      source: ordinary.fixture.source,
      partitionReceipt: ordinary.fixture.partition,
      sourceResult: ordinary.sourceResult,
      plan: ordinary.plan,
      result: ordinary.result,
    });
    expect(replay).toMatchObject({ ok: true });
    if (replay.ok) {
      expect(replaySimilarTradeSearch({
        source: ordinary.fixture.source,
        partitionReceipt: ordinary.fixture.partition,
        sourceResult: ordinary.sourceResult,
        replay: replay.value,
      })).toMatchObject({ ok: true });
    }
  });

  it("preserves result and replay identity under source-row permutation", () => {
    const first = setup();
    const secondFixture = buildSyntheticQueryFixture(30, true);
    const secondSourceResult = executeTradeQuery({
      source: secondFixture.source,
      partitionReceipt: secondFixture.partition,
      queryPlan: secondFixture.plan(),
    });
    if (!secondSourceResult.ok) throw new Error(`${secondSourceResult.error.code}:${secondSourceResult.error.path}`);
    const secondPlan = buildSimilarTradeSearchPlan({
      targetTradeKey: first.plan.targetTradeKey,
      dimensions: first.plan.dimensions,
      policies: first.plan.policies,
      filters: first.plan.normalizedFilterPlan.filters,
      includeNearMisses: first.plan.includeNearMisses,
      maximumMatches: first.plan.maximumMatches,
      maximumNearMisses: first.plan.maximumNearMisses,
    }, secondFixture.authority, secondSourceResult.value.resultDigest);
    if (!secondPlan.ok) throw new Error(`${secondPlan.error.code}:${secondPlan.error.path}`);
    const secondResult = searchSimilarTrades({
      source: secondFixture.source,
      partitionReceipt: secondFixture.partition,
      result: secondSourceResult.value,
      plan: secondPlan.value,
    });
    if (!secondResult.ok) throw new Error(`${secondResult.error.code}:${secondResult.error.path}`);
    expect(secondResult.value.resultDigest).toBe(first.result.resultDigest);
    const firstReplay = buildSimilarTradeSearchReplayArtifact({
      source: first.fixture.source,
      partitionReceipt: first.fixture.partition,
      sourceResult: first.sourceResult,
      plan: first.plan,
      result: first.result,
    });
    const secondReplay = buildSimilarTradeSearchReplayArtifact({
      source: secondFixture.source,
      partitionReceipt: secondFixture.partition,
      sourceResult: secondSourceResult.value,
      plan: secondPlan.value,
      result: secondResult.value,
    });
    expect(firstReplay).toMatchObject({ ok: true });
    expect(secondReplay).toMatchObject({ ok: true });
    if (firstReplay.ok && secondReplay.ok) {
      expect(secondReplay.value.replayReceiptDigest).toBe(firstReplay.value.replayReceiptDigest);
    }
  });

  it("binds unavailable target, candidate, and exact-distance authority limitations", () => {
    const targetUnavailable = setup({
      dimensions: ["entry_price"],
      policies: [{
        dimension: "entry_price",
        policyKey: "absolute_exact_distance",
        policyVersion: "v1",
        threshold: "1/1",
      }],
      unavailableShareQuantityIndices: [0, 1],
    });
    expect(verify(targetUnavailable)).toMatchObject({ ok: true });
    expect(targetUnavailable.result.limitationCodes).toContain("ti_v3_similarity_target_dimension_unavailable");
    expect(targetUnavailable.result.limitationCodes).toContain("ti_v3_similarity_candidate_dimension_unavailable");
    expect(targetUnavailable.result.limitationCodes).toContain("ti_v3_similarity_exact_distance_unavailable");
    expect(targetUnavailable.result.nearMisses.some((item) =>
      item.explanations[0].targetAvailability === "unavailable")).toBe(true);
    expect(targetUnavailable.result.nearMisses.some((item) =>
      item.explanations[0].candidateAvailability === "unavailable")).toBe(true);
  });

  it("rejects plan, source-result, dataset, partition, and scope tampering", () => {
    const state = setup();
    const planMutators: Array<(plan: SimilarTradeSearchPlan) => void> = [
      (plan) => { (plan as { searchPlanDigest: string }).searchPlanDigest = state.sourceResult.resultDigest; },
      (plan) => { (plan as { sourceResultDigest: string }).sourceResultDigest = state.result.resultDigest; },
      (plan) => { (plan as { targetTradeKey: string }).targetTradeKey = state.result.matches[0].semanticRoundTripKey; },
      (plan) => { (plan.normalizedFilterPlan as unknown as { filters: unknown[] }).filters = [{ kind: "symbol", values: ["foreign"] }]; },
      (plan) => { (plan as unknown as { dimensions: string[] }).dimensions = ["symbol"]; },
      (plan) => { (plan as unknown as { policies: unknown[] }).policies[0] = { dimension: "direction", policyKey: "exact_numeric", policyVersion: "v1" }; },
      (plan) => { (plan as unknown as { policies: Array<{ policyVersion: string }> }).policies[0].policyVersion = "v2"; },
      (plan) => {
        (plan as unknown as { policies: unknown[] }).policies[2] = {
          dimension: "entry_time",
          policyKey: "normalized_entry_time_bucket",
          policyVersion: "v1",
          bucketMinutes: "30",
        };
      },
      (plan) => { (plan as { maximumMatches: string }).maximumMatches = "1"; },
      (plan) => { (plan as { includeNearMisses: boolean }).includeNearMisses = false; },
    ];
    for (const mutate of planMutators) {
      const plan = clone(state.plan);
      mutate(plan);
      expect(verify(state, state.result, plan)).toMatchObject({ ok: false });
    }
    const policyPlans = [
      setup({
        dimensions: ["entry_price"],
        policies: [{
          dimension: "entry_price",
          policyKey: "canonical_bucket",
          policyVersion: "v1",
          boundaries: ["1/1", "1000000/1"],
        }],
      }),
      setup({
        dimensions: ["entry_notional"],
        policies: [{
          dimension: "entry_notional",
          policyKey: "inclusive_range",
          policyVersion: "v1",
          minimum: "0/1",
          maximum: "1000000/1",
        }],
      }),
      setup({
        dimensions: ["sequence_in_session"],
        policies: [{
          dimension: "sequence_in_session",
          policyKey: "absolute_exact_distance",
          policyVersion: "v1",
          threshold: "1",
        }],
      }),
    ] as const;
    for (const policyState of policyPlans) {
      const plan = clone(policyState.plan) as unknown as {
        policies: Array<Record<string, unknown>>;
      };
      const policy = plan.policies[0];
      if (Array.isArray(policy.boundaries)) policy.boundaries[0] = "2/1";
      else if ("maximum" in policy) policy.maximum = "999999/1";
      else policy.threshold = "2";
      expect(verify(policyState, policyState.result, plan)).toMatchObject({ ok: false });
    }
    const foreignFixture = buildSyntheticQueryFixture(31);
    const foreignSourceResult = executeTradeQuery({
      source: foreignFixture.source,
      partitionReceipt: foreignFixture.partition,
      queryPlan: foreignFixture.plan(),
    });
    if (!foreignSourceResult.ok) throw new Error(`${foreignSourceResult.error.code}:${foreignSourceResult.error.path}`);
    expect(verifySimilarTradeSearchResult({
      source: state.fixture.source,
      partitionReceipt: state.fixture.partition,
      sourceResult: foreignSourceResult.value,
      plan: state.plan,
      result: state.result,
    })).toMatchObject({ ok: false });
    expect(verifySimilarTradeSearchResult({
      source: foreignFixture.source,
      partitionReceipt: foreignFixture.partition,
      sourceResult: state.sourceResult,
      plan: state.plan,
      result: state.result,
    })).toMatchObject({ ok: false });
    for (const key of ["ownerScope", "accountScope", "currency"] as const) {
      const partition = clone(state.fixture.partition) as unknown as Record<string, unknown>;
      partition[key] = key === "currency" ? "CAD" : ["foreign"];
      expect(verifySimilarTradeSearchResult({
        source: state.fixture.source,
        partitionReceipt: partition as unknown as typeof state.fixture.partition,
        sourceResult: state.sourceResult,
        plan: state.plan,
        result: state.result,
      })).toMatchObject({ ok: false });
    }
  });

  it("rejects result inventory, count, metric, evidence, limitation, and re-digest tampering", () => {
    const state = setup();
    expect(state.result.matches.length).toBeGreaterThan(1);
    expect(state.result.nearMisses.length).toBeGreaterThan(1);
    const mutateAndReject = (mutate: (result: SimilarTradeSearchResult) => void, redigest = false) => {
      const result = clone(state.result);
      mutate(result);
      expect(verify(state, redigest ? redigestResult(result) : result)).toMatchObject({ ok: false });
    };
    mutateAndReject((result) => { (result.matches as SimilarTradeSearchResult["matches"][number][]).reverse(); });
    mutateAndReject((result) => { (result.nearMisses as SimilarTradeSearchResult["nearMisses"][number][]).reverse(); });
    mutateAndReject((result) => { (result.matches as SimilarTradeSearchResult["matches"][number][]).pop(); });
    mutateAndReject((result) => { (result.matches as SimilarTradeSearchResult["matches"][number][]).push(clone(result.matches[0])); });
    mutateAndReject((result) => { (result.matches[0] as { semanticRoundTripKey: string }).semanticRoundTripKey = "query_trade_foreign"; });
    mutateAndReject((result) => { (result.matches[0] as { rowDigest: string }).rowDigest = result.nearMisses[0].rowDigest; });
    mutateAndReject((result) => {
      (result.matches[0] as unknown as { executionDigests: string[] }).executionDigests[0] =
        "ti_v3:canonical_execution:v1:sha256:0000000000000000000000000000000000000000000000000000000000000000";
    });
    mutateAndReject((result) => { (result.matches[0] as unknown as { occurrenceKeys: string[] }).occurrenceKeys[0] = result.nearMisses[0].occurrenceKeys[0]; });
    mutateAndReject((result) => { (result as { candidateCount: string }).candidateCount = "999"; });
    mutateAndReject((result) => { (result as { totalExactMatchCount: string }).totalExactMatchCount = "999"; });
    mutateAndReject((result) => { (result as { emittedExactMatchCount: string }).emittedExactMatchCount = "0"; });
    mutateAndReject((result) => { (result as { totalNearMissCount: string }).totalNearMissCount = "999"; });
    mutateAndReject((result) => { (result as { emittedNearMissCount: string }).emittedNearMissCount = "0"; });
    mutateAndReject((result) => { (result as { sourceResultDigest: string }).sourceResultDigest = result.resultDigest; });
    mutateAndReject((result) => {
      const metric = result.summaryMetrics[0] as { value: string };
      metric.value = (BigInt(metric.value) + BigInt("1")).toString();
    });
    mutateAndReject((result) => { (result.evidenceReferences[0] as { semanticRoundTripKey: string }).semanticRoundTripKey = "query_trade_foreign"; });
    mutateAndReject((result) => { (result as unknown as { limitationCodes: string[] }).limitationCodes = ["ti_v3_similar_trade_zero_matches"]; });
    mutateAndReject((result) => { (result as { resultDigest: string }).resultDigest = result.sourceResultDigest; });
    mutateAndReject((result) => { (result as { candidateCount: string }).candidateCount = "999"; }, true);
    const accessor = clone(state.result) as unknown as Record<string, unknown>;
    Object.defineProperty(accessor, "candidateCount", { enumerable: true, get: () => state.result.candidateCount });
    expect(verify(state, accessor)).toMatchObject({ ok: false });
    const polluted = Object.assign(Object.create({ polluted: true }), clone(state.result));
    expect(verify(state, polluted)).toMatchObject({ ok: false });
  });

  it("rejects every material explanation tamper", () => {
    const state = setup();
    const mutateAndReject = (mutate: (result: SimilarTradeSearchResult) => void) => {
      const result = clone(state.result);
      mutate(result);
      expect(verify(state, result)).toMatchObject({ ok: false });
    };
    mutateAndReject((result) => { (result.matches[0] as unknown as { explanations: unknown[] }).explanations.pop(); });
    mutateAndReject((result) => {
      const explanations = (result.matches[0] as unknown as { explanations: unknown[] }).explanations;
      explanations[1] = clone(explanations[0]);
    });
    mutateAndReject((result) => { (result.matches[0].explanations[0] as { dimension: string }).dimension = "symbol"; });
    mutateAndReject((result) => { (result.matches[0].explanations[0] as { policyKey: string }).policyKey = "exact_numeric"; });
    mutateAndReject((result) => { (result.matches[0].explanations[0] as { policyVersion: string }).policyVersion = "v2"; });
    mutateAndReject((result) => { (result.matches[0].explanations[0] as { targetValue: string }).targetValue = "foreign"; });
    mutateAndReject((result) => { (result.matches[0].explanations[0] as { candidateValue: string }).candidateValue = "foreign"; });
    mutateAndReject((result) => { (result.matches[0].explanations[0] as { targetAvailability: string }).targetAvailability = "unavailable"; });
    mutateAndReject((result) => { (result.matches[0].explanations[0] as { candidateAvailability: string }).candidateAvailability = "unavailable"; });
    mutateAndReject((result) => { (result.matches[0].explanations[2] as { targetBucketIdentity: string }).targetBucketIdentity = "foreign"; });
    mutateAndReject((result) => { (result.matches[0].explanations[2] as { candidateBucketIdentity: string }).candidateBucketIdentity = "foreign"; });
    mutateAndReject((result) => { (result.matches[0].explanations[0] as { relativeDistance: string }).relativeDistance = "1/1"; });
    mutateAndReject((result) => { (result.matches[0].explanations[0] as { outcome: string }).outcome = "unmatched"; });
    mutateAndReject((result) => { (result.matches[0].explanations[0] as { reasonCode: string }).reasonCode = "ti_v3_similarity_unmatched_exact_identity"; });
    mutateAndReject((result) => {
      (result.matches[0].explanations[0] as unknown as { limitationCodes: string[] }).limitationCodes =
        ["ti_v3_similarity_candidate_dimension_unavailable"];
    });
    mutateAndReject((result) => {
      const explanation = result.matches[0].explanations[0] as {
        targetAvailability: string;
        targetValue: string;
        outcome: string;
        reasonCode: string;
      };
      explanation.targetAvailability = "unavailable";
      explanation.targetValue = "invented";
      explanation.outcome = "unavailable";
      explanation.reasonCode = "ti_v3_similarity_unavailable_target";
    });

    const range = setup({
      dimensions: ["entry_notional"],
      policies: [{
        dimension: "entry_notional",
        policyKey: "inclusive_range",
        policyVersion: "v1",
        minimum: "0/1",
        maximum: "1000000/1",
      }],
    });
    const rangeResult = clone(range.result);
    (rangeResult.matches[0].explanations[0] as { rangeMaximum: string }).rangeMaximum = "999999/1";
    expect(verify(range, rangeResult)).toMatchObject({ ok: false });

    const distance = setup({
      dimensions: ["sequence_in_session"],
      policies: [{
        dimension: "sequence_in_session",
        policyKey: "absolute_exact_distance",
        policyVersion: "v1",
        threshold: "0",
      }],
    });
    const distanceResult = clone(distance.result);
    const candidate = distanceResult.nearMisses.find((item) => item.explanations[0].exactDistance !== null);
    if (candidate === undefined) throw new Error("missing distance candidate");
    (candidate.explanations[0] as { exactDistance: string }).exactDistance = "999";
    expect(verify(distance, distanceResult)).toMatchObject({ ok: false });
    const thresholdResult = clone(distance.result);
    (thresholdResult.nearMisses[0].explanations[0] as { threshold: string }).threshold = "1";
    expect(verify(distance, thresholdResult)).toMatchObject({ ok: false });
  });

  it("proves normalized dimension priority and exact-distance vector ordering", () => {
    const state = setup({
      dimensions: ["sequence_in_session"],
      policies: [{
        dimension: "sequence_in_session",
        policyKey: "absolute_exact_distance",
        policyVersion: "v1",
        threshold: "0",
      }],
    });
    expect(state.result.nearMisses.length).toBeGreaterThan(1);
    const distances = state.result.nearMisses.map((item) => BigInt(item.explanations[0].exactDistance ?? "-1"));
    expect(distances).toEqual([...distances].sort((left, right) => left < right ? -1 : left > right ? 1 : 0));
    const reordered = clone(state.result);
    const mutableNearMisses = reordered.nearMisses as SimilarTradeSearchResult["nearMisses"][number][];
    [mutableNearMisses[0], mutableNearMisses[1]] = [mutableNearMisses[1], mutableNearMisses[0]];
    expect(verify(state, reordered)).toMatchObject({ ok: false });

    const priority = setup({
      dimensions: ["symbol", "entry_notional"],
      policies: [
        { dimension: "symbol", policyKey: "exact_identity", policyVersion: "v1" },
        { dimension: "entry_notional", policyKey: "exact_numeric", policyVersion: "v1" },
      ],
    });
    const symbolMatched = priority.result.nearMisses.findIndex((item) =>
      item.explanations[0].outcome === "matched" && item.explanations[1].outcome === "unmatched");
    const symbolUnmatched = priority.result.nearMisses.findIndex((item) =>
      item.explanations[0].outcome === "unmatched" && item.explanations[1].outcome === "matched");
    expect(symbolMatched).toBeGreaterThanOrEqual(0);
    expect(symbolUnmatched).toBeGreaterThan(symbolMatched);
  });

  it("returns stable replay-stage diagnostics for transported tampering", () => {
    const state = setup();
    const artifact = buildSimilarTradeSearchReplayArtifact({
      source: state.fixture.source,
      partitionReceipt: state.fixture.partition,
      sourceResult: state.sourceResult,
      plan: state.plan,
      result: state.result,
    });
    if (!artifact.ok) throw new Error(`${artifact.error.code}:${artifact.error.path}`);
    const tampered = clone(artifact.value);
    (tampered.similarityResult.summaryMetrics[0] as { value: string }).value = "999";
    const replay = replaySimilarTradeSearch({
      source: state.fixture.source,
      partitionReceipt: state.fixture.partition,
      sourceResult: state.sourceResult,
      replay: tampered,
    });
    expect(replay).toMatchObject({
      ok: false,
      error: {
        code: "ti_v3_similarity_replay_mismatch",
        stage: "summary_metric_calculation",
      },
    });
  });

  it("reports exact classification stages for every classification-field tamper", () => {
    const state = setup();
    const artifact = buildSimilarTradeSearchReplayArtifact({
      source: state.fixture.source,
      partitionReceipt: state.fixture.partition,
      sourceResult: state.sourceResult,
      plan: state.plan,
      result: state.result,
    });
    if (!artifact.ok) throw new Error(`${artifact.error.code}:${artifact.error.path}`);
    const expectStage = (
      mutate: (result: SimilarTradeSearchResult) => void,
      stage: "exact_match_classification" | "near_miss_classification",
    ) => {
      const replay = clone(artifact.value);
      mutate(replay.similarityResult);
      expect(replaySimilarTradeSearch({
        source: state.fixture.source,
        partitionReceipt: state.fixture.partition,
        sourceResult: state.sourceResult,
        replay,
      })).toMatchObject({ ok: false, error: { stage } });
    };
    expectStage((result) => {
      (result.matches[0] as unknown as { kind: string }).kind = "near_miss";
    }, "exact_match_classification");
    expectStage((result) => {
      (result.matches[0] as unknown as { matchedDimensions: string[] }).matchedDimensions = [];
    }, "exact_match_classification");
    expectStage((result) => {
      (result.matches[0] as unknown as { unmatchedDimensions: string[] }).unmatchedDimensions = ["symbol"];
    }, "exact_match_classification");
    expectStage((result) => {
      (result.matches[0] as unknown as { unavailableDimensions: string[] }).unavailableDimensions = ["symbol"];
    }, "exact_match_classification");
    expectStage((result) => {
      (result.nearMisses[0] as unknown as { kind: string }).kind = "match";
    }, "near_miss_classification");
    expectStage((result) => {
      (result.nearMisses[0] as unknown as { matchedDimensions: string[] }).matchedDimensions = [];
    }, "near_miss_classification");
    expectStage((result) => {
      (result.nearMisses[0] as unknown as { unmatchedDimensions: string[] }).unmatchedDimensions = [];
    }, "near_miss_classification");
    expectStage((result) => {
      (result.nearMisses[0] as unknown as { unavailableDimensions: string[] }).unavailableDimensions = ["symbol"];
    }, "near_miss_classification");
  });
});
