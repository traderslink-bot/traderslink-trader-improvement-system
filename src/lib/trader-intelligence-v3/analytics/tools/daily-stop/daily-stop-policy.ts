import {
  createCanonicalContentIdentity,
  type CanonicalContentDigest,
} from "../../../domain/identity";
import type { ExactResult } from "../../../domain/exact";
import {
  contractFailure,
  validateContractRecord,
  type AnalyticalContractFailure,
} from "../../contracts";
import {
  NORMALIZED_ANALYSIS_ARGUMENTS_VERSION,
  TOOL_REGISTRY_ENTRY_VERSION,
  buildNormalizedAnalysisArguments,
  buildToolRegistryEntry,
  verifyNormalizedAnalysisArguments,
  type NormalizedAnalysisArguments,
  type ToolRegistryEntry,
} from "../../registry";

export const DAILY_STOP_TOOL_KEY = "simulate_daily_stop_rule" as const;
export const DAILY_STOP_TOOL_VERSION = "v1" as const;
export const DAILY_STOP_THRESHOLD_MIN = 1;
export const DAILY_STOP_THRESHOLD_MAX = 16;

export const DAILY_STOP_POLICY = Object.freeze({
  key: "ti_v3_daily_stop_simulation_policy",
  version: "v1",
  defaultConsecutiveLossThreshold: 2,
  thresholdBounds: "closed_integer_1_through_16",
  streakPolicy: "completed_net_loss_only_v1",
  flatTradePolicy: "flat_resets_loss_streak_v1",
  overlapPolicy: "retain_entries_at_or_before_stop_timestamp_v1",
  sameTimestampPolicy: "authoritative_tie_or_exclude_v1",
  evidenceSamplePolicy: "ti_v3_daily_stop_conservative_evidence_v1",
  evidenceSampleVersion: "v1",
  outlierPolicy: "ti_v3_daily_stop_outlier_contribution_v1",
  outlierPolicyVersion: "v1",
  minimumTentativeSessions: 10,
  minimumDescriptiveSessions: 5,
} as const);

export const DAILY_STOP_LIMITATION_CODES = Object.freeze({
  thresholdSampleInsufficient: "ti_v3_daily_stop_threshold_sample_insufficient",
  thresholdSampleDescriptiveOnly: "ti_v3_daily_stop_threshold_sample_descriptive_only",
  ambiguousCompletionOrder: "ti_v3_daily_stop_completion_order_ambiguous",
  unsupportedSimulationState: "ti_v3_daily_stop_simulation_state_unavailable",
  outlierSensitive: "ti_v3_daily_stop_outlier_contribution_exceeded",
  excludedSessionScopeUnavailable: "ti_v3_daily_stop_excluded_session_scope_unavailable",
} as const);

export const DAILY_STOP_SAMPLE_STATES = Object.freeze({
  insufficient: "insufficient",
  descriptiveOnly: "descriptive_only",
  claimEligible: "claim_eligible",
} as const);

export type DailyStopSampleState = typeof DAILY_STOP_SAMPLE_STATES[keyof typeof DAILY_STOP_SAMPLE_STATES];

export function dailyStopSampleState(thresholdReachedSessionCount: number): DailyStopSampleState {
  return thresholdReachedSessionCount < DAILY_STOP_POLICY.minimumDescriptiveSessions
    ? DAILY_STOP_SAMPLE_STATES.insufficient
    : thresholdReachedSessionCount < DAILY_STOP_POLICY.minimumTentativeSessions
      ? DAILY_STOP_SAMPLE_STATES.descriptiveOnly
      : DAILY_STOP_SAMPLE_STATES.claimEligible;
}

