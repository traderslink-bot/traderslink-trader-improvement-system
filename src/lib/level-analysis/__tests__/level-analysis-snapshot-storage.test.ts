import { describe, expect, it } from "vitest";
import fixture from "../__fixtures__/journal-connector-level-analysis-snapshot-v1.json";
import { validateLevelAnalysisSnapshotV1 } from "../level-analysis-snapshot-adapter";
import {
  createLevelAnalysisSnapshotAttachment,
  type LevelAnalysisSnapshotAttachment,
  type QuarantinedLevelAnalysisSnapshotAttachment,
} from "../level-analysis-snapshot-attachment";
import type {
  LevelAnalysisAdapterResult,
  LevelAnalysisSnapshotV1,
} from "../level-analysis-snapshot-contract";
import {
  appendLevelAnalysisSnapshotStorageAuditEntry,
  createLevelAnalysisSnapshotStorageRecord,
  createQuarantinedLevelAnalysisSnapshotStorageRecord,
  deriveLevelAnalysisSnapshotStorageKey,
  listQuarantinedLevelAnalysisSnapshots,
  retrieveLatestLevelAnalysisSnapshotForOwnerSymbol,
  retrieveLevelAnalysisSnapshotByKey,
  retrieveLevelAnalysisSnapshotsForOwner,
  retrieveLevelAnalysisSnapshotsForSymbol,
  retrieveNearestAsOfLevelAnalysisSnapshot,
  storeLevelAnalysisSnapshotRecord,
  type LevelAnalysisSnapshotStorageIndex,
  type LevelAnalysisSnapshotStorageRecord,
} from "../level-analysis-snapshot-storage";

const CREATED_AT = Date.parse("2026-05-31T16:00:00-04:00");
const UPDATED_AT = Date.parse("2026-05-31T16:05:00-04:00");
const OWNER = { ownerId: "trade-123", ownerType: "trade" };

type MutableLevelEngineOutput = {
  extensionLevels: {
    resistance: unknown[];
    support: unknown[];
  };
  metadata: Record<string, unknown>;
};

type MutableSafety = Record<string, unknown> & {
  noLookaheadApplied: boolean;
  syntheticExtensionsClearlyMarked: boolean;
};

type MutableSnapshot = Record<string, unknown> & {
  levelEngineOutput: MutableLevelEngineOutput;
  referencePrice: number;
  safety: MutableSafety;
};

function cloneFixture(): MutableSnapshot {
  return JSON.parse(JSON.stringify(fixture)) as MutableSnapshot;
}

function acceptedAdapterResult(snapshot: MutableSnapshot = cloneFixture()): Extract<
  LevelAnalysisAdapterResult,
  { status: "accepted" }
> {
  const result = validateLevelAnalysisSnapshotV1(snapshot, {
    requireReplaySafe: true,
  });

  expect(result.status).toBe("accepted");
  return result as Extract<LevelAnalysisAdapterResult, { status: "accepted" }>;
}

function createAcceptedAttachment(
  snapshot: MutableSnapshot = cloneFixture(),
): LevelAnalysisSnapshotAttachment {
  const result = createLevelAnalysisSnapshotAttachment({
    owner: OWNER,
    adapterResult: acceptedAdapterResult(snapshot),
    attachedAt: CREATED_AT,
  });

  expect(result.status).toBe("attached");
  return result.attachment as LevelAnalysisSnapshotAttachment;
}

function createAcceptedRecord(
  snapshot: MutableSnapshot = cloneFixture(),
): LevelAnalysisSnapshotStorageRecord {
  return createLevelAnalysisSnapshotStorageRecord({
    attachment: createAcceptedAttachment(snapshot),
    createdAt: CREATED_AT,
  });
}

