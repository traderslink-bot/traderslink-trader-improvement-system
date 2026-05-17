import type { BehaviorAnalysisResult } from "../../behavior-analysis/types/behavior-analysis-types";
import type { TradeCoachingOutput, TradeFeedbackScenarioExpectation, TradeFeedbackScenarioValidation } from "../types/trade-coaching-types";

export function validateTradeFeedbackScenario(
  behaviorAnalysis: BehaviorAnalysisResult,
  coachingOutput: TradeCoachingOutput,
  expectation: TradeFeedbackScenarioExpectation,
): TradeFeedbackScenarioValidation {
  const checks = [];
  const presentBehaviorIds = new Set(
    behaviorAnalysis.behaviorSignals.map((signal) => signal.behaviorId),
  );
  const dominantBehaviorIds = new Set(behaviorAnalysis.summary.dominantBehaviorIds);

  for (const expectedBehaviorId of expectation.expectedBehaviorIds ?? []) {
    checks.push({
      label: `expected_behavior:${expectedBehaviorId}`,
      passed: presentBehaviorIds.has(expectedBehaviorId),
      details: `Behavior ${expectedBehaviorId} ${
        presentBehaviorIds.has(expectedBehaviorId) ? "was" : "was not"
      } detected.`,
    });
  }

  for (const forbiddenBehaviorId of expectation.forbiddenBehaviorIds ?? []) {
    checks.push({
      label: `forbidden_behavior:${forbiddenBehaviorId}`,
      passed: !presentBehaviorIds.has(forbiddenBehaviorId),
      details: `Behavior ${forbiddenBehaviorId} ${
        presentBehaviorIds.has(forbiddenBehaviorId) ? "was" : "was not"
      } present.`,
    });
  }

  if (expectation.expectedDominantBehaviorId) {
    checks.push({
      label: `dominant_behavior:${expectation.expectedDominantBehaviorId}`,
      passed: dominantBehaviorIds.has(expectation.expectedDominantBehaviorId),
      details: `Dominant behaviors were [${[
        ...dominantBehaviorIds,
      ].join(", ")}].`,
    });
  }

  if (expectation.expectedCoachingFocusId) {
    checks.push({
      label: `coaching_focus:${expectation.expectedCoachingFocusId}`,
      passed:
        coachingOutput.fixFirst?.behaviorId ===
        expectation.expectedCoachingFocusId,
      details: `Prioritized focus was ${
        coachingOutput.fixFirst?.behaviorId ?? "none"
      }.`,
    });
  }

  return {
    passed: checks.every((check) => check.passed),
    checks,
  };
}
