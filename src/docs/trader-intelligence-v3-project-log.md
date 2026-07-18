# Trader Intelligence v3 Project Log

## Purpose

This is the active continuity and accepted-decision log for Trader Intelligence v3.

It records:

- deployment and hosting mode;
- current implementation gate;
- architecture decisions;
- query/visual evidence decisions;
- branch/PR state;
- verification;
- private-data handling;
- exact resume point.

The legacy `src/docs/codex-project-log.md` remains useful for v1/v2 history. It does not control v3 architecture.

---

# Resume Protocol

Read in this order:

1. `plan.md`
2. this file
3. `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`
4. `src/docs/trader-intelligence-v3-ga0-a-control-and-exact-truth-implementation-plan-2026-07-17.md`
5. detailed reviews/master plan only for rationale
6. legacy documents only for preserved code, fixtures, routes, education, or migration evidence

Precedence:

1. latest explicit accepted decision in this log;
2. controlling architecture specification;
3. active implementation plan;
4. detailed reviews/master plan as rationale;
5. legacy documents.

This log may record progress and accepted strengthening decisions. It may not silently weaken the controlling specification.

---

# Current Resume Point

## 2026-07-17 — GA0-A1 Independent-Audit Remediation In Progress

### Binding owner decision

- Trader Intelligence is a local-only application on the owner's computer.
- It must not be reachable through a LAN address, public address, arbitrary DNS name, tunnel, proxy, forwarded host, container-published interface, Vercel, or another host.
- `local_only` is the only operational hosting mode; `private_hosted` is declared but returns a stable not-operational reason.
- `local_sqlite` is the only operational storage mode; `private_database` is declared but returns a stable not-operational reason.
- PR #102 remains draft and unmerged. GA0-A2 has not started.

### V2 feature-provenance reconciliation

- Current `origin/main` is the correct GA0-A1 foundation for the committed
  product engine. PR #59 and later follow-ups deliberately ported the V2
  import, saved-trade, analytics, deterministic coach, tier/chart-evidence,
  candle, basis-safety, and level-review behavior while preserving the newer
  `/intelligence` namespace and journal-level-analysis contracts.
- The separate `trader-intelligence-v2` branch is 297 commits behind current
  `origin/main` and has 26 unique committed candle/review commits whose intended
  behavior has equivalent or later ports on `main`. It is not a safe merge
  base.
- Manual stock entry, paid-tier AI daily/weekly/monthly reflections, and the
  real-coach/Whop marketplace exist only as uncommitted prototype code in the
  dirty V2 worktree. Five focused prototype test files currently pass 32 tests,
  but the code is not part of PR #102 and is not promoted to v3 authority.
- Academy Discord login is committed on `main`; its three focused suites pass
  11 tests. It remains Academy-owned compatibility code, not accepted future
  Trader Intelligence hosted identity.
- The V2 stash contains a private SQLite artifact. Do not apply, merge, or
  commit that stash. Any later feature preservation must select explicit source
  and test files into a clean, private-data-scanned change after this audit.

### Remediation implemented on the working tree

- A central request boundary accepts only `localhost`, `127.0.0.1`, and `[::1]`, with valid explicit ports, and rejects malformed, non-loopback, forwarded, proxy, and tunnel evidence before local owner authority.
- App Router pages read the actual request headers through async `headers()`; API routes validate both `Request.url` and request headers.
- `npm run dev` and `npm run start` bind explicitly to `127.0.0.1`.
- Mutation Origin validation uses only an explicitly configured normalized loopback allowlist. Missing configuration, missing/null/malformed/credentialed/non-loopback origins, alternate ports, schemes, and attacker-controlled request hosts fail closed.
- Sample mode uses isolated in-memory SQLite and rejects an owner database path. Real-owner mode requires an explicit durable path outside the repository and OS temp directory; relative paths require an explicit absolute private-data root.
- Real CSV upload entry points require explicit `real_owner_data` mode.
- Route discovery scans every `app/api/**/route.ts`, relevant imports, and static API references from `app/intelligence`; TypeScript AST checks enforce exact matrix methods, wrapper use, and wrapper module paths. The audited 82 routes remain classified.
- Architecture enforcement now parses static imports, export-from, `require`, and literal dynamic imports. The provisional Academy exception is limited to the exact adapter, module, and two required session symbols.
- The private-data guard uses exact file/hash fixture approval, continues broker-row inspection, scans bounded binary/oversized inputs safely, and scans every added/modified blob in `origin/main...HEAD`, including blobs later deleted or renamed.
- Private response handling preserves existing `Vary` tokens, adds `Cookie` case-insensitively, and returns generic private/no-store failures with safe diagnostics.
- The global `Request` replacement was removed. A test helper now requires unsafe requests to state Origin behavior explicitly.
- Mutation console events are named as non-durable local diagnostics and do not satisfy future hosted audit-log requirements.

