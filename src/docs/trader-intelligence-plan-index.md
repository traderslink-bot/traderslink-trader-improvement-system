# Trader Intelligence Plan Index

**Last updated:** 2026-07-17 America/Toronto  
**Active architecture:** Trader Intelligence v3  
**Current operating profile:** `private_owner_alpha`  
**Primary domain:** small-cap and micro-cap active trading  
**Current phase:** Gate 0 — common truth, architecture decisions, and first private-alpha deterministic slice  
**Active execution plan:** `src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`  
**Purpose:** Keep future implementation aligned with the evidence-first educational journal architecture, the private-alpha sequencing decision, and the small/micro-cap domain instead of drifting back into legacy deterministic coaching or prematurely building a public platform.

---

## 1. Required Resume Order

1. Read `plan.md`.
2. Read `src/docs/trader-intelligence-v3-project-log.md`.
3. Read `src/docs/trader-intelligence-v3-second-pass-qa-private-alpha-small-micro-cap-review-2026-07-17.md`.
4. Read `src/docs/trader-intelligence-v3-qa-architecture-review-2026-07-17.md`.
5. Read `src/docs/trader-intelligence-ai-journal-v3-master-plan-2026-07-17.md`.
6. Read `src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`.
7. Read legacy plans only for preserved implementation evidence, migration parity, route history, education, or fixture knowledge.

When documents conflict, use this precedence:

1. latest v3 project-log decision;
2. mandatory second-pass private-alpha and small/micro-cap QA review;
3. first mandatory v3 QA review;
4. v3 master plan;
5. current v3 phase plan;
6. legacy documents.

---

## 2. Current Product and Operating Facts

These facts are controlling:

- Trader Intelligence is currently tested only by the owner.
- It is not currently a public multi-user product.
- The current profile is `private_owner_alpha`.
- The intended primary users are small-cap and micro-cap active traders.
- The product is retrospective and educational.
- It analyzes completed executions, historical market context, and user-created rule experiments.
- It is not a live signal product, investment-advice service, automated broker, tax product, or portfolio allocator.
- Private-alpha status permits faster usefulness validation but does not relax exact financial math, evidence, no-lookahead, basis safety, or simulation honesty.
- Future public architecture remains a separate required track.

---

## 3. Active Plans and Control Documents

### Master architecture

- `src/docs/trader-intelligence-ai-journal-v3-master-plan-2026-07-17.md`

Purpose:

- defines the product, target architecture, data model, analytics tools, AI layer,
  migration direction, implementation phases, MVP, and long-term directive.

Status:

- conditionally approved;
- must be implemented with both QA reviews below.

### Mandatory second-pass QA, private-alpha, and small/micro-cap amendments

- `src/docs/trader-intelligence-v3-second-pass-qa-private-alpha-small-micro-cap-review-2026-07-17.md`

Purpose:

- records the owner-only private-alpha operating fact;
- separates private value validation from future public readiness;
- prevents multi-user infrastructure from blocking early product usefulness;
- preserves exact math and evidence as private-alpha requirements;
- defines deployment profiles;
- makes small/micro-cap specialization concrete;
- adds instrument identity, corporate-action, session, halt, quote, liquidity,
  slippage, float, catalyst, dilution, listing, and data-capability requirements;
- strengthens simulation and causal-language policy;
- enforces the retrospective educational boundary;
- defines private-real-data handling and a small/micro-cap fixture matrix;
- permits owner-only AI only after deterministic claim and evidence gates pass.

Status:

- mandatory and controlling where it conflicts with the first QA review, master
  plan, or Gate 0 plan.

### First mandatory QA and architecture review

- `src/docs/trader-intelligence-v3-qa-architecture-review-2026-07-17.md`

Purpose:

- records the first cross-plan and repository audit;
- corrects production-readiness assumptions;
- requires exact financial types, accounting policy, secure ingestion, durable
  jobs, retention, identity, tenancy, statistical integrity, AI grounding,
  migration control, CI, and launch gates;
- changes support/resistance work from a second detector into a final-zone
  usability and congestion layer.

Status:

- mandatory for future invited/public readiness;
- still mandatory for common truth and correctness;
- public-platform sequencing is modified by the second-pass review because the
  current product is a private owner-only alpha.

### V3 project log

- `src/docs/trader-intelligence-v3-project-log.md`

Purpose:

- records decisions, completed v3 work, verification, blockers, deployment
  profile, gate status, and the exact resume point.

### Current implementation-run plan

- `src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`

Purpose:

- converts Gate 0 into ADRs, repository inventory, versioned contracts, an exact
  financial test boundary, read-only compatibility adapters, the first weekday
  analytics tool, the first daily-stop simulation, and v3 CI;
- defines file-level responsibilities, forbidden work, acceptance criteria,
  verification, and branch/PR policy.

Status:

- active planning authority for the first coding run;
- must be read through the second-pass private-alpha and small/micro-cap amendments;
- implementation should begin on a new clean branch after this documentation PR
  is accepted;
- no public route, public write path, coach redesign, support/resistance use, or
  deployment is authorized by this plan.

---

## 4. Deployment Profiles

Required profiles:

1. `private_owner_alpha`
2. `private_invited_alpha`
3. `public_beta`
4. `public_production`

### Current profile: `private_owner_alpha`

May use:

- one explicit owner identity adapter;
- durable local SQLite or an isolated private database;
- direct private file selection or bounded owner-authenticated upload;
- local/synchronous job adapters for small workloads;
- private real-data fixtures outside the repository;
- owner-only AI after deterministic grounding gates pass.

Still requires:

- exact decimals;
- explicit P/L policy;
- basis and timezone safety;
- dataset and evidence versions;
- no raw CSV in logs or prompts;
- backup and restore;
- no accidental public access;
- no live market instructions.

Cannot be represented as public-production readiness.

### Public profiles

Before invited or public users, require:

- shared identity;
- server-derived tenancy;
- PostgreSQL authority;
- tenant isolation and RLS where practical;
- object-storage upload;
- durable jobs/outbox;
- deletion and retention;
- rate limits;
- entitlements and cost controls;
- licensing review;
- monitoring and recovery.

---

## 5. Current Gate 0 Decisions

The following common-truth decisions must be locked before trusting the first private-alpha results:

1. deployment-profile contract and fail-closed environment checks;
2. exact decimal library and serialized financial representation;
3. analytical P/L, fees, partial-fill, reversal, short, prior-inventory, and open-position policy;
4. per-currency reporting and future FX policy;
5. timestamp, UTC storage, exchange-calendar, and session policy;
6. stable instrument identity and symbol-history strategy;
7. market-data raw/adjusted basis contract and corporate-action warnings;
8. dataset-version and evidence-resolution contracts;
9. private owner data, backup, and private-fixture policy;
10. current-system preserve/adapt/legacy/retire inventory;
11. small/micro-cap asset, direction, broker, price-band, and session scope;
12. required v3 CI checks.

The following public-readiness decisions may be documented in Gate 0 but need not
block private owner usefulness validation:

- shared site identity and multi-user authorization;
- workspace/account tenancy and RLS;
- PostgreSQL migration framework;
- secure public object storage;
- transactional outbox and durable workflow provider;
- public deletion, retention, support, billing, and SLOs.

No public AI route or public v3 write path should be added before the public
choices are implemented and tested.

---

## 6. Private-Alpha and Public-Readiness Tracks

### Track A — Private Owner Alpha

#### GA0: Common truth and deterministic proof

- exact math;
- P/L policy;
- read-only adapters;
- synthetic fixtures;
- weekday analytics;
- daily-stop simulation;
- evidence and dataset versions;
- private storage backup.

#### GA1: Execution-only analytics

- time of day;
- trade sequence;
- after-loss behavior;
- position size;
- hold time;
- adds/reductions;
- repeated ticker attempts;
- fee drag.

#### GA2: Owner-only AI grounding

Allowed only after:

- tool registry;
- claim ledger;
- numeric validator;
- evidence validator;
- answer schema;
- cost caps;
- private-owner feature gate;
- no-raw-CSV prompt policy;
- educational language policy.

#### GA3: Small/micro-cap market enrichment

Add progressively by evidence capability:

