import type {
  StructuralLevel,
} from "../../pattern-detection/types/pattern-detection-types";
import type { NormalizationRole } from "../../pattern-normalization/pattern-metadata";
import type { NormalizedDetectedPattern } from "../../pattern-normalization/types/normalized-pattern-result";
import type { PatternScoringInput } from "../types/pattern-scoring-input";
import { PATTERN_FAMILIES } from "../../pattern-detection/types/pattern-detection-types";
import type {
  PatternScoringBonusConfig,
  PatternScorePolaritySource,
  PatternScoreBand,
  PatternScoreContribution,
  PatternScoreContextContainmentSource,
  PatternScoreDominanceContainmentSource,
  PatternScoreFamilyInfluenceSource,
  PatternScoreRichnessContainmentSource,
  PatternScorePolarity,
  PatternScoreTransformationStep,
  PatternScoringResult,
  PatternScoringTrace,
  PatternScoringTraceFamily,
  PatternScoringTraceSummary,
  PatternScoringSuppressionSummary,
  PatternScoringConfidence,
  ScoringDominanceFlag,
} from "../types/pattern-scoring-result";
import {
  getPatternScoringPolarity,
  getPatternScoringPolaritySource,
} from "../pattern-polarity-map";

export const DEFAULT_PATTERN_SCORING_BONUS_CONFIG: PatternScoringBonusConfig = {
  familyAnchorBonus: 0.5,
  topAnchorBonus: 0,
};

const FAMILY_INFLUENCE_MULTIPLIERS: Partial<Record<string, number>> = {
  [PATTERN_FAMILIES.EXIT_QUALITY]: 1.15,
  [PATTERN_FAMILIES.POSITION_REDUCTION]: 1.1,
};

const STORYLINE_FAMILY_CONTAINMENT_MULTIPLIER = 0.9;
const SUPPORTING_SCALING_STORYLINE_DECAY_MULTIPLIER = 0.85;
const LIGHT_CONTEXT_FAMILY_CONTAINMENT_MULTIPLIER = 0.85;
const FAMILY_DOMINANCE_TRIGGER_SHARE = 0.58;
const FAMILY_DOMINANCE_TARGET_SHARE = 0.52;

const LIGHT_CONTEXT_FAMILIES = new Set<string>([
  PATTERN_FAMILIES.ENTRY_CONTEXT,
  PATTERN_FAMILIES.TRADE_EXCURSION,
  PATTERN_FAMILIES.TRADE_DURATION,
  PATTERN_FAMILIES.EXECUTION_FREQUENCY,
  PATTERN_FAMILIES.TRADE_CLOSURE,
  PATTERN_FAMILIES.POSITION_BUILDING,
]);

function getStructuralLevelBaseWeight(
  structuralLevel: StructuralLevel,
): number {
  switch (structuralLevel) {
    case "storyline_composite":
      return 3;
    case "structural_composite":
      return 2;
    case "atomic":
    default:
      return 1;
  }
}

function getRoleMultiplier(
  normalizedRole: NormalizationRole,
): number {
  switch (normalizedRole) {
    case "primary_candidate":
      return 1;
    case "supporting_candidate":
      return 0.55;
    case "context_only":
    default:
      return 0.25;
  }
}

function getFamilyInfluenceMultiplier(family: string): number {
  return FAMILY_INFLUENCE_MULTIPLIERS[family] ?? 1;
}

function getRichnessContainmentMultiplier(
  pattern: NormalizedDetectedPattern,
): number {
  if (
    pattern.family === PATTERN_FAMILIES.SCALING_QUALITY &&
    pattern.structuralLevel === "storyline_composite"
  ) {
    if (pattern.normalizedRole !== "primary_candidate") {
      return (
        STORYLINE_FAMILY_CONTAINMENT_MULTIPLIER *
        SUPPORTING_SCALING_STORYLINE_DECAY_MULTIPLIER
      );
    }

    return STORYLINE_FAMILY_CONTAINMENT_MULTIPLIER;
  }

  return 1;
}

function getContextContainmentMultiplier(
  pattern: NormalizedDetectedPattern,
): number {
  if (
    pattern.normalizedRole === "context_only" &&
    pattern.structuralLevel === "atomic" &&
    LIGHT_CONTEXT_FAMILIES.has(pattern.family)
  ) {
    return LIGHT_CONTEXT_FAMILY_CONTAINMENT_MULTIPLIER;
  }

  return 1;
}

