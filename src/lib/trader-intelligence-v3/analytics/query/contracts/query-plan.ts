import { compareUnicodeCodePoints, serializeCanonicalValue } from "../../../domain/canonical";
import {
  compareExactDecimals,
  parseCurrencyCode,
  validateExactDecimal,
  type CurrencyCode,
  type ExactResult,
} from "../../../domain/exact";
import type { CanonicalContentDigest } from "../../../domain/identity";
import {
  getVerifiedDerivedAnalyticalDataset,
  type AnalyticalDatasetDerivationReceipt,
} from "../../adapters";
import {
  contractFailure,
  finalizeContentAddressedAuthority,
  validateCanonicalCount,
  validateCanonicalDate,
  validateClaimedDigest,
  validateContractRecord,
  validateKeyArray,
  type AnalyticalContractFailure,
} from "../../contracts";
import {
  verifyAnalyticalDatasetReceipt,
  verifyAnalyticalPartitionReceipt,
  type AnalyticalDatasetReceipt,
  type AnalyticalPartitionReceipt,
} from "../../dataset";
import {
  TRADE_QUERY_METRIC_KEYS,
  type TradeQueryMetricKey,
} from "../metrics/metric-registry";

export const TRADE_QUERY_PLAN_VERSION = "ti_v3_trade_query_plan_v1" as const;
export const TRADE_QUERY_PLAN_KEY = "generic_deterministic_trade_query" as const;
export const TRADE_QUERY_PLAN_SEMANTIC_VERSION = "v1" as const;

export const TRADE_QUERY_LIMITS = Object.freeze({
  // Aliases normalize to canonical filters, leaving 16 independently
  // selectable filter identities. The public capacity reflects that inventory.
  maximumFilters: 16,
  maximumMetrics: 64,
  maximumOrderings: 3,
  maximumGroups: 256,
  maximumResultRows: 256,
  maximumEvidencePerGroup: 16,
  maximumEvidenceTotal: 512,
  maximumDiagnostics: 128,
  maximumPlanCodeUnits: 65_536,
  maximumResultCodeUnits: 1_048_576,
  maximumBoundaryCount: 64,
  maximumSelectedValues: 128,
});

export const TRADE_QUERY_POLICY = Object.freeze({
  temporalPolicyKey: "ti_v3_strictly_completed_trade_context",
  temporalPolicyVersion: "v1",
  sequencePolicyKey: "ti_v3_owner_account_session_entry_sequence",
  sequencePolicyVersion: "v1",
  repeatAttemptPolicyKey: "ti_v3_owner_account_session_symbol_entry_attempt",
  repeatAttemptPolicyVersion: "v1",
  groupingPolicyKey: "ti_v3_deterministic_trade_query_grouping",
  groupingPolicyVersion: "v1",
  exactMetricPolicyKey: "ti_v3_exact_trade_query_metrics",
  exactMetricPolicyVersion: "v1",
  evidencePolicyKey: "ti_v3_bounded_support_counterexample_evidence",
  evidencePolicyVersion: "v1",
  limitationPolicyKey: "ti_v3_query_limitation_union",
  limitationPolicyVersion: "v1",
  emptyBucketPolicy: "omit_empty_buckets",
} as const);

export type QueryOutcome = "gain" | "loss" | "flat";
export type QueryWeekday =
  | "monday" | "tuesday" | "wednesday" | "thursday"
  | "friday" | "saturday" | "sunday";

export type TradeQueryFilter = Readonly<
  | { readonly kind: "date_range"; readonly startDate: string; readonly endDate: string }
  | { readonly kind: "account"; readonly values: readonly string[] }
  | { readonly kind: "symbol"; readonly values: readonly string[] }
  | { readonly kind: "direction"; readonly values: readonly ("long" | "short")[] }
  | { readonly kind: "currency"; readonly value: CurrencyCode }
  | { readonly kind: "realized_outcome"; readonly values: readonly QueryOutcome[] }
  | { readonly kind: "weekday"; readonly values: readonly QueryWeekday[] }
  | { readonly kind: "entry_time_range"; readonly startTime: string; readonly endTime: string }
  | { readonly kind: "exit_time_range"; readonly startTime: string; readonly endTime: string }
  | { readonly kind: "entry_price_range"; readonly minimum: string | null; readonly maximum: string | null }
  | { readonly kind: "price_range"; readonly minimum: string | null; readonly maximum: string | null }
  | { readonly kind: "sequence_in_session"; readonly minimum: string | null; readonly maximum: string | null }
  | { readonly kind: "previous_completed_outcome"; readonly values: readonly ("none" | QueryOutcome | "ambiguous")[] }
  | { readonly kind: "holding_time_seconds"; readonly minimum: string | null; readonly maximum: string | null }
  | { readonly kind: "repeat_attempt"; readonly minimum: string | null; readonly maximum: string | null }
  | { readonly kind: "share_quantity_range"; readonly minimum: string | null; readonly maximum: string | null }
  | { readonly kind: "entry_notional_range"; readonly minimum: string | null; readonly maximum: string | null }
  | { readonly kind: "position_size"; readonly minimum: string | null; readonly maximum: string | null }