### Verification completed

- `npm ci`: passed; 603 packages installed. npm reported 5 existing audit vulnerabilities (2 low, 1 moderate, 2 high).
- `npx tsc --noEmit --pretty false`: passed.
- changed-path ESLint: passed with 0 errors and 2 pre-existing unused-variable warnings in `app/intelligence/coach/page.tsx`.
- focused GA0-A1 suite: 7 files, 133 tests passed.
- affected legacy route/UI compatibility suite: 10 files, 101 tests passed.
- full Vitest suite: 164 files, 1,523 tests passed.
- AST architecture verification: passed across 75 architecture files, 42 API routes, and all 82 classified routes.
- staged private-data verification: passed across 23,684 records: 23,590 worktree/index records and 94 added/modified pre-remediation PR-history blobs.
- the first remediation-head Linux CI run exposed CRLF-specific synthetic-fixture hashes from the Windows checkout; fixture hashing now canonicalizes Git text to LF, all 14 manifest hashes use that canonical representation, and the test accepts both CRLF and LF checkouts while still rejecting content changes.
- Layer 2 verification: passed with the canonical 13-pattern result.
- Layer 3 verification: passed with canonical regression `PASS`.
- optimized build: passed; 127 routes were generated and all Intelligence routes remained dynamic. The build retained 19 known Academy registry notices and 5 existing broad filesystem-tracing warnings.
- process-restart persistence: passed by writing and reading the same explicit external owner database from two separate `NODE_ENV=production` Node processes.
- optimized local browser flow: 1 Playwright scenario passed against the external owner database and verified private/no-store plus merged `Vary` response headers.
- normal verification made no live model, external market-data, Vercel, or deployment calls.

Implementation and local verification are complete. Status remains **independent-audit remediation in progress** until the new draft-PR head passes independent re-review.

### Exact next resume point

1. inspect the complete `origin/main...HEAD` diff and stage only GA0-A1 remediation;
2. rerun the private-data guard against the staged tree, commit, and push the same branch;
3. update draft PR #102 with the finding-to-fix/file/test/command map;
4. keep the PR draft and unmerged, do not begin GA0-A2, and stop for independent re-audit.

---

## 2026-07-17 — GA0-A1 Implementation Complete; Focused Review Pending

### Status

- Branch: `agent/trader-intelligence-v3-ga0-a1-containment`.
- Draft PR: `https://github.com/traderslink-bot/traderslink-trader-improvement-system/pull/102`.
- Independent audit handoff: `src/docs/trader-intelligence-v3-ga0-a1-independent-audit-handoff-2026-07-17.md`.
- Gate: GA0-A1 implementation candidate complete; acceptance and merge remain pending focused draft-PR review.
- Operating profile: only `private_owner_alpha` is operational.
- Hosting: explicit `local_only` or `private_hosted`; missing/unsafe configuration fails closed.
- Active owner testing is `local_only` on the owner's computer. `private_hosted` remains a future containment contract, not an active hosting target.
- The GitHub branch/draft PR is source review and CI only. No Vercel preview or production deployment is requested or needed for this owner-built/tested stage.
- No database migration, real-data deployment, production deploy, feature expansion, or later-phase work occurred.
- GA0-A2 has not started.

### Delivered contracts and containment

- Added `src/lib/trader-intelligence-v3/` with deployment, auth, contracts, domain, and testing boundaries.
- Added stable deployment validation and reason codes for profile, hosting, storage, data mode, owner identity, hosted/local mismatch, and local-bypass rejection.
- Added a machine-readable matrix for all 51 Intelligence pages and 31 relevant Intelligence APIs.
- Owner authorization runs before reachable repository-backed page/API work.
- Private-hosted diagnostics and legacy level-delivery provider routes are disabled.
- Unsafe API methods require an exact same-origin or explicitly approved Origin before handler invocation and emit a structured mutation diagnostic.
- Intelligence pages and APIs force dynamic private no-store behavior at framework, response, CDN, and Vercel cache layers.
- Unauthorized private API responses are generic and do not echo requested resource identifiers.
- Added architecture and private-data scanners to local scripts and CI.
- Added ignore rules for private data, broker exports, private fixtures, and private screenshots.
- Replaced realistic-looking synthetic broker account values with explicit `SYNTHETIC-ACCOUNT` fixture labels.
- Added the current-system inventory and legacy hazard register.

