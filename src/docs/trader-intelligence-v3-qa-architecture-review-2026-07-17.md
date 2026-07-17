# Trader Intelligence v3 QA and Architecture Review

**Date:** 2026-07-17 America/Toronto  
**Status:** Mandatory architecture amendments; conditionally approved  
**Reviewed plan:** `src/docs/trader-intelligence-ai-journal-v3-master-plan-2026-07-17.md`  
**Repository:** `traderslink-bot/traderslink-trader-improvement-system`  
**Authority:** This review is a required control document for Trader Intelligence v3. Where it conflicts with the master plan, this review controls until the master plan is revised.

---

## 1. Executive Verdict

The v3 master plan has the correct product direction:

- preserve deterministic import and trade-reconstruction work;
- make calculations authoritative and AI explanatory;
- build controlled analytics and simulation tools;
- link every meaningful claim to evidence;
- replace fixed-template coaching as the final interpretation layer;
- stop treating noisy nearest support/resistance as useful coaching evidence.

That direction is approved.

The plan is **not yet approved for production implementation as written**. It is approved only for internal scaffolding while the blocking amendments in this review are applied.

The most important correction is that the current repository contains a valuable **prototype and domain foundation**, but the current Trader Intelligence persistence, identity, tenancy, and background-job paths must not be described or reused as production-ready infrastructure.

Current repository evidence includes:

- the import service still builds plans with `DEMO_WORKSPACE_ID`, `DEMO_USER_ID`, and `DEMO_ACCOUNT_ID`;
- the import commit route directly creates a SQLite repository and does not establish a server-derived Trader Intelligence authorization context;
- production SQLite defaults to a temporary filesystem location;
- current site authentication is Academy-oriented Discord authentication rather than a shared multi-tenant Trader Intelligence identity boundary;
- post-import chart review is started through Next.js `after()`, which is not a durable critical-job guarantee;
- the existing level snapshot already exposes final level zones with low/high bounds, touch counts, confluence, source types, timeframes, freshness, and quality-related fields, so v3 must not blindly duplicate the level engine by building a second full detector;
- the general CI workflow currently runs tests plus legacy Layer 2 and Layer 3 verification, but it does not yet enforce the complete v3 typecheck, build, database-contract, security, or AI-evaluation matrix.

The correct engineering ruling is:

> Preserve proven parsing, normalization, reconstruction, replay-safety, and test ideas. Replace or harden the current production boundaries before storing real multi-user trading data.

---

## 2. QA Severity Summary

### P0: Must be resolved before any production user data is accepted

1. Plan-governance conflict between the new v3 plan and the old active plan chain.
2. Missing shared platform identity and server-derived tenancy boundary.
3. Ephemeral/demo persistence still present in the current Trader Intelligence path.
4. No explicit fixed-precision money, price, quantity, and rounding contract.
5. No explicit analytical P/L accounting policy for partial fills, prior inventory, reversals, shorts, and multi-currency records.
6. Critical enrichment and report jobs do not yet have a durable orchestration contract.
7. The production upload design still needs a file-storage, size-limit, streaming, retention, and deletion policy.

### P1: Must be resolved before AI coaching is released

1. Market-data price-basis and instrument-identity contracts need to be stronger.
2. The support/resistance redesign risks duplicating capabilities already present in `levels-system-v2`.
3. Statistical thresholds need independence, clustering, discovery, holdout, and leakage rules.
4. Counterfactual simulations need intervention and execution policies, not only formulas.
5. AI grounding needs a claim-level validator and release evaluation gate.
6. Migration needs one authoritative write path rather than indefinite dual-write.
7. CI needs v3-specific required checks.
8. User deletion, retention, consent, and auditability cannot wait until the final beta phase.

### P2: Must be resolved before broad public launch

1. Operational SLOs, backup, recovery, and provider-failure runbooks.
2. Atomic AI quota reservation and cost reconciliation.
3. Accessibility and mobile evidence-navigation acceptance criteria.
4. Explicit launch scope for short-side coaching and cross-currency analytics.
5. Human calibration and product-usefulness benchmarks.

---

## 3. Mandatory Amendment: Planning Authority and Handoff Chain

The master plan says it supersedes older plans, but the repository root `plan.md` and `src/docs/trader-intelligence-plan-index.md` still point future work toward the May continuous UX and deterministic coaching plans.

That contradiction is a P0 governance defect because a future engineering run could follow the old active batch and continue expanding the system that v3 is intended to replace.

The controlling order for v3 must be:

1. latest v3 project-log entry;
2. this QA and architecture review;
3. the v3 master plan;
4. the current v3 phase or implementation-run plan;
5. legacy plans only as implementation history or evidence about preserved modules.

Rules:

- No new deterministic coaching family may be added to the legacy final-output path unless it fixes a production defect or is explicitly required for migration parity.
- No route redesign should begin before its v3 read model exists.
- No old plan may be treated as active merely because it still says `Status: Active`.
- Legacy docs remain in the repository; they are not deleted, but they are historical unless explicitly referenced by a v3 task.

---

## 4. Mandatory Amendment: Preserve the Right Parts of the Current System

The master plan should distinguish between **domain value** and **production readiness**.

### Preserve and adapt

- broker-specific header knowledge;
- deterministic CSV parsing and row diagnostics;
- file and trade fingerprints;
- duplicate detection concepts;
- timezone handling;
- execution normalization;
- flat-to-flat grouping logic and diagnostics;
- open-position and sell-starting warnings;
- replay-safe candle retrieval and basis warnings;
- no-lookahead contracts;
- existing synthetic and real-data calibration patterns;
- saved-trade, ticker-story, and day-session product concepts;
- product-safe evidence language and fail-closed behavior mapping;
- Playwright journeys and fixture ideas.

