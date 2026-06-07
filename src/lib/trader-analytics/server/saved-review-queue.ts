import type {
  PersistedDecisionReviewDiagnostic,
  PersistedDecisionReviewSnapshot,
  SqliteImportCommitRepository,
} from "../product/import-commit/sqlite-import-commit-repository";
import {
  DEMO_ACCOUNT_ID,
  DEMO_USER_ID,
  DEMO_WORKSPACE_ID,
} from "../product/import-commit/sqlite-import-commit-repository";
import type {
  ImportCommitDecisionReviewJobRecord,
  ImportCommitSavedTradeRecord,
} from "../product/import-commit/import-commit-planner";
import type { SavedExecutionTrade } from "../product/types";
import { getLatestSavedTraderAnalyticsReport } from "../product/selectors";
import { mapDecisionReviewInsightForUser } from "../../user-facing-behavior";
import type { UserFacingDecisionReviewInsight } from "../../user-facing-behavior";
import {
  buildSavedReviewQueueLevelFactsReadModelFromRepository,
} from "../../level-analysis/level-analysis-review-queue-linking-read-model";
import type {
  SavedReviewQueueLevelFactsReadModel,
  SavedReviewQueueLevelFactsState,
} from "../../level-analysis/level-analysis-review-queue-linking-contract";
import type {
  JournalLevelAnalysisTradeLinkRepository,
} from "../../level-analysis/level-analysis-journal-delivery-trade-link-storage";

export type SavedReviewQueueFilter =
  | "all"
  | "completed"
  | "market_context_unavailable"
  | "blocked_open_trade"
  | "analysis_failed"
  | "highest_priority"
  | "queued"
  | "unresolved";

export interface SavedReviewQueueTab {
  id: SavedReviewQueueFilter;
  label: string;
  count: number;
  href: string;
}

export interface SavedReviewQueueItem {
  id: string;
  savedTradeId: string;
  importBatchId: string;
  symbol: string;
  status: ImportCommitDecisionReviewJobRecord["status"];
  lane:
    | "completed"
    | "blocked_open_trade"
    | "market_context_unavailable"
    | "analysis_failed"
    | "queued"
    | "skipped_limit";
  stateLabel: string;
  stateDetail: string;
  reviewScopeLabel: string;
  title: string;
  detail: string;
  nextAction: string;
  href: string;
  priorityScore: number;
  priorityLabel: "urgent" | "high" | "medium" | "low";
  priorityReason: string;
  marketContextSource: string;
  chartFindingCount: number;
  chartRiskCount: number;
  chartStrengthCount: number;
  chartReviewPromptCount: number;
  primaryChartFindingLabel: string | null;
  primaryChartFindingAction: string | null;
  grossRealizedPnl: number | null;
  reviewStatus: string;
  notesCount: number;
  hasSnapshot: boolean;
  hasDiagnostics: boolean;
  generatedAt: string | null;
  levelFacts: SavedReviewQueueLevelFactsState;
}

export interface SavedReviewQueueReadModel {
  contractVersion: "saved_review_queue_read_model_v1";
  source: "saved_sqlite";
  importBatchId: string | null;
  activeFilter: SavedReviewQueueFilter;
  tabs: SavedReviewQueueTab[];
  items: SavedReviewQueueItem[];
  allItems: SavedReviewQueueItem[];
  levelFacts: SavedReviewQueueLevelFactsReadModel;
  emptyState: {
    kind: "no_saved_import" | "no_saved_review_jobs" | "filter_empty" | "ready";
    title: string;
    body: string;
  };
}

const FILTER_LABELS: Record<SavedReviewQueueFilter, string> = {
  all: "All",
  completed: "Reviewed With Chart Data",
  market_context_unavailable: "Chart data still missing",
  blocked_open_trade: "Open Trades",
  analysis_failed: "Needs Technical Follow-Up",
  highest_priority: "Highest Priority",
  queued: "Chart Data Waiting",
  unresolved: "Needs Review",
};

function normalizeFilter(
  value: string | null | undefined,
): SavedReviewQueueFilter {
  return value && value in FILTER_LABELS
    ? (value as SavedReviewQueueFilter)
    : "highest_priority";
}

