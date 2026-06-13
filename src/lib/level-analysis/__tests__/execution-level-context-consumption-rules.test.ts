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
  assessExecutionLevelContextConsumptionReadiness,
  assertExecutionLevelContextConsumptionIsFactualOnly,
  describeExecutionLevelContextConsumptionBoundary,
  isExecutionLevelContextConsumable,
  listAllowedExecutionLevelContextFacts,
  listForbiddenExecutionLevelContextInferences,
} from "../execution-level-context-consumption-rules";
import { validateLevelAnalysisSnapshotV1 } from "../level-analysis-snapshot-adapter";
import {
  createLevelAnalysisSnapshotAttachment,
  type LevelAnalysisSnapshotAttachment,
  type QuarantinedLevelAnalysisSnapshotAttachment,
} from "../level-analysis-snapshot-attachment";
import type { LevelAnalysisAdapterResult } from "../level-analysis-snapshot-contract";
import {
  createLevelAnalysisSnapshotStorageRecord,
  type LevelAnalysisSnapshotStorageRecord,
} from "../level-analysis-snapshot-storage";

const OWNER = { ownerId: "trade-123", ownerType: "trade" };
const ATTACHED_AT = Date.parse("2026-05-31T20:00:00-04:00");
const CREATED_AT = Date.parse("2026-05-31T20:05:00-04:00");

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
    requireReplaySafe: true,
    attachedAt: ATTACHED_AT,
  });

  expect(result.status).toBe("quarantined");
  return result.attachment as QuarantinedLevelAnalysisSnapshotAttachment;
}

function buildFactualContext(
  snapshot: MutableSnapshot = cloneFixture(),
): ExecutionAnalysisLevelContextInput {
  const record = createAcceptedRecord(snapshot);
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
    ["good/bad trade", /\bgood trade\b|\bbad trade\b/],
    ["should-have action", /\bshould have bought\b|\bshould have sold\b/],
  ] as const) {
    expect(pattern.test(text), `Unexpected ${label} language`).toBe(false);
  }
}

