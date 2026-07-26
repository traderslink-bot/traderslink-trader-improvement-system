import { describe, expect, it } from "vitest";

import {
  buildAnalyticalPartitionReceipt,
  createSyntheticInMemoryReadOnlySource,
  executeWeekdayAnalysis,
  normalizeWeekdayAnalysisArguments,
  readAnalyticalDatasetWithDerivation,
  rehydrateWeekdayAnalysisExecution,
  resolveLocalClockFacts,
  verifyAnalysisRunReceipt,
  verifyWeekdayAnalysisArguments,
  WEEKDAY_ARGUMENT_SCHEMA_DIGEST,
  ANALYTICAL_EXCLUSION_REASONS,
  isClaimNeutralAnalyticalExclusion,
  WEEKDAY_TOOL_KEY,
} from "../../analytics";
import {
  CANONICAL_SERIALIZATION_LIMITS,
  FOUNDATION_PAYLOAD_LIMITS,
  measureCanonicalGraph,
  serializeCanonicalValue,
  validateArray,
  validateExactRecord,
} from "../../domain";
import {
  buildSyntheticCanonicalExecution,
  buildSyntheticGa0B1Authority,
} from "../../testing";
import type { CanonicalExecutionEnvelope } from "../../domain";
import type { ExcludedAnalyticalCandidate } from "../../analytics/dataset/analytical-dataset";

interface MutableWeekdayMutationGraph {
  tables: Array<{ rows: Array<{ rowKey: string; cells: Array<{ columnKey: string; metric: { value: string } }> }> }>;
  evidenceBundles: unknown[];
  diagnostics: { entries: Array<{ diagnosticKey: string; severity: "info"; code: string; affectedKeys: readonly string[] }> };
  runContext: { partitionDigest: string };
  normalizedArguments: { values: { targetWeekday: string } };
  receipt: { runDigest: string; diagnosticsDigest: string };
  executionAuthority: { toolKey: string };
}

interface TradeSpec {
  readonly date: string;
  readonly minute: number;
  readonly netPnl: string;
  readonly currency?: "CAD" | "USD";
  readonly durationMinutes?: number;
  readonly instrument?: string;
}

function priceForNetPnl(netPnl: string): string {
  const values: Readonly<Record<string, string>> = Object.freeze({
    "-20": "1",
    "-2": "19",
    "-1": "20",
    "0": "21",
    "1": "22",
    "2": "23",
  });
  const value = values[netPnl];
  if (value === undefined) throw new Error(`unsupported synthetic pnl ${netPnl}`);
  return value;
}

function executionsForTrades(
  specs: readonly TradeSpec[],
): readonly CanonicalExecutionEnvelope[] {
  const executions: CanonicalExecutionEnvelope[] = [];
  const orderedSpecs = [...specs].sort((left, right) =>
    left.date < right.date
      ? -1
      : left.date > right.date
        ? 1
        : left.minute - right.minute);
  orderedSpecs.forEach((spec, index) => {
    const entryIndex = index * 2 + 1;
    const exitIndex = entryIndex + 1;
    const entryTotalMinute = 14 * 60 + spec.minute;
    const exitTotalMinute = entryTotalMinute + (spec.durationMinutes ?? 1);
    const hour = Math.floor(entryTotalMinute / 60);
    const minute = entryTotalMinute % 60;
    const exitHour = Math.floor(exitTotalMinute / 60);
    const exitMinuteValue = exitTotalMinute % 60;
    const entryMinute = String(minute).padStart(2, "0");
    const exitMinute = String(exitMinuteValue).padStart(2, "0");
    const currency = spec.currency ?? "USD";
    const common = {
      currency,
      quantity: "1",
      charges: [{ kind: "commission" as const, amount: "0", currency }],
      sourceTimezoneEvidence: "UTC+00:00",
      timestampPrecision: "minute" as const,
      rawBrokerSymbol: spec.instrument ?? "SYNTH",
      stableInstrumentKey: `instrument_${(spec.instrument ?? "synthetic_equity").toLowerCase()}`,
    };
    executions.push(
      buildSyntheticCanonicalExecution({
        ...common,
        executionId: `B2-ENTRY-${String(entryIndex).padStart(3, "0")}`,
        orderId: `B2-ORDER-${String(entryIndex).padStart(3, "0")}`,
        brokerExecutionIndex: String(entryIndex),
        brokerFillSequence: String(entryIndex),
        originalSourceRowLocator: {
          kind: "row_number",
          value: String(entryIndex),
          rowOrderPreserved: true,
        },
        executedAt: `${spec.date}T${String(hour).padStart(2, "0")}:${entryMinute}:00.000000000Z`,
        side: "buy",
        price: "21",
      }),
      buildSyntheticCanonicalExecution({
        ...common,
        executionId: `B2-EXIT-${String(exitIndex).padStart(3, "0")}`,
        orderId: `B2-ORDER-${String(exitIndex).padStart(3, "0")}`,
        brokerExecutionIndex: String(exitIndex),
        brokerFillSequence: String(exitIndex),
        originalSourceRowLocator: {
          kind: "row_number",
          value: String(exitIndex),
          rowOrderPreserved: true,
        },
        executedAt: `${spec.date}T${String(exitHour).padStart(2, "0")}:${exitMinute}:00.000000000Z`,
        side: "sell",
        price: priceForNetPnl(spec.netPnl),
      }),
    );
  });
  return Object.freeze(executions);
}

