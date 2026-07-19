# Trader Intelligence v3 GA0-B Deterministic Proof Implementation Plan

**Date:** 2026-07-19 America/Toronto  
**Status:** Active implementation plan after GA0-A3 acceptance  
**Accepted GA0-A3 merge:** `72ca53940403dfab63979d403bd6b479539f41db`  
**Operating profile:** `private_owner_alpha`  
**Operational hosting:** local owner testing only  
**Primary product:** AI-powered educational trading journal for U.S. listed small-cap and micro-cap active traders  
**Current program:** GA0-B — deterministic proof  
**Runtime model calls:** forbidden in GA0-B  
**Visible chart rendering:** forbidden in GA0-B  
**Production deployment:** forbidden in GA0-B

---

# 1. Purpose

GA0-B proves that the accepted GA0-A factual foundation can produce trustworthy,
reproducible analytical answers that later user interfaces and AI explanations
may consume without recalculating financial truth.

The product goal remains an AI-powered trading journal. GA0-B is not a change in
that goal. It is the shortest professional bridge between exact journal facts
and the visible AI experience.

GA0-B implements only enough deterministic analytics to prove the complete
path:

```text
accepted analysis snapshot
  -> read-only analytical dataset
  -> registered analytics or simulation tool
  -> exact table
  -> validated claims
  -> included/excluded counts and reasons
  -> stable evidence references
  -> validated chart-ready series
  -> reproducible run receipt
```

The first two proof questions are:

1. **Why am I losing money on Fridays?**
2. **What happens if I stop trading after two consecutive losses?**

These questions were selected because together they prove:

- grouping and comparison analytics;
- exact financial aggregation;
- robust/outlier-aware evidence;
- session ordering;
- counterfactual rule simulation;
- evidence drill-down;
- tables and chart-ready data;
- claim validation;
- deterministic replay.

GA0-B must not become a broad analytics build-out. Other questions such as VWAP,
price ranges, setup ranking, chasing, stopped-trade recovery, position sizing,
and profit giveback remain approved later tools, but they do not enter GA0-B
unless a narrow shared contract is required for the two proof tools.

---

# 2. Accepted baseline

GA0-B starts only from current `main` after all GA0-A slices are accepted and
merged:

| Slice | Accepted merge |
| --- | --- |
| GA0-A1 containment and architecture | `4f9e440116258c9548a2d13f7ea057a9075101c6` |
| GA0-A2 exact execution truth | `e6d0183cd03f55fb4b2b396f4f35ac2b2d035a8a` |
| GA0-A3 temporal, manifest, eligibility, and query foundation | `72ca53940403dfab63979d403bd6b479539f41db` |

Accepted GA0-A authority includes:

- exact canonical decimals and ratios;
- canonical executions and occurrence identity;
- duplicate/correction resolution;
- exact FIFO analytical P/L;
- correction replay and accepted execution catalogs;
- content-addressed manifests;
- per-capability eligibility;
- canonical date/filter receipts;
- immutable analysis snapshots;
- producer-derived evidence inventories;
- runtime validation;
- stale/invalidation states;
- local backup/restore and parser hardening.

GA0-B must reuse these authorities. It must not create a second execution model,
second P/L engine, second filter authority, second evidence namespace, or a
parallel snapshot format.

---

# 3. Product and engineering priorities

## 3.1 Primary priority

Build a usable, professional AI trading journal as quickly as correctness allows.

Foundation work is justified when it directly improves:

- financial accuracy;
- analytical honesty;
- evidence quality;
- reliability;
- maintainability;
- future AI answer quality;
- owner testing speed.

Work whose main purpose is protecting disposable local test data on the owner's
computer is not a priority. Existing accepted containment remains in place, but
GA0-B must not expand local privacy, network restrictions, enterprise security,
or hosted-user infrastructure.

## 3.2 Product rule

> Code calculates the truth. AI will later select, connect, and explain that truth.

AI is not implemented in GA0-B.

## 3.3 Delivery rule

> Every analytical number, claim, table, exclusion, and chart-ready value comes
> from one immutable analysis snapshot and one accepted canonical filter.

## 3.4 Honesty rule

GA0-B produces historical descriptive and counterfactual evidence. It does not
claim causation, guaranteed improvement, investment advice, or future outcomes.

---

# 4. Authority and read order

Before implementing any GA0-B slice, read in this order:

1. `AGENTS.md`
2. `plan.md`
3. `src/docs/trader-intelligence-v3-project-log.md`
4. `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`
5. this GA0-B plan
6. accepted GA0-A ADRs
7. `src/docs/trader-intelligence-v3-fifth-pass-qa-query-filter-visual-evidence-and-accessibility-review-2026-07-17.md`
8. `src/docs/trader-intelligence-ai-journal-v3-master-plan-2026-07-17.md` for rationale
9. current-system inventory and legacy hazard register
10. relevant existing analytics, import, reconstruction, chart-contract, and test files

Precedence remains:

1. latest accepted project-log decision;
2. controlling architecture specification;
3. this active GA0-B plan;
4. detailed reviews and master plan as rationale;
5. legacy v1/v2 documents as implementation evidence.

Historical audit handoffs are evidence, not active implementation authority.

---

# 5. GA0-B boundaries

## 5.1 GA0-B builds

- a read-only adapter from accepted snapshot truth to an analytical row set;
- shared exact analytical contracts;
- a deterministic tool registry containing two proof tools;
- weekday performance analytics;
- a consecutive-loss daily-stop simulation;
- exact tables;
- validated claim contracts and claim policies;
- included/excluded counts and stable reason codes;
- stable evidence sets and drill-down bundles;
- validated chart-ready series contracts;
- text/table/series consistency validation;
- internal diagnostics;
- focused, property, differential, and scale tests;
- a GA0-B verification script and CI boundary.

## 5.2 GA0-B does not build

- AI/model calls;
- prompt engineering;
- natural-language parsing;
- Ask AI routes;
- query UI;
- chart rendering;
- React chart components;
- visual-template selection by AI;
- market-candle enrichment;
- VWAP analytics;
- setup classification;
- support/resistance or zone synthesis;
- behavioral labels such as revenge trading;
- broad feature-store persistence;
- manual trade entry;
- period reflections;
- Real Coach or Whop;
- public accounts or hosted identity;
- production database migration;
- Vercel or deployment;
- local-security expansion unrelated to the analytical proof.

## 5.3 Data restrictions

- Use synthetic data in Git and tests.
- Do not commit real CSVs, account identifiers, private database files, screenshots,
  WAL/SHM files, or raw owner trade rows.
- The proof tools may operate locally against owner data only through the accepted
  read-only adapter and existing private-data rules.
- No live model, market-data, broker, payment, Discord, Whop, or deployment call
  is allowed in normal tests or CI.

---

# 6. Delivery sequence

GA0-B is delivered as four sequential, independently audited pull requests.
Each slice starts only after the prior slice is independently accepted and merged.

| Slice | Branch | Primary deliverable |
| --- | --- | --- |
| GA0-B1 | `agent/trader-intelligence-v3-ga0-b1-read-model` | snapshot-bound read-only analytical dataset and shared proof contracts |
| GA0-B2 | `agent/trader-intelligence-v3-ga0-b2-weekday-proof` | weekday analytics, exact tables, claims, evidence, and series |
| GA0-B3 | `agent/trader-intelligence-v3-ga0-b3-daily-stop-proof` | consecutive-loss daily-stop simulation and actual-versus-simulated evidence |
| GA0-B4 | `agent/trader-intelligence-v3-ga0-b4-proof-closeout` | registry, cross-artifact consistency, diagnostics, scale/property/differential tests, GA0-B acceptance |

Do not combine all four slices into one giant PR.

Every PR must:

- remain draft until independent acceptance;
- be based on current `main` after the previous slice merge;
- include one tested executable head;
- place the final handoff in a later documentation-only commit when practical;
- stop for independent audit;
- remain unmerged until the independent auditor accepts it.

---

# 7. Shared GA0-B architecture

Recommended new boundary:

```text
src/lib/trader-intelligence-v3/
  analytics/
    contracts/
    adapters/
    registry/
    tools/
      weekday/
    claims/
    tables/
    series/
    diagnostics/
  simulations/
    contracts/
    daily-stop/
  evidence/
    analytical-evidence-bundle.ts
  testing/
    ga0-b/
```

Exact final paths may adapt to the repository, but the following boundaries are
mandatory:

- deterministic domain code has no Next.js or React imports;
- analytics and simulations do not import OpenAI or an AI SDK;
- analytics and simulations do not import market-data or support/resistance
  providers in GA0-B;
- adapters may read through explicit interfaces, but tool code does not directly
  instantiate SQLite or route repositories;
- route and UI code never becomes analytical authority;
- the browser never recomputes authoritative financial values;
- legacy analytics may be used only as a comparison oracle or adapter source,
  never as silent v3 authority.

---

# 8. Shared deterministic contracts

GA0-B1 owns the shared v1 contracts below. Later slices may strengthen them but
must not create incompatible parallel versions.

## 8.1 Analytical dataset receipt

