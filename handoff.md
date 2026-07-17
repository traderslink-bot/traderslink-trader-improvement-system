# Trader Intelligence v3 Handoff

**Last updated:** 2026-07-17 America/Toronto  
**Active architecture:** Trader Intelligence v3  
**Current operating profile:** `private_owner_alpha`  
**Primary domain:** small-cap and micro-cap active trading  
**Product boundary:** retrospective educational trade review  
**Current gate:** Gate 0 — common truth, architecture lock, and first private-alpha deterministic slice  
**Active execution plan:** `src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`

Use this file for quick orientation. `plan.md` remains the root entry point.

---

## 1. Resume Order

Read in this exact order:

1. `plan.md`
2. `src/docs/trader-intelligence-v3-project-log.md`
3. `src/docs/trader-intelligence-v3-second-pass-qa-private-alpha-small-micro-cap-review-2026-07-17.md`
4. `src/docs/trader-intelligence-v3-qa-architecture-review-2026-07-17.md`
5. `src/docs/trader-intelligence-ai-journal-v3-master-plan-2026-07-17.md`
6. `src/docs/trader-intelligence-plan-index.md`
7. `src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`
8. legacy plans only when the active v3 work explicitly needs route history,
   educational content, fixture evidence, migration parity, or preserved implementation details.

When documents conflict:

1. latest v3 project-log decision;
2. mandatory second-pass private-alpha and small/micro-cap QA review;
3. first mandatory v3 QA review;
4. v3 master plan;
5. active v3 execution plan;
6. legacy documents.

Do not resume the old May continuous coaching or UI batches merely because those
files still contain historical `Active` labels.

---

## 2. Current Operating Facts

- Trader Intelligence is currently used only by the owner.
- It is not a public multi-user product.
- The current deployment profile is `private_owner_alpha`.
- The intended product is primarily for small-cap and micro-cap active traders.
- The app reviews completed trade executions for education and self-improvement.
- It is not a live signal, investment-advice, tax, portfolio-allocation, or automated-order product.
- Private-alpha sequencing may prioritize product usefulness before public multi-user infrastructure.
- Private-alpha status does not relax exact calculations, evidence, no-lookahead,
  price-basis safety, private-data handling, or simulation honesty.

---

## 3. Current Product Direction

Trader Intelligence v3 is a private evidence laboratory that can later become a
public evidence platform with an AI interface.

```text
private broker source data
  -> exact execution truth
  -> versioned position and round-trip reconstruction
  -> replay-safe features
  -> deterministic analytics and simulations
  -> validated claims and evidence
  -> owner-only AI explanation
  -> small/micro-cap enrichment by evidence capability
  -> future public-platform hardening
```

Code owns:

- broker CSV parsing;
- validation and repair state;
- duplicate detection;
- execution normalization;
- financial math;
- position and round-trip reconstruction;
- indicators and market features;
- statistics;
- simulations;
- evidence identifiers;
- data capability and quality states.

AI may select approved tools and explain validated results. It must not become:

- the parser;
- the calculator;
- the database;
- an unrestricted SQL generator;
- a market-data inventor;
- a live trade-signal engine;
- a source of current price targets;
- an automated broker.

---

## 4. Second-Pass QA Verdict

The master plan remains conditionally approved.

The first QA review correctly identified future public production blockers. The
second independent QA review found that the sequencing must distinguish current
private-owner testing from future public multi-user readiness.

Correct ruling:

- prove exact deterministic and AI-assisted usefulness in private alpha first;
- build clean interfaces that support later public identity, PostgreSQL, object
  storage, durable workflows, billing, and multi-tenant controls;
- do not let public infrastructure block early usefulness validation;
- do not let private-alpha shortcuts become public architecture.

Private alpha may use:

- one explicit owner identity adapter;
- durable local SQLite or an isolated private database;
- direct private file selection or bounded owner upload;
- local job adapters for small workloads;
- private real-data calibration outside Git;
- owner-only AI after deterministic grounding gates pass.

Private alpha still requires:

- exact decimals;
- explicit reconstruction and P/L policy;
- timestamp/session correctness;
- instrument identity and price-basis safety;
- dataset/evidence versioning;
- backup and restore;
- no raw CSV in logs or prompts;
- no live directional instructions.

Before invited or public users, v3 must additionally establish:

- shared platform identity;
- server-derived workspace/account authorization;
- PostgreSQL production authority;
- secure object-storage upload;
- bounded/streaming parsing;
- transactional outbox and durable workflows;
- tenant isolation, deletion, retention, backup, and recovery;
- rate limits and entitlements;
- licensing and public operational controls.

---

## 5. Small/Micro-Cap Domain Rulings

