// ROLE:
// This file is the trader-level intelligence engine.
// It aggregates trade feedback into:
// - profile
// - development plan
// - progress tracking
// - intervention evaluation
//
// RULE:
// Do not add new systems here without considering modular extraction.

import type { TradeFeedbackResult } from "../../coaching/types/trade-coaching-types";
import {
  buildProfileAggregation,
} from "./profile-aggregation";
import {
  buildIdentity,
  buildProfileConfidence,
} from "./profile-confidence-and-identity";
import {
  buildDevelopmentPlan,
  buildDevelopmentPriorities,
  buildProfileSummary,
  buildSessionDevelopmentInsights,
} from "./profile-development";
import {
  buildProfileProgress,
} from "./profile-progress";
import { buildProfileInterventions } from "./profile-interventions";
import {
  buildAdaptiveDevelopmentPlan,
  buildInterventionSummary,
} from "./profile-adaptive-development";
import type {
  InterventionPeriodInput,
  TraderBehaviorProfile,
} from "../types/trader-behavior-profile";

export interface BuildTraderBehaviorProfileOptions {
  interventionPeriods?: InterventionPeriodInput[];
}

function buildOrderedFeedbacks(
  tradeFeedbacks: TradeFeedbackResult[],
): TradeFeedbackResult[] {
  return [...tradeFeedbacks].sort(
    (left, right) => left.tradeContext.tradeIndex - right.tradeContext.tradeIndex,
  );
}

function buildTraderBehaviorProfileComputation(
  orderedFeedbacks: TradeFeedbackResult[],
  options?: BuildTraderBehaviorProfileOptions,
) {
  const {
    aggregatedBehaviors,
    behaviorHistory,
    mostFrequentWeaknesses,
    mostDestructiveBehaviors,
    improvingBehaviors,
    emergingStrengths,
    sessionWeaknesses,
    sessionStrengths,
    improvingTrends,
    deterioratingTrends,
  } = buildProfileAggregation(orderedFeedbacks);
  const developmentPriorities = buildDevelopmentPriorities(
    aggregatedBehaviors,
    behaviorHistory,
    orderedFeedbacks.length,
  );
  const confidence = buildProfileConfidence(
    orderedFeedbacks.length,
    aggregatedBehaviors,
    developmentPriorities,
    behaviorHistory,
  );
  const identity = buildIdentity(
    aggregatedBehaviors,
    developmentPriorities,
    confidence.profileConfidence,
  );
  const sessionDevelopmentInsights = buildSessionDevelopmentInsights(
    orderedFeedbacks,
    behaviorHistory,
  );
  const progressData = buildProfileProgress(
    orderedFeedbacks,
    behaviorHistory,
    aggregatedBehaviors,
    developmentPriorities,
    sessionDevelopmentInsights,
  );
  const developmentPlan = buildDevelopmentPlan(
    developmentPriorities,
    improvingBehaviors,
    emergingStrengths,
    sessionDevelopmentInsights,
  );
  const interventionData = buildProfileInterventions(
    orderedFeedbacks,
    behaviorHistory,
    developmentPriorities,
    options?.interventionPeriods ?? [],
  );
  const adaptiveDevelopmentPlan = buildAdaptiveDevelopmentPlan(
    developmentPlan,
    developmentPriorities,
    progressData.priorityEffectivenessSignals,
    progressData.regressionSignals,
    progressData.fadingStrengths,
    interventionData.interventionEvaluations,
    interventionData.currentFocusCycle,
    interventionData.focusMismatchWarnings,
  );
  const interventionSummary = buildInterventionSummary(
    interventionData.currentFocusCycle,
    interventionData.interventionEvaluations,
    interventionData.focusMismatchWarnings,
    adaptiveDevelopmentPlan,
  );
  const profileSummary = buildProfileSummary(
    identity.behaviorIdentity,
    identity.identityConfidence,
    confidence.profileConfidence,
    developmentPlan,
    sessionDevelopmentInsights,
    progressData.progressLabel,
    adaptiveDevelopmentPlan,
  );

  return {
    aggregatedBehaviors,
    mostFrequentWeaknesses,
    mostDestructiveBehaviors,
    improvingBehaviors,
    emergingStrengths,
    sessionWeaknesses,
    sessionStrengths,
    improvingTrends,
    deterioratingTrends,
    developmentPriorities,
    confidence,
    identity,
    sessionDevelopmentInsights,
    progressData,
    developmentPlan,
    interventionData,
    adaptiveDevelopmentPlan,
    interventionSummary,
    profileSummary,
  };
}

