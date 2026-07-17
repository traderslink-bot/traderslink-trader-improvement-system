# Trader Intelligence v3 Third-Pass QA: Source Governance, Reproducibility, Evaluation, and Scope Control

**Date:** 2026-07-17 America/Toronto  
**Status:** Mandatory third-pass amendments; approved for staged private-alpha implementation after consolidation  
**Repository:** `traderslink-bot/traderslink-trader-improvement-system`  
**Operating profile:** `private_owner_alpha`  
**Primary domain:** small-cap and micro-cap active trading  
**Product boundary:** retrospective educational trade review, not live investment advice or automated execution

## Reviewed documents

- `src/docs/trader-intelligence-ai-journal-v3-master-plan-2026-07-17.md`
- `src/docs/trader-intelligence-v3-qa-architecture-review-2026-07-17.md`
- `src/docs/trader-intelligence-v3-second-pass-qa-private-alpha-small-micro-cap-review-2026-07-17.md`
- `src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`
- `src/docs/trader-intelligence-plan-index.md`
- `src/docs/trader-intelligence-v3-project-log.md`
- `plan.md`
- `handoff.md`

## Repository areas sampled during this pass

- broker execution source contracts and CSV adapters;
- candle-provider contracts;
- current EODHD/Yahoo/IBKR candle boundaries;
- live-watchlist catalyst, dilution, listing, source, quote, and AI-cost contracts;
- current level-analysis snapshot and final-zone contracts;
- import persistence and post-import job boundaries;
- current testing and CI configuration;
- Academy lessons relevant to low-float volatility, halts, liquidity, slippage, catalysts, and float rotation.

## External source review performed

This pass also reviewed current official documentation for possible no-cost or free-to-access sources, including:

- SEC EDGAR submissions, Company Facts, archives, ticker/CIK files, and RSS;
- Nasdaq Trader symbol-directory and trade-halt resources;
- NYSE current and historical trading halts;
- the Limit Up/Limit Down Plan;
- FINRA short-sale-volume, short-interest, OTC-threshold, and transparency resources;
- OpenFIGI identifier mapping;
- Nasdaq Data Link;
- open-source exact-decimal, property-testing, and exchange-calendar tools.

External sources are recommendations, not automatic dependencies. Every source still needs an adapter, provenance, terms review, data-quality tests, and a fail-closed policy.

---

# 1. Executive Verdict

The v3 product and engineering direction remains correct.

The first two QA passes successfully corrected:

- production-readiness overclaims;
- owner-only versus public sequencing;
- exact financial math;
- analytical P/L policy;
- instrument and price-basis safety;
- small/micro-cap market structure;
- simulation honesty;
- AI grounding;
- support/resistance congestion;
- the educational product boundary.

The third pass found no reason to restart the architecture.

It did find six material weaknesses that must be corrected before implementation spreads:

1. **Planning-authority sprawl**
   - The master plan and multiple QA documents each claim controlling authority.
   - A future engineering run could still apply the wrong precedence or miss a later amendment.
   - The system now needs one consolidated controlling architecture specification.

2. **Version labels are not enough for reproducibility**
   - Feature, tool, model, and policy versions are necessary but do not prove which source bytes, import rows, market snapshots, corrections, and filters produced an answer.
   - V3 needs content-addressed dataset and derivation manifests.

3. **Data quality is described, but analysis eligibility is not yet a first-class contract**
   - A trade may be valid for execution-only analytics but unsafe for candle, event, quote, float, or support/resistance analysis.
   - Eligibility must be calculated per capability and per claim.

4. **External-source governance is incomplete**
   - Free access does not mean complete, historically accurate, commercially redistributable, or appropriate as an authority.
   - V3 needs a source registry containing terms, scope, update timing, historical coverage, rate limits, correction behavior, and permitted deployment profiles.

5. **The first coding run remains too broad as one batch**
   - The current Gate 0 plan includes inventory, many ADRs, contracts, exact math, adapters, fixtures, two tools, and CI.
   - The work is coherent, but it should be executed as three mergeable private-alpha slices rather than one oversized foundational PR.

6. **The evaluation plan is not yet strong enough to decide whether the AI product is actually better**
   - Mathematical correctness is necessary but not sufficient.
   - V3 needs a repeatable evaluation harness covering claim accuracy, evidence resolution, abstention, usefulness, consistency, owner feedback, and regression replay.

The corrected ruling is:

> Consolidate the architecture authority, make source lineage and eligibility first-class, build the deterministic slices in smaller steps, and evaluate usefulness with the same rigor used for financial correctness.

---

# 2. QA Severity Summary

## P0 — resolve before the first v3 implementation branch is considered complete

1. Create one consolidated controlling architecture specification.
2. Define content-addressed dataset, derivation, and answer manifests.
3. Define source-of-truth precedence and conflict handling.
4. Define per-capability analysis eligibility and exclusion reasons.
5. Distinguish local-only owner alpha from privately hosted owner alpha.
6. Split Gate 0 into smaller reviewable implementation slices.
7. Add repository guards for private financial data.
8. Define dataset coverage and missing-period policy.

## P1 — resolve before owner-only AI is enabled

1. Create a claim-level evaluation harness.
2. Add numeric, unit, currency, evidence, capability, and limitation validators.
3. Add answer replay from saved tool results.
4. Add owner feedback categories that produce regression cases.
5. Define direct-question, comparison, exploration, and discovery modes.
6. Add confounder, clustering, and strategy-era handling.
7. Separate user intent, user tags, inferred setup, and chart-validated setup.
8. Define answer-cache invalidation from source corrections.
9. Add an external-source registry and runtime policy.
10. Prevent runtime web search from acting as an authoritative historical database.

## P2 — resolve before market-context enrichment is trusted broadly

1. Qualify each external source by historical scope and update behavior.
2. Snapshot current-only sources if future historical replay depends on them.
3. Add multi-provider disagreement states rather than silently selecting one answer.
4. Add corporate-action correction and recomputation workflows.
5. Add source-specific data-quality dashboards.
6. Define quote-data and historical-NBBO availability honestly.
7. Define float/source disagreement and stale-data thresholds.
8. Define event deduplication and first-public-time rules.
9. Define market-calendar validation and exceptional-session corrections.

