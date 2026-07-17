# Trader Intelligence v3 Plan Index

**Last updated:** 2026-07-17 America/Toronto  
**Active architecture:** Trader Intelligence v3  
**Operating profile:** `private_owner_alpha`  
**Hosting declaration:** `local_only` or `private_hosted`  
**Primary domain:** U.S. listed small-cap and micro-cap active trading  
**Product boundary:** retrospective educational trade review  
**Current gate:** GA0-A1 — containment and architecture boundaries  
**Active implementation plan:** `src/docs/trader-intelligence-v3-ga0-a-control-and-exact-truth-implementation-plan-2026-07-17.md`

This index identifies the active authority and current implementation sequence.

---

# 1. Resume Order

1. `plan.md`
2. `src/docs/trader-intelligence-v3-project-log.md`
3. `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`
4. `src/docs/trader-intelligence-v3-ga0-a-control-and-exact-truth-implementation-plan-2026-07-17.md`
5. detailed QA reviews/master plan only for rationale
6. legacy documents only for preserved code, fixtures, routes, education, or migration evidence

Precedence:

1. latest explicit accepted decision in the project log;
2. controlling architecture specification;
3. active implementation plan;
4. detailed reviews/master plan as rationale;
5. legacy documents.

Material architecture changes update the controlling specification. QA reviews remain
audit evidence; they do not become parallel long-term authorities by declaration alone.

---

# 2. Active Documents

## Controlling architecture

`src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`

Status:

- active and controlling;
- consolidates accepted architecture decisions;
- updated only for material architecture changes.

## Active GA0-A implementation plan

`src/docs/trader-intelligence-v3-ga0-a-control-and-exact-truth-implementation-plan-2026-07-17.md`

Status:

- active file-level plan;
- next coding scope is GA0-A1 only;
- splits GA0-A into GA0-A1, GA0-A2, and GA0-A3;
- moves weekday analytics and daily-stop simulation to GA0-B.

## Active project log

`src/docs/trader-intelligence-v3-project-log.md`

Status:

- active continuity and decision register;
- records branch, PR, verification, profile, hosting mode, limitations, and next action.

## Former umbrella Gate 0 plan

`src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`

Status:

- umbrella/historical implementation plan;
- no longer controls the next coding PR;
- useful for broader Gate 0 rationale and later GA0-B tool requirements.

---

# 3. QA and Architecture Evidence

## Fourth-pass QA

`src/docs/trader-intelligence-v3-fourth-pass-qa-operational-integrity-canonical-identity-and-delivery-review-2026-07-17.md`

Contributions:

- private-hosted route containment as an immediate real-data gate;
- legacy 32-bit fingerprints classified migration-only;
- canonical serialization and cryptographic content identity;
- exact execution duplicate/collision states;
- bitemporal correction semantics;
- factual lifecycle separated from user review disposition;
- open-position retrospective boundary;
- immutable analysis snapshots;
- manifest-scoped evidence IDs;
- runtime validation and dimensional units;
- parser hardening requirements;
- WAL-safe backup and restore;
- AI artifact versus regeneration semantics;
- calibration/holdout/regression separation;
- exploration ledger;
- degraded/offline behavior;
- performance budgets;
- GA0-A split into three reviewable PRs.

## Third-pass QA

`src/docs/trader-intelligence-v3-third-pass-qa-source-governance-reproducibility-and-evaluation-review-2026-07-17.md`

Contributions:

- one controlling architecture authority;
- content-addressed manifests;
- dataset coverage;
- per-capability eligibility;
- source registry and source hierarchy;
- no authoritative runtime web search;
- evaluation layers;
- statistical modes and strategy-era handling;
- GA0-A/B/C high-level split.

## Second-pass QA

`src/docs/trader-intelligence-v3-second-pass-qa-private-alpha-small-micro-cap-review-2026-07-17.md`

Contributions:

- private owner alpha sequencing;
- small/micro-cap domain requirements;
- evidence capability tiers;
- educational boundary;
- private data policy;
- owner-only AI after deterministic grounding.

## First QA review

`src/docs/trader-intelligence-v3-qa-architecture-review-2026-07-17.md`

Contributions:

- exact financial types and P/L policy;
- future public identity, tenancy, persistence, ingestion, durability, security, and migration gates;
- statistical and AI grounding;
- Zone Usability and Congestion Layer instead of another level detector.

## Original master plan

`src/docs/trader-intelligence-ai-journal-v3-master-plan-2026-07-17.md`

Status:

- product vision and architectural rationale;
- not the sole execution authority.

---

# 4. Current Product Facts

- The current tester is the owner.
- The system is not currently public or multi-user.
- The current deployment profile is `private_owner_alpha`.
- Hosting must declare `local_only` or `private_hosted`.
- Private-hosted mode requires owner authorization on every Intelligence page/API.
- Real broker data must not be used on anonymously reachable hosted routes.
- The primary domain is U.S. listed small-cap and micro-cap active trading.
- The app reviews completed executions and historical context.
- The purpose is education and self-improvement.
- The app is not a live signal, automated broker, tax tool, portfolio allocator, or
  guaranteed-performance service.
- Private-alpha status does not relax canonical identity, exact math, temporal truth,
  coverage, eligibility, no-lookahead, basis safety, backup, privacy, or simulation honesty.

---

# 5. Current Architecture

```text
contained owner-only environment
  -> deterministic import and validation
  -> canonical exact executions
  -> immutable corrections and versioned reconstruction
  -> explicit coverage and content-addressed manifest
  -> capability eligibility and consistent analysis snapshot
  -> deterministic analytics and simulations
  -> stable claims and evidence
  -> evaluated owner-only AI explanation
  -> qualified small/micro-cap enrichment
  -> usefulness calibration
  -> future public hardening
```

