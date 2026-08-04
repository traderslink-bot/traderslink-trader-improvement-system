# Trader Intelligence V3 Analytics Lab

## Complete Product And Implementation Plan

**Status:** Controlling implementation plan\
**Date:** 2026-07-28\
**Primary delivery order:** Analytics Lab first, then the curated analytics pages\
**Product baseline:** Existing light, Material-style Trader Intelligence dashboard

## 1. Decision Summary

Analytics Lab is the complete exploratory interface for the Trader Intelligence
V3 execution-analytics engine.

The other analytics pages already exist:

- Overview
- Performance
- Results
- Timing
- Execution
- Analytics Lab

Those pages must not become separate analytics implementations. Overview,
Performance, Results, Timing, and Execution are curated V3 views. Analytics Lab
is the flexible workspace containing the complete supported V3 execution
analytics inventory.

Discipline analytics belongs inside Execution and Analytics Lab. It does not
require another top-level page.

The Lab must let traders:

- choose the population they want to study;
- combine supported filters and groupings;
- select any registered V3 metrics compatible with the query;
- create multiple visualizations from the same analysis population;
- choose among all meaningful chart types for each result shape;
- cross-filter visualizations;
- compare compatible periods or populations;
- inspect bounded supporting and counterexample evidence;
- save, reopen, duplicate, rename, update, and delete personal views;
- preserve layout, chart, metric, filter, grouping, and comparison choices.

There is no recommendation label in the chart picker. A new visualization needs
an initial working display, but the product does not call it recommended,
preferred, best, or smarter.

The product must never offer a chart option that cannot produce a meaningful,
working visualization for the current V3 result shape.

## 2. Non-Negotiable Runtime Architecture

There is one execution-analytics runtime path:

```text
raw broker CSV
  -> V3 source-document and canonical-execution authority
  -> V3 FIFO reconstruction and analytical dataset
  -> V3 deterministic query engine
  -> authenticated server-only dashboard adapter
  -> browser-safe V3 packets
  -> Analytics Lab and curated analytics pages
```

The browser must not:

- import V3 query-engine internals;
- read raw V3 authority JSON;
- open SQLite execution stores;
- calculate P/L, fees, rates, expectancy, drawdown, giveback, streaks,
  attribution, or comparisons;
- infer missing financial values;
- combine currencies without governed conversion authority;
- turn unavailable values into zero;
- treat chart, candle, Coach, tag, note, or rule data as execution authority.

Every displayed execution statistic must come from a verified, authority-bound
V3 dashboard packet.

## 3. Separate Rules Database Boundary

The copied database described by the current local visualization setup is:

```text
C:\Users\jerac\.codex\visualizations\2026\07\29\019fab3a-4c1c-79d1-adfc-b3dc1b546e2a\trader-intelligence-private-data\trading-rules-v1.sqlite
```

The explicit local setting is:

```env
TRADER_INTELLIGENCE_RULES_DB_PATH=C:\Users\jerac\.codex\visualizations\2026\07\29\019fab3a-4c1c-79d1-adfc-b3dc1b546e2a\trader-intelligence-private-data\trading-rules-v1.sqlite
```

That database is the dedicated persistence store for the Trading Rules feature
implemented in the current development work. Trading Rules lets traders define,
configure, activate, pause, version, and review their own trading rules. The
database may power the rules dashboard after the visualization server restarts
and successfully opens it. It does not become V3 execution-analytics authority.

Rule definitions, versions, lifecycle state, evaluation records, and associated
evidence identities may live in the rules database. Rule-linked financial
results must still come from current V3 execution packets. The rules store must
not save duplicate calculated P/L totals and later present them as current V3
results.

Do not assume that the rules database is also the Analytics Lab saved-view
store. Saved views require their own explicit owner-scoped persistence contract
and schema. They may share a physical database only if the accepted architecture
deliberately defines a separate saved-view table/repository boundary. Do not
overload rule templates, rule instances, rule versions, or rule evaluations
with Lab layout state.

The external visualization directory may not be accessible to every Codex
runtime. Failure to access that copied database must produce an honest
rules-store-unavailable state without blocking the V3 execution-only Lab.

## 4. Confirmed V3 Capability Inventory

The V3 execution engine currently exposes:

- 12 capability families;
- 126 registered execution metrics;
- 32 grouping choices;
- 27 filter choices;
- aggregate, grouped, distribution, attribution, period-attribution, finding,
  and bounded-evidence operations;
