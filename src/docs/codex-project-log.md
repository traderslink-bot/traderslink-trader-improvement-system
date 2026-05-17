# Codex Project Log

## Purpose

This file is a compact working log for ongoing collaboration in this repo.

It exists to help with:

1. remembering the current practical state of the system
2. tracking major architecture and implementation changes
3. capturing the most important next ideas
4. keeping a concise bridge between the detailed architecture docs and the actual work being done

This file is not meant to replace the deeper layer docs.
It is meant to summarize progress and maintain continuity.

---

## Fast Resume Protocol

If a future session needs to recover context quickly, use this order:

1. Read this file first
2. Read `src/docs/behavior-coverage-audit.md`
3. Read:
   - `src/docs/layer2-pattern-detection/layer2-pattern-detection-overview.md`
   - `src/docs/layer2-pattern-detection/layer2-to-layer3-handoff.md`
   - `src/docs/layer1-raw-data/layer1-handoff-summary.md`
   - `src/docs/trader-feedback-capabilities.md` when the question is about
     what the app can already tell an end user
4. Inspect the current implementation entry points:
   - `src/lib/pattern-input/builders/build-pattern-input.ts`
   - `src/lib/pattern-detection/detect-patterns.ts`
   - `src/lib/pattern-detection/registry/pattern-definitions.ts`
   - `src/lib/pattern-normalization/normalize-detected-patterns.ts`
   - `src/lib/pattern-scoring/builders/build-pattern-scoring-input.ts`
   - `src/lib/pattern-scoring/builders/build-pattern-scoring-result.ts`
   - `src/lib/behavior-analysis/builders/build-behavior-analysis.ts`
   - `src/lib/coaching/builders/build-trade-coaching-output.ts`
   - `src/lib/coaching/builders/build-trade-feedback-from-scoring.ts`
5. Run the fastest verification commands if behavior changed:
   - `npm test`
   - `npm run verify:layer2`
   - `npm run verify:layer3`

This is the intended refresh path.

It should be enough to recover:

- what the system is
- what layer boundaries matter
- what is already implemented
- what the current next work likely is

---

## Collaboration Permission

The user explicitly authorized Codex to flag any doc, plan item, or proposed
feature that seems weak, vague, misleading, or not appropriate for the app,
instead of implementing it blindly.

That permission should carry forward in future sessions.

If a future session disagrees with a documented direction, it should say what
it disagrees with and why.

---

## Project Reminder

This app is a trader-improvement engine.

The core goal is to understand:

- what the trader did
- what the market did
- how those two interacted over time
- which decisions improved the trade
- which decisions damaged the trade

The app is built in layers.

### Layer 1
Raw trade timeline and factual derived signals

### Layer 2
Pattern detection from `PatternInput`

### Layer 3
Pattern normalization and prioritization

### Layer 4+
Scoring, coaching, narrative, and later trader-level intelligence

Important project rule:

- lower layers must stay factual
- higher layers must not bypass lower-layer contracts
- Layer 1 does not coach or judge
- Layer 2 detects structure and events
- Layer 3 decides what matters most

---

## Current Resume Point

### 2026-04-16 Post-Merge Follow-Up Resume Point

The active roadmap branch has shifted from expansion-first work to the
maintainability-first audit order in `src/docs/audit-report-april-16.md`.

The audit-ordered maintainability pass is complete, and the first dedicated
post-merge follow-up PR is now complete too.

Completed in this session:

- Phase 1:
  `PatternInput` now has grouped context sections with a temporary flat
  compatibility layer, and `PatternMetadata` now carries richer semantics plus
  registry validation coverage.
- Phase 2:
  normalization suppression now splits safe metadata-inferred broader-lineage
  dominance from true manual exceptions, with integrity tests guarding the
  rule graph.
- Phase 3:
  the scaling-quality family was split into composition-driven lane files plus
  a final assembly guard, and the redundancy review now lives in
  `src/docs/scaling-pattern-redundancy-review-april-16.md`.
- Phase 4:
  the breakout / chase / extension entry lane was audited, a real bug was
  fixed where `breakout_chase_entry_structure` had collapsed into the same
  logic as `overextended_chase_entry_structure`, and threshold diagnostics were
  made truthful through a shared helper path.
- Phase 5:
  focused normalization invariants were added, layer-boundary audit notes were
  written, and active naming drift was cleaned toward
  `trader-improvement-system`.
- Phase 6:
  the future UI work remains intentionally deferred, with only a lightweight
  plan captured in `src/docs/future-app-surface-plan.md`.

Completed after the merge-ready audit pass:

- The temporary flat `PatternInput` compatibility layer has been fully removed.
- Layer 2 production consumers now read grouped context access only.
- Test helpers, fixtures, and the Layer 2 verify script now use grouped
  `PatternInput` shape directly.
- `buildPatternInput(...)` now returns only the grouped contract, and the
  builder regression test locks that grouped-only runtime shape.
- `pattern-suppression-rules.ts` is now a thin Layer 3 entrypoint with the
  suppression registry split into smaller modules for:
  suppression groups,
  manual entry dominance,
  manual position dominance,
  manual scaling dominance,
  manual exit dominance,
  metadata-inferred dominance assembly,
  and lookup helpers.
- Follow-up verification passed:
  `npm test`,
  `verify:layer2`,
  `verify:layer3`,
  `npx tsc --noEmit`.

Best next step from here:

- keep follow-up PRs narrow
- continue splitting large normalization registries mechanically rather than
  behaviorally, with `pattern-metadata.ts` the next likely compression target
- continue shrinking manual suppression only where metadata can prove richer
  same-lineage dominance safely

Final verification after the full audit pass:

- `npm.cmd test` passed
- `npm.cmd run verify:layer2` passed
- `npm.cmd run verify:layer3` passed
- `npx.cmd tsc --noEmit` passed

PR review follow-up on the same branch is now complete too:

- `pattern-suppression-rules.ts` no longer requires a pre-existing manual pair
  before metadata can infer safe broader-lineage suppression
- metadata-driven suppression now explicitly covers:
  legacy-calibrated broader-lineage pairs,
  repeated-cycle overlays,
  recovery overlays,
  support/resistance overlays,
  and other safe richer journey-scope overlays
- true manual exceptions remain for cross-family bridges and asymmetric
  storyline jumps that metadata still cannot prove safely
- `PatternInput` now carries an explicit TODO note for removing the temporary
  flat compatibility layer after grouped-context migration finishes
- follow-up verification passed again:
  `npm.cmd test`,
  `npm.cmd run verify:layer2`,
  `npm.cmd run verify:layer3`,
  `npx.cmd tsc --noEmit`

Best next step from here:

1. Keep the current maintainability gains stable and use the new metadata,
   invariant tests, and scaling-family structure as the baseline before adding
   more pattern families.
2. When new work resumes, prefer the current roadmap branch already described in
   `src/docs/behavior-coverage-audit.md` and the pattern catalog, but only add
   new interpretation surface if it does not reintroduce rule debt or pattern
   sprawl.

As of `2026-04-14` the repo is no longer just planning the layered architecture.

The practical state is:

- Layer 1 raw trade timeline is implemented with broad derived-signal coverage
- `PatternInput` exists as the Layer 1 -> Layer 2 contract
- Layer 2 pattern detection is implemented across multiple pattern families
- Layer 3 normalization is implemented with priority ordering, suppression, and one-primary-per-family behavior
- Layer 4 scoring is now live as a deterministic scoring, trace, and calibration layer
- the first behavior-analysis bridge now translates scoring truth into named behavior signals
- the first coaching bridge now produces deterministic structured trade-coaching output from behavior truth
- the first trader-level multi-trade profile layer now aggregates recurring behaviors, identity, session pressure, and behavior trends across trades
- the newest Layer 4 work has been strengthening scoring truth, traceability, dominance control, behavior prioritization, one-issue coaching focus enforcement, and trader-level aggregation

This means the current project is best understood as:

not a blank rebuild,
but an actively working layered detection + normalization + scoring system
with the first deterministic behavior/coaching bridge now in place.

### 2026-04-15 Trader-Behavior Modular Extraction Resume Point

The main active maintainability branch is now the safe modular extraction of:

- `src/lib/trader-behavior/builders/build-trader-behavior-profile.ts`

Latest session handoff note:

- `code-updates-april-15.md`
  - use this if a future session wants the detailed list of code/doc changes
    made during the April 15, 2026 chat before returning to the main roadmap

