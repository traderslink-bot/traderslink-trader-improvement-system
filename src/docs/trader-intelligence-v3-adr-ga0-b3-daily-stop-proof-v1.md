# ADR: GA0-B3 Consecutive-Loss Daily-Stop Simulation v1

**Status:** proposed for independent re-audit after final focused remediation
**Date:** 2026-07-24 America/Toronto
**Tool:** `simulate_daily_stop_rule:v1`

## Decision

GA0-B3 provides one deterministic historical simulation over the accepted B1
analytical dataset and B1/B2 proof contracts. It answers only what the verified
journal would have looked like if new entries had been removed after a fixed
number of completed losing round trips in each verified session. It is not AI
advice, a prediction, a behavioral diagnosis, or a future-performance claim.

The v1 argument is content-addressed and runtime validated:

| Argument | Policy |
| --- | --- |
| `consecutiveLossThreshold` | canonical decimal integer string from `1` through `16` inclusive |
| default | `2` |
| `streakPolicy` | `completed_net_loss_only_v1` |
| `flatTradePolicy` | `flat_resets_loss_streak_v1` |
| `overlapPolicy` | `retain_entries_at_or_before_stop_timestamp_v1` |
| `evidenceSamplePolicy` | `ti_v3_daily_stop_conservative_evidence_v1` |
| `outlierPolicy` | `ti_v3_daily_stop_outlier_contribution_v1` |

Numbers, decimals, non-canonical strings, zero, negative values, values above
16, unknown fields, and unsupported policy values are rejected. The normalized
arguments digest and exact registered tool entry are bound into the run context.

## Session identity and order

Rows are grouped by canonical owner, canonical account, currency, verified
session date, verified timezone, and `trade_close_date` date basis. USD and CAD
are never aggregated. UTC and `America/New_York` retain the accepted B1 session
authority. Within a session, presentation and suffix order use verified first
entry timestamp, then the accepted B1 sequence. Persistence IDs, caller order,
digests, locale strings, browser timestamps, and JavaScript `Date` defaults are
not economic ordering authority.

## Rule semantics

Only closed round trips provide outcomes. Exact net P/L below zero increments the
loss streak, exact net P/L above zero resets it, and exact zero also resets it.
The streak is updated at verified final exit, not entry. A later-entered trade
that completes first may therefore establish the streak before an earlier
overlapping trade.

The round trip that raises the streak to the threshold is retained. Its verified
final exit is the stop timestamp. Only rows whose first entry is strictly after
that timestamp are removed. Rows entered before or exactly at the stop remain,
including positions still open at the stop; their eventual exact outcome is not
recalculated. The artifact discloses that the rule removes future entries only.

When simultaneous completion outcomes conflict and no accepted authoritative tie
order exists, the session is excluded from the simulation population: no
simulated, removed, difference, or classification value is fabricated. The
actual rows, exact actual P/L, ambiguity reason, and row-specific evidence are
preserved in `daily_stop_ambiguous_sessions`. Such a session contributes to
neither the aggregate, claim sample, nor chart series. If a same-timestamp
group mixes any loss with a non-loss, the order is not admissible and the
session is excluded even when the current streak is below threshold; entry,
semantic, and hash order are never used as a same-time tie-breaker. Same-outcome
groups that cannot change the threshold are harmless; same-outcome
threshold-crossing groups fail closed.

## Exact tables and equations

The session table contains one row per included verified session and exposes
actual, retained/simulated, and removed counts; threshold evidence; trigger
identity and timestamp; actual/simulated/removed gross P/L, charges, and net
P/L; exact difference; classification; evidence; overlap disclosure; and
limitations. The aggregate table exposes candidate/included/excluded counts,
threshold/help/harm/unchanged counts, all exact totals, best/worst day effects,
both leave-one-session effects, largest absolute contribution, outlier state,
and limitations. Ambiguous sessions have a separate row ledger with unavailable
simulation fields and preserved actual evidence. Manifest/read-model exclusion
candidates remain in an explicit per-candidate exclusion table with a bounded
content-addressed row key and one evidence bundle per candidate.
Because an excluded candidate does not carry an included session's canonical
session identity, the aggregate `excluded_session_count` is unavailable when
the exclusion ledger is non-empty rather than being guessed from candidate
count; the ledger and its candidate count remain explicit.
If any candidate is excluded before session identity is available, both
candidate-session and excluded-session scope are explicitly unavailable rather
than inferred. When no session is included, the aggregate uses a
content-addressed `empty_included` population evidence bundle with zero
candidate keys; ambiguous rows are never substituted as included evidence and
financial aggregate cells are unavailable rather than presented as zero.

