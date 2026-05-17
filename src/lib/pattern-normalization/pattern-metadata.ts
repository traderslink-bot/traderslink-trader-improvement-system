// =========================
// 2026-04-12 07:18 PM America/Toronto
// PATTERN NORMALIZATION METADATA
// =========================
//
// PURPOSE:
// Central metadata registry for Layer 3 pattern normalization and prioritization.
//
// IMPORTANT:
// This file does NOT perform normalization.
// This file does NOT detect patterns.
// This file does NOT score trades.
// This file only provides structured metadata that Layer 3 can use to make
// consistent decisions about priority, specificity, and display behavior.
//
// WHY THIS FILE EXISTS:
// Layer 2 correctly returns all true patterns.
// Layer 3 needs a stable, centralized way to understand:
//
// 1. which patterns are broader vs more specific
// 2. which patterns are usually strong primary candidates
// 3. which patterns are better treated as supporting/context
// 4. how to sort patterns consistently without hardcoding logic everywhere
//
// FUTURE EXPANSION MAY INCLUDE:
// - suppression group metadata
// - composite dependency metadata
// - family-level ordering metadata
// - display label overrides
// - scoring-facing metadata
//

import { PATTERN_DEFINITIONS } from "../pattern-detection/registry/pattern-definitions";
import type { PatternType } from "../pattern-detection/types/pattern-detection-types";
import { PATTERN_FAMILIES } from "../pattern-detection/types/pattern-detection-types";

export type NormalizationRole =
  | "primary_candidate"
  | "supporting_candidate"
  | "context_only";

export const PATTERN_JOURNEY_SCOPES = [
  "atomic",
  "one_cycle",
  "repeated_cycle",
  "whole_trade",
] as const;

export type PatternJourneyScope = (typeof PATTERN_JOURNEY_SCOPES)[number];

export const PATTERN_OUTCOME_FLAVORS = [
  "none",
  "constructive",
  "premature",
  "fearful",
  "defensive",
  "failed_protection",
  "stop_like",
  "missed_opportunity",
  "adverse",
  "balanced",
] as const;

export type PatternOutcomeFlavor = (typeof PATTERN_OUTCOME_FLAVORS)[number];

export const PATTERN_LANES = [
  "execution_pacing",
  "position_building",
  "position_reduction",
  "position_structure",
  "trade_duration",
  "trade_excursion",
  "trade_closure",
  "entry_location",
  "entry_setup",
  "entry_breakout",
  "entry_pullback",
  "entry_reclaim",
  "entry_mean_reversion",
  "entry_session",
  "entry_support_resistance",
  "exit_capture",
  "exit_post_exit",
  "exit_risk_response",
  "exit_support_resistance",
  "management_setup",
  "management_add_quality",
  "management_reduction_quality",
  "management_profit_protection",
  "management_risk_response",
  "management_readd",
  "management_reentry",
  "management_recovery",
  "management_repeated_cycle",
  "management_support_resistance",
  "management_whole_trade",
  "management_failure",
  "management_context",
] as const;

export type PatternLane = (typeof PATTERN_LANES)[number];

interface InferredPatternSemantics {
  lane: PatternLane;
  subFamily: string;
  journeyScope: PatternJourneyScope;
  outcomeFlavor: PatternOutcomeFlavor;
  isRecoveryAware: boolean;
  isSupportResistanceAware: boolean;
  broaderPatternIds: string[];
  lineageRoot: string;
}

export interface PatternMetadata {
  patternId: string;
  family: string;
  patternType: PatternType;
  lane: PatternLane;
  subFamily: string;
  journeyScope: PatternJourneyScope;
  outcomeFlavor: PatternOutcomeFlavor;
  isRecoveryAware: boolean;
  isSupportResistanceAware: boolean;
  broaderPatternIds: string[];
  lineageRoot: string;

  // 2026-04-12 07:18 PM America/Toronto
  // Higher means more specific / structurally richer.
  specificityRank: number;

  // 2026-04-12 07:18 PM America/Toronto
  // Higher means stronger default priority for Layer 3 ordering.
  defaultPriority: number;

  // 2026-04-12 07:18 PM America/Toronto
  // Whether this pattern can reasonably act as a primary output pattern.
  canBePrimary: boolean;

  // 2026-04-12 07:18 PM America/Toronto
  // Default intended role before Layer 3 applies overlap logic.
  defaultRole: NormalizationRole;

  // 2026-04-12 07:18 PM America/Toronto
  // Optional notes for maintainers. Not intended for user-facing output.
  notes?: string;
}

type PatternMetadataInput = Omit<
  PatternMetadata,
  | "lane"
  | "subFamily"
  | "journeyScope"
  | "outcomeFlavor"
  | "isRecoveryAware"
  | "isSupportResistanceAware"
  | "broaderPatternIds"
  | "lineageRoot"
> &
  Partial<InferredPatternSemantics>;

const OUTCOME_SUFFIXES = [
  "_with_constructive_final_exit",
  "_with_premature_final_exit",
  "_with_missed_final_continuation",
  "_with_failed_profit_protection",
  "_with_stop_like_forced_exit_after_breakdown",
  "_with_stop_like_forced_exit_before_rebound",
  "_with_defensive_final_exit_after_deterioration",
  "_with_fearful_final_exit",
  "_with_relief_after_exit",
  "_before_breakdown",
  "_with_reversal_after_exit",
  "_before_breakout",
] as const;

const RECOVERY_PREFIXES = [
  "recovery_with_",
  "recovery_to_",
  "recovery_after_early_adversity_with_",
  "stabilized_recovery_with_",
  "constructive_recovery_after_early_adversity",
  "recovery_after_early_adversity_",
  "repeated_rescue_attempts_with_",
] as const;

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function inferOutcomeFlavor(patternId: string): PatternOutcomeFlavor {
  if (patternId.includes("constructive")) return "constructive";
  if (patternId.includes("premature")) return "premature";
  if (patternId.includes("fearful")) return "fearful";
  if (patternId.includes("defensive")) return "defensive";
  if (patternId.includes("failed_profit_protection")) return "failed_protection";
  if (patternId.includes("stop_like")) return "stop_like";
  if (patternId.includes("missed_final_continuation")) return "missed_opportunity";
  if (patternId.includes("failed_") || patternId.includes("deteriorat")) return "adverse";
  if (patternId.includes("balanced_management")) return "balanced";
  return "none";
}

function inferJourneyScope(patternId: string, patternType: PatternType): PatternJourneyScope {
  if (patternType === "atomic") {
    return "atomic";
  }

  if (patternId.startsWith("repeated_") || patternId.includes("repeated_")) {
    return "repeated_cycle";
  }

  if (
    patternId.includes("balanced_management") ||
    patternId.includes("underutilized_winner") ||
    patternId.includes("timely_profit_protection") ||
    patternId.includes("trim_into_strength") ||
    patternId.includes("add_into_strength_with_") ||
    patternId.includes("timely_risk_response_with_")
  ) {
    return "whole_trade";
  }

  return "one_cycle";
}

function inferLane(args: {
  family: string;
  patternId: string;
}): PatternLane {
  const { family, patternId } = args;

  switch (family) {
    case PATTERN_FAMILIES.EXECUTION_FREQUENCY:
      return "execution_pacing";
    case PATTERN_FAMILIES.POSITION_BUILDING:
      return "position_building";
    case PATTERN_FAMILIES.POSITION_REDUCTION:
      return "position_reduction";
    case PATTERN_FAMILIES.POSITION_STRUCTURE:
      return "position_structure";
    case PATTERN_FAMILIES.TRADE_DURATION:
      return "trade_duration";
    case PATTERN_FAMILIES.TRADE_EXCURSION:
      return "trade_excursion";
    case PATTERN_FAMILIES.TRADE_CLOSURE:
      return "trade_closure";
    case PATTERN_FAMILIES.ENTRY_CONTEXT:
      return "entry_location";
    case PATTERN_FAMILIES.ENTRY_QUALITY:
      if (
        patternId.includes("opening_range") ||
        patternId.includes("market_open")
      ) {
        return "entry_session";
      }
      if (
        patternId.includes("room_above") ||
        patternId.includes("overhead_resistance") ||
        patternId.includes("near_support") ||
        patternId.includes("under_resistance") ||
        patternId.includes("far_from_support")
      ) {
        return "entry_support_resistance";
      }
      if (patternId.includes("breakout")) return "entry_breakout";
      if (patternId.includes("pullback")) return "entry_pullback";
      if (patternId.includes("reclaim")) return "entry_reclaim";
      if (patternId.includes("mean_reversion")) return "entry_mean_reversion";
      return "entry_setup";
    case PATTERN_FAMILIES.EXIT_QUALITY:
      if (patternId.includes("support") || patternId.includes("resistance")) {
        return "exit_support_resistance";
      }
      if (
        patternId.includes("risk_response") ||
        patternId.includes("profit_protection") ||
        patternId.includes("giveback")
      ) {
        return "exit_risk_response";
      }
      if (patternId.includes("exit") || patternId.includes("continuation")) {
        return "exit_post_exit";
      }
      return "exit_capture";
    case PATTERN_FAMILIES.SCALING_QUALITY:
      if (patternId.includes("support") || patternId.includes("resistance")) {
        return "management_support_resistance";
      }
      if (patternId.includes("reentry")) return "management_reentry";
      if (patternId.includes("readd")) return "management_readd";
      if (patternId.includes("recovery") || patternId.includes("rescue")) {
        return "management_recovery";
      }
      if (patternId.includes("repeated_")) return "management_repeated_cycle";
      if (
        patternId.includes("profit_protection") ||
        patternId.includes("giveback")
      ) {
        return "management_profit_protection";
      }
      if (patternId.includes("risk_response")) return "management_risk_response";
      if (patternId.includes("add_") || patternId.includes("adding")) {
        return "management_add_quality";
      }
      if (patternId.includes("reduction") || patternId.includes("trim")) {
        return "management_reduction_quality";
      }
      if (
        patternId.includes("balanced_management") ||
        patternId.includes("underutilized_winner")
      ) {
        return "management_whole_trade";
      }
      if (patternId.includes("failed") || patternId.includes("revenge")) {
        return "management_failure";
      }
      return "management_setup";
    default:
      return "management_context";
  }
}

