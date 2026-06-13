import Link from "next/link";
import type { Metadata } from "next";
import {
  AdvancedDisclosure,
  type AppTone,
  DashboardSideNav,
  MetricCard,
  PlainStateBadge,
  PrimaryActionPanel,
  plainStateLabel,
  withPageAnchor,
} from "@/app/app-ui";
import { SavedImportSourceCaution } from "@/app/saved-import-source-caution";
import { buildGuidedReviewSession } from "@/src/lib/trader-analytics";
import { buildSavedOrSampleTraderAnalyticsViewModel } from "@/src/lib/trader-analytics/server/saved-trader-analytics-data";
import { buildSavedDecisionReviewReadModel } from "@/src/lib/trader-analytics/server/saved-decision-review-service";
import {
  buildSavedReviewQueueReadModel,
  type SavedReviewQueueItem,
} from "@/src/lib/trader-analytics/server/saved-review-queue";
import { buildLatestSavedImportSourceCautionReadModel } from "@/src/lib/trader-analytics/server/saved-import-source-caution";
import { buildSavedTradeThreadReadModel } from "@/src/lib/trader-analytics/server/saved-trade-threads";
import {
  canUseChartContext,
  readTraderIntelligenceTierFromEnv,
} from "@/src/lib/trader-analytics/product/tier-config";
import { filterCustomerSavedTrades } from "@/src/lib/trader-analytics/product/customer-data-filter";
import { SavedReviewQueueActions } from "./saved-review-queue-actions";

export const metadata: Metadata = {
  title: "Guided Review | Trader Intelligence",
};

export const dynamic = "force-dynamic";
const REVIEW_QUEUE_VISIBLE_COUNT = 6;
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
  chartContextAllowed: boolean,
): T[] {
  if (chartContextAllowed) {
    return items;
  }

  return items.filter((item) => !CHART_CONTEXT_EVIDENCE_IDS.has(item.id));
}

function savedReviewToneClass(status: string): string {
  return status === "completed"
    ? "text-emerald-300"
    : status === "market_context_unavailable" || status === "analysis_failed"
      ? "text-amber-300"
      : status === "blocked_open_trade"
        ? "text-sky-300"
        : "text-zinc-300";
}

function savedReviewStateTone(lane: string): string {
  return lane === "completed"
    ? "text-emerald-300"
    : lane === "blocked_open_trade"
      ? "text-sky-300"
      : lane === "market_context_unavailable" ||
          lane === "analysis_failed" ||
          lane === "candle_basis_warning"
        ? "text-amber-300"
        : "text-zinc-300";
}

function savedReviewTechnicalLimitLabel(code: string): string {
  const normalized = code.toLowerCase();

  if (normalized.includes("market_context_unavailable")) {
    return plainStateLabel("market_context_unavailable");
  }

  if (normalized.includes("blocked_open_trade") || normalized.includes("open_trade")) {
    return plainStateLabel("blocked_open_trade");
  }

  if (normalized.includes("analysis_failed")) {
    return plainStateLabel("analysis_failed");
  }

  if (normalized.includes("skipped")) {
    return "Review skipped";
  }

  if (normalized.includes("queued")) {
    return "Waiting for trade review";
  }

  return "Technical follow-up";
}