---

# 3. Mandatory Amendment: Stop the Planning-Authority Cascade

The current planning chain is understandable to the people who wrote it, but it is too complex for long-term execution.

Current authority is distributed across:

- the master plan;
- first QA review;
- second QA review;
- Gate 0 plan;
- root plan;
- handoff;
- plan index;
- project log.

Adding another controlling document without consolidation would make the governance problem worse.

## 3.1 Required solution

Create:

`src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`

That document becomes the compact controlling specification.

The detailed reviews remain audit evidence and architectural rationale.

## 3.2 New precedence

1. latest explicit decision in `src/docs/trader-intelligence-v3-project-log.md`;
2. `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`;
3. active phase or execution plan;
4. detailed QA reviews and master plan as rationale;
5. legacy v1/v2 documents as implementation history.

A project-log entry may clarify or advance a gate, but it may not silently weaken a requirement in the controlling specification. A material change requires editing the specification.

## 3.3 Documentation rules

- New QA reviews should not claim direct control after consolidation.
- Findings from a review are promoted into the controlling specification when accepted.
- The root plan, handoff, and index point to the same specification.
- The active execution plan states which specification version it implements.
- Old reviews are not deleted.
- Completed plans move to historical status rather than remaining ambiguously active.

---

# 4. Mandatory Amendment: Use a Modular Monolith, Not a Premature Data Platform

The master plan lists a comprehensive production schema and many modules. That is useful as a destination, but it could encourage premature construction of a feature warehouse, large table graph, or service boundaries before the first useful tools exist.

## 4.1 Private-alpha architecture ruling

Use a modular monolith in the existing Next.js/TypeScript repository.

The private-alpha implementation should prefer:

- pure domain functions;
- explicit contracts;
- repository interfaces;
- a small number of durable tables or versioned artifacts;
- read-only adapters from current data;
- deterministic tool results;
- internal diagnostics;
- no new network service unless a provider boundary requires one.

## 4.2 Do not build immediately

Do not create the complete long-term table inventory merely because it appears in the master plan.

Do not build immediately:

- a general-purpose online feature store;
- a vector database;
- an event-streaming platform;
- many microservices;
- an unrestricted analytics query engine;
- a generic rules language;
- a second candle warehouse;
- a second support/resistance engine.

## 4.3 Minimum persisted derived objects

The first useful persistent v3 objects can be limited to:

- dataset manifest;
- accepted execution reference;
- analytical round-trip reference;
- data-quality and eligibility result;
- tool run;
- simulation run;
- evidence reference;
- claim ledger;
- answer manifest;
- owner feedback;
- source registry entry.

Expansion should follow measured query and product needs.

---

# 5. Mandatory Amendment: Source-of-Truth Hierarchy

V3 needs an explicit conflict hierarchy.

## 5.1 Authoritative facts by category

### Broker execution facts

Primary authority:

- accepted broker execution record;
- accepted broker correction or bust record;
- accepted user repair with audit history.

Examples:

- execution timestamp;
- side;
- quantity;
- fill price;
- broker execution ID;
- commission and fees when reported;
- account and currency.

Market data must never overwrite an execution price.

### Broker/account summary facts

Broker statement summaries may be used for reconciliation, but they do not silently replace execution-level analytical calculations.

Store separately:

- broker-reported realized P/L;
- broker-reported net amount;
- broker-reported ending position;
- broker-reported fees;
- v3 analytical values;
- reconciliation difference.

### User-provided facts

User-provided data may be authoritative for personal intent, not market facts.

Examples:

- intended setup;
- planned stop;
- planned target;
- rule being tested;
- personal notes;
- whether a setup label is accepted.

The timestamp of the user input matters. A note written after the trade cannot be represented as a pre-trade plan.

### Market path facts

Primary authority:

- the selected market-data snapshot from a declared provider and basis.

Do not silently merge bars from different providers in one path.

### Regulatory and filing events

Primary authority:

- official regulator or exchange source when available;
- first-party issuer source as supporting evidence;
- qualified third-party source only when official data is unavailable and limitations are explicit.

### Derived features and findings

Derived features are never source facts. They must link to exact source snapshots and calculation versions.

### AI output

AI output is never authoritative. It explains validated claims.

## 5.2 Conflict states

When sources disagree, use explicit states:

- `resolved_by_precedence`;
- `within_tolerance`;
- `conflicting_sources`;
- `stale_source`;
- `unresolved_identity`;
- `basis_mismatch`;
- `manual_review_required`.

Do not silently choose whichever source produces the cleanest narrative.

---

# 6. Mandatory Amendment: Content-Addressed Dataset and Derivation Manifests

Version strings alone cannot reproduce an answer.

## 6.1 Dataset manifest

Every tool run must reference a manifest similar to:

```ts
interface TraderDatasetManifest {
  manifestId: string;
  contentHash: string;
  ownerProfileId: string;
  accountIds: string[];
  importBatchIds: string[];
  sourceFileHashes: string[];
  acceptedExecutionIds: string[];
  correctionEventIds: string[];
  reconstructionPolicyVersion: string;
  sessionPolicyVersion: string;
  instrumentResolutionVersion: string;
  currencyPolicyVersion: string;
  coverageStart: string | null;
  coverageEnd: string | null;
  coverageState: "complete_period" | "partial_period" | "unknown";
  createdAt: string;
}
```

The manifest hash must change when any authoritative input or policy changes.

## 6.2 Market-enrichment manifest

Market-derived tools additionally reference:

- provider;
- provider request ID;
- symbol and resolved instrument ID;
- source interval and timezone;
- raw/adjusted basis;
- corporate-action version;
- candle coverage hash;
- quote coverage hash when relevant;
- event-source snapshot IDs;
- halt-source snapshot IDs;
- float/source snapshot IDs;
- level-analysis snapshot IDs;
- retrieval and effective timestamps.

## 6.3 Derivation manifest

Every feature or tool result records:

- input manifest ID;
- exact function/tool version;
- parameter hash;
- filters;
- excluded IDs and reasons;
- calculation environment version;
- deterministic result hash;
- generated timestamp.

## 6.4 Answer manifest

Every AI answer records:

- conversation question;
- selected filters;
- tool plan;
- tool-run IDs;
- claim IDs;
- evidence IDs;
- capability tier;
- prompt version;
- model ID;
- response-schema version;
- validator result;
- token/cost usage;
- final answer hash.

## 6.5 Revisions and invalidation

When a source or policy changes:

- old manifests remain reproducible;
- affected current answers become stale;
- a dependency graph identifies affected features, tools, findings, reports, and answers;
- recomputation is explicit and resumable;
- the UI can show `Recalculated because market-data basis was corrected` or an equivalent reason.

---

# 7. Mandatory Amendment: Dataset Coverage and Selection Bias

The system cannot assume the imported records represent all of the owner’s trading.

## 7.1 Coverage contract

Track:

- broker account;
- file statement period;
- earliest accepted execution;
- latest accepted execution;
- known missing days;
- overlapping imports;
- import gaps;
- excluded rows;
- quarantined instruments;
- open positions;
- prior-inventory cases;
- other known accounts not included;
- currencies represented.

## 7.2 Required coverage states

- `complete_account_period`;
- `partial_account_period`;
- `overlapping_periods_reconciled`;
- `coverage_gap_detected`;
- `unknown_coverage`;
- `multiple_accounts_partial`.

## 7.3 Product effect

Every broad conclusion must say what dataset it represents.

Examples:

- `Based on the imported IBKR activity from April 1–30…`
- `This does not include trades from other accounts.`
- `Two trading days in this period have missing execution coverage.`

Do not describe a partial file as the trader’s complete history.

## 7.4 Censoring

Tools must disclose when results exclude:

- open positions;
- trades without complete fees;
- trades without a resolved opening inventory;
- trades without market data;
- uncertain setup labels;
- unresolved instruments;
- currencies that cannot be combined.

The excluded sample may be systematically different from the included sample. That limitation must be visible.

---

# 8. Mandatory Amendment: Analysis Eligibility Is First-Class

A single `marketDataQuality` field is not enough.

## 8.1 Eligibility contract

Each trade, session, event, and tool input should have capability-specific eligibility:

```ts
interface AnalysisEligibility {
  executionAnalytics: EligibilityState;
  pnlAnalytics: EligibilityState;
  sequenceAnalytics: EligibilityState;
  candleAnalytics: EligibilityState;
  vwapAnalytics: EligibilityState;
  mfeMaeAnalytics: EligibilityState;
  haltAnalytics: EligibilityState;
  quoteAnalytics: EligibilityState;
  slippageAnalytics: EligibilityState;
  floatAnalytics: EligibilityState;
  catalystAnalytics: EligibilityState;
  levelAnalytics: EligibilityState;
  simulationAnalytics: EligibilityState;
}

type EligibilityState = {
  status: "eligible" | "eligible_with_limitations" | "ineligible";
  reasonCodes: string[];
  sourceSnapshotIds: string[];
};
```

## 8.2 Example gating

A trade may be:

- eligible for execution timing and size analytics;
- eligible for gross P/L but not net P/L because fees are missing;
- ineligible for MFE because candles are basis-unsafe;
- ineligible for spread because no quotes exist;
- ineligible for halt analysis because no qualified halt source exists;
- eligible for catalyst analysis only for events published before the execution;
- ineligible for float rotation because dated float is unavailable;
- ineligible for support/resistance because structure is congested.

## 8.3 Tool-level denominator accounting

Every tool returns:

- candidate count;
- eligible count;
- included count;
- excluded count;
- exclusion reasons;
- capability tier;
- coverage state.

The AI cannot hide exclusions.

---

# 9. Mandatory Amendment: Four Clocks for External Events

Small/micro-cap review is highly sensitive to when information became available.

Every external event should distinguish:

1. **event/effective time** — when the underlying corporate or market event occurred;
2. **first-public time** — when the information first became publicly available;
3. **source-retrieval time** — when the application downloaded it;
4. **processing time** — when the application parsed and classified it.

Additional timestamps may include:

- filing acceptance time;
- document filing date;
- press-release publication time;
- exchange halt time;
- exchange resume time;
- market-effective corporate-action date;
- source correction time.

Entry-time reasoning uses only information with a qualified first-public time at or before the decision timestamp.

Later amendments or clarifications may appear in outcome review, but they must be labeled as later information.

---

# 10. Mandatory Amendment: Instrument Resolution Is a Confidence-Bearing Process

No single free identifier source is sufficient for historical micro-cap identity.

## 10.1 CIK is issuer identity, not complete instrument identity

One issuer may have:

- multiple share classes;
- common stock and preferred stock;
- warrants, units, or rights;
- securities on different exchanges;
- historical ticker changes.

CIK may support issuer resolution, but it must not be treated as the sole security ID.

## 10.2 FIGI is a mapping aid, not unquestioned authority

OpenFIGI can map identifiers and return security metadata. A ticker-only mapping may still be ambiguous, current rather than historical, or return multiple candidates.

Store:

- mapping request;
- mapping timestamp;
- candidates;
- selected candidate;
- selection reason;
- confidence;
- source version;
- manual correction.

## 10.3 Internal identity

V3 should create an internal instrument ID and validity-period symbol records.

Suggested objects:

- `issuer_identity`;
- `instrument_identity`;
- `symbol_assignment` with valid-from/valid-to;
- `corporate_action_event`;
- `instrument_resolution_attempt`;
- `instrument_resolution_correction`.

## 10.4 Resolution states

- `resolved_high_confidence`;
- `resolved_with_manual_confirmation`;
- `ambiguous`;
- `historical_mapping_missing`;
- `corporate_action_review_required`;
- `unsupported_security_type`;
- `unresolved`.

Market enrichment fails closed for unresolved identity. Execution-only analytics may continue using the raw broker symbol.

---

# 11. Mandatory Amendment: External Source Registry