The read-only adapter returns a runtime-verifiable, content-addressed receipt
containing:

- schema version;
- analysis snapshot digest;
- dataset manifest digest;
- canonical filter digest;
- analysis cutoff;
- correction cutoff/result digest;
- eligibility-set digest;
- retrospective-policy digest;
- evidence namespace;
- currency partitions;
- exact included analytical rows;
- exact excluded candidate rows;
- stable exclusion reason codes;
- occurrence and round-trip evidence inventory digests;
- adapter key and version;
- derivation policy key and version;
- receipt digest.

The receipt must be deeply immutable and verifiable when untrusted or persisted
content re-enters.

## 8.2 Analytical row v1

GA0-B's minimal analytical row represents one eligible closed flat-to-flat round
trip. It contains only facts required by the proof tools:

- semantic round-trip key;
- exact supporting execution/occurrence references;
- canonical account key;
- stable instrument key;
- displayed symbol as non-authoritative metadata;
- long/short direction;
- currency;
- first-entry timestamp;
- final-exit timestamp;
- resolved session date and weekday under the snapshot/filter timezone;
- deterministic sequence within the session/day;
- exact gross P/L;
- exact charges;
- exact net P/L;
- exact entry notional or a structured unavailable state;
- exact share quantity or a structured unavailable state;
- lifecycle/coverage state;
- evidence quality and limitation codes.

Optional facts may include time bucket, prior completed trade outcome, or prior
consecutive losses when they are derived deterministically from the same ordered
row stream.

GA0-B1 must not add candle-derived MFE/MAE, VWAP, setup, catalyst, or level data.

## 8.3 Exact metric value

Authoritative metric values use explicit kinds:

- canonical exact decimal with unit and optional currency;
- exact reduced ratio with numerator/denominator and semantic unit;
- canonical bounded integer string;
- canonical duration;
- timestamp/date;
- enum/state;
- unavailable with stable reason code.

JavaScript `number` must not be used as financial authority or as the content
identity for financial metrics. Display conversion is outside the domain result.

## 8.4 Analysis run receipt

Every tool execution returns a content-addressed run receipt containing:

- tool key and version;
- tool-policy version;
- snapshot/filter/dataset receipt identities;
- normalized arguments;
- eligibility state used;
- run status;
- exact table identities;
- claim identities;
- series identities;
- evidence-bundle identities;
- included/excluded counts;
- limitations;
- diagnostics identity;
- run digest.

No wall-clock value enters the result identity unless it is an explicit analysis
cutoff already contained in the snapshot. Operational timing may exist outside
the authoritative content.

## 8.5 Tool registry

The registry contains exactly two executable tools at GA0-B completion:

- `analyze_performance_by_weekday:v1`;
- `simulate_daily_stop_rule:v1`.

A registry entry includes:

- tool key/version;
- description;
- required eligibility capability;
- accepted argument schema;
- required row fields;
- output contracts;
- evidence policy;
- minimum sample policy;
- supported currencies/timezones;
- deprecation state;
- focused tests.

The registry is deterministic and does not call a model.

---

# 9. Exact analytical semantics

## 9.1 Currency

- Never aggregate financial values across currencies without an explicit accepted
  FX policy. GA0-B has no FX policy.
- Return separate partitions for USD, CAD, or any other currency.
- A user-wide answer across multiple currencies is blocked or reported as
  separate currency results.

## 9.2 Counts

Counts are canonical nonnegative integer strings in content-addressed authority.
Internal safe integers may be used only behind bounded conversion and must not
silently overflow.

## 9.3 Sum

Financial sums use accepted exact-decimal addition.

## 9.4 Average

Averages are represented as exact reduced ratios when division does not terminate
as a canonical decimal. Display rounding is not authority.

## 9.5 Median

- Sort exact values numerically, not lexicographically.
- Odd sample: middle exact value.
- Even sample: exact reduced average of the two middle values.
- Return an exact ratio when needed.

## 9.6 Win rate

Return exact wins/trades ratio. Flat trades are reported separately and the
policy states whether the denominator is all trades or decisive trades. The GA0-B
v1 default is all included trades.

## 9.7 Expectancy

Expectancy is exact total net P/L divided by included trade count and is returned
as an exact ratio with currency.

## 9.8 Ordering

- Weekday output uses semantic weekday order Monday through Friday, with optional
  weekend buckets only when actual eligible sessions exist.
- Daily simulations use verified session date and verified economic/entry order.
- Digest order is never upgraded into economic order.
- Ambiguous within-day ordering blocks the affected session from simulation and
  records an exclusion.

## 9.9 Open positions

