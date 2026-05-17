import { describe, expect, it } from "vitest";
import { PATTERN_FAMILIES } from "../../pattern-detection/types/pattern-detection-types";
import { buildPatternScoringInput } from "../../pattern-scoring/builders/build-pattern-scoring-input";
import { buildPatternScoringResult } from "../../pattern-scoring/builders/build-pattern-scoring-result";
import { createNormalizedPattern, createNormalizedPatternResult } from "../../__tests__/normalized-pattern-test-helpers";
import { buildTradeFeedbackFromScoring } from "../builders/build-trade-feedback-from-scoring";

function buildScenarioFeedback(
  patterns: Array<{
    patternId: string;
    family: string;
    normalizedRole: "primary_candidate" | "supporting_candidate" | "context_only";
    structuralLevel: "atomic" | "structural_composite" | "storyline_composite";
  }>,
  topAnchorPatternId?: string,
) {
  const normalizedPatterns = patterns.map((pattern) =>
    createNormalizedPattern(
      pattern.patternId,
      pattern.family,
      pattern.normalizedRole,
      pattern.structuralLevel,
    ),
  );
  const normalizedResult = createNormalizedPatternResult(
    normalizedPatterns,
    topAnchorPatternId,
  );
  const scoringInput = buildPatternScoringInput(normalizedResult);
  const scoringResult = buildPatternScoringResult(scoringInput);

  return {
    scoringInput,
    scoringResult,
  };
}

describe("trade feedback scenario validation", () => {
  it("validates a fomo scenario as chasing-led feedback", () => {
    const { scoringInput, scoringResult } = buildScenarioFeedback(
      [
        {
          patternId: "breakout_chase_entry_structure",
          family: PATTERN_FAMILIES.ENTRY_QUALITY,
          normalizedRole: "primary_candidate",
          structuralLevel: "structural_composite",
        },
        {
          patternId: "opening_range_breakout_chase_entry_structure",
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

    const feedback = buildTradeFeedbackFromScoring(scoringInput, scoringResult, {
      expectedBehaviorIds: ["chasing"],
      expectedDominantBehaviorId: "chasing",
      expectedCoachingFocusId: "chasing",
      forbiddenBehaviorIds: ["structured_execution"],
    });

    expect(feedback.scenarioValidation?.passed).toBe(true);
    expect(feedback.coachingOutput.fixFirst?.behaviorId).toBe(
      "chasing",
    );
    expect(feedback.behaviorAnalysis.summary.dominantBehaviorIds).toContain(
      "chasing",
    );
  });

  it("validates a trend-management scenario as structured execution with strong protection", () => {
    const { scoringInput, scoringResult } = buildScenarioFeedback(
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

    const feedback = buildTradeFeedbackFromScoring(scoringInput, scoringResult, {
      expectedBehaviorIds: ["structured_execution", "strong_profit_protection"],
      expectedDominantBehaviorId: "structured_execution",
      forbiddenBehaviorIds: ["chasing"],
    });

    expect(feedback.scenarioValidation?.passed).toBe(true);
    expect(feedback.coachingOutput.fixFirst).toBeNull();
    expect(feedback.behaviorAnalysis.summary.primaryBehavior?.behaviorId).toBe(
      "structured_execution",
    );
  });

  it("keeps pure structural-context scenarios from producing a coaching focus", () => {
    const { scoringInput, scoringResult } = buildScenarioFeedback(
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

    const feedback = buildTradeFeedbackFromScoring(scoringInput, scoringResult);

    expect(feedback.behaviorAnalysis.behaviorSignals).toHaveLength(0);
    expect(feedback.coachingOutput.fixFirst).toBeNull();
    expect(feedback.coachingOutput.coreIssue).toContain(
      "too mixed to elevate one destructive issue",
    );
  });

  it("carries stable trade context fields through the feedback bridge", () => {
    const { scoringInput, scoringResult } = buildScenarioFeedback(
      [
        {
          patternId: "advantaged_entry_structure",
          family: PATTERN_FAMILIES.ENTRY_QUALITY,
          normalizedRole: "primary_candidate",
          structuralLevel: "structural_composite",
        },
      ],
      "advantaged_entry_structure",
    );

    const feedback = buildTradeFeedbackFromScoring(
      scoringInput,
      scoringResult,
      undefined,
      {
        tradeId: "trade-42",
        tradeIndex: 42,
        sessionBucket: "after_hours",
      },
    );

    expect(feedback.tradeContext).toMatchObject({
      tradeId: "trade-42",
      tradeIndex: 42,
      sessionBucket: "after_hours",
      sessionSegment: "late",
    });
  });
});
