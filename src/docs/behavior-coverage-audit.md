# Behavior Coverage Audit

## Purpose

This file is a focused audit of behavior coverage across Layers 1-3.

It is meant to answer:

1. which trader behaviors are already covered well
2. which are only partially represented
3. which still need better factual support, pattern coverage, or normalization
4. what the best next implementation targets are

This is not a full architecture doc.
It is a planning and calibration doc.

---

## Current Read

The system is now much stronger at:

- entry structure
- add / reduce context
- profit-protection structure
- danger-window risk response
- post-exit continuation vs post-exit relief
- first sequence-level trade-management storylines
- first rescue / stabilized-recovery storylines
- first positive full-trade constructive management storylines
- timely profit-protection plus constructive final-exit storylines without trim/re-add requirements
- timely profit-protection plus premature-final-exit storylines without trim/re-add requirements
- constructive trim-into-strength plus constructive final-exit storylines without trim/re-add requirements
- trim-into-strength plus premature-final-exit storylines without trim/re-add requirements
- under-pressed winner plus constructive final-exit storylines
- under-pressed winner plus timely profit-protection plus constructive final-exit storylines
- under-pressed winner plus missed final-continuation storylines
- timely trim-into-strength plus constructive final-exit storylines
- constructive add-into-strength plus constructive final-exit storylines
- constructive add-into-strength plus timely profit-protection plus constructive final-exit storylines
- constructive add-into-strength plus missed final-continuation storylines
- first deterministic behavior-priority and coaching-ready interpretation for:
  - chasing
  - adding into weakness
  - adding into strength
  - poor profit protection
  - strong profit protection
  - flip-flopping
  - overtrading
  - structured execution

The system is still less mature at:

- positive management stories that span most of the trade
- richer cross-family exit journeys beyond the new stop-like branch
- trade stories that combine trim, re-add, giveback, and final outcome across multiple cycles
- broader named behavior coverage beyond the first coaching-ready set

---

## Coverage Map

### Strong

- advantaged vs disadvantaged entry structure
- entry after recent run-up vs recent drop
- late favorable extension entry vs constructive pullback entry
- disciplined favorable extension entry vs weak pullback entry
- measured favorable extension entry vs deep constructive pullback entry
- overextended chase entry vs deep weak pullback entry
- explicit breakout entry vs breakout chase vs failed breakout entry
- explicit reclaim entry vs failed reclaim entry
- explicit mean-reversion entry vs failed mean-reversion entry
- first market-open breakout entry vs market-open breakout chase vs failed market-open breakout entry
- first market-open reclaim entry vs failed market-open reclaim entry
- add into strength vs add into weakness
- add after recent run-up vs add after recent drop
- reduction into strength vs reduction into weakness
- profit protection vs failed profit protection
- held through danger vs delayed risk response after peak profit
- delayed risk response with later re-add failure
- missed post-exit continuation vs adverse post-exit followthrough basics
- fearful exits vs disciplined defensive exits
- constructive recovery vs recovered-then-failed-protection basics
- stabilized recovery after early adversity
- stabilized recovery with constructive vs premature final exits
- stabilized recovery with stop-like final-exit outcomes
- trim -> re-add -> constructive final exit
- trim -> re-add -> missed final continuation
- repeated trim -> re-add with constructive vs fearful final exits
- repeated trim -> re-add with defensive-save outcomes after deterioration
- re-entry-after-trim setup vs post-reentry followthrough quality
- one-cycle constructive re-entry quality combined with constructive final-exit outcome quality
- repeated re-entry-after-trim setup vs post-reentry followthrough quality
- repeated re-entry quality combined with final-exit outcome quality
- recovery-aware repeated re-entry quality combined with final-exit outcome quality
- repeated constructive re-entry quality combined with constructive final-exit outcome quality
- timely profit-protection quality combined with constructive final-exit outcome quality
- timely profit-protection quality combined with premature-final-exit outcome quality
- trim-into-strength quality combined with constructive final-exit outcome quality
- trim-into-strength quality combined with premature-final-exit outcome quality
- underutilized winner quality combined with constructive final-exit outcome quality
- underutilized winner quality combined with timely profit-protection plus constructive final-exit outcome quality
- underutilized winner quality combined with premature-final-exit outcome quality
- underutilized winner quality combined with missed final-continuation outcome quality
- timely trim-into-strength quality combined with constructive final-exit outcome quality
- add-into-strength quality combined with constructive final-exit outcome quality
- add-into-strength quality combined with timely profit-protection plus constructive final-exit outcome quality
- add-into-strength quality combined with premature-final-exit outcome quality
- add-into-strength quality combined with missed final-continuation outcome quality
- timely risk-response quality combined with stop-like forced-exit after-breakdown outcome quality
- timely risk-response quality combined with stop-like forced-exit before-rebound outcome quality
- recovery-aware timely risk-response quality combined with stop-like forced-exit after-breakdown outcome quality
- recovery-aware timely risk-response quality combined with stop-like forced-exit before-rebound outcome quality
- constructive re-entry quality combined with premature-final-exit outcome quality
- recovery-aware constructive re-entry quality combined with premature-final-exit outcome quality
- constructive re-entry quality combined with stop-like forced-exit after-breakdown outcome quality
- constructive re-entry quality combined with stop-like forced-exit before-rebound outcome quality
- recovery-aware constructive re-entry quality combined with stop-like forced-exit after-breakdown outcome quality
- recovery-aware constructive re-entry quality combined with stop-like forced-exit before-rebound outcome quality

