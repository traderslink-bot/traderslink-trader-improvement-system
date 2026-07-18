export type TraderIntelligenceArchitectureFindingCode =
  | "ti_v3_arch_domain_app_import"
  | "ti_v3_arch_domain_next_import"
  | "ti_v3_arch_database_driver_import"
  | "ti_v3_arch_ai_sdk_import"
  | "ti_v3_arch_levels_system_import"
  | "ti_v3_arch_market_provider_import"
  | "ti_v3_arch_academy_coupling"
  | "ti_v3_arch_legacy_coaching_internal_import"
  | "ti_v3_arch_route_domain_authority";

export interface TraderIntelligenceSourceRecord {
  path: string;
  source: string;
}

export interface TraderIntelligenceArchitectureFinding {
  code: TraderIntelligenceArchitectureFindingCode;
  path: string;
  dependency: string | null;
}

const IMPORT_PATTERN =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s*)["']([^"']+)["']/g;

function normalizedPath(path: string): string {
  return path.replaceAll("\\", "/");
}

function importedDependencies(source: string): readonly string[] {
  return [...source.matchAll(IMPORT_PATTERN)].map((match) => match[1]);
}

function pushFinding(
  findings: TraderIntelligenceArchitectureFinding[],
  code: TraderIntelligenceArchitectureFindingCode,
  path: string,
  dependency: string | null,
): void {
  if (
    !findings.some(
      (finding) =>
        finding.code === code &&
        finding.path === path &&
        finding.dependency === dependency,
    )
  ) {
    findings.push({ code, path, dependency });
  }
}

export function scanTraderIntelligenceArchitectureBoundaries(
  records: readonly TraderIntelligenceSourceRecord[],
): readonly TraderIntelligenceArchitectureFinding[] {
  const findings: TraderIntelligenceArchitectureFinding[] = [];

  for (const record of records) {
    const path = normalizedPath(record.path);
    const dependencies = importedDependencies(record.source);
    const isV3Core = path.startsWith("src/lib/trader-intelligence-v3/");
    const isDomainOrContracts =
      path.startsWith("src/lib/trader-intelligence-v3/domain/") ||
      path.startsWith("src/lib/trader-intelligence-v3/contracts/");

    for (const dependency of dependencies) {
      const normalizedDependency = dependency.toLowerCase();
      if (
        isDomainOrContracts &&
        (dependency.startsWith("app/") ||
          dependency.startsWith("@/app/") ||
          dependency.includes("/app/"))
      ) {
        pushFinding(
          findings,
          "ti_v3_arch_domain_app_import",
          path,
          dependency,
        );
      }
      if (isDomainOrContracts && normalizedDependency.startsWith("next")) {
        pushFinding(
          findings,
          "ti_v3_arch_domain_next_import",
          path,
          dependency,
        );
      }
      if (
        isV3Core &&
        /(better-sqlite3|sqlite3|@neondatabase|pg$|postgres|drizzle-orm)/.test(
          normalizedDependency,
        )
      ) {
        pushFinding(
          findings,
          "ti_v3_arch_database_driver_import",
          path,
          dependency,
        );
      }
      if (
        isV3Core &&
        /(^|\/)(openai|ai|@ai-sdk|langchain|anthropic)(\/|$)/.test(
          normalizedDependency,
        )
      ) {
        pushFinding(
          findings,
          "ti_v3_arch_ai_sdk_import",
          path,
          dependency,
        );
      }
      if (isV3Core && normalizedDependency.includes("levels-system")) {
        pushFinding(
          findings,
          "ti_v3_arch_levels_system_import",
          path,
          dependency,
        );
      }
      if (
        isV3Core &&
        normalizedDependency.includes("/academy/") &&
        path !==
          "src/lib/trader-intelligence-v3/auth/provisional-discord-session-adapter.ts"
      ) {
        pushFinding(
          findings,
          "ti_v3_arch_academy_coupling",
          path,
          dependency,
        );
      }
      if (
        isV3Core &&
        /(?:market-data|market_data|providers?\/(?:yahoo|eodhd|finnhub|ibkr))/.test(
          normalizedDependency,
        )
      ) {
        pushFinding(
          findings,
          "ti_v3_arch_market_provider_import",
          path,
          dependency,
        );
      }
      if (
        !isV3Core &&
        path.startsWith("src/lib/") &&
        /(?:coach|coaching)/.test(path.toLowerCase()) &&
        normalizedDependency.includes("trader-intelligence-v3/")
      ) {
        pushFinding(
          findings,
          "ti_v3_arch_legacy_coaching_internal_import",
          path,
          dependency,
        );
      }
    }

    if (
      path.endsWith("/route.ts") &&
      /(?:function|const)\s+(?:calculate|compute|aggregate|reconstruct|derive)[A-Z_]/.test(
        record.source,
      )
    ) {
      pushFinding(
        findings,
        "ti_v3_arch_route_domain_authority",
        path,
        null,
      );
    }
  }

  return findings.sort((left, right) =>
    `${left.path}:${left.code}:${left.dependency ?? ""}`.localeCompare(
      `${right.path}:${right.code}:${right.dependency ?? ""}`,
    ),
  );
}
