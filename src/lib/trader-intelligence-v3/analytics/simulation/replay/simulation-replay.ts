import { serializeCanonicalValue } from "../../../domain/canonical";
import type { CanonicalContentDigest } from "../../../domain/identity";
import type { ExactResult } from "../../../domain/exact";
import {
  contractFailure,
  finalizeContentAddressedAuthority,
  validateCanonicalCount,
  validateClaimedDigest,
  validateContractKey,
  validateContractRecord,
  type AnalyticalContractFailure,
} from "../../contracts";
import type { AnalyticalPartitionReceipt } from "../../dataset";
import {
  verifyTradeQueryPlan,
  verifyTradeQueryResultShape,
  type TradeQueryResult,
} from "../../query/contracts";
import { isVerifiedTradeQueryExecution } from "../../query/execution/verified-execution";
import {
  openReadOnlyTradeQueryGateway,
  type VerifiedTradeQueryDatasetSource,
} from "../../query/gateway";
import {
  COUNTERFACTUAL_SIMULATION_RESULT_VERSION,
  executeCounterfactualSimulation,
  verifyAndReplayCounterfactualSimulationResult,
  type CounterfactualSimulationResult,
} from "../execution";
import {
  COUNTERFACTUAL_SIMULATION_LIMITS,
  RULE_STATE_DEPENDENCY_POLICY_VERSION,
  verifyCounterfactualSimulationPlan,
  type CounterfactualSimulationPlan,
} from "../contracts";
import {
  EXECUTION_ONLY_SIMULATION_PRESET_VERSION,
  verifyCompiledExecutionOnlySimulationPreset,
  type CompiledRepresentativeSimulationPreset,
} from "../presets";

export const COUNTERFACTUAL_SIMULATION_REPLAY_ENVELOPE_VERSION =
  "ti_v3_counterfactual_simulation_replay_envelope_v1" as const;
export const COUNTERFACTUAL_SIMULATION_REPLAY_RECEIPT_VERSION =
  "ti_v3_counterfactual_simulation_replay_receipt_v1" as const;
export const COUNTERFACTUAL_SIMULATION_REPLAY_SEMANTIC_VERSION = "v1" as const;

export const COUNTERFACTUAL_SIMULATION_REPLAY_LIMITS = Object.freeze({
  maximumArtifactReferences: 8,
  maximumDiagnostics: 128,
  maximumAuthorityScopeKeys: 128,
  maximumDiagnosticPathCodeUnits: 512,
});

export const COUNTERFACTUAL_SIMULATION_REPLAY_STAGES = Object.freeze([
  "replay_envelope_contract",
  "dataset_partition_authority",
  "source_query_result_authority",
  "source_query_plan_reconstruction",
  "simulation_plan_reconstruction",
  "preset_reconstruction",
  "simulation_execution",
  "result_reconstruction",
  "expected_result_digest",
  "replay_receipt_verification",
] as const);

export type CounterfactualSimulationReplayStage =
  typeof COUNTERFACTUAL_SIMULATION_REPLAY_STAGES[number];

type ArtifactKind =
  | "dataset_receipt"
  | "dataset_derivation_receipt"
  | "partition_receipt"
  | "source_query_plan"
  | "source_query_result"
  | "simulation_plan"
  | "simulation_result"
  | "governed_preset";

interface ReplayAuthorityIdentities {
  readonly sourceKey: string;
  readonly sourceVersion: string;
  readonly snapshotDigest: CanonicalContentDigest;
  readonly datasetReceiptDigest: CanonicalContentDigest;
  readonly datasetDerivationDigest: CanonicalContentDigest;
  readonly partitionDigest: CanonicalContentDigest;
  readonly ownerScope: readonly string[];
  readonly accountScope: readonly string[];
  readonly currency: string;
}

interface ReplayArtifactReference {
  readonly artifactKind: ArtifactKind;
  readonly artifactDigest: CanonicalContentDigest;
}

interface GovernedPresetReference {
  readonly schemaVersion: typeof EXECUTION_ONLY_SIMULATION_PRESET_VERSION;
  readonly presetKey: string;
  readonly presetVersion: "v1";
  readonly presetDigest: CanonicalContentDigest;
}

export interface CounterfactualSimulationReplayEnvelope {
  readonly schemaVersion:
    typeof COUNTERFACTUAL_SIMULATION_REPLAY_ENVELOPE_VERSION;
  readonly semanticVersion:
    typeof COUNTERFACTUAL_SIMULATION_REPLAY_SEMANTIC_VERSION;
  readonly replayPolicyKey:
    "ti_v3_counterfactual_simulation_reexecution_replay";
  readonly replayPolicyVersion: "v1";
  readonly sourceAuthority: ReplayAuthorityIdentities;
  readonly sourceQueryPlanDigest: CanonicalContentDigest;
  readonly sourceQueryResultDigest: CanonicalContentDigest;
  readonly simulationPlanDigest: CanonicalContentDigest;
  readonly persistedSimulationResultDigest: CanonicalContentDigest;
  readonly simulationResultSchemaVersion:
    typeof COUNTERFACTUAL_SIMULATION_RESULT_VERSION;
  readonly stateDependencyPolicyVersion:
    typeof RULE_STATE_DEPENDENCY_POLICY_VERSION;
  readonly executionPolicies: CounterfactualSimulationPlan["policies"];
  readonly declaredOutputBounds: CounterfactualSimulationPlan["limits"];
  readonly requiredSimulationAuthorityScope:
    "verified_ga1_a_query_result_and_execution_rows_v1";
  /**
   * Declared authority for the supplied plan. A plan's rules are not evidence
   * that it was produced by a named governed preset, so this cannot be
   * inferred from plan shape or an optional artifact.
   */
  readonly planOrigin: "generic_plan" | "governed_preset";
  readonly governedPresetReference: GovernedPresetReference | null;
  readonly artifactReferences: readonly ReplayArtifactReference[];
  readonly replayBounds: Readonly<{
    readonly artifactReferenceLimit: "8";
    readonly diagnosticLimit: string;
    readonly reconstructionEvidenceLimit: "0";
    readonly receiptCollectionLimit: "1";
  }>;
  readonly envelopeDigest: CanonicalContentDigest;
}

