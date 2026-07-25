import type { AnalysisSnapshotDependencies } from "../../../domain/snapshot";
import type { CanonicalQueryFilter } from "../../../domain/query";
import { createCanonicalContentIdentity, type CanonicalContentDigest } from "../../../domain/identity";
import {
  ANALYSIS_RUN_CONTEXT_VERSION,
  ANALYSIS_RUN_RECEIPT_VERSION,
  ANALYTICAL_DIAGNOSTICS_VERSION,
  ANALYTICAL_EVIDENCE_BUNDLE_VERSION,
  CHART_READY_SERIES_VERSION,
  EXACT_TABLE_VERSION,
  VALIDATED_CLAIM_VERSION,
  buildAnalysisRunContext,
  buildAnalysisRunReceipt,
  buildAnalyticalDiagnostics,
  buildAnalyticalEvidenceBundle,
  buildDailyStopSampleAuthority,
  buildChartReadySeries,
  buildExactTable,
  buildValidatedClaim,
  contractFailure,
  type AnalysisRunContext,
  type AnalysisRunReceipt,
  type AnalyticalContractFailure,
  type AnalyticalDiagnostics,
  type AnalyticalEvidenceBundle,
  type AnalyticalSimulationEvidenceAuthority,
  type ChartReadySeries,
  type ExactMetricValue,
  type ExactTable,
  type ValidatedClaim,
} from "../../contracts";
import type { AnalyticalDatasetDerivationReceipt } from "../../adapters/snapshot-read-model";
import {
  verifyAnalyticalDatasetReceipt,
  verifyAnalyticalPartitionReceipt,
  type AnalyticalDatasetReceipt,
  type AnalyticalPartitionReceipt,
} from "../../dataset";
import type { NormalizedAnalysisArguments, ToolRegistryEntry } from "../../registry";
import { isClaimNeutralAnalyticalExclusion } from "../../dataset/analytical-dataset";
import {
  addDailyStopDecimals,
  absoluteDailyStopDecimal,
  compareDailyStopDecimals,
  dailyStopDecimalMetric,
  dailyStopDateMetric,
  dailyStopDirection,
  dailyStopEnumMetric,
  dailyStopIdentityMetric,
  dailyStopIntegerMetric,
  dailyStopTimestampMetric,
  dailyStopUnavailableMetric,
  subtractDailyStopDecimals,
} from "./daily-stop-exact-math";
import {
  DAILY_STOP_LIMITATION_CODES,
  DAILY_STOP_SAMPLE_STATES,
  buildDailyStopToolRegistryEntry,
  dailyStopSampleState,
  normalizeDailyStopArguments,
  verifyDailyStopArguments,
  type DailyStopArguments,
} from "./daily-stop-policy";
import {
  groupDailyStopSessions,
  isIncludedDailyStopSessionDecision,
  simulateDailyStopSession,
  type DailyStopIncludedSessionDecision,
  type DailyStopSessionDecision,
} from "./daily-stop-simulation";
import {
  buildDailyStopExecutionAuthority,
  type DailyStopExecutionAuthority,
} from "./daily-stop-execution-authority-contract";

export interface DailyStopAnalysisExecutionInput {
  readonly snapshot: unknown;
  readonly snapshotDependencies: AnalysisSnapshotDependencies;
  readonly canonicalFilter: CanonicalQueryFilter;
  readonly datasetReceipt: AnalyticalDatasetReceipt;
  readonly datasetDerivationReceipt: AnalyticalDatasetDerivationReceipt;
  readonly partitionReceipt: AnalyticalPartitionReceipt;
  readonly arguments?: unknown;
}

export interface DailyStopAnalysisExecutionWithoutAuthority {
  readonly normalizedArguments: NormalizedAnalysisArguments;
  readonly registryEntry: ToolRegistryEntry;
  readonly runContext: AnalysisRunContext;
  readonly evidenceBundles: readonly AnalyticalEvidenceBundle[];
  readonly tables: readonly ExactTable[];
  readonly claims: readonly ValidatedClaim[];
  readonly series: readonly ChartReadySeries[];
  readonly diagnostics: AnalyticalDiagnostics;
  readonly receipt: AnalysisRunReceipt;
}

export interface DailyStopAnalysisExecution extends DailyStopAnalysisExecutionWithoutAuthority {
  readonly executionAuthority: DailyStopExecutionAuthority;
}

class DailyStopConstructionError extends Error {
  constructor(readonly code: string, readonly path: string) { super(code); }
}

function required<T>(result: { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: { readonly code: string; readonly path?: string } }, path: string): T {
  if (!result.ok) throw new DailyStopConstructionError(result.error.code, `${path}${result.error.path ?? "$"}`);
  return result.value;
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)].sort());
}

function count(values: readonly unknown[]): string { return String(values.length); }

export function dailyStopContentAddressedRowKey(prefix: string, value: unknown): string {
  const identity = createCanonicalContentIdentity("canonical_content", "v1", value);
  if (!identity.ok) throw new Error(identity.error.code);
  return `${prefix}_${identity.value.digestHex}`;
}

const contentAddressedKey = dailyStopContentAddressedRowKey;

function sessionScope(decision: DailyStopSessionDecision): string {
  return contentAddressedKey("session", decision.sessionKey);
}

function moneyMetric(key: string, currency: string, value: string): ExactMetricValue {
  return dailyStopDecimalMetric(key, "money", currency, value);
}

function optionalMoneyMetric(key: string, currency: string, value: string | null, reason: string): ExactMetricValue {
  return value === null ? dailyStopUnavailableMetric(key, "money", currency, reason) : moneyMetric(key, currency, value);
}

function column(columnKey: string, valueKind: ExactMetricValue["kind"], unit: string, allowedValueKinds?: readonly ExactMetricValue["kind"][]): Readonly<Record<string, unknown>> {
  return Object.freeze({ columnKey, valueKind, unit, ...(allowedValueKinds === undefined ? {} : { allowedValueKinds }) });
}

const SESSION_COLUMNS = Object.freeze([
  column("session_date", "date", "date", ["date"]),
  column("canonical_owner", "identity", "category"),
  column("canonical_account", "identity", "category"),
  column("currency", "identity", "category"),
  column("timezone", "identity", "category"),
  column("date_basis", "identity", "category"),
  column("actual_trade_count", "integer", "count"),
  column("simulated_trade_count", "integer", "count"),
  column("removed_trade_count", "integer", "count"),
  column("consecutive_loss_threshold", "integer", "count"),
  column("threshold_reached", "enum", "category"),
  column("threshold_trigger_round_trip", "identity", "category"),
  column("threshold_final_exit_at", "timestamp", "timestamp", ["timestamp", "unavailable"]),
  column("threshold_evidence", "enum", "category"),
  column("actual_gross_pnl", "exact_decimal", "money", ["exact_decimal", "unavailable"]),
  column("actual_charges", "exact_decimal", "money", ["exact_decimal", "unavailable"]),
  column("actual_net_pnl", "exact_decimal", "money", ["exact_decimal", "unavailable"]),
  column("simulated_gross_pnl", "exact_decimal", "money", ["exact_decimal", "unavailable"]),
  column("simulated_charges", "exact_decimal", "money", ["exact_decimal", "unavailable"]),
  column("simulated_net_pnl", "exact_decimal", "money", ["exact_decimal", "unavailable"]),
  column("removed_net_pnl", "exact_decimal", "money", ["exact_decimal", "unavailable"]),
  column("exact_difference", "exact_decimal", "money", ["exact_decimal", "unavailable"]),
  column("classification", "enum", "category", ["enum", "unavailable"]),
  column("actual_row_evidence", "enum", "category"),
  column("retained_row_evidence", "enum", "category"),
  column("removed_row_evidence", "enum", "category"),
  column("overlap_policy", "enum", "category"),
  column("limitation_codes", "enum", "category"),
]);