Completed extraction passes so far:

- `src/lib/trader-behavior/builders/profile-aggregation.ts`
  - owns:
    - `aggregatedBehaviors`
    - `behaviorHistory`
    - `mostFrequentWeaknesses`
    - `mostDestructiveBehaviors`
    - `improvingBehaviors`
    - `emergingStrengths`
    - `sessionWeaknesses`
    - `sessionStrengths`
    - `improvingTrends`
    - `deterioratingTrends`
- `src/lib/trader-behavior/builders/profile-confidence-and-identity.ts`
  - owns:
    - `buildProfileConfidence(...)`
    - `buildIdentity(...)`
- `src/lib/trader-behavior/builders/profile-development.ts`
  - owns:
    - `buildDevelopmentPriorities(...)`
    - `buildSessionDevelopmentInsights(...)`
    - `buildDevelopmentPlan(...)`
    - `buildProfileSummary(...)`
- `src/lib/trader-behavior/builders/profile-progress.ts`
  - owns:
    - analysis windows
    - behavior progress windows
    - destructive / improving streak detection
    - relapse / stabilization detection
    - regression / emerging-risk / fading-strength detection
    - progress scoring
    - intervention readiness and priority-effectiveness signals
- `src/lib/trader-behavior/builders/profile-interventions.ts`
  - owns:
    - intervention-period resolution
    - before / during / after intervention evaluation windows
    - intervention effectiveness scoring
    - focus-cycle construction
    - plan-adherence, drift, and mismatch signals
- `src/lib/trader-behavior/builders/profile-adaptive-development.ts`
  - owns:
    - adaptive development planning
    - focus continuation vs rotation decisions
    - protection / de-escalation / escalation prioritization
    - intervention summary construction

Important continuity note:

- the development extraction initially broke the main builder because
  `roundToTwo(...)` was still needed by non-development logic
- that was fixed in the same pass by restoring the shared helper and the still-used
  type imports in the main builder
- the progress extraction then moved the full progress / trend lane into
  `profile-progress.ts`
- the intervention extraction then moved the intervention / focus-cycle lane into
  `profile-interventions.ts`
- `profile-interventions.ts` intentionally reuses the exported progress-window helpers from
  `profile-progress.ts` instead of rebuilding that math in a second place
- the adaptive-planning extraction then moved the focus-rotation / next-focus /
  intervention-summary lane into `profile-adaptive-development.ts`
- the final orchestration cleanup then reduced
  `build-trader-behavior-profile.ts` to a thinner coordinator with:
  - explicit options type
  - ordered-feedback normalization helper
  - computation-vs-assembly separation
- current state after the latest pass:
  - `npm.cmd test -- src/lib/trader-behavior/__tests__/build-trader-behavior-profile.test.ts` passes
  - `npx tsc --noEmit` passes
  - `npm.cmd run build` passes

What still remains in `build-trader-behavior-profile.ts`:

- thin top-level orchestration only

Best next safe extraction step:

1. trader-behavior modular extraction is now functionally complete for this branch
2. avoid reopening the extracted modules unless a regression or real simplification opportunity appears
3. the next decision is whether to:
   - do small maintainability polish only if a concrete pain point appears, or
   - return to broader intelligence-system expansion as the higher-value lane

Current likely next implementation direction if resuming after this chat:

1. do not spend another session on trader-behavior modularization unless a real regression or design pain appears
2. resume higher-value intelligence expansion instead of more structural cleanup
3. use this order for deciding what to build next:
   - read this project log first
   - read `code-updates-april-15.md` for the detailed April 15 session handoff
   - consult `src/docs/behavior-coverage-audit.md`
   - if no regression is found, prefer the broader intelligence-expansion lane already called out in the audit/log:
     richer cross-family lifecycle stories, stronger constructive whole-trade summaries, and stronger exit-side composites

Rule for the next resume:

- do not re-open already completed aggregation / confidence / development passes
  unless a regression is found
- continue from the current modular extraction state, not from the earlier monolith

---

## Current Workspace State

As of the latest local read:

- `src/` contains major in-progress system work that is still uncommitted
- `package.json`, `package-lock.json`, and `tsconfig.json` also have local changes
- `vitest.config.ts` exists as new local test setup work

Important implication:

future sessions should treat the current local workspace,
not old assumptions,
as the source of truth.

Always inspect current files before deciding what is complete.

---

## Why This File Helps

The existing docs already explain the architecture well.

What they do not do as directly is keep one compact running record of:

- what has changed recently
- what is already strong
- what is still missing
- what the next best implementation targets are

So yes, this file is useful.

It should stay concise and practical.

Related focused planning doc:

- `src/docs/behavior-coverage-audit.md`

---

## Current System Read

### Stronger Now

- Layer 1 is no longer just basic raw trade assembly
- Layer 1 now captures much richer factual context around entries, adds, reductions, post-exit behavior, lifecycle milestones, and danger windows
- Layer 2 now includes not only isolated structural patterns but also several management-sequence patterns
- Layer 3 now has real overlap handling, family primary anchoring, canonical regression coverage, and a cleaner contract for later layers

### Still Developing

- richer positive management storylines
- more nuanced multi-step trade-management sequences
- deeper early-exit / missed-opportunity coverage
- more complete risk-management story coverage
- broader entry subtype coverage beyond the first extension vs pullback split

---

## Major Implementation Updates

### Layer 1 Additions

The following new factual builders were added or significantly expanded:

- `build-between-execution-price-behavior-signals.ts`
- `build-reduction-readd-sequence-signals.ts`
- `build-profit-protection-derived-signals.ts`
- `build-partial-exit-outcome-signals.ts`
- `build-entry-context-derived-signals.ts`
- `build-trade-lifecycle-milestone-signals.ts`
- `build-add-context-derived-signals.ts`
- `build-reduction-context-derived-signals.ts`
- `build-post-exit-derived-signals.ts` was expanded with richer full-exit aftermath facts
- `build-danger-window-derived-signals.ts`
- `build-readd-outcome-signals.ts`

Layer 1 now captures stronger factual truth around:

- pre-entry context
- add behavior
- reduction behavior
- reduction to re-add sequences
- profit protection and giveback
- partial-exit aftermath
- re-add aftermath before the next action
- full-exit aftermath
- lifecycle milestones
- danger windows between peak open profit and later drawdown

### PatternInput / Layer 1 to Layer 2 Bridge

`PatternInput` was expanded substantially so Layer 2 can use richer factual aggregates without touching raw timeline objects directly.

PatternInput now includes stronger coverage for:

- entry context
- add context
- reduction context
- re-entry-after-trim context
- post-exit continuation / adverse followthrough
- danger-window facts
- early-adversity-to-recovery facts
- giveback / peak open profit context
- re-add sequence context

### Layer 2 Additions

#### Entry / Exit / Management Patterns

Added or expanded patterns include:

- `entry_after_recent_run_up`
- `entry_after_recent_drop`
- `late_favorable_extension_entry_structure`
- `constructive_pullback_entry_structure`
- `disciplined_favorable_extension_entry_structure`
- `breakout_entry_structure`
- `measured_favorable_extension_entry_structure`
- `overextended_chase_entry_structure`
- `breakout_chase_entry_structure`
- `failed_breakout_entry_structure`
- `weak_pullback_entry_structure`
- `deep_constructive_pullback_entry_structure`
- `deep_weak_pullback_entry_structure`
- `peak_profit_giveback_structure`
- `partial_exit_with_adverse_followthrough`
- `missed_post_exit_continuation`
- `exit_avoided_adverse_followthrough`
- `defensive_exit_after_deterioration`
- `premature_final_exit_after_constructive_management`
- `fearful_exit_after_weakening`
- `revenge_adding_after_weakness`
- `revenge_adding_with_failed_profit_protection`
- `disciplined_defensive_exit`
- `stabilized_recovery_with_constructive_final_exit`
- `stabilized_recovery_with_premature_final_exit`

#### Reduction / Risk Patterns

- `reduction_into_strength`
- `reduction_into_weakness`
- `profit_protection_present`
- `timely_risk_response_after_peak_profit`
- `timely_risk_response_with_profit_protection`
- `failed_profit_protection_structure`
- `reduction_after_recent_run_up`
- `reduction_after_recent_drop`
- `held_through_danger_after_peak_profit`
- `delayed_risk_response_after_peak_profit`
- `delayed_risk_response_with_failed_profit_protection`

