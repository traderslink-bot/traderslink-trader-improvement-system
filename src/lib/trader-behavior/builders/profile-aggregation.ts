import type {
  BehaviorClass,
  BehaviorIdentityCandidate,
  BehaviorSeverity,
  BehaviorSignal,
} from "../../behavior-analysis/types/behavior-analysis-types";
import type { TradeFeedbackResult } from "../../coaching/types/trade-coaching-types";
import type {
  AggregatedBehaviorStats,
  BehaviorTrendInsight,
  RankedBehaviorInsight,
  SessionBehaviorInsight,
  TraderSessionSegment,
} from "../types/trader-behavior-profile";

export interface BehaviorObservation {
  behaviorId: string;
  tradeId: string;
  tradeIndex: number;
  sessionSegment: TraderSessionSegment;
  behaviorClass: BehaviorClass;
  severityScore: number;
  priorityScore: number;
  outcomeCostScore: number;
  isPrimary: boolean;
}

interface ProfileAggregationResult {
  aggregatedBehaviors: AggregatedBehaviorStats[];
  behaviorHistory: Map<string, BehaviorObservation[]>;
  mostFrequentWeaknesses: RankedBehaviorInsight[];
  mostDestructiveBehaviors: RankedBehaviorInsight[];
  improvingBehaviors: RankedBehaviorInsight[];
  emergingStrengths: RankedBehaviorInsight[];
  sessionWeaknesses: SessionBehaviorInsight[];
  sessionStrengths: SessionBehaviorInsight[];
  improvingTrends: BehaviorTrendInsight[];
  deterioratingTrends: BehaviorTrendInsight[];
}

const SESSION_SEGMENTS: TraderSessionSegment[] = [
  "open",
  "midday",
  "late",
  "unknown",
];

function severityToScore(severity: BehaviorSeverity): number {
  switch (severity) {
    case "high":
      return 3;
    case "moderate":
      return 2;
    case "low":
    default:
      return 1;
  }
}

function createEmptyClassBreakdown(): Record<BehaviorClass, number> {
  return {
    destructive_mistake: 0,
    costly_mistake: 0,
    neutral: 0,
    improving: 0,
    edge: 0,
  };
}

function createEmptyIdentityBreakdown() {
  return {
    recurring_weakness_candidate: 0,
    destructive_pattern: 0,
    improving_strength: 0,
    identity_signal: 0,
  };
}

function getBehaviorSignals(feedback: TradeFeedbackResult): BehaviorSignal[] {
  return feedback.behaviorAnalysis.behaviorSignals;
}

function getIdentityCandidateMap(
  feedback: TradeFeedbackResult,
): Map<string, BehaviorIdentityCandidate> {
  return new Map(
    feedback.behaviorAnalysis.behaviorIdentityCandidates.map((candidate) => [
      candidate.behaviorId,
      candidate,
    ]),
  );
}

function isNegativeClass(behaviorClass: BehaviorClass): boolean {
  return (
    behaviorClass === "destructive_mistake" || behaviorClass === "costly_mistake"
  );
}

function isPositiveClass(behaviorClass: BehaviorClass): boolean {
  return behaviorClass === "improving" || behaviorClass === "edge";
}

function roundToTwo(value: number): number {
  return Number(value.toFixed(2));
}

function sortInsights(insights: RankedBehaviorInsight[]): RankedBehaviorInsight[] {
  return [...insights].sort((left, right) => {
    if (right.averagePriorityScore !== left.averagePriorityScore) {
      return right.averagePriorityScore - left.averagePriorityScore;
    }

    if (right.count !== left.count) {
      return right.count - left.count;
    }

    return left.behaviorId.localeCompare(right.behaviorId);
  });
}

function buildInsightReason(
  count: number,
  averagePriorityScore: number,
  averageSeverityScore: number,
  primaryCount: number,
): string {
  return `count=${count}, avgPriority=${averagePriorityScore.toFixed(2)}, avgSeverity=${averageSeverityScore.toFixed(2)}, primaryCount=${primaryCount}`;
}

function mapStatsToInsight(stats: AggregatedBehaviorStats): RankedBehaviorInsight {
  return {
    behaviorId: stats.behaviorId,
    count: stats.occurrenceCount,
    averagePriorityScore: stats.averagePriorityScore,
    averageSeverityScore: stats.averageSeverityScore,
    reason: buildInsightReason(
      stats.occurrenceCount,
      stats.averagePriorityScore,
      stats.averageSeverityScore,
      stats.primaryCount,
    ),
  };
}

function rankWeaknesses(stats: AggregatedBehaviorStats[]): RankedBehaviorInsight[] {
  return stats
    .filter(
      (behavior) =>
        behavior.classBreakdown.destructive_mistake +
          behavior.classBreakdown.costly_mistake >
        0,
    )
    .map(mapStatsToInsight)
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      if (right.averagePriorityScore !== left.averagePriorityScore) {
        return right.averagePriorityScore - left.averagePriorityScore;
      }

      return left.behaviorId.localeCompare(right.behaviorId);
    });
}