>;

export type TradeQueryGrouping = Readonly<
  | { readonly kind: "aggregate" }
  | { readonly kind: "day" }
  | { readonly kind: "month" }
  | { readonly kind: "week" }
  | { readonly kind: "weekday" }
  | { readonly kind: "time_bucket"; readonly source: "entry" | "exit"; readonly bucketMinutes: string }
  | { readonly kind: "entry_price_range"; readonly boundaries: readonly string[] }
  | { readonly kind: "price_range"; readonly boundaries: readonly string[] }
  | { readonly kind: "trade_sequence" }
  | { readonly kind: "trade_sequence_bucket" }
  | { readonly kind: "previous_completed_outcome" }
  | { readonly kind: "repeat_attempt" }
  | { readonly kind: "repeat_attempt_bucket" }
  | { readonly kind: "holding_time_bucket"; readonly boundariesSeconds: readonly string[] }
  | { readonly kind: "share_quantity_bucket"; readonly boundaries: readonly string[] }
  | { readonly kind: "entry_notional_bucket"; readonly boundaries: readonly string[] }
  | { readonly kind: "position_size_bucket"; readonly boundaries: readonly string[] }
  | { readonly kind: "direction" }
  | { readonly kind: "symbol" }
  | { readonly kind: "account" }
>;

export { TRADE_QUERY_METRIC_KEYS };
export type { TradeQueryMetricKey };

export interface TradeQueryOrdering {
  readonly by: "group_identity" | "metric";
  readonly metricKey: TradeQueryMetricKey | null;
  readonly direction: "ascending" | "descending";
}

export interface TradeQueryPlanAuthority {
  readonly snapshotDigest: CanonicalContentDigest;
  readonly canonicalFilterDigest: CanonicalContentDigest;
  readonly datasetReceiptDigest: CanonicalContentDigest;
  readonly datasetDerivationDigest: CanonicalContentDigest;
  readonly partitionDigest: CanonicalContentDigest;
  readonly currency: CurrencyCode;
  readonly ownerScope: readonly string[];
  readonly accountScope: readonly string[];
}

export interface TradeQueryPlan {
  readonly schemaVersion: typeof TRADE_QUERY_PLAN_VERSION;
  readonly queryPlanKey: typeof TRADE_QUERY_PLAN_KEY;
  readonly queryPlanVersion: typeof TRADE_QUERY_PLAN_SEMANTIC_VERSION;
  readonly authority: TradeQueryPlanAuthority;
  readonly filters: readonly TradeQueryFilter[];
  readonly grouping: TradeQueryGrouping;
  readonly metrics: readonly TradeQueryMetricKey[];
  readonly ordering: readonly TradeQueryOrdering[];
  readonly limits: Readonly<{
    readonly groupLimit: string;
    readonly resultRowLimit: string;
    readonly evidencePerGroup: string;
    readonly totalEvidenceLimit: string;
    readonly diagnosticLimit: string;
  }>;
  readonly policies: typeof TRADE_QUERY_POLICY;
  readonly queryPlanDigest: CanonicalContentDigest;
}

export interface TradeQueryAuthority {
  readonly datasetReceipt: AnalyticalDatasetReceipt;
  readonly datasetDerivationReceipt: AnalyticalDatasetDerivationReceipt;
  readonly partitionReceipt: AnalyticalPartitionReceipt;
}

