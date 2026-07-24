import { createCanonicalContentIdentity, type CanonicalContentDigest } from "../../../domain/identity";
import type { CurrencyCode, ExactResult } from "../../../domain/exact";
import { contractFailure, finalizeContentAddressedAuthority, type AnalyticalContractFailure } from "../../contracts";
import type { AnalyticalDatasetDerivationReceipt } from "../../adapters";
import type { AnalyticalDatasetReceipt, AnalyticalPartitionReceipt } from "../../dataset";
import type { DailyStopAnalysisExecutionWithoutAuthority } from "./daily-stop-analysis";
import { DAILY_STOP_TOOL_KEY, DAILY_STOP_TOOL_VERSION } from "./daily-stop-policy";

export const DAILY_STOP_EXECUTION_AUTHORITY_VERSION = "ti_v3_daily_stop_execution_authority_v1" as const;

export interface DailyStopExecutionAuthority {
  readonly schemaVersion: typeof DAILY_STOP_EXECUTION_AUTHORITY_VERSION;
  readonly toolKey: typeof DAILY_STOP_TOOL_KEY;
  readonly toolVersion: typeof DAILY_STOP_TOOL_VERSION;
  readonly partitionCurrency: CurrencyCode;
  readonly datasetDerivationReceipt: AnalyticalDatasetDerivationReceipt;
  readonly normalizedArgumentsDigest: CanonicalContentDigest;
  readonly registryEntryDigest: CanonicalContentDigest;
  readonly runContextDigest: CanonicalContentDigest;
  readonly selectedRowKeys: readonly string[];
  readonly selectedExclusionKeys: readonly string[];
  readonly payloadDigest: CanonicalContentDigest;
  readonly authorityDigest: CanonicalContentDigest;
}

export function buildDailyStopExecutionAuthority(
  execution: DailyStopAnalysisExecutionWithoutAuthority,
  datasetDerivationReceipt: AnalyticalDatasetDerivationReceipt,
  datasetReceipt: AnalyticalDatasetReceipt,
  partitionReceipt: AnalyticalPartitionReceipt,
): ExactResult<DailyStopExecutionAuthority, AnalyticalContractFailure> {
  const payloadIdentity = createCanonicalContentIdentity("daily_stop_execution_payload", "v1", execution);
  if (!payloadIdentity.ok) return contractFailure(payloadIdentity.error.code, payloadIdentity.error.path);
  return finalizeContentAddressedAuthority("daily_stop_execution_authority", {
    schemaVersion: DAILY_STOP_EXECUTION_AUTHORITY_VERSION,
    toolKey: DAILY_STOP_TOOL_KEY,
    toolVersion: DAILY_STOP_TOOL_VERSION,
    partitionCurrency: partitionReceipt.currency,
    datasetDerivationReceipt,
    normalizedArgumentsDigest: execution.normalizedArguments.argumentsDigest,
    registryEntryDigest: execution.registryEntry.entryDigest,
    runContextDigest: execution.runContext.runContextDigest,
    selectedRowKeys: datasetReceipt.rows.filter((row) => partitionReceipt.includedRowKeys.includes(row.semanticRoundTripKey)).map((row) => row.semanticRoundTripKey),
    selectedExclusionKeys: datasetReceipt.excludedCandidates.filter((candidate) => partitionReceipt.excludedCandidateKeys.includes(candidate.candidateKey)).map((candidate) => candidate.candidateKey),
    payloadDigest: payloadIdentity.value.identifier,
  }, "authorityDigest") as ExactResult<DailyStopExecutionAuthority, AnalyticalContractFailure>;
}
