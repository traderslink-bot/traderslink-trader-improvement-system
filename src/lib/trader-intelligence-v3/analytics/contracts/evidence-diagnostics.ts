import type { ExactResult } from "../../domain/exact";
import type { CanonicalContentDigest } from "../../domain/identity";
import {
  GA0_B1_CONTRACT_LIMITS,
  contractFailure,
  finalizeContentAddressedAuthority,
  validateClaimedDigest,
  validateContractKey,
  validateContractRecord,
  validateKeyArray,
  validateReasonCode,
  validateReasonCodes,
  validateTimestampValue,
  type AnalyticalContractFailure,
} from "./contract-validation";
import { getAnalysisRunContextDependencies, verifyAnalysisRunContext, type AnalysisRunContext } from "./run-context";
import { isClaimNeutralAnalyticalExclusion } from "../dataset/analytical-dataset";

export const ANALYTICAL_EVIDENCE_BUNDLE_VERSION = "ti_v3_analytical_evidence_bundle_v1" as const;
export const ANALYTICAL_DIAGNOSTICS_VERSION = "ti_v3_analytical_diagnostics_v1" as const;

export const ANALYTICAL_EVIDENCE_POPULATION_STATES = Object.freeze({
  nonempty: "nonempty",
  emptyIncluded: "empty_included",
} as const);

export interface AnalyticalSimulationEvidenceAuthority {
  readonly kind: "daily_stop_simulation_v1";
  readonly actualCandidateKeys: readonly string[];
  readonly retainedCandidateKeys: readonly string[];
  readonly removedCandidateKeys: readonly string[];
  readonly triggerCandidateKey: string | null;
  readonly stopAt: string | null;
}

export interface AnalyticalEvidenceBundle {
  readonly schemaVersion: typeof ANALYTICAL_EVIDENCE_BUNDLE_VERSION;
  readonly evidenceKey: string;
  readonly runContextDigest: CanonicalContentDigest;
  readonly snapshotDigest: CanonicalContentDigest;
  readonly filterDigest: CanonicalContentDigest;
  readonly datasetReceiptDigest: CanonicalContentDigest;
  readonly partitionDigest: CanonicalContentDigest;
  readonly partitionCurrency: string;
  readonly comparisonGroupKey: string | null;
  readonly inclusionState: "included" | "excluded";
  readonly populationState?: "nonempty" | "empty_included";
  readonly candidateKeys: readonly string[];
  readonly simulationAuthority?: AnalyticalSimulationEvidenceAuthority;
  readonly roundTripKeys: readonly string[];
  readonly occurrenceKeys: readonly string[];
  readonly exclusionReasonCodes: readonly string[];
  readonly secondaryExclusionReasonCodes: readonly string[];
  readonly sourceExclusionReasonCodes: readonly string[];
  readonly exclusionReasonAuthorities: readonly Readonly<{
    readonly reasonCode: string;
    readonly authority: string;
    readonly sourceReasonCode: string | null;
    readonly mappingPolicyKey: string | null;
    readonly mappingPolicyVersion: string | null;
  }>[];
  readonly limitationCodes: readonly string[];
  readonly bundleDigest: CanonicalContentDigest;
}

export interface AnalyticalDiagnosticEntry {
  readonly diagnosticKey: string;
  readonly severity: "info" | "limitation" | "blocked";
  readonly code: string;
  readonly affectedKeys: readonly string[];
}

export interface AnalyticalDiagnostics {
  readonly schemaVersion: typeof ANALYTICAL_DIAGNOSTICS_VERSION;
  readonly runContextDigest: CanonicalContentDigest;
  readonly entries: readonly AnalyticalDiagnosticEntry[];
  readonly diagnosticsDigest: CanonicalContentDigest;
}

