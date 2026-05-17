# Layer 2 Implemented Pattern Catalog

## Purpose of This Document

This document is the pattern catalog for Layer 2.

It lists every implemented Layer 2 pattern, grouped by family, and explains:

1. what the pattern means structurally
2. what causes it to trigger
3. whether it is atomic, structural composite, or storyline composite
4. what kind of evidence it uses
5. any important notes or future caveats

This is not a scoring document.
This is not a coaching document.
This is not a ranking document.

This is a detection catalog.

---

## Important Notes Before Reading This Catalog

## 1. These are detection patterns, not judgments

A pattern being detected does not automatically mean:

1. good trade
2. bad trade
3. correct action
4. incorrect action

It only means the structure described by the pattern is present.

---

## 2. Multiple patterns can be true at the same time

A single trade can legitimately trigger many patterns at once.

For example, a trade may detect:

1. `scaled_into_position`
2. `multi_build_full_exit`
3. `low_range_entry`
4. `advantaged_entry_structure`
5. `moderate_capture_exit_structure`

This is expected.

Layer 2 is designed to preserve structural truth, not reduce everything to one label.

---

## 3. Structural level matters

Layer 2 patterns now carry a structural-level classification:

### Atomic
A narrow isolated structural fact

### Structural composite
A higher-order structure built from multiple conditions

### Storyline composite
A multi-phase trade interpretation such as recovery, repeated-cycle, or richer
final-outcome structure

This classification exists now so later layers can prioritize more
intelligently without changing the core Layer 2 detection boundary.

---

## 4. Thresholds may evolve later

The thresholds listed in this catalog reflect the current Layer 2 implementation.

They are deterministic and intentional, but they may be tuned later as the system is validated on more scenarios.

That does not make them placeholders.
It means they are live system thresholds subject to future calibration.

---

# Family 1: Execution Frequency Patterns

## Purpose

These patterns describe how quickly executions occurred within the trade.

These are atomic patterns.

---

## `high_frequency_execution`

### Pattern type
Atomic

### Structural meaning
Executions occurred at a high pace.

### Trigger logic
Triggers when:

- `executionsPerMinute >= 2`

### Main evidence used
- `executionsPerMinute`

### Notes
This is an edge-state pattern.
It only detects notably high execution frequency.

It does not currently imply impulsiveness or overtrading by itself.
That kind of meaning belongs to later layers.

---

## `low_frequency_execution`

### Pattern type
Atomic

### Structural meaning
Executions occurred at a notably slow pace.

### Trigger logic
Triggers when:

- `executionsPerMinute <= 0.3`

### Main evidence used
- `executionsPerMinute`

### Notes
This is also an edge-state pattern.

The middle zone between low and high frequency is currently left untagged on purpose.

A future version may add an explicit neutral state such as `normal_frequency_execution`, but that is not part of the current Layer 2 implementation.

---

# Family 2: Position Building Patterns

## Purpose

These patterns describe isolated facts about how position size was built.

These are atomic patterns.

---

## `scaled_into_position`

### Pattern type
Atomic

### Structural meaning
The trade involved multiple size increases.

### Trigger logic
Triggers when:

- `totalPositionIncreaseCount >= 2`

### Main evidence used
- `totalPositionIncreaseCount`
- `hadMultipleIncreases`

### Notes
This does not say whether scaling in was good or bad.
It only says the trade was built in multiple increase events.

---

## `single_build_position`

### Pattern type
Atomic

### Structural meaning
The trade was built with only one increase event.

### Trigger logic
Triggers when:

- `totalPositionIncreaseCount === 1`
- `hadMultipleIncreases === false`

### Main evidence used
- `totalPositionIncreaseCount`
- `hadMultipleIncreases`

### Notes
This is the opposite side of multi-increase position building.
It is a narrow structural fact, not a quality judgment.

---

# Family 3: Position Reduction Patterns

## Purpose

These patterns describe isolated facts about reduction behavior.

These are atomic patterns.

---

## `scaled_out_of_position`

### Pattern type
Atomic

### Structural meaning
The trade involved multiple reduction events.

### Trigger logic
Triggers when:

- `totalPositionDecreaseCount >= 2`

### Main evidence used
- `totalPositionDecreaseCount`
- `hadMultipleDecreases`

### Notes
This pattern only says there were multiple reductions.
It does not yet describe whether those reductions were timely, protective, or weak.

---

# Family 4: Position Structure Patterns

## Purpose

These patterns describe broader trade lifecycle structure involving building and reduction.

These are composite patterns.

---

## `aggressive_scale_in`

### Pattern type
Composite

### Structural meaning
The trade involved multiple increases while execution pace was high.

### Trigger logic
Triggers when:

- `totalPositionIncreaseCount >= 2`
- `executionsPerMinute >= 2`

### Main evidence used
- `totalPositionIncreaseCount`
- `executionsPerMinute`
- `hadMultipleIncreases`

### Notes
This is a structural description of rapid multi-add behavior.
It does not yet mean reckless adding by itself.

---

## `passive_scale_in`

### Pattern type
Composite

### Structural meaning
The trade involved multiple increases while execution pace was slow.

### Trigger logic
Triggers when:

- `totalPositionIncreaseCount >= 2`
- `executionsPerMinute <= 0.3`

### Main evidence used
- `totalPositionIncreaseCount`
- `executionsPerMinute`
- `hadMultipleIncreases`

### Notes
This pattern captures slower-paced multi-add structure.

---

## `single_build_full_exit`

### Pattern type
Composite

### Structural meaning
The trade was built with one increase event and then fully closed.

### Trigger logic
Triggers when:

- `totalPositionIncreaseCount === 1`
- `closedToFlat === true`
- `finalPositionSize === 0`

### Main evidence used
- `totalPositionIncreaseCount`
- `closedToFlat`
- `finalPositionSize`

### Notes
This describes a simple one-build full round-trip structure.

---

## `multi_build_full_exit`

### Pattern type
Composite

### Structural meaning
The trade was built through multiple increases and then fully closed.

### Trigger logic
Triggers when:

- `totalPositionIncreaseCount >= 2`
- `closedToFlat === true`
- `finalPositionSize === 0`

### Main evidence used
- `totalPositionIncreaseCount`
- `closedToFlat`
- `finalPositionSize`

### Notes
This is one of the key trade lifecycle patterns in Layer 2.

It is broader than `scaled_into_position` because it includes the final closure structure too.

---

## `multi_build_partial_exit`

### Pattern type
Composite

### Structural meaning
The trade was built through multiple increases and still had position remaining at the end.

### Trigger logic
Triggers when:

- `totalPositionIncreaseCount >= 2`
- `finalPositionSize >= 1`

### Main evidence used
- `totalPositionIncreaseCount`
- `finalPositionSize`
- `closedToFlat`

### Notes
This captures multi-build trades that were not fully exited.

---

## `scale_in_then_reduce`

### Pattern type
Composite

### Structural meaning
The trade had meaningful building and meaningful reduction in the same trade.

### Trigger logic
Triggers when:

- `totalPositionIncreaseCount >= 2`
- `totalPositionDecreaseCount >= 2`

### Main evidence used
- `totalPositionIncreaseCount`
- `totalPositionDecreaseCount`

### Notes
This is a stronger active-management structure than simple build-only or simple reduce-only patterns.

---

## `one_and_done_round_trip`

### Pattern type
Composite

### Structural meaning
The trade had one increase event, one decrease event, and ended flat.

### Trigger logic
Triggers when:

- `totalPositionIncreaseCount === 1`
- `totalPositionDecreaseCount === 1`
- `closedToFlat === true`
- `finalPositionSize === 0`

### Main evidence used
- `totalPositionIncreaseCount`
- `totalPositionDecreaseCount`
- `closedToFlat`
- `finalPositionSize`

### Notes
This captures a very simple round-trip lifecycle.

---

# Family 5: Trade Duration Patterns

## Purpose

These patterns describe notable trade duration extremes.

These are atomic patterns.

---

## `quick_trade`

### Pattern type
Atomic

### Structural meaning
The trade duration was short.

### Trigger logic
Triggers when:

- `tradeDurationSeconds <= 120`

### Main evidence used
- `tradeDurationSeconds`

### Notes
This is an edge-state duration pattern.
The current system does not emit an explicit normal-duration pattern.

---

## `extended_trade`

### Pattern type
Atomic

### Structural meaning
The trade duration was long.

### Trigger logic
Triggers when:

- `tradeDurationSeconds >= 900`

### Main evidence used
- `tradeDurationSeconds`

### Notes
This captures duration extreme on the longer side only.

---

# Family 6: Trade Excursion Patterns

## Purpose

These patterns describe notable favorable or adverse movement magnitude.

These are atomic patterns.

---

## `high_mfe_trade`

### Pattern type
Atomic

### Structural meaning
The trade experienced strong favorable excursion.

### Trigger logic
Triggers when:

- `tradeMfePct >= 0.05`

### Main evidence used
- `tradeMfePct`

### Notes
This does not mean the trader captured that move.
It only means the move existed during the trade.

---

## `high_mae_trade`

### Pattern type
Atomic

### Structural meaning
The trade experienced meaningful adverse excursion.

### Trigger logic
Triggers when:

- `tradeMaePct >= 0.05`

### Main evidence used
- `tradeMaePct`

### Notes
This does not mean the trader realized a large loss.
It only means the trade experienced meaningful drawdown at some point.

---

# Family 7: Trade Closure Patterns

## Purpose

These patterns describe how the trade ended.

These are atomic patterns.

---

## `fully_closed_trade`

### Pattern type
Atomic

### Structural meaning
The trade ended fully flat.

### Trigger logic
Triggers when:

- `closedToFlat === true`

