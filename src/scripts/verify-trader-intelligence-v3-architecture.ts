import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { scanTraderIntelligenceArchitectureBoundaries } from "../lib/trader-intelligence-v3/testing/architecture-boundary-guard";

function worktreeFiles(): readonly string[] {
  return execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  )
    .split("\0")
    .filter((path) =>
      /^(?:src\/lib\/trader-intelligence-v3\/|app\/.*route\.ts$|src\/lib\/.*(?:coach|coaching).*\.ts$)/i.test(
        path.replaceAll("\\", "/"),
      ),
    )
    .filter((path) => !path.replaceAll("\\", "/").includes("/__tests__/"));
}

const records = worktreeFiles().map((path) => ({
  path,
  source: readFileSync(resolve(path), "utf8"),
}));
const findings = scanTraderIntelligenceArchitectureBoundaries(records);

if (findings.length > 0) {
  process.stderr.write(`${JSON.stringify({ ok: false, findings }, null, 2)}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `${JSON.stringify({ ok: true, scannedFileCount: records.length })}\n`,
  );
}
