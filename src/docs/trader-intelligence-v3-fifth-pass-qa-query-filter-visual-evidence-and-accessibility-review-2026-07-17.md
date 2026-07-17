# Trader Intelligence v3 Fifth-Pass QA: Query Semantics, Visual Evidence, Accessibility, and Answer Consistency

**Date:** 2026-07-17 America/Toronto  
**Status:** Mandatory fifth-pass implementation amendments  
**Repository:** `traderslink-bot/traderslink-trader-improvement-system`  
**Operating profile:** `private_owner_alpha`  
**Primary domain:** U.S. listed small-cap and micro-cap active trading  
**Product boundary:** retrospective educational trade review and self-improvement

## Reviewed authority

- `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`
- `src/docs/trader-intelligence-v3-ga0-a-control-and-exact-truth-implementation-plan-2026-07-17.md`
- `src/docs/trader-intelligence-v3-project-log.md`
- `plan.md`
- `handoff.md`
- `src/docs/trader-intelligence-plan-index.md`
- all four prior v3 QA reviews and the original master plan as rationale

## Repository boundaries sampled

- `src/lib/trader-analytics/product/types.ts`
- `src/lib/trader-analytics/types/trader-analytics-chart.ts`
- `src/lib/trader-analytics/charts/build-trader-analytics-chart-data.ts`
- `app/intelligence/analytics/analytics-client.tsx`
- `app/app-ui.tsx`
- current package scripts, test boundaries, and existing hand-built chart components

---

# 1. Executive Verdict

The evidence-first v3 architecture remains correct. The fifth pass found no reason to restart the design or move AI earlier.

The user requirement that natural-language questions can return supporting charts is approved and should become a core v3 capability.

However, charts must not be implemented as model-generated decoration. They must be deterministic evidence artifacts derived from the same immutable analysis snapshot, filter contract, claims, exclusions, and evidence references as the written answer.

The engineering ruling is:

> The AI may choose an approved question tool and an approved visual template. It may not create chart data, alter values, silently change filters, or generate arbitrary executable chart code.

The product ruling is:

> A visualization is supporting historical evidence, not proof of causation or future performance.

The delivery ruling is:

> Canonical query/filter semantics belong in the deterministic foundation. Chart-ready series and visual evidence envelopes belong with deterministic analytics. AI-directed visual selection comes only after chart and prose consistency is validated.

---

# 2. Severity Summary

## P0 before date/time analytics are trusted

1. Canonical date/time filter contract.
2. Explicit date basis: entry, exit, session, execution, import, or report date.
3. Explicit time basis and timezone.
4. Inclusive/exclusive boundary semantics.
5. Trading-session calendar semantics for relative periods.
6. Immutable filter digest bound to the analysis snapshot.
7. Server-authoritative filtering and aggregation.
8. Clear handling of open/overnight positions that span dates.
9. Stable reason codes for excluded records.

## P0 before visual evidence is shown as support for an answer

1. Chart values must come from validated deterministic series.
2. Chart and prose must reference the same claims and dataset manifest.
3. Units, currency, timezone, denominator, and coverage must be explicit.
4. Included/excluded counts and reasons must be available.
5. No-data, zero, unavailable, stale, and ineligible states must be distinct.
6. Financial values must not be recomputed in the browser.
7. Visual scales must not misrepresent sign or magnitude.
8. Every chart must have an accessible non-visual equivalent.
9. Drill-down must resolve to the exact supporting evidence set.
10. Chart configuration must be validated against an allowlisted registry.

## P1 before AI can select charts

1. Approved visual-template registry.
2. Question-to-tool-to-visual compatibility matrix.
3. AI output schema that references server-owned series IDs.
4. Text/chart numeric consistency validator.
5. Filter consistency validator.
6. Unit/currency/timezone validator.
7. Chart quantity and complexity limits.
8. Prompt-injection resistance for labels and user text.
9. Owner feedback for misleading, unclear, redundant, or inaccessible visuals.

## P1 before broad visual analytics expansion

1. Accessibility testing.
2. Keyboard drill-down.
3. Color-independent encodings.
4. Mobile and reduced-motion behavior.
5. Deterministic downsampling and point budgets.
6. Comparison-period fairness rules.
7. Export/replay metadata.
8. Visual regression and invariant tests.

---

# 3. Current Prototype Findings

## 3.1 Existing filters are too narrow for the approved product

The current `TraderAnalyticsFilter` supports:

- symbol;
- direction;
- session bucket;
- entry hour;
- outcome;
- lifecycle.

It does not define:

- start/end dates;
- relative dates;
- entry versus exit date;
- execution-time windows;
- comparison periods;
- trading-session counts;
- timezone;
- inclusivity;
- account scope;
- currency;
- setup;
- evidence capability;
- coverage requirements;
- analysis cutoff.

The current client performs row filtering in the browser for the limited fields above. That is acceptable for prototype interaction, but it cannot become the authoritative v3 analytical filter path.

V3 financial filtering, grouping, denominators, exclusions, and series generation must happen in deterministic server/domain code against one immutable analysis snapshot.

Client filtering may hide already-authorized display rows. It may not calculate the authoritative answer.

## 3.2 Existing chart contracts lack evidence semantics

The current chart contract contains:

- chart ID;
- kind;
- title;
- total;
- empty state;
- rows with label, numeric value, percentage, category, and tone.

It does not carry:

- unit;
- currency;
- timezone;
- date basis;
- filter digest;
- dataset manifest;
- derivation manifest;
- analysis snapshot;
- claim IDs;
- evidence IDs;
- included/excluded counts;
- exclusion reasons;
- coverage state;
- capability tier;
- statistical mode;
- uncertainty;
- limitations;
- drill-down reference;
- sort/bucket policy;
- zero-baseline policy;
- accessibility summary.

This contract is useful for current UI primitives but is not sufficient as v3 visual evidence.

## 3.3 Existing chart builders use prototype numeric assumptions

The current chart builder:

- uses JavaScript numbers;
- rounds metrics through `toFixed`;
- builds gross P/L views without an exact currency-bearing financial type;
- does not attach evidence sets or exclusions;
- does not bind charts to immutable manifests.

These builders remain legacy/prototype presentation code. They are not v3 financial authority.

## 3.4 Existing hand-built charts have visual-integrity limitations

Current components are useful as design prototypes, but the fifth pass found examples that cannot become v3 evidence contracts without redesign:

- equity-curve rendering uses a hard-coded horizontal line rather than a calculated zero position;
- simple bars scale width by absolute magnitude, so sign is communicated mainly through color;
- donut percentages are rounded for presentation and the accessible label does not fully describe every segment;
- calendar output is a limited recent slice rather than a full canonical calendar range;
- charts do not expose dataset/filter/exclusion metadata;
- chart rows are not inherently interactive evidence links;
- chart visuals depend heavily on green/red color semantics;
- no structured table alternative is guaranteed by the chart contract.

These are not criticisms of the current UI experiment. They are reasons to create a separate v3 visual-evidence boundary rather than promote the existing components as authoritative.

---

# 4. Canonical Query Intent Contract

Natural-language questions must resolve into a deterministic `QueryIntent` before any analytics tool runs.

Suggested shape:

```ts
export interface TraderIntelligenceQueryIntentV1 {
  version: "query_intent_v1";
  questionId: string;
  analysisMode:
    | "direct_hypothesis"
    | "fixed_comparison"
    | "exploratory_scan"
    | "optimization"
    | "similarity_search";
  subject: string;
  metrics: string[];
  filters: CanonicalAnalyticsFilterV1;
  grouping: CanonicalGroupingV1[];
  comparisons: CanonicalComparisonV1[];
  requestedEvidenceCapabilities: string[];
  requestedVisualPurposes: string[];
  analysisCutoffAt: string;
  resolvedAt: string;
  resolverVersion: string;
}
```

The AI may propose this intent. Deterministic validation and normalization own the accepted intent.

Unsupported, ambiguous, or contradictory questions return a structured clarification or limitation state rather than an invented interpretation.

---

# 5. Canonical Date and Time Filter Contract

## 5.1 Date bases

A date filter must declare one basis:

- `entry_date`;
- `exit_date`;
- `session_date`;
- `execution_date_any`;
- `position_open_date`;
- `position_close_date`;
- `import_date`;
- `report_generated_date`.

Default for trade-performance analysis:

- closed trade questions: `entry_date` unless the user explicitly asks about exits;
- day/session questions: `session_date`;
- execution-tape questions: `execution_date_any`.

The resolved basis must be visible in the answer.

## 5.2 Time bases

A time filter must declare one basis:

- first entry time;
- final exit time;
- any execution time;
- position-open time;
- position-flat time;
- time since regular open;
- time since premarket start;
- elapsed hold time.