### Main evidence used
- `closedToFlat`
- `finalPositionSize`

### Notes
This says the trade was fully exited by the end.

---

## `partial_position_left`

### Pattern type
Atomic

### Structural meaning
The trade ended with some position still remaining.

### Trigger logic
Triggers when:

- `finalPositionSize >= 1`

### Main evidence used
- `finalPositionSize`
- `closedToFlat`

### Notes
This identifies non-flat final state.

---

# Family 8: Entry Context Patterns

## Purpose

These patterns describe where the first entry occurred within the eventual trade range and how much opportunity remained after entry.

These are atomic patterns.

---

## `low_range_entry`

### Pattern type
Atomic

### Structural meaning
The first entry occurred in the lower portion of the eventual trade range.

### Trigger logic
Triggers when:

- `firstEntryPricePositionInTradeRangePct <= 0.3`

### Main evidence used
- `firstEntryPricePositionInTradeRangePct`

### Notes
For long trades, lower range means closer to the trade low.
For short trades, the normalized logic still maps favorable side structurally.

---

## `high_range_entry`

### Pattern type
Atomic

### Structural meaning
The first entry occurred in the upper portion of the eventual trade range.

### Trigger logic
Triggers when:

- `firstEntryPricePositionInTradeRangePct >= 0.7`

### Main evidence used
- `firstEntryPricePositionInTradeRangePct`

### Notes
This is the opposite side of low-range entry.

---

## `entry_near_trade_low`

### Pattern type
Atomic

### Structural meaning
The first entry occurred very close to the favorable low side of the trade range.

### Trigger logic
Triggers when:

- `firstEntryWasNearTradeLow === true`

Current boolean threshold source:
- `firstEntryPricePositionInTradeRangePct <= 0.2`

### Main evidence used
- `firstEntryWasNearTradeLow`

### Notes
This is stricter than `low_range_entry`.

---

## `entry_near_trade_high`

### Pattern type
Atomic

### Structural meaning
The first entry occurred very close to the unfavorable high side of the trade range.

### Trigger logic
Triggers when:

- `firstEntryWasNearTradeHigh === true`

Current boolean threshold source:
- `firstEntryPricePositionInTradeRangePct >= 0.8`

### Main evidence used
- `firstEntryWasNearTradeHigh`

### Notes
This is stricter than `high_range_entry`.

---

## `entry_with_favorable_remaining_upside`

### Pattern type
Atomic

### Structural meaning
A strong portion of the trade’s available favorable excursion still remained after the first entry.

### Trigger logic
Triggers when:

- `firstEntryCapturedPercentOfTradeMfe >= 0.6`

### Main evidence used
- `firstEntryCapturedPercentOfTradeMfe`

### Notes
This means the first entry still had meaningful opportunity ahead of it.

---

## `entry_with_limited_remaining_upside`

### Pattern type
Atomic

### Structural meaning
Only a limited portion of the full favorable trade excursion remained after the first entry.

### Trigger logic
Triggers when:

- `firstEntryCapturedPercentOfTradeMfe <= 0.3`

### Main evidence used
- `firstEntryCapturedPercentOfTradeMfe`

### Notes
This is the opposite side of favorable remaining upside.

---

# Family 9: Entry Quality Patterns

## Purpose

These patterns describe higher-order structural quality of the first entry.

These are composite patterns.

---

## `advantaged_entry_structure`

### Pattern type
Composite

### Structural meaning
The first entry occurred in a favorable structural location with strong remaining upside and controlled adverse movement after entry.

### Trigger logic
Triggers when all are true:

- `firstEntryPricePositionInTradeRangePct <= 0.3`
- `firstEntryCapturedPercentOfTradeMfe >= 0.6`
- `firstEntryToWorstMovePct <= 0.02`

### Main evidence used
- `firstEntryPricePositionInTradeRangePct`
- `firstEntryCapturedPercentOfTradeMfe`
- `firstEntryToWorstMovePct`

### Notes
This is a high-value entry structure pattern.
It is still structural, not judgmental.

---

## `disadvantaged_entry_structure`

### Pattern type
Composite

### Structural meaning
The first entry occurred in a poor structural location with limited remaining upside and meaningful adverse movement after entry.

### Trigger logic
Triggers when all are true:

- `firstEntryPricePositionInTradeRangePct >= 0.7`
- `firstEntryCapturedPercentOfTradeMfe <= 0.3`
- `firstEntryToWorstMovePct >= 0.02`

### Main evidence used
- `firstEntryPricePositionInTradeRangePct`
- `firstEntryCapturedPercentOfTradeMfe`
- `firstEntryToWorstMovePct`

### Notes
This is the negative structural counterpart to advantaged entry structure.

---

## `efficient_entry_structure`

### Pattern type
Composite

### Structural meaning
The first entry captured a strong share of remaining move while adverse movement after entry stayed controlled.

### Trigger logic
Triggers when:

- `firstEntryCapturedPercentOfTradeMfe >= 0.6`
- `firstEntryToWorstMovePct <= 0.02`

### Main evidence used
- `firstEntryCapturedPercentOfTradeMfe`
- `firstEntryToWorstMovePct`

### Notes
This is broader than `advantaged_entry_structure` because it does not require low range position.

---

## `inefficient_entry_structure`

### Pattern type
Composite

### Structural meaning
The first entry captured limited remaining move and experienced meaningful adverse movement after entry.

### Trigger logic
Triggers when:

- `firstEntryCapturedPercentOfTradeMfe <= 0.3`
- `firstEntryToWorstMovePct >= 0.02`

### Main evidence used
- `firstEntryCapturedPercentOfTradeMfe`
- `firstEntryToWorstMovePct`

### Notes
This is broader than `disadvantaged_entry_structure`.

---

## `late_favorable_extension_entry_structure`

### Pattern type
Composite

### Structural meaning
The first entry happened late after price had already extended in the trade's favorable direction.

### Trigger logic
Triggers when all are true:

- `firstEntryPricePositionInTradeRangePct >= 0.7`
- `firstEntryCapturedPercentOfTradeMfe <= 0.3`
- `firstEntryToWorstMovePct >= 0.02`
- direction-aware favorable pre-entry move >= `0.05`
- direction-aware normalized recent net move >= `0.03`
- directional candles before entry exceed counter-directional candles by at least `1`

### Main evidence used
- `firstEntryPricePositionInTradeRangePct`
- `firstEntryCapturedPercentOfTradeMfe`
- `firstEntryToWorstMovePct`
- pre-entry directional move and net move
- pre-entry directional candle counts

### Notes
This is direction-aware.

For longs, the favorable pre-entry move is a run-up.
For shorts, the favorable pre-entry move is a drop.

---

## `constructive_pullback_entry_structure`

### Pattern type
Composite

### Structural meaning
The first entry happened after a direction-aware pullback and still retained favorable structural opportunity.

### Trigger logic
Triggers when all are true:

- `firstEntryPricePositionInTradeRangePct <= 0.3`
- `firstEntryCapturedPercentOfTradeMfe >= 0.6`
- `firstEntryToWorstMovePct <= 0.02`
- direction-aware adverse pre-entry move >= `0.05`
- direction-aware normalized recent net move <= `-0.02`
- counter-directional candles before entry exceed directional candles by at least `1`

### Main evidence used
- `firstEntryPricePositionInTradeRangePct`
- `firstEntryCapturedPercentOfTradeMfe`
- `firstEntryToWorstMovePct`
- pre-entry directional move and net move
- pre-entry directional candle counts

### Notes
This is direction-aware.

For longs, the pullback context is a recent drop.
For shorts, the pullback context is a recent run-up.

---

# Family 10: Exit Quality Patterns

## Purpose

These patterns describe higher-order structural quality of the final exit.

These are composite patterns.

---

## `high_capture_exit_structure`

### Pattern type
Composite

### Structural meaning
The final exit captured a high share of the available favorable move and occurred relatively high in the trade range.

### Trigger logic
Triggers when:

- `realizedCapturePercentOfTradeMfe >= 0.7`
- `exitPricePositionInTradeRangePct >= 0.7`

### Main evidence used
- `realizedCapturePercentOfTradeMfe`
- `exitPricePositionInTradeRangePct`

### Notes
This is the strongest currently implemented final-exit capture structure.

---

## `moderate_capture_exit_structure`

### Pattern type
Composite

### Structural meaning
The final exit captured a meaningful but not elite share of the available move.

### Trigger logic
Triggers when:

- `realizedCapturePercentOfTradeMfe >= 0.5`
- `realizedCapturePercentOfTradeMfe < 0.7`

### Main evidence used
- `realizedCapturePercentOfTradeMfe`

### Notes
This pattern allows the system to distinguish decent capture from both elite capture and weak capture.

---

## `low_capture_exit_structure`

### Pattern type
Composite

### Structural meaning
The final exit captured only a limited share of the available favorable move.

### Trigger logic
Triggers when:

- `realizedCapturePercentOfTradeMfe <= 0.3`

### Main evidence used
- `realizedCapturePercentOfTradeMfe`

### Notes
This is the weak-capture counterpart.

---

## `exit_with_limited_giveback`

### Pattern type
Composite

### Structural meaning
Only a limited amount of favorable excursion was left unrealized by the final exit.

### Trigger logic
Triggers when:

- `favorableExcursionLeftOnTablePct <= 0.03`

### Main evidence used
- `favorableExcursionLeftOnTablePct`

### Notes
This describes efficient conversion of available move into realized outcome.

---

## `exit_with_meaningful_giveback`

### Pattern type
Composite

### Structural meaning
A meaningful amount of favorable excursion was not converted into realized result before the final exit.

### Trigger logic
Triggers when:

- `favorableExcursionLeftOnTablePct >= 0.05`

