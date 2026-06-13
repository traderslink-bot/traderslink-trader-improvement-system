import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import longWinner from "../../../docs/trade-analysis-request-fixtures/long-winner.json";
import openPosition from "../../../docs/trade-analysis-request-fixtures/open-position.json";
import rapidFireExecutionCluster from "../../../docs/trade-analysis-request-fixtures/rapid-fire-execution-cluster.json";
import { runExecutionFeedback } from "../../execution-feedback/run-execution-feedback";
import fixture from "../__fixtures__/journal-connector-level-analysis-snapshot-v1.json";
import {
  buildExecutionAnalysisLevelContextInputFromStorageRecord,
  type ExecutionAnalysisLevelContextInput,
} from "../execution-level-context-input";
import {
  buildExecutionLevelContextAllowedConsumptionViewFromReadModel,
  buildExecutionLevelContextAllowedConsumptionViewFromStorageRecord,
  type ExecutionLevelContextAllowedConsumptionView,
} from "../execution-level-context-consumption-adapter";
import {
  attachExecutionLevelContextConsumptionViewToPipelineInput,
  extractExecutionLevelContextConsumptionViewFromPipelineInput,
  hasExecutionLevelContextConsumptionView,
  stripAllLevelAnalysisCarriersFromPipelineInput,
  stripExecutionLevelContextConsumptionViewFromPipelineInput,
} from "../execution-level-context-consumption-pipeline-adapter";
import {
  buildExecutionLevelContextObservations,
  type ExecutionLevelContextObservationSet,
} from "../execution-level-context-observations";
import {
  buildExecutionLevelContextObservationReadModelFromObservations,
  type ExecutionLevelContextObservationReadModel,
} from "../execution-level-context-observation-read-model";
import {
  attachExecutionLevelContextObservationsToPipelineInput,
  extractExecutionLevelContextObservationsFromPipelineInput,
  stripExecutionLevelContextObservationsFromPipelineInput,
} from "../execution-level-context-observation-pipeline-adapter";
import { createExecutionLevelContextReadModelStorageRecord } from "../execution-level-context-read-model-storage";
import {
  attachExecutionLevelContextToPipelineInput,
  extractExecutionLevelContextFromPipelineInput,
  stripExecutionLevelContextFromPipelineInput,
} from "../execution-level-context-pipeline-adapter";
import { validateLevelAnalysisSnapshotV1 } from "../level-analysis-snapshot-adapter";
import { createLevelAnalysisSnapshotAttachment } from "../level-analysis-snapshot-attachment";
import { createLevelAnalysisSnapshotStorageRecord } from "../level-analysis-snapshot-storage";

const OWNER = { ownerId: "trade-123", ownerType: "trade" };
const ATTACHED_AT = Date.parse("2026-05-31T23:30:00-04:00");
const CREATED_AT = Date.parse("2026-05-31T23:35:00-04:00");
const GENERATED_AT = "2026-05-02T18:00:00.000Z";

type MutableRecord = Record<string, unknown>;

interface FactualArtifacts {
  context: ExecutionAnalysisLevelContextInput;
  observations: ExecutionLevelContextObservationSet;
  readModel: ExecutionLevelContextObservationReadModel;
  consumptionView: ExecutionLevelContextAllowedConsumptionView;
  consumptionViewFromReadModel: ExecutionLevelContextAllowedConsumptionView;
}

function cloneFixtureRequest<T>(request: T): T {
  return JSON.parse(JSON.stringify(request)) as T;
}

