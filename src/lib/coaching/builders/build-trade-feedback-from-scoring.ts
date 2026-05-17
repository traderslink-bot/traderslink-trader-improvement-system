import { buildBehaviorAnalysis } from "../../behavior-analysis/builders/build-behavior-analysis";
import type { PatternScoringInput } from "../../pattern-scoring/types/pattern-scoring-input";
import type { PatternScoringResult } from "../../pattern-scoring/types/pattern-scoring-result";
import type { SessionBucket } from "../../raw-trade-timeline/types/session-context";
import type {
  TradeFeedbackResult,
  TradeFeedbackSessionSegment,
  TradeFeedbackScenarioExpectation,
} from "../types/trade-coaching-types";
import { buildTradeCoachingOutput } from "./build-trade-coaching-output";
import { validateTradeFeedbackScenario } from "./validate-trade-feedback-scenario";

function toSessionSegment(
  sessionBucket: SessionBucket,
): TradeFeedbackSessionSegment {
  switch (sessionBucket) {
    case "market_open":
    case "pre_market":
      return "open";
    case "midday":
      return "midday";
    case "close":
    case "after_hours":
      return "late";
    case "unknown":
    default:
      return "unknown";
  }
}

// 2026-04-14 America/Toronto:
// Deterministic Layer 4 bridge from scoring truth into behavior truth and
// structured coaching output. This stays downstream of scoring only.
export function buildTradeFeedbackFromScoring(
  scoringInput: PatternScoringInput,
  scoringResult: PatternScoringResult,
  expectation?: TradeFeedbackScenarioExpectation,
  options?: {
    tradeId?: string;
    tradeIndex?: number;
    sessionBucket?: SessionBucket;
  },
): TradeFeedbackResult {
  const behaviorAnalysis = buildBehaviorAnalysis(scoringInput, scoringResult);
  const coachingOutput = buildTradeCoachingOutput(
    behaviorAnalysis,
    scoringResult,
  );
  const sessionBucket = options?.sessionBucket ?? "unknown";

  return {
    tradeContext: {
      tradeId: options?.tradeId ?? `trade-${options?.tradeIndex ?? 0}`,
      tradeIndex: options?.tradeIndex ?? 0,
      sessionBucket,
      sessionSegment: toSessionSegment(sessionBucket),
    },
    behaviorAnalysis,
    coachingOutput,
    scenarioValidation: expectation
      ? validateTradeFeedbackScenario(
          behaviorAnalysis,
          coachingOutput,
          expectation,
        )
      : null,
  };
}