### Do not preserve as production architecture without replacement

- hard-coded demo workspace, user, and account IDs;
- direct route construction of a SQLite repository;
- temporary-filesystem production persistence;
- request-lifecycle background processing for critical work;
- route-local authorization assumptions;
- JSON blobs as the primary multi-user query model;
- nearest-level-only consumption as sufficient structural context;
- fixed coaching templates as final coaching authority;
- broad trader-identity labels without measurable evidence.

### Required wording change

Future documentation should call the current persistence lane a **local/prototype persistence foundation**, not a trustworthy production ledger.

---

## 5. Mandatory Amendment: Shared Identity, Authorization, and Tenancy

Trader Intelligence v3 must not create a second disconnected identity system and must not trust tenancy values sent by the browser.

### 5.1 Platform identity decision

Phase 0 must make and document one decision:

- refactor the existing authenticated site user into a shared platform identity that Academy and Trader Intelligence can both consume; or
- introduce a new shared platform auth layer and migrate Academy to it deliberately.

The recommended first path is to create a shared platform-user abstraction backed by the existing authenticated user record, while keeping the implementation open to additional identity providers later.

Discord identifiers must not become the primary domain key. Use an internal stable user ID.

### 5.2 Required authorization context

Every v3 repository and tool call must require a server-created context similar to:

```ts
interface TraderIntelligenceAuthorizationContext {
  userId: string;
  workspaceId: string;
  accountIds: string[];
  role: "owner" | "member" | "admin" | "support";
  entitlements: string[];
  requestId: string;
}
```

Rules:

- `userId`, `workspaceId`, and permitted `accountIds` are resolved from the authenticated session on the server.
- Browser-supplied IDs may identify a requested object, but they never grant access.
- Every repository query includes the workspace/account boundary.
- Every evidence link is re-authorized when opened.
- Admin/support access is explicit, audited, and cannot be inferred from a URL.
- Background jobs carry a signed or server-created tenant context, not a raw browser token.

### 5.3 Defense in depth

Use both:

- application-level authorization checks; and
- PostgreSQL row-level security or equivalent database policies where practical.

Required tests:

- user A cannot read user B imports, executions, trades, findings, notes, AI threads, reports, or evidence;
- guessed IDs return not found or forbidden without leaking existence;
- background jobs cannot cross workspaces;
- cached answers are tenant-scoped;
- support/admin access creates an audit event;
- deletion jobs cannot delete another workspace.

### 5.4 Production gate

No production CSV upload or saved-trade write may be enabled while any v3 path uses demo identity constants.

---

## 6. Mandatory Amendment: Exact Financial Types and Accounting Policy

Saying that financial truth is deterministic is necessary but not sufficient. The plan must also define how numeric truth is represented.

### 6.1 No floating-point authority

JavaScript `number`, PostgreSQL `REAL`, and binary floating-point values must not be the authoritative representation for:

- money;
- execution price;
- fees;
- share quantity;
- FX rates;
- calculated P/L;
- percentage simulation thresholds that affect fills.

Use fixed-precision decimal arithmetic in application code and PostgreSQL `NUMERIC` or another exact representation in storage.

Canonical serialized values should use decimal strings. Display rounding is separate from calculation rounding.

Suggested domain contracts:

```ts
type DecimalString = string;

interface MoneyAmount {
  value: DecimalString;
  currency: string;
}

interface PriceAmount {
  value: DecimalString;
  currency: string;
}

interface ShareQuantity {
  value: DecimalString;
}
```

The exact decimal library must be selected in Phase 0 and wrapped behind domain helpers so it can be tested independently.

### 6.2 Rounding policy

The system must version and test:

- broker-reported precision;
- exchange tick size;
- fee precision;
- FX precision;
- intermediate calculation precision;
- final display precision;
- reconciliation tolerance.

Do not round intermediate position-cost calculations merely because the UI displays two decimals.

### 6.3 Analytical P/L is not tax P/L

The system must explicitly distinguish:

- broker-reported P/L;
- v3 analytical trade P/L;
- account cash movement;
- tax-lot P/L.

The journal should not claim to calculate tax P/L unless a separate tax-lot product is intentionally built.

### 6.4 Position-cost policy

The reconstruction policy must define:

- average-cost versus FIFO treatment for analytical round trips;
- treatment of partial fills;
- treatment of fees on entries and exits;
- short-sale proceeds and buy-to-cover costs;
- position reversals;
- sells that close inventory opened before the imported date range;
- broker average-fill rows versus individual fill rows;
- open inventory at the end of the file;
- corporate actions;
- currency conversion.

The selected policy must be versioned and included in every reconstructed trade and tool result.

### 6.5 Multi-currency rule

The system may import records in multiple currencies, but it must not add USD and CAD P/L together as though they were the same unit.

Until a versioned FX service exists:

- report per-currency results separately;
- block cross-currency totals;
- explain the limitation.

When FX conversion is added, store the source, timestamp, rate, direction, and policy version used.

---

## 7. Mandatory Amendment: Production File Ingestion

The current JSON `csvText` request shape is useful for local prototypes and tests, but it should not be the production ingestion architecture for large or sensitive broker files.

### 7.1 Required production flow

