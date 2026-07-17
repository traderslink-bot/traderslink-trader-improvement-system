# Trader Intelligence v3 Project Log

## Purpose

This is the active continuity log for the Trader Intelligence v3 evidence-first AI journal architecture.

Use it to record:

- architecture decisions;
- completed implementation slices;
- QA gates;
- deployment profile;
- small/micro-cap domain decisions;
- verification;
- migrations;
- blockers;
- the exact next resume point.

The legacy `src/docs/codex-project-log.md` remains useful for the history of the v1/v2 deterministic analysis, route, candle, level, and product work. It no longer controls new v3 architecture.

---

## Resume Protocol

Read in this order:

1. `plan.md`
2. this file
3. `src/docs/trader-intelligence-v3-second-pass-qa-private-alpha-small-micro-cap-review-2026-07-17.md`
4. `src/docs/trader-intelligence-v3-qa-architecture-review-2026-07-17.md`
5. `src/docs/trader-intelligence-ai-journal-v3-master-plan-2026-07-17.md`
6. `src/docs/trader-intelligence-plan-index.md`
7. `src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`

When documents conflict, the latest entry in this log may clarify the current decision, but it must not silently weaken a mandatory QA gate. The second-pass QA review controls the first QA review, master plan, and Gate 0 plan where it is more specific about private-alpha sequencing or the small/micro-cap domain.

---

## Current Resume Point

### 2026-07-17 — Second-Pass QA: Private Owner Alpha and Small/Micro-Cap Domain

Status:

- the product owner confirmed that Trader Intelligence is currently tested only by the owner;
- the current operating profile is now explicitly `private_owner_alpha`;
- the intended primary domain is small-cap and micro-cap active trading;
- the product boundary is retrospective educational trade review, not live investment advice, live signals, automated execution, tax advice, or portfolio allocation;
- a second independent QA review was completed after the first architecture review;
- the original v3 direction remains approved;
- the first QA review remains valid for future public readiness and common correctness;
- the second review corrected the sequencing so public multi-user infrastructure does not block private-owner usefulness validation;
- exact financial math, reconstruction policy, evidence, no-lookahead, price-basis safety, simulation assumptions, and private-data handling remain mandatory in private alpha;
- deployment profiles, private-alpha and public-readiness tracks, small/micro-cap data rules, and educational language policy are now controlling;
- `plan.md`, `handoff.md`, and the plan index were updated to point to the second review;
- no runtime code changed;
- no deployment requested or allowed.

New controlling document:

- `src/docs/trader-intelligence-v3-second-pass-qa-private-alpha-small-micro-cap-review-2026-07-17.md`

Current deployment profile:

- `private_owner_alpha`

Primary second-pass engineering corrections:

1. Separate private-owner product validation from future public-platform hardening.
2. Allow an isolated owner identity adapter, durable local SQLite/private database, local job adapter, and private real-data calibration during private alpha.
3. Do not permit those adapters to masquerade as public-production identity, storage, or orchestration.
4. Keep exact decimals, analytical P/L policy, instrument identity, price-basis safety, dataset versions, evidence, backup, and raw-data privacy early.
5. Permit owner-only AI after deterministic tool, claim, evidence, answer-schema, cost, and private deployment gates pass instead of waiting for all public multi-user infrastructure.
6. Keep the first Gate 0 coding slice deterministic and model-free.
7. Add concrete small/micro-cap requirements for premarket, after-hours, halts, gaps, sub-dollar precision, thin liquidity, quote data, spread, slippage, partial fills, reverse splits, ticker changes, float, catalysts, dilution, listing events, and repeated same-ticker attempts.
8. Add evidence capability tiers: execution-only, candle-enriched, event-enriched, quote-enriched, share-structure-enriched, and combined.
9. Prohibit candle-only data from creating verified spread, liquidity, slippage, or executable-fill claims.
10. Require dated provenance for float and catalyst context.
11. Require official or qualified event data before calling a gap in candles a trading halt.
12. Require associative rather than unsupported causal language for questions phrased as `why`.
13. Reframe `best position size` as historical size-performance analysis.
14. Reuse existing Academy education and watchlist catalyst/source/cost contract ideas without importing live directional watchlist bias or price targets into the journal.
15. Keep support/resistance behind the final-zone usability and congestion gate, with additional gap, halt, premarket, sparse-print, and reverse-split safeguards.

Private-alpha track:

- GA0: common truth and deterministic proof;
- GA1: execution-only analytics expansion;
- GA2: owner-only AI grounding;
- GA3: small/micro-cap market enrichment by evidence tier;
- GA4: usefulness calibration against legacy output.

Future public-readiness track:

- shared identity and tenancy;
- PostgreSQL and RLS;
- object-storage upload;
- durable jobs and transactional outbox;
- deletion and retention;
- entitlements and rate limits;
- licensing, monitoring, recovery, and launch review.

