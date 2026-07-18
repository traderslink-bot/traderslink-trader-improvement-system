import { requireTraderIntelligenceOwnerPageAccess } from "@/src/lib/trader-intelligence-v3/auth";

import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  AdvancedDisclosure,
  DashboardSideNav,
  PrimaryActionPanel,
  WorkflowHandoffPanel,
  withPageAnchor,
} from "@/app/app-ui";
import { buildSavedReviewQueueReadModel } from "@/src/lib/trader-analytics/server/saved-review-queue";
import { buildSavedOrSampleTraderAnalyticsViewModel } from "@/src/lib/trader-analytics/server/saved-trader-analytics-data";
import { buildSavedTradeThreadReadModel } from "@/src/lib/trader-analytics/server/saved-trade-threads";
import {
  DEMO_ACCOUNT_ID,
  SqliteImportCommitRepository,
} from "@/src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository";
import {
  importCountLabel,
  importStatusLabel,
} from "@/src/lib/trader-analytics/product/import-user-copy";
import {
  canUseChartContext,
  readTraderIntelligenceTierFromEnv,
} from "@/src/lib/trader-analytics/product/tier-config";
import { filterCustomerSavedTrades } from "@/src/lib/trader-analytics/product/customer-data-filter";

export const metadata: Metadata = {
  title: "Trader Intelligence | TradersLink",
};

export const dynamic = "force-dynamic";

const workspaceNavItems = [
  {
    href: "#overview",
    label: "Overview",
    summary: "Current account, next action, and key performance state.",
  },
  {
    href: "#actions",
    label: "Actions",
    summary: "Import, review, analytics, coach, and progress routes.",
  },
  {
    href: "#intelligence",
    label: "Insights",
    summary: "Analytics preview, day sessions, and review status.",
  },
  {
    href: "#activity",
    label: "Activity",
    summary: "Latest import, saved trade state, and follow-up work.",
  },
  {
    href: "#advanced",
    label: "Advanced",
    summary: "Supporting tools and internal Intelligence notes.",
  },
] as const;

const supportRoutes = [
  {
    href: "/intelligence/first-run",
    label: "First run setup",
    detail: "Use this when the account has not saved a real import yet.",
  },
  {
    href: "/intelligence/imports",
    label: "Import history",
    detail: "Saved imports, imports to finish, duplicate review, and saved output links.",
  },
  {
    href: "/intelligence/admin",
    label: "Intelligence admin",
    detail: "Internal beta notes for storage, launch readiness, and account controls.",
  },
] as const;

