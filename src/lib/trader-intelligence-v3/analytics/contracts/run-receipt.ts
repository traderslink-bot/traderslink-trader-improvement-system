import { compareUnicodeCodePoints } from "../../domain/canonical";
import type { ExactResult } from "../../domain/exact";
import type { CanonicalContentDigest } from "../../domain/identity";
import {
  contractFailure,
  finalizeContentAddressedAuthority,
  validateClaimedDigest,
  validateContractRecord,
  type AnalyticalContractFailure,
} from "./contract-validation";
import {
  verifyAnalyticalDiagnostics,
  verifyAnalyticalEvidenceBundle,
  type AnalyticalDiagnostics,
  type AnalyticalEvidenceBundle,
} from "./evidence-diagnostics";
import { getAnalysisRunContextDependencies, verifyAnalysisRunContext, type AnalysisRunContext } from "./run-context";
import {
  verifyChartReadySeries,
  verifyExactTable,
  verifyValidatedClaim,
  type ChartReadySeries,
  type ExactTable,
  type ValidatedClaim,
} from "./table-claim-series";

export const ANALYSIS_RUN_RECEIPT_VERSION = "ti_v3_analysis_run_receipt_v1" as const;

export interface AnalysisRunReceipt {
  readonly schemaVersion: typeof ANALYSIS_RUN_RECEIPT_VERSION;
  readonly runContextDigest: CanonicalContentDigest;
  readonly runStatus: "completed" | "limited" | "blocked";
  readonly partitionDigest: CanonicalContentDigest;
  readonly partitionCurrency: string;
  readonly tableDigests: readonly CanonicalContentDigest[];
  readonly claimDigests: readonly CanonicalContentDigest[];
  readonly seriesDigests: readonly CanonicalContentDigest[];
  readonly evidenceBundleDigests: readonly CanonicalContentDigest[];
  readonly includedCount: string;
  readonly excludedCount: string;
  readonly limitationCodes: readonly string[];
  readonly diagnosticsDigest: CanonicalContentDigest;
  readonly runDigest: CanonicalContentDigest;
}

export interface AnalysisRunArtifactGraph {
  readonly runContext: AnalysisRunContext;
  readonly tables: readonly ExactTable[];
  readonly claims: readonly ValidatedClaim[];
  readonly series: readonly ChartReadySeries[];
  readonly evidenceBundles: readonly AnalyticalEvidenceBundle[];
  readonly diagnostics: AnalyticalDiagnostics;
}

function unique<T>(values: readonly T[], key: (value: T) => string): boolean {
  return new Set(values.map(key)).size === values.length;
}

