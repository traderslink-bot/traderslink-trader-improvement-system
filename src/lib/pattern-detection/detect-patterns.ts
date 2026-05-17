// =========================
// 2026-04-12 03:42 PM America/Toronto
// PATTERN DETECTION ENGINE

// file name detect-patterns.ts
// =========================
//
// PURPOSE:
// Runs all registered pattern definitions against PatternInput and returns
// only matched patterns.
//
// CURRENT DESIGN:
// - atomic and composite patterns are both returned
// - engine does not yet suppress overlaps
// - engine does not yet prioritize composites
//
// FUTURE EXPANSION MAY INCLUDE:
// - optional suppression of lower-level atomic patterns
// - sorting by patternType
// - family-aware output shaping
//
// RULES:
// - ONLY uses PatternInput
// - NO scoring
// - NO coaching
// - NO interpretation
//

import type { PatternInput } from "../pattern-input/types/pattern-input";
import type {
  DetectedPattern,
  PatternDetectionResult,
} from "./types/pattern-detection-types";
import { PATTERN_DEFINITIONS } from "./registry/pattern-definitions";

export function detectPatterns(
  input: PatternInput,
): PatternDetectionResult {
  const detectedPatterns: DetectedPattern[] = [];

  for (const pattern of PATTERN_DEFINITIONS) {
    const result = pattern.evaluate(input);

    if (!result.matched) {
      continue;
    }

    detectedPatterns.push({
      patternId: pattern.id,
      patternName: pattern.name,
      family: pattern.family,
      patternType: pattern.patternType,
      structuralLevel: pattern.structuralLevel,
      evidence: result.evidence,
      thresholdsUsed: result.thresholdsUsed,
    });
  }

  return {
    detectedPatterns,
  };
}