const BASELINE_DATES = Object.freeze([
  "2026-07-01",
  "2026-07-02",
  "2026-07-06",
  "2026-07-07",
  "2026-07-08",
  "2026-07-09",
  "2026-07-13",
  "2026-07-14",
  "2026-07-15",
  "2026-07-16",
]);

function eligibleTradeSpecs(): readonly TradeSpec[] {
  const targetPnls = ["-2", "-2", "-2", "-2", "-2", "-2", "-2", "-2", "1", "1"];
  const fridayDates = [
    "2026-07-03", "2026-07-03", "2026-07-03", "2026-07-03",
    "2026-07-10", "2026-07-10", "2026-07-10",
    "2026-07-17", "2026-07-17", "2026-07-17",
  ];
  const target = targetPnls.map((netPnl, index) => ({
    date: fridayDates[index],
    minute: (index % 4) * 5,
    netPnl,
  }));
  const baseline = BASELINE_DATES.flatMap((date, index) => [
    { date, minute: 30, netPnl: index < 2 ? "-1" : "1" },
    { date, minute: 40, netPnl: "1" },
  ]);
  return Object.freeze([...target, ...baseline]);
}

function executeFixture(
  specs: readonly TradeSpec[] = eligibleTradeSpecs(),
  argumentsValue?: unknown,
) {
  const authority = buildSyntheticGa0B1Authority(executionsForTrades(specs));
  const derived = readAnalyticalDatasetWithDerivation(
    createSyntheticInMemoryReadOnlySource(authority),
  );
  if (!derived.ok) throw new Error(JSON.stringify(derived.error));
  const partition = buildAnalyticalPartitionReceipt({
    schemaVersion: "ti_v3_analytical_partition_v1",
    datasetReceipt: derived.value.datasetReceipt,
    currency: "USD",
  });
  if (!partition.ok) {
    throw new Error(
      `${partition.error.code}:${partition.error.path}:${JSON.stringify({
        rows: derived.value.datasetReceipt.rows.length,
        currencies: derived.value.datasetReceipt.currencyPartitions,
        exclusions: derived.value.datasetReceipt.excludedCandidates.map(
          (candidate) => candidate.reasonCode,
        ),
      })}`,
    );
  }
  const result = executeWeekdayAnalysis({
    snapshot: authority.snapshot,
    snapshotDependencies: authority.snapshotDependencies,
    canonicalFilter: authority.snapshotDependencies.filter,
    datasetReceipt: derived.value.datasetReceipt,
    datasetDerivationReceipt: derived.value.derivationReceipt,
    partitionReceipt: partition.value,
    arguments: argumentsValue,
  });
  return { authority, derived: derived.value, partition: partition.value, result };
}

function tableCell(
  result: ReturnType<typeof executeFixture>["result"],
  tableKey: string,
  rowKey: string,
  columnKey: string,
) {
  if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
  const table = result.value.tables.find((item) => item.tableKey === tableKey);
  const row = table?.rows.find((item) => item.rowKey === rowKey);
  const cell = row?.cells.find((item) => item.columnKey === columnKey);
  if (cell === undefined) throw new Error(`${tableKey}:${rowKey}:${columnKey}`);
  return cell.metric;
}

