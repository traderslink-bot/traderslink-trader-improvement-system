import type {
  DetectedPattern,
  StructuralLevel,
} from "../pattern-detection/types/pattern-detection-types";
import type {
  NormalizedDetectedPattern,
  NormalizedPatternResult,
} from "../pattern-normalization/types/normalized-pattern-result";
import type { PatternMetadata } from "../pattern-normalization/pattern-metadata";

export function createPatternMetadata(
  patternId: string,
  family: string,
): PatternMetadata {
  return {
    patternId,
    family,
    patternType: "composite",
    lane: "management_context",
    subFamily: "test",
    journeyScope: "one_cycle",
    outcomeFlavor: "none",
    isRecoveryAware: false,
    isSupportResistanceAware: false,
    broaderPatternIds: [],
    lineageRoot: patternId,
    specificityRank: 10,
    defaultPriority: 90,
    canBePrimary: true,
    defaultRole: "primary_candidate",
  };
}

export function createNormalizedPattern(
  patternId: string,
  family: string,
  normalizedRole: NormalizedDetectedPattern["normalizedRole"],
  structuralLevel: StructuralLevel,
): NormalizedDetectedPattern {
  const detectedPattern: DetectedPattern = {
    patternId,
    patternName: patternId,
    family,
    patternType: structuralLevel === "atomic" ? "atomic" : "composite",
    structuralLevel,
    evidence: {},
    thresholdsUsed: {},
  };

  return {
    ...detectedPattern,
    metadata: createPatternMetadata(patternId, family),
    normalizedRole,
    suppressionReasons: [],
  };
}

export function createNormalizedPatternResult(
  patterns: NormalizedDetectedPattern[],
  topAnchorPatternId?: string,
): NormalizedPatternResult {
  const primaryPatterns = patterns.filter(
    (pattern) => pattern.normalizedRole === "primary_candidate",
  );
  const supportingPatterns = patterns.filter(
    (pattern) => pattern.normalizedRole === "supporting_candidate",
  );
  const contextualPatterns = patterns.filter(
    (pattern) => pattern.normalizedRole === "context_only",
  );

  const patternsByFamily = Object.fromEntries(
    Array.from(new Set(patterns.map((pattern) => pattern.family)))
      .sort((left, right) => left.localeCompare(right))
      .map((family) => [
        family,
        patterns.filter((pattern) => pattern.family === family),
      ]),
  );

  const primaryPatternsByFamily = Object.fromEntries(
    [...primaryPatterns]
      .sort((left, right) => left.family.localeCompare(right.family))
      .map((pattern) => [pattern.family, pattern]),
  );

  return {
    primaryPatterns,
    supportingPatterns,
    contextualPatterns,
    prioritizedPatterns: patterns,
    patternsByFamily,
    primaryPatternsByFamily,
    topOverallAnchorPattern:
      patterns.find((pattern) => pattern.patternId === topAnchorPatternId) ??
      primaryPatterns[0] ??
      patterns[0] ??
      null,
  };
}
