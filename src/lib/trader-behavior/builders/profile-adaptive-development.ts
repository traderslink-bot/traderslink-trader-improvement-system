import type {
  AdaptiveDevelopmentPlan,
  DevelopmentPlan,
  DevelopmentPriorityInsight,
  FadingStrengthInsight,
  FocusCycle,
  FocusMismatchWarning,
  InterventionEvaluation,
  InterventionSummary,
  PriorityEffectivenessSignal,
  RegressionSignal,
} from "../types/trader-behavior-profile";

export function buildAdaptiveDevelopmentPlan(
  developmentPlan: DevelopmentPlan,
  developmentPriorities: DevelopmentPriorityInsight[],
  priorityEffectivenessSignals: PriorityEffectivenessSignal[],
  regressionSignals: RegressionSignal[],
  fadingStrengths: FadingStrengthInsight[],
  interventionEvaluations: InterventionEvaluation[],
  currentFocusCycle: FocusCycle | null,
  focusMismatchWarnings: FocusMismatchWarning[],
): AdaptiveDevelopmentPlan {
  const worseningSet = new Set(
    priorityEffectivenessSignals
      .filter((signal) => signal.status === "worsening")
      .map((signal) => signal.behaviorId),
  );
  const improvingSet = new Set(
    priorityEffectivenessSignals
      .filter((signal) => signal.status === "improving")
      .map((signal) => signal.behaviorId),
  );
  const escalatingRisks = regressionSignals
    .filter((signal) => signal.type !== "edge_fading")
    .map((signal) => signal.behaviorId)
    .filter((value, index, array) => array.indexOf(value) === index);
  const deEscalatedFocuses = priorityEffectivenessSignals
    .filter((signal) => signal.status === "improving")
    .map((signal) => signal.behaviorId);
  const fallbackFocus =
    developmentPlan.fixFirst?.behaviorId && !improvingSet.has(developmentPlan.fixFirst.behaviorId)
      ? developmentPlan.fixFirst.behaviorId
      : developmentPriorities.find(
          (priority) => !improvingSet.has(priority.behaviorId),
        )?.behaviorId ?? null;
  const currentFocus = currentFocusCycle?.targetBehaviorId ?? fallbackFocus;
  const currentInterventionRecommendation =
    currentFocusCycle?.focusKey ?? currentFocus ?? null;
  const latestEvaluation =
    interventionEvaluations[interventionEvaluations.length - 1] ?? null;
  const currentEvaluation = currentFocusCycle
    ? interventionEvaluations.find(
        (evaluation) => evaluation.interventionId === currentFocusCycle.interventionId,
      ) ?? latestEvaluation
    : latestEvaluation;
  const mismatchForCurrentFocus = focusMismatchWarnings.find(
    (warning) => warning.targetBehaviorId === currentFocus,
  );
  const nextFocus =
    mismatchForCurrentFocus?.currentMainProblem ??
    escalatingRisks.find((behaviorId) => behaviorId !== currentFocus) ??
    developmentPriorities.find(
      (priority) =>
        priority.behaviorId !== currentFocus && !deEscalatedFocuses.includes(priority.behaviorId),
    )?.behaviorId ??
    null;
  const tooEarlyToJudge = currentEvaluation?.effectivenessLabel === "too_early";
  const shouldContinueFocus =
    currentFocusCycle !== null &&
    currentFocus !== null &&
    mismatchForCurrentFocus === undefined &&
    (currentEvaluation?.effectivenessLabel === "improved" ||
      currentEvaluation?.effectivenessLabel === "too_early");
  const shouldRotateFocus =
    !shouldContinueFocus &&
    (nextFocus !== null ||
      mismatchForCurrentFocus !== undefined ||
      currentEvaluation?.effectivenessLabel === "worsened" ||
      currentEvaluation?.effectivenessLabel === "flat");
  const rotationReason = tooEarlyToJudge
    ? "Too early to rotate focus because the current intervention does not have enough trade evidence yet."
    : shouldRotateFocus
      ? focusMismatchWarnings[0]?.reason ??
        (currentEvaluation?.effectivenessLabel === "worsened"
          ? `${currentFocus} is worsening during the active intervention period.`
          : nextFocus
            ? `${nextFocus} has become the stronger candidate for rotation.`
            : null)
      : null;

  return {
    currentFocus,
    nextFocus,
    deEscalatedFocuses,
    escalatingRisks: escalatingRisks.filter((behaviorId) => worseningSet.has(behaviorId)),
    protectionPriorities: fadingStrengths.map((item) => item.behaviorId),
    currentInterventionRecommendation,
    shouldContinueFocus,
    shouldRotateFocus,
    rotationReason,
    tooEarlyToJudge,
    adaptiveReason:
      `${currentFocus ? `${currentFocus} remains or becomes the main focus` : "No single issue remains dominant"}, ` +
      `${nextFocus ? `${nextFocus} is the next pressure point` : "no second issue is clearly escalating"}, ` +
      `${deEscalatedFocuses.length > 0 ? `${deEscalatedFocuses.join(", ")} de-escalated after improvement` : "no focus was clearly ready to de-escalate"}.`,
  };
}

export function buildInterventionSummary(
  currentFocusCycle: FocusCycle | null,
  interventionEvaluations: InterventionEvaluation[],
  focusMismatchWarnings: FocusMismatchWarning[],
  adaptiveDevelopmentPlan: AdaptiveDevelopmentPlan,
): InterventionSummary {
  const currentEvaluation = currentFocusCycle
    ? interventionEvaluations.find(
        (evaluation) => evaluation.interventionId === currentFocusCycle.interventionId,
      )
    : null;

  return {
    activeFocus: currentFocusCycle?.focusKey ?? null,
    focusEffectiveness: currentEvaluation?.effectivenessLabel ?? null,
    biggestMismatch:
      focusMismatchWarnings[0]?.currentMainProblem ??
      focusMismatchWarnings[0]?.targetBehaviorId ??
      null,
    nextRecommendedAction: adaptiveDevelopmentPlan.shouldRotateFocus
      ? adaptiveDevelopmentPlan.nextFocus
      : adaptiveDevelopmentPlan.currentFocus,
    summaryReason:
      currentFocusCycle === null
        ? "No explicit intervention period is currently active."
        : `${currentFocusCycle.focusKey} is ${currentEvaluation?.effectivenessLabel ?? "not yet judged"}, and the adaptive plan recommends ${adaptiveDevelopmentPlan.shouldRotateFocus ? "rotation" : "continuation"}.`,
  };
}
