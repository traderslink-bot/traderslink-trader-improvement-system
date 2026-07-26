import { describe, expect, it } from "vitest";

import {
  buildAnalyticalRow,
  buildCounterfactualSimulationPlan,
  buildSyntheticQueryFixture,
  buildSyntheticQueryFixtureFromRows,
  compileAfterOutcomeExclusionPreset,
  compileDirectionOnlyPreset,
  compileExcludePriceRangePreset,
  compileMaximumAttemptsPerTickerPreset,
  compileMaximumTradesPerDayPreset,
  compileNoNewTradesAfterTimePreset,
  compileReduceSizeAfterLossPreset,
  compileSkipFourthAndLaterTradesPreset,
  compileSkipRepeatAttemptsPreset,
  compileStopAfterConsecutiveLossesPreset,
  compileStopAfterDailyDollarDrawdownPreset,
  compileStopAfterLosingTickerAttemptsPreset,
  compileStopAfterProfitGivebackPreset,
  compileWaitAfterLossPreset,
  COUNTERFACTUAL_SIMULATION_PLAN_VERSION,
  COUNTERFACTUAL_SIMULATION_POLICIES,
  COUNTERFACTUAL_SIMULATION_SEMANTIC_VERSION,
  executeCounterfactualSimulation,
  executeTradeQuery,
  issueCounterfactualSimulationReplayEnvelope,
  replayCounterfactualSimulationEnvelope,
  verifyAndReplayCounterfactualSimulationResult,
  type CompiledRepresentativeSimulationPreset,
} from "../../analytics";

const enabled = process.env.TI_V3_GA1_C_SCALE_PROOF === "1";
const ROW_COUNT = 10_000;
const FIXTURE_ID = "ti_v3_ga1_c_fixed_seed_20260726_v1";

function exactFeeFixture(reverseRows = false) {
  const source = buildSyntheticQueryFixture(ROW_COUNT);
  const rows = source.derived.datasetReceipt.rows.map((row) => {
    const { rowDigest: _rowDigest, ...content } = row;
    void _rowDigest;
    const rebuilt = buildAnalyticalRow({
      ...content,
      signedCharges: "0",
      netPnl: row.grossPnl,
      shareQuantity: { state: "available", quantity: "4" },
      feeAuthority: { state: "explicitly_zero" },
    });
    if (!rebuilt.ok) {
      throw new Error(`${rebuilt.error.code}:${rebuilt.error.path}`);
    }
    return rebuilt.value;
  });
  return buildSyntheticQueryFixtureFromRows(rows, reverseRows);
}

function queried(reverseRows = false) {
  const fixture = exactFeeFixture(reverseRows);
  const plan = fixture.plan({
    grouping: { kind: "aggregate" },
    metrics: [
      "candidate_count",
      "included_count",
      "excluded_count",
      "win_count",
      "loss_count",
      "flat_count",
      "net_pnl",
    ],
  });
  const result = executeTradeQuery({
    source: fixture.source,
    partitionReceipt: fixture.partition,
    queryPlan: plan,
  });
  if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
  return { fixture, plan, result: result.value };
}

function genericPlan(prepared: ReturnType<typeof queried>) {
  return buildCounterfactualSimulationPlan({
    schemaVersion: COUNTERFACTUAL_SIMULATION_PLAN_VERSION,
    semanticVersion: COUNTERFACTUAL_SIMULATION_SEMANTIC_VERSION,
    planOrigin: "generic_plan",
    sourceQueryPlan: prepared.plan,
    rules: [{
      ruleId: "scale_direction",
      kind: "direction_only",
      precedence: "1",
      action: "exclude_trade",
      allowedDirection: "long",
    }],
    policies: COUNTERFACTUAL_SIMULATION_POLICIES,
    limits: {
      sourceRowLimit: "10000",
      affectedTradeLimit: "10000",
      sessionSummaryLimit: "2000",
      evidenceTradeLimit: "512",
      diagnosticLimit: "128",
    },
  }, prepared.fixture.authority);
}

function executeGoverned(
  prepared: ReturnType<typeof queried>,
  compiled: CompiledRepresentativeSimulationPreset,
) {
  const result = executeCounterfactualSimulation({
    source: prepared.fixture.source,
    partitionReceipt: prepared.fixture.partition,
    sourceQueryResult: prepared.result,
    simulationPlan: compiled.plan,
  });
  if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
  expect(result.value.tradeOutcomes).toHaveLength(ROW_COUNT);
  expect(BigInt(result.value.evidence.reduce(
    (count, bucket) => count + Number(bucket.emittedCount),
    0,
  ))).toBeLessThanOrEqual(BigInt(6 * 512));
  const replayed = verifyAndReplayCounterfactualSimulationResult({
    source: prepared.fixture.source,
    partitionReceipt: prepared.fixture.partition,
    sourceQueryResult: prepared.result,
    persistedResult: result.value,
  });
  expect(replayed).toMatchObject({
    ok: true,
    value: { resultDigest: result.value.resultDigest },
  });
  const envelope = issueCounterfactualSimulationReplayEnvelope({
    source: prepared.fixture.source,
    partitionReceipt: prepared.fixture.partition,
    sourceQueryResult: prepared.result,
    simulationPlan: compiled.plan,
    persistedResult: result.value,
    planOrigin: "governed_preset",
    compiledPreset: compiled,
  });
  if (!envelope.ok) throw new Error(`${envelope.error.code}:${envelope.error.path}`);
  const receipt = replayCounterfactualSimulationEnvelope({
    source: prepared.fixture.source,
    partitionReceipt: prepared.fixture.partition,
    sourceQueryResult: prepared.result,
    simulationPlan: compiled.plan,
    persistedResult: result.value,
    compiledPreset: compiled,
    envelope: envelope.value,
  });
  expect(receipt).toMatchObject({
    ok: true,
    value: { result: { resultDigest: result.value.resultDigest } },
  });
  return result.value;
}

