// =========================
// ROLE: BEHAVIOR ENGINE
// =========================
//
// Converts scoring truth into behavior signals.
//
// Responsibilities:
// - Extract behavior signals from scoring contributions
// - Classify behavior (mistake vs edge)
// - Apply prioritization logic
// - Resolve conflicts between behaviors
// - Generate identity candidates
//
// IMPORTANT:
// - This file is a core engine layer
// - Do not add unrelated logic here
// - Keep registry ownership in the registry and tuning values in constants
// - Prefer extracting subsystems if this grows further
//

import type { PatternScoringInput } from "../../pattern-scoring/types/pattern-scoring-input";
import type {
  PatternScoreContribution,
  PatternScoringConfidence,
  PatternScoringResult,
} from "../../pattern-scoring/types/pattern-scoring-result";
import {
  BEHAVIOR_DEFINITIONS,
  type BehaviorDefinition,
} from "../registry/behavior-definitions";
import {
  BEHAVIOR_SEVERITY_THRESHOLDS,
  BEHAVIOR_SEVERITY_WEIGHTS,
  CLASS_BIAS_BY_BEHAVIOR_CLASS,
  CONFLICT_PENALTY_WEIGHTS,
  DESTRUCTIVE_CLASS_THRESHOLDS,
  OUTCOME_IMPACT_WEIGHTS,
  OUTCOME_SENSITIVE_FAMILIES,
  POSITIVE_CLASS_THRESHOLDS,
  PRIORITY_SCORE_WEIGHTS,
  SECONDARY_SIGNAL_THRESHOLDS,
  SIGNAL_STRENGTH_WEIGHTS,
  STRUCTURAL_CORRECTNESS_THRESHOLDS,
} from "../registry/behavior-analysis-constants";
import type {
  BehaviorAnalysisResult,
  BehaviorClass,
  BehaviorConsistency,
  BehaviorEvidenceItem,
  BehaviorFrequencyBucket,
  BehaviorIdentityCategory,
  BehaviorIdentityCandidate,
  BehaviorSeverity,
  BehaviorSignal,
  BehaviorStructuralCorrectness,
} from "../types/behavior-analysis-types";

function toEvidenceItem(
  contribution: PatternScoreContribution,
  patternType: string,
): BehaviorEvidenceItem {
  return {
    patternId: contribution.patternId,
    family: contribution.family,
    patternType,
    contributionScore: contribution.contributionScore,
    finalWeightedMagnitude: contribution.finalWeightedMagnitude,
    polaritySource: contribution.polaritySource,
    normalizedRole: contribution.normalizedRole,
    structuralLevel: contribution.structuralLevel,
    familyInfluenceMultiplier: contribution.familyInfluenceMultiplier,
    isPrimaryFamilyAnchor: contribution.isPrimaryFamilyAnchor,
  };
}

function getBehaviorSeverity(strength: number): BehaviorSeverity {
  if (strength >= BEHAVIOR_SEVERITY_THRESHOLDS.high) {
    return "high";
  }

  if (strength >= BEHAVIOR_SEVERITY_THRESHOLDS.moderate) {
    return "moderate";
  }

  return "low";
}

function getSeverityWeight(severity: BehaviorSeverity): number {
  return BEHAVIOR_SEVERITY_WEIGHTS[severity];
}

function getBehaviorConsistency(
  evidenceCount: number,
  supportingPatternIds: string[],
): BehaviorConsistency {
  const repeatedPattern = supportingPatternIds.some((patternId) =>
    patternId.includes("repeated"),
  );

  if (repeatedPattern || evidenceCount >= 3) {
    return "repeated";
  }

  if (evidenceCount >= 2) {
    return "reinforced";
  }

  return "isolated";
}

function getFrequencyBucket(
  consistency: BehaviorConsistency,
): BehaviorFrequencyBucket {
  switch (consistency) {
    case "repeated":
      return "single_trade_repeated";
    case "reinforced":
      return "single_trade_clustered";
    case "isolated":
    default:
      return "single_trade_isolated";
  }
}

