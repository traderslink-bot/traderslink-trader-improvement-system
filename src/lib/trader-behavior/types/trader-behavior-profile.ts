import type {
  BehaviorClass,
  BehaviorIdentityCategory,
  BehaviorSeverity,
} from "../../behavior-analysis/types/behavior-analysis-types";

export interface AggregatedBehaviorStats {
  behaviorId: string;
  occurrenceCount: number;
  primaryCount: number;
  totalSeverityScore: number;
  averageSeverityScore: number;
  averagePriorityScore: number;
  totalPriorityScore: number;
  classBreakdown: Record<BehaviorClass, number>;
  latestBehaviorClass: BehaviorClass;
  identityCategoryBreakdown: Record<BehaviorIdentityCategory, number>;
}

export interface RankedBehaviorInsight {
  behaviorId: string;
  count: number;
  averagePriorityScore: number;
  averageSeverityScore: number;
  reason: string;
}

export type TraderProfileConfidence = "high" | "moderate" | "low";
export type TraderSessionSegment = "open" | "midday" | "late" | "unknown";

export interface SessionBehaviorInsight {
  sessionSegment: TraderSessionSegment;
  behaviors: RankedBehaviorInsight[];
}

export interface BehaviorTrendInsight {
  behaviorId: string;
  direction: "improving" | "deteriorating";
  delta: number;
  reason: string;
}

export interface TraderBehaviorIdentity {
  behaviorIdentity: string;
  identityConfidence: TraderProfileConfidence;
  identityReason: string;
}

export interface TraderProfileConfidenceSupport {
  tradeCount: number;
  repeatedBehaviorCount: number;
  dominantBehaviorId: string | null;
  dominantIssueShare: number;
  conflictIndex: number;
  recencySupport: boolean;
  supportScore: number;
}

export interface DevelopmentPriorityInsight extends RankedBehaviorInsight {
  developmentPriorityScore: number;
  developmentPriorityReason: string;
  primaryRate: number;
  destructiveClassRate: number;
  averageOutcomeCostScore: number;
  deteriorationDelta: number;
  sessionConcentration: number;
  dominantSessionSegment: TraderSessionSegment | null;
}

export interface DevelopmentPlanTarget {
  behaviorId: string;
  reason: string;
}

export interface SessionFocusTarget extends DevelopmentPlanTarget {
  sessionSegment: TraderSessionSegment;
}

export interface DevelopmentPlan {
  fixFirst: DevelopmentPlanTarget | null;
  fixSecond: DevelopmentPlanTarget | null;
  protectStrength: DevelopmentPlanTarget | null;
  sessionFocus: SessionFocusTarget | null;
  planReason: string;
}

export interface BehaviorStreakInsight {
  behaviorId: string;
  startTradeId: string;
  endTradeId: string;
  startTradeIndex: number;
  endTradeIndex: number;
  length: number;
  averagePriorityScore: number;
  averageSeverityScore: number;
  reason: string;
}

export interface RelapseSignal {
  behaviorId: string;
  baselineEndTradeId: string;
  relapseStartTradeId: string;
  relapseEndTradeId: string;
  reason: string;
}

export interface StabilizationSignal {
  behaviorId: string;
  startTradeId: string;
  endTradeId: string;
  reason: string;
}

export interface SessionDevelopmentInsight {
  sessionSegment: TraderSessionSegment;
  tradeCount: number;
  primaryWeakness: string | null;
  primaryStrength: string | null;
  sessionFixFirst: string | null;
  sessionReason: string;
}

export interface ProfileSummary {
  identityHeadline: string;
  mainProblem: string | null;
  mainStrength: string | null;
  largestSessionRisk: string | null;
  nextFocus: string | null;
  progressHeadline?: string | null;
  worseningRisk?: string | null;
}

export interface AnalysisWindowSummary {
  label: "baseline" | "recent" | "full_history";
  tradeCount: number;
  tradeIds: string[];
  startTradeId: string | null;
  endTradeId: string | null;
  startTradeIndex: number | null;
  endTradeIndex: number | null;
}

