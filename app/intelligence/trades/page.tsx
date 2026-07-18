import { requireTraderIntelligenceOwnerPageAccess } from "@/src/lib/trader-intelligence-v3/auth";

import Link from "next/link";
import type { Metadata } from "next";
import {
  DashboardSideNav,
  MetricCard,
  PlainStateBadge,
  PrimaryActionPanel,
  WorkflowHandoffPanel,
  userFacingTradeDirection,
} from "@/app/app-ui";
import { buildSavedOrSampleTraderAnalyticsViewModel } from "@/src/lib/trader-analytics/server/saved-trader-analytics-data";
import {
  buildSavedReviewQueueReadModel,
  type SavedReviewQueueItem,
  type SavedReviewQueueFilter,
} from "@/src/lib/trader-analytics/server/saved-review-queue";
import { buildSavedTradeThreadReadModel } from "@/src/lib/trader-analytics/server/saved-trade-threads";
import { sellStartingReviewLimitationCopy } from "@/src/lib/trader-analytics/product/trade-display-copy";
import {
  canUseChartContext,
  readTraderIntelligenceTierFromEnv,
} from "@/src/lib/trader-analytics/product/tier-config";
import { filterCustomerSavedTrades } from "@/src/lib/trader-analytics/product/customer-data-filter";
import { OpenSwingMarkClosedButton } from "./open-swing-mark-closed-button";

export const metadata: Metadata = {
  title: "Saved Trades | Trader Intelligence",
};

export const dynamic = "force-dynamic";

function signed(value: number | null | undefined): string {
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

function daySessionHrefFor(sessionDate: string): string {
  return `/intelligence/trades/day-session/${encodeURIComponent(sessionDate)}`;
}

const CHART_CONTEXT_EVIDENCE_IDS = new Set([
  "chart-context-available",
  "market-context-insights-available",
  "post-exit-context-finding",
  "volume-context-reviewed",
  "volume-context-to-compare",
  "chart-context-to-check",
]);

function visibleStoryEvidence<T extends { id: string }>(
  items: T[],
  chartTierEnabled: boolean,
): T[] {
  if (chartTierEnabled) {
    return items;
  }

  return items.filter((item) => !CHART_CONTEXT_EVIDENCE_IDS.has(item.id));
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

function normalizeReviewLane(value: string | undefined): SavedReviewQueueFilter | "none" {
  const allowed = new Set([
    "all",
    "completed",
    "market_context_unavailable",
    "blocked_open_trade",
    "analysis_failed",
    "highest_priority",
    "unresolved",
  ]);

  return value && allowed.has(value)
    ? (value as SavedReviewQueueFilter)
    : "none";
}

type TradeStoryFilter =
  | "all"
  | "giveback"
  | "losses"
  | "swing"
  | "extended"
  | "open"
  | "added"
  | "chart_findings"
  | "add_quality"
  | "post_exit"
  | "protected_profit"
  | "exit_levels"
  | "levels"
  | "volume"
  | "needs_context";

type TradeBrowseMode =
  | "calendar"
  | "round_trips"
  | "ticker_stories"
  | "session_stories"
  | "open_swing"
  | "needs_review";

const TRADE_LIST_PAGE_SIZE = 18;

function normalizeBrowseMode(value: string | undefined): TradeBrowseMode {
  const allowed = new Set([
    "calendar",
    "round_trips",
    "ticker_stories",
    "session_stories",
    "open_swing",
    "needs_review",
  ]);

  return value && allowed.has(value) ? (value as TradeBrowseMode) : "session_stories";
}

function normalizeTradeListPage(value: string | undefined, totalPages: number): number {
  const parsed = Number.parseInt(value ?? "1", 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.min(parsed, totalPages);
}

function normalizeStoryFilter(value: string | undefined): TradeStoryFilter {
  const allowed = new Set([
    "all",
    "giveback",
    "losses",
    "swing",
    "extended",
    "open",
    "added",
    "chart_findings",
    "add_quality",
    "post_exit",
    "protected_profit",
    "exit_levels",
    "levels",
    "volume",
    "needs_context",
  ]);

  return value && allowed.has(value) ? (value as TradeStoryFilter) : "all";
}

function storyMatchesFilter(
  thread: ReturnType<typeof buildSavedTradeThreadReadModel>["threads"][number],
  filter: TradeStoryFilter,
): boolean {
  if (filter === "all") {
    return thread.roundTripCount > 1;
  }

  if (filter === "giveback") {
    return thread.storyKind === "profit_giveback";
  }

  if (filter === "losses") {
    return thread.storyKind === "repeated_losing_attempts";
  }

  if (filter === "swing") {
    return thread.storyKind === "swing_transition";
  }

  if (filter === "extended") {
    return thread.storyKind === "extended_same_day_hold";
  }

  if (filter === "open") {
    return thread.storyKind === "open_reentry";
  }

  if (filter === "added") {
    return thread.storyKind === "reentry_added_profit";
  }

  if (filter === "chart_findings") {
    return thread.marketContextFindingCount > 0;
  }

  if (filter === "add_quality") {
    return thread.addQualityFindingCount > 0;
  }

  if (filter === "post_exit") {
    return thread.postExitFindingCount > 0;
  }

  if (filter === "protected_profit") {
    return thread.protectedProfitBeforeFadeFindingCount > 0;
  }

  if (filter === "exit_levels") {
    return thread.exitLevelFindingCount > 0;
  }

  if (filter === "levels") {
    return thread.levelFindingCount > 0;
  }

  if (filter === "volume") {
    return thread.volumeFindingCount > 0;
  }

  return thread.roundTrips.some(
    (roundTrip) => roundTrip.chartContextStatus === "waiting",
  );
}

function rowLooksOpenOrSwing(
  row: ReturnType<typeof buildSavedOrSampleTraderAnalyticsViewModel>["viewModel"]["latestReport"]["report"]["trades"][number] | undefined,
): boolean {
  if (!row) {
    return false;
  }

  return Boolean(
    row.isOpenPosition ||
      row.heldOvernight ||
      row.heldPostmarketIntoOvernight ||
      row.heldSessionBuckets?.some((bucket) =>
        String(bucket).toLowerCase().includes("overnight"),
      ),
  );
}

function laneToneClass(lane: string): string {
  return lane === "completed"
    ? "text-emerald-300"
    : lane === "blocked_open_trade"
      ? "text-sky-300"
      : lane === "market_context_unavailable" || lane === "analysis_failed"
        ? "text-amber-300"
        : "text-zinc-300";
}

function primaryTriageItem(
  queue: ReturnType<typeof buildSavedReviewQueueReadModel> | null,
): SavedReviewQueueItem | null {
  if (!queue) {
    return null;
  }

  return queue.items[0] ?? queue.allItems[0] ?? null;
}

function activeBrowseModeCopy(mode: TradeBrowseMode): {
  detail: string;
  label: string;
  nextAction: string;
} {
  if (mode === "calendar") {
    return {
      detail:
        "Showing one month at a time so you can spot green days, red days, and which tickers drove each session.",
      label: "Calendar",
      nextAction: "Open a trading day from the calendar, then choose the ticker story that mattered most.",
    };
  }

  if (mode === "ticker_stories") {
    return {
      detail:
        "Showing trades that belong to same-symbol stories. Use this when a ticker was entered, exited, and then entered again.",
      label: "Ticker stories",
      nextAction: "Open one ticker story and compare the later attempts against the first one.",
    };
  }

  if (mode === "session_stories") {
    return {
      detail:
        "Start with the full trading day, then open the ticker story that mattered most before drilling into individual round trips.",
      label: "Day sessions",
      nextAction: "Open one day session, choose the ticker story, then open the round trip that needs review.",
    };
  }

  if (mode === "open_swing") {
    return {
      detail:
        "Showing trades that stayed open or crossed into another session. Use this to review whether the hold plan was clear.",
      label: "Open or swing reviews",
      nextAction: "Check whether the position is flat before using completed-trade coaching.",
    };
  }

  if (mode === "needs_review") {
    return {
      detail:
        "Showing saved trades that still have review work waiting. Use this to clear the queue after an import.",
      label: "Needs review",
      nextAction: "Open the first trade, replay executions, then save the note and checklist.",
    };
  }

  return {
    detail:
      "Showing each flat-to-flat round trip. Use this when you want the basic trade record before grouping by ticker or session.",
    label: "Round trips",
    nextAction: "Open a trade card and start from the execution replay.",
  };
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function monthKeyFromDate(year: number, zeroBasedMonth: number): string {
  return `${year}-${pad2(zeroBasedMonth + 1)}`;
}

function shiftMonthKey(monthKey: string, offset: number): string {
  const [yearPart, monthPart] = monthKey.split("-");
  const year = Number.parseInt(yearPart ?? "", 10);
  const month = Number.parseInt(monthPart ?? "", 10);
  const shifted = new Date(Date.UTC(year, month - 1 + offset, 1));

  return monthKeyFromDate(shifted.getUTCFullYear(), shifted.getUTCMonth());
}

function monthLabel(monthKey: string): string {
  const [yearPart, monthPart] = monthKey.split("-");
  const year = Number.parseInt(yearPart ?? "", 10);
  const month = Number.parseInt(monthPart ?? "", 10);

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return "Month";
  }

  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  });
}

function normalizeCalendarMonth(
  value: string | undefined,
  availableMonths: string[],
): string {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    return value;
  }

  return availableMonths.at(-1) ?? monthKeyFromDate(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
  );
}

