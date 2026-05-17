import { describe, expect, it } from "vitest";
import { buildTradeFeedbackFixture } from "../../__tests__/trade-feedback-test-helpers";
import { PATTERN_FAMILIES } from "../../pattern-detection/types/pattern-detection-types";
import { buildTraderBehaviorProfile } from "../builders/build-trader-behavior-profile";

function makeTrade(
  tradeIndex: number,
  sessionBucket: "market_open" | "midday" | "close",
  kind:
    | "chase_primary"
    | "poor_protection_primary"
    | "poor_protection_with_chase"
    | "structured_primary"
    | "failed_breakout_chase_primary"
    | "premature_exit_primary"
    | "undersized_winner_primary"
    | "strong_loss_containment_mixed"
    | "strong_winner_management_primary",
) {
  if (kind === "chase_primary") {
    return buildTradeFeedbackFixture(
      [
        {
          patternId: "breakout_chase_entry_structure",
          family: PATTERN_FAMILIES.ENTRY_QUALITY,
          normalizedRole: "primary_candidate",
          structuralLevel: "structural_composite",
        },
        {
          patternId: "overextended_chase_entry_structure",
          family: PATTERN_FAMILIES.ENTRY_QUALITY,
          normalizedRole: "supporting_candidate",
          structuralLevel: "structural_composite",
        },
      ],
      {
        topAnchorPatternId: "breakout_chase_entry_structure",
        tradeId: `trade-${tradeIndex}`,
        tradeIndex,
        sessionBucket,
      },
    ).tradeFeedback;
  }

  if (kind === "poor_protection_primary") {
    return buildTradeFeedbackFixture(
      [
        {
          patternId: "failed_profit_protection_structure",
          family: PATTERN_FAMILIES.POSITION_REDUCTION,
          normalizedRole: "primary_candidate",
          structuralLevel: "structural_composite",
        },
        {
          patternId: "peak_profit_giveback_structure",
          family: PATTERN_FAMILIES.EXIT_QUALITY,
          normalizedRole: "supporting_candidate",
          structuralLevel: "structural_composite",
        },
      ],
      {
        topAnchorPatternId: "failed_profit_protection_structure",
        tradeId: `trade-${tradeIndex}`,
        tradeIndex,
        sessionBucket,
      },
    ).tradeFeedback;
  }

  if (kind === "poor_protection_with_chase") {
    return buildTradeFeedbackFixture(
      [
        {
          patternId: "failed_profit_protection_structure",
          family: PATTERN_FAMILIES.POSITION_REDUCTION,
          normalizedRole: "primary_candidate",
          structuralLevel: "structural_composite",
        },
        {
          patternId: "peak_profit_giveback_structure",
          family: PATTERN_FAMILIES.EXIT_QUALITY,
          normalizedRole: "supporting_candidate",
          structuralLevel: "structural_composite",
        },
        {
          patternId: "breakout_chase_entry_structure",
          family: PATTERN_FAMILIES.ENTRY_QUALITY,
          normalizedRole: "supporting_candidate",
          structuralLevel: "structural_composite",
        },
      ],
      {
        topAnchorPatternId: "failed_profit_protection_structure",
        tradeId: `trade-${tradeIndex}`,
        tradeIndex,
        sessionBucket,
      },
    ).tradeFeedback;
  }

  if (kind === "failed_breakout_chase_primary") {
    return buildTradeFeedbackFixture(
      [
        {
          patternId: "breakout_chase_entry_structure",
          family: PATTERN_FAMILIES.ENTRY_QUALITY,
          normalizedRole: "primary_candidate",
          structuralLevel: "structural_composite",
        },
        {
          patternId: "failed_breakout_entry_structure",
          family: PATTERN_FAMILIES.ENTRY_QUALITY,
          normalizedRole: "supporting_candidate",
          structuralLevel: "structural_composite",
        },
        {
          patternId: "market_open_breakout_chase_entry_structure",
          family: PATTERN_FAMILIES.ENTRY_QUALITY,
          normalizedRole: "supporting_candidate",
          structuralLevel: "structural_composite",
        },
      ],
      {
        topAnchorPatternId: "breakout_chase_entry_structure",
        tradeId: `trade-${tradeIndex}`,
        tradeIndex,
        sessionBucket,
      },
    ).tradeFeedback;
  }

  if (kind === "premature_exit_primary") {
    return buildTradeFeedbackFixture(
      [
        {
          patternId: "advantaged_entry_structure",
          family: PATTERN_FAMILIES.ENTRY_QUALITY,
          normalizedRole: "primary_candidate",
          structuralLevel: "structural_composite",
        },
        {
          patternId: "balanced_management_with_premature_final_exit",
          family: PATTERN_FAMILIES.SCALING_QUALITY,
          normalizedRole: "supporting_candidate",
          structuralLevel: "storyline_composite",
        },
        {
          patternId: "premature_final_exit_after_constructive_management",
          family: PATTERN_FAMILIES.EXIT_QUALITY,
          normalizedRole: "supporting_candidate",
          structuralLevel: "structural_composite",
        },
      ],
      {
        topAnchorPatternId: "advantaged_entry_structure",
        tradeId: `trade-${tradeIndex}`,
        tradeIndex,
        sessionBucket,
      },
    ).tradeFeedback;
  }

  if (kind === "undersized_winner_primary") {
    return buildTradeFeedbackFixture(
      [
        {
          patternId: "underutilized_position_building",
          family: PATTERN_FAMILIES.SCALING_QUALITY,
          normalizedRole: "primary_candidate",
          structuralLevel: "storyline_composite",
        },
        {
          patternId: "underutilized_winner_with_missed_final_continuation",
          family: PATTERN_FAMILIES.SCALING_QUALITY,
          normalizedRole: "supporting_candidate",
          structuralLevel: "storyline_composite",
        },
      ],
      {
        topAnchorPatternId: "underutilized_position_building",
        tradeId: `trade-${tradeIndex}`,
        tradeIndex,
        sessionBucket,
      },
    ).tradeFeedback;
  }

  if (kind === "strong_loss_containment_mixed") {
    return buildTradeFeedbackFixture(
      [
        {
          patternId: "add_into_weakness",
          family: PATTERN_FAMILIES.SCALING_QUALITY,
          normalizedRole: "primary_candidate",
          structuralLevel: "structural_composite",
        },
        {
          patternId: "disciplined_defensive_exit",
          family: PATTERN_FAMILIES.EXIT_QUALITY,
          normalizedRole: "supporting_candidate",
          structuralLevel: "structural_composite",
        },
        {
          patternId: "timely_risk_response_with_defensive_final_exit_after_deterioration",
          family: PATTERN_FAMILIES.POSITION_REDUCTION,
          normalizedRole: "supporting_candidate",
          structuralLevel: "storyline_composite",
        },
      ],
      {
        topAnchorPatternId: "add_into_weakness",
        tradeId: `trade-${tradeIndex}`,
        tradeIndex,
        sessionBucket,
      },
    ).tradeFeedback;
  }

  if (kind === "strong_winner_management_primary") {
    return buildTradeFeedbackFixture(
      [
        {
          patternId: "timely_profit_protection_with_constructive_final_exit",
          family: PATTERN_FAMILIES.SCALING_QUALITY,
          normalizedRole: "primary_candidate",
          structuralLevel: "structural_composite",
        },
        {
          patternId: "trim_into_strength_with_constructive_final_exit",
          family: PATTERN_FAMILIES.SCALING_QUALITY,
          normalizedRole: "supporting_candidate",
          structuralLevel: "storyline_composite",
        },
        {
          patternId: "balanced_management_with_constructive_exit",
          family: PATTERN_FAMILIES.SCALING_QUALITY,
          normalizedRole: "supporting_candidate",
          structuralLevel: "storyline_composite",
        },
      ],
      {
        topAnchorPatternId: "timely_profit_protection_with_constructive_final_exit",
        tradeId: `trade-${tradeIndex}`,
        tradeIndex,
        sessionBucket,
      },
    ).tradeFeedback;
  }

  return buildTradeFeedbackFixture(
    [
      {
        patternId: "advantaged_entry_structure",
        family: PATTERN_FAMILIES.ENTRY_QUALITY,
        normalizedRole: "primary_candidate",
        structuralLevel: "structural_composite",
      },
      {
        patternId: "disciplined_defensive_exit",
        family: PATTERN_FAMILIES.EXIT_QUALITY,
        normalizedRole: "supporting_candidate",
        structuralLevel: "structural_composite",
      },
      {
        patternId: "structured_position_building",
        family: PATTERN_FAMILIES.SCALING_QUALITY,
        normalizedRole: "supporting_candidate",
        structuralLevel: "storyline_composite",
      },
      {
        patternId: "timely_risk_response_with_profit_protection",
        family: PATTERN_FAMILIES.POSITION_REDUCTION,
        normalizedRole: "supporting_candidate",
        structuralLevel: "structural_composite",
      },
    ],
    {
      topAnchorPatternId: "advantaged_entry_structure",
      tradeId: `trade-${tradeIndex}`,
      tradeIndex,
      sessionBucket,
    },
  ).tradeFeedback;
}

