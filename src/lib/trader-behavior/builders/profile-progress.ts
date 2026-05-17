import type { BehaviorClass } from "../../behavior-analysis/types/behavior-analysis-types";
import type { TradeFeedbackResult } from "../../coaching/types/trade-coaching-types";
import type {
  AggregatedBehaviorStats,
  AnalysisWindowSummary,
  AnalysisWindows,
  BehaviorProgressInsight,
  BehaviorProgressWindow,
  BehaviorStreakInsight,
  DevelopmentPriorityInsight,
  EmergingRiskInsight,
  FadingStrengthInsight,
  InterventionReadiness,
  PriorityEffectivenessSignal,
  RegressionSignal,
  RelapseSignal,
  SessionDevelopmentInsight,
  StabilizationSignal,
  TraderProfileConfidence,
  TraderProgressSupport,
} from "../types/trader-behavior-profile";
import type { BehaviorObservation } from "./profile-aggregation";

export interface ProfileProgressResult {
  analysisWindows: AnalysisWindows;
  behaviorProgress: BehaviorProgressInsight[];
  destructiveStreaks: BehaviorStreakInsight[];
  improvingStreaks: BehaviorStreakInsight[];
  relapseSignals: RelapseSignal[];
  stabilizationSignals: StabilizationSignal[];
  regressionSignals: RegressionSignal[];
  emergingRisks: EmergingRiskInsight[];
  fadingStrengths: FadingStrengthInsight[];
  progressScore: number;
  progressLabel:
    | "strong_improvement"
    | "improving"
    | "mixed"
    | "regressing"
    | "unstable";
  progressReason: string;
  progressSupport: TraderProgressSupport;
  interventionReadiness: InterventionReadiness;
  priorityEffectivenessSignals: PriorityEffectivenessSignal[];
}

function roundToTwo(value: number): number {
  return Number(value.toFixed(2));
}

function isNegativeClass(behaviorClass: BehaviorClass): boolean {
  return (
    behaviorClass === "destructive_mistake" || behaviorClass === "costly_mistake"
  );
}

function isPositiveClass(behaviorClass: BehaviorClass): boolean {
  return behaviorClass === "improving" || behaviorClass === "edge";
}

function buildStreaks(
  behaviorHistory: Map<string, BehaviorObservation[]>,
  positive: boolean,
): BehaviorStreakInsight[] {
  const streaks: BehaviorStreakInsight[] = [];

  for (const [behaviorId, observations] of behaviorHistory.entries()) {
    const filtered = observations.filter((observation) =>
      positive
        ? isPositiveClass(observation.behaviorClass) && observation.priorityScore >= 2.5
        : isNegativeClass(observation.behaviorClass) && observation.priorityScore >= 3,
    );

    if (filtered.length < 2) {
      continue;
    }

    let currentRun: BehaviorObservation[] = [filtered[0]];

    for (let index = 1; index < filtered.length; index += 1) {
      const previous = filtered[index - 1];
      const current = filtered[index];

      if (current.tradeIndex === previous.tradeIndex + 1) {
        currentRun.push(current);
        continue;
      }

      if (currentRun.length >= 2) {
        const averagePriorityScore = roundToTwo(
          currentRun.reduce((sum, observation) => sum + observation.priorityScore, 0) /
            currentRun.length,
        );
        const averageSeverityScore = roundToTwo(
          currentRun.reduce((sum, observation) => sum + observation.severityScore, 0) /
            currentRun.length,
        );

        streaks.push({
          behaviorId,
          startTradeId: currentRun[0].tradeId,
          endTradeId: currentRun[currentRun.length - 1].tradeId,
          startTradeIndex: currentRun[0].tradeIndex,
          endTradeIndex: currentRun[currentRun.length - 1].tradeIndex,
          length: currentRun.length,
          averagePriorityScore,
          averageSeverityScore,
          reason:
            `${behaviorId} held across ${currentRun.length} consecutive trades ` +
            `from ${currentRun[0].tradeId} to ${currentRun[currentRun.length - 1].tradeId}.`,
        });
      }

      currentRun = [current];
    }

    if (currentRun.length >= 2) {
      const averagePriorityScore = roundToTwo(
        currentRun.reduce((sum, observation) => sum + observation.priorityScore, 0) /
          currentRun.length,
      );
      const averageSeverityScore = roundToTwo(
        currentRun.reduce((sum, observation) => sum + observation.severityScore, 0) /
          currentRun.length,
      );

      streaks.push({
        behaviorId,
        startTradeId: currentRun[0].tradeId,
        endTradeId: currentRun[currentRun.length - 1].tradeId,
        startTradeIndex: currentRun[0].tradeIndex,
        endTradeIndex: currentRun[currentRun.length - 1].tradeIndex,
        length: currentRun.length,
        averagePriorityScore,
        averageSeverityScore,
        reason:
          `${behaviorId} held across ${currentRun.length} consecutive trades ` +
          `from ${currentRun[0].tradeId} to ${currentRun[currentRun.length - 1].tradeId}.`,
      });
    }
  }

  return streaks.sort((left, right) => {
    if (right.length !== left.length) {
      return right.length - left.length;
    }

    if (right.averagePriorityScore !== left.averagePriorityScore) {
      return right.averagePriorityScore - left.averagePriorityScore;
    }

    return left.behaviorId.localeCompare(right.behaviorId);
  });
}

