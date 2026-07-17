# Trader Intelligence Plan Entry Point

**Last updated:** 2026-07-17 America/Toronto  
**Active architecture:** Trader Intelligence v3  
**Current gate:** Gate 0 — governance, scope, and architecture lock

Start here when resuming Trader Intelligence product, import, analytics, coaching,
market-context, AI, persistence, or QA work.

The prior deterministic coaching and continuous UX plans remain in the repository
as implementation history. They no longer control future architecture when they
conflict with the v3 plan chain.

## Controlling Read Order

1. `src/docs/trader-intelligence-v3-project-log.md`
2. `src/docs/trader-intelligence-v3-qa-architecture-review-2026-07-17.md`
3. `src/docs/trader-intelligence-ai-journal-v3-master-plan-2026-07-17.md`
4. `src/docs/trader-intelligence-plan-index.md`
5. The current v3 phase-specific implementation plan, when one exists
6. Legacy plans only when a v3 task explicitly depends on preserved historical
   behavior, route, fixture, or migration evidence

Precedence when documents disagree:

1. latest v3 project-log decision;
2. mandatory v3 QA review;
3. v3 master plan;
4. current v3 phase plan;
5. legacy documents.

## Active Direction

Build Trader Intelligence v3 as an evidence platform with an AI interface:

```text
trusted import
  -> exact execution ledger
  -> versioned reconstruction
  -> replay-safe features
  -> analytics and simulations
  -> validated claims and evidence
  -> AI explanation
```

Code remains authoritative for:

- CSV parsing;
- duplicate detection;
- execution normalization;
- position and round-trip reconstruction;
- P/L, fees, quantities, and financial math;
- indicators and market features;
- statistical summaries;
- simulations;
- evidence identifiers.

AI may select approved tools, connect validated findings, and explain them. It
must not become the parser, calculator, database, unrestricted SQL author, or
source of missing market data.

## Current Gate 0 Work

Before production implementation proceeds, resolve and document:

- shared platform identity and server-derived tenancy;
- exact decimal money/price/quantity representation;
- analytical P/L and reconstruction policy;
- PostgreSQL production authority and migration framework;
- secure raw-file upload and retention;
- durable workflow/outbox architecture;
- initial asset, broker, direction, and currency scope;
- v3 CI requirements;
- preserve/adapt/legacy/retire inventory.

The first coding run may create internal contracts, read-only adapters, exact
financial test helpers, and deterministic analytics tools. It must not add a
public AI route, production write path, or coach redesign.

## Support and Resistance Ruling

Do not add another independent support/resistance detector inside Trader
Intelligence.

`levels-system-v2` remains the factual producer. V3 adds a Zone Usability and
Congestion Layer that consumes replay-safe final zones, measures whether the
structure is decision-useful, selects at most one primary zone per side, and
suppresses level conclusions when the area is crowded or indeterminate.

Until that layer passes its QA gate, v3 AI remains execution-only and must not
consume legacy nearest-level coaching conclusions.

## Production Blockers

No production user import may use:

- demo workspace/user/account constants;
- temporary-filesystem SQLite as authoritative storage;
- browser-supplied tenancy as authorization;
- floating-point financial authority;
- request-lifecycle background work for critical jobs;
- raw CSV content in normal logs or AI prompts.

## Legacy Plan Use

Older plans may still be consulted for:

- broker fixtures and import behavior;
- raw timeline and reconstruction logic;
- replay-safe candle and basis safeguards;
- current route behavior;
- existing product language and accessibility lessons;
- migration parity and regression coverage.

Do not continue an older active batch merely because its document still says
`Active`. New work must identify its v3 phase, source-of-truth layer, evidence
contract, migration impact, and QA gate.

## Update Protocol

After meaningful v3 work:

1. update `src/docs/trader-intelligence-v3-project-log.md`;
2. update the active v3 phase plan or QA gate status;
3. update `src/docs/trader-intelligence-plan-index.md` when authority or phase
   changes;
4. preserve legacy docs unless an explicit correction is necessary;
5. run the required focused tests and broader gates for the changed layer.