function inferSubFamily(patternId: string): string {
  if (patternId.includes("opening_range")) return "opening_range";
  if (patternId.includes("market_open")) return "market_open";
  if (patternId.includes("breakout")) return "breakout";
  if (patternId.includes("pullback")) return "pullback";
  if (patternId.includes("reclaim")) return "reclaim";
  if (patternId.includes("mean_reversion")) return "mean_reversion";
  if (patternId.includes("support")) return "support";
  if (patternId.includes("resistance")) return "resistance";
  if (patternId.includes("reentry")) return "reentry";
  if (patternId.includes("readd")) return "readd";
  if (patternId.includes("trim")) return "trim";
  if (patternId.includes("risk_response")) return "risk_response";
  if (patternId.includes("profit_protection")) return "profit_protection";
  if (patternId.includes("balanced_management")) return "balanced_management";
  if (patternId.includes("underutilized_winner")) return "underutilized_winner";
  if (patternId.includes("recovery") || patternId.includes("rescue")) {
    return "recovery";
  }
  return "generic";
}

function stripVariantAffixes(patternId: string): string[] {
  const candidates = new Set<string>();
  let current = patternId;
  candidates.add(current);

  for (const prefix of RECOVERY_PREFIXES) {
    if (current.startsWith(prefix)) {
      current = current.slice(prefix.length);
      candidates.add(current);
    }
  }

  if (current.startsWith("repeated_")) {
    candidates.add(current.slice("repeated_".length));
  }

  for (const suffix of OUTCOME_SUFFIXES) {
    for (const candidate of [...candidates]) {
      if (candidate.endsWith(suffix)) {
        candidates.add(candidate.slice(0, -suffix.length));
      }
    }
  }

  return [...candidates];
}

function inferBroaderPatternIds(patternId: string): string[] {
  const candidates = stripVariantAffixes(patternId);
  const broaderCandidates = candidates.filter((candidate) => candidate !== patternId);
  return uniqueStrings(broaderCandidates);
}

function inferLineageRoot(patternId: string): string {
  const candidates = stripVariantAffixes(patternId);
  return candidates[candidates.length - 1] ?? patternId;
}

function inferPatternSemantics(args: {
  family: string;
  patternId: string;
  patternType: PatternType;
}): InferredPatternSemantics {
  const { family, patternId, patternType } = args;

  return {
    lane: inferLane({ family, patternId }),
    subFamily: inferSubFamily(patternId),
    journeyScope: inferJourneyScope(patternId, patternType),
    outcomeFlavor: inferOutcomeFlavor(patternId),
    isRecoveryAware: RECOVERY_PREFIXES.some((prefix) => patternId.startsWith(prefix)),
    isSupportResistanceAware:
      patternId.includes("support") ||
      patternId.includes("resistance") ||
      patternId.includes("room_above") ||
      patternId.includes("overhead_resistance"),
    broaderPatternIds: inferBroaderPatternIds(patternId),
    lineageRoot: inferLineageRoot(patternId),
  };
}

function definePatternMetadata(
  metadata: PatternMetadataInput,
): PatternMetadata {
  const inferred = inferPatternSemantics(metadata);

  return {
    ...inferred,
    ...metadata,
    broaderPatternIds: metadata.broaderPatternIds ?? inferred.broaderPatternIds,
    lineageRoot: metadata.lineageRoot ?? inferred.lineageRoot,
  };
}

