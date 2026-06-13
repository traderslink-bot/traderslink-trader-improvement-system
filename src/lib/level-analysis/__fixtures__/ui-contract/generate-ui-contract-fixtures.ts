import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildExecutionAnalysisLevelContextInputFromStorageRecord,
  type ExecutionAnalysisLevelContextInput,
} from "../../execution-level-context-input";
import {
  buildExecutionLevelContextObservationReadModel,
  buildExecutionLevelContextObservationReadModelFromObservations,
  type ExecutionLevelContextObservationReadModel,
} from "../../execution-level-context-observation-read-model";
import { buildExecutionLevelContextObservations } from "../../execution-level-context-observations";
import {
  createExecutionLevelContextReadModelStorageRecord,
  type ExecutionLevelContextReadModelStorageRecord,
} from "../../execution-level-context-read-model-storage";
import {
  buildExecutionLevelContextUiContract,
  buildExecutionLevelContextUiContractFromStorageRecord,
  buildUnavailableExecutionLevelContextUiContract,
  type ExecutionLevelContextUiContract,
} from "../../execution-level-context-ui-contract";
import { validateLevelAnalysisSnapshotV1 } from "../../level-analysis-snapshot-adapter";
import {
  createLevelAnalysisSnapshotAttachment,
  type LevelAnalysisSnapshotAttachment,
} from "../../level-analysis-snapshot-attachment";
import type { LevelAnalysisAdapterResult } from "../../level-analysis-snapshot-contract";
import { createLevelAnalysisSnapshotStorageRecord } from "../../level-analysis-snapshot-storage";

const OWNER = { ownerId: "trade-123", ownerType: "trade" };
const ATTACHED_AT = Date.parse("2026-05-31T23:45:00-04:00");
const CREATED_AT = Date.parse("2026-05-31T23:50:00-04:00");

const thisFile = fileURLToPath(import.meta.url);
const fixtureDir = path.dirname(thisFile);
const sourceFixturePath = path.join(
  fixtureDir,
  "..",
  "journal-connector-level-analysis-snapshot-v1.json",
);

type MutableSnapshot = Record<string, unknown>;

export interface ExecutionLevelContextUiContractFixturePack {
  available: ExecutionLevelContextUiContract;
  limited: ExecutionLevelContextUiContract;
  unavailable: ExecutionLevelContextUiContract;
  notReplaySafe: ExecutionLevelContextUiContract;
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function cloneFixture(): MutableSnapshot {
  return JSON.parse(readFileSync(sourceFixturePath, "utf8")) as MutableSnapshot;
}

function acceptedAdapterResult(snapshot: MutableSnapshot): Extract<
  LevelAnalysisAdapterResult,
  { status: "accepted" }
> {
  const result = validateLevelAnalysisSnapshotV1(snapshot, {
    requireReplaySafe: true,
  });

  if (result.status !== "accepted") {
    throw new Error(
      `Expected fixture snapshot to be accepted. Received ${result.status}.`,
    );
  }

  return result;
}

function createAcceptedAttachment(snapshot: MutableSnapshot): LevelAnalysisSnapshotAttachment {
  const result = createLevelAnalysisSnapshotAttachment({
    owner: OWNER,
    adapterResult: acceptedAdapterResult(snapshot),
    attachedAt: ATTACHED_AT,
  });

  if (result.status !== "attached") {
    throw new Error(`Expected snapshot attachment. Received ${result.status}.`);
  }

  return result.attachment;
}

function buildFactualContext(
  snapshot: MutableSnapshot = cloneFixture(),
): ExecutionAnalysisLevelContextInput {
  const snapshotRecord = createLevelAnalysisSnapshotStorageRecord({
    attachment: createAcceptedAttachment(snapshot),
    createdAt: CREATED_AT,
  });
  const result = buildExecutionAnalysisLevelContextInputFromStorageRecord(snapshotRecord);

  if (result.status !== "available") {
    throw new Error(`Expected available context. Received ${result.status}.`);
  }

  return result.input;
}

function buildReadModel(
  snapshot: MutableSnapshot = cloneFixture(),
): ExecutionLevelContextObservationReadModel {
  const context = buildFactualContext(snapshot);
  const observations = buildExecutionLevelContextObservations(context);

  if (observations.status !== "observed") {
    throw new Error(`Expected observed context. Received ${observations.status}.`);
  }

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

function limitedSnapshot(): MutableSnapshot {
  const snapshot = cloneFixture();
  snapshot.nearestSupport = null;
  delete snapshot.marketContext;
  delete snapshot.factsBundle;
  snapshot.volumeShelves = [];
  return snapshot;
}

function unsafeReadModel(): ExecutionLevelContextObservationReadModel {
  const unsafeContext = cloneValue(buildFactualContext());
  unsafeContext.safety.noLookaheadApplied = false;
  return buildExecutionLevelContextObservationReadModel(unsafeContext).readModel;
}

export function buildExecutionLevelContextUiContractFixtures(): ExecutionLevelContextUiContractFixturePack {
  return {
    available: buildExecutionLevelContextUiContractFromStorageRecord(
      createReadModelRecord(),
    ).contract,
    limited: buildExecutionLevelContextUiContract(buildReadModel(limitedSnapshot()))
      .contract,
    unavailable: buildUnavailableExecutionLevelContextUiContract("missing_context")
      .contract,
    notReplaySafe: buildExecutionLevelContextUiContract(unsafeReadModel()).contract,
  };
}

export function writeExecutionLevelContextUiContractFixtures(
  outDir: string = fixtureDir,
): void {
  const fixtures = buildExecutionLevelContextUiContractFixtures();
  mkdirSync(outDir, { recursive: true });

  for (const [fileName, fixture] of [
    ["available-ui-contract.json", fixtures.available],
    ["limited-ui-contract.json", fixtures.limited],
    ["unavailable-ui-contract.json", fixtures.unavailable],
    ["not-replay-safe-ui-contract.json", fixtures.notReplaySafe],
  ] as const) {
    writeFileSync(
      path.join(outDir, fileName),
      `${JSON.stringify(fixture, null, 2)}\n`,
      "utf8",
    );
  }
}

if (path.resolve(process.argv[1] ?? "") === thisFile) {
  writeExecutionLevelContextUiContractFixtures();
}
