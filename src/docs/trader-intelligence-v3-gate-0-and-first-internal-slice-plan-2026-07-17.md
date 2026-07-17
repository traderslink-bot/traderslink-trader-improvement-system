# Trader Intelligence v3 Gate 0 and First Internal Slice Plan

**Date:** 2026-07-17 America/Toronto  
**Status:** Active execution plan  
**Phase:** Gate 0 — governance, scope, and architecture lock  
**Target branch after plan approval:** a new implementation branch from current `main`  
**Public product impact:** None in this gate  
**AI model calls:** Forbidden in this gate  
**Production deployment:** Forbidden in this gate

## Authority

Read this plan after:

1. `plan.md`
2. `src/docs/trader-intelligence-v3-project-log.md`
3. `src/docs/trader-intelligence-v3-qa-architecture-review-2026-07-17.md`
4. `src/docs/trader-intelligence-ai-journal-v3-master-plan-2026-07-17.md`
5. `src/docs/trader-intelligence-plan-index.md`

The mandatory QA review controls where this plan or the original master plan is less strict.

---

## 1. Purpose

This plan converts the v3 architecture and QA review into the first safe engineering run.

It has two outcomes:

1. lock the decisions that would otherwise cause expensive rewrites or unsafe production behaviour;
2. prove the architecture through one internal deterministic vertical slice before any AI, public route, production write path, or coach redesign is introduced.

The first vertical slice will answer two questions without an LLM:

- How does the trader perform by weekday?
- What would the historical results have been under a stop-after-consecutive-losses rule?

These tools are intentionally selected because they prove:

- exact financial aggregation;
- account/date filtering;
- session sequencing;
- statistical evidence and limitations;
- counterfactual intervention policy;
- evidence identifiers;
- compatibility with current saved trades;
- no dependency on support/resistance or market candles.

---

## 2. Success Definition

Gate 0 is complete only when:

- the v3 planning chain is the active source of truth;
- preserved, adapted, legacy, and retired modules are inventoried;
- every P0 architectural decision has a written ADR;
- exact money, price, quantity, fee, and P/L representation is selected;
- analytical P/L and reconstruction policy is explicit;
- shared identity and tenancy direction is explicit;
- PostgreSQL authority, raw-file storage, durable jobs, and migration direction are explicit;
- the v3 module boundary exists;
- the first two deterministic tools return versioned, evidence-linked results;
- synthetic golden and property-based tests pass;
- v3 CI enforces typecheck, tests, financial correctness, architecture boundaries, and build;
- no end-user route or existing production behaviour changes.

Gate 0 is not complete because documents were created. It is complete only when the decision records and internal proof slice satisfy this plan’s acceptance criteria.

---

## 3. Non-Goals

Do not implement in this gate:

- an Ask AI page;
- any OpenAI or other model-provider call;
- prompt engineering;
- production PostgreSQL writes;
- production CSV object-storage upload;
- public feature flags visible to customers;
- support/resistance consumption;
- a new level detector;
- candle hydration changes;
- setup classification;
- behavioral coaching;
- Rule Lab UI;
- daily or weekly reports;
- vector search or embeddings;
- arbitrary SQL or an analytics DSL;
- live broker connections;
- options analytics;
- tax accounting;
- live trade alerts;
- automated order execution;
- a `/coach` redesign;
- production deployment.

Gate 0 may define contracts and ADRs for later phases without building those systems now.

---

## 4. Operating Rules

### 4.1 Source of truth

Every implementation item must identify one source-of-truth layer:

- source file;
- accepted execution;
- reconstruction;
- market snapshot;
- feature;
- analytics result;
- simulation result;
- claim/evidence finding;
- AI explanation.

No higher layer may silently repair or reinterpret a lower layer.

### 4.2 Financial truth

- No binary floating-point value is authoritative for money, execution price, quantity, fees, FX, or P/L.
- No cross-currency total is permitted without a versioned FX conversion policy.
- Analytical P/L must be distinguished from broker-reported P/L, cash movement, and tax P/L.
- Every reconstruction and simulation result includes its policy version.

### 4.3 Tenant truth

- Browser-provided workspace, user, or account IDs never grant access.
- All future repository and analytics interfaces accept a server-derived authorization context.
- Gate 0 implementations may use in-memory test identities, but may not introduce another production demo-ID shortcut.

### 4.4 Evidence truth

- Every material tool result links to resolvable evidence IDs.
- Evidence IDs are scoped to an authorization context.
- A tool may return insufficient evidence; it must not manufacture a conclusion.

### 4.5 Compatibility

- Existing imports and saved trades are read through adapters.
- Gate 0 adapters are read-only.
- No existing row, saved trade, note, review state, or route is mutated.
- Existing deterministic coaching remains untouched during this internal slice.

---

## 5. Workstream A — Governance and Repository Inventory

### 5.1 Create an architecture inventory

Create:

`src/docs/trader-intelligence-v3-current-system-inventory-2026-07-17.md`

For each relevant module, record:

- path;
- current responsibility;
- current consumers;
- data authority;
- production-readiness state;
- v3 classification;
- adapter or migration requirement;
- known risks;
- test coverage;
- planned retirement condition.

Allowed classifications:

- `preserve` — trusted domain capability remains authoritative;
- `adapt` — valuable capability needs a v3 interface or hardening;
- `legacy_provider` — may run for comparison but cannot control v3 output;
- `retire` — remove after migration and parity gates;
- `out_of_scope` — belongs to another product area.

### 5.2 Minimum inventory scope

