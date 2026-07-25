import { describe, expect, it } from "vitest";

import {
  buildAnalyticalPartitionReceipt,
  createSyntheticInMemoryReadOnlySource,
  executeDailyStopAnalysis,
  normalizeDailyStopArguments,
  readAnalyticalDatasetWithDerivation,
  rehydrateDailyStopAnalysisExecution,
  simulateDailyStopReference,
  simulateDailyStopSession,
  dailyStopContentAddressedRowKey,
  verifyAnalysisRunReceipt,
  DAILY_STOP_LIMITATION_CODES,
  DAILY_STOP_SAMPLE_STATES,
  DAILY_STOP_TOOL_KEY,
  dailyStopSampleState,
  buildExactMetricValue,
  buildAnalyticalRow,
  verifyAnalyticalRow,
  ANALYTICAL_ROW_VERSION,
  buildValidatedClaim,
  dailyStopIdentityMetric,
  verifyValidatedClaim,
  DAILY_STOP_SAMPLE_SIZE_POLICY_KEY,
  DAILY_STOP_SAMPLE_SIZE_POLICY_VERSION,
} from "../../analytics";
import type { CanonicalExecutionEnvelope } from "../../domain";
import { buildSyntheticCanonicalExecution, buildSyntheticGa0B1Authority, type SyntheticGa0B1AuthorityOptions } from "../../testing";

interface TradeSpec {
  readonly date: string;
  readonly minute: number;
  readonly netPnl: "-2" | "-1" | "0" | "1" | "2";
  readonly durationMinutes?: number;
  readonly instrument?: string;
  readonly account?: string;
}

const PRICE: Readonly<Record<TradeSpec["netPnl"], string>> = Object.freeze({ "-2": "19", "-1": "20", "0": "21", "1": "22", "2": "23" });

function executionsForTrades(specs: readonly TradeSpec[]): readonly CanonicalExecutionEnvelope[] {
  const executions: CanonicalExecutionEnvelope[] = [];
  [...specs].sort((left, right) => left.date.localeCompare(right.date) || left.minute - right.minute).forEach((spec, index) => {
    const entryIndex = index * 2 + 1;
    const exitIndex = entryIndex + 1;
    const entryMinute = 14 * 60 + spec.minute;
    const exitMinute = entryMinute + (spec.durationMinutes ?? 1);
    const stamp = (total: number) => `${spec.date}T${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}:00.000000000Z`;
    const currency = "USD" as const;
    const common = { currency, quantity: "1", charges: [{ kind: "commission" as const, amount: "0", currency }], sourceTimezoneEvidence: "UTC+00:00", timestampPrecision: "minute" as const, rawBrokerSymbol: (spec.instrument ?? "SYNTH").toUpperCase(), stableInstrumentKey: `instrument_${(spec.instrument ?? "synthetic").toLowerCase()}` };
    executions.push(buildSyntheticCanonicalExecution({ ...common, executionId: `B3-ENTRY-${entryIndex}`, orderId: `B3-ORDER-${entryIndex}`, brokerExecutionIndex: String(entryIndex), brokerFillSequence: String(entryIndex), originalSourceRowLocator: { kind: "row_number", value: String(entryIndex), rowOrderPreserved: true }, executedAt: stamp(entryMinute), side: "buy", price: "21" }));
    executions.push(buildSyntheticCanonicalExecution({ ...common, executionId: `B3-EXIT-${exitIndex}`, orderId: `B3-ORDER-${entryIndex}`, brokerExecutionIndex: String(exitIndex), brokerFillSequence: String(exitIndex), originalSourceRowLocator: { kind: "row_number", value: String(exitIndex), rowOrderPreserved: true }, executedAt: stamp(exitMinute), side: "sell", price: PRICE[spec.netPnl] }));
  });
  return Object.freeze(executions);
}

function executeFixture(specs: readonly TradeSpec[], argumentsValue?: unknown, authorityOptions?: SyntheticGa0B1AuthorityOptions) {
  const authority = buildSyntheticGa0B1Authority(executionsForTrades(specs), authorityOptions);
  const derived = readAnalyticalDatasetWithDerivation(createSyntheticInMemoryReadOnlySource(authority));
  if (!derived.ok) throw new Error(`${derived.error.code}:${derived.error.path}`);
  const partition = buildAnalyticalPartitionReceipt({ schemaVersion: "ti_v3_analytical_partition_v1", datasetReceipt: derived.value.datasetReceipt, currency: "USD" });
  if (!partition.ok) throw new Error(`${partition.error.code}:${partition.error.path}`);
  const result = executeDailyStopAnalysis({ snapshot: authority.snapshot, snapshotDependencies: authority.snapshotDependencies, canonicalFilter: authority.snapshotDependencies.filter, datasetReceipt: derived.value.datasetReceipt, datasetDerivationReceipt: derived.value.derivationReceipt, partitionReceipt: partition.value, arguments: argumentsValue });
  return { authority, derived: derived.value, partition: partition.value, result };
}

function tableCell(result: ReturnType<typeof executeFixture>["result"], tableKey: string, rowKey: string, columnKey: string) {
  if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
  const table = result.value.tables.find((item) => item.tableKey === tableKey);
  const row = table?.rows.find((item) => item.rowKey === rowKey);
  const cell = row?.cells.find((item) => item.columnKey === columnKey);
  if (cell === undefined) throw new Error(`${tableKey}:${rowKey}:${columnKey}`);
  return cell.metric;
}

function rowsFor(result: ReturnType<typeof executeFixture>["result"]) {
  if (!result.ok) throw new Error(result.error.code);
  const table = result.value.tables.find((item) => item.tableKey === "daily_stop_sessions");
  if (table === undefined) throw new Error("session table missing");
  return table.rows;
}

