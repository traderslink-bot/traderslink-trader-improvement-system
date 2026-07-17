# Trader Intelligence v3 Handoff

**Last updated:** 2026-07-17 America/Toronto  
**Active architecture:** Trader Intelligence v3  
**Operating profile:** `private_owner_alpha`  
**Hosting mode:** `local_only` or `private_hosted` must be declared  
**Primary domain:** U.S. listed small-cap and micro-cap active trading  
**Product boundary:** retrospective educational trade review  
**Current gate:** GA0-A1 — containment and architecture boundaries  
**Active implementation plan:** `src/docs/trader-intelligence-v3-ga0-a-control-and-exact-truth-implementation-plan-2026-07-17.md`

Use this file for quick orientation. `plan.md` is the root entry point.

---

# 1. Resume Order

1. `plan.md`
2. `src/docs/trader-intelligence-v3-project-log.md`
3. `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`
4. `src/docs/trader-intelligence-v3-ga0-a-control-and-exact-truth-implementation-plan-2026-07-17.md`
5. detailed QA reviews/master plan only for rationale
6. legacy plans only for preserved code, fixtures, routes, education, or migration evidence

Precedence:

1. latest explicit accepted project-log decision;
2. controlling architecture specification;
3. active implementation plan;
4. detailed reviews/master plan as rationale;
5. legacy documents.

The fourth audit is:

`src/docs/trader-intelligence-v3-fourth-pass-qa-operational-integrity-canonical-identity-and-delivery-review-2026-07-17.md`

It is audit evidence and the rationale for the focused GA0-A plan.

The old Gate 0 plan is no longer the next file-level execution authority. Its analytics
work was moved to GA0-B.

---

# 2. Current Direction

```text
contained owner-only environment
  -> canonical exact accepted executions
  -> immutable corrections and versioned reconstruction
  -> explicit coverage and content-addressed dataset
  -> capability eligibility
  -> deterministic analytics and simulations
  -> stable evidence and claims
  -> evaluated owner-only AI explanation
  -> qualified small/micro-cap enrichment
  -> usefulness calibration
  -> future public hardening
```

Code owns access, parsing, canonical identity, exact math, reconstruction, time,
instrument/basis policy, coverage, manifests, eligibility, statistics, simulations,
provenance, and evidence.

AI explains approved deterministic claims. It does not parse files, calculate financial
truth, use unrestricted SQL, invent market data, browse the web as a historical
database, issue live signals, create current targets, or execute orders.

---

# 3. Fourth-Pass Critical Findings

## Current route containment is not proven

The current Intelligence layout renders the site shell without resolving an owner.
Current example APIs directly use the SQLite repository and demo identity.

Therefore:

- real data remains local unless private-hosted owner auth is implemented;
- private-hosted mode requires page and API authorization;
- invalid hosting/profile configuration fails closed;
- no anonymous hosted mutations are permitted.

## Legacy fingerprints are unsafe as v3 authority

The legacy fingerprint helper uses a 32-bit non-cryptographic hash and normalizes
financial values through JavaScript numbers.

V3 uses cryptographic content digests, exact decimal strings, and versioned canonical
serialization. Legacy fingerprints remain compatibility metadata only.

## Review state cannot change ledger facts

The current legacy mark-closed path can record a closed lifecycle without a closing
execution. V3 separates factual position state from user review disposition. A user
annotation cannot create a closing fill or make an incomplete position eligible for
closed-trade analytics.

## One run uses one snapshot

All tools in an analysis run bind to one dataset, coverage, correction, policy,
eligibility, enrichment, and cutoff snapshot. Mixed-manifest answers are invalid.

## Parser hardening is required

V3 must detect duplicate normalized headers, mapping collisions, malformed quotes,
row-width mismatches, unsupported encodings, control characters, oversized cells, and
conflicting duplicate execution IDs.

## Backup must prove restore

SQLite WAL mode requires a consistent backup method. A backup is not accepted until an
isolated restore passes integrity, execution-set digest, manifest digest, and
representative calculation checks.

