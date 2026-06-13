import { readFileSync } from "node:fs";
import path from "node:path";
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
  createExecutionLevelContextReadModelStorageRecord,
  createQuarantinedExecutionLevelContextReadModelStorageRecord,
  type ExecutionLevelContextReadModelStorageRecord,
} from "../execution-level-context-read-model-storage";
import {
  assertExecutionLevelContextUiContractIsFactualOnly,
  buildExecutionLevelContextUiContract,
  buildExecutionLevelContextUiContractFromStorageRecord,
  buildUnavailableExecutionLevelContextUiContract,
  summarizeExecutionLevelContextUiContract,
  type ExecutionLevelContextUiContract,
  type ExecutionLevelContextUiRow,
  type ExecutionLevelContextUiSection,
  type ExecutionLevelContextUiSectionId,
} from "../execution-level-context-ui-contract";
import { validateLevelAnalysisSnapshotV1 } from "../level-analysis-snapshot-adapter";
import {
  createLevelAnalysisSnapshotAttachment,
  type LevelAnalysisSnapshotAttachment,
} from "../level-analysis-snapshot-attachment";
import type { LevelAnalysisAdapterResult } from "../level-analysis-snapshot-contract";
import { createLevelAnalysisSnapshotStorageRecord } from "../level-analysis-snapshot-storage";

const OWNER = { ownerId: "trade-123", ownerType: "trade" };
const ATTACHED_AT = Date.parse("2026-05-31T23:45:00-04:00");
const CREATED_AT = Date.parse("2026-05-31T23:50:00-04:00");

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

function section(
  contract: ExecutionLevelContextUiContract,
  id: ExecutionLevelContextUiSectionId,
): ExecutionLevelContextUiSection {
  const found = contract.sections.find((item) => item.id === id);
  expect(found, `Missing section ${id}`).toBeTruthy();
  if (!found) {
    throw new Error(`Missing section ${id}`);
  }

  return found;
}

