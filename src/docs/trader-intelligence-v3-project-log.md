# Trader Intelligence v3 Project Log

## Purpose

This is the active continuity log for the Trader Intelligence v3 evidence-first AI journal architecture.

Use it to record:

- architecture decisions;
- completed implementation slices;
- QA gates;
- verification;
- migrations;
- blockers;
- the exact next resume point.

The legacy `src/docs/codex-project-log.md` remains useful for the history of the v1/v2 deterministic analysis, route, candle, and level work. It no longer controls new v3 architecture.

---

## Resume Protocol

Read in this order:

1. `plan.md`
2. this file
3. `src/docs/trader-intelligence-v3-qa-architecture-review-2026-07-17.md`
4. `src/docs/trader-intelligence-ai-journal-v3-master-plan-2026-07-17.md`
5. `src/docs/trader-intelligence-plan-index.md`
6. `src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`

When documents conflict, the latest entry in this log may clarify the current decision, but it must not silently weaken a mandatory QA gate. Material architecture changes require an explicit amendment to the QA review or master plan.

---

## Current Resume Point

### 2026-07-17 — Gate 0 Execution Plan Activated and Verified

Status:

- master architecture remains conditionally approved;
- mandatory QA review is controlling;
- v3 planning chain is active in `plan.md`, `handoff.md`, and the plan index;
- Gate 0 and first internal slice plan has been created and is the active execution plan;
- the plan includes repository inventory, ten ADRs, versioned contracts, exact financial reference math, read-only adapters, synthetic golden fixtures, weekday analytics, daily-stop simulation, v3 CI, and detailed acceptance gates;
- stale cold-start handoff instructions that pointed to the old May plan were replaced;
- PR #94 title and body were updated to reflect the conditional QA verdict and active Gate 0 plan;
- a QA verdict comment was added to PR #94;
- no runtime code changed;
- no production deployment requested or allowed.

Active execution plan:

- `src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`

Next engineering action after the documentation PR is approved:

1. create a clean implementation branch from current `main`;
2. complete the current-system preserve/adapt/legacy/retire inventory;
3. write and accept ADRs 0001–0009;
4. leave ADR-0010 proposed with explicit AI provider/privacy/grounding criteria;
5. create the internal v3 contract boundary;
6. implement exact financial test helpers and public synthetic fixtures;
7. implement read-only current-data adapters;
8. implement performance-by-weekday and stop-after-consecutive-losses tools;
9. add v3 CI;
10. run focused and legacy regression verification;
11. update this log and gate status.

First implementation branch recommendation:

- `agent/trader-intelligence-v3-gate-0-foundation`

First-run restrictions:

- internal-only;
- read-only compatibility adapters;
- no AI model calls;
- no public v3 route;
- no production database write;
- no coach redesign;
- no support/resistance consumption;
- no new level detector;
- no unrestricted SQL;
- no vector database;
- no production deployment.

Documentation verification completed:

- PR changed-file list contains seven expected documentation files;
- the branch is ahead of `main`, has the same merge base, and is not behind;
- final branch comparison contains no runtime-code file;
- `plan.md`, `handoff.md`, and the plan index point to the same active Gate 0 plan;
- the QA review and Gate 0 plan headers and final directives were fetched and inspected;
- PR #94 remains open, mergeable, and draft;
- no runtime tests were required because this PR changes documentation only.

Gate 0 remains **in progress** until the ADRs and deterministic proof slice are implemented and verified.

### 2026-07-17 — Master Plan QA and Architecture Correction

Status:

- v3 master plan created in PR #94;
- full cross-plan and repository QA audit completed;
- architecture direction conditionally approved;
- mandatory QA amendment added;
- root `plan.md` switched from the legacy May plan chain to v3;
- plan index replaced with the v3 authority and phase order;
- no runtime code changed;
- no production deployment requested or allowed.

Key QA findings:

1. The current parser, normalization, reconstruction, replay-safety, and test work is valuable.
2. The current Trader Intelligence persistence and identity path is still prototype-oriented:
   - import planning uses demo workspace/user/account constants;
   - import routes directly instantiate SQLite repositories;
   - default production SQLite storage uses a temporary filesystem path;
   - shared Trader Intelligence tenancy is not yet established.
