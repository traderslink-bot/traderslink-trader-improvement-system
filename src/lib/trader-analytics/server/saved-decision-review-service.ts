import type { LevelsSystemRuntimeConfig } from "../../support-resistance/levels-system-runtime-options";
import { runBatchTradeAnalysis } from "../../trade-analysis/batch/run-trade-analysis-batch";
import type { BatchTradeAnalysisResult } from "../../trade-analysis/batch/run-trade-analysis-batch";
import type {
  ImportCommitDecisionReviewJobRecord,
  ImportCommitSavedTradeRecord,
} from "../product/import-commit/import-commit-planner";
import {
  DEMO_ACCOUNT_ID,
  DEMO_USER_ID,
  type PersistedDecisionReviewDiagnostic,
  type PersistedDecisionReviewSnapshot,
  SqliteImportCommitRepository,
} from "../product/import-commit/sqlite-import-commit-repository";
import { buildDecisionReviewSnapshotFromTradeAnalysisSummary } from "./build-csv-dry-run-decision-review-bridge";

export interface PersistedDecisionReviewRunResult {
  contractVersion: "persisted_decision_review_run_v1";
  importBatchId: string;
  requestedJobCount: number;
  eligibleJobCount: number;
  completedSnapshotCount: number;
  diagnosticCount: number;
  statusCounts: Record<string, number>;
  marketContextSourceCounts: Record<string, number>;
}

export interface SavedDecisionReviewReadModel {
  contractVersion: "saved_decision_review_read_model_v1";
  source: "saved_sqlite";
  importBatchId: string | null;
  totalJobCount: number;
  queuedCount: number;
  completedCount: number;
  blockedOpenTradeCount: number;
  marketContextUnavailableCount: number;
  analysisFailedCount: number;
  skippedLimitCount: number;
  statusCounts: Record<string, number>;
  diagnosticCodeCounts: Record<string, number>;
  diagnosticStatusCounts: Record<string, number>;
  snapshots: PersistedDecisionReviewSnapshot[];
  diagnostics: PersistedDecisionReviewDiagnostic[];
  jobs: ImportCommitDecisionReviewJobRecord[];
  nextAction: string;
}

function increment(counts: Record<string, number>, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

function countValues(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    increment(counts, value);
    return counts;
  }, {});
}

function jobStatusForFailure(
  code: string | undefined,
): Extract<
  ImportCommitDecisionReviewJobRecord["status"],
  "market_context_unavailable" | "analysis_failed"
> {
  return isMarketContextUnavailableFailure(code)
    ? "market_context_unavailable"
    : "analysis_failed";
}

function diagnosticCodeForFailure(code: string | undefined): string {
  return isMarketContextUnavailableFailure(code)
    ? "market_context_unavailable"
    : "analysis_failed";
}

function isMarketContextUnavailableFailure(code: string | undefined): boolean {
  return (
    code === "insufficient_market_context" ||
    code === "insufficient_trade_window" ||
    code === "no_candles_found" ||
    code === "provider_timeout"
  );
}

function snapshotNeedsReplayCandleRefresh(
  snapshot: PersistedDecisionReviewSnapshot | undefined,
): boolean {
  if (!snapshot) {
    return true;
  }

  return (
    snapshot.review.tradeWindowEvidenceSource ===
      "levels_system_trade_window" && !snapshot.review.replayCandleWindow
  );
}

function diagnosticRecord(args: {
  accountId: string;
  userId: string;
  job: ImportCommitDecisionReviewJobRecord;
  trade: ImportCommitSavedTradeRecord | null;
  status: PersistedDecisionReviewDiagnostic["status"];
  code: string;
  message: string;
  generatedAt: string;
}): PersistedDecisionReviewDiagnostic {
  return {
    id: `${args.job.id}:diagnostic:${args.code}`,
    accountId: args.accountId,
    userId: args.userId,
    savedTradeId: args.job.savedTradeId,
    importBatchId: args.job.importBatchId,
    requestIndex: args.trade?.requestIndex ?? null,
    symbol: args.job.symbol,
    status: args.status,
    code: args.code,
    message: args.message,
    generatedAt: args.generatedAt,
  };
}

