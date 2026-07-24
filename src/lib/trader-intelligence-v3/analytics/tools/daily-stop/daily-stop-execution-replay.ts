import { serializeCanonicalValue } from "../../../domain/canonical";
import type { ExactResult } from "../../../domain/exact";
import { rehydrateAnalyticalDatasetDerivation, type ReadOnlySnapshotAuthoritySource } from "../../adapters";
import { ANALYTICAL_PARTITION_VERSION, buildAnalyticalPartitionReceipt } from "../../dataset";
import { contractFailure, validateContractRecord, type AnalyticalContractFailure } from "../../contracts";
import { DAILY_STOP_EXECUTION_AUTHORITY_VERSION, type DailyStopExecutionAuthority } from "./daily-stop-execution-authority-contract";
import { executeDailyStopAnalysis, type DailyStopAnalysisExecution } from "./daily-stop-analysis";
import { DAILY_STOP_TOOL_KEY, DAILY_STOP_TOOL_VERSION } from "./daily-stop-policy";

const EXECUTION_KEYS = Object.freeze(["normalizedArguments", "registryEntry", "runContext", "evidenceBundles", "tables", "claims", "series", "diagnostics", "receipt", "executionAuthority"]);
const AUTHORITY_KEYS = Object.freeze(["schemaVersion", "toolKey", "toolVersion", "partitionCurrency", "datasetDerivationReceipt", "normalizedArgumentsDigest", "registryEntryDigest", "runContextDigest", "selectedRowKeys", "selectedExclusionKeys", "payloadDigest", "authorityDigest"]);

function replayFailure(path: string): ExactResult<never, AnalyticalContractFailure> {
  return contractFailure("ti_v3_analytics_contract_reference_mismatch", path);
}

/** Persisted B3 artifacts are untrusted until the complete graph is recomputed. */
export function rehydrateDailyStopAnalysisExecution(
  persisted: unknown,
  source: ReadOnlySnapshotAuthoritySource,
): ExactResult<DailyStopAnalysisExecution, AnalyticalContractFailure> {
  const canonicalPersisted = serializeCanonicalValue(persisted);
  if (!canonicalPersisted.ok) return replayFailure("$");
  const executionRecord = validateContractRecord(persisted, EXECUTION_KEYS);
  if (!executionRecord.ok) return executionRecord;
  const authorityRecord = validateContractRecord(executionRecord.value.executionAuthority, AUTHORITY_KEYS, [], "$.executionAuthority");
  if (!authorityRecord.ok || authorityRecord.value.schemaVersion !== DAILY_STOP_EXECUTION_AUTHORITY_VERSION || authorityRecord.value.toolKey !== DAILY_STOP_TOOL_KEY || authorityRecord.value.toolVersion !== DAILY_STOP_TOOL_VERSION) return replayFailure("$.executionAuthority");
  const authority = authorityRecord.value as unknown as DailyStopExecutionAuthority;
  let sourceResult: ReturnType<ReadOnlySnapshotAuthoritySource["readExactAuthority"]>;
  try { sourceResult = source.readExactAuthority(); } catch { return replayFailure("$.source"); }
  if (sourceResult.state !== "available") return replayFailure("$.source");
  const fixedSource: ReadOnlySnapshotAuthoritySource = Object.freeze({ sourceKey: source.sourceKey, sourceVersion: source.sourceVersion, readExactAuthority: () => sourceResult });
  const dataset = rehydrateAnalyticalDatasetDerivation(authority.datasetDerivationReceipt, fixedSource);
  if (!dataset.ok) return replayFailure("$.executionAuthority.datasetDerivationReceipt");
  const partition = buildAnalyticalPartitionReceipt({ schemaVersion: ANALYTICAL_PARTITION_VERSION, datasetReceipt: dataset.value.datasetReceipt, currency: authority.partitionCurrency });
  if (!partition.ok) return replayFailure("$.executionAuthority.partitionCurrency");
  const replayed = executeDailyStopAnalysis({
    snapshot: sourceResult.authority.snapshot,
    snapshotDependencies: sourceResult.authority.snapshotDependencies,
    canonicalFilter: sourceResult.authority.snapshotDependencies.filter,
    datasetReceipt: dataset.value.datasetReceipt,
    datasetDerivationReceipt: dataset.value.derivationReceipt,
    partitionReceipt: partition.value,
    arguments: executionRecord.value.normalizedArguments && typeof executionRecord.value.normalizedArguments === "object" ? (executionRecord.value.normalizedArguments as { values?: unknown }).values : undefined,
  });
  if (!replayed.ok) return replayed;
  const canonicalReplayed = serializeCanonicalValue(replayed.value);
  if (!canonicalReplayed.ok || canonicalReplayed.value.json !== canonicalPersisted.value.json) return replayFailure("$");
  return replayed;
}
