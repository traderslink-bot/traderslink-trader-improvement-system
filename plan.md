# Trader Intelligence Plan Entry Point

**Last updated:** 2026-07-17 America/Toronto  
**Active architecture:** Trader Intelligence v3  
**Operating profile:** `private_owner_alpha`  
**Required hosting mode:** `local_only` or `private_hosted`  
**Primary domain:** U.S. listed small-cap and micro-cap active trading  
**Product boundary:** retrospective educational trade review and self-improvement  
**Current gate:** GA0-A1 — containment and architecture boundaries  
**Active implementation plan:** `src/docs/trader-intelligence-v3-ga0-a-control-and-exact-truth-implementation-plan-2026-07-17.md`

Start here when resuming Trader Intelligence product, import, analytics, coaching,
market context, external-source, persistence, AI, or QA work.

---

# 1. Controlling Read Order

1. `src/docs/trader-intelligence-v3-project-log.md`
2. `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`
3. `src/docs/trader-intelligence-v3-ga0-a-control-and-exact-truth-implementation-plan-2026-07-17.md`
4. detailed v3 QA reviews and master plan only when rationale is needed
5. legacy v1/v2 documents only for preserved code, fixtures, routes, education, or migration evidence

Precedence:

1. latest explicit accepted decision in the v3 project log;
2. controlling architecture specification;
3. active implementation plan;
4. detailed reviews/master plan as rationale;
5. legacy documents.

A project-log entry may record gate progress and accepted strengthening decisions. It
may not silently weaken the controlling architecture. Material architecture changes
require updating the controlling specification.

The detailed audit documents are:

- `src/docs/trader-intelligence-v3-fourth-pass-qa-operational-integrity-canonical-identity-and-delivery-review-2026-07-17.md`
- `src/docs/trader-intelligence-v3-third-pass-qa-source-governance-reproducibility-and-evaluation-review-2026-07-17.md`
- `src/docs/trader-intelligence-v3-second-pass-qa-private-alpha-small-micro-cap-review-2026-07-17.md`
- `src/docs/trader-intelligence-v3-qa-architecture-review-2026-07-17.md`
- `src/docs/trader-intelligence-ai-journal-v3-master-plan-2026-07-17.md`

They remain architectural evidence and rationale. Future engineering runs should not
manually merge their scopes; accepted implementation scope is in the active plan.

The former plan:

`src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`

is now an umbrella/historical Gate 0 plan. It does not control the next coding PR.
Its weekday analytics and daily-stop simulation work belongs to GA0-B.

---

# 2. Current Product Direction

```text
contained owner-only environment
  -> deterministic import and validation
  -> canonical exact accepted executions
  -> immutable corrections and versioned reconstruction
  -> explicit coverage and content-addressed dataset manifest
  -> per-capability eligibility
  -> deterministic analytics and simulations
  -> stable claim and evidence ledger
  -> evaluated owner-only AI explanation
  -> qualified small/micro-cap enrichment
  -> measured usefulness
  -> future public hardening
```

Code owns:

- access containment and authorization;
- CSV parsing and validation;
- duplicate and correction decisions;
- canonical identity;
- exact financial math;
- position and round-trip reconstruction;
- time/session/instrument/basis policy;
- coverage and manifests;
- capability eligibility;
- statistics and simulations;
- evidence references;
- source provenance.

AI may select approved tools and explain validated claims. It must not become the
parser, calculator, database, unrestricted SQL author, runtime web-search authority,
market-data inventor, live signal engine, current-target generator, or broker.

---

# 3. Current Operating Facts

- The current tester is the owner.
- The system is not currently public or multi-user.
- The current deployment profile is `private_owner_alpha`.
- Hosting must explicitly declare `local_only` or `private_hosted`.
- A privately hosted deployment still requires owner authentication.
- Real broker data must not be placed on an anonymously reachable hosted route.
- The primary specialization is small/micro-cap active trading.
- The product analyzes completed executions for education and self-improvement.
- It does not provide current buy/sell/hold instructions, live targets, automated
  orders, guaranteed improvement, tax advice, or portfolio allocation.
- Public identity, tenancy, PostgreSQL, object storage, durable jobs, billing,
  licensing, and SLOs remain future public-track requirements.