Create a versioned source registry before adding source-specific features.

## 11.1 Required source fields

```ts
interface ExternalSourceDefinition {
  sourceKey: string;
  sourceVersion: string;
  owner: string;
  category: "regulator" | "exchange" | "identifier" | "market_data" | "issuer" | "open_source_tool" | "other";
  authorityLevel: "primary" | "qualified_primary" | "supporting" | "experimental";
  accessMethod: string;
  termsUrl: string;
  documentationUrl: string;
  costState: "free" | "free_with_account" | "paid" | "mixed";
  permittedProfiles: string[];
  commercialRedistributionState: "allowed" | "restricted" | "unknown" | "not_applicable";
  historicalCoverage: string;
  updateSchedule: string;
  rateLimit: string;
  correctionPolicy: string;
  cachePolicy: string;
  requiredHeaders: Record<string, string>;
  dataCapabilities: string[];
  knownLimitations: string[];
  lastTermsReviewAt: string;
  enabled: boolean;
}
```

## 11.2 Source adapter output

Every adapter returns:

- source key;
- source record ID;
- retrieval time;
- requested time range;
- source-effective time;
- raw content hash;
- parser version;
- normalized payload;
- quality state;
- limitations;
- terms/profile decision;
- revision/replacement relationship.

## 11.3 Free does not mean unrestricted

Before future public use, review:

- commercial use;
- internal use;
- redistribution;
- display rights;
- storage duration;
- derived-data rights;
- attribution;
- request limits;
- bulk-download restrictions.

Private-alpha use does not automatically grant future SaaS rights.

---

# 12. Recommended Official and Free-to-Access Sources

The following are useful opportunities, subject to adapter-level verification and the source registry.

## 12.1 SEC EDGAR APIs and archives

Official resources:

- `https://data.sec.gov/`
- `https://www.sec.gov/search-filings/edgar-application-programming-interfaces`
- `https://www.sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data`
- `https://www.sec.gov/about/rss-feeds`

Potential uses:

- company submissions history;
- accession numbers and filing metadata;
- filing form classification;
- accepted filing documents;
- XBRL Company Facts;
- filing RSS;
- CIK associations;
- shares-outstanding and public-float facts when present;
- issuer event provenance;
- trading-suspension RSS and releases.

Strengths:

- official regulator source;
- no API key for public data APIs;
- bulk archives available;
- near-real-time submissions metadata;
- durable accession identifiers.

Limitations and rules:

- server-side access is required because `data.sec.gov` does not provide browser CORS;
- respect SEC fair-access policy and declared user-agent requirements;
- ticker/CIK association files are periodically updated and not guaranteed complete or accurate;
- CIK identifies a filer/issuer, not necessarily one exact instrument;
- XBRL shares-outstanding facts can contain filer scaling or tagging errors;
- filings may be amended or corrected;
- filing date, acceptance time, and first public availability are related but distinct concepts;
- Company Facts is structured disclosure, not a complete event classifier.

Recommended initial use:

- primary source for filings and filing metadata;
- supporting source for dated share structure;
- issuer-resolution component;
- event source for offering, dilution, corporate-action, and listing-review candidates;
- never the sole instrument-identity authority.

## 12.2 Nasdaq Trader symbol-directory resources

Official resources:

- `https://www.nasdaqtrader.com/trader.aspx?id=symboldirdefs`
- `https://www.nasdaqtrader.com/trader.aspx?id=symbollookup`

Potential uses:

- current Nasdaq and other-exchange symbol directory;
- security name;
- market category;
- ETF flag;
- test-issue flag;
- round-lot size;
- current exchange/listing context.

Strengths:

- official exchange operational source;
- downloadable directory files;
- file creation timestamp.

Limitations and rules:

- the lookup is current-day information, not a complete historical security master;
- if historical replay depends on it, snapshot the files over time;
- internal/non-commercial usage terms apply to portions of the symbol data;
- do not assume permission to redistribute the directory in a future public product;
- current symbol data cannot resolve historical ticker reuse by itself.

Recommended use:

- private-alpha reference enrichment;
- daily symbol snapshots;
- test-issue and security-type filtering;
- one input into instrument resolution.

## 12.3 Nasdaq Trader trade-halt RSS

Official resource:

- `https://www.nasdaqtrader.com/rss.aspx?feed=tradehalts`

The documented query supports current halts and date-based halt/resume queries.

Potential uses:

- qualified halt event;
- halt start and resume review;
- reason/code when supplied;
- cross-checking candle gaps;
- halt-aware simulations.

Rules:

- preserve raw RSS and query parameters;
- record the source’s market/scope rather than assuming universal exchange completeness;
- do not infer a halt from a missing RSS row or missing candles;
- archive retrieved results because source retention and query behavior may change;
- reconcile with listing exchange data when necessary.

## 12.4 NYSE trading-halt data

Official resource:

- `https://www.nyse.com/trade/trading-halts`

Potential uses:

- current NYSE-group halts;
- downloadable halt information;
- one-year historical News Pending/News Dissemination and LULD records;
- exchange-specific cross-check.

Rules:

- store source-market identity;
- record the one-year historical coverage limit;
- archive source snapshots needed for longer private history;
- do not treat exchange-specific coverage as universal.

## 12.5 Limit Up/Limit Down Plan

Official resource:

- `https://www.luldplan.com/`

Potential uses:

- authoritative rules and tier definitions;
- interpretation of LULD mechanics;
- eligibility and regular-hours scope;
- test fixtures for rule changes.

Limitations:

- the Plan describes rules; it is not a complete historical event or band feed;
- exact historical bands are calculated by the SIPs from eligible transactions;
- one-minute OHLCV bars are not sufficient to recreate exact official bands;
- do not label a candle move as an official LULD state without event/band data.

Recommended use:

- rules reference and validation;
- never a substitute for historical halt/status data.

## 12.6 FINRA short-sale volume

Official resources:

- `https://www.finra.org/finra-data/browse-catalog/short-sale-volume`
- `https://www.finra.org/finra-data/browse-catalog/short-sale-volume-data`
- `https://developer.finra.org/`

