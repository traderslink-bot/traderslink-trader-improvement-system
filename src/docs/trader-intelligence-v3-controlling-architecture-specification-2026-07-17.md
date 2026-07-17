# Trader Intelligence v3 Controlling Architecture Specification

**Date:** 2026-07-17 America/Toronto  
**Status:** Active controlling specification  
**Architecture:** Trader Intelligence v3  
**Operating profile:** `private_owner_alpha`  
**Hosting mode:** must be declared as `local_only` or `private_hosted`  
**Primary domain:** U.S. listed small-cap and micro-cap active trading  
**Product boundary:** retrospective educational trade review and self-improvement

---

# 1. Authority

This document consolidates the accepted decisions from:

- the v3 master plan;
- the first architecture QA review;
- the private-alpha and small/micro-cap second QA review;
- the source-governance, reproducibility, and evaluation third QA review;
- the operational-integrity and canonical-truth fourth QA review;
- the query, filter, visual-evidence, and accessibility fifth QA review.

Detailed reviews remain architectural rationale and audit evidence.

## Precedence

1. latest explicit accepted decision in `src/docs/trader-intelligence-v3-project-log.md`;
2. this controlling architecture specification;
3. the active file-level implementation plan;
4. detailed v3 reviews and master plan as rationale;
5. legacy v1/v2 plans as implementation history.

A project-log entry may record progress or an accepted strengthening decision. It may not silently weaken this specification. Material architecture changes require updating this file.

---

# 2. Current Product Facts

- The current user and tester is the product owner.
- The system is not currently a public multi-user product.
- The current deployment profile is `private_owner_alpha`.
- Hosting must declare `local_only` or `private_hosted`.
- The product primarily serves small-cap and micro-cap active traders.
- It analyzes completed broker executions and historical context.
- It is designed for education, review, and self-improvement.
- It is not a live signal service.
- It is not an automated broker.
- It is not a tax-accounting product.
- It is not a portfolio-allocation service.
- It does not promise profit or guaranteed improvement.
- Future public use remains possible, but public infrastructure must not block private-owner usefulness validation.
- Private-alpha status does not relax access containment, exact math, evidence, coverage, eligibility, no-lookahead, basis safety, backup, accessibility, or simulation honesty.

---

# 3. Core Architecture

```text
contained owner-only environment
  -> deterministic import and validation
  -> canonical exact accepted executions
  -> immutable corrections and versioned reconstruction
  -> explicit coverage and content-addressed dataset manifest
  -> per-capability eligibility and immutable analysis snapshot
  -> deterministic analytics, tables, and chart-ready series
  -> stable claim and evidence ledger
  -> accessible visual evidence
  -> evaluated owner-only AI explanation and visual selection
  -> qualified small/micro-cap enrichment
  -> usefulness calibration
  -> future public hardening
```

Code is authoritative for:

- access containment;
- CSV parsing and validation;
- canonical serialization and cryptographic identity;
- duplicate and correction states;
- exact financial math;
- position and round-trip reconstruction;
- temporal policy;
- session classification;
- instrument and basis checks;
- dataset coverage and manifests;
- analysis eligibility and snapshots;
- market features;
- statistics;
- simulations;
- query/filter normalization;
- chart-ready analytical series;
- evidence identifiers;
- capability and quality states;
- source provenance.

AI may:

- interpret a supported user question;
- propose a canonical query intent;
- select approved tools;
- select approved visual templates;
- combine validated claims;
- explain evidence;
- state uncertainty;
- suggest a rule to test;
- link relevant educational material.

AI must not become:

- the authoritative CSV parser;
- the financial calculator;
- the execution grouper;
- the database;
- an unrestricted SQL author;
- a source of missing market data;
- a runtime web-search authority;
- a generator of chart values or executable chart code;
- a live signal engine;
- a source of current price targets;
- an automated broker;
- a causal oracle for trader emotions.

---

# 4. Deployment and Hosting Profiles

## Deployment profiles

```ts
export type TraderIntelligenceDeploymentProfile =
  | "private_owner_alpha"
  | "private_invited_alpha"
  | "public_beta"
  | "public_production";
```

## Hosting modes for `private_owner_alpha`

```ts
export type TraderIntelligenceHostingMode =
  | "local_only"
  | "private_hosted";
```

### `local_only`

May use:

- explicit owner identity adapter;
- durable local SQLite or isolated private database;
- direct private file selection;
- local job adapter for bounded workloads;
- private real-data calibration outside Git.

Still requires:

- file permissions;
- private data directory outside Git;
- secrets outside source;
- encrypted/versioned backup;
- tested restore;
- no raw financial data in normal logs;
- fail-closed profile checks;
- no accidental network exposure.

### `private_hosted`

Requires:

- owner authentication;
- owner authorization on every Intelligence page and API;
- encrypted transport;
- secure session handling;
- no anonymous import, trade, analytics, chart, evidence, or AI access;
- private storage/database;
- audit of sensitive mutations;
- cache keys scoped to the owner and analysis snapshot;
- fail closed when owner identity or hosting configuration is unavailable.

A publicly reachable unauthenticated site is not a private owner alpha.

### Invited/public profiles

Before invited or public users, require:

- shared platform identity;
- server-derived workspace/account tenancy;
- PostgreSQL production authority;
- application authorization and RLS where practical;
- object-storage upload;
- durable jobs and transactional outbox;
- deletion and retention;
- tenant isolation tests;
- rate limits and entitlements;
- provider licensing review;
- monitoring, backup, recovery, and support procedures.

---

# 5. Initial Scope

## Asset scope

Supported first:

- U.S. listed common equities;
- sub-dollar and higher-priced common shares when identity and basis are resolved;
- long execution facts;
- short execution facts when imported correctly.

Quarantined or excluded until intentionally supported:

- options;
- OTC equities;
- warrants;
- rights;
- units;
- preferred shares;
- convertible instruments;
- unresolved security types;
- unresolved historical symbols.

Short ledger facts may be supported before short-specific coaching is calibrated.

## Initial broker calibration

Highest priority:

1. IBKR;
2. Moomoo;
3. generic mapped equity executions.

Existing Webull, Robinhood, and Schwab adapters remain useful but do not receive the same confidence claim until calibrated on representative files.

---

# 6. Source-of-Truth Hierarchy

## Broker executions

Accepted broker executions and audited correction events are authoritative for:

- fill timestamp;
- side;
- quantity;
- fill price;
- broker execution ID;
- account;
- currency;
- reported commission and fees.

Market data never overwrites a fill.

## Broker summaries

Broker totals are reconciliation evidence, not silent replacements for v3 calculations.

Broker-reported and analytical values remain separate.

## User inputs

User inputs may be authoritative for personal intent:

- intended setup;
- planned stop;
- planned target;
- rule being tested;
- accepted setup label;
- personal note.

Timestamp and input type are stored. A post-trade note is not a pre-trade plan.

## Market path

One declared provider and basis owns one market-path snapshot unless a versioned merge policy exists.

A fallback provider creates a new snapshot and manifest.

## Regulatory and exchange events

Prefer official regulator or exchange sources.

Qualified third-party or first-party issuer sources may support a finding when scope and limitations are explicit.

## Derived features

Derived features are not source facts. They link to exact inputs, policies, and versions.

## AI output

AI output is explanatory only.

## Conflict states

Use explicit machine states:

- `resolved_by_precedence`;
- `within_tolerance`;
- `conflicting_sources`;
- `stale_source`;
- `unresolved_identity`;
- `basis_mismatch`;
- `manual_review_required`.

---

# 7. Canonical Identity and Hashing

Legacy 32-bit fingerprints remain migration/diagnostic metadata only.

Authoritative v3 content identities use:

- versioned canonical serialization;
- cryptographic content digest such as SHA-256 or approved equivalent;
- declared domain and schema version;
- declared canonicalization version;
- declared hash algorithm.

Canonicalization defines:

- UTF-8 encoding;
- Unicode normalization;
- object-key ordering;
- semantic array ordering;
- decimal-string normalization;
- signed-zero handling;
- UTC timestamp representation and precision;
- null versus omitted semantics;
- enum case;
- line endings;
- duplicate-key rejection;
- stable reason-code ordering.

Content identities exclude:

- random IDs;
- database IDs;
- wall-clock creation metadata;
- transient job IDs;
- localized display text;
- model request IDs.

Changing a financial fact, correction, policy, filter, or source changes the relevant digest.

Changing a persistence ID does not.

---

# 8. Execution Identity, Ordering, and Duplicate States

Preferred execution identity evidence:

1. broker, account, and stable broker execution ID;
2. correction/bust reference;
3. order ID, fill sequence, timestamp, quantity, and price;
4. canonical fallback identity with ambiguity state.

Repeated identical-looking fills may be legitimate.

Use distinct states:

- `exact_duplicate_same_source`;
- `same_execution_reexported`;
- `broker_correction_or_bust`;
- `possible_duplicate_ambiguous`;
- `legitimate_repeated_fill`;
- `fingerprint_collision_detected`;
- `manual_review_required`.

Only proven exact duplicates are automatically suppressed.

A matching digest is not enough; canonical content is compared and ambiguity is preserved.

## Same-timestamp ordering

A deterministic total-order policy considers:

1. normalized timestamp;
2. source timestamp precision;
3. broker execution index;
4. broker execution ID;
5. order ID;
6. original row location;
7. canonical digest.

When meaningful order cannot be established, the reconstruction carries an ordering ambiguity rather than inventing certainty.

---

# 9. Exact Financial Representation

No binary floating-point value is authoritative for:

- money;
- execution prices;
- share quantities;
- fees;
- FX rates;
- P/L;
- simulation thresholds that affect fills.

Requirements:

- exact decimal library behind domain wrappers;
- decimal-string serialized contracts;
- exact storage representation;
- versioned rounding policy;
- no premature intermediate rounding;
- explicit reconciliation tolerance;
- invalid/overflow handling;
- dimensional units and currencies.

The chosen decimal library is wrapped behind domain types and differential tests.

---

# 10. Analytical P/L, Reconstruction, and Lifecycle Truth

Every reconstructed result records a policy version.

The policy distinguishes:

- broker-reported P/L;
- v3 analytical P/L;
- account cash movement;
- tax-lot P/L.

V3 does not claim tax P/L.

The policy defines:

- average-cost or FIFO analytical treatment;
- partial fills;
- entry and exit fee allocation;
- broker average-fill rows;
- sell short and buy to cover;
- position reversals;
- prior inventory outside the import period;
- open inventory;
- corporate actions;
- symbol changes;
- user grouping corrections;
- per-currency reporting.

Unknown prior inventory fails to review rather than being guessed.

Cross-currency totals are blocked until a versioned FX service exists.

## Position hierarchy

1. **Execution** — accepted fill or accepted average-fill record.
2. **Position lifecycle** — inventory history for instrument/account/direction.
3. **Analytical round trip** — flat-to-flat unit used for trade review.
4. **Ticker story** — related same-instrument attempts.
5. **Day session** — full account/day review context.

Do not treat every broker row as a trade.

Do not merge all same-symbol rows without position-state evidence.

## Factual lifecycle versus review disposition

Only executions and audited correction events change factual inventory.

Ledger-derived states include:

- `flat_closed_by_executions`;
- `open_quantity_remaining`;
- `prior_inventory_unknown`;
- `reversal_detected`;
- `broker_correction_pending`;
- `manual_reconstruction_review`.

Review states include:

- `review_open`;
- `review_in_progress`;
- `review_complete`;
- `review_dismissed`;
- `review_not_applicable`;
- `user_says_position_closed_elsewhere`.

A review action cannot create a fill or close inventory.

Legacy lifecycle overrides are annotations and coverage limitations, not execution truth.

---

# 11. Temporal Truth and Corrections

Distinguish:

- valid/effective time;
- first-public time where relevant;
- observed time;
- recorded time;
- corrected time;
- superseded time.

Corrections are append-only events.

This applies to:

- execution corrections and busts;
- fees;
- timezone corrections;
- instrument mapping;
- corporate actions;
- filing amendments;
- float corrections;
- user setup labels;
- planned risk;
- user-created rules.

Old answers retain their original correction cutoff and manifests.

Current read models may resolve the event stream without rewriting historical artifacts.

---

# 12. Dataset Coverage

Every dataset manifest records:

- account IDs;
- import batches;
- source-file hashes;
- accepted execution identities;
- statement periods;
- coverage start/end;
- overlap;
- known gaps;
- excluded rows;
- prior-inventory cases;
- open positions;
- currencies;
- other known accounts not included.

Coverage states:

- `complete_account_period`;
- `partial_account_period`;
- `overlapping_periods_reconciled`;
- `coverage_gap_detected`;
- `unknown_coverage`;
- `multiple_accounts_partial`.

Broad answers identify the imported account/period and limitations.

A partial upload is not described as the owner’s complete trading history.

---

# 13. Content-Addressed Manifests and Analysis Snapshot

## Dataset manifest

Includes:

- content digest;
- source-file digests;
- accepted execution identities;
- correction event identities;
- reconstruction policy;
- session policy;
- instrument-resolution version;
- currency policy;
- coverage state.

## Market-enrichment manifest

Includes:

- provider;
- raw/adjusted basis;
- instrument identity;
- source symbol;
- requested interval;
- candle/quote/event/source digests;
- corporate-action version;
- retrieval and effective times;
- level snapshot IDs.

## Derivation manifest

Includes:

- input manifests;
- tool/function version;
- parameters and canonical filter digest;
- exclusions;
- deterministic result digest.

## Answer manifest

Includes:

- question and accepted query intent;
- canonical filters;
- tool plan and tool runs;
- claims;
- evidence;
- visual specs;
- capability tier;
- prompt/model/schema versions;
- validation;
- cost;
- answer digest.

## Immutable analysis snapshot

One analysis run binds to one:

- dataset manifest;
- coverage manifest;
- correction cutoff;
- reconstruction policy;
- eligibility snapshot;
- market-enrichment set;
- user-intent cutoff;
- active-rule cutoff;
- analysis cutoff.

Mixed-manifest tool results cannot form one answer.

New imports or corrections do not partially alter an in-progress run.

## Stale and invalidation states