- exact availability, limitation, sample, result, packet, and evidence
  identities.

### 4.1 Capability Families

| Capability | State | Product use |
| --- | --- | --- |
| Core performance | Exact execution authority | P/L, outcomes, expectancy, concentration |
| Daily and period performance | Exact execution authority | Calendar, day/week/month/year analysis |
| Time and session performance | Exact execution authority | Entry/exit time, sessions, transitions |
| Sequencing and behavior | Exact execution authority | Prior outcome, streaks, trade order, attempts |
| Pre-entry daily state | Exact execution authority | Green/red/flat and realized daily path |
| Ticker, price, size, hold, direction | Conditional | Requires complete corresponding execution facts |
| Broker and import source | Conditional | Requires uniform source authority |
| Giveback and drawdown | Exact execution authority | Realized intraday path only |
| Charges and fee impact | Conditional | Named commissions require reconciled charge kinds |
| Deterministic findings and samples | Exact execution authority | Non-causal, evidence-linked findings |
| Tags and import metadata | Unsupported in current V3 row | Requires new governed authority |
| Market and exit quality | Future engine | Requires candle/market/alternative-outcome authority |

## 5. Complete Registered Metric Inventory

The following 126 metric keys are the controlling metric target list.

### 5.1 Population, Coverage, And Data Quality

1. `candidate_count`
2. `included_count`
3. `excluded_count`
4. `inclusion_rate`
5. `exclusion_rate`
6. `trading_day_count`
7. `unique_account_count`
8. `unique_symbol_count`
9. `total_execution_count`
10. `average_executions_per_trade`
11. `limited_analytical_trade_count`
12. `missing_charge_coverage_trade_count`
13. `missing_share_quantity_authority_count`
14. `missing_entry_notional_authority_count`
15. `unavailable_source_authority_trade_count`
16. `manual_entry_trade_count`
17. `broker_import_trade_count`
18. `legacy_migration_trade_count`

### 5.2 Trading Activity, Direction, And Attempts

19. `total_trades`
20. `average_trades_per_trading_day`
21. `median_trades_per_trading_day`
22. `maximum_trades_per_trading_day`
23. `minimum_trades_per_trading_day`
24. `long_trade_count`
25. `short_trade_count`
26. `long_trade_percentage`
27. `short_trade_percentage`
28. `average_attempts_per_symbol`
29. `median_attempts_per_symbol`
30. `repeat_attempt_trade_count`
31. `repeat_attempt_percentage`

### 5.3 Gross, Charges, And Net Results

32. `gross_profit`
33. `gross_loss`
34. `gross_pnl`
35. `average_gross_pnl`
36. `median_gross_pnl`
37. `signed_charges`
38. `average_signed_charges`
39. `median_signed_charges`
40. `commission_signed_charges`
41. `average_commission_signed_charges`
42. `median_commission_signed_charges`
43. `gross_net_difference`
44. `fees_as_percentage_of_gross_profit`
45. `fees_as_percentage_of_gross_loss`
46. `net_pnl`
47. `average_pnl`
48. `median_pnl`
49. `average_daily_pnl`
50. `median_daily_pnl`
51. `best_trade`
52. `worst_trade`
53. `best_trading_day`
54. `worst_trading_day`

### 5.4 Outcomes And Result Quality

55. `win_count`
56. `loss_count`
57. `flat_count`
58. `win_rate`
59. `loss_rate`
60. `flat_rate`
61. `average_winning_trade`
62. `median_winning_trade`
63. `average_losing_trade`
64. `median_losing_trade`
65. `total_winning_net_pnl`
66. `total_losing_net_pnl`
67. `average_win_loss_ratio`
68. `median_win_loss_ratio`
69. `profit_factor`
70. `expectancy`
71. `breakeven_win_rate`

### 5.5 Holding Time

72. `average_holding_time`
73. `median_holding_time`
74. `minimum_holding_time`
75. `maximum_holding_time`
76. `average_winner_holding_time`
77. `average_loser_holding_time`
78. `median_winner_holding_time`
79. `median_loser_holding_time`

### 5.6 Share Quantity And Entry Notional