function buildFactualArtifacts(): FactualArtifacts {
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

  const snapshotRecord = createLevelAnalysisSnapshotStorageRecord({
    attachment: attachmentResult.attachment,
    createdAt: CREATED_AT,
  });
  const contextResult =
    buildExecutionAnalysisLevelContextInputFromStorageRecord(snapshotRecord);

  expect(contextResult.status).toBe("available");
  if (contextResult.status !== "available") {
    throw new Error("Expected available execution level context.");
  }

  const observationsResult = buildExecutionLevelContextObservations(
    contextResult.input,
  );
  expect(observationsResult.status).toBe("observed");
  if (observationsResult.status !== "observed") {
    throw new Error("Expected observed level context.");
  }

  const readModel =
    buildExecutionLevelContextObservationReadModelFromObservations(
      contextResult.input,
      observationsResult.observationSet,
    ).readModel;
  const readModelRecord = createExecutionLevelContextReadModelStorageRecord({
    owner: OWNER,
    readModel,
    createdAt: CREATED_AT,
  });
  const viewFromStorage =
    buildExecutionLevelContextAllowedConsumptionViewFromStorageRecord(
      readModelRecord,
    );
  expect(viewFromStorage.status).toBe("available");
  if (viewFromStorage.status !== "available") {
    throw new Error("Expected available consumption view from storage.");
  }

  const viewFromReadModel =
    buildExecutionLevelContextAllowedConsumptionViewFromReadModel(readModel);
  expect(viewFromReadModel.status).toBe("available");
  if (viewFromReadModel.status !== "available") {
    throw new Error("Expected available consumption view from read model.");
  }

  return {
    context: contextResult.input,
    observations: observationsResult.observationSet,
    readModel,
    consumptionView: viewFromStorage.view,
    consumptionViewFromReadModel: viewFromReadModel.view,
  };
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
    "levelAnalysisConsumptionView",
    "levelSnapshotAttachmentId",
    "levelSnapshotStorageKey",
    "readModelStorageKey",
    "attachmentKey",
    "storageKey",
    "syntheticContinuationMap",
    "rawSnapshot",
    "levelEngineOutput",
  ]);

  for (const key of keys) {
    expect(forbiddenKeys.has(key), `Unexpected level-context output field ${key}`).toBe(false);
  }

  for (const pattern of [
    /levelAnalysisContext/,
    /levelAnalysisObservations/,
    /levelAnalysisConsumptionView/,
    /levelSnapshot/i,
    /readModelStorageKey/,
    /synthetic_continuation_map/,
    /not_historical_support_resistance/,
    /levelEngineOutput/,
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

  for (const key of keys) {
    expect(forbiddenKeys.has(key), `Unexpected interpretation field ${key}`).toBe(false);
  }
}

function expectNoProhibitedCarrierLanguage(value: unknown): void {
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
    expect(pattern.test(text), `Unexpected carrier ${label} language`).toBe(false);
  }
}

function expectNoNewOutputPayload(
  baseline: unknown,
  output: unknown,
  label: string,
): void {
  expect(output, `${label}: output changed`).toEqual(baseline);
  expectNoLevelContextLeak(output);
  expectNoNewInterpretationFields(output);
}

