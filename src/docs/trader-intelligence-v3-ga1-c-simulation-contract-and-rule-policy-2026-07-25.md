# GA1-C Simulation Contract and Rule Policy

## Plan contract

`ti_v3_counterfactual_simulation_plan_v1` is strict plain data and binds:

- the complete accepted GA1-A source query plan and its owner/account/currency,
  timezone/date-basis, filters, dataset, derivation, and partition authority;
- ordered governed rules with unique identity and precedence;
- observed-entry, preserve-or-exclude, observed-size, observed-charge, no-fill-
  invention, reset, timestamp-tie, missing-data, and limitation policies;
- source-row, affected-trade, session, evidence, and diagnostic bounds;
- `planDigest`.

Unknown fields, accessors, class instances, non-plain or polluted objects,
foreign authority, noncanonical counts, zero/negative thresholds, duplicate
identity, duplicate precedence, contradictory direction rules, unsupported
policies, max-plus-one, and altered persisted digests fail closed.

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
- simultaneous mixed outcomes: fail closed.

### Maximum trades per day

- input: canonical integer string `1..1000`;
- count: executed simulated entries only;
- excluded/stopped/filter-excluded trades do not consume a slot;
- reset: verified canonical session partition;
- boundary: the first candidate after the count equals the maximum is skipped.

### Direction only

- input: `long` or `short`;
- comparison: accepted reconstructed-trade direction;
- matching trades preserve observed economics;
- nonmatching trades are excluded without changing later state.

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