const argumentSchema = createCanonicalContentIdentity("canonical_content", "v1", {
  schemaKey: "ti_v3_daily_stop_rule_arguments",
  schemaVersion: "v1",
  fields: [
    { key: "consecutiveLossThreshold", kind: "bounded_canonical_integer", minimum: String(DAILY_STOP_THRESHOLD_MIN), maximum: String(DAILY_STOP_THRESHOLD_MAX), default: String(DAILY_STOP_POLICY.defaultConsecutiveLossThreshold) },
    { key: "streakPolicy", kind: "literal", value: DAILY_STOP_POLICY.streakPolicy },
    { key: "flatTradePolicy", kind: "literal", value: DAILY_STOP_POLICY.flatTradePolicy },
    { key: "overlapPolicy", kind: "literal", value: DAILY_STOP_POLICY.overlapPolicy },
    { key: "evidenceSamplePolicy", kind: "literal", value: DAILY_STOP_POLICY.evidenceSamplePolicy },
    { key: "outlierPolicy", kind: "literal", value: DAILY_STOP_POLICY.outlierPolicy },
  ],
});
if (!argumentSchema.ok) throw new Error(argumentSchema.error.code);
export const DAILY_STOP_ARGUMENT_SCHEMA_DIGEST = argumentSchema.value.identifier;

export interface DailyStopArguments {
  readonly consecutiveLossThreshold: string;
  readonly streakPolicy: typeof DAILY_STOP_POLICY.streakPolicy;
  readonly flatTradePolicy: typeof DAILY_STOP_POLICY.flatTradePolicy;
  readonly overlapPolicy: typeof DAILY_STOP_POLICY.overlapPolicy;
  readonly evidenceSamplePolicy: typeof DAILY_STOP_POLICY.evidenceSamplePolicy;
  readonly outlierPolicy: typeof DAILY_STOP_POLICY.outlierPolicy;
}

function parseCanonicalThreshold(input: unknown): string | null {
  if (typeof input !== "string" || !/^(?:0|[1-9][0-9]*)$/.test(input)) return null;
  try {
    const value = BigInt(input);
    return value >= BigInt(DAILY_STOP_THRESHOLD_MIN) && value <= BigInt(DAILY_STOP_THRESHOLD_MAX) ? input : null;
  } catch {
    return null;
  }
}

function parseArguments(input: unknown): ExactResult<DailyStopArguments, AnalyticalContractFailure> {
  if (input === undefined) {
    return { ok: true, value: Object.freeze({
      consecutiveLossThreshold: String(DAILY_STOP_POLICY.defaultConsecutiveLossThreshold),
      streakPolicy: DAILY_STOP_POLICY.streakPolicy,
      flatTradePolicy: DAILY_STOP_POLICY.flatTradePolicy,
      overlapPolicy: DAILY_STOP_POLICY.overlapPolicy,
      evidenceSamplePolicy: DAILY_STOP_POLICY.evidenceSamplePolicy,
      outlierPolicy: DAILY_STOP_POLICY.outlierPolicy,
    }) };
  }
  const record = validateContractRecord(input, [], [
    "consecutiveLossThreshold", "streakPolicy", "flatTradePolicy", "overlapPolicy", "evidenceSamplePolicy", "outlierPolicy",
  ], "$.arguments");
  if (!record.ok) return record;
  const threshold = parseCanonicalThreshold(record.value.consecutiveLossThreshold ?? String(DAILY_STOP_POLICY.defaultConsecutiveLossThreshold));
  if (threshold === null) return contractFailure("ti_v3_analytics_contract_invalid", "$.arguments.consecutiveLossThreshold");
  const values = {
    consecutiveLossThreshold: threshold,
    streakPolicy: record.value.streakPolicy ?? DAILY_STOP_POLICY.streakPolicy,
    flatTradePolicy: record.value.flatTradePolicy ?? DAILY_STOP_POLICY.flatTradePolicy,
    overlapPolicy: record.value.overlapPolicy ?? DAILY_STOP_POLICY.overlapPolicy,
    evidenceSamplePolicy: record.value.evidenceSamplePolicy ?? DAILY_STOP_POLICY.evidenceSamplePolicy,
    outlierPolicy: record.value.outlierPolicy ?? DAILY_STOP_POLICY.outlierPolicy,
  };
  if (
    values.streakPolicy !== DAILY_STOP_POLICY.streakPolicy ||
    values.flatTradePolicy !== DAILY_STOP_POLICY.flatTradePolicy ||
    values.overlapPolicy !== DAILY_STOP_POLICY.overlapPolicy ||
    values.evidenceSamplePolicy !== DAILY_STOP_POLICY.evidenceSamplePolicy ||
    values.outlierPolicy !== DAILY_STOP_POLICY.outlierPolicy
  ) return contractFailure("ti_v3_analytics_contract_invalid", "$.arguments.policy");
  return { ok: true, value: Object.freeze(values as DailyStopArguments) };
}

