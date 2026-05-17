// =========================
// SCALING DOMINANCE RULES
// =========================
//
// PURPOSE:
// Manual Layer 3 dominance relationships for scaling, rescue, and repeated
// management overlap.

import { defineDominanceRule } from "../helpers";
import type { PatternDominanceRule } from "../types";

export const SCALING_PATTERN_DOMINANCE_RULES: PatternDominanceRule[] = [


  // =========================
  // SCALING QUALITY
  // =========================
  defineDominanceRule({
    dominantPatternId: "structured_position_building",
    suppressedPatternId: "scaled_into_position",
    outcome: "demote_to_contextual",
    reason:
      "Structured position building is a richer middle-trade sizing pattern than the raw build fact.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_position_management",
    suppressedPatternId: "structured_position_building",
    outcome: "demote_to_supporting",
    reason:
      "Balanced position management is richer than structured position building because it includes reduction behavior.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_position_management",
    suppressedPatternId: "scaled_into_position",
    outcome: "demote_to_contextual",
    reason:
      "Balanced position management is a richer middle-trade pattern than the raw build fact.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_scaling_with_profit_protection",
    suppressedPatternId: "balanced_position_management",
    outcome: "demote_to_supporting",
    reason:
      "Balanced scaling with profit protection is a richer management pattern than broad balanced position management.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_scaling_with_profit_protection",
    suppressedPatternId: "profit_protection_present",
    outcome: "demote_to_supporting",
    reason:
      "Balanced scaling with profit protection includes the constructive profit-protection element plus add/reduction structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_into_strength_with_constructive_final_exit",
    suppressedPatternId: "add_into_strength",
    outcome: "demote_to_supporting",
    reason:
      "Add into strength with constructive final exit is a richer whole-trade storyline than broad add into strength alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_into_strength_with_constructive_final_exit",
    suppressedPatternId: "balanced_management_with_constructive_exit",
    outcome: "demote_to_supporting",
    reason:
      "Add into strength with constructive final exit is a richer constructive storyline than broad balanced constructive management alone because it adds explicit pressing-winners context.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_into_strength_with_constructive_final_exit",
    suppressedPatternId: "exit_avoided_adverse_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Add into strength with constructive final exit includes the constructive final-exit outcome plus explicit pressing-into-strength management context.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_into_strength_with_premature_final_exit",
    suppressedPatternId: "add_into_strength",
    outcome: "demote_to_supporting",
    reason:
      "Add into strength with premature final exit is a richer whole-trade storyline than broad add into strength alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_into_strength_with_premature_final_exit",
    suppressedPatternId: "premature_final_exit_after_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Add into strength with premature final exit is a richer whole-trade storyline than broad premature final exit after constructive management because it adds explicit pressing-winners context.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_with_add_into_strength_and_constructive_final_exit",
    suppressedPatternId: "add_into_strength_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add into strength and constructive final exit is a richer storyline because it adds the early-adversity recovery path to the constructive add-into-strength sequence.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_with_add_into_strength_and_constructive_final_exit",
    suppressedPatternId: "constructive_recovery_after_early_adversity",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add into strength and constructive final exit is a richer recovery-aware storyline than broad constructive recovery alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_with_add_into_strength_and_constructive_final_exit",
    suppressedPatternId: "stabilized_recovery_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add into strength and constructive final exit is a richer recovery-aware storyline than the broad stabilized-recovery constructive-final-exit pattern because it adds explicit pressing-into-strength context.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_with_add_into_strength_and_constructive_final_exit",
    suppressedPatternId:
      "recovery_with_balanced_management_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add into strength and constructive final exit is a richer recovery-aware storyline than recovery with balanced management and constructive final exit because it adds explicit pressing-into-strength context.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_with_add_into_strength_and_premature_final_exit",
    suppressedPatternId: "add_into_strength_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add into strength and premature final exit is a richer storyline because it adds the early-adversity recovery path to the pressing-and-premature-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_with_add_into_strength_and_premature_final_exit",
    suppressedPatternId: "constructive_recovery_after_early_adversity",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add into strength and premature final exit is a richer recovery-aware storyline than broad constructive recovery alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_with_add_into_strength_and_premature_final_exit",
    suppressedPatternId: "premature_final_exit_after_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add into strength and premature final exit is a richer storyline than broad premature final exit after constructive management because it adds both the recovery path and the explicit pressing-into-strength context.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_into_strength_with_premature_final_exit",
    suppressedPatternId: "add_into_strength_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Add into strength with premature final exit is a richer whole-trade storyline than the broader add-into-strength missed-continuation branch because it adds the explicit premature-final-exit interpretation on top of the missed continuation outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_with_add_into_strength_and_premature_final_exit",
    suppressedPatternId: "recovery_with_add_into_strength_and_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add into strength and premature final exit is a richer recovery-aware storyline than the broader recovery-aware pressing missed-continuation branch because it adds the explicit premature-final-exit interpretation.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "add_into_strength_with_timely_profit_protection_and_constructive_final_exit",
    suppressedPatternId: "add_into_strength_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Add into strength with timely profit protection and constructive final exit is a richer whole-trade storyline because it adds explicit timely protection to the constructive pressing path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "add_into_strength_with_timely_profit_protection_and_constructive_final_exit",
    suppressedPatternId: "timely_profit_protection_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Add into strength with timely profit protection and constructive final exit is a richer whole-trade storyline because it adds explicit pressing-into-strength context to the timely protection and constructive-exit path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_add_into_strength_and_timely_profit_protection_and_constructive_final_exit",
    suppressedPatternId:
      "add_into_strength_with_timely_profit_protection_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add into strength and timely profit protection and constructive final exit is a richer storyline because it adds the early-adversity recovery path to the timely constructive pressing sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_add_into_strength_and_timely_profit_protection_and_constructive_final_exit",
    suppressedPatternId: "recovery_with_add_into_strength_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add into strength and timely profit protection and constructive final exit is a richer recovery-aware storyline because it adds explicit timely protection to the constructive pressing path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_add_into_strength_and_timely_profit_protection_and_constructive_final_exit",
    suppressedPatternId:
      "recovery_with_timely_profit_protection_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add into strength and timely profit protection and constructive final exit is a richer recovery-aware storyline because it adds explicit pressing-into-strength context to the recovery-aware timely protection and constructive-exit path.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_into_strength_with_missed_final_continuation",
    suppressedPatternId: "add_into_strength",
    outcome: "demote_to_supporting",
    reason:
      "Add into strength with missed final continuation is a richer storyline than broad add into strength alone because it adds the missed-opportunity final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_into_strength_with_missed_final_continuation",
    suppressedPatternId: "missed_post_exit_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Add into strength with missed final continuation includes the missed post-exit continuation outcome plus explicit pressing-into-strength context.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_with_add_into_strength_and_missed_final_continuation",
    suppressedPatternId: "add_into_strength_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add into strength and missed final continuation is a richer storyline because it adds the early-adversity recovery path to the pressing-and-missed-continuation outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_with_add_into_strength_and_missed_final_continuation",
    suppressedPatternId: "constructive_recovery_after_early_adversity",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add into strength and missed final continuation is a richer recovery-aware storyline than broad constructive recovery alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_readd_after_reduction",
    suppressedPatternId: "readd_after_reduction",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-add after reduction is a richer sequence pattern than the broad re-add-after-reduction fact.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_readd_after_reduction",
    suppressedPatternId: "add_into_strength",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-add after reduction includes strong add-context plus the re-add sequence and retained profit protection.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_management_with_constructive_exit",
    suppressedPatternId: "balanced_scaling_with_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with constructive exit is a richer storyline pattern than balanced scaling with profit protection alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_management_with_constructive_exit",
    suppressedPatternId: "exit_avoided_adverse_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with constructive exit includes the constructive final-exit outcome plus broader active-management structure.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_constructive_final_exit",
    suppressedPatternId: "balanced_management_with_constructive_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and constructive final exit is a richer storyline because it adds the early-adversity recovery path to the broad balanced-management constructive-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_constructive_final_exit",
    suppressedPatternId: "stabilized_recovery_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and constructive final exit is a richer recovery-aware storyline than the broad stabilized-recovery constructive-final-exit pattern because it adds balanced management context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_constructive_final_exit",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and constructive final exit is a richer storyline than broad recovery after early adversity with stabilized management because it adds the constructive final-exit outcome to the balanced-management path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "balanced_management_with_take_profit_into_resistance_and_constructive_final_exit",
    suppressedPatternId: "balanced_management_with_constructive_exit",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with take profit into resistance and constructive final exit is a richer whole-trade storyline than broad balanced management with constructive exit because it adds explicit nearby resistance context to the profit-taking path.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_into_resistance_with_constructive_final_exit",
    suppressedPatternId:
      "balanced_management_with_take_profit_into_resistance_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Trim into resistance with constructive final exit is a richer local management storyline than the broader balanced-management take-profit-into-resistance summary because it adds the stricter trim-specific structure.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_take_profit_into_resistance_and_constructive_final_exit",
    suppressedPatternId:
      "balanced_management_with_take_profit_into_resistance_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and take profit into resistance and constructive final exit is a richer storyline because it adds the early-adversity recovery path to the support-aware take-profit summary.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_take_profit_into_resistance_and_constructive_final_exit",
    suppressedPatternId:
      "recovery_with_balanced_management_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and take profit into resistance and constructive final exit is a richer recovery-aware storyline than broad recovery with balanced management and constructive final exit because it adds explicit nearby resistance context to the profit-taking path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_trim_into_resistance_and_constructive_final_exit",
    suppressedPatternId:
      "recovery_with_balanced_management_and_take_profit_into_resistance_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with trim into resistance and constructive final exit is a richer local management storyline than the broader recovery-aware balanced-management take-profit-into-resistance summary because it adds the stricter trim-specific structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_management_with_missed_final_continuation",
    suppressedPatternId: "missed_post_exit_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with missed final continuation is a richer whole-trade storyline than the broad missed-post-exit continuation pattern because it adds active management structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_management_with_missed_final_continuation",
    suppressedPatternId: "balanced_position_management",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with missed final continuation is a richer storyline than broad balanced position management because it adds the missed-continuation final outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_management_with_fearful_final_exit",
    suppressedPatternId: "fearful_exit_after_weakening",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with fearful final exit is a richer whole-trade storyline than broad fearful exit after weakening because it adds active management structure before the fearful exit.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_management_with_fearful_final_exit",
    suppressedPatternId: "balanced_position_management",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with fearful final exit is a richer storyline than broad balanced position management because it adds the later fearful-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_management_with_fearful_final_exit",
    suppressedPatternId: "balanced_management_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with fearful final exit is a stricter missed-continuation storyline because it specifies a weak fearful exit before the later rebound.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_with_balanced_management_and_fearful_final_exit",
    suppressedPatternId: "balanced_management_with_fearful_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and fearful final exit is a richer storyline because it adds the early-adversity recovery path to the balanced-management fearful-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_with_balanced_management_and_fearful_final_exit",
    suppressedPatternId:
      "recovery_with_balanced_management_and_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and fearful final exit is a stricter recovery-aware missed-continuation storyline because it adds the weak fearful-exit detail.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_with_balanced_management_and_fearful_final_exit",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and fearful final exit is a richer storyline than broad recovery after early adversity with stabilized management because it adds the fearful final-exit outcome to the balanced-management path.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_management_with_premature_final_exit",
    suppressedPatternId: "balanced_management_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with premature final exit is a stricter missed-continuation storyline because it also requires retained profit and limited giveback into the exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_missed_final_continuation",
    suppressedPatternId: "balanced_management_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and missed final continuation is a richer storyline because it adds the early-adversity recovery path to the broad balanced-management missed-continuation sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_missed_final_continuation",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and missed final continuation is a richer storyline than broad recovery after early adversity with stabilized management because it adds the missed-continuation final outcome to the balanced-management path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_premature_final_exit",
    suppressedPatternId:
      "recovery_with_balanced_management_and_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and premature final exit is a stricter missed-continuation storyline because it also requires retained profit and limited giveback into the exit.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_management_with_premature_final_exit",
    suppressedPatternId: "premature_final_exit_after_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with premature final exit is a richer whole-trade storyline than broad premature final exit after constructive management because it adds balanced scaling and reduction structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_management_with_premature_final_exit",
    suppressedPatternId: "balanced_position_management",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with premature final exit is a richer storyline than broad balanced position management because it adds the final early-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_premature_final_exit",
    suppressedPatternId: "balanced_management_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and premature final exit is a richer storyline because it adds the early-adversity recovery path to the balanced-management premature-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_premature_final_exit",
    suppressedPatternId: "stabilized_recovery_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and premature final exit is a richer recovery-aware storyline than the broad stabilized-recovery premature-final-exit pattern because it adds balanced management context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_premature_final_exit",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and premature final exit is a richer storyline than broad recovery after early adversity with stabilized management because it adds the final premature-exit outcome to the balanced-management path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "balanced_management_with_take_profit_into_resistance_and_premature_final_exit",
    suppressedPatternId: "balanced_management_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with take profit into resistance and premature final exit is a richer whole-trade storyline than broad balanced management with premature final exit because it adds explicit nearby resistance context to the profit-taking path.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_into_resistance_with_premature_final_exit",
    suppressedPatternId:
      "balanced_management_with_take_profit_into_resistance_and_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Trim into resistance with premature final exit is a richer local management storyline than the broader balanced-management take-profit-into-resistance premature summary because it adds the stricter trim-specific structure.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_take_profit_into_resistance_and_premature_final_exit",
    suppressedPatternId:
      "balanced_management_with_take_profit_into_resistance_and_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and take profit into resistance and premature final exit is a richer storyline because it adds the early-adversity recovery path to the support-aware premature take-profit summary.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_take_profit_into_resistance_and_premature_final_exit",
    suppressedPatternId:
      "recovery_with_balanced_management_and_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and take profit into resistance and premature final exit is a richer recovery-aware storyline than broad recovery with balanced management and premature final exit because it adds explicit nearby resistance context to the profit-taking path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_trim_into_resistance_and_premature_final_exit",
    suppressedPatternId:
      "recovery_with_balanced_management_and_take_profit_into_resistance_and_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with trim into resistance and premature final exit is a richer local management storyline than the broader recovery-aware balanced-management take-profit-into-resistance premature summary because it adds the stricter trim-specific structure.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "balanced_management_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with stop-like forced exit after breakdown is a richer whole-trade storyline than the broad stop-like breakdown exit because it adds active management structure before the later forced exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "balanced_management_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "balanced_position_management",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with stop-like forced exit after breakdown is a richer storyline than broad balanced position management because it adds the later stop-like breakdown-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "balanced_management_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with stop-like forced exit before rebound is a richer whole-trade storyline than the broad stop-like rebound exit because it adds active management structure before the later forced exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "balanced_management_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "balanced_position_management",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with stop-like forced exit before rebound is a richer storyline than broad balanced position management because it adds the later stop-like rebound-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "balanced_management_with_stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and stop-like forced exit after breakdown is a richer storyline because it adds the early-adversity recovery path to the balanced-management stop-like breakdown sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and stop-like forced exit after breakdown is a richer recovery-failure storyline than broad recovery after early adversity with failed protection alone because it adds balanced management context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "balanced_management_with_stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and stop-like forced exit before rebound is a richer storyline because it adds the early-adversity recovery path to the balanced-management stop-like rebound sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and stop-like forced exit before rebound is a richer recovery-failure storyline than broad recovery after early adversity with failed protection alone because it adds balanced management context.",
  }),
  defineDominanceRule({
    dominantPatternId: "timely_profit_protection_with_constructive_final_exit",
    suppressedPatternId: "timely_risk_response_with_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Timely profit protection with constructive final exit is a richer whole-trade storyline because it adds the constructive final-exit outcome to the timely protection path.",
  }),
  defineDominanceRule({
    dominantPatternId: "timely_profit_protection_with_constructive_final_exit",
    suppressedPatternId: "balanced_management_with_constructive_exit",
    outcome: "demote_to_supporting",
    reason:
      "Timely profit protection with constructive final exit is a richer whole-trade storyline than broad balanced management with constructive exit because it adds explicit timely protection after peak open profit.",
  }),
  defineDominanceRule({
    dominantPatternId: "timely_profit_protection_with_constructive_final_exit",
    suppressedPatternId: "exit_avoided_adverse_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Timely profit protection with constructive final exit includes the constructive final-exit outcome plus the timely profit-protection path.",
  }),
  defineDominanceRule({
    dominantPatternId: "timely_profit_protection_with_premature_final_exit",
    suppressedPatternId: "timely_risk_response_with_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Timely profit protection with premature final exit is a richer whole-trade storyline because it adds the premature final-exit outcome to the timely protection path.",
  }),
  defineDominanceRule({
    dominantPatternId: "timely_profit_protection_with_premature_final_exit",
    suppressedPatternId: "premature_final_exit_after_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Timely profit protection with premature final exit is a richer whole-trade storyline than broad premature final exit after constructive management because it adds explicit timely protection after peak open profit.",
  }),
  defineDominanceRule({
    dominantPatternId: "timely_profit_protection_with_premature_final_exit",
    suppressedPatternId: "balanced_management_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Timely profit protection with premature final exit is a richer whole-trade storyline than broad balanced management with premature final exit because it adds explicit timely protection after peak open profit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "timely_risk_response_with_defensive_final_exit_after_deterioration",
    suppressedPatternId: "timely_risk_response_with_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Timely risk response with defensive final exit after deterioration is a richer whole-trade storyline because it adds the later defensive final-exit outcome to the timely danger-window response path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "timely_risk_response_with_defensive_final_exit_after_deterioration",
    suppressedPatternId: "defensive_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Timely risk response with defensive final exit after deterioration is a richer whole-trade storyline than broad defensive exit after deterioration because it adds explicit timely danger-window response after peak open profit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "timely_risk_response_with_defensive_final_exit_after_deterioration",
    suppressedPatternId: "partial_exit_with_adverse_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Timely risk response with defensive final exit after deterioration is a richer whole-trade storyline than broad partial exit with adverse followthrough because it includes the later defensive final exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "timely_risk_response_with_defensive_final_exit_after_deterioration",
    suppressedPatternId:
      "balanced_management_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Timely risk response with defensive final exit after deterioration is a richer whole-trade storyline than broad balanced management with defensive final exit after deterioration because it adds explicit danger-window timing detail.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "timely_risk_response_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "timely_risk_response_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Timely risk response with stop-like forced exit after breakdown is a stricter whole-trade storyline than timely risk response with defensive final exit after deterioration because it distinguishes a stop-like breakdown exit from a broader defensive save.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "timely_risk_response_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "timely_risk_response_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Timely risk response with stop-like forced exit before rebound is a stricter whole-trade storyline than timely risk response with defensive final exit after deterioration because it distinguishes a stop-like weak-side exit from a broader defensive save.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_into_strength_with_premature_final_exit",
    suppressedPatternId: "balanced_management_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Add into strength with premature final exit is a richer whole-trade storyline than broad balanced management with premature final exit because it adds explicit pressing-into-strength context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "timely_risk_response_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "timely_risk_response_after_peak_profit",
    outcome: "demote_to_supporting",
    reason:
      "Timely risk response with stop-like forced exit after breakdown is a richer whole-trade storyline because it adds the later breakdown-driven stop-like exit outcome to the timely danger-window response path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "timely_risk_response_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Timely risk response with stop-like forced exit after breakdown is a richer whole-trade storyline than the broad stop-like breakdown exit because it adds the earlier timely danger-window response path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "timely_risk_response_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "balanced_management_with_stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Timely risk response with stop-like forced exit after breakdown is a richer whole-trade storyline than broad balanced management with stop-like forced exit after breakdown because it adds explicit danger-window timing detail.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "timely_risk_response_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "timely_risk_response_after_peak_profit",
    outcome: "demote_to_supporting",
    reason:
      "Timely risk response with stop-like forced exit before rebound is a richer whole-trade storyline because it adds the later stop-like weak-side exit before rebound to the timely danger-window response path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "timely_risk_response_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Timely risk response with stop-like forced exit before rebound is a richer whole-trade storyline than the broad stop-like rebound exit because it adds the earlier timely danger-window response path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "timely_risk_response_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "balanced_management_with_stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Timely risk response with stop-like forced exit before rebound is a richer whole-trade storyline than broad balanced management with stop-like forced exit before rebound because it adds explicit danger-window timing detail.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "balanced_management_with_defensive_final_exit_after_deterioration",
    suppressedPatternId: "balanced_position_management",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with defensive final exit after deterioration is a richer whole-trade storyline than broad balanced position management because it adds the later defensive-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "balanced_management_with_defensive_final_exit_after_deterioration",
    suppressedPatternId: "defensive_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with defensive final exit after deterioration is a richer whole-trade storyline than broad defensive exit after deterioration because it adds balanced management context before the later defensive save.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "balanced_management_with_defensive_final_exit_after_deterioration",
    suppressedPatternId: "partial_exit_with_adverse_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with defensive final exit after deterioration is a richer whole-trade storyline than broad partial exit with adverse followthrough because it includes the later defensive final exit.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_management_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "balanced_management_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with stop-like forced exit after breakdown is a stricter whole-trade storyline than balanced management with defensive final exit after deterioration because it distinguishes a stop-like breakdown exit from a broader defensive save.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_management_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "balanced_management_with_fearful_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with stop-like forced exit before rebound is a stricter whole-trade storyline than balanced management with fearful final exit because it distinguishes a stop-like weak-side exit from a broader fearful one.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "recovery_with_balanced_management_and_fearful_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and stop-like forced exit before rebound is a stricter recovery-aware storyline than recovery with balanced management and fearful final exit because it distinguishes a stop-like weak-side exit from a broader fearful one.",
  }),
  defineDominanceRule({
    dominantPatternId: "timely_risk_response_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "balanced_management_with_fearful_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Timely risk response with stop-like forced exit before rebound is a richer whole-trade storyline than broad balanced management with fearful final exit because it adds explicit danger-window timing detail.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_management_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "balanced_management_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with stop-like forced exit before rebound is a stricter whole-trade storyline than balanced management with defensive final exit after deterioration because it distinguishes a stop-like weak-side exit from a broader defensive save.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_readd_with_constructive_final_exit",
    suppressedPatternId: "constructive_readd_after_reduction",
    outcome: "demote_to_supporting",
    reason:
      "Trim re-add with constructive final exit is a richer storyline pattern than constructive re-add after reduction alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_readd_with_constructive_final_exit",
    suppressedPatternId: "balanced_management_with_constructive_exit",
    outcome: "demote_to_supporting",
    reason:
      "Trim re-add with constructive final exit includes the balanced constructive-management storyline plus explicit trim and re-add sequence detail.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_readd_with_constructive_final_exit",
    suppressedPatternId: "exit_avoided_adverse_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Trim re-add with constructive final exit includes the constructive final-exit outcome plus richer sequence-level trade management structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_readd_with_missed_final_continuation",
    suppressedPatternId: "readd_after_reduction",
    outcome: "demote_to_supporting",
    reason:
      "Trim re-add with missed final continuation is a richer storyline pattern than the broad re-add-after-reduction fact.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_readd_with_missed_final_continuation",
    suppressedPatternId: "missed_post_exit_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Trim re-add with missed final continuation includes the missed post-exit continuation outcome plus richer trim and re-add sequence structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_recovery_after_early_adversity",
    suppressedPatternId: "timely_risk_response_with_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Constructive recovery after early adversity is a richer full-trade storyline than constructive danger-window response alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_recovery_after_early_adversity",
    suppressedPatternId: "balanced_management_with_constructive_exit",
    outcome: "demote_to_supporting",
    reason:
      "Constructive recovery after early adversity is a richer full-trade storyline than broad balanced constructive management alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_after_early_adversity_with_failed_protection",
    suppressedPatternId: "failed_profit_protection_structure",
    outcome: "demote_to_supporting",
    reason:
      "Recovery after early adversity with failed protection is a richer full-trade storyline than broad failed profit protection alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_after_early_adversity_with_failed_protection",
    suppressedPatternId: "peak_profit_giveback_structure",
    outcome: "demote_to_supporting",
    reason:
      "Recovery after early adversity with failed protection includes the recovery path plus the later giveback failure.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_after_early_adversity_with_stabilized_management",
    suppressedPatternId: "constructive_recovery_after_early_adversity",
    outcome: "demote_to_supporting",
    reason:
      "Recovery after early adversity with stabilized management is a richer constructive rescue storyline than broad constructive recovery alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_after_early_adversity_with_stabilized_management",
    suppressedPatternId: "timely_risk_response_with_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Recovery after early adversity with stabilized management includes the timely protective response plus the fuller recovery storyline.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_into_strength_with_constructive_final_exit",
    suppressedPatternId: "balanced_management_with_constructive_exit",
    outcome: "demote_to_supporting",
    reason:
      "Trim into strength with constructive final exit is a richer constructive storyline than broad balanced constructive management alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_into_strength_with_constructive_final_exit",
    suppressedPatternId: "reduction_into_strength",
    outcome: "demote_to_supporting",
    reason:
      "Trim into strength with constructive final exit includes the directional trim context plus the fuller constructive final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_into_strength_with_constructive_final_exit",
    suppressedPatternId: "exit_avoided_adverse_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Trim into strength with constructive final exit includes the constructive post-exit outcome plus the stronger trim-into-strength management path.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_into_strength_with_premature_final_exit",
    suppressedPatternId: "reduction_into_strength",
    outcome: "demote_to_supporting",
    reason:
      "Trim into strength with premature final exit includes the directional trim context plus the later premature final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_into_strength_with_premature_final_exit",
    suppressedPatternId: "premature_final_exit_after_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Trim into strength with premature final exit is a richer whole-trade storyline than broad premature final exit after constructive management because it adds explicit trim-into-strength management context.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_into_strength_with_premature_final_exit",
    suppressedPatternId: "balanced_management_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Trim into strength with premature final exit is a richer whole-trade storyline than broad balanced management with premature final exit because it adds explicit trim-into-strength management context.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_into_resistance_with_constructive_final_exit",
    suppressedPatternId: "trim_into_strength_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Trim into resistance with constructive final exit is a richer constructive storyline than trim into strength with constructive final exit because it adds explicit nearby resistance context to the trim.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_into_resistance_with_constructive_final_exit",
    suppressedPatternId: "reduction_into_strength",
    outcome: "demote_to_supporting",
    reason:
      "Trim into resistance with constructive final exit includes the directional trim context plus explicit nearby resistance structure and the constructive final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_into_resistance_with_premature_final_exit",
    suppressedPatternId: "trim_into_strength_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Trim into resistance with premature final exit is a richer storyline than trim into strength with premature final exit because it adds explicit nearby resistance context to the trim.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_into_resistance_with_premature_final_exit",
    suppressedPatternId: "premature_final_exit_after_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Trim into resistance with premature final exit is a richer whole-trade storyline than broad premature final exit after constructive management because it adds explicit resistance-aware trim context.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_into_resistance_with_premature_final_exit",
    suppressedPatternId: "exit_into_resistance_before_breakout",
    outcome: "demote_to_supporting",
    reason:
      "Trim into resistance with premature final exit is a richer whole-trade resistance-aware storyline than the broad exit-into-resistance-before-breakout descriptor because it adds earlier trim management context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_profit_protection_and_constructive_final_exit",
    suppressedPatternId: "timely_profit_protection_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely profit protection and constructive final exit is a richer storyline because it adds the early-adversity recovery path to the timely protection and constructive-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_profit_protection_and_constructive_final_exit",
    suppressedPatternId: "stabilized_recovery_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely profit protection and constructive final exit is a richer recovery-aware storyline than the broad stabilized-recovery constructive-final-exit pattern because it adds explicit timely protection after peak open profit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_profit_protection_and_constructive_final_exit",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely profit protection and constructive final exit is a richer storyline than broad recovery after early adversity with stabilized management because it adds the final constructive-exit outcome to the timely protection path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_profit_protection_and_constructive_final_exit",
    suppressedPatternId:
      "recovery_with_balanced_management_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely profit protection and constructive final exit is a richer recovery-aware storyline than recovery with balanced management and constructive final exit because it adds explicit timely protection after peak open profit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_profit_protection_and_premature_final_exit",
    suppressedPatternId: "timely_profit_protection_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely profit protection and premature final exit is a richer storyline because it adds the early-adversity recovery path to the timely protection and premature-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_profit_protection_and_premature_final_exit",
    suppressedPatternId: "stabilized_recovery_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely profit protection and premature final exit is a richer recovery-aware storyline than the broad stabilized-recovery premature-final-exit pattern because it adds explicit timely protection after peak open profit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_profit_protection_and_premature_final_exit",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely profit protection and premature final exit is a richer storyline than broad recovery after early adversity with stabilized management because it adds the final premature-exit outcome to the timely protection path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_profit_protection_and_premature_final_exit",
    suppressedPatternId:
      "recovery_with_balanced_management_and_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely profit protection and premature final exit is a richer recovery-aware storyline than recovery with balanced management and premature final exit because it adds explicit timely protection after peak open profit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_risk_response_and_defensive_final_exit_after_deterioration",
    suppressedPatternId:
      "timely_risk_response_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely risk response and defensive final exit after deterioration is a richer storyline because it adds the early-adversity recovery path to the timely-response and defensive-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_risk_response_and_defensive_final_exit_after_deterioration",
    suppressedPatternId: "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely risk response and defensive final exit after deterioration is a richer recovery-failure storyline because it adds both the timely-response path and the later defensive exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_risk_response_and_defensive_final_exit_after_deterioration",
    suppressedPatternId: "stabilized_recovery_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely risk response and defensive final exit after deterioration is a richer recovery-aware storyline than the broad stabilized-recovery premature-exit pattern because it adds explicit timely response and a later defensive save.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_risk_response_and_defensive_final_exit_after_deterioration",
    suppressedPatternId:
      "recovery_with_balanced_management_and_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely risk response and defensive final exit after deterioration is a richer recovery-aware storyline than recovery with balanced management and defensive final exit after deterioration because it adds explicit danger-window timing detail.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_risk_response_and_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "recovery_with_timely_risk_response_and_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely risk response and stop-like forced exit after breakdown is a stricter recovery-aware storyline than recovery with timely risk response and defensive final exit after deterioration because it distinguishes a stop-like breakdown exit from a broader defensive save.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_risk_response_and_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "recovery_with_timely_risk_response_and_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely risk response and stop-like forced exit before rebound is a stricter recovery-aware storyline than recovery with timely risk response and defensive final exit after deterioration because it distinguishes a stop-like weak-side exit from a broader defensive save.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_with_add_into_strength_and_premature_final_exit",
    suppressedPatternId:
      "recovery_with_balanced_management_and_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add into strength and premature final exit is a richer recovery-aware storyline than recovery with balanced management and premature final exit because it adds explicit pressing-into-strength context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_risk_response_and_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "timely_risk_response_with_stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely risk response and stop-like forced exit after breakdown is a richer storyline because it adds the early-adversity recovery path to the timely-response stop-like breakdown sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_risk_response_and_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "stabilized_recovery_with_stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely risk response and stop-like forced exit after breakdown is a richer recovery-aware storyline than the broad stabilized-recovery stop-like breakdown pattern because it adds explicit timely danger-window response before the later breakdown exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_risk_response_and_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely risk response and stop-like forced exit after breakdown is a richer recovery-failure storyline because it adds both the timely danger-window response path and the later stop-like breakdown exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_risk_response_and_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "recovery_with_balanced_management_and_stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely risk response and stop-like forced exit after breakdown is a richer recovery-aware storyline than recovery with balanced management and stop-like forced exit after breakdown because it adds explicit danger-window timing detail.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_risk_response_and_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "timely_risk_response_with_stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely risk response and stop-like forced exit before rebound is a richer storyline because it adds the early-adversity recovery path to the timely-response stop-like rebound sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_risk_response_and_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "stabilized_recovery_with_stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely risk response and stop-like forced exit before rebound is a richer recovery-aware storyline than the broad stabilized-recovery stop-like rebound pattern because it adds explicit timely danger-window response before the later stop-like exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_risk_response_and_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely risk response and stop-like forced exit before rebound is a richer recovery-failure storyline because it adds both the timely danger-window response path and the later stop-like weak-side exit before rebound.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_risk_response_and_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "recovery_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely risk response and stop-like forced exit before rebound is a richer recovery-aware storyline than recovery with balanced management and stop-like forced exit before rebound because it adds explicit danger-window timing detail.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_defensive_final_exit_after_deterioration",
    suppressedPatternId:
      "balanced_management_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and defensive final exit after deterioration is a richer storyline because it adds the early-adversity recovery path to the balanced-management defensive-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_defensive_final_exit_after_deterioration",
    suppressedPatternId: "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and defensive final exit after deterioration is a richer recovery-failure storyline than broad recovery after early adversity with failed protection alone because it adds balanced management context and the later defensive final exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "recovery_with_balanced_management_and_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and stop-like forced exit after breakdown is a stricter recovery-aware storyline than recovery with balanced management and defensive final exit after deterioration because it distinguishes a stop-like breakdown exit from a broader defensive save.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "recovery_with_balanced_management_and_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and stop-like forced exit before rebound is a stricter recovery-aware storyline than recovery with balanced management and defensive final exit after deterioration because it distinguishes a stop-like weak-side exit from a broader defensive save.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_trim_into_strength_and_constructive_final_exit",
    suppressedPatternId: "trim_into_strength_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with trim into strength and constructive final exit is a richer storyline because it adds the early-adversity recovery path to the constructive trim-and-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_trim_into_strength_and_constructive_final_exit",
    suppressedPatternId: "constructive_recovery_after_early_adversity",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with trim into strength and constructive final exit is a richer recovery-aware storyline than broad constructive recovery alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_trim_into_strength_and_constructive_final_exit",
    suppressedPatternId: "stabilized_recovery_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with trim into strength and constructive final exit is a richer recovery-aware storyline than the broad stabilized-recovery constructive-final-exit pattern because it adds explicit trim-into-strength management context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_trim_into_strength_and_constructive_final_exit",
    suppressedPatternId:
      "recovery_with_balanced_management_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with trim into strength and constructive final exit is a richer recovery-aware storyline than recovery with balanced management and constructive final exit because it adds explicit trim-into-strength management context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_trim_into_strength_and_premature_final_exit",
    suppressedPatternId: "trim_into_strength_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with trim into strength and premature final exit is a richer storyline because it adds the early-adversity recovery path to the trim-into-strength premature-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_trim_into_strength_and_premature_final_exit",
    suppressedPatternId: "stabilized_recovery_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with trim into strength and premature final exit is a richer recovery-aware storyline than the broad stabilized-recovery premature-final-exit pattern because it adds explicit trim-into-strength management context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_trim_into_strength_and_premature_final_exit",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with trim into strength and premature final exit is a richer storyline than broad recovery after early adversity with stabilized management because it adds the final premature-exit outcome to the trim-into-strength path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_trim_into_strength_and_premature_final_exit",
    suppressedPatternId:
      "recovery_with_balanced_management_and_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with trim into strength and premature final exit is a richer recovery-aware storyline than recovery with balanced management and premature final exit because it adds explicit trim-into-strength context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_trim_into_resistance_and_constructive_final_exit",
    suppressedPatternId: "trim_into_resistance_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with trim into resistance and constructive final exit is a richer storyline because it adds the early-adversity recovery path to the resistance-aware trim and constructive-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_trim_into_resistance_and_constructive_final_exit",
    suppressedPatternId:
      "recovery_with_trim_into_strength_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with trim into resistance and constructive final exit is a richer recovery-aware storyline than recovery with trim into strength and constructive final exit because it adds explicit nearby resistance context to the trim.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_trim_into_resistance_and_premature_final_exit",
    suppressedPatternId: "trim_into_resistance_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with trim into resistance and premature final exit is a richer storyline because it adds the early-adversity recovery path to the resistance-aware trim and premature-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_trim_into_resistance_and_premature_final_exit",
    suppressedPatternId:
      "recovery_with_trim_into_strength_and_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with trim into resistance and premature final exit is a richer recovery-aware storyline than recovery with trim into strength and premature final exit because it adds explicit nearby resistance context to the trim.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_trim_into_resistance_and_premature_final_exit",
    suppressedPatternId:
      "stabilized_recovery_with_exit_into_resistance_before_breakout",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with trim into resistance and premature final exit is a richer recovery-aware resistance storyline than stabilized recovery with exit into resistance before breakout because it adds earlier trim management context before the premature final exit.",
  }),
  defineDominanceRule({
    dominantPatternId: "timely_trim_into_strength_with_constructive_final_exit",
    suppressedPatternId: "trim_into_strength_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Timely trim into strength with constructive final exit is a richer whole-trade storyline because it adds explicit timely risk-response timing to the trim-into-strength constructive path.",
  }),
  defineDominanceRule({
    dominantPatternId: "timely_trim_into_strength_with_constructive_final_exit",
    suppressedPatternId: "timely_profit_protection_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Timely trim into strength with constructive final exit is a richer whole-trade storyline because it adds explicit trim-into-strength context to the timely protective response and constructive-exit path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_trim_into_strength_and_constructive_final_exit",
    suppressedPatternId: "timely_trim_into_strength_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely trim into strength and constructive final exit is a richer storyline because it adds the early-adversity recovery path to the timely trim-into-strength constructive sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_trim_into_strength_and_constructive_final_exit",
    suppressedPatternId:
      "recovery_with_trim_into_strength_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely trim into strength and constructive final exit is a richer storyline because it adds explicit timely risk-response timing to the recovery-aware trim-into-strength constructive path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_trim_into_strength_and_constructive_final_exit",
    suppressedPatternId:
      "recovery_with_timely_profit_protection_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely trim into strength and constructive final exit is a richer storyline because it adds explicit trim-into-strength context to the recovery-aware timely protection and constructive-exit path.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_trim_readd_with_constructive_management",
    suppressedPatternId: "trim_readd_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with constructive management is a richer multi-cycle storyline than the one-cycle constructive trim/re-add exit pattern.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_readd_with_constructive_final_exit",
    suppressedPatternId: "trim_into_strength_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Trim re-add with constructive final exit is a richer one-cycle storyline than broad trim into strength with constructive final exit because it includes the later re-entry sequence.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_trim_readd_with_constructive_management",
    suppressedPatternId: "constructive_readd_after_reduction",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with constructive management is a richer repeated-cycle storyline than broad constructive re-add after reduction.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_trim_readd_with_unstable_management",
    suppressedPatternId: "trim_readd_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with unstable management is a richer multi-cycle storyline than the one-cycle missed-final-continuation variant.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_trim_readd_with_unstable_management",
    suppressedPatternId: "readd_after_reduction",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with unstable management is a richer repeated-cycle storyline than the broad re-add-after-reduction fact.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_rescue_attempts_with_renewed_deterioration",
    suppressedPatternId: "repeated_trim_readd_with_unstable_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with renewed deterioration is a richer repeated-cycle failure storyline because it includes the earlier recovery attempt before the trade deteriorated again.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_rescue_attempts_with_renewed_deterioration",
    suppressedPatternId: "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with renewed deterioration is a richer rescue-failure storyline than broad recovery after early adversity with failed protection.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_rescue_attempts_with_renewed_deterioration",
    suppressedPatternId: "readd_after_delayed_risk_response",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with renewed deterioration includes delayed rescue behavior plus the repeated-cycle deterioration outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "late_chase_reentry_after_constructive_trim",
    suppressedPatternId: "add_after_recent_run_up",
    outcome: "demote_to_supporting",
    reason:
      "Late chase re-entry after constructive trim is a richer re-entry storyline than the broad add-after-recent-run-up fact.",
  }),
  defineDominanceRule({
    dominantPatternId: "late_chase_reentry_after_constructive_trim",
    suppressedPatternId: "readd_after_reduction",
    outcome: "demote_to_supporting",
    reason:
      "Late chase re-entry after constructive trim is a richer re-entry storyline than the broad re-add-after-reduction fact.",
  }),
  defineDominanceRule({
    dominantPatternId: "good_pullback_reentry_after_constructive_trim",
    suppressedPatternId: "add_after_recent_drop",
    outcome: "demote_to_supporting",
    reason:
      "Good pullback re-entry after constructive trim is a richer re-entry storyline than the broad add-after-recent-drop fact.",
  }),
  defineDominanceRule({
    dominantPatternId: "good_pullback_reentry_after_constructive_trim",
    suppressedPatternId: "readd_after_reduction",
    outcome: "demote_to_supporting",
    reason:
      "Good pullback re-entry after constructive trim is a richer re-entry storyline than the broad re-add-after-reduction fact.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_reentry_followthrough_after_trim",
    suppressedPatternId: "readd_after_reduction",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-entry followthrough after trim is a richer re-entry storyline than the broad re-add-after-reduction fact.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_reentry_followthrough_after_trim",
    suppressedPatternId: "good_pullback_reentry_after_constructive_trim",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-entry followthrough after trim is a richer storyline because it includes what happened after the re-entry, not just the pullback setup before it.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_reentry_followthrough_after_trim",
    suppressedPatternId: "late_chase_reentry_after_constructive_trim",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-entry followthrough after trim is a richer storyline because it includes what happened after the re-entry, not just the chase-style setup before it.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_reentry_followthrough_after_trim",
    suppressedPatternId: "constructive_readd_after_reduction",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-entry followthrough after trim is a richer sequence pattern because it includes trim context plus favorable post-reentry followthrough.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_reentry_with_constructive_final_exit",
    suppressedPatternId: "constructive_reentry_followthrough_after_trim",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-entry with constructive final exit is a richer one-cycle storyline because it adds the constructive final-exit outcome to the constructive re-entry path.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_reentry_with_constructive_final_exit",
    suppressedPatternId: "trim_readd_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-entry with constructive final exit is a richer one-cycle storyline because it includes both constructive re-entry quality and the constructive final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_reentry_with_constructive_final_exit",
    suppressedPatternId: "constructive_readd_after_reduction",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-entry with constructive final exit is a richer one-cycle storyline than broad constructive re-add after reduction because it includes trim context, favorable post-reentry followthrough, and the constructive exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_reentry_with_premature_final_exit",
    suppressedPatternId: "constructive_reentry_followthrough_after_trim",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-entry with premature final exit is a richer one-cycle storyline because it adds the premature final-exit outcome to the constructive re-entry path.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_reentry_with_premature_final_exit",
    suppressedPatternId: "trim_readd_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-entry with premature final exit is a richer one-cycle storyline because it includes both constructive re-entry quality and the premature final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_reentry_with_premature_final_exit",
    suppressedPatternId: "premature_final_exit_after_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-entry with premature final exit is a richer whole-trade storyline than broad premature final exit after constructive management because it adds explicit trim and constructive re-entry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "constructive_reentry_followthrough_after_trim",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-entry with stop-like forced exit after breakdown is a richer one-cycle storyline because it adds the later stop-like breakdown exit outcome to the constructive re-entry path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-entry with stop-like forced exit after breakdown is a richer whole-trade storyline than the broad stop-like breakdown exit because it adds explicit constructive trim-and-reentry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "constructive_reentry_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "constructive_reentry_followthrough_after_trim",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-entry with stop-like forced exit before rebound is a richer one-cycle storyline because it adds the later stop-like weak-side exit before rebound to the constructive re-entry path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "constructive_reentry_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-entry with stop-like forced exit before rebound is a richer whole-trade storyline than the broad stop-like rebound exit because it adds explicit constructive trim-and-reentry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "constructive_reentry_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "constructive_reentry_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-entry with stop-like forced exit before rebound is a richer one-cycle storyline than constructive re-entry with premature final exit because it distinguishes a stop-like weak-side exit from a broader early exit before continuation.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_constructive_final_exit_after_constructive_reentry",
    suppressedPatternId: "constructive_reentry_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with constructive final exit after constructive re-entry is a richer storyline because it adds the early-adversity recovery path to the constructive re-entry and constructive-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_constructive_final_exit_after_constructive_reentry",
    suppressedPatternId: "stabilized_recovery_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with constructive final exit after constructive re-entry is a richer recovery-aware storyline than the broad stabilized-recovery constructive-final-exit pattern because it adds explicit trim and re-entry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_constructive_final_exit_after_constructive_reentry",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with constructive final exit after constructive re-entry is a richer storyline than broad recovery after early adversity with stabilized management because it adds the constructive re-entry and final-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_constructive_final_exit_after_constructive_reentry",
    suppressedPatternId:
      "recovery_with_balanced_management_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with constructive final exit after constructive re-entry is a richer recovery-aware storyline than recovery with balanced management and constructive final exit because it adds explicit trim-and-reentry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_premature_final_exit_after_constructive_reentry",
    suppressedPatternId: "constructive_reentry_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with premature final exit after constructive re-entry is a richer storyline because it adds the early-adversity recovery path to the constructive re-entry and premature-final-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_premature_final_exit_after_constructive_reentry",
    suppressedPatternId: "stabilized_recovery_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with premature final exit after constructive re-entry is a richer recovery-aware storyline than the broad stabilized-recovery premature-final-exit pattern because it adds explicit trim and constructive re-entry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_premature_final_exit_after_constructive_reentry",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with premature final exit after constructive re-entry is a richer storyline than broad recovery after early adversity with stabilized management because it adds the constructive re-entry and final premature-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_stop_like_forced_exit_after_constructive_reentry",
    suppressedPatternId:
      "constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with stop-like forced exit after constructive re-entry is a richer storyline because it adds the early-adversity recovery path to the constructive re-entry and stop-like breakdown-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_stop_like_forced_exit_after_constructive_reentry",
    suppressedPatternId:
      "stabilized_recovery_with_stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with stop-like forced exit after constructive re-entry is a richer recovery-aware storyline than the broad stabilized-recovery stop-like breakdown pattern because it adds explicit trim and constructive re-entry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_stop_like_forced_exit_after_constructive_reentry",
    suppressedPatternId: "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with stop-like forced exit after constructive re-entry is a richer recovery-failure storyline because it adds the constructive re-entry sequence to the later failed-protection stop-like breakdown outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_stop_like_forced_exit_before_rebound_after_constructive_reentry",
    suppressedPatternId:
      "constructive_reentry_with_stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with stop-like forced exit before rebound after constructive re-entry is a richer storyline because it adds the early-adversity recovery path to the constructive re-entry and stop-like rebound-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_stop_like_forced_exit_before_rebound_after_constructive_reentry",
    suppressedPatternId:
      "stabilized_recovery_with_stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with stop-like forced exit before rebound after constructive re-entry is a richer recovery-aware storyline than the broad stabilized-recovery stop-like rebound pattern because it adds explicit trim and constructive re-entry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_stop_like_forced_exit_before_rebound_after_constructive_reentry",
    suppressedPatternId: "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with stop-like forced exit before rebound after constructive re-entry is a richer recovery-failure storyline because it adds the constructive re-entry sequence to the later failed-protection stop-like rebound outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_stop_like_forced_exit_before_rebound_after_constructive_reentry",
    suppressedPatternId:
      "recovery_with_premature_final_exit_after_constructive_reentry",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with stop-like forced exit before rebound after constructive re-entry is a richer recovery-aware storyline than recovery with premature final exit after constructive re-entry because it distinguishes a stop-like weak-side exit from a broader early exit before continuation.",
  }),
  defineDominanceRule({
    dominantPatternId: "deteriorating_reentry_after_trim",
    suppressedPatternId: "readd_after_reduction",
    outcome: "demote_to_supporting",
    reason:
      "Deteriorating re-entry after trim is a richer re-entry storyline than the broad re-add-after-reduction fact.",
  }),
  defineDominanceRule({
    dominantPatternId: "deteriorating_reentry_after_trim",
    suppressedPatternId: "good_pullback_reentry_after_constructive_trim",
    outcome: "demote_to_supporting",
    reason:
      "Deteriorating re-entry after trim is a richer storyline because it includes what happened after the re-entry, not just the pullback setup before it.",
  }),
  defineDominanceRule({
    dominantPatternId: "deteriorating_reentry_after_trim",
    suppressedPatternId: "late_chase_reentry_after_constructive_trim",
    outcome: "demote_to_supporting",
    reason:
      "Deteriorating re-entry after trim is a richer storyline because it includes what happened after the re-entry, not just the chase-style setup before it.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_trim_readd_with_constructive_reentry_followthrough",
    suppressedPatternId: "constructive_reentry_followthrough_after_trim",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with constructive re-entry followthrough is a richer repeated-cycle storyline than the one-cycle constructive re-entry followthrough pattern.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_trim_readd_with_constructive_reentry_followthrough",
    suppressedPatternId: "good_pullback_reentry_after_constructive_trim",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with constructive re-entry followthrough includes the repeated-cycle re-entry setup plus stronger favorable followthrough after the reloads.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_constructive_final_exit",
    suppressedPatternId: "constructive_reentry_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with constructive final exit is a richer repeated-cycle storyline than the one-cycle constructive re-entry and constructive-exit variant.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_premature_final_exit",
    suppressedPatternId: "constructive_reentry_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with premature final exit is a richer repeated-cycle storyline than the one-cycle constructive re-entry and premature-final-exit variant.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with stop-like forced exit after breakdown is a richer repeated-cycle storyline than the one-cycle constructive re-entry and stop-like breakdown-exit variant.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "constructive_reentry_with_stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with stop-like forced exit before rebound is a richer repeated-cycle storyline than the one-cycle constructive re-entry and stop-like rebound-exit variant.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_trim_readd_with_constructive_reentry_followthrough",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with constructive re-entry followthrough is a richer repeated-cycle storyline than broad constructive repeated trim/re-add management alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_trim_readd_with_deteriorating_reentry",
    suppressedPatternId: "deteriorating_reentry_after_trim",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with deteriorating re-entry is a richer repeated-cycle storyline than the one-cycle deteriorating re-entry pattern.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_trim_readd_with_deteriorating_reentry",
    suppressedPatternId: "late_chase_reentry_after_constructive_trim",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with deteriorating re-entry includes the repeated-cycle chase-style reload context plus stronger adverse followthrough after the reloads.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_trim_readd_with_deteriorating_reentry",
    suppressedPatternId: "repeated_trim_readd_with_unstable_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with deteriorating re-entry is a richer repeated-cycle failure storyline than broad unstable repeated trim/re-add management alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_premature_final_exit",
    suppressedPatternId:
      "repeated_trim_readd_with_constructive_reentry_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with premature final exit is a richer repeated-cycle storyline because it adds the premature final-exit outcome to the constructive re-entry path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_constructive_final_exit",
    suppressedPatternId:
      "repeated_balanced_management_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with constructive final exit is a richer repeated-cycle storyline than broad repeated balanced management with constructive final exit because it includes explicit constructive re-entry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_constructive_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with constructive final exit is a richer repeated-cycle storyline than the broad repeated constructive-final-exit pattern because it captures active trim-and-readd management before the constructive finish.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_constructive_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with constructive final exit is a richer repeated-cycle storyline than broad constructive repeated trim-readd management because it adds the constructive final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_trim_into_resistance_and_constructive_final_exit",
    suppressedPatternId:
      "repeated_balanced_management_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with trim into resistance and constructive final exit is a richer repeated-cycle storyline than broad repeated balanced management with constructive final exit because it adds explicit nearby resistance context to the repeated trims.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_take_profit_into_resistance_and_constructive_final_exit",
    suppressedPatternId:
      "repeated_balanced_management_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with take profit into resistance and constructive final exit is a richer repeated-cycle storyline than broad repeated balanced management with constructive final exit because it adds explicit nearby resistance context to the repeated profit-taking path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_trim_into_resistance_and_constructive_final_exit",
    suppressedPatternId:
      "repeated_balanced_management_with_take_profit_into_resistance_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with trim into resistance and constructive final exit is a richer local repeated-cycle storyline than the broader repeated take-profit-into-resistance summary because it adds the stricter trim-specific structure.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_take_profit_into_resistance_and_constructive_final_exit",
    suppressedPatternId:
      "repeated_balanced_management_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with take profit into resistance and constructive final exit is a richer repeated-cycle storyline than broad repeated balanced management with constructive final exit because it adds explicit nearby resistance context to the repeated profit-taking path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_trim_into_resistance_and_constructive_final_exit",
    suppressedPatternId:
      "repeated_balanced_management_with_take_profit_into_resistance_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with trim into resistance and constructive final exit is a richer local repeated-cycle storyline than the broader repeated take-profit-into-resistance summary because it adds the stricter trim-specific structure.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_trim_into_resistance_and_constructive_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with trim into resistance and constructive final exit is a richer repeated-cycle storyline than the broad repeated constructive-final-exit pattern because it captures both active repeated trim-and-readd management and repeated resistance-aware trimming.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_trim_into_resistance_and_constructive_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with trim into resistance and constructive final exit is a richer repeated-cycle storyline than broad constructive repeated trim-readd management because it adds both the constructive final-exit outcome and repeated resistance-aware trim context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_constructive_final_exit",
    suppressedPatternId:
      "repeated_trim_readd_with_constructive_reentry_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with constructive final exit is a richer repeated-cycle storyline because it adds the constructive final-exit outcome to the constructive re-entry path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_constructive_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with constructive final exit is a richer repeated-cycle storyline because it includes both constructive re-entry quality and the constructive final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "repeated_balanced_management_with_stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with stop-like forced exit after breakdown is a richer repeated-cycle storyline than broad repeated balanced management with stop-like breakdown exit because it includes explicit constructive re-entry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with stop-like forced exit after breakdown is a richer repeated-cycle storyline than the broad repeated defensive-exit path because it distinguishes a stop-like breakdown exit after active repeated management.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with stop-like forced exit after breakdown is a richer repeated-cycle storyline than broad constructive repeated trim-readd management because it adds the later stop-like breakdown-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "repeated_trim_readd_with_constructive_reentry_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with stop-like forced exit after breakdown is a richer repeated-cycle storyline because it adds the stop-like breakdown-exit outcome to the constructive re-entry path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "held_through_danger_with_stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with stop-like forced exit after breakdown is a richer whole-trade storyline because it includes repeated constructive re-entry quality before the later stop-like breakdown exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with stop-like forced exit after breakdown is a richer repeated-cycle storyline than broad constructive repeated trim/re-add management because it includes both re-entry quality and the later stop-like breakdown-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "repeated_balanced_management_with_stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with stop-like forced exit before rebound is a richer repeated-cycle storyline than broad repeated balanced management with stop-like rebound exit because it includes explicit constructive re-entry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "repeated_trim_readd_with_fearful_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with stop-like forced exit before rebound is a richer repeated-cycle storyline than the broad repeated fearful-exit path because it distinguishes a stop-like rebound exit after active repeated management.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with stop-like forced exit before rebound is a richer repeated-cycle storyline than broad constructive repeated trim-readd management because it adds the later stop-like rebound-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "repeated_trim_readd_with_constructive_reentry_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with stop-like forced exit before rebound is a richer repeated-cycle storyline because it adds the stop-like rebound-exit outcome to the constructive re-entry path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "held_through_danger_with_stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with stop-like forced exit before rebound is a richer whole-trade storyline because it includes repeated constructive re-entry quality before the later stop-like rebound exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with stop-like forced exit before rebound is a richer repeated-cycle storyline than broad constructive repeated trim/re-add management because it includes both re-entry quality and the later stop-like rebound-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "repeated_constructive_reentry_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with stop-like forced exit before rebound is a richer repeated-cycle storyline than repeated constructive re-entry with premature final exit because it distinguishes a stop-like weak-side exit from a broader early exit before continuation.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_constructive_final_exit",
    suppressedPatternId: "constructive_reentry_followthrough_after_trim",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with constructive final exit is a richer storyline than the one-cycle constructive re-entry followthrough pattern.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_constructive_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with constructive final exit is a richer repeated-cycle storyline than broad constructive repeated trim/re-add management because it includes both re-entry quality and the constructive final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_missed_final_continuation",
    suppressedPatternId: "missed_post_exit_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with missed final continuation is a richer repeated-cycle storyline than broad missed post-exit continuation alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_missed_final_continuation",
    suppressedPatternId: "repeated_trim_readd_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with missed final continuation is a richer repeated-cycle storyline than the broad repeated missed-continuation pattern because it captures active trim-and-readd management before the final exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_missed_final_continuation",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with missed final continuation is a richer repeated-cycle storyline than broad constructive repeated trim-readd management because it adds the missed-final-continuation outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_exit_into_stacked_support_and_relief",
    suppressedPatternId: "exit_into_stacked_support_with_relief_after_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with exit into stacked support and relief is a richer repeated-cycle storyline than the raw stacked-support relief exit pattern alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_exit_into_stacked_support_and_relief",
    suppressedPatternId: "repeated_balanced_management_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with exit into stacked support and relief is a stricter repeated-cycle storyline than broad repeated balanced management with missed final continuation because it adds support-structure context at the final exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_exit_into_stacked_support_and_relief",
    suppressedPatternId: "repeated_trim_readd_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with exit into stacked support and relief is a richer repeated-cycle storyline than the broad repeated missed-continuation pattern because it captures active trim-and-readd management plus stacked-support relief context at the final exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_exit_into_stacked_support_and_relief",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with exit into stacked support and relief is a richer repeated-cycle storyline than broad constructive repeated trim-readd management because it adds support-aware post-exit relief context.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_balanced_management_with_fearful_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_fearful_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with fearful final exit is a richer repeated-cycle storyline than the broad repeated fearful-exit path because it captures active trim-and-readd management before the later fearful exit.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_balanced_management_with_fearful_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with fearful final exit is a richer repeated-cycle storyline than broad constructive repeated trim-readd management because it adds the fearful final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_balanced_management_with_fearful_final_exit",
    suppressedPatternId: "repeated_balanced_management_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with fearful final exit is a stricter repeated-cycle storyline than broad repeated balanced management with missed final continuation because it specifies the weak fearful exit path before rebound.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_premature_final_exit",
    suppressedPatternId: "repeated_balanced_management_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with premature final exit is a stricter repeated-cycle storyline than broad repeated balanced management with missed final continuation because it adds explicit constructive re-entry quality and a stronger early-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_balanced_management_with_premature_final_exit",
    suppressedPatternId: "repeated_balanced_management_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with premature final exit is a stricter repeated-cycle storyline than broad repeated balanced management with missed final continuation because it captures an earlier and cleaner early-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "repeated_balanced_management_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with stop-like forced exit before rebound is a stricter repeated-cycle storyline than broad repeated balanced management with missed final continuation because it distinguishes a weak-side stop-like exit from a broad continuation miss.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_trim_readd_with_fearful_final_exit",
    suppressedPatternId: "repeated_balanced_management_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with fearful final exit is a stricter repeated-cycle storyline than broad repeated balanced management with missed final continuation because it specifies the weak-side fearful exit path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_premature_final_exit",
    suppressedPatternId: "repeated_balanced_management_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with premature final exit is a richer repeated-cycle storyline than broad repeated balanced management with premature final exit because it includes both the repeated management path and explicit constructive re-entry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_premature_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with premature final exit is a richer repeated-cycle storyline than the broad repeated premature-final-exit pattern because it captures active trim-and-readd management before the early final exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_premature_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with premature final exit is a richer repeated-cycle storyline than broad constructive repeated trim-readd management because it adds the premature final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_trim_into_resistance_and_premature_final_exit",
    suppressedPatternId: "repeated_balanced_management_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with trim into resistance and premature final exit is a richer repeated-cycle storyline than broad repeated balanced management with premature final exit because it adds explicit nearby resistance context to the repeated trims.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_take_profit_into_resistance_and_premature_final_exit",
    suppressedPatternId:
      "repeated_balanced_management_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with take profit into resistance and premature final exit is a richer repeated-cycle storyline than broad repeated balanced management with premature final exit because it adds explicit nearby resistance context to the repeated profit-taking path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_trim_into_resistance_and_premature_final_exit",
    suppressedPatternId:
      "repeated_balanced_management_with_take_profit_into_resistance_and_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with trim into resistance and premature final exit is a richer local repeated-cycle storyline than the broader repeated take-profit-into-resistance premature summary because it adds the stricter trim-specific structure.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_take_profit_into_resistance_and_premature_final_exit",
    suppressedPatternId:
      "repeated_balanced_management_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with take profit into resistance and premature final exit is a richer repeated-cycle storyline than broad repeated balanced management with premature final exit because it adds explicit nearby resistance context to the repeated profit-taking path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_trim_into_resistance_and_premature_final_exit",
    suppressedPatternId:
      "repeated_balanced_management_with_take_profit_into_resistance_and_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with trim into resistance and premature final exit is a richer local repeated-cycle storyline than the broader repeated take-profit-into-resistance premature summary because it adds the stricter trim-specific structure.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_trim_into_resistance_and_premature_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with trim into resistance and premature final exit is a richer repeated-cycle storyline than the broad repeated premature-final-exit pattern because it captures both active repeated trim-and-readd management and repeated resistance-aware trimming.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_trim_into_resistance_and_premature_final_exit",
    suppressedPatternId: "repeated_balanced_management_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with trim into resistance and premature final exit is a stricter repeated-cycle storyline than broad repeated balanced management with missed final continuation because it adds explicit resistance-aware trim context and a cleaner early-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_premature_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with premature final exit is a richer repeated-cycle storyline because it includes both constructive re-entry quality and the premature final exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_premature_final_exit",
    suppressedPatternId: "constructive_reentry_followthrough_after_trim",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with premature final exit is a richer storyline than the one-cycle constructive re-entry followthrough pattern.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_premature_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with premature final exit is a richer repeated-cycle storyline than broad constructive repeated trim/re-add management because it includes both re-entry quality and the final premature-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_deteriorating_reentry_with_defensive_final_exit",
    suppressedPatternId:
      "repeated_balanced_management_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated deteriorating re-entry with defensive final exit is a richer repeated-cycle storyline than the broad repeated balanced-management defensive-save summary because it includes explicit re-entry-deterioration detail.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_deteriorating_reentry_with_defensive_final_exit",
    suppressedPatternId:
      "repeated_trim_readd_with_deteriorating_reentry",
    outcome: "demote_to_supporting",
    reason:
      "Repeated deteriorating re-entry with defensive final exit is a richer repeated-cycle storyline because it adds the defensive final-exit outcome to the deteriorating re-entry path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_deteriorating_reentry_with_defensive_final_exit",
    suppressedPatternId:
      "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated deteriorating re-entry with defensive final exit is a richer repeated-cycle storyline because it includes both deteriorating re-entry quality and the defensive final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_deteriorating_reentry_with_defensive_final_exit",
    suppressedPatternId: "deteriorating_reentry_after_trim",
    outcome: "demote_to_supporting",
    reason:
      "Repeated deteriorating re-entry with defensive final exit is a richer storyline than the one-cycle deteriorating re-entry pattern.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_deteriorating_reentry_with_defensive_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_unstable_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated deteriorating re-entry with defensive final exit is a richer repeated-cycle failure storyline than broad unstable repeated trim/re-add management because it includes both re-entry deterioration and the final defensive-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_missed_final_continuation",
    suppressedPatternId:
      "repeated_balanced_management_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and missed final continuation is a richer storyline than the broad repeated balanced-management missed-continuation summary because it adds the early-adversity recovery path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_missed_final_continuation",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and missed final continuation is a richer recovery-aware storyline than broad recovery after early adversity with stabilized management alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_missed_final_continuation",
    suppressedPatternId: "repeated_trim_readd_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and missed final continuation is a richer recovery-aware storyline than the broad repeated missed-final-continuation pattern because it adds both repeated rescue context and balanced repeated management.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_missed_final_continuation",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and missed final continuation is a richer recovery-aware storyline than broad constructive repeated trim-readd management alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_exit_into_stacked_support_and_relief",
    suppressedPatternId:
      "repeated_balanced_management_with_exit_into_stacked_support_and_relief",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and exit into stacked support and relief is a richer storyline than the broad repeated balanced-management stacked-support relief summary because it adds the early-adversity recovery path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_exit_into_stacked_support_and_relief",
    suppressedPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and exit into stacked support and relief is a stricter recovery-aware storyline than the broad repeated balanced-management missed-continuation summary because it adds support-structure context at the final exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_exit_into_stacked_support_and_relief",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and exit into stacked support and relief is a richer recovery-aware storyline than broad recovery after early adversity with stabilized management alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_exit_into_stacked_support_and_relief",
    suppressedPatternId: "repeated_trim_readd_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and exit into stacked support and relief is a richer recovery-aware storyline than the broad repeated missed-continuation pattern because it adds rescue context, balanced repeated management, and stacked-support relief detail.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_defensive_final_exit_after_deterioration",
    suppressedPatternId:
      "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with defensive final exit after deterioration is a richer repeated-cycle storyline than the broad repeated defensive-exit path because it captures active trim-and-readd management before the later defensive save.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_defensive_final_exit_after_deterioration",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with defensive final exit after deterioration is a richer repeated-cycle storyline than broad constructive repeated trim-readd management because it adds the later defensive-save outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_exit_into_thin_support_before_breakdown",
    suppressedPatternId: "exit_into_thin_support_before_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with exit into thin support before breakdown is a richer repeated-cycle storyline than the raw thin-support breakdown exit pattern alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_exit_into_thin_support_before_breakdown",
    suppressedPatternId:
      "repeated_balanced_management_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with exit into thin support before breakdown is a stricter repeated-cycle storyline than the broad repeated defensive-save summary because it adds explicit thin-support failure context at the final exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_exit_into_thin_support_before_breakdown",
    suppressedPatternId:
      "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with exit into thin support before breakdown is a richer repeated-cycle storyline than the broad repeated defensive-exit path because it captures active trim-and-readd management plus thin-support failure context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_exit_into_thin_support_before_breakdown",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with exit into thin support before breakdown is a richer repeated-cycle failure storyline than broad constructive repeated trim-readd management because it adds the later thin-support breakdown outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "repeated_balanced_management_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with stop-like forced exit after breakdown is a stricter repeated-cycle storyline than repeated balanced management with defensive final exit after deterioration because it distinguishes a stop-like breakdown exit from a broader defensive save.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "repeated_balanced_management_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with stop-like forced exit before rebound is a stricter repeated-cycle storyline than repeated balanced management with defensive final exit after deterioration because it distinguishes a stop-like weak-side exit from a broader defensive save.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_premature_final_exit_after_constructive_reentries",
    suppressedPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with premature final exit after constructive re-entries is a stricter recovery-aware repeated-cycle storyline than the broad repeated balanced-management missed-continuation summary because it adds explicit constructive re-entry quality and a stronger early-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_premature_final_exit",
    suppressedPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and premature final exit is a stricter recovery-aware storyline than the broad repeated balanced-management missed-continuation summary because it captures an earlier and cleaner early-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and stop-like forced exit before rebound is a stricter recovery-aware storyline than the broad repeated balanced-management missed-continuation summary because it distinguishes a weak-side stop-like exit from a broad continuation miss.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_premature_final_exit_after_constructive_reentries",
    suppressedPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with premature final exit after constructive re-entries is a richer recovery-aware repeated-cycle storyline than the broad repeated balanced-management premature-exit summary because it adds explicit constructive re-entry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_premature_final_exit",
    suppressedPatternId: "repeated_balanced_management_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and premature final exit is a richer storyline than the broad repeated balanced-management premature-exit summary because it adds the early-adversity recovery path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_take_profit_into_resistance_and_premature_final_exit",
    suppressedPatternId:
      "repeated_balanced_management_with_take_profit_into_resistance_and_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and take profit into resistance and premature final exit is a richer recovery-aware storyline than the non-recovery repeated take-profit-into-resistance premature branch because it adds the early-adversity rescue path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_take_profit_into_resistance_and_premature_final_exit",
    suppressedPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and take profit into resistance and premature final exit is a richer recovery-aware storyline than broad repeated rescue balanced management with premature final exit because it adds explicit nearby resistance context to the repeated profit-taking path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_premature_final_exit",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and premature final exit is a richer recovery-aware storyline than broad recovery after early adversity with stabilized management alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_premature_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and premature final exit is a richer recovery-aware storyline than the broad repeated premature-final-exit pattern because it adds both repeated rescue context and balanced repeated management.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_premature_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and premature final exit is a richer recovery-aware storyline than broad constructive repeated trim-readd management alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_trim_into_resistance_and_premature_final_exit",
    suppressedPatternId:
      "repeated_balanced_management_with_trim_into_resistance_and_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and trim into resistance and premature final exit is a richer recovery-aware storyline than the non-recovery repeated resistance-aware trim branch because it adds the early-adversity rescue path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_trim_into_resistance_and_premature_final_exit",
    suppressedPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_take_profit_into_resistance_and_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and trim into resistance and premature final exit is a richer local repeated-cycle storyline than the broader recovery-aware take-profit-into-resistance premature summary because it adds the stricter trim-specific structure.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_trim_into_resistance_and_premature_final_exit",
    suppressedPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and trim into resistance and premature final exit is a richer recovery-aware storyline than broad repeated rescue balanced management with premature final exit because it adds explicit nearby resistance context to the repeated trims.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "repeated_balanced_management_with_fearful_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with stop-like forced exit before rebound is a stricter repeated-cycle storyline than repeated balanced management with fearful final exit because it distinguishes a stop-like weak-side exit from a broader fearful one.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_fearful_final_exit",
    suppressedPatternId: "repeated_balanced_management_with_fearful_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and fearful final exit is a richer storyline than the broad repeated balanced-management fearful-exit summary because it adds the early-adversity recovery path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_fearful_final_exit",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and fearful final exit is a richer recovery-aware storyline than broad recovery after early adversity with stabilized management alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_fearful_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_fearful_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and fearful final exit is a richer recovery-aware storyline than the broad repeated fearful-exit path because it adds rescue context before the later fearful exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_fearful_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and stop-like forced exit before rebound is a stricter recovery-aware storyline than repeated rescue attempts with balanced management and fearful final exit because it distinguishes a stop-like weak-side exit from a broader fearful one.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_defensive_final_exit_after_deterioration",
    suppressedPatternId:
      "repeated_balanced_management_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and defensive final exit after deterioration is a richer storyline than the broad repeated balanced-management defensive-save summary because it adds the early-adversity recovery path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_defensive_final_exit_after_deterioration",
    suppressedPatternId:
      "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and defensive final exit after deterioration is a richer recovery-failure storyline than broad recovery after early adversity with failed protection alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_defensive_final_exit_after_deterioration",
    suppressedPatternId:
      "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and defensive final exit after deterioration is a richer recovery-aware storyline than the broad repeated defensive-exit pattern because it adds both rescue context and balanced repeated management.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_defensive_final_exit_after_deterioration",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and defensive final exit after deterioration is a richer recovery-aware storyline than broad constructive repeated trim-readd management alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_exit_into_thin_support_before_breakdown",
    suppressedPatternId:
      "repeated_balanced_management_with_exit_into_thin_support_before_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and exit into thin support before breakdown is a richer storyline than the broad repeated balanced-management thin-support failure summary because it adds the early-adversity recovery path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_exit_into_thin_support_before_breakdown",
    suppressedPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and exit into thin support before breakdown is a stricter recovery-aware storyline than the broad repeated defensive-save summary because it adds explicit thin-support failure context at the final exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_exit_into_thin_support_before_breakdown",
    suppressedPatternId:
      "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and exit into thin support before breakdown is a richer recovery-failure storyline than broad recovery after early adversity with failed protection alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_exit_into_thin_support_before_breakdown",
    suppressedPatternId:
      "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and exit into thin support before breakdown is a richer recovery-aware storyline than the broad repeated defensive-exit path because it adds rescue context, balanced repeated management, and thin-support failure detail.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and stop-like forced exit after breakdown is a stricter recovery-aware storyline than repeated rescue attempts with balanced management and defensive final exit after deterioration because it distinguishes a stop-like breakdown exit from a broader defensive save.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and stop-like forced exit before rebound is a stricter recovery-aware storyline than repeated rescue attempts with balanced management and defensive final exit after deterioration because it distinguishes a stop-like weak-side exit from a broader defensive save.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_premature_final_exit_after_constructive_reentries",
    suppressedPatternId:
      "repeated_constructive_reentry_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with premature final exit after constructive re-entries is a richer storyline because it adds the early-adversity recovery path to the repeated constructive re-entry and premature-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_premature_final_exit_after_constructive_reentries",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with premature final exit after constructive re-entries is a richer storyline than broad recovery after early adversity with stabilized management alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_constructive_final_exit_after_constructive_reentries",
    suppressedPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with constructive final exit after constructive re-entries is a richer recovery-aware repeated-cycle storyline than the broad repeated balanced-management constructive summary because it adds explicit constructive re-entry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_constructive_final_exit",
    suppressedPatternId:
      "repeated_balanced_management_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and constructive final exit is a richer storyline than the broad repeated balanced-management constructive summary because it adds the early-adversity recovery path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_take_profit_into_resistance_and_constructive_final_exit",
    suppressedPatternId:
      "repeated_balanced_management_with_take_profit_into_resistance_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and take profit into resistance and constructive final exit is a richer recovery-aware storyline than the non-recovery repeated take-profit-into-resistance branch because it adds the early-adversity rescue path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_take_profit_into_resistance_and_constructive_final_exit",
    suppressedPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and take profit into resistance and constructive final exit is a richer recovery-aware storyline than broad repeated rescue balanced management with constructive final exit because it adds explicit nearby resistance context to the repeated profit-taking path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_constructive_final_exit",
    suppressedPatternId:
      "stabilized_recovery_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and constructive final exit is a richer recovery-aware storyline than the broad stabilized-recovery constructive-final-exit pattern because it adds repeated rescue and management context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_constructive_final_exit",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and constructive final exit is a richer storyline than broad recovery after early adversity with stabilized management alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_constructive_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and constructive final exit is a richer recovery-aware storyline than the broad repeated constructive-final-exit pattern because it adds both rescue context and balanced repeated management.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_constructive_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and constructive final exit is a richer recovery-aware storyline than broad constructive repeated trim-readd management alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_trim_into_resistance_and_constructive_final_exit",
    suppressedPatternId:
      "repeated_balanced_management_with_trim_into_resistance_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and trim into resistance and constructive final exit is a richer recovery-aware storyline than the non-recovery repeated resistance-aware trim branch because it adds the early-adversity rescue path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_trim_into_resistance_and_constructive_final_exit",
    suppressedPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_take_profit_into_resistance_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and trim into resistance and constructive final exit is a richer local repeated-cycle storyline than the broader recovery-aware take-profit-into-resistance summary because it adds the stricter trim-specific structure.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_trim_into_resistance_and_constructive_final_exit",
    suppressedPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and trim into resistance and constructive final exit is a richer recovery-aware storyline than broad repeated rescue balanced management with constructive final exit because it adds explicit nearby resistance context to the repeated trims.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_constructive_final_exit_after_constructive_reentries",
    suppressedPatternId:
      "repeated_constructive_reentry_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with constructive final exit after constructive re-entries is a richer storyline because it adds the early-adversity recovery path to the repeated constructive re-entry and constructive-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_stop_like_forced_exit_after_constructive_reentries",
    suppressedPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with stop-like forced exit after constructive re-entries is a richer recovery-aware repeated-cycle storyline than the broad repeated balanced-management stop-like breakdown summary because it adds explicit constructive re-entry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "repeated_balanced_management_with_stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and stop-like forced exit after breakdown is a richer storyline than the broad repeated balanced-management stop-like breakdown summary because it adds the early-adversity recovery path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and stop-like forced exit after breakdown is a richer recovery-failure storyline than broad recovery after early adversity with failed protection alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and stop-like forced exit after breakdown is a richer recovery-aware storyline than the broad repeated defensive-exit path because it adds both rescue context and a stop-like breakdown outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_stop_like_forced_exit_after_constructive_reentries",
    suppressedPatternId:
      "repeated_constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with stop-like forced exit after constructive re-entries is a richer storyline because it adds the early-adversity recovery path to the repeated constructive re-entry and stop-like breakdown-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_stop_like_forced_exit_after_constructive_reentries",
    suppressedPatternId:
      "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with stop-like forced exit after constructive re-entries is a richer recovery-failure storyline than broad recovery after early adversity with failed protection alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_stop_like_forced_exit_after_constructive_reentries",
    suppressedPatternId:
      "recovery_with_stop_like_forced_exit_after_constructive_reentry",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with stop-like forced exit after constructive re-entries is a richer repeated-cycle storyline than the one-cycle recovery-aware constructive re-entry and stop-like breakdown-exit variant.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_constructive_final_exit_after_constructive_reentries",
    suppressedPatternId: "stabilized_recovery_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with constructive final exit after constructive re-entries is a richer recovery-aware storyline than the broad stabilized-recovery constructive-final-exit pattern alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_constructive_final_exit_after_constructive_reentries",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with constructive final exit after constructive re-entries is a richer storyline than broad recovery after early adversity with stabilized management alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_stop_like_forced_exit_before_rebound_after_constructive_reentries",
    suppressedPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with stop-like forced exit before rebound after constructive re-entries is a richer recovery-aware repeated-cycle storyline than the broad repeated balanced-management stop-like rebound summary because it adds explicit constructive re-entry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "repeated_balanced_management_with_stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and stop-like forced exit before rebound is a richer storyline than the broad repeated balanced-management stop-like rebound summary because it adds the early-adversity recovery path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and stop-like forced exit before rebound is a richer recovery-failure storyline than broad recovery after early adversity with failed protection alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "repeated_trim_readd_with_fearful_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and stop-like forced exit before rebound is a richer recovery-aware storyline than the broad repeated fearful-exit path because it adds both rescue context and a stop-like rebound outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_stop_like_forced_exit_before_rebound_after_constructive_reentries",
    suppressedPatternId:
      "repeated_constructive_reentry_with_stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with stop-like forced exit before rebound after constructive re-entries is a richer storyline because it adds the early-adversity recovery path to the repeated constructive re-entry and stop-like rebound-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_stop_like_forced_exit_before_rebound_after_constructive_reentries",
    suppressedPatternId:
      "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with stop-like forced exit before rebound after constructive re-entries is a richer recovery-failure storyline than broad recovery after early adversity with failed protection alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_stop_like_forced_exit_before_rebound_after_constructive_reentries",
    suppressedPatternId:
      "recovery_with_stop_like_forced_exit_before_rebound_after_constructive_reentry",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with stop-like forced exit before rebound after constructive re-entries is a richer repeated-cycle storyline than the one-cycle recovery-aware constructive re-entry and stop-like rebound-exit variant.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_stop_like_forced_exit_before_rebound_after_constructive_reentries",
    suppressedPatternId:
      "repeated_rescue_attempts_with_premature_final_exit_after_constructive_reentries",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with stop-like forced exit before rebound after constructive re-entries is a richer recovery-aware repeated-cycle storyline than repeated rescue attempts with premature final exit after constructive re-entries because it distinguishes a stop-like weak-side exit from a broader early exit before continuation.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_constructive_final_exit_after_constructive_reentries",
    suppressedPatternId:
      "recovery_with_constructive_final_exit_after_constructive_reentry",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with constructive final exit after constructive re-entries is a richer repeated-cycle storyline than the one-cycle recovery-aware constructive re-entry and constructive-exit variant.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_constructive_final_exit_after_constructive_reentries",
    suppressedPatternId: "repeated_trim_readd_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with constructive final exit after constructive re-entries is a richer recovery-aware storyline than the broad repeated constructive-final-exit pattern because it adds both the rescue path and re-entry-quality detail.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_premature_final_exit_after_constructive_reentries",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with premature final exit after constructive re-entries is a richer recovery-aware storyline than broad constructive repeated trim/re-add management alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_premature_final_exit_after_constructive_reentries",
    suppressedPatternId: "repeated_trim_readd_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with premature final exit after constructive re-entries is a richer recovery-aware storyline than the broad repeated premature-final-exit pattern because it adds both the rescue path and re-entry-quality detail.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_defensive_final_exit_after_deteriorating_reentries",
    suppressedPatternId:
      "repeated_deteriorating_reentry_with_defensive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with defensive final exit after deteriorating re-entries is a richer storyline because it adds the early-adversity recovery path to the repeated deteriorating re-entry and defensive-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_defensive_final_exit_after_deteriorating_reentries",
    suppressedPatternId:
      "repeated_rescue_attempts_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with defensive final exit after deteriorating re-entries is a richer storyline because it includes both deteriorating re-entry quality and the recovery-aware defensive final exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_defensive_final_exit_after_deteriorating_reentries",
    suppressedPatternId:
      "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with defensive final exit after deteriorating re-entries is a richer storyline than broad recovery after early adversity with failed protection alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_defensive_final_exit_after_deteriorating_reentries",
    suppressedPatternId: "repeated_trim_readd_with_unstable_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with defensive final exit after deteriorating re-entries is a richer recovery-aware failure storyline than broad unstable repeated trim/re-add management alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_defensive_final_exit_after_deteriorating_reentries",
    suppressedPatternId:
      "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with defensive final exit after deteriorating re-entries is a richer recovery-aware storyline than the broad repeated defensive-final-exit-after-deterioration pattern because it adds both the rescue path and re-entry-deterioration detail.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_trim_readd_with_constructive_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with constructive final exit is a richer repeated-cycle storyline because it includes the constructive final-outcome detail.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_trim_readd_with_constructive_final_exit",
    suppressedPatternId: "trim_readd_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with constructive final exit is a richer repeated-cycle storyline than the one-cycle constructive final-exit variant.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_trim_readd_with_fearful_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_unstable_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with fearful final exit is a richer repeated-cycle failure storyline because it includes the weak final-exit outcome detail.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_trim_readd_with_fearful_final_exit",
    suppressedPatternId: "fearful_exit_after_weakening",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with fearful final exit is a richer repeated-cycle storyline than broad fearful exit after weakening alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    suppressedPatternId: "repeated_trim_readd_with_unstable_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with defensive final exit after deterioration is a richer repeated-cycle storyline because it includes the final defensive-save outcome detail.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    suppressedPatternId: "defensive_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with defensive final exit after deterioration is a richer repeated-cycle storyline than broad defensive exit after deterioration alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_rescue_attempts_with_defensive_final_exit_after_deterioration",
    suppressedPatternId: "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with defensive final exit after deterioration is a richer storyline because it includes the early recovery and rescue-attempt path before the final defensive exit.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_rescue_attempts_with_defensive_final_exit_after_deterioration",
    suppressedPatternId: "repeated_rescue_attempts_with_renewed_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with defensive final exit after deterioration is a richer rescue storyline than broad renewed deterioration alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_trim_readd_with_premature_final_exit",
    suppressedPatternId: "trim_readd_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with premature final exit is a richer repeated-cycle storyline than the one-cycle missed-final-continuation pattern.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_trim_readd_with_premature_final_exit",
    suppressedPatternId: "missed_post_exit_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with premature final exit includes the premature post-exit continuation outcome plus richer repeated-cycle structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "one_sided_aggressive_building",
    suppressedPatternId: "structured_position_building",
    outcome: "demote_to_supporting",
    reason:
      "One-sided aggressive building is a more specific middle-trade sizing pattern than broad structured building.",
  }),
  defineDominanceRule({
    dominantPatternId: "revenge_adding_after_weakness",
    suppressedPatternId: "add_into_weakness",
    outcome: "demote_to_supporting",
    reason:
      "Revenge adding after weakness is a richer named averaging-down storyline than broad add into weakness because it adds repeated below-basis adds without meaningful reduction.",
  }),
  defineDominanceRule({
    dominantPatternId: "revenge_adding_after_weakness",
    suppressedPatternId: "one_sided_aggressive_building",
    outcome: "demote_to_supporting",
    reason:
      "Revenge adding after weakness is a richer named averaging-down storyline than broad one-sided aggressive building because it adds explicit add-into-weakness context.",
  }),
  defineDominanceRule({
    dominantPatternId: "revenge_adding_after_weakness",
    suppressedPatternId: "add_after_recent_drop",
    outcome: "demote_to_supporting",
    reason:
      "Revenge adding after weakness includes the adverse directional add context plus richer repeated below-basis averaging-down structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "aggressive_adding_with_failed_profit_protection",
    suppressedPatternId: "one_sided_aggressive_building",
    outcome: "demote_to_supporting",
    reason:
      "Aggressive adding with failed profit protection is a richer management-failure pattern than broad one-sided aggressive building.",
  }),
  defineDominanceRule({
    dominantPatternId: "revenge_adding_with_failed_profit_protection",
    suppressedPatternId: "aggressive_adding_with_failed_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Revenge adding with failed profit protection is a richer named failure storyline than broad aggressive adding with failed protection because it adds explicit averaging-down-into-weakness structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "revenge_adding_with_failed_profit_protection",
    suppressedPatternId: "revenge_adding_after_weakness",
    outcome: "demote_to_supporting",
    reason:
      "Revenge adding with failed profit protection is a richer named storyline because it adds the failed protection outcome to the repeated averaging-down structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "aggressive_adding_with_failed_profit_protection",
    suppressedPatternId: "failed_profit_protection_structure",
    outcome: "demote_to_supporting",
    reason:
      "Aggressive adding with failed profit protection includes the failed profit-protection structure plus aggressive add context.",
  }),
  defineDominanceRule({
    dominantPatternId: "readd_after_delayed_risk_response",
    suppressedPatternId: "readd_after_reduction",
    outcome: "demote_to_supporting",
    reason:
      "Re-add after delayed risk response is a richer sequence-level pattern than the broad re-add-after-reduction fact.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_into_strength",
    suppressedPatternId: "adding_above_prior_basis",
    outcome: "demote_to_supporting",
    reason:
      "Add into strength is a richer add-context pattern than simply adding above prior basis.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_into_strength",
    suppressedPatternId: "add_after_recent_run_up",
    outcome: "demote_to_supporting",
    reason:
      "Add into strength already captures favorable directional add context plus stronger range-position structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_into_weakness",
    suppressedPatternId: "add_after_recent_drop",
    outcome: "demote_to_supporting",
    reason:
      "Add into weakness already captures adverse directional add context plus weaker range-position structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "underutilized_position_building",
    suppressedPatternId: "single_build_position",
    outcome: "demote_to_supporting",
    reason:
      "Underutilized position building is a richer interpretation of limited size building on a meaningful opportunity trade.",
  }),
  defineDominanceRule({
    dominantPatternId: "underutilized_winner_with_constructive_exit",
    suppressedPatternId: "underutilized_position_building",
    outcome: "demote_to_supporting",
    reason:
      "Underutilized winner with constructive exit is a richer storyline than broad underutilized position building because it adds the disciplined final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "underutilized_winner_with_constructive_exit",
    suppressedPatternId: "exit_avoided_adverse_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Underutilized winner with constructive exit includes the constructive post-exit outcome plus the under-pressed winner context.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_to_underutilized_winner_with_constructive_exit",
    suppressedPatternId: "underutilized_winner_with_constructive_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery to underutilized winner with constructive exit is a richer storyline because it adds the early-adversity recovery path to the under-pressed winner outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_to_underutilized_winner_with_constructive_exit",
    suppressedPatternId: "constructive_recovery_after_early_adversity",
    outcome: "demote_to_supporting",
    reason:
      "Recovery to underutilized winner with constructive exit is a richer recovery-aware storyline than broad constructive recovery alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_to_underutilized_winner_with_constructive_exit",
    suppressedPatternId: "stabilized_recovery_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery to underutilized winner with constructive exit is a richer recovery-aware storyline than the broad stabilized-recovery constructive-final-exit pattern because it adds explicit under-pressed winner context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "underutilized_winner_with_timely_profit_protection_and_constructive_final_exit",
    suppressedPatternId: "underutilized_winner_with_constructive_exit",
    outcome: "demote_to_supporting",
    reason:
      "Underutilized winner with timely profit protection and constructive final exit is a richer storyline because it adds explicit timely protection to the under-pressed winner constructive-exit path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "underutilized_winner_with_timely_profit_protection_and_constructive_final_exit",
    suppressedPatternId: "timely_profit_protection_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Underutilized winner with timely profit protection and constructive final exit is a richer whole-trade storyline because it adds explicit under-pressed winner context to the timely protection and constructive-exit path.",
  }),
  defineDominanceRule({
    dominantPatternId: "underutilized_winner_with_premature_final_exit",
    suppressedPatternId: "underutilized_position_building",
    outcome: "demote_to_supporting",
    reason:
      "Underutilized winner with premature final exit is a richer storyline than broad underutilized position building because it adds the premature-final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "underutilized_winner_with_premature_final_exit",
    suppressedPatternId: "premature_final_exit_after_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Underutilized winner with premature final exit is a richer whole-trade storyline than broad premature final exit after constructive management because it adds explicit under-pressed winner context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_to_underutilized_winner_with_timely_profit_protection_and_constructive_final_exit",
    suppressedPatternId:
      "underutilized_winner_with_timely_profit_protection_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery to underutilized winner with timely profit protection and constructive final exit is a richer storyline because it adds the early-adversity recovery path to the under-pressed timely-protection constructive sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_to_underutilized_winner_with_timely_profit_protection_and_constructive_final_exit",
    suppressedPatternId:
      "recovery_to_underutilized_winner_with_constructive_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery to underutilized winner with timely profit protection and constructive final exit is a richer recovery-aware storyline because it adds explicit timely protection to the under-pressed winner constructive-exit path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_to_underutilized_winner_with_timely_profit_protection_and_constructive_final_exit",
    suppressedPatternId:
      "recovery_with_timely_profit_protection_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery to underutilized winner with timely profit protection and constructive final exit is a richer recovery-aware storyline because it adds explicit under-pressed winner context to the recovery-aware timely protection and constructive-exit path.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_to_underutilized_winner_with_premature_final_exit",
    suppressedPatternId: "underutilized_winner_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery to underutilized winner with premature final exit is a richer storyline because it adds the early-adversity recovery path to the under-pressed premature-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_to_underutilized_winner_with_premature_final_exit",
    suppressedPatternId: "constructive_recovery_after_early_adversity",
    outcome: "demote_to_supporting",
    reason:
      "Recovery to underutilized winner with premature final exit is a richer recovery-aware storyline than broad constructive recovery alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_to_underutilized_winner_with_premature_final_exit",
    suppressedPatternId: "premature_final_exit_after_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Recovery to underutilized winner with premature final exit is a richer whole-trade storyline than broad premature final exit after constructive management because it adds both the recovery path and the explicit under-pressed winner context.",
  }),
  defineDominanceRule({
    dominantPatternId: "underutilized_winner_with_premature_final_exit",
    suppressedPatternId: "underutilized_winner_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Underutilized winner with premature final exit is a richer whole-trade storyline than the broader underutilized missed-continuation branch because it adds the explicit premature-final-exit interpretation on top of the missed continuation outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_to_underutilized_winner_with_premature_final_exit",
    suppressedPatternId: "recovery_to_underutilized_winner_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Recovery to underutilized winner with premature final exit is a richer recovery-aware storyline than the broader recovery-aware underutilized missed-continuation branch because it adds the explicit premature-final-exit interpretation.",
  }),
  defineDominanceRule({
    dominantPatternId: "underutilized_winner_with_missed_final_continuation",
    suppressedPatternId: "underutilized_position_building",
    outcome: "demote_to_supporting",
    reason:
      "Underutilized winner with missed final continuation is a richer storyline than broad underutilized position building because it adds the missed-opportunity final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "underutilized_winner_with_missed_final_continuation",
    suppressedPatternId: "missed_post_exit_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Underutilized winner with missed final continuation includes the missed post-exit continuation outcome plus explicit under-pressed winner context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_to_underutilized_winner_with_missed_final_continuation",
    suppressedPatternId: "underutilized_winner_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Recovery to underutilized winner with missed final continuation is a richer storyline because it adds the early-adversity recovery path to the under-pressed missed-continuation outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_to_underutilized_winner_with_missed_final_continuation",
    suppressedPatternId: "constructive_recovery_after_early_adversity",
    outcome: "demote_to_supporting",
    reason:
      "Recovery to underutilized winner with missed final continuation is a richer recovery-aware storyline than broad constructive recovery alone.",
  }),
];
