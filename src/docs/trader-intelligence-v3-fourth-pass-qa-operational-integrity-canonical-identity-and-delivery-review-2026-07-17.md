# Trader Intelligence v3 Fourth-Pass QA: Operational Integrity, Canonical Identity, Temporal Truth, and Reviewable Delivery

**Date:** 2026-07-17 America/Toronto  
**Status:** Mandatory fourth-pass implementation amendments  
**Repository:** `traderslink-bot/traderslink-trader-improvement-system`  
**Operating profile:** `private_owner_alpha`  
**Primary domain:** U.S. listed small-cap and micro-cap active trading  
**Product boundary:** retrospective educational trade review and self-improvement

## Reviewed authority

- `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`
- `src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`
- `src/docs/trader-intelligence-v3-project-log.md`
- `plan.md`
- `handoff.md`
- `src/docs/trader-intelligence-plan-index.md`
- all three prior v3 QA reviews and the original master plan as rationale

## Repository boundaries sampled

- `app/intelligence/layout.tsx`
- `app/intelligence/page.tsx`
- `app/api/import-batches/preview/route.ts`
- `app/api/import-batches/[batchId]/commit/route.ts`
- `app/api/trades/route.ts`
- `app/api/trades/[tradeId]/mark-closed/route.ts`
- `src/lib/execution-sources/import-fingerprints.ts`
- `src/lib/execution-sources/csv/broker-execution-csv-import.ts`
- `src/lib/trader-analytics/product/import-commit/import-commit-planner.ts`
- `src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository.ts`
- current package scripts, CI, and test boundaries

---

# 1. Executive Verdict

The consolidated v3 architecture remains correct. The fourth pass found no reason to restart the design, replace the evidence-first architecture, or move AI earlier.

The fourth pass did find several implementation-critical gaps that could still make a mathematically careful system produce incorrect or misleading results:

1. the currently deployed route family does not itself prove owner-only access;
2. legacy fingerprints are not safe as authoritative content identities;
3. canonical hashing rules are not yet specified;
4. a user review action can currently alter factual lifecycle status without a closing execution;
5. temporal correction semantics are not yet explicit enough;
6. analysis runs do not yet have a formal snapshot-isolation contract;
7. duplicate detection does not yet distinguish exact duplicates from plausible repeated fills and hash collisions;
8. open-position and same-day review can accidentally cross the retrospective/live boundary;
9. SQLite backup requirements do not yet specify WAL-safe capture and restore verification;
10. the active Gate 0 plan still conflicts with the newer GA0-A scope;
11. evaluation can be contaminated because the owner is also the developer, calibrator, and sole product evaluator;
12. parser edge cases can silently change field meaning before v3 receives the data.

The engineering ruling is:

> The next work must not merely define exact numbers. It must define canonical identity, immutable factual state, temporal meaning, consistent snapshots, and operational containment.

The delivery ruling is:

> GA0-A must be executed through smaller reviewable slices. Weekday analytics and the daily-stop simulation belong in GA0-B, not in the first exact-truth PR.

---

# 2. Severity Summary

## P0 before private hosted real-data use

1. Owner authentication and route containment for all Intelligence pages and APIs.
2. A fail-closed deployment/hosting-mode guard.
3. Replacement of legacy 32-bit fingerprints as authoritative identities.
4. Canonical serialization and cryptographic hashing policy.
5. Ledger-derived lifecycle truth separated from user review disposition.
6. Immutable analysis snapshot contract.
7. Exact execution identity and duplicate/collision states.
8. Open-position and retrospective-analysis cutoff policy.

## P0 before GA0-B analytics

1. Bitemporal correction semantics.
2. Stable manifest-scoped evidence identifiers.
3. Runtime validation at every untrusted boundary.
4. Deterministic ordering for same-timestamp executions.
5. Stable machine-readable eligibility and exclusion reason codes.
6. WAL-safe backup and tested restore.
7. Parser hardening for duplicate headers, malformed quotes, and row-width errors.

