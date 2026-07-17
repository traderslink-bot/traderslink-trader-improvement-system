# Trader Intelligence v3 Plan Index

**Last updated:** 2026-07-17 America/Toronto  
**Active architecture:** Trader Intelligence v3  
**Current profile:** `private_owner_alpha`  
**Required hosting declaration:** `local_only` or `private_hosted`  
**Primary domain:** small-cap and micro-cap active trading  
**Product boundary:** retrospective educational trade review  
**Current gate:** GA0-A — control and exact truth  
**Active execution plan:** `src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`

This index identifies the documents that control implementation. It is intentionally
shorter than the detailed reviews so future engineering runs do not have to resolve
several overlapping amendment chains.

---

## 1. Required Resume Order

1. `plan.md`
2. `src/docs/trader-intelligence-v3-project-log.md`
3. `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`
4. `src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`
5. Detailed v3 reviews and master plan only when architectural rationale is needed
6. Legacy documents only for preserved code, fixtures, route history, education, or migration evidence

Precedence:

1. latest explicit project-log decision;
2. controlling architecture specification;
3. active execution plan;
4. detailed v3 reviews and master plan as rationale;
5. legacy documents.

A material architecture change must update the controlling specification. A new QA
review does not become a separate long-term authority by merely declaring itself
controlling.

---

## 2. Controlling Documents

### Active controlling architecture

- `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`

Purpose:

- consolidates all accepted v3 decisions;
- defines product scope, deployment and hosting profiles, source-of-truth hierarchy,
  exact financial requirements, manifests, eligibility, market-data rules, source
  governance, AI grounding, evaluation, implementation gates, and prohibitions;
- prevents future runs from manually reconciling several long QA documents.

Status:

- active and controlling;
- must be updated for material architecture changes.

### Active execution plan

- `src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`

Purpose:

- provides detailed Gate 0 workstreams, ADRs, contracts, fixtures, tools, tests, and
  acceptance criteria;
- remains the detailed execution source, subject to the consolidated GA0-A/B/C
  sequencing in the controlling specification.

Status:

- active;
- first implementation PR must perform GA0-A only.

### Active continuity log

- `src/docs/trader-intelligence-v3-project-log.md`

Purpose:

- records the current resume point, accepted decisions, gate progress, exact
  verification, branch/PR state, limitations, and next action.

---

## 3. Architectural Audit Documents

These documents remain audit evidence and rationale. Their accepted decisions have
been promoted into the controlling specification.

### Third-pass QA

- `src/docs/trader-intelligence-v3-third-pass-qa-source-governance-reproducibility-and-evaluation-review-2026-07-17.md`

Key contributions:

- one consolidated architecture authority;
- content-addressed dataset, derivation, and answer manifests;
- source-of-truth precedence and conflict states;
- dataset coverage and selection-bias handling;
- per-capability analysis eligibility;
- external-source registry and adoption order;
- no authoritative runtime web search;
- multi-provider market-data policy;
- deterministic, claim, explanation, and usefulness evaluation;
- direct-question versus discovery modes;
- confounder and strategy-era handling;
- intended setup, inferred setup, and rule-effective-time separation;
- GA0 split into GA0-A, GA0-B, and GA0-C.

### Second-pass QA

- `src/docs/trader-intelligence-v3-second-pass-qa-private-alpha-small-micro-cap-review-2026-07-17.md`

Key contributions:

- `private_owner_alpha` sequencing;
- separation of owner-only validation from future public infrastructure;
- concrete small/micro-cap requirements;
- evidence capability tiers;
- educational product boundary;
- private real-data handling;
- owner-only AI after deterministic grounding.

### First QA review

- `src/docs/trader-intelligence-v3-qa-architecture-review-2026-07-17.md`

Key contributions:

- exact financial types and accounting policy;
- future identity, tenancy, persistence, ingestion, and durable-job requirements;
- statistical and AI-grounding gates;
- production migration and CI requirements;
- Zone Usability and Congestion Layer instead of a second level detector.

### Original master plan

- `src/docs/trader-intelligence-ai-journal-v3-master-plan-2026-07-17.md`

Purpose:

- records the full product vision, target architecture, analytics tools, AI coach,
  simulations, reports, migration direction, MVP, and long-term roadmap.

Status:

- architectural vision and rationale;
- no longer the sole controlling document.

