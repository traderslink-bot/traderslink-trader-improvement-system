# Trader Intelligence v3 Project Log

## Purpose

This is the active continuity log for Trader Intelligence v3. It records the
current architecture decisions, deployment profile, gate status, verification,
private-data handling, and exact resume point.

The legacy `src/docs/codex-project-log.md` remains useful for v1/v2 history. It
does not control v3 architecture.

---

## Resume Protocol

Read in this order:

1. `plan.md`
2. this file
3. `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`
4. `src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`
5. detailed v3 reviews/master plan only when rationale is needed
6. legacy plans only for preserved code, fixtures, routes, education, or migration evidence

Precedence:

1. latest explicit decision in this log;
2. controlling architecture specification;
3. active execution plan;
4. detailed v3 reviews/master plan as rationale;
5. legacy documents.

This log may record gate progress. It may not silently weaken the controlling
specification. Material architecture changes require updating the specification.

---

# Current Resume Point

## 2026-07-17 — Third-Pass QA Complete; Architecture Consolidated

### Status

- Three independent architecture/QA passes are complete.
- The v3 direction remains approved for staged private-alpha implementation.
- A single controlling architecture specification now consolidates the accepted
  decisions from the master plan and all QA reviews.
- `plan.md`, `handoff.md`, and the plan index point to that same authority.
- The current runtime gate is **GA0-A — control and exact truth**.
- The former single Gate 0 run is split into GA0-A, GA0-B, and GA0-C.
- Official/free-to-access source opportunities were reviewed and recorded as
  qualified recommendations, not automatic dependencies.
- PR #94 remains documentation-only, open, mergeable, and draft.
- No runtime code changed.
- No production deployment was requested or authorized.

### Controlling document

- `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`

### Third-pass audit document

- `src/docs/trader-intelligence-v3-third-pass-qa-source-governance-reproducibility-and-evaluation-review-2026-07-17.md`

### Third-pass corrections

1. **One architecture authority**
   - Future runs no longer resolve several long controlling amendment documents.
   - Detailed reviews remain audit evidence and rationale.

2. **Content-addressed reproducibility**
   - Dataset, market-enrichment, derivation, and answer manifests identify the
     exact source data, policies, filters, exclusions, tools, claims, evidence,
     model, validation, and result hashes.

3. **Dataset coverage**
   - Record statement periods, gaps, overlaps, accounts, exclusions, open
     positions, prior inventory, and currencies.
   - Partial imports cannot be called the owner’s complete history.

4. **Per-capability eligibility**
   - Determine eligibility separately for execution, P/L, sequence, candles,
     VWAP, MFE/MAE, halts, quotes, slippage, float, catalysts, levels, and
     simulations.
   - Tools expose candidate, eligible, included, and excluded counts with reasons.

5. **Source-of-truth and conflict policy**
   - Broker fills remain authoritative for executions.
   - Timestamped owner inputs may be authoritative for personal intent.
   - Official regulator/exchange sources are preferred for events.
   - AI output is explanatory only.
   - Source conflicts use explicit states rather than silent selection.

6. **External source governance**
   - Every external source needs a registry entry, adapter, terms/profile review,
     historical scope, rate limit, correction policy, provenance, fixtures, and
     fail-closed eligibility.
   - Free access does not imply future public-commercial redistribution rights.
   - Runtime AI web search is not an authoritative historical database.

7. **Multi-provider market data**
   - Do not silently blend providers or raw/adjusted bases.
   - Fallback creates a new snapshot and manifest.
   - Disagreements create diagnostics and invalidation.

8. **Evaluation**
   - Evaluate deterministic arithmetic, claim correctness, explanation quality,
     and owner usefulness separately.
   - Compare deterministic-only, legacy v2, v3 AI, and abstention baselines.
   - Severe owner feedback becomes a reproducible regression case without raw
     broker data entering Git.

9. **Statistics and intent**
   - Distinguish direct hypotheses, fixed comparisons, exploratory scans,
     optimization, and similarity search.
   - Account for clustered days/tickers, outliers, confounders, strategy eras,
     multiple comparisons, and holdout/prospective validation.
   - Separate intended setup, post-trade tag, deterministic candidate, AI likely
     setup, chart-validated setup, and user-confirmed setup.
   - Rules have effective dates; later rules do not create hindsight violations.

10. **Hosting and recovery**
    - `private_owner_alpha` declares `local_only` or `private_hosted`.
    - Private-hosted mode still requires owner authentication.
    - Backup is not accepted until restore is tested.

11. **Reviewable implementation slices**
    - GA0-A: control and exact truth.
    - GA0-B: deterministic proof.
    - GA0-C: private real-data calibration.

### External source opportunities accepted for qualification