For every included session the executor proves:

```text
actual net P/L = simulated retained net P/L + removed net P/L
difference = simulated net P/L - actual net P/L
```

Helped means difference greater than zero, harmed means less than zero, and
unchanged means exact equality. No financial value is converted through a
JavaScript number, floating-point sum, parseFloat, rounding function, or
caller-supplied total.

## Evidence, series, and claims

Deterministic evidence bundles cover actual rows, retained rows, removed rows,
the trigger, aggregate population, and the exclusion ledger. The session
simulation bundle additionally identifies actual, retained, removed, trigger,
and stop-time authority; both exact difference and classification bind to that
bundle. Table cells and series points retain their source evidence. The three chart-ready series select
only validated session-table values: actual versus simulated net P/L, exact
difference, and actual versus simulated trade counts. No rendering code or new
financial calculation is present.

Fewer than 10 threshold-reached sessions is a descriptive-only limited result;
5–9 is an intermediate descriptive sample and fewer than 5 is explicitly
insufficient. A tentative claim is permitted only at 10 or more threshold-
reached sessions, with no genuine limitations and stable direction after both
largest-helped and largest-harmed session exclusions. No high-confidence claim
is emitted. A sensitive outlier result is limited and emits zero claims.

The aggregate also declares one exact sample state: `insufficient` for fewer
than 5 threshold-reached sessions, `descriptive_only` for 5–9, and
`claim_eligible` for 10 or more. Claim sample size is authoritative from the
aggregate `threshold_reached_session_count` cell, not from trade rows or
evidence candidates. The B3 sample authority is versioned and binds the claim
type, aggregate subject/comparison groups, aggregate table/row/column, and
`threshold_reached_sessions` evidence population. In the final contract this
authority is content-addressed as `ti_v3_daily_stop_sample_authority_v1` and
also binds the analysis-run context digest, verified `daily_stop_sessions:v1`
and `daily_stop_aggregate:v1` table digests, the literal aggregate
`aggregate.threshold_reached_session_count` cell, the exact sorted
threshold-reached session row keys, the exact count, and an authority digest.
The claim validator rejects foreign tables or contexts, fabricated counts or
row keys, missing/duplicated/non-threshold rows, unsupported claim types, and
direction/wording mismatches. Claims preserve semantic counterexample evidence for
opposite-effect sessions, threshold-reached unchanged sessions, leave-one-out
direction changes, and economically contrary removed trades. Absent categories
are omitted rather than represented by arbitrary sample rows.

Claims may say only that this fixed historical removal rule produced higher,
lower, or unchanged simulated P/L, or that evidence was descriptive/insufficient
or sensitive. They must not say the rule will improve the future, that a trader
should stop, that the market or trader would have behaved identically, or that
the result proves revenge trading.

Outlier sensitivity records the complete effect, the effects excluding the
largest helped and harmed sessions, the largest absolute contribution, and
whether either leave-one-out changes aggregate direction. This is deterministic
robustness evidence, not a statistical proof.

## Replay and reference authority

Persisted output is untrusted. Replay validates the persisted graph, rehydrates
the exact B1 dataset derivation, rebuilds the exact currency partition, reruns
the registered B3 executor from source authority, and exact-compares the full
canonical artifact graph. WeakMap branding is not persistence proof.

The independent reference simulator uses a separate completion sweep and does
not import or call the production streak, trigger, retention, or suffix loop.
Focused tests compare it with production across thresholds 1–16, flat-reset,
wins/losses, overlaps, later completions, ties, permutations, no-threshold,
helped, harmed, unchanged, and ambiguous cases. Date, timestamp, and identity
metrics preserve their exact canonical kinds and timezone/date-basis context;
diagnostics, evidence, tables, series, claims, and the receipt project every
partition, exclusion, ambiguity, sample, outlier, eligibility, and authority
limitation consistently.

## Limitations and deferred work

Unknown or non-neutral exclusion ledgers, stale authority, mixed currency,
evidence gaps, reconstruction failures, eligibility problems, ambiguous order,
and simulation uncertainty are claim-blocking. B3 does not add a general
multi-tool runner, UI, chart renderer, AI, market data, support/resistance,
coaching labels, migration, hosted-user path, or deployment. Cross-session
portfolio capital/buying-power effects, alternative stop rules, prospective
tracking, and GA0-B4 closeout remain deferred.
