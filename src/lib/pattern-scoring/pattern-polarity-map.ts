import { PATTERN_FAMILIES } from "../pattern-detection/types/pattern-detection-types";

export type ScoringPatternPolarity = "positive" | "negative" | "mixed";
export type ScoringPatternPolaritySource = "explicit_map" | "fallback_mixed";

function buildPolarityMap(
  polarity: ScoringPatternPolarity,
  patternIds: string[],
): Record<string, ScoringPatternPolarity> {
  return Object.fromEntries(patternIds.map((patternId) => [patternId, polarity]));
}

const ENTRY_QUALITY_POLARITY_MAP: Record<string, ScoringPatternPolarity> = {
  ...buildPolarityMap("positive", [
    "advantaged_entry_structure",
    "efficient_entry_structure",
    "constructive_pullback_entry_structure",
    "disciplined_favorable_extension_entry_structure",
    "breakout_entry_structure",
    "measured_favorable_extension_entry_structure",
    "reclaim_entry_structure",
    "mean_reversion_entry_structure",
    "opening_range_breakout_entry_structure",
    "opening_range_reclaim_entry_structure",
    "market_open_breakout_entry_structure",
    "market_open_reclaim_entry_structure",
    "breakout_with_room_above_structure",
    "breakout_with_room_above_and_constructive_final_exit",
    "recovery_with_breakout_with_room_above_and_constructive_final_exit",
    "entry_near_support_structure",
    "deep_constructive_pullback_entry_structure",
  ]),
  ...buildPolarityMap("negative", [
    "disadvantaged_entry_structure",
    "inefficient_entry_structure",
    "late_favorable_extension_entry_structure",
    "overextended_chase_entry_structure",
    "breakout_chase_entry_structure",
    "failed_breakout_entry_structure",
    "failed_reclaim_entry_structure",
    "failed_mean_reversion_entry_structure",
    "opening_range_breakout_chase_entry_structure",
    "failed_opening_range_breakout_entry_structure",
    "failed_opening_range_reclaim_entry_structure",
    "market_open_breakout_chase_entry_structure",
    "failed_market_open_breakout_entry_structure",
    "failed_market_open_reclaim_entry_structure",
    "breakout_into_overhead_resistance_structure",
    "breakout_with_room_above_and_failed_profit_protection",
    "breakout_into_overhead_resistance_with_defensive_final_exit",
    "breakout_into_overhead_resistance_with_failed_profit_protection",
    "recovery_with_breakout_with_room_above_and_failed_profit_protection",
    "recovery_with_breakout_into_overhead_resistance_and_defensive_final_exit",
    "recovery_with_breakout_into_overhead_resistance_and_failed_profit_protection",
    "entry_under_resistance_structure",
    "entry_far_from_support_structure",
    "weak_pullback_entry_structure",
    "deep_weak_pullback_entry_structure",
  ]),
};

