import { createHash } from "node:crypto";
import { join } from "node:path";

import { parseStrictCanonicalJson } from "../domain/canonical";
import type { TraderIntelligenceOwnerContext } from "../domain";
import type { ExactResult } from "../domain/exact";
import type { CanonicalContentDigest } from "../domain/identity";
import type { TraderIntelligenceDeploymentConfig, TraderIntelligenceEnvironment } from "../deployment";
import {
  createLocalExecutionSourceDocumentStore,
  type LocalExecutionSourceDocumentStore,
  type LocalExecutionSourceDocumentStoreFailure,
} from "./local-execution-source-document-store";
import {
  ingestAndBuildPersistedRawBrokerCsvImport,
  type PersistedRawBrokerCsvImport,
  type PersistedRawBrokerCsvImportFailure,
} from "./persisted-raw-broker-csv-import";
import {
  buildPersistedExecutionLifecycleProjection,
  type PersistedExecutionLifecycleProjection,
  type PersistedExecutionLifecycleProjectionFailure,
} from "./persisted-execution-lifecycle-projection";
import {
  buildPersistedExecutionAnalyticsReadiness,
  type PersistedExecutionAnalyticsReadiness,
  type PersistedExecutionAnalyticsReadinessFailure,
} from "./persisted-execution-analytics-readiness";
import {
  createPersistedExecutionAnalyticsAuthoritySource,
  type PersistedExecutionAnalyticsAuthorityAttachment,
} from "./persisted-execution-analytics-authority";
import type { ReadOnlySnapshotAuthoritySource } from "../analytics";
import type {
  RawBrokerCsvColumnMapping,
  RawBrokerCsvIngestionRequest,
  RawBrokerCsvInstrumentResolution,
} from "./raw-broker-csv-ingestion";

export const SERVER_RAW_BROKER_CSV_IMPORT_VERSION =
  "ti_v3_server_raw_broker_csv_import_v1" as const;

export type ServerRawBrokerCsvImportFailure = Readonly<{
  code:
    | "ti_v3_server_import_owner_scope_invalid"
    | "ti_v3_server_import_account_key_missing"
    | "ti_v3_server_import_account_key_invalid"
    | "ti_v3_server_import_instrument_map_invalid"
    | "ti_v3_server_import_storage_unavailable"
    | "ti_v3_server_import_source_selection_empty"
    | "ti_v3_server_import_source_selection_duplicate"
    | "ti_v3_server_import_source_selection_oversized"
    | PersistedExecutionLifecycleProjectionFailure["code"]
    | PersistedExecutionAnalyticsReadinessFailure["code"]
    | PersistedRawBrokerCsvImportFailure["code"]
    | LocalExecutionSourceDocumentStoreFailure["code"];
  path: string;
}>;

export interface ServerRawBrokerCsvImportSubmission {
  readonly csvUtf8: Uint8Array;
  readonly sourceIdentity: string;
  readonly sourceSystem: string;
  readonly brokerCode: string;
  readonly columnMapping: RawBrokerCsvColumnMapping;
  readonly defaultCurrency?: string;
  readonly timestampPrecision: RawBrokerCsvIngestionRequest["timestampPrecision"];
  readonly sourceTimezoneEvidence: string;
  readonly chargeCoverageState?: "complete" | "unknown";
}

export interface ServerRawBrokerCsvImportService {
  readonly contractVersion: typeof SERVER_RAW_BROKER_CSV_IMPORT_VERSION;
  readonly canonicalOwnerKey: string;
  readonly canonicalAccountKey: string;
  readonly persist: (
    submission: ServerRawBrokerCsvImportSubmission,
  ) => ExactResult<PersistedRawBrokerCsvImport, ServerRawBrokerCsvImportFailure>;
  readonly read: (
    persistenceDigest: CanonicalContentDigest,
  ) => ExactResult<PersistedRawBrokerCsvImport, ServerRawBrokerCsvImportFailure>;
  readonly readMany: (
    persistenceDigests: readonly CanonicalContentDigest[],
  ) => ExactResult<
    readonly PersistedRawBrokerCsvImport[],
    ServerRawBrokerCsvImportFailure
  >;
  readonly remove: (
    persistenceDigest: CanonicalContentDigest,
  ) => ExactResult<
    Readonly<{ persistenceDigest: CanonicalContentDigest }>,
    ServerRawBrokerCsvImportFailure
  >;
  readonly projectLifecycles: (
    persistenceDigests: readonly CanonicalContentDigest[],
  ) => ExactResult<
    PersistedExecutionLifecycleProjection,
    ServerRawBrokerCsvImportFailure
  >;
  readonly resolveAnalyticsReadiness: (
    persistenceDigests: readonly CanonicalContentDigest[],
  ) => ExactResult<
    PersistedExecutionAnalyticsReadiness,
    ServerRawBrokerCsvImportFailure
  >;
  readonly createAnalyticsAuthoritySource: (
    persistenceDigests: readonly CanonicalContentDigest[],
    attachment: PersistedExecutionAnalyticsAuthorityAttachment,
  ) => ExactResult<ReadOnlySnapshotAuthoritySource, ServerRawBrokerCsvImportFailure>;
}

