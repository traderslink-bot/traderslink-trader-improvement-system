# Trader Intelligence v3 GA0-A Control and Exact Truth Implementation Plan

**Date:** 2026-07-17 America/Toronto  
**Status:** Active file-level implementation plan  
**Architecture authority:** `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`  
**QA authority:** fourth-pass operational-integrity review plus prior reviews as rationale  
**Operating profile:** `private_owner_alpha`  
**Hosting mode:** must be explicitly `local_only` or `private_hosted`  
**Runtime model calls:** forbidden  
**Support/resistance consumption:** forbidden  
**Production deployment:** forbidden

---

# 1. Purpose

GA0-A establishes the controls required before v3 reads real owner data as trusted analytical truth.

GA0-A does not build the first user-facing analytics tools. It creates the boundaries that make those tools safe to implement in GA0-B.

GA0-A proves:

- the application knows whether it is local-only or privately hosted;
- private-hosted routes cannot be anonymous;
- source content has canonical cryptographic identity;
- financial quantities use exact decimal representations;
- accepted executions have deterministic identity and ordering;
- duplicate, correction, and collision states are explicit;
- factual inventory cannot be changed by a review action;
- temporal meaning and corrections are immutable and replayable;
- datasets are content-addressed and coverage-aware;
- analysis eligibility is per capability;
- one analysis run reads one immutable snapshot;
- evidence references remain stable across persistence migrations;
- runtime payloads are validated;
- private data cannot enter Git or normal logs.

---

# 2. Authority and Relationship to Older Plans

Read in this order:

1. `plan.md`
2. `src/docs/trader-intelligence-v3-project-log.md`
3. `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`
4. this plan
5. detailed QA reviews only for rationale
6. legacy plans only for preserved implementation evidence

This plan supersedes the file-level execution scope in:

`src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`

The older Gate 0 plan remains an umbrella and historical planning artifact. Its weekday analytics and daily-stop simulation work now belongs to GA0-B.

---

# 3. Delivery Shape

GA0-A is delivered in three focused, sequential PRs.

## GA0-A1 — Containment and Architecture Boundaries

Recommended branch:

`agent/trader-intelligence-v3-ga0-a1-containment`

## GA0-A2 — Canonical Execution and Exact Financial Truth

Recommended branch:

`agent/trader-intelligence-v3-ga0-a2-exact-truth`

Start only after GA0-A1 is merged or explicitly accepted.

## GA0-A3 — Temporal, Manifest, and Eligibility Truth

Recommended branch:

`agent/trader-intelligence-v3-ga0-a3-manifests`

Start only after GA0-A2 is merged or explicitly accepted.

GA0-B begins only after GA0-A1, GA0-A2, and GA0-A3 acceptance criteria pass.

Do not combine all three into one giant PR.

---

# 4. Global Non-Goals

GA0-A must not add:

- an AI provider call;
- an Ask AI route;
- prompt engineering;
- weekday analytics;
- daily-stop simulation;
- market-candle enrichment;
- support/resistance consumption;
- a second level detector;
- setup classification;
- behavioral coaching;
- Rule Lab;
- reports;
- unrestricted SQL;
- vector search or embeddings;
- live broker connections;
- live trade alerts;
- order execution;
- tax accounting;
- portfolio allocation;
- a `/coach` redesign;
- production deployment.

The only permitted existing-route behavior change in GA0-A1 is private-access containment or fail-closed disabling required to protect real owner data.

---

# 5. GA0-A1 — Containment and Architecture Boundaries

## 5.1 Objectives

- declare deployment and hosting mode;
- prevent accidental anonymous hosted access;
- classify current modules;
- create the v3 internal boundary;
- prevent forbidden dependencies;
- add private-data repository guards;
- record legacy compatibility hazards.

## 5.2 Architecture inventory

Create or update:

`src/docs/trader-intelligence-v3-current-system-inventory-2026-07-17.md`

Minimum fields for every major module:

- path;
- responsibility;
- consumers;
- current source-of-truth role;
- persistence behavior;
- private-data exposure;
- production-readiness state;
- v3 classification;
- adapter/migration requirement;
- retirement condition;
- relevant tests.

Classifications:

- `preserve`;
- `adapt`;
- `legacy_provider`;
- `retire`;
- `out_of_scope`.

Minimum scope:

- execution CSV parser and broker adapters;
- import fingerprints;
- import planner;
- SQLite repository;
- import/trade API routes;
- Intelligence route layout and pages;
- raw timeline;
- execution feedback;
- saved trades, ticker stories, and sessions;
- level-analysis and support/resistance adapters;
- pattern/scoring/behavior/coaching stack;
- authentication/session path;
- CI and tests;
- private calibration scripts.

## 5.3 Deployment contracts

Add a v3 contract equivalent to:

```ts
export type TraderIntelligenceDeploymentProfile =
  | "private_owner_alpha"
  | "private_invited_alpha"
  | "public_beta"
  | "public_production";

export type TraderIntelligenceHostingMode =
  | "local_only"
  | "private_hosted";
```

Add a resolved configuration contract containing:

- deployment profile;
- hosting mode;
- enabled state;
- owner-auth-required state;
- data directory/storage mode;
- whether real data is permitted;
- whether mutations are permitted;
- configuration source;
- validation errors.

## 5.4 Fail-closed configuration rules

- `local_only` rejects a known hosted/public deployment environment;
- `private_hosted` rejects missing owner authentication configuration;
- public/invited profiles reject demo identity and local SQLite authority;
- invalid configuration disables all Intelligence data reads and writes;
- disabled state is explicit and testable;
- no real broker data is permitted when the profile is unresolved.

## 5.5 Private route containment

If current testing is `local_only`:

- prove local-only startup constraints;
- do not place real data on a public deployment;
- hosted routes may remain synthetic-only until private-hosted auth exists.

If current testing is `private_hosted`:

- protect `/intelligence/**` pages;
- protect all Trader Intelligence APIs;
- derive owner identity server-side;
- deny anonymous access;
- disable shared caching of private responses;
- audit mutations;
- add negative route tests.

The route guard must be reusable by future v3 routes.

## 5.6 V3 directory boundary

Create the minimal directory:

```text
src/lib/trader-intelligence-v3/
  deployment/
  authorization/
  contracts/
  domain/
  testing/
```

Do not copy the legacy analysis implementation into this directory.

## 5.7 Architecture boundary rules

Initial v3 domain code must not import:

- `next/*`;
- React;
- route modules;
- SQLite or Neon drivers;
- OpenAI/model providers;
- `levels-system-v2`;
- live-watchlist directional code;
- route-specific UI copy.

Allowed dependencies:

- standard runtime primitives;
- explicitly accepted exact/canonicalization libraries after ADR;
- v3 contracts/domain helpers;
- test-only dependencies in test files.

Add an automated architecture-boundary test or script.

## 5.8 Private-data repository guards

Add checks for:

- broker CSV filename patterns;
- likely account-number patterns;
- private calibration directories;
- `.sqlite`, `.sqlite-wal`, `.sqlite-shm`, and backup files;
- raw API/model payload dumps;
- screenshots containing account IDs where detectable;
- known private fixture naming conventions.

Required ignored paths include an explicit private calibration directory outside tracked fixtures.

False positives must be reviewable, but the guard fails closed by default in CI.

## 5.9 Legacy hazard register

GA0-A1 inventory must explicitly flag:

- unauthenticated/demo-ID route patterns;
- temporary production SQLite fallback;
- legacy 32-bit fingerprints;
- JavaScript-number financial fields;
- random/time-derived record IDs;
- user lifecycle override mutating apparent closure;
- JSON blob persistence;
- request-lifecycle critical jobs;
- route-local repository construction;
- current coaching as legacy final authority.

## 5.10 GA0-A1 tests

