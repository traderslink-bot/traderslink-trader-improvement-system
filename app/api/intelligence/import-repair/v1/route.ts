import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";

import {
  authorizeTraderIntelligenceOwner,
  withTraderIntelligenceOwnerRoute,
} from "@/src/lib/trader-intelligence-v3/auth";
import {
  listImportRepairRecords,
  buildImportRepairReplacement,
  IMPORT_REPAIR_MUTATION_VERSION,
  readConfiguredImportCatalog,
  readImportRepairRecord,
  removeImportRepairRecord,
  resolveConfiguredServerRawBrokerCsvImportService,
  writeConfiguredImportAuthorityBinding,
  validateImportRepairMutation,
  writeImportRepairRecord,
} from "@/src/lib/trader-intelligence-v3/ingestion";
import type { CanonicalContentDigest } from "@/src/lib/trader-intelligence-v3/domain/identity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_PATH = "app/api/intelligence/import-repair/v1/route.ts";

async function GETHandler(request: Request): Promise<Response> {
  const authorization = await authorizeTraderIntelligenceOwner({
    environment: process.env,
    modulePath: ROUTE_PATH,
    localRequest: { headers: request.headers, requestUrl: request.url },
  });
  if (!authorization.ok || authorization.config.persistence.kind !== "file") {
    return Response.json({ error: { code: "import_repair_unavailable" } }, { status: 503 });
  }
  const service = resolveConfiguredServerRawBrokerCsvImportService({
    owner: authorization.owner,
    config: authorization.config,
    environment: process.env,
  });
  if (!service.ok) {
    return Response.json({ error: { code: "import_repair_unavailable" } }, { status: 503 });
  }
  const statements = listImportRepairRecords({
    parentPath: authorization.config.persistence.parentPath,
    canonicalOwnerKey: service.value.canonicalOwnerKey,
    canonicalAccountKey: service.value.canonicalAccountKey,
  }).map((record) => ({
    persistenceDigest: record.persistenceDigest,
    broker: record.brokerCode,
    rows: record.rows,
    documentIssues: record.documentIssues,
  }));
  return Response.json({ contractVersion: "ti_v3_import_repair_reader_v1", statements });
}

export const GET = withTraderIntelligenceOwnerRoute(ROUTE_PATH, GETHandler);

