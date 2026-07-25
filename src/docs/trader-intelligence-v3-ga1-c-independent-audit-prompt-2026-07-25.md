# Independent Audit Prompt: GA1-C Checkpoint Two

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
