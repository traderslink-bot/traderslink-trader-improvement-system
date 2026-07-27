import { contractFailure, type AnalyticalContractFailure } from "../contracts";
import {
  buildTradeQueryPlan,
  compileGa1BPreset,
  openReadOnlyTradeQueryGateway,
  TRADE_QUERY_POLICY,
  type Ga1BPreset,
  type Ga1BPresetKey,
  type TradeQueryFilter,
  type TradeQueryGrouping,
  type TradeQueryMetricKey,
  type TradeQueryPlan,
} from "../query";
import type { AnalyticsAgentExecutionRequest, AnalyticsAgentIntentResolution } from "./contracts";

const CORE_METRICS = Object.freeze([
  "candidate_count", "included_count", "excluded_count", "gross_pnl", "net_pnl",
  "signed_charges", "gross_net_difference", "win_rate", "expectancy", "profit_factor",
] as const satisfies readonly TradeQueryMetricKey[]);

const DATA_QUALITY_METRICS = Object.freeze([
  "candidate_count", "included_count", "excluded_count", "limited_analytical_trade_count",
  "missing_charge_coverage_trade_count", "missing_share_quantity_authority_count",
  "missing_entry_notional_authority_count", "unavailable_source_authority_trade_count",
] as const satisfies readonly TradeQueryMetricKey[]);

const REVIEW_METRICS = Object.freeze([
  "candidate_count", "included_count", "excluded_count", "net_pnl", "gross_pnl", "win_rate", "expectancy", "profit_factor",
  "best_trading_day", "worst_trading_day", "green_to_red_day_count", "red_to_green_day_count",
] as const satisfies readonly TradeQueryMetricKey[]);

const STREAK_METRICS = Object.freeze([
  "candidate_count", "included_count", "excluded_count", "net_pnl", "longest_winning_trade_streak", "longest_losing_trade_streak",
  "current_winning_trade_streak", "current_losing_trade_streak",
] as const satisfies readonly TradeQueryMetricKey[]);

const MAX_COMPOSITION_FILTERS = 6;
const MAX_COMPOSITION_METRICS = 16;
const IMMUTABLE_COMPOSITION_FILTERS = new Set<TradeQueryFilter["kind"]>([
  "account", "currency", "date_range",
]);

interface PlanDefinition {
  readonly capabilityKey: string;
  readonly execution: "direct" | "preset";
  readonly grouping?: TradeQueryGrouping;
  readonly metrics?: readonly TradeQueryMetricKey[];
  readonly filters?: readonly TradeQueryFilter[];
  readonly presetKey?: Ga1BPresetKey;
  readonly requiresDateRange?: boolean;
  readonly ranking?: "ascending" | "descending";
}

function exactScope(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)].sort());
}

function sameScope(left: readonly string[], right: readonly string[]): boolean {
  const a = exactScope(left);
  const b = exactScope(right);
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function validateComposition(
  request: AnalyticsAgentExecutionRequest,
): { readonly ok: true } | { readonly ok: false; readonly error: AnalyticalContractFailure } {
  const composition = request.composition;
  if (composition === undefined) return { ok: true };
  if (composition.filters.length > MAX_COMPOSITION_FILTERS) {
    return contractFailure("ti_v3_analytics_contract_oversized", "$.analyticsAgent.composition.filters");
  }
  if (composition.metrics !== undefined && composition.metrics.length > MAX_COMPOSITION_METRICS) {
    return contractFailure("ti_v3_analytics_contract_oversized", "$.analyticsAgent.composition.metrics");
  }
  if (composition.filters.some((filter) => IMMUTABLE_COMPOSITION_FILTERS.has(filter.kind))) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.analyticsAgent.composition.filters");
  }
  return { ok: true };
}