function rankDestructive(stats: AggregatedBehaviorStats[]): RankedBehaviorInsight[] {
  return sortInsights(
    stats
      .filter((behavior) => behavior.classBreakdown.destructive_mistake > 0)
      .map((behavior) => ({
        ...mapStatsToInsight(behavior),
        averagePriorityScore: roundToTwo(
          behavior.averagePriorityScore +
            behavior.classBreakdown.destructive_mistake * 0.4,
        ),
      })),
  );
}

function rankStrengths(
  stats: AggregatedBehaviorStats[],
  classes: BehaviorClass[],
): RankedBehaviorInsight[] {
  return sortInsights(
    stats
      .filter((behavior) =>
        classes.some((behaviorClass) => behavior.classBreakdown[behaviorClass] > 0),
      )
      .map(mapStatsToInsight),
  );
}

function getSessionInsights(
  feedbacks: TradeFeedbackResult[],
  positive: boolean,
): SessionBehaviorInsight[] {
  return SESSION_SEGMENTS.map((sessionSegment) => {
    const bucket = new Map<
      string,
      {
        count: number;
        totalPriority: number;
        totalSeverity: number;
        primaryCount: number;
      }
    >();

    for (const feedback of feedbacks.filter(
      (item) => item.tradeContext.sessionSegment === sessionSegment,
    )) {
      for (const signal of getBehaviorSignals(feedback)) {
        const isPositive = isPositiveClass(signal.behaviorClass);
        const isNegative = isNegativeClass(signal.behaviorClass);

        if ((positive && !isPositive) || (!positive && !isNegative)) {
          continue;
        }

        const current = bucket.get(signal.behaviorId) ?? {
          count: 0,
          totalPriority: 0,
          totalSeverity: 0,
          primaryCount: 0,
        };

        current.count += 1;
        current.totalPriority += signal.behaviorPriorityScore;
        current.totalSeverity += severityToScore(signal.severity);
        current.primaryCount +=
          feedback.behaviorAnalysis.primaryBehavior?.behaviorId === signal.behaviorId
            ? 1
            : 0;
        bucket.set(signal.behaviorId, current);
      }
    }

    return {
      sessionSegment,
      behaviors: sortInsights(
        Array.from(bucket.entries()).map(([behaviorId, value]) => ({
          behaviorId,
          count: value.count,
          averagePriorityScore: roundToTwo(value.totalPriority / value.count),
          averageSeverityScore: roundToTwo(value.totalSeverity / value.count),
          reason: buildInsightReason(
            value.count,
            value.totalPriority / value.count,
            value.totalSeverity / value.count,
            value.primaryCount,
          ),
        })),
      ).slice(0, 2),
    };
  });
}

function buildTrends(
  feedbacks: TradeFeedbackResult[],
): {
  improvingTrends: BehaviorTrendInsight[];
  deterioratingTrends: BehaviorTrendInsight[];
} {
  const orderedFeedbacks = [...feedbacks].sort(
    (left, right) => left.tradeContext.tradeIndex - right.tradeContext.tradeIndex,
  );
  const midpoint = Math.max(1, Math.floor(orderedFeedbacks.length / 2));
  const firstHalf = orderedFeedbacks.slice(0, midpoint);
  const secondHalf = orderedFeedbacks.slice(midpoint);
  const behaviorIds = Array.from(
    new Set(
      orderedFeedbacks.flatMap((feedback) =>
        feedback.behaviorAnalysis.behaviorSignals.map((signal) => signal.behaviorId),
      ),
    ),
  ).sort((left, right) => left.localeCompare(right));

  const trends = behaviorIds.map((behaviorId) => {
    const firstSignals = firstHalf.flatMap((feedback) =>
      feedback.behaviorAnalysis.behaviorSignals.filter(
        (signal) => signal.behaviorId === behaviorId,
      ),
    );
    const secondSignals = secondHalf.flatMap((feedback) =>
      feedback.behaviorAnalysis.behaviorSignals.filter(
        (signal) => signal.behaviorId === behaviorId,
      ),
    );
    const firstAverage =
      firstSignals.length > 0
        ? firstSignals.reduce((sum, signal) => sum + signal.behaviorPriorityScore, 0) /
          firstSignals.length
        : 0;
    const secondAverage =
      secondSignals.length > 0
        ? secondSignals.reduce((sum, signal) => sum + signal.behaviorPriorityScore, 0) /
          secondSignals.length
        : 0;

    return {
      behaviorId,
      firstAverage,
      secondAverage,
      delta: roundToTwo(secondAverage - firstAverage),
    };
  });

  const improvingTrends = trends
    .filter((trend) => trend.delta > 0.75)
    .map<BehaviorTrendInsight>((trend) => ({
      behaviorId: trend.behaviorId,
      direction: "improving",
      delta: trend.delta,
      reason: `Average priority rose from ${trend.firstAverage.toFixed(2)} to ${trend.secondAverage.toFixed(2)} across later trades.`,
    }))
    .sort((left, right) => right.delta - left.delta);

  const deterioratingTrends = trends
    .filter((trend) => trend.delta < -0.75)
    .map<BehaviorTrendInsight>((trend) => ({
      behaviorId: trend.behaviorId,
      direction: "deteriorating",
      delta: Math.abs(trend.delta),
      reason: `Average priority fell from ${trend.firstAverage.toFixed(2)} to ${trend.secondAverage.toFixed(2)} across later trades.`,
    }))
    .sort((left, right) => right.delta - left.delta);

  return {
    improvingTrends,
    deterioratingTrends,
  };
}