Inspect at least:

- `src/lib/execution-sources/csv/`
- `src/lib/trade-analysis/request/`
- `src/lib/raw-trade-timeline/`
- `src/lib/execution-feedback/`
- `src/lib/trader-analytics/`
- `src/lib/trader-analytics/product/import-commit/`
- `src/lib/trader-analytics/server/`
- `src/lib/level-analysis/`
- `src/lib/support-resistance/`
- `src/lib/pattern-input/`
- `src/lib/pattern-detection/`
- `src/lib/pattern-normalization/`
- `src/lib/pattern-scoring/`
- `src/lib/behavior-analysis/`
- `src/lib/coaching/`
- `src/lib/user-facing-behavior/`
- `app/intelligence/`
- `app/api/` routes used by Trader Intelligence;
- authentication/session modules;
- current SQLite migrations;
- current Neon/PostgreSQL modules;
- current background-task paths;
- relevant Vitest, Playwright, fixture, and CI files.

### 5.3 Initial expected classifications

These are hypotheses to verify, not substitutes for inspection.

| Area | Expected classification | Reason |
|---|---|---|
| Broker CSV header/adapters | Preserve/adapt | Valuable broker knowledge and diagnostics |
| CSV parser core | Adapt | Keep deterministic parsing; add bounded/streaming production path later |
| Fingerprints/duplicate logic | Preserve/adapt | Essential idempotency foundation |
| Raw execution normalization | Preserve/adapt | Core factual boundary |
| Flat-to-flat grouping | Adapt | Needs exact policy, position separation, prior-inventory and short hardening |
| Execution feedback | Legacy provider/adapt | Useful feature source, not final coach |
| SQLite repository | Adapt for tests only | Useful local adapter; not production authority |
| Demo identity constants | Retire | Cannot support multi-user production data |
| Current import commit service | Adapt | Valuable flow but needs auth, exact ledger, object storage, durable jobs |
| Level snapshot contract | Preserve/adapt | Replay-safe factual source |
| Nearest-level coaching consumption | Legacy provider/retire | Fails in congested structure |
| Pattern scoring | Legacy provider | Shadow comparison only |
| Fixed coaching templates | Legacy provider/retire | Not v3 final authority |
| Product-safe behavior mapper | Preserve/adapt | Useful fail-closed language/evidence lessons |
| Existing `/intelligence` routes | Preserve/adapt | Product and regression foundation |
| Existing Playwright journeys | Preserve/adapt | High-value migration and regression evidence |

### 5.4 Inventory acceptance

The inventory is accepted when:

- no major Trader Intelligence module is unclassified;
- every `preserve` item has an evidence basis;
- every `retire` item has a replacement and retirement condition;
- every route lists its current read model and future v3 read model;
- production demo/ephemeral paths are clearly marked;
- no old plan is treated as active architecture.

---

## 6. Workstream B — Architecture Decision Records

Create an ADR directory:

`src/docs/trader-intelligence-v3/adr/`

Use filenames:

`NNNN-short-decision-name.md`

Each ADR must include:

- status: proposed, accepted, superseded, or rejected;
- date;
- decision owners;
- context;
- constraints;
- considered options;
- decision;
- consequences;
- security/privacy impact;
- financial correctness impact;
- migration impact;
- test obligations;
- rollback or replacement path;
- unresolved questions.

### ADR-0001 — Shared identity and authorization context

Required decision:

- how the existing authenticated site user becomes a shared platform user;
- whether Academy and Trader Intelligence use one shared identity abstraction;
- internal stable user ID strategy;
- workspace membership and roles;
- trading-account authorization;
- application checks and PostgreSQL RLS;
- support/admin access audit;
- evidence-link authorization;
- background-job tenant context.

Recommended direction:

- create a shared platform-user abstraction backed initially by the existing authenticated user;
- do not use Discord ID as the primary domain key;
- create a server-derived `TraderIntelligenceAuthorizationContext`;
- require it in every v3 repository and tool call;
- use RLS as defense in depth.

Must explicitly reject:

- trusting workspace IDs from query/body data;
- global demo user/account constants in production;
- cache keys without tenant scope.

### ADR-0002 — Exact decimal and rounding policy

Required decision:

- application decimal library;
- canonical serialized decimal format;
- PostgreSQL exact numeric types;
- SQLite test representation;
- precision limits for price, money, quantity, fees, percentages, and FX;
- intermediate and display rounding;
- reconciliation tolerance;
- overflow and invalid-decimal behavior.

Required outcome:

- domain wrappers prevent direct financial use of JavaScript `number`;
- serialized contracts use decimal strings;
- exact reference tests exist.

### ADR-0003 — Analytical P/L and reconstruction policy

Required decision:

- distinction between broker-reported, analytical, cash, and tax P/L;
- average-cost versus FIFO treatment;
- entry/exit fee allocation;
- partial fills;
- broker average-fill rows;
- short sales and buy-to-cover;
- position reversals;
- prior inventory outside the imported period;
- open positions;
- corporate actions;
- symbol changes;
- user grouping corrections;
- per-currency reporting;
- reconstruction and policy versioning.

Required outcome:

- no tool can calculate P/L without a declared policy version;
- tax P/L is explicitly out of scope;
- uncertain prior inventory fails to `needs_review` rather than being guessed.

### ADR-0004 — Production database and migration framework

Required decision:

- Neon PostgreSQL as production authority or documented alternative;
- migration library and naming policy;
- transactional boundaries;
- repository interfaces;
- SQLite contract-test adapter;
- RLS;
- backups and point-in-time recovery;
- migration mapping tables;
- shadow/backfill/cutover strategy;
- no long-lived dual-write.

Required outcome:

- production code never falls back to temporary SQLite;
- one authoritative write path exists at cutover;
- repository contract suite runs against SQLite and PostgreSQL.

### ADR-0005 — Raw broker file storage and ingestion

Required decision:

- object-storage provider;
- signed upload flow;
- encryption;
- maximum bytes/rows/columns;
- MIME/content validation;
- streaming/bounded-memory parsing;
- checksum and immutable metadata;
- raw-file retention;
- deletion/export;
- logging/redaction;
- sanitized AI mapping samples;
- malware/content scanning policy if required.

Required outcome:

- production large files do not depend on embedding full CSV text in JSON;
- retries are idempotent;
- raw broker files never appear in normal logs or model prompts.

### ADR-0006 — Durable workflows and transactional outbox

Required decision:

- provider-independent job interface;
- transactional outbox schema;
- workflow/queue provider;
- idempotency key design;
- retry and terminal-failure policy;
- cancellation;
- deletion awareness;
- job progress;
- observability;
- local/test fake;
- provider replacement path.

Required spike:

- evaluate Vercel Workflow against at least one alternative appropriate for the application;
- confirm crash/deploy durability, cost, API maturity, local testing, tenant context, and migration risk;
- keep provider APIs outside financial domain modules.

Required outcome:

- critical enrichment and report work is not guaranteed only by a web-request lifecycle.

### ADR-0007 — Instrument identity and market-data price basis

Required decision:

- internal instrument identity;
- symbol/exchange/currency history;
- provider IDs;
- corporate-action references;
- raw versus adjusted basis;
- provider revisions and snapshot hashes;
- exchange calendar and timezone;
- incomplete-bar policy;
- basis mismatch behavior;
- delisted and changed symbols.

Required outcome:

- chart-derived features fail closed to execution-only when execution and candle basis do not align.

### ADR-0008 — MVP asset, broker, direction, and currency scope

Required decision:

- U.S.-listed equity scope;
- strongest calibration for IBKR and Moomoo;
- generic mapped fallback policy;
- status of Webull, Robinhood, and Schwab adapters;
- options quarantine;
- valid short execution support versus short coaching gate;
- sell-starting/prior inventory handling;
- per-currency reports;
- conditions for adding FX conversion;
- no live signals/execution/tax reporting.

Recommended direction:

- preserve long and short ledger facts;
- show reconciled generic lifecycle/P&L facts for both directions;
- keep short-specific setup/coaching conclusions off until calibrated;
- report currencies separately.

### ADR-0009 — Statistical evidence and simulation policy

Required decision:

- analytical unit by tool;
- independent cluster unit;
- direct analysis versus discovery;
- minimum observation and cluster counts;
- outlier policy;
- clustered bootstrap or alternative;
- multiple-comparison control;
- chronological holdout;
- prospective rule validation;
- target leakage rules;
- simulation intervention policy;
- same-bar ambiguity;
- fill/slippage/liquidity assumptions.

Required outcome:

- tools cannot convert a large trade count from one unusual session into high confidence;
- optimized historical rules are not labeled validated.

### ADR-0010 — AI provider, privacy, grounding, and cost policy

This ADR may remain proposed until Phase 5, but Gate 0 must define its decision criteria.

Required topics:

- provider interface;
- allowed data sent to models;
- retention/training settings;
- redaction;
- model allowlist;
- claim/evidence validator;
- prompt injection boundary;
- quota reservation;
- cost caps;
- recorded CI evaluation;
- scheduled live-model evaluation;
- canary and rollback.

Gate 0 outcome:

- no provider is wired yet;
- later implementation cannot bypass the policy.

---

## 7. Workstream C — V3 Module Boundary

Create:

```text
src/lib/trader-intelligence-v3/
  contracts/
  domain/
  repositories/
  adapters/
  analytics/
  simulations/
  evidence/
  usage/
  testing/
  index.ts
```

Do not copy entire legacy modules into this tree.

The new boundary begins with contracts and read-only adapters. Legacy code remains in place until a specific migration step proves moving or replacing it is useful.

### 7.1 Import-boundary rule

Allowed dependency direction in Gate 0:

```text
v3 contracts <- v3 domain/tools
v3 adapters -> legacy read models/types
legacy modules -X-> v3 implementation internals
routes -X-> v3 internals
```

- V3 may import legacy types only inside adapter modules.
- Core v3 contracts and analytics may not import route code, React, Next.js, SQLite drivers, Neon drivers, AI SDKs, candle providers, or `levels-system-v2`.
- No legacy route imports a v3 module in Gate 0.

Add an architecture-boundary test or lint rule that fails on forbidden imports.

---

## 8. Initial Contracts

### 8.1 Authorization context

File:

`src/lib/trader-intelligence-v3/contracts/authorization-context.ts`

Minimum shape:

```ts
export interface TraderIntelligenceAuthorizationContextV1 {
  contractVersion: "trader_intelligence_authorization_context_v1";
  userId: string;
  workspaceId: string;
  permittedAccountIds: readonly string[];
  role: "owner" | "member" | "admin" | "support";
  entitlementKeys: readonly string[];
  requestId: string;
}
```

Gate 0 uses test constructors only. It does not implement production session resolution.

### 8.2 Decimal values

File:

`src/lib/trader-intelligence-v3/contracts/decimal-values.ts`