function getRolePriority(normalizedRole: NormalizationRole): number {
  switch (normalizedRole) {
    case "primary_candidate":
      return 0;
    case "supporting_candidate":
      return 1;
    case "context_only":
    default:
      return 2;
  }
}

function getStructuralLevelPriority(structuralLevel: StructuralLevel): number {
  switch (structuralLevel) {
    case "storyline_composite":
      return 0;
    case "structural_composite":
      return 1;
    case "atomic":
    default:
      return 2;
  }
}

function sortPatternsForDeterministicScoring(
  patterns: NormalizedDetectedPattern[],
): NormalizedDetectedPattern[] {
  return [...patterns].sort((left, right) => {
    const roleDifference =
      getRolePriority(left.normalizedRole) -
      getRolePriority(right.normalizedRole);

    if (roleDifference !== 0) {
      return roleDifference;
    }

    const structuralDifference =
      getStructuralLevelPriority(left.structuralLevel) -
      getStructuralLevelPriority(right.structuralLevel);

    if (structuralDifference !== 0) {
      return structuralDifference;
    }

    const familyDifference = left.family.localeCompare(right.family);

    if (familyDifference !== 0) {
      return familyDifference;
    }

    return left.patternId.localeCompare(right.patternId);
  });
}

function sortContributionsForTrace(
  contributions: PatternScoreContribution[],
): PatternScoreContribution[] {
  return [...contributions].sort((left, right) => {
    const influenceDifference =
      Math.abs(right.contributionScore) - Math.abs(left.contributionScore);

    if (influenceDifference !== 0) {
      return influenceDifference;
    }

    const rawDifference =
      Math.abs(right.magnitudeBeforeFamilyInfluence) -
      Math.abs(left.magnitudeBeforeFamilyInfluence);

    if (rawDifference !== 0) {
      return rawDifference;
    }

    const familyDifference = left.family.localeCompare(right.family);

    if (familyDifference !== 0) {
      return familyDifference;
    }

    return left.patternId.localeCompare(right.patternId);
  });
}

function buildContribution(
  pattern: NormalizedDetectedPattern,
  scoringInput: PatternScoringInput,
  bonusConfig: PatternScoringBonusConfig,
): PatternScoreContribution {
  const baseWeight = getStructuralLevelBaseWeight(
    pattern.structuralLevel,
  );
  const roleMultiplier = getRoleMultiplier(pattern.normalizedRole);

  const isPrimaryFamilyAnchor =
    scoringInput.primaryPatternsByFamily[pattern.family]?.patternId ===
    pattern.patternId;
  const isTopOverallAnchor =
    scoringInput.topOverallAnchorPattern?.patternId === pattern.patternId;

  const familyAnchorBonus = isPrimaryFamilyAnchor
    ? bonusConfig.familyAnchorBonus
    : 0;
  const topAnchorBonus = isTopOverallAnchor
    ? bonusConfig.topAnchorBonus
    : 0;
  const polarity = getPatternScoringPolarity(pattern.patternId) as PatternScorePolarity;
  const polaritySource =
    getPatternScoringPolaritySource(pattern.patternId) as PatternScorePolaritySource;
  const familyInfluenceMultiplier = getFamilyInfluenceMultiplier(
    pattern.family,
  );
  const familyInfluenceSource: PatternScoreFamilyInfluenceSource =
    familyInfluenceMultiplier === 1 ? "default" : "family_adjusted";
  const richnessContainmentMultiplier = getRichnessContainmentMultiplier(
    pattern,
  );
  const richnessContainmentSource: PatternScoreRichnessContainmentSource =
    richnessContainmentMultiplier === 1
      ? "none"
      : pattern.family === PATTERN_FAMILIES.SCALING_QUALITY &&
          pattern.structuralLevel === "storyline_composite" &&
          pattern.normalizedRole !== "primary_candidate"
        ? "storyline_family_contained_with_supporting_decay"
        : "storyline_family_contained";
  const contextContainmentMultiplier = getContextContainmentMultiplier(
    pattern,
  );
  const contextContainmentSource: PatternScoreContextContainmentSource =
    contextContainmentMultiplier === 1
      ? "none"
      : "light_context_family_contained";
  const roleWeightedBaseScore = baseWeight * roleMultiplier;
  const magnitudeBeforeFamilyInfluence =
    roleWeightedBaseScore + familyAnchorBonus + topAnchorBonus;
  const magnitudeAfterFamilyInfluence =
    magnitudeBeforeFamilyInfluence * familyInfluenceMultiplier;
  const magnitudeAfterRichnessContainment =
    magnitudeAfterFamilyInfluence * richnessContainmentMultiplier;
  const magnitudeAfterContextContainment =
    magnitudeAfterRichnessContainment * contextContainmentMultiplier;

  const weightedMagnitude =
    magnitudeAfterContextContainment;

  const contributionScore =
    polarity === "positive"
      ? weightedMagnitude
      : polarity === "negative"
        ? -weightedMagnitude
        : 0;

  return {
    patternId: pattern.patternId,
    family: pattern.family,
    normalizedRole: pattern.normalizedRole,
    structuralLevel: pattern.structuralLevel,
    polarity,
    polaritySource,
    baseWeight,
    roleWeightedBaseScore: Number(roleWeightedBaseScore.toFixed(2)),
    roleMultiplier,
    familyInfluenceMultiplier,
    familyInfluenceSource,
    richnessContainmentMultiplier,
    richnessContainmentSource,
    contextContainmentMultiplier,
    contextContainmentSource,
    dominanceContainmentMultiplier: 1,
    dominanceContainmentSource: "none",
    familyAnchorBonus,
    topAnchorBonus,
    magnitudeBeforeFamilyInfluence: Number(
      magnitudeBeforeFamilyInfluence.toFixed(2),
    ),
    magnitudeAfterFamilyInfluence: Number(
      magnitudeAfterFamilyInfluence.toFixed(2),
    ),
    magnitudeAfterRichnessContainment: Number(
      magnitudeAfterRichnessContainment.toFixed(2),
    ),
    magnitudeAfterContextContainment: Number(
      magnitudeAfterContextContainment.toFixed(2),
    ),
    finalWeightedMagnitude: Number(weightedMagnitude.toFixed(2)),
    contributionScore: Number(contributionScore.toFixed(2)),
    isPrimaryFamilyAnchor,
    isTopOverallAnchor,
    transformationTrace: [],
  };
}