const FILTER_KINDS = new Set([
  "date_range", "account", "symbol", "direction", "currency",
  "realized_outcome", "weekday", "entry_time_range", "exit_time_range",
  "entry_price_range", "price_range", "sequence_in_session",
  "previous_completed_outcome", "holding_time_seconds", "repeat_attempt",
  "share_quantity_range", "entry_notional_range", "position_size",
]);
const WEEKDAYS = new Set<QueryWeekday>([
  "monday", "tuesday", "wednesday", "thursday",
  "friday", "saturday", "sunday",
]);
const OUTCOMES = new Set<QueryOutcome>(["gain", "loss", "flat"]);
const PREVIOUS_OUTCOMES = new Set(["none", "gain", "loss", "flat", "ambiguous"]);
const METRICS = new Set<string>(TRADE_QUERY_METRIC_KEYS);
const GROUPINGS = new Set([
  "aggregate", "day", "month", "week", "weekday", "time_bucket",
  "entry_price_range", "price_range",
  "trade_sequence", "trade_sequence_bucket", "previous_completed_outcome", "repeat_attempt", "repeat_attempt_bucket",
  "holding_time_bucket", "share_quantity_bucket", "entry_notional_bucket",
  "position_size_bucket", "direction", "symbol", "account",
]);

function failure(path: string): ExactResult<never, AnalyticalContractFailure> {
  return contractFailure("ti_v3_analytics_contract_invalid", path);
}

function exactArray(
  input: unknown,
  allowed: ReadonlySet<string>,
  path: string,
): ExactResult<readonly string[], AnalyticalContractFailure> {
  if (!Array.isArray(input) || input.length === 0 || input.length > TRADE_QUERY_LIMITS.maximumSelectedValues) {
    return failure(path);
  }
  if (input.some((value) => typeof value !== "string" || !allowed.has(value))) return failure(path);
  if (new Set(input).size !== input.length) {
    return contractFailure("ti_v3_analytics_contract_duplicate_identity", path);
  }
  return { ok: true, value: Object.freeze([...input].sort(compareUnicodeCodePoints)) };
}

function exactBound(
  input: unknown,
  path: string,
  kind: "decimal" | "count",
): ExactResult<string | null, AnalyticalContractFailure> {
  if (input === null) return { ok: true, value: null };
  if (kind === "count") {
    const value = validateCanonicalCount(input, path);
    return value.ok ? value : value;
  }
  const value = validateExactDecimal(input);
  return value.ok && value.value === input ? { ok: true, value: value.value } : failure(path);
}

function validateRange(
  minimum: string | null,
  maximum: string | null,
  path: string,
  kind: "decimal" | "count",
): ExactResult<true, AnalyticalContractFailure> {
  if (minimum === null && maximum === null) return failure(path);
  if (minimum !== null && maximum !== null) {
    let comparison: boolean;
    if (kind === "count") {
      comparison = BigInt(minimum) <= BigInt(maximum);
    } else {
      const parsedMinimum = validateExactDecimal(minimum);
      const parsedMaximum = validateExactDecimal(maximum);
      if (!parsedMinimum.ok || !parsedMaximum.ok) return failure(path);
      comparison = compareExactDecimals(parsedMinimum.value, parsedMaximum.value) <= 0;
    }
    if (!comparison) return contractFailure("ti_v3_analytics_contract_invalid", path);
  }
  return { ok: true, value: true };
}

function canonicalTime(input: unknown, path: string): ExactResult<string, AnalyticalContractFailure> {
  if (typeof input !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(input)) return failure(path);
  return { ok: true, value: input.length === 5 ? `${input}:00` : input };
}