## P1 before owner-only AI

1. Immutable request/response artifacts and explicit AI replay semantics.
2. Exploration ledger and cross-question multiple-comparison controls.
3. Calibration, holdout, and regression dataset separation.
4. Stale/superseded/deleted answer behavior.
5. Degraded/offline mode and external-source failure behavior.
6. Performance and memory budgets.
7. Owner feedback triage that captures the exact manifest and claim set.

## P2 before invited/public use

The public identity, tenancy, PostgreSQL, RLS, object storage, durable jobs, deletion, licensing, monitoring, and recovery requirements from the prior reviews remain controlling.

---

# 3. Repository Finding: Current Hosted Routes Are Not Owner-Gated by the Intelligence Layout

The current `app/intelligence/layout.tsx` renders `SiteShell` and children but does not resolve or enforce an owner identity.

The current API examples also instantiate the SQLite repository and demo identity directly:

- `app/api/import-batches/preview/route.ts` accepts a POST body, creates `SqliteImportCommitRepository`, saves a preview, and returns the plan;
- `app/api/trades/route.ts` reads trades for `DEMO_USER_ID`;
- `app/api/trades/[tradeId]/mark-closed/route.ts` performs a mutation for `DEMO_USER_ID`.

This does not prove that an entire deployment is publicly reachable, but it proves that route-level owner enforcement is not provided by these files.

## Mandatory ruling

Before any real broker file or real saved trade is used in `private_hosted` mode:

- all `/intelligence/**` pages require an authenticated owner session;
- all Trader Intelligence API routes require the same owner authorization;
- route handlers derive the owner identity server-side;
- the browser cannot select the owner by submitting a demo user ID;
- anonymous access returns a non-disclosing not-found or unauthorized response;
- mutations require CSRF-safe same-origin/session behavior;
- no private response is cacheable by a shared CDN;
- startup fails closed when profile, hosting mode, or owner identity is invalid.

## Required configuration contract

Suggested variables or equivalent configuration:

```text
TRADER_INTELLIGENCE_DEPLOYMENT_PROFILE=private_owner_alpha
TRADER_INTELLIGENCE_HOSTING_MODE=local_only|private_hosted
TRADER_INTELLIGENCE_ENABLED=true|false
TRADER_INTELLIGENCE_OWNER_AUTH_REQUIRED=true|false
```

Rules:

- `local_only` must reject deployment environments that expose the app on a public host;
- `private_hosted` requires owner authentication;
- no production/public profile may start with the local demo identity adapter;
- a disabled profile returns no data and accepts no mutations;
- real-data calibration is forbidden when containment checks fail.

## Immediate operational note

Until the guard exists, the safe assumption is:

- use synthetic data on any publicly reachable deployment;
- keep real broker data local and outside the hosted route family.

---

# 4. Repository Finding: Legacy Fingerprints Are Not Authoritative Content Identities

`src/lib/execution-sources/import-fingerprints.ts` currently uses a small non-cryptographic 32-bit hash.

It also normalizes numeric fields through JavaScript `Number`, formats them to eight decimal places, and removes trailing zeroes.

Risks:

- 32-bit collisions are possible;
- two different files can share a fingerprint;
- exact decimal precision can be lost before hashing;
- very small or highly precise quantities/prices can normalize incorrectly;
- broker-provided textual precision is discarded;
- an accidental collision can cause a legitimate file or trade to be treated as a duplicate;
- legacy trade fingerprints are unsuitable as content-addressed manifest IDs.

`import-commit-planner.ts` also creates import batch IDs using time and `Math.random()` when a generated time is not supplied. Such IDs are acceptable as local record identifiers, but they cannot participate in a deterministic content hash.

## Mandatory ruling

Legacy fingerprints may remain for migration diagnostics only. They must not be the v3 authority for:

- file identity;
- execution identity;
- duplicate prevention;
- dataset manifest identity;
- evidence identity;
- derivation identity;
- answer identity.

## Cryptographic identity requirement

Use a cryptographic content digest such as SHA-256 through the platform runtime, or a separately approved equivalent.

Every identity includes:

- algorithm;
- canonicalization version;
- domain prefix;
- content digest;
- optional tenant/private namespace where needed.

Example shape:

```text
trader-intelligence:file:v1:sha256:<digest>
trader-intelligence:execution-set:v1:sha256:<digest>
trader-intelligence:dataset:v1:sha256:<digest>
trader-intelligence:derivation:v1:sha256:<digest>
```

Do not expose private source hashes publicly. A file digest can itself be sensitive metadata and remains inside the private data boundary.

---

# 5. Canonical Serialization Is a Required Contract

A cryptographic hash is only deterministic if the same logical content produces the same canonical bytes.

GA0-A must define canonicalization before content-addressed manifests are implemented.

## Canonical JSON/content rules

The policy must define:

- UTF-8 encoding;
- Unicode normalization policy;
- object-key ordering;
- array ordering;
- exact decimal string normalization;
- signed zero policy;
- timestamp format and precision;
- null versus omitted field behavior;
- boolean representation;
- enum case;
- line-ending policy;
- whitespace policy;
- stable serialization of reason-code sets;
- duplicate-key rejection;
- unsupported-number rejection;
- schema version included in the hashed payload.

## Prohibited hash inputs

Do not include values that change without changing the underlying truth:

- database-generated UUIDs;
- random IDs;
- wall-clock `createdAt` values;
- row insertion order when semantic order is different;
- transient job IDs;
- model request IDs;
- display labels;
- localized formatting.

## Ordering requirements

Execution sets require a deterministic total order.

Suggested precedence:

1. normalized execution timestamp;
2. source timestamp precision;
3. broker execution sequence/index when present;
4. broker execution ID when present;
5. order ID;
6. original source row location;
7. canonical content digest.

When two executions remain indistinguishable, mark ordering ambiguity. Do not silently invent a meaningful order.

## Canonicalization verification

Tests must prove:

- field order does not change a digest;
- database IDs do not change a digest;
- line-ending changes do not change a file-content identity when policy says they are equivalent;
- meaningful decimal, fee, side, timestamp, policy, filter, or correction changes do change the digest;
- invalid duplicate JSON keys are rejected;
- cross-platform serialization yields identical digests.

A standard canonical JSON approach may be evaluated, but the adopted rules must be explicitly versioned and tested rather than assumed from a library default.

---

# 6. Execution Identity and Duplicate Resolution Need More Than One Fingerprint

Small/micro-cap traders can legitimately receive repeated fills with the same:

- symbol;
- side;
- quantity;
- price;
- timestamp at the source’s available precision.

This can happen through partial fills, multiple orders, average-fill exports, or low timestamp precision.

A duplicate engine that silently removes identical-looking records can corrupt quantity and P/L.

## Execution identity hierarchy

Preferred authority:

1. broker/account plus stable broker execution ID;
2. broker/account plus correction/bust reference;
3. broker/account plus order ID, fill sequence, timestamp, quantity, and price;
4. canonical fallback identity with ambiguity state.

## Required duplicate states

- `exact_duplicate_same_source`;
- `same_execution_reexported`;
- `broker_correction_or_bust`;
- `possible_duplicate_ambiguous`;
- `legitimate_repeated_fill`;
- `fingerprint_collision_detected`;
- `manual_review_required`.

Rules:

- only exact duplicates are automatically suppressed;
- ambiguous records remain preserved and blocked/reviewed;
- collision detection compares canonical content, not only digest equality;
- corrected executions create immutable correction events;
- fee-only corrections do not rewrite the original fill;
- duplicate decisions are versioned and included in the dataset manifest.

---

# 7. Bitemporal Truth and Correction Semantics

V3 needs to distinguish when something was true from when the system learned or recorded it.