function definition(resolution: AnalyticsAgentIntentResolution): PlanDefinition | null {
  switch (resolution.intent) {
    case "core_performance":
      return { capabilityKey: "core_performance", execution: "direct", grouping: { kind: "aggregate" }, metrics: CORE_METRICS, filters: [] };
    case "time_of_day_performance":
      return { capabilityKey: "time_and_session_performance", execution: "direct", grouping: { kind: "time_bucket", source: "entry", bucketMinutes: "60" }, metrics: CORE_METRICS, filters: [] };
    case "session_performance":
      return resolution.session === null
        ? { capabilityKey: "time_and_session_performance", execution: "direct", grouping: { kind: "session" }, metrics: CORE_METRICS, filters: [], ranking: resolution.ranking ?? "descending" }
        : { capabilityKey: "time_and_session_performance", execution: "direct", grouping: { kind: "aggregate" }, metrics: CORE_METRICS, filters: [{ kind: "session", values: [resolution.session] }] };
    case "ticker_performance":
      return { capabilityKey: "ticker_price_size_hold_direction", execution: "direct", grouping: { kind: "symbol" }, metrics: CORE_METRICS, filters: [], ranking: resolution.ranking ?? "ascending" };
    case "price_range_performance":
      return resolution.priceRange === null
        ? { capabilityKey: "ticker_price_size_hold_direction", execution: "direct", grouping: { kind: "entry_price_range", boundaries: ["1", "5", "10"] }, metrics: CORE_METRICS, filters: [] }
        : { capabilityKey: "ticker_price_size_hold_direction", execution: "direct", grouping: { kind: "aggregate" }, metrics: CORE_METRICS, filters: [{ kind: "entry_price_range", ...resolution.priceRange }] };
    case "prior_outcome_behavior":
      return { capabilityKey: "sequencing_and_behavior", execution: "direct", grouping: { kind: "aggregate" }, metrics: CORE_METRICS, filters: [{ kind: "previous_completed_outcome", values: [resolution.previousOutcome ?? "loss"] }] };
    case "trade_sequence_behavior":
      return { capabilityKey: "sequencing_and_behavior", execution: "direct", grouping: { kind: "trade_sequence_bucket" }, metrics: CORE_METRICS, filters: [] };
    case "repeat_attempt_behavior":
      return { capabilityKey: "sequencing_and_behavior", execution: "direct", grouping: { kind: "repeat_attempt_bucket" }, metrics: CORE_METRICS, filters: [] };
    case "holding_time_performance":
      return { capabilityKey: "ticker_price_size_hold_direction", execution: "preset", presetKey: "analyze_holding_time" };
    case "direction_performance":
      return { capabilityKey: "ticker_price_size_hold_direction", execution: "preset", presetKey: "analyze_long_vs_short" };
    case "position_size_performance":
      return { capabilityKey: "ticker_price_size_hold_direction", execution: "preset", presetKey: "analyze_position_size_performance" };
    case "period_comparison":
      return { capabilityKey: "daily_and_period_performance", execution: "preset", presetKey: "compare_periods" };
    case "daily_review":
      return { capabilityKey: "daily_and_period_performance", execution: "direct", grouping: { kind: "day" }, metrics: REVIEW_METRICS, filters: [], requiresDateRange: true };
    case "weekly_review":
      return { capabilityKey: "daily_and_period_performance", execution: "direct", grouping: { kind: "week" }, metrics: REVIEW_METRICS, filters: [], requiresDateRange: true };
    case "monthly_review":
      return { capabilityKey: "daily_and_period_performance", execution: "direct", grouping: { kind: "month" }, metrics: REVIEW_METRICS, filters: [], requiresDateRange: true };
    case "prior_streak_behavior":
      return { capabilityKey: "sequencing_and_behavior", execution: "direct", grouping: { kind: "aggregate" }, metrics: CORE_METRICS, filters: resolution.priorStreak === null ? [] : [{ kind: "prior_completed_streak", outcome: resolution.priorStreak.outcome, minimum: resolution.priorStreak.minimum, maximum: null }] };
    case "streak_summary":
      return { capabilityKey: "sequencing_and_behavior", execution: "direct", grouping: { kind: "aggregate" }, metrics: STREAK_METRICS, filters: [] };
    case "pre_entry_daily_state_behavior":
      return { capabilityKey: "pre_entry_daily_state", execution: "direct", grouping: { kind: "aggregate" }, metrics: CORE_METRICS, filters: resolution.preEntryDailyState === null ? [] : [{ kind: "pre_entry_daily_state", values: [resolution.preEntryDailyState] }] };
    case "pre_entry_daily_path_behavior":
      return { capabilityKey: "pre_entry_daily_state", execution: "direct", grouping: { kind: "aggregate" }, metrics: CORE_METRICS, filters: resolution.preEntryDailyPath === null ? [] : [{ kind: "pre_entry_daily_path", values: [resolution.preEntryDailyPath] }] };
    case "daily_transition_summary":
      return { capabilityKey: "giveback_and_drawdown", execution: "direct", grouping: { kind: "aggregate" }, metrics: ["candidate_count", "included_count", "excluded_count", "net_pnl", "green_to_red_day_count", "red_to_green_day_count", "maximum_peak_profit_giveback"], filters: [] };
    case "best_worst_day":
      return { capabilityKey: "daily_and_period_performance", execution: "direct", grouping: { kind: "day" }, metrics: CORE_METRICS, filters: [], ranking: resolution.ranking ?? "ascending" };
    case "best_worst_price_range":
      return { capabilityKey: "ticker_price_size_hold_direction", execution: "direct", grouping: { kind: "entry_price_range", boundaries: ["1", "2", "5", "10"] }, metrics: CORE_METRICS, filters: [], ranking: resolution.ranking ?? "ascending" };
    case "limited_category_summary":
      return { capabilityKey: "limited_ticker_pnl_summary", execution: "direct", grouping: { kind: "symbol" }, metrics: CORE_METRICS, filters: [], ranking: resolution.ranking ?? "ascending" };
    case "composed_execution_query":
      return { capabilityKey: "composed_execution_query", execution: "direct", grouping: { kind: "aggregate" }, metrics: CORE_METRICS, filters: [] };
    case "giveback_drawdown":
      return { capabilityKey: "giveback_and_drawdown", execution: "direct", grouping: { kind: "day" }, metrics: ["candidate_count", "included_count", "excluded_count", "net_pnl", "maximum_intraday_drawdown", "maximum_peak_profit_giveback"], filters: [] };
    case "fee_impact":
      return { capabilityKey: "charges_and_fee_impact", execution: "direct", grouping: { kind: "aggregate" }, metrics: ["candidate_count", "included_count", "excluded_count", "gross_pnl", "net_pnl", "signed_charges", "gross_net_difference", "fees_as_percentage_of_gross_profit"], filters: [] };
    case "data_quality":
      return { capabilityKey: "deterministic_findings_and_samples", execution: "direct", grouping: { kind: "aggregate" }, metrics: DATA_QUALITY_METRICS, filters: [] };
    default:
      return null;
  }
}

