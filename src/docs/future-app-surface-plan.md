# Future App Surface Plan
**Date:** 2026-04-16

## Current Rule

Do not build the real app UI yet.

The engine refactor still matters more than frontend expansion.

## Minimal Future Surface

1. Upload and validation shell
2. Single-trade analysis run view
3. Pattern normalization summary
4. Scoring and coaching output
5. Trader-profile history later

## UI Principles For Later

- Keep the first app surface thin over the existing engine contracts.
- Show factual timeline context separately from interpreted patterns.
- Keep support/resistance context visually secondary to the main trade story.
- Do not let UI-specific shaping leak back into Layer 1 through Layer 3.

## Preconditions Before Building It

- PatternInput migration fully settled
- suppression debt materially reduced
- scaling and entry-family duplication tightened
- invariant tests stable enough that frontend work does not mask engine regressions
