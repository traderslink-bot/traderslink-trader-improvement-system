import { describe, expect, it } from "vitest";
import { PATTERN_FAMILIES } from "../../pattern-detection/types/pattern-detection-types";
import type {
  DetectedPattern,
  PatternDetectionResult,
  PatternType,
  StructuralLevel,
} from "../../pattern-detection/types/pattern-detection-types";
import { normalizeDetectedPatterns } from "../normalize-detected-patterns";

function createDetectedPattern(args: {
  patternId: string;
  family: string;
  patternType?: PatternType;
  structuralLevel?: StructuralLevel;
}): DetectedPattern {
  return {
    patternId: args.patternId,
    patternName: args.patternId,
    family: args.family,
    patternType: args.patternType ?? "composite",
    structuralLevel: args.structuralLevel ?? "structural_composite",
    evidence: {},
    thresholdsUsed: {},
  };
}

function normalizePatternIds(patterns: DetectedPattern[]): ReturnType<
  typeof normalizeDetectedPatterns
> {
  const detectionResult: PatternDetectionResult = {
    detectedPatterns: patterns,
  };

  return normalizeDetectedPatterns(detectionResult);
}

describe("normalization invariants", () => {
  it("keeps a single primary per family even under overlap pressure", () => {
    const normalized = normalizePatternIds([
      createDetectedPattern({
        patternId: "advantaged_entry_structure",
        family: PATTERN_FAMILIES.ENTRY_QUALITY,
      }),
      createDetectedPattern({
        patternId: "breakout_entry_structure",
        family: PATTERN_FAMILIES.ENTRY_QUALITY,
      }),
      createDetectedPattern({
        patternId: "measured_favorable_extension_entry_structure",
        family: PATTERN_FAMILIES.ENTRY_QUALITY,
      }),
    ]);

    expect(Object.keys(normalized.primaryPatternsByFamily)).toEqual([
      PATTERN_FAMILIES.ENTRY_QUALITY,
    ]);
    expect(
      normalized.primaryPatterns.filter(
        (pattern) => pattern.family === PATTERN_FAMILIES.ENTRY_QUALITY,
      ),
    ).toHaveLength(1);
  });

  it("keeps richer entry variants above broader entry variants", () => {
    const normalized = normalizePatternIds([
      createDetectedPattern({
        patternId: "breakout_entry_structure",
        family: PATTERN_FAMILIES.ENTRY_QUALITY,
      }),
      createDetectedPattern({
        patternId: "measured_favorable_extension_entry_structure",
        family: PATTERN_FAMILIES.ENTRY_QUALITY,
      }),
    ]);

    const breakout = normalized.prioritizedPatterns.find(
      (pattern) => pattern.patternId === "breakout_entry_structure",
    );
    const measured = normalized.prioritizedPatterns.find(
      (pattern) =>
        pattern.patternId === "measured_favorable_extension_entry_structure",
    );

    expect(breakout?.normalizedRole).toBe("primary_candidate");
    expect(measured?.normalizedRole).toBe("supporting_candidate");
  });

  it("keeps recovery-aware variants above their one-cycle base storyline", () => {
    const normalized = normalizePatternIds([
      createDetectedPattern({
        patternId: "balanced_management_with_constructive_exit",
        family: PATTERN_FAMILIES.SCALING_QUALITY,
      }),
      createDetectedPattern({
        patternId: "recovery_with_balanced_management_and_constructive_final_exit",
        family: PATTERN_FAMILIES.SCALING_QUALITY,
      }),
    ]);

    expect(
      normalized.primaryPatternsByFamily[PATTERN_FAMILIES.SCALING_QUALITY]
        ?.patternId,
    ).toBe("recovery_with_balanced_management_and_constructive_final_exit");
  });

  it("keeps repeated-cycle variants above one-cycle variants where both are present", () => {
    const normalized = normalizePatternIds([
      createDetectedPattern({
        patternId: "balanced_management_with_constructive_exit",
        family: PATTERN_FAMILIES.SCALING_QUALITY,
      }),
      createDetectedPattern({
        patternId: "repeated_balanced_management_with_constructive_final_exit",
        family: PATTERN_FAMILIES.SCALING_QUALITY,
        structuralLevel: "storyline_composite",
      }),
    ]);

    expect(
      normalized.primaryPatternsByFamily[PATTERN_FAMILIES.SCALING_QUALITY]
        ?.patternId,
    ).toBe("repeated_balanced_management_with_constructive_final_exit");
  });

  it("keeps support-resistance-aware whole-trade variants above generic management summaries", () => {
    const normalized = normalizePatternIds([
      createDetectedPattern({
        patternId: "balanced_management_with_constructive_exit",
        family: PATTERN_FAMILIES.SCALING_QUALITY,
      }),
      createDetectedPattern({
        patternId:
          "balanced_management_with_take_profit_into_resistance_and_constructive_final_exit",
        family: PATTERN_FAMILIES.SCALING_QUALITY,
        structuralLevel: "storyline_composite",
      }),
    ]);

    expect(
      normalized.primaryPatternsByFamily[PATTERN_FAMILIES.SCALING_QUALITY]
        ?.patternId,
    ).toBe(
      "balanced_management_with_take_profit_into_resistance_and_constructive_final_exit",
    );
  });
});