#### Scaling / Sequence Patterns

- `readd_after_reduction`
- `adding_above_prior_basis`
- `add_into_strength`
- `add_into_weakness`
- `add_after_recent_run_up`
- `add_after_recent_drop`
- `balanced_scaling_with_profit_protection`
- `constructive_readd_after_reduction`
- `balanced_management_with_constructive_exit`
- `recovery_with_balanced_management_and_constructive_final_exit`
- `balanced_management_with_premature_final_exit`
- `recovery_with_balanced_management_and_premature_final_exit`
- `balanced_management_with_stop_like_forced_exit_after_breakdown`
- `balanced_management_with_stop_like_forced_exit_before_rebound`
- `recovery_with_balanced_management_and_stop_like_forced_exit_after_breakdown`
- `recovery_with_balanced_management_and_stop_like_forced_exit_before_rebound`
- `trim_into_strength_with_constructive_final_exit`
- `timely_profit_protection_with_constructive_final_exit`
- `recovery_with_trim_into_strength_and_constructive_final_exit`
- `recovery_with_timely_profit_protection_and_constructive_final_exit`
- `underutilized_winner_with_constructive_exit`
- `recovery_to_underutilized_winner_with_constructive_exit`
- `underutilized_winner_with_timely_profit_protection_and_constructive_final_exit`
- `recovery_to_underutilized_winner_with_timely_profit_protection_and_constructive_final_exit`
- `underutilized_winner_with_premature_final_exit`
- `recovery_to_underutilized_winner_with_premature_final_exit`
- `underutilized_winner_with_missed_final_continuation`
- `recovery_to_underutilized_winner_with_missed_final_continuation`
- `timely_trim_into_strength_with_constructive_final_exit`
- `recovery_with_timely_trim_into_strength_and_constructive_final_exit`
- `add_into_strength_with_constructive_final_exit`
- `recovery_with_add_into_strength_and_constructive_final_exit`
- `add_into_strength_with_timely_profit_protection_and_constructive_final_exit`
- `recovery_with_add_into_strength_and_timely_profit_protection_and_constructive_final_exit`
- `add_into_strength_with_missed_final_continuation`
- `recovery_with_add_into_strength_and_missed_final_continuation`
- `timely_risk_response_with_stop_like_forced_exit_after_breakdown`
- `timely_risk_response_with_stop_like_forced_exit_before_rebound`
- `recovery_with_timely_risk_response_and_stop_like_forced_exit_after_breakdown`
- `recovery_with_timely_risk_response_and_stop_like_forced_exit_before_rebound`
- `trim_readd_with_constructive_final_exit`
- `trim_readd_with_missed_final_continuation`
- `constructive_recovery_after_early_adversity`
- `recovery_after_early_adversity_with_failed_protection`
- `recovery_after_early_adversity_with_stabilized_management`
- `repeated_trim_readd_with_constructive_management`
- `repeated_trim_readd_with_unstable_management`
- `repeated_rescue_attempts_with_renewed_deterioration`
- `late_chase_reentry_after_constructive_trim`
- `good_pullback_reentry_after_constructive_trim`
- `constructive_reentry_followthrough_after_trim`
- `constructive_reentry_with_constructive_final_exit`
- `constructive_reentry_with_premature_final_exit`
- `constructive_reentry_with_stop_like_forced_exit_after_breakdown`
- `constructive_reentry_with_stop_like_forced_exit_before_rebound`
- `recovery_with_constructive_final_exit_after_constructive_reentry`
- `recovery_with_premature_final_exit_after_constructive_reentry`
- `recovery_with_stop_like_forced_exit_after_constructive_reentry`
- `recovery_with_stop_like_forced_exit_before_rebound_after_constructive_reentry`
- `deteriorating_reentry_after_trim`
- `repeated_trim_readd_with_constructive_reentry_followthrough`
- `repeated_trim_readd_with_deteriorating_reentry`
- `repeated_constructive_reentry_with_premature_final_exit`
- `repeated_balanced_management_with_constructive_final_exit`
- `repeated_balanced_management_with_premature_final_exit`
- `repeated_balanced_management_with_stop_like_forced_exit_after_breakdown`
- `repeated_balanced_management_with_stop_like_forced_exit_before_rebound`
- `repeated_constructive_reentry_with_constructive_final_exit`
- `repeated_constructive_reentry_with_stop_like_forced_exit_after_breakdown`
- `repeated_constructive_reentry_with_stop_like_forced_exit_before_rebound`
- `repeated_deteriorating_reentry_with_defensive_final_exit`
- `repeated_rescue_attempts_with_premature_final_exit_after_constructive_reentries`
- `repeated_rescue_attempts_with_balanced_management_and_premature_final_exit`
- `repeated_rescue_attempts_with_balanced_management_and_constructive_final_exit`
- `repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_after_breakdown`
- `repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_before_rebound`
- `repeated_rescue_attempts_with_constructive_final_exit_after_constructive_reentries`
- `repeated_rescue_attempts_with_stop_like_forced_exit_after_constructive_reentries`
- `repeated_rescue_attempts_with_stop_like_forced_exit_before_rebound_after_constructive_reentries`
- `repeated_rescue_attempts_with_defensive_final_exit_after_deteriorating_reentries`
- `repeated_trim_readd_with_constructive_final_exit`
- `repeated_trim_readd_with_fearful_final_exit`
- `repeated_trim_readd_with_defensive_final_exit_after_deterioration`
- `repeated_rescue_attempts_with_defensive_final_exit_after_deterioration`
- `repeated_trim_readd_with_premature_final_exit`
- `aggressive_adding_with_failed_profit_protection`
- `readd_after_delayed_risk_response`

### Layer 3 Additions

Layer 3 was hardened in several important ways:

- pattern metadata expanded to cover many new Layer 2 patterns
- suppression rules expanded to handle newer management, repeated re-entry, rescue, and richer exit-story overlap
- single-primary-per-family behavior added
- canonical normalization regression tests added
- `primaryPatternsByFamily` added to the normalized output
- `topOverallAnchorPattern` added to the normalized output
- Layer 3 verification script upgraded into a real canonical regression checker

Most recent Layer 3 arbitration tightening focused on:

- richer repeated constructive and deteriorating re-entry storylines beating broader repeated management and final-exit variants
- recovery-aware repeated rescue storylines beating weaker non-recovery repeated variants
- stabilized-recovery exit storylines directly suppressing the broader post-exit descriptors they structurally subsume
- stop-like rebound storylines beating the broader premature-final-exit variants when the exit was genuinely stop-like rather than just early

### Layer 4 Scoring + Feedback Bridge

Layer 4 is now active and split into clear downstream slices.

What is now live:

- scoring input preparation:
  - `PatternScoringInput`
  - `buildPatternScoringInput(...)`
- scoring result building:
  - explicit polarity mapping
  - structural-level weighting
  - normalized-role weighting
  - limited family-aware influence calibration
  - family trace / dominance / suppression reporting
  - scoring stress tests and invariants
- first behavior-analysis bridge:
  - named behavior signals
  - `behaviorPriorityScore`
  - `primaryBehavior`, `secondaryBehaviors`, and `suppressedBehaviors`
  - `behaviorClass`
  - conflict resolution
  - identity-signal candidates
- first coaching bridge:
  - deterministic `fixFirst` / `fixNext`
  - structured evidence-backed coaching output
  - scenario validation for expected behavior/coaching alignment
- first multi-trade intelligence bridge:
  - trader behavior profile aggregation
  - recurring weakness / strength ranking
  - trader identity classification
  - session-segment weakness / strength summaries
  - improving vs deteriorating behavior trends

Important boundary:

- `src/lib/trade-analysis-engine.ts` still stops at Layer 3 on purpose
- scoring, behavior analysis, and coaching are currently downstream consumers, not yet merged into the trade-analysis engine contract

---

## Current Priority View

### Already Strong