function getReliability(
  explicitEvidenceCount: number,
  fallbackEvidenceCount: number,
  evidenceCount: number,
): PatternScoringConfidence {
  if (fallbackEvidenceCount === 0 && explicitEvidenceCount >= 1 && evidenceCount >= 2) {
    return "high";
  }

  if (fallbackEvidenceCount <= 1 && explicitEvidenceCount >= 1) {
    return "moderate";
  }

  return "low";
}

function getSignalConfidence(
  scoringConfidence: PatternScoringConfidence,
  reliability: PatternScoringConfidence,
): PatternScoringConfidence {
  if (scoringConfidence === "low" || reliability === "low") {
    return "low";
  }

  if (scoringConfidence === "moderate" || reliability === "moderate") {
    return "moderate";
  }

  return "high";
}

function getStructuralCorrectness(
  positiveEvidenceCount: number,
  negativeEvidenceCount: number,
  signedImpact: number,
): BehaviorStructuralCorrectness {
  if (positiveEvidenceCount > 0 && negativeEvidenceCount === 0) {
    return "correct";
  }

  if (negativeEvidenceCount > 0 && positiveEvidenceCount === 0) {
    return "incorrect";
  }

  if (signedImpact > STRUCTURAL_CORRECTNESS_THRESHOLDS.correctSignedImpactFloor) {
    return "correct";
  }

  if (
    signedImpact < STRUCTURAL_CORRECTNESS_THRESHOLDS.incorrectSignedImpactCeiling
  ) {
    return "incorrect";
  }

  return "mixed";
}

function getOutcomeImpactScore(
  evidenceContributions: PatternScoreContribution[],
  signedImpact: number,
): number {
  const outcomeLinkedEvidenceCount = evidenceContributions.filter(
    (contribution) =>
      contribution.structuralLevel === "storyline_composite" ||
      OUTCOME_SENSITIVE_FAMILIES.has(contribution.family) ||
      contribution.patternId.includes("final_exit") ||
      contribution.patternId.includes("profit_protection") ||
      contribution.patternId.includes("giveback"),
  ).length;

  return Number(
    Math.min(
      OUTCOME_IMPACT_WEIGHTS.maxScore,
      outcomeLinkedEvidenceCount *
        OUTCOME_IMPACT_WEIGHTS.storylineOrOutcomeLinkedEvidence +
        Math.abs(signedImpact) * OUTCOME_IMPACT_WEIGHTS.signedImpact,
    ).toFixed(2),
  );
}

function getBehaviorClass(
  signedImpact: number,
  outcomeImpactScore: number,
  structuralCorrectness: BehaviorStructuralCorrectness,
): BehaviorClass {
  if (
    structuralCorrectness === "incorrect" &&
    signedImpact <= DESTRUCTIVE_CLASS_THRESHOLDS.signedImpactCeiling &&
    outcomeImpactScore >= DESTRUCTIVE_CLASS_THRESHOLDS.outcomeImpactFloor
  ) {
    return "destructive_mistake";
  }

  if (
    structuralCorrectness === "incorrect" &&
    signedImpact < DESTRUCTIVE_CLASS_THRESHOLDS.costlyMistakeSignedImpactCeiling
  ) {
    return "costly_mistake";
  }

  if (
    structuralCorrectness === "correct" &&
    signedImpact >= POSITIVE_CLASS_THRESHOLDS.edgeSignedImpactFloor &&
    outcomeImpactScore >= POSITIVE_CLASS_THRESHOLDS.edgeOutcomeImpactFloor
  ) {
    return "edge";
  }

  if (
    structuralCorrectness === "correct" &&
    signedImpact > POSITIVE_CLASS_THRESHOLDS.improvingSignedImpactFloor
  ) {
    return "improving";
  }

  return "neutral";
}

function getClassBias(behaviorClass: BehaviorClass): number {
  return CLASS_BIAS_BY_BEHAVIOR_CLASS[behaviorClass];
}