describe("GA0-B3 daily-stop argument and registry policy", () => {
  it("uses a canonical default and rejects non-canonical, out-of-range, and unknown arguments", () => {
    expect(normalizeDailyStopArguments()).toMatchObject({ ok: true, value: { values: { consecutiveLossThreshold: "2" } } });
    for (const value of [0, -1, 0.5, "0", "17", "2.0", "02"]) expect(normalizeDailyStopArguments({ consecutiveLossThreshold: value })).toMatchObject({ ok: false });
    expect(normalizeDailyStopArguments({ consecutiveLossThreshold: "2", unknown: true })).toMatchObject({ ok: false });
  });
});

describe("GA0-B3 completed-loss streak and exact suffix semantics", () => {
  it("supports threshold one and the bounded maximum without inventing a stop", () => {
    const specs: TradeSpec[] = [
      { date: "2026-07-01", minute: 0, netPnl: "-1" },
      { date: "2026-07-01", minute: 2, netPnl: "1" },
      { date: "2026-07-01", minute: 4, netPnl: "-1" },
    ];
    const thresholdOne = executeFixture(specs, { consecutiveLossThreshold: "1" });
    expect(thresholdOne.result).toMatchObject({ ok: true });
    if (!thresholdOne.result.ok) return;
    const thresholdOneRow = rowsFor(thresholdOne.result)[0];
    expect(tableCell(thresholdOne.result, "daily_stop_sessions", thresholdOneRow.rowKey, "removed_trade_count")).toMatchObject({ kind: "integer", value: "2" });
    const maximum = executeFixture(specs, { consecutiveLossThreshold: "16" });
    expect(maximum.result).toMatchObject({ ok: true });
    if (!maximum.result.ok) return;
    const maximumRow = rowsFor(maximum.result)[0];
    expect(tableCell(maximum.result, "daily_stop_sessions", maximumRow.rowKey, "threshold_reached")).toMatchObject({ kind: "enum", value: "not_reached" });
    expect(tableCell(maximum.result, "daily_stop_sessions", maximumRow.rowKey, "exact_difference")).toMatchObject({ kind: "exact_decimal", value: "0" });
  });

  it("resets flats, stops on completed losses, retains the triggering row, and removes only later entries", () => {
    const fixture = executeFixture([
      { date: "2026-07-01", minute: 0, netPnl: "-1" },
      { date: "2026-07-01", minute: 2, netPnl: "0" },
      { date: "2026-07-01", minute: 4, netPnl: "-1" },
      { date: "2026-07-01", minute: 6, netPnl: "-1" },
      { date: "2026-07-01", minute: 8, netPnl: "1" },
    ]);
    expect(fixture.result).toMatchObject({ ok: true });
    if (!fixture.result.ok) return;
    const session = rowsFor(fixture.result)[0];
    expect(tableCell(fixture.result, "daily_stop_sessions", session.rowKey, "threshold_reached")).toMatchObject({ kind: "enum", value: "reached" });
    expect(tableCell(fixture.result, "daily_stop_sessions", session.rowKey, "removed_trade_count")).toMatchObject({ kind: "integer", value: "1" });
    expect(tableCell(fixture.result, "daily_stop_sessions", session.rowKey, "removed_net_pnl")).toMatchObject({ kind: "exact_decimal", value: "1", currency: "USD" });
    expect(tableCell(fixture.result, "daily_stop_sessions", session.rowKey, "exact_difference")).toMatchObject({ kind: "exact_decimal", value: "-1", currency: "USD" });
    expect(fixture.result.value.receipt.runStatus).toBe("limited");
  });

  it("uses completion order for overlapping entries and retains an already-open position", () => {
    const fixture = executeFixture([
      { date: "2026-07-02", minute: 0, durationMinutes: 30, netPnl: "1", instrument: "open" },
      { date: "2026-07-02", minute: 5, durationMinutes: 1, netPnl: "-1", instrument: "fast-a" },
      { date: "2026-07-02", minute: 10, durationMinutes: 1, netPnl: "-1", instrument: "fast-b" },
      { date: "2026-07-02", minute: 12, durationMinutes: 1, netPnl: "1", instrument: "removed" },
    ]);
    expect(fixture.result).toMatchObject({ ok: true });
    if (!fixture.result.ok) return;
    const rows = fixture.derived.datasetReceipt.rows;
    const session = simulateDailyStopSession(rows, "2");
    expect(session.triggerRow?.displayedSymbol).toBe("FAST-B");
    expect(session.retainedRows.some((row) => row.displayedSymbol === "OPEN")).toBe(true);
    expect(session.removedRows).toHaveLength(1);
    expect(session.overlapDisclosure).toBe("ti_v3_daily_stop_future_entries_only_disclosure");
  });

  it("fails closed when conflicting same-time completions could change the threshold", () => {
    const fixture = executeFixture([
      { date: "2026-07-03", minute: -2, durationMinutes: 1, netPnl: "-1", instrument: "prior" },
      { date: "2026-07-03", minute: 0, durationMinutes: 10, netPnl: "-1", instrument: "loss" },
      { date: "2026-07-03", minute: 1, durationMinutes: 9, netPnl: "1", instrument: "win" },
      { date: "2026-07-03", minute: 20, netPnl: "-1", instrument: "later" },
    ]);
    expect(fixture.result).toMatchObject({ ok: true });
    if (!fixture.result.ok) return;
    expect(fixture.result.value.receipt.limitationCodes).toContain(DAILY_STOP_LIMITATION_CODES.ambiguousCompletionOrder);
    expect(fixture.result.value.claims).toHaveLength(0);
  });

  it("fails closed for loss-plus-win and loss-plus-flat permutations below threshold", () => {
    for (const nonLoss of ["1", "0"] as const) {
      const specs: TradeSpec[] = [
        { date: "2026-07-04", minute: -2, durationMinutes: 1, netPnl: "1", instrument: "prior-win" },
        { date: "2026-07-04", minute: 0, durationMinutes: 10, netPnl: "-1", instrument: "same-time-loss" },
        { date: "2026-07-04", minute: 1, durationMinutes: 9, netPnl: nonLoss, instrument: "same-time-non-loss" },
        { date: "2026-07-04", minute: 20, durationMinutes: 1, netPnl: "-1", instrument: "later-loss-a" },
        { date: "2026-07-04", minute: 22, durationMinutes: 1, netPnl: "-1", instrument: "later-loss-b" },
      ];
      const forward = executeFixture(specs, { consecutiveLossThreshold: "2" });
      const reversed = executeFixture([...specs].reverse(), { consecutiveLossThreshold: "2" });
      expect(forward.result).toMatchObject({ ok: true });
      expect(reversed.result).toMatchObject({ ok: true });
      if (!forward.result.ok || !reversed.result.ok) continue;
      expect(forward.result.value.receipt.limitationCodes).toContain(DAILY_STOP_LIMITATION_CODES.ambiguousCompletionOrder);
      expect(reversed.result.value.receipt.limitationCodes).toContain(DAILY_STOP_LIMITATION_CODES.ambiguousCompletionOrder);
      expect(forward.result.value.claims).toHaveLength(0);
      expect(reversed.result.value.claims).toHaveLength(0);
      const rows = forward.derived.datasetReceipt.rows;
      const productionForward = simulateDailyStopSession(rows, "2");
      const productionReverse = simulateDailyStopSession([...rows].reverse(), "2");
      expect(productionForward.ambiguous).toBe(true);
      expect(productionReverse.ambiguous).toBe(true);
      expect(simulateDailyStopReference(rows.map((row) => ({ key: row.semanticRoundTripKey, firstEntryAt: row.firstEntryAt, finalExitAt: row.finalExitAt, netPnl: row.netPnl })), "2").ambiguous).toBe(true);
    }
  }, 30000);
});

