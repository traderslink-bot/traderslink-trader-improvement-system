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
  validateContractKey,
  validateContractRecord,
  type AnalyticalContractFailure,
} from "../../contracts";
import type { TradeQueryAuthority, TradeQueryPlan } from "../../query/contracts";
import { buildTradeQueryPlan, verifyTradeQueryPlan } from "../../query/contracts";
import {
  resolveCounterfactualRuleStateDependencies,
  RULE_STATE_DEPENDENCY_POLICY_VERSION,
  type RuleStateDependencies,
} from "./rule-state-dependencies";

export const COUNTERFACTUAL_SIMULATION_PLAN_VERSION =
  "ti_v3_counterfactual_simulation_plan_v3" as const;
export const COUNTERFACTUAL_SIMULATION_SEMANTIC_VERSION = "v3" as const;

export const COUNTERFACTUAL_SIMULATION_LIMITS = Object.freeze({
  maximumRules: 16,
  maximumSourceRows: 10_000,
  maximumAffectedTrades: 10_000,
  maximumSessionSummaries: 2_000,
  maximumEvidenceTrades: 512,
  maximumDiagnostics: 128,
});

export type CounterfactualRule =
  | Readonly<{
      ruleId: string;
      kind: "stop_after_consecutive_losses";
      precedence: string;
      action: "stop_session";
      consecutiveLossThreshold: string;
      flatTradePolicy: "flat_resets_loss_streak_v1";
    }>
  | Readonly<{
      ruleId: string;
      kind: "maximum_trades_per_day";
      precedence: string;
      action: "exclude_trade";
      maximumTrades: string;
      countPolicy: "executed_simulated_entries_only_v1";
    }>
  | Readonly<{
      ruleId: string;
      kind: "direction_only";
      precedence: string;
      action: "exclude_trade";
      allowedDirection: "long" | "short";
    }>
  | Readonly<{
      ruleId: string;
      kind: "stop_after_daily_dollar_drawdown";
      precedence: string;
      action: "stop_session";
      maximumDailyDrawdown: string;
      thresholdPolicy: "realized_net_pnl_at_or_below_negative_threshold_v1";
    }>
  | Readonly<{
      ruleId: string;
      kind: "stop_after_profit_giveback";
      precedence: string;
      action: "stop_session";
      maximumProfitGiveback: string;
      thresholdPolicy:
        "positive_peak_realized_pnl_giveback_at_or_above_threshold_v1";
    }>
  | Readonly<{
      ruleId: string;
      kind: "wait_after_loss";
      precedence: string;
      action: "cooldown";
      cooldownSeconds: string;
      triggerOutcome: "loss";
      expiryPolicy: "entry_at_or_after_expiry_is_eligible_v1";
    }>
  | Readonly<{
      ruleId: string;
      kind: "maximum_attempts_per_ticker";
      precedence: string;
      action: "exclude_trade";
      maximumAttempts: string;
      countPolicy: "retained_simulated_entries_per_stable_instrument_v1";
    }>
  | Readonly<{
      ruleId: string;
      kind: "stop_after_losing_ticker_attempts";
      precedence: string;
      action: "stop_ticker";
      losingAttemptThreshold: string;
      gainFlatPolicy: "gain_and_flat_do_not_reset_v1";
    }>
  | Readonly<{
      ruleId: string;
      kind: "no_new_trades_after_time";
      precedence: string;
      action: "exclude_trade";
      cutoffTime: string;
      timeBasis: "accepted_iana_timezone_wall_clock_v1";
      boundaryPolicy: "candidate_entry_at_or_after_cutoff_is_excluded_v1";
      overnightSessionPolicy: "reject_unsupported_overnight_session_v1";
    }>
  | Readonly<{
      ruleId: string;
      kind: "exclude_entry_price_range";
      precedence: string;
      action: "exclude_trade";
      lowerEntryPrice: string;
      upperEntryPrice: string;
      rangeMode: "exclude_inside_v1";
      boundaryPolicy: "inclusive_lower_and_upper_v1";
    }>
  | Readonly<{
      ruleId: string;
      kind: "after_outcome_exclusion";
      precedence: string;
      action: "exclude_next_eligible_trade";
      triggerOutcome: "loss" | "gain" | "flat";
      consumptionPolicy: "consume_one_next_rule_eligible_trade_v1";
      nonMatchingOutcomePolicy:
        "pending_exclusion_remains_until_consumed_v1";
    }>
  | Readonly<{
      ruleId: string;
      kind: "reduce_size_after_loss";
      precedence: string;
      action: "resize_next_eligible_trade";
      reductionMultiplier: "0.5";
      triggerPolicy: "completed_retained_exact_net_loss_v1";
      consumptionPolicy: "consume_one_next_rule_eligible_trade_v1";
      sizingPolicy: "floor_to_whole_share_minimum_one_v1";
      feePolicy: "complete_declared_components_only_v1";
    }>;

