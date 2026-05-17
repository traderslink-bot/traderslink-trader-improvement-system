// =========================
// ROLE: BEHAVIOR REGISTRY
// =========================
//
// Defines the named trade behaviors that the behavior-analysis builder can emit.
//
// Add here:
// - behavior ids, labels, pattern coverage, and conflict ownership
//
// Do not add here:
// - scoring math
// - coaching copy
// - trader-profile aggregation logic

import type { BehaviorClassification } from "../types/behavior-analysis-types";

export interface BehaviorDefinition {
  id: string;
  label: string;
  behaviorCategory: string;
  classification: BehaviorClassification;
  coachingPriority: "fix_first" | "reinforce_first" | "watch";
  conflictGroup?: string;
  conflictsWith?: string[];
  patternIds: string[];
}

export const BEHAVIOR_DEFINITIONS: BehaviorDefinition[] = [
  {
    id: "chasing",
    label: "Chasing",
    behaviorCategory: "entry_discipline",
    classification: "destructive_behavior",
    coachingPriority: "fix_first",
    conflictGroup: "entry_discipline",
    conflictsWith: ["failed_breakout_chasing", "structured_execution"],
    patternIds: [
      "overextended_chase_entry_structure",
      "breakout_chase_entry_structure",
      "market_open_breakout_chase_entry_structure",
      "opening_range_breakout_chase_entry_structure",
      "late_favorable_extension_entry_structure",
    ],
  },
  {
    id: "failed_breakout_chasing",
    label: "Failed Breakout Chasing",
    behaviorCategory: "entry_discipline",
    classification: "destructive_behavior",
    coachingPriority: "fix_first",
    conflictGroup: "entry_discipline",
    conflictsWith: ["chasing", "structured_execution"],
    patternIds: [
      "breakout_chase_entry_structure",
      "failed_breakout_entry_structure",
      "opening_range_breakout_chase_entry_structure",
      "failed_opening_range_breakout_entry_structure",
      "market_open_breakout_chase_entry_structure",
      "failed_market_open_breakout_entry_structure",
    ],
  },
  {
    id: "adding_into_weakness",
    label: "Adding Into Weakness",
    behaviorCategory: "scaling_discipline",
    classification: "destructive_behavior",
    coachingPriority: "fix_first",
    conflictGroup: "add_quality",
    conflictsWith: ["adding_into_strength", "structured_execution", "strong_loss_containment"],
    patternIds: [
      "add_into_weakness",
      "add_after_recent_drop",
      "revenge_adding_after_weakness",
      "revenge_adding_with_failed_profit_protection",
      "aggressive_adding_with_failed_profit_protection",
    ],
  },
  {
    id: "averaging_down",
    label: "Averaging Down",
    behaviorCategory: "risk_addition",
    classification: "destructive_behavior",
    coachingPriority: "fix_first",
    conflictGroup: "risk_addition",
    conflictsWith: ["adding_into_strength", "structured_execution", "strong_loss_containment"],
    patternIds: [
      "add_into_weakness",
      "add_after_recent_drop",
      "revenge_adding_after_weakness",
      "revenge_adding_with_failed_profit_protection",
      "aggressive_adding_with_failed_profit_protection",
      "readd_after_delayed_risk_response",
    ],
  },
  {
    id: "adding_into_strength",
    label: "Adding Into Strength",
    behaviorCategory: "scaling_discipline",
    classification: "improving_behavior",
    coachingPriority: "reinforce_first",
    conflictGroup: "add_quality",
    conflictsWith: ["adding_into_weakness"],
    patternIds: [
      "add_into_strength",
      "add_after_recent_run_up",
      "add_above_resistance_structure",
      "add_above_resistance_with_constructive_final_exit",
    ],
  },
  {
    id: "premature_exit",
    label: "Premature Exit",
    behaviorCategory: "winner_management",
    classification: "destructive_behavior",
    coachingPriority: "fix_first",
    conflictGroup: "winner_management",
    conflictsWith: ["strong_winner_management"],
    patternIds: [
      "premature_final_exit_after_constructive_management",
      "missed_post_exit_continuation",
      "balanced_management_with_premature_final_exit",
      "recovery_with_balanced_management_and_premature_final_exit",
      "balanced_management_with_missed_final_continuation",
      "recovery_with_balanced_management_and_missed_final_continuation",
      "trim_into_strength_with_premature_final_exit",
      "timely_profit_protection_with_premature_final_exit",
      "recovery_with_trim_into_strength_and_premature_final_exit",
      "recovery_with_timely_profit_protection_and_premature_final_exit",
      "constructive_reentry_with_premature_final_exit",
      "recovery_with_premature_final_exit_after_constructive_reentry",
      "stabilized_recovery_with_premature_final_exit",
      "underutilized_winner_with_premature_final_exit",
      "recovery_to_underutilized_winner_with_premature_final_exit",
      "underutilized_winner_with_missed_final_continuation",
      "recovery_to_underutilized_winner_with_missed_final_continuation",
      "add_into_strength_with_premature_final_exit",
      "recovery_with_add_into_strength_and_premature_final_exit",
      "add_into_strength_with_missed_final_continuation",
      "recovery_with_add_into_strength_and_missed_final_continuation",
    ],
  },
  {
    id: "undersized_winner",
    label: "Under-Sized Winner",
    behaviorCategory: "sizing_quality",
    classification: "destructive_behavior",
    coachingPriority: "fix_first",
    conflictGroup: "winner_sizing",
    conflictsWith: ["strong_winner_management"],
    patternIds: [
      "underutilized_position_building",
      "underutilized_winner_with_premature_final_exit",
      "recovery_to_underutilized_winner_with_premature_final_exit",
      "underutilized_winner_with_missed_final_continuation",
      "recovery_to_underutilized_winner_with_missed_final_continuation",
    ],
  },
  {
    id: "poor_profit_protection",
    label: "Poor Profit Protection",
    behaviorCategory: "risk_management",
    classification: "destructive_behavior",
    coachingPriority: "fix_first",
    conflictGroup: "profit_protection",
    conflictsWith: ["strong_profit_protection"],
    patternIds: [
      "failed_profit_protection_structure",
      "delayed_risk_response_with_failed_profit_protection",
      "peak_profit_giveback_structure",
      "balanced_management_with_premature_final_exit",
      "add_above_resistance_with_failed_profit_protection",
    ],
  },
  {
    id: "strong_profit_protection",
    label: "Strong Profit Protection",
    behaviorCategory: "risk_management",
    classification: "high_skill_behavior",
    coachingPriority: "reinforce_first",
    conflictGroup: "profit_protection",
    conflictsWith: ["poor_profit_protection"],
    patternIds: [
      "profit_protection_present",
      "timely_risk_response_with_profit_protection",
      "timely_profit_protection_with_constructive_final_exit",
      "balanced_scaling_with_profit_protection",
    ],
  },
  {
    id: "strong_loss_containment",
    label: "Strong Loss Containment",
    behaviorCategory: "risk_management",
    classification: "high_skill_behavior",
    coachingPriority: "reinforce_first",
    conflictGroup: "loss_containment",
    patternIds: [
      "disciplined_defensive_exit",
      "timely_risk_response_after_peak_profit",
      "timely_risk_response_with_defensive_final_exit_after_deterioration",
      "recovery_with_timely_risk_response_and_defensive_final_exit_after_deterioration",
      "exit_into_support_before_breakdown",
      "exit_into_thin_support_before_breakdown",
      "stabilized_recovery_with_exit_into_thin_support_before_breakdown",
    ],
  },
  {
    id: "strong_winner_management",
    label: "Strong Winner Management",
    behaviorCategory: "winner_management",
    classification: "high_skill_behavior",
    coachingPriority: "reinforce_first",
    conflictGroup: "winner_management",
    conflictsWith: ["premature_exit", "undersized_winner", "poor_profit_protection"],
    patternIds: [
      "timely_profit_protection_with_constructive_final_exit",
      "recovery_with_timely_profit_protection_and_constructive_final_exit",
      "trim_into_strength_with_constructive_final_exit",
      "recovery_with_trim_into_strength_and_constructive_final_exit",
      "timely_trim_into_strength_with_constructive_final_exit",
      "recovery_with_timely_trim_into_strength_and_constructive_final_exit",
      "balanced_management_with_constructive_exit",
      "recovery_with_balanced_management_and_constructive_final_exit",
      "add_into_strength_with_constructive_final_exit",
      "recovery_with_add_into_strength_and_constructive_final_exit",
      "underutilized_winner_with_timely_profit_protection_and_constructive_final_exit",
      "recovery_to_underutilized_winner_with_timely_profit_protection_and_constructive_final_exit",
    ],
  },
  {
    id: "flip_flopping",
    label: "Flip-Flopping",
    behaviorCategory: "management_stability",
    classification: "destructive_behavior",
    coachingPriority: "fix_first",
    conflictsWith: ["structured_execution"],
    patternIds: [
      "readd_after_reduction",
      "repeated_trim_readd_with_unstable_management",
      "repeated_trim_readd_with_deteriorating_reentry",
      "repeated_trim_readd_with_premature_final_exit",
      "repeated_trim_readd_with_missed_final_continuation",
    ],
  },
  {
    id: "overtrading",
    label: "Overtrading",
    behaviorCategory: "execution_tempo",
    classification: "destructive_behavior",
    coachingPriority: "fix_first",
    conflictsWith: ["structured_execution"],
    patternIds: [
      "high_frequency_execution",
      "aggressive_scale_in",
      "one_sided_aggressive_building",
      "revenge_adding_after_weakness",
    ],
  },
  {
    id: "structured_execution",
    label: "Structured Execution",
    behaviorCategory: "execution_quality",
    classification: "high_skill_behavior",
    coachingPriority: "reinforce_first",
    conflictGroup: "execution_quality",
    conflictsWith: [
      "chasing",
      "failed_breakout_chasing",
      "overtrading",
      "flip_flopping",
      "adding_into_weakness",
      "averaging_down",
      "premature_exit",
      "undersized_winner",
    ],
    patternIds: [
      "advantaged_entry_structure",
      "disciplined_defensive_exit",
      "structured_position_building",
      "balanced_position_management",
      "timely_risk_response_with_profit_protection",
    ],
  },
];