describe("GA0-B3 ambiguous-session exclusion and exact population accounting", () => {
  it("excludes an ambiguous session from mixed helped, harmed, and unchanged aggregates", () => {
    const fixture = executeFixture([
      { date: "2026-07-15", minute: -2, durationMinutes: 1, netPnl: "-1", instrument: "ambiguous-prior" },
      { date: "2026-07-15", minute: 0, durationMinutes: 10, netPnl: "-1", instrument: "ambiguous-loss" },
      { date: "2026-07-15", minute: 1, durationMinutes: 9, netPnl: "1", instrument: "ambiguous-win" },
      { date: "2026-07-16", minute: 0, netPnl: "-1", instrument: "helped-a" },
      { date: "2026-07-16", minute: 2, netPnl: "-1", instrument: "helped-b" },
      { date: "2026-07-16", minute: 4, netPnl: "-1", instrument: "helped-removed" },
      { date: "2026-07-17", minute: 0, netPnl: "-1", instrument: "harmed-a" },
      { date: "2026-07-17", minute: 2, netPnl: "-1", instrument: "harmed-b" },
      { date: "2026-07-17", minute: 4, netPnl: "1", instrument: "harmed-removed" },
      { date: "2026-07-18", minute: 0, netPnl: "1", instrument: "unchanged-a" },
      { date: "2026-07-18", minute: 2, netPnl: "0", instrument: "unchanged-b" },
    ]);
    expect(fixture.result).toMatchObject({ ok: true });
    if (!fixture.result.ok) return;
    const aggregate = (column: string) => tableCell(fixture.result, "daily_stop_aggregate", "aggregate", column);
    expect(aggregate("candidate_session_count")).toMatchObject({ kind: "integer", value: "4" });
    expect(aggregate("included_session_count")).toMatchObject({ kind: "integer", value: "3" });
    expect(aggregate("excluded_session_count")).toMatchObject({ kind: "integer", value: "1" });
    expect(aggregate("actual_trade_count")).toMatchObject({ kind: "integer", value: "8" });
    expect(aggregate("threshold_reached_session_count")).toMatchObject({ kind: "integer", value: "2" });
    expect(aggregate("helped_session_count")).toMatchObject({ kind: "integer", value: "1" });
    expect(aggregate("harmed_session_count")).toMatchObject({ kind: "integer", value: "1" });
    expect(aggregate("unchanged_session_count")).toMatchObject({ kind: "integer", value: "1" });
    const ambiguous = fixture.result.value.tables.find((table) => table.tableKey === "daily_stop_ambiguous_sessions");
    expect(ambiguous?.rows).toHaveLength(1);
    expect(ambiguous?.rows[0].cells.find((cell) => cell.columnKey === "simulated_net_pnl")?.metric.kind).toBe("unavailable");
    expect(ambiguous?.rows[0].cells.find((cell) => cell.columnKey === "classification")?.metric.kind).toBe("unavailable");
    expect(fixture.result.value.series.every((series) => series.points.every((point) => point.sourceRowKey !== ambiguous?.rows[0].rowKey))).toBe(true);
    expect(fixture.result.value.diagnostics.entries.some((entry) => entry.code === DAILY_STOP_LIMITATION_CODES.ambiguousCompletionOrder)).toBe(true);
  });

  it("distinguishes win-plus-flat non-impacting ties from threshold-affecting ties", () => {
    const nonImpacting = executeFixture([
      { date: "2026-07-19", minute: 0, durationMinutes: 10, netPnl: "1", instrument: "win" },
      { date: "2026-07-19", minute: 1, durationMinutes: 9, netPnl: "0", instrument: "flat" },
    ]);
    expect(nonImpacting.result).toMatchObject({ ok: true });
    if (!nonImpacting.result.ok) return;
    expect(nonImpacting.result.value.tables.some((table) => table.tableKey === "daily_stop_ambiguous_sessions")).toBe(false);
    const allLossThreshold = executeFixture([
      { date: "2026-07-20", minute: 0, durationMinutes: 10, netPnl: "-1", instrument: "loss-a" },
      { date: "2026-07-20", minute: 1, durationMinutes: 9, netPnl: "-1", instrument: "loss-b" },
    ]);
    expect(allLossThreshold.result).toMatchObject({ ok: true });
    if (!allLossThreshold.result.ok) return;
    expect(allLossThreshold.result.value.tables.find((table) => table.tableKey === "daily_stop_ambiguous_sessions")?.rows).toHaveLength(1);
  }, 30000);

  it("does not let ambiguous rows become included aggregate evidence", () => {
    for (const specs of [
      [
        { date: "2026-07-05", minute: 0, durationMinutes: 10, netPnl: "-1" as const, instrument: "loss" },
        { date: "2026-07-05", minute: 1, durationMinutes: 9, netPnl: "0" as const, instrument: "flat" },
      ],
      [
        { date: "2026-07-06", minute: 0, durationMinutes: 10, netPnl: "-1" as const, instrument: "loss" },
        { date: "2026-07-06", minute: 1, durationMinutes: 9, netPnl: "1" as const, instrument: "win" },
      ],
    ] as const) {
      const fixture = executeFixture(specs);
      expect(fixture.result).toMatchObject({ ok: true });
      if (!fixture.result.ok) continue;
      const aggregate = fixture.result.value.tables.find((table) => table.tableKey === "daily_stop_aggregate");
      const evidence = fixture.result.value.evidenceBundles.find((bundle) => bundle.bundleDigest === aggregate?.rows[0]?.evidenceBundleDigest);
      expect(aggregate?.rows[0]?.cells.find((cell) => cell.columnKey === "included_session_count")?.metric).toMatchObject({ kind: "integer", value: "0" });
      expect(aggregate?.rows[0]?.cells.find((cell) => cell.columnKey === "actual_total_net_pnl")?.metric).toMatchObject({ kind: "unavailable", reasonCode: "ti_v3_daily_stop_empty_included_population" });
      expect(evidence?.populationState).toBe("empty_included");
      expect(evidence?.candidateKeys).toEqual([]);
      const persisted = JSON.parse(JSON.stringify(fixture.result.value));
      const empty = persisted.evidenceBundles.find((bundle: { readonly bundleDigest: string }) => bundle.bundleDigest === aggregate?.rows[0]?.evidenceBundleDigest);
      empty.candidateKeys = [fixture.derived.datasetReceipt.rows[0]?.semanticRoundTripKey ?? "missing"];
      expect(rehydrateDailyStopAnalysisExecution(persisted, createSyntheticInMemoryReadOnlySource(fixture.authority)).ok).toBe(false);
    }
  }, 30000);
});

