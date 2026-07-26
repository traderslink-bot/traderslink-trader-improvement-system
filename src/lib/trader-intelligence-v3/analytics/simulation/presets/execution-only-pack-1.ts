import type { CanonicalContentDigest } from "../../../domain/identity";
import {
  compareExactDecimals,
  validateExactDecimal,
  type ExactResult,
} from "../../../domain/exact";
import {
  contractFailure,
  finalizeContentAddressedAuthority,
  validateCanonicalCount,
  validateClaimedDigest,
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
  type RuleStateDependencies,
  verifyCounterfactualSimulationPlan,
} from "../contracts";

export const EXECUTION_ONLY_SIMULATION_PRESET_VERSION =
  "ti_v3_execution_only_simulation_preset_v3" as const;

export type RepresentativeSimulationPresetKey =
  | "simulate_stop_after_consecutive_losses"
  | "simulate_maximum_trades_per_day"
  | "simulate_direction_only"
  | "simulate_stop_after_daily_dollar_drawdown"
  | "simulate_stop_after_profit_giveback"
  | "simulate_skip_fourth_and_later_trades"
  | "simulate_wait_after_loss"
  | "simulate_maximum_attempts_per_ticker"
  | "simulate_stop_after_losing_ticker_attempts"
  | "simulate_no_new_trades_after_time"
  | "simulate_exclude_price_range"
  | "simulate_skip_repeat_attempts"
  | "simulate_after_outcome_exclusion"
  | "simulate_reduce_size_after_loss";

export interface RepresentativeSimulationPreset {
  readonly schemaVersion: typeof EXECUTION_ONLY_SIMULATION_PRESET_VERSION;
  readonly presetKey: RepresentativeSimulationPresetKey;
  readonly presetVersion: "v1";
  readonly requiredAuthority:
    "verified_ga1_a_query_result_and_execution_rows_v1";
  readonly arguments: Readonly<Record<string, unknown>>;
  readonly compiledPlanDigest: CanonicalContentDigest;
  readonly stateDependencies: RuleStateDependencies;
  readonly rulePrecedence: readonly string[];
  readonly resetPolicy:
    "owner_account_currency_verified_session_v1";
  readonly minimumSamplePolicy: "descriptive_at_any_exact_sample_v1";
  readonly missingDataPolicy: "fail_closed_or_classify_unavailable_v1";
  readonly comparisonPolicy:
    "separate_exact_gross_and_exact_net_populations_v1";
  readonly affectedPopulationPolicy:
    "exact_rule_classifications_reconciled_to_ordered_outcomes_v1";
  readonly evidencePolicy:
    "bounded_exact_classification_execution_and_occurrence_references_v1";
  readonly counterexamplePolicy:
    "preserved_harmful_and_removed_profitable_trades_v1";
  readonly outlierPolicy: "exact_population_no_outlier_suppression_v1";
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
  argumentsValue: Readonly<Record<string, unknown>>,
  rule: unknown,
): ExactResult<
  CompiledRepresentativeSimulationPreset,
  AnalyticalContractFailure
