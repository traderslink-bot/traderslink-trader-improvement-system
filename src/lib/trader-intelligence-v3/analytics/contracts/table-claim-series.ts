import { compareUnicodeCodePoints } from "../../domain/canonical";
import {
  addExactRatios,
  compareExactRatios,
  createExactRatio,
  decimalToExactRatio,
  parseCurrencyCode,
  subtractExactDecimals,
  type CanonicalDecimal,
  type CurrencyCode,
  type ExactRatio,
  type ExactResult,
} from "../../domain/exact";
import type { CanonicalContentDigest } from "../../domain/identity";
import {
  GA0_B1_CONTRACT_LIMITS,
  contractFailure,
  finalizeContentAddressedAuthority,
  validateCanonicalCount,
  validateClaimedDigest,
  validateContractKey,
  validateContractRecord,
  validateKeyArray,
  validateReasonCodes,
  validateTimezone,
  validateUnit,
  type AnalyticalContractFailure,
} from "./contract-validation";
import { buildExactMetricValue, exactMetricUnitRequiresCurrency, verifyExactMetricValue, type ExactMetricValue } from "./exact-metric";
import {
  verifyAnalyticalEvidenceBundle,
  type AnalyticalEvidenceBundle,
} from "./evidence-diagnostics";
import { getAnalysisRunContextDependencies, verifyAnalysisRunContext, type AnalysisRunContext } from "./run-context";

export const EXACT_TABLE_VERSION = "ti_v3_exact_table_v1" as const;
export const VALIDATED_CLAIM_VERSION = "ti_v3_validated_claim_v1" as const;
export const CHART_READY_SERIES_VERSION = "ti_v3_chart_ready_series_v1" as const;
export const DAILY_STOP_SAMPLE_SIZE_POLICY_KEY = "ti_v3_daily_stop_threshold_session_sample" as const;
export const DAILY_STOP_SAMPLE_SIZE_POLICY_VERSION = "v1" as const;
export const DAILY_STOP_SAMPLE_AUTHORITY_VERSION = "ti_v3_daily_stop_sample_authority_v1" as const;

export interface ExactTableColumn {
  readonly columnKey: string;
  readonly valueKind: ExactMetricValue["kind"];
  readonly allowedValueKinds?: readonly ExactMetricValue["kind"][];
  readonly unit: string;
}

export interface ExactTableCell {
  readonly columnKey: string;
  readonly metric: ExactMetricValue;
  readonly evidenceBundleDigest?: CanonicalContentDigest;
}

export interface ExactTableRow {
  readonly rowKey: string;
  readonly cells: readonly ExactTableCell[];
  readonly evidenceBundleDigest: CanonicalContentDigest;
}

export interface ExactTable {
  readonly schemaVersion: typeof EXACT_TABLE_VERSION;
  readonly tableKey: string;
  readonly tableVersion: string;
  readonly runContextDigest: CanonicalContentDigest;
  readonly snapshotDigest: CanonicalContentDigest;
  readonly filterDigest: CanonicalContentDigest;
  readonly partitionDigest: CanonicalContentDigest;
  readonly titlePurposeCode: string;
  readonly currency: CurrencyCode | null;
  readonly timezone: string;
  readonly dateBasis: string;
  readonly denominatorPolicy: string;
  readonly columns: readonly ExactTableColumn[];
  readonly rows: readonly ExactTableRow[];
  readonly summaryRows: readonly ExactTableRow[];
  readonly includedCount: string;
  readonly excludedCount: string;
  readonly coverageEligibilityState: "eligible" | "limited" | "blocked";
  readonly limitationCodes: readonly string[];
  readonly tableDigest: CanonicalContentDigest;
}

export interface ValidatedClaim {
  readonly schemaVersion: typeof VALIDATED_CLAIM_VERSION;
  readonly claimKey: string;
  readonly claimVersion: string;
  readonly claimType: string;
  readonly runContextDigest: CanonicalContentDigest;
  readonly tableDigest: CanonicalContentDigest;
  readonly partitionDigest: CanonicalContentDigest;
  readonly subjectGroupKey: string;
  readonly comparisonGroupKey: string | null;
  readonly metricKey: string;
  readonly effectDerivation: Readonly<{
    readonly kind: "table_cell" | "difference";
    readonly targetRowKey: string;
    readonly targetColumnKey: string;
    readonly comparisonRowKey: string | null;
    readonly comparisonColumnKey: string | null;
  }>;
  readonly direction: "positive" | "negative" | "flat" | "unavailable";
  readonly exactEffect: ExactMetricValue;
  readonly targetSampleSize: string;
  readonly comparisonSampleSize: string;
  readonly confidenceEvidenceLabel: "insufficient" | "descriptive" | "tentative" | "unavailable";
  readonly outlierSensitivityState: "not_evaluated" | "stable" | "sensitive" | "unavailable";
  readonly evidenceBundleDigests: readonly CanonicalContentDigest[];
  readonly counterexampleEvidenceBundleDigests: readonly CanonicalContentDigest[];
  readonly sampleSizeAuthority?: Readonly<{
    readonly schemaVersion: typeof DAILY_STOP_SAMPLE_AUTHORITY_VERSION;
    readonly policyKey: typeof DAILY_STOP_SAMPLE_SIZE_POLICY_KEY;
    readonly policyVersion: typeof DAILY_STOP_SAMPLE_SIZE_POLICY_VERSION;
    readonly runContextDigest: CanonicalContentDigest;
    readonly sessionsTableDigest: CanonicalContentDigest;
    readonly aggregateTableDigest: CanonicalContentDigest;
    readonly sourceTableKey: "daily_stop_aggregate";
    readonly sourceTableVersion: "v1";
    readonly sourceRowKey: "aggregate";
    readonly sourceColumnKey: "threshold_reached_session_count";
    readonly thresholdReachedSessionRowKeys: readonly string[];
    readonly thresholdReachedSessionCount: string;
    readonly authorityDigest: CanonicalContentDigest;
  }>;
  readonly limitationCodes: readonly string[];
  readonly allowedWordingCode: string;
  readonly claimDigest: CanonicalContentDigest;
}

export type DailyStopSampleAuthority = NonNullable<ValidatedClaim["sampleSizeAuthority"]>;

function thresholdReachedSessionRowKeys(
  sessionsTable: ExactTable,
): ExactResult<readonly string[], AnalyticalContractFailure> {
  if (sessionsTable.tableKey !== "daily_stop_sessions" || sessionsTable.tableVersion !== "v1") {
    return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.sampleSizeAuthority.sessionsTable");
  }
  const keys: string[] = [];
  for (const row of sessionsTable.rows) {
    const threshold = row.cells.find((cell) => cell.columnKey === "threshold_reached")?.metric;
    if (threshold?.kind === "enum" && threshold.value === "reached") keys.push(row.rowKey);
  }
  return { ok: true, value: Object.freeze(keys.sort(compareUnicodeCodePoints)) };
}

