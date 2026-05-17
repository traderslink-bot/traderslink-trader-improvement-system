# Raw Trade Timeline Layer

Updated: 2026-04-14 America/Toronto

## Purpose

This document defines the current Layer 1 foundation of the Trader
Intelligence System.

Layer 1 is responsible for building deterministic, factual trade and market
context from normalized executions and candles.

It is the base truth that later layers depend on.

## Core Rule

Layer 1 must remain:

- deterministic
- factual
- reproducible
- interpretation-free

That means Layer 1 can build structural facts, but it should not:

- label behavior as good or bad
- claim named pattern families
- generate coaching
- infer trader intent

## What Layer 1 Includes Now

Layer 1 is broader than just a raw timeline file.

It currently includes:

1. normalized candle and execution ingestion
2. trade timeline construction
3. trade state tracking
4. execution context windows
5. derived trade and execution facts
6. session normalization
7. support/resistance structural context
8. insufficient-data signaling

In repo terms, Layer 1 currently spans:

- `src/lib/raw-trade-timeline/`
- `src/lib/support-resistance/`

## Layer 1 Inputs

### Execution input

Executions are normalized into the internal execution contract before the raw
timeline is built.

Source boundary:
- `src/lib/execution-sources/`

### Candle input

Candles are normalized into the internal candle contract before the raw
timeline is built.

Source boundary:
- `src/lib/market-data-sources/`

Important rule:

Layer 1 should consume normalized internal data, not provider-specific Yahoo or
future-provider response shapes directly.

## Main Layer 1 Responsibilities

### 1. Timeline construction

Layer 1 combines candles and executions into a chronological trade model.

This includes:

- pre-trade context
- between-execution context
- in-trade state
- post-exit followthrough

Primary files:
- `raw-trade-timeline/builders/create-raw-trade-timeline.ts`
- `raw-trade-timeline/builders/build-trade-timeline.ts`

### 2. Trade state

Layer 1 tracks deterministic state such as:

- position size
- average entry
- realized PnL
- open vs flat state
- state changes across the timeline

Primary files:
- `raw-trade-timeline/state/build-trade-state-series.ts`
- `raw-trade-timeline/types/trade-state-series.ts`
- `raw-trade-timeline/types/trade-state-snapshot.ts`

### 3. Execution context windows

Layer 1 builds localized windows around executions so later derived builders can
reason about what happened around entries, adds, reductions, and exits.

Primary files:
- `raw-trade-timeline/windows/build-execution-context-windows.ts`
- `raw-trade-timeline/types/execution-context-window.ts`

### 4. Derived factual signals

Layer 1 now contains a substantial set of derived builders, including:

- entry context
- add context
- reduction context
- re-add and reduction/re-add structure
- profit-protection context
- danger windows
- execution-local outcomes
- partial-exit outcomes
- post-exit behavior
- trade lifecycle facts
- timeline relationships
- trade-level summary facts

These remain factual outputs, not named pattern claims.

Primary folder:
- `raw-trade-timeline/derived/`

### 5. Session normalization

Layer 1 normalizes session labels into canonical internal session buckets so
provider differences do not leak into higher layers.

Primary file:
- `raw-trade-timeline/session/normalize-session-bucket.ts`

### 6. Support/resistance structural context

Support/resistance now extends Layer 1 truth.

This includes:

- structural context windows
- reference levels
- dynamic levels
- pivots
- merge logic
- touch and reaction measurement
- level scoring
- support/resistance ladders
- gap structure
- execution-to-level relations

Primary entry point:
- `support-resistance/build-support-resistance-context.ts`

Important rule:

The support/resistance module should build structural truth and relations, not
final setup labels by itself.

### 7. Insufficient-data handling

Layer 1 is also responsible for signaling when there is not enough candle data
to build parts of the factual context reliably.

This matters both for:

- internal honesty
- future user-facing feedback like "there was not enough candle data to assess this reliably"

## Main Layer 1 Outputs

The primary Layer 1 output is:

- `RawTradeTimelineBuildResult`

This output now contains more than a simple timeline. It includes:

- timeline structure
- state and lifecycle facts
- execution-local and trade-level derived facts
- session context
- structural context availability
- support/resistance evidence and execution-level relations

This is the complete factual handoff into the next stage.

## Relationship To PatternInput

Layer 1 is not the same as `PatternInput`.

The flow is:

1. Layer 1 builds the full factual result
2. `PatternInput` aggregates the subset needed for pattern detection
3. Layer 2 detects named patterns
4. Layer 3 normalizes and prioritizes those patterns

So Layer 1 is the factual foundation, and `PatternInput` is the bridge.

## What Layer 1 Explicitly Does Not Do

Layer 1 should not:

- detect `breakout_entry_structure`
- detect `stop_like_forced_exit_after_breakdown`
- detect `trim_into_resistance_with_constructive_final_exit`
- decide which pattern is primary
- produce coaching text

Those belong to later layers.

## Why Layer 1 Matters

If Layer 1 truth is weak:

- pattern detection becomes noisy
- normalization becomes misleading
- coaching later becomes untrustworthy

If Layer 1 truth is strong:

- higher layers can stay cleaner
- support/resistance-aware reasoning stays honest
- provider swaps stay safer

## Honest Current Status

Layer 1 is no longer just a planned raw timeline concept.

It is already a substantial working foundation with:

- normalized provider boundaries
- session normalization
- broad derived factual signal coverage
- support/resistance structural context
- tests across the raw timeline and structural-evidence pipeline

That said, Layer 1 is still an active development area whenever the system
needs new factual contracts to unlock stronger later-layer detection.

## Best Supporting Docs

Use this file together with:

1. `src/docs/layer1-raw-data/raw-trade-timeline-layer-files.md`
2. `src/docs/layer1-raw-data/raw-trade-timeline-plan.md`
3. `src/docs/layer1-raw-data/layer1-remaining-raw-detector-roadmap.md`
4. `src/docs/layer1-raw-data/support-resistance-implementation-plan.md`
5. `src/docs/support-resistance-plan.md`
6. `src/docs/system-file-structure.md`

## Next Layer

The next step above Layer 1 is not pattern detection directly.

It is:

- `PatternInput` aggregation in `src/lib/pattern-input/`

That bridge packages the larger Layer 1 truth into the pattern-ready contract
used by Layer 2.
