import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
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
  createLevelAnalysisSnapshotStorageRecord,
  createQuarantinedLevelAnalysisSnapshotStorageRecord,
  storeLevelAnalysisSnapshotRecord,
  type LevelAnalysisSnapshotStorageIndex,
  type LevelAnalysisSnapshotStorageRecord,
} from "../level-analysis-snapshot-storage";
import {
  buildExecutionAnalysisLevelContextInputFromAttachment,
  buildExecutionAnalysisLevelContextInputFromStorageRecord,
  buildExecutionAnalysisLevelContextInputFromStoredSnapshots,
  isExecutionAnalysisLevelContextReplaySafe,
  summarizeExecutionAnalysisLevelContextAvailability,
} from "../execution-level-context-input";

const OWNER = { ownerId: "trade-123", ownerType: "trade" };
const ATTACHED_AT = Date.parse("2026-05-31T17:00:00-04:00");
const CREATED_AT = Date.parse("2026-05-31T17:05:00-04:00");

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
    attachedAt: ATTACHED_AT,
  });

  expect(result.status).toBe("attached");
  return result.attachment as LevelAnalysisSnapshotAttachment;
}

function createAttachmentFromRaw(
  snapshot: MutableSnapshot,
  requireReplaySafe = true,
): LevelAnalysisSnapshotAttachment | QuarantinedLevelAnalysisSnapshotAttachment {
  const result = createLevelAnalysisSnapshotAttachment({
    owner: OWNER,
    rawJson: JSON.stringify(snapshot),
    requireReplaySafe,
    attachedAt: ATTACHED_AT,
  });

  return result.attachment;
}

function createAcceptedRecord(
  snapshot: MutableSnapshot = cloneFixture(),
): LevelAnalysisSnapshotStorageRecord {
  return createLevelAnalysisSnapshotStorageRecord({
    attachment: createAcceptedAttachment(snapshot),
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
    ["mistake", /\bmistake\b/],
    ["discipline", /\bdiscipline\b/],
  ] as const) {
    expect(pattern.test(text), `Unexpected ${label} language`).toBe(false);
  }
}