function shouldApplyDominanceSoftCap(
  contribution: PatternScoreContribution,
  familyShare: number,
): boolean {
  return (
    familyShare > FAMILY_DOMINANCE_TRIGGER_SHARE &&
    contribution.polarity !== "mixed" &&
    (contribution.richnessContainmentSource !== "none" ||
      contribution.contextContainmentSource !== "none")
  );
}

function buildTransformationTrace(
  contribution: PatternScoreContribution,
): PatternScoreTransformationStep[] {
  return [
    {
      step: "base_role_bonus",
      source: "base_weight_role_and_anchor_bonus",
      inputMagnitude: 0,
      multiplier: 1,
      outputMagnitude: contribution.magnitudeBeforeFamilyInfluence,
      delta: contribution.magnitudeBeforeFamilyInfluence,
    },
    {
      step: "family_influence",
      source: contribution.familyInfluenceSource,
      inputMagnitude: contribution.magnitudeBeforeFamilyInfluence,
      multiplier: contribution.familyInfluenceMultiplier,
      outputMagnitude: contribution.magnitudeAfterFamilyInfluence,
      delta: Number(
        (
          contribution.magnitudeAfterFamilyInfluence -
          contribution.magnitudeBeforeFamilyInfluence
        ).toFixed(2),
      ),
    },
    {
      step: "richness_containment",
      source: contribution.richnessContainmentSource,
      inputMagnitude: contribution.magnitudeAfterFamilyInfluence,
      multiplier: contribution.richnessContainmentMultiplier,
      outputMagnitude: contribution.magnitudeAfterRichnessContainment,
      delta: Number(
        (
          contribution.magnitudeAfterRichnessContainment -
          contribution.magnitudeAfterFamilyInfluence
        ).toFixed(2),
      ),
    },
    {
      step: "context_containment",
      source: contribution.contextContainmentSource,
      inputMagnitude: contribution.magnitudeAfterRichnessContainment,
      multiplier: contribution.contextContainmentMultiplier,
      outputMagnitude: contribution.magnitudeAfterContextContainment,
      delta: Number(
        (
          contribution.magnitudeAfterContextContainment -
          contribution.magnitudeAfterRichnessContainment
        ).toFixed(2),
      ),
    },
    {
      step: "dominance_soft_cap",
      source: contribution.dominanceContainmentSource,
      inputMagnitude: contribution.magnitudeAfterContextContainment,
      multiplier: contribution.dominanceContainmentMultiplier,
      outputMagnitude: contribution.finalWeightedMagnitude,
      delta: Number(
        (
          contribution.finalWeightedMagnitude -
          contribution.magnitudeAfterContextContainment
        ).toFixed(2),
      ),
    },
  ];
}

