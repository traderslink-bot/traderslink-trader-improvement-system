# Trader Intelligence System (v2)

Updated: 2026-04-14 America/Toronto

## Overview

This project is a trader-behavior intelligence engine built for intraday,
small-cap, low-float, high-volatility trading.

Its goal is to evaluate:

- what the trader did
- what the market did
- how those interacted over time
- whether the trader's decisions improved or damaged the trade

The system prioritizes:

- truth over appearance
- behavioral accuracy over UI
- execution quality over PnL alone
- structured reasoning over guesswork

## Core Philosophy

Trades are not good or bad by default.

They have to be evaluated through:

- trader actions
- market context
- timing
- decision sequence
- what happened after each decision

That means:

- a risky action can still work
- a normally constructive action can still fail
- a profitable trade can still contain weak behavior
- a losing trade can still contain disciplined execution

## Current System Model

The live system is built from the bottom up.

Each stage depends on the truth quality of the stage below it.

### External Data Boundary

This is the provider and source boundary.

It includes:

- market data source mapping
- execution source mapping
- provider-specific normalization

Current repo areas:

- `src/lib/market-data-sources/`
- `src/lib/execution-sources/`

Design rule:

provider-specific logic must stay here rather than leaking into the core
analysis layers.

### Layer 1: Raw Trade Timeline

Layer 1 is the factual foundation.

It builds the normalized trade timeline and raw structural truth from:

- executions
- candles
- session context
- price movement before, during, and after the trade

It currently includes:

- trade timeline construction
- trade state snapshots
- lifecycle and position-change facts
- entry/add/reduction/exit context
- post-exit followthrough facts
- insufficient-data detection

Current repo areas:

- `src/lib/raw-trade-timeline/`

### Support/Resistance Structural Context

Support/resistance currently extends Layer 1 rather than sitting above it.

This module adds structural market context such as:

- reference levels
- dynamic levels
- level ladders
- execution-to-level relations
- support/resistance-aware entry/add/reduction/exit facts

Current repo area:

- `src/lib/support-resistance/`

Design rule:

the support/resistance engine should remain:

- factual
- deterministic
- execution-aware
- execution-independent

It should not invent final setup labels by itself.

### Pattern Input Bridge

This is the bridge between raw facts and pattern detection.

It collapses the larger Layer 1 output into the compact `PatternInput`
contract.

Current repo area:

- `src/lib/pattern-input/`

### Layer 2: Pattern Detection

Layer 2 detects named patterns from `PatternInput`.

Update: Structural Level Classification

Layer 2 now classifies detected patterns across three structural levels:

- `atomic`
- `structural_composite`
- `storyline_composite`

This is where the system turns raw structural truth into things like:

- chase entry
- breakout entry
- reclaim entry
- failed breakout
- stop-like exit
- profit-protection failure
- support-aware trim into resistance
- repeated rescue attempts

Current repo area:

- `src/lib/pattern-detection/`

### Layer 3: Pattern Normalization

Layer 3 resolves overlap and preserves the richest valid storyline.

It decides things like:

- which patterns are primary
- which patterns are supporting
- which patterns are context only
- which broader patterns should be demoted when a stricter one is present

Current repo area:

- `src/lib/pattern-normalization/`

### Layer 4: Scoring

The repo now contains a real scoring layer after Layer 3.

Current repo area:

- `src/lib/pattern-scoring/`

Current scoring scope:

- scoring input preparation from normalized Layer 3 output
- first-pass trade scoring result building
- explicit pattern polarity mapping
- small family-aware influence calibration where evidence was clear
- inspectable contribution math showing structural weight, role multiplier,
  bonus application, and family influence steps
- family calibration reporting
- dominance / suppression summaries
- stress-test coverage and scoring invariants

### Downstream Behavior And Coaching Bridge

The repo now also contains the first deterministic behavior + coaching bridge
above scoring.

Current repo areas:

- `src/lib/behavior-analysis/`
- `src/lib/coaching/`

Current scope:

- translate scoring + trace into named behavior signals
- prioritize behaviors by trade-shaping importance
- classify behaviors into mistake / neutral / improving / edge-style outputs
- generate one primary coaching directive with structured evidence
- validate scenario expectations for behavior + coaching alignment

Important boundary:

- the trade-analysis engine still stops at Layer 3 on purpose
- scoring, behavior analysis, and coaching are downstream consumers, not part
  of the Layer 1-3 engine contract

### Trader-Level Multi-Trade Intelligence

The repo now also contains the first trader-level aggregation layer above
single-trade feedback.

Current repo area:

- `src/lib/trader-behavior/`

Current scope:

- aggregate behavior frequency, severity, and priority across many trades
- detect recurring weaknesses and strengths
- derive first-pass trader identity labels
- summarize session-segment weaknesses and strengths
- track improving vs deteriorating behavior trends over ordered trades

## What the System Already Does Well

The system is already strong at structural trade-behavior analysis, including:

- entry quality and timing
- chase vs constructive entry structure
- breakout / failed-breakout / reclaim / mean-reversion entry families
- scaling quality
- profit protection vs giveback
- trim / re-add / re-entry behavior
- exit quality
- recovery after adversity
- repeated rescue / repeated deterioration trade journeys
- support/resistance-aware entry, add, reduction, and exit context

This means the app can already support real trader-facing feedback about:

- chasing
- cutting winners early
- bag-holding
- failed profit protection
- stop-like exits
- constructive vs weak scaling
- support/resistance-aware trimming, breakout, and exit behavior

## What the System Does Not Yet Fully Do

The system is still weaker at broader higher-level feedback layers such as:

- broader coaching coverage beyond the current first deterministic behavior set
- broader trader-level identity and recurrence coverage beyond the first profile layer

It is also still incomplete in some detection areas, especially where the data
would require stronger playbook taxonomy or intent inference.

For example:

- emotional intent like true revenge trading is still only partially observable
- broad session/setup taxonomy is still less complete than core structural trade behavior

## Critical Design Rules

### 1. Bottom-up truth first

Higher layers should not outrun the reliability of lower layers.

### 2. Raw truth must stay factual

Layer 1 should build facts, not coaching language or vague judgments.

### 3. Outcomes matter

Actions are not automatically good or bad until later outcome context is known.

### 4. PnL is not enough

Trade quality cannot be reduced to win/loss alone.

### 5. Timeline matters

The system must care about:

- before entry
- after entry
- between executions
- after exit

### 6. Provider boundaries must stay clean

The core system should depend on normalized internal candle and execution types,
not Yahoo-specific or provider-specific payload shapes.

### 7. Support/resistance must stay factual

Level detection should produce structure and relations.
Named setup or behavior claims should happen later in pattern detection.

## Current Status

The project is no longer just at the raw-timeline design stage.

The repo now has:

- provider-boundary normalization
- live Layer 1 raw timeline construction
- live support/resistance structural context
- live PatternInput aggregation
- substantial Layer 2 pattern detection
- substantial Layer 3 normalization and suppression
- verification scripts for Layer 2 and Layer 3

The current active focus has been:

- expanding support/resistance-aware structural truth
- extending support/resistance-aware pattern families
- keeping Layer 3 hierarchy honest as richer storylines are added
- hardening Layer 4 scoring truth, traceability, dominance control, and the
  first scoring -> behavior -> coaching bridge
- building the first multi-trade behavior profile and trader-identity layer

## Best Mental Model

The simplest accurate way to think about the current system is:

1. external sources are normalized
2. Layer 1 builds factual trade and market context
3. support/resistance enriches that factual context
4. `PatternInput` packages it for detection
5. Layer 2 detects named trade-behavior patterns
6. Layer 3 decides which pattern story is the richest valid one
7. Layer 4 scoring decides how much each normalized pattern mattered
8. downstream behavior analysis decides what the trade behavior actually was
9. downstream coaching decides what should be fixed or reinforced first
10. trader-level aggregation decides which behaviors repeat across trades

## Important Supporting Docs

Use this file together with:

1. `src/docs/system-file-structure.md`
2. `src/docs/codex-project-log.md`
3. `src/docs/behavior-coverage-audit.md`
4. `src/docs/trader-feedback-capabilities.md`
5. `src/docs/support-resistance-plan.md`

## Final Goal

The long-term goal is still the same:

the system should be able to say, with high accuracy:

- what the trader did
- what the market did
- which decisions helped
- which decisions hurt
- what patterns were present
- what behaviors repeat over time
- what the trader most needs to improve

But the current repo is now meaningfully past the blueprint stage and already
contains a substantial working Layer 1-3 intelligence core.
