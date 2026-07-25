import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const node = process.execPath;
const vitest = resolve("node_modules/vitest/vitest.mjs");
if (!existsSync(vitest)) { process.stderr.write("GA1-B verifier blocked: bundled Vitest runtime is unavailable; run npm ci.\n"); process.exit(2); }
const scaleOnly = process.argv.includes("--scale-only");
const focusedOnly = process.argv.includes("--focused-only");
if (scaleOnly && focusedOnly) { process.stderr.write("GA1-B verifier flags are mutually exclusive.\n"); process.exit(2); }
const files = [
  "src/lib/trader-intelligence-v3/__tests__/ga1-a/query-audit-remediation-registry.test.ts",
  "src/lib/trader-intelligence-v3/__tests__/ga1-b/evidence-similarity-presets.test.ts",
  "src/lib/trader-intelligence-v3/__tests__/ga1-b/similarity-result-verification-replay.test.ts",
];
const args = scaleOnly
  ? [resolve("node_modules/tsx/dist/cli.mjs"), "src/scripts/verify-trader-intelligence-v3-ga1-b-scale.ts"]
  : [vitest, "run", ...files, "--reporter=dot", "--maxWorkers=1", "--pool=forks", "--no-file-parallelism"];
const result = spawnSync(node, args, { stdio: "inherit", shell: false, env: scaleOnly ? { ...process.env, TI_V3_GA1_B_SCALE_PROOF: "1" } : process.env });
if (result.error !== undefined || result.status !== 0) { process.stderr.write(`GA1-B verifier failed; status=${result.status ?? "environmental_error"}\n`); process.exit(result.status === null ? 2 : result.status || 1); }
process.stdout.write(`GA1-B verifier passed; mode=${scaleOnly ? "scale" : "focused"}; elapsedMs=${Date.now()}.\n`);
