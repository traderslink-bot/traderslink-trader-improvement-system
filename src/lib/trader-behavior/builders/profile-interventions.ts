import type { TradeFeedbackResult } from "../../coaching/types/trade-coaching-types";
import type {
  DevelopmentPriorityInsight,
  FocusCycle,
  FocusCycleStatus,
  FocusMismatchWarning,
  InterventionEvaluation,
  InterventionPeriod,
  InterventionPeriodInput,
  PlanAdherenceSignal,
  PlanDriftSignal,
  TraderSessionSegment,
} from "../types/trader-behavior-profile";
import type { BehaviorObservation } from "./profile-aggregation";
import {
  buildBehaviorProgressWindow,
  getProgressConfidence,
} from "./profile-progress";

export interface ProfileInterventionResult {
  interventionPeriods: InterventionPeriod[];
  interventionEvaluations: InterventionEvaluation[];
  focusCycles: FocusCycle[];
  currentFocusCycle: FocusCycle | null;
  focusCycleStatus: FocusCycleStatus;
  planAdherenceSignals: PlanAdherenceSignal[];
  planDriftSignals: PlanDriftSignal[];
  focusMismatchWarnings: FocusMismatchWarning[];
}

function roundToTwo(value: number): number {
  return Number(value.toFixed(2));
}

export function resolveInterventionPeriods(
  orderedFeedbacks: TradeFeedbackResult[],
  interventionPeriodInputs: InterventionPeriodInput[],
): InterventionPeriod[] {
  if (interventionPeriodInputs.length === 0) {
    return [];
  }

  const feedbackById = new Map(
    orderedFeedbacks.map((feedback) => [feedback.tradeContext.tradeId, feedback]),
  );
  const feedbackByIndex = new Map(
    orderedFeedbacks.map((feedback) => [feedback.tradeContext.tradeIndex, feedback]),
  );

  return interventionPeriodInputs
    .map((period) => {
      const startFeedback =
        (period.startTradeId ? feedbackById.get(period.startTradeId) : undefined) ??
        (period.startTradeIndex !== undefined
          ? feedbackByIndex.get(period.startTradeIndex)
          : undefined) ??
        orderedFeedbacks[0];

      if (!startFeedback) {
        return null;
      }

      const endFeedback =
        period.endTradeId === null || period.endTradeIndex === null
          ? null
          : (period.endTradeId ? feedbackById.get(period.endTradeId) : undefined) ??
            (period.endTradeIndex !== undefined
              ? feedbackByIndex.get(period.endTradeIndex)
              : undefined) ??
            null;

      return {
        interventionId: period.interventionId,
        targetBehaviorId: period.targetBehaviorId ?? null,
        focusKey:
          period.focusKey ??
          period.targetBehaviorId ??
          `${period.interventionType}:${period.interventionId}`,
        interventionType: period.interventionType,
        goalType: period.goalType,
        startTradeId: startFeedback.tradeContext.tradeId,
        startTradeIndex: startFeedback.tradeContext.tradeIndex,
        endTradeId: endFeedback?.tradeContext.tradeId ?? null,
        endTradeIndex: endFeedback?.tradeContext.tradeIndex ?? null,
        notes: period.notes ?? null,
        metadata: period.metadata ?? null,
      } satisfies InterventionPeriod;
    })
    .filter((period): period is InterventionPeriod => period !== null)
    .sort((left, right) => left.startTradeIndex - right.startTradeIndex);
}

function buildInterventionWindow(
  observations: BehaviorObservation[],
  feedbacks: TradeFeedbackResult[],
  label: "before" | "during" | "after",
): InterventionEvaluation["supportingMetrics"]["before"] {
  return {
    label,
    ...buildBehaviorProgressWindow(
      observations,
      new Set(feedbacks.map((feedback) => feedback.tradeContext.tradeId)),
      feedbacks.length,
    ),
  };
}

function getSessionDistribution(
  observations: BehaviorObservation[],
): Map<TraderSessionSegment, number> {
  const distribution = new Map<TraderSessionSegment, number>();

  for (const observation of observations) {
    distribution.set(
      observation.sessionSegment,
      (distribution.get(observation.sessionSegment) ?? 0) + 1,
    );
  }

  return distribution;
}

