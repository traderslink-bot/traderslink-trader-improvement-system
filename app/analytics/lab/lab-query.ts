import {
  createServerExecutionAnalyticsAdapter,
  buildDashboardAttributionPacket,
  buildDashboardDistributionPacket,
  buildDashboardFindingsPacket,
  buildDashboardPeriodAttributionPacket,
  buildDashboardQueryPacket,
  type ExactMetricValue,
  type SyntheticQueryPlanOptions,
  type TradeQueryFilter,
  type TradeQueryGrouping,
  type TradeQueryMetricKey,
} from "../../../src/lib/trader-intelligence-v3/analytics";
import type {
  AnalyticsLabPreview,
  AnalyticsLabQuery,
  LabGroupingKey,
  LabMetric,
  LabMetricKey,
} from "./lab-types";
import type { AnalyticsLabRuntime } from "./lab-runtime";

const metricLabels: Record<LabMetricKey, string> = {
  net_pnl: "Net P&L",
  gross_pnl: "Gross P&L",
  average_pnl: "Average trade",
  median_pnl: "Median trade",
  win_rate: "Win rate",
  profit_factor: "Profit factor",
  expectancy: "Expectancy",
  total_trades: "Total trades",
  average_holding_time: "Average hold",
  average_share_quantity: "Average shares",
  average_entry_notional: "Average entry notional",
  signed_charges: "Fees and charges",
  best_trade: "Best trade",
  worst_trade: "Worst trade",
  profitable_day_percentage: "Profitable days",
  maximum_intraday_drawdown: "Maximum intraday drawdown",
  maximum_peak_profit_giveback: "Peak-profit giveback",
  repeat_attempt_percentage: "Repeat-attempt rate",
};

const groupingLabels: Record<LabGroupingKey, string> = {
  day: "Trading day",
  week: "Trading week",
  month: "Trading month",
  weekday: "Weekday",
  symbol: "Ticker",
  direction: "Direction",
  session: "Session",
  entry_session: "Entry session",
  exit_session: "Exit session",
  entry_hour: "Entry hour",
  exit_hour: "Exit hour",
  entry_half_hour: "Entry half-hour",
  trade_sequence: "Trade number",
  trade_sequence_bucket: "Trade-number band",
  previous_completed_outcome: "Previous trade result",
  prior_completed_streak_bucket: "Prior streak",
  pre_entry_daily_state: "P&L state before entry",
  repeat_attempt: "Attempt number",
  repeat_attempt_bucket: "Attempt-number band",
  holding_time_bucket: "Holding-time band",
  share_quantity_bucket: "Share-size band",
  entry_notional_bucket: "Entry-notional band",
  charge_coverage: "Charge coverage",
};

const metricSet = new Set<LabMetricKey>(Object.keys(metricLabels) as LabMetricKey[]);
const groupingSet = new Set<LabGroupingKey>(Object.keys(groupingLabels) as LabGroupingKey[]);
const temporalGroupings = new Set<LabGroupingKey>([
  "day",
  "week",
  "month",
  "weekday",
  "entry_hour",
  "exit_hour",
  "entry_half_hour",
]);

function metricValue(metric: ExactMetricValue | undefined): number | null {
  if (metric === undefined || metric.kind === "unavailable") return null;
  if (metric.kind === "exact_decimal" || metric.kind === "integer") {
    const value = Number(metric.value);
    return Number.isFinite(value) ? value : null;
  }
  if (metric.kind === "exact_ratio") {
    const denominator = Number(metric.denominator);
    const numerator = Number(metric.numerator);
    return denominator !== 0 && Number.isFinite(numerator / denominator)
      ? numerator / denominator
      : null;
  }
  if (metric.kind === "duration") {
    const value = Number(metric.nanoseconds) / 1_000_000_000;
    return Number.isFinite(value) ? value : null;
  }
  return null;
}

function metric(
  metrics: readonly ExactMetricValue[],
  key: string,
): LabMetric {
  const source = metrics.find((item) => item.metricKey === key);
  return {
    key,
    value: metricValue(source),
    unit: source?.unit ?? "number",
    currency: source?.currency ?? null,
    available: source !== undefined && source.kind !== "unavailable",
  };
}