Potential uses:

- off-exchange daily short-sale volume context;
- monthly transaction data where appropriate;
- historical context around short activity.

Critical limitations:

- short-sale volume is not short interest;
- the files are not consolidated with all exchange data;
- they include publicly disseminated off-exchange activity within defined scope;
- a high short-volume percentage does not prove a large open short position;
- terms indicate free non-commercial use for some catalog data, while API access has specific terms;
- source revision flags and updated files must be respected.

Recommended use:

- optional E2/E4 contextual feature with strong limitations;
- never a direct squeeze prediction, sentiment verdict, or short-interest substitute.

## 12.7 FINRA equity short interest and OTC threshold data

Official resources:

- `https://www.finra.org/finra-data/browse-catalog/equity-short-interest`
- `https://www.finra.org/finra-data/browse-catalog/otc-threshold`

Potential uses:

- twice-monthly reported short-interest context;
- settlement-date provenance;
- change from prior report;
- OTC threshold context if OTC support is intentionally added later.

Rules:

- publication/reporting lag must be explicit;
- a later report cannot be used as entry-time knowledge for an earlier trade;
- threshold status is not proof of a specific future price move;
- initial listed-common-equity scope should keep OTC-specific features disabled unless intentionally enabled.

## 12.8 OpenFIGI

Official resource:

- `https://www.openfigi.com/api/documentation`

Potential uses:

- identifier mapping;
- security type;
- exchange code;
- composite/share-class FIGIs;
- candidate generation for instrument resolution.

Strengths:

- free public API;
- documented rate limits;
- free API key increases throughput.

Limitations and rules:

- ticker searches can return multiple results;
- mapping is not a complete historical corporate-action service;
- never overwrite raw broker identity;
- store mapping request, candidates, selection, confidence, and timestamp;
- require manual review for ambiguous micro-cap symbols.

## 12.9 Nasdaq Data Link

Official resource:

- `https://docs.data.nasdaq.com/`

Potential uses:

- optional free datasets discovered through its catalog;
- economic or market reference datasets;
- experimentation and source spikes.

Limitations:

- most professional market datasets are premium;
- dataset licensing and update schedules vary;
- a free account/API key may be required;
- do not assume the brand name means every dataset is official Nasdaq exchange data;
- the documentation itself recommends premium data for professional applications.

Recommended use:

- experimental source catalog only until a specific dataset passes source review;
- never use an undocumented `api.nasdaq.com` web endpoint as a production contract.

## 12.10 First-party issuer pages

Potential uses:

- investor-relations press releases;
- company announcements;
- event documents not yet classified elsewhere.

Rules:

- first-party does not mean complete or unbiased;
- store full source URL, publication time, retrieval time, content hash, and issuer identity;
- deduplicate against SEC filings and wire-service copies;
- do not let AI web search snippets become the stored source;
- archive only to the extent permitted by terms and private-alpha policy.

---

# 13. Useful Free Open-Source Tools to Evaluate

## 13.1 `decimal.js`

Official documentation:

- `https://mikemcl.github.io/decimal.js/`

Why it may help:

- arbitrary-precision decimal arithmetic in JavaScript;
- configurable precision and rounding;
- avoids binary floating-point authority.

Required evaluation:

- performance on large import fixtures;
- serialization policy;
- invalid-value handling;
- rounding-mode compatibility with the selected analytical policy;
- comparison with `big.js` or another exact-decimal option before ADR acceptance.

Do not expose the library directly throughout domain code. Wrap it behind v3 money, price, quantity, percentage, and fee helpers.

## 13.2 `fast-check`

Official repository:

- `https://github.com/dubzzz/fast-check`

Why it may help:

- property-based and model-based testing for JavaScript/TypeScript;
- shrinking of failing execution streams;
- deterministic seeds for reproduction;
- useful for partial fills, reversals, idempotency, correction events, and sequential simulations.

Recommended use:

- development dependency;
- persist failure seeds in CI artifacts;
- convert owner-discovered bugs into fixed examples and properties.

## 13.3 `exchange_calendars`

Official repository:

- `https://github.com/gerrymanoim/exchange_calendars`

Why it may help:

- independent exchange-session calendar oracle;
- holidays and regular sessions;
- useful for differential test generation.

Limitations:

- community maintained;
- primarily regular-session calendars;
- premarket and after-hours require separate v3 session definitions;
- must not silently become the only authority for exceptional exchange sessions.

Recommended use:

- independent test oracle or fixture generator;
- validate against official exchange calendars;
- do not add a Python runtime dependency to the product merely for calendar lookup unless the architecture deliberately chooses that boundary.

---

# 14. Sources and Techniques That Must Not Become Authorities

Do not use as authoritative historical facts:

- undocumented Nasdaq website endpoints;
- search-engine snippets;
- LLM web-search summaries without stored source documents;
- current float applied to old trades;
- current ticker directories used as complete historical identity;
- Yahoo or other unofficial feeds without explicit provider qualification;
- social-media claims;
- scanner labels without source data;
- Academy prose;
- current watchlist bias or target fields;
- a single scraped finance website;
- candles as proof of spread, depth, quote liquidity, official halt, or exact execution availability.

An experimental source may be used in a private source-comparison dashboard, but it cannot silently drive a normal coaching claim.

---

# 15. Mandatory Amendment: External Data Is Ingested Before AI Reasoning

The model should not browse the web in real time and then treat whatever it finds as a historical feature.

## 15.1 Correct flow

```text
qualified source adapter
  -> immutable source snapshot
  -> normalized fact/event
  -> eligibility and no-lookahead checks
  -> deterministic feature/tool
  -> claim ledger
  -> AI explanation
```

## 15.2 AI-assisted extraction

AI may help classify an already stored filing or press release.

The extraction must include:

- source document ID;
- relevant text spans or structured fields;
- event type;
- effective and first-public timestamps;
- confidence;
- limitations;
- extractor prompt/model version;
- validation state.

AI extraction does not replace the source document.

## 15.3 Runtime research mode