- `current`;
- `stale_source_corrected`;
- `stale_policy_changed`;
- `stale_eligibility_changed`;
- `superseded`;
- `blocked`;
- `failed_retryable`;
- `failed_terminal`;
- `deleted_source`.

Source or policy corrections mark dependent current artifacts stale and trigger explicit recomputation.

Old artifacts remain reproducible.

---

# 14. Stable Evidence References

Evidence identities are manifest-scoped semantic identities, not database-ID assumptions.

They include:

- evidence type;
- dataset manifest;
- canonical source identity;
- execution/position/round-trip/session/event identity;
- evidence schema version.

An evidence reference may resolve to:

- original immutable evidence;
- superseded evidence with replacement;
- deleted/unavailable state;
- unresolved state.

It must never silently open another trade after reimport, migration, or ticker reuse.

---

# 15. Analysis Eligibility

Eligibility is calculated per capability.

Required capabilities include:

- execution analytics;
- P/L analytics;
- sequence analytics;
- candle analytics;
- VWAP analytics;
- MFE/MAE analytics;
- halt analytics;
- quote analytics;
- slippage analytics;
- float analytics;
- catalyst analytics;
- level analytics;
- simulation analytics;
- visual-evidence analytics.

Each capability returns:

- `eligible`;
- `eligible_with_limitations`;
- `ineligible`;
- stable reason codes;
- source snapshot IDs.

Every tool returns:

- candidate count;
- eligible count;
- included count;
- excluded count;
- exclusion reasons;
- coverage state;
- evidence capability.

Open positions remain eligible for execution facts but not realized closed-trade conclusions.

---

# 16. Runtime Validation and Parser Hardening

TypeScript is not runtime validation.

Validate:

- broker-adapter output;
- canonical executions;
- database JSON;
- correction events;
- manifests;
- eligibility results;
- canonical filters;
- tool inputs/outputs;
- external-source payloads;
- caches;
- visual specs;
- future structured AI output.

Stable machine reason codes remain separate from user-facing text.

## CSV hardening

Detect and test:

- duplicate raw headers;
- duplicate normalized headers;
- canonical mapping collisions;
- malformed/unclosed quotes;
- inconsistent row widths;
- unsupported encodings;
- NUL/control characters;
- oversized cells;
- ambiguous delimiters;
- duplicate execution ID with conflicting content.

Silent header overwrite is prohibited.

---

# 17. Time and Session Model

Store source times in UTC.

Classify U.S. exchange sessions through a versioned America/New_York policy.

First-class states:

- premarket;
- regular;
- after-hours;
- overnight hold;
- closed/holiday;
- half day;
- unknown.

Handle:

- daylight-saving transitions;
- market holidays;
- early closes;
- premarket-to-regular holds;
- after-hours exits;
- same-timestamp ordering;
- broker-local timezone assumptions.

External events distinguish effective, first-public, retrieval, processing, and correction times.

Later information cannot contaminate entry-time reasoning.

---

# 18. Canonical Query and Filter Semantics

Natural-language or UI questions resolve into a deterministic query intent before tools run.

Each query declares:

- analysis mode;
- subject and metrics;
- canonical filters;
- grouping;
- comparisons;
- requested evidence capabilities;
- requested visual purposes;
- analysis cutoff;
- resolver version.

AI may propose the intent. Deterministic validation accepts or rejects it.

## Date bases

Supported bases include:

- entry date;
- exit date;
- session date;
- any execution date;
- position-open date;
- position-close date;
- import date;
- report-generated date.

The accepted basis is visible in the answer.

## Time bases

Supported bases include:

- first entry time;
- final exit time;
- any execution time;
- position-open time;
- position-flat time;
- time since regular open;
- time since premarket start;
- elapsed hold time.

“After 10:30” cannot mean entry time in one tool and exit time in another.

## Range semantics

Each range records:

- start/end;
- inclusivity;
- timezone;
- date/time basis;
- calendar type;
- source phrase;
- relative-date anchor where applicable;
- resolved absolute range.

Internal instant ranges use a declared convention such as `[startInclusive, endExclusive)`.

## Relative dates

Relative periods record:

- anchor instant;
- anchor timezone;
- exchange-calendar version;
- partial-period inclusion;
- resolved absolute dates.

The user-visible answer shows the resolved dates.

Calendar days and trading sessions are not silently interchanged.

## Overnight positions

Entry-date, exit-date, exposure-session, and lifecycle analyses remain distinct.

A multi-day position is not duplicated within a trade denominator unless the metric intentionally counts sessions or executions.

## Canonical filter

The filter includes:

- server-derived account/workspace scope;
- instruments/symbol display filters;
- direction;
- date range;
- time ranges;
- sessions;
- lifecycle;
- setup source/ID;
- outcomes;
- currencies;
- capabilities;
- rule versions;
- open-position policy;
- analysis cutoff.

The filter has a content digest and is part of the analysis snapshot.

Server/domain code owns authoritative filtering and aggregation.