- candle-enriched features;
- verified halt events;
- quote/spread context;
- dated float/share-structure context;
- catalyst/filing/listing context;
- zone usability and congestion.

#### GA4: Usefulness calibration

Compare v3 with legacy output for correctness, trust, evidence usefulness,
follow-up questions, repetitive feedback, noisy-level suppression, and owner
preference.

### Track B — Future Public Readiness

- shared identity;
- tenant-safe persistence;
- public upload;
- durable jobs;
- deletion;
- billing/entitlements;
- licensing;
- observability;
- recovery;
- launch review.

---

## 7. First Internal Coding Slice

The active Gate 0 execution plan defines the full run. The first private-alpha
coding slice includes:

- `src/lib/trader-intelligence-v3/` boundary;
- deployment-profile contract;
- authorization-context interface with a private-owner test adapter;
- decimal money/price/quantity contracts;
- analytical P/L and reconstruction-policy contracts;
- instrument identity and price-basis contracts or ADRs;
- dataset-version contract;
- canonical execution and analytical round-trip contracts;
- analytics tool, claim/evidence, job, and usage contracts;
- read-only adapters from current saved data;
- independent financial reference math;
- public synthetic golden fixtures;
- private-fixture manifest policy;
- performance-by-weekday tool;
- daily-stop-after-consecutive-losses simulation;
- v3 CI checks.

It must not include:

- a public model call;
- a public v3 route;
- public production database writes;
- a coach redesign;
- support/resistance consumption;
- a new level detector;
- unrestricted SQL;
- a vector database;
- production deployment.

Owner-only AI is a later private-alpha gate, not part of the first deterministic slice.

---

## 8. Small/Micro-Cap Domain Requirements

### Instrument and basis

- ticker is not a durable instrument ID;
- resolve symbols as of execution time;
- support ticker changes and symbol reuse;
- preserve raw execution prices;
- align candles to the execution basis;
- fail chart-derived analytics closed on split/basis mismatch;
- quarantine unresolved instruments.

### Sessions

- premarket, regular, and after-hours are first-class;
- use UTC storage and versioned America/New_York session classification;
- cover holidays, half days, and daylight-saving transitions.

### Halts

- official/qualified halt data is required for halt claims;
- missing bars do not prove a halt;
- simulations cannot fill during a halt;
- resume gaps require explicit policy.

### Spread, liquidity, and slippage

- OHLCV bars cannot prove spread or liquidity;
- quote-relative execution cost requires historical quotes;
- plan-relative slippage requires intended/order price data;
- candle-relative location must not be labeled as slippage;
- target touch is not proof of executable fill.

### Float and catalysts

- float requires source and historical as-of provenance;
- float rotation is an estimate;
- catalyst, filing, dilution, listing, and corporate-action events require first-public timestamps and sources;
- later-published events cannot influence entry-time reasoning.

### Asset scope

- initial focus: supported U.S. listed common equities;
- options remain quarantined;
- OTC, warrants, rights, units, preferred shares, and unresolved security types are
  excluded or explicitly classified until intentionally supported;
- ledger facts may support shorts before short-specific coaching is calibrated.

---

## 9. Data Capability Tiers

Every tool and AI answer must identify the evidence capability used:

- E0 execution-only;
- E1 candle-enriched;
- E2 event-enriched;
- E3 quote-enriched;
- E4 share-structure-enriched;
- E5 combined enrichment with explicit limitations.

A higher tier is not trusted when data is stale, basis-unsafe, unresolved, or
outside the no-lookahead cutoff.

---

## 10. Support and Resistance Decision

`levels-system-v2` remains the factual source.

The existing level-analysis snapshot already contains final zones and evidence.
V3 must consume the complete replay-safe final-zone map and add a **Zone
Usability and Congestion Layer** that:

- preserves source-zone IDs;
- deduplicates only proven overlap;
- calculates congestion and clear space;
- selects at most one primary support and one primary resistance zone;
- fails closed when structure is crowded, unstable, stale, synthetic-only, or
  basis-unsafe;
- handles gaps, halts, premarket/regular-session context, sparse prints, and
  reverse-split warnings conservatively.

