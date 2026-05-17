import type {
  BehaviorClass,
  BehaviorClassification,
  BehaviorSignal,
} from "../../behavior-analysis/types/behavior-analysis-types";
import type { PatternScoringConfidence } from "../../pattern-scoring/types/pattern-scoring-result";
import type { SessionBucket } from "../../raw-trade-timeline/types/session-context";

export type TradeFeedbackSessionSegment = "open" | "midday" | "late" | "unknown";

export interface TradeFeedbackContext {
  tradeId: string;
  tradeIndex: number;
  sessionBucket: SessionBucket;
  sessionSegment: TradeFeedbackSessionSegment;
}

export interface CoachingEvidenceItem {
  patternId: string;
  family: string;
  contributionScore: number;
}

export interface CoachingFocus {
  behaviorId: string;
  behaviorClass: BehaviorClass;
  classification: BehaviorClassification;
  priority: "fix_first" | "reinforce_first" | "watch";
  confidence: PatternScoringConfidence;
  priorityScore: number;
  priorityReason: string;
}

export interface TradeCoachingOutput {
  headline: string;
  coreIssue: string;
  supportingEvidence: CoachingEvidenceItem[];
  whatWentWrongOrRight: string;
  whatToChangeNextTime: string;
  confidence: PatternScoringConfidence;
  fixFirst: CoachingFocus | null;
  fixNext: CoachingFocus | null;
  suppressedBehaviorIds: string[];
  resolvedBehaviorNarrative: string;
  conflictResolutionReason: string | null;
  mostImportantMistake: BehaviorSignal | null;
  mostImportantStrength: BehaviorSignal | null;
  alignment: {
    dominantBehaviorIds: string[];
    dominantFamily: string | null;
    scoreBand: string;
  };
}

export interface TradeFeedbackResult {
  tradeContext: TradeFeedbackContext;
  behaviorAnalysis: import("../../behavior-analysis/types/behavior-analysis-types").BehaviorAnalysisResult;
  coachingOutput: TradeCoachingOutput;
  scenarioValidation: TradeFeedbackScenarioValidation | null;
}

export interface TradeFeedbackScenarioExpectation {
  expectedBehaviorIds?: string[];
  expectedDominantBehaviorId?: string;
  expectedCoachingFocusId?: string;
  forbiddenBehaviorIds?: string[];
}

export interface TradeFeedbackScenarioValidation {
  passed: boolean;
  checks: Array<{
    label: string;
    passed: boolean;
    details: string;
  }>;
}
