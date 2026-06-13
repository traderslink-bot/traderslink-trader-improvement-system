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
  assertExecutionLevelContextObservationsAreFactualOnly,
  buildExecutionLevelContextObservations,
  buildUnavailableExecutionLevelContextObservations,
  filterExecutionLevelContextObservationsByKind,
  hasExecutionLevelContextObservation,
  summarizeExecutionLevelContextObservations,
} from "../execution-level-context-observations";
import { validateLevelAnalysisSnapshotV1 } from "../level-analysis-snapshot-adapter";
import {
  createLevelAnalysisSnapshotAttachment,
  type LevelAnalysisSnapshotAttachment,
  type QuarantinedLevelAnalysisSnapshotAttachment,
} from "../level-analysis-snapshot-attachment";
import type { LevelAnalysisAdapterResult } from "../level-analysis-snapshot-contract";
import { createLevelAnalysisSnapshotStorageRecord } from "../level-analysis-snapshot-storage";

const OWNER = { ownerId: "trade-123", ownerType: "trade" };
const ATTACHED_AT = Date.parse("2026-05-31T21:00:00-04:00");
const CREATED_AT = Date.parse("2026-05-31T21:05:00-04:00");

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

describe("execution level context observations", () => {
  it("builds neutral observations from available factual context", () => {
    const context = buildFactualContext();
    const result = buildExecutionLevelContextObservations(context);

    expect(result.status).toBe("observed");
    expect(result.observationSet.consumable).toBe(true);
    expect(hasExecutionLevelContextObservation(result.observationSet, "level_context_available")).toBe(true);
    expect(hasExecutionLevelContextObservation(result.observationSet, "nearest_support_available")).toBe(true);
    expect(hasExecutionLevelContextObservation(result.observationSet, "nearest_resistance_available")).toBe(true);
    expect(hasExecutionLevelContextObservation(result.observationSet, "extension_coverage_available")).toBe(true);
    expect(hasExecutionLevelContextObservation(result.observationSet, "synthetic_continuation_map_present")).toBe(true);
    expect(hasExecutionLevelContextObservation(result.observationSet, "quality_warnings_present")).toBe(true);
    expect(hasExecutionLevelContextObservation(result.observationSet, "diagnostics_present")).toBe(true);

    expect(result.observationSet.summary).toMatchObject({
      hasUnavailableContext: false,
      hasNotReplaySafe: false,
      syntheticContinuationMapCount: 1,
      qualityWarningCount: 1,
    });
    expect(result.observationSet.summary.total).toBe(
      result.observationSet.observations.length,
    );
  });

  it("surfaces unavailable, quarantined, and unsafe context without available observations", () => {
    const invalid = cloneFixture();
    delete invalid.schemaVersion;
    const unavailable = buildExecutionAnalysisLevelContextInputFromAttachment(
      createQuarantinedAttachment(invalid),
    );
    const unavailableObservations =
      buildExecutionLevelContextObservations(unavailable);

    expect(unavailableObservations.status).toBe("unavailable");
    if (unavailableObservations.status !== "unavailable") {
      throw new Error("Expected unavailable observations.");
    }
    expect(unavailableObservations.reason).toBe("quarantined_snapshot");
    expect(hasExecutionLevelContextObservation(unavailableObservations.observationSet, "level_context_unavailable")).toBe(true);
    expect(hasExecutionLevelContextObservation(unavailableObservations.observationSet, "level_context_available")).toBe(false);

    const unsafeContext = cloneValue(buildFactualContext());
    unsafeContext.safety.noLookaheadApplied = false;
    const unsafeObservations =
      buildExecutionLevelContextObservations(unsafeContext);

    expect(unsafeObservations.status).toBe("unavailable");
    expect(hasExecutionLevelContextObservation(unsafeObservations.observationSet, "level_context_unavailable")).toBe(true);
    expect(hasExecutionLevelContextObservation(unsafeObservations.observationSet, "not_replay_safe")).toBe(true);
    expect(hasExecutionLevelContextObservation(unsafeObservations.observationSet, "level_context_available")).toBe(false);
  });

  it("keeps synthetic continuation-map observations factual and clearly labeled", () => {
    const context = buildFactualContext();
    const result = buildExecutionLevelContextObservations(context);
    const synthetic = filterExecutionLevelContextObservationsByKind(
      result.observationSet,
      "synthetic_continuation_map_present",
    );

    expect(synthetic).toHaveLength(1);
    expect(synthetic[0].facts).toMatchObject({
      count: 1,
      source: "synthetic_continuation_map",
      evidenceLimitations: expect.arrayContaining([
        "not_historical_support_resistance",
      ]),
    });
    expect(synthetic[0].message).toContain("factual forward-planning context only");
    expect(hasExecutionLevelContextObservation(result.observationSet, "nearest_support_available")).toBe(true);
  });

  it("surfaces quality diagnostics limitations and optional missing facts as observations", () => {
    const degraded = cloneFixture();
    degraded.nearestSupport = null;
    delete degraded.marketContext;
    delete degraded.factsBundle;
    degraded.volumeShelves = [];

    const result = buildExecutionLevelContextObservations(
      buildFactualContext(degraded),
    );

    expect(result.status).toBe("observed");
    expect(hasExecutionLevelContextObservation(result.observationSet, "nearest_support_missing")).toBe(true);
    expect(hasExecutionLevelContextObservation(result.observationSet, "quality_warnings_present")).toBe(true);
    expect(hasExecutionLevelContextObservation(result.observationSet, "diagnostics_present")).toBe(true);
    expect(hasExecutionLevelContextObservation(result.observationSet, "limitations_present")).toBe(true);
    expect(hasExecutionLevelContextObservation(result.observationSet, "optional_facts_missing")).toBe(true);

    const limitations = filterExecutionLevelContextObservationsByKind(
      result.observationSet,
      "limitations_present",
    )[0];
    expect(limitations.facts).toMatchObject({
      count: expect.any(Number),
      messages: expect.arrayContaining([
        "Nearest support is unavailable in this as-of snapshot.",
      ]),
    });

    const optionalFacts = filterExecutionLevelContextObservationsByKind(
      result.observationSet,
      "optional_facts_missing",
    )[0];
    expect(optionalFacts.facts).toMatchObject({
      missingFacts: expect.arrayContaining([
        "volumeShelves",
        "marketContext",
        "factsBundle",
      ]),
    });
  });

  it("summarizes filters and detects observation kinds", () => {
    const result = buildExecutionLevelContextObservations(buildFactualContext());
    const summary = summarizeExecutionLevelContextObservations(
      result.observationSet.observations,
    );

    expect(summary.total).toBe(result.observationSet.observations.length);
    expect(summary.byKind.level_context_available).toBe(1);
    expect(summary.bySeverity.info).toBeGreaterThan(0);
    expect(filterExecutionLevelContextObservationsByKind(
      result.observationSet,
      "diagnostics_present",
    )).toHaveLength(1);
    expect(hasExecutionLevelContextObservation(result.observationSet, "not_replay_safe")).toBe(false);
  });

  it("builds explicit unavailable observations when no context exists", () => {
    const result = buildUnavailableExecutionLevelContextObservations("missing_context");

    expect(result.status).toBe("unavailable");
    if (result.status !== "unavailable") {
      throw new Error("Expected unavailable observations.");
    }
    expect(result.reason).toBe("missing_context");
    expect(result.observationSet.summary).toMatchObject({
      total: 1,
      hasUnavailableContext: true,
    });
  });

  it("keeps observation objects and text free of journal-owned interpretation language", () => {
    const result = buildExecutionLevelContextObservations(buildFactualContext());

    expectNoForbiddenFields(result);
    expectNoForbiddenLanguage(result);
    expect(() =>
      assertExecutionLevelContextObservationsAreFactualOnly(result),
    ).not.toThrow();
    expect(() =>
      assertExecutionLevelContextObservationsAreFactualOnly({
        ...result,
        tradeAdvice: "not allowed",
      }),
    ).toThrow(/factual-only/);
  });

  it("does not import execution scoring or feedback implementation modules", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/level-analysis/execution-level-context-observations.ts",
      ),
      "utf8",
    );

    expect(source).not.toMatch(/from\s+["'][^"']*(trade-analysis|execution-feedback|pattern-scoring|coaching)/);
    expect(source).not.toMatch(/require\(["'][^"']*(trade-analysis|execution-feedback|pattern-scoring|coaching)/);
  });
});