export interface CounterfactualSimulationReplayDiagnostic {
  readonly code: string;
  readonly path: string;
}

export interface CounterfactualSimulationReplayReceipt {
  readonly schemaVersion:
    typeof COUNTERFACTUAL_SIMULATION_REPLAY_RECEIPT_VERSION;
  readonly semanticVersion:
    typeof COUNTERFACTUAL_SIMULATION_REPLAY_SEMANTIC_VERSION;
  readonly replayEnvelopeDigest: CanonicalContentDigest;
  readonly suppliedAuthorityIdentities: ReplayAuthorityIdentities;
  readonly reconstructedQueryPlanDigest: CanonicalContentDigest;
  readonly reconstructedSimulationPlanDigest: CanonicalContentDigest;
  readonly reconstructedSimulationResultDigest: CanonicalContentDigest;
  readonly expectedPersistedResultDigest: CanonicalContentDigest;
  readonly replayVerificationStatus: "verified";
  readonly mismatchStage: null;
  readonly diagnosticCodes: readonly string[];
  readonly diagnostics: readonly CounterfactualSimulationReplayDiagnostic[];
  readonly diagnosticLimit: string;
  readonly receiptDigest: CanonicalContentDigest;
}

export interface CounterfactualSimulationReplayFailure {
  readonly code: string;
  readonly stage: CounterfactualSimulationReplayStage;
  readonly path: string;
  readonly diagnosticCodes: readonly string[];
  readonly diagnostics: readonly CounterfactualSimulationReplayDiagnostic[];
}

type ReplayFailureResult = Readonly<{
  readonly ok: false;
  readonly error: CounterfactualSimulationReplayFailure;
}>;

interface CounterfactualSimulationReplayArtifactBase {
  readonly source: VerifiedTradeQueryDatasetSource;
  readonly partitionReceipt: AnalyticalPartitionReceipt;
  readonly sourceQueryResult: TradeQueryResult;
  readonly simulationPlan: unknown;
  readonly persistedResult: unknown;
}

/** Replay accepts an optional preset only so generic envelopes can reject it. */
export interface CounterfactualSimulationReplayArtifacts
  extends CounterfactualSimulationReplayArtifactBase {
  readonly compiledPreset?: unknown;
}

export type CounterfactualSimulationReplayIssuanceArtifacts =
  | (CounterfactualSimulationReplayArtifactBase & Readonly<{
    readonly planOrigin: "generic_plan";
    readonly compiledPreset?: undefined;
  }>)
  | (CounterfactualSimulationReplayArtifactBase & Readonly<{
    readonly planOrigin: "governed_preset";
    readonly compiledPreset: unknown;
  }>);

function verifyIssuanceRequest(
  input: unknown,
): ExactResult<
  CounterfactualSimulationReplayIssuanceArtifacts,
  AnalyticalContractFailure
> {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$");
  }
  let prototype: object | null;
  let keys: readonly (string | symbol)[];
  let descriptors: PropertyDescriptorMap;
  try {
    prototype = Object.getPrototypeOf(input) as object | null;
    keys = Reflect.ownKeys(input);
    descriptors = Object.getOwnPropertyDescriptors(input);
  } catch {
    return contractFailure("ti_v3_analytics_contract_invalid", "$");
  }
  if (prototype !== Object.prototype && prototype !== null) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$");
  }
  const requiredKeys = [
    "source",
    "partitionReceipt",
    "sourceQueryResult",
    "simulationPlan",
    "persistedResult",
    "planOrigin",
  ] as const;
  const allowedKeys = new Set<string>([...requiredKeys, "compiledPreset"]);
  const invalidKey = keys.find((key) =>
    typeof key !== "string" || !allowedKeys.has(key)
  );
  if (invalidKey !== undefined) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      typeof invalidKey === "string" ? `$.${invalidKey}` : "$",
    );
  }
  const missingKey = requiredKeys.find((key) => descriptors[key] === undefined);
  if (missingKey !== undefined) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      `$.${missingKey}`,
    );
  }
  for (const key of keys) {
    if (typeof key !== "string") continue;
    const descriptor = descriptors[key];
    if (
      descriptor === undefined ||
      descriptor.get !== undefined ||
      descriptor.set !== undefined ||
      !("value" in descriptor)
    ) {
      return contractFailure(
        "ti_v3_analytics_contract_invalid",
        `$.${key}`,
      );
    }
  }
  const record = Object.fromEntries(
    keys.map((key) => [
      key as string,
      descriptors[key as string].value as unknown,
    ]),
  );
  if (record.planOrigin === "generic_plan") {
    if (record.compiledPreset !== undefined) {
      return contractFailure(
        "ti_v3_analytics_contract_invalid",
        "$.compiledPreset",
      );
    }
    return {
      ok: true,
      value: record as unknown as
        CounterfactualSimulationReplayIssuanceArtifacts,
    };
  }
  if (record.planOrigin === "governed_preset") {
    if (record.compiledPreset === undefined) {
      return contractFailure(
        "ti_v3_analytics_contract_invalid",
        "$.compiledPreset",
      );
    }
    return {
      ok: true,
      value: record as unknown as
        CounterfactualSimulationReplayIssuanceArtifacts,
    };
  }
  return contractFailure(
    "ti_v3_analytics_contract_invalid",
    "$.planOrigin",
  );
}