export interface CounterfactualSimulationPlan {
  readonly schemaVersion: typeof COUNTERFACTUAL_SIMULATION_PLAN_VERSION;
  readonly semanticVersion: typeof COUNTERFACTUAL_SIMULATION_SEMANTIC_VERSION;
  readonly planOrigin: "generic_plan" | "governed_preset";
  readonly sourceQueryPlan: TradeQueryPlan;
  readonly rules: readonly CounterfactualRule[];
  readonly stateDependencies: RuleStateDependencies;
  readonly policies: Readonly<{
    readonly chronologicalOrder:
      "entry_at_then_exit_at_then_semantic_round_trip_key_v1";
    readonly actualEntryPolicy: "accepted_observed_entries_v1";
    readonly simulatedEntryPolicy:
      "preserve_exclude_or_governed_resize_observed_entries_v1";
    readonly positionSizingPolicy:
      "preserve_or_floor_half_whole_share_size_v1";
    readonly chargesPolicy:
      "preserve_or_complete_component_authorized_resize_v1";
    readonly slippageLiquidityPolicy: "unsupported_no_alternative_fills_v1";
    readonly sessionResetPolicy:
      "owner_account_currency_session_reset_with_instrument_scoped_rules_v1";
    readonly timestampTiePolicy:
      "strictly_completed_before_entry_fail_closed_material_ties_v1";
    readonly missingDataPolicy: "fail_closed_or_classify_unavailable_v1";
    readonly limitationsPolicy: "historical_in_sample_not_future_edge_v1";
    readonly stateDependencyPolicy:
      typeof RULE_STATE_DEPENDENCY_POLICY_VERSION;
  }>;
  readonly limits: Readonly<{
    readonly sourceRowLimit: string;
    readonly affectedTradeLimit: string;
    readonly sessionSummaryLimit: string;
    readonly evidenceTradeLimit: string;
    readonly diagnosticLimit: string;
  }>;
  readonly planDigest: CanonicalContentDigest;
}

export type CounterfactualSimulationPlanInput = Omit<
  CounterfactualSimulationPlan,
  "sourceQueryPlan" | "rules" | "stateDependencies" | "planDigest"
> & {
  readonly sourceQueryPlan: unknown;
  readonly rules: readonly unknown[];
};

export const COUNTERFACTUAL_SIMULATION_POLICIES =
  Object.freeze<CounterfactualSimulationPlan["policies"]>({
    chronologicalOrder:
      "entry_at_then_exit_at_then_semantic_round_trip_key_v1",
    actualEntryPolicy: "accepted_observed_entries_v1",
    simulatedEntryPolicy:
      "preserve_exclude_or_governed_resize_observed_entries_v1",
    positionSizingPolicy:
      "preserve_or_floor_half_whole_share_size_v1",
    chargesPolicy:
      "preserve_or_complete_component_authorized_resize_v1",
    slippageLiquidityPolicy: "unsupported_no_alternative_fills_v1",
    sessionResetPolicy:
      "owner_account_currency_session_reset_with_instrument_scoped_rules_v1",
    timestampTiePolicy:
      "strictly_completed_before_entry_fail_closed_material_ties_v1",
    missingDataPolicy: "fail_closed_or_classify_unavailable_v1",
    limitationsPolicy: "historical_in_sample_not_future_edge_v1",
    stateDependencyPolicy: RULE_STATE_DEPENDENCY_POLICY_VERSION,
  });

