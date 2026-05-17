# Codex Audit Report and Work Order
**Repository:** `traderslink-bot/traderslink-trader-improvement-system`  
**Prepared for:** Codex  
**Prepared on:** 2026-04-16

---

## Executive Summary

This repository is a serious engine first trading analysis system with real architecture, real subsystem boundaries, and much stronger regression coverage than a quick surface read would suggest.

The core foundations are good.

The main repo risk is not raw data modeling, not support and resistance, and not general code organization. The main risk is that the interpretation layer is scaling faster than the compression mechanisms that should keep it maintainable.

In plain terms:
- the factual engine is strong
- the repo structure is strong
- the testing is stronger than expected
- the frontend is intentionally thin
- the main problem is Layer 2 and especially Layer 3 complexity growth

---

## High Level Audit Findings

### 1. Repo Shape and Architecture

The repo tree shows a well separated system across:
- `raw-trade-timeline`
- `support-resistance`
- `pattern-input`
- `pattern-detection`
- `pattern-normalization`
- `pattern-scoring`
- `behavior-analysis`
- `coaching`
- `trader-behavior`
- thin `app` shell on top

This is the shape of a real analysis engine, not a random prototype.

### 2. Strongest Subsystems

#### Raw Timeline Layer

`build-trade-timeline.ts` is a clean factual assembler. It sorts and normalizes inputs, validates, builds execution windows, builds state series, builds timeline segments, and returns a canonical timeline plus warnings only. It does not leak into interpretation or coaching.

`create-raw-trade-timeline.ts` is a strong Layer 1 orchestrator. It:
- normalizes candles and executions
- builds the trade timeline
- derives factual signal families
- attaches support and resistance context
- derives richer factual context after the base result exists
- still avoids scoring and coaching leakage

**Verdict:** strong and worth preserving as is architecturally.

#### Support and Resistance Subsystem

`build-support-resistance-context.ts` is a strong orchestrator. It composes pivots, ladders, merging, filtering, reactions, scoring, gaps, execution level relations, dynamic levels, and sufficiency checks without collapsing those responsibilities into one bloated file.

The support and resistance folder structure is also strong in the tree, including:
- config
- dynamic levels
- filtering
- gaps
- interactions
- ladders
- merge
- pivots
- reference levels
- relations
- scoring
- windowing
- tests

**Verdict:** structurally strong and more mature than the pattern layer first suggested.

#### Detection Layer Boundaries

`detect-patterns.ts` keeps a clean role by consuming `PatternInput` and returning detected patterns without turning into normalization or scoring logic.

**Verdict:** good boundary discipline.

---

## Main Structural Weaknesses

### 1. PatternInput Contract Sprawl

`PatternInput` is becoming too wide and too flat. The current design still respects the boundary rule, but the contract is accumulating too many fields in one surface. That makes pattern code harder to reason about and invites future sprawl.

This is not a reason to throw it out. It is a reason to refactor the flat structure into nested context groups while preserving the same architectural role.

### 2. Pattern Catalog Expansion

The biggest issue in the repo is pattern multiplication, especially in the scaling quality family. Too many named storyline variants are being added, and many are valid but expensive.

This creates:
- more overlap
- more suppression rules
- more test burden
- more maintenance risk
- more near cousin patterns that differ mostly by overlays

### 3. Layer 3 Suppression Debt

`pattern-suppression-rules.ts` is carrying too much manual dominance logic.

It works, but it is expensive and fragile as the catalog grows:
- each new pattern can require many new relationships
- repeated cycle and recovery aware variants amplify rule volume
- future changes become slower and riskier

### 4. Metadata Underpowered for Catalog Size

`pattern-metadata.ts` currently provides rank and role metadata such as family, type, specificity, priority, primary candidacy, and default role.

That is useful, but not enough to replace much of the handwritten suppression burden. It does not yet encode enough semantics such as:
- lane or subfamily
- one cycle versus repeated cycle
- recovery awareness
- support and resistance awareness
- outcome flavor
- broader pattern lineage

Because of that, Layer 3 still has to rely on many manual rules.

---

## Testing and Verification Assessment

Testing is stronger than expected.

