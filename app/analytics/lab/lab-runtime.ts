import "server-only";

import { readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  buildAnalyticalPartitionReceipt,
  buildSyntheticQueryFixture,
  createSnapshotTradeQueryDatasetSource,
  TRADE_QUERY_PLAN_KEY,
  TRADE_QUERY_PLAN_SEMANTIC_VERSION,
  TRADE_QUERY_PLAN_VERSION,
  TRADE_QUERY_POLICY,
  tradeQueryAuthorityInput,
  type SyntheticQueryPlanOptions,
  type SyntheticRawQueryPlan,
  type VerifiedTradeQueryDatasetSource,
  type ReadOnlySnapshotAuthoritySource,
} from "@/src/lib/trader-intelligence-v3/analytics";
import {
  requireTraderIntelligenceOwnerPageAccess,
} from "@/src/lib/trader-intelligence-v3/auth";
import {
  validateTraderIntelligenceDeployment,
} from "@/src/lib/trader-intelligence-v3/deployment";
import {
  createPersistedExecutionAnalyticsAuthoritySource,
  parsePersistedRawBrokerCsvImport,
  resolveConfiguredServerRawBrokerCsvImportService,
  type PersistedExecutionAnalyticsAuthorityAttachment,
  type PersistedRawBrokerCsvImport,
} from "@/src/lib/trader-intelligence-v3/ingestion";
import type { CanonicalContentDigest } from "@/src/lib/trader-intelligence-v3/domain";
import {
  buildCanonicalExecution,
  buildStartingInventoryForExecution,
} from "@/src/lib/trader-intelligence-v3/domain";

export type AnalyticsLabRuntime = {
  source: VerifiedTradeQueryDatasetSource;
  currency: string;
  canonicalOwnerKey: string;
  canonicalAccountKey: string;
  authorityDirectory: string;
  minimumDate: string;
  maximumDate: string;
  symbols: string[];
  dataMode: "persisted" | "sample";
  unavailableReason: string | null;
  plan: (options?: SyntheticQueryPlanOptions) => SyntheticRawQueryPlan;
};

type AuthorityBinding = {
  schemaVersion: "ti_v3_configured_dashboard_analytics_binding_v1";
  persistenceDigests: CanonicalContentDigest[];
  attachment: PersistedExecutionAnalyticsAuthorityAttachment;
};

type CachedRuntime = {
  key: string;
  runtime: AnalyticsLabRuntime;
};

