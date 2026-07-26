# Independent Re-Audit Handoff: GA1-C Checkpoint Two

Correction starting head:
`6b7bf67d35fc4b203bc315ab715db81a75566f60`

Final correction commit: the single focused commit containing this handoff;
resolve the external SHA from draft PR #162 or the final execution report.

The blocking defect was confined to `ruleSpecificAffectedCounts`: it treated a
responsible, conservatively retained `unavailable_required_authority` outcome
as affected. The corrected authoritative affected population contains only
actual simulated execution/economic changes represented by
`skipped_by_rule`, `skipped_session_stopped`, `skipped_ticker_stopped`, and
`skipped_during_cooldown`. Unavailable evaluations remain retained and
separately represented by count, classification, responsible rule, exact
reason, and limitations.

Re-audit the simulation engine, checkpoint-two focused test, ADR, contract,
verification ledger, implementation handoff, this handoff, and project log.
Confirm single and mixed unavailable/excluded reconciliation, replay,
correctly re-digested affected/unavailable tamper rejection, and permutation
identity. Proportional resizing, fee infrastructure, standalone replay
receipt/envelope, final 10,000-row proof, GA1-D, and GA1-E remain deferred.

Audit the draft GA1-C PR against:

- `src/docs/trader-intelligence-v3-post-ga0-b-query-simulation-and-candle-direction-lock-2026-07-25.md`;
- `src/docs/trader-intelligence-v3-adr-ga1-c-counterfactual-simulation-engine-v1.md`;
- `src/docs/trader-intelligence-v3-ga1-c-simulation-contract-and-rule-policy-2026-07-25.md`;
- accepted GA0-B3, GA1-A, and GA1-B contracts.

Treat this as the preserve-or-exclude/session-state checkpoint, not final GA1-C:
proportional resizing, a standalone replay receipt/envelope, and the final
10,000-row proof remain deferred.

Audit every new preset and its compiled generic rule. Attempt authority
substitution, caller-declared dependency substitution, altered compiled plans,
correctly re-digested preset/result tampering, unknown/accessor/class/polluted
inputs, source permutation, rule reordering, material and immaterial same-time
completion ties, completion-at-entry lookahead, skipped/source-filter state
leakage, cross-session/account/currency/instrument leakage, displayed-symbol
identity substitution, timezone/locale cutoff drift, exact threshold drift,
evidence max-plus-one, and helpful/harmful/unchanged cases.

Require affected summaries and every evidence bucket to reconcile to ordered
per-trade classifications, supporting execution digests, and occurrence keys.
Confirm no preset-specific execution loop or alternate financial calculator
exists.

Report blocking findings with exact file/line evidence. Do not merge, deploy,
mark ready, or broaden scope.

## Focused replay-envelope audit handoff

Audit the executable replay-envelope checkpoint from starting head
`ad3a8597df9fccd60d8eca69d63e082bc755c9b9`. Resolve the final checkpoint SHA
from the current draft PR #162 head because the commit cannot embed its own
identity.

Confirm the persisted envelope identifies but never substitutes for the
read-only source, partition, executor-issued query result, simulation plan,
persisted result, and optional governed preset. Confirm successful replay calls
the accepted generic executor and complete result re-execution, and only then
issues the receipt. Receipt digest/shape verification alone must not be treated
as execution authority.

Attempt cloned capability, foreign owner/account/currency/partition, cross-plan
and cross-result substitution, dependency/policy/bound/preset/result tampering,
correctly re-digested envelope/result/receipt tampering, unsupported versions,
unknown/missing/extra fields, and max-plus-one references/diagnostics. Verify
all thirteen preset keys, direct generic plans, exact stage codes, repeat
identity, and source-storage permutation identity.

Keep resizing, fees, final scale proof, GA1-D, GA1-E, merge, and deployment out
of scope.
