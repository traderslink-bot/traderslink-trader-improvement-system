// =========================
// EXIT DOMINANCE RULES
// =========================
//
// PURPOSE:
// Manual Layer 3 dominance relationships for exit-quality and post-exit
// overlap.

import { defineDominanceRule } from "../helpers";
import type { PatternDominanceRule } from "../types";

export const EXIT_PATTERN_DOMINANCE_RULES: PatternDominanceRule[] = [


  // =========================
  // EXIT QUALITY
  // =========================
  defineDominanceRule({
    dominantPatternId: "high_capture_exit_structure",
    suppressedPatternId: "exit_near_favorable_extreme",
    outcome: "demote_to_supporting",
    reason:
      "High capture exit structure is the stronger primary exit-quality pattern; near-favorable-extreme is usually supporting detail.",
  }),
  defineDominanceRule({
    dominantPatternId: "moderate_capture_exit_structure",
    suppressedPatternId: "exit_near_favorable_extreme",
    outcome: "demote_to_supporting",
    reason:
      "Moderate capture exit structure is the stronger primary exit-quality pattern; near-favorable-extreme is usually supporting detail.",
  }),
  defineDominanceRule({
    dominantPatternId: "low_capture_exit_structure",
    suppressedPatternId: "exit_near_favorable_extreme",
    outcome: "demote_to_supporting",
    reason:
      "Low capture exit structure is the stronger primary exit-quality pattern; near-favorable-extreme is usually supporting detail.",
  }),
  defineDominanceRule({
    dominantPatternId: "missed_post_exit_continuation",
    suppressedPatternId: "exit_with_meaningful_giveback",
    outcome: "demote_to_supporting",
    reason:
      "Missed post-exit continuation is a richer post-exit outcome pattern than the broader meaningful giveback descriptor.",
  }),
  defineDominanceRule({
    dominantPatternId: "exit_into_support_with_relief_after_exit",
    suppressedPatternId: "exit_into_support_structure",
    outcome: "demote_to_supporting",
    reason:
      "Exit into support with relief after exit is a richer support-aware exit storyline than broad exit into support alone because it also includes the post-exit relief outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "exit_into_support_before_breakdown",
    suppressedPatternId: "exit_into_support_structure",
    outcome: "demote_to_supporting",
    reason:
      "Exit into support before breakdown is a richer support-aware exit storyline than broad exit into support alone because it also includes the post-exit breakdown outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "exit_into_stacked_support_with_relief_after_exit",
    suppressedPatternId: "exit_into_support_with_relief_after_exit",
    outcome: "demote_to_supporting",
    reason:
      "Exit into stacked support with relief after exit is a richer support-aware exit storyline because it adds support-density context to the post-exit relief outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "exit_into_thin_support_before_breakdown",
    suppressedPatternId: "exit_into_support_before_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Exit into thin support before breakdown is a richer support-aware exit storyline because it adds thin-support context to the post-exit breakdown outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "exit_into_resistance_with_reversal_after_exit",
    suppressedPatternId: "exit_avoided_adverse_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Exit into resistance with reversal after exit is a richer resistance-aware exit storyline than broad avoided-adverse-followthrough because it adds explicit resistance context at the exit.",
  }),
  defineDominanceRule({
    dominantPatternId: "exit_into_resistance_before_breakout",
    suppressedPatternId: "missed_post_exit_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Exit into resistance before breakout is a richer resistance-aware exit storyline than broad missed post-exit continuation because it adds explicit resistance context at the exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "stabilized_recovery_with_exit_into_stacked_support_and_relief",
    suppressedPatternId: "exit_into_stacked_support_with_relief_after_exit",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with exit into stacked support and relief is a richer support-aware exit storyline because it adds the prior recovery-stabilization path to the stacked-support relief outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "stabilized_recovery_with_exit_into_stacked_support_and_relief",
    suppressedPatternId: "stabilized_recovery_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with exit into stacked support and relief is a richer recovery-exit storyline because it adds explicit support-density context to the constructive stabilized-recovery exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "stabilized_recovery_with_exit_into_thin_support_before_breakdown",
    suppressedPatternId: "exit_into_thin_support_before_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with exit into thin support before breakdown is a richer support-aware exit storyline because it adds the prior recovery-stabilization path to the thin-support breakdown outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "stabilized_recovery_with_exit_into_thin_support_before_breakdown",
    suppressedPatternId: "stabilized_recovery_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with exit into thin support before breakdown is a richer recovery-exit storyline because it adds explicit thin-support breakdown context to the broader stabilized-recovery exit.",
  }),
  defineDominanceRule({
    dominantPatternId: "stabilized_recovery_with_exit_into_resistance_and_reversal",
    suppressedPatternId: "exit_into_resistance_with_reversal_after_exit",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with exit into resistance and reversal is a richer resistance-aware exit storyline because it adds the prior recovery-stabilization path to the resistance-reversal outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "stabilized_recovery_with_exit_into_resistance_and_reversal",
    suppressedPatternId: "stabilized_recovery_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with exit into resistance and reversal is a richer recovery-exit storyline because it adds explicit resistance context to the constructive stabilized-recovery exit.",
  }),
  defineDominanceRule({
    dominantPatternId: "stabilized_recovery_with_exit_into_resistance_before_breakout",
    suppressedPatternId: "exit_into_resistance_before_breakout",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with exit into resistance before breakout is a richer resistance-aware exit storyline because it adds the prior recovery-stabilization path to the resistance-before-breakout outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "stabilized_recovery_with_exit_into_resistance_before_breakout",
    suppressedPatternId: "stabilized_recovery_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with exit into resistance before breakout is a richer recovery-exit storyline because it adds explicit resistance context to the broader stabilized-recovery premature-exit path.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_above_resistance_structure",
    suppressedPatternId: "add_into_resistance_structure",
    outcome: "demote_to_supporting",
    reason:
      "Add above resistance structure is a richer support-aware scaling storyline because it distinguishes true clearance above broken resistance from crowding directly into nearby resistance.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_above_resistance_with_constructive_final_exit",
    suppressedPatternId: "add_above_resistance_structure",
    outcome: "demote_to_supporting",
    reason:
      "Add above resistance with constructive final exit is a richer whole-trade storyline than the broad add-above-resistance structural fact alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_above_resistance_with_constructive_final_exit",
    suppressedPatternId: "balanced_scaling_with_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Add above resistance with constructive final exit is a richer support/resistance-aware constructive-management storyline than broad balanced scaling with profit protection.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_above_resistance_with_failed_profit_protection",
    suppressedPatternId: "add_above_resistance_structure",
    outcome: "demote_to_supporting",
    reason:
      "Add above resistance with failed profit protection is a richer whole-trade storyline than the broad add-above-resistance structural fact alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_above_resistance_with_failed_profit_protection",
    suppressedPatternId: "aggressive_adding_with_failed_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Add above resistance with failed profit protection is a richer support/resistance-aware failure storyline than broad aggressive adding with failed profit protection.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_add_above_resistance_and_constructive_final_exit",
    suppressedPatternId: "add_above_resistance_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add above resistance and constructive final exit is a richer whole-trade support/resistance storyline than the non-recovery add-above-resistance constructive branch alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_add_above_resistance_and_constructive_final_exit",
    suppressedPatternId: "recovery_with_add_into_strength_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add above resistance and constructive final exit is a richer recovery add-into-strength storyline because it adds explicit support/resistance clearance context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_add_above_resistance_and_failed_profit_protection",
    suppressedPatternId: "add_above_resistance_with_failed_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add above resistance and failed profit protection is a richer whole-trade support/resistance storyline than the non-recovery add-above-resistance failure branch alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_add_above_resistance_and_failed_profit_protection",
    suppressedPatternId: "aggressive_adding_with_failed_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add above resistance and failed profit protection is a richer recovery-aware support/resistance failure storyline than broad aggressive adding with failed profit protection.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_adds_above_resistance_with_constructive_final_exit",
    suppressedPatternId: "add_above_resistance_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated adds above resistance with constructive final exit is a richer support/resistance storyline than the one-cycle add-above-resistance constructive branch alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_adds_above_resistance_with_failed_profit_protection",
    suppressedPatternId: "add_above_resistance_with_failed_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Repeated adds above resistance with failed profit protection is a richer support/resistance storyline than the one-cycle add-above-resistance failure branch alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "premature_final_exit_after_constructive_management",
    suppressedPatternId: "missed_post_exit_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Premature final exit after constructive management is a richer early-exit storyline than broad missed post-exit continuation alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "stabilized_recovery_with_premature_final_exit",
    suppressedPatternId: "premature_final_exit_after_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with premature final exit is a richer combined recovery-and-exit storyline than broad premature final exit after constructive management alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "stabilized_recovery_with_premature_final_exit",
    suppressedPatternId: "missed_post_exit_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with premature final exit is a richer combined recovery-and-exit storyline than the broad missed post-exit continuation descriptor because it includes both the stabilized recovery path and the premature final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "stabilized_recovery_with_premature_final_exit",
    suppressedPatternId: "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with premature final exit includes the stabilized recovery path plus the premature final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "fearful_exit_after_weakening",
    suppressedPatternId: "missed_post_exit_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Fearful exit after weakening is a richer weak-exit storyline than broad missed post-exit continuation alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "fearful_exit_after_weakening",
    suppressedPatternId: "low_capture_exit_structure",
    outcome: "demote_to_supporting",
    reason:
      "Fearful exit after weakening includes weak capture plus the richer weak-exit and recovery-after-exit storyline.",
  }),
  defineDominanceRule({
    dominantPatternId: "stop_like_forced_exit_before_rebound",
    suppressedPatternId: "fearful_exit_after_weakening",
    outcome: "demote_to_supporting",
    reason:
      "Stop-like forced exit before rebound is a richer breakdown-driven exit storyline than broad fearful exit after weakening alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "stop_like_forced_exit_before_rebound",
    suppressedPatternId: "missed_post_exit_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Stop-like forced exit before rebound includes the rebound-after-exit outcome plus the stronger breakdown context that led into the stop-like final exit.",
  }),
  defineDominanceRule({
    dominantPatternId: "stop_like_forced_exit_before_rebound",
    suppressedPatternId: "low_capture_exit_structure",
    outcome: "demote_to_supporting",
    reason:
      "Stop-like forced exit before rebound includes the weak capture plus the richer breakdown-driven stop-like exit context.",
  }),
  defineDominanceRule({
    dominantPatternId: "stop_like_forced_exit_before_rebound",
    suppressedPatternId: "peak_profit_giveback_structure",
    outcome: "demote_to_supporting",
    reason:
      "Stop-like forced exit before rebound includes the large giveback context plus the richer breakdown-driven stop-like final exit storyline.",
  }),
  defineDominanceRule({
    dominantPatternId: "exit_avoided_adverse_followthrough",
    suppressedPatternId: "exit_with_limited_giveback",
    outcome: "demote_to_supporting",
    reason:
      "Exit avoided adverse followthrough is a richer post-exit relief pattern than the broader limited giveback descriptor.",
  }),
  defineDominanceRule({
    dominantPatternId: "disciplined_defensive_exit",
    suppressedPatternId: "exit_avoided_adverse_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Disciplined defensive exit is a richer relief-exit storyline than broad exit avoided adverse followthrough alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "stabilized_recovery_with_constructive_final_exit",
    suppressedPatternId: "disciplined_defensive_exit",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with constructive final exit is a richer combined recovery-and-exit storyline than broad disciplined defensive exit alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "stabilized_recovery_with_constructive_final_exit",
    suppressedPatternId: "exit_avoided_adverse_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with constructive final exit is a richer combined recovery-and-exit storyline than the broad exit-avoided-adverse-followthrough descriptor because it includes both the stabilized recovery path and the constructive final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "stabilized_recovery_with_constructive_final_exit",
    suppressedPatternId: "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with constructive final exit includes the stabilized recovery path plus the constructive final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "defensive_exit_after_deterioration",
    suppressedPatternId: "exit_avoided_adverse_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Defensive exit after deterioration is a richer relief-exit storyline than broad exit avoided adverse followthrough alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "defensive_exit_after_deterioration",
    suppressedPatternId: "peak_profit_giveback_structure",
    outcome: "demote_to_supporting",
    reason:
      "Defensive exit after deterioration includes the deterioration context plus the defensive final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "defensive_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Stop-like forced exit after breakdown is a richer breakdown-driven exit storyline than broad defensive exit after deterioration alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "exit_avoided_adverse_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Stop-like forced exit after breakdown includes the adverse-followthrough relief outcome plus the stronger breakdown context that pushed the final exit to the weak side.",
  }),
  defineDominanceRule({
    dominantPatternId: "stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "low_capture_exit_structure",
    outcome: "demote_to_supporting",
    reason:
      "Stop-like forced exit after breakdown includes the weak capture plus the richer breakdown-driven stop-like exit context.",
  }),
  defineDominanceRule({
    dominantPatternId: "stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "peak_profit_giveback_structure",
    outcome: "demote_to_supporting",
    reason:
      "Stop-like forced exit after breakdown includes the large giveback context plus the richer breakdown-driven stop-like final exit storyline.",
  }),
  defineDominanceRule({
    dominantPatternId: "held_through_danger_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Held through danger with stop-like forced exit after breakdown is a richer cross-family storyline because it adds the prior held-through-danger path to the breakdown-driven stop-like exit.",
  }),
  defineDominanceRule({
    dominantPatternId: "held_through_danger_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "held_through_danger_after_peak_profit",
    outcome: "demote_to_supporting",
    reason:
      "Held through danger with stop-like forced exit after breakdown is a richer cross-family storyline because it adds the stop-like exit outcome to the earlier held-through-danger pattern.",
  }),
  defineDominanceRule({
    dominantPatternId: "held_through_danger_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Held through danger with stop-like forced exit before rebound is a richer cross-family storyline because it adds the prior held-through-danger path to the stop-like exit and rebound outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "held_through_danger_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "held_through_danger_after_peak_profit",
    outcome: "demote_to_supporting",
    reason:
      "Held through danger with stop-like forced exit before rebound is a richer cross-family storyline because it adds the stop-like rebound outcome to the earlier held-through-danger pattern.",
  }),
  defineDominanceRule({
    dominantPatternId: "delayed_risk_response_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Delayed risk response with stop-like forced exit after breakdown is a richer cross-family storyline because it adds the prior delayed-response path to the breakdown-driven stop-like exit.",
  }),
  defineDominanceRule({
    dominantPatternId: "delayed_risk_response_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "delayed_risk_response_with_failed_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Delayed risk response with stop-like forced exit after breakdown is a richer cross-family storyline because it adds the final stop-like exit outcome to the delayed failed-protection path.",
  }),
  defineDominanceRule({
    dominantPatternId: "delayed_risk_response_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Delayed risk response with stop-like forced exit before rebound is a richer cross-family storyline because it adds the prior delayed-response path to the stop-like exit and rebound outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "delayed_risk_response_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "delayed_risk_response_with_failed_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Delayed risk response with stop-like forced exit before rebound is a richer cross-family storyline because it adds the final stop-like rebound outcome to the delayed failed-protection path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "stabilized_recovery_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with stop-like forced exit after breakdown is a richer combined recovery-and-exit storyline than the broader stop-like breakdown exit alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "stabilized_recovery_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with stop-like forced exit after breakdown is a richer recovery-failure storyline than the broader recovered-then-failed-protection pattern because it also includes the final breakdown-driven stop-like exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "stabilized_recovery_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "delayed_risk_response_with_stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with stop-like forced exit after breakdown is a richer storyline than the delayed-response stop-like breakdown branch because it also includes the earlier recovery-from-adversity context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "stabilized_recovery_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with stop-like forced exit before rebound is a richer combined recovery-and-exit storyline than the broader stop-like rebound exit alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "stabilized_recovery_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with stop-like forced exit before rebound is a richer recovery-failure storyline than the broader recovered-then-failed-protection pattern because it also includes the final stop-like weak-side exit before rebound.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "stabilized_recovery_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "delayed_risk_response_with_stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with stop-like forced exit before rebound is a richer storyline than the delayed-response stop-like rebound branch because it also includes the earlier recovery-from-adversity context.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_profit_protection_structure",
    suppressedPatternId: "peak_profit_giveback_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed profit protection structure is a richer management pattern than the narrower giveback descriptor.",
  }),
  defineDominanceRule({
    dominantPatternId: "reduction_into_strength",
    suppressedPatternId: "reduction_after_recent_run_up",
    outcome: "demote_to_supporting",
    reason:
      "Reduction into strength combines directional context with stronger reduction location and basis structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "reduction_into_weakness",
    suppressedPatternId: "reduction_after_recent_drop",
    outcome: "demote_to_supporting",
    reason:
      "Reduction into weakness combines directional context with weaker reduction location and basis structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "held_through_danger_after_peak_profit",
    suppressedPatternId: "failed_profit_protection_structure",
    outcome: "demote_to_supporting",
    reason:
      "Held through danger after peak profit is a richer risk-management failure pattern than broad failed profit protection structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "delayed_risk_response_after_peak_profit",
    suppressedPatternId: "failed_profit_protection_structure",
    outcome: "demote_to_supporting",
    reason:
      "Delayed risk response after peak profit is a richer risk-management delay pattern than broad failed profit protection structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "timely_risk_response_with_profit_protection",
    suppressedPatternId: "timely_risk_response_after_peak_profit",
    outcome: "demote_to_supporting",
    reason:
      "Timely risk response with profit protection is a richer constructive sequence pattern than timely risk response alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "timely_risk_response_with_profit_protection",
    suppressedPatternId: "profit_protection_present",
    outcome: "demote_to_supporting",
    reason:
      "Timely risk response with profit protection includes retained open-profit protection plus explicit danger-window response timing.",
  }),
  defineDominanceRule({
    dominantPatternId: "delayed_risk_response_with_failed_profit_protection",
    suppressedPatternId: "delayed_risk_response_after_peak_profit",
    outcome: "demote_to_supporting",
    reason:
      "Delayed risk response with failed profit protection is a richer sequence-level risk-management pattern than delayed risk response alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "delayed_risk_response_with_failed_profit_protection",
    suppressedPatternId: "failed_profit_protection_structure",
    outcome: "demote_to_supporting",
    reason:
      "Delayed risk response with failed profit protection is a richer sequence-level risk-management pattern than broad failed profit protection structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "readd_after_delayed_risk_response",
    suppressedPatternId: "delayed_risk_response_with_failed_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Re-add after delayed risk response is a richer management-sequence pattern because it includes the later re-add behavior.",
  }),
];