function createObservation(
  feedback: TradeFeedbackResult,
  signal: BehaviorSignal,
): BehaviorObservation {
  return {
    behaviorId: signal.behaviorId,
    tradeId: feedback.tradeContext.tradeId,
    tradeIndex: feedback.tradeContext.tradeIndex,
    sessionSegment: feedback.tradeContext.sessionSegment,
    behaviorClass: signal.behaviorClass,
    severityScore: severityToScore(signal.severity),
    priorityScore: signal.behaviorPriorityScore,
    outcomeCostScore: Math.max(
      signal.outcomeImpactScore,
      Math.abs(signal.signedImpact),
      signal.contributionStrength,
    ),
    isPrimary: feedback.behaviorAnalysis.primaryBehavior?.behaviorId === signal.behaviorId,
  };
}

export function buildProfileAggregation(
  orderedFeedbacks: TradeFeedbackResult[],
): ProfileAggregationResult {
  const behaviorMap = new Map<string, AggregatedBehaviorStats>();
  const behaviorHistory = new Map<string, BehaviorObservation[]>();

  for (const feedback of orderedFeedbacks) {
    const identityCandidates = getIdentityCandidateMap(feedback);

    for (const signal of getBehaviorSignals(feedback)) {
      const existing = behaviorMap.get(signal.behaviorId) ?? {
        behaviorId: signal.behaviorId,
        occurrenceCount: 0,
        primaryCount: 0,
        totalSeverityScore: 0,
        averageSeverityScore: 0,
        averagePriorityScore: 0,
        totalPriorityScore: 0,
        classBreakdown: createEmptyClassBreakdown(),
        latestBehaviorClass: signal.behaviorClass,
        identityCategoryBreakdown: createEmptyIdentityBreakdown(),
      };

      existing.occurrenceCount += 1;
      existing.primaryCount +=
        feedback.behaviorAnalysis.primaryBehavior?.behaviorId === signal.behaviorId ? 1 : 0;
      existing.totalSeverityScore += severityToScore(signal.severity);
      existing.totalPriorityScore += signal.behaviorPriorityScore;
      existing.averageSeverityScore = roundToTwo(
        existing.totalSeverityScore / existing.occurrenceCount,
      );
      existing.averagePriorityScore = roundToTwo(
        existing.totalPriorityScore / existing.occurrenceCount,
      );
      existing.classBreakdown[signal.behaviorClass] += 1;
      existing.latestBehaviorClass = signal.behaviorClass;

      const identityCandidate = identityCandidates.get(signal.behaviorId);
      if (identityCandidate) {
        existing.identityCategoryBreakdown[identityCandidate.identityCategory] += 1;
      }

      behaviorMap.set(signal.behaviorId, existing);
      behaviorHistory.set(signal.behaviorId, [
        ...(behaviorHistory.get(signal.behaviorId) ?? []),
        createObservation(feedback, signal),
      ]);
    }
  }

  const aggregatedBehaviors = [...behaviorMap.values()].sort((left, right) => {
    if (right.averagePriorityScore !== left.averagePriorityScore) {
      return right.averagePriorityScore - left.averagePriorityScore;
    }

    if (right.occurrenceCount !== left.occurrenceCount) {
      return right.occurrenceCount - left.occurrenceCount;
    }

    return left.behaviorId.localeCompare(right.behaviorId);
  });
  const trends = buildTrends(orderedFeedbacks);

  return {
    aggregatedBehaviors,
    behaviorHistory,
    mostFrequentWeaknesses: rankWeaknesses(aggregatedBehaviors).slice(0, 3),
    mostDestructiveBehaviors: rankDestructive(aggregatedBehaviors).slice(0, 3),
    improvingBehaviors: rankStrengths(aggregatedBehaviors, ["improving"]).slice(0, 3),
    emergingStrengths: rankStrengths(aggregatedBehaviors, ["edge"]).slice(0, 3),
    sessionWeaknesses: getSessionInsights(orderedFeedbacks, false),
    sessionStrengths: getSessionInsights(orderedFeedbacks, true),
    improvingTrends: trends.improvingTrends,
    deterioratingTrends: trends.deterioratingTrends,
  };
}