describe("GA0-B2 weekday arguments and registry policy", () => {
  it("uses an explicit content-addressed Friday default and rejects localized or foreign policies", () => {
    const normalized = normalizeWeekdayAnalysisArguments();
    expect(normalized).toMatchObject({
      ok: true,
      value: {
        argumentSchemaDigest: WEEKDAY_ARGUMENT_SCHEMA_DIGEST,
        values: {
          targetWeekday: "friday",
          comparisonPolicy: "all_other_represented_weekdays_v1",
          evidenceSamplePolicy: "ti_v3_weekday_conservative_evidence_v1",
          outlierPolicy: "ti_v3_weekday_outlier_contribution_v1",
        },
      },
    });
    if (!normalized.ok) return;
    const verified = verifyWeekdayAnalysisArguments(normalized.value);
    expect(
      verified,
      verified.ok ? undefined : JSON.stringify(verified.error),
    ).toMatchObject({ ok: true });
    expect(
      normalizeWeekdayAnalysisArguments({ targetWeekday: "Friday" }),
    ).toMatchObject({ ok: false });
    expect(
      normalizeWeekdayAnalysisArguments({ comparisonPolicy: "nearest_day" }),
    ).toMatchObject({ ok: false });
  });
});

describe("GA0-B2 exact weekday summary and target partition", () => {
  it("produces semantic weekday order, exact arithmetic, evidence, series, diagnostics, and a terminal receipt", () => {
    const fixture = executeFixture();
    expect(
      fixture.result,
      fixture.result.ok ? undefined : JSON.stringify(fixture.result.error),
    ).toMatchObject({ ok: true });
    if (!fixture.result.ok) return;
    const execution = fixture.result.value;
    const summary = execution.tables.find(
      (table) => table.tableKey === "weekday_summary",
    );
    expect(summary?.rows.map((row) => row.rowKey)).toEqual([
      "weekday_monday",
      "weekday_tuesday",
      "weekday_wednesday",
      "weekday_thursday",
      "weekday_friday",
    ]);
    expect(
      tableCell(
        fixture.result,
        "weekday_summary",
        "weekday_friday",
        "included_trade_count",
      ),
    ).toMatchObject({ kind: "integer", value: "10" });
    expect(
      tableCell(
        fixture.result,
        "weekday_summary",
        "weekday_friday",
        "net_pnl",
      ),
    ).toMatchObject({ kind: "exact_decimal", value: "-14", currency: "USD" });
    expect(
      tableCell(
        fixture.result,
        "weekday_summary",
        "weekday_friday",
        "net_expectancy",
      ),
    ).toMatchObject({ kind: "exact_decimal", value: "-1.4" });
    expect(
      tableCell(
        fixture.result,
        "weekday_summary",
        "weekday_friday",
        "median_net_pnl",
      ),
    ).toMatchObject({ kind: "exact_decimal", value: "-2" });
    expect(
      tableCell(
        fixture.result,
        "weekday_summary",
        "weekday_friday",
        "win_rate",
      ),
    ).toMatchObject({ kind: "exact_ratio", numerator: "1", denominator: "5" });
    expect(
      tableCell(
        fixture.result,
        "target_weekday_baseline_summary",
        "target_friday",
        "after_loss_count",
      ),
    ).toMatchObject({ kind: "integer", value: "5" });
    expect(execution.claims).toHaveLength(1);
    expect(execution.claims[0]).toMatchObject({
      claimType: "target_weekday_lower_historical_net_expectancy",
      confidenceEvidenceLabel: "tentative",
      outlierSensitivityState: "stable",
      targetSampleSize: "10",
      comparisonSampleSize: "20",
      allowedWordingCode:
        "target_weekday_had_lower_historical_expectancy_than_baseline",
    });
    expect(execution.claims[0].counterexampleEvidenceBundleDigests.length)
      .toBeGreaterThanOrEqual(2);
    expect(execution.series.map((series) => series.seriesKey)).toEqual([
      "exact_net_pnl_by_weekday",
      "included_trade_count_by_weekday",
      "exact_expectancy_by_weekday",
      "target_weekday_vs_baseline_expectancy",
    ]);
    expect(execution.receipt).toMatchObject({
      runStatus: "completed",
      partitionCurrency: "USD",
      includedCount: "30",
      excludedCount: "0",
    });
    expect(
      verifyAnalysisRunReceipt(execution.receipt, {
        runContext: execution.runContext,
        tables: execution.tables,
        claims: execution.claims,
        series: execution.series,
        evidenceBundles: execution.evidenceBundles,
        diagnostics: execution.diagnostics,
      }),
    ).toMatchObject({ ok: true });
  }, 30_000);

  it("proves target and baseline are disjoint and exhaustive", () => {
    const fixture = executeFixture();
    if (!fixture.result.ok) throw new Error(fixture.result.error.code);
    const comparison = fixture.result.value.tables.find(
      (table) => table.tableKey === "target_weekday_baseline_summary",
    );
    expect(comparison?.rows.map((row) => ({
      key: row.rowKey,
      evidence: fixture.result.ok
        ? fixture.result.value.evidenceBundles.find(
            (bundle) => bundle.bundleDigest === row.evidenceBundleDigest,
          )?.candidateKeys
        : [],
    }))).toSatisfy((groups: Array<{ evidence?: readonly string[] }>) => {
      const target = new Set(groups[0].evidence);
      const baseline = new Set(groups[1].evidence);
      return (
        [...target].every((key) => !baseline.has(key)) &&
        target.size + baseline.size === 30
      );
    });
  }, 30_000);
});