function priorityLabel(score: number): SavedReviewQueueItem["priorityLabel"] {
  if (score >= 90) {
    return "urgent";
  }

  if (score >= 75) {
    return "high";
  }

  if (score >= 50) {
    return "medium";
  }

  return "low";
}

function chartFindingsForSnapshot(
  snapshot: PersistedDecisionReviewSnapshot,
): UserFacingDecisionReviewInsight[] {
  return snapshot.review.insights
    .map((insight) => mapDecisionReviewInsightForUser(insight, "/intelligence/review"))
    .filter(
      (insight) =>
        insight.canShowPrimary && insight.evidenceChannel !== "execution_only",
    );
}

function primaryChartFinding(
  findings: UserFacingDecisionReviewInsight[],
): UserFacingDecisionReviewInsight | null {
  return (
    findings.find(
      (finding) =>
        finding.canDrivePrimaryConclusion &&
        finding.opportunityType === "risk_to_reduce",
    ) ??
    findings.find(
      (finding) =>
        finding.canDrivePrimaryConclusion &&
        finding.opportunityType === "strength_to_repeat",
    ) ??
    findings.find((finding) => finding.opportunityType === "review_prompt") ??
    null
  );
}

function snapshotPriority(snapshot: PersistedDecisionReviewSnapshot): {
  score: number;
  reason: string;
} {
  const findings = chartFindingsForSnapshot(snapshot);
  const primary = primaryChartFinding(findings);
  const riskCount = findings.filter(
    (finding) =>
      finding.canDrivePrimaryConclusion &&
      finding.opportunityType === "risk_to_reduce",
  ).length;
  const strengthCount = findings.filter(
    (finding) =>
      finding.canDrivePrimaryConclusion &&
      finding.opportunityType === "strength_to_repeat",
  ).length;
  const promptCount = findings.filter(
    (finding) => finding.opportunityType === "review_prompt",
  ).length;

  if (riskCount > 0) {
    return {
      score: Math.min(85, 62 + riskCount * 7),
      reason: primary
        ? `${riskCount} chart-backed risk${
            riskCount === 1 ? "" : "s"
          } to review. Start with: ${primary.label}.`
        : `${riskCount} chart-backed risk${
            riskCount === 1 ? "" : "s"
          } need review.`,
    };
  }

  if (strengthCount > 0) {
    return {
      score: 48,
      reason: primary
        ? `Chart-backed strength ready to repeat: ${primary.label}.`
        : "Chart-backed strength is ready for normal review rotation.",
    };
  }

  if (promptCount > 0) {
    return {
      score: 44,
      reason: primary
        ? `Chart evidence has a supporting review prompt: ${primary.label}.`
        : "Chart evidence has supporting measurements for review.",
    };
  }

  return {
    score: 42,
    reason: "Completed review is ready for normal review rotation.",
  };
}

function diagnosticPriority(
  diagnostic: PersistedDecisionReviewDiagnostic | null,
  status: ImportCommitDecisionReviewJobRecord["status"],
): { score: number; reason: string } {
  if (status === "analysis_failed") {
    return {
      score: 96,
      reason: "Technical follow-up is needed before chart feedback is trusted.",
    };
  }

  if (status === "market_context_unavailable") {
    return {
      score: 90,
      reason:
        "Execution review is available now; chart, level, or volume evidence is still missing.",
    };
  }

  if (status === "blocked_open_trade") {
    return {
      score: 76,
      reason: "Open trade is saved but blocked from completed-trade coaching.",
    };
  }

  if (status === "skipped_limit") {
    return {
      score: 58,
      reason: "Review run limit skipped this trade before analysis.",
    };
  }

  return {
    score: diagnostic ? 70 : 52,
    reason: diagnostic
      ? "Technical follow-up is needed before chart feedback is trusted."
      : "Queued trade is waiting for chart-data review.",
  };
}

function laneForStatus(
  status: ImportCommitDecisionReviewJobRecord["status"],
): SavedReviewQueueItem["lane"] {
  if (status === "completed") {
    return "completed";
  }

  if (status === "blocked_open_trade") {
    return "blocked_open_trade";
  }

  if (status === "market_context_unavailable") {
    return "market_context_unavailable";
  }

  if (status === "analysis_failed") {
    return "analysis_failed";
  }

  if (status === "skipped_limit") {
    return "skipped_limit";
  }

  return "queued";
}

