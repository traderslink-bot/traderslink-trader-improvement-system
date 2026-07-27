# Trade Execution Analytics Engine Documentation

These documents are the controlling set for the Trader Intelligence v3
Trade Execution Analytics Engine. Read both before planning or extending it.

1. [Trade Execution Analytics Engine Plan](./trade_execution_analytics_engine_plan.md)
2. [Future Agent Compatibility Appendix](./trade_execution_analytics_engine_future_agent_compatibility_appendix.md)
3. [v3 Dashboard Operationalization Plan](./v3-dashboard-operationalization-plan.md)
4. [Milestone 0 Legacy Execution Runtime Inventory](./v3-legacy-execution-runtime-inventory.md)

The plan defines the deterministic execution-analytics scope. The appendix
updates that plan with the architecture required for a future agent layer; it
does not authorize an LLM to calculate metrics or replace v3's deterministic
authority.

This is a project-local reference copy of the source documents in
`traderslink.pro/app/intelligence`. Keep any future edits synchronized across
both documents and retain the reciprocal links at the top of each file.

## Engine and replacement boundary

The implementation lives at
`src/lib/trader-intelligence-v3/analytics/query/`, supported by the verified
analytical-row dataset, FIFO accounting, and raw broker CSV ingestion modules
under `src/lib/trader-intelligence-v3/`. This PR **extends the existing v3
query engine in place**; it does not create a competing query engine.

It is the source of truth for deterministic analytics derived from verified
trade executions. The older application analytics surface remains a consumer
boundary outside this PR. A later, separately reviewed migration PR must move
dashboard consumption to this engine and retire duplicated legacy calculations.
No dashboard migration is included here.

The operationalization plan records the separate, local-only path that will
replace this temporary legacy consumer boundary. It prohibits SQLite conversion,
fallback, or parallel execution analytics; legacy retirement occurs only after
v3 import-to-dashboard proof.

## Supported scope

The engine emits content-addressed result, evidence, findings, attribution,
distribution, and pagination packets for core gross/net P/L, charges and
commission-only charge kinds where allocation is complete, outcome and
expectancy metrics, period/session/ticker/direction/bucket analytics,
chronological prior-outcome/sequence/repeat-attempt/streak/pre-entry daily
state analytics, realized giveback/drawdown, and row/ingestion data quality.

Every metric declaration carries required facts, sample-size and unavailable
reason policy. Results fail closed when required authority, sufficient sample,
currency partition, charge coverage, ordering, or supporting evidence is not
available. The packet identity binds the normalized plan, result rows,
candidate/included/excluded populations, and evidence references.

## Explicitly unsupported

Execution data alone cannot establish market/candle context, VWAP, setup
quality, planned risk, optimal exits, unrealized drawdown, counterfactual
trade outcomes, or Coach interpretation. Those require separately governed
data and a later boundary; this engine returns declared unsupported or
unavailable responses instead of inferring them.
