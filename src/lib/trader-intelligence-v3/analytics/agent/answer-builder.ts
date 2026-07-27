import { compareUnicodeCodePoints } from "../../domain/canonical";
import { finalizeContentAddressedAuthority, type ExactMetricValue } from "../contracts";
import type { TradeQueryResult } from "../query";
import type {
  AnalyticsAgentAnswerPacket,
  AnalyticsAgentAnswerStatus,
  AnalyticsAgentExecutionRequest,
  AnalyticsAgentIntentResolution,
  AnalyticsAgentDrillDown,
  AnalyticsAgentUnsupportedReason,
} from "./contracts";

const MINIMUM_SAMPLE = BigInt("3");

interface PresetExecutionReferences {
  readonly presetDigest: AnalyticsAgentAnswerPacket["presetDigest"];
  readonly presetExecutionDigest: AnalyticsAgentAnswerPacket["presetExecutionDigest"];
  readonly baselinePlanDigest: AnalyticsAgentAnswerPacket["baselinePlanDigest"];
  readonly baselineResultDigest: AnalyticsAgentAnswerPacket["baselineResultDigest"];
  readonly comparisonDigest: AnalyticsAgentAnswerPacket["comparisonDigest"];
}

const NO_PRESET_EXECUTION_REFERENCES: PresetExecutionReferences = Object.freeze({
  presetDigest: null,
  presetExecutionDigest: null,
  baselinePlanDigest: null,
  baselineResultDigest: null,
  comparisonDigest: null,
});

function metric(result: TradeQueryResult, key: string): ExactMetricValue | null {
  return result.rows[0]?.metrics.find((item) => item.metricKey === key) ?? null;
}

function metricText(value: ExactMetricValue | null): string {
  if (value === null) return "unavailable";
  if (value.kind === "exact_decimal" || value.kind === "integer") return value.value;
  return "unavailable";
}

function evidenceOmitted(result: TradeQueryResult): string {
  return result.evidence.reduce(
    (total, item) => total + BigInt(item.populationCount) - BigInt(item.candidates.length),
    BigInt("0"),
  ).toString();
}

function followUps(intent: AnalyticsAgentIntentResolution["intent"]): readonly string[] {
  switch (intent) {
    case "time_of_day_performance":
    case "session_performance": return Object.freeze(["Show the evidence trades.", "Break this down by ticker."]);
    case "ticker_performance": return Object.freeze(["Show repeat attempts on this ticker.", "Show the evidence trades."]);
    case "fee_impact": return Object.freeze(["Show gross versus net for this period.", "Check the data-quality limitations."]);
    case "giveback_drawdown": return Object.freeze(["Show the evidence trades for this day.", "Compare this period with another period."]);
    default: return Object.freeze(["Show the evidence trades.", "Break this down by time of day."]);
  }
}

function drillDowns(intent: AnalyticsAgentIntentResolution["intent"]): readonly AnalyticsAgentDrillDown[] {
  const evidence: AnalyticsAgentDrillDown = Object.freeze({ question: "Show the evidence trades.", supportedIntent: intent, purpose: "evidence_review" });
  const dataQuality: AnalyticsAgentDrillDown = Object.freeze({ question: "Check the data-quality limitations.", supportedIntent: "data_quality", purpose: "data_quality" });
  switch (intent) {
    case "time_of_day_performance":
    case "session_performance":
      return Object.freeze([evidence, Object.freeze({ question: "Break this down by ticker.", supportedIntent: "ticker_performance", purpose: "segmentation" }), dataQuality]);
    case "ticker_performance":
    case "limited_category_summary":
      return Object.freeze([evidence, Object.freeze({ question: "Break this down by time of day.", supportedIntent: "time_of_day_performance", purpose: "segmentation" }), dataQuality]);
    case "period_comparison":
      return Object.freeze([evidence, dataQuality]);
    default:
      return Object.freeze([evidence, Object.freeze({ question: "Compare this period with another period.", supportedIntent: "period_comparison", purpose: "comparison" }), dataQuality]);
  }
}

function renderHints(intent: AnalyticsAgentIntentResolution["intent"]): AnalyticsAgentAnswerPacket["renderHints"] {
  if (intent === "time_of_day_performance" || intent === "session_performance" || intent === "ticker_performance" || intent === "trade_sequence_behavior" || intent === "repeat_attempt_behavior") {
    return Object.freeze(["metric_cards", "bar_chart", "table", "evidence_list"]);
  }
  return Object.freeze(["metric_cards", "table", "evidence_list"]);
}

