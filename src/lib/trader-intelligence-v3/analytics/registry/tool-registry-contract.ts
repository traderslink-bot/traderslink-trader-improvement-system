import { compareUnicodeCodePoints } from "../../domain/canonical";
import { parseCurrencyCode, type CurrencyCode, type ExactResult } from "../../domain/exact";
import type { CanonicalContentDigest } from "../../domain/identity";
import {
  GA0_B1_CONTRACT_LIMITS,
  contractFailure,
  finalizeContentAddressedAuthority,
  validateClaimedDigest,
  validateContractKey,
  validateContractRecord,
  validateKeyArray,
  validateTimezone,
  type AnalyticalContractFailure,
} from "../contracts/contract-validation";

export const TOOL_REGISTRY_ENTRY_VERSION = "ti_v3_tool_registry_entry_v1" as const;
export const TOOL_REGISTRY_SNAPSHOT_VERSION = "ti_v3_tool_registry_snapshot_v1" as const;
export const NORMALIZED_ANALYSIS_ARGUMENTS_VERSION = "ti_v3_normalized_analysis_arguments_v1" as const;

export interface NormalizedAnalysisArguments {
  readonly schemaVersion: typeof NORMALIZED_ANALYSIS_ARGUMENTS_VERSION;
  readonly argumentSchemaDigest: CanonicalContentDigest;
  readonly values: Readonly<Record<string, unknown>>;
  readonly argumentsDigest: CanonicalContentDigest;
}

export interface ToolRegistryEntry {
  readonly schemaVersion: typeof TOOL_REGISTRY_ENTRY_VERSION;
  readonly toolKey: string;
  readonly toolVersion: string;
  readonly descriptionCode: string;
  readonly requiredEligibilityCapability: string;
  readonly argumentSchemaDigest: CanonicalContentDigest;
  readonly requiredRowFields: readonly string[];
  readonly outputContracts: readonly string[];
  readonly blockedArtifactPolicy: "diagnostics_only" | "declared_artifacts_optional";
  readonly evidencePolicyKey: string;
  readonly evidencePolicyVersion: string;
  readonly toolPolicyKey: string;
  readonly toolPolicyVersion: string;
  readonly minimumSamplePolicyState:
    | "deferred_to_tool_slice"
    | "versioned_tool_policy";
  readonly optionalOutputContractsWhenLimited: readonly string[];
  readonly supportedCurrencies: readonly CurrencyCode[];
  readonly supportedTimezones: readonly string[];
  readonly deprecationState: "active_contract" | "deprecated_contract";
  readonly focusedTestKeys: readonly string[];
  readonly executableState:
    | "contract_only_no_runner"
    | "tool_specific_deterministic_executor";
  readonly entryDigest: CanonicalContentDigest;
}

export interface ToolRegistrySnapshot {
  readonly schemaVersion: typeof TOOL_REGISTRY_SNAPSHOT_VERSION;
  readonly registryKey: string;
  readonly registryVersion: string;
  readonly entries: readonly ToolRegistryEntry[];
  readonly registryDigest: CanonicalContentDigest;
}

