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
- the source-governance, reproducibility, and evaluation third QA review.

The detailed reviews remain architectural rationale and audit evidence.

## Precedence

1. latest explicit decision in `src/docs/trader-intelligence-v3-project-log.md`;
2. this controlling architecture specification;
3. the active phase or execution plan;
4. detailed v3 reviews and master plan as rationale;
5. legacy v1/v2 plans as implementation history.

A project-log entry may record gate progress or an accepted decision. It may not silently weaken this specification. Material architecture changes require updating this file.

---

# 2. Current Product Facts

- The current user and tester is the product owner.
- The system is not currently a public multi-user product.
- The current deployment profile is `private_owner_alpha`.
- The product is primarily for small-cap and micro-cap active traders.
- It analyzes completed broker executions and historical context.
- It is designed for education, review, and self-improvement.
- It is not a live signal service.
- It is not an automated broker.
- It is not a tax-accounting product.
- It is not a portfolio-allocation service.
- It does not promise profit or guaranteed improvement.
- Future public use remains possible, but public infrastructure must not block private-owner usefulness validation.
- Private-alpha status does not relax exact financial math, evidence, no-lookahead, price-basis safety, simulation honesty, backup, or private-data handling.

---

# 3. Core Architecture

```text
private broker source data
  -> deterministic import and validation
  -> exact accepted execution ledger
  -> versioned reconstruction and coverage
  -> content-addressed dataset manifest
  -> per-capability eligibility
  -> deterministic analytics and simulations
  -> claim and evidence ledger
  -> evaluated owner-only AI explanation
  -> qualified small/micro-cap enrichment by source capability
  -> usefulness calibration
  -> future public-platform hardening
```

Code is authoritative for:

- CSV parsing;
- validation and repair state;
- duplicate detection;
- execution normalization;
- financial math;
- position and round-trip reconstruction;
- session classification;
- instrument and basis checks;
- market features;
- statistics;
- simulations;
- evidence identifiers;
- capability and quality states;
- source provenance.

AI may:

- interpret the user’s question;
- select approved tools;
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
- a real-time web-search authority;
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

## Hosting modes for the current profile

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
- local job adapter for small workloads;
- private real-data calibration outside Git.

Still requires:

- file permissions;
- data directory outside Git;
- backup and restore;
- secrets outside source;
- no raw financial data in normal logs;
- fail-closed profile checks.

### `private_hosted`

Requires:

- owner authentication;
- owner authorization on every private route;
- encrypted transport;
- secure session handling;
- no anonymous import, trade, analytics, or AI access;
- private storage/database;
- audit of sensitive mutations;
- fail closed when owner identity is unavailable.

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

# 5. Initial Asset and Broker Scope

## Initial asset scope

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

Existing Webull, Robinhood, and Schwab adapters remain useful but do not receive the same production-confidence claim until calibrated on representative files.

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

Broker-reported totals are reconciliation evidence, not silent replacements for v3 calculations.

Store broker-reported and analytical values separately.

## User inputs

User inputs may be authoritative for personal intent:

- intended setup;
- planned stop;
- planned target;
- rule being tested;
- accepted setup label;
- personal note.

The timestamp and input type must be stored. A post-trade note is not a pre-trade plan.

## Market path

One declared provider and basis owns one market-path snapshot unless a versioned merge policy exists.

## Regulatory and exchange events

Prefer official regulator or exchange sources.

Qualified third-party or first-party issuer sources may support a finding when scope and limitations are explicit.

## Derived features

Derived features are not source facts. They link to exact inputs and versions.

## AI output

AI output is explanatory only.

## Conflict states

Use explicit states:

- `resolved_by_precedence`;
- `within_tolerance`;
- `conflicting_sources`;
- `stale_source`;
- `unresolved_identity`;
- `basis_mismatch`;
- `manual_review_required`.

---

# 7. Exact Financial Representation

No binary floating-point value is authoritative for:

- money;
- execution prices;
- share quantities;
- fees;
- FX rates;
- P/L;
- simulation thresholds that affect fills.

Requirements:

- exact decimal application library behind domain wrappers;
- decimal-string serialized contracts;
- exact storage representation;
- versioned rounding policy;
- no premature intermediate rounding;
- explicit reconciliation tolerance;
- invalid/overflow handling.

Candidate libraries may include `decimal.js` or another exact-decimal library after ADR comparison.

The library is wrapped behind domain types rather than imported throughout business logic.

---

# 8. Analytical P/L and Reconstruction Policy

Every reconstructed result records a policy version.

The policy must distinguish:

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

---

# 9. Position and Trade Hierarchy

Use distinct objects:

1. **Execution** — accepted fill or accepted average-fill record.
2. **Position lifecycle** — inventory history for instrument/account/direction.
3. **Analytical round trip** — flat-to-flat unit used for trade review.
4. **Ticker story** — related same-instrument attempts.
5. **Day session** — full account/day review context.

Do not pretend every broker row is a trade.

Do not merge all same-symbol rows into one trade without position-state evidence.

---

# 10. Dataset Coverage

Every dataset manifest records:

- account IDs;
- import batches;
- file hashes;
- accepted execution IDs;
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

Broad answers identify the imported period and limitations.

---

# 11. Content-Addressed Manifests

## Dataset manifest

Includes:

- content hash;
- source-file hashes;
- accepted execution IDs;
- correction event IDs;
- reconstruction policy;
- session policy;
- instrument-resolution version;
- currency policy;
- coverage state.

## Market-enrichment manifest

Includes:

- provider;
- raw/adjusted basis;
- instrument ID;
- source symbol;
- requested interval;
- candle/quote/event/source hashes;
- corporate-action version;
- source retrieval and effective times;
- level snapshot IDs.

## Derivation manifest

Includes:

- input manifest;
- tool/function version;
- parameters and filters;
- exclusions;
- deterministic result hash.

## Answer manifest

Includes:

- question and filters;
- tool plan;
- tool runs;
- claims;
- evidence;
- capability tier;
- prompt/model/schema versions;
- validation;
- cost;
- answer hash.

Source or policy corrections mark dependent current results stale and trigger explicit recomputation.

---

# 12. Analysis Eligibility

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
- simulation analytics.

Each capability returns:

- `eligible`;
- `eligible_with_limitations`;
- `ineligible`;
- reason codes;
- source snapshot IDs.

Every tool returns:

- candidate count;
- eligible count;
- included count;
- excluded count;
- exclusion reasons;
- coverage state;
- evidence capability.

---

# 13. Time and Session Model

Store source times in UTC.

Classify exchange sessions through a versioned America/New_York policy.

First-class session states:

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

External events distinguish:

- event/effective time;
- first-public time;
- retrieval time;
- processing time;
- correction time when applicable.

Later information cannot contaminate entry-time reasoning.

---

# 14. Instrument Identity and Corporate Actions

Ticker is not a durable instrument ID.

V3 maintains:

- issuer identity;
- instrument identity;
- symbol assignment with validity period;
- corporate-action events;
- resolution attempts;
- manual corrections.

CIK is issuer/filer context, not a complete security identity.

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

---

# 15. Market-Data and Price-Basis Rules

- Preserve raw broker execution prices.
- Every market-data snapshot declares raw/adjusted basis.
- Do not compare raw executions with incompatible adjusted candles.
- Split and reverse-split warnings fail chart-derived analysis closed.
- Do not silently blend providers.
- A fallback provider creates a new snapshot and manifest.
- Missing premarket data is not filled from regular-session-only data.
- Aggregation method is versioned.
- Provider disagreements create diagnostics.

Basis-unsafe trades remain eligible for execution-only analysis.

---

# 16. Evidence Capability Tiers

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

A claim cannot exceed the available capability.

Stale, conflicting, incomplete, or basis-unsafe data may reduce the trusted capability below the nominal tier.

---

# 17. Spread, Liquidity, Slippage, and Executability

OHLCV candles cannot prove:

- bid/ask spread;
- quote size;
- market depth;
- available liquidity;
- exact slippage;
- executable full fill.

Quote-relative execution cost requires historical quote data.

Plan-relative slippage requires intended/order price data.

Candle-relative fill location must not be labeled verified slippage.

A target touched by a bar is a price-path event, not proof that the full hypothetical order would fill there.

Simulation outputs declare executable confidence and fill assumptions.

---

# 18. Halts and LULD

- Missing bars do not prove a trading halt.
- Halt conclusions require qualified event data.
- Store halt source, scope, start, resume, reason/code, and quality.
- Simulations cannot fill during a qualified halt interval.
- Resume gaps require explicit policy.
- The LULD Plan is a rules reference, not a historical band/event feed.
- Do not reconstruct official LULD bands from one-minute OHLCV alone.

---

# 19. Float, Short Data, Catalysts, and Filings

## Float

- source and as-of date required;
- current float is not automatically historical float;
- source disagreement is visible;
- stale float suppresses confident findings;
- float rotation is an estimate.

## FINRA short data

- short-sale volume is not short interest;
- off-exchange short-sale volume is not consolidated with all exchange data;
- reporting/publication lag is explicit;
- no squeeze prediction or directional verdict is derived solely from it.

## Filings and catalysts

- source document and accession/source ID required;
- first-public time required;
- later filings cannot enter decision-time reasoning;
- event extraction is derived and versioned;
- source document remains authoritative;
- AI web search snippets are not source records.

---

