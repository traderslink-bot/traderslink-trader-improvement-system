import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import longWinner from "../../../docs/trade-analysis-request-fixtures/long-winner.json";
import openPosition from "../../../docs/trade-analysis-request-fixtures/open-position.json";
import rapidFireExecutionCluster from "../../../docs/trade-analysis-request-fixtures/rapid-fire-execution-cluster.json";
import { runExecutionFeedback } from "../../execution-feedback/run-execution-feedback";
import {
  buildExecutionAnalysisLevelContextInputFromStorageRecord,
  type ExecutionAnalysisLevelContextInput,
} from "../execution-level-context-input";
import {
  attachExecutionLevelContextObservationsToPipelineInput,
  extractExecutionLevelContextObservationsFromPipelineInput,
  hasExecutionLevelContextObservations,
  stripExecutionLevelContextAndObservationsFromPipelineInput,
  stripExecutionLevelContextObservationsFromPipelineInput,
} from "../execution-level-context-observation-pipeline-adapter";
import {
  buildExecutionLevelContextObservations,
  type ExecutionLevelContextObservationSet,
} from "../execution-level-context-observations";
import {
  attachExecutionLevelContextToPipelineInput,
  extractExecutionLevelContextFromPipelineInput,
  stripExecutionLevelContextFromPipelineInput,
} from "../execution-level-context-pipeline-adapter";
import { validateLevelAnalysisSnapshotV1 } from "../level-analysis-snapshot-adapter";
import { createLevelAnalysisSnapshotAttachment } from "../level-analysis-snapshot-attachment";
import { createLevelAnalysisSnapshotStorageRecord } from "../level-analysis-snapshot-storage";
import fixture from "../__fixtures__/journal-connector-level-analysis-snapshot-v1.json";

const OWNER = { ownerId: "trade-123", ownerType: "trade" };
const ATTACHED_AT = Date.parse("2026-05-31T22:00:00-04:00");
const CREATED_AT = Date.parse("2026-05-31T22:05:00-04:00");
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
  const contextResult =
    buildExecutionAnalysisLevelContextInputFromStorageRecord(record);

  expect(contextResult.status).toBe("available");
  if (contextResult.status !== "available") {
    throw new Error("Expected available execution level context.");
  }

  return contextResult.input;
}

function buildFactualObservations(
  context: ExecutionAnalysisLevelContextInput,
): ExecutionLevelContextObservationSet {
  const result = buildExecutionLevelContextObservations(context);

  expect(result.status).toBe("observed");
  return result.observationSet;
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
    "levelAnalysisObservations",
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
    /levelAnalysisObservations/,
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

function expectNoProhibitedObservationLanguage(value: unknown): void {
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
    expect(pattern.test(text), `Unexpected observation ${label} language`).toBe(false);
  }
}

