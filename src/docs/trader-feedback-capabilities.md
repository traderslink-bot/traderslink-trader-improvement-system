# Trader Feedback Capabilities

This file summarizes what the current Layer 1 to Layer 4 system can already
support for trader-facing feedback.

It is not a coaching document.
It is a capability map.

Use it to answer questions like:

1. what the app can already detect well
2. what feedback statements are now supportable
3. which trader behaviors are fully detectable, only partially detectable,
   or not yet explicitly represented

---

## Current Scope

The current system can already support specific structural feedback about:

1. entry quality and timing
2. trade management and scaling
3. profit protection vs giveback
4. trim / re-add / re-entry behavior
5. exit quality
6. recovery after adversity
7. repeated rescue / repeated deterioration trade journeys

It is strongest at structural trade behavior and management quality.

It is weaker at named setup taxonomy such as:

1. reclaim
2. opening-drive / session-aware setup labels
3. explicit mean-reversion setup labels

It also now has the first deterministic downstream scoring -> behavior ->
coaching bridge for a limited but real behavior set.

---

## Plain-English Feedback The App Can Support Now

### Entry Feedback

- You entered in a favorable part of the trade range.
- You entered late with limited upside left.
- Your entry came after a strong extension and looked chasey.
- Your entry came after a constructive pullback.
- This was a disciplined continuation entry, not a reckless chase.
- This was an overextended chase entry.
- This was an explicit breakout entry.
- This was an explicit breakout chase entry.
- This breakout attempt failed quickly after entry.
- This was an explicit reclaim entry after price recovered a recent reference level.
- This reclaim attempt looked valid into entry but failed quickly afterward.
- This was an explicit mean-reversion entry after a deeper countertrend move reclaimed structure.
- This mean-reversion attempt looked real into entry but still failed afterward.
- This was a market-open breakout entry.
- This was a market-open breakout chase.
- This market-open breakout attempt failed quickly after entry.
- This was an explicit opening-range breakout entry.
- This was an explicit opening-range breakout chase.
- This opening-range breakout attempt failed quickly after entry.
- This was an explicit opening-range reclaim entry.
- This opening-range reclaim attempt looked valid into entry but still failed afterward.
- This was a market-open reclaim entry.
- This market-open reclaim attempt failed quickly after entry.
- You bought a deep pullback, but the entry was still weak.
- You entered after a deeper pullback and still kept strong structure.
- The pre-entry extension was measured and still left a strong continuation entry.

### Management Feedback

- You added into strength.
- You added into weakness.
- You reduced into strength.
- You reduced into weakness.
- You protected profit in time.
- You responded to risk in time, but later still needed a defensive save.
- You managed the trade actively, but later still needed a defensive save.
- You recovered from early adversity, managed the trade actively, and still
  later needed a defensive save.
- You managed the trade actively, but the final exit still looked fearful and
  the move recovered after you were out.
- You recovered from early adversity, managed the trade actively, and still
  later exited fearfully before the trade rebounded.
- You reacted to risk too late after peak open profit.
- You held through danger instead of reducing.
- You under-pressed a winner.
- You built size constructively.
- You kept re-adding after trims, and the re-entries were constructive.
- You kept re-adding after trims, but the re-entries deteriorated.
- You kept averaging down into weakness without meaningful reduction.
- Your repeated adds into weakness later turned into a failed-protection sequence.

### Exit Feedback

- You exited with strong profit capture.
- You exited with moderate capture.
- You exited too early and left continuation behind.
- You gave back too much open profit before exiting.
- Your exit was defensive after real deterioration.
- Your exit looked fearful.
- This looked like a stop-like forced exit after breakdown.
- This looked like a stop-like exit before rebound.

### Whole-Trade Storyline Feedback

- You recovered from early adversity and then managed the trade constructively.
- You recovered early, but later failed to protect profit.
- You managed the trade actively, but still exited too early.
- You managed the trade actively, and the final exit still left meaningful continuation behind.
- You managed the trade actively, but still later got forced out.
- You trimmed into strength well, but the final exit still came too early.
- You protected profit in time, but still sold before the move was finished.
- You re-entered constructively after trimming, but the final exit was premature.
- You repeated rescue attempts, and the trade quality improved.
- You repeated rescue attempts, but the trade kept degrading.

---

## Behavior Matrix

