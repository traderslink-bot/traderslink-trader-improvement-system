# Trader Intelligence v3 Project Log

## Purpose

This is the active continuity and accepted-decision log for Trader Intelligence v3.

It records:

- deployment and hosting mode;
- current implementation gate;
- architecture decisions;
- query/visual evidence decisions;
- branch/PR state;
- verification;
- private-data handling;
- exact resume point.

The legacy `src/docs/codex-project-log.md` remains useful for v1/v2 history. It does not control v3 architecture.

---

# Resume Protocol

Read in this order:

1. `plan.md`
2. this file
3. `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`
4. `src/docs/trader-intelligence-v3-ga0-a-control-and-exact-truth-implementation-plan-2026-07-17.md`
5. detailed reviews/master plan only for rationale
6. legacy documents only for preserved code, fixtures, routes, education, or migration evidence

Precedence:

1. latest explicit accepted decision in this log;
2. controlling architecture specification;
3. active implementation plan;
4. detailed reviews/master plan as rationale;
5. legacy documents.

This log may record progress and accepted strengthening decisions. It may not silently weaken the controlling specification.

---

# Current Resume Point

## 2026-07-17 — Fifth-Pass QA Complete; Query and Visual Evidence Architecture Accepted

### Status

- Five independent QA/engineering passes are complete.
- The v3 architecture remains approved for staged private-owner-alpha implementation.
- The fifth pass found no reason to restart or replace the architecture.
- The user requirement for date/time natural-language questions with supporting charts is accepted as a core future capability.
- Charts are now formally treated as deterministic evidence artifacts rather than decorative AI output.
- The controlling architecture specification was rewritten to include all accepted fourth- and fifth-pass decisions.
- The active GA0-A plan was updated so canonical query/filter contracts enter GA0-A3, validated chart-ready series enter GA0-B, deterministic accessible chart rendering enters GA1, and AI visual selection enters GA2.
- `plan.md`, `handoff.md`, and the plan index now reflect that sequence.
- Current runtime gate remains **GA0-A1 — containment and architecture boundaries**.
- No runtime code changed.
- No production deployment was requested or authorized.

### Fifth-pass audit

`src/docs/trader-intelligence-v3-fifth-pass-qa-query-filter-visual-evidence-and-accessibility-review-2026-07-17.md`

### Active implementation plan

`src/docs/trader-intelligence-v3-ga0-a-control-and-exact-truth-implementation-plan-2026-07-17.md`

### Key fifth-pass repository findings

1. **Current analytical filters are prototype-limited**
   - current filters cover symbol, direction, session, entry hour, outcome, and lifecycle;
   - date ranges, relative periods, date/time basis, timezone, comparisons, currency, and capability are not first-class;
   - current client filtering cannot become authoritative v3 analytics.

2. **Current chart contracts lack evidence semantics**
   - current chart types contain labels and numeric values but not units, currency, timezone, manifests, filters, evidence, exclusions, coverage, capability, or accessibility contracts.

3. **Current chart builders are prototype numeric presentation code**
   - current builders use JavaScript numbers and display rounding;
   - they are not v3 financial authority.

4. **Current chart primitives require visual-integrity redesign**
   - hard-coded or presentation-only scaling cannot become analytical evidence;
   - sign must not rely on color alone;
   - accessible table alternatives and drill-down are not yet contractual.

5. **Natural-language date/time questions need deterministic resolution**
   - date basis, time basis, timezone, inclusivity, calendar/trading sessions, relative-date anchor, absolute resolution, and cutoff must be canonical and visible.

6. **Visuals and prose must share one truth**
   - same analysis snapshot;
   - same filter digest;
   - same claims/series;
   - same units/currency/timezone;
   - same denominators, exclusions, and limitations.

7. **AI cannot create chart values or code**
   - it may select approved tools and approved visual-template IDs only after deterministic validation.

8. **Accessibility is part of correctness**
   - every chart requires semantic title, accessible summary, exact table alternative, keyboard drill-down, focus, contrast, reduced motion, and non-color-only meaning.

9. **Date/period comparison fairness is explicit**
   - partial versus complete periods;
   - calendar versus trading sessions;
   - holidays and different trading-day counts;
   - strategy eras;
   - rule effective dates;
   - account-size changes.

10. **Chart artifacts are content-addressed and replayable**
    - old visuals retain original data and metadata;
    - stale data marks visuals stale rather than silently redrawing under old evidence links.

### Accepted query/filter architecture

A canonical filter records:

- server-derived account/workspace scope;
- date basis;
- time basis;
- timezone;
- start/end and inclusivity;
- calendar versus trading sessions;
- relative-date anchor and resolved absolute range;
- instruments, directions, sessions, lifecycle, setups, outcomes, currencies, and capabilities;
- open-position policy;
- analysis cutoff;
- content digest.

Server/domain code owns filtering and aggregation.

### Accepted visual evidence architecture

Validated series carry:

- derivation and analysis snapshot;
- filter digest;
- exact values and units;
- currency/timezone;
- candidate/eligible/included/excluded counts;
- exclusion reasons;
- coverage/capability/statistical mode;
- evidence set;
- limitations;
- content digest.

Visual specs reference approved template IDs and server-owned series/claims.

They do not contain arbitrary code or model-supplied values.

### Text/chart consistency

Before display/persistence, validation confirms:

- prose and visuals share snapshot/filter/date/time/unit/currency/denominator;
- every chart value resolves to a series point;
- every prose number resolves to a claim;
- exclusions/limitations remain visible;
- unsupported visuals are suppressed while deterministic text/table output remains available where safe.

### Updated delivery sequence

#### GA0-A1

- containment and architecture boundaries only.

#### GA0-A2