async function POSTHandler(request: Request): Promise<Response> {
  const authorization = await authorizeTraderIntelligenceOwner({
    environment: process.env,
    modulePath: ROUTE_PATH,
    localRequest: { headers: request.headers, requestUrl: request.url },
  });
  if (!authorization.ok || authorization.config.persistence.kind !== "file") {
    return Response.json({ error: { code: "import_repair_unavailable" } }, { status: 503 });
  }
  const service = resolveConfiguredServerRawBrokerCsvImportService({
    owner: authorization.owner,
    config: authorization.config,
    environment: process.env,
  });
  if (!service.ok) {
    return Response.json({ error: { code: "import_repair_unavailable" } }, { status: 503 });
  }
  let payload: unknown;
  try { payload = JSON.parse(await request.text()); } catch { payload = null; }
  const digest = typeof payload === "object" && payload !== null
    ? (payload as { persistenceDigest?: unknown }).persistenceDigest
    : null;
  if (typeof digest !== "string") {
    return Response.json({ error: { code: "import_repair_mutation_invalid" } }, { status: 400 });
  }
  const statement = readImportRepairRecord({
    parentPath: authorization.config.persistence.parentPath,
    persistenceDigest: digest,
  });
  if (statement === null) {
    return Response.json({ error: { code: "import_repair_statement_not_found" } }, { status: 404 });
  }
  const validated = validateImportRepairMutation(payload, statement);
  if (!validated.ok) {
    return Response.json({ error: validated.error }, { status: 400 });
  }
  const oldDigest = digest as CanonicalContentDigest;
  const source = service.value.read(oldDigest);
  if (!source.ok) {
    return Response.json({ error: { code: "import_repair_statement_not_found" } }, { status: 404 });
  }
  const replacement = buildImportRepairReplacement({
    source: source.value,
    statement,
    mutation: validated.value,
  });
  const persisted = service.value.persist({
    csvUtf8: new TextEncoder().encode(replacement.normalizedCsv),
    sourceIdentity: `source_repair_${createHash("sha256")
      .update(`${digest}:${replacement.normalizedCsv}`, "utf8").digest("hex")}`,
    sourceSystem: source.value.sourceSystem,
    brokerCode: source.value.brokerCode,
    columnMapping: source.value.columnMapping,
    defaultCurrency: source.value.defaultCurrency ?? undefined,
    timestampPrecision: source.value.timestampPrecision,
    sourceTimezoneEvidence: source.value.sourceTimezoneEvidence,
    chargeCoverageState: replacement.chargeCoverageState,
  });
  if (!persisted.ok) {
    return Response.json({ error: { code: "import_repair_replacement_invalid" } }, { status: 422 });
  }
  const nextStatement = Object.freeze({
    ...statement,
    persistenceDigest: persisted.value.persistenceDigest,
    rows: replacement.rows,
  });
  if (!writeImportRepairRecord({
    parentPath: authorization.config.persistence.parentPath,
    record: nextStatement,
  })) {
    service.value.remove(persisted.value.persistenceDigest);
    return Response.json({ error: { code: "import_repair_replacement_write_failed" } }, { status: 409 });
  }
  const catalog = readConfiguredImportCatalog({
    parentPath: authorization.config.persistence.parentPath,
    canonicalOwnerKey: service.value.canonicalOwnerKey,
    canonicalAccountKey: service.value.canonicalAccountKey,
  });
  const proposed = [
    ...catalog.map(({ record }) => record)
      .filter((record) =>
        record.persistenceDigest !== oldDigest &&
        record.persistenceDigest !== persisted.value.persistenceDigest),
    persisted.value,
  ];
  if (!writeConfiguredImportAuthorityBinding({
    parentPath: authorization.config.persistence.parentPath,
    records: proposed,
  })) {
    service.value.remove(persisted.value.persistenceDigest);
    removeImportRepairRecord({
      parentPath: authorization.config.persistence.parentPath,
      persistenceDigest: persisted.value.persistenceDigest,
      canonicalOwnerKey: service.value.canonicalOwnerKey,
      canonicalAccountKey: service.value.canonicalAccountKey,
    });
    return Response.json({ error: { code: "import_repair_recheck_failed" } }, { status: 409 });
  }
  const oldSourceRemoved = service.value.remove(oldDigest);
  const oldRepairRemoved = oldSourceRemoved.ok && removeImportRepairRecord({
    parentPath: authorization.config.persistence.parentPath,
    persistenceDigest: digest,
    canonicalOwnerKey: service.value.canonicalOwnerKey,
    canonicalAccountKey: service.value.canonicalAccountKey,
  });
  if (!oldSourceRemoved.ok || !oldRepairRemoved) {
    if (oldSourceRemoved.ok) {
      service.value.persist({
        csvUtf8: new Uint8Array(Buffer.from(source.value.sourceBytesBase64, "base64")),
        sourceIdentity: source.value.sourceIdentity,
        sourceSystem: source.value.sourceSystem,
        brokerCode: source.value.brokerCode,
        columnMapping: source.value.columnMapping,
        defaultCurrency: source.value.defaultCurrency ?? undefined,
        timestampPrecision: source.value.timestampPrecision,
        sourceTimezoneEvidence: source.value.sourceTimezoneEvidence,
        chargeCoverageState: source.value.chargeCoverageState,
      });
    }
    service.value.remove(persisted.value.persistenceDigest);
    removeImportRepairRecord({
      parentPath: authorization.config.persistence.parentPath,
      persistenceDigest: persisted.value.persistenceDigest,
      canonicalOwnerKey: service.value.canonicalOwnerKey,
      canonicalAccountKey: service.value.canonicalAccountKey,
    });
    writeConfiguredImportAuthorityBinding({
      parentPath: authorization.config.persistence.parentPath,
      records: catalog.map(({ record }) => record),
    });
    return Response.json({ error: { code: "import_repair_cleanup_failed" } }, { status: 409 });
  }
  return Response.json({
    contractVersion: IMPORT_REPAIR_MUTATION_VERSION,
    status: "repaired",
    statement: {
      persistenceDigest: nextStatement.persistenceDigest,
      broker: nextStatement.brokerCode,
      rows: nextStatement.rows,
      documentIssues: nextStatement.documentIssues,
    },
  });
}