Minimum concepts:

- branded decimal string;
- currency code;
- money amount;
- price amount;
- share quantity;
- percentage/rate;
- constructors/validators;
- no implicit conversion to `number` for authoritative calculations.

The final implementation follows ADR-0002.

### 8.3 Dataset version

File:

`src/lib/trader-intelligence-v3/contracts/dataset-version.ts`

Minimum fields:

- workspace/account scope;
- accepted execution ledger version;
- correction cutoff;
- reconstruction policy version;
- market snapshot IDs;
- feature definition versions;
- setup taxonomy version when relevant;
- user-correction cutoff;
- created timestamp;
- stable fingerprint.

### 8.4 Canonical execution

File:

`src/lib/trader-intelligence-v3/contracts/canonical-execution.ts`

Minimum fields:

- execution ID;
- workspace/account;
- source import/file/row IDs;
- broker execution/order IDs when available;
- instrument identity or unresolved instrument state;
- symbol as traded;
- exchange/currency;
- timestamp in UTC plus source timezone metadata;
- side/action;
- exact quantity;
- exact price;
- fee components;
- accepted/corrected state;
- source fingerprint;
- created timestamp.

Gate 0 adapter may populate only fields supported by current saved data and must record limitations.

### 8.5 Analytical round trip

File:

`src/lib/trader-intelligence-v3/contracts/analytical-round-trip.ts`

Minimum fields:

- round-trip ID;
- workspace/account;
- instrument/symbol;
- direction;
- lifecycle state;
- execution IDs in order;
- opened/closed timestamps;
- session date and exchange timezone;
- exact gross/net P/L where known;
- currency;
- reconstruction policy version;
- reconciliation state;
- limitation codes;
- source legacy IDs for compatibility.

### 8.6 Analytics tool result

File:

`src/lib/trader-intelligence-v3/contracts/analytics-tool-result.ts`

Minimum fields:

```ts
interface AnalyticsToolResultV1<TData> {
  contractVersion: "analytics_tool_result_v1";
  runId: string;
  toolKey: string;
  toolVersion: string;
  status: "completed" | "insufficient_data" | "failed";
  datasetVersion: DatasetVersionV1;
  filters: Record<string, unknown>;
  data: TData | null;
  observationCount: number;
  independentClusterCount: number;
  comparisonObservationCount: number | null;
  comparisonClusterCount: number | null;
  evidenceIds: string[];
  counterexampleEvidenceIds: string[];
  limitationCodes: string[];
  generatedAt: string;
}
```

Use validated typed filters rather than arbitrary objects in the concrete tools.

### 8.7 Claim and evidence

Files:

- `src/lib/trader-intelligence-v3/contracts/analysis-claim.ts`
- `src/lib/trader-intelligence-v3/contracts/evidence-reference.ts`

Claims must be machine-readable and bind to evidence IDs, limitation IDs, and exact metric values.

Evidence references must include authorization scope and resolve through a repository interface rather than embedding route URLs in domain results.

### 8.8 Durable job envelope

File:

`src/lib/trader-intelligence-v3/contracts/durable-job.ts`

Define the provider-independent envelope and status machine. No real provider is called in Gate 0.

### 8.9 AI usage reservation

File:

`src/lib/trader-intelligence-v3/contracts/ai-usage-reservation.ts`

Define future atomic reservation and reconciliation shapes. Do not implement provider billing or a model call.

### 8.10 Contract exports

Create focused index files. Avoid one uncontrolled barrel that creates circular imports or exposes internal testing helpers to route code.

---

## 9. Repository Interfaces for the Internal Slice

Create minimal read interfaces only:

```text
src/lib/trader-intelligence-v3/repositories/
  round-trip-read-repository.ts
  evidence-read-repository.ts
  tool-run-repository.ts
```

Gate 0 implementation may provide:

- an in-memory repository for tests;
- a read-only adapter over current saved data.

It must not add a production write repository.

Every method requires `TraderIntelligenceAuthorizationContextV1`.

Example responsibilities:

- list authorized analytical round trips by account/date filters;
- resolve authorized evidence IDs;
- optionally record an in-memory tool run for test inspection.

Negative tests must prove unauthorized account IDs fail closed.

---

## 10. Read-Only Compatibility Adapter

Create:

`src/lib/trader-intelligence-v3/adapters/current-saved-trade-read-adapter.ts`

Responsibilities:

- read current saved execution trades through an injected legacy read interface;
- map only supported fields into `AnalyticalRoundTripV1`;
- preserve legacy saved-trade and import IDs;
- convert current numeric values through the selected exact-decimal boundary;
- record missing fee, currency, reconciliation, or lifecycle facts as limitations;
- never mutate legacy records;
- never infer missing prior inventory;
- never read directly from route globals;
- require authorization context.

Do not adapt current coaching labels or pattern scores into v3 conclusions.

### Adapter tests

Cover:

- authorized account;
- unauthorized account;
- closed long round trip;
- closed short round trip;
- open position excluded from closed-trade analytics but returned when requested;
- missing currency;
- missing fee detail;
- duplicate legacy ID;
- malformed legacy record;
- deterministic mapping fingerprint.

---

## 11. Independent Reference Financial Math

Create:

`src/lib/trader-intelligence-v3/testing/reference-financial-math.ts`

Purpose:

- provide a deliberately small, independent implementation used only by tests;
- compare production calculations against independently written exact math;
- reduce the risk that tests merely repeat the same bug as implementation code.

Rules:

- do not import the production calculation helpers;
- use the exact decimal implementation selected by ADR-0002 or an independently wrapped equivalent;
- support the fixtures needed for the first slice;
- include fees and direction signs;
- produce per-currency results;
- fail on missing required facts rather than guessing.

Use property-based tests where feasible and fixed deterministic seeds.

---

## 12. Synthetic Golden Fixture Set

Create public synthetic fixtures under:

`src/lib/trader-intelligence-v3/testing/fixtures/`

The fixture set must be invented and contain no private broker identifiers or copied customer data.

### Required fixture scenarios

1. **Simple long winner**
   - one entry;
   - one exit;
   - fees;
   - exact expected gross/net P/L.

2. **Partial long entries and exits**
   - multiple fills;
   - partial reductions;
   - exact quantity and fee allocation.

3. **Short position**
   - sell short;
   - buy to cover;
   - exact sign and fees.

4. **Position reversal**
   - close one direction;
   - open the opposite direction;
   - clear round-trip boundary.

5. **Open position**
   - not included in closed realized analytics;
   - visible as excluded limitation.

6. **Prior inventory unknown**
   - sell-starting record;
   - must become `needs_review` or excluded;
   - no invented entry price.

7. **Repeated same-day trades**
   - several round trips in one session;
   - proves observation count differs from independent day-session count.

8. **Consecutive-loss daily-stop scenario**
   - at least one day helped;
   - one day harmed;
   - one day unaffected;
   - exact expected removed trades and P/L.

9. **Outlier-dominated weekday**
   - total and median tell different stories;
   - outlier disclosure is required.

10. **Two currencies**
    - USD and CAD trades;
    - per-currency outputs;
    - consolidated total must be unavailable.

11. **Timezone/DST boundary**
    - UTC timestamps map to the correct exchange session date.

12. **Duplicate evidence IDs**
    - repository validation rejects ambiguity.

### Golden fixture contract

Each fixture declares:

- input executions/round trips;
- expected policy version;
- expected exact results;
- expected exclusions;
- expected limitations;
- expected evidence IDs;
- expected independent clusters.

---

## 13. Tool 1 — Performance by Weekday

Create:

`src/lib/trader-intelligence-v3/analytics/analyze-performance-by-weekday.ts`

### 13.1 Tool identity

- key: `analyze_performance_by_weekday`
- initial version: `1.0.0`
- analytical unit: closed analytical round trip
- default independent cluster: day session
- data requirement: execution-only reconciled or explicitly usable analytical round trips
- AI requirement: none

### 13.2 Typed inputs

Required:

- authorization context;
- account IDs constrained to authorized accounts;
- date range;
- base/reporting currency selection or per-currency mode;
- optional direction filter;
- optional setup filter only when setup data is explicitly supplied and versioned;
- optional market-session filter;
- explicit user question mode: direct comparison or exploratory overview.

### 13.3 Required calculations per weekday and currency

- observation count;
- independent day-session count;
- gross P/L;
- net P/L when fee data is complete;
- average P/L;
- median P/L;
- win rate;
- average winner;
- average loser;
- expectancy;
- profit factor when defined;
- dispersion;
- largest trade contribution;
- outlier-removed total/average/median;
- number of open/unreconciled/excluded trades;
- date coverage.

### 13.4 Friday question decomposition

The first tool version must support a direct Friday-versus-other-days comparison and may decompose by facts available in execution-only data:

- trade count;
- independent session count;
- trade sequence within day;
- time of day;
- direction;
- position size when available;
- after-loss sequence;
- outliers.

Setup and VWAP decomposition remain unavailable unless those versioned features exist.

The tool must explicitly list unavailable requested dimensions rather than pretending they were analyzed.

### 13.5 Confidence policy

Confidence must consider:

- observation count;
- independent session count;
- date coverage;
- outlier concentration;
- missing fees/currency;
- comparison balance;
- direct versus exploratory status.

No weekday may be called an edge or weakness solely because it has the largest total P/L.

### 13.6 Output

Return:

- typed weekday rows;
- direct Friday answer data when requested;
- comparison metrics;
- claim IDs;
- evidence IDs for representative losing/winning trades;
- counterexamples;
- limitations;
- dataset/tool versions.

No prose generated by an LLM.

### 13.7 Required tests

- exact weekday grouping in exchange timezone;
- Friday comparison;
- per-currency separation;
- one outlier dominates total;
- two Fridays with many trades produce limited cluster count;
- missing fees;
- no trades;
- one trade;
- authorized/unauthorized accounts;
- same inputs produce identical output and fingerprint;
- evidence IDs resolve.

---

## 14. Tool 2 — Stop After Consecutive Losses Simulation

Create:

`src/lib/trader-intelligence-v3/simulations/simulate-daily-stop-after-consecutive-losses.ts`

### 14.1 Tool identity

- key: `simulate_daily_stop_after_consecutive_losses`
- initial version: `1.0.0`
- analytical unit: chronological closed round trip within day session
- default independent cluster: day session
- data requirement: ordered, reconciled execution-only round trips
- AI requirement: none

### 14.2 Typed inputs

- authorization context;
- authorized account IDs;
- date range;
- consecutive loss limit, initial allowed range 1–5;
- loss definition policy;
- gross or net P/L basis;
- per-currency mode or explicit reporting currency when FX exists;
- direction/setup/session filters only when available and versioned.

### 14.3 Initial intervention policy

Version `daily_stop_intervention_v1`:

1. sort closed round trips by session date, first execution timestamp, then stable ID;
2. preserve all trades through and including the trade that reaches the configured consecutive-loss limit;
3. remove every later trade in that same day session;
4. do not invent replacement trades;
5. do not alter P/L of preserved trades;
6. remove fees associated only with removed trades;
7. reset consecutive-loss count at the next day session;
8. treat break-even trades according to the declared loss-definition policy;
9. exclude open/unreconciled trades and report them;
10. report each currency separately;
11. if position size depends on account equity in a future version, recompute sequentially; v1 does not claim to simulate that dependency.

### 14.4 Required output

- actual versus simulated gross/net P/L per currency;
- difference;
- actual versus simulated trade count;
- trades removed;
- days affected;
- days helped;
- days harmed;
- unaffected days;
- average and median day impact;
- largest day contribution;
- outlier-removed impact;
- observation and independent-day counts;
- evidence IDs for trigger and removed trades;
- limitations;
- intervention policy version;
- dataset/tool versions.

### 14.5 Language boundary

The deterministic result may expose structured labels such as:

- `historical_result_improved_under_assumptions`;
- `historical_result_worsened_under_assumptions`;
- `mixed_or_insufficient`.

It must not say the rule will improve future performance.

### 14.6 Required tests

- stop after one, two, and three losses;
- loss/win/break-even sequence;
- day helped;
- day harmed;
- day unaffected;
- no trigger;
- multiple currencies;
- open trade exclusion;
- same timestamp stable ordering;
- fee basis;
- outlier-dominated result;
- unauthorized account;
- deterministic output/fingerprint;
- evidence IDs resolve;
- exact match to independent reference math.

---

## 15. Evidence Repository and IDs

Gate 0 may use an in-memory evidence repository.

Evidence IDs should be opaque stable identifiers scoped to:

- workspace;
- account;
- dataset version;
- evidence type;
- source object ID.

Do not expose database sequential IDs as authorization.

Required evidence types:

- round trip;
- day session;
- simulation trigger;
- removed historical trade;
- comparison group snapshot.

The repository must:

- resolve only under the same authorization context;
- reject duplicate IDs;
- preserve source legacy IDs internally;
- return a domain reference, not a route URL;
- support later server-side link generation.

---

## 16. Statistical Helpers

Create only helpers needed by the two tools:

```text
src/lib/trader-intelligence-v3/analytics/statistics/
  exact-sum.ts
  mean.ts
  median.ts
  dispersion.ts
  win-rate.ts
  expectancy.ts
  profit-factor.ts
  outlier-contribution.ts
  cluster-summary.ts
```

Rules:

- financial aggregations use exact decimal types;
- statistical calculations that require approximation must document conversion and cannot alter authoritative totals;
- undefined values remain explicit null/undefined states;
- zero denominators do not become zero by default;
- no helper silently drops invalid observations;
- direct versus discovery mode is preserved;
- cluster count is always returned.

A more advanced bootstrap implementation may be deferred if Gate 0 reports confidence as limited, but the interface must allow later clustered intervals without breaking tool contracts.

---

## 17. Dataset Fingerprint and Reproducibility

For the internal slice, calculate a stable dataset fingerprint from:

- ordered round-trip IDs;
- source legacy IDs;
- exact P/L/currency values;
- lifecycle/reconciliation states;
- correction cutoff;
- reconstruction policy version;
- filters;
- tool version.

Requirements:

- same data and filters produce the same fingerprint;
- changed fee/P&L/policy/filter changes the fingerprint;
- the fingerprint contains no private account number;
- cache keys include authorization scope;
- output includes generated time separately so it does not destabilize the fingerprint.

---

## 18. Error and Limitation Taxonomy

Create shared v3 codes rather than free-form route strings.

Minimum limitation codes:

- `insufficient_observations`;
- `insufficient_independent_sessions`;
- `date_coverage_limited`;
- `fees_incomplete`;
- `currency_unknown`;
- `multiple_currencies_not_aggregated`;
- `open_trade_excluded`;
- `unreconciled_trade_excluded`;
- `prior_inventory_unknown`;
- `outlier_dominated`;
- `comparison_unbalanced`;
- `requested_feature_unavailable`;
- `legacy_adapter_incomplete`.

Minimum failure codes:

- `unauthorized_account`;
- `invalid_filter`;
- `invalid_decimal`;
- `duplicate_evidence_id`;
- `dataset_version_mismatch`;
- `repository_failure`;
- `calculation_invariant_failed`.

User-facing wording comes later. Gate 0 tests the codes and structured details.

---

## 19. V3 CI Gate

Add a path-aware workflow or extend the current CI so v3 changes require:

1. dependency install with lockfile;
2. TypeScript typecheck;
3. focused lint for changed v3 files;
4. v3 unit tests;
5. exact financial reference/differential tests;
6. deterministic property-based tests with reported seeds;
7. architecture-boundary test;
8. production build;
9. artifact upload on failure when useful.

Suggested commands, adjusted only after inspecting current scripts:

```text
npm ci
npx tsc --noEmit --pretty false
npx eslint src/lib/trader-intelligence-v3
npx vitest run src/lib/trader-intelligence-v3 --reporter=dot
npm run build:webpack
```

Do not add live-model calls to pull-request CI.

Do not remove existing Layer 2/Layer 3 checks yet; legacy production paths still depend on them until migration.

### CI acceptance

- a deliberate floating-point financial implementation fails tests or architecture checks;
- a forbidden v3 core import fails;
- an unauthorized repository test fails closed;
- changing a golden expected value causes a failure;
- build passes without adding a public route;
- CI duration remains reasonable and deterministic.

