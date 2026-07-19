# Trader Intelligence v3 Project Log

**Last updated:** 2026-07-19 America/Toronto  
**Purpose:** active continuity and accepted-decision log  
**Current gate:** GA0-B1 — read-only analytical dataset and proof contracts  
**Active implementation plan:** `src/docs/trader-intelligence-v3-ga0-b-deterministic-proof-implementation-plan-2026-07-19.md`

This file records current accepted decisions and the exact resume point. Detailed
historical implementation and audit evidence remains preserved in Git history and
in the phase-specific audit/handoff documents.

---

# 1. Current accepted decision — GA0-A complete; GA0-B active

## 2026-07-19 — GA0-A3 independently accepted and merged

- GA0-A3 received the independent verdict `accept` after final focused
  remediation.
- PR #106 was closed out and merged into `main`.
- Accepted GA0-A3 merge commit:
  `72ca53940403dfab63979d403bd6b479539f41db`.
- The accepted scope includes:
  - append-only correction replay;
  - lifecycle and review-disposition separation;
  - retrospective/open-position policy;
  - content-addressed manifests and coverage;
  - per-capability eligibility;
  - immutable snapshots and producer-derived evidence;
  - canonical date/filter receipts;
  - runtime validation and stale states;
  - WAL-safe local backup/restore;
  - focused parser hardening.
- GA0-A1, GA0-A2, and GA0-A3 are complete.
- Accepted audit threads were resolved during closeout.
- No deployment occurred.
- GA0-B did not enter the GA0-A3 branch.

## Accepted milestone table

| Slice | PR | Accepted merge |
| --- | ---: | --- |
| GA0-A1 containment and architecture | #102 | `4f9e440116258c9548a2d13f7ea057a9075101c6` |
| GA0-A2 canonical execution and exact truth | #104 | `e6d0183cd03f55fb4b2b396f4f35ac2b2d035a8a` |
| GA0-A3 temporal, manifest, eligibility, and query foundation | #106 | `72ca53940403dfab63979d403bd6b479539f41db` |

---

# 2. Current program — GA0-B deterministic proof

The active plan is:

`src/docs/trader-intelligence-v3-ga0-b-deterministic-proof-implementation-plan-2026-07-19.md`

GA0-B proves the deterministic analytical path needed by the future AI journal.
It deliberately implements only two proof questions:

1. Why am I losing money on Fridays?
2. What happens if I stop trading after two consecutive losses?

The proof path is:

```text
accepted snapshot/filter
  -> read-only analytical dataset
  -> registered tool
  -> exact table
  -> validated claims
  -> included/excluded evidence
  -> chart-ready series
  -> reproducible run receipt
```

GA0-B does not implement a model, natural-language parser, query UI, chart
renderer, market enrichment, setup classification, support/resistance, or
production deployment.

---

# 3. GA0-B delivery sequence

## GA0-B1 — Read-only analytical dataset and proof contracts

Branch:

`agent/trader-intelligence-v3-ga0-b1-read-model`

Deliver:

- snapshot-bound read-only adapter;
- exact analytical row and dataset receipt;
- metric/run/table/claim/series/evidence contracts;
- inclusion/exclusion reasons;
- focused tests and architecture boundaries.

## GA0-B2 — Weekday proof

Branch:

`agent/trader-intelligence-v3-ga0-b2-weekday-proof`

Deliver:

- `analyze_performance_by_weekday:v1`;
- exact weekday table;
- target weekday versus baseline;
- outlier sensitivity and counterexamples;
- validated claims and chart-ready series.

## GA0-B3 — Consecutive-loss daily-stop proof

Branch:

`agent/trader-intelligence-v3-ga0-b3-daily-stop-proof`

Deliver:

- `simulate_daily_stop_rule:v1`;
- actual versus simulated results;
- days helped/harmed;
- exact claims/evidence/series;
- independent reference simulation.

## GA0-B4 — Proof closeout

Branch:

`agent/trader-intelligence-v3-ga0-b4-proof-closeout`

Deliver:

- final tool registry and runner;
- consistency validation;
- diagnostics and evidence resolution;
- property/differential/scale tests;
- focused GA0-B verifier and final audit.

Each slice uses a separate draft PR and independent acceptance before the next
slice begins.

---

# 4. Product priority ruling

The main product remains a professional AI-powered trading journal.

Foundation work is appropriate when it improves:

- financial correctness;
- analytical honesty;
- evidence quality;
- reliability;
- maintainability;
- performance;
- future AI answer quality.

The owner does not prioritize protecting disposable local test data. Do not
expand local privacy/network security as a product goal. Keep accepted safeguards
without spending GA0-B on unrelated local-security hardening.

Production hosting, public-user identity, tenancy, and security hardening remain
future work.

---

# 5. Testing decision

Testing must protect app functionality and financial/analytical truth without
repeatedly running slow repository-wide checks on the owner's computer.

Default cadence:

- focused tests during implementation;
- repository-wide TypeScript once near the executable checkpoint;
- no local full `npm test` without a concrete broad-regression reason;
- no Playwright unless browser-facing code changed;
- no repeated production builds;
- `npm ci` only when dependencies changed;
- GitHub CI runs the broad repository suite and Layer 2/3;
- documentation-only handoff commits receive lightweight checks only.

Never describe an interrupted or unrun command as passed.

---

# 6. Mandatory Codex handoff decision

Every Codex implementation or remediation prompt must require the final
substantive action to be a detailed Markdown handoff committed to the repository.

The handoff must contain:

- exact base, branch, PR, tested executable head, and documentation/current head;
- complete changed-file inventory;
- requirement-to-code/test mapping;
- architecture decisions and invariants;
- focused test commands/results;
- one final TypeScript result;
- build status;
- GitHub CI state separated from local testing;
- commands not run;
- intermediate failures and fixes;
- known limitations and deferred work;
- scope confirmation;
- exact independent audit commands;
- a complete ready-to-paste prompt for the independent auditor.

Codex's final response must give the owner the handoff path and the complete
ready-to-paste auditor prompt.

The independent auditor treats the handoff as evidence, not proof. Codex does not
resolve independent audit threads or merge its own PR.

---

# 7. Preserved feature commitments

The following product intentions remain preserved:

- deterministic import and saved-trade capabilities already committed to `main`;
- manual entry to be adapted to accepted v3 execution/persistence contracts in a
  later product gate;
- AI period reflections to be recovered behind the accepted evidence/AI gate;
- Real Coach/Whop prototype concepts to be evaluated later with synthetic local
  entitlement before hosted/payment integration;
- Academy identity and workflows remain separate from Trader Intelligence;
- support/resistance remains context only and cannot independently generate a
  coaching verdict.

Do not apply the mixed legacy V2 stash; it contains private SQLite material.

---

# 8. Exact resume point

1. Read `plan.md`.
2. Read this project log.
3. Read the controlling architecture specification.
4. Read the active GA0-B implementation plan completely.
5. Create `agent/trader-intelligence-v3-ga0-b1-read-model` from current `main`.
6. Implement GA0-B1 only.
7. Use focused tests and one final TypeScript run.
8. Finish by creating and committing:

   `src/docs/trader-intelligence-v3-ga0-b1-read-model-implementation-and-audit-handoff-2026-07-19.md`

9. Ensure Codex returns a complete ready-to-paste auditor prompt pointing to that
   handoff.
10. Open one draft PR and stop for independent audit.
11. Do not begin B2, UI, chart rendering, AI, market enrichment, support/resistance,
    public hosting, or deployment.

---

# 9. Historical evidence index

Detailed phase history remains available in:

- the GA0-A1, GA0-A2, and GA0-A3 implementation/audit handoffs;
- independent audit finding files;
- accepted ADRs;
- the current-system inventory;
- the legacy hazard register;
- Git history through GA0-A3 merge
  `72ca53940403dfab63979d403bd6b479539f41db`.

This compact current log supersedes stale in-progress status wording from earlier
entries without changing the preserved historical evidence.