### Canonical Verify Scripts
The repo contains dedicated scripts for Layer 2 and Layer 3 verification:
- `verify-layer2-pattern-detection.ts`
- `verify-layer3-pattern-normalization.ts`

These are useful regression checkpoints.

### Pattern Detection Tests
`detect-patterns.test.ts` is large and meaningful. It covers many scenario like inputs across:
- entry
- exit
- scaling
- recovery
- repeated cycle
- support and resistance aware branches

### Pattern Normalization Tests
`normalize-detected-patterns.test.ts` is very large and directly tests:
- primary versus supporting roles
- suppression reasons
- broader versus richer relationships
- repeated cycle behavior
- recovery aware dominance
- canonical expected output behavior

This is strong coverage.

It is also evidence that the normalization model is expensive. The repo is defending the current rule system well, but the size of the test file proves that the rule system is heavy.

### Support and Resistance Tests
Support and resistance is also tested.
- `build-dynamic-levels.test.ts` checks factual VWAP and EMA outputs from normalized candles
- `support-resistance-context.integration.test.ts` confirms that support and resistance data is attached correctly into the raw timeline output

### CI
CI runs:
- install
- tests
- Layer 2 verify
- Layer 3 verify

This is a good minimum bar.

---

## Frontend State

The app layer is still starter level:
- `app/page.tsx` is still the default Next starter page
- `next.config.ts` is still minimal starter config

That is not a problem right now because the system is clearly engine first. It just means the product shell is not yet the mature part of the repo.

---

## Naming Drift

There is still naming drift between `trader-improvement-system` and older `trader-intelligence-v2` references in config comments and related files such as Vitest setup and config comments.

This is not a functionality bug, but it should be cleaned up.

---

## Final Audit Conclusion

This repo should not be rewritten.

The foundations are good.

The next phase should focus on making the interpretation layer easier to carry:
- richer semantic metadata
- less handwritten suppression
- less repetitive pattern composition
- better compression of the pattern catalog

The core engine is worth preserving.  
The interpretation model needs tightening.

---

# Codex Work Order

## Mission

Improve maintainability without weakening the existing engine behavior.

## Session Progress

### 2026-04-16 Phase 1 Completed

- Completed Task 1 by reorganizing `PatternInput` around nested context groups:
  `tradeStructure`, `entryContext`, `exitContext`, `scalingContext`,
  `timingContext`, `supportResistanceContext`, and `recoveryContext`.
- Preserved current behavior with a temporary flat compatibility layer so the
  existing detection, tests, and verification scripts continue to run while
  consumers migrate toward grouped access.
- Completed Task 2 by expanding `PatternMetadata` with semantic fields:
  `lane`, `subFamily`, `journeyScope`, `outcomeFlavor`,
  `isRecoveryAware`, `isSupportResistanceAware`, `broaderPatternIds`,
  and `lineageRoot`.
- Completed Task 3 by adding metadata registry validation and targeted tests
  that fail on missing metadata coverage, invalid semantic enums, duplicate
  ids, or broken broader-lineage references.
- Phase 1 guardrail status:
  `npm test` targeted Phase 1 suites passed,
  `verify:layer2` passed,
  `verify:layer3` passed,
  `npx tsc --noEmit` passed.
- Next active task in exact report order:
  Phase 2 Task 4, reduce Layer 3 manual suppression debt by moving safe cases
  toward metadata-inferred suppression while preserving current normalization
  behavior.

### 2026-04-16 Phase 2 Completed

- Completed Task 4 by separating suppression rules into:
  metadata-inferred broader-lineage dominance
  plus true manual exception rules.
- Kept normalization behavior stable by only inferring dominance pairs that
  were already present in the previous manual rule table.
- Documented the inferred subset directly in
  `pattern-suppression-rules.ts` via exported inferred-rule summaries.
- Completed Task 5 by adding normalization integrity tests that fail on:
  duplicate dominance pairs,
  circular dominance,
  missing suppression references,
  and invalid broader-lineage chains.
- Phase 2 guardrail status:
  targeted normalization tests passed,
  `verify:layer2` passed,
  `verify:layer3` passed,
  `npx tsc --noEmit` passed.
