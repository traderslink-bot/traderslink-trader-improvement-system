import {
  buildVerifiedAnalyticalDatasetDerivation,
  createSyntheticInMemoryReadOnlySource,
  readAnalyticalDatasetWithDerivation,
  type DerivedAnalyticalDataset,
} from "../../adapters";
import {
  buildAnalyticalDatasetReceipt,
  buildAnalyticalPartitionReceipt,
  buildAnalyticalRow,
  type AnalyticalDatasetReceipt,
  type AnalyticalPartitionReceipt,
  type AnalyticalRow,
} from "../../dataset";
import { buildSyntheticGa0B1Authority } from "../../../testing";
import {
  createInMemoryVerifiedTradeQueryDatasetSource,
  type VerifiedTradeQueryDatasetSource,
} from "../gateway";
import {
  TRADE_QUERY_PLAN_KEY,
  TRADE_QUERY_PLAN_SEMANTIC_VERSION,
  TRADE_QUERY_PLAN_VERSION,
  TRADE_QUERY_POLICY,
  tradeQueryAuthorityInput,
  type TradeQueryAuthority,
  type TradeQueryFilter,
  type TradeQueryGrouping,
  type TradeQueryMetricKey,
  type TradeQueryPlanAuthority,
} from "../contracts";

const WEEKDAYS = [
  "wednesday", "thursday", "friday", "saturday", "sunday", "monday", "tuesday",
] as const;
let cachedBaseDataset: AnalyticalDatasetReceipt | undefined;
const cachedRows = new Map<number, readonly AnalyticalRow[]>();

export interface SyntheticQueryPlanOptions {
  readonly filters?: readonly TradeQueryFilter[];
  readonly grouping?: TradeQueryGrouping;
  readonly metrics?: readonly TradeQueryMetricKey[];
  readonly ordering?: readonly Readonly<{
    by: "group_identity" | "metric";
    metricKey: TradeQueryMetricKey | null;
    direction: "ascending" | "descending";
  }>[];
  readonly limits?: Readonly<Partial<{
    groupLimit: string;
    resultRowLimit: string;
    evidencePerGroup: string;
    totalEvidenceLimit: string;
    diagnosticLimit: string;
  }>>;
}

export interface SyntheticRawQueryPlan {
  readonly schemaVersion: typeof TRADE_QUERY_PLAN_VERSION;
  readonly queryPlanKey: typeof TRADE_QUERY_PLAN_KEY;
  readonly queryPlanVersion: typeof TRADE_QUERY_PLAN_SEMANTIC_VERSION;
  readonly authority: TradeQueryPlanAuthority;
  readonly filters: readonly TradeQueryFilter[];
  readonly grouping: TradeQueryGrouping;
  readonly metrics: readonly TradeQueryMetricKey[];
  readonly ordering: readonly Readonly<{
    by: "group_identity" | "metric";
    metricKey: TradeQueryMetricKey | null;
    direction: "ascending" | "descending";
  }>[];
  readonly limits: Readonly<{
    groupLimit: string;
    resultRowLimit: string;
    evidencePerGroup: string;
    totalEvidenceLimit: string;
    diagnosticLimit: string;
  }>;
  readonly policies: typeof TRADE_QUERY_POLICY;
}

export interface SyntheticQueryFixture {
  readonly source: VerifiedTradeQueryDatasetSource;
  readonly derived: DerivedAnalyticalDataset;
  readonly partition: AnalyticalPartitionReceipt;
  readonly authority: TradeQueryAuthority;
  readonly plan: (options?: SyntheticQueryPlanOptions) => SyntheticRawQueryPlan;
}

export interface SyntheticQueryFixtureAvailabilityOptions {
  readonly unavailableShareQuantityIndices?: readonly number[];
  readonly unavailableEntryNotionalIndices?: readonly number[];
}

function baseDataset() {
  if (cachedBaseDataset !== undefined) return cachedBaseDataset;
  const authority = buildSyntheticGa0B1Authority();
  const read = readAnalyticalDatasetWithDerivation(
    createSyntheticInMemoryReadOnlySource(authority),
  );
  if (!read.ok) throw new Error(`${read.error.code}:${read.error.path}`);
  cachedBaseDataset = read.value.datasetReceipt;
  return cachedBaseDataset;
}

