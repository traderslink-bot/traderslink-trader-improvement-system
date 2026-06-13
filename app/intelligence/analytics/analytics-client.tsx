"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  AdvancedDisclosure,
  DashboardSideNav,
  EquityCurveChart,
  MetricCard,
  MixBar,
  OutcomeDonut,
  PnlCalendarGrid,
  SimpleBarChart,
  TradeOutcomeTape,
  WorkflowHandoffPanel,
  withPageAnchor,
} from "@/app/app-ui";
import { BehaviorReportPanel } from "@/app/behavior-report-panel";
import { SavedImportSourceCaution } from "@/app/saved-import-source-caution";
import { SavedReviewQueueSummary } from "@/app/saved-review-queue-summary";
import type { SavedImportSourceCautionReadModel } from "@/src/lib/trader-analytics/server/saved-import-source-caution";
import type { AnalyticsBehaviorReport } from "@/src/lib/trader-analytics/server/analytics-behavior-report";
import type { SavedReviewQueueReadModel } from "@/src/lib/trader-analytics/server/saved-review-queue";
import type {
  ProductTraderAnalyticsTradeRow,
  ProductTraderAnalyticsViewModel,
  SavedReportSnapshotCard,
  SavedTradeImportInbox,
  TraderAnalyticsDrillDown,
  TraderAnalyticsFilter,
  TraderAnalyticsMetricDelta,
  TraderAnalyticsProductizationViewModel,
  TraderAnalyticsStorageReadiness,
  TraderBehaviorStreak,
  TraderImprovementIntelligence,
  TraderImprovementVisual,
  TraderJournalPrompt,
  TraderMarketContextAddOnStatus,
  TraderProductIntelligenceViewModel,
  TraderProductPolishViewModel,
  TraderImportTrialExperienceViewModel,
  TraderReviewHabitLoopViewModel,
  TraderRuleComplianceSummary,
  TraderWeeklyReviewDashboard,
} from "@/src/lib/trader-analytics";

interface AnalyticsTickerStorySummary {
  addQualityFindingCount: number;
  addQualityRiskCount: number;
  addQualityReviewPromptCount: number;
  addQualityStrengthCount: number;
  chartEvidenceExamples: Array<{
    action: string;
    detail: string;
    href: string;
    label: string;
    levelFindingCount: number;
    pnl: number;
    promptCount: number;
    riskCount: number;
    roundTripCount: number;
    strengthCount: number;
    symbol: string;
  }>;
  exitLevelFindingCount: number;
  exitLevelRiskCount: number;
  exitLevelReviewPromptCount: number;
  exitLevelStrengthCount: number;
  givebackThreadCount: number;
  marketContextFindingCount: number;
  marketContextRiskCount: number;
  marketContextReviewPromptCount: number;
  marketContextStrengthCount: number;
  multiRoundTripThreadCount: number;
  openReentryThreadCount: number;
  postExitFindingCount: number;
  postExitFindingThreadCount: number;
  postExitRiskCount: number;
  postExitRiskThreadCount: number;
  postExitReviewPromptCount: number;
  postExitStrengthCount: number;
  postExitStrengthThreadCount: number;
  protectedProfitBeforeFadeFindingCount: number;
  protectedProfitBeforeFadeThreadCount: number;
  priority: {
    href: string;
    label: string;
    pnl: number;
    question: string;
  } | null;
  repeatedLossThreadCount: number;
  swingThreadCount: number;
  levelFindingCount: number;
  threadWithAddQualityFindingCount: number;
  threadWithExitLevelFindingCount: number;
  threadWithExitLevelRiskCount: number;
  threadWithExitLevelStrengthCount: number;
  threadWithLevelFindingCount: number;
  threadWithVolumeFindingCount: number;
  threadWithVolumeRiskCount: number;
  threadWithVolumeStrengthCount: number;
  volumeFindingCount: number;
  volumeRiskCount: number;
  volumeReviewPromptCount: number;
  volumeStrengthCount: number;
}

interface AnalyticsSessionStorySummary {
  greenToRedSessionCount: number;
  highTradeCountSessionCount: number;
  sameSymbolManyAttemptsSessionCount: number;
  sessionStoryCount: number;
  priority: {
    date: string;
    href: string;
    label: string;
    pnl: number;
    prompt: string;
    tradeCount: number;
  } | null;
}

function formatNumber(value: number | null, digits = 2): string {
  return typeof value === "number" ? value.toFixed(digits) : "n/a";
}