- valid `local_only` configuration passes locally;
- local-only rejects hosted environment simulation;
- private-hosted rejects missing owner auth;
- disabled mode reads/writes no private data;
- demo identity cannot satisfy public/invited profile;
- architecture dependency guard catches prohibited imports;
- private-data guard catches representative safe synthetic violations;
- existing legacy tests remain unchanged and green.

## 5.11 GA0-A1 acceptance

- configuration is explicit and fail closed;
- real hosted data cannot be used anonymously;
- inventory covers all major modules;
- v3 boundary exists without legacy implementation copy;
- dependency guard exists;
- private-data guard exists;
- no analytics tool or AI call exists;
- no support/resistance code exists in v3;
- no deployment occurs.

---

# 6. GA0-A2 — Canonical Execution and Exact Financial Truth

## 6.1 Objectives

- select and wrap exact decimal arithmetic;
- define canonical serialization;
- replace legacy fingerprint authority;
- define execution identity and ordering;
- define duplicate/correction states;
- define analytical P/L and reconstruction policy;
- implement independent exact reference math;
- create exact synthetic fixtures.

## 6.2 ADRs

Create accepted ADRs for:

1. exact decimal library and rounding;
2. canonical serialization and cryptographic hashing;
3. canonical execution identity and ordering;
4. duplicate/correction resolution;
5. analytical P/L and reconstruction policy.

Each ADR includes:

- options considered;
- selected approach;
- rejected alternatives;
- consequences;
- migration impact;
- security/privacy impact;
- tests;
- rollback/replacement path.

## 6.3 Exact decimal domain types

Create wrappers equivalent in responsibility to:

- `DecimalString`;
- `MoneyAmount`;
- `PriceAmount`;
- `ShareQuantity`;
- `FeeAmount`;
- `PercentRatio`;
- `FxRate`.

Rules:

- no `number` financial authority;
- decimal strings validated and normalized;
- no exponent notation in canonical serialization unless explicitly selected;
- signed zero normalized;
- invalid, non-finite, overflow, and precision-exceeding values rejected;
- display rounding separate from calculation rounding;
- currency required for money/price/P&L;
- quantity precision explicit.

## 6.4 Canonical serialization

Define:

- UTF-8;
- Unicode normalization;
- key ordering;
- array ordering;
- decimal normalization;
- timestamp normalization;
- null/omitted behavior;
- enum casing;
- duplicate-key rejection;
- schema-version inclusion;
- forbidden volatile fields.

Implement canonical serialization behind a v3 interface.

## 6.5 Cryptographic digests

Use an accepted cryptographic digest through a v3 helper.

Every digest declares:

- algorithm;
- canonicalization version;
- domain prefix;
- digest.

Legacy `broker_csv_file_v1` and `trade_request_v1` fingerprints remain migration metadata only.

Do not use the legacy 32-bit value as a uniqueness authority.

## 6.6 Canonical execution contract

Fields include at least:

- canonical execution ID;
- broker/account/source identity;
- original source file and row reference;
- broker execution ID;
- order ID;
- source sequence/index;
- raw broker symbol;
- resolved instrument ID when available;
- source timestamp;
- normalized UTC timestamp;
- source timestamp precision;
- side/action;
- exact signed/unsigned quantity policy;
- exact price;
- exact fees/commission;
- currency;
- source status;
- correction state;
- source-content digest;
- schema version.

## 6.7 Deterministic execution ordering

Define total ordering and ambiguity states.

Tests include:

- same timestamp and different broker execution IDs;
- same timestamp and same price/quantity legitimate repeated fills;
- absent execution index;
- source precision only to seconds;
- average-fill row versus individual fills;
- reversal at same timestamp;
- file reordering.

No meaningful trade sequence is inferred when source data cannot establish it.

## 6.8 Duplicate/correction states

Implement contracts for:

- exact same-source duplicate;
- reexported same execution;
- possible ambiguous duplicate;
- legitimate repeated fill;
- correction/bust;
- fee correction;
- hash collision;
- manual review.

