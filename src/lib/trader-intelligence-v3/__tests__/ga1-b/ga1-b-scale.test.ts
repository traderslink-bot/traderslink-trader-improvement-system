import { describe, expect, it } from "vitest";

import {
  buildSyntheticQueryFixture,
  buildSimilarTradeSearchPlan,
  GA1_B_PRESET_KEYS,
  compileGa1BPreset,
  executeGa1BPreset,
  executeTradeQuery,
  retrieveTradeQueryEvidence,
  searchSimilarTrades,
} from "../../analytics";

const enabled = process.env.TI_V3_GA1_B_SCALE_PROOF === "1";

describe.skipIf(!enabled)("GA1-B fixed-seed 10,000-row scale proof", () => {
  it("executes bounded evidence, similarity, and all governed presets deterministically", () => {
    const fixture = buildSyntheticQueryFixture(10_000);
    const aggregate = executeTradeQuery({ source: fixture.source, partitionReceipt: fixture.partition, queryPlan: fixture.plan() });
    expect(aggregate).toMatchObject({ ok: true });
    if (!aggregate.ok) return;
    const evidence = retrieveTradeQueryEvidence({ source: fixture.source, partitionReceipt: fixture.partition, result: aggregate.value, request: { target: { kind: "result" }, maximumTrades: "128", maximumExecutions: "512" } });
    expect(evidence).toMatchObject({ ok: true });
    const searchPlan = buildSimilarTradeSearchPlan({
      targetTradeKey: fixture.derived.datasetReceipt.rows[0].semanticRoundTripKey,
      dimensions: ["direction", "symbol"],
      policies: [
        { dimension: "direction", policyKey: "exact_identity", policyVersion: "v1" },
        { dimension: "symbol", policyKey: "exact_identity", policyVersion: "v1" },
      ],
      filters: [],
      includeNearMisses: true,
      maximumMatches: "128",
      maximumNearMisses: "128",
    }, fixture.authority, aggregate.value.resultDigest);
    expect(searchPlan).toMatchObject({ ok: true });
    if (!searchPlan.ok) return;
    const search = searchSimilarTrades({ source: fixture.source, partitionReceipt: fixture.partition, result: aggregate.value, plan: searchPlan.value });
    expect(search).toMatchObject({ ok: true });
    for (const presetKey of GA1_B_PRESET_KEYS) {
      const compiled = compileGa1BPreset({ presetKey, authority: fixture.authority, baselineFilters: presetKey === "compare_periods" ? [{ kind: "weekday", values: ["monday"] }] : undefined });
      if (!compiled.ok) throw new Error(`preset=${presetKey};stage=compile;code=${compiled.error.code};path=${compiled.error.path}`);
      const executed = executeGa1BPreset({ source: fixture.source, partitionReceipt: fixture.partition, preset: compiled.value });
      if (!executed.ok) throw new Error(`preset=${presetKey};stage=execute;code=${executed.error.code};path=${executed.error.path}`);
      process.stdout.write(`GA1-B scale preset complete; preset=${presetKey};stage=execute\n`);
    }
  }, 120_000);
});
