import { describe, expect, it } from "vitest";
import fixture from "../__fixtures__/journal-connector-level-analysis-snapshot-v1.json";
import {
  deriveLevelAnalysisConnectorView,
  findSyntheticContinuationMapLevels,
  loadLevelAnalysisSnapshotForJournal,
  parseLevelAnalysisSnapshotJson,
  validateLevelAnalysisSnapshotV1,
} from "../level-analysis-snapshot-adapter";
import type {
  LevelAnalysisAdapterResult,
  LevelAnalysisConnectorView,
  LevelAnalysisFinalLevelZone,
  LevelAnalysisSnapshotV1,
} from "../level-analysis-snapshot-contract";

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

function assertAccepted(
  result: LevelAnalysisAdapterResult,
): asserts result is Extract<LevelAnalysisAdapterResult, { status: "accepted" }> {
  expect(result.status).toBe("accepted");
}

function assertQuarantined(
  result: LevelAnalysisAdapterResult,
): asserts result is Extract<LevelAnalysisAdapterResult, { status: "quarantined" }> {
  expect(result.status).toBe("quarantined");
  expect(result.errors.length).toBeGreaterThan(0);
}

function validateFixture(snapshot: MutableSnapshot = cloneFixture()): Extract<
  LevelAnalysisAdapterResult,
  { status: "accepted" }
> {
  const result = validateLevelAnalysisSnapshotV1(snapshot, {
    requireReplaySafe: true,
  });
  assertAccepted(result);
  return result;
}

