import { describe, expect, it } from "vitest";

import {
  buildAnalyticalPartitionReceipt,
  buildAnalyticalRow,
  buildCounterfactualSimulationPlan,
  buildSyntheticQueryFixture,
  buildSyntheticQueryFixtureFromRows,
  compileAfterOutcomeExclusionPreset,
  compileReduceSizeAfterLossPreset,
  compileDirectionOnlyPreset,
  compileExcludePriceRangePreset,
  compileMaximumAttemptsPerTickerPreset,
  compileMaximumTradesPerDayPreset,
  compileNoNewTradesAfterTimePreset,
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
  COUNTERFACTUAL_SIMULATION_REPLAY_ENVELOPE_VERSION,
  COUNTERFACTUAL_SIMULATION_REPLAY_LIMITS,
  COUNTERFACTUAL_SIMULATION_REPLAY_SEMANTIC_VERSION,
  executeCounterfactualSimulation,
  executeTradeQuery,
  finalizeContentAddressedAuthority,
  issueCounterfactualSimulationReplayEnvelope,
  replayCounterfactualSimulationEnvelope,
  verifyCounterfactualSimulationReplayReceipt,
  type AnalyticalPartitionReceipt,
  type AnalyticalRow,
  type CompiledRepresentativeSimulationPreset,
  type TradeQueryFilter,
} from "../../analytics";

type RowInput = Readonly<{
  entryAt: string;
  exitAt: string;
  netPnl: string;
  direction?: "long" | "short";
  owner?: string;
  account?: string;
  currency?: "USD" | "EUR";
  instrument?: string;
  entryPrice?: string | null;
  quantity?: string;
  grossPnl?: string;
  signedCharges?: string;
  feeAuthority?: unknown;
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
    semanticRoundTripKey: `ga1_c_replay_${index}`,
    supportingOccurrenceKeys: template.supportingExecutionDigests.map(
      (_, occurrence) => `ga1_c_replay_${index}_${occurrence + 1}`,
    ),
    canonicalOwnerKey: input.owner ?? "owner_ga1_c_replay",
    canonicalAccountKey: input.account ?? "account_ga1_c_replay",
    stableInstrumentKey: input.instrument ?? "instrument_ga1_c_replay",
    displayedSymbol: "REPLAY",
    direction: input.direction ?? "long",
    currency,
    firstEntryAt: input.entryAt,
    finalExitAt: input.exitAt,
    sessionDate: input.exitAt.slice(0, 10),
    weekday: "wednesday",
    session: "regular",
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
    shareQuantity: input.entryPrice === null
      ? {
          state: "unavailable",
          reasonCode: "ti_v3_test_entry_price_unavailable",
        }
      : { state: "available", quantity: input.quantity ?? "1" },
    ...(input.feeAuthority === undefined
      ? {}
      : { feeAuthority: input.feeAuthority }),
  });
  if (!built.ok) throw new Error(`${built.error.code}:${built.error.path}`);
  return built.value;
}

const replayRows = [
  {
    entryAt: "2026-07-01T13:30:00.000000000Z",
    exitAt: "2026-07-01T13:35:00.000000000Z",
    netPnl: "-10",
  },
  {
    entryAt: "2026-07-01T13:36:00.000000000Z",
    exitAt: "2026-07-01T13:40:00.000000000Z",
    netPnl: "5",
  },
  {
    entryAt: "2026-07-01T13:41:00.000000000Z",
    exitAt: "2026-07-01T13:45:00.000000000Z",
    netPnl: "20",
    direction: "short",
    entryPrice: "20",
  },
  {
    entryAt: "2026-07-01T13:46:00.000000000Z",
    exitAt: "2026-07-01T13:50:00.000000000Z",
    netPnl: "-2",
  },
] as const;

function source(
  inputs: readonly RowInput[] = replayRows,
  options: Readonly<{
    reverse?: boolean;
    filters?: readonly TradeQueryFilter[];
    currency?: "USD" | "EUR";
  }> = {},
) {
  const template = buildSyntheticQueryFixture(1).derived.datasetReceipt.rows[0];
  const fixture = buildSyntheticQueryFixtureFromRows(
    inputs.map((input, index) => row(template, index + 1, input)),
    options.reverse ?? false,
  );
  let partition: AnalyticalPartitionReceipt = fixture.partition;
  if (options.currency !== undefined && options.currency !== "USD") {
    const rebuilt = buildAnalyticalPartitionReceipt({
      schemaVersion: "ti_v3_analytical_partition_v1",
      datasetReceipt: fixture.derived.datasetReceipt,
      currency: options.currency,
    });
    if (!rebuilt.ok) throw new Error(rebuilt.error.code);
    partition = rebuilt.value;
  }
  const sourceQueryPlan = fixture.plan({
    filters: options.filters ?? [],
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
    partitionReceipt: partition,
    queryPlan: sourceQueryPlan,
  });
  if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
  return {
    fixture,
    partition,
    sourceQueryPlan,
    sourceQueryResult: result.value,
  };
}