A separate owner-only `Research` action may eventually search for additional public context.

It must be visibly separate from trusted journal analytics and cannot silently alter a saved historical finding until the source is ingested and validated.

---

# 16. Mandatory Amendment: Multi-Provider Market-Data Policy

The current repository can work with multiple candle sources. V3 must prevent silent source blending.

## 16.1 Rules

- A single market-path calculation uses one declared provider/basis unless a documented merge policy exists.
- A fallback provider creates a new snapshot and new manifest.
- Provider changes invalidate affected features.
- Provider disagreements create diagnostics.
- Source-specific timestamps and session coverage are preserved.
- Missing premarket data is not silently filled from a regular-session-only source.
- Adjusted and raw bars are not mixed.
- Different bar aggregation methods are versioned.

## 16.2 Provider-comparison diagnostics

For calibration, compare:

- bar counts;
- first/last timestamp;
- OHLC differences;
- volume differences;
- session coverage;
- split basis;
- missing intervals;
- VWAP availability;
- provider correction/retrieval date.

Do not select the provider that makes the trade narrative look better.

---

# 17. Mandatory Amendment: Evaluation Harness Before AI Product Judgment

A successful schema validation does not mean an answer is useful.

## 17.1 Evaluation layers

### Layer A — deterministic arithmetic

- exact expected P/L;
- position-state invariants;
- fee allocation;
- sequence ordering;
- simulation state transitions;
- evidence resolution;
- exclusion accounting.

### Layer B — claim correctness

- every number matches a tool claim;
- every unit and currency is correct;
- comparison baselines are accurate;
- limitations are retained;
- capability tier is sufficient;
- no unsupported causal language;
- no stronger conclusion than the tool permits.

### Layer C — explanation quality

- direct answer appears first;
- strongest evidence is prioritized;
- counterexamples are represented;
- wording is understandable;
- uncertainty is calibrated;
- no shame or invented emotion;
- no live instruction;
- no repeated empty boilerplate.

### Layer D — product usefulness

- owner says useful, incorrect, unclear, obvious, repetitive, or unsupported;
- evidence links help review the relevant trades;
- answer reveals a non-obvious but valid pattern;
- suggested rule is testable;
- follow-up question is relevant;
- response is worth the cost and latency.

## 17.2 Required comparison modes

Compare:

1. deterministic tool output only;
2. legacy v2 coaching;
3. v3 AI explanation;
4. no-conclusion/abstention baseline where appropriate.

Support/resistance comparison additionally uses:

- legacy nearest-level output;
- v3 zone-usability output;
- no-level output.

## 17.3 Golden question suite

Include at least:

- direct weekday comparison;
- scan for strongest/weakest weekday;
- time-of-day analysis;
- size-performance analysis;
- after-loss behavior;
- repeated ticker attempts;
- profit giveback;
- stop recovery with unknown stop intent;
- partial-exit simulation;
- daily-stop simulation;
- small sample;
- one-day cluster;
- one-ticker cluster;
- outlier-dominated result;
- missing fees;
- cross-currency block;
- open positions;
- prior inventory;
- basis warning;
- missing premarket;
- ambiguous instrument;
- missing quote;
- no qualified halt data;
- catalyst published after entry;
- congested levels;
- malicious instructions inside a note or filing.

## 17.4 Owner feedback taxonomy

- `useful`;
- `correct_but_obvious`;
- `incorrect_number`;
- `wrong_evidence`;
- `unsupported_claim`;
- `missed_limitation`;
- `unclear`;
- `too_verbose`;
- `too_shallow`;
- `repetitive`;
- `wrong_setup`;
- `wrong_grouping`;
- `data_problem`.

Each severe feedback item should be reproducible from saved manifests and become a private regression case.

Do not commit raw broker data when creating the regression.

---

# 18. Mandatory Amendment: Direct Questions Versus Discovery

Question wording changes the statistical burden.

## 18.1 Required modes

- `direct_hypothesis` — example: `Why are Fridays weak?`
- `fixed_comparison` — example: `Above or below VWAP?`
- `exploratory_scan` — example: `What do I do worst?`
- `optimization` — example: `Find the best daily stop.`
- `similarity_search` — example: `Find trades like this.`

## 18.2 Rules

- Scanning all weekdays is more discovery-heavy than comparing Friday with non-Friday.
- Scanning many setup, time, price, and size buckets requires multiple-comparison controls.
- Repeated user questions can still create an exploratory search history; the system should not pretend each result was an independently pre-registered hypothesis.
- Optimization requires chronological holdout or prospective tracking.
- The answer must label historical optimization.

---

# 19. Mandatory Amendment: Confounding, Strategy Eras, and Simpson’s Paradox

A segment may appear weak because another factor is concentrated in that segment.

Example:

- Fridays look weak;
- most Friday trades were one ticker;
- that ticker was traded during one losing week;
- Friday itself may not be the main contributor.

## 19.1 Required decomposition

Where sample permits, compare:

- raw segment result;
- result after removing largest day;
- result after removing largest ticker;
- result by time of day;
- result by size bucket;
- result by setup;
- result by long/short direction;
- result by recent versus older period;
- independent day count;
- independent ticker count.

## 19.2 Strategy eras

Allow the owner to mark or infer strategy eras such as:

- before/after a rule change;
- before/after broker change;
- before/after sizing change;
- before/after setup focus change.

Do not combine materially different eras without disclosure.

## 19.3 Language

Use:

- `The strongest associated contributors were…`
- `The Friday result was concentrated in…`
- `This does not prove Friday caused the losses.`

Avoid causal claims unless the design genuinely supports them.

---

# 20. Mandatory Amendment: Intended Setup, Inferred Setup, and Rule Timing

The system must not treat every setup label as the same kind of fact.

## 20.1 Setup states

- `user_intended_setup`;
- `user_post_trade_tag`;
- `deterministic_candidate`;
- `ai_likely_setup`;
- `chart_validated_setup`;
- `user_confirmed_setup`;
- `unclassified`.

Store the source and timestamp for each.

## 20.2 Rule states

A rule includes:

- rule version;
- created time;
- effective start time;
- retirement time;
- scope;
- measurement definition;
- historical simulation result;
- prospective status.

A rule created after a trade cannot label that earlier trade a violation.

## 20.3 Planned risk

R-multiple and risk adherence require a planned stop or risk amount recorded before or independently of the outcome.

Do not infer planned risk from the eventual loss and call it an R-multiple.

---

# 21. Mandatory Amendment: Metric Families and Honest Normalization

No single metric should dominate the coach.

## 21.1 Return families

Store or derive separately:

- gross P/L;
- net P/L;
- P/L per share;
- percentage move captured;
- return on maximum position value;
- fee drag;
- MFE/MAE;
- MFE retained;
- R-multiple only when risk is known;
- session drawdown;
- account-equity-normalized result only when equity history exists.

## 21.2 Position-size questions

`Best position size` must not return one prescriptive share count.

It should return:

- historical size buckets;
- size relative to personal median;
- expectancy;
- median;
- downside dispersion;
- MAE;
- fee drag;
- sample size;
- concentration;
- historical period;
- limitations.

## 21.3 Open positions

Do not mix realized closed-trade analytics with open-position mark-to-market without explicit separation.

---

# 22. Mandatory Amendment: Sequential Simulation State

Simulation tools must operate on a hypothetical state machine.

## 22.1 Daily-stop simulation

When the stop condition is reached:

- all later trades within the selected account/session scope are excluded;
- removed trades cannot affect later consecutive-loss state;
- actual trades before the intervention remain unchanged;
- multi-account consolidation policy is explicit;
- same-timestamp ordering policy is explicit;
- days helped and harmed are returned;
- uncertainty intervals are shown where appropriate.

## 22.2 Partial-exit simulation

The hypothetical position state must replace the affected actual shares.

Later actual reductions are reconciled against remaining hypothetical inventory.

The tool must define whether later actual entries/adds are retained.

## 22.3 Capital constraints

Do not claim a simulated series is portfolio-realistic unless capital availability and buying power are modeled.

For the private alpha, trade-local and session-local simulations may be used with that limitation.

---

# 23. Mandatory Amendment: Owner-Only Does Not Mean Unauthenticated

The current profile needs a separate hosting-mode contract.

Suggested values:

- `local_only`;
- `private_hosted`.

## 23.1 `local_only`

May use local operating-system access controls and an explicit owner profile.

Still require:

- data directory outside Git;
- backup;
- file permissions;
- secrets outside source;
- no raw-data logging;
- fail-closed environment checks.

## 23.2 `private_hosted`

Must require owner authentication and authorization even though there is one user.

Required:

- no anonymous import, trade, analytics, or AI routes;
- secure session;
- owner identity binding;
- CSRF protection for mutations where applicable;
- encrypted transport;
- secrets management;
- private database/storage;
- audit logging for sensitive actions;
- fail closed when owner identity cannot be resolved.

A publicly reachable Vercel deployment with no authentication is not a private alpha.

---

# 24. Mandatory Amendment: Private Backup and Restore Must Be Tested

A backup that has never been restored is not a verified backup.

Private-alpha requirements:

- scheduled database backup or snapshot;
- source-file backup policy;
- encrypted backup location;
- retention count;
- restore command/runbook;
- integrity hash;
- periodic restore test;
- backup version compatible with schema version;
- documented recovery point and recovery time expectations.

The owner’s private broker data remains outside Git.

---

# 25. Revised Gate 0 Implementation Slices

The current Gate 0 plan remains the detailed source, but execution should be split.

## GA0-A — Control and Exact Truth

Deliverables:

- controlling architecture specification;
- current-system inventory;
- deployment and hosting-mode contracts;
- exact-decimal ADR;
- P/L/reconstruction ADR;
- timestamp/session ADR;
- instrument/basis ADR;
- dataset-manifest contract;
- source-truth hierarchy;
- analysis-eligibility contract;
- independent exact reference math;
- first synthetic financial fixtures;
- architecture and private-data guards.

Exit criteria:

- no tool implementation yet depends on unresolved financial or time semantics;
- exact reference tests pass;
- manifests and eligibility serialize deterministically;
- no runtime route changes.

## GA0-B — Deterministic Proof Slice

Deliverables:

- read-only current-data adapter;
- coverage manifest;
- weekday analytics tool;
- stop-after-consecutive-losses simulation;
- evidence resolver;
- exclusion accounting;
- internal test/debug output;
- differential tests against reference math;
- property tests;
- v3 CI.

Exit criteria:

- tools reproduce from a saved dataset manifest;
- evidence IDs resolve;
- small sample and clustered-day cases fail safely;
- simulation assumptions are explicit;
- no AI call.

## GA0-C — Private Real-Data Calibration

Deliverables:

- private fixture manifest without raw data;
- import coverage report;
- reconciliation report;
- backup and restore check;
- owner-only internal diagnostics;
- weekday and daily-stop results on private data;
- owner review of excluded trades and evidence links;
- bugs converted to synthetic or private regression cases;
- Gate 0 exit report.

Exit criteria:

- no unresolved critical P/L or identity discrepancy in the approved private sample;
- owner confirms evidence links map to the intended trades;
- limitations are understandable;
- proceed/revise/stop decision is recorded.

## GA1 — Execution-Only Analytics Expansion

After GA0-C:

- time of day;
- sequence within session;
- post-loss and post-win behavior;
- repeated ticker attempts;
- size-performance analysis;
- hold-time analysis;
- adds and reductions;
- fee drag;
- open-position separation.

## GA2 — Owner-Only AI

Only after:

- claim ledger;
- numeric/unit/currency validator;
- evidence validator;
- capability validator;
- answer schema;
- bounded tool plan;
- cost reservation/caps;
- answer replay;
- owner feedback;
- private-hosting gate if hosted;
- golden evaluation suite.

---

# 26. External Source Adoption Order

Do not add all sources at once.

## Source Step 0 — Registry and fake adapters

- create source contracts;
- add terms/profile states;
- use synthetic responses;
- test corrections, rate limits, and stale data.