### Main evidence used
- `favorableExcursionLeftOnTablePct`

### Notes
This does not yet explain why giveback occurred.
It only says it occurred meaningfully.

---

## `exit_near_favorable_extreme`

### Pattern type
Composite

### Structural meaning
The final exit occurred very near the favorable extreme of the trade range.

### Trigger logic
Triggers when:

- `exitWasNearTradeHigh === true`

Current boolean threshold source:
- `exitPricePositionInTradeRangePct >= 0.8`

### Main evidence used
- `exitWasNearTradeHigh`

### Notes
For long trades, this means near the high.
For short trades, future naming may need refinement, but the current structural intent is preserved.

---

# Family 11: Scaling Quality Patterns

## Purpose

These patterns describe higher-order quality of how size was built and managed through the middle of the trade.

These are composite patterns.

---

## `structured_position_building`

### Pattern type
Composite

### Structural meaning
The trader built size meaningfully through multiple increase events.

### Trigger logic
Triggers when:

- `totalPositionIncreaseCount >= 2`

### Main evidence used
- `totalPositionIncreaseCount`

### Notes
This is broad and descriptive.
It does not yet distinguish strong timing from weak timing.

---

## `balanced_position_management`

### Pattern type
Composite

### Structural meaning
The trader both built and reduced size within the trade.

### Trigger logic
Triggers when:

- `totalPositionIncreaseCount >= 2`
- `totalPositionDecreaseCount >= 1`

### Main evidence used
- `totalPositionIncreaseCount`
- `totalPositionDecreaseCount`

### Notes
This captures a more actively managed trade structure than simple one-directional size building.

---

## `one_sided_aggressive_building`

### Pattern type
Composite

### Structural meaning
The trader kept building size without any reductions.

### Trigger logic
Triggers when:

- `totalPositionIncreaseCount >= 2`
- `totalPositionDecreaseCount === 0`

### Main evidence used
- `totalPositionIncreaseCount`
- `totalPositionDecreaseCount`

### Notes
This identifies one-directional multi-add behavior.
It does not yet say whether that behavior was justified or not.

---

## `underutilized_position_building`

### Pattern type
Composite

### Structural meaning
The trade had meaningful favorable excursion but size building remained limited.

### Trigger logic
Triggers when:

- `totalPositionIncreaseCount <= 1`
- `tradeMfePct >= 0.05`

### Main evidence used
- `totalPositionIncreaseCount`
- `tradeMfePct`

### Notes
This detects structurally limited position building on trades that had enough move to matter.

---

# Summary by Pattern Type

## Atomic patterns currently implemented

1. `high_frequency_execution`
2. `low_frequency_execution`
3. `scaled_into_position`
4. `single_build_position`
5. `scaled_out_of_position`
6. `quick_trade`
7. `extended_trade`
8. `high_mfe_trade`
9. `high_mae_trade`
10. `fully_closed_trade`
11. `partial_position_left`
12. `low_range_entry`
13. `high_range_entry`
14. `entry_near_trade_low`
15. `entry_near_trade_high`
16. `entry_with_favorable_remaining_upside`
17. `entry_with_limited_remaining_upside`

## Composite patterns currently implemented

1. `aggressive_scale_in`
2. `passive_scale_in`
3. `single_build_full_exit`
4. `multi_build_full_exit`
5. `multi_build_partial_exit`
6. `scale_in_then_reduce`
7. `one_and_done_round_trip`
8. `advantaged_entry_structure`
9. `disadvantaged_entry_structure`
10. `efficient_entry_structure`
11. `inefficient_entry_structure`
12. `late_favorable_extension_entry_structure`
13. `constructive_pullback_entry_structure`
14. `disciplined_favorable_extension_entry_structure`
15. `breakout_entry_structure`
16. `measured_favorable_extension_entry_structure`
17. `overextended_chase_entry_structure`
18. `breakout_chase_entry_structure`
19. `failed_breakout_entry_structure`
20. `reclaim_entry_structure`
21. `failed_reclaim_entry_structure`
22. `mean_reversion_entry_structure`
23. `failed_mean_reversion_entry_structure`
24. `opening_range_breakout_entry_structure`
25. `opening_range_breakout_chase_entry_structure`
26. `failed_opening_range_breakout_entry_structure`
27. `opening_range_reclaim_entry_structure`
28. `failed_opening_range_reclaim_entry_structure`
29. `market_open_breakout_entry_structure`
30. `market_open_breakout_chase_entry_structure`
31. `failed_market_open_breakout_entry_structure`
32. `market_open_reclaim_entry_structure`
33. `failed_market_open_reclaim_entry_structure`
29. `weak_pullback_entry_structure`
30. `deep_constructive_pullback_entry_structure`
31. `deep_weak_pullback_entry_structure`
23. `high_capture_exit_structure`
24. `moderate_capture_exit_structure`
25. `low_capture_exit_structure`
26. `exit_with_limited_giveback`
27. `exit_with_meaningful_giveback`
28. `exit_near_favorable_extreme`
22. `structured_position_building`
23. `balanced_position_management`
24. `one_sided_aggressive_building`
25. `underutilized_position_building`
26. `peak_profit_giveback_structure`
27. `partial_exit_with_adverse_followthrough`
28. `missed_post_exit_continuation`
29. `exit_avoided_adverse_followthrough`
30. `defensive_exit_after_deterioration`
31. `premature_final_exit_after_constructive_management`
32. `fearful_exit_after_weakening`
33. `disciplined_defensive_exit`
34. `stop_like_forced_exit_after_breakdown`
35. `stop_like_forced_exit_before_rebound`
36. `held_through_danger_with_stop_like_forced_exit_after_breakdown`
37. `held_through_danger_with_stop_like_forced_exit_before_rebound`
38. `delayed_risk_response_with_stop_like_forced_exit_after_breakdown`
39. `delayed_risk_response_with_stop_like_forced_exit_before_rebound`
40. `stabilized_recovery_with_constructive_final_exit`
41. `stabilized_recovery_with_premature_final_exit`
42. `stabilized_recovery_with_stop_like_forced_exit_after_breakdown`
43. `stabilized_recovery_with_stop_like_forced_exit_before_rebound`
44. `reduction_into_strength`
45. `reduction_into_weakness`
46. `profit_protection_present`
47. `timely_risk_response_after_peak_profit`
48. `timely_risk_response_with_profit_protection`
49. `failed_profit_protection_structure`
50. `held_through_danger_after_peak_profit`
51. `delayed_risk_response_after_peak_profit`
52. `delayed_risk_response_with_failed_profit_protection`
53. `readd_after_reduction`
54. `adding_above_prior_basis`
55. `add_into_strength`
56. `add_into_weakness`
57. `balanced_scaling_with_profit_protection`
58. `constructive_readd_after_reduction`
59. `balanced_management_with_constructive_exit`
60. `recovery_with_balanced_management_and_constructive_final_exit`
61. `trim_into_strength_with_constructive_final_exit`
62. `timely_profit_protection_with_constructive_final_exit`
63. `timely_profit_protection_with_premature_final_exit`
64. `timely_risk_response_with_defensive_final_exit_after_deterioration`
65. `trim_into_strength_with_premature_final_exit`
66. `recovery_with_trim_into_strength_and_constructive_final_exit`
67. `recovery_with_timely_profit_protection_and_constructive_final_exit`
68. `recovery_with_timely_profit_protection_and_premature_final_exit`
69. `recovery_with_timely_risk_response_and_defensive_final_exit_after_deterioration`
70. `recovery_with_trim_into_strength_and_premature_final_exit`
71. `underutilized_winner_with_constructive_exit`
72. `recovery_to_underutilized_winner_with_constructive_exit`
73. `underutilized_winner_with_timely_profit_protection_and_constructive_final_exit`
74. `recovery_to_underutilized_winner_with_timely_profit_protection_and_constructive_final_exit`
75. `underutilized_winner_with_premature_final_exit`
76. `recovery_to_underutilized_winner_with_premature_final_exit`
77. `underutilized_winner_with_missed_final_continuation`
78. `recovery_to_underutilized_winner_with_missed_final_continuation`
79. `timely_trim_into_strength_with_constructive_final_exit`
80. `recovery_with_timely_trim_into_strength_and_constructive_final_exit`
81. `add_into_strength_with_constructive_final_exit`
82. `recovery_with_add_into_strength_and_constructive_final_exit`
83. `add_into_strength_with_timely_profit_protection_and_constructive_final_exit`
84. `recovery_with_add_into_strength_and_timely_profit_protection_and_constructive_final_exit`
85. `add_into_strength_with_premature_final_exit`
86. `recovery_with_add_into_strength_and_premature_final_exit`
87. `add_into_strength_with_missed_final_continuation`
88. `recovery_with_add_into_strength_and_missed_final_continuation`
89. `timely_risk_response_with_stop_like_forced_exit_after_breakdown`
90. `timely_risk_response_with_stop_like_forced_exit_before_rebound`
91. `recovery_with_timely_risk_response_and_stop_like_forced_exit_after_breakdown`
92. `recovery_with_timely_risk_response_and_stop_like_forced_exit_before_rebound`
93. `trim_readd_with_constructive_final_exit`
94. `trim_readd_with_missed_final_continuation`
95. `constructive_recovery_after_early_adversity`
96. `recovery_after_early_adversity_with_failed_protection`
97. `recovery_after_early_adversity_with_stabilized_management`
95. `repeated_trim_readd_with_constructive_management`
96. `repeated_trim_readd_with_unstable_management`
97. `repeated_rescue_attempts_with_renewed_deterioration`
98. `late_chase_reentry_after_constructive_trim`
99. `good_pullback_reentry_after_constructive_trim`
100. `constructive_reentry_followthrough_after_trim`
101. `constructive_reentry_with_constructive_final_exit`
102. `constructive_reentry_with_premature_final_exit`
103. `constructive_reentry_with_stop_like_forced_exit_after_breakdown`
104. `constructive_reentry_with_stop_like_forced_exit_before_rebound`
105. `recovery_with_constructive_final_exit_after_constructive_reentry`
106. `recovery_with_premature_final_exit_after_constructive_reentry`
107. `recovery_with_stop_like_forced_exit_after_constructive_reentry`
108. `recovery_with_stop_like_forced_exit_before_rebound_after_constructive_reentry`
109. `deteriorating_reentry_after_trim`
110. `repeated_trim_readd_with_constructive_reentry_followthrough`
111. `repeated_trim_readd_with_deteriorating_reentry`
112. `repeated_constructive_reentry_with_premature_final_exit`
113. `repeated_balanced_management_with_premature_final_exit`
114. `repeated_balanced_management_with_missed_final_continuation`
115. `repeated_balanced_management_with_stop_like_forced_exit_after_breakdown`
116. `repeated_balanced_management_with_stop_like_forced_exit_before_rebound`
117. `repeated_constructive_reentry_with_constructive_final_exit`
118. `repeated_constructive_reentry_with_stop_like_forced_exit_after_breakdown`
119. `repeated_constructive_reentry_with_stop_like_forced_exit_before_rebound`
120. `repeated_deteriorating_reentry_with_defensive_final_exit`
121. `repeated_rescue_attempts_with_premature_final_exit_after_constructive_reentries`
122. `repeated_rescue_attempts_with_balanced_management_and_premature_final_exit`
123. `repeated_rescue_attempts_with_balanced_management_and_missed_final_continuation`
124. `repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_after_breakdown`
125. `repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_before_rebound`
126. `repeated_rescue_attempts_with_constructive_final_exit_after_constructive_reentries`
127. `repeated_rescue_attempts_with_stop_like_forced_exit_after_constructive_reentries`
128. `repeated_rescue_attempts_with_stop_like_forced_exit_before_rebound_after_constructive_reentries`
129. `repeated_rescue_attempts_with_defensive_final_exit_after_deteriorating_reentries`
130. `repeated_trim_readd_with_constructive_final_exit`
131. `repeated_trim_readd_with_fearful_final_exit`
132. `repeated_trim_readd_with_defensive_final_exit_after_deterioration`
133. `repeated_rescue_attempts_with_defensive_final_exit_after_deterioration`
134. `repeated_trim_readd_with_premature_final_exit`
135. `repeated_trim_readd_with_missed_final_continuation`
136. `aggressive_adding_with_failed_profit_protection`
137. `readd_after_delayed_risk_response`
138. `balanced_management_with_premature_final_exit`
139. `recovery_with_balanced_management_and_premature_final_exit`
140. `balanced_management_with_stop_like_forced_exit_after_breakdown`
141. `balanced_management_with_stop_like_forced_exit_before_rebound`
142. `recovery_with_balanced_management_and_stop_like_forced_exit_after_breakdown`
143. `recovery_with_balanced_management_and_stop_like_forced_exit_before_rebound`