function buildRelapseSignals(
  behaviorHistory: Map<string, BehaviorObservation[]>,
): RelapseSignal[] {
  const relapseSignals: RelapseSignal[] = [];

  for (const [behaviorId, observations] of behaviorHistory.entries()) {
    const destructiveObservations = observations.filter((observation) =>
      isNegativeClass(observation.behaviorClass),
    );

    if (destructiveObservations.length < 4) {
      continue;
    }

    let baselineRun: BehaviorObservation[] | null = null;
    let relapseRun: BehaviorObservation[] | null = null;

    for (let index = 0; index < destructiveObservations.length - 1; index += 1) {
      const current = destructiveObservations[index];
      const next = destructiveObservations[index + 1];

      if (
        next.tradeIndex === current.tradeIndex + 1 &&
        current.priorityScore >= 3.5 &&
        next.priorityScore >= 3.5
      ) {
        baselineRun = [current, next];
        break;
      }
    }

    if (!baselineRun) {
      continue;
    }

    for (let index = 0; index < destructiveObservations.length - 1; index += 1) {
      const current = destructiveObservations[index];
      const next = destructiveObservations[index + 1];

      if (
        current.tradeIndex <= baselineRun[baselineRun.length - 1].tradeIndex + 1 ||
        next.tradeIndex !== current.tradeIndex + 1 ||
        current.priorityScore < 3.5 ||
        next.priorityScore < 3.5
      ) {
        continue;
      }

      relapseRun = [current, next];
      break;
    }

    if (!relapseRun) {
      continue;
    }

    const gapTrades = destructiveObservations.filter(
      (observation) =>
        observation.tradeIndex > baselineRun[baselineRun.length - 1].tradeIndex &&
        observation.tradeIndex < relapseRun[0].tradeIndex,
    );
    const calmGap =
      relapseRun[0].tradeIndex - baselineRun[baselineRun.length - 1].tradeIndex >= 2 &&
      gapTrades.every(
        (observation) =>
          observation.priorityScore <= baselineRun[0].priorityScore - 1 ||
          !observation.isPrimary,
      );

    if (!calmGap) {
      continue;
    }

    relapseSignals.push({
      behaviorId,
      baselineEndTradeId: baselineRun[baselineRun.length - 1].tradeId,
      relapseStartTradeId: relapseRun[0].tradeId,
      relapseEndTradeId: relapseRun[relapseRun.length - 1].tradeId,
      reason:
        `${behaviorId} looked calmer after ${baselineRun[baselineRun.length - 1].tradeId} ` +
        `but then returned in a new destructive streak from ${relapseRun[0].tradeId} to ${relapseRun[relapseRun.length - 1].tradeId}.`,
    });
  }

  return relapseSignals.sort((left, right) =>
    left.behaviorId.localeCompare(right.behaviorId),
  );
}