// 2026-04-14 America/Toronto:
// Deterministic multi-trade profile builder that converts single-trade
// feedback outputs into trader-level behavior insights.
export function buildTraderBehaviorProfile(
  tradeFeedbacks: TradeFeedbackResult[],
  options?: BuildTraderBehaviorProfileOptions,
): TraderBehaviorProfile {
  const {
    aggregatedBehaviors,
    mostFrequentWeaknesses,
    mostDestructiveBehaviors,
    improvingBehaviors,
    emergingStrengths,
    sessionWeaknesses,
    sessionStrengths,
    improvingTrends,
    deterioratingTrends,
    developmentPriorities,
    confidence,
    identity,
    sessionDevelopmentInsights,
    progressData,
    developmentPlan,
    interventionData,
    adaptiveDevelopmentPlan,
    interventionSummary,
    profileSummary,
  } = buildTraderBehaviorProfileComputation(
    buildOrderedFeedbacks(tradeFeedbacks),
    options,
  );
  const topRecurringMistake = developmentPriorities[0] ?? null;
  const secondRecurringMistake = developmentPriorities[1] ?? null;

  return {
    tradeCount: tradeFeedbacks.length,
    aggregatedBehaviors,
    mostFrequentWeaknesses,
    mostDestructiveBehaviors,
    improvingBehaviors,
    emergingStrengths,
    behaviorIdentity: identity.behaviorIdentity,
    identityConfidence: identity.identityConfidence,
    identityReason: identity.identityReason,
    profileConfidence: confidence.profileConfidence,
    profileConfidenceReason: confidence.profileConfidenceReason,
    profileConfidenceSupport: confidence.profileConfidenceSupport,
    developmentPriorities,
    topRecurringMistake,
    secondRecurringMistake,
    improvementPriorityOrder: developmentPriorities.map((behavior) => behavior.behaviorId),
    developmentPlan,
    sessionWeaknesses,
    sessionStrengths,
    sessionDevelopmentInsights,
    improvingTrends,
    deterioratingTrends,
    destructiveStreaks: progressData.destructiveStreaks,
    improvingStreaks: progressData.improvingStreaks,
    relapseSignals: progressData.relapseSignals,
    stabilizationSignals: progressData.stabilizationSignals,
    analysisWindows: progressData.analysisWindows,
    behaviorProgress: progressData.behaviorProgress,
    progressScore: progressData.progressScore,
    progressLabel: progressData.progressLabel,
    progressReason: progressData.progressReason,
    progressSupport: progressData.progressSupport,
    regressionSignals: progressData.regressionSignals,
    emergingRisks: progressData.emergingRisks,
    fadingStrengths: progressData.fadingStrengths,
    interventionPeriods: interventionData.interventionPeriods,
    interventionEvaluations: interventionData.interventionEvaluations,
    focusCycles: interventionData.focusCycles,
    currentFocusCycle: interventionData.currentFocusCycle,
    focusCycleStatus: interventionData.focusCycleStatus,
    planAdherenceSignals: interventionData.planAdherenceSignals,
    planDriftSignals: interventionData.planDriftSignals,
    focusMismatchWarnings: interventionData.focusMismatchWarnings,
    interventionReadiness: progressData.interventionReadiness,
    priorityEffectivenessSignals: progressData.priorityEffectivenessSignals,
    adaptiveDevelopmentPlan,
    interventionSummary,
    profileSummary,
  };
}