const AGGREGATE_COLUMNS = Object.freeze([
  column("candidate_session_count", "integer", "count", ["integer", "unavailable"]),
  column("included_session_count", "integer", "count"),
  column("excluded_session_count", "integer", "count", ["integer", "unavailable"]),
  column("threshold_reached_session_count", "integer", "count"),
  column("threshold_not_reached_session_count", "integer", "count"),
  column("helped_session_count", "integer", "count"),
  column("harmed_session_count", "integer", "count"),
  column("unchanged_session_count", "integer", "count"),
  column("actual_trade_count", "integer", "count"),
  column("simulated_trade_count", "integer", "count"),
  column("removed_trade_count", "integer", "count"),
  column("actual_total_gross_pnl", "exact_decimal", "money", ["exact_decimal", "unavailable"]),
  column("actual_total_charges", "exact_decimal", "money", ["exact_decimal", "unavailable"]),
  column("actual_total_net_pnl", "exact_decimal", "money", ["exact_decimal", "unavailable"]),
  column("simulated_total_gross_pnl", "exact_decimal", "money", ["exact_decimal", "unavailable"]),
  column("simulated_total_charges", "exact_decimal", "money", ["exact_decimal", "unavailable"]),
  column("simulated_total_net_pnl", "exact_decimal", "money", ["exact_decimal", "unavailable"]),
  column("removed_total_net_pnl", "exact_decimal", "money", ["exact_decimal", "unavailable"]),
  column("exact_total_difference", "exact_decimal", "money", ["exact_decimal", "unavailable"]),
  column("best_helped_day_effect", "exact_decimal", "money", ["exact_decimal", "unavailable"]),
  column("worst_harmed_day_effect", "exact_decimal", "money", ["exact_decimal", "unavailable"]),
  column("result_excluding_largest_helped_day", "exact_decimal", "money", ["exact_decimal", "unavailable"]),
  column("result_excluding_largest_harmed_day", "exact_decimal", "money", ["exact_decimal", "unavailable"]),
  column("largest_single_session_absolute_contribution", "exact_decimal", "money", ["exact_decimal", "unavailable"]),
  column("best_helped_day_evidence", "identity", "category"),
  column("worst_harmed_day_evidence", "identity", "category"),
  column("outlier_sensitivity", "enum", "category"),
  column("sample_state", "enum", "category"),
  column("limitations", "enum", "category"),
]);

const AMBIGUOUS_COLUMNS = Object.freeze([
  column("session_date", "date", "date", ["date"]),
  column("canonical_owner", "identity", "category"),
  column("canonical_account", "identity", "category"),
  column("currency", "identity", "category"),
  column("timezone", "identity", "category"),
  column("date_basis", "identity", "category"),
  column("actual_trade_count", "integer", "count"),
  column("simulated_trade_count", "integer", "count", ["integer", "unavailable"]),
  column("removed_trade_count", "integer", "count", ["integer", "unavailable"]),
  column("actual_gross_pnl", "exact_decimal", "money"),
  column("actual_charges", "exact_decimal", "money"),
  column("actual_net_pnl", "exact_decimal", "money"),
  column("simulated_net_pnl", "exact_decimal", "money", ["exact_decimal", "unavailable"]),
  column("removed_net_pnl", "exact_decimal", "money", ["exact_decimal", "unavailable"]),
  column("exact_difference", "exact_decimal", "money", ["exact_decimal", "unavailable"]),
  column("classification", "enum", "category", ["enum", "unavailable"]),
  column("simulation_state", "enum", "category"),
  column("ambiguity_reason", "enum", "category"),
  column("actual_row_evidence", "enum", "category"),
  column("limitation_codes", "enum", "category"),
]);

interface EvidenceFactory {
  readonly bundles: AnalyticalEvidenceBundle[];
  add(key: string, inclusionState: "included" | "excluded", candidateKeys: readonly string[], options?: Readonly<{ allowEmpty?: boolean; simulationAuthority?: AnalyticalSimulationEvidenceAuthority }>): AnalyticalEvidenceBundle | null;
}

function createEvidenceFactory(context: AnalysisRunContext, globalLimitations: readonly string[]): EvidenceFactory {
  const bundles: AnalyticalEvidenceBundle[] = [];
  return {
    bundles,
    add(key, inclusionState, candidateKeys, options) {
      if (candidateKeys.length === 0 && options?.allowEmpty !== true) return null;
      const bundle = required(buildAnalyticalEvidenceBundle({
        schemaVersion: ANALYTICAL_EVIDENCE_BUNDLE_VERSION,
        evidenceKey: key,
        runContext: context,
        comparisonGroupKey: null,
        inclusionState,
        candidateKeys: uniqueSorted(candidateKeys),
        ...(candidateKeys.length === 0 ? { populationState: "empty_included" } : {}),
        ...(options?.simulationAuthority === undefined ? {} : { simulationAuthority: options.simulationAuthority }),
        limitationCodes: globalLimitations,
      }), `$.evidenceBundles.${key}`);
      bundles.push(bundle);
      return bundle;
    },
  };
}

function cell(columnKey: string, metric: ExactMetricValue, evidenceBundleDigest?: string): Readonly<Record<string, unknown>> {
  return Object.freeze({ columnKey, metric, ...(evidenceBundleDigest === undefined ? {} : { evidenceBundleDigest }) });
}

