import { requireTraderIntelligenceOwnerPageAccess } from "@/src/lib/trader-intelligence-v3/auth";

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AdvancedDisclosure } from "@/app/app-ui";
import {
  importCountLabel,
  importStatusDetail,
  importStatusLabel,
  importStorageLabel,
  importTradeDirectionLabel,
} from "@/src/lib/trader-analytics/product/import-user-copy";
import { buildImportRecoveryReadModel } from "@/src/lib/trader-analytics/server/import-recovery-read-model";
import { SqliteImportCommitRepository } from "@/src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository";
import { ImportWorkflowStrip } from "@/app/import-workflow-strip";
import { ImportRepairActions } from "./import-repair-actions";
import { ImportRecoveryActions } from "./import-recovery-actions";
import { ResumeChartReviewActions } from "./resume-chart-review-actions";
import {
  canUseChartContext,
  readTraderIntelligenceTierFromEnv,
} from "@/src/lib/trader-analytics/product/tier-config";

export const metadata: Metadata = {
  title: "Import Details | Trader Intelligence",
};

export const dynamic = "force-dynamic";

function toneClass(status: string): string {
  return status === "committed" ||
    status === "ready_to_commit" ||
    status === "ready_to_save"
    ? "text-emerald-300"
    : status === "needs_repair" ||
        status === "blocked" ||
        status === "blocked_by_repairs"
      ? "text-rose-300"
      : "text-amber-300";
}

function decisionReviewToneClass(status: string): string {
  return status === "completed"
    ? "text-emerald-300"
    : status === "blocked_open_trade"
      ? "text-sky-300"
      : status === "market_context_unavailable" || status === "analysis_failed"
        ? "text-amber-300"
        : "text-zinc-300";
}