- Private-alpha status does not relax exact math, evidence, coverage, temporal truth,
  price-basis safety, backup, privacy, or simulation honesty.

---

# 4. Fourth-Pass Accepted Decisions

The fourth audit found implementation hazards not fully operationalized by the first
three reviews.

## Private-hosted containment

Current Intelligence pages and API examples do not themselves prove owner-only route
enforcement. Before hosted real-data use:

- all Intelligence pages and APIs require owner authorization;
- identity is derived server-side;
- anonymous reads and mutations fail closed;
- private responses are not shared-cacheable;
- invalid profile/hosting configuration disables data access.

Local-only testing remains permitted when startup checks prevent accidental public
hosting and real data stays local.

## Legacy fingerprints are migration-only

The current legacy fingerprint helper uses a 32-bit non-cryptographic hash and
normalizes numeric values through JavaScript `Number` and fixed decimal formatting.
It must not be authoritative for v3 file, execution, duplicate, manifest, evidence, or
answer identity.

V3 uses:

- cryptographic content digests;
- versioned canonical serialization;
- exact decimal strings;
- collision comparison;
- no random IDs or wall-clock metadata in content identities.

## Canonical execution and duplicate states

A repeated-looking fill may be legitimate. V3 distinguishes exact duplicate,
reexport, correction/bust, ambiguous duplicate, legitimate repeated fill, and hash
collision. Only exact duplicates are automatically suppressed.

## Factual lifecycle versus review disposition

A user review action cannot create a closing execution or turn an open position into a
factual closed round trip. Legacy lifecycle overrides become annotations and coverage
limitations.

## Temporal truth

Executions, corrections, instrument mappings, external events, user intent, setup
labels, and rules distinguish effective/valid time from observed/recorded/corrected
time. Source and user corrections are append-only events.

## Snapshot consistency

One analysis run binds to one immutable set of dataset, coverage, correction,
eligibility, policy, enrichment, and cutoff snapshots. Tool results from different
manifests cannot be combined into one answer.

## Stable evidence

Evidence references are manifest-scoped semantic references, not assumptions that a
database ID survives reimport or migration.

## Runtime validation

TypeScript is not runtime validation. Canonical executions, manifests, corrections,
eligibility, tool results, external payloads, and future AI output must be validated at
runtime with stable machine reason codes.

## Parser hardening

The import path must detect duplicate normalized headers, mapping collisions,
unterminated quotes, inconsistent row widths, unsupported encoding, control
characters, oversized cells, delimiter ambiguity, and duplicate execution IDs with
conflicting content. Silent header overwrite is not acceptable.

## WAL-safe backup

Private SQLite backup must use a consistent WAL-safe mechanism and prove restore with
integrity, execution-set digest, manifest digest, and representative calculation
checks. Copying only the main database file is not considered a proven backup.

## Evaluation isolation

Private-alpha evaluation separates calibration, holdout, regression, and private
acceptance sets. Repeated exploratory questions are logged so the AI cannot keep
slicing the same data until it finds a dramatic result and omit the search history.

---

# 5. Current Delivery Sequence

GA0-A is now delivered in three focused PRs.

## GA0-A1 — Containment and Architecture Boundaries

Build first:

- deployment and hosting contracts;
- owner-route containment contract;
- current-system preserve/adapt/legacy/retire inventory;
- minimal v3 directory boundary;
- dependency guard;
- private-data repository guard;
- legacy hazard register.

No real hosted data may be used without the required owner gate.

## GA0-A2 — Canonical Execution and Exact Financial Truth

After GA0-A1 review:

- exact decimal ADR and wrappers;
- canonical serialization and cryptographic hashing;
- canonical execution identity and deterministic ordering;
- duplicate/correction/collision states;
- analytical P/L and reconstruction policy;
- independent exact reference math;
- first exact synthetic fixtures.

## GA0-A3 — Temporal, Manifest, and Eligibility Truth

After GA0-A2 review:

- bitemporal correction contract;
- factual lifecycle versus review disposition;
- open-position/retrospective policy;
- dataset and coverage manifests;
- analysis eligibility;
- immutable analysis snapshot;
- stable evidence references;
- runtime validation;
- stale/invalidation states;
- WAL-safe backup and restore verification;
- parser hardening contract/tests.

