## 2026-07-24 - GA0-B3 final focused remediation in progress

- Current re-audit findings head: `f5427b098b5e1f218b666c8c29b8603ad36b38a2`.
- The existing branch and draft PR #156 remain the only implementation
  surface. No branch, merge, deployment, review-thread mutation, or GA0-B4
  work is authorized.
- Final remediation covers fail-closed mixed same-time completion groups,
  exact empty-included aggregate authority, 512-character source identities,
  complete simulation authority for classification, and versioned B3 sample
  authority bound to threshold-reached sessions.
- Current resume point: run the complete required verification, checkpoint and
  push the executable commit, observe CI, then create the required later
  Markdown-only final independent re-audit handoff and stop.

# Trader Intelligence v3 Project Log

## 2026-07-25 - GA0-B3 final focused corrections active

- The current independent re-audit findings head is
  `063fb14c67adaa9a8f9269287e2aa0e33c7d3810`; work remains confined to the
  existing branch and draft PR #156.
- The executable correction narrows the 512-character key allowance to B3
  candidate/simulation semantic arrays and makes B3 sample authority
  content-addressed and verified against the run context, literal v1 source
  tables, exact threshold-reached session row keys/count, and claim direction
  and wording.
- Exact next action: run final checks, push the executable correction and wait
  for CI, then update the existing handoff as a later Markdown-only commit,
  wait for docs CI, add the single required top-level PR handoff comment, and
  stop. No merge, deployment, thread resolution, or GA0-B4.

## 2026-07-24 - GA0-B3 independent-audit remediation active

- Independent audit findings head is
  `063fb14c67adaa9a8f9269287e2aa0e33c7d3810`; the verdict was accept with
  required fixes R1-R7.
- The existing branch and draft PR #156 remain the only implementation
  surface. Ambiguous sessions are excluded from simulation, aggregate, claims,
  and series with preserved actual evidence; claims use threshold-reached
  sample authority; and limitations are projected across the complete graph.
- Exact next action: complete focused verification, push the executable
  remediation, then make the required later Markdown-only re-audit handoff and
stop. No merge, deployment, thread resolution, or GA0-B4.

## 2026-07-24 - GA0-B3 consecutive-loss daily-stop simulation active

- GA0-B2 was independently accepted and merged through PR #150 at
  `4338cab7d46b8a0548b22346f81b42db5fec3bf0`; this exact SHA is the current
  `origin/main` and B3 merge base.
- GA0-B3 is active on
  `agent/trader-intelligence-v3-ga0-b3-daily-stop-proof` with no deployment.
  The requested draft PR is not opened yet; it will be the single B3 PR after
  the executable checkpoint.
- The current scope is only `simulate_daily_stop_rule:v1`, its controlling ADR,
  exact proof artifact graph, independent reference differential tests, and
  audit handoff. The owner checkout's unrelated dirty UI/Academy work remains
  untouched in a separate linked worktree.
- The stale B2-awaiting-audit gate is superseded for this active branch. The
  stop boundary remains draft/unmerged, no audit thread changes, no deployment,
  and no GA0-B4.

## 2026-07-24 - GA0-B2 second independent-re-audit remediation checkpoint

- Current re-audit findings head: `baf1952812fcb563b32e4f7e7d19d1efa14b8602`.
- Final focused executable checkpoint: `1f5ef73615e491c026af930674dcc340f822e9ee`.
- Closed the two remaining policy gaps: complete exclusion-ledger claim
  neutrality and strict `completed`-only claim emission. The execution
  authority now binds `analyze_performance_by_weekday:v1` directly.
- Local focused evidence: GA0-B2 `24/24`; affected B1/A3 `42/42`; TypeScript
  clean; architecture and private-data verifiers passed.
- `verify:ti-v3:ga0-a2` reached `306/308`; only two unchanged SQLite tests
  failed because the shared dependency junction lacks the `better-sqlite3`
  native binding. ESLint remains blocked by the separate missing
  `acorn-jsx/xhtml` junction dependency.
- Executable CI run `30072623898`, job `89416481209`, passed.
- Next and final substantive repository change: the second independent
  re-audit handoff Markdown-only commit. Keep PR #150 draft/open/unmerged,
  leave threads unresolved, do not deploy, and do not begin GA0-B3.

## 2026-07-24 - GA0-B2 independent-audit remediation executable checkpoint