Official/free-to-access candidates:

- SEC EDGAR APIs, archives, Company Facts, and RSS;
- Nasdaq Trader symbol directories;
- Nasdaq Trader trade-halt RSS;
- NYSE trading-halt resources;
- LULD Plan rules;
- FINRA short-sale-volume and short-interest data with strict limitations;
- OpenFIGI mapping candidates;
- individual Nasdaq Data Link datasets only after dataset-level review.

Open-source tools to evaluate:

- an exact-decimal library such as `decimal.js`;
- `fast-check` for property and model-based testing;
- `exchange_calendars` as an independent calendar test oracle.

Important source limitations:

- SEC ticker mappings do not provide complete instrument identity.
- CIK identifies a filer/issuer, not necessarily one exact security.
- Current symbol directories are not complete historical security masters.
- FINRA short-sale volume is not short interest.
- LULD rules are not a historical official-band/event feed.
- Current float cannot automatically describe an old trade.
- Comprehensive historical quote/NBBO data is not assumed to be free.
- Undocumented website endpoints do not become product contracts.

### Current gate: GA0-A

GA0-A includes:

- current-system preserve/adapt/legacy/retire inventory;
- deployment and hosting-mode contracts;
- exact-decimal ADR and domain wrappers;
- analytical P/L and reconstruction ADR;
- timestamp/session ADR;
- instrument identity and price-basis ADR;
- source-of-truth hierarchy;
- content-addressed dataset-manifest contract;
- analysis-eligibility contract;
- independent exact reference math;
- first synthetic financial fixtures;
- architecture and private-data repository guards.

GA0-A excludes:

- AI model calls;
- public routes;
- production multi-user writes;
- `/coach` redesign;
- support/resistance consumption;
- a new level detector;
- unrestricted SQL;
- vector storage;
- production deployment.

### Documentation and repository verification completed

- The controlling specification header, authority section, prohibitions, current
  next action, and final standards were fetched and inspected.
- The third-pass QA header, reviewed scope, risk table, and final directive were
  fetched and inspected.
- The PR changed-file list contains ten expected documentation files.
- The branch comparison contains no runtime-code file.
- The branch is currently 23 commits ahead of and two unrelated live-watchlist
  commits behind `main`.
- The two `main` commits do not overlap the documentation paths in PR #94.
- PR #94 is open, mergeable, and draft.
- PR title and body were updated for the third-pass verdict and consolidated spec.
- A third-pass PR review comment was added.
- GitHub Actions CI run `29584055754` completed successfully:
  - dependency installation succeeded;
  - test suite succeeded;
  - Layer 2 verification succeeded;
  - Layer 3 verification succeeded.

A later documentation-only commit may trigger another equivalent CI run. Recheck
the final head before merge.

### Next engineering action after architecture approval

1. Create `agent/trader-intelligence-v3-gate-0-foundation` from current `main`.
2. Implement GA0-A only.
3. Run exact-reference, deterministic-manifest, architecture-boundary,
   private-data, typecheck, focused lint/test, build, and relevant legacy checks.
4. Open a focused draft PR.
5. Review GA0-A before beginning GA0-B.
6. Keep runtime work internal and model-free.
7. Do not consume support/resistance.
8. Do not redesign `/coach`.
9. Do not deploy.

---

# Prior QA Checkpoints

## 2026-07-17 — Second-Pass QA: Private Owner Alpha and Small/Micro-Cap Domain

Accepted corrections:

- current profile is `private_owner_alpha`;
- owner-only usefulness validation precedes future public infrastructure;
- exact math, P/L policy, instrument identity, basis safety, dataset versions,
  evidence, backup, and private-data handling remain mandatory;
- premarket, regular, after-hours, and overnight holds are first-class;
- missing candles do not prove a halt;
- candles do not prove spread, quote size, liquidity, or exact slippage;
- target touch does not prove executable fill;
- float and catalysts require dated provenance;
- ticker is not a durable instrument ID;
- reverse-split/basis mismatch fails chart-derived analysis closed;
- owner-only AI is permitted only after deterministic grounding gates;
- support/resistance remains behind the Zone Usability and Congestion Layer;
- Academy content may be linked but is not analytical evidence.

## 2026-07-17 — First QA Review: Production and Common-Truth Corrections

Accepted corrections:

- current identity, SQLite, ingestion, and request-lifecycle job paths are
  prototype foundations, not public-production architecture;
- exact decimal types and analytical P/L policy are mandatory;
- future public identity, tenancy, PostgreSQL, object storage, durable jobs,
  deletion, retention, migration, CI, and security gates are required before
  invited/public users;
- Trader Intelligence does not build a second support/resistance detector.

---

