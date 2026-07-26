import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const node = process.execPath;
const vitest = resolve("node_modules/vitest/vitest.mjs");
if (!existsSync(vitest)) {
  process.stderr.write("GA1-C verifier blocked: Vitest is unavailable; run npm ci.\n");
  process.exit(2);
}
const scaleOnly = process.argv.includes("--scale-only");
const focusedOnly = process.argv.includes("--focused-only");
if (scaleOnly && focusedOnly) {
  process.stderr.write("GA1-C verifier flags are mutually exclusive.\n");
  process.exit(2);
}
const focusedFiles = [
  "src/lib/trader-intelligence-v3/__tests__/ga1-c/execution-only-pack-2.test.ts",
  "src/lib/trader-intelligence-v3/__tests__/ga1-c/simulation-plan-and-engine.test.ts",
  "src/lib/trader-intelligence-v3/__tests__/ga1-c/simulation-replay-envelope.test.ts",
];
const files = scaleOnly
  ? ["src/lib/trader-intelligence-v3/__tests__/ga1-c/ga1-c-scale.test.ts"]
  : focusedFiles;
const result = spawnSync(node, [
  vitest,
  "run",
  ...files,
  "--reporter=dot",
  "--maxWorkers=1",
  "--pool=forks",
  "--no-file-parallelism",
], {
  stdio: "inherit",
  shell: false,
  env: scaleOnly
    ? { ...process.env, TI_V3_GA1_C_SCALE_PROOF: "1" }
    : process.env,
});
if (result.error !== undefined || result.status !== 0) {
  process.stderr.write(`GA1-C verifier failed; status=${result.status ?? "environmental_error"}\n`);
  process.exit(result.status === null ? 2 : result.status || 1);
}
process.stdout.write(`GA1-C verifier passed; mode=${scaleOnly ? "scale" : "focused"}.\n`);