Do not rebuild candle reading or a second independent level detector inside
Trader Intelligence.

Support/resistance cannot reach v3 AI before the separate usefulness and stability gate passes.

---

## 11. Educational Product Boundary

Allowed:

- historical analysis;
- evidence-linked review;
- historical simulations;
- user-created rule experiments;
- prospective rule tracking;
- Academy links for education;
- uncertainty and limitations.

Not part of the journal:

- live buy/sell/hold instructions;
- current price targets;
- automated execution;
- guaranteed improvement;
- tax advice;
- portfolio allocation advice;
- claims that historical simulation will repeat.

Use historical and associative language. Do not convert questions phrased as
`why` into unsupported causal claims.

---

## 12. Private Data and Fixture Policy

- real broker CSVs remain outside Git;
- no real raw rows in PRs, issues, snapshots, or normal logs;
- use ignored private calibration directories;
- commit only synthetic fixtures and sanitized manifests/hashes;
- remove account identifiers from screenshots;
- support private-alpha backup, restore, and deletion;
- test reverse splits, ticker changes, sub-dollar precision, premarket, halts,
  partial fills, fees, prior inventory, shorts, outliers, and missing market data.

---

## 13. Public Launch Blockers

The following remain explicit invited/public-user blockers:

- demo identity constants in a public path;
- unauthenticated or browser-authorized tenant access;
- temporary-filesystem SQLite as public authority;
- floating-point financial authority;
- undefined analytical P/L policy;
- cross-currency aggregation without FX policy;
- raw CSV JSON uploads without public size/storage controls;
- critical jobs relying only on request lifecycle;
- price-basis mismatch used for chart-derived claims;
- AI numbers that do not map to validated tool claims;
- unrestricted model-generated SQL;
- level coaching from congested structure;
- indefinite dual-write migration;
- missing deletion/retention behavior;
- no tenant-isolation tests.

Private-alpha results additionally fail when they use floating-point financial
authority, unknown basis, undefined reconstruction, raw CSV prompts, candle-only
spread claims, or current directional market instructions.

---

## 14. Legacy Planning and Education Archive

The following remain useful as history but are not active architecture:

- `src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md`
- `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`
- `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`
- `src/docs/trader-intelligence-coaching-evidence-model-2026-05-09.md`
- `src/docs/trader-intelligence-analytics-continuous-product-plan-2026-05-09.md`
- `src/docs/trader-intelligence-coach-continuous-product-plan-2026-05-09.md`
- `src/docs/trader-intelligence-progress-continuous-product-plan-2026-05-09.md`
- older route, import, calibration, and handoff plans.

Use them for:

- existing route behavior;
- fixture and test coverage;
- evidence-safety lessons;
- migration parity;
- preserved parser/reconstruction logic;
- prior product QA findings.

The Academy is an educational asset for small/micro-cap topics. It is not an
analytics authority and does not create findings.

Do not resume old active batches.

---

## 15. Plan-Creation Rules

Create a new v3 plan only when a phase or feature has:

- a distinct contract boundary;
- its own acceptance and QA gates;
- a multi-run implementation sequence;
- migration, financial, domain, or public-readiness risk;
- enough work that it would be buried in the project log.

Every v3 plan must include:

- purpose and non-goals;
- deployment profile;
- source-of-truth layer;
- data capability tier;
- exact contracts;
- authorization and tenancy impact;
- financial precision impact;
- small/micro-cap domain impact;
- educational-boundary impact;
- data-version impact;
- migration impact;
- failure/degradation behavior;
- acceptance criteria;
- verification commands;
- rollout and rollback;
- documentation/log updates.

Do not create separate plans for tiny TODOs.

---

## 16. Update Protocol

After meaningful v3 work:

1. update `src/docs/trader-intelligence-v3-project-log.md`;
2. update the active phase plan;
3. update this index when authority, deployment profile, or gate status changes;
4. update the second-pass QA review for material private-alpha or small/micro-cap
   domain decisions;
5. update the master plan or first QA review only for material architecture changes;
6. preserve legacy docs unless a factual correction is required;
7. record tests, data capability, migrations, and rollout state before reporting completion.