export function buildAnalyticalEvidenceBundle(
  input: unknown,
): ExactResult<AnalyticalEvidenceBundle, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion", "evidenceKey", "runContext", "comparisonGroupKey",
    "inclusionState", "candidateKeys",
  ], ["limitationCodes", "populationState", "simulationAuthority"]);
  if (!record.ok) return record;
  if (record.value.schemaVersion !== ANALYTICAL_EVIDENCE_BUNDLE_VERSION) return contractFailure("ti_v3_analytics_contract_invalid", "$.schemaVersion");
  const context = verifyAnalysisRunContext((input as Record<string, unknown>).runContext);
  if (!context.ok) return contractFailure(context.error.code, `$.runContext${context.error.path.slice(1)}`);
  const evidenceKey = validateContractKey(record.value.evidenceKey, "$.evidenceKey");
  if (!evidenceKey.ok) return evidenceKey;
  let comparisonGroupKey: string | null = null;
  if (record.value.comparisonGroupKey !== null) {
    const group = validateContractKey(record.value.comparisonGroupKey, "$.comparisonGroupKey");
    if (!group.ok) return group;
    comparisonGroupKey = group.value;
  }
  if (record.value.inclusionState !== "included" && record.value.inclusionState !== "excluded") return contractFailure("ti_v3_analytics_contract_invalid", "$.inclusionState");
  const populationState = record.value.populationState === undefined
    ? undefined
    : record.value.populationState === ANALYTICAL_EVIDENCE_POPULATION_STATES.nonempty || record.value.populationState === ANALYTICAL_EVIDENCE_POPULATION_STATES.emptyIncluded
      ? record.value.populationState
      : null;
  if (populationState === null) return contractFailure("ti_v3_analytics_contract_invalid", "$.populationState");
  const candidateKeys = validateKeyArray(record.value.candidateKeys, "$.candidateKeys", { maximumKeyLength: 512 });
  if (!candidateKeys.ok) return candidateKeys;
  if (candidateKeys.value.length === 0 && !(record.value.inclusionState === "included" && populationState === ANALYTICAL_EVIDENCE_POPULATION_STATES.emptyIncluded)) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.candidateKeys");
  }
  if (candidateKeys.value.length > 0 && populationState === ANALYTICAL_EVIDENCE_POPULATION_STATES.emptyIncluded) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.populationState");
  }
  if (populationState === ANALYTICAL_EVIDENCE_POPULATION_STATES.emptyIncluded && record.value.inclusionState !== "included") {
    return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.inclusionState");
  }
  const dependencies = getAnalysisRunContextDependencies(context.value);
  if (dependencies === null) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.runContext");
  const roundTripKeys = new Set<string>();
  const occurrenceKeys = new Set<string>();
  const limitationCodes = new Set<string>();
  if (record.value.limitationCodes !== undefined) {
    const suppliedLimitations = validateReasonCodes(record.value.limitationCodes, "$.limitationCodes");
    if (!suppliedLimitations.ok) return suppliedLimitations;
    suppliedLimitations.value.forEach((code) => limitationCodes.add(code));
  }
  const exclusionReasonCodes = new Set<string>();
  const secondaryExclusionReasonCodes = new Set<string>();
  const sourceExclusionReasonCodes = new Set<string>();
  const exclusionReasonAuthorities = new Map<string, AnalyticalEvidenceBundle["exclusionReasonAuthorities"][number]>();
  if (record.value.inclusionState === "included") {
    for (const candidateKey of candidateKeys.value) {
      if (!dependencies.partitionReceipt.includedRowKeys.includes(candidateKey)) {
        return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.candidateKeys");
      }
      const row = dependencies.datasetReceipt.rows.find((item) => item.semanticRoundTripKey === candidateKey);
      if (row === undefined) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.candidateKeys");
      roundTripKeys.add(row.semanticRoundTripKey);
      row.supportingOccurrenceKeys.forEach((key) => occurrenceKeys.add(key));
      row.limitationCodes.forEach((code) => limitationCodes.add(code));
    }
  } else {
    for (const candidateKey of candidateKeys.value) {
      if (!dependencies.partitionReceipt.excludedCandidateKeys.includes(candidateKey)) {
        return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.candidateKeys");
      }
      const exclusion = dependencies.datasetReceipt.excludedCandidates.find((item) => item.candidateKey === candidateKey);
      if (exclusion === undefined) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.candidateKeys");
      if (exclusion.semanticRoundTripKey !== null) roundTripKeys.add(exclusion.semanticRoundTripKey);
      exclusion.relatedOccurrenceKeys.forEach((key) => occurrenceKeys.add(key));
      if (!isClaimNeutralAnalyticalExclusion(exclusion)) {
        exclusion.limitationCodes.forEach((code) => limitationCodes.add(code));
        limitationCodes.add(exclusion.reasonCode);
      }
      exclusionReasonCodes.add(exclusion.reasonCode);
      exclusion.secondaryReasonCodes.forEach((code) =>
        secondaryExclusionReasonCodes.add(code));
      exclusion.sourceReasonCodes.forEach((code) =>
        sourceExclusionReasonCodes.add(code));
      exclusion.reasonAuthorities.forEach((authority) => {
        const key = `${authority.reasonCode}:${authority.authority}:${authority.sourceReasonCode ?? ""}:${authority.mappingPolicyKey ?? ""}:${authority.mappingPolicyVersion ?? ""}`;
        exclusionReasonAuthorities.set(key, authority);
      });
    }
  }
  let simulationAuthority: AnalyticalSimulationEvidenceAuthority | undefined;
  if (record.value.simulationAuthority !== undefined) {
    const authority = validateContractRecord(record.value.simulationAuthority, [
      "kind", "actualCandidateKeys", "retainedCandidateKeys", "removedCandidateKeys", "triggerCandidateKey", "stopAt",
    ], [], "$.simulationAuthority");
    if (!authority.ok) return authority;
    if (authority.value.kind !== "daily_stop_simulation_v1") return contractFailure("ti_v3_analytics_contract_invalid", "$.simulationAuthority.kind");
    const actual = validateKeyArray(authority.value.actualCandidateKeys, "$.simulationAuthority.actualCandidateKeys", { maximumKeyLength: 512 });
    const retained = validateKeyArray(authority.value.retainedCandidateKeys, "$.simulationAuthority.retainedCandidateKeys", { maximumKeyLength: 512 });
    const removed = validateKeyArray(authority.value.removedCandidateKeys, "$.simulationAuthority.removedCandidateKeys", { maximumKeyLength: 512 });
    if (!actual.ok) return actual;
    if (!retained.ok) return retained;
    if (!removed.ok) return removed;
    if (record.value.inclusionState !== "included" || populationState === ANALYTICAL_EVIDENCE_POPULATION_STATES.emptyIncluded || actual.value.length === 0) {
      return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.simulationAuthority");
    }
    if (actual.value.join("\u0000") !== candidateKeys.value.join("\u0000")) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.simulationAuthority.actualCandidateKeys");
    const retainedSet = new Set(retained.value);
    const removedSet = new Set(removed.value);
    if (retained.value.some((key) => removedSet.has(key)) || retained.value.length + removed.value.length !== actual.value.length || actual.value.some((key) => !retainedSet.has(key) && !removedSet.has(key))) {
      return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.simulationAuthority");
    }
    let triggerCandidateKey: string | null = null;
    if (authority.value.triggerCandidateKey !== null) {
      const trigger = validateContractKey(authority.value.triggerCandidateKey, "$.simulationAuthority.triggerCandidateKey", 512);
      if (!trigger.ok) return trigger;
      if (!retainedSet.has(trigger.value)) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.simulationAuthority.triggerCandidateKey");
      triggerCandidateKey = trigger.value;
    }
    let stopAt: string | null = null;
    if (authority.value.stopAt !== null) {
      const timestamp = validateTimestampValue(authority.value.stopAt, "$.simulationAuthority.stopAt");
      if (!timestamp.ok) return timestamp;
      stopAt = timestamp.value;
    }
    if ((triggerCandidateKey === null) !== (stopAt === null)) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.simulationAuthority");
    simulationAuthority = Object.freeze({ kind: "daily_stop_simulation_v1", actualCandidateKeys: actual.value, retainedCandidateKeys: retained.value, removedCandidateKeys: removed.value, triggerCandidateKey, stopAt });
  }
  return finalizeContentAddressedAuthority("analytical_evidence_bundle", {
    schemaVersion: ANALYTICAL_EVIDENCE_BUNDLE_VERSION,
    evidenceKey: evidenceKey.value,
    runContextDigest: context.value.runContextDigest,
    snapshotDigest: context.value.snapshotDigest,
    filterDigest: context.value.filterDigest,
    datasetReceiptDigest: context.value.datasetReceiptDigest,
    partitionDigest: context.value.partitionDigest,
    partitionCurrency: context.value.partitionCurrency,
    comparisonGroupKey,
    inclusionState: record.value.inclusionState,
    ...(populationState === undefined ? {} : { populationState }),
    candidateKeys: candidateKeys.value,
    ...(simulationAuthority === undefined ? {} : { simulationAuthority }),
    ...(record.value.limitationCodes === undefined ? {} : { limitationCodes: record.value.limitationCodes }),
    roundTripKeys: [...roundTripKeys].sort(),
    occurrenceKeys: [...occurrenceKeys].sort(),
    exclusionReasonCodes: [...exclusionReasonCodes].sort(),
    secondaryExclusionReasonCodes: [...secondaryExclusionReasonCodes].sort(),
    sourceExclusionReasonCodes: [...sourceExclusionReasonCodes].sort(),
    exclusionReasonAuthorities: [...exclusionReasonAuthorities.values()].sort(
      (left, right) => {
        const leftKey = `${left.reasonCode}:${left.authority}:${left.sourceReasonCode ?? ""}`;
        const rightKey = `${right.reasonCode}:${right.authority}:${right.sourceReasonCode ?? ""}`;
        return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
      },
    ),
    limitationCodes: [...limitationCodes].sort(),
  }, "bundleDigest") as ExactResult<AnalyticalEvidenceBundle, AnalyticalContractFailure>;
}