function applyDominanceSoftCaps(
  contributions: PatternScoreContribution[],
): PatternScoreContribution[] {
  const totalAdjustedMagnitude = contributions.reduce(
    (sum, contribution) => sum + Math.abs(contribution.finalWeightedMagnitude),
    0,
  );

  if (totalAdjustedMagnitude === 0) {
    return contributions.map((contribution) => ({
      ...contribution,
      transformationTrace: buildTransformationTrace(contribution),
    }));
  }

  const familyMagnitudeMap = new Map<string, number>();

  for (const contribution of contributions) {
    familyMagnitudeMap.set(
      contribution.family,
      (familyMagnitudeMap.get(contribution.family) ?? 0) +
        Math.abs(contribution.finalWeightedMagnitude),
    );
  }

  return contributions.map((contribution) => {
    const familyMagnitude = familyMagnitudeMap.get(contribution.family) ?? 0;
    const familyShare = familyMagnitude / totalAdjustedMagnitude;

    let dominanceContainmentMultiplier = 1;
    let dominanceContainmentSource: PatternScoreDominanceContainmentSource =
      "none";

    if (shouldApplyDominanceSoftCap(contribution, familyShare)) {
      dominanceContainmentMultiplier = Number(
        Math.min(1, FAMILY_DOMINANCE_TARGET_SHARE / familyShare).toFixed(3),
      );
      dominanceContainmentSource = "family_dominance_soft_capped";
    }

    const finalWeightedMagnitude = Number(
      (
        contribution.finalWeightedMagnitude * dominanceContainmentMultiplier
      ).toFixed(2),
    );
    const contributionScore =
      contribution.polarity === "positive"
        ? finalWeightedMagnitude
        : contribution.polarity === "negative"
          ? -finalWeightedMagnitude
          : 0;

    const updatedContribution: PatternScoreContribution = {
      ...contribution,
      dominanceContainmentMultiplier,
      dominanceContainmentSource,
      finalWeightedMagnitude,
      contributionScore: Number(contributionScore.toFixed(2)),
      transformationTrace: [],
    };

    return {
      ...updatedContribution,
      transformationTrace: buildTransformationTrace(updatedContribution),
    };
  });
}

function getTraceFamilyFlags(
  family: PatternScoringTraceFamily,
): string[] {
  const flags: string[] = [];

  if (family.dominanceScore >= FAMILY_DOMINANCE_TRIGGER_SHARE) {
    flags.push("single_family_dominant");
  }

  if (
    family.dominanceScore >= 0.45 &&
    family.topContributorShareOfFamily <= 0.6
  ) {
    flags.push("stacked_pattern_dominant");
  }

  if (family.familyInfluenceRatio <= 0.8) {
    flags.push("over_contained");
  }

  if (family.directionalPatternCount === 0) {
    flags.push("non_directional_family");
  }

  return flags;
}

