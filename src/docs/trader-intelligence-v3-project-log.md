# Trader Intelligence v3 Project Log

## Purpose

This is the active continuity and decision log for Trader Intelligence v3.

It records:

- accepted architecture decisions;
- deployment and hosting mode;
- implementation gate;
- branch and PR state;
- verification;
- private-data handling;
- exact resume point.

The legacy `src/docs/codex-project-log.md` remains useful for v1/v2 history. It does
not control v3 architecture.

---

# Resume Protocol

Read in this order:

1. `plan.md`
2. this file
3. `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`
4. `src/docs/trader-intelligence-v3-ga0-a-control-and-exact-truth-implementation-plan-2026-07-17.md`
5. detailed v3 QA reviews/master plan only for rationale
6. legacy documents only for preserved code, fixtures, routes, education, or migration evidence

Precedence:

1. latest explicit accepted decision in this log;
2. controlling architecture specification;
3. active implementation plan;
4. detailed reviews/master plan as rationale;
5. legacy documents.

This log may record progress and strengthening decisions. It may not silently weaken
the controlling specification. Material architecture changes require updating that
specification.

---

# Current Resume Point

## 2026-07-17 — Fourth-Pass QA Complete; GA0-A1 Activated

### Status

- Four independent QA/engineering passes are complete.
- The v3 architecture remains approved for staged private-owner-alpha implementation.
- The fourth pass found no reason to restart or replace the architecture.
- A new focused GA0-A implementation plan was created.
- The current gate is **GA0-A1 — containment and architecture boundaries**.
- The former Gate 0 implementation plan is now umbrella/historical for execution
  scope; its weekday and daily-stop work moved to GA0-B.
- `plan.md`, `handoff.md`, and the plan index point to the new GA0-A plan.
- No runtime code changed.
- No production deployment was requested or authorized.

### Fourth-pass audit

`src/docs/trader-intelligence-v3-fourth-pass-qa-operational-integrity-canonical-identity-and-delivery-review-2026-07-17.md`

### Active implementation plan

`src/docs/trader-intelligence-v3-ga0-a-control-and-exact-truth-implementation-plan-2026-07-17.md`

### Key fourth-pass repository findings

1. **Private-hosted access is not proven by current Intelligence routes**
   - `app/intelligence/layout.tsx` renders the shell without owner authorization.
   - example APIs instantiate the SQLite repository and demo identity directly.
   - real hosted data is blocked until owner page/API authorization exists.

2. **Legacy fingerprints are not safe v3 identities**
   - the current helper uses a 32-bit non-cryptographic hash;
   - financial fields normalize through JavaScript `Number` and eight-decimal text;
   - legacy fingerprints remain migration metadata only;
   - v3 requires canonical exact content plus cryptographic digests.

3. **Legacy review state can alter apparent factual lifecycle**
   - the current mark-closed path can write a closed lifecycle without a closing
     execution;
   - v3 separates ledger-derived position state from review disposition;
   - legacy user lifecycle overrides become annotations/coverage limitations.

4. **Canonical serialization was underspecified**
   - v3 now requires versioned UTF-8/key/array/decimal/timestamp/null rules;
   - volatile database IDs, random values, and wall-clock metadata do not enter content
     identities;
   - cross-platform digest tests are required.

5. **Duplicate handling needs explicit ambiguity/collision states**
   - repeated identical-looking fills can be legitimate;
   - only exact duplicates are automatically suppressed;
   - correction/bust, possible duplicate, legitimate repeat, and hash collision remain
     distinct states.

6. **Temporal correction semantics need bitemporal truth**
   - valid/effective time is distinct from observed/recorded/corrected time;
   - source and user corrections are append-only;
   - old answers retain their original manifests.

7. **Analysis-run consistency needs an immutable snapshot**
   - all tools in one run bind to one dataset, coverage, correction, policy,
     eligibility, enrichment, user-intent, and cutoff snapshot;
   - mixed-manifest answers are invalid.

8. **Parser hardening is required**
   - duplicate normalized headers can otherwise overwrite values;
   - unclosed quotes, row-width mismatch, encoding/control characters, oversized
     cells, delimiter ambiguity, and conflicting duplicate execution IDs require
     explicit failures/review.

9. **SQLite backup must be WAL-safe and restore-tested**
   - copying only the main database file is not accepted as proof;
   - restore validates integrity, execution digest, manifest digest, and representative
     calculations.

