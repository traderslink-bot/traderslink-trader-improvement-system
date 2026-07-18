import ts from "typescript";

import {
  extractTraderIntelligenceModuleDependencies,
  parseTraderIntelligenceTypeScript,
} from "./typescript-source-analysis";

export type TraderIntelligenceArchitectureFindingCode =
  | "ti_v3_arch_domain_app_import"
  | "ti_v3_arch_domain_next_import"
  | "ti_v3_arch_database_driver_import"
  | "ti_v3_arch_ai_sdk_import"
  | "ti_v3_arch_levels_system_import"
  | "ti_v3_arch_market_provider_import"
  | "ti_v3_arch_academy_coupling"
  | "ti_v3_arch_academy_adapter_import_invalid"
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

function normalizedPath(path: string): string {
  return path.replaceAll("\\", "/");
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

function hasRouteDomainAuthority(path: string, source: string): boolean {
  if (!path.endsWith("/route.ts")) {
    return false;
  }
  const sourceFile = parseTraderIntelligenceTypeScript(path, source);
  let found = false;
  const visit = (node: ts.Node): void => {
    if (
      (ts.isFunctionDeclaration(node) ||
        ts.isVariableDeclaration(node) ||
        ts.isMethodDeclaration(node)) &&
      node.name &&
      ts.isIdentifier(node.name) &&
      /^(?:calculate|compute|aggregate|reconstruct|derive)[A-Z_]/.test(
        node.name.text,
      )
    ) {
      found = true;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return found;
}

export function scanTraderIntelligenceArchitectureBoundaries(
  records: readonly TraderIntelligenceSourceRecord[],
): readonly TraderIntelligenceArchitectureFinding[] {
  const findings: TraderIntelligenceArchitectureFinding[] = [];

  for (const record of records) {
    const path = normalizedPath(record.path);
    const dependencies = extractTraderIntelligenceModuleDependencies(
      path,
      record.source,
    );
    const isV3Core = path.startsWith("src/lib/trader-intelligence-v3/");
    const isDomainOrContracts =
      path.startsWith("src/lib/trader-intelligence-v3/domain/") ||
      path.startsWith("src/lib/trader-intelligence-v3/contracts/");
    const isProvisionalAcademyAdapter =
      path ===
      "src/lib/trader-intelligence-v3/auth/provisional-discord-session-adapter.ts";

    for (const dependency of dependencies) {
      const normalizedDependency = dependency.specifier.toLowerCase();
      if (
        isDomainOrContracts &&
        (dependency.specifier.startsWith("app/") ||
          dependency.specifier.startsWith("@/app/") ||
          dependency.specifier.includes("/app/"))
      ) {
        pushFinding(findings, "ti_v3_arch_domain_app_import", path, dependency.specifier);
      }
      if (isDomainOrContracts && normalizedDependency.startsWith("next")) {
        pushFinding(findings, "ti_v3_arch_domain_next_import", path, dependency.specifier);
      }
      if (
        isV3Core &&
        /(better-sqlite3|(?:^|\/)sqlite3(?:\/|$)|node:sqlite|@libsql|@neondatabase|(?:^|\/)pg(?:\/|$)|postgres|mysql2?|mariadb|mongodb|mongoose|@prisma\/client|drizzle-orm|typeorm|sequelize|redis|sqlite-import-commit-repository|persistence-storage)/.test(
          normalizedDependency,
        )
      ) {
        pushFinding(findings, "ti_v3_arch_database_driver_import", path, dependency.specifier);
      }
      if (
        isV3Core &&
        /(^|\/)(openai|ai|@ai-sdk|langchain|anthropic|cohere-ai|groq-sdk|mistralai|ollama|replicate)(\/|$)|@google\/(?:generative-ai|genai)|@aws-sdk\/client-bedrock-runtime|@azure\/openai/.test(
          normalizedDependency,
        )
      ) {
        pushFinding(findings, "ti_v3_arch_ai_sdk_import", path, dependency.specifier);
      }
      if (isV3Core && normalizedDependency.includes("levels-system")) {
        pushFinding(findings, "ti_v3_arch_levels_system_import", path, dependency.specifier);
      }
      if (isV3Core && normalizedDependency.includes("/academy/")) {
        const exactSymbols = ["ACADEMY_SESSION_COOKIE", "AcademyProgressStore"];
        const exactAdapterImport =
          isProvisionalAcademyAdapter &&
          dependency.kind === "import" &&
          dependency.specifier ===
            "@/src/lib/academy/academy-progress-store" &&
          dependency.importedNames !== null &&
          [...dependency.importedNames].sort().join(",") ===
            [...exactSymbols].sort().join(",");
        if (!isProvisionalAcademyAdapter) {
          pushFinding(findings, "ti_v3_arch_academy_coupling", path, dependency.specifier);
        } else if (!exactAdapterImport) {
          pushFinding(
            findings,
            "ti_v3_arch_academy_adapter_import_invalid",
            path,
            dependency.specifier,
          );
        }
      }
      if (
        isV3Core &&
        /(?:market-data|market_data|market-provider|providers?\/(?:yahoo|eodhd|finnhub|ibkr|polygon|alpaca|iex|tiingo|tradier)|yahoo-finance2|@polygon\.io|alpaca-trade-api)/.test(
          normalizedDependency,
        )
      ) {
        pushFinding(findings, "ti_v3_arch_market_provider_import", path, dependency.specifier);
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
          dependency.specifier,
        );
      }
    }

    if (hasRouteDomainAuthority(path, record.source)) {
      pushFinding(findings, "ti_v3_arch_route_domain_authority", path, null);
    }
  }

  return findings.sort((left, right) =>
    `${left.path}:${left.code}:${left.dependency ?? ""}`.localeCompare(
      `${right.path}:${right.code}:${right.dependency ?? ""}`,
    ),
  );
}