function normalizeFilter(input: unknown, index: number): ExactResult<TradeQueryFilter, AnalyticalContractFailure> {
  const path = `$.filters[${index}]`;
  const base = validateContractRecord(input, ["kind"], [
    "startDate", "endDate", "values", "value", "startTime", "endTime", "minimum", "maximum",
  ], path);
  if (!base.ok || typeof base.value.kind !== "string" || !FILTER_KINDS.has(base.value.kind)) return failure(`${path}.kind`);
  const kind = base.value.kind;
  if (kind === "date_range") {
    const exact = validateContractRecord(input, ["kind", "startDate", "endDate"], [], path);
    if (!exact.ok) return exact;
    const start = validateCanonicalDate(exact.value.startDate, `${path}.startDate`);
    const end = validateCanonicalDate(exact.value.endDate, `${path}.endDate`);
    if (!start.ok) return start;
    if (!end.ok) return end;
    if (start.value > end.value) return failure(path);
    return { ok: true, value: Object.freeze({ kind, startDate: start.value, endDate: end.value }) };
  }
  if (kind === "account") {
    const exact = validateContractRecord(input, ["kind", "values"], [], path);
    if (!exact.ok) return exact;
    const values = validateKeyArray(exact.value.values, `${path}.values`, {
      maximumItems: TRADE_QUERY_LIMITS.maximumSelectedValues,
    });
    if (!values.ok || values.value.length === 0) return values.ok ? failure(`${path}.values`) : values;
    return { ok: true, value: Object.freeze({ kind, values: values.value }) };
  }
  if (kind === "symbol") {
    const exact = validateContractRecord(input, ["kind", "values"], [], path);
    if (!exact.ok || !Array.isArray(exact.value.values) || exact.value.values.length === 0 ||
      exact.value.values.length > TRADE_QUERY_LIMITS.maximumSelectedValues) return failure(`${path}.values`);
    const values: string[] = [];
    for (let valueIndex = 0; valueIndex < exact.value.values.length; valueIndex += 1) {
      const value = exact.value.values[valueIndex];
      if (
        typeof value !== "string" ||
        !(/^[A-Z0-9._-]{1,32}$/.test(value) || /^instrument_[a-z0-9._/-]{1,220}$/.test(value))
      ) return failure(`${path}.values[${valueIndex}]`);
      values.push(value);
    }
    if (new Set(values).size !== values.length) {
      return contractFailure("ti_v3_analytics_contract_duplicate_identity", `${path}.values`);
    }
    return { ok: true, value: Object.freeze({ kind, values: [...values].sort(compareUnicodeCodePoints) }) };
  }
  if (kind === "direction" || kind === "realized_outcome" || kind === "weekday" || kind === "previous_completed_outcome") {
    const exact = validateContractRecord(input, ["kind", "values"], [], path);
    if (!exact.ok) return exact;
    const allowed = kind === "direction"
      ? new Set(["long", "short"])
      : kind === "realized_outcome"
        ? OUTCOMES
        : kind === "weekday" ? WEEKDAYS : PREVIOUS_OUTCOMES;
    const values = exactArray(exact.value.values, allowed, `${path}.values`);
    if (!values.ok) return values;
    return { ok: true, value: Object.freeze({ kind, values: values.value }) as TradeQueryFilter };
  }
  if (kind === "currency") {
    const exact = validateContractRecord(input, ["kind", "value"], [], path);
    if (!exact.ok) return exact;
    const currency = parseCurrencyCode(exact.value.value);
    return currency.ok
      ? { ok: true, value: Object.freeze({ kind, value: currency.value }) }
      : failure(`${path}.value`);
  }
  if (kind === "entry_time_range" || kind === "exit_time_range") {
    const exact = validateContractRecord(input, ["kind", "startTime", "endTime"], [], path);
    if (!exact.ok) return exact;
    const start = canonicalTime(exact.value.startTime, `${path}.startTime`);
    const end = canonicalTime(exact.value.endTime, `${path}.endTime`);
    if (!start.ok) return start;
    if (!end.ok) return end;
    if (start.value > end.value) return failure(path);
    return { ok: true, value: Object.freeze({ kind, startTime: start.value, endTime: end.value }) };
  }
  const rangeKind = (
    kind === "entry_price_range" ||
    kind === "price_range" ||
    kind === "share_quantity_range" ||
    kind === "entry_notional_range" ||
    kind === "position_size"
  ) ? "decimal" : "count";
  const exact = validateContractRecord(input, ["kind", "minimum", "maximum"], [], path);
  if (!exact.ok) return exact;
  const minimum = exactBound(exact.value.minimum, `${path}.minimum`, rangeKind);
  const maximum = exactBound(exact.value.maximum, `${path}.maximum`, rangeKind);
  if (!minimum.ok) return minimum;
  if (!maximum.ok) return maximum;
  const range = validateRange(minimum.value, maximum.value, path, rangeKind);
  if (!range.ok) return range;
  const canonicalKind = kind === "price_range"
    ? "entry_price_range"
    : kind === "position_size"
      ? "entry_notional_range"
      : kind;
  return {
    ok: true,
    value: Object.freeze({
      kind: canonicalKind,
      minimum: minimum.value,
      maximum: maximum.value,
    }) as TradeQueryFilter,
  };
}

