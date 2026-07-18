# Trader Intelligence v3 GA0-A Control and Exact Truth Implementation Plan

**Date:** 2026-07-17 America/Toronto  
**Status:** Active file-level implementation plan  
**Architecture authority:** `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`  
**Operating profile:** `private_owner_alpha`  
**Only operational hosting mode:** `local_only`
**Current slice:** GA0-A1 — containment and architecture boundaries  
**Runtime model calls:** forbidden  
**Analytics tools:** forbidden in GA0-A  
**Chart rendering:** forbidden in GA0-A  
**Support/resistance consumption:** forbidden  
**Production deployment:** forbidden

---

# 1. Purpose

GA0-A establishes the factual and operational constitution required before v3 analytics read real owner data as trusted analytical truth.

GA0-A does not build user-facing analytics, natural-language query handling, charts, or AI.

GA0-A proves:

- the application knows whether it is local-only or privately hosted;
- privately hosted Intelligence routes cannot be anonymous;
- source content has canonical cryptographic identity;
- financial values use exact decimals;
- accepted executions have deterministic identity and ordering;
- duplicate, correction, ambiguity, and collision states are explicit;
- factual inventory cannot be changed by a review action;
- corrections are immutable and temporally replayable;
- datasets are coverage-aware and content-addressed;
- analysis eligibility is per capability;
- one analysis run reads one immutable snapshot;
- evidence references remain stable across persistence changes;
- canonical date/time filters can be represented and hashed before tools exist;
- runtime payloads are validated;
- private data cannot enter Git or normal logs;
- SQLite backup and restore are demonstrably consistent.

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

That older Gate 0 plan remains an umbrella/historical artifact. Weekday analytics and the daily-stop simulation belong to GA0-B.

The fifth-pass query and visual-evidence review does not move chart work into GA0-A. GA0-A3 defines only canonical query/filter contracts needed for deterministic snapshots and future tool manifests.

---

# 3. Delivery Shape

GA0-A is delivered in three focused sequential PRs.

## GA0-A1 — Containment and Architecture Boundaries

Recommended branch:

`agent/trader-intelligence-v3-ga0-a1-containment`

## GA0-A2 — Canonical Execution and Exact Financial Truth

Recommended branch:

`agent/trader-intelligence-v3-ga0-a2-exact-truth`

Start only after GA0-A1 is merged or explicitly accepted.

## GA0-A3 — Temporal, Manifest, Eligibility, and Query Foundation

Recommended branch:

`agent/trader-intelligence-v3-ga0-a3-manifests`

Start only after GA0-A2 is merged or explicitly accepted.

GA0-B begins only after all GA0-A acceptance criteria pass.

Do not combine the three slices into one giant PR.

---

# 4. Global Non-Goals

GA0-A must not add:

- an AI provider call;
- an Ask AI route;
- prompt engineering;
- natural-language question parsing;
- weekday analytics;
- daily-stop simulation;
- chart-ready analytical series beyond contract types;
- chart rendering;
- a visual-template registry implementation;
- chart drill-down UI;
- market-candle enrichment;
- setup classification;
- behavioral coaching;
- Rule Lab UI;
- reports;
- vector search or embeddings;
- arbitrary SQL or analytics DSL;
- live broker connections;
- options analytics;
- tax accounting;
- live alerts;
- automated execution;
- `/coach` redesign;
- support/resistance consumption;
- a second level detector;
- production deployment.

An owner-access guard or fail-closed disabling of existing Intelligence routes is allowed because it reduces exposure.

---

# 5. GA0-A1 — Containment and Architecture Boundaries

## 5.0 Independent-audit remediation status on 2026-07-17

