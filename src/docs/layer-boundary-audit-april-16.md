# Layer Boundary Audit
**Date:** 2026-04-16

## Files Reviewed

- `src/lib/raw-trade-timeline/builders/create-raw-trade-timeline.ts`
- `src/lib/support-resistance/build-support-resistance-context.ts`
- `src/lib/pattern-input/builders/build-pattern-input.ts`
- `src/lib/pattern-detection/detect-patterns.ts`

## Summary

No major lower-layer duplication bug was found in the current raw timeline,
support/resistance, PatternInput, and detection boundaries.

The layering is holding.

## What Looks Clean

- `create-raw-trade-timeline.ts` remains factual orchestration and attaches
  support/resistance output before later PatternInput aggregation.
- `build-support-resistance-context.ts` derives structural levels and
  execution-level relations once, inside the support/resistance lane, instead
  of asking PatternInput or detection to rebuild those facts.
- `build-pattern-input.ts` only compresses existing lower-layer facts into
  detection-ready aggregates; it does not rebuild pivots, ladders, gaps, or
  post-trade structural windows.
- `detect-patterns.ts` still consumes `PatternInput` only and does not reach
  back into the raw timeline or support/resistance builders.

## Minor Duplication To Watch

- `build-pattern-input.ts` recomputes some summary math such as averages,
  counts, and distance rollups from already-built factual signals.
  This is acceptable bridge aggregation, not a boundary violation, but it is
  still the main place where summary duplication can quietly grow if the
  contract keeps widening.

## Recommendation

- Keep lower-layer fact derivation in Layer 1 and support/resistance.
- Keep PatternInput focused on aggregation only.
- If future support/resistance growth adds richer breakout-clearance summaries,
  prefer exposing those as raw factual relation fields first rather than
  recomputing them inside Layer 2 pattern evaluators.
