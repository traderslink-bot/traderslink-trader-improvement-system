"use client";

import { useId, useMemo, useState, useTransition } from "react";
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { DashboardShell } from "../../dashboard-shell";
import {
  deleteAnalyticsLabView,
  runAnalyticsLabQuery,
  saveAnalyticsLabView,
} from "./actions";
import type {
  AnalyticsLabFilterOptions,
  AnalyticsLabPreview,
  AnalyticsLabQuery,
  AnalyticsLabSavedView,
  ChartKind,
  LabAnalysisKind,
  LabGroupingKey,
  LabMetric,
  LabMetricKey,
} from "./lab-types";

const analysisOptions: Array<{ value: LabAnalysisKind; label: string }> = [
  { value: "performance", label: "Performance trend" },
  { value: "breakdown", label: "Grouped breakdown" },
  { value: "distribution", label: "Result distribution" },
  { value: "attribution", label: "P&L attribution" },
  { value: "evidence", label: "Data table" },
];

const metricOptions: Array<{ value: LabMetricKey; label: string }> = [
  { value: "net_pnl", label: "Net P&L" },
  { value: "gross_pnl", label: "Gross P&L" },
  { value: "average_pnl", label: "Average trade" },
  { value: "median_pnl", label: "Median trade" },
  { value: "win_rate", label: "Win rate" },
  { value: "profit_factor", label: "Profit factor" },
  { value: "expectancy", label: "Expectancy" },
  { value: "total_trades", label: "Total trades" },
  { value: "average_holding_time", label: "Average holding time" },
  { value: "average_share_quantity", label: "Average shares" },
  { value: "average_entry_notional", label: "Average entry notional" },
  { value: "signed_charges", label: "Fees and charges" },
  { value: "best_trade", label: "Best trade" },
  { value: "worst_trade", label: "Worst trade" },
  { value: "profitable_day_percentage", label: "Profitable days" },
  { value: "maximum_intraday_drawdown", label: "Intraday drawdown" },
  { value: "maximum_peak_profit_giveback", label: "Peak-profit giveback" },
  { value: "repeat_attempt_percentage", label: "Repeat-attempt rate" },
];

const groupingOptions: Array<{ value: LabGroupingKey; label: string }> = [
  { value: "day", label: "Trading day" },
  { value: "week", label: "Trading week" },
  { value: "month", label: "Trading month" },
  { value: "weekday", label: "Weekday" },
  { value: "symbol", label: "Ticker" },
  { value: "direction", label: "Direction" },
  { value: "session", label: "Session" },
  { value: "entry_session", label: "Entry session" },
  { value: "exit_session", label: "Exit session" },
  { value: "entry_hour", label: "Entry hour" },
  { value: "entry_half_hour", label: "Entry half-hour" },
  { value: "exit_hour", label: "Exit hour" },
  { value: "trade_sequence", label: "Trade number" },
  { value: "trade_sequence_bucket", label: "Trade-number band" },
  { value: "previous_completed_outcome", label: "Previous result" },
  { value: "prior_completed_streak_bucket", label: "Prior streak" },
  { value: "pre_entry_daily_state", label: "P&L state before entry" },
  { value: "repeat_attempt", label: "Attempt number" },
  { value: "repeat_attempt_bucket", label: "Attempt-number band" },
  { value: "holding_time_bucket", label: "Holding-time band" },
  { value: "share_quantity_bucket", label: "Share-size band" },
  { value: "entry_notional_bucket", label: "Entry-notional band" },
  { value: "charge_coverage", label: "Charge coverage" },
];

const chartLabels: Record<ChartKind, string> = {
  area: "Area chart",
  line: "Line chart",
  bars: "Column chart",
  horizontal: "Horizontal bars",
  table: "Table",
};

const navGroups = [
  {
    label: "Analytics",
    items: [
      { href: "/analytics", label: "Overview" },
      { href: "/analytics/results", label: "Results" },
      { href: "/analytics/timing", label: "Timing" },
      { href: "/analytics/trade-explorer", label: "Execution" },
      { href: "/analytics/lab", label: "Analytics Lab" },
    ],
  },
  {
    label: "Review",
    items: [
      { href: "/execution-analytics/calendar", label: "Performance calendar" },
      { href: "/workspace", label: "Trading workspace" },
    ],
  },
];