function buildInterventionEvaluations(
  interventionPeriods: InterventionPeriod[],
  orderedFeedbacks: TradeFeedbackResult[],
  behaviorHistory: Map<string, BehaviorObservation[]>,
): InterventionEvaluation[] {
  return interventionPeriods.map((period) => {
    const targetBehaviorId = period.targetBehaviorId;
    const targetObservations =
      targetBehaviorId !== null ? behaviorHistory.get(targetBehaviorId) ?? [] : [];
    const periodEndIndex =
      period.endTradeIndex ??
      orderedFeedbacks[orderedFeedbacks.length - 1]?.tradeContext.tradeIndex ??
      0;
    const duringFeedbacks = orderedFeedbacks.filter(
      (feedback) =>
        feedback.tradeContext.tradeIndex >= period.startTradeIndex &&
        feedback.tradeContext.tradeIndex <= periodEndIndex,
    );
    const beforeTradeCount = duringFeedbacks.length;
    const beforeFeedbacks = orderedFeedbacks.filter(
      (feedback) =>
        feedback.tradeContext.tradeIndex < period.startTradeIndex &&
        feedback.tradeContext.tradeIndex >= period.startTradeIndex - beforeTradeCount,
    );
    const endTradeIndex = period.endTradeIndex;
    const afterFeedbacks =
      endTradeIndex === null
        ? []
        : orderedFeedbacks.filter(
            (feedback) =>
              feedback.tradeContext.tradeIndex > endTradeIndex &&
              feedback.tradeContext.tradeIndex <= endTradeIndex + duringFeedbacks.length,
          );
    const beforeWindow = buildInterventionWindow(
      targetObservations,
      beforeFeedbacks,
      "before",
    );
    const duringWindow = buildInterventionWindow(
      targetObservations,
      duringFeedbacks,
      "during",
    );
    const afterWindow =
      afterFeedbacks.length > 0
        ? buildInterventionWindow(targetObservations, afterFeedbacks, "after")
        : null;
    const confidence = getProgressConfidence(beforeWindow, duringWindow);
    const recurrenceStability = roundToTwo(
      Math.min(beforeWindow.frequencyRate, duringWindow.frequencyRate) /
        Math.max(0.01, Math.max(beforeWindow.frequencyRate, duringWindow.frequencyRate)),
    );
    const beforeSessions = getSessionDistribution(
      targetObservations.filter((observation) =>
        beforeFeedbacks.some(
          (feedback) => feedback.tradeContext.tradeId === observation.tradeId,
        ),
      ),
    );
    const duringSessions = getSessionDistribution(
      targetObservations.filter((observation) =>
        duringFeedbacks.some(
          (feedback) => feedback.tradeContext.tradeId === observation.tradeId,
        ),
      ),
    );
    const dominantBeforeSession = Array.from(beforeSessions.entries()).sort(
      (left, right) => right[1] - left[1],
    )[0]?.[0] ?? null;
    const dominantDuringSession = Array.from(duringSessions.entries()).sort(
      (left, right) => right[1] - left[1],
    )[0]?.[0] ?? null;
    const effectivenessScore = roundToTwo(
      (beforeWindow.frequencyRate - duringWindow.frequencyRate) * 3 +
        (beforeWindow.averageSeverityScore - duringWindow.averageSeverityScore) * 1.5 +
        (beforeWindow.primaryRate - duringWindow.primaryRate) * 2 +
        (beforeWindow.destructiveRate - duringWindow.destructiveRate) * 1.4,
    );

    let effectivenessLabel: InterventionEvaluation["effectivenessLabel"] = "flat";
    if (confidence === "low" || duringFeedbacks.length < 2 || beforeFeedbacks.length < 1) {
      effectivenessLabel = "too_early";
    } else if (effectivenessScore >= 1.2) {
      effectivenessLabel = "improved";
    } else if (effectivenessScore <= -1.2) {
      effectivenessLabel = "worsened";
    }

    return {
      interventionId: period.interventionId,
      targetBehaviorId,
      effectivenessLabel,
      effectivenessScore,
      effectivenessReason:
        targetBehaviorId === null
          ? `Intervention ${period.interventionId} did not target a behavior id, so evaluation stays limited.`
          : `${targetBehaviorId} moved from freq ${beforeWindow.frequencyRate.toFixed(2)} to ${duringWindow.frequencyRate.toFixed(2)} and primaryRate ${beforeWindow.primaryRate.toFixed(2)} to ${duringWindow.primaryRate.toFixed(2)} during ${period.interventionId}.`,
      supportingMetrics: {
        before: beforeWindow,
        during: duringWindow,
        after: afterWindow,
        recurrenceStability,
        sessionChange:
          dominantBeforeSession !== dominantDuringSession
            ? `${dominantBeforeSession ?? "none"} -> ${dominantDuringSession ?? "none"}`
            : dominantDuringSession,
      },
      confidence,
    };
  });
}

