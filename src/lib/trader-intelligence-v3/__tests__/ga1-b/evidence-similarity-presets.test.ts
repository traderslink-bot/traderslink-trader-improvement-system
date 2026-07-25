import { describe, expect, it } from "vitest";

import {
  GA1_B_PRESET_KEYS,
  SIMILAR_TRADE_DIMENSION_POLICY_COMPATIBILITY,
  buildSyntheticQueryFixture,
  buildSimilarTradeSearchPlan,
  compileGa1BPreset,
  executeGa1BPreset,
  verifyGa1BPreset,
  verifyGa1BPresetExecution,
  executeTradeQuery,
  retrieveTradeQueryEvidence,
  searchSimilarTrades,
  TRADE_QUERY_METRIC_REGISTRY,
} from "../../analytics";
import { tradeQueryGroupAssignment } from "../../analytics/query/grouping/grouping-engine";
import { buildQueryRowSemantics } from "../../analytics/query/execution/row-semantics";

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
  }, 30_000);

  it("rejects forged or re-digested preset and execution artifacts at runtime", () => {
    const fixture = buildSyntheticQueryFixture();
    const compiled = compileGa1BPreset({ presetKey: "compare_periods", authority: fixture.authority, baselineFilters: [{ kind: "weekday", values: ["monday"] }] });
    if (!compiled.ok) throw new Error(`${compiled.error.code}:${compiled.error.path}`);
    const forgedPlan = JSON.parse(JSON.stringify(compiled.value));
    forgedPlan.primaryPlan.limits.groupLimit = "1";
    expect(verifyGa1BPreset(forgedPlan, fixture.authority)).toMatchObject({ ok: false });
    expect(compileGa1BPreset({ presetKey: "compare_periods", authority: fixture.authority })).toMatchObject({ ok: false });
    expect(compileGa1BPreset({ presetKey: "analyze_after_loss_behavior", authority: fixture.authority, filters: [{ kind: "previous_completed_outcome", values: ["gain"] }] })).toMatchObject({ ok: false });
    const execution = executeGa1BPreset({ source: fixture.source, partitionReceipt: fixture.partition, preset: compiled.value });
    if (!execution.ok) throw new Error(`${execution.error.code}:${execution.error.path}`);
    expect(verifyGa1BPresetExecution({ source: fixture.source, partitionReceipt: fixture.partition, execution: execution.value })).toMatchObject({ ok: true });
    const altered = JSON.parse(JSON.stringify(execution.value));
    altered.candidateCount = "0";
    expect(verifyGa1BPresetExecution({ source: fixture.source, partitionReceipt: fixture.partition, execution: altered })).toMatchObject({ ok: false });
  });

  it("uses four stable bounded sequence buckets and rejects non-plain preset inputs", () => {
    const fixture = buildSyntheticQueryFixture(30);
    const compiled = compileGa1BPreset({ presetKey: "analyze_trade_sequence_performance", authority: fixture.authority });
    if (!compiled.ok) throw new Error(`${compiled.error.code}:${compiled.error.path}`);
    expect(compiled.value.primaryPlan.grouping).toEqual({ kind: "trade_sequence_bucket" });
    const executed = executeGa1BPreset({ source: fixture.source, partitionReceipt: fixture.partition, preset: compiled.value });
    if (!executed.ok) throw new Error(`${executed.error.code}:${executed.error.path}`);
    expect(executed.value.primaryResult.rows.map((row) => row.groupIdentity)).toEqual([
      "sequence_bucket:v1:first", "sequence_bucket:v1:second", "sequence_bucket:v1:third", "sequence_bucket:v1:fourth_or_later",
    ]);
    expect(executed.value.primaryResult.rows).toHaveLength(4);
    expect(compileGa1BPreset({ presetKey: "analyze_long_vs_short", authority: fixture.authority, unknown: true })).toMatchObject({ ok: false });
    const accessor: Record<string, unknown> = { authority: fixture.authority };
    Object.defineProperty(accessor, "presetKey", { enumerable: true, get: () => "analyze_long_vs_short" });
    expect(compileGa1BPreset(accessor)).toMatchObject({ ok: false });
    expect(compileGa1BPreset(new (class { presetKey = "analyze_long_vs_short"; authority = fixture.authority; })())).toMatchObject({ ok: false });
    const polluted = Object.create({ polluted: true }) as Record<string, unknown>; polluted.presetKey = "analyze_long_vs_short"; polluted.authority = fixture.authority;
    expect(compileGa1BPreset(polluted)).toMatchObject({ ok: false });
  });

  it("maps every verified sequence to the bounded v1 identities without fabricating empty buckets", () => {
    const fixture = buildSyntheticQueryFixture(100);
    const semantics = buildQueryRowSemantics(fixture.derived.datasetReceipt.rows);
    const identities = new Set<string>();
    for (const item of semantics) {
      const assignment = tradeQueryGroupAssignment(item, { kind: "trade_sequence_bucket" });
      identities.add(assignment.groupIdentity);
      if (item.sequenceInSession === BigInt("1")) expect(assignment.groupIdentity).toBe("sequence_bucket:v1:first");
      if (item.sequenceInSession === BigInt("2")) expect(assignment.groupIdentity).toBe("sequence_bucket:v1:second");
      if (item.sequenceInSession === BigInt("3")) expect(assignment.groupIdentity).toBe("sequence_bucket:v1:third");
      if (item.sequenceInSession >= BigInt("4")) expect(assignment.groupIdentity).toBe("sequence_bucket:v1:fourth_or_later");
    }
    expect(identities.size).toBeLessThanOrEqual(4);
    const compiled = compileGa1BPreset({ presetKey: "analyze_trade_sequence_performance", authority: fixture.authority });
    if (!compiled.ok) throw new Error(`${compiled.error.code}:${compiled.error.path}`);
    const first = executeGa1BPreset({ source: fixture.source, partitionReceipt: fixture.partition, preset: compiled.value });
    const reversed = buildSyntheticQueryFixture(100, true);
    const secondPlan = compileGa1BPreset({ presetKey: "analyze_trade_sequence_performance", authority: reversed.authority });
    if (!first.ok || !secondPlan.ok) throw new Error("sequence preset setup failed");
    const second = executeGa1BPreset({ source: reversed.source, partitionReceipt: reversed.partition, preset: secondPlan.value });
    expect(second).toMatchObject({ ok: true });
    if (second.ok) {
      expect(second.value.primaryResultDigest).toBe(first.value.primaryResultDigest);
      expect(second.value.executionResultDigest).toBe(first.value.executionResultDigest);
      expect(second.value.primaryResult.rows.map((row) => row.groupIdentity)).toEqual(first.value.primaryResult.rows.map((row) => row.groupIdentity));
    }
  });

  it("maps verified one-based repeat attempts to four bounded v1 identities", () => {
    const fixture = buildSyntheticQueryFixture(100);
    const semantics = buildQueryRowSemantics(fixture.derived.datasetReceipt.rows);
    const identities = new Set<string>();
    for (const item of semantics) {
      const assignment = tradeQueryGroupAssignment(item, { kind: "repeat_attempt_bucket" });
      identities.add(assignment.groupIdentity);
      if (item.repeatAttempt === BigInt("1")) expect(assignment.groupIdentity).toBe("repeat_attempt_bucket:v1:first");
      if (item.repeatAttempt === BigInt("2")) expect(assignment.groupIdentity).toBe("repeat_attempt_bucket:v1:second");
      if (item.repeatAttempt === BigInt("3")) expect(assignment.groupIdentity).toBe("repeat_attempt_bucket:v1:third");
      if (item.repeatAttempt >= BigInt("4")) expect(assignment.groupIdentity).toBe("repeat_attempt_bucket:v1:fourth_or_later");
    }
    expect(identities.size).toBeLessThanOrEqual(4);
    const generic = executeTradeQuery({ source: fixture.source, partitionReceipt: fixture.partition, queryPlan: fixture.plan({ grouping: { kind: "repeat_attempt" } }) });
    expect(generic).toMatchObject({ ok: true });
    const compiled = compileGa1BPreset({ presetKey: "analyze_ticker_repeat_attempts", authority: fixture.authority });
    if (!compiled.ok) throw new Error(`${compiled.error.code}:${compiled.error.path}`);
    expect(compiled.value.primaryPlan.grouping).toEqual({ kind: "repeat_attempt_bucket" });
    const first = executeGa1BPreset({ source: fixture.source, partitionReceipt: fixture.partition, preset: compiled.value });
    const reversed = buildSyntheticQueryFixture(100, true);
    const secondPlan = compileGa1BPreset({ presetKey: "analyze_ticker_repeat_attempts", authority: reversed.authority });
    if (!first.ok || !secondPlan.ok) throw new Error("repeat preset setup failed");
    const second = executeGa1BPreset({ source: reversed.source, partitionReceipt: reversed.partition, preset: secondPlan.value });
    expect(second).toMatchObject({ ok: true });
    if (second.ok) {
      expect(second.value.primaryResultDigest).toBe(first.value.primaryResultDigest);
      expect(second.value.executionResultDigest).toBe(first.value.executionResultDigest);
      expect(second.value.primaryResult.rows.map((row) => row.groupIdentity)).toEqual(first.value.primaryResult.rows.map((row) => row.groupIdentity));
    }
  }, 30_000);

  it("rejects every material preset and comparison execution artifact tamper at runtime", () => {
    const fixture = buildSyntheticQueryFixture();
    const compiled = compileGa1BPreset({ presetKey: "compare_periods", authority: fixture.authority, baselineFilters: [{ kind: "weekday", values: ["monday"] }] });
    if (!compiled.ok) throw new Error(`${compiled.error.code}:${compiled.error.path}`);
    const rejectPreset = (mutate: (value: Record<string, unknown>) => void) => { const value = JSON.parse(JSON.stringify(compiled.value)) as Record<string, unknown>; mutate(value); expect(verifyGa1BPreset(value, fixture.authority)).toMatchObject({ ok: false }); };
    for (const key of ["presetDigest", "minimumSample", "unavailablePolicy", "evidencePolicy", "counterexamplePolicy", "outlierPolicy", "wordingPolicy"] as const) rejectPreset((value) => { value[key] = "tampered"; });
    rejectPreset((value) => { ((value.primaryPlan as Record<string, unknown>).limits as Record<string, unknown>).groupLimit = "1"; });
    rejectPreset((value) => { ((value.baselinePlan as Record<string, unknown>).limits as Record<string, unknown>).groupLimit = "1"; });
    rejectPreset((value) => { value.baselinePlan = null; });
    rejectPreset((value) => { value.baselinePlan = value.primaryPlan; });
    rejectPreset((value) => { value.extra = true; });
    const execution = executeGa1BPreset({ source: fixture.source, partitionReceipt: fixture.partition, preset: compiled.value });
    if (!execution.ok) throw new Error(`${execution.error.code}:${execution.error.path}`);
    const rejectExecution = (mutate: (value: Record<string, unknown>) => void) => { const value = JSON.parse(JSON.stringify(execution.value)) as Record<string, unknown>; mutate(value); expect(verifyGa1BPresetExecution({ source: fixture.source, partitionReceipt: fixture.partition, execution: value })).toMatchObject({ ok: false }); };
    for (const key of ["executionResultDigest", "primaryPlanDigest", "primaryResultDigest", "baselinePlanDigest", "baselineResultDigest", "comparisonDigest", "datasetReceiptDigest", "datasetDerivationDigest", "partitionDigest", "currency", "candidateCount", "includedCount", "excludedCount"] as const) rejectExecution((value) => { value[key] = "tampered"; });
    rejectExecution((value) => { value.primaryResult = value.baselineResult; });
    rejectExecution((value) => { const primary = value.primaryResult; value.primaryResult = value.baselineResult; value.baselineResult = primary; });
    rejectExecution((value) => { (value.comparison as Record<string, unknown>).metrics = []; });
    rejectExecution((value) => { value.evidenceDigests = ["ti_v3:trade_query_evidence:v1:sha256:0000000000000000000000000000000000000000000000000000000000000000"]; });
    rejectExecution((value) => { value.limitationCodes = ["ti_v3_tampered"]; });
    rejectExecution((value) => { value.ownerScope = []; });
    rejectExecution((value) => { value.accountScope = []; });
    rejectExecution((value) => { value.extra = true; });
  }, 30_000);

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