- basic trade timeline assembly
- execution sequencing
- position-state tracking
- add / reduce context
- entry subtype coverage around favorable extension vs constructive pullback
- broader entry subtype coverage around constructive continuation vs weak pullback outcomes
- sharper weak-side entry extremes around stretched chase entries and deeper weak pullback entries
- profit-protection context
- post-exit factual context
- family-based Layer 3 normalization
- early sequence-level management failure patterns
- exit-quality storylines around fearful, disciplined defensive, premature, and deterioration-aware exits
- early-adversity recovery and stabilized-recovery storyline coverage
- repeated trim / re-add / re-entry outcome coverage
- recovery-aware repeated rescue plus final-exit storyline coverage
- first positive full-trade constructive storyline coverage
- one-cycle constructive re-entry plus constructive final-exit storyline coverage
- non-readd constructive whole-trade storyline coverage built around timely profit protection
- constructive trim-into-strength whole-trade storyline coverage without needing a re-add cycle
- under-pressed winner constructive storyline coverage
- under-pressed winner timely-protection constructive storyline coverage
- under-pressed winner missed-continuation storyline coverage
- timely trim-into-strength constructive whole-trade storyline coverage
- constructive add-into-strength whole-trade storyline coverage
- constructive add-into-strength timely-protection storyline coverage
- constructive add-into-strength missed-continuation storyline coverage
- deep same-family Layer 3 arbitration inside scaling and exit quality

### Missing And High Priority

- fuller positive management stories that span most of the trade lifecycle beyond the current trim / protect / under-press / add ladder
- more nuanced under-sizing / not-pressing-winners structure beyond the first constructive and timely-protected winner branches
- broader entry subtype coverage beyond the first favorable-extension vs pullback split
- sharper chase-style and weak-pullback extremes above the first entry subtype split
- richer multi-cycle rescue stories beyond the current repeated trim / re-add / re-entry stack
- more cross-family storyline composites that summarize the full management journey

### Later Nice To Have

- more session-aware context
- richer multi-cycle management patterns
- broader canonical sample coverage
- more advanced Layer 3 family arbitration
- Layer 4 scoring once Layers 1-3 feel more complete

---

## Behavior Coverage Snapshot

This section tracks how well the current system covers important trader behaviors.

### Strong

- advantaged vs disadvantaged entry structure
- late favorable extension vs constructive pullback entry subtype coverage
- disciplined favorable extension vs weak pullback entry subtype coverage
- overextended chase vs deep weak pullback extreme-entry subtype coverage
- adding into strength vs adding into weakness
- reduction into strength vs reduction into weakness
- profit protection vs failed profit protection
- post-exit continuation vs adverse followthrough basics
- danger-window risk-response failure basics
- first sequence-level management failure patterns
- fearful vs disciplined defensive vs premature final-exit structure
- stop-like breakdown exits vs fearful or defensive discretionary-style exits
- stabilized recovery with constructive vs premature final exits
- repeated re-entry quality with final-exit outcome structure
- recovery-aware repeated rescue plus final-exit outcome structure
- repeated constructive re-entry with constructive final-exit outcome structure
- trim-into-strength constructive final-exit storyline coverage
- under-pressed winner constructive final-exit storyline coverage
- timely trim-into-strength constructive final-exit storyline coverage
- under-pressed winner premature-final-exit storyline coverage
- add-into-strength premature-final-exit storyline coverage

### Partial

- re-add behavior after reduction
- partial-profit then later deterioration
- balanced constructive management storylines
- constructive trims into strength that still ended well
- deeper rescue / recovery storylines beyond the current recovery-aware repeated stack
- broader cross-family full-trade narratives
- under-sizing / not pressing winners enough

### Weak

- richer good-risk-response sequences
- broader session-aware and context-aware management narratives

### Interpretation

The current system is already much better at detecting:

- failure-side management structure
- risk-response problems
- giveback and danger patterns
- richer exit-quality hierarchy
- recovery-aware repeated rescue and re-entry stories

It is less mature on:

- constructive / positive management stories
- nuanced trade-management story quality across the whole trade lifecycle

Recent addition:

- exit quality now includes `stop_like_forced_exit_after_breakdown` and
  `stop_like_forced_exit_before_rebound`, which use breakdown severity,
  weak-side exit location, capture weakness, and post-exit path to separate
  stop-like exits from broader fearful or defensive discretionary exits
- exit quality now also includes
  `held_through_danger_with_stop_like_forced_exit_after_breakdown`
  `held_through_danger_with_stop_like_forced_exit_before_rebound`
  `delayed_risk_response_with_stop_like_forced_exit_after_breakdown`
  and `delayed_risk_response_with_stop_like_forced_exit_before_rebound`,
  which connect danger-window management failure to stop-like final exits so
  the system can distinguish "never reduced until the break" from
  "responded late, then still got forced out" instead of treating both as
  generic weak exits
- exit quality now also includes
  `stabilized_recovery_with_stop_like_forced_exit_after_breakdown`
  and `stabilized_recovery_with_stop_like_forced_exit_before_rebound`,
  which extend the stabilized-recovery branch into failure-side endings so
  the system can express "recovered from early adversity, then still ended
  in a stop-like weak-side exit" rather than flattening that trade into
  separate recovery and exit fragments
- scaling quality now includes
  `trim_into_strength_with_constructive_final_exit` and
  `recovery_with_trim_into_strength_and_constructive_final_exit`, which add
  constructive trim-into-strength whole-trade stories without requiring a
  later re-add cycle
- entry quality now includes
  `disciplined_favorable_extension_entry_structure` and
  `weak_pullback_entry_structure`, which extend the first extension-vs-pullback
  split into constructive continuation versus weak pullback outcomes
- entry quality now also includes
  `measured_favorable_extension_entry_structure` and
  `deep_constructive_pullback_entry_structure`, which sharpen the positive
  side of that same entry ladder into cleaner continuation and deeper
  pullback-winner subtypes
- entry quality now also includes explicit named breakout families:
  `breakout_entry_structure`,
  `breakout_chase_entry_structure`,
  and `failed_breakout_entry_structure`,
  which move breakout-style behavior beyond indirect proxy coverage
- entry quality now also includes
  `overextended_chase_entry_structure` and
  `deep_weak_pullback_entry_structure`, which sharpen the weak-side extremes
  above the first entry subtype split without pretending we already have full
  breakout/setup labeling
- scaling quality now also includes
  `revenge_adding_after_weakness` and
  `revenge_adding_with_failed_profit_protection`, which turn the older
  weakness-add / failed-protection proxies into explicit named
  averaging-down behavior without pretending trader emotion itself is
  observable
- scaling quality now also includes
  `underutilized_winner_with_constructive_exit` and
  `recovery_to_underutilized_winner_with_constructive_exit`, which turn the
  old raw underutilized-position fact into a real constructive under-pressed
  winner storyline
- scaling quality now also includes
  `timely_trim_into_strength_with_constructive_final_exit` and
  `recovery_with_timely_trim_into_strength_and_constructive_final_exit`,
  which sit above the broader trim-into-strength and timely-protection
  branches when both are structurally true
- scaling quality now also includes
  `timely_profit_protection_with_premature_final_exit` and
  `recovery_with_timely_profit_protection_and_premature_final_exit`, which
  extend the timely-protection branch into early-exit endings so the system
  can distinguish "protected profit in time, but still sold too early" from
  both the broader timely-protection branch and the broader premature-exit
  branch
- scaling quality now also includes
  `trim_into_strength_with_premature_final_exit` and
  `recovery_with_trim_into_strength_and_premature_final_exit`, which extend
  the trim-into-strength branch into early-exit endings so the system can
  distinguish "trimmed well, but still sold too early" from both the broader
  trim-into-strength branch and the broader premature-exit branch
- scaling quality now also includes
  `add_into_strength_with_premature_final_exit` and
  `recovery_with_add_into_strength_and_premature_final_exit`, which extend
  the pressed-winner branch into early-exit endings so the system can
  distinguish "pressed well, but still sold too early" from both the broader
  add-into-strength branch and the broader premature-exit branch
- scaling quality now also includes
  `underutilized_winner_with_premature_final_exit` and
  `recovery_to_underutilized_winner_with_premature_final_exit`, which extend
  the under-pressed winner branch into early-exit endings so the system can
  distinguish "never pressed the winner enough, then still sold too early"
  from both the broader underutilized branch and the broader
  premature-exit branch
- scaling quality now also includes
  `timely_risk_response_with_stop_like_forced_exit_after_breakdown`
  `timely_risk_response_with_stop_like_forced_exit_before_rebound`
  `recovery_with_timely_risk_response_and_stop_like_forced_exit_after_breakdown`
  and `recovery_with_timely_risk_response_and_stop_like_forced_exit_before_rebound`,
  which open a fresher cross-family lane: the trader did react during the
  danger window, but the trade still later ended in a stop-like weak-side
  exit, with separate breakdown-versus-rebound-after-exit outcomes

