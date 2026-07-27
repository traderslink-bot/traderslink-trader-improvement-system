# Trade Execution Analytics Engine Implementation Progress

Read the [engine plan](./trade_execution_analytics_engine_plan.md), its
[future-agent appendix](./trade_execution_analytics_engine_future_agent_compatibility_appendix.md),
and the [dashboard operationalization plan](./v3-dashboard-operationalization-plan.md)
together before changing this tracker.

## Current work

- Status: dashboard operationalization Milestone 0 complete
- Work item: Trade Execution Analytics Engine v3 operationalization
- Goal: keep one shared, deterministic source of truth for execution analytics;
  build durable v3 import/persistence before any dashboard migration.
- Constraint: do not route financial values through the legacy number-based CSV
  importer or make migration data look broker-authoritative. The raw parser
  accepts only explicit UTC timestamps; local-time broker exports remain
  unavailable until their timezone conversion has explicit DST policy.

## Completed

- v3 deterministic execution query extension and capability catalog.
- Controlling plan and future-agent compatibility appendix co-located and cross-linked.
- Raw v3 broker CSV parser with source-document digest, explicit column mapping, exact decimals, canonical executions, and focused authority-boundary tests.
- Compound grouping is now available for two or three distinct non-aggregate dimensions. It rejects nested, aggregate, and duplicate dimensions; uses length-prefixed canonical components to avoid identity collisions; and stays bounded by the existing group/result limits.
- Distribution foundation now provides a generic, query-bound, content-addressed result with exact quartiles/median/IQR, explicit histogram boundaries, and bounded evidence per nonempty bucket. It supports P/L, gain/loss P/L, fees, holding time, share quantity, entry notional, and daily P/L; required quantity/notional authority fails closed.
- Distribution findings now provide strict lower/upper quartile tails, exact tail totals, Tukey 1.5×IQR outlier fences/counts, largest absolute-value concentration, and separately bound outlier evidence under the same shared evidence limit.
- Attribution foundation now provides stable, content-addressed within-period segments for every non-aggregate grouping. Each segment exposes exact net/gain/loss contribution, trade frequency, average net result, fee contribution, and largest absolute-trade concentration with bounded evidence. It deliberately does not describe any contribution as causal.
- Period attribution now accepts compatible baseline/comparison grouped queries and exactly reconciles their P/L difference into overall count-frequency, segment-mix, and average-result effects. It also reports segment fee and largest-absolute-trade changes descriptively, and fails closed at the stricter pairwise row/evidence bound.
- Verified query results can now be paged without recalculating metrics. Each content-addressed continuation binds the source result, plan, page size, and next offset; pages preserve row/evidence identities and disclose any upstream result bound.
- The metric-catalog closure track added exact average/median gross P/L, total winning/losing net P/L, fee burden as a percentage of gross profit/loss, and average/median green/red-day P/L. These are generic registry metrics with accumulator/executor coverage, not dashboard calculations.
- Category coverage now includes current winning/losing realized-trade streaks and fail-closed pre-entry filters for trades after the first completed win or loss of their day.
- Row-authority data-quality metrics now count limited analytical rows, unavailable share/notional/source authority, and manual/broker-import/legacy-migration populations. Rejected source rows remain a separate ingestion-receipt concern and are not misrepresented as completed trades.
- Raw CSV ingestion emits attempted-row and structured affected-field facts;
  rejected rows never become financial authority.
- Completed fee-authority and catalog checkpoint: raw executions now declare `complete` or `unknown` charge coverage; unknown coverage fails closed for fee/net/outcome/path analytics rather than implying zero fees. The generic registry now has 121 exact metrics, including missing-charge coverage and winner/loser share-size statistics, and the catalog document maps each planned family to an implementation or explicit boundary.
- Completed catalog-lock checkpoint: the machine-readable plan catalog assigns every registered metric to an implemented plan family and records the non-execution boundaries. Its focused test prevents a registry metric from silently losing plan coverage.
- Completed output-level audit remediation: source-kind and charge-coverage filters/grouping, trough-to-recovery magnitude, verified deterministic finding/sample packets, and FIFO charge-kind allocation are now shared-engine primitives. Commission-only metrics are available only with complete per-kind charge allocation and otherwise fail closed.
- Completed agent-discovery checkpoint: the public execution capability catalog now advertises deterministic, evidence-linked finding/sample packets, source-kind selection, trough recovery, and the explicit authority needed for named commission analytics. Agents consume the result contract rather than calculate or narrate their own financial results.
- Completed operationalization Milestone 0: documented the one-path v3 runtime,
  inventoried the temporary legacy SQLite execution/import/analytics surface,
  and recorded the disposable-data reset procedure. The legacy store remains
  untouched until v3 import-to-dashboard proof; it has no conversion or
  fallback role.

## Next queue

1. Implement the smallest Milestone 1 batch: durable v3 source-document and
   canonical-execution persistence plus a focused restart-identity proof.
2. Preserve complete charge-kind authority requirements; do not manufacture
   exchange/regulatory/borrow labels from combined charges.
3. When the original May 2026 IBKR export is available, import its raw bytes
   through the v3 parser and the new v3 persistence boundary; do not relabel a
   legacy SQLite conversion as raw broker evidence.