### Intelligence/Academy boundary decision

- Trader Intelligence and Academy are separate applications.
- No Academy source, registry, lesson, role, progress, entitlement, or product behavior was changed or made part of Trader Intelligence authorization.
- Private-hosted GA0-A1 temporarily resolves the Discord subject from the existing session record through one narrow compatibility adapter, maps it to a configured internal Intelligence owner ID, and ignores premium role settings.
- The authorization mode is named `provisional_discord_session_adapter`, not Academy authorization.
- An Intelligence-owned Discord and optional normal-login/session implementation may replace this adapter later without changing the owner contract.
- The controlling specification no longer includes Academy lesson links as a Trader Intelligence product capability.

### Inventory and open hazards

- The current implementation remains a single-user prototype, not production-ready v3 authority.
- Demo identities, direct SQLite construction, temporary production storage behavior, 32-bit fingerprints, JavaScript-number financial fields, lifecycle overrides, browser filters, chart evidence gaps, request-lifecycle jobs, JSON query authority, nearest-level coaching, and fixed coaching templates remain open hazards.
- GA0-A1 contains those paths; it does not modernize or certify them.
- Private-hosted configuration requires `private_database`, but no production database adapter or deployment was added.

### Verification

- `npm ci` — passed; 603 packages installed, with the existing audit report of 5 vulnerabilities (2 low, 1 moderate, 2 high).
- `npx tsc --noEmit` — passed.
- changed-path ESLint — passed with two pre-existing unused-variable warnings in `app/intelligence/coach/page.tsx` and no errors.
- focused v3 containment suite — passed: 5 files, 50 tests.
- route compatibility suite — passed: 12 files, 87 tests.
- `npm test` — passed: 162 files, 1,437 tests.
- `npm run verify:layer2` — passed with the canonical 13-pattern result.
- `npm run verify:layer3` — passed with canonical regression `PASS`.
- `npm run verify:ti-v3:architecture` — passed, scanning 69 relevant source files.
- `npm run verify:ti-v3:private-data` — passed, scanning 23,530 worktree records before staging and 23,614 worktree/index records after staging.
- `npm run build` — passed; all 51 Intelligence pages and relevant APIs are dynamic. Next emitted five existing broad filesystem-tracing warnings around legacy stores/provider code, reinforcing registered hazards without failing the build.
- seeded level-analysis trade-detail browser flow — passed: 1 Playwright scenario after explicit local-owner and approved-Origin configuration.
- Normal verification made no live model or market-data calls.

### Exact resume point

1. review draft PR #102 and the GA0-A1 containment decisions/known hazards;
2. merge or explicitly accept GA0-A1 before beginning GA0-A2;
3. if accepted, create the GA0-A2 branch from the accepted baseline;
4. do not implement analytics, chart rendering, AI, support/resistance, or deployment on this branch.

### Local owner test configuration

For a local development session, set:

```text
TRADER_INTELLIGENCE_DEPLOYMENT_PROFILE=private_owner_alpha
TRADER_INTELLIGENCE_HOSTING_MODE=local_only
TRADER_INTELLIGENCE_STORAGE_MODE=local_sqlite
TRADER_INTELLIGENCE_DATA_MODE=sample_data
TRADER_INTELLIGENCE_OWNER_ID=local-owner
```

Then run `npm run dev` and open `/intelligence`. Real owner data remains outside Git; switching to it is a separate explicit local data-mode choice. No Vercel command is part of this workflow.

---

## 2026-07-17 — Fifth-Pass QA Complete; Query and Visual Evidence Architecture Accepted

### Status

- Five independent QA/engineering passes are complete.
- The v3 architecture remains approved for staged private-owner-alpha implementation.
- The fifth pass found no reason to restart or replace the architecture.
- The user requirement for date/time natural-language questions with supporting charts is accepted as a core future capability.
- Charts are now formally treated as deterministic evidence artifacts rather than decorative AI output.
- The controlling architecture specification was rewritten to include all accepted fourth- and fifth-pass decisions.
- The active GA0-A plan was updated so canonical query/filter contracts enter GA0-A3, validated chart-ready series enter GA0-B, deterministic accessible chart rendering enters GA1, and AI visual selection enters GA2.
- `plan.md`, `handoff.md`, and the plan index now reflect that sequence.
- Current runtime gate remains **GA0-A1 — containment and architecture boundaries**.
- No runtime code changed.
- No production deployment was requested or authorized.

### Fifth-pass audit

`src/docs/trader-intelligence-v3-fifth-pass-qa-query-filter-visual-evidence-and-accessibility-review-2026-07-17.md`