export function buildToolRegistryEntry(input: unknown): ExactResult<ToolRegistryEntry, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion", "toolKey", "toolVersion", "descriptionCode",
    "requiredEligibilityCapability", "argumentSchemaDigest", "requiredRowFields",
    "outputContracts", "blockedArtifactPolicy", "evidencePolicyKey", "evidencePolicyVersion",
    "toolPolicyKey", "toolPolicyVersion",
    "minimumSamplePolicyState", "supportedCurrencies", "supportedTimezones",
    "deprecationState", "focusedTestKeys", "executableState",
  ], ["optionalOutputContractsWhenLimited"]);
  if (!record.ok) return record;
  if (record.value.schemaVersion !== TOOL_REGISTRY_ENTRY_VERSION) return contractFailure("ti_v3_analytics_contract_invalid", "$.schemaVersion");
  const keyNames = ["toolKey", "toolVersion", "descriptionCode", "requiredEligibilityCapability", "evidencePolicyKey", "evidencePolicyVersion", "toolPolicyKey", "toolPolicyVersion"] as const;
  const parsed = new Map<string, string>();
  for (const key of keyNames) { const value = validateContractKey(record.value[key], `$.${key}`); if (!value.ok) return value; parsed.set(key, value.value); }
  const schemaDigest = validateClaimedDigest(record.value.argumentSchemaDigest, "$.argumentSchemaDigest", "canonical_content"); if (!schemaDigest.ok) return schemaDigest;
  const rowFields = validateKeyArray(record.value.requiredRowFields, "$.requiredRowFields", { maximumItems: 128 }); const outputs = validateKeyArray(record.value.outputContracts, "$.outputContracts", { maximumItems: 32 }); const testKeys = validateKeyArray(record.value.focusedTestKeys, "$.focusedTestKeys", { maximumItems: 128 });
  if (!rowFields.ok) return rowFields; if (!outputs.ok) return outputs; if (!testKeys.ok) return testKeys;
  const allowedOutputs = new Set([
    "exact_table_v1", "validated_claim_v1", "chart_ready_series_v1",
    "analytical_evidence_bundle_v1",
  ]);
  if (
    outputs.value.length === 0 ||
    outputs.value.some((output) => !allowedOutputs.has(output)) ||
    (
      record.value.blockedArtifactPolicy !== "diagnostics_only" &&
      record.value.blockedArtifactPolicy !== "declared_artifacts_optional"
    )
  ) return contractFailure("ti_v3_analytics_contract_invalid", "$.outputContracts");
  if (
    record.value.minimumSamplePolicyState !== "deferred_to_tool_slice" &&
    record.value.minimumSamplePolicyState !== "versioned_tool_policy"
  ) return contractFailure("ti_v3_analytics_contract_invalid", "$.minimumSamplePolicyState");
  const optionalOutputs = validateKeyArray(
    record.value.optionalOutputContractsWhenLimited ?? [],
    "$.optionalOutputContractsWhenLimited",
    { maximumItems: 32 },
  );
  if (
    !optionalOutputs.ok ||
    optionalOutputs.value.some((output) => !outputs.value.includes(output))
  ) {
    return optionalOutputs.ok
      ? contractFailure(
          "ti_v3_analytics_contract_reference_mismatch",
          "$.optionalOutputContractsWhenLimited",
        )
      : optionalOutputs;
  }
  if (!Array.isArray(record.value.supportedCurrencies) || record.value.supportedCurrencies.length > 32) return contractFailure("ti_v3_analytics_contract_invalid", "$.supportedCurrencies");
  const currencies: CurrencyCode[] = [];
  for (let index = 0; index < record.value.supportedCurrencies.length; index += 1) { const currency = parseCurrencyCode(record.value.supportedCurrencies[index]); if (!currency.ok) return contractFailure("ti_v3_analytics_contract_invalid", `$.supportedCurrencies[${index}]`); currencies.push(currency.value); }
  if (new Set(currencies).size !== currencies.length) return contractFailure("ti_v3_analytics_contract_duplicate_identity", "$.supportedCurrencies");
  if (!Array.isArray(record.value.supportedTimezones) || record.value.supportedTimezones.length > 32) return contractFailure("ti_v3_analytics_contract_invalid", "$.supportedTimezones");
  const timezones: string[] = [];
  for (let index = 0; index < record.value.supportedTimezones.length; index += 1) { const timezone = validateTimezone(record.value.supportedTimezones[index], `$.supportedTimezones[${index}]`); if (!timezone.ok) return timezone; timezones.push(timezone.value); }
  if (new Set(timezones).size !== timezones.length) return contractFailure("ti_v3_analytics_contract_duplicate_identity", "$.supportedTimezones");
  if (record.value.deprecationState !== "active_contract" && record.value.deprecationState !== "deprecated_contract") return contractFailure("ti_v3_analytics_contract_invalid", "$.deprecationState");
  if (
    record.value.executableState !== "contract_only_no_runner" &&
    record.value.executableState !== "tool_specific_deterministic_executor"
  ) return contractFailure("ti_v3_analytics_contract_invalid", "$.executableState");
  return finalizeContentAddressedAuthority("tool_registry_entry", {
    schemaVersion: TOOL_REGISTRY_ENTRY_VERSION,
    toolKey: parsed.get("toolKey") as string, toolVersion: parsed.get("toolVersion") as string,
    descriptionCode: parsed.get("descriptionCode") as string,
    requiredEligibilityCapability: parsed.get("requiredEligibilityCapability") as string,
    argumentSchemaDigest: schemaDigest.value, requiredRowFields: rowFields.value,
    outputContracts: outputs.value,
    blockedArtifactPolicy: record.value.blockedArtifactPolicy,
    evidencePolicyKey: parsed.get("evidencePolicyKey") as string,
    evidencePolicyVersion: parsed.get("evidencePolicyVersion") as string,
    toolPolicyKey: parsed.get("toolPolicyKey") as string,
    toolPolicyVersion: parsed.get("toolPolicyVersion") as string,
    minimumSamplePolicyState: record.value.minimumSamplePolicyState,
    optionalOutputContractsWhenLimited: optionalOutputs.value,
    supportedCurrencies: Object.freeze([...currencies].sort(compareUnicodeCodePoints)),
    supportedTimezones: Object.freeze([...timezones].sort(compareUnicodeCodePoints)),
    deprecationState: record.value.deprecationState, focusedTestKeys: testKeys.value,
    executableState: record.value.executableState,
  }, "entryDigest") as ExactResult<ToolRegistryEntry, AnalyticalContractFailure>;
}

