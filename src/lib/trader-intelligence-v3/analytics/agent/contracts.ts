import type { CanonicalContentDigest } from "../../domain/identity";
import type { ExactMetricValue } from "../contracts";
import type { AnalyticalPartitionReceipt } from "../dataset";
import type {
  TradeQueryEvidenceCandidate,
  TradeQueryFilter,
  TradeQueryGrouping,
  TradeQueryMetricKey,
  TradeQueryResultRow,
} from "../query";
import type { VerifiedTradeQueryDatasetSource } from "../query/gateway";

export const ANALYTICS_AGENT_ANSWER_VERSION =
  "ti_v3_analytics_agent_answer_v1" as const;

export type AnalyticsAgentIntent =
  | "core_performance"
  | "time_of_day_performance"
  | "session_performance"
  | "ticker_performance"
  | "price_range_performance"
  | "prior_outcome_behavior"
  | "trade_sequence_behavior"
  | "repeat_attempt_behavior"
  | "holding_time_performance"
  | "direction_performance"
  | "position_size_performance"
  | "period_comparison"
  | "daily_review"
  | "weekly_review"
  | "monthly_review"
  | "prior_streak_behavior"
  | "streak_summary"
  | "pre_entry_daily_state_behavior"
  | "pre_entry_daily_path_behavior"
  | "daily_transition_summary"
  | "best_worst_day"
  | "best_worst_price_range"
  | "limited_category_summary"
  | "composed_execution_query"
  | "giveback_drawdown"
  | "fee_impact"
  | "data_quality"
  | "unsupported_market_or_setup"
  | "unsupported_exit_quality"
  | "unsupported_planned_risk"
  | "unsupported_unknown";

export type AnalyticsAgentAnswerStatus =
  | "answered"
  | "partially_answered"
  | "needs_clarification"
  | "unsupported"
  | "insufficient_sample"
  | "data_unavailable";

export interface AnalyticsAgentClarification {
  readonly code: "date_range_required" | "comparison_date_range_required";
  readonly requiredContext: readonly ("dateRange" | "comparisonDateRange")[];
  readonly prompt: string;
}

export interface AnalyticsAgentEvidenceSummary {
  readonly supportingTradeReferences: readonly TradeQueryEvidenceCandidate[];
  readonly counterexampleTradeReferences: readonly TradeQueryEvidenceCandidate[];
  readonly omittedCount: string;
}

export interface AnalyticsAgentDrillDown {
  readonly question: string;
  readonly supportedIntent: AnalyticsAgentIntent;
  readonly purpose: "evidence_review" | "segmentation" | "comparison" | "data_quality";
}

export interface AnalyticsAgentQuestionTemplate {
  readonly templateKey: string;
  readonly question: string;
  readonly requiredContext: readonly ("dateRange" | "comparisonDateRange")[];
}

/**
 * Deterministic starters for callers. Dates are deliberately supplied as
 * structured context rather than inferred from prose.
 */
export const ANALYTICS_AGENT_QUESTION_TEMPLATES: readonly AnalyticsAgentQuestionTemplate[] = Object.freeze([
  Object.freeze({ templateKey: "execution_review", question: "How did I perform in this period?", requiredContext: Object.freeze(["dateRange"] as const) }),
  Object.freeze({ templateKey: "period_comparison", question: "Compare this period with another period.", requiredContext: Object.freeze(["dateRange", "comparisonDateRange"] as const) }),
  Object.freeze({ templateKey: "loss_streak_behavior", question: "How did I trade after two losses?", requiredContext: Object.freeze(["dateRange"] as const) }),
  Object.freeze({ templateKey: "direction_breakdown", question: "How did longs compare with shorts?", requiredContext: Object.freeze(["dateRange"] as const) }),
]);

