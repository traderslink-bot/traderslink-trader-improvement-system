# Trader Intelligence v3 Project Log

## Purpose

This is the active continuity log for Trader Intelligence v3.

It records:

- architecture decisions;
- deployment and hosting profiles;
- implementation slices;
- source and evidence capabilities;
- verification;
- private-data handling;
- gate status;
- exact resume point.

The legacy `src/docs/codex-project-log.md` remains useful for v1/v2 history. It does
not control v3 architecture.

---

## Resume Protocol

Read in this order:

1. `plan.md`
2. this file
3. `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`
4. `src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`
5. detailed v3 QA reviews/master plan only when rationale is needed
6. legacy plans only for preserved implementation, fixtures, routes, education, or migration evidence

Precedence:

1. latest explicit decision in this log;
2. controlling architecture specification;
3. active execution plan;
4. detailed reviews/master plan as rationale;
5. legacy documents.

This log may record gate progress and accepted decisions. It may not silently weaken
the controlling specification. Material architecture changes require updating the
specification.

---

# Current Resume Point

## 2026-07-17 — Third-Pass QA, Architecture Consolidation, and Source Governance

### Status

- A third independent QA and engineering review was completed.
- The v3 direction remains approved for staged private-alpha implementation.
- The third pass found no reason to restart or replace the architecture.
- The review found planning-authority sprawl, incomplete reproducibility, missing
  capability-specific eligibility, incomplete source governance, an oversized first
  coding batch, and an insufficient usefulness-evaluation plan.
- One consolidated controlling architecture specification was created.
- `plan.md`, `handoff.md`, and the plan index were rewritten to use the same authority.
- The current implementation gate is now **GA0-A — control and exact truth**.
- The former single Gate 0 run is split into GA0-A, GA0-B, and GA0-C.
- External free/official source opportunities were reviewed and incorporated as
  qualified recommendations, not automatic dependencies.
- No runtime code changed.
- No production deployment was requested or authorized.

### New controlling document

- `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`

This document consolidates accepted decisions from the master plan and all three QA
passes.

### Third-pass audit document

- `src/docs/trader-intelligence-v3-third-pass-qa-source-governance-reproducibility-and-evaluation-review-2026-07-17.md`

### Key third-pass corrections

1. **Architecture authority**
   - Stop forcing future runs to reconcile several long controlling documents.
   - Detailed reviews remain audit evidence; accepted decisions live in one spec.

2. **Reproducibility**
   - Add content-addressed dataset, market-enrichment, derivation, and answer manifests.
   - Version strings alone are not sufficient.

3. **Dataset coverage**
   - Record statement periods, gaps, overlaps, accounts, exclusions, open positions,
     prior inventory, and currencies.
   - Do not describe partial uploads as the owner’s complete history.

4. **Analysis eligibility**
   - Determine eligibility per capability: execution, P/L, sequence, candles, VWAP,
     MFE/MAE, halts, quotes, slippage, float, catalyst, levels, and simulations.
   - Every tool reports candidate, eligible, included, and excluded counts with reasons.

5. **Source-of-truth hierarchy**
   - Broker fills remain authoritative for executions.
   - User inputs may be authoritative for personal intent when timestamped.
   - Official regulator/exchange sources are preferred for events.
   - AI output remains explanatory only.
   - Conflicts use explicit states rather than silent source selection.

6. **External source governance**
   - Create a versioned source registry with terms, historical scope, rate limits,
     correction behavior, permitted profiles, and redistribution state.
   - Free access does not imply future public-commercial rights.
   - External data is ingested, hashed, timestamped, normalized, and eligibility-checked
     before it can drive a finding.
   - Runtime AI web search is not an authoritative historical database.

7. **Evaluation**
   - Evaluate deterministic arithmetic, claim correctness, explanation quality, and
     owner usefulness separately.
   - Compare deterministic-only, legacy v2, v3 AI, and abstention baselines.
   - Owner feedback becomes reproducible regression cases without committing raw data.

8. **Statistics and intent**
   - Distinguish direct hypotheses, fixed comparisons, exploratory scans,
     optimization, and similarity search.
   - Account for clustered days/tickers, outliers, strategy eras, confounding, and
     holdout/prospective validation.
   - Separate intended setup, post-trade tag, deterministic candidate, AI likely
     setup, chart-validated setup, and user-confirmed setup.
   - Rules have effective dates; later rules do not create hindsight violations.

