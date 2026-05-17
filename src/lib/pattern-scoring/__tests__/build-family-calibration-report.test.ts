import { describe, expect, it } from "vitest";
import type {
  DetectedPattern,
  StructuralLevel,
} from "../../pattern-detection/types/pattern-detection-types";
import { PATTERN_FAMILIES } from "../../pattern-detection/types/pattern-detection-types";
import type {
  NormalizedDetectedPattern,
  NormalizedPatternResult,
} from "../../pattern-normalization/types/normalized-pattern-result";
import type { PatternMetadata } from "../../pattern-normalization/pattern-metadata";
import { buildPatternScoringInput } from "../builders/build-pattern-scoring-input";
import { buildPatternScoringResult } from "../builders/build-pattern-scoring-result";
import { buildFamilyCalibrationReport } from "../builders/build-family-calibration-report";

function createMetadata(
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

function createPattern(
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
    metadata: createMetadata(patternId, family),
    normalizedRole,
    suppressionReasons: [],
  };
}

function createNormalizedResult(
  patterns: NormalizedDetectedPattern[],
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
    Array.from(new Set(patterns.map((pattern) => pattern.family))).map(
      (family) => [
        family,
        patterns.filter((pattern) => pattern.family === family),
      ],
    ),
  );

  const primaryPatternsByFamily = Object.fromEntries(
    primaryPatterns.map((pattern) => [pattern.family, pattern]),
  );

  return {
    primaryPatterns,
    supportingPatterns,
    contextualPatterns,
    prioritizedPatterns: patterns,
    patternsByFamily,
    primaryPatternsByFamily,
    topOverallAnchorPattern: primaryPatterns[0] ?? patterns[0] ?? null,
  };
}