The system may not silently interpret “trades after 10:30” as entry time in one tool and exit time in another.

## 5.3 Timezones

Required timezone states:

- `America/New_York` exchange display time;
- UTC storage time;
- broker-declared source timezone;
- user-selected display timezone when explicitly requested.

Default display for U.S. market-session questions:

- `America/New_York`.

The chart subtitle and filter disclosure must identify the timezone.

## 5.4 Absolute range semantics

A range records:

- start instant/date;
- end instant/date;
- inclusivity at both boundaries;
- timezone used to resolve local dates;
- date basis;
- time basis;
- calendar type;
- source phrase when generated from natural language.

Suggested half-open instant convention:

```text
[startInclusive, endExclusive)
```

Calendar-date UI may display inclusive start/end dates while the internal instant range remains half-open.

## 5.5 Relative ranges

Supported examples may include:

- today;
- yesterday;
- this week;
- last week;
- this month;
- last month;
- last N calendar days;
- last N trading sessions;
- previous N complete trading sessions;
- month to date;
- year to date;
- before/after a rule effective date.

Every relative range records:

- anchor instant;
- anchor timezone;
- exchange-calendar version;
- whether the current partial day/period is included;
- resolved absolute range.

The answer displays the resolved absolute dates.

## 5.6 Trading versus calendar periods

“Last 20 days” and “last 20 trading sessions” are different requests.

The system must not silently convert between them.

Comparison periods declare whether they use:

- calendar duration;
- equal trading-session count;
- complete weeks/months;
- matched weekday composition;
- matched market-session coverage.

## 5.7 Overnight and multi-day positions

An overnight position may be included in several views for different reasons:

- entry-date analysis;
- exit-date analysis;
- session exposure analysis;
- position-lifecycle analysis.

It must not be duplicated within one metric denominator unless the metric explicitly counts executions or exposure sessions rather than trades.

## 5.8 Daylight-saving, holidays, and early closes

Date/time resolution uses the versioned session policy already required by v3.

Tests must cover:

- DST spring and fall transitions;
- exchange holidays;
- early closes;
- premarket on early-close days;
- after-hours after early close;
- midnight UTC crossing while the exchange date remains unchanged;
- ambiguous broker timestamps.

---

# 6. Canonical Filter Contract

Suggested contract families:

```ts
export interface CanonicalAnalyticsFilterV1 {
  version: "analytics_filter_v1";
  workspaceScope: string;
  accountIds: string[];
  instrumentIds: string[];
  symbolsAsDisplayed: string[];
  directions: string[];
  dateRange: CanonicalDateRangeV1 | null;
  timeRanges: CanonicalTimeRangeV1[];
  sessions: string[];
  lifecycleStates: string[];
  setupSources: string[];
  setupIds: string[];
  outcomes: string[];
  currencies: string[];
  evidenceCapabilities: string[];
  ruleVersions: string[];
  includeOpenPositions: boolean;
  analysisCutoffAt: string;
}
```

Rules:

- arrays are canonically sorted unless order is semantic;
- the filter has a content digest;
- the accepted filter is part of the analysis snapshot;
- UI labels do not enter the digest;
- account and workspace access are server-derived;
- unsupported filters fail validation;
- empty arrays have defined semantics;
- null, omitted, and “all” are not silently conflated;
- currency filters are explicit;
- cross-currency totals remain blocked without FX policy.

---

# 7. Query Resolution and Clarification Policy

The application should answer directly when the intent can be resolved safely.

It should request or display a clarification state when materially ambiguous, including:

- “March” without a year when multiple years exist;
- “after 10” without AM/PM in a non-obvious context;
- “best month” when the user may mean total P/L, median, expectancy, or win rate;
- “trades on Tuesday” when entry versus exit date would materially differ;
- “last week” when the analysis anchor is unclear;
- “compare before and after” without an event or cutoff;
- “how did I do at open” without a time window.

In private alpha, a UI may show the assumed interpretation and allow one-click correction rather than always blocking the question.

The accepted interpretation remains visible and reproducible.

---

# 8. Server-Authoritative Analytical Series

The server/domain layer produces exact analytical series.

The browser receives presentation-ready values, not raw executions to recalculate.

Suggested series envelope:

```ts
export interface ValidatedSeriesV1 {
  version: "validated_series_v1";
  seriesId: string;
  derivationManifestId: string;
  analysisSnapshotId: string;
  filterDigest: string;
  metricKey: string;
  metricVersion: string;
  unit: string;
  currency: string | null;
  timezone: string | null;
  candidateCount: number;
  eligibleCount: number;
  includedCount: number;
  excludedCount: number;
  exclusionReasonCounts: Record<string, number>;
  coverageState: string;
  capabilityTier: string;
  statisticalMode: string;
  points: ValidatedSeriesPointV1[];
  evidenceSetId: string;
  limitations: string[];
  contentDigest: string;
}
```

Each point may include:

- canonical bucket key;
- display label;
- exact decimal value;
- unit;
- secondary metrics;
- evidence subset reference;
- included/excluded counts;
- uncertainty/quality state;
- sort order;
- interval start/end.

No model-supplied point values are accepted.

---

# 9. Visual Evidence Envelope

A chart is a view of a validated series, not a separate analytical result.

Suggested envelope:

```ts
export interface VisualEvidenceSpecV1 {
  version: "visual_evidence_spec_v1";
  visualId: string;
  visualTemplateId: string;
  purpose: string;
  title: string;
  subtitle: string;
  sourceSeriesIds: string[];
  sourceClaimIds: string[];
  analysisSnapshotId: string;
  filterDigest: string;
  unit: string;
  currency: string | null;
  timezone: string | null;
  xEncoding: ApprovedEncodingV1;
  yEncodings: ApprovedEncodingV1[];
  sortPolicy: string;
  scalePolicy: string;
  zeroBaselinePolicy: string;
  drilldownEvidenceSetId: string;
  accessibleSummary: string;
  tableAlternativeId: string;
  limitations: string[];
  contentDigest: string;
}
```

The spec references series and claims owned by the server.

It does not contain arbitrary JavaScript, HTML, SQL, expressions, URLs, or executable formatters.

---

# 10. Approved Visual Template Registry

Initial templates may include:

- cumulative P/L line;
- daily/weekly/monthly P/L bars;
- grouped period comparison bars;
- weekday bars;
- entry-time bucket bars;
- weekday/time heatmap;
- P/L calendar;
- outcome composition donut;
- holding-time histogram;
- position-size versus P/L scatter;
- distribution/box summary;
- actual versus simulated equity curves;
- actual versus simulated period bars;
- simulation helped/harmed/unaffected bars;
- waterfall explanation;
- trade candlestick/replay with execution markers;
- drawdown line/area;
- rolling metric line.

Every template declares:

- supported metric types;
- required units;
- allowed number of series;
- allowed point count;
- zero-baseline rule;
- negative-value support;
- sorting behavior;
- accessibility behavior;
- drill-down behavior;
- mobile behavior;
- empty-state behavior;
- statistical limitations;
- whether AI may select it.

The model selects a template ID. It cannot invent a new chart type at runtime.

---

# 11. Chart Selection Policy

The default answer should normally contain:

- one primary visual;
- zero to two supporting visuals;
- an expandable table/evidence area.

The system should not produce many charts merely because many are available.

Selection guidance:

- trends over ordered time: line or bar;
- comparison of categories: bar;
- two-period comparison: grouped bar or aligned lines;
- distribution and outliers: histogram, box/distribution, or scatter;
- weekday/hour interaction: heatmap;
- composition with few categories: donut;
- simulation delta: paired lines, bars, or waterfall;
- trade-level context: candlestick/replay;
- calendar pattern: calendar heatmap.

Pie/donut restrictions:

- composition only;
- small number of mutually exclusive categories;
- non-negative counts or shares;
- no P/L magnitude comparison;
- no time-series use;
- table values always available.

---

# 12. Visual Integrity Rules

## 12.1 Zero baseline

Bar charts representing magnitude normally include a true zero baseline.

If a non-zero or truncated scale is allowed for a specialized view, the truncation must be visually obvious and disclosed.

## 12.2 Negative values

Positive and negative values must differ by geometry or position, not only color.

Examples:

- diverging bars around zero;
- points above/below zero;
- explicit signs and labels.

## 12.3 Color

Color is supplementary.

Do not rely on green/red alone.

Use:

- labels;
- signs;
- patterns or symbols where practical;
- position and shape;
- sufficient contrast.

## 12.4 Sorting

Sorting must be deterministic and disclosed when it changes natural order.

Time axes remain chronological.

Weekdays remain exchange-week order unless explicitly ranked.

Ranked category charts identify that they are sorted by a metric.