const EXIT_QUALITY_POLARITY_MAP: Record<string, ScoringPatternPolarity> = {
  ...buildPolarityMap("positive", [
    "high_capture_exit_structure",
    "moderate_capture_exit_structure",
    "exit_with_limited_giveback",
    "exit_near_favorable_extreme",
    "exit_avoided_adverse_followthrough",
    "exit_into_support_before_breakdown",
    "exit_into_thin_support_before_breakdown",
    "stabilized_recovery_with_exit_into_thin_support_before_breakdown",
    "exit_into_resistance_with_reversal_after_exit",
    "stabilized_recovery_with_exit_into_resistance_and_reversal",
    "disciplined_defensive_exit",
    "stabilized_recovery_with_constructive_final_exit",
  ]),
  ...buildPolarityMap("negative", [
    "low_capture_exit_structure",
    "exit_with_meaningful_giveback",
    "peak_profit_giveback_structure",
    "partial_exit_with_adverse_followthrough",
    "missed_post_exit_continuation",
    "defensive_exit_after_deterioration",
    "premature_final_exit_after_constructive_management",
    "fearful_exit_after_weakening",
    "exit_into_support_with_relief_after_exit",
    "exit_into_stacked_support_with_relief_after_exit",
    "stabilized_recovery_with_exit_into_stacked_support_and_relief",
    "exit_into_resistance_before_breakout",
    "stabilized_recovery_with_exit_into_resistance_before_breakout",
    "stop_like_forced_exit_after_breakdown",
    "stop_like_forced_exit_before_rebound",
    "held_through_danger_with_stop_like_forced_exit_after_breakdown",
    "held_through_danger_with_stop_like_forced_exit_before_rebound",
    "delayed_risk_response_with_stop_like_forced_exit_after_breakdown",
    "delayed_risk_response_with_stop_like_forced_exit_before_rebound",
    "stabilized_recovery_with_premature_final_exit",
    "stabilized_recovery_with_stop_like_forced_exit_after_breakdown",
    "stabilized_recovery_with_stop_like_forced_exit_before_rebound",
  ]),
  ...buildPolarityMap("mixed", [
    "exit_into_support_structure",
  ]),
};