function generic(prepared: ReturnType<typeof source>) {
  const plan = buildCounterfactualSimulationPlan({
    schemaVersion: COUNTERFACTUAL_SIMULATION_PLAN_VERSION,
    semanticVersion: COUNTERFACTUAL_SIMULATION_SEMANTIC_VERSION,
    planOrigin: "generic_plan",
    sourceQueryPlan: prepared.sourceQueryPlan,
    rules: [{
      ruleId: "generic_long_only",
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
  if (!plan.ok) throw new Error(`${plan.error.code}:${plan.error.path}`);
  const result = executeCounterfactualSimulation({
    source: prepared.fixture.source,
    partitionReceipt: prepared.partition,
    sourceQueryResult: prepared.sourceQueryResult,
    simulationPlan: plan.value,
  });
  if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
  return { plan: plan.value, result: result.value };
}

function presetExecution(
  prepared: ReturnType<typeof source>,
  compiled: CompiledRepresentativeSimulationPreset,
) {
  const result = executeCounterfactualSimulation({
    source: prepared.fixture.source,
    partitionReceipt: prepared.partition,
    sourceQueryResult: prepared.sourceQueryResult,
    simulationPlan: compiled.plan,
  });
  if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
  return result.value;
}

function issueGeneric(prepared: ReturnType<typeof source>) {
  const executed = generic(prepared);
  const envelope = issueCounterfactualSimulationReplayEnvelope({
    source: prepared.fixture.source,
    partitionReceipt: prepared.partition,
    sourceQueryResult: prepared.sourceQueryResult,
    simulationPlan: executed.plan,
    persistedResult: executed.result,
    planOrigin: "generic_plan",
  });
  if (!envelope.ok) {
    throw new Error(`${envelope.error.code}:${envelope.error.path}`);
  }
  return { ...executed, envelope: envelope.value };
}

function issueGoverned(
  prepared: ReturnType<typeof source>,
  compiled: CompiledRepresentativeSimulationPreset,
) {
  const result = presetExecution(prepared, compiled);
  const envelope = issueCounterfactualSimulationReplayEnvelope({
    source: prepared.fixture.source,
    partitionReceipt: prepared.partition,
    sourceQueryResult: prepared.sourceQueryResult,
    simulationPlan: compiled.plan,
    persistedResult: result,
    planOrigin: "governed_preset",
    compiledPreset: compiled,
  });
  if (!envelope.ok) {
    throw new Error(`${envelope.error.code}:${envelope.error.path}`);
  }
  return { result, envelope: envelope.value };
}

function redigestEnvelope(input: Record<string, unknown>) {
  const result = finalizeContentAddressedAuthority(
    "counterfactual_simulation_replay_envelope",
    input,
    "envelopeDigest",
  );
  if (!result.ok) throw new Error(result.error.code);
  return result.value;
}

function redigestResult(input: Record<string, unknown>) {
  const result = finalizeContentAddressedAuthority(
    "counterfactual_simulation_result",
    input,
    "resultDigest",
  );
  if (!result.ok) throw new Error(result.error.code);
  return result.value;
}

describe("GA1-C persisted simulation replay envelope", () => {
  it("replays a generic plan and issues one deterministic exact receipt", () => {
    const prepared = source();
    const issued = issueGeneric(prepared);
    expect(issued.envelope).toMatchObject({
      schemaVersion: COUNTERFACTUAL_SIMULATION_REPLAY_ENVELOPE_VERSION,
      semanticVersion: COUNTERFACTUAL_SIMULATION_REPLAY_SEMANTIC_VERSION,
      sourceQueryPlanDigest:
        prepared.sourceQueryResult.normalizedQueryPlan.queryPlanDigest,
      sourceQueryResultDigest: prepared.sourceQueryResult.resultDigest,
      simulationPlanDigest: issued.plan.planDigest,
      persistedSimulationResultDigest: issued.result.resultDigest,
      requiredSimulationAuthorityScope:
        "verified_ga1_a_query_result_and_execution_rows_v1",
      planOrigin: "generic_plan",
      governedPresetReference: null,
      artifactReferences: expect.arrayContaining([
        expect.objectContaining({ artifactKind: "simulation_result" }),
      ]),
      replayBounds: {
        artifactReferenceLimit: "8",
        diagnosticLimit: "128",
        reconstructionEvidenceLimit: "0",
        receiptCollectionLimit: "1",
      },
    });
    expect(issued.envelope.artifactReferences).toHaveLength(7);
    const replay = () => replayCounterfactualSimulationEnvelope({
      source: prepared.fixture.source,
      partitionReceipt: prepared.partition,
      sourceQueryResult: prepared.sourceQueryResult,
      simulationPlan: issued.plan,
      persistedResult: issued.result,
      envelope: issued.envelope,
    });
    const first = replay();
    const second = replay();
    expect(first, JSON.stringify(first)).toMatchObject({
      ok: true,
      value: {
        result: { resultDigest: issued.result.resultDigest },
        receipt: {
          replayEnvelopeDigest: issued.envelope.envelopeDigest,
          reconstructedQueryPlanDigest:
            prepared.sourceQueryResult.normalizedQueryPlan.queryPlanDigest,
          reconstructedSimulationPlanDigest: issued.plan.planDigest,
          reconstructedSimulationResultDigest: issued.result.resultDigest,
          expectedPersistedResultDigest: issued.result.resultDigest,
          replayVerificationStatus: "verified",
          mismatchStage: null,
          diagnosticCodes: [],
          diagnostics: [],
        },
      },
    });
    expect(second, JSON.stringify(second)).toMatchObject({ ok: true });
    if (!first.ok || !second.ok) return;
    expect(first.value.receipt.receiptDigest)
      .toBe(second.value.receipt.receiptDigest);
    expect(verifyCounterfactualSimulationReplayReceipt({
      envelope: issued.envelope,
      receipt: clone(first.value.receipt),
    })).toMatchObject({
      ok: true,
      value: { receiptDigest: first.value.receipt.receiptDigest },
    });
  });

  it("requires an explicit, plan-bound origin for issuance and replay", () => {
    const prepared = source();
    const direct = generic(prepared);
    const compiled = compileDirectionOnlyPreset(
      prepared.sourceQueryPlan,
      prepared.fixture.authority,
      { allowedDirection: "long" },
    );
    if (!compiled.ok) throw new Error(compiled.error.code);
    const governedResult = presetExecution(prepared, compiled.value);
    const common = {
      source: prepared.fixture.source,
      partitionReceipt: prepared.partition,
      sourceQueryResult: prepared.sourceQueryResult,
      simulationPlan: direct.plan,
      persistedResult: direct.result,
    };

    expect(issueCounterfactualSimulationReplayEnvelope({
      ...common,
      planOrigin: "generic_plan",
      compiledPreset: compiled.value,
    } as never)).toMatchObject({ ok: false, error: { path: "$.compiledPreset" } });
    expect(issueCounterfactualSimulationReplayEnvelope({
      source: prepared.fixture.source,
      partitionReceipt: prepared.partition,
      sourceQueryResult: prepared.sourceQueryResult,
      simulationPlan: compiled.value.plan,
      persistedResult: governedResult,
      planOrigin: "governed_preset",
    } as never)).toMatchObject({ ok: false, error: { path: "$.compiledPreset" } });
    expect(issueCounterfactualSimulationReplayEnvelope({
      source: prepared.fixture.source,
      partitionReceipt: prepared.partition,
      sourceQueryResult: prepared.sourceQueryResult,
      simulationPlan: compiled.value.plan,
      persistedResult: governedResult,
      planOrigin: "generic_plan",
    } as never)).toMatchObject({ ok: false, error: { path: "$.planOrigin" } });
    expect(issueCounterfactualSimulationReplayEnvelope(
      common as never,
    )).toMatchObject({ ok: false, error: { path: "$.planOrigin" } });
    expect(issueCounterfactualSimulationReplayEnvelope({
      ...common,
      planOrigin: "inferred_plan",
    } as never)).toMatchObject({ ok: false, error: { path: "$.planOrigin" } });
    expect(issueCounterfactualSimulationReplayEnvelope({
      ...common,
      planOrigin: "generic_plan",
      planOriginAuthority: "extra",
    } as never)).toMatchObject({ ok: false });

    const governed = issueGoverned(prepared, compiled.value);
    expect(governed.envelope).toMatchObject({
      planOrigin: "governed_preset",
      governedPresetReference: { presetDigest: compiled.value.preset.presetDigest },
      artifactReferences: { length: 8 },
    });
    expect(replayCounterfactualSimulationEnvelope({
      source: prepared.fixture.source,
      partitionReceipt: prepared.partition,
      sourceQueryResult: prepared.sourceQueryResult,
      simulationPlan: compiled.value.plan,
      persistedResult: governedResult,
      envelope: governed.envelope,
    })).toMatchObject({ ok: false, error: { stage: "preset_reconstruction" } });

    const alternate = compileDirectionOnlyPreset(
      prepared.sourceQueryPlan,
      prepared.fixture.authority,
      { allowedDirection: "short" },
    );
    if (!alternate.ok) throw new Error(alternate.error.code);
    expect(issueCounterfactualSimulationReplayEnvelope({
      source: prepared.fixture.source,
      partitionReceipt: prepared.partition,
      sourceQueryResult: prepared.sourceQueryResult,
      simulationPlan: compiled.value.plan,
      persistedResult: governedResult,
      planOrigin: "governed_preset",
      compiledPreset: alternate.value,
    })).toMatchObject({ ok: false, error: { path: "$.compiledPreset.plan" } });
    const foreign = source(replayRows.map((item) => ({
      ...item,
      owner: "owner_ga1_c_foreign_preset",
    })));
    const foreignPreset = compileDirectionOnlyPreset(
      foreign.sourceQueryPlan,
      foreign.fixture.authority,
      { allowedDirection: "long" },
    );
    if (!foreignPreset.ok) throw new Error(foreignPreset.error.code);
    expect(issueCounterfactualSimulationReplayEnvelope({
      source: prepared.fixture.source,
      partitionReceipt: prepared.partition,
      sourceQueryResult: prepared.sourceQueryResult,
      simulationPlan: compiled.value.plan,
      persistedResult: governedResult,
      planOrigin: "governed_preset",
      compiledPreset: foreignPreset.value,
    })).toMatchObject({ ok: false });

    const body = clone(governed.envelope) as unknown as Record<string, unknown>;
    delete body.envelopeDigest;
    const downgraded = redigestEnvelope({
      ...body,
      planOrigin: "generic_plan",
      governedPresetReference: null,
      artifactReferences: governed.envelope.artifactReferences.slice(0, 7),
    });
    expect(replayCounterfactualSimulationEnvelope({
      source: prepared.fixture.source,
      partitionReceipt: prepared.partition,
      sourceQueryResult: prepared.sourceQueryResult,
      simulationPlan: compiled.value.plan,
      persistedResult: governedResult,
      envelope: downgraded,
    })).toMatchObject({ ok: false, error: { stage: "simulation_plan_reconstruction" } });

    const removedReference = redigestEnvelope({
      ...body,
      governedPresetReference: null,
    });
    expect(replayCounterfactualSimulationEnvelope({
      source: prepared.fixture.source,
      partitionReceipt: prepared.partition,
      sourceQueryResult: prepared.sourceQueryResult,
      simulationPlan: compiled.value.plan,
      persistedResult: governedResult,
      compiledPreset: compiled.value,
      envelope: removedReference,
    })).toMatchObject({
      ok: false,
      error: { stage: "replay_envelope_contract", path: "$.planOrigin" },
    });
    const reducedReferences = redigestEnvelope({
      ...body,
      artifactReferences: governed.envelope.artifactReferences.slice(0, 7),
    });
    expect(replayCounterfactualSimulationEnvelope({
      source: prepared.fixture.source,
      partitionReceipt: prepared.partition,
      sourceQueryResult: prepared.sourceQueryResult,
      simulationPlan: compiled.value.plan,
      persistedResult: governedResult,
      compiledPreset: compiled.value,
      envelope: reducedReferences,
    })).toMatchObject({
      ok: false,
      error: {
        stage: "replay_envelope_contract",
        path: "$.artifactReferences",
      },
    });

    const genericIssued = issueGeneric(prepared);
    const genericBody = clone(genericIssued.envelope) as unknown as
      Record<string, unknown>;
    delete genericBody.envelopeDigest;
    const upgraded = redigestEnvelope({
      ...genericBody,
      planOrigin: "governed_preset",
      governedPresetReference: {
        schemaVersion: compiled.value.preset.schemaVersion,
        presetKey: compiled.value.preset.presetKey,
        presetVersion: compiled.value.preset.presetVersion,
        presetDigest: compiled.value.preset.presetDigest,
      },
      artifactReferences: [
        ...genericIssued.envelope.artifactReferences,
        {
          artifactKind: "governed_preset",
          artifactDigest: compiled.value.preset.presetDigest,
        },
      ],
    });
    expect(replayCounterfactualSimulationEnvelope({
      source: prepared.fixture.source,
      partitionReceipt: prepared.partition,
      sourceQueryResult: prepared.sourceQueryResult,
      simulationPlan: genericIssued.plan,
      persistedResult: genericIssued.result,
      compiledPreset: compiled.value,
      envelope: upgraded,
    })).toMatchObject({
      ok: false,
      error: { stage: "simulation_plan_reconstruction" },
    });
    expect(replayCounterfactualSimulationEnvelope({
      source: prepared.fixture.source,
      partitionReceipt: prepared.partition,
      sourceQueryResult: prepared.sourceQueryResult,
      simulationPlan: direct.plan,
      persistedResult: direct.result,
      compiledPreset: compiled.value,
      envelope: genericIssued.envelope,
    })).toMatchObject({ ok: false, error: { stage: "preset_reconstruction" } });
  });

  it("reconstructs every accepted governed execution-only preset", () => {
    const prepared = source();
    const compilers = [
      () => compileStopAfterConsecutiveLossesPreset(
        prepared.sourceQueryPlan,
        prepared.fixture.authority,
        { consecutiveLossThreshold: "2" },
      ),
      () => compileMaximumTradesPerDayPreset(
        prepared.sourceQueryPlan,
        prepared.fixture.authority,
        { maximumTrades: "2" },
      ),
      () => compileDirectionOnlyPreset(
        prepared.sourceQueryPlan,
        prepared.fixture.authority,
        { allowedDirection: "long" },
      ),
      () => compileStopAfterDailyDollarDrawdownPreset(
        prepared.sourceQueryPlan,
        prepared.fixture.authority,
        { maximumDailyDrawdown: "10" },
      ),
      () => compileStopAfterProfitGivebackPreset(
        prepared.sourceQueryPlan,
        prepared.fixture.authority,
        { maximumProfitGiveback: "5" },
      ),
      () => compileSkipFourthAndLaterTradesPreset(
        prepared.sourceQueryPlan,
        prepared.fixture.authority,
        {},
      ),
      () => compileWaitAfterLossPreset(
        prepared.sourceQueryPlan,
        prepared.fixture.authority,
        { cooldownSeconds: "60" },
      ),
      () => compileMaximumAttemptsPerTickerPreset(
        prepared.sourceQueryPlan,
        prepared.fixture.authority,
        { maximumAttempts: "2" },
      ),
      () => compileStopAfterLosingTickerAttemptsPreset(
        prepared.sourceQueryPlan,
        prepared.fixture.authority,
        { losingAttemptThreshold: "2" },
      ),
      () => compileNoNewTradesAfterTimePreset(
        prepared.sourceQueryPlan,
        prepared.fixture.authority,
        { cutoffTime: "13:45:00" },
      ),
      () => compileExcludePriceRangePreset(
        prepared.sourceQueryPlan,
        prepared.fixture.authority,
        { lowerEntryPrice: "5", upperEntryPrice: "15" },
      ),
      () => compileSkipRepeatAttemptsPreset(
        prepared.sourceQueryPlan,
        prepared.fixture.authority,
        {},
      ),
      () => compileAfterOutcomeExclusionPreset(
        prepared.sourceQueryPlan,
        prepared.fixture.authority,
        { triggerOutcome: "loss" },
      ),
      () => compileReduceSizeAfterLossPreset(
        prepared.sourceQueryPlan,
        prepared.fixture.authority,
        {},
      ),
    ];
    for (const compile of compilers) {
      const compiled = compile();
      if (!compiled.ok) throw new Error(compiled.error.code);
      const result = presetExecution(prepared, compiled.value);
      const envelope = issueCounterfactualSimulationReplayEnvelope({
        source: prepared.fixture.source,
        partitionReceipt: prepared.partition,
        sourceQueryResult: prepared.sourceQueryResult,
        simulationPlan: compiled.value.plan,
        persistedResult: result,
        planOrigin: "governed_preset",
        compiledPreset: compiled.value,
      });
      if (!envelope.ok) throw new Error(envelope.error.code);
      expect(envelope.value.governedPresetReference).toMatchObject({
        presetKey: compiled.value.preset.presetKey,
        presetDigest: compiled.value.preset.presetDigest,
      });
      expect(replayCounterfactualSimulationEnvelope({
        source: prepared.fixture.source,
        partitionReceipt: prepared.partition,
        sourceQueryResult: prepared.sourceQueryResult,
        simulationPlan: compiled.value.plan,
        persistedResult: result,
        compiledPreset: compiled.value,
        envelope: envelope.value,
      }), compiled.value.preset.presetKey).toMatchObject({
        ok: true,
        value: { result: { resultDigest: result.resultDigest } },
      });
    }
  });

  it("rejects a re-digested envelope that promotes undecomposed resized fees to exact", () => {
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
        signedCharges: "-2",
        netPnl: "8",
        quantity: "4",
        feeAuthority: {
          state: "broker_reported_complete",
          components: [{
            kind: "unknown_undecomposed",
            signedAmount: "-2",
          }],
        },
      },
    ]);
    const compiled = compileReduceSizeAfterLossPreset(
      prepared.sourceQueryPlan,
      prepared.fixture.authority,
      {},
    );
    if (!compiled.ok) throw new Error(compiled.error.code);
    const issued = issueGoverned(prepared, compiled.value);
    expect(issued.result.resizeSummary).toMatchObject({
      exactNetComparisonCount: "0",
      unavailableNetComparisonCount: "1",
    });

    const { resultDigest: _resultDigest, ...resultBody } = issued.result;
    void _resultDigest;
    const tamperedResult = redigestResult({
      ...resultBody,
      resizeSummary: {
        ...issued.result.resizeSummary,
        exactNetComparisonCount: "1",
        unavailableNetComparisonCount: "0",
      },
    });
    const { envelopeDigest: _envelopeDigest, ...envelopeBody } =
      issued.envelope;
    void _envelopeDigest;
    const tamperedEnvelope = redigestEnvelope({
      ...envelopeBody,
      persistedSimulationResultDigest: tamperedResult.resultDigest,
      artifactReferences: issued.envelope.artifactReferences.map((reference) =>
        reference.artifactKind === "simulation_result"
          ? {
              ...reference,
              artifactDigest: tamperedResult.resultDigest,
            }
          : reference
      ),
    });
    expect(replayCounterfactualSimulationEnvelope({
      source: prepared.fixture.source,
      partitionReceipt: prepared.partition,
      sourceQueryResult: prepared.sourceQueryResult,
      simulationPlan: compiled.value.plan,
      persistedResult: tamperedResult,
      compiledPreset: compiled.value,
      envelope: tamperedEnvelope,
    })).toMatchObject({ ok: false });
  });

  it("rejects substituted source, partition, query-result, and plan authority", () => {
    const prepared = source();
    const issued = issueGeneric(prepared);
    const replay = (overrides: Record<string, unknown>) =>
      replayCounterfactualSimulationEnvelope({
        source: prepared.fixture.source,
        partitionReceipt: prepared.partition,
        sourceQueryResult: prepared.sourceQueryResult,
        simulationPlan: issued.plan,
        persistedResult: issued.result,
        envelope: issued.envelope,
        ...overrides,
      });
    expect(replay({
      sourceQueryResult: clone(prepared.sourceQueryResult),
    })).toMatchObject({
      ok: false,
      error: { stage: "source_query_result_authority" },
    });

    for (const foreign of [
      source(replayRows.map((item) => ({
        ...item,
        owner: "owner_synthetic_secondary",
      }))),
      source(replayRows.map((item) => ({
        ...item,
        account: "account_ga1_c_foreign",
      }))),
    ]) {
      expect(replay({
        source: foreign.fixture.source,
        partitionReceipt: foreign.partition,
        sourceQueryResult: foreign.sourceQueryResult,
      })).toMatchObject({
        ok: false,
        error: { stage: "dataset_partition_authority" },
      });
    }
    const currencyEnvelopeBody = clone(issued.envelope) as unknown as
      Record<string, unknown>;
    delete currencyEnvelopeBody.envelopeDigest;
    const foreignCurrencyEnvelope = redigestEnvelope({
      ...currencyEnvelopeBody,
      sourceAuthority: {
        ...issued.envelope.sourceAuthority,
        currency: "EUR",
      },
    });
    expect(replay({ envelope: foreignCurrencyEnvelope })).toMatchObject({
      ok: false,
      error: { stage: "dataset_partition_authority" },
    });
    const foreignPartition = source([...replayRows, {
      entryAt: "2026-07-01T13:51:00.000000000Z",
      exitAt: "2026-07-01T13:55:00.000000000Z",
      netPnl: "1",
    }]);
    expect(replay({
      partitionReceipt: foreignPartition.partition,
    })).toMatchObject({
      ok: false,
      error: { stage: "dataset_partition_authority" },
    });

    const otherPlan = prepared.fixture.plan({
      filters: [{ kind: "direction", values: ["long"] }],
      grouping: { kind: "aggregate" },
      metrics: ["candidate_count", "included_count", "excluded_count"],
    });
    const otherResult = executeTradeQuery({
      source: prepared.fixture.source,
      partitionReceipt: prepared.partition,
      queryPlan: otherPlan,
    });
    if (!otherResult.ok) throw new Error(otherResult.error.code);
    expect(replay({ sourceQueryResult: otherResult.value })).toMatchObject({
      ok: false,
      error: { stage: "source_query_result_authority" },
    });
    const otherSimulation = buildCounterfactualSimulationPlan({
      schemaVersion: COUNTERFACTUAL_SIMULATION_PLAN_VERSION,
      semanticVersion: COUNTERFACTUAL_SIMULATION_SEMANTIC_VERSION,
      planOrigin: "generic_plan",
      sourceQueryPlan: otherPlan,
      rules: [{
        ruleId: "other_plan",
        kind: "direction_only",
        precedence: "1",
        action: "exclude_trade",
        allowedDirection: "long",
      }],
      policies: COUNTERFACTUAL_SIMULATION_POLICIES,
      limits: issued.plan.limits,
    }, prepared.fixture.authority);
    if (!otherSimulation.ok) throw new Error(otherSimulation.error.code);
    expect(replay({
      simulationPlan: otherSimulation.value,
    })).toMatchObject({
      ok: false,
      error: { stage: "simulation_plan_reconstruction" },
    });
  });

  it("rejects altered dependencies, policies, bounds, presets, and results by stage", () => {
    const prepared = source();
    const issued = issueGeneric(prepared);
    const planBody = clone(issued.plan) as unknown as Record<string, unknown>;
    delete planBody.planDigest;
    const alteredPlans = [
      {
        ...planBody,
        stateDependencies: {
          ...issued.plan.stateDependencies,
          completedRealizedOutcome:
            !issued.plan.stateDependencies.completedRealizedOutcome,
        },
      },
      {
        ...planBody,
        policies: {
          ...issued.plan.policies,
          positionSizingPolicy: "tampered_policy",
        },
      },
      {
        ...planBody,
        limits: { ...issued.plan.limits, diagnosticLimit: "127" },
      },
    ].map((body) => {
      const redigested = finalizeContentAddressedAuthority(
        "counterfactual_simulation_plan",
        body,
        "planDigest",
      );
      if (!redigested.ok) throw new Error(redigested.error.code);
      return redigested.value;
    });
    for (const simulationPlan of alteredPlans) {
      expect(replayCounterfactualSimulationEnvelope({
        source: prepared.fixture.source,
        partitionReceipt: prepared.partition,
        sourceQueryResult: prepared.sourceQueryResult,
        simulationPlan,
        persistedResult: issued.result,
        envelope: issued.envelope,
      })).toMatchObject({
        ok: false,
        error: { stage: "simulation_plan_reconstruction" },
      });
    }

    const resultBody = clone(issued.result) as unknown as Record<string, unknown>;
    delete resultBody.resultDigest;
    const alteredResult = redigestResult({
      ...resultBody,
      unavailableCount: "99",
    });
    expect(replayCounterfactualSimulationEnvelope({
      source: prepared.fixture.source,
      partitionReceipt: prepared.partition,
      sourceQueryResult: prepared.sourceQueryResult,
      simulationPlan: issued.plan,
      persistedResult: alteredResult,
      envelope: issued.envelope,
    })).toMatchObject({
      ok: false,
      error: { stage: "result_reconstruction" },
    });

    const compiled = compileDirectionOnlyPreset(
      prepared.sourceQueryPlan,
      prepared.fixture.authority,
      { allowedDirection: "long" },
    );
    if (!compiled.ok) throw new Error(compiled.error.code);
    const presetResult = presetExecution(prepared, compiled.value);
    const presetEnvelope = issueCounterfactualSimulationReplayEnvelope({
      source: prepared.fixture.source,
      partitionReceipt: prepared.partition,
      sourceQueryResult: prepared.sourceQueryResult,
      simulationPlan: compiled.value.plan,
      persistedResult: presetResult,
      planOrigin: "governed_preset",
      compiledPreset: compiled.value,
    });
    if (!presetEnvelope.ok) throw new Error(presetEnvelope.error.code);
    const presetBody = clone(compiled.value.preset) as unknown as
      Record<string, unknown>;
    delete presetBody.presetDigest;
    const tamperedPreset = finalizeContentAddressedAuthority(
      "counterfactual_simulation_preset",
      {
        ...presetBody,
        arguments: { allowedDirection: "short" },
      },
      "presetDigest",
    );
    if (!tamperedPreset.ok) throw new Error(tamperedPreset.error.code);
    expect(replayCounterfactualSimulationEnvelope({
      source: prepared.fixture.source,
      partitionReceipt: prepared.partition,
      sourceQueryResult: prepared.sourceQueryResult,
      simulationPlan: compiled.value.plan,
      persistedResult: presetResult,
      compiledPreset: {
        preset: tamperedPreset.value,
        plan: compiled.value.plan,
      },
      envelope: presetEnvelope.value,
    })).toMatchObject({
      ok: false,
      error: { stage: "preset_reconstruction" },
    });
  });

  it("fails closed for envelope tampering, contract fields, versions, and bounds", () => {
    const prepared = source();
    const issued = issueGeneric(prepared);
    const envelopeBody = clone(issued.envelope) as unknown as
      Record<string, unknown>;
    delete envelopeBody.envelopeDigest;
    const correctlyRedigested = redigestEnvelope({
      ...envelopeBody,
      sourceQueryResultDigest:
        issued.result.resultDigest,
    });
    expect(replayCounterfactualSimulationEnvelope({
      source: prepared.fixture.source,
      partitionReceipt: prepared.partition,
      sourceQueryResult: prepared.sourceQueryResult,
      simulationPlan: issued.plan,
      persistedResult: issued.result,
      envelope: correctlyRedigested,
    })).toMatchObject({
      ok: false,
      error: {
        stage: "replay_envelope_contract",
        diagnosticCodes: [
          "ti_v3_counterfactual_simulation_replay_envelope_contract_mismatch",
        ],
      },
    });

    const alternate = compileDirectionOnlyPreset(
      prepared.sourceQueryPlan,
      prepared.fixture.authority,
      { allowedDirection: "short" },
    );
    if (!alternate.ok) throw new Error(alternate.error.code);
    const alternateResult = presetExecution(prepared, alternate.value);
    const expectedDigestTamper = redigestEnvelope({
      ...envelopeBody,
      persistedSimulationResultDigest: alternateResult.resultDigest,
      artifactReferences: issued.envelope.artifactReferences.map((reference) =>
        reference.artifactKind === "simulation_result"
          ? {
              ...reference,
              artifactDigest: alternateResult.resultDigest,
            }
          : reference),
    });
    expect(replayCounterfactualSimulationEnvelope({
      source: prepared.fixture.source,
      partitionReceipt: prepared.partition,
      sourceQueryResult: prepared.sourceQueryResult,
      simulationPlan: issued.plan,
      persistedResult: issued.result,
      envelope: expectedDigestTamper,
    })).toMatchObject({
      ok: false,
      error: { stage: "expected_result_digest" },
    });

    const missingOriginBody = { ...envelopeBody };
    delete missingOriginBody.planOrigin;
    const malformed = [
      { ...clone(issued.envelope), extra: true },
      Object.fromEntries(
        Object.entries(clone(issued.envelope))
          .filter(([key]) => key !== "sourceQueryPlanDigest"),
      ),
      redigestEnvelope(missingOriginBody),
      redigestEnvelope({
        ...envelopeBody,
        planOrigin: "inferred_plan",
      }),
      redigestEnvelope({
        ...envelopeBody,
        planOriginAuthority: "extra",
      }),
      {
        ...envelopeBody,
        schemaVersion: "ti_v3_counterfactual_simulation_replay_envelope_v99",
      },
      {
        ...envelopeBody,
        semanticVersion: "v99",
      },
    ];
    for (const envelope of malformed) {
      expect(replayCounterfactualSimulationEnvelope({
        source: prepared.fixture.source,
        partitionReceipt: prepared.partition,
        sourceQueryResult: prepared.sourceQueryResult,
        simulationPlan: issued.plan,
        persistedResult: issued.result,
        envelope,
      })).toMatchObject({
        ok: false,
        error: { stage: "replay_envelope_contract" },
      });
    }
    const references = Array.from(
      {
        length:
          COUNTERFACTUAL_SIMULATION_REPLAY_LIMITS.maximumArtifactReferences + 1,
      },
      () => issued.envelope.artifactReferences[0],
    );
    const oversized = redigestEnvelope({
      ...envelopeBody,
      artifactReferences: references,
    });
    expect(replayCounterfactualSimulationEnvelope({
      source: prepared.fixture.source,
      partitionReceipt: prepared.partition,
      sourceQueryResult: prepared.sourceQueryResult,
      simulationPlan: issued.plan,
      persistedResult: issued.result,
      envelope: oversized,
    })).toMatchObject({
      ok: false,
      error: {
        stage: "replay_envelope_contract",
        path: "$.artifactReferences",
      },
    });
  });

  it("rejects correctly re-digested receipt tampering and max-plus-one diagnostics", () => {
    const prepared = source();
    const issued = issueGeneric(prepared);
    const replayed = replayCounterfactualSimulationEnvelope({
      source: prepared.fixture.source,
      partitionReceipt: prepared.partition,
      sourceQueryResult: prepared.sourceQueryResult,
      simulationPlan: issued.plan,
      persistedResult: issued.result,
      envelope: issued.envelope,
    });
    if (!replayed.ok) throw new Error(replayed.error.code);
    const receiptBody = clone(replayed.value.receipt) as unknown as
      Record<string, unknown>;
    delete receiptBody.receiptDigest;
    const tampered = finalizeContentAddressedAuthority(
      "counterfactual_simulation_replay_receipt",
      { ...receiptBody, replayVerificationStatus: "tampered" },
      "receiptDigest",
    );
    if (!tampered.ok) throw new Error(tampered.error.code);
    expect(verifyCounterfactualSimulationReplayReceipt({
      envelope: issued.envelope,
      receipt: tampered.value,
    })).toMatchObject({ ok: false });
    expect(replayCounterfactualSimulationEnvelope({
      source: prepared.fixture.source,
      partitionReceipt: prepared.partition,
      sourceQueryResult: prepared.sourceQueryResult,
      simulationPlan: issued.plan,
      persistedResult: issued.result,
      envelope: issued.envelope,
      persistedReceipt: tampered.value,
    })).toMatchObject({
      ok: false,
      error: { stage: "replay_receipt_verification" },
    });

    const malformedReceipts = [
      { ...clone(replayed.value.receipt), extra: true },
      Object.fromEntries(
        Object.entries(clone(replayed.value.receipt))
          .filter(([key]) => key !== "replayEnvelopeDigest"),
      ),
      (() => {
        const value = clone(replayed.value.receipt) as unknown as
          Record<string, unknown>;
        value.schemaVersion =
          "ti_v3_counterfactual_simulation_replay_receipt_v99";
        return value;
      })(),
      (() => {
        const value = clone(replayed.value.receipt) as unknown as
          Record<string, unknown>;
        value.semanticVersion = "v99";
        return value;
      })(),
    ];
    for (const receipt of malformedReceipts) {
      expect(verifyCounterfactualSimulationReplayReceipt({
        envelope: issued.envelope,
        receipt,
      })).toMatchObject({ ok: false });
    }

    const diagnostics = Array.from(
      { length: Number(issued.envelope.replayBounds.diagnosticLimit) + 1 },
      (_, index) => ({
        code: "ti_v3_counterfactual_replay_test_mismatch",
        path: `$.diagnostics[${index}]`,
      }),
    );
    const oversized = finalizeContentAddressedAuthority(
      "counterfactual_simulation_replay_receipt",
      {
        ...receiptBody,
        diagnosticCodes: diagnostics.map((item) => item.code),
        diagnostics,
      },
      "receiptDigest",
    );
    if (!oversized.ok) throw new Error(oversized.error.code);
    expect(verifyCounterfactualSimulationReplayReceipt({
      envelope: issued.envelope,
      receipt: oversized.value,
    })).toMatchObject({
      ok: false,
      error: { path: "$.receipt.diagnostics" },
    });
  });

  it("preserves envelope, result, and receipt identity under source storage permutation", () => {
    const left = source();
    const right = source(replayRows, { reverse: true });
    const leftIssued = issueGeneric(left);
    const rightIssued = issueGeneric(right);
    expect(leftIssued.result.resultDigest).toBe(rightIssued.result.resultDigest);
    expect(leftIssued.envelope.envelopeDigest)
      .toBe(rightIssued.envelope.envelopeDigest);
    const leftReplay = replayCounterfactualSimulationEnvelope({
      source: left.fixture.source,
      partitionReceipt: left.partition,
      sourceQueryResult: left.sourceQueryResult,
      simulationPlan: leftIssued.plan,
      persistedResult: leftIssued.result,
      envelope: leftIssued.envelope,
    });
    const rightReplay = replayCounterfactualSimulationEnvelope({
      source: right.fixture.source,
      partitionReceipt: right.partition,
      sourceQueryResult: right.sourceQueryResult,
      simulationPlan: rightIssued.plan,
      persistedResult: rightIssued.result,
      envelope: rightIssued.envelope,
    });
    if (!leftReplay.ok || !rightReplay.ok) {
      throw new Error("permutation replay failed");
    }
    expect(leftReplay.value.receipt.receiptDigest)
      .toBe(rightReplay.value.receipt.receiptDigest);
  });
});