export function buildAnalysisRunReceipt(
  input: unknown,
): ExactResult<AnalysisRunReceipt, AnalyticalContractFailure> {
  const record = validateContractRecord(input, ["schemaVersion", "runContext", "tables", "claims", "series", "evidenceBundles", "diagnostics"]);
  if (!record.ok) return record;
  if (record.value.schemaVersion !== ANALYSIS_RUN_RECEIPT_VERSION) return contractFailure("ti_v3_analytics_contract_invalid", "$.schemaVersion");
  const authorities = input as Record<string, unknown>;
  const context = verifyAnalysisRunContext(authorities.runContext);
  if (!context.ok) return context;
  const dependencies = getAnalysisRunContextDependencies(context.value);
  if (dependencies === null) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.runContext");
  if (!Array.isArray(record.value.tables) || !Array.isArray(record.value.claims) || !Array.isArray(record.value.series) || !Array.isArray(record.value.evidenceBundles)) return contractFailure("ti_v3_analytics_contract_invalid", "$.artifacts");
  const suppliedEvidence = authorities.evidenceBundles as readonly AnalyticalEvidenceBundle[];
  const evidence: AnalyticalEvidenceBundle[] = [];
  for (let index = 0; index < suppliedEvidence.length; index += 1) {
    const verified = verifyAnalyticalEvidenceBundle(suppliedEvidence[index], context.value);
    if (!verified.ok) return contractFailure(verified.error.code, `$.evidenceBundles[${index}]${verified.error.path.slice(1)}`);
    evidence.push(verified.value);
  }
  if (!unique(evidence, (item) => item.bundleDigest)) return contractFailure("ti_v3_analytics_contract_duplicate_identity", "$.evidenceBundles");
  const tables: ExactTable[] = [];
  const suppliedTables = authorities.tables as readonly ExactTable[];
  for (let index = 0; index < suppliedTables.length; index += 1) {
    const verified = verifyExactTable(suppliedTables[index], context.value, evidence);
    if (!verified.ok) return contractFailure(verified.error.code, `$.tables[${index}]${verified.error.path.slice(1)}`);
    tables.push(verified.value);
  }
  if (!unique(tables, (item) => item.tableDigest)) return contractFailure("ti_v3_analytics_contract_duplicate_identity", "$.tables");
  const claims: ValidatedClaim[] = [];
  const suppliedClaims = authorities.claims as readonly ValidatedClaim[];
  for (let index = 0; index < suppliedClaims.length; index += 1) {
    const candidate = suppliedClaims[index];
    const table = tables.find((item) => item.tableDigest === candidate?.tableDigest);
    if (table === undefined) return contractFailure("ti_v3_analytics_contract_reference_mismatch", `$.claims[${index}].tableDigest`);
    const verified = verifyValidatedClaim(candidate, context.value, table, evidence, tables);
    if (!verified.ok) return contractFailure(verified.error.code, `$.claims[${index}]${verified.error.path.slice(1)}`);
    claims.push(verified.value);
  }
  if (!unique(claims, (item) => item.claimDigest)) return contractFailure("ti_v3_analytics_contract_duplicate_identity", "$.claims");
  const series: ChartReadySeries[] = [];
  const suppliedSeries = authorities.series as readonly ChartReadySeries[];
  for (let index = 0; index < suppliedSeries.length; index += 1) {
    const candidate = suppliedSeries[index];
    const table = tables.find((item) => item.tableDigest === candidate?.sourceTableDigest);
    if (table === undefined) return contractFailure("ti_v3_analytics_contract_reference_mismatch", `$.series[${index}].sourceTableDigest`);
    const verified = verifyChartReadySeries(candidate, context.value, table, evidence);
    if (!verified.ok) return contractFailure(verified.error.code, `$.series[${index}]${verified.error.path.slice(1)}`);
    series.push(verified.value);
  }
  if (!unique(series, (item) => item.seriesDigest)) return contractFailure("ti_v3_analytics_contract_duplicate_identity", "$.series");
  const diagnostics = verifyAnalyticalDiagnostics(authorities.diagnostics, context.value);
  if (!diagnostics.ok) return contractFailure(diagnostics.error.code, `$.diagnostics${diagnostics.error.path.slice(1)}`);
  const usedEvidence = new Set([
    ...tables.flatMap((table) => [...table.rows, ...table.summaryRows].map((row) => row.evidenceBundleDigest)),
    ...tables.flatMap((table) =>
      [...table.rows, ...table.summaryRows].flatMap((row) =>
        row.cells.flatMap((cell) =>
          cell.evidenceBundleDigest === undefined
            ? []
            : [cell.evidenceBundleDigest]),
      )),
    ...claims.flatMap((claim) => [...claim.evidenceBundleDigests, ...claim.counterexampleEvidenceBundleDigests]),
    ...series.flatMap((item) => item.points.map((point) => point.evidenceBundleDigest)),
  ]);
  if (evidence.some((bundle) => !usedEvidence.has(bundle.bundleDigest)) || [...usedEvidence].some((digest) => !evidence.some((bundle) => bundle.bundleDigest === digest))) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.evidenceBundles");
  const limitationCodes = [...new Set([
    ...dependencies.partitionReceipt.limitationCodes,
    ...tables.flatMap((item) => item.limitationCodes),
    ...claims.flatMap((item) => item.limitationCodes),
    ...series.flatMap((item) => item.limitationCodes),
    ...evidence.flatMap((item) => item.limitationCodes),
    ...diagnostics.value.entries.filter((entry) => entry.severity !== "info").map((entry) => entry.code),
  ])].sort(compareUnicodeCodePoints);
  const hasBlockedDiagnostic = diagnostics.value.entries.some(
    (entry) => entry.severity === "blocked",
  );
  if (
    (context.value.eligibilityState === "blocked" && !hasBlockedDiagnostic) ||
    (context.value.eligibilityState !== "blocked" && hasBlockedDiagnostic)
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_reference_mismatch",
      "$.diagnostics",
    );
  }
  const runStatus = context.value.eligibilityState === "blocked"
    ? "blocked"
    : context.value.eligibilityState === "limited" || limitationCodes.length > 0
      ? "limited"
      : "completed";
  const declared = new Set(dependencies.registryEntry.outputContracts);
  const artifactCounts = new Map([
    ["exact_table_v1", tables.length],
    ["validated_claim_v1", claims.length],
    ["chart_ready_series_v1", series.length],
    ["analytical_evidence_bundle_v1", evidence.length],
  ]);
  if (runStatus === "blocked") {
    if (!diagnostics.value.entries.some((entry) => entry.severity === "blocked")) {
      return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.diagnostics");
    }
    if (
      dependencies.registryEntry.blockedArtifactPolicy === "diagnostics_only" &&
      [...artifactCounts.values()].some((count) => count !== 0)
    ) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.artifacts");
    if (
      dependencies.registryEntry.blockedArtifactPolicy ===
        "declared_artifacts_optional" &&
      [...artifactCounts].some(([contract, count]) =>
        !declared.has(contract) && count !== 0)
    ) {
      return contractFailure(
        "ti_v3_analytics_contract_reference_mismatch",
        "$.artifacts",
      );
    }
  } else if (
    [...artifactCounts].some(([contract, count]) => {
      const optionalWhenLimited =
        runStatus === "limited" &&
        dependencies.registryEntry.optionalOutputContractsWhenLimited.includes(
          contract,
        );
      return (
        (declared.has(contract) && count === 0 && !optionalWhenLimited) ||
        (!declared.has(contract) && count !== 0)
      );
    })
  ) {
    return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.artifacts");
  }
  const graphKeys = new Set<string>([
    context.value.runContextDigest,
    context.value.partitionDigest,
    ...tables.flatMap((item) => [item.tableKey, item.tableDigest]),
    ...claims.flatMap((item) => [item.claimKey, item.claimDigest]),
    ...series.flatMap((item) => [item.seriesKey, item.seriesDigest]),
    ...evidence.flatMap((item) => [item.evidenceKey, item.bundleDigest]),
  ]);
  if (
    diagnostics.value.entries.some((entry) =>
      entry.affectedKeys.some((key) =>
        !graphKeys.has(key) && !key.startsWith("non_reference:")))
  ) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.diagnostics.entries.affectedKeys");
  return finalizeContentAddressedAuthority("analysis_run_receipt", {
    schemaVersion: ANALYSIS_RUN_RECEIPT_VERSION,
    runContextDigest: context.value.runContextDigest,
    runStatus,
    partitionDigest: context.value.partitionDigest,
    partitionCurrency: context.value.partitionCurrency,
    tableDigests: tables.map((item) => item.tableDigest).sort(compareUnicodeCodePoints),
    claimDigests: claims.map((item) => item.claimDigest).sort(compareUnicodeCodePoints),
    seriesDigests: series.map((item) => item.seriesDigest).sort(compareUnicodeCodePoints),
    evidenceBundleDigests: evidence.map((item) => item.bundleDigest).sort(compareUnicodeCodePoints),
    includedCount: dependencies.partitionReceipt.includedCount,
    excludedCount: dependencies.partitionReceipt.excludedCount,
    limitationCodes,
    diagnosticsDigest: diagnostics.value.diagnosticsDigest,
  }, "runDigest") as ExactResult<AnalysisRunReceipt, AnalyticalContractFailure>;
}

export function verifyAnalysisRunReceipt(
  input: unknown,
  graph: AnalysisRunArtifactGraph,
): ExactResult<AnalysisRunReceipt, AnalyticalContractFailure> {
  const record = validateContractRecord(input, ["schemaVersion", "runContextDigest", "runStatus", "partitionDigest", "partitionCurrency", "tableDigests", "claimDigests", "seriesDigests", "evidenceBundleDigests", "includedCount", "excludedCount", "limitationCodes", "diagnosticsDigest", "runDigest"]);
  if (!record.ok) return record;
  const digest = validateClaimedDigest(record.value.runDigest, "$.runDigest", "analysis_run_receipt");
  if (!digest.ok) return digest;
  const rebuilt = buildAnalysisRunReceipt({ schemaVersion: ANALYSIS_RUN_RECEIPT_VERSION, ...graph });
  if (!rebuilt.ok || rebuilt.value.runDigest !== digest.value) return contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.runDigest");
  return rebuilt;
}