export async function runPersistedDecisionReviewJobs(args: {
  repository: SqliteImportCommitRepository;
  importBatchId: string;
  accountId?: string;
  userId?: string;
  levelsSystem?: LevelsSystemRuntimeConfig;
  generatedAt?: string;
  maxTrades?: number;
  deferRemaining?: boolean;
  refreshMissingReplayCandleWindows?: boolean;
  retryFailedChartDataReview?: boolean;
  savedTradeIds?: string[];
  runBatch?: typeof runBatchTradeAnalysis;
}): Promise<PersistedDecisionReviewRunResult> {
  const importBatch = args.repository.getImportBatch(args.importBatchId);
  const accountId = args.accountId ?? importBatch?.accountId ?? DEMO_ACCOUNT_ID;
  const userId = args.userId ?? importBatch?.userId ?? DEMO_USER_ID;
  const generatedAt = args.generatedAt ?? new Date().toISOString();
  const jobs = args.repository.listDecisionReviewJobs(args.importBatchId);
  const snapshotsByTradeId = new Map(
    args.repository
      .listDecisionReviewSnapshotsForBatch(args.importBatchId)
      .map((snapshot) => [snapshot.savedTradeId, snapshot]),
  );
  const trades = new Map(
    args.repository
      .listSavedTrades(accountId)
      .filter((trade) => trade.importBatchId === args.importBatchId)
      .map((trade) => [trade.id, trade]),
  );
  const statusCounts: Record<string, number> = {};
  const marketContextSourceCounts: Record<string, number> = {};
  const savedTradeIdFilter =
    args.savedTradeIds && args.savedTradeIds.length > 0
      ? new Set(args.savedTradeIds)
      : null;
  const eligible = jobs.filter((job) => {
    if (savedTradeIdFilter && !savedTradeIdFilter.has(job.savedTradeId)) {
      return false;
    }

    if (job.status === "blocked_open_trade") {
      increment(statusCounts, job.status);
      const trade = trades.get(job.savedTradeId) ?? null;
      args.repository.saveDecisionReviewDiagnostic(
        diagnosticRecord({
          accountId,
          userId,
          job,
          trade,
          status: "blocked_open_trade",
          code: "blocked_open_trade",
          message: job.reason,
          generatedAt,
        }),
      );
      return false;
    }

    if (
      job.status === "completed" &&
      args.refreshMissingReplayCandleWindows &&
      snapshotNeedsReplayCandleRefresh(snapshotsByTradeId.get(job.savedTradeId))
    ) {
      return true;
    }

    if (
      args.retryFailedChartDataReview &&
      (job.status === "analysis_failed" ||
        job.status === "market_context_unavailable")
    ) {
      return true;
    }

    if (job.status !== "queued") {
      increment(statusCounts, job.status);
      return false;
    }

    return true;
  });
  const selected =
    args.maxTrades === undefined ? eligible : eligible.slice(0, args.maxTrades);

  for (const skipped of eligible.slice(selected.length)) {
    if (skipped.status !== "queued") {
      increment(statusCounts, skipped.status);
      continue;
    }

    if (args.deferRemaining) {
      increment(statusCounts, skipped.status);
      continue;
    }

    const trade = trades.get(skipped.savedTradeId) ?? null;
    const updated: ImportCommitDecisionReviewJobRecord = {
      ...skipped,
      status: "skipped_limit",
      reason: "Decision-review run limit reached before this queued trade.",
    };
    args.repository.updateDecisionReviewJob(updated);
    increment(statusCounts, updated.status);
    args.repository.saveDecisionReviewDiagnostic(
      diagnosticRecord({
        accountId,
        userId,
        job: updated,
        trade,
        status: "skipped_limit",
        code: "skipped_limit",
        message: updated.reason,
        generatedAt,
      }),
    );
  }

  const selectedTrades = selected
    .map((job) => ({ job, trade: trades.get(job.savedTradeId) ?? null }))
    .filter(
      (
        item,
      ): item is {
        job: ImportCommitDecisionReviewJobRecord;
        trade: ImportCommitSavedTradeRecord;
      } => Boolean(item.trade),
    );
  const missingTradeJobs = selected.filter(
    (job) => !trades.has(job.savedTradeId),
  );

  for (const missing of missingTradeJobs) {
    const updated: ImportCommitDecisionReviewJobRecord = {
      ...missing,
      status: "analysis_failed",
      reason: "Saved trade record was not found for queued decision review.",
    };

    args.repository.updateDecisionReviewJob(updated);
    increment(statusCounts, updated.status);
    args.repository.saveDecisionReviewDiagnostic(
      diagnosticRecord({
        accountId,
        userId,
        job: updated,
        trade: null,
        status: "analysis_failed",
        code: "saved_trade_missing",
        message: updated.reason,
        generatedAt,
      }),
    );
  }

  if (selectedTrades.length === 0) {
    return {
      contractVersion: "persisted_decision_review_run_v1",
      importBatchId: args.importBatchId,
      requestedJobCount: jobs.length,
      eligibleJobCount: eligible.length,
      completedSnapshotCount:
        args.repository.listDecisionReviewSnapshotsForBatch(args.importBatchId)
          .length,
      diagnosticCount: args.repository.listDecisionReviewDiagnosticsForBatch(
        args.importBatchId,
      ).length,
      statusCounts,
      marketContextSourceCounts,
    };
  }

  const batchRunner = args.runBatch ?? runBatchTradeAnalysis;
  const batch: BatchTradeAnalysisResult = await batchRunner({
    source: "server:saved-import-decision-review",
    requests: selectedTrades.map((item) => item.trade.request),
    levelsSystem: args.levelsSystem,
    generatedAt,
  });

  batch.items.forEach((item, index) => {
    const source = selectedTrades[index];

    if (!source) {
      return;
    }

    const { job, trade } = source;

    if (item.status !== "completed" || !item.summary) {
      const status = jobStatusForFailure(item.failure?.code);
      const updated: ImportCommitDecisionReviewJobRecord = {
        ...job,
        status,
        reason:
          item.failure?.message ??
          `${trade.symbol} did not complete saved chart review analysis.`,
      };

      args.repository.updateDecisionReviewJob(updated);
      increment(statusCounts, status);
      args.repository.saveDecisionReviewDiagnostic(
        diagnosticRecord({
          accountId,
          userId,
          job: updated,
          trade,
          status,
          code: diagnosticCodeForFailure(item.failure?.code),
          message: updated.reason,
          generatedAt,
        }),
      );
      return;
    }

    const review = buildDecisionReviewSnapshotFromTradeAnalysisSummary({
      tradeId: trade.id,
      requestIndex: trade.requestIndex,
      symbol: trade.symbol,
      summary: item.summary,
    });
    const snapshot: PersistedDecisionReviewSnapshot = {
      id: `${trade.id}:decision-review-snapshot`,
      accountId,
      userId,
      savedTradeId: trade.id,
      importBatchId: args.importBatchId,
      requestIndex: trade.requestIndex,
      symbol: trade.symbol,
      generatedAt,
      status: "completed",
      review,
    };
    const updated: ImportCommitDecisionReviewJobRecord = {
      ...job,
      status: "completed",
      reason: "Decision review completed and persisted.",
    };

    args.repository.deleteDecisionReviewDiagnosticsForTrade(trade.id);
    args.repository.saveDecisionReviewSnapshot(snapshot);
    args.repository.updateDecisionReviewJob(updated);
    increment(statusCounts, updated.status);
    increment(marketContextSourceCounts, review.marketContextSource ?? "none");
  });

  return {
    contractVersion: "persisted_decision_review_run_v1",
    importBatchId: args.importBatchId,
    requestedJobCount: jobs.length,
    eligibleJobCount: eligible.length,
    completedSnapshotCount: args.repository.listDecisionReviewSnapshotsForBatch(
      args.importBatchId,
    ).length,
    diagnosticCount: args.repository.listDecisionReviewDiagnosticsForBatch(
      args.importBatchId,
    ).length,
    statusCounts,
    marketContextSourceCounts,
  };
}

