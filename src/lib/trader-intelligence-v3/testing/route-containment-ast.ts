import ts from "typescript";

import type { TraderIntelligenceRouteContainmentEntry } from "../contracts";
import {
  extractTraderIntelligenceApiReferences,
  extractTraderIntelligenceModuleDependencies,
  parseTraderIntelligenceTypeScript,
} from "./typescript-source-analysis";

export interface TraderIntelligenceRouteSourceRecord {
  path: string;
  source: string;
}

export type TraderIntelligenceRouteDiscoveryFindingCode =
  | "ti_v3_route_unclassified"
  | "ti_v3_route_matrix_duplicate"
  | "ti_v3_route_method_mismatch"
  | "ti_v3_route_method_unwrapped"
  | "ti_v3_route_wrapper_module_path_mismatch"
  | "ti_v3_route_wrapper_import_unused";

export interface TraderIntelligenceRouteDiscoveryFinding {
  code: TraderIntelligenceRouteDiscoveryFindingCode;
  path: string;
  method: string | null;
  detail: string | null;
}

const HTTP_METHODS = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
]);

const TRADER_INTELLIGENCE_DEPENDENCY =
  /(?:trader-intelligence-v3|trader-analytics|trade-analysis|execution-feedback|level-analysis|raw-trade-timeline|execution-sources|pattern-detection|pattern-normalization|pattern-scoring|user-facing-behavior|user-facing-review|behavior-analysis|trade-coaching|(?:^|\/)coaching(?:\/|$)|import-commit|saved-trade|journal|manual-execution|period-reflection|real-coach|support-resistance)/i;

function normalizedPath(path: string): string {
  return path.replaceAll("\\", "/");
}

function routePathFromModule(modulePath: string): string {
  return modulePath.replace(/^app/, "").replace(/\/route\.ts$/, "");
}

function referenceMatchesRoute(reference: string, routePath: string): boolean {
  const referenceSegments = reference.split("/").filter(Boolean);
  const routeSegments = routePath.split("/").filter(Boolean);
  if (referenceSegments.length !== routeSegments.length) {
    return false;
  }
  return routeSegments.every((segment, index) => {
    const referenceSegment = referenceSegments[index];
    return (
      /^\[.+\]$/.test(segment) ||
      referenceSegment === "*" ||
      referenceSegment === segment
    );
  });
}

function exportedRouteMethods(sourceFile: ts.SourceFile): Map<string, ts.Expression | null> {
  const localInitializers = new Map<string, ts.Expression | null>();
  const exported = new Map<string, ts.Expression | null>();

  for (const statement of sourceFile.statements) {
    if (ts.isVariableStatement(statement)) {
      const isExported = statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      );
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) {
          continue;
        }
        localInitializers.set(declaration.name.text, declaration.initializer ?? null);
        if (isExported && HTTP_METHODS.has(declaration.name.text)) {
          exported.set(declaration.name.text, declaration.initializer ?? null);
        }
      }
    } else if (ts.isFunctionDeclaration(statement) && statement.name) {
      const isExported = statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      );
      localInitializers.set(statement.name.text, null);
      if (isExported && HTTP_METHODS.has(statement.name.text)) {
        exported.set(statement.name.text, null);
      }
    } else if (ts.isExportDeclaration(statement) && statement.exportClause) {
      if (!ts.isNamedExports(statement.exportClause)) {
        continue;
      }
      for (const element of statement.exportClause.elements) {
        const exportedName = element.name.text;
        const localName = element.propertyName?.text ?? exportedName;
        if (HTTP_METHODS.has(exportedName)) {
          exported.set(exportedName, localInitializers.get(localName) ?? null);
        }
      }
    }
  }
  return exported;
}