function buildPlanningProfile() {
  return buildTraderBehaviorProfile([
    makeTrade(1, "market_open", "chase_primary"),
    makeTrade(2, "market_open", "chase_primary"),
    makeTrade(3, "close", "structured_primary"),
    makeTrade(4, "close", "structured_primary"),
    makeTrade(5, "midday", "poor_protection_primary"),
    makeTrade(6, "midday", "poor_protection_primary"),
    makeTrade(7, "close", "structured_primary"),
    makeTrade(8, "market_open", "chase_primary"),
    makeTrade(9, "market_open", "chase_primary"),
    makeTrade(10, "midday", "poor_protection_primary"),
  ]);
}

function buildTrendProfile() {
  return buildTraderBehaviorProfile([
    makeTrade(1, "market_open", "chase_primary"),
    makeTrade(2, "market_open", "chase_primary"),
    makeTrade(3, "close", "structured_primary"),
    makeTrade(4, "close", "structured_primary"),
    makeTrade(5, "midday", "poor_protection_primary"),
    makeTrade(6, "midday", "poor_protection_primary"),
    makeTrade(7, "close", "structured_primary"),
    makeTrade(8, "market_open", "poor_protection_with_chase"),
    makeTrade(9, "market_open", "poor_protection_with_chase"),
  ]);
}

