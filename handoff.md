# Trader Intelligence v3 Handoff

**Last updated:** 2026-07-17 America/Toronto  
**Active architecture:** Trader Intelligence v3  
**Current gate:** Gate 0 — governance, scope, and architecture lock  
**Active execution plan:** `src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`

Use this file for quick orientation. `plan.md` remains the root authority.

---

## 1. Resume Order

Read in this exact order:

1. `plan.md`
2. `src/docs/trader-intelligence-v3-project-log.md`
3. `src/docs/trader-intelligence-v3-qa-architecture-review-2026-07-17.md`
4. `src/docs/trader-intelligence-ai-journal-v3-master-plan-2026-07-17.md`
5. `src/docs/trader-intelligence-plan-index.md`
6. `src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`
7. legacy plans only when the active v3 work explicitly needs route history,
   fixture evidence, migration parity, or preserved implementation details.

When documents conflict:

1. latest v3 project-log decision;
2. mandatory v3 QA review;
3. v3 master plan;
4. active v3 execution plan;
5. legacy documents.

Do not resume the old May continuous coaching or UI batches merely because those
files still contain historical `Active` labels.

---

## 2. Current Product Direction

Trader Intelligence v3 is an evidence platform with an AI interface.

```text
trusted source file
  -> exact execution ledger
  -> versioned position and round-trip reconstruction
  -> replay-safe features
  -> deterministic analytics and simulations
  -> validated claims and evidence
  -> AI explanation
```

Code owns:

- broker CSV parsing;
- validation and repair state;
- duplicate detection;
- execution normalization;
- financial math;
- position and round-trip reconstruction;
- indicators and market features;
- statistics;
- simulations;
- evidence identifiers;
- authorization.

AI may select approved tools and explain validated results. It must not become
the parser, calculator, database, unrestricted SQL generator, market-data
inventor, or live trade-signal engine.

---

## 3. QA Verdict

The master plan is conditionally approved.

The current repository contains valuable parsing, reconstruction, replay-safety,
product, and testing foundations. It does not yet contain a production-ready
multi-user Trader Intelligence identity, persistence, ingestion, or durable-job
boundary.

Before real production user data is accepted, v3 must establish:

- shared platform identity;
- server-derived workspace/account authorization;
- PostgreSQL production authority;
- exact decimal financial types;
- versioned analytical P/L and reconstruction policy;
- secure raw-file object storage and retention;
- bounded/streaming parsing;
- transactional outbox and durable workflows;
- instrument identity and market-data price-basis contracts;
- tenant isolation, deletion, backup, and recovery;
- one authoritative migration write path;
- v3 financial, database, security, architecture, and build CI.

The current demo IDs, direct SQLite route construction, temporary-filesystem
production SQLite, and request-lifecycle critical jobs are prototype paths, not
production foundations.

---

## 4. Support and Resistance Decision

Do not create a second independent support/resistance detector inside Trader
Intelligence.

`levels-system-v2` already produces replay-safe final zones with boundaries,
strength, touches, confluence, sources, timeframes, freshness, and other evidence.

V3 adds a **Zone Usability and Congestion Layer** that:

- consumes the complete replay-safe final-zone map;
- preserves source-zone IDs;
- deduplicates only proven overlap;
- measures local congestion and clear space;
- selects at most one primary zone per side;
- suppresses conclusions when structure is crowded, unstable, stale,
  synthetic-only, or basis-unsafe.

V3 AI remains execution-only until this layer passes a separate stability,
suppression, and blinded-usefulness gate.

---

## 5. Active Gate 0 Work

The active plan requires:

- current-system preserve/adapt/legacy/retire inventory;
- ADRs for identity, decimals, P/L, database, file ingestion, durable workflows,
  instrument/basis, product scope, statistics/simulations, and future AI policy;
- `src/lib/trader-intelligence-v3/` internal boundary;
- server-derived authorization-context contract;
- exact money, price, quantity, fee, percentage, and currency contracts;
- dataset-version contract;
- canonical execution and analytical round-trip contracts;
- claim/evidence, job, and future usage-reservation contracts;
- read-only adapter from current saved data;
- independent reference financial math;
- public synthetic golden fixtures;
- performance-by-weekday analytics;
- stop-after-consecutive-losses simulation;
- v3 CI.

The first coding run is internal-only.

It must not include:

- an AI provider call;
- a public v3 route;
- production database writes;
- a coach redesign;
- support/resistance consumption;
- a second level detector;
- arbitrary SQL;
- vector storage;
- production deployment.

---

## 6. First Implementation Branch

After the documentation architecture PR is accepted, create a clean branch from
current `main`, recommended:

`agent/trader-intelligence-v3-gate-0-foundation`

Do not mix Gate 0 code into the documentation PR unless explicitly instructed.

The implementation order is:

1. inventory current modules;
2. accept ADRs 0001–0009;
3. create contracts and architecture-boundary tests;
4. create tenant-aware in-memory/read-only repositories;
5. build current-data adapter and synthetic fixtures;
6. build independent exact reference math;
7. implement weekday analytics;
8. implement daily-stop simulation;
9. add v3 CI;
10. run focused and legacy regression verification;
11. update the v3 project log and QA gate status.

---

## 7. Engineering Guardrails

- Do not use JavaScript floating point as financial authority.
- Do not add USD and CAD results together without a versioned FX policy.
- Do not guess prior inventory or a missing entry price.
- Do not call analytical P/L tax P/L.
- Do not trust tenant IDs from the browser.
- Do not expose another user’s evidence through guessed IDs or cache reuse.
- Do not let a model calculate financial metrics from raw rows.
- Do not let the model repeatedly search tools until it finds a favourable result.
- Do not let one unusual session create high confidence merely because it contains
  many trades.
- Do not call a historically optimized rule validated without holdout and
  prospective tracking.
- Do not simulate a hypothetical partial exit while pretending all later actual
  shares still existed.
- Do not use chart-derived features when execution and candle basis do not align.
- Do not treat level proximity alone as a mistake, recommendation, or trade grade.
- Do not introduce long-lived dual-write.
- Do not defer deletion, retention, tenant security, or backups to the final phase.

---

## 8. Verification Expectations

The first coding PR must run and report:

- dependency installation from lockfile;
- TypeScript typecheck;
- focused v3 lint;
- v3 unit tests;
- exact reference/differential tests;
- deterministic property-based tests with seeds;
- architecture-boundary tests;
- production build;
- relevant legacy regression tests.

Normal PR CI must not call a live language model.

No QA gate is complete because one unit test passes. Use the acceptance matrix in
the mandatory QA review and active Gate 0 plan.

---

## 9. Current Status

Documentation PR #94 contains:

- the v3 master plan;
- the mandatory QA review;
- the active Gate 0 execution plan;
- the v3 project log;
- corrected root plan;
- corrected plan index;
- this handoff.

Runtime code has not changed. The PR should remain draft until the architecture
review is accepted.

---

## 10. Final Working Standard

When evidence is incomplete, the system must become less confident, not more
creative.

Every useful answer must be exact where exactness is possible, explicit about
simulation assumptions, linked to the underlying evidence, and honest when the
data does not support a conclusion.