| Trader behavior | Status | What the app can use now |
|---|---|---|
| FOMO / chase entry | `Can detect` | late favorable extension, overextended chase, high-range / near-high entry, recent run-up before entry, limited remaining upside |
| Clean pullback entry | `Can detect` | constructive pullback, deep constructive pullback, advantaged / efficient entry |
| Deep weak pullback / bad dip buy | `Can detect` | weak pullback, deep weak pullback, disadvantaged / inefficient entry |
| Bag-holding / held winner too long and lost quality | `Can detect` | failed profit protection, delayed risk response, held through danger, meaningful giveback, defensive / stop-like exits |
| Cutting winners too early | `Can detect` | premature final exit, missed continuation, constructive management with premature exit, timely protection with premature exit |
| Good profit taking | `Can detect` | constructive final exit, moderate / high capture exit, trim into strength with constructive exit, timely protection with constructive exit |
| Stop-out / forced-feeling exit | `Can detect` | stop-like forced exit after breakdown, stop-like forced exit before rebound, recovery-aware and repeated-cycle stop-like variants |
| Revenge adds / emotional averaging | `Partially can detect` | revenge_adding_after_weakness and revenge_adding_with_failed_profit_protection now make the structural behavior explicit, but emotional intent still is not observable directly |
| Breakout entry | `Can detect` | breakout_entry_structure, measured favorable extension, disciplined favorable extension |
| Breakout chase | `Can detect` | breakout_chase_entry_structure, overextended chase, late favorable extension |
| Failed breakout | `Can detect` | failed_breakout_entry_structure plus weak post-entry structure after a measured breakout-style extension |
| Reclaim entry | `Can detect` | reclaim_entry_structure, recent reference reclaim before entry, held reclaim into entry, bounded entry distance from the reclaimed reference |
| Failed reclaim | `Can detect` | failed_reclaim_entry_structure plus weak post-entry structure after a recent reference reclaim |
| Mean-reversion setup | `Can detect` | mean_reversion_entry_structure and failed_mean_reversion_entry_structure built from a deeper countertrend move plus recent reference reclaim context |
| Opening range / session setup | `Partially can detect` | opening_range_breakout_entry_structure, opening_range_breakout_chase_entry_structure, failed_opening_range_breakout_entry_structure, opening_range_reclaim_entry_structure, failed_opening_range_reclaim_entry_structure, plus the broader market_open breakout/reclaim families now cover the first honest opening-range and market-open setup lanes, but not a full broader session setup taxonomy |
| Entry near support | `Can detect` | entry_near_support_structure plus first-entry nearest-support distance, nearest reference-level label, and structural-context availability |
| Entry far from support | `Can detect` | entry_far_from_support_structure plus first-entry distance-to-support and open-air context |
| Entry under resistance | `Can detect` | entry_under_resistance_structure plus first-entry nearest-resistance distance and structural-context availability |
| Breakout with room above | `Can detect` | breakout_with_room_above_structure plus cleared-nearest-resistance-below, room-to-next-resistance, and structural-context availability |
| Breakout into overhead resistance | `Can detect` | breakout_into_overhead_resistance_structure plus resistance-clearance facts and stacked overhead resistance density |
| Breakout with room above and constructive finish | `Can detect` | breakout_with_room_above_and_constructive_final_exit plus room-above breakout facts and constructive final-exit structure |
| Breakout with room above and failed protection | `Can detect` | breakout_with_room_above_and_failed_profit_protection plus room-above breakout facts and later failed profit protection |
| Breakout into overhead resistance with defensive exit | `Can detect` | breakout_into_overhead_resistance_with_defensive_final_exit plus overhead-resistance breakout facts and later disciplined defensive final-exit structure |
| Breakout into overhead resistance with failed protection | `Can detect` | breakout_into_overhead_resistance_with_failed_profit_protection plus overhead-resistance breakout facts and later failed profit protection |
| Exit into support | `Can detect` | exit_into_support_structure plus final-exit nearest-support distance and structural-context availability |
| Exit into support before breakdown | `Can detect` | exit_into_support_before_breakdown plus final-exit near-support facts and post-exit breakdown followthrough |
| Exit into stacked support with relief | `Can detect` | exit_into_stacked_support_with_relief_after_exit plus final-exit near-support facts, stacked support density, and post-exit relief |
| Exit into thin support before breakdown | `Can detect` | exit_into_thin_support_before_breakdown plus final-exit near-support facts, thin support context, and post-exit breakdown followthrough |
| Stabilized recovery with exit into stacked support and relief | `Can detect` | stabilized_recovery_with_exit_into_stacked_support_and_relief plus early-adversity recovery stabilization, stacked support context, and post-exit relief |
| Stabilized recovery with exit into thin support before breakdown | `Can detect` | stabilized_recovery_with_exit_into_thin_support_before_breakdown plus early-adversity recovery stabilization, thin support context, and post-exit breakdown followthrough |
| Add into resistance | `Can detect` | add_into_resistance_structure plus add-level nearest-resistance relation counts and distances |
| Add above resistance | `Can detect` | add_above_resistance_structure plus add-level resistance-clearance counts and room-to-next-resistance facts |
| Add above resistance with constructive finish | `Can detect` | add_above_resistance_with_constructive_final_exit plus add-above-resistance facts and constructive final-exit structure |
| Add above resistance with failed protection | `Can detect` | add_above_resistance_with_failed_profit_protection plus add-above-resistance facts and later failed profit protection |
| Recovery with add above resistance and constructive finish | `Can detect` | recovery_with_add_above_resistance_and_constructive_final_exit plus early-adversity recovery facts, add-above-resistance facts, and constructive final-exit structure |
| Recovery with add above resistance and failed protection | `Can detect` | recovery_with_add_above_resistance_and_failed_profit_protection plus early-adversity recovery facts, add-above-resistance facts, and later failed profit protection |
| Repeated adds above resistance with constructive finish | `Can detect` | repeated_adds_above_resistance_with_constructive_final_exit plus repeated add-above-resistance facts and constructive final-exit structure |
| Repeated adds above resistance with failed protection | `Can detect` | repeated_adds_above_resistance_with_failed_profit_protection plus repeated add-above-resistance facts and later failed profit protection |