function sessionRow(
  decision: DailyStopIncludedSessionDecision,
  threshold: string,
  globalLimitations: readonly string[],
  evidenceFactory: EvidenceFactory,
): Readonly<Record<string, unknown>> {
  const evidenceScope = sessionScope(decision);
  const actual = evidenceFactory.add(`daily_stop_actual_${evidenceScope}`, "included", decision.rows.map((row) => row.semanticRoundTripKey));
  const retained = evidenceFactory.add(`daily_stop_retained_${evidenceScope}`, "included", decision.retainedRows.map((row) => row.semanticRoundTripKey));
  const removed = evidenceFactory.add(`daily_stop_removed_${evidenceScope}`, "included", decision.removedRows.map((row) => row.semanticRoundTripKey));
  const trigger = decision.triggerRow === null ? null : evidenceFactory.add(`daily_stop_trigger_${evidenceScope}`, "included", [decision.triggerRow.semanticRoundTripKey]);
  const simulation = evidenceFactory.add(`daily_stop_simulation_${evidenceScope}`, "included", decision.rows.map((row) => row.semanticRoundTripKey), {
    simulationAuthority: {
      kind: "daily_stop_simulation_v1",
      actualCandidateKeys: decision.rows.map((row) => row.semanticRoundTripKey),
      retainedCandidateKeys: decision.retainedRows.map((row) => row.semanticRoundTripKey),
      removedCandidateKeys: decision.removedRows.map((row) => row.semanticRoundTripKey),
      triggerCandidateKey: decision.triggerRow?.semanticRoundTripKey ?? null,
      stopAt: decision.stopAt,
    },
  });
  if (actual === null || retained === null || simulation === null) throw new Error("ti_v3_daily_stop_evidence_missing");
  const limitations = uniqueSorted([...globalLimitations, ...decision.limitationCodes]);
  const currency = decision.sessionKey.currency;
  const triggerKey = decision.triggerRow?.semanticRoundTripKey ?? "not_reached_or_ambiguous";
  const rowKey = contentAddressedKey("session", decision.sessionKey);
  const cells = [
    cell("session_date", dailyStopDateMetric("session_date", decision.sessionKey.sessionDate, decision.sessionKey.timezone, decision.sessionKey.dateBasis)),
    cell("canonical_owner", dailyStopIdentityMetric("canonical_owner", decision.sessionKey.canonicalOwnerKey)),
    cell("canonical_account", dailyStopIdentityMetric("canonical_account", decision.sessionKey.canonicalAccountKey)),
    cell("currency", dailyStopIdentityMetric("currency", currency)),
    cell("timezone", dailyStopIdentityMetric("timezone", decision.sessionKey.timezone)),
    cell("date_basis", dailyStopIdentityMetric("date_basis", decision.sessionKey.dateBasis)),
    cell("actual_trade_count", dailyStopIntegerMetric("actual_trade_count", count(decision.rows))),
    cell("simulated_trade_count", dailyStopIntegerMetric("simulated_trade_count", count(decision.retainedRows))),
    cell("removed_trade_count", dailyStopIntegerMetric("removed_trade_count", count(decision.removedRows))),
    cell("consecutive_loss_threshold", dailyStopIntegerMetric("consecutive_loss_threshold", threshold)),
    cell("threshold_reached", dailyStopEnumMetric("threshold_reached", decision.thresholdState)),
    cell("threshold_trigger_round_trip", dailyStopIdentityMetric("threshold_trigger_round_trip", triggerKey), trigger?.bundleDigest),
    cell("threshold_final_exit_at", decision.stopAt === null
      ? dailyStopUnavailableMetric("threshold_final_exit_at", "timestamp", null, "ti_v3_daily_stop_no_trigger_timestamp")
      : dailyStopTimestampMetric("threshold_final_exit_at", decision.stopAt, decision.sessionKey.timezone, decision.sessionKey.dateBasis), trigger?.bundleDigest),
    cell("threshold_evidence", dailyStopEnumMetric("threshold_evidence", decision.thresholdReached ? "completed_loss_threshold" : "not_reached"), trigger?.bundleDigest),
    cell("actual_gross_pnl", moneyMetric("actual_gross_pnl", currency, decision.actualGrossPnl), actual.bundleDigest),
    cell("actual_charges", moneyMetric("actual_charges", currency, decision.actualCharges), actual.bundleDigest),
    cell("actual_net_pnl", moneyMetric("actual_net_pnl", currency, decision.actualNetPnl), actual.bundleDigest),
    cell("simulated_gross_pnl", moneyMetric("simulated_gross_pnl", currency, decision.simulatedGrossPnl), retained.bundleDigest),
    cell("simulated_charges", moneyMetric("simulated_charges", currency, decision.simulatedCharges), retained.bundleDigest),
    cell("simulated_net_pnl", moneyMetric("simulated_net_pnl", currency, decision.simulatedNetPnl), retained.bundleDigest),
    cell("removed_net_pnl", moneyMetric("removed_net_pnl", currency, decision.removedNetPnl), removed?.bundleDigest),
    cell("exact_difference", moneyMetric("exact_difference", currency, decision.difference ?? "0"), simulation.bundleDigest),
    cell("classification", dailyStopEnumMetric("classification", decision.classification), simulation.bundleDigest),
    cell("actual_row_evidence", dailyStopEnumMetric("actual_row_evidence", "resolved"), actual.bundleDigest),
    cell("retained_row_evidence", dailyStopEnumMetric("retained_row_evidence", "resolved"), retained.bundleDigest),
    cell("removed_row_evidence", dailyStopEnumMetric("removed_row_evidence", decision.removedRows.length > 0 ? "resolved" : "not_applicable"), removed?.bundleDigest),
    cell("overlap_policy", dailyStopEnumMetric("overlap_policy", "future_entries_only_entries_at_or_before_stop_retained")),
    cell("limitation_codes", dailyStopEnumMetric("limitation_codes", limitations.length === 0 ? "none" : limitations.join("/"))),
  ];
  return Object.freeze({ rowKey, cells, evidenceBundleDigest: actual.bundleDigest });
}