```text
Authenticated user
  -> request upload authorization
  -> signed upload to encrypted object storage
  -> create import file record and checksum
  -> enqueue durable parse job
  -> stream/parse file server-side
  -> persist row outcomes and repair state
  -> reconstruct and reconcile
  -> commit accepted ledger facts
```

### 7.2 Required controls

- maximum file bytes;
- maximum row count;
- maximum column count;
- accepted delimiters and encodings;
- MIME/content sniffing rather than filename trust;
- streaming or bounded-memory parsing;
- request and job timeouts;
- formula-like cell values treated as untrusted text;
- encrypted raw-file storage;
- checksum and immutable source metadata;
- configurable raw-file retention;
- deletion workflow;
- no raw CSV content in normal application logs;
- no full account number in object keys;
- sanitized mapping-assistant samples.

### 7.3 Import idempotency

State transitions must use compare-and-set or transactional checks. Unique constraints must protect:

- committed file fingerprint per account;
- accepted broker execution ID when available;
- reconstruction policy version plus execution set;
- job idempotency key.

A retry must not create duplicate executions, trades, findings, or reports.

---

## 8. Mandatory Amendment: Durable Background Work

Critical work must not rely on the life of a web request.

The current use of Next.js `after()` can remain for non-authoritative local convenience, but it is not sufficient as the production guarantee for:

- market-data hydration;
- feature backfills;
- report generation;
- setup-classification batches;
- AI batch submission and result collection;
- migration backfills;
- deletion and retention jobs.

### 8.1 Required pattern

Use:

1. a database transaction for the authoritative state change;
2. a transactional outbox record in the same transaction;
3. a durable workflow/queue adapter that claims the outbox event;
4. idempotent steps;
5. bounded retries and terminal failure state;
6. resumable progress;
7. job cancellation and tenant deletion awareness;
8. observability and replay.

### 8.2 Provider decision

The domain must use a provider-independent job interface.

A time-boxed Phase 0 spike may evaluate Vercel Workflow because the application is deployed on Vercel and the product needs multi-step, crash-safe processing. It must not be coupled directly into financial domain code, and its beta status and version-security requirements must be considered. A different durable queue may be selected if it provides a safer production fit.

### 8.3 Required job contract

Every job must include:

- job ID;
- type and version;
- workspace/account scope;
- input snapshot ID;
- idempotency key;
- attempt count;
- created/started/completed timestamps;
- status;
- progress summary;
- error classification;
- retry policy;
- cancellation state;
- output snapshot IDs.

---

## 9. Mandatory Amendment: Instrument Identity and Market-Data Basis

Ticker symbol alone is not a durable instrument identity.

### 9.1 Instrument contract

Where available, store:

- internal instrument ID;
- symbol at execution time;
- exchange/listing venue;
- asset type;
- currency;
- provider instrument identifiers;
- symbol-change history;
- delisted status;
- corporate-action references.

### 9.2 Price-basis contract

Every market-data snapshot and derived feature must state:

- raw or adjusted basis;
- adjustment factor when known;
- provider;
- provider symbol;
- requested and returned interval;
- market calendar;
- timezone;
- coverage window;
- retrieval time;
- content hash or provider revision identifier;
- completeness state.

Execution prices and historical candles must be basis-aligned before VWAP, MFE, MAE, extension, support/resistance, or simulation calculations are allowed.

A basis mismatch must fail closed to execution-only analysis. It must not be repaired by guessing.

### 9.3 Market-time rules

- Use an exchange calendar, not only weekday checks.
- Handle daylight saving transitions.
- Preserve premarket, regular, and postmarket boundaries.
- Define how halts and missing bars are represented.
- Record whether the current bar was complete at each decision timestamp.
- Decision-time features may not use a bar close that was unavailable at that decision time.

---

## 10. Mandatory Amendment: Support and Resistance Redesign

The user’s complaint is valid: a large number of nearby levels can make technically correct feedback practically useless.

The master plan correctly introduces congestion and fail-closed coaching. The implementation approach needs one major correction.

### 10.1 Do not duplicate `levels-system-v2`

The current level-analysis snapshot already exposes `LevelAnalysisFinalLevelZone` objects with:

- `zoneLow` and `zoneHigh`;
- representative price;
- strength score and label;
- touch count;
- confluence count;
- source types;
- timeframe sources;
- reaction/rejection/displacement information;
- first and last timestamps;
- freshness;
- extension metadata.

Therefore, v3 should not assume it receives only raw point levels and immediately build a second independent level detector.

### 10.2 Rename the new responsibility

The new v3 component should be the **Zone Usability and Congestion Layer**.

Its responsibilities are:

- consume replay-safe final zones from the saved `levels-system-v2` snapshot;
- deduplicate or merge only demonstrably overlapping duplicate zones across buckets/timeframes;
- preserve all source-zone IDs and evidence links;
- calculate local congestion around the decision price;
- determine whether clear space exists;
- select at most one primary zone per side;
- suppress level-based conclusions when structure is crowded, unstable, stale, synthetic-only, or basis-unsafe;
- produce a compact AI-safe context contract.

It must not:

- rerun candle detection locally;
- silently replace `levels-system-v2` scoring;
- invent a cleaner level because the real structure is messy;
- choose the closest zone when the distinction is not material;
- convert proximity alone into a mistake or recommendation.

### 10.3 Full-zone snapshot access

The current execution-level context commonly exposes nearest support/resistance and bucket counts. That is insufficient for congestion analysis.

The v3 adapter must read the complete replay-safe final-zone map from the saved snapshot, while continuing to enforce:

- as-of timestamp;
- no-lookahead safety;
- synthetic marking;
- diagnostics;
- limitations;
- price-basis safety.