### Instrument identity and corporate actions

- ticker is not a durable instrument ID;
- resolve symbol history as of execution time;
- preserve raw broker symbols and execution prices;
- handle ticker changes, symbol reuse, splits, reverse splits, delistings, and exchange changes;
- chart-derived analytics fail closed when execution and market-data basis do not align.

### Sessions

- premarket, regular session, and after-hours are first-class;
- store UTC and classify against a versioned America/New_York exchange calendar;
- cover holidays, half days, daylight-saving transitions, and session-boundary holds.

### Halts

- missing candles do not prove a halt;
- halt conclusions require authoritative or qualified event data;
- simulations cannot assume fills while trading is halted;
- resume gaps require an explicit fill policy.

### Spread, liquidity, and slippage

- OHLCV candles cannot prove bid-ask spread, quote size, available liquidity, or exact slippage;
- quote-relative execution cost requires historical quote data;
- plan-relative slippage requires intended/order price data;
- candle-relative fill location must not be labeled as verified slippage;
- target touch is not proof of executable fill.

### Float, catalysts, dilution, and listing events

- float requires source and historical as-of provenance;
- float rotation is an estimate;
- catalyst and filing context require first-public timestamps and source IDs;
- later events cannot influence entry-time reasoning;
- dilution and listing labels require source-backed uncertainty;
- live watchlist directional fields must not be imported into the retrospective journal.

### Initial scope

- focus on supported U.S. listed common equities;
- options remain quarantined;
- OTC, warrants, rights, units, preferred shares, and unresolved instruments remain excluded or explicitly classified until intentionally supported;
- short execution facts may be supported before short-specific coaching is calibrated.

---

## 6. Data Capability Tiers

Every analytics result and AI answer must state the evidence capability used:

- E0 execution-only;
- E1 candle-enriched;
- E2 event-enriched;
- E3 quote-enriched;
- E4 share-structure-enriched;
- E5 combined enrichment with explicit limitations.

A tool cannot make a claim whose required evidence tier is unavailable.

Examples:

- E0 can analyze timing, size, sequence, fees, and repeated attempts.
- E1 can add MFE/MAE, VWAP, session range, and bar-based simulations.
- E1 cannot claim verified spread or executable liquidity.
- E2 can add qualified halts and catalysts.
- E3 can add quote-relative execution cost.
- E4 can add dated float and float rotation.

---

## 7. Educational Boundary

Allowed:

- historical performance analysis;
- evidence-linked trade review;
- historical rule simulations;
- prospective tracking of user-created rules;
- observable behavior descriptions;
- Academy links for education;
- explicit uncertainty and limitations.

Not part of the journal:

- live buy/sell/hold instructions;
- current price targets;
- automatic execution;
- guaranteed improvement;
- tax advice;
- portfolio allocation advice;
- claims that historical simulations will repeat.

Use historical and associative language. Questions phrased as `why` normally
receive the strongest associated historical contributors, not unsupported causal claims.

User-facing `best position size` should be framed as historical size-performance
analysis, not a prescriptive optimum.

---

## 8. Support and Resistance Decision

Do not create a second independent support/resistance detector inside Trader
Intelligence.

`levels-system-v2` already produces replay-safe final zones with boundaries,
strength, touches, confluence, sources, timeframes, freshness, and other evidence.

V3 adds a **Zone Usability and Congestion Layer** that:

- consumes the complete replay-safe final-zone map;
- preserves source-zone IDs;
- deduplicates only proven overlap;
- measures local congestion and clear space;
- selects at most one primary zone per side;
- suppresses conclusions when structure is crowded, unstable, stale,
  synthetic-only, or basis-unsafe;
- treats gaps, halt resumes, sparse prints, premarket context, and reverse-split
  warnings conservatively.

V3 AI remains execution-only until this layer passes separate stability,
suppression, basis-safety, and blinded-usefulness gates.

---

## 9. Active Gate 0 Work

The active plan requires:

- current-system preserve/adapt/legacy/retire inventory;
- deployment-profile contract;
- ADRs for decimals, P/L, identity direction, database direction, file ingestion,
  jobs, instrument/basis, product scope, statistics/simulations, and AI policy;
- `src/lib/trader-intelligence-v3/` internal boundary;
- authorization-context interface and owner-only test adapter;
- exact money, price, quantity, fee, percentage, and currency contracts;
- dataset-version contract;
- canonical execution and analytical round-trip contracts;
- claim/evidence, job, and future usage contracts;
- read-only adapter from current saved data;
- independent reference financial math;
- public synthetic golden fixtures;
- private real-data fixture policy;
- performance-by-weekday analytics;
- stop-after-consecutive-losses simulation;
- v3 CI.