> {
  const plan = buildCounterfactualSimulationPlan({
    schemaVersion: COUNTERFACTUAL_SIMULATION_PLAN_VERSION,
    semanticVersion: COUNTERFACTUAL_SIMULATION_SEMANTIC_VERSION,
    planOrigin: "governed_preset",
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
      arguments: Object.freeze({ ...argumentsValue }),
      compiledPlanDigest: plan.value.planDigest,
      stateDependencies: plan.value.stateDependencies,
      rulePrecedence: Object.freeze(
        plan.value.rules.map((item) => item.ruleId),
      ),
      resetPolicy:
        "owner_account_currency_verified_session_v1" as const,
      minimumSamplePolicy: "descriptive_at_any_exact_sample_v1" as const,
      missingDataPolicy: "fail_closed_or_classify_unavailable_v1" as const,
      comparisonPolicy:
        "separate_exact_gross_and_exact_net_populations_v1" as const,
      affectedPopulationPolicy:
        "exact_rule_classifications_reconciled_to_ordered_outcomes_v1" as const,
      evidencePolicy:
        "bounded_exact_classification_execution_and_occurrence_references_v1" as const,
      counterexamplePolicy:
        "preserved_harmful_and_removed_profitable_trades_v1" as const,
      outlierPolicy:
        "exact_population_no_outlier_suppression_v1" as const,
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
    Object.freeze({ consecutiveLossThreshold: threshold.value }),
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
    Object.freeze({ maximumTrades: maximumTrades.value }),
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
    Object.freeze({ allowedDirection: record.value.allowedDirection }),
    {
      ruleId: "direction_only",
      kind: "direction_only",
      precedence: "1",
      action: "exclude_trade",
      allowedDirection: record.value.allowedDirection,
    },
  );
}

function positiveDecimal(
  input: unknown,
  path: string,
): ExactResult<string, AnalyticalContractFailure> {
  const value = validateExactDecimal(input);
  const zero = validateExactDecimal("0");
  if (
    !value.ok ||
    !zero.ok ||
    compareExactDecimals(value.value, zero.value) <= 0
  ) {
    return contractFailure("ti_v3_analytics_contract_invalid", path);
  }
  return { ok: true, value: value.value };
}

function emptyArguments(
  input: unknown,
): ExactResult<Readonly<Record<string, never>>, AnalyticalContractFailure> {
  const record = validateContractRecord(input, []);
  return record.ok
    ? { ok: true, value: Object.freeze({}) }
    : record;
}

export function compileStopAfterDailyDollarDrawdownPreset(
  sourceQueryPlan: unknown,
  authority: TradeQueryAuthority,
  argumentsInput: unknown,
): ExactResult<
  CompiledRepresentativeSimulationPreset,
  AnalyticalContractFailure
> {
  const record = validateContractRecord(
    argumentsInput,
    ["maximumDailyDrawdown"],
  );
  if (!record.ok) return record;
  const threshold = positiveDecimal(
    record.value.maximumDailyDrawdown,
    "$.maximumDailyDrawdown",
  );
  if (!threshold.ok) return threshold;
  const argumentsValue = Object.freeze({
    maximumDailyDrawdown: threshold.value,
  });
  return finish(
    "simulate_stop_after_daily_dollar_drawdown",
    sourceQueryPlan,
    authority,
    argumentsValue,
    {
      ruleId: "stop_after_daily_dollar_drawdown",
      kind: "stop_after_daily_dollar_drawdown",
      precedence: "1",
      action: "stop_session",
      maximumDailyDrawdown: threshold.value,
      thresholdPolicy:
        "realized_net_pnl_at_or_below_negative_threshold_v1",
    },
  );
}

export function compileStopAfterProfitGivebackPreset(
  sourceQueryPlan: unknown,
  authority: TradeQueryAuthority,
  argumentsInput: unknown,
): ExactResult<
  CompiledRepresentativeSimulationPreset,
  AnalyticalContractFailure
> {
  const record = validateContractRecord(
    argumentsInput,
    ["maximumProfitGiveback"],
  );
  if (!record.ok) return record;
  const threshold = positiveDecimal(
    record.value.maximumProfitGiveback,
    "$.maximumProfitGiveback",
  );
  if (!threshold.ok) return threshold;
  const argumentsValue = Object.freeze({
    maximumProfitGiveback: threshold.value,
  });
  return finish(
    "simulate_stop_after_profit_giveback",
    sourceQueryPlan,
    authority,
    argumentsValue,
    {
      ruleId: "stop_after_profit_giveback",
      kind: "stop_after_profit_giveback",
      precedence: "1",
      action: "stop_session",
      maximumProfitGiveback: threshold.value,
      thresholdPolicy:
        "positive_peak_realized_pnl_giveback_at_or_above_threshold_v1",
    },
  );
}

export function compileSkipFourthAndLaterTradesPreset(
  sourceQueryPlan: unknown,
  authority: TradeQueryAuthority,
  argumentsInput: unknown,
): ExactResult<
  CompiledRepresentativeSimulationPreset,
  AnalyticalContractFailure
> {
  const argumentsValue = emptyArguments(argumentsInput);
  if (!argumentsValue.ok) return argumentsValue;
  return finish(
    "simulate_skip_fourth_and_later_trades",
    sourceQueryPlan,
    authority,
    argumentsValue.value,
    {
      ruleId: "skip_fourth_and_later_trades",
      kind: "maximum_trades_per_day",
      precedence: "1",
      action: "exclude_trade",
      maximumTrades: "3",
      countPolicy: "executed_simulated_entries_only_v1",
    },
  );
}

export function compileWaitAfterLossPreset(
  sourceQueryPlan: unknown,
  authority: TradeQueryAuthority,
  argumentsInput: unknown,
): ExactResult<
  CompiledRepresentativeSimulationPreset,
  AnalyticalContractFailure
> {
  const record = validateContractRecord(argumentsInput, ["cooldownSeconds"]);
  if (!record.ok) return record;
  const cooldown = positiveInteger(
    record.value.cooldownSeconds,
    "$.cooldownSeconds",
    86_400,
  );
  if (!cooldown.ok) return cooldown;
  const argumentsValue = Object.freeze({ cooldownSeconds: cooldown.value });
  return finish(
    "simulate_wait_after_loss",
    sourceQueryPlan,
    authority,
    argumentsValue,
    {
      ruleId: "wait_after_loss",
      kind: "wait_after_loss",
      precedence: "1",
      action: "cooldown",
      cooldownSeconds: cooldown.value,
      triggerOutcome: "loss",
      expiryPolicy: "entry_at_or_after_expiry_is_eligible_v1",
    },
  );
}

export function compileMaximumAttemptsPerTickerPreset(
  sourceQueryPlan: unknown,
  authority: TradeQueryAuthority,
  argumentsInput: unknown,
): ExactResult<
  CompiledRepresentativeSimulationPreset,
  AnalyticalContractFailure
> {
  const record = validateContractRecord(argumentsInput, ["maximumAttempts"]);
  if (!record.ok) return record;
  const maximum = positiveInteger(
    record.value.maximumAttempts,
    "$.maximumAttempts",
    1_000,
  );
  if (!maximum.ok) return maximum;
  const argumentsValue = Object.freeze({ maximumAttempts: maximum.value });
  return finish(
    "simulate_maximum_attempts_per_ticker",
    sourceQueryPlan,
    authority,
    argumentsValue,
    {
      ruleId: "maximum_attempts_per_ticker",
      kind: "maximum_attempts_per_ticker",
      precedence: "1",
      action: "exclude_trade",
      maximumAttempts: maximum.value,
      countPolicy:
        "retained_simulated_entries_per_stable_instrument_v1",
    },
  );
}

export function compileStopAfterLosingTickerAttemptsPreset(
  sourceQueryPlan: unknown,
  authority: TradeQueryAuthority,
  argumentsInput: unknown,
): ExactResult<
  CompiledRepresentativeSimulationPreset,
  AnalyticalContractFailure
> {
  const record = validateContractRecord(
    argumentsInput,
    ["losingAttemptThreshold"],
  );
  if (!record.ok) return record;
  const threshold = positiveInteger(
    record.value.losingAttemptThreshold,
    "$.losingAttemptThreshold",
    16,
  );
  if (!threshold.ok) return threshold;
  const argumentsValue = Object.freeze({
    losingAttemptThreshold: threshold.value,
  });
  return finish(
    "simulate_stop_after_losing_ticker_attempts",
    sourceQueryPlan,
    authority,
    argumentsValue,
    {
      ruleId: "stop_after_losing_ticker_attempts",
      kind: "stop_after_losing_ticker_attempts",
      precedence: "1",
      action: "stop_ticker",
      losingAttemptThreshold: threshold.value,
      gainFlatPolicy: "gain_and_flat_do_not_reset_v1",
    },
  );
}

export function compileNoNewTradesAfterTimePreset(
  sourceQueryPlan: unknown,
  authority: TradeQueryAuthority,
  argumentsInput: unknown,
): ExactResult<
  CompiledRepresentativeSimulationPreset,
  AnalyticalContractFailure
> {
  const record = validateContractRecord(argumentsInput, ["cutoffTime"]);
  if (!record.ok) return record;
  if (
    typeof record.value.cutoffTime !== "string" ||
    !/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(record.value.cutoffTime)
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.cutoffTime",
    );
  }
  const argumentsValue = Object.freeze({
    cutoffTime: record.value.cutoffTime,
  });
  return finish(
    "simulate_no_new_trades_after_time",
    sourceQueryPlan,
    authority,
    argumentsValue,
    {
      ruleId: "no_new_trades_after_time",
      kind: "no_new_trades_after_time",
      precedence: "1",
      action: "exclude_trade",
      cutoffTime: record.value.cutoffTime,
      timeBasis: "accepted_iana_timezone_wall_clock_v1",
      boundaryPolicy:
        "candidate_entry_at_or_after_cutoff_is_excluded_v1",
      overnightSessionPolicy:
        "reject_unsupported_overnight_session_v1",
    },
  );
}