---

## Storyline Hierarchy Snapshot

The full Layer 2 composite set is now much broader than the early family sections above. The easiest way to resume the current design is to think in terms of storyline ladders:

### Exit-quality ladder

- broad capture and giveback descriptors:
  `high_capture_exit_structure`, `moderate_capture_exit_structure`, `low_capture_exit_structure`, `exit_with_limited_giveback`, `exit_with_meaningful_giveback`, `exit_near_favorable_extreme`
- richer post-exit descriptors:
  `peak_profit_giveback_structure`, `partial_exit_with_adverse_followthrough`, `missed_post_exit_continuation`, `exit_avoided_adverse_followthrough`
- richer final-exit storylines:
  `defensive_exit_after_deterioration`, `premature_final_exit_after_constructive_management`, `fearful_exit_after_weakening`, `disciplined_defensive_exit`
- stop-like breakdown-driven final-exit storylines:
  `stop_like_forced_exit_after_breakdown`, `stop_like_forced_exit_before_rebound`
- stop-like journey storylines tied to danger-window management path:
  `held_through_danger_with_stop_like_forced_exit_after_breakdown`, `held_through_danger_with_stop_like_forced_exit_before_rebound`, `delayed_risk_response_with_stop_like_forced_exit_after_breakdown`, `delayed_risk_response_with_stop_like_forced_exit_before_rebound`
- recovery-aware final-exit storylines:
  `stabilized_recovery_with_constructive_final_exit`, `stabilized_recovery_with_premature_final_exit`, `stabilized_recovery_with_stop_like_forced_exit_after_breakdown`, `stabilized_recovery_with_stop_like_forced_exit_before_rebound`

### Reduction and risk-response ladder

- directional reduction context:
  `reduction_into_strength`, `reduction_into_weakness`
- broad protection vs failure:
  `profit_protection_present`, `failed_profit_protection_structure`
- danger-window timing:
  `timely_risk_response_after_peak_profit`, `timely_risk_response_with_profit_protection`, `held_through_danger_after_peak_profit`, `delayed_risk_response_after_peak_profit`, `delayed_risk_response_with_failed_profit_protection`

### Scaling and rescue storyline ladder

- add and re-add context:
  `readd_after_reduction`, `adding_above_prior_basis`, `add_into_strength`, `add_into_weakness`
- constructive management:
  `balanced_scaling_with_profit_protection`, `constructive_readd_after_reduction`, `balanced_management_with_constructive_exit`, `recovery_with_balanced_management_and_constructive_final_exit`, `balanced_management_with_missed_final_continuation`, `recovery_with_balanced_management_and_missed_final_continuation`, `balanced_management_with_fearful_final_exit`, `recovery_with_balanced_management_and_fearful_final_exit`, `balanced_management_with_premature_final_exit`, `recovery_with_balanced_management_and_premature_final_exit`, `balanced_management_with_defensive_final_exit_after_deterioration`, `recovery_with_balanced_management_and_defensive_final_exit_after_deterioration`, `balanced_management_with_stop_like_forced_exit_after_breakdown`, `balanced_management_with_stop_like_forced_exit_before_rebound`, `recovery_with_balanced_management_and_stop_like_forced_exit_after_breakdown`, `recovery_with_balanced_management_and_stop_like_forced_exit_before_rebound`, `trim_into_strength_with_constructive_final_exit`, `trim_into_strength_with_premature_final_exit`, `timely_profit_protection_with_constructive_final_exit`, `timely_profit_protection_with_premature_final_exit`, `timely_risk_response_with_defensive_final_exit_after_deterioration`, `timely_risk_response_with_stop_like_forced_exit_after_breakdown`, `timely_risk_response_with_stop_like_forced_exit_before_rebound`, `recovery_with_trim_into_strength_and_constructive_final_exit`, `recovery_with_timely_profit_protection_and_constructive_final_exit`, `recovery_with_timely_profit_protection_and_premature_final_exit`, `recovery_with_timely_risk_response_and_defensive_final_exit_after_deterioration`, `recovery_with_timely_risk_response_and_stop_like_forced_exit_after_breakdown`, `recovery_with_timely_risk_response_and_stop_like_forced_exit_before_rebound`, `recovery_with_trim_into_strength_and_premature_final_exit`, `underutilized_winner_with_constructive_exit`, `recovery_to_underutilized_winner_with_constructive_exit`, `underutilized_winner_with_timely_profit_protection_and_constructive_final_exit`, `recovery_to_underutilized_winner_with_timely_profit_protection_and_constructive_final_exit`, `underutilized_winner_with_premature_final_exit`, `recovery_to_underutilized_winner_with_premature_final_exit`, `underutilized_winner_with_missed_final_continuation`, `recovery_to_underutilized_winner_with_missed_final_continuation`, `timely_trim_into_strength_with_constructive_final_exit`, `recovery_with_timely_trim_into_strength_and_constructive_final_exit`, `add_into_strength_with_constructive_final_exit`, `recovery_with_add_into_strength_and_constructive_final_exit`, `add_into_strength_with_timely_profit_protection_and_constructive_final_exit`, `recovery_with_add_into_strength_and_timely_profit_protection_and_constructive_final_exit`, `add_into_strength_with_premature_final_exit`, `recovery_with_add_into_strength_and_premature_final_exit`, `add_into_strength_with_missed_final_continuation`, `recovery_with_add_into_strength_and_missed_final_continuation`
- richer entry subtype split:
  `late_favorable_extension_entry_structure`, `constructive_pullback_entry_structure`, `disciplined_favorable_extension_entry_structure`, `breakout_entry_structure`, `measured_favorable_extension_entry_structure`, `overextended_chase_entry_structure`, `breakout_chase_entry_structure`, `failed_breakout_entry_structure`, `weak_pullback_entry_structure`, `deep_constructive_pullback_entry_structure`, `deep_weak_pullback_entry_structure`
- one-cycle trim and continuation outcomes:
  `trim_readd_with_constructive_final_exit`, `trim_readd_with_missed_final_continuation`
- early-adversity recovery:
  `constructive_recovery_after_early_adversity`, `recovery_after_early_adversity_with_failed_protection`, `recovery_after_early_adversity_with_stabilized_management`
- repeated trim / re-add branches:
  `repeated_trim_readd_with_constructive_management`, `repeated_trim_readd_with_unstable_management`, `repeated_rescue_attempts_with_renewed_deterioration`
- re-entry-after-trim subtype split:
  `late_chase_reentry_after_constructive_trim`, `good_pullback_reentry_after_constructive_trim`, `constructive_reentry_followthrough_after_trim`, `constructive_reentry_with_constructive_final_exit`, `recovery_with_constructive_final_exit_after_constructive_reentry`, `deteriorating_reentry_after_trim`