export interface ServerRawBrokerCsvImportAuthority {
  readonly owner: TraderIntelligenceOwnerContext;
  readonly canonicalAccountKey: string;
  readonly instrumentResolutions: ReadonlyMap<string, RawBrokerCsvInstrumentResolution>;
  readonly sourceStore: LocalExecutionSourceDocumentStore;
}

type InstrumentResolutionDeclaration = Readonly<{
  stableInstrumentKey: string;
  securityType: string;
}>;

const UNRESOLVED_INSTRUMENT: RawBrokerCsvInstrumentResolution = Object.freeze({
  state: "unresolved",
  stableInstrumentKey: null,
  securityType: "unclassified_security",
  basisContinuityState: "symbol_change_unresolved",
});

const MAX_SOURCE_SELECTION_DOCUMENTS = 256;

function failure(
  code: ServerRawBrokerCsvImportFailure["code"],
  path: string,
): ExactResult<never, ServerRawBrokerCsvImportFailure> {
  return { ok: false, error: { code, path } };
}

function isCanonicalAccountKey(value: string): boolean {
  return /^account_[a-z0-9][a-z0-9_-]{0,87}$/.test(value);
}

function isStableInstrumentKey(value: unknown): value is string {
  return typeof value === "string" && /^instrument_[a-z0-9][a-z0-9_-]{0,84}$/.test(value);
}