9. **Private-hosting boundary**
   - `private_owner_alpha` now also declares `local_only` or `private_hosted`.
   - A privately hosted deployment still requires owner authentication.

10. **GA0 split**
    - GA0-A: control and exact truth.
    - GA0-B: deterministic proof.
    - GA0-C: private real-data calibration.

### External source opportunities accepted for later qualification

Official/free-to-access opportunities:

- SEC EDGAR APIs, archives, Company Facts, and RSS;
- Nasdaq Trader symbol directories;
- Nasdaq Trader trade-halt RSS;
- NYSE trading-halt resources;
- LULD Plan rules;
- FINRA short-sale-volume and short-interest data with strict limitations;
- OpenFIGI mapping candidates;
- individual Nasdaq Data Link datasets only after dataset-level review.

Open-source tools to evaluate:

- exact-decimal library such as `decimal.js`;
- `fast-check` for property and model-based tests;
- `exchange_calendars` as an independent calendar test oracle.

Important limitations:

- SEC ticker mappings are not complete instrument identity.
- CIK is issuer/filer identity, not necessarily one security.
- Current symbol directories are not complete historical security masters.
- FINRA short-sale volume is not short interest.
- LULD rules are not a historical band/event feed.
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
- content-addressed dataset manifest;
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

### Next engineering action after documentation approval

1. Create `agent/trader-intelligence-v3-gate-0-foundation` from current `main`.
2. Implement GA0-A only.
3. Run exact-reference, deterministic-manifest, architecture-boundary, private-data,
   typecheck, focused lint/test, build, and relevant legacy regression checks.
4. Open a focused draft PR.
5. Review GA0-A before beginning GA0-B.
6. Keep runtime work internal and model-free.
7. Do not consume support/resistance.
8. Do not redesign `/coach`.
9. Do not deploy.

### Documentation verification still required before architecture PR merge

- fetch and inspect the new controlling specification header and final directive;
- fetch and inspect the third-pass review header and final directive;
- verify all changed files are documentation only;
- compare branch to current `main`;
- confirm PR remains mergeable and draft;
- update PR title/body and add third-pass review summary;
- do not force-update the branch merely because `main` has unrelated commits.

---

## 2026-07-17 — Second-Pass QA: Private Owner Alpha and Small/Micro-Cap Domain

### Status at that checkpoint

- The owner confirmed the system was owner-only and not public.
- Current deployment profile became `private_owner_alpha`.
- Product scope became explicitly small-cap/micro-cap and retrospective educational review.
- Public multi-user infrastructure was moved off the immediate private-alpha critical path.
- Exact financial math, P/L policy, instrument identity, basis safety, dataset versions,
  evidence, backup, and private-data handling remained mandatory.
- Owner-only AI became permissible after deterministic claim/evidence/cost gates rather
  than after all future public infrastructure.
- No runtime code changed.

### Important accepted decisions

- Premarket, regular session, and after-hours are first-class.
- Missing candles do not prove a halt.
- Candles do not prove spread, quote size, liquidity, or exact slippage.
- Target touch is not proof of executable fill.
- Float and catalyst context require dated provenance.
- Ticker is not a durable instrument ID.
- Reverse-split/basis mismatch fails chart-derived analysis closed.
- Support/resistance remains behind a Zone Usability and Congestion Layer.
- Educational Academy content may be linked but is not analytical evidence.

---

## 2026-07-17 — First QA Review: Production and Common-Truth Corrections

### Status at that checkpoint

- The master plan’s product direction was approved.
- Current Trader Intelligence identity, SQLite, ingestion, and request-lifecycle job
  paths were classified as prototype foundations rather than public-production architecture.
- Exact decimal types and analytical P/L policy became mandatory.
- Future public identity, tenancy, PostgreSQL, object storage, durable jobs, deletion,
  retention, migration, CI, and security gates were defined.
- The plan rejected building a second support/resistance detector.
- No runtime code changed.

---

# Active Decision Register

## Deployment and hosting

**State:** approved.

- Current profile: `private_owner_alpha`.
- Hosting must declare `local_only` or `private_hosted`.
- Future profiles: `private_invited_alpha`, `public_beta`, `public_production`.
- Profile-specific startup checks fail closed.
- Private-alpha adapters cannot silently become public-production authority.

## Exact decimals

**State:** required before financial results are trusted.