export function buildDailyStopSampleAuthority(input: Readonly<{
  readonly runContextDigest: CanonicalContentDigest;
  readonly sessionsTable: ExactTable;
  readonly aggregateTable: ExactTable;
}>): ExactResult<DailyStopSampleAuthority, AnalyticalContractFailure> {
  if (input.aggregateTable.tableKey !== "daily_stop_aggregate" || input.aggregateTable.tableVersion !== "v1") {
    return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.sampleSizeAuthority.aggregateTable");
  }
  if (input.sessionsTable.runContextDigest !== input.runContextDigest || input.aggregateTable.runContextDigest !== input.runContextDigest) {
    return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.sampleSizeAuthority.runContextDigest");
  }
  const rowKeys = thresholdReachedSessionRowKeys(input.sessionsTable);
  if (!rowKeys.ok) return rowKeys;
  const aggregateRow = input.aggregateTable.rows.find((row) => row.rowKey === "aggregate");
  const aggregateCount = aggregateRow?.cells.find((cell) => cell.columnKey === "threshold_reached_session_count")?.metric;
  if (aggregateCount?.kind !== "integer" || aggregateCount.unit !== "count" || aggregateCount.value !== String(rowKeys.value.length)) {
    return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.sampleSizeAuthority.thresholdReachedSessionCount");
  }
  return finalizeContentAddressedAuthority("daily_stop_sample_authority", {
    schemaVersion: DAILY_STOP_SAMPLE_AUTHORITY_VERSION,
    policyKey: DAILY_STOP_SAMPLE_SIZE_POLICY_KEY,
    policyVersion: DAILY_STOP_SAMPLE_SIZE_POLICY_VERSION,
    runContextDigest: input.runContextDigest,
    sessionsTableDigest: input.sessionsTable.tableDigest,
    aggregateTableDigest: input.aggregateTable.tableDigest,
    sourceTableKey: "daily_stop_aggregate",
    sourceTableVersion: "v1",
    sourceRowKey: "aggregate",
    sourceColumnKey: "threshold_reached_session_count",
    thresholdReachedSessionRowKeys: rowKeys.value,
    thresholdReachedSessionCount: String(rowKeys.value.length),
  }, "authorityDigest") as ExactResult<DailyStopSampleAuthority, AnalyticalContractFailure>;
}

function verifyDailyStopSampleAuthority(
  input: unknown,
  context: AnalysisRunContext,
  sessionsTable: ExactTable,
  aggregateTable: ExactTable,
): ExactResult<DailyStopSampleAuthority, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion", "policyKey", "policyVersion", "runContextDigest", "sessionsTableDigest", "aggregateTableDigest",
    "sourceTableKey", "sourceTableVersion", "sourceRowKey", "sourceColumnKey", "thresholdReachedSessionRowKeys",
    "thresholdReachedSessionCount", "authorityDigest",
  ], [], "$.sampleSizeAuthority");
  if (!record.ok) return record;
  const runContextDigest = validateClaimedDigest(record.value.runContextDigest, "$.sampleSizeAuthority.runContextDigest", "analysis_run_context");
  const sessionsDigest = validateClaimedDigest(record.value.sessionsTableDigest, "$.sampleSizeAuthority.sessionsTableDigest", "exact_table");
  const aggregateDigest = validateClaimedDigest(record.value.aggregateTableDigest, "$.sampleSizeAuthority.aggregateTableDigest", "exact_table");
  const authorityDigest = validateClaimedDigest(record.value.authorityDigest, "$.sampleSizeAuthority.authorityDigest", "daily_stop_sample_authority");
  const rowKeys = validateKeyArray(record.value.thresholdReachedSessionRowKeys, "$.sampleSizeAuthority.thresholdReachedSessionRowKeys");
  const count = validateCanonicalCount(record.value.thresholdReachedSessionCount, "$.sampleSizeAuthority.thresholdReachedSessionCount");
  if (!runContextDigest.ok) return runContextDigest;
  if (!sessionsDigest.ok) return sessionsDigest;
  if (!aggregateDigest.ok) return aggregateDigest;
  if (!authorityDigest.ok) return authorityDigest;
  if (!rowKeys.ok) return rowKeys;
  if (!count.ok) return count;
  if (
    record.value.schemaVersion !== DAILY_STOP_SAMPLE_AUTHORITY_VERSION ||
    record.value.policyKey !== DAILY_STOP_SAMPLE_SIZE_POLICY_KEY ||
    record.value.policyVersion !== DAILY_STOP_SAMPLE_SIZE_POLICY_VERSION ||
    runContextDigest.value !== context.runContextDigest ||
    sessionsDigest.value !== sessionsTable.tableDigest ||
    aggregateDigest.value !== aggregateTable.tableDigest ||
    record.value.sourceTableKey !== "daily_stop_aggregate" ||
    record.value.sourceTableVersion !== "v1" ||
    record.value.sourceRowKey !== "aggregate" ||
    record.value.sourceColumnKey !== "threshold_reached_session_count"
  ) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.sampleSizeAuthority");
  const expected = buildDailyStopSampleAuthority({ runContextDigest: context.runContextDigest, sessionsTable, aggregateTable });
  if (!expected.ok) return expected;
  if (
    count.value !== expected.value.thresholdReachedSessionCount ||
    rowKeys.value.join("\u0000") !== expected.value.thresholdReachedSessionRowKeys.join("\u0000") ||
    authorityDigest.value !== expected.value.authorityDigest
  ) return contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.sampleSizeAuthority.authorityDigest");
  return expected;
}

export interface ChartReadySeriesPoint {
  readonly pointKey: string;
  readonly sourceRowKey: string;
  readonly sourceColumnKey: string;
  readonly semanticOrder: string;
  readonly exactValue: ExactMetricValue;
  readonly sampleSize: string;
  readonly evidenceBundleDigest: CanonicalContentDigest;
}

export interface ChartReadySeries {
  readonly schemaVersion: typeof CHART_READY_SERIES_VERSION;
  readonly seriesKey: string;
  readonly seriesVersion: string;
  readonly approvedVisualPurpose: string;
  readonly allowedVisualTemplateKeys: readonly string[];
  readonly runContextDigest: CanonicalContentDigest;
  readonly sourceTableDigest: CanonicalContentDigest;
  readonly partitionDigest: CanonicalContentDigest;
  readonly xDomain: string;
  readonly unit: string;
  readonly currency: CurrencyCode | null;
  readonly timezone: string;
  readonly dateBasis: string;
  readonly zeroBaselineRequired: boolean;
  readonly denominatorPolicy: string;
  readonly points: readonly ChartReadySeriesPoint[];
  readonly includedCount: string;
  readonly excludedCount: string;
  readonly accessibilitySummaryFacts: readonly ExactMetricValue[];
  readonly accessibilitySummarySelections: readonly Readonly<{ readonly rowKey: string; readonly columnKey: string }>[];
  readonly pointBudget: string;
  readonly downsamplingPolicy: "none_exact_points_only";
  readonly limitationCodes: readonly string[];
  readonly tableAlternativeDigest: CanonicalContentDigest;
  readonly seriesDigest: CanonicalContentDigest;
}

function parseCurrency(input: unknown, path: string): ExactResult<CurrencyCode | null, AnalyticalContractFailure> {
  if (input === null) return { ok: true, value: null };
  const currency = parseCurrencyCode(input);
  return currency.ok ? currency : contractFailure("ti_v3_analytics_contract_invalid", path);
}

// 2026-07-23 America/Toronto: claim arithmetic keeps mixed decimal/ratio
// comparisons exact by promoting both operands to reduced ratios.
function metricAsRatio(metric: ExactMetricValue): ExactResult<ExactRatio, AnalyticalContractFailure> {
  if (metric.kind === "exact_ratio") {
    const ratio = createExactRatio(metric.numerator, metric.denominator);
    return ratio.ok ? ratio : contractFailure("ti_v3_analytics_contract_invalid", "$.effectDerivation");
  }
  if (metric.kind === "exact_decimal") {
    const ratio = decimalToExactRatio(metric.value as CanonicalDecimal);
    return ratio.ok ? ratio : contractFailure("ti_v3_analytics_contract_invalid", "$.effectDerivation");
  }
  return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.effectDerivation");
}

