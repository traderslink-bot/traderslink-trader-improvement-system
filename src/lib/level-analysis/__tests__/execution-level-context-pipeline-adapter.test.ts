import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import fixture from "../__fixtures__/journal-connector-level-analysis-snapshot-v1.json";
import { validateLevelAnalysisSnapshotV1 } from "../level-analysis-snapshot-adapter";
import { createLevelAnalysisSnapshotAttachment } from "../level-analysis-snapshot-attachment";
import type { LevelAnalysisAdapterResult } from "../level-analysis-snapshot-contract";
import { createLevelAnalysisSnapshotStorageRecord } from "../level-analysis-snapshot-storage";
import {
  buildExecutionAnalysisLevelContextInputFromStorageRecord,
  type ExecutionAnalysisLevelContextInput,
} from "../execution-level-context-input";
import {
  assertExecutionLevelContextIsFactualOnly,
  attachExecutionLevelContextToPipelineInput,
  extractExecutionLevelContextFromPipelineInput,
  hasExecutionLevelContext,
  stripExecutionLevelContextFromPipelineInput,
} from "../execution-level-context-pipeline-adapter";

const OWNER = { ownerId: "trade-123", ownerType: "trade" };
const ATTACHED_AT = Date.parse("2026-05-31T18:00:00-04:00");
const CREATED_AT = Date.parse("2026-05-31T18:05:00-04:00");

type MutableSnapshot = Record<string, unknown>;

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

function buildFactualContext(): ExecutionAnalysisLevelContextInput {
  const attachmentResult = createLevelAnalysisSnapshotAttachment({
    owner: OWNER,
    adapterResult: acceptedAdapterResult(),
    attachedAt: ATTACHED_AT,
  });

  expect(attachmentResult.status).toBe("attached");
  if (attachmentResult.status !== "attached") {
    throw new Error("Expected attached snapshot.");
  }

  const record = createLevelAnalysisSnapshotStorageRecord({
    attachment: attachmentResult.attachment,
    createdAt: CREATED_AT,
  });
  const contextResult = buildExecutionAnalysisLevelContextInputFromStorageRecord(record);

  expect(contextResult.status).toBe("available");
  if (contextResult.status !== "available") {
    throw new Error("Expected available execution level context input.");
  }

  return contextResult.input;
}

