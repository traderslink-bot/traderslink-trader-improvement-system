import { describe, expect, it } from "vitest";

import {
  buildAnalyticalRow,
  buildCounterfactualSimulationPlan,
  buildSyntheticQueryFixture,
  buildSyntheticQueryFixtureFromRows,
  compileAfterOutcomeExclusionPreset,
  compileReduceSizeAfterLossPreset,
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
  quantity?: string | null;
  grossPnl?: string;
  signedCharges?: string;
  feeAuthority?: unknown;
  owner?: string;
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
    canonicalOwnerKey: input.owner ?? content.canonicalOwnerKey,
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
    grossPnl: input.grossPnl ?? input.netPnl,
    signedCharges: input.signedCharges ?? "0",
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
    shareQuantity: input.quantity === null || input.entryPrice === null
      ? {
          state: "unavailable",
          reasonCode: "ti_v3_test_quantity_unavailable",
        }
      : { state: "available", quantity: input.quantity ?? "1" },
    ...(input.feeAuthority === undefined
      ? {}
      : { feeAuthority: input.feeAuthority }),
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

  it("resizes the next strictly-later eligible trade with exact floor ratio and mixed fees", () => {
    const prepared = source([
      {
        entryAt: "2026-07-01T13:30:00.000000000Z",
        exitAt: "2026-07-01T13:35:00.000000000Z",
        netPnl: "-10",
        quantity: "10",
      },
      {
        entryAt: "2026-07-01T13:36:00.000000000Z",
        exitAt: "2026-07-01T13:40:00.000000000Z",
        grossPnl: "100",
        signedCharges: "-2",
        netPnl: "98",
        quantity: "5",
        instrument: "instrument_ga1_c_b",
        feeAuthority: {
          state: "broker_reported_complete",
          components: [
            { kind: "fixed", signedAmount: "-1" },
            { kind: "quantity_variable", signedAmount: "-1" },
          ],
        },
      },
    ]);
    const compiled = compileReduceSizeAfterLossPreset(
      prepared.sourceQueryPlan,
      prepared.fixture.authority,
      {},
    );
    if (!compiled.ok) throw new Error(compiled.error.code);
    expect(verifyCompiledExecutionOnlySimulationPreset(
      clone(compiled.value),
      prepared.fixture.authority,
    )).toMatchObject({ ok: true });
    const result = run(prepared, compiled.value);
    if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
    const resized = result.value.tradeOutcomes[1];
    expect(resized).toMatchObject({
      classification: "executed_resized",
      responsibleRuleId: "reduce_size_after_loss",
      reasonCode: "ti_v3_simulation_resize_executed_exact_net",
      simulatedNetPnl: "38.6",
      sessionStateBefore: {
        pendingResizeAfterLossRuleIds: {
          state: "evaluated",
          value: ["reduce_size_after_loss"],
        },
      },
      sessionStateAfter: {
        pendingResizeAfterLossRuleIds: {
          state: "evaluated",
          value: [],
        },
      },
      resizeEconomics: {
        state: "evaluated",
        value: {
          originalQuantity: "5",
          simulatedQuantity: "2",
          sizeRatio: { numerator: "2", denominator: "5" },
          simulatedGrossPnl: { numerator: "40", denominator: "1" },
          simulatedCharges: { numerator: "-7", denominator: "5" },
          simulatedNetPnl: { numerator: "193", denominator: "5" },
          fixedChargesRetained: { numerator: "-1", denominator: "1" },
          variableChargesRecalculated: {
            numerator: "-2",
            denominator: "5",
          },
        },
      },
    });
    expect(result.value).toMatchObject({
      resizedCount: "1",
      simulatedNetPnl: "28.6",
      netPnlDifference: "-59.4",
      resizeSummary: {
        resizedCount: "1",
        exactGrossComparisonCount: "1",
        exactNetComparisonCount: "1",
        originalAggregateQuantity: "5",
        simulatedAggregateQuantity: "2",
        grossPnlDifference: { numerator: "-60", denominator: "1" },
        netPnlDifference: { numerator: "-297", denominator: "5" },
        grossHarmedCount: "1",
        netHarmedCount: "1",
        netUnclassifiedCount: "0",
      },
    });
  });

  it("derives exact resized authority only from decomposed scalable fees", () => {
    const exactAuthorities = [
      {
        state: "broker_reported_complete",
        components: [
          { kind: "fixed", signedAmount: "-1" },
          { kind: "quantity_variable", signedAmount: "-1" },
        ],
        signedCharges: "-2",
        expectedCharges: { numerator: "-3", denominator: "2" },
        expectedNet: { numerator: "7", denominator: "2" },
      },
      {
        state: "account_policy_calculated",
        components: [
          { kind: "fixed", signedAmount: "-1" },
          { kind: "notional_variable", signedAmount: "-1" },
        ],
        signedCharges: "-2",
        expectedCharges: { numerator: "-3", denominator: "2" },
        expectedNet: { numerator: "7", denominator: "2" },
      },
      {
        state: "explicitly_zero",
        signedCharges: "0",
        expectedCharges: { numerator: "0", denominator: "1" },
        expectedNet: { numerator: "5", denominator: "1" },
      },
    ] as const;
    for (const authority of exactAuthorities) {
      const { signedCharges, expectedCharges, expectedNet, ...feeAuthority } =
        authority;
      const prepared = source([
        {
          entryAt: "2026-07-01T13:30:00.000000000Z",
          exitAt: "2026-07-01T13:31:00.000000000Z",
          netPnl: "-10",
        },
        {
          entryAt: "2026-07-01T13:32:00.000000000Z",
          exitAt: "2026-07-01T13:33:00.000000000Z",
          grossPnl: "10",
          signedCharges,
          netPnl: signedCharges === "0" ? "10" : "8",
          quantity: "4",
          feeAuthority,
        },
      ]);
      const compiled = compileReduceSizeAfterLossPreset(
        prepared.sourceQueryPlan,
        prepared.fixture.authority,
        {},
      );
      if (!compiled.ok) throw new Error(compiled.error.code);
      const result = run(prepared, compiled.value);
      if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
      expect(result.value.tradeOutcomes[1]).toMatchObject({
        classification: "executed_resized",
        resizeEconomics: {
          state: "evaluated",
          value: {
            simulatedCharges: expectedCharges,
            simulatedChargesAuthority: "exact",
            simulatedNetPnl: expectedNet,
            simulatedNetPnlAuthority: "exact",
          },
        },
      });
      expect(result.value.resizeSummary).toMatchObject({
        exactNetComparisonCount: "1",
        unavailableNetComparisonCount: "0",
      });
    }
  });

  it("uses strict completion, ignores gain and flat, and consumes a zero-share resize once", () => {
    const equal = source([
      {
        entryAt: "2026-07-01T13:30:00.000000000Z",
        exitAt: "2026-07-01T13:35:00.000000000Z",
        netPnl: "-10",
      },
      {
        entryAt: "2026-07-01T13:35:00.000000000Z",
        exitAt: "2026-07-01T13:36:00.000000000Z",
        netPnl: "4",
        quantity: "2",
        feeAuthority: { state: "explicitly_zero" },
      },
      {
        entryAt: "2026-07-01T13:37:00.000000000Z",
        exitAt: "2026-07-01T13:38:00.000000000Z",
        netPnl: "4",
        quantity: "1",
        feeAuthority: { state: "explicitly_zero" },
      },
      {
        entryAt: "2026-07-01T13:39:00.000000000Z",
        exitAt: "2026-07-01T13:40:00.000000000Z",
        netPnl: "4",
        quantity: "4",
        feeAuthority: { state: "explicitly_zero" },
      },
    ]);
    const compiled = compileReduceSizeAfterLossPreset(
      equal.sourceQueryPlan,
      equal.fixture.authority,
      {},
    );
    if (!compiled.ok) throw new Error(compiled.error.code);
    const result = run(equal, compiled.value);
    if (!result.ok) throw new Error(result.error.code);
    expect(result.value.tradeOutcomes.map((outcome) =>
      outcome.classification)).toEqual([
        "executed_unchanged",
        "executed_unchanged",
        "excluded_zero_simulated_size",
        "executed_unchanged",
      ]);
    expect(result.value.resizeSummary).toMatchObject({
      resizedCount: "0",
      zeroSizeExclusionCount: "1",
      originalAggregateQuantity: "1",
      simulatedAggregateQuantity: "0",
    });

    for (const netPnl of ["0", "5"]) {
      const noTrigger = source([
        {
          entryAt: "2026-07-01T13:30:00.000000000Z",
          exitAt: "2026-07-01T13:31:00.000000000Z",
          netPnl,
        },
        {
          entryAt: "2026-07-01T13:32:00.000000000Z",
          exitAt: "2026-07-01T13:33:00.000000000Z",
          netPnl: "4",
          quantity: "4",
          feeAuthority: { state: "explicitly_zero" },
        },
      ]);
      const noTriggerPreset = compileReduceSizeAfterLossPreset(
        noTrigger.sourceQueryPlan,
        noTrigger.fixture.authority,
        {},
      );
      if (!noTriggerPreset.ok) throw new Error(noTriggerPreset.error.code);
      const noTriggerResult = run(noTrigger, noTriggerPreset.value);
      if (!noTriggerResult.ok) throw new Error(noTriggerResult.error.code);
      expect(noTriggerResult.value.resizedCount).toBe("0");
    }
  });

  it("preserves pending state across higher-precedence and source exclusions but resets by session", () => {
    const prepared = source([
      {
        entryAt: "2026-07-01T13:30:00.000000000Z",
        exitAt: "2026-07-01T13:31:00.000000000Z",
        netPnl: "-10",
      },
      {
        entryAt: "2026-07-01T13:32:00.000000000Z",
        exitAt: "2026-07-01T13:33:00.000000000Z",
        netPnl: "-3",
        direction: "short",
      },
      {
        entryAt: "2026-07-01T13:34:00.000000000Z",
        exitAt: "2026-07-01T13:35:00.000000000Z",
        netPnl: "8",
        quantity: "4",
        feeAuthority: { state: "explicitly_zero" },
      },
      {
        entryAt: "2026-07-02T13:30:00.000000000Z",
        exitAt: "2026-07-02T13:31:00.000000000Z",
        sessionDate: "2026-07-02",
        netPnl: "8",
        quantity: "4",
        feeAuthority: { state: "explicitly_zero" },
      },
    ]);
    const result = executeCounterfactualSimulation({
      source: prepared.fixture.source,
      partitionReceipt: prepared.fixture.partition,
      sourceQueryResult: prepared.sourceQueryResult,
      simulationPlan: directPlan(prepared.sourceQueryPlan, [
        {
          ruleId: "long_only_first",
          kind: "direction_only",
          precedence: "1",
          action: "exclude_trade",
          allowedDirection: "long",
        },
        {
          ruleId: "resize_second",
          kind: "reduce_size_after_loss",
          precedence: "2",
          action: "resize_next_eligible_trade",
          reductionMultiplier: "0.5",
          triggerPolicy: "completed_retained_exact_net_loss_v1",
          consumptionPolicy: "consume_one_next_rule_eligible_trade_v1",
          sizingPolicy: "floor_to_whole_share_minimum_one_v1",
          feePolicy: "complete_declared_components_only_v1",
        },
      ]),
    });
    if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
    expect(result.value.tradeOutcomes.map((outcome) =>
      outcome.classification)).toEqual([
        "executed_unchanged",
        "skipped_by_rule",
        "executed_resized",
        "executed_unchanged",
      ]);
  });

  it("keeps gross exact while partial, estimated, missing, and legacy fees stay non-exact", () => {
    const authorities = [
      {
        state: "broker_reported_partial",
        components: [{ kind: "quantity_variable", signedAmount: "-1" }],
        reasonCode: "ti_v3_test_partial_fees",
      },
      {
        state: "estimated",
        components: [{ kind: "quantity_variable", signedAmount: "-1" }],
        reasonCode: "ti_v3_test_estimated_fees",
      },
      {
        state: "not_included",
        reasonCode: "ti_v3_test_fees_not_included",
      },
      {
        state: "unavailable",
        reasonCode: "ti_v3_test_fees_unavailable",
      },
      {
        state: "broker_reported_complete",
        components: [{ kind: "unknown_undecomposed", signedAmount: "-2" }],
      },
    ] as const;
    const expected = [
      "executed_resized_net_incomplete",
      "executed_resized_net_estimated",
      "executed_resized_net_unavailable",
      "executed_resized_net_unavailable",
      "executed_resized_net_unavailable",
    ];
    for (let index = 0; index < authorities.length; index += 1) {
      const prepared = source([
        {
          entryAt: "2026-07-01T13:30:00.000000000Z",
          exitAt: "2026-07-01T13:31:00.000000000Z",
          netPnl: "-10",
        },
        {
          entryAt: "2026-07-01T13:32:00.000000000Z",
          exitAt: "2026-07-01T13:33:00.000000000Z",
          grossPnl: "10",
          signedCharges: index === 4 ? "-2" : "0",
          netPnl: index === 4 ? "8" : "10",
          quantity: "4",
          feeAuthority: authorities[index],
        },
      ]);
      const compiled = compileReduceSizeAfterLossPreset(
        prepared.sourceQueryPlan,
        prepared.fixture.authority,
        {},
      );
      if (!compiled.ok) throw new Error(compiled.error.code);
      const result = run(prepared, compiled.value);
      if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
      expect(result.value.tradeOutcomes[1].classification).toBe(expected[index]);
      expect(result.value.tradeOutcomes[1].resizeEconomics).toMatchObject({
        state: "evaluated",
        value: {
          simulatedGrossPnl: { numerator: "5", denominator: "1" },
          simulatedGrossPnlAuthority: "exact",
          simulatedNetPnl: null,
        },
      });
      expect(result.value.simulatedNetPnl).toBeNull();
      expect(result.value.netPnlDifference).toBeNull();
      expect(result.value.effect).toBe("not_comparable");
      if (index === 4) {
        expect(result.value.tradeOutcomes[1]).toMatchObject({
          classification: "executed_resized_net_unavailable",
          reasonCode: "ti_v3_simulation_resize_net_unavailable",
          resizeEconomics: {
            state: "evaluated",
            value: {
              simulatedCharges: null,
              simulatedChargesAuthority: "unavailable",
              simulatedNetPnl: null,
              simulatedNetPnlAuthority: "unavailable",
              limitationCodes: expect.arrayContaining([
                "ti_v3_simulation_legacy_undecomposed_fee",
              ]),
            },
          },
        });
        expect(result.value.resizeSummary).toMatchObject({
          exactNetComparisonCount: "0",
          unavailableNetComparisonCount: "1",
        });
        expect(result.value.evidence.find((bucket) =>
          bucket.category === "exact_net_resized_trades")).toMatchObject({
          totalQualifyingCount: "0",
        });
        expect(result.value.evidence.find((bucket) =>
          bucket.category === "fee_authority_limited_resized_trades"))
          .toMatchObject({
            totalQualifyingCount: "1",
            emittedCount: "1",
          });

        const { resultDigest: _digest, ...resultBody } = result.value;
        void _digest;
        const originalOutcome = result.value.tradeOutcomes[1];
        const originalEconomics = originalOutcome.resizeEconomics;
        if (
          originalEconomics.state !== "evaluated" ||
          originalEconomics.value === null
        ) {
          throw new Error("expected evaluated resize economics");
        }
        const tamperedBody = {
          ...resultBody,
          tradeOutcomes: result.value.tradeOutcomes.map((outcome, outcomeIndex) =>
            outcomeIndex === 1
              ? {
                  ...originalOutcome,
                  classification: "executed_resized",
                  reasonCode: "ti_v3_simulation_resize_executed_exact_net",
                  resizeEconomics: {
                    state: "evaluated",
                    value: {
                      ...originalEconomics.value,
                      simulatedCharges: {
                        numerator: "-1",
                        denominator: "1",
                        currency: "USD",
                      },
                      simulatedChargesAuthority: "exact",
                      simulatedNetPnl: {
                        numerator: "4",
                        denominator: "1",
                        currency: "USD",
                      },
                      simulatedNetPnlAuthority: "exact",
                    },
                  },
                }
              : outcome
          ),
        };
        const tampered = finalizeContentAddressedAuthority(
          "counterfactual_simulation_result",
          tamperedBody,
          "resultDigest",
        );
        if (!tampered.ok) throw new Error(tampered.error.code);
        expect(verifyAndReplayCounterfactualSimulationResult({
          source: prepared.fixture.source,
          partitionReceipt: prepared.fixture.partition,
          sourceQueryResult: prepared.sourceQueryResult,
          persistedResult: tampered.value,
        })).toMatchObject({ ok: false });
      }
    }
  });

  it("fails closed at a later completion boundary when resized net is unavailable", () => {
    const prepared = source([
      {
        entryAt: "2026-07-01T13:30:00.000000000Z",
        exitAt: "2026-07-01T13:31:00.000000000Z",
        netPnl: "-10",
      },
      {
        entryAt: "2026-07-01T13:32:00.000000000Z",
        exitAt: "2026-07-01T13:33:00.000000000Z",
        grossPnl: "10",
        netPnl: "10",
        quantity: "4",
        feeAuthority: {
          state: "not_included",
          reasonCode: "ti_v3_test_not_included",
        },
      },
      {
        entryAt: "2026-07-01T13:34:00.000000000Z",
        exitAt: "2026-07-01T13:35:00.000000000Z",
        netPnl: "1",
      },
    ]);
    const compiled = compileReduceSizeAfterLossPreset(
      prepared.sourceQueryPlan,
      prepared.fixture.authority,
      {},
    );
    if (!compiled.ok) throw new Error(compiled.error.code);
    expect(run(prepared, compiled.value)).toMatchObject({
      ok: false,
      error: {
        code: "ti_v3_simulation_completed_net_authority_unavailable",
      },
    });
  });

  it("fails closed for absent, zero, negative, and fractional quantity authority", () => {
    const cases = [
      {
        quantity: null,
        classification: "resize_unavailable_quantity",
        reason: "ti_v3_simulation_resize_quantity_authority_unavailable",
      },
      {
        quantity: "0",
        classification: "resize_unavailable_quantity",
        reason: "ti_v3_simulation_resize_positive_quantity_required",
      },
      {
        quantity: "2.5",
        classification: "resize_unavailable_quantity",
        reason: "ti_v3_simulation_resize_whole_share_quantity_required",
      },
    ] as const;
    for (const item of cases) {
      const prepared = source([
        {
          entryAt: "2026-07-01T13:30:00.000000000Z",
          exitAt: "2026-07-01T13:31:00.000000000Z",
          netPnl: "-1",
        },
        {
          entryAt: "2026-07-01T13:32:00.000000000Z",
          exitAt: "2026-07-01T13:33:00.000000000Z",
          netPnl: "2",
          quantity: item.quantity,
          feeAuthority: { state: "explicitly_zero" },
        },
      ]);
      const compiled = compileReduceSizeAfterLossPreset(
        prepared.sourceQueryPlan,
        prepared.fixture.authority,
        {},
      );
      if (!compiled.ok) throw new Error(compiled.error.code);
      const result = run(prepared, compiled.value);
      if (!result.ok) throw new Error(result.error.code);
      expect(result.value.tradeOutcomes[1]).toMatchObject({
        classification: item.classification,
        reasonCode: item.reason,
      });
    }
    const template = buildSyntheticQueryFixture(1).derived.datasetReceipt.rows[0];
    const { rowDigest: _rowDigest, ...negativeContent } = template;
    void _rowDigest;
    expect(buildAnalyticalRow({
      ...negativeContent,
      shareQuantity: { state: "available", quantity: "-1" },
    })).toMatchObject({ ok: false });

    const nonTerminating = source([
      {
        entryAt: "2026-07-01T13:30:00.000000000Z",
        exitAt: "2026-07-01T13:31:00.000000000Z",
        netPnl: "-1",
      },
      {
        entryAt: "2026-07-01T13:32:00.000000000Z",
        exitAt: "2026-07-01T13:33:00.000000000Z",
        grossPnl: "1",
        netPnl: "1",
        quantity: "3",
        feeAuthority: { state: "explicitly_zero" },
      },
    ]);
    const nonTerminatingPreset = compileReduceSizeAfterLossPreset(
      nonTerminating.sourceQueryPlan,
      nonTerminating.fixture.authority,
      {},
    );
    if (!nonTerminatingPreset.ok) {
      throw new Error(nonTerminatingPreset.error.code);
    }
    const nonTerminatingResult = run(
      nonTerminating,
      nonTerminatingPreset.value,
    );
    if (!nonTerminatingResult.ok) {
      throw new Error(nonTerminatingResult.error.code);
    }
    expect(nonTerminatingResult.value.tradeOutcomes[1]).toMatchObject({
      classification: "executed_resized",
      simulatedNetPnl: null,
      resizeEconomics: {
        state: "evaluated",
        value: {
          simulatedNetPnl: { numerator: "1", denominator: "3" },
          simulatedNetPnlAuthority: "exact",
        },
      },
    });
    expect(nonTerminatingResult.value).toMatchObject({
      simulatedNetPnl: null,
      netPnlDifference: null,
      effect: "not_comparable",
    });
  });

  it("does not trigger from a source-filtered loss and leaves inactive resize snapshots unevaluated", () => {
    const prepared = source([
      {
        entryAt: "2026-07-01T13:30:00.000000000Z",
        exitAt: "2026-07-01T13:31:00.000000000Z",
        netPnl: "-10",
        direction: "short",
      },
      {
        entryAt: "2026-07-01T13:32:00.000000000Z",
        exitAt: "2026-07-01T13:33:00.000000000Z",
        netPnl: "4",
        quantity: "4",
        feeAuthority: { state: "explicitly_zero" },
      },
    ], {
      filters: [{ kind: "direction", values: ["long"] }],
    });
    const compiled = compileReduceSizeAfterLossPreset(
      prepared.sourceQueryPlan,
      prepared.fixture.authority,
      {},
    );
    if (!compiled.ok) throw new Error(compiled.error.code);
    const result = run(prepared, compiled.value);
    if (!result.ok) throw new Error(result.error.code);
    expect(result.value.tradeOutcomes.map((outcome) =>
      outcome.classification)).toEqual([
        "excluded_source_filter",
        "executed_unchanged",
      ]);

    const direction = compileExcludePriceRangePreset(
      prepared.sourceQueryPlan,
      prepared.fixture.authority,
      { lowerEntryPrice: "5", upperEntryPrice: "15" },
    );
    if (!direction.ok) throw new Error(direction.error.code);
    const inactive = run(prepared, direction.value);
    if (!inactive.ok) throw new Error(inactive.error.code);
    expect(inactive.value.tradeOutcomes[0].sessionStateBefore)
      .toMatchObject({
        pendingResizeAfterLossRuleIds: {
          state: "not_evaluated",
          value: null,
        },
      });
  });

  it("isolates pending resize by owner and account", () => {
    for (const boundary of ["owner", "account"] as const) {
      const prepared = source([
        {
          entryAt: "2026-07-01T13:30:00.000000000Z",
          exitAt: "2026-07-01T13:31:00.000000000Z",
          netPnl: "-10",
          owner: "owner_resize_a",
          account: "account_resize_a",
        },
        {
          entryAt: "2026-07-01T13:32:00.000000000Z",
          exitAt: "2026-07-01T13:33:00.000000000Z",
          netPnl: "4",
          quantity: "4",
          feeAuthority: { state: "explicitly_zero" },
          owner: boundary === "owner" ? "owner_resize_b" : "owner_resize_a",
          account: boundary === "account"
            ? "account_resize_b"
            : "account_resize_a",
        },
      ]);
      const compiled = compileReduceSizeAfterLossPreset(
        prepared.sourceQueryPlan,
        prepared.fixture.authority,
        {},
      );
      if (!compiled.ok) throw new Error(compiled.error.code);
      const result = run(prepared, compiled.value);
      if (!result.ok) throw new Error(result.error.code);
      expect(result.value.resizedCount).toBe("0");
    }
  });

  it("composes deterministically with cooldown, session-stop, ticker-attempt, and after-outcome rules", () => {
    const rows = [
      {
        entryAt: "2026-07-01T13:30:00.000000000Z",
        exitAt: "2026-07-01T13:31:00.000000000Z",
        netPnl: "-10",
        quantity: "4",
      },
      {
        entryAt: "2026-07-01T13:32:00.000000000Z",
        exitAt: "2026-07-01T13:32:30.000000000Z",
        netPnl: "4",
        quantity: "4",
        feeAuthority: { state: "explicitly_zero" },
      },
      {
        entryAt: "2026-07-01T13:33:00.000000000Z",
        exitAt: "2026-07-01T13:34:00.000000000Z",
        netPnl: "4",
        quantity: "4",
        feeAuthority: { state: "explicitly_zero" },
      },
    ] as const;
    const resizeRule = {
      ruleId: "resize_after_loss",
      kind: "reduce_size_after_loss",
      precedence: "2",
      action: "resize_next_eligible_trade",
      reductionMultiplier: "0.5",
      triggerPolicy: "completed_retained_exact_net_loss_v1",
      consumptionPolicy: "consume_one_next_rule_eligible_trade_v1",
      sizingPolicy: "floor_to_whole_share_minimum_one_v1",
      feePolicy: "complete_declared_components_only_v1",
    } as const;
    const runRules = (rules: readonly unknown[]) => {
      const prepared = source(rows);
      const result = executeCounterfactualSimulation({
        source: prepared.fixture.source,
        partitionReceipt: prepared.fixture.partition,
        sourceQueryResult: prepared.sourceQueryResult,
        simulationPlan: directPlan(prepared.sourceQueryPlan, rules),
      });
      if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
      return result.value;
    };
    expect(runRules([{
      ruleId: "cooldown_first",
      kind: "wait_after_loss",
      precedence: "1",
      action: "cooldown",
      cooldownSeconds: "120",
      triggerOutcome: "loss",
      expiryPolicy: "entry_at_or_after_expiry_is_eligible_v1",
    }, resizeRule]).tradeOutcomes.map((outcome) =>
      outcome.classification)).toEqual([
        "executed_unchanged",
        "skipped_during_cooldown",
        "executed_resized",
      ]);
    expect(runRules([{
      ruleId: "session_stop_first",
      kind: "stop_after_consecutive_losses",
      precedence: "1",
      action: "stop_session",
      consecutiveLossThreshold: "1",
      flatTradePolicy: "flat_resets_loss_streak_v1",
    }, resizeRule]).resizedCount).toBe("0");
    expect(runRules([{
      ruleId: "attempt_first",
      kind: "maximum_attempts_per_ticker",
      precedence: "1",
      action: "exclude_trade",
      maximumAttempts: "1",
      countPolicy: "retained_simulated_entries_per_stable_instrument_v1",
    }, resizeRule]).resizedCount).toBe("0");
    expect(runRules([{
      ruleId: "after_loss_first",
      kind: "after_outcome_exclusion",
      precedence: "1",
      action: "exclude_next_eligible_trade",
      triggerOutcome: "loss",
      consumptionPolicy: "consume_one_next_rule_eligible_trade_v1",
      nonMatchingOutcomePolicy:
        "pending_exclusion_remains_until_consumed_v1",
    }, resizeRule]).tradeOutcomes.map((outcome) =>
      outcome.classification)).toEqual([
        "executed_unchanged",
        "skipped_by_rule",
        "executed_resized",
      ]);
  });
});
