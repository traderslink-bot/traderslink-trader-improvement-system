# Trader Intelligence v3 Second-Pass QA, Private Alpha, and Small/Micro-Cap Domain Review

**Date:** 2026-07-17 America/Toronto  
**Status:** Mandatory second-pass amendments; architecture approved with sequencing and domain corrections  
**Reviewed documents:**

- `src/docs/trader-intelligence-ai-journal-v3-master-plan-2026-07-17.md`
- `src/docs/trader-intelligence-v3-qa-architecture-review-2026-07-17.md`
- `src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`
- `src/docs/trader-intelligence-plan-index.md`
- `plan.md`
- `handoff.md`

**Repository:** `traderslink-bot/traderslink-trader-improvement-system`  
**Authority:** This is an independent second-pass QA control document. Where it is more specific or conflicts with the first QA review, the master plan, or the active Gate 0 plan, this document controls until those documents are revised.

---

## 1. New Operating Facts Supplied by the Product Owner

The architecture must now explicitly record these facts:

1. Trader Intelligence is currently a **private owner-only alpha**.
2. It is not currently a public multi-user product.
3. The current tester is the product owner.
4. The primary intended trading domain is **small-cap and micro-cap active trading**, especially fast intraday and momentum trading.
5. The product is a retrospective trading journal, educational review system, and self-improvement assistant.
6. It is not intended to provide investment advice, portfolio recommendations, live trade alerts, automated execution, or personalized real-time buy/sell instructions.

These facts materially affect implementation sequencing, domain requirements, language policy, and QA.

They do **not** weaken correctness requirements. A private alpha can still produce misleading statistics or incorrect P/L. Exact calculations, versioned assumptions, no-lookahead rules, and evidence-linked answers remain mandatory.

---

## 2. Executive Verdict

The v3 architecture remains the correct direction.

The first QA pass correctly identified serious future production gaps in identity, tenancy, persistence, exact financial types, durable jobs, file ingestion, statistical integrity, AI grounding, and support/resistance consumption.

However, the first QA pass overcorrected in one important way:

> It treated future public multi-user hardening as though it had to be the immediate critical path for validating a private single-user product.

That sequencing would create a real risk of spending a large amount of time on multi-user infrastructure before proving that the new analytics and AI coach are genuinely useful for the owner’s small/micro-cap trading workflow.

The corrected engineering ruling is:

> Build one architecture with explicit deployment profiles. Prove deterministic and AI-assisted usefulness in a private owner-only alpha first. Preserve clean interfaces so public identity, PostgreSQL, object storage, durable workflows, billing, and multi-tenant controls can be added without rewriting the financial domain.

This means:

- exact financial math remains early;
- accounting and reconstruction policy remain early;
- dataset and evidence versioning remain early;
- market-data basis safety remains early;
- private-alpha backup and privacy remain early;
- multi-user RLS, billing, public upload infrastructure, and public SLOs may follow after private-alpha product value is proven;
- no local shortcut may be mistaken for public-production readiness.

---

## 3. Deployment Profiles Are Now a Required Contract

V3 must define a deployment profile contract instead of using the ambiguous words `local`, `demo`, `production`, or `beta` without a precise meaning.

Suggested contract:

```ts
export type TraderIntelligenceDeploymentProfile =
  | "private_owner_alpha"
  | "private_invited_alpha"
  | "public_beta"
  | "public_production";
```

### 3.1 `private_owner_alpha`

Purpose:

- allow the owner to test the product with personal broker files;
- validate calculations, analytics, simulations, evidence, UX, and AI usefulness;
- permit rapid iteration without prematurely building every public-platform subsystem.

Allowed:

- one explicitly configured owner identity;
- local durable SQLite or an isolated private database;
- direct local file selection or bounded authenticated upload;
- synchronous or local job adapters for small workloads;
- owner-only AI calls after deterministic evidence gates pass;
- private real-data calibration outside the repository;
- feature flags that are impossible to expose to unrelated users;
- manual recovery tools during alpha.

Required:

- exact decimal financial math;
- explicit analytical P/L policy;
- no temporary-filesystem database as the only copy of personal data;
- backup and restore procedure;
- private raw-file handling;
- no raw CSV in logs or model prompts;
- data-basis and timezone safety;
- versioned tools, simulations, and findings;
- clear alpha banner or environment diagnostics;
- no accidental public access;
- no production marketing claims.

Forbidden:

- pretending a local owner identity is a multi-user authorization model;
- treating local SQLite as future public-production authority;
- exposing the owner’s imported trades publicly;
- public registration;
- public upload endpoints without authentication and limits;
- live trade recommendations;
- automated order execution;
- silent model-driven calculations;
- unrestricted SQL.

### 3.2 `private_invited_alpha`

This profile is optional and should not be assumed.

It would allow a very small invited test group. Before enabling it, require:

- real authentication;
- server-derived user scope;
- tenant isolation;
- per-user file and AI limits;
- deletion controls;
- audit logging;
- database backups;
- secure upload storage;
- cross-user security tests.

### 3.3 `public_beta`

Requires the future production foundations identified in the first QA review:

- shared platform identity;
- PostgreSQL authority;
- tenant-safe repositories and RLS where practical;
- object-storage upload;
- durable jobs and transactional outbox;
- deletion and retention workflows;
- public rate limits;
- billing or entitlement enforcement;
- production monitoring;
- provider licensing review;
- support and incident processes.

### 3.4 `public_production`

Requires all public-beta controls plus:

- recovery drills;
- SLOs;
- cost controls under load;
- security review;
- provider-failure runbooks;
- migration rollback;
- formal launch acceptance.