## 12.5 Top-N

If a chart shows only top N categories:

- the N is disclosed;
- omitted categories are represented as `Other` when composition matters;
- the full accessible table remains available;
- the AI cannot imply the visible list is exhaustive.

## 12.6 Dual axes

Dual-axis charts are disallowed initially unless a specific approved template demonstrates that units, scales, and interpretation remain clear.

## 12.7 Log scales

Log scales are disallowed for the initial journal visual registry unless explicitly approved and clearly disclosed.

## 12.8 Percentages and denominators

Every rate identifies its denominator.

Example:

```text
18 winners / 31 eligible closed trades = 58.1%
```

The chart cannot use candidate count in one place and included count in another.

## 12.9 Currency

A chart cannot mix USD and CAD into one numeric axis without a versioned FX policy.

Separate panels or faceted series are acceptable when currencies remain explicit.

---

# 13. No Data, Zero, Unknown, and Excluded

The visual system must distinguish:

- valid zero;
- no candidate records;
- candidates but none eligible;
- missing required source data;
- stale data;
- conflicting source data;
- partial coverage;
- all records excluded by filter;
- blocked cross-currency aggregation;
- unavailable capability;
- analysis failure.

A blank chart or `0` cannot stand in for all these states.

Empty-state cards should explain:

- what was requested;
- what data was available;
- why no visual was produced;
- what remains available, such as E0 execution-only analysis.

---

# 14. Text and Chart Consistency

Every numeric sentence in an AI answer already requires a validated claim.

The fifth pass adds:

- every displayed chart value resolves to a validated series point;
- every chart series resolves to a derivation manifest;
- every prose claim and chart used in one answer shares the same analysis snapshot;
- the chart filter digest equals the answer filter digest;
- units, currency, timezone, and date basis agree;
- included/excluded counts agree;
- limitations cannot be removed from the chart when present in the claim;
- a chart cannot contain a stronger conclusion than the prose;
- prose cannot cite a visual whose series was not used in validation.

Add an `AnswerVisualConsistencyValidator` before persistence/display.

Failure results in:

- deterministic text-only answer where safe;
- visual suppression;
- internal diagnostic;
- no invented replacement chart.

---

# 15. Interactive Evidence and Drill-Down

Every chart point or bucket may expose an evidence subset.

Examples:

- click Friday to see included Friday trades;
- click `10:30–10:44` to see those entries;
- click a heatmap cell to see exact trades and excluded records;
- click a simulation delta to see helped/harmed days;
- click a cumulative curve point to see the state through that trade.

Drill-down rules:

- authorization is rechecked;
- the evidence subset is manifest-scoped;
- original filter and bucket boundaries are displayed;
- included and excluded records remain separate;
- no database-ID-only assumptions;
- evidence order is deterministic;
- representative examples are labeled as examples, not the entire denominator;
- the full evidence set can be paginated without changing the metric.

---

# 16. Accessibility Contract

Every visual must provide:

- semantic title;
- concise accessible summary;
- exact table alternative;
- keyboard-reachable drill-down;
- visible focus state;
- screen-reader labels for values and units;
- non-color-only distinction;
- responsive layout;
- reduced-motion support;
- readable contrast;
- no information available only on pointer hover.

The table alternative contains:

- bucket/point label;
- exact value;
- unit/currency;
- included count;
- eligible count where relevant;
- excluded count;
- comparison value;
- evidence link;
- limitation state.

Accessibility acceptance requires automated and manual testing.

---

# 17. Relative-Date and Comparison Fairness

## 17.1 Partial periods

Month-to-date versus a complete previous month can be misleading.

The tool must either:

- compare equal elapsed trading sessions;
- compare complete periods;
- or clearly disclose that one period is partial.

## 17.2 Week composition

A comparison involving holidays or missing imports identifies different trading-day counts.

## 17.3 Strategy eras

A date range crossing material strategy or broker changes should expose the change point rather than imply one homogeneous process.

## 17.4 Rule effective time

Before/after rule charts use the rule’s effective timestamp, not its later edit timestamp.

## 17.5 Inflation/account-scale changes

Raw dollar P/L across long historical spans may not be directly comparable when account size changed materially.

The tool may show:

- raw P/L;
- per-trade median;
- normalized size metrics;
- percentage or R metrics only when their required data is valid.

No inferred account equity is allowed.

---

# 18. Statistical Visual Integrity