export function verifyToolRegistryEntry(input: unknown): ExactResult<ToolRegistryEntry, AnalyticalContractFailure> {
  const record = validateContractRecord(input, ["schemaVersion", "toolKey", "toolVersion", "descriptionCode", "requiredEligibilityCapability", "argumentSchemaDigest", "requiredRowFields", "outputContracts", "blockedArtifactPolicy", "evidencePolicyKey", "evidencePolicyVersion", "toolPolicyKey", "toolPolicyVersion", "minimumSamplePolicyState", "optionalOutputContractsWhenLimited", "supportedCurrencies", "supportedTimezones", "deprecationState", "focusedTestKeys", "executableState", "entryDigest"]);
  if (!record.ok) return record;
  const digest = validateClaimedDigest(record.value.entryDigest, "$.entryDigest", "tool_registry_entry"); if (!digest.ok) return digest;
  const { entryDigest: _entryDigest, ...content } = record.value; void _entryDigest;
  const rebuilt = buildToolRegistryEntry(content); if (!rebuilt.ok || rebuilt.value.entryDigest !== digest.value) return contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.entryDigest");
  return rebuilt;
}

export function buildToolRegistrySnapshot(input: unknown): ExactResult<ToolRegistrySnapshot, AnalyticalContractFailure> {
  const record = validateContractRecord(input, ["schemaVersion", "registryKey", "registryVersion", "entries"]); if (!record.ok) return record;
  if (record.value.schemaVersion !== TOOL_REGISTRY_SNAPSHOT_VERSION) return contractFailure("ti_v3_analytics_contract_invalid", "$.schemaVersion");
  const key = validateContractKey(record.value.registryKey, "$.registryKey"); const version = validateContractKey(record.value.registryVersion, "$.registryVersion"); if (!key.ok) return key; if (!version.ok) return version;
  if (!Array.isArray(record.value.entries) || record.value.entries.length > GA0_B1_CONTRACT_LIMITS.maximumRegistryEntries) return contractFailure("ti_v3_analytics_contract_oversized", "$.entries");
  const entries: ToolRegistryEntry[] = [];
  for (let index = 0; index < record.value.entries.length; index += 1) { const entry = verifyToolRegistryEntry(record.value.entries[index]); if (!entry.ok) return contractFailure(entry.error.code, `$.entries[${index}]${entry.error.path.slice(1)}`); entries.push(entry.value); }
  const identities = entries.map((entry) => `${entry.toolKey}:${entry.toolVersion}`); if (new Set(identities).size !== identities.length || new Set(entries.map((entry) => entry.entryDigest)).size !== entries.length) return contractFailure("ti_v3_analytics_contract_duplicate_identity", "$.entries");
  entries.sort((left, right) => compareUnicodeCodePoints(`${left.toolKey}:${left.toolVersion}`, `${right.toolKey}:${right.toolVersion}`));
  return finalizeContentAddressedAuthority("tool_registry_snapshot", { schemaVersion: TOOL_REGISTRY_SNAPSHOT_VERSION, registryKey: key.value, registryVersion: version.value, entries }, "registryDigest") as ExactResult<ToolRegistrySnapshot, AnalyticalContractFailure>;
}

