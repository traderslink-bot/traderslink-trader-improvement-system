# Trader Intelligence Plan Entry Point

**Last updated:** 2026-07-17 America/Toronto  
**Active architecture:** Trader Intelligence v3  
**Current operating profile:** `private_owner_alpha`  
**Required hosting mode:** `local_only` or `private_hosted`  
**Primary domain:** small-cap and micro-cap active trading  
**Product boundary:** retrospective educational trade review, not live investment advice or automated execution  
**Current gate:** GA0-A — control and exact truth  
**Active execution plan:** `src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`

Start here when resuming Trader Intelligence product, import, analytics, coaching,
market-context, AI, data-source, persistence, or QA work.

---

## Controlling Read Order

1. `src/docs/trader-intelligence-v3-project-log.md`
2. `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`
3. `src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`
4. Detailed v3 QA reviews and master plan only when rationale or historical context is needed
5. Legacy v1/v2 plans only for preserved implementation, fixtures, route history, education, or migration evidence

Precedence when documents disagree:

1. latest explicit project-log decision;
2. controlling architecture specification;
3. active execution plan;
4. detailed v3 reviews and master plan as rationale;
5. legacy documents.

A project-log update may record gate progress, but it may not silently weaken the
controlling specification. Material architecture changes require updating the
specification.

The detailed v3 review documents are:

- `src/docs/trader-intelligence-v3-third-pass-qa-source-governance-reproducibility-and-evaluation-review-2026-07-17.md`
- `src/docs/trader-intelligence-v3-second-pass-qa-private-alpha-small-micro-cap-review-2026-07-17.md`
- `src/docs/trader-intelligence-v3-qa-architecture-review-2026-07-17.md`
- `src/docs/trader-intelligence-ai-journal-v3-master-plan-2026-07-17.md`

They remain audit evidence. Future runs should not resolve architecture by manually
merging four amendment documents; accepted rulings belong in the controlling
specification.

---

## Current Product Direction

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
  -> qualified small/micro-cap source enrichment
  -> usefulness calibration
  -> future public-platform hardening