---

## 20. Review and Verification Ladder

### Step 1 — Documentation and ADR review

Verify:

- all ADRs exist;
- decisions do not conflict;
- unresolved questions are explicit;
- security, financial, migration, and test impacts are included.

### Step 2 — Contract review

Verify:

- contracts are versioned;
- decimal strings validate;
- no route/framework/database imports;
- authorization context is required;
- dataset version is complete enough for the slice;
- limitation/failure states are explicit.

### Step 3 — Adapter review

Verify:

- read-only;
- tenant-scoped;
- deterministic;
- limitations preserved;
- no coaching labels imported;
- no guessed prior inventory.

### Step 4 — Financial review

Verify:

- exact totals;
- independent reference agreement;
- fee signs;
- short signs;
- reversals;
- per-currency separation;
- no implicit rounding.

### Step 5 — Analytics review

Verify:

- weekday/session timezone;
- observation versus cluster count;
- Friday comparison;
- outlier disclosure;
- missing dimensions disclosed;
- evidence resolution.

### Step 6 — Simulation review

Verify:

- intervention policy followed exactly;
- trigger trade preserved;
- later trades removed;
- no invented trade;
- fees handled;
- day helped/harmed evidence;
- no future-performance claim.

### Step 7 — Architecture and regression review

Verify:

- no existing route behaviour changed;
- no production write path added;
- no AI/provider package required;
- no S/R or candle dependency;
- legacy tests remain green;
- v3 CI is green.

---

## 21. File-Level Delivery Map

The implementation run should produce a coherent set similar to:

```text
src/docs/trader-intelligence-v3-current-system-inventory-2026-07-17.md
src/docs/trader-intelligence-v3/adr/0001-shared-identity-and-authorization.md
src/docs/trader-intelligence-v3/adr/0002-exact-decimals-and-rounding.md
src/docs/trader-intelligence-v3/adr/0003-analytical-pnl-and-reconstruction.md
src/docs/trader-intelligence-v3/adr/0004-production-database-and-migration.md
src/docs/trader-intelligence-v3/adr/0005-raw-file-storage-and-ingestion.md
src/docs/trader-intelligence-v3/adr/0006-durable-workflows-and-outbox.md
src/docs/trader-intelligence-v3/adr/0007-instrument-identity-and-price-basis.md
src/docs/trader-intelligence-v3/adr/0008-mvp-scope.md
src/docs/trader-intelligence-v3/adr/0009-statistics-and-simulation-policy.md
src/docs/trader-intelligence-v3/adr/0010-ai-provider-privacy-grounding-cost.md
src/lib/trader-intelligence-v3/contracts/authorization-context.ts
src/lib/trader-intelligence-v3/contracts/decimal-values.ts
src/lib/trader-intelligence-v3/contracts/dataset-version.ts
src/lib/trader-intelligence-v3/contracts/canonical-execution.ts
src/lib/trader-intelligence-v3/contracts/analytical-round-trip.ts
src/lib/trader-intelligence-v3/contracts/analytics-tool-result.ts
src/lib/trader-intelligence-v3/contracts/analysis-claim.ts
src/lib/trader-intelligence-v3/contracts/evidence-reference.ts
src/lib/trader-intelligence-v3/contracts/durable-job.ts
src/lib/trader-intelligence-v3/contracts/ai-usage-reservation.ts
src/lib/trader-intelligence-v3/repositories/round-trip-read-repository.ts
src/lib/trader-intelligence-v3/repositories/evidence-read-repository.ts
src/lib/trader-intelligence-v3/adapters/current-saved-trade-read-adapter.ts
src/lib/trader-intelligence-v3/analytics/analyze-performance-by-weekday.ts
src/lib/trader-intelligence-v3/analytics/statistics/*
src/lib/trader-intelligence-v3/simulations/simulate-daily-stop-after-consecutive-losses.ts
src/lib/trader-intelligence-v3/testing/reference-financial-math.ts
src/lib/trader-intelligence-v3/testing/fixtures/*
src/lib/trader-intelligence-v3/**/__tests__/*
.github/workflows/trader-intelligence-v3.yml
```

Exact filenames may change through review, but responsibility boundaries may not be blurred to reduce file count.

---

## 22. Implementation Sequence

### Batch 1 — Inventory and accepted ADRs

- inspect current modules;
- create inventory;
- write ADRs 0001–0009;
- define decision owners and accepted choices;
- leave ADR-0010 proposed with explicit criteria;
- review contradictions before code.

Exit condition:

- no P0 architectural default remains hidden in code.

### Batch 2 — Contracts and boundary tests

- create v3 directory;
- implement versioned contracts;
- implement exact decimal validation/wrappers;
- create architecture-boundary test;
- add focused unit tests.

Exit condition:

- contracts compile and forbidden dependencies fail.

### Batch 3 — Read repositories, adapter, and fixtures

- implement in-memory authorized repository;
- implement read-only current-data adapter;
- create synthetic golden fixtures;
- create evidence repository;
- test tenant isolation and deterministic mapping.

Exit condition:

- authorized current saved trades can become v3 analytical round trips without mutation.

### Batch 4 — Financial reference and statistical helpers

- implement independent reference math;
- implement exact aggregations;
- implement first statistical helpers;
- run fixed and property-based tests.

Exit condition:

- implementation and independent reference agree for all fixtures.

### Batch 5 — Weekday analytics