function buildStabilizationSignals(
  behaviorHistory: Map<string, BehaviorObservation[]>,
  tradeCount: number,
  relapseSignals: RelapseSignal[],
): StabilizationSignal[] {
  const relapseBehaviorIds = new Set(relapseSignals.map((signal) => signal.behaviorId));
  const stabilizationSignals: StabilizationSignal[] = [];

  for (const [behaviorId, observations] of behaviorHistory.entries()) {
    if (relapseBehaviorIds.has(behaviorId)) {
      continue;
    }

    const destructiveObservations = observations.filter((observation) =>
      isNegativeClass(observation.behaviorClass),
    );

    if (destructiveObservations.length < 2) {
      continue;
    }

    const midpoint = Math.max(1, Math.floor(tradeCount / 2));
    const early = destructiveObservations.filter(
      (observation) => observation.tradeIndex <= midpoint,
    );
    const late = destructiveObservations.filter(
      (observation) => observation.tradeIndex > midpoint,
    );

    if (early.length === 0) {
      continue;
    }

    const earlyPressure =
      early.reduce((sum, observation) => sum + observation.priorityScore, 0) /
      Math.max(1, midpoint);
    const latePressure =
      late.reduce((sum, observation) => sum + observation.priorityScore, 0) /
      Math.max(1, tradeCount - midpoint);
    const earlyPrimaryRate =
      early.filter((observation) => observation.isPrimary).length / early.length;
    const latePrimaryRate =
      late.length > 0
        ? late.filter((observation) => observation.isPrimary).length / late.length
        : 0;

    if (
      earlyPressure - latePressure >= 1 &&
      earlyPrimaryRate > latePrimaryRate &&
      (late.length === 0 || latePressure <= earlyPressure - 1)
    ) {
      stabilizationSignals.push({
        behaviorId,
        startTradeId: early[0].tradeId,
        endTradeId: destructiveObservations[destructiveObservations.length - 1].tradeId,
        reason:
          `${behaviorId} was heavier early in the sample, then became less severe or less primary later in the trade sequence.`,
      });
    }
  }

  return stabilizationSignals.sort((left, right) =>
    left.behaviorId.localeCompare(right.behaviorId),
  );
}

function buildWindowSummary(
  label: "baseline" | "recent" | "full_history",
  feedbacks: TradeFeedbackResult[],
): AnalysisWindowSummary {
  return {
    label,
    tradeCount: feedbacks.length,
    tradeIds: feedbacks.map((feedback) => feedback.tradeContext.tradeId),
    startTradeId: feedbacks[0]?.tradeContext.tradeId ?? null,
    endTradeId: feedbacks[feedbacks.length - 1]?.tradeContext.tradeId ?? null,
    startTradeIndex: feedbacks[0]?.tradeContext.tradeIndex ?? null,
    endTradeIndex: feedbacks[feedbacks.length - 1]?.tradeContext.tradeIndex ?? null,
  };
}

function buildAnalysisWindows(
  orderedFeedbacks: TradeFeedbackResult[],
): AnalysisWindows {
  const tradeCount = orderedFeedbacks.length;
  const windowSize =
    tradeCount >= 10 ? 4 : tradeCount >= 8 ? 3 : tradeCount >= 6 ? 2 : 1;
  const baseline = orderedFeedbacks.slice(0, windowSize);
  const recent = orderedFeedbacks.slice(Math.max(0, tradeCount - windowSize));

  return {
    baseline: buildWindowSummary("baseline", baseline),
    recent: buildWindowSummary("recent", recent),
    fullHistory: buildWindowSummary("full_history", orderedFeedbacks),
    lowSampleCaution: baseline.length < 2 || recent.length < 2 || tradeCount < 5,
  };
}