- Remediated B2-AUD-R1 through R6 on the existing draft PR #150 branch.
- Executable checkpoint: `07a6827f` (`fix(ti-v3): remediate GA0-B2 weekday audit findings`).
- Local focused evidence: TypeScript clean; GA0-B2 focused suite `22/22`; replay,
  decision-time after-loss, limitation propagation, exact decompositions, DST,
  hostile-key boundaries, and accepted 30/64-row graph measurements pass.
- GitHub Actions `test-and-verify` passed for executable run `30069784565`,
  job `89408059973`.
- ESLint was attempted on every changed TypeScript file but remains blocked by
  the pre-existing shared junction failure `acorn-jsx/xhtml` missing; no
  dependency files were changed.
- The required final docs-only independent re-audit handoff is the next and
  final substantive repository change. Keep PR #150 draft/open/unmerged,
  leave review threads unresolved, do not deploy, and do not begin GA0-B3.

## 2026-07-23 — GA0-B2 weekday deterministic proof implemented

GA0-B1 was accepted in merge
`7d8d8e03826e4b877b22e9a2a68d381bb42e585d`. The current roadmap slice is the
local-only `analyze_performance_by_weekday:v1` deterministic proof. It is being
prepared as a draft PR for independent audit; no production deployment or
GA0-B3 implementation is in scope.

Draft PR #150 now contains executable checkpoint
`532f382859b60f19bcf701f4c731b1497c12dac1`; its GitHub Actions
`test-and-verify` job passed. The PR remains draft and unmerged pending
independent audit.

## 2026-07-19 — GA0-A3 Required-Fix Remediation Complete; Re-audit Required

- The first independent audit verdict was `accept with required fixes`; its
  immutable findings are in
  `src/docs/trader-intelligence-v3-ga0-a3-independent-audit-findings-2026-07-19.md`.
- A3-R1 through A3-R10 are remediated on the existing branch and draft PR #106.
- Tested executable head:
  `883d62ea009102037626207a96cad31f482ceb4a`.
- Correction replay now requires a verified execution catalog and same-lineage
  supersession. Eligibility, empty enrichment, snapshots, filters, and evidence
  use opaque verified dependency chains. Manifests enforce referential
  integrity. Persisted JSON, unknown runtime inputs, and CSV limits fail closed.
- The consolidated verifier passed 6 files/83 tests. Final TypeScript,
  changed-path ESLint, architecture guard, private-data guard, and the one build
  passed. Intermediate timeout, compile, and integration failures are retained
  in the remediation handoff rather than being described as passes.
- GA0-A3 remains unaccepted. PR #106 stays draft, unmerged, and undeployed;
  review threads remain unresolved. GA0-B has not begun.
- Exact next action: independent re-audit. After acceptance, proceed toward
  visible owner-testable analytics and AI while production hosting and
  public-user security remain deferred.

## 2026-07-18 — GA0-A3 Implementation Candidate Complete; Independent Audit Required

- Branch: `agent/trader-intelligence-v3-ga0-a3-manifests`.
- Accepted base: GA0-A2 merge commit
  `e6d0183cd03f55fb4b2b396f4f35ac2b2d035a8a` from merged PR #104.
- Executable implementation head: `50d1d9c1`.
- Implemented append-only bitemporal corrections, factual lifecycle separated
  from review disposition, retrospective/open-position policy, immutable
  dataset/coverage manifests, independent per-capability eligibility,
  content-addressed snapshots, semantic evidence references, canonical filters,
  strict runtime payload validation, stale-state propagation, WAL-consistent
  SQLite backup/restore, and narrow parser hardening.
- Open positions remain execution-review only and cannot receive live
  directional guidance. Legacy mark-closed behavior remains annotation-only.
- Focused synthetic tests cover replay ordering/cutoffs/cycles, review isolation,
  equivalent reimport identity, coverage gaps, capability isolation, mixed
  snapshot/evidence rejection, fixed-clock date resolution, stale propagation,
  payload rejection, WAL restore truth, and parser ambiguity.
- No analytics, query UI, charts, AI/model call, natural-language parser,
  market enrichment, support/resistance, public hosting, migration, deployment,
  or GA0-B work was added.
- GA0-A3 is not accepted. Next resume point is independent audit of
  `src/docs/trader-intelligence-v3-ga0-a3-implementation-and-audit-handoff-2026-07-18.md`.

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