function getIdentityCategory(
  behaviorClass: BehaviorClass,
  consistency: BehaviorConsistency,
  reliability: PatternScoringConfidence,
): BehaviorIdentityCategory {
  if (
    behaviorClass === "destructive_mistake" &&
    consistency !== "isolated"
  ) {
    return "recurring_weakness_candidate";
  }

  if (
    behaviorClass === "destructive_mistake" ||
    behaviorClass === "costly_mistake"
  ) {
    return "destructive_pattern";
  }

  if (
    (behaviorClass === "edge" || behaviorClass === "improving") &&
    (consistency !== "isolated" || reliability === "high")
  ) {
    return "identity_signal";
  }

  return "improving_strength";
}

function getIdentityWeight(
  priorityScore: number,
  severity: BehaviorSeverity,
  reliability: PatternScoringConfidence,
): number {
  const severityMultiplier =
    severity === "high" ? 1.2 : severity === "moderate" ? 1 : 0.8;
  const reliabilityMultiplier =
    reliability === "high" ? 1.05 : reliability === "moderate" ? 0.95 : 0.8;

  return Number((priorityScore * severityMultiplier * reliabilityMultiplier).toFixed(2));
}

function getFamilyInfluenceStrength(
  evidenceContributions: PatternScoreContribution[],
): number {
  if (evidenceContributions.length === 0) {
    return 1;
  }

  return Number(
    (
      evidenceContributions.reduce(
        (sum, contribution) => sum + contribution.familyInfluenceMultiplier,
        0,
      ) / evidenceContributions.length
    ).toFixed(2),
  );
}

function buildPriorityReason(
  severity: BehaviorSeverity,
  contributionStrength: number,
  familyInfluenceStrength: number,
  outcomeImpactScore: number,
  conflictPenalty: number,
): string {
  const reasons = [
    `severity=${severity}`,
    `traceImpact=${contributionStrength.toFixed(2)}`,
    `familyInfluence=${familyInfluenceStrength.toFixed(2)}`,
    `outcomeImpact=${outcomeImpactScore.toFixed(2)}`,
  ];

  if (conflictPenalty > 0) {
    reasons.push(`conflictPenalty=${conflictPenalty.toFixed(2)}`);
  }

  return reasons.join(", ");
}

function getBasePriorityScore(
  signalStrength: number,
  severity: BehaviorSeverity,
  familyInfluenceStrength: number,
  outcomeImpactScore: number,
  behaviorClass: BehaviorClass,
): number {
  return Number(
    (
      signalStrength * PRIORITY_SCORE_WEIGHTS.signalStrength +
      getSeverityWeight(severity) +
      (familyInfluenceStrength - 1) * PRIORITY_SCORE_WEIGHTS.familyInfluenceDelta +
      outcomeImpactScore +
      getClassBias(behaviorClass)
    ).toFixed(2),
  );
}

function sortSignalsByPriority(signals: BehaviorSignal[]): BehaviorSignal[] {
  return [...signals].sort((left, right) => {
    const priorityDifference =
      right.behaviorPriorityScore - left.behaviorPriorityScore;

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    const impactDifference = right.contributionStrength - left.contributionStrength;

    if (impactDifference !== 0) {
      return impactDifference;
    }

    return left.behaviorId.localeCompare(right.behaviorId);
  });
}

function buildConflictMap(signals: BehaviorSignal[]): Map<string, BehaviorSignal[]> {
  const conflictsById = new Map(
    BEHAVIOR_DEFINITIONS.map((definition) => [
      definition.id,
      definition.conflictsWith ?? [],
    ]),
  );
  const signalMap = new Map(signals.map((signal) => [signal.behaviorId, signal]));

  return new Map(
    signals.map((signal) => [
      signal.behaviorId,
      (conflictsById.get(signal.behaviorId) ?? [])
        .map((behaviorId) => signalMap.get(behaviorId))
        .filter((candidate): candidate is BehaviorSignal => candidate !== undefined),
    ]),
  );
}