describe("execution level context consumption rules", () => {
  it("lists allowed factual fields without scoring or decision categories", () => {
    const allowedFacts = listAllowedExecutionLevelContextFacts();

    expect(allowedFacts.map((fact) => fact.id)).toEqual(
      expect.arrayContaining([
        "symbol",
        "as_of_timestamp",
        "reference_price",
        "nearest_support",
        "nearest_resistance",
        "nearest_level_distance",
        "level_bucket_counts",
        "extension_counts",
        "synthetic_continuation_map",
        "diagnostics",
        "limitations",
        "safety_flags",
        "quality_audit_warnings",
        "fact_presence_summary",
      ]),
    );
    expectNoForbiddenFields(allowedFacts);
    expectNoForbiddenLanguage(allowedFacts);
  });

  it("lists forbidden direct inferences for future consumers", () => {
    const forbidden = listForbiddenExecutionLevelContextInferences();
    const ids = forbidden.map((inference) => inference.id);
    const text = JSON.stringify(forbidden).toLowerCase();

    expect(ids).toEqual(
      expect.arrayContaining([
        "trade_grade",
        "mistake_label",
        "discipline_label",
        "coaching_message",
        "profit_loss",
        "giveback_analysis",
        "behavior_score",
        "recommendation",
        "buy_sell_hold",
        "entry_decision",
        "exit_decision",
        "trade_advice",
        "good_bad_trade",
        "should_have_bought_sold",
      ]),
    );
    expect(text).toContain("grade");
    expect(text).toContain("coaching");
    expect(text).toContain("p/l");
    expect(text).toContain("giveback");
    expect(text).toContain("behavior score");
    expect(text).toContain("recommendation");
    expect(text).toContain("buy");
    expect(text).toContain("sell");
    expect(text).toContain("hold");
    expect(text).toContain("entry decision");
    expect(text).toContain("exit decision");
    expect(text).toContain("trade advice");
  });

  it("assesses accepted replay-safe context as consumable while flowing diagnostics and limitations through", () => {
    const snapshot = cloneFixture();
    snapshot.nearestSupport = null;
    const context = buildFactualContext(snapshot);
    const assessment = assessExecutionLevelContextConsumptionReadiness(context);

    expect(assessment.consumable).toBe(true);
    expect(assessment.readiness).toBe("consumable");
    expect(assessment.violations).toEqual([]);
    expect(assessment.safety).toEqual({
      noLookaheadApplied: true,
      syntheticExtensionsClearlyMarked: true,
      factualContextOnly: true,
    });
    expect(assessment.diagnostics.snapshotDiagnostics).toContain(
      "candle_close_as_of_filter_applied",
    );
    expect(assessment.limitations.messages).toContain(
      "Nearest support is unavailable in this as-of snapshot.",
    );
    expect(assessment.syntheticContinuationMap.count).toBe(1);
    expect(assessment.syntheticContinuationMap.clearlyMarked).toBe(true);
    expect(isExecutionLevelContextConsumable(context)).toBe(true);
  });

  it("rejects unavailable, unsafe, and inconsistently marked contexts", () => {
    const invalid = cloneFixture();
    delete invalid.schemaVersion;
    const quarantinedResult = buildExecutionAnalysisLevelContextInputFromAttachment(
      createQuarantinedAttachment(invalid),
    );

    const quarantinedAssessment =
      assessExecutionLevelContextConsumptionReadiness(quarantinedResult);
    expect(quarantinedAssessment.consumable).toBe(false);
    expect(quarantinedAssessment.readiness).toBe("unavailable_context");
    expect(quarantinedAssessment.violations[0]).toMatchObject({
      ruleId: "available_context_required",
      code: "unavailable_context",
    });
    expect(isExecutionLevelContextConsumable(quarantinedResult)).toBe(false);

    const unsafe = cloneValue(buildFactualContext());
    unsafe.safety.noLookaheadApplied = false;
    const unsafeAssessment = assessExecutionLevelContextConsumptionReadiness(unsafe);
    expect(unsafeAssessment.consumable).toBe(false);
    expect(unsafeAssessment.readiness).toBe("unsafe_context");
    expect(unsafeAssessment.violations.map((violation) => violation.code)).toContain(
      "unsafe_no_lookahead",
    );

    const unmarkedSynthetic = cloneValue(buildFactualContext());
    unmarkedSynthetic.safety.syntheticExtensionsClearlyMarked = false;
    const syntheticAssessment =
      assessExecutionLevelContextConsumptionReadiness(unmarkedSynthetic);
    expect(syntheticAssessment.consumable).toBe(false);
    expect(syntheticAssessment.readiness).toBe("synthetic_marking_inconsistent");
    expect(syntheticAssessment.violations.map((violation) => violation.code)).toEqual(
      expect.arrayContaining([
        "unsafe_no_lookahead",
        "synthetic_marking_inconsistent",
      ]),
    );
  });

  it("keeps assessment and boundary outputs factual-only", () => {
    const context = buildFactualContext();
    const assessment = assessExecutionLevelContextConsumptionReadiness(context);
    const boundary = describeExecutionLevelContextConsumptionBoundary();

    expect(boundary).toMatchObject({
      forbiddenInferenceCount: 14,
      scoringImplementationIncluded: false,
    });
    expect(boundary.allowedFactIds).toContain("nearest_support");
    expectNoForbiddenFields(assessment);
    expectNoForbiddenLanguage(assessment);
    expectNoForbiddenFields(boundary);
    expectNoForbiddenLanguage(boundary);
  });

  it("guards arbitrary payloads from journal-owned interpretation fields and language", () => {
    const context = buildFactualContext();
    expect(() =>
      assertExecutionLevelContextConsumptionIsFactualOnly(context),
    ).not.toThrow();

    expect(() =>
      assertExecutionLevelContextConsumptionIsFactualOnly({
        ...context,
        tradeAdvice: "not allowed",
      }),
    ).toThrow(/factual-only/);

    expect(() =>
      assertExecutionLevelContextConsumptionIsFactualOnly({
        ...context,
        narrative: "This would be a buy recommendation.",
      }),
    ).toThrow(/factual-only/);
  });

  it("does not import execution scoring or analysis implementation modules", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/level-analysis/execution-level-context-consumption-rules.ts",
      ),
      "utf8",
    );

    expect(source).not.toMatch(/from\s+["'][^"']*(trade-analysis|execution-feedback|pattern-scoring|coaching)/);
    expect(source).not.toMatch(/require\(["'][^"']*(trade-analysis|execution-feedback|pattern-scoring|coaching)/);
  });

  it("assesses context built from existing storage without mutating source records", () => {
    const record = createAcceptedRecord();
    const before = cloneValue(record);
    const result = buildExecutionAnalysisLevelContextInputFromStorageRecord(record);

    expect(result.status).toBe("available");
    const assessment = assessExecutionLevelContextConsumptionReadiness(result);

    expect(assessment.consumable).toBe(true);
    expect(record).toEqual(before);
  });
});
