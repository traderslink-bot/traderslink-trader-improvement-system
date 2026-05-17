// =========================
// POSITION DOMINANCE RULES
// =========================
//
// PURPOSE:
// Manual Layer 3 dominance relationships for position-structure overlap.

import { defineDominanceRule } from "../helpers";
import type { PatternDominanceRule } from "../types";

export const POSITION_PATTERN_DOMINANCE_RULES: PatternDominanceRule[] = [


  // =========================
  // POSITION STRUCTURE
  // =========================
  defineDominanceRule({
    dominantPatternId: "multi_build_full_exit",
    suppressedPatternId: "scaled_into_position",
    outcome: "demote_to_contextual",
    reason:
      "Multi build full exit is a richer lifecycle pattern than the raw build fact scaled into position.",
  }),
  defineDominanceRule({
    dominantPatternId: "multi_build_partial_exit",
    suppressedPatternId: "scaled_into_position",
    outcome: "demote_to_contextual",
    reason:
      "Multi build partial exit is a richer lifecycle pattern than the raw build fact scaled into position.",
  }),
  defineDominanceRule({
    dominantPatternId: "single_build_full_exit",
    suppressedPatternId: "single_build_position",
    outcome: "demote_to_contextual",
    reason:
      "Single build full exit is a richer lifecycle pattern than the raw single-build fact.",
  }),
  defineDominanceRule({
    dominantPatternId: "scale_in_then_reduce",
    suppressedPatternId: "scaled_into_position",
    outcome: "demote_to_contextual",
    reason:
      "Scale in then reduce is a richer lifecycle pattern than the raw build fact scaled into position.",
  }),
  defineDominanceRule({
    dominantPatternId: "scale_in_then_reduce",
    suppressedPatternId: "scaled_out_of_position",
    outcome: "demote_to_contextual",
    reason:
      "Scale in then reduce is a richer lifecycle pattern than the raw reduction fact scaled out of position.",
  }),
  defineDominanceRule({
    dominantPatternId: "one_and_done_round_trip",
    suppressedPatternId: "single_build_position",
    outcome: "demote_to_contextual",
    reason:
      "One and done round trip is a richer lifecycle pattern than the raw single-build fact.",
  }),
];