## GA0-B — Deterministic Proof

Only after all GA0-A slices pass:

- read-only current-data adapter;
- weekday analytics;
- stop-after-consecutive-losses simulation;
- evidence resolver;
- denominator/exclusion accounting;
- internal diagnostics;
- property and differential tests;
- v3 CI.

## GA0-C — Private Calibration

After GA0-B:

- private fixture manifest without raw data;
- reconciliation and coverage report;
- owner evidence review;
- backup/restore drill;
- defects converted into synthetic/regression cases;
- Gate 0 exit report.

---

# 6. Current Prohibitions

The current GA0-A1 coding PR must not include:

- an AI/model call;
- a public feature route;
- production multi-user writes;
- weekday analytics;
- daily-stop simulation;
- market enrichment;
- support/resistance consumption;
- another level detector;
- setup classification;
- coaching changes;
- `/coach` redesign;
- unrestricted SQL;
- vector storage;
- production deployment.

A private-access guard or fail-closed disabling of existing Intelligence routes is
permitted because it reduces exposure rather than expanding product behavior.

---

# 7. External Data and Free-Source Ruling

Outside sources remain later GA3 opportunities and must enter through the source
registry, immutable snapshots, provenance, terms review, no-lookahead checks, and
capability eligibility.

Qualified candidates include:

- SEC EDGAR submissions, filings, Company Facts, RSS, archives, and trading
  suspensions;
- Nasdaq Trader symbol directories, trade-halt RSS, and dated Reg SHO threshold
  lists with strict non-directional interpretation;
- NYSE trading-halt resources;
- the LULD Plan as a rules reference only;
- FINRA short-sale-volume and short-interest datasets with distinct definitions;
- OpenFIGI as an instrument-mapping candidate source;
- individual Nasdaq Data Link datasets after dataset-level review.

Rules:

- threshold status is not short interest or a squeeze signal;
- regulatory suspension is distinct from a volatility halt;
- free access does not imply public-commercial redistribution permission;
- no undocumented endpoint becomes a product contract;
- no runtime AI web search becomes historical authority;
- no comprehensive free historical NBBO assumption;
- paid corporate-action documentation/sample data is not classified as a free feed.

---

# 8. Small/Micro-Cap and Evidence Ruling

Every tool declares capability:

- E0 execution-only;
- E1 candle-enriched;
- E2 event-enriched;
- E3 quote-enriched;
- E4 share-structure-enriched;
- E5 combined with explicit limitations.

Examples:

- candles do not prove spread, depth, quote size, exact slippage, or full fill;
- missing bars do not prove a halt;
- target touch is a price-path scenario, not executable proof;
- current float is not automatically historical float;
- later filings cannot influence entry-time reasoning;
- FINRA short-sale volume is not short interest;
- chart-derived facts fail closed on instrument or price-basis mismatch;
- support/resistance fails closed when structure is congested.

---

# 9. Current Next Action

After this documentation PR is accepted:

1. create `agent/trader-intelligence-v3-ga0-a1-containment` from current `main`;
2. implement GA0-A1 only;
3. run configuration, route-containment where applicable, architecture, private-data,
   typecheck, focused tests, legacy tests, and build checks;
4. open a focused draft PR;
5. review GA0-A1 before GA0-A2;
6. keep work internal and model-free;
7. do not consume support/resistance;
8. do not redesign `/coach`;
9. do not deploy.

---

# 10. Update Protocol

After meaningful work:

1. update `src/docs/trader-intelligence-v3-project-log.md`;
2. update the active GA0-A plan;
3. update the controlling specification only for material architecture changes;
4. update the plan index when authority, gate, or status changes;
5. preserve QA reviews as audit evidence;
6. record exact tests, profile, hosting mode, data capability, private-data handling,
   limitations, rollout state, and next resume point.

---

# 11. Final Standard

> IDs, hashes, correction times, review actions, cache keys, and snapshot boundaries
> are part of financial correctness.

> Prefer a blocked or limited result over one created by silently dropping ambiguous
> fills, changing lifecycle facts, mixing dataset versions, or losing evidence during
> reimport.

> Contain access first, establish canonical exact truth second, establish temporal and
> manifest truth third, and only then build the first analytics tools.
