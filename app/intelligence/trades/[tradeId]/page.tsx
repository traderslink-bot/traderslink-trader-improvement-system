import { requireTraderIntelligenceOwnerPageAccess } from "@/src/lib/trader-intelligence-v3/auth";

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type {
  TradeAnalysisSummaryReplayCandle,
  TradeAnalysisSummaryReplayCandleWindow,
} from "@/src/lib/trade-analysis/summary/build-trade-analysis-summary";
import {
  buildExecutionReplayVisual,
  buildProductTraderAnalyticsViewModel,
  buildTradeExecutionAutopsy,
  buildSavedTradeReviewViewModel,
  getLatestSavedTraderAnalyticsReport,
  sellStartingReviewLimitationCopy,
  userFacingTradeSymbol,
} from "@/src/lib/trader-analytics";
import { buildSavedOrSampleTraderAnalyticsViewModel } from "@/src/lib/trader-analytics/server/saved-trader-analytics-data";
import { resolveConfiguredOwnerWorkspaceImportContext } from "@/src/lib/trader-analytics/server/owner-workspace-context";
import { buildTradeImportSourceCautionReadModel } from "@/src/lib/trader-analytics/server/saved-import-source-caution";
import { buildSavedTradeThreadReadModel } from "@/src/lib/trader-analytics/server/saved-trade-threads";
import {
  canUseChartContext,
  readTraderIntelligenceTierFromEnv,
} from "@/src/lib/trader-analytics/product/tier-config";
import {
  filterCustomerSavedReports,
  filterCustomerSavedTrades,
  isLocalSyntheticTrade,
} from "@/src/lib/trader-analytics/product/customer-data-filter";
import { getTradeDetailLevelFactsForApi } from "@/src/lib/level-analysis/level-analysis-journal-delivery-trade-link-api-service";
import {
  isLevelAnalysisTradeDetailLevelFactsEnabled,
  isLevelAnalysisTradeDetailLevelFactsUiEnabled,
} from "@/src/lib/level-analysis/level-analysis-journal-delivery-trade-link-storage";
import { buildTradeDetailLevelFactsUiContract } from "@/src/lib/level-analysis/level-analysis-trade-detail-level-facts-ui-contract";
import type { TradeReviewChecklist } from "@/src/lib/trader-analytics/product/types";
import { mapDecisionReviewInsightForUser } from "@/src/lib/user-facing-behavior";
import {
  AdvancedDisclosure,
  DashboardSideNav,
  MetricCard,
  PlainStateBadge,
  PrimaryActionPanel,
  WorkflowHandoffPanel,
  userFacingTradeDirection,
  withPageAnchor,
} from "@/app/app-ui";
import { SavedImportSourceCaution } from "@/app/saved-import-source-caution";
import { TradeReviewActions } from "./trade-review-actions";
import {
  TradeDetailLevelFactsAvailabilityLine,
  TradeDetailLevelFactsPanel,
} from "./trade-detail-level-facts";

export const metadata: Metadata = {
  title: "Trade Review | Trader Intelligence",
};

export const dynamic = "force-dynamic";