That means the next best work should probably keep balancing:

- richer failure-side sequence detection
- richer constructive sequence detection
- richer whole-trade journey summaries that combine constructive mid-trade
  management with a later weak finish without only cloning the current
  ladders
- richer cross-family stop-like journeys beyond the first timely-risk-response
  branch

instead of only expanding one side.

---

## Best Next Ideas

These are the strongest next candidates from here:

1. Add richer cross-family trade-journey composites

Examples:

- recovered, managed constructively, then still exited stop-like
- protected profit in time, then still gave back enough to turn the finish
  weak
- constructive build and trim sequence that still ended in a disciplined
  winner or a specific failure mode

Progress:

- the exit lane now includes stop-like journey composites for both
  held-through-danger and delayed-risk-response paths, so the system can say
  whether the forced-feeling exit came from no response at all or from a late
  but insufficient response
- the exit lane now also includes recovery-aware stop-like endings, so it can
  separate "recovered, then later still got forced out" from both the broader
  stabilized-recovery branch and the broader stop-like branch
- the repeated constructive re-entry lane now also includes stop-like
  after-breakdown and before-rebound endings, plus recovery-aware repeated
  rescue counterparts
- Layer 3 now treats the stop-like rebound versions as richer than the
  broader premature-final-exit variants when both are true
- the constructive-management lane now also includes timely-protection
  premature endings, so it can separate "protected well, but still exited too
  early" from both the broader timely-protection branch and the broader
  premature-final-exit branch
- the constructive-management lane now also includes trim-into-strength
  premature endings, so it can separate "trimmed well, but still exited too
  early" from both the broader trim-into-strength branch and the broader
  premature-final-exit branch
- the scaling lane now also includes a broader balanced-management premature
  branch, so it can summarize "managed actively, but still sold too early"
  even when the trade does not cleanly belong to the more specific
  trim/protect/add ladders
- the repeated-cycle scaling lane now also includes a broad constructive
  summary branch, so it can say "this was repeated balanced management that
  still finished constructively" without over-claiming constructive re-entry
  quality when that stronger evidence is not present
- the scaling lane now also includes the broad balanced-management stop-like
  branch, so it can summarize "managed actively, but still later got forced
  out" even when the trade does not cleanly belong to the more specific
  timely-risk-response or re-entry stop-like ladders

2. Add constructive storyline composites

Examples:

- reduced risk during danger window
- trimmed into strength then avoided adverse followthrough
- scaled constructively then protected profit

Progress:

- first constructive storyline pass now includes
  `timely_risk_response_with_profit_protection`
  `constructive_readd_after_reduction`
  and `balanced_management_with_constructive_exit`

- constructive trim-into-strength coverage now also includes
  `trim_into_strength_with_constructive_final_exit`
  and `recovery_with_trim_into_strength_and_constructive_final_exit`

- trim -> re-add -> final exit story coverage has now started with
  `trim_readd_with_constructive_final_exit`
  and `trim_readd_with_missed_final_continuation`

Examples:

- reduced late then re-added then gave back
- trimmed into strength then chased re-entry badly
- partial profit then management deteriorated

3. Expand exit-management coverage

Examples:

- better early-exit / missed continuation variants
- stronger distinction between relief exit vs weak exit vs premature exit

Progress:

- early-exit and defensive-exit coverage now includes
  `defensive_exit_after_deterioration`
  and `premature_final_exit_after_constructive_management`

- fear-vs-discipline exit coverage now also includes
  `fearful_exit_after_weakening`
  and `disciplined_defensive_exit`

5. Add constructive recovery / rescue coverage

Examples:

- recover from early open loss and still protect the trade well
- recover from early adversity but still fail later management

Progress:

- recovery-story coverage now includes
  `constructive_recovery_after_early_adversity`
  and `recovery_after_early_adversity_with_failed_protection`

6. Add multi-cycle management coverage

Examples:

- repeated trim / re-add cycles that still stayed constructive
- repeated trim / re-add cycles that kept destabilizing the trade

Progress:

- multi-cycle storyline coverage now includes
  `repeated_trim_readd_with_constructive_management`
  and `repeated_trim_readd_with_unstable_management`

7. Add sharper re-entry-after-trim coverage

Examples:

- late chase re-entry after a constructive trim
- good pullback re-entry after a constructive trim
- repeated trim / re-add cycles that still ended in a premature final exit

Progress:

- re-entry-after-trim and richer repeated-cycle coverage now includes
  `late_chase_reentry_after_constructive_trim`
  `good_pullback_reentry_after_constructive_trim`
  and `repeated_trim_readd_with_premature_final_exit`

4. Add another coverage-audit pass later

Once a few more storyline composites exist, it will make sense to review:

- what trader behaviors are now represented well
- what behaviors are still underrepresented

---

## Practical System Map

When resuming, these are the most important code entry points.

### Layer 1 Foundation

- `src/lib/raw-trade-timeline/builders/create-raw-trade-timeline.ts`
- `src/lib/raw-trade-timeline/builders/build-trade-timeline.ts`
- `src/lib/raw-trade-timeline/state/build-trade-state-series.ts`

### Layer 1 Derived Signal Expansion

- `src/lib/raw-trade-timeline/derived/build-entry-context-derived-signals.ts`
- `src/lib/raw-trade-timeline/derived/build-add-context-derived-signals.ts`
- `src/lib/raw-trade-timeline/derived/build-reduction-context-derived-signals.ts`
- `src/lib/raw-trade-timeline/derived/build-profit-protection-derived-signals.ts`
- `src/lib/raw-trade-timeline/derived/build-post-exit-derived-signals.ts`
- `src/lib/raw-trade-timeline/derived/build-danger-window-derived-signals.ts`
- `src/lib/raw-trade-timeline/derived/build-reduction-readd-sequence-signals.ts`
- `src/lib/raw-trade-timeline/derived/build-readd-outcome-signals.ts`
- `src/lib/raw-trade-timeline/derived/build-trade-lifecycle-milestone-signals.ts`

### Layer 1 -> Layer 2 Contract

- `src/lib/pattern-input/types/pattern-input.ts`
- `src/lib/pattern-input/builders/build-pattern-input.ts`

### Layer 2 Detection

- `src/lib/pattern-detection/detect-patterns.ts`
- `src/lib/pattern-detection/registry/pattern-definitions.ts`
- `src/lib/pattern-detection/patterns/`

Current Layer 2 families in the repo include:

- execution frequency
- position building
- position reduction
- position structure
- trade duration
- trade excursion
- trade closure
- entry context
- entry quality
- exit quality
- scaling quality

### Layer 3 Normalization

- `src/lib/pattern-normalization/normalize-detected-patterns.ts`
- `src/lib/pattern-normalization/pattern-metadata.ts`
- `src/lib/pattern-normalization/pattern-suppression-rules.ts`
- `src/lib/pattern-normalization/types/normalized-pattern-result.ts`

### Layer 4 Preparation

- `src/lib/pattern-scoring/types/pattern-scoring-input.ts`
- `src/lib/pattern-scoring/builders/build-pattern-scoring-input.ts`
- `src/lib/pattern-scoring/types/pattern-scoring-result.ts`
- `src/lib/pattern-scoring/builders/build-pattern-scoring-result.ts`
- `src/lib/pattern-scoring/builders/build-family-calibration-report.ts`
- `src/lib/behavior-analysis/builders/build-behavior-analysis.ts`
- `src/lib/coaching/builders/build-trade-coaching-output.ts`
- `src/lib/coaching/builders/build-trade-feedback-from-scoring.ts`
- `src/lib/trader-behavior/builders/build-trader-behavior-profile.ts`

---

## Current Testing And Verification Map

The repo already has meaningful regression coverage.

### Main automated checks

- `npm test`
- `npm run verify:layer2`
- `npm run verify:layer3`

### What they protect

- raw timeline and derived-signal builders
- `PatternInput` assembly
- Layer 2 pattern detection behavior
- Layer 3 normalization behavior
- canonical handoff expectations for downstream layers

If a future session changes behavior in Layers 1 to 4,
these checks should be run before claiming the system is still aligned.

---

## 2026-04-14 Layer 4 Resume Instructions

If a future session needs to continue from where this session left off, use this order:

1. Read this section
2. Read:
   - `src/lib/pattern-scoring/builders/build-pattern-scoring-result.ts`
   - `src/lib/pattern-scoring/builders/build-family-calibration-report.ts`
   - `src/lib/behavior-analysis/builders/build-behavior-analysis.ts`
   - `src/lib/coaching/builders/build-trade-coaching-output.ts`
   - `src/lib/coaching/builders/build-trade-feedback-from-scoring.ts`
   - `src/lib/trader-behavior/builders/build-trader-behavior-profile.ts`
3. Read the focused tests:
   - `src/lib/pattern-scoring/__tests__/pattern-scoring-stress.test.ts`
   - `src/lib/behavior-analysis/__tests__/build-behavior-analysis.test.ts`
   - `src/lib/coaching/__tests__/build-trade-coaching-output.test.ts`
   - `src/lib/coaching/__tests__/trade-feedback-scenario-validation.test.ts`
   - `src/lib/trader-behavior/__tests__/build-trader-behavior-profile.test.ts`
4. Treat these truths as stable:
   - scoring is traceable, dominance-aware, and order-independent
   - `scaling_quality` remains the main scoring watchpoint
   - `position_structure` is explicit non-directional structural context in scoring
   - behavior analysis now emits `behaviorPriorityScore`, `behaviorClass`, `primaryBehavior`, `secondaryBehaviors`, `suppressedBehaviors`, and `behaviorIdentityCandidates`
   - coaching now enforces one main directive through `fixFirst`, with optional `fixNext`
   - trade feedback now carries explicit trade context: `tradeId`, `tradeIndex`, `sessionBucket`, and `sessionSegment`
   - trader-level aggregation now exists through `buildTraderBehaviorProfile(...)`
5. Best next Layer 4 work:
   - expand behavior registry coverage beyond the first implemented set
   - widen coaching templates and conflict rules carefully
   - deepen trader-identity coverage beyond the first deterministic identity set
   - expand multi-trade aggregation and recurrence logic beyond the first profile layer

### Latest Trader-Level Update

The trader-level profile layer is now materially beyond the first aggregation pass.

What is now live in `buildTraderBehaviorProfile(...)`:

- hardened profile confidence:
  - `profileConfidence`
  - `profileConfidenceReason`
  - `profileConfidenceSupport`
- stronger recurring-issue prioritization:
  - `developmentPriorities`
  - `developmentPriorityScore`
  - `developmentPriorityReason`
- deterministic trader development planning:
  - `developmentPlan.fixFirst`
  - `developmentPlan.fixSecond`
  - `developmentPlan.protectStrength`
  - `developmentPlan.sessionFocus`
  - `developmentPlan.planReason`
- streak and relapse intelligence:
  - `destructiveStreaks`
  - `improvingStreaks`
  - `relapseSignals`
  - `stabilizationSignals`
- stronger session-specific development output:
  - `sessionDevelopmentInsights`
- reporting-ready summary output:
  - `profileSummary`

Important behavior changes from the earlier first pass:

- trader identity confidence is now capped by profile-level confidence instead of being claimed only from local identity rules
- low sample size now explicitly reduces confidence
- scattered mixed destructive signals now reduce confidence
- repeated high-priority destructive behavior now increases confidence
- recurring mistake ranking is no longer just frequency-led; it now blends frequency, severity, primary-rate, destructive weight, outcome-cost proxy, deterioration pressure, and session concentration
- `topRecurringMistake`, `secondRecurringMistake`, and `improvementPriorityOrder` now follow the stronger development-priority model rather than the old simple weakness order

Latest focused verification command:

- `npm.cmd test -- src/lib/pattern-scoring/__tests__/build-pattern-scoring-input.test.ts src/lib/pattern-scoring/__tests__/build-pattern-scoring-result.test.ts src/lib/pattern-scoring/__tests__/build-family-calibration-report.test.ts src/lib/pattern-scoring/__tests__/pattern-scoring-stress.test.ts src/lib/behavior-analysis/__tests__/build-behavior-analysis.test.ts src/lib/coaching/__tests__/build-trade-coaching-output.test.ts src/lib/coaching/__tests__/trade-feedback-scenario-validation.test.ts src/lib/trader-behavior/__tests__/build-trader-behavior-profile.test.ts`

Latest result:

- `8` files passed
- `41` tests passed

Best next Layer 4 gap after this pass:

- behavior-registry breadth is still the limiting factor
- the new trader-level planning layer is now much stronger, but it can only reason about the behavior ids the single-trade registry already emits

### Follow-up Trader-Level Update

The trader-level layer now also has explicit progress and regression measurement.

What is now live on top of the profile / planning layer:

- deterministic progress scoring:
  - `progressScore`
  - `progressLabel`
  - `progressReason`
  - `progressSupport`
- explicit comparison windows:
  - `analysisWindows.baseline`
  - `analysisWindows.recent`
  - `analysisWindows.fullHistory`
  - `analysisWindows.lowSampleCaution`
- behavior-specific progress tracking:
  - `behaviorProgress`
  - baseline vs recent frequency / severity / primary-rate windows
  - direction / confidence / recurrence-stability output
- broader regression intelligence:
  - `regressionSignals`
  - `emergingRisks`
  - `fadingStrengths`
- intervention-effectiveness foundation:
  - `interventionReadiness`
  - `priorityEffectivenessSignals`
- adaptive planning feedback loop:
  - `adaptiveDevelopmentPlan`
- upgraded summary output:
  - progress headline
  - worsening-risk headline

Important design behavior:

- progress is not a naive average; destructive regression is weighted more heavily than weak positive drift
- low-sample windows now explicitly force caution
- relapse detection remains narrower, while regression intelligence now also catches worsening recurring issues, new destructive behaviors, and fading strengths
- adaptive planning can now keep focus, de-escalate improving issues, and surface escalating risks

Latest focused verification result after this pass:

- `8` files passed
- `46` tests passed

Best next trader-level gap after this follow-up:

- progress and adaptive planning are now real, but they are still behavior-registry limited
- future value will come most from broadening the single-trade behavior set and later tying plan changes to explicit user-selected intervention periods

### Latest Intervention-Aware Trader-Level Update

The trader-development layer now also supports explicit intervention periods and focus cycles.

What is now live:

- explicit intervention-period contracts:
  - `interventionPeriods`
  - explicit `interventionId`
  - target behavior / focus key
  - intervention type
  - goal type
  - start / end trade references
- intervention effectiveness measurement:
  - `interventionEvaluations`
  - before / during / after comparison windows
  - deterministic effectiveness label / score / confidence
- focus-cycle tracking:
  - `focusCycles`
  - `currentFocusCycle`
  - `focusCycleStatus`
- plan adherence / drift intelligence:
  - `planAdherenceSignals`
  - `planDriftSignals`
  - `focusMismatchWarnings`
- intervention-aware adaptive planning:
  - `currentInterventionRecommendation`
  - `shouldContinueFocus`
  - `shouldRotateFocus`
  - `rotationReason`
  - `tooEarlyToJudge`
- reporting-ready intervention summary:
  - `interventionSummary`

Important current assumption:

- explicit intervention periods are passed into `buildTraderBehaviorProfile(...)` as structured input
- the trader-behavior layer resolves them against trade ids / indexes and evaluates them deterministically
- no UI or persistence model is assumed yet; this is the analysis contract and evaluation logic only

Latest focused verification result after this pass:

- `8` files passed
- `51` tests passed

Best next gap after this intervention-aware pass:

- intervention analytics are now explicit, but they still depend on manually supplied intervention periods
- the next likely value is better upstream behavior coverage plus future workflow support for creating and storing those periods cleanly

### Latest Behavior-Registry Coverage Expansion

The next high-value Layer 4 limiter was the single-trade behavior registry, so the latest pass expanded that registry and carried the new coverage all the way through coaching, profile logic, and intervention-aware planning.

New behavior ids now live:

- destructive:
  - `failed_breakout_chasing`
  - `averaging_down`
  - `premature_exit`
  - `undersized_winner`
- strengths:
  - `strong_loss_containment`
  - `strong_winner_management`

Why this exact set was chosen:

- it improves trader-development quality more than adding more neutral structural descriptors
- it adds both mistake-side and strength-side coverage, which matters for adaptive planning and intervention evaluation
- it hardens several real mixed-trade cases the product cares about:
  - good entry but poor winner management
  - weak add quality with disciplined damage control
  - breakout chase that explicitly fails
  - clean winner handling vs under-monetized winners