function buildStrongImprovementProfile() {
  return buildTraderBehaviorProfile([
    makeTrade(1, "market_open", "chase_primary"),
    makeTrade(2, "market_open", "chase_primary"),
    makeTrade(3, "midday", "poor_protection_primary"),
    makeTrade(4, "midday", "poor_protection_primary"),
    makeTrade(5, "close", "structured_primary"),
    makeTrade(6, "close", "structured_primary"),
    makeTrade(7, "close", "structured_primary"),
    makeTrade(8, "close", "structured_primary"),
  ]);
}

function buildMixedProgressProfile() {
  return buildTraderBehaviorProfile([
    makeTrade(1, "market_open", "chase_primary"),
    makeTrade(2, "market_open", "chase_primary"),
    makeTrade(3, "close", "structured_primary"),
    makeTrade(4, "close", "structured_primary"),
    makeTrade(5, "midday", "poor_protection_primary"),
    makeTrade(6, "midday", "poor_protection_primary"),
    makeTrade(7, "market_open", "poor_protection_with_chase"),
    makeTrade(8, "market_open", "poor_protection_with_chase"),
  ]);
}

function buildEmergingRiskProfile() {
  return buildTraderBehaviorProfile([
    makeTrade(1, "close", "structured_primary"),
    makeTrade(2, "close", "structured_primary"),
    makeTrade(3, "close", "structured_primary"),
    makeTrade(4, "close", "structured_primary"),
    makeTrade(5, "midday", "poor_protection_primary"),
    makeTrade(6, "midday", "poor_protection_primary"),
  ]);
}

function buildLowSampleProgressProfile() {
  return buildTraderBehaviorProfile([
    makeTrade(1, "market_open", "chase_primary"),
    makeTrade(2, "close", "structured_primary"),
    makeTrade(3, "midday", "poor_protection_primary"),
    makeTrade(4, "close", "structured_primary"),
  ]);
}

function buildSuccessfulInterventionProfile() {
  return buildTraderBehaviorProfile(
    [
      makeTrade(1, "market_open", "chase_primary"),
      makeTrade(2, "market_open", "chase_primary"),
      makeTrade(3, "close", "structured_primary"),
      makeTrade(4, "close", "structured_primary"),
      makeTrade(5, "close", "structured_primary"),
      makeTrade(6, "close", "structured_primary"),
    ],
    {
      interventionPeriods: [
        {
          interventionId: "int-chasing-1",
          targetBehaviorId: "chasing",
          focusKey: "reduce_chasing",
          interventionType: "reduce_mistake",
          goalType: "reduce_destructive_behavior",
          startTradeIndex: 3,
          endTradeIndex: 4,
        },
      ],
    },
  );
}

function buildFailedInterventionProfile() {
  return buildTraderBehaviorProfile(
    [
      makeTrade(1, "market_open", "chase_primary"),
      makeTrade(2, "market_open", "chase_primary"),
      makeTrade(3, "market_open", "chase_primary"),
      makeTrade(4, "market_open", "chase_primary"),
      makeTrade(5, "market_open", "chase_primary"),
      makeTrade(6, "market_open", "chase_primary"),
    ],
    {
      interventionPeriods: [
        {
          interventionId: "int-chasing-flat",
          targetBehaviorId: "chasing",
          focusKey: "reduce_chasing",
          interventionType: "reduce_mistake",
          goalType: "reduce_destructive_behavior",
          startTradeIndex: 3,
          endTradeIndex: 4,
        },
      ],
    },
  );
}