- Independent audit accepted the containment direction with required fixes; remediation is in progress on `agent/trader-intelligence-v3-ga0-a1-containment`.
- Draft review: `https://github.com/traderslink-bot/traderslink-trader-improvement-system/pull/102`.
- Acceptance remains pending independent re-review; GA0-A2 has not started.
- Current execution mode is local owner testing only; no Vercel preview or production deployment is requested.
- The machine-readable containment matrix classifies all 51 Intelligence pages and 31 relevant Intelligence APIs.
- Supported development and optimized scripts use a raw Node listener bound to `127.0.0.1`; it rejects non-loopback peers and client-supplied forwarding/proxy/tunnel evidence before Next.js handling, then stamps a per-process assertion for the exact loopback headers Next.js 16 synthesizes internally.
- All owner surfaces require a verified exact loopback request before local owner authorization; forwarded, proxied, tunneled, LAN, public, arbitrary DNS, and malformed requests fail first.
- Only `local_only + local_sqlite` is operational. Hosted profiles/modes and `private_database` fail with stable not-operational reasons.
- Unsafe methods require an explicit configured loopback Origin allowlist and exact scheme/host/port validation before legacy handler/repository work.
- Sample mode uses isolated in-memory persistence. Real-owner mode requires an explicit durable path outside Git and the OS temp directory, and upload entry points require explicit real-owner mode.
- Intelligence pages and APIs are dynamic, private, and no-store.
- Trader Intelligence remains a separate application from Academy. The provisional Discord-session adapter is retained as isolated future compatibility code, but no accepted runtime profile reaches it; the exact architecture exception exposes no Academy role, progress, lesson, entitlement, or product behavior symbol.
- Inventory and legacy hazard register are complete.
- Feature provenance was reconciled with the dirty V2 worktree: committed V2
  engine behavior was deliberately ported to `main`, while uncommitted manual
  entry, AI reflection, and real-coach/Whop prototypes remain external legacy
  sources and are not authorized for implementation in GA0-A1.
- AST architecture and deny-by-default route guards run locally and in CI.
- Private-data guards scan the final tree and every added/modified PR-history blob with exact file/hash synthetic-fixture approval.
- No exact-financial, analytics, chart, AI, support/resistance, migration, or deployment work was added.
- Audit fixes remain in progress until the entire required verification set passes and the revised head is independently re-reviewed. Exact interim results are recorded in the v3 project log.

## 5.1 Current-system inventory

Create or update:

`src/docs/trader-intelligence-v3-current-system-inventory-2026-07-17.md`

For every relevant module record:

- path;
- responsibility;
- consumers;
- source-of-truth layer;
- production/private-alpha readiness;
- classification;
- migration/adapter need;
- risks;
- tests;
- retirement condition.

Classifications:

- `preserve`;
- `adapt`;
- `legacy_provider`;
- `retire`;
- `out_of_scope`.

Minimum inventory:

- broker CSV adapters/core;
- fingerprints and duplicate logic;
- raw trade timeline;
- execution feedback;
- current importer/commit planner;
- SQLite repository;
- all Intelligence pages/APIs;
- auth/session paths;
- market-data adapters;
- level-analysis bridge;
- pattern/scoring/coaching stack;
- current chart contracts/renderers;
- tests/fixtures/CI;
- private calibration paths.

## 5.2 Deployment and hosting contracts

Create under:

`src/lib/trader-intelligence-v3/deployment/`

Required contracts:

- deployment profile;
- hosting mode;
- startup validation;
- owner identity requirement;
- allowed storage mode;
- allowed route mode;
- fail-closed reason codes.

Required states:

- `private_owner_alpha` with `local_only`;
- future hosting/profile/storage declarations that fail as not operational.

Fail closed when:

- hosting mode missing;
- deployed environment claims local-only;
- any hosted mode/profile or private database is requested;
- request Host/URL is not exact loopback or forwarding/proxy/tunnel evidence exists;
- configured mutation origins are invalid or an unsafe request lacks an exact approved Origin;
- storage path is unsafe;
- sample/real-data mode is ambiguous.

## 5.3 Owner route containment contract

Inventory every Intelligence page/API as:

- public-safe informational;
- owner read;
- owner mutation;
- internal diagnostics;
- disabled outside local mode.

Private-hosted requirements:

- server-derived owner session;
- authorization before repository access;
- no demo identity as authorization;
- no anonymous cache;
- mutation audit record;
- generic unauthorized/not-found response;
- all evidence/chart/export routes owner-scoped.

GA0-A1 may implement the containment boundary or disable unsafe routes. It must not redesign product UI.

## 5.4 Minimal v3 boundary

Create:

```text
src/lib/trader-intelligence-v3/
  deployment/
  auth/
  contracts/
  domain/
  testing/
```

No Next.js imports inside domain/contracts.