export interface AnalyticsAgentIntentResolution {
  readonly intent: AnalyticsAgentIntent;
  readonly previousOutcome: "gain" | "loss" | null;
  readonly priceRange: Readonly<{
    readonly minimum: string | null;
    readonly maximum: string | null;
  }> | null;
  readonly priorStreak: Readonly<{ readonly outcome: "gain" | "loss"; readonly minimum: string }> | null;
  readonly preEntryDailyState: "green" | "red" | null;
  readonly preEntryDailyPath: "after_first_win" | "after_first_loss" | "after_peak_profit_giveback" | null;
  readonly ranking: "ascending" | "descending" | null;
  readonly session: "premarket" | "regular" | "after_hours" | null;
}

export interface AnalyticsAgentQuestionRequest {
  readonly ownerScope: readonly string[];
  readonly accountScope: readonly string[];
  readonly question: string;
  readonly dateRange?: Readonly<{ readonly startDate: string; readonly endDate: string }>;
  /** The verified baseline range used only with the governed period-comparison preset. */
  readonly comparisonDateRange?: Readonly<{ readonly startDate: string; readonly endDate: string }>;
  readonly selectedTradeId?: string;
  readonly symbol?: string;
  readonly filters?: readonly TradeQueryFilter[];
  /**
   * A caller-supplied, engine-validated composition. This is deliberately not
   * a free-form parser: all filters and grouping are still validated by the
   * Trade Execution Analytics Engine before execution.
   */
  readonly composition?: Readonly<{
    readonly filters: readonly TradeQueryFilter[];
    readonly grouping: TradeQueryGrouping;
    readonly metrics?: readonly TradeQueryMetricKey[];
    readonly ranking?: "ascending" | "descending";
  }>;
  readonly intentHint?: AnalyticsAgentIntent;
  readonly outputMode?: "answer" | "table" | "chart";
}

export interface AnalyticsAgentExecutionRequest extends AnalyticsAgentQuestionRequest {
  readonly source: VerifiedTradeQueryDatasetSource;
  readonly partitionReceipt: AnalyticalPartitionReceipt;
}

export interface AnalyticsAgentUnsupportedReason {
  readonly code: string;
  readonly missingRequiredData: readonly string[];
  readonly safeAlternative: readonly string[];
}

export interface AnalyticsAgentAnswerPacket {
  readonly schemaVersion: typeof ANALYTICS_AGENT_ANSWER_VERSION;
  readonly status: AnalyticsAgentAnswerStatus;
  readonly originalQuestion: string;
  readonly resolvedIntent: AnalyticsAgentIntent;
  readonly capabilityKeys: readonly string[];
  readonly enginePlanDigest: CanonicalContentDigest | null;
  readonly resultDigest: CanonicalContentDigest | null;
  readonly executionReceiptDigest: CanonicalContentDigest | null;
  readonly presetDigest: CanonicalContentDigest | null;
  readonly presetExecutionDigest: CanonicalContentDigest | null;
  readonly baselinePlanDigest: CanonicalContentDigest | null;
  readonly baselineResultDigest: CanonicalContentDigest | null;
  readonly comparisonDigest: CanonicalContentDigest | null;
  readonly headline: string;
  readonly supportingMetrics: readonly ExactMetricValue[];
  readonly rankedRows: readonly TradeQueryResultRow[];
  readonly evidenceTradeReferences: readonly TradeQueryEvidenceCandidate[];
  readonly evidenceSummary: AnalyticsAgentEvidenceSummary;
  readonly evidenceOmittedCount: string;
  readonly sampleSize: string;
  readonly dateRange: Readonly<{ readonly startDate: string; readonly endDate: string }> | null;
  readonly limitationCodes: readonly string[];
  /** Claims this execution-only agent intentionally does not establish. */
  readonly notProven: readonly string[];
  readonly unsupportedReason: AnalyticsAgentUnsupportedReason | null;
  readonly clarification: AnalyticsAgentClarification | null;
  readonly followUpSuggestions: readonly string[];
  readonly drillDowns: readonly AnalyticsAgentDrillDown[];
  readonly renderHints: readonly ("metric_cards" | "table" | "bar_chart" | "evidence_list")[];
  readonly answerDigest: CanonicalContentDigest;
}

export type AnalyticsAgentPlanMetrics = readonly TradeQueryMetricKey[];