- Next active task in exact report order:
  Phase 3 Task 6, refactor `scaling-quality-patterns.ts` into smaller
  composition-driven files without changing behavior or adding new patterns.

### 2026-04-16 Phase 3 Completed

- Completed Task 6 by moving the large scaling implementation body into a
  dedicated pattern bank and reassembling the exported scaling catalog through
  smaller lane files:
  base setup,
  outcome overlays,
  recovery overlays,
  repeated-cycle overlays,
  support/resistance overlays,
  and final assembly.
- Preserved behavior by keeping the underlying pattern definitions intact and
  adding an assembly guard that fails if any scaling pattern drops out of the
  catalog during refactor.
- Completed Task 7 by adding
  `src/docs/scaling-pattern-redundancy-review-april-16.md`
  as the internal redundancy review requested by the audit.
- Phase 3 guardrail status:
  targeted Layer 2 and Layer 3 tests passed,
  `npx tsc --noEmit` passed.
- Next active task in exact report order:
  Phase 4 Task 8, audit entry-family duplication in the breakout, chase, and
  extension lane, then fix truthful threshold reporting where needed.

### 2026-04-16 Phase 4 Completed

- Completed Task 8 by auditing the breakout, chase, and favorable-extension
  entry lane and confirming that most of the overlap was healthy shared shape,
  not accidental duplication.
- Identified and fixed one real bug:
  `breakout_chase_entry_structure` and
  `overextended_chase_entry_structure` had drifted into effectively identical
  logic even though the catalog treats them as broader-versus-stricter variants.
- Completed Task 9 by centralizing favorable-extension threshold handling and
  making threshold diagnostics truthful again for:
  breakout,
  measured extension,
  late extension,
  disciplined extension,
  breakout chase,
  and overextended chase patterns.
- Phase 4 guardrail status:
  targeted detection and normalization tests passed,
  `npx tsc --noEmit` passed.
- Next active task in exact report order:
  Phase 5 Task 10, add smaller invariant tests that protect normalization
  ordering without relying only on large scenario suites.

### 2026-04-16 Phase 5 Completed

- Completed Task 10 by adding focused normalization invariant tests for:
  single-primary-per-family behavior,
  broader-versus-richer suppression,
  recovery-aware ordering,
  repeated-cycle ordering,
  and support/resistance-aware ordering.
- Completed Task 11 by auditing Layer 1 and support/resistance integration
  boundaries and documenting the result in
  `src/docs/layer-boundary-audit-april-16.md`.
- The boundary audit did not find a material layering violation that required
  code changes. The remaining overlap in PatternInput stays inside the
  aggregation-bridge role described by this report.
- Completed Task 12 by cleaning active naming drift from
  `trader-intelligence-v2` toward `trader-improvement-system` in active package
  metadata and live code/config comments, without rewriting historical docs.
- Phase 5 guardrail status:
  targeted invariant and regression suites passed,
  `npx tsc --noEmit` passed.
- Next active task in exact report order:
  Phase 6 Task 13, create only a lightweight future app-surface plan and do
  not shift implementation effort toward UI.

### 2026-04-16 Phase 6 Completed

- Completed Task 13 by adding `src/docs/future-app-surface-plan.md` as a small
  forward plan for the future app shell while keeping the current session
  strictly focused on engine maintainability.
- Final session verification status:
  `npm test` passed,
  `verify:layer2` passed,
  `verify:layer3` passed,
  `npx tsc --noEmit` passed.
- Final session outcome:
  the interpretation model is now more structured, better described by
  metadata, less dependent on one large manual suppression table, and safer to
  refactor without weakening the existing engine foundation.

### 2026-04-16 PR Review Follow-Up Completed

- Tightened Task 4 further after PR review by removing the old
  "manual match or skip" requirement from the metadata inference builder for
  safe same-family broader-lineage cases.
- Metadata-driven suppression now directly covers:
  legacy-calibrated broader-lineage pairs,
  repeated-cycle overlays,
  recovery overlays,
  support/resistance overlays,
  and other same-family richer journey-scope overlays when metadata proves the
  semantic uplift safely.