- repeated re-entry and final-outcome branches:
  `constructive_reentry_with_constructive_final_exit`, `constructive_reentry_with_premature_final_exit`, `constructive_reentry_with_stop_like_forced_exit_after_breakdown`, `constructive_reentry_with_stop_like_forced_exit_before_rebound`, `recovery_with_constructive_final_exit_after_constructive_reentry`, `recovery_with_premature_final_exit_after_constructive_reentry`, `recovery_with_stop_like_forced_exit_after_constructive_reentry`, `recovery_with_stop_like_forced_exit_before_rebound_after_constructive_reentry`, `repeated_trim_readd_with_constructive_reentry_followthrough`, `repeated_trim_readd_with_deteriorating_reentry`, `repeated_balanced_management_with_constructive_final_exit`, `repeated_balanced_management_with_missed_final_continuation`, `repeated_balanced_management_with_premature_final_exit`, `repeated_balanced_management_with_stop_like_forced_exit_after_breakdown`, `repeated_balanced_management_with_stop_like_forced_exit_before_rebound`, `repeated_constructive_reentry_with_premature_final_exit`, `repeated_constructive_reentry_with_constructive_final_exit`, `repeated_constructive_reentry_with_stop_like_forced_exit_after_breakdown`, `repeated_constructive_reentry_with_stop_like_forced_exit_before_rebound`, `repeated_deteriorating_reentry_with_defensive_final_exit`
- recovery-aware repeated rescue branches:
  `repeated_rescue_attempts_with_premature_final_exit_after_constructive_reentries`, `repeated_rescue_attempts_with_balanced_management_and_premature_final_exit`, `repeated_rescue_attempts_with_balanced_management_and_missed_final_continuation`, `repeated_rescue_attempts_with_balanced_management_and_constructive_final_exit`, `repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_after_breakdown`, `repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_before_rebound`, `repeated_rescue_attempts_with_constructive_final_exit_after_constructive_reentries`, `repeated_rescue_attempts_with_stop_like_forced_exit_after_constructive_reentries`, `repeated_rescue_attempts_with_stop_like_forced_exit_before_rebound_after_constructive_reentries`, `repeated_rescue_attempts_with_defensive_final_exit_after_deteriorating_reentries`
- repeated trim / re-add final-exit branches:
  `repeated_trim_readd_with_constructive_final_exit`, `repeated_trim_readd_with_fearful_final_exit`, `repeated_trim_readd_with_defensive_final_exit_after_deterioration`, `repeated_rescue_attempts_with_defensive_final_exit_after_deterioration`, `repeated_trim_readd_with_premature_final_exit`, `repeated_trim_readd_with_missed_final_continuation`, `repeated_balanced_management_with_fearful_final_exit`, `repeated_rescue_attempts_with_balanced_management_and_fearful_final_exit`, `repeated_balanced_management_with_defensive_final_exit_after_deterioration`, `repeated_rescue_attempts_with_balanced_management_and_defensive_final_exit_after_deterioration`
- risk-failure crossover:
  `aggressive_adding_with_failed_profit_protection`, `readd_after_delayed_risk_response`

### Resume note

If you only read one section of this catalog on a cold restart, read this hierarchy snapshot plus `src/docs/codex-project-log.md`. That will give you the fastest picture of what Layer 2 can currently express and which composites sit above the broader ingredients.

---

# Important Future Notes

## 1. This catalog reflects current implementation only

If thresholds or family structure change later, this file should be updated.

---

## 2. Some families currently emit only edge states

This applies especially to:

1. execution frequency
2. trade duration

Neutral states are not currently implemented.

---

## 3. Some structural concepts are intentionally not implemented yet

Examples include:

1. breakout-confirmation entry
2. richer cross-family exit and management journey composites above the new stop-like split and repeated constructive broad-summary lane
3. broader session-aware management structures
4. fuller positive whole-trade management structures beyond the current constructive trim / protect / under-press / add ladder, its paired premature-end variants, and the first timely-risk-response stop-like branch

Those require richer input context and belong to future expansions.

---

## 4. Layer 2 does not decide what matters most

This is a crucial limitation by design.

Layer 2 only detects what is true.
It does not decide:

1. primary pattern
2. supporting pattern
3. family priority
4. output importance

That is the job of Layer 3.

---

# Final Summary

Layer 2 now contains a substantial catalog of implemented structural trade patterns.

These patterns cover:

1. execution pacing
2. size building
3. reduction behavior
4. trade structure
5. duration extremes
6. excursion extremes
7. closure state
8. entry context
9. entry quality
10. exit quality
11. scaling quality

This catalog is the full implemented detection vocabulary of Layer 2 at the current project stage.


## Layer 2 Closeout Note: Centralized Family Constants

As part of Layer 2 closeout, the remaining family names were fully centralized in `pattern-detection-types.ts`.

This includes the later-added families:

1. `EXIT_QUALITY`
2. `SCALING_QUALITY`

That means Layer 2 now uses centralized family constants across all implemented pattern families rather than mixing shared constants with raw string family names.

This matters because Layer 3 will rely heavily on family-aware grouping, prioritization, and normalization.

Centralizing all family names before starting Layer 3 reduces the risk of:

1. naming drift
2. inconsistent grouping behavior
3. fragile suppression or prioritization logic
4. future refactor friction

At the end of Layer 2, family naming is now considered standardized and ready for Layer 3 consumption.

---

## Update: Support-Aware Pattern Surface

Layer 2 now includes a fully aligned support/resistance-aware surface built
from the Layer 1 structural-context bridge.

That surface now follows the same hierarchy used elsewhere in Layer 2:

- base support-aware patterns
- recovery-aware variants
- repeated-cycle variants

### `entry_near_support_structure`

### Pattern type
Composite

### Structural meaning
The first entry occurred near identified support and was not simultaneously
pinned under nearby resistance.

### Main evidence used

- `hadSupportResistanceContextAvailable`
- `firstEntryOccurredNearSupport`
- `firstEntryOccurredNearResistance`
- `firstEntryNearestSupportBelowPrice`
- `firstEntryDistanceToNearestSupportPct`
- `firstEntryNearestReferenceLevelLabel`

### `entry_under_resistance_structure`

### Pattern type
Composite

### Structural meaning
The first entry occurred near identified overhead resistance and was not
simultaneously sitting near support.

### Main evidence used

- `hadSupportResistanceContextAvailable`
- `firstEntryOccurredNearResistance`
- `firstEntryOccurredNearSupport`
- `firstEntryNearestResistanceAbovePrice`
- `firstEntryDistanceToNearestResistancePct`

### `breakout_with_room_above_structure`

### Pattern type
Composite

### Structural meaning
The first entry cleared nearby resistance and still retained real room above
instead of immediately crowding into the next overhead level.

### Main evidence used

- `hadSupportResistanceContextAvailable`
- `firstEntryClearedNearestResistanceBelow`
- `firstEntryHadRoomAboveAfterClearingResistance`
- `firstEntryDistanceAboveNearestResistanceBelowPct`
- `firstEntryDistanceToNearestResistancePct`
- `firstEntryCapturedPercentOfTradeMfe`
- `firstEntryToWorstMovePct`

### `breakout_into_overhead_resistance_structure`

### Pattern type
Composite

### Structural meaning
The first entry cleared nearby resistance but directly into stacked overhead
resistance instead of into real open air.

### Main evidence used

- `hadSupportResistanceContextAvailable`
- `firstEntryClearedNearestResistanceBelow`
- `firstEntryHasStackedResistanceAbove`
- `firstEntryResistanceLevelsAboveWithinClusterCount`
- `firstEntryHadRoomAboveAfterClearingResistance`
- `firstEntryCapturedPercentOfTradeMfe`
- `firstEntryToWorstMovePct`

### `breakout_with_room_above_and_constructive_final_exit`

### Pattern type
Composite

### Structural meaning
The first entry cleared nearby resistance with real room above, and the trade
still finished with constructive final-exit structure.

### Main evidence used

- `hadSupportResistanceContextAvailable`
- `firstEntryClearedNearestResistanceBelow`
- `firstEntryHadRoomAboveAfterClearingResistance`
- `firstEntryDistanceAboveNearestResistanceBelowPct`
- `firstEntryDistanceToNearestResistancePct`
- `firstEntryCapturedPercentOfTradeMfe`
- `firstEntryToWorstMovePct`
- `maxGivebackFromPeakOpenProfitPct`
- `maxAdverseMovePctAfterExit`
- `maxFavorableMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `breakout_into_overhead_resistance_with_defensive_final_exit`

### Pattern type
Composite

### Structural meaning
The first entry cleared nearby resistance directly into stacked overhead
resistance, and the trade later needed a disciplined defensive final exit.

### Main evidence used

- `hadSupportResistanceContextAvailable`
- `firstEntryClearedNearestResistanceBelow`
- `firstEntryHasStackedResistanceAbove`
- `firstEntryResistanceLevelsAboveWithinClusterCount`
- `firstEntryHadRoomAboveAfterClearingResistance`
- `firstEntryCapturedPercentOfTradeMfe`
- `firstEntryToWorstMovePct`
- `maxGivebackFromPeakOpenProfitPct`
- `maxAdverseMovePctAfterExit`
- `maxFavorableMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `breakout_into_overhead_resistance_with_failed_profit_protection`

### Pattern type
Composite

### Structural meaning
The first entry cleared nearby resistance directly into stacked overhead
resistance, still built meaningful open profit, and later gave too much of it
back.

### Main evidence used