function visibleLevelBuckets(snapshot: LevelAnalysisSnapshotV1): LevelAnalysisFinalLevelZone[] {
  return [
    ...snapshot.levelEngineOutput.majorSupport,
    ...snapshot.levelEngineOutput.majorResistance,
    ...snapshot.levelEngineOutput.intermediateSupport,
    ...snapshot.levelEngineOutput.intermediateResistance,
    ...snapshot.levelEngineOutput.intradaySupport,
    ...snapshot.levelEngineOutput.intradayResistance,
  ];
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

function expectNoJournalOwnedFields(view: LevelAnalysisConnectorView): void {
  const keys = collectObjectKeys(view);
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

function expectNoJournalOwnedLanguage(view: LevelAnalysisConnectorView): void {
  const text = collectStringValues(view).join("\n").toLowerCase();

  for (const [label, pattern] of [
    ["grading", /\bgrading\b/],
    ["coaching", /\bcoaching\b/],
    ["p/l", /\bp\/l\b|\bpnl\b/],
    ["giveback", /\bgiveback\b/],
    ["behavior scoring", /\bbehavior score\b|\bbehavior scoring\b/],
    ["recommendation", /\brecommendation\b/],
    ["buy/sell/hold", /\bbuy\b|\bsell\b|\bhold\b/],
    ["entry decision", /\bentry decision\b/],
    ["exit decision", /\bexit decision\b/],
    ["trade advice", /\btrade advice\b/],
  ] as const) {
    expect(pattern.test(text), `Unexpected ${label} language in connector view`).toBe(false);
  }
}

describe("LevelAnalysisSnapshot adapter", () => {
  it("accepts the compact v1 fixture and returns a factual connector view", () => {
    const rawJson = JSON.stringify(fixture);
    const parsed = parseLevelAnalysisSnapshotJson(rawJson);
    const result = loadLevelAnalysisSnapshotForJournal(rawJson);

    expect(parsed).toMatchObject({
      schemaVersion: "level-analysis-snapshot/v1",
      producer: "levels-system",
    });

    assertAccepted(result);
    expect(result.snapshot.schemaVersion.startsWith("level-analysis-snapshot/v1")).toBe(true);
    expect(result.snapshot.producer).toBe("levels-system");
    expect(result.snapshot.symbol).toBeTruthy();
    expect(result.snapshot.asOfTimestamp).toBeTypeOf("number");
    expect(result.snapshot.referencePrice).toBeTypeOf("number");
    expect(result.snapshot.inputSummary).toBeTruthy();
    expect(result.snapshot.levelEngineOutput).toBeTruthy();
    expect(result.snapshot.levelIntelligenceReport).toBeTruthy();
    expect(result.snapshot.levelQualityAudit).toBeTruthy();
    expect(Array.isArray(result.snapshot.diagnostics)).toBe(true);
    expect(result.snapshot.safety.noLookaheadApplied).toBe(true);
    expect(result.view.contract.producer).toBe("levels-system");
  });

  it("preserves raw snapshots and additive unknown fields without mutating level output", () => {
    const snapshot = cloneFixture();
    snapshot.connectorUnknownTopLevel = { preserved: true };
    snapshot.levelEngineOutput.metadata.connectorUnknownNested = {
      preserved: "nested",
    };
    const before = JSON.parse(JSON.stringify(snapshot));
    const levelOutputBefore = JSON.parse(JSON.stringify(snapshot.levelEngineOutput));

    const result = validateFixture(snapshot);

    expect(result.sourceSnapshot).toBe(snapshot);
    expect(result.snapshot).toBe(snapshot);
    expect(result.sourceSnapshot.connectorUnknownTopLevel).toEqual({ preserved: true });
    expect(result.sourceSnapshot.levelEngineOutput.metadata).toMatchObject({
      connectorUnknownNested: { preserved: "nested" },
    });
    expect(result.sourceSnapshot).toEqual(before);
    expect(result.sourceSnapshot.levelEngineOutput).toEqual(levelOutputBefore);
  });

  it("derives a connector view with factual identity levels facts diagnostics safety quality and limitations", () => {
    const result = validateFixture();
    const view = deriveLevelAnalysisConnectorView(result.snapshot);

    expect(view.contract).toEqual({
      schemaVersion: result.snapshot.schemaVersion,
      producer: "levels-system",
    });
    expect(view.identity).toEqual({
      symbol: result.snapshot.symbol,
      asOfTimestamp: result.snapshot.asOfTimestamp,
      referencePrice: result.snapshot.referencePrice,
    });
    expect(view.sourceSnapshot.symbol).toBe(result.snapshot.symbol);
    expect("support" in view.nearest).toBe(true);
    expect("resistance" in view.nearest).toBe(true);
    expect(view.levelMap.bucketCounts.majorSupport).toBe(
      result.snapshot.levelEngineOutput.majorSupport.length,
    );
    expect(view.levelMap.extensionCounts.total).toBe(
      result.snapshot.levelEngineOutput.extensionLevels.support.length +
        result.snapshot.levelEngineOutput.extensionLevels.resistance.length,
    );
    expect(view.facts.hasSessionFacts).toBe(true);
    expect(view.facts.hasVolumeFacts).toBe(true);
    expect(view.diagnostics.snapshotDiagnosticsCount).toBe(result.snapshot.diagnostics.length);
    expect(view.safety.noLookaheadApplied).toBe(true);
    expect(view.quality.hasLevelQualityAudit).toBe(true);
    expect(view.syntheticExtensions.count).toBeGreaterThan(0);
    expect(Array.isArray(view.limitations)).toBe(true);
    expect(view.compatibility.acceptsAdditiveFields).toBe(true);
  });

  it.each([
    ["missing schemaVersion", (snapshot: MutableSnapshot) => delete snapshot.schemaVersion],
    ["wrong schema major", (snapshot: MutableSnapshot) => {
      snapshot.schemaVersion = "level-analysis-snapshot/v2";
    }],
    ["wrong producer", (snapshot: MutableSnapshot) => {
      snapshot.producer = "other-system";
    }],
    ["missing symbol", (snapshot: MutableSnapshot) => delete snapshot.symbol],
    ["missing asOfTimestamp", (snapshot: MutableSnapshot) => delete snapshot.asOfTimestamp],
    ["missing inputSummary", (snapshot: MutableSnapshot) => delete snapshot.inputSummary],
    ["missing levelEngineOutput", (snapshot: MutableSnapshot) => {
      delete (snapshot as Partial<MutableSnapshot>).levelEngineOutput;
    }],
    ["missing diagnostics", (snapshot: MutableSnapshot) => delete snapshot.diagnostics],
    ["missing safety", (snapshot: MutableSnapshot) => {
      delete (snapshot as Partial<MutableSnapshot>).safety;
    }],
    ["unsafe no-lookahead", (snapshot: MutableSnapshot) => {
      snapshot.safety.noLookaheadApplied = false;
    }],
    ["synthetic marking false", (snapshot: MutableSnapshot) => {
      snapshot.safety.syntheticExtensionsClearlyMarked = false;
    }],
    ["malformed nearest support", (snapshot: MutableSnapshot) => {
      snapshot.nearestSupport = { representativePrice: snapshot.referencePrice - 1 };
    }],
  ])("quarantines malformed snapshot: %s", (_label, mutate) => {
    const snapshot = cloneFixture();
    mutate(snapshot);

    const result = validateLevelAnalysisSnapshotV1(snapshot, {
      requireReplaySafe: true,
    });

    assertQuarantined(result);
  });

  it.each([
    ["nearestSupport null", (snapshot: MutableSnapshot) => {
      snapshot.nearestSupport = null;
    }, "nearest_support_unavailable"],
    ["nearestResistance null", (snapshot: MutableSnapshot) => {
      snapshot.nearestResistance = null;
    }, "nearest_resistance_unavailable"],
    ["empty extension arrays", (snapshot: MutableSnapshot) => {
      snapshot.levelEngineOutput.extensionLevels.support = [];
      snapshot.levelEngineOutput.extensionLevels.resistance = [];
    }, "extension_levels_empty"],
    ["no volumeShelves", (snapshot: MutableSnapshot) => {
      delete snapshot.volumeShelves;
    }, "volume_shelves_unavailable"],
    ["absent marketContext", (snapshot: MutableSnapshot) => {
      delete snapshot.marketContext;
    }, "market_context_unavailable"],
    ["absent factsBundle", (snapshot: MutableSnapshot) => {
      delete snapshot.factsBundle;
    }, "facts_bundle_unavailable"],
    ["additive unknown fields", (snapshot: MutableSnapshot) => {
      snapshot.additiveConnectorField = true;
      snapshot.levelEngineOutput.metadata.additiveNestedField = "ok";
    }, undefined],
  ])("accepts optional or nullable scenario with limitations: %s", (_label, mutate, code) => {
    const snapshot = cloneFixture();
    mutate(snapshot);

    const result = validateLevelAnalysisSnapshotV1(snapshot, {
      requireReplaySafe: true,
    });

    assertAccepted(result);
    if (code) {
      expect(result.limitations.some((item) => item.code === code)).toBe(true);
      expect(result.view.limitations.some((item) => item.code === code)).toBe(true);
    }
  });

  it("keeps synthetic continuation-map rows marked and outside surfaced buckets", () => {
    const result = validateFixture();
    const syntheticRows = findSyntheticContinuationMapLevels(result.snapshot);
    const surfacedIds = new Set(visibleLevelBuckets(result.snapshot).map((level) => level.id));

    expect(syntheticRows.length).toBeGreaterThan(0);

    for (const synthetic of syntheticRows) {
      expect(synthetic.extensionMetadata?.extensionSource).toBe(
        "synthetic_continuation_map",
      );
      expect(synthetic.extensionMetadata?.evidenceLimitations).toContain(
        "not_historical_support_resistance",
      );
      expect(synthetic.touchCount).toBe(0);
      expect(synthetic.confluenceCount).toBe(0);
      expect(synthetic.sourceEvidenceCount).toBe(0);
      expect(synthetic.rejectionScore).toBe(0);
      expect(synthetic.reactionQualityScore).toBe(0);
      expect(synthetic.followThroughScore).toBe(0);
      expect(surfacedIds.has(synthetic.id)).toBe(false);
      expect(synthetic.isExtension).toBe(true);
    }
  });

  it("surfaces LevelQualityAudit only as factual quality context", () => {
    const result = validateFixture();

    expect(result.view.quality.hasLevelQualityAudit).toBe(true);
    expect(result.view.quality.hasExtensionCoverage).toBe(true);
    expect(result.view.diagnostics.qualityDiagnosticsCount).toBeGreaterThanOrEqual(0);
    expectNoJournalOwnedFields(result.view);
    expectNoJournalOwnedLanguage(result.view);
  });

  it("does not introduce journal-owned fields or advice language in the derived view", () => {
    const result = validateFixture();

    expectNoJournalOwnedFields(result.view);
    expectNoJournalOwnedLanguage(result.view);
  });
});