export const POST = withTraderIntelligenceOwnerRoute(ROUTE_PATH, POSTHandler);

async function DELETEHandler(request: Request): Promise<Response> {
  let persistenceDigest = "";
  try {
    const value: unknown = JSON.parse(await request.text());
    if (
      typeof value === "object" &&
      value !== null &&
      typeof (value as { persistenceDigest?: unknown }).persistenceDigest === "string"
    ) {
      persistenceDigest = (value as { persistenceDigest: string }).persistenceDigest;
    }
  } catch {
    persistenceDigest = "";
  }
  const authorization = await authorizeTraderIntelligenceOwner({
    environment: process.env,
    modulePath: ROUTE_PATH,
    localRequest: { headers: request.headers, requestUrl: request.url },
  });
  if (
    !authorization.ok ||
    authorization.config.persistence.kind !== "file" ||
    !/^ti_v3:canonical_content:v1:sha256:[0-9a-f]{64}$/.test(persistenceDigest)
  ) {
    return Response.json({ error: { code: "import_repair_delete_invalid" } }, { status: 400 });
  }
  const service = resolveConfiguredServerRawBrokerCsvImportService({
    owner: authorization.owner,
    config: authorization.config,
    environment: process.env,
  });
  if (!service.ok) {
    return Response.json({ error: { code: "import_repair_unavailable" } }, { status: 503 });
  }
  const repair = readImportRepairRecord({
    parentPath: authorization.config.persistence.parentPath,
    persistenceDigest,
  });
  const canonicalDigest = persistenceDigest as CanonicalContentDigest;
  const source = service.value.read(canonicalDigest);
  if (
    repair === null ||
    !source.ok ||
    repair.canonicalOwnerKey !== service.value.canonicalOwnerKey ||
    repair.canonicalAccountKey !== service.value.canonicalAccountKey
  ) {
    return Response.json({ error: { code: "import_repair_statement_not_found" } }, { status: 404 });
  }
  const catalog = readConfiguredImportCatalog({
    parentPath: authorization.config.persistence.parentPath,
    canonicalOwnerKey: service.value.canonicalOwnerKey,
    canonicalAccountKey: service.value.canonicalAccountKey,
  });
  const remaining = catalog
    .map(({ record }) => record)
    .filter((record) => record.persistenceDigest !== persistenceDigest);
  if (!writeConfiguredImportAuthorityBinding({
    parentPath: authorization.config.persistence.parentPath,
    records: remaining,
  })) {
    return Response.json({ error: { code: "import_repair_recheck_failed" } }, { status: 409 });
  }
  const removedSource = service.value.remove(canonicalDigest);
  const removedRepair = removedSource.ok && removeImportRepairRecord({
    parentPath: authorization.config.persistence.parentPath,
    persistenceDigest,
    canonicalOwnerKey: service.value.canonicalOwnerKey,
    canonicalAccountKey: service.value.canonicalAccountKey,
  });
  if (!removedSource.ok || !removedRepair) {
    if (removedSource.ok) {
      service.value.persist({
        csvUtf8: new Uint8Array(Buffer.from(source.value.sourceBytesBase64, "base64")),
        sourceIdentity: source.value.sourceIdentity,
        sourceSystem: source.value.sourceSystem,
        brokerCode: source.value.brokerCode,
        columnMapping: source.value.columnMapping,
        defaultCurrency: source.value.defaultCurrency ?? undefined,
        timestampPrecision: source.value.timestampPrecision,
        sourceTimezoneEvidence: source.value.sourceTimezoneEvidence,
        chargeCoverageState: source.value.chargeCoverageState,
      });
    }
    writeConfiguredImportAuthorityBinding({
      parentPath: authorization.config.persistence.parentPath,
      records: catalog.map(({ record }) => record),
    });
    return Response.json({ error: { code: "import_repair_delete_failed" } }, { status: 409 });
  }
  return Response.json({
    contractVersion: "ti_v3_import_repair_delete_v1",
    status: "deleted",
    persistenceDigest,
  });
}

export const DELETE = withTraderIntelligenceOwnerRoute(
  ROUTE_PATH,
  DELETEHandler,
);