function countBy(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function readableDecisionReviewStatus(value: string): string {
  if (value === "completed") {
    return "Reviewed With Chart Data";
  }

  if (value === "queued") {
    return "Waiting For Chart Data";
  }

  if (value === "blocked_open_trade" || value === "trade_open") {
    return "Open or Swing Trade";
  }

  if (value === "market_context_unavailable") {
    return "Chart data still missing";
  }

  if (value === "analysis_failed") {
    return "Chart Data Needs Another Check";
  }

  if (value === "skipped_limit" || value === "limit_reached") {
    return "Review Limit Reached";
  }

  return "Technical Follow-Up";
}

function batchStateLabel(status: string): string {
  return importStatusLabel(status);
}

function batchStateDetail(status: string): string {
  return importStatusDetail(
    status,
    "Use the action panel to continue this import.",
  );
}

function diagnosticGuidance(status: string): string {
  if (status === "analysis_failed") {
    return "Chart data needs another check before candle or level feedback is trusted, so this trade stays in the manual review queue with conservative execution-only coaching.";
  }

  if (status === "market_context_unavailable") {
    return "Market context was unavailable, so coaching should not make support, resistance, candle, or setup claims.";
  }

  if (status === "blocked_open_trade") {
    return "The trade was saved while still open or carried, so completed-trade coaching waits until the position is flat.";
  }

  if (status === "skipped_limit") {
    return "This chart-data review was skipped by the run limit and can be resumed later.";
  }

  return "Chart data status shows which coaching outputs are ready and which need follow-up.";
}

function diagnosticUserMessage(status: string, code: string): string {
  if (
    status === "market_context_unavailable" ||
    code === "market_context_unavailable"
  ) {
    return "Chart, level, or volume evidence was not available for this trade. Use execution review now and add chart data later.";
  }

  if (status === "blocked_open_trade" || code === "trade_open") {
    return "This trade was still open or carried, so completed-trade coaching waits until the position is flat.";
  }

  if (status === "skipped_limit" || code === "limit_reached") {
    return "The review pass reached its limit before this trade could receive chart review.";
  }

  return "Chart data needs another check before it can support coaching.";
}

function isActionableRepairItem(item: {
  severity: string;
  status: string;
}): boolean {
  return item.severity === "fix_required" || (
    item.status === "open" && item.severity !== "info"
  );
}

function isUploadWindowCarryoverIssue(issue: { issueCode: string }): boolean {
  return (
    issue.issueCode === "prior_position_close_skipped" ||
    issue.issueCode === "sell_starting_trade_skipped"
  );
}

export default async function ImportBatchPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  await requireTraderIntelligenceOwnerPageAccess("app/intelligence/imports/[batchId]/page.tsx");
  const routeParams = await params;
  const batchId = decodeURIComponent(routeParams.batchId);
  const repository = new SqliteImportCommitRepository();
  const chartTierEnabled = canUseChartContext(readTraderIntelligenceTierFromEnv());
  const plan = repository.getPreviewPlan(batchId);
  const batch = repository.getImportBatch(batchId);
  const decisionReviewJobs = repository.listDecisionReviewJobs(batchId);
  const decisionReviewSnapshots =
    repository.listDecisionReviewSnapshotsForBatch(batchId);
  const decisionReviewDiagnostics =
    repository.listDecisionReviewDiagnosticsForBatch(batchId);
  const decisionReviewStatusCounts = countBy(
    decisionReviewJobs.map((job) => job.status),
  );
  const decisionReviewQueuedCount = decisionReviewStatusCounts.queued ?? 0;
  const decisionReviewCompletedCount =
    decisionReviewStatusCounts.completed ?? 0;
  const decisionReviewAnalysisFailedCount =
    decisionReviewStatusCounts.analysis_failed ?? 0;
  const decisionReviewMarketContextUnavailableCount =
    decisionReviewStatusCounts.market_context_unavailable ?? 0;
  const decisionReviewSkippedLimitCount =
    decisionReviewStatusCounts.skipped_limit ?? 0;
  const decisionReviewRetryableCount =
    decisionReviewAnalysisFailedCount +
    decisionReviewMarketContextUnavailableCount;
  const decisionReviewDiagnosticCodeCounts = countBy(
    decisionReviewDiagnostics.map((diagnostic) => diagnostic.code),
  );
  const decisionReviewStatusOrder = [
    "completed",
    "queued",
    "blocked_open_trade",
    "market_context_unavailable",
    "analysis_failed",
    "skipped_limit",
  ];

  if (!plan || !batch) {
    notFound();
  }

  const recovery = buildImportRecoveryReadModel({ repository, plan, batch });
  const isCommitted = batch.status === "committed";
  const workflowCurrentStep =
    isCommitted ? "review" : "recover";
  const workflowSummary =
    isCommitted
      ? "This import is saved. Continue into saved trades, the review queue, analytics, or coach from the saved-data links below."
      : "This import is still in the save-or-repair step. Resolve the visible blocker, duplicate, or acknowledgement before moving into saved trade review.";
  const firstSavedTrade = plan.savedTrades[0] ?? null;
  const savedPrimaryLink =
    isCommitted
      ? firstSavedTrade
        ? {
            label: "Review first saved trade",
            href: `/intelligence/trades/${encodeURIComponent(firstSavedTrade.id)}?from=review-queue&queue=highest_priority#writing-flow`,
            detail:
              "Open the first saved trade with execution replay, checklist, and review scope.",
          }
        : {
            label: "Open highest-priority queue",
            href: "/intelligence/review?queue=highest_priority",
            detail:
              "Open the saved review queue and start with the highest-priority item.",
          }
      : null;
  const savedOutputLinks =
    isCommitted
      ? [
          ["Saved trades", "/intelligence/trades"],
          ["Review queue", "/intelligence/review?queue=highest_priority"],
          ["Analytics", "/intelligence/analytics"],
          ["Coach", "/intelligence/coach"],
        ]
      : [];
  const actionableRepairItems = plan.repairItems.filter(isActionableRepairItem);
  const advancedRepairNotes = plan.repairItems.filter(
    (item) => !isActionableRepairItem(item),
  );
  const uploadWindowCarryoverCount = plan.issues.filter(
    isUploadWindowCarryoverIssue,
  ).length;

  return (
    <main className="min-h-screen ti-dashboard-bg px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="border-b border-zinc-800 pb-6">
          <Link
            className="text-sm text-sky-300 hover:text-sky-200"
            href="/intelligence/imports"
          >
            Back to imports
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-50">
            {isCommitted ? "Saved Import" : "Import Details"}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">
            {batch.brokerLabel}
          </p>
        </header>

        <ImportWorkflowStrip
          currentStep={workflowCurrentStep}
          summary={workflowSummary}
        />

        <section
          className="ti-panel p-4"
          data-testid="import-batch-action-summary"
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Import State
              </p>
              <h2
                className={`mt-2 text-xl font-semibold ${toneClass(recovery.status)}`}
              >
                {recovery.title}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                {recovery.detail}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-wide">
                <span className="border border-zinc-800 bg-zinc-950 px-2 py-1 text-zinc-400">
                  {batchStateLabel(batch.status)}
                </span>
                <span className="border border-zinc-800 bg-zinc-950 px-2 py-1 text-zinc-400">
                  {batch.acceptedExecutionCount} accepted executions
                </span>
                <span className="border border-zinc-800 bg-zinc-950 px-2 py-1 text-zinc-400">
                  {importCountLabel(plan.savedTrades.length, "saved trade")}
                </span>
                {recovery.duplicate.duplicateFile ? (
                  <span className="border border-amber-900 bg-amber-950/20 px-2 py-1 text-amber-300">
                    possible duplicate import
                  </span>
                ) : null}
              </div>
              {uploadWindowCarryoverCount > 0 ? (
                <div className="mt-4 rounded-md border border-sky-900 bg-sky-950/20 px-3 py-2 text-xs leading-5 text-sky-100">
                  {importCountLabel(
                    uploadWindowCarryoverCount,
                    "row",
                  )}{" "}
                  looked like it belonged to a position opened before this CSV
                  window, so it was set aside from normal long-side analytics.
                  You can review it in advanced import details.
                </div>
              ) : null}
              {isCommitted && chartTierEnabled && decisionReviewQueuedCount > 0 ? (
                <div className="mt-4 rounded-md border border-sky-900 bg-sky-950/20 px-3 py-2 text-xs leading-5 text-sky-100">
                  Chart evidence is still loading for{" "}
                  {importCountLabel(decisionReviewQueuedCount, "saved trade")}.
                  You can start reviewing executions now, and resume chart data
                  review from advanced details if it stops.
                </div>
              ) : null}
            </div>
            <div className="border border-zinc-900 bg-zinc-950 p-3">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Next Action
              </div>
              <div
                className={`mt-2 text-sm font-semibold ${toneClass(recovery.status)}`}
              >
                {recovery.primaryAction.label}
              </div>
              <div className="mt-1 text-xs leading-5 text-zinc-500">
                {importStorageLabel(recovery.primaryAction.detail)}
              </div>
              {savedPrimaryLink ? (
                <Link
                  className="mt-4 block border border-sky-800 bg-sky-950/40 px-3 py-3 text-sm font-medium text-sky-100 transition hover:border-sky-400"
                  data-testid="import-batch-primary-review-action"
                  href={savedPrimaryLink.href}
                >
                  {savedPrimaryLink.label}
                  <span className="mt-1 block text-xs font-normal leading-5 text-sky-200/80">
                    {savedPrimaryLink.detail}
                  </span>
                </Link>
              ) : null}
              {savedOutputLinks.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {savedOutputLinks.map(([label, href]) => (
                    <Link
                      className="border border-sky-900 bg-sky-950/30 px-2 py-1 text-xs text-sky-200 hover:border-sky-400"
                      href={href}
                      key={href}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="ti-panel p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Import Status
            </div>
            <div
              className={`mt-3 text-xl font-semibold ${toneClass(batch.status)}`}
            >
              {batchStateLabel(batch.status)}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {batchStateDetail(batch.status)}
            </div>
          </div>
          <div className="ti-panel p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Imported Executions
            </div>
            <div className="mt-3 text-2xl font-semibold text-zinc-100">
              {batch.acceptedExecutionCount}
            </div>
          </div>
          <div className="ti-panel p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Saved Trades
            </div>
            <div className="mt-3 text-2xl font-semibold text-sky-300">
              {plan.savedTrades.length}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {importCountLabel(batch.requestCount, "grouped trade")} checked
            </div>
          </div>
          <div className="ti-panel p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Repair Items
            </div>
            <div
              className={`mt-3 text-2xl font-semibold ${
                recovery.counts.openRepairs > 0
                  ? "text-amber-300"
                  : "text-emerald-300"
              }`}
            >
              {recovery.counts.openRepairs}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {recovery.counts.blockers > 0
                ? `${recovery.counts.blockers} blocker(s) remain`
                : "No blocking repair work"}
            </div>
          </div>
        </section>

        <ImportRecoveryActions batchId={batch.id} recovery={recovery} />

        {actionableRepairItems.length > 0 ? (
          <ImportRepairActions
            batchId={batch.id}
            repairItems={actionableRepairItems}
          />
        ) : null}

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="ti-panel p-4" data-testid="import-batch-saved-trades">
            <h2 className="text-sm font-semibold text-zinc-100">
              {isCommitted ? "Saved Trades" : "Trades Ready To Save"}
            </h2>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              {isCommitted
                ? chartTierEnabled
                  ? "Open a saved trade to review executions, notes, checklist state, session timing, and any chart evidence notes."
                  : "Open a saved trade to review executions, notes, checklist state, session timing, and P/L evidence."
                : "These trades were found in the CSV preview. Save the import before opening individual trade reviews."}
            </p>
            <div className="mt-4 grid gap-2">
              {plan.savedTrades.length === 0 ? (
                <div className="text-sm text-zinc-500">
                  No saved trades are available for this import yet.
                </div>
              ) : (
                plan.savedTrades.map((trade) => {
                  const body = (
                    <>
                      <div className="font-medium text-zinc-100">
                        {trade.symbol} /{" "}
                        {importTradeDirectionLabel(trade.tradeDirection)}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {importStatusLabel(trade.lifecycleStatus)} /{" "}
                        {trade.entryHourLabelEt}
                      </div>
                      <div
                        className={`mt-2 text-xs ${
                          isCommitted ? "text-sky-300" : "text-zinc-500"
                        }`}
                      >
                        {isCommitted ? "Open trade review" : "Save import first"}
                      </div>
                    </>
                  );

                  return isCommitted ? (
                    <Link
                      key={trade.id}
                      className="border-t border-zinc-900 py-3 text-sm hover:text-sky-200"
                      href={`/intelligence/trades/${encodeURIComponent(trade.id)}#writing-flow`}
                    >
                      {body}
                    </Link>
                  ) : (
                    <div
                      key={trade.id}
                      className="border-t border-zinc-900 py-3 text-sm"
                    >
                      {body}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="ti-panel p-4" id="import-decisions">
            <h2 className="text-sm font-semibold text-zinc-100">
              Import Decisions
            </h2>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Blocking decisions prevent save. Review decisions require an
              explicit acknowledgement before this import should be trusted.
            </p>
            <div className="mt-4 grid gap-2">
              {plan.requiredDecisions.length === 0 ? (
                <div className="text-sm text-emerald-300">
                  No unresolved save decisions.
                </div>
              ) : (
                plan.requiredDecisions.map((decision) => (
                  <div
                    key={decision.id}
                    className="border-t border-zinc-900 py-3"
                  >
                    <div className={toneClass(decision.severity)}>
                      {importStatusLabel(decision.kind)}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {decision.message}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <AdvancedDisclosure
          summary="Advanced import and chart details"
          testId="import-batch-advanced-details"
        >
          <section className="grid gap-6 xl:grid-cols-2">
            {advancedRepairNotes.length > 0 ? (
              <div
                className="ti-panel p-4"
                data-testid="import-batch-advanced-repair-notes"
              >
                <h2 className="text-sm font-semibold text-zinc-100">
                  Automatic Row Notes
                </h2>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  These rows were handled automatically and are kept here for
                  traceability. They do not need action before reviewing saved
                  trades.
                </p>
                <div className="mt-4 grid gap-2">
                  {advancedRepairNotes.slice(0, 8).map((item) => (
                    <div key={item.id} className="border-t border-zinc-900 py-3">
                      <div className="text-sm font-medium text-zinc-100">
                        {item.title}
                      </div>
                      <div className="mt-1 text-xs leading-5 text-zinc-500">
                        {item.detail}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs uppercase tracking-wide text-zinc-500">
                        {item.rowIndex ? <span>row {item.rowIndex}</span> : null}
                        <span>{importStatusLabel(item.severity)}</span>
                        <span>{importStatusLabel(item.status)}</span>
                      </div>
                    </div>
                  ))}
                  {advancedRepairNotes.length > 8 ? (
                    <div className="border-t border-zinc-900 py-3 text-xs text-zinc-500">
                      {advancedRepairNotes.length - 8} more automatic row notes
                      are retained in the import record.
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div
              className="ti-panel p-4"
              data-testid="import-batch-technical-summary"
            >
              <h2 className="text-sm font-semibold text-zinc-100">
                Import Technical Summary
              </h2>
              <div className="mt-4 grid gap-3 text-sm">
                <div className="border-t border-zinc-900 py-3">
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    Batch ID
                  </div>
                  <div className="mt-1 break-all font-mono text-xs text-zinc-300">
                    {batch.id}
                  </div>
                </div>
                <div className="border-t border-zinc-900 py-3">
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    {chartTierEnabled
                      ? "Chart Review Snapshots"
                      : "Saved Review Scope"}
                  </div>
                  <div className="mt-1 text-zinc-300">
                    {chartTierEnabled
                      ? importCountLabel(decisionReviewSnapshots.length, "snapshot")
                      : importCountLabel(plan.savedTrades.length, "saved trade")}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {chartTierEnabled
                      ? `${importCountLabel(
                          decisionReviewJobs.length,
                          "chart review item",
                        )}, ${importCountLabel(
                          decisionReviewDiagnostics.length,
                          "technical note",
                        )}`
                      : `${batch.acceptedExecutionCount} accepted executions`}
                  </div>
                </div>
              </div>
            </div>

            {chartTierEnabled ? (
              <div
                className="ti-panel p-4"
                data-testid="decision-review-diagnostics"
                id="chart-review-details"
              >
                <h2 className="text-sm font-semibold text-zinc-100">
                  Chart Data Review Status
                </h2>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  These statuses explain whether saved trades received completed
                  chart data snapshots or stayed in conservative follow-up
                  lanes. These are evidence limits, not instructions.
                </p>
                <div className="mt-4 grid gap-2">
                  {decisionReviewJobs.length === 0 ? (
                    <div className="text-sm text-zinc-500">
                      No chart review items were created for this import.
                    </div>
                  ) : (
                    decisionReviewStatusOrder
                      .filter((status) => decisionReviewStatusCounts[status] > 0)
                      .map((status) => (
                        <div
                          key={status}
                          className="border-t border-zinc-900 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span
                              className={`text-sm ${decisionReviewToneClass(status)}`}
                            >
                              {readableDecisionReviewStatus(status)}
                            </span>
                            <span className="font-mono text-xs text-sky-300">
                              {decisionReviewStatusCounts[status]}
                            </span>
                          </div>
                          <div className="mt-1 text-xs leading-5 text-zinc-500">
                            {diagnosticGuidance(status)}
                          </div>
                        </div>
                      ))
                  )}
                </div>
                {decisionReviewQueuedCount > 0 ||
                decisionReviewRetryableCount > 0 ? (
                  <ResumeChartReviewActions
                    batchId={batch.id}
                    totalCount={decisionReviewJobs.length}
                    queuedCount={decisionReviewQueuedCount}
                    completedCount={decisionReviewCompletedCount}
                    analysisFailedCount={decisionReviewAnalysisFailedCount}
                    marketContextUnavailableCount={
                      decisionReviewMarketContextUnavailableCount
                    }
                    skippedLimitCount={decisionReviewSkippedLimitCount}
                  />
                ) : null}
                {decisionReviewDiagnostics.length > 0 ? (
                  <div className="mt-5 grid gap-2">
                    <div className="text-xs uppercase tracking-wide text-zinc-500">
                      Technical Review Buckets
                    </div>
                    {Object.entries(decisionReviewDiagnosticCodeCounts).map(
                      ([code, count]) => (
                        <div key={code} className="border-t border-zinc-900 py-2">
                          <div className="flex items-center justify-between gap-3">
                            <span className={decisionReviewToneClass(code)}>
                              {readableDecisionReviewStatus(code)}
                            </span>
                            <span className="font-mono text-xs text-zinc-300">
                              {count}
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                    <div className="mt-4 text-xs uppercase tracking-wide text-zinc-500">
                      Latest Technical Notes
                    </div>
                    {decisionReviewDiagnostics.slice(0, 5).map((diagnostic) => (
                      <div
                        key={diagnostic.id}
                        className="border-t border-zinc-900 py-3"
                      >
                        <div
                          className={decisionReviewToneClass(diagnostic.status)}
                        >
                          {diagnostic.symbol ?? "Import"} /{" "}
                          {readableDecisionReviewStatus(diagnostic.code)}
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">
                          {diagnosticUserMessage(
                            diagnostic.status,
                            diagnostic.code,
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div
                className="ti-panel p-4"
                data-testid="import-execution-only-review-status"
              >
                <h2 className="text-sm font-semibold text-zinc-100">
                  Execution-Only Import Review
                </h2>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  This tier keeps saved imports focused on executions, P/L,
                  notes, checklist state, and review queue progress.
                </p>
                <div className="mt-4 grid gap-2 text-sm text-zinc-400">
                  <div>{importCountLabel(plan.savedTrades.length, "saved trade")}</div>
                  <div>{batch.acceptedExecutionCount} accepted executions</div>
                </div>
              </div>
            )}
          </section>
        </AdvancedDisclosure>
      </div>
    </main>
  );
}