describe("buildFamilyCalibrationReport", () => {
  it("surfaces family-shape diagnostics for storyline-heavy, fallback-heavy, light-context, and calibrated families", () => {
    const normalizedResult = createNormalizedResult([
      createPattern(
        "constructive_reentry_with_constructive_final_exit",
        PATTERN_FAMILIES.SCALING_QUALITY,
        "primary_candidate",
        "storyline_composite",
      ),
      createPattern(
        "repeated_balanced_management_with_premature_final_exit",
        PATTERN_FAMILIES.SCALING_QUALITY,
        "supporting_candidate",
        "storyline_composite",
      ),
      createPattern(
        "structured_position_building",
        PATTERN_FAMILIES.SCALING_QUALITY,
        "context_only",
        "structural_composite",
      ),
      createPattern(
        "aggressive_scale_in",
        PATTERN_FAMILIES.POSITION_STRUCTURE,
        "primary_candidate",
        "structural_composite",
      ),
      createPattern(
        "scale_in_then_reduce",
        PATTERN_FAMILIES.POSITION_STRUCTURE,
        "supporting_candidate",
        "structural_composite",
      ),
      createPattern(
        "one_and_done_round_trip",
        PATTERN_FAMILIES.POSITION_STRUCTURE,
        "context_only",
        "structural_composite",
      ),
      createPattern(
        "entry_after_recent_drop",
        PATTERN_FAMILIES.ENTRY_CONTEXT,
        "context_only",
        "atomic",
      ),
      createPattern(
        "entry_after_recent_run_up",
        PATTERN_FAMILIES.ENTRY_CONTEXT,
        "context_only",
        "atomic",
      ),
      createPattern(
        "fearful_exit_after_weakening",
        PATTERN_FAMILIES.EXIT_QUALITY,
        "primary_candidate",
        "structural_composite",
      ),
      createPattern(
        "disciplined_defensive_exit",
        PATTERN_FAMILIES.EXIT_QUALITY,
        "supporting_candidate",
        "structural_composite",
      ),
    ]);

    const scoringInput = buildPatternScoringInput(normalizedResult);
    const scoringResult = buildPatternScoringResult(scoringInput);
    const report = buildFamilyCalibrationReport(
      scoringInput,
      scoringResult.contributions,
    );

    const scalingFamily = report.families.find(
      (family) => family.family === PATTERN_FAMILIES.SCALING_QUALITY,
    );
    const positionStructureFamily = report.families.find(
      (family) => family.family === PATTERN_FAMILIES.POSITION_STRUCTURE,
    );
    const entryContextFamily = report.families.find(
      (family) => family.family === PATTERN_FAMILIES.ENTRY_CONTEXT,
    );
    const exitQualityFamily = report.families.find(
      (family) => family.family === PATTERN_FAMILIES.EXIT_QUALITY,
    );

    expect(report.totalFamilies).toBe(4);
    expect(report.totalPatterns).toBe(10);
    expect(report.totalAbsoluteContribution).toBeGreaterThan(0);
    expect(report.traceSummary.rawTotalPressure).not.toBe(
      report.traceSummary.adjustedTotalPressure,
    );
    expect(
      Math.abs(report.traceSummary.effectiveDirectionalTotal),
    ).toBeLessThanOrEqual(report.traceSummary.adjustedTotalPressure);
    expect(report.confidenceIndicators.reliability).toBeDefined();

    expect(scalingFamily).toMatchObject({
      totalPatternCount: 3,
      explicitPolarityCount: 3,
      fallbackPolarityCount: 0,
      familyShape: "storyline_heavy",
    });
    expect(scalingFamily?.summedAbsoluteRawMagnitude).toBeGreaterThan(
      scalingFamily?.summedAbsoluteAdjustedMagnitude ?? Number.POSITIVE_INFINITY,
    );
    expect(scalingFamily?.directionalPatternCount).toBe(3);
    expect(scalingFamily?.richnessContainedContributionCount).toBe(2);
    expect(scalingFamily?.notes).toContain("richness_contained");
    expect(scalingFamily?.structuralLevelCounts.storyline_composite).toBe(2);
    expect(scalingFamily?.notes).toContain("storyline_heavy");
    expect(scalingFamily?.topContributingPattern?.patternId).toBe(
      "constructive_reentry_with_constructive_final_exit",
    );

    expect(positionStructureFamily).toMatchObject({
      totalPatternCount: 3,
      explicitPolarityCount: 3,
      fallbackPolarityCount: 0,
      familyShape: "structural",
    });
    expect(positionStructureFamily?.directionalPatternCount).toBe(0);
    expect(positionStructureFamily?.nonDirectionalPatternCount).toBe(3);
    expect(positionStructureFamily?.richnessContainedContributionCount).toBe(0);
    expect(positionStructureFamily?.notes).toContain("explicit_non_directional");
    expect(positionStructureFamily?.polaritySourceBreakdown.explicit_map).toBe(3);

    expect(entryContextFamily).toMatchObject({
      totalPatternCount: 2,
      explicitPolarityCount: 2,
      fallbackPolarityCount: 0,
      familyShape: "light_context",
    });
    expect(entryContextFamily?.contextContainedContributionCount).toBe(2);
    expect(entryContextFamily?.notes).toContain("context_stack_guarded");
    expect(entryContextFamily?.notes).toContain("adjustment_heavy");
    expect(entryContextFamily?.notes).toContain("light_context_like");
    expect(entryContextFamily?.averageAbsoluteContribution).toBeLessThan(
      scalingFamily?.averageAbsoluteContribution ?? Number.POSITIVE_INFINITY,
    );

    expect(exitQualityFamily?.topContributingPattern?.patternId).toBe(
      "fearful_exit_after_weakening",
    );
    expect(exitQualityFamily?.summedAbsoluteContribution).toBeGreaterThan(0);
    expect(exitQualityFamily?.effectiveDirectionalImpact).toBeLessThan(0);
    expect(report.suppressionSummary.richnessContainedFamilies).toContain(
      PATTERN_FAMILIES.SCALING_QUALITY,
    );
  });

  it("keeps storyline-heavy families inspectable without automatically overpowering simpler families when contributions are mixed", () => {
    const normalizedResult = createNormalizedResult([
      createPattern(
        "constructive_reentry_with_constructive_final_exit",
        PATTERN_FAMILIES.SCALING_QUALITY,
        "primary_candidate",
        "storyline_composite",
      ),
      createPattern(
        "repeated_balanced_management_with_premature_final_exit",
        PATTERN_FAMILIES.SCALING_QUALITY,
        "supporting_candidate",
        "storyline_composite",
      ),
      createPattern(
        "structured_position_building",
        PATTERN_FAMILIES.SCALING_QUALITY,
        "context_only",
        "structural_composite",
      ),
      createPattern(
        "fearful_exit_after_weakening",
        PATTERN_FAMILIES.EXIT_QUALITY,
        "primary_candidate",
        "structural_composite",
      ),
      createPattern(
        "entry_after_recent_drop",
        PATTERN_FAMILIES.ENTRY_CONTEXT,
        "context_only",
        "atomic",
      ),
    ]);

    const scoringInput = buildPatternScoringInput(normalizedResult);
    const scoringResult = buildPatternScoringResult(scoringInput);
    const report = buildFamilyCalibrationReport(
      scoringInput,
      scoringResult.contributions,
    );

    const scalingFamily = report.families.find(
      (family) => family.family === PATTERN_FAMILIES.SCALING_QUALITY,
    );
    const exitFamily = report.families.find(
      (family) => family.family === PATTERN_FAMILIES.EXIT_QUALITY,
    );
    const entryContextFamily = report.families.find(
      (family) => family.family === PATTERN_FAMILIES.ENTRY_CONTEXT,
    );

    expect(scalingFamily?.notes).toContain("storyline_heavy");
    expect(scalingFamily?.topContributingPattern).not.toBeNull();
    expect(
      scalingFamily?.summedAbsoluteContribution ?? 0,
    ).toBeLessThan(report.totalAbsoluteContribution);
    expect(
      scalingFamily?.absoluteContributionShare ?? 0,
    ).toBeLessThan(1);
    expect(
      scalingFamily?.topContributorShareOfFamily ?? 0,
    ).toBeLessThan(0.75);

    expect(
      exitFamily?.averageAbsoluteContribution ?? 0,
    ).toBeGreaterThan(entryContextFamily?.averageAbsoluteContribution ?? 0);
    expect(
      scalingFamily?.topContributingPattern?.absoluteContribution ?? 0,
    ).toBeLessThan(3.5);
    expect(entryContextFamily?.notes).toContain("light_context_like");
  });

  it("upgrades the report with dominance and suppression summaries under mixed pressure", () => {
    const normalizedResult = createNormalizedResult([
      createPattern(
        "constructive_reentry_with_constructive_final_exit",
        PATTERN_FAMILIES.SCALING_QUALITY,
        "primary_candidate",
        "storyline_composite",
      ),
      createPattern(
        "repeated_balanced_management_with_constructive_final_exit",
        PATTERN_FAMILIES.SCALING_QUALITY,
        "supporting_candidate",
        "storyline_composite",
      ),
      createPattern(
        "fearful_exit_after_weakening",
        PATTERN_FAMILIES.EXIT_QUALITY,
        "primary_candidate",
        "structural_composite",
      ),
      createPattern(
        "entry_after_recent_drop",
        PATTERN_FAMILIES.ENTRY_CONTEXT,
        "context_only",
        "atomic",
      ),
    ]);

    const scoringInput = buildPatternScoringInput(normalizedResult);
    const scoringResult = buildPatternScoringResult(scoringInput);
    const report = buildFamilyCalibrationReport(scoringInput, scoringResult);

    expect(report.dominanceSummary.flags.length).toBeGreaterThan(0);
    expect(report.traceSummary.dominantFamily).toBe(
      scoringResult.trace.summary.dominantFamily,
    );
    expect(report.suppressionSummary.contextContainedFamilies).toContain(
      PATTERN_FAMILIES.ENTRY_CONTEXT,
    );
    expect(report.suppressionSummary.richnessContainedFamilies).toContain(
      PATTERN_FAMILIES.SCALING_QUALITY,
    );
    expect(report.dominantFamilies.length).toBeGreaterThan(0);
  });

  it("makes raw-vs-adjusted family pressure visible under multi-family stress", () => {
    const normalizedResult = createNormalizedResult([
      createPattern(
        "constructive_reentry_with_constructive_final_exit",
        PATTERN_FAMILIES.SCALING_QUALITY,
        "primary_candidate",
        "storyline_composite",
      ),
      createPattern(
        "repeated_balanced_management_with_premature_final_exit",
        PATTERN_FAMILIES.SCALING_QUALITY,
        "supporting_candidate",
        "storyline_composite",
      ),
      createPattern(
        "fearful_exit_after_weakening",
        PATTERN_FAMILIES.EXIT_QUALITY,
        "primary_candidate",
        "structural_composite",
      ),
      createPattern(
        "entry_after_recent_drop",
        PATTERN_FAMILIES.ENTRY_CONTEXT,
        "context_only",
        "atomic",
      ),
      createPattern(
        "high_mfe_trade",
        PATTERN_FAMILIES.TRADE_EXCURSION,
        "context_only",
        "atomic",
      ),
      createPattern(
        "aggressive_scale_in",
        PATTERN_FAMILIES.POSITION_STRUCTURE,
        "supporting_candidate",
        "structural_composite",
      ),
    ]);

    const scoringInput = buildPatternScoringInput(normalizedResult);
    const scoringResult = buildPatternScoringResult(scoringInput);
    const report = buildFamilyCalibrationReport(
      scoringInput,
      scoringResult.contributions,
    );

    const scalingFamily = report.families.find(
      (family) => family.family === PATTERN_FAMILIES.SCALING_QUALITY,
    );
    const entryContextFamily = report.families.find(
      (family) => family.family === PATTERN_FAMILIES.ENTRY_CONTEXT,
    );
    const positionStructureFamily = report.families.find(
      (family) => family.family === PATTERN_FAMILIES.POSITION_STRUCTURE,
    );

    expect(scalingFamily?.familyAdjustedContributionCount).toBe(0);
    expect(scalingFamily?.richnessContainedContributionCount).toBe(2);
    expect(scalingFamily?.magnitudeAdjustmentDelta).toBeGreaterThan(0);
    expect(scalingFamily?.magnitudeAdjustmentRatio).toBeLessThan(1);

    expect(entryContextFamily?.contextContainedContributionCount).toBe(1);
    expect(entryContextFamily?.summedAbsoluteRawMagnitude).toBeGreaterThan(
      entryContextFamily?.summedAbsoluteAdjustedMagnitude ?? Number.POSITIVE_INFINITY,
    );

    expect(positionStructureFamily?.summedAbsoluteAdjustedMagnitude).toBeGreaterThan(0);
    expect(positionStructureFamily?.summedAbsoluteContribution).toBe(0);
  });
});
