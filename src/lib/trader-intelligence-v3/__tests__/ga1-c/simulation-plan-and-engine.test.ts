import { describe, expect, it } from "vitest";

import {
  buildCounterfactualSimulationPlan,
  buildSyntheticQueryFixture,
  compileDirectionOnlyPreset,
  compileMaximumTradesPerDayPreset,
  compileStopAfterConsecutiveLossesPreset,
  COUNTERFACTUAL_SIMULATION_PLAN_VERSION,
  COUNTERFACTUAL_SIMULATION_POLICIES,
  COUNTERFACTUAL_SIMULATION_SEMANTIC_VERSION,
  executeCounterfactualSimulation,
  executeTradeQuery,
  verifyCounterfactualSimulationPlan,
} from "../../analytics";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function limits() {
  return {
    sourceRowLimit: "10000",
    affectedTradeLimit: "10000",
    sessionSummaryLimit: "2000",
    evidenceTradeLimit: "512",
    diagnosticLimit: "128",
  } as const;
}

function plan(
  sourceQueryPlan: unknown,
  rules: readonly unknown[],
) {
  return {
    schemaVersion: COUNTERFACTUAL_SIMULATION_PLAN_VERSION,
    semanticVersion: COUNTERFACTUAL_SIMULATION_SEMANTIC_VERSION,
    sourceQueryPlan,
    rules,
    policies: COUNTERFACTUAL_SIMULATION_POLICIES,
    limits: limits(),
  };
}

function verifiedSource(count = 30, reverseRows = false) {
  const fixture = buildSyntheticQueryFixture(count, reverseRows);
  const sourceQueryPlan = fixture.plan({
    grouping: { kind: "aggregate" },
    metrics: [
      "candidate_count",
      "included_count",
      "excluded_count",
      "win_count",
      "loss_count",
      "flat_count",
      "net_pnl",
      "average_pnl",
      "median_pnl",
      "expectancy",
      "win_rate",
    ],
  });
  const result = executeTradeQuery({
    source: fixture.source,
    partitionReceipt: fixture.partition,
    queryPlan: sourceQueryPlan,
  });
  if (!result.ok) {
    throw new Error(`${result.error.code}:${result.error.path}`);
  }
  return { fixture, sourceQueryPlan, sourceQueryResult: result.value };
}

describe("GA1-C counterfactual plan contract", () => {
  it("normalizes governed rules by precedence and verifies its digest", () => {
    const { fixture, sourceQueryPlan } = verifiedSource();
    const built = buildCounterfactualSimulationPlan(plan(sourceQueryPlan, [
      {
        ruleId: "maximum_trades",
        kind: "maximum_trades_per_day",
        precedence: "2",
        action: "exclude_trade",
        maximumTrades: "3",
        countPolicy: "executed_simulated_entries_only_v1",
      },
      {
        ruleId: "long_only",
        kind: "direction_only",
        precedence: "1",
        action: "exclude_trade",
        allowedDirection: "long",
      },
    ]), fixture.authority);
    expect(built, JSON.stringify(built)).toMatchObject({ ok: true });
    if (!built.ok) return;
    expect(built.value.rules.map((rule) => rule.ruleId)).toEqual([
      "long_only",
      "maximum_trades",
    ]);
    expect(Object.isFrozen(built.value)).toBe(true);
    expect(
      verifyCounterfactualSimulationPlan(
        clone(built.value),
        fixture.authority,
      ),
    ).toMatchObject({
      ok: true,
      value: { planDigest: built.value.planDigest },
    });
  });

  it("rejects unknown fields, duplicate identity, contradictions, accessors, and redigested-looking tampering", () => {
    const { fixture, sourceQueryPlan } = verifiedSource();
    const longOnly = {
      ruleId: "long_only",
      kind: "direction_only",
      precedence: "1",
      action: "exclude_trade",
      allowedDirection: "long",
    } as const;
    expect(buildCounterfactualSimulationPlan({
      ...plan(sourceQueryPlan, [longOnly]),
      rawSql: "select *",
    }, fixture.authority)).toMatchObject({ ok: false });
    expect(buildCounterfactualSimulationPlan(plan(sourceQueryPlan, [
      longOnly,
      { ...longOnly, precedence: "2" },
    ]), fixture.authority)).toMatchObject({
      ok: false,
      error: { code: "ti_v3_analytics_contract_duplicate_identity" },
    });
    expect(buildCounterfactualSimulationPlan(plan(sourceQueryPlan, [
      longOnly,
      {
        ...longOnly,
        ruleId: "short_only",
        precedence: "2",
        allowedDirection: "short",
      },
    ]), fixture.authority)).toMatchObject({ ok: false });
    const accessor = Object.create(null) as Record<string, unknown>;
    const valid = plan(sourceQueryPlan, [longOnly]);
    for (const [key, value] of Object.entries(valid)) {
      if (key === "rules") continue;
      Object.defineProperty(accessor, key, {
        enumerable: true,
        value,
      });
    }
    Object.defineProperty(accessor, "rules", {
      enumerable: true,
      get: () => [longOnly],
    });
    expect(
      buildCounterfactualSimulationPlan(accessor, fixture.authority),
    ).toMatchObject({ ok: false });
    const built = buildCounterfactualSimulationPlan(
      valid,
      fixture.authority,
    );
    if (!built.ok) throw new Error(built.error.code);
    expect(verifyCounterfactualSimulationPlan({
      ...built.value,
      rules: [{
        ...built.value.rules[0],
        allowedDirection: "short",
      }],
      planDigest: built.value.planDigest,
    }, fixture.authority)).toMatchObject({
      ok: false,
      error: { code: "ti_v3_analytics_contract_digest_mismatch" },
    });
  });
});