function subtractMetricExactly(
  target: ExactMetricValue,
  comparison: ExactMetricValue,
  metricKey: string,
): ExactResult<ExactMetricValue, AnalyticalContractFailure> {
  // 2026-07-23 America/Toronto: a difference may compare one semantic metric
  // only; the claim key cannot relabel compatible source cells.
  if (
    target.metricKey !== comparison.metricKey ||
    target.metricKey !== metricKey ||
    target.unit !== comparison.unit ||
    target.currency !== comparison.currency ||
    !["exact_decimal", "exact_ratio"].includes(target.kind) ||
    !["exact_decimal", "exact_ratio"].includes(comparison.kind)
  ) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.effectDerivation");
  if (target.kind === "exact_decimal" && comparison.kind === "exact_decimal") {
    const difference = subtractExactDecimals(
      target.value as CanonicalDecimal,
      comparison.value as CanonicalDecimal,
    );
    if (!difference.ok) return contractFailure("ti_v3_analytics_contract_invalid", "$.effectDerivation");
    return buildExactMetricValue({
      schemaVersion: "ti_v3_exact_metric_value_v1",
      metricKey,
      kind: "exact_decimal",
      unit: target.unit,
      currency: target.currency,
      value: difference.value,
    });
  }
  const left = metricAsRatio(target);
  const right = metricAsRatio(comparison);
  if (!left.ok) return left;
  if (!right.ok) return right;
  const negated = createExactRatio(
    (-BigInt(right.value.numerator)).toString(),
    right.value.denominator,
  );
  if (!negated.ok) return contractFailure("ti_v3_analytics_contract_invalid", "$.effectDerivation");
  const difference = addExactRatios(left.value, negated.value);
  if (!difference.ok) return contractFailure("ti_v3_analytics_contract_invalid", "$.effectDerivation");
  return buildExactMetricValue({
    schemaVersion: "ti_v3_exact_metric_value_v1",
    metricKey,
    kind: "exact_ratio",
    unit: target.unit,
    currency: target.currency,
    value: null,
    numerator: difference.value.numerator,
    denominator: difference.value.denominator,
  });
}

function exactMetricDirection(
  metric: ExactMetricValue,
): ValidatedClaim["direction"] {
  if (metric.kind === "unavailable") return "unavailable";
  if (metric.kind === "exact_ratio") {
    const ratio = createExactRatio(metric.numerator, metric.denominator);
    if (!ratio.ok) return "unavailable";
    const zero = createExactRatio("0", "1");
    if (!zero.ok) return "unavailable";
    const compared = compareExactRatios(
      ratio.value,
      zero.value,
    );
    return compared === 0 ? "flat" : compared < 0 ? "negative" : "positive";
  }
  if (metric.kind === "exact_decimal" || metric.kind === "integer") {
    return metric.value === "0" ? "flat" : metric.value.startsWith("-") ? "negative" : "positive";
  }
  return "unavailable";
}

function evidenceCatalog(
  inputs: readonly AnalyticalEvidenceBundle[],
  context: AnalysisRunContext,
): ExactResult<ReadonlyMap<CanonicalContentDigest, AnalyticalEvidenceBundle>, AnalyticalContractFailure> {
  const values = new Map<CanonicalContentDigest, AnalyticalEvidenceBundle>();
  for (let index = 0; index < inputs.length; index += 1) {
    const evidence = verifyAnalyticalEvidenceBundle(inputs[index], context);
    if (!evidence.ok) return contractFailure(evidence.error.code, `$.evidenceBundles[${index}]${evidence.error.path.slice(1)}`);
    if (values.has(evidence.value.bundleDigest)) return contractFailure("ti_v3_analytics_contract_duplicate_identity", "$.evidenceBundles");
    values.set(evidence.value.bundleDigest, evidence.value);
  }
  return { ok: true, value: values };
}

function parseColumns(input: unknown): ExactResult<readonly ExactTableColumn[], AnalyticalContractFailure> {
  if (!Array.isArray(input) || input.length === 0 || input.length > GA0_B1_CONTRACT_LIMITS.maximumColumns) return contractFailure("ti_v3_analytics_contract_oversized", "$.columns");
  const columns: ExactTableColumn[] = [];
  const kinds = new Set<ExactMetricValue["kind"]>(["exact_decimal", "exact_ratio", "integer", "duration", "timestamp", "date", "enum", "identity", "unavailable"]);
  for (let index = 0; index < input.length; index += 1) {
    const path = `$.columns[${index}]`;
    const record = validateContractRecord(
      input[index],
      ["columnKey", "valueKind", "unit"],
      ["allowedValueKinds"],
      path,
    );
    if (!record.ok) return record;
    const key = validateContractKey(record.value.columnKey, `${path}.columnKey`);
    const unit = validateUnit(record.value.unit, `${path}.unit`);
    if (!key.ok) return key;
    if (!unit.ok) return unit;
    if (typeof record.value.valueKind !== "string" || !kinds.has(record.value.valueKind as ExactMetricValue["kind"])) return contractFailure("ti_v3_analytics_contract_invalid", `${path}.valueKind`);
    let allowedValueKinds: readonly ExactMetricValue["kind"][] | undefined;
    if (record.value.allowedValueKinds !== undefined) {
      if (
        !Array.isArray(record.value.allowedValueKinds) ||
        record.value.allowedValueKinds.length === 0 ||
        record.value.allowedValueKinds.some(
          (kind) => typeof kind !== "string" ||
            !kinds.has(kind as ExactMetricValue["kind"]),
        )
      ) {
        return contractFailure(
          "ti_v3_analytics_contract_invalid",
          `${path}.allowedValueKinds`,
        );
      }
      const parsedKinds = record.value.allowedValueKinds as ExactMetricValue["kind"][];
      if (
        new Set(parsedKinds).size !== parsedKinds.length ||
        !parsedKinds.includes(record.value.valueKind as ExactMetricValue["kind"])
      ) {
        return contractFailure(
          "ti_v3_analytics_contract_invalid",
          `${path}.allowedValueKinds`,
        );
      }
      allowedValueKinds = Object.freeze([...parsedKinds]);
    }
    columns.push(Object.freeze({
      columnKey: key.value,
      valueKind: record.value.valueKind as ExactMetricValue["kind"],
      ...(allowedValueKinds === undefined ? {} : { allowedValueKinds }),
      unit: unit.value,
    }));
  }
  if (new Set(columns.map((column) => column.columnKey)).size !== columns.length) return contractFailure("ti_v3_analytics_contract_duplicate_identity", "$.columns");
  return { ok: true, value: Object.freeze(columns) };
}