### 3.5 Fail-closed environment rule

The application must refuse to start a public or Vercel production deployment with a `private_owner_alpha` identity or an ephemeral database unless an explicit safe preview mode makes it impossible to accept real user data.

---

## 4. Revised Sequencing: Value Validation and Public Readiness Must Be Separate Tracks

The original phase list can remain as the long-term architecture, but implementation must be overlaid with two tracks.

### Track A: Private Owner Alpha Value Validation

#### Alpha Gate A0 — Financial and Evidence Foundation

Build:

- exact decimal contracts;
- analytical P/L and reconstruction policy;
- dataset versioning;
- read-only current-data adapters;
- independent reference math;
- synthetic golden fixtures;
- weekday analytics;
- stop-after-loss simulation;
- evidence resolution;
- private-alpha storage and backup policy.

No model call is required in A0.

#### Alpha Gate A1 — Execution-Only Analytics Expansion

Add the first supported questions using execution data only:

- weekday performance;
- time-of-day performance;
- trade-sequence performance;
- performance after wins and losses;
- position-size behavior;
- hold-time behavior;
- add and reduction behavior;
- ticker-repeat attempts;
- daily-stop simulations.

These tools must be useful without candles or support/resistance.

#### Alpha Gate A2 — Owner-Only AI Explanation

After tool and claim validation exists, permit an owner-only AI route behind a hard private-alpha feature flag.

The AI may:

- classify the owner’s question;
- call approved tools;
- explain validated results;
- link evidence;
- propose historical rule experiments.

The AI may not:

- inspect raw CSV by default;
- calculate numbers itself;
- provide live market instructions;
- access public users because none exist;
- imply public readiness.

This gate allows product usefulness to be tested before building full public multi-tenancy.

#### Alpha Gate A3 — Small/Micro-Cap Market Context

Add market context progressively by evidence tier:

1. candle-enriched features;
2. halt/event features when reliable halt data exists;
3. quote/spread features when historical quote data exists and is licensed;
4. float/share-structure features with dated provenance;
5. catalyst/filing context with source and publication-time provenance;
6. zone usability and congestion after the separate level usefulness gate.

#### Alpha Gate A4 — Product Usefulness Calibration

Measure whether the owner finds the new system more useful than the legacy coach.

Required evaluation dimensions:

- answer correctness;
- evidence usefulness;
- reduction in repetitive coaching;
- reduction in noisy support/resistance feedback;
- ability to answer follow-up questions;
- clarity of limitations;
- speed;
- trust;
- whether suggested rule experiments feel actionable as review tools without becoming live advice.

### Track B: Future Public Readiness

This track contains:

- shared identity;
- multi-user authorization;
- PostgreSQL authority;
- RLS;
- object storage;
- durable workflows;
- billing and entitlements;
- public retention and deletion;
- support tooling;
- public market-data licensing;
- SLOs and recovery.

Track B must not be abandoned. It simply must not block owner-only validation of the product’s core value.

---

## 5. What Remains P0 Even for a Private Alpha

Private does not mean mathematically casual.

The following remain mandatory before trusting results on the owner’s real trades:

1. exact decimal money, price, quantity, fee, and P/L handling;
2. explicit reconstruction and analytical P/L policy;
3. broker timestamp and session-time correctness;
4. duplicate and prior-inventory handling;
5. raw-versus-adjusted price-basis safety;
6. corporate-action warnings;
7. dataset versioning;
8. evidence IDs that resolve to source trades;
9. no-lookahead decision-time features;
10. simulation assumptions;
11. honest missing-data states;
12. private backup and recovery;
13. separation of broker-reported P/L from journal analytical P/L;
14. no raw broker data in AI prompts by default;
15. no claim of live advice or guaranteed improvement.

The following can be deferred until invited or public users are considered:

- full workspace membership management;
- multi-tenant RLS enforcement in production;
- billing;
- customer support roles;
- public object-storage upload;
- public deletion UI;
- public SLOs;
- large-scale job orchestration;
- multi-user cost allocation;
- generalized onboarding for many brokers.

Interfaces should still anticipate these later needs.

---

## 6. Product Scope Must Be More Specific Than “Active Equity Traders”

The intended product is not a generic portfolio journal.

The primary domain is:

- U.S. listed small-cap and micro-cap common equities;
- active intraday trading;
- premarket, regular-session, and after-hours execution;
- momentum, breakout, pullback, fade, reclaim, halt-resume, and news-driven trades;
- repeated same-ticker attempts;
- partial entries and exits;
- fast volatility;
- wide or changing spreads;
- low or unstable liquidity;
- frequent corporate actions and listing events.

### 6.1 Initial instrument scope

Recommended first scope:

- U.S. listed common stocks on supported exchanges;
- long and short execution facts in the ledger;
- coaching calibrated first for the owner’s actual dominant direction;
- no options;
- no crypto;
- no futures;
- no forex;
- no mutual funds;
- no tax accounting.

Quarantine or explicitly classify:

- warrants;
- rights;
- units;
- preferred shares;
- ADR edge cases;
- ETFs when they appear;
- OTC securities;
- Canadian-listed securities;
- symbols that cannot be resolved to a stable instrument identity.

OTC support should not be implied by the phrase `micro-cap`. OTC market data, sessions, quote behavior, corporate actions, and identifiers can differ materially. Add OTC only as an intentional later scope.

### 6.2 Direction scope

The execution ledger must correctly represent shorts from the beginning.

However, short-specific coaching should remain separately gated until the system can account for relevant facts such as:

- sell-short versus ordinary sell;
- buy-to-cover;
- prior inventory;
- locate or borrow fees when present;
- hard-to-borrow limitations;
- SSR context when available;
- halt and squeeze risk;
- overnight borrow treatment.

