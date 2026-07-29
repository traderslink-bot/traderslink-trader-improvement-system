import "server-only";

import { readFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";

import type { TraderIntelligenceOwnerContext } from "../../domain";
import type { CanonicalContentDigest } from "../../domain/identity";
import type {
  TraderIntelligenceDeploymentConfig,
  TraderIntelligenceEnvironment,
} from "../../deployment";
import {
  buildObservedPeriodAnalyticsAuthorityAttachment,
  canonicalOwnerKeyForServerImport,
  createNeonPreviewExecutionSourceStore,
  createPersistedExecutionAnalyticsAuthoritySource,
  resolveConfiguredServerRawBrokerCsvImportService,
  type PersistedExecutionAnalyticsAuthorityAttachment,
} from "../../ingestion";
import { buildAnalyticalPartitionReceipt } from "../dataset";
import {
  createSnapshotTradeQueryDatasetSource,
  tradeQueryAuthorityInput,
  TRADE_QUERY_PLAN_KEY,
  TRADE_QUERY_PLAN_SEMANTIC_VERSION,
  TRADE_QUERY_PLAN_VERSION,
  TRADE_QUERY_POLICY,
  type TradeQueryFilter,
  type TradeQueryGrouping,
  type TradeQueryMetricKey,
  type VerifiedTradeQueryDatasetSource,
} from "../query";
import {
  createServerExecutionAnalyticsDashboardAdapter,
  type ServerExecutionAnalyticsDashboardAdapter,
} from "./server-execution-analytics-dashboard-adapter";

export const CONFIGURED_DASHBOARD_ANALYTICS_BINDING_VERSION =
  "ti_v3_configured_dashboard_analytics_binding_v1" as const;

export type ConfiguredDashboardAnalyticsFailure = Readonly<{
  code:
    | "ti_v3_dashboard_analytics_binding_missing"
    | "ti_v3_dashboard_analytics_binding_invalid"
    | "ti_v3_dashboard_analytics_source_unavailable"
    | "ti_v3_dashboard_analytics_query_authority_unavailable";
  path: string;
}>;

export interface ConfiguredDashboardAnalytics {
  readonly source: VerifiedTradeQueryDatasetSource;
  readonly adapter: ServerExecutionAnalyticsDashboardAdapter;
  readonly currencies: readonly string[];
}

export interface DashboardQueryPlanSelection {
  readonly filters?: readonly TradeQueryFilter[];
  readonly grouping?: TradeQueryGrouping;
  readonly metrics: readonly TradeQueryMetricKey[];
}

type BindingDocument = Readonly<{
  schemaVersion: typeof CONFIGURED_DASHBOARD_ANALYTICS_BINDING_VERSION;
  persistenceDigests: readonly CanonicalContentDigest[];
  attachment: PersistedExecutionAnalyticsAuthorityAttachment;
}>;

function failure(
  code: ConfiguredDashboardAnalyticsFailure["code"],
  path: string,
): { readonly ok: false; readonly error: ConfiguredDashboardAnalyticsFailure } {
  return { ok: false, error: { code, path } };
}

function bindingPath(
  environment: TraderIntelligenceEnvironment,
  config: TraderIntelligenceDeploymentConfig,
): string | null {
  if (config.persistence.kind !== "file") return null;
  const configured = environment.TRADER_INTELLIGENCE_V3_ANALYTICS_BINDING_PATH?.trim();
  if (configured !== undefined && configured.length > 0) {
    if (!isAbsolute(configured)) return null;
    return resolve(configured);
  }
  return join(
    config.persistence.parentPath,
    "trader-intelligence-v3-execution-analytics",
    "current-authority.json",
  );
}

function readBinding(path: string): BindingDocument | null {
  try {
    const value: unknown = JSON.parse(readFileSync(path, "utf8"));
    if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    if (
      record.schemaVersion !== CONFIGURED_DASHBOARD_ANALYTICS_BINDING_VERSION ||
      !Array.isArray(record.persistenceDigests) ||
      record.persistenceDigests.length === 0 ||
      record.persistenceDigests.some((digest) =>
        typeof digest !== "string" ||
        !/^ti_v3:canonical_content:v1:sha256:[0-9a-f]{64}$/.test(digest)) ||
      typeof record.attachment !== "object" ||
      record.attachment === null ||
      Array.isArray(record.attachment)
    ) return null;
    return value as BindingDocument;
  } catch {
    return null;
  }
}

/**
 * Resolves one fixed local execution authority. Owner/account scope and the
 * binding path remain server-held; the browser can never select either.
 */
export async function resolveConfiguredDashboardAnalytics(args: {
  readonly owner: TraderIntelligenceOwnerContext;
  readonly config: TraderIntelligenceDeploymentConfig;
  readonly environment: TraderIntelligenceEnvironment;
}): Promise<{ readonly ok: true; readonly value: ConfiguredDashboardAnalytics } | {
  readonly ok: false;
  readonly error: ConfiguredDashboardAnalyticsFailure;
}> {
  if (args.config.persistence.kind === "private_database") {
    const accountKey = args.environment.TRADER_INTELLIGENCE_V3_EXECUTION_ACCOUNT_KEY?.trim();
    if (
      args.owner.identity.ownerId !== args.config.ownerId ||
      args.config.dataMode !== "real_owner_data" ||
      !accountKey ||
      !/^account_[a-z0-9][a-z0-9_-]{0,87}$/.test(accountKey)
    ) {
      return failure("ti_v3_dashboard_analytics_source_unavailable", "$.authorization");
    }
    const store = await createNeonPreviewExecutionSourceStore(args.environment);
    if (!store.ok) {
      return failure("ti_v3_dashboard_analytics_source_unavailable", store.error.path);
    }
    const records = await store.value.list({
      canonicalOwnerKey: canonicalOwnerKeyForServerImport(args.owner),
      canonicalAccountKey: accountKey,
    });
    if (!records.ok || records.value.length === 0) {
      return failure("ti_v3_dashboard_analytics_source_unavailable", "$.source");
    }
    const attachment = buildObservedPeriodAnalyticsAuthorityAttachment(
      records.value.map(({ record }) => record),
    );
    if (!attachment.ok) {
      return failure("ti_v3_dashboard_analytics_source_unavailable", attachment.error.path);
    }
    const source = createSnapshotTradeQueryDatasetSource(
      createPersistedExecutionAnalyticsAuthoritySource({
        records: records.value.map(({ record }) => record),
        attachment: attachment.value,
      }),
    );
    const verified = source.readVerifiedDataset();
    if (!verified.ok) return failure("ti_v3_dashboard_analytics_source_unavailable", "$.source");
    const currencies = Object.freeze(
      [...new Set(verified.value.datasetReceipt.rows.map((row) => row.currency))].sort(),
    );
    if (currencies.length === 0) {
      return failure("ti_v3_dashboard_analytics_source_unavailable", "$.currencies");
    }
    return {
      ok: true,
      value: Object.freeze({
        source,
        adapter: createServerExecutionAnalyticsDashboardAdapter(source),
        currencies,
      }),
    };
  }
  const path = bindingPath(args.environment, args.config);
  if (path === null) return failure("ti_v3_dashboard_analytics_binding_invalid", "$.bindingPath");
  const binding = readBinding(path);
  if (binding === null) return failure("ti_v3_dashboard_analytics_binding_missing", "$.binding");
  const imports = resolveConfiguredServerRawBrokerCsvImportService(args);
  if (!imports.ok) return failure("ti_v3_dashboard_analytics_source_unavailable", imports.error.path);
  const authority = imports.value.createAnalyticsAuthoritySource(
    binding.persistenceDigests,
    binding.attachment,
  );
  if (!authority.ok) return failure("ti_v3_dashboard_analytics_source_unavailable", authority.error.path);
  const source = createSnapshotTradeQueryDatasetSource(authority.value);
  const verified = source.readVerifiedDataset();
  if (!verified.ok) return failure("ti_v3_dashboard_analytics_source_unavailable", "$.source");
  const currencies = Object.freeze(
    [...new Set(verified.value.datasetReceipt.rows.map((row) => row.currency))].sort(),
  );
  if (currencies.length === 0) {
    return failure("ti_v3_dashboard_analytics_source_unavailable", "$.currencies");
  }
  return {
    ok: true,
    value: Object.freeze({
      source,
      adapter: createServerExecutionAnalyticsDashboardAdapter(source),
      currencies,
    }),
  };
}

/** Injects exact server authority into a safe dashboard query selection. */
export function buildConfiguredDashboardQueryPlan(
  analytics: ConfiguredDashboardAnalytics,
  currency: string,
  selection: DashboardQueryPlanSelection,
): { readonly ok: true; readonly value: unknown } | {
  readonly ok: false;
  readonly error: ConfiguredDashboardAnalyticsFailure;
} {
  const verified = analytics.source.readVerifiedDataset();
  if (!verified.ok) return failure("ti_v3_dashboard_analytics_query_authority_unavailable", "$.source");
  const partition = buildAnalyticalPartitionReceipt({
    schemaVersion: "ti_v3_analytical_partition_v1",
    datasetReceipt: verified.value.datasetReceipt,
    currency,
  });
  if (!partition.ok) return failure("ti_v3_dashboard_analytics_query_authority_unavailable", "$.currency");
  const authority = {
    datasetReceipt: verified.value.datasetReceipt,
    datasetDerivationReceipt: verified.value.derivationReceipt,
    partitionReceipt: partition.value,
  };
  return {
    ok: true,
    value: Object.freeze({
      schemaVersion: TRADE_QUERY_PLAN_VERSION,
      queryPlanKey: TRADE_QUERY_PLAN_KEY,
      queryPlanVersion: TRADE_QUERY_PLAN_SEMANTIC_VERSION,
      authority: tradeQueryAuthorityInput(authority),
      filters: selection.filters ?? [],
      grouping: selection.grouping ?? { kind: "aggregate" },
      metrics: selection.metrics,
      ordering: [{ by: "group_identity", metricKey: null, direction: "ascending" }],
      limits: {
        groupLimit: "256",
        resultRowLimit: "256",
        evidencePerGroup: "8",
        totalEvidenceLimit: "512",
        diagnosticLimit: "128",
      },
      policies: TRADE_QUERY_POLICY,
    }),
  };
}