function ambiguousSessionRow(
  decision: DailyStopSessionDecision,
  globalLimitations: readonly string[],
  evidenceFactory: EvidenceFactory,
): Readonly<Record<string, unknown>> {
  const scope = sessionScope(decision);
  const actual = evidenceFactory.add(`daily_stop_ambiguous_actual_${scope}`, "included", decision.rows.map((row) => row.semanticRoundTripKey));
  if (actual === null) throw new Error("ti_v3_daily_stop_ambiguous_evidence_missing");
  const limitations = uniqueSorted([...globalLimitations, ...decision.limitationCodes]);
  const key = decision.sessionKey;
  const cells = [
    cell("session_date", dailyStopDateMetric("session_date", key.sessionDate, key.timezone, key.dateBasis)),
    cell("canonical_owner", dailyStopIdentityMetric("canonical_owner", key.canonicalOwnerKey)),
    cell("canonical_account", dailyStopIdentityMetric("canonical_account", key.canonicalAccountKey)),
    cell("currency", dailyStopIdentityMetric("currency", key.currency)),
    cell("timezone", dailyStopIdentityMetric("timezone", key.timezone)),
    cell("date_basis", dailyStopIdentityMetric("date_basis", key.dateBasis)),
    cell("actual_trade_count", dailyStopIntegerMetric("actual_trade_count", count(decision.rows)), actual.bundleDigest),
    cell("simulated_trade_count", dailyStopUnavailableMetric("simulated_trade_count", "count", null, decision.ambiguityReasonCode ?? DAILY_STOP_LIMITATION_CODES.ambiguousCompletionOrder), actual.bundleDigest),
    cell("removed_trade_count", dailyStopUnavailableMetric("removed_trade_count", "count", null, decision.ambiguityReasonCode ?? DAILY_STOP_LIMITATION_CODES.ambiguousCompletionOrder), actual.bundleDigest),
    cell("actual_gross_pnl", moneyMetric("actual_gross_pnl", key.currency, decision.actualGrossPnl), actual.bundleDigest),
    cell("actual_charges", moneyMetric("actual_charges", key.currency, decision.actualCharges), actual.bundleDigest),
    cell("actual_net_pnl", moneyMetric("actual_net_pnl", key.currency, decision.actualNetPnl), actual.bundleDigest),
    cell("simulated_net_pnl", dailyStopUnavailableMetric("simulated_net_pnl", "money", key.currency, decision.ambiguityReasonCode ?? DAILY_STOP_LIMITATION_CODES.ambiguousCompletionOrder), actual.bundleDigest),
    cell("removed_net_pnl", dailyStopUnavailableMetric("removed_net_pnl", "money", key.currency, decision.ambiguityReasonCode ?? DAILY_STOP_LIMITATION_CODES.ambiguousCompletionOrder), actual.bundleDigest),
    cell("exact_difference", dailyStopUnavailableMetric("exact_difference", "money", key.currency, decision.ambiguityReasonCode ?? DAILY_STOP_LIMITATION_CODES.ambiguousCompletionOrder), actual.bundleDigest),
    cell("classification", dailyStopUnavailableMetric("classification", "category", null, decision.ambiguityReasonCode ?? DAILY_STOP_LIMITATION_CODES.ambiguousCompletionOrder), actual.bundleDigest),
    cell("simulation_state", dailyStopEnumMetric("simulation_state", decision.simulationState)),
    cell("ambiguity_reason", dailyStopEnumMetric("ambiguity_reason", decision.ambiguityReasonCode ?? DAILY_STOP_LIMITATION_CODES.ambiguousCompletionOrder), actual.bundleDigest),
    cell("actual_row_evidence", dailyStopEnumMetric("actual_row_evidence", "preserved_for_exclusion"), actual.bundleDigest),
    cell("limitation_codes", dailyStopEnumMetric("limitation_codes", limitations.join("/"))),
  ];
  return Object.freeze({ rowKey: contentAddressedKey("ambiguous_session", key), cells, evidenceBundleDigest: actual.bundleDigest });
}

function aggregateSums(decisions: readonly DailyStopIncludedSessionDecision[], field: "actualGrossPnl" | "actualCharges" | "actualNetPnl" | "simulatedGrossPnl" | "simulatedCharges" | "simulatedNetPnl" | "removedNetPnl" | "difference"): string {
  return addDailyStopDecimals(decisions.map((decision) => decision[field]));
}

function bestByEffect(decisions: readonly DailyStopIncludedSessionDecision[], direction: "positive" | "negative"): DailyStopIncludedSessionDecision | null {
  const candidates = decisions.filter((decision) => direction === "positive" ? compareDailyStopDecimals(decision.difference, "0") > 0 : compareDailyStopDecimals(decision.difference, "0") < 0);
  if (candidates.length === 0) return null;
  return [...candidates].sort((left, right) => {
    const comparison = compareDailyStopDecimals(left.difference, right.difference);
    if (comparison !== 0) return direction === "positive" ? -comparison : comparison;
    return left.sessionKey.sessionDate < right.sessionKey.sessionDate ? -1 : 1;
  })[0];
}

function largestAbsolute(decisions: readonly DailyStopIncludedSessionDecision[]): DailyStopIncludedSessionDecision | null {
  if (decisions.length === 0) return null;
  return [...decisions].sort((left, right) => {
    const comparison = compareDailyStopDecimals(absoluteDailyStopDecimal(left.difference), absoluteDailyStopDecimal(right.difference));
    if (comparison !== 0) return -comparison;
    return left.sessionKey.sessionDate < right.sessionKey.sessionDate ? -1 : 1;
  })[0];
}

function aggregateOutlierSensitive(decisions: readonly DailyStopIncludedSessionDecision[]): boolean {
  const totalDifference = aggregateSums(decisions, "difference");
  const bestHelped = bestByEffect(decisions, "positive");
  const worstHarmed = bestByEffect(decisions, "negative");
  const withoutHelped = bestHelped === null ? null : subtractDailyStopDecimals(totalDifference, bestHelped.difference);
  const withoutHarmed = worstHarmed === null ? null : subtractDailyStopDecimals(totalDifference, worstHarmed.difference);
  const completeDirection = dailyStopDirection(totalDifference);
  return [withoutHelped, withoutHarmed].some((value) => value !== null && dailyStopDirection(value) !== completeDirection);
}