function buildRows(count: number): readonly AnalyticalRow[] {
  const known = cachedRows.get(count);
  if (known !== undefined) return known;
  const template = baseDataset().rows[0];
  const rows: AnalyticalRow[] = [];
  for (let index = 0; index < count; index += 1) {
    const dayIndex = index % 7;
    const date = `2026-07-${String(dayIndex + 1).padStart(2, "0")}`;
    const hour = 9 + (index % 6);
    const minute = (index * 7) % 60;
    const entryTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
    const exitMinuteTotal = hour * 60 + minute + 5 + (index % 20);
    const exitHour = (exitMinuteTotal - exitMinuteTotal % 60) / 60;
    const exitTime = `${String(exitHour).padStart(2, "0")}:${String(exitMinuteTotal % 60).padStart(2, "0")}:00`;
    const direction = index % 3 === 0 ? "short" : "long";
    const pnl = index % 5 === 0 ? "-5" : index % 5 === 1 ? "0" : String((index % 4) + 1);
    const { rowDigest: _rowDigest, ...content } = template;
    void _rowDigest;
    const row = buildAnalyticalRow({
      ...content,
      semanticRoundTripKey: `query_trade_${String(index + 1).padStart(5, "0")}`,
      supportingOccurrenceKeys: template.supportingExecutionDigests.map((_, occurrence) =>
        `query_occurrence_${String(index + 1).padStart(5, "0")}_${occurrence + 1}`),
      stableInstrumentKey: `instrument_${index % 3 === 0 ? "alpha" : index % 3 === 1 ? "beta" : "gamma"}`,
      displayedSymbol: index % 3 === 0 ? "ALPHA" : index % 3 === 1 ? "BETA" : "GAMMA",
      direction,
      firstEntryAt: `${date}T${entryTime}.000000000Z`,
      finalExitAt: `${date}T${exitTime}.000000000Z`,
      sessionDate: date,
      weekday: WEEKDAYS[dayIndex],
      sequenceInPartition: String(index + 1),
      grossPnl: pnl,
      signedCharges: "0",
      netPnl: pnl,
      entryNotional: { state: "available", amount: String(100 + (index % 5) * 50), currency: "USD" },
      shareQuantity: { state: "available", quantity: "100" },
    });
    if (!row.ok) throw new Error(`${row.error.code}:${row.error.path}`);
    rows.push(row.value);
  }
  const result = Object.freeze(rows);
  cachedRows.set(count, result);
  return result;
}

export function buildSyntheticQueryFixture(
  count = 30,
  reverseRows = false,
  availability: SyntheticQueryFixtureAvailabilityOptions = {},
): SyntheticQueryFixture {
  const base = baseDataset();
  const unavailableQuantities = new Set(availability.unavailableShareQuantityIndices ?? []);
  const unavailableNotionals = new Set(availability.unavailableEntryNotionalIndices ?? []);
  const rows = buildRows(count).map((row, index) => {
    if (!unavailableQuantities.has(index) && !unavailableNotionals.has(index)) return row;
    const { rowDigest: _rowDigest, ...content } = row;
    void _rowDigest;
    const rebuilt = buildAnalyticalRow({
      ...content,
      shareQuantity: unavailableQuantities.has(index)
        ? { state: "unavailable", reasonCode: "ti_v3_query_fixture_missing_quantity" }
        : row.shareQuantity,
      entryNotional: unavailableNotionals.has(index)
        ? { state: "unavailable", reasonCode: "ti_v3_query_fixture_missing_notional" }
        : row.entryNotional,
    });
    if (!rebuilt.ok) throw new Error(`${rebuilt.error.code}:${rebuilt.error.path}`);
    return rebuilt.value;
  });
  const dataset = buildAnalyticalDatasetReceipt({
    schemaVersion: base.schemaVersion,
    snapshotDigest: base.snapshotDigest,
    manifestDigest: base.manifestDigest,
    filterDigest: base.filterDigest,
    analysisCutoffAt: base.analysisCutoffAt,
    correctionCutoffAt: base.correctionCutoffAt,
    correctionResultDigest: base.correctionResultDigest,
    eligibilitySetDigest: base.eligibilitySetDigest,
    retrospectivePolicyDigest: base.retrospectivePolicyDigest,
    evidenceNamespace: base.evidenceNamespace,
    occurrenceInventoryDigest: base.occurrenceInventoryDigest,
    roundTripInventoryDigest: base.roundTripInventoryDigest,
    adapterKey: base.adapterKey,
    adapterVersion: base.adapterVersion,
    derivationPolicyKey: base.derivationPolicyKey,
    derivationPolicyVersion: base.derivationPolicyVersion,
    rows: reverseRows ? [...rows].reverse() : rows,
    excludedCandidates: [],
    limitations: [],
  });
  if (!dataset.ok) throw new Error(`${dataset.error.code}:${dataset.error.path}`);
  const derived = buildVerifiedAnalyticalDatasetDerivation(dataset.value);
  if (!derived.ok) throw new Error(`${derived.error.code}:${derived.error.path}`);
  const partition = buildAnalyticalPartitionReceipt({
    schemaVersion: "ti_v3_analytical_partition_v1",
    datasetReceipt: derived.value.datasetReceipt,
    currency: "USD",
  });
  if (!partition.ok) throw new Error(`${partition.error.code}:${partition.error.path}`);
  const authority = Object.freeze({
    datasetReceipt: derived.value.datasetReceipt,
    datasetDerivationReceipt: derived.value.derivationReceipt,
    partitionReceipt: partition.value,
  });
  return Object.freeze({
    source: createInMemoryVerifiedTradeQueryDatasetSource(derived.value),
    derived: derived.value,
    partition: partition.value,
    authority,
    plan: (options: SyntheticQueryPlanOptions = {}) => ({
      schemaVersion: TRADE_QUERY_PLAN_VERSION,
      queryPlanKey: TRADE_QUERY_PLAN_KEY,
      queryPlanVersion: TRADE_QUERY_PLAN_SEMANTIC_VERSION,
      authority: tradeQueryAuthorityInput(authority),
      filters: options.filters ?? [],
      grouping: options.grouping ?? { kind: "aggregate" },
      metrics: options.metrics ?? [
        "candidate_count", "included_count", "excluded_count",
        "win_count", "loss_count", "flat_count", "gross_pnl", "signed_charges",
        "net_pnl", "average_pnl", "median_pnl", "expectancy", "win_rate",
        "profit_factor", "average_position_size", "median_position_size",
        "average_holding_time", "median_holding_time",
        "largest_winner_contribution", "largest_loser_contribution",
        "net_pnl_excluding_largest_winner", "net_pnl_excluding_largest_loser",
      ],
      ordering: options.ordering ?? [{ by: "group_identity", metricKey: null, direction: "ascending" }],
      limits: {
        groupLimit: options.limits?.groupLimit ?? "64",
        resultRowLimit: options.limits?.resultRowLimit ?? "64",
        evidencePerGroup: options.limits?.evidencePerGroup ?? "4",
        totalEvidenceLimit: options.limits?.totalEvidenceLimit ?? "128",
        diagnosticLimit: options.limits?.diagnosticLimit ?? "16",
      },
      policies: TRADE_QUERY_POLICY,
    }),
  });
}