export function verifyAnalyticalEvidenceBundle(
  input: unknown,
  runContext: AnalysisRunContext,
): ExactResult<AnalyticalEvidenceBundle, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion", "evidenceKey", "runContextDigest", "snapshotDigest", "filterDigest",
    "datasetReceiptDigest", "partitionDigest", "partitionCurrency",
    "comparisonGroupKey", "inclusionState", "candidateKeys", "roundTripKeys",
    "occurrenceKeys", "exclusionReasonCodes", "secondaryExclusionReasonCodes",
    "sourceExclusionReasonCodes", "exclusionReasonAuthorities",
    "limitationCodes", "bundleDigest",
  ], ["populationState", "simulationAuthority"]);
  if (!record.ok) return record;
  const context = verifyAnalysisRunContext(runContext);
  if (!context.ok || record.value.runContextDigest !== context.value.runContextDigest || record.value.snapshotDigest !== context.value.snapshotDigest || record.value.filterDigest !== context.value.filterDigest || record.value.datasetReceiptDigest !== context.value.datasetReceiptDigest || record.value.partitionDigest !== context.value.partitionDigest || record.value.partitionCurrency !== context.value.partitionCurrency) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$");
  const digest = validateClaimedDigest(record.value.bundleDigest, "$.bundleDigest", "analytical_evidence_bundle");
  if (!digest.ok) return digest;
  const rebuilt = buildAnalyticalEvidenceBundle({
    schemaVersion: record.value.schemaVersion,
    evidenceKey: record.value.evidenceKey,
    runContext: context.value,
    comparisonGroupKey: record.value.comparisonGroupKey,
    inclusionState: record.value.inclusionState,
    ...(record.value.populationState === undefined ? {} : { populationState: record.value.populationState }),
    candidateKeys: record.value.candidateKeys,
    ...(record.value.simulationAuthority === undefined ? {} : { simulationAuthority: record.value.simulationAuthority }),
    limitationCodes: record.value.limitationCodes,
  });
  if (!rebuilt.ok || rebuilt.value.bundleDigest !== digest.value) return contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.bundleDigest");
  return rebuilt;
}

