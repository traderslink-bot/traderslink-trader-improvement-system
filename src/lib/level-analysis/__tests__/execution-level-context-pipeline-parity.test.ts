import { describe, expect, it } from "vitest";
import longWinner from "../../../docs/trade-analysis-request-fixtures/long-winner.json";
import openPosition from "../../../docs/trade-analysis-request-fixtures/open-position.json";
import rapidFireExecutionCluster from "../../../docs/trade-analysis-request-fixtures/rapid-fire-execution-cluster.json";
import { runExecutionFeedback } from "../../execution-feedback/run-execution-feedback";
import { validateLevelAnalysisSnapshotV1 } from "../level-analysis-snapshot-adapter";
import { createLevelAnalysisSnapshotAttachment } from "../level-analysis-snapshot-attachment";
import { createLevelAnalysisSnapshotStorageRecord } from "../level-analysis-snapshot-storage";
import fixture from "../__fixtures__/journal-connector-level-analysis-snapshot-v1.json";
import {
  buildExecutionAnalysisLevelContextInputFromStorageRecord,
  type ExecutionAnalysisLevelContextInput,
} from "../execution-level-context-input";
import {
  attachExecutionLevelContextToPipelineInput,
  extractExecutionLevelContextFromPipelineInput,
  stripExecutionLevelContextFromPipelineInput,
} from "../execution-level-context-pipeline-adapter";

const OWNER = { ownerId: "trade-123", ownerType: "trade" };
const ATTACHED_AT = Date.parse("2026-05-31T19:00:00-04:00");
const CREATED_AT = Date.parse("2026-05-31T19:05:00-04:00");
const GENERATED_AT = "2026-05-02T18:00:00.000Z";

type MutableRecord = Record<string, unknown>;

function cloneFixtureRequest<T>(request: T): T {
  return JSON.parse(JSON.stringify(request)) as T;
}

function buildFactualLevelContext(): ExecutionAnalysisLevelContextInput {
  const adapterResult = validateLevelAnalysisSnapshotV1(
    cloneFixtureRequest(fixture),
    { requireReplaySafe: true },
  );
  expect(adapterResult.status).toBe("accepted");
  if (adapterResult.status !== "accepted") {
    throw new Error("Expected accepted LevelAnalysisSnapshot fixture.");
  }

  const attachmentResult = createLevelAnalysisSnapshotAttachment({
    owner: OWNER,
    adapterResult,
    attachedAt: ATTACHED_AT,
  });
  expect(attachmentResult.status).toBe("attached");
  if (attachmentResult.status !== "attached") {
    throw new Error("Expected attached LevelAnalysisSnapshot fixture.");
  }

  const record = createLevelAnalysisSnapshotStorageRecord({
    attachment: attachmentResult.attachment,
    createdAt: CREATED_AT,
  });
  const contextResult = buildExecutionAnalysisLevelContextInputFromStorageRecord(record);

  expect(contextResult.status).toBe("available");
  if (contextResult.status !== "available") {
    throw new Error("Expected available execution level context.");
  }

  return contextResult.input;
}

function runDeterministicExecutionFeedback(input: unknown) {
  return runExecutionFeedback(input, { generatedAt: GENERATED_AT });
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

function expectNoLevelContextLeak(value: unknown): void {
  const keys = collectObjectKeys(value);
  const text = collectStringValues(value).join("\n");
  const forbiddenKeys = new Set([
    "levelAnalysisContext",
    "levelSnapshotAttachmentId",
    "levelSnapshotStorageKey",
    "attachmentKey",
    "storageKey",
    "syntheticContinuationMap",
  ]);

  for (const key of keys) {
    expect(forbiddenKeys.has(key), `Unexpected level-context output field ${key}`).toBe(false);
  }

  for (const pattern of [
    /levelAnalysisContext/,
    /levelSnapshot/i,
    /synthetic_continuation_map/,
    /not_historical_support_resistance/,
  ]) {
    expect(pattern.test(text), `Unexpected level-context output text ${pattern}`).toBe(false);
  }
}

function expectNoNewInterpretationFields(value: unknown): void {
  const keys = collectObjectKeys(value);
  const forbiddenKeys = new Set([
    "grade",
    "tradeGrade",
    "coaching",
    "coach",
    "behaviorScore",
    "behaviorScoring",
    "recommendation",
    "entryDecision",
    "exitDecision",
    "tradeAdvice",
  ]);

  for (const key of keys) {
    expect(forbiddenKeys.has(key), `Unexpected interpretation field ${key}`).toBe(false);
  }
}

function expectParityForFixture(label: string, request: unknown): void {
  const originalInput = cloneFixtureRequest(request) as MutableRecord;
  const originalBefore = cloneFixtureRequest(originalInput);
  const levelContext = buildFactualLevelContext();
  const contextBefore = cloneFixtureRequest(levelContext);

  const baseline = runDeterministicExecutionFeedback(originalInput);
  const attached = attachExecutionLevelContextToPipelineInput({
    pipelineInput: originalInput,
    levelContext,
  });

  expect(attached.status, label).toBe("attached");
  if (attached.status !== "attached") {
    throw new Error("Expected attached pipeline input.");
  }

  const strippedInput = stripExecutionLevelContextFromPipelineInput(
    attached.pipelineInput,
  );
  const strippedOutput = runDeterministicExecutionFeedback(strippedInput);
  const directAttachedOutput = runDeterministicExecutionFeedback(
    attached.pipelineInput,
  );

  expect(originalInput, `${label}: original input mutated`).toEqual(originalBefore);
  expect(levelContext, `${label}: level context mutated`).toEqual(contextBefore);
  expect(strippedInput, `${label}: stripped input mismatch`).toEqual(originalBefore);
  expect(extractExecutionLevelContextFromPipelineInput(attached.pipelineInput)).toBe(
    levelContext,
  );
  expect(strippedOutput, `${label}: stripped output changed`).toEqual(baseline);
  expect(directAttachedOutput, `${label}: direct attached output changed`).toEqual(
    baseline,
  );
  expectNoLevelContextLeak(baseline);
  expectNoLevelContextLeak(strippedOutput);
  expectNoLevelContextLeak(directAttachedOutput);
  expectNoNewInterpretationFields(directAttachedOutput);
}

describe("execution level context pipeline parity", () => {
  it.each([
    ["long winner", longWinner],
    ["rapid-fire execution cluster", rapidFireExecutionCluster],
    ["open position", openPosition],
  ])("keeps runExecutionFeedback output unchanged with factual level context: %s", (label, request) => {
    expectParityForFixture(label, request);
  });

  it("keeps no-context adapter output equivalent to the original execution input", () => {
    const input = cloneFixtureRequest(longWinner) as MutableRecord;
    const before = cloneFixtureRequest(input);

    const result = attachExecutionLevelContextToPipelineInput({
      pipelineInput: input,
      levelContext: null,
    });

    expect(result.status).toBe("unchanged");
    expect(result.pipelineInput).toEqual(before);
    expect(result.pipelineInput).not.toBe(input);
    expect(runDeterministicExecutionFeedback(result.pipelineInput)).toEqual(
      runDeterministicExecutionFeedback(before),
    );
  });
});