function headline(
  status: AnalyticsAgentAnswerStatus,
  result: TradeQueryResult,
): string {
  if (status === "data_unavailable") return "No completed trades matched this verified execution-data request.";
  if (status === "insufficient_sample") {
    return `Only ${result.includedCount} completed trades matched this request, so this is not enough to treat as a reliable historical pattern.`;
  }
  const first = result.rows[0];
  const netPnlOrdering = result.normalizedQueryPlan.ordering.find((item) => item.by === "metric" && item.metricKey === "net_pnl");
  if (first !== undefined && result.rows.length > 1 && netPnlOrdering !== undefined) {
    const rank = netPnlOrdering.direction === "descending" ? "highest" : "lowest";
    return `Based on your completed trade execution data, the ${rank} returned net P/L group is ${first.groupLabel} at ${metricText(metric({ ...result, rows: [first] }, "net_pnl"))}. This is a historical pattern, not a prediction or instruction.`;
  }
  const netPnl = metricText(metric(result, "net_pnl"));
  return `Based on your completed trade execution data, this verified result covers ${result.includedCount} completed trades with net P/L of ${netPnl}. This is a historical result, not financial advice.`;
}

function evidenceSummary(result: TradeQueryResult): AnalyticsAgentAnswerPacket["evidenceSummary"] {
  const evidence = result.evidence.flatMap((item) => item.candidates);
  return Object.freeze({
    supportingTradeReferences: Object.freeze(evidence.filter((item) => item.role === "supporting")),
    counterexampleTradeReferences: Object.freeze(evidence.filter((item) => item.role === "counterexample")),
    omittedCount: evidenceOmitted(result),
  });
}

const EXECUTION_ONLY_NOT_PROVEN = Object.freeze([
  "market_or_candle_setup_quality",
  "counterfactual_exit_or_entry_outcomes",
  "planned_risk_rule_compliance",
] as const);

function buildPacket(content: Omit<AnalyticsAgentAnswerPacket, "answerDigest">): AnalyticsAgentAnswerPacket {
  const built = finalizeContentAddressedAuthority(
    "analytics_agent_answer",
    content,
    "answerDigest",
  );
  if (!built.ok) throw new Error(`${built.error.code}:${built.error.path}`);
  return built.value as AnalyticsAgentAnswerPacket;
}

export function buildUnsupportedAnalyticsAgentAnswer(
  request: AnalyticsAgentExecutionRequest,
  resolution: AnalyticsAgentIntentResolution,
  reason: AnalyticsAgentUnsupportedReason,
): AnalyticsAgentAnswerPacket {
  return buildPacket({
    schemaVersion: "ti_v3_analytics_agent_answer_v1",
    status: "unsupported",
    originalQuestion: request.question,
    resolvedIntent: resolution.intent,
    capabilityKeys: Object.freeze([]),
    enginePlanDigest: null,
    resultDigest: null,
    executionReceiptDigest: null,
    ...NO_PRESET_EXECUTION_REFERENCES,
    headline: "This cannot be proven from completed trade execution data alone.",
    supportingMetrics: Object.freeze([]),
    rankedRows: Object.freeze([]),
    evidenceTradeReferences: Object.freeze([]),
    evidenceSummary: Object.freeze({ supportingTradeReferences: Object.freeze([]), counterexampleTradeReferences: Object.freeze([]), omittedCount: "0" }),
    evidenceOmittedCount: "0",
    sampleSize: "0",
    dateRange: request.dateRange ?? null,
    limitationCodes: Object.freeze([reason.code]),
    notProven: EXECUTION_ONLY_NOT_PROVEN,
    unsupportedReason: Object.freeze({
      code: reason.code,
      missingRequiredData: Object.freeze([...reason.missingRequiredData].sort(compareUnicodeCodePoints)),
      safeAlternative: Object.freeze([...reason.safeAlternative]),
    }),
    clarification: null,
    followUpSuggestions: Object.freeze([...reason.safeAlternative]),
    drillDowns: Object.freeze([]),
    renderHints: Object.freeze(["metric_cards"]),
  });
}

