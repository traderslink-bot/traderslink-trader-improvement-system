import { describe, expect, it } from "vitest";

import {
  buildAnalyticalRow,
  buildCounterfactualSimulationPlan,
  buildSyntheticQueryFixture,
  buildSyntheticQueryFixtureFromRows,
  compileAfterOutcomeExclusionPreset,
  compileExcludePriceRangePreset,
  compileMaximumAttemptsPerTickerPreset,
  compileNoNewTradesAfterTimePreset,
  compileSkipFourthAndLaterTradesPreset,
  compileSkipRepeatAttemptsPreset,
  compileStopAfterDailyDollarDrawdownPreset,
  compileStopAfterLosingTickerAttemptsPreset,
  compileStopAfterProfitGivebackPreset,
  compileWaitAfterLossPreset,
  COUNTERFACTUAL_SIMULATION_PLAN_VERSION,
  COUNTERFACTUAL_SIMULATION_POLICIES,
  COUNTERFACTUAL_SIMULATION_SEMANTIC_VERSION,
  executeCounterfactualSimulation,
  executeTradeQuery,
  finalizeContentAddressedAuthority,
  verifyAndReplayCounterfactualSimulationResult,
  verifyCompiledExecutionOnlySimulationPreset,
  type AnalyticalRow,
  type CompiledRepresentativeSimulationPreset,
  type TradeQueryFilter,
} from "../../analytics";

type RowInput = Readonly<{
  entryAt: string;
  exitAt: string;
  netPnl: string;
  direction?: "long" | "short";
  instrument?: string;
  account?: string;
  currency?: "USD" | "EUR";
  sessionDate?: string;
  session?: "premarket" | "regular" | "after_hours" | "overnight";
  entryPrice?: string | null;
}>;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function row(template: AnalyticalRow, index: number, input: RowInput) {
  const { rowDigest: _rowDigest, ...content } = template;
  void _rowDigest;
  const currency = input.currency ?? "USD";
  const built = buildAnalyticalRow({
    ...content,
    semanticRoundTripKey: `ga1_c_pack_2_${index}`,
    supportingOccurrenceKeys: template.supportingExecutionDigests.map(
      (_, occurrence) => `ga1_c_pack_2_${index}_${occurrence + 1}`,
    ),
    canonicalAccountKey: input.account ?? "account_ga1_c_pack_2",
    stableInstrumentKey: input.instrument ?? "instrument_ga1_c_a",
    displayedSymbol: input.instrument === "instrument_ga1_c_b" ? "PACKB" : "PACKA",
    direction: input.direction ?? "long",
    currency,
    firstEntryAt: input.entryAt,
    finalExitAt: input.exitAt,
    sessionDate: input.sessionDate ?? input.exitAt.slice(0, 10),
    weekday: "wednesday",
    session: input.session ?? "regular",
    sequenceInPartition: String(index),
    grossPnl: input.netPnl,
    signedCharges: "0",
    netPnl: input.netPnl,
    entryNotional: input.entryPrice === null
      ? {
          state: "unavailable",
          reasonCode: "ti_v3_test_entry_price_unavailable",
        }
      : {
          state: "available",
          amount: input.entryPrice ?? "10",
          currency,
        },
    shareQuantity: input.entryPrice === null
      ? {
          state: "unavailable",
          reasonCode: "ti_v3_test_entry_price_unavailable",
        }
      : { state: "available", quantity: "1" },
  });
  if (!built.ok) throw new Error(`${built.error.code}:${built.error.path}`);
  return built.value;
}