function formatSigned(value: number | null): string {
  if (typeof value !== "number") {
    return "n/a";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function formatPercent(value: number | null): string {
  return typeof value === "number" ? `${(value * 100).toFixed(1)}%` : "n/a";
}

function toneForPnl(value: number): string {
  return value >= 0 ? "text-emerald-300" : "text-rose-300";
}

function visualRows(
  rows: Array<
    Pick<
      ProductTraderAnalyticsTradeRow,
      "grossRealizedPnl" | "sessionDate" | "symbol" | "tradeIndex"
    > & { tradeId?: string }
  >,
) {
  return rows.map((row) => ({
    id: row.tradeId ?? `${row.symbol}-${row.tradeIndex}`,
    label: `${row.symbol} #${row.tradeIndex}`,
    pnl: row.grossRealizedPnl,
    sessionDate: row.sessionDate,
    symbol: row.symbol,
  }));
}

function outcome(
  row: ProductTraderAnalyticsTradeRow,
): "winner" | "loser" | "flat" {
  return row.grossRealizedPnl > 0
    ? "winner"
    : row.grossRealizedPnl < 0
      ? "loser"
      : "flat";
}

function filteredRows(
  rows: ProductTraderAnalyticsTradeRow[],
  filters: TraderAnalyticsFilter,
): ProductTraderAnalyticsTradeRow[] {
  return rows.filter((row) => {
    if (filters.symbol && row.symbol !== filters.symbol) {
      return false;
    }

    if (
      filters.tradeDirection &&
      row.tradeDirection !== filters.tradeDirection
    ) {
      return false;
    }

    if (filters.sessionBucket && row.sessionBucket !== filters.sessionBucket) {
      return false;
    }

    if (
      filters.entryHourEt !== undefined &&
      (typeof row.entryHourEt === "number" ? row.entryHourEt : null) !==
        filters.entryHourEt
    ) {
      return false;
    }

    if (filters.outcome && outcome(row) !== filters.outcome) {
      return false;
    }

    if (
      filters.lifecycle &&
      (row.isOpenPosition ? "open" : "closed") !== filters.lifecycle
    ) {
      return false;
    }

    return true;
  });
}

function TimeOfDayPanel({
  report,
}: {
  report: ProductTraderAnalyticsViewModel["latestReport"]["report"];
}) {
  const highestTotalSession =
    [...report.timeOfDay.entrySessionBuckets].sort(
      (left, right) => right.grossTotalRealizedPnl - left.grossTotalRealizedPnl,
    )[0] ?? null;
  const lowestTotalSession =
    [...report.timeOfDay.entrySessionBuckets].sort(
      (left, right) => left.grossTotalRealizedPnl - right.grossTotalRealizedPnl,
    )[0] ?? null;
  const highestTotalHour =
    [...report.timeOfDay.entryHoursEt].sort(
      (left, right) => right.grossTotalRealizedPnl - left.grossTotalRealizedPnl,
    )[0] ?? null;
  const outlierBucket =
    [...report.timeOfDay.entrySessionBuckets]
      .filter(
        (bucket) => bucket.conclusion.kind === "outlier_dominated_total",
      )
      .sort(
        (left, right) =>
          (right.largestAbsoluteTradeShareOfAbsolutePnl ?? 0) -
          (left.largestAbsoluteTradeShareOfAbsolutePnl ?? 0),
      )[0] ?? null;
  const cross = report.timeOfDay.crossSessionHolds;

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.45fr)]">
      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">Time Of Day</h2>
        <div className="mt-1 text-sm text-zinc-500">Eastern Time</div>
        <div className="mt-3 grid gap-2 text-sm text-zinc-400">
          <div>{report.timeOfDay.entryInsight}</div>
          <div>{report.timeOfDay.holdInsight}</div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {report.timeOfDay.entrySessionBuckets.slice(0, 5).map((bucket) => (
            <div key={bucket.id} className="border-t border-zinc-900 py-3">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                {bucket.label}
              </div>
              <div
                className={`mt-2 font-mono text-lg ${toneForPnl(bucket.grossTotalRealizedPnl)}`}
              >
                {formatSigned(bucket.grossTotalRealizedPnl)}
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                {bucket.tradeCount} trades /{" "}
                {formatPercent(bucket.grossWinRate)}
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                Avg {formatSigned(bucket.grossAverageRealizedPnl)} / Median{" "}
                {formatSigned(bucket.grossMedianRealizedPnl)}
              </div>
              <div className="mt-2 text-xs leading-5 text-zinc-500">
                {bucket.conclusion.summary}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">Hour And Holds</h2>
        <div className="mt-4 grid gap-3">
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Highest Total Session
            </div>
            <div className="mt-1 text-sm text-zinc-300">
              {highestTotalSession
                ? `${highestTotalSession.label} / ${formatSigned(highestTotalSession.grossTotalRealizedPnl)}`
                : "n/a"}
            </div>
          </div>
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Highest Total Hour
            </div>
            <div className="mt-1 text-sm text-zinc-300">
              {highestTotalHour
                ? `${highestTotalHour.label} / ${formatSigned(highestTotalHour.grossTotalRealizedPnl)}`
                : "n/a"}
            </div>
          </div>
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Lowest Total Session
            </div>
            <div className="mt-1 text-sm text-zinc-300">
              {lowestTotalSession
                ? `${lowestTotalSession.label} / ${formatSigned(lowestTotalSession.grossTotalRealizedPnl)}`
                : "n/a"}
            </div>
          </div>
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Outlier Check
            </div>
            <div className="mt-1 text-sm leading-6 text-zinc-300">
              {outlierBucket
                ? `${outlierBucket.label}: one trade explains ${formatPercent(outlierBucket.largestAbsoluteTradeShareOfAbsolutePnl)} of the absolute movement.`
                : "No session is dominated by one trade in this view."}
            </div>
          </div>
          <div className="border-t border-zinc-900 py-3 text-xs text-zinc-500">
            {cross.heldPremarketIntoOpenCount} pre-market to open /{" "}
            {cross.heldOpenIntoMiddayCount} open to midday /{" "}
            {cross.heldOvernightCount} overnight.
          </div>
          {report.timeOfDay.sampleSizeWarning ? (
            <div className="border-t border-zinc-900 py-3 text-xs text-amber-300">
              Small sample: use these as review prompts, not proof.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function TickerStoryAnalyticsPanel({
  chartTierEnabled,
  summary,
}: {
  chartTierEnabled: boolean;
  summary: AnalyticsTickerStorySummary;
}) {
  const handoffs = [
    {
      count: summary.exitLevelFindingCount,
      detail: `${summary.exitLevelRiskCount} risk, ${summary.exitLevelStrengthCount} strength, ${summary.exitLevelReviewPromptCount} prompt`,
      href: "/intelligence/trades/ticker-stories?storyFilter=levels#ticker-stories",
      label: "Open support/resistance exit reviews",
      tone:
        summary.exitLevelRiskCount > 0
          ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
          : summary.exitLevelStrengthCount > 0
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
            : "border-sky-500/30 bg-sky-500/10 text-sky-100",
    },
    {
      count: summary.volumeFindingCount,
      detail: `${summary.volumeRiskCount} risk, ${summary.volumeStrengthCount} strength, ${summary.volumeReviewPromptCount} prompt`,
      href: "/intelligence/trades/ticker-stories?storyFilter=volume#ticker-stories",
      label: "Open volume comparison stories",
      tone:
        summary.volumeRiskCount > 0
          ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
          : summary.volumeStrengthCount > 0
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
            : "border-sky-500/30 bg-sky-500/10 text-sky-100",
    },
    {
      count: summary.protectedProfitBeforeFadeFindingCount,
      detail: `${summary.protectedProfitBeforeFadeThreadCount} ticker stor${summary.protectedProfitBeforeFadeThreadCount === 1 ? "y" : "ies"}`,
      href: "/intelligence/trades/ticker-stories?storyFilter=protected_profit#ticker-stories",
      label: "Open protected-profit stories",
      tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
    },
    {
      count: summary.postExitFindingCount,
      detail: `${summary.postExitRiskCount} risk, ${summary.postExitStrengthCount} strength, ${summary.postExitReviewPromptCount} prompt`,
      href: "/intelligence/trades/ticker-stories?storyFilter=post_exit#ticker-stories",
      label: "Open after-exit review stories",
      tone:
        summary.postExitRiskCount > 0
          ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
          : summary.postExitStrengthCount > 0
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
            : "border-sky-500/30 bg-sky-500/10 text-sky-100",
    },
  ].filter((handoff) => chartTierEnabled && handoff.count > 0);
  const certifiedRiskCount = summary.marketContextRiskCount;
  const certifiedStrengthCount = summary.marketContextStrengthCount;
  const reviewPromptCount = summary.marketContextReviewPromptCount;

  return (
    <section
      className="ti-panel p-5"
      data-testid="analytics-ticker-story-panel"
      id="analytics-ticker-stories"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Ticker Story Analytics
          </h2>
          <div className="mt-1 max-w-3xl text-sm leading-6 text-zinc-500">
            Same-symbol re-entries are tracked separately from flat-to-flat P/L
            so you can see whether later attempts added profit, gave back
            profit, stayed open, or turned into swing exposure.
          </div>
        </div>
        <Link
          className="border border-sky-800 bg-sky-950/40 px-4 py-3 text-sm font-medium text-sky-100 transition hover:border-sky-400"
          href="/intelligence/trades/ticker-stories#ticker-stories"
        >
          Open ticker stories
        </Link>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          label="Ticker Stories"
          value={String(summary.multiRoundTripThreadCount)}
          detail="Same-symbol same-day re-entry groups"
          tone="info"
        />
        <MetricCard
          label="Gave Back Profit"
          value={String(summary.givebackThreadCount)}
          detail="Later attempts reduced earlier gains"
          tone={summary.givebackThreadCount > 0 ? "warning" : "default"}
        />
        <MetricCard
          label="Repeated Losses"
          value={String(summary.repeatedLossThreadCount)}
          detail="Later same-symbol attempts stayed red"
          tone={summary.repeatedLossThreadCount > 0 ? "danger" : "default"}
        />
        <MetricCard
          label="Open Re-entries"
          value={String(summary.openReentryThreadCount)}
          detail="Need closing executions before full review"
          tone={summary.openReentryThreadCount > 0 ? "warning" : "default"}
        />
        <MetricCard
          label="Hold Reviews"
          value={String(summary.swingThreadCount)}
          detail="Extended same-day or next-session holds"
          tone={summary.swingThreadCount > 0 ? "info" : "default"}
        />
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-md border border-sky-900/60 bg-sky-950/20 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-sky-300">
            How to read these stories
          </div>
          <div className="mt-2 text-sm leading-6 text-zinc-400">
            These are not extra trades. They group same-symbol re-entries so a
            trader can ask whether a later attempt protected profit, gave back
            profit, stayed open,
            {chartTierEnabled
              ? " or needs chart data before the lesson is written."
              : " or needs a saved execution replay before the lesson is written."}
          </div>
        </div>
        {chartTierEnabled ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              label="Chart Risks"
              value={String(certifiedRiskCount)}
              detail="Certified risks to inspect before writing a rule"
              tone={certifiedRiskCount > 0 ? "warning" : "default"}
            />
            <MetricCard
              label="Chart Strengths"
              value={String(certifiedStrengthCount)}
              detail="Certified strengths worth repeating"
              tone={certifiedStrengthCount > 0 ? "success" : "default"}
            />
            <MetricCard
              label="Needs Review"
              value={String(reviewPromptCount)}
              detail="Chart prompts waiting for enough context"
              tone={reviewPromptCount > 0 ? "info" : "default"}
            />
          </div>
        ) : null}
      </div>
      {chartTierEnabled ? (
        <div className="mt-3" id="analytics-chart-evidence">
          <AdvancedDisclosure
            summary="Show chart evidence counts"
            testId="analytics-ticker-story-evidence-counts"
          >
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <MetricCard
                label="Chart Findings"
                value={String(summary.marketContextFindingCount)}
                detail={`${summary.marketContextReviewPromptCount} prompt${summary.marketContextReviewPromptCount === 1 ? "" : "s"}, ${summary.levelFindingCount} level check${summary.levelFindingCount === 1 ? "" : "s"}`}
                tone={summary.marketContextFindingCount > 0 ? "info" : "default"}
              />
              <MetricCard
                label="Add Quality"
                value={String(summary.addQualityFindingCount)}
                detail={`${summary.addQualityRiskCount} risk, ${summary.addQualityStrengthCount} strength, ${summary.addQualityReviewPromptCount} prompt`}
                tone={
                  summary.addQualityRiskCount > 0
                    ? "warning"
                    : summary.addQualityStrengthCount > 0
                      ? "success"
                      : summary.addQualityFindingCount > 0
                        ? "info"
                        : "default"
                }
              />
              <MetricCard
                label="Chart Risks"
                value={String(summary.marketContextRiskCount)}
                detail="Level, add, exit, or profit-protection risks"
                tone={summary.marketContextRiskCount > 0 ? "warning" : "default"}
              />
              <MetricCard
                label="Chart Strengths"
                value={String(summary.marketContextStrengthCount)}
                detail="Chart evidence strengths worth repeating"
                tone={
                  summary.marketContextStrengthCount > 0 ? "success" : "default"
                }
              />
              <MetricCard
                label="After-Exit Review"
                value={String(summary.postExitFindingCount)}
                detail={`${summary.postExitRiskCount} risk, ${summary.postExitStrengthCount} strength, ${summary.postExitReviewPromptCount} prompt`}
                tone={
                  summary.postExitRiskCount > 0
                    ? "warning"
                    : summary.postExitStrengthCount > 0
                      ? "success"
                      : summary.postExitFindingThreadCount > 0
                        ? "info"
                        : "default"
                }
              />
              <MetricCard
                label="Protected Profit"
                value={String(summary.protectedProfitBeforeFadeFindingCount)}
                detail={`${summary.protectedProfitBeforeFadeThreadCount} ticker stor${summary.protectedProfitBeforeFadeThreadCount === 1 ? "y" : "ies"}`}
                tone={
                  summary.protectedProfitBeforeFadeFindingCount > 0
                    ? "success"
                    : "default"
                }
              />
              <MetricCard
                label="Support/Resistance Exits"
                value={String(summary.exitLevelFindingCount)}
                detail={`${summary.exitLevelRiskCount} risk, ${summary.exitLevelStrengthCount} strength, ${summary.exitLevelReviewPromptCount} prompt`}
                tone={
                  summary.exitLevelRiskCount > 0
                    ? "warning"
                    : summary.exitLevelStrengthCount > 0
                      ? "success"
                      : summary.exitLevelFindingCount > 0
                        ? "info"
                        : "default"
                }
              />
              <MetricCard
                label="Volume Evidence"
                value={String(summary.volumeFindingCount)}
                detail={`${summary.volumeRiskCount} risk, ${summary.volumeStrengthCount} strength, ${summary.volumeReviewPromptCount} prompt`}
                tone={
                  summary.volumeRiskCount > 0
                    ? "warning"
                    : summary.volumeStrengthCount > 0
                      ? "success"
                      : summary.volumeFindingCount > 0
                        ? "info"
                        : "default"
                }
              />
            </div>
          </AdvancedDisclosure>
        </div>
      ) : null}
      {handoffs.length > 0 ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {handoffs.map((handoff) => (
            <Link
              className={`border p-4 transition hover:border-sky-400 ${handoff.tone}`}
              href={handoff.href}
              key={handoff.label}
            >
              <div className="text-xs font-semibold uppercase tracking-wide opacity-80">
                What to open next
              </div>
              <div className="mt-2 text-sm font-semibold">{handoff.label}</div>
              <div className="mt-2 text-xs leading-5 opacity-80">
                {handoff.detail}
              </div>
            </Link>
          ))}
        </div>
      ) : null}
      {summary.priority ? (
        <div className="mt-4 border-t border-zinc-900 pt-4">
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Story to inspect next
          </div>
          <div className="mt-2 text-sm font-semibold text-zinc-100">
            {summary.priority.label} / {formatSigned(summary.priority.pnl)}
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-500">
            {summary.priority.question}
          </p>
          <Link
            className="mt-3 inline-flex text-sm text-sky-300 hover:text-sky-200"
            href={summary.priority.href}
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
  );
}

function SessionStoryAnalyticsPanel({
  summary,
}: {
  summary: AnalyticsSessionStorySummary;
}) {
  return (
    <section
      className="ti-panel p-5"
      data-testid="analytics-session-story-panel"
      id="analytics-session-stories"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Session Story Analytics
          </h2>
          <div className="mt-1 max-w-3xl text-sm leading-6 text-zinc-500">
            Session stories look across all saved trades from one trading day.
            They catch green-to-red days, many attempts on one ticker, high
            trade-count sessions, and open or overnight exposure.
          </div>
        </div>
        <Link
          className="border border-sky-800 bg-sky-950/40 px-4 py-3 text-sm font-medium text-sky-100 transition hover:border-sky-400"
          href="/intelligence/coach/session-stories"
        >
          Open session coach
        </Link>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <MetricCard
          label="Sessions Reviewed"
          value={String(summary.sessionStoryCount)}
          detail="Trading days with saved execution data"
          tone="info"
        />
        <MetricCard
          label="Green To Red"
          value={String(summary.greenToRedSessionCount)}
          detail="Session was positive before finishing red"
          tone={summary.greenToRedSessionCount > 0 ? "danger" : "default"}
        />
        <MetricCard
          label="Many Ticker Attempts"
          value={String(summary.sameSymbolManyAttemptsSessionCount)}
          detail="One ticker was traded repeatedly"
          tone={
            summary.sameSymbolManyAttemptsSessionCount > 0
              ? "warning"
              : "default"
          }
        />
        <MetricCard
          label="High Trade Count"
          value={String(summary.highTradeCountSessionCount)}
          detail="Many round trips or symbols in one session"
          tone={summary.highTradeCountSessionCount > 0 ? "warning" : "default"}
        />
      </div>
      {summary.priority ? (
        <div className="mt-4 border-t border-zinc-900 pt-4">
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Session to inspect next
          </div>
          <div className="mt-2 text-sm font-semibold text-zinc-100">
            {summary.priority.date} / {summary.priority.label} /{" "}
            {formatSigned(summary.priority.pnl)}
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-500">
            {summary.priority.prompt}
          </p>
          <Link
            className="mt-3 inline-flex text-sm text-sky-300 hover:text-sky-200"
            href={summary.priority.href}
          >
            Open the main ticker story from this session
          </Link>
        </div>
      ) : (
        <div className="mt-4 border-t border-zinc-900 pt-4 text-sm text-zinc-500">
          Save a broker CSV to build session stories from your own trades.
        </div>
      )}
    </section>
  );
}

function ChartEvidenceAnalyticsPanel({
  summary,
}: {
  summary: AnalyticsTickerStorySummary;
}) {
  return (
    <section
      className="ti-panel p-5"
      data-testid="analytics-chart-evidence-panel"
      id="analytics-chart-evidence"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Chart Evidence
          </h2>
          <div className="mt-1 max-w-3xl text-sm leading-6 text-zinc-500">
            These counts summarize saved chart findings. They stay separate
            from execution-only P/L, so chart data can support a review without
            pretending to know intent or giving trading instructions.
          </div>
        </div>
        <Link
          className="border border-sky-800 bg-sky-950/40 px-4 py-3 text-sm font-medium text-sky-100 transition hover:border-sky-400"
          href="/intelligence/review?queue=market_context_unavailable"
        >
          Open chart-data queue
        </Link>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Chart Findings"
          value={String(summary.marketContextFindingCount)}
          detail={`${summary.marketContextRiskCount} risk, ${summary.marketContextStrengthCount} strength, ${summary.marketContextReviewPromptCount} prompt`}
          tone={summary.marketContextFindingCount > 0 ? "info" : "default"}
        />
        <MetricCard
          label="Support/Resistance Exits"
          value={String(summary.exitLevelFindingCount)}
          detail={`${summary.exitLevelRiskCount} risk, ${summary.exitLevelStrengthCount} strength, ${summary.exitLevelReviewPromptCount} prompt`}
          tone={
            summary.exitLevelRiskCount > 0
              ? "warning"
              : summary.exitLevelStrengthCount > 0
                ? "success"
                : summary.exitLevelFindingCount > 0
                  ? "info"
                  : "default"
          }
        />
        <MetricCard
          label="Volume Evidence"
          value={String(summary.volumeFindingCount)}
          detail={`${summary.volumeRiskCount} risk, ${summary.volumeStrengthCount} strength, ${summary.volumeReviewPromptCount} prompt`}
          tone={
            summary.volumeRiskCount > 0
              ? "warning"
              : summary.volumeStrengthCount > 0
                ? "success"
                : summary.volumeFindingCount > 0
                  ? "info"
                  : "default"
          }
        />
        <MetricCard
          label="After-Exit Review"
          value={String(summary.postExitFindingCount)}
          detail={`${summary.postExitRiskCount} risk, ${summary.postExitStrengthCount} strength, ${summary.postExitReviewPromptCount} prompt`}
          tone={
            summary.postExitRiskCount > 0
              ? "warning"
              : summary.postExitStrengthCount > 0
                ? "success"
                : summary.postExitFindingThreadCount > 0
                  ? "info"
                  : "default"
          }
        />
        <MetricCard
          label="Add Quality"
          value={String(summary.addQualityFindingCount)}
          detail={`${summary.addQualityRiskCount} risk, ${summary.addQualityStrengthCount} strength, ${summary.addQualityReviewPromptCount} prompt`}
          tone={
            summary.addQualityRiskCount > 0
              ? "warning"
              : summary.addQualityStrengthCount > 0
                ? "success"
                : summary.addQualityFindingCount > 0
                  ? "info"
                  : "default"
          }
        />
        <MetricCard
          label="Protected Profit"
          value={String(summary.protectedProfitBeforeFadeFindingCount)}
          detail={`${summary.protectedProfitBeforeFadeThreadCount} ticker stor${summary.protectedProfitBeforeFadeThreadCount === 1 ? "y" : "ies"}`}
          tone={
            summary.protectedProfitBeforeFadeFindingCount > 0
              ? "success"
              : "default"
          }
        />
        <MetricCard
          label="Level Checks"
          value={String(summary.levelFindingCount)}
          detail={`${summary.threadWithLevelFindingCount} ticker stor${summary.threadWithLevelFindingCount === 1 ? "y" : "ies"} with level context`}
          tone={summary.levelFindingCount > 0 ? "info" : "default"}
        />
        <MetricCard
          label="Needs Review"
          value={String(summary.marketContextReviewPromptCount)}
          detail="Useful chart prompts that still need trader review"
          tone={summary.marketContextReviewPromptCount > 0 ? "info" : "default"}
        />
      </div>

      {summary.chartEvidenceExamples.length > 0 ? (
        <div
          className="mt-5 rounded-md border border-zinc-800 bg-zinc-950/35 p-4"
          data-testid="analytics-chart-evidence-examples"
        >
          <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Example Stories
              </div>
              <h3 className="mt-2 text-base font-semibold text-zinc-100">
                Open a ticker story before turning chart evidence into a rule.
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
                These are chart-backed review entry points from saved trades.
                Use them to find the right story, then confirm the lesson in
                the execution replay.
              </p>
            </div>
            <div className="inline-flex w-fit border border-zinc-800 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
              {summary.chartEvidenceExamples.length} examples
            </div>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {summary.chartEvidenceExamples.map((example) => (
              <Link
                className="block rounded-md border border-zinc-800 bg-zinc-950/45 p-4 transition hover:border-sky-500"
                href={example.href}
                key={`${example.symbol}-${example.href}`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-zinc-100">
                      {example.label}
                    </div>
                    <div className="mt-1 text-xs leading-5 text-zinc-500">
                      {example.roundTripCount} round trip
                      {example.roundTripCount === 1 ? "" : "s"} /{" "}
                      {example.levelFindingCount} level check
                      {example.levelFindingCount === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div
                    className={`font-mono text-sm ${
                      example.pnl >= 0 ? "text-emerald-300" : "text-rose-300"
                    }`}
                  >
                    {example.pnl >= 0 ? "+" : ""}
                    {example.pnl.toFixed(2)}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="rounded border border-rose-900/60 bg-rose-950/20 px-2 py-1 text-rose-200">
                    {example.riskCount} risk
                  </div>
                  <div className="rounded border border-emerald-900/60 bg-emerald-950/20 px-2 py-1 text-emerald-200">
                    {example.strengthCount} strength
                  </div>
                  <div className="rounded border border-amber-900/60 bg-amber-950/20 px-2 py-1 text-amber-200">
                    {example.promptCount} prompt
                  </div>
                </div>
                <div className="mt-3 text-sm font-medium text-zinc-200">
                  {example.detail}
                </div>
                <div className="mt-2 text-xs leading-5 text-sky-300">
                  Replay check: {example.action}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {[
          {
            body: "Use this when a level or volume finding changes how a trade should be reviewed.",
            href: "/intelligence/trades/ticker-stories?storyFilter=levels#ticker-stories",
            label: "Open level stories",
          },
          {
            body: "Use this when later re-entries had stronger or weaker participation.",
            href: "/intelligence/trades/ticker-stories?storyFilter=volume#ticker-stories",
            label: "Open volume stories",
          },
          {
            body: "Use this when exit context or post-exit movement changes the lesson.",
            href: "/intelligence/trades/ticker-stories?storyFilter=post_exit#ticker-stories",
            label: "Open after-exit stories",
          },
        ].map((item) => (
          <Link
            className="ti-panel-soft block p-4 transition hover:border-sky-500"
            href={item.href}
            key={item.label}
          >
            <div className="text-sm font-semibold text-zinc-100">
              {item.label}
            </div>
            <div className="mt-2 text-xs leading-5 text-zinc-500">
              {item.body}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ChartEvidenceTierGatePanel() {
  return (
    <section
      className="ti-panel p-5"
      data-testid="analytics-chart-evidence-tier-gate"
      id="analytics-chart-evidence"
    >
      <div className="max-w-3xl">
        <h2 className="text-sm font-semibold text-zinc-100">
          Chart Evidence
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          This view needs saved chart context. Execution analytics still show
          saved trades, P/L, timing, and behavior, but candle, support, and
          resistance summaries stay out of the report until real chart evidence
          exists.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            className="border border-sky-800 bg-sky-950/40 px-4 py-3 text-sm font-medium text-sky-100 transition hover:border-sky-400"
            href="/intelligence/analytics/results"
          >
            Open execution analytics
          </Link>
          <Link
            className="border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-medium text-zinc-200 transition hover:border-zinc-500"
            href="/intelligence/analytics/behavior"
          >
            Open behavior report
          </Link>
        </div>
      </div>
    </section>
  );
}

function AnalyticsStoryPanel({
  showSecondaryCharts = true,
  viewModel,
  savedReviewQueue,
}: {
  showSecondaryCharts?: boolean;
  viewModel: ProductTraderAnalyticsViewModel;
  savedReviewQueue?: SavedReviewQueueReadModel | null;
}) {
  const report = viewModel.latestReport.report;
  const charts = report.charts;
  const bestTrade =
    [...report.trades].sort(
      (left, right) => right.grossRealizedPnl - left.grossRealizedPnl,
    )[0] ?? null;
  const worstTrade =
    [...report.trades].sort(
      (left, right) => left.grossRealizedPnl - right.grossRealizedPnl,
    )[0] ?? null;
  const nextReview =
    savedReviewQueue?.items[0] ?? savedReviewQueue?.allItems[0] ?? null;
  const topRisk = report.topRisks[0] ?? null;
  const topStrength = report.topStrengths[0] ?? null;
  const tradeVisualRows = visualRows(report.trades);

  return (
    <section
      className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]"
      data-testid="analytics-story-panel"
      id="analytics-results"
    >
      <div className="ti-panel p-5">
        <p className="text-xs font-semibold uppercase text-emerald-400">
          Analytics Overview
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-50">
          What happened in this trade set?
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
          Read the account like a trading screen: green is progress, red is
          cost, and the next review should explain the biggest behavior behind
          the move.
        </p>
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_260px]">
          <EquityCurveChart
            formatter={formatSigned}
            rows={tradeVisualRows}
            subtitle={`${report.sampleSize.completedTradeCount} completed trades, gross execution P/L`}
            title="Gross P/L Curve"
          />
          <OutcomeDonut
            flat={report.pnl.grossFlatCount}
            losses={report.pnl.grossLoserCount}
            wins={report.pnl.grossWinnerCount}
          />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="ti-panel-soft p-4">
            <div className="text-xs uppercase text-zinc-500">Gross Result</div>
            <div
              className={`mt-2 font-mono text-2xl font-semibold ${toneForPnl(report.pnl.grossTotalRealizedPnl)}`}
            >
              {formatSigned(report.pnl.grossTotalRealizedPnl)}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {report.sampleSize.completedTradeCount} completed trades
            </div>
          </div>
          <div className="ti-panel-soft p-4">
            <div className="text-xs uppercase text-zinc-500">Best Trade</div>
            <div className="mt-2 text-sm font-semibold text-emerald-300">
              {bestTrade
                ? `${bestTrade.symbol} ${formatSigned(bestTrade.grossRealizedPnl)}`
                : "No winner yet"}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              strongest green result
            </div>
          </div>
          <div className="ti-panel-soft p-4">
            <div className="text-xs uppercase text-zinc-500">Worst Trade</div>
            <div className="mt-2 text-sm font-semibold text-rose-300">
              {worstTrade
                ? `${worstTrade.symbol} ${formatSigned(worstTrade.grossRealizedPnl)}`
                : "No loser yet"}
            </div>
            <div className="mt-1 text-xs text-zinc-500">biggest red cost</div>
          </div>
          <div className="ti-panel-soft p-4">
            <div className="text-xs uppercase text-zinc-500">Review First</div>
            <div className="mt-2 text-sm font-semibold text-zinc-100">
              {nextReview ? nextReview.title : "Save an import"}
            </div>
            <div className="mt-1 text-xs leading-5 text-zinc-500">
              {nextReview
                ? nextReview.nextAction
                : "Import one broker CSV to replace the sample analytics."}
            </div>
            <Link
              className="mt-3 inline-block text-sm text-sky-300 hover:text-sky-200"
              href={nextReview?.href ?? "/intelligence/upload-csv"}
            >
              {nextReview ? "Open Trade Review" : "Import trades"}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <TradeOutcomeTape
          formatter={formatSigned}
          rows={tradeVisualRows}
          title="Latest Trade Results"
        />
        <SimpleBarChart
          chart={charts.entrySessionPerformance}
          formatter={formatSigned}
          maxItems={5}
          title="Total P/L by Session"
        />
      </div>

      {showSecondaryCharts ? (
        <>
          <div className="grid gap-4 xl:col-span-2 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <PnlCalendarGrid
              formatter={formatSigned}
              rows={tradeVisualRows}
              title="Daily P/L Calendar"
            />
            <SimpleBarChart
              chart={charts.grossPnlByTrade}
              formatter={formatSigned}
              maxItems={8}
              title="P/L by Trade"
            />
          </div>
          <div className="grid gap-4 xl:col-span-2 xl:grid-cols-3">
            <MixBar chart={charts.winLossDonut} title="Outcome Mix" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:col-span-2">
            <div className="ti-panel p-5">
              <div className="text-xs uppercase text-zinc-500">
                Biggest Risk
              </div>
              <div className="mt-2 text-lg font-semibold text-rose-300">
                {topRisk?.label ?? "No repeated risk yet"}
              </div>
              <div className="mt-2 text-sm text-zinc-400">
                {topRisk
                  ? `${topRisk.count} occurrence(s). Review the red cost before adding new rules.`
                  : "Save more closed trades to see repeated behavior cost."}
              </div>
            </div>
            <div className="ti-panel p-5">
              <div className="text-xs uppercase text-zinc-500">
                Best Strength
              </div>
              <div className="mt-2 text-lg font-semibold text-emerald-300">
                {topStrength?.label ?? "No repeated strength yet"}
              </div>
              <div className="mt-2 text-sm text-zinc-400">
                {topStrength
                  ? `${topStrength.count} occurrence(s). This is the green behavior to repeat.`
                  : "Save more closed trades to see repeated strengths."}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

function ChartLegendStrip() {
  return (
    <div className="grid gap-3 text-sm md:grid-cols-3">
      {[
        {
          label: "Green",
          body: "Profit, strength, or a behavior worth repeating.",
          className: "border-emerald-900/70 bg-emerald-950/30 text-emerald-200",
        },
        {
          label: "Red",
          body: "Loss, risk, giveback, or a behavior to review first.",
          className: "border-rose-900/70 bg-rose-950/30 text-rose-200",
        },
        {
          label: "Amber",
          body: "Caution, incomplete context, or a review prompt.",
          className: "border-amber-900/70 bg-amber-950/30 text-amber-200",
        },
      ].map((item) => (
        <div
          className={`rounded-md border p-3 ${item.className}`}
          key={item.label}
        >
          <div className="text-xs font-semibold uppercase tracking-wide">
            {item.label}
          </div>
          <div className="mt-1 text-xs leading-5 text-zinc-300">
            {item.body}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChartSectionFrame({
  actionLabel,
  actionHref,
  body,
  children,
  eyebrow,
  title,
}: {
  actionLabel?: string;
  actionHref?: string;
  body: ReactNode;
  children: ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="ti-panel p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-zinc-50">{title}</h2>
          <div className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            {body}
          </div>
        </div>
        {actionLabel && actionHref ? (
          <Link
            className="inline-flex items-center justify-center rounded-md border border-sky-800 bg-sky-950/40 px-4 py-3 text-sm font-medium text-sky-100 transition hover:border-sky-400"
            href={actionHref}
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function AnalyticsChartGalleryPanel({
  tradeExplorerHref,
  viewModel,
}: {
  tradeExplorerHref: string;
  viewModel: ProductTraderAnalyticsViewModel;
}) {
  const report = viewModel.latestReport.report;
  const charts = report.charts;

  return (
    <div className="grid gap-6">
      <section className="ti-panel p-5" id="chart-workbench">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-sky-300">
              Timing Workbench
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-50">
              When did the results happen?
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
              Use this page for session, entry-hour, and time-of-day context.
              Results live in the Results page, and behavior review lives in
              the Behavior page.
            </p>
          </div>
          <div className="rounded-md border border-zinc-700 bg-slate-900/70 px-3 py-2 font-mono text-sm text-zinc-300">
            {report.sampleSize.completedTradeCount} trades
          </div>
        </div>
        <div className="mt-5">
          <ChartLegendStrip />
        </div>
      </section>

      <WorkflowHandoffPanel
        body="Use this flow when a time bucket catches your eye: inspect the timing pattern, open the trades behind it, write the review, then check whether the coach focus changes."
        eyebrow="Timing Workflow"
        items={[
          {
            action: "Stay in charts",
            body: "Check whether the session or hour is a real pattern or just one large trade.",
            href: "#chart-workbench",
            label: "1. Inspect",
            title: "Read the time bucket",
          },
          {
            action: "Open review",
            body: "Turn the chart into a written trade review instead of just a statistic.",
            href: "/intelligence/review?queue=highest_priority",
            label: "2. Review",
            title: "Open the review queue",
            tone: "warning",
          },
          {
            action: "Open coach",
            body: "See whether the same behavior becomes the current coaching focus.",
            href: "/intelligence/coach",
            label: "3. Coach",
            title: "Compare against the focus",
            tone: "success",
          },
          {
            action: "Check progress",
            body: "Use progress only after reviews are written and tracked.",
            href: "/intelligence/progress#progress-follow-through",
            label: "4. Track",
            title: "Measure follow-through",
          },
        ]}
        testId="analytics-chart-workflow"
        title="Timing charts should lead to a review, not stop at a number."
      />

      <ChartSectionFrame
        actionLabel="Open trade explorer"
        actionHref={tradeExplorerHref}
        body="Timing charts show where dollars were made or lost. Check average, median, win rate, and outlier notes before treating a session as a repeat pattern."
        eyebrow="Timing"
        title="When did the results happen?"
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <SimpleBarChart
            chart={charts.entrySessionPerformance}
            formatter={formatSigned}
            maxItems={8}
            title="Total P/L by Session"
          />
          <SimpleBarChart
            chart={charts.entryHourPerformance}
            formatter={formatSigned}
            maxItems={10}
            title="P/L by Entry Hour"
          />
        </div>
        <div className="mt-4">
          <TimeOfDayPanel report={report} />
        </div>
      </ChartSectionFrame>
    </div>
  );
}

function StorageReadinessPanel({
  readiness,
}: {
  readiness: TraderAnalyticsStorageReadiness;
}) {
  return (
    <section className="border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Storage Status
          </h2>
          <div className="mt-1 text-sm text-zinc-500">{readiness.label}</div>
        </div>
        <div
          className={`font-mono text-xs ${
            readiness.readyForProductionPersistence
              ? "text-emerald-300"
              : "text-amber-300"
          }`}
        >
          {readiness.blockerCount} blockers
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        {readiness.checks.map((check) => (
          <div
            key={check.id}
            className="flex items-center justify-between gap-3 border-t border-zinc-900 py-2"
          >
            <span className="text-xs text-zinc-400">{check.label}</span>
            <span
              className={`font-mono text-xs ${
                check.passed ? "text-emerald-300" : "text-amber-300"
              }`}
            >
              {check.passed ? "pass" : "needed"}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-zinc-500">{readiness.nextAction}</div>
    </section>
  );
}

function WeeklyReviewPanel({
  weeklyReview,
}: {
  weeklyReview: TraderWeeklyReviewDashboard;
}) {
  return (
    <section className="border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Weekly Review</h2>
          <div className="mt-1 text-sm text-zinc-500">{weeklyReview.label}</div>
        </div>
        <div
          className={`font-mono text-xl ${toneForPnl(weeklyReview.grossTotalRealizedPnl)}`}
        >
          {formatSigned(weeklyReview.grossTotalRealizedPnl)}
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="border-t border-zinc-900 py-3">
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Trades
          </div>
          <div className="mt-2 text-xl font-semibold text-zinc-100">
            {weeklyReview.completedTradeCount}
          </div>
        </div>
        <div className="border-t border-zinc-900 py-3">
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Top Risk
          </div>
          <div className="mt-2 text-sm text-amber-300">
            {weeklyReview.topRiskLabel ?? "None"}
          </div>
        </div>
        <div className="border-t border-zinc-900 py-3">
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Top Strength
          </div>
          <div className="mt-2 text-sm text-emerald-300">
            {weeklyReview.topStrengthLabel ?? "None"}
          </div>
        </div>
        <div className="border-t border-zinc-900 py-3">
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Rule Violations
          </div>
          <div className="mt-2 text-xl font-semibold text-zinc-100">
            {weeklyReview.ruleViolationCount}
          </div>
        </div>
      </div>
      <div className="mt-3 border-t border-zinc-900 pt-3 text-sm text-zinc-400">
        {weeklyReview.primaryFocusTitle ?? "No primary focus yet."}
      </div>
    </section>
  );
}

function ImportInboxPanel({ inbox }: { inbox: SavedTradeImportInbox }) {
  return (
    <section className="border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Import Review Inbox
          </h2>
          <div className="mt-1 text-sm text-zinc-500">{inbox.batchId}</div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-right font-mono text-xs">
          <span className="text-emerald-300">{inbox.readyCount} ready</span>
          <span className="text-amber-300">
            {inbox.needsReviewCount} review
          </span>
          <span className="text-rose-300">{inbox.rejectedCount} reject</span>
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        {inbox.items.slice(0, 5).map((item) => (
          <div
            key={item.id}
            className="grid gap-2 border-t border-zinc-900 py-2 md:grid-cols-[80px_120px_1fr_140px]"
          >
            <div className="font-mono text-xs text-zinc-500">
              #{item.requestIndex + 1}
            </div>
            <div className="text-sm text-zinc-200">
              {item.symbol ?? "Unknown"}
            </div>
            <div className="text-xs text-zinc-500">
              {item.messages[0] ?? "Ready for saved analytics."}
            </div>
            <div
              className={`text-xs ${
                item.status === "ready_to_save"
                  ? "text-emerald-300"
                  : item.status === "needs_review"
                    ? "text-amber-300"
                    : "text-rose-300"
              }`}
            >
              {item.primaryAction}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SnapshotPanel({
  snapshots,
}: {
  snapshots: SavedReportSnapshotCard[];
}) {
  return (
    <section className="border border-zinc-800 bg-zinc-950 p-4">
      <h2 className="text-sm font-semibold text-zinc-100">Saved Snapshots</h2>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {snapshots.slice(0, 6).map((snapshot) => (
          <div key={snapshot.id} className="border-t border-zinc-900 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-zinc-100">
                {snapshot.label}
              </span>
              <span
                className={`font-mono text-xs ${toneForPnl(snapshot.grossTotalRealizedPnl)}`}
              >
                {formatSigned(snapshot.grossTotalRealizedPnl)}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-zinc-500">
              <span>{snapshot.completedTradeCount} trades</span>
              <span>{formatPercent(snapshot.grossWinRate)}</span>
              <span>{snapshot.noteCount} notes</span>
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              {snapshot.generatedAt}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BehaviorStreaksPanel({
  streaks,
}: {
  streaks: TraderBehaviorStreak[];
}) {
  const max = Math.max(...streaks.map((streak) => streak.currentCount), 1);

  return (
    <section className="border border-zinc-800 bg-zinc-950 p-4">
      <h2 className="text-sm font-semibold text-zinc-100">Behavior Streaks</h2>
      <div className="mt-4 grid gap-3">
        {streaks.map((streak) => (
          <div key={streak.id} className="border-t border-zinc-900 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-zinc-300">{streak.label}</span>
              <span className="font-mono text-sm text-zinc-100">
                {streak.currentCount}
              </span>
            </div>
            <div className="mt-2 h-2 bg-zinc-900">
              <div
                className={`h-2 ${
                  streak.status === "active" ? "bg-emerald-400" : "bg-zinc-700"
                }`}
                style={{
                  width: `${Math.max((streak.currentCount / max) * 100, 4)}%`,
                }}
              />
            </div>
            <div className="mt-2 text-xs text-zinc-500">{streak.summary}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function JournalPromptsPanel({ prompts }: { prompts: TraderJournalPrompt[] }) {
  return (
    <section className="border border-zinc-800 bg-zinc-950 p-4">
      <h2 className="text-sm font-semibold text-zinc-100">Journal Prompts</h2>
      <div className="mt-4 grid gap-3">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              {prompt.label}
            </div>
            <div className="mt-2 text-sm text-zinc-300">{prompt.prompt}</div>
            <div className="mt-2 font-mono text-xs text-zinc-500">
              {prompt.relatedTradeIds.length} linked trades
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RuleCompliancePanel({
  summary,
}: {
  summary: TraderRuleComplianceSummary;
}) {
  return (
    <div className="border-t border-zinc-900 py-3">
      <div className="grid gap-3 md:grid-cols-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Passing Rules
          </div>
          <div className="mt-2 text-xl font-semibold text-emerald-300">
            {summary.passingRules}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Violated Rules
          </div>
          <div className="mt-2 text-xl font-semibold text-amber-300">
            {summary.violatedRules}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Violations
          </div>
          <div className="mt-2 text-xl font-semibold text-zinc-100">
            {summary.totalViolations}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Worst Rule
          </div>
          <div className="mt-2 text-sm text-zinc-300">
            {summary.worstViolation?.label ?? "None"}
          </div>
        </div>
      </div>
      <div className="mt-3 text-sm text-zinc-500">{summary.summary}</div>
    </div>
  );
}

function MarketContextPanel({
  status,
}: {
  status: TraderMarketContextAddOnStatus;
}) {
  return (
    <section className="border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Chart Data Status
          </h2>
          <div className="mt-1 text-sm text-zinc-500">
            {status.calibrationStatus}
          </div>
        </div>
        <div className="font-mono text-xs text-sky-300">
          {status.usedForExecutionAnalytics ? "active" : "separate"}
        </div>
      </div>
      <div className="mt-4 text-sm text-zinc-400">{status.summary}</div>
      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {status.sources.map((source) => (
          <div
            key={source}
            className="border-t border-zinc-900 py-2 text-xs text-zinc-500"
          >
            {source}
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-zinc-500">{status.nextAction}</div>
    </section>
  );
}

function ProductizationPanel({
  productization,
}: {
  productization: TraderAnalyticsProductizationViewModel;
}) {
  const workspace = productization.workspace;
  const permissions = productization.permissionSummary;

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">Workspace Scope</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Workspace
            </div>
            <div className="mt-2 text-sm text-zinc-200">
              {workspace.workspaceName}
            </div>
          </div>
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Account
            </div>
            <div className="mt-2 text-sm text-zinc-200">
              {workspace.activeAccountLabel}
            </div>
          </div>
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Role
            </div>
            <div className="mt-2 text-sm text-zinc-200">
              {workspace.userRole}
            </div>
          </div>
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Mode
            </div>
            <div className="mt-2 text-sm text-amber-300">
              {workspace.persistenceMode}
            </div>
          </div>
        </div>
        <div className="mt-3 text-xs text-zinc-500">{workspace.nextAction}</div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">
          Permission Split
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Product
            </div>
            <div className="mt-2 text-xl font-semibold text-zinc-100">
              {permissions.productionRouteCount}
            </div>
          </div>
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Admin
            </div>
            <div className="mt-2 text-xl font-semibold text-zinc-100">
              {permissions.adminDebugRouteCount}
            </div>
          </div>
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Export
            </div>
            <div className="mt-2 text-sm text-emerald-300">
              {permissions.endUserExportAllowed ? "allowed" : "blocked"}
            </div>
          </div>
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Raw JSON
            </div>
            <div className="mt-2 text-sm text-emerald-300">
              {permissions.rawJsonRestrictedToAdmin ? "admin only" : "review"}
            </div>
          </div>
        </div>
        <div className="mt-3 text-xs text-zinc-500">
          {permissions.issues.length === 0
            ? "No production route permission issues detected."
            : permissions.issues[0]}
        </div>
      </div>
    </section>
  );
}

function IntelligencePanel({
  intelligence,
}: {
  intelligence: TraderProductIntelligenceViewModel;
}) {
  const topCost = intelligence.mistakeCostEstimates.topCostDriver;
  const overall = intelligence.scorecard.dimensions.find(
    (dimension) => dimension.id === "overall",
  );

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Execution Score Trend
            </h2>
            <div className="mt-1 text-sm text-zinc-500">
              {intelligence.scorecard.summary}
            </div>
          </div>
          <div className="font-mono text-2xl text-sky-300">
            {overall?.score ?? 0}/100
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {intelligence.scorecard.dimensions
            .filter((dimension) => dimension.id !== "overall")
            .map((dimension) => (
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

      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">
          Mistake Cost Estimate
        </h2>
        <div className="mt-4 font-mono text-2xl text-rose-300">
          $
          {intelligence.mistakeCostEstimates.totalEstimatedGrossCost.toFixed(2)}
        </div>
        <div className="mt-2 text-sm text-zinc-500">
          {topCost
            ? `${topCost.label}: $${topCost.estimatedGrossCost.toFixed(2)} across ${topCost.affectedTradeCount} trades.`
            : "No repeated gross-loss cost driver is visible yet."}
        </div>
        <div className="mt-4 grid gap-2">
          {intelligence.mistakeCostEstimates.items.slice(0, 3).map((item) => (
            <div
              key={item.taxonomyId}
              className="flex items-center justify-between gap-3 border-t border-zinc-900 py-2"
            >
              <span className="text-xs text-zinc-400">{item.label}</span>
              <span className="font-mono text-xs text-zinc-500">
                ${item.estimatedGrossCost.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-4 xl:col-span-2">
        <div className="grid gap-6 xl:grid-cols-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Recurrence Alerts
            </h2>
            <div className="mt-4 grid gap-3">
              {intelligence.recurrenceAlerts.slice(0, 4).map((alert) => (
                <div key={alert.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{alert.title}</span>
                    <span className="font-mono text-xs text-zinc-500">
                      {alert.occurrenceCount}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {alert.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Rule Builder
            </h2>
            <div className="mt-4 grid gap-3">
              {intelligence.ruleBuilderRecommendations
                .slice(0, 4)
                .map((item) => (
                  <div key={item.id} className="border-t border-zinc-900 py-3">
                    <div className="text-sm text-zinc-300">{item.label}</div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {item.reason}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Unified Review Queue
            </h2>
            <div className="mt-4 grid gap-3">
              {intelligence.unifiedReviewQueue.items.slice(0, 5).map((item) => (
                <div key={item.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{item.title}</span>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">
                      {item.lane}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {item.nextAction}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function visualToneClass(tone: string): string {
  switch (tone) {
    case "positive":
      return "bg-emerald-400 text-emerald-300";
    case "negative":
      return "bg-rose-400 text-rose-300";
    case "warning":
      return "bg-amber-400 text-amber-300";
    case "info":
      return "bg-sky-400 text-sky-300";
    default:
      return "bg-zinc-500 text-zinc-300";
  }
}

function MiniVisual({
  visual,
  maxItems = 5,
}: {
  visual: TraderImprovementVisual;
  maxItems?: number;
}) {
  const max = Math.max(...visual.items.map((item) => item.value), 1);

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {visual.title}
      </h3>
      <div className="mt-3 grid gap-2">
        {visual.items.slice(0, maxItems).map((item) => {
          const tone = visualToneClass(item.tone);

          return (
            <div key={item.id} className="border-t border-zinc-900 py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-xs text-zinc-300">
                  {item.label}
                </span>
                <span className={`font-mono text-xs ${tone.split(" ")[1]}`}>
                  {item.value.toFixed(item.value % 1 === 0 ? 0 : 1)}
                </span>
              </div>
              <div className="mt-2 h-1.5 bg-zinc-900">
                <div
                  className={`h-1.5 ${tone.split(" ")[0]}`}
                  style={{
                    width: `${Math.max((item.value / max) * 100, 4)}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ImprovementIntelligencePanel({
  improvement,
}: {
  improvement: TraderImprovementIntelligence;
}) {
  const coach = improvement.dailyCoachReport;
  const patterns = improvement.bestWorstPatterns;

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Daily Coach Report
            </h2>
            <div className="mt-1 text-sm text-zinc-500">
              {coach.sessionDate} / execution-only conclusions
            </div>
          </div>
          <div className="font-mono text-sm text-sky-300">
            {coach.tradeCount} trades
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
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
          <div className="border-t border-zinc-900 py-3 md:col-span-2">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Session Timing
            </div>
            <div className="mt-2 text-sm text-sky-200">
              {coach.sessionTimeInsight}
            </div>
          </div>
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Best Trade
            </div>
            <div className="mt-2 text-sm text-zinc-300">
              {coach.bestTrade ? (
                <Link
                  className="text-sky-300 hover:text-sky-200"
                  href={withPageAnchor(
                    `/intelligence/trades/${encodeURIComponent(coach.bestTrade.tradeId)}`,
                    "summary",
                  )}
                >
                  {coach.bestTrade.symbol} /{" "}
                  {formatSigned(coach.bestTrade.grossRealizedPnl)}
                </Link>
              ) : (
                "n/a"
              )}
            </div>
          </div>
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Worst Trade
            </div>
            <div className="mt-2 text-sm text-zinc-300">
              {coach.worstTrade ? (
                <Link
                  className="text-sky-300 hover:text-sky-200"
                  href={withPageAnchor(
                    `/intelligence/trades/${encodeURIComponent(coach.worstTrade.tradeId)}`,
                    "summary",
                  )}
                >
                  {coach.worstTrade.symbol} /{" "}
                  {formatSigned(coach.worstTrade.grossRealizedPnl)}
                </Link>
              ) : (
                "n/a"
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">
          Best / Worst Finder
        </h2>
        <div className="mt-4 grid gap-3">
          {[
            patterns.bestPerformingCluster,
            patterns.worstPerformingCluster,
            patterns.highestCostMistake,
            patterns.mostRepeatedMistake,
            patterns.mostPromisingStrength,
          ]
            .filter((item) => item !== null)
            .map((item) => (
              <div key={item.id} className="border-t border-zinc-900 py-3">
                <div className="text-sm text-zinc-300">{item.label}</div>
                <div className="mt-1 text-xs text-zinc-500">{item.detail}</div>
              </div>
            ))}
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-4 xl:col-span-2">
        <div className="grid gap-6 lg:grid-cols-3">
          <MiniVisual visual={improvement.visuals.qualityByTrade} />
          <MiniVisual visual={improvement.visuals.mistakeFrequency} />
          <MiniVisual visual={improvement.visuals.executionCountBuckets} />
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-4 xl:col-span-2">
        <h2 className="text-sm font-semibold text-zinc-100">
          Playbook Readiness
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {improvement.playbookBuckets.map((bucket) => (
            <div key={bucket.id} className="border-t border-zinc-900 py-3">
              <div className="text-sm text-zinc-300">{bucket.label}</div>
              <div className="mt-2 font-mono text-xs text-zinc-500">
                {bucket.tradeCount} trades / quality{" "}
                {bucket.averageQualityScore?.toFixed(1) ?? "n/a"}
              </div>
              <div
                className={`mt-1 font-mono text-xs ${toneForPnl(bucket.grossTotalRealizedPnl)}`}
              >
                {formatSigned(bucket.grossTotalRealizedPnl)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductPolishPanel({
  polish,
}: {
  polish: TraderProductPolishViewModel;
}) {
  const queue = polish.coachReviewQueue;
  const importExperience = polish.firstImportExperience;
  const trend = polish.executionQualityTrendline;

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Coach Review Queue
            </h2>
            <div className="mt-1 text-sm text-zinc-500">
              {queue.primaryItem?.nextAction ?? "No coach queue item yet."}
            </div>
          </div>
          <Link
            className="text-sm text-sky-300 hover:text-sky-200"
            href="/intelligence/coach"
          >
            Open coach
          </Link>
        </div>
        <div className="mt-4 grid gap-3">
          {queue.items.slice(0, 5).map((item) => (
            <Link
              key={item.id}
              className="block border-t border-zinc-900 py-3 hover:text-sky-200"
              href={item.href}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-zinc-300">{item.title}</span>
                <span className="text-xs uppercase tracking-wide text-zinc-500">
                  {item.lane}
                </span>
              </div>
              <div className="mt-1 text-xs text-zinc-500">{item.reason}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">
          First Import Experience
        </h2>
        <div className="mt-2 text-sm text-zinc-500">
          {importExperience.headline}
        </div>
        <div className="mt-4 grid gap-2">
          {importExperience.steps.slice(0, 6).map((step) => (
            <div key={step.id} className="border-t border-zinc-900 py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-zinc-300">{step.label}</span>
                <span className="text-xs uppercase tracking-wide text-zinc-500">
                  {step.status}
                </span>
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                {step.nextAction}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-4 xl:col-span-2">
        <div className="grid gap-6 lg:grid-cols-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Evidence Cards
            </h2>
            <div className="mt-4 grid gap-3">
              {polish.evidenceCards.slice(0, 5).map((card) => (
                <Link
                  key={card.id}
                  className="block border-t border-zinc-900 py-3 hover:text-sky-200"
                  href={
                    card.primaryRoute.startsWith("/intelligence/trades/")
                      ? withPageAnchor(card.primaryRoute, "evidence")
                      : card.primaryRoute
                  }
                >
                  <div className="text-sm text-zinc-300">{card.title}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {card.confidenceCopy}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Pattern Memory
            </h2>
            <div className="mt-4 grid gap-3">
              {polish.personalPatternMemory.items.slice(0, 5).map((item) => (
                <div key={item.id} className="border-t border-zinc-900 py-3">
                  <div className="text-sm text-zinc-300">{item.label}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {item.kind} / {item.confidence}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Quality Trendline
            </h2>
            <div className="mt-1 text-xs text-zinc-500">
              {trend.reportTrendSummary}
            </div>
            <div className="mt-4 grid gap-2">
              {trend.points.slice(0, 7).map((point) => (
                <Link
                  key={point.tradeId}
                  className="block border-t border-zinc-900 py-2"
                  href={withPageAnchor(
                    `/intelligence/trades/${encodeURIComponent(point.tradeId)}`,
                    "writing-flow",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-zinc-300">{point.label}</span>
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
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewHabitLoopPanel({
  habit,
}: {
  habit: TraderReviewHabitLoopViewModel;
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.45fr)]">
      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Review Habit Loop
            </h2>
            <div className="mt-1 text-sm text-zinc-500">
              {habit.reviewHabitTracker.nextHabitAction}
            </div>
          </div>
          <div className="font-mono text-xl text-sky-300">
            {habit.reviewHabitTracker.completionPct}%
          </div>
        </div>
        <div className="mt-4 grid gap-3">
          {habit.reviewHabitTracker.metrics.map((metric) => (
            <div key={metric.id} className="border-t border-zinc-900 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-zinc-300">{metric.label}</span>
                <span className="font-mono text-xs text-zinc-500">
                  {metric.value}/{metric.target}
                </span>
              </div>
              <div className="mt-1 text-xs text-zinc-500">{metric.detail}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">Rule To Create</h2>
        <div className="mt-1 text-sm text-zinc-500">
          {habit.mistakeRuleConversion.nextAction}
        </div>
        <div className="mt-4 grid gap-3">
          {habit.mistakeRuleConversion.drafts.slice(0, 4).map((draft) => (
            <Link
              key={draft.id}
              className="block border-t border-zinc-900 py-3 hover:text-sky-200"
              href={
                draft.affectedTradeIds[0]
                  ? withPageAnchor(
                      `/intelligence/trades/${encodeURIComponent(draft.affectedTradeIds[0])}`,
                      "writing-flow",
                    )
                  : "/intelligence/coach"
              }
            >
              <div className="text-sm text-zinc-300">
                {draft.suggestedRuleTitle}
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                {draft.readiness} / {draft.affectedTradeIds.length} trades
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReconciliationJobsPanel({
  productization,
}: {
  productization: TraderAnalyticsProductizationViewModel;
}) {
  const reconciliation = productization.reconciliation;
  const jobs = productization.jobQueue;

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">
          Import Reconciliation
        </h2>
        <div className="mt-4 grid grid-cols-4 gap-3 text-xs">
          <span className="font-mono text-emerald-300">
            {reconciliation.readyCount} ready
          </span>
          <span className="font-mono text-amber-300">
            {reconciliation.needsReviewCount} review
          </span>
          <span className="font-mono text-sky-300">
            {reconciliation.duplicateCount} duplicate
          </span>
          <span className="font-mono text-rose-300">
            {reconciliation.rejectedCount} rejected
          </span>
        </div>
        <div className="mt-4 grid gap-2">
          {reconciliation.items.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="grid gap-2 border-t border-zinc-900 py-2 md:grid-cols-[70px_100px_1fr]"
            >
              <div className="font-mono text-xs text-zinc-500">
                #{item.requestIndex + 1}
              </div>
              <div className="text-xs text-zinc-300">{item.status}</div>
              <div className="text-xs text-zinc-500">
                {item.recommendedAction}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">Analysis Jobs</h2>
        <div className="mt-4 grid grid-cols-4 gap-3 text-xs">
          <span className="font-mono text-sky-300">
            {jobs.queuedCount} queued
          </span>
          <span className="font-mono text-zinc-300">
            {jobs.completedCount} done
          </span>
          <span className="font-mono text-amber-300">
            {jobs.needsUserFixCount} fix
          </span>
          <span className="font-mono text-rose-300">
            {jobs.failedCount} failed
          </span>
        </div>
        <div className="mt-4 grid gap-2">
          {jobs.jobs.slice(0, 4).map((job) => (
            <div key={job.id} className="border-t border-zinc-900 py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-zinc-300">
                  {job.symbol ?? "Unknown"}
                </span>
                <span className="font-mono text-xs text-zinc-500">
                  {job.status}
                </span>
              </div>
              <div className="mt-1 text-xs text-zinc-500">{job.nextAction}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowActionPlanPanel({
  productization,
}: {
  productization: TraderAnalyticsProductizationViewModel;
}) {
  const workflow = productization.reviewWorkflow;
  const actionPlan = productization.actionPlan;

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">Review Workflow</h2>
        <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
          <span className="font-mono text-amber-300">
            {workflow.needsReviewCount} review
          </span>
          <span className="font-mono text-emerald-300">
            {workflow.lessonCapturedCount} lessons
          </span>
          <span className="font-mono text-sky-300">
            {workflow.ruleCreatedCount} rules
          </span>
        </div>
        <div className="mt-4 grid gap-2">
          {workflow.items.slice(0, 4).map((item) => (
            <div key={item.id} className="border-t border-zinc-900 py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-zinc-300">{item.title}</span>
                <span className="font-mono text-xs text-zinc-500">
                  {item.status}
                </span>
              </div>
              <div className="mt-1 text-xs text-zinc-500">{item.summary}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">Action Plan</h2>
        <div className="mt-4 grid gap-2">
          {actionPlan.items.map((item) => (
            <div key={item.id} className="border-t border-zinc-900 py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-zinc-300">{item.title}</span>
                <span className="font-mono text-xs text-zinc-500">
                  {item.status}
                </span>
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                {item.measurementWindow} / {item.successMetric}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-zinc-500">
          {actionPlan.nextAction}
        </div>
      </div>
    </section>
  );
}

function TagsCalibrationPanel({
  productization,
}: {
  productization: TraderAnalyticsProductizationViewModel;
}) {
  const tagging = productization.tagging;
  const calibration = productization.marketContextCalibrationQueue;
  const visualQa = productization.visualQa;

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">Setup Tags</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {tagging.segments.slice(0, 6).map((segment) => (
            <div key={segment.tagId} className="border-t border-zinc-900 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-zinc-300">{segment.label}</span>
                <span
                  className={`font-mono text-xs ${toneForPnl(segment.grossTotalRealizedPnl)}`}
                >
                  {formatSigned(segment.grossTotalRealizedPnl)}
                </span>
              </div>
              <div className="mt-2 text-xs text-zinc-500">
                {segment.tradeCount} trades /{" "}
                {segment.topRiskLabel ?? "no top risk"}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6">
        <div className="border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="text-sm font-semibold text-zinc-100">
            Calibration Queue
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <span className="font-mono text-sky-300">
              {calibration.readyCount} ready
            </span>
            <span className="font-mono text-amber-300">
              {calibration.sampleOnlyCount} sample only
            </span>
          </div>
          <div className="mt-3 text-xs text-zinc-500">
            {calibration.nextAction}
          </div>
        </div>

        <div className="border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="text-sm font-semibold text-zinc-100">Visual QA</h2>
          <div className="mt-4 grid gap-2">
            {visualQa.checks.map((check) => (
              <div
                key={check.id}
                className="flex items-center justify-between gap-3 border-t border-zinc-900 py-2"
              >
                <span className="text-xs text-zinc-400">{check.label}</span>
                <span className="font-mono text-xs text-zinc-500">
                  {check.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricDelta({ delta }: { delta: TraderAnalyticsMetricDelta }) {
  const tone =
    delta.direction === "flat" || delta.direction === "insufficient_data"
      ? "text-zinc-300"
      : delta.favorableDirection === "neutral"
        ? "text-sky-300"
        : delta.direction === delta.favorableDirection
          ? "text-emerald-300"
          : "text-amber-300";

  return (
    <div className="border-t border-zinc-900 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-zinc-300">{delta.label}</span>
        <span className={`font-mono text-sm ${tone}`}>
          {formatSigned(delta.delta)}
        </span>
      </div>
      <div className="mt-1 text-xs text-zinc-500">
        {formatNumber(delta.previousValue)} to{" "}
        {formatNumber(delta.currentValue)}
      </div>
    </div>
  );
}

function DrillDownList({
  drillDowns,
  selectedId,
  onSelect,
}: {
  drillDowns: TraderAnalyticsDrillDown[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      className="border border-zinc-800 bg-zinc-950 p-4"
      data-testid="analytics-drilldown-list"
    >
      <h2 className="text-sm font-semibold text-zinc-100">
        Find Trades Behind A Number
      </h2>
      <div className="mt-4 grid gap-2">
        {drillDowns.slice(0, 10).map((drillDown) => (
          <button
            key={drillDown.id}
            className={`border px-3 py-2 text-left text-sm transition ${
              selectedId === drillDown.id
                ? "border-sky-400 bg-sky-950/30 text-sky-100"
                : "border-zinc-800 text-zinc-300 hover:border-zinc-600"
            }`}
            data-testid={`analytics-drilldown-${drillDown.id}`}
            type="button"
            onClick={() => onSelect(drillDown.id)}
          >
            <div className="flex items-center justify-between gap-3">
              <span>{drillDown.label}</span>
              <span className="font-mono text-xs text-zinc-500">
                {drillDown.rows.length}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function TradeRows({
  isSamplePreview,
  rows,
  testIdPrefix,
}: {
  isSamplePreview?: boolean;
  rows: ProductTraderAnalyticsTradeRow[];
  testIdPrefix: string;
}) {
  return (
    <div className="w-full max-w-full overflow-x-auto">
      <table className="w-full min-w-[980px] text-left text-xs">
        <thead className="border-b border-zinc-800 text-zinc-500">
          <tr>
            <th className="py-3 pr-4 font-medium">Trade</th>
            <th className="py-3 pr-4 font-medium">Direction</th>
            <th className="py-3 pr-4 font-medium">Session</th>
            <th className="py-3 pr-4 font-medium">Hour</th>
            <th className="py-3 pr-4 font-medium">Gross P/L</th>
            <th className="py-3 pr-4 font-medium">Primary</th>
            <th className="py-3 pr-4 font-medium">Top Risk</th>
            <th className="py-3 pr-4 font-medium">Review</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-900">
          {rows.map((row) => (
            <tr
              key={row.tradeId}
              data-testid={`${testIdPrefix}-row-${row.tradeId}`}
            >
              <td className="py-3 pr-4">
                <div className="font-semibold text-zinc-100">
                  #{row.tradeIndex} {row.symbol}
                </div>
                <div className="font-mono text-zinc-500">{row.tradeId}</div>
              </td>
              <td className="py-3 pr-4 text-zinc-300">{row.tradeDirection}</td>
              <td className="py-3 pr-4 text-zinc-400">
                <div>{row.sessionDate}</div>
                <div className="font-mono text-zinc-500">
                  {row.sessionBucket}
                </div>
              </td>
              <td className="py-3 pr-4 text-zinc-400">
                <div>{row.entryHourLabelEt ?? "n/a"}</div>
                <div className="font-mono text-zinc-500">
                  {(row.heldSessionBuckets ?? []).length > 1
                    ? (row.heldSessionBuckets ?? []).join(" -> ")
                    : "single session"}
                </div>
              </td>
              <td
                className={`py-3 pr-4 font-mono ${
                  row.grossRealizedPnl >= 0
                    ? "text-emerald-300"
                    : "text-rose-300"
                }`}
              >
                {formatSigned(row.grossRealizedPnl)}
              </td>
              <td className="max-w-[190px] py-3 pr-4 text-zinc-300">
                {row.primaryFocus?.label ?? "None"}
              </td>
              <td className="max-w-[190px] py-3 pr-4 text-amber-300">
                {row.topRisk?.label ?? "None"}
              </td>
              <td className="py-3 pr-4">
                <Link
                  className="text-sky-300 hover:text-sky-200"
                  data-testid={`${testIdPrefix}-open-${row.tradeId}`}
                  href={withPageAnchor(
                    `/intelligence/trades/${encodeURIComponent(row.tradeId)}${isSamplePreview ? "?demo=sample" : ""}`,
                    "summary",
                  )}
                >
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ImportTrialExperiencePanel({
  experience,
}: {
  experience: TraderImportTrialExperienceViewModel;
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.42fr)]">
      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Internal Import Trial Readiness
            </h2>
            <div className="mt-1 text-sm text-zinc-500">
              Admin-only QA checks. {experience.harness.fixtureStrategy}
            </div>
          </div>
          <Link
            className="text-sm text-sky-300 hover:text-sky-200"
            href="/intelligence/import-trials"
          >
            Open internal trials
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Fixtures
            </div>
            <div className="mt-2 text-xl font-semibold text-zinc-100">
              {experience.harness.totalCount}
            </div>
          </div>
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Pass
            </div>
            <div className="mt-2 text-xl font-semibold text-emerald-300">
              {experience.harness.passCount}
            </div>
          </div>
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Review
            </div>
            <div className="mt-2 text-xl font-semibold text-amber-300">
              {experience.harness.needsRepairCount}
            </div>
          </div>
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Blocked
            </div>
            <div className="mt-2 text-xl font-semibold text-rose-300">
              {experience.harness.blockedCount}
            </div>
          </div>
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Review Cockpit
            </h2>
            <div className="mt-1 text-sm text-zinc-500">
              {experience.reviewCockpit.summary}
            </div>
          </div>
          <div className="font-mono text-lg text-sky-300">
            {experience.reviewCockpit.readinessScore}/100
          </div>
        </div>
        <div className="mt-4 grid gap-3">
          {experience.reviewCockpit.actions.slice(0, 3).map((action) => (
            <Link
              key={action.id}
              className="block border-t border-zinc-900 py-3 hover:text-sky-200"
              href={action.href}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-zinc-300">{action.title}</span>
                <span className="text-xs uppercase tracking-wide text-zinc-500">
                  {action.lane}
                </span>
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                {action.nextAction}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export type AnalyticsDashboardSection =
  | "overview"
  | "results"
  | "timing"
  | "behavior"
  | "ticker_stories"
  | "session_stories"
  | "chart_evidence"
  | "review"
  | "trades"
  | "advanced";

const ANALYTICS_DASHBOARD_SECTIONS: Array<{
  href: string;
  id: AnalyticsDashboardSection;
  label: string;
  summary: string;
}> = [
  {
    href: "/intelligence/analytics",
    id: "overview",
    label: "Overview",
    summary: "Start with the report map and the key result.",
  },
  {
    href: "/intelligence/analytics/results",
    id: "results",
    label: "Results",
    summary: "P/L curve, win/loss mix, calendar, and trade tape.",
  },
  {
    href: "/intelligence/analytics/timing",
    id: "timing",
    label: "Timing",
    summary: "Session, entry-hour, and hold-time context.",
  },
  {
    href: "/intelligence/analytics/behavior",
    id: "behavior",
    label: "Behavior",
    summary: "Risk, strength, and uncertain behavior groups.",
  },
  {
    href: "/intelligence/analytics/ticker-stories",
    id: "ticker_stories",
    label: "Ticker Stories",
    summary: "Same-symbol re-entry and giveback stories.",
  },
  {
    href: "/intelligence/analytics/session-stories",
    id: "session_stories",
    label: "Session Stories",
    summary: "Full-day stories like green-to-red and high activity.",
  },
  {
    href: "/intelligence/analytics/chart-evidence",
    id: "chart_evidence",
    label: "Chart Evidence",
    summary: "Support, resistance, volume, and after-exit counts.",
  },
  {
    href: "/intelligence/analytics/review-plan",
    id: "review",
    label: "Behavior Review Plan",
    summary: "What to review next and what behavior to watch.",
  },
  {
    href: "/intelligence/analytics/trade-explorer",
    id: "trades",
    label: "Trade Explorer",
    summary: "Filter trades and open the rows behind each number.",
  },
  {
    href: "/intelligence/analytics/details",
    id: "advanced",
    label: "More Details",
    summary: "Quality checks, import setup, and rule detail.",
  },
];

const ANALYTICS_CATEGORY_ACCESS: Array<{
  label: string;
  section: AnalyticsDashboardSection;
  summary: string;
}> = [
  {
    label: "Results",
    section: "results",
    summary: "P/L, win rate, and the trades that moved the account.",
  },
  {
    label: "Timing",
    section: "timing",
    summary: "Session, entry-hour, and hold-time charts.",
  },
  {
    label: "Behavior",
    section: "behavior",
    summary: "Risk, strength, and uncertain behavior groups.",
  },
  {
    label: "Ticker Stories",
    section: "ticker_stories",
    summary: "Same-symbol re-entry and giveback stories.",
  },
  {
    label: "Session Stories",
    section: "session_stories",
    summary: "Full-day stories like green-to-red or high trade count.",
  },
  {
    label: "Chart Evidence",
    section: "chart_evidence",
    summary: "Support, resistance, volume, and after-exit counts.",
  },
];

function AnalyticsCategoryAccessPanel({
  chartTierEnabled,
  isSamplePreview,
}: {
  chartTierEnabled: boolean;
  isSamplePreview: boolean;
}) {
  const categories = ANALYTICS_CATEGORY_ACCESS.filter(
    (item) => chartTierEnabled || item.section !== "chart_evidence",
  );

  return (
    <section className="ti-panel p-5" data-testid="analytics-category-access">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
          Report Categories
        </p>
        <h2 className="text-xl font-semibold text-zinc-50">
          Open the part of the report you need.
        </h2>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((item) => (
          <Link
            className="rounded-md border border-zinc-800/60 bg-slate-950/30 px-4 py-3 text-left transition hover:border-sky-600 hover:bg-sky-950/20"
            href={analyticsSectionHref(item.section, isSamplePreview)}
            key={item.label}
          >
            <span className="block text-sm font-semibold text-zinc-100">
              {item.label}
            </span>
            <span className="mt-1 block text-xs leading-5 text-zinc-500">
              {item.summary}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function AnalyticsDashboardNav({
  activeSection,
  chartTierEnabled,
  isSamplePreview,
}: {
  activeSection: AnalyticsDashboardSection;
  chartTierEnabled: boolean;
  isSamplePreview: boolean;
}) {
  const sections = ANALYTICS_DASHBOARD_SECTIONS.filter(
    (section) => chartTierEnabled || section.id !== "chart_evidence",
  );

  return (
    <DashboardSideNav
      eyebrow="Analytics Menu"
      items={sections.map((section) => ({
        active: section.id === activeSection,
        href: analyticsSectionHref(section.id, isSamplePreview),
        label: section.label,
        summary: section.summary,
      }))}
      summary="Move between focused analytics pages without scrolling every report."
    />
  );
}

function analyticsSectionHref(
  section: AnalyticsDashboardSection,
  isSamplePreview: boolean,
): string {
  const href =
    ANALYTICS_DASHBOARD_SECTIONS.find((item) => item.id === section)?.href ??
    "/intelligence/analytics";

  return isSamplePreview ? `${href}?demo=sample` : href;
}

export function AnalyticsClient({
  chartTierEnabled = false,
  initialSection = "overview",
  initialViewModel,
  savedReviewQueue,
  importSourceCaution,
  isSamplePreview = false,
  behaviorReport,
  tickerStorySummary,
  sessionStorySummary,
}: {
  chartTierEnabled?: boolean;
  initialSection?: AnalyticsDashboardSection;
  initialViewModel: ProductTraderAnalyticsViewModel;
  savedReviewQueue?: SavedReviewQueueReadModel | null;
  importSourceCaution?: SavedImportSourceCautionReadModel | null;
  isSamplePreview?: boolean;
  behaviorReport: AnalyticsBehaviorReport;
  tickerStorySummary: AnalyticsTickerStorySummary;
  sessionStorySummary: AnalyticsSessionStorySummary;
}) {
  const activeSection = initialSection;
  const [filters, setFilters] = useState<TraderAnalyticsFilter>({});
  const [selectedDrillDownId, setSelectedDrillDownId] = useState(
    initialViewModel.drillDowns[0]?.id ?? "",
  );
  const latest = initialViewModel.latestReport;
  const report = latest.report;
  const selectedDrillDown = initialViewModel.drillDowns.find(
    (drillDown) => drillDown.id === selectedDrillDownId,
  );
  const visibleRows = useMemo(
    () => filteredRows(initialViewModel.filteredView.rows, filters),
    [filters, initialViewModel.filteredView.rows],
  );
  const activeSectionMeta =
    ANALYTICS_DASHBOARD_SECTIONS.find((section) => section.id === activeSection) ??
    ANALYTICS_DASHBOARD_SECTIONS[0];
  const activeSectionSummary =
    !chartTierEnabled && activeSection === "chart_evidence"
      ? "Execution analytics stay available; candle and level summaries stay out until real chart evidence exists."
      : activeSectionMeta.summary;
  const isOverviewSection = activeSection === "overview";

  function updateFilter<K extends keyof TraderAnalyticsFilter>(
    key: K,
    value: TraderAnalyticsFilter[K] | "",
  ) {
    setFilters((current) => ({
      ...current,
      [key]: value || undefined,
    }));
  }

  return (
    <main className="ti-dashboard-bg min-h-screen px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full min-w-0 max-w-[1480px] flex-col gap-8">
        <header className={`ti-panel ${isOverviewSection ? "p-6" : "p-4"}`}>
          <Link
            className="text-sm text-sky-300 hover:text-sky-200"
            href="/intelligence"
          >
            Back to Intelligence
          </Link>
          <p className={`${isOverviewSection ? "mt-4" : "mt-3"} text-xs font-semibold uppercase text-sky-300`}>
            Trader Intelligence
          </p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className={`${isOverviewSection ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"} font-semibold text-zinc-50`}>
                {isOverviewSection
                  ? "Trading Performance Dashboard"
                  : activeSectionMeta.label}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                {isOverviewSection
                  ? "A trader-facing report view for results, behavior cost, and the next trade to review. This is analysis of saved executions, not trading advice."
                  : activeSectionSummary}
              </p>
            </div>
            <div className={`${isOverviewSection ? "grid" : "hidden lg:grid"} gap-2 text-sm`}>
              <div className="rounded-md border border-sky-900 bg-sky-950/30 px-4 py-3 text-sky-100">
                {isSamplePreview
                  ? "Previewing fuller demo data"
                  : initialViewModel.onboarding.title}
              </div>
              {!isSamplePreview && report.sampleSize.completedTradeCount < 6 ? (
                <Link
                  className="rounded-md border border-emerald-900 bg-emerald-950/20 px-4 py-3 text-center text-emerald-200 hover:border-emerald-500"
                  href="/intelligence/analytics?demo=sample"
                >
                  Preview fuller dashboard
                </Link>
              ) : null}
            </div>
          </div>
        </header>

        <SavedReviewQueueSummary
          chartTierEnabled={chartTierEnabled}
          compact={!isOverviewSection}
          queue={savedReviewQueue}
          surface="analytics"
        />
        <SavedImportSourceCaution
          caution={importSourceCaution}
          surface="analytics"
        />

        {activeSection === "overview" ? (
          <AnalyticsCategoryAccessPanel
            chartTierEnabled={chartTierEnabled}
            isSamplePreview={isSamplePreview}
          />
        ) : null}

        <section className="grid min-w-0 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <AnalyticsDashboardNav
            activeSection={activeSection}
            chartTierEnabled={chartTierEnabled}
            isSamplePreview={isSamplePreview}
          />
          <div className="min-w-0">
            {activeSection === "overview" ? (
              <div className="grid gap-6">
                <AnalyticsStoryPanel
                  showSecondaryCharts={false}
                  viewModel={initialViewModel}
                  savedReviewQueue={savedReviewQueue}
                />
              </div>
            ) : null}

            {activeSection === "results" ? (
              <div className="grid gap-6">
                <AnalyticsStoryPanel
                  showSecondaryCharts
                  viewModel={initialViewModel}
                  savedReviewQueue={savedReviewQueue}
                />
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <MetricCard
                    label="Completed Trades"
                    value={String(report.sampleSize.completedTradeCount)}
                    detail={latest.reportPeriod.label}
                  />
                  <MetricCard
                    label="Total Gross P/L"
                    value={formatSigned(report.pnl.grossTotalRealizedPnl)}
                    detail="fees excluded"
                    tone={
                      report.pnl.grossTotalRealizedPnl >= 0
                        ? "success"
                        : "danger"
                    }
                  />
                  <MetricCard
                    label="Win Rate"
                    value={formatPercent(report.pnl.grossWinRate)}
                    detail={`${report.pnl.grossWinnerCount} gross winners`}
                    tone="info"
                  />
                  <MetricCard
                    label="Adds Needing Review"
                    value={formatPercent(
                      report.executionBehavior.adversePriceAddRate,
                    )}
                    detail={
                      chartTierEnabled
                        ? `${report.executionBehavior.adversePriceAddTradeCount} trades where chart data decides whether the add repaired or added exposure`
                        : `${report.executionBehavior.adversePriceAddTradeCount} trades added after price moved against the position`
                    }
                    tone="warning"
                  />
                  <MetricCard
                    label="Open Position Rate"
                    value={formatPercent(report.lifecycle.openPositionRate)}
                    detail={`${report.lifecycle.openPositionTradeCount} trades left open`}
                    tone="info"
                  />
                </section>
              </div>
            ) : null}

            {activeSection === "timing" ? (
              <AnalyticsChartGalleryPanel
                tradeExplorerHref={analyticsSectionHref(
                  "trades",
                  isSamplePreview,
                )}
                viewModel={initialViewModel}
              />
            ) : null}

            {activeSection === "behavior" ? (
              <div className="grid gap-6" id="analytics-behavior">
                <BehaviorReportPanel
                  chartTierEnabled={chartTierEnabled}
                  report={behaviorReport}
                />
                <section className="grid gap-6 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
                  <SimpleBarChart
                    chart={report.charts.behaviorRiskRates}
                    formatter={(value) => String(value)}
                    maxItems={8}
                    title="Execution Habits To Review"
                  />
                  <ImprovementIntelligencePanel
                    improvement={initialViewModel.improvementIntelligence}
                  />
                </section>
              </div>
            ) : null}

            {activeSection === "ticker_stories" ? (
              <TickerStoryAnalyticsPanel
                chartTierEnabled={chartTierEnabled}
                summary={tickerStorySummary}
              />
            ) : null}

            {activeSection === "session_stories" ? (
              <SessionStoryAnalyticsPanel summary={sessionStorySummary} />
            ) : null}

            {chartTierEnabled && activeSection === "chart_evidence" ? (
              <ChartEvidenceAnalyticsPanel summary={tickerStorySummary} />
            ) : null}

            {!chartTierEnabled && activeSection === "chart_evidence" ? (
              <ChartEvidenceTierGatePanel />
            ) : null}

            {activeSection === "review" ? (
              <div className="grid gap-6">
                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
                  <WeeklyReviewPanel
                    weeklyReview={initialViewModel.weeklyReview}
                  />
                  {chartTierEnabled ? (
                    <MarketContextPanel
                      status={initialViewModel.marketContextAddOn}
                    />
                  ) : null}
                </section>

                <ImprovementIntelligencePanel
                  improvement={initialViewModel.improvementIntelligence}
                />

                <IntelligencePanel
                  intelligence={initialViewModel.productIntelligence}
                />

                <ReviewHabitLoopPanel
                  habit={initialViewModel.reviewHabitLoop}
                />

                <ProductPolishPanel polish={initialViewModel.productPolish} />

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.5fr)]">
                  <div className="border border-zinc-800 bg-zinc-950 p-4">
                    <h2 className="text-sm font-semibold text-zinc-100">
                      Focus Queue
                    </h2>
                    <div className="mt-4 grid gap-3">
                      {initialViewModel.focusQueue.map((item) => (
                        <div
                          key={item.id}
                          className="border-t border-zinc-900 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-medium text-zinc-100">
                              {item.rank}. {item.title}
                            </div>
                            <div className="text-xs uppercase tracking-wide text-zinc-500">
                              {item.kind}
                            </div>
                          </div>
                          <div className="mt-1 text-sm text-zinc-400">
                            {item.summary}
                          </div>
                          <div className="mt-2 text-xs text-zinc-500">
                            {item.suggestedReviewAction}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border border-zinc-800 bg-zinc-950 p-4">
                    <h2 className="text-sm font-semibold text-zinc-100">
                      Report History
                    </h2>
                    <div className="mt-4 grid gap-3">
                      {initialViewModel.reportHistory.map(
                        (savedReport, index) => (
                          <div
                            key={savedReport.id}
                            className="border-t border-zinc-900 py-3"
                          >
                            <div className="font-medium text-zinc-100">
                              Saved report {index + 1}
                            </div>
                            <div className="mt-1 text-xs text-zinc-500">
                              {
                                savedReport.report.sampleSize
                                  .completedTradeCount
                              }{" "}
                              trades / generated {savedReport.generatedAt}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
                  <SnapshotPanel snapshots={initialViewModel.reportSnapshots} />
                  <BehaviorStreaksPanel
                    streaks={initialViewModel.behaviorStreaks}
                  />
                </section>

                <JournalPromptsPanel
                  prompts={initialViewModel.journalPrompts}
                />

                <section className="grid gap-6 xl:grid-cols-2">
                  <div className="border border-zinc-800 bg-zinc-950 p-4">
                    <h2 className="text-sm font-semibold text-zinc-100">
                      Behavior Trends
                    </h2>
                    <div className="mt-4 grid gap-3">
                      {initialViewModel.behaviorTrends.map((trend) => (
                        <div
                          key={trend.behaviorId}
                          className="border-t border-zinc-900 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm text-zinc-300">
                              {trend.label}
                            </span>
                            <span className="font-mono text-xs text-zinc-500">
                              {formatPercent(trend.previousRate)} to{" "}
                              {formatPercent(trend.currentRate)}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-zinc-500">
                            {trend.copy}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border border-zinc-800 bg-zinc-950 p-4">
                    <h2 className="text-sm font-semibold text-zinc-100">
                      Latest Comparison
                    </h2>
                    {initialViewModel.comparison ? (
                      <div className="mt-4">
                        <div className="mb-3 text-sm text-zinc-500">
                          {initialViewModel.comparison.label}
                        </div>
                        {initialViewModel.comparison.metricDeltas.map(
                          (delta) => (
                            <MetricDelta key={delta.id} delta={delta} />
                          ),
                        )}
                      </div>
                    ) : (
                      <div className="mt-4 text-sm text-zinc-500">
                        More saved reports are needed for comparison.
                      </div>
                    )}
                  </div>
                </section>
              </div>
            ) : null}

            {activeSection === "advanced" ? (
              <div className="grid gap-6">
                <AdvancedDisclosure
                  summary="Advanced setup details"
                  testId="analytics-advanced-details"
                >
                  <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.75fr)]">
                    <StorageReadinessPanel
                      readiness={initialViewModel.storageReadiness}
                    />
                    <ImportInboxPanel inbox={initialViewModel.importInbox} />
                  </section>
                  <ProductizationPanel
                    productization={initialViewModel.productization}
                  />
                  <ImportTrialExperiencePanel
                    experience={initialViewModel.importTrialExperience}
                  />
                  <ReconciliationJobsPanel
                    productization={initialViewModel.productization}
                  />
                  <WorkflowActionPlanPanel
                    productization={initialViewModel.productization}
                  />
                  <TagsCalibrationPanel
                    productization={initialViewModel.productization}
                  />
                </AdvancedDisclosure>
              </div>
            ) : null}

            {activeSection === "trades" ? (
              <div className="grid gap-6">
                <section
                  className="border border-zinc-800 bg-zinc-950 p-4"
                  id="trades-behind-number"
                >
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Filters
                  </h2>
                  <div className="mt-4 grid gap-3 md:grid-cols-6">
                    <select
                      aria-label="Filter by symbol"
                      className="h-10 border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
                      data-testid="analytics-filter-symbol"
                      value={filters.symbol ?? ""}
                      onChange={(event) =>
                        updateFilter("symbol", event.target.value)
                      }
                    >
                      <option value="">All symbols</option>
                      {initialViewModel.filterOptions.symbols.map((symbol) => (
                        <option key={symbol} value={symbol}>
                          {symbol}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Filter by entry hour"
                      className="h-10 border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
                      data-testid="analytics-filter-entry-hour"
                      value={
                        filters.entryHourEt === undefined
                          ? ""
                          : String(filters.entryHourEt)
                      }
                      onChange={(event) =>
                        updateFilter(
                          "entryHourEt",
                          event.target.value === ""
                            ? ""
                            : Number(event.target.value),
                        )
                      }
                    >
                      <option value="">All hours</option>
                      {initialViewModel.filterOptions.entryHoursEt.map(
                        (hour) => (
                          <option key={hour.value} value={hour.value}>
                            {hour.label}
                          </option>
                        ),
                      )}
                    </select>
                    <select
                      aria-label="Filter by trade direction"
                      className="h-10 border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
                      data-testid="analytics-filter-direction"
                      value={filters.tradeDirection ?? ""}
                      onChange={(event) =>
                        updateFilter("tradeDirection", event.target.value)
                      }
                    >
                      <option value="">All directions</option>
                      {initialViewModel.filterOptions.tradeDirections.map(
                        (direction) => (
                          <option key={direction} value={direction}>
                            {direction}
                          </option>
                        ),
                      )}
                    </select>
                    <select
                      aria-label="Filter by session"
                      className="h-10 border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
                      data-testid="analytics-filter-session"
                      value={filters.sessionBucket ?? ""}
                      onChange={(event) =>
                        updateFilter("sessionBucket", event.target.value)
                      }
                    >
                      <option value="">All sessions</option>
                      {initialViewModel.filterOptions.sessionBuckets.map(
                        (session) => (
                          <option key={session} value={session}>
                            {session}
                          </option>
                        ),
                      )}
                    </select>
                    <select
                      aria-label="Filter by outcome"
                      className="h-10 border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
                      data-testid="analytics-filter-outcome"
                      value={filters.outcome ?? ""}
                      onChange={(event) =>
                        updateFilter(
                          "outcome",
                          event.target.value as
                            | TraderAnalyticsFilter["outcome"]
                            | "",
                        )
                      }
                    >
                      <option value="">All outcomes</option>
                      {initialViewModel.filterOptions.outcomes.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Filter by lifecycle"
                      className="h-10 border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
                      data-testid="analytics-filter-lifecycle"
                      value={filters.lifecycle ?? ""}
                      onChange={(event) =>
                        updateFilter(
                          "lifecycle",
                          event.target.value as
                            | TraderAnalyticsFilter["lifecycle"]
                            | "",
                        )
                      }
                    >
                      <option value="">All lifecycle</option>
                      {initialViewModel.filterOptions.lifecycles.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-3 text-xs text-zinc-500">
                    Showing {visibleRows.length} of{" "}
                    {initialViewModel.filteredView.totalTradeCount} trades.
                    Sample size remains visible when filtering.
                  </div>
                </section>

                <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(300px,0.4fr)_minmax(0,0.6fr)]">
                  <DrillDownList
                    drillDowns={initialViewModel.drillDowns}
                    selectedId={selectedDrillDownId}
                    onSelect={setSelectedDrillDownId}
                  />
                  <div className="min-w-0 border border-zinc-800 bg-zinc-950 p-4">
                    <h2
                      className="text-sm font-semibold text-zinc-100"
                      data-testid="analytics-selected-drilldown-title"
                    >
                      {selectedDrillDown?.label ?? "Drill-Down"}
                    </h2>
                    <div className="mt-2 text-sm text-zinc-500">
                      {selectedDrillDown?.summary ?? "Select a metric."}
                    </div>
                    <div className="mt-4 min-w-0">
                  <TradeRows
                    isSamplePreview={isSamplePreview}
                    rows={selectedDrillDown?.rows ?? []}
                    testIdPrefix="analytics-drilldown"
                  />
                    </div>
                  </div>
                </section>

                <section
                  className="min-w-0 border border-zinc-800 bg-zinc-950 p-4"
                  data-testid="analytics-filtered-trade-review"
                >
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Trades Matching Filters
                  </h2>
                  <div className="mt-4 min-w-0">
                    <TradeRows
                      isSamplePreview={isSamplePreview}
                      rows={visibleRows}
                      testIdPrefix="analytics-filtered"
                    />
                  </div>
                </section>
              </div>
            ) : null}

            {activeSection === "advanced" ? (
              <section className="border border-zinc-800 bg-zinc-950 p-4">
                <h2 className="text-sm font-semibold text-zinc-100">
                  Rule Tracker
                </h2>
                <RuleCompliancePanel
                  summary={initialViewModel.ruleComplianceSummary}
                />
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {initialViewModel.ruleEvaluations.map((evaluation) => (
                    <div
                      key={evaluation.ruleId}
                      className="border-t border-zinc-900 py-3"
                    >
                      <div className="font-medium text-zinc-100">
                        {evaluation.label}
                      </div>
                      <div className="mt-1 text-sm text-zinc-500">
                        {evaluation.violatedTradeCount} violations /{" "}
                        {evaluation.passedTradeCount} passes
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
