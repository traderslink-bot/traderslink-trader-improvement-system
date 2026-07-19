# Trader Intelligence Plan Entry Point

**Last updated:** 2026-07-19 America/Toronto  
**Active architecture:** Trader Intelligence v3  
**Operating profile:** `private_owner_alpha`  
**Operational hosting:** local owner testing  
**Primary domain:** U.S. listed small-cap and micro-cap active trading  
**Product boundary:** retrospective educational trade review and self-improvement  
**Current gate:** GA0-B1 — read-only analytical dataset and proof contracts  
**Active implementation plan:** `src/docs/trader-intelligence-v3-ga0-b-deterministic-proof-implementation-plan-2026-07-19.md`

Start here when resuming Trader Intelligence product, analytics, simulation,
query, visual evidence, AI, coaching, market context, persistence, or QA work.

---

# 1. Controlling read order

1. `src/docs/trader-intelligence-v3-project-log-addendum-ga0-b-2026-07-19.md`
2. `src/docs/trader-intelligence-v3-project-log.md` for preserved detailed history
3. `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`
4. `src/docs/trader-intelligence-v3-ga0-b-deterministic-proof-implementation-plan-2026-07-19.md`
5. accepted GA0-A ADRs
6. detailed v3 QA reviews and master plan when rationale is needed
7. legacy v1/v2 files only for preserved code, fixtures, routes, education, or migration evidence

Precedence:

1. latest explicit accepted project-log addendum or project-log decision;
2. controlling architecture specification;
3. active implementation plan;
4. detailed reviews/master plan as rationale;
5. legacy documents.

The addendum extends rather than replaces the detailed historical project log.
Historical audit handoffs are evidence, not active implementation authority.

---

# 2. Accepted foundation

| Slice | Status | Merge |
| --- | --- | --- |
| GA0-A1 containment and architecture | accepted | `4f9e440116258c9548a2d13f7ea057a9075101c6` |
| GA0-A2 exact execution truth | accepted | `e6d0183cd03f55fb4b2b396f4f35ac2b2d035a8a` |
| GA0-A3 temporal, manifest, eligibility, and query foundation | accepted | `72ca53940403dfab63979d403bd6b479539f41db` |

The accepted foundation provides:

- deterministic broker CSV ingress and validation;
- exact canonical financial values;
- canonical executions and occurrence identity;
- duplicate/correction handling;
- exact FIFO reconstruction;
- temporal correction replay;
- coverage and content-addressed dataset manifests;
- per-capability eligibility;
- canonical date/filter contracts;
- immutable snapshots and evidence inventories;
- runtime validation and stale states;
- local backup/restore and parser hardening.

GA0-A is complete. Do not reopen its accepted PRs merely to continue product work.

---

# 3. Product direction

```text
accepted exact journal truth
  -> deterministic analytics and simulations
  -> exact tables, claims, evidence, and chart-ready series
  -> private calibration
  -> owner-facing query and accessible visuals
  -> owner-only AI explanation and visual selection
  -> qualified small/micro-cap enrichment
  -> usefulness calibration
  -> future public hardening
```

The product goal remains an AI-powered trading journal.

> Code calculates the truth. AI later selects, connects, and explains the truth.

AI must not become the CSV parser, financial calculator, execution grouper,
database, unrestricted SQL author, chart-value generator, chart-code generator,
live signal engine, or automated broker.

---

# 4. Current operating priorities

- The owner is currently the only tester.
- The app is not public or multi-user.
- The owner is not concerned about disposable local test-data exposure.
- Keep accepted safeguards, but do not expand local privacy/network security as a
  product feature.
- Prioritize financial truth, analytical reliability, maintainability, evidence,
  performance, and progress toward visible AI functionality.
- Production hosting and public-user hardening remain future work.
- No live buy/sell/hold guidance, current targets, automated orders, guaranteed
  improvement, tax advice, or portfolio-allocation authority is allowed.

---

# 5. GA0-B — Deterministic proof

GA0-B proves the complete deterministic answer path using two questions:

1. **Why am I losing money on Fridays?**
2. **What happens if I stop trading after two consecutive losses?**

GA0-B includes:

- read-only current-data adapter;
- verified analytical rows and dataset receipt;
- exact metrics;
- tool registry;
- weekday analytics;
- consecutive-loss daily-stop simulation;
- exact tables;
- validated claims;
- included/excluded counts and reasons;
- stable evidence bundles;
- validated chart-ready series;
- consistency validation;
- diagnostics, reference/property/scale tests, and focused CI.

GA0-B excludes:

- model calls and prompts;
- natural-language parsing;
- query UI;
- chart rendering;
- market candles, VWAP, setup, catalyst, level, or support/resistance analytics;
- broad behavior/coaching labels;
- manual entry, reflections, Real Coach, or Whop;
- hosted/public users, migrations, or deployment.

---

# 6. GA0-B delivery sequence

