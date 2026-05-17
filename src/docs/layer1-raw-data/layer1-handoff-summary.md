# Layer 1 Handoff Summary

Updated: 2026-04-14 America/Toronto

## What Layer 1 Means Now

Layer 1 is not just a raw timeline builder anymore.

It now includes:

- normalized candle and execution ingestion
- raw trade timeline construction
- trade state tracking
- execution context windows
- derived factual trade and execution signals
- session normalization
- support/resistance structural context
- insufficient-data signaling

In repo terms, the active Layer 1 foundation spans:

- `src/lib/raw-trade-timeline/`
- `src/lib/support-resistance/`

## What Layer 1 Produces

The main Layer 1 output is the raw build result:

- `RawTradeTimelineBuildResult`

This now contains more than a simple timeline. It includes:

- timeline structure
- trade state and lifecycle facts
- entry/add/reduction/exit factual context
- post-exit and followthrough facts
- session context
- structural context availability
- support/resistance evidence
- execution-to-level relations

This is the full factual handoff upward.

## Provider Boundary Rule

Layer 1 should consume normalized internal candle and execution contracts.

Provider-specific logic belongs at the source boundary, not inside Layer 1.

Current boundary areas:

- `src/lib/market-data-sources/`
- `src/lib/execution-sources/`

Important note:

the system has already been hardened so session naming is normalized through a
canonical internal session contract rather than relying on ad hoc provider
labels.

## Session and Provider Hardening Already Landed

The main provider-boundary hardening that has already been completed:

- centralized session-bucket normalization
- canonical typed internal session buckets
- explicit `unknown` handling instead of silent session leakage
- normalized session use in the raw timeline builders and entry-context logic

This means future provider swaps should mainly require adapter work rather than
scattered Layer 1-3 edits.

## Support/Resistance Is Now Part Of Layer 1 Truth

Support/resistance is no longer just a plan.

It now contributes factual Layer 1 structure such as:

- structural context windows
- reference levels
- dynamic levels
- pivots
- merged structural levels
- level scoring
- support/resistance ladders
- gaps
- execution-to-level relations

That support/resistance output is still factual.
It should not directly invent final pattern labels on its own.

## Relationship To PatternInput

Layer 1 does not feed pattern detection directly.

The flow is:

1. Layer 1 builds raw factual truth
2. `src/lib/pattern-input/` aggregates the pattern-ready subset
3. Layer 2 detects named patterns
4. Layer 3 prioritizes and normalizes those patterns

Important rule:

Layer 2 should consume `PatternInput`, not bypass Layer 1 and recompute its own
raw structural facts.

## What Is Already Strong

Layer 1 is already strong in:

- deterministic timeline construction
- trade-state tracking
- execution-local and trade-level derived facts
- session normalization
- support/resistance structural evidence
- execution-to-level relation facts

This is already enough to support a large amount of current Layer 2 and Layer 3
behavior detection.

## What Still Needs Ongoing Attention

Layer 1 is not "finished forever."

It should still evolve when:

- a later pattern family needs a new factual contract
- provider differences expose a boundary weakness
- support/resistance relations need deeper structural truth
- insufficient-candle-data handling needs sharper coverage

Current high-signal ongoing concerns:

- keep provider assumptions out of Layer 1 core logic
- keep support/resistance factual and deterministic
- keep insufficient-data handling explicit

## Best Resume Docs For Layer 1 Work

If resuming Layer 1 work, use these first:

1. `src/docs/codex-project-log.md`
2. `src/docs/layer1-raw-data/raw-trade-timeline-layer.md`
3. `src/docs/layer1-raw-data/raw-trade-timeline-layer-files.md`
4. `src/docs/layer1-raw-data/layer1-remaining-raw-detector-roadmap.md`
5. `src/docs/support-resistance-plan.md`
6. `src/docs/layer1-raw-data/support-resistance-implementation-plan.md`

## Short Honest Summary

Layer 1 is now a substantial working factual foundation, not just an early
timeline concept.

The biggest architectural truth to remember is:

- raw timeline and structural context belong in Layer 1
- pattern naming belongs later
- `PatternInput` is the bridge, not the foundation itself