## 2026-07-18 — GA0-A2 Accepted and Merged; GA0-A3 Active

- GA0-A2 received independent acceptance and is complete.
- PR #104 merged into `main` as
  `e6d0183cd03f55fb4b2b396f4f35ac2b2d035a8a`.
- The accepted merge is the base commit for GA0-A3 and was verified as an
  ancestor before implementation began.
- GA0-A3 — Temporal, Manifest, Eligibility, and Query Foundation — is the
  active slice on `agent/trader-intelligence-v3-ga0-a3-manifests`.
- GA0-A3 began only on that new branch. It does not reopen or modify PR #104.
- The product priority remains moving next toward visible, owner-testable
  deterministic analytics and AI functionality after this final factual
  foundation is independently accepted.
- Only `private_owner_alpha + local_only + local_sqlite` is operational.
  Production hosting and public-user security remain deferred.
- No deployment is authorized. GA0-B, analytics, query UI, charts, AI/model
  calls, market enrichment, support/resistance, hosted identity, and public
  accounts remain out of scope.
- Exact next resume point: implement the complete section 7 GA0-A3 contracts,
  run the prescribed focused and consolidated verification, publish one draft
  PR, and stop for independent audit without merge or deployment.

## 2026-07-18 - GA0-A2 Final Correction Implemented; Untested Re-audit Candidate

- The latest independent re-audit of executable head
  `c1a1b50379165485d28f0e0a28a21c3917cac820` accepted every prior remediation
  except the correction/bust pair-scope defect recorded at documentation head
  `f3a69ac75979aec992f58c52ce1d652cf4251734`.
- The focused executable correction is
  `8b141633f19e10dfd503e4c1e83f5660e7e4e9b7` on
  `agent/trader-intelligence-v3-ga0-a2-exact-truth` and draft PR #104.
- Stable execution identity and correction-reference pairing now require the
  same canonical owner, account, resolved stable instrument, currency, broker,
  and source system. The corresponding candidate-index keys use that same
  ledger identity, so reused execution IDs or correction-reference text cannot
  connect unrelated instruments or currencies.
- Intrinsic unresolved correction/bust state remains scoped to its own ledger
  group. GA0-A3 correction application and bitemporal persistence remain
  deferred.
- At the owner's explicit direction, no local test, TypeScript, ESLint,
  architecture, privacy, Layer 2/3, build, Playwright, or GitHub Actions wait
  was performed for this correction. This is an unverified implementation
  candidate, not an accepted or regression-safe result.
- Exact next resume point: independently review executable head
  `8b141633f19e10dfd503e4c1e83f5660e7e4e9b7`, keep PR #104 draft and unmerged,
  leave audit threads unresolved, do not deploy, and do not begin GA0-A3.

## 2026-07-18 - GA0-A2 Second Remediation Complete; Independent Re-audit Pending

- Independent re-audit input implementation:
  `88db72e70538e2222ae8467c5245fa4b8eb85600`.
- Stable findings/audit-document head:
  `480cb480d4ee80e7fe3626a94a1b5622765dd773`.
- Fully tested second-remediation implementation head:
  `9721a2707d936987f3b0e116226dd20de400cf58`.
- Branch remains `agent/trader-intelligence-v3-ga0-a2-exact-truth`; draft PR
  #104 remains unmerged. GA0-A2 is not accepted and GA0-A3 has not begun.
- A2-R1 through A2-R7 are implemented: exhaustive opaque relationship
  coverage, explicit versioned starting inventory, deep immutable envelope
  integrity, conservative validation/document-aware suppression,
  prototype-safe canonical dictionaries, unknown-precision ambiguity, and
  canonical bounded row numbers.
- The exact executable head passed 14 GA0-A2 files/263 tests, 177 full-suite
  files/1,763 tests, 19 fixed property suites/19,000 generated cases, 11
  production/reference differential tests, TypeScript, changed-path ESLint,
  architecture, private-data tree/history, Layer 2, Layer 3, and the 127-page
  build. No package file changed, so `npm ci` was not repeated. No browser file
  changed, so Playwright was not manually rerun.
- The next commit is documentation-only. It must receive only the lightweight
  documentation-head checks specified in the last-run report. No executable
  suite is to be duplicated solely for Markdown changes.
- No hosted mode is operational. No live model, provider, payment, Discord,
  Vercel, production database, deployment, or production external call
  occurred.
