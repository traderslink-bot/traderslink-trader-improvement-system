# GA1-C Checkpoint-Two Implementation and Audit Handoff

## Scope delivered

Checkpoint one established the generic content-addressed simulation plan and
three representative presets. Checkpoint two retains that accepted engine and
adds all ten remaining preserve-or-exclude/session-state presets, expanded
bounded result/evidence contracts, governed preset reconstruction, and complete
result re-execution verification.

Accepted checkpoint-one remediation:
`b3655471a99af685a86908a5ef8a21936dc60d1f`

Checkpoint-two executable commit: recorded after final verification and commit.

Draft PR: `#162`

## Governed-preset origin downgrade remediation

Required starting head:
`a97ce351ae13f9168e9a0dc3d4a7c218bd34fc2d`

The persisted replay checkpoint originally accepted optional
`compiledPreset`. Omitting it allowed a governed plan and persisted result to
be represented by a generic envelope with a null preset reference. That proved
the executed rules and policies but silently discarded the named preset and its
governed arguments.

The focused correction introduces an explicit plan-origin contract:

- `generic_plan`: origin must be declared in the content-addressed simulation
  plan and envelope; issuance accepts no compiled preset; the envelope contains
  no preset reference and exactly seven ordered artifact references; replay
  rejects any supplied preset.
- `governed_preset`: origin must be declared in both artifacts; issuance
  requires and fully reconstructs the compiled preset; its generated plan digest
  must equal the supplied plan digest; the envelope binds preset
  schema/key/version/digest and exactly eight ordered references; replay
  requires the matching compiled preset.

The implementation does not infer origin from rules. A generic plan cannot
prove a named preset. Plan origin is part of the simulation-plan digest and
envelope digest, so correctly re-digested governed-to-generic downgrade,
generic-to-governed upgrade, preset-reference removal, and eight-to-seven
reference reduction fail semantically. Missing, unknown, extra, mismatched, and
foreign origin/preset inputs fail closed.

Review the discriminated issuance union, strict runtime request shape,
plan/envelope reconstruction, all thirteen governed presets, direct generic
plans, deterministic receipt binding, and source permutation identity. The
final remediation commit and verification/CI identities are recorded externally
after completion because the commit cannot contain its own SHA.

## Checkpoint-two affected-population audit correction

Correction starting head:
`6b7bf67d35fc4b203bc315ab715db81a75566f60`

Final correction commit: the single focused commit containing this handoff;
resolve its external SHA from draft PR #162 or the final execution report
because a commit cannot include its own content-addressed identity.

The audit found that `ruleSpecificAffectedCounts` counted a responsible
`unavailable_required_authority` outcome even though the trade was retained
with unchanged economics. The corrected authoritative affected population is
exactly the rule-excluded classifications: `skipped_by_rule`,
`skipped_session_stopped`, `skipped_ticker_stopped`, and
`skipped_during_cooldown`. `executed_unchanged`, `excluded_source_filter`, and
`unavailable_required_authority` are not affected trades.

Unavailable rule evaluation remains explicit through `unavailableCount`, the
trade classification, responsible rule, exact reason, and limitation codes.
The focused regression covers single and mixed populations, exact summary
reconciliation, replay, correctly re-digested tampering, and permutation
identity. Changed files are the simulation engine, the checkpoint-two focused
test, this handoff, the ADR, contract, ledger, independent re-audit prompt, and
project log.

## Checkpoint-one audit remediation

The original engine processed completions before every included candidate even
when no active rule consumed completed-outcome state. Consequently, a
direction-only or maximum-trades plan could fail on a mixed simultaneous
completion tie that was irrelevant to its result.

The correction adds centralized, versioned rule-state dependency declarations
and binds their derived union into every simulation plan. Completion processing
now runs only when the plan requires completed outcomes. Maximum-trades updates
only executed-entry count. Direction-only initializes no chronological state.
Snapshots mark inactive state as `not_evaluated`, not evaluated zero.