function canonicalEqual(left: unknown, right: unknown): boolean {
  const leftValue = serializeCanonicalValue(left);
  const rightValue = serializeCanonicalValue(right);
  return leftValue.ok && rightValue.ok &&
    leftValue.value.json === rightValue.value.json;
}

function stageCode(stage: CounterfactualSimulationReplayStage): string {
  return `ti_v3_counterfactual_simulation_${stage}_mismatch`;
}

function replayFailure(
  stage: CounterfactualSimulationReplayStage,
  path: string,
): ReplayFailureResult {
  const code = stageCode(stage);
  const boundedPath = path.length <=
      COUNTERFACTUAL_SIMULATION_REPLAY_LIMITS.maximumDiagnosticPathCodeUnits
    ? path
    : "$.replay";
  const diagnostic = Object.freeze({ code, path: boundedPath });
  return Object.freeze({
    ok: false,
    error: Object.freeze({
      code,
      stage,
      path: boundedPath,
      diagnosticCodes: Object.freeze([code]),
      diagnostics: Object.freeze([diagnostic]),
    }),
  });
}

function authorityIdentities(
  source: VerifiedTradeQueryDatasetSource,
  partition: AnalyticalPartitionReceipt,
  datasetReceipt: Readonly<{
    readonly snapshotDigest: CanonicalContentDigest;
    readonly receiptDigest: CanonicalContentDigest;
  }>,
  derivation: Readonly<{
    readonly derivationDigest: CanonicalContentDigest;
  }>,
): ReplayAuthorityIdentities {
  return Object.freeze({
    sourceKey: source.sourceKey,
    sourceVersion: source.sourceVersion,
    snapshotDigest: datasetReceipt.snapshotDigest,
    datasetReceiptDigest: datasetReceipt.receiptDigest,
    datasetDerivationDigest: derivation.derivationDigest,
    partitionDigest: partition.partitionDigest,
    ownerScope: Object.freeze([...partition.ownerScope]),
    accountScope: Object.freeze([...partition.accountScope]),
    currency: partition.currency,
  });
}

const ARTIFACT_DOMAINS: Readonly<Record<ArtifactKind, string>> = Object.freeze({
  dataset_receipt: "analytical_dataset",
  dataset_derivation_receipt: "analytical_dataset_derivation",
  partition_receipt: "analytical_partition",
  source_query_plan: "trade_query_plan",
  source_query_result: "trade_query_result",
  simulation_plan: "counterfactual_simulation_plan",
  simulation_result: "counterfactual_simulation_result",
  governed_preset: "counterfactual_simulation_preset",
});

function artifactReferences(
  authority: ReplayAuthorityIdentities,
  sourceQueryPlanDigest: CanonicalContentDigest,
  sourceQueryResultDigest: CanonicalContentDigest,
  simulationPlanDigest: CanonicalContentDigest,
  simulationResultDigest: CanonicalContentDigest,
  presetDigest: CanonicalContentDigest | null,
): readonly ReplayArtifactReference[] {
  const references: ReplayArtifactReference[] = [
    {
      artifactKind: "dataset_receipt",
      artifactDigest: authority.datasetReceiptDigest,
    },
    {
      artifactKind: "dataset_derivation_receipt",
      artifactDigest: authority.datasetDerivationDigest,
    },
    {
      artifactKind: "partition_receipt",
      artifactDigest: authority.partitionDigest,
    },
    {
      artifactKind: "source_query_plan",
      artifactDigest: sourceQueryPlanDigest,
    },
    {
      artifactKind: "source_query_result",
      artifactDigest: sourceQueryResultDigest,
    },
    {
      artifactKind: "simulation_plan",
      artifactDigest: simulationPlanDigest,
    },
    {
      artifactKind: "simulation_result",
      artifactDigest: simulationResultDigest,
    },
  ];
  if (presetDigest !== null) {
    references.push({
      artifactKind: "governed_preset",
      artifactDigest: presetDigest,
    });
  }
  return Object.freeze(references.map((reference) => Object.freeze(reference)));
}

interface VerifiedReplayArtifacts {
  readonly authority: ReplayAuthorityIdentities;
  readonly sourceResult: TradeQueryResult;
  readonly queryPlanDigest: CanonicalContentDigest;
  readonly simulationPlan: CounterfactualSimulationPlan;
  readonly simulationResult: CounterfactualSimulationResult;
  readonly preset: CompiledRepresentativeSimulationPreset | null;
}