function plainWorkflowLabel(value: string): string {
  const normalized = value.toLowerCase();

  if (normalized === "cost_driver") {
    return "Cost driver";
  }

  if (normalized === "behavior_memory") {
    return "Behavior pattern";
  }

  if (normalized === "rule_candidate") {
    return "Rule candidate";
  }

  if (normalized === "trade_grade") {
    return "Trade grade";
  }

  if (normalized === "strength") {
    return "Strength";
  }

  if (normalized === "ready_to_name") {
    return "Ready to name";
  }

  return value
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatReviewQueuePnl(value: number | null): string {
  if (value === null) {
    return "P/L n/a";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function reviewQueuePnlTone(value: number | null): string {
  if (value === null) {
    return "text-zinc-500";
  }

  return value >= 0 ? "text-emerald-300" : "text-rose-300";
}

function reviewQueueEvidenceCopy(item: SavedReviewQueueItem): {
  body: string;
  label: string;
  tone: AppTone;
} {
  if (item.hasSnapshot) {
    if (item.candleBasisStatus === "warning") {
      return {
        body: "Chart context is attached, but candle prices need a basis check against broker executions. Use execution replay and broker P/L for movement conclusions.",
        label: "Basis check needed",
        tone: "warning",
      };
    }

    if (item.primaryChartFindingLabel) {
      return {
        body:
          item.primaryChartFindingAction ??
          "Saved chart review is attached. Use it after the execution replay.",
        label: item.primaryChartFindingLabel,
        tone:
          item.chartRiskCount > 0
            ? "warning"
            : item.chartStrengthCount > 0
              ? "success"
              : "info",
      };
    }

    return {
      body: "Saved chart review is attached. Use it after the execution replay.",
      label: "Chart evidence ready",
      tone: "success",
    };
  }

  if (item.hasDiagnostics) {
    return {
      body: "Execution data is saved. Chart data needs another check before chart conclusions are used.",
      label: "Execution review now",
      tone: "warning",
    };
  }

  return {
    body: "Saved execution data is available for replay and notes.",
    label: "Execution replay",
    tone: "info",
  };
}

export default async function GuidedReviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ queue?: string }>;
}) {
  const query = await searchParams;
  const data = buildSavedOrSampleTraderAnalyticsViewModel();
  const activeTier = readTraderIntelligenceTierFromEnv();
  const chartContextAllowed = canUseChartContext(activeTier);
  const analytics = data.viewModel;
  const review = buildGuidedReviewSession({ analytics });
  const coach = analytics.improvementIntelligence.dailyCoachReport;
  const polish = analytics.productPolish;
  const habit = analytics.reviewHabitLoop;
  const savedDecisionReview =
    data.mode === "saved" && chartContextAllowed
      ? buildSavedDecisionReviewReadModel({ repository: data.repository })
      : null;
  const savedReviewQueue =
    data.mode === "saved"
      ? buildSavedReviewQueueReadModel({
          repository: data.repository,
          activeFilter: query?.queue,
          includeChartContext: chartContextAllowed,
        })
      : null;
  const importSourceCaution =
    data.mode === "saved"
      ? buildLatestSavedImportSourceCautionReadModel({
          repository: data.repository,
        })
      : null;
  const savedTrades = filterCustomerSavedTrades(
    data.repository.listTrades(data.userId),
  );
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
  const tradeThreadModel = buildSavedTradeThreadReadModel({
    decisionReviewSnapshots: chartContextSnapshots,
    report: analytics.latestReport,
    source: data.mode === "saved" ? "saved_sqlite" : "sample",
    trades: savedTrades,
  });
  const prioritySessionStory =
    tradeThreadModel.sessionStories.find(
      (story) => story.storyKind === "green_to_red_session",
    ) ??
    tradeThreadModel.sessionStories.find(
      (story) => story.storyKind === "same_symbol_many_attempts",
    ) ??
    tradeThreadModel.sessionStories.find(
      (story) => story.storyKind === "session_high_trade_count",
    ) ??
    tradeThreadModel.sessionStories.find(
      (story) => story.storyKind === "open_or_swing_review",
    ) ??
    tradeThreadModel.sessionStories.find(
      (story) => story.storyKind === "strengths_to_repeat_session",
    ) ??
    tradeThreadModel.sessionStories[0] ??
    null;
  const primaryReviewItem =
    savedReviewQueue?.items[0] ?? savedReviewQueue?.allItems[0] ?? null;
  const highestPriorityCount =
    savedReviewQueue?.tabs.find((tab) => tab.id === "highest_priority")?.count ?? 0;
  const marketGapCount =
    savedReviewQueue?.tabs.find((tab) => tab.id === "market_context_unavailable")?.count ?? 0;
  const queuedChartDataCount =
    savedReviewQueue?.tabs.find((tab) => tab.id === "queued")?.count ?? 0;
  const openBlockCount =
    savedReviewQueue?.tabs.find((tab) => tab.id === "blocked_open_trade")?.count ?? 0;
  const candleBasisWarningCount =
    savedReviewQueue?.tabs.find((tab) => tab.id === "candle_basis_warning")?.count ?? 0;
  const chartDataFollowUp =
    queuedChartDataCount > 0
      ? {
          label: "Chart data waiting",
          count: queuedChartDataCount,
          href: "/intelligence/review?queue=queued",
        }
      : {
          label: "Chart data still missing",
          count: marketGapCount,
          href: "/intelligence/review?queue=market_context_unavailable",
        };
  const reviewFollowUp =
    chartContextAllowed && candleBasisWarningCount > 0
      ? {
          label: "Candle basis check",
          count: candleBasisWarningCount,
          href: "/intelligence/review?queue=candle_basis_warning",
          tone: "warning" as const,
        }
      : chartContextAllowed
        ? {
            ...chartDataFollowUp,
            tone: "warning" as const,
          }
        : {
            label: "Execution reviews",
            count: savedReviewQueue?.allItems.length ?? 0,
            href: "/intelligence/review?queue=all",
            tone: "info" as const,
          };

  return (
    <main className="ti-dashboard-bg min-h-screen px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-8">
        <header className="ti-panel p-6">
          <Link className="text-sm text-sky-300 hover:text-sky-200" href="/intelligence">
            Back to Intelligence
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-50">
            {review.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">
            {review.summary}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Primary Trades"
            value={review.primaryTradeIds.length}
            detail="Trades connected to this guided review."
          />
          <MetricCard
            label="Review Steps"
            value={review.steps.length}
            detail="The checklist path for this review session."
            tone="info"
          />
          <MetricCard
            label="Suggested Lesson"
            value={plainStateLabel(review.suggestedLesson.status)}
            detail="Draft only until you write the final lesson."
            tone="success"
          />
        </section>

        <SavedImportSourceCaution
          caution={importSourceCaution}
          surface="review"
        />

        <section className="grid min-w-0 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <DashboardSideNav
            eyebrow="Review Menu"
            items={[
              {
                href: "#review-first",
                label: "Review First",
                summary: "The highest-value trade or queue lane.",
              },
              {
                href: "#queue",
                label: "Queue Lanes",
                summary: "Saved trades grouped by review state.",
              },
              {
                href: "#coach",
                label: "Coach Notes",
                summary: "Fix/preserve prompts from evidence.",
              },
              {
                href: "#session-story",
                label: "Session Story",
                summary: "Full-day risk or strength handoff.",
              },
              {
                href: "#flow",
                label: "Review Flow",
                summary: "Checklist and lesson draft.",
              },
            ]}
            summary={
              chartContextAllowed
                ? "Work this page like a review queue while chart-data checks stay in the background."
                : "Work this page like a saved execution review queue."
            }
          />
          <div className="grid min-w-0 gap-6">
            <div id="review-first">
        <PrimaryActionPanel
          actionHref={
            primaryReviewItem
              ? withPageAnchor(primaryReviewItem.href, "writing-flow")
              : "/intelligence/import-dry-run"
          }
          actionLabel={primaryReviewItem ? "Open Trade Review" : "Import trades"}
          body={
            primaryReviewItem
              ? primaryReviewItem.stateDetail
              : data.mode === "saved"
                ? savedReviewQueue?.emptyState.body
                : "The review page is showing sample guidance until a broker CSV is saved."
          }
          eyebrow="Review This First"
          secondary={
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Highest Priority",
                  count: highestPriorityCount,
                  href: "/intelligence/review?queue=highest_priority",
                  tone: "warning" as const,
                },
                {
                  label: reviewFollowUp.label,
                  count: reviewFollowUp.count,
                  href: reviewFollowUp.href,
                  tone: reviewFollowUp.tone,
                },
                {
                  label: "Open or Swing",
                  count: openBlockCount,
                  href: "/intelligence/review?queue=blocked_open_trade",
                  tone: "info" as const,
                },
              ].map((item) => (
                <Link
                  className="ti-panel-soft p-3 hover:border-sky-500"
                  href={item.href}
                  key={item.label}
                >
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    {item.label}
                  </div>
                  <div className={`mt-2 text-2xl font-semibold ${
                    item.tone === "info" ? "text-sky-300" : "text-amber-300"
                  }`}>
                    {item.count}
                  </div>
                </Link>
              ))}
            </div>
          }
          testId="review-continuation-panel"
          title={
            primaryReviewItem
              ? `${primaryReviewItem.symbol} is first in this review lane`
              : data.mode === "saved"
                ? "No urgent saved review item in this lane"
                : "Save an import to build a saved review queue"
          }
          tone="info"
        />
            </div>

            <section
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"
              data-testid="review-work-order"
            >
              {[
                {
                  label: "1. Open",
                  title: primaryReviewItem
                    ? `${primaryReviewItem.symbol} review`
                    : "Import trades",
                  body: primaryReviewItem
                    ? "Start with the highest-value saved queue item."
                    : "Save one broker CSV to build a queue.",
                  href: primaryReviewItem
                    ? withPageAnchor(primaryReviewItem.href, "summary")
                    : "/intelligence/import-dry-run",
                  action: primaryReviewItem ? "Open Trade Review" : "Import Trades",
                },
                {
                  label: "2. Replay",
                  title: "What happened",
                  body: chartContextAllowed
                    ? "Replay entries, adds, reductions, exits, timing, and P/L before using chart or level findings."
                    : "Replay entries, adds, reductions, exits, timing, and P/L before writing the lesson.",
                  href: primaryReviewItem
                    ? withPageAnchor(primaryReviewItem.href, "execution")
                    : "#flow",
                  action: "Replay executions",
                },
                {
                  label: "3. Write",
                  title: "One lesson",
                  body: "Write down the main behavior, why it mattered, and what to do next time.",
                  href: primaryReviewItem
                    ? withPageAnchor(primaryReviewItem.href, "writing-flow")
                    : "#flow",
                  action: "Write lesson",
                },
                {
                  label: "4. Track",
                  title: "Open coaching focus",
                  body: "Take the written lesson into the overall coach, then check whether the same behavior repeats across saved trades.",
                  href: "/intelligence/coach",
                  action: "Open coaching focus",
                },
                {
                  label: "5. Measure",
                  title: "Check progress",
                  body: "Use progress after reviews are saved, not just after trades are imported.",
                  href: "/intelligence/progress#progress-follow-through",
                  action: "Check progress",
                },
              ].map((step) => (
                <Link
                  className="ti-panel-soft p-4 transition hover:border-sky-500"
                  href={step.href}
                  key={step.label}
                >
                  <div className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                    {step.label}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-zinc-100">
                    {step.title}
                  </div>
                  <div className="mt-2 text-xs leading-5 text-zinc-500">
                    {step.body}
                  </div>
                  <div className="mt-3 text-xs font-medium text-sky-300">
                    {step.action}
                  </div>
                </Link>
              ))}
            </section>

            <section
              id="session-story"
              className="ti-panel p-4"
              data-testid="review-session-story-handoff"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                    Session Review Handoff
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-zinc-100">
                    Check the full trading day before writing the final lesson.
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                    A trade can look different when the whole day is included.
                    Session stories show green-to-red days, repeated ticker
                    attempts, open or overnight exposure, and strengths worth
                    repeating.
                  </p>
                </div>
                  <Link
                    className="border border-sky-800 bg-sky-950/30 px-4 py-3 text-sm font-medium text-sky-100 transition hover:border-sky-400"
                    href="/intelligence/trades/day-sessions#session-stories"
                  >
                    Open day sessions
                  </Link>
              </div>

              {prioritySessionStory ? (
                <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)]">
                  <div
                    className={`border p-4 ${
                      prioritySessionStory.storyKind === "green_to_red_session"
                        ? "border-rose-500/30 bg-rose-500/10"
                        : prioritySessionStory.storyKind === "strengths_to_repeat_session"
                          ? "border-emerald-500/30 bg-emerald-500/10"
                          : "border-sky-500/30 bg-sky-500/10"
                    }`}
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      Session to check
                    </div>
                    <div className="mt-2 text-xl font-semibold text-zinc-50">
                      {prioritySessionStory.sessionDate}
                    </div>
                    <div className="mt-1 text-sm text-zinc-300">
                      {prioritySessionStory.storyLabel} /{" "}
                      {formatReviewQueuePnl(
                        prioritySessionStory.totalGrossRealizedPnl,
                      )}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-zinc-300">
                      {prioritySessionStory.storyDetail}
                    </p>
                  </div>
                  <div className="grid gap-3">
                    <div className="grid gap-3 md:grid-cols-3">
                      <MetricCard
                        label="Round Trips"
                        value={prioritySessionStory.tradeCount}
                        detail={`${prioritySessionStory.symbolCount} symbol${prioritySessionStory.symbolCount === 1 ? "" : "s"}`}
                        tone="info"
                      />
                      <MetricCard
                        label="Strengths To Repeat"
                        value={prioritySessionStory.marketContextStrengthCount}
                        detail={`${prioritySessionStory.protectedProfitBeforeFadeFindingCount} profit-protection strength${prioritySessionStory.protectedProfitBeforeFadeFindingCount === 1 ? "" : "s"}`}
                        tone={
                          prioritySessionStory.marketContextStrengthCount > 0
                            ? "success"
                            : "default"
                        }
                      />
                      <MetricCard
                        label="Open Or Swing"
                        value={prioritySessionStory.openOrSwingThreadCount}
                        detail="Hold-plan reviews in this session"
                        tone={
                          prioritySessionStory.openOrSwingThreadCount > 0
                            ? "info"
                            : "default"
                        }
                      />
                    </div>
                    <div className="border border-zinc-900 bg-zinc-950/60 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Session prompt
                      </div>
                      <p className="mt-2 text-sm leading-6 text-zinc-200">
                        {prioritySessionStory.reviewPrompt}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-sky-300">
                        {prioritySessionStory.fixFirstAction}
                      </p>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      {visibleStoryEvidence(
                        prioritySessionStory.reviewEvidence,
                        chartContextAllowed,
                      )
                        .slice(0, 2)
                        .map((item) => (
                        <div
                          className="border border-zinc-900 bg-zinc-950/60 p-3"
                          key={item.id}
                        >
                          <div className="text-sm font-medium text-zinc-200">
                            {item.title}
                          </div>
                          <div className="mt-1 text-xs leading-5 text-zinc-500">
                            {item.detail}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 ti-panel-soft p-4 text-sm text-zinc-400">
                  Save an import to group trades into full-day sessions.
                </div>
              )}
            </section>

        {savedReviewQueue ? (
          <section
            className="ti-panel p-4"
            data-testid="saved-review-queue"
            id="queue"
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                  Saved Review Work Queue
                </p>
                <h2 className="mt-2 text-lg font-semibold text-zinc-100">
                  Work one trade at a time
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                  Open the first item, replay what happened, write the behavior
                  and fix-first action, then mark the queue item reviewed.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  className="border border-sky-800 bg-sky-950/30 px-4 py-2 text-sm font-medium text-sky-100 transition hover:border-sky-400"
                  href="/intelligence/trades"
                >
                  Open saved trades
                </Link>
                <Link
                  className="border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500"
                  href="/intelligence/coach"
                >
                  Open coaching focus
                </Link>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 xl:grid-cols-4" data-testid="saved-review-queue-tabs">
              {savedReviewQueue.tabs.map((tab) => (
                <Link
                  key={tab.id}
                  className={`ti-panel-soft px-3 py-3 transition hover:border-sky-600 ${
                    tab.id === savedReviewQueue.activeFilter
                      ? "border-sky-500 bg-sky-950/30"
                      : ""
                  }`}
                  data-testid={`saved-review-queue-tab-${tab.id}`}
                  href={tab.href}
                >
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {tab.label}
                  </div>
                  <div
                    className={`mt-2 text-2xl font-semibold ${
                      tab.id === savedReviewQueue.activeFilter
                        ? "text-sky-200"
                        : "text-zinc-100"
                    }`}
                  >
                    {tab.count}
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-6 grid gap-4">
              {savedReviewQueue.items.length === 0 ? (
                <div
                  className="ti-panel-soft p-4 text-sm text-zinc-400"
                  data-testid="saved-review-queue-empty"
                >
                  <div className="font-medium text-zinc-100">
                    {savedReviewQueue.emptyState.title}
                  </div>
                  <div className="mt-2 leading-6">{savedReviewQueue.emptyState.body}</div>
                </div>
              ) : (
                <>
                  <div className="rounded-md border border-sky-900/60 bg-sky-950/20 p-3 text-sm leading-6 text-zinc-400">
                    Showing the first{" "}
                    {Math.min(
                      REVIEW_QUEUE_VISIBLE_COUNT,
                      savedReviewQueue.items.length,
                    )}{" "}
                    of {savedReviewQueue.items.length} trades in this lane.
                    Finish one review, then come back for the next batch.
                  </div>
                  {savedReviewQueue.items
                    .slice(0, REVIEW_QUEUE_VISIBLE_COUNT)
                    .map((item, index) => {
                  const evidence = reviewQueueEvidenceCopy(item);

                  return (
                    <article
                      key={item.id}
                      className="ti-panel-soft p-4"
                      data-testid={`saved-review-queue-item-${item.savedTradeId}`}
                    >
                      <div className="grid gap-4 xl:grid-cols-[180px_minmax(0,1fr)_220px] xl:items-start">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                            Trade {index + 1}
                          </div>
                          <Link
                            className="mt-2 block text-lg font-semibold text-zinc-100 hover:text-sky-200"
                            href={withPageAnchor(item.href, "summary")}
                          >
                            {item.symbol}
                          </Link>
                          <div className={`mt-1 font-mono text-sm ${reviewQueuePnlTone(item.grossRealizedPnl)}`}>
                            {formatReviewQueuePnl(item.grossRealizedPnl)}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="inline-flex border border-amber-900 bg-amber-950/20 px-2 py-1 text-xs uppercase tracking-wide text-amber-200">
                              {item.priorityLabel}
                            </span>
                            <PlainStateBadge state={item.lane} tone={evidence.tone} />
                          </div>
                        </div>

                        <div
                          className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
                          data-testid={`saved-review-queue-work-card-${item.savedTradeId}`}
                        >
                          <div className="border border-zinc-800 bg-slate-950/40 p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                              Why it is here
                            </div>
                            <div className="mt-2 text-sm leading-6 text-zinc-300">
                              {item.priorityReason}
                            </div>
                          </div>
                          <div className="border border-zinc-800 bg-slate-950/40 p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                              Do this now
                            </div>
                            <div className="mt-2 text-sm leading-6 text-zinc-300">
                              {item.nextAction}
                            </div>
                          </div>
                          <div className="border border-zinc-800 bg-slate-950/40 p-3 lg:col-span-2">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                                  Evidence status
                                </div>
                                <div className={`mt-2 text-sm font-medium ${savedReviewStateTone(item.lane)}`}>
                                  {evidence.label}
                                </div>
                                <div className="mt-1 text-xs leading-5 text-zinc-500">
                                  {evidence.body}
                                </div>
                              </div>
                              {item.chartFindingCount > 0 ? (
                                <Link
                                  className="w-fit text-xs font-semibold text-sky-300 hover:text-sky-200"
                                  href={withPageAnchor(item.href, "chart-handoff")}
                                >
                                  Open chart and volume evidence
                                </Link>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <Link
                            className="border border-sky-800 bg-sky-950/30 px-3 py-3 text-center text-sm font-medium text-sky-100 transition hover:border-sky-400"
                            href={withPageAnchor(item.href, "writing-flow")}
                          >
                            Open Trade Review
                          </Link>
                          <Link
                            className="border border-zinc-800 px-3 py-2 text-center text-xs font-medium text-zinc-200 transition hover:border-zinc-500"
                            href={withPageAnchor(item.href, "execution")}
                          >
                            Replay executions
                          </Link>
                          <SavedReviewQueueActions
                            currentStatus={item.reviewStatus}
                            tradeId={item.savedTradeId}
                          />
                        </div>
                      </div>

                      <details className="mt-4 border-t border-zinc-800 pt-3 text-xs text-zinc-500">
                        <summary className="cursor-pointer font-semibold text-zinc-400">
                          Evidence counts and technical limits
                        </summary>
                        <div
                          className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
                          data-testid={`saved-review-queue-state-${item.savedTradeId}`}
                        >
                          {item.chartFindingCount > 0 ? (
                            <>
                              <div className="border border-zinc-900 p-2">
                                <div className="uppercase tracking-wide text-zinc-600">
                                  Chart risks
                                </div>
                                <div className="mt-1 text-zinc-400">
                                  {item.chartRiskCount}
                                </div>
                              </div>
                              <div className="border border-zinc-900 p-2">
                                <div className="uppercase tracking-wide text-zinc-600">
                                  Chart strengths
                                </div>
                                <div className="mt-1 text-zinc-400">
                                  {item.chartStrengthCount}
                                </div>
                              </div>
                              <div className="border border-zinc-900 p-2">
                                <div className="uppercase tracking-wide text-zinc-600">
                                  Review prompts
                                </div>
                                <div className="mt-1 text-zinc-400">
                                  {item.chartReviewPromptCount}
                                </div>
                              </div>
                            </>
                          ) : null}
                          {item.chartFindingCount > 0 ||
                          item.candleBasisStatus !== "unknown" ? (
                            <div className="border border-zinc-900 p-2">
                              <div className="uppercase tracking-wide text-zinc-600">
                                Candle basis
                              </div>
                              <div className="mt-1 text-zinc-400">
                                {item.candleBasisStatus === "warning"
                                  ? "Needs review"
                                  : item.candleBasisStatus === "aligned"
                                    ? "Checked"
                                    : "Not reported"}
                              </div>
                            </div>
                          ) : null}
                          <div className="border border-zinc-900 p-2">
                            <div className="uppercase tracking-wide text-zinc-600">
                              Queue detail
                            </div>
                            <div className="mt-1 text-zinc-400">
                              {item.detail}
                            </div>
                          </div>
                          <div className="border border-zinc-900 p-2 sm:col-span-2 lg:col-span-4">
                            <div className="uppercase tracking-wide text-zinc-600">
                              State detail
                            </div>
                            <div className="mt-1 text-zinc-400">
                              {item.stateDetail}
                            </div>
                          </div>
                          {[
                            ["Review state", plainStateLabel(item.reviewStatus)],
                            ["Review scope", item.reviewScopeLabel],
                            ["Notes saved", String(item.notesCount)],
                            [
                              "Updated",
                              item.generatedAt
                                ? new Date(item.generatedAt).toLocaleString("en-US", {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  })
                                : "Not available",
                            ],
                          ].map(([label, value]) => (
                            <div key={label} className="border border-zinc-900 p-2">
                              <div className="uppercase tracking-wide text-zinc-600">
                                {label}
                              </div>
                              <div className="mt-1 text-zinc-400">{value}</div>
                            </div>
                          ))}
                        </div>
                      </details>
                    </article>
                  );
                })}
                </>
              )}
            </div>
          </section>
        ) : (
          <section
            className="ti-panel p-4"
            data-testid="saved-review-queue"
            id="queue"
          >
            <h2 className="text-sm font-semibold text-zinc-100">
              Saved Review Queue
            </h2>
            <div className="mt-3 text-sm text-zinc-500">
              Save an import to replace sample review content with a saved queue.
            </div>
          </section>
        )}

        <section id="queue-status" className="grid gap-6 xl:grid-cols-2">
          {chartContextAllowed ? (
          <AdvancedDisclosure
            summary="Advanced queue status and technical limits"
            testId="saved-decision-review-status"
          >
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Chart Data Review
              </h2>
              {savedDecisionReview ? (
                <>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="border-t border-zinc-900 py-3">
                    <div className="text-xs uppercase tracking-wide text-zinc-500">
                      Completed
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-emerald-300">
                      {savedDecisionReview.completedCount}
                    </div>
                  </div>
                  <div className="border-t border-zinc-900 py-3">
                    <div className="text-xs uppercase tracking-wide text-zinc-500">
                      Chart data still missing
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-amber-300">
                      {savedDecisionReview.marketContextUnavailableCount}
                    </div>
                  </div>
                  <div className="border-t border-zinc-900 py-3">
                    <div className="text-xs uppercase tracking-wide text-zinc-500">
                      Open or Swing
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-sky-300">
                      {savedDecisionReview.blockedOpenTradeCount}
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  {([
                    ["Waiting", savedDecisionReview.queuedCount],
                    ["Manual follow-up", savedDecisionReview.analysisFailedCount],
                    ["Skipped", savedDecisionReview.skippedLimitCount],
                    ["Technical review items", savedDecisionReview.diagnostics.length],
                  ] as Array<[string, number]>).map(([label, count]) => (
                    <div key={label} className="border-t border-zinc-900 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs uppercase tracking-wide text-zinc-500">
                          {label}
                        </span>
                        <span className="font-mono text-xs text-zinc-300">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-zinc-500">
                  {savedDecisionReview.nextAction}
                </div>
                {Object.keys(savedDecisionReview.diagnosticCodeCounts).length > 0 ? (
                  <details className="mt-5 border-t border-zinc-900 pt-3">
                    <summary className="cursor-pointer text-xs uppercase tracking-wide text-zinc-500">
                      Technical review limits
                    </summary>
                    <div className="mt-3 grid gap-2">
                      {Object.entries(savedDecisionReview.diagnosticCodeCounts).map(
                        ([code, count]) => (
                          <div key={code} className="border-t border-zinc-900 py-2">
                            <div className="flex items-center justify-between gap-3">
                              <span className={savedReviewToneClass(code)}>
                                {savedReviewTechnicalLimitLabel(code)}
                              </span>
                              <span className="font-mono text-xs text-zinc-300">
                                {count}
                              </span>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </details>
                ) : null}
                <div className="mt-5 grid gap-3">
                  {savedDecisionReview.snapshots.slice(0, 4).map((snapshot) => (
                    <Link
                      key={snapshot.id}
                      className="block border-t border-zinc-900 py-3 hover:text-sky-200"
                      href={withPageAnchor(
                        `/intelligence/trades/${encodeURIComponent(snapshot.savedTradeId)}?from=review-queue&queue=completed`,
                        "evidence",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-zinc-300">
                          {snapshot.symbol}
                        </span>
                        <span className="text-xs uppercase tracking-wide text-zinc-500">
                          {plainStateLabel(snapshot.review.marketContextSource)}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {snapshot.review.coachingHeadline ??
                          "Chart evidence review saved."}
                      </div>
                    </Link>
                  ))}
                </div>
                </>
              ) : (
                <div className="mt-4 text-sm text-zinc-500">
                  Save an import to persist chart evidence snapshots.
                </div>
              )}
            </div>
          </AdvancedDisclosure>
          ) : null}

          <div className="ti-panel p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Playbook Drafts
            </h2>
            <div className="mt-4 grid gap-3">
              {habit.playbookDrafting.drafts.slice(0, 5).map((draft) => (
                <div key={draft.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{draft.title}</span>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">
                      {plainWorkflowLabel(draft.readiness)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {draft.nextAction}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <details className="ti-panel p-4">
            <summary className="cursor-pointer text-sm font-semibold text-zinc-100">
              Advanced coach wording checks
            </summary>
            <div className="mt-4 text-2xl font-semibold text-emerald-300">
              {habit.safetyCopyAudit.passed ? "Pass" : "Review"}
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              {habit.safetyCopyAudit.checkedTextCount} product copy item(s)
              checked.
            </div>
            <div className="mt-4 grid gap-2">
              {habit.coachLanguageRefinement.guidelines.map((item) => (
                <div key={item.id} className="border-t border-zinc-900 py-2">
                  <div className="text-sm text-zinc-300">{item.label}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {item.guidance}
                  </div>
                </div>
              ))}
            </div>
          </details>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.45fr)]">
          <div className="ti-panel p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Coach Review Queue
            </h2>
            <div className="mt-4 grid gap-3">
              {polish.coachReviewQueue.items.slice(0, 6).map((item) => (
                <Link
                  key={item.id}
                  className="block border-t border-zinc-900 py-3 hover:text-sky-200"
                  data-testid={`review-queue-link-${item.id}`}
                  href={
                    item.href.startsWith("/intelligence/trades/")
                      ? withPageAnchor(item.href, "writing-flow")
                      : item.href
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{item.title}</span>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">
                      {plainWorkflowLabel(item.lane)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {item.nextAction}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="ti-panel p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Session Recap
            </h2>
            <div className="mt-4 border-t border-zinc-900 py-3 text-sm text-zinc-300">
              {polish.sessionRecap.headline}
            </div>
            <div className="text-xs text-zinc-500">
              {polish.sessionRecap.nextAction}
            </div>
            <Link
              className="mt-4 inline-block text-sm text-sky-300 hover:text-sky-200"
              href="/intelligence/session-recap"
            >
              Open session recap
            </Link>
          </div>
        </section>

        <section id="coach" className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.4fr)]">
          <div className="ti-panel p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Session Coach Report
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="border-t border-zinc-900 py-3">
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Fix Next Session
                </div>
                <div className="mt-2 text-sm text-amber-200">
                  {coach.fixNextSession}
                </div>
              </div>
              <div className="border-t border-zinc-900 py-3">
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Preserve
                </div>
                <div className="mt-2 text-sm text-emerald-200">
                  {coach.preserveNextSession}
                </div>
              </div>
            </div>
          </div>

          <div className="ti-panel p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Biggest Mistake
            </h2>
            <div className="mt-4 border-t border-zinc-900 py-3 text-sm text-zinc-300">
              {coach.biggestMistake?.label ?? "No repeated mistake yet."}
            </div>
            <div className="text-xs text-zinc-500">
              {coach.ruleFocus ?? "No repeated rule focus yet."}
            </div>
          </div>
        </section>

        <section id="flow" className="grid gap-6 xl:grid-cols-[minmax(0,0.65fr)_minmax(320px,0.35fr)]">
          <div className="ti-panel p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Review Flow
            </h2>
            <div className="mt-4 grid gap-4">
              {review.steps.map((step, index) => (
                <div key={step.id} className="border-t border-zinc-900 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center border border-zinc-800 font-mono text-xs text-sky-300">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-zinc-100">
                        {step.label}
                      </div>
                      <div className="mt-1 text-sm text-zinc-500">
                        {step.detail}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-zinc-500">{step.action}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {step.relatedTradeIds.slice(0, 5).map((tradeId, tradeIndex) => (
                      <Link
                        key={tradeId}
                        className="border border-zinc-800 px-2 py-1 text-xs text-sky-300 hover:border-sky-400"
                        data-testid={`review-related-trade-${tradeId}-${index}`}
                        href={withPageAnchor(`/intelligence/trades/${encodeURIComponent(tradeId)}`, "writing-flow")}
                      >
                        Open trade {tradeIndex + 1}
                      </Link>
                    ))}
                    {step.relatedTradeIds.length > 5 ? (
                      <span className="px-2 py-1 text-xs text-zinc-500">
                        +{step.relatedTradeIds.length - 5} more related trade
                        {step.relatedTradeIds.length - 5 === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ti-panel p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Lesson Draft
            </h2>
            <div className="mt-4 border-t border-zinc-900 py-4">
              <div className="text-sm font-medium text-zinc-100">
                {review.suggestedLesson.title}
              </div>
              <div className="mt-2 text-sm text-zinc-500">
                {review.suggestedLesson.body}
              </div>
              <div className="mt-4 text-xs text-zinc-500">
                {review.suggestedLesson.linkedRuleRecommendationId
                  ? "Rule draft connected."
                  : "No rule draft connected yet."}
              </div>
            </div>
          </div>
        </section>
          </div>
        </section>
      </div>
    </main>
  );
}