Consecutive-loss semantics remain strict: only retained simulated trades may
complete into state, completion must be strictly before entry, equality remains
unavailable, material mixed ties fail closed, and economically equivalent tied
outcomes remain admissible.

## Review focus

Reviewers should concentrate on:

1. whether a cloned or foreign GA1-A result can become simulation authority;
2. whether any skipped trade can update simulated state or consume an entry;
3. whether completion data at or after entry leaks into a decision;
4. whether mixed same-time completion outcomes fail only when an active state
   can materially depend on their unknown order;
5. whether owner/account/currency/session state can cross partitions;
6. whether rule precedence owns classifications deterministically;
7. whether any financial calculation uses floating point;
8. whether the result invents fills, prices, charges, sizes, or market paths;
9. whether source permutations change plan or result identity;
10. whether unknown/accessor/class/polluted inputs can pass validation.
11. whether outcome-independent plans inspect completion outcome signs;
12. whether plan rule order can silently initialize additional state families.
13. whether cutoff time uses the accepted row timezone rather than locale or
    system-local time;
14. whether attempt state uses stable instrument identity rather than displayed
    ticker text;
15. whether all aggregates and bounded evidence reconcile to ordered outcome
    classifications and retained execution/occurrence references;
16. whether a correctly re-digested preset or result can bypass reconstruction.

## Checkpoint-two delivered areas

- daily exact-dollar drawdown and realized-profit giveback session stops;
- fourth-plus, time-cutoff, price-range, and repeat-attempt exclusions;
- cooldown, stable-instrument attempt limit, losing-instrument stop, and
  one-shot after-outcome state;
- dependency-driven bounded snapshots with explicit inactive state;
- helped/harmed trade/day summaries, stop/cooldown event counts, retained and
  removed outcome counts, and per-rule affected counts;
- six bounded, deterministic, classification-derived evidence categories with
  execution digests, occurrence keys, totals, emitted counts, and truncation;
- governed preset reconstruction and full result re-execution verification.

## Known incomplete areas

- `simulate_reduce_size_after_loss` remains deliberately deferred pending
  proportional P/L, rounding, minimum-size, fee, and charge authority;
- the standalone persisted replay envelope/receipt now includes the focused
  non-downgradable origin correction described above;
- final proportional-resizing integration and its focused tests remain;
- the fixed-seed 10,000-row proof remains reserved for the final executable
  checkpoint after all presets and sizing decisions are complete.

These are checkpoint boundaries, not claims of completed GA1-C acceptance.

## Stop boundary

Keep the PR draft, open, unmerged, and undeployed. Do not begin GA1-D or GA1-E.

## Persisted replay-envelope checkpoint

Starting head: `ad3a8597df9fccd60d8eca69d63e082bc755c9b9`

Final executable commit: the single checkpoint commit containing this handoff;
resolve its external SHA from draft PR #162 or the final execution report.

This checkpoint adds a portable content-addressed envelope containing strict
references to accepted source, query, simulation, policy, bound, result, and
origin-governed preset identities. It does not embed or replace the authoritative
artifacts. Replay requires those external artifacts, reopens read-only source
authority, verifies the executor capability, reconstructs query/plan/preset
authority, and delegates to the generic simulation executor plus accepted
complete result re-execution.

Only successful replay issues a deterministic content-addressed receipt.
Failure returns a bounded stage-specific code and no receipt. A receipt digest
does not independently grant authority; the persisted receipt is accepted only
when authoritative replay reconstructs the same receipt.

Independent audit should review:

- strict envelope/receipt fields and both new identity domains;
- exact seven/eight artifact references and diagnostic/output bounds;
- cloned capability and foreign owner/account/currency/partition rejection;
- cross-query and cross-simulation authority rejection;
- dependency, execution-policy, bound, preset-argument, result, envelope, and
  receipt tamper rejection, including correctly re-digested artifacts;
- generic and all thirteen governed preset reconstruction;
- repeated replay and source-storage permutation identity; and
- the ten deterministic mismatch stages.

Deferred work remains proportional resizing, share rounding, charges and fees,
the final 10,000-row proof, GA1-D, GA1-E, merge, and deployment.