Visuals must expose statistical weakness rather than beautify it away.

Required where relevant:

- sample size;
- independent day count;
- independent ticker count;
- outlier concentration;
- result without largest day/ticker;
- confidence/uncertainty state;
- direct versus exploratory mode;
- holdout/prospective state;
- coverage limitations;
- excluded record count.

Charts generated from exploratory scans must be labeled exploratory.

A selected extreme bucket cannot be shown as a proven edge merely because it is visually prominent.

---

# 19. Visual Proof Language

Preferred phrases:

- supporting visual evidence;
- visual summary of the included sample;
- chart of the deterministic result;
- strongest associated historical contributors;
- evidence from the selected imported period.

Avoid:

- visual proof that Friday caused losses;
- proof this rule will work;
- definitive optimal size;
- guaranteed pattern;
- the chart proves intent or emotion.

The system may say a chart proves an arithmetic statement within a bound dataset, such as the exact included-period total.

It may not claim the chart proves causation or future recurrence.

---

# 20. Caching, Replay, and Invalidation

Chart artifacts are immutable and content-addressed.

A visual cache key includes:

- analysis snapshot;
- series digest;
- visual template version;
- visual configuration digest;
- locale/display format version;
- accessibility summary version.

Changing presentation formatting may create a new rendered artifact without changing the underlying series.

Changing data, policy, filters, exclusions, or derivation creates a new series and visual identity.

Old visual artifacts remain replayable with their original metadata.

A stale source or corrected dataset marks current visuals stale.

No chart is silently redrawn with new values under an old evidence link.

---

# 21. Export Contract

Future exports may include:

- CSV table;
- JSON evidence package;
- image/PDF report rendering;
- shareable private report link.

Every export includes or references:

- generated time;
- date/time filter;
- timezone;
- date basis;
- dataset manifest;
- derivation manifest;
- included/excluded counts;
- unit/currency;
- limitations;
- visual template version;
- evidence references.

An image without metadata is not sufficient as an auditable result.

Private exports remain owner-authorized and must not expose raw account identifiers.

---

# 22. Performance and Point Budgets

Define limits for:

- charts per answer;
- points per line/bar/scatter;
- series per visual;
- evidence links per point;
- table rows per page;
- rendered SVG/DOM elements;
- client payload size;
- drill-down page size;
- chart-render latency;
- export size.

Large time series use deterministic aggregation or downsampling.

Downsampling records:

- algorithm;
- version;
- original point count;
- output point count;
- whether extrema were preserved;
- content digest.

The model cannot choose a custom downsampling algorithm.

---

# 23. Security and Untrusted Labels

Treat as untrusted text:

- user questions;
- notes;
- setup names;
- broker descriptions;
- imported filenames;
- symbol/company labels;
- event headlines;
- source titles.

Rules:

- no HTML execution;
- no scriptable chart expression;
- no unvalidated URL in a visual spec;
- labels are length-limited;
- control characters are rejected or normalized;
- tooltips do not render unsanitized markup;
- chart titles generated by AI are schema-limited and validated;
- evidence links are server-owned;
- account numbers remain redacted.

---

# 24. Testing Strategy

## 24.1 Query/filter tests

- relative-date resolution with fixed clock;
- trading versus calendar days;
- entry versus exit date;
- inclusive/exclusive boundaries;
- DST transitions;
- holidays and half days;
- overnight trade inclusion;
- comparison periods;
- filter canonicalization and digest stability;
- contradictory/ambiguous filters;
- server authorization scope;
- cross-currency blocking.

## 24.2 Series tests

- exact totals match source rows;
- bucket boundaries are deterministic;
- included/excluded counts reconcile;
- every point evidence subset sums to the series denominator where expected;
- order is deterministic;
- units/currency/timezone are correct;
- no browser recomputation required;
- outlier and limitation metadata retained.

## 24.3 Visual invariant tests

- source series and claim IDs resolve;
- filter digest matches answer;
- zero baseline rule enforced;
- negative values encoded geometrically;
- no unsupported template/encoding;
- no more than allowed chart count;
- no missing table alternative;
- no inaccessible hover-only data;
- no mixed currencies;
- no mixed analysis snapshots;
- no hidden exclusions;
- no data/zero/unavailable states distinct.

## 24.4 Text/chart consistency tests

- prose total equals series total;
- prose date range equals chart date range;
- prose timezone equals chart timezone;
- prose denominator equals chart denominator;
- limitations preserved;
- visual suppression on validator failure;
- deterministic answer remains available without chart.