## GA0-B1 — Read-only analytical dataset and proof contracts

Branch:

`agent/trader-intelligence-v3-ga0-b1-read-model`

Deliver:

- snapshot-bound read-only adapter;
- exact analytical row/dataset receipt;
- shared metric/run/table/claim/series/evidence contracts;
- inclusion/exclusion reasons;
- architecture boundaries and focused tests.

Handoff:

`src/docs/trader-intelligence-v3-ga0-b1-read-model-implementation-and-audit-handoff-2026-07-19.md`

## GA0-B2 — Weekday deterministic proof

Branch:

`agent/trader-intelligence-v3-ga0-b2-weekday-proof`

Deliver:

- `analyze_performance_by_weekday:v1`;
- target weekday versus explicit baseline;
- exact weekday table;
- outlier sensitivity and counterexamples;
- validated claims and chart-ready series.

Handoff:

`src/docs/trader-intelligence-v3-ga0-b2-weekday-proof-implementation-and-audit-handoff-2026-07-19.md`

## GA0-B3 — Consecutive-loss daily-stop proof

Branch:

`agent/trader-intelligence-v3-ga0-b3-daily-stop-proof`

Deliver:

- `simulate_daily_stop_rule:v1`;
- actual versus simulated day and aggregate tables;
- days helped/harmed;
- exact claims/evidence/series;
- independent reference simulation.

Handoff:

`src/docs/trader-intelligence-v3-ga0-b3-daily-stop-proof-implementation-and-audit-handoff-2026-07-19.md`

## GA0-B4 — Proof closeout

Branch:

`agent/trader-intelligence-v3-ga0-b4-proof-closeout`

Deliver:

- final two-tool registry and runner;
- cross-artifact consistency validator;
- evidence resolution and diagnostics;
- property/differential/10,000-row scale proof;
- focused GA0-B verifier and CI;
- final GA0-B audit handoff.

Handoff:

`src/docs/trader-intelligence-v3-ga0-b4-proof-closeout-implementation-and-audit-handoff-2026-07-19.md`

Each slice uses one draft PR, independent audit, acceptance, and merge before the
next slice begins.

---

# 7. Testing cadence

During implementation:

- run only focused tests for the current module;
- do not run repository-wide TypeScript after every module;
- run `npx tsc --noEmit --pretty false` once near the executable checkpoint;
- do not run local `npm test` without a concrete broad-regression reason;
- do not run Playwright unless browser-facing code changed;
- do not run a production build repeatedly;
- do not run `npm ci` unless package or lock files changed;
- let GitHub CI run the full repository suite and Layer 2/3;
- never call an interrupted or unrun command a pass.

After all executable changes in a slice, run one consolidated focused checkpoint
as specified in the active GA0-B plan.

A later Markdown-only handoff commit receives lightweight checks only; do not
repeat TypeScript, Vitest, build, or browser tests solely for documentation.

---

# 8. Mandatory Codex-to-auditor handoff

Every Codex implementation or remediation prompt must require this as the final
substantive action:

1. create/update the slice handoff Markdown file in the repository;
2. record exact base, branch, PR, tested executable head, and documentation head;
3. list changed files and map requirements to code/tests;
4. report focused tests, one final TypeScript result, build status, CI state,
   commands not run, failures, fixes, and limitations;
5. confirm no out-of-scope AI/UI/chart/market/deployment work entered;
6. include a complete ready-to-paste prompt for the independent auditor;
7. provide that prompt to the owner in Codex's final response.

The auditor treats the handoff as evidence, not proof, inspects the full diff and
runtime paths, and returns `accept`, `accept with required fixes`, or `reject`.

Codex does not resolve independent review threads or merge its own PR. The
independent auditor resolves accepted threads and merges after acceptance.

---

# 9. Next phases

## GA0-C — Private calibration

Use private owner data outside Git for reconciliation, usefulness, exclusion,
filter, table/series, simulation, and restore drills. Convert defects into safe
synthetic regressions.

## GA1 — Query and visual evidence

Build owner-facing deterministic filters, exact tables, accessible chart
rendering, and evidence drill-down over accepted GA0-B outputs.

## GA2 — Owner-only AI

Add AI question routing and explanation over approved deterministic tools. AI may
select tools and approved visual templates and explain validated claims. It may
not calculate numbers or create chart data/code.

---

# 10. Immediate next action

1. Use current `main` containing GA0-A3 merge
   `72ca53940403dfab63979d403bd6b479539f41db`.
2. Create `agent/trader-intelligence-v3-ga0-b1-read-model`.
3. Implement GA0-B1 only under the active detailed plan.
4. Use focused testing and one final TypeScript run.
5. Finish by uploading the mandatory B1 handoff and auditor prompt.
6. Open one draft PR and stop for independent audit.
7. Do not begin B2, UI, charts, AI, market enrichment, support/resistance, or deployment.