function queueStateCopy(lane: SavedReviewQueueItem["lane"]): {
  stateLabel: string;
  stateDetail: string;
  reviewScopeLabel: string;
  nextAction: string;
} {
  switch (lane) {
    case "completed":
      return {
        stateLabel: "Execution review is available",
        stateDetail:
          "Chart review completed. Use the saved snapshot with the execution replay.",
        reviewScopeLabel: "chart review",
        nextAction:
          "Open the trade detail and complete the saved review checklist.",
      };
    case "blocked_open_trade":
      return {
        stateLabel: "Open trade",
        stateDetail:
          "The position was still open at the end of the import, so completed-trade review waits until the trade is flat.",
        reviewScopeLabel: "open trade, execution-only",
        nextAction:
          "Keep the trade saved, then review the completed trade once the position is flat.",
      };
    case "market_context_unavailable":
      return {
        stateLabel: "Chart data still missing",
        stateDetail:
          "Execution review is available, but chart, level, or volume evidence is still missing.",
        reviewScopeLabel: "execution-only",
        nextAction:
          "Review entries, adds, reductions, exits, timing, and P/L now; add chart data later.",
      };
    case "analysis_failed":
      return {
        stateLabel: "Needs technical follow-up",
        stateDetail:
          "Execution review is available, but chart analysis needs a technical follow-up before that feedback is trusted.",
        reviewScopeLabel: "execution-only fallback",
        nextAction:
          "Use the execution replay now and keep chart evidence conclusions unavailable until the technical follow-up is resolved.",
      };
    case "skipped_limit":
      return {
        stateLabel: "Review skipped",
        stateDetail:
          "This trade was saved, but chart-data review did not finish yet.",
        reviewScopeLabel: "waiting for review",
        nextAction: "Refresh chart-data review when market context is ready.",
      };
    case "queued":
      return {
        stateLabel: "Chart data waiting",
        stateDetail:
          "Execution review is available now. Chart evidence has not been attached to this saved trade yet.",
        reviewScopeLabel: "execution now, chart data waiting",
        nextAction:
          "Open the execution review now, or resume chart-data review from the saved import details.",
      };
  }
}

function reportPnl(args: {
  trade: SavedExecutionTrade | undefined;
  repository: SqliteImportCommitRepository;
}): number | null {
  if (!args.trade) {
    return null;
  }

  const latest = getLatestSavedTraderAnalyticsReport(
    args.repository.listReports(args.trade.userId),
  );
  const row = latest?.report.trades.find(
    (candidate) =>
      candidate.symbol === args.trade?.symbol &&
      candidate.sessionDate === args.trade?.sessionDate &&
      candidate.tradeDirection === args.trade?.tradeDirection,
  );

  return typeof row?.grossRealizedPnl === "number"
    ? row.grossRealizedPnl
    : null;
}