- it is a better next expansion than adding broader vague buckets, because these behaviors are directly actionable and intervention-targetable

What now flows end-to-end:

- behavior analysis:
  - deterministic detection, classification, priority, and conflict handling for the new behaviors
- coaching:
  - focused templates for each new behavior without collapsing into vague multi-issue advice
- trader profile layer:
  - recurring weakness / strength ranking
  - identity interaction where justified
  - development priorities
  - development plan / adaptive development plan
  - intervention-readiness and intervention-effectiveness signals
- intervention-aware planning:
  - explicit intervention periods can now target the new destructive behaviors and measure before/during performance

Important calibration note:

- descriptive structural context alone still should not emit directional behavior labels
- the new behaviors were wired through directional pattern combinations and conflict rules rather than through neutral structural facts by themselves

Latest focused verification result after this pass:

- `8` files passed
- `61` tests passed

Best next coverage gap after this pass:

- the system is materially stronger on breakout-chase, rescue-add, winner-management, and defensive-containment behavior
- the biggest remaining behavior gap is still broader late-management / overholding / de-risk refusal coverage plus richer add-quality subtyping beyond the current average-down lane

---

## Current Strategic Read

The system is strongest now in:

- factual trade reconstruction
- deterministic structural detection
- failure-side management patterns
- risk-response and giveback coverage
- first sequence-level storyline patterns
- initial Layer 3 prioritization and overlap handling

The system is still developing most in:

- constructive management storylines
- deeper repeated-cycle trim / re-add stories
- richer early-exit and missed-opportunity variants
- stronger full-trade storyline composites
- future scoring / coaching layers that consume the normalized outputs

Recent Layer 1 to Layer 3 update:

- added the first reclaim-entry fact bundle and named reclaim-entry family
- Layer 1 now captures recent pre-entry reference reclaim facts
- Layer 2 now detects `reclaim_entry_structure` and
  `failed_reclaim_entry_structure`
- Layer 3 now prioritizes reclaim stories above broader entry-quality overlap
- Layer 2 now also detects `mean_reversion_entry_structure` and
  `failed_mean_reversion_entry_structure` on top of the deeper pullback plus
  reclaim lane
- Layer 2 now also detects the first honest session-aware setup lane:
  `market_open_breakout_entry_structure`,
  `market_open_breakout_chase_entry_structure`, and
  `failed_market_open_breakout_entry_structure`
- Layer 2 now also detects `market_open_reclaim_entry_structure` and
  `failed_market_open_reclaim_entry_structure`
- Layer 1 now also carries a small true opening-range fact bundle for first
  entry context during `market_open` / `open`
- Layer 2 now also detects `opening_range_breakout_entry_structure`,
  `opening_range_breakout_chase_entry_structure`, and
  `failed_opening_range_breakout_entry_structure`
- Layer 1 now also captures opening-range reclaim facts above the true opening
  range boundary after the initial opening window
- Layer 2 now also detects `opening_range_reclaim_entry_structure` and
  `failed_opening_range_reclaim_entry_structure`
- Layer 2 now also detects `balanced_management_with_missed_final_continuation`
  and `recovery_with_balanced_management_and_missed_final_continuation`
- Layer 2 now also detects
  `repeated_balanced_management_with_missed_final_continuation` and
  `repeated_rescue_attempts_with_balanced_management_and_missed_final_continuation`
- Layer 2 now also detects
  `timely_risk_response_with_defensive_final_exit_after_deterioration`
  and
  `recovery_with_timely_risk_response_and_defensive_final_exit_after_deterioration`
- Layer 2 now also detects
  `balanced_management_with_defensive_final_exit_after_deterioration`
  and
  `recovery_with_balanced_management_and_defensive_final_exit_after_deterioration`
- Layer 2 now also detects `balanced_management_with_fearful_final_exit` and
  `recovery_with_balanced_management_and_fearful_final_exit`
- Layer 2 now also detects
  `repeated_balanced_management_with_defensive_final_exit_after_deterioration`
  and
  `repeated_rescue_attempts_with_balanced_management_and_defensive_final_exit_after_deterioration`
- Layer 2 now also detects `repeated_balanced_management_with_fearful_final_exit`
  and
  `repeated_rescue_attempts_with_balanced_management_and_fearful_final_exit`
- Layer 3 now distinguishes the broader active-management missed-continuation
  storyline from the stricter premature-exit branch instead of flattening both
  into the same balanced-management early-exit summary
- Layer 3 now also carries repeated-cycle and recovery-aware repeated-cycle
  versions of that broad missed-continuation summary above the raw repeated
  trim/re-add ingredients
- Layer 3 now also carries the broader active-management defensive-save
  summary above the raw defensive-exit ingredients and below the stricter
  timely-risk-response and stop-like branches
- Layer 3 now also carries repeated-cycle and recovery-aware repeated-cycle
  versions of that broader active-management defensive-save summary above the
  raw repeated defensive-exit ingredients
- Layer 3 now also carries broad fearful-exit management summaries above the
  raw fearful-exit ingredients and below the stricter stop-like weak-side exit
  branches
- Layer 3 now also expresses the “protected profit in time, but later still
  needed a defensive save” branch instead of flattening it into separate timely
  protection and defensive-exit ingredients
- the system still does not support a full generic opening-range/session
  taxonomy; current session-aware coverage is strongest in the opening-range
  breakout and reclaim lanes plus the earlier broader `market_open` breakout
  and reclaim lanes
- support / resistance should be treated as a near-term Layer 1 design lane,
  but it still needs a short factual-contract pass before implementation so the
  app does not drift into vague level-detection claims
- provider-agnostic candle/session normalization is now an explicit priority
  check for this lane and for the already-built Layer 1-3 work; if hidden
  provider-specific assumptions are found, fixing those takes priority over
  deeper support / resistance feature growth
- that broader code audit has now been run across the current Layer 1-3
  implementation, and the main concrete adjustment was to centralize
  session-bucket normalization into canonical internal labels like
  `market_open`, then apply that normalization in both the top-level raw
  timeline creator and the lower-level timeline builder so future providers do
  not break opening-range and session patterns just by naming sessions
  differently
- the provider boundary is now also harder at the type level: session buckets
  are no longer treated as loose strings inside the normalized Layer 1
  contract, and unknown provider session labels now resolve to an explicit
  `unknown` state instead of leaking arbitrary values upward
- the broader candle contract still looks sound: provider adapters remain
  outside Layer 1 and the current raw candle shape is already provider-agnostic
- EMA / MA context is still useful later, but it is lower-priority than
  support / resistance for trader-facing feedback right now
- the repo now also has a concrete coding bridge for this lane in
  `src/docs/layer1-raw-data/support-resistance-implementation-plan.md`,
  including raw types, PatternInput bridge fields, file layout, and build order

---

## If A Future Session Asks "Where Did We Leave Off?"

The short answer is:

we already moved beyond architecture-only planning,
and we are in the stage of expanding and hardening
the Layer 1 -> Layer 2 -> Layer 3 pipeline.

The most likely next useful work should be one of:

1. pivot to the next strongest genuinely new Layer 1-3 family instead of adding close cousins of the current broad-summary ladders
2. continue the provider/candle-contract audit if any additional hidden session
   or data-availability assumptions appear while support / resistance work grows
3. start the support / resistance lane from the new
   implementation-plan doc by building raw types plus the structural context
   window / reference-level slice
4. if any further hidden provider assumptions are found, treat those fixes as
   immediate priority work before deeper level-engine implementation
5. sharpen Layer 3 arbitration as pattern overlap grows
6. extend verification coverage when new pattern families are added

---

## Working Rules For Future Updates

When this file is updated, prefer:

- high-signal summaries
- major architecture or pattern additions
- concrete next priorities
- one continuity log instead of multiple overlapping mini-logs

Avoid:

- low-value changelog noise
- creating a second incremental changelog file for routine Codex work when this
  project log already captures the meaningful resume state
- repeating the entire detailed architecture
- listing every tiny edit

This file should stay useful and readable.

Default documentation rule:

- use `src/docs/codex-project-log.md` as the running Codex continuity log
- only create a separate `CHANGELOG.md` if the repo later needs a true
  user-facing release history or the user explicitly asks for one

---

## Update Habit

This file should be updated when:

- a meaningful Layer 1 builder is added
- several new Layer 2 patterns are added
- Layer 3 normalization changes materially
- the recommended next priorities change