describe.skipIf(!enabled)("GA1-C fixed-seed 10,000-row final proof", () => {
  it("executes generic and every governed preset with bounded deterministic replay", () => {
    process.stdout.write(`${JSON.stringify({
      stage: "fixture_identity",
      fixtureId: FIXTURE_ID,
      rowCount: ROW_COUNT,
    })}\n`);
    const prepared = queried();
    expect(prepared.result).toMatchObject({
      candidateCount: String(ROW_COUNT),
      includedCount: String(ROW_COUNT),
    });
    const generic = genericPlan(prepared);
    if (!generic.ok) throw new Error(`${generic.error.code}:${generic.error.path}`);
    const genericResult = executeCounterfactualSimulation({
      source: prepared.fixture.source,
      partitionReceipt: prepared.fixture.partition,
      sourceQueryResult: prepared.result,
      simulationPlan: generic.value,
    });
    if (!genericResult.ok) {
      throw new Error(`${genericResult.error.code}:${genericResult.error.path}`);
    }
    expect(genericResult.value.tradeOutcomes).toHaveLength(ROW_COUNT);
    const genericEnvelope = issueCounterfactualSimulationReplayEnvelope({
      source: prepared.fixture.source,
      partitionReceipt: prepared.fixture.partition,
      sourceQueryResult: prepared.result,
      simulationPlan: generic.value,
      persistedResult: genericResult.value,
      planOrigin: "generic_plan",
    });
    if (!genericEnvelope.ok) {
      throw new Error(`${genericEnvelope.error.code}:${genericEnvelope.error.path}`);
    }
    expect(replayCounterfactualSimulationEnvelope({
      source: prepared.fixture.source,
      partitionReceipt: prepared.fixture.partition,
      sourceQueryResult: prepared.result,
      simulationPlan: generic.value,
      persistedResult: genericResult.value,
      envelope: genericEnvelope.value,
    })).toMatchObject({ ok: true });

    const compilers = [
      () => compileStopAfterConsecutiveLossesPreset(prepared.plan, prepared.fixture.authority, { consecutiveLossThreshold: "2" }),
      () => compileMaximumTradesPerDayPreset(prepared.plan, prepared.fixture.authority, { maximumTrades: "3" }),
      () => compileDirectionOnlyPreset(prepared.plan, prepared.fixture.authority, { allowedDirection: "long" }),
      () => compileStopAfterDailyDollarDrawdownPreset(prepared.plan, prepared.fixture.authority, { maximumDailyDrawdown: "100" }),
      () => compileStopAfterProfitGivebackPreset(prepared.plan, prepared.fixture.authority, { maximumProfitGiveback: "100" }),
      () => compileSkipFourthAndLaterTradesPreset(prepared.plan, prepared.fixture.authority, {}),
      () => compileWaitAfterLossPreset(prepared.plan, prepared.fixture.authority, { cooldownSeconds: "60" }),
      () => compileMaximumAttemptsPerTickerPreset(prepared.plan, prepared.fixture.authority, { maximumAttempts: "2" }),
      () => compileStopAfterLosingTickerAttemptsPreset(prepared.plan, prepared.fixture.authority, { losingAttemptThreshold: "2" }),
      () => compileNoNewTradesAfterTimePreset(prepared.plan, prepared.fixture.authority, { cutoffTime: "15:30:00" }),
      () => compileExcludePriceRangePreset(prepared.plan, prepared.fixture.authority, { lowerEntryPrice: "5", upperEntryPrice: "15" }),
      () => compileSkipRepeatAttemptsPreset(prepared.plan, prepared.fixture.authority, {}),
      () => compileAfterOutcomeExclusionPreset(prepared.plan, prepared.fixture.authority, { triggerOutcome: "loss" }),
      () => compileReduceSizeAfterLossPreset(prepared.plan, prepared.fixture.authority, {}),
    ];
    for (const compile of compilers) {
      const compiled = compile();
      if (!compiled.ok) throw new Error(`${compiled.error.code}:${compiled.error.path}`);
      const result = executeGoverned(prepared, compiled.value);
      process.stdout.write(`${JSON.stringify({
        stage: "governed_preset_complete",
        preset: compiled.value.preset.presetKey,
        resultDigest: result.resultDigest,
      })}\n`);
    }

    const reversed = queried(true);
    const reverseGeneric = genericPlan(reversed);
    if (!reverseGeneric.ok) {
      throw new Error(`${reverseGeneric.error.code}:${reverseGeneric.error.path}`);
    }
    expect(reverseGeneric.value.planDigest).toBe(generic.value.planDigest);
    const reverseResult = executeCounterfactualSimulation({
      source: reversed.fixture.source,
      partitionReceipt: reversed.fixture.partition,
      sourceQueryResult: reversed.result,
      simulationPlan: reverseGeneric.value,
    });
    if (!reverseResult.ok) {
      throw new Error(`${reverseResult.error.code}:${reverseResult.error.path}`);
    }
    expect(reverseResult.value.resultDigest).toBe(genericResult.value.resultDigest);
    process.stdout.write(`${JSON.stringify({
      stage: "scale_run_completion",
      fixtureId: FIXTURE_ID,
      rowCount: ROW_COUNT,
    })}\n`);
  }, 1_200_000);

  it("fails closed at the max-plus-one source boundary", () => {
    expect(() => buildSyntheticQueryFixture(ROW_COUNT + 1)).toThrow();
  }, 120_000);
});
