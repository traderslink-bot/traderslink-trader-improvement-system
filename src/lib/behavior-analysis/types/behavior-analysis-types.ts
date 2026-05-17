import type {
  PatternScoringConfidence,
  PatternScorePolaritySource,
} from "../../pattern-scoring/types/pattern-scoring-result";

export type BehaviorClassification =
  | "destructive_behavior"
  | "neutral_behavior"
  | "improving_behavior"
  | "high_skill_behavior";
export type BehaviorClass =
  | "destructive_mistake"
  | "costly_mistake"
  | "neutral"
  | "improving"
  | "edge";

export type BehaviorSeverity = "low" | "moderate" | "high";
export type BehaviorConsistency = "isolated" | "reinforced" | "repeated";
export type BehaviorFrequencyBucket =
  | "single_trade_isolated"
  | "single_trade_clustered"
  | "single_trade_repeated";
export type BehaviorStructuralCorrectness =
  | "correct"
  | "incorrect"
  | "mixed";
export type BehaviorIdentityCategory =
  | "recurring_weakness_candidate"
  | "destructive_pattern"
  | "improving_strength"
  | "identity_signal";

export interface BehaviorEvidenceItem {
  patternId: string;
  family: string;
  patternType: string;
  contributionScore: number;
  finalWeightedMagnitude: number;
  polaritySource: PatternScorePolaritySource;
  normalizedRole: string;
  structuralLevel: string;
  familyInfluenceMultiplier: number;
  isPrimaryFamilyAnchor: boolean;
}

export interface BehaviorTrackingTag {
  behaviorCategory: string;
  severity: BehaviorSeverity;
  frequencyBucket: BehaviorFrequencyBucket;
}

export interface BehaviorIdentityCandidate {
  behaviorId: string;
  identityCategory: BehaviorIdentityCategory;
  identityWeight: number;
  reason: string;
}

export interface BehaviorSignal {
  behaviorId: string;
  label: string;
  behaviorCategory: string;
  classification: BehaviorClassification;
  behaviorClass: BehaviorClass;
  confidence: PatternScoringConfidence;
  reliability: PatternScoringConfidence;
  severity: BehaviorSeverity;
  consistency: BehaviorConsistency;
  frequencyBucket: BehaviorFrequencyBucket;
  signalStrength: number;
  contributionStrength: number;
  signedImpact: number;
  outcomeImpactScore: number;
  familyInfluenceStrength: number;
  structuralCorrectness: BehaviorStructuralCorrectness;
  supportingEvidence: BehaviorEvidenceItem[];
  supportingPatternIds: string[];
  supportingFamilies: string[];
  primaryDriverPatternId: string | null;
  primaryDriverFamily: string | null;
  traceFamilyDrivers: string[];
  fallbackEvidenceCount: number;
  explicitEvidenceCount: number;
  trackingTag: BehaviorTrackingTag;
  coachingPriority: "fix_first" | "reinforce_first" | "watch";
  behaviorPriorityScore: number;
  priorityReason: string;
  conflictPenalty: number;
  conflictedByBehaviorIds: string[];
  conflictResolutionReason: string | null;
  identityCategory: BehaviorIdentityCategory;
  identityWeight: number;
}

export interface BehaviorAnalysisSummary {
  dominantBehaviorIds: string[];
  secondaryBehaviorIds: string[];
  conflictingBehaviorIds: string[];
  suppressedBehaviorIds: string[];
  mostImportantMistakeId: string | null;
  mostImportantStrengthId: string | null;
  dominantBehaviorDriverFamilies: string[];
  confidence: PatternScoringConfidence;
  primaryBehavior: BehaviorSignal | null;
  resolvedBehaviorNarrative: string;
  conflictResolutionReason: string | null;
}

export interface BehaviorAnalysisResult {
  behaviorSignals: BehaviorSignal[];
  dominantBehaviors: BehaviorSignal[];
  secondaryBehaviors: BehaviorSignal[];
  suppressedBehaviors: BehaviorSignal[];
  conflictingBehaviors: BehaviorSignal[];
  primaryBehavior: BehaviorSignal | null;
  behaviorIdentityCandidates: BehaviorIdentityCandidate[];
  resolvedBehaviorNarrative: string;
  conflictResolutionReason: string | null;
  summary: BehaviorAnalysisSummary;
}
