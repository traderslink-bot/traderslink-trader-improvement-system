import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import fixture from "../__fixtures__/journal-connector-level-analysis-snapshot-v1.json";
import {
  buildExecutionAnalysisLevelContextInputFromAttachment,
  buildExecutionAnalysisLevelContextInputFromStorageRecord,
  type ExecutionAnalysisLevelContextInput,
} from "../execution-level-context-input";
import {
  buildExecutionLevelContextObservations,
  type ExecutionLevelContextObservationSet,
} from "../execution-level-context-observations";
import {
  assertExecutionLevelContextObservationReadModelIsFactualOnly,
  buildExecutionLevelContextObservationReadModel,
  buildExecutionLevelContextObservationReadModelFromObservations,
  buildUnavailableExecutionLevelContextObservationReadModel,
  summarizeExecutionLevelContextObservationReadModel,
} from "../execution-level-context-observation-read-model";
import { validateLevelAnalysisSnapshotV1 } from "../level-analysis-snapshot-adapter";
import {
  createLevelAnalysisSnapshotAttachment,
  type LevelAnalysisSnapshotAttachment,
  type QuarantinedLevelAnalysisSnapshotAttachment,
} from "../level-analysis-snapshot-attachment";
import type { LevelAnalysisAdapterResult } from "../level-analysis-snapshot-contract";
import { createLevelAnalysisSnapshotStorageRecord } from "../level-analysis-snapshot-storage";

const OWNER = { ownerId: "trade-123", ownerType: "trade" };
const ATTACHED_AT = Date.parse("2026-05-31T23:00:00-04:00");
const CREATED_AT = Date.parse("2026-05-31T23:05:00-04:00");

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

function createQuarantinedAttachment(
  snapshot: MutableSnapshot,
): QuarantinedLevelAnalysisSnapshotAttachment {
  const result = createLevelAnalysisSnapshotAttachment({
    owner: OWNER,
    rawJson: JSON.stringify(snapshot),
    requireReplaySafe: true,
    attachedAt: ATTACHED_AT,
  });

  expect(result.status).toBe("quarantined");
  return result.attachment as QuarantinedLevelAnalysisSnapshotAttachment;
}

function buildFactualContext(
  snapshot: MutableSnapshot = cloneFixture(),
): ExecutionAnalysisLevelContextInput {
  const record = createLevelAnalysisSnapshotStorageRecord({
    attachment: createAcceptedAttachment(snapshot),
    createdAt: CREATED_AT,
  });
  const result = buildExecutionAnalysisLevelContextInputFromStorageRecord(record);

  expect(result.status).toBe("available");
  if (result.status !== "available") {
    throw new Error("Expected available execution level context input.");
  }

  return result.input;
}