No direct database, model, market-data, or level-engine dependency in v3 core.

## 5.5 Architecture dependency guard

Add tests/scripts that prevent:

- v3 domain importing `app/`;
- v3 domain importing OpenAI/AI SDK;
- v3 domain importing SQLite/Neon directly;
- v3 domain importing `levels-system-v2` directly;
- legacy coaching importing v3 internals to bypass adapters;
- route code becoming domain authority.

## 5.6 Private-data repository guard

Scan staged/repository content for:

- broker export names;
- likely account numbers;
- private fixture paths;
- raw CSV rows;
- private screenshots;
- secrets/tokens;
- unredacted identifiers.

Use exact file-specific content hashes for synthetic fixtures. Scan tracked, staged, non-ignored untracked, and every added/modified PR-history blob, including content later deleted or renamed. Never print a suspected sensitive value.

## 5.7 Legacy hazard register

Document at least:

- demo identities;
- direct route/repository construction;
- temporary production SQLite;
- legacy 32-bit fingerprints;
- JavaScript-number financial fields;
- user lifecycle overrides;
- browser-side prototype filtering;
- prototype chart contracts lacking evidence metadata;
- request-lifecycle critical jobs;
- JSON blobs as query authority;
- nearest-level coaching;
- fixed coaching templates.

## 5.8 GA0-A1 tests

- deployment profile validation;
- hosted-local mismatch failure;
- owner session missing failure;
- owner route containment matrix;
- unauthorized API mutation failure;
- architecture dependency test;
- private-data guard positive/negative fixtures;
- no runtime analytics/model/chart dependency.

## 5.9 GA0-A1 acceptance

- inventory accepted;
- route containment decision accepted;
- local/hosted startup behavior fails closed;
- minimal v3 boundary exists;
- dependency guard passes;
- private-data guard passes;
- no real data deployed;
- no analytics/chart/AI feature added;
- project log updated.

---

# 6. GA0-A2 — Canonical Execution and Exact Financial Truth

## 6.1 Exact decimal ADR and wrappers

Select and document:

- decimal library;
- canonical decimal grammar;
- price/quantity/money/fee/percentage types;
- precision bounds;
- signed-zero policy;
- intermediate rounding;
- display rounding separation;
- invalid/overflow behavior;
- SQLite test representation;
- future PostgreSQL exact representation.

Create domain wrappers so business logic does not import the library directly.

## 6.2 Canonical serialization and cryptographic digest

Define:

- UTF-8;
- Unicode normalization;
- key ordering;
- semantic array ordering;
- decimal normalization;
- timestamp format/precision;
- null/omitted semantics;
- enum case;
- line endings;
- duplicate-key rejection;
- domain/schema/canonicalization/hash versions.

Use an approved cryptographic digest.

Exclude random/database/wall-clock/display metadata from content identity.

## 6.3 Canonical execution contract

Required fields include:

- source identity;
- broker/account;
- instrument-resolution state;
- raw broker symbol;
- UTC timestamp;
- source timezone/precision;
- side/position effect;
- exact quantity/price;
- exact fees/commission/net amount where known;
- currency;
- order/execution IDs;
- original row locator;
- correction state;
- canonical digest;
- validation status.

## 6.4 Deterministic ordering

Define ordering evidence and ambiguity:

1. timestamp;
2. timestamp precision;
3. broker execution index;
4. execution ID;
5. order ID;
6. source row location;
7. canonical digest.

Unresolvable meaningful order creates an ambiguity state.

## 6.5 Duplicate/correction/collision states

Implement machine states:

- exact duplicate same source;
- same execution reexported;
- broker correction/bust;
- possible duplicate ambiguous;
- legitimate repeated fill;
- digest collision;
- manual review required.

Only proven exact duplicates are suppressed.

## 6.6 P/L and reconstruction ADR

Define:

- analytical P/L versus broker/cash/tax;
- average cost or FIFO;
- fee allocation;
- partial fills;
- average-fill rows;
- shorts;
- reversals;
- prior inventory;
- open positions;
- corporate actions;
- symbol changes;
- user grouping corrections;
- currency separation.

## 6.7 Reference math

Build an independent exact reference implementation for:

- long round trips;
- partial entries/exits;
- short round trips;
- reversals;
- fees;
- open inventory;
- prior inventory;
- zero/negative fees where valid;
- sub-dollar precision;
- multiple currencies separated.

## 6.8 GA0-A2 tests

- decimal grammar and round-trip;
- cross-platform canonical digest;
- property-order invariance;
- semantic change changes digest;
- persistence ID does not change digest;
- same-timestamp ordering;
- ambiguous ordering;
- legitimate repeated fill;
- exact duplicate;
- correction/bust;
- collision fail-closed;
- differential P/L;
- property tests with recorded seeds;
- no JavaScript-number authority.

## 6.9 GA0-A2 acceptance

- exact decimal ADR accepted;
- canonicalization ADR accepted;
- canonical execution contract accepted;
- cryptographic identity implemented;
- legacy fingerprints marked non-authoritative;
- ordering/duplicate states implemented;
- P/L/reconstruction ADR accepted;
- reference math passes;
- exact synthetic fixtures pass;
- no analytics/chart/AI feature added.

---

# 7. GA0-A3 — Temporal, Manifest, Eligibility, and Query Foundation

## 7.1 Bitemporal correction contract

Define valid/effective, first-public, observed, recorded, corrected, and superseded times.

Corrections are append-only.

Old manifests remain replayable.

## 7.2 Lifecycle versus review disposition

Implement separate contracts.

Only executions/corrections change inventory.

Legacy mark-closed behavior becomes annotation/coverage limitation.

## 7.3 Retrospective/open-position policy

Define:

- closed historical trade;
- same-day closed trade;
- open-position execution review only;
- pending correction;
- coverage incomplete;
- not eligible for coaching.

Every result records `analysisCutoffAt`.

Open positions receive no live directional guidance.

## 7.4 Dataset and coverage manifests

Implement content-addressed contracts for:

- source files;
- accepted executions;
- corrections;
- policies;
- accounts;
- statement periods;
- gaps/overlap;
- exclusions;
- prior inventory;
- open positions;
- currencies.

## 7.5 Eligibility contract

Implement per-capability states and stable reason codes.

Include future `visual_evidence` capability but do not render visuals.

## 7.6 Immutable analysis snapshot

Bind one run to one:

- dataset/coverage manifest;
- correction cutoff;
- policies;
- eligibility;
- enrichment set;
- intent/rule cutoffs;
- analysis cutoff.

Reject mixed manifests.

## 7.7 Stable evidence references

Use manifest-scoped semantic identities.

Test reimport/persistence-ID changes.

## 7.8 Canonical date/time/query-filter foundation

Define contracts only for:

- date basis;
- time basis;
- timezone;
- start/end/inclusivity;
- calendar versus trading sessions;
- relative-date anchor and resolved absolute range;
- account/instrument/direction/session/lifecycle/setup/outcome/currency filters;
- evidence capability filters;
- open-position policy;
- analysis cutoff;
- canonical filter digest.

Do not add natural-language parsing or a query UI.

## 7.9 Runtime validation

Validate:

- canonical executions;
- corrections;
- manifests;
- eligibility;
- evidence references;
- date/time filters;
- analysis snapshots;
- database JSON;
- future adapter/tool payloads.

## 7.10 Stale/invalidation states

Define current, stale-source, stale-policy, stale-eligibility, superseded, blocked, retryable/terminal failure, and deleted-source states.

## 7.11 WAL-safe backup and restore

Document/test:

- consistent backup mechanism;
- encryption;
- integrity check;
- isolated restore;
- execution/manifest digest comparison;
- representative reference result comparison;
- restore-test record.

## 7.12 Parser hardening contract

Plan/tests for:

- duplicate raw/normalized headers;
- mapping collisions;
- malformed/unclosed quotes;
- inconsistent row width;
- unsupported encoding;
- control characters;
- oversized cells;
- ambiguous delimiter;
- conflicting duplicate execution IDs.

Severe defects may be fixed before GA0-B; broader parser refactor remains separate.

## 7.13 GA0-A3 tests