For executions, events, mappings, rules, corrections, and user intent, use explicit temporal fields such as:

- `effective_at` or `valid_from`;
- `valid_to`;
- `source_published_at`;
- `observed_at`;
- `recorded_at`;
- `superseded_at`;
- `corrected_at`.

## Why this matters

- a broker may later correct or bust an execution;
- a filing may be amended;
- a float source may be corrected;
- an instrument mapping may be resolved later;
- a user may add a planned-stop note after the trade;
- a rule may be created after historical trades;
- a market-data provider may repair a split adjustment.

The system must be able to answer both:

- what was known at the decision timestamp;
- what the system currently knows after later corrections.

## Correction policy

- source records remain immutable;
- corrections are append-only events;
- current read models resolve the event stream;
- historical answers retain the manifest they used;
- corrected dependencies mark current answers stale;
- a correction never silently rewrites the evidence behind an old answer.

---

# 8. Factual Position Lifecycle Must Be Separate from Review Disposition

The legacy repository currently supports a user action that marks a trade closed and writes `lifecycleStatus: "closed"` even when a closing execution is not present.

That may be useful for cleaning a review queue, but it is not acceptable as a factual ledger transition.

## Mandatory v3 split

### Ledger-derived position state

Examples:

- `flat_closed_by_executions`;
- `open_quantity_remaining`;
- `prior_inventory_unknown`;
- `reversal_detected`;
- `broker_correction_pending`;
- `manual_reconstruction_review`.

Only executions and audited correction events change factual inventory.

### User review disposition

Examples:

- `review_open`;
- `review_in_progress`;
- `review_complete`;
- `review_dismissed`;
- `review_not_applicable`;
- `user_says_position_closed_elsewhere`.

A user may say the position was closed elsewhere, but that creates a source-coverage limitation, not a synthetic closing fill.

## Compatibility adapter rule

When the legacy adapter encounters `userLifecycleOverride`:

- preserve it as a user annotation;
- do not convert it into a factual v3 closed round trip;
- mark source coverage incomplete;
- exclude the item from realized closed-trade analytics unless closing evidence is imported.

---

# 9. Retrospective Boundary and Open-Position Policy

A retrospective educational journal can become a live-advice system unintentionally if it analyzes an open trade using current market context.

## Required analysis states

- `closed_historical_trade`;
- `open_position_execution_review_only`;
- `same_day_closed_trade`;
- `pending_settlement_or_correction`;
- `coverage_incomplete`;
- `not_eligible_for_coaching`.

## Rules

- open positions do not receive realized P/L conclusions;
- open positions do not receive live hold/sell/target recommendations;
- current quotes are not used to generate directional journal guidance;
- open positions may receive factual execution and exposure review only;
- same-day closed trades remain retrospective but answers state the data cutoff;
- every answer records `analysis_cutoff_at`;
- a tool cannot include executions after its manifest cutoff;
- an active market session does not authorize live coaching.

Optional later policy:

- require a configurable cooling-off period before market-context coaching;
- allow immediate execution-only review after flat.

---

# 10. Immutable Analysis Snapshot and Transaction Consistency

An analysis run must not read a mixture of old and new state while an import, correction, or enrichment job is updating data.

## Required run contract

At run start, resolve:

- dataset manifest ID;
- coverage manifest ID;
- correction cutoff;
- reconstruction policy version;
- eligibility snapshot ID;
- enrichment manifest IDs;
- user-intent/rule cutoff;
- analysis cutoff.

All tool calls in the run use the same immutable snapshot set.

## Required behavior

- a new import does not change an in-progress answer;
- a correction does not partially affect one tool but not another;
- a model cannot combine tool results from different dataset manifests;
- cache keys include the complete snapshot identity;
- completed answers store all snapshot IDs;
- later changes mark the answer stale but do not mutate it.

## Suggested statuses