# 20. External Source Registry

Every source definition records:

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

No undocumented web endpoint becomes a production contract.

Recommended source adoption order:

1. registry and synthetic adapters;
2. SEC filing metadata;
3. exchange halt sources;
4. instrument-mapping candidates;
5. dated share structure and carefully qualified FINRA context;
6. quote data only after selecting a suitable provider;
7. other sources only for a defined feature need.

---

# 21. Approved External Source Opportunities

## SEC EDGAR

Use for:

- submissions;
- filing metadata;
- accession/document source;
- XBRL Company Facts;
- issuer mapping candidates;
- filing RSS;
- dated shares-outstanding/public-float candidates;
- trading-suspension context.

Rules:

- server-side requests;
- declared user agent;
- fair-access rate limit;
- bulk data for large syncs;
- ticker mapping treated as incomplete;
- XBRL fact-quality checks;
- CIK not treated as sole instrument ID.

## Nasdaq Trader Symbol Directory

Use for:

- current symbol/listing context;
- market category;
- test issue;
- security type clues;
- round lot.

Rules:

- current-day only unless snapshotted;
- terms/profile review;
- not complete historical identity.

## Nasdaq Trader trade-halt RSS

Use as qualified halt source with raw snapshots, source scope, and date-query provenance.

## NYSE trading halts

Use for NYSE-group current and limited historical halt context.

## LULD Plan

Use as rules reference only without actual event/band data.

## FINRA

Use carefully for:

- off-exchange short-sale volume;
- twice-monthly short interest;
- OTC threshold if later in scope;
- OTC transparency if later needed.

Keep dataset-specific terms and limitations.

## OpenFIGI

Use for mapping candidates with stored request, candidate set, selected result, confidence, and manual correction.

## Nasdaq Data Link

Treat individual datasets as experimental until their source, terms, coverage, and value are reviewed.

---

# 22. Approved Open-Source Tool Opportunities

## Exact decimal library

Evaluate `decimal.js`, `big.js`, or another exact-decimal implementation through ADR and differential tests.

## Property testing

Evaluate `fast-check` for:

- execution-stream properties;
- reversals;
- partial fills;
- idempotency;
- correction events;
- simulation state machines;
- race/model-based tests.

Persist seeds and minimal counterexamples.

## Exchange-calendar test oracle

`exchange_calendars` may be used as an independent test oracle or fixture generator.

It is not automatically the runtime authority, and pre/post-market sessions require separate v3 policy.

---

# 23. Statistical Modes and Integrity

Every analysis declares a mode:

- `direct_hypothesis`;
- `fixed_comparison`;
- `exploratory_scan`;
- `optimization`;
- `similarity_search`.

Requirements:

- sample size;
- independent day count;
- independent ticker count;
- clustering;
- median and total;
- outlier concentration;
- result without largest day/ticker where relevant;
- recent versus older period;
- strategy-era context;
- multiple-comparison control for scans;
- chronological holdout for optimized rules;
- prospective tracking before calling a rule validated.

Questions phrased as `why` receive associated contributors, not unsupported causality.

---

# 24. User Intent, Setups, and Rules

Setup sources remain distinct:

- user intended setup;
- user post-trade tag;
- deterministic candidate;
- AI likely setup;
- chart-validated setup;
- user-confirmed setup;
- unclassified.

Rules store:

- version;
- created/effective/retired time;
- scope;
- definition;
- historical simulation;
- prospective status.

A rule created after a trade cannot label that trade a violation.

R-multiple requires independently recorded planned risk.

---

# 25. Counterfactual Simulation

Every simulation defines:

- intervention time;
- actual actions retained;
- actual actions removed;
- hypothetical actions inserted;
- resulting position state;
- account/session scope;
- fill model;
- fee/slippage model;
- bar resolution;
- same-bar ambiguity;
- halt behavior;
- gap behavior;
- liquidity assumption;
- exclusions;
- optimistic/conservative results where appropriate;
- executable-confidence state;
- policy version.

Do not preserve shares after a hypothetical partial exit as though they still existed.

Do not claim portfolio realism without buying-power/capital modeling.

---

# 26. Support and Resistance

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

V3 AI remains execution-only until the zone layer passes stability, suppression, basis-safety, and blinded-usefulness gates.

---

# 27. Educational Product Boundary

Allowed:

- historical analytics;
- evidence-linked review;
- historical simulations;
- prospective tracking of user-created rules;
- observable behavior descriptions;
- owner corrections;
- Academy lesson links;
- uncertainty and limitations.

Not part of the journal:

- current buy/sell/hold instructions;
- live entry or exit alerts;
- current price targets;
- automatic execution;
- guaranteed improvement;
- tax advice;
- portfolio allocation;
- claims that historical simulation will repeat.

