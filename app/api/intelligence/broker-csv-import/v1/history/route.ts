import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import {
  authorizeTraderIntelligenceOwner,
  withTraderIntelligenceOwnerRoute,
} from "@/src/lib/trader-intelligence-v3/auth";
import {
  canonicalOwnerKeyForServerImport,
  createNeonPreviewExecutionSourceStore,
  parsePersistedRawBrokerCsvImport,
  resolveConfiguredServerRawBrokerCsvImportService,
} from "@/src/lib/trader-intelligence-v3/ingestion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_PATH =
  "app/api/intelligence/broker-csv-import/v1/history/route.ts";

async function GETHandler(request: Request): Promise<Response> {
  const authorization = await authorizeTraderIntelligenceOwner({
    environment: process.env,
    modulePath: ROUTE_PATH,
    localRequest: { headers: request.headers, requestUrl: request.url },
  });
  if (!authorization.ok) {
    return Response.json(
      {
        contractVersion: "ti_v3_broker_csv_import_history_v1",
        error: { code: "ti_v3_broker_csv_import_history_unavailable" },
      },
      { status: 503 },
    );
  }
  if (authorization.config.persistence.kind === "private_database") {
    const accountKey = process.env.TRADER_INTELLIGENCE_V3_EXECUTION_ACCOUNT_KEY?.trim();
    if (!accountKey || !/^account_[a-z0-9][a-z0-9_-]{0,87}$/.test(accountKey)) {
      return Response.json({ contractVersion: "ti_v3_broker_csv_import_history_v1", error: { code: "ti_v3_server_import_account_key_missing" } }, { status: 503 });
    }
    const store = await createNeonPreviewExecutionSourceStore(process.env);
    if (!store.ok) {
      return Response.json({ contractVersion: "ti_v3_broker_csv_import_history_v1", error: { code: store.error.code } }, { status: 503 });
    }
    const records = await store.value.list({
      canonicalOwnerKey: canonicalOwnerKeyForServerImport(authorization.owner),
      canonicalAccountKey: accountKey,
    });
    if (!records.ok) {
      return Response.json({ contractVersion: "ti_v3_broker_csv_import_history_v1", error: { code: records.error.code } }, { status: 503 });
    }
    return Response.json({
      contractVersion: "ti_v3_broker_csv_import_history_v1",
      imports: records.value.map(({ record, importedAt }) => {
        const timestamps = record.acceptedExecutions.map((execution) => execution.content.executedAt).sort();
        return Object.freeze({
          persistenceDigest: record.persistenceDigest,
          importedAt,
          broker: record.brokerCode,
          acceptedRows: record.acceptedExecutionCount,
          rowsNeedingAttention: record.rejectedRowCount,
          firstExecutionAt: timestamps[0] ?? null,
          lastExecutionAt: timestamps[timestamps.length - 1] ?? null,
        });
      }),
    });
  }
  if (authorization.config.persistence.kind !== "file") {
    return Response.json(
      {
        contractVersion: "ti_v3_broker_csv_import_history_v1",
        error: { code: "ti_v3_broker_csv_import_history_unavailable" },
      },
      { status: 503 },
    );
  }
  const service = resolveConfiguredServerRawBrokerCsvImportService({
    owner: authorization.owner,
    config: authorization.config,
    environment: process.env,
  });
  if (!service.ok) {
    return Response.json(
      {
        contractVersion: "ti_v3_broker_csv_import_history_v1",
        error: { code: service.error.code },
      },
      { status: 503 },
    );
  }
  const directory = join(
    authorization.config.persistence.parentPath,
    "trader-intelligence-v3-execution-source-documents",
  );
  let imports: readonly Readonly<{
    persistenceDigest: string;
    importedAt: string;
    broker: string;
    acceptedRows: string;
    rowsNeedingAttention: string;
    firstExecutionAt: string | null;
    lastExecutionAt: string | null;
  }>[] = [];
  try {
    const records = readdirSync(directory)
      .filter((name) => name.endsWith(".json"))
      .flatMap((name) => {
        const path = join(directory, name);
        try {
          const parsed = parsePersistedRawBrokerCsvImport(
            readFileSync(path, "utf8"),
          );
          if (
            !parsed.ok ||
            parsed.value.canonicalOwnerKey !==
              service.value.canonicalOwnerKey ||
            parsed.value.canonicalAccountKey !==
              service.value.canonicalAccountKey
          ) {
            return [];
          }
          const timestamps = parsed.value.acceptedExecutions
            .map((execution) => execution.content.executedAt)
            .sort();
          return [
            Object.freeze({
              sourceDocumentDigest: parsed.value.sourceDocumentDigest,
              persistenceDigest: parsed.value.persistenceDigest,
              importedAt: statSync(path).mtime.toISOString(),
              broker: parsed.value.brokerCode,
              acceptedRows: parsed.value.acceptedExecutionCount,
              rowsNeedingAttention: parsed.value.rejectedRowCount,
              firstExecutionAt: timestamps[0] ?? null,
              lastExecutionAt: timestamps[timestamps.length - 1] ?? null,
            }),
          ];
        } catch {
          return [];
        }
      })
      .sort((left, right) => right.importedAt.localeCompare(left.importedAt));
    const seenSourceDocuments = new Set<string>();
    imports = records
      .filter((record) => {
        if (seenSourceDocuments.has(record.sourceDocumentDigest)) return false;
        seenSourceDocuments.add(record.sourceDocumentDigest);
        return true;
      })
      .map((record) =>
        Object.freeze({
          persistenceDigest: record.persistenceDigest,
          importedAt: record.importedAt,
          broker: record.broker,
          acceptedRows: record.acceptedRows,
          rowsNeedingAttention: record.rowsNeedingAttention,
          firstExecutionAt: record.firstExecutionAt,
          lastExecutionAt: record.lastExecutionAt,
        }),
      );
  } catch {
    imports = [];
  }
  return Response.json({
    contractVersion: "ti_v3_broker_csv_import_history_v1",
    imports,
  });
}

export const GET = withTraderIntelligenceOwnerRoute(
  "app/api/intelligence/broker-csv-import/v1/history/route.ts",
  GETHandler,
);