Closed-trade analytics use only eligible closed round trips. Open positions may
appear in exclusion/coverage disclosures but cannot enter the closed-trade
financial denominator.

## 9.10 Included/excluded accounting

Every tool reports:

- candidate count;
- included count;
- excluded count;
- exclusion counts by reason;
- exact included evidence set;
- exact excluded evidence set where permitted;
- coverage and eligibility limitations.

No tool may silently drop a row.

---

# 10. Evidence and claim policy

## 10.1 Evidence bundle

Each material table row, claim, and series point references an immutable evidence
bundle containing:

- snapshot and filter digest;
- tool run digest;
- exact round-trip keys;
- exact execution occurrence keys where required;
- comparison-group identity;
- included/excluded state;
- stable limitation codes.

Evidence bundles must resolve through accepted GA0-A3 evidence inventories and
must remain stable across persistence-ID-only reimports.

## 10.2 Validated claim v1

A claim contains:

- claim key/version;
- claim type;
- subject group;
- comparison group;
- metric key;
- direction and exact effect;
- target and comparison sample sizes;
- confidence/evidence label;
- outlier-sensitivity state;
- evidence bundle identities;
- counterexample evidence identities;
- limitation codes;
- allowed wording code;
- claim digest.

Claim content should be machine-readable. GA0-B may include deterministic plain
language for developer inspection, but later AI prose does not become part of
financial authority.

## 10.3 Conservative evidence policy v1

GA0-B uses a versioned conservative policy:

- fewer than 5 target observations: `insufficient`;
- 5–9 target observations: descriptive result only, no promoted tendency claim;
- at least 10 target and at least 20 comparison observations: eligible for a
  tentative/moderate descriptive claim if other rules pass;
- no `high` confidence claim in GA0-B;
- a claim is limited when one trade contributes more than a versioned proportion
  of total effect;
- a claim is limited when mean and median imply materially different directions;
- limitations never disappear from table, series, or future prose.

Exact thresholds are implemented under an explicit policy key and version. Any
strengthening discovered during implementation must be documented; no silent
weakening is allowed.

## 10.4 Outlier sensitivity

At minimum report:

- result including all included trades;
- result without the largest winning trade;
- result without the largest losing trade;
- largest single-trade contribution to total net P/L;
- mean-versus-median direction agreement;
- whether the primary conclusion changes under either leave-one-out scenario.

This is deterministic robustness evidence, not a complete statistical proof.

## 10.5 Counterexamples

When a material claim is produced, include counterexamples when available:

- profitable trades in the weak group;
- losing trades in the strong group;
- days harmed by a rule that helped overall;
- days helped by a rule that harmed overall.

---

# 11. Exact tables and chart-ready series

## 11.1 Exact table v1

A table contains:

- table key/version;
- snapshot/filter/run identities;
- title/purpose code;
- units, currency, timezone, date basis, denominator policy;
- ordered columns with value kinds;
- canonical rows;
- total/summary rows where mathematically valid;
- included/excluded counts;
- coverage/eligibility state;
- limitations;
- evidence bundle per row;
- table digest.

## 11.2 Chart-ready series v1

A chart-ready series is deterministic evidence data, not rendered graphics.
It contains:

- series key/version;
- approved visual purpose;
- allowed future visual-template keys;
- snapshot/filter/run/table identities;
- x-domain and semantic order;
- exact y values;
- unit/currency/timezone/date basis;
- zero-baseline requirement;
- denominator/sample size per point;
- inclusion/exclusion disclosure;
- evidence bundle per point;
- table alternative identity;
- accessibility-summary facts;
- point budget/downsampling policy;
- limitations;
- series digest.

## 11.3 Series derivation rule

A series may select or reshape values already present in a validated exact table.
It may not introduce a new financial calculation.

## 11.4 Consistency validator

The validator proves:

- claim metrics exist in the authoritative table;
- series values equal corresponding table values;
- snapshot/filter/run/currency/timezone/unit identities match;
- included/excluded counts agree;
- limitations are not dropped;
- evidence sets resolve;
- no mixed snapshot or manifest appears.

---

# 12. GA0-B1 — Read-only analytical adapter and proof contracts

**Branch:** `agent/trader-intelligence-v3-ga0-b1-read-model`

## 12.1 Goal

Create the smallest trustworthy analytical input layer over one accepted analysis
snapshot without producing an analytical conclusion yet.

## 12.2 Required work

1. Record GA0-A3 acceptance and merge in active status documents.
2. Make this GA0-B plan the active implementation plan.
3. Inventory current read-only data and reconstruction surfaces that may feed v3.
4. Define the analytical dataset receipt and analytical row v1.
5. Define exact metric, run, table, claim, series, diagnostics, and tool-registry
   contracts needed by later slices.