function parseRows(
  input: unknown,
  path: string,
  columns: readonly ExactTableColumn[],
  currency: CurrencyCode | null,
  evidence: ReadonlyMap<CanonicalContentDigest, AnalyticalEvidenceBundle>,
): ExactResult<readonly ExactTableRow[], AnalyticalContractFailure> {
  if (!Array.isArray(input) || input.length > GA0_B1_CONTRACT_LIMITS.maximumRows) return contractFailure("ti_v3_analytics_contract_oversized", path);
  const rows: ExactTableRow[] = [];
  for (let index = 0; index < input.length; index += 1) {
    const rowPath = `${path}[${index}]`;
    const record = validateContractRecord(input[index], ["rowKey", "cells", "evidenceBundleDigest"], [], rowPath);
    if (!record.ok) return record;
    const rowKey = validateContractKey(record.value.rowKey, `${rowPath}.rowKey`);
    if (!rowKey.ok) return rowKey;
    const evidenceDigest = validateClaimedDigest(record.value.evidenceBundleDigest, `${rowPath}.evidenceBundleDigest`, "analytical_evidence_bundle");
    if (!evidenceDigest.ok || !evidence.has(evidenceDigest.value)) return contractFailure("ti_v3_analytics_contract_reference_mismatch", `${rowPath}.evidenceBundleDigest`);
    if (!Array.isArray(record.value.cells) || record.value.cells.length !== columns.length) return contractFailure("ti_v3_analytics_contract_reference_mismatch", `${rowPath}.cells`);
    const cells: ExactTableCell[] = [];
    for (let cellIndex = 0; cellIndex < record.value.cells.length; cellIndex += 1) {
      const cellPath = `${rowPath}.cells[${cellIndex}]`;
      const cell = validateContractRecord(
        record.value.cells[cellIndex],
        ["columnKey", "metric"],
        ["evidenceBundleDigest"],
        cellPath,
      );
      if (!cell.ok) return cell;
      const expectedColumn = columns[cellIndex];
      if (cell.value.columnKey !== expectedColumn.columnKey) return contractFailure("ti_v3_analytics_contract_reference_mismatch", `${cellPath}.columnKey`);
      const metric = verifyExactMetricValue(cell.value.metric);
      if (!metric.ok) return contractFailure(metric.error.code, `${cellPath}.metric${metric.error.path.slice(1)}`);
      if (
        !(expectedColumn.allowedValueKinds ?? [expectedColumn.valueKind]).includes(
          metric.value.kind,
        ) ||
        metric.value.unit !== expectedColumn.unit ||
        (exactMetricUnitRequiresCurrency(metric.value.unit)
          ? metric.value.currency !== currency
          : metric.value.currency !== null)
      ) return contractFailure("ti_v3_analytics_contract_unit_mismatch", `${cellPath}.metric`);
      let cellEvidenceDigest: CanonicalContentDigest | undefined;
      if (cell.value.evidenceBundleDigest !== undefined) {
        const parsedEvidenceDigest = validateClaimedDigest(
          cell.value.evidenceBundleDigest,
          `${cellPath}.evidenceBundleDigest`,
          "analytical_evidence_bundle",
        );
        if (
          !parsedEvidenceDigest.ok ||
          !evidence.has(parsedEvidenceDigest.value)
        ) {
          return contractFailure(
            "ti_v3_analytics_contract_reference_mismatch",
            `${cellPath}.evidenceBundleDigest`,
          );
        }
        cellEvidenceDigest = parsedEvidenceDigest.value;
      }
      cells.push(Object.freeze({
        columnKey: expectedColumn.columnKey,
        metric: metric.value,
        ...(cellEvidenceDigest === undefined
          ? {}
          : { evidenceBundleDigest: cellEvidenceDigest }),
      }));
    }
    rows.push(Object.freeze({ rowKey: rowKey.value, cells: Object.freeze(cells), evidenceBundleDigest: evidenceDigest.value }));
  }
  if (new Set(rows.map((row) => row.rowKey)).size !== rows.length) return contractFailure("ti_v3_analytics_contract_duplicate_identity", path);
  return { ok: true, value: Object.freeze(rows) };
}

export function buildExactTable(
  input: unknown,
): ExactResult<ExactTable, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion", "tableKey", "tableVersion", "runContext", "titlePurposeCode",
    "currency", "timezone", "dateBasis", "denominatorPolicy", "columns", "rows",
    "summaryRows", "includedCount", "excludedCount", "coverageEligibilityState",
    "limitationCodes", "evidenceBundles",
  ]);
  if (!record.ok) return record;
  if (record.value.schemaVersion !== EXACT_TABLE_VERSION) return contractFailure("ti_v3_analytics_contract_invalid", "$.schemaVersion");
  const authorities = input as Record<string, unknown>;
  const context = verifyAnalysisRunContext(authorities.runContext);
  if (!context.ok) return contractFailure(context.error.code, `$.runContext${context.error.path.slice(1)}`);
  const tableKey = validateContractKey(record.value.tableKey, "$.tableKey");
  const tableVersion = validateContractKey(record.value.tableVersion, "$.tableVersion");
  const purpose = validateContractKey(record.value.titlePurposeCode, "$.titlePurposeCode");
  const timezone = validateTimezone(record.value.timezone, "$.timezone");
  const dateBasis = validateContractKey(record.value.dateBasis, "$.dateBasis");
  const denominator = validateContractKey(record.value.denominatorPolicy, "$.denominatorPolicy");
  if (!tableKey.ok) return tableKey; if (!tableVersion.ok) return tableVersion; if (!purpose.ok) return purpose;
  if (!timezone.ok) return timezone; if (!dateBasis.ok) return dateBasis; if (!denominator.ok) return denominator;
  const currency = parseCurrency(record.value.currency, "$.currency");
  if (!currency.ok) return currency;
  const dependencies = getAnalysisRunContextDependencies(context.value);
  if (dependencies === null) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.runContext");
  if (
    timezone.value !== dependencies.canonicalFilter.timezone ||
    dateBasis.value !== dependencies.canonicalFilter.dateBasis ||
    currency.value !== dependencies.partitionReceipt.currency
  ) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.scope");
  const columns = parseColumns(record.value.columns); if (!columns.ok) return columns;
  if (!Array.isArray(record.value.evidenceBundles)) return contractFailure("ti_v3_analytics_contract_invalid", "$.evidenceBundles");
  const evidence = evidenceCatalog(authorities.evidenceBundles as readonly AnalyticalEvidenceBundle[], context.value); if (!evidence.ok) return evidence;
  const rows = parseRows(record.value.rows, "$.rows", columns.value, currency.value, evidence.value); if (!rows.ok) return rows;
  const summaryRows = parseRows(record.value.summaryRows, "$.summaryRows", columns.value, currency.value, evidence.value); if (!summaryRows.ok) return summaryRows;
  if (rows.value.some((row) => summaryRows.value.some((summary) => summary.rowKey === row.rowKey))) return contractFailure("ti_v3_analytics_contract_duplicate_identity", "$.summaryRows");
  const included = validateCanonicalCount(record.value.includedCount, "$.includedCount");
  const excluded = validateCanonicalCount(record.value.excludedCount, "$.excludedCount");
  if (!included.ok) return included; if (!excluded.ok) return excluded;
  if (record.value.coverageEligibilityState !== "eligible" && record.value.coverageEligibilityState !== "limited" && record.value.coverageEligibilityState !== "blocked") return contractFailure("ti_v3_analytics_contract_invalid", "$.coverageEligibilityState");
  const limitations = validateReasonCodes(record.value.limitationCodes, "$.limitationCodes"); if (!limitations.ok) return limitations;
  const eligibility = dependencies.snapshotDependencies.eligibilitySet.results.find((result) => result.capability === context.value.requiredEligibilityCapability);
  const expectedLimitations = [...new Set([
    ...dependencies.partitionReceipt.limitationCodes,
    ...(eligibility?.state === "limited" ? eligibility.reasonCodes : []),
  ])].sort(compareUnicodeCodePoints);
  if (
    included.value !== dependencies.partitionReceipt.includedCount ||
    excluded.value !== dependencies.partitionReceipt.excludedCount ||
    record.value.coverageEligibilityState !== context.value.eligibilityState ||
    expectedLimitations.some(
      (limitation) => !limitations.value.includes(limitation),
    )
  ) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.scope");
  return finalizeContentAddressedAuthority("exact_table", {
    schemaVersion: EXACT_TABLE_VERSION, tableKey: tableKey.value, tableVersion: tableVersion.value,
    runContextDigest: context.value.runContextDigest, snapshotDigest: context.value.snapshotDigest,
    filterDigest: context.value.filterDigest, partitionDigest: context.value.partitionDigest,
    titlePurposeCode: purpose.value, currency: currency.value,
    timezone: timezone.value, dateBasis: dateBasis.value, denominatorPolicy: denominator.value,
    columns: columns.value, rows: rows.value, summaryRows: summaryRows.value,
    includedCount: included.value, excludedCount: excluded.value,
    coverageEligibilityState: record.value.coverageEligibilityState,
    limitationCodes: limitations.value,
  }, "tableDigest") as ExactResult<ExactTable, AnalyticalContractFailure>;
}

