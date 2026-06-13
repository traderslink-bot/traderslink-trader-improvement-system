import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import fixture from "../__fixtures__/journal-connector-level-analysis-snapshot-v1.json";
import {
  buildExecutionAnalysisLevelContextInputFromStorageRecord,
  type ExecutionAnalysisLevelContextInput,
} from "../execution-level-context-input";
import {
  assertExecutionLevelContextConsumptionViewIsAllowed,
  buildExecutionLevelContextAllowedConsumptionView,
  buildExecutionLevelContextAllowedConsumptionViewFromContextInput,
  buildExecutionLevelContextAllowedConsumptionViewFromReadModel,
  buildExecutionLevelContextAllowedConsumptionViewFromStorageRecord,
  isExecutionLevelContextConsumptionViewAvailable,
} from "../execution-level-context-consumption-adapter";
import { buildExecutionLevelContextObservations } from "../execution-level-context-observations";
import {
  buildExecutionLevelContextObservationReadModel,
  buildExecutionLevelContextObservationReadModelFromObservations,
  buildUnavailableExecutionLevelContextObservationReadModel,
  type ExecutionLevelContextObservationReadModel,
} from "../execution-level-context-observation-read-model";
import {
  createExecutionLevelContextReadModelStorageRecord,
  createQuarantinedExecutionLevelContextReadModelStorageRecord,
  retrieveLatestExecutionLevelContextReadModelForOwnerSymbol,
  retrieveNearestAsOfExecutionLevelContextReadModel,
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
const CREATED_AT = Date.parse("2026-05-31T23:20:00-04:00");

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

function expectNoForbiddenFields(value: unknown): void {
  const prohibitedKeys = new Set([
    "rawSnapshot",
    "levelEngineOutput",
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
    expect(prohibitedKeys.has(key), `Unexpected forbidden field ${key}`).toBe(false);
  }
}

function expectNoForbiddenLanguage(value: unknown): void {
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

describe("execution level context consumption adapter", () => {
  it("builds an allowed factual consumption view from context input", () => {
    const context = buildFactualContext();
    const result =
      buildExecutionLevelContextAllowedConsumptionViewFromContextInput(context);

    expect(result.status).toBe("available");
    if (result.status !== "available") {
      throw new Error("Expected available consumption view.");
    }

    expect(result.view).toMatchObject({
      sourceType: "execution-level-context-allowed-consumption-view/v1",
      factualOnly: true,
      availability: {
        status: "available",
        readiness: "consumable",
      },
      source: {
        attachmentKey: context.source.attachmentKey,
        snapshotStorageKey: context.source.storageKey,
        ownerId: OWNER.ownerId,
        schemaVersion: "level-analysis-snapshot/v1",
        producer: "levels-system",
      },
      identity: {
        symbol: fixture.symbol,
        asOfTimestamp: fixture.asOfTimestamp,
        referencePrice: fixture.referencePrice,
      },
    });
    expect(result.view.nearestLevels.support?.representativePrice).toBe(
      fixture.nearestSupport.representativePrice,
    );
    expect(result.view.nearestLevels.resistance?.representativePrice).toBe(
      fixture.nearestResistance.representativePrice,
    );
    expect(result.view.levelMap.bucketCounts).toEqual(context.levelBucketCounts);
    expect(result.view.levelMap.extensionCounts).toEqual(context.extensionCounts);
    expect(result.view.synthetic).toMatchObject({
      count: 1,
      marked: true,
      contextType: "synthetic_forward_planning",
      historicalEvidence: false,
    });
    expect(result.view.diagnostics.count).toBeGreaterThan(0);
    expect(result.view.safety.noLookaheadApplied).toBe(true);
    expect(result.view.allowedFacts.map((fact) => fact.id)).toContain("nearest_support");
    expect(isExecutionLevelContextConsumptionViewAvailable(result)).toBe(true);
    expectNoForbiddenFields(result.view);
    expectNoForbiddenLanguage(result.view);
  });

  it("builds an allowed view from a read model and passes diagnostics limitations and safety through", () => {
    const snapshot = cloneFixture();
    snapshot.nearestSupport = null;
    delete snapshot.marketContext;
    delete snapshot.factsBundle;
    snapshot.volumeShelves = [];
    const readModel = buildReadModel(snapshot);
    const result =
      buildExecutionLevelContextAllowedConsumptionViewFromReadModel(readModel);

    expect(result.status).toBe("available");
    if (result.status !== "available") {
      throw new Error("Expected limited read model to produce an allowed view.");
    }

    expect(readModel.status).toBe("limited");
    expect(result.view.availability.status).toBe("available_with_limitations");
    expect(result.view.source).toMatchObject({
      attachmentKey: readModel.source.attachmentKey,
      snapshotStorageKey: readModel.source.storageKey,
      readModelStatus: "limited",
    });
    expect(result.view.nearestLevels.support).toBeNull();
    expect(result.view.nearestLevels.resistance?.present).toBe(true);
    expect(result.view.limitations.count).toBeGreaterThan(0);
    expect(result.view.limitations.messages).toContain(
      "Nearest support is unavailable in this as-of snapshot.",
    );
    expect(result.view.diagnostics.count).toBe(readModel.diagnostics.count);
    expect(result.view.safety).toEqual(readModel.safety);
    expect(result.view.observationReadModel.status).toBe("limited");
    expect(result.view.observationReadModel.observationSummary).toEqual(
      readModel.observationSummary,
    );
  });

  it("builds an allowed view from storage records and can consume latest or nearest retrieval results", () => {
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
      throw new Error("Expected latest read model record.");
    }

    const latestView =
      buildExecutionLevelContextAllowedConsumptionViewFromStorageRecord(
        latest.record,
      );
    expect(latestView.status).toBe("available");
    if (latestView.status !== "available") {
      throw new Error("Expected latest record to produce an allowed view.");
    }
    expect(latestView.view.source.readModelStorageKey).toBe(future.storageKey);
    expect(latestView.view.source.ownerId).toBe(OWNER.ownerId);
    expect(latestView.view.identity.asOfTimestamp).toBe(base + 600_000);

    const nearest = retrieveNearestAsOfExecutionLevelContextReadModel(collection, {
      ownerId: OWNER.ownerId,
      symbol: fixture.symbol,
      asOfTimestamp: base + 400_000,
    });
    expect(nearest.status).toBe("found");
    if (nearest.status !== "found") {
      throw new Error("Expected nearest read model record.");
    }
    expect(nearest.record).toBe(current);

    const nearestViaGeneric = buildExecutionLevelContextAllowedConsumptionView({
      sourceType: "read_model_storage_record",
      record: nearest.record,
    });
    expect(nearestViaGeneric.status).toBe("available");
    if (nearestViaGeneric.status !== "available") {
      throw new Error("Expected nearest record to produce an allowed view.");
    }
    expect(nearestViaGeneric.view.source.readModelStorageKey).toBe(current.storageKey);
    expect(nearestViaGeneric.view.identity.symbol).toBe(fixture.symbol);
  });

  it("returns unavailable results for quarantined unavailable unsafe and unmarked sources", () => {
    const quarantined = createQuarantinedExecutionLevelContextReadModelStorageRecord({
      owner: OWNER,
      rawPayload: { invalid: true, symbol: fixture.symbol, asOfTimestamp: fixture.asOfTimestamp },
      quarantineReasons: [
        {
          code: "invalid_payload",
          message: "Payload cannot be used as an allowed consumption view.",
        },
      ],
      createdAt: CREATED_AT,
    });
    const quarantinedResult =
      buildExecutionLevelContextAllowedConsumptionViewFromStorageRecord(
        quarantined,
      );
    expect(quarantinedResult).toMatchObject({
      status: "unavailable",
      reason: "quarantined_read_model_record",
    });

    const unavailableReadModel = buildUnavailableExecutionLevelContextObservationReadModel(
      "missing_context",
    ).readModel;
    const unavailableResult =
      buildExecutionLevelContextAllowedConsumptionViewFromReadModel(
        unavailableReadModel,
      );
    expect(unavailableResult).toMatchObject({
      status: "unavailable",
      reason: "read_model_unavailable",
    });

    const unsafeContext = cloneValue(buildFactualContext());
    unsafeContext.safety.noLookaheadApplied = false;
    const unsafeContextResult =
      buildExecutionLevelContextAllowedConsumptionViewFromContextInput(
        unsafeContext,
      );
    expect(unsafeContextResult).toMatchObject({
      status: "unavailable",
      reason: "not_replay_safe",
    });

    const unsafeReadModel =
      buildExecutionLevelContextObservationReadModel(unsafeContext).readModel;
    const unsafeReadModelResult =
      buildExecutionLevelContextAllowedConsumptionViewFromReadModel(
        unsafeReadModel,
      );
    expect(unsafeReadModelResult).toMatchObject({
      status: "unavailable",
      reason: "not_replay_safe",
    });

    const unmarkedSynthetic = cloneValue(buildReadModel());
    unmarkedSynthetic.safety.syntheticExtensionsClearlyMarked = false;
    unmarkedSynthetic.synthetic.marked = false;
    const unmarkedResult =
      buildExecutionLevelContextAllowedConsumptionViewFromReadModel(
        unmarkedSynthetic,
      );
    expect(unmarkedResult).toMatchObject({
      status: "unavailable",
      reason: "synthetic_marking_inconsistent",
    });
  });

  it("does not expose raw snapshots raw level engine output or interpretation fields", () => {
    const result = buildExecutionLevelContextAllowedConsumptionViewFromStorageRecord(
      createReadModelRecord(),
    );

    expect(result.status).toBe("available");
    if (result.status !== "available") {
      throw new Error("Expected available view.");
    }

    expect(collectObjectKeys(result.view)).not.toContain("rawSnapshot");
    expect(collectObjectKeys(result.view)).not.toContain("levelEngineOutput");
    expect(JSON.stringify(result.view)).not.toContain("levelEngineOutput");
    expectNoForbiddenFields(result.view);
    expectNoForbiddenLanguage(result.view);
    expect(() =>
      assertExecutionLevelContextConsumptionViewIsAllowed(result.view),
    ).not.toThrow();
    expect(() =>
      assertExecutionLevelContextConsumptionViewIsAllowed({
        ...result.view,
        rawSnapshot: { not: "allowed" },
      }),
    ).toThrow(/allowed facts|factual-only/);
  });

  it("keeps synthetic continuation-map and quality context factual only", () => {
    const result = buildExecutionLevelContextAllowedConsumptionView({
      sourceType: "context_input",
      context: buildFactualContext(),
    });

    expect(result.status).toBe("available");
    if (result.status !== "available") {
      throw new Error("Expected available view.");
    }

    expect(result.view.synthetic).toMatchObject({
      count: 1,
      marked: true,
      contextType: "synthetic_forward_planning",
      historicalEvidence: false,
      limitations: expect.arrayContaining([
        "not_historical_support_resistance",
      ]),
    });
    expect(result.view.quality).toMatchObject({
      warningCount: 1,
      warnings: expect.arrayContaining(["no_support_extension_coverage"]),
      hasLevelQualityAudit: true,
    });
    expect(result.view.diagnostics.count).toBeGreaterThan(0);
    expect(result.view.limitations.count).toBe(0);
  });

  it("does not import execution scoring feedback or analysis implementation modules", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/level-analysis/execution-level-context-consumption-adapter.ts",
      ),
      "utf8",
    );

    expect(source).not.toMatch(/from\s+["'][^"']*(trade-analysis|execution-feedback|pattern-scoring|coaching)/);
    expect(source).not.toMatch(/require\(["'][^"']*(trade-analysis|execution-feedback|pattern-scoring|coaching)/);
  });
});