AI explains validated deterministic results. It does not own parsing, identity,
financial math, reconstruction, unrestricted database access, external source truth,
live signals, current targets, or order execution.

---

# 6. Gate Structure

## GA0-A1 — Containment and Architecture Boundaries

Current target:

- deployment/hosting contracts;
- private-owner route containment contract;
- preserve/adapt/legacy/retire inventory;
- minimal v3 boundary;
- dependency guard;
- private-data repository guard;
- legacy hazard register.

Recommended branch:

`agent/trader-intelligence-v3-ga0-a1-containment`

## GA0-A2 — Canonical Execution and Exact Financial Truth

After GA0-A1 review:

- exact decimals;
- canonical serialization and cryptographic hashes;
- execution identity and ordering;
- duplicate/correction/collision states;
- analytical P/L/reconstruction policy;
- independent reference math;
- exact synthetic fixtures.

## GA0-A3 — Temporal, Manifest, and Eligibility Truth

After GA0-A2 review:

- bitemporal corrections;
- factual lifecycle versus review disposition;
- open-position boundary;
- dataset and coverage manifests;
- per-capability eligibility;
- immutable analysis snapshot;
- stable evidence references;
- runtime validation;
- invalidation/stale states;
- WAL-safe backup/restore;
- parser hardening contract/tests.

## GA0-B — Deterministic Proof

After all GA0-A slices:

- read-only current-data adapter;
- weekday analytics;
- daily-stop simulation;
- evidence resolver;
- inclusion/exclusion accounting;
- diagnostics;
- property/differential tests;
- v3 CI.

## GA0-C — Private Calibration

- private fixture manifest without raw data;
- reconciliation and coverage report;
- owner evidence review;
- restore drill;
- defects converted into safe regressions;
- Gate 0 exit decision.

## GA1 — Execution-Only Analytics

- time of day;
- sequence;
- after-loss/after-win;
- repeated ticker attempts;
- historical size-performance;
- hold time;
- adds/reductions;
- fee drag;
- open-position separation.

## GA2 — Owner-Only AI

Requires tool registry, bounded planning, claim/evidence/capability validation, answer
schema/replay, cost limits, owner gate, prompt-injection tests, no raw CSV prompts, and
evaluation.

## GA3 — Qualified Market Enrichment

Add one capability/source at a time: candles, SEC, halts, instrument mapping, dated
share structure, qualified FINRA context, quotes, and zone usability.

## GA4 — Usefulness Calibration

Compare deterministic-only, legacy v2, v3 AI, and abstention for correctness, trust,
novelty, repetition, evidence use, owner preference, latency, and cost.

## Future public track

Identity, tenancy, PostgreSQL/RLS, object storage, durable jobs, deletion/retention,
entitlements, licensing, observability, recovery, security, and launch review.

---

# 7. Current Prohibitions

GA0-A1 must not add:

- AI/model calls;
- new public feature routes;
- production multi-user writes;
- analytics tools;
- market enrichment;
- support/resistance consumption;
- another level detector;
- setup classification;
- coaching changes;
- `/coach` redesign;
- unrestricted SQL;
- vector storage;
- production deployment.

An access guard or fail-closed disabling of existing private routes is permitted.

---

# 8. External Source Opportunities

Later candidates, all subject to registry, provenance, terms, coverage, fixtures, and
fail-closed capability rules:

- SEC EDGAR filings, Company Facts, archives, RSS, and trading suspensions;
- Nasdaq Trader symbol directories, halt RSS, and dated Reg SHO threshold lists;
- NYSE halt resources;
- LULD rules as reference only;
- FINRA short-sale-volume and short-interest datasets with distinct definitions;
- OpenFIGI mapping candidates;
- selected Nasdaq Data Link datasets after review.

Rules:

- free access does not imply public-commercial rights;
- threshold status is not short interest or squeeze proof;
- regulatory suspensions are not ordinary volatility halts;
- current data is not automatically historical;
- runtime web search is not source truth;
- no free comprehensive historical NBBO assumption;
- publicly visible paid-feed documentation/sample data is not a free source.

---

# 9. Small/Micro-Cap Evidence Boundaries

Capabilities:

- E0 execution-only;
- E1 candle-enriched;
- E2 event-enriched;
- E3 quote-enriched;
- E4 share-structure-enriched;
- E5 combined with limitations.

A claim cannot exceed its capability.

Key rules:

- ticker is not a durable instrument ID;
- raw fills remain preserved;
- chart analytics fail closed on basis mismatch;
- missing candles do not prove a halt;
- candles do not prove spread, depth, exact slippage, or full fill;
- target touch is not executable proof;
- current float is not historical float;
- later filings cannot enter entry-time reasoning;
- FINRA short-sale volume is not short interest;
- support/resistance remains behind the Zone Usability and Congestion Layer.

---

# 10. Current Next Action

After the documentation PR is accepted:

1. create `agent/trader-intelligence-v3-ga0-a1-containment` from current `main`;
2. implement GA0-A1 only;
3. run deployment/profile, containment where applicable, architecture, private-data,
   typecheck, focused tests, legacy tests, and build verification;
4. open a focused draft PR;
5. review GA0-A1 before GA0-A2;
6. do not consume support/resistance;
7. do not redesign `/coach`;
8. do not call a model;
9. do not deploy.

---

# 11. Update Protocol

After meaningful work:

1. update the v3 project log;
2. update the active implementation plan;
3. update the controlling specification only for material architecture changes;
4. update this index when authority, gate, or status changes;
5. preserve QA reviews as audit evidence;
6. record exact tests, profile, hosting mode, data capability, private-data handling,
   limitations, rollout state, and next action.