Next engineering action after the documentation PR is accepted:

1. create a clean implementation branch from current `main`;
2. complete the preserve/adapt/legacy/retire inventory;
3. add deployment-profile and current `private_owner_alpha` decisions to the ADR set;
4. select exact decimal and analytical P/L policy;
5. define timestamp/session, stable instrument identity, and price-basis contracts;
6. define private-alpha storage, backup, private-fixture, and no-raw-data-in-prompts policies;
7. create the internal v3 contract boundary;
8. implement exact financial reference math and public synthetic fixtures;
9. implement read-only current-data adapters;
10. implement performance-by-weekday and stop-after-consecutive-losses tools;
11. add v3 CI and private-data repository guards;
12. run focused and legacy regression verification;
13. update this log and gate status.

First implementation branch recommendation:

- `agent/trader-intelligence-v3-gate-0-foundation`

First-run restrictions remain:

- internal-only;
- read-only compatibility adapters;
- no AI model calls;
- no public v3 route;
- no public production database write;
- no coach redesign;
- no support/resistance consumption;
- no new level detector;
- no unrestricted SQL;
- no vector database;
- no production deployment.

Gate 0 remains **in progress** until common-truth ADRs and the deterministic proof slice are implemented and verified.

### 2026-07-17 — Gate 0 Execution Plan Activated and Verified

Status:

- master architecture remains conditionally approved;
- first mandatory QA review is controlling for production-readiness corrections;
- v3 planning chain is active in `plan.md`, `handoff.md`, and the plan index;
- Gate 0 and first internal slice plan was created and activated;
- the plan includes repository inventory, ADRs, versioned contracts, exact financial reference math, read-only adapters, synthetic golden fixtures, weekday analytics, daily-stop simulation, v3 CI, and detailed acceptance gates;
- stale cold-start handoff instructions that pointed to the old May plan were replaced;
- PR #94 title and body were updated to reflect the conditional QA verdict and active Gate 0 plan;
- a QA verdict comment was added to PR #94;
- no runtime code changed;
- no production deployment requested or allowed.

Active execution plan:

- `src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`

Initial next action at that checkpoint:

1. create a clean implementation branch from current `main`;
2. complete the current-system preserve/adapt/legacy/retire inventory;
3. write and accept ADRs 0001–0009;
4. leave ADR-0010 proposed with explicit AI provider/privacy/grounding criteria;
5. create the internal v3 contract boundary;
6. implement exact financial test helpers and public synthetic fixtures;
7. implement read-only current-data adapters;
8. implement performance-by-weekday and stop-after-consecutive-losses tools;
9. add v3 CI;
10. run focused and legacy regression verification;
11. update this log and gate status.

Documentation verification completed at that checkpoint:

- PR changed-file list contained seven expected documentation files;
- the branch was ahead of `main`, had the same merge base, and was not behind;
- branch comparison contained no runtime-code file;
- `plan.md`, `handoff.md`, and the plan index pointed to the same active Gate 0 plan;
- the first QA review and Gate 0 plan headers and final directives were inspected;
- PR #94 remained open, mergeable, and draft;
- no runtime tests were required because the PR was documentation-only.

### 2026-07-17 — Master Plan QA and Architecture Correction

Status:

- v3 master plan created in PR #94;
- first full cross-plan and repository QA audit completed;
- architecture direction conditionally approved;
- mandatory first QA amendment added;
- root `plan.md` switched from the legacy May plan chain to v3;
- plan index replaced with the v3 authority and phase order;
- no runtime code changed;
- no production deployment requested or allowed.

Key first-pass QA findings:

1. The current parser, normalization, reconstruction, replay-safety, and test work is valuable.
2. The current Trader Intelligence persistence and identity path is prototype-oriented:
   - import planning uses demo workspace/user/account constants;
   - import routes directly instantiate SQLite repositories;
   - default production SQLite storage uses a temporary filesystem path;
   - shared Trader Intelligence tenancy is not yet established.
3. Critical chart enrichment currently uses Next.js `after()` and needs a durable workflow/outbox architecture before public production reliance.
4. Exact financial representation and analytical P/L policy were missing from the original plan and became P0 decisions.
5. Public CSV ingestion needs signed object storage, bounded/streaming parsing, retention, and deletion rather than treating `csvText` JSON requests as the final architecture.
6. Market-data basis, instrument identity, and no-lookahead rules require stronger versioned contracts.
7. The existing level snapshot already exposes final level zones. V3 should add a Zone Usability and Congestion Layer, not duplicate `levels-system-v2` with a second detector.
8. Statistical tools need independent-cluster counts, discovery versus direct-analysis policy, chronological validation, multiple-comparison controls, and leakage tests.
9. Simulations need explicit intervention, fill, ambiguity, and sequential-state policies.
10. AI needs claim-level numeric grounding, server-owned evidence links, bounded tool loops, provider data policy, and release evaluations.
11. Migration must use one authoritative write path rather than indefinite dual-write.
12. Retention, deletion, backups, and tenant security must begin before public launch.
13. Current general CI is not sufficient for v3 financial, database, tenant, migration, and AI gates.