function verifyArtifactsForIssue(
  args: CounterfactualSimulationReplayIssuanceArtifacts,
): ExactResult<VerifiedReplayArtifacts, AnalyticalContractFailure> {
  const gateway = openReadOnlyTradeQueryGateway(
    args.source,
    args.partitionReceipt,
  );
  if (!gateway.ok) return gateway;
  const sourceResult = verifyTradeQueryResultShape(
    args.sourceQueryResult,
    gateway.value.authority,
  );
  if (
    !sourceResult.ok ||
    !isVerifiedTradeQueryExecution(args.sourceQueryResult)
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_reference_mismatch",
      "$.sourceQueryResult",
    );
  }
  const queryPlan = verifyTradeQueryPlan(
    sourceResult.value.normalizedQueryPlan,
    gateway.value.authority,
  );
  if (!queryPlan.ok) return queryPlan;
  const simulationPlan = verifyCounterfactualSimulationPlan(
    args.simulationPlan,
    gateway.value.authority,
  );
  if (!simulationPlan.ok) return simulationPlan;
  if (
    simulationPlan.value.sourceQueryPlan.queryPlanDigest !==
      queryPlan.value.queryPlanDigest
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_reference_mismatch",
      "$.simulationPlan.sourceQueryPlan",
    );
  }
  if (simulationPlan.value.planOrigin !== args.planOrigin) {
    return contractFailure(
      "ti_v3_analytics_contract_reference_mismatch",
      "$.planOrigin",
    );
  }
  let preset: CompiledRepresentativeSimulationPreset | null = null;
  if (args.planOrigin === "governed_preset") {
    if (args.compiledPreset === undefined) {
      return contractFailure(
        "ti_v3_analytics_contract_invalid",
        "$.compiledPreset",
      );
    }
    const verifiedPreset = verifyCompiledExecutionOnlySimulationPreset(
      args.compiledPreset,
      gateway.value.authority,
    );
    if (!verifiedPreset.ok) return verifiedPreset;
    if (
      verifiedPreset.value.plan.planDigest !== simulationPlan.value.planDigest
    ) {
      return contractFailure(
        "ti_v3_analytics_contract_reference_mismatch",
        "$.compiledPreset.plan",
      );
    }
    preset = verifiedPreset.value;
  } else if (args.compiledPreset !== undefined) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.compiledPreset",
    );
  }
  const simulationResult = verifyAndReplayCounterfactualSimulationResult({
    source: args.source,
    partitionReceipt: args.partitionReceipt,
    sourceQueryResult: args.sourceQueryResult,
    persistedResult: args.persistedResult,
  });
  if (!simulationResult.ok) return simulationResult;
  if (
    simulationResult.value.plan.planDigest !== simulationPlan.value.planDigest
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_reference_mismatch",
      "$.persistedResult.plan",
    );
  }
  return {
    ok: true,
    value: Object.freeze({
      authority: authorityIdentities(
        args.source,
        gateway.value.authority.partitionReceipt,
        gateway.value.authority.datasetReceipt,
        gateway.value.authority.datasetDerivationReceipt,
      ),
      sourceResult: sourceResult.value,
      queryPlanDigest: queryPlan.value.queryPlanDigest,
      simulationPlan: simulationPlan.value,
      simulationResult: simulationResult.value,
      preset,
    }),
  };
}

export function issueCounterfactualSimulationReplayEnvelope(
  args: CounterfactualSimulationReplayIssuanceArtifacts,
): ExactResult<
  CounterfactualSimulationReplayEnvelope,
  AnalyticalContractFailure
> {
  const request = verifyIssuanceRequest(args);
  if (!request.ok) return request;
  const verified = verifyArtifactsForIssue(request.value);
  if (!verified.ok) return verified;
  const presetReference = verified.value.preset === null
    ? null
    : Object.freeze({
        schemaVersion: verified.value.preset.preset.schemaVersion,
        presetKey: verified.value.preset.preset.presetKey,
        presetVersion: verified.value.preset.preset.presetVersion,
        presetDigest: verified.value.preset.preset.presetDigest,
      });
  const addressed = finalizeContentAddressedAuthority(
    "counterfactual_simulation_replay_envelope",
    {
      schemaVersion: COUNTERFACTUAL_SIMULATION_REPLAY_ENVELOPE_VERSION,
      semanticVersion: COUNTERFACTUAL_SIMULATION_REPLAY_SEMANTIC_VERSION,
      replayPolicyKey:
        "ti_v3_counterfactual_simulation_reexecution_replay" as const,
      replayPolicyVersion: "v1" as const,
      sourceAuthority: verified.value.authority,
      sourceQueryPlanDigest: verified.value.queryPlanDigest,
      sourceQueryResultDigest: verified.value.sourceResult.resultDigest,
      simulationPlanDigest: verified.value.simulationPlan.planDigest,
      persistedSimulationResultDigest:
        verified.value.simulationResult.resultDigest,
      simulationResultSchemaVersion:
        verified.value.simulationResult.schemaVersion,
      stateDependencyPolicyVersion:
        verified.value.simulationPlan.policies.stateDependencyPolicy,
      executionPolicies: verified.value.simulationPlan.policies,
      declaredOutputBounds: verified.value.simulationPlan.limits,
      requiredSimulationAuthorityScope:
        "verified_ga1_a_query_result_and_execution_rows_v1" as const,
      planOrigin: request.value.planOrigin,
      governedPresetReference: presetReference,
      artifactReferences: artifactReferences(
        verified.value.authority,
        verified.value.queryPlanDigest,
        verified.value.sourceResult.resultDigest,
        verified.value.simulationPlan.planDigest,
        verified.value.simulationResult.resultDigest,
        presetReference?.presetDigest ?? null,
      ),
      replayBounds: Object.freeze({
        artifactReferenceLimit: "8" as const,
        diagnosticLimit: verified.value.simulationPlan.limits.diagnosticLimit,
        reconstructionEvidenceLimit: "0" as const,
        receiptCollectionLimit: "1" as const,
      }),
    },
    "envelopeDigest",
  );
  return addressed.ok
    ? {
        ok: true,
        value: addressed.value as CounterfactualSimulationReplayEnvelope,
      }
    : addressed;
}

const ENVELOPE_KEYS = Object.freeze([
  "schemaVersion",
  "semanticVersion",
  "replayPolicyKey",
  "replayPolicyVersion",
  "sourceAuthority",
  "sourceQueryPlanDigest",
  "sourceQueryResultDigest",
  "simulationPlanDigest",
  "persistedSimulationResultDigest",
  "simulationResultSchemaVersion",
  "stateDependencyPolicyVersion",
  "executionPolicies",
  "declaredOutputBounds",
  "requiredSimulationAuthorityScope",
  "planOrigin",
  "governedPresetReference",
  "artifactReferences",
  "replayBounds",
  "envelopeDigest",
]);