function unwrap<T>(
  input:
    | { readonly ok: true; readonly value: T }
    | { readonly ok: false; readonly error: Readonly<{ readonly code: string; readonly path: string }> },
): T {
  if (!input.ok) throw new Error(`${input.error.code}:${input.error.path}`);
  return input.value;
}

function cleanBound(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function grouping(key: LabGroupingKey): TradeQueryGrouping {
  switch (key) {
    case "entry_hour":
      return { kind: "time_bucket", source: "entry", bucketMinutes: "60" };
    case "exit_hour":
      return { kind: "time_bucket", source: "exit", bucketMinutes: "60" };
    case "entry_half_hour":
      return { kind: "time_bucket", source: "entry", bucketMinutes: "30" };
    case "holding_time_bucket":
      return { kind: "holding_time_bucket", boundariesSeconds: ["300", "900", "1800", "3600"] };
    case "share_quantity_bucket":
      return { kind: "share_quantity_bucket", boundaries: ["50", "100", "250", "500"] };
    case "entry_notional_bucket":
      return { kind: "entry_notional_bucket", boundaries: ["100", "200", "500", "1000"] };
    default:
      return { kind: key };
  }
}

function filters(query: AnalyticsLabQuery): TradeQueryFilter[] {
  const selected: TradeQueryFilter[] = [];
  const input = query.filters;
  if (input.startDate && input.endDate) {
    selected.push({ kind: "date_range", startDate: input.startDate, endDate: input.endDate });
  }
  if (input.symbol !== "all") selected.push({ kind: "symbol", values: [input.symbol] });
  if (input.direction !== "all") selected.push({ kind: "direction", values: [input.direction] });
  if (input.outcome !== "all") selected.push({ kind: "realized_outcome", values: [input.outcome] });
  if (input.session !== "all") selected.push({ kind: "session", values: [input.session] });
  if (input.weekday !== "all") selected.push({ kind: "weekday", values: [input.weekday] });
  if (input.entryStart && input.entryEnd) {
    selected.push({ kind: "entry_time_range", startTime: input.entryStart, endTime: input.entryEnd });
  }
  const holdingMinimum = cleanBound(input.holdingMinimum);
  const holdingMaximum = cleanBound(input.holdingMaximum);
  if (holdingMinimum !== null || holdingMaximum !== null) {
    selected.push({ kind: "holding_time_seconds", minimum: holdingMinimum, maximum: holdingMaximum });
  }
  const sequenceMinimum = cleanBound(input.sequenceMinimum);
  const sequenceMaximum = cleanBound(input.sequenceMaximum);
  if (sequenceMinimum !== null || sequenceMaximum !== null) {
    selected.push({ kind: "sequence_in_session", minimum: sequenceMinimum, maximum: sequenceMaximum });
  }
  if (input.previousOutcome !== "all") {
    selected.push({ kind: "previous_completed_outcome", values: [input.previousOutcome] });
  }
  if (input.preEntryState !== "all") {
    selected.push({ kind: "pre_entry_daily_state", values: [input.preEntryState] });
  }
  const repeatMinimum = cleanBound(input.repeatAttemptMinimum);
  const repeatMaximum = cleanBound(input.repeatAttemptMaximum);
  if (repeatMinimum !== null || repeatMaximum !== null) {
    selected.push({ kind: "repeat_attempt", minimum: repeatMinimum, maximum: repeatMaximum });
  }
  const shareMinimum = cleanBound(input.shareMinimum);
  const shareMaximum = cleanBound(input.shareMaximum);
  if (shareMinimum !== null || shareMaximum !== null) {
    selected.push({ kind: "share_quantity_range", minimum: shareMinimum, maximum: shareMaximum });
  }
  const notionalMinimum = cleanBound(input.notionalMinimum);
  const notionalMaximum = cleanBound(input.notionalMaximum);
  if (notionalMinimum !== null || notionalMaximum !== null) {
    selected.push({ kind: "entry_notional_range", minimum: notionalMinimum, maximum: notionalMaximum });
  }
  return selected;
}

function filterLabels(query: AnalyticsLabQuery): string[] {
  const labels = [`${query.filters.startDate} â€“ ${query.filters.endDate}`];
  if (query.filters.symbol !== "all") labels.push(query.filters.symbol);
  if (query.filters.direction !== "all") labels.push(query.filters.direction);
  if (query.filters.outcome !== "all") labels.push(query.filters.outcome);
  if (query.filters.session !== "all") labels.push(query.filters.session.replace("_", " "));
  if (query.filters.weekday !== "all") labels.push(query.filters.weekday);
  if (query.filters.entryStart !== "00:00" || query.filters.entryEnd !== "23:59") {
    labels.push(`Entry ${query.filters.entryStart}â€“${query.filters.entryEnd}`);
  }
  if (query.filters.holdingMinimum || query.filters.holdingMaximum) labels.push("Holding-time range");
  if (query.filters.sequenceMinimum || query.filters.sequenceMaximum) labels.push("Trade-number range");
  if (query.filters.previousOutcome !== "all") labels.push(`Previous: ${query.filters.previousOutcome}`);
  if (query.filters.preEntryState !== "all") labels.push(`Before entry: ${query.filters.preEntryState}`);
  if (query.filters.repeatAttemptMinimum || query.filters.repeatAttemptMaximum) labels.push("Attempt range");
  if (query.filters.shareMinimum || query.filters.shareMaximum) labels.push("Share range");
  if (query.filters.notionalMinimum || query.filters.notionalMaximum) labels.push("Notional range");
  return labels;
}

function normalizedQuery(input: AnalyticsLabQuery): AnalyticsLabQuery {
  if (!metricSet.has(input.metric) || !groupingSet.has(input.grouping)) {
    throw new Error("Unsupported Lab metric or grouping");
  }
  return input;
}

function previousPeriod(
  startDate: string,
  endDate: string,
): {
  baselineStart: string;
  baselineEnd: string;
  comparisonStart: string;
  comparisonEnd: string;
} {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  const durationDays = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1,
  );
  const baselineEnd = new Date(start.getTime() - 86_400_000);
  const baselineStart = new Date(
    baselineEnd.getTime() - (durationDays - 1) * 86_400_000,
  );
  return {
    baselineStart: baselineStart.toISOString().slice(0, 10),
    baselineEnd: baselineEnd.toISOString().slice(0, 10),
    comparisonStart: startDate,
    comparisonEnd: endDate,
  };
}