## Source Step 1 — SEC filing metadata

Recommended first external source because it is official, free, highly relevant to small/micro-cap catalysts, and does not require quote-level licensing.

Start with:

- CIK/ticker candidates;
- submissions metadata;
- accession/document links;
- form type;
- filing acceptance metadata;
- stored source hash;
- event candidate generation;
- no AI narrative yet.

## Source Step 2 — Halt sources

- Nasdaq Trader RSS adapter;
- NYSE halt adapter;
- source-scope metadata;
- halt/resume normalization;
- mismatch diagnostics;
- no fill simulation during qualified halt intervals.

## Source Step 3 — Instrument mapping

- OpenFIGI candidate mapping;
- SEC issuer mapping;
- Nasdaq directory snapshot;
- manual resolution workflow;
- corporate-action review state.

## Source Step 4 — Dated share structure and FINRA context

- SEC shares-outstanding facts with data-quality checks;
- optional dated public-float facts;
- FINRA short interest;
- FINRA short-sale-volume with explicit limitations;
- no directional squeeze conclusion.

## Source Step 5 — Quote data

Do not promise E3 quote enrichment until a provider with adequate historical coverage and permitted use is selected.

There is no assumption that comprehensive historical NBBO or depth will be free.

## Source Step 6 — Additional sources

Add only after a concrete feature need and source qualification.

---

# 27. External Source QA Checklist

Before enabling a source:

- [ ] official documentation reviewed;
- [ ] terms reviewed and dated;
- [ ] permitted profile recorded;
- [ ] rate limit recorded;
- [ ] required headers and identification recorded;
- [ ] historical coverage tested;
- [ ] timezone tested;
- [ ] correction/revision behavior tested;
- [ ] raw response hash stored;
- [ ] parser versioned;
- [ ] source-specific fixtures added;
- [ ] stale-data behavior tested;
- [ ] outage behavior tested;
- [ ] provider disagreement behavior tested;
- [ ] no-lookahead tested;
- [ ] public redistribution state recorded;
- [ ] cache/retention policy recorded;
- [ ] feature claims limited to source capability.

---

# 28. Third-Pass Acceptance Matrix

| Area | Private-alpha requirement | Owner-only AI requirement | Market-enrichment requirement | Public requirement |
|---|---|---|---|---|
| Planning authority | consolidated specification | same | same | same |
| Exact decimals | required | required | required | required |
| P/L policy | required | required | required | required |
| Dataset manifest | required | required | required | required |
| Coverage state | required | required | required | required |
| Eligibility | required | required | required | required |
| Evidence resolution | deterministic tools | required for every claim | required | required |
| AI validator | not needed in GA0 | required | required | required |
| Source registry | contract only | contract only | required per source | licensing review required |
| SEC source | optional | optional | recommended early | terms/scale review |
| Halt sources | optional | optional | required for halt claims | terms/operations review |
| Quotes | not required | not required | required for spread claims | licensed rights required |
| Float | not required | not required | dated provenance required | rights and retention review |
| Backup | required | required | required | formal recovery required |
| Authentication | local controls or owner auth | owner auth if hosted | same | shared auth/tenancy |
| Evaluation | deterministic | golden AI suite | source-specific suite | release/canary suite |

---

# 29. Risks Found in the Third Pass

| Risk | Severity | Required mitigation |
|---|---:|---|
| Future runs follow conflicting QA documents | Critical | one controlling architecture specification |
| Same version label points to different source data | Critical | content-addressed manifests |
| Partial statement is treated as full history | High | coverage state and gap detection |
| Unsafe trades enter market-context denominator | High | per-capability eligibility |
| Source correction leaves old answer looking current | High | dependency invalidation and stale state |
| Free data terms are assumed to permit public SaaS | High | source registry and profile permissions |
| Current-only symbol data is applied historically | High | daily snapshots and validity periods |
| CIK is treated as exact instrument ID | High | issuer/instrument separation |
| AI web search invents historical context | Critical | ingest/validate source before analysis |
| Multiple providers are silently blended | High | one-provider snapshot and disagreement diagnostics |
| One uploaded month is called the trader’s behavior | High | coverage-qualified language |
| User’s later rule labels old trade a violation | High | effective-time rule versioning |
| R-multiple is inferred from realized loss | High | planned-risk requirement |
| First foundational PR becomes unreviewable | Medium/High | split GA0-A/B/C |
| Correct but useless AI passes technical tests | High | usefulness evaluation harness |
| Owner-only hosted page is anonymously reachable | Critical | hosting-mode and fail-closed auth |
| Backup exists but cannot restore | High | periodic restore test |
| FINRA short-sale volume is called short interest | High | separate feature definitions and warnings |
| LULD is reconstructed from one-minute candles | High | rules reference only without official event/band data |
| Current float contaminates historical analysis | High | dated source and suppression |
| Source-specific exclusions are hidden | High | denominator and exclusion accounting |

---

# 30. Final Third-Pass Directive

Trader Intelligence v3 is approved to proceed into staged private-alpha implementation after the architecture authority is consolidated.

The product should now be understood as:

```text
qualified private source data
  -> exact accepted executions
  -> explicit reconstruction and coverage
  -> content-addressed dataset manifest
  -> per-capability eligibility
  -> deterministic analytics and simulations
  -> claim and evidence ledger
  -> evaluated owner-only AI explanation
  -> qualified small/micro-cap source enrichment
  -> measured usefulness
  -> future public hardening
```

External sources can materially improve the product, especially SEC filings, exchange halt data, identifier mapping, and carefully qualified FINRA context. They must enter through source adapters and immutable provenance, not through ad hoc browsing or copied website values.

The most important engineering standard after this pass is:

> A result is trustworthy only when the system can identify the exact source data, policy, eligibility decision, calculation, evidence, and explanation that produced it.

The most important product standard is:

> Prefer a reproducible limited answer over an impressive answer built from incomplete coverage, weak external data, or untraceable assumptions.

The most important execution standard is:

> Build the smallest deterministic slice that proves truth and usefulness, then add external context one qualified source and one measurable capability at a time.