describe("GA0-B2 conservative sample and outlier policy", () => {
  it("returns a limited descriptive artifact graph and abstains below five target observations", () => {
    const target = eligibleTradeSpecs().filter((spec) => spec.date === "2026-07-03");
    const baseline = eligibleTradeSpecs().filter((spec) => spec.date !== "2026-07-03" && !["2026-07-10", "2026-07-17"].includes(spec.date));
    const fixture = executeFixture([...target, ...baseline]);
    expect(fixture.result).toMatchObject({ ok: true });
    if (!fixture.result.ok) return;
    expect(fixture.result.value.claims).toHaveLength(0);
    expect(fixture.result.value.receipt.runStatus).toBe("limited");
    expect(
      fixture.result.value.diagnostics.entries.map((entry) => entry.code),
    ).toContain("ti_v3_weekday_target_sample_insufficient");
    const expected = fixture.result.value.receipt.limitationCodes;
    expect(expected).toContain("ti_v3_weekday_target_sample_insufficient");
    expect(
      fixture.result.value.tables.every(
        (table) => JSON.stringify(table.limitationCodes) === JSON.stringify(expected),
      ),
    ).toBe(true);
    expect(
      fixture.result.value.series.every(
        (series) => JSON.stringify(series.limitationCodes) === JSON.stringify(expected),
      ),
    ).toBe(true);
  }, 30_000);

  it("labels an outlier-concentrated result and does not promote a tendency claim", () => {
    const specs = eligibleTradeSpecs().map((spec, index) =>
      spec.date === "2026-07-03" && index === 0
        ? { ...spec, netPnl: "-20" }
        : spec);
    const fixture = executeFixture(specs);
    expect(fixture.result).toMatchObject({ ok: true });
    if (!fixture.result.ok) return;
    expect(fixture.result.value.claims).toHaveLength(0);
    expect(fixture.result.value.receipt.runStatus).toBe("limited");
    expect(
      fixture.result.value.diagnostics.entries.map((entry) => entry.code),
    ).toContain("ti_v3_weekday_outlier_contribution_exceeded");
  }, 30_000);
});

describe("GA0-B2 persisted semantic replay authority", () => {
  it("accepts a persisted copy only after exact B1 replay and rejects protected graph mutations", () => {
    const fixture = executeFixture();
    if (!fixture.result.ok) throw new Error(fixture.result.error.code);
    const source = createSyntheticInMemoryReadOnlySource(fixture.authority);
    const persisted = JSON.parse(JSON.stringify(fixture.result.value));
    const genuine = rehydrateWeekdayAnalysisExecution(persisted, source);
    expect(genuine).toMatchObject({ ok: true });
    if (!genuine.ok) return;
    expect(genuine.value).not.toBe(persisted);
    expect(genuine.value.receipt.runDigest).toBe(
      fixture.result.value.receipt.runDigest,
    );
    expect(fixture.result.value.executionAuthority.toolKey).toBe(WEEKDAY_TOOL_KEY);

    const mutations: Array<(value: MutableWeekdayMutationGraph) => void> = [
      (value) => {
        const row = value.tables[0].rows.find(
          (item) => item.rowKey === "weekday_friday",
        );
        if (row === undefined) throw new Error("weekday_friday row missing");
        const cell = row.cells.find((item) => item.columnKey === "net_pnl");
        if (cell === undefined) throw new Error("net_pnl cell missing");
        cell.metric.value = "999";
      },
      (value) => {
        value.tables[0].rows.reverse();
      },
      (value) => {
        value.tables.pop();
      },
      (value) => {
        value.tables.push(value.tables[0]);
      },
      (value) => {
        value.evidenceBundles[0] = value.evidenceBundles[1];
      },
      (value) => {
        value.diagnostics.entries.push({
          diagnosticKey: "fabricated",
          severity: "info",
          code: "ti_v3_fabricated",
          affectedKeys: [value.runContext.partitionDigest],
        });
      },
      (value) => {
        value.normalizedArguments.values.targetWeekday = "monday";
      },
      (value) => {
        value.receipt.runDigest = value.receipt.diagnosticsDigest;
      },
      (value) => {
        value.executionAuthority.toolKey = "weekday_analysis";
      },
    ];
    for (const mutate of mutations) {
      const candidate = JSON.parse(JSON.stringify(persisted));
      mutate(candidate);
      expect(rehydrateWeekdayAnalysisExecution(candidate, source).ok).toBe(false);
    }
  }, 120_000);
});

