# Milestone 0: Legacy Execution Runtime Inventory

## Purpose and status

This is a retirement inventory, not a migration design. As of 2026-07-27, the
listed SQLite-backed execution/import/analytics surface remains operational
only until the v3 import-to-dashboard proof is complete. It must not provide a
fallback, adapter, conversion source, or comparison authority for v3.

## v3 boundary observed at Milestone 0

- 'src/lib/trader-intelligence-v3/ingestion/raw-broker-csv-ingestion.ts'
  deterministically parses explicit raw UTF-8 CSV mappings into canonical v3
  execution envelopes and rejected-row facts, but does not persist them.
- 'src/lib/trader-intelligence-v3/analytics/adapters/local-current-data-bridge.ts'
  deliberately exposes only a read-only exact-authority port; it has no
  persistence, database, migration, or mutation capability.
- 'src/lib/trader-intelligence-v3/analytics/query/gateway/read-only-query-gateway.ts'
  opens verified datasets and partitions, but current production-shaped sources
  are not a durable v3 broker-import resolver.

Therefore Milestone 1 must add durable v3 source-document/execution authority
and restart proof. It must not call the paths below to manufacture v3 data.

## Legacy runtime inventory

| Area | Current legacy boundary | Milestone 6 disposition |
| --- | --- | --- |
| SQLite store | 'src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository.ts' writes import batches, saved trades, reports, review jobs, mapping templates, and related product state through 'better-sqlite3'. | Retire only the execution-import/analytics responsibility after v3 proof; assess unrelated product state separately. |
| Import APIs | 'app/api/import-batches/**', 'app/api/csv-mapping-review/continue', and 'app/api/csv-mapping-templates/**' instantiate the SQLite repository or its legacy services. | Replace the execution import path only with v3 authority. Do not convert historical rows. |
| Analytics API | 'app/api/analytics/latest/route.ts' returns 'saved_sqlite' or 'sample_fallback' from 'buildSavedOrSampleTraderAnalyticsViewModel'. | Replace with a versioned v3 adapter response after its contract is proven. |
| Analytics page | 'app/intelligence/analytics/page.tsx' and its client consume saved-trade/legacy analytics models. | Rebuild against formatting-only v3 packets in Milestones 3–4. |
| Legacy analytics code | 'src/lib/trader-analytics/build-trader-analytics-report.ts', 'run-trader-analytics-report.ts', and product/server consumers calculate or shape the old execution analytics. | Remove the execution-analytics consumers after replacement verification; do not port their calculated values. |
| Coach API/page | 'app/api/coach/latest/route.ts' and 'app/intelligence/coach/page.tsx' currently receive legacy saved/sample models. | Keep separate from this plan until the post-Milestone-4 governed AI/Coach boundary is explicitly authorized. |
| Debug surface | 'app/api/trader-analytics/debug/route.ts' and 'app/intelligence/debug/trader-analytics/page.tsx'. | Retire with legacy execution analytics only after replacement proof. |

The inventory intentionally excludes chart-data, level-analysis, journaling,
and other SQLite-backed product state that is not execution-analytics authority.

## Disposable legacy-data reset procedure

Use this procedure only after the Milestone 6 replacement checks pass, or in a
clearly isolated local test environment. It is destructive to the selected
legacy database and is not part of any v3 import path.

1. Verify the target is a local disposable legacy database, not a v3 authority
   store, and record the exact absolute path. The current resolver uses
   'TRADER_INTELLIGENCE_DATA_MODE=real_owner_data' with
   'TRADER_INTELLIGENCE_DB_PATH'; it forbids repository and temporary paths.
2. Stop local processes holding the selected SQLite file and confirm no v3
   import/restart proof is using it.
3. Make a recoverable copy outside the repository only when the owner requests
   one. Do not create a migration or conversion artifact.
4. Delete the selected database plus its matching SQLite '-wal' and '-shm'
   sidecars, or point a disposable local test run at a new empty target.
5. Start the app under the same local-only/owner configuration and verify that
   legacy execution analytics is absent rather than silently reconstructed.
6. Record the exact target and result in the project log. Never apply this
   procedure to an unverified or ambiguous path.

## Explicit non-goals

- no SQLite-to-v3 migration, adapter, fallback, conversion, or parallel query
  runtime;
- no dashboard route switch in Milestone 0;
- no data deletion in Milestone 0;
- no deployment, Coach, candle, market-data, VWAP, setup, or simulation work.
