import ts from "typescript";

export interface TraderIntelligenceModuleDependency {
  specifier: string;
  kind: "import" | "export" | "require" | "dynamic_import" | "import_equals";
  importedNames: readonly string[] | null;
}

export function parseTraderIntelligenceTypeScript(
  path: string,
  source: string,
): ts.SourceFile {
  return ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

function literalText(node: ts.Node | undefined): string | null {
  return node &&
    (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    ? node.text
    : null;
}

export function extractTraderIntelligenceModuleDependencies(
  path: string,
  source: string,
): readonly TraderIntelligenceModuleDependency[] {
  const sourceFile = parseTraderIntelligenceTypeScript(path, source);
  const dependencies: TraderIntelligenceModuleDependency[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node)) {
      const specifier = literalText(node.moduleSpecifier);
      if (specifier) {
        const clause = node.importClause;
        const importedNames: string[] = [];
        if (clause?.name) {
          importedNames.push("default");
        }
        if (clause?.namedBindings) {
          if (ts.isNamespaceImport(clause.namedBindings)) {
            importedNames.push("*");
          } else {
            importedNames.push(
              ...clause.namedBindings.elements.map(
                (element) => element.propertyName?.text ?? element.name.text,
              ),
            );
          }
        }
        dependencies.push({
          specifier,
          kind: "import",
          importedNames,
        });
      }
    } else if (ts.isExportDeclaration(node)) {
      const specifier = literalText(node.moduleSpecifier);
      if (specifier) {
        const importedNames = node.exportClause
          ? ts.isNamedExports(node.exportClause)
            ? node.exportClause.elements.map(
                (element) => element.propertyName?.text ?? element.name.text,
              )
            : ["*"]
          : ["*"];
        dependencies.push({ specifier, kind: "export", importedNames });
      }
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference)
    ) {
      const specifier = literalText(node.moduleReference.expression);
      if (specifier) {
        dependencies.push({
          specifier,
          kind: "import_equals",
          importedNames: ["*"],
        });
      }
    } else if (ts.isCallExpression(node) && node.arguments.length === 1) {
      const specifier = literalText(node.arguments[0]);
      if (specifier) {
        if (
          ts.isIdentifier(node.expression) &&
          node.expression.text === "require"
        ) {
          dependencies.push({
            specifier,
            kind: "require",
            importedNames: null,
          });
        } else if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
          dependencies.push({
            specifier,
            kind: "dynamic_import",
            importedNames: null,
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return dependencies;
}

export function extractTraderIntelligenceApiReferences(
  path: string,
  source: string,
): readonly string[] {
  const sourceFile = parseTraderIntelligenceTypeScript(path, source);
  const references = new Set<string>();
  const visit = (node: ts.Node): void => {
    if (ts.isStringLiteralLike(node) && node.text.startsWith("/api/")) {
      references.add(node.text.split(/[?#]/, 1)[0]);
    } else if (ts.isTemplateExpression(node)) {
      const value = [
        node.head.text,
        ...node.templateSpans.flatMap((span) => ["*", span.literal.text]),
      ].join("");
      if (value.startsWith("/api/")) {
        references.add(value.split(/[?#]/, 1)[0]);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return [...references].sort();
}