function invalid(path: string): ExactResult<never, AnalyticalContractFailure> {
  return contractFailure("ti_v3_analytics_contract_invalid", path);
}

function validateBoundedPositiveCount(
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

function normalizeRule(
  input: unknown,
  path: string,
): ExactResult<CounterfactualRule, AnalyticalContractFailure> {
  const common = validateContractRecord(
    input,
    ["ruleId", "kind", "precedence", "action"],
    [
      "consecutiveLossThreshold",
      "flatTradePolicy",
      "maximumTrades",
      "countPolicy",
      "allowedDirection",
      "maximumDailyDrawdown",
      "thresholdPolicy",
      "maximumProfitGiveback",
      "cooldownSeconds",
      "triggerOutcome",
      "expiryPolicy",
      "maximumAttempts",
      "losingAttemptThreshold",
      "gainFlatPolicy",
      "cutoffTime",
      "timeBasis",
      "boundaryPolicy",
      "overnightSessionPolicy",
      "lowerEntryPrice",
      "upperEntryPrice",
      "rangeMode",
      "consumptionPolicy",
      "nonMatchingOutcomePolicy",
      "reductionMultiplier",
      "triggerPolicy",
      "sizingPolicy",
      "feePolicy",
    ],
    path,
  );
  if (!common.ok) return common;
  const ruleId = validateContractKey(common.value.ruleId, `${path}.ruleId`, 96);
  const precedence = validateBoundedPositiveCount(
    common.value.precedence,
    `${path}.precedence`,
    COUNTERFACTUAL_SIMULATION_LIMITS.maximumRules,
  );
  if (!ruleId.ok) return ruleId;
  if (!precedence.ok) return precedence;

  if (common.value.kind === "stop_after_consecutive_losses") {
    const record = validateContractRecord(input, [
      "ruleId", "kind", "precedence", "action",
      "consecutiveLossThreshold", "flatTradePolicy",
    ], [], path);
    if (!record.ok) return record;
    const threshold = validateBoundedPositiveCount(
      record.value.consecutiveLossThreshold,
      `${path}.consecutiveLossThreshold`,
      16,
    );
    if (!threshold.ok) return threshold;
    if (
      record.value.action !== "stop_session" ||
      record.value.flatTradePolicy !== "flat_resets_loss_streak_v1"
    ) return invalid(path);
    return {
      ok: true,
      value: Object.freeze({
        ruleId: ruleId.value,
        kind: "stop_after_consecutive_losses",
        precedence: precedence.value,
        action: "stop_session",
        consecutiveLossThreshold: threshold.value,
        flatTradePolicy: "flat_resets_loss_streak_v1",
      }),
    };
  }
  if (common.value.kind === "maximum_trades_per_day") {
    const record = validateContractRecord(input, [
      "ruleId", "kind", "precedence", "action",
      "maximumTrades", "countPolicy",
    ], [], path);
    if (!record.ok) return record;
    const maximumTrades = validateBoundedPositiveCount(
      record.value.maximumTrades,
      `${path}.maximumTrades`,
      1_000,
    );
    if (!maximumTrades.ok) return maximumTrades;
    if (
      record.value.action !== "exclude_trade" ||
      record.value.countPolicy !== "executed_simulated_entries_only_v1"
    ) return invalid(path);
    return {
      ok: true,
      value: Object.freeze({
        ruleId: ruleId.value,
        kind: "maximum_trades_per_day",
        precedence: precedence.value,
        action: "exclude_trade",
        maximumTrades: maximumTrades.value,
        countPolicy: "executed_simulated_entries_only_v1",
      }),
    };
  }
  if (common.value.kind === "direction_only") {
    const record = validateContractRecord(input, [
      "ruleId", "kind", "precedence", "action", "allowedDirection",
    ], [], path);
    if (!record.ok) return record;
    if (
      record.value.action !== "exclude_trade" ||
      (record.value.allowedDirection !== "long" &&
        record.value.allowedDirection !== "short")
    ) return invalid(path);
    return {
      ok: true,
      value: Object.freeze({
        ruleId: ruleId.value,
        kind: "direction_only",
        precedence: precedence.value,
        action: "exclude_trade",
        allowedDirection: record.value.allowedDirection,
      }),
    };
  }
  if (common.value.kind === "stop_after_daily_dollar_drawdown") {
    const record = validateContractRecord(input, [
      "ruleId", "kind", "precedence", "action", "maximumDailyDrawdown",
      "thresholdPolicy",
    ], [], path);
    if (!record.ok) return record;
    const threshold = validateExactDecimal(record.value.maximumDailyDrawdown);
    const zero = validateExactDecimal("0");
    if (
      !threshold.ok ||
      !zero.ok ||
      compareExactDecimals(threshold.value, zero.value) <= 0 ||
      record.value.action !== "stop_session" ||
      record.value.thresholdPolicy !==
        "realized_net_pnl_at_or_below_negative_threshold_v1"
    ) return invalid(path);
    return {
      ok: true,
      value: Object.freeze({
        ruleId: ruleId.value,
        kind: "stop_after_daily_dollar_drawdown",
        precedence: precedence.value,
        action: "stop_session",
        maximumDailyDrawdown: threshold.value,
        thresholdPolicy:
          "realized_net_pnl_at_or_below_negative_threshold_v1",
      }),
    };
  }
  if (common.value.kind === "stop_after_profit_giveback") {
    const record = validateContractRecord(input, [
      "ruleId", "kind", "precedence", "action", "maximumProfitGiveback",
      "thresholdPolicy",
    ], [], path);
    if (!record.ok) return record;
    const threshold = validateExactDecimal(record.value.maximumProfitGiveback);
    const zero = validateExactDecimal("0");
    if (
      !threshold.ok ||
      !zero.ok ||
      compareExactDecimals(threshold.value, zero.value) <= 0 ||
      record.value.action !== "stop_session" ||
      record.value.thresholdPolicy !==
        "positive_peak_realized_pnl_giveback_at_or_above_threshold_v1"
    ) return invalid(path);
    return {
      ok: true,
      value: Object.freeze({
        ruleId: ruleId.value,
        kind: "stop_after_profit_giveback",
        precedence: precedence.value,
        action: "stop_session",
        maximumProfitGiveback: threshold.value,
        thresholdPolicy:
          "positive_peak_realized_pnl_giveback_at_or_above_threshold_v1",
      }),
    };
  }
  if (common.value.kind === "wait_after_loss") {
    const record = validateContractRecord(input, [
      "ruleId", "kind", "precedence", "action", "cooldownSeconds",
      "triggerOutcome", "expiryPolicy",
    ], [], path);
    if (!record.ok) return record;
    const cooldown = validateBoundedPositiveCount(
      record.value.cooldownSeconds,
      `${path}.cooldownSeconds`,
      86_400,
    );
    if (
      !cooldown.ok ||
      record.value.action !== "cooldown" ||
      record.value.triggerOutcome !== "loss" ||
      record.value.expiryPolicy !==
        "entry_at_or_after_expiry_is_eligible_v1"
    ) return cooldown.ok ? invalid(path) : cooldown;
    return {
      ok: true,
      value: Object.freeze({
        ruleId: ruleId.value,
        kind: "wait_after_loss",
        precedence: precedence.value,
        action: "cooldown",
        cooldownSeconds: cooldown.value,
        triggerOutcome: "loss",
        expiryPolicy: "entry_at_or_after_expiry_is_eligible_v1",
      }),
    };
  }
  if (common.value.kind === "maximum_attempts_per_ticker") {
    const record = validateContractRecord(input, [
      "ruleId", "kind", "precedence", "action", "maximumAttempts",
      "countPolicy",
    ], [], path);
    if (!record.ok) return record;
    const maximum = validateBoundedPositiveCount(
      record.value.maximumAttempts,
      `${path}.maximumAttempts`,
      1_000,
    );
    if (
      !maximum.ok ||
      record.value.action !== "exclude_trade" ||
      record.value.countPolicy !==
        "retained_simulated_entries_per_stable_instrument_v1"
    ) return maximum.ok ? invalid(path) : maximum;
    return {
      ok: true,
      value: Object.freeze({
        ruleId: ruleId.value,
        kind: "maximum_attempts_per_ticker",
        precedence: precedence.value,
        action: "exclude_trade",
        maximumAttempts: maximum.value,
        countPolicy:
          "retained_simulated_entries_per_stable_instrument_v1",
      }),
    };
  }
  if (common.value.kind === "stop_after_losing_ticker_attempts") {
    const record = validateContractRecord(input, [
      "ruleId", "kind", "precedence", "action", "losingAttemptThreshold",
      "gainFlatPolicy",
    ], [], path);
    if (!record.ok) return record;
    const threshold = validateBoundedPositiveCount(
      record.value.losingAttemptThreshold,
      `${path}.losingAttemptThreshold`,
      16,
    );
    if (
      !threshold.ok ||
      record.value.action !== "stop_ticker" ||
      record.value.gainFlatPolicy !== "gain_and_flat_do_not_reset_v1"
    ) return threshold.ok ? invalid(path) : threshold;
    return {
      ok: true,
      value: Object.freeze({
        ruleId: ruleId.value,
        kind: "stop_after_losing_ticker_attempts",
        precedence: precedence.value,
        action: "stop_ticker",
        losingAttemptThreshold: threshold.value,
        gainFlatPolicy: "gain_and_flat_do_not_reset_v1",
      }),
    };
  }
  if (common.value.kind === "no_new_trades_after_time") {
    const record = validateContractRecord(input, [
      "ruleId", "kind", "precedence", "action", "cutoffTime",
      "timeBasis", "boundaryPolicy", "overnightSessionPolicy",
    ], [], path);
    if (!record.ok) return record;
    if (
      typeof record.value.cutoffTime !== "string" ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(
        record.value.cutoffTime,
      ) ||
      record.value.action !== "exclude_trade" ||
      record.value.timeBasis !== "accepted_iana_timezone_wall_clock_v1" ||
      record.value.boundaryPolicy !==
        "candidate_entry_at_or_after_cutoff_is_excluded_v1" ||
      record.value.overnightSessionPolicy !==
        "reject_unsupported_overnight_session_v1"
    ) return invalid(path);
    return {
      ok: true,
      value: Object.freeze({
        ruleId: ruleId.value,
        kind: "no_new_trades_after_time",
        precedence: precedence.value,
        action: "exclude_trade",
        cutoffTime: record.value.cutoffTime,
        timeBasis: "accepted_iana_timezone_wall_clock_v1",
        boundaryPolicy:
          "candidate_entry_at_or_after_cutoff_is_excluded_v1",
        overnightSessionPolicy:
          "reject_unsupported_overnight_session_v1",
      }),
    };
  }
  if (common.value.kind === "exclude_entry_price_range") {
    const record = validateContractRecord(input, [
      "ruleId", "kind", "precedence", "action", "lowerEntryPrice",
      "upperEntryPrice", "rangeMode", "boundaryPolicy",
    ], [], path);
    if (!record.ok) return record;
    const lower = validateExactDecimal(record.value.lowerEntryPrice);
    const upper = validateExactDecimal(record.value.upperEntryPrice);
    const zero = validateExactDecimal("0");
    if (
      !lower.ok ||
      !upper.ok ||
      !zero.ok ||
      compareExactDecimals(lower.value, zero.value) <= 0 ||
      compareExactDecimals(lower.value, upper.value) >= 0 ||
      record.value.action !== "exclude_trade" ||
      record.value.rangeMode !== "exclude_inside_v1" ||
      record.value.boundaryPolicy !== "inclusive_lower_and_upper_v1"
    ) return invalid(path);
    return {
      ok: true,
      value: Object.freeze({
        ruleId: ruleId.value,
        kind: "exclude_entry_price_range",
        precedence: precedence.value,
        action: "exclude_trade",
        lowerEntryPrice: lower.value,
        upperEntryPrice: upper.value,
        rangeMode: "exclude_inside_v1",
        boundaryPolicy: "inclusive_lower_and_upper_v1",
      }),
    };
  }
  if (common.value.kind === "after_outcome_exclusion") {
    const record = validateContractRecord(input, [
      "ruleId", "kind", "precedence", "action", "triggerOutcome",
      "consumptionPolicy", "nonMatchingOutcomePolicy",
    ], [], path);
    if (!record.ok) return record;
    if (
      record.value.action !== "exclude_next_eligible_trade" ||
      !["loss", "gain", "flat"].includes(String(record.value.triggerOutcome)) ||
      record.value.consumptionPolicy !==
        "consume_one_next_rule_eligible_trade_v1" ||
      record.value.nonMatchingOutcomePolicy !==
        "pending_exclusion_remains_until_consumed_v1"
    ) return invalid(path);
    return {
      ok: true,
      value: Object.freeze({
        ruleId: ruleId.value,
        kind: "after_outcome_exclusion",
        precedence: precedence.value,
        action: "exclude_next_eligible_trade",
        triggerOutcome: record.value.triggerOutcome as
          | "loss"
          | "gain"
          | "flat",
        consumptionPolicy: "consume_one_next_rule_eligible_trade_v1",
        nonMatchingOutcomePolicy:
          "pending_exclusion_remains_until_consumed_v1",
      }),
    };
  }
  if (common.value.kind === "reduce_size_after_loss") {
    const record = validateContractRecord(input, [
      "ruleId", "kind", "precedence", "action", "reductionMultiplier",
      "triggerPolicy", "consumptionPolicy", "sizingPolicy", "feePolicy",
    ], [], path);
    if (!record.ok) return record;
    if (record.value.action !== "resize_next_eligible_trade" ||
      record.value.reductionMultiplier !== "0.5" ||
      record.value.triggerPolicy !== "completed_retained_exact_net_loss_v1" ||
      record.value.consumptionPolicy !== "consume_one_next_rule_eligible_trade_v1" ||
      record.value.sizingPolicy !== "floor_to_whole_share_minimum_one_v1" ||
      record.value.feePolicy !== "complete_declared_components_only_v1") return invalid(path);
    return { ok: true, value: Object.freeze({
      ruleId: ruleId.value, kind: "reduce_size_after_loss", precedence: precedence.value,
      action: "resize_next_eligible_trade", reductionMultiplier: "0.5",
      triggerPolicy: "completed_retained_exact_net_loss_v1",
      consumptionPolicy: "consume_one_next_rule_eligible_trade_v1",
      sizingPolicy: "floor_to_whole_share_minimum_one_v1",
      feePolicy: "complete_declared_components_only_v1",
    }) };
  }
  return invalid(`${path}.kind`);
}

function normalize(
  input: unknown,
  authority: TradeQueryAuthority,
  persisted: boolean,
): ExactResult<CounterfactualSimulationPlan, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion", "semanticVersion", "planOrigin", "sourceQueryPlan", "rules",
    ...(persisted ? ["stateDependencies"] : []),
    "policies", "limits",
    ...(persisted ? ["planDigest"] : []),
  ]);
  if (!record.ok) return record;
  if (
    record.value.schemaVersion !== COUNTERFACTUAL_SIMULATION_PLAN_VERSION ||
    record.value.semanticVersion !== COUNTERFACTUAL_SIMULATION_SEMANTIC_VERSION
  ) return invalid("$.schemaVersion");
  const planOrigin = record.value.planOrigin;
  if (planOrigin !== "generic_plan" && planOrigin !== "governed_preset") {
    return invalid("$.planOrigin");
  }
  const sourceQueryPlan = persisted
    ? verifyTradeQueryPlan(record.value.sourceQueryPlan, authority)
    : buildTradeQueryPlan(record.value.sourceQueryPlan, authority);
  if (!sourceQueryPlan.ok) return sourceQueryPlan;
  if (!Array.isArray(record.value.rules)) return invalid("$.rules");
  if (
    record.value.rules.length < 1 ||
    record.value.rules.length >
      COUNTERFACTUAL_SIMULATION_LIMITS.maximumRules
  ) return contractFailure("ti_v3_analytics_contract_oversized", "$.rules");
  const rules: CounterfactualRule[] = [];
  for (let index = 0; index < record.value.rules.length; index += 1) {
    const rule = normalizeRule(record.value.rules[index], `$.rules[${index}]`);
    if (!rule.ok) return rule;
    rules.push(rule.value);
  }
  if (
    new Set(rules.map((rule) => rule.ruleId)).size !== rules.length ||
    new Set(rules.map((rule) => rule.precedence)).size !== rules.length
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_duplicate_identity",
      "$.rules",
    );
  }
  const directionRules = rules.filter(
    (rule): rule is Extract<CounterfactualRule, { kind: "direction_only" }> =>
      rule.kind === "direction_only",
  );
  if (
    directionRules.length > 1 &&
    new Set(directionRules.map((rule) => rule.allowedDirection)).size > 1
  ) return invalid("$.rules");
  const singularRuleKinds = new Set<CounterfactualRule["kind"]>([
    "stop_after_consecutive_losses",
    "stop_after_daily_dollar_drawdown",
    "stop_after_profit_giveback",
    "wait_after_loss",
    "stop_after_losing_ticker_attempts",
    "no_new_trades_after_time",
    "exclude_entry_price_range",
    "reduce_size_after_loss",
  ]);
  for (const kind of singularRuleKinds) {
    if (rules.filter((rule) => rule.kind === kind).length > 1) {
      return invalid("$.rules");
    }
  }

  const policies = validateContractRecord(record.value.policies, [
    "chronologicalOrder", "actualEntryPolicy", "simulatedEntryPolicy",
    "positionSizingPolicy", "chargesPolicy", "slippageLiquidityPolicy",
    "sessionResetPolicy", "timestampTiePolicy", "missingDataPolicy",
    "limitationsPolicy",
    "stateDependencyPolicy",
  ], [], "$.policies");
  if (!policies.ok) return policies;
  for (const [key, value] of Object.entries(COUNTERFACTUAL_SIMULATION_POLICIES)) {
    if (policies.value[key] !== value) return invalid(`$.policies.${key}`);
  }
  const limits = validateContractRecord(record.value.limits, [
    "sourceRowLimit", "affectedTradeLimit", "sessionSummaryLimit",
    "evidenceTradeLimit", "diagnosticLimit",
  ], [], "$.limits");
  if (!limits.ok) return limits;
  const normalizedLimits = {
    sourceRowLimit: validateBoundedPositiveCount(
      limits.value.sourceRowLimit, "$.limits.sourceRowLimit",
      COUNTERFACTUAL_SIMULATION_LIMITS.maximumSourceRows,
    ),
    affectedTradeLimit: validateBoundedPositiveCount(
      limits.value.affectedTradeLimit, "$.limits.affectedTradeLimit",
      COUNTERFACTUAL_SIMULATION_LIMITS.maximumAffectedTrades,
    ),
    sessionSummaryLimit: validateBoundedPositiveCount(
      limits.value.sessionSummaryLimit, "$.limits.sessionSummaryLimit",
      COUNTERFACTUAL_SIMULATION_LIMITS.maximumSessionSummaries,
    ),
    evidenceTradeLimit: validateBoundedPositiveCount(
      limits.value.evidenceTradeLimit, "$.limits.evidenceTradeLimit",
      COUNTERFACTUAL_SIMULATION_LIMITS.maximumEvidenceTrades,
    ),
    diagnosticLimit: validateBoundedPositiveCount(
      limits.value.diagnosticLimit, "$.limits.diagnosticLimit",
      COUNTERFACTUAL_SIMULATION_LIMITS.maximumDiagnostics,
    ),
  };
  if (!normalizedLimits.sourceRowLimit.ok) {
    return normalizedLimits.sourceRowLimit;
  }
  if (!normalizedLimits.affectedTradeLimit.ok) {
    return normalizedLimits.affectedTradeLimit;
  }
  if (!normalizedLimits.sessionSummaryLimit.ok) {
    return normalizedLimits.sessionSummaryLimit;
  }
  if (!normalizedLimits.evidenceTradeLimit.ok) {
    return normalizedLimits.evidenceTradeLimit;
  }
  if (!normalizedLimits.diagnosticLimit.ok) {
    return normalizedLimits.diagnosticLimit;
  }
  if (
    BigInt(normalizedLimits.affectedTradeLimit.value) <
    BigInt(normalizedLimits.sourceRowLimit.value)
  ) return invalid("$.limits.affectedTradeLimit");
  const stateDependencies = resolveCounterfactualRuleStateDependencies(rules);
  if (persisted) {
    const suppliedDependencies = validateContractRecord(
      record.value.stateDependencies,
      [
        "policyVersion", "executedEntryCount", "completedRealizedOutcome",
        "completedLossStreak", "realizedDailyPnl", "peakRealizedDailyPnl",
        "priorCompletionTimestamp", "tickerAttemptState",
        "tickerLosingAttemptState", "tickerStopState", "entryTimeCutoff",
        "entryPriceAuthority", "cooldownUntilState", "priorCompletedOutcome",
        "afterOutcomeExclusionState", "sizeAuthority", "sessionStopState",
        "pendingResizeAfterLossState", "feeAuthority",
      ],
      [],
      "$.stateDependencies",
    );
    if (!suppliedDependencies.ok) return suppliedDependencies;
    for (const [key, value] of Object.entries(stateDependencies)) {
      if (suppliedDependencies.value[key] !== value) {
        return contractFailure(
          "ti_v3_analytics_contract_reference_mismatch",
          `$.stateDependencies.${key}`,
        );
      }
    }
  }
  const addressed = finalizeContentAddressedAuthority(
    "counterfactual_simulation_plan",
    {
      schemaVersion: COUNTERFACTUAL_SIMULATION_PLAN_VERSION,
      semanticVersion: COUNTERFACTUAL_SIMULATION_SEMANTIC_VERSION,
      planOrigin,
      sourceQueryPlan: sourceQueryPlan.value,
      rules: Object.freeze([...rules].sort((left, right) =>
        BigInt(left.precedence) < BigInt(right.precedence) ? -1 : 1)),
      stateDependencies,
      policies: COUNTERFACTUAL_SIMULATION_POLICIES,
      limits: Object.freeze({
        sourceRowLimit: normalizedLimits.sourceRowLimit.value,
        affectedTradeLimit: normalizedLimits.affectedTradeLimit.value,
        sessionSummaryLimit: normalizedLimits.sessionSummaryLimit.value,
        evidenceTradeLimit: normalizedLimits.evidenceTradeLimit.value,
        diagnosticLimit: normalizedLimits.diagnosticLimit.value,
      }),
    },
    "planDigest",
  );
  if (!addressed.ok) return addressed;
  if (
    persisted &&
    (typeof record.value.planDigest !== "string" ||
      record.value.planDigest !== addressed.value.planDigest)
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_digest_mismatch",
      "$.planDigest",
    );
  }
  return { ok: true, value: addressed.value as CounterfactualSimulationPlan };
}

export function buildCounterfactualSimulationPlan(
  input: unknown,
  authority: TradeQueryAuthority,
): ExactResult<CounterfactualSimulationPlan, AnalyticalContractFailure> {
  return normalize(input, authority, false);
}

export function verifyCounterfactualSimulationPlan(
  input: unknown,
  authority: TradeQueryAuthority,
): ExactResult<CounterfactualSimulationPlan, AnalyticalContractFailure> {
  return normalize(input, authority, true);
}
