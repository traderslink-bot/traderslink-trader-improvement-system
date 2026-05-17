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

describe("pattern scoring stress scenarios", () => {
  it("keeps a strong calibrated exit family visible against scaling and context noise", () => {
    const normalizedResult = createNormalizedResult(
      [
        createPattern(
          "fearful_exit_after_weakening",
          PATTERN_FAMILIES.EXIT_QUALITY,
          "primary_candidate",
          "structural_composite",
        ),
        createPattern(
          "constructive_reentry_with_constructive_final_exit",
          PATTERN_FAMILIES.SCALING_QUALITY,
          "supporting_candidate",
          "storyline_composite",
        ),
        createPattern(
          "repeated_balanced_management_with_premature_final_exit",
          PATTERN_FAMILIES.SCALING_QUALITY,
          "supporting_candidate",
          "storyline_composite",
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
      ],
      "fearful_exit_after_weakening",
    );

    const scoringInput = buildPatternScoringInput(normalizedResult);
    const scoringResult = buildPatternScoringResult(scoringInput);
    const report = buildFamilyCalibrationReport(scoringInput, scoringResult);

    expect(report.suppressionSummary.richnessContainedFamilies).toContain(
      PATTERN_FAMILIES.SCALING_QUALITY,
    );
    expect(report.suppressionSummary.contextContainedFamilies).toContain(
      PATTERN_FAMILIES.ENTRY_CONTEXT,
    );
    expect(
      report.families.find(
        (family) => family.family === PATTERN_FAMILIES.EXIT_QUALITY,
      )?.effectiveDirectionalImpact,
    ).toBeLessThan(0);
  });

  it("keeps structural-only scenarios non-directional", () => {
    const normalizedResult = createNormalizedResult([
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
    ]);

    const scoringInput = buildPatternScoringInput(normalizedResult);
    const scoringResult = buildPatternScoringResult(scoringInput);
    const report = buildFamilyCalibrationReport(scoringInput, scoringResult);

    expect(scoringResult.netScore).toBe(0);
    expect(scoringResult.scoreBand).toBe("mixed");
    expect(report.families[0]?.nonDirectionalPatternCount).toBe(3);
  });

  it("guards multiple light-context families from taking over", () => {
    const normalizedResult = createNormalizedResult([
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
        "high_mfe_trade",
        PATTERN_FAMILIES.TRADE_EXCURSION,
        "context_only",
        "atomic",
      ),
      createPattern(
        "high_mae_trade",
        PATTERN_FAMILIES.TRADE_EXCURSION,
        "context_only",
        "atomic",
      ),
      createPattern(
        "quick_trade",
        PATTERN_FAMILIES.TRADE_DURATION,
        "context_only",
        "atomic",
      ),
      createPattern(
        "high_frequency_execution",
        PATTERN_FAMILIES.EXECUTION_FREQUENCY,
        "context_only",
        "atomic",
      ),
      createPattern(
        "disciplined_defensive_exit",
        PATTERN_FAMILIES.EXIT_QUALITY,
        "primary_candidate",
        "structural_composite",
      ),
    ]);

    const scoringInput = buildPatternScoringInput(normalizedResult);
    const scoringResult = buildPatternScoringResult(scoringInput);
    const report = buildFamilyCalibrationReport(scoringInput, scoringResult);

    expect(report.suppressionSummary.contextContainedFamilies.length).toBeGreaterThan(1);
    expect(report.dominanceSummary.dominantFamily).not.toBe(
      PATTERN_FAMILIES.ENTRY_CONTEXT,
    );
    expect(report.dominanceSummary.dominantFamily).not.toBe(
      PATTERN_FAMILIES.TRADE_EXCURSION,
    );
    expect(report.dominanceSummary.dominantFamily).not.toBe(
      PATTERN_FAMILIES.EXECUTION_FREQUENCY,
    );
  });

  it("is order independent when anchors are held stable", () => {
    const patterns = [
      createPattern(
        "constructive_reentry_with_constructive_final_exit",
        PATTERN_FAMILIES.SCALING_QUALITY,
        "primary_candidate",
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
        "aggressive_scale_in",
        PATTERN_FAMILIES.POSITION_STRUCTURE,
        "supporting_candidate",
        "structural_composite",
      ),
    ];

    const first = buildPatternScoringResult(
      buildPatternScoringInput(
        createNormalizedResult(
          patterns,
          "constructive_reentry_with_constructive_final_exit",
        ),
      ),
    );
    const second = buildPatternScoringResult(
      buildPatternScoringInput(
        createNormalizedResult(
          [...patterns].reverse(),
          "constructive_reentry_with_constructive_final_exit",
        ),
      ),
    );

    expect(first.overallScore).toBe(second.overallScore);
    expect(first.netScore).toBe(second.netScore);
    expect(first.trace.summary).toEqual(second.trace.summary);
    expect(
      first.trace.orderedContributions.map((contribution) => [
        contribution.patternId,
        contribution.contributionScore,
      ]),
    ).toEqual(
      second.trace.orderedContributions.map((contribution) => [
        contribution.patternId,
        contribution.contributionScore,
      ]),
    );
  });

  it("keeps conflict scenarios mixed while preserving dominant family visibility", () => {
    const normalizedResult = createNormalizedResult([
      createPattern(
        "constructive_reentry_with_constructive_final_exit",
        PATTERN_FAMILIES.SCALING_QUALITY,
        "primary_candidate",
        "storyline_composite",
      ),
      createPattern(
        "fearful_exit_after_weakening",
        PATTERN_FAMILIES.EXIT_QUALITY,
        "primary_candidate",
        "structural_composite",
      ),
      createPattern(
        "high_mae_trade",
        PATTERN_FAMILIES.TRADE_EXCURSION,
        "context_only",
        "atomic",
      ),
      createPattern(
        "high_mfe_trade",
        PATTERN_FAMILIES.TRADE_EXCURSION,
        "context_only",
        "atomic",
      ),
    ]);

    const scoringInput = buildPatternScoringInput(normalizedResult);
    const scoringResult = buildPatternScoringResult(scoringInput);
    const report = buildFamilyCalibrationReport(scoringInput, scoringResult);

    expect(scoringResult.scoreBand).toBe("mixed");
    expect(report.traceSummary.dominantFamily).toBe(
      scoringResult.trace.summary.dominantFamily,
    );
    expect(report.traceSummary.dominantFamily).toBe(
      PATTERN_FAMILIES.SCALING_QUALITY,
    );
  });
});