function mockPipelineInput(): Record<string, unknown> {
  return {
    requestId: "request-123",
    symbol: "SNAP",
    tradeDirection: "long",
    executions: [
      {
        executionId: "exec-1",
        timestamp: "2026-05-31T13:35:00.000Z",
        action: "entry",
        shares: 100,
        price: 10.25,
      },
    ],
    sessionContext: {
      sessionDate: "2026-05-31",
      sessionBucket: "market_open",
    },
  };
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

describe("execution level context pipeline adapter", () => {
  it("attaches factual level context without mutating the execution-analysis input", () => {
    const pipelineInput = mockPipelineInput();
    const before = JSON.parse(JSON.stringify(pipelineInput));
    const levelContext = buildFactualContext();

    const result = attachExecutionLevelContextToPipelineInput({
      pipelineInput,
      levelContext,
    });

    expect(result.status).toBe("attached");
    if (result.status !== "attached") {
      throw new Error("Expected attached pipeline input.");
    }

    expect(pipelineInput).toEqual(before);
    expect(result.pipelineInput).not.toBe(pipelineInput);
    expect(result.pipelineInput.levelAnalysisContext.context).toBe(levelContext);
    expect(result.attachment.context).toBe(levelContext);
    expect(result.pipelineInput.symbol).toBe(before.symbol);
    expect(result.pipelineInput.executions).toEqual(before.executions);
  });

  it("keeps level context optional and supports has extract and strip helpers", () => {
    const pipelineInput = mockPipelineInput();

    const unchanged = attachExecutionLevelContextToPipelineInput({
      pipelineInput,
      levelContext: null,
    });

    expect(unchanged.status).toBe("unchanged");
    expect(unchanged.pipelineInput).toEqual(pipelineInput);
    expect(unchanged.pipelineInput).not.toBe(pipelineInput);
    expect(hasExecutionLevelContext(unchanged.pipelineInput)).toBe(false);
    expect(extractExecutionLevelContextFromPipelineInput(unchanged.pipelineInput)).toBeNull();

    const attached = attachExecutionLevelContextToPipelineInput({
      pipelineInput,
      levelContext: buildFactualContext(),
    });
    expect(attached.status).toBe("attached");
    if (attached.status !== "attached") {
      throw new Error("Expected attached pipeline input.");
    }
    expect(hasExecutionLevelContext(attached.pipelineInput)).toBe(true);
    expect(extractExecutionLevelContextFromPipelineInput(attached.pipelineInput)).toBe(
      attached.attachment.context,
    );
    expect(stripExecutionLevelContextFromPipelineInput(attached.pipelineInput)).toEqual(
      pipelineInput,
    );
  });

  it("preserves pipeline parity when context is attached and stripped", () => {
    const pipelineInput = mockPipelineInput();
    const before = JSON.parse(JSON.stringify(pipelineInput));
    const attached = attachExecutionLevelContextToPipelineInput({
      pipelineInput,
      levelContext: buildFactualContext(),
    });

    expect(attached.status).toBe("attached");
    if (attached.status !== "attached") {
      throw new Error("Expected attached pipeline input.");
    }

    const stripped = stripExecutionLevelContextFromPipelineInput(attached.pipelineInput);

    expect(stripped).toEqual(before);
    expect(stripped).not.toHaveProperty("levelAnalysisContext");
    expect(Object.keys(stripped).sort()).toEqual(Object.keys(before).sort());
  });

  it("keeps attached pipeline input and context free of journal-owned interpretation fields", () => {
    const attached = attachExecutionLevelContextToPipelineInput({
      pipelineInput: mockPipelineInput(),
      levelContext: buildFactualContext(),
    });

    expect(attached.status).toBe("attached");
    if (attached.status !== "attached") {
      throw new Error("Expected attached pipeline input.");
    }

    expectNoForbiddenFields(attached.pipelineInput);
    expectNoForbiddenLanguage(attached.pipelineInput);
    expectNoForbiddenFields(attached.attachment.context);
    expectNoForbiddenLanguage(attached.attachment.context);
  });

  it("does not import execution scoring or execution-analysis implementation modules", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/level-analysis/execution-level-context-pipeline-adapter.ts",
      ),
      "utf8",
    );

    expect(source).not.toMatch(/from\s+["'][^"']*(trade-analysis|execution-feedback|pattern-scoring|coaching)/);
    expect(source).not.toMatch(/require\(["'][^"']*(trade-analysis|execution-feedback|pattern-scoring|coaching)/);
  });

  it("preserves factual context safety diagnostics limitations synthetic and quality summaries", () => {
    const levelContext = buildFactualContext();
    const attached = attachExecutionLevelContextToPipelineInput({
      pipelineInput: mockPipelineInput(),
      levelContext,
    });

    expect(attached.status).toBe("attached");
    if (attached.status !== "attached") {
      throw new Error("Expected attached pipeline input.");
    }

    const extracted = extractExecutionLevelContextFromPipelineInput(attached.pipelineInput);

    expect(extracted).toBe(levelContext);
    expect(extracted?.safety.noLookaheadApplied).toBe(true);
    expect(extracted?.diagnostics.snapshotDiagnostics).toContain(
      "candle_close_as_of_filter_applied",
    );
    expect(extracted?.limitations.count).toBe(levelContext.limitations.count);
    expect(extracted?.syntheticContinuationMap.count).toBeGreaterThan(0);
    expect(extracted?.quality.hasLevelQualityAudit).toBe(true);
  });

  it("asserts factual-only context before attaching", () => {
    const levelContext = buildFactualContext();
    const badContext = {
      ...levelContext,
      grade: "A",
    } as ExecutionAnalysisLevelContextInput & { grade: string };

    expect(() => assertExecutionLevelContextIsFactualOnly(levelContext)).not.toThrow();
    expect(() => assertExecutionLevelContextIsFactualOnly(badContext)).toThrow(
      /factual-only/,
    );
    expect(() =>
      attachExecutionLevelContextToPipelineInput({
        pipelineInput: mockPipelineInput(),
        levelContext: badContext,
      }),
    ).toThrow(/factual-only/);
  });
});