export function compileExcludePriceRangePreset(
  sourceQueryPlan: unknown,
  authority: TradeQueryAuthority,
  argumentsInput: unknown,
): ExactResult<
  CompiledRepresentativeSimulationPreset,
  AnalyticalContractFailure
> {
  const record = validateContractRecord(
    argumentsInput,
    ["lowerEntryPrice", "upperEntryPrice"],
  );
  if (!record.ok) return record;
  const lower = positiveDecimal(
    record.value.lowerEntryPrice,
    "$.lowerEntryPrice",
  );
  const upper = positiveDecimal(
    record.value.upperEntryPrice,
    "$.upperEntryPrice",
  );
  if (!lower.ok) return lower;
  if (!upper.ok) return upper;
  const lowerExact = validateExactDecimal(lower.value);
  const upperExact = validateExactDecimal(upper.value);
  if (
    !lowerExact.ok ||
    !upperExact.ok ||
    compareExactDecimals(lowerExact.value, upperExact.value) >= 0
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.upperEntryPrice",
    );
  }
  const argumentsValue = Object.freeze({
    lowerEntryPrice: lower.value,
    upperEntryPrice: upper.value,
  });
  return finish(
    "simulate_exclude_price_range",
    sourceQueryPlan,
    authority,
    argumentsValue,
    {
      ruleId: "exclude_price_range",
      kind: "exclude_entry_price_range",
      precedence: "1",
      action: "exclude_trade",
      lowerEntryPrice: lower.value,
      upperEntryPrice: upper.value,
      rangeMode: "exclude_inside_v1",
      boundaryPolicy: "inclusive_lower_and_upper_v1",
    },
  );
}

