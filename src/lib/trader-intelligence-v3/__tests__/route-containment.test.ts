import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

import { TRADER_INTELLIGENCE_ROUTE_CONTAINMENT_MATRIX } from "../contracts";
import {
  discoverTraderIntelligenceApiRoutes,
  scanTraderIntelligenceRouteContainment,
  type TraderIntelligenceRouteSourceRecord,
} from "../testing";

function findFiles(
  directory: string,
  predicate: (fileName: string) => boolean,
): readonly string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return findFiles(path, predicate);
    }
    return predicate(entry.name)
      ? [relative(process.cwd(), path).replaceAll("\\", "/")]
      : [];
  });
}

function records(paths: readonly string[]): readonly TraderIntelligenceRouteSourceRecord[] {
  return paths.map((path) => ({ path, source: readFileSync(path, "utf8") }));
}

function allApiRouteRecords() {
  return records(
    findFiles(join(process.cwd(), "app", "api"), (name) => name === "route.ts"),
  );
}

function intelligenceClientRecords() {
  return records(
    findFiles(
      join(process.cwd(), "app", "intelligence"),
      (name) => /\.(?:ts|tsx)$/.test(name),
    ),
  );
}

describe("Trader Intelligence route containment matrix", () => {
  it("classifies every Intelligence page and discovered API exactly once", () => {
    const actualRoutes = [
      ...findFiles(
        join(process.cwd(), "app", "intelligence"),
        (name) => name === "page.tsx",
      ),
      ...discoverTraderIntelligenceApiRoutes({
        routeRecords: allApiRouteRecords(),
        intelligenceClientRecords: intelligenceClientRecords(),
      }),
    ].sort();
    const classifiedRoutes = TRADER_INTELLIGENCE_ROUTE_CONTAINMENT_MATRIX.map(
      (entry) => entry.modulePath,
    ).sort();

    expect(new Set(classifiedRoutes).size).toBe(classifiedRoutes.length);
    expect(classifiedRoutes).toEqual(actualRoutes);
    expect(classifiedRoutes).toHaveLength(87);
  });

  it("uses AST inspection to require exact wrapper paths and complete method coverage", () => {
    expect(
      scanTraderIntelligenceRouteContainment({
        routeRecords: allApiRouteRecords(),
        intelligenceClientRecords: intelligenceClientRecords(),
        matrix: TRADER_INTELLIGENCE_ROUTE_CONTAINMENT_MATRIX,
      }),
    ).toEqual([]);
  });

  it("prohibits state-changing GET classifications", () => {
    for (const entry of TRADER_INTELLIGENCE_ROUTE_CONTAINMENT_MATRIX) {
      if (entry.classification === "owner_mutation") {
        expect(entry.methods).not.toContain("GET");
      }
    }
  });

  it("rejects an unclassified journal API regardless of prefix", () => {
    const routeRecords = [
      ...allApiRouteRecords(),
      {
        path: "app/api/new-journal-surface/route.ts",
        source:
          'import { SqliteImportCommitRepository } from "@/src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository"; export const GET = async () => Response.json(new SqliteImportCommitRepository());',
      },
    ];
    expect(
      scanTraderIntelligenceRouteContainment({
        routeRecords,
        intelligenceClientRecords: intelligenceClientRecords(),
        matrix: TRADER_INTELLIGENCE_ROUTE_CONTAINMENT_MATRIX,
      }),
    ).toContainEqual(
      expect.objectContaining({
        code: "ti_v3_route_unclassified",
        path: "app/api/new-journal-surface/route.ts",
      }),
    );
  });

  it.each([
    [
      "unused wrapper import",
      'import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth"; export const GET = async () => Response.json({ ok: true });',
      "ti_v3_route_method_unwrapped",
    ],
    [
      "unwrapped const POST",
      'import "@/src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository"; export const POST = async () => Response.json({ ok: true });',
      "ti_v3_route_method_unwrapped",
    ],
    [
      "wrong wrapper module path",
      'import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth"; const GETHandler = async () => Response.json({ ok: true }); export const GET = withTraderIntelligenceOwnerRoute("app/api/wrong/route.ts", GETHandler);',
      "ti_v3_route_wrapper_module_path_mismatch",
    ],
  ])("detects route bypass: %s", (_label, source, code) => {
    const path = "app/api/trades/route.ts";
    expect(
      scanTraderIntelligenceRouteContainment({
        routeRecords: [{ path, source }],
        intelligenceClientRecords: [],
        matrix: TRADER_INTELLIGENCE_ROUTE_CONTAINMENT_MATRIX.filter(
          (entry) => entry.modulePath === path,
        ),
      }),
    ).toContainEqual(expect.objectContaining({ code, path }));
  });

  it("guards repository-backed pages before legacy read-model access", () => {
    const repositoryBackedPages = [
      "app/intelligence/analytics/page.tsx",
      "app/intelligence/coach/page.tsx",
      "app/intelligence/imports/[batchId]/page.tsx",
      "app/intelligence/imports/page.tsx",
      "app/intelligence/page.tsx",
      "app/intelligence/progress/page.tsx",
      "app/intelligence/review/page.tsx",
      "app/intelligence/trades/[tradeId]/page.tsx",
      "app/intelligence/trades/page.tsx",
      "app/intelligence/trades/ticker-story/[threadId]/page.tsx",
    ];
    for (const path of repositoryBackedPages) {
      const source = readFileSync(path, "utf8");
      expect(source).toContain(`requireTraderIntelligenceOwnerPageAccess("${path}")`);
    }
  });

  it("guards pages using the supported request-time headers API", () => {
    const source = readFileSync(
      "src/lib/trader-intelligence-v3/auth/next-owner-boundary.ts",
      "utf8",
    );
    expect(source).toContain('import { cookies, headers } from "next/headers"');
    expect(source).toContain("headers()");
    expect(source).toContain("localRequest: { headers: requestHeaders }");
  });

  it("forces the Intelligence route tree to dynamic private rendering", () => {
    const layoutSource = readFileSync("app/intelligence/layout.tsx", "utf8");
    const nextConfigSource = readFileSync("next.config.ts", "utf8");

    expect(layoutSource).toContain('dynamic = "force-dynamic"');
    expect(layoutSource).toContain('fetchCache = "force-no-store"');
    expect(layoutSource).toContain("requireTraderIntelligenceOwnerPageAccess");
    expect(nextConfigSource).toContain('source: "/intelligence/:path*"');
    expect(nextConfigSource).toContain('value: "private, no-store, max-age=0"');
  });
});