- `pending`;
- `running`;
- `current`;
- `stale_dependency_changed`;
- `superseded`;
- `blocked`;
- `failed_retryable`;
- `failed_terminal`;
- `deleted_source`.

---

# 11. Stable Evidence References

Database IDs may change after a reimport or migration. Evidence links must remain interpretable.

Use manifest-scoped evidence references containing:

- evidence kind;
- dataset manifest;
- canonical source identity;
- optional execution/round-trip/session semantic identity;
- evidence schema version.

Old evidence links may resolve to:

- the original immutable evidence;
- a superseded state with replacement link;
- deleted/unavailable with an explicit reason.

They must not silently open a different trade that reused the same ticker or database ID.

---

# 12. Runtime Validation and Dimensional Types

TypeScript types do not validate runtime JSON, CSV, database blobs, model responses, or external-source payloads.

Every boundary requires runtime validation:

- broker adapter output;
- canonical executions;
- database reads;
- manifests;
- eligibility results;
- tool arguments;
- tool results;
- external-source payloads;
- AI structured output;
- cached artifacts.

## Numeric dimensions

Do not store undifferentiated numbers where the unit matters.

Examples:

- money requires currency;
- price requires currency and instrument context;
- quantity requires unit/share precision;
- percentage declares ratio versus percent representation;
- duration declares milliseconds/seconds/minutes;
- timestamp declares UTC and source precision;
- volume declares shares versus notional;
- P/L declares gross/net and currency;
- distance declares price units, percent, ATR units, or basis points.

## Reason codes

Eligibility, exclusion, stale, conflict, and failure reasons use stable machine codes with separate user-facing copy.

Do not persist product logic based on matching English error messages.

A runtime validation library may be evaluated, but the contract format and failure policy remain provider-independent.

---

# 13. CSV Parser Hardening Before Authoritative V3 Use

The legacy parser remains valuable, but several edge cases need explicit policy.

## Duplicate normalized headers

Current records are keyed by normalized header. Two different original headers can normalize to the same key, causing a later column to overwrite an earlier column.

V3 must detect and block/review:

- duplicate raw headers;
- duplicate normalized headers;
- two canonical fields mapped to the same source column;
- one canonical field mapped to several conflicting columns.

## Malformed quoting

The parser must detect:

- unterminated quoted fields;
- illegal quote placement;
- unexpected trailing content;
- embedded line-break edge cases.

Do not accept a document merely because the scan reached end-of-file.

## Row shape

Detect:

- too few columns;
- too many columns;
- inconsistent row widths;
- empty required cells;
- duplicate execution IDs with different content;
- control characters and NUL bytes;
- oversized cells;
- unsupported encoding;
- ambiguous delimiter detection.

## Export safety

If the product later exports CSV, cells beginning with spreadsheet formula characters must be escaped according to a versioned export policy.

## Testing

- property/fuzz tests for parser invariants;
- broker fixture tests;
- malformed corpus;
- deterministic row and issue identities;
- no silent header overwrite;
- bounded memory/size limits for hosted mode.

---

# 14. SQLite Backup and Restore Must Be WAL-Safe

The current repository enables SQLite WAL mode. Copying only the primary database file while writes are active can omit WAL content or produce an inconsistent backup.

## Private-alpha backup contract

Use an approved consistent method such as:

- SQLite online backup API;
- an explicitly tested `VACUUM INTO` flow where appropriate;
- a coordinated checkpoint plus verified copy when proven safe.

Requirements:

- pause or coordinate writes as required;
- include schema version;
- encrypt backup artifacts;
- calculate private backup hashes;
- run integrity checks;
- restore into an isolated location;
- verify counts, execution-set digest, manifest digest, and representative tool results;
- record restore-test date and result;
- do not call a backup successful until restore is demonstrated.

---

# 15. AI Replay Semantics

A provider model alias may change over time. Recalling the same model name and prompt does not guarantee byte-identical prose.

V3 must distinguish:

- **evidence replay** — rerun deterministic tools against the stored manifest;
- **answer artifact replay** — display the immutable saved provider response;
- **answer regeneration** — create a new response using current model/prompt policy.

Requirements:

- store provider request/response identifiers when available;
- store the validated structured model response;
- store the final rendered answer artifact;
- store tool claims and validation result;
- label regenerated answers as new artifacts;
- never present a regenerated answer as the original answer;
- deterministic truth must replay without the model.

---

# 16. Evaluation Isolation and Owner Bias

The owner is currently:

- the trader;
- product owner;
- developer;
- calibrator;
- evaluator.

That is acceptable for private alpha, but it creates a strong risk of overfitting to familiar trades and preferred explanations.

## Required dataset partitions

- `calibration_set` — used to develop tools and prompts;
- `holdout_set` — not used while tuning;
- `regression_set` — frozen failures and critical scenarios;
- `private_acceptance_set` — owner-reviewed examples used for release gates.

## Required evaluation controls

- freeze manifests before evaluation;
- blind comparison labels for v2, deterministic-only, v3 AI, and abstention where practical;
- pre-register evaluation questions;
- record expected numerical answers before seeing AI prose;
- keep holdout feedback separate from calibration changes;
- do not repeatedly retune on the same holdout set;
- include incorrect-but-plausible adversarial answers;
- score trust, novelty, evidence use, limitation quality, and actionability separately.

## Exploration ledger

Repeatedly asking slightly different questions can become hidden data dredging.

Record:

- analysis family;
- question/parameter variations;
- filters tried;
- exploratory scan count;
- optimization attempts;
- selected result;
- holdout/prospective state.

The AI may not keep slicing until it finds a dramatic conclusion and then omit the search history.

---

# 17. Degraded and Offline Behavior

The private alpha must remain useful when:

- an external source is unavailable;
- market data is incomplete;
- the AI provider is disabled;
- a source changes terms;
- a source correction invalidates a snapshot;
- a model quota is exhausted.

Required behavior:

- execution-only analytics continue when enrichment fails;
- deterministic tool output remains available without AI;
- existing qualified snapshots remain available with freshness labels;
- unsupported claims disappear rather than being approximated;
- source outages are visible in diagnostics;
- a disabled model returns the deterministic answer and evidence;
- no automatic fallback to runtime web search.

---

# 18. Performance and Resource Budgets

Private alpha does not need public-scale infrastructure, but it still needs bounded behavior.

Define budgets for:

- maximum private upload bytes;
- maximum rows per import;
- maximum cell length;
- parser memory;
- reconstruction time;
- manifest generation time;
- analytics-tool latency;
- simulation trade count;
- evidence bundle size;
- AI prompt and output tokens;
- cached artifact storage;
- cancellation timeout.

Add synthetic performance fixtures representing:

- several years of executions;
- many partial fills;
- repeated same-ticker attempts;
- overlapping imports;
- large evidence sets.

Avoid O(n²) reconstruction or comparison paths unless a strict small bound is enforced and tested.

---

# 19. Additional Official/Free Source Opportunities

These are later GA3 candidates only. They do not change GA0-A or GA0-B scope.

## Nasdaq Reg SHO threshold list

Potential use:

- historical threshold-security context when a dated official snapshot is available;
- educational review of settlement/fail-to-deliver context.

Limitations:

- threshold status is not short interest;
- threshold status does not prove a squeeze;
- it does not identify which participant is short;
- it cannot create a bullish/bearish verdict;
- daily snapshots and source timestamps are required;
- terms and future public-profile permission require review.

## SEC trading suspensions

Potential use:

- distinguish regulatory trading suspensions from ordinary exchange volatility halts;
- source-backed historical suspension context;
- prevent incorrect classification of a multi-day absence as a normal LULD halt.

Limitations:

- a regulatory suspension is a different event class from an exchange volatility pause;
- source order/release and effective times must be stored;
- instrument identity must be resolved historically.