function decimalBoundaries(input: unknown, path: string): ExactResult<readonly string[], AnalyticalContractFailure> {
  if (!Array.isArray(input) || input.length === 0 || input.length > TRADE_QUERY_LIMITS.maximumBoundaryCount) return failure(path);
  const values: string[] = [];
  for (let index = 0; index < input.length; index += 1) {
    const value = exactBound(input[index], `${path}[${index}]`, "decimal");
    if (!value.ok || value.value === null) return value.ok ? failure(`${path}[${index}]`) : value;
    values.push(value.value);
  }
  const sorted = [...values].sort((left, right) => {
    const a = validateExactDecimal(left);
    const b = validateExactDecimal(right);
    if (!a.ok || !b.ok) return 0;
    return compareExactDecimals(a.value, b.value);
  });
  if (new Set(sorted).size !== sorted.length) return contractFailure("ti_v3_analytics_contract_duplicate_identity", path);
  return { ok: true, value: Object.freeze(sorted) };
}

function countBoundaries(input: unknown, path: string): ExactResult<readonly string[], AnalyticalContractFailure> {
  if (!Array.isArray(input) || input.length === 0 || input.length > TRADE_QUERY_LIMITS.maximumBoundaryCount) return failure(path);
  const values: string[] = [];
  for (let index = 0; index < input.length; index += 1) {
    const value = validateCanonicalCount(input[index], `${path}[${index}]`);
    if (!value.ok) return value;
    values.push(value.value);
  }
  const sorted = [...values].sort((left, right) => BigInt(left) < BigInt(right) ? -1 : BigInt(left) > BigInt(right) ? 1 : 0);
  if (new Set(sorted).size !== sorted.length) return contractFailure("ti_v3_analytics_contract_duplicate_identity", path);
  return { ok: true, value: Object.freeze(sorted) };
}

function normalizeGrouping(input: unknown): ExactResult<TradeQueryGrouping, AnalyticalContractFailure> {
  const base = validateContractRecord(input, ["kind"], ["source", "bucketMinutes", "boundaries", "boundariesSeconds"], "$.grouping");
  if (!base.ok || typeof base.value.kind !== "string" || !GROUPINGS.has(base.value.kind)) return failure("$.grouping.kind");
  const kind = base.value.kind;
  if (kind === "time_bucket") {
    const exact = validateContractRecord(input, ["kind", "source", "bucketMinutes"], [], "$.grouping");
    if (!exact.ok || (exact.value.source !== "entry" && exact.value.source !== "exit")) return failure("$.grouping.source");
    const size = validateCanonicalCount(exact.value.bucketMinutes, "$.grouping.bucketMinutes");
    if (!size.ok || BigInt(size.value) < BigInt("1") || BigInt(size.value) > BigInt("1440") || BigInt("1440") % BigInt(size.value) !== BigInt("0")) return failure("$.grouping.bucketMinutes");
    return { ok: true, value: Object.freeze({ kind, source: exact.value.source, bucketMinutes: size.value }) };
  }
  if (
    kind === "entry_price_range" ||
    kind === "price_range" ||
    kind === "share_quantity_bucket" ||
    kind === "entry_notional_bucket" ||
    kind === "position_size_bucket"
  ) {
    const exact = validateContractRecord(input, ["kind", "boundaries"], [], "$.grouping");
    if (!exact.ok) return exact;
    const boundaries = decimalBoundaries(exact.value.boundaries, "$.grouping.boundaries");
    const canonicalKind = kind === "price_range"
      ? "entry_price_range"
      : kind === "position_size_bucket"
        ? "entry_notional_bucket"
        : kind;
    return boundaries.ok
      ? {
          ok: true,
          value: Object.freeze({
            kind: canonicalKind,
            boundaries: boundaries.value,
          }) as TradeQueryGrouping,
        }
      : boundaries;
  }
  if (kind === "holding_time_bucket") {
    const exact = validateContractRecord(input, ["kind", "boundariesSeconds"], [], "$.grouping");
    if (!exact.ok) return exact;
    const boundaries = countBoundaries(exact.value.boundariesSeconds, "$.grouping.boundariesSeconds");
    return boundaries.ok ? { ok: true, value: Object.freeze({ kind, boundariesSeconds: boundaries.value }) } : boundaries;
  }
  const exact = validateContractRecord(input, ["kind"], [], "$.grouping");
  return exact.ok ? { ok: true, value: Object.freeze({ kind }) as TradeQueryGrouping } : exact;
}

