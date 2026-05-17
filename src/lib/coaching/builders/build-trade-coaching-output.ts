import type { BehaviorAnalysisResult } from "../../behavior-analysis/types/behavior-analysis-types";
import type { PatternScoringResult } from "../../pattern-scoring/types/pattern-scoring-result";
import { COACHING_TEMPLATES } from "../registry/coaching-templates";
import type {
  CoachingEvidenceItem,
  CoachingFocus,
  TradeCoachingOutput,
} from "../types/trade-coaching-types";

function getBehaviorById(
  behaviorAnalysis: BehaviorAnalysisResult,
  behaviorId: string | null,
) {
  if (!behaviorId) {
    return null;
  }

  return (
    behaviorAnalysis.behaviorSignals.find(
      (signal) => signal.behaviorId === behaviorId,
    ) ?? null
  );
}

function getOutputConfidence(
  behaviorConfidence: string,
  scoringConfidence: string,
): "high" | "moderate" | "low" {
  if (behaviorConfidence === "low" || scoringConfidence === "low") {
    return "low";
  }

  if (behaviorConfidence === "moderate" || scoringConfidence === "moderate") {
    return "moderate";
  }

  return "high";
}

function buildEvidence(
  behavior: BehaviorAnalysisResult["behaviorSignals"][number] | null,
): CoachingEvidenceItem[] {
  if (!behavior) {
    return [];
  }

  return behavior.supportingEvidence.slice(0, 3).map((evidence) => ({
    patternId: evidence.patternId,
    family: evidence.family,
    contributionScore: evidence.contributionScore,
  }));
}

function toCoachingFocus(
  behavior: BehaviorAnalysisResult["behaviorSignals"][number] | null,
): CoachingFocus | null {
  if (!behavior) {
    return null;
  }

  return {
    behaviorId: behavior.behaviorId,
    behaviorClass: behavior.behaviorClass,
    classification: behavior.classification,
    priority: behavior.coachingPriority,
    confidence: behavior.confidence,
    priorityScore: behavior.behaviorPriorityScore,
    priorityReason: behavior.priorityReason,
  };
}

export function buildTradeCoachingOutput(
  behaviorAnalysis: BehaviorAnalysisResult,
  scoringResult: PatternScoringResult,
): TradeCoachingOutput {
  const mostImportantMistake = getBehaviorById(
    behaviorAnalysis,
    behaviorAnalysis.summary.mostImportantMistakeId,
  );
  const mostImportantStrength = getBehaviorById(
    behaviorAnalysis,
    behaviorAnalysis.summary.mostImportantStrengthId,
  );
  const primaryDirectiveBehavior = mostImportantMistake;
  const nextDirectiveBehavior =
    behaviorAnalysis.behaviorSignals.find(
      (signal) =>
        signal.behaviorId !== primaryDirectiveBehavior?.behaviorId &&
        ["destructive_mistake", "costly_mistake"].includes(signal.behaviorClass) &&
        !behaviorAnalysis.summary.suppressedBehaviorIds.includes(signal.behaviorId),
    ) ?? null;
  const template =
    COACHING_TEMPLATES[primaryDirectiveBehavior?.behaviorId ?? ""] ?? null;
  const confidence = getOutputConfidence(
    behaviorAnalysis.summary.confidence,
    scoringResult.summary.confidence,
  );
  const fallbackTemplate =
    COACHING_TEMPLATES[mostImportantStrength?.behaviorId ?? ""] ?? null;

  return {
    headline:
      template?.headline ??
      fallbackTemplate?.headline ??
      "The trade did not produce a strong enough destructive behavior signal for a fix-first directive.",
    coreIssue:
      template?.coreIssue ??
      fallbackTemplate?.coreIssue ??
      "Behavior evidence was too mixed to elevate one destructive issue above the rest.",
    supportingEvidence: buildEvidence(primaryDirectiveBehavior ?? mostImportantStrength),
    whatWentWrongOrRight:
      template?.whatWentWrongOrRight ??
      fallbackTemplate?.whatWentWrongOrRight ??
      "The current scoring and behavior trace stayed too balanced to support a stronger trade-level correction.",
    whatToChangeNextTime:
      template?.whatToChangeNextTime ??
      fallbackTemplate?.whatToChangeNextTime ??
      "Collect more trade examples before turning this pattern into a fixed coaching directive.",
    confidence,
    fixFirst: toCoachingFocus(primaryDirectiveBehavior),
    fixNext: toCoachingFocus(nextDirectiveBehavior),
    suppressedBehaviorIds: behaviorAnalysis.summary.suppressedBehaviorIds,
    resolvedBehaviorNarrative: behaviorAnalysis.resolvedBehaviorNarrative,
    conflictResolutionReason: behaviorAnalysis.conflictResolutionReason,
    mostImportantMistake,
    mostImportantStrength,
    alignment: {
      dominantBehaviorIds: behaviorAnalysis.summary.dominantBehaviorIds,
      dominantFamily: scoringResult.summary.dominantFamily,
      scoreBand: scoringResult.scoreBand,
    },
  };
}