Rules:

- preserve ambiguous rows;
- compare canonical content after digest match;
- never suppress on digest alone;
- corrections append events;
- dataset manifest includes duplicate/correction decisions.

## 6.9 Analytical P/L policy

Define and version:

- broker-reported versus analytical versus cash versus tax P/L;
- selected average-cost/FIFO analytical approach;
- partial fills;
- fee allocation and sign;
- rebates/negative fees;
- short sales and covers;
- reversals;
- prior inventory;
- open inventory;
- average-fill exports;
- symbol changes and corporate actions;
- user grouping corrections;
- per-currency output;
- reconciliation tolerance.

Unknown prior inventory never becomes a synthetic closed trade.

## 6.10 Reference math

Implement an independent reference calculation path that does not call the production reconstruction helpers.

The reference path may be slower and test-only.

It must produce exact expected results for:

- one buy/one sell;
- partial entries;
- partial exits;
- fees;
- fee rebate;
- short/cover;
- reversal;
- open position;
- prior inventory unknown;
- fractional shares;
- sub-dollar four-or-more-decimal prices;
- multiple currencies kept separate.

At least some fixtures should have manually documented calculations so both implementations are not trusted merely because they agree.

## 6.11 GA0-A2 tests

- canonicalization cross-order tests;
- digest stability across process/platform;
- meaningful-field digest-change tests;
- no random/database ID in digest;
- legacy fingerprint collision simulation does not affect v3 identity;
- exact decimal arithmetic;
- property tests for inventory conservation;
- differential tests against reference math;
- same-timestamp ordering ambiguity;
- duplicate/collision behavior;
- all fixtures use synthetic data.

## 6.12 GA0-A2 acceptance

- exact decimal ADR accepted;
- canonicalization/hash ADR accepted;
- execution identity/order ADR accepted;
- P/L policy accepted;
- legacy fingerprints are compatibility-only;
- exact reference math passes;
- duplicate/correction states pass tests;
- no analytics tool exists;
- no model call exists;
- no route/UI feature added;
- no deployment occurs.

---

# 7. GA0-A3 — Temporal, Manifest, and Eligibility Truth

## 7.1 Objectives

- define immutable correction/time semantics;
- separate factual lifecycle from user review state;
- enforce retrospective/open-position boundaries;
- create content-addressed manifests;
- create coverage and capability eligibility;
- define immutable analysis snapshots;
- create stable evidence references;
- add runtime validation contracts;
- define stale/invalidation behavior.

## 7.2 Temporal contract

Define:

- source/effective time;
- first-public time;
- observed/retrieved time;
- recorded time;
- corrected time;
- superseded time;
- validity interval;
- transaction interval;
- analysis cutoff.

Apply to:

- executions;
- correction events;
- instrument mappings;
- corporate actions;
- external events;
- user intent;
- setup labels;
- rules;
- source corrections.

## 7.3 Correction event contract

Correction events are immutable.

Required event types include:

- execution correction;
- execution bust/cancel;
- fee correction;
- instrument resolution correction;
- timestamp/timezone correction;
- grouping correction;
- source-event correction;
- user-intent correction;
- data deletion/tombstone.

Current read models resolve events at a declared cutoff.

## 7.4 Position state versus review disposition

Create separate contracts.

Factual position state is execution/correction-derived.

User review disposition cannot change inventory or create a closing fill.

Legacy `userLifecycleOverride` becomes an annotation and source-coverage limitation.

## 7.5 Open-position and retrospective contract

Define:

- closed historical trade;
- same-day closed trade;
- open execution review;
- prior-inventory unknown;
- correction pending;
- not eligible for closed-trade coaching.

Rules:

- realized closed-trade tools exclude open/incomplete positions;
- every result declares cutoff;
- no live hold/sell/target language;
- current quotes cannot create directional journal output.

## 7.6 Dataset manifest

Content-addressed manifest includes:

- canonical accepted execution identities;
- correction events;
- duplicate decisions;
- accounts;
- import/file source identities;
- reconstruction policy;
- session policy;
- instrument policy;
- currency policy;
- coverage state;
- open/prior-inventory limitations;
- schema/canonicalization/hash versions.

Hash input excludes database IDs and wall-clock creation metadata.

## 7.7 Coverage contract

Include:

- statement periods;
- coverage start/end;
- gaps;
- overlaps;
- accounts not represented;
- rejected/skipped/quarantined rows;
- prior inventory;
- open positions;
- currencies;
- confidence/unknown state.

Broad-answer language derives from coverage state.

## 7.8 Analysis eligibility

Create machine-readable eligibility per capability:

- execution;
- P/L;
- sequence;
- candles;
- VWAP;
- MFE/MAE;
- halts;
- quotes;
- slippage;
- float;
- catalysts;
- levels;
- simulations.

Each eligibility result includes:

- status;
- stable reason codes;
- limitations;
- source snapshot IDs;
- policy version.

## 7.9 Immutable analysis snapshot

Define an analysis-run snapshot containing:

- dataset manifest;
- coverage manifest;
- correction cutoff;
- policy versions;
- eligibility snapshot;
- enrichment manifests;
- user-intent/rule cutoff;
- analysis cutoff.

All future tool calls in one run must share this snapshot.

## 7.10 Stable evidence reference

Define manifest-scoped references for:

- execution;
- round trip;
- position lifecycle;
- ticker story;
- day session;
- metric snapshot;
- source event;
- limitation/exclusion.

Resolution outcomes:

- current;
- superseded with replacement;
- stale;
- deleted/unavailable;
- unauthorized;
- unresolved.

## 7.11 Runtime validation

Provide provider-independent runtime validators or validation interfaces for:

- canonical execution;
- correction event;
- dataset/coverage manifest;
- eligibility result;
- analysis snapshot;
- evidence reference.

Reject:

- duplicate object keys;
- invalid decimal strings;
- missing currency;
- invalid timestamp order;
- unsupported schema version;
- unknown eligibility code in strict mode;
- inconsistent hash/domain prefix;
- manifest digest mismatch.

## 7.12 Stale and invalidation states

Define:

- current;
- stale source corrected;
- stale policy changed;
- stale eligibility changed;
- superseded;
- blocked;
- failed retryable;
- failed terminal;
- deleted source.

Build a dependency contract sufficient for GA0-B tools to mark results stale.

Do not build a full public job system in GA0-A3.

## 7.13 Backup contract

For private SQLite/WAL use, document and test:

- consistent backup mechanism;
- encryption;
- integrity check;
- isolated restore;
- execution/manifest digest comparison;
- representative reference result comparison;
- restore-test record.

## 7.14 CSV hardening contract

GA0-A3 does not need to rewrite the parser, but must define blockers and tests for:

- duplicate normalized headers;
- canonical mapping collisions;
- malformed/unclosed quotes;
- inconsistent row widths;
- unsupported encoding;
- NUL/control characters;
- oversized cells;
- ambiguous delimiters;
- duplicate execution ID with conflicting content.

Mark parser changes as GA0-B or an earlier defect fix depending on severity discovered by tests.

## 7.15 GA0-A3 tests

- bitemporal correction replay;
- rule/note effective-time behavior;
- user review disposition cannot close inventory;
- open positions excluded from closed-trade eligibility;
- dataset digest stable across persistence IDs;
- coverage gaps change coverage state;
- eligibility reasons deterministic;
- analysis snapshot rejects mixed manifests;
- evidence IDs resolve after persistence-ID changes;
- stale dependency propagation;
- runtime validator negative corpus;
- backup/restore digest and reference checks;
- parser contract regression fixtures.

## 7.16 GA0-A3 acceptance

- temporal/correction policy accepted;
- factual lifecycle separated from review state;
- open-position boundary accepted;
- dataset and coverage manifests implemented;
- eligibility implemented;
- analysis snapshot implemented;
- evidence reference implemented;
- runtime validation exists;
- backup/restore verification passes;
- no analytics tool exists;
- no AI call exists;
- no support/resistance use exists;
- no deployment occurs.