- Manual dominance rules remain for cross-family bridges, asymmetric storyline
  jumps, and other cases where richer-vs-broader meaning is still more specific
  than the current metadata model can prove safely.
- Added stronger integrity coverage to fail if metadata inference stops
  producing any true inference-only pairs beyond the legacy manual table.
- Added a TODO note to `PatternInput` describing the eventual removal path for
  the temporary flat compatibility layer once grouped-context migration is
  complete.
- Follow-up guardrail status:
  `npm test` passed,
  `verify:layer2` passed,
  `verify:layer3` passed,
  `npx tsc --noEmit` passed.

### 2026-04-16 Post-Merge Follow-Up PR 1 Completed

- Completed the first narrow post-merge follow-up by fully removing the flat
  `PatternInput` compatibility layer from
  `src/lib/pattern-input/types/pattern-input.ts`.
- Migrated remaining Layer 2 production readers to grouped context access only.
- Migrated the major Layer 2 and Layer 3 test helpers from flat override shape
  to grouped `PatternInputOverrides`, so fixtures and scenario tests no longer
  depend on flat fields.
- Updated the Layer 2 verify loader and the sample PatternInput JSON to use the
  grouped contract directly.
- Removed obsolete conversion paths and helper functions that only existed for
  backward compatibility with the flat contract.
- Added grouped-only builder coverage so the runtime contract is protected from
  reintroducing flat alias fields accidentally.
- Follow-up guardrail status:
  `npm test` passed,
  `verify:layer2` passed,
  `verify:layer3` passed,
  `npx tsc --noEmit` passed.

### 2026-04-16 Post-Merge Follow-Up PR 2 Completed

- Completed the next narrow post-merge follow-up by mechanically splitting
  `src/lib/pattern-normalization/pattern-suppression-rules.ts` into smaller
  Layer 3 registry modules without changing normalization behavior.
- Kept one thin public entrypoint and moved the rule graph into smaller files
  for:
  suppression groups,
  manual entry dominance,
  manual position dominance,
  manual scaling dominance,
  manual exit dominance,
  metadata-inferred dominance assembly,
  and lookup helpers.
- Preserved the current exports and downstream import surface so existing
  normalization code and integrity tests continue to read the same contract.
- Guardrail status after the split:
  `npm test` passed,
  `verify:layer2` passed,
  `verify:layer3` passed,
  `npx tsc --noEmit` passed.

## Non Negotiable Rules

- Preserve current behavior unless a real bug is identified.
- Use existing tests and verify scripts as guardrails.
- Prefer refactor and compression over new pattern creation.
- Do not prioritize frontend or UI work.
- Keep layering strict:
  - raw timeline = factual
  - support and resistance = structural context
  - pattern input = aggregation bridge
  - pattern detection = interpretation only
  - normalization = prioritization and suppression only

---

## Required Work in Exact Order

### Phase 1: Stabilize Architecture Before Adding More Patterns

#### Task 1
Refactor `PatternInput` from one flat god contract into nested context groups while preserving behavior.

**Target outcome**
- same data
- cleaner organization
- no change to detection results
- minimal disruption to existing tests

**Suggested grouping**
- `tradeStructure`
- `entryContext`
- `exitContext`
- `scalingContext`
- `timingContext`
- `supportResistanceContext`
- `recoveryContext`

**Rules**
- do not remove data
- do not change semantics
- update all consumers cleanly
- keep backward compatibility adapters only if absolutely necessary and remove them quickly after migration

#### Task 2
Expand `PatternMetadata` to carry semantic metadata, not just rank and role.

**Add fields such as**
- `lane` or `subFamily`
- `journeyScope` such as `atomic`, `one_cycle`, `repeated_cycle`, `whole_trade`
- `outcomeFlavor` such as `constructive`, `premature`, `fearful`, `defensive`, `failed_protection`, `stop_like`
- `isRecoveryAware`
- `isSupportResistanceAware`
- `broaderPatternIds`
- optional `lineageRoot`

**Rules**
- do not break current normalization behavior yet
- enrich metadata first
- add validation that every pattern has complete metadata

#### Task 3
Build metadata validation tests.

