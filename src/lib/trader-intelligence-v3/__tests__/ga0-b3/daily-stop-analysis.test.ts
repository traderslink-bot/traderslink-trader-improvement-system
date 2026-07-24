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
  verifyAnalysisRunReceipt,
  DAILY_STOP_LIMITATION_CODES,
  DAILY_STOP_TOOL_KEY,
} from "../../analytics";
import type { CanonicalExecutionEnvelope } from "../../domain";
import { buildSyntheticCanonicalExecution, buildSyntheticGa0B1Authority } from "../../testing";

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

function executeFixture(specs: readonly TradeSpec[], argumentsValue?: unknown) {
  const authority = buildSyntheticGa0B1Authority(executionsForTrades(specs));
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
      { date: "2026-07-03", minute: 0, durationMinutes: 10, netPnl: "-1", instrument: "loss" },
      { date: "2026-07-03", minute: 1, durationMinutes: 9, netPnl: "1", instrument: "win" },
      { date: "2026-07-03", minute: 20, netPnl: "-1", instrument: "later" },
    ]);
    expect(fixture.result).toMatchObject({ ok: true });
    if (!fixture.result.ok) return;
    expect(fixture.result.value.receipt.limitationCodes).toContain(DAILY_STOP_LIMITATION_CODES.ambiguousCompletionOrder);
    expect(fixture.result.value.claims).toHaveLength(0);
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
    for (const group of (() => { const map = new Map<string, typeof fixture.derived.datasetReceipt.rows>(); for (const row of fixture.derived.datasetReceipt.rows) map.set(row.sessionDate, [...(map.get(row.sessionDate) ?? []), row]); return [...map.values()]; })()) {
      const production = simulateDailyStopSession(group, "2");
      const reference = simulateDailyStopReference(group.map((row) => ({ key: row.semanticRoundTripKey, firstEntryAt: row.firstEntryAt, finalExitAt: row.finalExitAt, netPnl: row.netPnl })), "2");
      expect({ retainedKeys: production.retainedRows.map((row) => row.semanticRoundTripKey), removedKeys: production.removedRows.map((row) => row.semanticRoundTripKey), thresholdReached: production.thresholdReached, triggerKey: production.triggerRow?.semanticRoundTripKey ?? null, stopAt: production.stopAt, ambiguous: production.ambiguous }).toEqual(reference);
    }
  });

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
      (value: any) => { value.tables[0].rows[0].cells[0].metric.value = "2099-01-01"; },
      (value: any) => { value.executionAuthority.toolKey = "weekday_analysis"; },
      (value: any) => { value.normalizedArguments.values.consecutiveLossThreshold = "1"; },
      (value: any) => { value.tables.reverse(); },
    ]) {
      const candidate = JSON.parse(JSON.stringify(persisted));
      mutate(candidate);
      expect(rehydrateDailyStopAnalysisExecution(candidate, createSyntheticInMemoryReadOnlySource(fixture.authority)).ok).toBe(false);
    }
  });
});