# Active Decision Register

## Deployment and hosting

**State:** approved.

- Current profile: `private_owner_alpha`.
- Hosting: `local_only` or `private_hosted`.
- Future profiles: `private_invited_alpha`, `public_beta`, `public_production`.
- Profile checks fail closed.
- Private-alpha adapters cannot silently become public authority.

## Exact decimals

**State:** required before any financial result is trusted.

- No binary floating-point authority for money, prices, quantities, fees, FX, or P/L.
- Use an exact-decimal library behind domain wrappers.
- Serialize decimal strings.
- Version rounding and reconciliation.

## Analytical P/L

**State:** required before v3 reconstruction.

- Distinguish broker-reported, analytical, cash, and tax P/L.
- Tax P/L remains out of scope.
- Define cost policy, fees, partial fills, prior inventory, reversals, shorts,
  open positions, corporate actions, and currencies.

## Coverage and manifests

**State:** required before broad conclusions.

- Coverage includes periods, gaps, overlaps, accounts, exclusions, open positions,
  prior inventory, and currencies.
- Dataset, enrichment, derivation, and answer manifests are content-addressed.
- Source/policy changes invalidate dependent current results explicitly.

## Analysis eligibility

**State:** required before tools are trusted.

- Eligibility is per capability.
- Tools expose candidates, eligible, included, and excluded counts with reasons.
- AI cannot hide exclusions or exceed capability.

## Instrument identity and basis

**State:** required before candle-derived results.

- Maintain stable internal instrument identity and symbol validity periods.
- Preserve raw broker symbol and fill.
- Resolve ticker changes, symbol reuse, splits, reverse splits, delistings, and
  security/exchange changes.
- Fail chart-derived analysis closed on unresolved identity or basis mismatch.

## External sources

**State:** source registry and adapter contract required before enrichment.

- Prefer official regulator/exchange sources.
- Record terms, scope, rate limits, corrections, profile permission, hashes,
  timestamps, and limitations.
- Free does not automatically mean public-commercial redistribution.
- Runtime web search is not authoritative.

## Evidence capability

**State:** approved.

- E0 execution-only;
- E1 candle-enriched;
- E2 event-enriched;
- E3 quote-enriched;
- E4 share-structure-enriched;
- E5 combined with limitations.

## AI grounding

**State:** required before GA2.

- Approved tools and bounded tool plan;
- claim ledger;
- numeric/unit/currency validation;
- evidence/capability validation;
- answer schema and replay;
- cost caps and disable switch;
- private-owner access gate;
- prompt-injection tests;
- evaluation suite;
- no raw CSV prompt by default.

## Support/resistance

**State:** approved direction; not implemented in v3.

- Keep `levels-system-v2` as factual producer.
- Add Zone Usability and Congestion Layer.
- Do not build a second detector.
- Suppress crowded, unstable, stale, synthetic-only, and basis-unsafe conclusions.
- Keep v3 AI execution-only until usefulness gates pass.

## Educational boundary

**State:** approved.

- Historical analytics, evidence, simulations, user-created rule experiments,
  prospective tracking, and education are allowed.
- No current buy/sell/hold instructions, live targets, automated orders,
  guaranteed improvement, tax advice, or portfolio allocation.
- Use associative rather than unsupported causal language.

---

# QA Gate Status

| Gate | Status | Notes |
|---|---|---|
| Architecture consolidation | Complete | One controlling specification and aligned cold-start docs |
| GA0-A Control and exact truth | Not started | Next runtime implementation slice |
| GA0-B Deterministic proof | Not started | Begins after GA0-A review |
| GA0-C Private calibration | Not started | Uses private data outside Git |
| GA1 Execution-only analytics | Not started | After Gate 0 exit |
| GA2 Owner-only AI | Not started | Grounding/evaluation/cost/access gates required |
| GA3 Market enrichment | Not started | Add one qualified source/capability at a time |
| GA4 Usefulness calibration | Not started | Compare deterministic, v2, v3, and abstention |
| Public identity/persistence | Not started | Required before invited/public users |
| Public ingestion/durability | Not started | Object storage, jobs, deletion, limits |
| Public beta/production | Not started | Licensing, security, SLOs, recovery, billing |

---

# Update Rules

After each meaningful v3 run, record:

- branch and PR;
- deployment profile and hosting mode;
- files and contracts changed;
- architecture decisions;
- financial/session/instrument policy versions;
- dataset and source manifests;
- evidence capability and eligibility impact;
- source terms/profile review state;
- exact test/verification results;
- database/migration state;
- feature flags and rollout state;
- private-data handling;
- owner feedback and regression cases;
- known limitations;
- exact next resume point.

No gate is complete because one test passed.
