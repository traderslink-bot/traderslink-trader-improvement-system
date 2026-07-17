# Trader Intelligence AI Journal v3 Master Plan

**Date:** 2026-07-17 America/Toronto  
**Status:** Proposed replacement architecture  
**Repository:** `traderslink-bot/traderslink-trader-improvement-system`  
**Target product area:** `/intelligence`  
**Planning authority:** This document supersedes the older Trader Intelligence product and coaching plans wherever they conflict with this plan. Older documents remain useful as implementation history and evidence of completed work, but they no longer control the future intelligence architecture.

---

## 1. Executive Decision

The correct path is **not a complete rewrite of the website and not a continuation of the current coaching architecture**.

The new system should:

1. **Keep the trustworthy foundation** already present in the repository:
   - multi-broker CSV ingestion;
   - deterministic row validation;
   - execution normalization;
   - file and trade fingerprinting;
   - duplicate protection;
   - flat-to-flat trade reconstruction;
   - partial entry and partial exit support;
   - saved imports and saved trades;
   - execution-only calculations;
   - historical candle hydration through `levels-system-v2`;
   - the `/intelligence` route namespace;
   - current regression fixtures and automated test coverage.
2. **Replace the current intelligence and coaching center of gravity**:
   - deterministic pattern scoring must no longer be treated as the final interpretation layer;
   - fixed coaching templates must no longer be the primary end-user coach;
   - raw or nearest support/resistance levels must not independently create buy, sell, good-trade, bad-trade, or discipline conclusions;
   - route-specific copied conclusions must be replaced by shared evidence-backed findings.
3. **Add a new evidence-first AI architecture**:
   - deterministic feature calculations;
   - reusable analytics tools;
   - reusable counterfactual simulation tools;
   - a statistical evidence service;
   - structured findings with source-trade links;
   - an AI question router and explanation layer;
   - daily and weekly batch reports;
   - model usage and cost controls;
   - user correction and feedback loops.
4. **Treat the new version as Trader Intelligence v3**, even if the public product keeps the existing Trader Intelligence name.

The guiding product rule is:

> Code calculates the truth. The AI selects, connects, and explains the truth.

The language model must never be responsible for calculating P/L, grouping executions, calculating indicators, reconstructing positions, deciding whether rows are duplicates, or inventing missing market data.

---

## 2. Current Repository Assessment

### 2.1 What is already valuable

The repository is significantly more advanced than a basic journal prototype.

The existing CSV lane in [`src/lib/execution-sources/csv/`](../lib/execution-sources/csv/) already supports:

- IBKR activity/Flex-style files;
- Moomoo trade history;
- Webull order history;
- Robinhood transaction history;
- Schwab transactions;
- generic mapped execution CSVs;
- broker auto-detection;
- explicit column mapping;
- timezone handling;
- fees and commission fields;
- options quarantine;
- rejected/skipped/accepted row outcomes;
- file fingerprints;
- request fingerprints;
- duplicate-request detection;
- trade-grouping diagnostics;
- import confidence and repair information.

The current persistence lane in [`src/lib/trader-analytics/product/import-commit/`](../lib/trader-analytics/product/import-commit/) already models:

- import batches;
- import rows and issues;
- repair items;
- normalized executions;
- saved trades;
- trade-to-execution links;
- execution-feedback summaries;
- chart/decision-review jobs and snapshots;
- saved reports;
- notes;
- checklist state;
- import repair events.

The existing analysis stack already includes:

- raw trade timeline construction;
- session and lifecycle facts;
- execution-only feedback;
- entry/add/reduction/exit pattern detection;
- MFE/MAE-adjacent trade movement facts in the candle-aware path;
- ticker-story and session-story concepts;
- chart evidence gating;
- no-lookahead safeguards;
- substantial Vitest and Playwright coverage.

These parts represent a large amount of useful engineering work and should be preserved.

### 2.2 What should change

The current system has accumulated several overlapping intelligence layers:

- raw facts;
- support/resistance relations;
- pattern input;
- pattern detection;
- pattern normalization;
- pattern scoring;
- behavior mapping;
- fixed coaching templates;
- trader-level aggregation;
- route-specific product read models.

That architecture was useful for proving that deterministic coaching could be built, but it is becoming too difficult to calibrate and too rigid for the questions the new product must answer.

The main problems are:

1. **Pattern and copy expansion**
   - New behavior requires a detector, metadata, suppression rules, score calibration, mapper coverage, user-facing wording, route handoffs, tests, and documentation.
   - The system can become technically consistent while still producing feedback that does not feel useful.

2. **Support/resistance over-density**
   - When many levels exist in a tight price range, nearest-level logic can produce technically true but practically meaningless observations.
   - A trader can appear to be near both support and resistance at the same time.
   - Small differences between candidate levels create unstable feedback.
   - The system can overemphasize a level simply because it is numerically nearest.

3. **Static coaching**
   - Fixed templates explain only behaviors explicitly anticipated by the code.
   - They do not naturally answer follow-up questions or combine several dimensions of evidence.
   - The same underlying statistics can appear as repetitive cards across analytics and coach routes.

4. **JSON-heavy persistence**
   - Current local SQLite tables store many domain objects as JSON blobs.
   - That is effective for prototyping but makes multi-user querying, indexing, aggregate analytics, migrations, and auditability harder.

5. **Limited natural-language analysis**
   - The current system can display prepared findings, but it does not provide a general tool-driven AI conversation capable of answering arbitrary supported questions.

6. **Deterministic conclusions can outrun statistical evidence**
   - A detected pattern may be valid for a single trade but not meaningful as a recurring trader behavior.
   - A repeated count alone does not prove that a behavior materially affects expectancy.

### 2.3 Architectural ruling

The current importer, execution ledger, saved trade model, market-data bridge, route namespace, and test fixtures become the **foundation**.

The current pattern-scoring-behavior-template chain becomes a **legacy analysis provider** during migration. It may continue to produce comparison output, but it will not control the new coach.

---

## 3. Product Definition

Trader Intelligence v3 is an AI-powered trading journal and evidence-based trading coach for active equity traders, with an initial specialization in small-cap momentum trading.

The product must allow a user to:

1. upload broker execution CSV files;
2. review and repair import problems;
3. see reconstructed trades and day sessions;
4. see charts with entries and exits;
5. receive exact performance analytics;
6. ask natural-language questions about their own trading;
7. run counterfactual rule simulations;
8. identify repeated strengths and weaknesses;
9. create rules to test in future trades;
10. receive daily, weekly, and monthly coaching reports;
11. inspect the exact trades supporting every important conclusion;
12. correct setup tags and other uncertain classifications.

The system must not claim that it can read emotions or intentions directly. It may identify observable behavior consistent with revenge trading, chasing, overtrading, hesitation, or poor risk control, but the wording must clearly distinguish observed facts from inferred possibilities.

---

## 4. Non-Negotiable Design Principles

### 4.1 Deterministic financial truth

The following must always be calculated by code:

- gross and net realized P/L;
- commissions and fees;
- average entry and exit;
- position lifecycle;
- long/short direction;
- partial fills;
- hold time;
- MFE and MAE;
- maximum open risk;
- peak unrealized profit;
- profit giveback;
- VWAP and indicator values;
- session high/low distance;
- position-size metrics;
- simulations and counterfactuals;
- sample counts and statistical summaries.

