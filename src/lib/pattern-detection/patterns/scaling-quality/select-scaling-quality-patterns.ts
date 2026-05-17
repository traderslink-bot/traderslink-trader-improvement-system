import type { PatternDefinition } from "../../types/pattern-detection-types";
import { SCALING_QUALITY_PATTERNS as SCALING_QUALITY_PATTERN_BANK } from "./scaling-quality-pattern-bank";

export function selectScalingQualityPatterns(
  predicate: (pattern: PatternDefinition) => boolean,
): PatternDefinition[] {
  return SCALING_QUALITY_PATTERN_BANK.filter(predicate);
}

export function isSupportResistanceScalingPattern(patternId: string): boolean {
  return patternId.includes("support") || patternId.includes("resistance");
}

export function isRecoveryAwareScalingPattern(patternId: string): boolean {
  return (
    patternId.startsWith("recovery_with_") ||
    patternId.startsWith("recovery_to_") ||
    patternId.startsWith("recovery_after_") ||
    patternId.startsWith("constructive_recovery_") ||
    patternId.startsWith("repeated_rescue_attempts_with_")
  );
}

export function isRepeatedCycleScalingPattern(patternId: string): boolean {
  return patternId.startsWith("repeated_");
}

export function hasOutcomeOverlayScalingPattern(patternId: string): boolean {
  return (
    patternId.includes("constructive_exit") ||
    patternId.includes("constructive_final_exit") ||
    patternId.includes("premature_final_exit") ||
    patternId.includes("missed_final_continuation") ||
    patternId.includes("fearful_final_exit") ||
    patternId.includes("defensive_final_exit") ||
    patternId.includes("failed_profit_protection") ||
    patternId.includes("stop_like_forced_exit")
  );
}