function buildQueueItem(args: {
  job: ImportCommitDecisionReviewJobRecord;
  savedTrade: ImportCommitSavedTradeRecord | undefined;
  trade: SavedExecutionTrade | undefined;
  snapshot: PersistedDecisionReviewSnapshot | undefined;
  diagnostic: PersistedDecisionReviewDiagnostic | undefined;
  repository: SqliteImportCommitRepository;
  levelFactsByTradeId: Record<string, SavedReviewQueueLevelFactsState>;
}): SavedReviewQueueItem {
  const lane = laneForStatus(args.job.status);
  const snapshotScore = args.snapshot ? snapshotPriority(args.snapshot) : null;
  const diagnosticScore = !args.snapshot
    ? diagnosticPriority(args.diagnostic ?? null, args.job.status)
    : null;
  const priority = snapshotScore ??
    diagnosticScore ?? {
      score: 50,
      reason: "Review item is ready for triage.",
    };
  const symbol =
    args.trade?.symbol ?? args.savedTrade?.symbol ?? args.job.symbol;
  const stateCopy = queueStateCopy(lane);
  const chartFindings = args.snapshot
    ? chartFindingsForSnapshot(args.snapshot)
    : [];
  const chartPrimary = primaryChartFinding(chartFindings);
  const chartRiskCount = chartFindings.filter(
    (finding) =>
      finding.canDrivePrimaryConclusion &&
      finding.opportunityType === "risk_to_reduce",
  ).length;
  const chartStrengthCount = chartFindings.filter(
    (finding) =>
      finding.canDrivePrimaryConclusion &&
      finding.opportunityType === "strength_to_repeat",
  ).length;
  const chartReviewPromptCount = chartFindings.filter(
    (finding) => finding.opportunityType === "review_prompt",
  ).length;
  const headline = chartPrimary
    ? `${chartPrimary.label}. ${chartPrimary.detail}`
    : (args.snapshot?.review.coachingHeadline ?? stateCopy.stateDetail);
  const levelFacts = args.levelFactsByTradeId[args.job.savedTradeId];

  return {
    id: args.job.id,
    savedTradeId: args.job.savedTradeId,
    importBatchId: args.job.importBatchId,
    symbol,
    status: args.job.status,
    lane,
    stateLabel: stateCopy.stateLabel,
    stateDetail: stateCopy.stateDetail,
    reviewScopeLabel: stateCopy.reviewScopeLabel,
    title: `${symbol} trade review`,
    detail: headline,
    nextAction: stateCopy.nextAction,
    href: `/intelligence/trades/${encodeURIComponent(args.job.savedTradeId)}?from=review-queue&queue=${lane}`,
    priorityScore: priority.score,
    priorityLabel: priorityLabel(priority.score),
    priorityReason: priority.reason,
    marketContextSource:
      args.snapshot?.review.marketContextSource ??
      args.diagnostic?.code ??
      "none",
    chartFindingCount: chartFindings.length,
    chartRiskCount,
    chartStrengthCount,
    chartReviewPromptCount,
    primaryChartFindingLabel: chartPrimary?.label ?? null,
    primaryChartFindingAction: chartPrimary?.reviewAction ?? null,
    grossRealizedPnl: reportPnl({
      trade: args.trade,
      repository: args.repository,
    }),
    reviewStatus: args.trade?.reviewStatus ?? "new",
    notesCount: args.trade?.notes.length ?? 0,
    hasSnapshot: Boolean(args.snapshot),
    hasDiagnostics: Boolean(args.diagnostic),
    generatedAt:
      args.snapshot?.generatedAt ?? args.diagnostic?.generatedAt ?? null,
    levelFacts,
  };
}

function filterItems(
  items: SavedReviewQueueItem[],
  filter: SavedReviewQueueFilter,
): SavedReviewQueueItem[] {
  if (filter === "all") {
    return items;
  }

  if (filter === "highest_priority") {
    return items
      .filter(
        (item) =>
          item.priorityScore >= 75 &&
          item.reviewStatus !== "resolved" &&
          item.reviewStatus !== "ignored" &&
          item.reviewStatus !== "reviewed",
      )
      .sort(
        (a, b) =>
          b.priorityScore - a.priorityScore || a.symbol.localeCompare(b.symbol),
      );
  }

  if (filter === "unresolved") {
    return items.filter(
      (item) =>
        item.reviewStatus !== "resolved" &&
        item.reviewStatus !== "ignored" &&
        item.reviewStatus !== "reviewed",
    );
  }

  return items.filter((item) => item.lane === filter);
}

function emptyState(args: {
  importBatchId: string | null;
  allCount: number;
  filteredCount: number;
}): SavedReviewQueueReadModel["emptyState"] {
  if (!args.importBatchId) {
    return {
      kind: "no_saved_import",
      title: "No saved import yet",
      body: "Start with one broker CSV import. After it is saved, this queue will show the trades that most need review.",
    };
  }

  if (args.allCount === 0) {
    return {
      kind: "no_saved_review_jobs",
      title: "No saved chart-review work",
      body: "Saved trades exist, but this import did not create chart-review queue items. Open saved trades for execution review.",
    };
  }

  if (args.filteredCount === 0) {
    return {
      kind: "filter_empty",
      title: "No trades in this queue",
      body: "Try another queue lane, open all saved trades, or save another import with matching review work.",
    };
  }

  return {
    kind: "ready",
    title: "Review queue ready",
    body: "Open a trade and work the highest-value review item first.",
  };
}

