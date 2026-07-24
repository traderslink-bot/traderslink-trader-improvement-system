# Trader Intelligence v3 GA0-B3 Independent Audit Findings

**Date:** 2026-07-24 America/Toronto  
**Repository:** `traderslink-bot/traderslink-trader-improvement-system`  
**Branch:** `agent/trader-intelligence-v3-ga0-b3-daily-stop-proof`  
**Draft PR:** `#156`  
**Accepted GA0-B2 merge and immutable B3 merge base:** `4338cab7d46b8a0548b22346f81b42db5fec3bf0`  
**Audited executable head:** `51c7b421f33b872be69f9ce4a1c34cbda29881e5`  
**Audited documentation/current head:** `9c762a239f4f584dc42b49905ab6315573f7ffa6`  
**Verdict:** `accept with required fixes`

> This is independent audit evidence. It does not authorize merge, deployment,
> review-thread resolution, readiness promotion, GA0-B4, or a later product slice.
> The implementer handoff, local command report, and passing GitHub CI were treated
> as evidence rather than proof.

---

## 1. Independently verified state

- PR #156 was open, draft, mergeable, and unmerged when the audit began.
- The PR base and executable parent are the accepted B2 merge
  `4338cab7d46b8a0548b22346f81b42db5fec3bf0`.
- The executable implementation is one commit after B2. Two later commits changed
  only the mandatory handoff Markdown file.
- The executable head changed the complete B3 implementation, its focused test,
  the B3 ADR, exports, identity domains, and status documents. Every changed
  executable file was inspected.
- PR #156 had no inline review threads before this audit.
- Executable CI run `30131239211`, job `89605997240`, passed.
- Current documentation-head CI run `30131388426`, job `89606433044`, passed.
- Both jobs completed clean checkout, dependency installation, full repository
  tests, GA0-A2 exact-truth verification, architecture verification,
  private-data verification, Layer 2, and Layer 3.
- No deployment, UI, AI/model, chart renderer, market-data, support/resistance,
  migration, hosted-user, GA0-B4, or later-slice implementation was observed.

## 2. Independent execution limitation

The audit runtime did not contain the supplied Windows checkout. A clean clone was
attempted, but the runtime could not resolve `github.com`; the failure occurred
before checkout and dependency installation. Consequently:

- independent `npm ci` did not run;
- independent TypeScript, ESLint, Vitest, and verifier commands did not run;
- no local command is represented as independently passed.

The audit instead used immutable GitHub file/diff inspection, adversarial
construction analysis of the public contracts, review-state inspection, the
uploaded handoff, and executable/documentation-head CI evidence.

---

# 3. Required findings

## B3-AUD-R1 — High: ambiguous sessions are counted as successful unchanged simulations instead of being excluded

**Affected files**

- `src/lib/trader-intelligence-v3/analytics/tools/daily-stop/daily-stop-simulation.ts`
- `src/lib/trader-intelligence-v3/analytics/tools/daily-stop/daily-stop-analysis.ts`
- B3 ADR and focused tests

### Failure path

When completion order is ambiguous, `simulateDailyStopSession` sets no trigger and
removes no rows. It retains every actual row, computes simulated P/L equal to actual
P/L, and classifies the session as `unchanged`.

`buildNonBlockedExecution` then includes that decision in every aggregate:

- `included_session_count`;
- `threshold_not_reached_session_count`;
- `unchanged_session_count`;
- actual and simulated trade counts;
- actual and simulated P/L totals;
- series and aggregate evidence.

The controlling GA0-B3 rule says ambiguous sessions are excluded rather than
guessed. A limited session whose simulation result is unknowable is not a valid
unchanged simulation.

### Concrete failure scenario

A session contains a losing and winning round trip completing at the same timestamp,
with no authoritative completion precedence. The current output reports the session
as included, threshold not reached, unchanged, and contributes all of its P/L to the
aggregate. The correct result is an explicitly excluded/ambiguous session that does
not enter helped/harmed/unchanged or simulated totals.

### Required remediation

1. Separate candidate, included-simulated, and excluded/ambiguous sessions.
2. Do not calculate or publish a simulated financial result for an ambiguous
   session; use unavailable values with exact reason codes or an explicit excluded
   session table.
3. Exclude ambiguous sessions from threshold-reached/not-reached,
   helped/harmed/unchanged, trade-count, P/L, outlier, claim, and series aggregates.
4. Preserve actual evidence for the excluded session without promoting it into the
   simulated population.
5. Prove included plus excluded exactly reconciles the candidate session set where
   session identity is available.
6. Add direct aggregate tests for one ambiguous session mixed with valid helped,
   harmed, and unchanged sessions.

---