80. `average_share_quantity`
81. `median_share_quantity`
82. `maximum_share_quantity`
83. `average_winner_share_quantity`
84. `median_winner_share_quantity`
85. `average_loser_share_quantity`
86. `median_loser_share_quantity`
87. `average_entry_notional`
88. `median_entry_notional`
89. `maximum_entry_notional`
90. `average_winner_entry_notional`
91. `average_loser_entry_notional`
92. `median_winner_entry_notional`
93. `median_loser_entry_notional`
94. `net_pnl_per_100_shares`
95. `return_on_entry_notional`

### 5.7 Daily Outcomes

96. `profitable_trading_day_count`
97. `losing_trading_day_count`
98. `flat_trading_day_count`
99. `profitable_day_percentage`
100. `losing_day_percentage`
101. `flat_day_percentage`
102. `average_green_day_pnl`
103. `median_green_day_pnl`
104. `average_red_day_pnl`
105. `median_red_day_pnl`
106. `maximum_intraday_drawdown`

### 5.8 Streaks And Concentration

107. `longest_winning_trade_streak`
108. `longest_losing_trade_streak`
109. `current_winning_trade_streak`
110. `current_losing_trade_streak`
111. `net_pnl_excluding_largest_winner`
112. `net_pnl_excluding_largest_loser`
113. `net_pnl_excluding_largest_winner_and_loser`
114. `largest_winner_contribution`
115. `largest_loser_contribution`

### 5.9 Position Size And Realized Daily Path

116. `average_position_size`
117. `median_position_size`
118. `maximum_intraday_realized_drawdown`
119. `maximum_peak_profit_giveback`
120. `maximum_intraday_realized_recovery_from_trough`
121. `average_peak_profit_giveback`
122. `median_peak_profit_giveback`
123. `days_with_peak_profit_giveback`
124. `days_with_realized_drawdown`
125. `green_to_red_day_count`
126. `red_to_green_day_count`

### 5.10 Metric Count Reconciliation

The runtime registry contains 126 metric keys. Earlier product discussion
referred to 125; the earlier count was incorrect. The complete list above and
the runtime registry are the controlling target. No metric may be silently
omitted to preserve the earlier count.

## 6. Complete Grouping Inventory

The following 32 grouping keys are the controlling grouping target list:

1. `aggregate`
2. `day`
3. `week`
4. `month`
5. `weekday`
6. `year`
7. `session`
8. `entry_session`
9. `exit_session`
10. `session_transition`
11. `time_bucket`
12. `entry_price_range`
13. `price_range`
14. `trade_sequence`
15. `trade_sequence_bucket`
16. `previous_completed_outcome`
17. `prior_completed_streak_bucket`
18. `pre_entry_daily_state`
19. `repeat_attempt`
20. `repeat_attempt_bucket`
21. `holding_time_bucket`
22. `share_quantity_bucket`
23. `entry_notional_bucket`
24. `position_size_bucket`
25. `direction`
26. `symbol`
27. `account`
28. `source_identity`
29. `broker_code`
30. `source_kind`
31. `charge_coverage`
32. `compound`

Aliases such as `price_range` and `position_size_bucket` must compile to their
canonical V3 grouping representation. The UI can use friendly names but must
preserve canonical query semantics.

## 7. Complete Filter Inventory

The following 27 filter keys are the controlling filter target list:

1. `date_range`
2. `account`
3. `symbol`
4. `source_identity`
5. `broker_code`
6. `source_kind`
7. `charge_coverage`
8. `direction`
9. `session`
10. `entry_session`
11. `exit_session`
12. `session_transition`
13. `currency`
14. `realized_outcome`
15. `weekday`
16. `entry_time_range`
17. `exit_time_range`
18. `entry_price_range`
19. `sequence_in_session`
20. `previous_completed_outcome`
21. `prior_completed_streak`
22. `pre_entry_daily_state`
23. `pre_entry_daily_path`
24. `holding_time_seconds`
25. `repeat_attempt`
26. `share_quantity_range`
27. `entry_notional_range`

### 7.1 User-Facing Filter Meanings

- Ticker search supports one or multiple verified symbols.
- Stock-price filtering means verified execution entry price, not candle-range
  or market-price history.
- Sessions include premarket, regular, after-hours, overnight, and explicit
  unavailable/not-applicable states supported by V3.
- Entry and exit time ranges are user-selected time-of-day bounds.
- Time-bucket groupings support valid V3 minute buckets.
- Position-size filtering uses verified entry notional.
- Share-size filtering uses verified share quantity.
- Repeat attempts use V3 canonical owner/account/session/symbol order.
- Previous outcome and streak analysis use canonical completed-trade order.
- Pre-entry daily state uses realized P/L known before the later entry.
- Currency remains isolated by partition unless a future conversion authority
  is explicitly added.