export function buildSavedReviewQueueReadModel(args: {
  repository: SqliteImportCommitRepository;
  accountId?: string;
  userId?: string;
  activeFilter?: string | null;
  levelFactsFeatureEnabled?: boolean;
  levelFactsTradeLinkRepository?: JournalLevelAnalysisTradeLinkRepository;
}): SavedReviewQueueReadModel {
  const accountId = args.accountId ?? DEMO_ACCOUNT_ID;
  const userId = args.userId ?? DEMO_USER_ID;
  const activeFilter = normalizeFilter(args.activeFilter);
  const batch = args.repository.getLatestCommittedBatch(accountId);

  if (!batch) {
    const levelFacts = buildSavedReviewQueueLevelFactsReadModelFromRepository({
      tradeIds: [],
      journalScope: {
        workspaceId: DEMO_WORKSPACE_ID,
        accountId,
        userId,
      },
      featureEnabled: args.levelFactsFeatureEnabled,
      tradeLinkRepository: args.levelFactsTradeLinkRepository,
    });

    return {
      contractVersion: "saved_review_queue_read_model_v1",
      source: "saved_sqlite",
      importBatchId: null,
      activeFilter,
      tabs: (Object.keys(FILTER_LABELS) as SavedReviewQueueFilter[]).map(
        (id) => ({
          id,
          label: FILTER_LABELS[id],
          count: 0,
          href: `/intelligence/review?queue=${id}`,
        }),
      ),
      items: [],
      allItems: [],
      levelFacts,
      emptyState: emptyState({
        importBatchId: null,
        allCount: 0,
        filteredCount: 0,
      }),
    };
  }

  const jobs = args.repository.listDecisionReviewJobs(batch.id);
  const levelFacts =
    buildSavedReviewQueueLevelFactsReadModelFromRepository({
      tradeIds: jobs.map((job) => job.savedTradeId),
      journalScope: {
        workspaceId: batch.workspaceId,
        accountId,
        userId,
      },
      featureEnabled: args.levelFactsFeatureEnabled,
      tradeLinkRepository: args.levelFactsTradeLinkRepository,
    });
  const savedTrades = new Map(
    args.repository
      .listSavedTrades(accountId)
      .map((trade) => [trade.id, trade]),
  );
  const trades = new Map(
    args.repository.listTrades(userId).map((trade) => [trade.id, trade]),
  );
  const snapshots = new Map(
    args.repository
      .listDecisionReviewSnapshotsForBatch(batch.id)
      .map((snapshot) => [snapshot.savedTradeId, snapshot]),
  );
  const diagnosticsByTrade = new Map<
    string,
    PersistedDecisionReviewDiagnostic
  >();

  for (const diagnostic of args.repository.listDecisionReviewDiagnosticsForBatch(
    batch.id,
  )) {
    if (
      diagnostic.savedTradeId &&
      !diagnosticsByTrade.has(diagnostic.savedTradeId)
    ) {
      diagnosticsByTrade.set(diagnostic.savedTradeId, diagnostic);
    }
  }

  const allItems = jobs
    .map((job) =>
      buildQueueItem({
        job,
        savedTrade: savedTrades.get(job.savedTradeId),
        trade: trades.get(job.savedTradeId),
        snapshot: snapshots.get(job.savedTradeId),
        diagnostic: diagnosticsByTrade.get(job.savedTradeId),
        repository: args.repository,
        levelFactsByTradeId: levelFacts.statesByTradeId,
      }),
    )
    .sort(
      (a, b) =>
        b.priorityScore - a.priorityScore ||
        (b.generatedAt ?? "").localeCompare(a.generatedAt ?? "") ||
        a.symbol.localeCompare(b.symbol),
    );
  const filtered = filterItems(allItems, activeFilter);
  const tabs = (Object.keys(FILTER_LABELS) as SavedReviewQueueFilter[]).map(
    (id) => ({
      id,
      label: FILTER_LABELS[id],
      count: filterItems(allItems, id).length,
      href: `/intelligence/review?queue=${id}`,
    }),
  );

  return {
    contractVersion: "saved_review_queue_read_model_v1",
    source: "saved_sqlite",
    importBatchId: batch.id,
    activeFilter,
    tabs,
    items: filtered,
    allItems,
    levelFacts,
    emptyState: emptyState({
      importBatchId: batch.id,
      allCount: allItems.length,
      filteredCount: filtered.length,
    }),
  };
}