- No binary floating-point authority for money, prices, quantities, fees, FX, or P/L.
- Use an exact-decimal library behind domain wrappers.
- Serialize decimal strings.
- Version rounding and reconciliation.

## Analytical P/L

**State:** required before v3 reconstruction.

- Distinguish broker-reported, analytical, cash, and tax P/L.
- Tax P/L remains out of scope.
- Define average-cost/FIFO policy, fees, partial fills, prior inventory, reversals,
  shorts, open positions, corporate actions, and currencies.

## Coverage and manifests

**State:** required before broad conclusions.

- Dataset coverage includes periods, gaps, overlaps, accounts, exclusions, open
  positions, prior inventory, and currencies.
- Dataset, enrichment, derivation, and answer manifests are content-addressed.
- Source/policy changes invalidate dependent current results explicitly.

## Analysis eligibility

**State:** required before tools are trusted.

- Eligibility is per capability.
- Tools expose candidate, eligible, included, and excluded counts with reasons.
- AI cannot hide exclusions or exceed capability.

## Instrument identity and price basis

**State:** required before candle-derived results.

- Maintain stable internal instrument identity and symbol validity periods.
- Preserve raw broker symbol and fill.
- Resolve ticker changes, symbol reuse, splits, reverse splits, delistings, and
  exchange/security-type changes.
- Fail chart-derived analysis closed on unresolved identity or basis mismatch.

## External sources

**State:** source registry and adapter contract required before enrichment.

- Prefer official regulator/exchange sources.
- Record terms, historical scope, rate limits, correction behavior, profile permission,
  content hashes, timestamps, and limitations.
- Free does not automatically mean public-commercial redistribution.
- Runtime web search is not authoritative.

## Data capability

**State:** approved.

- E0 execution-only;
- E1 candle-enriched;
- E2 event-enriched;
- E3 quote-enriched;
- E4 share-structure-enriched;
- E5 combined with limitations.

## AI grounding

**State:** required before GA2.

- Approved tools only;
- bounded tool plan;
- claim ledger;
- numeric/unit/currency validation;
- evidence and capability validation;
- answer schema/replay;
- cost caps;
- private-owner gate;
- prompt-injection tests;
- evaluation suite;
- no raw CSV prompt by default.

## Support/resistance

**State:** approved direction; not yet implemented in v3.

- Keep `levels-system-v2` as factual producer.
- Add Zone Usability and Congestion Layer.
- No second detector.
- Suppress crowded/unstable/stale/synthetic-only/basis-unsafe conclusions.
- Keep v3 AI execution-only until usefulness gates pass.

## Educational boundary

**State:** approved.

- Historical analytics, evidence, simulations, user-created rule experiments, and
  prospective tracking are allowed.
- No current buy/sell/hold instructions, live targets, automated orders, guaranteed
  improvement, tax advice, or portfolio allocation.
- Use associative rather than unsupported causal language.

---

# QA Gate Status

| Gate | Status | Notes |
|---|---|---|
| Architecture consolidation | Complete in docs | Controlling specification created; verification/PR update pending |
| GA0-A Control and exact truth | Not started | Next runtime implementation slice |
| GA0-B Deterministic proof | Not started | Begins only after GA0-A review |
| GA0-C Private calibration | Not started | Uses private fixtures outside Git |
| GA1 Execution-only analytics | Not started | After Gate 0 exit |
| GA2 Owner-only AI | Not started | Claim/evidence/evaluation/cost gates required |
| GA3 Market enrichment | Not started | One qualified source/capability at a time |
| GA4 Usefulness calibration | Not started | Compare deterministic, v2, v3, abstention |
| Public identity/persistence | Not started | Required before invited/public users |
| Public ingestion/durability | Not started | Object storage, jobs, deletion, rate limits |
| Public beta/production | Not started | Licensing, security, SLOs, recovery, billing |

---

# Update Rules

After each meaningful v3 run, record:

- branch and PR;
- deployment profile and hosting mode;
- files/contracts changed;
- architecture decisions;
- financial/session/instrument policy versions;
- dataset and source manifests;
- evidence capability and eligibility impact;
- source terms/profile review state;
- tests and exact command results;
- database/migration state;
- feature flags;
- rollout state;
- private-data handling;
- owner feedback and regression cases;
- known limitations;
- exact next resume point.

Do not mark a gate complete because one unit test passes. Gate completion requires
all applicable acceptance criteria and independent evidence.
