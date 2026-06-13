import { describe, expect, it } from "vitest";
import fixture from "../__fixtures__/journal-connector-level-analysis-snapshot-v1.json";
import {
  buildExecutionAnalysisLevelContextInputFromStorageRecord,
  type ExecutionAnalysisLevelContextInput,
} from "../execution-level-context-input";
import { buildExecutionLevelContextObservations } from "../execution-level-context-observations";
import {
  buildExecutionLevelContextObservationReadModel,
  buildExecutionLevelContextObservationReadModelFromObservations,
  buildUnavailableExecutionLevelContextObservationReadModel,
  type ExecutionLevelContextObservationReadModel,
} from "../execution-level-context-observation-read-model";
import {
  appendExecutionLevelContextReadModelAuditEntry,
  createExecutionLevelContextReadModelStorageRecord,
  createQuarantinedExecutionLevelContextReadModelStorageRecord,
  deriveExecutionLevelContextReadModelStorageKey,
  listQuarantinedExecutionLevelContextReadModels,
  retrieveExecutionLevelContextReadModelByKey,
  retrieveExecutionLevelContextReadModelsForOwner,
  retrieveExecutionLevelContextReadModelsForSymbol,
  retrieveLatestExecutionLevelContextReadModelForOwnerSymbol,
  retrieveNearestAsOfExecutionLevelContextReadModel,
  storeExecutionLevelContextReadModelRecord,
  type ExecutionLevelContextReadModelStorageIndex,
  type ExecutionLevelContextReadModelStorageRecord,
} from "../execution-level-context-read-model-storage";
import { validateLevelAnalysisSnapshotV1 } from "../level-analysis-snapshot-adapter";
import {
  createLevelAnalysisSnapshotAttachment,
  type LevelAnalysisSnapshotAttachment,
} from "../level-analysis-snapshot-attachment";
import type { LevelAnalysisAdapterResult } from "../level-analysis-snapshot-contract";
import { createLevelAnalysisSnapshotStorageRecord } from "../level-analysis-snapshot-storage";

const OWNER = { ownerId: "trade-123", ownerType: "trade" };
const ATTACHED_AT = Date.parse("2026-05-31T23:00:00-04:00");
const CREATED_AT = Date.parse("2026-05-31T23:10:00-04:00");
const UPDATED_AT = Date.parse("2026-05-31T23:15:00-04:00");

type MutableSnapshot = Record<string, unknown>;

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function cloneFixture(): MutableSnapshot {
  return cloneValue(fixture) as MutableSnapshot;
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
    attachedAt: ATTACHED_AT,
  });

  expect(result.status).toBe("attached");
  return result.attachment as LevelAnalysisSnapshotAttachment;
}

function buildFactualContext(
  snapshot: MutableSnapshot = cloneFixture(),
): ExecutionAnalysisLevelContextInput {
  const snapshotRecord = createLevelAnalysisSnapshotStorageRecord({
    attachment: createAcceptedAttachment(snapshot),
    createdAt: CREATED_AT,
  });
  const result = buildExecutionAnalysisLevelContextInputFromStorageRecord(snapshotRecord);

  expect(result.status).toBe("available");
  if (result.status !== "available") {
    throw new Error("Expected available execution level context input.");
  }

  return result.input;
}

function buildReadModel(
  snapshot: MutableSnapshot = cloneFixture(),
): ExecutionLevelContextObservationReadModel {
  const context = buildFactualContext(snapshot);
  const observations = buildExecutionLevelContextObservations(context);

  expect(observations.status).toBe("observed");
  return buildExecutionLevelContextObservationReadModelFromObservations(
    context,
    observations.observationSet,
  ).readModel;
}

function createReadModelRecord(
  snapshot: MutableSnapshot = cloneFixture(),
): ExecutionLevelContextReadModelStorageRecord {
  return createExecutionLevelContextReadModelStorageRecord({
    owner: OWNER,
    readModel: buildReadModel(snapshot),
    createdAt: CREATED_AT,
  });
}

function withAsOf(timestamp: number): MutableSnapshot {
  const snapshot = cloneFixture();
  snapshot.asOfTimestamp = timestamp;
  return snapshot;
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
    "mistake",
    "discipline",
  ]);

  for (const key of collectObjectKeys(value)) {
    expect(prohibitedKeys.has(key), `Unexpected journal-owned field ${key}`).toBe(false);
  }
}