function isSecurityType(value: unknown): value is string {
  return typeof value === "string" && /^[a-z][a-z0-9_]{0,63}$/.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Maps the authenticated owner identity to a v3-safe canonical key without
 * allowing a browser caller to select the owner scope. */
export function canonicalOwnerKeyForServerImport(
  owner: TraderIntelligenceOwnerContext,
): string {
  return `owner_${createHash("sha256").update(owner.identity.ownerId, "utf8").digest("hex")}`;
}

export function parseServerInstrumentResolutionMap(
  value: string | undefined,
): ExactResult<ReadonlyMap<string, RawBrokerCsvInstrumentResolution>, ServerRawBrokerCsvImportFailure> {
  if (value === undefined || value.trim() === "") {
    return { ok: true, value: new Map() };
  }
  const parsed = parseStrictCanonicalJson(value);
  if (!parsed.ok || !isRecord(parsed.value)) {
    return failure("ti_v3_server_import_instrument_map_invalid", "$.TRADER_INTELLIGENCE_V3_EXECUTION_INSTRUMENTS_JSON");
  }
  const resolutions = new Map<string, RawBrokerCsvInstrumentResolution>();
  for (const [symbol, declaration] of Object.entries(parsed.value)) {
    if (!/^[A-Z0-9._-]{1,32}$/.test(symbol) || !isRecord(declaration)) {
      return failure("ti_v3_server_import_instrument_map_invalid", "$.TRADER_INTELLIGENCE_V3_EXECUTION_INSTRUMENTS_JSON");
    }
    const keys = Object.keys(declaration).sort();
    if (
      keys.length !== 2 ||
      keys[0] !== "securityType" ||
      keys[1] !== "stableInstrumentKey" ||
      !isStableInstrumentKey(declaration.stableInstrumentKey) ||
      !isSecurityType(declaration.securityType)
    ) {
      return failure("ti_v3_server_import_instrument_map_invalid", "$.TRADER_INTELLIGENCE_V3_EXECUTION_INSTRUMENTS_JSON");
    }
    const resolved: InstrumentResolutionDeclaration = {
      stableInstrumentKey: declaration.stableInstrumentKey,
      securityType: declaration.securityType,
    };
    resolutions.set(symbol, Object.freeze({
      state: "resolved",
      stableInstrumentKey: resolved.stableInstrumentKey,
      securityType: resolved.securityType,
      basisContinuityState: "resolved",
    }));
  }
  return { ok: true, value: resolutions };
}

export function createServerRawBrokerCsvImportService(
  authority: ServerRawBrokerCsvImportAuthority,
): ExactResult<ServerRawBrokerCsvImportService, ServerRawBrokerCsvImportFailure> {
  if (!isCanonicalAccountKey(authority.canonicalAccountKey)) {
    return failure("ti_v3_server_import_account_key_invalid", "$.canonicalAccountKey");
  }
  const canonicalOwnerKey = canonicalOwnerKeyForServerImport(authority.owner);
  return {
    ok: true,
    value: Object.freeze({
      contractVersion: SERVER_RAW_BROKER_CSV_IMPORT_VERSION,
      canonicalOwnerKey,
      canonicalAccountKey: authority.canonicalAccountKey,
      persist: (submission: ServerRawBrokerCsvImportSubmission) => {
        const persisted = ingestAndBuildPersistedRawBrokerCsvImport({
          ...submission,
          canonicalOwnerKey,
          canonicalAccountKey: authority.canonicalAccountKey,
          resolveInstrument: (symbol) =>
            authority.instrumentResolutions.get(symbol) ?? UNRESOLVED_INSTRUMENT,
        });
        if (!persisted.ok) return persisted;
        const written = authority.sourceStore.persist(persisted.value);
        return written.ok ? written : failure(written.error.code, written.error.path);
      },
      read: (persistenceDigest: CanonicalContentDigest) => {
        const record = authority.sourceStore.read({
          canonicalOwnerKey,
          canonicalAccountKey: authority.canonicalAccountKey,
          persistenceDigest,
        });
        return record.ok ? record : failure(record.error.code, record.error.path);
      },
      remove: (persistenceDigest: CanonicalContentDigest) => {
        const removed = authority.sourceStore.remove({
          canonicalOwnerKey,
          canonicalAccountKey: authority.canonicalAccountKey,
          persistenceDigest,
        });
        return removed.ok
          ? removed
          : failure(removed.error.code, removed.error.path);
      },
      readMany: (persistenceDigests: readonly CanonicalContentDigest[]) => {
        if (persistenceDigests.length === 0) {
          return failure("ti_v3_server_import_source_selection_empty", "$.persistenceDigests");
        }
        if (persistenceDigests.length > MAX_SOURCE_SELECTION_DOCUMENTS) {
          return failure("ti_v3_server_import_source_selection_oversized", "$.persistenceDigests");
        }
        const ordered = [...persistenceDigests].sort((left, right) =>
          left < right ? -1 : left > right ? 1 : 0,
        );
        if (ordered.some((digest, index) => digest === ordered[index - 1])) {
          return failure("ti_v3_server_import_source_selection_duplicate", "$.persistenceDigests");
        }
        const records: PersistedRawBrokerCsvImport[] = [];
        for (const persistenceDigest of ordered) {
          const record = authority.sourceStore.read({
            canonicalOwnerKey,
            canonicalAccountKey: authority.canonicalAccountKey,
            persistenceDigest,
          });
          if (!record.ok) return failure(record.error.code, record.error.path);
          records.push(record.value);
        }
        return { ok: true as const, value: Object.freeze(records) };
      },
      projectLifecycles: (persistenceDigests: readonly CanonicalContentDigest[]) => {
        const selected = Object.freeze([...persistenceDigests].sort((left, right) =>
          left < right ? -1 : left > right ? 1 : 0,
        ));
        if (selected.length === 0) {
          return failure("ti_v3_server_import_source_selection_empty", "$.persistenceDigests");
        }
        if (selected.length > MAX_SOURCE_SELECTION_DOCUMENTS) {
          return failure("ti_v3_server_import_source_selection_oversized", "$.persistenceDigests");
        }
        if (selected.some((digest, index) => digest === selected[index - 1])) {
          return failure("ti_v3_server_import_source_selection_duplicate", "$.persistenceDigests");
        }
        const records: PersistedRawBrokerCsvImport[] = [];
        for (const persistenceDigest of selected) {
          const record = authority.sourceStore.read({
            canonicalOwnerKey,
            canonicalAccountKey: authority.canonicalAccountKey,
            persistenceDigest,
          });
          if (!record.ok) return failure(record.error.code, record.error.path);
          records.push(record.value);
        }
        const projection = buildPersistedExecutionLifecycleProjection(records);
        return projection.ok ? projection : failure(projection.error.code, projection.error.path);
      },
      resolveAnalyticsReadiness: (persistenceDigests: readonly CanonicalContentDigest[]) => {
        const selected = Object.freeze([...persistenceDigests].sort((left, right) =>
          left < right ? -1 : left > right ? 1 : 0,
        ));
        if (selected.length === 0) {
          return failure("ti_v3_server_import_source_selection_empty", "$.persistenceDigests");
        }
        if (selected.length > MAX_SOURCE_SELECTION_DOCUMENTS) {
          return failure("ti_v3_server_import_source_selection_oversized", "$.persistenceDigests");
        }
        if (selected.some((digest, index) => digest === selected[index - 1])) {
          return failure("ti_v3_server_import_source_selection_duplicate", "$.persistenceDigests");
        }
        const records: PersistedRawBrokerCsvImport[] = [];
        for (const persistenceDigest of selected) {
          const record = authority.sourceStore.read({
            canonicalOwnerKey,
            canonicalAccountKey: authority.canonicalAccountKey,
            persistenceDigest,
          });
          if (!record.ok) return failure(record.error.code, record.error.path);
          records.push(record.value);
        }
        const readiness = buildPersistedExecutionAnalyticsReadiness(records);
        return readiness.ok ? readiness : failure(readiness.error.code, readiness.error.path);
      },
      createAnalyticsAuthoritySource: (
        persistenceDigests: readonly CanonicalContentDigest[],
        attachment: PersistedExecutionAnalyticsAuthorityAttachment,
      ) => {
        const selected = [...persistenceDigests].sort((left, right) =>
          left < right ? -1 : left > right ? 1 : 0,
        );
        if (selected.length === 0) return failure("ti_v3_server_import_source_selection_empty", "$.persistenceDigests");
        if (selected.length > MAX_SOURCE_SELECTION_DOCUMENTS) return failure("ti_v3_server_import_source_selection_oversized", "$.persistenceDigests");
        if (selected.some((digest, index) => digest === selected[index - 1])) return failure("ti_v3_server_import_source_selection_duplicate", "$.persistenceDigests");
        const records: PersistedRawBrokerCsvImport[] = [];
        for (const persistenceDigest of selected) {
          const record = authority.sourceStore.read({ canonicalOwnerKey, canonicalAccountKey: authority.canonicalAccountKey, persistenceDigest });
          if (!record.ok) return failure(record.error.code, record.error.path);
          records.push(record.value);
        }
        return { ok: true as const, value: createPersistedExecutionAnalyticsAuthoritySource({ records, attachment }) };
      },
    }),
  };
}

/** Resolves only server-held authority. The browser cannot choose a v3 account,
 * raw-source directory, owner key, or stable-instrument identity. */
export function resolveConfiguredServerRawBrokerCsvImportService(args: {
  owner: TraderIntelligenceOwnerContext;
  config: TraderIntelligenceDeploymentConfig;
  environment: TraderIntelligenceEnvironment;
}): ExactResult<ServerRawBrokerCsvImportService, ServerRawBrokerCsvImportFailure> {
  if (
    args.owner.identity.ownerId !== args.config.ownerId ||
    args.config.dataMode !== "real_owner_data" ||
    args.config.persistence.kind !== "file"
  ) {
    return failure("ti_v3_server_import_owner_scope_invalid", "$.authorization");
  }
  const accountKey = args.environment.TRADER_INTELLIGENCE_V3_EXECUTION_ACCOUNT_KEY?.trim();
  if (!accountKey) {
    return failure("ti_v3_server_import_account_key_missing", "$.TRADER_INTELLIGENCE_V3_EXECUTION_ACCOUNT_KEY");
  }
  if (!isCanonicalAccountKey(accountKey)) {
    return failure("ti_v3_server_import_account_key_invalid", "$.TRADER_INTELLIGENCE_V3_EXECUTION_ACCOUNT_KEY");
  }
  const instrumentResolutions = parseServerInstrumentResolutionMap(
    args.environment.TRADER_INTELLIGENCE_V3_EXECUTION_INSTRUMENTS_JSON,
  );
  if (!instrumentResolutions.ok) return instrumentResolutions;
  const sourceStore = createLocalExecutionSourceDocumentStore({
    directory: join(
      args.config.persistence.parentPath,
      "trader-intelligence-v3-execution-source-documents",
    ),
  });
  if (!sourceStore.ok) {
    return failure("ti_v3_server_import_storage_unavailable", sourceStore.error.path);
  }
  return createServerRawBrokerCsvImportService({
    owner: args.owner,
    canonicalAccountKey: accountKey,
    instrumentResolutions: instrumentResolutions.value,
    sourceStore: sourceStore.value,
  });
}