Execution facts may be supported before short-side coaching is fully calibrated.

---

## 7. Stable Instrument Identity Is Critical in Small/Micro Caps

A ticker symbol is not a durable instrument ID.

Small and micro caps frequently experience:

- ticker changes;
- reverse splits;
- ordinary splits;
- mergers;
- acquisitions;
- delistings;
- relistings;
- exchange changes;
- symbol reuse;
- bankruptcy or reorganization;
- CUSIP changes;
- name changes;
- share-class changes.

V3 must introduce an instrument identity contract containing, where available:

- internal instrument ID;
- symbol at execution time;
- exchange or venue identity;
- provider symbol;
- company name at the relevant time;
- security type;
- currency;
- effective symbol-history intervals;
- corporate-action links;
- data-provider identifiers;
- resolution confidence;
- unresolved state.

Rules:

- never join historical data solely by present-day ticker;
- preserve the symbol exactly as imported;
- resolve the symbol as of the execution timestamp;
- quarantine unresolved symbol-history cases from chart-derived analytics;
- keep execution P/L available even when market enrichment cannot resolve the instrument;
- do not merge two historical issuers simply because they used the same ticker at different times.

---

## 8. Price Basis and Corporate Actions Need a First-Class Contract

Micro-cap history is especially vulnerable to split and adjustment errors.

The current repository already has basis-warning protections. V3 must promote those protections into an explicit domain contract.

For every market-data snapshot, store:

- raw or adjusted basis;
- adjustment source;
- adjustment version;
- corporate actions included;
- provider timestamp;
- execution-price alignment result;
- validation warnings;
- whether chart-derived features are allowed.

Rules:

- broker execution prices remain raw historical execution facts;
- adjusted candles may be used only when transformed onto a basis aligned with the execution;
- split-adjusted candles must never be compared directly to unadjusted execution prices;
- a likely basis multiple must fail chart-derived findings closed;
- reverse-split and symbol-change periods require dedicated fixtures;
- returns, VWAP distance, MFE, MAE, zones, and simulations must use one aligned basis;
- execution-only analytics remain available when basis alignment fails.

Corporate-action handling must not silently “fix” imported rows. It should attach versioned adjustment or diagnostic records.

---

## 9. Session Modeling Must Reflect Small-Cap Trading Reality

Premarket is not an optional label for this product.

The session contract should support:

- premarket;
- regular session;
- after-hours;
- overnight or unsupported session where applicable;
- market holidays;
- half days;
- daylight-saving transitions;
- exchange calendar version;
- broker-local timestamp interpretation;
- UTC storage;
- America/New_York trading-session labels.

Required features include:

- entry time relative to 4:00 a.m. ET;
- entry time relative to 9:30 a.m. ET open;
- premarket high and low available before entry;
- premarket volume before entry;
- first five, fifteen, and thirty minutes of regular session;
- after-hours hold or execution state;
- session transition exposure;
- repeated attempts across premarket and regular session;
- overnight carry.

Do not assume a simple calendar date is a complete trading-session key.

---

## 10. Halt and Resume Context Requires Real Event Data

The current runtime analysis is primarily candle-based. A missing candle interval does not prove a trading halt.

A halt feature may be user-facing only when supported by an authoritative or explicitly qualified halt source.

Suggested halt-event contract:

```ts
interface TradingHaltEvent {
  instrumentId: string;
  haltStartedAt: string;
  resumeAt: string | null;
  code: string | null;
  source: string;
  sourceEventId: string | null;
  quality: "verified" | "probable" | "unknown";
}
```

Required review facts:

- entry before halt;
- entry after resume;
- position held through halt;
- add after resume;
- exit after resume;
- number and duration of halts;
- first reopen print when available;
- post-resume spread/quote state when available;
- simulation blocked or qualified across halt intervals.

Rules:

- do not infer an official halt solely from zero-volume bars;
- do not assume an order could fill while trading was halted;
- do not simulate a target or stop fill through a halt without an explicit reopen and fill model;
- distinguish LULD/volatility events from news-pending or regulatory halts when source data permits;
- if halt data is unavailable, use `halt_context_unavailable`, not an invented classification.

---

## 11. Candle Data Cannot Prove Spread, Liquidity, or Slippage

This is a major domain boundary.

The current canonical market-data contract is candle-oriented. OHLCV bars cannot establish:

- bid-ask spread at an execution;
- quoted size;
- available depth;
- midpoint at order submission;
- queue position;
- market impact;
- whether the trader crossed the spread;
- whether the order was marketable;
- expected versus actual fill;
- exact slippage.

V3 must distinguish at least three concepts:

### 11.1 Quote-relative execution cost

Requires historical bid/ask data near the execution.

Possible metrics:

- fill versus bid;
- fill versus ask;
- fill versus midpoint;
- effective spread;
- quoted spread;
- quote age;
- execution size versus quoted size.

### 11.2 Plan-relative slippage

Requires a user-entered or broker-provided intended price, limit price, stop trigger, or order-submission state.

Without intended price, the app cannot honestly say how far the fill deviated from the trader’s plan.

### 11.3 Candle-relative location

Can be calculated from bars, but it is not slippage.

Examples:

- fill versus candle open/high/low/close;
- fill versus VWAP;
- fill versus breakout level;
- fill versus recent range.

The UI and AI must never label candle-relative location as verified spread or slippage.

### 11.4 Optional order and execution metadata

Extend the canonical source model when a broker export provides:

- order type;
- limit price;
- stop price;
- order submitted time;
- order modified time;
- time in force;
- route or venue;
- broker order ID;
- individual fill versus average fill;
- liquidity indicator;
- regulatory or exchange fees.

These fields are optional and quality-scored. Missing fields must reduce claim capability rather than being inferred.

---

## 12. Liquidity and Capacity Matter in Micro-Cap Simulations

A target being touched by a one-minute bar does not prove the owner could have sold the full hypothetical quantity at that price.

Simulation outputs must disclose whether they assume:

- unlimited liquidity at touch;
- full fill at first touch;
- partial fill based on bar volume;
- fill at next bar open;
- spread penalty;
- fixed slippage;
- percentage slippage;
- quote-aware fill;
- conservative range.

For small/micro-cap simulations, add:

- order shares as a percentage of bar volume;
- order dollar value versus dollar volume;
- size versus quote size when quote data exists;
- halt or gap-through handling;
- partial-fill policy;
- capacity warning;
- no-fill outcome where appropriate.

Default rule:

> If only OHLCV bars exist, target and stop simulations are price-path scenarios, not proof of executable fills.

Results should use wording such as:

> Under a full-fill-at-touch assumption using one-minute bars…

or:

> The bar reached the target, but available liquidity is unknown. The result is an optimistic price-path estimate rather than a verified executable outcome.

---

## 13. Float, Shares Outstanding, and Float Rotation Require Dated Provenance

Float is especially important to the intended users and especially easy to overstate.

Float values can be:

- stale;
- inconsistent across providers;
- changed by offerings, conversions, warrants, splits, or insider restrictions;
- difficult to align to a historical timestamp.

V3 float context must include:

- value;
- unit;
- source;
- source document or endpoint;
- published or effective date;
- retrieved date;
- as-of confidence;
- adjustment status;
- limitation text.

Float rotation must be treated as an estimate:

```text
reported volume divided by dated estimated public float
```

Required features may include:

- premarket float rotation before entry;
- regular-session float rotation before entry;
- first-hour float rotation;
- full-day float rotation;
- volume since catalyst publication;
- rotation at entry;
- rotation before final exit;
- source disagreement flag.

Rules:

- never treat current float as automatically valid for an old trade;
- never present float rotation without the float source and as-of limitation;
- do not claim that rotation predicts continuation;
- use it as contextual evidence about activity, crowding, and execution conditions;
- suppress the metric when corporate-action alignment is unsafe.

---

## 14. Catalyst, Filing, Dilution, and Listing Context Need Event-Time Provenance

Small/micro-cap review benefits substantially from understanding why a stock moved.

However, catalyst context can create severe lookahead errors.

Every event must distinguish:

- event effective time;
- first public availability time;
- source publication time;
- provider discovery time;
- filing acceptance time;
- amendment or correction time;
- timezone;
- source URL or stable source ID;
- classification confidence.

Potential event categories:

- press release;
- SEC filing;
- offering;
- registered direct offering;
- private placement;
- ATM activity or agreement;
- resale registration;
- warrant exercise;
- conversion;
- merger or acquisition;
- contract;
- partnership;
- FDA or clinical event;
- earnings;
- reverse split;
- deficiency or delisting notice;
- shareholder approval;
- bankruptcy or restructuring;
- no verified catalyst.

Rules:

- the system may not tell the entry-time story using a filing published after the entry;
- later filings may be shown as post-trade context only;
- headline text alone is insufficient for confident offering or dilution conclusions;
- dilution and listing classifications must carry sources and uncertainty;
- recycled news should be distinguishable where possible;
- web search results are not automatically authoritative;
- source text is untrusted input and must not issue instructions to the AI.

### 14.1 Reuse from the existing watchlist system

The existing live-watchlist code contains useful source, catalyst, dilution, listing-status, and AI-usage contract ideas.

Reuse may include:

- source-linked catalyst status;
- dilution timing lanes;
- listing-status categories;
- usage and cost accounting;
- structured validation patterns.

Do not import live directional fields into the journal such as:

- bullish/bearish bias;
- current targets;
- must-clear levels;
- needs-to-hold levels;
- breakout continuation instructions.

The journal is retrospective and educational. Live watchlist direction is a separate product boundary.

---

## 15. Add Explicit Data Capability Tiers

An answer should declare what evidence tier supports it.

Suggested tiers:

### Tier E0 — Execution only

Available:

- P/L;
- entries/adds/reductions/exits;
- size;
- timing;
- trade sequence;
- fees when imported;
- session grouping;
- repeated ticker attempts.

Unavailable:

- MFE/MAE;
- VWAP context;
- chart extension;
- verified spread;
- halt context;
- float rotation;
- catalyst timing;
- support/resistance.

### Tier E1 — Candle enriched

Adds:

- MFE/MAE;
- VWAP;
- session high/low;
- premarket high/low where coverage exists;
- chart extension;
- bar-based outcome simulations;
- candle-backed setup candidates.

Still unavailable:

- verified spread;
- quote size;
- precise slippage;
- executable fill certainty;
- official halt classification unless a halt source is attached.

### Tier E2 — Event enriched

Adds verified or qualified:

- halt events;
- catalyst events;
- filing events;
- corporate actions;
- listing events.

### Tier E3 — Quote enriched

Adds:

- historical bid/ask;
- spread;
- midpoint;
- quote-relative execution cost;
- quote age;
- limited liquidity context.

### Tier E4 — Share-structure enriched

Adds dated and source-qualified:

- float;
- shares outstanding;
- market capitalization;
- float rotation;
- share-structure change context.

### Tier E5 — Fully enriched review

Combines several tiers, but still must report missing fields and quality.