export function compileSkipRepeatAttemptsPreset(
  sourceQueryPlan: unknown,
  authority: TradeQueryAuthority,
  argumentsInput: unknown,
): ExactResult<
  CompiledRepresentativeSimulationPreset,
  AnalyticalContractFailure
> {
  const argumentsValue = emptyArguments(argumentsInput);
  if (!argumentsValue.ok) return argumentsValue;
  return finish(
    "simulate_skip_repeat_attempts",
    sourceQueryPlan,
    authority,
    argumentsValue.value,
    {
      ruleId: "skip_repeat_attempts",
      kind: "maximum_attempts_per_ticker",
      precedence: "1",
      action: "exclude_trade",
      maximumAttempts: "1",
      countPolicy:
        "retained_simulated_entries_per_stable_instrument_v1",
    },
  );
}

export function compileAfterOutcomeExclusionPreset(
  sourceQueryPlan: unknown,
  authority: TradeQueryAuthority,
  argumentsInput: unknown,
): ExactResult<
  CompiledRepresentativeSimulationPreset,
  AnalyticalContractFailure
> {
  const record = validateContractRecord(argumentsInput, ["triggerOutcome"]);
  if (!record.ok) return record;
  if (!["loss", "gain", "flat"].includes(String(record.value.triggerOutcome))) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.triggerOutcome",
    );
  }
  const triggerOutcome = record.value.triggerOutcome as
    | "loss"
    | "gain"
    | "flat";
  const argumentsValue = Object.freeze({ triggerOutcome });
  return finish(
    "simulate_after_outcome_exclusion",
    sourceQueryPlan,
    authority,
    argumentsValue,
    {
      ruleId: `after_${triggerOutcome}_exclusion`,
      kind: "after_outcome_exclusion",
      precedence: "1",
      action: "exclude_next_eligible_trade",
      triggerOutcome,
      consumptionPolicy: "consume_one_next_rule_eligible_trade_v1",
      nonMatchingOutcomePolicy:
        "pending_exclusion_remains_until_consumed_v1",
    },
  );
}