function verifyAuthorityShape(
  input: unknown,
  path: string,
): ExactResult<ReplayAuthorityIdentities, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "sourceKey",
    "sourceVersion",
    "snapshotDigest",
    "datasetReceiptDigest",
    "datasetDerivationDigest",
    "partitionDigest",
    "ownerScope",
    "accountScope",
    "currency",
  ], [], path);
  if (!record.ok) return record;
  const sourceKey = validateContractKey(
    record.value.sourceKey,
    `${path}.sourceKey`,
  );
  if (!sourceKey.ok) return sourceKey;
  const sourceVersion = validateContractKey(
    record.value.sourceVersion,
    `${path}.sourceVersion`,
  );
  if (!sourceVersion.ok) return sourceVersion;
  if (
    !Array.isArray(record.value.ownerScope) ||
    !Array.isArray(record.value.accountScope) ||
    record.value.ownerScope.length >
      COUNTERFACTUAL_SIMULATION_REPLAY_LIMITS.maximumAuthorityScopeKeys ||
    record.value.accountScope.length >
      COUNTERFACTUAL_SIMULATION_REPLAY_LIMITS.maximumAuthorityScopeKeys
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_oversized",
      `${path}.ownerScope`,
    );
  }
  for (const [key, values] of [
    ["ownerScope", record.value.ownerScope],
    ["accountScope", record.value.accountScope],
  ] as const) {
    for (let index = 0; index < values.length; index += 1) {
      const value = validateContractKey(
        values[index],
        `${path}.${key}[${index}]`,
      );
      if (!value.ok) return value;
    }
  }
  const digests = [
    ["snapshotDigest", "analysis_snapshot"],
    ["datasetReceiptDigest", "analytical_dataset"],
    ["datasetDerivationDigest", "analytical_dataset_derivation"],
    ["partitionDigest", "analytical_partition"],
  ] as const;
  for (const [key, domain] of digests) {
    const digest = validateClaimedDigest(
      record.value[key],
      `${path}.${key}`,
      domain,
    );
    if (!digest.ok) return digest;
  }
  if (
    typeof record.value.currency !== "string" ||
    record.value.currency.length < 1 ||
    record.value.currency.length > 16
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      `${path}.currency`,
    );
  }
  return {
    ok: true,
    value: record.value as unknown as ReplayAuthorityIdentities,
  };
}

function verifyEnvelopeShape(
  input: unknown,
): ExactResult<
  CounterfactualSimulationReplayEnvelope,
  AnalyticalContractFailure