Browser filtering may only hide already-authorized presentation rows.

---

# 19. Instrument Identity and Price Basis

Ticker is not a durable instrument ID.

V3 maintains:

- issuer identity;
- instrument identity;
- symbol assignment validity periods;
- corporate-action events;
- resolution attempts;
- manual corrections.

CIK is issuer/filer context, not complete security identity.

OpenFIGI may generate candidates but does not automatically resolve ambiguous historical micro-cap instruments.

Resolution states:

- `resolved_high_confidence`;
- `resolved_with_manual_confirmation`;
- `ambiguous`;
- `historical_mapping_missing`;
- `corporate_action_review_required`;
- `unsupported_security_type`;
- `unresolved`.

Execution-only analysis may continue for unresolved symbols. Market enrichment fails closed.

Market-data rules:

- preserve raw broker prices;
- declare raw/adjusted basis;
- do not compare raw executions with incompatible adjusted candles;
- fail chart-derived analysis closed on split/reverse-split mismatch;
- do not silently blend providers;
- do not fill missing premarket data with regular-only data;
- version aggregation methods;
- expose provider disagreements.

---

# 20. Evidence Capability Tiers

- **E0 — execution-only**
- **E1 — candle-enriched**
- **E2 — event-enriched**
- **E3 — quote-enriched**
- **E4 — share-structure-enriched**
- **E5 — combined enrichment with explicit limitations**

Examples:

- E0: P/L, fees, timing, size, sequence, repeated attempts.
- E1: MFE, MAE, VWAP, session range, bar-path simulation.
- E2: qualified halts, filings, catalysts, listing/corporate events.
- E3: bid/ask-relative execution cost and quoted spread.
- E4: dated float, shares outstanding, and float rotation.

A claim or visual cannot exceed available capability.

Stale, conflicting, incomplete, or basis-unsafe data may lower the trusted capability.

---

# 21. Spread, Liquidity, Slippage, Executability, Halts, and LULD

OHLCV cannot prove:

- bid/ask spread;
- quote size;
- market depth;
- available liquidity;
- exact slippage;
- executable full fill.

Quote-relative execution cost requires historical quotes.

Plan-relative slippage requires intended/order price.

Candle-relative fill location is not verified slippage.

A target touched by a bar is price-path evidence, not proof of full fill.

Simulation outputs declare fill model and executable confidence.

Halt rules:

- missing bars do not prove a halt;
- halt claims require qualified event data;
- store source, scope, start, resume, reason/code, and quality;
- simulations cannot fill during a qualified halt;
- resume gaps require explicit policy;
- LULD Plan is a rules reference, not a historical band/event feed;
- do not reconstruct official LULD bands from one-minute OHLCV alone.

---

# 22. Float, FINRA Data, Catalysts, and Filings

## Float

- source and as-of date required;
- current float is not automatically historical float;
- source disagreement is visible;
- stale float suppresses confident findings;
- float rotation is an estimate.

## FINRA

- short-sale volume is not short interest;
- off-exchange short-sale volume is not consolidated with all exchange data;
- publication lag is explicit;
- no squeeze prediction or directional verdict is derived solely from it;
- threshold status is not short interest or squeeze proof.

## Filings and catalysts

- source document/accession required;
- first-public time required;
- later filings cannot enter decision-time reasoning;
- extraction is derived and versioned;
- source document remains authoritative;
- AI search snippets are not source records.

Regulatory suspension is a different event class from an exchange volatility halt.

---

# 23. External Source Registry

Every source records:

- source key/version;
- owner;
- authority level;
- documentation and terms;
- access method;
- cost state;
- permitted deployment profiles;
- commercial/redistribution state;
- historical coverage;
- update schedule;
- rate limit;
- correction behavior;
- cache/retention policy;
- required headers;
- capabilities;
- limitations;
- last terms review.

Free access does not imply public-commercial rights.

No undocumented endpoint becomes a production contract.

Recommended adoption order:

1. registry and synthetic adapters;
2. SEC filing metadata;
3. exchange halt/suspension sources;
4. instrument-mapping candidates;
5. dated share structure and carefully qualified FINRA context;
6. quote data after suitable provider selection;
7. other sources for defined feature needs.

Approved candidate opportunities include:

- SEC EDGAR;
- Nasdaq Trader symbol directories;
- Nasdaq Trader halt and Reg SHO resources;
- NYSE halt resources;
- LULD Plan rules;
- qualified FINRA datasets;
- OpenFIGI candidates;
- reviewed Nasdaq Data Link datasets.

Do not assume comprehensive historical NBBO is free.

---

# 24. Statistical Modes, Setups, Rules, and Simulations

Every analysis declares:

- `direct_hypothesis`;
- `fixed_comparison`;
- `exploratory_scan`;
- `optimization`;
- `similarity_search`.

Required where relevant:

- sample size;
- independent day count;
- independent ticker count;
- clustering;
- median and total;
- outlier concentration;
- result without largest day/ticker;
- recent versus older period;
- strategy-era context;
- multiple-comparison control;
- chronological holdout;
- prospective tracking before validation claims.

Questions phrased as `why` receive associated contributors, not unsupported causality.

Setup sources remain distinct:

- user intended setup;
- post-trade tag;
- deterministic candidate;
- AI likely setup;
- chart-validated setup;
- user-confirmed setup;
- unclassified.

Rules store version, created/effective/retired time, scope, definition, historical simulation, and prospective status.

A later rule cannot create a hindsight violation.

R-multiple requires independently recorded planned risk.

Every simulation defines:

- intervention time;
- actual actions retained/removed;
- hypothetical actions inserted;
- resulting position state;
- account/session scope;
- fill, fee, slippage, gap, halt, and liquidity policies;
- bar resolution;
- same-bar ambiguity;
- exclusions;
- optimistic/conservative ranges where appropriate;
- executable confidence;
- policy version.

Do not preserve shares after a hypothetical partial exit.

Do not claim portfolio realism without capital/buying-power modeling.

---

# 25. Visual Evidence Architecture

Charts are deterministic evidence artifacts, not decoration.

The server/domain layer produces validated series containing:

- series ID and content digest;
- derivation manifest;
- analysis snapshot;
- canonical filter digest;
- metric/version;
- exact values;
- units;
- currency;
- timezone;
- candidate/eligible/included/excluded counts;
- exclusion reasons;
- coverage state;
- capability tier;
- statistical mode;
- evidence set;
- limitations.

The browser does not recompute authoritative financial totals.

## Visual specification

A visual spec references:

- approved template ID;
- source series IDs;
- source claim IDs;
- analysis snapshot;
- filter digest;
- units/currency/timezone;
- approved encodings;
- deterministic sort/scale/zero-baseline policies;
- drill-down evidence set;
- accessible summary;
- table alternative;
- limitations;
- content digest.

It contains no arbitrary JavaScript, HTML, SQL, executable expression, unvalidated URL, or model-supplied point value.

## Approved template families

- cumulative P/L line;
- daily/weekly/monthly P/L bars;
- grouped period comparisons;
- weekday/time bars;
- weekday/time heatmap;
- P/L calendar;
- outcome composition donut;
- histogram/distribution/box summary;
- position-size scatter;
- actual versus simulated lines/bars;
- waterfall;
- drawdown line/area;
- rolling metric line;
- trade candlestick/replay.

Each template declares supported metrics/units, series and point budgets, zero-baseline rules, negative-value support, sorting, accessibility, drill-down, mobile behavior, and whether AI may select it.

AI selects a template ID. It cannot invent a runtime chart type.

## Visual-integrity rules

- magnitude bars normally use a true zero baseline;
- truncation is explicit and approved;
- negative values differ by geometry/position, not color alone;
- color is supplementary;
- time axes remain chronological;
- weekday order remains natural unless explicitly ranked;
- top-N truncation is disclosed and full table remains available;
- dual axes and log scales are disallowed initially;
- rates identify denominators;
- currencies do not share an axis without FX policy;
- no-data, zero, ineligible, unavailable, stale, partial, and failure states remain distinct;
- exploratory visuals are labeled exploratory;
- charts disclose sample/coverage/exclusion limitations.

## Text/chart consistency

Every chart value resolves to a validated series point.

Every prose number resolves to a validated claim.

One answer requires matching:

- analysis snapshot;
- filter digest;
- date/time basis;
- timezone;
- units/currency;
- denominators;
- included/excluded counts;
- limitations.

An `AnswerVisualConsistencyValidator` runs before display/persistence.

On failure, suppress the visual and return deterministic text/table output where safe.

## Drill-down

Chart points may resolve to manifest-scoped evidence subsets.

Authorization is rechecked.

Included and excluded records remain separate.

Representative examples are labeled as examples.

Pagination does not change the metric.

## Accessibility

Every visual requires:

- semantic title;
- accessible summary;
- exact table alternative;
- keyboard-reachable drill-down;
- visible focus;
- screen-reader values/units;
- non-color-only distinction;
- responsive layout;
- reduced-motion support;
- sufficient contrast;
- no hover-only information.

---

# 26. Visual Caching, Replay, Export, and Performance

Visual artifacts are immutable and content-addressed.

Cache identity includes:

- analysis snapshot;
- series digest;
- template version;
- configuration digest;
- locale/display version;
- accessibility-summary version.

Data/policy/filter/derivation changes create new identities.

Old visuals remain replayable with original metadata.

A stale source marks current visuals stale; no old evidence link silently redraws with new values.

Future exports include metadata or references for:

- resolved filters/dates/timezone;
- manifests;
- included/excluded counts;
- units/currency;
- limitations;
- template version;
- evidence.