- bitemporal replay;
- effective-time notes/rules;
- review state cannot close inventory;
- open positions excluded from closed analytics;
- manifest digest stable across persistence IDs;
- coverage gaps change state;
- deterministic eligibility reasons;
- mixed-snapshot rejection;
- evidence resolution after reimport;
- date/time filter canonicalization;
- relative-date resolution with fixed clock;
- DST/holiday/early-close cases;
- stale propagation;
- runtime-validator negative corpus;
- backup/restore digest/reference checks;
- parser contract fixtures.

## 7.14 GA0-A3 acceptance

- temporal/correction policy accepted;
- factual lifecycle separated;
- open-position/cutoff policy accepted;
- manifests/coverage implemented;
- eligibility implemented;
- immutable snapshot implemented;
- evidence references implemented;
- canonical filter contract implemented;
- runtime validation exists;
- backup/restore passes;
- no analytics tool exists;
- no chart renderer exists;
- no AI call exists;
- no support/resistance use exists;
- no deployment occurs.

---

# 8. Cross-Slice Quality Requirements

## Comments

Any implementation comment includes the required date/time stamp under the project coding convention.

## Error handling

- fail closed on ambiguous truth;
- expose stable machine codes;
- keep user copy separate;
- never swallow validation errors;
- no raw rows in logs.

## Determinism

- explicit seeds;
- random IDs never influence content identity;
- explicit timezone;
- locale formatting stays outside calculations;
- wall clock injected;
- canonical sorting documented.

## Compatibility

- no current saved-data mutation;
- no migration in GA0-A;
- legacy reads only for inventory/compatibility tests;
- no route consumes new financial/filter contracts for user output yet.

## Privacy

- synthetic fixtures in Git;
- private fixtures outside Git;
- no account IDs in snapshots;
- no private source hashes in public docs;
- no raw CSV in prompts/logs.

---

# 9. Verification Commands

Each PR reports exact commands/results.

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

Additional:

## GA0-A1

- architecture-boundary test;
- deployment/hosting tests;
- owner-route containment tests;
- private-data guard.

## GA0-A2

- exact-decimal tests;
- canonical digest tests;
- reference/differential financial tests;
- property tests with recorded seeds;
- duplicate/collision tests.

## GA0-A3

- temporal replay;
- manifest/eligibility;
- query/filter canonicalization;
- evidence resolution;
- mixed-snapshot rejection;
- runtime-validator negative corpus;
- backup/restore;
- parser-hardening contract tests.

Normal CI must not call a live model or external market-data source.

---

# 10. Review Checklist for Every GA0-A PR

- scope matches only its slice;
- no hidden analytics or chart feature;
- no route/UI product expansion except containment;
- no AI/provider dependency;
- no support/resistance dependency;
- no raw private data;
- exact policy documented;
- runtime validation included where relevant;
- negative tests included;
- deterministic IDs/hashes reviewed;
- changed paths/dependencies reviewed;
- legacy tests green;
- build green;
- project log updated;
- next slice not started prematurely.

---

# 11. GA0-A Exit Criteria

GA0-A is complete only when all three slices prove:

- owner-only containment;
- canonical cryptographic identity;
- legacy fingerprints non-authoritative;
- exact executions and honest ambiguity;
- explicit duplicate/correction states;
- exact/versioned P/L policy;
- passing reference math;
- immutable temporal corrections;
- review state cannot change inventory;
- open positions cannot enter closed-trade conclusions;
- explicit coverage;
- content-addressed manifests;
- per-capability eligibility;
- immutable analysis snapshots;
- stable evidence references;
- canonical date/time/filter contract;
- fail-closed runtime validation;
- proven backup/restore;
- private-data guards;
- no user-facing analytics, chart rendering, AI, support/resistance, or deployment.

Only then may GA0-B implement weekday analytics, the daily-stop simulation, exact tables, and validated chart-ready series.

---

# 12. Final Directive

GA0-A is the factual constitution, not a feature sprint.

```text
contain access
  -> classify legacy boundaries
  -> define canonical identity
  -> make financial values exact
  -> define immutable corrections and inventory truth
  -> bind content-addressed datasets
  -> define date/time filters and capability eligibility
  -> prove consistent snapshots and stable evidence
  -> then build deterministic tables and chart-ready series
```

Do not optimize for visible UI progress.

Optimize for removing silent financial corruption, accidental exposure, ambiguous time ranges, irreproducible analysis, and future text/chart disagreement before those failures reach the user.