const RAW_PATTERN_METADATA: PatternMetadata[] = [
  // =========================
  // EXECUTION FREQUENCY
  // =========================
  definePatternMetadata({
    patternId: "high_frequency_execution",
    family: PATTERN_FAMILIES.EXECUTION_FREQUENCY,
    patternType: "atomic",
    specificityRank: 2,
    defaultPriority: 30,
    canBePrimary: false,
    defaultRole: "context_only",
    notes: "Execution pacing context only. Usually not a top pattern by itself.",
  }),
  definePatternMetadata({
    patternId: "low_frequency_execution",
    family: PATTERN_FAMILIES.EXECUTION_FREQUENCY,
    patternType: "atomic",
    specificityRank: 2,
    defaultPriority: 30,
    canBePrimary: false,
    defaultRole: "context_only",
    notes: "Execution pacing context only. Usually not a top pattern by itself.",
  }),

  // =========================
  // POSITION BUILDING
  // =========================
  definePatternMetadata({
    patternId: "scaled_into_position",
    family: PATTERN_FAMILIES.POSITION_BUILDING,
    patternType: "atomic",
    specificityRank: 3,
    defaultPriority: 55,
    canBePrimary: false,
    defaultRole: "supporting_candidate",
    notes: "Broad structural fact often superseded by richer position structure patterns.",
  }),
  definePatternMetadata({
    patternId: "single_build_position",
    family: PATTERN_FAMILIES.POSITION_BUILDING,
    patternType: "atomic",
    specificityRank: 3,
    defaultPriority: 45,
    canBePrimary: false,
    defaultRole: "supporting_candidate",
    notes: "Broad structural fact. Usually supporting rather than primary.",
  }),

  // =========================
  // POSITION REDUCTION
  // =========================
  definePatternMetadata({
    patternId: "scaled_out_of_position",
    family: PATTERN_FAMILIES.POSITION_REDUCTION,
    patternType: "atomic",
    specificityRank: 3,
    defaultPriority: 55,
    canBePrimary: false,
    defaultRole: "supporting_candidate",
    notes: "Reduction fact. Often supports richer structure or scaling-quality patterns.",
  }),

  // =========================
  // POSITION STRUCTURE
  // =========================
  definePatternMetadata({
    patternId: "aggressive_scale_in",
    family: PATTERN_FAMILIES.POSITION_STRUCTURE,
    patternType: "composite",
    specificityRank: 6,
    defaultPriority: 75,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Higher-order position lifecycle pattern.",
  }),
  definePatternMetadata({
    patternId: "passive_scale_in",
    family: PATTERN_FAMILIES.POSITION_STRUCTURE,
    patternType: "composite",
    specificityRank: 6,
    defaultPriority: 72,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Higher-order position lifecycle pattern.",
  }),
  definePatternMetadata({
    patternId: "single_build_full_exit",
    family: PATTERN_FAMILIES.POSITION_STRUCTURE,
    patternType: "composite",
    specificityRank: 6,
    defaultPriority: 68,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Trade lifecycle structure with simple build and full close.",
  }),
  definePatternMetadata({
    patternId: "multi_build_full_exit",
    family: PATTERN_FAMILIES.POSITION_STRUCTURE,
    patternType: "composite",
    specificityRank: 7,
    defaultPriority: 80,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Strong lifecycle structure pattern. Often more useful than raw build facts.",
  }),
  definePatternMetadata({
    patternId: "multi_build_partial_exit",
    family: PATTERN_FAMILIES.POSITION_STRUCTURE,
    patternType: "composite",
    specificityRank: 7,
    defaultPriority: 78,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Strong lifecycle structure pattern with position still remaining.",
  }),
  definePatternMetadata({
    patternId: "scale_in_then_reduce",
    family: PATTERN_FAMILIES.POSITION_STRUCTURE,
    patternType: "composite",
    specificityRank: 7,
    defaultPriority: 79,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Strong active-management lifecycle pattern.",
  }),
  definePatternMetadata({
    patternId: "one_and_done_round_trip",
    family: PATTERN_FAMILIES.POSITION_STRUCTURE,
    patternType: "composite",
    specificityRank: 6,
    defaultPriority: 67,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Simple round-trip lifecycle pattern.",
  }),

  // =========================
  // TRADE DURATION
  // =========================
  definePatternMetadata({
    patternId: "quick_trade",
    family: PATTERN_FAMILIES.TRADE_DURATION,
    patternType: "atomic",
    specificityRank: 2,
    defaultPriority: 28,
    canBePrimary: false,
    defaultRole: "context_only",
    notes: "Trade duration context only.",
  }),
  definePatternMetadata({
    patternId: "extended_trade",
    family: PATTERN_FAMILIES.TRADE_DURATION,
    patternType: "atomic",
    specificityRank: 2,
    defaultPriority: 28,
    canBePrimary: false,
    defaultRole: "context_only",
    notes: "Trade duration context only.",
  }),

  // =========================
  // TRADE EXCURSION
  // =========================
  definePatternMetadata({
    patternId: "high_mfe_trade",
    family: PATTERN_FAMILIES.TRADE_EXCURSION,
    patternType: "atomic",
    specificityRank: 3,
    defaultPriority: 50,
    canBePrimary: false,
    defaultRole: "supporting_candidate",
    notes: "Important supporting trade opportunity fact.",
  }),
  definePatternMetadata({
    patternId: "high_mae_trade",
    family: PATTERN_FAMILIES.TRADE_EXCURSION,
    patternType: "atomic",
    specificityRank: 3,
    defaultPriority: 52,
    canBePrimary: false,
    defaultRole: "supporting_candidate",
    notes: "Important supporting adverse excursion fact.",
  }),

  // =========================
  // TRADE CLOSURE
  // =========================
  definePatternMetadata({
    patternId: "fully_closed_trade",
    family: PATTERN_FAMILIES.TRADE_CLOSURE,
    patternType: "atomic",
    specificityRank: 2,
    defaultPriority: 35,
    canBePrimary: false,
    defaultRole: "context_only",
    notes: "Closure state fact. Usually supports richer structure patterns.",
  }),
  definePatternMetadata({
    patternId: "partial_position_left",
    family: PATTERN_FAMILIES.TRADE_CLOSURE,
    patternType: "atomic",
    specificityRank: 2,
    defaultPriority: 35,
    canBePrimary: false,
    defaultRole: "context_only",
    notes: "Closure state fact. Usually supports richer structure patterns.",
  }),

  // =========================
  // ENTRY CONTEXT
  // =========================
  definePatternMetadata({
    patternId: "low_range_entry",
    family: PATTERN_FAMILIES.ENTRY_CONTEXT,
    patternType: "atomic",
    specificityRank: 4,
    defaultPriority: 58,
    canBePrimary: false,
    defaultRole: "supporting_candidate",
    notes: "Broad entry-location fact, often superseded by stricter or composite entry patterns.",
  }),
  definePatternMetadata({
    patternId: "high_range_entry",
    family: PATTERN_FAMILIES.ENTRY_CONTEXT,
    patternType: "atomic",
    specificityRank: 4,
    defaultPriority: 58,
    canBePrimary: false,
    defaultRole: "supporting_candidate",
    notes: "Broad entry-location fact, often superseded by stricter or composite entry patterns.",
  }),
  definePatternMetadata({
    patternId: "entry_near_trade_low",
    family: PATTERN_FAMILIES.ENTRY_CONTEXT,
    patternType: "atomic",
    specificityRank: 5,
    defaultPriority: 65,
    canBePrimary: false,
    defaultRole: "supporting_candidate",
    notes: "More specific than low_range_entry.",
  }),
  definePatternMetadata({
    patternId: "entry_near_trade_high",
    family: PATTERN_FAMILIES.ENTRY_CONTEXT,
    patternType: "atomic",
    specificityRank: 5,
    defaultPriority: 65,
    canBePrimary: false,
    defaultRole: "supporting_candidate",
    notes: "More specific than high_range_entry.",
  }),
  definePatternMetadata({
    patternId: "entry_with_favorable_remaining_upside",
    family: PATTERN_FAMILIES.ENTRY_CONTEXT,
    patternType: "atomic",
    specificityRank: 5,
    defaultPriority: 64,
    canBePrimary: false,
    defaultRole: "supporting_candidate",
    notes: "Strong supporting fact for later entry-quality interpretation.",
  }),
  definePatternMetadata({
    patternId: "entry_with_limited_remaining_upside",
    family: PATTERN_FAMILIES.ENTRY_CONTEXT,
    patternType: "atomic",
    specificityRank: 5,
    defaultPriority: 64,
    canBePrimary: false,
    defaultRole: "supporting_candidate",
    notes: "Strong supporting fact for later entry-quality interpretation.",
  }),
  definePatternMetadata({
    patternId: "entry_after_recent_run_up",
    family: PATTERN_FAMILIES.ENTRY_CONTEXT,
    patternType: "atomic",
    specificityRank: 5,
    defaultPriority: 63,
    canBePrimary: false,
    defaultRole: "supporting_candidate",
    notes: "Directional pre-entry context fact.",
  }),
  definePatternMetadata({
    patternId: "entry_after_recent_drop",
    family: PATTERN_FAMILIES.ENTRY_CONTEXT,
    patternType: "atomic",
    specificityRank: 5,
    defaultPriority: 63,
    canBePrimary: false,
    defaultRole: "supporting_candidate",
    notes: "Directional pre-entry context fact.",
  }),

  // =========================
  // ENTRY QUALITY
  // =========================
  definePatternMetadata({
    patternId: "advantaged_entry_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 8,
    defaultPriority: 88,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "High-value entry structure pattern.",
  }),
  definePatternMetadata({
    patternId: "disadvantaged_entry_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 8,
    defaultPriority: 88,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "High-value negative entry structure pattern.",
  }),
  definePatternMetadata({
    patternId: "breakout_with_room_above_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Support/resistance-aware breakout entry pattern that cleared nearby resistance and still retained room above.",
  }),
  definePatternMetadata({
    patternId: "breakout_into_overhead_resistance_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Support/resistance-aware weak breakout entry pattern that cleared nearby resistance directly into stacked overhead resistance.",
  }),
  definePatternMetadata({
    patternId: "breakout_with_room_above_and_constructive_final_exit",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Support/resistance-aware breakout storyline when the initial breakout cleared resistance with room above and the trade still finished constructively.",
  }),
  definePatternMetadata({
    patternId: "breakout_with_room_above_and_failed_profit_protection",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Support/resistance-aware breakout storyline when the initial breakout cleared resistance with room above but later profit protection still failed.",
  }),
  definePatternMetadata({
    patternId:
      "recovery_with_breakout_with_room_above_and_constructive_final_exit",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 92,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware breakout storyline when the trade first recovered from early adversity, then the initial breakout still cleared resistance with room above and finished constructively.",
  }),
  definePatternMetadata({
    patternId:
      "recovery_with_breakout_with_room_above_and_failed_profit_protection",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 92,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware breakout storyline when the trade first recovered from early adversity, then the initial breakout still cleared resistance with room above but later profit protection still failed.",
  }),
  definePatternMetadata({
    patternId: "breakout_into_overhead_resistance_with_defensive_final_exit",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Support/resistance-aware weak breakout storyline when the initial breakout cleared nearby resistance directly into stacked overhead resistance and the trade later needed a disciplined defensive exit.",
  }),
  definePatternMetadata({
    patternId: "breakout_into_overhead_resistance_with_failed_profit_protection",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Support/resistance-aware weak breakout storyline when the initial breakout cleared nearby resistance directly into stacked overhead resistance and later profit protection still failed.",
  }),
  definePatternMetadata({
    patternId:
      "recovery_with_breakout_into_overhead_resistance_and_defensive_final_exit",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 92,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware weak breakout storyline when the trade first recovered from early adversity, then the breakout still cleared into stacked overhead resistance and later needed a disciplined defensive exit.",
  }),
  definePatternMetadata({
    patternId:
      "recovery_with_breakout_into_overhead_resistance_and_failed_profit_protection",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 92,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware weak breakout storyline when the trade first recovered from early adversity, then the breakout still cleared into stacked overhead resistance and later profit protection still failed.",
  }),
  definePatternMetadata({
    patternId: "entry_near_support_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 89,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "First explicit support-aware entry pattern when the initial entry occurred near identified support without also being pinned under resistance.",
  }),
  definePatternMetadata({
    patternId: "entry_under_resistance_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 89,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "First explicit support-aware weak-side entry pattern when the initial entry occurred near identified overhead resistance.",
  }),
  definePatternMetadata({
    patternId: "entry_far_from_support_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 89,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "First explicit distance-aware entry pattern when the initial entry occurred meaningfully far from identified support.",
  }),
  definePatternMetadata({
    patternId: "efficient_entry_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 7,
    defaultPriority: 82,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Broad strong entry-structure pattern, less specific than advantaged/disadvantaged entry structure.",
  }),
  definePatternMetadata({
    patternId: "inefficient_entry_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 7,
    defaultPriority: 82,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Broad weak entry-structure pattern, less specific than disadvantaged entry structure.",
  }),
  definePatternMetadata({
    patternId: "late_favorable_extension_entry_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Richer late-entry storyline when the trade had already moved in the intended direction before a structurally late first entry.",
  }),
  definePatternMetadata({
    patternId: "constructive_pullback_entry_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Richer constructive entry storyline when the first entry came after a direction-aware pullback and still retained favorable structure.",
  }),
  definePatternMetadata({
    patternId: "disciplined_favorable_extension_entry_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Richer constructive continuation-entry storyline when the first entry followed a favorable extension but still retained strong structure.",
  }),
  definePatternMetadata({
    patternId: "breakout_entry_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "First explicit named breakout-style entry family when a measured favorable extension still led to strong continuation-entry structure.",
  }),
  definePatternMetadata({
    patternId: "measured_favorable_extension_entry_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Sharper constructive continuation-entry storyline when the first entry followed a real but still measured favorable extension and retained strong structure.",
  }),
  definePatternMetadata({
    patternId: "overextended_chase_entry_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Sharper chase-style entry storyline when a strong favorable extension still led to a very stretched late first entry with weak eventual structure.",
  }),
  definePatternMetadata({
    patternId: "breakout_chase_entry_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 92,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "First explicit named breakout-chase family when a strong favorable extension still led to a structurally stretched late entry.",
  }),
  definePatternMetadata({
    patternId: "failed_breakout_entry_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "First explicit named failed-breakout family when a measured favorable extension still led to weak post-entry structure.",
  }),
  definePatternMetadata({
    patternId: "reclaim_entry_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 93,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "First explicit reclaim-entry family using a recent pre-entry reference reclaim that held into entry and still led to strong post-entry structure.",
  }),
  definePatternMetadata({
    patternId: "failed_reclaim_entry_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 93,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "First explicit failed-reclaim family when a recent pre-entry reference reclaim still led to weak post-entry structure.",
  }),
  definePatternMetadata({
    patternId: "mean_reversion_entry_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 94,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "First explicit mean-reversion family when a deeper countertrend move plus recent reference reclaim still led to strong post-entry structure.",
  }),
  definePatternMetadata({
    patternId: "failed_mean_reversion_entry_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 94,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "First explicit failed mean-reversion family when a deeper countertrend move plus recent reference reclaim still led to weak post-entry structure.",
  }),
  definePatternMetadata({
    patternId: "opening_range_breakout_entry_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 94,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "First explicit opening-range breakout family when the first entry occurred beyond a true opening-range window and still retained strong structure.",
  }),
  definePatternMetadata({
    patternId: "opening_range_breakout_chase_entry_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 13,
    defaultPriority: 95,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "First explicit opening-range breakout-chase family when the first entry occurred beyond a true opening-range window in a stretched way and still had weak structure.",
  }),
  definePatternMetadata({
    patternId: "failed_opening_range_breakout_entry_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 94,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "First explicit failed opening-range breakout family when the first entry occurred beyond a true opening-range window but still failed quickly after entry.",
  }),
  definePatternMetadata({
    patternId: "opening_range_reclaim_entry_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 13,
    defaultPriority: 95,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "First explicit opening-range reclaim family when the opening-range boundary was reclaimed and still held into a strong entry.",
  }),
  definePatternMetadata({
    patternId: "failed_opening_range_reclaim_entry_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 13,
    defaultPriority: 95,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "First explicit failed opening-range reclaim family when the opening-range boundary was reclaimed into entry but post-entry structure still failed quickly.",
  }),
  definePatternMetadata({
    patternId: "market_open_breakout_entry_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 93,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "First explicit market-open breakout family when the first entry occurred beyond the pre-entry opening range and still retained strong structure.",
  }),
  definePatternMetadata({
    patternId: "market_open_breakout_chase_entry_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 94,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "First explicit market-open breakout-chase family when the first entry occurred beyond the pre-entry opening range in a stretched way and still had weak structure.",
  }),
  definePatternMetadata({
    patternId: "failed_market_open_breakout_entry_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 93,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "First explicit failed market-open breakout family when the first entry occurred beyond the pre-entry opening range but still failed quickly after entry.",
  }),
  definePatternMetadata({
    patternId: "market_open_reclaim_entry_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 94,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "First explicit market-open reclaim family when a recent reference reclaim held into entry during the market-open session and still led to strong post-entry structure.",
  }),
  definePatternMetadata({
    patternId: "failed_market_open_reclaim_entry_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 94,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "First explicit failed market-open reclaim family when a recent reference reclaim held into entry during the market-open session but still led to weak post-entry structure.",
  }),
  definePatternMetadata({
    patternId: "weak_pullback_entry_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Richer weak-entry storyline when the first entry followed a direction-aware pullback but still had weak structural quality.",
  }),
  definePatternMetadata({
    patternId: "deep_constructive_pullback_entry_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Sharper constructive pullback-entry storyline when a deeper countertrend pullback still led to a structurally strong first entry.",
  }),
  definePatternMetadata({
    patternId: "deep_weak_pullback_entry_structure",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Sharper weak pullback-entry storyline when a deeper countertrend pullback still led to a structurally weak first entry.",
  }),

  // =========================
  // EXIT QUALITY
  // =========================
  definePatternMetadata({
    patternId: "high_capture_exit_structure",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 8,
    defaultPriority: 85,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Strong final-exit capture pattern.",
  }),
  definePatternMetadata({
    patternId: "moderate_capture_exit_structure",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 7,
    defaultPriority: 82,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Meaningful capture but not top-tier capture.",
  }),
  definePatternMetadata({
    patternId: "low_capture_exit_structure",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 7,
    defaultPriority: 78,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Weak capture structure.",
  }),
  definePatternMetadata({
    patternId: "exit_with_limited_giveback",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 6,
    defaultPriority: 70,
    canBePrimary: true,
    defaultRole: "supporting_candidate",
    notes: "Useful exit-efficiency descriptor, often supporting richer capture patterns.",
  }),
  definePatternMetadata({
    patternId: "exit_with_meaningful_giveback",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 6,
    defaultPriority: 74,
    canBePrimary: true,
    defaultRole: "supporting_candidate",
    notes: "Useful exit-inefficiency descriptor, often supporting capture patterns.",
  }),
  definePatternMetadata({
    patternId: "exit_near_favorable_extreme",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 6,
    defaultPriority: 73,
    canBePrimary: true,
    defaultRole: "supporting_candidate",
    notes: "Specific location descriptor, often supporting stronger exit-quality patterns.",
  }),
  definePatternMetadata({
    patternId: "peak_profit_giveback_structure",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 7,
    defaultPriority: 76,
    canBePrimary: true,
    defaultRole: "supporting_candidate",
    notes: "Higher-value exit/management descriptor around open-profit giveback.",
  }),
  definePatternMetadata({
    patternId: "partial_exit_with_adverse_followthrough",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 7,
    defaultPriority: 75,
    canBePrimary: true,
    defaultRole: "supporting_candidate",
    notes: "Describes unfavorable followthrough after a partial exit.",
  }),
  definePatternMetadata({
    patternId: "missed_post_exit_continuation",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 7,
    defaultPriority: 77,
    canBePrimary: true,
    defaultRole: "supporting_candidate",
    notes: "Describes favorable continuation that persisted after the final exit.",
  }),
  definePatternMetadata({
    patternId: "exit_avoided_adverse_followthrough",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 7,
    defaultPriority: 77,
    canBePrimary: true,
    defaultRole: "supporting_candidate",
    notes: "Describes adverse followthrough that occurred after the final exit.",
  }),
  definePatternMetadata({
    patternId: "defensive_exit_after_deterioration",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 8,
    defaultPriority: 83,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Richer defensive-exit storyline when meaningful deterioration had already occurred and the final exit avoided further damage.",
  }),
  definePatternMetadata({
    patternId: "premature_final_exit_after_constructive_management",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 8,
    defaultPriority: 83,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Richer early-exit storyline when management was otherwise constructive but the final exit still left meaningful continuation.",
  }),
  definePatternMetadata({
    patternId: "fearful_exit_after_weakening",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 84,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Richer exit storyline when the final exit happened from weakness and the trade recovered afterward.",
  }),
  definePatternMetadata({
    patternId: "exit_into_support_structure",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 85,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "First explicit support-aware exit pattern when the final exit occurred into nearby identified support.",
  }),
  definePatternMetadata({
    patternId: "exit_into_support_with_relief_after_exit",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 86,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Richer support-aware exit pattern when the final exit occurred into support and price relieved higher afterward.",
  }),
  definePatternMetadata({
    patternId: "exit_into_support_before_breakdown",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 86,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Richer support-aware exit pattern when the final exit occurred into support but price still broke lower afterward.",
  }),
  definePatternMetadata({
    patternId: "exit_into_stacked_support_with_relief_after_exit",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 87,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Richer support-aware exit pattern when the final exit occurred into stacked support and price relieved higher afterward.",
  }),
  definePatternMetadata({
    patternId: "exit_into_thin_support_before_breakdown",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 87,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Richer support-aware exit pattern when the final exit occurred into thin support and price still broke lower afterward.",
  }),
  definePatternMetadata({
    patternId: "exit_into_resistance_with_reversal_after_exit",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 86,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Richer resistance-aware exit pattern when the final exit occurred into nearby resistance and price later reversed lower afterward.",
  }),
  definePatternMetadata({
    patternId: "exit_into_resistance_before_breakout",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 86,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Richer resistance-aware exit pattern when the final exit occurred into nearby resistance but price later broke higher afterward.",
  }),
  definePatternMetadata({
    patternId: "stabilized_recovery_with_exit_into_stacked_support_and_relief",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 88,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware support exit storyline when early adversity stabilized, the final exit occurred into stacked support, and price relieved higher afterward.",
  }),
  definePatternMetadata({
    patternId: "stabilized_recovery_with_exit_into_resistance_and_reversal",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 87,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware resistance exit storyline when early adversity stabilized, the final exit occurred into nearby resistance, and price later reversed lower afterward.",
  }),
  definePatternMetadata({
    patternId: "stabilized_recovery_with_exit_into_resistance_before_breakout",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 87,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware resistance exit storyline when early adversity stabilized, the final exit occurred into nearby resistance, but price later broke higher afterward.",
  }),
  definePatternMetadata({
    patternId: "stabilized_recovery_with_exit_into_thin_support_before_breakdown",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 88,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware support exit storyline when early adversity stabilized, the final exit occurred into thin support, and price still broke lower afterward.",
  }),
  definePatternMetadata({
    patternId: "disciplined_defensive_exit",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 84,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Richer defensive-exit storyline when the final exit avoided later damage without already suffering major giveback.",
  }),
  definePatternMetadata({
    patternId: "stop_like_forced_exit_after_breakdown",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 85,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Richer stop-like exit storyline when the trade had already broken down materially, the final exit occurred near the weak side, and deterioration continued afterward.",
  }),
  definePatternMetadata({
    patternId: "stop_like_forced_exit_before_rebound",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 85,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Richer stop-like exit storyline when the trade had already broken down materially, the final exit occurred near the weak side, and price still rebounded afterward.",
  }),
  definePatternMetadata({
    patternId: "held_through_danger_with_stop_like_forced_exit_after_breakdown",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 87,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Cross-family stop-like storyline when open profit danger was held through and the final exit still came as a breakdown-driven stop-like exit that deteriorated further afterward.",
  }),
  definePatternMetadata({
    patternId: "held_through_danger_with_stop_like_forced_exit_before_rebound",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 87,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Cross-family stop-like storyline when open profit danger was held through and the final exit still came as a breakdown-driven stop-like exit before rebound.",
  }),
  definePatternMetadata({
    patternId: "delayed_risk_response_with_stop_like_forced_exit_after_breakdown",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 88,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Cross-family stop-like storyline when risk response was delayed and the final exit still came as a breakdown-driven stop-like exit that deteriorated further afterward.",
  }),
  definePatternMetadata({
    patternId: "delayed_risk_response_with_stop_like_forced_exit_before_rebound",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 88,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Cross-family stop-like storyline when risk response was delayed and the final exit still came as a breakdown-driven stop-like exit before rebound.",
  }),
  definePatternMetadata({
    patternId: "stabilized_recovery_with_constructive_final_exit",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 86,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Combined recovery and exit storyline when an early-adversity recovery later stabilized and the final exit still avoided further damage.",
  }),
  definePatternMetadata({
    patternId: "stabilized_recovery_with_premature_final_exit",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 86,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Combined recovery and exit storyline when an early-adversity recovery later stabilized but the final exit still came before meaningful continuation persisted.",
  }),
  definePatternMetadata({
    patternId: "stabilized_recovery_with_stop_like_forced_exit_after_breakdown",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 89,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Combined recovery and stop-like exit storyline when an early-adversity recovery later stabilized enough to reduce, but the trade still ended in a breakdown-driven stop-like final exit with further deterioration afterward.",
  }),
  definePatternMetadata({
    patternId: "stabilized_recovery_with_stop_like_forced_exit_before_rebound",
    family: PATTERN_FAMILIES.EXIT_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 89,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Combined recovery and stop-like exit storyline when an early-adversity recovery later stabilized enough to reduce, but the trade still ended in a stop-like weak-side exit before rebound.",
  }),

  // =========================
  // POSITION REDUCTION
  // =========================
  definePatternMetadata({
    patternId: "reduction_into_strength",
    family: PATTERN_FAMILIES.POSITION_REDUCTION,
    patternType: "composite",
    specificityRank: 6,
    defaultPriority: 70,
    canBePrimary: true,
    defaultRole: "supporting_candidate",
    notes: "Richer reduction-context pattern than broad reduction facts.",
  }),
  definePatternMetadata({
    patternId: "reduction_into_weakness",
    family: PATTERN_FAMILIES.POSITION_REDUCTION,
    patternType: "composite",
    specificityRank: 6,
    defaultPriority: 72,
    canBePrimary: true,
    defaultRole: "supporting_candidate",
    notes: "Richer reduction-context pattern than broad reduction facts.",
  }),
  definePatternMetadata({
    patternId: "profit_protection_present",
    family: PATTERN_FAMILIES.POSITION_REDUCTION,
    patternType: "composite",
    specificityRank: 7,
    defaultPriority: 77,
    canBePrimary: true,
    defaultRole: "supporting_candidate",
    notes: "Constructive reduction/profit-protection structure.",
  }),
  definePatternMetadata({
    patternId: "timely_risk_response_after_peak_profit",
    family: PATTERN_FAMILIES.POSITION_REDUCTION,
    patternType: "composite",
    specificityRank: 8,
    defaultPriority: 81,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Constructive risk-management pattern when reduction happened promptly in the danger window.",
  }),
  definePatternMetadata({
    patternId: "timely_risk_response_with_profit_protection",
    family: PATTERN_FAMILIES.POSITION_REDUCTION,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 86,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Constructive sequence-level pattern combining timely response with retained open-profit protection.",
  }),
  definePatternMetadata({
    patternId: "failed_profit_protection_structure",
    family: PATTERN_FAMILIES.POSITION_REDUCTION,
    patternType: "composite",
    specificityRank: 8,
    defaultPriority: 84,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "High-value failed management structure around open-profit giveback.",
  }),
  definePatternMetadata({
    patternId: "reduction_after_recent_run_up",
    family: PATTERN_FAMILIES.POSITION_REDUCTION,
    patternType: "atomic",
    specificityRank: 5,
    defaultPriority: 62,
    canBePrimary: false,
    defaultRole: "supporting_candidate",
    notes: "Directional pre-reduction context fact.",
  }),
  definePatternMetadata({
    patternId: "reduction_after_recent_drop",
    family: PATTERN_FAMILIES.POSITION_REDUCTION,
    patternType: "atomic",
    specificityRank: 5,
    defaultPriority: 62,
    canBePrimary: false,
    defaultRole: "supporting_candidate",
    notes: "Directional pre-reduction context fact.",
  }),
  definePatternMetadata({
    patternId: "held_through_danger_after_peak_profit",
    family: PATTERN_FAMILIES.POSITION_REDUCTION,
    patternType: "composite",
    specificityRank: 8,
    defaultPriority: 83,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "High-value risk-management failure pattern when no reduction occurred during the danger window.",
  }),
  definePatternMetadata({
    patternId: "delayed_risk_response_after_peak_profit",
    family: PATTERN_FAMILIES.POSITION_REDUCTION,
    patternType: "composite",
    specificityRank: 8,
    defaultPriority: 82,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "High-value risk-management delay pattern when reduction came too late during the danger window.",
  }),
  definePatternMetadata({
    patternId: "delayed_risk_response_with_failed_profit_protection",
    family: PATTERN_FAMILIES.POSITION_REDUCTION,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 85,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Sequence-level risk-management failure pattern combining delayed reduction and failed protection.",
  }),

  // =========================
  // SCALING QUALITY
  // =========================
  definePatternMetadata({
    patternId: "structured_position_building",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 6,
    defaultPriority: 72,
    canBePrimary: true,
    defaultRole: "supporting_candidate",
    notes: "Broad middle-trade sizing structure pattern.",
  }),
  definePatternMetadata({
    patternId: "balanced_position_management",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 7,
    defaultPriority: 79,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Stronger middle-trade management structure than simple position building.",
  }),
  definePatternMetadata({
    patternId: "one_sided_aggressive_building",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 7,
    defaultPriority: 80,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Stronger directional sizing structure pattern.",
  }),
  definePatternMetadata({
    patternId: "underutilized_position_building",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 7,
    defaultPriority: 74,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Meaningful structure pattern for limited sizing on a trade with real opportunity.",
  }),
  definePatternMetadata({
    patternId: "underutilized_winner_with_constructive_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 8,
    defaultPriority: 84,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Constructive whole-trade storyline when meaningful opportunity was present but sizing stayed limited and the final exit still remained disciplined.",
  }),
  definePatternMetadata({
    patternId: "recovery_to_underutilized_winner_with_constructive_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware constructive storyline when a trade recovered from early adversity, sizing still stayed limited, and the final exit remained disciplined.",
  }),
  definePatternMetadata({
    patternId:
      "underutilized_winner_with_timely_profit_protection_and_constructive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Constructive whole-trade storyline when meaningful opportunity was under-pressed, profit was still protected in time, and the final exit remained disciplined.",
  }),
  definePatternMetadata({
    patternId: "underutilized_winner_with_premature_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 88,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Cross-family whole-trade storyline when meaningful opportunity was under-pressed and the final exit still came before meaningful continuation finished.",
  }),
  definePatternMetadata({
    patternId:
      "recovery_to_underutilized_winner_with_timely_profit_protection_and_constructive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 92,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware constructive storyline when a trade recovered from early adversity, stayed under-sized despite opportunity, still protected profit in time, and finished with a disciplined final exit.",
  }),
  definePatternMetadata({
    patternId: "recovery_to_underutilized_winner_with_premature_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware whole-trade storyline when a trade recovered from early adversity, stayed under-sized despite opportunity, and the final exit still came before meaningful continuation finished.",
  }),
  definePatternMetadata({
    patternId: "underutilized_winner_with_missed_final_continuation",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 88,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Missed-opportunity storyline when meaningful opportunity was under-pressed and the final exit still left favorable continuation behind.",
  }),
  definePatternMetadata({
    patternId: "recovery_to_underutilized_winner_with_missed_final_continuation",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware missed-opportunity storyline when a trade recovered from early adversity, stayed under-sized despite opportunity, and the final exit still left favorable continuation behind.",
  }),
  definePatternMetadata({
    patternId: "readd_after_reduction",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "atomic",
    specificityRank: 5,
    defaultPriority: 66,
    canBePrimary: false,
    defaultRole: "supporting_candidate",
    notes: "Important scaling-sequence fact.",
  }),
  definePatternMetadata({
    patternId: "adding_above_prior_basis",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 6,
    defaultPriority: 73,
    canBePrimary: true,
    defaultRole: "supporting_candidate",
    notes: "Specific add-context structure often supporting richer scaling patterns.",
  }),
  definePatternMetadata({
    patternId: "add_into_strength",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 7,
    defaultPriority: 81,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "High-value scaling pattern for adds occurring from strength.",
  }),
  definePatternMetadata({
    patternId: "add_into_weakness",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 7,
    defaultPriority: 81,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "High-value scaling pattern for adds occurring from weakness.",
  }),
  definePatternMetadata({
    patternId: "revenge_adding_after_weakness",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 88,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Named revenge-add proxy when repeated below-basis adds keep occurring into weakness without meaningful reduction.",
  }),
  definePatternMetadata({
    patternId: "add_after_recent_run_up",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "atomic",
    specificityRank: 5,
    defaultPriority: 64,
    canBePrimary: false,
    defaultRole: "supporting_candidate",
    notes: "Directional pre-add context fact.",
  }),
  definePatternMetadata({
    patternId: "add_after_recent_drop",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "atomic",
    specificityRank: 5,
    defaultPriority: 64,
    canBePrimary: false,
    defaultRole: "supporting_candidate",
    notes: "Directional pre-add context fact.",
  }),
  definePatternMetadata({
    patternId: "balanced_scaling_with_profit_protection",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 8,
    defaultPriority: 86,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "High-value composite management pattern combining scaling and profit protection.",
  }),
  definePatternMetadata({
    patternId: "add_into_strength_with_constructive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 88,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Constructive whole-trade storyline when the trader pressed into strength and still finished with a disciplined constructive exit.",
  }),
  definePatternMetadata({
    patternId: "add_into_strength_with_premature_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 88,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Cross-family whole-trade storyline when the trader pressed into strength but the final exit still came before meaningful continuation finished.",
  }),
  definePatternMetadata({
    patternId: "recovery_with_add_into_strength_and_constructive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware constructive whole-trade storyline when early adversity was followed by constructive adding into strength and a disciplined final exit.",
  }),
  definePatternMetadata({
    patternId: "recovery_with_add_into_strength_and_premature_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware whole-trade storyline when early adversity was followed by adding into strength but the final exit still came before meaningful continuation finished.",
  }),
  definePatternMetadata({
    patternId:
      "add_into_strength_with_timely_profit_protection_and_constructive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Constructive whole-trade storyline when the trader pressed into strength, still protected profit in time, and finished with a disciplined constructive exit.",
  }),
  definePatternMetadata({
    patternId:
      "recovery_with_add_into_strength_and_timely_profit_protection_and_constructive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 92,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware constructive whole-trade storyline when early adversity was followed by constructive adding into strength, timely profit protection, and a disciplined final exit.",
  }),
  definePatternMetadata({
    patternId: "add_into_strength_with_missed_final_continuation",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 88,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Missed-opportunity storyline when the trader pressed into strength but the final exit still left favorable continuation behind.",
  }),
  definePatternMetadata({
    patternId: "recovery_with_add_into_strength_and_missed_final_continuation",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware missed-opportunity storyline when early adversity was followed by constructive pressing into strength but the final exit still left favorable continuation behind.",
  }),
  definePatternMetadata({
    patternId: "constructive_readd_after_reduction",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 8,
    defaultPriority: 84,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Constructive sequence pattern when a re-add happened from strength without later damaging giveback.",
  }),
  definePatternMetadata({
    patternId: "balanced_management_with_constructive_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 89,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Constructive storyline pattern combining balanced scaling, retained profit protection, and a relieving final exit.",
  }),
  definePatternMetadata({
    patternId: "recovery_with_balanced_management_and_constructive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware whole-trade storyline when early adversity was followed by balanced management and a disciplined constructive final exit.",
  }),
  definePatternMetadata({
    patternId:
      "balanced_management_with_take_profit_into_resistance_and_constructive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Support-aware whole-trade storyline when balanced management included profit-taking into nearby resistance and still ended with a disciplined constructive final exit.",
  }),
  definePatternMetadata({
    patternId:
      "recovery_with_balanced_management_and_take_profit_into_resistance_and_constructive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware support-aware whole-trade storyline when early adversity was followed by balanced management, profit-taking into nearby resistance, and a disciplined constructive final exit.",
  }),
  definePatternMetadata({
    patternId: "balanced_management_with_missed_final_continuation",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 89,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Broad whole-trade storyline when active balanced management still ended with a final exit that left favorable continuation behind.",
  }),
  definePatternMetadata({
    patternId: "recovery_with_balanced_management_and_missed_final_continuation",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware whole-trade storyline when early adversity was followed by balanced management but the final exit still left favorable continuation behind.",
  }),
  definePatternMetadata({
    patternId: "balanced_management_with_fearful_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Broad whole-trade storyline when active balanced management still later ended in a fearful final exit before the trade recovered after exit.",
  }),
  definePatternMetadata({
    patternId: "recovery_with_balanced_management_and_fearful_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware whole-trade storyline when early adversity was followed by balanced management but the trade still later ended in a fearful final exit before rebounding.",
  }),
  definePatternMetadata({
    patternId: "balanced_management_with_premature_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 89,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Cross-family whole-trade storyline combining balanced management with a final exit that still came before meaningful continuation persisted.",
  }),
  definePatternMetadata({
    patternId: "recovery_with_balanced_management_and_premature_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware whole-trade storyline when early adversity was followed by balanced management but the final exit still came before meaningful continuation persisted.",
  }),
  definePatternMetadata({
    patternId:
      "balanced_management_with_take_profit_into_resistance_and_premature_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Support-aware whole-trade storyline when balanced management included profit-taking into nearby resistance but the final exit still came before breakout continuation persisted.",
  }),
  definePatternMetadata({
    patternId:
      "recovery_with_balanced_management_and_take_profit_into_resistance_and_premature_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware support-aware whole-trade storyline when early adversity was followed by balanced management, profit-taking into nearby resistance, but the final exit still came before breakout continuation persisted.",
  }),
  definePatternMetadata({
    patternId:
      "balanced_management_with_defensive_final_exit_after_deterioration",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Broad whole-trade storyline when active balanced management still later ended in a defensive final exit after meaningful deterioration.",
  }),
  definePatternMetadata({
    patternId:
      "recovery_with_balanced_management_and_defensive_final_exit_after_deterioration",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware whole-trade storyline when early adversity was followed by balanced management but the trade still later ended in a defensive final exit after deterioration.",
  }),
  definePatternMetadata({
    patternId: "balanced_management_with_stop_like_forced_exit_after_breakdown",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Broad whole-trade storyline combining balanced management with a later stop-like forced exit after further breakdown.",
  }),
  definePatternMetadata({
    patternId: "balanced_management_with_stop_like_forced_exit_before_rebound",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Broad whole-trade storyline combining balanced management with a later stop-like forced exit before rebound.",
  }),
  definePatternMetadata({
    patternId:
      "recovery_with_balanced_management_and_stop_like_forced_exit_after_breakdown",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware whole-trade storyline when early adversity was followed by balanced management but the trade still later ended in a stop-like forced exit after further breakdown.",
  }),
  definePatternMetadata({
    patternId:
      "recovery_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware whole-trade storyline when early adversity was followed by balanced management but the trade still later ended in a stop-like forced exit before rebound.",
  }),
  definePatternMetadata({
    patternId: "trim_into_strength_with_constructive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Constructive whole-trade storyline when a trim happened into strength and the final exit still avoided later damage.",
  }),
  definePatternMetadata({
    patternId: "trim_into_strength_with_premature_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Cross-family whole-trade storyline when a trim happened into strength but the final exit still came before meaningful continuation persisted.",
  }),
  definePatternMetadata({
    patternId: "trim_into_resistance_with_constructive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Support-aware constructive whole-trade storyline when a trim happened into nearby resistance and the final exit still avoided later damage.",
  }),
  definePatternMetadata({
    patternId: "trim_into_resistance_with_premature_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Support-aware whole-trade storyline when a trim happened into nearby resistance but the final exit still came before the breakout continuation persisted.",
  }),
  definePatternMetadata({
    patternId: "timely_profit_protection_with_constructive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Constructive whole-trade storyline when timely profit protection held and the final exit still avoided later damage.",
  }),
  definePatternMetadata({
    patternId: "timely_profit_protection_with_premature_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Cross-family whole-trade storyline when profit was protected in time but the final exit still came before meaningful continuation persisted.",
  }),
  definePatternMetadata({
    patternId:
      "timely_risk_response_with_defensive_final_exit_after_deterioration",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Cross-family whole-trade storyline when profit was protected in time but the trade still later deteriorated enough to require a defensive final exit.",
  }),
  definePatternMetadata({
    patternId: "timely_risk_response_with_stop_like_forced_exit_after_breakdown",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Cross-family whole-trade storyline when the trader responded to peak-profit danger in time but the trade still later unraveled into a stop-like breakdown exit.",
  }),
  definePatternMetadata({
    patternId: "timely_risk_response_with_stop_like_forced_exit_before_rebound",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Cross-family whole-trade storyline when the trader responded to peak-profit danger in time but the trade still later ended in a stop-like weak-side exit before rebound.",
  }),
  definePatternMetadata({
    patternId:
      "recovery_with_timely_profit_protection_and_constructive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 92,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware constructive whole-trade storyline when early adversity was followed by timely profit protection and a disciplined constructive final exit.",
  }),
  definePatternMetadata({
    patternId: "recovery_with_timely_profit_protection_and_premature_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 92,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware whole-trade storyline when early adversity was followed by timely profit protection but the final exit still came before meaningful continuation persisted.",
  }),
  definePatternMetadata({
    patternId:
      "recovery_with_timely_risk_response_and_defensive_final_exit_after_deterioration",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 92,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware whole-trade storyline when early adversity was followed by timely profit protection but the trade still later deteriorated enough to require a defensive final exit.",
  }),
  definePatternMetadata({
    patternId:
      "recovery_with_timely_risk_response_and_stop_like_forced_exit_after_breakdown",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 93,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware whole-trade storyline when early adversity was followed by timely danger-window response but the trade still later unraveled into a stop-like breakdown exit.",
  }),
  definePatternMetadata({
    patternId:
      "recovery_with_timely_risk_response_and_stop_like_forced_exit_before_rebound",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 93,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware whole-trade storyline when early adversity was followed by timely danger-window response but the trade still later ended in a stop-like weak-side exit before rebound.",
  }),
  definePatternMetadata({
    patternId: "recovery_with_trim_into_strength_and_constructive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 92,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware constructive whole-trade storyline when early adversity was followed by a trim into strength and a disciplined constructive final exit.",
  }),
  definePatternMetadata({
    patternId: "recovery_with_trim_into_strength_and_premature_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 92,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware whole-trade storyline when early adversity was followed by a trim into strength but the final exit still came before meaningful continuation persisted.",
  }),
  definePatternMetadata({
    patternId: "recovery_with_trim_into_resistance_and_constructive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 93,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware support-aware constructive whole-trade storyline when early adversity was followed by a trim into nearby resistance and a disciplined constructive final exit.",
  }),
  definePatternMetadata({
    patternId: "recovery_with_trim_into_resistance_and_premature_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 93,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware support-aware whole-trade storyline when early adversity was followed by a trim into nearby resistance but the final exit still came before breakout continuation persisted.",
  }),
  definePatternMetadata({
    patternId: "timely_trim_into_strength_with_constructive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 92,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Constructive whole-trade storyline when a trim into strength also happened with timely risk response and the final exit remained disciplined.",
  }),
  definePatternMetadata({
    patternId: "recovery_with_timely_trim_into_strength_and_constructive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 94,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware constructive whole-trade storyline when early adversity was followed by a timely trim into strength and a disciplined constructive final exit.",
  }),
  definePatternMetadata({
    patternId: "trim_readd_with_constructive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Constructive storyline pattern describing a trim, later re-add, and final exit that avoided adverse followthrough.",
  }),
  definePatternMetadata({
    patternId: "trim_readd_with_missed_final_continuation",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Failure-side storyline pattern describing a trim, later re-add, and final exit before favorable continuation persisted.",
  }),
  definePatternMetadata({
    patternId: "constructive_recovery_after_early_adversity",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Constructive storyline pattern when the trade recovered from early open loss and still retained a constructive outcome.",
  }),
  definePatternMetadata({
    patternId: "recovery_after_early_adversity_with_failed_protection",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 88,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Failure-side storyline pattern when the trade recovered from early adversity but still gave back too much later.",
  }),
  definePatternMetadata({
    patternId: "recovery_after_early_adversity_with_stabilized_management",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Richer constructive recovery storyline when the trade recovered from early adversity and later management stabilized the trade after peak open profit.",
  }),
  definePatternMetadata({
    patternId: "repeated_trim_readd_with_constructive_management",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Constructive multi-cycle storyline when repeated trim/re-add management still ended in a stable outcome.",
  }),
  definePatternMetadata({
    patternId: "repeated_trim_readd_with_unstable_management",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Failure-side multi-cycle storyline when repeated trim/re-add behavior still destabilized the trade.",
  }),
  definePatternMetadata({
    patternId: "repeated_rescue_attempts_with_renewed_deterioration",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 92,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Richer failure-side rescue storyline when the trade recovered from early adversity, then repeated trim/re-add rescue attempts still ended in renewed deterioration.",
  }),
  definePatternMetadata({
    patternId: "late_chase_reentry_after_constructive_trim",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 89,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Re-entry storyline when a constructive trim was followed by a late chase-style re-entry after continued strength.",
  }),
  definePatternMetadata({
    patternId: "good_pullback_reentry_after_constructive_trim",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 89,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Re-entry storyline when a constructive trim was followed by a calmer pullback-style re-entry.",
  }),
  definePatternMetadata({
    patternId: "constructive_reentry_followthrough_after_trim",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Richer trim-and-reentry storyline when the re-entry was followed by stronger favorable followthrough before the next action.",
  }),
  definePatternMetadata({
    patternId: "constructive_reentry_with_constructive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "One-cycle constructive storyline when a constructive re-entry still ended with a disciplined constructive final exit.",
  }),
  definePatternMetadata({
    patternId: "constructive_reentry_with_premature_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "One-cycle constructive storyline when a constructive re-entry still ended with a final exit that left meaningful continuation afterward.",
  }),
  definePatternMetadata({
    patternId: "constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 92,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "One-cycle constructive storyline when a constructive re-entry still later unraveled into a stop-like breakdown exit.",
  }),
  definePatternMetadata({
    patternId: "constructive_reentry_with_stop_like_forced_exit_before_rebound",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 92,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "One-cycle constructive storyline when a constructive re-entry still later ended in a stop-like weak-side exit before rebound.",
  }),
  definePatternMetadata({
    patternId: "recovery_with_constructive_final_exit_after_constructive_reentry",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 93,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware constructive storyline when early adversity was followed by a constructive re-entry and a disciplined constructive final exit.",
  }),
  definePatternMetadata({
    patternId: "recovery_with_premature_final_exit_after_constructive_reentry",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 93,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware one-cycle storyline when early adversity was followed by a constructive re-entry but the final exit still came before meaningful continuation finished.",
  }),
  definePatternMetadata({
    patternId: "recovery_with_stop_like_forced_exit_after_constructive_reentry",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 94,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware one-cycle storyline when early adversity was followed by a constructive re-entry but the trade still later unraveled into a stop-like breakdown exit.",
  }),
  definePatternMetadata({
    patternId:
      "recovery_with_stop_like_forced_exit_before_rebound_after_constructive_reentry",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 94,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware one-cycle storyline when early adversity was followed by a constructive re-entry but the trade still later ended in a stop-like weak-side exit before rebound.",
  }),
  definePatternMetadata({
    patternId: "deteriorating_reentry_after_trim",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Richer trim-and-reentry failure storyline when the re-entry was followed by stronger adverse followthrough before the next action.",
  }),
  definePatternMetadata({
    patternId: "repeated_trim_readd_with_constructive_reentry_followthrough",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 92,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Repeated-cycle trim-and-reentry storyline when multiple re-entries were followed by stronger favorable continuation before the next actions.",
  }),
  definePatternMetadata({
    patternId: "repeated_trim_readd_with_deteriorating_reentry",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 92,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Repeated-cycle trim-and-reentry failure storyline when multiple re-entries were followed by stronger adverse continuation before the next actions.",
  }),
  definePatternMetadata({
    patternId: "repeated_constructive_reentry_with_premature_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 93,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Repeated-cycle storyline when constructive re-entry quality still ended with a final exit that left meaningful continuation afterward.",
  }),
  definePatternMetadata({
    patternId: "repeated_balanced_management_with_premature_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 92,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Broad repeated-cycle whole-trade storyline when repeated trim-and-readd management still ended with a final exit that left meaningful continuation afterward.",
  }),
  definePatternMetadata({
    patternId: "repeated_balanced_management_with_constructive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 92,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Broad repeated-cycle whole-trade storyline when repeated trim-and-readd management still ended with a disciplined constructive final exit.",
  }),
  definePatternMetadata({
    patternId:
      "repeated_balanced_management_with_take_profit_into_resistance_and_constructive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 93,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Broad repeated-cycle support-aware whole-trade storyline when repeated balanced management included nearby-resistance profit taking and still ended with a disciplined constructive final exit.",
  }),
  definePatternMetadata({
    patternId: "repeated_balanced_management_with_missed_final_continuation",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 92,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Broad repeated-cycle whole-trade storyline when repeated trim-and-readd management still left meaningful continuation after the final exit.",
  }),
  definePatternMetadata({
    patternId:
      "repeated_balanced_management_with_trim_into_resistance_and_constructive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 93,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Repeated-cycle support-aware storyline when repeated trim-and-readd management kept trimming into nearby resistance and still ended with a disciplined constructive final exit.",
  }),
  definePatternMetadata({
    patternId:
      "repeated_balanced_management_with_trim_into_resistance_and_premature_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 93,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Repeated-cycle support-aware storyline when repeated trim-and-readd management kept trimming into nearby resistance but the final exit still came before breakout continuation persisted.",
  }),
  definePatternMetadata({
    patternId:
      "repeated_balanced_management_with_take_profit_into_resistance_and_premature_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 93,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Broad repeated-cycle support-aware whole-trade storyline when repeated balanced management included nearby-resistance profit taking but the final exit still came before breakout continuation persisted.",
  }),
  definePatternMetadata({
    patternId:
      "repeated_balanced_management_with_exit_into_stacked_support_and_relief",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 93,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Broad repeated-cycle storyline when repeated trim-and-readd management still later exited into denser stacked support and price relieved higher after the exit.",
  }),
  definePatternMetadata({
    patternId:
      "repeated_balanced_management_with_exit_into_thin_support_before_breakdown",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 93,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Broad repeated-cycle storyline when repeated trim-and-readd management still later exited into thinner support that failed afterward.",
  }),
  definePatternMetadata({
    patternId: "repeated_balanced_management_with_fearful_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 92,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Broad repeated-cycle storyline when repeated balanced management still later ended in a fearful final exit before the trade recovered after exit.",
  }),
  definePatternMetadata({
    patternId:
      "repeated_balanced_management_with_stop_like_forced_exit_after_breakdown",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 92,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Broad repeated-cycle whole-trade storyline when repeated trim-and-readd management still later ended in a stop-like forced exit and the trade kept breaking down afterward.",
  }),
  definePatternMetadata({
    patternId:
      "repeated_balanced_management_with_stop_like_forced_exit_before_rebound",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 92,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Broad repeated-cycle whole-trade storyline when repeated trim-and-readd management still later ended in a stop-like forced exit before rebound.",
  }),
  definePatternMetadata({
    patternId: "repeated_constructive_reentry_with_constructive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 93,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Repeated-cycle constructive storyline when repeated re-entry quality still ended with a disciplined constructive final exit that avoided more damage.",
  }),
  definePatternMetadata({
    patternId:
      "repeated_constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 93,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Repeated-cycle constructive storyline when repeated constructive re-entries still later ended in a stop-like forced exit and the trade kept breaking down afterward.",
  }),
  definePatternMetadata({
    patternId:
      "repeated_constructive_reentry_with_stop_like_forced_exit_before_rebound",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 93,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Repeated-cycle constructive storyline when repeated constructive re-entries still later ended in a stop-like forced exit before rebound.",
  }),
  definePatternMetadata({
    patternId: "repeated_deteriorating_reentry_with_defensive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 93,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Repeated-cycle failure storyline when deteriorating re-entries eventually ended in a true defensive final exit after further damage was avoided.",
  }),
  definePatternMetadata({
    patternId:
      "repeated_rescue_attempts_with_premature_final_exit_after_constructive_reentries",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 13,
    defaultPriority: 94,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware repeated rescue storyline when constructive repeated re-entries still ended with a premature final exit before continuation persisted.",
  }),
  definePatternMetadata({
    patternId:
      "repeated_rescue_attempts_with_balanced_management_and_premature_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 93,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware broad repeated-cycle storyline when repeated rescue attempts and balanced management still ended with a premature final exit before continuation persisted.",
  }),
  definePatternMetadata({
    patternId:
      "repeated_rescue_attempts_with_balanced_management_and_constructive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 93,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware broad repeated-cycle storyline when repeated rescue attempts and balanced management still ended with a disciplined constructive final exit.",
  }),
  definePatternMetadata({
    patternId:
      "repeated_rescue_attempts_with_balanced_management_and_take_profit_into_resistance_and_constructive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 13,
    defaultPriority: 94,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware broad repeated-cycle support-aware storyline when repeated rescue attempts and balanced management included nearby-resistance profit taking and still ended with a disciplined constructive final exit.",
  }),
  definePatternMetadata({
    patternId:
      "repeated_rescue_attempts_with_balanced_management_and_missed_final_continuation",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 93,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware broad repeated-cycle storyline when repeated rescue attempts and balanced management still left meaningful continuation after the final exit.",
  }),
  definePatternMetadata({
    patternId:
      "repeated_rescue_attempts_with_balanced_management_and_trim_into_resistance_and_constructive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 13,
    defaultPriority: 94,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware repeated-cycle support-aware storyline when repeated rescue attempts and balanced management kept trimming into nearby resistance and still ended with a disciplined constructive final exit.",
  }),
  definePatternMetadata({
    patternId:
      "repeated_rescue_attempts_with_balanced_management_and_trim_into_resistance_and_premature_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 13,
    defaultPriority: 94,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware repeated-cycle support-aware storyline when repeated rescue attempts and balanced management kept trimming into nearby resistance but the final exit still came before breakout continuation persisted.",
  }),
  definePatternMetadata({
    patternId:
      "repeated_rescue_attempts_with_balanced_management_and_take_profit_into_resistance_and_premature_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 13,
    defaultPriority: 94,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware broad repeated-cycle support-aware storyline when repeated rescue attempts and balanced management included nearby-resistance profit taking but the final exit still came before breakout continuation persisted.",
  }),
  definePatternMetadata({
    patternId:
      "repeated_rescue_attempts_with_balanced_management_and_exit_into_stacked_support_and_relief",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 13,
    defaultPriority: 94,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware repeated-cycle storyline when repeated rescue attempts and balanced management still later exited into denser stacked support and price relieved higher after the exit.",
  }),
  definePatternMetadata({
    patternId:
      "repeated_rescue_attempts_with_balanced_management_and_exit_into_thin_support_before_breakdown",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 13,
    defaultPriority: 94,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware repeated-cycle storyline when repeated rescue attempts and balanced management still later exited into thinner support that failed afterward.",
  }),
  definePatternMetadata({
    patternId:
      "repeated_rescue_attempts_with_balanced_management_and_fearful_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 93,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware broad repeated-cycle storyline when repeated rescue attempts and balanced management still later ended in a fearful final exit before rebound.",
  }),
  definePatternMetadata({
    patternId:
      "repeated_balanced_management_with_defensive_final_exit_after_deterioration",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 93,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Broad repeated-cycle storyline when active repeated trim-and-readd management still later ended in a defensive final exit after meaningful deterioration.",
  }),
  definePatternMetadata({
    patternId:
      "repeated_rescue_attempts_with_balanced_management_and_defensive_final_exit_after_deterioration",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 93,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware broad repeated-cycle storyline when repeated rescue attempts and balanced management still later ended in a defensive final exit after deterioration.",
  }),
  definePatternMetadata({
    patternId:
      "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_after_breakdown",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 93,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware broad repeated-cycle storyline when repeated rescue attempts and balanced management still later ended in a stop-like forced exit after further breakdown.",
  }),
  definePatternMetadata({
    patternId:
      "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 93,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware broad repeated-cycle storyline when repeated rescue attempts and balanced management still later ended in a stop-like forced exit before rebound.",
  }),
  definePatternMetadata({
    patternId:
      "repeated_rescue_attempts_with_constructive_final_exit_after_constructive_reentries",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 13,
    defaultPriority: 94,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware repeated constructive storyline when repeated rescue attempts and constructive re-entries still ended with a disciplined constructive final exit.",
  }),
  definePatternMetadata({
    patternId:
      "repeated_rescue_attempts_with_stop_like_forced_exit_after_constructive_reentries",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 13,
    defaultPriority: 94,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware repeated constructive storyline when repeated rescue attempts and constructive re-entries still later ended in a stop-like forced exit after further breakdown.",
  }),
  definePatternMetadata({
    patternId:
      "repeated_rescue_attempts_with_stop_like_forced_exit_before_rebound_after_constructive_reentries",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 13,
    defaultPriority: 94,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware repeated constructive storyline when repeated rescue attempts and constructive re-entries still later ended in a stop-like forced exit before rebound.",
  }),
  definePatternMetadata({
    patternId:
      "repeated_rescue_attempts_with_defensive_final_exit_after_deteriorating_reentries",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 13,
    defaultPriority: 94,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware repeated rescue storyline when deteriorating repeated re-entries eventually ended with a true defensive final exit.",
  }),
  definePatternMetadata({
    patternId: "repeated_trim_readd_with_constructive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 92,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Repeated-cycle storyline when multiple trim/re-add cycles still ended with a constructive final exit that avoided more damage.",
  }),
  definePatternMetadata({
    patternId: "repeated_trim_readd_with_fearful_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 92,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Repeated-cycle storyline when multiple trim/re-add cycles still ended with a weak fearful-style final exit before recovery persisted.",
  }),
  definePatternMetadata({
    patternId: "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 92,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Repeated-cycle storyline when multiple trim/re-add cycles still ended with a true defensive final exit after the trade deteriorated materially.",
  }),
  definePatternMetadata({
    patternId: "repeated_rescue_attempts_with_defensive_final_exit_after_deterioration",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 93,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Richer rescue-and-deterioration storyline when an early recovery was followed by repeated rescue attempts and finally a defensive save after the trade broke down.",
  }),
  definePatternMetadata({
    patternId: "repeated_trim_readd_with_premature_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Repeated-cycle storyline when multiple trim/re-add cycles still ended with a premature final exit before continuation persisted.",
  }),
  definePatternMetadata({
    patternId: "repeated_trim_readd_with_missed_final_continuation",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Repeated-cycle storyline when multiple trim/re-add cycles still left meaningful continuation after the final exit.",
  }),
  definePatternMetadata({
    patternId: "aggressive_adding_with_failed_profit_protection",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 8,
    defaultPriority: 87,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "High-value composite management failure pattern.",
  }),
  definePatternMetadata({
    patternId: "add_into_resistance_structure",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 88,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "First explicit support-aware scaling pattern when later adds occurred into nearby resistance or directly above it.",
  }),
  definePatternMetadata({
    patternId: "add_above_resistance_structure",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 89,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Support/resistance-aware scaling pattern when later adds cleared nearby resistance and still retained room above.",
  }),
  definePatternMetadata({
    patternId: "add_above_resistance_with_constructive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Support/resistance-aware scaling storyline when later adds cleared resistance with room above and the trade still finished constructively.",
  }),
  definePatternMetadata({
    patternId: "add_above_resistance_with_failed_profit_protection",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 11,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Support/resistance-aware scaling storyline when later adds cleared resistance with room above but profit protection still failed later.",
  }),
  definePatternMetadata({
    patternId: "recovery_with_add_above_resistance_and_constructive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 92,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware support/resistance scaling storyline when early adversity was repaired, later adds still cleared resistance with room above, and the trade finished constructively.",
  }),
  definePatternMetadata({
    patternId: "recovery_with_add_above_resistance_and_failed_profit_protection",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 92,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Recovery-aware support/resistance scaling storyline when early adversity was repaired, later adds still cleared resistance with room above, and profit protection still failed later.",
  }),
  definePatternMetadata({
    patternId: "repeated_adds_above_resistance_with_constructive_final_exit",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Support/resistance-aware scaling storyline when multiple later adds cleared resistance with room above and the trade still finished constructively.",
  }),
  definePatternMetadata({
    patternId: "repeated_adds_above_resistance_with_failed_profit_protection",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 12,
    defaultPriority: 91,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Support/resistance-aware scaling storyline when multiple later adds cleared resistance with room above but profit protection still failed later.",
  }),
  definePatternMetadata({
    patternId: "revenge_adding_with_failed_profit_protection",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 10,
    defaultPriority: 89,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Named revenge-add proxy when repeated below-basis adds into weakness were followed by major giveback and failed protection.",
  }),
  definePatternMetadata({
    patternId: "readd_after_delayed_risk_response",
    family: PATTERN_FAMILIES.SCALING_QUALITY,
    patternType: "composite",
    specificityRank: 9,
    defaultPriority: 88,
    canBePrimary: true,
    defaultRole: "primary_candidate",
    notes: "Sequence-level management failure pattern combining delayed reduction and later re-add behavior.",
  }),
];