A higher tier is not automatically “better” if its data is stale or basis-unsafe.

Tool contracts should state the minimum required tier and the actual tier used.

---

## 16. Small/Micro-Cap Feature Additions

The feature registry should add or reserve the following families.

### 16.1 Volatility and liquidity proxies

- bar range percentage;
- realized volatility;
- average true range relative to price;
- candle expansion sequence;
- gap size;
- dollar volume;
- share volume;
- turnover;
- quote spread when available;
- effective spread when available;
- execution size versus bar volume;
- execution size versus quote size;
- post-entry liquidity deterioration when measurable.

### 16.2 Extended-hours context

- premarket run before entry;
- premarket volume before entry;
- premarket range;
- premarket high/low distance;
- regular-open transition;
- after-hours execution;
- session-boundary hold.

### 16.3 Halt context

- halt count before entry;
- entry after resume;
- held through halt;
- add after resume;
- exit after resume;
- minutes since resume;
- post-resume range expansion;
- halt-data quality.

### 16.4 Share-structure context

- dated float;
- shares outstanding;
- float rotation estimate;
- float-source age;
- float-source disagreement;
- recent split or reverse split;
- recent offering/share issuance event;
- basis warning.

### 16.5 Catalyst context

- catalyst category;
- source type;
- first-public timestamp;
- entry delay after catalyst;
- price move before entry after catalyst;
- filing-related risk context;
- catalyst confidence;
- no-verified-catalyst state.

### 16.6 Micro-cap execution context

- sub-dollar price precision;
- fill clustering;
- partial-fill intensity;
- fees per share;
- fees as percentage of gross P/L;
- average-fill versus individual-fill quality;
- order-metadata availability;
- quote-data availability.

---

## 17. Analytics Tools Need Small/Micro-Cap Decomposition

The first ten tools remain useful, but several require stronger domain decomposition.

### 17.1 Weekday analysis

For small/micro caps, decompose by:

- premarket versus regular session;
- halt versus no verified halt;
- gap size;
- volatility band;
- price band;
- liquidity data availability;
- catalyst category where available;
- repeated same-ticker attempts;
- trade number within session;
- commissions and fees;
- independent trading-day count.

The tool should not claim Friday itself caused losses. Preferred language:

> The strongest historical contributors associated with your Friday results were…

### 17.2 Price-range analysis

Use stable, interpretable ranges and avoid repeatedly optimizing bucket boundaries to maximize apparent performance.

Include:

- trade count;
- independent days;
- median P/L;
- expectancy;
- fees as a percentage of gross result;
- volatility;
- spread or liquidity availability;
- outlier dependency;
- sub-dollar versus above-dollar segmentation where relevant.

### 17.3 VWAP comparison

Only include trades with adequate intraday coverage and a known VWAP basis.

Separate:

- premarket VWAP if used;
- regular-session VWAP;
- first entry;
- re-entry;
- long versus short;
- gap and volatility band;
- extended versus non-extended.

### 17.4 Position-size analysis

Rename the user-facing concept from `best position size` to something closer to:

- `historical size-performance analysis`;
- `size ranges with stronger historical outcomes`;
- `size and drawdown comparison`.

The tool must not prescribe a universally “best” share size.

For small/micro caps, compare:

- shares;
- dollar size;
- size versus user baseline;
- size versus volatility;
- size versus dollar volume;
- size versus quote size when available;
- MAE dollars;
- fees;
- slippage capability tier;
- worst-case outcomes;
- concentration by ticker/day.

### 17.5 Setup ranking

Preferred answer language:

> These setup labels have produced weaker historical results in the selected sample.

Avoid:

> Stop trading this setup.

The user may create a rule experiment after reviewing evidence.

### 17.6 Entry extension analysis

For small/micro caps include:

- move from premarket low;
- move from session open;
- move since catalyst;
- recent candle expansion;
- distance from VWAP;
- distance from session high;
- float rotation when reliable;
- halt/resume state;
- gap percentage;
- volume stage;
- price band.

### 17.7 Profit giveback

Separate:

- unrealized MFE;
- realizable price-path estimate;
- realized retained P/L;
- partial exits;
- halt or liquidity limitations;
- fees;
- same-bar ambiguity;
- trade duration;
- setup and volatility regime.

---

## 18. Add High-Value Small/Micro-Cap Analytics Tools

Recommended later tools:

- `analyze_high_volatility_trade_performance`
- `analyze_premarket_entry_performance`
- `analyze_halt_resume_context`
- `analyze_liquidity_adjusted_position_size`
- `analyze_quote_relative_execution_cost`
- `analyze_partial_fill_behavior`
- `analyze_float_rotation_context`
- `analyze_catalyst_category_performance`
- `analyze_news_entry_delay`
- `analyze_reverse_split_and_basis_warnings`
- `analyze_gap_size_performance`
- `analyze_sub_dollar_performance`
- `analyze_fee_drag`
- `analyze_extended_hours_performance`
- `analyze_repeated_ticker_attempts_after_halt`
- `analyze_first_breakout_vs_later_breakouts`
- `analyze_volume_stage_at_entry`

These tools should be added only when their required data tier is available.

---

## 19. Statistical Review: “Why” Must Not Become Unsupported Causality

The product will receive questions phrased as causes:

- Why am I losing on Fridays?
- Why do I lose above VWAP?
- Why do I give back profit?

The system usually observes associations, not randomized causal effects.

Answer policy:

1. state the observed result;
2. identify the strongest associated contributors;
3. compare against a baseline;
4. disclose sample size and independent-day count;
5. show counterexamples;
6. avoid claiming a cause that the data cannot establish;
7. offer a rule experiment rather than a causal verdict.

