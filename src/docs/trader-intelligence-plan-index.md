# Trader Intelligence v3 Plan Index

**Last updated:** 2026-07-17 America/Toronto  
**Active architecture:** Trader Intelligence v3  
**Operating profile:** `private_owner_alpha`  
**Hosting declaration:** `local_only` or `private_hosted`  
**Primary domain:** U.S. listed small-cap and micro-cap active trading  
**Product boundary:** retrospective educational trade review  
**Current gate:** GA0-A1 — containment and architecture boundaries  
**Active implementation plan:** `src/docs/trader-intelligence-v3-ga0-a-control-and-exact-truth-implementation-plan-2026-07-17.md`

---

# 1. Resume Order

1. `plan.md`
2. `src/docs/trader-intelligence-v3-project-log.md`
3. `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`
4. `src/docs/trader-intelligence-v3-ga0-a-control-and-exact-truth-implementation-plan-2026-07-17.md`
5. detailed QA reviews/master plan only for rationale
6. legacy documents only for preserved code, fixtures, routes, education, or migration evidence

Precedence:

1. latest explicit accepted project-log decision;
2. controlling architecture specification;
3. active implementation plan;
4. detailed reviews/master plan as rationale;
5. legacy documents.

Material architecture changes update the controlling specification. A QA review remains audit evidence unless its decisions are promoted into that specification.

---

# 2. Active Documents

## Controlling architecture

`src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`

Status:

- active and controlling;
- includes accepted decisions from all five QA passes;
- now includes canonical query/filter semantics, validated analytical series, accessible visual evidence, and AI visual-selection boundaries.

## Active file-level plan

`src/docs/trader-intelligence-v3-ga0-a-control-and-exact-truth-implementation-plan-2026-07-17.md`

Status:

- active;
- current slice is GA0-A1;
- GA0-A3 includes canonical date/time/filter contracts only;
- analytics and chart-ready series begin in GA0-B;
- chart rendering begins in GA1;
- AI visual selection begins in GA2.

## Continuity log

`src/docs/trader-intelligence-v3-project-log.md`

Use for current status, decisions, branch/PR state, verification, limitations, and exact next action.

---

# 3. Audit and Vision Documents

## Fifth-pass QA

`src/docs/trader-intelligence-v3-fifth-pass-qa-query-filter-visual-evidence-and-accessibility-review-2026-07-17.md`

Contributions:

- canonical query intent;
- date/time basis and relative-range resolution;
- server-authoritative filtering;
- validated chart-ready series;
- visual-template registry;
- text/chart consistency validator;
- evidence drill-down;
- no-data/zero/unavailable states;
- visual-integrity and comparison fairness;
- accessibility and table alternatives;
- visual caching/replay/export/performance;
- GA0-B/GA1/GA2 visualization sequencing.

## Fourth-pass QA

`src/docs/trader-intelligence-v3-fourth-pass-qa-operational-integrity-canonical-identity-and-delivery-review-2026-07-17.md`

Contributions:

- owner route containment;
- canonical serialization and cryptographic hashing;
- duplicate/collision states;
- lifecycle versus review disposition;
- bitemporal corrections;
- immutable analysis snapshot;
- stable evidence references;
- runtime validation;
- parser and WAL backup hardening;
- GA0-A1/A2/A3 delivery split.

## Third-pass QA

`src/docs/trader-intelligence-v3-third-pass-qa-source-governance-reproducibility-and-evaluation-review-2026-07-17.md`

Contributions:

- one architecture authority;
- content-addressed manifests;
- dataset coverage;
- per-capability eligibility;
- external-source registry;
- reproducibility/evaluation;
- statistical modes and exploration control.

## Second-pass QA

`src/docs/trader-intelligence-v3-second-pass-qa-private-alpha-small-micro-cap-review-2026-07-17.md`

Contributions:

- private-owner-alpha sequencing;
- small/micro-cap specialization;
- evidence capability tiers;
- instrument/basis/session/halt/quote/float/catalyst rules;
- educational boundary;
- owner-only AI after deterministic grounding.

## First QA review

`src/docs/trader-intelligence-v3-qa-architecture-review-2026-07-17.md`

Contributions:

- exact financial types and accounting policy;
- future identity/tenancy/persistence/ingestion/durable jobs;
- statistics/AI grounding;
- migration and CI;
- Zone Usability and Congestion Layer.

## Master plan

`src/docs/trader-intelligence-ai-journal-v3-master-plan-2026-07-17.md`

Purpose:

- complete product vision, analytics questions, simulations, AI coach, reports, migration, MVP, and long-term roadmap.

Status:

- vision and rationale;
- not sole controlling authority.

## Old Gate 0 umbrella plan

`src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`

Status:

- umbrella/historical for execution scope;
- weekday and daily-stop work moved to GA0-B;
- not the next file-level plan.

---

# 4. Current Gate Structure

## GA0-A1

- containment;
- owner access;
- inventory;
- v3 boundary;
- architecture/private-data guards.

## GA0-A2

- exact decimals;
- canonical identity;
- execution ordering;
- duplicate/correction states;
- P/L policy;
- reference math.

## GA0-A3

- temporal corrections;
- lifecycle truth;
- open-position/cutoff policy;
- manifests/coverage;
- eligibility;
- immutable analysis snapshot;
- stable evidence;
- canonical date/time/filter contract;
- runtime validation;
- backup/restore and parser contracts.

## GA0-B

- read-only adapter;
- weekday tool;
- daily-stop simulation;
- exact tables;
- validated claims/evidence;
- validated chart-ready series;
- diagnostics and v3 CI.

## GA0-C

- private reconciliation/calibration;
- backup/restore drill;
- filter/table/series verification;
- owner evidence review.

## GA1

- deterministic query/filter UI;
- accessible visual template registry/renderer;
- table alternatives and drill-down;
- text/chart consistency validation;
- visual replay/performance.

## GA2

- natural-language intent proposal;
- approved tool and visual-template selection;
- grounded explanation;
- cost/access/evaluation controls.

## GA3

- qualified market enrichment one source/capability at a time.

## GA4

- usefulness comparison across deterministic tables, deterministic visuals, legacy, v3 AI, and abstention.

---

# 5. Query and Visual Evidence Summary

Every question resolves to a canonical content-addressed filter identifying:

- date/time basis;
- timezone;
- absolute range/inclusivity;
- relative-date anchor/resolution;
- calendar versus trading sessions;
- account/instrument/session/lifecycle/setup/outcome/currency/capability scope;
- analysis cutoff.

Every chart:

- uses server-owned validated series;
- shares the prose analysis snapshot/filter digest;
- identifies units, currency, timezone, coverage, counts, exclusions, and limitations;
- offers manifest-scoped evidence drill-down;
- has an accessible summary and exact table alternative;
- cannot be populated or coded by the model.

---

# 6. Current Next Action

After documentation PR approval:

1. branch from current `main` as `agent/trader-intelligence-v3-ga0-a1-containment`;
2. implement GA0-A1 only;
3. run containment, architecture, private-data, typecheck, tests, Layer 2/3, and build;
4. open focused draft PR;
5. review before GA0-A2;
6. do not build analytics, chart rendering, AI, support/resistance, or deployment.

---

# 7. Update Protocol

Update:

- project log after meaningful work;
- active implementation plan for execution detail;
- controlling specification for material decisions;
- this index when authority/gate/status changes;
- QA reviews only as audit evidence;
- root plan/handoff when cold-start direction changes.