Use language such as:

- `historically`;
- `in this imported sample`;
- `associated with`;
- `rule to test`;
- `evidence is limited`;
- `review these trades`.

Avoid shame, emotional certainty, and prescriptive optimum language.

---

# 28. AI Grounding and Safety

Owner-only AI may begin only after deterministic tools and validation pass.

Required before GA2:

- approved tool registry;
- bounded tool plan;
- claim ledger;
- numeric/unit/currency validator;
- evidence validator;
- capability validator;
- limitation preservation;
- response schema;
- answer replay;
- cost reservation and caps;
- owner-only feature gate;
- prompt-injection tests;
- no raw CSV prompt policy;
- golden evaluation suite;
- manual disable switch.

Treat notes, filenames, symbols, news, filings, and imported descriptions as untrusted text.

External information must be ingested and validated before it becomes trusted analytics context.

---

# 29. Evaluation

Evaluate four layers:

1. deterministic arithmetic;
2. claim correctness;
3. explanation quality;
4. product usefulness.

Compare:

- deterministic result only;
- legacy v2 coaching;
- v3 AI explanation;
- abstention/no-conclusion baseline where relevant.

Owner feedback categories include:

- useful;
- correct but obvious;
- incorrect number;
- wrong evidence;
- unsupported claim;
- missed limitation;
- unclear;
- too verbose;
- too shallow;
- repetitive;
- wrong setup;
- wrong grouping;
- data problem.

Severe feedback becomes a reproducible regression case without committing raw financial data.

---

# 30. Private Data and Backup

- Real broker files never enter Git.
- Account identifiers are redacted from screenshots and docs.
- Private source files live in an ignored private directory or protected storage.
- Normal logs exclude raw rows.
- Model prompts exclude raw CSV by default.
- Backups are encrypted and versioned.
- Restore procedures are tested.
- Source and database hashes are recorded.
- Private data can be deleted.

Repository guards should scan for likely account numbers, private fixture paths, and broker-file patterns.

---

# 31. Implementation Tracks

## GA0-A — Control and Exact Truth

- architecture specification;
- inventory;
- deployment/hosting contracts;
- decimal, P/L, time, instrument, basis, dataset, eligibility decisions;
- reference math;
- first synthetic fixtures;
- private-data guards.

## GA0-B — Deterministic Proof

- read-only adapter;
- coverage manifest;
- weekday tool;
- daily-stop simulation;
- evidence resolver;
- exclusion accounting;
- internal debug output;
- property/differential tests;
- v3 CI.

## GA0-C — Private Calibration

- private fixture manifest;
- reconciliation/coverage report;
- backup/restore test;
- owner review of evidence and exclusions;
- Gate 0 exit report.

## GA1 — Execution-Only Analytics

- time of day;
- sequence;
- after-loss/after-win;
- repeated attempts;
- size performance;
- hold time;
- adds/reductions;
- fees;
- open-position separation.

## GA2 — Owner-Only AI

- claim/evidence validation;
- answer schema/replay;
- cost controls;
- private access gate;
- evaluation harness;
- feedback.

## GA3 — Qualified Market Enrichment

- SEC;
- halt sources;
- instrument mapping;
- candle features;
- dated float/share structure;
- carefully qualified FINRA context;
- quote data when available;
- zone usability.

## GA4 — Usefulness Calibration

- compare v2/v3/deterministic/abstention;
- measure correctness, trust, novelty, repetition, evidence usage, and owner preference;
- decide whether to expand, revise, or stop.

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

# 32. Absolute Prohibitions

- No financial authority using JavaScript `number`.
- No unknown prior inventory guessed into a closed trade.
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
- No live directional journal output.
- No raw broker file in Git, issue, PR, normal log, or default prompt.
- No anonymous private-hosted owner route.
- No private-alpha shortcut represented as public-ready infrastructure.
- No long-lived dual-write at future cutover.
- No QA gate marked complete from one passing test.

---

# 33. Current Next Action

After the documentation PR is accepted:

1. create `agent/trader-intelligence-v3-gate-0-foundation` from current `main`;
2. implement GA0-A only;
3. run exact reference, architecture, private-data, typecheck, test, and build verification;
4. open a focused draft PR;
5. review GA0-A before starting GA0-B;
6. keep all runtime work internal and model-free;
7. do not redesign `/coach`;
8. do not consume support/resistance;
9. do not deploy.

---

# 34. Final Standard

> A result is trustworthy only when the system can identify the exact source data, policy, eligibility decision, calculation, evidence, and explanation that produced it.

> Prefer a reproducible limited answer over an impressive answer built from incomplete coverage, weak external data, or untraceable assumptions.

> Build one small verified capability at a time, then measure whether it helps the owner understand and improve completed trading behavior.