### 4.2 Immutable evidence

An AI answer must be derived from versioned analysis results and must include evidence identifiers that resolve to exact trades, sessions, or metric snapshots.

### 4.3 No-lookahead market context

Market features describing the decision at entry, add, reduction, or exit must only use data available at that timestamp.

Post-entry and post-exit data may be used for outcome review, but must be labeled as outcome evidence rather than decision-time information.

### 4.4 AI is not the database

The model must not receive unrestricted SQL access. It should call a controlled registry of analytics and simulation tools with validated arguments.

### 4.5 AI is not the CSV parser

AI may suggest mappings for unknown CSV columns, but deterministic import code must validate and execute the mapping.

### 4.6 Honest uncertainty

Every conclusion must include:

- sample size;
- comparison baseline;
- confidence or evidence quality;
- outlier sensitivity when relevant;
- known data limitations;
- links to supporting examples.

### 4.7 Support/resistance is context, not verdict

A level or zone may describe the environment around a trade. It must not independently declare that a trade was good, bad, disciplined, or mistaken.

### 4.8 Version everything

Feature definitions, analytics tools, prompts, models, schemas, setup taxonomies, and finding policies must be versioned so an old answer can be reproduced.

---

## 5. Target Architecture

```text
Broker CSV
   |
   v
Deterministic Import and Validation
   |
   v
Canonical Execution Ledger
   |
   v
Trade Reconstruction and Reconciliation
   |
   +-----------------------+
   |                       |
   v                       v
Historical Market Data     Execution-Only Facts
   |                       |
   v                       |
Replay-Safe Market Context |
   |                       |
   +-----------+-----------+
               |
               v
        Versioned Feature Store
               |
       +-------+--------+
       |                |
       v                v
Analytics Tool Engine   Simulation Engine
       |                |
       +-------+--------+
               |
               v
      Evidence and Finding Service
               |
       +-------+--------+
       |                |
       v                v
Interactive AI Coach    Batch Reports
       |
       v
Evidence-Linked Product UI
```

### 5.1 Major modules

The new code should be organized under a clear v3 boundary:

```text
src/lib/trader-intelligence-v3/
  contracts/
  domain/
  repositories/
  ingestion/
  reconstruction/
  market-context/
  features/
  analytics/
  simulations/
  evidence/
  findings/
  setup-classification/
  behavior-analysis/
  ai/
  reports/
  rules/
  usage/
  observability/
  testing/
```

This does not require moving all existing files immediately. Existing modules should be wrapped behind v3 interfaces first, then moved only when the migration value is clear.

---

## 6. Data and Persistence Architecture

### 6.1 Production database decision

Use **PostgreSQL through Neon** for production. The repository already includes `@neondatabase/serverless`, making this the least disruptive production direction.

Keep SQLite for:

- local development;
- deterministic fixtures;
- fast unit/integration tests;
- isolated import-calibration runs.

The domain layer must depend on repository interfaces, not directly on SQLite or Neon.

### 6.2 Core tables

The production schema should use first-class columns for commonly queried data and JSON only for versioned payloads or provider-specific raw records.

#### Identity and tenancy

- `workspaces`
- `users`
- `workspace_members`
- `trading_accounts`
- `broker_connections`
- `plan_entitlements`

#### Import and source records

- `import_batches`
- `import_files`
- `import_rows`
- `import_issues`
- `import_repairs`
- `broker_mapping_templates`
- `broker_mapping_feedback`

#### Execution ledger

- `executions`
- `execution_fees`
- `execution_corrections`
- `corporate_action_adjustments`
- `execution_source_links`

The execution record must be immutable after acceptance. Corrections should create an auditable correction event rather than silently changing the imported source.

#### Reconstructed trading objects

- `positions`
- `round_trips`
- `round_trip_execution_links`
- `day_sessions`
- `ticker_stories`
- `open_position_snapshots`
- `reconstruction_diagnostics`

`round_trips` should represent flat-to-flat analytical trades. `positions` should represent the broader account position lifecycle. The distinction prevents problems when users trade the same ticker repeatedly, carry overnight inventory, or reverse direction.

#### Market data and context

- `market_data_requests`
- `market_data_snapshots`
- `market_bar_partitions` or provider cache references
- `trade_market_context_snapshots`
- `execution_market_context_snapshots`
- `level_candidates`
- `level_zones`
- `zone_evidence_links`

Raw bars do not need to be duplicated indefinitely if the licensed provider or candle warehouse remains authoritative. The database should store reproducible references, coverage windows, hashes, and derived snapshots.

#### Features and metrics

- `feature_definitions`
- `trade_features`
- `execution_features`
- `session_features`
- `ticker_story_features`
- `metric_snapshots`
- `segment_snapshots`

Every feature row must include:

- `definition_key`;
- `definition_version`;
- `calculated_at`;
- `data_cutoff_at`;
- `value_type`;
- value columns;
- quality state;
- source snapshot IDs.

#### Findings and evidence

- `analysis_runs`
- `analysis_findings`
- `finding_evidence_links`
- `finding_comparison_groups`
- `finding_limitations`
- `finding_user_feedback`

#### AI and reports

- `ai_threads`
- `ai_messages`
- `ai_tool_calls`
- `ai_response_citations`
- `ai_usage_ledger`
- `prompt_versions`
- `model_policy_versions`
- `report_runs`
- `report_sections`

#### Rules and experiments

- `rule_candidates`
- `rule_versions`
- `rule_simulations`
- `rule_tracking_periods`
- `rule_outcomes`
- `playbook_setups`
- `setup_assignments`
- `setup_assignment_feedback`

### 6.3 Data ownership rules

- Imported broker rows remain the source record.
- Normalized executions are immutable domain facts.
- Reconstructed trades can be regenerated from executions and reconstruction-policy version.
- Market context can be regenerated from market data and feature-policy version.
- Findings can be regenerated from features and analysis-policy version.
- AI messages are explanations of findings, not the authoritative source of truth.

---

## 7. CSV Import and Broker Support

### 7.1 Keep the existing parser foundation

The current [`broker-execution-csv-import.ts`](../lib/execution-sources/csv/broker-execution-csv-import.ts) is valuable and should not be replaced by an LLM.

It should be refactored gradually into:

```text
csv/
  core/
    parse-delimited-document.ts
    normalize-header.ts
    validate-row.ts
    mapping-confidence.ts
  adapters/
    ibkr.ts
    moomoo.ts
    webull.ts
    robinhood.ts
    schwab.ts
    generic.ts
  grouping/
    reconstruct-position-stream.ts
    split-round-trips.ts
    reconcile-pnl.ts
  contracts/
    import-result.ts
    diagnostics.ts
```

### 7.2 Initial supported scope

The first production v3 release should support:

1. IBKR;
2. Moomoo;
3. generic mapped equity executions.

The existing adapters for other brokers can remain available, but IBKR and Moomoo should receive the strongest real-data calibration because they match the primary intended users.

### 7.3 Import state machine

