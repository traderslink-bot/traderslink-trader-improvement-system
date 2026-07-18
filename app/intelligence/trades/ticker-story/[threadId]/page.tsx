import { requireTraderIntelligenceOwnerPageAccess } from "@/src/lib/trader-intelligence-v3/auth";

import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  DashboardSideNav,
  MetricCard,
  PlainStateBadge,
  PrimaryActionPanel,
} from "@/app/app-ui";
import { buildSavedOrSampleTraderAnalyticsViewModel } from "@/src/lib/trader-analytics/server/saved-trader-analytics-data";
import { buildSavedTradeThreadReadModel } from "@/src/lib/trader-analytics/server/saved-trade-threads";
import { filterCustomerSavedTrades } from "@/src/lib/trader-analytics/product/customer-data-filter";
import { userFacingTradeSymbol } from "@/src/lib/trader-analytics/product/trade-display-copy";
import {
  canUseChartContext,
  readTraderIntelligenceTierFromEnv,
} from "@/src/lib/trader-analytics/product/tier-config";

export const dynamic = "force-dynamic";

type TickerStoryPageProps = {
  params: Promise<{
    threadId: string;
  }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

type SavedTradeThreadModel = ReturnType<typeof buildSavedTradeThreadReadModel>;
type SavedTradeThread = SavedTradeThreadModel["threads"][number];
type SavedTradeThreadRoundTrip = SavedTradeThread["roundTrips"][number];

function signed(value: number | null | undefined): string {
  if (typeof value !== "number") {
    return "n/a";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function decodeThreadId(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function searchParamString(
  value: string | string[] | undefined,
): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
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

function dateTimeLabelEt(value: string | null): string {
  if (!value) {
    return "time n/a";
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return "time n/a";
  }

  return new Date(parsed).toLocaleString("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: "America/New_York",
  });
}

function timeRangeEt(thread: SavedTradeThread): string {
  if (!thread.firstEntryTime) {
    return "Time n/a";
  }

  if (!thread.lastExitTime) {
    return `Opened ${timeLabelEt(thread.firstEntryTime)} ET`;
  }

  return `${timeLabelEt(thread.firstEntryTime)}-${timeLabelEt(
    thread.lastExitTime,
  )} ET`;
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

function holdDurationLabel(roundTrip: SavedTradeThreadRoundTrip): string {
  if (!roundTrip.entryTime || !roundTrip.exitTime) {
    return "Still open in this import";
  }

  const entry = Date.parse(roundTrip.entryTime);
  const exit = Date.parse(roundTrip.exitTime);

  if (Number.isNaN(entry) || Number.isNaN(exit) || exit < entry) {
    return "Duration n/a";
  }

  const totalMinutes = Math.round((exit - entry) / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function evidenceToneClass(tone: string): string {
  if (tone === "danger") {
    return "border-rose-500/30 bg-rose-500/10";
  }

  if (tone === "warning") {
    return "border-amber-500/30 bg-amber-500/10";
  }

  if (tone === "success") {
    return "border-emerald-500/30 bg-emerald-500/10";
  }

  return "border-zinc-800 bg-zinc-950/30";
}

function pnlToneClass(value: number | null | undefined): string {
  return (value ?? 0) >= 0 ? "text-emerald-300" : "text-rose-300";
}

function roundTripLifecycleLabel(roundTrip: SavedTradeThreadRoundTrip): string {
  if (roundTrip.lifecycleStatus === "open") {
    return "Still open";
  }

  if (roundTrip.crossedSessionDate) {
    return "Carried into next session";
  }

  if (roundTrip.heldOvernight) {
    return "Extended hold";
  }

  return "Closed round trip";
}

function roundTripTiming(roundTrip: SavedTradeThreadRoundTrip): string {
  const shouldShowDates =
    roundTrip.lifecycleStatus === "open" ||
    roundTrip.heldOvernight ||
    roundTrip.crossedSessionDate;
  const entry = shouldShowDates
    ? dateTimeLabelEt(roundTrip.entryTime)
    : timeLabelEt(roundTrip.entryTime);
  const exit =
    roundTrip.lifecycleStatus === "open"
      ? "still open"
      : shouldShowDates
        ? dateTimeLabelEt(roundTrip.exitTime)
        : timeLabelEt(roundTrip.exitTime);

  return `${entry} -> ${exit} ET`;
}

function roundTripEvidenceSummary(
  roundTrip: SavedTradeThreadRoundTrip,
  chartContextAllowed: boolean,
): string {
  if (!chartContextAllowed) {
    return "Execution replay only";
  }

  return roundTrip.chartContextSummary;
}

function visibleReviewEvidence(
  thread: SavedTradeThread,
  chartContextAllowed: boolean,
): SavedTradeThread["reviewEvidence"] {
  if (chartContextAllowed) {
    return thread.reviewEvidence;
  }

  const chartContextEvidenceIds = new Set([
    "chart-context-available",
    "market-context-insights-available",
    "post-exit-context-finding",
    "volume-context-reviewed",
    "volume-context-to-compare",
    "chart-context-to-check",
  ]);

  return thread.reviewEvidence.filter(
    (item) => !chartContextEvidenceIds.has(item.id),
  );
}

function buildTickerStoryModel(): SavedTradeThreadModel {
  const data = buildSavedOrSampleTraderAnalyticsViewModel();
  const chartContextAllowed = canUseChartContext(
    readTraderIntelligenceTierFromEnv(),
  );
  const allTrades = filterCustomerSavedTrades(
    data.repository.listTrades(data.userId),
  );
  const decisionReviewSnapshots =
    data.mode === "saved" && chartContextAllowed
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

  return buildSavedTradeThreadReadModel({
    decisionReviewSnapshots,
    report: data.viewModel.latestReport,
    source: data.mode === "saved" ? "saved_sqlite" : "sample",
    trades: allTrades,
  });
}

export async function generateMetadata({
  params,
}: TickerStoryPageProps): Promise<Metadata> {
  await requireTraderIntelligenceOwnerPageAccess(
    "app/intelligence/trades/ticker-story/[threadId]/page.tsx",
  );
  const { threadId } = await params;
  const decodedThreadId = decodeThreadId(threadId);
  const model = buildTickerStoryModel();
  const thread = model.threads.find(
    (candidate) => candidate.id === decodedThreadId,
  );
  const symbol = userFacingTradeSymbol(thread?.symbol, "Ticker story");

  return {
    title: `${symbol} Ticker Story | Trader Intelligence`,
  };
}

export default async function TickerStoryPage({
  params,
  searchParams,
}: TickerStoryPageProps) {
  await requireTraderIntelligenceOwnerPageAccess("app/intelligence/trades/ticker-story/[threadId]/page.tsx");
  const { threadId } = await params;
  const query = searchParams ? await searchParams : {};
  const decodedThreadId = decodeThreadId(threadId);
  const chartContextAllowed = canUseChartContext(
    readTraderIntelligenceTierFromEnv(),
  );
  const model = buildTickerStoryModel();
  const thread =
    model.threads.find((candidate) => candidate.id === decodedThreadId) ?? null;

  if (!thread) {
    notFound();
  }

  const sessionStory =
    model.sessionStories.find(
      (candidate) => candidate.sessionDate === thread.sessionDate,
    ) ?? null;
  const symbol = userFacingTradeSymbol(thread.symbol, "Ticker story");
  const daySessionHref = `/intelligence/trades/day-session/${encodeURIComponent(
    thread.sessionDate,
  )}`;
  const firstRoundTrip = thread.roundTrips[0] ?? null;
  const priorityRoundTrip =
    thread.worstRoundTrip ?? thread.bestRoundTrip ?? firstRoundTrip;
  const priorityRoundTripLabel =
    priorityRoundTrip && thread.worstRoundTrip?.id === priorityRoundTrip.id
      ? "weakest round trip"
      : "priority round trip";
  const source = searchParamString(query.from);
  const focusLabel = searchParamString(query.focus);
  const openedFromCoach = source === "coach";
  const continuationRoundTrips = thread.roundTrips.filter(
    (roundTrip) =>
      roundTrip.lifecycleStatus === "open" ||
      roundTrip.heldOvernight ||
      roundTrip.crossedSessionDate,
  );
  const hasHoldContinuation = continuationRoundTrips.length > 0;
  const reviewEvidence = visibleReviewEvidence(thread, chartContextAllowed);

  return (
    <main className="min-h-screen bg-[#05070b] px-4 py-6 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <header className="ti-hero-surface p-5" data-testid="ticker-story-detail-page">
          <nav
            aria-label="Ticker story breadcrumb"
            className="flex flex-wrap items-center gap-2 text-sm text-zinc-500"
          >
            <Link className="text-sky-300 hover:text-sky-200" href="/intelligence/trades">
              Saved Trades
            </Link>
            <span>/</span>
            <Link
              className="text-sky-300 hover:text-sky-200"
              href={daySessionHref}
            >
              Day Session {thread.sessionDate}
            </Link>
            <span>/</span>
            <span className="text-zinc-300">{symbol} Ticker Story</span>
          </nav>
          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                Ticker Story
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal text-zinc-50 sm:text-4xl">
                {symbol} on {thread.sessionDate}
              </h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-zinc-400">
                This page shows only the {symbol} round trips from this trading
                day. Use it to compare the first push, re-entries,{" "}
                {chartContextAllowed
                  ? "saved chart evidence,"
                  : "saved executions,"}{" "}
                and the exact round trip that needs a deeper replay.
              </p>
            </div>
            <div className="grid gap-2 text-sm lg:min-w-[220px]">
              <Link
                className="inline-flex justify-center border border-sky-800 bg-sky-950/30 px-4 py-3 font-medium text-sky-100 transition hover:border-sky-400"
                href={daySessionHref}
              >
                Back to day session
              </Link>
              <Link
                className="inline-flex justify-center border border-zinc-800 px-4 py-3 font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
                href="/intelligence/trades/day-sessions#session-stories"
              >
                All day sessions
              </Link>
            </div>
          </div>
        </header>

        <section className="grid min-w-0 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <DashboardSideNav
            eyebrow="Ticker Story Menu"
            items={[
              {
                href: "#story-summary",
                label: "Summary",
                summary: "What this ticker story is asking you to review.",
              },
              {
                href: "#round-trips",
                label: "Round Trips",
                summary: "Only this ticker's flat-to-flat sequences.",
              },
              ...(hasHoldContinuation
                ? [
                    {
                      href: "#hold-continuation",
                      label: "Continuation",
                      summary: "How the day trade continued beyond the quick idea.",
                    },
                  ]
                : []),
              {
                href: "#story-evidence",
                label: "Evidence",
                summary: chartContextAllowed
                  ? "Saved chart evidence and supporting prompts."
                  : "Saved executions and review prompts.",
              },
            ]}
            summary="Use this page to drill from a trading day into one ticker."
          />

          <div className="grid min-w-0 gap-6">
            <div id="story-summary">
              <PrimaryActionPanel
                actionHref={priorityRoundTrip?.href ?? "#round-trips"}
                actionLabel={
                  priorityRoundTrip ? "Open priority round trip" : "Review round trips"
                }
                body={
                  <>
                    {thread.primaryReviewQuestion} {thread.fixFirstAction}
                  </>
                }
                eyebrow="Do This Next"
                testId="ticker-story-primary-action"
                title={`${symbol} has ${thread.roundTripCount} round trip${
                  thread.roundTripCount === 1 ? "" : "s"
                } to compare`}
                tone={
                  thread.totalGrossRealizedPnl < 0 ||
                  thread.marketContextRiskCount > 0
                    ? "warning"
                    : "info"
                }
              />
            </div>

            {openedFromCoach ? (
              <section
                className="ti-panel p-5"
                data-testid="ticker-story-coach-handoff"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                      Coach Handoff
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-zinc-50">
                      The coach chose this ticker story to compare repeated
                      decisions.
                    </h2>
                    <p className="mt-2 max-w-4xl text-sm leading-6 text-zinc-400">
                      {focusLabel ? `Current focus: ${focusLabel}. ` : ""}
                      Start with the {priorityRoundTripLabel}, then compare it
                      with the first push and the best round trip before writing
                      a rule. This keeps the lesson tied to repeated executions
                      instead of one isolated fill sequence.
                    </p>
                  </div>
                  <div className="grid gap-2 text-sm lg:min-w-[220px]">
                    <Link
                      className="inline-flex justify-center border border-sky-800 bg-sky-950/30 px-4 py-3 font-medium text-sky-100 transition hover:border-sky-400"
                      href={priorityRoundTrip?.href ?? "#round-trips"}
                    >
                      Open priority round trip
                    </Link>
                    <Link
                      className="inline-flex justify-center border border-zinc-800 px-4 py-3 font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
                      href="/intelligence/coach"
                    >
                      Back to coach
                    </Link>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="border border-zinc-800 bg-zinc-950/40 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                      Story result
                    </div>
                    <div
                      className={`mt-2 font-mono text-lg font-semibold ${pnlToneClass(
                        thread.totalGrossRealizedPnl,
                      )}`}
                    >
                      {signed(thread.totalGrossRealizedPnl)}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {thread.storyLabel}
                    </div>
                  </div>
                  <div className="border border-zinc-800 bg-zinc-950/40 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                      Round trip to start
                    </div>
                    <div className="mt-2 text-sm font-semibold text-zinc-100">
                      {priorityRoundTrip
                        ? `Round Trip ${priorityRoundTrip.sequence}`
                        : "Choose a round trip"}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {priorityRoundTrip?.roleLabel ??
                        "Replay the saved records"}
                      {priorityRoundTrip
                        ? ` / ${signed(priorityRoundTrip.grossRealizedPnl)}`
                        : ""}
                    </div>
                  </div>
                  <div className="border border-zinc-800 bg-zinc-950/40 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                      {chartContextAllowed ? "Chart context" : "Evidence basis"}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-zinc-100">
                      {chartContextAllowed && thread.marketContextFindingCount > 0
                        ? `${thread.marketContextFindingCount} findings`
                        : "Execution replay only"}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {chartContextAllowed && thread.marketContextFindingCount > 0
                        ? "Use chart evidence as prompts, then confirm in the replay."
                        : chartContextAllowed
                          ? "Use saved executions and written notes until chart context is available."
                          : "Use saved executions and written notes for this tier."}
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                detail={thread.storyLabel}
                label="Story P/L"
                tone={thread.totalGrossRealizedPnl >= 0 ? "success" : "danger"}
                value={signed(thread.totalGrossRealizedPnl)}
              />
              <MetricCard
                detail={`${thread.closedRoundTripCount} closed / ${thread.openRoundTripCount} open`}
                label="Round Trips"
                value={thread.roundTripCount}
              />
              <MetricCard
                detail={thread.sessionDate}
                label="Time Range"
                value={timeRangeEt(thread)}
              />
              <MetricCard
                detail={thread.lifecycleDetail}
                label="Story Type"
                value={thread.lifecycleLabel}
              />
            </section>

            <section className="ti-panel p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Story Summary
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-zinc-50">
                    {thread.storyLabel}
                  </h2>
                  <p className="mt-2 max-w-4xl text-sm leading-6 text-zinc-400">
                    {thread.storyDetail}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex border px-3 py-1 text-xs font-medium uppercase tracking-wide ${lifecycleToneClass(
                      thread.lifecycleClassification,
                    )}`}
                  >
                    {thread.lifecycleLabel}
                  </span>
                  {chartContextAllowed && thread.marketContextFindingCount > 0 ? (
                    <span className="inline-flex border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-sky-200">
                      {thread.marketContextFindingCount} chart evidence
                    </span>
                  ) : chartContextAllowed ? (
                    <PlainStateBadge state="market_context_unavailable" tone="warning" />
                  ) : (
                    <span className="inline-flex border border-zinc-700 bg-zinc-900/40 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-300">
                      Execution-only
                    </span>
                  )}
                </div>
              </div>
              {sessionStory ? (
                <div className="mt-4 border-t border-zinc-900 pt-4 text-sm leading-6 text-zinc-500">
                  This ticker belongs to the{" "}
                  <Link
                    className="text-sky-300 hover:text-sky-200"
                    href={daySessionHref}
                  >
                    {sessionStory.storyLabel.toLowerCase()} day session
                  </Link>
                  . The day had {sessionStory.tradeCount} round trips across{" "}
                  {sessionStory.symbolCount} symbol
                  {sessionStory.symbolCount === 1 ? "" : "s"}.
                </div>
              ) : null}
            </section>

            <section
              id="round-trips"
              className="ti-panel p-5"
              data-testid="ticker-story-round-trips"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Round Trips
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-zinc-50">
                    {symbol} round trips for this session
                  </h2>
                  <p className="mt-2 max-w-4xl text-sm leading-6 text-zinc-500">
                    These are still separate flat-to-flat records. They are
                    grouped here so repeated same-ticker activity can be
                    reviewed as one story before opening a detailed replay.
                  </p>
                </div>
                <Link
                  className="text-sm text-sky-300 hover:text-sky-200"
                  href="/intelligence/review?queue=highest_priority"
                >
                  Open review queue
                </Link>
              </div>
              <div className="mt-5 grid gap-3">
                {thread.roundTrips.map((roundTrip) => (
                  <Link
                    className="ti-panel-soft block p-4 transition hover:border-sky-500 hover:text-sky-200"
                    href={roundTrip.href}
                    key={roundTrip.id}
                  >
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                            {roundTrip.roleLabel}
                          </span>
                          <span
                            className={`border px-2 py-1 text-xs uppercase tracking-wide ${
                              roundTrip.lifecycleStatus === "open"
                                ? "border-sky-500/40 bg-sky-500/10 text-sky-200"
                                : roundTrip.heldOvernight ||
                                    roundTrip.crossedSessionDate
                                  ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                                  : "border-zinc-800 bg-zinc-950/40 text-zinc-400"
                            }`}
                          >
                            {roundTripLifecycleLabel(roundTrip)}
                          </span>
                        </div>
                        <h3 className="mt-2 text-base font-semibold text-zinc-50">
                          Round Trip {roundTrip.sequence}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-zinc-400">
                          {roundTripTiming(roundTrip)} /{" "}
                          {roundTrip.executionCount} execution
                          {roundTrip.executionCount === 1 ? "" : "s"} /{" "}
                          {roundTrip.entryHourLabelEt}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-zinc-500">
                          {roundTripEvidenceSummary(
                            roundTrip,
                            chartContextAllowed,
                          )}
                        </p>
                      </div>
                      <div className="grid gap-2 md:min-w-[170px] md:text-right">
                        <div
                          className={`font-mono text-lg font-semibold ${pnlToneClass(
                            roundTrip.grossRealizedPnl,
                          )}`}
                        >
                          {signed(roundTrip.grossRealizedPnl)}
                        </div>
                        <span className="text-sm text-sky-300">
                          Open replay
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {hasHoldContinuation ? (
              <section
                id="hold-continuation"
                className="ti-panel p-5"
                data-testid="ticker-story-hold-continuation"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">
                      Hold Continuation
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-zinc-50">
                      The ticker story continued into late-session trading
                    </h2>
                    <p className="mt-2 max-w-4xl text-sm leading-6 text-zinc-400">
                      Keep this with the ticker story: the continuation is still
                      one of the {symbol} round trips, but it needs separate
                      hold-plan review because the saved executions show
                      same-date late or overnight-hours exposure, not whether
                      that hold was planned.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-medium uppercase tracking-wide text-amber-200">
                      {thread.lifecycleLabel}
                    </span>
                    <span className="inline-flex border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-medium uppercase tracking-wide text-amber-200">
                      {continuationRoundTrips.length} hold-continuation round trip
                      {continuationRoundTrips.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {continuationRoundTrips.map((roundTrip) => (
                    <article
                      className="border border-amber-500/30 bg-amber-500/10 p-4"
                      data-testid="ticker-story-hold-round-trip"
                      key={roundTrip.id}
                    >
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-amber-200">
                              {roundTrip.roleLabel}
                            </span>
                            <span className="border border-amber-500/40 bg-zinc-950/30 px-2 py-1 text-xs uppercase tracking-wide text-amber-100">
                              {roundTripLifecycleLabel(roundTrip)}
                            </span>
                          </div>
                          <h3 className="mt-2 text-base font-semibold text-zinc-50">
                            Round Trip {roundTrip.sequence}: continuation to review
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-zinc-300">
                            Opened {dateTimeLabelEt(roundTrip.entryTime)} ET
                            {roundTrip.lifecycleStatus === "open"
                              ? " and is still open in this import."
                              : ` and closed ${dateTimeLabelEt(
                                  roundTrip.exitTime,
                                )} ET.`}
                          </p>
                          <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
                            <div className="border border-amber-500/20 bg-zinc-950/30 px-3 py-2">
                              <div className="text-xs uppercase tracking-wide text-zinc-500">
                                Hold span
                              </div>
                              <div className="mt-1 font-semibold text-zinc-100">
                                {holdDurationLabel(roundTrip)}
                              </div>
                            </div>
                            <div className="border border-amber-500/20 bg-zinc-950/30 px-3 py-2">
                              <div className="text-xs uppercase tracking-wide text-zinc-500">
                                Evidence state
                              </div>
                              <div className="mt-1 font-semibold text-zinc-100">
                                {roundTripEvidenceSummary(
                                  roundTrip,
                                  chartContextAllowed,
                                )}
                              </div>
                            </div>
                            <div className="border border-amber-500/20 bg-zinc-950/30 px-3 py-2">
                              <div className="text-xs uppercase tracking-wide text-zinc-500">
                                Story P/L
                              </div>
                              <div
                                className={`mt-1 font-mono font-semibold ${pnlToneClass(
                                  roundTrip.grossRealizedPnl,
                                )}`}
                              >
                                {signed(roundTrip.grossRealizedPnl)}
                              </div>
                            </div>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-zinc-500">
                            Review this as a hold-plan question: was the hold
                            intended, where was invalidation, and what would
                            have ended the extended-hold or next-session idea?
                          </p>
                        </div>
                        <Link
                          className="inline-flex justify-center border border-amber-500/40 px-4 py-3 text-sm font-medium text-amber-100 transition hover:border-amber-300"
                          href={roundTrip.href}
                        >
                          Open continuation replay
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <section
              id="story-evidence"
              className="ti-panel p-5"
              data-testid="ticker-story-evidence"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Supporting Evidence
                </p>
                <h2 className="mt-2 text-xl font-semibold text-zinc-50">
                  What the saved evidence can support
                </h2>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-zinc-500">
                  Use these prompts after choosing the round trip to replay.
                  They explain why this ticker story matters without mixing it
                  into unrelated symbols from the same day.
                </p>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {reviewEvidence.map((item) => (
                  <div
                    className={`border p-4 ${evidenceToneClass(item.tone)}`}
                    key={item.id}
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      {item.title}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-zinc-300">
                      {item.detail}
                    </div>
                    <div className="mt-3 text-sm leading-6 text-sky-300">
                      {item.reviewAction}
                    </div>
                    <div className="mt-3 text-[11px] uppercase tracking-wide text-zinc-600">
                      {item.evidenceSource}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