## B3-AUD-R2 — High: the validated claim reports the wrong sample population and arbitrary sessions as counterexamples

**Affected files**

- `src/lib/trader-intelligence-v3/analytics/tools/daily-stop/daily-stop-analysis.ts`
- shared validated-claim usage and focused tests

### Failure path

The B3 promotion threshold is measured in threshold-reached **sessions**. The B3
claim is built from the aggregate row whose evidence bundle contains every included
trade row. The shared claim builder derives `targetSampleSize` from the number of
candidate keys in that evidence bundle. Therefore a ten-session, thirty-trade
analysis produces a claim sample size of `30`, not `10` threshold-reached sessions.

The implementation also assigns the first four `daily_stop_actual_*` evidence
bundles as counterexamples without checking whether those sessions contradict the
claim. An all-helped population can therefore label four helped sessions as
counterexamples to a positive claim.

### Required remediation

1. Add a B3 claim authority that derives the policy sample from exact session-table
   cells, including threshold-reached and included-simulated session counts.
2. Do not reuse trade-candidate cardinality as a session sample size.
3. Select counterexamples semantically:
   - harmed sessions for a positive aggregate claim;
   - helped sessions for a negative claim;
   - profitable removed trades;
   - threshold-reached unchanged sessions;
   - sessions that weaken leave-one-out robustness.
4. Omit a counterexample category when no genuine counterexample exists.
5. Add all-helped, all-harmed, mixed, unchanged, and profitable-removed test vectors
   that assert exact sample sizes and counterexample membership.

---

## B3-AUD-R3 — High/Medium: the independent reference simulator disagrees with production on the required ambiguous path

**Affected files**

- `src/lib/trader-intelligence-v3/analytics/tools/daily-stop/daily-stop-simulation.ts`
- `src/lib/trader-intelligence-v3/analytics/tools/daily-stop/daily-stop-reference.ts`
- `src/lib/trader-intelligence-v3/__tests__/ga0-b3/daily-stop-analysis.test.ts`

### Failure path

For an ambiguous same-time completion group:

- production returns every row in `retainedRows` and an unchanged financial result;
- the reference returns empty retained and removed key sets with `ambiguous: true`.

A direct production/reference comparison therefore fails. The current ambiguity test
checks only that a limitation exists and no claim is emitted. The differential test
uses only non-ambiguous fixtures, so the disagreement is not exercised.

### Required remediation

1. Define one exact excluded-session representation and make production and
   reference outputs agree on it.
2. Add differential cases for:
   - mixed same-time outcomes;
   - all-loss same-time threshold crossing;
   - win-plus-flat same-time groups;
   - threshold effects that are and are not order-sensitive;
   - already-open overlaps;
   - thresholds `1`, `2`, and `16`;
   - caller permutations.
3. Add deterministic generated/property cases; one fixed ten-day fixture is not the
   required independent reference proof.

---

## B3-AUD-R4 — High/Medium: aggregate candidate/excluded session accounting and exclusion-row evidence are not exact

**Affected file**

- `src/lib/trader-intelligence-v3/analytics/tools/daily-stop/daily-stop-analysis.ts`

### Failure paths

1. `candidate_session_count` and `included_session_count` are both set to the number
   of sessions constructed from included rows. When excluded candidates exist,
   `excluded_session_count` is correctly unavailable because candidate exclusions do
   not necessarily carry session identity. For the same reason, total candidate
   session count is also unknown; reporting the included count as the candidate count
   is misleading.
2. Every exclusion-table row references one evidence bundle containing all excluded
   candidates, rather than evidence for that row's candidate.
3. Exclusion row keys are built by replacing valid candidate-key punctuation with
   underscores. Distinct accepted candidate keys such as `candidate:a` and
   `candidate.a` can collapse to the same row key. Accepted candidate keys may also
   be longer than the exact-table row-key limit, causing valid B1 exclusions to make
   B3 construction fail.

### Required remediation

1. Make candidate-session count unavailable whenever excluded session identity cannot
   be proven, or add a verified session-scoped exclusion authority that calculates it
   exactly.
2. Keep included, excluded, ambiguous, and candidate counts semantically distinct.
3. Create one exact exclusion evidence bundle per exclusion row or a table shape whose
   row explicitly represents the complete ledger bundle.
4. Use an injective, bounded, content-addressed row identity rather than lossy
   punctuation replacement.
5. Add multiple-exclusion, long-key, punctuation-collision, same-session, and
   different-session exclusion fixtures.

---

## B3-AUD-R5 — Medium: the documented sample states are collapsed into one limitation

**Affected files**

- `src/lib/trader-intelligence-v3/analytics/tools/daily-stop/daily-stop-policy.ts`
- `src/lib/trader-intelligence-v3/analytics/tools/daily-stop/daily-stop-analysis.ts`
- B3 ADR and focused tests

