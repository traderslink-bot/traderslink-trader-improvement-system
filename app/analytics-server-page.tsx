import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import {
  DashboardDataScopeChip,
  DashboardMetricCard,
  DashboardPage,
  DashboardPanel,
  DashboardUnavailableState,
} from "./dashboard-template";
import { requireTraderIntelligenceOwnerPageAccess } from "@/src/lib/trader-intelligence-v3/auth";
import {
  buildConfiguredDashboardQueryPlan,
  resolveConfiguredDashboardAnalytics,
} from "@/src/lib/trader-intelligence-v3/analytics/dashboard/configured-dashboard-analytics";
import {
  buildDashboardTableViewModel,
  buildDashboardComparisonViewModel,
  type DashboardMetricViewModel,
} from "@/src/lib/trader-intelligence-v3/analytics/dashboard";
import { validateTraderIntelligenceDeployment } from "@/src/lib/trader-intelligence-v3/deployment";
import type {
  TradeQueryGrouping,
  TradeQueryFilter,
  TradeQueryMetricKey,
} from "@/src/lib/trader-intelligence-v3/analytics/query";
import { TRADE_QUERY_METRIC_KEYS } from "@/src/lib/trader-intelligence-v3/analytics/query";

export type AnalyticsServerPageKind =
  | "overview"
  | "performance"
  | "results"
  | "timing"
  | "execution";

type PageDefinition = Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  grouping: TradeQueryGrouping;
  metrics: readonly TradeQueryMetricKey[];
}>;

const DEFINITIONS: Readonly<Record<AnalyticsServerPageKind, PageDefinition>> = {
  overview: {
    eyebrow: "Analytics",
    title: "Account overview",
    description: "Exact profitability, consistency, costs, and trade-population results from the selected execution authority.",
    grouping: { kind: "month" },
    metrics: ["net_pnl", "win_rate", "expectancy", "profit_factor", "included_count", "trading_day_count"],
  },
  performance: {
    eyebrow: "Analytics / Performance",
    title: "Performance over time",
    description: "Daily account performance, realized path quality, outlier dependence, and drawdown derived from completed executions.",
    grouping: { kind: "day" },
    metrics: ["net_pnl", "average_pnl", "median_pnl", "average_daily_pnl", "best_trading_day", "maximum_intraday_realized_drawdown"],
  },
  results: {
    eyebrow: "Analytics / Results",
    title: "Trade results",
    description: "Winning, losing, flat, average, median, expectancy, concentration, and gross-to-net execution results.",
    grouping: { kind: "direction" },
    metrics: ["total_winning_net_pnl", "total_losing_net_pnl", "average_winning_trade", "average_losing_trade", "expectancy", "profit_factor"],
  },
  timing: {
    eyebrow: "Analytics / Timing",
    title: "Timing",
    description: "Entry-time, session, weekday, holding-duration, sequence, and repeat-attempt performance derived from execution timestamps.",
    grouping: { kind: "time_bucket", source: "entry", bucketMinutes: "30" },
    metrics: ["net_pnl", "win_rate", "expectancy", "average_holding_time", "median_holding_time", "included_count"],
  },
  execution: {
    eyebrow: "Analytics / Execution",
    title: "Execution",
    description: "Direction, price, quantity, notional, source, and trading-cost results derived from accepted execution records.",
    grouping: { kind: "direction" },
    metrics: ["included_count", "average_share_quantity", "average_entry_notional", "signed_charges", "net_pnl_per_100_shares", "return_on_entry_notional"],
  },
};

function titleCase(value: string): string {
  return value.split("_").map((part) =>
    part.length === 0 ? part : part[0].toUpperCase() + part.slice(1),
  ).join(" ");
}

function traderFacingLimitation(code: string): string {
  if (
    code.includes("charge_coverage_unknown") ||
    code.includes("fee_authority")
  ) {
    return "Some imported rows have no verified commission or fee amount. Fee-based results omit those rows until you review them in Data Decisions.";
  }
  if (code.includes("rows_bounded")) {
    return "This view is limited to the verified result rows available for this request.";
  }
  return "Some verified records cannot support every result in this view. Review the affected imports in Data Decisions.";
}

function unavailableMetricCaption(reasonCode: string | null): string {
  if (
    reasonCode?.includes("charge") ||
    reasonCode?.includes("fee")
  ) {
    return "Fees need review";
  }
  return "Unavailable for verified data";
}

function metricByKey(
  metrics: readonly DashboardMetricViewModel[],
  key: string,
): DashboardMetricViewModel | null {
  return metrics.find((metric) => metric.metricKey === key) ?? null;
}

function AnalyticsUnavailable() {
  return (
    <DashboardUnavailableState
      actionHref="/imports"
      actionLabel="Attach execution history"
      description="No verified V3 execution history is currently attached. No legacy or synthetic values are substituted."
      title="Verified execution analytics unavailable"
    />
  );
}

