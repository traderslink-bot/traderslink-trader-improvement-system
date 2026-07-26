# GA1-C Simulation Contract and Rule Policy

## Final proof contract

`npm run verify:ti-v3:ga1-c -- --scale-only` runs the offline fixed fixture
`ti_v3_ga1_c_fixed_seed_20260726_v1`: 10,000 explicit-zero-fee, whole-share
analytical rows, one outcome per row, generic and all governed origins,
re-execution, envelopes/receipts, bounded evidence, max-plus-one failure, and
source-storage permutation identity. No wall clock, network, market data,
private data, SQL, browser, provider, candle, or alternate calculator is used.

## Derived resized fee authority

The resizing executor derives one authoritative charge/net status from both the
row-level fee state and its components. Fully decomposed complete broker or
account-policy components and explicit zero are exact; partial is incomplete;
estimated remains estimated; not-included, unavailable, legacy aggregate-only,
or any unknown/undecomposed component is unavailable. The same derived value
controls disposition, reason, charge/net values and authorities, limitations,
summaries, and evidence. A null simulated amount is never admitted to an exact
comparison. Gross remains exact independently when its sizing inputs are exact.

## Plan contract

`ti_v3_counterfactual_simulation_plan_v3` is strict plain data and binds:

- the complete accepted GA1-A source query plan and its owner/account/currency,
  timezone/date-basis, filters, dataset, derivation, and partition authority;
- ordered governed rules with unique identity and precedence;
- the derived, versioned state-dependency union for those rules;
- observed-entry, preserve-or-exclude, observed-size, observed-charge, no-fill-
  invention, reset, timestamp-tie, missing-data, and limitation policies;
- source-row, affected-trade, session, evidence, and diagnostic bounds;
- `planDigest`.

Unknown fields, accessors, class instances, non-plain or polluted objects,
foreign authority, noncanonical counts, zero/negative thresholds, duplicate
identity, duplicate precedence, contradictory direction rules, unsupported
policies, max-plus-one, and altered persisted digests fail closed.

## Dependency-driven state policy

The centralized `ti_v3_rule_state_dependency_policy_v3` declaration covers
checkpoint one's accepted dependencies plus the new persisted families:

- executed simulated-entry count;
- completed realized outcome;
- completed-loss streak;
- realized daily P/L;
- peak realized daily P/L;
- prior completion timestamp;
- ticker-attempt state;
- ticker losing-attempt and ticker-stop state;
- entry-time cutoff;
- entry-price authority;
- cooldown-until state;
- prior completed outcome and one-shot after-outcome state;
- size authority;
- session-stop state.

The current direction rule activates none of those state families. The
maximum-trades rule activates only executed-entry count. The consecutive-loss
rule activates completed outcome, loss streak, prior completion timestamp, and
session-stop state.

The resolver unions declarations independently of caller order and stores that
union in the content-addressed plan. Persisted plans must carry the exact
reconstructed union. Rules remain plain data; the plan accepts no callbacks,
executable code, or caller-declared dependency escalation.

Checkpoint-two rules activate only their declared families. The resize rule
activates completed outcome/timestamp, session-wide pending resize, size
authority, and fee authority. Adding one family never initializes every other
family.

## Governed resize policy

`simulate_reduce_size_after_loss` compiles the fixed v1 rule:

- trigger only from a retained simulated exact-net loss whose completion is
  strictly earlier than the candidate entry;
- arm one pending resize in the owner/account/currency/session partition;
- do not arm from skipped or source-filtered trades;
- do not consume on a higher-precedence or source-filter exclusion;
- consume on the first candidate that reaches the resize rule, including a
  zero-share exclusion;
- use multiplier `0.5`, floor toward zero to whole shares, and exclude below
  one share;
- reset pending state by accepted session; the rule is session-wide across
  stable instruments, while ticker attempt/stop state remains instrument-scoped;
- preserve observed prices, fills, timestamps, executions, and market path.

The post-floor exact ratio controls proportional gross P/L and variable fees.
For example, five shares become two, ratio `2/5`; the engine does not call this
an exact half. Fixed and non-scaling components are retained. Quantity,
notional, and sell-side regulatory components scale by the exact ratio.
Unknown/undecomposed components prevent exact resized net authority.

Fee authority states are `broker_reported_complete`,
`broker_reported_partial`, `account_policy_calculated`, `explicitly_zero`,
`estimated`, `not_included`, and `unavailable`. Missing authority defaults to
`not_included`; it never defaults to zero. Complete broker/account components
must reconcile to historical signed charges. Partial and estimated authority
requires an explicit reason. Legacy aggregate charges remain undecomposed and
fail closed for resized net P/L.

Resize outcomes bind original and simulated quantity, exact size ratio, floor
and minimum policies, original and simulated gross P/L, actual fee authority
and components, simulated charges and authority, actual and simulated net
authority, evidence references, reason, and limitations. Gross remains exact
where quantity authority exists even if net is incomplete, unavailable, or
estimated. Net totals never mix exact and non-exact values. A future candidate
that requires a completed resized net outcome fails closed when that exact
authority is absent.