function authorityFromAccepted(input: TradeQueryAuthority): ExactResult<TradeQueryPlanAuthority, AnalyticalContractFailure> {
  const knownDataset = getVerifiedDerivedAnalyticalDataset(input.datasetDerivationReceipt);
  const dataset = knownDataset?.receiptDigest === input.datasetReceipt.receiptDigest
    ? { ok: true as const, value: knownDataset }
    : verifyAnalyticalDatasetReceipt(input.datasetReceipt);
  if (!dataset.ok) return dataset;
  const knownPartition = verifyAnalyticalPartitionReceipt(input.partitionReceipt);
  const partition = knownPartition.ok
    ? knownPartition
    : verifyAnalyticalPartitionReceipt(input.partitionReceipt, dataset.value);
  if (!partition.ok) return partition;
  if (
    input.datasetDerivationReceipt.datasetReceiptDigest !== dataset.value.receiptDigest ||
    input.datasetDerivationReceipt.derivationDigest === undefined
  ) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.authority.datasetDerivationReceipt");
  return {
    ok: true,
    value: Object.freeze({
      snapshotDigest: dataset.value.snapshotDigest,
      canonicalFilterDigest: dataset.value.filterDigest,
      datasetReceiptDigest: dataset.value.receiptDigest,
      datasetDerivationDigest: input.datasetDerivationReceipt.derivationDigest,
      partitionDigest: partition.value.partitionDigest,
      currency: partition.value.currency,
      ownerScope: partition.value.ownerScope,
      accountScope: partition.value.accountScope,
    }),
  };
}

function normalizePolicies(input: unknown): ExactResult<typeof TRADE_QUERY_POLICY, AnalyticalContractFailure> {
  const keys = Object.keys(TRADE_QUERY_POLICY);
  const record = validateContractRecord(input, keys, [], "$.policies");
  if (!record.ok || keys.some((key) => record.value[key] !== TRADE_QUERY_POLICY[key as keyof typeof TRADE_QUERY_POLICY])) {
    return failure("$.policies");
  }
  return { ok: true, value: TRADE_QUERY_POLICY };
}

function boundedLimit(input: unknown, path: string, maximum: number): ExactResult<string, AnalyticalContractFailure> {
  const value = validateCanonicalCount(input, path);
  if (!value.ok || BigInt(value.value) < BigInt("1") || BigInt(value.value) > BigInt(maximum)) {
    return contractFailure("ti_v3_analytics_contract_oversized", path);
  }
  return value;
}