export function verifyExactTable(
  input: unknown,
  runContext: AnalysisRunContext,
  evidenceBundles: readonly AnalyticalEvidenceBundle[],
): ExactResult<ExactTable, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion", "tableKey", "tableVersion", "runContextDigest", "snapshotDigest",
    "filterDigest", "partitionDigest", "titlePurposeCode", "currency", "timezone", "dateBasis",
    "denominatorPolicy", "columns", "rows", "summaryRows", "includedCount",
    "excludedCount", "coverageEligibilityState", "limitationCodes", "tableDigest",
  ]);
  if (!record.ok) return record;
  const context = verifyAnalysisRunContext(runContext);
  if (!context.ok || record.value.runContextDigest !== context.value.runContextDigest || record.value.snapshotDigest !== context.value.snapshotDigest || record.value.filterDigest !== context.value.filterDigest || record.value.partitionDigest !== context.value.partitionDigest) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$");
  const digest = validateClaimedDigest(record.value.tableDigest, "$.tableDigest", "exact_table"); if (!digest.ok) return digest;
  const { tableDigest: _tableDigest, runContextDigest: _contextDigest, snapshotDigest: _snapshotDigest, filterDigest: _filterDigest, partitionDigest: _partitionDigest, ...content } = record.value;
  void _tableDigest; void _contextDigest; void _snapshotDigest; void _filterDigest; void _partitionDigest;
  const rebuilt = buildExactTable({ ...content, runContext: context.value, evidenceBundles });
  if (!rebuilt.ok || rebuilt.value.tableDigest !== digest.value) return contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.tableDigest");
  return rebuilt;
}

