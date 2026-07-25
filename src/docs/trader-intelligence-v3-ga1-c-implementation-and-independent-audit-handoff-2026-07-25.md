# GA1-C Checkpoint-One Implementation and Audit Handoff

## Scope delivered

This checkpoint establishes the generic content-addressed simulation plan, the
execution-only chronological engine skeleton, exact actual-versus-simulated
metrics, per-trade classifications, and three governed representative presets.
It intentionally stops before implementing all fourteen presets.

Executable checkpoint: `52f86bcc8235aa7c52d251b1edbb0fd413dd5244`

Draft PR: `#162`

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
4. whether mixed same-time completion outcomes fail closed;
5. whether owner/account/currency/session state can cross partitions;
6. whether rule precedence owns classifications deterministically;
7. whether any financial calculation uses floating point;
8. whether the result invents fills, prices, charges, sizes, or market paths;
9. whether source permutations change plan or result identity;
10. whether unknown/accessor/class/polluted inputs can pass validation.
11. whether outcome-independent plans inspect completion outcome signs;
12. whether plan rule order can silently initialize additional state families.

## Known incomplete areas

- only three representative preset families are present;
- result shape verification and closed persisted replay are not yet complete;
- evidence selection is limited to row-bound execution/occurrence references;
- affected days/trades, profitable winners removed, losses avoided,
  counterexamples, and outlier sensitivity need full governed result contracts;
- size transformation and unavailable proportional-charge logic are deferred;
- the fixed-seed 10,000-row proof and workflow are deferred to the final
  executable checkpoint.

These are checkpoint boundaries, not claims of completed GA1-C acceptance.

## Stop boundary

Keep the PR draft, open, unmerged, and undeployed. Do not begin GA1-D or GA1-E.