- `hadSupportResistanceContextAvailable`
- `firstEntryClearedNearestResistanceBelow`
- `firstEntryHasStackedResistanceAbove`
- `firstEntryResistanceLevelsAboveWithinClusterCount`
- `firstEntryHadRoomAboveAfterClearingResistance`
- `firstEntryCapturedPercentOfTradeMfe`
- `firstEntryToWorstMovePct`
- `maxGivebackFromPeakOpenProfitPct`
- `peakOpenProfitPctOfBasis`

### `recovery_with_breakout_into_overhead_resistance_and_defensive_final_exit`

### Pattern type
Composite

### Structural meaning
The trade first recovered from early adversity, but the initial breakout still
cleared into stacked overhead resistance and later needed a disciplined
defensive final exit.

### Main evidence used

- `hadOpenLossBeforePeakOpenProfit`
- `hadPeakOpenProfitBeforeWorstDrawdown`
- `peakOpenProfitPctOfBasis`
- `realizedReturnPct`
- `hadSupportResistanceContextAvailable`
- `firstEntryClearedNearestResistanceBelow`
- `firstEntryHasStackedResistanceAbove`
- `firstEntryResistanceLevelsAboveWithinClusterCount`
- `firstEntryCapturedPercentOfTradeMfe`
- `firstEntryToWorstMovePct`
- `maxGivebackFromPeakOpenProfitPct`
- `maxAdverseMovePctAfterExit`
- `maxFavorableMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `recovery_with_breakout_into_overhead_resistance_and_failed_profit_protection`

### Pattern type
Composite

### Structural meaning
The trade first recovered from early adversity, but the initial breakout still
cleared into stacked overhead resistance and later gave too much open profit
back.

### Main evidence used

- `hadOpenLossBeforePeakOpenProfit`
- `hadPeakOpenProfitBeforeWorstDrawdown`
- `peakOpenProfitPctOfBasis`
- `hadSupportResistanceContextAvailable`
- `firstEntryClearedNearestResistanceBelow`
- `firstEntryHasStackedResistanceAbove`
- `firstEntryResistanceLevelsAboveWithinClusterCount`
- `firstEntryCapturedPercentOfTradeMfe`
- `firstEntryToWorstMovePct`
- `maxGivebackFromPeakOpenProfitPct`

### `breakout_with_room_above_and_failed_profit_protection`

### Pattern type
Composite

### Structural meaning
The first entry cleared nearby resistance with real room above, but open profit
still was not protected well enough later in the trade.

### Main evidence used

- `hadSupportResistanceContextAvailable`
- `firstEntryClearedNearestResistanceBelow`
- `firstEntryHadRoomAboveAfterClearingResistance`
- `firstEntryDistanceAboveNearestResistanceBelowPct`
- `firstEntryDistanceToNearestResistancePct`
- `firstEntryCapturedPercentOfTradeMfe`
- `firstEntryToWorstMovePct`
- `maxGivebackFromPeakOpenProfitPct`
- `peakOpenProfitPctOfBasis`

### `recovery_with_breakout_with_room_above_and_constructive_final_exit`

### Pattern type
Composite

### Structural meaning
The trade first recovered from early adversity, then the initial breakout still
cleared resistance with real room above and finished with constructive
final-exit structure.

### Main evidence used

- `hadOpenLossBeforePeakOpenProfit`
- `hadPeakOpenProfitBeforeWorstDrawdown`
- `peakOpenProfitPctOfBasis`
- `realizedReturnPct`
- `hadSupportResistanceContextAvailable`
- `firstEntryClearedNearestResistanceBelow`
- `firstEntryHadRoomAboveAfterClearingResistance`
- `firstEntryDistanceAboveNearestResistanceBelowPct`
- `firstEntryDistanceToNearestResistancePct`
- `firstEntryCapturedPercentOfTradeMfe`
- `firstEntryToWorstMovePct`
- `maxGivebackFromPeakOpenProfitPct`
- `maxAdverseMovePctAfterExit`
- `maxFavorableMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `recovery_with_breakout_with_room_above_and_failed_profit_protection`

### Pattern type
Composite

### Structural meaning
The trade first recovered from early adversity, then the initial breakout still
cleared resistance with real room above, but later gave too much open profit
back.

### Main evidence used

- `hadOpenLossBeforePeakOpenProfit`
- `hadPeakOpenProfitBeforeWorstDrawdown`
- `peakOpenProfitPctOfBasis`
- `hadSupportResistanceContextAvailable`
- `firstEntryClearedNearestResistanceBelow`
- `firstEntryHadRoomAboveAfterClearingResistance`
- `firstEntryDistanceAboveNearestResistanceBelowPct`
- `firstEntryDistanceToNearestResistancePct`
- `firstEntryCapturedPercentOfTradeMfe`
- `firstEntryToWorstMovePct`
- `maxGivebackFromPeakOpenProfitPct`

### `entry_far_from_support_structure`

### Pattern type
Composite

### Structural meaning
The first entry occurred meaningfully far from the nearest identified support.

### Main evidence used

- `hadSupportResistanceContextAvailable`
- `firstEntryDistanceToNearestSupportPct`
- `firstEntryOccurredNearSupport`
- `firstEntryOccurredInOpenAir`

### `exit_into_support_structure`

### Pattern type
Composite

### Structural meaning
The final exit occurred into nearby identified support.

### Main evidence used

- `hadSupportResistanceContextAvailable`
- `finalExitOccurredNearSupport`
- `finalExitDistanceToNearestSupportPct`

### `exit_into_support_with_relief_after_exit`

### Pattern type
Composite

### Structural meaning
The final exit occurred into nearby support and price relieved higher after the exit.

### Main evidence used

- `hadSupportResistanceContextAvailable`
- `finalExitOccurredNearSupport`
- `finalExitDistanceToNearestSupportPct`
- `maxFavorableMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `exit_into_support_before_breakdown`

### Pattern type
Composite

### Structural meaning
The final exit occurred into nearby support, but price still broke lower after
the exit instead of finding real support.

### Main evidence used

- `hadSupportResistanceContextAvailable`
- `finalExitOccurredNearSupport`
- `finalExitDistanceToNearestSupportPct`
- `finalExitSupportLevelsBelowWithinClusterCount`
- `finalExitHasStackedSupportBelow`
- `maxAdverseMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `exit_into_stacked_support_with_relief_after_exit`

### Pattern type
Composite

### Structural meaning
The final exit occurred into denser stacked support, and price relieved higher
after the exit.

### Main evidence used

- `hadSupportResistanceContextAvailable`
- `finalExitOccurredNearSupport`
- `finalExitDistanceToNearestSupportPct`
- `finalExitSupportLevelsBelowWithinClusterCount`
- `finalExitHasStackedSupportBelow`
- `maxFavorableMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `exit_into_thin_support_before_breakdown`

### Pattern type
Composite

### Structural meaning
The final exit occurred into thin support rather than denser stacked support,
and price still broke lower after the exit.

### Main evidence used

- `hadSupportResistanceContextAvailable`
- `finalExitOccurredNearSupport`
- `finalExitDistanceToNearestSupportPct`
- `finalExitSupportLevelsBelowWithinClusterCount`
- `finalExitHasStackedSupportBelow`
- `maxAdverseMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `exit_into_resistance_with_reversal_after_exit`

### Pattern type
Composite

### Structural meaning
The final exit occurred into nearby resistance and price reversed lower after
the exit instead of continuing through that overhead structure.

### Main evidence used

- `hadSupportResistanceContextAvailable`
- `finalExitOccurredNearResistance`
- `finalExitDistanceToNearestResistancePct`
- `finalExitResistanceLevelsAboveWithinClusterCount`
- `finalExitHasStackedResistanceAbove`
- `maxAdverseMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `exit_into_resistance_before_breakout`

### Pattern type
Composite

### Structural meaning
The final exit occurred into nearby resistance, but price later broke higher
through that overhead structure after the exit.

### Main evidence used

- `hadSupportResistanceContextAvailable`
- `finalExitOccurredNearResistance`
- `finalExitDistanceToNearestResistancePct`
- `finalExitResistanceLevelsAboveWithinClusterCount`
- `finalExitHasStackedResistanceAbove`
- `maxFavorableMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `stabilized_recovery_with_exit_into_stacked_support_and_relief`

### Pattern type
Composite

### Structural meaning
The trade first recovered from early adversity with timely stabilization, then
the final exit occurred into denser stacked support and price relieved higher
afterward.

### Main evidence used

- `hadOpenLossBeforePeakOpenProfit`
- `peakOpenProfitPctOfBasis`
- `hadPeakOpenProfitBeforeWorstDrawdown`
- `hadReductionAfterPeakOpenProfitBeforeWorstDrawdown`
- `secondsFromPeakOpenProfitToFirstReduction`
- `maxGivebackFromPeakOpenProfitPct`
- `hadSupportResistanceContextAvailable`
- `finalExitOccurredNearSupport`
- `finalExitSupportLevelsBelowWithinClusterCount`
- `finalExitHasStackedSupportBelow`
- `maxFavorableMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `stabilized_recovery_with_exit_into_resistance_and_reversal`

### Pattern type
Composite

### Structural meaning
The trade first recovered from early adversity with timely stabilization, then
the final exit occurred into nearby resistance and price reversed lower
afterward.

### Main evidence used

- `hadOpenLossBeforePeakOpenProfit`
- `peakOpenProfitPctOfBasis`
- `hadPeakOpenProfitBeforeWorstDrawdown`
- `hadReductionAfterPeakOpenProfitBeforeWorstDrawdown`
- `secondsFromPeakOpenProfitToFirstReduction`
- `maxGivebackFromPeakOpenProfitPct`
- `hadSupportResistanceContextAvailable`
- `finalExitOccurredNearResistance`
- `finalExitResistanceLevelsAboveWithinClusterCount`
- `finalExitHasStackedResistanceAbove`
- `maxAdverseMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `stabilized_recovery_with_exit_into_resistance_before_breakout`