3. Critical chart enrichment currently uses Next.js `after()` and needs a durable workflow/outbox architecture before production reliance.
4. Exact financial representation and analytical P/L policy were missing from the original plan and are now P0 decisions.
5. Production CSV ingestion needs signed object storage, bounded/streaming parsing, retention, and deletion rather than treating large `csvText` JSON requests as the final architecture.
6. Market-data basis, instrument identity, and no-lookahead rules require stronger versioned contracts.
7. The existing level snapshot already exposes final level zones. V3 should add a Zone Usability and Congestion Layer, not duplicate `levels-system-v2` with a second independent detector.
8. Statistical tools need independent-cluster counts, discovery versus direct-analysis policy, chronological validation, multiple-comparison controls, and leakage tests.
9. Simulations need explicit intervention, fill, ambiguity, and sequential-state policies.
10. AI needs claim-level numeric grounding, server-owned evidence links, bounded tool loops, provider data policy, and release evaluations.
11. Migration must use one authoritative write path rather than indefinite dual-write.
12. Retention, deletion, backups, and tenant security must begin in early phases, not at the final beta phase.
13. Current general CI is not sufficient for v3 financial, database, tenant, migration, and AI gates.

Controlling documents:

- `src/docs/trader-intelligence-v3-qa-architecture-review-2026-07-17.md`
- `src/docs/trader-intelligence-ai-journal-v3-master-plan-2026-07-17.md`
- `src/docs/trader-intelligence-plan-index.md`
- `src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`

Current phase:

- **Gate 0 — governance, scope, and architecture lock**

---

## Decision Log

### ADR candidate: shared identity

State: required before Phase 1.

Recommended direction:

- create a shared platform-user abstraction backed initially by the existing authenticated site user;
- use an internal stable ID rather than a Discord identifier as the domain key;
- resolve workspace/account permissions server-side;
- require the authorization context in every repository and analytics tool call.

### ADR candidate: exact decimals

State: required before financial contracts are implemented.

Requirements:

- no binary floating-point authority for money, prices, fees, share quantities, FX, or P/L;
- exact decimal application library behind domain helpers;
- PostgreSQL `NUMERIC` or equivalent exact storage;
- decimal-string serialized contracts;
- versioned rounding and reconciliation rules.

### ADR candidate: analytical P/L

State: required before reconstruction v3.

Requirements:

- distinguish broker-reported, analytical, cash, and tax P/L;
- define average-cost/FIFO policy;
- define partial fills, fees, prior inventory, reversals, shorts, open positions, corporate actions, and currency behavior;
- version the policy and include it in results.

### ADR candidate: durable workflows

State: provider spike required in Gate 0.

Requirements:

- transactional outbox;
- provider-independent job interface;
- idempotent/resumable steps;
- bounded retries;
- tenant scope;
- cancellation and deletion awareness;
- observability.

Vercel Workflow may be evaluated because the application is on Vercel, but the financial domain must not depend directly on a beta-specific API.

### ADR candidate: support/resistance consumption

State: architecture direction approved.

Decision:

- keep `levels-system-v2` as factual producer;
- consume replay-safe final zones from saved snapshots;
- add zone usability, congestion, stable primary selection, and suppression;
- do not add another full detector inside Trader Intelligence;
- keep v3 AI execution-only until the zone usefulness gate passes.

---

## QA Gate Status

| Gate | Status | Notes |
|---|---|---|
| G0 Plan and architecture | In progress | Plan chain and file-level execution plan are complete and verified; ADRs and internal proof slice remain |
| G1 Identity and tenancy | Not started | Production blocker |
| G2 Exact ledger | Not started | Decimal and P/L policy decisions required |
| G3 Import durability | Not started | Object storage, outbox, durable jobs required |
| G4 Market and features | Not started | Basis/instrument/zone contracts required |
| G5 Analytics and simulations | Not started | First internal tools specified in active plan |
| G6 AI grounding | Not started | No model call allowed yet |
| G7 Zone usefulness | Not started | Must beat legacy nearest-level output |
| G8 Beta | Not started | Depends on all prior gates |

---

## Update Rules

After each meaningful v3 run, record:

- branch and PR;
- files and contracts changed;
- architecture decisions;
- tests and exact command results;
- database migration state;
- feature flags;
- rollout state;
- known limitations;
- next resume point.

Do not mark a gate complete because one unit test passes. Gate completion requires all acceptance criteria in the mandatory QA review and active phase plan.