function aggregateRow(
  decisions: readonly DailyStopIncludedSessionDecision[],
  candidateSessionCount: string | null,
  excludedSessionCount: string | null,
  sampleState: typeof DAILY_STOP_SAMPLE_STATES[keyof typeof DAILY_STOP_SAMPLE_STATES],
  globalLimitations: readonly string[],
  evidenceFactory: EvidenceFactory,
  currency: string,
): Readonly<{ row: Readonly<Record<string, unknown>>; aggregateEvidence: AnalyticalEvidenceBundle; totalDifference: string; outlierSensitive: boolean; limitationCodes: readonly string[] }> {
  const allRows = decisions.flatMap((decision) => decision.rows);
  const aggregateEvidence = evidenceFactory.add("daily_stop_aggregate_population", "included", allRows.map((row) => row.semanticRoundTripKey), { allowEmpty: true });
  if (aggregateEvidence === null) throw new Error("ti_v3_daily_stop_aggregate_evidence_missing");
  const thresholdReached = decisions.filter((decision) => decision.thresholdReached);
  const helped = decisions.filter((decision) => decision.classification === "helped");
  const harmed = decisions.filter((decision) => decision.classification === "harmed");
  const unchanged = decisions.filter((decision) => decision.classification === "unchanged");
  const bestHelped = bestByEffect(decisions, "positive");
  const worstHarmed = bestByEffect(decisions, "negative");
  const largest = largestAbsolute(decisions);
  const totalDifference = aggregateSums(decisions, "difference");
  const withoutHelped = bestHelped === null ? null : subtractDailyStopDecimals(totalDifference, bestHelped.difference);
  const withoutHarmed = worstHarmed === null ? null : subtractDailyStopDecimals(totalDifference, worstHarmed.difference);
  const outlierSensitive = aggregateOutlierSensitive(decisions);
  const limitations = uniqueSorted([
    ...globalLimitations,
    ...(outlierSensitive ? [DAILY_STOP_LIMITATION_CODES.outlierSensitive] : []),
  ]);
  const money = (key: string, value: string | null, reason: string): ExactMetricValue => optionalMoneyMetric(key, currency, value, reason);
  const includedPopulationAvailable = decisions.length > 0;
  const aggregateMoney = (key: string, value: string): ExactMetricValue => includedPopulationAvailable
    ? moneyMetric(key, currency, value)
    : dailyStopUnavailableMetric(key, "money", currency, "ti_v3_daily_stop_empty_included_population");
  const evidenceFor = (decision: DailyStopIncludedSessionDecision | null): string | undefined => decision === null ? undefined : evidenceFactory.bundles.find((bundle) => bundle.evidenceKey === `daily_stop_actual_${sessionScope(decision)}`)?.bundleDigest;
  const cells = [
    cell("candidate_session_count", candidateSessionCount === null
      ? dailyStopUnavailableMetric("candidate_session_count", "count", null, DAILY_STOP_LIMITATION_CODES.excludedSessionScopeUnavailable)
      : dailyStopIntegerMetric("candidate_session_count", candidateSessionCount)),
    cell("included_session_count", dailyStopIntegerMetric("included_session_count", count(decisions))),
    cell("excluded_session_count", excludedSessionCount === null
      ? dailyStopUnavailableMetric("excluded_session_count", "count", null, DAILY_STOP_LIMITATION_CODES.excludedSessionScopeUnavailable)
      : dailyStopIntegerMetric("excluded_session_count", excludedSessionCount)),
    cell("threshold_reached_session_count", dailyStopIntegerMetric("threshold_reached_session_count", count(thresholdReached))),
    cell("threshold_not_reached_session_count", dailyStopIntegerMetric("threshold_not_reached_session_count", String(decisions.length - thresholdReached.length))),
    cell("helped_session_count", dailyStopIntegerMetric("helped_session_count", count(helped))),
    cell("harmed_session_count", dailyStopIntegerMetric("harmed_session_count", count(harmed))),
    cell("unchanged_session_count", dailyStopIntegerMetric("unchanged_session_count", count(unchanged))),
    cell("actual_trade_count", dailyStopIntegerMetric("actual_trade_count", count(allRows))),
    cell("simulated_trade_count", dailyStopIntegerMetric("simulated_trade_count", count(decisions.flatMap((decision) => decision.retainedRows)))),
    cell("removed_trade_count", dailyStopIntegerMetric("removed_trade_count", count(decisions.flatMap((decision) => decision.removedRows)))),
    cell("actual_total_gross_pnl", aggregateMoney("actual_total_gross_pnl", aggregateSums(decisions, "actualGrossPnl")), aggregateEvidence.bundleDigest),
    cell("actual_total_charges", aggregateMoney("actual_total_charges", aggregateSums(decisions, "actualCharges")), aggregateEvidence.bundleDigest),
    cell("actual_total_net_pnl", aggregateMoney("actual_total_net_pnl", aggregateSums(decisions, "actualNetPnl")), aggregateEvidence.bundleDigest),
    cell("simulated_total_gross_pnl", aggregateMoney("simulated_total_gross_pnl", aggregateSums(decisions, "simulatedGrossPnl")), aggregateEvidence.bundleDigest),
    cell("simulated_total_charges", aggregateMoney("simulated_total_charges", aggregateSums(decisions, "simulatedCharges")), aggregateEvidence.bundleDigest),
    cell("simulated_total_net_pnl", aggregateMoney("simulated_total_net_pnl", aggregateSums(decisions, "simulatedNetPnl")), aggregateEvidence.bundleDigest),
    cell("removed_total_net_pnl", aggregateMoney("removed_total_net_pnl", aggregateSums(decisions, "removedNetPnl")), aggregateEvidence.bundleDigest),
    cell("exact_total_difference", aggregateMoney("exact_total_difference", totalDifference), aggregateEvidence.bundleDigest),
    cell("best_helped_day_effect", money("best_helped_day_effect", bestHelped?.difference ?? null, "ti_v3_daily_stop_no_helped_session"), evidenceFor(bestHelped)),
    cell("worst_harmed_day_effect", money("worst_harmed_day_effect", worstHarmed?.difference ?? null, "ti_v3_daily_stop_no_harmed_session"), evidenceFor(worstHarmed)),
    cell("result_excluding_largest_helped_day", money("result_excluding_largest_helped_day", withoutHelped, "ti_v3_daily_stop_no_helped_session"), evidenceFor(bestHelped)),
    cell("result_excluding_largest_harmed_day", money("result_excluding_largest_harmed_day", withoutHarmed, "ti_v3_daily_stop_no_harmed_session"), evidenceFor(worstHarmed)),
    cell("largest_single_session_absolute_contribution", money("largest_single_session_absolute_contribution", largest === null ? null : absoluteDailyStopDecimal(largest.difference), "ti_v3_daily_stop_no_sessions"), evidenceFor(largest)),
    cell("best_helped_day_evidence", dailyStopIdentityMetric("best_helped_day_evidence", bestHelped?.sessionKey.sessionDate ?? "none"), evidenceFor(bestHelped)),
    cell("worst_harmed_day_evidence", dailyStopIdentityMetric("worst_harmed_day_evidence", worstHarmed?.sessionKey.sessionDate ?? "none"), evidenceFor(worstHarmed)),
    cell("outlier_sensitivity", dailyStopEnumMetric("outlier_sensitivity", outlierSensitive ? "sensitive_direction_changes" : "stable_direction")),
    cell("sample_state", dailyStopEnumMetric("sample_state", sampleState)),
    cell("limitations", dailyStopEnumMetric("limitations", limitations.length === 0 ? "none" : limitations.join("/"))),
  ];
  return {
    row: Object.freeze({ rowKey: "aggregate", cells, evidenceBundleDigest: aggregateEvidence.bundleDigest }),
    aggregateEvidence,
    totalDifference,
    outlierSensitive,
    limitationCodes: limitations,
  };
}

function makeSeries(
  sourceTable: ExactTable,
  context: AnalysisRunContext,
  key: string,
  points: readonly Readonly<{ pointKey: string; sourceRowKey: string; sourceColumnKey: string; semanticOrder: string }>[],
  evidenceBundles: readonly AnalyticalEvidenceBundle[],
): ChartReadySeries {
  const isCountSeries = points.some((point) => point.sourceColumnKey.includes("count"));
  return required(buildChartReadySeries({
    schemaVersion: CHART_READY_SERIES_VERSION,
    seriesKey: key,
    seriesVersion: "v1",
    approvedVisualPurpose: "daily_stop_exact_historical_simulation",
    allowedVisualTemplateKeys: ["daily_stop_exact_lines"],
    runContext: context,
    sourceTable,
    evidenceBundles,
    xDomain: "semantic_session_date_order",
    unit: isCountSeries ? "count" : "money",
    currency: isCountSeries ? null : sourceTable.currency,
    timezone: sourceTable.timezone,
    dateBasis: sourceTable.dateBasis,
    zeroBaselineRequired: true,
    denominatorPolicy: sourceTable.denominatorPolicy,
    points: points.map((point) => {
      const row = sourceTable.rows.find((item) => item.rowKey === point.sourceRowKey);
      const sourceCell = row?.cells.find((item) => item.columnKey === point.sourceColumnKey);
      if (row === undefined || sourceCell === undefined) throw new Error("ti_v3_daily_stop_series_source_missing");
      return { ...point, evidenceBundleDigest: row.evidenceBundleDigest };
    }),
    accessibilitySummarySelections: points.slice(0, points.length < 4 ? points.length : 4).map((point) => ({ rowKey: point.sourceRowKey, columnKey: point.sourceColumnKey })),
    pointBudget: String(points.length),
    downsamplingPolicy: "none_exact_points_only",
  }), `$.series.${key}`);
}