### Partial

- constructive re-add quality
- constructive risk response quality
- balanced management storylines
- constructive trim-into-strength storylines are now in place, but broader constructive management coverage is still incomplete
- richer repeated trim / re-add rescue storylines beyond the current recovery-aware repeated stack
- richer repeated-cycle final-outcome storylines beyond the current constructive/deteriorating branches
- deeper rescue stories where management improved mid-trade and later still needed a defensive save
- first re-entry-after-trim subtypes beyond the current chase vs pullback and followthrough split
- broader entry/setup coverage beyond the new explicit breakout, reclaim, mean-reversion, opening-range breakout/reclaim, and first market-open breakout/reclaim families
- stop-like forced-exit quality beyond the new management-aware, recovery-aware, timely-risk-response, repeated balanced-management, and repeated constructive re-entry whole-trade branches
- partial-profit then later deterioration is now stronger through the new
  timely-profit-protection plus defensive-final-exit storyline, but broader
  variants still remain
- broad active-management defensive-save summaries are now in place for the
  one-cycle, repeated-cycle, and recovery-aware lanes
- broad active-management fearful-exit summaries are now in place for the
  one-cycle, repeated-cycle, and recovery-aware lanes
- support / resistance remains an important future Layer 1 context family, but
  it should start with a short factual design pass before implementation
- EMA / MA context still looks useful later, but it is a lower-priority
  enhancement than support / resistance
- under-sizing / not pressing winners enough beyond the current constructive, timely-protected, premature-exit, and missed-continuation under-pressed winner branches
- positive management narratives that span the whole trade lifecycle beyond the first constructive whole-trade branch
- positive management narratives that span the whole trade lifecycle beyond the first timely-protection, trim-into-strength, under-pressed-winner, add-into-strength, and balanced-management summary branches, including the new recovery-aware broad constructive summary

### Weak

- richer multi-cycle trim / re-add / trim / re-add stories
- broader session-aware management narratives

---

## What Is Missing By Layer

### Layer 1

Layer 1 is no longer the main bottleneck, but a few factual gaps still matter:

- richer multi-cycle sequence facts
- richer per-reduction and per-readd outcome windows
- clearer recovery-window facts after early weakness
- stronger differentiation between immediate deterioration and gradual deterioration

Small recent Layer 1 improvement:

- added factual post-readd outcome windows so the system now captures what price did after a true re-add before the next trader action

### Layer 2

Layer 2 is the main current opportunity.

What it still wants most:

- better constructive multi-step management stories
- better failure-side trim -> re-enter -> lose-structure stories
- broader recovery / rescue management stories
- richer repeated-cycle storyline variants
- broader rescue stories where repeated re-entry quality and final-exit quality interact
- more constructive whole-trade management branches beyond the current protect / trim / under-press / add ladder, its paired premature-end variants, the timely-risk-response stop-like journey branch, and the repeated constructive re-entry stop-like journey branch
- broader active-management missed-continuation storylines beyond the new balanced-management summary, its recovery-aware counterpart, and the new repeated-cycle broad summaries
- broader whole-trade management summaries that sit above the local trim / protect / add ladders beyond the new balanced-management constructive, premature, stop-like, repeated constructive-summary, repeated premature-summary, and repeated stop-like-summary branches

### Layer 3

Layer 3 is in good shape, but will need more family arbitration as the storyline set grows:

- stronger cross-family storyline arbitration after the newer same-family scaling and exit tightening
- maybe later cross-family storyline clustering

---

## Best Next Implementation Targets

### Highest Value

1. Positive full-trade management storylines

Why:

- failure-side and repeated rescue coverage are now much stronger
- the biggest balance gap is still broader constructive management narratives that span most of the trade lifecycle beyond the current timely-protection, trim-into-strength, under-pressed-winner, and add-into-strength branches

2. Broader setup coverage beyond breakout, reclaim, mean reversion, the first opening-range breakout/reclaim lanes, and the first market-open setup lanes

Why:

- the entry family is stronger now, and the next highest-value gap is likely fuller opening-range/session structure or another genuinely new named setup family rather than more close cousins of the current breakout/reclaim/mean-reversion branch

3. Stop-like vs discretionary-exit separation

Why:

- exit-quality coverage now has a real stop-like branch, including
  management-aware variants that distinguish held-through-danger versus
  delayed-risk-response paths before the forced-feeling exit

### Good But Slightly Later

1. Under-sizing / not pressing winners with better nuance beyond the first constructive and timely-protected under-pressed winner branches
2. More session-aware context
3. Richer cross-family full-trade management storylines that summarize a larger journey without only adding local constructive variants

---

## Recommended Next Step

The best next move is:

- use the current Layer 1 facts to keep building richer cross-family
  lifecycle stories, especially broader constructive whole-trade summaries
  and any new exit-side composites that summarize more than a single local
  behavior without just cloning the current trim / protect / add ladders

That should be done before returning to Layer 1 expansion, unless a concrete new storyline proves the current factual inputs are no longer enough.

---

## Layer 4 Behavior/Coaching Status Update

The repo now also has the first deterministic downstream behavior and coaching slice.

What is now live:

- behavior signals tied to scoring trace evidence
- behavior prioritization through `behaviorPriorityScore`
- `primaryBehavior`, `secondaryBehaviors`, and `suppressedBehaviors`
- mistake-vs-edge style derived behavior classification
- conflict-aware behavior resolution
- identity-signal candidates for future cross-trade aggregation
- one-issue coaching enforcement through `fixFirst`
- first trader-level behavior profile aggregation
- recurring weakness / strength ranking across many trades
- first-pass trader identity labels
- session-based weakness / strength summaries
- improving vs deteriorating behavior trends

Important current limitation:

- behavior and coaching coverage are still only as broad as the currently
  implemented behavior registry
- this is the first honest behavior/coaching slice, not yet a full trader
  feedback system across every detected pattern family
- trader-level insights are now real, but still only as rich as the current
  single-trade behavior registry and identity rules

---

## Update Rule

Update this file when:

- a new major behavior family becomes covered
- a previously weak area becomes partial or strong
- the recommended next step changes

---

## Support/Resistance Coverage Update

The repo now has the first live support/resistance-aware slice.

### Layer 1 coverage now includes

- structural context window
- named reference levels
- dynamic levels:
  - VWAP
  - EMA 9
  - EMA 20
- first pivot detection
- first support/resistance ladders
- first execution-to-level relation facts
- structural-context availability / insufficiency flags