function buildTooEarlyInterventionProfile() {
  return buildTraderBehaviorProfile(
    [
      makeTrade(1, "market_open", "chase_primary"),
      makeTrade(2, "midday", "poor_protection_primary"),
      makeTrade(3, "close", "structured_primary"),
      makeTrade(4, "close", "structured_primary"),
    ],
    {
      interventionPeriods: [
        {
          interventionId: "int-protection-recent",
          targetBehaviorId: "poor_profit_protection",
          focusKey: "reduce_poor_profit_protection",
          interventionType: "reduce_mistake",
          goalType: "reduce_destructive_behavior",
          startTradeIndex: 4,
        },
      ],
    },
  );
}

function buildPlanDriftInterventionProfile() {
  return buildTraderBehaviorProfile(
    [
      makeTrade(1, "market_open", "chase_primary"),
      makeTrade(2, "market_open", "chase_primary"),
      makeTrade(3, "close", "structured_primary"),
      makeTrade(4, "close", "structured_primary"),
      makeTrade(5, "midday", "poor_protection_primary"),
      makeTrade(6, "midday", "poor_protection_primary"),
      makeTrade(7, "market_open", "poor_protection_with_chase"),
      makeTrade(8, "market_open", "poor_protection_with_chase"),
    ],
    {
      interventionPeriods: [
        {
          interventionId: "int-chasing-drift",
          targetBehaviorId: "chasing",
          focusKey: "reduce_chasing",
          interventionType: "reduce_mistake",
          goalType: "reduce_destructive_behavior",
          startTradeIndex: 5,
        },
      ],
    },
  );
}

function buildFocusCycleProfile() {
  return buildTraderBehaviorProfile(
    [
      makeTrade(1, "market_open", "chase_primary"),
      makeTrade(2, "market_open", "chase_primary"),
      makeTrade(3, "close", "structured_primary"),
      makeTrade(4, "close", "structured_primary"),
      makeTrade(5, "midday", "poor_protection_primary"),
      makeTrade(6, "midday", "poor_protection_primary"),
      makeTrade(7, "market_open", "poor_protection_with_chase"),
      makeTrade(8, "market_open", "poor_protection_with_chase"),
    ],
    {
      interventionPeriods: [
        {
          interventionId: "cycle-1",
          targetBehaviorId: "chasing",
          focusKey: "reduce_chasing",
          interventionType: "reduce_mistake",
          goalType: "reduce_destructive_behavior",
          startTradeIndex: 3,
          endTradeIndex: 4,
        },
        {
          interventionId: "cycle-2",
          targetBehaviorId: "poor_profit_protection",
          focusKey: "reduce_poor_profit_protection",
          interventionType: "reduce_mistake",
          goalType: "reduce_destructive_behavior",
          startTradeIndex: 5,
        },
        {
          interventionId: "cycle-overlap",
          targetBehaviorId: "chasing",
          focusKey: "protect_execution_during_transition",
          interventionType: "custom_focus",
          goalType: "custom_goal",
          startTradeIndex: 5,
          endTradeIndex: 7,
        },
      ],
    },
  );
}

function buildNewBehaviorCoverageProfile() {
  return buildTraderBehaviorProfile([
    makeTrade(1, "market_open", "failed_breakout_chase_primary"),
    makeTrade(2, "market_open", "failed_breakout_chase_primary"),
    makeTrade(3, "midday", "premature_exit_primary"),
    makeTrade(4, "midday", "premature_exit_primary"),
    makeTrade(5, "midday", "premature_exit_primary"),
    makeTrade(6, "close", "strong_winner_management_primary"),
    makeTrade(7, "close", "strong_winner_management_primary"),
    makeTrade(8, "midday", "strong_loss_containment_mixed"),
    makeTrade(9, "close", "undersized_winner_primary"),
  ]);
}