```

Code owns:

- CSV parsing;
- validation and repair state;
- duplicate detection;
- exact financial math;
- position and round-trip reconstruction;
- session and instrument policy;
- market features;
- statistics;
- simulations;
- source provenance;
- evidence identifiers;
- capability and quality states.

AI may select approved tools and explain validated claims. It must not become the
parser, calculator, database, unrestricted SQL author, market-data inventor,
runtime web-search authority, live signal engine, current-target generator, or
automated broker.

---

## Current Operating Facts

- The current user and tester is the owner.
- The system is not public or multi-user.
- The current deployment profile is `private_owner_alpha`.
- Hosting must declare `local_only` or `private_hosted`.
- A private-hosted deployment still requires owner authentication.
- The primary specialization is small/micro-cap trading.
- The product studies completed executions for education and self-improvement.
- It does not provide current buy/sell/hold instructions, live price targets,
  automated orders, guaranteed improvement, tax advice, or portfolio allocation.
- Future public architecture remains required before invited/public users, but it
  does not block owner-only usefulness validation.
- Exact math, evidence, no-lookahead, price-basis safety, coverage, eligibility,
  backup, and simulation honesty are mandatory in private alpha.

---

## Current Gate: GA0-A

The previous single Gate 0 implementation run is now executed as three reviewable
private-alpha slices.

### GA0-A — Control and Exact Truth

Build first:

- current-system preserve/adapt/legacy/retire inventory;
- deployment and hosting-mode contracts;
- exact decimal policy;
- analytical P/L and reconstruction policy;
- timestamp/session policy;
- instrument-identity and price-basis policy;
- source-of-truth hierarchy;
- content-addressed dataset manifest;
- analysis-eligibility contract;
- independent exact reference math;
- first synthetic financial fixtures;
- architecture and private-data repository guards.

GA0-A must not include:

- an AI model call;
- a public route;
- production multi-user writes;
- a coach redesign;
- support/resistance consumption;
- a new level detector;
- unrestricted SQL;
- a vector database;
- production deployment.

### GA0-B — Deterministic Proof

After GA0-A review:

- read-only current-data adapter;
- dataset coverage manifest;
- weekday analytics;
- stop-after-consecutive-losses simulation;
- evidence resolver;
- denominator/exclusion accounting;
- internal diagnostics;
- property and differential tests;
- v3 CI.

### GA0-C — Private Calibration

After GA0-B review:

- private fixture manifest without raw data;
- reconciliation and coverage report;
- backup/restore test;
- owner evidence review;
- bugs converted into safe regression cases;
- Gate 0 exit report.

---

## External Data and Free-Source Ruling

Outside sources may improve the system, but every source enters through a
versioned source registry and adapter.

Recommended official/free-to-access opportunities include:

- SEC EDGAR submissions, filings, Company Facts, RSS, and archives;
- Nasdaq Trader symbol directories and trade-halt RSS;
- NYSE trading-halt data;
- the LULD Plan as a rules reference;
- FINRA short-sale-volume and short-interest data with strict limitations;
- OpenFIGI as an instrument-mapping candidate source;
- specific Nasdaq Data Link datasets only after dataset-level review.

Useful open-source tools to evaluate include:

- an exact-decimal library such as `decimal.js`;
- `fast-check` for property/model-based tests;
- `exchange_calendars` as an independent calendar test oracle, not automatic runtime authority.

Rules:

- free access does not mean public-commercial redistribution rights;
- no undocumented website endpoint becomes a production contract;
- current-only data is not automatically historical data;
- AI web search is not an authoritative historical database;
- external information must be stored, hashed, timestamped, qualified, and
  eligibility-checked before it drives a finding;
- no source claim may exceed the source’s actual capability.

---

## Evidence Capability Ruling

Every tool and AI answer declares one or more capabilities:

- E0 execution-only;
- E1 candle-enriched;
- E2 event-enriched;
- E3 quote-enriched;
- E4 share-structure-enriched;
- E5 combined with explicit limitations.

Eligibility is determined per trade and per capability.

Examples:

- candle data cannot prove verified spread, depth, or exact slippage;
- target touch is not proof of executable full fill;
- missing bars do not prove an official halt;
- current float does not automatically describe an old trade;
- later filings cannot influence entry-time reasoning;
- chart-derived features fail closed on price-basis mismatch;
- support/resistance fails closed when structure is congested.

---

## Source and Reproducibility Ruling

Every meaningful result must identify:

- source files and hashes;
- accepted executions and corrections;
- coverage period and gaps;
- reconstruction/session/instrument/currency policies;
- market/provider snapshots and basis;
- tool version and parameters;
- included and excluded evidence;
- capability and eligibility;
- deterministic result hash;
- claim and answer manifests.

A source correction makes dependent current results stale and triggers explicit
recomputation. Old results remain reproducible.

---

## Educational and Statistical Ruling

Use historical and associative language.

Questions phrased as `why` normally receive the strongest associated contributors,
not unsupported causal claims.

A broad result must account for:

- imported-period coverage;
- independent day and ticker counts;
- clustering;
- outliers;
- largest-day/ticker sensitivity;
- recent versus older periods;
- strategy-era changes;
- direct question versus exploratory scan;
- holdout/prospective validation for optimized rules.

User-facing `best position size` is historical size-performance analysis, not a
prescriptive optimum.

A rule created after a trade cannot label that earlier trade a violation.

---

## Support and Resistance Ruling

`levels-system-v2` remains the factual level producer.

Trader Intelligence does not build a second detector.

V3 adds a Zone Usability and Congestion Layer that consumes replay-safe final
zones, preserves source IDs, measures congestion and clear space, selects at most
one primary zone per side, and suppresses conclusions when structure is crowded,
unstable, stale, synthetic-only, or basis-unsafe.

V3 AI remains execution-only until that layer passes stability, suppression,
basis-safety, and blinded-usefulness gates.

---

## Private Data and Backup

- Real broker files stay outside Git.
- Account identifiers stay out of screenshots and docs.
- Normal logs do not contain raw rows.
- Default AI prompts do not contain raw CSV.
- Backups are encrypted and versioned.
- Restore is tested.
- Private data can be deleted.
- Repository guards scan for private fixture paths and likely account data.

---

## Current Next Action

After this documentation PR is accepted:

1. create `agent/trader-intelligence-v3-gate-0-foundation` from current `main`;
2. implement GA0-A only;
3. run exact reference, architecture, private-data, typecheck, test, and build checks;
4. open a focused draft PR;
5. review GA0-A before GA0-B;
6. keep runtime work internal and model-free;
7. do not redesign `/coach`;
8. do not consume support/resistance;
9. do not deploy.

---

## Update Protocol

After meaningful v3 work:

1. update `src/docs/trader-intelligence-v3-project-log.md`;
2. update the active execution plan;
3. update the controlling architecture specification for material decisions;
4. update the plan index only when authority, gate, or status changes;
5. preserve detailed QA reviews as audit evidence;
6. record exact verification, data migration, feature flags, profile, rollout,
   limitations, and next resume point.

---

## Final Standard

> A result is trustworthy only when the system can identify the exact source data,
> policy, eligibility decision, calculation, evidence, and explanation that produced it.

> Prefer a reproducible limited answer over an impressive answer built from
> incomplete coverage, weak external data, or untraceable assumptions.