Exact rational economics remain authoritative even when their denominator
cannot be represented as a terminating canonical decimal. In that case the
rational resize detail remains exact, while legacy scalar net totals are null
and later decimal-state consumers fail closed rather than substituting the
historical net.

## Checkpoint-one outcome contract

Every analytical source row receives exactly one ordered classification:

| Classification | Meaning |
| --- | --- |
| `executed_unchanged` | observed execution and economics are retained |
| `executed_resized` | exact quantity, gross, charges, and net are resized |
| `executed_resized_net_incomplete` | quantity and gross are exact; broker fee coverage is partial |
| `executed_resized_net_unavailable` | quantity and gross are exact; net fee authority is unavailable/not included/undecomposed |
| `executed_resized_net_estimated` | quantity and gross are exact; fee/net authority remains explicitly estimated |
| `excluded_zero_simulated_size` | floor rounding produced fewer than one simulated share |
| `resize_unavailable_quantity` | whole positive quantity authority is absent |
| `skipped_by_rule` | first matching exclusion rule removed the observed trade |
| `skipped_session_stopped` | an earlier simulated completion stopped the session |
| `skipped_ticker_stopped` | an earlier retained completion stopped this stable instrument only |
| `skipped_during_cooldown` | candidate entry is strictly before loss-cooldown expiry |
| `excluded_source_filter` | accepted GA1-A scope filters excluded the row |
| `unavailable_required_authority` | required rule authority is missing; observed economics are conservatively retained and counted unavailable |

Each emitted row binds the source trade key, responsible rule, reason code,
actual and simulated net P/L, size authority, execution/occurrence references,
session state before/after, and limitations.

`unavailable_required_authority` is a conservative retained evaluation, not an
affected or excluded trade. It remains in the simulated population with
unchanged observed economics and is counted through `unavailableCount`, its
classification, responsible rule, exact reason, and limitation codes. The
single authoritative affected predicate includes only `skipped_by_rule`,
`skipped_session_stopped`, `skipped_ticker_stopped`, and
`skipped_during_cooldown`; it excludes `executed_unchanged`,
`excluded_source_filter`, and `unavailable_required_authority`.

Session snapshots distinguish `evaluated` values from `not_evaluated` nulls and
bind the dependency-policy version. An inactive loss streak is never presented
as an evaluated zero.

Source candidates that never became analytical rows remain counted as
unavailable source authority; no trade identity or economics are fabricated for
them.

## Representative rules

### Stop after consecutive losses

- input: canonical integer string `1..16`;
- outcome: exact accepted net P/L;
- update time: accepted final exit, strictly before a future entry;
- flats: reset the loss streak;
- threshold trade: retained;
- later entries: session-stopped;
- reset: verified canonical session partition;
- simultaneous mixed outcomes: fail closed when order can change active state;
- simultaneous all-loss, all-flat, or all-gain outcomes: accepted when their
  order is economically equivalent for the active loss-streak rule.

### Maximum trades per day

- input: canonical integer string `1..1000`;
- count: executed simulated entries only;
- excluded/stopped/filter-excluded trades do not consume a slot;
- reset: verified canonical session partition;
- boundary: the first candidate after the count equals the maximum is skipped.
- completed outcomes and loss streaks are not processed.

### Direction only

- input: `long` or `short`;
- comparison: accepted reconstructed-trade direction;
- matching trades preserve observed economics;
- nonmatching trades are excluded without changing later state.
- completed outcomes, entry counts, and loss streaks are not processed.

## Governed presets

Accepted checkpoint one includes:

- `simulate_stop_after_consecutive_losses`;
- `simulate_maximum_trades_per_day`;
- `simulate_direction_only`.

Checkpoint two adds:

- `simulate_stop_after_daily_dollar_drawdown`: positive exact-dollar input;
  stop when retained completed daily net P/L is at or below its negative;
- `simulate_reduce_size_after_loss`: fixed exact `0.5` multiplier, whole-share
  floor, one next eligible trade, and component-authorized fees;
- `simulate_stop_after_profit_giveback`: positive exact-dollar input; inactive
  until a positive realized peak exists; stop at or above exact giveback;
- `simulate_skip_fourth_and_later_trades`: fixed three retained entries;
- `simulate_wait_after_loss`: retained loss completion plus canonical integer
  seconds; entry exactly at expiry is eligible;
- `simulate_maximum_attempts_per_ticker`: retained entries counted by stable
  instrument identity;
- `simulate_stop_after_losing_ticker_attempts`: non-resetting retained loss
  count per stable instrument; gains/flats do not reset v1;
- `simulate_no_new_trades_after_time`: canonical `HH:mm:ss` interpreted in the
  row's accepted IANA timezone; entry at cutoff is excluded; overnight sessions
  are rejected;