function evidenceDigestFor(
  evidenceFactory: EvidenceFactory,
  key: string,
): CanonicalContentDigest | null {
  return evidenceFactory.bundles.find((bundle) => bundle.evidenceKey === key)?.bundleDigest ?? null;
}

function counterexampleEvidenceDigests(
  decisions: readonly DailyStopIncludedSessionDecision[],
  totalDifference: string,
  evidenceFactory: EvidenceFactory,
): readonly CanonicalContentDigest[] {
  const direction = dailyStopDirection(totalDifference);
  const digests = new Set<CanonicalContentDigest>();
  const addActual = (decision: DailyStopIncludedSessionDecision): void => {
    const digest = evidenceDigestFor(evidenceFactory, `daily_stop_actual_${sessionScope(decision)}`);
    if (digest !== null) digests.add(digest);
  };
  for (const decision of decisions) {
    const effect = compareDailyStopDecimals(decision.difference, "0");
    const isDirectionCounterexample = direction === "helped" ? effect < 0 : direction === "harmed" ? effect > 0 : effect !== 0;
    if (isDirectionCounterexample || (decision.thresholdReached && effect === 0)) addActual(decision);
    const leaveOneOut = subtractDailyStopDecimals(totalDifference, decision.difference);
    if (dailyStopDirection(leaveOneOut) !== direction) addActual(decision);
    const hasCounterexampleRemovedTrade = decision.removedRows.some((row) => direction === "helped" ? compareDailyStopDecimals(row.netPnl, "0") > 0 : direction === "harmed" ? compareDailyStopDecimals(row.netPnl, "0") < 0 : compareDailyStopDecimals(row.netPnl, "0") !== 0);
    if (hasCounterexampleRemovedTrade) {
      const digest = evidenceDigestFor(evidenceFactory, `daily_stop_removed_${sessionScope(decision)}`);
      if (digest !== null) digests.add(digest);
    }
  }
  return Object.freeze([...digests].sort());
}

