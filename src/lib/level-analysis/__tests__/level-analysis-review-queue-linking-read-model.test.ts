import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import linkedTradeLinkFixture from "../__fixtures__/trade-link-contract/trade-link-record.linked.compact.json";
import blockedTradeLinkFixture from "../__fixtures__/trade-link-contract/trade-link-record.blocked.compact.json";
import oldSnapshotTradeLinkFixture from "../__fixtures__/trade-link-contract/trade-link-record.old-snapshot.compact.json";
import {
  buildSavedReviewQueueLevelFactsReadModelFromRepository,
  isLevelAnalysisReviewQueueLevelFactsEnabled,
  LEVEL_ANALYSIS_REVIEW_QUEUE_LEVEL_FACTS_FEATURE_FLAG,
} from "../level-analysis-review-queue-linking-read-model";
import {
  journalLevelAnalysisTradeLinkContainsRawPayload,
  type LinkedJournalLevelAnalysisTradeLinkRecord,
  type JournalLevelAnalysisTradeLinkRecord,
} from "../level-analysis-journal-delivery-trade-link-contract";
import {
  SqliteJournalLevelAnalysisTradeLinkRepository,
  type JournalLevelAnalysisTradeLinkRepository,
} from "../level-analysis-journal-delivery-trade-link-storage";
import {
  DEMO_ACCOUNT_ID,
  DEMO_USER_ID,
  DEMO_WORKSPACE_ID,
  SqliteImportCommitRepository,
} from "../../trader-analytics/product/import-commit/sqlite-import-commit-repository";
import {
  buildCsvDryRunImportExperience,
  buildImportCommitPlan,
} from "../../trader-analytics";
import {
  buildSavedReviewQueueReadModel,
} from "../../trader-analytics/server/saved-review-queue";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function collectObjectKeys(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectObjectKeys(item, out);
    }
    return out;
  }

  if (typeof value === "object" && value !== null) {
    for (const [key, item] of Object.entries(value)) {
      out.push(key);
      collectObjectKeys(item, out);
    }
  }

  return out;
}

function collectStringValues(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    out.push(value);
    return out;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectStringValues(item, out);
    }
    return out;
  }

  if (typeof value === "object" && value !== null) {
    for (const item of Object.values(value)) {
      collectStringValues(item, out);
    }
  }

  return out;
}

function expectNoLevelFactsAdviceLanguage(value: unknown): void {
  const text = collectStringValues(value).join("\n").toLowerCase();

  for (const [label, pattern] of [
    ["grading", /\bgrading\b|\btrade grade\b/],
    ["coaching", /\bcoaching\b|\bcoach\b/],
    ["p/l", /\bp\/l\b|\bpnl\b/],
    ["giveback", /\bgiveback\b/],
    ["behavior scoring", /\bbehavior score\b|\bbehavior scoring\b/],
    ["recommendation", /\brecommendation\b/],
    ["buy/sell/hold", /\bbuy\b|\bsell\b|\bhold\b/],
    ["entry decision", /\bentry decision\b/],
    ["exit decision", /\bexit decision\b/],
    ["trade advice", /\btrade advice\b/],
  ] as const) {
    expect(pattern.test(text), `Unexpected ${label} language`).toBe(false);
  }
}

function throwingTradeLinkRepository(): JournalLevelAnalysisTradeLinkRepository {
  return {
    saveTradeLinkRecord: () => {
      throw new Error("saveTradeLinkRecord should not be called.");
    },
    getTradeLinkRecord: () => {
      throw new Error("getTradeLinkRecord should not be called.");
    },
    getTradeLinkByIdempotency: () => {
      throw new Error("getTradeLinkByIdempotency should not be called.");
    },
    getLatestTradeLinkForSavedTrade: () => {
      throw new Error("getLatestTradeLinkForSavedTrade should not be called.");
    },
    getLatestTradeLinksForSavedTrades: () => {
      throw new Error("getLatestTradeLinksForSavedTrades should not be called.");
    },
  };
}

function sqliteTradeLinkRepository(): SqliteJournalLevelAnalysisTradeLinkRepository {
  return new SqliteJournalLevelAnalysisTradeLinkRepository(new Database(":memory:"));
}

