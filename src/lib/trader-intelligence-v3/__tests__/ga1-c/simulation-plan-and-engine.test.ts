import { describe, expect, it } from "vitest";

import {
  buildCounterfactualSimulationPlan,
  buildAnalyticalRow,
  buildSyntheticQueryFixture,
  buildSyntheticQueryFixtureFromRows,
  compileDirectionOnlyPreset,
  compileMaximumTradesPerDayPreset,
  compileStopAfterConsecutiveLossesPreset,
  COUNTERFACTUAL_SIMULATION_PLAN_VERSION,
  COUNTERFACTUAL_SIMULATION_POLICIES,
  COUNTERFACTUAL_SIMULATION_SEMANTIC_VERSION,
  executeCounterfactualSimulation,
  executeTradeQuery,
  verifyCounterfactualSimulationPlan,
  type AnalyticalRow,
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
    planOrigin: "generic_plan",
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

function rebuildRow(
  template: AnalyticalRow,
  index: number,
  input: Readonly<{
    direction?: "long" | "short";
    entryAt: string;
    exitAt: string;
    netPnl: string;
  }>,
): AnalyticalRow {
  const { rowDigest: _rowDigest, ...content } = template;
  void _rowDigest;
  const row = buildAnalyticalRow({
    ...content,
    semanticRoundTripKey: `ga1_c_chronology_${index}`,
    supportingOccurrenceKeys: template.supportingExecutionDigests.map(
      (_, occurrence) => `ga1_c_chronology_${index}_${occurrence + 1}`,
    ),
    displayedSymbol: "DEPENDENCY",
    stableInstrumentKey: "instrument_dependency",
    direction: input.direction ?? "long",
    firstEntryAt: input.entryAt,
    finalExitAt: input.exitAt,
    sessionDate: "2026-07-01",
    weekday: "wednesday",
    sequenceInPartition: String(index),
    grossPnl: input.netPnl,
    signedCharges: "0",
    netPnl: input.netPnl,
  });
  if (!row.ok) throw new Error(`${row.error.code}:${row.error.path}`);
  return row.value;
}

function chronologySource(
  inputs: readonly Parameters<typeof rebuildRow>[2][],
  reverseRows = false,
) {
  const template = buildSyntheticQueryFixture(1).derived.datasetReceipt.rows[0];
  const fixture = buildSyntheticQueryFixtureFromRows(
    inputs.map((input, index) => rebuildRow(template, index + 1, input)),
    reverseRows,
  );
  const sourceQueryPlan = fixture.plan({
    grouping: { kind: "aggregate" },
    metrics: [
      "candidate_count", "included_count", "excluded_count",
      "win_count", "loss_count", "flat_count", "net_pnl",
    ],
  });
  const result = executeTradeQuery({
    source: fixture.source,
    partitionReceipt: fixture.partition,
    queryPlan: sourceQueryPlan,
  });
  if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
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
    const explicitPlan = plan(sourceQueryPlan, [longOnly]);
    const { planOrigin: _missingOrigin, ...missingOrigin } = explicitPlan;
    void _missingOrigin;
    expect(
      buildCounterfactualSimulationPlan(missingOrigin, fixture.authority),
    ).toMatchObject({ ok: false, error: { path: "$.planOrigin" } });
    expect(buildCounterfactualSimulationPlan({
      ...explicitPlan,
      planOrigin: "inferred_plan",
    }, fixture.authority)).toMatchObject({
      ok: false,
      error: { path: "$.planOrigin" },
    });
    expect(buildCounterfactualSimulationPlan({
      ...explicitPlan,
      planOriginAuthority: "extra",
    }, fixture.authority)).toMatchObject({ ok: false });
    expect(buildCounterfactualSimulationPlan({
      ...explicitPlan,
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
    expect(result.value.netPnlDifference?.startsWith("-")).toBe(true);
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
      sessionStateBefore: {
        completedLossStreak: { state: "evaluated", value: "0" },
      },
      sessionStateAfter: {
        completedLossStreak: { state: "evaluated", value: "0" },
      },
    });
    expect(later).toMatchObject({
      classification: "skipped_session_stopped",
      responsibleRuleId: "stop_after_one_loss",
      sessionStateBefore: {
        completedLossStreak: { state: "evaluated", value: "1" },
        stoppedByRuleId: {
          state: "evaluated",
          value: "stop_after_one_loss",
        },
      },
    });
  });

  it("does not inspect mixed completion outcomes for direction-only or entry-count-only plans", () => {
    const source = chronologySource([
      {
        entryAt: "2026-07-01T09:00:00.000000000Z",
        exitAt: "2026-07-01T10:00:00.000000000Z",
        netPnl: "-5",
      },
      {
        entryAt: "2026-07-01T09:05:00.000000000Z",
        exitAt: "2026-07-01T10:00:00.000000000Z",
        netPnl: "7",
      },
      {
        entryAt: "2026-07-01T10:30:00.000000000Z",
        exitAt: "2026-07-01T10:40:00.000000000Z",
        netPnl: "2",
      },
    ]);
    const rules = [
      {
        ruleId: "long_only",
        kind: "direction_only",
        precedence: "1",
        action: "exclude_trade",
        allowedDirection: "long",
      },
      {
        ruleId: "maximum_two",
        kind: "maximum_trades_per_day",
        precedence: "1",
        action: "exclude_trade",
        maximumTrades: "2",
        countPolicy: "executed_simulated_entries_only_v1",
      },
    ] as const;
    for (const rule of rules) {
      const result = executeCounterfactualSimulation({
        source: source.fixture.source,
        partitionReceipt: source.fixture.partition,
        sourceQueryResult: source.sourceQueryResult,
        simulationPlan: plan(source.sourceQueryPlan, [rule]),
      });
      expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
      if (!result.ok) continue;
      expect(result.value.simulatedTradeKeys).toEqual(
        rule.kind === "direction_only"
          ? [
              "ga1_c_chronology_1",
              "ga1_c_chronology_2",
              "ga1_c_chronology_3",
            ]
          : ["ga1_c_chronology_1", "ga1_c_chronology_2"],
      );
      expect(result.value.plan.stateDependencies).toMatchObject(
        rule.kind === "direction_only"
          ? {
              executedEntryCount: false,
              completedRealizedOutcome: false,
              completedLossStreak: false,
            }
          : {
              executedEntryCount: true,
              completedRealizedOutcome: false,
              completedLossStreak: false,
            },
      );
      for (const outcome of result.value.tradeOutcomes) {
        expect(outcome.sessionStateBefore.completedLossStreak)
          .toEqual({ state: "not_evaluated", value: null });
        expect(outcome.sessionStateAfter.completedLossStreak)
          .toEqual({ state: "not_evaluated", value: null });
      }
    }
  });

  it("fails closed on a material mixed completion tie only when completed outcomes are required", () => {
    const source = chronologySource([
      {
        entryAt: "2026-07-01T09:00:00.000000000Z",
        exitAt: "2026-07-01T10:00:00.000000000Z",
        netPnl: "-1",
      },
      {
        entryAt: "2026-07-01T09:05:00.000000000Z",
        exitAt: "2026-07-01T10:00:00.000000000Z",
        netPnl: "1",
      },
      {
        entryAt: "2026-07-01T10:30:00.000000000Z",
        exitAt: "2026-07-01T10:40:00.000000000Z",
        netPnl: "1",
      },
    ]);
    expect(executeCounterfactualSimulation({
      source: source.fixture.source,
      partitionReceipt: source.fixture.partition,
      sourceQueryResult: source.sourceQueryResult,
      simulationPlan: plan(source.sourceQueryPlan, [{
        ruleId: "stop_after_one",
        kind: "stop_after_consecutive_losses",
        precedence: "1",
        action: "stop_session",
        consecutiveLossThreshold: "1",
        flatTradePolicy: "flat_resets_loss_streak_v1",
      }]),
    })).toMatchObject({
      ok: false,
      error: { code: "ti_v3_simulation_ambiguous_completion_tie" },
    });
  });

  it("accepts economically equivalent tied losses for the active loss-streak rule", () => {
    const source = chronologySource([
      {
        entryAt: "2026-07-01T09:00:00.000000000Z",
        exitAt: "2026-07-01T10:00:00.000000000Z",
        netPnl: "-1",
      },
      {
        entryAt: "2026-07-01T09:05:00.000000000Z",
        exitAt: "2026-07-01T10:00:00.000000000Z",
        netPnl: "-2",
      },
      {
        entryAt: "2026-07-01T10:30:00.000000000Z",
        exitAt: "2026-07-01T10:40:00.000000000Z",
        netPnl: "3",
      },
    ]);
    const result = executeCounterfactualSimulation({
      source: source.fixture.source,
      partitionReceipt: source.fixture.partition,
      sourceQueryResult: source.sourceQueryResult,
      simulationPlan: plan(source.sourceQueryPlan, [{
        ruleId: "stop_after_two",
        kind: "stop_after_consecutive_losses",
        precedence: "1",
        action: "stop_session",
        consecutiveLossThreshold: "2",
        flatTradePolicy: "flat_resets_loss_streak_v1",
      }]),
    });
    expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value.tradeOutcomes[2]).toMatchObject({
      classification: "skipped_session_stopped",
      sessionStateBefore: {
        completedLossStreak: { state: "evaluated", value: "2" },
      },
    });
  });

  it("keeps equality unavailable, strictly prior completion available, and skipped trades out of completion state", () => {
    const equality = chronologySource([
      {
        entryAt: "2026-07-01T09:00:00.000000000Z",
        exitAt: "2026-07-01T10:00:00.000000000Z",
        netPnl: "-1",
      },
      {
        entryAt: "2026-07-01T10:00:00.000000000Z",
        exitAt: "2026-07-01T11:00:00.000000000Z",
        netPnl: "2",
      },
      {
        entryAt: "2026-07-01T10:30:00.000000000Z",
        exitAt: "2026-07-01T10:40:00.000000000Z",
        netPnl: "1",
      },
    ]);
    const lossRule = {
      ruleId: "stop_after_one",
      kind: "stop_after_consecutive_losses",
      precedence: "1",
      action: "stop_session",
      consecutiveLossThreshold: "1",
      flatTradePolicy: "flat_resets_loss_streak_v1",
    } as const;
    const boundary = executeCounterfactualSimulation({
      source: equality.fixture.source,
      partitionReceipt: equality.fixture.partition,
      sourceQueryResult: equality.sourceQueryResult,
      simulationPlan: plan(equality.sourceQueryPlan, [lossRule]),
    });
    expect(boundary).toMatchObject({ ok: true });
    if (!boundary.ok) return;
    expect(boundary.value.tradeOutcomes[1].classification)
      .toBe("executed_unchanged");
    expect(boundary.value.tradeOutcomes[2].classification)
      .toBe("skipped_session_stopped");

    const skipped = chronologySource([
      {
        direction: "short",
        entryAt: "2026-07-01T09:00:00.000000000Z",
        exitAt: "2026-07-01T09:30:00.000000000Z",
        netPnl: "-5",
      },
      {
        entryAt: "2026-07-01T09:10:00.000000000Z",
        exitAt: "2026-07-01T11:00:00.000000000Z",
        netPnl: "1",
      },
      {
        entryAt: "2026-07-01T10:00:00.000000000Z",
        exitAt: "2026-07-01T10:10:00.000000000Z",
        netPnl: "1",
      },
    ]);
    const skippedResult = executeCounterfactualSimulation({
      source: skipped.fixture.source,
      partitionReceipt: skipped.fixture.partition,
      sourceQueryResult: skipped.sourceQueryResult,
      simulationPlan: plan(skipped.sourceQueryPlan, [{
        ruleId: "long_only",
        kind: "direction_only",
        precedence: "1",
        action: "exclude_trade",
        allowedDirection: "long",
      }, {
        ...lossRule,
        precedence: "2",
      }]),
    });
    expect(skippedResult).toMatchObject({ ok: true });
    if (!skippedResult.ok) return;
    expect(skippedResult.value.tradeOutcomes.map((outcome) =>
      outcome.classification)).toEqual([
      "skipped_by_rule",
      "executed_unchanged",
      "executed_unchanged",
    ]);
  });

  it("resolves dependencies independently of caller order and preserves all preset digests under source permutation", () => {
    const source = verifiedSource(30);
    const first = buildCounterfactualSimulationPlan(
      plan(source.sourceQueryPlan, [{
        ruleId: "long_only",
        kind: "direction_only",
        precedence: "1",
        action: "exclude_trade",
        allowedDirection: "long",
      }, {
        ruleId: "maximum_two",
        kind: "maximum_trades_per_day",
        precedence: "2",
        action: "exclude_trade",
        maximumTrades: "2",
        countPolicy: "executed_simulated_entries_only_v1",
      }]),
      source.fixture.authority,
    );
    const second = buildCounterfactualSimulationPlan(
      plan(source.sourceQueryPlan, [
        (first.ok ? first.value.rules[1] : {}),
        (first.ok ? first.value.rules[0] : {}),
      ]),
      source.fixture.authority,
    );
    expect(first).toMatchObject({ ok: true });
    expect(second).toMatchObject({ ok: true });
    if (first.ok && second.ok) {
      expect(second.value.stateDependencies)
        .toEqual(first.value.stateDependencies);
      expect(second.value.planDigest).toBe(first.value.planDigest);
    }

    const forward = verifiedSource(30, false);
    const reverse = verifiedSource(30, true);
    const presetRules = [
      {
        ruleId: "long_only",
        kind: "direction_only",
        precedence: "1",
        action: "exclude_trade",
        allowedDirection: "long",
      },
      {
        ruleId: "maximum_two",
        kind: "maximum_trades_per_day",
        precedence: "1",
        action: "exclude_trade",
        maximumTrades: "2",
        countPolicy: "executed_simulated_entries_only_v1",
      },
      {
        ruleId: "stop_after_two",
        kind: "stop_after_consecutive_losses",
        precedence: "1",
        action: "stop_session",
        consecutiveLossThreshold: "2",
        flatTradePolicy: "flat_resets_loss_streak_v1",
      },
    ] as const;
    for (const rule of presetRules) {
      const left = executeCounterfactualSimulation({
        source: forward.fixture.source,
        partitionReceipt: forward.fixture.partition,
        sourceQueryResult: forward.sourceQueryResult,
        simulationPlan: plan(forward.sourceQueryPlan, [rule]),
      });
      const right = executeCounterfactualSimulation({
        source: reverse.fixture.source,
        partitionReceipt: reverse.fixture.partition,
        sourceQueryResult: reverse.sourceQueryResult,
        simulationPlan: plan(reverse.sourceQueryPlan, [rule]),
      });
      expect(left).toMatchObject({ ok: true });
      expect(right).toMatchObject({ ok: true });
      if (left.ok && right.ok) {
        expect(right.value.resultDigest).toBe(left.value.resultDigest);
      }
    }
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