export function buildBehaviorProgressWindow(
  observations: BehaviorObservation[],
  tradeIds: Set<string>,
  tradeCount: number,
): BehaviorProgressWindow {
  const windowObservations = observations.filter((observation) =>
    tradeIds.has(observation.tradeId),
  );

  if (tradeCount === 0) {
    return {
      tradeCount: 0,
      occurrenceCount: 0,
      frequencyRate: 0,
      averageSeverityScore: 0,
      primaryRate: 0,
      destructiveRate: 0,
      positiveRate: 0,
    };
  }

  return {
    tradeCount,
    occurrenceCount: windowObservations.length,
    frequencyRate: roundToTwo(windowObservations.length / tradeCount),
    averageSeverityScore:
      windowObservations.length > 0
        ? roundToTwo(
            windowObservations.reduce(
              (sum, observation) => sum + observation.severityScore,
              0,
            ) / windowObservations.length,
          )
        : 0,
    primaryRate:
      windowObservations.length > 0
        ? roundToTwo(
            windowObservations.filter((observation) => observation.isPrimary).length /
              windowObservations.length,
          )
        : 0,
    destructiveRate:
      windowObservations.length > 0
        ? roundToTwo(
            windowObservations.filter((observation) =>
              isNegativeClass(observation.behaviorClass),
            ).length / windowObservations.length,
          )
        : 0,
    positiveRate:
      windowObservations.length > 0
        ? roundToTwo(
            windowObservations.filter((observation) =>
              isPositiveClass(observation.behaviorClass),
            ).length / windowObservations.length,
          )
        : 0,
  };
}

export function getProgressConfidence(
  baselineWindow: BehaviorProgressWindow,
  recentWindow: BehaviorProgressWindow,
): TraderProfileConfidence {
  const minTrades = Math.min(baselineWindow.tradeCount, recentWindow.tradeCount);
  const totalOccurrences =
    baselineWindow.occurrenceCount + recentWindow.occurrenceCount;

  if (minTrades >= 3 && totalOccurrences >= 4) {
    return "high";
  }

  if (minTrades >= 2 && totalOccurrences >= 2) {
    return "moderate";
  }

  return "low";
}

function buildBehaviorProgress(
  behaviorHistory: Map<string, BehaviorObservation[]>,
  analysisWindows: AnalysisWindows,
): BehaviorProgressInsight[] {
  const baselineTradeIds = new Set(analysisWindows.baseline.tradeIds);
  const recentTradeIds = new Set(analysisWindows.recent.tradeIds);

  return Array.from(behaviorHistory.entries())
    .map(([behaviorId, observations]) => {
      const baselineWindow = buildBehaviorProgressWindow(
        observations,
        baselineTradeIds,
        analysisWindows.baseline.tradeCount,
      );
      const recentWindow = buildBehaviorProgressWindow(
        observations,
        recentTradeIds,
        analysisWindows.recent.tradeCount,
      );
      const confidence = getProgressConfidence(baselineWindow, recentWindow);
      const frequencyDelta = roundToTwo(
        recentWindow.frequencyRate - baselineWindow.frequencyRate,
      );
      const severityDelta = roundToTwo(
        recentWindow.averageSeverityScore - baselineWindow.averageSeverityScore,
      );
      const primaryDelta = roundToTwo(
        recentWindow.primaryRate - baselineWindow.primaryRate,
      );
      const destructiveDelta = roundToTwo(
        recentWindow.destructiveRate - baselineWindow.destructiveRate,
      );
      const positiveDelta = roundToTwo(
        recentWindow.positiveRate - baselineWindow.positiveRate,
      );
      const recurrenceStability = roundToTwo(
        Math.min(
          baselineWindow.frequencyRate,
          recentWindow.frequencyRate,
        ) / Math.max(0.01, Math.max(baselineWindow.frequencyRate, recentWindow.frequencyRate)),
      );
      const fullPositiveCount = observations.filter((observation) =>
        isPositiveClass(observation.behaviorClass),
      ).length;
      const fullNegativeCount = observations.filter((observation) =>
        isNegativeClass(observation.behaviorClass),
      ).length;
      const trendScore =
        fullPositiveCount > fullNegativeCount
          ? frequencyDelta * 2.5 +
            positiveDelta * 2 +
            severityDelta * 0.8 +
            primaryDelta * 1.3 -
            destructiveDelta * 1.8
          : positiveDelta * 2 -
            frequencyDelta * 2.5 -
            severityDelta * 1.4 -
            primaryDelta * 1.5 -
            destructiveDelta * 1.8;

      let direction: BehaviorProgressInsight["direction"] = "stable";
      if (confidence === "low") {
        direction = "too_early";
      } else if (trendScore >= 1.1) {
        direction = "improving";
      } else if (trendScore <= -1.1) {
        direction = "regressing";
      } else if (Math.abs(trendScore) >= 0.45) {
        direction = "mixed";
      }

      const classShift =
        positiveDelta > 0.25
          ? "more_positive"
          : destructiveDelta > 0.25
            ? "more_destructive"
            : "mostly_stable";

      return {
        behaviorId,
        direction,
        confidence,
        reason:
          `baselineFreq=${baselineWindow.frequencyRate.toFixed(2)} recentFreq=${recentWindow.frequencyRate.toFixed(2)}, ` +
          `baselineSeverity=${baselineWindow.averageSeverityScore.toFixed(2)} recentSeverity=${recentWindow.averageSeverityScore.toFixed(2)}, ` +
          `baselinePrimary=${baselineWindow.primaryRate.toFixed(2)} recentPrimary=${recentWindow.primaryRate.toFixed(2)}`,
        baselineWindow,
        recentWindow,
        recurrenceStability,
        classShift,
      };
    })
    .sort((left, right) => left.behaviorId.localeCompare(right.behaviorId));
}

