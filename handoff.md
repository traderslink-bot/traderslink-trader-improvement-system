# Trader Intelligence v3 Handoff

**Last updated:** 2026-07-17 America/Toronto  
**Active architecture:** Trader Intelligence v3  
**Operating profile:** `private_owner_alpha`  
**Hosting mode:** `local_only` or `private_hosted` must be declared  
**Primary domain:** U.S. listed small-cap and micro-cap active trading  
**Product boundary:** retrospective educational trade review  
**Current gate:** GA0-A1 — containment and architecture boundaries  
**Active implementation plan:** `src/docs/trader-intelligence-v3-ga0-a-control-and-exact-truth-implementation-plan-2026-07-17.md`

Use this file for quick orientation. `plan.md` is the root entry point.

---

# 1. Resume Order

1. `plan.md`
2. `src/docs/trader-intelligence-v3-project-log.md`
3. `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`
4. `src/docs/trader-intelligence-v3-ga0-a-control-and-exact-truth-implementation-plan-2026-07-17.md`
5. detailed QA reviews/master plan only for rationale
6. legacy plans only for preserved code, fixtures, routes, education, or migration evidence

Precedence:

1. latest explicit accepted project-log decision;
2. controlling architecture specification;
3. active implementation plan;
4. detailed reviews/master plan as rationale;
5. legacy documents.

Latest audit:

`src/docs/trader-intelligence-v3-fifth-pass-qa-query-filter-visual-evidence-and-accessibility-review-2026-07-17.md`

The old Gate 0 plan remains umbrella/historical. Weekday analytics and daily-stop simulation belong to GA0-B.

---

# 2. Current Direction

```text
contained owner-only environment
  -> canonical exact execution truth
  -> immutable corrections and reconstruction
  -> coverage, manifests, eligibility, and analysis snapshot
  -> deterministic tables and chart-ready series
  -> stable claims and evidence
  -> accessible visual evidence
  -> owner-only AI explanation and approved visual selection
  -> qualified market enrichment
  -> usefulness calibration
```

Code owns all numbers, filters, series, evidence, and chart data.

AI may select approved tools and approved visual templates. It may not generate values, arbitrary chart code, live advice, or missing market data.

---

# 3. Current Gate — GA0-A1

Implement only:

- deployment/hosting contracts;
- owner page/API containment;
- current-system inventory;
- minimal v3 boundary;
- architecture dependency guard;
- private-data repository guard;
- legacy hazard register.

Recommended branch:

`agent/trader-intelligence-v3-ga0-a1-containment`

Do not add:

- analytics;
- date/query UI;
- chart series/rendering;
- AI;
- market enrichment;
- support/resistance;
- `/coach` redesign;
- deployment.

---

# 4. Following Slices

## GA0-A2

- exact decimals;
- canonical serialization/cryptographic identity;
- execution identity/order;
- duplicate/correction/collision states;
- P/L/reconstruction policy;
- reference math;
- exact fixtures.

## GA0-A3

- bitemporal corrections;
- factual lifecycle versus review state;
- open-position/cutoff policy;
- dataset/coverage manifests;
- eligibility;
- immutable analysis snapshot;
- stable evidence;
- canonical date/time/filter contract and digest;
- runtime validation;
- WAL-safe restore;
- parser-hardening contracts.

## GA0-B

- read-only adapter;
- weekday analytics;
- daily-stop simulation;
- exact tables;
- validated claims/evidence;
- candidate/eligible/included/excluded counts;
- validated chart-ready series;
- diagnostics and v3 CI.

## GA0-C

- private calibration;
- reconciliation/coverage;
- backup/restore drill;
- filter/table/series verification;
- owner evidence review;
- safe regression cases.

## GA1

- deterministic query/filter UI;
- visible absolute resolution of relative dates;
- accessible chart-template registry and renderer;
- exact table alternatives;
- keyboard evidence drill-down;
- text/chart consistency validation;
- visual replay/performance tests.

## GA2

- natural-language query-intent proposal;
- approved tool selection;
- approved visual-template selection;
- grounded explanation;
- cost and access controls;
- evaluation/feedback.

---

# 5. Query and Visual Evidence Rules

Every analytical question resolves to a canonical filter with:

- date basis;
- time basis;
- timezone;
- absolute range and inclusivity;
- calendar versus trading sessions;
- relative-date anchor/resolution;
- account/instrument/session/lifecycle/setup/outcome/currency scope;
- capability;
- cutoff;
- digest.

Every visual references:

- validated server-owned series;
- claims/evidence;
- same analysis snapshot and filter digest as the prose;
- unit/currency/timezone;
- included/excluded counts;
- limitations;
- accessible summary/table;
- drill-down evidence set.

No model-supplied values. No arbitrary chart code. No browser-authoritative financial aggregation.

Charts are supporting historical evidence, not proof of causation or future performance.

---

# 6. Core Guardrails

- no JavaScript-number financial authority;
- no user review action changing inventory;
- no ambiguous duplicate silently dropped;
- no mixed analysis snapshots;
- no relative date without visible absolute resolution;
- no chart/prose filter, unit, denominator, or limitation mismatch;
- no chart without table alternative;
- no color-only meaning;
- no candle-derived spread/slippage/executability claims;
- no missing bars labeled halt;
- no current float applied historically;
- no later filing used at entry time;
- no raw broker data in Git/logs/default prompts;
- no anonymous private-hosted Intelligence route;
- no support/resistance until zone usefulness gate;
- no live directional journal output.

---

# 7. Verification Expectations

For each runtime PR report:

- exact commands;
- focused tests;
- TypeScript;
- lint;
- full tests;
- Layer 2/3 verification;
- build;
- private-data guard;
- architecture guard;
- project-log update.

Normal CI must not call a live model or external market-data source.

---

# 8. Final Working Standard

> A trustworthy answer and its charts use the same source data, canonical filters, analysis snapshot, exact calculations, exclusions, evidence, units, and limitations.

> Build table truth first, chart-ready series second, accessible deterministic visuals third, and AI-directed visual selection last.
