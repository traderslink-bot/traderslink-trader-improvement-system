# System File Structure

Updated: 2026-04-14 America/Toronto

This doc is the current high-level map of the system. It is meant to answer:

- where raw inputs enter
- where Layer 1 facts are built
- where Layer 2 patterns are detected
- where Layer 3 prioritization happens
- where support/resistance fits
- which docs matter for resuming work

## Top-Level Architecture

The system currently works in these main stages:

1. external provider data and execution-source mapping
2. Layer 1 raw trade timeline and derived structural facts
3. support/resistance structural context
4. pattern input aggregation
5. Layer 2 pattern detection
6. Layer 3 pattern normalization and suppression
7. Layer 4 scoring
8. downstream behavior analysis and coaching support
9. trader-level multi-trade behavior intelligence

## Main Code Folders

### `src/lib/execution-sources/`

Maps execution data from provider-specific formats into the system's internal execution contract.

Key areas:
- `manual/`
- `types/`

Main purpose:
- normalize execution records before they enter Layer 1 timeline building

### `src/lib/market-data-sources/`

Provider adapter boundary for candle data.

Key areas:
- `types/`
- `yahoo/`
- `provider-candle.ts`

Main purpose:
- keep provider-specific candle mapping outside Layer 1/2/3
- convert source-specific candle payloads into the normalized internal candle contract

Important note:
- this is effectively the system's external data boundary, sometimes thought of informally as a Layer 0 concern

### `src/lib/raw-trade-timeline/`

Layer 1 core. Builds the normalized trade timeline and most raw structural facts used later by the system.

Key areas:
- `builders/`
- `derived/`
- `normalizers/`
- `session/`
- `state/`
- `types/`
- `validators/`
- `windows/`
- `debug/`
- `__fixtures__/`
- `__tests__/`

Important files:
- `builders/create-raw-trade-timeline.ts`
- `builders/build-trade-timeline.ts`
- `normalizers/normalize-candle.ts`
- `normalizers/normalize-execution.ts`
- `session/normalize-session-bucket.ts`

Main purpose:
- build the timeline
- normalize candles and executions
- compute raw trade-state and lifecycle facts
- compute entry/add/reduction/exit context
- provide the factual contract used by later layers

### `src/lib/support-resistance/`

Support/resistance engine module.

Main purpose:
- compute structural market context from candles
- stay execution-aware but execution-independent
- feed level relations and structural facts back into Layer 1 / PatternInput

Current role in the architecture:
- this module extends Layer 1 truth rather than replacing it
- it supports level-aware detection like support/resistance-aware entry, add, reduction, and exit patterns

### `src/lib/pattern-input/`

Bridge layer that aggregates Layer 1 raw facts into the single pattern-ready input contract.

Key areas:
- `builders/`
- `types/`

Important files:
- `builders/build-pattern-input.ts`
- `types/pattern-input.ts`

Main purpose:
- convert the larger raw-trade-timeline output into the compact pattern-ready input used by Layer 2

### `src/lib/pattern-detection/`

Layer 2 pattern detection.

Key areas:
- `patterns/`
- `registry/`
- `types/`
- `__tests__/`

Important files:
- `detect-patterns.ts`
- `registry/pattern-definitions.ts`

Pattern family files currently include:
- `entry-context-patterns.ts`
- `entry-quality-patterns.ts`
- `execution-frequency-patterns.ts`
- `exit-quality-patterns.ts`
- `position-building-patterns.ts`
- `position-reduction-patterns.ts`
- `position-structure-patterns.ts`
- `scaling-quality-patterns.ts`
- `trade-closure-patterns.ts`
- `trade-duration-patterns.ts`
- `trade-excursion-patterns.ts`

Main purpose:
- detect named trader-behavior patterns from `PatternInput`

### `src/lib/pattern-normalization/`

Layer 3 normalization and hierarchy.

Key areas:
- `types/`
- `__tests__/`

Important files:
- `normalize-detected-patterns.ts`
- `pattern-metadata.ts`
- `pattern-suppression-rules.ts`

Main purpose:
- prioritize overlapping patterns
- assign primary/supporting/context roles
- apply dominance/suppression rules
- make output cleaner and more user-facing

### `src/lib/pattern-scoring/`

Downstream scoring layer.

Key areas:
- `builders/`
- `types/`
- `__tests__/`

Important files:
- `builders/build-pattern-scoring-input.ts`
- `builders/build-pattern-scoring-result.ts`
- `pattern-polarity-map.ts`
- `types/pattern-scoring-input.ts`
- `types/pattern-scoring-result.ts`

Main purpose:
- prepare normalized Layer 3 output for scoring
- build the first-pass scoring result
- apply explicit polarity mapping and limited family-aware influence calibration
- preserve inspectable contribution details for scoring calibration work
- expose trace, dominance, suppression, and family calibration diagnostics

### `src/lib/behavior-analysis/`

First downstream behavior-truth bridge above scoring.

Key areas:
- `builders/`
- `registry/`
- `types/`
- `__tests__/`

Important files:
- `builders/build-behavior-analysis.ts`
- `registry/behavior-definitions.ts`

