import { requireTraderIntelligenceOwnerPageAccess } from "@/src/lib/trader-intelligence-v3/auth";

import Link from "next/link";
import type { Metadata } from "next";
import {
  AdvancedDisclosure,
  DashboardSideNav,
  PrimaryActionPanel,
  WorkflowHandoffPanel,
  withPageAnchor,
} from "@/app/app-ui";
import { buildTraderProgressViewModel } from "@/src/lib/trader-analytics";
import {
  buildCoachProgressFollowThroughSummary,
  type CoachProgressFollowThroughTone,
} from "@/src/lib/trader-analytics/product/coach-overall-focus";
import { buildSavedReviewQueueReadModel } from "@/src/lib/trader-analytics/server/saved-review-queue";
import { buildSavedTradeThreadReadModel } from "@/src/lib/trader-analytics/server/saved-trade-threads";
import { buildSavedOrSampleTraderAnalyticsViewModel } from "@/src/lib/trader-analytics/server/saved-trader-analytics-data";
import {
  canUseChartContext,
  readTraderIntelligenceTierFromEnv,
} from "@/src/lib/trader-analytics/product/tier-config";
import {
  filterCustomerSavedReports,
  filterCustomerSavedTrades,
} from "@/src/lib/trader-analytics/product/customer-data-filter";

type SavedTradeThread = ReturnType<typeof buildSavedTradeThreadReadModel>["threads"][number];
type SavedTradeSessionStory = ReturnType<
  typeof buildSavedTradeThreadReadModel
>["sessionStories"][number];

export const metadata: Metadata = {
  title: "Progress | Trader Intelligence",
};

export const dynamic = "force-dynamic";