function applyPriorityAndIdentity(
  signals: BehaviorSignal[],
): {
  prioritizedSignals: BehaviorSignal[];
  identityCandidates: BehaviorIdentityCandidate[];
} {
  const conflictMap = buildConflictMap(signals);
  const basePriorityById = new Map(
    signals.map((signal) => [signal.behaviorId, signal.behaviorPriorityScore]),
  );

  const finalizedSignals = signals.map((signal) => {
    const strongerOpponents = (conflictMap.get(signal.behaviorId) ?? []).filter(
      (opponent) =>
        (basePriorityById.get(opponent.behaviorId) ?? 0) >
        signal.behaviorPriorityScore,
    );
    const conflictPenalty = Number(
      Math.min(
        CONFLICT_PENALTY_WEIGHTS.maxPenalty,
        strongerOpponents.reduce(
          (sum, opponent) =>
            sum +
            Math.max(
              CONFLICT_PENALTY_WEIGHTS.minimumPenaltyPerStrongerOpponent,
              ((basePriorityById.get(opponent.behaviorId) ?? 0) -
                signal.behaviorPriorityScore) *
                CONFLICT_PENALTY_WEIGHTS.strengthGapMultiplier,
            ),
          0,
        ),
      ).toFixed(2),
    );
    const finalPriority = Number(
      Math.max(0, signal.behaviorPriorityScore - conflictPenalty).toFixed(2),
    );
    const identityCategory = getIdentityCategory(
      signal.behaviorClass,
      signal.consistency,
      signal.reliability,
    );
    const identityWeight = getIdentityWeight(
      finalPriority,
      signal.severity,
      signal.reliability,
    );

    return {
      ...signal,
      behaviorPriorityScore: finalPriority,
      priorityReason: buildPriorityReason(
        signal.severity,
        signal.contributionStrength,
        signal.familyInfluenceStrength,
        signal.outcomeImpactScore,
        conflictPenalty,
      ),
      conflictPenalty,
      conflictedByBehaviorIds: strongerOpponents.map(
        (opponent) => opponent.behaviorId,
      ),
      conflictResolutionReason:
        strongerOpponents.length > 0
          ? `${strongerOpponents[0].behaviorId} carried stronger trade-shaping evidence and reduced this behavior's priority.`
          : null,
      identityCategory,
      identityWeight,
    };
  });

  const prioritizedSignals = sortSignalsByPriority(finalizedSignals);
  const identityCandidates = prioritizedSignals.map((signal) => ({
    behaviorId: signal.behaviorId,
    identityCategory: signal.identityCategory,
    identityWeight: signal.identityWeight,
    reason: `${signal.behaviorClass} with ${signal.consistency} evidence and ${signal.reliability} reliability.`,
  }));

  return {
    prioritizedSignals,
    identityCandidates,
  };
}

function getResolvedBehaviorNarrative(
  primaryBehavior: BehaviorSignal | null,
  conflictingBehaviors: BehaviorSignal[],
): { resolvedBehaviorNarrative: string; conflictResolutionReason: string | null } {
  if (!primaryBehavior && conflictingBehaviors.length === 0) {
    return {
      resolvedBehaviorNarrative:
        "No clear behavior identity outranked the rest of the trade evidence.",
      conflictResolutionReason: null,
    };
  }

  if (primaryBehavior && conflictingBehaviors.length === 0) {
    return {
      resolvedBehaviorNarrative: `${primaryBehavior.label} was the clearest behavior truth once trace impact, outcome interaction, and structural correctness were weighed together.`,
      conflictResolutionReason: null,
    };
  }

  const topConflict = conflictingBehaviors
    .slice()
    .sort(
      (left, right) => right.behaviorPriorityScore - left.behaviorPriorityScore,
    )[0];

  return {
    resolvedBehaviorNarrative: `${primaryBehavior?.label ?? "The leading behavior"} remained the dominant interpretation after conflict resolution reduced weaker contradictory signals.`,
    conflictResolutionReason: topConflict
      ? `${topConflict.behaviorId} conflicted with a stronger behavior signal, so its priority was reduced instead of sharing the main interpretation.`
      : null,
  };
}