10. **Evaluation requires isolation**
    - calibration, holdout, regression, and private acceptance sets are distinct;
    - repeated exploratory queries are recorded in an exploration ledger;
    - the model cannot keep slicing until a dramatic result appears and hide the search.

### Accepted fourth-pass implementation decisions

- Current profile remains `private_owner_alpha`.
- Hosting remains explicitly `local_only` or `private_hosted`.
- Private-hosted real-data use requires owner authorization on every Intelligence page
  and API.
- Local-only mode must fail closed in a known public/hosted environment.
- Cryptographic, versioned canonical content identity replaces legacy fingerprint
  authority.
- Manifest hashes exclude random IDs, database IDs, and wall-clock creation metadata.
- Execution ordering ambiguity is explicit.
- User review state cannot change factual inventory.
- Open positions cannot enter realized closed-trade analytics without closing evidence.
- Every answer records an analysis cutoff.
- Evidence references are manifest-scoped.
- Runtime validation is required at untrusted boundaries.
- WAL-safe backup and restore verification is required in GA0-A3.
- AI replay distinguishes saved answer artifact from regeneration.
- GA0-A is delivered as GA0-A1, GA0-A2, and GA0-A3.

### GA0-A1 current scope

- deployment and hosting-mode contracts;
- owner-access containment contract;
- preserve/adapt/legacy/retire inventory;
- minimal `src/lib/trader-intelligence-v3/` boundary;
- architecture dependency guard;
- private-data repository guard;
- legacy hazard register.

### GA0-A1 exclusions

- no model call;
- no new public feature route;
- no production multi-user write;
- no analytics tool;
- no market enrichment;
- no support/resistance consumption;
- no second level detector;
- no setup classification;
- no coaching change;
- no `/coach` redesign;
- no unrestricted SQL;
- no vector storage;
- no deployment.

An owner-access guard or fail-closed disabling of existing private routes is permitted.

### Next engineering action

After documentation PR #94 is accepted:

1. create `agent/trader-intelligence-v3-ga0-a1-containment` from current `main`;
2. implement GA0-A1 only;
3. run configuration, containment where applicable, architecture, private-data,
   typecheck, focused tests, full tests, Layer 2, Layer 3, build, and relevant legacy
   regression checks;
4. open a focused draft PR;
5. review GA0-A1 before GA0-A2;
6. do not call a model;
7. do not consume support/resistance;
8. do not redesign `/coach`;
9. do not deploy.

### Documentation PR verification required before merge

- fetch fourth-pass audit header and final directive;
- fetch active GA0-A plan header and final directive;
- verify changed files remain documentation only;
- verify root plan, handoff, index, and this log point to GA0-A1;
- compare branch with current `main`;
- confirm PR remains draft and mergeable;
- confirm final-head CI result;
- do not blindly force-update unrelated `main` commits.

---

# Prior Checkpoint Summaries

## 2026-07-17 — Third-Pass QA and Architecture Consolidation

Accepted:

- one controlling architecture specification;
- content-addressed dataset, derivation, enrichment, and answer manifests;
- explicit dataset coverage;
- per-capability eligibility;
- source hierarchy and source registry;
- no authoritative runtime web search;
- direct/fixed/exploratory/optimization/similarity analysis modes;
- claim correctness and owner-usefulness evaluation;
- GA0-A/B/C high-level split.

Official/free-to-access later candidates recorded:

- SEC EDGAR;
- Nasdaq Trader symbol and halt resources;
- NYSE halts;
- LULD rules;
- qualified FINRA data;
- OpenFIGI mapping candidates;
- specific Nasdaq Data Link datasets.

## 2026-07-17 — Second-Pass Private Alpha and Small/Micro-Cap QA

Accepted:

- `private_owner_alpha` sequencing;
- public infrastructure moved off the immediate value-validation path;
- exact math/evidence/basis/backup remain mandatory;
- premarket, after-hours, halts, thin liquidity, quotes, float, catalysts, dilution,
  reverse splits, ticker changes, and repeated attempts become domain requirements;
- E0–E5 capability tiers;
- owner-only AI may follow deterministic grounding before all public infrastructure.

## 2026-07-17 — First QA Review

Accepted:

- exact financial types and P/L policy;
- future identity, tenancy, PostgreSQL, ingestion, durable jobs, deletion, security,
  migration, and CI gates;