> {
  const record = validateContractRecord(input, ENVELOPE_KEYS);
  if (!record.ok) return record;
  if (
    record.value.schemaVersion !==
      COUNTERFACTUAL_SIMULATION_REPLAY_ENVELOPE_VERSION ||
    record.value.semanticVersion !==
      COUNTERFACTUAL_SIMULATION_REPLAY_SEMANTIC_VERSION ||
    record.value.replayPolicyKey !==
      "ti_v3_counterfactual_simulation_reexecution_replay" ||
    record.value.replayPolicyVersion !== "v1" ||
    record.value.simulationResultSchemaVersion !==
      COUNTERFACTUAL_SIMULATION_RESULT_VERSION ||
    record.value.stateDependencyPolicyVersion !==
      RULE_STATE_DEPENDENCY_POLICY_VERSION ||
    record.value.requiredSimulationAuthorityScope !==
      "verified_ga1_a_query_result_and_execution_rows_v1"
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.schemaVersion",
    );
  }
  const authority = verifyAuthorityShape(
    record.value.sourceAuthority,
    "$.sourceAuthority",
  );
  if (!authority.ok) return authority;
  const digestFields = [
    ["sourceQueryPlanDigest", "trade_query_plan"],
    ["sourceQueryResultDigest", "trade_query_result"],
    ["simulationPlanDigest", "counterfactual_simulation_plan"],
    [
      "persistedSimulationResultDigest",
      "counterfactual_simulation_result",
    ],
  ] as const;
  for (const [key, domain] of digestFields) {
    const digest = validateClaimedDigest(
      record.value[key],
      `$.${key}`,
      domain,
    );
    if (!digest.ok) return digest;
  }
  const policy = validateContractRecord(record.value.executionPolicies, [
    "chronologicalOrder",
    "actualEntryPolicy",
    "simulatedEntryPolicy",
    "positionSizingPolicy",
    "chargesPolicy",
    "slippageLiquidityPolicy",
    "sessionResetPolicy",
    "timestampTiePolicy",
    "missingDataPolicy",
    "limitationsPolicy",
    "stateDependencyPolicy",
  ], [], "$.executionPolicies");
  if (!policy.ok) return policy;
  const outputBounds = validateContractRecord(
    record.value.declaredOutputBounds,
    [
      "sourceRowLimit",
      "affectedTradeLimit",
      "sessionSummaryLimit",
      "evidenceTradeLimit",
      "diagnosticLimit",
    ],
    [],
    "$.declaredOutputBounds",
  );
  if (!outputBounds.ok) return outputBounds;
  for (const key of [
    "sourceRowLimit",
    "affectedTradeLimit",
    "sessionSummaryLimit",
    "evidenceTradeLimit",
    "diagnosticLimit",
  ] as const) {
    const count = validateCanonicalCount(
      outputBounds.value[key],
      `$.declaredOutputBounds.${key}`,
    );
    if (!count.ok) return count;
  }
  const maximumByBound = {
    sourceRowLimit: COUNTERFACTUAL_SIMULATION_LIMITS.maximumSourceRows,
    affectedTradeLimit:
      COUNTERFACTUAL_SIMULATION_LIMITS.maximumAffectedTrades,
    sessionSummaryLimit:
      COUNTERFACTUAL_SIMULATION_LIMITS.maximumSessionSummaries,
    evidenceTradeLimit:
      COUNTERFACTUAL_SIMULATION_LIMITS.maximumEvidenceTrades,
    diagnosticLimit: COUNTERFACTUAL_SIMULATION_LIMITS.maximumDiagnostics,
  } as const;
  for (const key of Object.keys(maximumByBound) as
    (keyof typeof maximumByBound)[]) {
    if (
      BigInt(outputBounds.value[key] as string) <
        BigInt(1) ||
      BigInt(outputBounds.value[key] as string) >
        BigInt(maximumByBound[key])
    ) {
      return contractFailure(
        "ti_v3_analytics_contract_oversized",
        `$.declaredOutputBounds.${key}`,
      );
    }
  }
  const replayBounds = validateContractRecord(record.value.replayBounds, [
    "artifactReferenceLimit",
    "diagnosticLimit",
    "reconstructionEvidenceLimit",
    "receiptCollectionLimit",
  ], [], "$.replayBounds");
  if (
    !replayBounds.ok ||
    replayBounds.value.artifactReferenceLimit !== "8" ||
    replayBounds.value.reconstructionEvidenceLimit !== "0" ||
    replayBounds.value.receiptCollectionLimit !== "1" ||
    replayBounds.value.diagnosticLimit !== outputBounds.value.diagnosticLimit
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.replayBounds",
    );
  }
  if (
    !Array.isArray(record.value.artifactReferences) ||
    record.value.artifactReferences.length >
      COUNTERFACTUAL_SIMULATION_REPLAY_LIMITS.maximumArtifactReferences ||
    record.value.artifactReferences.length < 7
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_oversized",
      "$.artifactReferences",
    );
  }
  for (
    let index = 0;
    index < record.value.artifactReferences.length;
    index += 1
  ) {
    const reference = validateContractRecord(
      record.value.artifactReferences[index],
      ["artifactKind", "artifactDigest"],
      [],
      `$.artifactReferences[${index}]`,
    );
    if (
      !reference.ok ||
      typeof reference.value.artifactKind !== "string" ||
      !(reference.value.artifactKind in ARTIFACT_DOMAINS)
    ) {
      return contractFailure(
        "ti_v3_analytics_contract_invalid",
        `$.artifactReferences[${index}]`,
      );
    }
    const digest = validateClaimedDigest(
      reference.value.artifactDigest,
      `$.artifactReferences[${index}].artifactDigest`,
      ARTIFACT_DOMAINS[reference.value.artifactKind as ArtifactKind],
    );
    if (!digest.ok) return digest;
  }
  if (record.value.governedPresetReference !== null) {
    const preset = validateContractRecord(
      record.value.governedPresetReference,
      ["schemaVersion", "presetKey", "presetVersion", "presetDigest"],
      [],
      "$.governedPresetReference",
    );
    if (
      !preset.ok ||
      preset.value.schemaVersion !==
        EXECUTION_ONLY_SIMULATION_PRESET_VERSION ||
      preset.value.presetVersion !== "v1" ||
      typeof preset.value.presetKey !== "string"
    ) {
      return contractFailure(
        "ti_v3_analytics_contract_invalid",
        "$.governedPresetReference",
      );
    }
    const digest = validateClaimedDigest(
      preset.value.presetDigest,
      "$.governedPresetReference.presetDigest",
      "counterfactual_simulation_preset",
    );
    if (!digest.ok) return digest;
  }
  if (
    (record.value.planOrigin !== "generic_plan" &&
      record.value.planOrigin !== "governed_preset") ||
    (record.value.planOrigin === "generic_plan" &&
      record.value.governedPresetReference !== null) ||
    (record.value.planOrigin === "governed_preset" &&
      record.value.governedPresetReference === null)
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.planOrigin",
    );
  }
  const expectedArtifactReferenceCount =
    record.value.planOrigin === "generic_plan" ? 7 : 8;
  if (record.value.artifactReferences.length !== expectedArtifactReferenceCount) {
    return contractFailure(
      "ti_v3_analytics_contract_reference_mismatch",
      "$.artifactReferences",
    );
  }
  const expectedReferences = artifactReferences(
    authority.value,
    record.value.sourceQueryPlanDigest as CanonicalContentDigest,
    record.value.sourceQueryResultDigest as CanonicalContentDigest,
    record.value.simulationPlanDigest as CanonicalContentDigest,
    record.value.persistedSimulationResultDigest as CanonicalContentDigest,
    record.value.planOrigin === "generic_plan"
      ? null
      : (
          record.value.governedPresetReference as GovernedPresetReference
        ).presetDigest,
  );
  if (!canonicalEqual(record.value.artifactReferences, expectedReferences)) {
    return contractFailure(
      "ti_v3_analytics_contract_reference_mismatch",
      "$.artifactReferences",
    );
  }
  const envelopeDigest = validateClaimedDigest(
    record.value.envelopeDigest,
    "$.envelopeDigest",
    "counterfactual_simulation_replay_envelope",
  );
  if (!envelopeDigest.ok) return envelopeDigest;
  const { envelopeDigest: _envelopeDigest, ...body } = record.value;
  void _envelopeDigest;
  const rebuilt = finalizeContentAddressedAuthority(
    "counterfactual_simulation_replay_envelope",
    body,
    "envelopeDigest",
  );
  if (
    !rebuilt.ok ||
    rebuilt.value.envelopeDigest !== envelopeDigest.value
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_digest_mismatch",
      "$.envelopeDigest",
    );
  }
  return {
    ok: true,
    value: rebuilt.value as unknown as CounterfactualSimulationReplayEnvelope,
  };
}

function buildReceipt(
  envelope: CounterfactualSimulationReplayEnvelope,
  authority: ReplayAuthorityIdentities,
  queryPlanDigest: CanonicalContentDigest,
  simulationPlanDigest: CanonicalContentDigest,
  simulationResultDigest: CanonicalContentDigest,
): ExactResult<
  CounterfactualSimulationReplayReceipt,
  AnalyticalContractFailure
