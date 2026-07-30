import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

import {
  buildObservedPeriodAnalyticsAuthorityAttachment,
} from "./persisted-execution-analytics-authority";
import {
  parsePersistedRawBrokerCsvImport,
  type PersistedRawBrokerCsvImport,
} from "./persisted-raw-broker-csv-import";

const BINDING_VERSION = "ti_v3_configured_dashboard_analytics_binding_v1";

export type ConfiguredImportCatalogItem = Readonly<{
  record: PersistedRawBrokerCsvImport;
  importedAt: string;
}>;

export function readConfiguredImportCatalog(args: Readonly<{
  parentPath: string;
  canonicalOwnerKey: string;
  canonicalAccountKey: string;
}>): readonly ConfiguredImportCatalogItem[] {
  const directory = join(
    args.parentPath,
    "trader-intelligence-v3-execution-source-documents",
  );
  try {
    const records = readdirSync(directory)
      .filter((name) => name.endsWith(".json"))
      .flatMap((name) => {
        const path = join(directory, name);
        try {
          const parsed = parsePersistedRawBrokerCsvImport(
            readFileSync(path, "utf8"),
          );
          return parsed.ok &&
            parsed.value.canonicalOwnerKey === args.canonicalOwnerKey &&
            parsed.value.canonicalAccountKey === args.canonicalAccountKey
            ? [{ record: parsed.value, importedAt: statSync(path).mtime.toISOString() }]
            : [];
        } catch {
          return [];
        }
      })
      .sort((left, right) => right.importedAt.localeCompare(left.importedAt));
    const seen = new Set<string>();
    return records.filter(({ record }) => {
      if (seen.has(record.sourceDocumentDigest)) return false;
      seen.add(record.sourceDocumentDigest);
      return true;
    });
  } catch {
    return [];
  }
}

export function writeConfiguredImportAuthorityBinding(args: Readonly<{
  parentPath: string;
  records: readonly PersistedRawBrokerCsvImport[];
}>): boolean {
  if (args.records.length === 0) {
    const path = join(
      args.parentPath,
      "trader-intelligence-v3-execution-analytics",
      "current-authority.json",
    );
    try {
      if (existsSync(path)) unlinkSync(path);
      return true;
    } catch {
      return false;
    }
  }
  const attachment = buildObservedPeriodAnalyticsAuthorityAttachment(args.records);
  return attachment.ok
    ? writeBinding(args.parentPath, args.records, attachment.value)
    : false;
}

function writeBinding(
  parentPath: string,
  records: readonly PersistedRawBrokerCsvImport[],
  attachment: NonNullable<unknown>,
): boolean {
  const directory = join(parentPath, "trader-intelligence-v3-execution-analytics");
  const path = join(directory, "current-authority.json");
  const temporary = join(directory, ".current-authority.pending");
  try {
    mkdirSync(directory, { recursive: true });
    writeFileSync(temporary, JSON.stringify({
      schemaVersion: BINDING_VERSION,
      persistenceDigests: records.map((record) => record.persistenceDigest).sort(),
      attachment,
    }), "utf8");
    renameSync(temporary, path);
    return true;
  } catch {
    return false;
  }
}