function expectObservationParityForFixture(label: string, request: unknown): void {
  const originalInput = cloneFixtureRequest(request) as MutableRecord;
  const originalBefore = cloneFixtureRequest(originalInput);
  const levelContext = buildFactualLevelContext();
  const contextBefore = cloneFixtureRequest(levelContext);
  const observations = buildFactualObservations(levelContext);
  const observationsBefore = cloneFixtureRequest(observations);
  const baseline = runDeterministicExecutionFeedback(originalInput);

  const contextAttached = attachExecutionLevelContextToPipelineInput({
    pipelineInput: originalInput,
    levelContext,
  });
  expect(contextAttached.status, label).toBe("attached");
  if (contextAttached.status !== "attached") {
    throw new Error("Expected attached context pipeline input.");
  }

  const contextStripped = stripExecutionLevelContextFromPipelineInput(
    contextAttached.pipelineInput,
  );
  expect(runDeterministicExecutionFeedback(contextStripped), `${label}: context stripped output changed`).toEqual(baseline);
  expect(runDeterministicExecutionFeedback(contextAttached.pipelineInput), `${label}: direct context output changed`).toEqual(baseline);

  const observationsAttached =
    attachExecutionLevelContextObservationsToPipelineInput({
      pipelineInput: originalInput,
      observations,
    });
  expect(observationsAttached.status, label).toBe("attached");
  if (observationsAttached.status !== "attached") {
    throw new Error("Expected attached observation pipeline input.");
  }

  const observationsStripped =
    stripExecutionLevelContextObservationsFromPipelineInput(
      observationsAttached.pipelineInput,
    );
  expect(runDeterministicExecutionFeedback(observationsStripped), `${label}: observations stripped output changed`).toEqual(baseline);
  expect(runDeterministicExecutionFeedback(observationsAttached.pipelineInput), `${label}: direct observations output changed`).toEqual(baseline);

  const bothAttached = attachExecutionLevelContextObservationsToPipelineInput({
    pipelineInput: contextAttached.pipelineInput,
    observations,
  });
  expect(bothAttached.status, label).toBe("attached");
  if (bothAttached.status !== "attached") {
    throw new Error("Expected attached context plus observation pipeline input.");
  }

  const bothStripped =
    stripExecutionLevelContextAndObservationsFromPipelineInput(
      bothAttached.pipelineInput,
    );
  expect(runDeterministicExecutionFeedback(bothStripped), `${label}: context plus observations stripped output changed`).toEqual(baseline);
  expect(runDeterministicExecutionFeedback(bothAttached.pipelineInput), `${label}: direct context plus observations output changed`).toEqual(baseline);

  expect(originalInput, `${label}: original input mutated`).toEqual(originalBefore);
  expect(levelContext, `${label}: level context mutated`).toEqual(contextBefore);
  expect(observations, `${label}: observations mutated`).toEqual(observationsBefore);
  expect(contextStripped, `${label}: context stripped input mismatch`).toEqual(originalBefore);
  expect(observationsStripped, `${label}: observations stripped input mismatch`).toEqual(originalBefore);
  expect(bothStripped, `${label}: strip-both input mismatch`).toEqual(originalBefore);
  expect(extractExecutionLevelContextFromPipelineInput(contextAttached.pipelineInput)).toBe(
    levelContext,
  );
  expect(
    extractExecutionLevelContextObservationsFromPipelineInput(
      observationsAttached.pipelineInput,
    ),
  ).toBe(observations);
  expect(hasExecutionLevelContextObservations(observationsAttached.pipelineInput)).toBe(true);

  for (const output of [
    baseline,
    runDeterministicExecutionFeedback(contextAttached.pipelineInput),
    runDeterministicExecutionFeedback(observationsAttached.pipelineInput),
    runDeterministicExecutionFeedback(bothAttached.pipelineInput),
  ]) {
    expectNoLevelContextLeak(output);
    expectNoNewInterpretationFields(output);
  }

  expectNoProhibitedObservationLanguage(observations);
}

describe("execution level context observation pipeline parity", () => {
  it.each([
    ["long winner", longWinner],
    ["rapid-fire execution cluster", rapidFireExecutionCluster],
    ["open position", openPosition],
  ])("keeps runExecutionFeedback output unchanged with factual context and observations: %s", (label, request) => {
    expectObservationParityForFixture(label, request);
  });

  it("keeps no-observation adapter output equivalent to the original execution input", () => {
    const input = cloneFixtureRequest(longWinner) as MutableRecord;
    const before = cloneFixtureRequest(input);

    const result = attachExecutionLevelContextObservationsToPipelineInput({
      pipelineInput: input,
      observations: null,
    });

    expect(result.status).toBe("unchanged");
    expect(result.pipelineInput).toEqual(before);
    expect(result.pipelineInput).not.toBe(input);
    expect(runDeterministicExecutionFeedback(result.pipelineInput)).toEqual(
      runDeterministicExecutionFeedback(before),
    );
  });

  it("does not import execution scoring or feedback implementation modules", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/level-analysis/execution-level-context-observation-pipeline-adapter.ts",
      ),
      "utf8",
    );

    expect(source).not.toMatch(/from\s+["'][^"']*(trade-analysis|execution-feedback|pattern-scoring|coaching)/);
    expect(source).not.toMatch(/require\(["'][^"']*(trade-analysis|execution-feedback|pattern-scoring|coaching)/);
  });
});
