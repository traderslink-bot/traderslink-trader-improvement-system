# Trader Intelligence v3 Gate 0 Umbrella Plan

**Date:** 2026-07-17 America/Toronto  
**Status:** Umbrella and historical planning artifact  
**Active architecture:** `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`  
**Active file-level plan:** `src/docs/trader-intelligence-v3-ga0-a-control-and-exact-truth-implementation-plan-2026-07-17.md`  
**Current gate:** GA0-A1 — containment and architecture boundaries

This file no longer controls the next coding PR.

It preserves the original Gate 0 intent and the relationship between the first deterministic proof tools. The file-level execution scope was superseded after the fourth and fifth QA passes split the work into smaller reviewable stages.

---

# 1. Authority

Read:

1. `plan.md`
2. `src/docs/trader-intelligence-v3-project-log.md`
3. `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`
4. `src/docs/trader-intelligence-v3-ga0-a-control-and-exact-truth-implementation-plan-2026-07-17.md`

Use this umbrella only for historical context.

---

# 2. Original Gate 0 Goal

Gate 0 was created to prove that Trader Intelligence could answer deterministic questions before AI:

- performance by weekday;
- historical result under a stop-after-consecutive-losses rule.

Those remain valid proof tools.

They no longer belong in the first exact-truth PR.

---

# 3. Current Split

## GA0-A — Control and Exact Truth

Executed through:

- GA0-A1 containment and architecture boundaries;
- GA0-A2 canonical execution and exact financial truth;
- GA0-A3 temporal, manifest, eligibility, evidence, and canonical query/filter foundation.

No analytics, chart rendering, AI, market enrichment, support/resistance, or deployment belongs in GA0-A.

## GA0-B — Deterministic Proof

Implements:

- read-only current-data adapter;
- performance-by-weekday tool;
- stop-after-consecutive-losses simulation;
- exact table output;
- validated claims/evidence;
- included/excluded accounting;
- validated chart-ready series;
- property/differential tests;
- v3 CI.

## GA0-C — Private Calibration

Performs:

- private fixture manifest without raw data;
- import reconciliation and coverage report;
- date/filter/table/series verification;
- backup/restore drill;
- owner evidence review;
- safe regression cases;
- Gate 0 exit report.

---

# 4. Later Product Sequence

## GA1 — Query and Visual Evidence

- deterministic date/time/filter UI;
- accessible visual-template registry and renderer;
- exact table alternatives;
- evidence drill-down;
- text/chart consistency validation;
- visual replay and performance tests.

## GA2 — Owner-Only AI

- natural-language query-intent proposal;
- approved tool selection;
- approved visual-template selection;
- grounded explanations;
- cost/access/evaluation controls.

AI does not generate chart values or chart code.

---

# 5. Historical Non-Goals Still Valid

- no AI before deterministic grounding;
- no unrestricted SQL;
- no vector storage in the initial architecture;
- no second support/resistance detector;
- no live alerts or automated execution;
- no tax accounting;
- no public-production claim from private-alpha adapters;
- no production deployment during Gate 0.

---

# 6. Historical Acceptance Intent

The original plan correctly required:

- exact financial truth;
- policy versions;
- evidence IDs;
- uncertainty and sample limitations;
- simulations with explicit interventions;
- read-only compatibility with current data;
- no premature UI or AI changes.

Those requirements are retained and strengthened in the controlling specification and active GA0-A plan.

---

# 7. Final Umbrella Directive

Do not implement from this file alone.

The current sequence is:

```text
GA0-A exact/control foundation
  -> GA0-B deterministic tools and chart-ready series
  -> GA0-C private calibration
  -> GA1 accessible query and visual evidence
  -> GA2 owner-only AI
```

The active implementation plan controls the next runtime PR.
