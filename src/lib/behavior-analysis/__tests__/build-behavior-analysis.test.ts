import { describe, expect, it } from "vitest";
import { PATTERN_FAMILIES } from "../../pattern-detection/types/pattern-detection-types";
import { BEHAVIOR_DEFINITIONS } from "../registry/behavior-definitions";
import { buildFeedbackContext } from "../../__tests__/trade-feedback-test-helpers";

describe("buildBehaviorAnalysis", () => {
  it("extracts chasing as the dominant destructive behavior from chase-heavy entry evidence", () => {
    const { behaviorAnalysis } = buildFeedbackContext(
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
        {
          patternId: "late_favorable_extension_entry_structure",
          family: PATTERN_FAMILIES.ENTRY_QUALITY,
          normalizedRole: "supporting_candidate",
          structuralLevel: "structural_composite",
        },
      ],
      "breakout_chase_entry_structure",
    );

    const chasing = behaviorAnalysis.behaviorSignals.find(
      (signal) => signal.behaviorId === "chasing",
    );

    expect(chasing).toBeDefined();
    expect(chasing?.classification).toBe("destructive_behavior");
    expect(chasing?.primaryDriverPatternId).toBe(
      "breakout_chase_entry_structure",
    );
    expect(chasing?.primaryDriverFamily).toBe(PATTERN_FAMILIES.ENTRY_QUALITY);
    expect(chasing?.supportingEvidence[0]).toMatchObject({
      patternId: "breakout_chase_entry_structure",
      patternType: "composite",
      familyInfluenceMultiplier: 1,
      isPrimaryFamilyAnchor: true,
    });
    expect(chasing?.trackingTag.behaviorCategory).toBe("entry_discipline");
    expect(chasing?.behaviorClass).toBe("destructive_mistake");
    expect(chasing?.behaviorPriorityScore).toBeGreaterThan(0);
    expect(chasing?.priorityReason).toContain("outcomeImpact=");
    expect(chasing?.identityCategory).toBe("recurring_weakness_candidate");
    expect(behaviorAnalysis.summary.dominantBehaviorIds).toContain("chasing");
    expect(behaviorAnalysis.summary.mostImportantMistakeId).toBe("chasing");
    expect(behaviorAnalysis.primaryBehavior?.behaviorId).toBe("chasing");
    expect(behaviorAnalysis.summary.primaryBehavior?.behaviorId).toBe("chasing");
    expect(
      behaviorAnalysis.behaviorIdentityCandidates.find(
        (candidate) => candidate.behaviorId === "chasing",
      )?.identityWeight,
    ).toBeGreaterThan(0);
  });

  it("does not manufacture a behavior signal from non-directional position structure alone", () => {
    const { behaviorAnalysis } = buildFeedbackContext(
      [
        {
          patternId: "aggressive_scale_in",
          family: PATTERN_FAMILIES.POSITION_STRUCTURE,
          normalizedRole: "primary_candidate",
          structuralLevel: "structural_composite",
        },
        {
          patternId: "one_and_done_round_trip",
          family: PATTERN_FAMILIES.POSITION_STRUCTURE,
          normalizedRole: "supporting_candidate",
          structuralLevel: "structural_composite",
        },
      ],
      "aggressive_scale_in",
    );

    expect(behaviorAnalysis.behaviorSignals).toHaveLength(0);
    expect(behaviorAnalysis.dominantBehaviors).toHaveLength(0);
    expect(behaviorAnalysis.primaryBehavior).toBeNull();
    expect(behaviorAnalysis.summary.mostImportantMistakeId).toBeNull();
    expect(behaviorAnalysis.summary.mostImportantStrengthId).toBeNull();
  });

  it("applies priority + conflict suppression when positive and negative scaling evidence coexist", () => {
    const { behaviorAnalysis } = buildFeedbackContext(
      [
        {
          patternId: "add_into_weakness",
          family: PATTERN_FAMILIES.SCALING_QUALITY,
          normalizedRole: "primary_candidate",
          structuralLevel: "structural_composite",
        },
        {
          patternId: "add_into_strength",
          family: PATTERN_FAMILIES.SCALING_QUALITY,
          normalizedRole: "supporting_candidate",
          structuralLevel: "structural_composite",
        },
      ],
      "add_into_weakness",
    );

    expect(behaviorAnalysis.behaviorSignals.map((signal) => signal.behaviorId)).toEqual(
      expect.arrayContaining(["adding_into_weakness", "adding_into_strength"]),
    );
    const weakness = behaviorAnalysis.behaviorSignals.find(
      (signal) => signal.behaviorId === "adding_into_weakness",
    );
    const strength = behaviorAnalysis.behaviorSignals.find(
      (signal) => signal.behaviorId === "adding_into_strength",
    );

    expect(weakness?.behaviorClass).toBe("destructive_mistake");
    expect(strength?.behaviorClass).toBe("improving");
    expect(weakness?.behaviorPriorityScore).toBeGreaterThan(
      strength?.behaviorPriorityScore ?? 0,
    );
    expect(strength?.conflictPenalty).toBeGreaterThan(0);
    expect(strength?.conflictedByBehaviorIds).toContain("adding_into_weakness");
    expect(behaviorAnalysis.primaryBehavior?.behaviorId).toBe(
      "adding_into_weakness",
    );
    expect(behaviorAnalysis.summary.suppressedBehaviorIds).toContain(
      "adding_into_strength",
    );
    expect(behaviorAnalysis.conflictResolutionReason).toContain(
      "conflicted with a stronger behavior signal",
    );
    expect(behaviorAnalysis.resolvedBehaviorNarrative).toContain(
      "dominant interpretation",
    );
  });

  it("promotes failed breakout chasing above the broader chasing label when breakout failure evidence is explicit", () => {
    const { behaviorAnalysis } = buildFeedbackContext(
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
      "breakout_chase_entry_structure",
    );

    const failedBreakoutChasing = behaviorAnalysis.behaviorSignals.find(
      (signal) => signal.behaviorId === "failed_breakout_chasing",
    );
    const chasing = behaviorAnalysis.behaviorSignals.find(
      (signal) => signal.behaviorId === "chasing",
    );

    expect(failedBreakoutChasing).toBeDefined();
    expect(failedBreakoutChasing?.behaviorClass).toBe("destructive_mistake");
    expect(failedBreakoutChasing?.behaviorPriorityScore).toBeGreaterThan(
      chasing?.behaviorPriorityScore ?? 0,
    );
    expect(chasing?.conflictedByBehaviorIds).toContain("failed_breakout_chasing");
    expect(behaviorAnalysis.primaryBehavior?.behaviorId).toBe(
      "failed_breakout_chasing",
    );
  });

  it("surfaces premature exit over otherwise clean execution and still preserves strong loss containment as a secondary strength", () => {
    const { behaviorAnalysis } = buildFeedbackContext(
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
        {
          patternId: "disciplined_defensive_exit",
          family: PATTERN_FAMILIES.EXIT_QUALITY,
          normalizedRole: "supporting_candidate",
          structuralLevel: "structural_composite",
        },
      ],
      "advantaged_entry_structure",
    );

    const prematureExit = behaviorAnalysis.behaviorSignals.find(
      (signal) => signal.behaviorId === "premature_exit",
    );
    const structuredExecution = behaviorAnalysis.behaviorSignals.find(
      (signal) => signal.behaviorId === "structured_execution",
    );
    const strongLossContainment = behaviorAnalysis.behaviorSignals.find(
      (signal) => signal.behaviorId === "strong_loss_containment",
    );

    expect(prematureExit).toBeDefined();
    expect(prematureExit?.behaviorClass).toBe("destructive_mistake");
    expect(behaviorAnalysis.summary.mostImportantMistakeId).toBe("premature_exit");
    expect(structuredExecution?.behaviorClass).toBe("edge");
    expect(strongLossContainment?.behaviorClass).toBe("improving");
  });

  it("detects averaging down from rescue-add evidence without needing neutral structure alone", () => {
    const { behaviorAnalysis } = buildFeedbackContext(
      [
        {
          patternId: "add_into_weakness",
          family: PATTERN_FAMILIES.SCALING_QUALITY,
          normalizedRole: "primary_candidate",
          structuralLevel: "structural_composite",
        },
        {
          patternId: "add_after_recent_drop",
          family: PATTERN_FAMILIES.SCALING_QUALITY,
          normalizedRole: "supporting_candidate",
          structuralLevel: "structural_composite",
        },
        {
          patternId: "readd_after_delayed_risk_response",
          family: PATTERN_FAMILIES.POSITION_REDUCTION,
          normalizedRole: "supporting_candidate",
          structuralLevel: "storyline_composite",
        },
      ],
      "add_into_weakness",
    );

    const averagingDown = behaviorAnalysis.behaviorSignals.find(
      (signal) => signal.behaviorId === "averaging_down",
    );

    expect(averagingDown).toBeDefined();
    expect(averagingDown?.classification).toBe("destructive_behavior");
    expect(averagingDown?.behaviorClass).toBe("destructive_mistake");
    expect(averagingDown?.supportingEvidence.map((evidence) => evidence.patternId)).toEqual(
      expect.arrayContaining([
        "add_into_weakness",
        "add_after_recent_drop",
        "readd_after_delayed_risk_response",
      ]),
    );
  });

  it("captures under-sized winner pressure while preserving strong winner management as a conflicted strength", () => {
    const { behaviorAnalysis } = buildFeedbackContext(
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
        {
          patternId: "timely_profit_protection_with_constructive_final_exit",
          family: PATTERN_FAMILIES.SCALING_QUALITY,
          normalizedRole: "supporting_candidate",
          structuralLevel: "structural_composite",
        },
      ],
      "underutilized_position_building",
    );

    const undersizedWinner = behaviorAnalysis.behaviorSignals.find(
      (signal) => signal.behaviorId === "undersized_winner",
    );
    const strongWinnerManagement = behaviorAnalysis.behaviorSignals.find(
      (signal) => signal.behaviorId === "strong_winner_management",
    );

    expect(undersizedWinner).toBeDefined();
    expect(undersizedWinner?.behaviorClass).toBe("destructive_mistake");
    expect(strongWinnerManagement?.behaviorClass).toBe("improving");
    expect(strongWinnerManagement?.conflictedByBehaviorIds).toContain(
      "undersized_winner",
    );
  });

  it("keeps registry-owned conflict references aligned with real behavior ids", () => {
    const knownBehaviorIds = new Set(
      BEHAVIOR_DEFINITIONS.map((definition) => definition.id),
    );

    for (const definition of BEHAVIOR_DEFINITIONS) {
      for (const conflictedBehaviorId of definition.conflictsWith ?? []) {
        expect(knownBehaviorIds.has(conflictedBehaviorId)).toBe(true);
      }
    }
  });
});