> {
  const addressed = finalizeContentAddressedAuthority(
    "counterfactual_simulation_replay_receipt",
    {
      schemaVersion: COUNTERFACTUAL_SIMULATION_REPLAY_RECEIPT_VERSION,
      semanticVersion: COUNTERFACTUAL_SIMULATION_REPLAY_SEMANTIC_VERSION,
      replayEnvelopeDigest: envelope.envelopeDigest,
      suppliedAuthorityIdentities: authority,
      reconstructedQueryPlanDigest: queryPlanDigest,
      reconstructedSimulationPlanDigest: simulationPlanDigest,
      reconstructedSimulationResultDigest: simulationResultDigest,
      expectedPersistedResultDigest:
        envelope.persistedSimulationResultDigest,
      replayVerificationStatus: "verified" as const,
      mismatchStage: null,
      diagnosticCodes: Object.freeze([] as string[]),
      diagnostics: Object.freeze(
        [] as CounterfactualSimulationReplayDiagnostic[],
      ),
      diagnosticLimit: envelope.replayBounds.diagnosticLimit,
    },
    "receiptDigest",
  );
  return addressed.ok
    ? {
        ok: true,
        value: addressed.value as CounterfactualSimulationReplayReceipt,
      }
    : addressed;
}

export function replayCounterfactualSimulationEnvelope(
  args: CounterfactualSimulationReplayArtifacts & Readonly<{
    readonly envelope: unknown;
    readonly persistedReceipt?: unknown;
  }>,
): Readonly<{
  readonly ok: true;
  readonly value: Readonly<{
    readonly result: CounterfactualSimulationResult;
    readonly receipt: CounterfactualSimulationReplayReceipt;
  }>;
}> | ReplayFailureResult {
  const envelope = verifyEnvelopeShape(args.envelope);
  if (!envelope.ok) {
    return replayFailure(
      "replay_envelope_contract",
      envelope.error.path,
    );
  }
  const gateway = openReadOnlyTradeQueryGateway(
    args.source,
    args.partitionReceipt,
  );
  if (!gateway.ok) {
    return replayFailure(
      "dataset_partition_authority",
      gateway.error.path,
    );
  }
  const authority = authorityIdentities(
    args.source,
    gateway.value.authority.partitionReceipt,
    gateway.value.authority.datasetReceipt,
    gateway.value.authority.datasetDerivationReceipt,
  );
  if (!canonicalEqual(authority, envelope.value.sourceAuthority)) {
    return replayFailure(
      "dataset_partition_authority",
      "$.sourceAuthority",
    );
  }
  const sourceResult = verifyTradeQueryResultShape(
    args.sourceQueryResult,
    gateway.value.authority,
  );
  if (
    !sourceResult.ok ||
    !isVerifiedTradeQueryExecution(args.sourceQueryResult) ||
    sourceResult.value.resultDigest !==
      envelope.value.sourceQueryResultDigest
  ) {
    return replayFailure(
      "source_query_result_authority",
      sourceResult.ok ? "$.sourceQueryResult" : sourceResult.error.path,
    );
  }
  const queryPlan = verifyTradeQueryPlan(
    sourceResult.value.normalizedQueryPlan,
    gateway.value.authority,
  );
  if (
    !queryPlan.ok ||
    queryPlan.value.queryPlanDigest !==
      envelope.value.sourceQueryPlanDigest
  ) {
    return replayFailure(
      "source_query_plan_reconstruction",
      queryPlan.ok ? "$.sourceQueryPlanDigest" : queryPlan.error.path,
    );
  }
  const simulationPlan = verifyCounterfactualSimulationPlan(
    args.simulationPlan,
    gateway.value.authority,
  );
  if (
    !simulationPlan.ok ||
    simulationPlan.value.planDigest !==
      envelope.value.simulationPlanDigest ||
    simulationPlan.value.planOrigin !== envelope.value.planOrigin ||
    simulationPlan.value.sourceQueryPlan.queryPlanDigest !==
      queryPlan.value.queryPlanDigest ||
    !canonicalEqual(
      simulationPlan.value.policies,
      envelope.value.executionPolicies,
    ) ||
    !canonicalEqual(
      simulationPlan.value.limits,
      envelope.value.declaredOutputBounds,
    ) ||
    simulationPlan.value.policies.stateDependencyPolicy !==
      envelope.value.stateDependencyPolicyVersion
  ) {
    return replayFailure(
      "simulation_plan_reconstruction",
      simulationPlan.ok ? "$.simulationPlanDigest" : simulationPlan.error.path,
    );
  }
  if (envelope.value.planOrigin === "generic_plan") {
    if (args.compiledPreset !== undefined) {
      return replayFailure(
        "preset_reconstruction",
        "$.compiledPreset",
      );
    }
  } else {
    if (envelope.value.governedPresetReference === null) {
      return replayFailure("preset_reconstruction", "$.governedPresetReference");
    }
    const preset = verifyCompiledExecutionOnlySimulationPreset(
      args.compiledPreset,
      gateway.value.authority,
    );
    if (
      !preset.ok ||
      preset.value.plan.planDigest !== simulationPlan.value.planDigest ||
      preset.value.preset.presetDigest !==
        envelope.value.governedPresetReference.presetDigest ||
      preset.value.preset.presetKey !==
        envelope.value.governedPresetReference.presetKey
    ) {
      return replayFailure(
        "preset_reconstruction",
        preset.ok ? "$.governedPresetReference" : preset.error.path,
      );
    }
  }
  const executed = executeCounterfactualSimulation({
    source: args.source,
    partitionReceipt: args.partitionReceipt,
    sourceQueryResult: args.sourceQueryResult,
    simulationPlan: simulationPlan.value,
  });
  if (!executed.ok) {
    return replayFailure(
      "simulation_execution",
      executed.error.path,
    );
  }
  const reconstructed = verifyAndReplayCounterfactualSimulationResult({
    source: args.source,
    partitionReceipt: args.partitionReceipt,
    sourceQueryResult: args.sourceQueryResult,
    persistedResult: args.persistedResult,
  });
  if (!reconstructed.ok) {
    return replayFailure(
      "result_reconstruction",
      reconstructed.error.path,
    );
  }
  if (
    executed.value.resultDigest !== reconstructed.value.resultDigest ||
    reconstructed.value.resultDigest !==
      envelope.value.persistedSimulationResultDigest
  ) {
    return replayFailure(
      "expected_result_digest",
      "$.persistedSimulationResultDigest",
    );
  }
  const receipt = buildReceipt(
    envelope.value,
    authority,
    queryPlan.value.queryPlanDigest,
    simulationPlan.value.planDigest,
    reconstructed.value.resultDigest,
  );
  if (!receipt.ok) {
    return replayFailure(
      "replay_receipt_verification",
      receipt.error.path,
    );
  }
  if (args.persistedReceipt !== undefined) {
    const persistedReceipt = verifyCounterfactualSimulationReplayReceipt({
      envelope: envelope.value,
      receipt: args.persistedReceipt,
    });
    if (
      !persistedReceipt.ok ||
      persistedReceipt.value.receiptDigest !== receipt.value.receiptDigest
    ) {
      return replayFailure(
        "replay_receipt_verification",
        persistedReceipt.ok
          ? "$.receipt.receiptDigest"
          : persistedReceipt.error.path,
      );
    }
  }
  return Object.freeze({
    ok: true,
    value: Object.freeze({
      result: reconstructed.value,
      receipt: receipt.value,
    }),
  });
}