export interface PatternMetadataValidationIssue {
  patternId: string;
  message: string;
}

export function validatePatternMetadataRegistry(): PatternMetadataValidationIssue[] {
  const issues: PatternMetadataValidationIssue[] = [];
  const registeredPatternIds = PATTERN_DEFINITIONS.map((pattern) => pattern.id);
  const registeredPatternIdSet = new Set(registeredPatternIds);
  const seenMetadataIds = new Set<string>();
  const supportedFamilies = new Set<string>(
    Object.values(PATTERN_FAMILIES) as string[],
  );
  const supportedLanes = new Set<string>(PATTERN_LANES);
  const supportedJourneyScopes = new Set<string>(PATTERN_JOURNEY_SCOPES);
  const supportedOutcomeFlavors = new Set<string>(PATTERN_OUTCOME_FLAVORS);

  for (const metadata of PATTERN_METADATA) {
    if (seenMetadataIds.has(metadata.patternId)) {
      issues.push({
        patternId: metadata.patternId,
        message: "Duplicate metadata entry.",
      });
      continue;
    }

    seenMetadataIds.add(metadata.patternId);

    if (!registeredPatternIdSet.has(metadata.patternId)) {
      issues.push({
        patternId: metadata.patternId,
        message: "Metadata references an unknown pattern id.",
      });
    }

    if (!supportedFamilies.has(metadata.family)) {
      issues.push({
        patternId: metadata.patternId,
        message: `Unsupported family: ${metadata.family}`,
      });
    }

    if (!supportedLanes.has(metadata.lane)) {
      issues.push({
        patternId: metadata.patternId,
        message: `Unsupported lane: ${metadata.lane}`,
      });
    }

    if (!supportedJourneyScopes.has(metadata.journeyScope)) {
      issues.push({
        patternId: metadata.patternId,
        message: `Unsupported journey scope: ${metadata.journeyScope}`,
      });
    }

    if (!supportedOutcomeFlavors.has(metadata.outcomeFlavor)) {
      issues.push({
        patternId: metadata.patternId,
        message: `Unsupported outcome flavor: ${metadata.outcomeFlavor}`,
      });
    }

    if (!metadata.subFamily) {
      issues.push({
        patternId: metadata.patternId,
        message: "Missing subFamily metadata.",
      });
    }

    for (const broaderPatternId of metadata.broaderPatternIds) {
      if (!registeredPatternIdSet.has(broaderPatternId)) {
        issues.push({
          patternId: metadata.patternId,
          message: `Unknown broaderPatternId reference: ${broaderPatternId}`,
        });
      }
    }

    if (!registeredPatternIdSet.has(metadata.lineageRoot)) {
      issues.push({
        patternId: metadata.patternId,
        message: `Unknown lineageRoot reference: ${metadata.lineageRoot}`,
      });
    }
  }

  for (const pattern of PATTERN_DEFINITIONS) {
    if (!seenMetadataIds.has(pattern.id)) {
      issues.push({
        patternId: pattern.id,
        message: "Pattern is missing metadata.",
      });
    }
  }

  return issues;
}