- Exact next resume point: independently re-audit current PR #104 at its exact
  head against the stable A2-R1 through A2-R7 findings and full branch diff.
  Keep review threads unresolved, the PR draft and unmerged, and do not start
  GA0-A3.

## 2026-07-18 — GA0-A2 Independent-Audit Remediation Complete; Re-audit Pending

### Immutable heads and status

- Independent-audited head:
  `542992b6a7c54ce871c31bc2831126c850fea04c`.
- Fully tested remediation implementation head:
  `b92b321fab7801212c82125511e58c754e594fea`.
- Branch and draft PR remain
  `agent/trader-intelligence-v3-ga0-a2-exact-truth` and PR #104.
- The commit following the implementation head changes documentation only and
  records this handoff. No runtime, test, dependency, build, CI, or generated
  contract file changes after the complete implementation-head test run.
- GA0-A2 is not accepted. PR #104 must remain draft and unmerged for a new
  independent audit. GA0-A3 has not begun.

### Required audit remediation delivered

- Duplicate suppression now requires equal canonical digest, equal canonical
  bytes, and proven equal source identity/document/row evidence. Unequal bytes
  under a stable execution ID are correction/conflict or review, never an
  automatically suppressed duplicate.
- Relationship classifications carry both execution digests. A deterministic
  pre-group resolver verifies input membership, recomputes the classification,
  validates ledger-group scope, suppresses one occurrence per proven pair,
  and scopes unresolved re-export, possible duplicate, manual review,
  correction, collision, forged, and cross-group states to the correct result.
- Broker indices, fill sequence, execution-ID ordering, and source row order
  are restricted to their declared broker/source/document/order namespaces.
  Economic-equivalence ties compare every accounting and validation field
  that can change the result.
- Canonical execution construction is total for `unknown`, validates ordering
  semantics/scope/namespace and malformed nested shapes, and returns the
  normalized canonical value represented by its bytes and digest.
- Exact-decimal input is capped at 256 raw characters before regex/library
  parsing. The ADR now selects future PostgreSQL `NUMERIC(72,24)` plus domain
  constraints, because `NUMERIC(48,24)` cannot hold a valid 48-digit integer.
- Canonical authorities use the explicit Unicode code-point comparator; a new
  architecture finding rejects locale-sensitive comparison in those modules.
- All 35 fixture rows now have executable synthetic inputs and a table-driven
  builder/order/classifier/reconstruction authority test with hard-coded
  expectations and applicable digest vectors.
- Production/reference comparison now covers open lots, matched quantity per
  execution, reversals, exact weighted ratios, round trips, and blocked codes
  in addition to ending quantity, gross, charges, net, and cash flow.

### Fixed property evidence

Every suite runs 1,000 deterministic cases with `verbose: 2`:

| Suite | Seed |
| --- | ---: |
| Flat long | `2026071801` |
| Flat short | `2026071802` |
| Partial fills | `2026071803` |
| Long-to-short reversals | `2026071804` |
| Duplicate classification | `2026071805` |
| Canonical property order | `2026071806` |
| Digest semantics | `2026071807` |
| Ambiguous ordering | `2026071808` |
| Short-to-long reversals | `2026071809` |
| Prior inventory | `2026071810` |
| Currency isolation | `2026071811` |
| Relationship resolution | `2026071812` |
| Blocked states | `2026071813` |
| Price/quantity scale boundaries | `2026071814` |
| 48-digit precision boundaries | `2026071815` |

Total: 15 suites and 15,000 fixed-seed cases.

### Complete implementation-head verification

- `git diff --check origin/main...HEAD`: passed.
- `npm ci`: intentionally not repeated; no dependency or lock file changed
  after the already tested audited head.
- `npx tsc --noEmit --pretty false`: passed.
- changed-path `npx eslint`: passed with zero errors and zero warnings.
- `npm run verify:ti-v3:ga0-a2`: passed; 14 files and 231 tests. Its
  architecture scan passed 371 files/42 API routes/82 classified routes; its
  private-data scan passed 23,693 records, 23,590 final-tree records, and 103
  PR-history blobs.
- `npm test`: passed; 177 files and 1,731 tests. Vitest emitted only temporary
  Git line-ending/branch messages from its isolated test repositories.
