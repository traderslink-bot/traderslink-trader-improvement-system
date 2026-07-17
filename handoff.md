# Trader Intelligence v3 Handoff

**Last updated:** 2026-07-17 America/Toronto  
**Active architecture:** Trader Intelligence v3  
**Current operating profile:** `private_owner_alpha`  
**Hosting mode:** must be declared `local_only` or `private_hosted`  
**Primary domain:** small-cap and micro-cap active trading  
**Product boundary:** retrospective educational trade review  
**Current gate:** GA0-A — control and exact truth  
**Active execution plan:** `src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`

Use this file for cold-start orientation. `plan.md` is the root entry point.

---

## 1. Resume Order

Read in this order:

1. `plan.md`
2. `src/docs/trader-intelligence-v3-project-log.md`
3. `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`
4. `src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`
5. detailed v3 QA reviews and master plan only when rationale is needed
6. legacy plans only for preserved implementation, fixture, route, education, or migration evidence

Precedence:

1. latest explicit project-log decision;
2. controlling architecture specification;
3. active execution plan;
4. detailed v3 reviews/master plan as rationale;
5. legacy documents.

The detailed reviews are:

- `src/docs/trader-intelligence-v3-third-pass-qa-source-governance-reproducibility-and-evaluation-review-2026-07-17.md`
- `src/docs/trader-intelligence-v3-second-pass-qa-private-alpha-small-micro-cap-review-2026-07-17.md`
- `src/docs/trader-intelligence-v3-qa-architecture-review-2026-07-17.md`
- `src/docs/trader-intelligence-ai-journal-v3-master-plan-2026-07-17.md`

Do not manually reconcile their amendment order during normal implementation. Their
accepted decisions have been consolidated into the controlling specification.

Do not resume old May continuous-coaching or UI batches merely because historical
files still say `Active`.

---

## 2. Current Operating Facts

- Trader Intelligence is currently used only by the owner.
- It is not a public multi-user product.
- Current profile: `private_owner_alpha`.
- Hosting must explicitly declare `local_only` or `private_hosted`.
- Private-hosted mode requires owner authentication.
- The app primarily serves small/micro-cap active-trading review.
- The app analyzes completed executions for education and self-improvement.
- It is not a live signal, investment-advice, tax, portfolio-allocation, or automated-order product.
- Public infrastructure must remain possible, but it does not block owner-only usefulness testing.
- Private-alpha status does not relax exact math, coverage, evidence, eligibility,
  no-lookahead, price-basis safety, backup, or simulation honesty.

---

## 3. Architecture Mental Model

```text
private broker source data
  -> deterministic import and validation
  -> exact accepted execution ledger
  -> versioned reconstruction and coverage
  -> content-addressed dataset manifest
  -> per-capability eligibility
  -> deterministic analytics and simulations
  -> claim and evidence ledger
  -> evaluated owner-only AI explanation
  -> qualified small/micro-cap enrichment
  -> usefulness calibration
  -> future public hardening
```

Code owns parsing, exact math, reconstruction, sessions, instruments, market
features, statistics, simulations, provenance, eligibility, and evidence.

AI may select approved tools and explain validated claims. It must not become the
parser, calculator, database, unrestricted SQL author, market-data inventor,
runtime web-search authority, live signal engine, current-target generator, or
automated broker.

---

## 4. Third-Pass QA Correction

The third independent review approved the architecture but found that:

- too many documents claimed controlling authority;
- version strings alone could not reproduce an answer;
- dataset coverage and selection bias needed first-class treatment;
- per-capability analysis eligibility was missing;
- external-source terms and historical scope needed a source registry;
- the first foundational coding run was too large as one PR;
- technical correctness alone was not enough to prove AI usefulness.

Corrections now active:

- one controlling architecture specification;
- content-addressed dataset, derivation, and answer manifests;
- explicit coverage states and missing-period language;
- per-trade/per-capability eligibility;
- external source registry and source-adapter contracts;
- no authoritative runtime web search;
- GA0 split into GA0-A, GA0-B, and GA0-C;
- deterministic, claim, explanation, and usefulness evaluation layers;
- owner feedback converted into reproducible regression cases without committing raw data.

---

## 5. Current Gate: GA0-A

Implement first:

- preserve/adapt/legacy/retire inventory;
- deployment and hosting-mode contracts;
- exact-decimal ADR and wrappers;
- analytical P/L/reconstruction ADR;
- timestamp/session ADR;
- instrument identity/price-basis ADR;
- source-of-truth hierarchy;
- content-addressed dataset manifest;
- analysis-eligibility contract;
- independent exact reference math;
- first synthetic financial fixtures;
- architecture and private-data repository guards.

GA0-A must not include:

- AI calls;
- public routes;
- production multi-user writes;
- `/coach` redesign;
- support/resistance consumption;
- a new level detector;
- unrestricted SQL;
- vector storage;
- production deployment.

After GA0-A review:

### GA0-B

- read-only current-data adapter;
- coverage manifest;
- weekday tool;
- stop-after-consecutive-losses simulation;
- evidence resolver;
- denominator/exclusion accounting;
- internal diagnostics;
- differential/property tests;
- v3 CI.

### GA0-C

- private fixture manifest;
- reconciliation and coverage report;
- backup/restore test;
- owner evidence review;
- safe regression cases;
- Gate 0 exit report.

---

## 6. Core Financial Guardrails

- No JavaScript floating point as financial authority.
- No cross-currency totals without FX policy.
- No unknown prior inventory guessed into a closed trade.
- No analytical P/L described as tax P/L.
- Every reconstruction and simulation records policy version.
- Broker-reported and analytical values remain separate.
- Open and closed positions remain separate.
- R-multiple requires independently recorded planned risk.
- A rule created after a trade cannot label that trade a violation.

---

## 7. Coverage, Manifests, and Eligibility

Every broad answer identifies:

- imported account and period;
- source-file hashes;
- accepted executions/corrections;
- overlap and gaps;
- excluded rows/trades;
- policy versions;
- dataset manifest;
- tool run;
- evidence IDs;
- capability tier;
- limitations.

Coverage states include complete period, partial period, reconciled overlap,
coverage gap, unknown coverage, and partial multiple accounts.

Eligibility is per capability. A trade can be eligible for E0 execution analysis
while ineligible for candles, VWAP, MFE/MAE, halts, quotes, float, catalysts,
levels, or simulations.

Every tool reports candidate, eligible, included, and excluded counts with reasons.

---

## 8. Small/Micro-Cap Rulings

### Instrument and basis

- ticker is not a durable instrument ID;
- preserve raw broker symbol and fill price;
- resolve symbols as of execution time;
- support ticker changes, symbol reuse, splits, reverse splits, delistings, and exchange changes;
- chart-derived analytics fail closed on unresolved identity or incompatible price basis.

### Sessions

- premarket, regular, after-hours, and overnight holds are first-class;
- store UTC and classify through versioned America/New_York policy;
- cover holidays, half days, DST, and session transitions.

### Halts

- missing candles do not prove a halt;
- halt claims require qualified source data;
- simulations cannot fill while trading is halted;
- resume gaps require explicit policy.

### Spread, liquidity, and slippage

- candles do not prove spread, depth, quote size, liquidity, or exact slippage;
- quote-relative cost requires quotes;
- plan-relative slippage requires intended/order price;
- target touch is price path, not proof of full executable fill.

### Float and events

- float requires dated source provenance;
- float rotation is an estimate;
- later events cannot enter entry-time reasoning;
- FINRA short-sale volume is not short interest;
- current watchlist directional fields do not enter the journal.

### Asset scope

- initial focus: supported U.S. listed common equities;
- options remain quarantined;
- OTC, warrants, rights, units, preferred shares, and unresolved instruments remain excluded until intentionally supported;
- short execution facts may precede short-specific coaching.

---

## 9. Evidence Capability Tiers

- E0 execution-only;
- E1 candle-enriched;
- E2 event-enriched;
- E3 quote-enriched;
- E4 share-structure-enriched;
- E5 combined with explicit limitations.

A claim cannot exceed its available capability. Stale, conflicting, incomplete, or
basis-unsafe data may lower the trusted capability.

---

## 10. External Source Opportunities

All sources require registry, provenance, terms review, coverage tests, and fail-closed behavior.

Recommended opportunities:

- SEC EDGAR APIs, archives, Company Facts, and RSS;
- Nasdaq Trader symbol directories;
- Nasdaq Trader trade-halt RSS;
- NYSE trading halts;
- LULD Plan rules;
- FINRA short-sale volume and short interest with strict limitations;
- OpenFIGI mapping candidates;
- specific Nasdaq Data Link datasets only after dataset review.