describe("GA1-C generic chronological simulation skeleton", () => {
  it("compiles three governed representative presets over the generic plan", () => {
    const source = verifiedSource();
    const presets = [
      compileStopAfterConsecutiveLossesPreset(
        source.sourceQueryPlan,
        source.fixture.authority,
        { consecutiveLossThreshold: "2" },
      ),
      compileMaximumTradesPerDayPreset(
        source.sourceQueryPlan,
        source.fixture.authority,
        { maximumTrades: "3" },
      ),
      compileDirectionOnlyPreset(
        source.sourceQueryPlan,
        source.fixture.authority,
        { allowedDirection: "long" },
      ),
    ];
    for (const preset of presets) {
      expect(preset, JSON.stringify(preset)).toMatchObject({ ok: true });
      if (!preset.ok) continue;
      expect(preset.value.preset.compiledPlanDigest)
        .toBe(preset.value.plan.planDigest);
      expect(preset.value.preset.inSampleWarning)
        .toBe("historical_result_does_not_prove_future_edge_v1");
    }
    expect(compileDirectionOnlyPreset(
      source.sourceQueryPlan,
      source.fixture.authority,
      { allowedDirection: "long", unknown: true },
    )).toMatchObject({ ok: false });
  });

  it("applies direction exclusion and maximum executed-entry count with declared precedence", () => {
    const source = verifiedSource(30);
    const result = executeCounterfactualSimulation({
      source: source.fixture.source,
      partitionReceipt: source.fixture.partition,
      sourceQueryResult: source.sourceQueryResult,
      simulationPlan: plan(source.sourceQueryPlan, [
        {
          ruleId: "long_only",
          kind: "direction_only",
          precedence: "1",
          action: "exclude_trade",
          allowedDirection: "long",
        },
        {
          ruleId: "one_trade",
          kind: "maximum_trades_per_day",
          precedence: "2",
          action: "exclude_trade",
          maximumTrades: "1",
          countPolicy: "executed_simulated_entries_only_v1",
        },
      ]),
    });
    expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
    if (!result.ok) return;
    const firstSession = result.value.tradeOutcomes.filter((outcome) =>
      ["query_trade_00001", "query_trade_00008", "query_trade_00015"]
        .includes(outcome.sourceTradeKey));
    expect(firstSession.map((outcome) => [
      outcome.sourceTradeKey,
      outcome.classification,
      outcome.responsibleRuleId,
    ])).toEqual([
      ["query_trade_00001", "skipped_by_rule", "long_only"],
      ["query_trade_00008", "executed_unchanged", null],
      ["query_trade_00015", "skipped_by_rule", "one_trade"],
    ]);
    expect(result.value.resizedCount).toBe("0");
    expect(result.value.historicalBasis)
      .toBe("historical_in_sample_counterfactual_v1");
    expect(result.value.limitationCodes).toContain(
      "ti_v3_simulation_historical_in_sample_not_future_edge",
    );
    expect(result.value.effect).toBe("harmed");
    expect(result.value.netPnlDifference.startsWith("-")).toBe(true);
  });

  it("uses only completed realized losses strictly before a later entry", () => {
    const source = verifiedSource(30);
    const result = executeCounterfactualSimulation({
      source: source.fixture.source,
      partitionReceipt: source.fixture.partition,
      sourceQueryResult: source.sourceQueryResult,
      simulationPlan: plan(source.sourceQueryPlan, [{
        ruleId: "stop_after_one_loss",
        kind: "stop_after_consecutive_losses",
        precedence: "1",
        action: "stop_session",
        consecutiveLossThreshold: "1",
        flatTradePolicy: "flat_resets_loss_streak_v1",
      }]),
    });
    expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
    if (!result.ok) return;
    const trigger = result.value.tradeOutcomes.find(
      (outcome) => outcome.sourceTradeKey === "query_trade_00001",
    );
    const later = result.value.tradeOutcomes.find(
      (outcome) => outcome.sourceTradeKey === "query_trade_00008",
    );
    expect(trigger).toMatchObject({
      classification: "executed_unchanged",
      sessionStateBefore: { completedLossStreak: "0" },
      sessionStateAfter: { completedLossStreak: "0" },
    });
    expect(later).toMatchObject({
      classification: "skipped_session_stopped",
      responsibleRuleId: "stop_after_one_loss",
      sessionStateBefore: {
        completedLossStreak: "1",
        stoppedByRuleId: "stop_after_one_loss",
      },
    });
  });

  it("is deterministic under source-row permutation and reconciles exact P/L", () => {
    const forward = verifiedSource(30, false);
    const reverse = verifiedSource(30, true);
    const rulePlan = (sourceQueryPlan: unknown) => plan(sourceQueryPlan, [{
      ruleId: "maximum_two",
      kind: "maximum_trades_per_day",
      precedence: "1",
      action: "exclude_trade",
      maximumTrades: "2",
      countPolicy: "executed_simulated_entries_only_v1",
    }]);
    const first = executeCounterfactualSimulation({
      source: forward.fixture.source,
      partitionReceipt: forward.fixture.partition,
      sourceQueryResult: forward.sourceQueryResult,
      simulationPlan: rulePlan(forward.sourceQueryPlan),
    });
    const second = executeCounterfactualSimulation({
      source: reverse.fixture.source,
      partitionReceipt: reverse.fixture.partition,
      sourceQueryResult: reverse.sourceQueryResult,
      simulationPlan: rulePlan(reverse.sourceQueryPlan),
    });
    expect(first).toMatchObject({ ok: true });
    expect(second).toMatchObject({ ok: true });
    if (!first.ok || !second.ok) return;
    expect(second.value.resultDigest).toBe(first.value.resultDigest);
    expect(second.value.netPnlDifference).toBe(
      first.value.netPnlDifference,
    );
    const simulatedMetric = first.value.simulatedMetrics.find(
      (metric) => metric.metricKey === "net_pnl",
    );
    expect(simulatedMetric).toMatchObject({
      kind: "exact_decimal",
      value: first.value.simulatedNetPnl,
    });
  });

  it("rejects a structurally cloned or foreign primary query result", () => {
    const source = verifiedSource(10);
    const request = {
      source: source.fixture.source,
      partitionReceipt: source.fixture.partition,
      simulationPlan: plan(source.sourceQueryPlan, [{
        ruleId: "long_only",
        kind: "direction_only",
        precedence: "1",
        action: "exclude_trade",
        allowedDirection: "long",
      }]),
    };
    expect(executeCounterfactualSimulation({
      ...request,
      sourceQueryResult: clone(source.sourceQueryResult),
    })).toMatchObject({
      ok: false,
      error: {
        code: "ti_v3_analytics_contract_reference_mismatch",
        path: "$.sourceQueryResult",
      },
    });
    const foreign = verifiedSource(11);
    expect(executeCounterfactualSimulation({
      ...request,
      sourceQueryResult: foreign.sourceQueryResult,
    })).toMatchObject({ ok: false });
  });
});