### Active implementation plan

`src/docs/trader-intelligence-v3-ga0-a-control-and-exact-truth-implementation-plan-2026-07-17.md`

### Key fifth-pass repository findings

1. **Current analytical filters are prototype-limited**
   - current filters cover symbol, direction, session, entry hour, outcome, and lifecycle;
   - date ranges, relative periods, date/time basis, timezone, comparisons, currency, and capability are not first-class;
   - current client filtering cannot become authoritative v3 analytics.

2. **Current chart contracts lack evidence semantics**
   - current chart types contain labels and numeric values but not units, currency, timezone, manifests, filters, evidence, exclusions, coverage, capability, or accessibility contracts.

3. **Current chart builders are prototype numeric presentation code**
   - current builders use JavaScript numbers and display rounding;
   - they are not v3 financial authority.

4. **Current chart primitives require visual-integrity redesign**
   - hard-coded or presentation-only scaling cannot become analytical evidence;
   - sign must not rely on color alone;
   - accessible table alternatives and drill-down are not yet contractual.

5. **Natural-language date/time questions need deterministic resolution**
   - date basis, time basis, timezone, inclusivity, calendar/trading sessions, relative-date anchor, absolute resolution, and cutoff must be canonical and visible.

6. **Visuals and prose must share one truth**
   - same analysis snapshot;
   - same filter digest;
   - same claims/series;
   - same units/currency/timezone;
   - same denominators, exclusions, and limitations.

7. **AI cannot create chart values or code**
   - it may select approved tools and approved visual-template IDs only after deterministic validation.

8. **Accessibility is part of correctness**
   - every chart requires semantic title, accessible summary, exact table alternative, keyboard drill-down, focus, contrast, reduced motion, and non-color-only meaning.

9. **Date/period comparison fairness is explicit**
   - partial versus complete periods;
   - calendar versus trading sessions;
   - holidays and different trading-day counts;
   - strategy eras;
   - rule effective dates;
   - account-size changes.

10. **Chart artifacts are content-addressed and replayable**
    - old visuals retain original data and metadata;
    - stale data marks visuals stale rather than silently redrawing under old evidence links.

### Accepted query/filter architecture

A canonical filter records:

- server-derived account/workspace scope;
- date basis;
- time basis;
- timezone;
- start/end and inclusivity;
- calendar versus trading sessions;
- relative-date anchor and resolved absolute range;
- instruments, directions, sessions, lifecycle, setups, outcomes, currencies, and capabilities;
- open-position policy;
- analysis cutoff;
- content digest.

Server/domain code owns filtering and aggregation.

### Accepted visual evidence architecture

Validated series carry:

- derivation and analysis snapshot;
- filter digest;
- exact values and units;
- currency/timezone;
- candidate/eligible/included/excluded counts;
- exclusion reasons;
- coverage/capability/statistical mode;
- evidence set;
- limitations;
- content digest.

Visual specs reference approved template IDs and server-owned series/claims.

They do not contain arbitrary code or model-supplied values.

### Text/chart consistency

Before display/persistence, validation confirms:

- prose and visuals share snapshot/filter/date/time/unit/currency/denominator;
- every chart value resolves to a series point;
- every prose number resolves to a claim;
- exclusions/limitations remain visible;
- unsupported visuals are suppressed while deterministic text/table output remains available where safe.

### Updated delivery sequence

#### GA0-A1

- containment and architecture boundaries only.

#### GA0-A2

- canonical execution and exact financial truth.

#### GA0-A3

- temporal/manifests/eligibility/evidence;
- canonical date/time/filter contract and digest;
- no query UI or chart renderer.

#### GA0-B

- deterministic weekday/daily-stop tools;
- exact tables;
- validated claims/evidence;
- validated chart-ready series.

#### GA0-C

- private filter/table/series calibration and reconciliation.

#### GA1

- deterministic query/filter UI;
- accessible visual-template registry/renderer;
- table alternatives and evidence drill-down;
- text/chart consistency validation;
- visual replay/performance.

#### GA2

- natural-language intent proposal;
- approved tool and visual-template selection;
- grounded explanation and feedback.

### Current next action

After documentation PR acceptance:

1. create `agent/trader-intelligence-v3-ga0-a1-containment` from current `main`;
2. implement GA0-A1 only;
3. run containment, architecture, private-data, typecheck, tests, Layer 2/3, and build;
4. open a focused draft PR;
5. review before GA0-A2;
6. do not implement analytics, chart rendering, AI, support/resistance, or deployment.

---

## 2026-07-17 — Fourth-Pass QA Summary

