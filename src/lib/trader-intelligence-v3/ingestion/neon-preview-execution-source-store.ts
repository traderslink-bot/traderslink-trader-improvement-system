import "server-only";

import { neon } from "@neondatabase/serverless";

import type { ExactResult } from "../domain/exact";
import type { CanonicalContentDigest } from "../domain/identity";
import {
  parsePersistedRawBrokerCsvImport,
  serializePersistedRawBrokerCsvImport,
  type PersistedRawBrokerCsvImport,
} from "./persisted-raw-broker-csv-import";

export type NeonPreviewExecutionStoreFailure = Readonly<{
  code:
    | "ti_v3_preview_database_configuration_invalid"
    | "ti_v3_preview_database_identity_mismatch"
    | "ti_v3_preview_database_read_failed"
    | "ti_v3_preview_database_write_failed";
  path: string;
}>;

type PreviewEnvironment = Readonly<Record<string, string | undefined>>;

const EXPECTED_BRANCH = "codex/v3-journal-preview";
const EXPECTED_PURPOSE = "v3_journal_preview_test";

function failure(
  code: NeonPreviewExecutionStoreFailure["code"],
  path: string,
): ExactResult<never, NeonPreviewExecutionStoreFailure> {
  return { ok: false, error: { code, path } };
}

function previewDatabaseConfig(environment: PreviewEnvironment):
  | {
      databaseName: string;
      databaseUrl: string;
    }
  | null {
  const databaseUrl =
    environment.TRADER_INTELLIGENCE_V3_PREVIEW_DATABASE_URL?.trim();
  const databaseName =
    environment.TRADER_INTELLIGENCE_V3_PREVIEW_DATABASE_NAME?.trim();
  const purpose =
    environment.TRADER_INTELLIGENCE_V3_DATABASE_PURPOSE?.trim();
  const hostedPreview =
    environment.VERCEL_ENV === "preview" &&
    environment.VERCEL_GIT_COMMIT_REF === EXPECTED_BRANCH;
  const localPreview =
    environment.NODE_ENV !== "production" &&
    environment.TRADER_INTELLIGENCE_V3_ALLOW_LOCAL_PREVIEW_DATABASE === "true";

  if (
    !databaseUrl ||
    !databaseName ||
    purpose !== EXPECTED_PURPOSE ||
    (!hostedPreview && !localPreview)
  ) {
    return null;
  }

  try {
    const url = new URL(databaseUrl);
    if (
      url.protocol !== "postgres:" &&
      url.protocol !== "postgresql:"
    ) {
      return null;
    }
    if (
      url.hostname !== "neon.tech" &&
      !url.hostname.endsWith(".neon.tech")
    ) {
      return null;
    }
  } catch {
    return null;
  }

  return { databaseName, databaseUrl };
}

export interface NeonPreviewExecutionSourceStore {
  persist(
    record: PersistedRawBrokerCsvImport,
  ): Promise<
    ExactResult<PersistedRawBrokerCsvImport, NeonPreviewExecutionStoreFailure>
  >;
  read(
    scope: Readonly<{
      canonicalAccountKey: string;
      canonicalOwnerKey: string;
      persistenceDigest: CanonicalContentDigest;
    }>,
  ): Promise<
    ExactResult<PersistedRawBrokerCsvImport, NeonPreviewExecutionStoreFailure>
  >;
}

export async function createNeonPreviewExecutionSourceStore(
  environment: PreviewEnvironment,
): Promise<
  ExactResult<
    NeonPreviewExecutionSourceStore,
    NeonPreviewExecutionStoreFailure
  >
> {
  const config = previewDatabaseConfig(environment);
  if (!config) {
    return failure(
      "ti_v3_preview_database_configuration_invalid",
      "$.environment",
    );
  }

  const sql = neon(config.databaseUrl);
  try {
    const identity = await sql`
      select current_database() as database_name
    `;
    if (identity[0]?.database_name !== config.databaseName) {
      return failure(
        "ti_v3_preview_database_identity_mismatch",
        "$.databaseName",
      );
    }
    await sql`
      create table if not exists ti_v3_preview_execution_sources (
        canonical_owner_key text not null,
        canonical_account_key text not null,
        persistence_digest text not null,
        source_document_digest text not null,
        source_payload jsonb not null,
        created_at timestamptz not null default now(),
        primary key (
          canonical_owner_key,
          canonical_account_key,
          persistence_digest
        )
      )
    `;
  } catch {
    return failure(
      "ti_v3_preview_database_identity_mismatch",
      "$.connection",
    );
  }

  const read: NeonPreviewExecutionSourceStore["read"] = async (scope) => {
    try {
      const rows = await sql`
        select source_payload
        from ti_v3_preview_execution_sources
        where canonical_owner_key = ${scope.canonicalOwnerKey}
          and canonical_account_key = ${scope.canonicalAccountKey}
          and persistence_digest = ${scope.persistenceDigest}
        limit 1
      `;
      if (rows.length !== 1) {
        return failure(
          "ti_v3_preview_database_read_failed",
          "$.persistenceDigest",
        );
      }
      const payload =
        typeof rows[0]?.source_payload === "string"
          ? rows[0].source_payload
          : JSON.stringify(rows[0]?.source_payload);
      const parsed = parsePersistedRawBrokerCsvImport(payload);
      if (
        !parsed.ok ||
        parsed.value.canonicalOwnerKey !== scope.canonicalOwnerKey ||
        parsed.value.canonicalAccountKey !== scope.canonicalAccountKey ||
        parsed.value.persistenceDigest !== scope.persistenceDigest
      ) {
        return failure(
          "ti_v3_preview_database_read_failed",
          "$.sourcePayload",
        );
      }
      return { ok: true, value: parsed.value };
    } catch {
      return failure(
        "ti_v3_preview_database_read_failed",
        "$.connection",
      );
    }
  };

  return {
    ok: true,
    value: Object.freeze({
      read,
      persist: async (record: PersistedRawBrokerCsvImport) => {
        const serialized = serializePersistedRawBrokerCsvImport(record);
        if (!serialized.ok) {
          return failure(
            "ti_v3_preview_database_write_failed",
            "$.record",
          );
        }
        try {
          await sql`
            insert into ti_v3_preview_execution_sources (
              canonical_owner_key,
              canonical_account_key,
              persistence_digest,
              source_document_digest,
              source_payload
            )
            values (
              ${record.canonicalOwnerKey},
              ${record.canonicalAccountKey},
              ${record.persistenceDigest},
              ${record.sourceDocumentDigest},
              ${serialized.value}::jsonb
            )
            on conflict (
              canonical_owner_key,
              canonical_account_key,
              persistence_digest
            ) do nothing
          `;
          return read({
            canonicalOwnerKey: record.canonicalOwnerKey,
            canonicalAccountKey: record.canonicalAccountKey,
            persistenceDigest: record.persistenceDigest,
          });
        } catch {
          return failure(
            "ti_v3_preview_database_write_failed",
            "$.connection",
          );
        }
      },
    }),
  };
}