- `simulate_exclude_price_range`: explicit inclusive `exclude_inside_v1`
  bounds over accepted GA1-A entry-price authority;
- `simulate_skip_repeat_attempts`: first retained stable-instrument attempt only;
- `simulate_after_outcome_exclusion`: loss/gain/flat option; one next
  rule-eligible trade is consumed, and a pending exclusion survives nonmatching
  completions until consumed.

Each preset is content-addressed and binds normalized strict arguments, required
authority, compiled plan, dependencies, precedence, reset, minimum sample,
missing data, comparison metrics, affected population, evidence,
counterexamples, no-outlier-suppression v1, allowed wording, and the in-sample
warning. Reconstruction recompiles the preset and rejects altered plans,
caller-declared dependencies, foreign authority, and correctly re-digested
tampering.

## Result truth

The result binds the verified source result, complete plan, counts, actual and
simulated ordered populations, GA1-A exact metrics, exact net P/L comparison,
one outcome per source row, reconciled affected summaries, six bounded evidence
categories, limitations, and `resultDigest`.

`ruleSpecificAffectedCounts[].affectedCount` is derived only from that
authoritative affected predicate and therefore represents actual simulated
execution/economic changes. Source-filter exclusions and unavailable
evaluations have their own contract fields and must not inflate it.

Allowed language: a configured rule produced an exact difference in this
historical in-sample population.

Disallowed language: the rule will improve future performance, proves an edge,
proves a behavioral diagnosis, or represents executable trading advice.

## Reconstruction and replay boundary

Checkpoint two implements governed preset reconstruction and complete result
re-execution through accepted in-process GA1-A source-result authority. Replay
rebuilds chronology, classifications, state, metrics, summaries, evidence, and
the result digest; it returns only the rebuilt result. Unknown fields,
accessors, class/polluted objects, foreign authority, altered compiled plans,
and correctly re-digested result/preset tampering fail closed.

The persisted envelope and content-addressed replay receipt are specified
below. Proportional sizing remains excluded from both execution and replay.

## Persisted replay contract

Replay envelope version
`ti_v3_counterfactual_simulation_replay_envelope_v1` binds:

- source key/version plus snapshot, dataset-receipt, derivation, partition,
  owner, account, and currency identities;
- source query-plan and executor-issued result digests;
- simulation plan and persisted result digests plus result schema version;
- state-dependency, chronological-order, timestamp-tie, sizing, charge,
  missing-data, and all other accepted execution policies;
- declared simulation output bounds and required GA1-A authority scope;
- explicit `generic_plan` or `governed_preset` origin, also bound by the
  simulation-plan digest;
- no governed preset and exactly seven ordered references for `generic_plan`;
- the exact preset schema/key/version/digest and exactly eight ordered
  references for `governed_preset`; and
- explicit artifact, diagnostic, reconstruction-evidence, and receipt bounds.

The envelope is stored with, not instead of, the authoritative source,
partition receipt, executor-issued query result, simulation plan, persisted
result, and origin-required compiled preset. Generic issuance rejects any
compiled preset. Governed issuance requires one and reconstructs its accepted
authority, governed arguments, preset digest, and generated plan digest before
the envelope can be issued. A generic plan proves the rules and policies it
executes; it cannot prove the validity of a named preset or its arguments.

Origin is never inferred from plan shape. Missing, unknown, or extra origin
fields fail closed. A governed plan and result cannot be issued as generic by
omitting the preset because the governed origin is part of the plan digest.
Replay applies the same split: generic replay rejects a supplied preset, while
governed replay requires the exact reconstructed preset. Correctly re-digested
generic-to-governed substitution, governed-to-generic substitution, preset
reference removal, and eight-to-seven reference reduction all fail
semantically. A digest establishes content identity, not authority or successful
execution.

Successful replay produces
`ti_v3_counterfactual_simulation_replay_receipt_v1`. It binds the envelope and
supplied authority identities, reconstructed query-plan, simulation-plan, and
simulation-result digests, the expected persisted result digest, verified
status, null mismatch stage, bounded empty success diagnostics, and its receipt
digest. Failures produce no receipt; they return one deterministic bounded
diagnostic at the exact stage:

1. `replay_envelope_contract`;
2. `dataset_partition_authority`;
3. `source_query_result_authority`;
4. `source_query_plan_reconstruction`;
5. `simulation_plan_reconstruction`;
6. `preset_reconstruction`;
7. `simulation_execution`;
8. `result_reconstruction`;
9. `expected_result_digest`;
10. `replay_receipt_verification`.

The replay path supports direct generic plans and all fourteen accepted
execution-only presets. Max-plus-one artifact references or diagnostics fail
closed. Unknown, missing, extra, unsupported-version, foreign-authority, and
correctly re-digested tampering also fail closed. Historical in-sample results
still do not establish future edge.