export function buildSavedDecisionReviewReadModel(args: {
  repository: SqliteImportCommitRepository;
  accountId?: string;
}): SavedDecisionReviewReadModel {
  const accountId = args.accountId ?? DEMO_ACCOUNT_ID;
  const batch = args.repository.getLatestCommittedBatch(accountId);

  if (!batch) {
    return {
      contractVersion: "saved_decision_review_read_model_v1",
      source: "saved_sqlite",
      importBatchId: null,
      totalJobCount: 0,
      queuedCount: 0,
      completedCount: 0,
      blockedOpenTradeCount: 0,
      marketContextUnavailableCount: 0,
      analysisFailedCount: 0,
      skippedLimitCount: 0,
      statusCounts: {},
      diagnosticCodeCounts: {},
      diagnosticStatusCounts: {},
      snapshots: [],
      diagnostics: [],
      jobs: [],
      nextAction: "Save an import before running decision review.",
    };
  }

  const jobs = args.repository.listDecisionReviewJobs(batch.id);
  const snapshots = args.repository.listDecisionReviewSnapshotsForBatch(
    batch.id,
  );
  const diagnostics = args.repository.listDecisionReviewDiagnosticsForBatch(
    batch.id,
  );
  const count = (status: ImportCommitDecisionReviewJobRecord["status"]) =>
    jobs.filter((job) => job.status === status).length;
  const queuedCount = count("queued");
  const completedCount = count("completed");
  const blockedOpenTradeCount = count("blocked_open_trade");
  const marketContextUnavailableCount = count("market_context_unavailable");
  const analysisFailedCount = count("analysis_failed");
  const skippedLimitCount = count("skipped_limit");
  const statusCounts = countValues(jobs.map((job) => job.status));
  const diagnosticCodeCounts = countValues(
    diagnostics.map((diagnostic) => diagnostic.code),
  );
  const diagnosticStatusCounts = countValues(
    diagnostics.map((diagnostic) => diagnostic.status),
  );

  return {
    contractVersion: "saved_decision_review_read_model_v1",
    source: "saved_sqlite",
    importBatchId: batch.id,
    totalJobCount: jobs.length,
    queuedCount,
    completedCount,
    blockedOpenTradeCount,
    marketContextUnavailableCount,
    analysisFailedCount,
    skippedLimitCount,
    statusCounts,
    diagnosticCodeCounts,
    diagnosticStatusCounts,
    snapshots,
    diagnostics,
    jobs,
    nextAction:
      queuedCount > 0
        ? "Run saved chart data review for queued closed trades."
        : analysisFailedCount > 0 || marketContextUnavailableCount > 0
          ? "Execution review is available now. Retry chart data review after market data is connected; keep support/resistance conclusions hidden until it completes."
          : completedCount > 0
            ? "Use saved chart evidence snapshots in guided review."
            : "Chart data review has no completed saved snapshots yet.",
  };
}