describe("GA0-B3 sample-state and claim authority", () => {
  it("uses exact insufficient, descriptive-only, and claim-eligible boundaries", () => {
    expect(dailyStopSampleState(0)).toBe(DAILY_STOP_SAMPLE_STATES.insufficient);
    expect(dailyStopSampleState(4)).toBe(DAILY_STOP_SAMPLE_STATES.insufficient);
    expect(dailyStopSampleState(5)).toBe(DAILY_STOP_SAMPLE_STATES.descriptiveOnly);
    expect(dailyStopSampleState(9)).toBe(DAILY_STOP_SAMPLE_STATES.descriptiveOnly);
    expect(dailyStopSampleState(10)).toBe(DAILY_STOP_SAMPLE_STATES.claimEligible);
    const zero = executeFixture([{ date: "2026-07-19", minute: 0, netPnl: "1" }]);
    expect(zero.result).toMatchObject({ ok: true });
    if (!zero.result.ok) return;
    expect(tableCell(zero.result, "daily_stop_aggregate", "aggregate", "sample_state")).toMatchObject({ kind: "enum", value: "insufficient" });
    for (const count of [4, 5, 9, 10]) {
      const specs: TradeSpec[] = [];
      for (let index = 0; index < count; index += 1) {
        const date = `2026-07-${String(index + 1).padStart(2, "0")}`;
        specs.push({ date, minute: 0, netPnl: "-1" }, { date, minute: 2, netPnl: "-1" });
      }
      const fixture = executeFixture(specs);
      expect(fixture.result).toMatchObject({ ok: true });
      if (!fixture.result.ok) continue;
      const expected = dailyStopSampleState(count);
      expect(tableCell(fixture.result, "daily_stop_aggregate", "aggregate", "sample_state")).toMatchObject({ kind: "enum", value: expected });
      expect(fixture.result.value.claims).toHaveLength(expected === DAILY_STOP_SAMPLE_STATES.claimEligible ? 1 : 0);
      if (expected !== DAILY_STOP_SAMPLE_STATES.claimEligible) {
        expect(fixture.result.value.tables.find((table) => table.tableKey === "daily_stop_aggregate")?.limitationCodes).toContain(expected === DAILY_STOP_SAMPLE_STATES.insufficient ? DAILY_STOP_LIMITATION_CODES.thresholdSampleInsufficient : DAILY_STOP_LIMITATION_CODES.thresholdSampleDescriptiveOnly);
      }
    }
  }, 120000);

  it("uses threshold-reached session count for claims and semantic counterexamples", () => {
    const specs: TradeSpec[] = [];
    for (let index = 0; index < 10; index += 1) {
      const date = `2026-07-${String(index + 1).padStart(2, "0")}`;
      specs.push({ date, minute: 0, netPnl: "-1" }, { date, minute: 2, netPnl: "-1" }, { date, minute: 4, netPnl: index === 9 ? "1" : "-1" });
    }
    const fixture = executeFixture(specs);
    expect(fixture.result).toMatchObject({ ok: true });
    if (!fixture.result.ok) return;
    expect(fixture.result.value.claims).toHaveLength(1);
    const claim = fixture.result.value.claims[0];
    expect(claim.targetSampleSize).toBe("10");
    expect(claim.counterexampleEvidenceBundleDigests.length).toBeGreaterThan(0);
    const counterexampleBundles = fixture.result.value.evidenceBundles.filter((bundle) => claim.counterexampleEvidenceBundleDigests.includes(bundle.bundleDigest));
    expect(counterexampleBundles.every((bundle) => bundle.evidenceKey.includes("daily_stop_actual_") || bundle.evidenceKey.includes("daily_stop_removed_"))).toBe(true);
    expect(claim.limitationCodes).toEqual([]);
    const persisted = JSON.parse(JSON.stringify(fixture.result.value));
    persisted.claims[0].sampleSizeAuthority.targetColumnKey = "actual_trade_count";
    expect(rehydrateDailyStopAnalysisExecution(persisted, createSyntheticInMemoryReadOnlySource(fixture.authority)).ok).toBe(false);
    const counterexampleTampered = JSON.parse(JSON.stringify(fixture.result.value));
    counterexampleTampered.claims[0].counterexampleEvidenceBundleDigests.reverse();
    expect(rehydrateDailyStopAnalysisExecution(counterexampleTampered, createSyntheticInMemoryReadOnlySource(fixture.authority)).ok).toBe(false);
  }, 120000);

  it("binds classification and exact difference to complete simulation authority", () => {
    const fixture = executeFixture([
      { date: "2026-07-10", minute: 0, netPnl: "-1", instrument: "loss-a" },
      { date: "2026-07-10", minute: 2, netPnl: "-1", instrument: "loss-b" },
      { date: "2026-07-10", minute: 4, netPnl: "1", instrument: "removed" },
    ]);
    if (!fixture.result.ok) throw new Error(fixture.result.error.code);
    const execution = fixture.result.value;
    const row = execution.tables.find((table) => table.tableKey === "daily_stop_sessions")?.rows[0];
    if (row === undefined) throw new Error("session row missing");
    const classification = row.cells.find((cell) => cell.columnKey === "classification");
    const difference = row.cells.find((cell) => cell.columnKey === "exact_difference");
    expect(classification?.evidenceBundleDigest).toBe(difference?.evidenceBundleDigest);
    const simulation = execution.evidenceBundles.find((bundle) => bundle.bundleDigest === classification?.evidenceBundleDigest);
    expect(simulation?.simulationAuthority).toMatchObject({ kind: "daily_stop_simulation_v1", triggerCandidateKey: expect.any(String), stopAt: expect.any(String) });
    const persisted = JSON.parse(JSON.stringify(execution));
    const persistedSimulation = persisted.evidenceBundles.find((bundle: { readonly bundleDigest: string }) => bundle.bundleDigest === classification?.evidenceBundleDigest);
    persistedSimulation.simulationAuthority.removedCandidateKeys = persistedSimulation.simulationAuthority.actualCandidateKeys;
    expect(rehydrateDailyStopAnalysisExecution(persisted, createSyntheticInMemoryReadOnlySource(fixture.authority)).ok).toBe(false);
  });

  it("rejects every ungoverned B3 sample authority target and missing policy", () => {
    const specs: TradeSpec[] = [];
    for (let index = 0; index < 10; index += 1) {
      const date = `2026-07-${String(index + 1).padStart(2, "0")}`;
      specs.push({ date, minute: 0, netPnl: "-1" }, { date, minute: 2, netPnl: "-1" }, { date, minute: 4, netPnl: "1" });
    }
    specs.push({ date: "2026-07-11", minute: 0, netPnl: "1" }, { date: "2026-07-11", minute: 2, netPnl: "0" });
    const fixture = executeFixture(specs);
    if (!fixture.result.ok) throw new Error(fixture.result.error.code);
    const execution = fixture.result.value;
    const claim = execution.claims[0];
    const table = execution.tables.find((item) => item.tableKey === "daily_stop_aggregate");
    if (table === undefined || claim === undefined || claim.sampleSizeAuthority === undefined) throw new Error("claim fixture missing");
    const sessionsTable = execution.tables.find((item) => item.tableKey === "daily_stop_sessions");
    if (sessionsTable === undefined) throw new Error("session table missing");
    const nonThresholdRowKey = sessionsTable.rows.find((row) => row.cells.some((cell) => cell.columnKey === "threshold_reached" && cell.metric.kind === "enum" && cell.metric.value === "not_reached"))?.rowKey;
    if (nonThresholdRowKey === undefined) throw new Error("non-threshold session fixture missing");
    const buildInput = (authority: unknown, overrides: Record<string, unknown> = {}) => ({
      schemaVersion: claim.schemaVersion,
      claimKey: claim.claimKey,
      claimVersion: claim.claimVersion,
      claimType: claim.claimType,
      runContext: execution.runContext,
      table,
      subjectGroupKey: claim.subjectGroupKey,
      comparisonGroupKey: claim.comparisonGroupKey,
      metricKey: claim.metricKey,
      effectDerivation: claim.effectDerivation,
      confidenceEvidenceLabel: claim.confidenceEvidenceLabel,
      outlierSensitivityState: claim.outlierSensitivityState,
      evidenceBundles: execution.evidenceBundles,
      counterexampleEvidenceBundleDigests: claim.counterexampleEvidenceBundleDigests,
      sourceTables: execution.tables,
      sampleSizeAuthority: authority,
      allowedWordingCode: claim.allowedWordingCode,
      ...overrides,
    });
    const validAuthority = claim.sampleSizeAuthority;
    expect(buildValidatedClaim(buildInput(validAuthority)).ok).toBe(true);
    expect(verifyValidatedClaim(claim, execution.runContext, table, execution.evidenceBundles, execution.tables)).toMatchObject({ ok: true });
    for (const mutate of [
      (authority: Record<string, unknown>) => { authority.sourceColumnKey = "actual_trade_count"; },
      (authority: Record<string, unknown>) => { authority.sourceRowKey = "foreign"; },
      (authority: Record<string, unknown>) => { authority.aggregateTableDigest = "ti_v3:exact_table:v1:sha256:0000000000000000000000000000000000000000000000000000000000000000"; },
      (authority: Record<string, unknown>) => { authority.thresholdReachedSessionCount = "999"; },
      (authority: Record<string, unknown>) => { authority.thresholdReachedSessionRowKeys = ["foreign"]; },
      (authority: Record<string, unknown>) => { authority.thresholdReachedSessionRowKeys = [nonThresholdRowKey]; },
      (authority: Record<string, unknown>) => { authority.thresholdReachedSessionRowKeys = [validAuthority.thresholdReachedSessionRowKeys[0], validAuthority.thresholdReachedSessionRowKeys[0]]; },
      (authority: Record<string, unknown>) => { authority.policyKey = "foreign_policy"; },
    ]) {
      const candidate = JSON.parse(JSON.stringify(validAuthority));
      mutate(candidate);
      expect(buildValidatedClaim(buildInput(candidate)).ok).toBe(false);
    }
    expect(buildValidatedClaim(buildInput(validAuthority, { claimType: "daily_stop_historical_other" })).ok).toBe(false);
    expect(buildValidatedClaim(buildInput(validAuthority, { claimType: "daily_stop_historical_helped" })).ok).toBe(false);
    expect(buildValidatedClaim(buildInput(validAuthority, { allowedWordingCode: "under_fixed_historical_removal_rule_simulated_pnl_was_higher" })).ok).toBe(false);
    expect(buildValidatedClaim(buildInput(undefined)).ok).toBe(false);
    expect(validAuthority.policyKey).toBe(DAILY_STOP_SAMPLE_SIZE_POLICY_KEY);
    expect(validAuthority.policyVersion).toBe(DAILY_STOP_SAMPLE_SIZE_POLICY_VERSION);
  }, 120000);

  it("keeps claim sample direction honest for all-helped, all-harmed, and unchanged populations", () => {
    for (const netPnl of ["-1", "1"] as const) {
      const specs: TradeSpec[] = [];
      for (let index = 0; index < 10; index += 1) {
        const date = `2026-07-${String(index + 1).padStart(2, "0")}`;
        specs.push({ date, minute: 0, netPnl: "-1" }, { date, minute: 2, netPnl: "-1" }, { date, minute: 4, netPnl });
      }
      const fixture = executeFixture(specs);
      expect(fixture.result).toMatchObject({ ok: true });
      if (!fixture.result.ok) return;
      expect(fixture.result.value.claims).toHaveLength(1);
      expect(fixture.result.value.claims[0].counterexampleEvidenceBundleDigests).toEqual([]);
    }
    const unchangedSpecs: TradeSpec[] = [];
    for (let index = 0; index < 10; index += 1) {
      const date = `2026-07-${String(index + 1).padStart(2, "0")}`;
      unchangedSpecs.push({ date, minute: 0, netPnl: "-1" }, { date, minute: 2, netPnl: "-1" });
    }
    const unchanged = executeFixture(unchangedSpecs);
    expect(unchanged.result).toMatchObject({ ok: true });
    if (!unchanged.result.ok) return;
    expect(unchanged.result.value.claims).toHaveLength(1);
    expect(unchanged.result.value.claims[0].counterexampleEvidenceBundleDigests).toHaveLength(10);
  }, 120000);

  it("accounts for each excluded candidate with row-specific evidence and unavailable scope counts", () => {
    const specs: TradeSpec[] = [
      { date: "2026-07-01", minute: 0, netPnl: "-1" },
      { date: "2026-07-01", minute: 2, netPnl: "-1" },
      { date: "2026-07-02", minute: 0, netPnl: "-1" },
      { date: "2026-07-02", minute: 2, netPnl: "-1" },
      { date: "2026-07-03", minute: 0, netPnl: "1" },
      { date: "2026-07-03", minute: 2, netPnl: "0" },
    ];
    const executions = executionsForTrades(specs);
    const fixture = executeFixture(specs, undefined, {
      manifestExclusions: [
        { evidenceDigest: executions[0].canonicalContentDigest, reasonCode: "ti_v3_coverage_source_excluded" },
        { evidenceDigest: executions[2].canonicalContentDigest, reasonCode: "ti_v3_coverage_source_excluded" },
      ],
    });
    expect(fixture.result).toMatchObject({ ok: true });
    if (!fixture.result.ok) return;
    const aggregate = fixture.result.value.tables.find((table) => table.tableKey === "daily_stop_aggregate");
    expect(aggregate?.rows[0].cells.find((cell) => cell.columnKey === "candidate_session_count")?.metric).toMatchObject({ kind: "unavailable" });
    expect(aggregate?.rows[0].cells.find((cell) => cell.columnKey === "excluded_session_count")?.metric).toMatchObject({ kind: "unavailable" });
    const exclusions = fixture.result.value.tables.find((table) => table.tableKey === "daily_stop_exclusions");
    expect(exclusions?.rows).toHaveLength(2);
    expect(new Set(exclusions?.rows.map((row) => row.rowKey)).size).toBe(2);
    for (const row of exclusions?.rows ?? []) {
      const evidence = fixture.result.value.evidenceBundles.find((bundle) => bundle.bundleDigest === row.evidenceBundleDigest);
      expect(evidence?.candidateKeys).toHaveLength(1);
      expect(row.rowKey).not.toContain(evidence?.candidateKeys[0] ?? "missing");
    }
    expect(fixture.result.value.diagnostics.entries.some((entry) => entry.code === DAILY_STOP_LIMITATION_CODES.excludedSessionScopeUnavailable)).toBe(true);
  });

  it("uses bounded content-addressed row keys for punctuation and long candidate values", () => {
    const punctuation = dailyStopContentAddressedRowKey("excluded", { candidateKey: "candidate:punctuation/with?delimiters#and spaces" });
    const longValue = dailyStopContentAddressedRowKey("excluded", { candidateKey: "x".repeat(4096) });
    expect(punctuation).toMatch(/^excluded_[0-9a-f]{64}$/);
    expect(longValue).toMatch(/^excluded_[0-9a-f]{64}$/);
    expect(longValue).not.toBe(punctuation);
  });

  it("accepts source identity lengths through 512 for trigger and exclusion semantics", () => {
    const fixture = executeFixture([{ date: "2026-07-01", minute: 0, netPnl: "1" }]);
    expect(fixture.result).toMatchObject({ ok: true });
    if (!fixture.result.ok) return;
    const sourceRow = fixture.result.value.tables.length > 0 ? fixture.derived.datasetReceipt.rows[0] : undefined;
    if (sourceRow === undefined) throw new Error("B1 source row missing");
    const { rowDigest: _rowDigest, ...rowContent } = sourceRow;
    void _rowDigest;
    for (const length of [256, 257, 512]) {
      const key = `x${"a".repeat(length - 1)}`;
      const verifiedRow = buildAnalyticalRow({ ...rowContent, schemaVersion: ANALYTICAL_ROW_VERSION, semanticRoundTripKey: key });
      expect(verifiedRow).toMatchObject({ ok: true });
      if (verifiedRow.ok) expect(verifyAnalyticalRow(verifiedRow.value)).toMatchObject({ ok: true });
      const trigger = dailyStopIdentityMetric("threshold_trigger_round_trip", key);
      const candidate = dailyStopIdentityMetric("candidate_key", key);
      expect(trigger.kind).toBe("identity");
      expect(candidate.kind).toBe("identity");
      if (trigger.kind !== "identity" || candidate.kind !== "identity") continue;
      expect(trigger.value).toHaveLength(length);
      expect(candidate.value).toHaveLength(length);
      expect(buildExactMetricValue({ schemaVersion: "ti_v3_exact_metric_value_v1", metricKey: "threshold_trigger_round_trip", kind: "identity", unit: "category", currency: null, value: key }).ok).toBe(true);
    }
    const rejected = `x${"a".repeat(512)}`;
    expect(buildAnalyticalRow({ ...rowContent, schemaVersion: ANALYTICAL_ROW_VERSION, semanticRoundTripKey: rejected })).toMatchObject({ ok: false });
    expect(buildExactMetricValue({ schemaVersion: "ti_v3_exact_metric_value_v1", metricKey: "threshold_trigger_round_trip", kind: "identity", unit: "category", currency: null, value: rejected }).ok).toBe(false);
  });
});