- implement typed filters;
- calculate per-currency weekday metrics;
- calculate direct Friday comparison;
- add outlier and cluster diagnostics;
- add evidence claims;
- test.

Exit condition:

- structured output answers the supported question without prose or AI.

### Batch 6 — Daily-stop simulation

- implement policy v1;
- calculate actual/simulated outputs;
- link trigger and removed-trade evidence;
- add limitations/outlier checks;
- test.

Exit condition:

- exact results match golden and independent reference calculations.

### Batch 7 — CI and full regression

- add v3 workflow;
- run focused tests, typecheck, lint, build;
- run relevant legacy tests;
- fix only concrete regressions;
- update project log and gate status.

Exit condition:

- green CI and no public runtime change.

---

## 23. Branch and Pull Request Policy

Do not implement this plan directly in the documentation PR unless the user explicitly asks to combine planning and code.

Recommended flow:

1. merge or approve the documentation-only architecture PR;
2. create a clean branch from current `main`, such as:
   - `agent/trader-intelligence-v3-gate-0-foundation`;
3. implement Gate 0 in coherent batches;
4. commit intentionally by architecture slice;
5. open a draft PR;
6. keep it draft until ADRs, tests, and CI pass;
7. do not deploy;
8. do not merge with unresolved P0 findings.

Preserve unrelated work in the repository.

---

## 24. Required Pull Request Description for the Coding Run

The coding PR must explain:

- what v3 boundary was created;
- which ADRs were accepted;
- exact decimal and analytical P/L choices;
- how tenant scope is represented;
- what current data is adapted read-only;
- exact weekday and daily-stop policies;
- synthetic fixture coverage;
- property/differential test strategy;
- architecture boundaries;
- why there is no AI/public route/production write;
- verification commands and results;
- remaining blockers for Phase 1.

---

## 25. Stop Conditions

Stop the implementation run and escalate only for a decision that materially changes:

- shared identity;
- authoritative financial accounting;
- production database authority;
- raw-file retention/legal obligations;
- selected durable workflow provider;
- product direction/currency scope;
- destructive migration;
- production deployment.

Do not stop for routine naming, test organization, or internal refactoring choices when this plan provides a safe default.

If one ADR is blocked, continue independent inventory, contract-test design, synthetic fixtures, and non-dependent documentation, but do not hide the blocked decision behind a temporary production default.

---

## 26. Gate 0 Acceptance Checklist

### Governance

- [ ] V3 plan chain is active.
- [ ] Current-system inventory is complete.
- [ ] Legacy active plans are marked historical in the index.
- [ ] ADRs 0001–0009 are accepted.
- [ ] ADR-0010 has explicit future criteria.

### Identity and privacy

- [ ] Authorization context contract exists.
- [ ] Repository methods require it.
- [ ] Unauthorized account tests fail closed.
- [ ] No production demo-ID path is introduced.
- [ ] Raw private data is absent from fixtures/logs.

### Financial correctness

- [ ] Exact decimal policy is implemented.
- [ ] Analytical P/L policy is versioned.
- [ ] Independent reference math exists.
- [ ] Long, short, partial, reversal, fee, prior-inventory, and open cases are tested.
- [ ] Multiple currencies remain separate.

### Reproducibility

- [ ] Dataset version contract exists.
- [ ] Stable fingerprint tests pass.
- [ ] Changed fee/policy/filter changes fingerprint.
- [ ] Tool and policy versions appear in results.

### Analytics and simulation

- [ ] Weekday tool passes golden tests.
- [ ] Friday direct comparison works.
- [ ] Observation and independent session counts differ correctly.
- [ ] Outlier-dominated result is disclosed.
- [ ] Daily-stop simulation follows intervention v1.
- [ ] Days helped/harmed/unaffected are correct.
- [ ] Evidence IDs resolve.
- [ ] No future-performance claim is generated.

### Architecture

- [ ] V3 core has no framework/database/AI/level-engine dependency.
- [ ] Legacy adapter is isolated and read-only.
- [ ] No route imports v3 in Gate 0.
- [ ] No production database write exists.
- [ ] No AI provider call exists.
- [ ] No new support/resistance detector exists.

### Verification

- [ ] Focused lint passes.
- [ ] Typecheck passes.
- [ ] V3 Vitest suite passes.
- [ ] Property/differential tests pass with deterministic seeds.
- [ ] Architecture-boundary test passes.
- [ ] Production build passes.
- [ ] Relevant legacy tests remain green.
- [ ] V3 project log is updated.

---

## 27. Gate 0 Exit Report

At completion, publish a short internal report containing:

- accepted ADR list;
- inventory classification counts;
- exact decimal and P/L policy summary;
- contract list;
- fixture/test counts;
- weekday tool result example using synthetic data;
- daily-stop simulation example using synthetic data;
- all verification commands and results;
- known limitations;
- Phase 1 blockers;
- recommendation to proceed, revise, or stop.

Do not say v3 is production-ready. Gate 0 proves only that the architecture can support trustworthy deterministic tools.

---

## 28. Final Directive for This Run

The engineering priority is not visible AI. It is establishing a foundation that makes incorrect AI answers difficult to produce.

The first code must prove:

- tenant scope is explicit;
- money is exact;
- policies are versioned;
- evidence resolves;
- statistics admit uncertainty;
- simulations disclose interventions;
- current data can be adapted without mutation;
- no public behaviour changes prematurely.

After those facts are true, Phase 1 can build the production identity, PostgreSQL, ingestion, and durable-job substrate. AI remains later by design.