---

## Best Current Summary

The system is already strong enough to support specific feedback about:

1. whether the trader chased or entered constructively
2. whether the trader pressed winners or underused them
3. whether the trader protected profit or gave too much back
4. whether exits were constructive, premature, defensive, fearful, or stop-like
5. whether trim / re-add / re-entry behavior improved or worsened the trade
6. whether the trade recovered from adversity or deteriorated through repeated rescue attempts

The system is not yet strong enough to claim a full named setup taxonomy.

That means the app can already say a lot about how the trader traded,
but it still says structure better than it says playbook names.

## New Behavior/Coaching Capabilities

The repo can now also support a first deterministic behavior/coaching layer for
the behaviors currently represented in the behavior registry.

What is now possible:

- prioritize one primary behavior instead of treating all detected behavior
  signals as equally important
- suppress weaker or contradicted behaviors from the main coaching focus
- identify whether the most important behavior acted more like:
  - a destructive mistake
  - a costly mistake
  - an improving behavior
  - an edge
- emit one primary coaching directive through `fixFirst`
- keep behavior/coaching claims tied to scored trace evidence instead of
  generic advice
- aggregate many trade-feedback outputs into a trader-level behavior profile
- identify top recurring mistakes and emerging strengths
- classify first-pass trader identities like chase-prone or weak-profit-protector
- show which session segment produces the most consistent weakness or strength
- show whether a behavior is improving or deteriorating over time

Honest current limit:

- this new layer is real, but its coverage is only as broad as the current
  implemented behavior registry

---

## Recommended Roadmap Use

Use this document together with:

1. `src/docs/behavior-coverage-audit.md`
2. `src/docs/codex-project-log.md`
3. `src/docs/layer2-pattern-detection/layer2-implemented-pattern-catalog.md`

If a future session asks:

- what feedback can the app already support
- whether the app can detect FOMO, cutting winners, bag-holding, or stop-outs
- whether setup-level detection is already mature

this file should be the first place to check.

---

## New Support/Resistance-Aware Feedback Now Possible

- “Your entry occurred near identified support.”
- “Your entry sat under nearby resistance.”
- “Your final exit occurred into nearby support.”
- “Your final exit occurred into nearby support and price relieved higher after you were out.”
- “Your later adds occurred into nearby resistance.”
- “Your entry was meaningfully far from the nearest support.”
- “Your entry had open air around it rather than immediately sitting on nearby structure.”
- “There was support/resistance context available for this trade.”
- “There was not enough candle data to build reliable structural context.”