Preferred language:

- `associated with`;
- `most of the difference came from`;
- `the strongest historical contributor was`;
- `this pattern is consistent with`;
- `worth testing prospectively`.

Avoid:

- `Friday causes you to lose`;
- `you lose because you are emotional`;
- `this proves the setup is bad`;
- `this rule will improve your trading`.

---

## 20. Small Samples and Non-Stationary Trading Need Stronger Handling

A single trader’s data is often sparse and changes over time.

The system must consider:

- independent day count;
- ticker clustering;
- repeated trades in one volatility event;
- one catalyst generating many correlated trades;
- strategy changes;
- broker changes;
- fee changes;
- account-size changes;
- market-regime changes;
- learning over time;
- missing or corrected imports;
- survivorship bias when delisted symbols lack market data.

Add:

- rolling-window comparisons;
- recent-versus-prior period views;
- minimum independent-session thresholds;
- clustered bootstrap where justified;
- direct-question versus discovery policies;
- holdout periods for optimized rules;
- stability checks across time;
- result sensitivity to one ticker or one day.

The product should prefer useful descriptive evidence over fake statistical certainty.

---

## 21. Counterfactual Simulations Need Micro-Cap-Specific Failure Modes

In addition to the first QA review’s intervention requirements, simulations must handle:

- gap through target or stop;
- halt before target or stop;
- resume beyond target or stop;
- no prints during a halt;
- partial fills;
- insufficient bar volume;
- missing premarket bars;
- irregular trade prints;
- reverse-split basis mismatch;
- same-bar target and stop;
- target touched by a single anomalous print;
- after-hours liquidity;
- fee drag;
- short-side borrow cost when known;
- open position at simulation end.

Every simulation must return:

- assumption set ID;
- price-path result;
- executable-confidence state;
- excluded trades;
- ambiguous trades;
- optimistic result where applicable;
- conservative result where applicable;
- evidence trade IDs;
- policy version.

For private alpha, it is acceptable to begin with conservative bar-based models as long as the limitation is unmistakable.

---

## 22. Support and Resistance Review: Keep the First QA Ruling, Add Micro-Cap Constraints

The first QA ruling remains correct:

- `levels-system-v2` remains the factual producer;
- Trader Intelligence does not build a second detector;
- v3 consumes complete replay-safe final zones;
- v3 adds usability, congestion, stable selection, and suppression.

Additional small/micro-cap constraints:

- premarket and regular-session zones may need separate context;
- large gaps can invalidate the usefulness of prior nearby zones;
- halt resumes can jump across zones without trading through them;
- sparse prints can create unstable intraday structures;
- reverse splits can make old zones basis-unsafe;
- synthetic extension zones cannot dominate coaching;
- a zone must have clear space and stability relative to current volatility;
- one anomalous wick should not create a strong user-facing zone;
- zone quality must be evaluated separately for sub-dollar and higher-priced names;
- small price changes must not repeatedly flip the primary zone;
- level conclusions remain supporting context, never a verdict.

The usefulness benchmark should compare:

1. legacy nearest-level output;
2. v3 zone usability output;
3. no-level output.

Human review should be blinded to the method where practical.

Metrics:

- noisy conclusion rate;
- suppression correctness;
- primary-zone stability;
- evidence traceability;
- agreement with human usefulness rating;
- false precision rate;
- unsupported good/bad-trade language rate.

---

## 23. Educational Product Boundary Must Be Enforced by Architecture, Not Only Disclaimers

The product’s purpose is to help the trader learn from completed executions.

Allowed product behavior:

- explain historical results;
- compare historical segments;
- identify observable tendencies;
- reconstruct completed trades;
- simulate historical rules;
- track user-created rules prospectively;
- link educational lessons;
- show uncertainty;
- invite the user to review evidence.

Not part of the v3 journal:

- live entry alerts;
- live exit alerts;
- current price targets;
- current buy/sell/hold instructions;
- automatic brokerage orders;
- guaranteed performance improvements;
- individualized portfolio allocation;
- tax advice;
- claims that a historical simulation will repeat.

### 23.1 Language policy

Prefer:

- `historically`;
- `in this sample`;
- `associated with`;
- `rule to test`;
- `review these trades`;
- `evidence is limited`;
- `execution data alone cannot determine`.

Avoid:

- `you should buy`;
- `you should sell now`;
- `this stock will`;
- `best position size` without historical qualification;
- `guaranteed`;
- `safe trade`;
- `perfect setup`;
- `always` when the evidence is not universal.

### 23.2 User-created rules

The app may help the owner formulate a rule such as:

> Test stopping after two consecutive losses for the next twenty sessions.

The user owns the rule. The app reports historical and prospective evidence. It does not execute the rule in the market.

---

## 24. The Existing Academy Is a Product Asset, Not an Analytics Authority

The repository already contains education on:

- high-volatility trade review;
- low-float volatility;
- halts and resumes;
- spread and slippage;
- float rotation;
- catalysts;
- SEC filings;
- dilution;
- volume and liquidity;
- small-cap trading concepts.

V3 may link a finding to a relevant Academy lesson.

Examples:

- a quote-data limitation may link to spread and slippage education;
- a halt-resume review may link to halt education;
- a float-rotation finding may link to the float-rotation lesson;
- a catalyst review may link to the news-trade review lesson.

Rules:

- Academy prose does not become statistical evidence;
- Academy content does not authorize a coaching claim;
- lesson links are optional educational context after the finding;
- lesson titles and slugs should be referenced through the Academy registry rather than copied into hard-coded route logic;
- current protected Academy progress must not be affected by v3 work.

---

