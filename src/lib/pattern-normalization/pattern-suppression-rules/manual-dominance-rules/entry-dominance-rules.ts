// =========================
// ENTRY DOMINANCE RULES
// =========================
//
// PURPOSE:
// Manual Layer 3 dominance relationships for entry-location and entry-quality
// overlap.

import { defineDominanceRule } from "../helpers";
import type { PatternDominanceRule } from "../types";

export const ENTRY_PATTERN_DOMINANCE_RULES: PatternDominanceRule[] = [

  // =========================
  // ENTRY LOCATION
  // =========================
  defineDominanceRule({
    dominantPatternId: "entry_near_trade_low",
    suppressedPatternId: "low_range_entry",
    outcome: "demote_to_contextual",
    reason:
      "Entry near trade low is a stricter and more specific version of low range entry.",
  }),
  defineDominanceRule({
    dominantPatternId: "entry_near_trade_high",
    suppressedPatternId: "high_range_entry",
    outcome: "demote_to_contextual",
    reason:
      "Entry near trade high is a stricter and more specific version of high range entry.",
  }),

  // =========================
  // ENTRY QUALITY
  // =========================
  defineDominanceRule({
    dominantPatternId: "entry_near_support_structure",
    suppressedPatternId: "low_range_entry",
    outcome: "demote_to_supporting",
    reason:
      "Entry near support structure is a richer level-aware entry-location pattern than broad low-range entry alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "entry_under_resistance_structure",
    suppressedPatternId: "high_range_entry",
    outcome: "demote_to_supporting",
    reason:
      "Entry under resistance structure is a richer level-aware entry-location pattern than broad high-range entry alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "entry_far_from_support_structure",
    suppressedPatternId: "low_range_entry",
    outcome: "demote_to_supporting",
    reason:
      "Entry far from support structure is a richer distance-aware entry-location pattern than broad low-range entry alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_with_room_above_structure",
    suppressedPatternId: "breakout_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Breakout with room above structure is a richer breakout-entry storyline because it adds explicit structural clearance and room-above context.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_with_room_above_and_constructive_final_exit",
    suppressedPatternId: "breakout_with_room_above_structure",
    outcome: "demote_to_supporting",
    reason:
      "Breakout with room above and constructive final exit is a richer whole-trade breakout storyline than the broad room-above breakout fact alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_with_room_above_and_constructive_final_exit",
    suppressedPatternId: "breakout_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Breakout with room above and constructive final exit is a richer whole-trade breakout storyline than the broad breakout-entry family.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_with_room_above_and_failed_profit_protection",
    suppressedPatternId: "breakout_with_room_above_structure",
    outcome: "demote_to_supporting",
    reason:
      "Breakout with room above and failed profit protection is a richer whole-trade breakout storyline than the broad room-above breakout fact alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_with_room_above_and_failed_profit_protection",
    suppressedPatternId: "failed_profit_protection_structure",
    outcome: "demote_to_supporting",
    reason:
      "Breakout with room above and failed profit protection is a richer breakout-specific failure storyline than broad failed profit protection alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_breakout_with_room_above_and_constructive_final_exit",
    suppressedPatternId: "breakout_with_room_above_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with breakout with room above and constructive final exit is a richer breakout-specific storyline than the non-recovery room-above constructive branch because it adds the early-adversity recovery path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_breakout_with_room_above_and_constructive_final_exit",
    suppressedPatternId: "stabilized_recovery_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with breakout with room above and constructive final exit is a richer recovery-aware storyline than broad stabilized recovery with constructive final exit alone because it adds breakout-clearance context at entry.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_breakout_with_room_above_and_failed_profit_protection",
    suppressedPatternId: "breakout_with_room_above_and_failed_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with breakout with room above and failed profit protection is a richer breakout-specific storyline than the non-recovery room-above failed-protection branch because it adds the early-adversity recovery path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_breakout_with_room_above_and_failed_profit_protection",
    suppressedPatternId: "failed_profit_protection_structure",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with breakout with room above and failed profit protection is a richer recovery-aware storyline than broad failed profit protection alone because it adds both early-adversity recovery context and clean breakout-clearance entry structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_into_overhead_resistance_structure",
    suppressedPatternId: "breakout_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Breakout into overhead resistance structure is a richer weak breakout-entry storyline because it adds explicit structural clearance directly into stacked overhead resistance.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_into_overhead_resistance_structure",
    suppressedPatternId: "entry_under_resistance_structure",
    outcome: "demote_to_supporting",
    reason:
      "Breakout into overhead resistance structure is a richer level-aware weak breakout pattern than broad entry-under-resistance alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_into_overhead_resistance_structure",
    suppressedPatternId: "failed_breakout_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Breakout into overhead resistance structure is a richer weak breakout storyline because it adds explicit structural clearance directly into stacked overhead resistance.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_into_overhead_resistance_with_defensive_final_exit",
    suppressedPatternId: "breakout_into_overhead_resistance_structure",
    outcome: "demote_to_supporting",
    reason:
      "Breakout into overhead resistance with defensive final exit is a richer whole-trade weak breakout storyline than the broad overhead-resistance breakout fact alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_into_overhead_resistance_with_defensive_final_exit",
    suppressedPatternId: "disciplined_defensive_exit",
    outcome: "demote_to_supporting",
    reason:
      "Breakout into overhead resistance with defensive final exit is a richer breakout-specific defensive-save storyline than broad disciplined defensive exit alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_into_overhead_resistance_with_failed_profit_protection",
    suppressedPatternId: "breakout_into_overhead_resistance_structure",
    outcome: "demote_to_supporting",
    reason:
      "Breakout into overhead resistance with failed profit protection is a richer whole-trade weak breakout storyline than the broad overhead-resistance breakout fact alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_into_overhead_resistance_with_failed_profit_protection",
    suppressedPatternId: "failed_profit_protection_structure",
    outcome: "demote_to_supporting",
    reason:
      "Breakout into overhead resistance with failed profit protection is a richer breakout-specific failure storyline than broad failed profit protection alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_breakout_into_overhead_resistance_and_defensive_final_exit",
    suppressedPatternId: "breakout_into_overhead_resistance_with_defensive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with breakout into overhead resistance and defensive final exit is a richer breakout-specific storyline than the non-recovery overhead-resistance defensive-exit branch because it adds the early-adversity recovery path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_breakout_into_overhead_resistance_and_defensive_final_exit",
    suppressedPatternId: "disciplined_defensive_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with breakout into overhead resistance and defensive final exit is a richer breakout-specific defensive-save storyline than broad disciplined defensive exit alone because it adds both recovery context and weak breakout-overhead entry structure.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_breakout_into_overhead_resistance_and_failed_profit_protection",
    suppressedPatternId: "breakout_into_overhead_resistance_with_failed_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with breakout into overhead resistance and failed profit protection is a richer breakout-specific storyline than the non-recovery overhead-resistance failed-protection branch because it adds the early-adversity recovery path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_breakout_into_overhead_resistance_and_failed_profit_protection",
    suppressedPatternId: "failed_profit_protection_structure",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with breakout into overhead resistance and failed profit protection is a richer recovery-aware storyline than broad failed profit protection alone because it adds both early-adversity recovery context and the weak breakout-overhead path.",
  }),
  defineDominanceRule({
    dominantPatternId: "advantaged_entry_structure",
    suppressedPatternId: "efficient_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Advantaged entry structure includes richer entry-location context than efficient entry structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "disadvantaged_entry_structure",
    suppressedPatternId: "inefficient_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Disadvantaged entry structure includes richer entry-location context than inefficient entry structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "advantaged_entry_structure",
    suppressedPatternId: "entry_near_trade_low",
    outcome: "demote_to_supporting",
    reason:
      "Advantaged entry structure is a higher-order entry pattern that subsumes low-side location context.",
  }),
  defineDominanceRule({
    dominantPatternId: "advantaged_entry_structure",
    suppressedPatternId: "entry_with_favorable_remaining_upside",
    outcome: "demote_to_supporting",
    reason:
      "Advantaged entry structure includes favorable remaining upside plus additional structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "disadvantaged_entry_structure",
    suppressedPatternId: "entry_near_trade_high",
    outcome: "demote_to_supporting",
    reason:
      "Disadvantaged entry structure is a higher-order entry pattern that subsumes high-side location context.",
  }),
  defineDominanceRule({
    dominantPatternId: "disadvantaged_entry_structure",
    suppressedPatternId: "entry_with_limited_remaining_upside",
    outcome: "demote_to_supporting",
    reason:
      "Disadvantaged entry structure includes limited remaining upside plus additional structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "advantaged_entry_structure",
    suppressedPatternId: "entry_after_recent_drop",
    outcome: "demote_to_supporting",
    reason:
      "Advantaged entry structure already carries the stronger directional entry context and broader entry-quality structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "disadvantaged_entry_structure",
    suppressedPatternId: "entry_after_recent_run_up",
    outcome: "demote_to_supporting",
    reason:
      "Disadvantaged entry structure already carries the stronger directional entry context and broader entry-quality structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "late_favorable_extension_entry_structure",
    suppressedPatternId: "disadvantaged_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Late favorable extension entry structure is a richer late-entry storyline than broad disadvantaged entry structure because it adds direction-aware pre-entry extension context.",
  }),
  defineDominanceRule({
    dominantPatternId: "late_favorable_extension_entry_structure",
    suppressedPatternId: "inefficient_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Late favorable extension entry structure is a richer inefficient-entry storyline because it adds direction-aware favorable-extension context before entry.",
  }),
  defineDominanceRule({
    dominantPatternId: "late_favorable_extension_entry_structure",
    suppressedPatternId: "entry_after_recent_run_up",
    outcome: "demote_to_supporting",
    reason:
      "Late favorable extension entry structure includes the favorable-extension context plus richer late-entry quality structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "late_favorable_extension_entry_structure",
    suppressedPatternId: "entry_after_recent_drop",
    outcome: "demote_to_supporting",
    reason:
      "Late favorable extension entry structure includes the direction-aware favorable-extension context plus richer late-entry quality structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "late_favorable_extension_entry_structure",
    suppressedPatternId: "entry_with_limited_remaining_upside",
    outcome: "demote_to_supporting",
    reason:
      "Late favorable extension entry structure includes limited remaining opportunity plus richer direction-aware late-entry context.",
  }),
  defineDominanceRule({
    dominantPatternId: "late_favorable_extension_entry_structure",
    suppressedPatternId: "high_range_entry",
    outcome: "demote_to_supporting",
    reason:
      "Late favorable extension entry structure includes high-side entry location plus richer direction-aware late-entry context.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_pullback_entry_structure",
    suppressedPatternId: "advantaged_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Constructive pullback entry structure is a richer constructive-entry storyline than broad advantaged entry structure because it adds direction-aware pullback context before entry.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_pullback_entry_structure",
    suppressedPatternId: "efficient_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Constructive pullback entry structure is a richer efficient-entry storyline because it adds direction-aware pullback context before entry.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_pullback_entry_structure",
    suppressedPatternId: "entry_after_recent_drop",
    outcome: "demote_to_supporting",
    reason:
      "Constructive pullback entry structure includes the pullback context plus richer constructive entry-quality structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_pullback_entry_structure",
    suppressedPatternId: "entry_after_recent_run_up",
    outcome: "demote_to_supporting",
    reason:
      "Constructive pullback entry structure includes the direction-aware pullback context plus richer constructive entry-quality structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_pullback_entry_structure",
    suppressedPatternId: "entry_with_favorable_remaining_upside",
    outcome: "demote_to_supporting",
    reason:
      "Constructive pullback entry structure includes favorable remaining opportunity plus richer direction-aware pullback context.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_pullback_entry_structure",
    suppressedPatternId: "low_range_entry",
    outcome: "demote_to_supporting",
    reason:
      "Constructive pullback entry structure includes low-side entry location plus richer direction-aware pullback context.",
  }),
  defineDominanceRule({
    dominantPatternId: "disciplined_favorable_extension_entry_structure",
    suppressedPatternId: "advantaged_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Disciplined favorable extension entry structure is a richer constructive continuation-entry storyline than broad advantaged entry structure because it adds direction-aware favorable-extension context.",
  }),
  defineDominanceRule({
    dominantPatternId: "disciplined_favorable_extension_entry_structure",
    suppressedPatternId: "efficient_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Disciplined favorable extension entry structure is a richer efficient-entry storyline because it adds direction-aware favorable-extension context before entry.",
  }),
  defineDominanceRule({
    dominantPatternId: "disciplined_favorable_extension_entry_structure",
    suppressedPatternId: "entry_after_recent_run_up",
    outcome: "demote_to_supporting",
    reason:
      "Disciplined favorable extension entry structure includes the favorable-extension context plus richer constructive continuation-entry quality structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "disciplined_favorable_extension_entry_structure",
    suppressedPatternId: "entry_after_recent_drop",
    outcome: "demote_to_supporting",
    reason:
      "Disciplined favorable extension entry structure includes the direction-aware favorable-extension context plus richer constructive continuation-entry quality structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "disciplined_favorable_extension_entry_structure",
    suppressedPatternId: "entry_with_favorable_remaining_upside",
    outcome: "demote_to_supporting",
    reason:
      "Disciplined favorable extension entry structure includes favorable remaining opportunity plus richer direction-aware continuation context.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_entry_structure",
    suppressedPatternId: "measured_favorable_extension_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Breakout entry structure is a richer named continuation-entry storyline than the broad measured favorable extension subtype.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_entry_structure",
    suppressedPatternId: "disciplined_favorable_extension_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Breakout entry structure is a richer named continuation-entry storyline than the broad disciplined favorable extension subtype.",
  }),
  defineDominanceRule({
    dominantPatternId: "measured_favorable_extension_entry_structure",
    suppressedPatternId: "disciplined_favorable_extension_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Measured favorable extension entry structure is a richer constructive continuation storyline because it adds a tighter measured-extension constraint above the broad disciplined favorable extension subtype.",
  }),
  defineDominanceRule({
    dominantPatternId: "measured_favorable_extension_entry_structure",
    suppressedPatternId: "entry_after_recent_run_up",
    outcome: "demote_to_supporting",
    reason:
      "Measured favorable extension entry structure includes the favorable-extension context plus richer measured continuation-entry quality structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "measured_favorable_extension_entry_structure",
    suppressedPatternId: "entry_after_recent_drop",
    outcome: "demote_to_supporting",
    reason:
      "Measured favorable extension entry structure includes the direction-aware favorable-extension context plus richer measured continuation-entry quality structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_chase_entry_structure",
    suppressedPatternId: "overextended_chase_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Breakout chase entry structure is a richer named chase-entry storyline than the broad overextended chase subtype.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_chase_entry_structure",
    suppressedPatternId: "late_favorable_extension_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Breakout chase entry structure is a richer named chase-entry storyline than the broad late favorable extension subtype.",
  }),
  defineDominanceRule({
    dominantPatternId: "overextended_chase_entry_structure",
    suppressedPatternId: "late_favorable_extension_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Overextended chase entry structure is a richer chase-style entry storyline because it adds a more stretched pre-entry extension and more extreme late-entry position than the broad late favorable extension subtype.",
  }),
  defineDominanceRule({
    dominantPatternId: "overextended_chase_entry_structure",
    suppressedPatternId: "high_range_entry",
    outcome: "demote_to_supporting",
    reason:
      "Overextended chase entry structure includes very high-side entry location plus richer chase-style extension context.",
  }),
  defineDominanceRule({
    dominantPatternId: "overextended_chase_entry_structure",
    suppressedPatternId: "entry_with_limited_remaining_upside",
    outcome: "demote_to_supporting",
    reason:
      "Overextended chase entry structure includes limited remaining opportunity plus richer stretched-extension context.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_breakout_entry_structure",
    suppressedPatternId: "inefficient_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed breakout entry structure is a richer weak breakout-attempt storyline than broad inefficient entry structure because it adds measured breakout context.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_breakout_entry_structure",
    suppressedPatternId: "disadvantaged_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed breakout entry structure is a richer weak breakout-attempt storyline than broad disadvantaged entry structure because it adds measured breakout context.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_breakout_entry_structure",
    suppressedPatternId: "measured_favorable_extension_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed breakout entry structure is a richer named failed-breakout storyline because it adds the weak post-entry outcome to the measured breakout-attempt context.",
  }),
  defineDominanceRule({
    dominantPatternId: "reclaim_entry_structure",
    suppressedPatternId: "constructive_pullback_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Reclaim entry structure is a richer named recovery-entry storyline than the broad constructive pullback subtype because it adds explicit recent reference reclaim context.",
  }),
  defineDominanceRule({
    dominantPatternId: "reclaim_entry_structure",
    suppressedPatternId: "deep_constructive_pullback_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Reclaim entry structure is a richer named recovery-entry storyline than the deep constructive pullback subtype because it adds explicit recent reference reclaim context.",
  }),
  defineDominanceRule({
    dominantPatternId: "reclaim_entry_structure",
    suppressedPatternId: "advantaged_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Reclaim entry structure is a richer constructive entry storyline than broad advantaged entry structure because it adds explicit recent reference reclaim context.",
  }),
  defineDominanceRule({
    dominantPatternId: "reclaim_entry_structure",
    suppressedPatternId: "efficient_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Reclaim entry structure is a richer efficient-entry storyline because it adds explicit recent reference reclaim context before entry.",
  }),
  defineDominanceRule({
    dominantPatternId: "reclaim_entry_structure",
    suppressedPatternId: "entry_with_favorable_remaining_upside",
    outcome: "demote_to_supporting",
    reason:
      "Reclaim entry structure includes favorable remaining opportunity plus richer recent reference reclaim context.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_reclaim_entry_structure",
    suppressedPatternId: "weak_pullback_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed reclaim entry structure is a richer weak recovery-entry storyline than the broad weak pullback subtype because it adds explicit recent reference reclaim context.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_reclaim_entry_structure",
    suppressedPatternId: "deep_weak_pullback_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed reclaim entry structure is a richer weak recovery-entry storyline than the deep weak pullback subtype because it adds explicit recent reference reclaim context.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_reclaim_entry_structure",
    suppressedPatternId: "disadvantaged_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed reclaim entry structure is a richer weak entry storyline than broad disadvantaged entry structure because it adds explicit recent reference reclaim context.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_reclaim_entry_structure",
    suppressedPatternId: "inefficient_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed reclaim entry structure is a richer inefficient-entry storyline because it adds explicit recent reference reclaim context before entry.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_reclaim_entry_structure",
    suppressedPatternId: "entry_with_limited_remaining_upside",
    outcome: "demote_to_supporting",
    reason:
      "Failed reclaim entry structure includes limited remaining opportunity plus richer recent reference reclaim context.",
  }),
  defineDominanceRule({
    dominantPatternId: "mean_reversion_entry_structure",
    suppressedPatternId: "reclaim_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Mean reversion entry structure is a richer reclaim-entry storyline because it adds a deeper countertrend move before the recent reference reclaim.",
  }),
  defineDominanceRule({
    dominantPatternId: "mean_reversion_entry_structure",
    suppressedPatternId: "deep_constructive_pullback_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Mean reversion entry structure is a richer constructive reversal-entry storyline because it adds explicit recent reference reclaim context to the deeper pullback setup.",
  }),
  defineDominanceRule({
    dominantPatternId: "mean_reversion_entry_structure",
    suppressedPatternId: "constructive_pullback_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Mean reversion entry structure is a richer constructive reversal-entry storyline than the broad constructive pullback subtype because it adds explicit recent reference reclaim context.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_mean_reversion_entry_structure",
    suppressedPatternId: "failed_reclaim_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed mean reversion entry structure is a richer failed reversal-entry storyline because it adds a deeper countertrend move before the recent reference reclaim.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_mean_reversion_entry_structure",
    suppressedPatternId: "deep_weak_pullback_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed mean reversion entry structure is a richer weak reversal-entry storyline because it adds explicit recent reference reclaim context to the deeper pullback setup.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_mean_reversion_entry_structure",
    suppressedPatternId: "weak_pullback_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed mean reversion entry structure is a richer weak reversal-entry storyline than the broad weak pullback subtype because it adds explicit recent reference reclaim context.",
  }),
  defineDominanceRule({
    dominantPatternId: "opening_range_breakout_entry_structure",
    suppressedPatternId: "market_open_breakout_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Opening range breakout entry structure is a richer breakout-entry storyline because it uses a true opening-range window instead of the broader market-open pre-entry range.",
  }),
  defineDominanceRule({
    dominantPatternId: "opening_range_breakout_entry_structure",
    suppressedPatternId: "breakout_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Opening range breakout entry structure is a richer breakout-entry storyline because it adds explicit opening-range context above the generic breakout family.",
  }),
  defineDominanceRule({
    dominantPatternId: "opening_range_breakout_entry_structure",
    suppressedPatternId: "measured_favorable_extension_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Opening range breakout entry structure is a richer measured continuation-entry storyline because it adds explicit opening-range context above the broader continuation subtype.",
  }),
  defineDominanceRule({
    dominantPatternId: "opening_range_breakout_chase_entry_structure",
    suppressedPatternId: "market_open_breakout_chase_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Opening range breakout chase entry structure is a richer chase-entry storyline because it uses a true opening-range window instead of the broader market-open pre-entry range.",
  }),
  defineDominanceRule({
    dominantPatternId: "opening_range_breakout_chase_entry_structure",
    suppressedPatternId: "breakout_chase_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Opening range breakout chase entry structure is a richer breakout-chase storyline because it adds explicit opening-range context above the generic breakout-chase family.",
  }),
  defineDominanceRule({
    dominantPatternId: "opening_range_breakout_chase_entry_structure",
    suppressedPatternId: "overextended_chase_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Opening range breakout chase entry structure is a richer chase-entry storyline because it adds explicit opening-range context above the broad overextended chase subtype.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_opening_range_breakout_entry_structure",
    suppressedPatternId: "failed_market_open_breakout_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed opening range breakout entry structure is a richer failed-breakout storyline because it uses a true opening-range window instead of the broader market-open pre-entry range.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_opening_range_breakout_entry_structure",
    suppressedPatternId: "failed_breakout_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed opening range breakout entry structure is a richer failed-breakout storyline because it adds explicit opening-range context above the generic breakout family.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_opening_range_breakout_entry_structure",
    suppressedPatternId: "inefficient_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed opening range breakout entry structure is a richer weak entry storyline because it adds explicit opening-range context above broad inefficient entry structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "opening_range_reclaim_entry_structure",
    suppressedPatternId: "market_open_reclaim_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Opening range reclaim entry structure is a richer reclaim-entry storyline because it uses the opening-range boundary itself as the reclaimed reference instead of the broader market-open reclaim context.",
  }),
  defineDominanceRule({
    dominantPatternId: "opening_range_reclaim_entry_structure",
    suppressedPatternId: "reclaim_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Opening range reclaim entry structure is a richer reclaim-entry storyline because it adds explicit opening-range context above the generic reclaim family.",
  }),
  defineDominanceRule({
    dominantPatternId: "opening_range_reclaim_entry_structure",
    suppressedPatternId: "advantaged_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Opening range reclaim entry structure is a richer constructive entry storyline because it adds explicit opening-range reclaim context above broad advantaged entry structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_opening_range_reclaim_entry_structure",
    suppressedPatternId: "failed_market_open_reclaim_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed opening range reclaim entry structure is a richer failed reclaim storyline because it uses the opening-range boundary itself as the reclaimed reference instead of the broader market-open reclaim context.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_opening_range_reclaim_entry_structure",
    suppressedPatternId: "failed_reclaim_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed opening range reclaim entry structure is a richer failed reclaim storyline because it adds explicit opening-range context above the generic reclaim family.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_opening_range_reclaim_entry_structure",
    suppressedPatternId: "inefficient_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed opening range reclaim entry structure is a richer weak entry storyline because it adds explicit opening-range reclaim context above broad inefficient entry structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "market_open_breakout_entry_structure",
    suppressedPatternId: "breakout_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Market open breakout entry structure is a richer breakout-entry storyline because it adds explicit market-open opening-range context.",
  }),
  defineDominanceRule({
    dominantPatternId: "market_open_breakout_entry_structure",
    suppressedPatternId: "measured_favorable_extension_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Market open breakout entry structure is a richer measured continuation-entry storyline because it adds explicit market-open opening-range context.",
  }),
  defineDominanceRule({
    dominantPatternId: "market_open_breakout_chase_entry_structure",
    suppressedPatternId: "breakout_chase_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Market open breakout chase entry structure is a richer breakout-chase storyline because it adds explicit market-open opening-range context.",
  }),
  defineDominanceRule({
    dominantPatternId: "market_open_breakout_chase_entry_structure",
    suppressedPatternId: "overextended_chase_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Market open breakout chase entry structure is a richer chase-entry storyline because it adds explicit market-open opening-range context.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_market_open_breakout_entry_structure",
    suppressedPatternId: "failed_breakout_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed market open breakout entry structure is a richer failed-breakout storyline because it adds explicit market-open opening-range context.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_market_open_breakout_entry_structure",
    suppressedPatternId: "inefficient_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed market open breakout entry structure is a richer weak entry storyline because it adds explicit market-open opening-range context.",
  }),
  defineDominanceRule({
    dominantPatternId: "market_open_reclaim_entry_structure",
    suppressedPatternId: "reclaim_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Market open reclaim entry structure is a richer reclaim-entry storyline because it adds explicit market-open session context.",
  }),
  defineDominanceRule({
    dominantPatternId: "market_open_reclaim_entry_structure",
    suppressedPatternId: "advantaged_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Market open reclaim entry structure is a richer constructive entry storyline because it adds explicit market-open reclaim context.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_market_open_reclaim_entry_structure",
    suppressedPatternId: "failed_reclaim_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed market open reclaim entry structure is a richer failed reclaim storyline because it adds explicit market-open session context.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_market_open_reclaim_entry_structure",
    suppressedPatternId: "inefficient_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed market open reclaim entry structure is a richer weak entry storyline because it adds explicit market-open reclaim context.",
  }),
  defineDominanceRule({
    dominantPatternId: "weak_pullback_entry_structure",
    suppressedPatternId: "disadvantaged_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Weak pullback entry structure is a richer weak-entry storyline than broad disadvantaged entry structure because it adds direction-aware pullback context before entry.",
  }),
  defineDominanceRule({
    dominantPatternId: "weak_pullback_entry_structure",
    suppressedPatternId: "inefficient_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Weak pullback entry structure is a richer inefficient-entry storyline because it adds direction-aware pullback context before entry.",
  }),
  defineDominanceRule({
    dominantPatternId: "weak_pullback_entry_structure",
    suppressedPatternId: "entry_after_recent_drop",
    outcome: "demote_to_supporting",
    reason:
      "Weak pullback entry structure includes the pullback context plus richer weak entry-quality structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "weak_pullback_entry_structure",
    suppressedPatternId: "entry_after_recent_run_up",
    outcome: "demote_to_supporting",
    reason:
      "Weak pullback entry structure includes the direction-aware pullback context plus richer weak entry-quality structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "weak_pullback_entry_structure",
    suppressedPatternId: "entry_with_limited_remaining_upside",
    outcome: "demote_to_supporting",
    reason:
      "Weak pullback entry structure includes limited remaining opportunity plus richer direction-aware pullback context.",
  }),
  defineDominanceRule({
    dominantPatternId: "deep_constructive_pullback_entry_structure",
    suppressedPatternId: "constructive_pullback_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Deep constructive pullback entry structure is a richer constructive pullback storyline because it adds a larger countertrend pullback before the already strong eventual entry.",
  }),
  defineDominanceRule({
    dominantPatternId: "deep_constructive_pullback_entry_structure",
    suppressedPatternId: "entry_after_recent_drop",
    outcome: "demote_to_supporting",
    reason:
      "Deep constructive pullback entry structure includes the pullback context plus richer deep-pullback constructive-entry structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "deep_constructive_pullback_entry_structure",
    suppressedPatternId: "entry_after_recent_run_up",
    outcome: "demote_to_supporting",
    reason:
      "Deep constructive pullback entry structure includes the direction-aware pullback context plus richer deep-pullback constructive-entry structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "deep_weak_pullback_entry_structure",
    suppressedPatternId: "weak_pullback_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Deep weak pullback entry structure is a richer weak pullback storyline because it adds a larger countertrend pullback before the already weak eventual entry.",
  }),
  defineDominanceRule({
    dominantPatternId: "deep_weak_pullback_entry_structure",
    suppressedPatternId: "entry_after_recent_drop",
    outcome: "demote_to_supporting",
    reason:
      "Deep weak pullback entry structure includes the pullback context plus richer deep-pullback weak-entry structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "deep_weak_pullback_entry_structure",
    suppressedPatternId: "entry_after_recent_run_up",
    outcome: "demote_to_supporting",
    reason:
      "Deep weak pullback entry structure includes the direction-aware pullback context plus richer deep-pullback weak-entry structure.",
  }),
];