---

# 8. Cross-Slice Quality Requirements

## 8.1 Comments

Any implementation comment must include the required date/time stamp under the project’s coding convention.

## 8.2 Error handling

- fail closed on ambiguous financial truth;
- expose stable machine codes;
- keep user-facing copy separate;
- never swallow validation errors;
- no raw broker rows in error logs.

## 8.3 Determinism

- tests use explicit seeds;
- random IDs never influence content identities;
- timezone is explicit;
- locale formatting never enters domain calculations;
- wall-clock time is injected where needed.

## 8.4 Compatibility

- no mutation of current saved data;
- no migration in GA0-A;
- legacy data read only when needed for inventory/compatibility tests;
- no route consumes new v3 financial contracts for user output yet.

## 8.5 Privacy

- synthetic fixtures in Git;
- private fixtures outside Git;
- no account IDs in snapshots;
- no source hashes in public docs;
- no raw CSV in prompts or logs.

---

# 9. Verification Commands

Each PR reports exact commands and results.

Minimum:

```text
npm ci
npx tsc --noEmit --pretty false
npx eslint <changed-v3-paths>
npx vitest run <focused-v3-tests> --reporter=dot
npm test
npm run verify:layer2
npm run verify:layer3
npm run build
```

Additional checks by slice:

## GA0-A1

- architecture-boundary test;
- deployment-profile tests;
- owner-route containment tests where applicable;
- private-data repository guard.

## GA0-A2

- exact-decimal tests;
- canonical digest tests;
- reference/differential financial tests;
- property tests with recorded seeds;
- duplicate/collision tests.

## GA0-A3

- temporal replay tests;
- manifest/eligibility tests;
- evidence-resolution tests;
- mixed-snapshot rejection tests;
- runtime-validator negative corpus;
- backup/restore test;
- parser-hardening contract tests.

Normal CI must not call a live model or external market-data source.

---

# 10. Review Checklist for Every GA0-A PR

- scope matches only its slice;
- no hidden analytics feature;
- no route/UI product expansion;
- no AI/provider dependency;
- no support/resistance dependency;
- no raw private data;
- exact policy documented;
- runtime validation included;
- negative tests included;
- deterministic IDs/hashes reviewed;
- changed paths and architecture dependencies reviewed;
- legacy tests green;
- build green;
- project log updated;
- next slice not started prematurely.

---

# 11. GA0-A Exit Criteria

GA0-A is complete only when all three slices pass and the project can prove:

- owner-only containment is explicit;
- canonical content identity is cryptographic and deterministic;
- legacy fingerprints are non-authoritative;
- executions are exact and uniquely/ambiguously identified honestly;
- duplicate/correction states are explicit;
- P/L policy is exact and versioned;
- reference math passes;
- corrections are immutable and temporally meaningful;
- user review state cannot change inventory;
- open positions cannot enter closed-trade conclusions;
- dataset coverage is explicit;
- manifests are content-addressed;
- eligibility is per capability;
- analysis snapshots are consistent;
- evidence references are stable;
- runtime validation fails closed;
- backup and restore are proven;
- private data guards pass;
- no user-facing analytics, AI, support/resistance, or deployment was added.

Only then may GA0-B implement weekday analytics and the daily-stop simulation.

---

# 12. Final Directive

GA0-A is the system’s factual constitution, not a feature sprint.

The implementation order is:

```text
contain access
  -> classify legacy boundaries
  -> define canonical identity
  -> make financial values exact
  -> define immutable corrections and inventory truth
  -> bind content-addressed datasets
  -> calculate capability eligibility
  -> prove consistent snapshots and stable evidence
  -> then build analytics
```

Do not optimize for the number of files created or the amount of visible UI.

Optimize for the number of ways silent financial corruption, accidental exposure, and irreproducible analysis have been removed.