function createQuarantinedAttachment(
  snapshot: MutableSnapshot,
): QuarantinedLevelAnalysisSnapshotAttachment {
  const result = createLevelAnalysisSnapshotAttachment({
    owner: OWNER,
    rawJson: JSON.stringify(snapshot),
    attachedAt: CREATED_AT,
  });

  expect(result.status).toBe("quarantined");
  return result.attachment as QuarantinedLevelAnalysisSnapshotAttachment;
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

function expectNoJournalOwnedFields(value: unknown): void {
  const keys = collectObjectKeys(value);
  const prohibitedKeys = new Set([
    "grade",
    "tradeGrade",
    "coaching",
    "coach",
    "pnl",
    "pAndL",
    "giveback",
    "behaviorScore",
    "behaviorScoring",
    "recommendation",
    "entryDecision",
    "exitDecision",
    "tradeAdvice",
  ]);

  for (const key of keys) {
    expect(prohibitedKeys.has(key), `Unexpected journal-owned field ${key}`).toBe(false);
  }
}

function expectNoJournalOwnedLanguage(value: unknown): void {
  const text = collectStringValues(value).join("\n").toLowerCase();

  for (const [label, pattern] of [
    ["grading", /\bgrading\b/],
    ["coaching", /\bcoaching\b/],
    ["coach", /\bcoach\b/],
    ["p/l", /\bp\/l\b|\bpnl\b/],
    ["giveback", /\bgiveback\b/],
    ["behavior score", /\bbehavior score\b|\bbehavior scoring\b/],
    ["recommendation", /\brecommendation\b/],
    ["buy/sell/hold", /\bbuy\b|\bsell\b|\bhold\b/],
    ["entry decision", /\bentry decision\b/],
    ["exit decision", /\bexit decision\b/],
    ["trade advice", /\btrade advice\b/],
  ] as const) {
    expect(pattern.test(text), `Unexpected ${label} language`).toBe(false);
  }
}

function withAsOf(timestamp: number): MutableSnapshot {
  const snapshot = cloneFixture();
  snapshot.asOfTimestamp = timestamp;
  return snapshot;
}

describe("LevelAnalysisSnapshot storage contract", () => {
  it("creates an accepted factual storage record from an accepted attachment", () => {
    const attachment = createAcceptedAttachment();
    const record = createLevelAnalysisSnapshotStorageRecord({
      attachment,
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      version: 2,
    });

    expect(record.storageKey).toBe(
      deriveLevelAnalysisSnapshotStorageKey({
        ownerId: OWNER.ownerId,
        symbol: attachment.symbol,
        asOfTimestamp: attachment.asOfTimestamp,
        validationStatus: "accepted",
      }),
    );
    expect(record.ownerId).toBe(OWNER.ownerId);
    expect(record.ownerType).toBe(OWNER.ownerType);
    expect(record.symbol).toBe(attachment.symbol);
    expect(record.asOfTimestamp).toBe(attachment.asOfTimestamp);
    expect(record.schemaVersion).toBe("level-analysis-snapshot/v1");
    expect(record.producer).toBe("levels-system");
    expect(record.sourceType).toBe("level-analysis-snapshot-v1");
    expect(record.validationStatus).toBe("accepted");
    expect(record.rawSnapshot).toBe(attachment.rawSnapshot);
    expect(record.factualConnectorView).toBe(attachment.connectorView);
    expect(record.attachment).toBe(attachment);
    expect(record.diagnostics).toBe(attachment.diagnostics);
    expect(record.limitations).toBe(attachment.limitations);
    expect(record.version).toBe(2);
    expect(record.createdAt).toBe(CREATED_AT);
    expect(record.updatedAt).toBe(UPDATED_AT);
    expect(record.auditTrail).toEqual([
      {
        event: "created",
        at: CREATED_AT,
        message: "LevelAnalysisSnapshot storage record created.",
      },
    ]);
  });

  it("creates a quarantined storage record that preserves invalid payloads and reasons", () => {
    const snapshot = cloneFixture();
    delete snapshot.schemaVersion;
    const attachment = createQuarantinedAttachment(snapshot);

    const record = createQuarantinedLevelAnalysisSnapshotStorageRecord({
      attachment,
      createdAt: CREATED_AT,
    });

    expect(record.validationStatus).toBe("quarantined");
    expect(record.storageKey).toBe(
      deriveLevelAnalysisSnapshotStorageKey({
        ownerId: OWNER.ownerId,
        symbol: fixture.symbol,
        asOfTimestamp: fixture.asOfTimestamp,
        validationStatus: "quarantined",
      }),
    );
    expect(record.rawPayload).toEqual(snapshot);
    expect(record.quarantineReasons.length).toBeGreaterThan(0);
    expect(record.quarantineReasons[0]?.field).toBe("schemaVersion");
    expect("factualConnectorView" in record).toBe(false);
    expect("rawSnapshot" in record).toBe(false);
    expect(record.auditTrail[0]).toMatchObject({
      event: "quarantined",
      at: CREATED_AT,
    });
  });

  it("stores records, retrieves them by key owner and symbol, and replaces duplicate keys deterministically", () => {
    const accepted = createAcceptedRecord();
    const invalid = cloneFixture();
    delete invalid.producer;
    const quarantined = createQuarantinedLevelAnalysisSnapshotStorageRecord({
      attachment: createQuarantinedAttachment(invalid),
      createdAt: CREATED_AT,
    });

    let collection: LevelAnalysisSnapshotStorageIndex = [];
    collection = storeLevelAnalysisSnapshotRecord(collection, accepted);
    collection = storeLevelAnalysisSnapshotRecord(collection, quarantined);

    const byKey = retrieveLevelAnalysisSnapshotByKey(collection, accepted.storageKey);
    expect(byKey.status).toBe("found");
    if (byKey.status !== "found") {
      throw new Error("Expected storage record by key.");
    }
    expect(byKey.record).toBe(accepted);
    expect(retrieveLevelAnalysisSnapshotsForOwner(collection, OWNER.ownerId)).toHaveLength(2);
    expect(retrieveLevelAnalysisSnapshotsForSymbol(collection, fixture.symbol)).toHaveLength(2);
    expect(listQuarantinedLevelAnalysisSnapshots(collection)).toEqual([quarantined]);

    const replacement = createLevelAnalysisSnapshotStorageRecord({
      attachment: accepted.attachment,
      createdAt: CREATED_AT,
      version: 3,
    });
    const replaced = storeLevelAnalysisSnapshotRecord(collection, replacement);

    expect(replaced).toHaveLength(2);
    expect(replaced[0]).toBe(replacement);
    expect((replaced[0] as LevelAnalysisSnapshotStorageRecord).version).toBe(3);
  });

  it("retrieves latest and nearest as-of records without returning future snapshots by default", () => {
    const base = fixture.asOfTimestamp;
    const early = createAcceptedRecord(withAsOf(base - 600_000));
    const current = createAcceptedRecord(withAsOf(base));
    const future = createAcceptedRecord(withAsOf(base + 600_000));
    const collection: LevelAnalysisSnapshotStorageIndex = [early, current, future];

    const latest = retrieveLatestLevelAnalysisSnapshotForOwnerSymbol(
      collection,
      OWNER.ownerId,
      fixture.symbol,
    );
    expect(latest.status).toBe("found");
    if (latest.status !== "found") {
      throw new Error("Expected latest record.");
    }
    expect(latest.record).toBe(future);

    const nearestDefault = retrieveNearestAsOfLevelAnalysisSnapshot(collection, {
      ownerId: OWNER.ownerId,
      symbol: fixture.symbol,
      asOfTimestamp: base + 400_000,
    });
    expect(nearestDefault.status).toBe("found");
    if (nearestDefault.status !== "found") {
      throw new Error("Expected nearest as-of record.");
    }
    expect(nearestDefault.record).toBe(current);

    const nearestWithFuture = retrieveNearestAsOfLevelAnalysisSnapshot(collection, {
      ownerId: OWNER.ownerId,
      symbol: fixture.symbol,
      asOfTimestamp: base + 400_000,
      allowFuture: true,
    });
    expect(nearestWithFuture.status).toBe("found");
    if (nearestWithFuture.status !== "found") {
      throw new Error("Expected nearest future-allowed record.");
    }
    expect(nearestWithFuture.record).toBe(future);
  });

  it("preserves raw snapshots and additive fields without mutating stored records during retrieval", () => {
    const snapshot = cloneFixture();
    snapshot.additiveTopLevel = { preserved: true };
    snapshot.levelEngineOutput.metadata.additiveNested = "kept";
    const before = JSON.parse(JSON.stringify(snapshot));
    const record = createAcceptedRecord(snapshot);
    const collection = storeLevelAnalysisSnapshotRecord([], record);

    const retrieved = retrieveLevelAnalysisSnapshotByKey(collection, record.storageKey);
    expect(retrieved.status).toBe("found");
    if (retrieved.status !== "found") {
      throw new Error("Expected stored record.");
    }

    expect(record.rawSnapshot).toBe(snapshot);
    expect(record.rawSnapshot).toEqual(before);
    expect(retrieved.record).toBe(record);
    expect((retrieved.record as LevelAnalysisSnapshotStorageRecord).rawSnapshot).toEqual(before);
    expect(
      (retrieved.record as LevelAnalysisSnapshotStorageRecord).rawSnapshot.levelEngineOutput,
    ).toEqual(before.levelEngineOutput);
  });

  it("appends factual audit entries without mutating the original record", () => {
    const record = createAcceptedRecord();
    const entry = {
      event: "retrieved" as const,
      at: UPDATED_AT,
      message: "LevelAnalysisSnapshot storage record retrieved for journal context.",
      metadata: { ownerId: OWNER.ownerId },
    };

    const updated = appendLevelAnalysisSnapshotStorageAuditEntry(record, entry);

    expect(updated).not.toBe(record);
    expect(record.auditTrail).toHaveLength(1);
    expect(updated.auditTrail).toHaveLength(2);
    expect(updated.auditTrail[1]).toEqual(entry);
    expect(updated.updatedAt).toBe(UPDATED_AT);
    expect(updated.rawSnapshot).toBe(record.rawSnapshot);
  });

  it.each([
    ["missing schemaVersion", (snapshot: MutableSnapshot) => delete snapshot.schemaVersion],
    ["wrong producer", (snapshot: MutableSnapshot) => {
      snapshot.producer = "other-system";
    }],
    ["unsafe no-lookahead", (snapshot: MutableSnapshot) => {
      snapshot.safety.noLookaheadApplied = false;
    }],
    ["malformed nearest level", (snapshot: MutableSnapshot) => {
      snapshot.nearestResistance = { representativePrice: 12.2 };
    }],
    ["unmarked synthetic rows", (snapshot: MutableSnapshot) => {
      snapshot.safety.syntheticExtensionsClearlyMarked = false;
    }],
  ])("quarantines invalid storage inputs: %s", (_label, mutate) => {
    const snapshot = cloneFixture();
    mutate(snapshot);

    const attachment = createQuarantinedAttachment(snapshot);
    const record = createQuarantinedLevelAnalysisSnapshotStorageRecord({
      attachment,
      createdAt: CREATED_AT,
    });

    expect(record.validationStatus).toBe("quarantined");
    expect(record.quarantineReasons.length).toBeGreaterThan(0);
    expect(record.rawPayload).toBeTruthy();
  });

  it("accepts optional missing sections through limitations without creating interpretation", () => {
    const snapshot = cloneFixture();
    snapshot.nearestSupport = null;
    snapshot.nearestResistance = null;
    snapshot.levelEngineOutput.extensionLevels.support = [];
    snapshot.levelEngineOutput.extensionLevels.resistance = [];
    delete snapshot.volumeShelves;
    delete snapshot.marketContext;
    delete snapshot.factsBundle;
    snapshot.additiveStorageField = { ok: true };

    const record = createAcceptedRecord(snapshot);

    expect(record.limitations.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        "nearest_support_unavailable",
        "nearest_resistance_unavailable",
        "extension_levels_empty",
        "volume_shelves_unavailable",
        "market_context_unavailable",
        "facts_bundle_unavailable",
      ]),
    );
    expect(record.rawSnapshot.additiveStorageField).toEqual({ ok: true });
  });

  it("keeps LevelQualityAudit and synthetic continuation-map metadata factual in storage", () => {
    const record = createAcceptedRecord();
    const syntheticRows = record.factualConnectorView.syntheticExtensions.levels;
    const surfacedIds = new Set(
      [
        ...record.rawSnapshot.levelEngineOutput.majorSupport,
        ...record.rawSnapshot.levelEngineOutput.majorResistance,
        ...record.rawSnapshot.levelEngineOutput.intermediateSupport,
        ...record.rawSnapshot.levelEngineOutput.intermediateResistance,
        ...record.rawSnapshot.levelEngineOutput.intradaySupport,
        ...record.rawSnapshot.levelEngineOutput.intradayResistance,
      ].map((level) => level.id),
    );

    expect(record.factualConnectorView.quality.hasLevelQualityAudit).toBe(true);
    expect(record.factualConnectorView.diagnostics.qualityDiagnosticsCount).toBeGreaterThanOrEqual(0);
    expect(syntheticRows.length).toBeGreaterThan(0);

    for (const row of syntheticRows) {
      expect(row.extensionMetadata?.extensionSource).toBe("synthetic_continuation_map");
      expect(row.extensionMetadata?.evidenceLimitations).toContain(
        "not_historical_support_resistance",
      );
      expect(row.touchCount).toBe(0);
      expect(row.confluenceCount).toBe(0);
      expect(surfacedIds.has(row.id)).toBe(false);
    }
  });

  it("does not add journal-owned fields or advice language to records retrieval results or audit entries", () => {
    const record = createAcceptedRecord();
    const retrieved = retrieveLevelAnalysisSnapshotByKey([record], record.storageKey);
    const auditEntry = {
      event: "stored" as const,
      at: UPDATED_AT,
      message: "LevelAnalysisSnapshot storage record stored as factual chart context.",
    };
    const compactRecordView = {
      storageKey: record.storageKey,
      validationStatus: record.validationStatus,
      factualConnectorView: record.factualConnectorView,
      diagnostics: record.diagnostics,
      limitations: record.limitations,
      auditTrail: record.auditTrail,
    };

    expectNoJournalOwnedFields(compactRecordView);
    expectNoJournalOwnedFields(retrieved);
    expectNoJournalOwnedFields(auditEntry);
    expectNoJournalOwnedLanguage(compactRecordView);
    expectNoJournalOwnedLanguage(retrieved);
    expectNoJournalOwnedLanguage(auditEntry);
  });

  it("stores snapshot records without changing the LevelAnalysisSnapshot payload shape", () => {
    const snapshot = cloneFixture() as LevelAnalysisSnapshotV1;
    const before = JSON.parse(JSON.stringify(snapshot));
    const record = createAcceptedRecord(snapshot as unknown as MutableSnapshot);

    expect(record.rawSnapshot).toEqual(before);
    expect(record.rawSnapshot.levelEngineOutput).toEqual(before.levelEngineOutput);
    expect(record.factualConnectorView.sourceSnapshot).toEqual({
      schemaVersion: before.schemaVersion,
      producer: before.producer,
      symbol: before.symbol,
      asOfTimestamp: before.asOfTimestamp,
    });
  });
});