An image alone is not an auditable result.

Define budgets for:

- charts per answer;
- points/series;
- evidence bundle size;
- table pagination;
- SVG/DOM elements;
- client payload;
- render latency;
- export size.

Large series use deterministic versioned aggregation/downsampling with original/output counts and extrema policy.

---

# 27. AI Grounding and Safety

Owner-only AI may begin only after deterministic tools and validation pass.

Required before GA2:

- approved tool registry;
- bounded tool plan;
- canonical query-intent validator;
- claim ledger;
- numeric/unit/currency validator;
- evidence validator;
- capability validator;
- limitation preservation;
- validated series registry;
- approved visual-template registry;
- answer/visual consistency validator;
- response schema;
- evidence replay and immutable answer artifact;
- explicit regeneration semantics;
- cost reservation and caps;
- owner-only feature gate;
- prompt-injection tests;
- no raw CSV prompt policy;
- golden evaluation suite;
- manual disable switch.

Treat notes, filenames, symbols, news, filings, user questions, and imported descriptions as untrusted text.

External information is ingested and validated before it becomes trusted analytical context.

A disabled model returns deterministic answer/table/evidence where available.

No automatic fallback to runtime web search.

---

# 28. Evaluation and Exploration Control

Evaluate separately:

1. deterministic arithmetic;
2. claim correctness;
3. visual correctness/accessibility;
4. explanation quality;
5. product usefulness.

Compare:

- deterministic table only;
- deterministic table plus visual;
- legacy v2;
- v3 AI plus visual;
- abstention/no-conclusion baseline.

Owner feedback categories include:

- useful;
- correct but obvious;
- incorrect number;
- wrong evidence;
- misleading visual;
- wrong chart type;
- inaccessible visual;
- unsupported claim;
- missed limitation;
- unclear;
- too verbose;
- too shallow;
- repetitive;
- wrong setup;
- wrong grouping;
- data problem.

Severe feedback becomes a reproducible regression case without raw private data in Git.

Use separate:

- calibration set;
- holdout set;
- regression set;
- private acceptance set.

Maintain an exploration ledger for question variants, filters, scans, optimization attempts, selected results, and holdout state.

Repeated slicing cannot be hidden.

---

# 29. Private Data, Backup, and Degraded Mode

- Real broker files never enter Git, PRs, issues, normal logs, or default prompts.
- Account identifiers are redacted from screenshots/docs.
- Private files live in ignored private directories or protected storage.
- Backups are encrypted and versioned.
- SQLite/WAL backup uses a consistent approved mechanism.
- Restore is tested in isolation.
- Restore verifies integrity, schema, execution digest, dataset manifest, and reference calculations.
- Private data can be deleted.
- Repository guards scan for private paths and likely account data.

Degraded behavior:

- execution-only analytics continue when enrichment fails;
- deterministic tools remain available without AI;
- qualified snapshots remain available with freshness labels;
- unsupported claims/visuals disappear rather than being approximated;
- source outages are visible;
- no automatic web-search fallback.

---

# 30. Support and Resistance

`levels-system-v2` remains the factual producer.

Trader Intelligence does not build a second detector.

V3 adds a Zone Usability and Congestion Layer that:

- consumes complete replay-safe final zones;
- preserves source IDs;
- deduplicates only proven overlap;
- calculates congestion and clear space;
- selects at most one primary support and one primary resistance zone;
- suppresses conclusions when crowded, unstable, stale, synthetic-only, or basis-unsafe;
- treats gaps, premarket, halt resumes, sparse prints, anomalous wicks, sub-dollar prices, and reverse splits conservatively.

Level proximity alone never creates a mistake, grade, recommendation, or live action.

V3 AI and visuals remain execution-only until the zone layer passes stability, suppression, basis-safety, and blinded-usefulness gates.

---

# 31. Educational Product Boundary

Allowed:

- historical analytics;
- evidence-linked review;
- historical simulations;
- prospective tracking of user-created rules;
- observable behavior descriptions;
- owner corrections;
- accessible supporting visual evidence;
- Academy lesson links;
- uncertainty and limitations.

Not part of the journal:

- current buy/sell/hold instructions;
- live entry/exit alerts;
- current price targets;
- automatic execution;
- guaranteed improvement;
- tax advice;
- portfolio allocation;
- claims that historical simulations will repeat.

Use language such as:

- `historically`;
- `in this imported sample`;
- `associated with`;
- `rule to test`;
- `evidence is limited`;
- `supporting visual evidence`.

A chart may prove arithmetic within a bound dataset. It does not prove causation or future recurrence.

Avoid shame, emotional certainty, and prescriptive optimum language.

---

# 32. Implementation Tracks

## GA0-A1 — Containment and Architecture Boundaries

- deployment/hosting contracts;
- owner access containment;
- current-system inventory;
- minimal v3 boundary;
- architecture dependency guard;
- private-data guard;
- legacy hazard register.