**Add tests that fail if**
- a pattern is missing metadata
- a metadata enum is invalid
- broader pattern references are broken
- pattern IDs are duplicated
- unsupported families or lanes are used

---

### Phase 2: Reduce Layer 3 Rule Debt

#### Task 4
Refactor `pattern-suppression-rules.ts` into:
- metadata inferred suppression
- true manual exceptions

**Goal**
- move as many suppression cases as possible into inference based on richer metadata
- keep explicit rules only for true exceptions

**Rules**
- behavior must remain unchanged initially
- use the current normalization tests as guardrails
- document which manual rules were replaced by inferred logic

#### Task 5
Add normalization integrity tests.

**Add tests for**
- circular suppression detection
- duplicate dominance pairs
- impossible multiple primary conflicts
- missing suppression target references
- conflicting broader lineage chains

---

### Phase 3: Refactor the Scaling Pattern Family

#### Task 6
Refactor `scaling-quality-patterns.ts` into smaller composition driven files.

**Break it into helper lanes such as**
- base scaling setup evaluators
- outcome overlays
- recovery overlays
- repeated cycle overlays
- support and resistance overlays
- final pattern assembly

**Goal**
- reduce repetition
- preserve current behavior
- improve readability and maintainability

**Rules**
- do not add new patterns during this refactor
- do not change naming unless required for correctness
- tests must continue to pass

#### Task 7
Audit the scaling catalog for redundancy.

**Create an internal redundancy review covering**
- likely duplicate semantics
- patterns that differ mainly by overlay
- places where one helper generated family could replace many handwritten variants later

**This task is analysis first, not behavior change.**

---

### Phase 4: Tighten Entry Family Duplication

#### Task 8
Audit and reduce duplication in entry quality patterns, especially the breakout, chase, and extension lane.

**Focus on**
- `breakout_chase_entry_structure`
- `overextended_chase_entry_structure`
- closely related favorable extension variants

**Goal**
- verify whether these are truly distinct or just differently labeled threshold variants
- tighten logic or hierarchy if needed
- preserve output behavior unless a real bug is found

#### Task 9
Fix any threshold reporting mismatches in pattern output.

**Goal**
- ensure diagnostics are truthful
- no mismatch between logic and reported thresholds

---

### Phase 5: Strengthen Testing and Repo Consistency

#### Task 10
Keep the existing regression strength, but add smaller targeted invariant tests so future refactors do not rely only on giant scenario files.

**Add focused tests for**
- single primary per family
- broader versus richer pattern suppression invariants
- recovery aware variants outranking non recovery variants where expected
- repeated cycle variants outranking one cycle variants where expected
- support and resistance aware variants outranking generic variants where expected

#### Task 11
Audit the support and resistance and raw timeline integration boundaries for duplicate derivation logic.

**Goal**
- ensure raw timeline stays factual
- ensure support and resistance stays structural
- ensure pattern input is only the aggregation bridge
- ensure pattern detection does not rebuild lower layer facts

**Deliverable**
- short code audit note listing any duplication found
- refactor recommendations if duplication exists

#### Task 12
Clean naming drift across repo comments, config, and docs where `trader-intelligence-v2` still appears in places that should now reflect `trader-improvement-system`.

**Do not touch historical docs unless needed.**  
Focus on active code and config clarity.

---

### Phase 6: Product Shell Later

#### Task 13
Do not build the real app UI yet.

Only create a lightweight plan for the future app surface after the interpretation refactor is stable.

**Reason**
- the engine is ahead of the frontend
- frontend work now would not address the main repo risk

---

## Acceptance Criteria

Codex is not done until all of the following are true:
- all changed code is coherent and layered correctly
- tests pass
- `verify:layer2` passes
- `verify:layer3` passes
- no new pattern sprawl was introduced during refactor
- metadata coverage is complete for all patterns
- suppression integrity tests are in place
- output behavior remains stable unless an intentional bug fix is documented
- a final summary explains what changed and why

---

## Final Instruction to Codex

Do not restart.  
Do not rewrite the foundation.  
Do not shift focus to UI.  

Preserve the strong core.  
Tighten the interpretation model.  
Make metadata smarter.  
Reduce rule debt.  
Then continue building.