Main purpose:
- translate scoring + trace into named behavior signals
- prioritize behaviors by real trade-shaping importance
- classify behaviors into mistake / neutral / improving / edge-style outputs
- emit identity-signal candidates and conflict-aware behavior summaries

### `src/lib/coaching/`

Deterministic structured coaching layer above behavior analysis.

Key areas:
- `builders/`
- `registry/`
- `types/`
- `__tests__/`

Important files:
- `builders/build-trade-coaching-output.ts`
- `builders/build-trade-feedback-from-scoring.ts`
- `builders/validate-trade-feedback-scenario.ts`

Main purpose:
- enforce one primary coaching directive
- build structured trade-coaching output from behavior truth
- validate expected behavior/coaching outcomes in feedback scenarios

### `src/lib/trader-behavior/`

Trader-level multi-trade intelligence layer above single-trade feedback.

Key areas:
- `builders/`
- `types/`
- `__tests__/`

Important files:
- `builders/build-trader-behavior-profile.ts`
- `types/trader-behavior-profile.ts`

Main purpose:
- aggregate trade feedback across many trades
- detect recurring weaknesses and strengths
- classify trader identity from repeated behavior
- summarize session-based weakness/strength pockets
- track improving vs deteriorating behavior trends

## Layer Mapping

### External Data Boundary

Relevant folders:
- `src/lib/market-data-sources/`
- `src/lib/execution-sources/`

Responsibilities:
- provider-specific mapping
- source normalization
- protecting the core system from provider churn

### Layer 1: Raw Trade Timeline

Relevant folders:
- `src/lib/raw-trade-timeline/`
- `src/lib/support-resistance/`

Responsibilities:
- candle/execution normalization
- timeline construction
- session classification
- trade state and lifecycle facts
- support/resistance structural context
- insufficient-data signaling

### Pattern Input Bridge

Relevant folder:
- `src/lib/pattern-input/`

Responsibilities:
- collapse Layer 1 output into the pattern-ready contract

### Layer 2: Pattern Detection

Relevant folder:
- `src/lib/pattern-detection/`

Responsibilities:
- detect all atomic, structural-composite, and storyline-composite pattern families

### Layer 3: Pattern Normalization

Relevant folder:
- `src/lib/pattern-normalization/`

Responsibilities:
- resolve overlaps
- preserve the richer storyline when multiple branches match

### Layer 4: Scoring

Relevant folder:
- `src/lib/pattern-scoring/`

Responsibilities:
- score normalized patterns only
- expose traceable contribution math
- contain family concentration and context stacking conservatively
- make family influence and dominance inspectable

### Behavior / Coaching Bridge

Relevant folders:
- `src/lib/behavior-analysis/`
- `src/lib/coaching/`

Responsibilities:
- convert scoring truth into behavior truth
- prioritize behaviors and resolve conflicts
- generate deterministic structured coaching output
- keep all feedback tied to scoring trace evidence

### Trader-Level Intelligence

Relevant folder:
- `src/lib/trader-behavior/`

Responsibilities:
- aggregate single-trade feedback into trader-level patterns
- rank recurring mistakes and strengths
- derive trader identity labels from repeated behavior
- support future cross-trade coaching and progress tracking

## Main Docs Folders

### `src/docs/layer1-raw-data/`

Layer 1 planning, file maps, implementation notes, and support/resistance planning.

Important docs:
- `raw-trade-timeline-plan.md`
- `raw-trade-timeline-layer.md`
- `raw-trade-timeline-layer-files.md`
- `layer1-remaining-raw-detector-roadmap.md`
- `support-resistance-implementation-plan.md`
- `layer1-handoff-summary.md`

### `src/docs/layer2-pattern-detection/`

Layer 2 planning, catalog, and file references.

Important docs:
- `layer2-pattern-detection.md`
- `layer2-file-structure-reference.md`
- `layer2-implemented-pattern-catalog.md`
- `layer2-to-layer3-handoff.md`

### `src/docs/layer3-pattern-normalization/`

Layer 3 planning and structure notes.

Important docs:
- `layer3-pattern-normalization.md`
- `layer3-file-structure-reference.md`

### Root docs in `src/docs/`

Important shared docs:
- `codex-project-log.md`
- `behavior-coverage-audit.md`
- `trader-feedback-capabilities.md`
- `support-resistance-plan.md`
- `trader-intelligence-system.md`
- `trade-analysis-engine.md`

## Verification Scripts

Located in `src/scripts/`

Current scripts:
- `verify-layer2-pattern-detection.ts`
- `verify-layer3-pattern-normalization.ts`

Main purpose:
- fast regression checks for the sample Layer 2 and Layer 3 flows

## Best Resume Docs

If someone needs to resume work quickly, start here:

1. `src/docs/codex-project-log.md`
2. `src/docs/behavior-coverage-audit.md`
3. `src/docs/trader-feedback-capabilities.md`
4. `src/docs/support-resistance-plan.md`
5. `src/docs/layer1-raw-data/support-resistance-implementation-plan.md`
6. `src/docs/layer2-pattern-detection/layer2-implemented-pattern-catalog.md`

## Honest Status

This doc is now a current high-level structure map, not a line-by-line inventory of every file.

If we ever want a full exhaustive inventory, that should probably live in a separate generated doc, because this file is most useful when it stays readable and architecture-focused.
