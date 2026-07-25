import { describe, expect, it } from "vitest";

import {
  GA1_B_PRESET_KEYS,
  SIMILAR_TRADE_DIMENSION_POLICY_COMPATIBILITY,
  buildSyntheticQueryFixture,
  buildSimilarTradeSearchPlan,
  compileGa1BPreset,
  executeGa1BPreset,
  executeTradeQuery,
  retrieveTradeQueryEvidence,
  searchSimilarTrades,
  TRADE_QUERY_METRIC_REGISTRY,
} from "../../analytics";

const identityPolicy = (dimension: "direction" | "previous_completed_outcome" | "symbol" | "account") => ({
  dimension,
  policyKey: "exact_identity" as const,
  policyVersion: "v1" as const,
});

function resultFor(count = 30) {
  const fixture = buildSyntheticQueryFixture(count);
  const result = executeTradeQuery({ source: fixture.source, partitionReceipt: fixture.partition, queryPlan: fixture.plan() });
  if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
  return { fixture, result: result.value };
}

describe("GA1-B deterministic evidence, similarity, and governed execution-only presets", () => {
  it("retrieves result, group, metric, evidence, and exact-trade references under accepted GA1-A authority", () => {
    const { fixture, result } = resultFor();
    const targets = [
      { kind: "result" as const },
      { kind: "group" as const, groupIdentity: result.rows[0].groupIdentity },
      { kind: "metric" as const, groupIdentity: result.rows[0].groupIdentity, metricKey: "net_pnl" },
      { kind: "evidence" as const, evidenceDigest: result.evidence[0].evidenceDigest },
      { kind: "trade" as const, semanticRoundTripKey: fixture.derived.datasetReceipt.rows[0].semanticRoundTripKey },
    ];
    for (const target of targets) {
      const retrieval = retrieveTradeQueryEvidence({ source: fixture.source, partitionReceipt: fixture.partition, result, request: { target, maximumTrades: "16", maximumExecutions: "32" } });
      expect(retrieval).toMatchObject({ ok: true });
      if (retrieval.ok) {
        expect(retrieval.value.retrievalDigest).toMatch(/^ti_v3:trade_query_evidence_retrieval:/);
        expect(retrieval.value.trades.length).toBeLessThanOrEqual(16);
        expect(Object.isFrozen(retrieval.value)).toBe(true);
      }
    }
  });

  it("rejects foreign results and max-plus-one evidence bounds without inventing references", () => {
    const { fixture, result } = resultFor();
    const foreign = JSON.parse(JSON.stringify(result));
    expect(retrieveTradeQueryEvidence({ source: fixture.source, partitionReceipt: fixture.partition, result: foreign, request: { target: { kind: "result" }, maximumTrades: "1", maximumExecutions: "1" } })).toMatchObject({ ok: false });
    expect(retrieveTradeQueryEvidence({ source: fixture.source, partitionReceipt: fixture.partition, result, request: { target: { kind: "result" }, maximumTrades: "129", maximumExecutions: "1" } })).toMatchObject({ ok: false });
  });

  it("keeps filter-excluded trade evidence disjoint from included roles and rejects fabricated comparisons", () => {
    const fixture = buildSyntheticQueryFixture();
    const gainOnly = executeTradeQuery({ source: fixture.source, partitionReceipt: fixture.partition, queryPlan: fixture.plan({ filters: [{ kind: "realized_outcome", values: ["gain"] }] }) });
    if (!gainOnly.ok) throw new Error(`${gainOnly.error.code}:${gainOnly.error.path}`);
    const losing = fixture.derived.datasetReceipt.rows.find((row) => row.netPnl.startsWith("-"));
    if (losing === undefined) throw new Error("missing synthetic losing trade");
    const excluded = retrieveTradeQueryEvidence({ source: fixture.source, partitionReceipt: fixture.partition, result: gainOnly.value, request: { target: { kind: "trade", semanticRoundTripKey: losing.semanticRoundTripKey }, maximumTrades: "1", maximumExecutions: "8" } });
    expect(excluded).toMatchObject({ ok: true });
    if (excluded.ok) {
      expect(excluded.value.trades[0].inclusionState).toBe("filter_excluded");
      expect(excluded.value.trades[0].roles).not.toContain("included");
      expect(excluded.value.trades[0].exclusionReasonCodes).toContain("ti_v3_query_filter_excluded_realized_outcome");
    }
    expect(retrieveTradeQueryEvidence({ source: fixture.source, partitionReceipt: fixture.partition, result: gainOnly.value, comparison: { comparison: { targetResultDigest: gainOnly.value.resultDigest, baselineResultDigest: gainOnly.value.resultDigest, comparisonDigest: "ti_v3:trade_query_comparison:v1:sha256:0000000000000000000000000000000000000000000000000000000000000000" }, targetResult: gainOnly.value, baselineResult: gainOnly.value }, request: { target: { kind: "result" }, maximumTrades: "1", maximumExecutions: "8" } })).toMatchObject({ ok: false });
  });

  it("finds exact matches, ordered near misses, unavailable dimensions, and stable no-match output", () => {
    const { fixture, result } = resultFor();
    const target = fixture.derived.datasetReceipt.rows[0].semanticRoundTripKey;
    const plan = buildSimilarTradeSearchPlan({
      targetTradeKey: target,
      dimensions: ["direction", "symbol", "entry_time"],
      policies: [
        identityPolicy("direction"),
        identityPolicy("symbol"),
        { dimension: "entry_time", policyKey: "normalized_entry_time_bucket", policyVersion: "v1", bucketMinutes: "60" },
      ],
      filters: [],
      includeNearMisses: true,
      maximumMatches: "8",
      maximumNearMisses: "8",
    }, fixture.authority, result.resultDigest); if (!plan.ok) throw new Error(`${plan.error.code}:${plan.error.path}`);
    const search = searchSimilarTrades({ source: fixture.source, partitionReceipt: fixture.partition, result, plan: plan.value });
    expect(search).toMatchObject({ ok: true });
    if (search.ok) {
      expect(search.value.matches).toEqual([...search.value.matches].sort((a, b) => a.semanticRoundTripKey.localeCompare(b.semanticRoundTripKey)));
      expect(search.value.nearMisses.every((item) => item.unmatchedDimensions.length > 0 || item.unavailableDimensions.length > 0)).toBe(true);
      expect([...search.value.matches, ...search.value.nearMisses].some((item) => item.semanticRoundTripKey === target)).toBe(false);
      for (const candidate of [...search.value.matches, ...search.value.nearMisses]) {
        expect(candidate.explanations).toHaveLength(3);
        expect(candidate.explanations.map((item) => item.dimension)).toEqual(plan.value.dimensions);
        for (const explanation of candidate.explanations) {
          expect(explanation.reasonCode).toMatch(/^ti_v3_similarity_/);
          expect(explanation.limitationCodes).toBeDefined();
          expect(explanation.targetAvailability).toMatch(/^(?:available|unavailable)$/);
          expect(explanation.candidateAvailability).toMatch(/^(?:available|unavailable)$/);
        }
      }
    }
    const emptyPlan = buildSimilarTradeSearchPlan({ targetTradeKey: target, dimensions: ["symbol"], policies: [identityPolicy("symbol")], filters: [{ kind: "entry_price_range", minimum: "999999", maximum: null }], includeNearMisses: true, maximumMatches: "8", maximumNearMisses: "8" }, fixture.authority, result.resultDigest); if (!emptyPlan.ok) throw new Error(`${emptyPlan.error.code}:${emptyPlan.error.path}`);
    const none = searchSimilarTrades({ source: fixture.source, partitionReceipt: fixture.partition, result, plan: emptyPlan.value });
    expect(none).toMatchObject({ ok: true });
    if (none.ok) expect(none.value.limitationCodes).toContain("ti_v3_similar_trade_zero_matches");
  });

  it("strictly validates one compatible plain data policy per requested dimension", () => {
    const { fixture, result } = resultFor();
    const targetTradeKey = fixture.derived.datasetReceipt.rows[0].semanticRoundTripKey;
    const build = (policies: unknown) => buildSimilarTradeSearchPlan({
      targetTradeKey,
      dimensions: ["direction", "symbol"],
      policies,
      filters: [],
      includeNearMisses: true,
      maximumMatches: "8",
      maximumNearMisses: "8",
    }, fixture.authority, result.resultDigest);
    expect(build([])).toMatchObject({ ok: false });
    expect(build([identityPolicy("direction")])).toMatchObject({ ok: false });
    expect(build([identityPolicy("direction"), identityPolicy("symbol"), identityPolicy("account")])).toMatchObject({ ok: false });
    expect(build([identityPolicy("direction"), identityPolicy("direction")])).toMatchObject({ ok: false });
    expect(build([identityPolicy("direction"), { ...identityPolicy("symbol"), extra: true }])).toMatchObject({ ok: false });
    expect(build([identityPolicy("direction"), { dimension: "symbol", policyKey: "exact_numeric", policyVersion: "v1" }])).toMatchObject({ ok: false });
    expect(build([identityPolicy("direction"), new (class {
      dimension = "symbol";
      policyKey = "exact_identity";
      policyVersion = "v1";
    })()])).toMatchObject({ ok: false });
    const accessorPolicy: Record<string, unknown> = { policyKey: "exact_identity", policyVersion: "v1" };
    Object.defineProperty(accessorPolicy, "dimension", { enumerable: true, get: () => "symbol" });
    expect(build([identityPolicy("direction"), accessorPolicy])).toMatchObject({ ok: false });
    expect(SIMILAR_TRADE_DIMENSION_POLICY_COMPATIBILITY.entry_time).toEqual(["normalized_entry_time_bucket"]);
    expect(SIMILAR_TRADE_DIMENSION_POLICY_COMPATIBILITY.symbol).toEqual(["exact_identity"]);
    const accepted = build([identityPolicy("direction"), identityPolicy("symbol")]);
    expect(accepted).toMatchObject({ ok: true });
    if (accepted.ok) {
      const legacyOrderingPlan = JSON.parse(JSON.stringify(accepted.value));
      legacyOrderingPlan.orderingPolicy = "unmatched_then_unavailable_then_trade_identity";
      expect(searchSimilarTrades({
        source: fixture.source,
        partitionReceipt: fixture.partition,
        result,
        plan: legacyOrderingPlan,
      })).toMatchObject({ ok: false });
    }
  });

  it("executes every matching policy with exact numeric, duration, and normalized time authority", () => {
    const { fixture, result } = resultFor();
    const targetTradeKey = fixture.derived.datasetReceipt.rows[0].semanticRoundTripKey;
    const cases = [
      { dimension: "direction", policy: identityPolicy("direction") },
      { dimension: "share_quantity", policy: { dimension: "share_quantity", policyKey: "exact_numeric", policyVersion: "v1" } },
      { dimension: "entry_price", policy: { dimension: "entry_price", policyKey: "canonical_bucket", policyVersion: "v1", boundaries: ["1/1", "1000000/1"] } },
      { dimension: "entry_notional", policy: { dimension: "entry_notional", policyKey: "inclusive_range", policyVersion: "v1", minimum: "0/1", maximum: "1000000000/1" } },
      { dimension: "sequence_in_session", policy: { dimension: "sequence_in_session", policyKey: "absolute_exact_distance", policyVersion: "v1", threshold: "100" } },
      { dimension: "holding_time", policy: { dimension: "holding_time", policyKey: "absolute_exact_distance", policyVersion: "v1", threshold: "86400000000000ns" } },
      { dimension: "entry_time", policy: { dimension: "entry_time", policyKey: "normalized_entry_time_bucket", policyVersion: "v1", bucketMinutes: "1440" } },
    ] as const;
    for (const item of cases) {
      const plan = buildSimilarTradeSearchPlan({
        targetTradeKey,
        dimensions: [item.dimension],
        policies: [item.policy],
        filters: [],
        includeNearMisses: true,
        maximumMatches: "128",
        maximumNearMisses: "128",
      }, fixture.authority, result.resultDigest);
      expect(plan).toMatchObject({ ok: true });
      if (!plan.ok) continue;
      const search = searchSimilarTrades({ source: fixture.source, partitionReceipt: fixture.partition, result, plan: plan.value });
      expect(search).toMatchObject({ ok: true });
      if (!search.ok) continue;
      const candidates = [...search.value.matches, ...search.value.nearMisses];
      expect(candidates.length).toBeGreaterThan(0);
      expect(candidates.every((candidate) => candidate.explanations.length === 1)).toBe(true);
      expect(candidates.every((candidate) => candidate.explanations[0].policyKey === item.policy.policyKey)).toBe(true);
      if (item.policy.policyKey === "canonical_bucket" || item.policy.policyKey === "normalized_entry_time_bucket") {
        expect(candidates.every((candidate) => candidate.explanations[0].targetBucketIdentity !== null)).toBe(true);
        expect(candidates.every((candidate) => candidate.explanations[0].candidateBucketIdentity !== null)).toBe(true);
      }
      if (item.policy.policyKey === "inclusive_range") {
        expect(candidates.every((candidate) => candidate.explanations[0].rangeMinimum !== null)).toBe(true);
        expect(candidates.every((candidate) => candidate.explanations[0].rangeMaximum !== null)).toBe(true);
      }
      if (item.policy.policyKey === "absolute_exact_distance") {
        expect(candidates.every((candidate) => candidate.explanations[0].exactDistance !== null)).toBe(true);
        expect(candidates.every((candidate) => candidate.explanations[0].threshold !== null)).toBe(true);
      }
    }
  });

  it("rejects forged runtime plans and orders near misses deterministically", () => {
    const { fixture, result } = resultFor();
    const targetTradeKey = fixture.derived.datasetReceipt.rows[0].semanticRoundTripKey;
    const plan = buildSimilarTradeSearchPlan({
      targetTradeKey,
      dimensions: ["direction", "symbol"],
      policies: [identityPolicy("direction"), identityPolicy("symbol")],
      filters: [],
      includeNearMisses: true,
      maximumMatches: "128",
      maximumNearMisses: "128",
    }, fixture.authority, result.resultDigest);
    if (!plan.ok) throw new Error(`${plan.error.code}:${plan.error.path}`);
    const forged = { ...plan.value, policies: [identityPolicy("direction"), identityPolicy("direction")] };
    expect(searchSimilarTrades({ source: fixture.source, partitionReceipt: fixture.partition, result, plan: forged })).toMatchObject({ ok: false });
    const search = searchSimilarTrades({ source: fixture.source, partitionReceipt: fixture.partition, result, plan: plan.value });
    expect(search).toMatchObject({ ok: true });
    if (search.ok) {
      const orderingKeys = search.value.nearMisses.map((candidate) =>
        `${candidate.unmatchedDimensions.length}:${candidate.unavailableDimensions.length}:${candidate.semanticRoundTripKey}`);
      expect(orderingKeys).toEqual([...orderingKeys].sort((left, right) => {
        const [leftUnmatched, leftUnavailable, ...leftKey] = left.split(":");
        const [rightUnmatched, rightUnavailable, ...rightKey] = right.split(":");
        return Number(leftUnmatched) - Number(rightUnmatched) ||
          Number(leftUnavailable) - Number(rightUnavailable) ||
          leftKey.join(":").localeCompare(rightKey.join(":"));
      }));
    }
  });

  it("compiles and executes all ten governed presets through GA1-A without duplicate query logic", () => {
    const fixture = buildSyntheticQueryFixture();
    for (const presetKey of GA1_B_PRESET_KEYS) {
      const compiled = compileGa1BPreset({ presetKey, authority: fixture.authority, baselineFilters: presetKey === "compare_periods" ? [{ kind: "weekday", values: ["monday"] }] : undefined });
      expect(compiled).toMatchObject({ ok: true });
      if (!compiled.ok) continue;
      expect(compiled.value.presetDigest).toMatch(/^ti_v3:trade_query_preset:/);
      const executed = executeGa1BPreset({ source: fixture.source, partitionReceipt: fixture.partition, preset: compiled.value });
      expect(executed).toMatchObject({ ok: true });
      if (presetKey === "compare_periods" && executed.ok) expect(executed.value.comparison).not.toBeNull();
    }
  });

  it("declares raw-row and derived-semantic dependencies literally for daily and repeat families", () => {
    const declaration = (metricKey: string) => TRADE_QUERY_METRIC_REGISTRY.entries.find((entry) => entry.metricKey === metricKey);
    expect(declaration("trading_day_count")).toMatchObject({ requiredFields: ["sessionDate"], requiredDerivedSemantics: [] });
    expect(declaration("average_daily_pnl")).toMatchObject({ requiredFields: ["sessionDate", "netPnl"], requiredDerivedSemantics: ["session_date_realized_pnl_aggregation"] });
    expect(declaration("average_attempts_per_symbol")).toMatchObject({ requiredFields: ["stableInstrumentKey"], requiredDerivedSemantics: [] });
    expect(declaration("repeat_attempt_trade_count")).toMatchObject({ requiredFields: ["stableInstrumentKey", "sessionDate", "firstEntryAt", "finalExitAt", "semanticRoundTripKey", "canonicalOwnerKey", "canonicalAccountKey", "currency", "timezone", "dateBasis"], requiredDerivedSemantics: ["canonical_owner_account_currency_session_symbol_entry_attempt_order"] });
  });

  it("is stable under source-row permutation for evidence and similar-trade artifacts", () => {
    const first = resultFor(30);
    const secondFixture = buildSyntheticQueryFixture(30, true);
    const secondResult = executeTradeQuery({ source: secondFixture.source, partitionReceipt: secondFixture.partition, queryPlan: secondFixture.plan() });
    if (!secondResult.ok) throw new Error(`${secondResult.error.code}:${secondResult.error.path}`);
    const firstEvidence = retrieveTradeQueryEvidence({ source: first.fixture.source, partitionReceipt: first.fixture.partition, result: first.result, request: { target: { kind: "result" }, maximumTrades: "16", maximumExecutions: "32" } });
    const secondEvidence = retrieveTradeQueryEvidence({ source: secondFixture.source, partitionReceipt: secondFixture.partition, result: secondResult.value, request: { target: { kind: "result" }, maximumTrades: "16", maximumExecutions: "32" } });
    expect(firstEvidence).toMatchObject({ ok: true }); expect(secondEvidence).toMatchObject({ ok: true });
    if (firstEvidence.ok && secondEvidence.ok) expect(firstEvidence.value.retrievalDigest).toBe(secondEvidence.value.retrievalDigest);
    const targetTradeKey = first.fixture.derived.datasetReceipt.rows[0].semanticRoundTripKey;
    const request = {
      targetTradeKey,
      dimensions: ["direction", "entry_time"] as const,
      policies: [
        identityPolicy("direction"),
        { dimension: "entry_time" as const, policyKey: "normalized_entry_time_bucket" as const, policyVersion: "v1" as const, bucketMinutes: "60" },
      ],
      filters: [],
      includeNearMisses: true,
      maximumMatches: "128",
      maximumNearMisses: "128",
    };
    const firstPlan = buildSimilarTradeSearchPlan(request, first.fixture.authority, first.result.resultDigest);
    const secondPlan = buildSimilarTradeSearchPlan(request, secondFixture.authority, secondResult.value.resultDigest);
    expect(firstPlan).toMatchObject({ ok: true }); expect(secondPlan).toMatchObject({ ok: true });
    if (firstPlan.ok && secondPlan.ok) {
      const firstSearch = searchSimilarTrades({ source: first.fixture.source, partitionReceipt: first.fixture.partition, result: first.result, plan: firstPlan.value });
      const secondSearch = searchSimilarTrades({ source: secondFixture.source, partitionReceipt: secondFixture.partition, result: secondResult.value, plan: secondPlan.value });
      expect(firstSearch).toMatchObject({ ok: true }); expect(secondSearch).toMatchObject({ ok: true });
      if (firstSearch.ok && secondSearch.ok) expect(firstSearch.value.resultDigest).toBe(secondSearch.value.resultDigest);
    }
  });
});
