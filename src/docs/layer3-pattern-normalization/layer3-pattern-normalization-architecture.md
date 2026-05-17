# Layer 3 Pattern Normalization Architecture

Updated: 2026-04-14 America/Toronto

## Purpose

Layer 3 transforms raw Layer 2 detected patterns into a cleaner, prioritized,
and more usable structure.

Layer 2 answers:

- what is true?

Layer 3 answers:

- what matters most?
- which overlapping truths are primary vs supporting vs contextual?

## Position In The System

The current architecture is:

1. external data boundary
2. Layer 1 factual trade and market context
3. support/resistance structural context
4. `PatternInput` aggregation
5. Layer 2 pattern detection
6. Layer 3 normalization and prioritization
7. downstream scoring / later interpretation

Layer 3 is strictly downstream of Layer 2.

## What Layer 3 Consumes

Layer 3 consumes only:

- `PatternDetectionResult`

That means Layer 3 should not access:

- raw candles
- executions
- raw timeline objects
- `PatternInput`

If Layer 3 appears to need raw data, the missing contract likely belongs in
Layer 1 or Layer 2 instead.

## What Layer 3 Produces

Layer 3 produces normalized pattern output that includes concepts such as:

- primary patterns
- supporting patterns
- contextual patterns
- prioritized full pattern order
- patterns grouped by family
- one primary anchor per family
- one top overall anchor pattern

In practice, Layer 3 is the bridge between "all true detected patterns" and
"the clearest usable structural story."

## Core Responsibilities

### 1. Attach metadata

Layer 3 reads metadata for each detected pattern such as:

- specificity rank
- default priority
- whether it can be primary
- default role

This metadata lives in:

- `src/lib/pattern-normalization/pattern-metadata.ts`

### 2. Sort deterministically

Layer 3 sorts detected patterns using a stable deterministic order.

Current ordering logic is based on:

- default priority
- specificity rank
- pattern type rank
- pattern id as stable tie-breaker

This keeps the normalization process reproducible.

### 3. Apply suppression and dominance rules

Layer 3 uses explicit suppression and dominance rules to demote broader or
weaker overlaps when richer patterns are present.

This rule system already exists and is central to the current architecture.

It lives in:

- `src/lib/pattern-normalization/pattern-suppression-rules.ts`

This is not a future enhancement anymore.
It is one of the core mechanisms Layer 3 already depends on heavily.

### 4. Classify normalized roles

Layer 3 assigns normalized roles such as:

- `primary_candidate`
- `supporting_candidate`
- `context_only`

This preserves information without letting all overlapping truths compete as if
they were equally important.

### 5. Enforce a single primary per family

Layer 3 keeps one primary family anchor where appropriate so later layers do
not need to re-solve same-family competition themselves.

### 6. Build grouped and ordered outputs

Layer 3 groups patterns by family and also produces a fully prioritized order.

That makes downstream layers simpler and more consistent.

## Design Principles

### Deterministic

Same detected input should always produce the same normalized result.

### Metadata-driven

Layer 3 should use metadata and explicit rules, not scattered hidden
assumptions.

### Non-destructive

Layer 3 should demote or reclassify overlap, not blindly delete useful truth.

### Structural, not narrative

Layer 3 should not become a coaching or storytelling layer.

It organizes structure.
It does not yet explain it to the user in human coaching language.

## What Layer 3 Must Not Do

Layer 3 must not:

- re-detect patterns
- create new threshold-based detection logic
- access raw trade or candle data
- score trades
- generate coaching
- generate narrative summaries

Those belong elsewhere.

## Main Code Files

### `pattern-metadata.ts`

Central metadata registry for implemented patterns.

Responsibilities:

- define default priority
- define specificity
- define primary eligibility
- define default normalized role

### `pattern-suppression-rules.ts`

Central rule registry for overlap handling and richer-vs-broader dominance.

Responsibilities:

- suppression groups
- explicit dominance rules
- soft demotion outcomes

### `normalize-detected-patterns.ts`

Layer 3 normalization engine.

Responsibilities:

- attach metadata
- sort patterns
- apply demotions
- enforce one primary per family
- build grouped and prioritized outputs

## Why Layer 3 Matters

Without Layer 3:

- later scoring becomes noisy
- coaching becomes contradictory
- multiple overlapping truths compete without structure
- support/resistance-aware richer stories can get buried under broader branches

Layer 3 is what lets the system preserve truth while still presenting a cleaner
and more useful result.

## Current Reality Of Layer 3

Layer 3 is no longer an early prioritization sketch.

It now has:

- a large metadata registry
- substantial explicit dominance logic
- broad same-family and cross-family suppression handling
- heavy use across entry, exit, scaling, recovery, repeated-cycle, and
  support/resistance-aware branches

That means Layer 3 is already a mature architectural layer in this repo, not a
future placeholder.

## Honest Current Tension

The main Layer 3 challenge is not "whether we need overlap logic."

We already do.

The real challenge is:

- keeping hierarchy honest as new richer branches are added
- preventing broader summary branches from incorrectly outranking stricter local
  structures
- keeping the rule set understandable as the pattern surface grows

That is why metadata discipline and explicit rule clarity matter so much here.

## Best Related Docs

Use this file together with:

1. `src/docs/layer3-pattern-normalization/layer3-file-structure-reference.md`
2. `src/docs/layer2-pattern-detection/layer2-to-layer3-handoff.md`
3. `src/docs/layer2-pattern-detection/layer2-implemented-pattern-catalog.md`
4. `src/docs/codex-project-log.md`
5. `src/docs/behavior-coverage-audit.md`

## Short Summary

Layer 2 preserves all true detected patterns.

Layer 3 turns that raw truth set into:

- ranked
- grouped
- role-classified
- overlap-resolved
- downstream-usable structure

It is the architectural bridge between detection and later interpretation.
