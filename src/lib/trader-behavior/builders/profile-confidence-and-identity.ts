import type {
  DevelopmentPriorityInsight,
  AggregatedBehaviorStats,
  TraderProfileConfidence,
  TraderProfileConfidenceSupport,
} from "../types/trader-behavior-profile";
import type { BehaviorObservation } from "./profile-aggregation";

function roundToTwo(value: number): number {
  return Number(value.toFixed(2));
}

function isNegativeClass(latestBehaviorClass: AggregatedBehaviorStats["latestBehaviorClass"]): boolean {
  return (
    latestBehaviorClass === "destructive_mistake" ||
    latestBehaviorClass === "costly_mistake"
  );
}

function toConfidenceLevel(score: number): TraderProfileConfidence {
  if (score >= 6.75) {
    return "high";
  }

  if (score >= 4.25) {
    return "moderate";
  }

  return "low";
}

function minConfidence(
  left: TraderProfileConfidence,
  right: TraderProfileConfidence,
): TraderProfileConfidence {
  const levels: Record<TraderProfileConfidence, number> = {
    low: 1,
    moderate: 2,
    high: 3,
  };

  return levels[left] <= levels[right] ? left : right;
}

export function buildProfileConfidence(
  tradeCount: number,
  aggregatedBehaviors: AggregatedBehaviorStats[],
  developmentPriorities: DevelopmentPriorityInsight[],
  behaviorHistory: Map<string, BehaviorObservation[]>,
): {
  profileConfidence: TraderProfileConfidence;
  profileConfidenceReason: string;
  profileConfidenceSupport: TraderProfileConfidenceSupport;
} {
  const negativeBehaviors = aggregatedBehaviors.filter((behavior) =>
    isNegativeClass(behavior.latestBehaviorClass),
  );
  const dominantIssue = developmentPriorities[0] ?? null;
  const repeatedBehaviorCount = aggregatedBehaviors.filter(
    (behavior) => behavior.occurrenceCount >= 2,
  ).length;
  const negativeOccurrences = negativeBehaviors.reduce(
    (sum, behavior) => sum + behavior.occurrenceCount,
    0,
  );
  const dominantIssueShare =
    dominantIssue && negativeOccurrences > 0
      ? dominantIssue.count / negativeOccurrences
      : 0;
  const singletonNegativeCount = negativeBehaviors.filter(
    (behavior) => behavior.occurrenceCount === 1,
  ).length;
  const conflictIndex = roundToTwo(
    Math.min(
      1,
      negativeBehaviors.length <= 1
        ? 0
        : (singletonNegativeCount / Math.max(1, negativeBehaviors.length)) * 0.6 +
            Math.max(0, 0.45 - dominantIssueShare),
    ),
  );
  const recentTradeCutoff = Math.max(
    1,
    tradeCount - Math.max(1, Math.ceil(tradeCount / 3)) + 1,
  );
  const recentSupport =
    dominantIssue !== null &&
    (behaviorHistory.get(dominantIssue.behaviorId) ?? []).some(
      (observation) => observation.tradeIndex >= recentTradeCutoff,
    );

  let sampleScore = 0.75;
  if (tradeCount >= 10) {
    sampleScore = 3.5;
  } else if (tradeCount >= 7) {
    sampleScore = 2.8;
  } else if (tradeCount >= 5) {
    sampleScore = 2.1;
  } else if (tradeCount >= 3) {
    sampleScore = 1.35;
  }

  const consistencyScore = dominantIssue
    ? dominantIssue.count >= 4 && dominantIssue.averagePriorityScore >= 4
      ? 2.4
      : dominantIssue.count >= 3
        ? 1.8
        : dominantIssue.count >= 2
          ? 1.1
          : 0.4
    : 0;
  const concentrationScore =
    dominantIssueShare >= 0.4 ? 1.6 : dominantIssueShare >= 0.28 ? 1 : 0.35;
  const recencyScore = recentSupport ? 0.9 : 0.2;
  const repeatedDestructiveBonus =
    dominantIssue && dominantIssue.count >= 3 && dominantIssue.averagePriorityScore >= 4
      ? 0.8
      : 0;
  const supportScore = roundToTwo(
    sampleScore +
      consistencyScore +
      concentrationScore +
      recencyScore +
      repeatedDestructiveBonus -
      conflictIndex * 2,
  );
  let profileConfidence = toConfidenceLevel(supportScore);

  if (tradeCount <= 2) {
    profileConfidence = "low";
  } else if (tradeCount <= 4 && profileConfidence === "high") {
    profileConfidence = "moderate";
  }

  return {
    profileConfidence,
    profileConfidenceReason:
      `${tradeCount} trades produced ${repeatedBehaviorCount} repeated behaviors; ` +
      `${dominantIssue ? `${dominantIssue.behaviorId} led ${Math.round(dominantIssueShare * 100)}% of negative signals` : "no single destructive issue dominated"}; ` +
      `${conflictIndex >= 0.45 ? "mixed scattered issues lowered confidence" : "signal conflict stayed limited"}; ` +
      `${recentSupport ? "recent trades still support the profile" : "recent trades only weakly support the profile"}.`,
    profileConfidenceSupport: {
      tradeCount,
      repeatedBehaviorCount,
      dominantBehaviorId: dominantIssue?.behaviorId ?? null,
      dominantIssueShare: roundToTwo(dominantIssueShare),
      conflictIndex,
      recencySupport: recentSupport,
      supportScore,
    },
  };
}