### 10.4 Revised release order

The first Ask AI release may be execution-only.

Until the Zone Usability and Congestion Layer passes its calibration gate:

- v3 AI tools must not consume legacy nearest-level coaching conclusions;
- level fields must be absent or explicitly unavailable in AI tool results;
- existing level review may remain visible in legacy routes, clearly separated from v3 conclusions.

Only after the zone gate passes may level context become supporting evidence in v3 AI answers.

### 10.5 Stability acceptance tests

In addition to the master-plan tests, require:

- small price movement inside the same congestion neighbourhood does not flip the conclusion;
- adding or removing one weak candidate does not change the primary zone without material evidence;
- identical final zones in different source buckets do not count as independent confluence;
- overlapping support and resistance produces `congested_structure` rather than two confident claims;
- synthetic continuation levels never create historical support/resistance coaching;
- output identifies why a conclusion was suppressed;
- human reviewers prefer the new output to the legacy nearest-level output on a blinded real-trade set.

---

## 11. Mandatory Amendment: Feature and Dataset Versioning

A prompt version is not enough to reproduce an answer.

Every analytics and AI answer must bind to a dataset version containing at least:

- import file version;
- accepted execution ledger version;
- correction-event cutoff;
- reconstruction policy version;
- market-data snapshot IDs and basis;
- feature definition versions;
- setup taxonomy version;
- user-correction cutoff;
- date/account/setup filters;
- analysis tool version;
- evidence policy version.

Cache keys must include the dataset version and authorization scope.

A cached answer must be invalidated when:

- executions are corrected;
- a trade is regrouped;
- fees change;
- market-data basis changes;
- features are backfilled under a new version;
- a setup label is corrected and the active filter depends on it;
- a rule definition changes;
- entitlements or workspace access change.

---

## 12. Mandatory Amendment: Statistical Integrity

The master plan’s sample-size and outlier sections are useful, but raw trade count is not the same as independent evidence.

### 12.1 Unit of analysis

Trades from the same day, ticker story, market regime, or repeated attempt sequence are correlated.

Tools must declare their analytical unit:

- execution;
- round trip;
- ticker story;
- day session;
- week/month;
- account.

Confidence intervals and resampling should generally cluster by day session or ticker story when repeated trades within a cluster are not independent.

### 12.2 Effective sample size

A Friday result containing 30 trades from two unusual Fridays is not equivalent to 30 independent Fridays.

Tool outputs should include both:

- observation count; and
- independent cluster count.

Confidence may be limited by the smaller effective sample.

### 12.3 Direct questions versus automatic discovery

Separate:

- **direct analysis**: the user asks a specific pre-declared question; and
- **discovery analysis**: the system scans many dimensions looking for the strongest result.

Discovery requires stronger evidence, multiple-comparison control, and clear exploratory wording.

The system must not scan hundreds of buckets and present the most extreme one as a proven personal edge.

### 12.4 Chronological validation

For rules, setup performance, and “best” parameter selection:

- use a chronological training/evaluation split when sample size permits;
- avoid random shuffling that leaks future behavior into past evaluation;
- report in-sample and holdout performance separately;
- track prospective results after activation;
- never call a rule validated solely because it was optimized on the same historical trades used to score it.

### 12.5 Leakage rules

Decision-time behavioral features must use only information available before the decision when the claim concerns decision quality.

Examples:

- “size versus recent median” should use prior trades for decision-time coaching, not future trades in the selected report period;
- setup classification at entry cannot use later P/L unless it is explicitly an outcome-defined setup such as a failed breakout;
- confidence calibration cannot use the answer’s own outcome as an input unless the task is retrospective classification.

### 12.6 Minimum required output

Where relevant, include:

- observation count;
- independent cluster count;
- comparison count;
- total, average, and median;
- win rate and expectancy;
- dispersion;
- largest observation contribution;
- outlier-removed result;
- clustered bootstrap interval or justified alternative;
- effect size;
- period/regime sensitivity;
- discovery/direct-analysis status;
- holdout/prospective status.

Sample thresholds remain policy guidance, not proof by themselves.

---

## 13. Mandatory Amendment: Counterfactual Simulation Policy

A simulation must define not only the target price but what parts of the historical decision sequence are held fixed and what parts are replaced.

### 13.1 Intervention contract

Every simulation must specify:

- intervention start time;
- actual decisions preserved;
- actual decisions removed;
- hypothetical decisions inserted;
- position state after each intervention;
- whether later actual adds/reductions remain valid;
- fill model;
- fee/slippage model;
- account-equity update policy;
- missing-data policy;
- ambiguity policy.

### 13.2 Partial-exit example

For “sell half at +10%,” the tool must not combine a hypothetical sale with later actual reductions as though the trader still held the original quantity.

The policy must choose and label one of these approaches:

- replace the first qualifying reduction and proportionally rescale later exits;
- insert the hypothetical reduction and replay later actual reductions only up to remaining size;
- replace the complete exit schedule after the intervention with a declared remainder policy.

The user-facing result must state the selected policy.

### 13.3 Daily-stop example

For “stop after two losses”:

- preserve trades up to and including the triggering loss;
- remove later trades that day;
- do not invent replacement trades;
- recompute sequential account equity when size rules depend on equity;
- report days helped and harmed;
- report whether a few days dominate the result.

### 13.4 Intrabar ambiguity

When target and stop are both inside the same bar and order is unknown:

- use quote/trade data when licensed and available;
- otherwise return a conservative/base/optimistic range or an explicit ambiguous result;
- do not silently assume the favourable event occurred first.

### 13.5 Liquidity

At minimum, disclose when the assumed fill size is large relative to known bar volume or when quote/spread data is unavailable. Do not present a theoretical high/low touch as guaranteed executable liquidity.

### 13.6 Language

Prefer:

> Under the stated fill, fee, and remainder assumptions, the historical result would have been approximately...

Avoid:

> You would have made...

without the assumptions immediately visible.

---

## 14. Mandatory Amendment: AI Grounding and Release Evaluation

### 14.1 Claim ledger

Analytics tools should return machine-readable claim objects, not only free-form summaries.

Suggested shape:

```ts
interface AnalysisClaim {
  claimId: string;
  metricKey: string;
  formattedValue: string;
  rawValue: string | number | null;
  comparisonValue: string | number | null;
  direction: "positive" | "negative" | "mixed" | "neutral" | "insufficient";
  evidenceIds: string[];
  limitationIds: string[];
}
```

The model may reference allowed claim IDs. The server owns evidence IDs and final links.

### 14.2 Numeric claim validator

Before an answer is shown:

- every material number in the structured response must map to an allowed tool claim;
- formatting differences must remain within a defined tolerance;
- unsupported evidence IDs fail validation;
- the answer cannot upgrade `insufficient` or `exploratory` into a confident finding;
- limitations cannot be omitted when the referenced claim requires them.

### 14.3 Tool-loop limit

Use a deterministic fast path for known questions where practical.

For open questions:

- one planning/tool-selection call;
- bounded approved tool execution;
- one explanation call;
- a strict maximum loop and token budget.

The model must not repeatedly call tools until it finds a desirable result.

### 14.4 Untrusted user content

Treat these as data, never instructions:

- CSV cells;
- imported descriptions;
- broker notes;
- user trade notes;
- setup labels;
- news text;
- catalyst text.

Prompt-injection tests must prove that instructions embedded in those fields cannot alter tool permissions, reveal system prompts, bypass tenant isolation, or create live trade instructions.

### 14.5 Provider data policy

Before production AI use, document:

- which fields may be sent to the model provider;
- provider retention settings;
- whether provider training is disabled for API data under the selected terms;
- deletion propagation;
- regional requirements if applicable;
- redaction rules;
- incident-response contacts.

Raw CSV files and full account identifiers must never be sent to the explanation model.

### 14.6 Release gate

No model or prompt version may be promoted without:

- a frozen evaluation dataset;
- tool-selection accuracy;
- claim-grounding accuracy;
- citation precision and recall;
- insufficient-evidence preservation;
- adversarial prompt-injection tests;
- cost and latency measurement;
- comparison against the current production version;
- canary or shadow rollout;
- rollback configuration.

Normal CI should use recorded model outputs or a deterministic fake. A scheduled or manually approved evaluation may call live models.

---

## 15. Mandatory Amendment: AI Cost and Quota Correctness

Usage limits must be concurrency-safe.

Required flow:

1. calculate the maximum permitted request budget;
2. atomically reserve quota before the model call;
3. execute the call;
4. write provider usage;
5. reconcile reservation to actual cost;
6. release unused reservation;
7. preserve the charge and failure state on timeout/retry according to policy.

Required controls:

- user monthly allowance;
- workspace daily dollar cap;
- per-feature maximum;
- per-request maximum;
- maximum tool calls;
- maximum retries;
- batch budget;
- admin emergency shutoff;
- model allowlist;
- cached-response policy;
- cost anomaly alerts.

Do not expose “unlimited AI” until observed cost and abuse behaviour support it.

---

## 16. Mandatory Amendment: Migration and Source of Truth

Long-lived dual-write is rejected.

### 16.1 Migration stages

1. **Read-only shadow:** v3 reads existing committed data through adapters and writes only v3 derived shadow records.
2. **Parity:** counts, quantities, P/L, fees, lifecycle state, and evidence links are compared.
3. **Controlled backfill:** versioned, resumable jobs create v3 records with mapping IDs.
4. **Write cutover:** one explicitly selected persistence path becomes authoritative for new imports.
5. **Legacy compatibility:** old routes read through an adapter if rollback display is required.
6. **Retirement:** legacy final coaching is disabled after acceptance criteria pass.

### 16.2 Rules

- Never write the same authoritative execution independently to two databases without a transactionally reliable replication design.
- Preserve source rows and fingerprints.
- Use migration mapping tables.
- Record per-account migration status.
- Reconcile before and after backfill.
- A UI rollback must not create a second write authority.
- Backfills must be resumable and idempotent.
- Deletion must affect both legacy and v3 records during the transition.

---

## 17. Mandatory Amendment: Data Lifecycle, Privacy, and Recovery

Deletion and retention cannot be postponed to Phase 10 because raw broker files and account data exist from the first production import.

Phase 1 must define and implement the minimum lifecycle contract:

- raw-file retention period;
- parsed-row retention;
- AI conversation retention;
- report retention;
- user-initiated deletion;
- account deletion versus workspace deletion;
- legal/operational hold policy if ever needed;
- backup retention;
- deletion from primary storage, object storage, caches, and queued jobs;
- deletion audit event;
- export format for user-owned journal data;
- AI processing consent and opt-out.

Production persistence must provide backups and point-in-time recovery appropriate to the selected database plan.

A restore drill is required before broad beta.

---

## 18. Mandatory Amendment: Scope Decisions

The following scope is approved for the first paid MVP:

- U.S.-listed equities;
- execution CSV imports;
- strongest calibration for IBKR and Moomoo;
- generic mapped CSV as a controlled fallback;
- options quarantined;
- historical/delayed market analysis;
- no automatic order execution;
- no live trade signals;
- no tax reporting.

### Direction policy

- The execution ledger and reconstruction engine must preserve valid long and short executions.
- Sell-starting records with unknown prior inventory remain `needs_review` rather than being guessed.
- Short-specific setup and coaching conclusions remain gated until a real short-trade calibration set exists.
- Generic long/short P/L and lifecycle facts may be shown when reconstruction is reconciled.

### Currency policy

- Import supported currencies.
- Report each currency separately until versioned FX conversion exists.
- Do not advertise a consolidated account return across currencies without that service.

---

## 19. Revised Architecture

```text
Authenticated platform user
        |
        v
Server-derived authorization context
        |
        v
Signed raw-file upload + immutable checksum
        |
        v
Durable import workflow
        |
        +--> import rows / issues / repair state
        |
        v
Exact canonical execution ledger
        |
        v
Versioned position and round-trip reconstruction
        |
        +-------------------------------+
        |                               |
        v                               v
Execution-only exact facts       Replay-safe market snapshots
                                        |
                                        v
                              Zone usability/congestion
        |                               |
        +---------------+---------------+
                        |
                        v
               Versioned feature snapshots
                        |
                +-------+-------+
                |               |
                v               v
          Analytics tools   Simulation tools
                |               |
                +-------+-------+
                        |
                        v
              Claim/evidence validation
                        |
                +-------+-------+
                |               |
                v               v
          Ask AI explanation   Batch reports
                        |
                        v
               Evidence-linked product UI
```

Cross-cutting boundaries:

- exact decimal math;
- tenancy and RLS;
- dataset versioning;
- durable jobs and outbox;
- audit events;
- cost reservations;
- retention/deletion;
- observability;
- feature flags and rollback.

---

## 20. Revised Implementation Order

### Gate 0: Governance, scope, and architecture lock

Deliverables:

- activate the v3 plan chain;
- mark old plans historical;
- complete preserve/adapt/legacy/retire inventory;
- choose exact decimal implementation;
- choose analytical P/L policy;
- choose shared identity direction;
- choose production object storage;
- choose database migration framework;
- perform durable workflow provider spike;
- define MVP direction and currency scope;
- define required CI checks.

No production route changes.

### Phase 1: Identity, persistence, exact math, and job substrate

Deliverables:

- shared authorization context;
- tenant-safe repository interfaces;
- PostgreSQL foundation and RLS policy tests;
- SQLite contract-test adapter;
- exact decimal domain types;
- reconstruction/accounting policy contracts;
- audit-event model;
- transactional outbox;
- durable job interface;
- retention and deletion foundation;
- dataset-version contract.

### Phase 2: Production import and reconstruction

Deliverables:

- signed raw-file upload;
- streaming parser path;
- immutable source record;
- hardened broker adapters;
- exact execution ledger;
- position and round-trip reconstruction;
- correction events;
- broker reconciliation;
- long/short and prior-inventory states;
- real IBKR and Moomoo calibration.

### Phase 3: Market data, feature foundation, and zone usability

Deliverables:

- instrument identity;
- price-basis contract;
- market snapshot persistence;
- no-lookahead feature runner;
- execution-only feature families;
- MFE/MAE/giveback;
- complete final-zone adapter;
- congestion and primary-zone selection;
- data-quality states.

Zone work may proceed in parallel with execution-only features, but cannot feed AI until its QA gate passes.

### Phase 4: Analytics and simulation tools

Deliverables:

- first ten tools;
- clustered statistical helpers;
- direct/discovery policy;
- chronological holdout support;
- intervention-based simulation engine;
- evidence selection;
- deterministic internal tool UI.

No language model is required.

### Phase 5: Evidence and finding service

Deliverables:

- claim ledger;
- evidence links;
- limitation registry;
- finding promotion policy;
- dataset-version binding;
- cache invalidation;
- counterexample selection.

### Phase 6: Execution-only Ask AI

Deliverables:

- provider interface;
- tool planning;
- structured answer;
- numeric claim validator;
- evidence citation validator;
- prompt/model versioning;
- quota reservation;
- answer cache;
- evaluation suite;
- execution-only Ask AI route behind a feature flag.

Level-based claims remain unavailable.

### Phase 7: Zone-enabled market coaching, behavior, and setups

Deliverables:

- calibrated zone usefulness gate;
- market-context tools;
- observable behavioral findings;
- setup candidate generation;
- ambiguous setup AI classification;
- user correction;
- similar-trade retrieval;
- short-side coaching remains separately gated.

### Phase 8: Reports and Rule Lab

Deliverables:

- durable daily/weekly reports;
- historical simulations;
- prospective tracking;
- rule adherence;
- period comparison;
- batch cost controls.

### Phase 9: Product replacement

Deliverables:

- Overview;
- Ask AI;
- Analytics;
- Coach;
- Rule Lab;
- Reports;
- evidence-linked trade review;
- data health;
- accessible and mobile flows.

### Phase 10: Beta, migration, and production hardening

Deliverables:

- controlled account migration;
- shadow comparisons;
- restore and provider-failure drills;
- security review;
- load/cost tests;
- beta feedback;
- rollback runbook;
- launch decision.

Security, retention, exact math, and tenancy are not deferred to this phase; this phase verifies them under production conditions.

---

## 21. Revised First Implementation Run