function buildSignalFromDefinition(
  definition: BehaviorDefinition,
  scoringInput: PatternScoringInput,
  scoringResult: PatternScoringResult,
): BehaviorSignal | null {
  const patternsById = new Map(
    scoringInput.normalizedPatternResult.prioritizedPatterns.map((pattern) => [
      pattern.patternId,
      pattern,
    ]),
  );
  const evidenceContributions = scoringResult.trace.orderedContributions.filter(
    (contribution) => definition.patternIds.includes(contribution.patternId),
  );

  if (evidenceContributions.length === 0) {
    return null;
  }

  const supportingEvidence = evidenceContributions.map((contribution) =>
    toEvidenceItem(
      contribution,
      patternsById.get(contribution.patternId)?.patternType ??
        contribution.structuralLevel,
    ),
  );
  const contributionStrength = Number(
    evidenceContributions
      .reduce((sum, contribution) => sum + Math.abs(contribution.contributionScore), 0)
      .toFixed(2),
  );
  const signedImpact = Number(
    evidenceContributions
      .reduce((sum, contribution) => sum + contribution.contributionScore, 0)
      .toFixed(2),
  );
  const directionalEvidence = evidenceContributions.filter(
    (contribution) => contribution.polarity !== "mixed",
  );
  const positiveEvidenceCount = evidenceContributions.filter(
    (contribution) => contribution.polarity === "positive",
  ).length;
  const negativeEvidenceCount = evidenceContributions.filter(
    (contribution) => contribution.polarity === "negative",
  ).length;
  const explicitEvidenceCount = evidenceContributions.filter(
    (contribution) =>
      contribution.polaritySource === "explicit_map" &&
      contribution.polarity !== "mixed",
  ).length;
  const fallbackEvidenceCount =
    evidenceContributions.length - explicitEvidenceCount;
  const primaryEvidenceCount = evidenceContributions.filter(
    (contribution) =>
      contribution.normalizedRole === "primary_candidate" &&
      contribution.polarity !== "mixed",
  ).length;

  if (directionalEvidence.length === 0 && contributionStrength === 0) {
    return null;
  }

  const signalStrength = Number(
    (
      contributionStrength +
      primaryEvidenceCount * SIGNAL_STRENGTH_WEIGHTS.primaryEvidence +
      explicitEvidenceCount * SIGNAL_STRENGTH_WEIGHTS.explicitEvidence
    ).toFixed(2),
  );
  const consistency = getBehaviorConsistency(
    evidenceContributions.length,
    evidenceContributions.map((contribution) => contribution.patternId),
  );
  const severity = getBehaviorSeverity(signalStrength);
  const frequencyBucket = getFrequencyBucket(consistency);
  const reliability = getReliability(
    explicitEvidenceCount,
    fallbackEvidenceCount,
    evidenceContributions.length,
  );
  const confidence = getSignalConfidence(
    scoringResult.summary.confidence,
    reliability,
  );
  const primaryDriver = evidenceContributions[0] ?? null;
  const traceFamilyDrivers = Array.from(
    new Set(evidenceContributions.map((contribution) => contribution.family)),
  ).sort((left, right) => left.localeCompare(right));
  const structuralCorrectness = getStructuralCorrectness(
    positiveEvidenceCount,
    negativeEvidenceCount,
    signedImpact,
  );
  const outcomeImpactScore = getOutcomeImpactScore(
    evidenceContributions,
    signedImpact,
  );
  const familyInfluenceStrength = getFamilyInfluenceStrength(
    evidenceContributions,
  );
  const behaviorClass = getBehaviorClass(
    signedImpact,
    outcomeImpactScore,
    structuralCorrectness,
  );
  const basePriorityScore = getBasePriorityScore(
    signalStrength,
    severity,
    familyInfluenceStrength,
    outcomeImpactScore,
    behaviorClass,
  );

  return {
    behaviorId: definition.id,
    label: definition.label,
    behaviorCategory: definition.behaviorCategory,
    classification: definition.classification,
    behaviorClass,
    confidence,
    reliability,
    severity,
    consistency,
    frequencyBucket,
    signalStrength,
    contributionStrength,
    signedImpact,
    outcomeImpactScore,
    familyInfluenceStrength,
    structuralCorrectness,
    supportingEvidence,
    supportingPatternIds: supportingEvidence.map((evidence) => evidence.patternId),
    supportingFamilies: Array.from(
      new Set(supportingEvidence.map((evidence) => evidence.family)),
    ).sort((left, right) => left.localeCompare(right)),
    primaryDriverPatternId: primaryDriver?.patternId ?? null,
    primaryDriverFamily: primaryDriver?.family ?? null,
    traceFamilyDrivers,
    fallbackEvidenceCount,
    explicitEvidenceCount,
    trackingTag: {
      behaviorCategory: definition.behaviorCategory,
      severity,
      frequencyBucket,
    },
    coachingPriority: definition.coachingPriority,
    behaviorPriorityScore: basePriorityScore,
    priorityReason: buildPriorityReason(
      severity,
      contributionStrength,
      familyInfluenceStrength,
      outcomeImpactScore,
      0,
    ),
    conflictPenalty: 0,
    conflictedByBehaviorIds: [],
    conflictResolutionReason: null,
    identityCategory: "improving_strength",
    identityWeight: 0,
  };
}