function signed(value: number | null): string {
  if (value === null) {
    return "n/a";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function percent(part: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.round((part / total) * 100);
}

function progressToneClass(tone: CoachProgressFollowThroughTone): string {
  if (tone === "success") {
    return "text-emerald-300";
  }

  if (tone === "danger") {
    return "text-rose-300";
  }

  if (tone === "warning") {
    return "text-amber-300";
  }

  return "text-sky-300";
}

function progressBarClass(tone: CoachProgressFollowThroughTone): string {
  if (tone === "success") {
    return "bg-emerald-400";
  }

  if (tone === "danger") {
    return "bg-rose-400";
  }

  if (tone === "warning") {
    return "bg-amber-400";
  }

  return "bg-sky-400";
}

function chooseProgressTickerStory(threads: SavedTradeThread[]): SavedTradeThread | null {
  const multiRoundTripStories = threads.filter((thread) => thread.roundTripCount > 1);

  return (
    multiRoundTripStories.find((thread) => thread.storyKind === "profit_giveback") ??
    multiRoundTripStories.find((thread) => thread.storyKind === "swing_transition") ??
    multiRoundTripStories.find((thread) => thread.storyKind === "extended_same_day_hold") ??
    multiRoundTripStories.find((thread) => thread.storyKind === "open_reentry") ??
    multiRoundTripStories.find(
      (thread) => thread.storyKind === "repeated_losing_attempts",
    ) ??
    multiRoundTripStories[0] ??
    null
  );
}

function chooseProgressSessionStory(
  stories: SavedTradeSessionStory[],
): SavedTradeSessionStory | null {
  return (
    stories.find((story) => story.storyKind === "green_to_red_session") ??
    stories.find((story) => story.storyKind === "same_symbol_many_attempts") ??
    stories.find((story) => story.storyKind === "session_high_trade_count") ??
    stories.find((story) => story.storyKind === "open_or_swing_review") ??
    stories.find((story) => story.storyKind === "strengths_to_repeat_session") ??
    stories[0] ??
    null
  );
}

export default async function ProgressPage() {
  await requireTraderIntelligenceOwnerPageAccess("app/intelligence/progress/page.tsx");
  const data = buildSavedOrSampleTraderAnalyticsViewModel();
  const activeTier = readTraderIntelligenceTierFromEnv();
  const chartContextAllowed = canUseChartContext(activeTier);
  const savedTrades = filterCustomerSavedTrades(
    data.repository.listTrades(data.userId),
  );
  const savedReviewQueue =
    data.mode === "saved"
      ? buildSavedReviewQueueReadModel({
          includeChartContext: chartContextAllowed,
          repository: data.repository,
          userId: data.userId,
        })
      : null;
  const reports =
    data.mode === "saved"
      ? filterCustomerSavedReports(data.repository.listReports(data.userId))
      : [];
  const previousReport = reports.length > 1 ? reports[1] : null;
  const progress = buildTraderProgressViewModel({
    analytics: data.viewModel,
    previousReport,
  });
  const scorecard = progress.intelligence.scorecard;
  const overall = scorecard.dimensions.find((dimension) => dimension.id === "overall");
  const improvement = progress.analytics.improvementIntelligence;
  const polish = progress.analytics.productPolish;
  const habit = progress.analytics.reviewHabitLoop;
  const completedTradeCount =
    data.viewModel.latestReport.report.sampleSize.completedTradeCount;
  const reviewedTradeCount = savedTrades.filter((trade) =>
    ["reviewed", "resolved"].includes(trade.reviewStatus),
  ).length;
  const inProgressTradeCount = savedTrades.filter(
    (trade) => trade.reviewStatus === "in_progress",
  ).length;
  const openOrSwingCount = data.viewModel.latestReport.report.trades.filter(
    (trade) =>
      trade.isOpenPosition ||
      trade.heldOvernight ||
      trade.heldPostmarketIntoOvernight ||
      trade.heldSessionBuckets.some((bucket) =>
        String(bucket).toLowerCase().includes("overnight"),
      ),
  ).length;
  const decisionReviewSnapshots =
    data.mode === "saved"
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
  const chartTierEnabled =
    chartContextAllowed && (data.mode === "sample" || chartContextSnapshots.length > 0);
  const tradeThreadModel = buildSavedTradeThreadReadModel({
    decisionReviewSnapshots: chartContextSnapshots,
    report: data.viewModel.latestReport,
    source: data.mode === "saved" ? "saved_sqlite" : "sample",
    trades: savedTrades,
  });
  const priorityTickerStory = chooseProgressTickerStory(tradeThreadModel.threads);
  const givebackThreadCount = tradeThreadModel.threads.filter(
    (thread) => thread.storyKind === "profit_giveback",
  ).length;
  const swingThreadCount = tradeThreadModel.threads.filter(
    (thread) =>
      thread.storyKind === "swing_transition" ||
      thread.storyKind === "extended_same_day_hold",
  ).length;
  const openReentryThreadCount = tradeThreadModel.threads.filter(
    (thread) => thread.storyKind === "open_reentry",
  ).length;
  const repeatedLossThreadCount = tradeThreadModel.threads.filter(
    (thread) => thread.storyKind === "repeated_losing_attempts",
  ).length;
  const prioritySessionStory = chooseProgressSessionStory(
    tradeThreadModel.sessionStories,
  );
  const reviewCompletionPct = percent(reviewedTradeCount, savedTrades.length);
  const coachFollowThrough = buildCoachProgressFollowThroughSummary({
    activeFocusLabel: progress.activeFocusLabel,
    hasSavedData: data.mode === "saved",
    reviewQueueItems: savedReviewQueue?.allItems ?? [],
    trades: savedTrades,
  });
  const qualityTrendPoints = polish.executionQualityTrendline.points.slice(0, 12);
  const hiddenQualityPointCount = Math.max(
    0,
    polish.executionQualityTrendline.points.length - qualityTrendPoints.length,
  );

  return (
    <main className="ti-dashboard-bg min-h-screen px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-8">
        <header className="ti-panel p-6">
          <Link className="text-sm text-sky-300 hover:text-sky-200" href="/intelligence">
            Back to Intelligence
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-50">
            Trader Progress
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">
            {progress.progressSummary}
          </p>
          <div className="mt-4 text-xs uppercase tracking-wide text-zinc-500">
            {data.mode === "saved"
              ? `${savedTrades.length} saved trade(s), ${completedTradeCount} completed round trip(s) included`
              : "Sample data until you save an import"}
          </div>
        </header>

        <section className="grid min-w-0 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <DashboardSideNav
            eyebrow="Progress Menu"
            items={[
              {
                href: "#score",
                label: "Score",
                summary: "Overall score and active focus.",
              },
              {
                href: "#rules",
                label: "Rules",
                summary: "Rule improvement and behavior change.",
              },
              {
                href: "#quality",
                label: "Quality",
                summary: "Execution quality and pattern memory.",
              },
              {
                href: "#ticker-stories",
                label: "Ticker Stories",
                summary: "Re-entry giveback, open re-entries, and swing transitions.",
              },
              {
                href: "#session-stories",
                label: "Session Stories",
                summary: "Full-day patterns across saved trades.",
              },
              {
                href: "#history",
                label: "History",
                summary: "Saved report snapshots.",
              },
            ]}
            summary="Progress should feel like a performance report, not a wall of cards."
          />
          <div className="grid min-w-0 gap-6">
        <PrimaryActionPanel
          actionHref="/intelligence/review?queue=highest_priority"
          actionLabel="Open Review Queue"
          body={
            data.mode === "saved"
              ? `Progress is reading ${savedTrades.length} saved trade(s) from the current saved imports. Complete reviews to move this from imported-trade history into behavior-change tracking.`
              : "Save one broker CSV before progress can use your own trades."
          }
          eyebrow="Progress data source"
          secondary={
            <Link
              className="border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500"
              href="/intelligence/trades"
            >
              Open saved trades
            </Link>
          }
          testId="progress-saved-source"
          title={
            data.mode === "saved"
              ? "Saved import data is powering this progress page"
              : "Progress unlocks after a saved import"
          }
          tone="info"
        />

        <WorkflowHandoffPanel
          body="Progress is only meaningful after a review is written. Use this path when you want to see whether the coaching focus is actually changing."
          eyebrow="Progress Workflow"
          items={[
            {
              action: "Open coach",
              body: "Start with the active behavior or strength across saved trades.",
              href: "/intelligence/coach",
              label: "1. Focus",
              title: "Review coaching focus",
            },
            {
              action: "Open queue",
              body: "Finish the trades that prove or challenge the focus.",
              href: "/intelligence/review?queue=highest_priority",
              label: "2. Review",
              title: "Complete evidence reviews",
              tone: "warning",
            },
            {
              action: "Open analytics",
              body: "Check the report behind the behavior, session, or ticker story.",
              href: "/intelligence/analytics",
              label: "3. Report",
              title: chartTierEnabled
                ? "Study the chart set"
                : "Study the execution report",
              tone: "info",
            },
            {
              action: "Stay here",
              body: "Use progress after reviews are complete, not just after import.",
              href: "#progress-follow-through",
              label: "4. Track",
              title: "Measure follow-through",
              tone: "success",
            },
          ]}
          testId="progress-workflow-handoff"
          title="Follow the review loop"
        />

        <section
          className="grid gap-4 md:grid-cols-4"
          data-testid="progress-saved-data-strip"
        >
          {[
            {
              label: "Saved Trades",
              value: savedTrades.length,
              detail: data.mode === "saved" ? "Imported trade records" : "Sample preview",
              tone: "text-zinc-100",
            },
            {
              label: "Completed Round Trips",
              value: completedTradeCount,
              detail: "Flat-to-flat trades in analytics",
              tone: "text-emerald-300",
            },
            {
              label: "Open/Swing Items",
              value: openOrSwingCount,
              detail: "Need separate hold review",
              tone: openOrSwingCount > 0 ? "text-amber-300" : "text-zinc-100",
            },
            {
              label: "Reviews Finished",
              value: `${reviewCompletionPct}%`,
              detail: `${reviewedTradeCount} done / ${inProgressTradeCount} in progress`,
              tone: "text-sky-300",
            },
          ].map((item) => (
            <div className="ti-panel p-4" key={item.label}>
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {item.label}
              </div>
              <div className={`mt-3 text-2xl font-semibold ${item.tone}`}>
                {item.value}
              </div>
              <div className="mt-2 text-sm leading-5 text-zinc-500">
                {item.detail}
              </div>
            </div>
          ))}
        </section>

        <section className="ti-panel p-4" data-testid="progress-review-completion">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Review Completion
              </h2>
              <p className="mt-1 max-w-3xl text-sm text-zinc-500">
                Imported trades count as history. Progress improves after you review trades, save notes, and mark behavior changes complete.
              </p>
            </div>
            <Link className="text-sm text-sky-300 hover:text-sky-200" href="/intelligence/review">
              Continue reviews
            </Link>
          </div>
          <div className="mt-4 h-3 bg-zinc-900">
            <div
              className="h-3 bg-sky-400"
              style={{ width: `${reviewCompletionPct}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            {reviewedTradeCount} of {savedTrades.length} saved trade
            {savedTrades.length === 1 ? "" : "s"} have a finished review status.
          </div>
        </section>

        <section
          id="ticker-stories"
          className="ti-panel p-4"
          data-testid="progress-ticker-stories"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                Ticker Story Progress
              </p>
              <h2 className="mt-2 text-lg font-semibold text-zinc-100">
                Track whether re-entries are improving.
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                Progress should not only count flat-to-flat trades. It should
                also show whether same-symbol re-entries gave back profit, stayed
                open, or changed the trade into overnight exposure.
              </p>
            </div>
            <Link
              className="border border-sky-800 bg-sky-950/40 px-4 py-3 text-sm font-medium text-sky-100 transition hover:border-sky-400"
              href="/intelligence/trades/ticker-stories#ticker-stories"
            >
              Open ticker stories
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-5">
            {[
              {
                label: "Ticker Stories",
                value: tradeThreadModel.multiRoundTripThreadCount,
                detail: "Same-symbol same-day re-entry groups",
                tone: "text-sky-300",
              },
              {
                label: "Gave Back Profit",
                value: givebackThreadCount,
                detail: "Later attempts reduced earlier gains",
                tone: givebackThreadCount > 0 ? "text-amber-300" : "text-zinc-100",
              },
              {
                label: "Repeated Losses",
                value: repeatedLossThreadCount,
                detail: "Same-symbol attempts stayed red",
                tone:
                  repeatedLossThreadCount > 0 ? "text-rose-300" : "text-zinc-100",
              },
              {
                label: "Open Re-entries",
                value: openReentryThreadCount,
                detail: "Later ticker attempts still need closing executions",
                tone: openReentryThreadCount > 0 ? "text-amber-300" : "text-zinc-100",
              },
              {
                label: "Hold Reviews",
                value: swingThreadCount,
                detail: "Extended same-day or next-session holds",
                tone: swingThreadCount > 0 ? "text-sky-300" : "text-zinc-100",
              },
            ].map((item) => (
              <div className="ti-panel-soft p-3" key={item.label}>
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {item.label}
                </div>
                <div className={`mt-2 text-xl font-semibold ${item.tone}`}>
                  {item.value}
                </div>
                <div className="mt-2 text-xs leading-5 text-zinc-500">
                  {item.detail}
                </div>
              </div>
            ))}
          </div>
          {chartTierEnabled ? (
            <>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {[
                  {
                    label: "Chart Risks",
                    value: tradeThreadModel.marketContextRiskCount,
                    detail: "Certified chart risks still needing follow-through",
                    tone:
                      tradeThreadModel.marketContextRiskCount > 0
                        ? "text-amber-300"
                        : "text-zinc-100",
                  },
                  {
                    label: "Chart Strengths",
                    value: tradeThreadModel.marketContextStrengthCount,
                    detail: "Certified strengths worth repeating",
                    tone:
                      tradeThreadModel.marketContextStrengthCount > 0
                        ? "text-emerald-300"
                        : "text-zinc-100",
                  },
                  {
                    label: "Needs Review",
                    value: tradeThreadModel.marketContextReviewPromptCount,
                    detail: "Chart prompts waiting for enough context",
                    tone:
                      tradeThreadModel.marketContextReviewPromptCount > 0
                        ? "text-sky-300"
                        : "text-zinc-100",
                  },
                ].map((item) => (
                  <div className="ti-panel-soft p-3" key={item.label}>
                    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      {item.label}
                    </div>
                    <div className={`mt-2 text-xl font-semibold ${item.tone}`}>
                      {item.value}
                    </div>
                    <div className="mt-2 text-xs leading-5 text-zinc-500">
                      {item.detail}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <AdvancedDisclosure
                  summary="Show chart evidence counts"
                  testId="progress-chart-evidence-counts"
                >
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[
                      {
                        label: "Chart Findings",
                        value: tradeThreadModel.marketContextFindingCount,
                        detail: "Certified chart prompts and level checks",
                        tone:
                          tradeThreadModel.marketContextFindingCount > 0
                            ? "text-sky-300"
                            : "text-zinc-100",
                      },
                      {
                        label: "Add Quality",
                        value: tradeThreadModel.addQualityFindingCount,
                        detail: `${tradeThreadModel.addQualityRiskCount} risk, ${tradeThreadModel.addQualityStrengthCount} strength`,
                        tone:
                          tradeThreadModel.addQualityRiskCount > 0
                            ? "text-amber-300"
                            : tradeThreadModel.addQualityStrengthCount > 0
                              ? "text-emerald-300"
                              : "text-zinc-100",
                      },
                      {
                        label: "After-Exit Review",
                        value: tradeThreadModel.postExitFindingCount,
                        detail: `${tradeThreadModel.postExitRiskCount} risk, ${tradeThreadModel.postExitStrengthCount} strength`,
                        tone:
                          tradeThreadModel.postExitRiskCount > 0
                            ? "text-amber-300"
                            : tradeThreadModel.postExitStrengthCount > 0
                              ? "text-emerald-300"
                              : tradeThreadModel.threadWithPostExitFindingCount > 0
                                ? "text-sky-300"
                                : "text-zinc-100",
                      },
                      {
                        label: "Protected Profit",
                        value:
                          tradeThreadModel.protectedProfitBeforeFadeFindingCount,
                        detail: `${tradeThreadModel.threadWithProtectedProfitBeforeFadeFindingCount} ticker stor${tradeThreadModel.threadWithProtectedProfitBeforeFadeFindingCount === 1 ? "y" : "ies"}`,
                        tone:
                          tradeThreadModel.protectedProfitBeforeFadeFindingCount > 0
                            ? "text-emerald-300"
                            : "text-zinc-100",
                      },
                      {
                        label: "Support/Resistance Exits",
                        value: tradeThreadModel.exitLevelFindingCount,
                        detail: `${tradeThreadModel.exitLevelRiskCount} risk, ${tradeThreadModel.exitLevelStrengthCount} strength`,
                        tone:
                          tradeThreadModel.exitLevelRiskCount > 0
                            ? "text-amber-300"
                            : tradeThreadModel.exitLevelStrengthCount > 0
                              ? "text-emerald-300"
                              : tradeThreadModel.exitLevelFindingCount > 0
                                ? "text-sky-300"
                                : "text-zinc-100",
                      },
                      {
                        label: "Volume Evidence",
                        value: tradeThreadModel.volumeFindingCount,
                        detail: `${tradeThreadModel.volumeRiskCount} risk, ${tradeThreadModel.volumeStrengthCount} strength`,
                        tone:
                          tradeThreadModel.volumeRiskCount > 0
                            ? "text-amber-300"
                            : tradeThreadModel.volumeStrengthCount > 0
                              ? "text-emerald-300"
                              : tradeThreadModel.volumeFindingCount > 0
                                ? "text-sky-300"
                                : "text-zinc-100",
                      },
                    ].map((item) => (
                      <div className="ti-panel-soft p-3" key={item.label}>
                        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          {item.label}
                        </div>
                        <div className={`mt-2 text-xl font-semibold ${item.tone}`}>
                          {item.value}
                        </div>
                        <div className="mt-2 text-xs leading-5 text-zinc-500">
                          {item.detail}
                        </div>
                      </div>
                    ))}
                  </div>
                </AdvancedDisclosure>
              </div>
            </>
          ) : (
            <div
              className="mt-4 border border-zinc-900 bg-zinc-950/70 p-4 text-sm leading-6 text-zinc-400"
              data-testid="progress-execution-only-evidence"
            >
              This progress view is execution-only in the current tier. It can
              track saved trades, re-entries, holds, review completion, and
              written notes without adding paid evidence claims.
            </div>
          )}
          {priorityTickerStory ? (
            <div className="mt-4 border-t border-zinc-900 pt-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Story to check next
              </div>
              <div className="mt-2 text-sm font-semibold text-zinc-100">
                {priorityTickerStory.symbol} / {priorityTickerStory.storyLabel}
              </div>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-500">
                {priorityTickerStory.primaryReviewQuestion}
              </p>
              <Link
                className="mt-3 inline-flex text-sm text-sky-300 hover:text-sky-200"
                href={priorityTickerStory.href}
              >
                Open this ticker story
              </Link>
            </div>
          ) : (
            <div className="mt-4 border-t border-zinc-900 pt-4 text-sm text-zinc-500">
              No same-symbol re-entry stories yet.
            </div>
          )}
        </section>

        <section
          id="session-stories"
          className="ti-panel p-4"
          data-testid="progress-session-stories"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                Session Story Progress
              </p>
              <h2 className="mt-2 text-lg font-semibold text-zinc-100">
                Track the full-day behaviors that need follow-through.
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                Session stories use saved executions to show whether a day went
                from green to red, had many attempts on one ticker, had a high
                trade count, included open or overnight exposure, or had
                evidence-backed strengths worth repeating.
              </p>
            </div>
            <Link
              className="border border-sky-800 bg-sky-950/40 px-4 py-3 text-sm font-medium text-sky-100 transition hover:border-sky-400"
              href="/intelligence/coach/session-stories"
            >
              Open session coach
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            {[
              {
                label: "Session Stories",
                value: tradeThreadModel.sessionStoryCount,
                detail: "Saved trading days analyzed",
                tone: "text-sky-300",
              },
              {
                label: "Strength Sessions",
                value: tradeThreadModel.strengthsToRepeatSessionCount,
                detail: "Days with evidence-backed strengths",
                tone:
                  tradeThreadModel.strengthsToRepeatSessionCount > 0
                    ? "text-emerald-300"
                    : "text-zinc-100",
              },
              {
                label: "Green To Red",
                value: tradeThreadModel.greenToRedSessionCount,
                detail: "Positive day finished red",
                tone:
                  tradeThreadModel.greenToRedSessionCount > 0
                    ? "text-rose-300"
                    : "text-zinc-100",
              },
              {
                label: "Many Ticker Attempts",
                value: tradeThreadModel.sameSymbolManyAttemptsSessionCount,
                detail: "Repeated same-symbol work",
                tone:
                  tradeThreadModel.sameSymbolManyAttemptsSessionCount > 0
                    ? "text-amber-300"
                    : "text-zinc-100",
              },
              {
                label: "High Trade Count",
                value: tradeThreadModel.highTradeCountSessionCount,
                detail: "Many trades or symbols",
                tone:
                  tradeThreadModel.highTradeCountSessionCount > 0
                    ? "text-amber-300"
                    : "text-zinc-100",
              },
            ].map((item) => (
              <div className="ti-panel-soft p-3" key={item.label}>
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {item.label}
                </div>
                <div className={`mt-2 text-xl font-semibold ${item.tone}`}>
                  {item.value}
                </div>
                <div className="mt-2 text-xs leading-5 text-zinc-500">
                  {item.detail}
                </div>
              </div>
            ))}
          </div>
          {prioritySessionStory ? (
            <div className="mt-4 border-t border-zinc-900 pt-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Session to check next
              </div>
              <div className="mt-2 text-sm font-semibold text-zinc-100">
                {prioritySessionStory.sessionDate} /{" "}
                {prioritySessionStory.storyLabel} /{" "}
                {signed(prioritySessionStory.totalGrossRealizedPnl)}
              </div>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-500">
                {prioritySessionStory.reviewPrompt}
              </p>
              <Link
                className="mt-3 inline-flex text-sm text-sky-300 hover:text-sky-200"
                href={prioritySessionStory.href}
              >
                Open the main ticker story from this session
              </Link>
            </div>
          ) : (
            <div className="mt-4 border-t border-zinc-900 pt-4 text-sm text-zinc-500">
              No session stories yet.
            </div>
          )}
        </section>

        <section
          id="progress-follow-through"
          className="ti-panel p-4"
          data-testid="progress-coach-focus"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                Active Coaching Focus
              </p>
              <h2 className="mt-2 text-lg font-semibold text-zinc-100">
                {coachFollowThrough.trendLabel}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                {coachFollowThrough.trendDetail}
              </p>
            </div>
            <Link
              className="border border-sky-800 bg-sky-950/40 px-4 py-3 text-sm font-medium text-sky-100 transition hover:border-sky-400"
              href={coachFollowThrough.nextActionHref}
            >
              {coachFollowThrough.nextActionLabel}
            </Link>
          </div>
          <div
            className="mt-5"
            data-testid="progress-coach-follow-through"
          >
            <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <span>{coachFollowThrough.activeFocusLabel}</span>
              <span>{coachFollowThrough.completionPct}% reviewed</span>
            </div>
            <div className="mt-2 h-3 bg-zinc-900">
              <div
                className={`h-3 ${progressBarClass(coachFollowThrough.trendTone)}`}
                style={{ width: `${Math.max(4, coachFollowThrough.completionPct)}%` }}
              />
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {coachFollowThrough.cards.map((card) => (
              <div className="ti-panel-soft p-3" key={card.label}>
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {card.label}
                </div>
                <div
                  className={`mt-2 text-xl font-semibold ${progressToneClass(
                    card.tone,
                  )}`}
                >
                  {card.value}
                </div>
                <div className="mt-2 text-xs leading-5 text-zinc-500">
                  {card.detail}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="ti-panel-soft p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-rose-300">
                Fix first
              </div>
              <div className="mt-2 text-sm leading-6 text-zinc-300">
                {improvement.dailyCoachReport.fixNextSession}
              </div>
            </div>
            <div className="ti-panel-soft p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                Repeat this
              </div>
              <div className="mt-2 text-sm leading-6 text-zinc-300">
                {improvement.dailyCoachReport.preserveNextSession}
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-900 pt-3 text-xs">
            <Link
              className="text-sky-300 underline-offset-4 hover:underline"
              href="/intelligence/coach"
            >
              Open coaching focus
            </Link>
            <span className="text-zinc-600">/</span>
            <Link
              className="text-sky-300 underline-offset-4 hover:underline"
              href="/intelligence/review?queue=highest_priority"
            >
              Continue review queue
            </Link>
          </div>
        </section>

        <section id="score" className="grid gap-4 md:grid-cols-4">
          <div className="ti-panel p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Overall Score
            </div>
            <div className="mt-3 text-2xl font-semibold text-sky-300">
              {overall?.score ?? 0}/100
            </div>
          </div>
          <div className="ti-panel p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Active Focus
            </div>
            <div className="mt-3 text-lg font-semibold text-zinc-100">
              {progress.activeFocusLabel}
            </div>
          </div>
          <div className="ti-panel p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Rule Improvement
            </div>
            <div className="mt-3 text-2xl font-semibold text-emerald-300">
              {progress.ruleEffectiveness.improvingCount}
            </div>
          </div>
          <div className="ti-panel p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Est. Mistake Cost
            </div>
            <div className="mt-3 text-2xl font-semibold text-rose-300">
              ${progress.intelligence.mistakeCostEstimates.totalEstimatedGrossCost.toFixed(2)}
            </div>
          </div>
        </section>

        <section id="rules" className="grid gap-6 xl:grid-cols-2">
          <div className="ti-panel p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Score Dimensions
            </h2>
            <div className="mt-4 grid gap-3">
              {scorecard.dimensions.map((dimension) => (
                <div key={dimension.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">
                      {dimension.label}
                    </span>
                    <span className="font-mono text-xs text-zinc-500">
                      {dimension.score}/100
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 bg-zinc-900">
                    <div
                      className="h-1.5 bg-sky-400"
                      style={{ width: `${dimension.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ti-panel p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Rule Effectiveness
            </h2>
            <div className="mt-4 grid gap-3">
              {progress.ruleEffectiveness.items.map((item) => (
                <div key={item.ruleId} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{item.label}</span>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">
                      {item.direction}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    before {item.violationsBefore ?? "n/a"} / after{" "}
                    {item.violationsAfter} / delta {item.delta ?? "n/a"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="ti-panel p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Quality By Trade
            </h2>
            <div className="mt-4 grid gap-3">
              {improvement.visuals.qualityByTrade.items.slice(0, 6).map((item) => (
                <div key={item.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{item.label}</span>
                    <span className="font-mono text-xs text-sky-300">
                      {item.value.toFixed(0)}/100
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 bg-zinc-900">
                    <div
                      className="h-1.5 bg-sky-400"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ti-panel p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Mistake Reduction Targets
            </h2>
            <div className="mt-4 grid gap-3">
              {improvement.visuals.mistakeFrequency.items.slice(0, 6).map((item) => (
                <div key={item.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{item.label}</span>
                    <span className="font-mono text-xs text-amber-300">
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ti-panel p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Coach Focus
            </h2>
            <div className="mt-4 border-t border-zinc-900 py-3 text-sm text-amber-200">
              {improvement.dailyCoachReport.fixNextSession}
            </div>
            <div className="border-t border-zinc-900 py-3 text-sm text-emerald-200">
              {improvement.dailyCoachReport.preserveNextSession}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.45fr)]">
          <div className="ti-panel p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Behavior Change Tracker
            </h2>
            <div className="mt-1 text-sm text-zinc-500">
              {habit.behaviorChangeTracker.summary}
            </div>
            <div className="mt-4 grid gap-3">
              {habit.behaviorChangeTracker.items.map((item) => (
                <div key={item.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{item.label}</span>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">
                      {item.direction}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    current {item.currentValue ?? "n/a"} / prior{" "}
                    {item.previousValue ?? "n/a"} / delta {item.delta ?? "n/a"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ti-panel p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Review Habits
            </h2>
            <div className="mt-3 text-2xl font-semibold text-sky-300">
              {habit.reviewHabitTracker.completionPct}%
            </div>
            <div className="mt-2 text-sm text-zinc-500">
              {habit.reviewHabitTracker.nextHabitAction}
            </div>
          </div>
        </section>

        <section id="quality" className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.45fr)]">
          <div className="ti-panel p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Execution Quality Trendline
            </h2>
            <div className="mt-1 text-sm text-zinc-500">
              {polish.executionQualityTrendline.reportTrendSummary}
            </div>
            <div className="mt-4 grid gap-3">
              {qualityTrendPoints.map((point) => (
                <Link
                  key={point.tradeId}
                  className="block border-t border-zinc-900 py-3 hover:text-sky-200"
                  data-testid={`progress-quality-link-${point.tradeId}`}
                  href={withPageAnchor(
                    `/intelligence/trades/${encodeURIComponent(point.tradeId)}`,
                    "writing-flow",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{point.label}</span>
                    <span className="font-mono text-xs text-sky-300">
                      {point.score}/100
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 bg-zinc-900">
                    <div
                      className="h-1.5 bg-sky-400"
                      style={{ width: `${point.score}%` }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {point.direction} / {point.gradeBand}
                  </div>
                </Link>
              ))}
              {hiddenQualityPointCount > 0 ? (
                <div className="border-t border-zinc-900 py-3">
                  <div className="text-sm font-medium text-zinc-200">
                    {hiddenQualityPointCount} more saved trade
                    {hiddenQualityPointCount === 1 ? "" : "s"}
                  </div>
                  <div className="mt-1 text-xs leading-5 text-zinc-500">
                    Progress shows a focused preview here. Open saved trades or
                    analytics when you want the full list behind the trend.
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      className="border border-sky-800 bg-sky-950/40 px-3 py-2 text-xs font-semibold text-sky-100 transition hover:border-sky-400"
                      href="/intelligence/trades"
                    >
                      Open saved trades
                    </Link>
                    <Link
                      className="border border-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-zinc-500"
                      href="/intelligence/analytics"
                    >
                      Check analytics
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="ti-panel p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Pattern Memory
            </h2>
            <div className="mt-4 grid gap-3">
              {polish.personalPatternMemory.items.slice(0, 6).map((item) => (
                <div key={item.id} className="border-t border-zinc-900 py-3">
                  <div className="text-sm text-zinc-300">{item.label}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {item.occurrenceCount} occurrence(s), {item.confidence} confidence
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">
                    {item.nextAction}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="history" className="ti-panel p-4">
          <h2 className="text-sm font-semibold text-zinc-100">
            Report History
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {progress.analytics.reportSnapshots.map((snapshot, index) => (
              <div key={snapshot.id} className="border-t border-zinc-900 py-3">
                <div className="text-sm font-medium text-zinc-100">
                  Saved report {index + 1}
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {snapshot.completedTradeCount} trades / P/L{" "}
                  {signed(snapshot.grossTotalRealizedPnl)}
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