- standalone `npm run verify:ti-v3:architecture`: passed 371/42/82.
- standalone `npm run verify:ti-v3:private-data`: passed 23,693/23,590/103.
- `npm run verify:layer2`: passed with 13 expected/detected patterns.
- `npm run verify:layer3`: passed canonical regression.
- `npm run build`: passed; Academy registry passed and Next generated 127
  pages. The pre-existing 19 Academy registry notices and five Turbopack broad
  tracing warnings remain.
- `npm run test:e2e:level-analysis`: intentionally not manually rerun because
  this remediation changed no route, local server, Next configuration,
  browser-facing code, or E2E configuration.
- No live model, market/financial provider, SEC/Nasdaq/FINRA, Whop/payment,
  Discord, Vercel, production database, production deployment, or deployment
  call occurred.

### Exact next resume point

Independently re-audit the complete `origin/main...HEAD` diff at PR #104,
using the remediation addendum in the GA0-A2 audit handoff. Keep the PR draft
and unmerged. Record acceptance separately only if the re-audit warrants it;
do not begin GA0-A3 from this entry.

## 2026-07-18 — GA0-A2 Implementation Candidate Complete; Independent Audit Pending

### Status and scope

- Accepted ancestor: `4f9e440116258c9548a2d13f7ea057a9075101c6`.
- Branch: `agent/trader-intelligence-v3-ga0-a2-exact-truth`.
- GA0-A2 is implementation-complete as a review candidate, but it is not
  accepted. The branch must remain a draft PR until independent audit.
- The only operational product combination remains
  `private_owner_alpha + local_only + local_sqlite`.
- No route, UI, current saved data, database schema, owner prototype, hosted
  mode, production system, model, market-data provider, or external financial
  service was connected to the new authority.
- GA0-A3 has not begun. Bitemporal correction application, append-only
  correction persistence, manifests, eligibility, snapshots, evidence
  references, query/filter work, and backup/restore remain deferred.

### Exact-truth authority delivered

- Exact domain contracts expose validated canonical decimal strings. The
  isolated Decimal clone uses precision 128, `ROUND_HALF_EVEN`, and disabled
  exponent output; ordinary values allow 48 significant and 24 fractional
  digits, while execution price and quantity allow at most 12 fractional
  digits. Signed zero is canonical `0`, ordinary validation returns stable
  reason codes, and no implicit rounding or JavaScript-number conversion is
  authoritative.
- Exact ratios use reduced BigInt numerator/denominator values, a positive
  denominator, canonical `0/1`, cross-multiplication comparison, 256-digit
  input guards, and explicit versioned half-even decimal conversion only.
- Canonical serialization is UTF-8 JSON with NFC strings, LF line endings,
  Unicode-code-point key order, deterministic escaping, preserved array order,
  explicit null/omitted behavior, and rejection of undefined, all JavaScript
  numbers, non-finite values, BigInt values, and duplicate raw-JSON keys before
  ordinary parsing can discard them.
- Canonical timestamps are strict Gregorian UTC values with uppercase `Z` and
  nine fractional digits. Source precision remains separate and contributes
  an interval for meaningful-order analysis.
- Identity is SHA-256 over canonical bytes with lowercase hexadecimal and
  domain separation such as
  `ti_v3:canonical_execution:v1:sha256:<64-lowercase-hex>`. Database IDs,
  import IDs, storage clocks, display labels, mutable review state, and the
  digest itself are excluded. Digest equality is byte-verified; unequal bytes
  under an injected equal test hash produce a fail-closed collision state.
- The canonical execution contract preserves source/evidence provenance,
  stable non-account-number account identity, raw and resolved instrument
  evidence, aggregation state, timestamp evidence, side/position-effect/short
  evidence, exact quantity/price/charges/net cash, identifiers, correction
  evidence, validation, and canonical content identity. Owner-reported and
  hypothetical sources cannot be promoted to broker-confirmed evidence.
- Stable storage ordering is separate from economically meaningful ordering.
  Digest order is only a deterministic storage tie-break and cannot resolve
  overlapping source-precision intervals or missing broker sequence evidence.
  Results distinguish ordered, economically equivalent ties, ambiguous
  meaningful order, and conflicting evidence with stable reason codes.
- Relationship classification distinguishes exact same-source duplicates,
  re-exports, corrections/busts, ambiguous possible duplicates, legitimate
  repeated fills, collisions, manual review, and distinct executions. Only
  byte-proven exact same-source duplicates are suppression-eligible.
