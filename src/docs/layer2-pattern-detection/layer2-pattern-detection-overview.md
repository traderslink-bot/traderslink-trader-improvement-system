# Layer 2 Pattern Detection Overview

Updated: 2026-04-14 America/Toronto

## Purpose

Layer 2 is the pattern detection layer.

Its job is to transform the normalized `PatternInput` contract into a set of
detected structural patterns.

Layer 2 answers:

- what structural patterns are present in this trade?

It does not answer:

- which pattern matters most
- whether the trade was good or bad overall
- what feedback should be shown to the trader

## Position In The System

The current architecture is:

1. external data boundary
2. Layer 1 factual trade and market context
3. support/resistance structural context
4. `PatternInput` aggregation
5. Layer 2 pattern detection
6. Layer 3 normalization and prioritization
7. downstream scoring / later interpretation

Layer 2 sits after Layer 1 and before Layer 3.

## What Layer 2 Consumes

Layer 2 consumes exactly one input contract:

- `PatternInput`

This is the architecture guardrail.

Pattern detection should not:

- read raw candles directly
- read executions directly
- inspect raw timeline internals directly
- re-derive its own low-level facts from Layer 1 objects

All detection logic should operate on the normalized `PatternInput` bridge.

## Core Design Principles

### 1. Deterministic only

Every pattern must be rule-based and repeatable.

That means:

- explicit conditions
- explicit thresholds
- explainable evidence
- no hidden ranking logic inside detection
- no fuzzy intuition logic

### 2. No scoring

Layer 2 does not assign points, grades, penalties, or severity.

### 3. No coaching

Layer 2 does not generate trader advice, lessons, or narrative.

### 4. Multi-pattern truth is valid

A single trade can legitimately trigger multiple patterns at once.

That is expected.

Resolving overlap is a Layer 3 responsibility, not a Layer 2 responsibility.

## What Layer 2 Produces

Layer 2 produces raw detected patterns.

Those outputs include:

- pattern id
- pattern name
- family
- pattern type
- structural level
- evidence
- thresholds used

This makes the output explainable and usable by Layer 3 without turning Layer 2
into a black box.

## Update: Structural Level Classification

Layer 2 now carries a separate structural-level classification in addition to
the older pattern-type field.

Current structural levels are:

- `atomic`
- `structural_composite`
- `storyline_composite`

This is additive.

It does not change the Layer 2 to Layer 3 boundary, but it does make the live
pattern surface more honest about the difference between:

- narrow structural facts
- setup or structure composites
- richer full-trade storyline composites

## Current Layer 2 Scope

Layer 2 now covers a substantial set of pattern families, including:

- entry context
- entry quality
- execution frequency
- exit quality
- position building
- position reduction
- position structure
- scaling quality
- trade closure
- trade duration
- trade excursion

Important note:

support/resistance-aware detection is now part of the live Layer 2 surface, not
just a future plan.

## PatternInput At This Stage

`PatternInput` has grown far beyond a small early contract.

It now carries enough normalized structure to support detection about:

- execution structure
- trade structure
- position behavior
- price performance
- entry context
- exit context
- timing and pacing
- profit-protection behavior
- re-add / reduction sequences
- recovery and repeated-cycle structure
- support/resistance-aware entry facts
- support/resistance-aware add facts
- support/resistance-aware reduction facts
- support/resistance-aware exit facts
- structural-context availability and insufficiency flags

That means Layer 2 can now detect both broad trader-behavior families and a
meaningful amount of level-aware structure.

## What Layer 2 Already Does Well

Layer 2 is already strong at:

- chase vs constructive entry structure
- breakout / failed breakout / reclaim / mean-reversion families
- trade management and scaling quality
- profit protection vs giveback
- exit quality
- recovery and repeated rescue storylines
- support/resistance-aware entry, add, reduction, and exit patterns

Examples of now-live support/resistance-aware detection include:

- entry near support
- entry under resistance
- entry far from support
- breakout with room above
- breakout into overhead resistance
- add into resistance
- add above resistance
- exit into support
- exit into resistance
- trim into resistance
- broader take-profit-into-resistance summary branches

Update: Support-Aware Pattern Surface

The support-aware Layer 2 surface is now fully reconciled with the current
codebase.

That means the live pattern files, Layer 3 metadata, suppression rules, tests,
and implemented-pattern catalog are aligned on the same support-aware families,
including:

- base support-aware patterns
- recovery-aware variants
- repeated-cycle variants

## What Layer 2 Must Not Do

Layer 2 must not:

- decide which detected pattern is primary
- suppress broader overlap by itself
- score a trade
- generate feedback text
- narrate a trade
- infer emotional intent that the factual contract cannot support

Those belong later.

## Layer 2 File Structure

Layer 2 spans two major areas:

1. the `PatternInput` bridge
2. the pattern detection engine itself

Current code areas:

```text
src/lib/pattern-input/
  types/
    pattern-input.ts
  builders/
    build-pattern-input.ts

src/lib/pattern-detection/
  detect-patterns.ts
  types/
    pattern-detection-types.ts
  registry/
    pattern-definitions.ts
  patterns/
    execution-frequency-patterns.ts
    position-building-patterns.ts
    position-reduction-patterns.ts
    position-structure-patterns.ts
    trade-duration-patterns.ts
    trade-excursion-patterns.ts
    trade-closure-patterns.ts
    entry-context-patterns.ts
    entry-quality-patterns.ts
    exit-quality-patterns.ts
    scaling-quality-patterns.ts
```

## Relationship To Layer 3

Layer 2 intentionally returns all true patterns.

Layer 3 then decides:

- which patterns are primary
- which are supporting
- which are contextual
- which broader branches should be demoted under richer ones

That separation is one of the most important architecture protections in the
repo.

## Honest Current Status

Layer 2 is no longer an early proof-of-concept.

It is already a substantial working detection layer with:

- broad core trade-behavior coverage
- explicit setup-aware entry families
- repeated-cycle and recovery-aware families
- meaningful support/resistance-aware detection

It is still growing, but it is already a real production-shaped layer rather
than a sketch.

## Best Related Docs

Use this file together with:

1. `src/docs/layer2-pattern-detection/layer2-file-structure-reference.md`
2. `src/docs/layer2-pattern-detection/layer2-implemented-pattern-catalog.md`
3. `src/docs/layer2-pattern-detection/layer2-to-layer3-handoff.md`
4. `src/docs/behavior-coverage-audit.md`
5. `src/docs/trader-feedback-capabilities.md`

## Short Summary

Layer 2 should be thought of as:

- strict
- deterministic
- pattern-focused
- multi-truth preserving
- dependent on `PatternInput`
- intentionally separated from scoring, coaching, and final prioritization
