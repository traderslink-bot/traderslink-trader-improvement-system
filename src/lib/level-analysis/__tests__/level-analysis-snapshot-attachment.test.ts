import { describe, expect, it } from "vitest";
import fixture from "../__fixtures__/journal-connector-level-analysis-snapshot-v1.json";
import { validateLevelAnalysisSnapshotV1 } from "../level-analysis-snapshot-adapter";
import {
  attachLevelAnalysisSnapshotToTradeContext,
  createLevelAnalysisSnapshotAttachment,
  deriveLevelAnalysisSnapshotAttachmentKey,
  getAttachedLevelAnalysisSnapshotContext,
  validateLevelAnalysisSnapshotAttachment,
  type LevelAnalysisSnapshotAttachment,
} from "../level-analysis-snapshot-attachment";
import type { LevelAnalysisAdapterResult } from "../level-analysis-snapshot-contract";

const ATTACHED_AT = Date.parse("2026-05-31T15:00:00-04:00");

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

function validAdapterResult(snapshot: MutableSnapshot = cloneFixture()): Extract<
  LevelAnalysisAdapterResult,
  { status: "accepted" }
> {
  const result = validateLevelAnalysisSnapshotV1(snapshot, {
    requireReplaySafe: true,
  });

  expect(result.status).toBe("accepted");
  return result as Extract<LevelAnalysisAdapterResult, { status: "accepted" }>;
}