## 24.5 Accessibility tests

- automated accessibility suite;
- keyboard navigation;
- screen-reader table and summary;
- contrast;
- reduced motion;
- mobile overflow;
- high zoom;
- no color-only distinction.

## 24.6 Visual regression tests

Use stable synthetic fixtures and deterministic rendering.

Visual snapshots do not replace numeric invariant tests.

## 24.7 AI selection tests

- AI references only approved series IDs;
- unsupported chart template rejected;
- arbitrary code rejected;
- excessive chart count rejected;
- wrong unit/template combination rejected;
- prompt injection in labels ignored;
- AI cannot alter filter/date range;
- AI cannot hide exclusions;
- AI abstains when no appropriate visual exists.

---

# 25. Delivery Sequencing

## GA0-A1

No chart or query feature work.

Contain access and architecture boundaries.

## GA0-A2

No chart work.

Canonical identity and exact financial truth.

## GA0-A3

Add foundational contracts only:

- canonical date/time/filter contract;
- filter digest;
- analysis cutoff semantics;
- date/time runtime validation;
- immutable analysis snapshot support;
- evidence reference support.

Do not add natural-language query parsing, chart rendering, or AI selection.

## GA0-B

Deterministic analytics tools must return:

- validated claims;
- exact table data;
- chart-ready validated series;
- included/excluded counts;
- evidence subsets;
- limitations.

The first weekday and daily-stop tools should prove these contracts.

No AI chart selection is required.

## GA0-C

Private calibration verifies:

- date/time interpretation;
- evidence drill-down;
- table/series totals;
- owner understanding of exclusions;
- chart-ready series against private data without exposing it.

## GA1 — Query and Visual Evidence

Implement:

- deterministic query/filter UI;
- visual template registry;
- accessible chart renderer;
- table alternatives;
- drill-down;
- chart/claim consistency validation;
- comparison-period semantics;
- exports only if scoped and justified.

Begin with deterministic questions and fixed charts.

## GA2 — Owner-Only AI

AI may:

- resolve supported natural-language intent;
- select approved tools;
- select one to three approved visual templates;
- explain validated claims;
- suggest follow-up views.

AI may not:

- generate chart values;
- generate chart code;
- alter accepted filters;
- choose unapproved scales;
- hide limitations;
- exceed chart count/point budgets.

## GA3+

Market-enriched visuals are added one evidence capability at a time.

Quote, halt, float, catalyst, and level visuals remain gated by their source and eligibility contracts.

---

# 26. Fifth-Pass Acceptance Criteria

The fifth pass is incorporated when:

- the controlling architecture contains query/filter and visual-evidence contracts;
- `plan.md`, handoff, index, and project log identify the accepted sequencing;
- canonical date/time basis is defined;
- relative dates resolve to visible absolute ranges;
- date/time filters are content-addressed;
- server owns filtering and aggregation;
- chart-ready series are deterministic and evidence-linked;
- visual specs reference server-owned series;
- text/chart consistency validation is required;
- units/currency/timezone/coverage/exclusions are required;
- no-data states are explicit;
- visual-integrity rules are defined;
- accessible table alternatives are required;
- evidence drill-down is manifest-scoped;
- chart caching/replay/invalidation is specified;
- performance/point budgets are planned;
- GA0-A excludes chart implementation;
- GA0-B returns validated series;
- GA1 owns deterministic query and visual evidence;
- GA2 owns AI visual selection only after validation.

---

# 27. Final Fifth-Pass Directive

The approved chain is:

```text
natural-language or UI question
  -> canonical visible filter interpretation
  -> immutable analysis snapshot
  -> deterministic tool and exact claims
  -> validated table and chart-ready series
  -> approved accessible visual template
  -> text/chart consistency validation
  -> interactive evidence drill-down
  -> AI explanation and optional visual selection
```

The engineering standard is:

> A chart may never contain a value, filter, denominator, unit, or conclusion that cannot be traced to the same deterministic result as the written answer.

The product standard is:

> Show the resolved dates, timezone, included sample, exclusions, and limitations so the owner can understand exactly what the picture represents.

The accessibility standard is:

> Every visual result must remain understandable and operable without relying on color, hover, or sight alone.

The delivery standard is:

> Build table truth first, chart-ready series second, accessible deterministic visuals third, and AI-directed visual selection last.