function buildTraceFamilies(
  contributions: PatternScoreContribution[],
): PatternScoringTraceFamily[] {
  const totalAdjustedMagnitude = contributions.reduce(
    (sum, contribution) => sum + Math.abs(contribution.finalWeightedMagnitude),
    0,
  );
  const familyNames = Array.from(
    new Set(contributions.map((contribution) => contribution.family)),
  );

  return familyNames
    .map((family) => {
      const familyContributions = contributions.filter(
        (contribution) => contribution.family === family,
      );
      const orderedFamilyContributions =
        sortContributionsForTrace(familyContributions);
      const rawFamilyPressure = Number(
        familyContributions
          .reduce(
            (sum, contribution) =>
              sum + Math.abs(contribution.magnitudeBeforeFamilyInfluence),
            0,
          )
          .toFixed(2),
      );
      const adjustedFamilyPressure = Number(
        familyContributions
          .reduce(
            (sum, contribution) => sum + Math.abs(contribution.finalWeightedMagnitude),
            0,
          )
          .toFixed(2),
      );
      const effectiveDirectionalImpact = Number(
        familyContributions
          .reduce((sum, contribution) => sum + contribution.contributionScore, 0)
          .toFixed(2),
      );
      const familyInfluenceRatio = Number(
        (
          adjustedFamilyPressure / Math.max(1, rawFamilyPressure)
        ).toFixed(2),
      );
      const dominanceScore = Number(
        (
          adjustedFamilyPressure / Math.max(1, totalAdjustedMagnitude)
        ).toFixed(2),
      );
      const topContributor = orderedFamilyContributions[0] ?? null;
      const topContributorShareOfFamily = Number(
        (
          Math.abs(topContributor?.contributionScore ?? 0) /
          Math.max(1, adjustedFamilyPressure)
        ).toFixed(2),
      );
      const traceFamily: PatternScoringTraceFamily = {
        family,
        rawFamilyPressure,
        adjustedFamilyPressure,
        effectiveDirectionalImpact,
        familyInfluenceRatio,
        dominanceScore,
        topContributorPatternId: topContributor?.patternId ?? null,
        topContributorShareOfFamily,
        directionalPatternCount: familyContributions.filter(
          (contribution) => contribution.polarity !== "mixed",
        ).length,
        nonDirectionalPatternCount: familyContributions.filter(
          (contribution) => contribution.polarity === "mixed",
        ).length,
        flags: [],
        contributionPatternIds: orderedFamilyContributions.map(
          (contribution) => contribution.patternId,
        ),
      };

      return {
        ...traceFamily,
        flags: getTraceFamilyFlags(traceFamily),
      };
    })
    .sort((left, right) => {
      const dominanceDifference = right.dominanceScore - left.dominanceScore;

      if (dominanceDifference !== 0) {
        return dominanceDifference;
      }

      return left.family.localeCompare(right.family);
    });
}

function getScoringConfidence(
  contributions: PatternScoreContribution[],
  traceFamilies: PatternScoringTraceFamily[],
): PatternScoringConfidence {
  const fallbackCount = contributions.filter(
    (contribution) => contribution.polaritySource === "fallback_mixed",
  ).length;

  if (
    fallbackCount === 0 &&
    !traceFamilies.some((family) => family.flags.includes("single_family_dominant"))
  ) {
    return "high";
  }

  if (fallbackCount <= 2) {
    return "moderate";
  }

  return "low";
}

function buildTraceSummary(
  contributions: PatternScoreContribution[],
  traceFamilies: PatternScoringTraceFamily[],
): PatternScoringTraceSummary {
  const rawTotalMagnitude = Number(
    contributions
      .reduce(
        (sum, contribution) =>
          sum + Math.abs(contribution.magnitudeBeforeFamilyInfluence),
        0,
      )
      .toFixed(2),
  );
  const adjustedTotalMagnitude = Number(
    contributions
      .reduce(
        (sum, contribution) => sum + Math.abs(contribution.finalWeightedMagnitude),
        0,
      )
      .toFixed(2),
  );
  const effectiveDirectionalTotal = Number(
    contributions
      .reduce((sum, contribution) => sum + contribution.contributionScore, 0)
      .toFixed(2),
  );
  const deltaByTransformationType = {
    familyInfluence: Number(
      contributions
        .reduce(
          (sum, contribution) =>
            sum +
            (contribution.magnitudeAfterFamilyInfluence -
              contribution.magnitudeBeforeFamilyInfluence),
          0,
        )
        .toFixed(2),
    ),
    richnessContainment: Number(
      contributions
        .reduce(
          (sum, contribution) =>
            sum +
            (contribution.magnitudeAfterRichnessContainment -
              contribution.magnitudeAfterFamilyInfluence),
          0,
        )
        .toFixed(2),
    ),
    contextContainment: Number(
      contributions
        .reduce(
          (sum, contribution) =>
            sum +
            (contribution.magnitudeAfterContextContainment -
              contribution.magnitudeAfterRichnessContainment),
          0,
        )
        .toFixed(2),
    ),
    dominanceSoftCap: Number(
      contributions
        .reduce(
          (sum, contribution) =>
            sum +
            (contribution.finalWeightedMagnitude -
              contribution.magnitudeAfterContextContainment),
          0,
        )
        .toFixed(2),
    ),
  };

  const dominanceFlags: ScoringDominanceFlag[] = [];
  const dominantFamily = traceFamilies[0]?.family ?? null;
  const highestDominanceScore = traceFamilies[0]?.dominanceScore ?? 0;

  if (highestDominanceScore >= FAMILY_DOMINANCE_TRIGGER_SHARE) {
    dominanceFlags.push("single_family_dominant");
  }

  if (
    traceFamilies.some((family) =>
      family.flags.includes("stacked_pattern_dominant"),
    )
  ) {
    dominanceFlags.push("stacked_pattern_dominant");
  }

  if (dominanceFlags.length === 0) {
    dominanceFlags.push("balanced_distribution");
  }

  return {
    rawTotalMagnitude,
    adjustedTotalMagnitude,
    effectiveDirectionalTotal,
    deltaByTransformationType,
    dominanceFlags,
    dominantFamily,
    highestDominanceScore,
    confidence: getScoringConfidence(contributions, traceFamilies),
  };
}