export interface AnalysisWindows {
  baseline: AnalysisWindowSummary;
  recent: AnalysisWindowSummary;
  fullHistory: AnalysisWindowSummary;
  lowSampleCaution: boolean;
}

export interface BehaviorProgressWindow {
  tradeCount: number;
  occurrenceCount: number;
  frequencyRate: number;
  averageSeverityScore: number;
  primaryRate: number;
  destructiveRate: number;
  positiveRate: number;
}

export interface BehaviorProgressInsight {
  behaviorId: string;
  direction: "improving" | "mixed" | "regressing" | "stable" | "too_early";
  confidence: TraderProfileConfidence;
  reason: string;
  baselineWindow: BehaviorProgressWindow;
  recentWindow: BehaviorProgressWindow;
  recurrenceStability: number;
  classShift: string;
}

export interface TraderProgressSupport {
  worseningBehaviorCount: number;
  improvingBehaviorCount: number;
  relapseCount: number;
  stabilizationCount: number;
  emergingRiskCount: number;
  fadingStrengthCount: number;
  sessionImprovementCount: number;
  baselineTradeCount: number;
  recentTradeCount: number;
  weightedScore: number;
}

export interface RegressionSignal {
  behaviorId: string;
  type:
    | "recurring_issue_worsening"
    | "destructive_return"
    | "new_destructive_behavior"
    | "edge_fading";
  severity: TraderProfileConfidence;
  reason: string;
}

export interface EmergingRiskInsight {
  behaviorId: string;
  reason: string;
}

export interface FadingStrengthInsight {
  behaviorId: string;
  reason: string;
}

export interface InterventionReadiness {
  ready: boolean;
  reason: string;
  baselineTradeCount: number;
  recentTradeCount: number;
}

export interface InterventionPeriod {
  interventionId: string;
  targetBehaviorId: string | null;
  focusKey: string;
  interventionType:
    | "reduce_mistake"
    | "protect_strength"
    | "build_strength"
    | "custom_focus";
  goalType:
    | "reduce_destructive_behavior"
    | "reduce_frequency"
    | "reduce_severity"
    | "protect_edge"
    | "build_edge"
    | "custom_goal";
  startTradeId: string;
  startTradeIndex: number;
  endTradeId: string | null;
  endTradeIndex: number | null;
  notes: string | null;
  metadata: Record<string, string> | null;
}

export interface InterventionPeriodInput {
  interventionId: string;
  targetBehaviorId?: string | null;
  focusKey?: string | null;
  interventionType:
    | "reduce_mistake"
    | "protect_strength"
    | "build_strength"
    | "custom_focus";
  goalType:
    | "reduce_destructive_behavior"
    | "reduce_frequency"
    | "reduce_severity"
    | "protect_edge"
    | "build_edge"
    | "custom_goal";
  startTradeId?: string;
  startTradeIndex?: number;
  endTradeId?: string | null;
  endTradeIndex?: number | null;
  notes?: string | null;
  metadata?: Record<string, string> | null;
}

export interface InterventionEvaluationWindow extends BehaviorProgressWindow {
  label: "before" | "during" | "after";
}

export interface InterventionEvaluation {
  interventionId: string;
  targetBehaviorId: string | null;
  effectivenessLabel: "improved" | "flat" | "worsened" | "too_early";
  effectivenessScore: number;
  effectivenessReason: string;
  supportingMetrics: {
    before: InterventionEvaluationWindow;
    during: InterventionEvaluationWindow;
    after: InterventionEvaluationWindow | null;
    recurrenceStability: number;
    sessionChange: string | null;
  };
  confidence: TraderProfileConfidence;
}

export interface FocusCycle {
  interventionId: string;
  focusKey: string;
  targetBehaviorId: string | null;
  status: "active" | "completed" | "abandoned" | "conflicted";
  startTradeId: string;
  endTradeId: string | null;
  reason: string;
  overlappingInterventionIds: string[];
}

export interface FocusCycleStatus {
  activeCount: number;
  completedCount: number;
  abandonedCount: number;
  conflictedCount: number;
}