const SCALING_QUALITY_POLARITY_MAP: Record<string, ScoringPatternPolarity> = {
  ...buildPolarityMap("positive", [
    "structured_position_building",
    "balanced_position_management",
    "underutilized_winner_with_constructive_exit",
    "recovery_to_underutilized_winner_with_constructive_exit",
    "underutilized_winner_with_timely_profit_protection_and_constructive_final_exit",
    "recovery_to_underutilized_winner_with_timely_profit_protection_and_constructive_final_exit",
    "adding_above_prior_basis",
    "add_into_strength",
    "add_after_recent_run_up",
    "balanced_scaling_with_profit_protection",
    "add_into_strength_with_constructive_final_exit",
    "recovery_with_add_into_strength_and_constructive_final_exit",
    "add_into_strength_with_timely_profit_protection_and_constructive_final_exit",
    "recovery_with_add_into_strength_and_timely_profit_protection_and_constructive_final_exit",
    "constructive_readd_after_reduction",
    "balanced_management_with_constructive_exit",
    "recovery_with_balanced_management_and_constructive_final_exit",
    "timely_profit_protection_with_constructive_final_exit",
    "timely_risk_response_with_defensive_final_exit_after_deterioration",
    "trim_into_strength_with_constructive_final_exit",
    "recovery_with_trim_into_strength_and_constructive_final_exit",
    "timely_trim_into_strength_with_constructive_final_exit",
    "recovery_with_timely_trim_into_strength_and_constructive_final_exit",
    "recovery_with_timely_profit_protection_and_constructive_final_exit",
    "recovery_with_timely_risk_response_and_defensive_final_exit_after_deterioration",
    "trim_readd_with_constructive_final_exit",
    "constructive_recovery_after_early_adversity",
    "recovery_after_early_adversity_with_stabilized_management",
    "repeated_trim_readd_with_constructive_management",
    "good_pullback_reentry_after_constructive_trim",
    "constructive_reentry_followthrough_after_trim",
    "constructive_reentry_with_constructive_final_exit",
    "recovery_with_constructive_final_exit_after_constructive_reentry",
    "repeated_trim_readd_with_constructive_reentry_followthrough",
    "repeated_balanced_management_with_constructive_final_exit",
    "repeated_constructive_reentry_with_constructive_final_exit",
    "repeated_rescue_attempts_with_balanced_management_and_constructive_final_exit",
    "repeated_rescue_attempts_with_constructive_final_exit_after_constructive_reentries",
    "repeated_trim_readd_with_constructive_final_exit",
    "add_above_resistance_structure",
    "add_above_resistance_with_constructive_final_exit",
    "recovery_with_add_above_resistance_and_constructive_final_exit",
    "repeated_adds_above_resistance_with_constructive_final_exit",
    "trim_into_resistance_with_constructive_final_exit",
    "balanced_management_with_take_profit_into_resistance_and_constructive_final_exit",
    "recovery_with_trim_into_resistance_and_constructive_final_exit",
    "recovery_with_balanced_management_and_take_profit_into_resistance_and_constructive_final_exit",
    "repeated_balanced_management_with_exit_into_stacked_support_and_relief",
    "repeated_balanced_management_with_trim_into_resistance_and_constructive_final_exit",
    "repeated_balanced_management_with_take_profit_into_resistance_and_constructive_final_exit",
    "repeated_rescue_attempts_with_balanced_management_and_exit_into_stacked_support_and_relief",
    "repeated_rescue_attempts_with_balanced_management_and_trim_into_resistance_and_constructive_final_exit",
    "repeated_rescue_attempts_with_balanced_management_and_take_profit_into_resistance_and_constructive_final_exit",
  ]),
  ...buildPolarityMap("negative", [
    "one_sided_aggressive_building",
    "underutilized_position_building",
    "underutilized_winner_with_premature_final_exit",
    "recovery_to_underutilized_winner_with_premature_final_exit",
    "underutilized_winner_with_missed_final_continuation",
    "recovery_to_underutilized_winner_with_missed_final_continuation",
    "add_into_weakness",
    "add_after_recent_drop",
    "add_into_strength_with_premature_final_exit",
    "recovery_with_add_into_strength_and_premature_final_exit",
    "add_into_strength_with_missed_final_continuation",
    "recovery_with_add_into_strength_and_missed_final_continuation",
    "balanced_management_with_premature_final_exit",
    "recovery_with_balanced_management_and_premature_final_exit",
    "balanced_management_with_missed_final_continuation",
    "recovery_with_balanced_management_and_missed_final_continuation",
    "balanced_management_with_fearful_final_exit",
    "recovery_with_balanced_management_and_fearful_final_exit",
    "balanced_management_with_defensive_final_exit_after_deterioration",
    "recovery_with_balanced_management_and_defensive_final_exit_after_deterioration",
    "balanced_management_with_stop_like_forced_exit_after_breakdown",
    "balanced_management_with_stop_like_forced_exit_before_rebound",
    "recovery_with_balanced_management_and_stop_like_forced_exit_after_breakdown",
    "recovery_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    "trim_into_strength_with_premature_final_exit",
    "timely_profit_protection_with_premature_final_exit",
    "timely_risk_response_with_stop_like_forced_exit_after_breakdown",
    "timely_risk_response_with_stop_like_forced_exit_before_rebound",
    "recovery_with_trim_into_strength_and_premature_final_exit",
    "recovery_with_timely_profit_protection_and_premature_final_exit",
    "recovery_with_timely_risk_response_and_stop_like_forced_exit_after_breakdown",
    "recovery_with_timely_risk_response_and_stop_like_forced_exit_before_rebound",
    "trim_readd_with_missed_final_continuation",
    "recovery_after_early_adversity_with_failed_protection",
    "repeated_trim_readd_with_unstable_management",
    "repeated_rescue_attempts_with_renewed_deterioration",
    "late_chase_reentry_after_constructive_trim",
    "constructive_reentry_with_premature_final_exit",
    "constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    "constructive_reentry_with_stop_like_forced_exit_before_rebound",
    "recovery_with_premature_final_exit_after_constructive_reentry",
    "recovery_with_stop_like_forced_exit_after_constructive_reentry",
    "recovery_with_stop_like_forced_exit_before_rebound_after_constructive_reentry",
    "deteriorating_reentry_after_trim",
    "repeated_trim_readd_with_deteriorating_reentry",
    "repeated_constructive_reentry_with_premature_final_exit",
    "repeated_balanced_management_with_premature_final_exit",
    "repeated_balanced_management_with_missed_final_continuation",
    "repeated_balanced_management_with_defensive_final_exit_after_deterioration",
    "repeated_rescue_attempts_with_balanced_management_and_defensive_final_exit_after_deterioration",
    "repeated_balanced_management_with_fearful_final_exit",
    "repeated_rescue_attempts_with_balanced_management_and_fearful_final_exit",
    "repeated_balanced_management_with_stop_like_forced_exit_after_breakdown",
    "repeated_balanced_management_with_stop_like_forced_exit_before_rebound",
    "repeated_constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    "repeated_constructive_reentry_with_stop_like_forced_exit_before_rebound",
    "repeated_deteriorating_reentry_with_defensive_final_exit",
    "repeated_rescue_attempts_with_premature_final_exit_after_constructive_reentries",
    "repeated_rescue_attempts_with_balanced_management_and_premature_final_exit",
    "repeated_rescue_attempts_with_balanced_management_and_missed_final_continuation",
    "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_after_breakdown",
    "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    "repeated_rescue_attempts_with_stop_like_forced_exit_after_constructive_reentries",
    "repeated_rescue_attempts_with_stop_like_forced_exit_before_rebound_after_constructive_reentries",
    "repeated_rescue_attempts_with_defensive_final_exit_after_deteriorating_reentries",
    "repeated_trim_readd_with_fearful_final_exit",
    "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    "repeated_rescue_attempts_with_defensive_final_exit_after_deterioration",
    "repeated_trim_readd_with_premature_final_exit",
    "repeated_trim_readd_with_missed_final_continuation",
    "aggressive_adding_with_failed_profit_protection",
    "revenge_adding_after_weakness",
    "revenge_adding_with_failed_profit_protection",
    "add_above_resistance_with_failed_profit_protection",
    "recovery_with_add_above_resistance_and_failed_profit_protection",
    "repeated_adds_above_resistance_with_failed_profit_protection",
    "trim_into_resistance_with_premature_final_exit",
    "balanced_management_with_take_profit_into_resistance_and_premature_final_exit",
    "recovery_with_trim_into_resistance_and_premature_final_exit",
    "recovery_with_balanced_management_and_take_profit_into_resistance_and_premature_final_exit",
    "repeated_balanced_management_with_exit_into_thin_support_before_breakdown",
    "repeated_balanced_management_with_trim_into_resistance_and_premature_final_exit",
    "repeated_balanced_management_with_take_profit_into_resistance_and_premature_final_exit",
    "repeated_rescue_attempts_with_balanced_management_and_exit_into_thin_support_before_breakdown",
    "repeated_rescue_attempts_with_balanced_management_and_trim_into_resistance_and_premature_final_exit",
    "repeated_rescue_attempts_with_balanced_management_and_take_profit_into_resistance_and_premature_final_exit",
    "readd_after_delayed_risk_response",
  ]),
  ...buildPolarityMap("mixed", [
    "readd_after_reduction",
    "add_into_resistance_structure",
  ]),
};