function createValidAttachment(snapshot: MutableSnapshot = cloneFixture()): LevelAnalysisSnapshotAttachment {
  const result = createLevelAnalysisSnapshotAttachment({
    owner: { ownerId: "trade-123", ownerType: "trade" },
    adapterResult: validAdapterResult(snapshot),
    attachedAt: ATTACHED_AT,
  });

  expect(result.status).toBe("attached");
  return result.attachment as LevelAnalysisSnapshotAttachment;
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

describe("LevelAnalysisSnapshot trade context attachment", () => {
  it("creates a factual attachment from the compact snapshot fixture", () => {
    const attachment = createValidAttachment();

    expect(attachment.attachmentKey).toBe(
      deriveLevelAnalysisSnapshotAttachmentKey(
        attachment.symbol,
        attachment.asOfTimestamp,
        "trade-123",
      ),
    );
    expect(attachment.owner).toEqual({ ownerId: "trade-123", ownerType: "trade" });
    expect(attachment.symbol).toBe(fixture.symbol);
    expect(attachment.asOfTimestamp).toBe(fixture.asOfTimestamp);
    expect(attachment.sourceType).toBe("level-analysis-snapshot-v1");
    expect(attachment.validationStatus).toBe("accepted");
    expect(attachment.rawSnapshot.schemaVersion).toBe("level-analysis-snapshot/v1");
    expect(attachment.connectorView.contract.producer).toBe("levels-system");
    expect(attachment.schemaVersion).toBe("level-analysis-snapshot/v1");
    expect(attachment.producer).toBe("levels-system");
    expect(attachment.attachedAt).toBe(ATTACHED_AT);
    expect(Array.isArray(attachment.limitations)).toBe(true);
    expect(attachment.diagnostics.snapshotDiagnosticsCount).toBe(
      fixture.diagnostics.length,
    );
  });

  it("preserves the raw snapshot and levelEngineOutput without mutation", () => {
    const snapshot = cloneFixture();
    snapshot.additiveTopLevel = { preserved: true };
    snapshot.levelEngineOutput.metadata.additiveNested = "kept";
    const before = JSON.parse(JSON.stringify(snapshot));
    const adapterResult = validAdapterResult(snapshot);

    const result = createLevelAnalysisSnapshotAttachment({
      owner: { ownerId: "session-abc", ownerType: "session" },
      adapterResult,
      attachedAt: ATTACHED_AT,
    });

    expect(result.status).toBe("attached");
    if (result.status !== "attached") {
      throw new Error("Expected attached result.");
    }

    expect(result.attachment.rawSnapshot).toBe(snapshot);
    expect(result.attachment.rawSnapshot).toEqual(before);
    expect(result.attachment.rawSnapshot.levelEngineOutput).toEqual(
      before.levelEngineOutput,
    );
    expect(result.attachment.rawSnapshot.additiveTopLevel).toEqual({
      preserved: true,
    });
  });

  it("attaches a valid snapshot to a mock trade/session context without mutating existing fields", () => {
    const attachment = createValidAttachment();
    const tradeContext = {
      tradeId: "trade-123",
      sessionId: "session-abc",
      symbol: "SNAP",
      executions: [
        { executionId: "exec-1", side: "BUY", price: 10.2, shares: 100 },
        { executionId: "exec-2", side: "SELL", price: 10.7, shares: 100 },
      ],
      notes: "fixture-only context",
    };
    const before = JSON.parse(JSON.stringify(tradeContext));

    const attached = attachLevelAnalysisSnapshotToTradeContext({
      tradeContext,
      attachment,
    });

    expect(tradeContext).toEqual(before);
    expect(attached).not.toBe(tradeContext);
    expect(attached.executions).toEqual(before.executions);
    expect(attached.levelAnalysisSnapshots).toHaveLength(1);
    expect(attached.levelAnalysisSnapshots[0]).toBe(attachment);
    expect(getAttachedLevelAnalysisSnapshotContext(attached)).toBe(attachment);
    expect(
      getAttachedLevelAnalysisSnapshotContext(attached, attachment.attachmentKey),
    ).toBe(attachment);
  });

  it("supports missing optional fields while carrying limitations", () => {
    const snapshot = cloneFixture();
    snapshot.nearestSupport = null;
    snapshot.nearestResistance = null;
    delete snapshot.volumeShelves;
    delete snapshot.marketContext;
    delete snapshot.factsBundle;

    const attachment = createValidAttachment(snapshot);

    expect(attachment.limitations.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        "nearest_support_unavailable",
        "nearest_resistance_unavailable",
        "volume_shelves_unavailable",
        "market_context_unavailable",
        "facts_bundle_unavailable",
      ]),
    );
    expect(attachment.connectorView.limitations).toEqual(attachment.limitations);
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
      snapshot.nearestSupport = { representativePrice: 9.5 };
    }],
    ["unmarked synthetic rows", (snapshot: MutableSnapshot) => {
      snapshot.safety.syntheticExtensionsClearlyMarked = false;
    }],
  ])("quarantines invalid snapshot attachment: %s", (_label, mutate) => {
    const snapshot = cloneFixture();
    mutate(snapshot);

    const result = createLevelAnalysisSnapshotAttachment({
      owner: { ownerId: "trade-123", ownerType: "trade" },
      rawJson: JSON.stringify(snapshot),
      attachedAt: ATTACHED_AT,
    });

    expect(result.status).toBe("quarantined");
    if (result.status !== "quarantined") {
      throw new Error("Expected quarantined result.");
    }
    expect(result.attachment.validationStatus).toBe("quarantined");
    expect(result.attachment.diagnostics.validationErrors.length).toBeGreaterThan(0);
    expect(
      validateLevelAnalysisSnapshotAttachment(result.attachment).valid,
    ).toBe(true);
  });

  it("keeps synthetic continuation-map rows factual and marked in the attachment", () => {
    const attachment = createValidAttachment();
    const syntheticRows = attachment.connectorView.syntheticExtensions.levels;

    expect(syntheticRows.length).toBeGreaterThan(0);
    for (const row of syntheticRows) {
      expect(row.extensionMetadata?.extensionSource).toBe(
        "synthetic_continuation_map",
      );
      expect(row.extensionMetadata?.evidenceLimitations).toContain(
        "not_historical_support_resistance",
      );
      expect(row.touchCount).toBe(0);
      expect(row.confluenceCount).toBe(0);
      expect(row.isExtension).toBe(true);
    }
  });

  it("carries LevelQualityAudit as quality context only", () => {
    const attachment = createValidAttachment();

    expect(attachment.connectorView.quality.hasLevelQualityAudit).toBe(true);
    expect(attachment.connectorView.quality.hasExtensionCoverage).toBe(true);
    expect(attachment.connectorView.diagnostics.qualityDiagnosticsCount).toBeGreaterThanOrEqual(0);
    expect(attachment.diagnostics.validationErrors).toEqual([]);
  });

  it("does not derive execution interpretation fields from levels", () => {
    const attachment = createValidAttachment();
    const derivedContext = {
      attachmentKey: attachment.attachmentKey,
      connectorView: attachment.connectorView,
      limitations: attachment.limitations,
      diagnostics: attachment.diagnostics,
      validationStatus: attachment.validationStatus,
    };

    expectNoJournalOwnedFields(attachment);
    expectNoJournalOwnedFields(derivedContext);
    expectNoJournalOwnedLanguage(derivedContext);
  });
});