function normalizePlanContent(
  input: unknown,
  accepted: TradeQueryAuthority,
): ExactResult<Omit<TradeQueryPlan, "queryPlanDigest">, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion", "queryPlanKey", "queryPlanVersion", "authority", "filters",
    "grouping", "metrics", "ordering", "limits", "policies",
  ], [], "$");
  if (!record.ok) return record;
  if (
    record.value.schemaVersion !== TRADE_QUERY_PLAN_VERSION ||
    record.value.queryPlanKey !== TRADE_QUERY_PLAN_KEY ||
    record.value.queryPlanVersion !== TRADE_QUERY_PLAN_SEMANTIC_VERSION
  ) return failure("$.schemaVersion");
  const acceptedAuthority = authorityFromAccepted(accepted);
  if (!acceptedAuthority.ok) return acceptedAuthority;
  const suppliedAuthority = validateContractRecord(record.value.authority, [
    "snapshotDigest", "canonicalFilterDigest", "datasetReceiptDigest",
    "datasetDerivationDigest", "partitionDigest", "currency", "ownerScope", "accountScope",
  ], [], "$.authority");
  if (!suppliedAuthority.ok) return suppliedAuthority;
  const digestFields = [
    ["snapshotDigest", "analysis_snapshot"],
    ["canonicalFilterDigest", "canonical_filter"],
    ["datasetReceiptDigest", "analytical_dataset"],
    ["datasetDerivationDigest", "analytical_dataset_derivation"],
    ["partitionDigest", "analytical_partition"],
  ] as const;
  for (const [field, domain] of digestFields) {
    const value = validateClaimedDigest(suppliedAuthority.value[field], `$.authority.${field}`, domain);
    if (!value.ok || value.value !== acceptedAuthority.value[field]) {
      return contractFailure("ti_v3_analytics_contract_reference_mismatch", `$.authority.${field}`);
    }
  }
  const ownerScope = validateKeyArray(suppliedAuthority.value.ownerScope, "$.authority.ownerScope");
  const accountScope = validateKeyArray(suppliedAuthority.value.accountScope, "$.authority.accountScope");
  if (!ownerScope.ok) return ownerScope;
  if (!accountScope.ok) return accountScope;
  if (
    JSON.stringify(ownerScope.value) !== JSON.stringify(acceptedAuthority.value.ownerScope) ||
    JSON.stringify(accountScope.value) !== JSON.stringify(acceptedAuthority.value.accountScope) ||
    suppliedAuthority.value.currency !== acceptedAuthority.value.currency
  ) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.authority");

  if (!Array.isArray(record.value.filters) || record.value.filters.length > TRADE_QUERY_LIMITS.maximumFilters) {
    return contractFailure("ti_v3_analytics_contract_oversized", "$.filters");
  }
  const filters: TradeQueryFilter[] = [];
  for (let index = 0; index < record.value.filters.length; index += 1) {
    const filter = normalizeFilter(record.value.filters[index], index);
    if (!filter.ok) return filter;
    filters.push(filter.value);
  }
  if (new Set(filters.map((filter) => filter.kind)).size !== filters.length) {
    return contractFailure("ti_v3_analytics_contract_duplicate_identity", "$.filters");
  }
  const currencyFilter = filters.find((filter) => filter.kind === "currency");
  if (currencyFilter !== undefined && currencyFilter.value !== acceptedAuthority.value.currency) {
    return contractFailure("ti_v3_analytics_contract_currency_mismatch", "$.filters");
  }
  const accountFilter = filters.find((filter) => filter.kind === "account");
  if (accountFilter !== undefined && accountFilter.values.some((key) => !accountScope.value.includes(key))) {
    return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.filters.account");
  }
  const grouping = normalizeGrouping(record.value.grouping);
  if (!grouping.ok) return grouping;
  const metrics = exactArray(record.value.metrics, METRICS, "$.metrics");
  if (!metrics.ok || metrics.value.length > TRADE_QUERY_LIMITS.maximumMetrics) {
    return metrics.ok ? contractFailure("ti_v3_analytics_contract_oversized", "$.metrics") : metrics;
  }
  if (!Array.isArray(record.value.ordering) || record.value.ordering.length > TRADE_QUERY_LIMITS.maximumOrderings) {
    return contractFailure("ti_v3_analytics_contract_oversized", "$.ordering");
  }
  const ordering: TradeQueryOrdering[] = [];
  const orderingTargets = new Set<string>();
  for (let index = 0; index < record.value.ordering.length; index += 1) {
    const path = `$.ordering[${index}]`;
    const item = validateContractRecord(record.value.ordering[index], ["by", "metricKey", "direction"], [], path);
    if (!item.ok) return item;
    if (
      (item.value.by !== "group_identity" && item.value.by !== "metric") ||
      (item.value.direction !== "ascending" && item.value.direction !== "descending") ||
      (item.value.by === "group_identity" && item.value.metricKey !== null) ||
      (item.value.by === "metric" && (typeof item.value.metricKey !== "string" || !metrics.value.includes(item.value.metricKey)))
    ) return failure(path);
    const orderingTarget = item.value.by === "group_identity"
      ? "group_identity"
      : `metric:${item.value.metricKey}`;
    if (orderingTargets.has(orderingTarget)) {
      return contractFailure("ti_v3_analytics_contract_duplicate_identity", path);
    }
    orderingTargets.add(orderingTarget);
    ordering.push(Object.freeze(item.value as unknown as TradeQueryOrdering));
  }
  const limitsRecord = validateContractRecord(record.value.limits, [
    "groupLimit", "resultRowLimit", "evidencePerGroup", "totalEvidenceLimit", "diagnosticLimit",
  ], [], "$.limits");
  if (!limitsRecord.ok) return limitsRecord;
  const groupLimit = boundedLimit(limitsRecord.value.groupLimit, "$.limits.groupLimit", TRADE_QUERY_LIMITS.maximumGroups);
  const resultRowLimit = boundedLimit(limitsRecord.value.resultRowLimit, "$.limits.resultRowLimit", TRADE_QUERY_LIMITS.maximumResultRows);
  const evidencePerGroup = boundedLimit(limitsRecord.value.evidencePerGroup, "$.limits.evidencePerGroup", TRADE_QUERY_LIMITS.maximumEvidencePerGroup);
  const totalEvidenceLimit = boundedLimit(limitsRecord.value.totalEvidenceLimit, "$.limits.totalEvidenceLimit", TRADE_QUERY_LIMITS.maximumEvidenceTotal);
  const diagnosticLimit = boundedLimit(limitsRecord.value.diagnosticLimit, "$.limits.diagnosticLimit", TRADE_QUERY_LIMITS.maximumDiagnostics);
  if (!groupLimit.ok) return groupLimit;
  if (!resultRowLimit.ok) return resultRowLimit;
  if (!evidencePerGroup.ok) return evidencePerGroup;
  if (!totalEvidenceLimit.ok) return totalEvidenceLimit;
  if (!diagnosticLimit.ok) return diagnosticLimit;
  if (BigInt(resultRowLimit.value) > BigInt(groupLimit.value)) return failure("$.limits.resultRowLimit");
  if (BigInt(totalEvidenceLimit.value) < BigInt(resultRowLimit.value)) {
    return failure("$.limits.totalEvidenceLimit");
  }
  const policies = normalizePolicies(record.value.policies);
  if (!policies.ok) return policies;
  const content = {
    schemaVersion: TRADE_QUERY_PLAN_VERSION,
    queryPlanKey: TRADE_QUERY_PLAN_KEY,
    queryPlanVersion: TRADE_QUERY_PLAN_SEMANTIC_VERSION,
    authority: acceptedAuthority.value,
    filters: Object.freeze([...filters].sort((left, right) => compareUnicodeCodePoints(left.kind, right.kind))),
    grouping: grouping.value,
    metrics: Object.freeze(metrics.value as TradeQueryMetricKey[]),
    ordering: Object.freeze(ordering),
    limits: Object.freeze({
      groupLimit: groupLimit.value,
      resultRowLimit: resultRowLimit.value,
      evidencePerGroup: evidencePerGroup.value,
      totalEvidenceLimit: totalEvidenceLimit.value,
      diagnosticLimit: diagnosticLimit.value,
    }),
    policies: policies.value,
  };
  const serialized = serializeCanonicalValue(content);
  if (!serialized.ok || serialized.value.json.length > TRADE_QUERY_LIMITS.maximumPlanCodeUnits) {
    return contractFailure("ti_v3_analytics_contract_oversized", "$");
  }
  return { ok: true, value: Object.freeze(content) };
}

