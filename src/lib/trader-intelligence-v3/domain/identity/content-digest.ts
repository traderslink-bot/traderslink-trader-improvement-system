import { createHash } from "node:crypto";

import {
  serializeCanonicalValue,
  type CanonicalSerializationFailure,
  type CanonicalValue,
} from "../canonical";
import type { ExactResult } from "../exact";

export type ContentIdentityDomain =
  | "canonical_content"
  | "canonical_execution"
  | "canonical_source_document"
  | "correction_record"
  | "execution_catalog"
  | "correction_result"
  | "retrospective_policy"
  | "dataset_manifest"
  | "eligibility_set"
  | "canonical_filter"
  | "date_resolution_receipt"
  | "analysis_snapshot"
  | "evidence_reference"
  | "evidence_inventory"
  | "enrichment_set"
  | "restore_test_record"
  | "payload_envelope"
  | "analytical_row"
  | "analytical_dataset"
  | "analytical_dataset_derivation"
  | "analytical_partition"
  | "exact_metric"
  | "analysis_run_context"
  | "analysis_run_receipt"
  | "exact_table"
  | "validated_claim"
  | "chart_ready_series"
  | "analytical_evidence_bundle"
  | "analytical_diagnostics"
  | "tool_registry_entry"
  | "tool_registry_snapshot"
  | "starting_inventory"
  | "normalized_analysis_arguments"
  | "weekday_execution_payload"
  | "weekday_execution_authority"
  | "daily_stop_execution_payload"
  | "daily_stop_execution_authority"
  | "daily_stop_sample_authority";

declare const canonicalDigestBrand: unique symbol;
declare const canonicalExecutionDigestBrand: unique symbol;
declare const canonicalSourceDocumentDigestBrand: unique symbol;

export type CanonicalContentDigest = string & {
  readonly [canonicalDigestBrand]: "CanonicalContentDigest";
};

export type CanonicalExecutionDigest = CanonicalContentDigest & {
  readonly [canonicalExecutionDigestBrand]: "CanonicalExecutionDigest";
};

export type CanonicalSourceDocumentDigest = CanonicalContentDigest & {
  readonly [canonicalSourceDocumentDigestBrand]: "CanonicalSourceDocumentDigest";
};

export type ContentDigestFailure =
  | CanonicalSerializationFailure
  | { code: "ti_v3_digest_domain_invalid"; path: "$" }
  | { code: "ti_v3_digest_version_invalid"; path: "$" }
  | { code: "ti_v3_digest_identifier_invalid"; path: "$" };

export interface CanonicalContentIdentity {
  readonly domain: ContentIdentityDomain;
  readonly version: `v${number}`;
  readonly algorithm: "sha256";
  readonly canonicalValue: CanonicalValue;
  readonly canonicalJson: string;
  readonly canonicalBytes: Uint8Array;
  readonly digestHex: string;
  readonly identifier: CanonicalContentDigest;
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function identifier(
  domain: ContentIdentityDomain,
  version: `v${number}`,
  digestHex: string,
): CanonicalContentDigest {
  return `ti_v3:${domain}:${version}:sha256:${digestHex}` as CanonicalContentDigest;
}

export function createCanonicalContentIdentity(
  domain: ContentIdentityDomain,
  version: `v${number}`,
  value: unknown,
): ExactResult<CanonicalContentIdentity, ContentDigestFailure> {
  if (!/^[a-z][a-z0-9_]*$/.test(domain)) {
    return { ok: false, error: { code: "ti_v3_digest_domain_invalid", path: "$" } };
  }
  if (!/^v[1-9][0-9]*$/.test(version)) {
    return { ok: false, error: { code: "ti_v3_digest_version_invalid", path: "$" } };
  }
  const serialized = serializeCanonicalValue(value);
  if (!serialized.ok) {
    return serialized;
  }
  const digestHex = sha256(serialized.value.utf8);
  const authoritativeBytes = serialized.value.utf8;
  const identityValue: CanonicalContentIdentity = Object.freeze({
    domain,
    version,
    algorithm: "sha256",
    canonicalValue: serialized.value.value,
    canonicalJson: serialized.value.json,
    get canonicalBytes(): Uint8Array {
      return authoritativeBytes.slice();
    },
    digestHex,
    identifier: identifier(domain, version, digestHex),
  });
  return {
    ok: true,
    value: identityValue,
  };
}

export function createCanonicalSourceDocumentDigest(
  bytes: Uint8Array,
): CanonicalSourceDocumentDigest {
  return identifier(
    "canonical_source_document",
    "v1",
    sha256(bytes),
  ) as CanonicalSourceDocumentDigest;
}

export function parseCanonicalContentDigest(
  input: unknown,
): ExactResult<CanonicalContentDigest, ContentDigestFailure> {
  if (
    typeof input !== "string" ||
    !/^ti_v3:(?:canonical_content|canonical_execution|canonical_source_document|correction_record|execution_catalog|correction_result|retrospective_policy|dataset_manifest|eligibility_set|canonical_filter|date_resolution_receipt|analysis_snapshot|evidence_reference|evidence_inventory|enrichment_set|restore_test_record|payload_envelope|analytical_row|analytical_dataset|analytical_dataset_derivation|analytical_partition|exact_metric|analysis_run_context|analysis_run_receipt|exact_table|validated_claim|chart_ready_series|analytical_evidence_bundle|analytical_diagnostics|tool_registry_entry|tool_registry_snapshot|starting_inventory|normalized_analysis_arguments|weekday_execution_payload|weekday_execution_authority|daily_stop_execution_payload|daily_stop_execution_authority|daily_stop_sample_authority):v[1-9][0-9]*:sha256:[0-9a-f]{64}$/.test(
      input,
    )
  ) {
    return { ok: false, error: { code: "ti_v3_digest_identifier_invalid", path: "$" } };
  }
  return { ok: true, value: input as CanonicalContentDigest };
}

export function canonicalBytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }
  return true;
}

export function createCanonicalOccurrenceSetDigest(
  occurrenceKeys: readonly string[],
): CanonicalContentDigest {
  const hash = createHash("sha256");
  hash.update("ti_v3:execution_relationship_occurrences:v1\n", "utf8");
  occurrenceKeys.forEach((key) => {
    hash.update(`${key.length}:`, "utf8");
    hash.update(key, "utf8");
    hash.update("\n", "utf8");
  });
  return identifier("canonical_content", "v1", hash.digest("hex"));
}