The first coding run remains deterministic and internal-only.

It must not include:

- an AI provider call;
- a public v3 route;
- public production database writes;
- a coach redesign;
- support/resistance consumption;
- a second level detector;
- arbitrary SQL;
- vector storage;
- production deployment.

Owner-only AI is a later private-alpha gate after claim and evidence validation.

---

## 10. Private-Alpha and Public Tracks

### Private alpha

1. GA0 common truth and deterministic proof.
2. GA1 execution-only analytics expansion.
3. GA2 owner-only AI grounding.
4. GA3 small/micro-cap market enrichment.
5. GA4 usefulness calibration against legacy output.

### Future public readiness

1. shared identity and tenancy;
2. PostgreSQL and RLS;
3. secure public upload;
4. durable jobs and outbox;
5. deletion and retention;
6. entitlements and rate limits;
7. licensing and monitoring;
8. recovery and launch review.

---

## 11. First Implementation Branch

After the documentation architecture PR is accepted, create a clean branch from
current `main`, recommended:

`agent/trader-intelligence-v3-gate-0-foundation`

Do not mix Gate 0 runtime code into the documentation PR unless explicitly instructed.

Implementation order:

1. inventory current modules;
2. record deployment profiles and current `private_owner_alpha` mode;
3. accept common-truth ADRs;
4. create contracts and architecture-boundary tests;
5. create owner-scoped in-memory/read-only repositories;
6. build current-data adapter and synthetic fixtures;
7. build independent exact reference math;
8. implement weekday analytics;
9. implement daily-stop simulation;
10. add v3 CI;
11. run focused and legacy regression verification;
12. update the v3 project log and QA gate status.

---

## 12. Engineering Guardrails

- Do not use JavaScript floating point as financial authority.
- Do not add USD and CAD results together without a versioned FX policy.
- Do not guess prior inventory or a missing entry price.
- Do not call analytical P/L tax P/L.
- Do not join historical instruments solely by current ticker.
- Do not use adjusted candles against raw executions without basis alignment.
- Do not infer an official halt solely from missing candles.
- Do not call candle-relative location spread or slippage.
- Do not call a target touch an executable fill without a fill model.
- Do not use current float automatically for an old trade.
- Do not use later-published catalyst information in entry-time reasoning.
- Do not let a model calculate financial metrics from raw rows.
- Do not let a model follow instructions embedded in notes, filenames, news, or filings.
- Do not let the model repeatedly search tools until it finds a favourable result.
- Do not let one unusual session create high confidence merely because it contains many trades.
- Do not call a historically optimized rule validated without holdout and prospective tracking.
- Do not simulate a hypothetical partial exit while pretending all later actual shares still existed.
- Do not treat level proximity alone as a mistake, recommendation, or trade grade.
- Do not introduce long-lived dual-write.
- Do not let private-alpha identity or storage silently become public-production architecture.
- Do not commit real broker files or account identifiers.

---

## 13. Verification Expectations

The first coding PR must run and report:

- dependency installation from lockfile;
- TypeScript typecheck;
- focused v3 lint;
- v3 unit tests;
- exact reference/differential tests;
- deterministic property-based tests with seeds;
- architecture-boundary tests;
- private-data repository guards;
- production build;
- relevant legacy regression tests.

The small/micro-cap synthetic matrix must progressively cover:

- sub-dollar precision;
- reverse split and basis mismatch;
- ticker change and symbol reuse;
- premarket and after-hours;
- halt/resume ambiguity;
- wide/missing/stale quote data;
- stale/disagreeing float;
- catalyst before versus after entry;
- partial and average fills;
- fees;
- prior inventory;
- shorts;
- outlier and clustered-day statistics.

Normal PR CI must not call a live language model.

No QA gate is complete because one unit test passes. Use the acceptance matrices in
both QA reviews and the active Gate 0 plan.

---

## 14. Current Status

Documentation PR #94 contains:

- the v3 master plan;
- the first mandatory QA review;
- the second-pass private-alpha and small/micro-cap QA review;
- the active Gate 0 execution plan;
- the v3 project log;
- corrected root plan;
- corrected plan index;
- this handoff.

Runtime code has not changed. The PR should remain draft until the combined
architecture review is accepted.

---

## 15. Final Working Standard

When evidence is incomplete, the system must become less confident, not more creative.

Every useful answer must be:

- exact where exactness is possible;
- explicit about simulation assumptions;
- linked to underlying evidence;
- honest about data capability;
- conservative about halts, liquidity, float, catalysts, and price basis;
- educational and retrospective rather than a live market instruction;
- fast enough in private alpha to prove whether the product is genuinely useful.