## GA0-A2 — Canonical Execution and Exact Financial Truth

- exact decimals;
- canonical serialization/cryptographic hashing;
- execution identity/order;
- duplicate/correction/collision states;
- P/L/reconstruction policy;
- reference math;
- exact synthetic fixtures.

## GA0-A3 — Temporal, Manifest, Eligibility, and Query Foundation

- bitemporal corrections;
- factual lifecycle versus review disposition;
- open-position/cutoff policy;
- dataset/coverage manifests;
- capability eligibility;
- immutable analysis snapshot;
- stable evidence references;
- runtime validation;
- stale/invalidation states;
- WAL-safe backup/restore;
- parser-hardening contracts;
- canonical date/time/filter contract and filter digest.

No natural-language query parser or chart renderer belongs in GA0-A.

## GA0-B — Deterministic Proof

- read-only current-data adapter;
- weekday tool;
- daily-stop simulation;
- evidence resolver;
- inclusion/exclusion accounting;
- exact tables;
- validated chart-ready series;
- internal diagnostics;
- property/differential tests;
- v3 CI.

## GA0-C — Private Calibration

- private fixture manifest;
- reconciliation/coverage report;
- backup/restore drill;
- date/filter/series review on private data;
- owner evidence/exclusion review;
- safe regression cases;
- Gate 0 exit report.

## GA1 — Query and Visual Evidence

- deterministic query/filter UI;
- visual-template registry;
- accessible chart renderer;
- exact table alternatives;
- drill-down;
- text/chart consistency validation;
- comparison-period semantics;
- visual caching/replay;
- visual accessibility/performance tests.

## GA2 — Owner-Only AI

- natural-language intent proposal;
- approved tool selection;
- approved visual-template selection;
- claim/evidence validation;
- answer/visual replay;
- cost controls;
- private access gate;
- evaluation/feedback.

AI cannot generate series values or chart code.

## GA3 — Qualified Market Enrichment

- SEC;
- halt/suspension sources;
- instrument mapping;
- candle features;
- dated float/share structure;
- qualified FINRA context;
- quotes when available;
- zone usability;
- capability-specific enriched visuals.

## GA4 — Usefulness Calibration

Compare deterministic-only, deterministic-plus-visual, legacy v2, v3 AI, and abstention for correctness, trust, novelty, repetition, evidence use, accessibility, owner preference, cost, and latency.

## Public track

- identity/tenancy;
- PostgreSQL/RLS;
- object storage;
- durable jobs/outbox;
- deletion/retention;
- entitlements/rate limits;
- licensing;
- observability/recovery;
- beta and launch gates.

---

# 33. Absolute Prohibitions

- No financial authority using JavaScript `number`.
- No unknown prior inventory guessed into a closed trade.
- No user review action creating factual inventory changes.
- No USD/CAD aggregation without FX policy.
- No tax-P/L claim.
- No historical identity joined solely by current ticker.
- No raw execution compared with incompatible adjusted candles.
- No missing bars labeled an official halt.
- No candle-derived spread, depth, or exact slippage claim.
- No bar target touch labeled guaranteed fill.
- No current float automatically applied historically.
- No later catalyst used as entry-time knowledge.
- No FINRA short-sale volume labeled short interest.
- No LULD bands reconstructed from one-minute bars and called official.
- No unrestricted SQL.
- No vector database in the initial architecture.
- No second support/resistance detector.
- No AI calculation from raw executions.
- No AI-generated chart values or arbitrary chart code.
- No browser-authoritative financial aggregation.
- No chart and prose using different filters, snapshots, units, or denominators.
- No inaccessible visual without table alternative.
- No live directional journal output.
- No raw broker file in Git, issue, PR, normal log, or default prompt.
- No anonymous private-hosted owner route.
- No private-alpha shortcut represented as public-ready infrastructure.
- No long-lived dual-write at future cutover.
- No QA gate marked complete from one passing test.

---

# 34. Current Next Action

After the documentation architecture PR is accepted:

1. create `agent/trader-intelligence-v3-ga0-a1-containment` from current `main`;
2. implement GA0-A1 only;
3. run architecture, owner-containment, private-data, typecheck, test, and build verification;
4. open a focused draft PR;
5. review GA0-A1 before GA0-A2;
6. keep runtime work internal and model-free;
7. do not implement analytics, chart rendering, AI, support/resistance, or deployment.

---

# 35. Final Standards

> A result is trustworthy only when the system can identify the exact source data, canonical identity, policy, temporal state, eligibility decision, calculation, evidence, visual series, and explanation that produced it.

> Prefer a reproducible limited answer over an impressive answer built from incomplete coverage, weak data, inaccessible visuals, or untraceable assumptions.

> Build table truth first, chart-ready series second, accessible deterministic visuals third, and AI-directed visual selection last.
