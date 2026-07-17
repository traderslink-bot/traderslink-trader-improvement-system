# Trader Intelligence Plan Index

**Last updated:** 2026-07-17 America/Toronto  
**Active architecture:** Trader Intelligence v3  
**Current phase:** Gate 0 — governance, scope, and architecture lock  
**Purpose:** Keep future implementation aligned with the evidence-first AI journal architecture and prevent drift back into the legacy deterministic coaching roadmap.

---

## 1. Required Resume Order

1. Read `plan.md`.
2. Read `src/docs/trader-intelligence-v3-project-log.md`.
3. Read `src/docs/trader-intelligence-v3-qa-architecture-review-2026-07-17.md`.
4. Read `src/docs/trader-intelligence-ai-journal-v3-master-plan-2026-07-17.md`.
5. Read the current v3 phase-specific implementation plan when one exists.
6. Read legacy plans only for preserved implementation evidence, migration parity, or route history.

When documents conflict, use this precedence:

1. latest v3 project-log decision;
2. mandatory v3 QA review;
3. v3 master plan;
4. current v3 phase plan;
5. legacy documents.

---

## 2. Active Plans

### Master architecture

- `src/docs/trader-intelligence-ai-journal-v3-master-plan-2026-07-17.md`

Purpose:

- defines the product, target architecture, data model, analytics tools, AI layer,
  migration direction, implementation phases, MVP, and long-term directive.

Status:

- conditionally approved;
- must be implemented with the QA amendments below.

### Mandatory QA and architecture amendments

- `src/docs/trader-intelligence-v3-qa-architecture-review-2026-07-17.md`

Purpose:

- records the cross-plan and repository audit;
- corrects production-readiness assumptions;
- moves auth, exact financial types, durable jobs, file ingestion, retention, and
  data isolation into early gates;
- changes support/resistance work from a duplicate detector into a final-zone
  usability and congestion layer;
- strengthens statistical, simulation, AI-grounding, migration, CI, and launch
  criteria;
- defines the revised phase order and QA gates.

Status:

- mandatory and controlling where it conflicts with the master plan.

### V3 project log

- `src/docs/trader-intelligence-v3-project-log.md`

Purpose:

- records decisions, completed v3 work, verification, blockers, and the current
  resume point without mixing the new architecture into the legacy project log.

### Current implementation-run plan

No phase-specific coding plan is active yet.

The next plan to create after this architecture PR is approved should be:

- `src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`

It must convert Gate 0 and the revised first implementation run into file-level
work, acceptance criteria, ADRs, and verification commands.

---

## 3. Current Gate 0 Decisions

The following decisions must be locked before production implementation:

1. shared site identity and Trader Intelligence authorization context;
2. workspace/account tenancy and RLS strategy;
3. exact decimal library and database numeric representation;
4. analytical P/L, fee, partial-fill, reversal, short, and prior-inventory policy;
5. per-currency reporting and future FX policy;
6. PostgreSQL migration framework and authoritative write-path strategy;
7. secure object storage and raw-file retention;
8. transactional outbox and durable workflow provider;
9. instrument identity and market-data price-basis contract;
10. MVP direction scope for long/short facts and short-side coaching;
11. required CI checks and private/public fixture policy;
12. preserve/adapt/legacy/retire inventory.

No public AI route or production v3 write path should be added before these
choices are documented.

---

## 4. Revised Phase Order

1. **Gate 0:** governance, scope, architecture decisions, and ADRs.
2. **Phase 1:** shared identity, tenant-safe persistence, exact math, audit,
   outbox, durable-job substrate, retention, and dataset versioning.
3. **Phase 2:** production file ingestion, immutable execution ledger,
   reconstruction, correction events, and reconciliation.
4. **Phase 3:** instrument identity, price-basis safety, market snapshots,
   feature foundation, and Zone Usability and Congestion Layer.
5. **Phase 4:** deterministic analytics and counterfactual simulation tools.
6. **Phase 5:** claim, evidence, finding, limitation, and cache-invalidation
   services.
7. **Phase 6:** execution-only Ask AI behind a feature flag.
8. **Phase 7:** calibrated market-context coaching, observable behavior, setup
   classification, corrections, and similar-trade retrieval.