---

## 4. Current Product Facts

These facts are controlling:

- The current tester is the product owner.
- The current profile is `private_owner_alpha`.
- The system is not currently public or multi-user.
- Hosting must declare `local_only` or `private_hosted`.
- A private-hosted instance still requires owner authentication.
- The initial specialization is U.S. listed small-cap and micro-cap active trading.
- The product analyzes completed executions and historical context.
- The purpose is education, review, and self-improvement.
- It is not a live signal, automated broker, tax product, portfolio allocator, or
  guaranteed-performance service.
- Public-platform architecture remains required before invited/public users, but it
  does not block owner-only usefulness validation.
- Private-alpha status does not relax exact financial math, data coverage,
  eligibility, provenance, no-lookahead, price-basis safety, backup, or simulation honesty.

---

## 5. Current Architecture

```text
private broker source data
  -> deterministic import and validation
  -> exact accepted executions
  -> versioned reconstruction and coverage
  -> content-addressed dataset manifest
  -> per-capability eligibility
  -> deterministic analytics and simulations
  -> claim and evidence ledger
  -> evaluated owner-only AI explanation
  -> qualified small/micro-cap source enrichment
  -> usefulness calibration
  -> future public hardening
```

AI explains validated results. It does not own parsing, financial math,
reconstruction, unrestricted database access, external source truth, live signals,
or order execution.

---

## 6. Current Gate Structure

### GA0-A — Control and Exact Truth

Current target:

- current-system inventory;
- deployment and hosting contracts;
- exact-decimal policy and wrappers;
- analytical P/L and reconstruction policy;
- timestamp/session policy;
- instrument identity and price-basis policy;
- source-of-truth hierarchy;
- dataset-manifest contract;
- analysis-eligibility contract;
- independent exact reference math;
- first synthetic financial fixtures;
- architecture and private-data guards.

No tool, AI, route, coach, support/resistance, or deployment work belongs in GA0-A.

### GA0-B — Deterministic Proof

After GA0-A review:

- read-only current-data adapter;
- coverage manifest;
- weekday analytics;
- stop-after-consecutive-losses simulation;
- evidence resolver;
- inclusion/exclusion accounting;
- internal diagnostics;
- property and differential tests;
- v3 CI.

### GA0-C — Private Calibration

After GA0-B review:

- private fixture manifest without raw data;
- import coverage and reconciliation report;
- backup/restore test;
- owner review of evidence and exclusions;
- safe regression cases;
- Gate 0 exit report.

### GA1 — Execution-Only Analytics

- time of day;
- session sequence;
- after-loss/after-win behavior;
- repeated ticker attempts;
- historical size-performance analysis;
- hold time;
- adds/reductions;
- fee drag;
- open-position separation.

### GA2 — Owner-Only AI

Allowed only after:

- approved tool registry;
- claim ledger;
- numeric/unit/currency validator;
- evidence and capability validators;
- answer schema and replay;
- bounded tool planning;
- cost caps and disable switch;
- private-owner access gate;
- prompt-injection tests;
- golden evaluation suite;
- owner feedback capture.

### GA3 — Qualified Market Enrichment

Add one qualified capability at a time:

- candle-derived features;
- SEC filing/event context;
- qualified halt events;
- instrument mapping;
- dated share structure;
- carefully limited FINRA context;
- historical quotes when a suitable provider exists;
- Zone Usability and Congestion Layer.

### GA4 — Usefulness Calibration

Compare deterministic-only, legacy v2, v3 AI, and abstention/no-conclusion output
for correctness, trust, evidence usefulness, novelty, repetition, owner preference,
and cost/latency.

### Future public track

Before invited/public users:

- shared identity and tenancy;
- PostgreSQL/RLS;
- object storage;
- durable jobs/outbox;
- deletion/retention;
- entitlements/rate limits;
- provider licensing;
- monitoring/recovery;
- security and launch review.

---

## 7. Source and Evidence Capability

Capabilities:

- E0 execution-only;
- E1 candle-enriched;
- E2 event-enriched;
- E3 quote-enriched;
- E4 share-structure-enriched;
- E5 combined with explicit limitations.

Eligibility is determined per trade and per capability.

A tool reports candidate, eligible, included, and excluded counts with reason codes.

A claim cannot exceed the available capability.

Examples:

- candles do not prove spread, depth, quote size, exact slippage, or full executability;
- a bar touching a target is a price-path scenario, not proof of full fill;
- missing bars do not prove an official halt;
- current float does not automatically describe an old trade;
- later filings cannot influence entry-time reasoning;
- chart-derived facts fail closed on price-basis mismatch;
- level conclusions fail closed in congested structure.

---

## 8. External Source Opportunities

All sources require a registry entry, adapter, content hash, timestamps, quality
state, terms/profile decision, fixtures, no-lookahead tests, and fail-closed behavior.

Recommended official/free-to-access opportunities:

- SEC EDGAR APIs, archives, Company Facts, and RSS;
- Nasdaq Trader symbol directories;
- Nasdaq Trader trade-halt RSS;
- NYSE trading-halt data;
- the LULD Plan as a rules reference;
- FINRA short-sale-volume and short-interest data with strict limitations;
- OpenFIGI mapping candidates;
- individual Nasdaq Data Link datasets only after dataset-level review.

Useful open-source tools to evaluate:

- an exact-decimal library such as `decimal.js`;
- `fast-check` for property/model-based testing;
- `exchange_calendars` as an independent calendar test oracle.

Do not use:

- undocumented website endpoints as production contracts;
- search snippets as source records;
- runtime AI web search as trusted historical facts;
- current-only symbol or float data as complete historical data;
- FINRA short-sale volume as short interest;
- one-minute bars as official LULD bands;
- free access as proof of future commercial redistribution rights.

---

## 9. Statistical, Intent, and Rule Boundaries

Every analysis declares one mode:

- direct hypothesis;
- fixed comparison;
- exploratory scan;
- optimization;
- similarity search.

Broad findings account for:

- imported-period coverage;
- independent days and tickers;
- clustering;
- outliers;
- largest-day/ticker sensitivity;
- recent versus older periods;
- strategy eras;
- multiple comparisons;
- holdout/prospective validation for optimized rules.

Setup sources remain distinct:

- user intended setup;
- post-trade tag;
- deterministic candidate;
- AI likely setup;
- chart-validated setup;
- user-confirmed setup.

Rules have effective dates. A later rule cannot create a hindsight violation.

R-multiple requires independently recorded planned risk.

---

## 10. Support and Resistance

`levels-system-v2` remains the factual producer.

Trader Intelligence adds a Zone Usability and Congestion Layer, not another
detector.

The layer preserves source-zone IDs, measures congestion and clear space, selects
at most one primary zone per side, and suppresses output when structure is crowded,
unstable, stale, synthetic-only, or basis-unsafe.

Support/resistance cannot reach v3 AI until stability, suppression, basis-safety,
and blinded-usefulness gates pass.

---

## 11. Private Data and Backup

- Real broker files remain outside Git, issues, PRs, and normal logs.
- Account identifiers remain out of docs and screenshots.
- Default AI prompts do not include raw CSV.
- Backups are encrypted and versioned.
- Restore is tested.
- Private data can be deleted.
- Repository guards scan for private files and likely identifiers.

---

## 12. First Implementation Branch

After this architecture PR is accepted, create from current `main`:

`agent/trader-intelligence-v3-gate-0-foundation`

Implement GA0-A only.

Required GA0-A verification:

- dependency installation from lockfile;
- TypeScript typecheck;
- focused lint;
- exact reference tests;
- deterministic manifest/hash tests;
- architecture-boundary tests;
- private-data repository guards;
- production build;
- relevant legacy regressions.

No runtime code should be added to the architecture documentation PR.

---

## 13. Legacy Planning Archive

Legacy documents remain useful for:

- broker knowledge;
- parser behavior;
- reconstruction and raw-timeline logic;
- replay-safe candle/basis safeguards;
- product-language lessons;
- current route behavior;
- fixtures and tests;
- migration parity;
- Academy education.

They do not control v3 architecture or resume old active batches.

---

## 14. Update Protocol

After meaningful v3 work:

1. update the v3 project log;
2. update the active execution plan;
3. update the controlling specification for material decisions;
4. update this index only when authority, gate, or status changes;
5. preserve detailed QA reviews as audit evidence;
6. record branch/PR, profile, hosting mode, policies, manifests, data capability,
   tests, migrations, feature flags, rollout, private-data handling, limitations,
   and next resume point.

No gate is complete because one test passed.