function expectNoJournalOwnedLanguage(value: unknown): void {
  const text = collectStringValues(value).join("\n").toLowerCase();

  for (const [label, pattern] of [
    ["grade/grading", /\bgrade\b|\bgrading\b/],
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
    ["mistake", /\bmistake\b/],
    ["discipline", /\bdiscipline\b/],
    ["good/bad trade", /\bgood trade\b|\bbad trade\b/],
    ["should-have", /\bshould have\b/],
  ] as const) {
    expect(pattern.test(text), `Unexpected ${label} language`).toBe(false);
  }
}

describe("execution level context read model storage", () => {
  it("creates an accepted storage record for a factual read model", () => {
    const readModel = buildReadModel();
    const record = createExecutionLevelContextReadModelStorageRecord({
      owner: OWNER,
      readModel,
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      version: 2,
    });

    expect(record.storageKey).toBe(
      deriveExecutionLevelContextReadModelStorageKey({
        ownerId: OWNER.ownerId,
        symbol: fixture.symbol,
        asOfTimestamp: fixture.asOfTimestamp,
        storageStatus: "accepted",
      }),
    );
    expect(record.ownerId).toBe(OWNER.ownerId);
    expect(record.ownerType).toBe(OWNER.ownerType);
    expect(record.symbol).toBe(fixture.symbol);
    expect(record.asOfTimestamp).toBe(fixture.asOfTimestamp);
    expect(record.schemaVersion).toBe("level-analysis-snapshot/v1");
    expect(record.producer).toBe("levels-system");
    expect(record.sourceType).toBe("execution-level-context-observation-read-model/v1");
    expect(record.storageStatus).toBe("accepted");
    expect(record.readModel).toBe(readModel);
    expect(record.sourceSnapshotAttachmentKey).toBe(readModel.source.attachmentKey);
    expect(record.sourceSnapshotStorageKey).toBe(readModel.source.storageKey);
    expect(record.diagnostics).toBe(readModel.diagnostics);
    expect(record.limitations).toBe(readModel.limitations);
    expect(record.safetySummary).toBe(readModel.safety);
    expect(record.version).toBe(2);
    expect(record.createdAt).toBe(CREATED_AT);
    expect(record.updatedAt).toBe(UPDATED_AT);
    expect(record.auditTrail).toEqual([
      {
        event: "created",
        at: CREATED_AT,
        message: "Execution level context read model storage record created.",
      },
    ]);
  });

  it("stores unavailable limited and not replay-safe read models without creating interpretation fields", () => {
    const unavailable = buildUnavailableExecutionLevelContextObservationReadModel(
      "missing_context",
    ).readModel;
    const unavailableRecord = createExecutionLevelContextReadModelStorageRecord({
      owner: OWNER,
      readModel: unavailable,
      createdAt: CREATED_AT,
    });

    const limitedSnapshot = cloneFixture();
    limitedSnapshot.nearestSupport = null;
    delete limitedSnapshot.marketContext;
    delete limitedSnapshot.factsBundle;
    limitedSnapshot.volumeShelves = [];
    const limitedRecord = createExecutionLevelContextReadModelStorageRecord({
      owner: OWNER,
      readModel: buildReadModel(limitedSnapshot),
      createdAt: CREATED_AT,
    });

    const unsafeContext = cloneValue(buildFactualContext());
    unsafeContext.safety.noLookaheadApplied = false;
    const unsafe = buildExecutionLevelContextObservationReadModel(unsafeContext).readModel;
    const unsafeRecord = createExecutionLevelContextReadModelStorageRecord({
      owner: OWNER,
      readModel: unsafe,
      createdAt: CREATED_AT,
    });

    expect(unavailableRecord.storageStatus).toBe("unavailable");
    expect(unavailableRecord.symbol).toBe("UNKNOWN");
    expect(limitedRecord.storageStatus).toBe("limited");
    expect(limitedRecord.limitations?.count).toBeGreaterThan(0);
    expect(unsafeRecord.storageStatus).toBe("not_replay_safe");
    expect(unsafeRecord.safetySummary?.noLookaheadApplied).toBe(false);
    expectNoJournalOwnedFields([unavailableRecord, limitedRecord, unsafeRecord]);
    expectNoJournalOwnedLanguage([unavailableRecord, limitedRecord, unsafeRecord]);
  });

  it("creates quarantined records that preserve invalid payloads and reasons", () => {
    const invalidPayload = {
      contractVersion: "execution_level_context_observation_read_model_v0",
      factualOnly: false,
      identity: { symbol: fixture.symbol, asOfTimestamp: fixture.asOfTimestamp },
      source: { schemaVersion: "level-analysis-snapshot/v0", producer: "levels-system" },
    };
    const record = createQuarantinedExecutionLevelContextReadModelStorageRecord({
      owner: OWNER,
      rawPayload: invalidPayload,
      quarantineReasons: [
        {
          code: "unsupported_contract",
          field: "contractVersion",
          message: "Unsupported execution level context read model contract.",
        },
      ],
      createdAt: CREATED_AT,
    });

    expect(record.storageStatus).toBe("quarantined");
    expect(record.storageKey).toBe(
      deriveExecutionLevelContextReadModelStorageKey({
        ownerId: OWNER.ownerId,
        symbol: fixture.symbol,
        asOfTimestamp: fixture.asOfTimestamp,
        storageStatus: "quarantined",
      }),
    );
    expect(record.rawPayload).toBe(invalidPayload);
    expect(record.quarantineReasons).toHaveLength(1);
    expect(record.quarantineReasons[0]).toMatchObject({
      code: "unsupported_contract",
      field: "contractVersion",
    });
    expect("readModel" in record).toBe(false);
    expect(record.auditTrail[0]).toMatchObject({
      event: "quarantined",
      at: CREATED_AT,
    });
  });

  it("stores records, retrieves them by key owner and symbol, and replaces duplicate keys deterministically", () => {
    const accepted = createReadModelRecord();
    const quarantined = createQuarantinedExecutionLevelContextReadModelStorageRecord({
      owner: OWNER,
      rawPayload: { invalid: true, symbol: fixture.symbol, asOfTimestamp: fixture.asOfTimestamp },
      quarantineReasons: [
        {
          code: "invalid_payload",
          message: "Payload cannot be stored as a factual read model.",
        },
      ],
      createdAt: CREATED_AT,
    });

    let collection: ExecutionLevelContextReadModelStorageIndex = [];
    collection = storeExecutionLevelContextReadModelRecord(collection, accepted);
    collection = storeExecutionLevelContextReadModelRecord(collection, quarantined);

    const byKey = retrieveExecutionLevelContextReadModelByKey(
      collection,
      accepted.storageKey,
    );
    expect(byKey.status).toBe("found");
    if (byKey.status !== "found") {
      throw new Error("Expected read model record by key.");
    }
    expect(byKey.record).toBe(accepted);
    expect(retrieveExecutionLevelContextReadModelsForOwner(collection, OWNER.ownerId)).toHaveLength(2);
    expect(retrieveExecutionLevelContextReadModelsForSymbol(collection, fixture.symbol)).toHaveLength(2);
    expect(listQuarantinedExecutionLevelContextReadModels(collection)).toEqual([quarantined]);

    const replacement = createExecutionLevelContextReadModelStorageRecord({
      owner: OWNER,
      readModel: accepted.readModel,
      createdAt: CREATED_AT,
      version: 3,
    });
    const replaced = storeExecutionLevelContextReadModelRecord(collection, replacement);

    expect(replaced).toHaveLength(2);
    expect(replaced[0]).toBe(replacement);
    expect((replaced[0] as ExecutionLevelContextReadModelStorageRecord).version).toBe(3);
  });

  it("retrieves latest and nearest as-of records without returning future read models by default", () => {
    const base = fixture.asOfTimestamp;
    const early = createReadModelRecord(withAsOf(base - 600_000));
    const current = createReadModelRecord(withAsOf(base));
    const future = createReadModelRecord(withAsOf(base + 600_000));
    const collection: ExecutionLevelContextReadModelStorageIndex = [
      early,
      current,
      future,
    ];

    const latest = retrieveLatestExecutionLevelContextReadModelForOwnerSymbol(
      collection,
      OWNER.ownerId,
      fixture.symbol,
    );
    expect(latest.status).toBe("found");
    if (latest.status !== "found") {
      throw new Error("Expected latest read model.");
    }
    expect(latest.record).toBe(future);

    const nearestDefault = retrieveNearestAsOfExecutionLevelContextReadModel(collection, {
      ownerId: OWNER.ownerId,
      symbol: fixture.symbol,
      asOfTimestamp: base + 400_000,
    });
    expect(nearestDefault.status).toBe("found");
    if (nearestDefault.status !== "found") {
      throw new Error("Expected nearest as-of read model.");
    }
    expect(nearestDefault.record).toBe(current);

    const nearestWithFuture = retrieveNearestAsOfExecutionLevelContextReadModel(collection, {
      ownerId: OWNER.ownerId,
      symbol: fixture.symbol,
      asOfTimestamp: base + 400_000,
      allowFuture: true,
    });
    expect(nearestWithFuture.status).toBe("found");
    if (nearestWithFuture.status !== "found") {
      throw new Error("Expected nearest future-allowed read model.");
    }
    expect(nearestWithFuture.record).toBe(future);
  });

  it("preserves read models and additive fields without mutating stored records during retrieval", () => {
    const readModel = buildReadModel() as ExecutionLevelContextObservationReadModel & {
      additiveField?: { preserved: boolean };
    };
    readModel.additiveField = { preserved: true };
    const before = cloneValue(readModel);
    const record = createExecutionLevelContextReadModelStorageRecord({
      owner: OWNER,
      readModel,
      createdAt: CREATED_AT,
    });
    const collection = storeExecutionLevelContextReadModelRecord([], record);

    const retrieved = retrieveExecutionLevelContextReadModelByKey(
      collection,
      record.storageKey,
    );
    expect(retrieved.status).toBe("found");
    if (retrieved.status !== "found") {
      throw new Error("Expected stored read model record.");
    }

    expect(record.readModel).toBe(readModel);
    expect(record.readModel).toEqual(before);
    expect(retrieved.record).toBe(record);
    expect((retrieved.record as ExecutionLevelContextReadModelStorageRecord).readModel).toEqual(before);
  });

  it("appends factual audit entries without mutating the original record", () => {
    const record = createReadModelRecord();
    const entry = {
      event: "retrieved" as const,
      at: UPDATED_AT,
      message: "Execution level context read model storage record retrieved.",
      metadata: { ownerId: OWNER.ownerId },
    };

    const updated = appendExecutionLevelContextReadModelAuditEntry(record, entry);

    expect(updated).not.toBe(record);
    expect(record.auditTrail).toHaveLength(1);
    expect(updated.auditTrail).toHaveLength(2);
    expect(updated.auditTrail[1]).toEqual(entry);
    expect(updated.updatedAt).toBe(UPDATED_AT);
    expect(updated.readModel).toBe(record.readModel);
  });

  it("keeps synthetic quality diagnostics and limitations factual in storage", () => {
    const record = createReadModelRecord();

    expect(record.readModel.synthetic).toMatchObject({
      count: 1,
      marked: true,
      contextType: "synthetic_forward_planning",
      historicalEvidence: false,
      limitations: expect.arrayContaining([
        "not_historical_support_resistance",
      ]),
    });
    expect(record.readModel.quality.warningCount).toBe(1);
    expect(record.readModel.diagnostics.count).toBeGreaterThan(0);
    expect(record.readModel.limitations.count).toBe(0);
  });

  it("does not add journal-owned fields or interpretation language to records retrieval results or audit entries", () => {
    const record = createReadModelRecord();
    const retrieved = retrieveExecutionLevelContextReadModelByKey(
      [record],
      record.storageKey,
    );
    const auditEntry = {
      event: "stored" as const,
      at: UPDATED_AT,
      message: "Execution level context read model stored as factual context.",
    };
    const compactRecordView = {
      storageKey: record.storageKey,
      storageStatus: record.storageStatus,
      readModel: record.readModel,
      diagnostics: record.diagnostics,
      limitations: record.limitations,
      safetySummary: record.safetySummary,
      auditTrail: record.auditTrail,
    };

    expectNoJournalOwnedFields(compactRecordView);
    expectNoJournalOwnedFields(retrieved);
    expectNoJournalOwnedFields(auditEntry);
    expectNoJournalOwnedLanguage(compactRecordView);
    expectNoJournalOwnedLanguage(retrieved);
    expectNoJournalOwnedLanguage(auditEntry);
  });
});