function buildNonBlockedExecution(
  context: AnalysisRunContext,
  argumentsValue: DailyStopArguments,
  normalizedArguments: NormalizedAnalysisArguments,
  registryEntry: ToolRegistryEntry,
  dataset: AnalyticalDatasetReceipt,
  partition: AnalyticalPartitionReceipt,
): DailyStopAnalysisExecutionWithoutAuthority {
  const rows = dataset.rows.filter((row) => partition.includedRowKeys.includes(row.semanticRoundTripKey));
  const groups = groupDailyStopSessions(rows);
  const candidateDecisions = groups.map((group) => simulateDailyStopSession(group, argumentsValue.consecutiveLossThreshold));
  const decisions = candidateDecisions.filter(isIncludedDailyStopSessionDecision);
  const ambiguousDecisions = candidateDecisions.filter((decision) => !isIncludedDailyStopSessionDecision(decision));
  const thresholdReached = decisions.filter((decision) => decision.thresholdReached).length;
  const sampleState = dailyStopSampleState(thresholdReached);
  const derivedLimitations = candidateDecisions.flatMap((decision) => decision.limitationCodes);
  const exclusionLimitations = dataset.excludedCandidates
    .filter((candidate) => partition.excludedCandidateKeys.includes(candidate.candidateKey) && !isClaimNeutralAnalyticalExclusion(candidate))
    .flatMap((candidate) => [candidate.reasonCode, ...candidate.limitationCodes]);
  const sampleLimitations = sampleState === DAILY_STOP_SAMPLE_STATES.insufficient
    ? [DAILY_STOP_LIMITATION_CODES.thresholdSampleInsufficient]
    : sampleState === DAILY_STOP_SAMPLE_STATES.descriptiveOnly
      ? [DAILY_STOP_LIMITATION_CODES.thresholdSampleDescriptiveOnly]
      : [];
  const exclusionScopeLimitations = partition.excludedCandidateKeys.length > 0 ? [DAILY_STOP_LIMITATION_CODES.excludedSessionScopeUnavailable] : [];
  const outlierLimitations = aggregateOutlierSensitive(decisions) ? [DAILY_STOP_LIMITATION_CODES.outlierSensitive] : [];
  const globalLimitations = uniqueSorted([...partition.limitationCodes, ...derivedLimitations, ...exclusionLimitations, ...exclusionScopeLimitations, ...sampleLimitations, ...outlierLimitations]);
  const evidenceFactory = createEvidenceFactory(context, globalLimitations);
  const aggregate = aggregateRow(
    decisions,
    partition.excludedCandidateKeys.length > 0 ? null : String(groups.length),
    partition.excludedCandidateKeys.length > 0 ? null : String(ambiguousDecisions.length),
    sampleState,
    globalLimitations,
    evidenceFactory,
    partition.currency,
  );
  const projectedLimitations = aggregate.limitationCodes;
  const sessionRows = decisions.map((decision) => sessionRow(decision, argumentsValue.consecutiveLossThreshold, projectedLimitations, evidenceFactory));
  const tables: ExactTable[] = [];
  const sessionTable = required(buildExactTable({
    schemaVersion: EXACT_TABLE_VERSION,
    tableKey: "daily_stop_sessions",
    tableVersion: "v1",
    runContext: context,
    titlePurposeCode: "daily_stop_actual_vs_simulated_session_table",
    currency: partition.currency,
    timezone: rows[0].timezone,
    dateBasis: rows[0].dateBasis,
    denominatorPolicy: "one_verified_session_row_per_owner_account_currency_date_timezone",
    columns: SESSION_COLUMNS,
    rows: sessionRows,
    summaryRows: [],
    includedCount: partition.includedCount,
    excludedCount: partition.excludedCount,
    coverageEligibilityState: context.eligibilityState,
    limitationCodes: projectedLimitations,
    evidenceBundles: evidenceFactory.bundles,
  }), "$.tables.dailyStopSessions");
  tables.push(sessionTable);
  const aggregateTable = required(buildExactTable({
    schemaVersion: EXACT_TABLE_VERSION,
    tableKey: "daily_stop_aggregate",
    tableVersion: "v1",
    runContext: context,
    titlePurposeCode: "daily_stop_actual_vs_simulated_aggregate_table",
    currency: partition.currency,
    timezone: rows[0].timezone,
    dateBasis: rows[0].dateBasis,
    denominatorPolicy: "aggregate_exact_sum_over_verified_session_rows",
    columns: AGGREGATE_COLUMNS,
    rows: [aggregate.row],
    summaryRows: [],
    includedCount: partition.includedCount,
    excludedCount: partition.excludedCount,
    coverageEligibilityState: context.eligibilityState,
    limitationCodes: projectedLimitations,
    evidenceBundles: evidenceFactory.bundles,
  }), "$.tables.dailyStopAggregate");
  tables.push(aggregateTable);
  if (ambiguousDecisions.length > 0) {
    tables.push(required(buildExactTable({
      schemaVersion: EXACT_TABLE_VERSION,
      tableKey: "daily_stop_ambiguous_sessions",
      tableVersion: "v1",
      runContext: context,
      titlePurposeCode: "daily_stop_ambiguous_session_exclusion_ledger",
      currency: partition.currency,
      timezone: rows[0].timezone,
      dateBasis: rows[0].dateBasis,
      denominatorPolicy: "one_verified_ambiguous_session_row_per_owner_account_currency_date_timezone",
      columns: AMBIGUOUS_COLUMNS,
      rows: ambiguousDecisions.map((decision) => ambiguousSessionRow(decision, projectedLimitations, evidenceFactory)),
      summaryRows: [],
      includedCount: partition.includedCount,
      excludedCount: partition.excludedCount,
      coverageEligibilityState: context.eligibilityState,
      limitationCodes: projectedLimitations,
      evidenceBundles: evidenceFactory.bundles,
    }), "$.tables.dailyStopAmbiguousSessions"));
  }
  if (partition.excludedCandidateKeys.length > 0) {
    const exclusionColumns = [column("candidate_key", "identity", "category"), column("reason_code", "identity", "category"), column("limitation_codes", "enum", "category")];
    const exclusionRows = partition.excludedCandidateKeys.map((key) => {
      const candidate = dataset.excludedCandidates.find((item) => item.candidateKey === key);
      if (candidate === undefined) throw new Error("ti_v3_daily_stop_exclusion_missing");
      const exclusionKey = contentAddressedKey("excluded", { candidateKey: key });
      const exclusionEvidence = evidenceFactory.add(`daily_stop_excluded_${exclusionKey.slice("excluded_".length)}`, "excluded", [key]);
      if (exclusionEvidence === null) throw new Error("ti_v3_daily_stop_exclusion_evidence_missing");
      return { rowKey: exclusionKey, evidenceBundleDigest: exclusionEvidence.bundleDigest, cells: [
        cell("candidate_key", dailyStopIdentityMetric("candidate_key", key), exclusionEvidence.bundleDigest),
        cell("reason_code", dailyStopIdentityMetric("reason_code", candidate.reasonCode), exclusionEvidence.bundleDigest),
        cell("limitation_codes", dailyStopEnumMetric("limitation_codes", candidate.limitationCodes.length === 0 ? "none" : candidate.limitationCodes.join("/")), exclusionEvidence.bundleDigest),
      ] };
    });
    tables.push(required(buildExactTable({
      schemaVersion: EXACT_TABLE_VERSION,
      tableKey: "daily_stop_exclusions",
      tableVersion: "v1",
      runContext: context,
      titlePurposeCode: "daily_stop_exclusion_ledger",
      currency: partition.currency,
      timezone: rows[0].timezone,
      dateBasis: rows[0].dateBasis,
      denominatorPolicy: "one_verified_exclusion_row_per_candidate",
      columns: exclusionColumns,
      rows: exclusionRows,
      summaryRows: [],
      includedCount: partition.includedCount,
      excludedCount: partition.excludedCount,
      coverageEligibilityState: context.eligibilityState,
      limitationCodes: projectedLimitations,
      evidenceBundles: evidenceFactory.bundles,
    }), "$.tables.dailyStopExclusions"));
  }
  const series: ChartReadySeries[] = [];
  const sessionTableRows = sessionTable.rows;
  const pointsFor = (columns: readonly string[]): Readonly<{ pointKey: string; sourceRowKey: string; sourceColumnKey: string; semanticOrder: string }>[] => sessionTableRows.flatMap((row, index) => columns.map((sourceColumnKey, columnIndex) => ({ pointKey: `daily_stop_${sourceColumnKey}_${row.rowKey}`, sourceRowKey: row.rowKey, sourceColumnKey, semanticOrder: String(index * columns.length + columnIndex) })));
  series.push(makeSeries(sessionTable, context, "actual_vs_simulated_net_pnl_by_session", pointsFor(["actual_net_pnl", "simulated_net_pnl"]), evidenceFactory.bundles));
  series.push(makeSeries(sessionTable, context, "exact_difference_by_session", pointsFor(["exact_difference"]), evidenceFactory.bundles));
  series.push(makeSeries(sessionTable, context, "actual_vs_simulated_trade_count_by_session", pointsFor(["actual_trade_count", "simulated_trade_count"]), evidenceFactory.bundles));
  const diagnosticsEntries: Array<{ readonly diagnosticKey: string; readonly severity: "info" | "limitation"; readonly code: string; readonly affectedKeys: readonly string[] }> = [];
  const diagnosticEvidenceKey = (decision: DailyStopSessionDecision): string => `${decision.simulationState === "excluded_ambiguous" ? "daily_stop_ambiguous_actual_" : "daily_stop_actual_"}${sessionScope(decision)}`;
  for (const code of globalLimitations) {
    const affectedDecisions = candidateDecisions.filter((decision) => decision.limitationCodes.includes(code));
    const affectedExclusions = dataset.excludedCandidates
      .filter((candidate) => partition.excludedCandidateKeys.includes(candidate.candidateKey) && (candidate.reasonCode === code || candidate.limitationCodes.includes(code)))
      .map((candidate) => `daily_stop_excluded_${contentAddressedKey("excluded", { candidateKey: candidate.candidateKey }).slice("excluded_".length)}`);
    const affectedKeys = [...affectedDecisions.map(diagnosticEvidenceKey), ...affectedExclusions];
    diagnosticsEntries.push({
      diagnosticKey: `daily_stop_limitation_${code}`,
      severity: "limitation",
      code,
      affectedKeys: affectedKeys.length === 0 ? [context.partitionDigest] : affectedKeys,
    });
  }
  for (const decision of candidateDecisions) {
    for (const code of decision.limitationCodes) {
      const diagnosticKey = `daily_stop_session_${sessionScope(decision)}_${code}`;
      if (!diagnosticsEntries.some((entry) => entry.diagnosticKey === diagnosticKey)) diagnosticsEntries.push({ diagnosticKey, severity: "limitation", code, affectedKeys: [diagnosticEvidenceKey(decision)] });
    }
  }
  if (sampleState === DAILY_STOP_SAMPLE_STATES.claimEligible) diagnosticsEntries.push({ diagnosticKey: "daily_stop_sample_claim_eligible", severity: "info", code: "ti_v3_daily_stop_sample_claim_eligible", affectedKeys: ["non_reference:sample_policy"] });
  if (aggregate.outlierSensitive) diagnosticsEntries.push({ diagnosticKey: "daily_stop_outlier_policy", severity: "limitation", code: DAILY_STOP_LIMITATION_CODES.outlierSensitive, affectedKeys: ["non_reference:outlier_policy"] });
  if (decisions.some((decision) => decision.overlapDisclosure !== undefined)) diagnosticsEntries.push({ diagnosticKey: "daily_stop_overlap_disclosure", severity: "info", code: "ti_v3_daily_stop_future_entries_only_disclosure", affectedKeys: ["non_reference:overlap_policy"] });
  const diagnostics = required(buildAnalyticalDiagnostics({ schemaVersion: ANALYTICAL_DIAGNOSTICS_VERSION, runContext: context, entries: diagnosticsEntries }), "$.diagnostics");
  const claimable = globalLimitations.length === 0 && !aggregate.outlierSensitive && sampleState === DAILY_STOP_SAMPLE_STATES.claimEligible;
  const claims: ValidatedClaim[] = [];
  if (claimable) {
    const aggregateEvidence = evidenceFactory.bundles.find((bundle) => bundle.evidenceKey === "daily_stop_aggregate_population");
    if (aggregateEvidence === undefined) throw new Error("ti_v3_daily_stop_claim_evidence_missing");
    const counterexamples = counterexampleEvidenceDigests(decisions, aggregate.totalDifference, evidenceFactory);
    const direction = dailyStopDirection(aggregate.totalDifference);
    const sampleSizeAuthority = required(buildDailyStopSampleAuthority({
      runContextDigest: context.runContextDigest,
      sessionsTable: sessionTable,
      aggregateTable,
    }), "$.claims.sampleSizeAuthority");
    claims.push(required(buildValidatedClaim({
      schemaVersion: VALIDATED_CLAIM_VERSION,
      claimKey: "daily_stop_historical_effect",
      claimVersion: "v1",
      claimType: `daily_stop_historical_${direction}`,
      runContext: context,
      table: aggregateTable,
      subjectGroupKey: "aggregate",
      comparisonGroupKey: null,
      metricKey: "exact_total_difference",
      effectDerivation: { kind: "table_cell", targetRowKey: "aggregate", targetColumnKey: "exact_total_difference", comparisonRowKey: null, comparisonColumnKey: null },
      confidenceEvidenceLabel: "tentative",
      outlierSensitivityState: "stable",
      evidenceBundles: evidenceFactory.bundles,
      counterexampleEvidenceBundleDigests: counterexamples,
      sourceTables: tables,
      sampleSizeAuthority,
      allowedWordingCode: direction === "helped" ? "under_fixed_historical_removal_rule_simulated_pnl_was_higher" : direction === "harmed" ? "under_fixed_historical_removal_rule_simulated_pnl_was_lower" : "under_fixed_historical_removal_rule_simulated_pnl_was_unchanged",
    }), "$.claims.dailyStopEffect"));
    void aggregateEvidence;
  }
  const receipt = required(buildAnalysisRunReceipt({ schemaVersion: ANALYSIS_RUN_RECEIPT_VERSION, runContext: context, tables, claims, series, evidenceBundles: evidenceFactory.bundles, diagnostics }), "$.receipt");
  return Object.freeze({ normalizedArguments, registryEntry, runContext: context, evidenceBundles: Object.freeze(evidenceFactory.bundles), tables: Object.freeze(tables), claims: Object.freeze(claims), series: Object.freeze(series), diagnostics, receipt });
}

