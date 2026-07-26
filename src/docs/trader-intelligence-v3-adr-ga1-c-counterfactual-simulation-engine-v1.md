# ADR: GA1-C Generic Counterfactual Simulation Engine v1

**Date:** 2026-07-25 America/Toronto
**Status:** fee-aware resizing executable checkpoint candidate
**Base:** `183f6d44e1289a646d22fefb82f1d8c589b5e1b4`
**Branch:** `agent/trader-intelligence-v3-ga1-c-counterfactual-simulation`

## Final executable proof

The fixed fixture `ti_v3_ga1_c_fixed_seed_20260726_v1` proves exactly 10,000
rows through generic execution/replay and all 14 governed presets, including
fee-aware resizing, result reconstruction, bounded evidence, replay receipts,
max-plus-one rejection, and reversed-storage identity. The proof exposed that
the prior canonical and runtime-validation 500,000-key graph budgets stopped a
declared-valid result at outcome 5,349. Both remain hard bounded limits and are
now sized to the declared 10,000-outcome contract.

## Fee-authority audit correction

Row-level `broker_reported_complete` or `account_policy_calculated` authority is
exact for resizing only when every required component is decomposed and governed
by an exact resizing policy. Any `unknown_undecomposed` component derives
resized charge/net authority as `unavailable`, even under those row-level
states. Exact gross remains available, while simulated charges and net remain
null and the outcome cannot enter the exact-net comparison population.

## Decision

GA1-C introduces one deterministic, execution-only counterfactual engine. Named
simulation capabilities compile strict plain-data presets into the shared plan;
they do not implement separate financial calculations.

The first checkpoint proves three different rule families:

- `stop_after_consecutive_losses`: stateful session stop based only on completed
  realized net losses;
- `maximum_trades_per_day`: frequency exclusion counting only executed simulated
  entries;
- `direction_only`: stateless entry exclusion.

Checkpoint two adds the ten remaining preserve-or-exclude/session-state presets:
daily dollar drawdown, realized-profit giveback, fourth-and-later exclusion,
wait after loss, maximum attempts per stable instrument, stop after losing
instrument attempts, no-new-trades cutoff, entry-price range exclusion,
repeat-attempt exclusion, and one-shot after-outcome exclusion. All compile into
this same plan and engine.

The final governed preset is `simulate_reduce_size_after_loss`. A retained
simulated trade whose exact net loss completes strictly before a later candidate
arms one session-wide pending resize. The first candidate that reaches the
resize rule consumes it. Higher-precedence and source-filter exclusions do not
consume it. The multiplier is exactly `0.5`; the simulated quantity is
`floor(original * 0.5)` whole shares. A result below one share is an explicit
zero-size exclusion. Pending state resets across owner, account, currency,
accepted session, timezone, and date-basis boundaries. It is intentionally
session-wide across stable instruments; instrument-scoped attempt/stop rules
remain isolated by stable instrument.

The engine preserves accepted entry and exit prices, executions, fills, and
market path. Exact gross P/L uses the post-floor size ratio, not blindly `0.5`
for odd quantities. It retains fixed and non-scaling fee components and scales
quantity-variable, notional-variable, and sell-side regulatory components by
that exact ratio. Broker-complete and account-policy-calculated components, or
an explicit-zero declaration, can produce exact resized net P/L. Broker-partial,
estimated, unavailable, not-included, and unknown/undecomposed authority remain
distinct and never become zero. Gross comparison remains exact when net
comparison is incomplete or unavailable.

## Accepted authority reuse

The engine reuses rather than replaces:

- GA1-A dataset derivation and partition receipts;
- the GA1-A read-only gateway and authority checks;
- executor-issued verified query-result capability;
- GA1-A filters, row semantics, exact metric registry, and calculations;
- GA0-B canonical serialization/content identity and strict contract validation;
- GA0-B3 completed-outcome and future-entry-only daily-stop meaning;
- execution digests and occurrence keys already bound to each analytical row.

A structurally valid, cloned, altered, foreign, or re-digested query result is
not execution authority. The engine requires the in-process capability issued by
the accepted GA1-A executor and requires its query-plan digest to equal the
simulation plan's source query-plan digest.

## Chronology and no lookahead

Source entries are ordered by accepted entry timestamp, final exit timestamp,
then semantic round-trip key. State resets by canonical owner, account,
currency, session date, timezone, and date basis.

