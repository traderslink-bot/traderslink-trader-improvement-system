import type { BehaviorClass } from "../../behavior-analysis/types/behavior-analysis-types";
import type { TradeFeedbackResult } from "../../coaching/types/trade-coaching-types";
import type {
  AggregatedBehaviorStats,
  AdaptiveDevelopmentPlan,
  DevelopmentPlan,
  DevelopmentPriorityInsight,
  ProfileSummary,
  RankedBehaviorInsight,
  SessionDevelopmentInsight,
  TraderSessionSegment,
  TraderProfileConfidence,
} from "../types/trader-behavior-profile";
import type { BehaviorObservation } from "./profile-aggregation";

const SESSION_SEGMENTS: TraderSessionSegment[] = [
  "open",
  "midday",
  "late",
  "unknown",
];

interface SessionScoredInsight {
  behaviorId: string;
  score: number;
  count: number;
  tradeCount: number;
  averagePriorityScore: number;
}

function roundToTwo(value: number): number {
  return Number(value.toFixed(2));
}

function buildInsightReason(
  count: number,
  averagePriorityScore: number,
  averageSeverityScore: number,
  primaryCount: number,
): string {
  return `count=${count}, avgPriority=${averagePriorityScore.toFixed(2)}, avgSeverity=${averageSeverityScore.toFixed(2)}, primaryCount=${primaryCount}`;
}

function isNegativeClass(behaviorClass: BehaviorClass): boolean {
  return (
    behaviorClass === "destructive_mistake" || behaviorClass === "costly_mistake"
  );
}

function isPositiveClass(behaviorClass: BehaviorClass): boolean {
  return behaviorClass === "improving" || behaviorClass === "edge";
}

function getBehaviorPressureDelta(
  observations: BehaviorObservation[],
  tradeCount: number,
): number {
  if (tradeCount <= 1) {
    return 0;
  }

  const midpoint = Math.max(1, Math.floor(tradeCount / 2));
  const earlyIndexes = new Set<number>();
  const lateIndexes = new Set<number>();

  for (let index = 1; index <= tradeCount; index += 1) {
    if (index <= midpoint) {
      earlyIndexes.add(index);
    } else {
      lateIndexes.add(index);
    }
  }

  const earlyPressure =
    observations
      .filter((observation) => earlyIndexes.has(observation.tradeIndex))
      .reduce((sum, observation) => sum + observation.priorityScore, 0) /
    earlyIndexes.size;
  const latePressure =
    observations
      .filter((observation) => lateIndexes.has(observation.tradeIndex))
      .reduce((sum, observation) => sum + observation.priorityScore, 0) /
    Math.max(1, lateIndexes.size);

  return roundToTwo(latePressure - earlyPressure);
}

function getDominantSessionConcentration(
  observations: BehaviorObservation[],
): { concentration: number; dominantSessionSegment: TraderSessionSegment | null } {
  if (observations.length === 0) {
    return {
      concentration: 0,
      dominantSessionSegment: null,
    };
  }

  const counts = new Map<TraderSessionSegment, number>();

  for (const observation of observations) {
    counts.set(
      observation.sessionSegment,
      (counts.get(observation.sessionSegment) ?? 0) + 1,
    );
  }

  const dominant = Array.from(counts.entries()).sort((left, right) => {
    if (right[1] !== left[1]) {
      return right[1] - left[1];
    }

    return left[0].localeCompare(right[0]);
  })[0];

  return {
    concentration: dominant ? roundToTwo(dominant[1] / observations.length) : 0,
    dominantSessionSegment: dominant?.[0] ?? null,
  };
}

