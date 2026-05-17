import type { NormalizedPatternResult } from "../../pattern-normalization/types/normalized-pattern-result";
import type { PatternScoringInput } from "../types/pattern-scoring-input";

export function buildPatternScoringInput(
  normalizedPatternResult: NormalizedPatternResult,
): PatternScoringInput {
  return {
    normalizedPatternResult,
    topOverallAnchorPattern:
      normalizedPatternResult.topOverallAnchorPattern,
    primaryPatterns: normalizedPatternResult.primaryPatterns,
    prioritizedPatterns: normalizedPatternResult.prioritizedPatterns,
    primaryPatternsByFamily:
      normalizedPatternResult.primaryPatternsByFamily,
    supportingPatterns: normalizedPatternResult.supportingPatterns,
    contextualPatterns: normalizedPatternResult.contextualPatterns,
    patternsByFamily: normalizedPatternResult.patternsByFamily,
  };
}