### Pattern type
Composite

### Structural meaning
The trade first recovered from early adversity with timely stabilization, then
the final exit occurred into nearby resistance and price later broke higher
afterward.

### Main evidence used

- `hadOpenLossBeforePeakOpenProfit`
- `peakOpenProfitPctOfBasis`
- `hadPeakOpenProfitBeforeWorstDrawdown`
- `hadReductionAfterPeakOpenProfitBeforeWorstDrawdown`
- `secondsFromPeakOpenProfitToFirstReduction`
- `maxGivebackFromPeakOpenProfitPct`
- `hadSupportResistanceContextAvailable`
- `finalExitOccurredNearResistance`
- `finalExitResistanceLevelsAboveWithinClusterCount`
- `finalExitHasStackedResistanceAbove`
- `maxFavorableMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `stabilized_recovery_with_exit_into_thin_support_before_breakdown`

### Pattern type
Composite

### Structural meaning
The trade first recovered from early adversity with timely stabilization, then
the final exit occurred into thinner support and price still broke lower
afterward.

### Main evidence used

- `hadOpenLossBeforePeakOpenProfit`
- `peakOpenProfitPctOfBasis`
- `hadPeakOpenProfitBeforeWorstDrawdown`
- `hadReductionAfterPeakOpenProfitBeforeWorstDrawdown`
- `secondsFromPeakOpenProfitToFirstReduction`
- `maxGivebackFromPeakOpenProfitPct`
- `hadSupportResistanceContextAvailable`
- `finalExitOccurredNearSupport`
- `finalExitSupportLevelsBelowWithinClusterCount`
- `finalExitHasStackedSupportBelow`
- `maxAdverseMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `repeated_balanced_management_with_exit_into_stacked_support_and_relief`

### Pattern type
Composite

### Structural meaning
Repeated trim-and-readd management still later exited into denser stacked
support, and price relieved higher after the exit.

### Main evidence used

- `partialExitCount`
- `readdAfterReductionCount`
- `closedToFlat`
- `hadSupportResistanceContextAvailable`
- `finalExitOccurredNearSupport`
- `finalExitSupportLevelsBelowWithinClusterCount`
- `finalExitHasStackedSupportBelow`
- `maxFavorableMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `repeated_balanced_management_with_exit_into_thin_support_before_breakdown`

### Pattern type
Composite

### Structural meaning
Repeated trim-and-readd management still later exited into thinner support, and
price still broke lower afterward.

### Main evidence used

- `partialExitCount`
- `readdAfterReductionCount`
- `closedToFlat`
- `hadSupportResistanceContextAvailable`
- `finalExitOccurredNearSupport`
- `finalExitSupportLevelsBelowWithinClusterCount`
- `finalExitHasStackedSupportBelow`
- `maxAdverseMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `repeated_rescue_attempts_with_balanced_management_and_exit_into_stacked_support_and_relief`

### Pattern type
Composite

### Structural meaning
Repeated rescue attempts and balanced repeated management still later exited
into denser stacked support, and price relieved higher after the exit.

### Main evidence used

- `hadOpenLossBeforePeakOpenProfit`
- `hadPeakOpenProfitBeforeWorstDrawdown`
- `peakOpenProfitPctOfBasis`
- `partialExitCount`
- `readdAfterReductionCount`
- `closedToFlat`
- `hadSupportResistanceContextAvailable`
- `finalExitOccurredNearSupport`
- `finalExitSupportLevelsBelowWithinClusterCount`
- `finalExitHasStackedSupportBelow`
- `maxFavorableMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `repeated_rescue_attempts_with_balanced_management_and_exit_into_thin_support_before_breakdown`

### Pattern type
Composite

### Structural meaning
Repeated rescue attempts and balanced repeated management still later exited
into thinner support, and price still broke lower afterward.

### Main evidence used

- `hadOpenLossBeforePeakOpenProfit`
- `hadPeakOpenProfitBeforeWorstDrawdown`
- `peakOpenProfitPctOfBasis`
- `partialExitCount`
- `readdAfterReductionCount`
- `closedToFlat`
- `hadSupportResistanceContextAvailable`
- `finalExitOccurredNearSupport`
- `finalExitSupportLevelsBelowWithinClusterCount`
- `finalExitHasStackedSupportBelow`
- `maxAdverseMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `add_into_resistance_structure`

### Pattern type
Composite

### Structural meaning
One or more later adds occurred near nearby resistance or directly above it.

### Main evidence used

- `hadSupportResistanceContextAvailable`
- `addCountAfterInitialEntry`
- `addsNearResistanceCount`
- `addsAboveResistanceCount`
- `averageAddDistanceToNearestResistancePct`

### `trim_into_resistance_with_constructive_final_exit`

### Pattern type
Composite

### Structural meaning
One or more partial exits trimmed into nearby resistance, and the final exit
still avoided later damage.

### Main evidence used

- `hadSupportResistanceContextAvailable`
- `hadPartialExit`
- `totalPositionDecreaseCount`
- `reductionsNearResistanceCount`
- `averageReductionPriceVsPreviousAverageEntryPct`
- `maxGivebackFromPeakOpenProfitPct`
- `closedToFlat`
- `maxAdverseMovePctAfterExit`
- `maxFavorableMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `trim_into_resistance_with_premature_final_exit`

### Pattern type
Composite

### Structural meaning
One or more partial exits trimmed into nearby resistance, but the final exit
still came before breakout continuation persisted.

### Main evidence used

- `hadSupportResistanceContextAvailable`
- `hadPartialExit`
- `totalPositionDecreaseCount`
- `reductionsNearResistanceCount`
- `averageReductionPriceVsPreviousAverageEntryPct`
- `maxGivebackFromPeakOpenProfitPct`
- `closedToFlat`
- `maxFavorableMovePctAfterExit`
- `maxAdverseMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `recovery_with_trim_into_resistance_and_constructive_final_exit`

### Pattern type
Composite

### Structural meaning
The trade first had meaningful early adversity, later recovered, then partial
exits still trimmed into nearby resistance and the final exit remained
constructive.

### Main evidence used

- `hadOpenLossBeforePeakOpenProfit`
- `peakOpenProfitPctOfBasis`
- `realizedReturnPct`
- `hadSupportResistanceContextAvailable`
- `hadPartialExit`
- `totalPositionDecreaseCount`
- `reductionsNearResistanceCount`
- `averageReductionPriceVsPreviousAverageEntryPct`
- `maxGivebackFromPeakOpenProfitPct`
- `closedToFlat`
- `maxAdverseMovePctAfterExit`
- `maxFavorableMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `recovery_with_trim_into_resistance_and_premature_final_exit`

### Pattern type
Composite

### Structural meaning
The trade first had meaningful early adversity, later recovered, then partial
exits still trimmed into nearby resistance but the final exit still came before
breakout continuation persisted.

### Main evidence used

- `hadOpenLossBeforePeakOpenProfit`
- `peakOpenProfitPctOfBasis`
- `realizedReturnPct`
- `hadSupportResistanceContextAvailable`
- `hadPartialExit`
- `totalPositionDecreaseCount`
- `reductionsNearResistanceCount`
- `averageReductionPriceVsPreviousAverageEntryPct`
- `maxGivebackFromPeakOpenProfitPct`
- `closedToFlat`
- `maxFavorableMovePctAfterExit`
- `maxAdverseMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `balanced_management_with_take_profit_into_resistance_and_constructive_final_exit`

### Pattern type
Composite

### Structural meaning
Balanced whole-trade management included one or more nearby-resistance profit
takes, and the final exit still avoided later damage.

### Main evidence used

- `hadSupportResistanceContextAvailable`
- `totalPositionDecreaseCount`
- `reductionsNearResistanceCount`
- `balanced_position_management`
- `constructive_final_exit`

### `balanced_management_with_take_profit_into_resistance_and_premature_final_exit`

### Pattern type
Composite

### Structural meaning
Balanced whole-trade management included one or more nearby-resistance profit
takes, but the final exit still came before continuation fully played out.

### Main evidence used

- `hadSupportResistanceContextAvailable`
- `totalPositionDecreaseCount`
- `reductionsNearResistanceCount`
- `balanced_position_management`
- `premature_final_exit`

### `recovery_with_balanced_management_and_take_profit_into_resistance_and_constructive_final_exit`

### Pattern type
Composite

### Structural meaning
The trade first had meaningful early adversity, later stabilized into balanced
management, took profit into nearby resistance, and still finished with a
constructive final exit.

### Main evidence used

- `hadOpenLossBeforePeakOpenProfit`
- `peakOpenProfitPctOfBasis`
- `realizedReturnPct`
- `hadSupportResistanceContextAvailable`
- `totalPositionDecreaseCount`
- `reductionsNearResistanceCount`
- `balanced_position_management`
- `constructive_final_exit`

### `recovery_with_balanced_management_and_take_profit_into_resistance_and_premature_final_exit`

### Pattern type
Composite

### Structural meaning
The trade first had meaningful early adversity, later stabilized into balanced
management, took profit into nearby resistance, but the final exit still came
before continuation fully played out.

### Main evidence used

- `hadOpenLossBeforePeakOpenProfit`
- `peakOpenProfitPctOfBasis`
- `realizedReturnPct`
- `hadSupportResistanceContextAvailable`
- `totalPositionDecreaseCount`
- `reductionsNearResistanceCount`
- `balanced_position_management`
- `premature_final_exit`

### `repeated_balanced_management_with_trim_into_resistance_and_constructive_final_exit`

### Pattern type
Composite

### Structural meaning
Repeated trim-and-readd management kept trimming into nearby resistance, and
the final exit still avoided later damage.

