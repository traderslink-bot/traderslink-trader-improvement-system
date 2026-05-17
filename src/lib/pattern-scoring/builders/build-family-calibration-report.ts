import type { StructuralLevel } from "../../pattern-detection/types/pattern-detection-types";
import type { NormalizationRole } from "../../pattern-normalization/pattern-metadata";
import type { PatternScoringInput } from "../types/pattern-scoring-input";
import type {
  PatternScoreContribution,
  PatternScorePolaritySource,
  PatternScoringResult,
} from "../types/pattern-scoring-result";
import type {
  FamilyCalibrationEntry,
  FamilyCalibrationNote,
  FamilyCalibrationReport,
  FamilyCalibrationTopContributor,
  FamilyShapeClassification,
} from "../types/family-calibration-report";

function createStructuralLevelCounts(): Record<StructuralLevel, number> {
  return {
    atomic: 0,
    structural_composite: 0,
    storyline_composite: 0,
  };
}

function createRoleCounts(): Record<NormalizationRole, number> {
  return {
    primary_candidate: 0,
    supporting_candidate: 0,
    context_only: 0,
  };
}

function createPolaritySourceCounts(): Record<PatternScorePolaritySource, number> {
  return {
    explicit_map: 0,
    fallback_mixed: 0,
  };
}

function getFamilyShape(
  structuralLevelCounts: Record<StructuralLevel, number>,
  normalizedRoleCounts: Record<NormalizationRole, number>,
  totalPatternCount: number,
): FamilyShapeClassification {
  if (totalPatternCount === 0) {
    return "mixed_shape";
  }

  if (
    structuralLevelCounts.storyline_composite / totalPatternCount >= 0.5
  ) {
    return "storyline_heavy";
  }

  if (
    structuralLevelCounts.structural_composite / totalPatternCount >= 0.6
  ) {
    return "structural";
  }

  if (
    normalizedRoleCounts.context_only / totalPatternCount >= 0.6 &&
    structuralLevelCounts.atomic / totalPatternCount >= 0.6
  ) {
    return "light_context";
  }

  return "mixed_shape";
}

function buildTopContributor(
  contributions: PatternScoreContribution[],
): FamilyCalibrationTopContributor | null {
  if (contributions.length === 0) {
    return null;
  }

  const [topContribution] = [...contributions].sort((left, right) => {
    const absoluteDifference =
      Math.abs(right.contributionScore) - Math.abs(left.contributionScore);

    if (absoluteDifference !== 0) {
      return absoluteDifference;
    }

    return left.patternId.localeCompare(right.patternId);
  });

  return {
    patternId: topContribution.patternId,
    contributionScore: topContribution.contributionScore,
    absoluteContribution: Math.abs(topContribution.contributionScore),
    structuralLevel: topContribution.structuralLevel,
    normalizedRole: topContribution.normalizedRole,
    polarity: topContribution.polarity,
    polaritySource: topContribution.polaritySource,
  };
}

function buildFamilyNotes(
  familyShape: FamilyShapeClassification,
  fallbackPolarityCount: number,
  richnessContainedContributionCount: number,
  contextContainedContributionCount: number,
  totalPatternCount: number,
  topContributor: FamilyCalibrationTopContributor | null,
  summedAbsoluteContribution: number,
  absoluteContributionShare: number,
  magnitudeAdjustmentRatio: number,
): FamilyCalibrationNote[] {
  const notes: FamilyCalibrationNote[] = [];

  if (familyShape === "storyline_heavy") {
    notes.push("storyline_heavy");
  }

  if (
    totalPatternCount > 0 &&
    fallbackPolarityCount / totalPatternCount >= 0.5
  ) {
    notes.push("fallback_heavy");
  }
  if (richnessContainedContributionCount > 0) {
    notes.push("richness_contained");
  }
  if (contextContainedContributionCount > 0) {
    notes.push("context_stack_guarded");
  }
  if (
    totalPatternCount > 0 &&
    fallbackPolarityCount === 0 &&
    summedAbsoluteContribution === 0 &&
    familyShape === "structural"
  ) {
    notes.push("explicit_non_directional");
  }

  if (familyShape === "light_context") {
    notes.push("light_context_like");
  }
  if (magnitudeAdjustmentRatio <= 0.85) {
    notes.push("adjustment_heavy");
  }

  if (
    absoluteContributionShare >= 0.4 ||
    (topContributor !== null &&
      summedAbsoluteContribution > 0 &&
      topContributor.absoluteContribution / summedAbsoluteContribution >= 0.65)
  ) {
    notes.push("contribution_concentrated");
  }

  return notes;
}

