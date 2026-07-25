# ADR: GA1-C Generic Counterfactual Simulation Engine v1

**Date:** 2026-07-25 America/Toronto
**Status:** first executable checkpoint for independent review
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

The full fourteen-preset pack, closed persisted replay, complete evidence and
counterexample selection, result reconstruction verifier, resize authority, and
10,000-row proof remain subsequent checkpoints in this same draft PR.

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
`ti_v3_rule_state_dependency_policy_v1`. The plan contains the deterministic
union of its registered rule dependencies. Rule order cannot add or remove a
state family. The current registry declares:

| Rule | State dependency |
| --- | --- |
| `direction_only` | source direction only; no session state |
| `maximum_trades_per_day` | executed simulated-entry count only |
| `stop_after_consecutive_losses` | completed outcome, completion timestamp, loss streak, session stop |

Only simulated trades that were actually retained can later affect an active
state family. Completion rows, outcome signs, loss streaks, and completion-tie
ambiguity are not processed when no active rule consumes them.

For a completed-outcome rule, a completion affects a candidate only when its
accepted final-exit timestamp is strictly earlier than that candidate's entry
timestamp. A completion exactly at entry is not treated as known. Mixed outcomes
sharing an otherwise unordered completion timestamp fail closed; lexical
identity is not economic completion authority. Same-time outcomes that are
economically equivalent for the active loss-streak rule are accepted because
their ordering cannot change the state available to the next entry.

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

Session snapshots bind the dependency-policy version. Inactive entry-count,
loss-streak, and session-stop fields are emitted as `not_evaluated` with a null
value rather than as an evaluated zero.

## Actual versus simulated truth

Checkpoint one supports historical removal only. Retained trades preserve their
accepted entry, exit, size, gross/net economics, charges, execution references,
and occurrence references. It does not invent prices, fills, stops, targets,
candles, slippage, liquidity, or market paths. `resizedCount` is therefore
exactly zero.

Actual and simulated metrics use the GA1-A metric registry. Net P/L and its
difference use accepted exact-decimal arithmetic. A result may be helped,
harmed, or unchanged. Every result is labeled historical and in-sample and
states that it does not prove a future edge.

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
- Treating digest shape alone as authority would permit altered artifacts to
  self-authorize.

## Exclusions

This checkpoint adds no AI, natural-language routing, UI, charts, routes,
candles, provider calls, setup detection, support/resistance, database writes,
migrations, broker execution, private-data calibration, deployment, merge, or
GA1-D/GA1-E work.
