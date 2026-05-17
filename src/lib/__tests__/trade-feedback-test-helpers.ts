import type { StructuralLevel } from "../pattern-detection/types/pattern-detection-types";
import type { NormalizedDetectedPattern } from "../pattern-normalization/types/normalized-pattern-result";
import type { SessionBucket } from "../raw-trade-timeline/types/session-context";
import { buildBehaviorAnalysis } from "../behavior-analysis/builders/build-behavior-analysis";
import { buildPatternScoringInput } from "../pattern-scoring/builders/build-pattern-scoring-input";
import { buildPatternScoringResult } from "../pattern-scoring/builders/build-pattern-scoring-result";
import { createNormalizedPattern, createNormalizedPatternResult } from "./normalized-pattern-test-helpers";
import { buildTradeCoachingOutput } from "../coaching/builders/build-trade-coaching-output";
import { buildTradeFeedbackFromScoring } from "../coaching/builders/build-trade-feedback-from-scoring";

export interface FeedbackPatternSpec {
  patternId: string;
  family: string;
  normalizedRole: NormalizedDetectedPattern["normalizedRole"];
  structuralLevel: StructuralLevel;
}

export function buildFeedbackContext(
  patternSpecs: FeedbackPatternSpec[],
  topAnchorPatternId?: string,
) {
  const patterns = patternSpecs.map((pattern) =>
    createNormalizedPattern(
      pattern.patternId,
      pattern.family,
      pattern.normalizedRole,
      pattern.structuralLevel,
    ),
  );
  const normalizedPatternResult = createNormalizedPatternResult(
    patterns,
    topAnchorPatternId,
  );
  const scoringInput = buildPatternScoringInput(normalizedPatternResult);
  const scoringResult = buildPatternScoringResult(scoringInput);
  const behaviorAnalysis = buildBehaviorAnalysis(scoringInput, scoringResult);
  const coachingOutput = buildTradeCoachingOutput(
    behaviorAnalysis,
    scoringResult,
  );

  return {
    patterns,
    normalizedPatternResult,
    scoringInput,
    scoringResult,
    behaviorAnalysis,
    coachingOutput,
  };
}

export function buildTradeFeedbackFixture(
  patternSpecs: FeedbackPatternSpec[],
  options?: {
    topAnchorPatternId?: string;
    tradeId?: string;
    tradeIndex?: number;
    sessionBucket?: SessionBucket;
  },
) {
  const context = buildFeedbackContext(
    patternSpecs,
    options?.topAnchorPatternId,
  );

  return {
    ...context,
    tradeFeedback: buildTradeFeedbackFromScoring(
      context.scoringInput,
      context.scoringResult,
      undefined,
      {
        tradeId: options?.tradeId,
        tradeIndex: options?.tradeIndex,
        sessionBucket: options?.sessionBucket,
      },
    ),
  };
}
