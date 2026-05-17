# Scaling Pattern Redundancy Review
**Date:** 2026-04-16

## Scope

This note covers Phase 3 Task 7 from `src/docs/audit-report-april-16.md`.

It is analysis only.

No detection or normalization behavior was changed as part of this review.

## Likely Redundancy Zones

- The `balanced_management_*` family is carrying many outcome overlays that are
  semantically close once recovery-awareness and repeated-cycle overlays are
  added.
- The `add_into_strength_*` family and the
  `timely_profit_protection_*` / `trim_into_strength_*` families repeat a very
  similar shape:
  base management setup
  plus outcome overlay
  plus optional recovery overlay.
- The `constructive_reentry_*` family and the repeated constructive re-entry
  family follow the same composition ladder with mostly suffix-level changes.
- The support/resistance-aware branches mirror the broader non-level-aware
  balanced-management and add-quality ladders closely enough that they look
  like overlay-generated variants rather than fully separate handwritten
  families.

## Patterns That Differ Mainly By Overlay

- `balanced_management_with_constructive_exit`
  vs `recovery_with_balanced_management_and_constructive_final_exit`
  vs `repeated_balanced_management_with_constructive_final_exit`
  vs repeated rescue variants.
- `add_into_strength_with_constructive_final_exit`
  vs `recovery_with_add_into_strength_and_constructive_final_exit`
  vs repeated-cycle relatives.
- `constructive_reentry_with_*`
  vs repeated constructive re-entry outcome variants.
- `trim_into_resistance_with_*`
  vs `balanced_management_with_take_profit_into_resistance_and_*`
  where the main distinction is whether the stricter trim-specific condition is
  present on top of the same support/resistance outcome overlay.

## Helper-Generation Opportunities

- A generic whole-trade outcome overlay builder could own:
  constructive
  premature
  missed continuation
  fearful
  defensive
  stop-like after breakdown
  stop-like before rebound.
- A recovery overlay builder could wrap a base management pattern without
  rewriting the same recovery gate and evidence bundle repeatedly.
- A repeated-cycle overlay builder could wrap the same base families for the
  repeated and repeated-rescue lanes.
- A support/resistance overlay builder could attach the level-aware evidence
  gate to existing management families instead of hand-authoring each
  take-profit-into-resistance or add-above-resistance variant individually.

## Recommended Later Follow-Up

- Do not delete or merge patterns yet.
- Prefer introducing builder-level composition for outcome overlays first.
- After builder composition exists, re-check whether some broad
  `balanced_management_*` variants should remain explicit user-facing patterns
  or become normalization-time summaries derived from a smaller base catalog.