## 25. AI Architecture Corrections for the Private Alpha

### 25.1 AI may be tested earlier than public infrastructure

Once deterministic tools, claim validation, evidence resolution, cost logging, and a private-alpha gate exist, an owner-only AI explanation route may be tested before full public multi-tenancy.

This does not waive future public requirements.

### 25.2 Prompt payload rules

Default AI payloads should include:

- question;
- selected filters;
- tool plan;
- compact tool results;
- validated claim ledger;
- evidence labels or opaque evidence IDs;
- limitations;
- response schema.

They should not include by default:

- full raw CSV;
- full account number;
- unrestricted user notes;
- large candle arrays;
- arbitrary database rows;
- private source documents unrelated to the question.

### 25.3 Untrusted text

Treat as untrusted:

- CSV notes and descriptions;
- user notes;
- symbol/company names;
- news headlines;
- press-release text;
- SEC filing text;
- imported filenames;
- broker descriptions.

The model must not follow instructions embedded inside these fields.

### 25.4 Numeric grounding

Every numeric sentence must resolve to:

- tool run ID;
- claim ID;
- metric name;
- exact value;
- unit and currency;
- comparison value where applicable;
- dataset version.

The answer validator should reject unsupported numbers.

### 25.5 Owner correction

The owner may correct:

- setup label;
- intended setup;
- stop tag;
- rule adherence;
- catalyst label;
- import mapping;
- grouping decision.

Corrections are auditable, versioned inputs. They do not silently retrain a global model or overwrite source executions.

---

## 26. Private Real Data Must Stay Outside the Repository

The owner’s real broker files are valuable calibration data and sensitive personal financial data.

Rules:

- do not commit real broker CSVs;
- do not upload real broker files into public issue or PR comments;
- do not include raw rows in snapshots;
- use a private local artifact directory excluded by `.gitignore`;
- store only sanitized manifests or hashes in repository documentation;
- keep screenshots free of account identifiers;
- use synthetic public fixtures for CI;
- use private local golden datasets for calibration;
- document the period, broker, expected counts, and result hashes without publishing the raw data;
- support deletion of private alpha calibration data.

Private fixture categories should include at least:

- normal intraday round trips;
- partial fills;
- repeated same-ticker attempts;
- premarket trades;
- open positions;
- overnight holds;
- sell-starting or prior-inventory cases;
- short trades if present;
- reverse-split or basis-warning cases;
- high-volatility cases;
- fee-bearing trades;
- rejected or skipped rows.

---

## 27. Small/Micro-Cap Test Matrix

The public synthetic fixture matrix should cover:

### 27.1 Instrument and basis

- sub-dollar price with four-decimal precision;
- reverse split between historical market data and execution date;
- ticker change;
- same ticker reused by another synthetic instrument;
- delisted symbol with partial market-data coverage;
- unresolved instrument identity;
- adjusted/unadjusted mismatch.

### 27.2 Sessions

- 4:00 a.m. premarket entry;
- daylight-saving transition;
- half day;
- after-hours exit;
- premarket-to-regular hold;
- overnight position.

### 27.3 Halts

- entry before verified halt;
- entry after resume;
- hold through halt;
- target inside halt interval;
- resume gap above target;
- resume gap below stop;
- missing halt source.

### 27.4 Liquidity and quotes

- wide spread;
- stale quote;
- missing quote;
- execution outside quoted spread;
- large order versus quote size;
- candle-only record that must not produce a spread claim.

### 27.5 Float and catalyst

- fresh float source;
- stale float source;
- disagreeing float sources;
- offering after entry;
- filing before entry;
- filing after exit;
- recycled press release;
- no verified catalyst;
- reverse split and offering combination.

### 27.6 Execution

- average-fill row;
- individual fills;
- partial fills;
- market order metadata present;
- order intent absent;
- fees larger than gross edge;
- sell short and buy to cover;
- reversal;
- prior inventory.

### 27.7 Analytics and statistics

- one outlier drives a weekday;
- many trades on only one day;
- one ticker drives a segment;
- small sample;
- recent performance differs from old performance;
- direct question versus automatic discovery;
- cross-currency data blocked from aggregation.

---

## 28. Private-Alpha UX Requirements

The owner does not need public onboarding complexity during early alpha, but the product must still expose truth clearly.

Required:

- current deployment profile visible in an internal diagnostics area;
- data capability tier per answer;
- source import and dataset version;
- market-data status;
- basis warnings;
- evidence links;
- assumptions for simulations;
- clear difference between execution facts and market-context facts;
- ability to mark an AI answer useful, incorrect, unclear, or unsupported;
- ability to correct setup and review labels;
- easy rerun after correction;
- no repetitive disclaimer wall on every card;
- concise educational boundary in the product shell and expanded explanation in account/help areas.

The coach should not shame the trader or claim emotions as fact.

Prefer:

- `Review this pattern`;
- `This was associated with weaker results`;
- `Evidence is limited`;
- `Test this rule`;
- `These trades are the strongest examples`.

Avoid:

- `You failed`;
- `You were greedy`;
- `You panicked`;
- `You must stop`;
- `This was a terrible trade`.

---

## 29. Cost Controls for Owner-Only Alpha

A multi-plan billing system is unnecessary for private owner testing.

Required alpha controls:

- hard daily dollar cap;
- hard monthly dollar cap;
- per-question token cap;
- output token cap;
- model allowlist;
- no automatic unlimited retry;
- answer cache;
- duplicate-question detection;
- usage ledger;
- manual disable switch;
- report batch caps;
- visibility into cost per tool answer and report.

Public billing and plan entitlements can remain in Track B.

---