## Do not assume free corporate-action feeds

Some exchange corporate-action APIs are commercial products. Do not add a source to the free-source plan merely because documentation or sample data is publicly visible.

## No free historical NBBO assumption

The architecture should continue to assume that comprehensive historical quote/NBBO coverage may require a paid or licensed provider.

---

# 20. Delivery Correction: The Existing Gate 0 Plan Is No Longer the Active File-Level Plan

The existing `trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md` still defines weekday analytics and the daily-stop simulation as part of the first vertical slice.

The controlling specification now places those tools in GA0-B.

That conflict is too important to leave to interpretation.

## Required correction

Create and activate a dedicated plan:

`src/docs/trader-intelligence-v3-ga0-a-control-and-exact-truth-implementation-plan-2026-07-17.md`

The old Gate 0 plan becomes an umbrella/historical plan. It does not control the next coding PR.

## GA0-A delivery slices

### GA0-A1 — Containment and Architecture Boundaries

- deployment/hosting contracts;
- owner-route containment contract;
- current-system inventory;
- legacy path classifications;
- private-data repository guards;
- architecture dependency rules;
- no real hosted data without auth gate.

### GA0-A2 — Canonical Execution and Exact Financial Truth

- exact decimal wrappers;
- canonical serialization/hash ADR;
- execution identity and ordering;
- duplicate/collision states;
- P/L/reconstruction policy;
- independent reference math;
- first exact synthetic fixtures.

### GA0-A3 — Temporal, Manifest, and Eligibility Truth

- bitemporal correction contract;
- factual lifecycle versus review disposition;
- retrospective/open-position policy;
- content-addressed dataset manifest;
- coverage contract;
- analysis eligibility;
- immutable analysis snapshot;
- stable evidence reference contract;
- runtime validation contracts.

Each slice receives a focused review before the next one begins.

GA0-B may begin only after all GA0-A acceptance criteria pass.

---

# 21. Fourth-Pass Acceptance Criteria

The fourth pass is incorporated when:

- one dedicated GA0-A plan is active;
- the old Gate 0 plan is marked umbrella/historical for execution scope;
- private hosted route containment is a GA0-A1 blocker;
- legacy 32-bit fingerprints are migration-only;
- canonical serialization and cryptographic hashing are specified;
- execution duplicate/collision states are specified;
- same-timestamp ordering ambiguity is handled;
- user review disposition cannot change factual inventory;
- open positions cannot become closed trades without execution evidence;
- bitemporal corrections are specified;
- analysis snapshot consistency is specified;
- stable evidence IDs are manifest-scoped;
- runtime validation and dimensional units are specified;
- parser collision/malformed-input tests are planned;
- WAL-safe backup and restore are specified;
- AI replay semantics distinguish stored artifact from regeneration;
- calibration/holdout/regression partitions are specified;
- an exploration ledger prevents hidden repeated slicing;
- degraded mode remains deterministic and useful;
- performance budgets are assigned before large private imports;
- GA0-A is split into reviewable delivery slices.

---

# 22. Final Fourth-Pass Directive

The next implementation should not optimize for visible progress. It should optimize for making silent corruption difficult.

The trusted chain is now:

```text
contained owner-only environment
  -> canonical source identity
  -> exact immutable executions
  -> explicit corrections and temporal meaning
  -> ledger-derived position state
  -> content-addressed consistent dataset snapshot
  -> capability eligibility and exclusions
  -> deterministic calculation
  -> stable evidence reference
  -> evaluated explanation
```

The engineering standard is:

> IDs, hashes, user review actions, correction timestamps, and cache behavior are part of financial correctness, not supporting infrastructure.

The product standard is:

> An answer must never become more confident because the system silently dropped ambiguous records, reclassified an open position, mixed snapshots, or lost evidence during a reimport.

The delivery standard is:

> Complete containment and canonical truth first, exact financial semantics second, manifest and temporal truth third, and only then build the first analytics tools.