- canonical execution and exact financial truth.

#### GA0-A3

- temporal/manifests/eligibility/evidence;
- canonical date/time/filter contract and digest;
- no query UI or chart renderer.

#### GA0-B

- deterministic weekday/daily-stop tools;
- exact tables;
- validated claims/evidence;
- validated chart-ready series.

#### GA0-C

- private filter/table/series calibration and reconciliation.

#### GA1

- deterministic query/filter UI;
- accessible visual-template registry/renderer;
- table alternatives and evidence drill-down;
- text/chart consistency validation;
- visual replay/performance.

#### GA2

- natural-language intent proposal;
- approved tool and visual-template selection;
- grounded explanation and feedback.

### Current next action

After documentation PR acceptance:

1. create `agent/trader-intelligence-v3-ga0-a1-containment` from current `main`;
2. implement GA0-A1 only;
3. run containment, architecture, private-data, typecheck, tests, Layer 2/3, and build;
4. open a focused draft PR;
5. review before GA0-A2;
6. do not implement analytics, chart rendering, AI, support/resistance, or deployment.

---

## 2026-07-17 — Fourth-Pass QA Summary

Accepted decisions:

- owner route containment;
- canonical serialization and cryptographic identity;
- explicit duplicate/collision states;
- lifecycle truth separated from review disposition;
- bitemporal corrections;
- immutable analysis snapshots;
- stable evidence references;
- runtime validation;
- parser hardening;
- WAL-safe backup/restore;
- GA0-A1/A2/A3 split.

Audit:

`src/docs/trader-intelligence-v3-fourth-pass-qa-operational-integrity-canonical-identity-and-delivery-review-2026-07-17.md`

---

## 2026-07-17 — Third-Pass QA Summary

Accepted decisions:

- one controlling architecture specification;
- content-addressed manifests;
- dataset coverage;
- per-capability eligibility;
- external-source registry;
- no authoritative runtime web search;
- reproducibility and usefulness evaluation;
- statistical modes and exploration ledger.

Audit:

`src/docs/trader-intelligence-v3-third-pass-qa-source-governance-reproducibility-and-evaluation-review-2026-07-17.md`

---

## 2026-07-17 — Second-Pass QA Summary

Accepted decisions:

- private-owner-alpha sequencing;
- small/micro-cap specialization;
- evidence capability tiers;
- instrument/basis/session/halt/quote/float/catalyst rules;
- educational boundary;
- owner-only AI after deterministic grounding.

Audit:

`src/docs/trader-intelligence-v3-second-pass-qa-private-alpha-small-micro-cap-review-2026-07-17.md`

---

## 2026-07-17 — First QA Summary

Accepted decisions:

- exact financial types and P/L policy;
- future identity/tenancy/persistence/ingestion/durable-job requirements;
- statistical and AI grounding gates;
- migration and CI requirements;
- support/resistance Zone Usability and Congestion Layer.

Audit:

`src/docs/trader-intelligence-v3-qa-architecture-review-2026-07-17.md`

---

# Active Decision Register

## Deployment/hosting

- current profile `private_owner_alpha`;
- hosting `local_only` or `private_hosted`;
- private-hosted requires owner auth on all Intelligence pages/APIs;
- profile checks fail closed.

## Canonical financial truth

- no JavaScript-number authority;
- canonical exact decimals;
- cryptographic content identity;
- explicit duplicate/correction states;
- exact/versioned P/L and reconstruction policy;
- user review cannot change inventory.

## Coverage/manifests/snapshot

- explicit account/period/gaps/overlap/exclusions/open/prior-inventory/currency coverage;
- content-addressed dataset/derivation/answer/visual artifacts;
- one immutable analysis snapshot per answer;
- stable evidence references.

## Query/filter

- explicit date/time basis and timezone;
- visible absolute resolution of relative periods;
- calendar versus trading-session distinction;
- content-addressed server-authoritative filter;
- analysis cutoff.

## Visual evidence

- server-owned validated series;
- approved visual templates only;
- same truth as prose;
- units/currency/timezone/counts/exclusions/limitations;
- evidence drill-down;
- accessible summary/table;
- no model values/code;
- charts are supporting evidence, not causal proof.

## AI

- after deterministic tables/series and validators;
- approved tools/templates;
- bounded planning;
- no raw CSV;
- no runtime web truth;
- cost/access/evaluation controls.

## Support/resistance

- keep `levels-system-v2`;
- no second detector;
- zone usability/congestion/suppression;
- no v3 AI/visual use until usefulness gates.

---

# Gate Status

| Gate | Status | Notes |
|---|---|---|
| GA0-A1 Containment | Not started | Current next runtime PR |
| GA0-A2 Exact truth | Not started | After A1 review |
| GA0-A3 Temporal/manifests/query foundation | Not started | After A2 review |
| GA0-B Deterministic tools/series | Not started | Weekday and daily-stop |
| GA0-C Private calibration | Not started | Real-data verification outside Git |
| GA1 Query/visual evidence | Not started | Accessible deterministic visuals |
| GA2 Owner-only AI | Not started | Tool/template selection after grounding |
| GA3 Market enrichment | Not started | One qualified capability at a time |
| GA4 Usefulness | Not started | Compare table/visual/legacy/AI/abstention |
| Public track | Not started | Required before invited/public users |

---

# Update Rules

After meaningful work record:

- branch/PR;
- profile/hosting mode;
- files/contracts changed;
- accepted decisions;
- financial/filter/visual schema versions;
- capabilities;
- tests and exact results;
- data migration state;
- feature flags;
- rollout/deployment state;
- private-data handling;
- limitations;
- exact next resume point.

Do not mark a gate complete because one test passes.