Useful open-source tools to evaluate:

- exact-decimal library such as `decimal.js`;
- `fast-check` for property/model-based tests;
- `exchange_calendars` as an independent calendar test oracle.

Rules:

- free does not mean public-commercial redistribution rights;
- no undocumented endpoint is an authority;
- current-only data is not automatically historical;
- AI web search is not an authoritative database;
- sources are stored, hashed, timestamped, qualified, and eligibility-checked before use;
- do not silently blend market-data providers.

---

## 11. Statistical and Educational Guardrails

Every analysis declares direct, fixed-comparison, exploratory, optimization, or
similarity-search mode.

Broad findings account for:

- sample size;
- independent days and tickers;
- clustering;
- outliers;
- largest day/ticker sensitivity;
- recent versus older periods;
- strategy eras;
- multiple comparisons;
- holdout/prospective validation for optimized rules.

Questions phrased as `why` receive associated contributors, not unsupported causal claims.

`Best position size` is historical size-performance analysis, not a prescriptive optimum.

Allowed product behavior includes historical review, simulations, evidence,
user-created rules, prospective tracking, and education.

Not allowed: current buy/sell/hold instructions, live targets, automated execution,
guaranteed improvement, tax advice, or portfolio allocation.

---

## 12. Support and Resistance

`levels-system-v2` remains the factual producer.

V3 adds a Zone Usability and Congestion Layer, not a second detector.

The layer preserves source IDs, measures congestion and clear space, selects at
most one primary zone per side, and suppresses conclusions when crowded,
unstable, stale, synthetic-only, or basis-unsafe.

V3 AI remains execution-only until the layer passes stability, suppression,
basis-safety, and blinded-usefulness gates.

---

## 13. AI Gate

Owner-only AI is not part of GA0-A or GA0-B.

Before GA2:

- approved tool registry;
- bounded tool plan;
- claim ledger;
- numeric/unit/currency validator;
- evidence and capability validators;
- answer schema and replay;
- cost caps and disable switch;
- owner-only access gate;
- prompt-injection tests;
- no raw CSV prompt policy;
- golden evaluation suite;
- owner feedback taxonomy.

Normal PR CI does not call a live model.

---

## 14. Evaluation

Evaluate:

1. exact deterministic arithmetic;
2. claim correctness and grounding;
3. explanation quality;
4. owner usefulness.

Compare deterministic-only, legacy v2, v3 AI, and abstention baselines where appropriate.

Owner feedback includes useful, correct-but-obvious, incorrect number, wrong
evidence, unsupported claim, missed limitation, unclear, too verbose, too shallow,
repetitive, wrong setup, wrong grouping, and data problem.

Severe feedback becomes a reproducible regression case without raw financial data in Git.

---

## 15. Private Data and Backup

- Real broker files never enter Git, PRs, issues, or normal logs.
- Account identifiers stay out of screenshots and docs.
- Default prompts do not include raw CSV.
- Backups are encrypted and versioned.
- Restore is tested.
- Private data can be deleted.
- Repository guards scan for likely private files and identifiers.

---

## 16. First Implementation Branch

After documentation approval, create from current `main`:

`agent/trader-intelligence-v3-gate-0-foundation`

Implement GA0-A only. Open a focused draft PR. Do not mix runtime code into the
architecture documentation PR.

Required verification for GA0-A:

- dependency installation from lockfile;
- TypeScript typecheck;
- focused lint;
- exact reference tests;
- architecture-boundary tests;
- private-data repository guards;
- deterministic serialization/hash tests;
- production build;
- relevant legacy regressions.

---

## 17. Current Documentation PR Status

PR #94 contains planning and QA documents only. Runtime code has not changed.

The branch may be behind `main` by unrelated commits. Recheck mergeability and
changed paths before merge; do not force-update blindly.

Keep the PR draft until the consolidated architecture is accepted.

---

## 18. Final Working Standard

> A result is trustworthy only when the system can identify the exact source data,
> policy, eligibility decision, calculation, evidence, and explanation that produced it.

> Prefer a reproducible limited answer over an impressive answer built from
> incomplete coverage, weak external data, or untraceable assumptions.