function buildRegressionIntelligence(
  behaviorProgress: BehaviorProgressInsight[],
  aggregatedBehaviors: AggregatedBehaviorStats[],
): {
  regressionSignals: RegressionSignal[];
  emergingRisks: EmergingRiskInsight[];
  fadingStrengths: FadingStrengthInsight[];
} {
  const regressionSignals: RegressionSignal[] = [];
  const emergingRisks: EmergingRiskInsight[] = [];
  const fadingStrengths: FadingStrengthInsight[] = [];
  const aggregatedById = new Map(
    aggregatedBehaviors.map((behavior) => [behavior.behaviorId, behavior]),
  );

  for (const progress of behaviorProgress) {
    const aggregated = aggregatedById.get(progress.behaviorId);
    if (!aggregated) {
      continue;
    }

    if (
      progress.direction === "regressing" &&
      (aggregated.classBreakdown.destructive_mistake > 0 ||
        aggregated.classBreakdown.costly_mistake > 0)
    ) {
      regressionSignals.push({
        behaviorId: progress.behaviorId,
        type: "recurring_issue_worsening",
        severity: progress.confidence,
        reason: `${progress.behaviorId} is worsening across the comparison windows.`,
      });
    }

    if (
      progress.baselineWindow.occurrenceCount === 0 &&
      progress.recentWindow.occurrenceCount >= 2 &&
      progress.recentWindow.destructiveRate >= 0.5
    ) {
      emergingRisks.push({
        behaviorId: progress.behaviorId,
        reason: `${progress.behaviorId} is new in the recent window and already showing destructive recurrence.`,
      });
      regressionSignals.push({
        behaviorId: progress.behaviorId,
        type: "new_destructive_behavior",
        severity: progress.confidence,
        reason: `${progress.behaviorId} emerged recently with destructive weight.`,
      });
    }

    if (
      progress.baselineWindow.positiveRate >= 0.5 &&
      progress.recentWindow.positiveRate < progress.baselineWindow.positiveRate - 0.25
    ) {
      fadingStrengths.push({
        behaviorId: progress.behaviorId,
        reason: `${progress.behaviorId} was a stronger positive behavior earlier than it is now.`,
      });
      regressionSignals.push({
        behaviorId: progress.behaviorId,
        type: "edge_fading",
        severity: progress.confidence,
        reason: `${progress.behaviorId} is fading as an edge in the recent window.`,
      });
    }

    if (
      progress.baselineWindow.occurrenceCount > 0 &&
      progress.recentWindow.occurrenceCount > 0 &&
      progress.baselineWindow.destructiveRate < 0.5 &&
      progress.recentWindow.destructiveRate >= 0.5 &&
      progress.direction === "regressing"
    ) {
      regressionSignals.push({
        behaviorId: progress.behaviorId,
        type: "destructive_return",
        severity: progress.confidence,
        reason: `${progress.behaviorId} returned with more destructive weight in recent trades.`,
      });
    }
  }

  return {
    regressionSignals: regressionSignals.sort((left, right) =>
      left.behaviorId.localeCompare(right.behaviorId),
    ),
    emergingRisks: emergingRisks.sort((left, right) =>
      left.behaviorId.localeCompare(right.behaviorId),
    ),
    fadingStrengths: fadingStrengths.sort((left, right) =>
      left.behaviorId.localeCompare(right.behaviorId),
    ),
  };
}