```text
uploaded
  -> fingerprinted
  -> detected
  -> mapped
  -> validated
  -> needs_repair | ready_to_reconstruct
  -> reconstructed
  -> reconciled
  -> committed
  -> market_context_pending
  -> enriched
  -> analysis_ready
```

A user must be able to use execution-only analytics after `committed`, even when candle enrichment is still pending or unavailable.

### 7.4 AI mapping assistant

For an unsupported CSV:

1. deterministic header matching runs first;
2. if confidence is low, a small sanitized sample is sent to an AI mapping assistant;
3. AI returns a proposed canonical mapping and explanation;
4. code validates data types and row consistency;
5. the user confirms the mapping;
6. the confirmed mapping is saved as a reusable template;
7. future files with the same signature use deterministic mapping.

AI must never silently decide that a field is quantity, price, fee, or timestamp.

### 7.5 Required import edge cases

The importer and reconstruction engine must explicitly handle:

- duplicate rows;
- duplicate files;
- partial fills;
- average-price broker rows versus individual fills;
- buy-to-cover and short-sale actions;
- position reversals;
- overnight positions;
- open positions;
- symbol changes;
- reverse splits and stock splits;
- currency differences;
- commissions and regulatory fees;
- broker-local timezones and daylight saving time;
- cancelled and partially filled orders;
- non-trade activity;
- options quarantine;
- sells that close inventory opened before the import period;
- user-selected reconstruction policy corrections.

---

## 8. Trade Reconstruction and Reconciliation

### 8.1 Stable analytical hierarchy

The product should use four distinct objects:

1. **Execution**: one accepted broker fill or accepted average-fill record.
2. **Position**: the account’s inventory lifecycle in a symbol and direction.
3. **Round trip**: a flat-to-flat analytical trade within a position lifecycle.
4. **Day session / ticker story**: the collection of related round trips on a date or symbol/date.

This prevents the journal from pretending every broker row is a trade or every same-symbol session is a single trade.

### 8.2 Reconciliation requirements

Before analytics are trusted, the system should compare:

- reconstructed quantity versus broker quantity;
- reconstructed gross P/L versus broker gross P/L when available;
- reconstructed net P/L versus broker net amount when available;
- fees and commissions;
- ending position quantity;
- currency;
- open versus closed state.

The user should see one of:

- reconciled;
- reconciled within tolerance;
- needs review;
- blocked.

### 8.3 Policy versioning

Reconstruction results must include a policy version. If grouping rules change later, the system can regenerate trades without losing the original imported records.

---

## 9. Market Data and Feature Enrichment

### 9.1 Provider boundary

Keep `levels-system-v2` and the existing candle-provider boundary as the source of market context. Do not put provider-specific payloads inside analytics tools.

Create a normalized market-data contract supporting:

- daily bars;
- 4-hour bars;
- 5-minute bars;
- 1-minute bars for trade replay and precise simulations;
- optional quotes/trades for slippage analysis when licensed;
- session calendars;
- corporate action adjustments.

### 9.2 Required windows

For each round trip, request and cache:

- premarket/session context before first entry;
- a configurable pre-entry lookback;
- the full holding period;
- a post-exit follow-through window;
- higher-timeframe context available before entry.

### 9.3 Data quality contract

Every trade must carry a market-data quality state:

- `complete`;
- `partial`;
- `execution_only`;
- `provider_unavailable`;
- `basis_warning`;
- `corporate_action_warning`;
- `timezone_warning`.

The AI answer must honor this state.

---

## 10. Support and Resistance Redesign

This is a required architectural change, not an optional polish item.

### 10.1 Problem statement

The current level system can detect many structurally valid levels. In a tight range, that creates several problems:

- the nearest level changes with small price movement;
- support and resistance may overlap;
- a trade can be described as close to multiple conflicting levels;
- the coach can produce hindsight statements that are numerically true but not decision-useful;
- a large number of levels creates false precision.

### 10.2 New rule

**Raw levels are not coaching evidence. Actionable zones are coaching context.**

`levels-system-v2` may continue generating candidate levels. A new v3 **Zone Synthesis Layer** must transform candidates before any user-facing analysis consumes them.

### 10.3 Zone synthesis

Candidate levels should be clustered using an adaptive tolerance based on:

- percentage distance;
- instrument price;
- minimum tick size;
- ATR or recent realized volatility;
- timeframe;
- session range;
- known candidate source.

A fixed penny threshold will not work across $0.20, $2.00, and $20.00 stocks.

Each zone should contain:

- low price;
- high price;
- representative price;
- side at the decision timestamp;
- candidate count;
- source families;
- timeframes;
- first and last evidence timestamps;
- touch count;
- reaction count;
- rejection magnitude;
- break count;
- role-flip history;
- recency;
- freshness;
- quality score;
- congestion contribution;
- no-lookahead cutoff.

### 10.4 Zone quality score

Zone quality should be deterministic and inspectable. Suggested components:

- higher-timeframe evidence;
- independent source confluence;
- number of meaningful touches;
- reaction magnitude after prior touches;
- volume participation where available;
- recency;
- clean separation from neighbouring zones;
- successful role flip;
- repeated breaks penalty;
- stale evidence penalty;
- synthetic-only penalty;
- over-density penalty.

### 10.5 Congestion index

Create a `level_congestion_index` for the price neighbourhood around each execution.

Inputs should include:

- number of zones within a volatility-adjusted band;
- combined zone width;
- overlap between support and resistance zones;
- distance between adjacent zones;
- number of source candidates collapsed into the area;
- ratio of clear space to nearby structure.

Classify the result as:

- `clear_structure`;
- `moderate_structure`;
- `congested_structure`;
- `indeterminate_structure`.

### 10.6 User-facing zone selection

For decision analysis, expose at most:

- one primary support zone;
- one primary resistance zone;
- one optional secondary zone only when it materially changes the interpretation.

When structure is congested, the system should say:

> Price was trading inside a congested structural area. The available levels do not support a reliable conclusion that the entry or exit was meaningfully close to one clear support or resistance zone.

It should **not** choose an arbitrary nearest level and continue coaching from it.

### 10.7 AI input contract for levels

The AI must never receive a raw ladder of dozens of levels. It may receive a compact object such as:

```json
{
  "structureState": "congested_structure",
  "primarySupportZone": null,
  "primaryResistanceZone": null,
  "clearSpaceAbovePct": null,
  "clearSpaceBelowPct": null,
  "congestionIndex": 0.84,
  "evidenceQuality": "limited",
  "allowedConclusion": "No reliable level-based coaching conclusion"
}
```

Or, when structure is clear:

```json
{
  "structureState": "clear_structure",
  "primarySupportZone": {
    "low": 2.31,
    "high": 2.36,
    "distanceFromEntryPct": -2.4,
    "quality": "high"
  },
  "primaryResistanceZone": {
    "low": 2.74,
    "high": 2.81,
    "distanceFromEntryPct": 14.8,
    "quality": "moderate"
  },
  "congestionIndex": 0.18,
  "allowedConclusion": "Level context may be used as supporting evidence"
}
```

### 10.8 Level-context finding policy

A level-based statement may become a finding only when:

1. the zone is replay-safe;
2. the zone has sufficient quality;
3. congestion is below the maximum threshold;
4. the distance is materially relevant after volatility adjustment;
5. the finding is supported by other evidence such as extension, failed break, volume, or outcome;
6. the same statement would not be made merely because another weak level happened to be closer.

Level proximity alone cannot produce a mistake label.

---

## 11. Versioned Feature Engine

### 11.1 Purpose

The feature engine converts executions and market data into compact, reusable facts. It replaces repeated calculations across routes and gives the analytics tools a stable semantic layer.

### 11.2 Feature families

#### Execution and lifecycle

- number of entries;
- number of adds;
- number of reductions;
- full-exit count;
- time to first reduction;
- time to flat;
- average entry and exit;
- size at each execution;
- maximum position size;
- position-building speed;
- rapid-fire execution clusters;
- direction reversals.

#### P/L and excursions

- gross and net P/L;
- return on position value;
- R-multiple when risk is known;
- MFE;
- MAE;
- MFE timing;
- MAE timing;
- peak unrealized P/L;
- retained percentage of MFE;
- profit giveback;
- drawdown before profitability;
- recovery after stop or exit.

#### Timing

- weekday;
- market session;
- minute from open;
- entry hour;
- trade sequence within day;
- minutes since previous trade;
- minutes since previous win/loss;
- hold time;
- time spent underwater;
- time spent profitable.

#### Position sizing and risk

- shares;
- dollar position;
- position size versus user median;
- position size versus recent rolling median;
- size after wins;
- size after losses;
- size versus volatility;
- size versus account equity when available;
- add size versus initial size;
- maximum adverse dollar movement.

#### Market position

- entry versus VWAP;
- entry versus session high and low;
- entry versus premarket high and low;
- entry versus opening range;
- distance from EMA values when enabled;
- short-term run before entry;
- gap percentage;
- relative volume where licensed;
- volume trend;
- spread/slippage where data permits.

#### Structural zones

- structure state;
- primary support/resistance zones;
- distance to zone boundaries;
- clear space above/below;
- congestion index;
- zone quality;
- break/reclaim/rejection facts.

#### Session behavior

- trade number in session;
- consecutive wins/losses before trade;
- cumulative session P/L before trade;
- drawdown from session peak before trade;
- repeated ticker attempts;
- time between attempts;
- size escalation across attempts;
- session stop threshold status.

#### Setup candidate features

- high-of-day breakout candidate;
- premarket breakout candidate;
- opening-range breakout candidate;
- VWAP reclaim/rejection candidate;
- first-pullback candidate;
- support bounce candidate;
- failed breakout candidate;
- halt-resumption candidate when halt data exists;
- gap-and-go/gap-and-fade candidate;
- unclassified candidate.

### 11.3 Feature registry

Every feature must have a registry entry containing:

- key;
- version;
- description;
- units;
- required data;
- decision-time or outcome-time classification;
- calculation owner;
- null/unknown policy;
- test fixtures;
- deprecation state.

---

## 12. Analytics Tool Engine

The AI coach should answer questions by selecting from a controlled tool registry.

Each tool result must return:

- direct answer data;
- sample size;
- comparison group;
- total, average, median, and win rate where relevant;
- outlier sensitivity;
- confidence label;
- limitations;
- supporting trade IDs;
- counterexamples;
- feature and tool versions.

### 12.1 Initial required tools

#### `analyze_performance_by_weekday`

Answers:

- Why am I losing money on Fridays?
- Which weekdays are strongest or weakest?

It must compare Friday to the user’s other days and decompose differences by:

- trade count;
- time of day;
- position size;
- setup;
- trade sequence;
- loss-after-loss behavior;
- outliers.

#### `analyze_performance_by_price_range`

Answers:

- Which price range do I trade best?

Use configurable and data-driven buckets, not only hard-coded buckets. Require sufficient sample size and display median as well as total P/L.

#### `compare_vwap_context`

Answers:

- Do I perform better above or below VWAP?

Separate:

- first entry above/below;
- reclaim/rejection context;
- distance from VWAP;
- long versus short;
- time of day;
- extended versus non-extended entries.

#### `simulate_partial_exit_rule`

Answers:

- How much would I have made if I always sold half at 10%?

The simulation must define:

- whether 10% means price move from average entry;
- fill assumption;
- whether the target was touched intrabar;
- remaining-position exit policy;
- commissions and slippage assumptions;
- trades excluded due to missing data.

#### `simulate_daily_stop_rule`

Answers:

- What happens if I stop trading after two losses?

Support:

- consecutive-loss limit;
- daily-dollar-loss limit;
- daily-percentage-loss limit;
- maximum number of trades;
- time-based stop.

Return actual versus simulated results and list days helped and harmed.

#### `rank_setup_performance`

Answers:

- Which setups should I stop trading?

Require setup confidence and sample thresholds. Show whether poor results persist after removing outliers.

#### `analyze_entry_extension`

Answers:

- Do I chase stocks after they have already run?

Measure:

- recent run before entry;
- distance from VWAP;
- distance from session high;
- distance from latest pullback;
- entry after consecutive expansion candles;
- outcome comparison with less-extended entries.

#### `analyze_stopped_trade_recovery`

Answers:

- How often do my stopped-out trades recover?

The system must distinguish:

- actual broker stop orders when known;
- inferred stop-like exits;
- user-tagged stops;
- recovery to entry;
- recovery to the original stop distance;
- recovery within multiple time windows.

#### `analyze_position_size_performance`

Answers:

- What is my best position size?

Do not simply choose the bucket with the highest total P/L. Compare expectancy, median outcome, drawdown, MAE, and sample size. Express size relative to the user’s normal size and optionally account equity.

#### `analyze_profit_giveback`

Answers:

- How much profit do I give back by holding too long?

Measure:

- peak unrealized profit;
- realized retained amount;
- giveback dollars and percentage;
- time from peak to exit;
- effect of partial exits;
- comparison by setup and trade duration.

### 12.2 Additional tools

- `analyze_trade_sequence_performance`
- `analyze_after_loss_behavior`
- `analyze_after_win_behavior`
- `analyze_time_of_day`
- `analyze_holding_time`
- `analyze_ticker_repeat_attempts`
- `analyze_add_behavior`
- `analyze_exit_timing`
- `analyze_premarket_vs_regular`
- `analyze_long_vs_short`
- `analyze_catalyst_categories`
- `compare_periods`
- `find_behavior_change_points`
- `find_similar_trades`
- `get_trade_evidence_bundle`

### 12.3 No unrestricted model-generated SQL in v1

The initial AI release should use registered tools only. A controlled analytics DSL can be added later, but model-generated arbitrary SQL would create security, correctness, and cost risks.

---

## 13. Evidence and Finding Service

### 13.1 Finding contract

A finding should use a structured contract similar to:

```ts
interface AnalysisFinding {
  id: string;
  type: string;
  title: string;
  directAnswer: string;
  claim: string;
  confidence: "insufficient" | "low" | "moderate" | "high";
  sampleSize: number;
  comparisonSampleSize: number | null;
  effectMetrics: Record<string, number | string | null>;
  evidenceTradeIds: string[];
  counterexampleTradeIds: string[];
  limitations: string[];
  suggestedRuleCandidate: RuleCandidate | null;
  toolKey: string;
  toolVersion: string;
  featureVersionSet: string[];
  generatedAt: string;
}
```