describe("ExecutionAnalysisLevelContextInput contract", () => {
  it("builds factual execution level context input from an accepted attachment", () => {
    const attachment = createAcceptedAttachment();
    const result = buildExecutionAnalysisLevelContextInputFromAttachment(attachment);

    expect(result.status).toBe("available");
    if (result.status !== "available") {
      throw new Error("Expected available context input.");
    }

    expect(result.input.contract).toEqual({
      schemaVersion: "level-analysis-snapshot/v1",
      producer: "levels-system",
      sourceType: "level-analysis-snapshot-v1",
    });
    expect(result.input.source.attachmentKey).toBe(attachment.attachmentKey);
    expect(result.input.owner).toEqual(OWNER);
    expect(result.input.identity).toEqual({
      symbol: fixture.symbol,
      asOfTimestamp: fixture.asOfTimestamp,
      referencePrice: fixture.referencePrice,
    });
    expect(result.input.nearestSupport?.levelId).toBe(fixture.nearestSupport.levelId);
    expect(result.input.nearestResistance?.levelId).toBe(fixture.nearestResistance.levelId);
    expect(result.input.levelBucketCounts.majorSupport).toBe(
      fixture.levelEngineOutput.majorSupport.length,
    );
    expect(result.input.extensionCounts).toMatchObject({
      support: fixture.levelEngineOutput.extensionLevels.support.length,
      resistance: fixture.levelEngineOutput.extensionLevels.resistance.length,
      total:
        fixture.levelEngineOutput.extensionLevels.support.length +
        fixture.levelEngineOutput.extensionLevels.resistance.length,
      synthetic: 1,
    });
    expect(result.input.syntheticContinuationMap.count).toBe(1);
    expect(result.input.syntheticContinuationMap.levels[0]).toMatchObject({
      extensionSource: "synthetic_continuation_map",
      evidenceLimitations: expect.arrayContaining([
        "not_historical_support_resistance",
      ]),
    });
    expect(result.input.factPresence.hasSessionFacts).toBe(true);
    expect(result.input.diagnostics.snapshotDiagnostics).toContain(
      "candle_close_as_of_filter_applied",
    );
    expect(result.input.quality.extensionCoverageWarnings).toContain(
      "no_support_extension_coverage",
    );
    expect(isExecutionAnalysisLevelContextReplaySafe(result.input)).toBe(true);
    expect(summarizeExecutionAnalysisLevelContextAvailability(result).available).toBe(true);
  });

  it("builds factual input from an accepted storage record without mutating raw snapshot or connector view", () => {
    const snapshot = cloneFixture();
    snapshot.additiveTopLevel = { preserved: true };
    const record = createAcceptedRecord(snapshot);
    const rawBefore = JSON.parse(JSON.stringify(record.rawSnapshot));
    const viewBefore = JSON.parse(JSON.stringify(record.factualConnectorView));

    const result = buildExecutionAnalysisLevelContextInputFromStorageRecord(record);

    expect(result.status).toBe("available");
    if (result.status !== "available") {
      throw new Error("Expected available context input.");
    }

    expect(result.input.source.storageKey).toBe(record.storageKey);
    expect(result.input.source.attachmentKey).toBe(record.attachment.attachmentKey);
    expect(record.rawSnapshot).toEqual(rawBefore);
    expect(record.factualConnectorView).toEqual(viewBefore);
    expect(record.rawSnapshot.additiveTopLevel).toEqual({ preserved: true });
  });

  it("builds from stored snapshots using nearest-as-of retrieval without selecting future or quarantined records", () => {
    const base = fixture.asOfTimestamp;
    const early = createAcceptedRecord(withAsOf(base - 600_000));
    const current = createAcceptedRecord(withAsOf(base));
    const future = createAcceptedRecord(withAsOf(base + 600_000));
    const invalid = cloneFixture();
    delete invalid.schemaVersion;
    const quarantinedAttachment = createAttachmentFromRaw(invalid);
    expect(quarantinedAttachment.validationStatus).toBe("quarantined");
    const quarantined = createQuarantinedLevelAnalysisSnapshotStorageRecord({
      attachment: quarantinedAttachment as QuarantinedLevelAnalysisSnapshotAttachment,
      createdAt: CREATED_AT,
    });
    let records: LevelAnalysisSnapshotStorageIndex = [];
    records = storeLevelAnalysisSnapshotRecord(records, early);
    records = storeLevelAnalysisSnapshotRecord(records, current);
    records = storeLevelAnalysisSnapshotRecord(records, future);
    records = storeLevelAnalysisSnapshotRecord(records, quarantined);

    const result = buildExecutionAnalysisLevelContextInputFromStoredSnapshots(records, {
      ownerId: OWNER.ownerId,
      symbol: fixture.symbol,
      asOfTimestamp: base + 400_000,
    });

    expect(result.status).toBe("available");
    if (result.status !== "available") {
      throw new Error("Expected available context input.");
    }
    expect(result.input.identity.asOfTimestamp).toBe(current.asOfTimestamp);
    expect(result.input.source.storageKey).toBe(current.storageKey);

    const noAccepted = buildExecutionAnalysisLevelContextInputFromStoredSnapshots(
      [quarantined],
      {
        ownerId: OWNER.ownerId,
        symbol: fixture.symbol,
        asOfTimestamp: base,
      },
    );
    expect(noAccepted.status).toBe("unavailable");
    if (noAccepted.status !== "unavailable") {
      throw new Error("Expected unavailable context input.");
    }
    expect(noAccepted.reason).toBe("no_matching_snapshot");
  });

  it("accepts degraded factual context with nullable nearest levels and optional facts as limitations", () => {
    const snapshot = cloneFixture();
    snapshot.nearestSupport = null;
    snapshot.nearestResistance = null;
    snapshot.levelEngineOutput.extensionLevels.support = [];
    snapshot.levelEngineOutput.extensionLevels.resistance = [];
    delete snapshot.marketContext;
    delete snapshot.factsBundle;

    const result = buildExecutionAnalysisLevelContextInputFromAttachment(
      createAcceptedAttachment(snapshot),
    );

    expect(result.status).toBe("available");
    if (result.status !== "available") {
      throw new Error("Expected degraded context input to remain available.");
    }
    expect(result.input.nearestSupport).toBeNull();
    expect(result.input.nearestResistance).toBeNull();
    expect(result.input.extensionCounts.total).toBe(0);
    expect(result.input.syntheticContinuationMap.count).toBe(0);
    expect(result.input.factPresence.hasMarketContext).toBe(false);
    expect(result.input.factPresence.hasFactsBundle).toBe(false);
    expect(result.input.limitations.items.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        "nearest_support_unavailable",
        "nearest_resistance_unavailable",
        "extension_levels_empty",
        "market_context_unavailable",
        "facts_bundle_unavailable",
      ]),
    );
  });

  it("returns unavailable for unsafe or quarantined sources", () => {
    const unsafe = cloneFixture();
    unsafe.safety.noLookaheadApplied = false;
    const unsafeAttachment = createAttachmentFromRaw(unsafe, false);
    expect(unsafeAttachment.validationStatus).toBe("accepted");
    const unsafeResult = buildExecutionAnalysisLevelContextInputFromAttachment(
      unsafeAttachment as LevelAnalysisSnapshotAttachment,
    );
    expect(unsafeResult.status).toBe("unavailable");
    if (unsafeResult.status !== "unavailable") {
      throw new Error("Expected unsafe context input to be unavailable.");
    }
    expect(unsafeResult.reason).toBe("unsafe_no_lookahead");

    const unmarked = cloneFixture();
    unmarked.safety.syntheticExtensionsClearlyMarked = false;
    const unmarkedAttachment = createAttachmentFromRaw(unmarked);
    expect(unmarkedAttachment.validationStatus).toBe("quarantined");
    const unmarkedResult = buildExecutionAnalysisLevelContextInputFromAttachment(
      unmarkedAttachment,
    );
    expect(unmarkedResult.status).toBe("unavailable");
    if (unmarkedResult.status !== "unavailable") {
      throw new Error("Expected unmarked synthetic context to be unavailable.");
    }
    expect(unmarkedResult.reason).toBe("quarantined_snapshot");
  });

  it("keeps the input contract free of journal-owned interpretation fields and language", () => {
    const result = buildExecutionAnalysisLevelContextInputFromAttachment(
      createAcceptedAttachment(),
    );
    expect(result.status).toBe("available");
    if (result.status !== "available") {
      throw new Error("Expected available context input.");
    }

    expectNoForbiddenFields(result.input);
    expectNoForbiddenLanguage(result.input);
  });

  it("does not import execution scoring or analysis modules", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/level-analysis/execution-level-context-input.ts",
      ),
      "utf8",
    );

    expect(source).not.toMatch(/from\s+["'][^"']*(trade-analysis|execution-feedback|pattern-scoring|coaching)/);
    expect(source).not.toMatch(/require\(["'][^"']*(trade-analysis|execution-feedback|pattern-scoring|coaching)/);
  });

  it("keeps existing execution-analysis modules untouched by level-analysis imports", () => {
    const boundaryTestSource = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/level-analysis/__tests__/level-analysis-execution-boundary.test.ts",
      ),
      "utf8",
    );

    expect(boundaryTestSource).toContain(
      "keeps execution-analysis modules from importing level-analysis",
    );
  });

  it("summarizes unavailable context without creating conclusions", () => {
    const invalid = cloneFixture();
    delete invalid.schemaVersion;
    const result = buildExecutionAnalysisLevelContextInputFromAttachment(
      createAttachmentFromRaw(invalid),
    );

    expect(result.status).toBe("unavailable");
    const summary = summarizeExecutionAnalysisLevelContextAvailability(result);

    expect(summary).toMatchObject({
      available: false,
      replaySafe: false,
      symbol: null,
      asOfTimestamp: null,
      reason: "quarantined_snapshot",
    });
    expectNoForbiddenFields(summary);
  });

  it("does not mutate the LevelAnalysisSnapshot payload shape while building input", () => {
    const snapshot = cloneFixture() as LevelAnalysisSnapshotV1;
    const before = JSON.parse(JSON.stringify(snapshot));
    const attachment = createAcceptedAttachment(snapshot as unknown as MutableSnapshot);

    const result = buildExecutionAnalysisLevelContextInputFromAttachment(attachment);

    expect(result.status).toBe("available");
    expect(snapshot).toEqual(before);
    expect(snapshot.levelEngineOutput).toEqual(before.levelEngineOutput);
  });
});
