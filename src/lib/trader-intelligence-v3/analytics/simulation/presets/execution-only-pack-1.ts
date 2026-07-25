import type { CanonicalContentDigest } from "../../../domain/identity";
import type { ExactResult } from "../../../domain/exact";
import {
  contractFailure,
  finalizeContentAddressedAuthority,
  validateCanonicalCount,
  validateContractRecord,
  type AnalyticalContractFailure,
} from "../../contracts";
import type { TradeQueryAuthority } from "../../query/contracts";
import {
  buildCounterfactualSimulationPlan,
  COUNTERFACTUAL_SIMULATION_PLAN_VERSION,
  COUNTERFACTUAL_SIMULATION_POLICIES,
  COUNTERFACTUAL_SIMULATION_SEMANTIC_VERSION,
  type CounterfactualSimulationPlan,
} from "../contracts";

export const EXECUTION_ONLY_SIMULATION_PRESET_VERSION =
  "ti_v3_execution_only_simulation_preset_v1" as const;

export type RepresentativeSimulationPresetKey =
  | "simulate_stop_after_consecutive_losses"
  | "simulate_maximum_trades_per_day"
  | "simulate_direction_only";

export interface RepresentativeSimulationPreset {
  readonly schemaVersion: typeof EXECUTION_ONLY_SIMULATION_PRESET_VERSION;
  readonly presetKey: RepresentativeSimulationPresetKey;
  readonly presetVersion: "v1";
  readonly requiredAuthority:
    "verified_ga1_a_query_result_and_execution_rows_v1";
  readonly compiledPlanDigest: CanonicalContentDigest;
  readonly rulePrecedence: readonly string[];
  readonly resetPolicy:
    "owner_account_currency_verified_session_v1";
  readonly minimumSamplePolicy: "descriptive_at_any_exact_sample_v1";
  readonly missingDataPolicy: "fail_closed_or_classify_unavailable_v1";
  readonly comparisonPolicy: "actual_vs_simulated_exact_metrics_v1";
  readonly evidencePolicy: "bounded_execution_and_occurrence_references_v1";
  readonly counterexamplePolicy:
    "preserved_harmful_and_removed_profitable_trades_v1";
  readonly outlierPolicy: "leave_largest_effect_out_deferred_checkpoint_v1";
  readonly allowedWording:
    "historical_in_sample_rule_produced_exact_observed_difference_v1";
  readonly inSampleWarning:
    "historical_result_does_not_prove_future_edge_v1";
  readonly presetDigest: CanonicalContentDigest;
}

export interface CompiledRepresentativeSimulationPreset {
  readonly preset: RepresentativeSimulationPreset;
  readonly plan: CounterfactualSimulationPlan;
}

const DEFAULT_LIMITS = Object.freeze({
  sourceRowLimit: "10000",
  affectedTradeLimit: "10000",
  sessionSummaryLimit: "2000",
  evidenceTradeLimit: "512",
  diagnosticLimit: "128",
});

function positiveInteger(
  input: unknown,
  path: string,
  maximum: number,
): ExactResult<string, AnalyticalContractFailure> {
  const value = validateCanonicalCount(input, path);
  if (!value.ok) return value;
  if (
    BigInt(value.value) < BigInt(1) ||
    BigInt(value.value) > BigInt(maximum)
  ) {
    return contractFailure("ti_v3_analytics_contract_oversized", path);
  }
  return value;
}

function finish(
  presetKey: RepresentativeSimulationPresetKey,
  sourceQueryPlan: unknown,
  authority: TradeQueryAuthority,
  rule: unknown,
): ExactResult<
  CompiledRepresentativeSimulationPreset,
  AnalyticalContractFailure