export function buildValidatedClaim(input: unknown): ExactResult<ValidatedClaim, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion", "claimKey", "claimVersion", "claimType", "runContext", "table",
    "subjectGroupKey", "comparisonGroupKey", "metricKey", "effectDerivation",
    "confidenceEvidenceLabel", "outlierSensitivityState", "evidenceBundles",
    "allowedWordingCode",
  ], ["counterexampleEvidenceBundleDigests", "sampleSizeAuthority", "sourceTables"]);
  if (!record.ok) return record;
  if (record.value.schemaVersion !== VALIDATED_CLAIM_VERSION) return contractFailure("ti_v3_analytics_contract_invalid", "$.schemaVersion");
  const authorities = input as Record<string, unknown>;
  const context = verifyAnalysisRunContext(authorities.runContext); if (!context.ok) return context;
  if (!Array.isArray(record.value.evidenceBundles)) return contractFailure("ti_v3_analytics_contract_invalid", "$.evidenceBundles");
  const bundles = authorities.evidenceBundles as readonly AnalyticalEvidenceBundle[];
  const table = verifyExactTable(authorities.table, context.value, bundles); if (!table.ok) return table;
  const keys = ["claimKey", "claimVersion", "claimType", "subjectGroupKey", "metricKey", "allowedWordingCode"] as const;
  const parsed = new Map<string, string>();
  for (const key of keys) { const value = validateContractKey(record.value[key], `$.${key}`); if (!value.ok) return value; parsed.set(key, value.value); }
  let comparisonGroupKey: string | null = null;
  if (record.value.comparisonGroupKey !== null) { const value = validateContractKey(record.value.comparisonGroupKey, "$.comparisonGroupKey"); if (!value.ok) return value; comparisonGroupKey = value.value; }
  const derivation = validateContractRecord(record.value.effectDerivation, ["kind", "targetRowKey", "targetColumnKey", "comparisonRowKey", "comparisonColumnKey"], [], "$.effectDerivation");
  if (!derivation.ok) return derivation;
  if (derivation.value.kind !== "table_cell" && derivation.value.kind !== "difference") return contractFailure("ti_v3_analytics_contract_invalid", "$.effectDerivation.kind");
  const targetRowKey = validateContractKey(derivation.value.targetRowKey, "$.effectDerivation.targetRowKey");
  const targetColumnKey = validateContractKey(derivation.value.targetColumnKey, "$.effectDerivation.targetColumnKey");
  if (!targetRowKey.ok) return targetRowKey; if (!targetColumnKey.ok) return targetColumnKey;
  const tableRows = [...table.value.rows, ...table.value.summaryRows];
  const targetRow = tableRows.find((row) => row.rowKey === targetRowKey.value);
  const targetCell = targetRow?.cells.find((cell) => cell.columnKey === targetColumnKey.value);
  if (targetRow === undefined || targetCell === undefined || parsed.get("subjectGroupKey") !== targetRow.rowKey) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.effectDerivation");
  let comparisonRowKey: string | null = null;
  let comparisonColumnKey: string | null = null;
  let comparisonRow: ExactTableRow | undefined;
  let effect: ExactMetricValue = targetCell.metric;
  let sampleSizeAuthority: ValidatedClaim["sampleSizeAuthority"];
  const dailyStopClaimTypes = new Map([
    ["daily_stop_historical_helped", "positive"],
    ["daily_stop_historical_harmed", "negative"],
    ["daily_stop_historical_unchanged", "flat"],
  ] as const);
  const claimType = parsed.get("claimType") as string;
  const isDailyStopClaim = claimType.startsWith("daily_stop_historical_");
  if (isDailyStopClaim && !dailyStopClaimTypes.has(claimType as "daily_stop_historical_helped" | "daily_stop_historical_harmed" | "daily_stop_historical_unchanged")) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.claimType");
  }
  let dailyStopSessionsTable: ExactTable | undefined;
  if (isDailyStopClaim) {
    if (table.value.tableKey !== "daily_stop_aggregate" || table.value.tableVersion !== "v1") {
      return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.table");
    }
    if (!Array.isArray(authorities.sourceTables)) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.sourceTables");
    const sourceTable = (authorities.sourceTables as readonly ExactTable[]).find((candidate) => candidate.tableKey === "daily_stop_sessions");
    if (sourceTable === undefined) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.sourceTables");
    const verifiedSourceTable = verifyExactTable(sourceTable, context.value, bundles);
    if (!verifiedSourceTable.ok || verifiedSourceTable.value.tableVersion !== "v1") return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.sourceTables");
    dailyStopSessionsTable = verifiedSourceTable.value;
  }
  if (record.value.sampleSizeAuthority !== undefined) {
    if (!isDailyStopClaim || dailyStopSessionsTable === undefined) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.sampleSizeAuthority");
    const authority = verifyDailyStopSampleAuthority(record.value.sampleSizeAuthority, context.value, dailyStopSessionsTable, table.value);
    if (!authority.ok) return authority;
    sampleSizeAuthority = authority.value;
  }
  if (isDailyStopClaim && sampleSizeAuthority === undefined) {
    return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.sampleSizeAuthority");
  }
  if (derivation.value.kind === "difference") {
    const rowKey = validateContractKey(derivation.value.comparisonRowKey, "$.effectDerivation.comparisonRowKey");
    const columnKey = validateContractKey(derivation.value.comparisonColumnKey, "$.effectDerivation.comparisonColumnKey");
    if (!rowKey.ok) return rowKey; if (!columnKey.ok) return columnKey;
    comparisonRowKey = rowKey.value; comparisonColumnKey = columnKey.value;
    comparisonRow = tableRows.find((row) => row.rowKey === comparisonRowKey);
    const comparisonCell = comparisonRow?.cells.find((cell) => cell.columnKey === comparisonColumnKey);
    if (
      comparisonRow === undefined || comparisonCell === undefined || comparisonGroupKey !== comparisonRow.rowKey ||
      !["exact_decimal", "exact_ratio"].includes(targetCell.metric.kind) ||
      !["exact_decimal", "exact_ratio"].includes(comparisonCell.metric.kind) ||
      targetCell.metric.unit !== comparisonCell.metric.unit || targetCell.metric.currency !== comparisonCell.metric.currency
    ) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.effectDerivation");
    const builtEffect = subtractMetricExactly(
      targetCell.metric,
      comparisonCell.metric,
      parsed.get("metricKey") as string,
    );
    if (!builtEffect.ok) return builtEffect;
    effect = builtEffect.value;
  } else if (derivation.value.comparisonRowKey !== null || derivation.value.comparisonColumnKey !== null || comparisonGroupKey !== null) {
    return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.effectDerivation");
  }
  if (effect.metricKey !== parsed.get("metricKey")) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.metricKey");
  if (record.value.confidenceEvidenceLabel !== "insufficient" && record.value.confidenceEvidenceLabel !== "descriptive" && record.value.confidenceEvidenceLabel !== "tentative" && record.value.confidenceEvidenceLabel !== "unavailable") return contractFailure("ti_v3_analytics_contract_invalid", "$.confidenceEvidenceLabel");
  if (record.value.outlierSensitivityState !== "not_evaluated" && record.value.outlierSensitivityState !== "stable" && record.value.outlierSensitivityState !== "sensitive" && record.value.outlierSensitivityState !== "unavailable") return contractFailure("ti_v3_analytics_contract_invalid", "$.outlierSensitivityState");
  const catalog = evidenceCatalog(bundles, context.value); if (!catalog.ok) return catalog;
  const targetEvidence = catalog.value.get(targetRow.evidenceBundleDigest);
  const comparisonEvidence = comparisonRow === undefined ? undefined : catalog.value.get(comparisonRow.evidenceBundleDigest);
  if (targetEvidence === undefined || (comparisonRow !== undefined && comparisonEvidence === undefined)) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.evidenceBundles");
  const evidenceDigests = [targetRow.evidenceBundleDigest, ...(comparisonRow === undefined ? [] : [comparisonRow.evidenceBundleDigest])];
  const requestedCounterDigests =
    record.value.counterexampleEvidenceBundleDigests ?? (
      comparisonRow === undefined ? [] : [comparisonRow.evidenceBundleDigest]
    );
  if (!Array.isArray(requestedCounterDigests)) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.counterexampleEvidenceBundleDigests",
    );
  }
  const counterDigests: CanonicalContentDigest[] = [];
  for (let index = 0; index < requestedCounterDigests.length; index += 1) {
    const digest = validateClaimedDigest(
      requestedCounterDigests[index],
      `$.counterexampleEvidenceBundleDigests[${index}]`,
      "analytical_evidence_bundle",
    );
    if (!digest.ok || !catalog.value.has(digest.value)) {
      return contractFailure(
        "ti_v3_analytics_contract_reference_mismatch",
        `$.counterexampleEvidenceBundleDigests[${index}]`,
      );
    }
    counterDigests.push(digest.value);
  }
  if (new Set(counterDigests).size !== counterDigests.length) {
    return contractFailure(
      "ti_v3_analytics_contract_duplicate_identity",
      "$.counterexampleEvidenceBundleDigests",
    );
  }
  const targetSampleSize = String(targetEvidence.candidateKeys.length);
  const comparisonSampleSize = String(comparisonEvidence?.candidateKeys.length ?? 0);
  const authoritativeTargetSampleSize = sampleSizeAuthority === undefined
    ? targetSampleSize
    : sampleSizeAuthority.thresholdReachedSessionCount;
  const authoritativeComparisonSampleSize = comparisonSampleSize;
  const limitations = [...new Set([
    ...table.value.limitationCodes,
    ...evidenceDigests.flatMap((digest) => catalog.value.get(digest)?.limitationCodes ?? []),
  ])].sort(compareUnicodeCodePoints);
  const direction = exactMetricDirection(effect);
  if (isDailyStopClaim) {
    const expectedDirection = dailyStopClaimTypes.get(claimType as "daily_stop_historical_helped" | "daily_stop_historical_harmed" | "daily_stop_historical_unchanged");
    const expectedWordingCode = expectedDirection === "positive"
      ? "under_fixed_historical_removal_rule_simulated_pnl_was_higher"
      : expectedDirection === "negative"
        ? "under_fixed_historical_removal_rule_simulated_pnl_was_lower"
        : "under_fixed_historical_removal_rule_simulated_pnl_was_unchanged";
    if (direction !== expectedDirection || parsed.get("allowedWordingCode") !== expectedWordingCode) {
      return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.allowedWordingCode");
    }
  }
  return finalizeContentAddressedAuthority("validated_claim", {
    schemaVersion: VALIDATED_CLAIM_VERSION, claimKey: parsed.get("claimKey") as string,
    claimVersion: parsed.get("claimVersion") as string, claimType: parsed.get("claimType") as string,
    runContextDigest: context.value.runContextDigest, tableDigest: table.value.tableDigest,
    partitionDigest: context.value.partitionDigest,
    subjectGroupKey: parsed.get("subjectGroupKey") as string, comparisonGroupKey,
    metricKey: parsed.get("metricKey") as string,
    effectDerivation: { kind: derivation.value.kind, targetRowKey: targetRowKey.value, targetColumnKey: targetColumnKey.value, comparisonRowKey, comparisonColumnKey },
    direction, exactEffect: effect, targetSampleSize: authoritativeTargetSampleSize, comparisonSampleSize: authoritativeComparisonSampleSize,
    confidenceEvidenceLabel: record.value.confidenceEvidenceLabel,
    outlierSensitivityState: record.value.outlierSensitivityState,
    evidenceBundleDigests: evidenceDigests, counterexampleEvidenceBundleDigests: counterDigests,
    limitationCodes: limitations, allowedWordingCode: parsed.get("allowedWordingCode") as string,
    ...(sampleSizeAuthority === undefined ? {} : { sampleSizeAuthority }),
  }, "claimDigest") as ExactResult<ValidatedClaim, AnalyticalContractFailure>;
}

