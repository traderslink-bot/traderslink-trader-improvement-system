# GA1-C Simulation Contract and Rule Policy

## Plan contract

`ti_v3_counterfactual_simulation_plan_v1` is strict plain data and binds:

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

The centralized `ti_v3_rule_state_dependency_policy_v1` declaration covers:

- executed simulated-entry count;
- completed realized outcome;
- completed-loss streak;
- realized daily P/L;
- prior completion timestamp;
- ticker-attempt state;
- entry-time cutoff;
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

Future realized-P/L rules will activate exact realized-daily-P/L state. Future
cooldown rules will activate prior-completion timestamp state. Future ticker,
time-cutoff, and sizing rules will activate only their respective state
families. Adding one family does not initialize every other family.

## Checkpoint-one outcome contract

Every analytical source row receives exactly one ordered classification:

| Classification | Meaning |
| --- | --- |
| `executed_unchanged` | observed execution and economics are retained |
| `skipped_by_rule` | first matching exclusion rule removed the observed trade |
| `skipped_session_stopped` | an earlier simulated completion stopped the session |
| `excluded_source_filter` | accepted GA1-A scope filters excluded the row |
| `unavailable_required_authority` | reserved for row-level missing authority |

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

## Representative governed presets

Checkpoint one includes:

- `simulate_stop_after_consecutive_losses`;
- `simulate_maximum_trades_per_day`;
- `simulate_direction_only`.

Each preset is content-addressed and declares required authority, compiled plan,
precedence, reset, minimum sample, missing-data, comparison, evidence,
counterexample, outlier, allowed-wording, and in-sample policies. The checkpoint
outlier declaration explicitly records that leave-one-effect-out work is
deferred; it does not pretend the analysis already exists.

## Result truth

The result binds the verified source result, complete plan, counts, actual and
simulated ordered populations, GA1-A exact metrics, exact net P/L comparison,
one outcome per source row, limitations, and `resultDigest`.

Allowed language: a configured rule produced an exact difference in this
historical in-sample population.

Disallowed language: the rule will improve future performance, proves an edge,
proves a behavioral diagnosis, or represents executable trading advice.

## Planned reconstruction and replay boundary

The next checkpoint must add a persisted envelope and closed reconstruction:

1. reopen exact source authority;
2. reconstruct and verify the GA1-A query result;
3. reconstruct the simulation plan and governed preset;
4. rebuild chronological source/filter populations;
5. initialize session state;
6. replay completion and rule evaluation;
7. rebuild classifications and sizing;
8. recalculate metrics and comparison;
9. rebuild evidence, counterexamples, outliers, and limitations;
10. require canonical equality and issue a replay receipt.

A recomputed digest without successful reconstruction will remain invalid.