function buildScoringTrace(
  contributions: PatternScoreContribution[],
): PatternScoringTrace {
  const orderedContributions = sortContributionsForTrace(contributions);
  const groupedByFamily = buildTraceFamilies(orderedContributions);
  const summary = buildTraceSummary(orderedContributions, groupedByFamily);

  return {
    orderedContributions,
    groupedByFamily,
    summary,
  };
}

function buildSuppressionSummary(
  contributions: PatternScoreContribution[],
): PatternScoringSuppressionSummary {
  const familiesBy = (
    predicate: (contribution: PatternScoreContribution) => boolean,
  ) =>
    Array.from(
      new Set(
        contributions
          .filter(predicate)
          .map((contribution) => contribution.family),
      ),
    ).sort((left, right) => left.localeCompare(right));

  return {
    familyAdjustedFamilies: familiesBy(
      (contribution) => contribution.familyInfluenceSource !== "default",
    ),
    richnessContainedFamilies: familiesBy(
      (contribution) => contribution.richnessContainmentSource !== "none",
    ),
    contextContainedFamilies: familiesBy(
      (contribution) => contribution.contextContainmentSource !== "none",
    ),
    dominanceSoftCappedFamilies: familiesBy(
      (contribution) => contribution.dominanceContainmentSource !== "none",
    ),
  };
}

function getScoreBand(netScore: number): PatternScoreBand {
  if (netScore <= -6) {
    return "strong_negative";
  }

  if (netScore < -1.5) {
    return "negative";
  }

  if (netScore < 1.5) {
    return "mixed";
  }

  if (netScore < 6) {
    return "positive";
  }

  return "strong_positive";
}

function normalizeOverallScore(netScore: number): number {
  return Math.max(0, Math.min(100, Math.round(50 + netScore * 5)));
}

export function buildPatternScoringResult(
  scoringInput: PatternScoringInput,
): PatternScoringResult {
  const appliedBonusConfig = DEFAULT_PATTERN_SCORING_BONUS_CONFIG;

  const contributions = sortPatternsForDeterministicScoring(
    scoringInput.prioritizedPatterns,
  ).map((pattern) =>
    buildContribution(pattern, scoringInput, appliedBonusConfig),
  );
  const finalizedContributions = applyDominanceSoftCaps(contributions);
  const trace = buildScoringTrace(finalizedContributions);
  const suppressionSummary = buildSuppressionSummary(finalizedContributions);

  const positiveScore = finalizedContributions.reduce((sum, contribution) => {
    return contribution.contributionScore > 0
      ? sum + contribution.contributionScore
      : sum;
  }, 0);

  const negativeScore = finalizedContributions.reduce((sum, contribution) => {
    return contribution.contributionScore < 0
      ? sum + Math.abs(contribution.contributionScore)
      : sum;
  }, 0);

  const netScore = Number((positiveScore - negativeScore).toFixed(2));

  return {
    overallScore: normalizeOverallScore(netScore),
    positiveScore: Number(positiveScore.toFixed(2)),
    negativeScore: Number(negativeScore.toFixed(2)),
    netScore,
    scoreBand: getScoreBand(netScore),
    contributions: finalizedContributions,
    trace,
    suppressionSummary,
    summary: {
      topOverallAnchorPattern: scoringInput.topOverallAnchorPattern,
      primaryPatternCount: scoringInput.primaryPatterns.length,
      supportingPatternCount: scoringInput.supportingPatterns.length,
      contextualPatternCount: scoringInput.contextualPatterns.length,
      familyAnchorCount: Object.keys(
        scoringInput.primaryPatternsByFamily,
      ).length,
      appliedBonusConfig,
      dominantFamily: trace.summary.dominantFamily,
      dominanceFlags: trace.summary.dominanceFlags,
      confidence: trace.summary.confidence,
    },
  };
}