The first coding run after this documentation PR should be internal-only and should not call an AI model or modify end-user routes.

### Required work

1. Create the v3 module boundary.
2. Add contracts for:
   - authorization context;
   - decimal money/price/quantity;
   - dataset version;
   - canonical execution;
   - analytical round trip;
   - tool result;
   - claim/evidence link;
   - durable job envelope;
   - AI usage reservation.
3. Add a read-only compatibility adapter from current saved trades to v3 analytical round trips.
4. Build an independent reference financial-math test helper.
5. Implement internal-only:
   - performance by weekday;
   - daily stop after consecutive losses.
6. Add public synthetic golden fixtures covering:
   - partial entries/exits;
   - fees;
   - a short position;
   - a position reversal;
   - an open position;
   - two currencies that must not be aggregated;
   - repeated trades within the same day;
   - one outlier-dominated segment.
7. Add property-based and differential tests.
8. Add a v3 CI gate that runs:
   - typecheck;
   - v3 unit tests;
   - financial property/differential tests;
   - build;
   - architecture-boundary checks.
9. Document all unresolved decisions in an ADR rather than hiding them in code defaults.

### Forbidden in the first run

- no AI provider call;
- no new public route;
- no production database write;
- no raw-level coaching;
- no redesign of `/coach`;
- no vector database;
- no arbitrary SQL;
- no new fixed coaching template family;
- no production deployment.

### Acceptance criteria

- deterministic outputs are reproducible;
- exact decimal tests pass;
- no cross-currency total is produced;
- tool results include observation and independent-session counts;
- daily-stop simulation has an explicit intervention policy;
- all evidence IDs resolve in the test repository;
- adapters are read-only;
- no legacy route behavior changes;
- CI is green.

---

## 22. QA Gate Matrix

### G0: Plan and architecture gate

Pass when:

- v3 is the active plan chain;
- all P0 decisions have owners and ADRs;
- scope is explicit;
- old plans are historical.

### G1: Identity and tenancy gate

Pass when:

- production requests use shared auth;
- no demo IDs are used;
- RLS/application authorization tests pass;
- evidence and cache isolation pass.

### G2: Exact ledger gate

Pass when:

- fixed-precision contracts are enforced;
- reference and implementation math agree;
- fees, partial fills, reversals, shorts, and open positions pass;
- cross-currency aggregation fails closed;
- broker reconciliation is within documented tolerance.

### G3: Import durability gate

Pass when:

- raw files are stored securely;
- retries are idempotent;
- import state survives process failure;
- outbox jobs resume;
- duplicate import tests pass;
- retention/deletion works.

### G4: Market and feature gate

Pass when:

- basis alignment passes;
- no-lookahead tests pass;
- provider failure degrades to execution-only;
- feature versions reproduce exact output;
- zone adapter consumes replay-safe final zones.

### G5: Analytics and simulation gate

Pass when:

- golden results match independent calculations;
- clustered sample counts are correct;
- direct versus discovery status is visible;
- simulations disclose interventions and ambiguities;
- outlier and holdout checks work.

### G6: AI grounding gate

Pass when:

- every material claim maps to an allowed claim ID;
- fabricated evidence fails validation;
- insufficient evidence remains insufficient;
- prompt injection fails;
- tenant isolation passes;
- quota and model limits are enforced;
- model rollback is tested.

### G7: Support/resistance usefulness gate

Pass when:

- dense structures suppress conclusions;
- output is stable under small perturbations;
- no duplicate detector is introduced without evidence;
- level proximity cannot create a mistake alone;
- blinded human review shows a meaningful usefulness improvement.

### G8: Beta gate

Pass when:

- approved account migrations reconcile;
- restore drill passes;
- no P0/P1 security findings remain;
- cost stays inside configured targets;
- critical flows pass desktop/mobile/accessibility QA;
- users prefer v3 evidence and coaching usefulness to legacy output;
- rollback does not create divergent write authorities.

---

## 23. Required Test Strategy Additions

### Financial correctness

- exact decimal unit tests;
- independent reference implementation;
- property-based execution streams;
- differential tests against broker-reported examples;
- mutation tests for sign, fee, quantity, and rounding errors;
- deterministic seeds.

### Database contracts

Run the same repository contract suite against:

- SQLite test adapter;
- PostgreSQL implementation.

Test transactions, uniqueness, RLS, outbox, idempotency, deletion, and migration mapping.

### Tenant security

- object-level authorization;
- cache isolation;
- evidence-link isolation;
- job isolation;
- support/admin audit;
- hostile ID enumeration.

### Market correctness

- raw/adjusted basis mismatch;
- symbol changes;
- splits/reverse splits;
- delisted symbols;
- incomplete current bars;
- DST and exchange holidays;
- halts and missing bars;
- provider revisions.

### Statistical correctness

- repeated trades from one day;
- repeated ticker attempts;
- cluster bootstrap;
- small independent-cluster count;
- multiple-comparison discovery;
- chronological holdout;
- regime sensitivity;
- target leakage guards.

### Simulation correctness

- same-bar ambiguity;
- target gaps;
- stop gaps;
- partial exit followed by actual reductions;
- sequential account equity;
- daily stop;
- removed-trade fee handling;
- volume/liquidity warning;
- missing data.

### AI evaluation

- intent/tool selection;
- bounded tool calls;
- claim grounding;
- exact evidence citations;
- unsupported number rejection;
- insufficient-evidence wording;
- prompt injection;
- malicious notes/CSV descriptions;
- live-signal refusal;
- cost/token limits;
- model-version regression.