describe("GA0-B3 artifact graph, reference differential, and semantic replay", () => {
  it("is invariant to caller input order and preserves the no-threshold population", () => {
    const specs: TradeSpec[] = [
      { date: "2026-07-14", minute: 0, netPnl: "1" },
      { date: "2026-07-14", minute: 2, netPnl: "0" },
      { date: "2026-07-14", minute: 4, netPnl: "1" },
    ];
    const forward = executeFixture(specs);
    const reversed = executeFixture([...specs].reverse());
    expect(forward.result).toMatchObject({ ok: true });
    expect(reversed.result).toMatchObject({ ok: true });
    if (!forward.result.ok || !reversed.result.ok) return;
    expect(forward.result.value.receipt.runDigest).toBe(reversed.result.value.receipt.runDigest);
    const row = rowsFor(forward.result)[0];
    expect(tableCell(forward.result, "daily_stop_sessions", row.rowKey, "threshold_reached")).toMatchObject({ kind: "enum", value: "not_reached" });
    expect(tableCell(forward.result, "daily_stop_sessions", row.rowKey, "removed_trade_count")).toMatchObject({ kind: "integer", value: "0" });
  });

  it("reconciles exact tables, validates series/receipt, and matches the independent reference", () => {
    const specs: TradeSpec[] = [];
    for (let day = 0; day < 10; day += 1) {
      const date = `2026-07-${String(day + 6).padStart(2, "0")}`;
      specs.push({ date, minute: 0, netPnl: "-1" }, { date, minute: 2, netPnl: "-1" }, { date, minute: 4, netPnl: day % 2 === 0 ? "1" : "-1" });
    }
    const fixture = executeFixture(specs);
    expect(fixture.result).toMatchObject({ ok: true });
    if (!fixture.result.ok) return;
    const execution = fixture.result.value;
    expect(execution.executionAuthority.toolKey).toBe(DAILY_STOP_TOOL_KEY);
    expect(execution.tables.map((table) => table.tableKey)).toEqual(expect.arrayContaining(["daily_stop_sessions", "daily_stop_aggregate"]));
    expect(execution.series).toHaveLength(3);
    expect(verifyAnalysisRunReceipt(execution.receipt, { runContext: execution.runContext, tables: execution.tables, claims: execution.claims, series: execution.series, evidenceBundles: execution.evidenceBundles, diagnostics: execution.diagnostics })).toMatchObject({ ok: true });
    const firstSession = execution.tables.find((table) => table.tableKey === "daily_stop_sessions")?.rows[0];
    expect(firstSession?.cells.find((cell) => cell.columnKey === "session_date")?.metric).toMatchObject({ kind: "date", value: "2026-07-06" });
    expect(firstSession?.cells.find((cell) => cell.columnKey === "currency")?.metric).toMatchObject({ kind: "identity", value: "USD" });
    expect(firstSession?.cells.find((cell) => cell.columnKey === "threshold_final_exit_at")?.metric.kind).toBe("timestamp");
    expect(firstSession?.cells.find((cell) => cell.columnKey === "threshold_trigger_round_trip")?.metric.kind).toBe("identity");
    for (const group of (() => { const map = new Map<string, typeof fixture.derived.datasetReceipt.rows>(); for (const row of fixture.derived.datasetReceipt.rows) map.set(row.sessionDate, [...(map.get(row.sessionDate) ?? []), row]); return [...map.values()]; })()) {
      const production = simulateDailyStopSession(group, "2");
      const reference = simulateDailyStopReference(group.map((row) => ({ key: row.semanticRoundTripKey, firstEntryAt: row.firstEntryAt, finalExitAt: row.finalExitAt, netPnl: row.netPnl })), "2");
      expect({
        retainedKeys: production.retainedRows.map((row) => row.semanticRoundTripKey),
        removedKeys: production.removedRows.map((row) => row.semanticRoundTripKey),
        thresholdReached: production.thresholdReached,
        triggerKey: production.triggerRow?.semanticRoundTripKey ?? null,
        stopAt: production.stopAt,
        ambiguous: production.ambiguous,
        simulationState: production.simulationState,
        ambiguityReasonCode: production.ambiguityReasonCode,
        actualTradeCount: String(production.rows.length),
        simulatedTradeCount: String(production.retainedRows.length),
        removedTradeCount: String(production.removedRows.length),
        actualNetPnl: production.actualNetPnl,
        simulatedNetPnl: production.simulatedNetPnl,
        removedNetPnl: production.removedNetPnl,
        difference: production.difference,
      }).toEqual(reference);
    }
  }, 30000);

  it("differential-tests generated thresholds, flats, wins, losses, overlaps, ties, and later completions", () => {
    const cases: Readonly<{ readonly threshold: string; readonly specs: readonly TradeSpec[] }>[] = Array.from({ length: 16 }, (_, index) => {
      const threshold = String(index + 1);
      const date = `2026-07-${String(index + 1).padStart(2, "0")}`;
      return { threshold, specs: Array.from({ length: index + 1 }, (_, tradeIndex) => ({ date, minute: tradeIndex * 2, netPnl: tradeIndex === index ? "1" as const : "-1" as const })) };
    });
    cases.push(
      { threshold: "1", specs: [{ date: "2026-07-17", minute: 0, netPnl: "-1" }, { date: "2026-07-17", minute: 2, netPnl: "1" }, { date: "2026-07-17", minute: 4, netPnl: "0" }] },
      { threshold: "3", specs: [{ date: "2026-07-18", minute: 0, netPnl: "-1" }, { date: "2026-07-18", minute: 2, netPnl: "-1" }, { date: "2026-07-18", minute: 4, netPnl: "0" }, { date: "2026-07-18", minute: 6, netPnl: "-1" }, { date: "2026-07-18", minute: 8, netPnl: "2" }] },
      { threshold: "2", specs: [{ date: "2026-07-08", minute: 0, netPnl: "-1", durationMinutes: 5, instrument: "first" }, { date: "2026-07-08", minute: 2, netPnl: "-1", durationMinutes: 1, instrument: "second" }, { date: "2026-07-08", minute: 4, netPnl: "1", instrument: "later" }] },
      { threshold: "2", specs: [{ date: "2026-07-09", minute: -2, durationMinutes: 1, netPnl: "-1", instrument: "prior" }, { date: "2026-07-09", minute: 0, durationMinutes: 10, netPnl: "-1", instrument: "loss" }, { date: "2026-07-09", minute: 1, durationMinutes: 9, netPnl: "1", instrument: "win" }] },
    );
    for (const testCase of cases) {
      const fixture = executeFixture(testCase.specs, { consecutiveLossThreshold: testCase.threshold });
      expect(fixture.result).toMatchObject({ ok: true });
      if (!fixture.result.ok) return;
      const groups = new Map<string, typeof fixture.derived.datasetReceipt.rows>();
      for (const row of fixture.derived.datasetReceipt.rows) groups.set(row.sessionDate, [...(groups.get(row.sessionDate) ?? []), row]);
      for (const group of groups.values()) {
        const production = simulateDailyStopSession(group, testCase.threshold);
        const reference = simulateDailyStopReference(group.map((row) => ({ key: row.semanticRoundTripKey, firstEntryAt: row.firstEntryAt, finalExitAt: row.finalExitAt, netPnl: row.netPnl })), testCase.threshold);
        expect({
          retainedKeys: production.retainedRows.map((row) => row.semanticRoundTripKey),
          removedKeys: production.removedRows.map((row) => row.semanticRoundTripKey),
          thresholdReached: production.thresholdReached,
          triggerKey: production.triggerRow?.semanticRoundTripKey ?? null,
          stopAt: production.stopAt,
          ambiguous: production.ambiguous,
          simulationState: production.simulationState,
          ambiguityReasonCode: production.ambiguityReasonCode,
          actualTradeCount: String(production.rows.length),
          simulatedTradeCount: String(production.retainedRows.length),
          removedTradeCount: String(production.removedRows.length),
          actualNetPnl: production.actualNetPnl,
          simulatedNetPnl: production.simulatedNetPnl,
          removedNetPnl: production.removedNetPnl,
          difference: production.difference,
        }).toEqual(reference);
      }
    }
  }, 120000);

  it("accepts an exact persisted replay and rejects graph, argument, and tool-identity tampering", () => {
    const fixture = executeFixture([
      { date: "2026-07-13", minute: 0, netPnl: "-1" },
      { date: "2026-07-13", minute: 2, netPnl: "-1" },
      { date: "2026-07-13", minute: 4, netPnl: "1" },
    ]);
    if (!fixture.result.ok) throw new Error(fixture.result.error.code);
    const persisted = JSON.parse(JSON.stringify(fixture.result.value));
    expect(rehydrateDailyStopAnalysisExecution(persisted, createSyntheticInMemoryReadOnlySource(fixture.authority))).toMatchObject({ ok: true });
    for (const mutate of [
      (value: { tables: Array<{ rows: Array<{ cells: Array<{ metric: { value: string } }> }> }>; executionAuthority: { toolKey: string }; normalizedArguments: { values: { consecutiveLossThreshold: string } } }) => { value.tables[0].rows[0].cells[0].metric.value = "2099-01-01"; },
      (value: { executionAuthority: { toolKey: string } }) => { value.executionAuthority.toolKey = "weekday_analysis"; },
      (value: { normalizedArguments: { values: { consecutiveLossThreshold: string } } }) => { value.normalizedArguments.values.consecutiveLossThreshold = "1"; },
      (value: { tables: Array<unknown> }) => { value.tables.reverse(); },
    ]) {
      const candidate = JSON.parse(JSON.stringify(persisted));
      mutate(candidate);
      expect(rehydrateDailyStopAnalysisExecution(candidate, createSyntheticInMemoryReadOnlySource(fixture.authority)).ok).toBe(false);
    }
  }, 15000);
});