export function buildBehaviorAnalysis(
  scoringInput: PatternScoringInput,
  scoringResult: PatternScoringResult,
): BehaviorAnalysisResult {
  const rawSignals = BEHAVIOR_DEFINITIONS
    .map((definition) =>
      buildSignalFromDefinition(definition, scoringInput, scoringResult),
    )
    .filter((signal): signal is BehaviorSignal => signal !== null);
  const { prioritizedSignals, identityCandidates } =
    applyPriorityAndIdentity(rawSignals);
  const primaryBehavior = prioritizedSignals[0] ?? null;
  const secondaryBehaviors = prioritizedSignals.filter(
    (signal, index) =>
      index > 0 &&
      signal.behaviorPriorityScore >=
        Math.max(
          SECONDARY_SIGNAL_THRESHOLDS.absoluteFloor,
          (primaryBehavior?.behaviorPriorityScore ?? 0) *
            SECONDARY_SIGNAL_THRESHOLDS.primaryShare,
        ),
  );
  const suppressedBehaviors = prioritizedSignals.filter(
    (signal) =>
      signal !== primaryBehavior &&
      !secondaryBehaviors.includes(signal),
  );
  const dominantBehaviors = primaryBehavior ? [primaryBehavior] : [];
  const conflictingBehaviors = prioritizedSignals.filter(
    (signal) => signal.conflictedByBehaviorIds.length > 0,
  );
  const mistakeBehaviors = prioritizedSignals.filter((signal) =>
    ["destructive_mistake", "costly_mistake"].includes(signal.behaviorClass),
  );
  const strengthBehaviors = prioritizedSignals.filter((signal) =>
    ["improving", "edge"].includes(signal.behaviorClass),
  );
  const conflictNarrative = getResolvedBehaviorNarrative(
    primaryBehavior,
    conflictingBehaviors,
  );

  return {
    behaviorSignals: prioritizedSignals,
    dominantBehaviors,
    secondaryBehaviors,
    suppressedBehaviors,
    conflictingBehaviors,
    primaryBehavior,
    behaviorIdentityCandidates: identityCandidates,
    resolvedBehaviorNarrative: conflictNarrative.resolvedBehaviorNarrative,
    conflictResolutionReason: conflictNarrative.conflictResolutionReason,
    summary: {
      dominantBehaviorIds: dominantBehaviors.map((signal) => signal.behaviorId),
      secondaryBehaviorIds: secondaryBehaviors.map((signal) => signal.behaviorId),
      conflictingBehaviorIds: conflictingBehaviors.map(
        (signal) => signal.behaviorId,
      ),
      suppressedBehaviorIds: suppressedBehaviors.map((signal) => signal.behaviorId),
      mostImportantMistakeId: mistakeBehaviors[0]?.behaviorId ?? null,
      mostImportantStrengthId: strengthBehaviors[0]?.behaviorId ?? null,
      dominantBehaviorDriverFamilies: Array.from(
        new Set(
          dominantBehaviors.flatMap((signal) => signal.traceFamilyDrivers),
        ),
      ).sort((left, right) => left.localeCompare(right)),
      confidence:
        prioritizedSignals[0]?.confidence ?? scoringResult.summary.confidence,
      primaryBehavior,
      resolvedBehaviorNarrative: conflictNarrative.resolvedBehaviorNarrative,
      conflictResolutionReason: conflictNarrative.conflictResolutionReason,
    },
  };
}