function buildProgressScore(
  behaviorProgress: BehaviorProgressInsight[],
  stabilizationSignals: StabilizationSignal[],
  relapseSignals: RelapseSignal[],
  regressionSignals: RegressionSignal[],
  emergingRisks: EmergingRiskInsight[],
  fadingStrengths: FadingStrengthInsight[],
  analysisWindows: AnalysisWindows,
  sessionDevelopmentInsights: SessionDevelopmentInsight[],
): {
  progressScore: number;
  progressLabel:
    | "strong_improvement"
    | "improving"
    | "mixed"
    | "regressing"
    | "unstable";
  progressReason: string;
  progressSupport: TraderProgressSupport;
} {
  const worseningBehaviorCount = behaviorProgress.filter(
    (item) => item.direction === "regressing",
  ).length;
  const improvingBehaviorCount = behaviorProgress.filter(
    (item) => item.direction === "improving",
  ).length;
  const sessionImprovementCount = sessionDevelopmentInsights.filter(
    (item) => item.primaryStrength !== null && item.primaryWeakness === null,
  ).length;
  const weightedScore = roundToTwo(
    improvingBehaviorCount * 1.8 +
      stabilizationSignals.length * 1.2 +
      sessionImprovementCount * 0.5 -
      worseningBehaviorCount * 2.6 -
      relapseSignals.length * 2.2 -
      regressionSignals.length * 1.2 -
      emergingRisks.length * 1.8 -
      fadingStrengths.length * 0.9,
  );

  let progressLabel:
    | "strong_improvement"
    | "improving"
    | "mixed"
    | "regressing"
    | "unstable" = "mixed";

  if (analysisWindows.lowSampleCaution) {
    progressLabel = weightedScore >= 0 ? "unstable" : "mixed";
  } else if (weightedScore >= 4) {
    progressLabel = "strong_improvement";
  } else if (weightedScore >= 1.5) {
    progressLabel = "improving";
  } else if (weightedScore <= -2.5) {
    progressLabel = "regressing";
  } else if (relapseSignals.length > 0 || worseningBehaviorCount > 0) {
    progressLabel = "unstable";
  }

  return {
    progressScore: weightedScore,
    progressLabel,
    progressReason:
      `${improvingBehaviorCount} behaviors improved, ${worseningBehaviorCount} worsened, ` +
      `${relapseSignals.length} relapse signals and ${emergingRisks.length} emerging risks were detected.`,
    progressSupport: {
      worseningBehaviorCount,
      improvingBehaviorCount,
      relapseCount: relapseSignals.length,
      stabilizationCount: stabilizationSignals.length,
      emergingRiskCount: emergingRisks.length,
      fadingStrengthCount: fadingStrengths.length,
      sessionImprovementCount,
      baselineTradeCount: analysisWindows.baseline.tradeCount,
      recentTradeCount: analysisWindows.recent.tradeCount,
      weightedScore,
    },
  };
}

