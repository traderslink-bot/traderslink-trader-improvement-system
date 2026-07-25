import {
  buildSyntheticQueryFixture,
  buildSimilarTradeSearchPlan,
  compileGa1BPreset,
  executeGa1BPreset,
  executeTradeQuery,
  GA1_B_PRESET_KEYS,
  retrieveTradeQueryEvidence,
  searchSimilarTrades,
} from "../lib/trader-intelligence-v3/analytics";
import { appendFileSync } from "node:fs";

const rowsArgument = process.argv.find((value) => value.startsWith("--rows="));
const rows = rowsArgument === undefined ? 10_000 : Number(rowsArgument.slice("--rows=".length));
if (!Number.isSafeInteger(rows) || rows < 1 || rows > 10_000) throw new Error("invalid scale row count");
const startedAt = Date.now();
let stageStartedAt = startedAt;

function writeRecord(record: Record<string, unknown>): void {
  const line = `${JSON.stringify(record)}\n`;
  process.stdout.write(line);
  const stageLog = process.env.TI_V3_GA1_B_SCALE_STAGE_LOG;
  if (stageLog !== undefined) appendFileSync(stageLog, line, "utf8");
}

function report(stage: string, status: "complete" | "failed", error?: { readonly code: string; readonly path: string }): void {
  const memory = process.memoryUsage();
  writeRecord({ stage, status, elapsedMs: Date.now() - stageStartedAt, totalElapsedMs: Date.now() - startedAt, memory: { rss: memory.rss, heapUsed: memory.heapUsed, heapTotal: memory.heapTotal }, ...(error === undefined ? {} : { error }) });
  stageStartedAt = Date.now();
}

function requireOk<T>(stage: string, result: { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: { readonly code: string; readonly path: string } }): T {
  if (result.ok) return result.value;
  report(stage, "failed", result.error);
  throw new Error(`${stage}:${result.error.code}:${result.error.path}`);
}

writeRecord({ event: "fixture_construction_started", totalElapsedMs: 0, memory: (() => { const memory = process.memoryUsage(); return { rss: memory.rss, heapUsed: memory.heapUsed, heapTotal: memory.heapTotal }; })() });
const fixture = buildSyntheticQueryFixture(rows);
report("fixture_construction", "complete");
const aggregate = requireOk("aggregate_execution", executeTradeQuery({ source: fixture.source, partitionReceipt: fixture.partition, queryPlan: fixture.plan() }));
if (aggregate.candidateCount !== String(rows)) throw new Error("aggregate candidate count mismatch");
report("aggregate_execution", "complete");
const evidence = requireOk("bounded_evidence", retrieveTradeQueryEvidence({ source: fixture.source, partitionReceipt: fixture.partition, result: aggregate, request: { target: { kind: "result" }, maximumTrades: "128", maximumExecutions: "512" } }));
if (evidence.trades.length > 128 || evidence.trades.reduce((count, trade) => count + trade.executionDigests.length, 0) > 512) throw new Error("evidence bound mismatch");
report("bounded_evidence", "complete");
const searchPlan = requireOk("similarity_plan", buildSimilarTradeSearchPlan({ targetTradeKey: fixture.derived.datasetReceipt.rows[0].semanticRoundTripKey, dimensions: ["direction", "symbol"], policies: [{ dimension: "direction", policyKey: "exact_identity", policyVersion: "v1" }, { dimension: "symbol", policyKey: "exact_identity", policyVersion: "v1" }], filters: [], includeNearMisses: true, maximumMatches: "128", maximumNearMisses: "128" }, fixture.authority, aggregate.resultDigest));
const search = requireOk("similarity_search", searchSimilarTrades({ source: fixture.source, partitionReceipt: fixture.partition, result: aggregate, plan: searchPlan }));
if (search.matches.length > 128 || search.nearMisses.length > 128) throw new Error("similarity bound mismatch");
report("similarity_search", "complete");
for (const presetKey of GA1_B_PRESET_KEYS) {
  const preset = requireOk(`preset:${presetKey}:compile`, compileGa1BPreset({ presetKey, authority: fixture.authority, baselineFilters: presetKey === "compare_periods" ? [{ kind: "weekday", values: ["monday"] }] : undefined }));
  const execution = requireOk(`preset:${presetKey}:execute`, executeGa1BPreset({ source: fixture.source, partitionReceipt: fixture.partition, preset }));
  if (execution.primaryResult.rows.length > Number(preset.primaryPlan.limits.resultRowLimit)) throw new Error(`preset:${presetKey}:result bound mismatch`);
  report(`preset:${presetKey}`, "complete");
}
report("scale_run_completion", "complete");