- Policy-v1 analytical reconstruction uses exact FIFO lots by owner, account,
  instrument, and currency. Longs, shorts, partials, reversals, broker average
  fills, charges, and negative rebates are exact. Charges are recognized at
  their execution and are not silently allocated. Flat-to-flat FIFO net P/L is
  checked independently against signed cash flow. Open inventory remains open;
  prior inventory, unresolved corrections/order/instrument/basis, unsupported
  security types, collisions, currency conflicts, and arithmetic overflow fail
  closed. No FX conversion, tax P/L, broker authority, or unrealized P/L is
  claimed.
- The independent reference ledger uses its own BigInt coefficient/scale and
  FIFO implementation. It imports neither `decimal.js` nor production exact
  arithmetic or matching helpers.

### Implementation and test inventory

- Runtime authority: `src/lib/trader-intelligence-v3/domain/{exact,canonical,identity,execution,accounting}/`.
- Independent reference and synthetic support:
  `src/lib/trader-intelligence-v3/testing/{reference,fixtures}/` plus the
  synthetic execution builder and collision hash.
- Test families: 12 GA0-A2 files plus the expanded architecture-boundary guard.
- Four binding ADRs cover exact decimals, canonical serialization/digests,
  execution ordering/identity, and analytical P/L/reconstruction.
- `decimal.js@10.6.0` is the only new runtime dependency;
  `fast-check@4.9.0` is the only new development dependency.
- `npm run verify:ti-v3:ga0-a2` is mandatory in normal CI and performs no live
  model, market-data, SEC, Nasdaq, FINRA, Whop, payment, Discord, Vercel, or
  production-database call.
- The branch changes 60 files. They are limited to the four ADRs and continuity
  docs, package/lock/CI wiring, isolated v3 exact-truth code/tests/guards, the
  architecture verifier, and the safe legacy fingerprint type rename.

The 35 synthetic fixture expectations cover: simple and multi-fill longs;
simple and multi-fill shorts; both reversal directions; positive, zero, and
negative charges; open long/short inventory; missing prior long/short
inventory; legitimate repeated fills; exact duplicates; re-exports;
corrections and busts; sequenced and ambiguous same-time fills; sub-dollar and
fractional precision; large valid notional; precision and scale rejection;
separate USD/CAD ledgers; broker average fills; unresolved instruments;
corporate-action and symbol-continuity blocks; collision simulation;
persistence-ID independence; and source/economic digest changes. All fixtures
use synthetic account, source, execution, and instrument values.

### Fixed property evidence

Every suite runs 1,000 cases from BigInt coefficient-and-scale generators with
`verbose: 2`, so failures report a reproducible seed and path:

| Suite | Seed | Runs |
|---|---:|---:|
| Flat long | `2026071801` | 1,000 |
| Flat short | `2026071802` | 1,000 |
| Partial fills | `2026071803` | 1,000 |
| Reversals | `2026071804` | 1,000 |
| Duplicate classification | `2026071805` | 1,000 |
| Canonical property order | `2026071806` | 1,000 |
| Digest semantics | `2026071807` | 1,000 |
| Ambiguous ordering | `2026071808` | 1,000 |

### Verification record

- `git diff --check`: passed.
- `npm ci`: passed; 605 packages installed, 613 audited. npm reported 5
  existing audit findings: 2 low, 1 moderate, and 2 high.
- `npx tsc --noEmit --pretty false`: passed.
- changed-path `npx eslint`: passed with 0 errors and 0 warnings.
- `npm run verify:ti-v3:ga0-a2`: passed; 13 files and 117 tests, architecture
  scan passed across 369 files/42 API routes/82 classified routes, and the
  private-data guard passed across 23,651 records (23,586 final-tree records
  and 65 pre-final-commit PR-history blobs).
- explicit `npx vitest run` focused replay: 13 files and 117 tests passed.
- `npm test`: 176 files and 1,617 tests passed.
- `npm run verify:ti-v3:architecture`: passed with the same 369/42/82 counts.
- `npm run verify:ti-v3:private-data`: passed against the final staged tree and
  current branch history across 23,659 records: 23,594 final-tree records and
  65 pre-final-commit PR-history blobs. The post-commit replay also passed
  across 23,659 records: 23,586 final-tree records and 73 final branch-history
  blobs.