export function verifyValidatedClaim(input: unknown, runContext: AnalysisRunContext, table: ExactTable, evidenceBundles: readonly AnalyticalEvidenceBundle[], sourceTables: readonly ExactTable[] = []): ExactResult<ValidatedClaim, AnalyticalContractFailure> {
  const record = validateContractRecord(input, ["schemaVersion", "claimKey", "claimVersion", "claimType", "runContextDigest", "tableDigest", "partitionDigest", "subjectGroupKey", "comparisonGroupKey", "metricKey", "effectDerivation", "direction", "exactEffect", "targetSampleSize", "comparisonSampleSize", "confidenceEvidenceLabel", "outlierSensitivityState", "evidenceBundleDigests", "counterexampleEvidenceBundleDigests", "limitationCodes", "allowedWordingCode", "claimDigest"], ["sampleSizeAuthority"]);
  if (!record.ok) return record;
  const context = verifyAnalysisRunContext(runContext); if (!context.ok || record.value.runContextDigest !== context.value.runContextDigest || record.value.partitionDigest !== context.value.partitionDigest) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.runContextDigest");
  const verifiedTable = verifyExactTable(table, context.value, evidenceBundles); if (!verifiedTable.ok || record.value.tableDigest !== verifiedTable.value.tableDigest) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.tableDigest");
  const digest = validateClaimedDigest(record.value.claimDigest, "$.claimDigest", "validated_claim"); if (!digest.ok) return digest;
  const rebuilt = buildValidatedClaim({
    schemaVersion: record.value.schemaVersion, claimKey: record.value.claimKey,
    claimVersion: record.value.claimVersion, claimType: record.value.claimType,
    runContext: context.value, table: verifiedTable.value, subjectGroupKey: record.value.subjectGroupKey,
    comparisonGroupKey: record.value.comparisonGroupKey, metricKey: record.value.metricKey,
    effectDerivation: record.value.effectDerivation, confidenceEvidenceLabel: record.value.confidenceEvidenceLabel,
    outlierSensitivityState: record.value.outlierSensitivityState, evidenceBundles,
    counterexampleEvidenceBundleDigests:
      record.value.counterexampleEvidenceBundleDigests,
    ...(record.value.sampleSizeAuthority === undefined ? {} : { sampleSizeAuthority: record.value.sampleSizeAuthority }),
    sourceTables,
    allowedWordingCode: record.value.allowedWordingCode,
  });
  if (!rebuilt.ok || rebuilt.value.claimDigest !== digest.value) return contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.claimDigest");
  return rebuilt;
}

export function buildChartReadySeries(input: unknown): ExactResult<ChartReadySeries, AnalyticalContractFailure> {
  const record = validateContractRecord(input, ["schemaVersion", "seriesKey", "seriesVersion", "approvedVisualPurpose", "allowedVisualTemplateKeys", "runContext", "sourceTable", "evidenceBundles", "xDomain", "unit", "currency", "timezone", "dateBasis", "zeroBaselineRequired", "denominatorPolicy", "points", "accessibilitySummarySelections", "pointBudget", "downsamplingPolicy"]);
  if (!record.ok) return record;
  if (record.value.schemaVersion !== CHART_READY_SERIES_VERSION) return contractFailure("ti_v3_analytics_contract_invalid", "$.schemaVersion");
  const authorities = input as Record<string, unknown>;
  const context = verifyAnalysisRunContext(authorities.runContext); if (!context.ok) return context;
  if (!Array.isArray(record.value.evidenceBundles)) return contractFailure("ti_v3_analytics_contract_invalid", "$.evidenceBundles");
  const bundles = authorities.evidenceBundles as readonly AnalyticalEvidenceBundle[];
  const table = verifyExactTable(authorities.sourceTable, context.value, bundles); if (!table.ok) return table;
  const keys = ["seriesKey", "seriesVersion", "approvedVisualPurpose", "xDomain", "dateBasis", "denominatorPolicy"] as const;
  const parsed = new Map<string, string>(); for (const key of keys) { const value = validateContractKey(record.value[key], `$.${key}`); if (!value.ok) return value; parsed.set(key, value.value); }
  const templates = Array.isArray(record.value.allowedVisualTemplateKeys) ? record.value.allowedVisualTemplateKeys : null; if (templates === null || templates.length > 32) return contractFailure("ti_v3_analytics_contract_invalid", "$.allowedVisualTemplateKeys");
  const templateKeys: string[] = []; for (let index = 0; index < templates.length; index += 1) { const value = validateContractKey(templates[index], `$.allowedVisualTemplateKeys[${index}]`); if (!value.ok) return value; templateKeys.push(value.value); }
  if (new Set(templateKeys).size !== templateKeys.length) return contractFailure("ti_v3_analytics_contract_duplicate_identity", "$.allowedVisualTemplateKeys");
  const unit = validateUnit(record.value.unit, "$.unit"); const currency = parseCurrency(record.value.currency, "$.currency"); const timezone = validateTimezone(record.value.timezone, "$.timezone");
  if (!unit.ok) return unit; if (!currency.ok) return currency; if (!timezone.ok) return timezone;
  const expectedSeriesCurrency = exactMetricUnitRequiresCurrency(unit.value)
    ? table.value.currency
    : null;
  if (
    currency.value !== expectedSeriesCurrency || timezone.value !== table.value.timezone ||
    parsed.get("dateBasis") !== table.value.dateBasis || parsed.get("denominatorPolicy") !== table.value.denominatorPolicy
  ) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.scope");
  if (typeof record.value.zeroBaselineRequired !== "boolean") return contractFailure("ti_v3_analytics_contract_invalid", "$.zeroBaselineRequired");
  if (!Array.isArray(record.value.points) || record.value.points.length > GA0_B1_CONTRACT_LIMITS.maximumSeriesPoints) return contractFailure("ti_v3_analytics_contract_oversized", "$.points");
  const evidence = evidenceCatalog(bundles, context.value); if (!evidence.ok) return evidence;
  const tableRows = [...table.value.rows, ...table.value.summaryRows]; const points: ChartReadySeriesPoint[] = [];
  for (let index = 0; index < record.value.points.length; index += 1) {
    const path = `$.points[${index}]`; const point = validateContractRecord(record.value.points[index], ["pointKey", "sourceRowKey", "sourceColumnKey", "semanticOrder", "evidenceBundleDigest"], [], path); if (!point.ok) return point;
    const pointKey = validateContractKey(point.value.pointKey, `${path}.pointKey`); const rowKey = validateContractKey(point.value.sourceRowKey, `${path}.sourceRowKey`); const columnKey = validateContractKey(point.value.sourceColumnKey, `${path}.sourceColumnKey`); const order = validateCanonicalCount(point.value.semanticOrder, `${path}.semanticOrder`);
    if (!pointKey.ok) return pointKey; if (!rowKey.ok) return rowKey; if (!columnKey.ok) return columnKey; if (!order.ok) return order;
    const row = tableRows.find((item) => item.rowKey === rowKey.value); const cell = row?.cells.find((item) => item.columnKey === columnKey.value); if (cell === undefined) return contractFailure("ti_v3_analytics_contract_reference_mismatch", path);
    if (cell.metric.unit !== unit.value || (exactMetricUnitRequiresCurrency(unit.value) ? cell.metric.currency !== currency.value : cell.metric.currency !== null)) return contractFailure("ti_v3_analytics_contract_unit_mismatch", path);
    const evidenceDigest = validateClaimedDigest(point.value.evidenceBundleDigest, `${path}.evidenceBundleDigest`, "analytical_evidence_bundle"); if (!evidenceDigest.ok || !evidence.value.has(evidenceDigest.value) || row?.evidenceBundleDigest !== evidenceDigest.value) return contractFailure("ti_v3_analytics_contract_reference_mismatch", `${path}.evidenceBundleDigest`);
    const bundle = evidence.value.get(evidenceDigest.value) as AnalyticalEvidenceBundle;
    points.push(Object.freeze({ pointKey: pointKey.value, sourceRowKey: rowKey.value, sourceColumnKey: columnKey.value, semanticOrder: order.value, exactValue: cell.metric, sampleSize: String(bundle.candidateKeys.length), evidenceBundleDigest: evidenceDigest.value }));
  }
  if (new Set(points.map((point) => point.pointKey)).size !== points.length || new Set(points.map((point) => point.semanticOrder)).size !== points.length) return contractFailure("ti_v3_analytics_contract_duplicate_identity", "$.points");
  points.sort((left, right) => BigInt(left.semanticOrder) < BigInt(right.semanticOrder) ? -1 : BigInt(left.semanticOrder) > BigInt(right.semanticOrder) ? 1 : compareUnicodeCodePoints(left.pointKey, right.pointKey));
  const pointBudget = validateCanonicalCount(record.value.pointBudget, "$.pointBudget"); if (!pointBudget.ok || BigInt(pointBudget.value) < BigInt(points.length)) return contractFailure("ti_v3_analytics_contract_count_invalid", "$.pointBudget");
  if (record.value.downsamplingPolicy !== "none_exact_points_only") return contractFailure("ti_v3_analytics_contract_invalid", "$.downsamplingPolicy");
  if (!Array.isArray(record.value.accessibilitySummarySelections) || record.value.accessibilitySummarySelections.length > 32) return contractFailure("ti_v3_analytics_contract_oversized", "$.accessibilitySummarySelections");
  const selections: Array<Readonly<{ rowKey: string; columnKey: string }>> = [];
  const facts: ExactMetricValue[] = [];
  for (let index = 0; index < record.value.accessibilitySummarySelections.length; index += 1) {
    const path = `$.accessibilitySummarySelections[${index}]`;
    const selection = validateContractRecord(record.value.accessibilitySummarySelections[index], ["rowKey", "columnKey"], [], path);
    if (!selection.ok) return selection;
    const rowKey = validateContractKey(selection.value.rowKey, `${path}.rowKey`);
    const columnKey = validateContractKey(selection.value.columnKey, `${path}.columnKey`);
    if (!rowKey.ok) return rowKey; if (!columnKey.ok) return columnKey;
    const cell = tableRows.find((row) => row.rowKey === rowKey.value)?.cells.find((item) => item.columnKey === columnKey.value);
    if (cell === undefined) return contractFailure("ti_v3_analytics_contract_reference_mismatch", path);
    selections.push(Object.freeze({ rowKey: rowKey.value, columnKey: columnKey.value }));
    facts.push(cell.metric);
  }
  return finalizeContentAddressedAuthority("chart_ready_series", {
    schemaVersion: CHART_READY_SERIES_VERSION, seriesKey: parsed.get("seriesKey") as string, seriesVersion: parsed.get("seriesVersion") as string,
    approvedVisualPurpose: parsed.get("approvedVisualPurpose") as string, allowedVisualTemplateKeys: Object.freeze(templateKeys), runContextDigest: context.value.runContextDigest,
    sourceTableDigest: table.value.tableDigest, partitionDigest: context.value.partitionDigest,
    xDomain: parsed.get("xDomain") as string, unit: unit.value, currency: currency.value, timezone: timezone.value,
    dateBasis: parsed.get("dateBasis") as string, zeroBaselineRequired: record.value.zeroBaselineRequired,
    denominatorPolicy: parsed.get("denominatorPolicy") as string, points: Object.freeze(points), includedCount: table.value.includedCount, excludedCount: table.value.excludedCount,
    accessibilitySummaryFacts: Object.freeze(facts), accessibilitySummarySelections: Object.freeze(selections), pointBudget: pointBudget.value, downsamplingPolicy: "none_exact_points_only" as const,
    limitationCodes: table.value.limitationCodes, tableAlternativeDigest: table.value.tableDigest,
  }, "seriesDigest") as ExactResult<ChartReadySeries, AnalyticalContractFailure>;
}

