import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, resolve, sep } from "node:path";

import type { ExactResult } from "../domain/exact";
import type { CanonicalContentDigest } from "../domain/identity";
import {
  parsePersistedRawBrokerCsvImport,
  serializePersistedRawBrokerCsvImport,
  type PersistedRawBrokerCsvImport,
} from "./persisted-raw-broker-csv-import";

export const LOCAL_EXECUTION_SOURCE_DOCUMENT_STORE_VERSION =
  "ti_v3_local_execution_source_document_store_v1" as const;

export type LocalExecutionSourceDocumentStoreFailure = Readonly<{
  code: "ti_v3_execution_source_store_path_invalid" | "ti_v3_execution_source_store_write_failed" | "ti_v3_execution_source_store_not_found" | "ti_v3_execution_source_store_delete_failed";
  path: string;
}>;

export interface LocalExecutionSourceDocumentStore {
  readonly storeKey: "ti_v3_local_execution_source_document_store";
  readonly storeVersion: typeof LOCAL_EXECUTION_SOURCE_DOCUMENT_STORE_VERSION;
  readonly persist: (record: PersistedRawBrokerCsvImport) => ExactResult<PersistedRawBrokerCsvImport, LocalExecutionSourceDocumentStoreFailure>;
  readonly read: (scope: Readonly<{ canonicalOwnerKey: string; canonicalAccountKey: string; persistenceDigest: CanonicalContentDigest }>) => ExactResult<PersistedRawBrokerCsvImport, LocalExecutionSourceDocumentStoreFailure>;
  readonly remove: (scope: Readonly<{ canonicalOwnerKey: string; canonicalAccountKey: string; persistenceDigest: CanonicalContentDigest }>) => ExactResult<Readonly<{ persistenceDigest: CanonicalContentDigest }>, LocalExecutionSourceDocumentStoreFailure>;
}

export interface LocalExecutionSourceDocumentStoreOptions {
  readonly directory: string;
  readonly repositoryRoot?: string;
  readonly temporaryRoot?: string;
  readonly syntheticTestMode?: boolean;
}

function failure(
  code: LocalExecutionSourceDocumentStoreFailure["code"],
  path: string,
): ExactResult<never, LocalExecutionSourceDocumentStoreFailure> {
  return { ok: false, error: { code, path } };
}

function fileFor(root: string, digest: CanonicalContentDigest): string | null {
  const match = /^ti_v3:canonical_content:v1:sha256:([0-9a-f]{64})$/.exec(digest);
  if (match === null) return null;
  const file = resolve(root, match[1] + ".json");
  return file.startsWith(root + sep) ? file : null;
}

function comparable(path: string): string {
  const absolute = resolve(path);
  return process.platform === "win32" ? absolute.toLowerCase() : absolute;
}

function within(path: string, root: string): boolean {
  const child = comparable(path);
  const parent = comparable(root);
  return child === parent || child.startsWith(parent + sep);
}

export function createLocalExecutionSourceDocumentStore(
  options: LocalExecutionSourceDocumentStoreOptions,
): ExactResult<LocalExecutionSourceDocumentStore, LocalExecutionSourceDocumentStoreFailure> {
  if (typeof options.directory !== "string" || !isAbsolute(options.directory)) {
    return failure("ti_v3_execution_source_store_path_invalid", "$.directory");
  }
  const root = resolve(options.directory);
  if (
    within(root, options.repositoryRoot ?? process.cwd()) ||
    (!options.syntheticTestMode && within(root, options.temporaryRoot ?? tmpdir()))
  ) {
    return failure("ti_v3_execution_source_store_path_invalid", "$.directory");
  }
  const read = (scope: Readonly<{ canonicalOwnerKey: string; canonicalAccountKey: string; persistenceDigest: CanonicalContentDigest }>) => {
    const file = fileFor(root, scope.persistenceDigest);
    if (file === null || !existsSync(file)) return failure("ti_v3_execution_source_store_not_found", "$.persistenceDigest");
    try {
      const parsed = parsePersistedRawBrokerCsvImport(readFileSync(file, "utf8"));
      if (
        !parsed.ok ||
        parsed.value.persistenceDigest !== scope.persistenceDigest ||
        parsed.value.canonicalOwnerKey !== scope.canonicalOwnerKey ||
        parsed.value.canonicalAccountKey !== scope.canonicalAccountKey
      ) return failure("ti_v3_execution_source_store_not_found", "$.persistenceDigest");
      return { ok: true as const, value: parsed.value };
    } catch {
      return failure("ti_v3_execution_source_store_not_found", "$.persistenceDigest");
    }
  };
  return {
    ok: true,
    value: Object.freeze({
      storeKey: "ti_v3_local_execution_source_document_store",
      storeVersion: LOCAL_EXECUTION_SOURCE_DOCUMENT_STORE_VERSION,
      read,
      remove: (scope) => {
        const current = read(scope);
        if (!current.ok) return current;
        const file = fileFor(root, scope.persistenceDigest);
        if (file === null) return failure("ti_v3_execution_source_store_path_invalid", "$.persistenceDigest");
        try {
          unlinkSync(file);
          return { ok: true as const, value: Object.freeze({ persistenceDigest: scope.persistenceDigest }) };
        } catch {
          return failure("ti_v3_execution_source_store_delete_failed", "$.persistenceDigest");
        }
      },
      persist: (record: PersistedRawBrokerCsvImport) => {
        const file = fileFor(root, record.persistenceDigest);
        const serialized = serializePersistedRawBrokerCsvImport(record);
        if (file === null || !serialized.ok) return failure("ti_v3_execution_source_store_path_invalid", "$.record");
        try {
          mkdirSync(root, { recursive: true });
          if (existsSync(file)) {
            return read({
              canonicalOwnerKey: record.canonicalOwnerKey,
              canonicalAccountKey: record.canonicalAccountKey,
              persistenceDigest: record.persistenceDigest,
            });
          }
          const temporary = join(root, "." + record.persistenceDigest.slice(-16) + ".pending");
          writeFileSync(temporary, serialized.value, { encoding: "utf8", flag: "wx" });
          renameSync(temporary, file);
          return { ok: true as const, value: record };
        } catch {
          return failure("ti_v3_execution_source_store_write_failed", "$.record");
        }
      },
    }),
  };
}