function pnlToneClass(value: number | null | undefined): string {
  if (typeof value !== "number" || value === 0) {
    return "text-zinc-300";
  }

  return value > 0 ? "text-emerald-300" : "text-rose-300";
}

function pnlSurfaceClass(value: number | null | undefined): string {
  if (typeof value !== "number") {
    return "border-zinc-900 bg-zinc-950/30";
  }

  if (value > 0) {
    return "border-emerald-500/40 bg-emerald-500/10";
  }

  if (value < 0) {
    return "border-rose-500/40 bg-rose-500/10";
  }

  return "border-zinc-800 bg-zinc-950/40";
}

function calendarHref(monthKey: string): string {
  return `/intelligence/trades/calendar?month=${encodeURIComponent(monthKey)}#calendar`;
}

function calendarDayHref(sessionDate: string): string {
  return daySessionHrefFor(sessionDate);
}

function buildCalendarCells(
  sessionStories: ReturnType<
    typeof buildSavedTradeThreadReadModel
  >["sessionStories"],
  monthKey: string,
) {
  const [yearPart, monthPart] = monthKey.split("-");
  const year = Number.parseInt(yearPart ?? "", 10);
  const month = Number.parseInt(monthPart ?? "", 10);
  const storyByDate = new Map(
    sessionStories.map((story) => [story.sessionDate, story]),
  );
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: Array<{
    dayNumber: number | null;
    href: string | null;
    sessionDate: string | null;
    story: (typeof sessionStories)[number] | null;
  }> = [];
  let hasPlacedFirstVisibleDay = false;

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(Date.UTC(year, month - 1, day));
    const marketWeekday = date.getUTCDay();

    if (marketWeekday === 6) {
      continue;
    }

    if (!hasPlacedFirstVisibleDay) {
      for (let index = 0; index < marketWeekday; index += 1) {
        cells.push({
          dayNumber: null,
          href: null,
          sessionDate: null,
          story: null,
        });
      }

      hasPlacedFirstVisibleDay = true;
    }

    const sessionDate = `${monthKey}-${pad2(day)}`;
    const story = storyByDate.get(sessionDate) ?? null;

    cells.push({
      dayNumber: day,
      href: story ? calendarDayHref(sessionDate) : null,
      sessionDate,
      story,
    });
  }

  while (cells.length % 6 !== 0) {
    cells.push({
      dayNumber: null,
      href: null,
      sessionDate: null,
      story: null,
    });
  }

  return cells;
}

function tradeReviewReason(args: {
  isOpenOrSwing: boolean;
  isSessionStoryTrade: boolean;
  isTickerStoryTrade: boolean;
  queueItem: SavedReviewQueueItem | undefined;
  row: ReturnType<typeof buildSavedOrSampleTraderAnalyticsViewModel>["viewModel"]["latestReport"]["report"]["trades"][number] | undefined;
}): {
  action: string;
  label: string;
  tone: "default" | "info" | "success" | "warning" | "danger";
} {
  if (args.queueItem) {
    return {
      action: args.queueItem.nextAction,
      label: args.queueItem.stateDetail,
      tone:
        args.queueItem.lane === "completed"
          ? "success"
          : args.queueItem.lane === "blocked_open_trade"
            ? "info"
            : "warning",
    };
  }

  if (args.isOpenOrSwing) {
    return {
      action: "Check the hold plan and whether the trade is flat yet.",
      label: "Open or swing exposure is the main review question.",
      tone: "info",
    };
  }

  if (args.isTickerStoryTrade) {
    return {
      action: "Compare this round trip with the other same-ticker attempts.",
      label: "This trade belongs to a same-symbol story.",
      tone: "info",
    };
  }

  if (args.isSessionStoryTrade) {
    return {
      action: "Use the session story to review the full trading day.",
      label: "This trade contributes to a full-day review.",
      tone: "info",
    };
  }

  if (typeof args.row?.grossRealizedPnl === "number" && args.row.grossRealizedPnl < 0) {
    return {
      action: "Replay entries, adds, reductions, and exits before writing the lesson.",
      label: "Closed red. Review what caused the loss.",
      tone: "danger",
    };
  }

  if (typeof args.row?.grossRealizedPnl === "number" && args.row.grossRealizedPnl > 0) {
    return {
      action: "Replay the exit choices and note what is worth repeating.",
      label: "Closed green. Look for the strongest decision.",
      tone: "success",
    };
  }

  return {
    action: "Replay executions and write the main lesson.",
    label: "Execution review is available.",
    tone: "default",
  };
}