function buildPriorityEffectivenessSignals(
  developmentPriorities: DevelopmentPriorityInsight[],
  behaviorProgress: BehaviorProgressInsight[],
  analysisWindows: AnalysisWindows,
): {
  interventionReadiness: InterventionReadiness;
  priorityEffectivenessSignals: PriorityEffectivenessSignal[];
} {
  const progressMap = new Map(
    behaviorProgress.map((progress) => [progress.behaviorId, progress]),
  );
  const interventionReadiness: InterventionReadiness = {
    ready: !analysisWindows.lowSampleCaution,
    reason: analysisWindows.lowSampleCaution
      ? "Too few trades in the baseline/recent windows to judge intervention effectiveness confidently."
      : "Baseline and recent windows are large enough for first-pass intervention measurement.",
    baselineTradeCount: analysisWindows.baseline.tradeCount,
    recentTradeCount: analysisWindows.recent.tradeCount,
  };

  return {
    interventionReadiness,
    priorityEffectivenessSignals: developmentPriorities.slice(0, 3).map((priority) => {
      const progress = progressMap.get(priority.behaviorId);
      const status =
        !progress || progress.direction === "too_early" || analysisWindows.lowSampleCaution
          ? "too_early"
          : progress.direction === "improving"
            ? "improving"
            : progress.direction === "regressing"
              ? "worsening"
              : "unchanged";

      return {
        behaviorId: priority.behaviorId,
        status,
        reason:
          !progress
            ? `No progress window evidence was available for ${priority.behaviorId}.`
            : `${priority.behaviorId} is currently ${status} against the baseline/recent comparison.`,
        baselineWindow: progress?.baselineWindow ?? {
          tradeCount: 0,
          occurrenceCount: 0,
          frequencyRate: 0,
          averageSeverityScore: 0,
          primaryRate: 0,
          destructiveRate: 0,
          positiveRate: 0,
        },
        recentWindow: progress?.recentWindow ?? {
          tradeCount: 0,
          occurrenceCount: 0,
          frequencyRate: 0,
          averageSeverityScore: 0,
          primaryRate: 0,
          destructiveRate: 0,
          positiveRate: 0,
        },
      };
    }),
  };
}

export function buildProfileProgress(
  orderedFeedbacks: TradeFeedbackResult[],
  behaviorHistory: Map<string, BehaviorObservation[]>,
  aggregatedBehaviors: AggregatedBehaviorStats[],
  developmentPriorities: DevelopmentPriorityInsight[],
  sessionDevelopmentInsights: SessionDevelopmentInsight[],
): ProfileProgressResult {
  const analysisWindows = buildAnalysisWindows(orderedFeedbacks);
  const behaviorProgress = buildBehaviorProgress(behaviorHistory, analysisWindows);
  const destructiveStreaks = buildStreaks(behaviorHistory, false);
  const improvingStreaks = buildStreaks(behaviorHistory, true);
  const relapseSignals = buildRelapseSignals(behaviorHistory);
  const stabilizationSignals = buildStabilizationSignals(
    behaviorHistory,
    orderedFeedbacks.length,
    relapseSignals,
  );
  const regression = buildRegressionIntelligence(
    behaviorProgress,
    aggregatedBehaviors,
  );
  const progress = buildProgressScore(
    behaviorProgress,
    stabilizationSignals,
    relapseSignals,
    regression.regressionSignals,
    regression.emergingRisks,
    regression.fadingStrengths,
    analysisWindows,
    sessionDevelopmentInsights,
  );
  const intervention = buildPriorityEffectivenessSignals(
    developmentPriorities,
    behaviorProgress,
    analysisWindows,
  );

  return {
    analysisWindows,
    behaviorProgress,
    destructiveStreaks,
    improvingStreaks,
    relapseSignals,
    stabilizationSignals,
    regressionSignals: regression.regressionSignals,
    emergingRisks: regression.emergingRisks,
    fadingStrengths: regression.fadingStrengths,
    progressScore: progress.progressScore,
    progressLabel: progress.progressLabel,
    progressReason: progress.progressReason,
    progressSupport: progress.progressSupport,
    interventionReadiness: intervention.interventionReadiness,
    priorityEffectivenessSignals: intervention.priorityEffectivenessSignals,
  };
}