function row(
  sectionItem: ExecutionLevelContextUiSection,
  id: string,
): ExecutionLevelContextUiRow {
  const found = sectionItem.rows.find((item) => item.id === id);
  expect(found, `Missing row ${id}`).toBeTruthy();
  if (!found) {
    throw new Error(`Missing row ${id}`);
  }

  return found;
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

describe("execution level context UI contract", () => {
  it("builds an available factual UI contract with the expected display sections", () => {
    const record = createReadModelRecord();
    const result = buildExecutionLevelContextUiContractFromStorageRecord(record);

    expect(result.status).toBe("built");
    expect(result.contract.contractVersion).toBe(
      "execution_level_context_ui_contract_v1",
    );
    expect(result.contract.status).toBe("available");
    expect(result.contract.identity).toEqual({
      symbol: fixture.symbol,
      asOfTimestamp: fixture.asOfTimestamp,
      referencePrice: fixture.referencePrice,
    });
    expect(result.contract.source).toMatchObject({
      readModelStorageKey: record.storageKey,
      ownerId: OWNER.ownerId,
      schemaVersion: "level-analysis-snapshot/v1",
      producer: "levels-system",
    });
    expect(result.contract.sections.map((item) => item.id)).toEqual([
      "overview",
      "nearestLevels",
      "extensions",
      "syntheticContinuationMap",
      "quality",
      "diagnostics",
      "limitations",
      "safety",
      "dataCompleteness",
      "source",
    ]);
    expect(row(section(result.contract, "nearestLevels"), "support.representativePrice").value.value).toBe(
      fixture.nearestSupport.representativePrice,
    );
    expect(row(section(result.contract, "nearestLevels"), "resistance.representativePrice").value.value).toBe(
      fixture.nearestResistance.representativePrice,
    );
    expect(row(section(result.contract, "extensions"), "totalExtensions").value.value).toBe(
      record.readModel.levelMap.extensionCounts?.total,
    );
    expectNoForbiddenFields(result.contract);
    expectNoForbiddenLanguage(result.contract);
  });

  it("represents limited unavailable and not-replay-safe states factually", () => {
    const limitedSnapshot = cloneFixture();
    limitedSnapshot.nearestSupport = null;
    delete limitedSnapshot.marketContext;
    delete limitedSnapshot.factsBundle;
    limitedSnapshot.volumeShelves = [];
    const limited = buildExecutionLevelContextUiContract(buildReadModel(limitedSnapshot));

    expect(limited.contract.status).toBe("limited");
    expect(section(limited.contract, "limitations").status).toBe("limited");
    expect(row(section(limited.contract, "limitations"), "limitations.count").value.value).toBeGreaterThan(0);
    expect(row(section(limited.contract, "dataCompleteness"), "volumeShelves").value.value).toBe(0);

    const unavailable = buildUnavailableExecutionLevelContextUiContract("missing_context");
    expect(unavailable.contract.status).toBe("unavailable");
    expect(unavailable.contract.identity.symbol).toBeNull();
    expect(row(section(unavailable.contract, "overview"), "reason").value.value).toBe(
      "missing_context",
    );

    const unsafeContext = cloneValue(buildFactualContext());
    unsafeContext.safety.noLookaheadApplied = false;
    const unsafeReadModel =
      buildExecutionLevelContextObservationReadModel(unsafeContext).readModel;
    const unsafe = buildExecutionLevelContextUiContract(unsafeReadModel);
    expect(unsafe.contract.status).toBe("not_replay_safe");
    expect(section(unsafe.contract, "safety").status).toBe("not_replay_safe");
    expect(row(section(unsafe.contract, "safety"), "safety.noLookaheadApplied").value.value).toBe(false);

    const quarantinedStorage = createQuarantinedExecutionLevelContextReadModelStorageRecord({
      owner: OWNER,
      rawPayload: { invalid: true },
      quarantineReasons: [
        {
          code: "invalid_payload",
          message: "Payload cannot be displayed as factual level context.",
        },
      ],
      createdAt: CREATED_AT,
    });
    const quarantined = buildExecutionLevelContextUiContractFromStorageRecord(
      quarantinedStorage,
    );
    expect(quarantined.contract.status).toBe("unavailable");
    expectNoForbiddenFields([
      limited.contract,
      unavailable.contract,
      unsafe.contract,
      quarantined.contract,
    ]);
    expectNoForbiddenLanguage([
      limited.contract,
      unavailable.contract,
      unsafe.contract,
      quarantined.contract,
    ]);
  });

  it("displays synthetic continuation-map context as forward-planning only", () => {
    const contract = buildExecutionLevelContextUiContract(buildReadModel()).contract;
    const synthetic = section(contract, "syntheticContinuationMap");

    expect(row(synthetic, "synthetic.count").value.value).toBe(1);
    expect(row(synthetic, "synthetic.marked").value.value).toBe(true);
    expect(row(synthetic, "synthetic.historicalEvidence").value.value).toBe(false);
    expect(synthetic.badges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "contextType",
          label: "synthetic_forward_planning",
        }),
        expect.objectContaining({
          id: "historicalEvidence",
          label: "not historical evidence",
        }),
      ]),
    );
    expect(row(synthetic, "synthetic.limitations").value.value).toEqual(
      expect.arrayContaining(["not_historical_support_resistance"]),
    );
  });

  it("surfaces quality diagnostics limitations and missing optional facts as context", () => {
    const degraded = cloneFixture();
    degraded.nearestSupport = null;
    delete degraded.marketContext;
    delete degraded.factsBundle;
    degraded.volumeShelves = [];
    const contract = buildExecutionLevelContextUiContract(buildReadModel(degraded)).contract;

    expect(row(section(contract, "quality"), "quality.warningCount").value.value).toBe(1);
    expect(row(section(contract, "quality"), "quality.warnings").value.value).toEqual(
      expect.arrayContaining(["no_support_extension_coverage"]),
    );
    expect(row(section(contract, "diagnostics"), "diagnostics.count").value.value).toBeGreaterThan(0);
    expect(row(section(contract, "limitations"), "limitations.messages").value.value).toEqual(
      expect.arrayContaining([
        "Nearest support is unavailable in this as-of snapshot.",
      ]),
    );
    expect(row(section(contract, "dataCompleteness"), "marketContext").value.value).toBe(false);
    expect(row(section(contract, "dataCompleteness"), "factsBundle").value.value).toBe(false);
  });

  it("is deterministic and does not mutate the source read model", () => {
    const readModel = buildReadModel();
    const before = cloneValue(readModel);

    const first = buildExecutionLevelContextUiContract(readModel).contract;
    const second = buildExecutionLevelContextUiContract(readModel).contract;

    expect(first).toEqual(second);
    expect(readModel).toEqual(before);
  });

  it("summarizes the UI contract without interpretation fields", () => {
    const contract = buildExecutionLevelContextUiContract(buildReadModel()).contract;
    const summary = summarizeExecutionLevelContextUiContract(contract);

    expect(summary).toMatchObject({
      status: "available",
      symbol: fixture.symbol,
      asOfTimestamp: fixture.asOfTimestamp,
      syntheticContinuationMapCount: 1,
      qualityNoteCount: 1,
      replaySafe: true,
    });
    expect(summary.sectionIds).toContain("overview");
    expect(summary.sectionIds).toContain("source");
    expectNoForbiddenFields(summary);
    expectNoForbiddenLanguage(summary);
  });

  it("guards UI contract sections labels values badges and summary from interpretation language", () => {
    const contract = buildExecutionLevelContextUiContract(buildReadModel()).contract;

    expectNoForbiddenFields(contract);
    expectNoForbiddenLanguage(contract);
    expect(() =>
      assertExecutionLevelContextUiContractIsFactualOnly(contract),
    ).not.toThrow();
    expect(() =>
      assertExecutionLevelContextUiContractIsFactualOnly({
        ...contract,
        sections: [
          ...contract.sections,
          {
            id: "tradeAdvice",
            title: "not allowed",
            detail: "not allowed",
            status: "available",
            rows: [],
            badges: [],
          },
        ],
      }),
    ).toThrow(/prohibited sections/);
    expect(() =>
      assertExecutionLevelContextUiContractIsFactualOnly({
        ...contract,
        rows: [{ label: "not allowed", value: "buy recommendation" }],
      }),
    ).toThrow(/factual-only/);
  });

  it("does not add React UI implementation or execution-analysis imports", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/level-analysis/execution-level-context-ui-contract.ts",
      ),
      "utf8",
    );

    expect(source).not.toMatch(/from\s+["']react["']/);
    expect(source).not.toMatch(/from\s+["'][^"']*(trade-analysis|execution-feedback|pattern-scoring|coaching)/);
    expect(source).not.toMatch(/require\(["'][^"']*(trade-analysis|execution-feedback|pattern-scoring|coaching)/);
  });
});