export function verifyChartReadySeries(input: unknown, runContext: AnalysisRunContext, sourceTable: ExactTable, evidenceBundles: readonly AnalyticalEvidenceBundle[]): ExactResult<ChartReadySeries, AnalyticalContractFailure> {
  const record = validateContractRecord(input, ["schemaVersion", "seriesKey", "seriesVersion", "approvedVisualPurpose", "allowedVisualTemplateKeys", "runContextDigest", "sourceTableDigest", "partitionDigest", "xDomain", "unit", "currency", "timezone", "dateBasis", "zeroBaselineRequired", "denominatorPolicy", "points", "includedCount", "excludedCount", "accessibilitySummaryFacts", "accessibilitySummarySelections", "pointBudget", "downsamplingPolicy", "limitationCodes", "tableAlternativeDigest", "seriesDigest"]); if (!record.ok) return record;
  const context = verifyAnalysisRunContext(runContext); if (!context.ok || record.value.runContextDigest !== context.value.runContextDigest || record.value.partitionDigest !== context.value.partitionDigest) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.runContextDigest");
  const table = verifyExactTable(sourceTable, context.value, evidenceBundles); if (!table.ok || record.value.sourceTableDigest !== table.value.tableDigest || record.value.tableAlternativeDigest !== table.value.tableDigest) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.sourceTableDigest");
  const digest = validateClaimedDigest(record.value.seriesDigest, "$.seriesDigest", "chart_ready_series"); if (!digest.ok) return digest;
  const points = Array.isArray(record.value.points) ? record.value.points.map((point) => { if (typeof point !== "object" || point === null) return point; const { exactValue: _exactValue, sampleSize: _sampleSize, ...selection } = point as Record<string, unknown>; void _exactValue; void _sampleSize; return selection; }) : record.value.points;
  const rebuilt = buildChartReadySeries({
    schemaVersion: record.value.schemaVersion, seriesKey: record.value.seriesKey,
    seriesVersion: record.value.seriesVersion, approvedVisualPurpose: record.value.approvedVisualPurpose,
    allowedVisualTemplateKeys: record.value.allowedVisualTemplateKeys, runContext: context.value,
    sourceTable: table.value, evidenceBundles, xDomain: record.value.xDomain, unit: record.value.unit,
    currency: record.value.currency, timezone: record.value.timezone, dateBasis: record.value.dateBasis,
    zeroBaselineRequired: record.value.zeroBaselineRequired, denominatorPolicy: record.value.denominatorPolicy,
    points, accessibilitySummarySelections: record.value.accessibilitySummarySelections,
    pointBudget: record.value.pointBudget, downsamplingPolicy: record.value.downsamplingPolicy,
  });
  if (!rebuilt.ok || rebuilt.value.seriesDigest !== digest.value) return contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.seriesDigest");
  return rebuilt;
}