---

## Decision Log

### Deployment profile

State: current direction approved.

Decision:

- current profile is `private_owner_alpha`;
- future profiles are `private_invited_alpha`, `public_beta`, and `public_production`;
- profile-specific adapters and startup checks must fail closed;
- private-alpha infrastructure cannot silently become public-production authority.

### Shared identity

State: required before invited/public users; interface required in Gate 0.

Recommended direction:

- create a shared platform-user abstraction backed initially by the existing authenticated site user;
- use an internal stable ID rather than a Discord identifier as the domain key;
- resolve workspace/account permissions server-side;
- require an authorization context in every v3 repository and analytics tool call;
- allow one explicit owner adapter in `private_owner_alpha` only.

### Exact decimals

State: required before financial contracts are trusted in any profile.

Requirements:

- no binary floating-point authority for money, prices, fees, share quantities, FX, or P/L;
- exact decimal application library behind domain helpers;
- exact production storage;
- decimal-string serialized contracts;
- versioned rounding and reconciliation rules.

### Analytical P/L

State: required before reconstruction v3.

Requirements:

- distinguish broker-reported, analytical, cash, and tax P/L;
- define average-cost/FIFO policy;
- define partial fills, fees, prior inventory, reversals, shorts, open positions, corporate actions, and currency behavior;
- version the policy and include it in results.

### Instrument identity and price basis

State: required before candle-derived private-alpha results.

Requirements:

- stable internal instrument ID;
- symbol history as of execution time;
- ticker-change and symbol-reuse handling;
- raw execution price preservation;
- raw/adjusted market-data basis metadata;
- fail-closed split and reverse-split warnings;
- unresolved-instrument quarantine for market enrichment.

### Data capability tiers

State: architecture direction approved.

Decision:

- E0 execution-only;
- E1 candle-enriched;
- E2 event-enriched;
- E3 quote-enriched;
- E4 share-structure-enriched;
- E5 combined with explicit limitations;
- tools and AI answers cannot exceed their evidence capability.

### Durable workflows

State: required before public critical jobs; provider-independent contract required early.

Requirements:

- transactional outbox;
- provider-independent job interface;
- idempotent/resumable steps;
- bounded retries;
- tenant scope;
- cancellation and deletion awareness;
- observability;
- local/private-alpha adapter for small workloads;
- public provider spike before public reliance.

### Support/resistance consumption

State: architecture direction approved.

Decision:

- keep `levels-system-v2` as factual producer;
- consume replay-safe final zones from saved snapshots;
- add zone usability, congestion, stable primary selection, and suppression;
- do not add another full detector inside Trader Intelligence;
- keep v3 AI execution-only until the zone usefulness gate passes;
- add gap, halt, premarket, sparse-print, and reverse-split safeguards.

### Educational boundary

State: approved.

Decision:

- retrospective analysis and education only;
- historical rule experiments are allowed;
- no live buy/sell/hold instructions;
- no current price targets;
- no automated orders;
- no guaranteed improvement;
- no tax or portfolio-allocation advice;
- use associative rather than unsupported causal language.

---

## QA Gate Status

| Gate | Status | Notes |
|---|---|---|
| G0 Plan and common truth | In progress | Two QA reviews, active Gate 0 plan, and private-alpha profile are documented; ADRs and deterministic proof slice remain |
| GA1 Private execution analytics | Not started | Weekday and daily-stop tools specified |
| GA2 Private AI grounding | Not started | Owner-only AI allowed only after claim/evidence/cost gates |
| GA3 Small/micro-cap enrichment | Not started | Instrument, basis, session, halt, quote, float, catalyst, and zone gates required |
| GA4 Private usefulness | Not started | Must compare v3 with legacy output and owner trust/usefulness |
| GP1 Public identity and persistence | Not started | Required before invited/public users |
| GP2 Public ingestion and durability | Not started | Object storage, outbox, jobs, deletion, rate limits |
| GP3 Public beta/production | Not started | Licensing, SLOs, recovery, security, billing, rollback |

---

## Update Rules

After each meaningful v3 run, record:

- branch and PR;
- deployment profile;
- files and contracts changed;
- architecture decisions;
- financial policy version;
- data capability tier;
- small/micro-cap domain impact;
- tests and exact command results;
- database migration state;
- feature flags;
- rollout state;
- private-data handling;
- known limitations;
- next resume point.

Do not mark a gate complete because one unit test passes. Gate completion requires all acceptance criteria in the controlling QA reviews and active phase plan.
