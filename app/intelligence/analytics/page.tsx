import { requireTraderIntelligenceOwnerPageAccess } from "@/src/lib/trader-intelligence-v3/auth";

import type { Metadata } from "next";
import Link from "next/link";
import { buildSavedReviewQueueReadModel } from "@/src/lib/trader-analytics/server/saved-review-queue";
import { buildSavedOrSampleTraderAnalyticsViewModel } from "@/src/lib/trader-analytics/server/saved-trader-analytics-data";
import { buildLatestSavedImportSourceCautionReadModel } from "@/src/lib/trader-analytics/server/saved-import-source-caution";
import { buildAnalyticsBehaviorReport } from "@/src/lib/trader-analytics/server/analytics-behavior-report";
import { buildSavedTradeThreadReadModel } from "@/src/lib/trader-analytics/server/saved-trade-threads";
import {
  canUseChartContext,
  readTraderIntelligenceTierFromEnv,
} from "@/src/lib/trader-analytics/product/tier-config";
import { filterCustomerSavedTrades } from "@/src/lib/trader-analytics/product/customer-data-filter";
import {
  AnalyticsClient,
  type AnalyticsDashboardSection,
} from "./analytics-client";

export const metadata: Metadata = {
  title: "Analytics | Trader Intelligence",
};

export const dynamic = "force-dynamic";

function normalizeAnalyticsSection(
  value: string | string[] | undefined,
): AnalyticsDashboardSection {
  const raw = Array.isArray(value) ? value[0] : value;

  switch (raw) {
    case "results":
    case "timing":
    case "behavior":
    case "ticker_stories":
    case "session_stories":
    case "chart_evidence":
    case "review":
    case "trades":
    case "advanced":
      return raw;
    default:
      return "overview";
  }
}

function EmptyAnalyticsPage({
  chartContextAllowed,
}: {
  chartContextAllowed: boolean;
}) {
  return (
    <main className="ti-dashboard-bg min-h-screen px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="ti-panel p-6">
          <Link
            className="text-sm text-sky-300 hover:text-sky-200"
            href="/intelligence"
          >
            Back to Intelligence
          </Link>
          <p className="mt-4 text-xs font-semibold uppercase text-sky-300">
            Analytics
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-50 sm:text-4xl">
            Your analytics will appear after you upload a CSV
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
            Import your broker CSV first. Once trades are saved, this page will
            show your real results, timing, behavior, ticker stories, session
            stories, and{" "}
            {chartContextAllowed ? "chart evidence" : "execution evidence"}.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="ti-button-primary" href="/intelligence/upload-csv">
              Upload CSV
            </Link>
            <Link
              className="rounded-md border border-sky-900 bg-sky-950/20 px-4 py-2 text-sm font-semibold text-sky-200 hover:border-sky-500"
              href="/intelligence/analytics?demo=sample"
            >
              Preview demo analytics
            </Link>
          </div>
        </header>
      </div>
    </main>
  );
}