export function buildSyntheticQueryFixtureFromRows(
  rowsInput: readonly AnalyticalRow[],
  reverseRows = false,
): SyntheticQueryFixture {
  const base = baseDataset();
  const dataset = buildAnalyticalDatasetReceipt({
    schemaVersion: base.schemaVersion,
    snapshotDigest: base.snapshotDigest,
    manifestDigest: base.manifestDigest,
    filterDigest: base.filterDigest,
    analysisCutoffAt: base.analysisCutoffAt,
    correctionCutoffAt: base.correctionCutoffAt,
    correctionResultDigest: base.correctionResultDigest,
    eligibilitySetDigest: base.eligibilitySetDigest,
    retrospectivePolicyDigest: base.retrospectivePolicyDigest,
    evidenceNamespace: base.evidenceNamespace,
    occurrenceInventoryDigest: base.occurrenceInventoryDigest,
    roundTripInventoryDigest: base.roundTripInventoryDigest,
    adapterKey: base.adapterKey,
    adapterVersion: base.adapterVersion,
    derivationPolicyKey: base.derivationPolicyKey,
    derivationPolicyVersion: base.derivationPolicyVersion,
    rows: reverseRows ? [...rowsInput].reverse() : rowsInput,
    excludedCandidates: [],
    limitations: [],
  });
  if (!dataset.ok) throw new Error(`${dataset.error.code}:${dataset.error.path}`);
  const derived = buildVerifiedAnalyticalDatasetDerivation(dataset.value);
  if (!derived.ok) throw new Error(`${derived.error.code}:${derived.error.path}`);
  const partition = buildAnalyticalPartitionReceipt({
    schemaVersion: "ti_v3_analytical_partition_v1",
    datasetReceipt: derived.value.datasetReceipt,
    currency: "USD",
  });
  if (!partition.ok) throw new Error(`${partition.error.code}:${partition.error.path}`);
  const authority = Object.freeze({
    datasetReceipt: derived.value.datasetReceipt,
    datasetDerivationReceipt: derived.value.derivationReceipt,
    partitionReceipt: partition.value,
  });
  return Object.freeze({
    source: createInMemoryVerifiedTradeQueryDatasetSource(derived.value),
    derived: derived.value,
    partition: partition.value,
    authority,
    plan: (options: SyntheticQueryPlanOptions = {}) => ({
      schemaVersion: TRADE_QUERY_PLAN_VERSION,
      queryPlanKey: TRADE_QUERY_PLAN_KEY,
      queryPlanVersion: TRADE_QUERY_PLAN_SEMANTIC_VERSION,
      authority: tradeQueryAuthorityInput(authority),
      filters: options.filters ?? [],
      grouping: options.grouping ?? { kind: "aggregate" },
      metrics: options.metrics ?? [
        "candidate_count", "included_count", "excluded_count",
        "win_count", "loss_count", "flat_count", "gross_pnl", "signed_charges",
        "net_pnl", "average_pnl", "median_pnl", "expectancy", "win_rate",
      ],
      ordering: options.ordering ?? [
        { by: "group_identity", metricKey: null, direction: "ascending" },
      ],
      limits: {
        groupLimit: options.limits?.groupLimit ?? "64",
        resultRowLimit: options.limits?.resultRowLimit ?? "64",
        evidencePerGroup: options.limits?.evidencePerGroup ?? "4",
        totalEvidenceLimit: options.limits?.totalEvidenceLimit ?? "128",
        diagnosticLimit: options.limits?.diagnosticLimit ?? "16",
      },
      policies: TRADE_QUERY_POLICY,
    }),
  });
}