function buildFailedBreakoutInterventionProfile() {
  return buildTraderBehaviorProfile(
    [
      makeTrade(1, "market_open", "failed_breakout_chase_primary"),
      makeTrade(2, "market_open", "failed_breakout_chase_primary"),
      makeTrade(3, "close", "structured_primary"),
      makeTrade(4, "close", "structured_primary"),
      makeTrade(5, "close", "structured_primary"),
      makeTrade(6, "close", "structured_primary"),
    ],
    {
      interventionPeriods: [
        {
          interventionId: "int-failed-breakout",
          targetBehaviorId: "failed_breakout_chasing",
          focusKey: "reduce_failed_breakout_chasing",
          interventionType: "reduce_mistake",
          goalType: "reduce_destructive_behavior",
          startTradeIndex: 3,
          endTradeIndex: 5,
        },
      ],
    },
  );
}

function buildPrematureExitDriftProfile() {
  return buildTraderBehaviorProfile(
    [
      makeTrade(1, "market_open", "chase_primary"),
      makeTrade(2, "market_open", "chase_primary"),
      makeTrade(3, "close", "structured_primary"),
      makeTrade(4, "close", "structured_primary"),
      makeTrade(5, "midday", "premature_exit_primary"),
      makeTrade(6, "midday", "premature_exit_primary"),
      makeTrade(7, "midday", "premature_exit_primary"),
      makeTrade(8, "close", "strong_winner_management_primary"),
    ],
    {
      interventionPeriods: [
        {
          interventionId: "int-chasing-rotation",
          targetBehaviorId: "chasing",
          focusKey: "reduce_chasing",
          interventionType: "reduce_mistake",
          goalType: "reduce_destructive_behavior",
          startTradeIndex: 5,
        },
      ],
    },
  );
}

