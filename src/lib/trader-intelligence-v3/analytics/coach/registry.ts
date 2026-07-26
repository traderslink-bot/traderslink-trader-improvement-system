import type { TradeQueryGrouping, TradeQueryMetricKey } from "../query/contracts";
import type {
  CoachCapabilityKey,
  CoachComparisonType,
  CoachFindingCode,
  CoachIntentKey,
} from "./contracts";

export interface CoachCapabilityDefinition {
  readonly capabilityKey: CoachCapabilityKey;
  readonly execution: "direct_query" | "ga1_b_preset" | "unsupported";
  readonly dimensions: readonly string[];
  readonly metrics: readonly TradeQueryMetricKey[];
  readonly comparisonType: CoachComparisonType;
  readonly minimumSample: string;
  readonly grouping: TradeQueryGrouping | null;
  readonly presetKey: string | null;
  readonly unsupportedData: readonly string[];
  readonly findingCode: CoachFindingCode;
  readonly findingMetricKey: TradeQueryMetricKey;
  readonly findingSort: "ascending" | "descending";
  readonly ruleCandidateKey: string | null;
}

const CORE_METRICS = Object.freeze([
  "candidate_count", "included_count", "excluded_count", "gross_pnl", "net_pnl",
  "signed_charges", "average_pnl", "median_pnl", "win_count", "loss_count",
  "flat_count", "win_rate", "loss_rate", "flat_rate", "average_winning_trade",
  "average_losing_trade", "profit_factor", "expectancy", "trading_day_count",
  "profitable_trading_day_count", "losing_trading_day_count", "profitable_day_percentage",
  "losing_day_percentage", "average_daily_pnl",
  "median_daily_pnl", "average_trades_per_trading_day",
  "median_trades_per_trading_day", "maximum_trades_per_trading_day",
  "longest_winning_trade_streak", "longest_losing_trade_streak",
  "average_holding_time", "median_holding_time", "average_position_size",
  "median_position_size", "maximum_intraday_drawdown",
  "maximum_peak_profit_giveback", "repeat_attempt_trade_count",
] as const satisfies readonly TradeQueryMetricKey[]);

function direct(
  capabilityKey: CoachCapabilityKey,
  grouping: TradeQueryGrouping,
  dimensions: readonly string[],
  findingCode: CoachFindingCode,
  comparisonType: CoachComparisonType = "group_vs_baseline",
  ruleCandidateKey: string | null = null,
  findingMetricKey: TradeQueryMetricKey = "net_pnl",
  findingSort: "ascending" | "descending" = "ascending",
): CoachCapabilityDefinition {
  return Object.freeze({
    capabilityKey,
    execution: "direct_query",
    dimensions: Object.freeze(dimensions),
    metrics: CORE_METRICS,
    comparisonType,
    minimumSample: "3",
    grouping,
    presetKey: null,
    unsupportedData: Object.freeze([]),
    findingCode,
    findingMetricKey,
    findingSort,
    ruleCandidateKey,
  });
}

function preset(
  capabilityKey: CoachCapabilityKey,
  presetKey: string,
  dimensions: readonly string[],
  findingCode: CoachFindingCode,
  comparisonType: CoachComparisonType = "group_vs_baseline",
  ruleCandidateKey: string | null = null,
  findingMetricKey: TradeQueryMetricKey = "net_pnl",
  findingSort: "ascending" | "descending" = "ascending",
): CoachCapabilityDefinition {
  return Object.freeze({
    capabilityKey,
    execution: "ga1_b_preset",
    dimensions: Object.freeze(dimensions),
    metrics: CORE_METRICS,
    comparisonType,
    minimumSample: "3",
    grouping: null,
    presetKey,
    unsupportedData: Object.freeze([]),
    findingCode,
    findingMetricKey,
    findingSort,
    ruleCandidateKey,
  });
}

function unsupported(
  capabilityKey: CoachCapabilityKey,
  requiredData: readonly string[],
): CoachCapabilityDefinition {
  return Object.freeze({
    capabilityKey,
    execution: "unsupported",
    dimensions: Object.freeze([]),
    metrics: Object.freeze([]),
    comparisonType: "none",
    minimumSample: "0",
    grouping: null,
    presetKey: null,
    unsupportedData: Object.freeze(requiredData),
    findingCode: "unsupported_data",
    findingMetricKey: "net_pnl",
    findingSort: "ascending",
    ruleCandidateKey: null,
  });
}

