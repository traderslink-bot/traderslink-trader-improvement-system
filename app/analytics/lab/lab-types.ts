export type LabMetric = {
  key: string;
  value: number | null;
  unit: string;
  currency: string | null;
  available: boolean;
};

export type LabMetricKey =
  | "net_pnl"
  | "gross_pnl"
  | "average_pnl"
  | "median_pnl"
  | "win_rate"
  | "profit_factor"
  | "expectancy"
  | "total_trades"
  | "average_holding_time"
  | "average_share_quantity"
  | "average_entry_notional"
  | "signed_charges"
  | "best_trade"
  | "worst_trade"
  | "profitable_day_percentage"
  | "maximum_intraday_drawdown"
  | "maximum_peak_profit_giveback"
  | "repeat_attempt_percentage";

export type LabGroupingKey =
  | "day"
  | "week"
  | "month"
  | "weekday"
  | "symbol"
  | "direction"
  | "session"
  | "entry_session"
  | "exit_session"
  | "entry_hour"
  | "exit_hour"
  | "entry_half_hour"
  | "trade_sequence"
  | "trade_sequence_bucket"
  | "previous_completed_outcome"
  | "prior_completed_streak_bucket"
  | "pre_entry_daily_state"
  | "repeat_attempt"
  | "repeat_attempt_bucket"
  | "holding_time_bucket"
  | "share_quantity_bucket"
  | "entry_notional_bucket"
  | "charge_coverage";

export type LabAnalysisKind =
  | "performance"
  | "breakdown"
  | "distribution"
  | "attribution"
  | "evidence";

export type ChartKind =
  | "area"
  | "line"
  | "bars"
  | "horizontal"
  | "table";

export type AnalyticsLabQuery = {
  analysis: LabAnalysisKind;
  metric: LabMetricKey;
  grouping: LabGroupingKey;
  chart: ChartKind;
  comparison: "none" | "previous_period";
  evidenceRows: 6 | 12 | 24;
  filters: {
    symbol: string;
    direction: "all" | "long" | "short";
    outcome: "all" | "gain" | "loss" | "flat";
    session: "all" | "premarket" | "regular" | "after_hours" | "overnight";
    weekday:
      | "all"
      | "monday"
      | "tuesday"
      | "wednesday"
      | "thursday"
      | "friday";
    startDate: string;
    endDate: string;
    entryStart: string;
    entryEnd: string;
    holdingMinimum: string;
    holdingMaximum: string;
    sequenceMinimum: string;
    sequenceMaximum: string;
    previousOutcome: "all" | "none" | "gain" | "loss" | "flat";
    preEntryState: "all" | "green" | "red" | "flat";
    repeatAttemptMinimum: string;
    repeatAttemptMaximum: string;
    shareMinimum: string;
    shareMaximum: string;
    notionalMinimum: string;
    notionalMaximum: string;
  };
};

export type AnalyticsLabPreview = {
  authority: {
    currency: string;
    dataMode: "persisted" | "sample";
    candidateCount: string;
    includedCount: string;
    excludedCount: string;
    packetDigest: string;
  };
  headline: LabMetric[];
  primaryMetric: {
    key: LabMetricKey;
    label: string;
  };
  grouping: {
    key: LabGroupingKey;
    label: string;
    temporal: boolean;
  };
  appliedFilters: string[];
  series: Array<{
    label: string;
    count: number;
    primary: LabMetric;
    netPnl: number | null;
    winRate: number | null;
    averagePnl: number | null;
  }>;
  distribution: Array<{ label: string; count: number }>;
  attribution: Array<{
    label: string;
    count: number;
    netPnl: number | null;
    contribution: number | null;
    averagePnl: number | null;
  }>;
  findings: Array<{
    key: string;
    label: string;
    sampleState: string;
    includedCount: string;
    netPnl: number | null;
  }>;
  comparison: null | {
    baselineLabel: string;
    comparisonLabel: string;
    baselineCount: string;
    comparisonCount: string;
    baselineNetPnl: number | null;
    comparisonNetPnl: number | null;
    absoluteChange: number | null;
    frequencyEffect: number | null;
    mixEffect: number | null;
    averageResultEffect: number | null;
  };
  evidenceRows: number;
  limitations: string[];
};

export type AnalyticsLabQueryResult =
  | { ok: true; preview: AnalyticsLabPreview }
  | { ok: false; message: string };

export type AnalyticsLabSavedView = {
  id: string;
  name: string;
  query: AnalyticsLabQuery;
  createdAt: string;
  updatedAt: string;
};

export type AnalyticsLabFilterOptions = {
  symbols: string[];
  minimumDate: string;
  maximumDate: string;
};

export type AnalyticsLabSavedViewResult =
  | { ok: true; view: AnalyticsLabSavedView }
  | { ok: false; message: string };

export type AnalyticsLabDeleteSavedViewResult =
  | { ok: true; id: string }
  | { ok: false; message: string };