export function buildTradeQueryPlan(
  input: unknown,
  authority: TradeQueryAuthority,
): ExactResult<TradeQueryPlan, AnalyticalContractFailure> {
  const normalized = normalizePlanContent(input, authority);
  if (!normalized.ok) return normalized;
  return finalizeContentAddressedAuthority(
    "trade_query_plan",
    normalized.value,
    "queryPlanDigest",
  ) as ExactResult<TradeQueryPlan, AnalyticalContractFailure>;
}

export function verifyTradeQueryPlan(
  input: unknown,
  authority: TradeQueryAuthority,
): ExactResult<TradeQueryPlan, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion", "queryPlanKey", "queryPlanVersion", "authority", "filters",
    "grouping", "metrics", "ordering", "limits", "policies", "queryPlanDigest",
  ], [], "$");
  if (!record.ok) return record;
  const digest = validateClaimedDigest(record.value.queryPlanDigest, "$.queryPlanDigest", "trade_query_plan");
  if (!digest.ok) return digest;
  const { queryPlanDigest: _digest, ...content } = record.value;
  void _digest;
  const rebuilt = buildTradeQueryPlan(content, authority);
  return rebuilt.ok && rebuilt.value.queryPlanDigest === digest.value
    ? rebuilt
    : contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.queryPlanDigest");
}

export function tradeQueryAuthorityInput(
  authority: TradeQueryAuthority,
): TradeQueryPlanAuthority {
  const result = authorityFromAccepted(authority);
  if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
  return result.value;
}