describe("buildTraderBehaviorProfile", () => {
  it("hardens profile confidence across low and high sample trader profiles", () => {
    const lowSampleProfile = buildTraderBehaviorProfile([
      makeTrade(1, "market_open", "chase_primary"),
      makeTrade(2, "market_open", "chase_primary"),
    ]);
    const highSampleProfile = buildPlanningProfile();

    expect(lowSampleProfile.tradeCount).toBe(2);
    expect(lowSampleProfile.profileConfidence).toBe("low");
    expect(lowSampleProfile.identityConfidence).toBe("low");
    expect(lowSampleProfile.profileConfidenceReason).toContain("2 trades");

    expect(highSampleProfile.tradeCount).toBe(10);
    expect(highSampleProfile.profileConfidence).toBe("high");
    expect(highSampleProfile.identityConfidence).toBe("high");
    expect(highSampleProfile.profileConfidenceSupport.dominantBehaviorId).toBe(
      "poor_profit_protection",
    );
    expect(highSampleProfile.profileConfidenceReason).toContain(
      "recent trades still support the profile",
    );
  });

  it("re-ranks recurring issues into a real development plan instead of pure frequency", () => {
    const profile = buildPlanningProfile();

    expect(profile.developmentPriorities[0]?.behaviorId).toBe(
      "poor_profit_protection",
    );
    expect(profile.developmentPriorities[1]?.behaviorId).toBe("chasing");
    expect(profile.developmentPriorities[0]?.developmentPriorityScore).toBeGreaterThan(
      profile.developmentPriorities[1]?.developmentPriorityScore ?? 0,
    );
    expect(profile.topRecurringMistake?.behaviorId).toBe("poor_profit_protection");
    expect(profile.secondRecurringMistake?.behaviorId).toBe("chasing");
    expect(profile.improvementPriorityOrder.slice(0, 2)).toEqual([
      "poor_profit_protection",
      "chasing",
    ]);

    expect(profile.developmentPlan.fixFirst?.behaviorId).toBe(
      "poor_profit_protection",
    );
    expect(profile.developmentPlan.fixSecond?.behaviorId).toBe("chasing");
    expect(profile.developmentPlan.protectStrength?.behaviorId).toBe(
      "strong_loss_containment",
    );
    expect(profile.developmentPlan.sessionFocus).toMatchObject({
      sessionSegment: "open",
      behaviorId: "chasing",
    });
    expect(profile.developmentPlan.planReason).toContain(
      "poor_profit_protection ranked first",
    );
  });

  it("detects destructive and improving streaks plus relapse and stabilization signals", () => {
    const profile = buildTrendProfile();

    expect(profile.destructiveStreaks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          behaviorId: "poor_profit_protection",
          startTradeId: "trade-5",
          endTradeId: "trade-6",
          length: 2,
        }),
      ]),
    );
    expect(profile.improvingStreaks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          behaviorId: "structured_execution",
          startTradeId: "trade-3",
          endTradeId: "trade-4",
          length: 2,
        }),
      ]),
    );
    expect(profile.relapseSignals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          behaviorId: "poor_profit_protection",
          baselineEndTradeId: "trade-6",
          relapseStartTradeId: "trade-8",
          relapseEndTradeId: "trade-9",
        }),
      ]),
    );
    expect(profile.stabilizationSignals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          behaviorId: "chasing",
        }),
      ]),
    );
  });

  it("builds actionable session development insight and a concise profile summary", () => {
    const profile = buildPlanningProfile();
    const openInsight = profile.sessionDevelopmentInsights.find(
      (insight) => insight.sessionSegment === "open",
    );
    const lateInsight = profile.sessionDevelopmentInsights.find(
      (insight) => insight.sessionSegment === "late",
    );

    expect(openInsight).toMatchObject({
      primaryWeakness: "chasing",
      sessionFixFirst: "chasing",
    });
    expect(openInsight?.sessionReason).toContain("open trades");
    expect(lateInsight).toMatchObject({
      primaryStrength: "structured_execution",
    });
    expect(
      profile.sessionWeaknesses.find((segment) => segment.sessionSegment === "open")
        ?.behaviors[0]?.behaviorId,
    ).toBe("chasing");
    expect(
      profile.sessionStrengths.find((segment) => segment.sessionSegment === "late")
        ?.behaviors[0]?.behaviorId,
    ).toBe("structured_execution");

    expect(profile.profileSummary.identityHeadline).toContain(
      "Weak profit protector",
    );
    expect(profile.profileSummary.mainProblem).toBe("poor_profit_protection");
    expect(profile.profileSummary.mainStrength).toBe("strong_loss_containment");
    expect(profile.profileSummary.largestSessionRisk).toBe("open: chasing");
    expect(profile.profileSummary.nextFocus).toContain(
      "poor_profit_protection",
    );
  });

  it("scores strong improvement with explicit windows and behavior-level progress tracking", () => {
    const profile = buildStrongImprovementProfile();
    const chasingProgress = profile.behaviorProgress.find(
      (behavior) => behavior.behaviorId === "chasing",
    );
    const structuredExecutionProgress = profile.behaviorProgress.find(
      (behavior) => behavior.behaviorId === "structured_execution",
    );

    expect(profile.analysisWindows.baseline.tradeCount).toBe(3);
    expect(profile.analysisWindows.recent.tradeCount).toBe(3);
    expect(profile.analysisWindows.lowSampleCaution).toBe(false);
    expect(profile.progressLabel).toBe("strong_improvement");
    expect(profile.progressScore).toBeGreaterThan(0);
    expect(profile.progressReason).toContain("behaviors improved");
    expect(chasingProgress).toMatchObject({
      direction: "improving",
      confidence: "moderate",
    });
    expect(chasingProgress?.baselineWindow.frequencyRate).toBeGreaterThan(
      chasingProgress?.recentWindow.frequencyRate ?? 0,
    );
    expect(structuredExecutionProgress).toMatchObject({
      direction: "improving",
    });
    expect(profile.interventionReadiness.ready).toBe(true);
    expect(
      profile.priorityEffectivenessSignals.find(
        (signal) => signal.behaviorId === "chasing",
      )?.status,
    ).toBe("improving");
  });

  it("detects mixed progress, regression signals, fading strengths, and adaptive escalation", () => {
    const profile = buildMixedProgressProfile();

    expect(profile.progressLabel).toBe("regressing");
    expect(profile.progressScore).toBeLessThan(0);
    expect(profile.regressionSignals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          behaviorId: "poor_profit_protection",
          type: "recurring_issue_worsening",
        }),
        expect.objectContaining({
          behaviorId: "poor_profit_protection",
          type: "new_destructive_behavior",
        }),
      ]),
    );
    expect(profile.emergingRisks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          behaviorId: "poor_profit_protection",
        }),
      ]),
    );
    expect(profile.fadingStrengths.map((item) => item.behaviorId)).toEqual(
      expect.arrayContaining(["strong_profit_protection", "structured_execution"]),
    );
    expect(
      profile.priorityEffectivenessSignals.find(
        (signal) => signal.behaviorId === "poor_profit_protection",
      )?.status,
    ).toBe("worsening");
    expect(profile.adaptiveDevelopmentPlan.currentFocus).toBe(
      "poor_profit_protection",
    );
    expect(profile.adaptiveDevelopmentPlan.escalatingRisks).toContain(
      "poor_profit_protection",
    );
    expect(profile.adaptiveDevelopmentPlan.deEscalatedFocuses).toContain(
      "chasing",
    );
    expect(profile.profileSummary.progressHeadline).toBe("regressing");
    expect(profile.profileSummary.worseningRisk).toBe("poor_profit_protection");
  });

  it("keeps relapse detection distinct from broader regression intelligence", () => {
    const profile = buildTrendProfile();

    expect(profile.relapseSignals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          behaviorId: "poor_profit_protection",
          relapseStartTradeId: "trade-8",
          relapseEndTradeId: "trade-9",
        }),
      ]),
    );
    expect(profile.progressLabel).toBe("regressing");
    expect(profile.regressionSignals.map((signal) => signal.behaviorId)).toContain(
      "poor_profit_protection",
    );
    expect(profile.adaptiveDevelopmentPlan.currentFocus).toBe(
      "poor_profit_protection",
    );
  });

  it("detects emerging destructive behavior and fading strengths from the comparison windows", () => {
    const profile = buildEmergingRiskProfile();
    const poorProtectionProgress = profile.behaviorProgress.find(
      (behavior) => behavior.behaviorId === "poor_profit_protection",
    );

    expect(profile.analysisWindows.baseline.tradeCount).toBe(2);
    expect(profile.analysisWindows.recent.tradeCount).toBe(2);
    expect(profile.progressLabel).toBe("regressing");
    expect(profile.emergingRisks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          behaviorId: "poor_profit_protection",
        }),
      ]),
    );
    expect(profile.fadingStrengths.map((item) => item.behaviorId)).toEqual(
      expect.arrayContaining(["strong_profit_protection", "structured_execution"]),
    );
    expect(poorProtectionProgress).toMatchObject({
      direction: "regressing",
    });
    expect(
      profile.priorityEffectivenessSignals.find(
        (signal) => signal.behaviorId === "poor_profit_protection",
      )?.status,
    ).toBe("worsening");
  });

  it("applies low-sample caution to progress scoring and intervention effectiveness", () => {
    const profile = buildLowSampleProgressProfile();

    expect(profile.analysisWindows.lowSampleCaution).toBe(true);
    expect(profile.progressLabel).toBe("unstable");
    expect(profile.interventionReadiness.ready).toBe(false);
    expect(profile.priorityEffectivenessSignals.every((signal) => signal.status === "too_early")).toBe(true);
    expect(profile.behaviorProgress.every((behavior) => behavior.direction === "too_early")).toBe(true);
  });

  it("measures a successful explicit intervention period on a recurring weakness", () => {
    const profile = buildSuccessfulInterventionProfile();
    const evaluation = profile.interventionEvaluations[0];

    expect(profile.interventionPeriods).toHaveLength(1);
    expect(evaluation).toMatchObject({
      interventionId: "int-chasing-1",
      targetBehaviorId: "chasing",
      effectivenessLabel: "improved",
      confidence: "moderate",
    });
    expect(evaluation.effectivenessScore).toBeGreaterThan(0);
    expect(evaluation.supportingMetrics.before.frequencyRate).toBeGreaterThan(
      evaluation.supportingMetrics.during.frequencyRate,
    );
    expect(profile.planAdherenceSignals[0]).toMatchObject({
      interventionId: "int-chasing-1",
      status: "aligned",
    });
    expect(profile.focusCycles[0]).toMatchObject({
      interventionId: "int-chasing-1",
      status: "completed",
    });
    expect(profile.interventionSummary.activeFocus).toBe(null);
  });

  it("measures a failed explicit intervention with no improvement and marks the cycle abandoned", () => {
    const profile = buildFailedInterventionProfile();
    const evaluation = profile.interventionEvaluations[0];

    expect(evaluation.effectivenessLabel).toBe("flat");
    expect(profile.planAdherenceSignals[0]?.status).toBe("working_but_unresolved");
    expect(profile.focusCycles[0]?.status).toBe("abandoned");
    expect(profile.adaptiveDevelopmentPlan.shouldContinueFocus).toBe(false);
    expect(profile.adaptiveDevelopmentPlan.shouldRotateFocus).toBe(true);
  });

  it("keeps a recent intervention in too-early-to-judge state", () => {
    const profile = buildTooEarlyInterventionProfile();
    const evaluation = profile.interventionEvaluations[0];

    expect(evaluation.effectivenessLabel).toBe("too_early");
    expect(profile.planAdherenceSignals[0]?.status).toBe("too_early");
    expect(profile.adaptiveDevelopmentPlan.tooEarlyToJudge).toBe(true);
    expect(profile.adaptiveDevelopmentPlan.rotationReason).toContain("Too early");
    expect(profile.interventionSummary.focusEffectiveness).toBe("too_early");
  });

  it("detects plan drift and mismatch when another issue overtakes the chosen focus", () => {
    const profile = buildPlanDriftInterventionProfile();

    expect(profile.planDriftSignals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          interventionId: "int-chasing-drift",
          targetBehaviorId: "chasing",
          overtakingBehaviorId: "poor_profit_protection",
        }),
      ]),
    );
    expect(profile.focusMismatchWarnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          interventionId: "int-chasing-drift",
          currentMainProblem: "poor_profit_protection",
        }),
      ]),
    );
    expect(profile.adaptiveDevelopmentPlan.shouldRotateFocus).toBe(true);
    expect(profile.adaptiveDevelopmentPlan.nextFocus).toBe("poor_profit_protection");
    expect(profile.interventionSummary.biggestMismatch).toBe(
      "poor_profit_protection",
    );
  });

  it("tracks completed, active, and conflicted focus cycles correctly", () => {
    const profile = buildFocusCycleProfile();

    expect(profile.focusCycles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          interventionId: "cycle-1",
          status: "completed",
        }),
        expect.objectContaining({
          interventionId: "cycle-2",
          status: "conflicted",
        }),
        expect.objectContaining({
          interventionId: "cycle-overlap",
          status: "conflicted",
        }),
      ]),
    );
    expect(profile.currentFocusCycle?.interventionId).toBe("cycle-overlap");
    expect(profile.focusCycleStatus.completedCount).toBe(1);
    expect(profile.focusCycleStatus.conflictedCount).toBe(2);
  });

  it("flows the new behavior set through recurring weaknesses, strengths, and identity outputs", () => {
    const profile = buildNewBehaviorCoverageProfile();

    expect(profile.mostFrequentWeaknesses.map((item) => item.behaviorId)).toEqual(
      expect.arrayContaining([
        "failed_breakout_chasing",
        "premature_exit",
      ]),
    );
    expect(profile.developmentPriorities.map((item) => item.behaviorId)).toEqual(
      expect.arrayContaining([
        "failed_breakout_chasing",
        "undersized_winner",
      ]),
    );
    expect(
      [
        ...profile.improvingBehaviors.map((item) => item.behaviorId),
        ...profile.emergingStrengths.map((item) => item.behaviorId),
      ],
    ).toEqual(
      expect.arrayContaining([
        "strong_winner_management",
        "strong_loss_containment",
      ]),
    );
    expect(
      [
        "Premature profit taker",
        "Breakout chaser",
        "Behavior-led trader: strong_winner_management",
      ],
    ).toContain(profile.behaviorIdentity);
    expect(["undersized_winner", "failed_breakout_chasing"]).toContain(
      profile.topRecurringMistake?.behaviorId,
    );
    expect(["premature_exit", "undersized_winner"]).toContain(
      profile.profileSummary.mainProblem,
    );
    expect(
      [
        "strong_winner_management",
        "strong_loss_containment",
        "strong_profit_protection",
      ],
    ).toContain(profile.profileSummary.mainStrength);
  });

  it("evaluates explicit intervention periods for newly added breakout-chasing behavior", () => {
    const profile = buildFailedBreakoutInterventionProfile();
    const evaluation = profile.interventionEvaluations[0];

    expect(profile.interventionPeriods[0]?.targetBehaviorId).toBe(
      "failed_breakout_chasing",
    );
    expect(evaluation).toMatchObject({
      interventionId: "int-failed-breakout",
      targetBehaviorId: "failed_breakout_chasing",
      effectivenessLabel: "improved",
    });
    expect(evaluation.effectivenessScore).toBeGreaterThan(0);
    expect(
      profile.priorityEffectivenessSignals.find(
        (signal) => signal.behaviorId === "failed_breakout_chasing",
      )?.status,
    ).toBe("improving");
    expect(profile.interventionSummary.summaryReason).toContain(
      "No explicit intervention period is currently active",
    );
  });

  it("rotates adaptive planning when premature exit overtakes the active focus", () => {
    const profile = buildPrematureExitDriftProfile();

    expect(profile.planDriftSignals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          interventionId: "int-chasing-rotation",
          overtakingBehaviorId: "premature_exit",
        }),
      ]),
    );
    expect(profile.focusMismatchWarnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          interventionId: "int-chasing-rotation",
          currentMainProblem: "premature_exit",
        }),
      ]),
    );
    expect(profile.adaptiveDevelopmentPlan.shouldRotateFocus).toBe(true);
    expect(profile.adaptiveDevelopmentPlan.nextFocus).toBe("premature_exit");
    expect(profile.interventionSummary.biggestMismatch).toBe("premature_exit");
  });
});