export const COACH_CAPABILITY_REGISTRY = Object.freeze([
  direct("core_performance_summary", { kind: "aggregate" }, ["date"], "biggest_positive_strength", "gross_vs_net"),
  direct("daily_performance", { kind: "day" }, ["date"], "biggest_negative_leak"),
  direct("weekly_performance", { kind: "week" }, ["week"], "biggest_negative_leak", "current_period_vs_prior_period"),
  direct("monthly_performance", { kind: "month" }, ["month"], "biggest_negative_leak", "current_period_vs_prior_period"),
  direct("session_performance", { kind: "session" }, ["session"], "worst_time_window"),
  preset("time_window_performance", "analyze_time_of_day", ["time_window"], "worst_time_window"),
  preset("price_range_performance", "analyze_performance_by_price_range", ["price_bucket"], "weak_price_range", "best_vs_worst_group", "exclude_price_range"),
  direct("ticker_performance", { kind: "symbol" }, ["ticker"], "weak_ticker", "best_vs_worst_group"),
  preset("trade_sequence_performance", "analyze_trade_sequence_performance", ["trade_sequence_number"], "late_trade_weakness", "first_n_vs_later", "skip_fourth_and_later_trades"),
  preset("prior_outcome_performance", "analyze_after_loss_behavior", ["prior_trade_outcome"], "after_loss_weakness", "after_loss_vs_not_after_loss", "wait_after_loss"),
  preset("after_win_performance", "analyze_after_win_behavior", ["prior_trade_outcome"], "after_win_weakness", "group_vs_baseline"),
  unsupported("after_two_losses_performance", ["consecutive_loss_streak_filter_required"]),
  unsupported("after_three_losses_performance", ["consecutive_loss_streak_filter_required"]),
  unsupported("trades_after_daily_green", ["pre_entry_daily_realized_state_filter_required"]),
  unsupported("trades_after_daily_red", ["pre_entry_daily_realized_state_filter_required"]),
  preset("first_vs_later_trade_performance", "analyze_trade_sequence_performance", ["trade_sequence_number"], "late_trade_weakness", "first_n_vs_later"),
  preset("fourth_and_later_trade_performance", "analyze_trade_sequence_performance", ["trade_sequence_number"], "late_trade_weakness", "first_n_vs_later", "skip_fourth_and_later_trades"),
  preset("repeat_ticker_attempts", "analyze_ticker_repeat_attempts", ["ticker", "repeat_ticker_attempt"], "repeat_ticker_weakness", "repeat_ticker_vs_first_attempt", "skip_repeat_attempts"),
  preset("hold_time_performance", "analyze_holding_time", ["hold_time_bucket"], "weak_hold_time"),
  preset("direction_performance", "analyze_long_vs_short", ["direction"], "biggest_negative_leak"),
  preset("position_size_performance", "analyze_position_size_performance", ["position_size_bucket"], "large_size_weakness", "best_vs_worst_group", "reduce_size_after_loss"),
  direct("profit_giveback_analysis", { kind: "day" }, ["date"], "giveback_detected", "green_day_vs_red_day", "stop_after_profit_giveback", "maximum_peak_profit_giveback", "descending"),
  direct("intraday_drawdown_analysis", { kind: "day" }, ["date"], "intraday_drawdown_detected", "group_vs_baseline", null, "maximum_intraday_drawdown"),
  direct("day_outcome_consistency", { kind: "aggregate" }, ["trading_day"], "day_outcome_consistency", "green_day_vs_red_day", null, "profitable_day_percentage", "descending"),
  unsupported("losers_held_too_long", ["exit_quality_or_alternative_outcome_authority_required"]),
  unsupported("winners_cut_too_early", ["exit_quality_or_alternative_outcome_authority_required"]),
  direct("overtrading_analysis", { kind: "trade_sequence_bucket" }, ["trade_sequence_number"], "overtrading_detected", "first_n_vs_later", "maximum_trades_per_day"),
  direct("rule_candidate_ranking", { kind: "trade_sequence_bucket" }, ["trade_sequence_number", "prior_trade_outcome"], "best_rule_candidate", "first_n_vs_later", "stop_after_consecutive_losses"),
  unsupported("setup_tag_performance", ["setup_tags_required"]),
  unsupported("mistake_tag_performance", ["mistake_tags_required"]),
  preset("habit_trend_analysis", "compare_periods", ["current_period", "prior_period"], "period_trend", "current_period_vs_prior_period"),
] as const satisfies readonly CoachCapabilityDefinition[]);

export const COACH_SUMMARY_CAPABILITY_KEYS = Object.freeze([
  "time_window_performance",
  "session_performance",
  "price_range_performance",
  "position_size_performance",
  "hold_time_performance",
  "profit_giveback_analysis",
  "intraday_drawdown_analysis",
  "day_outcome_consistency",
  "prior_outcome_performance",
  "after_win_performance",
  "trade_sequence_performance",
  "repeat_ticker_attempts",
  "overtrading_analysis",
  "losers_held_too_long",
  "winners_cut_too_early",
  "setup_tag_performance",
  "mistake_tag_performance",
] as const satisfies readonly CoachCapabilityKey[]);

const CAPABILITIES = new Map(COACH_CAPABILITY_REGISTRY.map((item) => [item.capabilityKey, item]));