export default async function TradesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    page?: string;
    reviewLane?: string;
    storyFilter?: string;
    session?: string;
    thread?: string;
    view?: string;
    month?: string;
  }>;
}) {
  await requireTraderIntelligenceOwnerPageAccess("app/intelligence/trades/page.tsx");
  const query = await searchParams;
  const activeReviewLane = normalizeReviewLane(query?.reviewLane);
  const activeStoryFilter = normalizeStoryFilter(query?.storyFilter);
  const activeBrowseMode = normalizeBrowseMode(query?.view);
  const isLandingPage = !(
    query?.view ||
    query?.session ||
    query?.thread ||
    query?.reviewLane ||
    query?.storyFilter ||
    query?.month ||
    query?.page
  );
  const showCalendarSection = activeBrowseMode === "calendar";
  const showTickerStoriesSection = activeBrowseMode === "ticker_stories";
  const showSessionStoriesSection = activeBrowseMode === "session_stories";
  const showReviewLanes =
    activeBrowseMode === "needs_review" ||
    activeBrowseMode === "round_trips" ||
    activeBrowseMode === "open_swing";
  const showTradeList =
    activeBrowseMode === "round_trips" ||
    activeBrowseMode === "needs_review" ||
    activeBrowseMode === "open_swing";
  const data = buildSavedOrSampleTraderAnalyticsViewModel();
  const activeTier = readTraderIntelligenceTierFromEnv();
  const chartContextAllowed = canUseChartContext(activeTier);
  const allTrades = filterCustomerSavedTrades(
    data.repository.listTrades(data.userId),
  );
  const latestReport = data.viewModel.latestReport;
  const reportRowsByTradeId = new Map(
    latestReport.sourceTradeIds
      .map((tradeId, index) => {
        const row =
          latestReport.report.trades.find(
            (candidate) => candidate.tradeIndex === index + 1,
          ) ?? null;

        return row ? ([tradeId, row] as const) : null;
      })
      .filter((entry): entry is readonly [
        string,
        typeof latestReport.report.trades[number],
      ] => Boolean(entry)),
  );
  const savedDecisionReviewSnapshots =
    data.mode === "saved"
      ? [
          ...new Set(
            allTrades
              .map((trade) => trade.importBatchId)
              .filter((batchId): batchId is string => Boolean(batchId)),
          ),
        ].flatMap((batchId) =>
          data.repository.listDecisionReviewSnapshotsForBatch(batchId),
        )
      : [];
  const chartTierEnabled =
    chartContextAllowed &&
    (data.mode === "sample" || savedDecisionReviewSnapshots.length > 0);
  const decisionReviewSnapshots = chartTierEnabled
    ? savedDecisionReviewSnapshots
    : [];
  const tradeThreadModel = buildSavedTradeThreadReadModel({
    decisionReviewSnapshots,
    report: latestReport,
    source: data.mode === "saved" ? "saved_sqlite" : "sample",
    trades: allTrades,
  });
  const activeThread =
    query?.thread
      ? tradeThreadModel.threads.find((thread) => thread.id === query.thread)
      : null;
  const activeSessionStory =
    query?.session
      ? tradeThreadModel.sessionStories.find(
          (story) => story.sessionDate === query.session,
        ) ?? null
      : null;
  const availableCalendarMonths = [
    ...new Set(
      tradeThreadModel.sessionStories.map((story) =>
        story.sessionDate.slice(0, 7),
      ),
    ),
  ].sort((left, right) => left.localeCompare(right));
  const activeCalendarMonth = normalizeCalendarMonth(
    query?.month,
    availableCalendarMonths,
  );
  const previousCalendarMonth = shiftMonthKey(activeCalendarMonth, -1);
  const nextCalendarMonth = shiftMonthKey(activeCalendarMonth, 1);
  const calendarCells = buildCalendarCells(
    tradeThreadModel.sessionStories,
    activeCalendarMonth,
  );
  const calendarMonthStories = tradeThreadModel.sessionStories.filter((story) =>
    story.sessionDate.startsWith(activeCalendarMonth),
  );
  const calendarMonthPnl = calendarMonthStories.reduce(
    (total, story) => total + story.totalGrossRealizedPnl,
    0,
  );
  const calendarGreenDayCount = calendarMonthStories.filter(
    (story) => story.totalGrossRealizedPnl > 0,
  ).length;
  const calendarRedDayCount = calendarMonthStories.filter(
    (story) => story.totalGrossRealizedPnl < 0,
  ).length;
  const calendarBestDay =
    [...calendarMonthStories].sort(
      (left, right) =>
        right.totalGrossRealizedPnl - left.totalGrossRealizedPnl,
    )[0] ?? null;
  const calendarWorstDay =
    [...calendarMonthStories].sort(
      (left, right) =>
        left.totalGrossRealizedPnl - right.totalGrossRealizedPnl,
    )[0] ?? null;
  const storyFilters: Array<{
    id: TradeStoryFilter;
    label: string;
    count: number;
  }> = [
    {
      id: "all",
      label: "All ticker stories",
      count: tradeThreadModel.threads.filter((thread) => thread.roundTripCount > 1).length,
    },
    {
      id: "giveback",
      label: "Gave back profit",
      count: tradeThreadModel.threads.filter((thread) => storyMatchesFilter(thread, "giveback")).length,
    },
    {
      id: "losses",
      label: "Repeated losses",
      count: tradeThreadModel.threads.filter((thread) => storyMatchesFilter(thread, "losses")).length,
    },
    {
      id: "swing",
      label: "Turned swing",
      count: tradeThreadModel.threads.filter((thread) => storyMatchesFilter(thread, "swing")).length,
    },
    {
      id: "extended",
      label: "Extended holds",
      count: tradeThreadModel.threads.filter((thread) => storyMatchesFilter(thread, "extended")).length,
    },
    {
      id: "open",
      label: "Open re-entry",
      count: tradeThreadModel.threads.filter((thread) => storyMatchesFilter(thread, "open")).length,
    },
    {
      id: "added",
      label: "Added profit",
      count: tradeThreadModel.threads.filter((thread) => storyMatchesFilter(thread, "added")).length,
    },
    {
      id: "chart_findings",
      label: "Chart findings",
      count: tradeThreadModel.threads.filter((thread) => storyMatchesFilter(thread, "chart_findings")).length,
    },
    {
      id: "add_quality",
      label: "Add quality",
      count: tradeThreadModel.threads.filter((thread) => storyMatchesFilter(thread, "add_quality")).length,
    },
    {
      id: "post_exit",
      label: "After exit",
      count: tradeThreadModel.threads.filter((thread) => storyMatchesFilter(thread, "post_exit")).length,
    },
    {
      id: "protected_profit",
      label: "Protected before fade",
      count: tradeThreadModel.threads.filter((thread) => storyMatchesFilter(thread, "protected_profit")).length,
    },
    {
      id: "exit_levels",
      label: "Support/resistance exits",
      count: tradeThreadModel.threads.filter((thread) => storyMatchesFilter(thread, "exit_levels")).length,
    },
    {
      id: "levels",
      label: "Levels",
      count: tradeThreadModel.threads.filter((thread) => storyMatchesFilter(thread, "levels")).length,
    },
    {
      id: "volume",
      label: "Volume",
      count: tradeThreadModel.threads.filter((thread) => storyMatchesFilter(thread, "volume")).length,
    },
    {
      id: "needs_context",
      label: "Needs chart data",
      count: tradeThreadModel.threads.filter((thread) => storyMatchesFilter(thread, "needs_context")).length,
    },
  ];
  const chartStoryFilterIds = new Set<TradeStoryFilter>([
    "chart_findings",
    "add_quality",
    "post_exit",
    "protected_profit",
    "exit_levels",
    "levels",
    "volume",
    "needs_context",
  ]);
  const visibleStoryFilters = chartTierEnabled
    ? storyFilters
    : storyFilters.filter((filter) => !chartStoryFilterIds.has(filter.id));
  const highlightedThreads = [
    ...(activeThread ? [activeThread] : []),
    ...tradeThreadModel.threads.filter(
      (thread) =>
        storyMatchesFilter(thread, activeStoryFilter) &&
        thread.id !== activeThread?.id,
    ),
  ].slice(0, 6);
  const savedReviewQueue =
    data.mode === "saved"
      ? buildSavedReviewQueueReadModel({
          repository: data.repository,
          activeFilter:
            activeReviewLane === "none" ? "all" : activeReviewLane,
          includeChartContext: chartContextAllowed,
        })
      : null;
  const queueByTradeId = new Map(
    (savedReviewQueue?.allItems ?? []).map((item) => [item.savedTradeId, item]),
  );
  const multiRoundTripTradeIds = new Set(
    tradeThreadModel.threads
      .filter((thread) => thread.roundTripCount > 1)
      .flatMap((thread) => thread.roundTrips.map((roundTrip) => roundTrip.tradeId)),
  );
  const sessionStoryTradeIds = new Set(
    tradeThreadModel.sessionStories.flatMap((story) =>
      tradeThreadModel.threads
        .filter((thread) => thread.sessionDate === story.sessionDate)
        .flatMap((thread) =>
          thread.roundTrips.map((roundTrip) => roundTrip.tradeId),
        ),
    ),
  );
  const openOrSwingTradeIds = new Set(
    [
      ...allTrades
        .filter((trade) => rowLooksOpenOrSwing(reportRowsByTradeId.get(trade.id)))
        .map((trade) => trade.id),
      ...(savedReviewQueue?.allItems ?? [])
        .filter((item) => item.lane === "blocked_open_trade")
        .map((item) => item.savedTradeId),
    ],
  );
  const needsReviewTradeIds = new Set(
    (savedReviewQueue?.allItems ?? [])
      .filter(
        (item) =>
          item.reviewStatus !== "resolved" &&
          item.reviewStatus !== "ignored" &&
          item.reviewStatus !== "reviewed",
      )
      .map((item) => item.savedTradeId),
  );
  const browseModes: Array<{
    body: string;
    count: number;
    href: string;
    id: TradeBrowseMode;
    label: string;
  }> = [
    {
      body: "Start with the trading day, then choose the ticker story.",
      count: tradeThreadModel.sessionStoryCount,
      href: "/intelligence/trades/day-sessions#session-stories",
      id: "session_stories",
      label: "Day Sessions",
    },
    {
      body: "See green/red days and the tickers behind them.",
      count: calendarMonthStories.length,
      href: calendarHref(activeCalendarMonth),
      id: "calendar",
      label: "Calendar",
    },
    {
      body: "Group repeated same-ticker attempts.",
      count: multiRoundTripTradeIds.size,
      href: "/intelligence/trades/ticker-stories#ticker-stories",
      id: "ticker_stories",
      label: "Ticker Stories",
    },
    {
      body: "Each card is one flat-to-flat trade.",
      count: allTrades.length,
      href: "/intelligence/trades/round-trips#trade-list",
      id: "round_trips",
      label: "Round Trips",
    },
    {
      body: "Trades that stayed open or carried overnight.",
      count: openOrSwingTradeIds.size,
      href: "/intelligence/trades/open-swing#trade-list",
      id: "open_swing",
      label: "Open/Swing",
    },
    {
      body: "Saved trades still waiting for review work.",
      count: needsReviewTradeIds.size,
      href: "/intelligence/trades/review-needed#trade-list",
      id: "needs_review",
      label: "Needs Review",
    },
  ];
  const visibleTradeIds =
    savedReviewQueue && activeReviewLane !== "none"
      ? new Set(savedReviewQueue.items.map((item) => item.savedTradeId))
      : null;
  const laneFilteredTrades = visibleTradeIds
    ? allTrades.filter((trade) => visibleTradeIds.has(trade.id))
    : allTrades;
  const trades = laneFilteredTrades.filter((trade) => {
    if (activeBrowseMode === "ticker_stories") {
      return multiRoundTripTradeIds.has(trade.id);
    }

    if (activeBrowseMode === "calendar") {
      return sessionStoryTradeIds.has(trade.id);
    }

    if (activeBrowseMode === "session_stories") {
      return sessionStoryTradeIds.has(trade.id);
    }

    if (activeBrowseMode === "open_swing") {
      return openOrSwingTradeIds.has(trade.id);
    }

    if (activeBrowseMode === "needs_review") {
      return needsReviewTradeIds.has(trade.id);
    }

    return true;
  });
  const totalTradePages = Math.max(
    1,
    Math.ceil(trades.length / TRADE_LIST_PAGE_SIZE),
  );
  const activeTradePage = normalizeTradeListPage(query?.page, totalTradePages);
  const tradeStartIndex = (activeTradePage - 1) * TRADE_LIST_PAGE_SIZE;
  const tradeEndIndex = Math.min(
    tradeStartIndex + TRADE_LIST_PAGE_SIZE,
    trades.length,
  );
  const paginatedTrades = trades.slice(tradeStartIndex, tradeEndIndex);
  const tradePageHref = (page: number) => {
    const params = new URLSearchParams();

    if (activeBrowseMode !== "session_stories") {
      params.set("view", activeBrowseMode);
    }

    if (activeBrowseMode === "calendar") {
      params.set("month", activeCalendarMonth);
    }

    if (activeSessionStory) {
      params.set("session", activeSessionStory.sessionDate);
    }

    if (activeReviewLane !== "none") {
      params.set("reviewLane", activeReviewLane);
    }

    if (activeStoryFilter !== "all") {
      params.set("storyFilter", activeStoryFilter);
    }

    if (activeThread) {
      params.set("thread", activeThread.id);
    }

    if (page > 1) {
      params.set("page", String(page));
    }

    const queryString = params.toString();
    const basePath =
      activeBrowseMode === "open_swing"
        ? "/intelligence/trades/open-swing"
        : activeBrowseMode === "needs_review"
          ? "/intelligence/trades/review-needed"
          : "/intelligence/trades/round-trips";

    return `${basePath}${queryString ? `?${queryString}` : ""}#trade-list`;
  };
  const triageItem = primaryTriageItem(savedReviewQueue);
  const highestPriorityCount =
    savedReviewQueue?.tabs.find((tab) => tab.id === "highest_priority")?.count ?? 0;
  const marketGapCount =
    savedReviewQueue?.tabs.find((tab) => tab.id === "market_context_unavailable")?.count ?? 0;
  const openBlockCount =
    savedReviewQueue?.tabs.find((tab) => tab.id === "blocked_open_trade")?.count ?? 0;
  const browseModeCopy = activeBrowseModeCopy(activeBrowseMode);
  const pageTitle = activeSessionStory
    ? "Day Session"
    : isLandingPage
      ? "Saved Trades"
      : browseModeCopy.label;
  const pageDescription = isLandingPage
    ? data.mode === "saved"
      ? "Choose one saved-trade view. Start with the calendar or day sessions, then drill into ticker stories and round trips on their own pages."
      : "Sample trades are shown until a broker CSV import is saved."
    : activeSessionStory
      ? `${activeSessionStory.sessionDate}: choose the ticker story to review first.`
    : browseModeCopy.detail;
  const activeTradesSection = activeSessionStory
    ? "session_stories"
    : activeBrowseMode;
  const sideNavItems = [
    {
      active: isLandingPage,
      href: "/intelligence/trades",
      label: "Overview",
      summary: "Home for saved trades and the next review action.",
    },
    ...browseModes.map((mode) => ({
      active: !isLandingPage && activeTradesSection === mode.id,
      href: mode.href,
      label: mode.label,
      summary: `${mode.count.toLocaleString()} ${
        mode.count === 1 ? "item" : "items"
      }. ${mode.body}`,
    })),
  ];

  return (
    <main className="ti-dashboard-bg min-h-screen px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-8">
        <header className="ti-panel p-6">
          <Link className="text-sm text-sky-300 hover:text-sky-200" href="/intelligence">
            Back to Intelligence
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-50">
            {pageTitle}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">
            {pageDescription}
          </p>
        </header>

        <section className="grid min-w-0 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <DashboardSideNav
            eyebrow="Trades Menu"
            items={sideNavItems}
            summary="Move between saved-trade views without returning to the dashboard."
          />
          <div className="grid min-w-0 gap-6">
            {isLandingPage ? (
              <>
            <div id="priority">
        <PrimaryActionPanel
          actionHref={triageItem?.href ?? "/intelligence/upload-csv"}
          actionLabel={triageItem ? "Open Trade Review" : "Import trades"}
          body={
            triageItem
              ? triageItem.stateDetail
              : data.mode === "saved"
                ? "Open a saved trade or use the review queue once more chart work is available."
                : "Upload a broker CSV, save the import, then this page will show the highest-priority trade instead of the sample list."
          }
          eyebrow="Review priority trade"
          secondary={
            <div className="flex flex-wrap gap-2">
              <Link
                className="border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500"
                href="/intelligence/review?queue=highest_priority"
              >
                Open review queue
              </Link>
              {triageItem ? (
                <span className="text-sm text-sky-300">
                  Next: {triageItem.nextAction}
                </span>
              ) : null}
            </div>
          }
          testId="saved-trades-triage-panel"
          title={
            triageItem
              ? `${triageItem.symbol} is the next saved trade to review`
              : data.mode === "saved"
                ? "Saved trades are ready for normal review"
                : "Save one import to unlock your review queue"
          }
          tone="info"
        />
            </div>

            <WorkflowHandoffPanel
              body={
                <>
                  Start with the priority trade when you want coaching
                  direction. Use day sessions first when you want the full
                  picture, then open a ticker story and finally the round trip
                  that needs replay.
                </>
              }
              eyebrow="Saved Trade Workflow"
              items={[
                {
                  action: "Open queue",
                  body: "Use this when the app has already found the next trade to review.",
                  href: "/intelligence/review?queue=highest_priority",
                  label: "1. Prioritize",
                  title: "Review the highest-priority trade",
                  tone: "warning",
                },
                {
                  action: "Open day",
                  body: "Use the day session to see which tickers mattered before opening individual round trips.",
                  href: "/intelligence/trades/day-sessions#session-stories",
                  label: "2. Group",
                  title: "Review the session and ticker stories",
                  tone: "info",
                },
                {
                  action: "Open Intelligence",
                  body: "Use the trade detail page to replay executions, write the note, and save checklist progress.",
                  href: triageItem?.href ?? "#trade-list",
                  label: "3. Review",
                  title: "Finish one trade review at a time",
                  tone: "success",
                },
              ]}
              testId="saved-trades-workflow"
              title="Browse saved trades without losing the review path"
            />

        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            label="All Saved Trades"
            value={allTrades.length}
            detail={data.mode === "saved" ? "Saved import data" : "Sample data until you save an import"}
            tone="default"
          />
          <MetricCard
            label="Review Priority Trade"
            value={highestPriorityCount}
            detail="Trades the queue recommends checking first."
            tone="warning"
          />
          {chartTierEnabled ? (
            <MetricCard
              label="Needs Chart Data"
              value={marketGapCount}
              detail="Execution review is available while chart data is still missing."
              tone="warning"
            />
          ) : null}
          <MetricCard
            label="Open or Swing"
            value={openBlockCount}
            detail="Trades waiting until the position is flat."
            tone="info"
          />
          {chartTierEnabled ? (
            <>
              <MetricCard
                label="Chart Findings"
                value={tradeThreadModel.marketContextFindingCount}
                detail="Certified chart findings and safe review prompts"
                tone={tradeThreadModel.marketContextFindingCount > 0 ? "info" : "default"}
              />
              <MetricCard
                label="Add Quality"
                value={tradeThreadModel.addQualityFindingCount}
                detail={`${tradeThreadModel.addQualityRiskCount} risk, ${tradeThreadModel.addQualityStrengthCount} strength, ${tradeThreadModel.addQualityReviewPromptCount} prompt`}
                tone={
                  tradeThreadModel.addQualityRiskCount > 0
                    ? "warning"
                    : tradeThreadModel.addQualityStrengthCount > 0
                      ? "success"
                      : tradeThreadModel.addQualityFindingCount > 0
                        ? "info"
                        : "default"
                }
              />
            </>
          ) : null}
        </section>

        <section
          id="filters"
          className="ti-panel p-4"
          data-testid="saved-trade-browse-modes"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Browse Saved Trades
              </h2>
              <p className="mt-1 max-w-3xl text-sm text-zinc-500">
                Use round trips for accounting. Use ticker stories when the same symbol appears more than once on the same day and you want to review whether the later attempt helped or hurt the first idea.
              </p>
            </div>
            <div className="text-sm text-zinc-500">
              Showing {trades.length} of {allTrades.length} saved trade
              {allTrades.length === 1 ? "" : "s"}
            </div>
          </div>
          <div className="mt-4 rounded-md border border-sky-800/60 bg-sky-950/20 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-sky-300">
              Current view: {browseModeCopy.label}
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              {browseModeCopy.detail}
            </p>
            <p className="mt-2 text-sm text-sky-300">
              Next: {browseModeCopy.nextAction}
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {browseModes.map((mode) => (
              <Link
                key={mode.id}
                className={`ti-panel-soft p-4 transition hover:border-sky-500 ${
                  activeBrowseMode === mode.id ? "border-sky-500" : ""
                }`}
                href={mode.href}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-semibold text-zinc-100">
                    {mode.label}
                  </div>
                  <div className="font-mono text-sm text-sky-300">
                    {mode.count}
                  </div>
                </div>
                <div className="mt-2 text-xs leading-5 text-zinc-500">
                  {mode.body}
                </div>
              </Link>
            ))}
            </div>
            <div className="mt-4 border-t border-zinc-900 pt-4 text-sm leading-6 text-zinc-400">
            Round trips show each flat-to-flat trade. Ticker stories group same-symbol re-entries so you can review whether later attempts protected profit, gave back profit, stayed open, or turned into swing exposure.
            </div>
          </section>
              </>
            ) : null}

        {showCalendarSection ? (
        <section
          id="calendar"
          className="ti-panel min-w-0 p-4"
          data-testid="saved-trade-month-calendar"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Month Calendar
              </h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-500">
                One month at a time: green days made money, red days lost
                money, and each ticker chip shows whether that symbol helped or
                hurt the session.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="border border-zinc-800 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-300 transition hover:border-sky-500 hover:text-sky-200"
                href={calendarHref(previousCalendarMonth)}
              >
                Previous month
              </Link>
              <Link
                className="border border-zinc-800 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-300 transition hover:border-sky-500 hover:text-sky-200"
                href={calendarHref(nextCalendarMonth)}
              >
                Next month
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                Viewing
              </div>
              <div className="mt-1 text-3xl font-semibold text-zinc-50">
                {monthLabel(activeCalendarMonth)}
              </div>
              {availableCalendarMonths.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {availableCalendarMonths.map((month) => (
                    <Link
                      className={`border px-3 py-2 text-xs uppercase tracking-wide ${
                        month === activeCalendarMonth
                          ? "border-sky-400 text-sky-200"
                          : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                      }`}
                      href={calendarHref(month)}
                      key={month}
                    >
                      {monthLabel(month)}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-2 text-right text-xs text-zinc-500 sm:grid-cols-4 lg:min-w-[520px]">
              <div className="ti-panel-soft px-3 py-2">
                <div className={`text-lg font-semibold ${pnlToneClass(calendarMonthPnl)}`}>
                  {signed(calendarMonthPnl)}
                </div>
                <div>Month P/L</div>
              </div>
              <div className="ti-panel-soft px-3 py-2">
                <div className="text-lg font-semibold text-zinc-100">
                  {calendarMonthStories.length}
                </div>
                <div>Trading days</div>
              </div>
              <div className="ti-panel-soft px-3 py-2">
                <div className="text-lg font-semibold text-emerald-300">
                  {calendarGreenDayCount}
                </div>
                <div>Green days</div>
              </div>
              <div className="ti-panel-soft px-3 py-2">
                <div className="text-lg font-semibold text-rose-300">
                  {calendarRedDayCount}
                </div>
                <div>Red days</div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                Best day
              </div>
              <div className="mt-1 text-sm text-zinc-200">
                {calendarBestDay
                  ? `${calendarBestDay.sessionDate} / ${signed(
                      calendarBestDay.totalGrossRealizedPnl,
                    )}`
                  : "No trading days in this month."}
              </div>
            </div>
            <div className="border border-rose-500/20 bg-rose-500/10 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-rose-300">
                Worst day
              </div>
              <div className="mt-1 text-sm text-zinc-200">
                {calendarWorstDay
                  ? `${calendarWorstDay.sessionDate} / ${signed(
                      calendarWorstDay.totalGrossRealizedPnl,
                    )}`
                  : "No trading days in this month."}
              </div>
            </div>
          </div>

          <div className="mt-5 w-full max-w-full min-w-0 overflow-x-auto pb-2">
            <div className="grid min-w-[980px] max-w-none grid-cols-6 gap-2 xl:w-full">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri"].map(
                (weekday) => (
                  <div
                    className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-500"
                    key={weekday}
                  >
                    {weekday}
                  </div>
                ),
              )}
              {calendarCells.map((cell, index) => {
                if (!cell.dayNumber || !cell.sessionDate) {
                  return (
                    <div
                      className="h-[122px] border border-zinc-950 bg-zinc-950/20"
                      key={`blank-${index}`}
                    />
                  );
                }

                if (!cell.story || !cell.href) {
                  return (
                    <div
                      className="h-[122px] border border-zinc-900 bg-zinc-950/30 p-2.5"
                      data-testid={`calendar-day-${cell.sessionDate}`}
                      key={cell.sessionDate}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-mono text-sm text-zinc-400">
                          {cell.dayNumber}
                        </div>
                        <div className="text-xs text-zinc-600">No trades</div>
                      </div>
                    </div>
                  );
                }

                const tickerSummaries = cell.story.tickerSummaries.slice(0, 4);
                const hiddenTickerCount =
                  cell.story.tickerSummaries.length - tickerSummaries.length;

                return (
                  <Link
                    className={`block h-[122px] overflow-hidden border p-2.5 transition hover:border-sky-400 ${pnlSurfaceClass(
                      cell.story.totalGrossRealizedPnl,
                    )}`}
                    data-testid={`calendar-day-${cell.sessionDate}`}
                    href={cell.href}
                    key={cell.sessionDate}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono text-sm leading-4 text-zinc-100">
                          {cell.dayNumber}
                        </div>
                      </div>
                      <div
                        className={`shrink-0 whitespace-nowrap text-right font-mono text-xs font-semibold leading-4 ${pnlToneClass(
                          cell.story.totalGrossRealizedPnl,
                        )}`}
                      >
                        {signed(cell.story.totalGrossRealizedPnl)}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1 pb-1">
                      {tickerSummaries.map((ticker) => (
                        <span
                          className={`max-w-full whitespace-nowrap border px-1.5 py-0.5 text-[9px] font-semibold uppercase leading-3 tracking-normal ${
                            ticker.totalGrossRealizedPnl >= 0
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                              : "border-rose-500/40 bg-rose-500/10 text-rose-200"
                          }`}
                          data-testid={`calendar-ticker-${cell.sessionDate}-${ticker.symbol}`}
                          key={ticker.id}
                        >
                          {ticker.symbol} {signed(ticker.totalGrossRealizedPnl)}
                        </span>
                      ))}
                      {hiddenTickerCount > 0 ? (
                        <span className="whitespace-nowrap border border-zinc-700 bg-zinc-950/50 px-1.5 py-0.5 text-[9px] uppercase leading-3 tracking-normal text-zinc-400">
                          +{hiddenTickerCount} more
                        </span>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
        ) : null}

        {showTickerStoriesSection ? (
        <section
          id="ticker-stories"
          className="ti-panel p-4"
          data-testid="saved-trade-thread-stories"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Ticker Stories
              </h2>
              <p className="mt-1 max-w-3xl text-sm text-zinc-500">
                A round trip still ends when the position returns to flat. This section groups same-symbol, same-day round trips into one trading story so re-entries are easier to review.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-right text-xs text-zinc-500 lg:grid-cols-4 xl:grid-cols-9">
              <div className="ti-panel-soft px-3 py-2">
                <div className="text-lg font-semibold text-zinc-100">
                  {tradeThreadModel.threadCount}
                </div>
                <div>Ticker stories</div>
              </div>
              <div className="ti-panel-soft px-3 py-2">
                <div className="text-lg font-semibold text-zinc-100">
                  {tradeThreadModel.multiRoundTripThreadCount}
                </div>
                <div>Re-entry stories</div>
              </div>
              {chartTierEnabled ? (
                <>
                  <div className="ti-panel-soft px-3 py-2">
                    <div className="text-lg font-semibold text-sky-300">
                      {tradeThreadModel.marketContextFindingCount}
                    </div>
                    <div>Chart findings</div>
                  </div>
                  <div className="ti-panel-soft px-3 py-2">
                    <div className="text-lg font-semibold text-emerald-300">
                      {tradeThreadModel.marketContextStrengthCount}
                    </div>
                    <div>Chart strengths</div>
                  </div>
                  <div className="ti-panel-soft px-3 py-2">
                    <div
                      className={`text-lg font-semibold ${
                        tradeThreadModel.addQualityRiskCount > 0
                          ? "text-amber-300"
                          : tradeThreadModel.addQualityStrengthCount > 0
                            ? "text-emerald-300"
                            : "text-zinc-100"
                      }`}
                    >
                      {tradeThreadModel.addQualityFindingCount}
                    </div>
                    <div>Add quality</div>
                  </div>
                  <div className="ti-panel-soft px-3 py-2">
                    <div
                      className={`text-lg font-semibold ${
                        tradeThreadModel.postExitRiskCount > 0
                          ? "text-amber-300"
                          : tradeThreadModel.postExitStrengthCount > 0
                            ? "text-emerald-300"
                            : "text-sky-300"
                      }`}
                    >
                      {tradeThreadModel.postExitFindingCount}
                    </div>
                    <div>After exit</div>
                  </div>
                  <div className="ti-panel-soft px-3 py-2">
                    <div
                      className={`text-lg font-semibold ${
                        tradeThreadModel.protectedProfitBeforeFadeFindingCount > 0
                          ? "text-emerald-300"
                          : "text-zinc-100"
                      }`}
                    >
                      {tradeThreadModel.protectedProfitBeforeFadeFindingCount}
                    </div>
                    <div>Protected before fade</div>
                  </div>
                  <div className="ti-panel-soft px-3 py-2">
                    <div
                      className={`text-lg font-semibold ${
                        tradeThreadModel.exitLevelRiskCount > 0
                          ? "text-amber-300"
                          : tradeThreadModel.exitLevelStrengthCount > 0
                            ? "text-emerald-300"
                            : "text-sky-300"
                      }`}
                    >
                      {tradeThreadModel.exitLevelFindingCount}
                    </div>
                    <div>Support/resistance exits</div>
                  </div>
                  <div className="ti-panel-soft px-3 py-2">
                    <div
                      className={`text-lg font-semibold ${
                        tradeThreadModel.volumeRiskCount > 0
                          ? "text-amber-300"
                          : tradeThreadModel.volumeStrengthCount > 0
                            ? "text-emerald-300"
                            : "text-sky-300"
                      }`}
                    >
                      {tradeThreadModel.volumeFindingCount}
                    </div>
                    <div>Volume evidence</div>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {highlightedThreads.length === 0 ? (
            <div className="mt-4 border-t border-zinc-900 pt-4 text-sm text-zinc-500">
              No same-day re-entry stories yet. When a ticker has more than one flat-to-flat round trip on the same date, it will appear here.
            </div>
          ) : (
            <>
            <div className="mt-4 flex flex-wrap gap-2">
              {visibleStoryFilters.map((filter) => (
                <Link
                  key={filter.id}
                  className={`border px-3 py-2 text-xs uppercase tracking-wide ${
                    activeStoryFilter === filter.id
                      ? "border-sky-400 text-sky-200"
                      : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                  }`}
                  href={
                    filter.id === "all"
                      ? "/intelligence/trades/ticker-stories#ticker-stories"
                      : `/intelligence/trades/ticker-stories?storyFilter=${filter.id}#ticker-stories`
                  }
                >
                  {filter.label} {filter.count}
                </Link>
              ))}
            </div>
            <div className="mt-4 grid gap-3 xl:grid-cols-2">
              {highlightedThreads.map((thread) => (
                <article
                  key={thread.id}
                  className="ti-panel-soft p-4"
                  data-testid={`trade-thread-${thread.symbol}-${thread.sessionDate}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-zinc-500">
                        {thread.sessionDate}
                      </div>
                      <h3 className="mt-1 text-lg font-semibold text-zinc-50">
                        {thread.symbol} story
                      </h3>
                    </div>
                    <div
                      className={`text-lg font-semibold ${
                        thread.totalGrossRealizedPnl >= 0
                          ? "text-emerald-300"
                          : "text-rose-300"
                      }`}
                    >
                      {signed(thread.totalGrossRealizedPnl)}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <div className="inline-flex border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-sky-200">
                      {thread.storyLabel}
                    </div>
                    <div
                      className={`inline-flex border px-3 py-1 text-xs font-medium uppercase tracking-wide ${lifecycleToneClass(
                        thread.lifecycleClassification,
                      )}`}
                    >
                      {thread.lifecycleLabel}
                    </div>
                    {chartTierEnabled && thread.marketContextFindingCount > 0 ? (
                      <div className="inline-flex border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-sky-200">
                        {thread.marketContextFindingCount} chart finding
                        {thread.marketContextFindingCount === 1 ? "" : "s"}
                      </div>
                    ) : null}
                    {chartTierEnabled && thread.addQualityFindingCount > 0 ? (
                      <div
                        className={`inline-flex border px-3 py-1 text-xs font-medium uppercase tracking-wide ${
                          thread.addQualityRiskCount > 0
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                            : thread.addQualityStrengthCount > 0
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                              : "border-sky-500/40 bg-sky-500/10 text-sky-200"
                        }`}
                      >
                        {thread.addQualityFindingCount} add-quality review
                        {thread.addQualityFindingCount === 1 ? "" : "s"}
                      </div>
                    ) : null}
                    {chartTierEnabled && thread.postExitFindingCount > 0 ? (
                      <div
                        className={`inline-flex border px-3 py-1 text-xs font-medium uppercase tracking-wide ${
                          thread.postExitRiskCount > 0
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                            : thread.postExitStrengthCount > 0
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                              : "border-sky-500/40 bg-sky-500/10 text-sky-200"
                        }`}
                      >
                        {thread.postExitFindingCount} after-exit review
                        {thread.postExitFindingCount === 1 ? "" : "s"}
                      </div>
                    ) : null}
                    {chartTierEnabled &&
                    thread.protectedProfitBeforeFadeFindingCount > 0 ? (
                      <div className="inline-flex border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-200">
                        {thread.protectedProfitBeforeFadeFindingCount} protected before fade
                      </div>
                    ) : null}
                    {chartTierEnabled && thread.exitLevelFindingCount > 0 ? (
                      <div
                        className={`inline-flex border px-3 py-1 text-xs font-medium uppercase tracking-wide ${
                          thread.exitLevelRiskCount > 0
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                            : thread.exitLevelStrengthCount > 0
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                              : "border-sky-500/40 bg-sky-500/10 text-sky-200"
                        }`}
                      >
                        {thread.exitLevelFindingCount} support/resistance exit review
                        {thread.exitLevelFindingCount === 1 ? "" : "s"}
                      </div>
                    ) : null}
                    {chartTierEnabled && thread.volumeFindingCount > 0 ? (
                      <div
                        className={`inline-flex border px-3 py-1 text-xs font-medium uppercase tracking-wide ${
                          thread.volumeRiskCount > 0
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                            : thread.volumeStrengthCount > 0
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                              : "border-zinc-700 bg-zinc-900/40 text-zinc-300"
                        }`}
                      >
                        {thread.volumeFindingCount} volume review
                        {thread.volumeFindingCount === 1 ? "" : "s"}
                      </div>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm text-zinc-300">
                    {thread.storyDetail}
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    {thread.lifecycleDetail}
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    {thread.reviewPrompt}
                  </p>
                  <div className="mt-4 border-t border-zinc-900 pt-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Review Question
                    </div>
                    <div className="mt-1 text-sm text-zinc-200">
                      {thread.primaryReviewQuestion}
                    </div>
                    <div className="mt-2 text-sm text-sky-300">
                      Fix first: {thread.fixFirstAction}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    {visibleStoryEvidence(thread.reviewEvidence, chartTierEnabled)
                      .slice(0, 4)
                      .map((item) => (
                      <div
                        key={item.id}
                        className={`border px-3 py-2 ${
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
                        <div className="mt-1 text-xs text-zinc-500">
                          {item.detail}
                        </div>
                        <div className="mt-2 text-[11px] uppercase tracking-wide text-zinc-600">
                          {item.evidenceSource}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      className="inline-flex border border-sky-800 bg-sky-950/30 px-4 py-2 text-sm font-medium text-sky-100 transition hover:border-sky-400"
                      href={thread.href}
                    >
                      Open ticker story
                    </Link>
                    <Link
                      className="inline-flex px-1 py-2 text-sm text-sky-300 hover:text-sky-200"
                      href={daySessionHrefFor(thread.sessionDate)}
                    >
                      Back to day session
                    </Link>
                  </div>
                  <div className="mt-4 grid gap-2">
                    {thread.roundTrips.map((roundTrip) => (
                      <Link
                        key={roundTrip.id}
                        className="grid gap-2 border border-zinc-900 px-3 py-2 text-sm transition hover:border-sky-500 hover:text-sky-200 sm:grid-cols-[92px_minmax(0,1fr)_90px]"
                        href={roundTrip.href}
                      >
                        <span className="text-zinc-500">
                          Round Trip {roundTrip.sequence}
                        </span>
                        <span className="text-zinc-300">
                          {roundTrip.roleLabel} / {roundTrip.entryHourLabelEt} / {roundTrip.executionCount} execution
                          {roundTrip.executionCount === 1 ? "" : "s"} / {timeLabelEt(roundTrip.entryTime)} ET
                          {roundTrip.crossedSessionDate
                            ? " / next-session exposure"
                            : roundTrip.heldOvernight
                              ? " / extended hold"
                              : ""}
                        </span>
                        <span className="text-xs text-zinc-500 sm:col-span-2">
                          {roundTripEvidenceSummary(
                            roundTrip,
                            chartTierEnabled,
                          )}
                        </span>
                        <span
                          className={`font-medium sm:text-right ${
                            (roundTrip.grossRealizedPnl ?? 0) >= 0
                              ? "text-emerald-300"
                              : "text-rose-300"
                          }`}
                        >
                          {signed(roundTrip.grossRealizedPnl)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </article>
              ))}
            </div>
            </>
          )}
        </section>
        ) : null}

        {showSessionStoriesSection ? (
        <section
          id="session-stories"
          className="ti-panel p-4"
          data-testid="saved-trade-session-stories"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Day Sessions
              </h2>
              <p className="mt-1 max-w-3xl text-sm text-zinc-500">
                Start with the trading day. Open a day session to see which
                tickers mattered, then drill into the ticker story and round
                trip that need review.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-right text-xs text-zinc-500 lg:grid-cols-3">
              <div className="ti-panel-soft px-3 py-2">
                <div className="text-lg font-semibold text-zinc-100">
                  {tradeThreadModel.sessionStoryCount}
                </div>
                <div>Day sessions</div>
              </div>
              <div className="ti-panel-soft px-3 py-2">
                <div className="text-lg font-semibold text-zinc-100">
                  {tradeThreadModel.greenToRedSessionCount}
                </div>
                <div>Green to red</div>
              </div>
              <div className="ti-panel-soft px-3 py-2">
                <div className="text-lg font-semibold text-emerald-300">
                  {tradeThreadModel.strengthsToRepeatSessionCount}
                </div>
                <div>Strength sessions</div>
              </div>
            </div>
          </div>

          {activeSessionStory ? null : tradeThreadModel.sessionStories.length === 0 ? (
            <div className="mt-4 border-t border-zinc-900 pt-4 text-sm text-zinc-500">
              No day sessions yet. Save an import to group trades by trading day.
            </div>
          ) : (
            <div className="mt-4 grid gap-3 xl:grid-cols-2">
              {tradeThreadModel.sessionStories.slice(0, 6).map((story) => (
                <article
                  className="ti-panel-soft p-4"
                  data-testid={`day-session-card-${story.sessionDate}`}
                  key={story.id}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-zinc-500">
                        Day Session / {story.sessionDate}
                      </div>
                      <h3 className="mt-1 text-lg font-semibold text-zinc-50">
                        {story.storyLabel}
                      </h3>
                      <div className="mt-2 text-xs text-zinc-500">
                        Priority ticker:{" "}
                        <span className="text-zinc-300">
                          {story.priorityThread?.symbol ?? "n/a"}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`text-lg font-semibold ${
                        story.totalGrossRealizedPnl >= 0
                          ? "text-emerald-300"
                          : "text-rose-300"
                      }`}
                    >
                      {signed(story.totalGrossRealizedPnl)}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    {story.storyDetail}
                  </p>
                  <div className="mt-3 grid gap-2 md:grid-cols-4">
                    <div className="border border-zinc-900 bg-zinc-950/40 px-3 py-2">
                      <div className="text-xs uppercase tracking-wide text-zinc-500">
                        Round trips
                      </div>
                      <div className="mt-1 text-sm font-semibold text-zinc-100">
                        {story.tradeCount}
                      </div>
                    </div>
                    <div className="border border-zinc-900 bg-zinc-950/40 px-3 py-2">
                      <div className="text-xs uppercase tracking-wide text-zinc-500">
                        Symbols
                      </div>
                      <div className="mt-1 text-sm font-semibold text-zinc-100">
                        {story.symbolCount}
                      </div>
                    </div>
                    <div className="border border-zinc-900 bg-zinc-950/40 px-3 py-2">
                      <div className="text-xs uppercase tracking-wide text-zinc-500">
                        Peak to finish
                      </div>
                      <div className="mt-1 text-sm font-semibold text-zinc-100">
                        {signed(story.peakCumulativePnl)} to{" "}
                        {signed(story.totalGrossRealizedPnl)}
                      </div>
                    </div>
                    <div className="border border-zinc-900 bg-zinc-950/40 px-3 py-2">
                      <div className="text-xs uppercase tracking-wide text-zinc-500">
                        Strengths
                      </div>
                      <div className="mt-1 text-sm font-semibold text-emerald-300">
                        {story.marketContextStrengthCount}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-zinc-900 pt-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Review prompt
                    </div>
                    <div className="mt-1 text-sm leading-6 text-zinc-200">
                      {story.reviewPrompt}
                    </div>
                    <div className="mt-2 text-sm text-sky-300">
                      Fix first: {story.fixFirstAction}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    {visibleStoryEvidence(story.reviewEvidence, chartTierEnabled)
                      .slice(0, 2)
                      .map((item) => (
                      <div
                        key={item.id}
                        className="border border-zinc-900 bg-zinc-950/40 px-3 py-2"
                      >
                        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                          {item.title}
                        </div>
                        <div className="mt-1 text-xs leading-5 text-zinc-500">
                          {item.detail}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      className="inline-flex border border-sky-800 bg-sky-950/30 px-4 py-2 text-sm font-medium text-sky-100 transition hover:border-sky-400"
                      href={story.daySessionHref}
                    >
                      Open day session
                    </Link>
                    <Link
                      className="inline-flex px-1 py-2 text-sm text-sky-300 hover:text-sky-200"
                      href={story.href}
                    >
                      Open main ticker story
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {activeSessionStory ? (
            <section
              id="day-session"
              className="mt-5 border-t border-zinc-900 pt-5"
              data-testid="saved-trade-day-session-detail"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Open Day Session
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-zinc-50">
                    {activeSessionStory.sessionDate}: choose the ticker story
                    to review first
                  </h3>
                  <p className="mt-2 max-w-4xl text-sm leading-6 text-zinc-500">
                    These are the tickers traded during this day. Each ticker
                    story contains its own round trips, so repeated CYCN-style
                    activity stays grouped instead of looking like unrelated
                    trades.
                  </p>
                </div>
                <Link
                  className="text-sm text-sky-300 hover:text-sky-200"
                  href="/intelligence/trades/day-sessions#session-stories"
                >
                  Back to all day sessions
                </Link>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {activeSessionStory.tickerSummaries.map((ticker) => (
                  <Link
                    className="ti-panel-soft block p-4 transition hover:border-sky-500 hover:text-sky-200"
                    data-testid={`day-session-ticker-${ticker.symbol}`}
                    href={ticker.href}
                    key={ticker.id}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-zinc-500">
                          Ticker Story
                        </div>
                        <h4 className="mt-1 text-base font-semibold text-zinc-50">
                          {ticker.symbol}
                        </h4>
                      </div>
                      <div
                        className={`font-mono text-sm font-semibold ${
                          ticker.totalGrossRealizedPnl >= 0
                            ? "text-emerald-300"
                            : "text-rose-300"
                        }`}
                      >
                        {signed(ticker.totalGrossRealizedPnl)}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="border border-sky-500/40 bg-sky-500/10 px-2 py-1 text-xs uppercase tracking-wide text-sky-200">
                        {ticker.roundTripCount} round trip
                        {ticker.roundTripCount === 1 ? "" : "s"}
                      </span>
                      <span
                        className={`border px-2 py-1 text-xs uppercase tracking-wide ${lifecycleToneClass(
                          ticker.lifecycleClassification,
                        )}`}
                      >
                        {ticker.lifecycleLabel}
                      </span>
                      {ticker.openRoundTripCount > 0 ? (
                        <span className="border border-sky-500/40 bg-sky-500/10 px-2 py-1 text-xs uppercase tracking-wide text-sky-200">
                          Still open
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-zinc-300">
                      {ticker.storyLabel}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      {ticker.reviewPriorityLabel}
                    </p>
                    <div className="mt-3 text-sm text-sky-300">
                      Open ticker story
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </section>
        ) : null}

        {savedReviewQueue && showReviewLanes ? (
          <section
            id="review-lanes"
            className="ti-panel p-4"
            data-testid="trades-review-lane-filters"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">
                  Find Saved Trades
                </h2>
                <div className="mt-1 text-sm text-zinc-500">
                  {chartTierEnabled
                    ? "Use these filters when you want all saved trades, trades missing chart data, or open trades."
                    : "Use these filters when you want all saved trades, execution reviews, or open trades."}
                </div>
              </div>
              <Link
                className="text-sm text-sky-300 hover:text-sky-200"
                href="/intelligence/review?queue=highest_priority"
              >
                Open review queue
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                className={`border px-3 py-2 text-xs uppercase tracking-wide ${
                  activeReviewLane === "none"
                    ? "border-sky-400 text-sky-200"
                    : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                }`}
                href="/intelligence/trades/round-trips#trade-list"
              >
                All saved trades {allTrades.length}
              </Link>
              {savedReviewQueue.tabs.map((tab) => (
                <Link
                  key={tab.id}
                  className={`border px-3 py-2 text-xs uppercase tracking-wide ${
                    activeReviewLane === tab.id
                      ? "border-sky-400 text-sky-200"
                      : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                  }`}
                  data-testid={`trades-review-lane-${tab.id}`}
                  href={`/intelligence/trades/review-needed?reviewLane=${tab.id}#trade-list`}
                >
                  {tab.label} {tab.count}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {showTradeList ? (
        <section id="trade-list" className="ti-panel p-4">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Round Trip Cards
              </h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-500">
                Each card is one flat-to-flat round trip. Use these after the
                day session or ticker story tells you which sequence is worth
                replaying.
              </p>
            </div>
            <Link
              className="text-sm text-sky-300 hover:text-sky-200"
              href="/intelligence/coach"
            >
              Open coach focus
            </Link>
          </div>
          <div className="mb-4 rounded-md border border-sky-900/60 bg-sky-950/20 p-4 text-sm leading-6 text-zinc-400">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                {trades.length === 0 ? (
                  "No cards are showing in this view."
                ) : (
                  <>
                    Showing round trips {tradeStartIndex + 1}-{tradeEndIndex}{" "}
                    of {trades.length} in this view. Keep one page small, then
                    use the next page or a story filter when you need more.
                  </>
                )}
              </div>
              {totalTradePages > 1 ? (
                <div
                  className="flex flex-wrap items-center gap-2"
                  data-testid="saved-trade-pagination"
                >
                  {activeTradePage > 1 ? (
                    <Link
                      className="rounded-md border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-sky-400 hover:text-sky-200"
                      href={tradePageHref(activeTradePage - 1)}
                    >
                      Previous
                    </Link>
                  ) : (
                    <span className="rounded-md border border-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-600">
                      Previous
                    </span>
                  )}
                  <span className="px-2 text-xs uppercase tracking-wide text-zinc-500">
                    Page {activeTradePage} of {totalTradePages}
                  </span>
                  {activeTradePage < totalTradePages ? (
                    <Link
                      className="rounded-md border border-sky-800 bg-sky-950/40 px-3 py-2 text-xs font-semibold text-sky-100 transition hover:border-sky-400"
                      href={tradePageHref(activeTradePage + 1)}
                    >
                      Next
                    </Link>
                  ) : (
                    <span className="rounded-md border border-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-600">
                      Next
                    </span>
                  )}
                </div>
              ) : null}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {trades.length === 0 ? (
              <div className="border-t border-zinc-900 py-4 text-sm text-zinc-500 md:col-span-2 xl:col-span-3">
                No saved trades match this view. Try all saved trades or the
                highest-priority review queue.
              </div>
            ) : paginatedTrades.map((trade) => {
              const reportTradeIndex = latestReport.sourceTradeIds.indexOf(trade.id) + 1;
              const reportRow =
                reportRowsByTradeId.get(trade.id) ??
                latestReport.report.trades.find(
                  (row) =>
                    row.symbol === trade.symbol &&
                    row.sessionDate === trade.sessionDate &&
                    row.entryTimeEt === trade.request.sessionContext?.entryTimeEt,
                );
              const directionLabel = userFacingTradeDirection(trade.tradeDirection);
              const executionCount = trade.request.executions.length;
              const firstExecution = trade.request.executions[0] ?? null;
              const lastExecution =
                trade.request.executions[trade.request.executions.length - 1] ?? null;
              const queueItem = queueByTradeId.get(trade.id);
              const reviewReason = tradeReviewReason({
                isOpenOrSwing: openOrSwingTradeIds.has(trade.id),
                isSessionStoryTrade: sessionStoryTradeIds.has(trade.id),
                isTickerStoryTrade: multiRoundTripTradeIds.has(trade.id),
                queueItem,
                row: reportRow,
              });

              return (
                <article
                  key={trade.id}
                  className="ti-panel-soft p-4 transition hover:border-sky-500"
                  data-testid={`saved-trade-card-${trade.id}`}
                >
                  <Link
                    className="block hover:text-sky-200"
                    data-testid={`saved-trade-link-${trade.id}`}
                    href={`/intelligence/trades/${encodeURIComponent(trade.id)}#summary`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-zinc-100">
                          {trade.symbol} / {directionLabel}
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">
                          {trade.sessionDate} / {trade.entryHourLabelEt ?? trade.sessionBucket}
                        </div>
                      </div>
                      <div
                        className={`text-sm font-medium ${
                          (reportRow?.grossRealizedPnl ?? 0) >= 0
                            ? "text-emerald-300"
                            : "text-rose-300"
                        }`}
                      >
                        {signed(reportRow?.grossRealizedPnl)}
                      </div>
                    </div>
                    <div className="mt-4 rounded-md border border-sky-900/50 bg-sky-950/20 p-3 text-sm text-zinc-300">
                      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Why review this
                      </div>
                      <div
                        className={`mt-2 leading-6 ${
                          reviewReason.tone === "danger"
                            ? "text-rose-300"
                            : reviewReason.tone === "success"
                              ? "text-emerald-300"
                              : reviewReason.tone === "warning"
                                ? "text-amber-300"
                                : reviewReason.tone === "info"
                                  ? "text-sky-300"
                                  : "text-zinc-300"
                        }`}
                      >
                        {reviewReason.label}
                      </div>
                      <div className="mt-1 text-xs leading-5 text-zinc-500">
                        {reviewReason.action}
                      </div>
                      {queueItem ? (
                        <div className="mt-1 text-xs text-amber-300">
                          {queueItem.priorityLabel}
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-3 grid gap-1 border-t border-zinc-900 pt-3 text-xs text-zinc-500">
                      <div>
                        Round trip {reportTradeIndex > 0 ? reportTradeIndex : "open"}: {executionCount} execution
                        {executionCount === 1 ? "" : "s"} from{" "}
                        {firstExecution
                          ? new Date(String(firstExecution.timestamp)).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              timeZone: "America/New_York",
                            })
                          : "time n/a"}{" "}
                        ET
                        {lastExecution && reportRow?.closedToFlat
                          ? ` to ${new Date(String(lastExecution.timestamp)).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              timeZone: "America/New_York",
                            })} ET`
                          : " and still open"}
                      </div>
                      {trade.tradeDirection === "short" ? (
                        <div className="text-amber-300">
                          {sellStartingReviewLimitationCopy()}
                        </div>
                      ) : null}
                      <div className="text-sky-300">Open review hub</div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs uppercase tracking-wide">
                      <PlainStateBadge
                        state={trade.sampleData ? "sample_fallback" : "saved_sqlite"}
                        tone={trade.sampleData ? "warning" : "success"}
                      />
                      {queueItem ? (
                        <span
                          className={`border border-zinc-800 px-2 py-1 ${laneToneClass(
                            queueItem.lane,
                          )}`}
                        >
                          {queueItem.reviewScopeLabel}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                  {activeBrowseMode === "open_swing" &&
                  queueItem?.lane === "blocked_open_trade" ? (
                    <OpenSwingMarkClosedButton tradeId={trade.id} />
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
        ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