6. Implement a read-only adapter interface.
7. Implement one production-shaped local adapter or current-data bridge that:
   - consumes verified GA0-A3 snapshot dependencies;
   - reads only;
   - does not modify legacy or v3 persistence;
   - fails closed if exact round-trip/evidence truth cannot be proven;
   - returns included and excluded rows with reasons.
8. Implement a synthetic in-memory adapter for tests.
9. Add architecture guards preventing analytics from importing app, React, AI,
   market data, support/resistance, or direct database implementation.
10. Add runtime validation and content identity for every new authority.

## 12.3 Adapter selection rule

Codex must inspect the repository before choosing the current-data bridge. It may
wrap accepted current repository/read-model interfaces, but it must not:

- migrate owner data;
- rewrite the importer;
- read private SQLite files in tests;
- trust legacy JavaScript-number financial values as v3 authority;
- infer missing exact values;
- expose a route or UI.

When the current saved model cannot provide exact v3 facts, return a stable
ineligible/unavailable state and document the later adapter or migration need.

## 12.4 B1 acceptance

- one verified snapshot produces one deterministic dataset receipt;
- caller row order and persistence IDs do not change the receipt;
- exact row values agree with accepted reconstruction truth;
- open/ineligible/ambiguous rows are excluded visibly;
- currencies remain partitioned;
- all new authorities are deeply immutable and verifiable;
- no analytics conclusion, simulation, AI, chart, or UI is implemented;
- focused tests and architecture guards pass;
- independent audit accepts the PR.

## 12.5 B1 handoff path

```text
src/docs/trader-intelligence-v3-ga0-b1-read-model-implementation-and-audit-handoff-2026-07-19.md
```

---

# 13. GA0-B2 — Weekday deterministic proof

**Branch:** `agent/trader-intelligence-v3-ga0-b2-weekday-proof`

## 13.1 Goal

Implement `analyze_performance_by_weekday:v1` as the first complete deterministic
analytics tool.

## 13.2 Required input

- verified analysis snapshot;
- accepted canonical filter;
- verified GA0-B analytical dataset receipt;
- exact capability eligibility for closed-trade analytics;
- optional target weekday argument, defaulting only through explicit tool policy;
- outlier/evidence policy version.

## 13.3 Required output

### Weekday summary table

For each weekday/currency partition:

- included trade count;
- win/loss/flat counts;
- exact gross P/L;
- exact charges;
- exact net P/L;
- exact expectancy ratio;
- exact median net P/L;
- exact win-rate ratio;
- best and worst trade evidence;
- result excluding best trade;
- result excluding worst trade;
- evidence and limitations.

### Target weekday comparison

For a target such as Friday, compare against the explicit baseline of other
included weekdays and report:

- trade-count difference;
- net P/L difference;
- expectancy difference;
- median difference;
- win-rate difference;
- average/median entry-time bucket where available;
- average/median position/notional bucket where exact data is available;
- trade-sequence distribution;
- after-loss distribution derived from prior completed trades;
- outlier sensitivity;
- sample sufficiency;
- counterexamples.

Unavailable decompositions must return limitations rather than guessed values.
Setup, VWAP, candles, levels, and catalysts are unavailable in GA0-B2.

### Claims

Claims are descriptive, for example:

- target weekday underperformed its comparison group on net expectancy;
- the difference was or was not stable after removing the largest win/loss;
- trade count explains more of total P/L than per-trade expectancy;
- after-loss trades were overrepresented, when exact evidence supports it.

Do not use causal wording such as "Friday causes losses."

### Series

Produce validated chart-ready series for:

- net P/L by weekday;
- trade count by weekday;
- expectancy by weekday;
- optional target-versus-baseline metric comparison.

Each series has an exact table alternative and evidence per point.

## 13.4 Required invariants

- weekday derives from the accepted date/time receipt and timezone;
- no locale-dependent weekday identity;
- order is semantic Monday–Friday;
- weekend sessions appear only when real eligible data exists;
- currencies never mix;
- target plus baseline exactly partition included rows;
- every number reconciles to the row set;
- claim/table/series consistency validator passes;
- input permutation and persistence-ID-only changes preserve output identity.

## 13.5 B2 acceptance

- the tool answers the deterministic substance of "Why am I losing money on
  Fridays?" without AI;
- exact table, claims, series, evidence, counterexamples, and limitations agree;
- insufficient samples abstain from promoted claims;
- outlier-sensitive results are labeled;
- focused and property/differential tests pass;
- independent audit accepts the PR.