export function buildClarificationAnalyticsAgentAnswer(
  request: AnalyticsAgentExecutionRequest,
  resolution: AnalyticsAgentIntentResolution,
  code: "date_range_required" | "comparison_date_range_required",
): AnalyticsAgentAnswerPacket {
  const clarification = code === "comparison_date_range_required"
    ? Object.freeze({
      code,
      requiredContext: Object.freeze(["dateRange", "comparisonDateRange"] as const),
      prompt: "Provide explicit primary and comparison date ranges to run this verified period comparison.",
    })
    : Object.freeze({
      code,
      requiredContext: Object.freeze(["dateRange"] as const),
      prompt: "Provide an explicit date range to run this verified execution review.",
    });
  return buildPacket({
    schemaVersion: "ti_v3_analytics_agent_answer_v1",
    status: "needs_clarification",
    originalQuestion: request.question,
    resolvedIntent: resolution.intent,
    capabilityKeys: Object.freeze([]),
    enginePlanDigest: null,
    resultDigest: null,
    executionReceiptDigest: null,
    ...NO_PRESET_EXECUTION_REFERENCES,
    headline: clarification.prompt,
    supportingMetrics: Object.freeze([]),
    rankedRows: Object.freeze([]),
    evidenceTradeReferences: Object.freeze([]),
    evidenceSummary: Object.freeze({ supportingTradeReferences: Object.freeze([]), counterexampleTradeReferences: Object.freeze([]), omittedCount: "0" }),
    evidenceOmittedCount: "0",
    sampleSize: "0",
    dateRange: request.dateRange ?? null,
    limitationCodes: Object.freeze(["ti_v3_analytics_agent_context_required"]),
    notProven: EXECUTION_ONLY_NOT_PROVEN,
    unsupportedReason: null,
    clarification,
    followUpSuggestions: Object.freeze([clarification.prompt]),
    drillDowns: Object.freeze([]),
    renderHints: Object.freeze(["metric_cards"]),
  });
}

export function buildAnalyticsAgentAnswer(
  request: AnalyticsAgentExecutionRequest,
  resolution: AnalyticsAgentIntentResolution,
  capabilityKey: string,
  result: TradeQueryResult,
  presetExecutionReferences: PresetExecutionReferences = NO_PRESET_EXECUTION_REFERENCES,
): AnalyticsAgentAnswerPacket {
  const noData = result.rows.length === 0 || result.includedCount === "0";
  const insufficient = !noData && BigInt(result.includedCount) < MINIMUM_SAMPLE;
  const limited = result.limitationCodes.length > 0 || result.rows.some((row) => row.limitationCodes.length > 0);
  const status: AnalyticsAgentAnswerStatus = noData
    ? "data_unavailable"
    : insufficient
      ? "insufficient_sample"
      : limited
        ? "partially_answered"
        : "answered";
  const metrics = result.rows[0]?.metrics ?? Object.freeze([]);
  const evidence = Object.freeze(result.evidence.flatMap((item) => item.candidates));
  const evidenceDetail = evidenceSummary(result);
  const limitations = Object.freeze([...new Set([
    ...result.limitationCodes,
    ...result.rows.flatMap((row) => row.limitationCodes),
    ...(insufficient ? ["ti_v3_analytics_agent_insufficient_sample"] : []),
  ])].sort(compareUnicodeCodePoints));
  return buildPacket({
    schemaVersion: "ti_v3_analytics_agent_answer_v1",
    status,
    originalQuestion: request.question,
    resolvedIntent: resolution.intent,
    capabilityKeys: Object.freeze([capabilityKey]),
    enginePlanDigest: result.normalizedQueryPlan.queryPlanDigest,
    resultDigest: result.resultDigest,
    executionReceiptDigest: result.executionReceipt.receiptDigest,
    ...presetExecutionReferences,
    headline: headline(status, result),
    supportingMetrics: metrics,
    rankedRows: result.rows,
    evidenceTradeReferences: evidence,
    evidenceSummary: evidenceDetail,
    evidenceOmittedCount: evidenceOmitted(result),
    sampleSize: result.includedCount,
    dateRange: request.dateRange ?? null,
    limitationCodes: limitations,
    notProven: EXECUTION_ONLY_NOT_PROVEN,
    unsupportedReason: insufficient
      ? Object.freeze({ code: "insufficient_sample_size", missingRequiredData: Object.freeze(["more_completed_trades"]), safeAlternative: Object.freeze(["Show the evidence trades."]) })
      : null,
    clarification: null,
    followUpSuggestions: followUps(resolution.intent),
    drillDowns: drillDowns(resolution.intent),
    renderHints: renderHints(resolution.intent),
  });
}
