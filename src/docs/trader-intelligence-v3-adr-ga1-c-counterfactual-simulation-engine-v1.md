# ADR: GA1-C Generic Counterfactual Simulation Engine v1

**Date:** 2026-07-25 America/Toronto
**Status:** second executable checkpoint candidate
**Base:** `183f6d44e1289a646d22fefb82f1d8c589b5e1b4`
**Branch:** `agent/trader-intelligence-v3-ga1-c-counterfactual-simulation`

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

The only deliberately unimplemented preset is proportional size reduction after
a loss. Its P/L scaling, share rounding, minimum-size, commission, regulatory
charge, fixed-fee, variable-fee, and unavailable-authority policies require a
separate focused authority decision. The final 10,000-row proof remains reserved
until that decision and final replay-envelope work are complete.

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
`ti_v3_rule_state_dependency_policy_v2`. Checkpoint two increments the accepted
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

Preset reconstruction verifies governed arguments, the rebuilt generic plan,
derived dependencies, and both digests. Result replay reopens accepted
authority, reruns the engine, and requires the rebuilt result digest. Correctly
re-digested field tampering cannot self-authorize. A separate persisted replay
receipt/envelope remains deferred.

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
