import { describe, expect, it } from "vitest";
import { PATTERN_FAMILIES } from "../../pattern-detection/types/pattern-detection-types";
import { buildFeedbackContext } from "../../__tests__/trade-feedback-test-helpers";

describe("buildTradeCoachingOutput", () => {
  it("prioritizes poor profit protection when giveback behavior dominates", () => {
    const { coachingOutput, behaviorAnalysis } = buildFeedbackContext(
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
          patternId: "balanced_management_with_premature_final_exit",
          family: PATTERN_FAMILIES.SCALING_QUALITY,
          normalizedRole: "supporting_candidate",
          structuralLevel: "storyline_composite",
        },
        {
          patternId: "add_into_weakness",
          family: PATTERN_FAMILIES.SCALING_QUALITY,
          normalizedRole: "supporting_candidate",
          structuralLevel: "structural_composite",
        },
      ],
      "failed_profit_protection_structure",
    );

    expect(behaviorAnalysis.summary.mostImportantMistakeId).toBe(
      "poor_profit_protection",
    );
    expect(coachingOutput.fixFirst).toMatchObject({
      behaviorId: "poor_profit_protection",
      behaviorClass: "destructive_mistake",
      classification: "destructive_behavior",
      priority: "fix_first",
    });
    expect(coachingOutput.fixNext).toBeNull();
    expect(coachingOutput.headline).toContain("Profit protection failed");
    expect(coachingOutput.supportingEvidence[0]?.patternId).toBe(
      "failed_profit_protection_structure",
    );
    expect(coachingOutput.mostImportantMistake?.behaviorId).toBe(
      "poor_profit_protection",
    );
    expect(coachingOutput.suppressedBehaviorIds).toContain("adding_into_weakness");
  });

  it("reinforces structured execution when no stronger mistake is present", () => {
    const { coachingOutput, behaviorAnalysis } = buildFeedbackContext(
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
      "advantaged_entry_structure",
    );

    expect(behaviorAnalysis.summary.mostImportantMistakeId).toBeNull();
    expect(behaviorAnalysis.summary.mostImportantStrengthId).toBe(
      "structured_execution",
    );
    expect(coachingOutput.fixFirst).toBeNull();
    expect(coachingOutput.fixNext).toBeNull();
    expect(coachingOutput.whatWentWrongOrRight).toContain(
      "disciplined execution",
    );
    expect(coachingOutput.suppressedBehaviorIds).toEqual(
      expect.arrayContaining(["strong_profit_protection"]),
    );
  });

  it("keeps low-priority suppressed behaviors out of the main coaching directive", () => {
    const { coachingOutput, behaviorAnalysis } = buildFeedbackContext(
      [
        {
          patternId: "add_into_weakness",
          family: PATTERN_FAMILIES.SCALING_QUALITY,
          normalizedRole: "primary_candidate",
          structuralLevel: "structural_composite",
        },
        {
          patternId: "revenge_adding_after_weakness",
          family: PATTERN_FAMILIES.SCALING_QUALITY,
          normalizedRole: "supporting_candidate",
          structuralLevel: "storyline_composite",
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

    expect(behaviorAnalysis.summary.suppressedBehaviorIds).toContain(
      "adding_into_strength",
    );
    expect(coachingOutput.fixFirst?.behaviorId).toBe("adding_into_weakness");
    expect(coachingOutput.fixNext?.behaviorId).toBe("averaging_down");
    expect(coachingOutput.supportingEvidence.every((evidence) =>
      evidence.patternId !== "add_into_strength",
    )).toBe(true);
  });

  it("keeps coaching focused on premature exit when the setup was otherwise handled cleanly", () => {
    const { coachingOutput, behaviorAnalysis } = buildFeedbackContext(
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
      "advantaged_entry_structure",
    );

    expect(behaviorAnalysis.summary.mostImportantMistakeId).toBe("premature_exit");
    expect(coachingOutput.fixFirst?.behaviorId).toBe("premature_exit");
    expect(coachingOutput.fixNext?.behaviorId).toBe("poor_profit_protection");
    expect(coachingOutput.headline).toContain("exited winner potential too early");
    expect(coachingOutput.mostImportantStrength?.behaviorId).toBe(
      "structured_execution",
    );
  });

  it("keeps weak add quality as the directive while preserving strong loss containment as the main strength", () => {
    const { coachingOutput } = buildFeedbackContext(
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
      "add_into_weakness",
    );

    expect(coachingOutput.fixFirst?.behaviorId).toBe("adding_into_weakness");
    expect(coachingOutput.mostImportantStrength?.behaviorId).toBe(
      "strong_loss_containment",
    );
    expect(coachingOutput.whatToChangeNextTime).toContain("Only add when price");
  });

  it("targets under-sized winner issues without turning the directive into vague mixed coaching", () => {
    const { coachingOutput, behaviorAnalysis } = buildFeedbackContext(
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
          patternId: "advantaged_entry_structure",
          family: PATTERN_FAMILIES.ENTRY_QUALITY,
          normalizedRole: "supporting_candidate",
          structuralLevel: "structural_composite",
        },
      ],
      "underutilized_position_building",
    );

    expect(behaviorAnalysis.summary.mostImportantMistakeId).toBe("undersized_winner");
    expect(coachingOutput.fixFirst?.behaviorId).toBe("undersized_winner");
    expect(coachingOutput.fixNext).toBeNull();
    expect(coachingOutput.headline).toContain("winner stayed too small");
  });
});