Chronological state is dependency-driven under
`ti_v3_rule_state_dependency_policy_v3`. The resizing checkpoint increments the accepted
v1 policy because it adds persisted state families and rule declarations. The
plan contains the deterministic
union of its registered rule dependencies. Rule order cannot add or remove a
state family. The current registry declares:

| Rule | State dependency |
| --- | --- |
| `direction_only` | source direction only; no session state |
| `maximum_trades_per_day` | executed simulated-entry count only |
| `stop_after_consecutive_losses` | completed outcome, completion timestamp, loss streak, session stop |
| daily dollar drawdown | completed exact economics, completion timestamp, realized daily P/L, session stop |
| realized profit giveback | completed exact economics, completion timestamp, realized and peak daily P/L, session stop |
| wait after loss | completed outcome, completion timestamp, cooldown-until |
| instrument attempt limits | retained-entry count for the current stable instrument |
| losing-instrument stop | completed outcomes, completion timestamp, instrument loss count and stop |
| no-new-trades cutoff | accepted timezone wall-clock entry time |
| entry-price range | accepted GA1-A entry-price authority |
| after-outcome exclusion | prior completed outcome and one-shot pending state |
| reduce size after loss | completed exact net outcome, completion timestamp, pending resize, size authority, fee authority |

Only simulated trades that were actually retained can later affect an active
state family. Completion rows, outcome signs, loss streaks, and completion-tie
ambiguity are not processed when no active rule consumes them.

For a completed-outcome rule, a completion affects a candidate only when its
accepted final-exit timestamp is strictly earlier than that candidate's entry
timestamp. A completion exactly at entry is not treated as known. Same-time
completion groups are processed atomically. Mixed outcomes fail only when
unknown ordering can change an active state family: loss streak, prior
outcome/one-shot exclusion, or realized-profit peak. Exact daily P/L,
instrument losing-attempt totals, and loss cooldown are commutative for their
declared v1 policies, so irrelevant mixed signs do not fail those rules.
Lexical identity never substitutes for economic ordering authority.

Flat and profitable completed trades reset the consecutive-loss streak. The
trade that reaches the configured loss threshold remains executed. Later
eligible entries are classified `skipped_session_stopped`.

## Rule precedence

Each rule has one unique canonical `ruleId` and one unique positive precedence.
Plans normalize rules by precedence. The first matching rule owns the
classification and exact reason. Contradictory direction-only rules, duplicate
identity, duplicate precedence, unknown types or fields, and invalid thresholds
are rejected.

Skipped trades never consume the maximum-trade slot and never provide later
completion state. This is true independent of their source sequence.

Session snapshots bind the dependency-policy version. They expose only bounded
current-session/current-instrument state: executed count, loss streak, realized
and peak P/L, session stop, cooldown, current-instrument attempts/losses/stop,
prior outcome, and pending one-shot rule identities. Every inactive family is
`not_evaluated` with null rather than a misleading zero or empty value presented
as evaluated.

## Actual versus simulated truth

Resize outcomes separately classify exact-net execution, incomplete,
unavailable, and estimated net authority, quantity-unavailable evaluation, and
zero simulated size. They bind original/simulated quantity, exact ratio,
rounding and minimum policies, gross economics, fee components, charge and net
authority, supporting execution digests, occurrence keys, and limitations.
Result summaries reconcile gross- and net-comparable populations separately;
net totals and effect become `null`/`not_comparable` when any retained resize
lacks exact net authority. A later chronological rule that needs the completed
resized net outcome fails closed at the first relevant future entry.

Manual entry and future importers must provide explicit fee authority. Existing
aggregate charge totals default to `not_included` for resizing and are never
interpreted as explicit zero. Future account fee-policy calculators may produce
`account_policy_calculated` authority only through a separately governed,
versioned policy.

Checkpoint one supports historical removal only. Retained trades preserve their
accepted entry, exit, size, gross/net economics, charges, execution references,
and occurrence references. It does not invent prices, fills, stops, targets,
candles, slippage, liquidity, or market paths. `resizedCount` is therefore
exactly zero.

Actual and simulated metrics use the GA1-A metric registry. Net P/L and its
difference use accepted exact-decimal arithmetic. Results reconcile bounded
trade/day helped and harmed counts, avoided losses, removed profits, retained
losses/winners, neutral effects, stop/cooldown events, and per-rule affected
counts to ordered outcomes. Evidence is selected only from exact
classifications and retains source keys, execution digests, occurrence keys,
qualifying/emitted counts, deterministic order, and truncation state.

