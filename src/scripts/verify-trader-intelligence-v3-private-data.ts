import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  scanTraderIntelligencePrivateData,
  type TraderIntelligencePrivateDataRecord,
} from "../lib/trader-intelligence-v3/testing/private-data-guard";

function gitPaths(args: readonly string[]): readonly string[] {
  return execFileSync("git", [...args, "-z"], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  })
    .split("\0")
    .filter(Boolean);
}

const records: TraderIntelligencePrivateDataRecord[] = [];
for (const path of gitPaths([
  "ls-files",
  "--cached",
  "--others",
  "--exclude-standard",
])) {
  if (existsSync(resolve(path))) {
    records.push({
      path,
      content: readFileSync(resolve(path), "utf8"),
      sourceKind: "worktree",
    });
  }
}
for (const path of gitPaths([
  "diff",
  "--cached",
  "--name-only",
  "--diff-filter=ACMR",
])) {
  records.push({
    path,
    content: execFileSync("git", ["show", `:${path}`], { encoding: "utf8" }),
    sourceKind: "staged",
  });
}

const findings = scanTraderIntelligencePrivateData(records);
if (findings.length > 0) {
  process.stderr.write(`${JSON.stringify({ ok: false, findings }, null, 2)}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `${JSON.stringify({ ok: true, scannedRecordCount: records.length })}\n`,
  );
}