export function normalizeDailyStopArguments(input?: unknown): ExactResult<NormalizedAnalysisArguments, AnalyticalContractFailure> {
  const parsed = parseArguments(input);
  if (!parsed.ok) return parsed;
  return buildNormalizedAnalysisArguments({
    schemaVersion: NORMALIZED_ANALYSIS_ARGUMENTS_VERSION,
    argumentSchemaDigest: DAILY_STOP_ARGUMENT_SCHEMA_DIGEST,
    values: parsed.value,
  });
}

export function verifyDailyStopArguments(input: unknown): ExactResult<{ readonly normalized: NormalizedAnalysisArguments; readonly values: DailyStopArguments }, AnalyticalContractFailure> {
  const normalized = verifyNormalizedAnalysisArguments(input);
  if (!normalized.ok || normalized.value.argumentSchemaDigest !== DAILY_STOP_ARGUMENT_SCHEMA_DIGEST) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.normalizedArguments");
  const parsed = parseArguments(normalized.value.values);
  if (!parsed.ok) return parsed;
  const rebuilt = normalizeDailyStopArguments(parsed.value);
  if (!rebuilt.ok || rebuilt.value.argumentsDigest !== normalized.value.argumentsDigest) return contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.normalizedArguments.argumentsDigest");
  return { ok: true, value: Object.freeze({ normalized: rebuilt.value, values: parsed.value }) };
}

export function buildDailyStopToolRegistryEntry(): ExactResult<ToolRegistryEntry, AnalyticalContractFailure> {
  return buildToolRegistryEntry({
    schemaVersion: TOOL_REGISTRY_ENTRY_VERSION,
    toolKey: DAILY_STOP_TOOL_KEY,
    toolVersion: DAILY_STOP_TOOL_VERSION,
    descriptionCode: "historical_consecutive_loss_daily_stop_exact_simulation",
    requiredEligibilityCapability: "closed_trade_analytics",
    argumentSchemaDigest: DAILY_STOP_ARGUMENT_SCHEMA_DIGEST,
    requiredRowFields: [
      "canonical_owner_key", "canonical_account_key", "currency", "first_entry_at", "final_exit_at", "timezone", "date_basis", "session_date", "sequence_in_partition", "gross_pnl", "signed_charges", "net_pnl",
    ],
    outputContracts: ["exact_table_v1", "validated_claim_v1", "chart_ready_series_v1", "analytical_evidence_bundle_v1"],
    blockedArtifactPolicy: "diagnostics_only",
    evidencePolicyKey: DAILY_STOP_POLICY.evidenceSamplePolicy,
    evidencePolicyVersion: DAILY_STOP_POLICY.evidenceSampleVersion,
    toolPolicyKey: DAILY_STOP_POLICY.key,
    toolPolicyVersion: DAILY_STOP_POLICY.version,
    minimumSamplePolicyState: "versioned_tool_policy",
    optionalOutputContractsWhenLimited: ["validated_claim_v1"],
    supportedCurrencies: ["CAD", "USD"],
    supportedTimezones: ["America/New_York", "UTC"],
    deprecationState: "active_contract",
    focusedTestKeys: ["argument_bounds", "completed_loss_streak", "suffix_membership", "exact_reconciliation", "semantic_replay", "reference_differential"],
    executableState: "tool_specific_deterministic_executor",
  });
}

export function dailyStopArgumentSchemaDigest(): CanonicalContentDigest {
  return DAILY_STOP_ARGUMENT_SCHEMA_DIGEST;
}