function source(
  inputs: readonly RowInput[],
  options: Readonly<{
    reverse?: boolean;
    filters?: readonly TradeQueryFilter[];
  }> = {},
) {
  const template = buildSyntheticQueryFixture(1).derived.datasetReceipt.rows[0];
  const fixture = buildSyntheticQueryFixtureFromRows(
    inputs.map((input, index) => row(template, index + 1, input)),
    options.reverse ?? false,
  );
  const sourceQueryPlan = fixture.plan({
    filters: options.filters ?? [],
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

function run(
  prepared: ReturnType<typeof source>,
  compiled: CompiledRepresentativeSimulationPreset,
) {
  return executeCounterfactualSimulation({
    source: prepared.fixture.source,
    partitionReceipt: prepared.fixture.partition,
    sourceQueryResult: prepared.sourceQueryResult,
    simulationPlan: compiled.plan,
  });
}

function directPlan(
  sourceQueryPlan: unknown,
  rules: readonly unknown[],
  evidenceTradeLimit = "512",
) {
  return {
    schemaVersion: COUNTERFACTUAL_SIMULATION_PLAN_VERSION,
    semanticVersion: COUNTERFACTUAL_SIMULATION_SEMANTIC_VERSION,
    planOrigin: "generic_plan",
    sourceQueryPlan,
    rules,
    policies: COUNTERFACTUAL_SIMULATION_POLICIES,
    limits: {
      sourceRowLimit: "10000",
      affectedTradeLimit: "10000",
      sessionSummaryLimit: "2000",
      evidenceTradeLimit,
      diagnosticLimit: "128",
    },
  };
}

const baseRows = [
  {
    entryAt: "2026-07-01T13:30:00.000000000Z",
    exitAt: "2026-07-01T13:35:00.000000000Z",
    netPnl: "-10",
  },
] as const;

describe("GA1-C preserve-or-exclude governed presets", () => {
  it("compiles and reconstructs all ten new presets with bound dependencies", () => {
    const prepared = source(baseRows);
    const compiled = [
      compileStopAfterDailyDollarDrawdownPreset(
        prepared.sourceQueryPlan,
        prepared.fixture.authority,
        { maximumDailyDrawdown: "100.00" },
      ),
      compileStopAfterProfitGivebackPreset(
        prepared.sourceQueryPlan,
        prepared.fixture.authority,
        { maximumProfitGiveback: "50.00" },
      ),
      compileSkipFourthAndLaterTradesPreset(
        prepared.sourceQueryPlan,
        prepared.fixture.authority,
        {},
      ),
      compileWaitAfterLossPreset(
        prepared.sourceQueryPlan,
        prepared.fixture.authority,
        { cooldownSeconds: "300" },
      ),
      compileMaximumAttemptsPerTickerPreset(
        prepared.sourceQueryPlan,
        prepared.fixture.authority,
        { maximumAttempts: "2" },
      ),
      compileStopAfterLosingTickerAttemptsPreset(
        prepared.sourceQueryPlan,
        prepared.fixture.authority,
        { losingAttemptThreshold: "2" },
      ),
      compileNoNewTradesAfterTimePreset(
        prepared.sourceQueryPlan,
        prepared.fixture.authority,
        { cutoffTime: "15:30:00" },
      ),
      compileExcludePriceRangePreset(
        prepared.sourceQueryPlan,
        prepared.fixture.authority,
        { lowerEntryPrice: "5", upperEntryPrice: "15" },
      ),
      compileSkipRepeatAttemptsPreset(
        prepared.sourceQueryPlan,
        prepared.fixture.authority,
        {},
      ),
      compileAfterOutcomeExclusionPreset(
        prepared.sourceQueryPlan,
        prepared.fixture.authority,
        { triggerOutcome: "loss" },
      ),
    ];
    for (const item of compiled) {
      expect(item, JSON.stringify(item)).toMatchObject({ ok: true });
      if (!item.ok) continue;
      expect(item.value.preset.stateDependencies)
        .toEqual(item.value.plan.stateDependencies);
      expect(verifyCompiledExecutionOnlySimulationPreset(
        clone(item.value),
        prepared.fixture.authority,
      )).toMatchObject({
        ok: true,
        value: {
          preset: { presetDigest: item.value.preset.presetDigest },
          plan: { planDigest: item.value.plan.planDigest },
        },
      });
    }
  });

  it("stops only later entries at the exact daily drawdown threshold and resets by session", () => {
    const prepared = source([
      {
        entryAt: "2026-07-01T13:30:00.000000000Z",
        exitAt: "2026-07-01T13:35:00.000000000Z",
        netPnl: "-60.00",
      },
      {
        entryAt: "2026-07-01T13:36:00.000000000Z",
        exitAt: "2026-07-01T13:40:00.000000000Z",
        netPnl: "-40",
      },
      {
        entryAt: "2026-07-01T13:41:00.000000000Z",
        exitAt: "2026-07-01T13:45:00.000000000Z",
        netPnl: "200",
      },
      {
        entryAt: "2026-07-02T13:30:00.000000000Z",
        exitAt: "2026-07-02T13:35:00.000000000Z",
        sessionDate: "2026-07-02",
        netPnl: "10",
      },
    ]);
    const compiled = compileStopAfterDailyDollarDrawdownPreset(
      prepared.sourceQueryPlan,
      prepared.fixture.authority,
      { maximumDailyDrawdown: "100.00" },
    );
    if (!compiled.ok) throw new Error(compiled.error.code);
    const result = run(prepared, compiled.value);
    expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value.tradeOutcomes.map((item) => item.classification))
      .toEqual([
        "executed_unchanged",
        "executed_unchanged",
        "skipped_session_stopped",
        "executed_unchanged",
      ]);
    expect(result.value.affectedSummary).toMatchObject({
      profitableTradesRemoved: "1",
      sessionStopEvents: "1",
      daysHarmed: "1",
    });
    expect(result.value.tradeOutcomes[2].sessionStateBefore)
      .toMatchObject({
        realizedDailyNetPnl: { state: "evaluated", value: "-100" },
      });
  });

  it("treats mixed same-time daily P/L atomically while profit-peak ambiguity fails closed", () => {
    const prepared = source([
      {
        entryAt: "2026-07-01T13:30:00.000000000Z",
        exitAt: "2026-07-01T13:40:00.000000000Z",
        netPnl: "-120",
      },
      {
        entryAt: "2026-07-01T13:31:00.000000000Z",
        exitAt: "2026-07-01T13:40:00.000000000Z",
        netPnl: "20",
      },
      {
        entryAt: "2026-07-01T13:41:00.000000000Z",
        exitAt: "2026-07-01T13:45:00.000000000Z",
        netPnl: "1",
      },
    ]);
    const drawdown = compileStopAfterDailyDollarDrawdownPreset(
      prepared.sourceQueryPlan,
      prepared.fixture.authority,
      { maximumDailyDrawdown: "100" },
    );
    const giveback = compileStopAfterProfitGivebackPreset(
      prepared.sourceQueryPlan,
      prepared.fixture.authority,
      { maximumProfitGiveback: "10" },
    );
    if (!drawdown.ok || !giveback.ok) throw new Error("compile failed");
    expect(run(prepared, drawdown.value)).toMatchObject({ ok: true });
    expect(run(prepared, giveback.value)).toMatchObject({
      ok: false,
      error: { code: "ti_v3_simulation_ambiguous_completion_tie" },
    });
  });

  it("records harmful profit-giveback counterexamples from retained realized state", () => {
    const prepared = source([
      {
        entryAt: "2026-07-01T13:30:00.000000000Z",
        exitAt: "2026-07-01T13:35:00.000000000Z",
        netPnl: "200",
      },
      {
        entryAt: "2026-07-01T13:36:00.000000000Z",
        exitAt: "2026-07-01T13:40:00.000000000Z",
        netPnl: "-100",
      },
      {
        entryAt: "2026-07-01T13:41:00.000000000Z",
        exitAt: "2026-07-01T13:45:00.000000000Z",
        netPnl: "300",
      },
    ]);
    const compiled = compileStopAfterProfitGivebackPreset(
      prepared.sourceQueryPlan,
      prepared.fixture.authority,
      { maximumProfitGiveback: "100" },
    );
    if (!compiled.ok) throw new Error(compiled.error.code);
    const result = run(prepared, compiled.value);
    expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value.effect).toBe("harmed");
    expect(result.value.affectedSummary.profitableTradesRemoved).toBe("1");
    expect(result.value.evidence.find((item) =>
      item.category === "counterexamples_rule_made_results_worse"
    )).toMatchObject({
      totalQualifyingCount: "1",
      sourceTradeKeys: ["ga1_c_pack_2_3"],
    });
  });

  it("uses retained simulated entries for fourth-plus and stable-instrument attempt limits", () => {
    const rows: RowInput[] = Array.from({ length: 5 }, (_, index) => ({
      entryAt: `2026-07-01T13:${String(30 + index * 2).padStart(2, "0")}:00.000000000Z`,
      exitAt: `2026-07-01T13:${String(31 + index * 2).padStart(2, "0")}:00.000000000Z`,
      netPnl: index === 0 ? "-1" : "1",
      direction: index === 0 ? "short" : "long",
      instrument: index === 4 ? "instrument_ga1_c_b" : "instrument_ga1_c_a",
    }));
    const prepared = source(rows);
    const fourth = compileSkipFourthAndLaterTradesPreset(
      prepared.sourceQueryPlan,
      prepared.fixture.authority,
      {},
    );
    const attempts = compileMaximumAttemptsPerTickerPreset(
      prepared.sourceQueryPlan,
      prepared.fixture.authority,
      { maximumAttempts: "2" },
    );
    if (!fourth.ok || !attempts.ok) throw new Error("compile failed");
    const fourthResult = run(prepared, fourth.value);
    const attemptResult = run(prepared, attempts.value);
    expect(fourthResult).toMatchObject({
      ok: true,
      value: { executedCount: "3", skippedCount: "2" },
    });
    expect(attemptResult).toMatchObject({
      ok: true,
      value: { executedCount: "3", skippedCount: "2" },
    });
    if (!attemptResult.ok) return;
    expect(attemptResult.value.tradeOutcomes[4].classification)
      .toBe("executed_unchanged");
  });

  it("accepts cooldown expiry exactly, and skipped trades do not establish completion state", () => {
    const prepared = source([
      {
        entryAt: "2026-07-01T13:30:00.000000000Z",
        exitAt: "2026-07-01T13:35:00.000000000Z",
        netPnl: "-10",
      },
      {
        entryAt: "2026-07-01T13:39:59.999999999Z",
        exitAt: "2026-07-01T13:50:00.000000000Z",
        netPnl: "-100",
      },
      {
        entryAt: "2026-07-01T13:40:00.000000000Z",
        exitAt: "2026-07-01T13:41:00.000000000Z",
        netPnl: "5",
      },
    ]);
    const compiled = compileWaitAfterLossPreset(
      prepared.sourceQueryPlan,
      prepared.fixture.authority,
      { cooldownSeconds: "300" },
    );
    if (!compiled.ok) throw new Error(compiled.error.code);
    const result = run(prepared, compiled.value);
    expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value.tradeOutcomes.map((item) => item.classification))
      .toEqual([
        "executed_unchanged",
        "skipped_during_cooldown",
        "executed_unchanged",
      ]);
    expect(result.value.affectedSummary.cooldownExclusions).toBe("1");
  });

  it("stops only the losing stable instrument and keeps other instruments eligible", () => {
    const prepared = source([
      {
        entryAt: "2026-07-01T13:30:00.000000000Z",
        exitAt: "2026-07-01T13:31:00.000000000Z",
        netPnl: "-1",
      },
      {
        entryAt: "2026-07-01T13:32:00.000000000Z",
        exitAt: "2026-07-01T13:33:00.000000000Z",
        netPnl: "-1",
      },
      {
        entryAt: "2026-07-01T13:34:00.000000000Z",
        exitAt: "2026-07-01T13:35:00.000000000Z",
        netPnl: "5",
      },
      {
        entryAt: "2026-07-01T13:36:00.000000000Z",
        exitAt: "2026-07-01T13:37:00.000000000Z",
        netPnl: "5",
        instrument: "instrument_ga1_c_b",
      },
    ]);
    const compiled = compileStopAfterLosingTickerAttemptsPreset(
      prepared.sourceQueryPlan,
      prepared.fixture.authority,
      { losingAttemptThreshold: "2" },
    );
    if (!compiled.ok) throw new Error(compiled.error.code);
    const result = run(prepared, compiled.value);
    expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value.tradeOutcomes.map((item) => item.classification))
      .toEqual([
        "executed_unchanged",
        "executed_unchanged",
        "skipped_ticker_stopped",
        "executed_unchanged",
      ]);
    expect(result.value.affectedSummary.tickerStopEvents).toBe("1");
  });

  it("enforces exact cutoff and inclusive price boundaries without locale or candle authority", () => {
    const prepared = source([
      {
        entryAt: "2026-07-01T13:59:59.999999999Z",
        exitAt: "2026-07-01T14:00:00.000000000Z",
        netPnl: "1",
        entryPrice: "5",
      },
      {
        entryAt: "2026-07-01T14:00:00.000000000Z",
        exitAt: "2026-07-01T14:01:00.000000000Z",
        netPnl: "-1",
        entryPrice: "15",
      },
      {
        entryAt: "2026-07-01T14:02:00.000000000Z",
        exitAt: "2026-07-01T14:03:00.000000000Z",
        netPnl: "1",
        entryPrice: "20",
      },
    ]);
    const cutoff = compileNoNewTradesAfterTimePreset(
      prepared.sourceQueryPlan,
      prepared.fixture.authority,
      { cutoffTime: "14:00:00" },
    );
    const price = compileExcludePriceRangePreset(
      prepared.sourceQueryPlan,
      prepared.fixture.authority,
      { lowerEntryPrice: "5", upperEntryPrice: "15" },
    );
    if (!cutoff.ok || !price.ok) throw new Error("compile failed");
    expect(run(prepared, cutoff.value)).toMatchObject({
      ok: true,
      value: { executedCount: "1", skippedCount: "2" },
    });
    expect(run(prepared, price.value)).toMatchObject({
      ok: true,
      value: { executedCount: "1", skippedCount: "2" },
    });
    expect(compileExcludePriceRangePreset(
      prepared.sourceQueryPlan,
      prepared.fixture.authority,
      { lowerEntryPrice: "15", upperEntryPrice: "5" },
    )).toMatchObject({ ok: false });
  });

  it("skips repeat attempts by stable identity and consumes one after-outcome exclusion", () => {
    const prepared = source([
      {
        entryAt: "2026-07-01T13:30:00.000000000Z",
        exitAt: "2026-07-01T13:35:00.000000000Z",
        netPnl: "-10",
      },
      {
        entryAt: "2026-07-01T13:35:00.000000000Z",
        exitAt: "2026-07-01T13:50:00.000000000Z",
        netPnl: "2",
      },
      {
        entryAt: "2026-07-01T13:36:00.000000000Z",
        exitAt: "2026-07-01T13:37:00.000000000Z",
        netPnl: "3",
        instrument: "instrument_ga1_c_b",
      },
      {
        entryAt: "2026-07-01T13:38:00.000000000Z",
        exitAt: "2026-07-01T13:39:00.000000000Z",
        netPnl: "4",
        instrument: "instrument_ga1_c_b",
      },
    ]);
    const repeats = compileSkipRepeatAttemptsPreset(
      prepared.sourceQueryPlan,
      prepared.fixture.authority,
      {},
    );
    const afterLoss = compileAfterOutcomeExclusionPreset(
      prepared.sourceQueryPlan,
      prepared.fixture.authority,
      { triggerOutcome: "loss" },
    );
    if (!repeats.ok || !afterLoss.ok) throw new Error("compile failed");
    expect(run(prepared, repeats.value)).toMatchObject({
      ok: true,
      value: { executedCount: "2", skippedCount: "2" },
    });
    const result = run(prepared, afterLoss.value);
    expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value.tradeOutcomes.map((item) => item.classification))
      .toEqual([
        "executed_unchanged",
        "executed_unchanged",
        "skipped_by_rule",
        "executed_unchanged",
      ]);
  });

  it("keeps source-filter exclusions out of state and bounds exact evidence at max plus one", () => {
    const prepared = source([
      {
        entryAt: "2026-07-01T13:30:00.000000000Z",
        exitAt: "2026-07-01T13:31:00.000000000Z",
        netPnl: "-1",
        direction: "short",
      },
      {
        entryAt: "2026-07-01T13:32:00.000000000Z",
        exitAt: "2026-07-01T13:33:00.000000000Z",
        netPnl: "-2",
      },
      {
        entryAt: "2026-07-01T13:34:00.000000000Z",
        exitAt: "2026-07-01T13:35:00.000000000Z",
        netPnl: "-3",
      },
      {
        entryAt: "2026-07-01T13:36:00.000000000Z",
        exitAt: "2026-07-01T13:37:00.000000000Z",
        netPnl: "-4",
      },
    ], {
      filters: [{ kind: "direction", values: ["long"] }],
    });
    const result = executeCounterfactualSimulation({
      source: prepared.fixture.source,
      partitionReceipt: prepared.fixture.partition,
      sourceQueryResult: prepared.sourceQueryResult,
      simulationPlan: directPlan(prepared.sourceQueryPlan, [{
        ruleId: "exclude_all_long",
        kind: "direction_only",
        precedence: "1",
        action: "exclude_trade",
        allowedDirection: "short",
      }], "2"),
    });
    expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value.tradeOutcomes[0].classification)
      .toBe("excluded_source_filter");
    expect(result.value.evidence.find((item) =>
      item.category === "losing_trades_avoided"
    )).toMatchObject({
      totalQualifyingCount: "3",
      emittedCount: "2",
      truncated: true,
    });
  });

  it("isolates retained state by account, currency partition, and stable instrument", () => {
    const prepared = source([
      {
        entryAt: "2026-07-01T13:30:00.000000000Z",
        exitAt: "2026-07-01T13:31:00.000000000Z",
        netPnl: "-1",
        account: "account_ga1_c_one",
      },
      {
        entryAt: "2026-07-01T13:32:00.000000000Z",
        exitAt: "2026-07-01T13:33:00.000000000Z",
        netPnl: "2",
        account: "account_ga1_c_two",
      },
      {
        entryAt: "2026-07-01T13:34:00.000000000Z",
        exitAt: "2026-07-01T13:35:00.000000000Z",
        netPnl: "-100",
        account: "account_ga1_c_one",
        currency: "EUR",
      },
    ]);
    const compiled = compileSkipRepeatAttemptsPreset(
      prepared.sourceQueryPlan,
      prepared.fixture.authority,
      {},
    );
    if (!compiled.ok) throw new Error(compiled.error.code);
    const result = run(prepared, compiled.value);
    expect(result, JSON.stringify(result)).toMatchObject({
      ok: true,
      value: {
        candidateCount: "2",
        executedCount: "2",
        skippedCount: "0",
      },
    });
  });

  it("rejects overnight cutoff semantics and classifies missing price authority explicitly", () => {
    const overnight = source([{
      ...baseRows[0],
      session: "overnight",
    }]);
    const cutoff = compileNoNewTradesAfterTimePreset(
      overnight.sourceQueryPlan,
      overnight.fixture.authority,
      { cutoffTime: "10:00:00" },
    );
    if (!cutoff.ok) throw new Error(cutoff.error.code);
    expect(run(overnight, cutoff.value)).toMatchObject({
      ok: false,
      error: { path: "$.chronology.overnightSession" },
    });
    const missingPrice = source([{
      ...baseRows[0],
      entryPrice: null,
    }]);
    const price = compileExcludePriceRangePreset(
      missingPrice.sourceQueryPlan,
      missingPrice.fixture.authority,
      { lowerEntryPrice: "5", upperEntryPrice: "15" },
    );
    if (!price.ok) throw new Error(price.error.code);
    const missingPriceResult = run(missingPrice, price.value);
    expect(missingPriceResult).toMatchObject({
      ok: true,
      value: {
        executedCount: "1",
        skippedCount: "0",
        unavailableCount: "1",
        actualTradeKeys: ["ga1_c_pack_2_1"],
        simulatedTradeKeys: ["ga1_c_pack_2_1"],
        actualNetPnl: "-10",
        simulatedNetPnl: "-10",
        netPnlDifference: "0",
        affectedSummary: {
          tradesHelped: "0",
          tradesHarmed: "0",
          losingTradesAvoided: "0",
          profitableTradesRemoved: "0",
          neutralAffectedTrades: "0",
          ruleSpecificAffectedCounts: [],
        },
        tradeOutcomes: [{
          classification: "unavailable_required_authority",
          responsibleRuleId: "exclude_price_range",
          reasonCode: "ti_v3_simulation_entry_price_unavailable",
          actualNetPnl: "-10",
          simulatedNetPnl: "-10",
          limitationCodes: [
            "ti_v3_simulation_entry_price_unavailable",
            "ti_v3_simulation_required_rule_authority_unavailable",
          ],
        }],
        limitationCodes: expect.arrayContaining([
          "ti_v3_simulation_required_rule_authority_unavailable",
        ]),
      },
    });
  });

  it("reconciles unavailable retention separately from genuine affected trades", () => {
    const inputs = [
      {
        entryAt: "2026-07-01T13:30:00.000000000Z",
        exitAt: "2026-07-01T13:35:00.000000000Z",
        netPnl: "-10",
        entryPrice: null,
      },
      {
        entryAt: "2026-07-01T13:36:00.000000000Z",
        exitAt: "2026-07-01T13:40:00.000000000Z",
        netPnl: "5",
        entryPrice: "10",
      },
    ] as const;
    const prepared = source(inputs);
    const compiled = compileExcludePriceRangePreset(
      prepared.sourceQueryPlan,
      prepared.fixture.authority,
      { lowerEntryPrice: "5", upperEntryPrice: "15" },
    );
    if (!compiled.ok) throw new Error(compiled.error.code);
    const result = run(prepared, compiled.value);
    if (!result.ok) throw new Error(result.error.code);
    expect(result.value).toMatchObject({
      executedCount: "1",
      skippedCount: "1",
      unavailableCount: "1",
      simulatedTradeKeys: ["ga1_c_pack_2_1"],
      affectedSummary: {
        tradesHelped: "0",
        tradesHarmed: "1",
        losingTradesAvoided: "0",
        profitableTradesRemoved: "1",
        neutralAffectedTrades: "0",
        ruleSpecificAffectedCounts: [{
          ruleId: "exclude_price_range",
          affectedCount: "1",
        }],
      },
      tradeOutcomes: [
        {
          sourceTradeKey: "ga1_c_pack_2_1",
          classification: "unavailable_required_authority",
          responsibleRuleId: "exclude_price_range",
          reasonCode: "ti_v3_simulation_entry_price_unavailable",
          actualNetPnl: "-10",
          simulatedNetPnl: "-10",
        },
        {
          sourceTradeKey: "ga1_c_pack_2_2",
          classification: "skipped_by_rule",
          responsibleRuleId: "exclude_price_range",
          actualNetPnl: "5",
          simulatedNetPnl: null,
        },
      ],
    });

    const replayed = verifyAndReplayCounterfactualSimulationResult({
      source: prepared.fixture.source,
      partitionReceipt: prepared.fixture.partition,
      sourceQueryResult: prepared.sourceQueryResult,
      persistedResult: clone(result.value),
    });
    expect(replayed, JSON.stringify(replayed)).toMatchObject({
      ok: true,
      value: {
        resultDigest: result.value.resultDigest,
        skippedCount: "1",
        unavailableCount: "1",
        affectedSummary: {
          ruleSpecificAffectedCounts: [{
            ruleId: "exclude_price_range",
            affectedCount: "1",
          }],
        },
      },
    });

    const { resultDigest: _resultDigest, ...resultBody } = result.value;
    void _resultDigest;
    const tamperedBodies = [
      {
        ...resultBody,
        affectedSummary: {
          ...resultBody.affectedSummary,
          ruleSpecificAffectedCounts: [{
            ruleId: "exclude_price_range",
            affectedCount: "2",
          }],
        },
      },
      { ...resultBody, unavailableCount: "2" },
    ];
    for (const tamperedBody of tamperedBodies) {
      const redigested = finalizeContentAddressedAuthority(
        "counterfactual_simulation_result",
        tamperedBody,
        "resultDigest",
      );
      if (!redigested.ok) throw new Error(redigested.error.code);
      expect(verifyAndReplayCounterfactualSimulationResult({
        source: prepared.fixture.source,
        partitionReceipt: prepared.fixture.partition,
        sourceQueryResult: prepared.sourceQueryResult,
        persistedResult: redigested.value,
      })).toMatchObject({ ok: false });
    }

    const permuted = source(inputs, { reverse: true });
    const permutedCompiled = compileExcludePriceRangePreset(
      permuted.sourceQueryPlan,
      permuted.fixture.authority,
      { lowerEntryPrice: "5", upperEntryPrice: "15" },
    );
    if (!permutedCompiled.ok) throw new Error(permutedCompiled.error.code);
    const permutedResult = run(permuted, permutedCompiled.value);
    expect(permutedResult, JSON.stringify(permutedResult)).toMatchObject({
      ok: true,
      value: { resultDigest: result.value.resultDigest },
    });
  });

  it("keeps new dependency unions and plan identities invariant under caller rule order", () => {
    const prepared = source(baseRows);
    const rules = [
      {
        ruleId: "drawdown",
        kind: "stop_after_daily_dollar_drawdown",
        precedence: "1",
        action: "stop_session",
        maximumDailyDrawdown: "100",
        thresholdPolicy:
          "realized_net_pnl_at_or_below_negative_threshold_v1",
      },
      {
        ruleId: "ticker_attempts",
        kind: "maximum_attempts_per_ticker",
        precedence: "2",
        action: "exclude_trade",
        maximumAttempts: "2",
        countPolicy:
          "retained_simulated_entries_per_stable_instrument_v1",
      },
      {
        ruleId: "after_loss",
        kind: "after_outcome_exclusion",
        precedence: "3",
        action: "exclude_next_eligible_trade",
        triggerOutcome: "loss",
        consumptionPolicy: "consume_one_next_rule_eligible_trade_v1",
        nonMatchingOutcomePolicy:
          "pending_exclusion_remains_until_consumed_v1",
      },
    ] as const;
    const left = buildCounterfactualSimulationPlan(
      directPlan(prepared.sourceQueryPlan, rules),
      prepared.fixture.authority,
    );
    const right = buildCounterfactualSimulationPlan(
      directPlan(prepared.sourceQueryPlan, [...rules].reverse()),
      prepared.fixture.authority,
    );
    expect(left, JSON.stringify(left)).toMatchObject({ ok: true });
    expect(right, JSON.stringify(right)).toMatchObject({ ok: true });
    if (!left.ok || !right.ok) return;
    expect(left.value.stateDependencies).toEqual(right.value.stateDependencies);
    expect(left.value.planDigest).toBe(right.value.planDigest);
  });

  it("is permutation-invariant for every new preset and distinguishes material ties", () => {
    const inputs = [
      {
        entryAt: "2026-07-01T13:30:00.000000000Z",
        exitAt: "2026-07-01T13:35:00.000000000Z",
        netPnl: "-10",
      },
      {
        entryAt: "2026-07-01T13:31:00.000000000Z",
        exitAt: "2026-07-01T13:35:00.000000000Z",
        netPnl: "-5",
      },
      {
        entryAt: "2026-07-01T13:36:00.000000000Z",
        exitAt: "2026-07-01T13:37:00.000000000Z",
        netPnl: "20",
        instrument: "instrument_ga1_c_b",
        entryPrice: "20",
      },
      {
        entryAt: "2026-07-01T13:38:00.000000000Z",
        exitAt: "2026-07-01T13:39:00.000000000Z",
        netPnl: "1",
      },
    ] as const;
    const left = source(inputs);
    const right = source(inputs, { reverse: true });
    const compilers = [
      (prepared: typeof left) => compileStopAfterDailyDollarDrawdownPreset(
        prepared.sourceQueryPlan, prepared.fixture.authority,
        { maximumDailyDrawdown: "10" },
      ),
      (prepared: typeof left) => compileStopAfterProfitGivebackPreset(
        prepared.sourceQueryPlan, prepared.fixture.authority,
        { maximumProfitGiveback: "5" },
      ),
      (prepared: typeof left) => compileSkipFourthAndLaterTradesPreset(
        prepared.sourceQueryPlan, prepared.fixture.authority, {},
      ),
      (prepared: typeof left) => compileWaitAfterLossPreset(
        prepared.sourceQueryPlan, prepared.fixture.authority,
        { cooldownSeconds: "60" },
      ),
      (prepared: typeof left) => compileMaximumAttemptsPerTickerPreset(
        prepared.sourceQueryPlan, prepared.fixture.authority,
        { maximumAttempts: "2" },
      ),
      (prepared: typeof left) => compileStopAfterLosingTickerAttemptsPreset(
        prepared.sourceQueryPlan, prepared.fixture.authority,
        { losingAttemptThreshold: "2" },
      ),
      (prepared: typeof left) => compileNoNewTradesAfterTimePreset(
        prepared.sourceQueryPlan, prepared.fixture.authority,
        { cutoffTime: "13:38:00" },
      ),
      (prepared: typeof left) => compileExcludePriceRangePreset(
        prepared.sourceQueryPlan, prepared.fixture.authority,
        { lowerEntryPrice: "5", upperEntryPrice: "15" },
      ),
      (prepared: typeof left) => compileSkipRepeatAttemptsPreset(
        prepared.sourceQueryPlan, prepared.fixture.authority, {},
      ),
      (prepared: typeof left) => compileAfterOutcomeExclusionPreset(
        prepared.sourceQueryPlan, prepared.fixture.authority,
        { triggerOutcome: "loss" },
      ),
    ];
    for (const compile of compilers) {
      const a = compile(left);
      const b = compile(right);
      if (!a.ok || !b.ok) throw new Error("compile failed");
      const aResult = run(left, a.value);
      const bResult = run(right, b.value);
      expect(aResult, JSON.stringify(aResult)).toMatchObject({ ok: true });
      expect(bResult, JSON.stringify(bResult)).toMatchObject({ ok: true });
      if (aResult.ok && bResult.ok) {
        expect(aResult.value.resultDigest).toBe(bResult.value.resultDigest);
      }
    }
    const ambiguous = source([
      ...inputs.slice(0, 1),
      { ...inputs[1], netPnl: "5" },
      inputs[2],
    ]);
    const afterLoss = compileAfterOutcomeExclusionPreset(
      ambiguous.sourceQueryPlan,
      ambiguous.fixture.authority,
      { triggerOutcome: "loss" },
    );
    if (!afterLoss.ok) throw new Error(afterLoss.error.code);
    expect(run(ambiguous, afterLoss.value)).toMatchObject({
      ok: false,
      error: { code: "ti_v3_simulation_ambiguous_completion_tie" },
    });
  });

  it("rejects malformed preset authority, redigested tampering, foreign authority, and result tampering", () => {
    const prepared = source(baseRows);
    const compiled = compileWaitAfterLossPreset(
      prepared.sourceQueryPlan,
      prepared.fixture.authority,
      { cooldownSeconds: "60" },
    );
    if (!compiled.ok) throw new Error(compiled.error.code);
    class Arguments {
      cooldownSeconds = "60";
    }
    expect(compileWaitAfterLossPreset(
      prepared.sourceQueryPlan,
      prepared.fixture.authority,
      new Arguments(),
    )).toMatchObject({ ok: false });
    const accessor = Object.create(null) as Record<string, unknown>;
    Object.defineProperty(accessor, "cooldownSeconds", {
      enumerable: true,
      get: () => "60",
    });
    expect(compileWaitAfterLossPreset(
      prepared.sourceQueryPlan,
      prepared.fixture.authority,
      accessor,
    )).toMatchObject({ ok: false });
    expect(compileWaitAfterLossPreset(
      prepared.sourceQueryPlan,
      prepared.fixture.authority,
      Object.assign(Object.create({ polluted: true }), {
        cooldownSeconds: "60",
      }),
    )).toMatchObject({ ok: false });
    const { presetDigest: _presetDigest, ...presetBody } = compiled.value.preset;
    void _presetDigest;
    const redigested = finalizeContentAddressedAuthority(
      "counterfactual_simulation_preset",
      { ...presetBody, allowedWording: "tampered_but_redigested" },
      "presetDigest",
    );
    if (!redigested.ok) throw new Error(redigested.error.code);
    expect(verifyCompiledExecutionOnlySimulationPreset({
      preset: redigested.value,
      plan: compiled.value.plan,
    }, prepared.fixture.authority)).toMatchObject({ ok: false });
    const foreign = source([
      {
        ...baseRows[0],
        entryAt: "2026-07-02T13:30:00.000000000Z",
        exitAt: "2026-07-02T13:35:00.000000000Z",
      },
    ]);
    expect(verifyCompiledExecutionOnlySimulationPreset(
      clone(compiled.value),
      foreign.fixture.authority,
    )).toMatchObject({ ok: false });
    const result = run(prepared, compiled.value);
    if (!result.ok) throw new Error(result.error.code);
    const replayed = verifyAndReplayCounterfactualSimulationResult({
      source: prepared.fixture.source,
      partitionReceipt: prepared.fixture.partition,
      sourceQueryResult: prepared.sourceQueryResult,
      persistedResult: clone(result.value),
    });
    expect(replayed, JSON.stringify(replayed)).toMatchObject({
      ok: true,
      value: { resultDigest: result.value.resultDigest },
    });
    const { resultDigest: _resultDigest, ...resultBody } = result.value;
    void _resultDigest;
    const redigestedResult = finalizeContentAddressedAuthority(
      "counterfactual_simulation_result",
      { ...resultBody, skippedCount: "999" },
      "resultDigest",
    );
    if (!redigestedResult.ok) throw new Error(redigestedResult.error.code);
    expect(verifyAndReplayCounterfactualSimulationResult({
      source: prepared.fixture.source,
      partitionReceipt: prepared.fixture.partition,
      sourceQueryResult: prepared.sourceQueryResult,
      persistedResult: redigestedResult.value,
    })).toMatchObject({ ok: false });
  });
});