export function buildAnalyticalDiagnostics(
  input: unknown,
): ExactResult<AnalyticalDiagnostics, AnalyticalContractFailure> {
  const record = validateContractRecord(input, ["schemaVersion", "runContext", "entries"]);
  if (!record.ok) return record;
  if (record.value.schemaVersion !== ANALYTICAL_DIAGNOSTICS_VERSION) return contractFailure("ti_v3_analytics_contract_invalid", "$.schemaVersion");
  const context = verifyAnalysisRunContext((input as Record<string, unknown>).runContext);
  if (!context.ok) return contractFailure(context.error.code, `$.runContext${context.error.path.slice(1)}`);
  if (!Array.isArray(record.value.entries) || record.value.entries.length > GA0_B1_CONTRACT_LIMITS.maximumDiagnostics) return contractFailure("ti_v3_analytics_contract_oversized", "$.entries");
  const entries: AnalyticalDiagnosticEntry[] = [];
  for (let index = 0; index < record.value.entries.length; index += 1) {
    const path = `$.entries[${index}]`;
    const entry = validateContractRecord(record.value.entries[index], ["diagnosticKey", "severity", "code", "affectedKeys"], [], path);
    if (!entry.ok) return entry;
    const key = validateContractKey(entry.value.diagnosticKey, `${path}.diagnosticKey`);
    if (!key.ok) return key;
    if (entry.value.severity !== "info" && entry.value.severity !== "limitation" && entry.value.severity !== "blocked") return contractFailure("ti_v3_analytics_contract_invalid", `${path}.severity`);
    const code = validateReasonCode(entry.value.code, `${path}.code`);
    if (!code.ok) return code;
    const affected = validateKeyArray(entry.value.affectedKeys, `${path}.affectedKeys`);
    if (!affected.ok) return affected;
    entries.push(Object.freeze({ diagnosticKey: key.value, severity: entry.value.severity, code: code.value, affectedKeys: affected.value }));
  }
  const keys = entries.map((entry) => entry.diagnosticKey);
  if (new Set(keys).size !== keys.length) return contractFailure("ti_v3_analytics_contract_duplicate_identity", "$.entries");
  entries.sort((left, right) => left.diagnosticKey < right.diagnosticKey ? -1 : left.diagnosticKey > right.diagnosticKey ? 1 : 0);
  return finalizeContentAddressedAuthority("analytical_diagnostics", {
    schemaVersion: ANALYTICAL_DIAGNOSTICS_VERSION,
    runContextDigest: context.value.runContextDigest,
    entries,
  }, "diagnosticsDigest") as ExactResult<AnalyticalDiagnostics, AnalyticalContractFailure>;
}

export function verifyAnalyticalDiagnostics(
  input: unknown,
  runContext: AnalysisRunContext,
): ExactResult<AnalyticalDiagnostics, AnalyticalContractFailure> {
  const record = validateContractRecord(input, ["schemaVersion", "runContextDigest", "entries", "diagnosticsDigest"]);
  if (!record.ok) return record;
  const context = verifyAnalysisRunContext(runContext);
  if (!context.ok || record.value.runContextDigest !== context.value.runContextDigest) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.runContextDigest");
  const digest = validateClaimedDigest(record.value.diagnosticsDigest, "$.diagnosticsDigest", "analytical_diagnostics");
  if (!digest.ok) return digest;
  const rebuilt = buildAnalyticalDiagnostics({ schemaVersion: record.value.schemaVersion, runContext: context.value, entries: record.value.entries });
  if (!rebuilt.ok || rebuilt.value.diagnosticsDigest !== digest.value) return contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.diagnosticsDigest");
  return rebuilt;
}