The authoritative affected population is the population whose simulated
execution or economics actually changed: `skipped_by_rule`,
`skipped_session_stopped`, `skipped_ticker_stopped`, and
`skipped_during_cooldown`. Missing required rule authority is fail-closed but
conservatively retained as `unavailable_required_authority`; it preserves
observed economics and is not an affected/excluded trade. Unavailable
evaluations remain separately visible in `unavailableCount`, their responsible
rule and exact reason, and trade/result limitation codes. Per-rule affected
counts use the same exclusion predicate and cannot count conservative retention.

Preset reconstruction verifies governed arguments, the rebuilt generic plan,
derived dependencies, and both digests. Result replay reopens accepted
authority, reruns the engine, and requires the rebuilt result digest. Correctly
re-digested field tampering cannot self-authorize. The persisted replay
envelope and receipt layered over that path are specified below.

## Persisted replay envelope and receipt

Independent audit found that the original issuance request made
`compiledPreset` optional. A caller could therefore omit the preset for a
governed execution and issue a generic envelope with no governed-preset
reference. The generic plan still proved the exact rules and policies executed,
but it could not prove the claimed named preset or its governed arguments.

The correction makes plan origin explicit, content-addressed, and
non-downgradable. Both the simulation plan and replay envelope declare exactly
one origin:

- `generic_plan` requires no compiled preset and exactly seven artifact
  references;
- `governed_preset` requires the fully reconstructed compiled preset and exactly
  eight artifact references.

Origin is declared by the producer rather than inferred from rule shape. An
arbitrary generic plan may have the same rules as a preset without proving that
the preset key, version, arguments, or policy contract authorized it. The
simulation-plan digest binds origin before envelope issuance, and the envelope
digest binds the same origin, preset reference, and exact ordered reference
set. Consequently, omitting the preset, changing either origin, removing the
preset reference, or reducing eight references to seven fails semantically even
when the altered artifact is correctly re-digested.

The standalone replay checkpoint adds two distinct content-addressed artifacts.
The envelope identifies the dataset and derivation receipts, analytical
partition, executor-issued source query result, query plan, simulation plan,
persisted result, execution policies, state-dependency policy, output bounds,
and the origin-required governed preset. It stores strict digest references rather than
duplicating the full query result, plan, result, or preset.

The envelope is not execution authority. Replay still requires the externally
retained read-only source capability, partition receipt, executor-issued GA1-A
query-result object, simulation plan, persisted simulation result, and governed
preset artifact when named. The replay path reopens the source, reconstructs
the query and simulation plans, reconstructs a named preset, calls the generic
simulation executor, and calls complete result re-execution.

A receipt is issued only after those checks succeed. It binds the envelope,
supplied source identities, reconstructed query/plan/result digests, expected
persisted result digest, verified status, empty successful diagnostics, and its
own digest. Failed replay returns a bounded deterministic stage-specific
failure and no receipt. Receipt shape/digest verification alone is not replay
authority; authoritative attestation requires replay against the retained
external artifacts.

Envelope references are bounded to eight, diagnostics to the plan's declared
limit and the global maximum of 128, reconstruction evidence to zero, and the
receipt collection to one. The historical in-sample limitation is unchanged.
Proportional sizing, rounding, charges/fees, and the final 10,000-row proof
remain outside this checkpoint.

## Content identity and bounds

The plan and result have separate content digests. The plan binds source query
authority, ordered governed rules, fixed execution policies, and output bounds.
Checkpoint-one maxima are:

| Boundary | Maximum |
| --- | ---: |
| rules | 16 |
| source rows / trade outcomes | 10,000 |
| session summaries | 2,000 |
| evidence trades | 512 |
| diagnostics | 128 |

Max-plus-one fails closed. The affected-trade bound cannot be lower than the
source-row bound because checkpoint one emits one classification per accepted
source row.

## Rejected alternatives

- One implementation per named question would duplicate chronology and math.
- Accepting arbitrary functions, code, or SQL would make the model executable
  authority.
- Reusing observed trades to invent alternate prices or fills would exceed
  execution-only authority.
- Letting a skipped source trade update simulated state would introduce a
  counterfactual contradiction.
- Treating digest shape or a newly computed digest alone as authority would
  permit altered artifacts to self-authorize.

## Exclusions

This checkpoint adds no AI, natural-language routing, UI, charts, routes,
candles, provider calls, setup detection, support/resistance, database writes,
migrations, broker execution, private-data calibration, deployment, merge, or
GA1-D/GA1-E work.