function formatSigned(value: number | null): string {
  if (typeof value !== "number") {
    return "n/a";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function timeLabelEt(value: string | null): string {
  if (!value) {
    return "time n/a";
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return "time n/a";
  }

  return new Date(parsed).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
}

function roundTripEvidenceSummary(
  roundTrip: ReturnType<
    typeof buildSavedTradeThreadReadModel
  >["threads"][number]["roundTrips"][number],
  chartTierEnabled: boolean,
): string {
  if (!chartTierEnabled) {
    return "Execution replay only";
  }

  return roundTrip.chartContextSummary;
}

function lifecycleToneClass(classification: string): string {
  if (
    classification === "day_trade_turned_swing" ||
    classification === "extended_same_day_hold"
  ) {
    return "border-amber-500/40 bg-amber-500/10 text-amber-200";
  }

  if (classification === "open_intraday_reentry") {
    return "border-sky-500/40 bg-sky-500/10 text-sky-200";
  }

  if (classification === "closed_day_trade_reentry") {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
  }

  return "border-zinc-700 bg-zinc-900/40 text-zinc-300";
}

function sessionStoryToneClass(storyKind: string): string {
  if (storyKind === "green_to_red_session") {
    return "border-rose-500/30 bg-rose-500/10";
  }

  if (
    storyKind === "same_symbol_many_attempts" ||
    storyKind === "session_high_trade_count"
  ) {
    return "border-amber-500/30 bg-amber-500/10";
  }

  if (
    storyKind === "strengths_to_repeat_session" ||
    storyKind === "positive_controlled_session"
  ) {
    return "border-emerald-500/30 bg-emerald-500/10";
  }

  return "border-sky-500/30 bg-sky-500/10";
}

function heldSessionLabel(
  row: {
    heldSessionBuckets?: Array<string | unknown>;
  } | null,
): string {
  const buckets = (row?.heldSessionBuckets ?? []).map(String);

  return buckets.length > 1
    ? buckets.join(" -> ")
    : (buckets[0] ?? "single session");
}

function plainEvidenceSourceLabel(value: string | null | undefined): string {
  if (!value) {
    return "Saved review evidence";
  }

  if (isChartEvidenceSource(value)) {
    return "Chart evidence";
  }

  const normalized = value.toLowerCase();

  if (normalized.includes("execution")) {
    return "Execution replay";
  }

  if (normalized.includes("saved") || normalized.includes("sqlite")) {
    return "Saved import data";
  }

  if (
    normalized.includes("diagnostic") ||
    normalized.includes("analysis_failed")
  ) {
    return "Technical follow-up";
  }

  return "Saved review evidence";
}

function isChartEvidenceSource(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.toLowerCase();

  return (
    normalized.includes("levels_system") ||
    normalized.includes("daily_4h") ||
    normalized.includes("market_context") ||
    normalized.includes("chart") ||
    normalized.includes("support/resistance") ||
    normalized.includes("support") ||
    normalized.includes("resistance") ||
    normalized.includes("level")
  );
}

function applyPersistedChecklistState(
  checklist: TradeReviewChecklist | null,
  states: Array<{ itemId: string; status: string }>,
): TradeReviewChecklist | null {
  if (!checklist || states.length === 0) {
    return checklist;
  }

  const stateByItemId = new Map(
    states.map((state) => [state.itemId, state.status]),
  );
  const items = checklist.items.map((item) => ({
    ...item,
    status:
      stateByItemId.get(item.id) === undefined
        ? item.status
        : (stateByItemId.get(
            item.id,
          ) as TradeReviewChecklist["items"][number]["status"]),
  }));
  const completeCount = items.filter(
    (item) => item.status === "complete",
  ).length;
  const needsAttentionCount = items.filter(
    (item) => item.status === "attention",
  ).length;

  return {
    ...checklist,
    items,
    completionPct: Math.round((completeCount / items.length) * 100),
    needsAttentionCount,
    nextAction:
      items.find((item) => item.status === "attention")?.nextAction ??
      items.find((item) => item.status === "todo")?.nextAction ??
      "Review complete for this pass.",
  };
}

function decisionReviewStatusCopy(args: {
  chartTierEnabled: boolean;
  hasSnapshot: boolean;
  diagnosticStatus?: string;
  diagnosticCode?: string;
  candleQualityNotes?: string[] | null;
}): {
  label: string;
  detail: string;
  scope: string;
  nextAction: string;
  tone: string;
} {
  if (!args.chartTierEnabled) {
    return {
      label: "Execution-only review",
      detail:
        "This tier keeps the trade detail review focused on saved executions, P/L, notes, and checklist evidence.",
      scope: "Execution-only",
      nextAction:
        "Review entries, adds, reductions, exits, timing, and P/L evidence.",
      tone: "text-zinc-300",
    };
  }

  if (args.hasSnapshot) {
    if (hasUnsafeCandleBasis(args.candleQualityNotes)) {
      return {
        label: "Chart basis needs review",
        detail:
          "Chart context is attached, but the trade-window candle prices may use a different basis than the broker executions. Use execution replay and broker P/L for movement conclusions until this is reconciled.",
        scope: "Execution replay, chart context with basis warning",
        nextAction:
          "Write the trade lesson from executions first; keep candle-move conclusions out unless the price basis is reconciled.",
        tone: "text-amber-300",
      };
    }

    return {
      label: "Chart evidence ready",
      detail:
        "Chart evidence is available. Use it alongside the execution replay and checklist.",
      scope: "Chart evidence",
      nextAction: "Work the saved checklist and record the final trade lesson.",
      tone: "text-emerald-300",
    };
  }

  if (args.diagnosticStatus === "blocked_open_trade") {
    return {
      label: "Open or swing trade",
      detail:
        "The import ended with shares still open, so completed-trade review waits until the position is flat.",
      scope: "Open or swing trade, execution-only",
      nextAction:
        "Wait until the position is flat before completed-trade coaching.",
      tone: "text-sky-300",
    };
  }

  if (
    args.diagnosticStatus === "market_context_unavailable" ||
    args.diagnosticCode === "market_context_unavailable"
  ) {
    return {
      label: "Chart data still missing",
      detail:
        "Execution review is available now, but candle and level evidence was not available. Do not treat chart conclusions as available until that evidence is added.",
      scope: "Execution replay only",
      nextAction:
        "Review entries, adds, reductions, exits, timing, and P/L evidence now; add chart data later.",
      tone: "text-amber-300",
    };
  }

  if (args.diagnosticStatus === "analysis_failed" || args.diagnosticCode) {
    return {
      label: "Chart data needs another check",
      detail:
        "Execution review is available now, but chart review needs another data check. Keep coaching conservative and do not treat chart conclusions as available.",
      scope: "Execution replay only",
      nextAction:
        "Use the execution replay now and keep chart conclusions unavailable until the data check is resolved.",
      tone: "text-amber-300",
    };
  }

  return {
    label: "Execution-only review",
    detail:
      "No saved chart evidence is attached yet, so this page is limited to execution evidence.",
    scope: "Execution-only",
    nextAction:
      "Review entries, adds, reductions, exits, timing, and P/L evidence.",
    tone: "text-zinc-300",
  };
}

function decisionReviewDiagnosticBadgeState(diagnostic: {
  code?: string | null;
  status?: string | null;
}): string {
  const value =
    `${diagnostic.status ?? ""} ${diagnostic.code ?? ""}`.toLowerCase();

  if (value.includes("market_context_unavailable")) {
    return "market_context_unavailable";
  }

  if (value.includes("blocked_open_trade") || value.includes("open_trade")) {
    return "blocked_open_trade";
  }

  if (value.includes("queued")) {
    return "queued";
  }

  return "analysis_failed";
}

function decisionReviewDiagnosticUserMessage(diagnostic: {
  code?: string | null;
  status?: string | null;
}): string {
  const state = decisionReviewDiagnosticBadgeState(diagnostic);

  if (state === "market_context_unavailable") {
    return "Candle and level evidence was not available for this trade yet. Use execution replay now and add chart data later.";
  }

  if (state === "blocked_open_trade") {
    return "The import ended with shares still open, so completed-trade coaching waits until the position is flat.";
  }

  if (state === "queued") {
    return "This trade is waiting for a saved chart review run.";
  }

  return "Chart data needs another check. Keep the review execution-only until the data check is resolved.";
}

function hasUnsafeCandleBasis(notes: string[] | null | undefined): boolean {
  return (notes ?? []).some((note) => {
    const normalized = note.toLowerCase();

    return (
      normalized.includes("basis_adjustment_multiple_likely") ||
      normalized.includes("price-basis") ||
      normalized.includes("basis is proven aligned: false")
    );
  });
}

function candleBasisUserMessage(
  notes: string[] | null | undefined,
): string | null {
  if (!notes || notes.length === 0) {
    return null;
  }

  if (hasUnsafeCandleBasis(notes)) {
    return "Candle basis needs review. Candle prices may use a different adjusted basis than the broker executions, so use execution P/L for movement conclusions until this is reconciled.";
  }

  if (notes.some((note) => note.toLowerCase().includes("basis_aligned"))) {
    return "Candle basis was checked against the broker executions.";
  }

  return "Chart data has a provider note. Use saved chart context as supporting evidence and keep the execution replay as the source of truth.";
}

function replayChartContextCopy(args: {
  candleCount: number;
  candleQualityNotes?: string[] | null;
  chartEvidenceAvailable: boolean;
  chartTierEnabled: boolean;
}): string {
  if (args.candleCount > 0) {
    return hasUnsafeCandleBasis(args.candleQualityNotes)
      ? "Saved chart candles are shown with your fills, but a candle-basis warning is present. Use execution P/L for movement conclusions until the basis is reconciled."
      : "Saved chart candles from chart review are shown with your fills overlaid.";
  }

  if (args.chartEvidenceAvailable) {
    return hasUnsafeCandleBasis(args.candleQualityNotes)
      ? "This mini replay is fill-only. Chart review is attached, but candle-basis notes mean movement conclusions should stay anchored to execution P/L until reconciled."
      : "This mini replay is fill-only. Saved chart review is attached below; use those chart prompts as supporting context after replaying the executions.";
  }

  return args.chartTierEnabled
    ? "Saved fills only. Candle movement and market context can be layered in after chart data is attached."
    : "Saved fills only. This tier keeps the trade detail review execution-only.";
}

function decisionReviewFindingToneClass(tone: string): string {
  if (tone === "danger") {
    return "text-rose-300";
  }

  if (tone === "success") {
    return "text-emerald-300";
  }

  if (tone === "warning") {
    return "text-amber-300";
  }

  return "text-sky-300";
}

function decisionReviewFindingBadgeLabel(opportunityType: string): string {
  if (opportunityType === "risk_to_reduce") {
    return "Risk to reduce";
  }

  if (opportunityType === "strength_to_repeat") {
    return "Strength to repeat";
  }

  if (opportunityType === "review_prompt") {
    return "Review prompt";
  }

  return "Advanced note";
}

function executionSideLabel(side: string): string {
  const normalized = side.toLowerCase();

  if (normalized.includes("buy") || normalized.includes("bot")) {
    return "Buy / Add";
  }

  if (normalized.includes("sell") || normalized.includes("sld")) {
    return "Sell / Reduce";
  }

  return side;
}

type ExecutionReplayStep = ReturnType<
  typeof buildExecutionReplayVisual
>["steps"][number];

interface ExecutionReplayChartPoint {
  step: ExecutionReplayStep;
  x: number;
  y: number;
  showInlineLabel: boolean;
}

interface ExecutionReplayChartCandle {
  candle: TradeAnalysisSummaryReplayCandle;
  x: number;
  highY: number;
  lowY: number;
  openY: number;
  closeY: number;
  bodyY: number;
  bodyHeight: number;
  bodyWidth: number;
}

interface ExecutionReplayChartModel {
  points: ExecutionReplayChartPoint[];
  candles: ExecutionReplayChartCandle[];
  polylinePoints: string;
  priceLines: Array<{
    label: string;
    y: number;
  }>;
  priceHigh: number;
  priceLow: number;
  priceMid: number;
  startLabel: string;
  endLabel: string;
  candleTimeframe: string | null;
}

function executionActionLabel(
  point: ExecutionReplayStep,
  tradeDirection: string,
): string {
  if (tradeDirection === "short") {
    return point.side.toLowerCase().includes("sell")
      ? "Opened from sell-side execution"
      : "Reduced from buy-side execution";
  }

  switch (point.role) {
    case "initial_entry":
      return "Entry";
    case "add":
      return "Add";
    case "trim":
      return "Reduce";
    case "full_exit":
      return "Exit to flat";
    default:
      if (
        point.positionBeforeExecution === 0 &&
        point.positionAfterExecution > 0
      ) {
        return "Entry";
      }

      if (
        point.positionAfterExecution === 0 &&
        point.positionBeforeExecution > 0
      ) {
        return "Exit to flat";
      }

      return executionSideLabel(point.side);
  }
}

function executionActionTone(point: ExecutionReplayStep): string {
  if (point.riskDirection === "closed") {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  }

  if (point.riskDirection === "increased") {
    return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  }

  return "border-sky-500/40 bg-sky-500/10 text-sky-300";
}

function executionBarClass(point: ExecutionReplayStep): string {
  if (point.riskDirection === "closed") {
    return "bg-emerald-400";
  }

  if (point.riskDirection === "increased") {
    return "bg-amber-400";
  }

  return "bg-sky-400";
}

function replayPnlLabel(point: ExecutionReplayStep): string {
  if (typeof point.realizedPnlProgress === "number") {
    return formatSigned(point.realizedPnlProgress);
  }

  if (point.positionAfterExecution !== 0) {
    return "P/L not realized yet";
  }

  return "P/L n/a";
}

function replayPnlTone(point: ExecutionReplayStep): string {
  if (typeof point.realizedPnlProgress !== "number") {
    return "text-zinc-500";
  }

  return point.realizedPnlProgress >= 0 ? "text-emerald-300" : "text-rose-300";
}

function formatExecutionPrice(value: number): string {
  return `$${value.toFixed(value >= 10 ? 2 : 4)}`;
}

function replayCandleBodyClass(
  candle: TradeAnalysisSummaryReplayCandle,
): string {
  return candle.close >= candle.open
    ? "fill-emerald-400/75 stroke-emerald-200/80"
    : "fill-rose-400/75 stroke-rose-200/80";
}

function replayCandleWickClass(
  candle: TradeAnalysisSummaryReplayCandle,
): string {
  return candle.close >= candle.open
    ? "stroke-emerald-300/70"
    : "stroke-rose-300/70";
}

function replayCandleSegmentLabel(
  segment: TradeAnalysisSummaryReplayCandle["segment"],
): string {
  if (segment === "pre_trade") {
    return "before trade";
  }

  if (segment === "post_trade") {
    return "after trade";
  }

  return "during trade";
}

function executionChartMarkerClass(point: ExecutionReplayStep): string {
  if (point.riskDirection === "closed") {
    return "fill-emerald-300 stroke-emerald-900";
  }

  if (point.riskDirection === "increased") {
    return "fill-amber-300 stroke-amber-900";
  }

  return "fill-sky-300 stroke-sky-900";
}

function executionChartLegendDotClass(point: ExecutionReplayStep): string {
  if (point.riskDirection === "closed") {
    return "border-emerald-900 bg-emerald-300";
  }

  if (point.riskDirection === "increased") {
    return "border-amber-900 bg-amber-300";
  }

  return "border-sky-900 bg-sky-300";
}

function executionChartLegendLabel(point: ExecutionReplayStep): string {
  if (point.riskDirection === "closed") {
    return "Exit";
  }

  if (point.riskDirection === "increased") {
    return point.role === "initial_entry" ? "Entry" : "Add";
  }

  return "Reduce";
}

function applyExecutionLabelVisibility(
  points: Array<Omit<ExecutionReplayChartPoint, "showInlineLabel">>,
): ExecutionReplayChartPoint[] {
  const visibleLabels: Array<{ x: number; y: number }> = [];
  const maxInlineLabels = 10;
  const minHorizontalGap = 24;
  const minVerticalGap = 18;

  return points.map((point) => {
    const collidesWithVisibleLabel = visibleLabels.some(
      (visiblePoint) =>
        Math.abs(visiblePoint.x - point.x) < minHorizontalGap &&
        Math.abs(visiblePoint.y - point.y) < minVerticalGap,
    );
    const showInlineLabel =
      points.length <= maxInlineLabels && !collidesWithVisibleLabel;

    if (showInlineLabel) {
      visibleLabels.push({ x: point.x, y: point.y });
    }

    return {
      ...point,
      showInlineLabel,
    };
  });
}

function buildExecutionReplayChartModel(
  steps: ExecutionReplayStep[],
  candleWindow?: TradeAnalysisSummaryReplayCandleWindow | null,
): ExecutionReplayChartModel | null {
  const validSteps = steps.filter(
    (step) => Number.isFinite(step.price) && step.price > 0,
  );
  const validCandles = (candleWindow?.candles ?? []).filter((candle) => {
    const values = [candle.open, candle.high, candle.low, candle.close];

    return (
      Number.isFinite(Date.parse(candle.timestamp)) &&
      values.every((value) => Number.isFinite(value) && value > 0)
    );
  });

  if (validSteps.length === 0 && validCandles.length === 0) {
    return null;
  }

  const width = 720;
  const height = 260;
  const left = 54;
  const right = 28;
  const top = 26;
  const bottom = 42;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const prices = [
    ...validSteps.map((step) => step.price),
    ...validCandles.flatMap((candle) => [candle.high, candle.low]),
  ];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const pricePadding = Math.max(
    (maxPrice - minPrice) * 0.12,
    maxPrice * 0.004,
    0.01,
  );
  const priceLow = Math.max(0, minPrice - pricePadding);
  const priceHigh = maxPrice + pricePadding;
  const priceRange = Math.max(priceHigh - priceLow, 0.01);
  const parsedStepTimes = validSteps.map((step) => Date.parse(step.timestamp));
  const parsedCandleTimes = validCandles.map((candle) =>
    Date.parse(candle.timestamp),
  );
  const realTimes = [...parsedStepTimes, ...parsedCandleTimes].filter(
    Number.isFinite,
  );
  const minTime = realTimes.length > 0 ? Math.min(...realTimes) : 0;
  const maxTime = realTimes.length > 0 ? Math.max(...realTimes) : 0;
  const timeRange = maxTime - minTime;
  const yForPrice = (price: number) =>
    top + ((priceHigh - price) / priceRange) * plotHeight;
  const xForTimedValue = (
    timeValue: number,
    fallbackIndex: number,
    total: number,
  ) => {
    if (Number.isFinite(timeValue) && realTimes.length > 1 && timeRange > 0) {
      return left + ((timeValue - minTime) / timeRange) * plotWidth;
    }

    if (total <= 1) {
      return left + plotWidth / 2;
    }

    return left + (fallbackIndex / Math.max(total - 1, 1)) * plotWidth;
  };
  const candleBodyWidth =
    validCandles.length > 0
      ? Math.max(2.5, Math.min(10, (plotWidth / validCandles.length) * 0.58))
      : 0;
  const candles = validCandles.map((candle, index) => {
    const x = xForTimedValue(
      parsedCandleTimes[index] ?? Number.NaN,
      index,
      validCandles.length,
    );
    const highY = yForPrice(candle.high);
    const lowY = yForPrice(candle.low);
    const openY = yForPrice(candle.open);
    const closeY = yForPrice(candle.close);
    const bodyY = Math.min(openY, closeY);
    const bodyHeight = Math.max(Math.abs(openY - closeY), 2);

    return {
      candle,
      x: Number(x.toFixed(2)),
      highY: Number(highY.toFixed(2)),
      lowY: Number(lowY.toFixed(2)),
      openY: Number(openY.toFixed(2)),
      closeY: Number(closeY.toFixed(2)),
      bodyY: Number(bodyY.toFixed(2)),
      bodyHeight: Number(bodyHeight.toFixed(2)),
      bodyWidth: Number(candleBodyWidth.toFixed(2)),
    };
  });
  const points = applyExecutionLabelVisibility(
    validSteps.map((step, index) => {
      const x = xForTimedValue(
        parsedStepTimes[index] ?? Number.NaN,
        index,
        validSteps.length,
      );
      const y = yForPrice(step.price);

      return {
        step,
        x: Number(x.toFixed(2)),
        y: Number(y.toFixed(2)),
      };
    }),
  );

  return {
    points,
    candles,
    polylinePoints: points.map((point) => `${point.x},${point.y}`).join(" "),
    priceLines: [priceHigh, priceLow + priceRange / 2, priceLow].map(
      (value) => ({
        label: formatExecutionPrice(value),
        y: Number(
          (top + ((priceHigh - value) / priceRange) * plotHeight).toFixed(2),
        ),
      }),
    ),
    priceHigh,
    priceLow,
    priceMid: priceLow + priceRange / 2,
    startLabel: timeLabelEt(
      validCandles[0]?.timestamp ?? validSteps[0]?.timestamp ?? null,
    ),
    endLabel: timeLabelEt(
      validCandles[validCandles.length - 1]?.timestamp ??
        validSteps[validSteps.length - 1]?.timestamp ??
        null,
    ),
    candleTimeframe:
      validCandles.length > 0 ? (candleWindow?.timeframe ?? null) : null,
  };
}

export default async function TradeReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ tradeId: string }>;
  searchParams?: Promise<{
    demo?: string | string[] | undefined;
    focus?: string;
    from?: string;
    queue?: string;
  }>;
}) {
  await requireTraderIntelligenceOwnerPageAccess("app/intelligence/trades/[tradeId]/page.tsx");
  const routeParams = await params;
  const query = await searchParams;
  const demoParam = Array.isArray(query?.demo) ? query?.demo[0] : query?.demo;
  const tradeId = decodeURIComponent(routeParams.tradeId);
  const ownerContext = resolveConfiguredOwnerWorkspaceImportContext({});
  const data = buildSavedOrSampleTraderAnalyticsViewModel({
    preferSample: demoParam === "sample",
    userId: ownerContext.ownerId,
  });
  const activeTier = readTraderIntelligenceTierFromEnv();
  const chartContextAllowed = canUseChartContext(activeTier);
  const trade = data.repository.getTrade(data.userId, tradeId);
  if (trade && isLocalSyntheticTrade(trade)) {
    notFound();
  }

  const allTrades = filterCustomerSavedTrades(
    data.repository.listTrades(data.userId),
  );
  const reports = filterCustomerSavedReports(
    data.repository.listReports(data.userId),
  );
  const containingReport =
    reports.find((report) => report.sourceTradeIds.includes(tradeId)) ??
    getLatestSavedTraderAnalyticsReport(reports);
  const savedDecisionReviewSnapshots =
    data.mode === "saved"
      ? [
          ...new Set(
            allTrades
              .map((savedTrade) => savedTrade.importBatchId)
              .filter((batchId): batchId is string => Boolean(batchId)),
          ),
        ].flatMap((batchId) =>
          data.repository.listDecisionReviewSnapshotsForBatch(batchId),
        )
      : [];
  const chartTierEnabled =
    chartContextAllowed &&
    (data.mode === "sample" || savedDecisionReviewSnapshots.length > 0);

  if (!trade) {
    notFound();
  }

  const tradeDisplaySymbol = userFacingTradeSymbol(trade.symbol);
  const view = buildSavedTradeReviewViewModel({
    trade,
    report: containingReport,
  });
  const decisionReviewSnapshot =
    data.mode === "saved" && chartTierEnabled
      ? data.repository.getDecisionReviewSnapshotForTrade(trade.id)
      : null;
  const decisionReviewDiagnostics =
    data.mode === "saved" && chartTierEnabled
      ? data.repository.listDecisionReviewDiagnosticsForTrade(trade.id)
      : [];
  const canShowTradeChartEvidence = Boolean(decisionReviewSnapshot);
  const decisionReviewSnapshots =
    canShowTradeChartEvidence && decisionReviewSnapshot
      ? [decisionReviewSnapshot]
      : [];
  const tradeThreadModel = buildSavedTradeThreadReadModel({
    decisionReviewSnapshots,
    report: containingReport,
    source: data.mode === "saved" ? "saved_sqlite" : "sample",
    trades: allTrades,
  });
  const activeThread =
    tradeThreadModel.threads.find((thread) =>
      thread.roundTrips.some((roundTrip) => roundTrip.tradeId === trade.id),
    ) ?? null;
  const activeSessionStory =
    tradeThreadModel.sessionStories.find(
      (story) =>
        story.sessionDate === (activeThread?.sessionDate ?? trade.sessionDate),
    ) ?? null;
  const importSourceCaution =
    data.mode === "saved"
      ? buildTradeImportSourceCautionReadModel({
          repository: data.repository,
          trade,
        })
      : null;
  const replay = buildExecutionReplayVisual(view);
  const analytics = buildProductTraderAnalyticsViewModel({
    repository: data.repository,
    userId: data.userId,
    importRequests: data.importRequests,
    storageMode:
      data.mode === "saved" ? "local_sqlite_single_user" : "sample_in_memory",
  });
  const mistakeTimeline =
    analytics.coachActionLoop.mistakeTimeline.items.filter(
      (item) => item.tradeId === trade.id,
    );
  const similarTrades =
    analytics.coachActionLoop.tradeSimilarity.groups.find(
      (group) => group.anchorTradeId === trade.id,
    )?.similarTrades ?? [];
  const gradeExplanation =
    analytics.productPolish.gradeExplainability.find(
      (grade) => grade.tradeId === trade.id,
    ) ?? null;
  const evidenceCards = analytics.productPolish.evidenceCards.filter((card) =>
    card.relatedTradeIds.includes(trade.id),
  );
  const generatedChecklist =
    analytics.reviewHabitLoop.tradeReviewChecklists.find(
      (item) => item.tradeId === trade.id,
    ) ?? null;
  const persistedChecklistStates =
    data.mode === "saved"
      ? data.repository.listTradeReviewItemStates(trade.id)
      : [];
  const persistedReplayCandleWindow =
    decisionReviewSnapshot?.review.replayCandleWindow ?? null;
  const candleBasisMessage = candleBasisUserMessage(
    decisionReviewSnapshot?.review.candleQualityNotes,
  );
  const hasCandleBasisWarning = hasUnsafeCandleBasis(
    decisionReviewSnapshot?.review.candleQualityNotes,
  );
  const replayChart = buildExecutionReplayChartModel(
    replay.steps,
    persistedReplayCandleWindow,
  );
  const decisionReviewStatus = decisionReviewStatusCopy({
    chartTierEnabled,
    hasSnapshot: Boolean(decisionReviewSnapshot),
    diagnosticStatus: decisionReviewDiagnostics[0]?.status,
    diagnosticCode: decisionReviewDiagnostics[0]?.code,
    candleQualityNotes: decisionReviewSnapshot?.review.candleQualityNotes,
  });
  const decisionReviewInsightCards = decisionReviewSnapshot
    ? decisionReviewSnapshot.review.insights
        .map((insight) =>
          mapDecisionReviewInsightForUser(
            insight,
            "/intelligence/trades/[tradeId]",
          ),
        )
        .filter((insight) => insight.canShowPrimary)
        .slice(0, 6)
    : [];
  const hiddenDecisionReviewInsightCount = decisionReviewSnapshot
    ? decisionReviewSnapshot.review.insights.length -
      decisionReviewInsightCards.length
    : 0;
  const activeSessionStoryEvidence = activeSessionStory
    ? activeSessionStory.reviewEvidence.filter(
        (item) =>
          canShowTradeChartEvidence ||
          !isChartEvidenceSource(item.evidenceSource),
      )
    : [];
  const activeThreadReviewEvidence = activeThread
    ? activeThread.reviewEvidence.filter(
        (item) =>
          canShowTradeChartEvidence ||
          !isChartEvidenceSource(item.evidenceSource),
      )
    : [];
  const activeThreadPriorityMarketContextFindings =
    canShowTradeChartEvidence && activeThread
      ? activeThread.priorityMarketContextFindings
      : [];
  const primaryDecisionReviewInsight =
    decisionReviewInsightCards.find(
      (insight) => insight.opportunityType === "risk_to_reduce",
    ) ??
    decisionReviewInsightCards.find(
      (insight) => insight.opportunityType === "strength_to_repeat",
    ) ??
    decisionReviewInsightCards[0] ??
    null;
  const checklist = applyPersistedChecklistState(
    generatedChecklist,
    persistedChecklistStates,
  );
  const checklistProgress = checklist
    ? `${checklist.completionPct}% complete`
    : "Checklist waiting";
  const autopsy = containingReport
    ? buildTradeExecutionAutopsy({ trade, report: containingReport })
    : null;
  const quality = autopsy?.quality ?? null;
  const directionLabel = userFacingTradeDirection(trade.tradeDirection);
  const cameFromCoach = query?.from === "coach";
  const cameFromReviewQueue = query?.from === "review-queue";
  const coachFocusLabel = query?.focus ?? null;
  const backHref = cameFromCoach
    ? "/intelligence/coach"
    : cameFromReviewQueue
      ? `/intelligence/review?queue=${encodeURIComponent(query.queue ?? "highest_priority")}`
      : "/intelligence/trades/round-trips#trade-list";
  const backLabel = cameFromCoach
    ? "Back to coach"
    : cameFromReviewQueue
      ? "Back to review queue"
      : "Back to saved trades";
  const grossRealizedPnl = view.reportRow?.grossRealizedPnl ?? null;
  const mainBehaviorLabel =
    grossRealizedPnl !== null && grossRealizedPnl >= 0
      ? (gradeExplanation?.topStrengthLabel ??
        quality?.topStrengthLabel ??
        activeThread?.primaryReviewQuestion ??
        "Look for the strongest execution choice")
      : (gradeExplanation?.topRiskLabel ??
        quality?.topRiskLabel ??
        activeThread?.primaryReviewQuestion ??
        "Review the execution behavior");
  const fixFirstAction =
    activeThread?.fixFirstAction ??
    checklist?.nextAction ??
    decisionReviewStatus.nextAction;
  const evidenceSummary =
    evidenceCards[0]?.whyItMatters ??
    activeThread?.reviewEvidence[0]?.detail ??
    decisionReviewStatus.detail;
  const currentThreadRoundTrip =
    activeThread?.roundTrips.find(
      (roundTrip) => roundTrip.tradeId === trade.id,
    ) ?? null;
  const primaryReviewAnchor = checklist ? "#writing-flow" : "#execution";
  const realizedReplaySteps = replay.steps.filter(
    (step) => typeof step.realizedPnlProgress === "number",
  );
  const finalReplayPnl =
    [...realizedReplaySteps].reverse()[0]?.realizedPnlProgress ??
    grossRealizedPnl;
  const replaySummary =
    realizedReplaySteps.length > 0
      ? `Execution-derived realized P/L is visible after reductions or exits. Final visible P/L is ${formatSigned(
          finalReplayPnl,
        )}.`
      : "This replay shows position movement now. Exact realized P/L progression is waiting until a reduction or closing execution is available.";
  const levelFactsUiContract =
    data.mode === "saved" &&
    chartContextAllowed &&
    isLevelAnalysisTradeDetailLevelFactsEnabled() &&
    isLevelAnalysisTradeDetailLevelFactsUiEnabled()
      ? buildTradeDetailLevelFactsUiContract(
          getTradeDetailLevelFactsForApi({
            savedTradeId: trade.id,
            featureEnabled: true,
          }),
        ).contract
      : null;

  return (
    <main
      className="ti-dashboard-bg min-h-screen px-5 py-8 text-zinc-100 sm:px-8"
      data-testid="trade-review-page"
    >
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-8">
        <header className="ti-panel p-6">
          <Link
            className="text-sm text-sky-300 hover:text-sky-200"
            href={backHref}
          >
            {backLabel}
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-50">
            {tradeDisplaySymbol} Review Workspace
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Replay the trade, decide what it proves, write the lesson, and move
            back into the review queue. {decisionReviewStatus.scope} for{" "}
            {directionLabel} / {trade.sessionDate} / {trade.sessionBucket}
          </p>
          {activeThread ? (
            <nav
              aria-label="Trade review context"
              className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-500"
              data-testid="trade-detail-context-trail"
            >
              <Link
                className="text-sky-300 hover:text-sky-200"
                href={
                  activeSessionStory?.daySessionHref ??
                  `/intelligence/trades/day-session/${encodeURIComponent(activeThread.sessionDate)}`
                }
              >
                Day Session {activeThread.sessionDate}
              </Link>
              <span>/</span>
              <Link
                className="text-sky-300 hover:text-sky-200"
                href={activeThread.href}
              >
                {userFacingTradeSymbol(activeThread.symbol)} Ticker Story
              </Link>
              <span>/</span>
              <span className="text-zinc-300">
                {currentThreadRoundTrip?.roleLabel ?? "Current Round Trip"}
              </span>
            </nav>
          ) : null}
          {trade.tradeDirection === "short" ? (
            <p className="mt-2 max-w-3xl text-sm text-amber-300">
              {sellStartingReviewLimitationCopy()}
            </p>
          ) : null}
        </header>

        <SavedImportSourceCaution
          caution={importSourceCaution}
          surface="trade"
        />

        <section className="grid min-w-0 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <DashboardSideNav
            eyebrow="Trade Menu"
            items={[
              {
                href: "#summary",
                label: "Summary",
                summary: "What happened and what is available.",
              },
              {
                href: "#execution",
                label: "Execution",
                summary: "Replay, P/L path, and position changes.",
              },
              {
                href: "#session-story",
                label: "Session Story",
                summary: "Full-day context around this trade.",
              },
              {
                href: "#ticker-story",
                label: "Ticker Story",
                summary: "Same-day re-entry context.",
              },
              {
                href: "#writing-flow",
                label: "Write Review",
                summary: "Name the behavior and save the lesson.",
              },
              {
                href: "#review-notes",
                label: "Notes",
                summary: "Save notes and checklist progress.",
              },
              {
                href: "#evidence",
                label: "Supporting Details",
                summary: "Optional score details, evidence, and comparisons.",
              },
            ]}
            summary="Use the trade page as a review hub."
          />
          <div className="grid min-w-0 gap-6">
            <div id="summary">
              <PrimaryActionPanel
                actionHref={primaryReviewAnchor}
                actionLabel={
                  checklist ? "Write review note" : "Review execution replay"
                }
                body={`${tradeDisplaySymbol} ${directionLabel} trade from ${
                  trade.sessionDate
                }. Gross P/L is ${formatSigned(
                  view.reportRow?.grossRealizedPnl ?? null,
                )}; lifecycle is ${
                  view.reportRow?.isOpenPosition ? "open" : "flat"
                }. ${
                  currentThreadRoundTrip
                    ? `This is ${currentThreadRoundTrip.roleLabel.toLowerCase()} inside the ${activeThread?.storyLabel.toLowerCase()} story.`
                    : "Use the replay to understand the sequence before writing the lesson."
                }`}
                eyebrow={
                  cameFromCoach ? "Coach evidence trade" : "Trade review hub"
                }
                testId="trade-review-workspace"
                title={
                  cameFromCoach
                    ? "Prove or reject the coaching focus with this trade"
                    : "What happened, what to review, and what to write down"
                }
                tone={cameFromCoach ? "warning" : "info"}
              />
            </div>

            <WorkflowHandoffPanel
              body={
                chartTierEnabled ? (
                  <>
                    This page is the workbench for one saved trade. Replay the
                    buys and sells first, use chart evidence only when it is
                    saved, then write one practical lesson before moving to the
                    next trade.
                  </>
                ) : (
                  <>
                    This page is the workbench for one saved trade. Replay the
                    buys and sells first, keep the review execution-only, then
                    write one practical lesson before moving to the next trade.
                  </>
                )
              }
              eyebrow="Trade Review Flow"
              items={[
                {
                  action: "Replay executions",
                  body: "Start here so the note is based on what the trader actually did.",
                  href: "#execution",
                  label: "1. Replay",
                  title: "See the entry, adds, reductions, and exit",
                  tone: "info",
                },
                {
                  action: chartTierEnabled ? "Use context" : "Decide lesson",
                  body: chartTierEnabled
                    ? "Check ticker, session, chart, and volume handoffs only when the saved evidence exists."
                    : "Use ticker, session, execution sequence, P/L, and written notes to decide what this trade can prove.",
                  href: activeThread ? "#ticker-story" : "#summary",
                  label: "2. Decide",
                  title: "Decide what this trade can prove",
                  tone: "warning",
                },
                {
                  action: "Write lesson",
                  body: "Save the note and checklist so coach and progress know the work is done.",
                  href: "#writing-flow",
                  label: "3. Write",
                  title: "Record one fix or one strength to repeat",
                  tone: "success",
                },
                {
                  action: "Next trade",
                  body: "Return to the queue after this review instead of wandering through unrelated stats.",
                  href: "/intelligence/review?queue=highest_priority",
                  label: "4. Continue",
                  title: "Move to the next saved review",
                  tone: "default",
                },
              ]}
              testId="trade-detail-workflow-handoff"
              title="Replay, decide, write, then continue"
            />

            {cameFromCoach ? (
              <section
                className="ti-coach-brief p-5"
                data-testid="trade-coach-handoff"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Coach Handoff
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-950">
                      Use this trade as evidence, not as a random detail page.
                    </h2>
                    <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                      Replay the executions, name the behavior in plain
                      language, write one lesson, then mark the checklist
                      progress so the coach and progress pages can treat this as
                      reviewed work.
                    </p>
                  </div>
                  <Link
                    className="inline-flex items-center justify-center rounded-md border border-slate-950 bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    href="#execution"
                  >
                    Start replay
                  </Link>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      label: "Current coaching focus",
                      value: coachFocusLabel ?? mainBehaviorLabel,
                      detail:
                        "This is the overall pattern the coach asked you to prove.",
                    },
                    {
                      label: "This trade may show",
                      value: mainBehaviorLabel,
                      detail:
                        "Name what actually appears in this trade before writing a rule.",
                    },
                    {
                      label: "What to prove",
                      value: evidenceSummary,
                      detail:
                        "Use saved execution and chart status only when available.",
                    },
                    {
                      label: "Finish the loop",
                      value: "Save the note and checklist",
                      detail:
                        "Then return to coach or progress for the next item.",
                    },
                  ].map((item) => (
                    <div className="ti-coach-brief-cell" key={item.label}>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {item.label}
                      </div>
                      <div className="mt-2 text-sm font-semibold leading-6 text-slate-900">
                        {item.value}
                      </div>
                      <div className="mt-2 text-xs leading-5 text-slate-500">
                        {item.detail}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-2 text-xs">
                  <Link
                    className="text-slate-700 underline-offset-4 hover:underline"
                    href="#writing-flow"
                  >
                    Write the review
                  </Link>
                  <span className="text-slate-400">/</span>
                  <Link
                    className="text-slate-700 underline-offset-4 hover:underline"
                    href="/intelligence/coach/progress"
                  >
                    Back to coach progress
                  </Link>
                  <span className="text-slate-400">/</span>
                  <Link
                    className="text-slate-700 underline-offset-4 hover:underline"
                    href="/intelligence/progress#progress-follow-through"
                  >
                    Check progress
                  </Link>
                </div>
              </section>
            ) : null}

            {activeSessionStory ? (
              <section
                id="session-story"
                className="ti-panel p-4"
                data-testid="trade-session-story-handoff"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Session Story
                    </div>
                    <h2 className="mt-2 text-lg font-semibold text-zinc-50">
                      {activeSessionStory.sessionDate} /{" "}
                      {activeSessionStory.storyLabel}
                    </h2>
                    <p className="mt-2 max-w-4xl text-sm leading-6 text-zinc-400">
                      {activeSessionStory.storyDetail}
                    </p>
                    <p className="mt-2 max-w-4xl text-sm leading-6 text-sky-300">
                      {activeSessionStory.reviewPrompt}
                    </p>
                  </div>
                  <Link
                    className="border border-sky-800 bg-sky-950/30 px-4 py-3 text-sm font-medium text-sky-100 transition hover:border-sky-400"
                    href={activeSessionStory.daySessionHref}
                  >
                    Open day session
                  </Link>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <MetricCard
                    label="Session P/L"
                    value={formatSigned(
                      activeSessionStory.totalGrossRealizedPnl,
                    )}
                    detail={`${activeSessionStory.tradeCount} round trip${activeSessionStory.tradeCount === 1 ? "" : "s"}`}
                    tone={
                      activeSessionStory.totalGrossRealizedPnl >= 0
                        ? "success"
                        : "danger"
                    }
                  />
                  <MetricCard
                    label="Symbols Traded"
                    value={activeSessionStory.symbolCount}
                    detail="Different tickers in this session"
                    tone="info"
                  />
                  <MetricCard
                    label="Strengths To Repeat"
                    value={activeSessionStory.marketContextStrengthCount}
                    detail={`${activeSessionStory.protectedProfitBeforeFadeFindingCount} profit-protection strength${activeSessionStory.protectedProfitBeforeFadeFindingCount === 1 ? "" : "s"}`}
                    tone={
                      activeSessionStory.marketContextStrengthCount > 0
                        ? "success"
                        : "default"
                    }
                  />
                  <MetricCard
                    label="Repeated Ticker Stories"
                    value={activeSessionStory.multiRoundTripThreadCount}
                    detail="Same-symbol stories to check"
                    tone={
                      activeSessionStory.multiRoundTripThreadCount > 0
                        ? "warning"
                        : "default"
                    }
                  />
                  <MetricCard
                    label="Open Or Swing Reviews"
                    value={activeSessionStory.openOrSwingThreadCount}
                    detail="Trades needing hold-plan review"
                    tone={
                      activeSessionStory.openOrSwingThreadCount > 0
                        ? "info"
                        : "default"
                    }
                  />
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {activeSessionStoryEvidence.slice(0, 4).map((item) => (
                    <div
                      className={`border p-4 ${sessionStoryToneClass(
                        activeSessionStory.storyKind,
                      )}`}
                      key={item.id}
                    >
                      <div className="text-sm font-semibold text-zinc-100">
                        {item.title}
                      </div>
                      <div className="mt-2 text-xs leading-5 text-zinc-400">
                        {item.detail}
                      </div>
                      <div className="mt-2 text-xs leading-5 text-sky-300">
                        {item.reviewAction}
                      </div>
                      <div className="mt-2 text-[11px] uppercase tracking-wide text-zinc-600">
                        {plainEvidenceSourceLabel(item.evidenceSource)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section
              className="grid gap-4 md:grid-cols-4"
              data-testid="trade-review-workspace-summary"
            >
              <MetricCard
                label="What Happened"
                value={formatSigned(view.reportRow?.grossRealizedPnl ?? null)}
                detail={`${tradeDisplaySymbol} / ${trade.sessionBucket}`}
                tone={
                  (view.reportRow?.grossRealizedPnl ?? 0) >= 0
                    ? "success"
                    : "danger"
                }
              />
              <MetricCard
                label="What To Review"
                value={
                  primaryDecisionReviewInsight
                    ? primaryDecisionReviewInsight.label
                    : decisionReviewSnapshot
                      ? "Chart evidence ready"
                      : "Execution review"
                }
                detail={
                  primaryDecisionReviewInsight?.detail ??
                  decisionReviewStatus.label
                }
                tone={
                  primaryDecisionReviewInsight?.tone === "danger"
                    ? "danger"
                    : primaryDecisionReviewInsight?.tone === "success"
                      ? "success"
                      : primaryDecisionReviewInsight?.tone === "warning" ||
                          decisionReviewStatus.tone.includes("amber")
                        ? "warning"
                        : decisionReviewStatus.tone.includes("emerald")
                          ? "success"
                          : "info"
                }
              />
              <MetricCard
                label="What To Write Down"
                value={checklistProgress}
                detail={
                  checklist
                    ? "Use the checklist's next item."
                    : "Start with the execution replay."
                }
                tone="info"
              />
              <MetricCard
                label="What Is Unavailable"
                value={
                  decisionReviewSnapshot
                    ? hasCandleBasisWarning
                      ? "Candle movement"
                      : hiddenDecisionReviewInsightCount > 0
                        ? "Some advanced notes"
                        : "Nothing major"
                    : chartTierEnabled
                      ? "Chart data"
                      : "Paid evidence"
                }
                detail={
                  decisionReviewSnapshot
                    ? hasCandleBasisWarning
                      ? "Broker execution P/L stays the source of truth until candle price basis is reconciled."
                      : hiddenDecisionReviewInsightCount > 0
                        ? `${hiddenDecisionReviewInsightCount} chart evidence note${
                            hiddenDecisionReviewInsightCount === 1 ? "" : "s"
                          } stayed in advanced details because normal coaching needs a certified contract.`
                        : "Context is attached."
                    : "Use execution evidence now."
                }
                tone={
                  decisionReviewSnapshot &&
                  hiddenDecisionReviewInsightCount === 0 &&
                  !hasCandleBasisWarning
                    ? "success"
                    : "warning"
                }
              />
            </section>

            <section
              id="writing-flow"
              className="grid gap-4 md:grid-cols-4"
              data-testid="trade-review-writing-flow"
            >
              {[
                {
                  label: "What happened",
                  value: `${formatSigned(grossRealizedPnl)} / ${
                    view.executionTimeline.length
                  } execution${view.executionTimeline.length === 1 ? "" : "s"}`,
                  detail:
                    "Start with the execution replay before writing the lesson.",
                  tone:
                    (view.reportRow?.grossRealizedPnl ?? 0) >= 0
                      ? "success"
                      : "danger",
                },
                {
                  label: "Behavior to name",
                  value: mainBehaviorLabel,
                  detail:
                    "Name the main risk or question in plain trader language.",
                  tone: "warning",
                },
                {
                  label: "Fix first",
                  value: fixFirstAction,
                  detail:
                    "Write one next-session rule before opening supporting details.",
                  tone: "info",
                },
                {
                  label: "Evidence",
                  value: evidenceSummary,
                  detail:
                    "Use saved execution, chart status, and ticker-story evidence only when available.",
                  tone: "default",
                },
              ].map((item) => (
                <div className="ti-panel-soft p-4" key={item.label}>
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {item.label}
                  </div>
                  <div
                    className={`mt-2 text-sm font-semibold leading-6 ${
                      item.tone === "success"
                        ? "text-emerald-300"
                        : item.tone === "danger"
                          ? "text-rose-300"
                          : item.tone === "warning"
                            ? "text-amber-300"
                            : item.tone === "info"
                              ? "text-sky-300"
                              : "text-zinc-100"
                    }`}
                  >
                    {item.value}
                  </div>
                  <div className="mt-2 text-xs leading-5 text-zinc-500">
                    {item.detail}
                  </div>
                </div>
              ))}
            </section>

            <TradeReviewActions
              checklist={checklist}
              notes={trade.notes}
              tradeId={trade.id}
            />

            {activeThread &&
            activeThread.roundTripCount <= 1 &&
            activeThreadPriorityMarketContextFindings.length > 0 ? (
              <section
                id="chart-handoff"
                className="ti-panel p-4"
                data-testid="trade-chart-volume-handoff"
              >
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Chart, Levels, And Volume Handoff
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-zinc-50">
                    {hasCandleBasisWarning
                      ? "Use executions first; keep candle movement gated."
                      : "Use saved chart evidence while writing the trade lesson."}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
                    {hasCandleBasisWarning
                      ? "Levels and chart context can support the review, but trade-window candle movement should stay out of the final lesson until the candle price basis matches broker executions."
                      : "These findings come from saved chart evidence and should be checked against the execution replay before you write the final review note."}
                  </p>
                </div>
                {candleBasisMessage ? (
                  <div
                    className={`mt-4 border p-3 text-sm leading-6 ${
                      hasCandleBasisWarning
                        ? "border-amber-900/70 bg-amber-950/20 text-amber-100"
                        : "border-sky-900/70 bg-sky-950/20 text-sky-100"
                    }`}
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      Chart Data Check
                    </div>
                    <div className="mt-1">{candleBasisMessage}</div>
                  </div>
                ) : null}
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  {activeThreadPriorityMarketContextFindings.map((finding) => (
                    <div
                      className={`border p-4 ${
                        finding.tone === "danger"
                          ? "border-rose-500/30 bg-rose-500/10"
                          : finding.tone === "warning"
                            ? "border-amber-500/30 bg-amber-500/10"
                            : finding.tone === "success"
                              ? "border-emerald-500/30 bg-emerald-500/10"
                              : "border-sky-500/30 bg-sky-500/10"
                      }`}
                      key={finding.id}
                    >
                      <div className="text-sm font-semibold text-zinc-100">
                        {finding.label}
                      </div>
                      <div className="mt-2 text-xs leading-5 text-zinc-500">
                        {finding.detail}
                      </div>
                      <div className="mt-2 text-xs leading-5 text-sky-300">
                        {finding.reviewAction}
                      </div>
                      <div className="mt-2 text-[11px] uppercase tracking-wide text-zinc-600">
                        {plainEvidenceSourceLabel(finding.evidenceSource)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {activeThread && activeThread.roundTripCount > 1 ? (
              <section
                id="ticker-story"
                className="ti-panel p-4"
                data-testid="trade-thread-context"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Ticker Story
                    </div>
                    <h2 className="mt-2 text-lg font-semibold text-zinc-50">
                      {userFacingTradeSymbol(activeThread.symbol)} had{" "}
                      {activeThread.roundTripCount} round trips on{" "}
                      {activeThread.sessionDate}
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                      {activeThread.storyDetail}
                    </p>
                    <div
                      className={`mt-3 inline-flex border px-3 py-1 text-xs font-medium uppercase tracking-wide ${lifecycleToneClass(
                        activeThread.lifecycleClassification,
                      )}`}
                    >
                      {activeThread.lifecycleLabel}
                    </div>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
                      {activeThread.lifecycleDetail}
                    </p>
                    <p className="mt-2 text-sm text-sky-300">
                      {activeThread.reviewPrompt}
                    </p>
                    <div className="mt-4 border-t border-zinc-900 pt-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Review Question
                      </div>
                      <div className="mt-1 text-sm text-zinc-200">
                        {activeThread.primaryReviewQuestion}
                      </div>
                      <div className="mt-2 text-sm text-sky-300">
                        Fix first: {activeThread.fixFirstAction}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`ti-panel-soft px-4 py-3 text-right text-lg font-semibold ${
                      activeThread.totalGrossRealizedPnl >= 0
                        ? "text-emerald-300"
                        : "text-rose-300"
                    }`}
                  >
                    {formatSigned(activeThread.totalGrossRealizedPnl)}
                    <div className="mt-1 text-xs font-normal uppercase tracking-wide text-zinc-500">
                      Story P/L
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {activeThreadReviewEvidence.map((item) => (
                    <div
                      key={item.id}
                      className={`border px-3 py-3 ${
                        item.tone === "danger"
                          ? "border-rose-500/30 bg-rose-500/10"
                          : item.tone === "warning"
                            ? "border-amber-500/30 bg-amber-500/10"
                            : item.tone === "success"
                              ? "border-emerald-500/30 bg-emerald-500/10"
                              : "border-zinc-800 bg-zinc-950/30"
                      }`}
                    >
                      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        {item.title}
                      </div>
                      <div className="mt-2 text-sm text-zinc-300">
                        {item.detail}
                      </div>
                      <div className="mt-2 text-xs text-sky-300">
                        {item.reviewAction}
                      </div>
                      <div className="mt-2 text-[11px] uppercase tracking-wide text-zinc-600">
                        {plainEvidenceSourceLabel(item.evidenceSource)}
                      </div>
                    </div>
                  ))}
                </div>
                {activeThreadPriorityMarketContextFindings.length > 0 ? (
                  <div
                    id="chart-handoff"
                    className="mt-4 grid gap-3 lg:grid-cols-3"
                    data-testid="trade-chart-volume-handoff"
                  >
                    {activeThreadPriorityMarketContextFindings.map(
                      (finding) => (
                        <div
                          className={`border p-4 ${
                            finding.tone === "danger"
                              ? "border-rose-500/30 bg-rose-500/10"
                              : finding.tone === "warning"
                                ? "border-amber-500/30 bg-amber-500/10"
                                : finding.tone === "success"
                                  ? "border-emerald-500/30 bg-emerald-500/10"
                                  : "border-sky-500/30 bg-sky-500/10"
                          }`}
                          key={finding.id}
                        >
                          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                            Chart and volume handoff
                          </div>
                          <div className="mt-2 text-sm font-semibold text-zinc-100">
                            {hasCandleBasisWarning
                              ? "Use executions first; keep candle movement gated."
                              : finding.label}
                          </div>
                          <div className="mt-2 text-xs leading-5 text-zinc-500">
                            {hasCandleBasisWarning
                              ? "The ticker story has chart context, but this trade's candle price basis needs review. Keep movement conclusions anchored to broker executions until the basis is reconciled."
                              : finding.detail}
                          </div>
                          <div className="mt-2 text-xs leading-5 text-sky-300">
                            {finding.reviewAction}
                          </div>
                          <div className="mt-2 text-[11px] uppercase tracking-wide text-zinc-600">
                            {plainEvidenceSourceLabel(finding.evidenceSource)}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                ) : null}
                <div className="mt-4 grid gap-3 md:grid-cols-4 xl:grid-cols-9">
                  <MetricCard
                    label="Round Trips"
                    value={activeThread.roundTripCount}
                    detail={`${activeThread.closedRoundTripCount} flat / ${activeThread.openRoundTripCount} open`}
                    tone="info"
                  />
                  <MetricCard
                    label="Best Push"
                    value={formatSigned(
                      activeThread.bestRoundTrip?.grossRealizedPnl ?? null,
                    )}
                    detail={
                      activeThread.bestRoundTrip
                        ? `Trade ${activeThread.bestRoundTrip.sequence}`
                        : "No closed round trip"
                    }
                    tone="success"
                  />
                  <MetricCard
                    label="Weakest Push"
                    value={formatSigned(
                      activeThread.worstRoundTrip?.grossRealizedPnl ?? null,
                    )}
                    detail={
                      activeThread.worstRoundTrip
                        ? `Trade ${activeThread.worstRoundTrip.sequence}`
                        : "No closed round trip"
                    }
                    tone="danger"
                  />
                  <MetricCard
                    label="Giveback"
                    value={formatSigned(-activeThread.givebackFromPeak)}
                    detail="Profit reduced after the best cumulative point."
                    tone={
                      activeThread.givebackFromPeak > 0 ? "warning" : "success"
                    }
                  />
                  {canShowTradeChartEvidence ? (
                    <>
                      <MetricCard
                        label="Add Quality"
                        value={activeThread.addQualityFindingCount}
                        detail={`${activeThread.addQualityRiskCount} risk, ${activeThread.addQualityStrengthCount} strength, ${activeThread.addQualityReviewPromptCount} prompt`}
                        tone={
                          activeThread.addQualityRiskCount > 0
                            ? "warning"
                            : activeThread.addQualityStrengthCount > 0
                              ? "success"
                              : activeThread.addQualityFindingCount > 0
                                ? "info"
                                : "default"
                        }
                      />
                      <MetricCard
                        label="After Exit Review"
                        value={activeThread.postExitFindingCount}
                        detail={`${activeThread.postExitRiskCount} risk to review, ${activeThread.postExitStrengthCount} strength to repeat, ${activeThread.postExitReviewPromptCount} prompt`}
                        tone={
                          activeThread.postExitRiskCount > 0
                            ? "warning"
                            : activeThread.postExitStrengthCount > 0
                              ? "success"
                              : activeThread.postExitFindingCount > 0
                                ? "info"
                                : "default"
                        }
                      />
                      <MetricCard
                        label="Protected Profit"
                        value={
                          activeThread.protectedProfitBeforeFadeFindingCount
                        }
                        detail="Repeatable exit strength from captured profit plus a measured later fade"
                        tone={
                          activeThread.protectedProfitBeforeFadeFindingCount > 0
                            ? "success"
                            : "default"
                        }
                      />
                      <MetricCard
                        label="Support/Resistance Exits"
                        value={activeThread.exitLevelFindingCount}
                        detail={`${activeThread.exitLevelRiskCount} risk, ${activeThread.exitLevelStrengthCount} strength, ${activeThread.exitLevelReviewPromptCount} prompt`}
                        tone={
                          activeThread.exitLevelRiskCount > 0
                            ? "warning"
                            : activeThread.exitLevelStrengthCount > 0
                              ? "success"
                              : activeThread.exitLevelFindingCount > 0
                                ? "info"
                                : "default"
                        }
                      />
                      <MetricCard
                        label="Volume Evidence"
                        value={activeThread.volumeFindingCount}
                        detail={`${activeThread.volumeRiskCount} risk to review, ${activeThread.volumeStrengthCount} strength to repeat`}
                        tone={
                          activeThread.volumeRiskCount > 0
                            ? "warning"
                            : activeThread.volumeStrengthCount > 0
                              ? "success"
                              : activeThread.volumeFindingCount > 0
                                ? "info"
                                : "default"
                        }
                      />
                    </>
                  ) : null}
                </div>
                <div className="mt-4 grid gap-2">
                  {activeThread.roundTrips.map((roundTrip) => {
                    const isCurrentTrade = roundTrip.tradeId === trade.id;

                    return (
                      <Link
                        key={roundTrip.id}
                        className={`grid gap-2 border px-3 py-2 text-sm transition hover:border-sky-500 hover:text-sky-200 md:grid-cols-[90px_minmax(0,1fr)_100px] ${
                          isCurrentTrade
                            ? "border-sky-500 bg-sky-500/10"
                            : "border-zinc-900"
                        }`}
                        href={roundTrip.href}
                      >
                        <span className="text-zinc-500">
                          {isCurrentTrade ? "Current" : roundTrip.roleLabel}
                        </span>
                        <span className="text-zinc-300">
                          {roundTrip.entryHourLabelEt} /{" "}
                          {roundTrip.executionCount} execution
                          {roundTrip.executionCount === 1 ? "" : "s"} /{" "}
                          {timeLabelEt(roundTrip.entryTime)} ET
                          {roundTrip.crossedSessionDate
                            ? " / next-session exposure"
                            : roundTrip.heldOvernight
                              ? " / extended hold"
                              : ""}
                        </span>
                        <span className="text-xs text-zinc-500 md:col-span-2">
                          {roundTripEvidenceSummary(
                            roundTrip,
                            chartTierEnabled,
                          )}
                        </span>
                        <span
                          className={`font-medium md:text-right ${
                            (roundTrip.grossRealizedPnl ?? 0) >= 0
                              ? "text-emerald-300"
                              : "text-rose-300"
                          }`}
                        >
                          {formatSigned(roundTrip.grossRealizedPnl)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <section
              className="ti-panel p-4"
              data-testid="trade-feedback-scope"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    What This Review Can Use
                  </div>
                  <h2
                    className={`mt-2 text-lg font-semibold ${decisionReviewStatus.tone}`}
                  >
                    {decisionReviewStatus.label}
                  </h2>
                  <div className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                    {decisionReviewStatus.detail}
                  </div>
                  <TradeDetailLevelFactsAvailabilityLine
                    contract={levelFactsUiContract}
                  />
                  <div className="mt-2 text-sm text-sky-300">
                    Next: {decisionReviewStatus.nextAction}
                  </div>
                </div>
                <div className="ti-panel-soft px-3 py-2 text-xs uppercase tracking-wide text-zinc-400">
                  {decisionReviewStatus.scope}
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-4">
              <div className="ti-panel p-4">
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Gross P/L
                </div>
                <div
                  className={`mt-3 text-2xl font-semibold ${
                    (view.reportRow?.grossRealizedPnl ?? 0) >= 0
                      ? "text-emerald-300"
                      : "text-rose-300"
                  }`}
                >
                  {formatSigned(view.reportRow?.grossRealizedPnl ?? null)}
                </div>
              </div>
              <div className="ti-panel p-4">
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Executions
                </div>
                <div className="mt-3 text-2xl font-semibold text-zinc-100">
                  {view.executionTimeline.length}
                </div>
              </div>
              <div className="ti-panel p-4">
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Max Position
                </div>
                <div className="mt-3 text-2xl font-semibold text-zinc-100">
                  {view.reportRow?.maxPositionSize ?? "n/a"}
                </div>
              </div>
              <div className="ti-panel p-4">
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Lifecycle
                </div>
                <div className="mt-3 text-2xl font-semibold text-zinc-100">
                  {view.reportRow?.isOpenPosition ? "Open" : "Flat"}
                </div>
              </div>
            </section>

            <section className="ti-panel p-4" data-testid="trade-session-time">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Session Time
                  </h2>
                  <div className="mt-1 text-sm text-zinc-500">
                    Market session and entry-hour analytics are classified in
                    Eastern Time.
                  </div>
                </div>
                <div className="font-mono text-xs text-sky-300">
                  {view.reportRow?.entryHourLabelEt ?? "hour n/a"}
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div className="border-t border-zinc-900 py-3">
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    Entry Session
                  </div>
                  <div className="mt-2 text-sm text-zinc-300">
                    {String(
                      view.reportRow?.entrySessionBucket ?? trade.sessionBucket,
                    )}
                  </div>
                </div>
                <div className="border-t border-zinc-900 py-3">
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    Entry Hour
                  </div>
                  <div className="mt-2 text-sm text-zinc-300">
                    {view.reportRow?.entryHourLabelEt ?? "n/a"}
                  </div>
                </div>
                <div className="border-t border-zinc-900 py-3">
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    Held Through
                  </div>
                  <div className="mt-2 text-sm text-zinc-300">
                    {heldSessionLabel(view.reportRow)}
                  </div>
                </div>
                <div className="border-t border-zinc-900 py-3">
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    Exposure Segments
                  </div>
                  <div className="mt-2 text-sm text-zinc-300">
                    {(view.reportRow?.sessionExposure ?? []).length}
                  </div>
                </div>
              </div>
              {(view.reportRow?.sessionExposure ?? []).length > 0 ? (
                <div className="mt-4 grid gap-2">
                  {(view.reportRow?.sessionExposure ?? [])
                    .slice(0, 6)
                    .map((segment) => (
                      <div
                        key={`${segment.startTimestamp}:${segment.endTimestamp}`}
                        className="grid gap-2 border-t border-zinc-900 py-2 text-xs md:grid-cols-[140px_140px_1fr_90px]"
                      >
                        <span className="font-mono text-zinc-500">
                          {segment.hourLabelEt}
                        </span>
                        <span className="text-zinc-300">
                          {segment.sessionBucket}
                        </span>
                        <span className="font-mono text-zinc-500">
                          {segment.startTimestamp} to {segment.endTimestamp}
                        </span>
                        <span className="text-zinc-400">
                          {segment.durationMinutes.toFixed(1)}m
                        </span>
                      </div>
                    ))}
                </div>
              ) : null}
            </section>

            {checklist ? (
              <section
                id="checklist"
                className="ti-panel p-4"
                data-testid="trade-review-checklist"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-100">
                      Trade Review Checklist
                    </h2>
                    <div className="mt-1 text-sm text-zinc-500">
                      {checklist.nextAction}
                    </div>
                  </div>
                  <div className="font-mono text-xl text-sky-300">
                    {checklist.completionPct}%
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {checklist.items.map((item) => (
                    <div
                      key={item.id}
                      className="border-t border-zinc-900 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-zinc-300">
                          {item.label}
                        </span>
                        <span className="text-xs uppercase tracking-wide text-zinc-500">
                          {item.status}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {item.evidence}
                      </div>
                      <div className="mt-2 text-xs text-sky-300">
                        {item.nextAction}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {decisionReviewSnapshot || decisionReviewDiagnostics.length > 0 ? (
              <section
                className="ti-panel p-4"
                data-testid="trade-decision-review-snapshot"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-100">
                      Chart Data Review
                    </h2>
                    <div className="mt-1 text-sm text-zinc-500">
                      {decisionReviewSnapshot?.review.coachingHeadline ??
                        (decisionReviewDiagnostics[0]
                          ? decisionReviewDiagnosticUserMessage(
                              decisionReviewDiagnostics[0],
                            )
                          : null) ??
                        "Chart data review has not completed for this trade yet."}
                    </div>
                  </div>
                  <div className="font-mono text-xs text-sky-300">
                    {plainEvidenceSourceLabel(
                      decisionReviewSnapshot?.review.marketContextSource ??
                        decisionReviewDiagnostics[0]?.status ??
                        "queued",
                    )}
                  </div>
                </div>
                {decisionReviewSnapshot ? (
                  <>
                    {decisionReviewInsightCards.length > 0 ? (
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {decisionReviewInsightCards.map((insight) => (
                          <div
                            key={insight.sourceInsightId}
                            className="border-t border-zinc-900 py-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-medium text-zinc-200">
                                {insight.label}
                              </span>
                              <span
                                className={`text-xs uppercase tracking-wide ${decisionReviewFindingToneClass(
                                  insight.tone,
                                )}`}
                              >
                                {decisionReviewFindingBadgeLabel(
                                  insight.opportunityType,
                                )}
                              </span>
                            </div>
                            <div className="mt-1 text-xs leading-5 text-zinc-500">
                              {insight.detail}
                            </div>
                            <div className="mt-2 text-xs leading-5 text-sky-300">
                              {insight.reviewAction}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 border-t border-zinc-900 pt-3 text-sm text-zinc-500">
                        Chart evidence was saved, but no primary coaching
                        finding is ready for this trade yet. Use the execution
                        replay and checklist first.
                      </div>
                    )}
                    {hiddenDecisionReviewInsightCount > 0 ? (
                      <AdvancedDisclosure summary="Technical chart notes">
                        <div className="mt-3 text-xs leading-5 text-zinc-500">
                          {hiddenDecisionReviewInsightCount} saved chart
                          evidence note
                          {hiddenDecisionReviewInsightCount === 1
                            ? ""
                            : "s"}{" "}
                          stayed out of normal coaching because they do not have
                          a user-facing contract for this route yet.
                        </div>
                      </AdvancedDisclosure>
                    ) : null}
                  </>
                ) : (
                  <AdvancedDisclosure summary="Technical review limits">
                    <div className="mt-3 grid gap-2">
                      {decisionReviewDiagnostics.map((diagnostic) => (
                        <div
                          key={diagnostic.id}
                          className="border-t border-zinc-900 py-3"
                        >
                          <PlainStateBadge
                            state={decisionReviewDiagnosticBadgeState(
                              diagnostic,
                            )}
                            tone="warning"
                          />
                          <div className="mt-1 text-xs text-zinc-500">
                            {decisionReviewDiagnosticUserMessage(diagnostic)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AdvancedDisclosure>
                )}
                <div className="mt-4 flex flex-wrap gap-3 border-t border-zinc-900 pt-3">
                  <Link
                    className="text-sm text-sky-300 hover:text-sky-200"
                    href="/intelligence/review?queue=highest_priority"
                  >
                    Open saved review queue
                  </Link>
                  <Link
                    className="text-sm text-sky-300 hover:text-sky-200"
                    href="/intelligence/trades"
                  >
                    Open saved trades
                  </Link>
                </div>
              </section>
            ) : null}

            <section id="execution" className="grid gap-6">
              <div
                className="ti-panel p-4"
                data-testid="trade-execution-replay"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-100">
                      Trade Replay
                    </h2>
                    <div className="mt-1 text-sm text-zinc-500">
                      Follow the execution sequence before writing the review.{" "}
                      {autopsy?.summary ?? "Execution-only replay."}
                    </div>
                  </div>
                  <div className="grid gap-1 text-right">
                    <div className="font-mono text-xl text-sky-300">
                      {quality ? `${quality.overallScore}/100` : "n/a"}
                    </div>
                    <div className="text-xs uppercase tracking-wide text-zinc-500">
                      execution quality
                    </div>
                  </div>
                </div>
                <div
                  className="mt-4 grid gap-3 md:grid-cols-3"
                  data-testid="trade-position-progression"
                >
                  <div className="border border-zinc-900 bg-zinc-950/40 p-3">
                    <div className="text-xs uppercase tracking-wide text-zinc-500">
                      Max position
                    </div>
                    <div className="mt-2 font-mono text-xl text-zinc-100">
                      {view.reportRow?.maxPositionSize ?? "n/a"}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      Biggest share exposure in this round trip.
                    </div>
                  </div>
                  <div className="border border-zinc-900 bg-zinc-950/40 p-3">
                    <div className="text-xs uppercase tracking-wide text-zinc-500">
                      Final position
                    </div>
                    <div
                      className={`mt-2 font-mono text-xl ${
                        view.reportRow?.isOpenPosition
                          ? "text-amber-300"
                          : "text-emerald-300"
                      }`}
                    >
                      {view.reportRow?.finalPositionSize ?? "n/a"}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {view.reportRow?.isOpenPosition
                        ? "This review stays execution-only until the trade is flat."
                        : "This round trip closed back to flat."}
                    </div>
                  </div>
                  <div className="border border-zinc-900 bg-zinc-950/40 p-3">
                    <div className="text-xs uppercase tracking-wide text-zinc-500">
                      Realized P/L path
                    </div>
                    <div
                      className={`mt-2 font-mono text-xl ${
                        (finalReplayPnl ?? 0) >= 0
                          ? "text-emerald-300"
                          : "text-rose-300"
                      }`}
                    >
                      {formatSigned(finalReplayPnl)}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {replaySummary}
                    </div>
                  </div>
                </div>
                {replayChart ? (
                  <div
                    className="mt-5 border border-zinc-900 bg-zinc-950/35 p-3"
                    data-testid="trade-execution-replay-chart"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-100">
                          Execution Price Path
                        </h3>
                        <div className="mt-1 text-xs leading-5 text-zinc-500">
                          {replayChartContextCopy({
                            candleCount: replayChart.candles.length,
                            candleQualityNotes:
                              decisionReviewSnapshot?.review.candleQualityNotes,
                            chartEvidenceAvailable: canShowTradeChartEvidence,
                            chartTierEnabled,
                          })}
                        </div>
                      </div>
                      <div className="text-xs font-mono text-sky-300">
                        {replayChart.candles.length > 0
                          ? `${replayChart.candles.length} ${replayChart.candleTimeframe ?? ""} candle${
                              replayChart.candles.length === 1 ? "" : "s"
                            }`
                          : `${replay.steps.length} fill${
                              replay.steps.length === 1 ? "" : "s"
                            }`}
                      </div>
                    </div>
                    <svg
                      aria-label={`${tradeDisplaySymbol} ${
                        replayChart.candles.length > 0
                          ? "candle"
                          : "execution-only"
                      } trade replay chart`}
                      className="mt-4 h-auto w-full overflow-visible"
                      role="img"
                      viewBox="0 0 720 260"
                    >
                      <title>{`${tradeDisplaySymbol} ${
                        replayChart.candles.length > 0
                          ? "candle"
                          : "execution-only"
                      } trade replay chart`}</title>
                      <rect
                        className="fill-zinc-950"
                        height="260"
                        width="720"
                        x="0"
                        y="0"
                      />
                      {replayChart.priceLines.map((line) => (
                        <g key={`${line.label}-${line.y}`}>
                          <line
                            className="stroke-zinc-800"
                            strokeDasharray="4 6"
                            strokeWidth="1"
                            x1="54"
                            x2="692"
                            y1={line.y}
                            y2={line.y}
                          />
                          <text
                            className="fill-zinc-500 text-[11px]"
                            x="8"
                            y={line.y + 4}
                          >
                            {line.label}
                          </text>
                        </g>
                      ))}
                      <line
                        className="stroke-zinc-700"
                        strokeWidth="1.5"
                        x1="54"
                        x2="692"
                        y1="218"
                        y2="218"
                      />
                      <line
                        className="stroke-zinc-700"
                        strokeWidth="1.5"
                        x1="54"
                        x2="54"
                        y1="26"
                        y2="218"
                      />
                      {replayChart.candles.map((candle) => (
                        <g
                          key={`replay-candle-${candle.candle.timestamp}-${candle.candle.segment}`}
                        >
                          <title>
                            {`${timeLabelEt(candle.candle.timestamp)} ET ${replayCandleSegmentLabel(
                              candle.candle.segment,
                            )}: open ${formatExecutionPrice(
                              candle.candle.open,
                            )}, high ${formatExecutionPrice(
                              candle.candle.high,
                            )}, low ${formatExecutionPrice(
                              candle.candle.low,
                            )}, close ${formatExecutionPrice(
                              candle.candle.close,
                            )}`}
                          </title>
                          <line
                            className={replayCandleWickClass(candle.candle)}
                            strokeWidth="1"
                            x1={candle.x}
                            x2={candle.x}
                            y1={candle.highY}
                            y2={candle.lowY}
                          />
                          <rect
                            className={replayCandleBodyClass(candle.candle)}
                            height={candle.bodyHeight}
                            rx="1.5"
                            width={candle.bodyWidth}
                            x={candle.x - candle.bodyWidth / 2}
                            y={candle.bodyY}
                          />
                        </g>
                      ))}
                      {replayChart.points.length > 1 ? (
                        <polyline
                          className={
                            replayChart.candles.length > 0
                              ? "stroke-sky-200/70"
                              : "stroke-sky-300"
                          }
                          fill="none"
                          points={replayChart.polylinePoints}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={
                            replayChart.candles.length > 0 ? "1.75" : "2.5"
                          }
                        />
                      ) : null}
                      {replayChart.points.map((point) => (
                        <g key={`execution-chart-point-${point.step.index}`}>
                          <title>
                            {`${point.step.index + 1}. ${executionActionLabel(
                              point.step,
                              trade.tradeDirection,
                            )} at ${formatExecutionPrice(point.step.price)} around ${timeLabelEt(
                              point.step.timestamp,
                            )} ET`}
                          </title>
                          <line
                            className="stroke-zinc-900"
                            strokeWidth="1"
                            x1={point.x}
                            x2={point.x}
                            y1="26"
                            y2="218"
                          />
                          <circle
                            className={executionChartMarkerClass(point.step)}
                            cx={point.x}
                            cy={point.y}
                            r={
                              point.step.riskDirection === "closed"
                                ? "6.5"
                                : "6"
                            }
                            strokeWidth="2"
                          />
                          {point.showInlineLabel ? (
                            <text
                              className="fill-zinc-950 text-[9px] font-bold"
                              dominantBaseline="middle"
                              textAnchor="middle"
                              x={point.x}
                              y={point.y + 0.5}
                            >
                              {point.step.index + 1}
                            </text>
                          ) : null}
                        </g>
                      ))}
                      <text
                        className="fill-zinc-500 text-[11px]"
                        x="54"
                        y="246"
                      >
                        {replayChart.startLabel} ET
                      </text>
                      <text
                        className="fill-zinc-500 text-[11px]"
                        textAnchor="end"
                        x="692"
                        y="246"
                      >
                        {replayChart.endLabel} ET
                      </text>
                    </svg>
                    <div
                      className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4"
                      data-testid="trade-execution-strip"
                    >
                      {replay.steps.map((point) => (
                        <div
                          className="border border-zinc-900 bg-zinc-950/40 p-3"
                          key={`execution-strip-${point.index}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold text-zinc-950 ${executionChartLegendDotClass(
                                  point,
                                )}`}
                              >
                                {point.index + 1}
                              </span>
                              <span className="min-w-0 text-sm font-semibold text-zinc-100">
                                {executionActionLabel(
                                  point,
                                  trade.tradeDirection,
                                )}
                              </span>
                            </div>
                            <span className="shrink-0 text-xs text-zinc-500">
                              {timeLabelEt(point.timestamp)} ET
                            </span>
                          </div>
                          <div className="mt-2 grid gap-1 text-xs leading-5 text-zinc-500">
                            <div>
                              {point.shares} shares at{" "}
                              <span className="font-mono text-zinc-300">
                                {formatExecutionPrice(point.price)}
                              </span>
                            </div>
                            <div>
                              Position{" "}
                              <span className="font-mono text-zinc-300">
                                {point.positionBeforeExecution}
                              </span>{" "}
                              to{" "}
                              <span className="font-mono text-zinc-300">
                                {point.positionAfterExecution}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
                      {replayChart.candles.length > 0 ? (
                        <>
                          <span className="inline-flex items-center gap-2">
                            <span className="h-2.5 w-2.5 border border-emerald-200/80 bg-emerald-400/75" />
                            Up candle
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <span className="h-2.5 w-2.5 border border-rose-200/80 bg-rose-400/75" />
                            Down candle
                          </span>
                        </>
                      ) : null}
                      {["Entry", "Add", "Reduce", "Exit"].map((label) => {
                        const samplePoint =
                          replay.steps.find(
                            (step) => executionChartLegendLabel(step) === label,
                          ) ?? null;

                        return (
                          <span
                            key={label}
                            className="inline-flex items-center gap-2"
                          >
                            <span
                              className={`h-2.5 w-2.5 rounded-full border ${
                                samplePoint
                                  ? executionChartLegendDotClass(samplePoint)
                                  : "border-zinc-700 bg-zinc-800"
                              }`}
                            />
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                <div
                  className="mt-5 grid gap-3"
                  data-testid="trade-visual-replay"
                >
                  {replay.steps.map((point) => (
                    <div
                      key={point.index}
                      className="border border-zinc-900 bg-zinc-950/35 p-3"
                      data-testid={`trade-replay-step-${point.index}`}
                    >
                      <div className="grid gap-3 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)_150px] lg:items-center">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex border px-2 py-1 text-xs font-semibold uppercase tracking-wide ${executionActionTone(
                                point,
                              )}`}
                            >
                              {point.index + 1}.{" "}
                              {executionActionLabel(
                                point,
                                trade.tradeDirection,
                              )}
                            </span>
                            <span className="font-mono text-xs text-zinc-500">
                              {timeLabelEt(point.timestamp)} ET
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-zinc-300">
                            {point.shares} shares at{" "}
                            {formatExecutionPrice(point.price)}
                          </div>
                          <div className="mt-1 text-xs text-zinc-500">
                            {point.marker}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="text-zinc-500">
                              Position after execution
                            </span>
                            <span className="font-mono text-zinc-300">
                              {point.positionBeforeExecution}
                              {" -> "}
                              {point.positionAfterExecution}
                            </span>
                          </div>
                          <div className="mt-2 h-3 bg-zinc-900">
                            <div
                              className={`h-3 ${executionBarClass(point)}`}
                              style={{
                                width: `${
                                  point.positionAfterExecution === 0
                                    ? 0
                                    : Math.max(point.positionPctOfMax * 100, 4)
                                }%`,
                              }}
                            />
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide">
                            {point.linkedRiskLabels.slice(0, 2).map((label) => (
                              <span
                                className="text-amber-300"
                                key={`risk-${point.index}-${label}`}
                              >
                                {label}
                              </span>
                            ))}
                            {point.linkedStrengthLabels
                              .slice(0, 2)
                              .map((label) => (
                                <span
                                  className="text-emerald-300"
                                  key={`strength-${point.index}-${label}`}
                                >
                                  {label}
                                </span>
                              ))}
                          </div>
                        </div>
                        <div className="border-t border-zinc-900 pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
                          <div className="text-xs uppercase tracking-wide text-zinc-500">
                            Execution-derived P/L
                          </div>
                          <div
                            className={`mt-2 font-mono text-lg ${replayPnlTone(point)}`}
                          >
                            {replayPnlLabel(point)}
                          </div>
                          <div className="mt-1 text-xs text-zinc-500">
                            {typeof point.realizedPnlProgress === "number"
                              ? "Realized after this execution."
                              : "No reduction or exit has realized P/L here."}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <details
                className="ti-advanced-panel p-4"
                data-testid="trade-review-points"
              >
                <summary className="cursor-pointer text-sm font-semibold text-zinc-300">
                  Risks And Strengths
                </summary>
                <div className="mt-4 grid gap-6 lg:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-amber-300">
                      Risks
                    </div>
                    <div className="mt-2 grid gap-2">
                      {view.risks.length === 0 ? (
                        <div className="text-sm text-zinc-500">None</div>
                      ) : (
                        view.risks.map((risk) => (
                          <div
                            key={risk.id}
                            className="border-t border-zinc-900 py-2"
                          >
                            <div className="text-sm text-zinc-100">
                              {risk.label}
                            </div>
                            <div className="mt-1 text-xs text-zinc-500">
                              {risk.summary}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                      Strengths
                    </div>
                    <div className="mt-2 grid gap-2">
                      {view.strengths.length === 0 ? (
                        <div className="text-sm text-zinc-500">None</div>
                      ) : (
                        view.strengths.map((strength) => (
                          <div
                            key={strength.id}
                            className="border-t border-zinc-900 py-2"
                          >
                            <div className="text-sm text-zinc-100">
                              {strength.label}
                            </div>
                            <div className="mt-1 text-xs text-zinc-500">
                              {strength.summary}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </details>
            </section>

            {autopsy ? (
              <section className="grid gap-6 xl:grid-cols-[minmax(0,0.55fr)_minmax(320px,0.45fr)]">
                <div className="ti-panel p-4" data-testid="trade-quality">
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Execution Score Detail
                  </h2>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {autopsy.quality.dimensions.map((dimension) => (
                      <div
                        key={dimension.id}
                        className="border-t border-zinc-900 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-zinc-300">
                            {dimension.label}
                          </span>
                          <span className="font-mono text-xs text-sky-300">
                            {dimension.score}/100
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 bg-zinc-900">
                          <div
                            className="h-1.5 bg-sky-400"
                            style={{ width: `${dimension.score}%` }}
                          />
                        </div>
                        <div className="mt-2 text-xs text-zinc-500">
                          {dimension.detail}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="ti-panel p-4"
                  data-testid="trade-decision-autopsy"
                >
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Execution Decision Notes
                  </h2>
                  <div className="mt-4 grid gap-3">
                    {autopsy.decisions.map((decision) => (
                      <div
                        key={decision.id}
                        className="border-t border-zinc-900 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-zinc-300">
                            {decision.label}
                          </span>
                          <span className="text-xs uppercase tracking-wide text-zinc-500">
                            {decision.role}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">
                          {decision.detail}
                        </div>
                        {decision.relatedPointLabels.length > 0 ? (
                          <div className="mt-2 text-xs text-amber-300">
                            {decision.relatedPointLabels.join(" / ")}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}

            <div id="evidence">
              <AdvancedDisclosure
                summary="More evidence, comparisons, and writing prompts"
                testId="trade-supporting-details"
              >
                <section className="grid gap-6 xl:grid-cols-[minmax(0,0.55fr)_minmax(320px,0.45fr)]">
                  <div className="ti-panel p-4">
                    <h2 className="text-sm font-semibold text-zinc-100">
                      Score Explanation
                    </h2>
                    {gradeExplanation ? (
                      <div className="mt-4">
                        <div className="flex items-center justify-between gap-3 border-t border-zinc-900 py-3">
                          <span className="text-sm text-zinc-300">
                            {gradeExplanation.summary}
                          </span>
                          <span className="font-mono text-xs text-sky-300">
                            {gradeExplanation.overallScore}/100
                          </span>
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          {[
                            ...gradeExplanation.negativeDrivers,
                            ...gradeExplanation.positiveDrivers,
                            ...gradeExplanation.neutralDrivers,
                          ].map((driver) => (
                            <div
                              key={driver.id}
                              className="border-t border-zinc-900 py-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm text-zinc-300">
                                  {driver.label}
                                </span>
                                <span className="font-mono text-xs text-zinc-500">
                                  {driver.score}/100
                                </span>
                              </div>
                              <div className="mt-1 text-xs text-zinc-500">
                                {driver.explanation}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 text-xs text-sky-300">
                          {gradeExplanation.nextReviewAction}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 text-sm text-zinc-500">
                        No grade explanation is available for this trade.
                      </div>
                    )}
                  </div>

                  <div className="ti-panel p-4">
                    <h2 className="text-sm font-semibold text-zinc-100">
                      Supporting Evidence
                    </h2>
                    <div className="mt-4 grid gap-3">
                      <TradeDetailLevelFactsPanel
                        contract={levelFactsUiContract}
                      />
                      {evidenceCards.length === 0 ? (
                        <div className="text-sm text-zinc-500">
                          No product evidence cards are linked to this trade
                          yet.
                        </div>
                      ) : (
                        evidenceCards.slice(0, 5).map((card) => (
                          <div
                            key={card.id}
                            className="border-t border-zinc-900 py-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm text-zinc-300">
                                {card.title}
                              </span>
                              <span className="text-xs uppercase tracking-wide text-zinc-500">
                                {plainEvidenceSourceLabel(card.source)}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-zinc-500">
                              {card.whatHappened}
                            </div>
                            <div className="mt-2 text-xs text-sky-300">
                              {card.reviewAction}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                  <div className="ti-panel p-4">
                    <h2 className="text-sm font-semibold text-zinc-100">
                      Behavior Timeline
                    </h2>
                    <div className="mt-4 grid gap-3">
                      {mistakeTimeline.length === 0 ? (
                        <div className="text-sm text-zinc-500">
                          No mapped behavior timeline items for this trade.
                        </div>
                      ) : (
                        mistakeTimeline.slice(0, 6).map((item) => (
                          <div
                            key={item.id}
                            className="border-t border-zinc-900 py-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm text-zinc-300">
                                {item.label}
                              </span>
                              <span className="font-mono text-xs text-amber-300">
                                #{item.executionIndex + 1}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-zinc-500">
                              {item.detail}
                            </div>
                            <div className="mt-2 text-xs text-zinc-500">
                              {item.confidence} confidence / {item.role}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="ti-panel p-4">
                    <h2 className="text-sm font-semibold text-zinc-100">
                      Similar Trades
                    </h2>
                    <div className="mt-1 text-sm text-zinc-500">
                      Use these as comparison examples after this trade has one
                      clear lesson.
                    </div>
                    <div className="mt-4 grid gap-3">
                      {similarTrades.length === 0 ? (
                        <div className="text-sm text-zinc-500">
                          No similar saved-trade examples are linked yet.
                        </div>
                      ) : (
                        similarTrades.map((similar) => (
                          <Link
                            key={similar.tradeId}
                            className="block border-t border-zinc-900 py-3 transition hover:text-sky-200"
                            href={withPageAnchor(
                              `/intelligence/trades/${encodeURIComponent(similar.tradeId)}`,
                              "writing-flow",
                            )}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm text-zinc-300">
                                {userFacingTradeSymbol(similar.symbol)}
                              </span>
                              <span
                                className={`font-mono text-xs ${
                                  (similar.grossRealizedPnl ?? 0) >= 0
                                    ? "text-emerald-300"
                                    : "text-rose-300"
                                }`}
                              >
                                {formatSigned(similar.grossRealizedPnl)}
                              </span>
                            </div>
                            <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                              Why similar
                            </div>
                            <div className="mt-1 text-xs leading-5 text-zinc-400">
                              {similar.sharedReasons.join(" / ")}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                              <span>{similar.similarityScore} match</span>
                              <span>
                                quality {similar.qualityScore ?? "n/a"}
                              </span>
                              <span className="text-sky-300">
                                Open review hub
                              </span>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                  <div className="ti-panel p-4">
                    <h2 className="text-sm font-semibold text-zinc-100">
                      Journal Prompts
                    </h2>
                    <div className="mt-4 grid gap-3">
                      {view.journalPrompts.map((prompt) => (
                        <div
                          key={prompt.id}
                          className="border-t border-zinc-900 py-3"
                        >
                          <div className="text-xs uppercase tracking-wide text-zinc-500">
                            {prompt.label}
                          </div>
                          <div className="mt-2 text-sm text-zinc-300">
                            {prompt.prompt}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </AdvancedDisclosure>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