export function buildIdentity(
  stats: AggregatedBehaviorStats[],
  developmentPriorities: DevelopmentPriorityInsight[],
  profileConfidence: TraderProfileConfidence,
): {
  behaviorIdentity: string;
  identityConfidence: TraderProfileConfidence;
  identityReason: string;
} {
  const chasing = stats.find((behavior) => behavior.behaviorId === "chasing");
  const weakProtection = stats.find(
    (behavior) => behavior.behaviorId === "poor_profit_protection",
  );
  const structuredExecution = stats.find(
    (behavior) => behavior.behaviorId === "structured_execution",
  );
  const strongProtection = stats.find(
    (behavior) => behavior.behaviorId === "strong_profit_protection",
  );
  const failedBreakoutChasing = stats.find(
    (behavior) => behavior.behaviorId === "failed_breakout_chasing",
  );
  const prematureExit = stats.find(
    (behavior) => behavior.behaviorId === "premature_exit",
  );
  const undersizedWinner = stats.find(
    (behavior) => behavior.behaviorId === "undersized_winner",
  );
  const strongLossContainment = stats.find(
    (behavior) => behavior.behaviorId === "strong_loss_containment",
  );
  const strongWinnerManagement = stats.find(
    (behavior) => behavior.behaviorId === "strong_winner_management",
  );
  const dominantIssue = developmentPriorities[0] ?? null;

  if (
    chasing &&
    chasing.occurrenceCount >= 2 &&
    chasing.averagePriorityScore >= 4 &&
    dominantIssue?.behaviorId === "chasing"
  ) {
    const identityConfidence = minConfidence("high", profileConfidence);

    return {
      behaviorIdentity: "Chase-prone trader",
      identityConfidence,
      identityReason:
        `Chasing repeated ${chasing.occurrenceCount} times with strong average priority, ` +
        `and profile confidence caps this identity at ${identityConfidence}.`,
    };
  }

  if (
    failedBreakoutChasing &&
    failedBreakoutChasing.occurrenceCount >= 2 &&
    failedBreakoutChasing.averagePriorityScore >= 4 &&
    dominantIssue?.behaviorId === "failed_breakout_chasing"
  ) {
    const identityConfidence = minConfidence("high", profileConfidence);

    return {
      behaviorIdentity: "Breakout chaser",
      identityConfidence,
      identityReason:
        `Failed breakout chasing repeated ${failedBreakoutChasing.occurrenceCount} times with strong average priority, ` +
        `and profile confidence caps this identity at ${identityConfidence}.`,
    };
  }

  if (
    (prematureExit &&
      prematureExit.occurrenceCount >= 2 &&
      prematureExit.averagePriorityScore >= 3.5 &&
      dominantIssue?.behaviorId === "premature_exit") ||
    (undersizedWinner &&
      undersizedWinner.occurrenceCount >= 2 &&
      undersizedWinner.averagePriorityScore >= 3.5 &&
      dominantIssue?.behaviorId === "undersized_winner")
  ) {
    const identityConfidence = minConfidence("moderate", profileConfidence);

    return {
      behaviorIdentity: "Premature profit taker",
      identityConfidence,
      identityReason:
        `Winner-management problems are recurring often enough to shape the current trader profile, ` +
        `and confidence stays ${identityConfidence}.`,
    };
  }

  if (
    weakProtection &&
    weakProtection.occurrenceCount >= 2 &&
    weakProtection.averagePriorityScore >= 4 &&
    dominantIssue?.behaviorId === "poor_profit_protection"
  ) {
    const identityConfidence = minConfidence("high", profileConfidence);

    return {
      behaviorIdentity: "Weak profit protector",
      identityConfidence,
      identityReason:
        `Poor profit protection kept recurring with destructive weight, ` +
        `and profile confidence caps this identity at ${identityConfidence}.`,
    };
  }

  if (
    structuredExecution &&
    strongProtection &&
    strongLossContainment &&
    strongWinnerManagement &&
    structuredExecution.averagePriorityScore >= 3 &&
    strongProtection.averagePriorityScore >= 2.5 &&
    !dominantIssue
  ) {
    const identityConfidence = minConfidence("moderate", profileConfidence);

    return {
      behaviorIdentity: "Disciplined risk manager",
      identityConfidence,
      identityReason:
        `Structured execution, strong loss containment, and winner management repeated without a destructive issue dominating, ` +
        `so the identity stays ${identityConfidence}.`,
    };
  }

  const topBehavior = [...stats].sort((left, right) => {
    if (right.averagePriorityScore !== left.averagePriorityScore) {
      return right.averagePriorityScore - left.averagePriorityScore;
    }

    if (right.occurrenceCount !== left.occurrenceCount) {
      return right.occurrenceCount - left.occurrenceCount;
    }

    return left.behaviorId.localeCompare(right.behaviorId);
  })[0];
  const identityConfidence = topBehavior
    ? minConfidence(
        topBehavior.occurrenceCount >= 3 ? "moderate" : "low",
        profileConfidence,
      )
    : "low";

  return {
    behaviorIdentity: topBehavior
      ? `Behavior-led trader: ${topBehavior.behaviorId}`
      : "Unclear trader identity",
    identityConfidence,
    identityReason: topBehavior
      ? `${topBehavior.behaviorId} carried the strongest repeated signal, but confidence stays ${identityConfidence} until more profile evidence accumulates.`
      : "There was not enough recurring behavior evidence to form a stable trader identity.",
  };
}