## 8. Comparison Inventory

The Lab must support compatible comparisons through V3 query and
period-attribution packets.

### 8.1 Period Comparisons

- custom date range versus custom date range;
- current week versus previous week;
- current month versus previous month;
- current quarter-like custom scope versus previous compatible scope;
- before a selected date versus after it;
- saved population A versus compatible saved population B.

### 8.2 Population Comparisons

- ticker versus ticker;
- premarket versus regular versus after-hours;
- entry session versus exit session;
- long versus short;
- gain versus loss versus flat;
- first trade versus later trades;
- first attempt versus repeat attempts;
- previous win versus previous loss;
- short hold versus long hold;
- small share/notional band versus larger band;
- weekday versus weekday;
- broker/source versus broker/source when authority is uniform;
- followed versus broken rule populations when the future rule-evaluation
  packet exists.

### 8.3 Comparison Results

- baseline and comparison counts;
- baseline and comparison net P/L;
- absolute change;
- trade-frequency effect;
- trade-mix effect;
- average-result effect;
- reconciliation difference;
- compatible differences for win rate, expectancy, profit factor, average and
  median result, holding time, fee impact, and realized daily-path metrics.

The UI must disclose comparison denominator, date scope, population, currency,
sample status, and limitations.

## 9. Analytics Lab Information Architecture

The page begins with:

- page title: `Analytics Lab`;
- optional concise subtitle;
- saved-view control;
- save/update-view action;
- global date, account, currency, and filter controls.

It does not begin with a generic `What changed?` summary.

### 9.1 Main Workspace