function buildSessionScore(
  observations: BehaviorObservation[],
  negative: boolean,
  tradeCount: number,
): SessionScoredInsight[] {
  const bucket = new Map<
    string,
    {
      count: number;
      totalPriority: number;
      totalSeverity: number;
      primaryCount: number;
    }
  >();

  for (const observation of observations) {
    const valid = negative
      ? isNegativeClass(observation.behaviorClass)
      : isPositiveClass(observation.behaviorClass);

    if (!valid) {
      continue;
    }

    const current = bucket.get(observation.behaviorId) ?? {
      count: 0,
      totalPriority: 0,
      totalSeverity: 0,
      primaryCount: 0,
    };

    current.count += 1;
    current.totalPriority += observation.priorityScore;
    current.totalSeverity += observation.severityScore;
    current.primaryCount += observation.isPrimary ? 1 : 0;
    bucket.set(observation.behaviorId, current);
  }

  return Array.from(bucket.entries())
    .map(([behaviorId, value]) => {
      const frequencyRate = value.count / Math.max(1, tradeCount);
      const averagePriorityScore = value.totalPriority / value.count;
      const averageSeverityScore = value.totalSeverity / value.count;
      const primaryRate = value.primaryCount / value.count;
      const score = negative
        ? frequencyRate * 5 +
          averagePriorityScore * 0.5 +
          averageSeverityScore * 1.2 +
          primaryRate * 1.4
        : frequencyRate * 3 +
          averagePriorityScore * 0.6 +
          averageSeverityScore * 0.8 +
          primaryRate * 1.1;

      return {
        behaviorId,
        score: roundToTwo(score),
        count: value.count,
        tradeCount,
        averagePriorityScore: roundToTwo(averagePriorityScore),
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.behaviorId.localeCompare(right.behaviorId);
    });
}

export function buildDevelopmentPriorities(
  aggregatedBehaviors: AggregatedBehaviorStats[],
  behaviorHistory: Map<string, BehaviorObservation[]>,
  tradeCount: number,
): DevelopmentPriorityInsight[] {
  return aggregatedBehaviors
    .filter((behavior) => isNegativeClass(behavior.latestBehaviorClass))
    .map((behavior) => {
      const observations = behaviorHistory.get(behavior.behaviorId) ?? [];
      const frequencyRate = behavior.occurrenceCount / Math.max(1, tradeCount);
      const primaryRate = behavior.primaryCount / Math.max(1, behavior.occurrenceCount);
      const destructiveClassRate =
        (behavior.classBreakdown.destructive_mistake +
          behavior.classBreakdown.costly_mistake * 0.6) /
        Math.max(1, behavior.occurrenceCount);
      const averageOutcomeCostScore =
        observations.length > 0
          ? roundToTwo(
              observations.reduce(
                (sum, observation) => sum + observation.outcomeCostScore,
                0,
              ) / observations.length,
            )
          : 0;
      const deteriorationDelta = getBehaviorPressureDelta(observations, tradeCount);
      const sessionConcentration = getDominantSessionConcentration(observations);
      const developmentPriorityScore = roundToTwo(
        frequencyRate * 4 +
          behavior.averageSeverityScore * 1.6 +
          primaryRate * 2.2 +
          destructiveClassRate * 1.7 +
          averageOutcomeCostScore * 0.2 +
          (deteriorationDelta >= 0
            ? deteriorationDelta * 1.1
            : deteriorationDelta * 0.5) +
          sessionConcentration.concentration * 1.2,
      );

      return {
        behaviorId: behavior.behaviorId,
        count: behavior.occurrenceCount,
        averagePriorityScore: behavior.averagePriorityScore,
        averageSeverityScore: behavior.averageSeverityScore,
        reason: buildInsightReason(
          behavior.occurrenceCount,
          behavior.averagePriorityScore,
          behavior.averageSeverityScore,
          behavior.primaryCount,
        ),
        developmentPriorityScore,
        developmentPriorityReason:
          `freq=${frequencyRate.toFixed(2)}, severity=${behavior.averageSeverityScore.toFixed(2)}, ` +
          `primaryRate=${primaryRate.toFixed(2)}, destructiveWeight=${destructiveClassRate.toFixed(2)}, ` +
          `outcomeCost=${averageOutcomeCostScore.toFixed(2)}, trendDelta=${deteriorationDelta.toFixed(2)}, ` +
          `sessionConcentration=${sessionConcentration.concentration.toFixed(2)}`,
        primaryRate: roundToTwo(primaryRate),
        destructiveClassRate: roundToTwo(destructiveClassRate),
        averageOutcomeCostScore,
        deteriorationDelta,
        sessionConcentration: sessionConcentration.concentration,
        dominantSessionSegment: sessionConcentration.dominantSessionSegment,
      };
    })
    .sort((left, right) => {
      if (right.developmentPriorityScore !== left.developmentPriorityScore) {
        return right.developmentPriorityScore - left.developmentPriorityScore;
      }

      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.behaviorId.localeCompare(right.behaviorId);
    });
}

export function buildSessionDevelopmentInsights(
  orderedFeedbacks: TradeFeedbackResult[],
  behaviorHistory: Map<string, BehaviorObservation[]>,
): SessionDevelopmentInsight[] {
  const feedbacksBySession = SESSION_SEGMENTS.map((sessionSegment) => {
    const trades = orderedFeedbacks.filter(
      (feedback) => feedback.tradeContext.sessionSegment === sessionSegment,
    );
    return {
      sessionSegment,
      trades,
    };
  }).filter((item) => item.trades.length > 0);

  return feedbacksBySession.map(({ sessionSegment, trades }) => {
    const sessionTradeIds = new Set(trades.map((trade) => trade.tradeContext.tradeId));
    const sessionObservations = Array.from(behaviorHistory.values())
      .flat()
      .filter((observation) => sessionTradeIds.has(observation.tradeId));
    const weaknesses = buildSessionScore(sessionObservations, true, trades.length);
    const strengths = buildSessionScore(sessionObservations, false, trades.length);
    const primaryWeakness = weaknesses[0] ?? null;
    const primaryStrength = strengths[0] ?? null;

    return {
      sessionSegment,
      tradeCount: trades.length,
      primaryWeakness: primaryWeakness?.behaviorId ?? null,
      primaryStrength: primaryStrength?.behaviorId ?? null,
      sessionFixFirst: primaryWeakness?.behaviorId ?? null,
      sessionReason:
        primaryWeakness
          ? `${primaryWeakness.behaviorId} appeared in ${primaryWeakness.count}/${trades.length} ${sessionSegment} trades with avgPriority ${primaryWeakness.averagePriorityScore.toFixed(2)}.`
          : primaryStrength
            ? `${primaryStrength.behaviorId} was the clearest ${sessionSegment} edge across ${trades.length} trades.`
            : `No repeated session-specific behavior stood out in ${sessionSegment}.`,
    };
  });
}

export function buildDevelopmentPlan(
  developmentPriorities: DevelopmentPriorityInsight[],
  improvingBehaviors: RankedBehaviorInsight[],
  emergingStrengths: RankedBehaviorInsight[],
  sessionDevelopmentInsights: SessionDevelopmentInsight[],
): DevelopmentPlan {
  const fixFirst = developmentPriorities[0]
    ? {
        behaviorId: developmentPriorities[0].behaviorId,
        reason: developmentPriorities[0].developmentPriorityReason,
      }
    : null;
  const fixSecond = developmentPriorities[1]
    ? {
        behaviorId: developmentPriorities[1].behaviorId,
        reason: developmentPriorities[1].developmentPriorityReason,
      }
    : null;
  const strengthTarget = improvingBehaviors[0] ?? emergingStrengths[0] ?? null;
  const protectStrength = strengthTarget
    ? {
        behaviorId: strengthTarget.behaviorId,
        reason: strengthTarget.reason,
      }
    : null;
  const strongestSessionRisk = [...sessionDevelopmentInsights]
    .filter((insight) => insight.sessionFixFirst !== null)
    .sort((left, right) => {
      if (right.tradeCount !== left.tradeCount) {
        return right.tradeCount - left.tradeCount;
      }

      return left.sessionSegment.localeCompare(right.sessionSegment);
    })[0];
  const sessionFocus =
    strongestSessionRisk?.sessionFixFirst !== null && strongestSessionRisk !== undefined
      ? {
          sessionSegment: strongestSessionRisk.sessionSegment,
          behaviorId: strongestSessionRisk.sessionFixFirst,
          reason: strongestSessionRisk.sessionReason,
        }
      : null;

  return {
    fixFirst,
    fixSecond,
    protectStrength,
    sessionFocus,
    planReason:
      `${fixFirst ? `${fixFirst.behaviorId} ranked first by development score` : "No recurring mistake ranked clearly first"}, ` +
      `${fixSecond ? `${fixSecond.behaviorId} stayed meaningfully secondary` : "no secondary issue separated cleanly"}, ` +
      `${protectStrength ? `${protectStrength.behaviorId} is the behavior to protect` : "no consistent strength has separated yet"}.`,
  };
}

export function buildProfileSummary(
  behaviorIdentity: string,
  identityConfidence: TraderProfileConfidence,
  profileConfidence: TraderProfileConfidence,
  developmentPlan: DevelopmentPlan,
  sessionDevelopmentInsights: SessionDevelopmentInsight[],
  progressLabel:
    | "strong_improvement"
    | "improving"
    | "mixed"
    | "regressing"
    | "unstable",
  adaptiveDevelopmentPlan: AdaptiveDevelopmentPlan,
): ProfileSummary {
  const largestSessionRisk = [...sessionDevelopmentInsights]
    .filter((insight) => insight.sessionFixFirst !== null)
    .sort((left, right) => {
      if (right.tradeCount !== left.tradeCount) {
        return right.tradeCount - left.tradeCount;
      }

      return left.sessionSegment.localeCompare(right.sessionSegment);
    })[0];

  return {
    identityHeadline: `${behaviorIdentity} (${identityConfidence} identity / ${profileConfidence} profile confidence)`,
    mainProblem: developmentPlan.fixFirst?.behaviorId ?? null,
    mainStrength: developmentPlan.protectStrength?.behaviorId ?? null,
    largestSessionRisk: largestSessionRisk?.sessionFixFirst
      ? `${largestSessionRisk.sessionSegment}: ${largestSessionRisk.sessionFixFirst}`
      : null,
    nextFocus: developmentPlan.sessionFocus
      ? `${developmentPlan.fixFirst?.behaviorId ?? developmentPlan.sessionFocus.behaviorId} with extra focus in ${developmentPlan.sessionFocus.sessionSegment}`
      : developmentPlan.fixFirst?.behaviorId ?? null,
    progressHeadline: progressLabel,
    worseningRisk: adaptiveDevelopmentPlan.escalatingRisks[0] ?? null,
  };
}
