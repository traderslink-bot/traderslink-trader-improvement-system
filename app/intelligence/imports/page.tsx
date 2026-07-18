import { requireTraderIntelligenceOwnerPageAccess } from "@/src/lib/trader-intelligence-v3/auth";

import Link from "next/link";
import type { Metadata } from "next";
import { buildProductWorkflowShellViewModel } from "@/src/lib/trader-analytics";
import { buildImportRecoveryReadModel } from "@/src/lib/trader-analytics/server/import-recovery-read-model";
import {
  DEMO_ACCOUNT_ID,
  type ImportBatchHistoryItem,
  SqliteImportCommitRepository,
} from "@/src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository";
import { AdvancedDisclosure } from "@/app/app-ui";
import {
  importCountLabel,
  importStatusDetail,
  importStatusLabel,
  importStorageLabel,
  importTradeDirectionLabel,
} from "@/src/lib/trader-analytics/product/import-user-copy";
import type { ImportRecoveryReadModel } from "@/src/lib/trader-analytics/server/import-recovery-read-model";

export const metadata: Metadata = {
  title: "Import History | Trader Intelligence",
};

export const dynamic = "force-dynamic";

function toneClass(status: string): string {
  return status === "high_confidence" ||
    status === "ready_to_commit" ||
    status === "ready" ||
    status === "committed"
    ? "text-emerald-300"
    : status === "blocked" || status === "needs_repair"
      ? "text-rose-300"
      : "text-amber-300";
}

function borderToneClass(status: string): string {
  return status === "committed" ||
    status === "ready_to_save" ||
    status === "ready"
    ? "border-emerald-900/70 bg-emerald-950/20"
    : status === "blocked_by_repairs" ||
        status === "blocked" ||
        status === "needs_repair"
      ? "border-rose-900/70 bg-rose-950/20"
      : "border-amber-900/70 bg-amber-950/20";
}

function recoveryActionLabel(item: ImportRecoveryReadModel): string {
  if (item.status === "ready_to_save") {
    return "Save import";
  }

  if (item.status === "blocked_by_repairs") {
    return "Resolve repair rows";
  }

  return item.primaryAction.label;
}

function importRepairSeverityLabel(value: string): string {
  return importStatusLabel(value === "warning" ? "needs_review" : value);
}

function historyState(item: ImportBatchHistoryItem): {
  label: string;
  detail: string;
  action: string;
} {
  if (item.summaryStatus === "committed" && item.resolvedRepairCount > 0) {
    return {
      label: "Saved after repair",
      detail:
        "Repaired row values were carried forward before this import was saved.",
      action: "Review saved trades",
    };
  }

  if (item.summaryStatus === "committed") {
    return {
      label: "Saved import",
      detail: "Saved trades, analytics, coach, and review work are ready.",
      action: "Review saved trades",
    };
  }

  if (item.duplicateFile || item.duplicateTradeCount > 0) {
    return {
      label: "Duplicate review",
      detail: `${item.duplicateFile ? "This file looks like a saved import" : "A saved trade looks like this import"}${
        item.duplicateTradeCount > 0
          ? `; ${item.duplicateTradeCount} possible duplicate trade(s) found`
          : ""
      }.`,
      action: "Open original import",
    };
  }

  if (item.openRepairCount > 0 || item.blockerCount > 0) {
    return {
      label: "Repair required",
      detail: `${item.openRepairCount} open repair(s), ${item.blockerCount} blocker(s).`,
      action: "Resolve repair rows",
    };
  }

  if (item.summaryStatus === "needs_review") {
    return {
      label: "Review before save",
      detail: `${item.reviewCount} acknowledgement(s) need review before saving.`,
      action: "Review decisions",
    };
  }

  if (item.summaryStatus === "ready") {
    return {
      label: "Ready to save",
      detail: "No blocking repairs or duplicate checks are open.",
      action: "Save import",
    };
  }

  return {
    label: "Discarded preview",
    detail: "This preview is retained for audit context only.",
    action: "Open details",
  };
}