### 13.2 Finding requirements

A finding may be promoted to user-facing coaching only when:

- the calculation completed successfully;
- required data quality is met;
- minimum sample rules are met;
- the effect is not solely caused by one outlier unless explicitly stated;
- the claim wording is allowed by the evidence policy;
- evidence links resolve to source trades;
- limitations are preserved.

### 13.3 Counterexamples

Important findings should show at least one counterexample when available. This prevents the coach from presenting tendencies as universal laws.

---

## 14. AI Orchestration Layer

### 14.1 Responsibilities

The AI layer should:

- interpret the user’s question;
- select one or more approved analytics tools;
- request missing filters only when necessary;
- combine tool results;
- explain findings in trader-friendly language;
- cite evidence cards;
- distinguish facts from inference;
- propose a rule to test;
- suggest one useful follow-up analysis;
- refuse unsupported calculations or predictions.

### 14.2 It must not

- calculate financial metrics from raw rows;
- directly parse large CSV files as the authoritative import path;
- invent missing candles;
- infer emotional intent as fact;
- give a conclusion when the tool result says evidence is insufficient;
- reveal data from another workspace;
- generate live buy/sell signals from journal data;
- claim guaranteed improvement.

### 14.3 Request flow

```text
User question
  -> intent classifier
  -> permission and entitlement check
  -> tool plan
  -> tool argument validation
  -> analytics/simulation execution
  -> evidence-policy validation
  -> answer generation
  -> structured response validation
  -> usage ledger write
  -> response with evidence links
```

### 14.4 Structured response

The model should return a validated schema containing:

- direct answer;
- key findings;
- evidence references;
- confidence;
- limitations;
- suggested rule experiment;
- follow-up question suggestions;
- tool-run IDs.

### 14.5 Conversation memory

Store compact conversation state:

- active date range;
- selected account;
- selected setup filters;
- last tool results;
- user corrections;
- accepted rules.

Do not repeatedly resend the user’s complete trade history.

### 14.6 Model routing

Use a provider-independent interface:

- inexpensive model for intent routing and simple explanations;
- standard model for multi-tool coaching answers;
- stronger model only for complex weekly/monthly synthesis;
- batch processing for non-urgent reports and bulk uncertain setup classification.

Model selection belongs in configuration and policy, not route code.

### 14.7 Prompt versioning and evaluation

Every production response should record:

- system prompt version;
- answer-policy version;
- model identifier;
- tool versions;
- token usage;
- estimated cost;
- validation result;
- retry count.

---

## 15. Behavioral Intelligence

### 15.1 Observable behaviors

The system should detect observable behavior patterns such as:

- increasing size after losses;
- excessive trade count relative to the user’s baseline;
- repeated attempts on the same ticker;
- shorter time between trades after losses;
- entering after large short-term extensions;
- adding while price moves adversely;
- adding size late in the trade;
- failing to reduce risk after MAE expansion;
- giving back a large portion of MFE;
- exiting winners unusually early;
- holding losers longer than winners;
- taking lower-quality setups after reaching a session drawdown;
- position size inconsistent with historical performance;
- trading outside the user’s strongest hours;
- violating a user-defined rule.

### 15.2 Revenge-trading wording

The system cannot know emotion from executions alone.

Allowed wording:

> After losses, your next trades occurred faster, used larger size, and produced weaker results. That pattern is consistent with possible loss-chasing behavior and deserves review.

Disallowed wording:

> You revenge traded because you were angry.

### 15.3 Overtrading definition

Overtrading must be personalized, not based on an arbitrary universal trade count.

Possible evidence:

- later trades have materially worse expectancy;
- trade frequency rises after losses;
- time between trades contracts;
- setup confidence declines later in the day;
- the user exceeds their own profitable trade-count range;
- costs/slippage erase gross edge.

### 15.4 Rule candidates, not commands

The coach should propose testable rules such as:

- stop after two consecutive losses;
- reduce size by 30% after reaching a daily drawdown;
- avoid fourth and later trades on Fridays;
- wait for a pullback when entry is more than a configured distance above VWAP;
- take a partial at a tested target;
- do not add when position MAE exceeds a threshold.

The user chooses whether to activate the rule.

---

## 16. Setup Classification

### 16.1 Hybrid system

Setup classification should combine:

1. deterministic candidate generation from features;
2. optional AI classification of ambiguous candidates;
3. confidence thresholds;
4. user correction;
5. learning from confirmed mappings.

### 16.2 Initial taxonomy

- premarket breakout;
- gap and go;
- opening-range breakout;
- high-of-day breakout;
- first pullback;
- VWAP reclaim;
- VWAP rejection;
- support bounce;
- failed breakout;
- breakdown;
- halt resumption;
- liquidity-grab reversal;
- gap fade;
- trend continuation;
- mean reversion;
- unclassified.

### 16.3 Confidence policy

- high confidence: display as the setup;
- moderate confidence: display as “likely” and request confirmation;
- low confidence: remain unclassified and show candidates;
- user-confirmed: store as authoritative user label for that trade.

User corrections should improve mapping rules, but must not automatically retrain or change all historical trades without a versioned reclassification run.

---

## 17. Statistical Integrity

### 17.1 Minimum sample guidance

Default guidance:

- fewer than 5 trades: descriptive examples only;
- 5 to 9 trades: limited review signal;
- 10 to 24 trades: moderate pattern candidate;
- 25 or more trades: stronger descriptive evidence, subject to distribution quality.

These thresholds may vary by analysis type.

### 17.2 Required statistics

Where applicable, tools should include:

- total P/L;
- average P/L;
- median P/L;
- win rate;
- profit factor;
- expectancy;
- standard deviation or dispersion;
- largest-trade contribution;
- outlier-removed result;
- confidence interval or bootstrap interval;
- effect size versus baseline.

### 17.3 Outlier policy

A segment cannot be called strong or weak solely because one trade accounts for most of the result. The answer may state that the segment is profitable or unprofitable in total, but must disclose the outlier dependency.

### 17.4 Multiple comparisons

When the system scans many possible segments, it must avoid presenting the best or worst accidental bucket as a proven edge. Automatic discovery should require stronger evidence than a direct user-requested comparison.

### 17.5 Prospective validation

A simulated rule should be labeled as historical. The Rule Lab should track the rule prospectively on future trades before describing it as validated for the user.

---

## 18. Counterfactual Simulation Engine

### 18.1 Purpose

Simulations answer “what if” questions without asking the AI to perform candle math.

### 18.2 Initial simulations

- partial exit at percentage target;
- full exit at percentage target;
- stop loss at percentage or dollar threshold;
- trailing stop;
- break-even stop after target;
- daily stop after N losses;
- daily stop after dollar drawdown;
- maximum trades per day;
- time-of-day cutoff;
- reduced size after loss;
- fixed size versus actual size;
- exit after maximum hold time;
- exit on VWAP loss/reclaim when data exists.

### 18.3 Simulation assumptions

Every result must show:

- bar resolution;
- intrabar fill ordering policy;
- slippage assumption;
- commissions/fees;
- target/stop gap behavior;
- excluded trades;
- missing data;
- whether same-bar target and stop order is ambiguous.

Ambiguous same-bar outcomes should use a conservative default or return a range.

---

## 19. Product Experience

### 19.1 Primary navigation

Recommended core areas:

- **Overview**: current performance, urgent data issues, latest coach finding.
- **Trades**: day sessions, ticker stories, round trips, replay.
- **Ask AI**: conversational analytics and simulations.
- **Analytics**: structured exploration without chat.
- **Coach**: prioritized behaviors, strengths, and active rules.
- **Rule Lab**: historical simulation and prospective rule tracking.
- **Reports**: daily, weekly, and monthly reports.
- **Imports**: upload, repair, reconciliation, data health.

### 19.2 Upload experience

The normal flow should remain simple:

1. upload CSV;
2. auto-detect broker;
3. show accepted rows and issues;
4. repair only what matters;
5. reconcile;
6. save trades;
7. allow immediate execution-only use;
8. show market-context enrichment progress separately.

### 19.3 Ask AI response design

Each answer should contain:

1. a direct answer in the first sentence;
2. two to four strongest findings;
3. confidence and sample size;
4. one suggested rule to test when justified;
5. evidence cards linking to exact trades;
6. limitations;
7. one relevant follow-up action.

### 19.4 Trade autopsy

Each trade page should show:

- executions and position timeline;
- chart replay;
- entry/add/reduction/exit markers;
- deterministic facts;
- setup label and confidence;
- top strengths;
- top risks;
- similar trades;
- user notes;
- rule compliance;
- links to findings that use the trade as evidence.

### 19.5 Coach design

The coach should not be another analytics dashboard.

It should focus on:

- one behavior to fix first;
- one strength to repeat;
- one active rule experiment;
- evidence from representative trades;
- progress since the prior period;
- a short next-session plan.

---

## 20. AI Cost Control

### 20.1 Cost principle

The application should precompute and query structured data. AI should receive compact tool results, not raw execution histories or candle arrays.

### 20.2 Required controls

- per-user monthly AI allowances;
- per-feature token budgets;
- output length limits;
- request rate limits;
- model routing;
- prompt caching;
- cached analysis answers keyed by data version and filters;
- batch processing for reports and bulk classifications;
- duplicate-question detection;
- daily workspace cost caps;
- retry limits;
- usage alerts;
- admin cost dashboard.

### 20.3 Usage ledger

Record:

- user and workspace;
- feature;
- model;
- prompt version;
- input tokens;
- cached tokens;
- output tokens;
- tool count;
- estimated model cost;
- provider-request ID;
- latency;
- status;
- cache hit;
- report or conversation ID.

### 20.4 Batch API use

Use batch processing for:

- optional setup classification after a large historical import;
- daily report generation;
- weekly report generation;
- historical finding summaries;
- reprocessing after a prompt or taxonomy version change;
- uncertain-trade classification queues.

Batch processing does **not** replace deterministic CSV parsing or trade reconstruction.

---

## 21. Security, Privacy, and Compliance

### 21.1 Data isolation

- enforce workspace-level authorization in every repository query;
- use row-level security where appropriate;
- never trust workspace IDs from the browser without server validation;
- prevent AI tools from querying another user’s data;
- use signed internal evidence identifiers.

### 21.2 Sensitive data handling

- minimize storage of account numbers;
- hash or encrypt broker account identifiers;
- redact raw CSV samples before AI mapping assistance;
- never include full account numbers in prompts or logs;
- provide user deletion and retention controls;
- encrypt data in transit and at rest;
- keep secrets server-side.

### 21.3 Financial-product boundaries

The product is a retrospective educational journal and analytics tool. It should not promise profits, guarantee improvement, or provide personalized live trade execution instructions.

The product may explain historical evidence and test user-selected rules. Public and in-product wording should consistently reflect that boundary.

### 21.4 Market-data licensing

Before public launch, confirm rights for:

- storage of historical bars;
- display of charts to end users;
- derived analytics;
- delayed versus real-time data;
- quote and trade data;
- multi-user redistribution.

The provider adapter must make it possible to change vendors without rewriting the intelligence system.

---

## 22. Migration from the Current System

### 22.1 Migration strategy

Use a **strangler migration**, not a destructive rewrite.

```text
Current v2 system
  -> v3 adapters read existing imports/trades
  -> v3 feature engine runs in parallel
  -> v3 analytics tools run in shadow mode
  -> v3 findings compare with legacy findings
  -> selected users receive v3 AI coach
  -> v3 becomes default
  -> legacy coaching remains available for audit
  -> legacy final-output path is retired
```

### 22.2 Preserve

Preserve and wrap:

- [`src/lib/execution-sources/csv/`](../lib/execution-sources/csv/)
- [`src/lib/raw-trade-timeline/`](../lib/raw-trade-timeline/)
- [`src/lib/trade-analysis/request/`](../lib/trade-analysis/request/)
- the `levels-system-v2` provider boundary;
- import fingerprints and duplicate logic;
- existing import repair workflows;
- saved trades, notes, and review state;
- `/intelligence` routes and site navigation;
- broker fixtures;
- current Playwright journeys;
- tier and entitlement concepts.

### 22.3 Adapt

Adapt:

- [`run-trader-analytics-report.ts`](../lib/trader-analytics/run-trader-analytics-report.ts) into a legacy analytics provider plus v3 compatibility adapter;
- [`build-trader-analytics-report.ts`](../lib/trader-analytics/build-trader-analytics-report.ts) into smaller analytics tools rather than one large report builder;
- the SQLite repository into a repository interface with SQLite and Postgres implementations;
- chart decision-review snapshots into versioned market-context snapshots;
- current ticker/session stories into first-class persisted analytical objects;
- platform entitlements to include AI questions, deep analyses, reports, and market-context allowances;
- existing watchlist AI usage/cost concepts into a shared AI usage subsystem.

### 22.4 Retire as final authorities

The following may remain temporarily for comparison, but should stop controlling final coaching:

- `src/lib/pattern-scoring/` as the final measure of trade quality;
- `src/lib/behavior-analysis/` as the sole behavior authority;
- `src/lib/coaching/registry/coaching-templates.ts` as the primary coach;
- raw nearest support/resistance as user-facing behavioral proof;
- route-local conclusion generation;
- broad trader identity labels not backed by measurable evidence.

### 22.5 No destructive data migration

- do not overwrite imported source rows;
- do not delete current saved trades;
- create v3 IDs that link back to existing IDs;
- maintain a migration mapping table;
- backfill features and findings in resumable jobs;
- validate counts and P/L before promoting v3;
- allow rollback to v2 display during beta.

---

## 23. Implementation Phases

## Phase 0: Architecture Lock and Inventory

**Goal:** Freeze the v3 contracts before feature work spreads.

Deliverables:

- approve this plan;
- inventory current intelligence modules and route dependencies;
- mark modules as preserve/adapt/legacy/retire;
- define feature flags;
- define v3 naming and contract versions;
- define the production database migration approach;
- define initial broker and asset scope;
- create implementation epics.