export function buildAnalyticsLabPreview(
  input: AnalyticsLabQuery,
  runtime: AnalyticsLabRuntime,
): AnalyticsLabPreview {
  const query = normalizedQuery(input);
  const adapter = createServerExecutionAnalyticsAdapter(runtime.source);
  const selectedFilters = filters(query);
  const selectedMetrics = Array.from(new Set<TradeQueryMetricKey>([
    query.metric,
    "net_pnl",
    "average_pnl",
    "win_rate",
    "profit_factor",
    "total_trades",
    "maximum_intraday_drawdown",
  ]));
  const planOptions: SyntheticQueryPlanOptions = {
    filters: selectedFilters,
    grouping: grouping(query.grouping),
    metrics: selectedMetrics,
    limits: {
      resultRowLimit: String(Math.max(query.evidenceRows, 24)),
      evidencePerGroup: "4",
      totalEvidenceLimit: "128",
    },
  };
  const overviewPlan = runtime.plan({
    ...planOptions,
    grouping: { kind: "aggregate" },
  });
  const resultPlan = runtime.plan(planOptions);
  const overview = buildDashboardQueryPacket(
    unwrap(adapter.getOverview(runtime.currency, overviewPlan)),
  );
  const result = buildDashboardQueryPacket(
    unwrap(adapter.getPerformanceSeries(runtime.currency, resultPlan)),
  );
  const distribution = buildDashboardDistributionPacket(
    unwrap(adapter.getDistribution(runtime.currency, overviewPlan, {
      measure: "net_pnl",
      bucketBoundaries: ["-5", "-1", "0", "1", "3", "5"],
    })),
  );
  const attribution = buildDashboardAttributionPacket(
    unwrap(adapter.getAttribution(runtime.currency, resultPlan)),
  );
  const findingDimension =
    query.grouping === "symbol"
      ? "symbol"
      : query.grouping === "direction"
        ? "direction"
        : temporalGroupings.has(query.grouping)
          ? "time"
          : "overall";
  const findings = buildDashboardFindingsPacket(
    unwrap(adapter.getFindings(runtime.currency, resultPlan, findingDimension, "2")),
  );
  const overviewMetrics = overview.rows[0]?.metrics ?? [];
  let comparison: AnalyticsLabPreview["comparison"] = null;
  if (query.comparison === "previous_period") {
    const nonDateFilters = selectedFilters.filter((item) => item.kind !== "date_range");
    const periods = previousPeriod(
      query.filters.startDate,
      query.filters.endDate,
    );
    const baseline = runtime.plan({
      ...planOptions,
      filters: [
        ...nonDateFilters,
        {
          kind: "date_range",
          startDate: periods.baselineStart,
          endDate: periods.baselineEnd,
        },
      ],
    });
    const compared = runtime.plan({
      ...planOptions,
      filters: [
        ...nonDateFilters,
        {
          kind: "date_range",
          startDate: periods.comparisonStart,
          endDate: periods.comparisonEnd,
        },
      ],
    });
    const packet = buildDashboardPeriodAttributionPacket(
      unwrap(
        adapter.getPeriodAttribution(runtime.currency, baseline, compared),
      ),
    );
    comparison = {
      baselineLabel: `${periods.baselineStart} â€“ ${periods.baselineEnd}`,
      comparisonLabel: `${periods.comparisonStart} â€“ ${periods.comparisonEnd}`,
      baselineCount: packet.baselineCount,
      comparisonCount: packet.comparisonCount,
      baselineNetPnl: metricValue(packet.baselineNetPnl),
      comparisonNetPnl: metricValue(packet.comparisonNetPnl),
      absoluteChange: metricValue(packet.absoluteChange),
      frequencyEffect: metricValue(packet.frequencyEffect),
      mixEffect: metricValue(packet.mixEffect),
      averageResultEffect: metricValue(packet.averageResultEffect),
    };
  }
  return {
    authority: {
      currency: overview.authority.currency,
      dataMode: runtime.dataMode,
      candidateCount: overview.candidateCount,
      includedCount: overview.includedCount,
      excludedCount: overview.excludedCount,
      packetDigest: result.packetDigest,
    },
    headline: [
      metric(overviewMetrics, "net_pnl"),
      metric(overviewMetrics, "win_rate"),
      metric(overviewMetrics, "profit_factor"),
      metric(overviewMetrics, "average_pnl"),
      metric(overviewMetrics, "maximum_intraday_drawdown"),
    ],
    primaryMetric: { key: query.metric, label: metricLabels[query.metric] },
    grouping: {
      key: query.grouping,
      label: groupingLabels[query.grouping],
      temporal: temporalGroupings.has(query.grouping),
    },
    appliedFilters: filterLabels(query),
    series: result.rows.map((row) => ({
      label: row.groupLabel,
      count: Number(row.includedCount),
      primary: metric(row.metrics, query.metric),
      netPnl: metric(row.metrics, "net_pnl").value,
      winRate: metric(row.metrics, "win_rate").value,
      averagePnl: metric(row.metrics, "average_pnl").value,
    })),
    distribution: distribution.buckets.map((bucket) => ({
      label:
        bucket.lowerInclusive === null
          ? `< ${bucket.upperExclusive ?? "â€”"}`
          : bucket.upperExclusive === null
            ? `â‰¥ ${bucket.lowerInclusive}`
            : `${bucket.lowerInclusive}â€“${bucket.upperExclusive}`,
      count: Number(bucket.count),
    })),
    attribution: attribution.segments.map((segment) => ({
      label: segment.groupLabel,
      count: Number(segment.includedCount),
      netPnl: metricValue(segment.netPnl),
      contribution: metricValue(segment.netPnlContribution),
      averagePnl: metricValue(segment.averageNetPnl),
    })),
    findings: findings.findings.map((finding) => ({
      key: finding.findingKey,
      label: finding.groupLabel,
      sampleState: finding.sampleState,
      includedCount: finding.includedCount,
      netPnl: finding.netPnl === null ? null : Number(finding.netPnl),
    })),
    comparison,
    evidenceRows: query.evidenceRows,
    limitations: Array.from(
      new Set([
        ...overview.limitationCodes,
        ...result.limitationCodes,
        ...distribution.limitationCodes,
        ...attribution.limitationCodes,
      ]),
    ),
  };
}