function linkedFixtureForSavedTrade(
  savedTradeId: string,
  importBatchId: string,
): JournalLevelAnalysisTradeLinkRecord {
  return {
    ...(clone(linkedTradeLinkFixture) as JournalLevelAnalysisTradeLinkRecord),
    id: `jlatl_${savedTradeId}_lad_contract_DEVS_QUBT_2026_06_06T131000Z_DEVS`,
    savedTradeId,
    importBatchId,
  };
}

function planFor(csvText: string): {
  repository: SqliteImportCommitRepository;
  tradeLinkRepository: SqliteJournalLevelAnalysisTradeLinkRepository;
} {
  const db = new Database(":memory:");
  const repository = new SqliteImportCommitRepository(db);
  const tradeLinkRepository = new SqliteJournalLevelAnalysisTradeLinkRepository(db);
  const experience = buildCsvDryRunImportExperience({
    broker: "generic_execution_csv",
    csvText,
  });
  const plan = buildImportCommitPlan({
    workspaceId: DEMO_WORKSPACE_ID,
    userId: DEMO_USER_ID,
    accountId: DEMO_ACCOUNT_ID,
    experience,
    existingFileFingerprints: repository.listCommittedFileFingerprints(
      DEMO_ACCOUNT_ID,
    ),
    existingTradeFingerprints: repository.listCommittedTradeFingerprints(
      DEMO_ACCOUNT_ID,
    ),
    acknowledgements: {
      mappingReview: true,
      pnlReview: true,
    },
  });

  repository.commitImportPlan(plan);

  return { repository, tradeLinkRepository };
}