export default async function ImportsPage() {
  await requireTraderIntelligenceOwnerPageAccess("app/intelligence/imports/page.tsx");
  const repository = new SqliteImportCommitRepository();
  const importHistory = repository.listImportBatchHistory(DEMO_ACCOUNT_ID);
  const unresolvedRepairs =
    repository.listUnresolvedImportRepairInbox(DEMO_ACCOUNT_ID);
  const committedCount = importHistory.filter(
    (item) => item.summaryStatus === "committed",
  ).length;
  const needsReviewCount = importHistory.filter(
    (item) => item.summaryStatus === "needs_review",
  ).length;
  const blockedCount = importHistory.filter(
    (item) => item.summaryStatus === "blocked",
  ).length;
  const duplicateCount = importHistory.filter(
    (item) => item.duplicateFile || item.duplicateTradeCount > 0,
  ).length;
  const recoveryQueue = importHistory
    .flatMap((item) => {
      const plan = repository.getPreviewPlan(item.batch.id);
      const batch = repository.getImportBatch(item.batch.id);

      if (!plan || !batch) {
        return [];
      }

      return [buildImportRecoveryReadModel({ repository, plan, batch })];
    })
    .filter(
      (item) => item.status !== "committed" && item.status !== "discarded",
    )
    .slice(0, 8);
  const shell = buildProductWorkflowShellViewModel();
  const view = shell.importReview;
  const diagnostics = view.diagnostics;
  const importExperience = shell.analytics.productPolish.firstImportExperience;
  const repairInbox = shell.analytics.productPolish.tradeRepairInbox;
  const dataQuality = shell.analytics.reviewHabitLoop.dataQualityScore;

  return (
    <main className="min-h-screen ti-dashboard-bg px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="border-b border-zinc-800 pb-6">
          <Link
            className="text-sm text-sky-300 hover:text-sky-200"
            href="/intelligence"
          >
            Back to Intelligence
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-50">
            Import History
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">
            See saved imports, unfinished repairs, and the next place to go
            after an import is ready.
          </p>
          <Link
            className="mt-4 inline-block text-sm text-sky-300 hover:text-sky-200"
            href="/intelligence/upload-csv"
          >
            Upload another CSV
          </Link>
        </header>

        <section className="ti-panel p-4" data-testid="import-recovery-queue">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Imports To Finish
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Import attempts that need row repair, duplicate review, or a
                final acknowledgement before the saved trades are ready.
              </p>
            </div>
            <div className="font-mono text-xl text-amber-300">
              {recoveryQueue.length}
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            {recoveryQueue.length === 0 ? (
              <div className="text-sm text-emerald-300">
                No imports need attention right now.
              </div>
            ) : (
              recoveryQueue.map((item) => (
                <Link
                  className={`grid gap-3 border p-3 text-sm hover:border-sky-700 hover:text-sky-200 md:grid-cols-[1fr_170px_150px] ${borderToneClass(item.status)}`}
                  data-testid={`import-recovery-${item.batchId}`}
                  href={`/intelligence/imports/${encodeURIComponent(item.batchId)}`}
                  key={item.batchId}
                >
                  <span className="text-zinc-100">
                    {item.title}
                    <span className="mt-1 block text-xs text-zinc-500">
                      {item.detail}
                    </span>
                    <span className="mt-2 block text-xs text-zinc-400">
                      {item.duplicate.duplicateFile
                        ? "Looks like a duplicate saved import."
                        : item.counts.duplicateTrades > 0
                          ? `${item.counts.duplicateTrades} possible duplicate saved trade(s) detected.`
                          : item.counts.fixRequiredRepairs > 0
                            ? `${item.counts.fixRequiredRepairs} fix-required repair(s) remain.`
                            : item.status === "ready_to_save"
                              ? "This preview is ready to save."
                              : "Open the import detail to continue."}
                    </span>
                  </span>
                  <span>
                    <span
                      className={`block font-medium ${toneClass(item.status)}`}
                    >
                      {importStatusLabel(item.status)}
                    </span>
                    <span className="mt-1 block text-xs text-zinc-500">
                      {importCountLabel(item.counts.openRepairs, "repair")},{" "}
                      {importCountLabel(item.counts.reviewDecisions, "review")}
                    </span>
                  </span>
                  <span className="text-sky-300">
                    {recoveryActionLabel(item)}
                    <span className="mt-1 block text-xs text-zinc-500">
                      {importStorageLabel(item.primaryAction.detail)}
                    </span>
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="ti-panel p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Import History
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                {importHistory.length > 0
                  ? "Saved import attempts are available for review."
                  : "No saved imports yet. Upload one CSV to start."}
              </p>
            </div>
            <Link
              className="text-sm text-sky-300 hover:text-sky-200"
              href="/intelligence/upload-csv"
            >
              Upload another CSV
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {[
              ["Saved", committedCount],
              ["Needs Review", needsReviewCount],
              ["Blocked", blockedCount],
              ["Duplicates", duplicateCount],
            ].map(([label, value]) => (
              <div key={label} className="border border-zinc-900 p-3">
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  {label}
                </div>
                <div className="mt-2 text-xl font-semibold text-zinc-100">
                  {value}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-2">
            {importHistory.slice(0, 12).map((item) => {
              const state = historyState(item);

              return (
                <Link
                  key={item.batch.id}
                  className="grid gap-2 border-t border-zinc-900 py-3 text-sm hover:text-sky-200 md:grid-cols-[1fr_160px_140px_130px]"
                  data-testid={`import-history-row-${item.batch.id}`}
                  href={`/intelligence/imports/${encodeURIComponent(item.batch.id)}`}
                >
                  <span className="text-zinc-100">
                    {item.batch.brokerLabel}
                    <span className="mt-1 block text-xs text-zinc-500">
                      {state.detail}
                    </span>
                  </span>
                  <span>
                    <span
                      className={toneClass(item.summaryStatus)}
                      data-testid={`import-history-status-${item.batch.id}`}
                    >
                      {state.label}
                    </span>
                  </span>
                  <span className="text-zinc-400">
                    {importCountLabel(item.savedTradeCount, "trade")}
                    {item.resolvedRepairCount > 0 ? (
                      <span className="mt-1 block text-xs text-emerald-300">
                        {item.resolvedRepairCount} repair(s) resolved
                      </span>
                    ) : null}
                  </span>
                  <span className="text-zinc-500">
                    {item.batch.updatedAt.slice(0, 10)}
                    <span className="mt-1 block text-xs text-sky-300">
                      {state.action}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="ti-panel p-4" data-testid="unresolved-repair-inbox">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Unresolved Repairs
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Open import repair items that still need attention before the
                data should be trusted for coaching.
              </p>
            </div>
            <div className="font-mono text-xl text-amber-300">
              {unresolvedRepairs.length}
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            {unresolvedRepairs.length === 0 ? (
              <div className="text-sm text-emerald-300">
                No unresolved import repairs.
              </div>
            ) : (
              unresolvedRepairs.slice(0, 12).map((item) => (
                <Link
                  key={item.id}
                  className="grid gap-2 border-t border-zinc-900 py-3 text-sm hover:text-sky-200 md:grid-cols-[1fr_130px_130px_120px]"
                  data-testid={`unresolved-repair-${item.id}`}
                  href={item.href}
                >
                  <span className="text-zinc-100">
                    {item.title}
                    <span className="mt-1 block text-xs text-zinc-500">
                      {item.detail}
                    </span>
                  </span>
                  <span className={toneClass(item.severity)}>
                    {importRepairSeverityLabel(item.severity)}
                  </span>
                  <span className="text-zinc-400">{item.brokerLabel}</span>
                  <span className="text-zinc-500">
                    {item.rowIndex === null
                      ? "row n/a"
                      : `row ${item.rowIndex}`}
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>

        <AdvancedDisclosure
          summary="Advanced import details"
          testId="imports-advanced-details"
        >
          <section className="grid gap-4 md:grid-cols-4">
            <div className="ti-panel p-4">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Quality Score
              </div>
              <div
                className={`mt-3 text-2xl font-semibold ${toneClass(
                  diagnostics.qualityScore.status,
                )}`}
              >
                {diagnostics.qualityScore.score}/100
              </div>
              <div className="mt-2 text-xs text-zinc-500">
                {importStatusDetail(
                  diagnostics.qualityScore.status,
                  importStatusLabel(diagnostics.qualityScore.status),
                )}
              </div>
            </div>
            <div className="ti-panel p-4">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Mapping
              </div>
              <div className="mt-3 text-2xl font-semibold text-sky-300">
                {view.preview.importResult.mappingConfidence.level}
              </div>
              <div className="mt-2 text-xs text-zinc-500">
                score {view.preview.importResult.mappingConfidence.score}
              </div>
            </div>
            <div className="ti-panel p-4">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Trades
              </div>
              <div className="mt-3 text-2xl font-semibold text-zinc-100">
                {view.preview.importResult.requestCount}
              </div>
              <div className="mt-2 text-xs text-zinc-500">
                {view.preview.importResult.acceptedExecutionCount} executions
              </div>
            </div>
            <div className="ti-panel p-4">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Save Readiness
              </div>
              <div
                className={`mt-3 text-xl font-semibold ${toneClass(
                  diagnostics.commitPlan.status,
                )}`}
              >
                {importStatusLabel(diagnostics.commitPlan.status)}
              </div>
              <div className="mt-2 text-xs text-zinc-500">
                {importStorageLabel(
                  view.commitDisabledReason ?? "Ready to save",
                )}
              </div>
            </div>
          </section>

          <section
            className="ti-panel grid gap-4 p-4 md:grid-cols-3"
            data-testid="imports-safety-policy"
          >
            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Write Safety
              </div>
              <div className="mt-2 text-sm font-medium text-emerald-300">
                Review-only prototype
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                This screen previews save readiness; it does not save broker
                rows to production storage.
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Cost Policy
              </div>
              <div className="mt-2 text-sm font-medium text-sky-300">
                gross-only feedback
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                Fees and broker net amounts are visible for reconciliation, not
                used to rescore execution coaching.
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Execution Basis
              </div>
              <div className="mt-2 text-sm font-medium text-zinc-300">
                execution grouping
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                Reconstruction is based on parsed execution side, shares, price,
                timestamp, and final position.
              </div>
            </div>
          </section>

          <section className="ti-panel p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">
                  Data Quality Score
                </h2>
                <div className="mt-1 text-sm text-zinc-500">
                  {dataQuality.nextAction}
                </div>
              </div>
              <div className="font-mono text-2xl text-sky-300">
                {dataQuality.score}/100
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {dataQuality.checks.map((check) => (
                <div key={check.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{check.label}</span>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">
                      {check.passed
                        ? "Passed"
                        : importRepairSeverityLabel(check.severity)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {check.detail}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)]">
            <div className="ti-panel p-4">
              <h2 className="text-sm font-semibold text-zinc-100">
                First Import Path
              </h2>
              <div className="mt-2 text-sm text-zinc-500">
                {importExperience.summary}
              </div>
              <div className="mt-4 grid gap-2">
                {importExperience.steps.map((step) => (
                  <div key={step.id} className="border-t border-zinc-900 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-zinc-300">
                        {step.label}
                      </span>
                      <span
                        className={`text-xs uppercase tracking-wide ${toneClass(step.status)}`}
                      >
                        {importStatusLabel(step.status)}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {step.detail}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="ti-panel p-4">
              <h2 className="text-sm font-semibold text-zinc-100">
                Trade Repair Inbox
              </h2>
              <div className="mt-2 text-sm text-zinc-500">
                {repairInbox.nextAction}
              </div>
              <div className="mt-4 grid gap-3">
                {repairInbox.items.length === 0 ? (
                  <div className="text-sm text-zinc-500">
                    No repair items in the current import preview.
                  </div>
                ) : (
                  repairInbox.items.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      className="border-t border-zinc-900 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-zinc-300">
                          {item.title}
                        </span>
                        <span className="text-xs uppercase tracking-wide text-zinc-500">
                          {importRepairSeverityLabel(item.severity)}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {item.issueSummary}
                      </div>
                      <div className="mt-2 text-xs text-sky-300">
                        {item.suggestedFix}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)]">
            <div className="ti-panel p-4">
              <h2 className="text-sm font-semibold text-zinc-100">
                Column Mapping
              </h2>
              <div className="mt-4 grid gap-2">
                {view.columnMappingRows.map((row) => (
                  <div
                    key={`${row.field}:${row.header ?? "missing"}`}
                    className="flex items-center justify-between gap-3 border-t border-zinc-900 py-2"
                  >
                    <span className="text-xs text-zinc-400">{row.field}</span>
                    <span
                      className={`text-xs ${
                        row.status === "mapped"
                          ? "text-emerald-300"
                          : "text-rose-300"
                      }`}
                    >
                      {row.header ?? "missing"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="ti-panel p-4">
              <h2 className="text-sm font-semibold text-zinc-100">
                Repair Workflow
              </h2>
              <div className="mt-4 grid gap-3">
                {diagnostics.repairWorkflow.items.length === 0 ? (
                  <div className="text-sm text-zinc-500">
                    No repair items for this sample import.
                  </div>
                ) : (
                  diagnostics.repairWorkflow.items.map((item) => (
                    <div
                      key={item.id}
                      className="border-t border-zinc-900 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-zinc-200">
                          {item.title}
                        </span>
                        <span className="text-xs uppercase tracking-wide text-zinc-500">
                          {importRepairSeverityLabel(item.severity)}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {item.suggestedFix}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="ti-panel p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Trade Reconstruction Preview
            </h2>
            <div className="mt-4 grid gap-4">
              {diagnostics.reconstructionPreview.items.map((item) => (
                <div
                  key={item.requestIndex}
                  className="border-t border-zinc-900 py-4"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-medium text-zinc-100">
                        {item.symbol} /{" "}
                        {importTradeDirectionLabel(item.tradeDirection)}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {importStatusLabel(item.lifecycleStatus)} /{" "}
                        {item.groupingReason}
                      </div>
                    </div>
                    <div className="font-mono text-sm text-zinc-400">
                      {item.estimatedNetPnl === null
                        ? "P/L n/a"
                        : `${item.estimatedNetPnl >= 0 ? "+" : ""}${item.estimatedNetPnl.toFixed(2)}`}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2">
                    {item.timeline.map((step) => (
                      <div
                        key={step.index}
                        className="grid gap-2 text-xs md:grid-cols-[170px_70px_90px_90px_1fr] md:items-center"
                      >
                        <span className="font-mono text-zinc-500">
                          {step.timestamp}
                        </span>
                        <span className="uppercase text-zinc-300">
                          {step.side}
                        </span>
                        <span className="text-zinc-500">
                          {step.shares} shares
                        </span>
                        <span className="text-zinc-500">
                          ${step.price.toFixed(2)}
                        </span>
                        <span className="text-zinc-400">
                          position {step.positionAfterExecution}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </AdvancedDisclosure>
      </div>
    </main>
  );
}