- `npm run verify:layer2`: passed with the canonical 13-pattern result.
- `npm run verify:layer3`: passed with canonical regression `PASS`.
- `npm run build`: passed; Academy registry validation passed and Next.js
  generated 127 pages. The build retains 19 known Academy registry notices and
  5 pre-existing Turbopack broad-file-tracing warnings.
- `npm run test:e2e:level-analysis`: passed; the build passed and 1 Chromium
  scenario passed against `127.0.0.1:3101`, a synthetic owner, and an isolated
  external test SQLite database.
- isolated SQLite TEXT round-trip: 1 file and 2 tests passed.
- production/reference differential: 1 file and 4 tests passed.
- all fixed-seed properties: 1 file and 8 tests passed, representing 8,000
  generated cases.
- GA0-A1 containment plus no-JavaScript-number-authority guard: 7 files and 141
  tests passed.
- affected legacy import/reconstruction regression: 3 files and 42 tests
  passed.

### Limitations and deferred boundary

- This slice defines authority but intentionally has no adapter from legacy
  imports, no current saved-data migration, no schema migration, and no route
  consumer. Existing v2 financial behavior and 32-bit fingerprints remain
  operational compatibility code and explicitly non-authoritative.
- Correction/bust facts are classified but not applied bitemporally. Dataset
  and coverage manifests, eligibility, snapshots, stable evidence references,
  date/query filters, and backup/restore belong to GA0-A3.
- No analytics, chart-ready series, charts, AI, prompts, embeddings, natural
  language, support/resistance, market enrichment, SEC/halt/float integration,
  setup classification, manual entry, period reflection, Real Coach/Whop,
  public users, hosted persistence, or deployment entered the branch.
- The existing npm audit findings and build tracing warnings are repository
  risks outside this isolated slice; neither was weakened or hidden.

### Exact next resume point

Review the draft PR against this entry and the four ADRs. Independently verify
the decimal grammar, canonical vectors, ordering ambiguity, suppression rules,
FIFO/reference agreement, fixed seeds, privacy/history scan, and legacy/route
isolation. Keep the PR draft and unmerged. If the audit accepts GA0-A2, record
that decision in a new project-log entry before planning GA0-A3. Do not begin
GA0-A3 from this implementation handoff.

## 2026-07-18 — GA0-A1 Accepted; GA0-A2 Is the Current Gate

### Accepted continuity decision

- GA0-A1 received independent acceptance and is complete.
- PR #102 merged into `main` as commit
  `4f9e440116258c9548a2d13f7ea057a9075101c6`.
- The accepted commit is the current `origin/main` and the required ancestor of
  this slice.
- GA0-A2 — Canonical Execution and Exact Financial Truth — is the current
  gate.
- Implementation branch:
  `agent/trader-intelligence-v3-ga0-a2-exact-truth`.
- Only `private_owner_alpha + local_only + local_sqlite` is operational.
- No hosted mode is operational, no deployment is authorized, and no GA0-A3
  work has begun.
- GA0-A2 will remain an implementation candidate until its draft PR receives
  independent review; this entry does not claim GA0-A2 acceptance.

### Current implementation boundary

Implement only exact financial domain values, canonical serialization and
content identity, canonical execution facts, ordering/ambiguity,
duplicate/correction/collision classification, exact FIFO analytical P/L,
independent BigInt/rational verification, synthetic fixtures, and the focused
guards/CI needed to prove those contracts. Do not connect the new authority to
current routes, current saved data, UI, analytics, charts, AI, market data,
support/resistance, manual entry, reflections, Real Coach/Whop, hosted storage,
or deployment.

### Exact next resume point

1. complete the four GA0-A2 ADRs and exact domain boundaries;
2. implement execution identity/order/classification and FIFO reconstruction;
3. prove the production implementation against the independent reference with
   recorded fixed seeds and exact synthetic fixtures;
4. run every required repository check and record exact results;
5. publish a draft PR, leave it unmerged, and stop for independent audit.

---

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
| GA0-A1 Containment | Accepted and complete | PR #102 merged as `4f9e440116258c9548a2d13f7ea057a9075101c6` |
| GA0-A2 Exact truth | Accepted and complete | PR #104 merged as `e6d0183cd03f55fb4b2b396f4f35ac2b2d035a8a` |
| GA0-A3 Temporal/manifests/query foundation | Implementation candidate complete | Draft PR; independent audit required before acceptance or GA0-B |
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