export function buildAnalyticsAgentPlan(
  request: AnalyticsAgentExecutionRequest,
  resolution: AnalyticsAgentIntentResolution,
): { readonly ok: true; readonly value: Readonly<{ readonly capabilityKey: string; readonly plan: TradeQueryPlan | null; readonly preset: Ga1BPreset | null }> } | { readonly ok: false; readonly error: AnalyticalContractFailure } {
  const effectiveResolution = request.composition === undefined
    ? resolution
    : Object.freeze({ ...resolution, intent: "composed_execution_query" as const });
  const selected = definition(effectiveResolution);
  if (selected === null) return contractFailure("ti_v3_analytics_contract_invalid", "$.analyticsAgent.intent");
  const gateway = openReadOnlyTradeQueryGateway(request.source, request.partitionReceipt);
  if (!gateway.ok) return gateway;
  if (!sameScope(request.ownerScope, request.partitionReceipt.ownerScope) || !sameScope(request.accountScope, request.partitionReceipt.accountScope)) {
    return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.analyticsAgent.scope");
  }
  const compositionValidation = validateComposition(request);
  if (!compositionValidation.ok) return compositionValidation;
  if (selected.requiresDateRange && request.dateRange === undefined) return contractFailure("ti_v3_analytics_contract_invalid", "$.analyticsAgent.dateRange");
  const composition = request.composition;
  const filters: TradeQueryFilter[] = [
    ...(selected.filters ?? []),
    ...(composition?.filters ?? []),
    ...(request.dateRange === undefined ? [] : [{ kind: "date_range" as const, ...request.dateRange }]),
    ...(request.symbol === undefined ? [] : [{ kind: "symbol" as const, values: [request.symbol] }]),
    ...(request.filters ?? []),
  ];
  if (selected.execution === "preset") {
    if (selected.presetKey === undefined) return contractFailure("ti_v3_analytics_contract_invalid", "$.analyticsAgent.intent");
    const comparisonDateRange = request.comparisonDateRange;
    if (selected.presetKey === "compare_periods" && (request.dateRange === undefined || comparisonDateRange === undefined)) {
      return contractFailure("ti_v3_analytics_contract_invalid", "$.analyticsAgent.comparisonDateRange");
    }
    const compiled = compileGa1BPreset({
      presetKey: selected.presetKey,
      authority: gateway.value.authority,
      filters,
      ...(selected.presetKey === "compare_periods"
        ? {
          baselineFilters: [
            { kind: "date_range" as const, ...comparisonDateRange! },
            ...(request.symbol === undefined ? [] : [{ kind: "symbol" as const, values: [request.symbol] }]),
            ...(request.filters ?? []),
          ],
        }
        : {}),
    });
    return compiled.ok
      ? { ok: true, value: Object.freeze({ capabilityKey: selected.capabilityKey, plan: null, preset: compiled.value }) }
      : compiled;
  }
  const grouping = composition?.grouping ?? selected.grouping;
  const metrics = composition?.metrics ?? selected.metrics;
  if (grouping === undefined || metrics === undefined) return contractFailure("ti_v3_analytics_contract_invalid", "$.analyticsAgent.intent");
  const ordering = metrics.includes("net_pnl")
    ? [{ by: "metric" as const, metricKey: "net_pnl" as const, direction: (composition?.ranking ?? selected.ranking ?? "ascending") }]
    : [{ by: "group_identity" as const, metricKey: null, direction: "ascending" as const }];
  const authority = gateway.value.authority;
  const plan = buildTradeQueryPlan({
    schemaVersion: "ti_v3_trade_query_plan_v1",
    queryPlanKey: "generic_deterministic_trade_query",
    queryPlanVersion: "v1",
    authority: {
      snapshotDigest: authority.datasetReceipt.snapshotDigest,
      canonicalFilterDigest: authority.datasetReceipt.filterDigest,
      datasetReceiptDigest: authority.datasetReceipt.receiptDigest,
      datasetDerivationDigest: authority.datasetDerivationReceipt.derivationDigest,
      partitionDigest: authority.partitionReceipt.partitionDigest,
      currency: authority.partitionReceipt.currency,
      ownerScope: authority.partitionReceipt.ownerScope,
      accountScope: authority.partitionReceipt.accountScope,
    },
    filters,
    grouping,
    metrics,
    ordering,
    limits: { groupLimit: "64", resultRowLimit: "64", evidencePerGroup: "8", totalEvidenceLimit: "128", diagnosticLimit: "32" },
    policies: TRADE_QUERY_POLICY,
  }, authority);
  return plan.ok ? { ok: true, value: Object.freeze({ capabilityKey: composition === undefined ? selected.capabilityKey : "composed_execution_query", plan: plan.value, preset: null }) } : plan;
}