### Main evidence used

- `partialExitCount`
- `readdAfterReductionCount`
- `hadSupportResistanceContextAvailable`
- `reductionsNearResistanceCount`
- `maxGivebackFromPeakOpenProfitPct`
- `closedToFlat`
- `maxAdverseMovePctAfterExit`
- `maxFavorableMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `repeated_balanced_management_with_trim_into_resistance_and_premature_final_exit`

### Pattern type
Composite

### Structural meaning
Repeated trim-and-readd management kept trimming into nearby resistance, but
the final exit still came before breakout continuation persisted.

### Main evidence used

- `partialExitCount`
- `readdAfterReductionCount`
- `realizedReturnPct`
- `hadSupportResistanceContextAvailable`
- `reductionsNearResistanceCount`
- `maxGivebackFromPeakOpenProfitPct`
- `closedToFlat`
- `maxFavorableMovePctAfterExit`
- `maxAdverseMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `repeated_rescue_attempts_with_balanced_management_and_trim_into_resistance_and_constructive_final_exit`

### Pattern type
Composite

### Structural meaning
Repeated rescue attempts still stabilized into balanced repeated management,
kept trimming into nearby resistance, and still ended with a disciplined
constructive final exit.

### Main evidence used

- `hadOpenLossBeforePeakOpenProfit`
- `hadPeakOpenProfitBeforeWorstDrawdown`
- `peakOpenProfitPctOfBasis`
- `partialExitCount`
- `readdAfterReductionCount`
- `hadSupportResistanceContextAvailable`
- `reductionsNearResistanceCount`
- `maxGivebackFromPeakOpenProfitPct`
- `closedToFlat`
- `maxAdverseMovePctAfterExit`
- `maxFavorableMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `repeated_balanced_management_with_take_profit_into_resistance_and_constructive_final_exit`

### Pattern type
Composite

### Structural meaning
Repeated trim-and-readd management included nearby-resistance profit taking,
and the final exit still avoided later damage.

### Main evidence used

- `partialExitCount`
- `readdAfterReductionCount`
- `hadSupportResistanceContextAvailable`
- `reductionsNearResistanceCount`
- `maxGivebackFromPeakOpenProfitPct`
- `closedToFlat`
- `maxAdverseMovePctAfterExit`
- `maxFavorableMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `repeated_balanced_management_with_take_profit_into_resistance_and_premature_final_exit`

### Pattern type
Composite

### Structural meaning
Repeated trim-and-readd management included nearby-resistance profit taking,
but the final exit still came before breakout continuation persisted.

### Main evidence used

- `partialExitCount`
- `readdAfterReductionCount`
- `realizedReturnPct`
- `hadSupportResistanceContextAvailable`
- `reductionsNearResistanceCount`
- `maxGivebackFromPeakOpenProfitPct`
- `closedToFlat`
- `maxFavorableMovePctAfterExit`
- `maxAdverseMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `repeated_rescue_attempts_with_balanced_management_and_trim_into_resistance_and_premature_final_exit`

### Pattern type
Composite

### Structural meaning
Repeated rescue attempts still stabilized into balanced repeated management,
kept trimming into nearby resistance, but the final exit still came before
breakout continuation persisted.

### Main evidence used

- `hadOpenLossBeforePeakOpenProfit`
- `hadPeakOpenProfitBeforeWorstDrawdown`
- `peakOpenProfitPctOfBasis`
- `partialExitCount`
- `readdAfterReductionCount`
- `realizedReturnPct`
- `hadSupportResistanceContextAvailable`
- `reductionsNearResistanceCount`
- `maxGivebackFromPeakOpenProfitPct`
- `closedToFlat`
- `maxFavorableMovePctAfterExit`
- `maxAdverseMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `repeated_rescue_attempts_with_balanced_management_and_take_profit_into_resistance_and_constructive_final_exit`

### Pattern type
Composite

### Structural meaning
Repeated rescue attempts still stabilized into balanced repeated management,
included nearby-resistance profit taking, and still ended with a disciplined
constructive final exit.

### Main evidence used

- `hadOpenLossBeforePeakOpenProfit`
- `hadPeakOpenProfitBeforeWorstDrawdown`
- `peakOpenProfitPctOfBasis`
- `partialExitCount`
- `readdAfterReductionCount`
- `hadSupportResistanceContextAvailable`
- `reductionsNearResistanceCount`
- `maxGivebackFromPeakOpenProfitPct`
- `closedToFlat`
- `maxAdverseMovePctAfterExit`
- `maxFavorableMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `repeated_rescue_attempts_with_balanced_management_and_take_profit_into_resistance_and_premature_final_exit`

### Pattern type
Composite

### Structural meaning
Repeated rescue attempts still stabilized into balanced repeated management,
included nearby-resistance profit taking, but the final exit still came before
breakout continuation persisted.

### Main evidence used

- `hadOpenLossBeforePeakOpenProfit`
- `hadPeakOpenProfitBeforeWorstDrawdown`
- `peakOpenProfitPctOfBasis`
- `partialExitCount`
- `readdAfterReductionCount`
- `realizedReturnPct`
- `hadSupportResistanceContextAvailable`
- `reductionsNearResistanceCount`
- `maxGivebackFromPeakOpenProfitPct`
- `closedToFlat`
- `maxFavorableMovePctAfterExit`
- `maxAdverseMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `add_above_resistance_structure`

### Pattern type
Composite

### Structural meaning
One or more later adds cleared nearby resistance and still retained room above,
rather than simply crowding directly into nearby overhead resistance.

### Main evidence used

- `hadSupportResistanceContextAvailable`
- `addCountAfterInitialEntry`
- `addsAboveResistanceCount`
- `addsAboveResistanceWithRoomCount`
- `averageAddRoomToNextResistancePct`

### `add_above_resistance_with_constructive_final_exit`

### Pattern type
Composite

### Structural meaning
One or more later adds cleared nearby resistance with room above, and the trade
still finished with constructive final-exit structure.

### Main evidence used

- `hadSupportResistanceContextAvailable`
- `addCountAfterInitialEntry`
- `addsAboveResistanceWithRoomCount`
- `averageAddRoomToNextResistancePct`
- `maxGivebackFromPeakOpenProfitPct`
- `closedToFlat`
- `maxAdverseMovePctAfterExit`
- `maxFavorableMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `add_above_resistance_with_failed_profit_protection`

### Pattern type
Composite

### Structural meaning
One or more later adds cleared nearby resistance with room above, but open
profit still was not protected well enough afterward.

### Main evidence used

- `hadSupportResistanceContextAvailable`
- `addCountAfterInitialEntry`
- `addsAboveResistanceWithRoomCount`
- `averageAddRoomToNextResistancePct`
- `maxGivebackFromPeakOpenProfitPct`
- `peakOpenProfitPctOfBasis`

### `recovery_with_add_above_resistance_and_constructive_final_exit`

### Pattern type
Composite

### Structural meaning
The trade first had meaningful early adversity, later recovered, then later
adds still cleared nearby resistance with room above, and the trade still
finished with constructive final-exit structure.

### Main evidence used

- `hadOpenLossBeforePeakOpenProfit`
- `peakOpenProfitPctOfBasis`
- `realizedReturnPct`
- `hadSupportResistanceContextAvailable`
- `addCountAfterInitialEntry`
- `addsAboveResistanceWithRoomCount`
- `averageAddRoomToNextResistancePct`
- `maxGivebackFromPeakOpenProfitPct`
- `closedToFlat`
- `maxAdverseMovePctAfterExit`
- `maxFavorableMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `recovery_with_add_above_resistance_and_failed_profit_protection`

### Pattern type
Composite

### Structural meaning
The trade first had meaningful early adversity, later recovered, then later
adds still cleared nearby resistance with room above, but profit protection
still failed afterward.

### Main evidence used

- `hadOpenLossBeforePeakOpenProfit`
- `peakOpenProfitPctOfBasis`
- `hadSupportResistanceContextAvailable`
- `addCountAfterInitialEntry`
- `addsAboveResistanceWithRoomCount`
- `averageAddRoomToNextResistancePct`
- `maxGivebackFromPeakOpenProfitPct`

### `repeated_adds_above_resistance_with_constructive_final_exit`

### Pattern type
Composite

### Structural meaning
Multiple later adds cleared nearby resistance with room above, and the trade
still finished with constructive final-exit structure.

### Main evidence used

- `hadSupportResistanceContextAvailable`
- `addCountAfterInitialEntry`
- `addsAboveResistanceCount`
- `addsAboveResistanceWithRoomCount`
- `averageAddRoomToNextResistancePct`
- `maxGivebackFromPeakOpenProfitPct`
- `closedToFlat`
- `maxAdverseMovePctAfterExit`
- `maxFavorableMovePctAfterExit`
- `netMovePctAtEndOfPostExitWindow`

### `repeated_adds_above_resistance_with_failed_profit_protection`

### Pattern type
Composite

### Structural meaning
Multiple later adds cleared nearby resistance with room above, but profit
protection still failed afterward.

### Main evidence used

- `hadSupportResistanceContextAvailable`
- `addCountAfterInitialEntry`
- `addsAboveResistanceCount`
- `addsAboveResistanceWithRoomCount`
- `averageAddRoomToNextResistancePct`
- `maxGivebackFromPeakOpenProfitPct`
- `peakOpenProfitPctOfBasis`

### Important note

These are the current honest support/resistance-aware patterns.

They do not yet imply:

- stacked resistance above
- richer breakout-clearance nuance beyond the first room-above and constructive-vs-failed-protection branches
- richer add-into-resistance or sell-into-support ladders beyond the first near-vs-above and constructive-vs-failed-protection splits

Those need deeper execution-to-level relation work first.