const headlineLabels: Record<string, string> = {
  net_pnl: "Net P&L",
  win_rate: "Win rate",
  profit_factor: "Profit factor",
  average_pnl: "Average trade",
  maximum_intraday_drawdown: "Max drawdown",
};

function formatMoney(value: number | null, currency = "USD") {
  if (value === null) return "Unavailable";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatMetric(metric: LabMetric, currency: string) {
  if (!metric.available || metric.value === null) return "Unavailable";
  if (
    metric.unit === "money" ||
    metric.unit === "money_per_trade" ||
    metric.unit === "pnl" ||
    metric.currency
  ) {
    return formatMoney(metric.value, metric.currency ?? currency);
  }
  if (metric.unit === "ratio") {
    if (
      metric.key.includes("rate") ||
      metric.key.includes("percentage") ||
      metric.key.includes("contribution")
    ) {
      return `${(metric.value * 100).toFixed(1)}%`;
    }
    return metric.value.toFixed(2);
  }
  if (metric.unit === "seconds") {
    const minutes = metric.value / 60;
    return minutes >= 60
      ? `${(minutes / 60).toFixed(1)} hr`
      : `${minutes.toFixed(1)} min`;
  }
  return metric.value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function availableCharts(
  analysis: LabAnalysisKind,
  temporal: boolean,
): ChartKind[] {
  if (analysis === "evidence") return ["table"];
  if (analysis === "performance" && temporal) {
    return ["area", "line", "bars", "table"];
  }
  return ["bars", "horizontal", "table"];
}

function chartPoints(values: number[], width: number, height: number) {
  const minimum = Math.min(0, ...values);
  const maximum = Math.max(0, ...values);
  const spread = maximum - minimum || 1;
  return values.map((value, index) => ({
    x: values.length === 1 ? width / 2 : (index / (values.length - 1)) * width,
    y: height - ((value - minimum) / spread) * height,
  }));
}

function CartesianChart({
  kind,
  preview,
}: {
  kind: "area" | "line" | "bars";
  preview: AnalyticsLabPreview;
}) {
  const data = preview.series.filter((item) => item.primary.value !== null);
  const values = data.map((item) => item.primary.value ?? 0);
  const width = 920;
  const height = 360;
  const points = chartPoints(values, width, height);
  const maximumAbsolute = Math.max(1, ...values.map((value) => Math.abs(value)));
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `0,${height} ${polyline} ${width},${height}`;

  if (data.length === 0) {
    return (
      <Stack sx={{ alignItems: "center", height: 420, justifyContent: "center" }}>
        <Typography color="text.secondary">
          No values match the selected filters.
        </Typography>
      </Stack>
    );
  }

  return (
    <Box sx={{ height: { xs: 390, lg: 500 }, overflow: "hidden", pt: 2 }}>
      <Box
        component="svg"
        role="img"
        aria-label={`${preview.primaryMetric.label} ${kind} chart`}
        viewBox={`-24 -22 ${width + 48} ${height + 76}`}
        sx={{ height: "100%", overflow: "visible", width: "100%" }}
      >
        <defs>
          <linearGradient id="labAreaFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="labPositiveBar" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0f9f72" />
            <stop offset="100%" stopColor="#77d9b8" />
          </linearGradient>
          <linearGradient id="labNegativeBar" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ef7c89" />
            <stop offset="100%" stopColor="#c74859" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((line) => (
          <line
            key={line}
            x1="0"
            x2={width}
            y1={(height / 4) * line}
            y2={(height / 4) * line}
            stroke="#dfe5ef"
            strokeDasharray="5 8"
          />
        ))}
        {kind === "area" ? (
          <>
            <polygon points={area} fill="url(#labAreaFill)" />
            <polyline
              points={polyline}
              fill="none"
              stroke="#2563eb"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="5"
            />
          </>
        ) : null}
        {kind === "line" ? (
          <polyline
            points={polyline}
            fill="none"
            stroke="#2563eb"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="5"
          />
        ) : null}
        {kind === "bars"
          ? data.map((item, index) => {
              const slot = width / data.length;
              const value = item.primary.value ?? 0;
              const barHeight = (Math.abs(value) / maximumAbsolute) * (height * 0.78);
              const positive = value >= 0;
              return (
                <rect
                  key={`${item.label}-${index}`}
                  x={index * slot + slot * 0.16}
                  y={positive ? height * 0.82 - barHeight : height * 0.82}
                  width={slot * 0.68}
                  height={Math.max(3, barHeight)}
                  rx="7"
                  fill={positive ? "url(#labPositiveBar)" : "url(#labNegativeBar)"}
                />
              );
            })
          : points.map((point, index) => (
              <circle
                key={`${data[index].label}-${index}`}
                cx={point.x}
                cy={point.y}
                r="6"
                fill="#fff"
                stroke="#2563eb"
                strokeWidth="4"
              />
            ))}
        {data.map((item, index) => {
          const slot = width / data.length;
          return (
            <text
              key={`${item.label}-label-${index}`}
              x={kind === "bars" ? index * slot + slot / 2 : points[index].x}
              y={height + 35}
              textAnchor="middle"
              fill="#667085"
              fontSize="14"
            >
              {item.label.length > 12 ? `${item.label.slice(0, 10)}â€¦` : item.label}
            </text>
          );
        })}
      </Box>
    </Box>
  );
}

function HorizontalChart({
  rows,
}: {
  rows: Array<{ label: string; value: number; display: string }>;
}) {
  const maximum = Math.max(1, ...rows.map((item) => Math.abs(item.value)));
  return (
    <Stack spacing={2.4} sx={{ minHeight: 440, py: 3 }}>
      {rows.map((item) => (
        <Box key={item.label}>
          <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
            <Typography sx={{ fontWeight: 800 }}>{item.label}</Typography>
            <Typography sx={{ fontWeight: 900 }}>{item.display}</Typography>
          </Stack>
          <Box
            sx={{
              bgcolor: "action.hover",
              borderRadius: 99,
              height: 15,
              mt: 1,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                bgcolor: item.value >= 0 ? "success.main" : "error.main",
                borderRadius: 99,
                height: "100%",
                width: `${Math.max(3, (Math.abs(item.value) / maximum) * 100)}%`,
              }}
            />
          </Box>
        </Box>
      ))}
      {rows.length === 0 ? (
        <Typography color="text.secondary">No values match the selected filters.</Typography>
      ) : null}
    </Stack>
  );
}

function LabTable({ preview }: { preview: AnalyticsLabPreview }) {
  return (
    <Box sx={{ minHeight: 460, overflowX: "auto", py: 2 }}>
      <Box sx={{ minWidth: 620 }}>
        <Box
          sx={{
            bgcolor: "action.hover",
            borderRadius: 1.5,
            display: "grid",
            gridTemplateColumns: "1.5fr .65fr 1fr 1fr",
            px: 2,
            py: 1.25,
          }}
        >
          {[preview.grouping.label, "Trades", preview.primaryMetric.label, "Net P&L"].map(
            (label) => (
              <Typography
                color="text.secondary"
                key={label}
                sx={{ fontWeight: 850 }}
                variant="caption"
              >
                {label}
              </Typography>
            ),
          )}
        </Box>
        {preview.series.slice(0, preview.evidenceRows).map((row) => (
          <Box
            key={row.label}
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              display: "grid",
              gridTemplateColumns: "1.5fr .65fr 1fr 1fr",
              px: 2,
              py: 1.45,
            }}
          >
            <Typography sx={{ fontWeight: 800 }} variant="body2">
              {row.label}
            </Typography>
            <Typography variant="body2">{row.count}</Typography>
            <Typography sx={{ fontWeight: 850 }} variant="body2">
              {formatMetric(row.primary, preview.authority.currency)}
            </Typography>
            <Typography
              color={(row.netPnl ?? 0) >= 0 ? "success.main" : "error.main"}
              sx={{ fontWeight: 850 }}
              variant="body2"
            >
              {formatMoney(row.netPnl, preview.authority.currency)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function SelectField<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  value: T;
}) {
  const labelId = useId();
  return (
    <FormControl fullWidth size="small">
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        label={label}
        labelId={labelId}
        onChange={(event) => onChange(event.target.value as T)}
        value={value}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default function AnalyticsLabClient({
  filterOptions,
  initialPreview,
  initialQuery,
  initialSavedViews,
}: {
  filterOptions: AnalyticsLabFilterOptions;
  initialPreview: AnalyticsLabPreview;
  initialQuery: AnalyticsLabQuery;
  initialSavedViews: AnalyticsLabSavedView[];
}) {
  const [query, setQuery] = useState(initialQuery);
  const [preview, setPreview] = useState(initialPreview);
  const [isPending, startTransition] = useTransition();
  const [isSavePending, startSaveTransition] = useTransition();
  const [queryError, setQueryError] = useState("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [savedViews, setSavedViews] =
    useState<AnalyticsLabSavedView[]>(initialSavedViews);
  const [savedViewsOpen, setSavedViewsOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [savedViewError, setSavedViewError] = useState("");

  const chartOptions = useMemo(
    () =>
      availableCharts(query.analysis, preview.grouping.temporal).map((value) => ({
        value,
        label: chartLabels[value],
      })),
    [preview.grouping.temporal, query.analysis],
  );

  function updateQuery(patch: Partial<AnalyticsLabQuery>) {
    setQuery((current) => ({ ...current, ...patch }));
  }

  function updateFilter<K extends keyof AnalyticsLabQuery["filters"]>(
    key: K,
    value: AnalyticsLabQuery["filters"][K],
  ) {
    setQuery((current) => ({
      ...current,
      filters: { ...current.filters, [key]: value },
    }));
  }

  function chooseAnalysis(analysis: LabAnalysisKind) {
    const valid = availableCharts(analysis, preview.grouping.temporal);
    updateQuery({
      analysis,
      chart: valid.includes(query.chart) ? query.chart : valid[0],
    });
  }

  function chooseGrouping(grouping: LabGroupingKey) {
    const temporal = [
      "day",
      "week",
      "month",
      "weekday",
      "entry_hour",
      "exit_hour",
      "entry_half_hour",
    ].includes(grouping);
    const valid = availableCharts(query.analysis, temporal);
    updateQuery({
      grouping,
      chart: valid.includes(query.chart) ? query.chart : valid[0],
    });
  }

  function runQuery(nextQuery = query) {
    setQueryError("");
    startTransition(async () => {
      const result = await runAnalyticsLabQuery(nextQuery);
      if (!result.ok) {
        setQueryError(result.message);
        return;
      }
      setPreview(result.preview);
      setFilterDrawerOpen(false);
    });
  }

  function resetQuery() {
    setQuery(initialQuery);
    runQuery(initialQuery);
  }

  function openSavedViews() {
    setSavedViewsOpen(true);
  }

  function saveView() {
    const name = newViewName.trim();
    if (!name) return;
    setSavedViewError("");
    startSaveTransition(async () => {
      const result = await saveAnalyticsLabView(name, query);
      if (!result.ok) {
        setSavedViewError(result.message);
        return;
      }
      setSavedViews((current) => [result.view, ...current]);
      setNewViewName("");
      setSaveDialogOpen(false);
    });
  }

  function deleteView(id: string) {
    setSavedViewError("");
    startSaveTransition(async () => {
      const result = await deleteAnalyticsLabView(id);
      if (!result.ok) {
        setSavedViewError(result.message);
        return;
      }
      setSavedViews((current) =>
        current.filter((view) => view.id !== result.id),
      );
    });
  }

  function loadView(view: AnalyticsLabSavedView) {
    setQuery(view.query);
    setSavedViewsOpen(false);
    runQuery(view.query);
  }

  const filterControls = (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography sx={{ fontWeight: 900 }}>Filters</Typography>
        <Tooltip title="Reset all controls">
          <IconButton onClick={resetQuery} size="small">
            <RefreshRoundedIcon />
          </IconButton>
        </Tooltip>
      </Stack>
      <Divider />
      <SelectField
        label="Ticker"
        onChange={(value) => updateFilter("symbol", value)}
        options={[
          { value: "all", label: "All tickers" },
          ...filterOptions.symbols.map((symbol) => ({
            value: symbol,
            label: symbol,
          })),
        ]}
        value={query.filters.symbol}
      />
      <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: "1fr 1fr" }}>
        <SelectField
          label="Direction"
          onChange={(value) => updateFilter("direction", value)}
          options={[
            { value: "all", label: "All" },
            { value: "long", label: "Long" },
            { value: "short", label: "Short" },
          ]}
          value={query.filters.direction}
        />
        <SelectField
          label="Outcome"
          onChange={(value) => updateFilter("outcome", value)}
          options={[
            { value: "all", label: "All" },
            { value: "gain", label: "Winner" },
            { value: "loss", label: "Loser" },
            { value: "flat", label: "Flat" },
          ]}
          value={query.filters.outcome}
        />
      </Box>
      <SelectField
        label="Session"
        onChange={(value) => updateFilter("session", value)}
        options={[
          { value: "all", label: "All sessions" },
          { value: "premarket", label: "Premarket" },
          { value: "regular", label: "Regular hours" },
          { value: "after_hours", label: "After hours" },
          { value: "overnight", label: "Overnight" },
        ]}
        value={query.filters.session}
      />
      <SelectField
        label="Weekday"
        onChange={(value) => updateFilter("weekday", value)}
        options={[
          { value: "all", label: "All weekdays" },
          { value: "monday", label: "Monday" },
          { value: "tuesday", label: "Tuesday" },
          { value: "wednesday", label: "Wednesday" },
          { value: "thursday", label: "Thursday" },
          { value: "friday", label: "Friday" },
        ]}
        value={query.filters.weekday}
      />
      <Typography color="text.secondary" sx={{ fontWeight: 850 }} variant="overline">
        Date and time
      </Typography>
      <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: "1fr 1fr" }}>
        <TextField
          slotProps={{
            htmlInput: {
              min: filterOptions.minimumDate,
              max: filterOptions.maximumDate,
            },
          }}
          label="Start date"
          onChange={(event) => updateFilter("startDate", event.target.value)}
          size="small"
          type="date"
          value={query.filters.startDate}
        />
        <TextField
          slotProps={{
            htmlInput: {
              min: filterOptions.minimumDate,
              max: filterOptions.maximumDate,
            },
          }}
          label="End date"
          onChange={(event) => updateFilter("endDate", event.target.value)}
          size="small"
          type="date"
          value={query.filters.endDate}
        />
        <TextField
          label="Entry after"
          onChange={(event) => updateFilter("entryStart", event.target.value)}
          size="small"
          type="time"
          value={query.filters.entryStart}
        />
        <TextField
          label="Entry before"
          onChange={(event) => updateFilter("entryEnd", event.target.value)}
          size="small"
          type="time"
          value={query.filters.entryEnd}
        />
      </Box>
      <Typography color="text.secondary" sx={{ fontWeight: 850 }} variant="overline">
        Trade context
      </Typography>
      <SelectField
        label="Previous result"
        onChange={(value) => updateFilter("previousOutcome", value)}
        options={[
          { value: "all", label: "Any previous result" },
          { value: "none", label: "No previous trade" },
          { value: "gain", label: "After a winner" },
          { value: "loss", label: "After a loser" },
          { value: "flat", label: "After a flat trade" },
        ]}
        value={query.filters.previousOutcome}
      />
      <SelectField
        label="P&L before entry"
        onChange={(value) => updateFilter("preEntryState", value)}
        options={[
          { value: "all", label: "Any daily state" },
          { value: "green", label: "Already green" },
          { value: "red", label: "Already red" },
          { value: "flat", label: "Flat before entry" },
        ]}
        value={query.filters.preEntryState}
      />
      <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: "1fr 1fr" }}>
        <TextField
          label="Hold min (sec)"
          onChange={(event) => updateFilter("holdingMinimum", event.target.value)}
          size="small"
          value={query.filters.holdingMinimum}
        />
        <TextField
          label="Hold max (sec)"
          onChange={(event) => updateFilter("holdingMaximum", event.target.value)}
          size="small"
          value={query.filters.holdingMaximum}
        />
        <TextField
          label="Trade # min"
          onChange={(event) => updateFilter("sequenceMinimum", event.target.value)}
          size="small"
          value={query.filters.sequenceMinimum}
        />
        <TextField
          label="Trade # max"
          onChange={(event) => updateFilter("sequenceMaximum", event.target.value)}
          size="small"
          value={query.filters.sequenceMaximum}
        />
        <TextField
          label="Attempt min"
          onChange={(event) => updateFilter("repeatAttemptMinimum", event.target.value)}
          size="small"
          value={query.filters.repeatAttemptMinimum}
        />
        <TextField
          label="Attempt max"
          onChange={(event) => updateFilter("repeatAttemptMaximum", event.target.value)}
          size="small"
          value={query.filters.repeatAttemptMaximum}
        />
      </Box>
      <Typography color="text.secondary" sx={{ fontWeight: 850 }} variant="overline">
        Size and capital
      </Typography>
      <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: "1fr 1fr" }}>
        <TextField
          label="Shares min"
          onChange={(event) => updateFilter("shareMinimum", event.target.value)}
          size="small"
          value={query.filters.shareMinimum}
        />
        <TextField
          label="Shares max"
          onChange={(event) => updateFilter("shareMaximum", event.target.value)}
          size="small"
          value={query.filters.shareMaximum}
        />
        <TextField
          label="Notional min"
          onChange={(event) => updateFilter("notionalMinimum", event.target.value)}
          size="small"
          value={query.filters.notionalMinimum}
        />
        <TextField
          label="Notional max"
          onChange={(event) => updateFilter("notionalMaximum", event.target.value)}
          size="small"
          value={query.filters.notionalMaximum}
        />
      </Box>
      <Divider />
      <SelectField
        label="Compare"
        onChange={(value) => updateQuery({ comparison: value })}
        options={[
          { value: "none", label: "No comparison" },
          { value: "previous_period", label: "Compare with previous period" },
        ]}
        value={query.comparison}
      />
      <SelectField
        label="Table rows"
        onChange={(value) => updateQuery({ evidenceRows: Number(value) as 6 | 12 | 24 })}
        options={[
          { value: "6", label: "6 rows" },
          { value: "12", label: "12 rows" },
          { value: "24", label: "24 rows" },
        ]}
        value={String(query.evidenceRows)}
      />
      <Button
        disabled={isPending}
        fullWidth
        onClick={() => runQuery()}
        size="large"
        startIcon={isPending ? <CircularProgress size={18} /> : <FilterAltRoundedIcon />}
        variant="contained"
      >
        Run analysis
      </Button>
      {queryError ? (
        <Typography color="error.main" variant="caption">
          {queryError}
        </Typography>
      ) : null}
    </Stack>
  );

  const plottedRows = useMemo(() => {
    if (query.analysis === "distribution") {
      return preview.distribution.map((row) => ({
        label: row.label,
        value: row.count,
        display: `${row.count} trades`,
      }));
    }
    if (query.analysis === "attribution") {
      return preview.attribution.map((row) => ({
        label: row.label,
        value: row.netPnl ?? 0,
        display: formatMoney(row.netPnl, preview.authority.currency),
      }));
    }
    return preview.series
      .filter((row) => row.primary.value !== null)
      .map((row) => ({
        label: row.label,
        value: row.primary.value ?? 0,
        display: formatMetric(row.primary, preview.authority.currency),
      }));
  }, [preview, query.analysis]);

  const actions = (
    <>
      <Button
        color="inherit"
        onClick={openSavedViews}
        startIcon={<BookmarkBorderRoundedIcon />}
        sx={{ display: { xs: "none", sm: "inline-flex" } }}
      >
        Saved views
      </Button>
      <Button
        onClick={() => setSaveDialogOpen(true)}
        startIcon={<SaveRoundedIcon />}
        variant="contained"
      >
        Save view
      </Button>
    </>
  );

  return (
    <DashboardShell
      actions={actions}
      fullBleed
      navGroups={navGroups}
      title="Analytics Lab"
    >
      <Paper
        elevation={0}
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 0,
          flex: 1,
          minHeight: {
            xs: "calc(100dvh - 64px)",
            md: "calc(100dvh - 72px)",
          },
          overflow: "hidden",
          width: "100%",
        }}
      >
        <Box
          sx={{
            bgcolor: "background.paper",
            borderBottom: 1,
            borderColor: "divider",
            display: "grid",
            gap: 1.25,
            gridTemplateColumns: {
              xs: "1fr 1fr",
              lg: "1.2fr 1.2fr 1.2fr .9fr auto",
            },
            p: { xs: 2, md: 2.5 },
          }}
        >
          <SelectField
            label="Analysis"
            onChange={chooseAnalysis}
            options={analysisOptions}
            value={query.analysis}
          />
          <SelectField
            label="Metric"
            onChange={(metric) => updateQuery({ metric })}
            options={metricOptions}
            value={query.metric}
          />
          <SelectField
            label="Group by"
            onChange={chooseGrouping}
            options={groupingOptions}
            value={query.grouping}
          />
          <SelectField
            label="Chart"
            onChange={(chart) => updateQuery({ chart })}
            options={chartOptions}
            value={query.chart}
          />
          <Button
            disabled={isPending}
            onClick={() => runQuery()}
            startIcon={isPending ? <CircularProgress size={18} /> : <RefreshRoundedIcon />}
            sx={{ gridColumn: { xs: "span 2", lg: "auto" }, whiteSpace: "nowrap" }}
            variant="contained"
          >
            Update chart
          </Button>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "300px minmax(0, 1fr)" },
            minHeight: {
              xs: "calc(100dvh - 218px)",
              md: "calc(100dvh - 168px)",
            },
          }}
        >
          <Box
            sx={{
              borderColor: "divider",
              borderRight: 1,
              display: { xs: "none", md: "block" },
              maxHeight: "calc(100dvh - 168px)",
              overflowY: "auto",
              p: 2.25,
            }}
          >
            {filterControls}
          </Box>

          <Box sx={{ minWidth: 0, p: { xs: 2, md: 3 } }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
            >
              <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                <Typography sx={{ fontWeight: 950, letterSpacing: "-0.025em" }} variant="h5">
                  {preview.primaryMetric.label} by {preview.grouping.label.toLowerCase()}
                </Typography>
                <Chip
                  label={`${preview.authority.includedCount} / ${preview.authority.candidateCount} trades`}
                  size="small"
                />
                {preview.authority.dataMode === "sample" ? (
                  <Chip color="warning" label="Sample data" size="small" />
                ) : null}
              </Stack>
              <Button
                onClick={() => setFilterDrawerOpen(true)}
                startIcon={<TuneRoundedIcon />}
                sx={{ display: { md: "none" } }}
                variant="outlined"
              >
                Filters
              </Button>
            </Stack>

            <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", mt: 2 }}>
              {preview.appliedFilters.map((filter) => (
                <Chip key={filter} label={filter} size="small" variant="outlined" />
              ))}
            </Stack>

            <Box
              sx={{
                display: "grid",
                gap: 1.25,
                gridTemplateColumns: "repeat(5, minmax(112px, 1fr))",
                my: 2,
                overflowX: "auto",
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              {preview.headline.map((item) => (
                <Box
                  key={item.key}
                  sx={{
                    bgcolor: "action.hover",
                    borderRadius: 2,
                    p: 1.25,
                  }}
                >
                  <Typography color="text.secondary" variant="caption">
                    {headlineLabels[item.key] ?? item.key}
                  </Typography>
                  <Typography sx={{ fontWeight: 900, mt: 0.4 }}>
                    {formatMetric(item, preview.authority.currency)}
                  </Typography>
                </Box>
              ))}
            </Box>

            {preview.comparison ? (
              <Box
                sx={{
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.055),
                  border: 1,
                  borderColor: (theme) => alpha(theme.palette.primary.main, 0.16),
                  borderRadius: 2,
                  display: "grid",
                  gap: 1.5,
                  gridTemplateColumns: { xs: "1fr 1fr", lg: "repeat(4, 1fr)" },
                  mb: 2,
                  p: 1.75,
                }}
              >
                {[
                  [preview.comparison.baselineLabel, preview.comparison.baselineNetPnl],
                  [preview.comparison.comparisonLabel, preview.comparison.comparisonNetPnl],
                  ["Change", preview.comparison.absoluteChange],
                  ["Average-result effect", preview.comparison.averageResultEffect],
                ].map(([label, value]) => (
                  <Box key={String(label)}>
                    <Typography color="text.secondary" variant="caption">
                      {String(label)}
                    </Typography>
                    <Typography sx={{ fontWeight: 900 }}>
                      {formatMoney(value as number | null, preview.authority.currency)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : null}

            <Box
              sx={{
                bgcolor: "background.default",
                border: 1,
                borderColor: "divider",
                borderRadius: 2.5,
                minHeight: {
                  xs: 520,
                  lg: "max(620px, calc(100dvh - 450px))",
                },
                overflow: "hidden",
                px: { xs: 1.5, md: 2.5 },
              }}
            >
              {isPending ? (
                <Stack sx={{ alignItems: "center", height: 520, justifyContent: "center" }}>
                  <CircularProgress />
                  <Typography sx={{ mt: 2 }}>Calculating</Typography>
                </Stack>
              ) : query.chart === "table" ? (
                <LabTable preview={preview} />
              ) : query.chart === "horizontal" ? (
                <HorizontalChart rows={plottedRows} />
              ) : (
                <CartesianChart
                  kind={query.chart as "area" | "line" | "bars"}
                  preview={preview}
                />
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      <Drawer
        anchor="bottom"
        onClose={() => setFilterDrawerOpen(false)}
        open={filterDrawerOpen}
        sx={{
          "& .MuiDrawer-paper": {
            borderRadius: "22px 22px 0 0",
            maxHeight: "90vh",
            p: 2.5,
          },
        }}
      >
        <Stack direction="row" sx={{ justifyContent: "space-between", mb: 2 }}>
          <Typography sx={{ fontWeight: 900 }} variant="h6">
            Configure filters
          </Typography>
          <IconButton onClick={() => setFilterDrawerOpen(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
        {filterControls}
      </Drawer>

      <Drawer
        anchor="right"
        onClose={() => setSavedViewsOpen(false)}
        open={savedViewsOpen}
        sx={{ "& .MuiDrawer-paper": { p: 3, width: { xs: "100%", sm: 400 } } }}
      >
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ fontWeight: 900 }} variant="h5">
              Saved views
            </Typography>
          </Box>
          <IconButton onClick={() => setSavedViewsOpen(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
        <Divider sx={{ my: 2.5 }} />
        {savedViews.length === 0 ? (
          <Stack spacing={1.5} sx={{ alignItems: "center", py: 8, textAlign: "center" }}>
            <BookmarkBorderRoundedIcon color="disabled" sx={{ fontSize: 48 }} />
            <Typography sx={{ fontWeight: 850 }}>No saved views yet</Typography>
          </Stack>
        ) : (
          <Stack spacing={1.25}>
            {savedViews.map((view) => (
              <Stack
                direction="row"
                key={view.id}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1.5,
                  overflow: "hidden",
                }}
              >
                <Button
                  fullWidth
                  onClick={() => loadView(view)}
                  sx={{
                    justifyContent: "flex-start",
                    p: 1.5,
                    textAlign: "left",
                  }}
                >
                  <Typography sx={{ fontWeight: 850 }}>{view.name}</Typography>
                </Button>
                <Tooltip title="Delete saved view">
                  <IconButton
                    disabled={isSavePending}
                    onClick={() => deleteView(view.id)}
                    sx={{ borderRadius: 0 }}
                  >
                    <DeleteOutlineRoundedIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            ))}
          </Stack>
        )}
        {savedViewError ? (
          <Typography color="error.main" sx={{ mt: 2 }} variant="caption">
            {savedViewError}
          </Typography>
        ) : null}
      </Drawer>

      <Dialog
        fullWidth
        maxWidth="xs"
        onClose={() => setSaveDialogOpen(false)}
        open={saveDialogOpen}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Save this Lab view</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="View name"
            onChange={(event) => setNewViewName(event.target.value)}
            placeholder="Morning session review"
            sx={{ mt: 1 }}
            value={newViewName}
          />
          {savedViewError ? (
            <Typography color="error.main" sx={{ mt: 1 }} variant="caption">
              {savedViewError}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button
            disabled={!newViewName.trim() || isSavePending}
            onClick={saveView}
            variant="contained"
          >
            {isSavePending ? "Saving" : "Save view"}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardShell>
  );
}
