# GA1-C Simulation Contract and Rule Policy

## Plan contract

`ti_v3_counterfactual_simulation_plan_v2` is strict plain data and binds:

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

The centralized `ti_v3_rule_state_dependency_policy_v2` declaration covers
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

Checkpoint-two rules activate only their declared families. Size authority
remains inactive because proportional resizing is deliberately deferred. Adding
one family never initializes every other family.

## Checkpoint-one outcome contract

Every analytical source row receives exactly one ordered classification:

| Classification | Meaning |
| --- | --- |
| `executed_unchanged` | observed execution and economics are retained |
| `skipped_by_rule` | first matching exclusion rule removed the observed trade |
| `skipped_session_stopped` | an earlier simulated completion stopped the session |
| `skipped_ticker_stopped` | an earlier retained completion stopped this stable instrument only |
| `skipped_during_cooldown` | candidate entry is strictly before loss-cooldown expiry |
| `excluded_source_filter` | accepted GA1-A scope filters excluded the row |
| `unavailable_required_authority` | required rule authority is missing; observed economics are conservatively retained and counted unavailable |

Each emitted row binds the source trade key, responsible rule, reason code,
actual and simulated net P/L, size authority, execution/occurrence references,
session state before/after, and limitations.

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

A separate persisted envelope and content-addressed replay receipt remain for a
later final checkpoint. Proportional sizing remains excluded from both execution
and replay.