- current persistence/identity paths are prototype foundations;
- support/resistance becomes a Zone Usability and Congestion Layer, not another
  detector.

## 2026-07-17 — Original Master Plan

Accepted direction:

- preserve deterministic import/reconstruction work;
- replace fixed templates as final coach;
- build deterministic features, tools, simulations, evidence, and AI explanation;
- keep AI out of authoritative parsing and calculation;
- use staged migration rather than destructive rewrite.

---

# Active Decision Register

## Deployment and containment

**State:** approved; GA0-A1.

- profile: `private_owner_alpha`;
- hosting: `local_only` or `private_hosted`;
- private-hosted requires owner auth;
- local-only rejects known hosted/public use;
- real hosted data is forbidden without containment;
- demo identity never becomes public authority.

## Canonical identity

**State:** required; GA0-A2.

- legacy 32-bit fingerprints are migration-only;
- use cryptographic digests;
- canonicalization is versioned;
- exact decimals remain strings;
- content hashes exclude volatile IDs/times;
- digest equality is verified against canonical content.

## Exact financial truth

**State:** required; GA0-A2.

- no JavaScript-number authority for financial values;
- broker-reported, analytical, cash, and tax P/L remain distinct;
- tax P/L is out of scope;
- P/L/reconstruction policy covers partials, fees, rebates, shorts, reversals, prior
  inventory, open positions, corporate actions, and currencies.

## Temporal and lifecycle truth

**State:** required; GA0-A3.

- corrections are append-only;
- valid time and recorded time are distinct;
- factual inventory is execution/correction-derived;
- review state cannot close inventory;
- open positions remain outside realized closed-trade analytics.

## Coverage, manifests, eligibility, and snapshots

**State:** required; GA0-A3.

- dataset coverage includes periods, gaps, overlaps, exclusions, prior inventory,
  open positions, accounts, and currencies;
- manifests are content-addressed;
- eligibility is per capability;
- one run uses one immutable snapshot set;
- evidence references are manifest-scoped;
- dependent results become explicitly stale after corrections.

## AI grounding

**State:** required before GA2.

- approved tools only;
- bounded plan;
- claim/numeric/unit/currency/evidence/capability validation;
- immutable answer artifact and explicit regeneration semantics;
- cost limits and disable switch;
- owner gate;
- prompt-injection tests;
- no raw CSV prompt by default;
- calibration/holdout/regression evaluation separation.

## Support/resistance

**State:** approved direction; not active.

- `levels-system-v2` remains factual producer;
- no second detector;
- add Zone Usability and Congestion Layer later;
- suppress crowded, unstable, stale, synthetic-only, or basis-unsafe output;
- AI remains execution-only until usefulness gates pass.

## Educational boundary

**State:** approved.

- historical analysis and user-created rule experiments are allowed;
- no current buy/sell/hold instruction;
- no current targets;
- no automatic orders;
- no guaranteed improvement;
- no tax or portfolio-allocation advice;
- use historical/associative rather than unsupported causal language.

---

# Gate Status

| Gate | Status | Notes |
|---|---|---|
| GA0-A1 containment and boundaries | Ready after docs acceptance | Current next runtime PR |
| GA0-A2 canonical exact truth | Not started | Begins after A1 review |
| GA0-A3 temporal/manifests/eligibility | Not started | Begins after A2 review |
| GA0-B deterministic proof | Not started | Weekday and daily-stop tools |
| GA0-C private calibration | Not started | Private real-data review and restore |
| GA1 execution analytics | Not started | Broader E0 tools |
| GA2 owner-only AI | Not started | Grounding/eval/cost/access required |
| GA3 qualified enrichment | Not started | One source/capability at a time |
| GA4 usefulness calibration | Not started | Compare deterministic/v2/v3/abstention |
| Public track | Not started | Required before invited/public users |

---

# Update Rules

After meaningful work, record:

- branch and PR;
- deployment profile and hosting mode;
- files and contracts changed;
- accepted ADRs;
- canonicalization/hash version;
- financial policy version;
- dataset/coverage/eligibility state;
- tests and exact results;
- private-data handling;
- backup/restore state;
- rollout/deployment state;
- known limitations;
- exact next action.

No gate is complete because one test passes. Use the active plan’s full acceptance
criteria.
