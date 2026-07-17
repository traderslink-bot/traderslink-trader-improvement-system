# Trader Intelligence Plan Entry Point

**Last updated:** 2026-07-17 America/Toronto  
**Active architecture:** Trader Intelligence v3  
**Current operating profile:** `private_owner_alpha`  
**Primary domain:** small-cap and micro-cap active trading  
**Product boundary:** retrospective educational trade review, not live investment advice or automated execution  
**Current gate:** Gate 0 — common truth, architecture lock, and first private-alpha deterministic slice  
**Active execution plan:** `src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`

Start here when resuming Trader Intelligence product, import, analytics, coaching,
market-context, AI, persistence, or QA work.

The prior deterministic coaching and continuous UX plans remain in the repository
as implementation history. They no longer control future architecture when they
conflict with the v3 plan chain.

## Controlling Read Order

1. `src/docs/trader-intelligence-v3-project-log.md`
2. `src/docs/trader-intelligence-v3-second-pass-qa-private-alpha-small-micro-cap-review-2026-07-17.md`
3. `src/docs/trader-intelligence-v3-qa-architecture-review-2026-07-17.md`
4. `src/docs/trader-intelligence-ai-journal-v3-master-plan-2026-07-17.md`
5. `src/docs/trader-intelligence-plan-index.md`
6. `src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`
7. Legacy plans only when a v3 task explicitly depends on preserved historical
   behavior, route, fixture, education, or migration evidence

Precedence when documents disagree:

1. latest v3 project-log decision;
2. mandatory second-pass private-alpha and small/micro-cap QA review;
3. first mandatory v3 QA review;
4. v3 master plan;
5. current v3 phase plan;
6. legacy documents.

## Active Direction

Build Trader Intelligence v3 as an evidence platform with an AI interface:

```text
private broker data
  -> exact execution truth
  -> versioned reconstruction
  -> replay-safe features
  -> analytics and simulations
  -> validated claims and evidence
  -> owner-only AI explanation
  -> small/micro-cap market enrichment by evidence tier
  -> future public-platform hardening
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
must not become the parser, calculator, database, unrestricted SQL author, source
of missing market data, live signal engine, or order-execution system.

## Current Product Facts

- The system is currently tested only by the owner.
- It is not a public multi-user product.
- The first useful release is a private owner-only alpha.
- Future public readiness must remain possible through clean interfaces, but it
  must not block early usefulness testing.
- Exact math, evidence, basis safety, and simulation honesty remain mandatory in
  private alpha.
- Multi-user RLS, billing, public object storage, and public SLOs belong to the
  future public-readiness track.
- The intended specialization is small/micro-cap trading, including premarket,
  high volatility, halts, gaps, thin liquidity, wide spreads, partial fills,
  reverse splits, float uncertainty, catalysts, and repeated ticker attempts.
- The product analyzes completed executions for education and self-review. It does
  not provide current buy/sell/hold instructions, live price targets, automated
  orders, guaranteed improvement, tax advice, or portfolio allocation advice.

## Current Gate 0 Work

The active Gate 0 plan defines:

- a complete preserve/adapt/legacy/retire inventory;
- architecture decision records;
- deployment-profile and authorization-context contracts;
- exact decimal money/price/quantity contracts;
- analytical P/L and reconstruction policy;
- instrument identity and price-basis direction;
- dataset versioning;
- read-only current-data adapters;
- private real-data and public synthetic-fixture policy;
- synthetic golden financial fixtures;
- performance-by-weekday analytics;
- stop-after-consecutive-losses simulation;
- v3 CI and acceptance gates.

Before results are trusted on the owner’s real data, resolve and document:

- exact decimal money/price/quantity representation;
- analytical P/L and reconstruction policy;
- timestamp and session policy;
- instrument identity and corporate-action basis policy;
- private-alpha storage and backup;
- dataset and evidence versioning;
- initial asset, broker, direction, and currency scope;
- v3 CI requirements;
- preserve/adapt/legacy/retire inventory.

Before invited or public users, additionally resolve:

- shared platform identity and server-derived tenancy;
- PostgreSQL production authority and migration framework;
- secure object-storage upload and retention;
- durable workflow/outbox architecture;
- tenant isolation and deletion;
- public rate limits, entitlements, licensing, monitoring, and recovery.

The first coding run may create internal contracts, read-only adapters, exact
financial test helpers, and deterministic analytics tools. It must not add a
public AI route, production multi-user write path, support/resistance consumer,
or coach redesign.

An owner-only AI explanation route may be tested later in the private-alpha track
only after deterministic tools, claim validation, evidence resolution, cost caps,
and the private deployment gate pass.

## Small/Micro-Cap Data Ruling

An answer must declare the evidence capability it used:

- execution-only;
- candle-enriched;
- event-enriched;
- quote-enriched;
- share-structure-enriched;
- fully enriched with explicit limitations.

Candle data cannot be described as verified spread, liquidity, or slippage.
Target touches in OHLCV bars are price-path scenarios, not proof of executable
fills. Float, catalyst, halt, listing, and dilution context require dated source
provenance. Historical market data must be aligned to the execution price basis.

## Support and Resistance Ruling

Do not add another independent support/resistance detector inside Trader
Intelligence.

`levels-system-v2` remains the factual producer. V3 adds a Zone Usability and
Congestion Layer that consumes replay-safe final zones, measures whether the
structure is decision-useful, selects at most one primary zone per side, and
suppresses level conclusions when the area is crowded, unstable, stale,
synthetic-only, or basis-unsafe.

Until that layer passes its QA gate, v3 AI remains execution-only and must not
consume legacy nearest-level coaching conclusions.

## Private Alpha and Production Blockers

Private owner alpha may use an explicitly isolated durable local SQLite adapter
and owner identity adapter. Those are not public-production architecture.

No public or invited-user import may use:

- global demo workspace/user/account constants;
- temporary-filesystem SQLite as authoritative storage;
- browser-supplied tenancy as authorization;
- floating-point financial authority;
- an undefined reconstruction or P/L policy;
- cross-currency aggregation without a versioned FX policy;
- request-lifecycle background work for critical jobs;
- raw CSV content in normal logs or AI prompts;
- chart-derived claims when execution and market-data basis do not align.

No private-alpha result may use:

- floating-point financial authority;
- unknown price basis for chart-derived facts;
- an undefined reconstruction policy;
- raw CSV data in AI prompts by default;
- candle-only data to claim verified spread, liquidity, or executable fills;
- current directional market advice.

## Legacy and Education Use

Older plans may still be consulted for:

- broker fixtures and import behavior;
- raw timeline and reconstruction logic;
- replay-safe candle and basis safeguards;
- current route behavior;
- existing product language and accessibility lessons;
- migration parity and regression coverage.

The Academy may be linked as educational context for halts, low-float volatility,
spread, slippage, float rotation, catalysts, filings, and trade review. Academy
prose is not analytical evidence and must not authorize a finding.

Do not continue an older active batch merely because its document still says
`Active`. New work must identify its v3 gate, deployment profile,
source-of-truth layer, evidence capability, migration impact, and QA gate.

## Update Protocol

After meaningful v3 work:

1. update `src/docs/trader-intelligence-v3-project-log.md`;
2. update the active v3 phase plan or QA gate status;
3. update `src/docs/trader-intelligence-plan-index.md` when authority or phase
   changes;
4. update the second-pass QA review when private-alpha or small/micro-cap domain
   rulings change materially;
5. preserve legacy docs unless an explicit correction is necessary;
6. run the required focused tests and broader gates for the changed layer.
