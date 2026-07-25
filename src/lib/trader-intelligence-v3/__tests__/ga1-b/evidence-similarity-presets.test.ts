import { describe, expect, it } from "vitest";

import {
  GA1_B_PRESET_KEYS,
  buildSyntheticQueryFixture,
  compileGa1BPreset,
  executeGa1BPreset,
  executeTradeQuery,
  retrieveTradeQueryEvidence,
  searchSimilarTrades,
  TRADE_QUERY_METRIC_REGISTRY,
} from "../../analytics";

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

  it("finds exact matches, ordered near misses, unavailable dimensions, and stable no-match output", () => {
    const { fixture, result } = resultFor();
    const target = fixture.derived.datasetReceipt.rows[0].semanticRoundTripKey;
    const search = searchSimilarTrades({ source: fixture.source, partitionReceipt: fixture.partition, result, request: { targetTradeKey: target, dimensions: ["direction", "symbol", "entry_time"], filters: [], includeNearMisses: true, maximumMatches: "8", maximumNearMisses: "8" } });
    expect(search).toMatchObject({ ok: true });
    if (search.ok) {
      expect(search.value.matches).toEqual([...search.value.matches].sort((a, b) => a.semanticRoundTripKey.localeCompare(b.semanticRoundTripKey)));
      expect(search.value.nearMisses.every((item) => item.unmatchedDimensions.length > 0 || item.unavailableDimensions.length > 0)).toBe(true);
    }
    const none = searchSimilarTrades({ source: fixture.source, partitionReceipt: fixture.partition, result, request: { targetTradeKey: target, dimensions: ["symbol"], filters: [{ kind: "symbol", values: ["not-present"] }], includeNearMisses: true, maximumMatches: "8", maximumNearMisses: "8" } });
    expect(none).toMatchObject({ ok: true });
    if (none.ok) expect(none.value.limitationCodes).toContain("ti_v3_similar_trade_zero_matches");
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
    expect(declaration("repeat_attempt_trade_count")).toMatchObject({ requiredFields: ["stableInstrumentKey", "sessionDate", "firstEntryAt", "semanticRoundTripKey", "canonicalOwnerKey", "canonicalAccountKey", "currency"], requiredDerivedSemantics: ["canonical_owner_account_currency_session_symbol_entry_attempt_order"] });
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
  });
});