describe("GA0-B2 complete exclusion-ledger claim policy", () => {
  const authority = (reasonCode: string, authorityName: string, sourceReasonCode: string | null = null) => ({
    reasonCode,
    authority: authorityName,
    sourceReasonCode,
    mappingPolicyKey: sourceReasonCode === null ? null : "ti_v3_manifest_exclusion_reason_mapping",
    mappingPolicyVersion: sourceReasonCode === null ? null : "v1",
  });
  const candidate = (overrides: Partial<ExcludedAnalyticalCandidate> = {}) => ({
    reasonCode: ANALYTICAL_EXCLUSION_REASONS.filterExcluded,
    sourceReasonCode: null,
    secondaryReasonCodes: [],
    sourceReasonCodes: [],
    limitationCodes: [],
    reasonAuthorities: [authority(ANALYTICAL_EXCLUSION_REASONS.filterExcluded, "canonical_filter")],
    ...overrides,
  }) as Pick<ExcludedAnalyticalCandidate, "reasonCode" | "secondaryReasonCodes" | "sourceReasonCode" | "sourceReasonCodes" | "reasonAuthorities" | "limitationCodes">;

  it("allows only exact neutral filter/lifecycle ledgers and fails closed otherwise", () => {
    expect(isClaimNeutralAnalyticalExclusion(candidate())).toBe(true);
    expect(isClaimNeutralAnalyticalExclusion(candidate({
      reasonCode: ANALYTICAL_EXCLUSION_REASONS.openLifecycle,
      reasonAuthorities: [authority(ANALYTICAL_EXCLUSION_REASONS.openLifecycle, "lifecycle")],
    }))).toBe(true);
    expect(isClaimNeutralAnalyticalExclusion(candidate({
      reasonCode: ANALYTICAL_EXCLUSION_REASONS.manifestExcluded,
      sourceReasonCode: "ti_v3_unknown_manifest_reason",
      sourceReasonCodes: ["ti_v3_unknown_manifest_reason"],
      reasonAuthorities: [authority(ANALYTICAL_EXCLUSION_REASONS.manifestExcluded, "manifest", "ti_v3_unknown_manifest_reason")],
    }))).toBe(false);
    expect(isClaimNeutralAnalyticalExclusion(candidate({
      reasonCode: ANALYTICAL_EXCLUSION_REASONS.mixedCurrency,
    }))).toBe(false);
    expect(isClaimNeutralAnalyticalExclusion(candidate({
      secondaryReasonCodes: [ANALYTICAL_EXCLUSION_REASONS.blockedReconstruction],
    }))).toBe(false);
  });

  it("keeps neutral-ledger classification invariant to ledger ordering", () => {
    const open = candidate({
      reasonCode: ANALYTICAL_EXCLUSION_REASONS.openLifecycle,
      sourceReasonCode: "ti_v3_eligibility_open_positions_excluded",
      sourceReasonCodes: ["ti_v3_eligibility_open_positions_excluded"],
      reasonAuthorities: [authority(
        ANALYTICAL_EXCLUSION_REASONS.openLifecycle,
        "lifecycle",
        "ti_v3_eligibility_open_positions_excluded",
      )],
    });
    expect(isClaimNeutralAnalyticalExclusion({
      ...open,
      sourceReasonCodes: [...open.sourceReasonCodes].reverse(),
      reasonAuthorities: [...open.reasonAuthorities].reverse(),
    })).toBe(isClaimNeutralAnalyticalExclusion(open));
  });
});

