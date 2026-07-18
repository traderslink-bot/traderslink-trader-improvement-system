import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { TRADER_INTELLIGENCE_ROUTE_CONTAINMENT_MATRIX } from "../lib/trader-intelligence-v3/contracts";
import {
  scanTraderIntelligenceArchitectureBoundaries,
  scanTraderIntelligenceRouteContainment,
} from "../lib/trader-intelligence-v3/testing";

function worktreeFiles(): readonly string[] {
  return execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  )
    .split("\0")
    .map((path) => path.replaceAll("\\", "/"))
    .filter(Boolean);
}

function sourceRecord(path: string) {
  return { path, source: readFileSync(resolve(path), "utf8") };
}

const paths = worktreeFiles();
const architectureRecords = paths
  .filter((path) =>
    /^(?:src\/lib\/trader-intelligence-v3\/|app\/api\/.*route\.ts$|src\/lib\/.*(?:coach|coaching).*\.ts$)/i.test(
      path,
    ),
  )
  .filter((path) => !path.includes("/__tests__/"))
  .map(sourceRecord);
const routeRecords = paths
  .filter((path) => /^app\/api\/.*\/route\.ts$/.test(path))
  .map(sourceRecord);
const intelligenceClientRecords = paths
  .filter((path) => /^app\/intelligence\/.*\.(?:ts|tsx)$/.test(path))
  .map(sourceRecord);

const architectureFindings =
  scanTraderIntelligenceArchitectureBoundaries(architectureRecords);
const routeFindings = scanTraderIntelligenceRouteContainment({
  routeRecords,
  intelligenceClientRecords,
  matrix: TRADER_INTELLIGENCE_ROUTE_CONTAINMENT_MATRIX,
});

if (architectureFindings.length > 0 || routeFindings.length > 0) {
  process.stderr.write(
    `${JSON.stringify(
      {
        ok: false,
        architectureFindings,
        routeFindings,
      },
      null,
      2,
    )}\n`,
  );
  process.exitCode = 1;
} else {
  process.stdout.write(
    `${JSON.stringify({
      ok: true,
      scannedArchitectureFileCount: architectureRecords.length,
      scannedApiRouteCount: routeRecords.length,
      classifiedTraderIntelligenceRouteCount:
        TRADER_INTELLIGENCE_ROUTE_CONTAINMENT_MATRIX.length,
    })}\n`,
  );
}