describe("level-analysis review queue linking read model implementation", () => {
  it("reads the display feature flag without enabling production output by default", () => {
    expect(
      isLevelAnalysisReviewQueueLevelFactsEnabled({
        [LEVEL_ANALYSIS_REVIEW_QUEUE_LEVEL_FACTS_FEATURE_FLAG]: "1",
      } as unknown as NodeJS.ProcessEnv),
    ).toBe(true);
    expect(
      isLevelAnalysisReviewQueueLevelFactsEnabled(
        {} as unknown as NodeJS.ProcessEnv,
      ),
    ).toBe(false);
  });

  it("returns feature-disabled queue states without reading the trade-link repository", () => {
    const readModel = buildSavedReviewQueueLevelFactsReadModelFromRepository({
      tradeIds: ["trade_A", "trade_B"],
      featureEnabled: false,
      tradeLinkRepository: throwingTradeLinkRepository(),
    });

    expect(readModel.featureEnabled).toBe(false);
    expect(readModel.counts.feature_disabled).toBe(2);
    expect(Object.values(readModel.statesByTradeId).map((state) => state.availability))
      .toEqual(["feature_disabled", "feature_disabled"]);
  });

  it("builds availability states from persisted latest trade links in one batch", () => {
    const repository = sqliteTradeLinkRepository();
    const linked = clone(linkedTradeLinkFixture) as JournalLevelAnalysisTradeLinkRecord;
    const blocked = clone(blockedTradeLinkFixture) as JournalLevelAnalysisTradeLinkRecord;

    repository.saveTradeLinkRecord(linked);
    repository.saveTradeLinkRecord(blocked);

    const readModel = buildSavedReviewQueueLevelFactsReadModelFromRepository({
      tradeIds: [
        linked.savedTradeId,
        blocked.savedTradeId,
        "trade_MISSING_2026_06_01_001",
      ],
      featureEnabled: true,
      tradeLinkRepository: repository,
    });

    expect(readModel.counts).toMatchObject({
      attached: 1,
      blocked_by_as_of_policy: 1,
      not_checked: 1,
    });
    expect(readModel.statesByTradeId[linked.savedTradeId]).toMatchObject({
      availability: "attached",
      rawPayloadHash: linked.rawPayloadHash,
      fifteenMinuteContextOnlyStatus: "context_only",
    });
    expect(readModel.statesByTradeId[blocked.savedTradeId]).toMatchObject({
      availability: "blocked_by_as_of_policy",
      linkId: blocked.id,
    });
    expect(readModel.statesByTradeId.trade_MISSING_2026_06_01_001).toMatchObject({
      availability: "not_checked",
    });
  });

  it("keeps old LevelAnalysisSnapshot v1 links available in batch reads", () => {
    const repository = sqliteTradeLinkRepository();
    const oldSnapshot =
      clone(oldSnapshotTradeLinkFixture) as JournalLevelAnalysisTradeLinkRecord;

    repository.saveTradeLinkRecord(oldSnapshot);

    const readModel = buildSavedReviewQueueLevelFactsReadModelFromRepository({
      tradeIds: [oldSnapshot.savedTradeId],
      featureEnabled: true,
      tradeLinkRepository: repository,
    });

    expect(readModel.statesByTradeId[oldSnapshot.savedTradeId]).toMatchObject({
      availability: "attached",
      sourceKind: "single_snapshot_v1",
      fifteenMinuteContextOnlyStatus: "not_supplied",
    });
  });

  it("returns the latest stored trade link per saved trade id", () => {
    const repository = sqliteTradeLinkRepository();
    const first = clone(
      linkedTradeLinkFixture,
    ) as LinkedJournalLevelAnalysisTradeLinkRecord;
    const latest = {
      ...first,
      id: "jlatl_trade_DEVS_2026_06_01_001_later_delivery_DEVS",
      deliveryId: "later_delivery_DEVS",
      updatedAt: "2026-06-06T20:10:00.000Z",
      rawPayloadHash:
        "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      linkedSymbolSummary:
        first.linkStatus === "linked"
          ? {
              ...first.linkedSymbolSummary,
              deliveryId: "later_delivery_DEVS",
            }
          : first.linkedSymbolSummary,
      matchResult: {
        ...first.matchResult,
        candidateDeliveryId: "later_delivery_DEVS",
        checkedAt: "2026-06-06T20:10:00.000Z",
      },
    } satisfies LinkedJournalLevelAnalysisTradeLinkRecord;

    repository.saveTradeLinkRecord(first);
    repository.saveTradeLinkRecord(latest);

    expect(
      repository.getLatestTradeLinksForSavedTrades({
        savedTradeIds: [first.savedTradeId],
        workspaceId: first.workspaceId,
        accountId: first.accountId,
        userId: first.userId,
      })[first.savedTradeId]?.id,
    ).toBe(latest.id);
  });

  it("adds level facts to saved review queue items without changing priority", () => {
    const csv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,DEVS,Buy,100,0.25",
      "2026-05-01,10:00:00,DEVS,Sell,100,0.27",
    ].join("\n");
    const { repository, tradeLinkRepository } = planFor(csv);
    const job = repository.listDecisionReviewJobs(
      repository.getLatestCommittedBatch(DEMO_ACCOUNT_ID)!.id,
    )[0]!;

    tradeLinkRepository.saveTradeLinkRecord(
      linkedFixtureForSavedTrade(job.savedTradeId, job.importBatchId),
    );

    const disabledQueue = buildSavedReviewQueueReadModel({
      repository,
      activeFilter: "all",
      levelFactsFeatureEnabled: false,
      levelFactsTradeLinkRepository: throwingTradeLinkRepository(),
    });
    const enabledQueue = buildSavedReviewQueueReadModel({
      repository,
      activeFilter: "all",
      levelFactsFeatureEnabled: true,
      levelFactsTradeLinkRepository: tradeLinkRepository,
    });

    expect(enabledQueue.levelFacts.counts.attached).toBe(1);
    expect(enabledQueue.allItems[0]?.levelFacts).toMatchObject({
      availability: "attached",
      symbol: "DEVS",
      rawPayloadHash: linkedTradeLinkFixture.rawPayloadHash,
    });
    expect(disabledQueue.allItems[0]?.levelFacts.availability).toBe(
      "feature_disabled",
    );
    expect(enabledQueue.allItems[0]?.priorityScore).toBe(
      disabledQueue.allItems[0]?.priorityScore,
    );
    expect(enabledQueue.allItems[0]?.priorityReason).toBe(
      disabledQueue.allItems[0]?.priorityReason,
    );
    expect(journalLevelAnalysisTradeLinkContainsRawPayload(enabledQueue)).toBe(false);
    expect(collectObjectKeys(enabledQueue.levelFacts)).not.toContain("priorityScore");
    expectNoLevelFactsAdviceLanguage(enabledQueue.levelFacts);
  });
});
