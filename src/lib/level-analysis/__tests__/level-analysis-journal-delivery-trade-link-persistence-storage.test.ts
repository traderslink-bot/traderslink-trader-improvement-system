import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import acceptedDeliveryFixture from "../__fixtures__/persistence-contract/delivery-record.accepted.compact.json";
import linkedTradeLinkFixture from "../__fixtures__/trade-link-contract/trade-link-record.linked.compact.json";
import oldSnapshotTradeLinkFixture from "../__fixtures__/trade-link-contract/trade-link-record.old-snapshot.compact.json";
import blockedTradeLinkFixture from "../__fixtures__/trade-link-contract/trade-link-record.blocked.compact.json";
import {
  type JournalLevelAnalysisDeliveryRecord,
} from "../level-analysis-journal-delivery-persistence-contract";
import { SqliteJournalLevelAnalysisDeliveryRepository } from "../level-analysis-journal-delivery-persistence-storage";
import {
  journalLevelAnalysisTradeLinkContainsRawPayload,
  type JournalLevelAnalysisTradeLinkRecord,
} from "../level-analysis-journal-delivery-trade-link-contract";
import { SqliteJournalLevelAnalysisTradeLinkRepository } from "../level-analysis-journal-delivery-trade-link-storage";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createRepositories(): {
  deliveryRepository: SqliteJournalLevelAnalysisDeliveryRepository;
  tradeLinkRepository: SqliteJournalLevelAnalysisTradeLinkRepository;
} {
  const db = new Database(":memory:");
  return {
    deliveryRepository: new SqliteJournalLevelAnalysisDeliveryRepository(db),
    tradeLinkRepository: new SqliteJournalLevelAnalysisTradeLinkRepository(db),
  };
}

describe("level-analysis journal trade-link SQLite persistence", () => {
  it("stores and retrieves linked trade records without raw payload copies", () => {
    const { deliveryRepository, tradeLinkRepository } = createRepositories();
    const deliveryRecord = clone(
      acceptedDeliveryFixture,
    ) as unknown as JournalLevelAnalysisDeliveryRecord;
    const linkRecord = clone(
      linkedTradeLinkFixture,
    ) as unknown as JournalLevelAnalysisTradeLinkRecord;

    deliveryRepository.saveDeliveryRecord(deliveryRecord);
    const saved = tradeLinkRepository.saveTradeLinkRecord(linkRecord);

    expect(saved.status).toBe("stored");
    expect(tradeLinkRepository.getTradeLinkRecord(linkRecord.id)).toEqual(linkRecord);
    expect(
      tradeLinkRepository.getLatestTradeLinkForSavedTrade({
        savedTradeId: linkRecord.savedTradeId,
        workspaceId: linkRecord.workspaceId,
        accountId: linkRecord.accountId,
        userId: linkRecord.userId,
      }),
    ).toEqual(linkRecord);
    expect(
      tradeLinkRepository.getTradeLinkByIdempotency({
        workspaceId: linkRecord.workspaceId,
        accountId: linkRecord.accountId,
        userId: linkRecord.userId,
        savedTradeId: linkRecord.savedTradeId,
        deliveryId: linkRecord.deliveryId,
        symbol: "devs",
        provider: linkRecord.provider,
      }),
    ).toEqual(linkRecord);
    expect(journalLevelAnalysisTradeLinkContainsRawPayload(saved.record)).toBe(false);
  });

  it("treats duplicate trade-link idempotency keys as duplicate saves", () => {
    const { tradeLinkRepository } = createRepositories();
    const linkRecord = clone(
      linkedTradeLinkFixture,
    ) as unknown as JournalLevelAnalysisTradeLinkRecord;
    const duplicate = {
      ...linkRecord,
      id: "jlatl_duplicate_id",
    } satisfies JournalLevelAnalysisTradeLinkRecord;

    expect(tradeLinkRepository.saveTradeLinkRecord(linkRecord).status).toBe("stored");
    const result = tradeLinkRepository.saveTradeLinkRecord(duplicate);

    expect(result.status).toBe("duplicate");
    expect(result.record.id).toBe(linkRecord.id);
  });

  it("persists blocked attempts without trusted linked facts", () => {
    const { tradeLinkRepository } = createRepositories();
    const blocked = clone(
      blockedTradeLinkFixture,
    ) as unknown as JournalLevelAnalysisTradeLinkRecord;

    const saved = tradeLinkRepository.saveTradeLinkRecord(blocked);

    expect(saved.status).toBe("stored");
    expect(saved.record.linkStatus).toBe("blocked");
    expect(saved.record.linkedSymbolSummary).toBeNull();
    expect(
      tradeLinkRepository.getLatestTradeLinkForSavedTrade({
        savedTradeId: blocked.savedTradeId,
        workspaceId: blocked.workspaceId,
        accountId: blocked.accountId,
        userId: blocked.userId,
      }),
    ).toEqual(blocked);
  });

  it("scopes latest trade-link lookup by saved trade journal identity", () => {
    const { tradeLinkRepository } = createRepositories();
    const demoLink =
      clone(linkedTradeLinkFixture) as unknown as JournalLevelAnalysisTradeLinkRecord;
    const otherScopeLink = {
      ...demoLink,
      id: "jlatl_other_scope_same_saved_trade",
      workspaceId: "workspace-other",
      accountId: "account-other",
      userId: "user-other",
      updatedAt: "2026-06-06T20:30:00.000Z",
      rawPayloadHash:
        "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    } satisfies JournalLevelAnalysisTradeLinkRecord;

    tradeLinkRepository.saveTradeLinkRecord(demoLink);
    tradeLinkRepository.saveTradeLinkRecord(otherScopeLink);

    expect(
      tradeLinkRepository.getLatestTradeLinkForSavedTrade({
        savedTradeId: demoLink.savedTradeId,
        workspaceId: demoLink.workspaceId,
        accountId: demoLink.accountId,
        userId: demoLink.userId,
      })?.id,
    ).toBe(demoLink.id);
    expect(
      tradeLinkRepository.getLatestTradeLinkForSavedTrade({
        savedTradeId: otherScopeLink.savedTradeId,
        workspaceId: otherScopeLink.workspaceId,
        accountId: otherScopeLink.accountId,
        userId: otherScopeLink.userId,
      })?.id,
    ).toBe(otherScopeLink.id);
  });

  it("keeps old LevelAnalysisSnapshot v1 trade links persistable", () => {
    const { tradeLinkRepository } = createRepositories();
    const oldSnapshotLink = clone(
      oldSnapshotTradeLinkFixture,
    ) as unknown as JournalLevelAnalysisTradeLinkRecord;

    const saved = tradeLinkRepository.saveTradeLinkRecord(oldSnapshotLink);

    expect(saved.status).toBe("stored");
    expect(saved.record.sourceKind).toBe("single_snapshot_v1");
    if (saved.record.linkStatus !== "linked") {
      throw new Error("Expected old snapshot link fixture to be linked.");
    }
    expect(saved.record.linkedSymbolSummary.fifteenMinuteContextOnlyStatus).toBe(
      "not_supplied",
    );
  });

  it("rejects malformed link records before writing", () => {
    const { tradeLinkRepository } = createRepositories();
    const malformed = clone(linkedTradeLinkFixture) as Record<string, unknown>;
    malformed.rawPayload = { copied: true };

    expect(() =>
      tradeLinkRepository.saveTradeLinkRecord(
        malformed as unknown as JournalLevelAnalysisTradeLinkRecord,
      ),
    ).toThrow(/Invalid journal level analysis trade link record/);
  });
});
