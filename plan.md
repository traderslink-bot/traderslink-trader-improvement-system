# Trader Intelligence Plan Entry Point

**Last updated:** 2026-07-17 America/Toronto  
**Active architecture:** Trader Intelligence v3  
**Operating profile:** `private_owner_alpha`  
**Required hosting mode:** `local_only` or `private_hosted`  
**Primary domain:** U.S. listed small-cap and micro-cap active trading  
**Product boundary:** retrospective educational trade review and self-improvement  
**Current gate:** GA0-A1 — containment and architecture boundaries  
**Active implementation plan:** `src/docs/trader-intelligence-v3-ga0-a-control-and-exact-truth-implementation-plan-2026-07-17.md`

Start here when resuming Trader Intelligence product, import, analytics, query, visualization, coaching, market context, external sources, persistence, AI, or QA work.

---

# 1. Controlling Read Order

1. `src/docs/trader-intelligence-v3-project-log.md`
2. `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`
3. `src/docs/trader-intelligence-v3-ga0-a-control-and-exact-truth-implementation-plan-2026-07-17.md`
4. detailed v3 QA reviews and master plan only when rationale is needed
5. legacy v1/v2 documents only for preserved code, fixtures, routes, education, or migration evidence

Precedence:

1. latest explicit accepted project-log decision;
2. controlling architecture specification;
3. active implementation plan;
4. detailed reviews/master plan as rationale;
5. legacy documents.

Material architecture changes update the controlling specification. QA reviews remain audit evidence rather than parallel long-term authorities.

Detailed audit documents:

- `src/docs/trader-intelligence-v3-fifth-pass-qa-query-filter-visual-evidence-and-accessibility-review-2026-07-17.md`
- `src/docs/trader-intelligence-v3-fourth-pass-qa-operational-integrity-canonical-identity-and-delivery-review-2026-07-17.md`
- `src/docs/trader-intelligence-v3-third-pass-qa-source-governance-reproducibility-and-evaluation-review-2026-07-17.md`
- `src/docs/trader-intelligence-v3-second-pass-qa-private-alpha-small-micro-cap-review-2026-07-17.md`
- `src/docs/trader-intelligence-v3-qa-architecture-review-2026-07-17.md`
- `src/docs/trader-intelligence-ai-journal-v3-master-plan-2026-07-17.md`

---

# 2. Current Direction

```text
contained owner-only environment
  -> deterministic import and validation
  -> canonical exact accepted executions
  -> immutable corrections and versioned reconstruction
  -> explicit coverage and content-addressed dataset manifest
  -> per-capability eligibility and immutable analysis snapshot
  -> deterministic analytics, tables, and chart-ready series
  -> stable claims and evidence
  -> accessible visual evidence
  -> evaluated owner-only AI explanation and visual selection
  -> qualified small/micro-cap enrichment
  -> usefulness calibration
  -> future public hardening
```

Code owns:

- access containment;
- CSV parsing and validation;
- canonical identity and exact financial math;
- duplicate/correction state;
- reconstruction and lifecycle truth;
- temporal/session/instrument/basis policy;
- coverage, manifests, eligibility, and analysis snapshots;
- query/filter normalization;
- analytics and simulations;
- validated table and chart-ready series;
- provenance and evidence.

AI may select approved tools and visual templates and explain validated claims.

AI must not become the parser, calculator, database, unrestricted SQL author, runtime web-search authority, chart-data generator, chart-code generator, live signal engine, current-target generator, or automated broker.

---

# 3. Current Operating Facts

- The current user/tester is the owner.
- The system is not public or multi-user.
- Current profile: `private_owner_alpha`.
- Hosting must declare `local_only` or `private_hosted`.
- Private-hosted mode requires owner authentication on every Intelligence page/API.
- The product primarily studies completed small/micro-cap trades.
- It is educational and retrospective.
- It does not provide current buy/sell/hold instructions, live targets, automated orders, guaranteed improvement, tax advice, or portfolio allocation.
- Public infrastructure remains required before invited/public users but does not block owner-only usefulness validation.
- Private-alpha status does not relax access, exact math, coverage, eligibility, accessibility, provenance, no-lookahead, basis safety, backup, or simulation honesty.

---