export default async function AnalyticsPage(props: {
  searchParams: Promise<{
    demo?: string | string[] | undefined;
    view?: string | string[] | undefined;
  }>;
}) {
  await requireTraderIntelligenceOwnerPageAccess("app/intelligence/analytics/page.tsx");
  const searchParams = await props.searchParams;
  const demoParam = Array.isArray(searchParams.demo)
    ? searchParams.demo[0]
    : searchParams.demo;
  const activeSection = normalizeAnalyticsSection(searchParams.view);
  const analyticsData = buildSavedOrSampleTraderAnalyticsViewModel({
    preferSample: demoParam === "sample",
  });
  const activeTier = readTraderIntelligenceTierFromEnv();
  const chartContextAllowed = canUseChartContext(activeTier);

  if (analyticsData.mode !== "saved" && demoParam !== "sample") {
    return <EmptyAnalyticsPage chartContextAllowed={chartContextAllowed} />;
  }

  const savedReviewQueue =
    analyticsData.mode === "saved"
      ? buildSavedReviewQueueReadModel({
          repository: analyticsData.repository,
          includeChartContext: chartContextAllowed,
          userId: analyticsData.userId,
        })
      : null;
  const importSourceCaution =
    analyticsData.mode === "saved"
      ? buildLatestSavedImportSourceCautionReadModel({
          repository: analyticsData.repository,
        })
      : null;
  const allTrades = filterCustomerSavedTrades(
    analyticsData.repository.listTrades(analyticsData.userId),
  );
  const decisionReviewSnapshots =
    analyticsData.mode === "saved"
      ? [
          ...new Set(
            allTrades
              .map((trade) => trade.importBatchId)
              .filter((batchId): batchId is string => Boolean(batchId)),
          ),
        ].flatMap((batchId) =>
          analyticsData.repository.listDecisionReviewSnapshotsForBatch(batchId),
        )
      : [];
  const chartTierEnabled =
    chartContextAllowed &&
    (analyticsData.mode === "sample" || decisionReviewSnapshots.length > 0);
  const chartContextSnapshots = chartContextAllowed
    ? decisionReviewSnapshots
    : [];
  const tradeThreadModel = buildSavedTradeThreadReadModel({
    decisionReviewSnapshots: chartContextSnapshots,
    report: analyticsData.viewModel.latestReport,
    source: analyticsData.mode === "saved" ? "saved_sqlite" : "sample",
    trades: allTrades,
  });
  const behaviorReport = buildAnalyticsBehaviorReport(tradeThreadModel, {
    includeChartContext: chartContextAllowed,
  });
  const tickerStoryPriority =
    tradeThreadModel.threads.find(
      (thread) => thread.storyKind === "profit_giveback",
    ) ??
    tradeThreadModel.threads.find(
      (thread) => thread.storyKind === "swing_transition",
    ) ??
    tradeThreadModel.threads.find(
      (thread) => thread.storyKind === "extended_same_day_hold",
    ) ??
    tradeThreadModel.threads.find(
      (thread) => thread.storyKind === "repeated_losing_attempts",
    ) ??
    tradeThreadModel.threads.find((thread) => thread.roundTripCount > 1) ??
    null;
  const chartEvidenceExamples = [...tradeThreadModel.threads]
    .filter((thread) => thread.marketContextFindingCount > 0)
    .sort((left, right) => {
      const leftPriority =
        left.marketContextRiskCount * 100 +
        left.marketContextReviewPromptCount * 25 +
        left.levelFindingCount * 10 +
        Math.abs(left.totalGrossRealizedPnl) +
        left.roundTripCount;
      const rightPriority =
        right.marketContextRiskCount * 100 +
        right.marketContextReviewPromptCount * 25 +
        right.levelFindingCount * 10 +
        Math.abs(right.totalGrossRealizedPnl) +
        right.roundTripCount;

      if (rightPriority !== leftPriority) {
        return rightPriority - leftPriority;
      }

      return left.symbol.localeCompare(right.symbol);
    })
    .slice(0, 4)
    .map((thread) => {
      const finding =
        thread.priorityMarketContextFindings[0] ??
        thread.marketContextFindings[0] ??
        null;

      return {
        action:
          finding?.reviewAction ??
          "Open the ticker story, then replay the executions before writing a rule.",
        detail: finding?.label ?? thread.primaryReviewQuestion,
        href: thread.href,
        label: `${thread.symbol} / ${thread.storyLabel}`,
        levelFindingCount: thread.levelFindingCount,
        pnl: thread.totalGrossRealizedPnl,
        promptCount: thread.marketContextReviewPromptCount,
        riskCount: thread.marketContextRiskCount,
        roundTripCount: thread.roundTripCount,
        strengthCount: thread.marketContextStrengthCount,
        symbol: thread.symbol,
      };
    });
  const tickerStorySummary = {
    chartEvidenceExamples,
    givebackThreadCount: tradeThreadModel.threads.filter(
      (thread) => thread.storyKind === "profit_giveback",
    ).length,
    marketContextFindingCount: tradeThreadModel.marketContextFindingCount,
    marketContextRiskCount: tradeThreadModel.marketContextRiskCount,
    marketContextReviewPromptCount:
      tradeThreadModel.marketContextReviewPromptCount,
    marketContextStrengthCount: tradeThreadModel.marketContextStrengthCount,
    addQualityFindingCount: tradeThreadModel.addQualityFindingCount,
    addQualityRiskCount: tradeThreadModel.addQualityRiskCount,
    addQualityReviewPromptCount: tradeThreadModel.addQualityReviewPromptCount,
    addQualityStrengthCount: tradeThreadModel.addQualityStrengthCount,
    exitLevelFindingCount: tradeThreadModel.exitLevelFindingCount,
    exitLevelRiskCount: tradeThreadModel.exitLevelRiskCount,
    exitLevelReviewPromptCount: tradeThreadModel.exitLevelReviewPromptCount,
    exitLevelStrengthCount: tradeThreadModel.exitLevelStrengthCount,
    threadWithExitLevelFindingCount:
      tradeThreadModel.threadWithExitLevelFindingCount,
    threadWithExitLevelRiskCount: tradeThreadModel.threadWithExitLevelRiskCount,
    threadWithExitLevelStrengthCount:
      tradeThreadModel.threadWithExitLevelStrengthCount,
    threadWithAddQualityFindingCount:
      tradeThreadModel.threadWithAddQualityFindingCount,
    multiRoundTripThreadCount: tradeThreadModel.multiRoundTripThreadCount,
    openReentryThreadCount: tradeThreadModel.threads.filter(
      (thread) => thread.storyKind === "open_reentry",
    ).length,
    postExitFindingCount: tradeThreadModel.postExitFindingCount,
    postExitRiskCount: tradeThreadModel.postExitRiskCount,
    postExitReviewPromptCount: tradeThreadModel.postExitReviewPromptCount,
    postExitStrengthCount: tradeThreadModel.postExitStrengthCount,
    postExitFindingThreadCount:
      tradeThreadModel.threadWithPostExitFindingCount,
    postExitRiskThreadCount: tradeThreadModel.threadWithPostExitRiskCount,
    postExitStrengthThreadCount:
      tradeThreadModel.threadWithPostExitStrengthCount,
    protectedProfitBeforeFadeFindingCount:
      tradeThreadModel.protectedProfitBeforeFadeFindingCount,
    protectedProfitBeforeFadeThreadCount:
      tradeThreadModel.threadWithProtectedProfitBeforeFadeFindingCount,
    priority: tickerStoryPriority
      ? {
          href: tickerStoryPriority.href,
          label: `${tickerStoryPriority.symbol} / ${tickerStoryPriority.storyLabel}`,
          pnl: tickerStoryPriority.totalGrossRealizedPnl,
          question: tickerStoryPriority.primaryReviewQuestion,
        }
      : null,
    repeatedLossThreadCount: tradeThreadModel.threads.filter(
      (thread) => thread.storyKind === "repeated_losing_attempts",
    ).length,
    swingThreadCount: tradeThreadModel.threads.filter(
      (thread) =>
        thread.storyKind === "swing_transition" ||
        thread.storyKind === "extended_same_day_hold",
    ).length,
    levelFindingCount: tradeThreadModel.levelFindingCount,
    threadWithLevelFindingCount: tradeThreadModel.threadWithLevelFindingCount,
    threadWithVolumeFindingCount:
      tradeThreadModel.threadWithVolumeFindingCount,
    threadWithVolumeRiskCount: tradeThreadModel.threadWithVolumeRiskCount,
    threadWithVolumeStrengthCount:
      tradeThreadModel.threadWithVolumeStrengthCount,
    volumeFindingCount: tradeThreadModel.volumeFindingCount,
    volumeRiskCount: tradeThreadModel.volumeRiskCount,
    volumeReviewPromptCount: tradeThreadModel.volumeReviewPromptCount,
    volumeStrengthCount: tradeThreadModel.volumeStrengthCount,
  };
  const sessionStoryPriority =
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
    tradeThreadModel.sessionStories[0] ??
    null;
  const sessionStorySummary = {
    greenToRedSessionCount: tradeThreadModel.greenToRedSessionCount,
    highTradeCountSessionCount: tradeThreadModel.highTradeCountSessionCount,
    sameSymbolManyAttemptsSessionCount:
      tradeThreadModel.sameSymbolManyAttemptsSessionCount,
    sessionStoryCount: tradeThreadModel.sessionStoryCount,
    priority: sessionStoryPriority
      ? {
          date: sessionStoryPriority.sessionDate,
          href: sessionStoryPriority.href,
          label: sessionStoryPriority.storyLabel,
          pnl: sessionStoryPriority.totalGrossRealizedPnl,
          prompt: sessionStoryPriority.reviewPrompt,
          tradeCount: sessionStoryPriority.tradeCount,
        }
      : null,
  };

  return (
    <AnalyticsClient
      chartTierEnabled={chartTierEnabled}
      initialSection={activeSection}
      initialViewModel={analyticsData.viewModel}
      savedReviewQueue={savedReviewQueue}
      importSourceCaution={importSourceCaution}
      isSamplePreview={analyticsData.mode === "sample"}
      behaviorReport={behaviorReport}
      tickerStorySummary={tickerStorySummary}
      sessionStorySummary={sessionStorySummary}
    />
  );
}
