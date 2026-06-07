import {
  buildSavedReviewQueueLevelFactsReadModel,
  type SavedReviewQueueLevelFactsReadModel,
} from "./level-analysis-review-queue-linking-contract";
import {
  SqliteJournalLevelAnalysisTradeLinkRepository,
  type JournalLevelAnalysisTradeLinkRepository,
  type TradeLinkJournalScope,
} from "./level-analysis-journal-delivery-trade-link-storage";
import {
  DEMO_ACCOUNT_ID,
  DEMO_USER_ID,
  DEMO_WORKSPACE_ID,
} from "../trader-analytics/product/import-commit/sqlite-import-commit-repository";

export const LEVEL_ANALYSIS_REVIEW_QUEUE_LEVEL_FACTS_FEATURE_FLAG =
  "LEVEL_ANALYSIS_JOURNAL_REVIEW_QUEUE_LEVEL_FACTS_ENABLED";

function envEnabled(value: string | undefined): boolean {
  return value === "1" || value?.toLowerCase() === "true";
}

export function isLevelAnalysisReviewQueueLevelFactsEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return envEnabled(env[LEVEL_ANALYSIS_REVIEW_QUEUE_LEVEL_FACTS_FEATURE_FLAG]);
}

export function buildSavedReviewQueueLevelFactsReadModelFromRepository(args: {
  tradeIds: string[];
  journalScope?: TradeLinkJournalScope;
  featureEnabled?: boolean;
  tradeLinkRepository?: JournalLevelAnalysisTradeLinkRepository;
}): SavedReviewQueueLevelFactsReadModel {
  const featureEnabled =
    args.featureEnabled ?? isLevelAnalysisReviewQueueLevelFactsEnabled();

  if (!featureEnabled || args.tradeIds.length === 0) {
    return buildSavedReviewQueueLevelFactsReadModel({
      tradeIds: args.tradeIds,
      featureEnabled,
    });
  }

  const tradeLinkRepository =
    args.tradeLinkRepository ?? new SqliteJournalLevelAnalysisTradeLinkRepository();
  const journalScope = args.journalScope ?? {
    workspaceId: DEMO_WORKSPACE_ID,
    accountId: DEMO_ACCOUNT_ID,
    userId: DEMO_USER_ID,
  };

  return buildSavedReviewQueueLevelFactsReadModel({
    tradeIds: args.tradeIds,
    linksByTradeId: tradeLinkRepository.getLatestTradeLinksForSavedTrades({
      savedTradeIds: args.tradeIds,
      ...journalScope,
    }),
    featureEnabled: true,
  });
}