export interface PlanAdherenceSignal {
  interventionId: string;
  targetBehaviorId: string | null;
  status: "aligned" | "working_but_unresolved" | "not_aligned" | "too_early";
  reason: string;
}

export interface PlanDriftSignal {
  interventionId: string;
  targetBehaviorId: string | null;
  overtakingBehaviorId: string | null;
  reason: string;
}

export interface FocusMismatchWarning {
  interventionId: string;
  targetBehaviorId: string | null;
  currentMainProblem: string | null;
  reason: string;
}

export interface PriorityEffectivenessSignal {
  behaviorId: string;
  status: "improving" | "unchanged" | "worsening" | "too_early";
  reason: string;
  baselineWindow: BehaviorProgressWindow;
  recentWindow: BehaviorProgressWindow;
}

export interface AdaptiveDevelopmentPlan {
  currentFocus: string | null;
  nextFocus: string | null;
  deEscalatedFocuses: string[];
  escalatingRisks: string[];
  protectionPriorities: string[];
  currentInterventionRecommendation: string | null;
  shouldContinueFocus: boolean;
  shouldRotateFocus: boolean;
  rotationReason: string | null;
  tooEarlyToJudge: boolean;
  adaptiveReason: string;
}

export interface InterventionSummary {
  activeFocus: string | null;
  focusEffectiveness: string | null;
  biggestMismatch: string | null;
  nextRecommendedAction: string | null;
  summaryReason: string;
}

export interface TraderBehaviorProfile {
  tradeCount: number;
  aggregatedBehaviors: AggregatedBehaviorStats[];
  mostFrequentWeaknesses: RankedBehaviorInsight[];
  mostDestructiveBehaviors: RankedBehaviorInsight[];
  improvingBehaviors: RankedBehaviorInsight[];
  emergingStrengths: RankedBehaviorInsight[];
  behaviorIdentity: string;
  identityConfidence: TraderProfileConfidence;
  identityReason: string;
  profileConfidence: TraderProfileConfidence;
  profileConfidenceReason: string;
  profileConfidenceSupport: TraderProfileConfidenceSupport;
  developmentPriorities: DevelopmentPriorityInsight[];
  topRecurringMistake: RankedBehaviorInsight | null;
  secondRecurringMistake: RankedBehaviorInsight | null;
  improvementPriorityOrder: string[];
  developmentPlan: DevelopmentPlan;
  sessionWeaknesses: SessionBehaviorInsight[];
  sessionStrengths: SessionBehaviorInsight[];
  sessionDevelopmentInsights: SessionDevelopmentInsight[];
  improvingTrends: BehaviorTrendInsight[];
  deterioratingTrends: BehaviorTrendInsight[];
  destructiveStreaks: BehaviorStreakInsight[];
  improvingStreaks: BehaviorStreakInsight[];
  relapseSignals: RelapseSignal[];
  stabilizationSignals: StabilizationSignal[];
  analysisWindows: AnalysisWindows;
  behaviorProgress: BehaviorProgressInsight[];
  progressScore: number;
  progressLabel:
    | "strong_improvement"
    | "improving"
    | "mixed"
    | "regressing"
    | "unstable";
  progressReason: string;
  progressSupport: TraderProgressSupport;
  regressionSignals: RegressionSignal[];
  emergingRisks: EmergingRiskInsight[];
  fadingStrengths: FadingStrengthInsight[];
  interventionPeriods: InterventionPeriod[];
  interventionEvaluations: InterventionEvaluation[];
  focusCycles: FocusCycle[];
  currentFocusCycle: FocusCycle | null;
  focusCycleStatus: FocusCycleStatus;
  planAdherenceSignals: PlanAdherenceSignal[];
  planDriftSignals: PlanDriftSignal[];
  focusMismatchWarnings: FocusMismatchWarning[];
  interventionReadiness: InterventionReadiness;
  priorityEffectivenessSignals: PriorityEffectivenessSignal[];
  adaptiveDevelopmentPlan: AdaptiveDevelopmentPlan;
  interventionSummary: InterventionSummary;
  profileSummary: ProfileSummary;
}