export async function AnalyticsServerPage({
  page,
}: {
  page: AnalyticsServerPageKind;
}) {
  const definition = DEFINITIONS[page];
  const owner = await requireTraderIntelligenceOwnerPageAccess();
  const deployment = validateTraderIntelligenceDeployment(process.env);
  const analytics = deployment.ok ? resolveConfiguredDashboardAnalytics({
        owner,
        config: deployment.config,
        environment: process.env,
      })
    : null;

  if (analytics === null || !analytics.ok) {
    return (
      <DashboardPage>
        <Box>
          <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">
            {definition.eyebrow}
          </Typography>
          <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">
            {definition.title}
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 860, mt: 1 }} variant="body2">
            {definition.description}
          </Typography>
        </Box>
        <DashboardPanel title="Execution analytics">
          <AnalyticsUnavailable />
        </DashboardPanel>
      </DashboardPage>
    );
  }

  const currency = analytics.value.currencies[0];
  const aggregatePlan = buildConfiguredDashboardQueryPlan(analytics.value, currency, {
    grouping: { kind: "aggregate" },
    metrics: definition.metrics,
  });
  const breakdownPlan = buildConfiguredDashboardQueryPlan(analytics.value, currency, {
    grouping: definition.grouping,
    metrics: definition.metrics,
  });
  const aggregate = aggregatePlan.ok
    ? analytics.value.adapter.getOverview(currency, aggregatePlan.value)
    : aggregatePlan;
  const breakdown = breakdownPlan.ok
    ? page === "performance"
      ? analytics.value.adapter.getPerformanceSeries(currency, breakdownPlan.value)
      : analytics.value.adapter.getBreakdown(currency, breakdownPlan.value)
    : breakdownPlan;

  if (!aggregate.ok || !breakdown.ok) {
    return (
      <DashboardPage>
        <DashboardPanel title={definition.title}>
          <AnalyticsUnavailable />
        </DashboardPanel>
      </DashboardPage>
    );
  }

  const aggregateTable = buildDashboardTableViewModel(aggregate.value);
  const breakdownTable = buildDashboardTableViewModel(breakdown.value);
  const summaryMetrics = aggregateTable.rows[0]?.metrics ?? [];
  const limitations = [...new Set([
    ...aggregate.value.limitationCodes,
    ...breakdown.value.limitationCodes,
  ])];

  return (
    <DashboardPage>
      <Box>
        <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">
          {definition.eyebrow}
        </Typography>
        <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">
          {definition.title}
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 860, mt: 1 }} variant="body2">
          {definition.description}
        </Typography>
      </Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <DashboardDataScopeChip />
        <Chip label={`${currency} · all verified history`} size="small" variant="outlined" />
        <Chip label={`${aggregate.value.includedCount} completed trades`} size="small" variant="outlined" />
      </Stack>
      {limitations.length > 0 ? (
        <Alert
          action={
            <Button color="inherit" href="/data-decisions" size="small">
              Review Data Decisions
            </Button>
          }
          severity="warning"
        >
          {[...new Set(limitations.map(traderFacingLimitation))].join(" ")}
        </Alert>
      ) : null}
      <Box sx={{
        display: "grid",
        gap: 1.5,
        gridTemplateColumns: {
          xs: "repeat(2, minmax(0, 1fr))",
          md: "repeat(3, minmax(0, 1fr))",
          xl: "repeat(6, minmax(0, 1fr))",
        },
      }}>
        {definition.metrics.map((key) => {
          const metric = metricByKey(summaryMetrics, key);
          return (
            <DashboardMetricCard
              caption={metric?.availability === "unavailable"
                ? unavailableMetricCaption(metric.reasonCode)
                : metric?.unit ?? "Exact v3 result"}
              key={key}
              label={titleCase(key)}
              value={metric?.displayValue ?? "Unavailable"}
            />
          );
        })}
      </Box>
      <DashboardPanel
        action={<Chip label={`${breakdownTable.rows.length} groups`} size="small" variant="outlined" />}
        eyebrow="Exact v3 packet"
        title={`${titleCase(definition.grouping.kind)} breakdown`}
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Group</TableCell>
                <TableCell align="right">Included</TableCell>
                {definition.metrics.map((key) => (
                  <TableCell align="right" key={key}>{titleCase(key)}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {breakdownTable.rows.map((row) => (
                <TableRow key={row.groupIdentity}>
                  <TableCell>{row.groupLabel}</TableCell>
                  <TableCell align="right">{row.includedCount}</TableCell>
                  {definition.metrics.map((key) => (
                    <TableCell align="right" key={key}>
                      {metricByKey(row.metrics, key)?.displayValue ?? "Unavailable"}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DashboardPanel>
    </DashboardPage>
  );
}

const LAB_GROUPINGS = {
  aggregate: { kind: "aggregate" },
  day: { kind: "day" },
  week: { kind: "week" },
  month: { kind: "month" },
  year: { kind: "year" },
  weekday: { kind: "weekday" },
  entry_time_30m: { kind: "time_bucket", source: "entry", bucketMinutes: "30" },
  exit_time_30m: { kind: "time_bucket", source: "exit", bucketMinutes: "30" },
  session: { kind: "session" },
  entry_session: { kind: "entry_session" },
  exit_session: { kind: "exit_session" },
  session_transition: { kind: "session_transition" },
  ticker: { kind: "symbol" },
  direction: { kind: "direction" },
  entry_price: { kind: "entry_price_range", boundaries: ["1", "2", "5", "10", "20", "50", "100"] },
  holding_time: { kind: "holding_time_bucket", boundariesSeconds: ["60", "300", "900", "1800", "3600", "14400"] },
  share_quantity: { kind: "share_quantity_bucket", boundaries: ["100", "500", "1000", "2500", "5000", "10000"] },
  entry_notional: { kind: "entry_notional_bucket", boundaries: ["100", "500", "1000", "5000", "10000", "25000"] },
  trade_sequence: { kind: "trade_sequence_bucket" },
  previous_outcome: { kind: "previous_completed_outcome" },
  prior_streak: { kind: "prior_completed_streak_bucket" },
  pre_entry_day_state: { kind: "pre_entry_daily_state" },
  repeat_attempt: { kind: "repeat_attempt_bucket" },
  account: { kind: "account" },
  broker: { kind: "broker_code" },
  source: { kind: "source_kind" },
  charge_coverage: { kind: "charge_coverage" },
} as const satisfies Readonly<Record<string, TradeQueryGrouping>>;

type LabSearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

function dateFilter(
  startDate: string | undefined,
  endDate: string | undefined,
): TradeQueryFilter | null {
  return startDate && endDate
    ? { kind: "date_range", startDate, endDate }
    : null;
}

export async function AnalyticsLabServerPage({
  searchParams,
}: {
  searchParams: LabSearchParams;
}) {
  const params = await searchParams;
  const requestedMetric = one(params, "metric");
  const metric = TRADE_QUERY_METRIC_KEYS.includes(requestedMetric as TradeQueryMetricKey)
    ? requestedMetric as TradeQueryMetricKey
    : "net_pnl";
  const requestedGrouping = one(params, "grouping");
  const groupingKey = requestedGrouping && requestedGrouping in LAB_GROUPINGS
    ? requestedGrouping as keyof typeof LAB_GROUPINGS
    : "month";
  const targetStart = one(params, "targetStart");
  const targetEnd = one(params, "targetEnd");
  const baselineStart = one(params, "baselineStart");
  const baselineEnd = one(params, "baselineEnd");
  const symbol = one(params, "symbol")?.trim().toUpperCase();
  const direction = one(params, "direction");
  const filters: TradeQueryFilter[] = [];
  if (symbol) filters.push({ kind: "symbol", values: [symbol] });
  if (direction === "long" || direction === "short") {
    filters.push({ kind: "direction", values: [direction] });
  }
  const targetDateFilter = dateFilter(targetStart, targetEnd);
  if (targetDateFilter) filters.push(targetDateFilter);

  const owner = await requireTraderIntelligenceOwnerPageAccess();
  const deployment = validateTraderIntelligenceDeployment(process.env);
  const analytics = deployment.ok
    ? resolveConfiguredDashboardAnalytics({
        owner,
        config: deployment.config,
        environment: process.env,
      })
    : null;

  let result:
    | ReturnType<typeof buildDashboardTableViewModel>
    | null = null;
  let comparison:
    | ReturnType<typeof buildDashboardComparisonViewModel>
    | null = null;
  let errorCode: string | null = null;
  if (analytics === null || !analytics.ok) {
    errorCode = analytics === null
      ? (deployment.ok ? "ti_v3_dashboard_analytics_source_unavailable" : deployment.code)
      : analytics.error.code;
  } else {
    const currency = analytics.value.currencies[0];
    const plan = buildConfiguredDashboardQueryPlan(analytics.value, currency, {
      filters,
      grouping: LAB_GROUPINGS[groupingKey],
      metrics: [metric],
    });
    if (!plan.ok) errorCode = plan.error.code;
    else {
      const packet = analytics.value.adapter.getBreakdown(currency, plan.value);
      if (!packet.ok) errorCode = packet.error.code;
      else result = buildDashboardTableViewModel(packet.value);
    }
    const baselineDateFilter = dateFilter(baselineStart, baselineEnd);
    if (targetDateFilter && baselineDateFilter) {
      const targetPlan = buildConfiguredDashboardQueryPlan(analytics.value, currency, {
        filters: [
          ...filters.filter((filter) => filter.kind !== "date_range"),
          targetDateFilter,
        ] as readonly TradeQueryFilter[],
        grouping: { kind: "aggregate" },
        metrics: [metric],
      });
      const baselinePlan = buildConfiguredDashboardQueryPlan(analytics.value, currency, {
        filters: [
          ...filters.filter((filter) => filter.kind !== "date_range"),
          baselineDateFilter,
        ] as readonly TradeQueryFilter[],
        grouping: { kind: "aggregate" },
        metrics: [metric],
      });
      if (targetPlan.ok && baselinePlan.ok) {
        const packet = analytics.value.adapter.getComparison(
          currency,
          targetPlan.value,
          baselinePlan.value,
        );
        if (packet.ok) comparison = buildDashboardComparisonViewModel(packet.value);
        else errorCode = packet.error.code;
      }
    }
  }

  return (
    <DashboardPage>
      <Box>
        <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">
          Analytics / Lab
        </Typography>
        <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">
          Analytics Lab
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 900, mt: 1 }} variant="body2">
          Run any execution-derived metric against a governed grouping, optional ticker and direction filters, and an exact target-versus-baseline date comparison.
        </Typography>
      </Box>
      <DashboardPanel title="Build an analysis">
        <Box
          component="form"
          method="get"
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" },
          }}
        >
          <TextField defaultValue={metric} label="Metric" name="metric" select size="small">
            {TRADE_QUERY_METRIC_KEYS.map((key) => (
              <MenuItem key={key} value={key}>{titleCase(key)}</MenuItem>
            ))}
          </TextField>
          <TextField defaultValue={groupingKey} label="Break down by" name="grouping" select size="small">
            {Object.keys(LAB_GROUPINGS).map((key) => (
              <MenuItem key={key} value={key}>{titleCase(key)}</MenuItem>
            ))}
          </TextField>
          <TextField defaultValue={symbol ?? ""} label="Ticker (optional)" name="symbol" size="small" />
          <TextField defaultValue={direction ?? ""} label="Direction" name="direction" select size="small">
            <MenuItem value="">All directions</MenuItem>
            <MenuItem value="long">Long</MenuItem>
            <MenuItem value="short">Short</MenuItem>
          </TextField>
          <TextField defaultValue={targetStart ?? ""} label="Target start" name="targetStart" size="small" slotProps={{ inputLabel: { shrink: true } }} type="date" />
          <TextField defaultValue={targetEnd ?? ""} label="Target end" name="targetEnd" size="small" slotProps={{ inputLabel: { shrink: true } }} type="date" />
          <TextField defaultValue={baselineStart ?? ""} label="Baseline start" name="baselineStart" size="small" slotProps={{ inputLabel: { shrink: true } }} type="date" />
          <TextField defaultValue={baselineEnd ?? ""} label="Baseline end" name="baselineEnd" size="small" slotProps={{ inputLabel: { shrink: true } }} type="date" />
          <Button type="submit" variant="contained">Run analysis</Button>
        </Box>
      </DashboardPanel>
      {errorCode ? (
        <DashboardPanel title="Analysis result">
          <AnalyticsUnavailable />
        </DashboardPanel>
      ) : null}
      {comparison ? (
        <DashboardPanel title="Target versus baseline">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Metric</TableCell>
                  <TableCell align="right">Target</TableCell>
                  <TableCell align="right">Baseline</TableCell>
                  <TableCell align="right">Difference</TableCell>
                  <TableCell align="right">Percentage difference</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {comparison.metrics.map((item) => (
                  <TableRow key={item.metricKey}>
                    <TableCell>{titleCase(item.metricKey)}</TableCell>
                    <TableCell align="right">{item.target.displayValue}</TableCell>
                    <TableCell align="right">{item.baseline.displayValue}</TableCell>
                    <TableCell align="right">{item.difference.displayValue}</TableCell>
                    <TableCell align="right">{item.percentageDifference.displayValue}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DashboardPanel>
      ) : null}
      {result ? (
        <DashboardPanel title={`${titleCase(metric)} by ${titleCase(groupingKey)}`}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Group</TableCell>
                  <TableCell align="right">Included</TableCell>
                  <TableCell align="right">{titleCase(metric)}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.rows.map((row) => (
                  <TableRow key={row.groupIdentity}>
                    <TableCell>{row.groupLabel}</TableCell>
                    <TableCell align="right">{row.includedCount}</TableCell>
                    <TableCell align="right">
                      {metricByKey(row.metrics, metric)?.displayValue ?? "Unavailable"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DashboardPanel>
      ) : null}
    </DashboardPage>
  );
}