const POSITION_REDUCTION_POLARITY_MAP: Record<
  string,
  ScoringPatternPolarity
> = {
  ...buildPolarityMap("positive", [
    "reduction_into_strength",
    "profit_protection_present",
    "reduction_after_recent_run_up",
    "timely_risk_response_after_peak_profit",
    "timely_risk_response_with_profit_protection",
  ]),
  ...buildPolarityMap("negative", [
    "reduction_into_weakness",
    "failed_profit_protection_structure",
    "reduction_after_recent_drop",
    "held_through_danger_after_peak_profit",
    "delayed_risk_response_after_peak_profit",
    "delayed_risk_response_with_failed_profit_protection",
  ]),
  ...buildPolarityMap("mixed", [
    "scaled_out_of_position",
  ]),
};

const TRADE_EXCURSION_POLARITY_MAP: Record<string, ScoringPatternPolarity> = {
  ...buildPolarityMap("positive", ["high_mfe_trade"]),
  ...buildPolarityMap("negative", ["high_mae_trade"]),
};

const TRADE_CLOSURE_POLARITY_MAP: Record<string, ScoringPatternPolarity> = {
  ...buildPolarityMap("mixed", [
    "fully_closed_trade",
    "partial_position_left",
  ]),
};

const TRADE_DURATION_POLARITY_MAP: Record<string, ScoringPatternPolarity> = {
  ...buildPolarityMap("mixed", [
    "quick_trade",
    "extended_trade",
  ]),
};