## 30. Revised Gate Matrix

### G0 — Plan and Common Truth

Status target:

- planning authority aligned;
- deployment profiles documented;
- exact decimals selected;
- P/L policy selected;
- dataset/evidence contracts defined;
- private data policy defined;
- small/micro-cap scope defined.

### GA1 — Private Execution Analytics

Required:

- read-only adapter;
- weekday tool;
- daily-stop simulation;
- execution-only expanded tools;
- private alpha storage backup;
- synthetic and private golden verification.

### GA2 — Private AI Grounding

Required:

- approved tool registry;
- claim ledger;
- numeric validator;
- evidence validator;
- owner-only feature gate;
- cost caps;
- no raw CSV prompt;
- educational answer policy;
- answer feedback.

### GA3 — Small/Micro-Cap Market Context

Required:

- instrument identity;
- basis safety;
- session contract;
- candle quality;
- halt data gate;
- quote-data gate;
- float/catalyst provenance;
- setup taxonomy calibration;
- support/resistance usability gate.

### GP1 — Public Identity and Tenancy

Required only before invited/public users:

- shared auth;
- server-derived tenancy;
- PostgreSQL;
- RLS;
- object storage;
- deletion;
- durable jobs;
- tenant tests.

### GP2 — Public Beta

Required:

- entitlements;
- rate limits;
- support processes;
- public privacy terms;
- provider licensing;
- monitoring;
- recovery;
- cost load testing.

### GP3 — Public Production

Required:

- formal launch review;
- security review;
- SLOs;
- failure drills;
- rollback;
- stable billing;
- validated migrations.

---

## 31. Changes Required to the Active Gate 0 Plan

The existing Gate 0 plan remains useful, but future implementation must apply these amendments:

1. Add the deployment-profile contract.
2. Record `private_owner_alpha` as the current profile.
3. Do not require public multi-user infrastructure before the first private deterministic and AI usefulness slices.
4. Keep exact financial and evidence work early.
5. Add private-alpha backup and private-fixture policy.
6. Add small/micro-cap instrument, basis, session, and data-tier contracts to ADR scope.
7. Add optional order metadata and quote-data boundaries.
8. Add causal-language policy.
9. Add micro-cap simulation limitations.
10. Add the small/micro-cap synthetic fixture matrix.
11. Allow owner-only AI after GA1 and claim validation rather than waiting for every public-production subsystem.
12. Keep all public-route, public-upload, multi-user, and production claims forbidden until GP1 and GP2 pass.

The first implementation branch may remain:

`agent/trader-intelligence-v3-gate-0-foundation`

The first code run still must not redesign `/coach` or consume support/resistance.

---

## 32. Second-Pass Risks

| Risk | Severity | Required mitigation |
|---|---:|---|
| Public hardening delays proof of product value | High | Separate private-alpha and public-readiness tracks |
| Private-alpha shortcuts leak into public production | High | Deployment-profile contract and fail-closed startup checks |
| Candle data is mislabeled as spread or slippage | High | Data capability tiers and quote-specific contracts |
| Bar target touch is presented as executable fill | High | Simulation executable-confidence and liquidity assumptions |
| Ticker-only joins corrupt old micro-cap history | High | Stable instrument identity and symbol history |
| Reverse split creates false MFE/MAE or level claims | Critical | Price-basis contract and fail-closed basis warnings |
| Missing halt data creates invented halt conclusions | High | Verified halt-event contract and unavailable state |
| Current float is applied to old trades | High | Dated float provenance and suppression |
| Catalyst published later leaks into entry-time reasoning | High | First-public timestamp and no-lookahead event policy |
| Live watchlist directional logic leaks into journal | High | Reuse source/cost contracts only; forbid live bias/targets |
| “Why” answers imply causality | Medium/High | Association language and counterexamples |
| “Best size” becomes prescriptive advice | Medium/High | Historical size-performance framing |
| Short facts are incorrectly coached | High | Separate short-ledger support from short-coaching calibration |
| Private broker files enter Git history | Critical | Private fixture policy and repository guards |
| AI follows instructions inside notes/news | High | Untrusted-text isolation and prompt-injection tests |
| One event creates many correlated trades | High | Independent-day/ticker/event counts |
| Owner trusts an alpha result with missing data | High | Capability tier and limitations on every answer |

---

## 33. Final Second-Pass Directive

Trader Intelligence v3 should be built first as a **private evidence laboratory for one trader**, using architecture that can later support a public product.

That means:

```text
owner’s private broker data
  -> exact execution truth
  -> explicit reconstruction policy
  -> versioned private dataset
  -> deterministic execution analytics
  -> validated claims and evidence
  -> owner-only AI explanation
  -> small/micro-cap market enrichment by evidence tier
  -> usefulness calibration
  -> future public platform hardening
```

The system’s small/micro-cap specialization should be real, not marketing copy. It must understand the limitations created by:

- premarket trading;
- high volatility;
- halts;
- gaps;
- thin liquidity;
- wide spreads;
- partial fills;
- sub-dollar prices;
- reverse splits;
- ticker changes;
- stale float data;
- offerings and dilution;
- catalyst timing;
- repeated same-ticker attempts.

The educational boundary should also be real, not only a disclaimer. The application should analyze completed trading behavior, show evidence, explain uncertainty, and help the trader design rules to test. It should not turn historical analytics into live trade instructions.

The engineering standard is:

> Be exact about executions, explicit about assumptions, conservative about market context, and fast enough in private alpha to learn whether the product is truly useful.

The QA standard is:

> Do not build public infrastructure merely to look production-ready, and do not use private-alpha status as an excuse for incorrect financial or analytical truth.