function signed(value: number | null | undefined): string {
  if (typeof value !== "number") {
    return "n/a";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function formatPercent(value: number | null | undefined): string {
  return typeof value === "number" ? `${(value * 100).toFixed(1)}%` : "n/a";
}

function countLabel(value: number, singular: string, plural = `${singular}s`): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

function dateLabel(value: string | null | undefined): string {
  if (!value) {
    return "No date yet";
  }

  const parsed = Date.parse(`${value}T12:00:00.000Z`);
  if (Number.isNaN(parsed)) {
    return value;
  }

  return new Date(parsed).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function pnlTone(value: number | null | undefined): string {
  if (typeof value !== "number") {
    return "text-zinc-400";
  }

  return value >= 0 ? "text-emerald-300" : "text-rose-300";
}

function getTabCount(
  queue: ReturnType<typeof buildSavedReviewQueueReadModel> | null,
  id: ReturnType<typeof buildSavedReviewQueueReadModel>["tabs"][number]["id"],
): number {
  return queue?.tabs.find((tab) => tab.id === id)?.count ?? 0;
}

function DashboardMetric({
  detail,
  href,
  label,
  tone = "default",
  value,
}: {
  detail: ReactNode;
  href?: string;
  label: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
  value: ReactNode;
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-300"
      : tone === "warning"
        ? "text-amber-300"
        : tone === "danger"
          ? "text-rose-300"
          : tone === "info"
            ? "text-sky-300"
            : "text-zinc-50";
  const content = (
    <>
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className={`mt-3 break-words text-2xl font-semibold ${toneClass}`}>
        {value}
      </div>
      <div className="mt-2 text-xs leading-5 text-zinc-500 sm:text-sm">
        {detail}
      </div>
    </>
  );

  if (!href) {
    return <div className="ti-metric-card min-h-[118px] p-4">{content}</div>;
  }

  return (
    <Link
      className="ti-metric-card block min-h-[118px] p-4 transition hover:-translate-y-0.5 hover:border-sky-500"
      href={href}
    >
      {content}
    </Link>
  );
}

function ProductAreaCard({
  action,
  detail,
  href,
  kicker,
  metric,
  tone = "info",
  title,
}: {
  action: string;
  detail: ReactNode;
  href: string;
  kicker: string;
  metric: ReactNode;
  tone?: "info" | "success" | "warning" | "danger" | "muted";
  title: string;
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-700/70 bg-emerald-950/20 text-emerald-200"
      : tone === "warning"
        ? "border-amber-700/70 bg-amber-950/20 text-amber-200"
        : tone === "danger"
          ? "border-rose-700/70 bg-rose-950/20 text-rose-200"
          : tone === "muted"
            ? "border-zinc-700/70 bg-zinc-950/35 text-zinc-300"
            : "border-sky-700/70 bg-sky-950/30 text-sky-200";

  return (
    <Link
      className="ti-panel-soft group flex min-h-[188px] flex-col justify-between p-4 transition hover:-translate-y-0.5 hover:border-sky-500"
      href={href}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
              {kicker}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-zinc-50">{title}</h3>
          </div>
          <span
            className={`shrink-0 rounded-md border px-2.5 py-1 text-xs font-semibold ${toneClass}`}
          >
            {metric}
          </span>
        </div>
        <div className="mt-3 text-sm leading-6 text-zinc-400">{detail}</div>
      </div>
      <div className="mt-5 text-sm font-semibold text-sky-300 group-hover:text-sky-200">
        {action}
      </div>
    </Link>
  );
}

function ActivityCard({
  action,
  detail,
  href,
  label,
  title,
}: {
  action: string;
  detail: ReactNode;
  href: string;
  label: string;
  title: string;
}) {
  return (
    <Link
      className="ti-panel-soft block p-4 transition hover:border-sky-500"
      href={href}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <h3 className="mt-2 text-sm font-semibold text-zinc-50">{title}</h3>
      <div className="mt-2 text-xs leading-5 text-zinc-400">{detail}</div>
      <div className="mt-4 text-xs font-semibold text-sky-300">{action}</div>
    </Link>
  );
}

function RouteLink({
  detail,
  href,
  label,
}: {
  detail: string;
  href: string;
  label: string;
}) {
  return (
    <Link
      className="ti-panel-soft block min-h-[112px] p-4 transition hover:border-sky-500"
      href={href}
    >
      <div className="text-sm font-semibold text-zinc-50">{label}</div>
      <div className="mt-2 text-sm leading-6 text-zinc-400">{detail}</div>
    </Link>
  );
}

export default async function IntelligencePage() {
  await requireTraderIntelligenceOwnerPageAccess("app/intelligence/page.tsx");
  const data = buildSavedOrSampleTraderAnalyticsViewModel();
  const activeTier = readTraderIntelligenceTierFromEnv();
  const chartContextAllowed = canUseChartContext(activeTier);
  const hasSavedData = data.mode === "saved";
  const latestReport = data.viewModel.latestReport;
  const report = latestReport.report;
  const savedReviewQueue =
    hasSavedData
      ? buildSavedReviewQueueReadModel({
          includeChartContext: chartContextAllowed,
          repository: data.repository,
          userId: data.userId,
        })
      : null;
  const importHistory =
    hasSavedData
      ? new SqliteImportCommitRepository().listImportBatchHistory(DEMO_ACCOUNT_ID)
      : [];
  const latestImport = importHistory[0] ?? null;
  const savedTrades = hasSavedData
    ? filterCustomerSavedTrades(data.repository.listTrades(data.userId))
    : [];
  const decisionReviewSnapshots =
    hasSavedData
      ? [
          ...new Set(
            savedTrades
              .map((trade) => trade.importBatchId)
              .filter((batchId): batchId is string => Boolean(batchId)),
          ),
        ].flatMap((batchId) =>
          data.repository.listDecisionReviewSnapshotsForBatch(batchId),
        )
      : [];
  const chartContextSnapshots = chartContextAllowed
    ? decisionReviewSnapshots
    : [];
  const tradeThreadModel = buildSavedTradeThreadReadModel({
    decisionReviewSnapshots: chartContextSnapshots,
    report: hasSavedData ? latestReport : null,
    source: hasSavedData ? "saved_sqlite" : "sample",
    trades: savedTrades,
  });
  const unresolvedCount = getTabCount(savedReviewQueue, "unresolved");
  const highestPriorityCount = getTabCount(savedReviewQueue, "highest_priority");
  const marketGapCount = getTabCount(savedReviewQueue, "market_context_unavailable");
  const openBlockCount = getTabCount(savedReviewQueue, "blocked_open_trade");
  const completedReviewCount = getTabCount(savedReviewQueue, "completed");
  const followUpMetricLabel = chartContextAllowed
    ? "Chart data still missing"
    : "Review follow-up";
  const followUpMetricValue = chartContextAllowed
    ? marketGapCount
    : unresolvedCount;
  const followUpMetricHref = hasSavedData
    ? chartContextAllowed
      ? "/intelligence/review?queue=market_context_unavailable"
      : "/intelligence/review?queue=unresolved"
    : "/intelligence/upload-csv";
  const followUpMetricDetail = chartContextAllowed
    ? marketGapCount > 0
      ? "These trades are saved but still waiting on chart data."
      : hasSavedData
        ? "No chart data gaps are blocking the main review queue."
        : "Chart evidence checks run after a saved import."
    : unresolvedCount > 0
      ? "Saved trades still need written review, open-position handling, or a final decision."
      : hasSavedData
        ? "No execution-review follow-up is blocking the main queue."
        : "Execution-review follow-up appears after a saved import.";
  const rawNextReviewHref =
    (savedReviewQueue?.items[0]?.href ?? null) || "/intelligence/review?queue=highest_priority";
  const nextReviewHref = rawNextReviewHref.startsWith("/intelligence/trades/")
    ? withPageAnchor(rawNextReviewHref, "writing-flow")
    : rawNextReviewHref;
  const nextActionHref = hasSavedData ? nextReviewHref : "/intelligence/upload-csv";
  const nextActionLabel = hasSavedData ? "Open Trade Review" : "Upload CSV";
  const nextActionTitle = hasSavedData
    ? savedReviewQueue?.items[0]?.title ?? "Review the next saved trade"
    : "Upload your first CSV";
  const nextActionBody =
    savedReviewQueue?.items[0]?.nextAction ??
    "Upload a broker CSV and let the app create saved trades before you review anything.";
  const savedTradeCount = hasSavedData ? savedTrades.length : 0;
  const sessionCount = tradeThreadModel.sessionStoryCount;
  const tickerStoryCount = tradeThreadModel.threadCount;
  const availableCalendarMonths = [
    ...new Set(
      tradeThreadModel.sessionStories.map((story) => story.sessionDate.slice(0, 7)),
    ),
  ].sort((left, right) => left.localeCompare(right));
  const latestCalendarMonth =
    availableCalendarMonths[availableCalendarMonths.length - 1] ?? null;
  const calendarHref = latestCalendarMonth
    ? `/intelligence/trades/calendar?month=${latestCalendarMonth}#calendar`
    : "/intelligence/trades/calendar#calendar";
  const latestSession = tradeThreadModel.sessionStories[0] ?? null;
  const bestSession =
    [...tradeThreadModel.sessionStories].sort(
      (left, right) => right.totalGrossRealizedPnl - left.totalGrossRealizedPnl,
    )[0] ?? null;
  const worstSession =
    [...tradeThreadModel.sessionStories].sort(
      (left, right) => left.totalGrossRealizedPnl - right.totalGrossRealizedPnl,
    )[0] ?? null;
  const monthPnl =
    latestCalendarMonth === null
      ? null
      : tradeThreadModel.sessionStories
          .filter((story) => story.sessionDate.startsWith(latestCalendarMonth))
          .reduce((total, story) => total + story.totalGrossRealizedPnl, 0);
  const analyticsHref = hasSavedData ? "/intelligence/analytics/results" : "/intelligence/upload-csv";
  const reportPnl = hasSavedData ? report.pnl.grossTotalRealizedPnl : null;
  const winRate = hasSavedData ? report.pnl.grossWinRate : null;
  const completedTradeCount = hasSavedData
    ? report.sampleSize.completedTradeCount
    : 0;
  const uniqueSymbolCount = hasSavedData ? report.sampleSize.symbols.length : 0;

  return (
    <main className="ti-dashboard-bg min-h-screen px-4 py-5 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5">
        <header className="ti-panel flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <Link
            aria-label="TradersLink dashboard home"
            className="flex items-center gap-4"
            href="/intelligence"
          >
            <span className="flex h-12 w-[232px] items-center overflow-hidden rounded-md border border-sky-900/60 bg-[#011E56] px-3 shadow-[0_12px_30px_rgba(1,30,86,0.35)]">
              <Image
                alt="TradersLink"
                className="h-auto w-full"
                height={74}
                priority
                src="/logo-horizontal-main.png"
                width={360}
              />
            </span>
          </Link>
          <nav
            aria-label="Primary dashboard routes"
            className="flex flex-wrap gap-2 text-sm"
          >
            <Link className="ti-top-nav-link" href="/intelligence/upload-csv">
              Upload
            </Link>
            <Link className="ti-top-nav-link" href={calendarHref}>
              Calendar
            </Link>
            <Link className="ti-top-nav-link" href="/intelligence/review">
              Review
            </Link>
            <Link className="ti-top-nav-link" href="/intelligence/analytics">
              Analytics
            </Link>
            <Link className="ti-top-nav-link" href="/intelligence/coach">
              Coach
            </Link>
          </nav>
        </header>

        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <DashboardSideNav
            eyebrow="Dashboard"
            items={[...workspaceNavItems]}
            summary="Use this home base to choose the next thing to do."
          />

          <div className="flex min-w-0 flex-col gap-5">
            <section
              className="ti-panel overflow-hidden p-5 sm:p-6 lg:p-7"
              id="overview"
            >
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-stretch">
                <div className="flex min-w-0 flex-col justify-between gap-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                      Trader Intelligence Dashboard
                    </p>
                    <h1 className="mt-3 text-3xl font-semibold tracking-normal text-zinc-50 sm:text-4xl">
                      Trader Intelligence
                    </h1>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base">
                      Start with one simple loop: upload trades, open the next
                      review, read the plain-language analytics, then use the
                      coach and progress views to follow through.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-md border border-sky-900/60 bg-[#011E56]/35 p-3">
                      <div className="text-xs uppercase tracking-wide text-zinc-500">
                        Current month
                      </div>
                      <div className={`mt-2 font-mono text-lg ${pnlTone(monthPnl)}`}>
                        {signed(monthPnl)}
                      </div>
                    </div>
                    <div className="rounded-md border border-zinc-800/80 bg-zinc-950/35 p-3">
                      <div className="text-xs uppercase tracking-wide text-zinc-500">
                        Review work
                      </div>
                      <div className="mt-2 font-mono text-lg text-sky-300">
                        {unresolvedCount}
                      </div>
                    </div>
                    <div className="rounded-md border border-zinc-800/80 bg-zinc-950/35 p-3">
                      <div className="text-xs uppercase tracking-wide text-zinc-500">
                        Calendar days
                      </div>
                      <div className="mt-2 font-mono text-lg text-zinc-100">
                        {sessionCount}
                      </div>
                    </div>
                  </div>
                </div>

                <PrimaryActionPanel
                  actionHref={nextActionHref}
                  actionLabel={nextActionLabel}
                  body={nextActionBody}
                  eyebrow="Your next step"
                  secondary={
                    hasSavedData ? (
                      <div className="grid gap-2 text-xs text-zinc-400">
                        <div>
                          Highest priority:{" "}
                          <span className="font-semibold text-amber-200">
                            {highestPriorityCount}
                          </span>
                        </div>
                        {chartContextAllowed ? (
                          <div>
                            Reviewed with chart data:{" "}
                            <span className="font-semibold text-emerald-200">
                              {completedReviewCount}
                            </span>
                          </div>
                        ) : (
                          <div>
                            Execution follow-up:{" "}
                            <span className="font-semibold text-emerald-200">
                              {unresolvedCount}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs leading-5 text-zinc-400">
                        No broker choice is needed here. Pick the CSV and the
                        app will guide the next step.
                      </p>
                    )
                  }
                  title={nextActionTitle}
                  tone={hasSavedData ? "info" : "success"}
                />
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <DashboardMetric
                detail={
                  hasSavedData
                    ? `${completedTradeCount} completed round trips in the current report.`
                    : "Upload a CSV to replace empty dashboard stats with your trades."
                }
                href={hasSavedData ? "/intelligence/trades/round-trips#trade-list" : "/intelligence/upload-csv"}
                label="Saved Trades"
                tone={hasSavedData ? "default" : "warning"}
                value={savedTradeCount}
              />
              <DashboardMetric
                detail={
                  hasSavedData
                    ? `${uniqueSymbolCount} symbols across ${sessionCount} day sessions.`
                    : "Ticker stories and day sessions appear after saving trades."
                }
                href={hasSavedData ? calendarHref : "/intelligence/upload-csv"}
                label="Day Sessions"
                tone="info"
                value={sessionCount}
              />
              <DashboardMetric
                detail={
                  hasSavedData
                    ? `${formatPercent(winRate)} gross win rate.`
                    : "Analytics starts after saved imports exist."
                }
                href={analyticsHref}
                label="Gross P/L"
                tone={typeof reportPnl === "number" && reportPnl < 0 ? "danger" : "success"}
                value={signed(reportPnl)}
              />
              <DashboardMetric
                detail={followUpMetricDetail}
                href={followUpMetricHref}
                label={followUpMetricLabel}
                tone={followUpMetricValue > 0 ? "warning" : "success"}
                value={followUpMetricValue}
              />
            </section>

            <section id="actions" data-testid="workspace-primary-actions">
              <WorkflowHandoffPanel
                body="Use Intelligence as the product home: save clean executions, review the next trade, then check analytics and coaching follow-through."
                eyebrow="Intelligence Flow"
                items={[
                  {
                    action: "Upload CSV",
                    body: "Start fresh with the simple upload card and let the app route the result.",
                    href: "/intelligence/upload-csv",
                    label: "1. Upload",
                    title: "Import trades",
                    tone: "success",
                  },
                  {
                    action: "Open review",
                    body: "Replay the saved trade, decide what happened, and write the lesson.",
                    href: nextReviewHref,
                    label: "2. Review",
                    title: "Review next trade",
                    tone: "warning",
                  },
                  {
                    action: "Open report",
                    body: chartContextAllowed
                      ? "Check timing, results, behavior, ticker stories, and chart evidence."
                      : "Check timing, results, behavior, ticker stories, and execution evidence.",
                    href: "/intelligence/analytics/results",
                    label: "3. Analyze",
                    title: "Read analytics",
                    tone: "info",
                  },
                  {
                    action: "Open coach",
                    body: "Turn the evidence into one fix, repeat, or review path.",
                    href: "/intelligence/coach",
                    label: "4. Follow through",
                    title: "Use coach",
                    tone: "info",
                  },
                ]}
                title="Trade review workflow"
              />
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]" id="intelligence">
              <div className="ti-panel p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                      Product Areas
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-zinc-50">
                      Choose what you want to see
                    </h2>
                  </div>
                  <p className="max-w-xl text-sm leading-6 text-zinc-500">
                    The main dashboard keeps beginner actions first. Deeper
                    evidence stays available once the trader opens a route.
                  </p>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <ProductAreaCard
                    action="Open calendar"
                    detail="Start from the month view, pick a trading day, then drill into ticker stories and round trips."
                    href={calendarHref}
                    kicker="Trading calendar"
                    metric={countLabel(sessionCount, "day")}
                    title="Review day sessions"
                    tone="info"
                  />
                  <ProductAreaCard
                    action="Open saved trades"
                    detail="Browse ticker stories, day sessions, round trips, open or swing trades, and review-needed trades."
                    href="/intelligence/trades/day-sessions#session-stories"
                    kicker="Saved library"
                    metric={countLabel(tickerStoryCount, "story", "stories")}
                    title="Find the trade story"
                    tone="success"
                  />
                  <ProductAreaCard
                    action="Open review queue"
                    detail={
                      chartContextAllowed
                        ? "See the trades that most need a replay, chart evidence check, or lesson draft."
                        : "See the trades that most need a replay, written review, or final decision."
                    }
                    href="/intelligence/review?queue=highest_priority"
                    kicker="Review queue"
                    metric={countLabel(unresolvedCount, "item")}
                    title="Work the next trade"
                    tone={unresolvedCount > 0 ? "warning" : "success"}
                  />
                  <ProductAreaCard
                    action="Open analytics"
                    detail={
                      chartContextAllowed
                        ? "Get the bigger picture across results, timing, behavior, ticker stories, sessions, and chart evidence."
                        : "Get the bigger picture across results, timing, behavior, ticker stories, sessions, and execution evidence."
                    }
                    href="/intelligence/analytics/results"
                    kicker="Analytics"
                    metric={formatPercent(winRate)}
                    title="Understand the pattern"
                    tone="info"
                  />
                  <ProductAreaCard
                    action="Open coach"
                    detail="Use one focused coaching sequence instead of scanning every possible behavior at once."
                    href="/intelligence/coach"
                    kicker="Coach"
                    metric={highestPriorityCount > 0 ? "Focus ready" : "Ready"}
                    title="Fix or repeat one thing"
                    tone="info"
                  />
                  <ProductAreaCard
                    action="Open progress"
                    detail="Track follow-through after reviews are written, not just how many trades were imported."
                    href="/intelligence/progress#progress-follow-through"
                    kicker="Progress"
                    metric={countLabel(completedReviewCount, "review")}
                    title="Check follow-through"
                    tone={completedReviewCount > 0 ? "success" : "muted"}
                  />
                </div>
              </div>

              <aside className="ti-panel p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                  Analytics Preview
                </p>
                <h2 className="mt-2 text-xl font-semibold text-zinc-50">
                  Current report
                </h2>
                <div className="mt-5 grid gap-3">
                  <div className="rounded-md border border-zinc-800/80 bg-zinc-950/35 p-4">
                    <div className="text-xs uppercase tracking-wide text-zinc-500">
                      Period
                    </div>
                    <div className="mt-2 text-sm font-semibold text-zinc-100">
                      {hasSavedData
                        ? latestReport.reportPeriod.label
                        : "No saved report yet"}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-md border border-emerald-900/60 bg-emerald-950/20 p-4">
                      <div className="text-xs uppercase tracking-wide text-zinc-500">
                        Best day
                      </div>
                      <div className={`mt-2 font-mono text-lg ${pnlTone(bestSession?.totalGrossRealizedPnl)}`}>
                        {signed(bestSession?.totalGrossRealizedPnl)}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {dateLabel(bestSession?.sessionDate)}
                      </div>
                    </div>
                    <div className="rounded-md border border-rose-900/60 bg-rose-950/20 p-4">
                      <div className="text-xs uppercase tracking-wide text-zinc-500">
                        Hardest day
                      </div>
                      <div className={`mt-2 font-mono text-lg ${pnlTone(worstSession?.totalGrossRealizedPnl)}`}>
                        {signed(worstSession?.totalGrossRealizedPnl)}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {dateLabel(worstSession?.sessionDate)}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-md border border-zinc-800/80 bg-zinc-950/35 p-4">
                    <div className="text-xs uppercase tracking-wide text-zinc-500">
                      Plain read
                    </div>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      {hasSavedData
                        ? report.timeOfDay.entryInsight
                        : "Upload a CSV to see timing and behavior summaries from your saved trades."}
                    </p>
                  </div>
                </div>
              </aside>
            </section>

            <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]" id="activity">
              <div className="ti-panel p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                  Recent Activity
                </p>
                <h2 className="mt-2 text-xl font-semibold text-zinc-50">
                  What changed most recently
                </h2>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <ActivityCard
                    action={latestImport ? "Open import" : "Upload CSV"}
                    detail={
                      latestImport
                        ? `${importCountLabel(
                            latestImport.savedTradeCount,
                            "trade",
                          )}, ${importStatusLabel(latestImport.summaryStatus)}`
                        : "The dashboard is ready for the first broker CSV."
                    }
                    href={
                      latestImport
                        ? `/intelligence/imports/${encodeURIComponent(latestImport.batch.id)}`
                        : "/intelligence/upload-csv"
                    }
                    label="Latest import"
                    title={latestImport?.batch.brokerLabel ?? "No saved import yet"}
                  />
                  <ActivityCard
                    action={latestSession ? "Open day session" : "Open calendar"}
                    detail={
                      latestSession
                        ? `${countLabel(
                            latestSession.symbolCount,
                            "ticker",
                          )}, ${countLabel(latestSession.tradeCount, "round trip")}`
                        : "Day sessions appear once trades have been saved."
                    }
                    href={latestSession?.daySessionHref ?? calendarHref}
                    label="Latest day"
                    title={dateLabel(latestSession?.sessionDate)}
                  />
                  <ActivityCard
                    action={savedReviewQueue?.items[0] ? "Open review" : "Open review queue"}
                    detail={
                      savedReviewQueue?.items[0]?.priorityReason ??
                      "Review tasks appear after imports are saved and checked."
                    }
                    href={nextReviewHref}
                    label="Next review"
                    title={savedReviewQueue?.items[0]?.symbol ?? "No review item yet"}
                  />
                </div>
              </div>

              <aside className="ti-panel p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                  Status
                </p>
                <h2 className="mt-2 text-xl font-semibold text-zinc-50">
                  Attention areas
                </h2>
                <div className="mt-5 grid gap-3">
                  <Link
                    className="rounded-md border border-zinc-800/80 bg-zinc-950/35 p-4 transition hover:border-sky-500"
                    href="/intelligence/review?queue=unresolved"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-zinc-100">
                        Unresolved reviews
                      </span>
                      <span className="font-mono text-sm text-sky-300">
                        {unresolvedCount}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      {chartContextAllowed
                        ? "Trades still waiting for a written review, chart evidence check, or final decision."
                        : "Trades still waiting for a written review, execution replay, or final decision."}
                    </p>
                  </Link>
                  <Link
                    className="rounded-md border border-zinc-800/80 bg-zinc-950/35 p-4 transition hover:border-sky-500"
                    href="/intelligence/review?queue=blocked_open_trade"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-zinc-100">
                        Open or active handling
                      </span>
                      <span className="font-mono text-sm text-amber-300">
                        {openBlockCount}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      These need careful handling before the app treats the
                      position story as finished.
                    </p>
                  </Link>
                  <Link
                    className="rounded-md border border-zinc-800/80 bg-zinc-950/35 p-4 transition hover:border-sky-500"
                    href={
                      chartContextAllowed
                        ? "/intelligence/review?queue=market_context_unavailable"
                        : "/intelligence/review?queue=unresolved"
                    }
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-zinc-100">
                        {chartContextAllowed
                          ? "Chart data still missing"
                          : "Review follow-up"}
                      </span>
                      <span className="font-mono text-sm text-amber-300">
                        {chartContextAllowed ? marketGapCount : unresolvedCount}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      {chartContextAllowed
                        ? "Availability state only. Chart evidence appears once the data and saved review snapshot are ready."
                        : "Execution-review status only. Open the queue when a saved trade still needs a note or final handling."}
                    </p>
                  </Link>
                </div>
              </aside>
            </section>

            <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]" id="advanced">
              <AdvancedDisclosure
                summary="More review tools"
                testId="workspace-additional-review-tools"
              >
                <div>
                  <p className="text-sm leading-6 text-zinc-400">
                    These routes are useful after the main workflow is running.
                    They stay below the fold so the dashboard does not feel like
                    an admin console.
                  </p>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <RouteLink
                      detail="Best trade, biggest leak, repeatable behavior, and next-session focus."
                      href="/intelligence/session-recap"
                      label="Session Recap"
                    />
                    <RouteLink
                      detail="Best/worst trade comparison and lesson extraction once enough trades exist."
                      href="/intelligence/compare-trades"
                      label="Compare Trades"
                    />
                    <RouteLink
                      detail="User setup path across import, review, rule creation, and coaching habits."
                      href="/intelligence/onboarding"
                      label="Onboarding"
                    />
                  </div>
                </div>
              </AdvancedDisclosure>

              <aside className="ti-panel p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                  Internal
                </p>
                <h2 className="mt-2 text-xl font-semibold text-zinc-50">
                  Beta storage and admin notes
                </h2>
                <div className="mt-5 grid gap-3">
                  {supportRoutes.map((route) => (
                    <RouteLink key={route.href} {...route} />
                  ))}
                </div>
              </aside>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