const RECEIPT_KEYS = Object.freeze([
  "schemaVersion",
  "semanticVersion",
  "replayEnvelopeDigest",
  "suppliedAuthorityIdentities",
  "reconstructedQueryPlanDigest",
  "reconstructedSimulationPlanDigest",
  "reconstructedSimulationResultDigest",
  "expectedPersistedResultDigest",
  "replayVerificationStatus",
  "mismatchStage",
  "diagnosticCodes",
  "diagnostics",
  "diagnosticLimit",
  "receiptDigest",
]);

export function verifyCounterfactualSimulationReplayReceipt(args: Readonly<{
  readonly envelope: unknown;
  readonly receipt: unknown;
}>): ExactResult<
  CounterfactualSimulationReplayReceipt,
  AnalyticalContractFailure
> {
  const envelope = verifyEnvelopeShape(args.envelope);
  if (!envelope.ok) return envelope;
  const record = validateContractRecord(args.receipt, RECEIPT_KEYS);
  if (!record.ok) return record;
  if (
    record.value.schemaVersion !==
      COUNTERFACTUAL_SIMULATION_REPLAY_RECEIPT_VERSION ||
    record.value.semanticVersion !==
      COUNTERFACTUAL_SIMULATION_REPLAY_SEMANTIC_VERSION ||
    record.value.replayVerificationStatus !== "verified" ||
    record.value.mismatchStage !== null ||
    record.value.diagnosticLimit !== envelope.value.replayBounds.diagnosticLimit
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.receipt.schemaVersion",
    );
  }
  const authority = verifyAuthorityShape(
    record.value.suppliedAuthorityIdentities,
    "$.receipt.suppliedAuthorityIdentities",
  );
  if (!authority.ok) return authority;
  const limit = BigInt(envelope.value.replayBounds.diagnosticLimit);
  if (
    !Array.isArray(record.value.diagnosticCodes) ||
    !Array.isArray(record.value.diagnostics) ||
    BigInt(record.value.diagnosticCodes.length) > limit ||
    BigInt(record.value.diagnostics.length) > limit ||
    record.value.diagnosticCodes.length !== 0 ||
    record.value.diagnostics.length !== 0
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_oversized",
      "$.receipt.diagnostics",
    );
  }
  const digestFields = [
    ["replayEnvelopeDigest", "counterfactual_simulation_replay_envelope"],
    ["reconstructedQueryPlanDigest", "trade_query_plan"],
    ["reconstructedSimulationPlanDigest", "counterfactual_simulation_plan"],
    [
      "reconstructedSimulationResultDigest",
      "counterfactual_simulation_result",
    ],
    ["expectedPersistedResultDigest", "counterfactual_simulation_result"],
  ] as const;
  for (const [key, domain] of digestFields) {
    const digest = validateClaimedDigest(
      record.value[key],
      `$.receipt.${key}`,
      domain,
    );
    if (!digest.ok) return digest;
  }
  if (
    record.value.replayEnvelopeDigest !== envelope.value.envelopeDigest ||
    !canonicalEqual(
      record.value.suppliedAuthorityIdentities,
      envelope.value.sourceAuthority,
    ) ||
    record.value.reconstructedQueryPlanDigest !==
      envelope.value.sourceQueryPlanDigest ||
    record.value.reconstructedSimulationPlanDigest !==
      envelope.value.simulationPlanDigest ||
    record.value.reconstructedSimulationResultDigest !==
      envelope.value.persistedSimulationResultDigest ||
    record.value.expectedPersistedResultDigest !==
      envelope.value.persistedSimulationResultDigest
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_reference_mismatch",
      "$.receipt",
    );
  }
  const receiptDigest = validateClaimedDigest(
    record.value.receiptDigest,
    "$.receipt.receiptDigest",
    "counterfactual_simulation_replay_receipt",
  );
  if (!receiptDigest.ok) return receiptDigest;
  const { receiptDigest: _receiptDigest, ...body } = record.value;
  void _receiptDigest;
  const rebuilt = finalizeContentAddressedAuthority(
    "counterfactual_simulation_replay_receipt",
    body,
    "receiptDigest",
  );
  if (
    !rebuilt.ok ||
    rebuilt.value.receiptDigest !== receiptDigest.value
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_digest_mismatch",
      "$.receipt.receiptDigest",
    );
  }
  return {
    ok: true,
    value: rebuilt.value as unknown as CounterfactualSimulationReplayReceipt,
  };
}