function buildFocusCycles(
  interventionPeriods: InterventionPeriod[],
  interventionEvaluations: InterventionEvaluation[],
  latestTradeIndex: number,
): {
  focusCycles: FocusCycle[];
  currentFocusCycle: FocusCycle | null;
  focusCycleStatus: FocusCycleStatus;
} {
  const evaluationsById = new Map(
    interventionEvaluations.map((evaluation) => [evaluation.interventionId, evaluation]),
  );

  const focusCycles = interventionPeriods.map((period) => {
    const overlaps = interventionPeriods
      .filter(
        (other) =>
          other.interventionId !== period.interventionId &&
          other.startTradeIndex <= (period.endTradeIndex ?? latestTradeIndex) &&
          (other.endTradeIndex ?? latestTradeIndex) >= period.startTradeIndex,
      )
      .map((other) => other.interventionId);
    const evaluation = evaluationsById.get(period.interventionId);

    let status: FocusCycle["status"] = "active";
    if (overlaps.length > 0) {
      status = "conflicted";
    } else if (period.endTradeIndex !== null && period.endTradeIndex < latestTradeIndex) {
      status =
        evaluation?.effectivenessLabel === "improved" ? "completed" : "abandoned";
    }

    return {
      interventionId: period.interventionId,
      focusKey: period.focusKey,
      targetBehaviorId: period.targetBehaviorId,
      status,
      startTradeId: period.startTradeId,
      endTradeId: period.endTradeId,
      reason:
        status === "conflicted"
          ? `${period.interventionId} overlapped with ${overlaps.join(", ")}.`
          : status === "completed"
            ? `${period.interventionId} ended after measurable improvement.`
            : status === "abandoned"
              ? `${period.interventionId} ended without enough improvement.`
              : `${period.interventionId} remains the active focus cycle.`,
      overlappingInterventionIds: overlaps,
    };
  });

  const currentFocusCycle =
    [...focusCycles]
      .filter((cycle) => cycle.status === "active" || cycle.status === "conflicted")
      .sort((left, right) => {
        const leftPeriod = interventionPeriods.find(
          (period) => period.interventionId === left.interventionId,
        );
        const rightPeriod = interventionPeriods.find(
          (period) => period.interventionId === right.interventionId,
        );

        if ((rightPeriod?.startTradeIndex ?? 0) !== (leftPeriod?.startTradeIndex ?? 0)) {
          return (rightPeriod?.startTradeIndex ?? 0) - (leftPeriod?.startTradeIndex ?? 0);
        }

        return right.interventionId.localeCompare(left.interventionId);
      })[0] ?? null;

  return {
    focusCycles,
    currentFocusCycle,
    focusCycleStatus: {
      activeCount: focusCycles.filter((cycle) => cycle.status === "active").length,
      completedCount: focusCycles.filter((cycle) => cycle.status === "completed").length,
      abandonedCount: focusCycles.filter((cycle) => cycle.status === "abandoned").length,
      conflictedCount: focusCycles.filter((cycle) => cycle.status === "conflicted").length,
    },
  };
}