const analyticsLabGlobal = globalThis as typeof globalThis & {
  __traderIntelligenceAnalyticsLabRuntime?: CachedRuntime;
  __traderIntelligenceAnalyticsLabFallback?: CachedRuntime;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseAuthorityBinding(path: string): AuthorityBinding {
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (
    !isRecord(parsed) ||
    parsed.schemaVersion !== "ti_v3_configured_dashboard_analytics_binding_v1" ||
    !Array.isArray(parsed.persistenceDigests) ||
    parsed.persistenceDigests.length === 0 ||
    parsed.persistenceDigests.some(
      (digest) =>
        typeof digest !== "string" ||
        !/^ti_v3:canonical_content:v1:sha256:[a-f0-9]{64}$/.test(digest),
    ) ||
    !isRecord(parsed.attachment)
  ) {
    throw new Error("Analytics Lab authority binding is invalid.");
  }
  return {
    schemaVersion: parsed.schemaVersion,
    persistenceDigests:
      parsed.persistenceDigests as CanonicalContentDigest[],
    attachment:
      parsed.attachment as unknown as PersistedExecutionAnalyticsAuthorityAttachment,
  };
}

function configuredAuthorityDirectory(parentPath: string): string {
  const configured =
    process.env.TRADER_INTELLIGENCE_V3_EXECUTION_ANALYTICS_ROOT?.trim();
  return configured
    ? resolve(configured)
    : join(parentPath, "trader-intelligence-v3-execution-analytics");
}

function localDevelopmentAuthorityDirectory(): string {
  return join(
    process.cwd(),
    "data",
    "v3-dashboard",
    "trader-intelligence-v3-execution-analytics",
  );
}

function developmentAuthority(
  binding: AuthorityBinding,
): {
  source: ReturnType<typeof createPersistedExecutionAnalyticsAuthoritySource>;
  canonicalOwnerKey: string;
  canonicalAccountKey: string;
} {
  const identities = binding.attachment.startingInventories.map(
    (inventory) => inventory.ledgerIdentity,
  );
  const canonicalOwnerKey = identities[0]?.canonicalOwnerKey;
  const canonicalAccountKey = identities[0]?.canonicalAccountKey;
  if (
    !canonicalOwnerKey ||
    !canonicalAccountKey ||
    !/^owner_[a-z0-9][a-z0-9_-]{0,89}$/.test(canonicalOwnerKey) ||
    !/^account_[a-z0-9][a-z0-9_-]{0,87}$/.test(canonicalAccountKey) ||
    identities.some(
      (identity) =>
        identity.canonicalOwnerKey !== canonicalOwnerKey ||
        identity.canonicalAccountKey !== canonicalAccountKey,
    )
  ) {
    throw new Error("Analytics Lab development authority is invalid.");
  }
  const sourceDirectory = join(
    process.cwd(),
    "data",
    "v3-dashboard",
    "trader-intelligence-v3-execution-source-documents",
  );
  const records: PersistedRawBrokerCsvImport[] = [];
  const earliestByLedger = new Map<
    string,
    PersistedRawBrokerCsvImport["acceptedExecutions"][number]
  >();
  for (const persistenceDigest of binding.persistenceDigests) {
    const fileDigest = persistenceDigest.split(":").at(-1);
    if (!fileDigest) {
      throw new Error("Analytics Lab persistence digest is invalid.");
    }
    const record = parsePersistedRawBrokerCsvImport(
      readFileSync(join(sourceDirectory, `${fileDigest}.json`), "utf8"),
    );
    if (
      !record.ok ||
      record.value.persistenceDigest !== persistenceDigest ||
      record.value.canonicalOwnerKey !== canonicalOwnerKey ||
      record.value.canonicalAccountKey !== canonicalAccountKey
    ) {
      throw new Error("Analytics Lab execution source is invalid.");
    }
    records.push(record.value);
    for (const execution of record.value.acceptedExecutions) {
      const instrument = execution.content.stableInstrumentKey;
      if (!instrument) continue;
      const ledgerKey = [
        execution.content.canonicalOwnerKey,
        execution.content.canonicalAccountKey,
        instrument,
        execution.content.currency,
      ].join("|");
      const current = earliestByLedger.get(ledgerKey);
      if (
        !current ||
        execution.content.executedAt < current.content.executedAt
      ) {
        earliestByLedger.set(ledgerKey, execution);
      }
    }
  }
  const startingInventories =
    binding.attachment.startingInventories.map((inventory) => {
      const identity = inventory.ledgerIdentity;
      const execution = earliestByLedger.get(
        [
          identity.canonicalOwnerKey,
          identity.canonicalAccountKey,
          identity.stableInstrumentKey,
          identity.currency,
        ].join("|"),
      );
      if (!execution) {
        throw new Error("Analytics Lab starting inventory is incomplete.");
      }
      const canonicalExecution = buildCanonicalExecution({
        ...execution.content,
        validation: execution.validation,
      });
      if (
        !canonicalExecution.ok ||
        canonicalExecution.value.canonicalContentDigest !==
          execution.canonicalContentDigest
      ) {
        throw new Error("Analytics Lab canonical execution is invalid.");
      }
      const rebuilt = buildStartingInventoryForExecution(
        canonicalExecution.value,
        inventory.state === "unknown" ? "unknown" : "proven_flat",
      );
      if (!rebuilt.ok) {
        throw new Error(
          `Analytics Lab starting inventory is invalid for ${identity.stableInstrumentKey}: ${rebuilt.error.reasonCodes.join(",")}`,
        );
      }
      return rebuilt.value;
    });
  return {
    source: createPersistedExecutionAnalyticsAuthoritySource({
      records,
      attachment: {
        ...binding.attachment,
        startingInventories,
      },
    }),
    canonicalOwnerKey,
    canonicalAccountKey,
  };
}

async function resolvePersistedAnalyticsLabRuntime(): Promise<AnalyticsLabRuntime> {
  const deployment = validateTraderIntelligenceDeployment(process.env);
  let authorityDirectory =
    process.env.NODE_ENV === "production"
      ? ""
      : localDevelopmentAuthorityDirectory();
  let bindingPath = join(authorityDirectory, "current-authority.json");
  let canonicalOwnerKey: string;
  let canonicalAccountKey: string;
  let authoritySource: ReadOnlySnapshotAuthoritySource;

  if (deployment.ok) {
    const owner = await requireTraderIntelligenceOwnerPageAccess();
    const configuredService =
      resolveConfiguredServerRawBrokerCsvImportService({
        owner,
        config: deployment.config,
        environment: process.env,
      });
    if (!configuredService.ok) {
      throw new Error(configuredService.error.code);
    }
    const service = configuredService.value;
    authorityDirectory = configuredAuthorityDirectory(
      deployment.config.persistence.kind === "file"
        ? deployment.config.persistence.parentPath
        : "",
    );
    bindingPath = join(authorityDirectory, "current-authority.json");
    let useDevelopmentBinding = false;
    try {
      statSync(bindingPath);
    } catch {
      if (process.env.NODE_ENV === "production") {
        throw new Error("Analytics Lab authority is unavailable.");
      }
      authorityDirectory = localDevelopmentAuthorityDirectory();
      bindingPath = join(authorityDirectory, "current-authority.json");
      statSync(bindingPath);
      useDevelopmentBinding = true;
    }
    const binding = parseAuthorityBinding(bindingPath);
    if (useDevelopmentBinding) {
      const development = developmentAuthority(binding);
      if (
        development.canonicalOwnerKey !== service.canonicalOwnerKey ||
        development.canonicalAccountKey !== service.canonicalAccountKey
      ) {
        throw new Error("Analytics Lab development scope is invalid.");
      }
      authoritySource = development.source;
    } else {
      const configuredAuthority = service.createAnalyticsAuthoritySource(
        binding.persistenceDigests,
        binding.attachment,
      );
      if (!configuredAuthority.ok) {
        throw new Error(configuredAuthority.error.code);
      }
      authoritySource = configuredAuthority.value;
    }
    canonicalOwnerKey = service.canonicalOwnerKey;
    canonicalAccountKey = service.canonicalAccountKey;
  } else {
    if (process.env.NODE_ENV === "production") {
      throw new Error(deployment.code);
    }
    statSync(bindingPath);
    const binding = parseAuthorityBinding(bindingPath);
    const development = developmentAuthority(binding);
    authoritySource = development.source;
    canonicalOwnerKey = development.canonicalOwnerKey;
    canonicalAccountKey = development.canonicalAccountKey;
  }

  const modifiedAt = statSync(bindingPath).mtimeMs;
  const cacheKey = [
    bindingPath,
    modifiedAt,
    canonicalOwnerKey,
    canonicalAccountKey,
  ].join(":");
  if (analyticsLabGlobal.__traderIntelligenceAnalyticsLabRuntime?.key === cacheKey) {
    return analyticsLabGlobal.__traderIntelligenceAnalyticsLabRuntime.runtime;
  }

  const exactAuthority = authoritySource.readExactAuthority();
  if (exactAuthority.state === "unavailable") {
    throw new Error(exactAuthority.reasonCode);
  }
  const source = createSnapshotTradeQueryDatasetSource(authoritySource);
  const derived = source.readVerifiedDataset();
  if (!derived.ok) {
    throw new Error(`${derived.error.code}:${derived.error.path}`);
  }
  const currencies = [
    ...new Set(derived.value.datasetReceipt.rows.map((row) => row.currency)),
  ].sort();
  if (currencies.length !== 1) {
    throw new Error("Analytics Lab requires one currency partition.");
  }
  const currency = currencies[0];
  const partition = buildAnalyticalPartitionReceipt({
    schemaVersion: "ti_v3_analytical_partition_v1",
    datasetReceipt: derived.value.datasetReceipt,
    currency,
  });
  if (!partition.ok) {
    throw new Error(partition.error.code);
  }
  const queryAuthority = Object.freeze({
    datasetReceipt: derived.value.datasetReceipt,
    datasetDerivationReceipt: derived.value.derivationReceipt,
    partitionReceipt: partition.value,
  });
  const dates = derived.value.datasetReceipt.rows
    .map((row) => row.sessionDate)
    .sort();
  const symbols = [
    ...new Set(
      derived.value.datasetReceipt.rows.map((row) => row.displayedSymbol),
    ),
  ].sort();
  if (dates.length === 0) {
    throw new Error("Analytics Lab has no closed trades.");
  }

  const runtime: AnalyticsLabRuntime = Object.freeze({
    source,
    currency,
    canonicalOwnerKey,
    canonicalAccountKey,
    authorityDirectory,
    minimumDate: dates[0],
    maximumDate: dates[dates.length - 1],
    symbols,
    dataMode: "persisted",
    unavailableReason: null,
    plan: (options: SyntheticQueryPlanOptions = {}) => ({
      schemaVersion: TRADE_QUERY_PLAN_VERSION,
      queryPlanKey: TRADE_QUERY_PLAN_KEY,
      queryPlanVersion: TRADE_QUERY_PLAN_SEMANTIC_VERSION,
      authority: tradeQueryAuthorityInput(queryAuthority),
      filters: options.filters ?? [],
      grouping: options.grouping ?? { kind: "aggregate" },
      metrics: options.metrics ?? ["net_pnl", "total_trades"],
      ordering:
        options.ordering ?? [
          {
            by: "group_identity",
            metricKey: null,
            direction: "ascending",
          },
        ],
      limits: {
        groupLimit: options.limits?.groupLimit ?? "256",
        resultRowLimit: options.limits?.resultRowLimit ?? "256",
        evidencePerGroup: options.limits?.evidencePerGroup ?? "4",
        totalEvidenceLimit: options.limits?.totalEvidenceLimit ?? "256",
        diagnosticLimit: options.limits?.diagnosticLimit ?? "32",
      },
      policies: TRADE_QUERY_POLICY,
    }),
  });
  analyticsLabGlobal.__traderIntelligenceAnalyticsLabRuntime = {
    key: cacheKey,
    runtime,
  };
  return runtime;
}

function sampleAnalyticsLabRuntime(reason: string): AnalyticsLabRuntime {
  const authorityDirectory = localDevelopmentAuthorityDirectory();
  const bindingPath = join(authorityDirectory, "current-authority.json");
  const binding = parseAuthorityBinding(bindingPath);
  const identity =
    binding.attachment.startingInventories[0]?.ledgerIdentity;
  if (!identity) {
    throw new Error("Analytics Lab sample scope is unavailable.");
  }
  const modifiedAt = statSync(bindingPath).mtimeMs;
  const cacheKey = [bindingPath, modifiedAt, reason].join(":");
  if (analyticsLabGlobal.__traderIntelligenceAnalyticsLabFallback?.key === cacheKey) {
    return analyticsLabGlobal.__traderIntelligenceAnalyticsLabFallback.runtime;
  }
  const fixture = buildSyntheticQueryFixture(42);
  const runtime: AnalyticsLabRuntime = Object.freeze({
    source: fixture.source,
    currency: "USD",
    canonicalOwnerKey: identity.canonicalOwnerKey,
    canonicalAccountKey: identity.canonicalAccountKey,
    authorityDirectory,
    minimumDate: "2026-07-01",
    maximumDate: "2026-07-07",
    symbols: ["ALPHA", "BETA", "GAMMA"],
    dataMode: "sample",
    unavailableReason: reason,
    plan: fixture.plan,
  });
  analyticsLabGlobal.__traderIntelligenceAnalyticsLabFallback = {
    key: cacheKey,
    runtime,
  };
  return runtime;
}

export async function resolveAnalyticsLabRuntime(): Promise<AnalyticsLabRuntime> {
  try {
    return await resolvePersistedAnalyticsLabRuntime();
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw error;
    }
    return sampleAnalyticsLabRuntime(
      error instanceof Error
        ? error.message
        : "ti_v3_analytics_source_unavailable",
    );
  }
}