function attachAuthority(execution: DailyStopAnalysisExecutionWithoutAuthority, input: DailyStopAnalysisExecutionInput, dataset: AnalyticalDatasetReceipt, partition: AnalyticalPartitionReceipt): DailyStopAnalysisExecution {
  const executionAuthority = required(buildDailyStopExecutionAuthority(execution, input.datasetDerivationReceipt, dataset, partition), "$.executionAuthority");
  return Object.freeze({ ...execution, executionAuthority });
}

export function executeDailyStopAnalysis(input: DailyStopAnalysisExecutionInput): { readonly ok: true; readonly value: DailyStopAnalysisExecution } | { readonly ok: false; readonly error: AnalyticalContractFailure } {
  try {
    const dataset = verifyAnalyticalDatasetReceipt(input.datasetReceipt);
    if (!dataset.ok) return contractFailure(dataset.error.code, `$.datasetReceipt${dataset.error.path.slice(1)}`);
    const partition = verifyAnalyticalPartitionReceipt(input.partitionReceipt, dataset.value);
    if (!partition.ok) return contractFailure(partition.error.code, `$.partitionReceipt${partition.error.path.slice(1)}`);
    const registryEntry = required(buildDailyStopToolRegistryEntry(), "$.registryEntry");
    const normalizedArguments = required(normalizeDailyStopArguments(input.arguments), "$.arguments");
    const verifiedArguments = required(verifyDailyStopArguments(normalizedArguments), "$.arguments");
    const context = required(buildAnalysisRunContext({ schemaVersion: ANALYSIS_RUN_CONTEXT_VERSION, snapshot: input.snapshot, snapshotDependencies: input.snapshotDependencies, canonicalFilter: input.canonicalFilter, datasetReceipt: dataset.value, datasetDerivationReceipt: input.datasetDerivationReceipt, partitionReceipt: partition.value, normalizedArguments, registryEntry }), "$.runContext");
    if (context.eligibilityState === "blocked") {
      const diagnostics = required(buildAnalyticalDiagnostics({ schemaVersion: ANALYTICAL_DIAGNOSTICS_VERSION, runContext: context, entries: [{ diagnosticKey: "daily_stop_partition_blocked", severity: "blocked", code: "ti_v3_daily_stop_partition_blocked", affectedKeys: [context.partitionDigest] }] }), "$.diagnostics");
      const receipt = required(buildAnalysisRunReceipt({ schemaVersion: ANALYSIS_RUN_RECEIPT_VERSION, runContext: context, tables: [], claims: [], series: [], evidenceBundles: [], diagnostics }), "$.receipt");
      return { ok: true, value: attachAuthority(Object.freeze({ normalizedArguments, registryEntry, runContext: context, evidenceBundles: [], tables: [], claims: [], series: [], diagnostics, receipt }), input, dataset.value, partition.value) };
    }
    return { ok: true, value: attachAuthority(buildNonBlockedExecution(context, verifiedArguments.values, normalizedArguments, registryEntry, dataset.value, partition.value), input, dataset.value, partition.value) };
  } catch (error) {
    if (error instanceof DailyStopConstructionError) return contractFailure(error.code, error.path);
    return contractFailure("ti_v3_daily_stop_analysis_construction_failed", "$");
  }
}