Acceptance criteria:

- no new deterministic coaching family is added without confirming it belongs in the v3 architecture;
- all new work identifies its source-of-truth layer;
- current production routes remain unchanged.

## Phase 1: Domain Contracts and Persistence Foundation

**Goal:** Create a clean v3 domain boundary.

Deliverables:

- repository interfaces;
- Postgres migration framework;
- SQLite test implementation;
- canonical execution, position, round-trip, session, feature, finding, and usage contracts;
- workspace authorization boundary;
- schema version table;
- data migration mapping tables.

Acceptance criteria:

- v3 can read existing committed imports through an adapter;
- SQLite and Postgres contract tests pass;
- no route depends directly on a database driver.

## Phase 2: Import and Reconstruction Hardening

**Goal:** Make the existing foundation production-grade.

Deliverables:

- split broker adapters from parser core;
- stable import state machine;
- reconciliation engine;
- immutable execution ledger;
- position and round-trip separation;
- correction events;
- real IBKR and Moomoo calibration suites;
- import audit trail.

Acceptance criteria:

- P/L and quantity reconcile for approved real fixtures;
- duplicate imports are idempotent;
- open, overnight, short, partial-fill, and reversal cases are covered;
- imported trades are usable before market enrichment finishes.

## Phase 3: Feature Store and Market Context

**Goal:** Calculate all reusable facts once.

Deliverables:

- feature registry;
- feature calculation runner;
- trade/session/ticker feature storage;
- MFE/MAE and profit-giveback features;
- VWAP and extension features;
- market-data quality states;
- resumable enrichment jobs;
- feature-version backfill tools.

Acceptance criteria:

- the same feature result is deterministic across reruns;
- decision-time features pass no-lookahead tests;
- missing candles do not block execution-only features;
- features link to exact source snapshots.

## Phase 4: Analytics and Simulation Tools

**Goal:** Answer the first ten high-value user questions without AI prose.

Deliverables:

- initial analytics tool registry;
- initial simulation registry;
- statistical summary helpers;
- outlier sensitivity checks;
- evidence trade selection;
- tool contract tests;
- internal tool-debug UI.

Acceptance criteria:

- all ten initial questions produce a correct structured result;
- every result includes sample size, confidence, limitations, and evidence IDs;
- simulation assumptions are visible;
- tools do not require a language model.

## Phase 5: AI Coach Foundation

**Goal:** Turn validated tool results into conversational answers.

Deliverables:

- AI provider interface;
- model policy and routing;
- question intent classifier;
- tool planner;
- structured response schema;
- evidence citation validator;
- prompt versioning;
- usage ledger;
- cost limits;
- answer cache;
- Ask AI route and conversation storage.

Acceptance criteria:

- AI cannot answer supported quantitative questions without a successful tool run;
- every material claim links to tool evidence;
- insufficient-data answers remain conservative;
- workspace isolation tests pass;
- monthly cost limits are enforceable.

## Phase 6: Support/Resistance Zone Synthesis

**Goal:** Eliminate noisy nearest-level coaching.

Deliverables:

- candidate-level adapter from `levels-system-v2`;
- adaptive clustering;
- zone scoring;
- congestion index;
- primary-zone selection;
- clear/noisy/indeterminate structure states;
- AI-safe level-context contract;
- before/after calibration dashboard;
- real-trade review set.

Acceptance criteria:

- dense level clusters result in “no reliable level conclusion” rather than arbitrary level coaching;
- at most one primary support and one primary resistance zone reach normal user-facing analysis;
- level context cannot independently create a mistake;
- output is stable under small price changes;
- user review confirms a meaningful reduction in noisy feedback.

## Phase 7: Behavioral Findings and Setup Classification

**Goal:** Add personalized coaching above the analytics tools.

Deliverables:

- observable behavior definitions;
- post-loss behavior analysis;
- overtrading analysis;
- size-discipline analysis;
- late-entry/chase analysis;
- scale-out/giveback analysis;
- hybrid setup classifier;
- correction workflow;
- finding confidence rules;
- similar-trade retrieval.

Acceptance criteria:

- emotional intent is never asserted as fact;
- setup confidence is visible;
- user correction is stored and auditable;
- behavior findings link to representative and counterexample trades;
- findings survive outlier checks.

## Phase 8: Reports and Rule Lab

**Goal:** Convert analysis into an improvement loop.

Deliverables:

- daily recap;
- weekly coaching report;
- monthly trend report;
- batch processing pipeline;
- rule candidate creation;
- historical simulation;
- prospective rule tracking;
- rule adherence checks;
- progress comparison.

Acceptance criteria:

- reports are reproducible from saved tool/finding runs;
- batch jobs are idempotent;
- simulated rules remain labeled historical;
- active rules track future adherence and outcomes.

## Phase 9: Product UI Replacement

**Goal:** Make v3 the primary user experience without duplicating dashboards.

Deliverables:

- revised overview;
- Ask AI;
- revised analytics explorer;
- coach-first sequence;
- rule lab;
- evidence-linked trade autopsy;
- reports;
- data health;
- mobile and accessibility pass.

Acceptance criteria:

- coach does not mirror analytics card grids;
- important claims open exact evidence;
- import and market-data states are understandable;
- no raw JSON or debug language appears in end-user routes;
- critical journeys pass desktop and mobile Playwright tests.

## Phase 10: Production Hardening and Beta

**Goal:** Prove accuracy, safety, cost, and reliability with real users.

Deliverables:

- real-data golden datasets;
- shadow comparison with legacy output;
- prompt evaluation suite;
- cost load tests;
- security review;
- deletion/export policy implementation;
- provider-failure drills;
- beta feedback instrumentation;
- migration and rollback runbooks.

Acceptance criteria:

- zero unresolved P/L reconciliation blockers in the approved beta set;
- no cross-workspace data access;
- AI cost stays within target limits;
- unsupported claims fail validation;
- v3 can be disabled without data loss;
- beta users prefer v3 coaching usefulness over legacy coaching.

---

## 24. First Implementation Batch

The first coding batch should be deliberately foundational. It should not begin by redesigning `/coach`.

### 24.1 Create the v3 boundary

Add:

```text
src/lib/trader-intelligence-v3/
  contracts/
  domain/
  repositories/
  features/
  analytics/
  evidence/
  ai/
  usage/
```

### 24.2 Add initial contracts

- `canonical-execution-v1`
- `analytical-round-trip-v1`
- `trade-feature-v1`
- `analytics-tool-result-v1`
- `analysis-finding-v1`
- `ai-coach-response-v1`
- `ai-usage-event-v1`

### 24.3 Add compatibility adapters

- current saved trade -> v3 round trip;
- current execution feedback summary -> v3 execution feature bundle;
- current decision-review snapshot -> v3 market-context snapshot;
- current workspace/account context -> v3 authorization context.

### 24.4 Add feature flags

Suggested flags:

- `TRADER_INTELLIGENCE_V3_ENABLED`
- `TRADER_INTELLIGENCE_V3_SHADOW_MODE`
- `TRADER_INTELLIGENCE_V3_AI_ENABLED`
- `TRADER_INTELLIGENCE_V3_ZONE_SYNTHESIS_ENABLED`
- `TRADER_INTELLIGENCE_V3_REPORTS_ENABLED`