const EXECUTION_FREQUENCY_POLARITY_MAP: Record<
  string,
  ScoringPatternPolarity
> = {
  ...buildPolarityMap("mixed", [
    "high_frequency_execution",
    "low_frequency_execution",
  ]),
};

const ENTRY_CONTEXT_POLARITY_MAP: Record<string, ScoringPatternPolarity> = {
  ...buildPolarityMap("positive", [
    "low_range_entry",
    "entry_near_trade_low",
    "entry_with_favorable_remaining_upside",
    "entry_after_recent_drop",
  ]),
  ...buildPolarityMap("negative", [
    "high_range_entry",
    "entry_near_trade_high",
    "entry_with_limited_remaining_upside",
    "entry_after_recent_run_up",
  ]),
};

const POSITION_BUILDING_POLARITY_MAP: Record<string, ScoringPatternPolarity> = {
  ...buildPolarityMap("mixed", [
    "scaled_into_position",
    "single_build_position",
  ]),
};

const POSITION_STRUCTURE_POLARITY_MAP: Record<string, ScoringPatternPolarity> = {
  ...buildPolarityMap("mixed", [
    "aggressive_scale_in",
    "passive_scale_in",
    "single_build_full_exit",
    "multi_build_full_exit",
    "multi_build_partial_exit",
    "scale_in_then_reduce",
    "one_and_done_round_trip",
  ]),
};

export const PATTERN_POLARITY_MAP: Record<string, ScoringPatternPolarity> = {
  ...EXECUTION_FREQUENCY_POLARITY_MAP,
  ...POSITION_BUILDING_POLARITY_MAP,
  ...POSITION_STRUCTURE_POLARITY_MAP,
  ...ENTRY_QUALITY_POLARITY_MAP,
  ...EXIT_QUALITY_POLARITY_MAP,
  ...SCALING_QUALITY_POLARITY_MAP,
  ...POSITION_REDUCTION_POLARITY_MAP,
  ...TRADE_EXCURSION_POLARITY_MAP,
  ...TRADE_CLOSURE_POLARITY_MAP,
  ...TRADE_DURATION_POLARITY_MAP,
  ...ENTRY_CONTEXT_POLARITY_MAP,
};

export const FULLY_MAPPED_SCORING_FAMILIES = [
  PATTERN_FAMILIES.EXECUTION_FREQUENCY,
  PATTERN_FAMILIES.POSITION_BUILDING,
  PATTERN_FAMILIES.POSITION_REDUCTION,
  PATTERN_FAMILIES.POSITION_STRUCTURE,
  PATTERN_FAMILIES.TRADE_EXCURSION,
  PATTERN_FAMILIES.TRADE_CLOSURE,
  PATTERN_FAMILIES.TRADE_DURATION,
  PATTERN_FAMILIES.ENTRY_CONTEXT,
  PATTERN_FAMILIES.ENTRY_QUALITY,
  PATTERN_FAMILIES.EXIT_QUALITY,
  PATTERN_FAMILIES.SCALING_QUALITY,
] as const;

export function getPatternScoringPolarity(
  patternId: string,
): ScoringPatternPolarity {
  return PATTERN_POLARITY_MAP[patternId] ?? "mixed";
}

export function getPatternScoringPolaritySource(
  patternId: string,
): ScoringPatternPolaritySource {
  return patternId in PATTERN_POLARITY_MAP
    ? "explicit_map"
    : "fallback_mixed";
}