export function buildFamilyCalibrationReport(
  scoringInput: PatternScoringInput,
  scoringResultOrContributions:
    | PatternScoringResult
    | PatternScoreContribution[],
): FamilyCalibrationReport {
  const scoringResult = Array.isArray(scoringResultOrContributions)
    ? null
    : scoringResultOrContributions;
  const contributions = Array.isArray(scoringResultOrContributions)
    ? scoringResultOrContributions
    : scoringResultOrContributions.contributions;
  const familyNames = Array.from(
    new Set(scoringInput.prioritizedPatterns.map((pattern) => pattern.family)),
  );

  const totalAbsoluteContribution = Number(
    contributions
      .reduce((sum, contribution) => sum + Math.abs(contribution.contributionScore), 0)
      .toFixed(2),
  );

  const families: FamilyCalibrationEntry[] = familyNames
    .map((family) => {
      const patternsInFamily = scoringInput.prioritizedPatterns.filter(
        (pattern) => pattern.family === family,
      );
      const contributionsInFamily = contributions.filter(
        (contribution) => contribution.family === family,
      );

      const structuralLevelCounts = createStructuralLevelCounts();
      for (const pattern of patternsInFamily) {
        structuralLevelCounts[pattern.structuralLevel] += 1;
      }

      const normalizedRoleCounts = createRoleCounts();
      for (const pattern of patternsInFamily) {
        normalizedRoleCounts[pattern.normalizedRole] += 1;
      }

      const polaritySourceBreakdown = createPolaritySourceCounts();
      for (const contribution of contributionsInFamily) {
        polaritySourceBreakdown[contribution.polaritySource] += 1;
      }

      const directionalPatternCount = contributionsInFamily.filter(
        (contribution) => contribution.polarity !== "mixed",
      ).length;
      const nonDirectionalPatternCount =
        contributionsInFamily.length - directionalPatternCount;
      const summedAbsoluteRawMagnitude = Number(
        contributionsInFamily
          .reduce(
            (sum, contribution) =>
              sum + Math.abs(contribution.magnitudeBeforeFamilyInfluence),
            0,
          )
          .toFixed(2),
      );
      const summedAbsoluteAdjustedMagnitude = Number(
        contributionsInFamily
          .reduce(
            (sum, contribution) => sum + Math.abs(contribution.finalWeightedMagnitude),
            0,
          )
          .toFixed(2),
      );
      const magnitudeAdjustmentDelta = Number(
        (
          summedAbsoluteRawMagnitude - summedAbsoluteAdjustedMagnitude
        ).toFixed(2),
      );
      const magnitudeAdjustmentRatio = Number(
        (
          summedAbsoluteAdjustedMagnitude / Math.max(1, summedAbsoluteRawMagnitude)
        ).toFixed(2),
      );
      const summedAbsoluteContribution = Number(
        contributionsInFamily
          .reduce(
            (sum, contribution) => sum + Math.abs(contribution.contributionScore),
            0,
          )
          .toFixed(2),
      );
      const averageAbsoluteContribution = Number(
        (
          (summedAbsoluteContribution / Math.max(1, contributionsInFamily.length))
        ).toFixed(2),
      );
      const absoluteContributionShare = Number(
        (
          summedAbsoluteContribution / Math.max(1, totalAbsoluteContribution)
        ).toFixed(2),
      );
      const familyAdjustedContributionCount = contributionsInFamily.filter(
        (contribution) => contribution.familyInfluenceSource !== "default",
      ).length;
      const richnessContainedContributionCount = contributionsInFamily.filter(
        (contribution) => contribution.richnessContainmentSource !== "none",
      ).length;
      const contextContainedContributionCount = contributionsInFamily.filter(
        (contribution) => contribution.contextContainmentSource !== "none",
      ).length;

      const topContributingPattern = buildTopContributor(contributionsInFamily);
      const topContributorShareOfFamily = Number(
        (
          (topContributingPattern?.absoluteContribution ?? 0) /
          Math.max(1, summedAbsoluteContribution)
        ).toFixed(2),
      );
      const familyShape = getFamilyShape(
        structuralLevelCounts,
        normalizedRoleCounts,
        patternsInFamily.length,
      );
      const fallbackPolarityCount =
        polaritySourceBreakdown.fallback_mixed;
      const notes = buildFamilyNotes(
        familyShape,
        fallbackPolarityCount,
        richnessContainedContributionCount,
        contextContainedContributionCount,
        patternsInFamily.length,
        topContributingPattern,
        summedAbsoluteContribution,
        absoluteContributionShare,
        magnitudeAdjustmentRatio,
      );

      return {
        family,
        totalPatternCount: patternsInFamily.length,
        structuralLevelCounts,
        normalizedRoleCounts,
        polaritySourceBreakdown,
        explicitPolarityCount: polaritySourceBreakdown.explicit_map,
        fallbackPolarityCount,
        directionalPatternCount,
        nonDirectionalPatternCount,
        familyAdjustedContributionCount,
        richnessContainedContributionCount,
        contextContainedContributionCount,
        summedAbsoluteRawMagnitude,
        summedAbsoluteAdjustedMagnitude,
        magnitudeAdjustmentDelta,
        magnitudeAdjustmentRatio,
        summedAbsoluteContribution,
        averageAbsoluteContribution,
        absoluteContributionShare,
        topContributorShareOfFamily,
        effectiveDirectionalImpact: Number(
          contributionsInFamily
            .reduce((sum, contribution) => sum + contribution.contributionScore, 0)
            .toFixed(2),
        ),
        topContributingPattern,
        familyShape,
        notes,
      };
    })
    .sort((left, right) => {
      const contributionDifference =
        right.summedAbsoluteContribution - left.summedAbsoluteContribution;

      if (contributionDifference !== 0) {
        return contributionDifference;
      }

      return left.family.localeCompare(right.family);
    });

  const dominantFamilies = families
    .filter((family) => family.absoluteContributionShare >= 0.4)
    .map((family) => family.family);
  const suppressedFamilies = families
    .filter((family) => family.magnitudeAdjustmentRatio <= 0.85)
    .map((family) => family.family);
  const overContainedFamilies = families
    .filter((family) => family.notes.includes("adjustment_heavy"))
    .map((family) => family.family);
  const fallbackHeavyFamilyCount = families.filter((family) =>
    family.notes.includes("fallback_heavy"),
  ).length;
  const explicitNonDirectionalFamilyCount = families.filter((family) =>
    family.notes.includes("explicit_non_directional"),
  ).length;
  const highestDominanceScore = families[0]?.absoluteContributionShare ?? 0;
  const dominantFamily = families[0]?.family ?? null;
  const dominanceFlags =
    scoringResult?.trace.summary.dominanceFlags ??
    (highestDominanceScore >= 0.58
      ? ["single_family_dominant"]
      : ["balanced_distribution"]);
  const suppressionSummary = scoringResult?.suppressionSummary ?? {
    familyAdjustedFamilies: families
      .filter((family) => family.familyAdjustedContributionCount > 0)
      .map((family) => family.family),
    richnessContainedFamilies: families
      .filter((family) => family.richnessContainedContributionCount > 0)
      .map((family) => family.family),
    contextContainedFamilies: families
      .filter((family) => family.contextContainedContributionCount > 0)
      .map((family) => family.family),
    dominanceSoftCappedFamilies: [] as string[],
  };

  return {
    totalFamilies: families.length,
    totalPatterns: scoringInput.prioritizedPatterns.length,
    totalAbsoluteContribution,
    dominantFamilies,
    suppressedFamilies,
    overContainedFamilies,
    dominanceSummary: {
      flags: dominanceFlags,
      dominantFamily,
      highestDominanceScore,
      balancedDistribution: dominanceFlags.includes("balanced_distribution"),
    },
    suppressionSummary,
    traceSummary: {
      rawTotalPressure:
        scoringResult?.trace.summary.rawTotalMagnitude ?? totalAbsoluteContribution,
      adjustedTotalPressure:
        scoringResult?.trace.summary.adjustedTotalMagnitude ??
        Number(
          families
            .reduce(
              (sum, family) => sum + family.summedAbsoluteAdjustedMagnitude,
              0,
            )
            .toFixed(2),
        ),
      effectiveDirectionalTotal:
        scoringResult?.trace.summary.effectiveDirectionalTotal ??
        Number(
          contributions
            .reduce((sum, contribution) => sum + contribution.contributionScore, 0)
            .toFixed(2),
        ),
      dominantFamily,
    },
    confidenceIndicators: {
      reliability:
        scoringResult?.trace.summary.confidence ??
        (fallbackHeavyFamilyCount === 0 ? "high" : "moderate"),
      fallbackHeavyFamilyCount,
      explicitNonDirectionalFamilyCount,
      overContainedFamilyCount: overContainedFamilies.length,
    },
    families,
  };
}