# 4. Current Gate — GA0-A1

Build first:

- preserve/adapt/legacy/retire inventory;
- deployment and hosting-mode contracts;
- owner-access containment contract;
- minimal v3 module boundary;
- architecture dependency guard;
- private-data repository guard;
- legacy hazard register.

GA0-A1 must not include:

- AI/model calls;
- natural-language query parsing;
- analytics tools;
- chart-ready financial series;
- chart rendering;
- public feature routes;
- production multi-user writes;
- `/coach` redesign;
- market enrichment;
- support/resistance consumption;
- second level detector;
- setup classification;
- unrestricted SQL;
- vector storage;
- production deployment.

Recommended implementation branch:

`agent/trader-intelligence-v3-ga0-a1-containment`

---

# 5. GA0-A Sequence

## GA0-A1 — Containment and Architecture Boundaries

- profile/hosting validation;
- owner page/API containment;
- architecture inventory;
- v3 boundary;
- dependency/private-data guards.

## GA0-A2 — Canonical Execution and Exact Financial Truth

- exact decimals;
- canonical serialization and cryptographic hashing;
- execution identity/order;
- duplicate/correction/collision states;
- analytical P/L/reconstruction policy;
- independent reference math;
- exact synthetic fixtures.

## GA0-A3 — Temporal, Manifest, Eligibility, and Query Foundation

- bitemporal corrections;
- factual lifecycle versus review disposition;
- open-position/cutoff policy;
- dataset/coverage manifests;
- capability eligibility;
- immutable analysis snapshot;
- stable evidence references;
- canonical date/time/filter contract and digest;
- runtime validation;
- stale/invalidation states;
- WAL-safe backup/restore;
- parser-hardening contracts.

GA0-A does not build query UI, analytics, charts, or AI.

---

# 6. Deterministic Analytics and Visual Evidence Sequence

## GA0-B — Deterministic Proof

After all GA0-A slices:

- read-only current-data adapter;
- weekday analytics;
- stop-after-consecutive-losses simulation;
- exact tables;
- validated claims;
- included/excluded counts and evidence;
- validated chart-ready series;
- internal diagnostics;
- property/differential tests;
- v3 CI.

No AI visual selection is required.

## GA0-C — Private Calibration

- private fixture manifest without raw data;
- reconciliation/coverage report;
- backup/restore drill;
- date/filter/table/series verification;
- owner evidence/exclusion review;
- defects converted into safe regression cases;
- Gate 0 exit decision.

## GA1 — Query and Visual Evidence

- deterministic query/filter UI;
- visible absolute resolution of relative dates;
- accessible visual-template registry;
- chart renderer driven only by validated series;
- exact table alternatives;
- keyboard/evidence drill-down;
- text/chart consistency validation;
- comparison-period fairness;
- visual caching/replay/performance tests.

## GA2 — Owner-Only AI

AI may:

- propose supported natural-language query intent;
- select approved tools;
- select one to three approved visual templates;
- explain validated claims;
- suggest follow-up views.

AI may not:

- generate chart values;
- generate chart code;
- change accepted filters;
- hide exclusions/limitations;
- mix analysis snapshots;
- exceed visual budgets.

## GA3 — Qualified Market Enrichment

Add SEC, halts/suspensions, instrument mapping, candles, dated float, qualified FINRA context, quotes, and zone usability one source/capability at a time.

## GA4 — Usefulness Calibration

Compare deterministic table, deterministic visual, legacy v2, v3 AI plus visuals, and abstention for correctness, trust, evidence usefulness, accessibility, novelty, repetition, owner preference, cost, and latency.

---

# 7. Query and Date/Time Ruling

Every analytical question resolves to a canonical filter before tools run.

The filter declares:

- date basis: entry, exit, session, execution, open, close, import, or report;
- time basis: entry, exit, any execution, open, flat, time from open, or hold duration;
- timezone;
- start/end and inclusivity;
- calendar versus trading sessions;
- relative-date anchor and resolved absolute range;
- account/instrument/direction/session/lifecycle/setup/outcome/currency scope;
- evidence capability;
- open-position policy;
- analysis cutoff;
- content digest.

Relative phrases such as `last week` display their resolved absolute dates.