describe("GA0-B2 decision-time after-loss semantics", () => {
  function stateCount(
    result: ReturnType<typeof executeFixture>["result"],
    state: string,
  ): string {
    if (!result.ok) throw new Error(result.error.code);
    const table = result.value.tables.find(
      (item) => item.tableKey === "target_weekday_distributions",
    );
    const row = table?.rows.find((item) =>
      item.rowKey === `target_friday_after_loss_state_${state}`);
    const metric = row?.cells.find((item) => item.columnKey === "trade_count")
      ?.metric;
    if (metric?.kind !== "integer") return "0";
    return metric.value;
  }

  it("uses the latest trade strictly completed before entry and ignores an open earlier trade", () => {
    const specs: readonly TradeSpec[] = [
      { date: "2026-07-03", minute: 0, durationMinutes: 20, netPnl: "-1", instrument: "A" },
      { date: "2026-07-03", minute: 5, durationMinutes: 1, netPnl: "1", instrument: "B" },
      { date: "2026-07-03", minute: 10, durationMinutes: 1, netPnl: "1", instrument: "C" },
      { date: "2026-07-03", minute: 25, durationMinutes: 1, netPnl: "1", instrument: "D" },
      { date: "2026-07-06", minute: 30, netPnl: "1", instrument: "E" },
    ];
    const fixture = executeFixture(specs);
    expect(fixture.result).toMatchObject({ ok: true });
    expect(stateCount(fixture.result, "first_trade")).toBe("2");
    expect(stateCount(fixture.result, "not_after_loss")).toBe("1");
    expect(stateCount(fixture.result, "after_loss")).toBe("1");
  }, 30_000);

  it("fails closed for conflicting simultaneous completions and treats an equal decision boundary as incomplete", () => {
    const conflicting = executeFixture([
      { date: "2026-07-03", minute: 0, durationMinutes: 10, netPnl: "-1", instrument: "A" },
      { date: "2026-07-03", minute: 1, durationMinutes: 9, netPnl: "1", instrument: "B" },
      { date: "2026-07-03", minute: 15, netPnl: "1", instrument: "C" },
      { date: "2026-07-06", minute: 30, netPnl: "1", instrument: "D" },
    ]);
    expect(stateCount(
      conflicting.result,
      "unavailable_ambiguous_completion_order",
    )).toBe("1");
    if (!conflicting.result.ok) return;
    expect(conflicting.result.value.receipt.limitationCodes).toContain(
      "ti_v3_weekday_after_loss_completion_order_ambiguous",
    );

    const equalBoundary = executeFixture([
      { date: "2026-07-03", minute: 0, durationMinutes: 10, netPnl: "-1", instrument: "A" },
      { date: "2026-07-03", minute: 10, netPnl: "1", instrument: "B" },
      { date: "2026-07-06", minute: 30, netPnl: "1", instrument: "C" },
    ]);
    expect(stateCount(equalBoundary.result, "first_trade")).toBe("2");
    expect(stateCount(equalBoundary.result, "after_loss")).toBe("0");
  }, 30_000);
});