## 13.6 B2 handoff path

```text
src/docs/trader-intelligence-v3-ga0-b2-weekday-proof-implementation-and-audit-handoff-2026-07-19.md
```

---

# 14. GA0-B3 — Consecutive-loss daily-stop simulation proof

**Branch:** `agent/trader-intelligence-v3-ga0-b3-daily-stop-proof`

## 14.1 Goal

Implement `simulate_daily_stop_rule:v1` for the question:

> What happens if I stop trading after two consecutive losses?

The v1 tool supports a configurable consecutive-loss threshold with a conservative
bounded range. Other daily-stop rule types remain future work.

## 14.2 Rule semantics

The simulation groups eligible closed round trips by:

- canonical account;
- currency;
- verified session date/timezone.

Within each session it uses verified meaningful first-entry order and completed
round-trip outcomes.

The default proof argument is:

```text
consecutive completed losing round trips = 2
```

A stop triggers immediately after the round trip that establishes the threshold.
Round trips whose first entry occurs strictly after that triggering round trip are
excluded from the simulated session.

Rules:

- already-open overlapping positions are not silently deleted;
- ambiguous ordering blocks the affected session;
- overlapping or interleaved round trips require an explicit conservative policy;
- flat outcomes reset or preserve the loss streak only according to the versioned
  rule policy; v1 must choose and document one behavior;
- the simulation removes future trades only;
- it does not alter fills, prices, commissions, or earlier trades;
- it does not claim the trader's psychology or market would otherwise be identical.

## 14.3 Required output

### Per-day table

- session date;
- currency/account partition;
- actual trade count;
- simulated trade count;
- threshold reached state;
- threshold trade/time evidence;
- removed trade count;
- actual exact net P/L;
- simulated exact net P/L;
- exact difference;
- helped/harmed/unchanged classification;
- evidence and limitations.

### Aggregate table

- candidate/included/excluded session counts;
- days threshold reached;
- days helped;
- days harmed;
- unchanged days;
- actual total net P/L;
- simulated total net P/L;
- exact difference;
- actual/simulated trade count;
- worst/best day effect;
- result excluding the largest helped day;
- result excluding the largest harmed day;
- counterexamples and limitations.

### Claims

Claims are counterfactual and carefully worded, for example:

- under this fixed historical removal rule, simulated net P/L was higher/lower;
- the result depended heavily on one day;
- the rule reduced losses but also removed profitable later trades;
- evidence is insufficient to support a stable rule candidate.

Never say the rule would definitely improve future performance.

### Series

Produce validated chart-ready series for:

- actual versus simulated P/L by session;
- difference by session;
- optional cumulative actual versus simulated totals using exact values.

## 14.4 Independent reference

Implement an independent compact reference simulation that does not import the
production streak/matching loop. Production and reference outputs must agree for
synthetic and generated cases.

## 14.5 Required invariants

- simulation cannot change trades before the threshold;
- removed rows are an exact suffix under verified session order;
- actual = retained + removed exact P/L;
- simulated = retained exact P/L;
- difference = simulated − actual;
- days helped/harmed/unchanged exactly partition simulated days;
- currencies/accounts do not mix;
- ambiguous sessions are excluded, not guessed;
- input permutation does not change results;
- claim/table/series/evidence consistency passes.

## 14.6 B3 acceptance

- the tool answers the deterministic substance of the two-loss-stop question;
- actual and simulated values reconcile exactly;
- days helped and harmed are inspectable;
- assumptions and exclusions are explicit;
- reference/differential/property tests pass;
- independent audit accepts the PR.

## 14.7 B3 handoff path

```text
src/docs/trader-intelligence-v3-ga0-b3-daily-stop-proof-implementation-and-audit-handoff-2026-07-19.md
```

---

# 15. GA0-B4 — Deterministic proof closeout

**Branch:** `agent/trader-intelligence-v3-ga0-b4-proof-closeout`

## 15.1 Goal

Prove the two tools form a reusable, reproducible analytical service ready for
private calibration and later UI/AI consumption.

## 15.2 Required work

1. Finalize the two-tool registry.
2. Add a deterministic tool-runner boundary that validates arguments and
   eligibility before execution.
3. Add cross-artifact consistency validation.
4. Add evidence-bundle resolution tests.
5. Add diagnostics for:
   - mixed snapshot/filter;
   - stale manifest/policy/eligibility;
   - currency mixing;
   - unsupported arguments;
   - insufficient samples;
   - exclusion overflow;
   - evidence resolution failures;
   - table/series/claim mismatch.