### 24.5 Implement the first two analytics tools

Start with:

1. performance by weekday;
2. daily stop after consecutive losses.

These prove both descriptive analytics and counterfactual simulation without requiring support/resistance.

### 24.6 Add tool-debug output

Create an internal-only page or test harness that displays:

- tool arguments;
- result;
- sample rows;
- outlier checks;
- evidence IDs;
- limitations;
- execution time.

### 24.7 Do not call an AI model yet

The first batch is complete only when structured tool results are trusted. AI should be connected after the tool contracts and evidence policy are stable.

---

## 25. Testing Strategy

### 25.1 Import tests

- official and observed broker fixtures;
- malformed headers;
- delimiter variations;
- quoted fields;
- timezone changes;
- duplicate rows/files;
- partial fills;
- short sales;
- position reversals;
- options quarantine;
- hostile and oversized input.

### 25.2 Property-based reconstruction tests

Generate random valid execution streams and assert:

- position quantity never violates lifecycle invariants;
- realized P/L matches independent reference math;
- flat-to-flat grouping is stable;
- duplicate processing is idempotent;
- fee totals are preserved;
- open positions remain open.

### 25.3 Market-data tests

- no lookahead;
- missing bars;
- split-adjustment warnings;
- premarket and after-hours boundaries;
- daylight saving transitions;
- same-bar target/stop ambiguity;
- provider failure and retry.

### 25.4 Zone synthesis tests

- several close levels collapse into one zone;
- separated levels remain separate;
- high-volatility and low-volatility tolerance differs;
- overlapping support/resistance becomes congested;
- small price changes do not flip the selected zone unnecessarily;
- stale or synthetic candidates cannot dominate;
- no coaching conclusion is allowed in congested structure.

### 25.5 Analytics tests

- exact expected results on golden datasets;
- outlier-dominated buckets;
- small sample handling;
- zero denominator handling;
- date/account/setup filters;
- evidence IDs resolve;
- comparison baselines are correct;
- simulation assumptions are deterministic.

### 25.6 AI evaluation tests

- model calls only approved tools;
- answer claims are contained in tool results;
- evidence IDs are valid;
- insufficient-data state is preserved;
- no unsupported emotional assertion;
- no live buy/sell instruction;
- no cross-user data;
- prompt injection inside notes or CSV fields is ignored;
- response validates against schema;
- token and cost limits are enforced.

### 25.7 Product tests

Maintain and extend current Playwright coverage for:

- upload;
- repair;
- reconciliation;
- saved trades;
- trade detail;
- analytics;
- Ask AI;
- coach;
- rule lab;
- reports;
- mobile overflow;
- accessibility;
- tier gating;
- data-quality copy.

---

## 26. Observability and Operations

Required dashboards:

- import success/failure by broker;
- reconciliation failure rate;
- market-data coverage;
- feature-job backlog;
- analysis-tool latency and error rate;
- AI latency and failure rate;
- token and dollar cost by feature and plan;
- answer cache hit rate;
- unsupported-claim validator failures;
- user evidence-click rate;
- finding acceptance/dismissal rate;
- setup correction rate;
- active-rule adherence.

Every background job must be:

- idempotent;
- resumable;
- observable;
- retry-limited;
- safe to rerun;
- tied to a versioned input snapshot.

---

## 27. Recommended Product Defaults

Unless future evidence justifies a change, use these defaults:

- production database: Neon PostgreSQL;
- local/test database: SQLite;
- initial assets: U.S. listed equities only;
- initial brokers receiving full calibration: IBKR and Moomoo;
- options: rejected/quarantined;
- initial market data: historical and delayed, not a live execution product;
- initial candle resolution: 1-minute plus 5-minute and higher-timeframe context;
- AI access: controlled analytics tools only;
- support/resistance: zone-synthesized supporting context only;
- automatic findings: conservative confidence thresholds;
- setup labels: hybrid with user confirmation;
- reports: daily and weekly first;
- plan limits: AI questions and deep analyses, not raw token counts;
- feature release: shadow mode before default mode.

---

## 28. Suggested GitHub Epic Breakdown

1. V3 domain contracts and feature flags
2. Repository interface and Postgres foundation
3. Existing import compatibility adapter
4. Immutable execution ledger and corrections
5. Position/round-trip reconstruction model
6. P/L and broker reconciliation engine
7. Feature registry and calculation runner
8. MFE/MAE/profit-giveback features
9. VWAP/extension/session features
10. Market-data quality and snapshot contracts
11. Weekday analytics tool
12. Price-range analytics tool
13. VWAP comparison tool
14. Daily-stop simulation tool
15. Partial-exit simulation tool
16. Setup-ranking tool
17. Entry-extension analysis tool
18. Stopped-trade recovery tool
19. Position-size analysis tool
20. Profit-giveback analysis tool
21. Evidence and finding service
22. AI provider and model policy
23. AI tool planner and structured response validator
24. AI usage ledger and cost controls
25. Ask AI product route
26. Level candidate adapter
27. Zone synthesis and congestion index
28. Zone calibration dashboard
29. Observable behavior engine
30. Hybrid setup classification and correction
31. Daily and weekly reports
32. Rule Lab and prospective validation
33. V3 coach experience
34. Production migration and shadow comparison
35. Security, privacy, and launch readiness

Each epic should have explicit contracts, acceptance criteria, tests, and migration impact before implementation begins.

---

## 29. Definition of MVP

The first useful paid MVP is complete when a user can:

1. upload an IBKR or Moomoo equity execution CSV;
2. repair and reconcile the import;
3. see saved round trips and charts;
4. receive exact P/L, MFE, MAE, position-size, time, and giveback metrics;
5. ask the initial ten supported questions;
6. receive evidence-linked AI answers;
7. run at least the daily-stop and partial-exit simulations;
8. see setup candidates and correct them;
9. receive a weekly report;
10. create one rule candidate and track it on future trades;
11. use the system without support/resistance feedback when structure is congested or unavailable.

The MVP does not require:

- live brokerage connections;
- live trade alerts;
- options analytics;
- automatic order execution;
- unrestricted natural-language database queries;
- perfect setup classification;
- real-time quotes for all users;
- a full social/community layer.

---

## 30. Final Architectural Directive

Build Trader Intelligence v3 as an **evidence platform with an AI interface**, not as an LLM wrapped around a CSV file and not as an ever-growing collection of hard-coded coaching templates.

The current repository has a strong factual base. The correct move is to preserve that base and replace the layers that decide what the facts mean.

The future stack should be:

```text
trusted imports
  -> trusted executions
  -> trusted reconstructed trades
  -> trusted replay-safe features
  -> trusted analytics and simulations
  -> evidence-backed findings
  -> AI explanation and coaching
```

Support/resistance should remain available, but only after candidate levels have been consolidated into meaningful zones and only when the structure is clear enough to support a conclusion. When the chart is crowded with levels, the system must recognize that the honest answer is that no single level is decision-useful.

This architecture makes the application more accurate, more flexible, easier to extend, less repetitive, and much better suited to the natural-language questions that define the new product.