describe("GA0-B2 exact decomposition and hostile-key budgets", () => {
  it("uses deterministic UTC/New York entry clocks including the DST transition", () => {
    expect(resolveLocalClockFacts(
      "2026-03-08T06:30:00.000000000Z",
      "America/New_York",
    )).toMatchObject({
      ok: true,
      value: { localDate: "2026-03-08", hour: "1", minuteOfDay: "90" },
    });
    expect(resolveLocalClockFacts(
      "2026-03-08T07:30:00.000000000Z",
      "America/New_York",
    )).toMatchObject({
      ok: true,
      value: { localDate: "2026-03-08", hour: "3", minuteOfDay: "210" },
    });
    expect(resolveLocalClockFacts(
      "2026-03-08T07:30:00.000000000Z",
      "UTC",
    )).toMatchObject({
      ok: true,
      value: { hour: "7", minuteOfDay: "450" },
    });
  });

  it("emits exact entry-time, notional, quantity, and absolute-P/L decompositions", () => {
    const fixture = executeFixture();
    if (!fixture.result.ok) throw new Error(fixture.result.error.code);
    const comparison = fixture.result.value.tables.find(
      (table) => table.tableKey === "target_weekday_baseline_summary",
    );
    const effects = fixture.result.value.tables.find(
      (table) => table.tableKey === "target_weekday_comparison_effects",
    );
    const distributions = fixture.result.value.tables.find(
      (table) => table.tableKey === "target_weekday_distributions",
    );
    expect(comparison?.columns.map((column) => column.columnKey)).toEqual(
      expect.arrayContaining([
        "entry_minute_of_day_average",
        "entry_minute_of_day_median",
        "entry_notional_average",
        "entry_notional_median",
        "share_quantity_average",
        "share_quantity_median",
      ]),
    );
    expect(effects?.columns.map((column) => column.columnKey)).toContain(
      "target_absolute_pnl_activity_share",
    );
    expect(distributions?.rows.some((row) =>
      row.rowKey.includes("entry_time_30_minute_bucket"))).toBe(true);
    expect(distributions?.rows.some((row) =>
      row.rowKey.includes("entry_notional_exact_value"))).toBe(true);
    expect(distributions?.rows.some((row) =>
      row.rowKey.includes("share_quantity_exact_value"))).toBe(true);
  }, 30_000);

  it("bounds raw property keys before normalization and charges aggregate keys", () => {
    const atBoundary = "k".repeat(FOUNDATION_PAYLOAD_LIMITS.maxPropertyKeyLength);
    expect(validateExactRecord(
      { [atBoundary]: "v" },
      [atBoundary],
      [],
    ).ok).toBe(true);
    const overBoundary = "k".repeat(
      FOUNDATION_PAYLOAD_LIMITS.maxPropertyKeyLength + 1,
    );
    expect(validateExactRecord(
      { [overBoundary]: "v" },
      [overBoundary],
      [],
    ).ok).toBe(false);
    const aggregateKey = "k".repeat(
      FOUNDATION_PAYLOAD_LIMITS.maxPropertyKeyLength,
    );
    const aggregateKeyCount = Math.floor(
      FOUNDATION_PAYLOAD_LIMITS.maxAggregateStringLength / aggregateKey.length,
    ) + 1;
    const aggregateAttack = Array.from(
      { length: aggregateKeyCount },
      () => ({ [aggregateKey]: "" }),
    );
    expect(validateArray(aggregateAttack, "$", aggregateKeyCount).ok).toBe(false);
    expect(serializeCanonicalValue({ [atBoundary]: "v" }).ok).toBe(true);
    expect(serializeCanonicalValue({ [overBoundary]: "v" })).toMatchObject({
      ok: false,
      error: { code: "ti_v3_canonical_string_size_exceeded" },
    });
    expect(CANONICAL_SERIALIZATION_LIMITS.maxPropertyKeyCodeUnits).toBe(
      FOUNDATION_PAYLOAD_LIMITS.maxPropertyKeyLength,
    );
  });

  it("records the accepted 30-row graph below every shared graph ceiling", () => {
    const fixture = executeFixture();
    if (!fixture.result.ok) throw new Error(fixture.result.error.code);
    const measured = measureCanonicalGraph(fixture.result.value);
    expect(measured).toMatchObject({ ok: true });
    if (!measured.ok) return;
    expect(measured.value.nodeCount).toBeLessThan(
      CANONICAL_SERIALIZATION_LIMITS.maxNodeCount,
    );
    expect(measured.value.keyCount).toBeLessThan(
      CANONICAL_SERIALIZATION_LIMITS.maxKeyCount,
    );
    expect(measured.value.stringAndKeyCodeUnits).toBeLessThan(
      CANONICAL_SERIALIZATION_LIMITS.maxAggregateCodeUnits,
    );
  }, 30_000);

  it("measures an accepted 64-row worst-case weekday graph", () => {
    const dates = [
      "2026-07-01", "2026-07-02", "2026-07-03", "2026-07-06",
      "2026-07-07", "2026-07-08", "2026-07-09", "2026-07-10",
      "2026-07-13", "2026-07-14", "2026-07-15", "2026-07-16",
      "2026-07-17",
    ];
    const largeSpecs = dates.flatMap((date, dateIndex) =>
      [0, 5, 10, 15].map((minute, index) => ({
        date,
        minute,
        netPnl: (dateIndex + index) % 3 === 0 ? "-1" : "1",
      })),
    ).slice(0, 64);
    const fixture = executeFixture(largeSpecs);
    if (!fixture.result.ok) throw new Error(fixture.result.error.code);
    const measured = measureCanonicalGraph(fixture.result.value);
    expect(measured).toMatchObject({ ok: true });
    if (!measured.ok) return;
    expect(measured.value.nodeCount).toBeLessThan(
      CANONICAL_SERIALIZATION_LIMITS.maxNodeCount,
    );
    expect(measured.value.keyCount).toBeLessThan(
      CANONICAL_SERIALIZATION_LIMITS.maxKeyCount,
    );
    expect(measured.value.stringAndKeyCodeUnits).toBeLessThan(
      CANONICAL_SERIALIZATION_LIMITS.maxAggregateCodeUnits,
    );
  }, 60_000);
});