6. Add fixed-seed property tests only where they provide meaningful invariants.
7. Add independent reference/differential tests for both tools.
8. Add a deterministic scale test using at least 10,000 synthetic analytical rows
   without quadratic artifact creation.
9. Add `verify:ti-v3:ga0-b` or an equivalent focused verifier.
10. Integrate the focused verifier into CI without any live external call.
11. Update inventory, hazard register, project log, and active plan status.
12. Produce the final GA0-B audit handoff.

## 15.3 Performance budgets

The plan does not impose fragile microbenchmark thresholds. Tests must include:

- structural assertions preventing all-pairs artifact materialization;
- a generous deterministic elapsed-time budget documented with environment;
- bounded table, claim, series, and evidence counts;
- explicit maximum rows/points/claims;
- stable oversized-input reason codes.

## 15.4 GA0-B acceptance

GA0-B is accepted only when:

- both registered tools consume one verified snapshot/filter dataset;
- exact financial outputs reconcile;
- eligibility and exclusion handling are deterministic;
- tables, claims, series, and evidence are mutually consistent;
- output identity is invariant to caller order and persistence IDs;
- all currencies remain separate;
- tool results abstain or limit honestly;
- property/reference/scale tests pass;
- architecture and private-data guards pass;
- normal CI calls no model or external provider;
- no UI, chart renderer, AI, market enrichment, or deployment entered;
- independent audit accepts the final PR.

## 15.5 B4 handoff path

```text
src/docs/trader-intelligence-v3-ga0-b4-proof-closeout-implementation-and-audit-handoff-2026-07-19.md
```

---

# 16. Testing strategy

The owner requires useful testing without repeatedly running slow repository-wide
checks on the local computer.

## 16.1 Default during implementation

- Run only focused tests for the module currently being changed.
- Do not run repository-wide TypeScript after each module.
- Run `npx tsc --noEmit --pretty false` once near the end of executable work.
- Do not run local `npm test` unless a focused failure shows a concrete broad
  regression risk.
- Do not run Playwright unless a slice unexpectedly changes browser-facing code.
- Do not run a production build after each module.
- Do not run `npm ci` unless package or lock files changed.
- Let GitHub CI run the full repository test suite, Layer 2, and Layer 3.
- Never describe an interrupted or unrun command as passed.

## 16.2 Focused tests by slice

### B1

- analytical row/receipt validation;
- adapter determinism;
- snapshot/filter/eligibility mismatch;
- inclusion/exclusion reasons;
- currency partitioning;
- persistence-ID/input-order invariance;
- architecture boundaries.

### B2

- weekday mapping and semantic order;
- exact sum/median/average/win rate;
- target/baseline partition;
- sample policy;
- outlier sensitivity;
- evidence/counterexamples;
- table/claim/series consistency;
- fixed-seed input permutation.

### B3

- streak state machine;
- flat-outcome policy;
- threshold timing;
- ambiguous/overlapping sessions;
- actual-versus-simulated reconciliation;
- days helped/harmed;
- independent reference differential;
- property tests.

### B4

- registry and argument validation;
- stale/mixed dependency diagnostics;
- evidence resolution;
- cross-tool consistency;
- 10,000-row scale proof;
- focused verifier/CI.

## 16.3 Final executable checkpoint per slice

After all executable changes in a slice:

1. `git diff --check`
2. `npm ci` only if dependencies changed
3. one repository-wide TypeScript run
4. changed-path ESLint
5. one consolidated focused verifier for that slice and adjacent affected tests
6. architecture guard
7. private-data guard
8. build only when the slice changes build-facing/configuration/browser code or
   when the final GA0-B closeout requires one accepted build checkpoint

GitHub CI owns full repository tests and Layer 2/3.

## 16.4 Documentation-only closeout

After executable verification, the final handoff/documentation commit does not
trigger another heavy local run.

Run only:

- `git diff --check`;
- private-data guard;
- SHA/path/count/command evidence validation;
- lightweight Markdown validation if available.

Clearly distinguish:

- tested executable head;
- documentation-only head;
- current PR head;
- local results;
- GitHub CI results;
- commands deliberately not run.

---

# 17. Mandatory Codex handoff protocol

This protocol applies to **every Codex implementation or remediation prompt** in
GA0-B.

## 17.1 Last action in every Codex run

The last substantive action of the run must be to create or update the slice's
Markdown implementation/audit handoff in the repository.

Codex must not finish with only a chat summary.

## 17.2 Required handoff contents

Every handoff must contain:

1. warning that it is implementer-supplied evidence, not proof;
2. repository, branch, PR, base, and merge-base identities;
3. exact tested executable head;
4. exact later documentation-only/current head;
5. complete commit chronology;
6. complete changed-file inventory;
7. plan-requirement-to-file/test mapping;
8. architecture decisions and invariants;
9. exact focused test commands and results;
10. the one final TypeScript result;
11. build result or explicit reason it was not required;
12. architecture/private-data results;
13. GitHub CI run IDs and state, clearly separated from local tests;
14. commands deliberately not run;
15. interrupted/failed commands and their corrections;
16. known limitations and deferred work;
17. confirmation no out-of-scope AI/UI/chart/market/deployment work entered;
18. exact independent audit commands;
19. a complete ready-to-paste prompt for the independent auditor.

## 17.3 Required Codex final response

Codex's final response to the owner must include:

- branch and PR;
- tested executable head;
- documentation/current head;
- exact handoff path;
- focused test summary;
- commands not run;
- PR state;
- confirmation no merge/deployment/next-slice work occurred;
- the complete ready-to-paste auditor prompt from the handoff.

## 17.4 Handoff commit rule

When practical:

- executable code and tests are committed first;
- the full executable checkpoint runs on that exact head;
- the handoff is committed afterward as Markdown only;
- heavy checks are not repeated solely because the handoff was added.

## 17.5 Audit rule

The independent auditor treats the handoff as evidence, not proof. The auditor
must inspect:

- the complete slice diff;
- every relevant changed runtime file;
- focused tests;
- unresolved PR threads;
- current-head CI;
- adversarial failure paths;
- scope compliance.

The auditor returns:

- `accept`;
- `accept with required fixes`; or
- `reject`.

Codex does not resolve independent review threads. The independent auditor
resolves accepted threads during closeout and merges only after acceptance.

---

# 18. Documentation and continuity

Each slice updates, when applicable:

- `plan.md`;
- `src/docs/trader-intelligence-v3-project-log.md`;
- this GA0-B plan status;
- controlling architecture only for material decisions;
- current-system inventory;
- legacy hazard register;
- new ADRs for analytical metric/claim/series or simulation semantics;
- the slice handoff.

Historical audit files remain immutable evidence and are not rewritten merely to
change current status.

---

# 19. Required ADRs

At minimum GA0-B must produce accepted decision records for:

1. deterministic analytical dataset and exact metric semantics;
2. validated claims, exact tables, and chart-ready series;
3. weekday tool v1 and evidence policy;
4. consecutive-loss daily-stop simulation v1;
5. deterministic tool registry and run receipt.

Related decisions may be combined when the document remains clear and auditable.

---

# 20. Security and privacy priority ruling

GA0-B retains accepted safeguards but does not expand local-owner security as a
feature goal.

Prioritize:

- exact financial truth;
- reliable analytical evidence;
- data-loss prevention;
- maintainable boundaries;
- professional error handling;
- future production compatibility.

Defer until public/hosted work:

- broad multi-user authorization redesign;
- hosted tenancy;
- enterprise threat controls;
- production rate limiting;
- public deployment hardening.

Do not weaken an accepted safeguard merely because local data is disposable.
Do not spend GA0-B time adding safeguards unrelated to the proof tools.

---

# 21. Exit and next phase

After GA0-B independent acceptance:

## GA0-C — Private calibration

Use private owner data outside Git to verify:

- reconciliation and coverage;
- exact weekday answer usefulness;
- two-loss-stop assumptions and evidence;
- date/filter correctness;
- table/series consistency;
- exclusions and limitations;
- backup/restore drill;
- defects converted into safe synthetic regressions.

## GA1 — Query and visual evidence

Build the owner-facing deterministic query/filter UI, exact tables, accessible
chart renderer, and evidence drill-down using the accepted GA0-B outputs.

## GA2 — Owner-only AI

Add the AI question router and explanation layer over approved deterministic
tools. The AI may select tools and visual templates and explain claims. It does
not calculate values or generate chart code/data.

The implementation program should move through GA0-B and GA0-C without broad
foundation expansion so the visible AI journal is reached promptly and safely.

---

# 22. Immediate next action

1. Record GA0-A3 as accepted and merged at
   `72ca53940403dfab63979d403bd6b479539f41db`.
2. Make this file the active implementation plan.
3. Create `agent/trader-intelligence-v3-ga0-b1-read-model` from current `main`.
4. Implement GA0-B1 only.
5. Use focused testing during development and one TypeScript run near the end.
6. Finish by creating the mandatory B1 handoff file and ready-to-paste auditor
   prompt.
7. Open one draft PR and stop for independent audit.
8. Do not begin B2, UI, charts, AI, market data, support/resistance, or deployment.
