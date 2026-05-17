import { describe, expect, it } from "vitest";
import type {
  DetectedPattern,
  StructuralLevel,
} from "../../pattern-detection/types/pattern-detection-types";
import type {
  NormalizedDetectedPattern,
  NormalizedPatternResult,
} from "../../pattern-normalization/types/normalized-pattern-result";
import type { PatternMetadata } from "../../pattern-normalization/pattern-metadata";
import { PATTERN_DEFINITIONS } from "../../pattern-detection/registry/pattern-definitions";
import { PATTERN_FAMILIES } from "../../pattern-detection/types/pattern-detection-types";
import { buildPatternScoringInput } from "../builders/build-pattern-scoring-input";
import {
  buildPatternScoringResult,
  DEFAULT_PATTERN_SCORING_BONUS_CONFIG,
} from "../builders/build-pattern-scoring-result";
import {
  FULLY_MAPPED_SCORING_FAMILIES,
  PATTERN_POLARITY_MAP,
  getPatternScoringPolarity,
} from "../pattern-polarity-map";

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
    patternType:
      structuralLevel === "atomic" ? "atomic" : "composite",
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

describe("buildPatternScoringResult", () => {
  it("fully maps the current high-risk scoring families explicitly", () => {
    const requiredPatternIds = PATTERN_DEFINITIONS
      .filter((pattern) =>
        FULLY_MAPPED_SCORING_FAMILIES.includes(
          pattern.family as (typeof FULLY_MAPPED_SCORING_FAMILIES)[number],
        ),
      )
      .map((pattern) => pattern.id);

    expect(requiredPatternIds.length).toBeGreaterThan(0);

    expect(requiredPatternIds.every((patternId) => patternId in PATTERN_POLARITY_MAP)).toBe(true);
  });

  it("scores normalized patterns without reaching outside the scoring contract", () => {
    const constructivePrimary = createPattern(
      "advantaged_entry_structure",
      "entry_quality",
      "primary_candidate",
      "structural_composite",
    );
    const negativePrimary = createPattern(
      "fearful_exit_after_weakening",
      "exit_quality",
      "primary_candidate",
      "structural_composite",
    );
    const supportiveStoryline = createPattern(
      "recovery_with_breakout_with_room_above_and_constructive_final_exit",
      "entry_quality",
      "supporting_candidate",
      "storyline_composite",
    );
    const contextualAtomic = createPattern(
      "high_mfe_trade",
      "trade_excursion",
      "context_only",
      "atomic",
    );

    const normalizedResult = createNormalizedResult([
      constructivePrimary,
      negativePrimary,
      supportiveStoryline,
      contextualAtomic,
    ]);

    const scoringInput = buildPatternScoringInput(normalizedResult);
    const scoringResult = buildPatternScoringResult(scoringInput);

    expect(scoringResult.summary.topOverallAnchorPattern?.patternId).toBe(
      "advantaged_entry_structure",
    );
    expect(scoringResult.summary.primaryPatternCount).toBe(2);
    expect(scoringResult.summary.supportingPatternCount).toBe(1);
    expect(scoringResult.summary.contextualPatternCount).toBe(1);
    expect(scoringResult.summary.familyAnchorCount).toBe(2);

    expect(scoringResult.contributions).toHaveLength(4);
    expect(scoringResult.contributions[0].structuralLevel).toBe(
      "structural_composite",
    );
    expect(scoringResult.contributions[2].structuralLevel).toBe(
      "storyline_composite",
    );
    expect(scoringResult.contributions[3].structuralLevel).toBe("atomic");

    expect(
      scoringResult.contributions.find(
        (contribution) =>
          contribution.patternId ===
          "fearful_exit_after_weakening",
      )?.polarity,
    ).toBe("negative");

    expect(
      scoringResult.contributions.find(
        (contribution) =>
          contribution.patternId ===
          "recovery_with_breakout_with_room_above_and_constructive_final_exit",
      )?.contributionScore,
    ).toBeGreaterThan(0);

    expect(scoringResult.positiveScore).toBeGreaterThan(0);
    expect(scoringResult.negativeScore).toBeGreaterThan(0);
    expect(scoringResult.overallScore).toBeGreaterThanOrEqual(0);
    expect(scoringResult.overallScore).toBeLessThanOrEqual(100);
    expect(scoringResult.trace.orderedContributions).toHaveLength(4);
    expect(scoringResult.trace.summary.rawTotalMagnitude).toBeGreaterThan(0);
    expect(scoringResult.summary.confidence).toBeDefined();
  });

  it("uses explicit polarity mappings instead of substring guesses", () => {
    expect(
      getPatternScoringPolarity("breakout_into_overhead_resistance_structure"),
    ).toBe("negative");
    expect(
      getPatternScoringPolarity("entry_near_support_structure"),
    ).toBe("positive");
    expect(
      getPatternScoringPolarity("add_into_resistance_structure"),
    ).toBe("mixed");
    expect(
      getPatternScoringPolarity("high_mfe_trade"),
    ).toBe("positive");
    expect(
      getPatternScoringPolarity("entry_after_recent_run_up"),
    ).toBe("negative");
    expect(
      getPatternScoringPolarity("quick_trade"),
    ).toBe("mixed");
  });

  it("keeps trade-duration patterns explicitly mixed instead of relying on fallback", () => {
    const tradeDurationState = createPattern(
      "quick_trade",
      PATTERN_FAMILIES.TRADE_DURATION,
      "primary_candidate",
      "atomic",
    );

    const normalizedResult = createNormalizedResult([
      tradeDurationState,
    ]);

    const scoringResult = buildPatternScoringResult(
      buildPatternScoringInput(normalizedResult),
    );

    expect(scoringResult.contributions[0].polarity).toBe("mixed");
    expect(scoringResult.contributions[0].polaritySource).toBe(
      "explicit_map",
    );
    expect(scoringResult.contributions[0].contributionScore).toBe(0);
  });

  it("still falls back to mixed for patterns outside the explicit polarity map", () => {
    const unmappedPattern = createPattern(
      "patient_position_structure",
      "custom_unmapped_family",
      "primary_candidate",
      "structural_composite",
    );

    const scoringResult = buildPatternScoringResult(
      buildPatternScoringInput(
        createNormalizedResult([unmappedPattern]),
      ),
    );

    expect(scoringResult.contributions[0].polarity).toBe("mixed");
    expect(scoringResult.contributions[0].polaritySource).toBe(
      "fallback_mixed",
    );
    expect(scoringResult.contributions[0].contributionScore).toBe(0);
  });

  it("gives stronger contribution to top primary storyline anchors than contextual atomic facts", () => {
    const topStoryline = createPattern(
      "constructive_reentry_with_constructive_final_exit",
      "scaling_quality",
      "primary_candidate",
      "storyline_composite",
    );
    const contextualAtomic = createPattern(
      "high_mfe_trade",
      "trade_excursion",
      "context_only",
      "atomic",
    );

    const normalizedResult = createNormalizedResult([
      topStoryline,
      contextualAtomic,
    ]);

    const scoringResult = buildPatternScoringResult(
      buildPatternScoringInput(normalizedResult),
    );

    const storylineContribution = scoringResult.contributions.find(
      (contribution) =>
        contribution.patternId ===
        "constructive_reentry_with_constructive_final_exit",
    );
    const atomicContribution = scoringResult.contributions.find(
      (contribution) => contribution.patternId === "high_mfe_trade",
    );

    expect(storylineContribution?.isTopOverallAnchor).toBe(true);
    expect(storylineContribution?.isPrimaryFamilyAnchor).toBe(true);
    expect(Math.abs(storylineContribution?.contributionScore ?? 0)).toBeGreaterThan(
      Math.abs(atomicContribution?.contributionScore ?? 0),
    );
  });

  it("uses Variant A as the default applied bonus config", () => {
    const normalizedResult = createNormalizedResult([
      createPattern(
        "advantaged_entry_structure",
        "entry_quality",
        "primary_candidate",
        "structural_composite",
      ),
    ]);

    const scoringResult = buildPatternScoringResult(
      buildPatternScoringInput(normalizedResult),
    );

    expect(scoringResult.summary.appliedBonusConfig).toEqual(
      DEFAULT_PATTERN_SCORING_BONUS_CONFIG,
    );
  });

  it("gives exit-quality a modest family-aware influence bump", () => {
    const scalingStoryline = createPattern(
      "constructive_reentry_with_constructive_final_exit",
      PATTERN_FAMILIES.SCALING_QUALITY,
      "primary_candidate",
      "storyline_composite",
    );
    const exitTruth = createPattern(
      "fearful_exit_after_weakening",
      PATTERN_FAMILIES.EXIT_QUALITY,
      "primary_candidate",
      "structural_composite",
    );

    const scoringResult = buildPatternScoringResult(
      buildPatternScoringInput(
        createNormalizedResult([scalingStoryline, exitTruth]),
      ),
    );

    const scalingContribution = scoringResult.contributions.find(
      (contribution) =>
        contribution.patternId ===
        "constructive_reentry_with_constructive_final_exit",
    );
    const exitContribution = scoringResult.contributions.find(
      (contribution) =>
        contribution.patternId === "fearful_exit_after_weakening",
    );

    expect(scalingContribution?.contributionScore).toBe(3.15);
    expect(exitContribution?.contributionScore).toBe(-2.88);
    expect(exitContribution?.familyInfluenceMultiplier).toBe(1.15);
    expect(exitContribution?.familyInfluenceSource).toBe("family_adjusted");
    expect(scalingContribution?.richnessContainmentMultiplier).toBe(0.9);
    expect(scalingContribution?.richnessContainmentSource).toBe(
      "storyline_family_contained",
    );
  });

  it("lifts position-reduction patterns out of mixed fallback when they have explicit polarity", () => {
    const reductionTruth = createPattern(
      "failed_profit_protection_structure",
      PATTERN_FAMILIES.POSITION_REDUCTION,
      "primary_candidate",
      "structural_composite",
    );

    const scoringResult = buildPatternScoringResult(
      buildPatternScoringInput(
        createNormalizedResult([reductionTruth]),
      ),
    );

    expect(scoringResult.contributions[0].polarity).toBe("negative");
    expect(scoringResult.contributions[0].polaritySource).toBe(
      "explicit_map",
    );
    expect(scoringResult.contributions[0].familyInfluenceMultiplier).toBe(
      1.1,
    );
    expect(scoringResult.contributions[0].familyInfluenceSource).toBe(
      "family_adjusted",
    );
    expect(scoringResult.contributions[0].contributionScore).toBe(-2.75);
  });

  it("uses explicit mixed polarity for state-only families without relying on fallback", () => {
    const closureState = createPattern(
      "fully_closed_trade",
      PATTERN_FAMILIES.TRADE_CLOSURE,
      "context_only",
      "atomic",
    );

    const scoringResult = buildPatternScoringResult(
      buildPatternScoringInput(
        createNormalizedResult([closureState]),
      ),
    );

    expect(scoringResult.contributions[0].polarity).toBe("mixed");
    expect(scoringResult.contributions[0].polaritySource).toBe(
      "explicit_map",
    );
  });

  it("exposes inspectable contribution math for structural, role, bonus, and family influence steps", () => {
    const constructivePrimary = createPattern(
      "advantaged_entry_structure",
      PATTERN_FAMILIES.ENTRY_QUALITY,
      "primary_candidate",
      "structural_composite",
    );

    const scoringResult = buildPatternScoringResult(
      buildPatternScoringInput(
        createNormalizedResult([constructivePrimary]),
      ),
    );

    expect(scoringResult.contributions[0]).toMatchObject({
      baseWeight: 2,
      roleMultiplier: 1,
      roleWeightedBaseScore: 2,
      familyAnchorBonus: 0.5,
      topAnchorBonus: 0,
      magnitudeBeforeFamilyInfluence: 2.5,
      familyInfluenceMultiplier: 1,
      familyInfluenceSource: "default",
      richnessContainmentMultiplier: 1,
      richnessContainmentSource: "none",
      contextContainmentMultiplier: 1,
      contextContainmentSource: "none",
      dominanceContainmentMultiplier: 1,
      dominanceContainmentSource: "none",
      magnitudeAfterFamilyInfluence: 2.5,
      magnitudeAfterRichnessContainment: 2.5,
      magnitudeAfterContextContainment: 2.5,
      finalWeightedMagnitude: 2.5,
      contributionScore: 2.5,
    });
    expect(scoringResult.contributions[0].transformationTrace).toHaveLength(5);
    expect(
      scoringResult.contributions[0].transformationTrace.map((step) => step.step),
    ).toEqual([
      "base_role_bonus",
      "family_influence",
      "richness_containment",
      "context_containment",
      "dominance_soft_cap",
    ]);
  });

  it("keeps light-context families as explicit but unboosted contributors", () => {
    const contextualPatterns = [
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
        "extended_trade",
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
    ];

    const scoringResult = buildPatternScoringResult(
      buildPatternScoringInput(
        createNormalizedResult(contextualPatterns),
      ),
    );

    expect(
      scoringResult.contributions.every(
        (contribution) => contribution.familyInfluenceMultiplier === 1,
      ),
    ).toBe(true);
    expect(
      scoringResult.contributions.every(
        (contribution) => contribution.familyInfluenceSource === "default",
      ),
    ).toBe(true);
    expect(
      scoringResult.contributions.every(
        (contribution) => contribution.richnessContainmentSource === "none",
      ),
    ).toBe(true);
    expect(
      scoringResult.contributions.every(
        (contribution) => contribution.contextContainmentSource ===
          "light_context_family_contained",
      ),
    ).toBe(true);
    expect(
      scoringResult.contributions.find(
        (contribution) => contribution.patternId === "entry_after_recent_drop",
      )?.polarity,
    ).toBe("positive");
    expect(
      scoringResult.contributions.find(
        (contribution) => contribution.patternId === "high_mfe_trade",
      )?.polarity,
    ).toBe("positive");
    expect(
      scoringResult.contributions.find(
        (contribution) => contribution.patternId === "extended_trade",
      )?.polarity,
    ).toBe("mixed");
    expect(
      scoringResult.contributions.find(
        (contribution) =>
          contribution.patternId === "high_frequency_execution",
      )?.polarity,
    ).toBe("mixed");
  });

  it("builds a deterministic trace ordered by absolute influence rather than input order", () => {
    const normalizedResult = createNormalizedResult([
      createPattern(
        "entry_after_recent_drop",
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
        "constructive_reentry_with_constructive_final_exit",
        PATTERN_FAMILIES.SCALING_QUALITY,
        "primary_candidate",
        "storyline_composite",
      ),
    ]);

    const scoringResult = buildPatternScoringResult(
      buildPatternScoringInput(normalizedResult),
    );

    expect(
      scoringResult.trace.orderedContributions.map(
        (contribution) => contribution.patternId,
      ),
    ).toEqual([
      "constructive_reentry_with_constructive_final_exit",
      "fearful_exit_after_weakening",
      "entry_after_recent_drop",
    ]);
  });

  it("treats position-structure as explicit non-directional structural context", () => {
    const positionStructurePattern = createPattern(
      "aggressive_scale_in",
      PATTERN_FAMILIES.POSITION_STRUCTURE,
      "primary_candidate",
      "structural_composite",
    );

    const scoringResult = buildPatternScoringResult(
      buildPatternScoringInput(
        createNormalizedResult([positionStructurePattern]),
      ),
    );

    expect(scoringResult.contributions[0].polarity).toBe("mixed");
    expect(scoringResult.contributions[0].polaritySource).toBe(
      "explicit_map",
    );
    expect(scoringResult.contributions[0].contributionScore).toBe(0);
  });

  it("contains scaling-quality storyline richness without changing structural families", () => {
    const scalingStoryline = createPattern(
      "constructive_reentry_with_constructive_final_exit",
      PATTERN_FAMILIES.SCALING_QUALITY,
      "primary_candidate",
      "storyline_composite",
    );
    const scalingStructural = createPattern(
      "structured_position_building",
      PATTERN_FAMILIES.SCALING_QUALITY,
      "primary_candidate",
      "structural_composite",
    );

    const scoringResult = buildPatternScoringResult(
      buildPatternScoringInput(
        createNormalizedResult([scalingStoryline, scalingStructural]),
      ),
    );

    const storylineContribution = scoringResult.contributions.find(
      (contribution) =>
        contribution.patternId ===
        "constructive_reentry_with_constructive_final_exit",
    );
    const structuralContribution = scoringResult.contributions.find(
      (contribution) =>
        contribution.patternId === "structured_position_building",
    );

    expect(storylineContribution?.richnessContainmentMultiplier).toBe(0.9);
    expect(storylineContribution?.richnessContainmentSource).toBe(
      "storyline_family_contained",
    );
    expect(structuralContribution?.richnessContainmentMultiplier).toBe(1);
    expect(structuralContribution?.richnessContainmentSource).toBe("none");
    expect(structuralContribution?.contextContainmentSource).toBe("none");
    expect(
      Math.abs(storylineContribution?.contributionScore ?? 0),
    ).toBeGreaterThan(0);
    expect(
      Math.abs(storylineContribution?.contributionScore ?? 0),
    ).toBeLessThan(Math.abs(structuralContribution?.contributionScore ?? 0));
  });

  it("applies extra decay to non-primary scaling storylines so family richness accumulates more slowly", () => {
    const scalingPrimaryStoryline = createPattern(
      "constructive_reentry_with_constructive_final_exit",
      PATTERN_FAMILIES.SCALING_QUALITY,
      "primary_candidate",
      "storyline_composite",
    );
    const scalingSupportingStoryline = createPattern(
      "repeated_balanced_management_with_premature_final_exit",
      PATTERN_FAMILIES.SCALING_QUALITY,
      "supporting_candidate",
      "storyline_composite",
    );

    const scoringResult = buildPatternScoringResult(
      buildPatternScoringInput(
        createNormalizedResult([
          scalingPrimaryStoryline,
          scalingSupportingStoryline,
        ]),
      ),
    );

    const primaryContribution = scoringResult.contributions.find(
      (contribution) =>
        contribution.patternId ===
        "constructive_reentry_with_constructive_final_exit",
    );
    const supportingContribution = scoringResult.contributions.find(
      (contribution) =>
        contribution.patternId ===
        "repeated_balanced_management_with_premature_final_exit",
    );

    expect(primaryContribution?.richnessContainmentMultiplier).toBe(0.9);
    expect(primaryContribution?.richnessContainmentSource).toBe(
      "storyline_family_contained",
    );
    expect(supportingContribution?.richnessContainmentMultiplier).toBeCloseTo(
      0.765,
      3,
    );
    expect(supportingContribution?.richnessContainmentSource).toBe(
      "storyline_family_contained_with_supporting_decay",
    );
    expect(
      Math.abs(supportingContribution?.contributionScore ?? 0),
    ).toBeLessThan(
      Math.abs(primaryContribution?.contributionScore ?? 0),
    );
  });

  it("applies a conservative dominance soft cap when contained families would otherwise over-dominate", () => {
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
    ]);

    const scoringResult = buildPatternScoringResult(
      buildPatternScoringInput(normalizedResult),
    );

    expect(scoringResult.suppressionSummary.dominanceSoftCappedFamilies).toContain(
      PATTERN_FAMILIES.SCALING_QUALITY,
    );
    expect(scoringResult.trace.summary.dominanceFlags).toContain(
      "single_family_dominant",
    );
    expect(
      scoringResult.contributions
        .filter((contribution) => contribution.family === PATTERN_FAMILIES.SCALING_QUALITY)
        .some(
          (contribution) =>
            contribution.dominanceContainmentSource ===
            "family_dominance_soft_capped",
        ),
    ).toBe(true);
  });

  it("guards stacked light-context contributions so they stay lighter than a calibrated exit truth", () => {
    const lightContextPatterns = [
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
    ];
    const exitTruth = createPattern(
      "fearful_exit_after_weakening",
      PATTERN_FAMILIES.EXIT_QUALITY,
      "primary_candidate",
      "structural_composite",
    );

    const scoringResult = buildPatternScoringResult(
      buildPatternScoringInput(
        createNormalizedResult([...lightContextPatterns, exitTruth]),
      ),
    );

    const totalLightContextMagnitude = scoringResult.contributions
      .filter((contribution) => contribution.normalizedRole === "context_only")
      .reduce(
        (sum, contribution) => sum + Math.abs(contribution.contributionScore),
        0,
      );
    const exitContribution = scoringResult.contributions.find(
      (contribution) => contribution.patternId === "fearful_exit_after_weakening",
    );

    expect(
      scoringResult.contributions
        .filter((contribution) => contribution.normalizedRole === "context_only")
        .every(
          (contribution) =>
            contribution.contextContainmentSource ===
            "light_context_family_contained",
        ),
    ).toBe(true);
    expect(totalLightContextMagnitude).toBeLessThan(
      Math.abs(exitContribution?.contributionScore ?? Number.POSITIVE_INFINITY),
    );
  });
});