export function verifyToolRegistrySnapshot(input: unknown): ExactResult<ToolRegistrySnapshot, AnalyticalContractFailure> {
  const record = validateContractRecord(input, ["schemaVersion", "registryKey", "registryVersion", "entries", "registryDigest"]); if (!record.ok) return record;
  const digest = validateClaimedDigest(record.value.registryDigest, "$.registryDigest", "tool_registry_snapshot"); if (!digest.ok) return digest;
  const { registryDigest: _registryDigest, ...content } = record.value; void _registryDigest;
  const rebuilt = buildToolRegistrySnapshot(content); if (!rebuilt.ok || rebuilt.value.registryDigest !== digest.value) return contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.registryDigest");
  return rebuilt;
}

export function buildNormalizedAnalysisArguments(
  input: unknown,
): ExactResult<NormalizedAnalysisArguments, AnalyticalContractFailure> {
  const record = validateContractRecord(input, ["schemaVersion", "argumentSchemaDigest", "values"]);
  if (!record.ok) return record;
  if (record.value.schemaVersion !== NORMALIZED_ANALYSIS_ARGUMENTS_VERSION) return contractFailure("ti_v3_analytics_contract_invalid", "$.schemaVersion");
  const schemaDigest = validateClaimedDigest(record.value.argumentSchemaDigest, "$.argumentSchemaDigest", "canonical_content");
  if (!schemaDigest.ok) return schemaDigest;
  if (typeof record.value.values !== "object" || record.value.values === null || Array.isArray(record.value.values)) return contractFailure("ti_v3_analytics_contract_invalid", "$.values");
  return finalizeContentAddressedAuthority("normalized_analysis_arguments", {
    schemaVersion: NORMALIZED_ANALYSIS_ARGUMENTS_VERSION,
    argumentSchemaDigest: schemaDigest.value,
    values: record.value.values as Readonly<Record<string, unknown>>,
  }, "argumentsDigest") as ExactResult<NormalizedAnalysisArguments, AnalyticalContractFailure>;
}

export function verifyNormalizedAnalysisArguments(
  input: unknown,
): ExactResult<NormalizedAnalysisArguments, AnalyticalContractFailure> {
  const record = validateContractRecord(input, ["schemaVersion", "argumentSchemaDigest", "values", "argumentsDigest"]);
  if (!record.ok) return record;
  const digest = validateClaimedDigest(record.value.argumentsDigest, "$.argumentsDigest", "normalized_analysis_arguments");
  if (!digest.ok) return digest;
  const rebuilt = buildNormalizedAnalysisArguments({
    schemaVersion: record.value.schemaVersion,
    argumentSchemaDigest: record.value.argumentSchemaDigest,
    values: record.value.values,
  });
  if (!rebuilt.ok || rebuilt.value.argumentsDigest !== digest.value) return contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.argumentsDigest");
  return rebuilt;
}
