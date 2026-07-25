# GA1-C Checkpoint-One Implementation and Audit Handoff

## Scope delivered

This checkpoint establishes the generic content-addressed simulation plan, the
execution-only chronological engine skeleton, exact actual-versus-simulated
metrics, per-trade classifications, and three governed representative presets.
It intentionally stops before implementing all fourteen presets.

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