Accepted decisions:

- owner route containment;
- canonical serialization and cryptographic identity;
- explicit duplicate/collision states;
- lifecycle truth separated from review disposition;
- bitemporal corrections;
- immutable analysis snapshots;
- stable evidence references;
- runtime validation;
- parser hardening;
- WAL-safe backup/restore;
- GA0-A1/A2/A3 split.

Audit:

`src/docs/trader-intelligence-v3-fourth-pass-qa-operational-integrity-canonical-identity-and-delivery-review-2026-07-17.md`

---

## 2026-07-17 — Third-Pass QA Summary

Accepted decisions:

- one controlling architecture specification;
- content-addressed manifests;
- dataset coverage;
- per-capability eligibility;
- external-source registry;
- no authoritative runtime web search;
- reproducibility and usefulness evaluation;
- statistical modes and exploration ledger.

Audit:

`src/docs/trader-intelligence-v3-third-pass-qa-source-governance-reproducibility-and-evaluation-review-2026-07-17.md`

---

## 2026-07-17 — Second-Pass QA Summary

Accepted decisions:

- private-owner-alpha sequencing;
- small/micro-cap specialization;
- evidence capability tiers;
- instrument/basis/session/halt/quote/float/catalyst rules;
- educational boundary;
- owner-only AI after deterministic grounding.

Audit:

`src/docs/trader-intelligence-v3-second-pass-qa-private-alpha-small-micro-cap-review-2026-07-17.md`

---

## 2026-07-17 — First QA Summary

Accepted decisions:

- exact financial types and P/L policy;
- future identity/tenancy/persistence/ingestion/durable-job requirements;
- statistical and AI grounding gates;
- migration and CI requirements;
- support/resistance Zone Usability and Congestion Layer.

Audit:

`src/docs/trader-intelligence-v3-qa-architecture-review-2026-07-17.md`

---

# Active Decision Register

## Deployment/hosting

- current profile `private_owner_alpha`;
- hosting `local_only` or `private_hosted`;
- private-hosted requires owner auth on all Intelligence pages/APIs;
- profile checks fail closed.

## Canonical financial truth

- no JavaScript-number authority;
- canonical exact decimals;
- cryptographic content identity;
- explicit duplicate/correction states;
- exact/versioned P/L and reconstruction policy;
- user review cannot change inventory.

## Coverage/manifests/snapshot

- explicit account/period/gaps/overlap/exclusions/open/prior-inventory/currency coverage;
- content-addressed dataset/derivation/answer/visual artifacts;
- one immutable analysis snapshot per answer;
- stable evidence references.

## Query/filter

- explicit date/time basis and timezone;
- visible absolute resolution of relative periods;
- calendar versus trading-session distinction;
- content-addressed server-authoritative filter;
- analysis cutoff.

## Visual evidence

- server-owned validated series;
- approved visual templates only;
- same truth as prose;
- units/currency/timezone/counts/exclusions/limitations;
- evidence drill-down;
- accessible summary/table;
- no model values/code;
- charts are supporting evidence, not causal proof.

## AI

- after deterministic tables/series and validators;
- approved tools/templates;
- bounded planning;
- no raw CSV;
- no runtime web truth;
- cost/access/evaluation controls.

## Support/resistance

- keep `levels-system-v2`;
- no second detector;
- zone usability/congestion/suppression;
- no v3 AI/visual use until usefulness gates.

---

# Gate Status

| Gate | Status | Notes |
|---|---|---|
| GA0-A1 Containment | Implementation complete; review pending | Focused draft PR is the current resume point |
| GA0-A2 Exact truth | Not started | After A1 review |
| GA0-A3 Temporal/manifests/query foundation | Not started | After A2 review |
| GA0-B Deterministic tools/series | Not started | Weekday and daily-stop |
| GA0-C Private calibration | Not started | Real-data verification outside Git |
| GA1 Query/visual evidence | Not started | Accessible deterministic visuals |
| GA2 Owner-only AI | Not started | Tool/template selection after grounding |
| GA3 Market enrichment | Not started | One qualified capability at a time |
| GA4 Usefulness | Not started | Compare table/visual/legacy/AI/abstention |
| Public track | Not started | Required before invited/public users |

---

# Update Rules

After meaningful work record:

- branch/PR;
- profile/hosting mode;
- files/contracts changed;
- accepted decisions;
- financial/filter/visual schema versions;
- capabilities;
- tests and exact results;
- data migration state;
- feature flags;
- rollout/deployment state;
- private-data handling;
- limitations;
- exact next resume point.

Do not mark a gate complete because one test passes.
