import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

import { TRADER_INTELLIGENCE_ROUTE_CONTAINMENT_MATRIX } from "../contracts";

function findFiles(directory: string, fileName: string): readonly string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return findFiles(path, fileName);
    }
    return entry.name === fileName
      ? [relative(process.cwd(), path).replaceAll("\\", "/")]
      : [];
  });
}

function relevantApiRoutes(): readonly string[] {
  const relevantPrefix =
    /^app\/api\/(?:admin\/level-analysis|analytics|coach|execution-feedback|import-batches|import-dry-run|level-analysis|review|trade-analysis|trader-analytics|trades)\//;
  return findFiles(join(process.cwd(), "app", "api"), "route.ts").filter((path) =>
    relevantPrefix.test(path),
  );
}

describe("Trader Intelligence route containment matrix", () => {
  it("classifies every Intelligence page and relevant API exactly once", () => {
    const actualRoutes = [
      ...findFiles(join(process.cwd(), "app", "intelligence"), "page.tsx"),
      ...relevantApiRoutes(),
    ].sort();
    const classifiedRoutes = TRADER_INTELLIGENCE_ROUTE_CONTAINMENT_MATRIX.map(
      (entry) => entry.modulePath,
    ).sort();

    expect(new Set(classifiedRoutes).size).toBe(classifiedRoutes.length);
    expect(classifiedRoutes).toEqual(actualRoutes);
  });

  it("prohibits state-changing GET classifications", () => {
    for (const entry of TRADER_INTELLIGENCE_ROUTE_CONTAINMENT_MATRIX) {
      if (entry.classification === "owner_mutation") {
        expect(entry.methods).not.toContain("GET");
      }
    }
  });

  it("wraps every relevant API handler with the v3 owner boundary", () => {
    for (const path of relevantApiRoutes()) {
      const source = readFileSync(path, "utf8");
      expect(source).toContain("withTraderIntelligenceOwnerRoute");
      expect(source).not.toMatch(/export async function (GET|POST|PUT|PATCH|DELETE)/);
    }
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

  it("guards private metadata before loading repository-backed ticker data", () => {
    const source = readFileSync(
      "app/intelligence/trades/ticker-story/[threadId]/page.tsx",
      "utf8",
    );
    const metadataStart = source.indexOf("export async function generateMetadata");
    const metadataEnd = source.indexOf("export default async function", metadataStart);
    const metadataSource = source.slice(metadataStart, metadataEnd);

    expect(metadataSource.indexOf("requireTraderIntelligenceOwnerPageAccess")).toBeGreaterThan(-1);
    expect(metadataSource.indexOf("requireTraderIntelligenceOwnerPageAccess")).toBeLessThan(
      metadataSource.indexOf("buildTickerStoryModel"),
    );
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