export const PATTERN_METADATA: PatternMetadata[] = (() => {
  const knownPatternIds = new Set(
    RAW_PATTERN_METADATA.map((metadata) => metadata.patternId),
  );

  return RAW_PATTERN_METADATA.map((metadata) => ({
    ...metadata,
    broaderPatternIds: metadata.broaderPatternIds.filter((patternId) =>
      knownPatternIds.has(patternId),
    ),
    lineageRoot: knownPatternIds.has(metadata.lineageRoot)
      ? metadata.lineageRoot
      : metadata.patternId,
  }));
})();

export const PATTERN_METADATA_BY_ID: Record<string, PatternMetadata> =
  Object.fromEntries(
    PATTERN_METADATA.map((metadata) => [metadata.patternId, metadata]),
  );

export function getPatternMetadata(
  patternId: string,
): PatternMetadata | undefined {
  return PATTERN_METADATA_BY_ID[patternId];
}

const PATTERN_METADATA_VALIDATION_ISSUES = validatePatternMetadataRegistry();

if (PATTERN_METADATA_VALIDATION_ISSUES.length > 0) {
  throw new Error(
    [
      "Pattern metadata registry validation failed.",
      ...PATTERN_METADATA_VALIDATION_ISSUES.map(
        (issue) => `- ${issue.patternId}: ${issue.message}`,
      ),
    ].join("\n"),
  );
}