export function getCoachCapability(key: CoachCapabilityKey): CoachCapabilityDefinition {
  const capability = CAPABILITIES.get(key);
  if (capability === undefined) throw new Error(`unregistered coach capability: ${key}`);
  return capability;
}

export const COACH_INTENT_CAPABILITY_MAP: Readonly<Record<CoachIntentKey, readonly CoachCapabilityKey[]>> = Object.freeze({
  rank_negative_performance_drivers: ["time_window_performance", "session_performance", "price_range_performance", "position_size_performance", "hold_time_performance", "profit_giveback_analysis", "intraday_drawdown_analysis"],
  rank_positive_performance_drivers: ["time_window_performance", "session_performance", "price_range_performance", "position_size_performance", "hold_time_performance"],
  coach_summary_analysis: COACH_SUMMARY_CAPABILITY_KEYS,
  time_window_performance: ["time_window_performance"],
  session_performance: ["session_performance"],
  hold_time_performance: ["hold_time_performance"],
  intraday_drawdown_analysis: ["intraday_drawdown_analysis"],
  day_outcome_consistency: ["day_outcome_consistency"],
  losers_held_too_long: ["losers_held_too_long"],
  winners_cut_too_early: ["winners_cut_too_early"],
  prior_outcome_performance: ["prior_outcome_performance"],
  after_win_performance: ["after_win_performance"],
  after_two_losses_performance: ["after_two_losses_performance"],
  after_three_losses_performance: ["after_three_losses_performance"],
  trades_after_daily_green: ["trades_after_daily_green"],
  trades_after_daily_red: ["trades_after_daily_red"],
  first_vs_later_trade_performance: ["first_vs_later_trade_performance"],
  fourth_and_later_trade_performance: ["fourth_and_later_trade_performance"],
  overtrading_analysis: ["overtrading_analysis", "trade_sequence_performance"],
  behaviour_leak_ranking: ["prior_outcome_performance", "after_win_performance", "trade_sequence_performance", "repeat_ticker_attempts", "overtrading_analysis"],
  behaviour_rule_candidate_ranking: ["prior_outcome_performance", "overtrading_analysis", "profit_giveback_analysis", "repeat_ticker_attempts"],
  profit_giveback_analysis: ["profit_giveback_analysis"],
  price_range_performance: ["price_range_performance"],
  ticker_performance_ranking: ["ticker_performance", "repeat_ticker_attempts"],
  trade_sequence_performance: ["trade_sequence_performance"],
  position_size_performance: ["position_size_performance"],
  habit_trend_analysis: ["habit_trend_analysis"],
  rule_candidate_ranking: ["rule_candidate_ranking", "prior_outcome_performance", "profit_giveback_analysis", "repeat_ticker_attempts"],
  setup_tag_performance: ["setup_tag_performance"],
  mistake_tag_performance: ["mistake_tag_performance"],
});

export const COACH_INTENT_SYNONYMS: Readonly<Record<string, CoachIntentKey>> = Object.freeze({
  "what_is_hurting_me_most": "rank_negative_performance_drivers",
  "when_do_i_trade_worst": "time_window_performance",
  "which_session_hurts_me": "session_performance",
  "do_i_hold_losers_too_long": "losers_held_too_long",
  "do_i_cut_winners_too_early": "winners_cut_too_early",
  "do_i_hold_quick_scalps_or_longer": "hold_time_performance",
  "which_days_have_the_worst_giveback": "profit_giveback_analysis",
  "which_days_have_the_worst_drawdown": "intraday_drawdown_analysis",
  "how_consistent_are_my_green_and_red_days": "day_outcome_consistency",
  "do_i_trade_worse_after_losses": "prior_outcome_performance",
  "do_i_trade_worse_after_wins": "after_win_performance",
  "what_happens_after_two_losses": "after_two_losses_performance",
  "what_happens_after_three_losses": "after_three_losses_performance",
  "do_i_trade_while_daily_green": "trades_after_daily_green",
  "do_i_trade_while_daily_red": "trades_after_daily_red",
  "are_my_first_trades_better_than_later_trades": "first_vs_later_trade_performance",
  "are_my_fourth_and_later_trades_worse": "fourth_and_later_trade_performance",
  "am_i_overtrading": "overtrading_analysis",
  "what_behaviour_leak_is_hurting_me_most": "behaviour_leak_ranking",
  "do_i_give_back_profits": "profit_giveback_analysis",
  "which_price_range_is_weakest": "price_range_performance",
  "which_tickers_hurt_me": "ticker_performance_ranking",
  "are_my_later_trades_worse": "trade_sequence_performance",
  "are_my_larger_trades_worse": "position_size_performance",
  "which_habits_are_improving": "habit_trend_analysis",
  "which_rules_should_i_test_next": "rule_candidate_ranking",
  "which_behaviour_based_rule_should_i_test_next": "behaviour_rule_candidate_ranking",
});