function buildPlanAlignmentSignals(
  interventionPeriods: InterventionPeriod[],
  interventionEvaluations: InterventionEvaluation[],
  developmentPriorities: DevelopmentPriorityInsight[],
): {
  planAdherenceSignals: PlanAdherenceSignal[];
  planDriftSignals: PlanDriftSignal[];
  focusMismatchWarnings: FocusMismatchWarning[];
} {
  const evaluationById = new Map(
    interventionEvaluations.map((evaluation) => [evaluation.interventionId, evaluation]),
  );
  const currentMainProblem = developmentPriorities[0]?.behaviorId ?? null;

  const planAdherenceSignals = interventionPeriods.map((period) => {
    const evaluation = evaluationById.get(period.interventionId);
    let status: PlanAdherenceSignal["status"] = "aligned";

    if (!evaluation || evaluation.effectivenessLabel === "too_early") {
      status = "too_early";
    } else if (evaluation.effectivenessLabel === "worsened") {
      status = "not_aligned";
    } else if (evaluation.effectivenessLabel === "flat") {
      status = "working_but_unresolved";
    }

    return {
      interventionId: period.interventionId,
      targetBehaviorId: period.targetBehaviorId,
      status,
      reason:
        period.targetBehaviorId === null
          ? `${period.interventionId} does not map to a behavior id, so adherence remains limited.`
          : `${period.targetBehaviorId} is ${status} against the explicit intervention evaluation.`,
    };
  });

  const planDriftSignals = interventionPeriods
    .filter(
      (period) =>
        period.targetBehaviorId !== null &&
        currentMainProblem !== null &&
        currentMainProblem !== period.targetBehaviorId,
    )
    .map((period) => ({
      interventionId: period.interventionId,
      targetBehaviorId: period.targetBehaviorId,
      overtakingBehaviorId: currentMainProblem,
      reason: `${currentMainProblem} has overtaken ${period.targetBehaviorId} as the bigger active issue.`,
    }));

  const focusMismatchWarnings = interventionPeriods
    .filter(
      (period) =>
        period.targetBehaviorId !== null &&
        currentMainProblem !== null &&
        currentMainProblem !== period.targetBehaviorId,
    )
    .map((period) => ({
      interventionId: period.interventionId,
      targetBehaviorId: period.targetBehaviorId,
      currentMainProblem,
      reason: `The active plan focus ${period.targetBehaviorId} no longer matches the current main problem ${currentMainProblem}.`,
    }));

  return {
    planAdherenceSignals,
    planDriftSignals,
    focusMismatchWarnings,
  };
}

export function buildProfileInterventions(
  orderedFeedbacks: TradeFeedbackResult[],
  behaviorHistory: Map<string, BehaviorObservation[]>,
  developmentPriorities: DevelopmentPriorityInsight[],
  interventionPeriodInputs: InterventionPeriodInput[],
): ProfileInterventionResult {
  const interventionPeriods = resolveInterventionPeriods(
    orderedFeedbacks,
    interventionPeriodInputs,
  );
  const interventionEvaluations = buildInterventionEvaluations(
    interventionPeriods,
    orderedFeedbacks,
    behaviorHistory,
  );
  const focusCycleData = buildFocusCycles(
    interventionPeriods,
    interventionEvaluations,
    orderedFeedbacks[orderedFeedbacks.length - 1]?.tradeContext.tradeIndex ?? 0,
  );
  const planAlignment = buildPlanAlignmentSignals(
    interventionPeriods,
    interventionEvaluations,
    developmentPriorities,
  );

  return {
    interventionPeriods,
    interventionEvaluations,
    focusCycles: focusCycleData.focusCycles,
    currentFocusCycle: focusCycleData.currentFocusCycle,
    focusCycleStatus: focusCycleData.focusCycleStatus,
    planAdherenceSignals: planAlignment.planAdherenceSignals,
    planDriftSignals: planAlignment.planDriftSignals,
    focusMismatchWarnings: planAlignment.focusMismatchWarnings,
  };
}