```text
Analytics Lab                              [Saved views] [Save view]

[Date range] [Account] [Currency] [Filters] [Compare] [Reset]

[Add visualization] [Results grid] [Evidence]

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Visualization            â”‚ Visualization            â”‚
â”‚ metric/group/chart       â”‚ metric/group/chart       â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Visualization            â”‚ Visualization            â”‚
â”‚ metric/group/chart       â”‚ metric/group/chart       â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ V3 results/pivot grid and bounded evidence          â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

The workspace supports:

- add visualization;
- duplicate visualization;
- resize;
- reorder;
- remove;
- edit metric selection;
- edit grouping;
- edit filters inherited from or local to the card;
- edit valid chart presentation;
- toggle cross-filter participation;
- open evidence;
- expand;
- export browser-safe result data when later authorized.

## 10. Visualization Inventory

The Lab should support the following visualization families when compatible
with the returned packet:

1. metric card;
2. vertical bar;
3. horizontal bar;
4. diverging bar;
5. grouped bar;
6. stacked bar;
7. 100% stacked bar;
8. line;
9. cumulative line;
10. area;
11. positive/negative P/L bars plus cumulative line;
12. calendar heatmap;
13. categorical heatmap;
14. time-of-day heatmap;
15. histogram;
16. box plot;
17. scatter plot;
18. bubble plot;
19. treemap;
20. waterfall;
21. session-transition flow;
22. transition matrix;
23. drawdown/giveback area;
24. range bar;
25. small multiples/faceted chart;
26. detailed table;
27. pivot-style results grid.

Pie and donut charts should be excluded unless a later product decision
identifies a mutually exclusive, whole-population composition where they add
more value than a stacked bar.

## 11. Chart Compatibility Contract

The chart menu shows only visualizations that produce a meaningful result for
the current packet and field configuration.

There is no recommendation section.

| Result shape | Valid visualization families |
| --- | --- |
| Single exact metric | Metric card, table |
| Ordered time series | Line, cumulative line, area, bars, combined bars/line, table |
| Positive/negative period values | Diverging bars, vertical bars, calendar heatmap, table |
| Categorical breakdown | Horizontal/vertical/diverging/grouped bars, heatmap, treemap, table |
| Mutually exclusive composition | 100% stacked bar, stacked bar, table |
| Numeric distribution packet | Histogram, box plot, table |
| Two numeric dimensions | Scatter, bubble, table |
| Two categorical dimensions | Heatmap, grouped bars, small multiples, table |
| Period attribution packet | Waterfall, contribution bars, table |
| Entry-to-exit session transition | Flow, transition matrix, grouped bars, table |
| Trade sequence or attempt order | Bars, line, heatmap, small multiples, table |
| Realized drawdown/giveback path | Area, waterfall, range bar, table |
| Bounded evidence page | Table; timeline only when chronology is explicit |

Compatibility is determined from:

- packet kind;
- grouping type;
- metric unit;
- metric availability;
- dimensionality;
- ordering semantics;
- sample state;
- result count;
- whether an axis is temporal, ordinal, or quantitative.

The UI must never:

- render a line without a meaningful ordered axis;
- render a histogram from category totals;
- render a scatter plot without two numeric dimensions;
- render a flow chart without a transition dimension;
- use area to imply a continuous quantity where only unordered categories
  exist;
- silently change an unavailable metric into zero;
- make a causal claim from visual correlation.

If edits make the current chart incompatible, the visualization must switch to
a deterministic valid fallback and state that the display changed because the
previous presentation no longer matched the selected result shape. The user is
then free to select any other currently valid chart.

## 12. Cross-Filtering And Drill-Down

Selecting a chart mark may:

- apply a temporary Lab cross-filter;
- highlight related marks in participating charts;
- filter the results grid;
- update included/excluded counts;
- expose the exact selected group identity;
- open bounded evidence.

Cross-filter state must be visible and removable.

Cross-filtering creates a new bounded V3 request or selects a group already
present in a verified packet. It must not calculate new financial results from
browser-held rows.

Every aggregate result must retain:

- query-plan identity;
- result identity;
- authority identity;
- partition identity;
- execution receipt identity;
- evidence identity;
- sample and limitation state.

## 13. Saved Views

Saved views are a first-class product feature.

### 13.1 Saved View Content

A saved view stores:

- stable view ID;
- owner scope;
- name;
- optional description;
- schema version;
- created and updated timestamps;
- global date-scope definition;
- account and currency scope;
- global filters;
- comparison configuration;
- visualization list;
- visualization order and layout;
- per-visualization metric keys;
- grouping and secondary grouping;
- valid chart type;
- axis/channel configuration;
- color and size channels;
- facets;
- bucket definitions;
- sorting;
- local visualization filters;
- cross-filter participation;
- results-grid columns and sorting;
- evidence-panel preferences;
- source capability/catalog version;
- stale/migration state.

Saved views store query definitions and presentation choices, not duplicated
financial totals.

### 13.2 Saved View Actions

- Save as new
- Update current
- Duplicate
- Rename
- Delete
- Reset to last saved
- Open
- Search
- Sort by recently updated or name
- Pin
- Copy a curated page into the Lab

### 13.3 Saved View Validation

When opened:

- validate owner scope;
- validate all metrics, filters, and groupings against current registries;
- validate every chart against current result shape;
- remove no unsupported element silently;
- preserve a migration explanation;
- show unavailable data states honestly;
- keep the original view recoverable when a non-destructive migration is
  possible.

## 14. Curated Page Integration

### 14.1 Overview

Use a compact core-performance V3 view:

- net and gross P/L;
- expectancy;
- win rate;
- profit factor;
- total trades and trading days;
- fees;
- current streak;
- concentration;
- data-quality status;
- evidence access.

### 14.2 Performance

- calendar;
- day/week/month/year series;
- daily results;
- profitable/losing/flat days;
- best/worst day;
- realized drawdown and giveback;
- period comparison;
- attribution.

### 14.3 Results

- winner/loss/flat composition;
- average and median outcomes;
- expectancy and profit factor;
- P/L distributions;
- concentration and outliers;
- largest-winner/loser dependence;
- fee effects.

### 14.4 Timing

- weekday;
- entry time;
- exit time;
- time buckets;
- entry session;
- exit session;
- session transitions;
- holding-time buckets.

### 14.5 Execution

- ticker;
- direction;
- entry-price bands;
- shares and notional;
- broker/source;
- trade sequence;
- repeat attempts;
- previous result;
- streak context;
- pre-entry daily state;
- realized daily path;
- drawdown/giveback discipline.

Every curated page includes `Open in Analytics Lab`. That action creates an
editable Lab view from the same V3 query definition and visualization
configuration.

## 15. Starter Views

Starter views are product-provided saved definitions, not separate
calculations:

- Core performance
- Calendar and period performance
- Results quality
- Time of day
- Sessions and transitions
- Ticker contribution
- Long versus short
- Entry-price bands
- Position-size bands
- Holding-time analysis
- First trade versus later trades
- Repeat attempts
- Performance after a win
- Performance after a loss
- Prior streak context
- Green/red/flat before entry
- Peak-profit giveback
- Realized drawdown
- Fee impact
- Data-quality coverage

Starter views have ordinary names. They are not recommendations.

## 16. User-Facing Availability States

Every metric or visualization must support:

- available;
- available with limitations;
- insufficient sample;
- unavailable because authority is missing;
- unavailable because a denominator is zero;
- unavailable because named fee allocation is incomplete;
- unavailable because source authority is mixed;
- unavailable because chronology is ambiguous;
- unsupported by the execution engine;
- reserved for a future governed provider.

Examples:

- `Entry notional is unavailable for 14 of 63 included trades.`
- `Named commission statistics require reconciled charge-kind allocation.`
- `This session comparison is unavailable because entry session could not be
  verified for the selected population.`
- `Chart-based exit quality requires market/candle authority and is not an
  execution-only statistic.`

## 17. Accessibility And Visual Design

Preserve the existing light Material dashboard baseline.

- White and lightly tinted surfaces
- Restrained blue/indigo interaction color
- Green/red reserved primarily for financial outcomes
- Neutral color for unavailable and incomplete authority
- Pattern, icon, label, or position cues in addition to color
- Keyboard-operable chart and filter controls
- Text alternatives for charts
- Focus-visible states
- Accessible tooltips
- Table equivalent for every chart
- Responsive layout without hiding evidence or limitation states
- Reduced-motion support

Charts should be visually strong through hierarchy, spacing, typography,
contrast, annotation, and interaction rather than decorative gradients or
unnecessary animation.

## 18. Server API And Packet Plan

Implement authenticated, versioned server operations under a bounded namespace
such as:

```text
/api/intelligence/execution-analytics/v1/capabilities
/api/intelligence/execution-analytics/v1/query
/api/intelligence/execution-analytics/v1/distribution
/api/intelligence/execution-analytics/v1/attribution
/api/intelligence/execution-analytics/v1/period-attribution
/api/intelligence/execution-analytics/v1/findings
/api/intelligence/execution-analytics/v1/evidence
/api/intelligence/execution-analytics/v1/saved-views
```

The server:

- derives owner identity from authentication;
- resolves allowed accounts and currencies;
- loads current V3 authority;
- builds the verified analytical dataset;
- creates a compatible partition;
- validates filters, groupings, metrics, limits, ordering, and pagination;
- runs the V3 adapter;
- builds browser-safe packets;
- applies private/no-store response policy;
- records no duplicate financial result as saved-view state.

The client:

- constructs only accepted request contracts;
- renders packets;
- formats exact values;
- manages layout and exploration state;
- never calculates financial analytics.

## 19. Implementation Milestones

### Milestone 0 â€” Inventory And Ownership Lock

- Confirm runtime metric count and correct this plan if required.
- Confirm the complete filter, grouping, capability, and packet registries.
- Record file ownership for concurrent Codex sessions.
- Keep work isolated to V3 adapter/API, Analytics Lab, chart components,
  saved-view contracts, and focused tests.

**Exit condition:** the full controlling inventory is exact and no shared-file
collision is expected.

### Milestone 1 â€” Configured V3 Authority Resolver

- Resolve authenticated owner/account/currency/date authority.
- Load persisted V3 source-document receipts and current authority attachment.
- Rebuild verified dataset and partition.
- Prove restart identity.
- Return honest unavailable states.

**Exit condition:** server code can query durable V3 authority without legacy
SQLite analytics.

### Milestone 2 â€” Complete Lab API

- Implement capabilities, generic query, distribution, attribution,
  period-attribution, findings, and evidence operations.
- Enforce bounded requests.
- Add packet serialization and error contracts.
- Add route authorization and containment.

**Exit condition:** every current V3 packet type is available through a safe
server boundary.

### Milestone 3 â€” Analytics Lab Foundation

- Build global scope bar.
- Build filter editor covering all 27 filters.
- Build grouping editor covering all 32 groupings.
- Build metric selector covering the accepted runtime registry.
- Build comparison editor.
- Build results grid.
- Build evidence drawer.

**Exit condition:** the trader can execute and inspect the complete V3 query
surface without saved views or multi-chart layout.

### Milestone 4 â€” Visualization Canvas

- Add multi-visualization canvas.
- Add chart compatibility registry.
- Implement all accepted visualization families incrementally.
- Add cross-filtering.
- Add faceting/small multiples.
- Add responsive resize/reorder/remove/duplicate behavior.

**Exit condition:** every offered chart works for its accepted packet shape and
every supported result family has at least one complete visualization path.

### Milestone 5 â€” Saved Views

- Confirm saved-view persistence location and schema.
- Add owner-scoped immutable identity and mutable current definition.
- Add save/open/update/duplicate/rename/delete/pin/search.
- Add schema migration and stale-view handling.
- Prove restart persistence.

**Exit condition:** complete Lab experiments survive restart and preserve their
working visualization layout.

### Milestone 6 â€” Curated Page Reuse

- Convert Overview, Performance, Results, Timing, and Execution to curated V3
  views.
- Add `Open in Analytics Lab`.
- Ensure no page calculates its own execution statistic.
- Place discipline within Execution and Lab.

**Exit condition:** all analytics pages consume the same adapter and view
contracts.

### Milestone 7 â€” Rules Integration

- Restart and verify the local visualization can open the copied rules DB.
- Confirm the Rules feature supports trader-created and configured rule
  definitions, versions, activation state, and evaluation history.
- Keep rule financial analytics sourced from V3 packets.
- Add rule dimensions/presets only after accepted rule evaluation contracts
  exist.
- Integrate followed/broken and affected-action views without causal claims.

**Exit condition:** rules can participate in the Lab without becoming a second
financial analytics engine.

### Milestone 8 â€” Final Acceptance

- Complete full inventory coverage audit.
- Complete browser interaction and accessibility verification.
- Complete production build.
- Run V3 engine verification gates.
- Prove all chart-menu entries work.
- Prove incompatible chart types never appear.
- Prove saved views survive restart.
- Prove evidence and limitation identities remain intact.

**Exit condition:** the owner accepts the Analytics Lab design, behavior,
accuracy, and saved-view workflow.

## 20. Testing Cadence

Follow the repository testing cadence:

- During active implementation, run focused tests for the exact adapter,
  contract, component, or visualization changed.
- After each complete milestone, run the relevant V3 engine-level verification.
- Run full regression, architecture checks, production build, browser/E2E, and
  large proof tests only at checkpoint or final acceptance boundaries.

### 20.1 Required Focused Proofs

| Area | Required proof |
| --- | --- |
| Resolver | Owner/account/currency isolation and restart identity |
| Query | All registered filter/grouping/metric contracts are reachable |
| Chart compatibility | Every visible chart works; invalid charts are absent |
| Formatting | Client does not change exact engine values |
| Cross-filter | Selected marks compile to bounded V3 requests |
| Evidence | Aggregate selections open matching bounded evidence |
| Saved views | Owner isolation, restart persistence, validation, migration |
| Comparisons | Baseline/comparison denominators and attribution reconcile |
| Limitations | Unavailable and limited states never render as zero |
| Rules | Financial values remain V3 packet values |
| Architecture | Browser imports no query, persistence, or raw authority internals |

## 21. Collaboration Rules

Because multiple Codex sessions may share this worktree:

- inspect `git status` before every implementation slice;
- treat pre-existing changes as belonging to another session;
- use new, V3-specific files where practical;
- declare ownership before editing shared routes or components;
- avoid repository-wide formatting;
- avoid modifying the currently active legacy analytics client until the Lab
  handoff requires it;
- sequence edits to shared navigation, theme, and project-log files;
- run focused verification during implementation;
- update the project log only when the resume point materially changes.

## 22. Completion Definition

Analytics Lab is complete when:

- durable V3 imported execution authority powers it;
- the accepted runtime registry inventory is fully represented;
- traders can search/filter by ticker, entry price, session, hour/time range,
  date, direction, result, size, holding time, sequence, attempts, streaks,
  daily state, source, and charge coverage;
- traders can group and compare supported populations;
- traders can create multiple working charts on one canvas;
- only meaningful chart choices are offered;
- cross-filtering and bounded evidence work;
- complete views can be saved and restored;
- curated analytics pages reuse Lab/V3 definitions;
- rules integration remains separate from financial authority;
- unavailable and unsupported facts are explicit;
- no legacy SQLite analytics fallback or browser-side financial calculation
  remains in the new V3 dashboard path.