function buildObservationSet(
  context: ExecutionAnalysisLevelContextInput,
): ExecutionLevelContextObservationSet {
  const result = buildExecutionLevelContextObservations(context);

  expect(result.status).toBe("observed");
  return result.observationSet;
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

describe("execution level context observation read model", () => {
  it("builds a compact factual read model from available context and observations", () => {
    const context = buildFactualContext();
    const observations = buildObservationSet(context);
    const result = buildExecutionLevelContextObservationReadModelFromObservations(
      context,
      observations,
    );

    expect(result.status).toBe("built");
    expect(result.readModel.contractVersion).toBe(
      "execution_level_context_observation_read_model_v1",
    );
    expect(result.readModel.status).toBe("available");
    expect(result.readModel.identity).toEqual({
      symbol: fixture.symbol,
      asOfTimestamp: fixture.asOfTimestamp,
      referencePrice: fixture.referencePrice,
    });
    expect(result.readModel.nearestLevels.support).toMatchObject({
      present: true,
      levelId: fixture.nearestSupport.levelId,
      representativePrice: fixture.nearestSupport.representativePrice,
    });
    expect(result.readModel.nearestLevels.resistance).toMatchObject({
      present: true,
      levelId: fixture.nearestResistance.levelId,
      representativePrice: fixture.nearestResistance.representativePrice,
    });
    expect(result.readModel.levelMap.bucketCounts).toEqual(context.levelBucketCounts);
    expect(result.readModel.levelMap.extensionCounts).toEqual(context.extensionCounts);
    expect(result.readModel.synthetic).toMatchObject({
      available: true,
      count: 1,
      marked: true,
      contextType: "synthetic_forward_planning",
      historicalEvidence: false,
    });
    expect(result.readModel.quality.warningCount).toBe(1);
    expect(result.readModel.diagnostics.count).toBeGreaterThan(0);
    expect(result.readModel.limitations.count).toBe(0);
    expect(result.readModel.safety).toMatchObject({
      noLookaheadApplied: true,
      syntheticExtensionsClearlyMarked: true,
      factualContextOnly: true,
    });
    expect(result.readModel.observationSummary.total).toBe(
      observations.observations.length,
    );
  });

  it("represents unavailable and unsafe contexts without available status", () => {
    const unavailable = buildUnavailableExecutionLevelContextObservationReadModel(
      "quarantined_snapshot",
    );

    expect(unavailable.readModel.status).toBe("unavailable");
    expect(unavailable.readModel.statusReason).toBe("quarantined_snapshot");
    expect(unavailable.readModel.identity.symbol).toBeNull();
    expect(unavailable.readModel.safety.noLookaheadApplied).toBe(false);

    const invalid = cloneFixture();
    delete invalid.schemaVersion;
    const unavailableResult = buildExecutionAnalysisLevelContextInputFromAttachment(
      createQuarantinedAttachment(invalid),
    );
    const unavailableFromBuild =
      buildExecutionLevelContextObservationReadModel(unavailableResult);
    expect(unavailableFromBuild.readModel.status).toBe("unavailable");
    expect(unavailableFromBuild.readModel.statusReason).toBe(
      "quarantined_snapshot",
    );

    const unsafe = cloneValue(buildFactualContext());
    unsafe.safety.noLookaheadApplied = false;
    const unsafeReadModel = buildExecutionLevelContextObservationReadModel(unsafe);
    expect(unsafeReadModel.readModel.status).toBe("not_replay_safe");
    expect(unsafeReadModel.readModel.observationSummary.hasNotReplaySafe).toBe(true);
  });

  it("summarizes synthetic continuation-map context without historical evidence", () => {
    const context = buildFactualContext();
    const readModel =
      buildExecutionLevelContextObservationReadModel(context).readModel;

    expect(readModel.synthetic).toMatchObject({
      available: true,
      count: 1,
      supportCount: context.syntheticContinuationMap.supportCount,
      resistanceCount: context.syntheticContinuationMap.resistanceCount,
      marked: true,
      contextType: "synthetic_forward_planning",
      historicalEvidence: false,
      limitations: expect.arrayContaining([
        "not_historical_support_resistance",
      ]),
    });
    expect(readModel.nearestLevels.support.isExtension).toBe(false);
  });

  it("preserves quality diagnostics limitations and optional missing facts factually", () => {
    const degraded = cloneFixture();
    degraded.nearestSupport = null;
    delete degraded.marketContext;
    delete degraded.factsBundle;
    degraded.volumeShelves = [];

    const readModel = buildExecutionLevelContextObservationReadModel(
      buildFactualContext(degraded),
    ).readModel;

    expect(readModel.status).toBe("limited");
    expect(readModel.nearestLevels.support.present).toBe(false);
    expect(readModel.quality).toMatchObject({
      available: true,
      warningCount: 1,
      warnings: expect.arrayContaining(["no_support_extension_coverage"]),
    });
    expect(readModel.diagnostics.count).toBeGreaterThan(0);
    expect(readModel.limitations).toMatchObject({
      available: true,
      count: expect.any(Number),
      messages: expect.arrayContaining([
        "Nearest support is unavailable in this as-of snapshot.",
      ]),
    });
    expect(readModel.factPresence).toMatchObject({
      volumeShelfCount: 0,
      hasMarketContext: false,
      hasFactsBundle: false,
    });
    expect(readModel.observationSummary.byKind.optional_facts_missing).toBe(1);
  });

  it("is deterministic and does not mutate input context or observations", () => {
    const context = buildFactualContext();
    const observations = buildObservationSet(context);
    const contextBefore = cloneValue(context);
    const observationsBefore = cloneValue(observations);

    const first = buildExecutionLevelContextObservationReadModelFromObservations(
      context,
      observations,
    );
    const second = buildExecutionLevelContextObservationReadModelFromObservations(
      context,
      observations,
    );

    expect(first.readModel).toEqual(second.readModel);
    expect(context).toEqual(contextBefore);
    expect(observations).toEqual(observationsBefore);
  });

  it("summarizes the read model without creating interpretation fields", () => {
    const readModel = buildExecutionLevelContextObservationReadModel(
      buildFactualContext(),
    ).readModel;
    const summary = summarizeExecutionLevelContextObservationReadModel(readModel);

    expect(summary).toMatchObject({
      status: "available",
      symbol: fixture.symbol,
      asOfTimestamp: fixture.asOfTimestamp,
      nearestSupportPresent: true,
      nearestResistancePresent: true,
      syntheticContinuationMapCount: 1,
      limitationCount: 0,
      qualityWarningCount: 1,
      replaySafe: true,
    });
    expectNoForbiddenFields(summary);
    expectNoForbiddenLanguage(summary);
  });

  it("keeps read model objects and text free of journal-owned interpretation language", () => {
    const readModel = buildExecutionLevelContextObservationReadModel(
      buildFactualContext(),
    ).readModel;

    expectNoForbiddenFields(readModel);
    expectNoForbiddenLanguage(readModel);
    expect(() =>
      assertExecutionLevelContextObservationReadModelIsFactualOnly(readModel),
    ).not.toThrow();
    expect(() =>
      assertExecutionLevelContextObservationReadModelIsFactualOnly({
        ...readModel,
        tradeAdvice: "not allowed",
      }),
    ).toThrow(/factual-only/);
  });

  it("does not import execution scoring or feedback implementation modules", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/level-analysis/execution-level-context-observation-read-model.ts",
      ),
      "utf8",
    );

    expect(source).not.toMatch(/from\s+["'][^"']*(trade-analysis|execution-feedback|pattern-scoring|coaching)/);
    expect(source).not.toMatch(/require\(["'][^"']*(trade-analysis|execution-feedback|pattern-scoring|coaching)/);
  });
});