describe("GA0-B2 deterministic identity and blocked paths", () => {
  it("isolates USD and CAD into separate verified financial artifact graphs", () => {
    const mixedSpecs = [
      ...eligibleTradeSpecs(),
      { date: "2026-07-03", minute: 50, netPnl: "-1", currency: "CAD" as const },
      { date: "2026-07-06", minute: 50, netPnl: "1", currency: "CAD" as const },
    ];
    const authority = buildSyntheticGa0B1Authority(
      executionsForTrades(mixedSpecs),
    );
    const derived = readAnalyticalDatasetWithDerivation(
      createSyntheticInMemoryReadOnlySource(authority),
    );
    if (!derived.ok) throw new Error(derived.error.code);
    const executeCurrency = (currency: "CAD" | "USD") => {
      const partition = buildAnalyticalPartitionReceipt({
        schemaVersion: "ti_v3_analytical_partition_v1",
        datasetReceipt: derived.value.datasetReceipt,
        currency,
      });
      if (!partition.ok) throw new Error(partition.error.code);
      return executeWeekdayAnalysis({
        snapshot: authority.snapshot,
        snapshotDependencies: authority.snapshotDependencies,
        canonicalFilter: authority.snapshotDependencies.filter,
        datasetReceipt: derived.value.datasetReceipt,
        datasetDerivationReceipt: derived.value.derivationReceipt,
        partitionReceipt: partition.value,
      });
    };
    const usd = executeCurrency("USD");
    const cad = executeCurrency("CAD");
    expect(usd).toMatchObject({
      ok: true,
      value: { receipt: { partitionCurrency: "USD", includedCount: "30" } },
    });
    expect(cad).toMatchObject({
      ok: true,
      value: { receipt: { partitionCurrency: "CAD", includedCount: "2" } },
    });
    if (!usd.ok || !cad.ok) return;
    expect(
      usd.value.tables.flatMap((table) =>
        table.rows.flatMap((row) =>
          row.cells.map((entry) => entry.metric.currency)),
      ).filter((currency) => currency !== null),
    ).not.toContain("CAD");
    expect(
      cad.value.tables.flatMap((table) =>
        table.rows.flatMap((row) =>
          row.cells.map((entry) => entry.metric.currency)),
      ).filter((currency) => currency !== null),
    ).not.toContain("USD");
  }, 30_000);

  it("is invariant to caller execution order", () => {
    const specs = eligibleTradeSpecs();
    const forward = executeFixture(specs);
    const reversedAuthority = buildSyntheticGa0B1Authority(
      [...executionsForTrades(specs)].reverse(),
    );
    const reversedDerived = readAnalyticalDatasetWithDerivation(
      createSyntheticInMemoryReadOnlySource(reversedAuthority),
    );
    if (!forward.result.ok || !reversedDerived.ok) {
      throw new Error("fixture failed");
    }
    const reversedPartition = buildAnalyticalPartitionReceipt({
      schemaVersion: "ti_v3_analytical_partition_v1",
      datasetReceipt: reversedDerived.value.datasetReceipt,
      currency: "USD",
    });
    if (!reversedPartition.ok) throw new Error(reversedPartition.error.code);
    const reversed = executeWeekdayAnalysis({
      snapshot: reversedAuthority.snapshot,
      snapshotDependencies: reversedAuthority.snapshotDependencies,
      canonicalFilter: reversedAuthority.snapshotDependencies.filter,
      datasetReceipt: reversedDerived.value.datasetReceipt,
      datasetDerivationReceipt: reversedDerived.value.derivationReceipt,
      partitionReceipt: reversedPartition.value,
    });
    expect(reversed).toMatchObject({ ok: true });
    if (!reversed.ok) return;
    expect(reversed.value.receipt.runDigest).toBe(
      forward.result.value.receipt.runDigest,
    );
  }, 30_000);

  it("returns diagnostics-only blocked output for a verified zero-included partition", () => {
    const authority = buildSyntheticGa0B1Authority(
      executionsForTrades(eligibleTradeSpecs()),
      { filterOverrides: { outcomeFilters: ["flat"] } },
    );
    const derived = readAnalyticalDatasetWithDerivation(
      createSyntheticInMemoryReadOnlySource(authority),
    );
    if (!derived.ok) throw new Error(derived.error.code);
    const partition = buildAnalyticalPartitionReceipt({
      schemaVersion: "ti_v3_analytical_partition_v1",
      datasetReceipt: derived.value.datasetReceipt,
      currency: "USD",
    });
    if (!partition.ok) throw new Error(partition.error.code);
    const result = executeWeekdayAnalysis({
      snapshot: authority.snapshot,
      snapshotDependencies: authority.snapshotDependencies,
      canonicalFilter: authority.snapshotDependencies.filter,
      datasetReceipt: derived.value.datasetReceipt,
      datasetDerivationReceipt: derived.value.derivationReceipt,
      partitionReceipt: partition.value,
    });
    expect(result).toMatchObject({
      ok: true,
      value: {
        tables: [],
        claims: [],
        series: [],
        evidenceBundles: [],
        receipt: { runStatus: "blocked" },
        diagnostics: {
          entries: [{ severity: "blocked", code: "ti_v3_weekday_partition_blocked" }],
        },
      },
    });
  }, 30_000);
});