### Product and accessibility

- keyboard navigation;
- screen-reader labels for evidence cards and charts;
- chart-equivalent tables;
- mobile overflow;
- long AI answers;
- empty/partial/provider-unavailable states;
- deletion/export;
- plan/entitlement gates.

### Reliability

- process killed during import;
- process killed during feature backfill;
- duplicate outbox delivery;
- provider timeout;
- model timeout;
- database failover;
- restore drill;
- job cancellation after user deletion.

Private real broker files must not be committed. Public CI uses synthetic or safely de-identified fixtures. Private calibration results should publish only non-sensitive summaries.

---

## 24. CI Requirements

The current general CI is not sufficient for v3 release work.

Before Phase 1 code is merged, add required checks for changed v3 paths:

- `npm ci`;
- TypeScript typecheck;
- lint for touched files;
- v3 unit tests;
- financial property/differential tests;
- repository contract tests;
- production build;
- architecture import-boundary test;
- dependency/security scan;
- focused Playwright when routes change.

Later gates add:

- PostgreSQL integration tests;
- tenant-isolation tests;
- migration dry run;
- AI recorded-evaluation suite;
- scheduled live-model evaluation;
- zone calibration suite;
- load and cost tests.

Do not place expensive live-model calls in every pull request.

---

## 25. Operational Requirements

Define SLOs before beta for:

- import acceptance and reconciliation success;
- job completion latency;
- market-data coverage;
- tool latency;
- Ask AI latency;
- report completion;
- error rate;
- evidence-link integrity;
- data-loss tolerance;
- recovery point and recovery time.

Required degradation behavior:

- market-data failure -> execution-only analysis;
- AI failure -> structured deterministic tool result remains available;
- report failure -> retriable job, no duplicate report;
- cost cap reached -> clear plan-limit message, no uncontrolled call;
- database issue -> no partial import commit;
- uncertain reconstruction -> needs review, not guessed trade.

---

## 26. Scope and Complexity Control

The master plan lists many tables and 35 epics. They should not all be built before the first vertical slice.

### Minimum Phase 1 storage

Create only what the first safe slice needs, likely:

- platform users/workspaces/members/accounts or adapters to shared equivalents;
- import files/batches;
- executions and corrections;
- positions/round trips and links;
- feature/tool run snapshots;
- evidence links;
- usage reservations/events;
- outbox/jobs;
- migration mappings;
- audit events.

Add report, rule, setup-feedback, and conversation tables when their phase begins.

### Do not build yet

- vector database or embeddings for similar trades;
- unrestricted analytics DSL;
- arbitrary model-generated SQL;
- one AI request per historical trade;
- a second candle or level engine;
- live broker connections;
- options analytics;
- social/community features;
- tax reporting;
- automated execution;
- live entry/exit signals.

Similar-trade retrieval should start with deterministic normalized feature distance and explicit filters. Add embeddings only if measured retrieval quality justifies them.

---

## 27. Risk Register

| Risk | Severity | Required mitigation |
|---|---:|---|
| Cross-workspace data exposure | Critical | Shared auth context, RLS, negative tests, signed evidence links |
| Incorrect P/L from float math | Critical | Exact decimal types, independent reference tests |
| Lost production imports | Critical | PostgreSQL authority, object storage, transactional outbox, backups |
| Duplicate executions after retry | Critical | Idempotency keys and unique constraints |
| Incorrect grouping of prior inventory/shorts | High | Explicit reconstruction states and broker reconciliation |
| Split-adjusted candle mismatch | High | Price-basis contract and fail-closed execution-only fallback |
| AI invents numbers or evidence | High | Claim ledger and numeric/evidence validator |
| Statistical false discovery | High | Direct/discovery separation, clustering, holdout, multiple-comparison control |
| Simulation overstates executable result | High | Intervention contract, ambiguity ranges, liquidity disclosure |
| Noisy levels remain noisy after v3 | High | Reuse full final zones, congestion gate, blinded calibration |
| Workflow loses report/backfill | High | Durable jobs, outbox, idempotent steps |
| AI cost race/abuse | Medium/High | Atomic quota reservation, caps, anomaly alerts |
| Migration creates two sources of truth | High | Single write authority and staged cutover |
| Raw broker data leaks to logs/model | High | Object storage, redaction, structured logging policy |
| Overbuilt architecture delays MVP | Medium | Vertical slices, minimum schema, phase gates |
| Short-side conclusions are under-calibrated | Medium/High | Preserve ledger facts; gate short coaching |
| Multi-currency totals are wrong | High | Per-currency reporting until FX service |
| User deletion leaves derived data | High | Cascading deletion workflow and job cancellation |
| Model update silently changes coaching | Medium/High | Versioned eval, canary, rollback |

---

## 28. Final QA Directive

The master plan is **conditionally approved with these mandatory amendments**.

The implementation team should proceed only in this order:

1. fix plan governance;
2. lock identity, exact financial types, accounting, persistence, upload, and durable-job decisions;
3. build internal deterministic vertical slices;
4. prove analytics and simulations without AI;
5. add claim/evidence validation;
6. release execution-only AI behind a flag;
7. add support/resistance only after the final-zone usability and congestion gate proves it is better than the legacy path;
8. migrate users only after tenancy, reconciliation, recovery, cost, and rollback tests pass.

The engineering standard is:

> When evidence is incomplete, the system must become less confident, not more creative.

The product standard is:

> Every useful answer must be exact where exactness is possible, explicit about assumptions where simulation is involved, and honest when the data does not support a conclusion.