Calendar days and trading sessions are not silently interchanged.

Server/domain code owns authoritative filtering and aggregation.

---

# 8. Visual Evidence Ruling

A chart is a view of a validated deterministic series.

Every visual identifies:

- analysis snapshot;
- filter digest;
- source series and claims;
- unit/currency/timezone;
- date/time basis;
- candidate/eligible/included/excluded counts;
- coverage/capability;
- limitations;
- evidence drill-down;
- accessible summary and table alternative;
- template/configuration version;
- content digest.

Rules:

- no model-supplied values;
- no arbitrary chart code;
- no browser-authoritative financial recalculation;
- no chart/prose filter mismatch;
- no hidden exclusions;
- no color-only meaning;
- no hover-only information;
- negative values use geometry/position;
- bars normally use zero baseline;
- dual axes/log scales disallowed initially;
- mixed currencies blocked without FX policy;
- zero/no-data/ineligible/unavailable/stale/failure remain distinct;
- one primary and at most two supporting visuals by default;
- every visual has an exact table alternative;
- chart drill-down uses manifest-scoped evidence.

Charts are supporting historical evidence, not proof of causation or future performance.

---

# 9. Small/Micro-Cap and Evidence Rules

Evidence capabilities:

- E0 execution-only;
- E1 candle-enriched;
- E2 event-enriched;
- E3 quote-enriched;
- E4 share-structure-enriched;
- E5 combined with explicit limitations.

A claim or visual cannot exceed its capability.

Examples:

- candles do not prove spread, depth, quote size, exact slippage, or full executability;
- bar target touch is a price-path scenario, not proof of full fill;
- missing bars do not prove a halt;
- current float does not automatically describe an old trade;
- later filings cannot influence entry-time reasoning;
- chart-derived facts fail closed on price-basis mismatch;
- support/resistance fails closed when structure is congested.

---

# 10. External Sources

All outside sources require a registry entry, adapter, content digest, timestamps, quality state, terms/profile decision, historical-coverage tests, no-lookahead tests, and fail-closed behavior.

Qualified candidates include:

- SEC EDGAR;
- Nasdaq Trader symbol/halt/Reg SHO resources;
- NYSE halt resources;
- LULD Plan rules;
- qualified FINRA datasets;
- OpenFIGI mapping candidates;
- specific reviewed Nasdaq Data Link datasets.

Free access does not imply public-commercial redistribution rights.

Runtime AI web search is not trusted historical source data.

---

# 11. Private Data, Backup, and Evaluation

- Real broker files never enter Git, PRs, issues, normal logs, or default prompts.
- Account identifiers stay out of screenshots/docs.
- Backups are encrypted/versioned and restore-tested.
- SQLite/WAL backup must be consistent.
- Private data can be deleted.
- Repository guards scan for likely private data.

Evaluation separates:

1. deterministic arithmetic;
2. claim correctness;
3. visual correctness/accessibility;
4. explanation quality;
5. owner usefulness.

Use calibration, holdout, regression, and private acceptance sets.

Maintain an exploration ledger so repeated slicing cannot be hidden.

---

# 12. Current Next Action

After this documentation PR is accepted:

1. create `agent/trader-intelligence-v3-ga0-a1-containment` from current `main`;
2. implement GA0-A1 only;
3. run containment, architecture, private-data, typecheck, test, and build checks;
4. open a focused draft PR;
5. review GA0-A1 before GA0-A2;
6. keep runtime work internal and model-free;
7. do not implement analytics, chart rendering, AI, support/resistance, or deployment.

---

# 13. Update Protocol

After meaningful v3 work:

1. update `src/docs/trader-intelligence-v3-project-log.md`;
2. update the active implementation plan;
3. update the controlling specification for material decisions;
4. update the plan index when authority/gate/status changes;
5. preserve QA reviews as audit evidence;
6. record exact verification, data migration, feature flags, profile, rollout, limitations, and next resume point.

---

# 14. Final Standard

> A result is trustworthy only when the system can identify the exact source data, canonical identity, policy, temporal state, filter, eligibility decision, calculation, evidence, visual series, and explanation that produced it.

> Build table truth first, chart-ready series second, accessible deterministic visuals third, and AI-directed visual selection last.