### PatternInput coverage now includes

- first-entry nearest support / resistance facts
- first-entry nearest resistance-below clearance facts
- first-entry overhead resistance density facts
- first-entry near-support / near-resistance / open-air facts
- first-entry bounded-structure / band-width facts
- first-entry nearest reference-level label
- first-entry VWAP / EMA distance facts
- final-exit near-support / near-resistance facts
- final-exit support-density facts below the exit
- reduction counts near support / resistance
- add counts near support / resistance and above / below nearby structure
- add counts above cleared resistance with room above
- average add distance to nearest support / resistance
- average add room to next resistance

### Layer 2 coverage now includes

- `entry_near_support_structure`
- `entry_far_from_support_structure`
- `entry_under_resistance_structure`
- `breakout_with_room_above_structure`
- `breakout_into_overhead_resistance_structure`
- `breakout_with_room_above_and_constructive_final_exit`
- `breakout_with_room_above_and_failed_profit_protection`
- `recovery_with_breakout_with_room_above_and_constructive_final_exit`
- `recovery_with_breakout_with_room_above_and_failed_profit_protection`
- `breakout_into_overhead_resistance_with_defensive_final_exit`
- `breakout_into_overhead_resistance_with_failed_profit_protection`
- `recovery_with_breakout_into_overhead_resistance_and_defensive_final_exit`
- `recovery_with_breakout_into_overhead_resistance_and_failed_profit_protection`
- `exit_into_support_structure`
- `exit_into_support_with_relief_after_exit`
- `exit_into_support_before_breakdown`
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
- `repeated_rescue_attempts_with_balanced_management_and_exit_into_stacked_support_and_relief`
- `repeated_rescue_attempts_with_balanced_management_and_exit_into_thin_support_before_breakdown`
- `repeated_balanced_management_with_trim_into_resistance_and_constructive_final_exit`
- `repeated_balanced_management_with_trim_into_resistance_and_premature_final_exit`
- `repeated_rescue_attempts_with_balanced_management_and_trim_into_resistance_and_constructive_final_exit`
- `repeated_rescue_attempts_with_balanced_management_and_trim_into_resistance_and_premature_final_exit`
- `repeated_balanced_management_with_take_profit_into_resistance_and_constructive_final_exit`
- `repeated_balanced_management_with_take_profit_into_resistance_and_premature_final_exit`
- `repeated_rescue_attempts_with_balanced_management_and_take_profit_into_resistance_and_constructive_final_exit`
- `repeated_rescue_attempts_with_balanced_management_and_take_profit_into_resistance_and_premature_final_exit`
- `add_into_resistance_structure`
- `add_above_resistance_structure`
- `add_above_resistance_with_constructive_final_exit`
- `add_above_resistance_with_failed_profit_protection`
- `recovery_with_add_above_resistance_and_constructive_final_exit`
- `recovery_with_add_above_resistance_and_failed_profit_protection`
- `repeated_adds_above_resistance_with_constructive_final_exit`
- `repeated_adds_above_resistance_with_failed_profit_protection`

### Honest current status

This is enough to start giving real level-aware feedback.

It is not yet enough to claim:

- full generalized support/resistance trade reading
- a complete breakout outcome taxonomy beyond the first room-above and overhead-resistance branches
- stacked-level confluence interpretation
- richer breakout-clearance / stacked-resistance interpretation
- richer breakout outcome ladders beyond the first constructive-vs-failed-protection split
- deeper support / resistance-aware add-pattern ladders beyond the first near-vs-above split
- deeper support / resistance-aware add-pattern ladders beyond the first constructive-vs-failed-protection split
- deeper support-aware exit ladders beyond the first relief-vs-breakdown split
- deeper support-aware exit ladders beyond the new repeated broad-summary support-aware exit split
- deeper support-aware trim / reduction ladders beyond the first trim-into-resistance slice
- deeper support-aware trim / reduction ladders beyond the first repeated trim-into-resistance slice