/** A deliberately fixed v1 policy: after a strictly completed retained loss,
 * resize only the next rule-eligible entry to floor(50% of whole shares). */
export function compileReduceSizeAfterLossPreset(
  sourceQueryPlan: unknown,
  authority: TradeQueryAuthority,
  argumentsInput: unknown,
): ExactResult<CompiledRepresentativeSimulationPreset, AnalyticalContractFailure> {
  const argumentsValue = emptyArguments(argumentsInput);
  if (!argumentsValue.ok) return argumentsValue;
  return finish(
    "simulate_reduce_size_after_loss",
    sourceQueryPlan,
    authority,
    argumentsValue.value,
    {
      ruleId: "reduce_size_after_loss",
      kind: "reduce_size_after_loss",
      precedence: "1",
      action: "resize_next_eligible_trade",
      reductionMultiplier: "0.5",
      triggerPolicy: "completed_retained_exact_net_loss_v1",
      consumptionPolicy: "consume_one_next_rule_eligible_trade_v1",
      sizingPolicy: "floor_to_whole_share_minimum_one_v1",
      feePolicy: "complete_declared_components_only_v1",
    },
  );
}

function compilePresetByKey(
  presetKey: RepresentativeSimulationPresetKey,
  sourceQueryPlan: unknown,
  authority: TradeQueryAuthority,
  argumentsInput: unknown,
): ExactResult<
  CompiledRepresentativeSimulationPreset,
  AnalyticalContractFailure
> {
  switch (presetKey) {
    case "simulate_stop_after_consecutive_losses":
      return compileStopAfterConsecutiveLossesPreset(
        sourceQueryPlan,
        authority,
        argumentsInput,
      );
    case "simulate_maximum_trades_per_day":
      return compileMaximumTradesPerDayPreset(
        sourceQueryPlan,
        authority,
        argumentsInput,
      );
    case "simulate_direction_only":
      return compileDirectionOnlyPreset(
        sourceQueryPlan,
        authority,
        argumentsInput,
      );
    case "simulate_stop_after_daily_dollar_drawdown":
      return compileStopAfterDailyDollarDrawdownPreset(
        sourceQueryPlan,
        authority,
        argumentsInput,
      );
    case "simulate_stop_after_profit_giveback":
      return compileStopAfterProfitGivebackPreset(
        sourceQueryPlan,
        authority,
        argumentsInput,
      );
    case "simulate_skip_fourth_and_later_trades":
      return compileSkipFourthAndLaterTradesPreset(
        sourceQueryPlan,
        authority,
        argumentsInput,
      );
    case "simulate_wait_after_loss":
      return compileWaitAfterLossPreset(
        sourceQueryPlan,
        authority,
        argumentsInput,
      );
    case "simulate_maximum_attempts_per_ticker":
      return compileMaximumAttemptsPerTickerPreset(
        sourceQueryPlan,
        authority,
        argumentsInput,
      );
    case "simulate_stop_after_losing_ticker_attempts":
      return compileStopAfterLosingTickerAttemptsPreset(
        sourceQueryPlan,
        authority,
        argumentsInput,
      );
    case "simulate_no_new_trades_after_time":
      return compileNoNewTradesAfterTimePreset(
        sourceQueryPlan,
        authority,
        argumentsInput,
      );
    case "simulate_exclude_price_range":
      return compileExcludePriceRangePreset(
        sourceQueryPlan,
        authority,
        argumentsInput,
      );
    case "simulate_skip_repeat_attempts":
      return compileSkipRepeatAttemptsPreset(
        sourceQueryPlan,
        authority,
        argumentsInput,
      );
    case "simulate_after_outcome_exclusion":
      return compileAfterOutcomeExclusionPreset(
        sourceQueryPlan,
        authority,
        argumentsInput,
      );
    case "simulate_reduce_size_after_loss":
      return compileReduceSizeAfterLossPreset(sourceQueryPlan, authority, argumentsInput);
  }
}