function expectConsumptionParityForFixture(label: string, request: unknown): void {
  const originalInput = cloneFixtureRequest(request) as MutableRecord;
  const originalBefore = cloneFixtureRequest(originalInput);
  const artifacts = buildFactualArtifacts();
  const contextBefore = cloneFixtureRequest(artifacts.context);
  const observationsBefore = cloneFixtureRequest(artifacts.observations);
  const readModelBefore = cloneFixtureRequest(artifacts.readModel);
  const consumptionViewBefore = cloneFixtureRequest(artifacts.consumptionView);
  const baseline = runDeterministicExecutionFeedback(originalInput);

  const contextAttached = attachExecutionLevelContextToPipelineInput({
    pipelineInput: originalInput,
    levelContext: artifacts.context,
  });
  expect(contextAttached.status, label).toBe("attached");
  if (contextAttached.status !== "attached") {
    throw new Error("Expected attached context pipeline input.");
  }
  const contextStripped = stripExecutionLevelContextFromPipelineInput(
    contextAttached.pipelineInput,
  );
  expect(contextStripped, `${label}: context stripped input mismatch`).toEqual(
    originalBefore,
  );
  expectNoNewOutputPayload(
    baseline,
    runDeterministicExecutionFeedback(contextStripped),
    `${label}: context stripped`,
  );
  expectNoNewOutputPayload(
    baseline,
    runDeterministicExecutionFeedback(contextAttached.pipelineInput),
    `${label}: direct context`,
  );

  const observationsAttached =
    attachExecutionLevelContextObservationsToPipelineInput({
      pipelineInput: originalInput,
      observations: artifacts.observations,
    });
  expect(observationsAttached.status, label).toBe("attached");
  if (observationsAttached.status !== "attached") {
    throw new Error("Expected attached observations pipeline input.");
  }
  const observationsStripped =
    stripExecutionLevelContextObservationsFromPipelineInput(
      observationsAttached.pipelineInput,
    );
  expect(observationsStripped, `${label}: observations stripped mismatch`).toEqual(
    originalBefore,
  );
  expectNoNewOutputPayload(
    baseline,
    runDeterministicExecutionFeedback(observationsStripped),
    `${label}: observations stripped`,
  );
  expectNoNewOutputPayload(
    baseline,
    runDeterministicExecutionFeedback(observationsAttached.pipelineInput),
    `${label}: direct observations`,
  );

  const consumptionViewAttached =
    attachExecutionLevelContextConsumptionViewToPipelineInput({
      pipelineInput: originalInput,
      view: artifacts.consumptionView,
    });
  expect(consumptionViewAttached.status, label).toBe("attached");
  if (consumptionViewAttached.status !== "attached") {
    throw new Error("Expected attached consumption-view pipeline input.");
  }
  const consumptionViewStripped =
    stripExecutionLevelContextConsumptionViewFromPipelineInput(
      consumptionViewAttached.pipelineInput,
    );
  expect(
    consumptionViewStripped,
    `${label}: consumption view stripped mismatch`,
  ).toEqual(originalBefore);
  expectNoNewOutputPayload(
    baseline,
    runDeterministicExecutionFeedback(consumptionViewStripped),
    `${label}: consumption view stripped`,
  );
  expectNoNewOutputPayload(
    baseline,
    runDeterministicExecutionFeedback(consumptionViewAttached.pipelineInput),
    `${label}: direct consumption view`,
  );

  const readModelViewAttached =
    attachExecutionLevelContextConsumptionViewToPipelineInput({
      pipelineInput: originalInput,
      view: artifacts.consumptionViewFromReadModel,
    });
  expect(readModelViewAttached.status, label).toBe("attached");
  if (readModelViewAttached.status !== "attached") {
    throw new Error("Expected attached read-model-derived view.");
  }
  expectNoNewOutputPayload(
    baseline,
    runDeterministicExecutionFeedback(readModelViewAttached.pipelineInput),
    `${label}: direct read-model-derived view`,
  );

  const contextAndObservations =
    attachExecutionLevelContextObservationsToPipelineInput({
      pipelineInput: contextAttached.pipelineInput,
      observations: artifacts.observations,
    });
  expect(contextAndObservations.status, label).toBe("attached");
  if (contextAndObservations.status !== "attached") {
    throw new Error("Expected attached context plus observations.");
  }

  const allAttached =
    attachExecutionLevelContextConsumptionViewToPipelineInput({
      pipelineInput: contextAndObservations.pipelineInput,
      view: artifacts.consumptionView,
    });
  expect(allAttached.status, label).toBe("attached");
  if (allAttached.status !== "attached") {
    throw new Error("Expected attached all-carriers input.");
  }

  const allStripped = stripAllLevelAnalysisCarriersFromPipelineInput(
    allAttached.pipelineInput,
  );
  expect(allStripped, `${label}: strip-all input mismatch`).toEqual(originalBefore);
  expectNoNewOutputPayload(
    baseline,
    runDeterministicExecutionFeedback(allStripped),
    `${label}: all carriers stripped`,
  );
  expectNoNewOutputPayload(
    baseline,
    runDeterministicExecutionFeedback(allAttached.pipelineInput),
    `${label}: direct all carriers`,
  );

  expect(originalInput, `${label}: original input mutated`).toEqual(originalBefore);
  expect(artifacts.context, `${label}: level context mutated`).toEqual(
    contextBefore,
  );
  expect(artifacts.observations, `${label}: observations mutated`).toEqual(
    observationsBefore,
  );
  expect(artifacts.readModel, `${label}: read model mutated`).toEqual(
    readModelBefore,
  );
  expect(
    artifacts.consumptionView,
    `${label}: consumption view mutated`,
  ).toEqual(consumptionViewBefore);
  expect(extractExecutionLevelContextFromPipelineInput(contextAttached.pipelineInput)).toBe(
    artifacts.context,
  );
  expect(
    extractExecutionLevelContextObservationsFromPipelineInput(
      observationsAttached.pipelineInput,
    ),
  ).toBe(artifacts.observations);
  expect(
    extractExecutionLevelContextConsumptionViewFromPipelineInput(
      consumptionViewAttached.pipelineInput,
    ),
  ).toBe(artifacts.consumptionView);
  expect(hasExecutionLevelContextConsumptionView(consumptionViewAttached.pipelineInput)).toBe(true);

  expectNoProhibitedCarrierLanguage(artifacts.consumptionView);
  expectNoProhibitedCarrierLanguage(artifacts.consumptionViewFromReadModel);
}

describe("execution level context consumption adapter parity", () => {
  it.each([
    ["long winner", longWinner],
    ["rapid-fire execution cluster", rapidFireExecutionCluster],
    ["open position", openPosition],
  ])("keeps runExecutionFeedback output unchanged with all factual level carriers: %s", (label, request) => {
    expectConsumptionParityForFixture(label, request);
  });

  it("keeps no-consumption-view adapter output equivalent to the original execution input", () => {
    const input = cloneFixtureRequest(longWinner) as MutableRecord;
    const before = cloneFixtureRequest(input);

    const result = attachExecutionLevelContextConsumptionViewToPipelineInput({
      pipelineInput: input,
      view: null,
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
        "src/lib/level-analysis/execution-level-context-consumption-pipeline-adapter.ts",
      ),
      "utf8",
    );

    expect(source).not.toMatch(/from\s+["'][^"']*(trade-analysis|execution-feedback|pattern-scoring|coaching)/);
    expect(source).not.toMatch(/require\(["'][^"']*(trade-analysis|execution-feedback|pattern-scoring|coaching)/);
  });
});