function unwrapExpression(expression: ts.Expression): ts.Expression {
  let current = expression;
  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function wrapperCall(expression: ts.Expression | null): ts.CallExpression | null {
  if (!expression) {
    return null;
  }
  const unwrapped = unwrapExpression(expression);
  return ts.isCallExpression(unwrapped) &&
    ts.isIdentifier(unwrapped.expression) &&
    unwrapped.expression.text === "withTraderIntelligenceOwnerRoute"
    ? unwrapped
    : null;
}

export function discoverTraderIntelligenceApiRoutes(args: {
  routeRecords: readonly TraderIntelligenceRouteSourceRecord[];
  intelligenceClientRecords: readonly TraderIntelligenceRouteSourceRecord[];
}): readonly string[] {
  const clientReferences = new Set(
    args.intelligenceClientRecords.flatMap((record) =>
      extractTraderIntelligenceApiReferences(record.path, record.source),
    ),
  );
  return args.routeRecords
    .filter((record) => {
      const path = normalizedPath(record.path);
      const dependencies = extractTraderIntelligenceModuleDependencies(
        path,
        record.source,
      );
      if (
        dependencies.some((dependency) =>
          TRADER_INTELLIGENCE_DEPENDENCY.test(dependency.specifier),
        )
      ) {
        return true;
      }
      const routePath = routePathFromModule(path);
      return [...clientReferences].some((reference) =>
        referenceMatchesRoute(reference, routePath),
      );
    })
    .map((record) => normalizedPath(record.path))
    .sort();
}

export function scanTraderIntelligenceRouteContainment(args: {
  routeRecords: readonly TraderIntelligenceRouteSourceRecord[];
  intelligenceClientRecords: readonly TraderIntelligenceRouteSourceRecord[];
  matrix: readonly TraderIntelligenceRouteContainmentEntry[];
}): readonly TraderIntelligenceRouteDiscoveryFinding[] {
  const findings: TraderIntelligenceRouteDiscoveryFinding[] = [];
  const matrixByPath = new Map<string, TraderIntelligenceRouteContainmentEntry>();
  for (const entry of args.matrix) {
    if (matrixByPath.has(entry.modulePath)) {
      findings.push({
        code: "ti_v3_route_matrix_duplicate",
        path: entry.modulePath,
        method: null,
        detail: null,
      });
    }
    matrixByPath.set(entry.modulePath, entry);
  }

  const discovered = new Set(
    discoverTraderIntelligenceApiRoutes({
      routeRecords: args.routeRecords,
      intelligenceClientRecords: args.intelligenceClientRecords,
    }),
  );

  for (const path of discovered) {
    const record = args.routeRecords.find(
      (candidate) => normalizedPath(candidate.path) === path,
    );
    const matrixEntry = matrixByPath.get(path);
    if (!record || !matrixEntry) {
      findings.push({
        code: "ti_v3_route_unclassified",
        path,
        method: null,
        detail: null,
      });
      continue;
    }

    const sourceFile = parseTraderIntelligenceTypeScript(path, record.source);
    const exportedMethods = exportedRouteMethods(sourceFile);
    const actualMethods = [...exportedMethods.keys()].sort();
    const declaredMethods = [...matrixEntry.methods].sort();
    if (JSON.stringify(actualMethods) !== JSON.stringify(declaredMethods)) {
      findings.push({
        code: "ti_v3_route_method_mismatch",
        path,
        method: null,
        detail: `actual=${actualMethods.join(",")};matrix=${declaredMethods.join(",")}`,
      });
    }

    let wrapperCallCount = 0;
    for (const [method, initializer] of exportedMethods) {
      const call = wrapperCall(initializer);
      if (!call) {
        findings.push({
          code: "ti_v3_route_method_unwrapped",
          path,
          method,
          detail: null,
        });
        continue;
      }
      wrapperCallCount += 1;
      const modulePathArgument = call.arguments[0];
      if (
        !modulePathArgument ||
        !ts.isStringLiteral(modulePathArgument) ||
        modulePathArgument.text !== path
      ) {
        findings.push({
          code: "ti_v3_route_wrapper_module_path_mismatch",
          path,
          method,
          detail: ts.isStringLiteral(modulePathArgument)
            ? modulePathArgument.text
            : null,
        });
      }
    }

    const importsWrapper = extractTraderIntelligenceModuleDependencies(
      path,
      record.source,
    ).some(
      (dependency) =>
        dependency.kind === "import" &&
        dependency.importedNames?.includes("withTraderIntelligenceOwnerRoute"),
    );
    if (importsWrapper && wrapperCallCount === 0) {
      findings.push({
        code: "ti_v3_route_wrapper_import_unused",
        path,
        method: null,
        detail: null,
      });
    }
  }

  return findings.sort((left, right) =>
    `${left.path}:${left.code}:${left.method ?? ""}`.localeCompare(
      `${right.path}:${right.code}:${right.method ?? ""}`,
    ),
  );
}
