import type { CanonicalContentDigest } from "../../domain/identity";
import type { ExactMetricValue } from "../contracts";
import type {
  TradeQueryFilter,
  TradeQueryComparison,
  TradeQueryMetricKey,
  TradeQueryResultRow,
} from "../query/contracts";
import type { TradeQueryEvidenceCandidate } from "../query/evidence";

export const COACH_ANALYTICS_RESULT_VERSION =
  "ti_v3_coach_analytics_result_v1" as const;
export const COACH_ANALYTICS_SEMANTIC_VERSION = "v1" as const;

export type CoachIntentKey =
  | "rank_negative_performance_drivers"
  | "rank_positive_performance_drivers"
  | "time_window_performance"
  | "session_performance"
  | "hold_time_performance"
  | "intraday_drawdown_analysis"
  | "day_outcome_consistency"
  | "losers_held_too_long"
  | "winners_cut_too_early"
  | "prior_outcome_performance"
  | "after_win_performance"
  | "after_two_losses_performance"
  | "after_three_losses_performance"
  | "trades_after_daily_green"
  | "trades_after_daily_red"
  | "first_vs_later_trade_performance"
  | "fourth_and_later_trade_performance"
  | "overtrading_analysis"
  | "behaviour_leak_ranking"
  | "behaviour_rule_candidate_ranking"
  | "profit_giveback_analysis"
  | "price_range_performance"
  | "ticker_performance_ranking"
  | "trade_sequence_performance"
  | "position_size_performance"
  | "habit_trend_analysis"
  | "rule_candidate_ranking"
  | "setup_tag_performance"
  | "mistake_tag_performance";

export type CoachCapabilityKey =
  | "core_performance_summary"
  | "daily_performance"
  | "weekly_performance"
  | "monthly_performance"
  | "session_performance"
  | "intraday_drawdown_analysis"
  | "day_outcome_consistency"
  | "losers_held_too_long"
  | "winners_cut_too_early"
  | "time_window_performance"
  | "price_range_performance"
  | "ticker_performance"
  | "trade_sequence_performance"
  | "prior_outcome_performance"
  | "after_win_performance"
  | "after_two_losses_performance"
  | "after_three_losses_performance"
  | "trades_after_daily_green"
  | "trades_after_daily_red"
  | "first_vs_later_trade_performance"
  | "fourth_and_later_trade_performance"
  | "repeat_ticker_attempts"
  | "hold_time_performance"
  | "direction_performance"
  | "position_size_performance"
  | "profit_giveback_analysis"
  | "overtrading_analysis"
  | "rule_candidate_ranking"
  | "setup_tag_performance"
  | "mistake_tag_performance"
  | "habit_trend_analysis";

export type CoachComparisonType =
  | "none"
  | "group_vs_baseline"
  | "current_period_vs_prior_period"
  | "best_vs_worst_group"
  | "target_condition_vs_all_other"
  | "first_n_vs_later"
  | "after_loss_vs_not_after_loss"
  | "repeat_ticker_vs_first_attempt"
  | "green_day_vs_red_day"
  | "gross_vs_net"
  | "with_fee_authority_vs_missing_fee_authority";

export type CoachSampleSizeStatus =
  | "meets_minimum_sample"
  | "insufficient_sample_size";
export type CoachAuthorityStatus = "verified_execution_only" | "limited" | "unsupported";
export type CoachFindingCode =
  | "biggest_negative_leak"
  | "biggest_positive_strength"
  | "worst_time_window"
  | "best_time_window"
  | "after_loss_weakness"
  | "after_win_weakness"
  | "overtrading_detected"
  | "giveback_detected"
  | "intraday_drawdown_detected"
  | "day_outcome_consistency"
  | "weak_hold_time"
  | "weak_price_range"
  | "weak_ticker"
  | "repeat_ticker_weakness"
  | "late_trade_weakness"
  | "large_size_weakness"
  | "best_rule_candidate"
  | "period_trend"
  | "insufficient_data"
  | "unsupported_data";

export interface CoachFinding {
  readonly findingCode: CoachFindingCode;
  readonly capabilityKey: CoachCapabilityKey;
  readonly groupIdentity: string | null;
  readonly groupLabel: string | null;
  readonly metric: ExactMetricValue | null;
  readonly sampleSize: string;
  readonly evidence: readonly TradeQueryEvidenceCandidate[];
  readonly limitationCodes: readonly string[];
  readonly ruleCandidateKey: string | null;
  readonly ruleCandidateStatus: "rule_to_test" | "not_applicable";
}

export interface CoachMetricTable {
  readonly sourceQueryResultDigest: CanonicalContentDigest;
  readonly rows: readonly TradeQueryResultRow[];
}

export interface CoachAnalyticsResult {
  readonly schemaVersion: typeof COACH_ANALYTICS_RESULT_VERSION;
  readonly semanticVersion: typeof COACH_ANALYTICS_SEMANTIC_VERSION;
  readonly intentKey: CoachIntentKey;
  readonly capabilityKey: CoachCapabilityKey;
  readonly normalizedFilters: readonly TradeQueryFilter[];
  readonly normalizedMetrics: readonly TradeQueryMetricKey[];
  readonly normalizedDimensions: readonly string[];
  readonly comparisonType: CoachComparisonType;
  readonly includedTradeCount: string;
  readonly excludedTradeCount: string;
  readonly unavailableTradeCount: string;
  readonly sampleSizeStatus: CoachSampleSizeStatus;
  readonly authorityStatus: CoachAuthorityStatus;
  readonly limitationCodes: readonly string[];
  readonly primaryFinding: CoachFinding | null;
  readonly secondaryFindings: readonly CoachFinding[];
  readonly rankedFindingList: readonly CoachFinding[];
  readonly metricTables: readonly CoachMetricTable[];
  readonly evidenceTradeReferences: readonly TradeQueryEvidenceCandidate[];
  readonly evidenceOmittedCount: string;
  readonly comparison: TradeQueryComparison | null;
  readonly digestReplayIdentity: Readonly<{
    readonly queryPlanDigest: CanonicalContentDigest | null;
    readonly queryResultDigest: CanonicalContentDigest | null;
    readonly queryExecutionReceiptDigest: CanonicalContentDigest | null;
    readonly baselineQueryPlanDigest: CanonicalContentDigest | null;
    readonly baselineQueryResultDigest: CanonicalContentDigest | null;
    readonly comparisonDigest: CanonicalContentDigest | null;
  }>;
  readonly unsupportedData: Readonly<{
    readonly code: string;
    readonly requiredData: readonly string[];
  }> | null;
  readonly coachResultDigest: CanonicalContentDigest;
}