> {
  const plan = buildCounterfactualSimulationPlan({
    schemaVersion: COUNTERFACTUAL_SIMULATION_PLAN_VERSION,
    semanticVersion: COUNTERFACTUAL_SIMULATION_SEMANTIC_VERSION,
    sourceQueryPlan,
    rules: [rule],
    policies: COUNTERFACTUAL_SIMULATION_POLICIES,
    limits: DEFAULT_LIMITS,
  }, authority);
  if (!plan.ok) return plan;
  const preset = finalizeContentAddressedAuthority(
    "counterfactual_simulation_preset",
    {
      schemaVersion: EXECUTION_ONLY_SIMULATION_PRESET_VERSION,
      presetKey,
      presetVersion: "v1" as const,
      requiredAuthority:
        "verified_ga1_a_query_result_and_execution_rows_v1" as const,
      compiledPlanDigest: plan.value.planDigest,
      rulePrecedence: Object.freeze(
        plan.value.rules.map((item) => item.ruleId),
      ),
      resetPolicy:
        "owner_account_currency_verified_session_v1" as const,
      minimumSamplePolicy: "descriptive_at_any_exact_sample_v1" as const,
      missingDataPolicy: "fail_closed_or_classify_unavailable_v1" as const,
      comparisonPolicy: "actual_vs_simulated_exact_metrics_v1" as const,
      evidencePolicy:
        "bounded_execution_and_occurrence_references_v1" as const,
      counterexamplePolicy:
        "preserved_harmful_and_removed_profitable_trades_v1" as const,
      outlierPolicy:
        "leave_largest_effect_out_deferred_checkpoint_v1" as const,
      allowedWording:
        "historical_in_sample_rule_produced_exact_observed_difference_v1" as const,
      inSampleWarning:
        "historical_result_does_not_prove_future_edge_v1" as const,
    },
    "presetDigest",
  );
  return preset.ok
    ? {
        ok: true,
        value: Object.freeze({
          preset: preset.value as RepresentativeSimulationPreset,
          plan: plan.value,
        }),
      }
    : preset;
}

export function compileStopAfterConsecutiveLossesPreset(
  sourceQueryPlan: unknown,
  authority: TradeQueryAuthority,
  argumentsInput: unknown,
): ExactResult<
  CompiledRepresentativeSimulationPreset,
  AnalyticalContractFailure
> {
  const record = validateContractRecord(
    argumentsInput,
    ["consecutiveLossThreshold"],
  );
  if (!record.ok) return record;
  const threshold = positiveInteger(
    record.value.consecutiveLossThreshold,
    "$.consecutiveLossThreshold",
    16,
  );
  if (!threshold.ok) return threshold;
  return finish(
    "simulate_stop_after_consecutive_losses",
    sourceQueryPlan,
    authority,
    {
      ruleId: "stop_after_consecutive_losses",
      kind: "stop_after_consecutive_losses",
      precedence: "1",
      action: "stop_session",
      consecutiveLossThreshold: threshold.value,
      flatTradePolicy: "flat_resets_loss_streak_v1",
    },
  );
}

export function compileMaximumTradesPerDayPreset(
  sourceQueryPlan: unknown,
  authority: TradeQueryAuthority,
  argumentsInput: unknown,
): ExactResult<
  CompiledRepresentativeSimulationPreset,
  AnalyticalContractFailure
> {
  const record = validateContractRecord(argumentsInput, ["maximumTrades"]);
  if (!record.ok) return record;
  const maximumTrades = positiveInteger(
    record.value.maximumTrades,
    "$.maximumTrades",
    1_000,
  );
  if (!maximumTrades.ok) return maximumTrades;
  return finish(
    "simulate_maximum_trades_per_day",
    sourceQueryPlan,
    authority,
    {
      ruleId: "maximum_trades_per_day",
      kind: "maximum_trades_per_day",
      precedence: "1",
      action: "exclude_trade",
      maximumTrades: maximumTrades.value,
      countPolicy: "executed_simulated_entries_only_v1",
    },
  );
}

export function compileDirectionOnlyPreset(
  sourceQueryPlan: unknown,
  authority: TradeQueryAuthority,
  argumentsInput: unknown,
): ExactResult<
  CompiledRepresentativeSimulationPreset,
  AnalyticalContractFailure
> {
  const record = validateContractRecord(argumentsInput, ["allowedDirection"]);
  if (!record.ok) return record;
  if (
    record.value.allowedDirection !== "long" &&
    record.value.allowedDirection !== "short"
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.allowedDirection",
    );
  }
  return finish(
    "simulate_direction_only",
    sourceQueryPlan,
    authority,
    {
      ruleId: "direction_only",
      kind: "direction_only",
      precedence: "1",
      action: "exclude_trade",
      allowedDirection: record.value.allowedDirection,
    },
  );
}