export function verifyCompiledExecutionOnlySimulationPreset(
  input: unknown,
  authority: TradeQueryAuthority,
): ExactResult<
  CompiledRepresentativeSimulationPreset,
  AnalyticalContractFailure
> {
  const outer = validateContractRecord(input, ["preset", "plan"]);
  if (!outer.ok) return outer;
  const preset = validateContractRecord(outer.value.preset, [
    "schemaVersion", "presetKey", "presetVersion", "requiredAuthority",
    "arguments", "compiledPlanDigest", "stateDependencies", "rulePrecedence",
    "resetPolicy", "minimumSamplePolicy", "missingDataPolicy",
    "comparisonPolicy", "affectedPopulationPolicy", "evidencePolicy",
    "counterexamplePolicy", "outlierPolicy", "allowedWording",
    "inSampleWarning", "presetDigest",
  ], [], "$.preset");
  if (!preset.ok) return preset;
  if (
    preset.value.schemaVersion !== EXECUTION_ONLY_SIMULATION_PRESET_VERSION ||
    preset.value.presetVersion !== "v1" ||
    typeof preset.value.presetKey !== "string" ||
    ![
      "simulate_stop_after_consecutive_losses",
      "simulate_maximum_trades_per_day",
      "simulate_direction_only",
      "simulate_stop_after_daily_dollar_drawdown",
      "simulate_stop_after_profit_giveback",
      "simulate_skip_fourth_and_later_trades",
      "simulate_wait_after_loss",
      "simulate_maximum_attempts_per_ticker",
      "simulate_stop_after_losing_ticker_attempts",
      "simulate_no_new_trades_after_time",
      "simulate_exclude_price_range",
      "simulate_skip_repeat_attempts",
      "simulate_after_outcome_exclusion",
      "simulate_reduce_size_after_loss",
    ].includes(preset.value.presetKey)
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.preset.schemaVersion",
    );
  }
  const digest = validateClaimedDigest(
    preset.value.presetDigest,
    "$.preset.presetDigest",
    "counterfactual_simulation_preset",
  );
  if (!digest.ok) return digest;
  const plan = verifyCounterfactualSimulationPlan(outer.value.plan, authority);
  if (!plan.ok) return plan;
  const {
    queryPlanDigest: _queryPlanDigest,
    ...rawSourceQueryPlan
  } = plan.value.sourceQueryPlan;
  void _queryPlanDigest;
  const rebuilt = compilePresetByKey(
    preset.value.presetKey as RepresentativeSimulationPresetKey,
    rawSourceQueryPlan,
    authority,
    preset.value.arguments,
  );
  if (
    !rebuilt.ok ||
    rebuilt.value.plan.planDigest !== plan.value.planDigest ||
    rebuilt.value.preset.presetDigest !== digest.value
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_reference_mismatch",
      "$.preset",
    );
  }
  return rebuilt;
}