It does not need to be updated for every tiny edit.

---

## 2026-04-14 Support/Resistance Lane Progress

Support/resistance is now beyond planning and into live Layer 1-3 implementation.

What is now live in Layer 1:

- normalized raw support/resistance types
- structural context window output
- named reference levels:
  - previous day high / low / close
  - premarket high / low / base
- dynamic levels:
  - VWAP
  - EMA 9
  - EMA 20
- first factual pivot detection:
  - tight pivots
  - strict pivots
- first support/resistance ladders
- first merge / touch / reaction / filtering / scoring pass
- first gap-structure detection
- per-execution level relations
- insufficient-candle-data structural flag

What is now bridged into PatternInput:

- first-entry nearest support / resistance prices
- first-entry distance to nearest support / resistance
- first-entry near-support / near-resistance / open-air flags
- first-entry nearest reference-level label
- first-entry VWAP / EMA distance facts
- final-exit support/resistance distance and near-support / near-resistance flags
- reduction counts near support / resistance
- structure-availability flags

What is now live in Layer 2 / Layer 3:

- `entry_near_support_structure`
- `entry_far_from_support_structure`
- `entry_under_resistance_structure`
- `exit_into_support_structure`
- `exit_into_support_with_relief_after_exit`
- `add_into_resistance_structure`

Important current limitation:

- this is an honest first support/resistance-aware slice, not a full breakout-clearance or stacked-resistance engine yet
- the current relation model is strong enough for near-support / under-resistance / exit-into-support patterns
- it is not yet strong enough to claim a full “breakout with room above” family without more relation depth

Best next move from here:

1. deepen the raw factual engine with better merge / touch / reaction quality and richer execution-to-level relations
2. then add the next support/resistance-aware Layer 2 families like:
   - breakout-clearance / room-above patterns once relation semantics are stronger
   - richer add-above-resistance vs add-near-resistance split
   - richer exit-into-support variants beyond the first relief-after-exit branch

### Follow-up Update

That next pass is now partly complete too.

What deepened in the raw engine:

- merge now uses weighted level prices instead of plain averaging
- touch clustering is slightly stricter and less prone to counting one continuous probe as too many clusters
- reactions now consider closes as well as excursion extremes
- execution-level relations now include:
  - whether structure exists on both sides
  - distance between nearest support and resistance
  - room to nearest support / resistance

What broadened in PatternInput:

- first-entry bounded-structure flag
- first-entry support/resistance band width
- first-entry nearest resistance-below clearance facts
- add-level relation counts:
  - adds near support
  - adds near resistance
  - adds above resistance
  - adds below support
- add-level above-resistance-with-room counts
- average add distance to nearest support / resistance
- average add room to next resistance

What new support/resistance-aware Layer 2 patterns are now live:

- `entry_far_from_support_structure`
- `add_into_resistance_structure`
- `exit_into_support_with_relief_after_exit`

### Later Follow-up Update

The next raw-relation tightening pass is now live too.

What deepened in the raw engine:

- execution-level relations now distinguish:
  - nearest resistance below the execution
  - distance above that broken resistance
  - whether the execution truly cleared nearby resistance
  - whether room still existed above after that clearance
- this replaces the older ambiguous "above nearest resistance" idea with a
  cleaner breakout-clearance contract

What changed in PatternInput:

- first-entry resistance-clearance facts:
  - `firstEntryNearestResistanceBelowPrice`
  - `firstEntryDistanceAboveNearestResistanceBelowPct`
  - `firstEntryClearedNearestResistanceBelow`
  - `firstEntryHadRoomAboveAfterClearingResistance`
- add-level separation facts:
- `addsAboveResistanceWithRoomCount`
- `averageAddRoomToNextResistancePct`
- `firstEntryResistanceLevelsAboveWithinClusterCount`
- `firstEntryHasStackedResistanceAbove`
- `finalExitSupportLevelsBelowWithinClusterCount`
- `finalExitHasStackedSupportBelow`

What new support/resistance-aware Layer 2 patterns are now live:

- `breakout_with_room_above_structure`
- `add_above_resistance_structure`
- `breakout_into_overhead_resistance_structure`
- `exit_into_support_before_breakdown`
- `add_above_resistance_with_constructive_final_exit`
- `add_above_resistance_with_failed_profit_protection`
- `recovery_with_add_above_resistance_and_constructive_final_exit`
- `recovery_with_add_above_resistance_and_failed_profit_protection`
- `repeated_adds_above_resistance_with_constructive_final_exit`
- `repeated_adds_above_resistance_with_failed_profit_protection`
- `breakout_with_room_above_and_constructive_final_exit`
- `breakout_with_room_above_and_failed_profit_protection`
- `recovery_with_breakout_with_room_above_and_constructive_final_exit`
- `recovery_with_breakout_with_room_above_and_failed_profit_protection`
- `breakout_into_overhead_resistance_with_defensive_final_exit`
- `breakout_into_overhead_resistance_with_failed_profit_protection`
- `recovery_with_breakout_into_overhead_resistance_and_defensive_final_exit`
- `recovery_with_breakout_into_overhead_resistance_and_failed_profit_protection`
- `exit_into_stacked_support_with_relief_after_exit`
- `exit_into_thin_support_before_breakdown`
- `exit_into_resistance_with_reversal_after_exit`
- `exit_into_resistance_before_breakout`
- `trim_into_resistance_with_constructive_final_exit`
- `trim_into_resistance_with_premature_final_exit`
- `balanced_management_with_take_profit_into_resistance_and_constructive_final_exit`
- `balanced_management_with_take_profit_into_resistance_and_premature_final_exit`
- `stabilized_recovery_with_exit_into_stacked_support_and_relief`
- `stabilized_recovery_with_exit_into_resistance_and_reversal`
- `stabilized_recovery_with_exit_into_resistance_before_breakout`
- `recovery_with_trim_into_resistance_and_constructive_final_exit`
- `recovery_with_trim_into_resistance_and_premature_final_exit`
- `recovery_with_balanced_management_and_take_profit_into_resistance_and_constructive_final_exit`
- `recovery_with_balanced_management_and_take_profit_into_resistance_and_premature_final_exit`
- `stabilized_recovery_with_exit_into_thin_support_before_breakdown`
- `repeated_balanced_management_with_exit_into_stacked_support_and_relief`
- `repeated_balanced_management_with_exit_into_thin_support_before_breakdown`
- `repeated_balanced_management_with_trim_into_resistance_and_constructive_final_exit`
- `repeated_balanced_management_with_trim_into_resistance_and_premature_final_exit`
- `repeated_balanced_management_with_take_profit_into_resistance_and_constructive_final_exit`
- `repeated_balanced_management_with_take_profit_into_resistance_and_premature_final_exit`
- `repeated_rescue_attempts_with_balanced_management_and_exit_into_stacked_support_and_relief`
- `repeated_rescue_attempts_with_balanced_management_and_exit_into_thin_support_before_breakdown`
- `repeated_rescue_attempts_with_balanced_management_and_trim_into_resistance_and_constructive_final_exit`
- `repeated_rescue_attempts_with_balanced_management_and_trim_into_resistance_and_premature_final_exit`
- `repeated_rescue_attempts_with_balanced_management_and_take_profit_into_resistance_and_constructive_final_exit`
- `repeated_rescue_attempts_with_balanced_management_and_take_profit_into_resistance_and_premature_final_exit`

What got cleaner:

- `add_into_resistance_structure` now means crowding into nearby resistance
  rather than mixing together "near resistance" and "already above broken
  resistance"

Best next move from here:

1. keep deepening raw execution-to-level relation quality before adding many more named patterns
2. then add the next honest support/resistance-aware families like:
   - reduction / take-profit into resistance branches beyond the first one-cycle and repeated trim-aware slices
   - deeper breakout-into-stacked-resistance nuance beyond the first branch
   - repeated-cycle support/resistance-aware reduction or add-above-resistance branches if they still add real signal
3. hierarchy reminder:
   - the new `balanced_management_with_take_profit_into_resistance_*` summaries sit above broad balanced-management exits
   - the stricter `trim_into_resistance_*` and `recovery_with_trim_into_resistance_*` branches still outrank those broader summaries when both are present
   - the same hierarchy now applies in the repeated lane: `repeated_*_take_profit_into_resistance_*` summaries sit above broad repeated balanced-management exits, while the stricter repeated `trim_into_resistance_*` branches still outrank them