---

# 4. Current Delivery Slices

## GA0-A1 — Containment and Architecture Boundaries

Next PR only:

- deployment/hosting contracts;
- owner-access containment contract;
- preserve/adapt/legacy/retire inventory;
- minimal v3 boundary;
- dependency guard;
- private-data repository guard;
- legacy hazard register.

Recommended branch:

`agent/trader-intelligence-v3-ga0-a1-containment`

## GA0-A2 — Canonical Execution and Exact Financial Truth

After GA0-A1 review:

- exact decimal policy and wrappers;
- canonical serialization and cryptographic hashing;
- canonical execution identity and ordering;
- duplicate/correction/collision states;
- P/L and reconstruction policy;
- independent reference math;
- exact synthetic fixtures.

## GA0-A3 — Temporal, Manifest, and Eligibility Truth

After GA0-A2 review:

- bitemporal corrections;
- factual lifecycle versus review state;
- retrospective/open-position policy;
- dataset and coverage manifests;
- capability eligibility;
- immutable analysis snapshot;
- stable evidence references;
- runtime validation;
- stale/invalidation states;
- WAL-safe backup/restore;
- parser hardening contract/tests.

## GA0-B — Deterministic Proof

Only after GA0-A:

- read-only current-data adapter;
- weekday analytics;
- daily-stop simulation;
- evidence resolver;
- exclusion accounting;
- diagnostics;
- property/differential tests;
- v3 CI.

## GA0-C — Private Calibration

- private manifest without raw data;
- reconciliation and coverage report;
- owner evidence review;
- restore drill;
- regressions from discovered defects;
- Gate 0 exit decision.

---

# 5. Current Restrictions

The GA0-A1 PR must not include:

- a model call;
- a new public feature route;
- production multi-user writes;
- analytics tools;
- market enrichment;
- support/resistance consumption;
- another level detector;
- setup classification;
- coaching changes;
- `/coach` redesign;
- unrestricted SQL;
- vector storage;
- production deployment.

An access guard or fail-closed disabling of existing private routes is permitted.

---

# 6. External Sources

Later qualified opportunities include:

- SEC EDGAR filings, Company Facts, archives, RSS, and trading suspensions;
- Nasdaq Trader symbol directories, halt RSS, and dated Reg SHO threshold lists;
- NYSE halt resources;
- LULD rules as reference only;
- FINRA short-sale-volume and short-interest datasets with separate definitions;
- OpenFIGI mapping candidates;
- specific Nasdaq Data Link datasets after source-level review.

Rules:

- free access does not imply public-commercial rights;
- threshold status is not short interest or squeeze evidence;
- regulatory suspensions are not ordinary volatility halts;
- current data is not automatically historical;
- no runtime web-search result becomes source truth;
- no comprehensive historical NBBO source is assumed free.

---

# 7. Verification Expectations

Every GA0-A PR reports:

- `npm ci`;
- TypeScript typecheck;
- focused lint;
- focused v3 tests;
- relevant property/differential tests;
- architecture/private-data guards;
- full `npm test`;
- Layer 2 verification;
- Layer 3 verification;
- production build;
- relevant legacy regressions.

No normal CI calls a live model or external market-data source.

---

# 8. Current Status

Documentation PR #94 contains:

- master architecture;
- four independent QA reviews;
- controlling architecture specification;
- focused GA0-A implementation plan;
- v3 project log;
- corrected root plan;
- corrected plan index;
- this handoff.

Runtime code has not changed in the documentation PR.

The PR remains draft until the consolidated architecture and focused GA0-A delivery
sequence are accepted.

---

# 9. Final Standard

> IDs, hashes, correction timestamps, review actions, and snapshot boundaries are
> part of financial correctness.

> Do not let a review action create a trade fact, a weak fingerprint remove a fill, or
> a reimport silently redirect old evidence.

> Contain access first, establish canonical exact truth second, establish temporal and
> manifest truth third, and only then build analytics.