9. **Phase 8:** durable reports and Rule Lab.
10. **Phase 9:** primary product UI replacement.
11. **Phase 10:** migration, beta, recovery, security, cost, and launch gates.

Support/resistance cannot reach v3 AI before its separate usefulness gate passes.

---

## 5. First Internal Coding Slice

The first coding slice may begin only after the architecture PR is accepted.
It is internal-only and should include:

- `src/lib/trader-intelligence-v3/` boundary;
- authorization-context contract;
- decimal money/price/quantity contracts;
- dataset-version contract;
- canonical execution and analytical round-trip contracts;
- analytics tool, claim/evidence, durable-job, and usage-reservation contracts;
- read-only adapters from current saved data;
- independent financial reference math;
- synthetic golden fixtures;
- performance-by-weekday tool;
- daily-stop-after-consecutive-losses simulation;
- v3 CI checks.

It must not include:

- a model call;
- a public v3 route;
- production database writes;
- a coach redesign;
- a new level detector;
- unrestricted SQL;
- a vector database;
- production deployment.

---

## 6. Support and Resistance Decision

`levels-system-v2` remains the factual source.

The existing level-analysis snapshot already contains final zones and evidence.
V3 must consume the complete replay-safe final-zone map and add a **Zone
Usability and Congestion Layer** that:

- preserves source-zone IDs;
- deduplicates only proven overlap;
- calculates congestion and clear space;
- selects at most one primary support and one primary resistance zone;
- fails closed when structure is crowded, unstable, stale, synthetic-only, or
  basis-unsafe.

Do not rebuild candle reading or a second independent level detector inside
Trader Intelligence.

---

## 7. Production Blockers

The following are explicit launch blockers:

- demo identity constants in a production path;
- unauthenticated or browser-authorized tenant access;
- temporary-filesystem SQLite as authoritative storage;
- floating-point financial authority;
- undefined analytical P/L policy;
- cross-currency aggregation without FX policy;
- raw CSV JSON uploads without production size/storage controls;
- critical jobs relying only on request lifecycle;
- price-basis mismatch used for chart-derived claims;
- AI numbers that do not map to validated tool claims;
- unrestricted model-generated SQL;
- level coaching from congested structure;
- indefinite dual-write migration;
- missing deletion/retention behavior;
- no tenant-isolation tests.

---

## 8. Legacy Planning Archive

The following remain useful as history but are not active architecture:

- `src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md`
- `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`
- `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`
- `src/docs/trader-intelligence-coaching-evidence-model-2026-05-09.md`
- `src/docs/trader-intelligence-analytics-continuous-product-plan-2026-05-09.md`
- `src/docs/trader-intelligence-coach-continuous-product-plan-2026-05-09.md`
- `src/docs/trader-intelligence-progress-continuous-product-plan-2026-05-09.md`
- older route, import, calibration, and handoff plans.

Use them for:

- existing route behavior;
- fixture and test coverage;
- evidence-safety lessons;
- migration parity;
- preserved parser/reconstruction logic;
- prior product QA findings.

Do not resume their old active batches.

---

## 9. Plan-Creation Rules

Create a new v3 plan only when a phase or feature has:

- a distinct contract boundary;
- its own acceptance and QA gates;
- a multi-run implementation sequence;
- migration or production risk;
- enough work that it would be buried in the project log.

Every v3 plan must include:

- purpose and non-goals;
- source-of-truth layer;
- exact contracts;
- authorization and tenancy impact;
- financial precision impact;
- data-version impact;
- migration impact;
- failure/degradation behavior;
- acceptance criteria;
- verification commands;
- rollout and rollback;
- documentation/log updates.

Do not create separate plans for tiny TODOs.

---

## 10. Update Protocol

After meaningful v3 work:

1. update `src/docs/trader-intelligence-v3-project-log.md`;
2. update the active phase plan;
3. update this index when phase authority or status changes;
4. update the master plan or QA review only for material architecture changes;
5. preserve legacy docs unless a factual correction is required;
6. record tests, migrations, and rollout state before reporting completion.