The policy declares both `minimumDescriptiveSessions = 5` and
`minimumTentativeSessions = 10`. Execution uses only the ten-session threshold and
emits the same `threshold_sample_insufficient` limitation for every population below
10. No content-addressed output distinguishes:

- fewer than 5 threshold-reached sessions: insufficient;
- 5 through 9: descriptive only;
- 10 or more: claim eligible when all other checks pass.

This contradicts the B3 ADR and prevents future UI/AI consumers from explaining why
a result abstained.

### Required remediation

1. Add exact versioned sample states such as `insufficient`, `descriptive_only`, and
   `claim_eligible`.
2. Put the state and exact threshold-reached session count in the authoritative
   aggregate table and diagnostics.
3. Use distinct reason codes where appropriate.
4. Add exact boundary tests for `0`, `4`, `5`, `9`, and `10` threshold-reached
   sessions.

---

## B3-AUD-R6 — Medium: material temporal and cell-evidence facts are weakened in the exact table

**Affected files**

- `src/lib/trader-intelligence-v3/analytics/tools/daily-stop/daily-stop-exact-math.ts`
- `src/lib/trader-intelligence-v3/analytics/tools/daily-stop/daily-stop-analysis.ts`

### Failure paths

- `dailyStopEnumMetric` lowercases every enum value.
- `threshold_final_exit_at` is stored as an enum rather than the accepted exact
  timestamp metric. A canonical value such as `2026-07-01T14:07:00.000000000Z`
  becomes a lowercase category string and is no longer runtime-validated as a
  timestamp with timezone/date basis.
- The session `exact_difference` and classification cells point only to retained-row
  evidence even though they depend on both actual and retained/removed populations.

### Required remediation

1. Use exact `date` and `timestamp` metric kinds for temporal facts, preserving the
   accepted timezone and date basis.
2. Do not lowercase canonical temporal or identity facts as a presentation shortcut.
3. Bind difference/classification cells to evidence sufficient to reproduce both
   actual and simulated values.
4. Add canonical timestamp, timezone, evidence-membership, and tampering tests.

---

## B3-AUD-R7 — Medium: run diagnostics and the mandatory handoff do not reflect the complete final authority

**Affected files**

- `src/lib/trader-intelligence-v3/analytics/tools/daily-stop/daily-stop-analysis.ts`
- `src/docs/trader-intelligence-v3-ga0-b3-daily-stop-proof-implementation-and-audit-handoff-2026-07-19.md`

### Failure paths

The run's table/receipt limitation set may contain partition limitations, non-neutral
exclusion reasons, and `excluded_session_scope_unavailable`. Diagnostics are emitted
only for local ambiguity, sample insufficiency, outlier sensitivity, and overlap
information. A future consumer can receive a limited receipt with no diagnostic for
the exclusion or partition reason that made it limited.

The mandatory handoff at current PR head `9c762a239f4f584dc42b49905ab6315573f7ffa6`
still identifies `da9ad60563c27a6cc06d83a0e582913c70c45dbd` as the current head and says
both executable and documentation CI are pending/not passed. Both CI runs have now
passed, and the handoff's chronology omits the actual current documentation commit.

### Required remediation

1. Emit deterministic diagnostics for every claim-blocking/global limitation or define
   and verify an explicit projection policy.
2. Require table, series, evidence, diagnostics, receipt, and claim presence to agree.
3. Update the handoff with the exact tested executable head, final documentation head,
   complete commit chronology, and terminal executable/documentation CI run and job
   IDs.
4. Keep later handoff-only checks lightweight; do not repeat heavy tests solely for
   documentation.

---

## 4. Validated strengths to preserve

The following implementation direction is accepted and must not be weakened during
remediation:

- canonical bounded threshold arguments and exact registered tool identity;
- owner/account/currency/session/timezone/date-basis grouping;
- completed-outcome streak updates and flat reset;
- strict `firstEntryAt > stopAt` removal rule;
- retention of positions already open at the stop timestamp;
- exact decimal sums and actual/simulated/removed net-P/L reconciliation;
- B1/B2 run-context, table, evidence, series, receipt, and replay reuse;
- content-addressed B3 execution authority and full persisted semantic replay;
- no UI, AI, rendering, market-data, deployment, or GA0-B4 scope expansion.

## 5. Required next state

- Keep PR #156 draft and unmerged.
- Do not resolve any independent audit thread.
- Do not deploy.
- Do not begin GA0-B4.
- Remediate B3-AUD-R1 through R7 on the existing branch and PR.
- Preserve the validated strengths above.
- Publish a detailed remediation and independent re-audit handoff in a later
  Markdown-only commit and stop for re-audit.
