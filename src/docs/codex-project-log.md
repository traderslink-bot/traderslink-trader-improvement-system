# Codex Project Log

## Purpose

This file is a compact working log for ongoing collaboration in this repo.

It exists to help with:

1. remembering the current practical state of the system
2. tracking major architecture and implementation changes
3. capturing the most important next ideas
4. keeping a concise bridge between the detailed architecture docs and the actual work being done

This file is not meant to replace the deeper layer docs.
It is meant to summarize progress and maintain continuity.

---

## Fast Resume Protocol

If a future session needs to recover context quickly, use this order:

1. Read this file first
2. Read `src/docs/behavior-coverage-audit.md`
3. Read:
   - `src/docs/layer2-pattern-detection/layer2-pattern-detection-overview.md`
   - `src/docs/layer2-pattern-detection/layer2-to-layer3-handoff.md`
   - `src/docs/layer1-raw-data/layer1-handoff-summary.md`
   - `src/docs/trader-feedback-capabilities.md` when the question is about
     what the app can already tell an end user
4. Inspect the current implementation entry points:
   - `src/lib/pattern-input/builders/build-pattern-input.ts`
   - `src/lib/pattern-detection/detect-patterns.ts`
   - `src/lib/pattern-detection/registry/pattern-definitions.ts`
   - `src/lib/pattern-normalization/normalize-detected-patterns.ts`
   - `src/lib/pattern-scoring/builders/build-pattern-scoring-input.ts`
   - `src/lib/pattern-scoring/builders/build-pattern-scoring-result.ts`
   - `src/lib/trade-analysis/run-trade-analysis.ts`
   - `src/lib/behavior-analysis/builders/build-behavior-analysis.ts`
   - `src/lib/coaching/builders/build-trade-coaching-output.ts`
   - `src/lib/coaching/builders/build-trade-feedback-from-scoring.ts`
5. Run the fastest verification commands if behavior changed:
   - `npm test`
   - `npm run verify:levels-system` when shared support/resistance changed
   - `npm run verify:layer2`
   - `npm run verify:layer3`

This is the intended refresh path.

It should be enough to recover:

- what the system is
- what layer boundaries matter
- what is already implemented
- what the current next work likely is

---

## Collaboration Permission

The user explicitly authorized Codex to flag any doc, plan item, or proposed
feature that seems weak, vague, misleading, or not appropriate for the app,
instead of implementing it blindly.

That permission should carry forward in future sessions.

If a future session disagrees with a documented direction, it should say what
it disagrees with and why.

---

## Project Reminder

This app is a trader-improvement engine.

The core goal is to understand:

- what the trader did
- what the market did
- how those two interacted over time
- which decisions improved the trade
- which decisions damaged the trade

The app is built in layers.

### Layer 1
Raw trade timeline and factual derived signals

### Layer 2
Pattern detection from `PatternInput`

### Layer 3
Pattern normalization and prioritization

### Layer 4+
Scoring, coaching, narrative, and later trader-level intelligence

Important project rule:

- lower layers must stay factual
- higher layers must not bypass lower-layer contracts
- Layer 1 does not coach or judge
- Layer 2 detects structure and events
- Layer 3 decides what matters most

---

## Current Resume Point

### 2026-07-17 Trader Intelligence v3 GA0-A1 Independent-Audit Remediation

The active branch is
`agent/trader-intelligence-v3-ga0-a1-containment`, the head branch for draft
PR #102. Independent-audit remediation is in progress and remains limited to
GA0-A1 containment. Do not begin GA0-A2 and do not deploy or merge this branch.

The owner decision is binding: Trader Intelligence v3 is a local-only
application on the owner's computer. The only operational runtime combination
is `private_owner_alpha` + `local_only` + `local_sqlite`. Requests must pass an
exact loopback boundary, unsafe mutations must match an explicitly configured
loopback origin, and optimized local operation must use an explicit durable
real-owner database path outside the repository and OS temporary directory.
Sample mode remains isolated from real-owner persistence. Hosted profiles and
`private_database` are declared future contracts but fail closed today.

The remediation implements AST-backed route and architecture checks,
deny-by-default classification of Trader Intelligence APIs, exact synthetic
fixture hashes, final-tree plus PR-history private-data scanning, private
no-store responses, and explicit request-origin evidence in tests. The current
implementation and detailed resume point are recorded in:

- `plan.md`
- `src/docs/trader-intelligence-v3-project-log.md`
- `src/docs/trader-intelligence-v3-ga0-a1-independent-audit-handoff-2026-07-17.md`

The clean-install verification matrix passed: TypeScript; changed-path lint;
7 focused files / 133 tests; 10 legacy route/UI files / 101 tests; the complete
164-file / 1,523-test suite; both architecture/private-data guards; Layer 2;
Layer 3; the 127-route optimized build; a separate-process durable-SQLite test;
and the optimized Playwright scenario with private/no-store plus merged `Vary`
assertions. No live model, market-data, Vercel, or deployment call was made.

Next resume action: review and stage the complete `origin/main...HEAD` GA0-A1
diff, rerun the staged private-data guard, commit and push the same branch, add
the audit-finding map to draft PR #102, and stop for independent re-audit. Keep
the PR draft and unmerged; GA0-A2 remains prohibited.

### 2026-07-12 Trader Intelligence EODHD Candle/Basis Safety Production Port

Ported the Trader Intelligence EODHD historical candle fix into the canonical
production repo through a clean worktree from `origin/main`.

Scope:

- Updated the vendored `levels-system-v2` dist package from the canonical
  `levels-system` build so production has EODHD/Yahoo historical providers,
  EODHD `1m` -> `5m` aggregation support, newer support/resistance symbol
  context APIs, and trade-window basis diagnostics.
- Updated the Trader Intelligence raw trade timeline bridge so historical EODHD
  `5m` gaps can fall back to EODHD `1m` aggregation without using Yahoo for
  old April trade reviews.
- Hardened the bridge so `basis_adjustment_multiple_likely`, basis mismatch, or
  explicit unaligned basis warnings make the fetched trade-window candles
  unavailable for chart-context feedback. The warning remains visible, but the
  review is built execution-only instead of using split-mismatched candles for
  movement facts, VWAP context, S/R execution relations, or structural context.
- Updated app-side levels-system runtime/provider parsing to allow `eodhd` and
  `yahoo`, with on-demand hydration defaulting to EODHD unless explicitly
  configured otherwise.
- Updated the trade-analysis request contract to accept `ibkr`, `eodhd`,
  `yahoo`, and `stub`.
- Preserved the newer production homepage copy from the root checkout so the
  deploy branch keeps the Whop paid-plan CTA instead of the older beta CTA.

Verification in clean production worktree
`C:\Users\jerac\Documents\TraderLink\traderslink.pro-ti-eodhd-basis-deploy-20260712`:

- `npx vitest run src/lib/raw-trade-timeline/__tests__/levels-system-trade-candle-context.integration.test.ts src/lib/support-resistance/__tests__/levels-system-adapter.test.ts src/lib/trade-analysis/__tests__/trade-analysis-request-contract.test.ts src/lib/trade-analysis/__tests__/run-trade-analysis.test.ts --reporter=dot`
  passed with 29 tests.
- `npx tsc --noEmit --pretty false` passed.

Next production step:

- Run focused lint and `npm run build:webpack`, then deploy from the clean
  worktree with `npx vercel --prod --yes` after build verification passes.

### 2026-06-07 Level Analysis Delivery Trade Detail Level Facts CI Hardening Merged

Gate `journal_level_analysis_delivery_trade_detail_level_facts_ci_hardening`
is complete on `main`.

PR:

- PR #54, "Harden level analysis trade detail CI":
  `https://github.com/traderslink-bot/traderslink-trader-improvement-system/pull/54`
- state: merged
- merged at: `2026-06-07T12:33:29Z`
- base: `main`
- branch:
  `codex/journal-level-analysis-delivery-trade-detail-level-facts-ci-hardening`
- final PR head SHA:
  `3c07442d047548d22586b5f8980170d13965264b`
- merge commit on `main`:
  `94bc2184a47ac6f8065daf4cd61a2167df52e585`

Post-merge `main` checks:

- `CI / test-and-verify` passed on run
  `https://github.com/traderslink-bot/traderslink-trader-improvement-system/actions/runs/27092688012`
- `Level Analysis Trade Detail Facts / Seeded trade detail level facts flow`
  passed on run
  `https://github.com/traderslink-bot/traderslink-trader-improvement-system/actions/runs/27092688018`

Status:

- PR observation and merge are complete
- this gate added CI hardening only; it did not create product, storage, route,
  or ingestion behavior changes
- no CI/test reliability fixes are currently needed
- no journal ingestion rerun was performed
- no levels-system, LevelEngine, storage schema, route behavior, trade
  recommendation/advice/coaching/grading/P/L/giveback/behavior scoring, or raw
  payload UI exposure changes are needed

Current best next step:

- do not add more work to the merged CI-hardening branch
- if continuing inside this journal repo, start a new narrow branch only after
  choosing the next factual LevelAnalysis delivery gate
- if following the prior level-context UI fixture recommendation, the next
  source-quality gate belongs in `levels-system`, not this repo.

### 2026-06-06 Level Analysis Delivery Trade Detail Level Facts CI Observation

Gate `journal_level_analysis_delivery_trade_detail_level_facts_ci_observation`
confirmed the CI hardening branch on GitHub without requiring code changes.

PR:

- opened PR #54:
  `https://github.com/traderslink-bot/traderslink-trader-improvement-system/pull/54`
- base: `main` at `384cfed125fb9456f45151bb71f06acddb6588cf`
- implementation branch:
  `codex/journal-level-analysis-delivery-trade-detail-level-facts-ci-hardening`
- implementation commit observed:
  `4e7276eab617b58cf37c8bcd70cfe612f594d59e`

GitHub checks:

- `Level Analysis Trade Detail Facts / Seeded trade detail level facts flow`
  passed on pull_request run
  `https://github.com/traderslink-bot/traderslink-trader-improvement-system/actions/runs/27080992070`
- `CI / test-and-verify` passed on pull_request run
  `https://github.com/traderslink-bot/traderslink-trader-improvement-system/actions/runs/27080992067`
- after the first project-log update was pushed, both checks re-ran and passed
  again on the doc-only branch head

Result:

- the new path-scoped workflow triggered for the PR and completed successfully
- no CI/test reliability fixes were needed
- no levels-system, LevelEngine, storage schema, route behavior, trade
  recommendation/advice/coaching/grading/P/L/giveback/behavior scoring, or raw
  payload UI exposure changes were made

Current best next step:

- proceed with normal PR review/merge for PR #54, or continue the next
  journal-level analysis roadmap branch after this CI gate is accepted.

### 2026-06-06 Level Analysis Delivery Trade Detail Level Facts CI Hardening

Gate `journal_level_analysis_delivery_trade_detail_level_facts_ci_hardening`
makes the seeded trade-detail level facts browser proof enforceable in CI
without adding product behavior.

Added:

- path-scoped GitHub Actions workflow at
  `.github/workflows/level-analysis-trade-detail-facts.yml`
- CI hardening doc at
  `docs/level-analysis-journal-delivery-trade-detail-level-facts-ci-hardening.md`
- compact artifacts:
  - `docs/examples/level-analysis-journal-delivery-trade-detail-level-facts-ci-hardening.json`
  - `docs/examples/level-analysis-journal-delivery-trade-detail-level-facts-ci-hardening.txt`

Updated:

- `playwright.level-analysis.config.ts` now uses an isolated per-run SQLite
  artifact path, supports `LEVEL_ANALYSIS_E2E_DB_PATH`, emits GitHub reporter
  output in CI, pins the seeded proof to one worker, and uploads failure
  artifacts through the workflow

Behavior:

- the focused `npm run test:e2e:level-analysis` browser proof now runs on pull
  requests and `main` pushes when relevant level-analysis, trade-detail,
  focused E2E, package, or workflow files change
- the workflow installs Playwright Chromium and uploads the focused Playwright
  output plus isolated SQLite artifact only on failure
- the seeded proof remains offline and feature-flag scoped

Boundaries:

- no levels-system or LevelEngine changes
- no storage schema or route behavior changes
- no live candle or broker fetches
- old `LevelAnalysisSnapshot` v1 support remains preserved by existing tests
- raw payloads remain preserved on delivery records but are not exposed in UI
- no recommendations, trade advice, coaching, grading, P/L, giveback, behavior
  scoring, buy/sell/hold decisions, or execution-quality inference

Current best next step:

- completed by
  `journal_level_analysis_delivery_trade_detail_level_facts_ci_observation`.

### 2026-06-06 Level Analysis Delivery Trade Detail Level Facts E2E Seeded Flow

Gate `journal_level_analysis_delivery_trade_detail_level_facts_e2e_seeded_flow`
adds an offline seeded browser proof for the feature-gated trade detail level
facts UI.

Added:

- focused Playwright config at `playwright.level-analysis.config.ts`
- seeded browser spec at
  `tests/e2e/level-analysis-trade-detail-seeded-flow.spec.ts`
- npm script `test:e2e:level-analysis`
- docs at
  `docs/level-analysis-journal-delivery-trade-detail-level-facts-e2e-seeded-flow.md`
- compact artifacts:
  - `docs/examples/level-analysis-journal-delivery-trade-detail-level-facts-e2e-seeded-flow.json`
  - `docs/examples/level-analysis-journal-delivery-trade-detail-level-facts-e2e-seeded-flow.txt`

Behavior:

- seeds an isolated SQLite DB under `artifacts/level-analysis-e2e`
- saves a `DEVS` trade through the existing import dry-run UI
- ingests the compact packaged level-analysis delivery fixture through the
  delivery API
- persists a trade link through the trade-link API
- verifies the trade-detail facts API read model
- opens the saved trade detail page and asserts the availability line and facts
  panel render
- checks the facts panel for raw payload terms and prohibited advice/scoring
  language

Boundaries:

- no live IBKR login or candle fetch is required
- no levels-system or LevelEngine changes
- no storage schema or route behavior changes
- no raw payload or raw payload hash display
- no recommendations, trade advice, coaching, grading, P/L, giveback, behavior
  scoring, or execution-quality inference

Recommended next gate:
`journal_level_analysis_delivery_trade_detail_level_facts_ci_hardening`.

### 2026-06-06 Level Analysis Delivery Trade Detail Level Facts UI Implementation

Gate `journal_level_analysis_delivery_trade_detail_level_facts_ui_implementation`
adds feature-gated trade detail UI rendering for persisted level-analysis facts.

Added:

- `app/intelligence/trades/[tradeId]/trade-detail-level-facts.tsx`
- trade detail page wiring in
  `app/intelligence/trades/[tradeId]/page.tsx`
- UI feature flag
  `LEVEL_ANALYSIS_JOURNAL_TRADE_DETAIL_LEVEL_FACTS_UI_ENABLED`
- focused render tests at
  `src/lib/level-analysis/__tests__/level-analysis-trade-detail-level-facts-ui-implementation.test.ts`
- docs at
  `docs/level-analysis-journal-delivery-trade-detail-level-facts-ui-implementation.md`
- compact artifacts:
  - `docs/examples/level-analysis-journal-delivery-trade-detail-level-facts-ui-implementation.json`
  - `docs/examples/level-analysis-journal-delivery-trade-detail-level-facts-ui-implementation.txt`

Behavior:

- renders only when saved mode is active and both level-facts flags are enabled
- availability line renders in `trade-feedback-scope`
- attached facts panel renders in `trade-supporting-details`
- old `LevelAnalysisSnapshot` v1 attached facts remain renderable
- blocked, disabled, and missing-contract states do not render attached facts
- rendered output excludes raw payload and raw payload hash wording

Boundaries:

- no route handler changes
- no storage migration
- no levels-system or LevelEngine changes
- no auto-resolve on read
- no recommendations, trade advice, coaching, grading, P/L, giveback, behavior
  scoring, or execution-quality inference

Recommended next gate:
`journal_level_analysis_delivery_trade_detail_level_facts_e2e_seeded_flow`.

### 2026-06-06 Level Analysis Delivery Trade Detail Level Facts UI Contract

Gate `journal_level_analysis_delivery_trade_detail_level_facts_ui_contract`
locks the pure UI-facing contract for rendering trade-detail level facts after
the facts route returns `trade_detail_level_facts_read_model_v1`.

Added:

- `src/lib/level-analysis/level-analysis-trade-detail-level-facts-ui-contract.ts`
- compact fixtures under
  `src/lib/level-analysis/__fixtures__/trade-detail-level-facts-ui-contract/`
- focused tests at
  `src/lib/level-analysis/__tests__/level-analysis-trade-detail-level-facts-ui-contract.test.ts`
- docs at
  `docs/level-analysis-journal-delivery-trade-detail-level-facts-ui-contract.md`
- compact artifacts:
  - `docs/examples/level-analysis-journal-delivery-trade-detail-level-facts-ui-contract.json`
  - `docs/examples/level-analysis-journal-delivery-trade-detail-level-facts-ui-contract.txt`

Behavior:

- maps the facts read model to existing trade detail placement targets:
  `trade-feedback-scope` and `trade-supporting-details`
- renders attached packaged delivery and old single-snapshot facts as compact
  sections
- keeps blocked, not-checked, quarantined/unavailable, and disabled states from
  rendering attached facts
- excludes raw payloads and raw payload hashes from the UI contract
- rejects prohibited fields, sections, and wording

Boundaries:

- no production UI wiring
- no route handler changes
- no storage migration
- no levels-system or LevelEngine changes
- no recommendations, trade advice, coaching, grading, P/L, giveback, behavior
  scoring, or execution-quality inference

Recommended next gate:
`journal_level_analysis_delivery_trade_detail_level_facts_ui_implementation`.

### 2026-06-06 Level Analysis Delivery Trade Detail Level Facts UI Design

Gate `journal_level_analysis_delivery_trade_detail_level_facts_ui_design`
defines how the saved trade detail page should display persisted level-analysis
facts after a trusted trade link exists.

Added:

- UI design doc at
  `docs/level-analysis-journal-delivery-trade-detail-level-facts-ui-design.md`
- compact artifacts:
  - `docs/examples/level-analysis-journal-delivery-trade-detail-level-facts-ui-design.json`
  - `docs/examples/level-analysis-journal-delivery-trade-detail-level-facts-ui-design.txt`

Design decision:

- consume only `GET /api/trades/[tradeId]/level-analysis/facts`
- surface availability inside the existing `What This Review Can Use` boundary
- render attached compact facts inside existing `Supporting Evidence`
- keep blocked, unavailable, not-checked, and disabled states as compact status
  rows without attached facts
- keep source payloads, resolver behavior, persistence internals, scoring, and
  coaching out of the UI boundary

Boundaries:

- design-only; no production UI wiring
- no route handler changes
- no storage migration
- no levels-system or LevelEngine changes
- no recommendations, trade advice, coaching, grading, P/L, giveback, behavior
  scoring, or execution-quality inference

Recommended next gate:
`journal_level_analysis_delivery_trade_detail_level_facts_ui_contract`.

### 2026-06-06 Level Analysis Delivery Trade Detail Level Facts Route Implementation

Gate `journal_level_analysis_delivery_trade_detail_level_facts_route_implementation`
adds a display-oriented, feature-gated route for the locked trade-detail
level-facts read model.

Added:

- `GET /api/trades/[tradeId]/level-analysis/facts`
- display feature flag
  `LEVEL_ANALYSIS_JOURNAL_TRADE_DETAIL_LEVEL_FACTS_ENABLED`
- API helper `getTradeDetailLevelFactsForApi`
- route tests for packaged delivery facts, old `LevelAnalysisSnapshot` v1
  facts, no-link state, feature-disabled state, raw-payload exclusion, and
  prohibited advice/evaluation wording
- docs at
  `docs/level-analysis-journal-delivery-trade-detail-level-facts-route-implementation.md`

Behavior:

- the route reads the latest persisted trade link and returns
  `trade_detail_level_facts_read_model_v1`
- the route does not resolve candidates, persist links, expose raw payloads, or
  inspect LevelEngine internals
- packaged review delivery facts keep 15m context as context-only
- old single-snapshot `LevelAnalysisSnapshot` v1 links remain supported

Boundaries:

- no production UI wiring
- no storage migration
- no levels-system changes
- no recommendations, coaching, grading, P/L, giveback, behavior scoring, or
  buy/sell/hold/trade-advice behavior

Recommended next gate:
`journal_level_analysis_delivery_trade_detail_level_facts_ui_design`.

### 2026-06-06 Level Analysis Delivery Trade Detail Level Facts Read Model Contract

Gate `journal_level_analysis_delivery_trade_detail_level_facts_read_model_contract`
locks the facts-only trade-detail read-model contract for persisted
level-analysis trade links.

Added:

- pure contract/helper module at
  `src/lib/level-analysis/level-analysis-trade-detail-level-facts-contract.ts`
- compact fixtures under
  `src/lib/level-analysis/__fixtures__/trade-detail-level-facts-contract`
- focused contract tests at
  `src/lib/level-analysis/__tests__/level-analysis-trade-detail-level-facts-contract.test.ts`
- contract doc at
  `docs/level-analysis-journal-delivery-trade-detail-level-facts-read-model-contract.md`

Contract behavior:

- derives trade-detail availability from the existing saved review queue
  level-facts state
- surfaces compact attached facts only for trusted linked records
- surfaces blocked facts without trusted linked summaries for blocked states
- preserves old `LevelAnalysisSnapshot` v1 compatibility
- enforces context-only 15m status for attached packaged delivery facts
- keeps raw source payloads, route state, audit internals, and journal-owned
  evaluation fields out of trade-detail level-facts state

Boundaries remain:

- no production UI wiring, route handlers, storage migrations, resolver
  behavior, levels-system changes, or LevelEngine behavior changes
- no recommendations, buy/sell/hold language, coaching, grading, P/L,
  giveback, behavior scoring, review-priority changes, or execution-quality
  inference

Current best next step:

- continue with
  `journal_level_analysis_delivery_trade_detail_level_facts_route_implementation`
  to add a feature-gated `/api/trades/[tradeId]/level-analysis/facts` route and
  server read helper against the locked contract.

### 2026-06-06 Level Analysis Delivery Trade Detail Level Facts Read Model Design

Gate `journal_level_analysis_delivery_trade_detail_level_facts_read_model_design`
defines how trade detail should read and present persisted level-analysis facts
after a trade link exists.

Added docs-only artifacts:

- main design doc at
  `docs/level-analysis-journal-delivery-trade-detail-level-facts-read-model-design.md`
- compact JSON artifact at
  `docs/examples/level-analysis-journal-delivery-trade-detail-level-facts-read-model-design.json`
- compact text handoff at
  `docs/examples/level-analysis-journal-delivery-trade-detail-level-facts-read-model-design.txt`

Recommended path:

- add a dedicated `TradeDetailLevelFactsReadModel`
- derive the same factual availability state used by saved review queues
- include compact attached facts only for trusted linked records
- keep blocked/unavailable states factual and compact
- prefer a display route such as
  `GET /api/trades/[tradeId]/level-analysis/facts`
- keep the existing `GET /api/trades/[tradeId]/level-analysis` route as the
  compatibility trade-link route
- gate trade-detail display behind
  `LEVEL_ANALYSIS_JOURNAL_TRADE_DETAIL_LEVEL_FACTS_ENABLED=1`

Boundaries remain:

- no production UI wiring, route handlers, storage migrations, resolver
  behavior, levels-system changes, or LevelEngine behavior changes
- no raw payload exposure, auto-resolve-on-read, recommendations, buy/sell/hold
  language, coaching, grading, P/L, giveback, behavior scoring, or
  execution-quality inference

Current best next step:

- continue with
  `journal_level_analysis_delivery_trade_detail_level_facts_read_model_contract`
  to lock the trade-detail read-model contract and compact fixtures.

### 2026-06-06 Level Analysis Delivery Review Queue Linking Read Model Implementation

Gate `journal_level_analysis_delivery_review_queue_linking_read_model_implementation`
implements the server-side saved review queue join for persisted level-analysis
trade links.

Added:

- display/read-model feature flag helper:
  `LEVEL_ANALYSIS_JOURNAL_REVIEW_QUEUE_LEVEL_FACTS_ENABLED`
- repository batch method:
  `SqliteJournalLevelAnalysisTradeLinkRepository.getLatestTradeLinksForSavedTrades`
- repository-backed level-facts read-model helper at
  `src/lib/level-analysis/level-analysis-review-queue-linking-read-model.ts`
- `levelFacts` on `SavedReviewQueueReadModel` and each `SavedReviewQueueItem`
- focused read-model tests at
  `src/lib/level-analysis/__tests__/level-analysis-review-queue-linking-read-model.test.ts`
- implementation doc at
  `docs/level-analysis-journal-delivery-review-queue-linking-read-model-implementation.md`

Behavior:

- when the display flag is off, queue items receive `feature_disabled` states
  and the trade-link repository is not read
- when the flag is on, the queue batches saved trade IDs and joins to latest
  persisted trade links
- old `LevelAnalysisSnapshot` v1 links and packaged review delivery links both
  remain supported
- level-facts availability does not change queue priority, filters, lanes, or
  ordering
- raw source payloads stay out of queue state
- no production UI, route handler, auto-resolve, storage migration,
  levels-system, or LevelEngine behavior changed

Current best next step:

- continue with
  `journal_level_analysis_delivery_trade_detail_level_facts_read_model_design`
  to design how trade-detail pages should surface attached compact level facts
  inside the existing evidence boundary.

### 2026-06-06 Level Analysis Delivery Review Queue Linking Contract

Gate `journal_level_analysis_delivery_review_queue_linking_contract` locks the
facts-only availability contract for showing persisted level-analysis trade
links in saved review queues and trade-detail workflows.

Added:

- review queue level-facts contract and pure helpers at
  `src/lib/level-analysis/level-analysis-review-queue-linking-contract.ts`
- compact fixtures under
  `src/lib/level-analysis/__fixtures__/review-queue-linking-contract`
- focused contract tests at
  `src/lib/level-analysis/__tests__/level-analysis-review-queue-linking-contract.test.ts`
- contract doc at
  `docs/level-analysis-journal-delivery-review-queue-linking-contract.md`

Contract behavior:

- classifies links as attached, available to attach, blocked by as-of policy,
  unavailable for symbol/provider, quarantined/unsafe, not checked, or feature
  disabled
- builds deterministic batch read-model state by saved trade ID
- keeps raw source payloads out of queue/trade-detail availability state
- preserves old `LevelAnalysisSnapshot` v1 link compatibility
- enforces context-only 15m status for attached packaged delivery facts
- does not expose or alter review priority, scoring, coaching, grading, P/L,
  giveback, behavior scoring, or trade advice

Boundaries remain:

- no production UI wiring, route handlers, storage migrations, resolver
  changes, levels-system changes, or LevelEngine behavior changes

Current best next step:

- continue with
  `journal_level_analysis_delivery_review_queue_linking_read_model_implementation`
  to implement the server-side batch read model behind a display feature flag.

### 2026-06-06 Level Analysis Delivery Review Queue Linking Design

Gate `journal_level_analysis_delivery_review_queue_linking_design` defines how
persisted level-analysis trade links should surface in saved review queues and
trade-detail workflows.

Added docs-only artifacts:

- main design doc at
  `docs/level-analysis-journal-delivery-review-queue-linking-design.md`
- compact JSON artifact at
  `docs/examples/level-analysis-journal-delivery-review-queue-linking-design.json`
- compact text handoff at
  `docs/examples/level-analysis-journal-delivery-review-queue-linking-design.txt`

Recommended path:

- add a dedicated review queue level-facts read model that batches saved trade
  IDs and joins to persisted `JournalLevelAnalysisTradeLinkRecord` rows
- expose compact availability state on each queue item, such as attached,
  blocked by as-of policy, unavailable, quarantined/unsafe, not checked, or
  feature disabled
- show level facts as evidence availability only, not as queue priority,
  scoring, coaching, grading, P/L, giveback, behavior scoring, or trade advice
- avoid auto-attaching links during normal queue reads
- keep raw source payloads on delivery records only

Boundaries remain:

- no code, migrations, route handlers, production UI wiring, levels-system
  changes, or LevelEngine behavior changes
- old `LevelAnalysisSnapshot` v1 compatibility remains part of the design
- current packaged review delivery compatibility remains part of the design

Current best next step:

- continue with
  `journal_level_analysis_delivery_review_queue_linking_contract` to lock the
  queue/trade-detail level-facts availability read model and fixtures before
  wiring review queue or trade-detail UI.

### 2026-06-06 Level Analysis Delivery Journal Linking Persistence Implementation

Gate
`journal_level_analysis_delivery_journal_linking_persistence_implementation`
implements durable storage and feature-gated APIs for attaching accepted
levels-system delivery symbol facts to saved journal trades.

Added:

- SQLite trade-link repository and migration at
  `src/lib/level-analysis/level-analysis-journal-delivery-trade-link-storage.ts`
- trade-link resolver/API service at
  `src/lib/level-analysis/level-analysis-journal-delivery-trade-link-api-service.ts`
- feature-gated route handlers for resolve, persist, trade read, and
  admin/debug link read under `app/api`
- focused storage and route tests under
  `src/lib/level-analysis/__tests__`
- implementation doc at
  `docs/level-analysis-journal-delivery-journal-linking-persistence-implementation.md`

Implemented behavior:

- links attach saved trades to accepted delivery symbol summaries
- resolver uses explicit as-of matching and blocks future facts for historical
  trade boundaries
- duplicate link intents are idempotent by saved trade, delivery, provider, and
  symbol
- blocked attempts can be persisted without trusted linked facts
- old `LevelAnalysisSnapshot` v1 links remain supported
- raw source payloads remain delivery-record-only and are not copied into
  trade-link records or trade-level API responses

Boundaries remain:

- no production UI wiring
- no levels-system repo changes
- no LevelEngine behavior changes
- no recommendations, coaching, grading, P/L, giveback, behavior scoring, or
  buy/sell/hold decisions added

Current best next step:

- continue with `journal_level_analysis_delivery_review_queue_linking_design`
  to decide how factual link availability should appear in review queues or
  trade detail workflows without coupling it to scoring or advice.

### 2026-06-06 Level Analysis Delivery Journal Linking Contract

Gate `journal_level_analysis_delivery_journal_linking_contract` locks the
contract for attaching persisted levels-system delivery symbol facts to saved
journal trades.

Added:

- trade-link contract types and pure helpers at
  `src/lib/level-analysis/level-analysis-journal-delivery-trade-link-contract.ts`
- compact trade-link fixtures under
  `src/lib/level-analysis/__fixtures__/trade-link-contract`
- focused contract tests at
  `src/lib/level-analysis/__tests__/level-analysis-journal-delivery-trade-link-contract.test.ts`
- contract doc at
  `docs/level-analysis-journal-delivery-journal-linking-contract.md`

Contract shape:

- linked records attach one saved trade to one accepted delivery symbol summary
- blocked/unlinked records cannot include trusted linked facts
- link records preserve `rawPayloadHash` but never copy `rawPayload`
- default policy requires exact uppercase symbol matching, accepted delivery
  status, account-allowed provider, no future as-of attachment, and context-only
  15m facts for packaged deliveries
- old `LevelAnalysisSnapshot` v1 summaries remain linkable with
  `not_supplied` 15m status

Boundaries remain:

- no durable link storage, migrations, route handlers, production UI wiring,
  LevelEngine changes, or levels-system changes
- no recommendations, coaching, grading, P/L, giveback, behavior scoring, or
  buy/sell/hold decisions added

Current best next step:

- continue with
  `journal_level_analysis_delivery_journal_linking_persistence_implementation`
  to implement durable trade-link storage and feature-gated APIs against the
  locked contract.

### 2026-06-06 Level Analysis Delivery Journal Linking Design

Gate `journal_level_analysis_delivery_persistence_to_journal_linking_design`
defines how persisted levels-system delivery facts should attach to saved
journal trades after durable delivery storage.

Added docs-only design artifacts:

- main design doc at
  `docs/level-analysis-journal-delivery-persistence-to-journal-linking-design.md`
- compact JSON artifact at
  `docs/examples/level-analysis-journal-delivery-persistence-to-journal-linking-design.json`
- compact text handoff at
  `docs/examples/level-analysis-journal-delivery-persistence-to-journal-linking-design.txt`

Recommended path:

- add explicit `JournalLevelAnalysisTradeLinkRecord` records in a later gate
  rather than relying on latest-symbol lookup at read time
- resolve links by exact symbol, allowed provider, accepted delivery status,
  15m context-only status, and an explicit as-of policy
- default as-of policy should be latest accepted symbol summary at or before
  trade end when trade end is known
- preserve compact linked symbol facts on the link record while keeping raw
  source payloads only on the delivery record

Boundaries remain:

- no code, migrations, route handlers, or production UI wiring added in this
  design gate
- no levels-system repo changes
- no LevelEngine behavior changes
- old `LevelAnalysisSnapshot` v1 remains part of the future link model
- no recommendations, coaching, grading, P/L, giveback, behavior scoring, or
  buy/sell/hold decisions added

Current best next step:

- continue with `journal_level_analysis_delivery_journal_linking_contract` to
  lock link record, resolver, API response, and safety fixtures before adding
  link persistence or review-queue integration.

### 2026-06-06 Level Analysis Delivery Persistence Implementation

Gate `journal_level_analysis_delivery_persistence_implementation` implements
durable journal-side storage and feature-gated API endpoints for validated
levels-system delivery payloads.

Added:

- SQLite repository and migrations at
  `src/lib/level-analysis/level-analysis-journal-delivery-persistence-storage.ts`
- API service at
  `src/lib/level-analysis/level-analysis-journal-delivery-api-service.ts`
- feature-gated route handlers for validate, ingest, latest delivery, latest
  symbol, and admin/debug raw payload retrieval under `app/api`
- focused persistence and API route tests under
  `src/lib/level-analysis/__tests__`
- implementation doc at
  `docs/level-analysis-journal-delivery-persistence-implementation.md`

Implemented behavior:

- stores source-preserved `JournalLevelAnalysisDeliveryRecord` rows with
  `rawPayloadHash`, raw payload JSON, compact summary, safety flags,
  limitations, and quarantine reasons
- stores accepted per-symbol summaries separately for latest symbol lookup
- treats duplicate `rawPayloadHash` ingests as idempotent
- persists quarantined payloads for audit/debug without trusted symbol summaries
- keeps the old `LevelAnalysisSnapshot` v1 ingestion path persistable through
  the same repository/API boundary

Boundaries remain:

- no levels-system repo changes
- no LevelEngine behavior changes
- no production UI wiring
- API routes are disabled unless
  `LEVEL_ANALYSIS_JOURNAL_DELIVERY_API_ENABLED=1`
- admin raw payload reads additionally require
  `LEVEL_ANALYSIS_JOURNAL_DELIVERY_RAW_DEBUG_ENABLED=1`
- no recommendations, coaching, grading, P/L, giveback, behavior scoring, or
  buy/sell/hold decisions added

Current best next step:

- continue with
  `journal_level_analysis_delivery_persistence_to_journal_linking_design` to
  decide how accepted symbol summaries should link to journal entries, trades,
  accounts, or workspaces without wiring UI prematurely.

### 2026-06-06 Level Analysis Delivery Persistence Contract

Gate `journal_level_analysis_delivery_persistence_contract` locks the
journal-side persisted record and API response contract for validated
levels-system delivery payloads.

Added:

- type and helper contract at
  `src/lib/level-analysis/level-analysis-journal-delivery-persistence-contract.ts`
- compact fixtures under
  `src/lib/level-analysis/__fixtures__/persistence-contract/`
- focused tests at
  `src/lib/level-analysis/__tests__/level-analysis-journal-delivery-persistence-contract.test.ts`
- contract doc at
  `docs/level-analysis-journal-delivery-persistence-contract.md`

Contract direction:

- persist a `JournalLevelAnalysisDeliveryRecord` with `rawPayloadHash`,
  source metadata, validation status, preserved `rawPayload`, compact summary,
  per-symbol summaries, safety flags, limitations, and quarantine reasons
- lock API response shapes for validate, ingest, duplicate ingest, quarantine,
  latest delivery, latest symbol, and admin/debug raw payload responses
- keep idempotency keyed by deterministic raw-payload hash

Boundaries remain:

- old `LevelAnalysisSnapshot` v1 ingestion remains supported
- raw source payload preservation remains required
- no levels-system repo changes
- no LevelEngine behavior changes
- no production UI wiring
- no durable persistence implementation yet
- no recommendations, coaching, grading, P/L, giveback, behavior scoring, or
  buy/sell/hold decisions added

Current best next step:

- continue with `journal_level_analysis_delivery_persistence_implementation`
  to implement durable storage and feature-gated API endpoints against the
  locked contract.

### 2026-06-06 Level Analysis Delivery Persistence/API Design

Gate `journal_level_analysis_delivery_persistence_or_api_design` documents the
journal-side persistence and API direction for validated levels-system delivery
payloads.

Added docs-only design artifacts:

- main design doc at
  `docs/level-analysis-journal-delivery-persistence-or-api-design.md`
- compact JSON artifact at
  `docs/examples/level-analysis-journal-delivery-persistence-or-api-design.json`
- compact text handoff at
  `docs/examples/level-analysis-journal-delivery-persistence-or-api-design.txt`

Recommended path:

- persist normalized compact delivery and per-symbol summaries plus the raw
  source payload
- use raw payload hashing for idempotency
- expose validate, ingest, latest delivery, latest symbol, and admin/debug raw
  retrieval API contracts only after the persistence contract is locked
- keep the old `LevelAnalysisSnapshot` v1 ingestion path intact

Boundaries remain:

- no levels-system repo changes
- no LevelEngine behavior changes
- no production UI wiring
- no recommendations, coaching, grading, P/L, giveback, behavior scoring, or
  buy/sell/hold decisions added to level-analysis delivery handling

Current best next step:

- continue with `journal_level_analysis_delivery_persistence_contract` to lock
  deterministic persisted-record and API response fixtures before durable
  storage or production API wiring.

### 2026-06-06 Level Analysis Journal Delivery Ingestion

Gate `journal_level_analysis_delivery_ingestion` adds an app-side ingestion
adapter for both levels-system delivery shapes:

- existing single `LevelAnalysisSnapshot` v1 payloads continue through the
  existing validator/parser path
- new packaged `level-quality-review-process/v1` delivery payloads with
  `entries[]` now validate and derive one compact factual chart-context view per
  entry

Added:

- compact two-symbol packaged delivery fixture at
  `src/lib/level-analysis/__fixtures__/level-analysis-journal-delivery-package-v1.compact.json`
- additive source-preserving adapter at
  `src/lib/level-analysis/level-analysis-journal-delivery-adapter.ts`
- focused ingestion/quarantine/source-preservation tests at
  `src/lib/level-analysis/__tests__/level-analysis-journal-delivery-adapter.test.ts`
- journal-side contract doc at
  `src/docs/level-analysis-journal-delivery-ingestion.md`

Boundaries preserved:

- no levels-system repo changes
- no LevelEngine behavior changes
- no support/resistance tuning
- no production UI/API/persistence wiring for the new package
- no recommendations, coaching, grading, P/L, giveback, behavior scoring, or
  buy/sell/hold decisions in derived views

Current best next step:

- continue with `journal_level_analysis_delivery_persistence_or_api_design` to
  decide how validated source packages should be stored, fetched, or linked to
  journal records.

### 2026-05-26 TradersLink Website Source Of Truth

The active website repo is now:

- `C:\Users\jerac\Documents\TraderLink\traderslink.pro`
- branch: `main`
- upstream: `origin/main`
- source-of-truth alignment merge commit:
  `48f0fb8178ff513e229a16eb7ebd7d446aa40a6a`; later docs-only merge commits
  may exist on `main`
- production deployment: `dpl_H1tehMKTuB3uSxCHHkVk73WabBD8`

Do not use stale sibling folders or deploy-candidate folders as website source
of truth.

Production is currently deployed by Vercel CLI from a clean local `main`
checkout. Git-connected Vercel production deploys from `main` have not been
verified.

Main branch alignment notes:

- PR #10 merged the live website branch into `main`.
- GitHub CI passed on the PR and on the resulting `main` push.
- GitHub ruleset `Protect main` still requires PRs and blocks destructive
  branch updates. Its approving-review count is `0` because the repo currently
  has only the `traderslink-bot` maintainer account.
- The BigTime week-ahead route is live at
  `/small-cap-stocks/week-ahead/potential-catalysts-for-may-26-29`.
- The current shared top nav remains the site shell topbar with only the
  approved `Academy Courses` link after the logo/spacer.

### 2026-05-20 TradersLink Academy Live Product, SEO, And Analytics Pass

The active website/Academy worktree for the current launch pass is:

- `C:\Users\jerac\Documents\TraderLink\trader-intelligence-v2-svg-qa`
- local preview target: `http://localhost:3204`

Do not confuse it with the older local preview that was running on port `3103`.

Current product state:

- Root homepage has been updated to promote TradersLink Academy, use the
  Academy-style logo treatment, include homepage scroll-reveal animation, and
  present the Chart Reading And Market Structure course as available.
- Academy UI has been redesigned toward a lighter Material-inspired surface
  with dark-mode toggle support, updated top navigation, social links, SEO
  metadata, sitemap/robots support, favicon/app icons, and course progress
  presentation.
- Discord auth/progress UX has been expanded so logged-out users are told how
  to save progress, lesson/course/module progress can render in Academy views,
  and failed Discord membership/auth states can point users toward the free
  TradersLink Discord.
- The candle section has moved from the earlier single-page/category-only
  approach toward individual candle behavior lessons grouped by bullish,
  bearish, indecision/neutral, momentum/continuation, and session/gap behavior.
  SVGs for these lessons should remain wordless and focused on visual
  recognition.
- Google Analytics is now wired globally from `app/layout.tsx` through
  `app/google-analytics.tsx` with measurement ID `G-KKDBE5323S`. It sends App
  Router page-view events, avoids duplicate automatic page views, and keeps
  local/dev traffic out of GA unless `NEXT_PUBLIC_ENABLE_GA_IN_DEV=true` is set.
- Academy progress storage now supports Neon Postgres for live/preview
  deployments through `DATABASE_URL` or `ACADEMY_DATABASE_URL`, while preserving
  the local SQLite fallback for development. `DATABASE_URL` has been added as a
  sensitive Vercel env var for Production and Preview, and a hosted Neon smoke
  test passed against the configured database.

Recent verification:

- `npx --no-install tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx --no-install vitest run src/lib/academy/__tests__/academy-content.test.ts`
  passed after the Neon progress-store adapter work.
- `npm run build:webpack` passed after the Neon progress-store adapter work.
- Hosted Neon Academy progress smoke test passed: create user, create session,
  complete lesson, remove lesson completion, and revoke session.
- The production build includes the Google Analytics loader/config for
  `G-KKDBE5323S`.
- The webpack Vercel build still reports an existing warning from
  `src/lib/support-resistance/levels-system-runtime-options.ts` about a dynamic
  dependency expression; it is unrelated to the Academy storage change.

Best next step for this branch:

- Run a final browser QA on the active `3204` preview for `/`, `/academy`,
  `/academy/courses/trading-foundations`, and
  `/academy/courses/chart-reading-market-structure`, then commit only the
  intended homepage, Academy, SEO, auth/progress, analytics, icon, and content
  changes once the user approves the visible state.

### 2026-05-18 TradersLink Academy Course 1 Launch Pass

Course 1, `Trading Foundations`, is now being brought to the same launch-ready
standard as Course 2 while staying intentionally smaller:

- structure remains a 12-lesson guided core path with no deep-dive library
- Course 1 registry copy now has audience, outcome, display copy, ready visual
  status, and a core-path progress model
- four Course 1 SVGs were added for the course map, stock-trade mechanics,
  session/liquidity context, and risk-plan/review loop
- cross-listed risk/review lessons now render in the launched Course 1 context
  instead of defaulting to their future canonical course navigation
- Course 1 and Course 2 are both in the Academy launch course set
- validation completed:
  - `npm run validate:academy-registry`
  - `npx vitest run src/lib/academy/__tests__/academy-content.test.ts`

Best next step for Academy work:

- do browser/render QA on `/academy/courses/trading-foundations/` and the
  Course 1 lesson flow before marking the course fully ready for user-facing
  release notes or PR handoff.

### Fresh Chat Handoff Added

Current fresh-chat handoff:

- `src/docs/trader-intelligence-next-chat-handoff-2026-05-05.md`

Use it first in a new chat. It supersedes the stale next-step bullets in older
handoff sections by summarizing:

- current first-100 private IBKR baseline
- `levels-system` historical backfill/as-of dependency
- new market-data readiness and comparison scripts
- exact rerun commands after `levels-system` changes
- verification commands from the latest work

The best next step is still to wait for or inspect the sibling `levels-system`
historical as-of/backfill work, then rerun the first-100 calibration in this
repo and compare against the saved baseline.

### 2026-05-04 Historical Intraday Candle Dependency Audit

User flagged an important data-boundary risk:

- this app analyzes imported completed trades, often from historical dates
- the related levels/watchlist app is optimized around current watchlist/live
  monitoring, with daily/4h support-resistance context and limited recent
  intraday candles
- this app cannot assume the watchlist app has retained the 1m/5m candle window
  for the actual historical execution period

Code audit result:

- the app already has a shared-engine trade-window candle path via
  `runTradeAnalysisFromLevelsSystemCandles(...)`
- that path calls `levels-system` `buildTradeAnalysisCandleContext(...)`
- `levels-system` defaults the trade-window timeframe to `1m` and supports
  explicit `1m` or `5m` windows around the imported execution timestamps
- support/resistance still uses the shared `daily` / `4h` / `5m` context with
  default lookbacks of `520`, `180`, and `120` bars
- batch/API debug analysis uses the trade-window candle path, not the older
  provided-candle path
- important correction: this repo still contains a legacy local
  `buildSupportResistanceContext(...)` implementation that builds pivots,
  local support/resistance ladders, VWAP, and EMA from supplied candles
- even some shared-engine paths currently call `createRawTradeTimeline(...)`
  first, which means local structure can be computed transiently before shared
  `levels-system` support/resistance, VWAP, and EMA overwrite it

Important risk that remains:

- provider availability for months-old `1m` / `5m` candles is not guaranteed
- the product workflow must not rely on watchlist-retained intraday candles
- the desired product architecture is that support/resistance, VWAP, EMA, and
  related candle structure are owned by `levels-system`, not this app
- this app should map and consume shared-engine context, or clearly mark an
  old path as legacy/test-only, rather than building those levels locally in
  production analysis
- imported-trade analysis should set or derive an analysis-time
  `asOfTimestamp` from the trade/session, not accidentally use current-time
  candles for old trades
- if `1m` is unavailable, fallback behavior should be explicit and truthful
  rather than silently overclaiming candle-confirmed feedback

Best next step:

- before or alongside the `/import-dry-run` analysis panel work, add a small
  product contract/check around historical intraday candle readiness: confirm
  `1m` preferred, `5m` fallback, provider diagnostics surfaced, and no
  support/resistance/VWAP/EMA claims are shown when historical trade-window
  candles are missing or stale.
- add a follow-up cleanup task to stop production/shared-engine flows from
  invoking the local legacy support/resistance builder at all; keep any local
  builder only as explicit legacy/test comparison code if it is still useful.

Follow-up implementation completed:

- `createRawTradeTimeline(...)` no longer calls the local
  `buildSupportResistanceContext(...)`
- plain raw timeline analysis no longer attaches locally built
  support/resistance, VWAP, EMA, gap structure, or execution-level relations
- app-facing shared analysis still attaches those fields only through
  `levels-system`
- the old `legacy_local` mode was renamed to `provided_candles_only` to avoid
  implying this app has an approved local support/resistance mode
- remaining local support/resistance builder files are not called by app/source
  analysis paths; they remain only as old module/test code unless removed in a
  later cleanup

Verification:

- focused raw timeline / shared levels / summary tests passed
- `npm run verify:levels-system` passed with `21` files / `71` tests
- `npx tsc --noEmit --pretty false` passed
- `npm test` passed with `87` files / `797` tests

Later same-night alignment with the levels-system agent:

- `levels-system` now exposes the recommended public default boundary:
  `buildDefaultTradeAnalysisCandleContext(...)`
- the shared candle integration in this app now prefers that default builder
  when no explicit test/custom fetch service is supplied
- custom test fetch services still use the direct
  `buildTradeAnalysisCandleContext(...)` path so deterministic fixtures remain
  possible
- raw timeline dynamic levels for the shared trade-window path now map from
  `context.tradeWindow.dynamicLevels`, keeping VWAP/EMA tied to the actual
  fetched `1m`/`5m` trade window
- tests now assert `requestedTimeframe`, `fallbackUsed`, trade-window dynamic
  levels, and neutral `tradeWindowFacts`

Additional implementation completed:

- `createRawTradeTimelineWithLevelsSystemCandles(...)` now explicitly derives
  `tradeStartTimestamp` and `tradeEndTimestamp` from imported executions when
  possible
- the same bridge derives a bounded `asOfTimestamp` from
  `tradeEndTimestamp + postTradeMinutes + paddingMinutes` when the caller does
  not provide one, so historical trade-window analysis does not drift into
  future candles
- every imported execution/fill continues to be forwarded to `levels-system`
  as `{ timestamp, price, quantity, side }`
- `RawTradeTimelineBuildResult` now exposes neutral
  `levelsSystemTradeWindowFacts` and `levelsSystemExecutionRelations`
- `PatternInput` consumes matching levels-system trade-window MFE/MAE facts
  with unit conversion while preserving local P/L, sizing, review, and behavior
  responsibilities
- tests cover all-fill forwarding, bounded timestamp/as-of behavior, `1m`
  preference with `5m` fallback diagnostics, and PatternInput use of the
  neutral trade-window facts

Verification:

- `npx tsc --noEmit --pretty false` passed
- focused trade-window / pattern input / summary tests passed
- `npm run verify:levels-system` passed with `21` files / `73` tests
- `npm test` passed with `87` files / `799` tests

2026-05-04 market-context direction tightened:

- Product direction changed to avoid VWAP/EMA-driven trader feedback for now
- `PatternInput` now neutralizes VWAP/EMA relation fields even when
  `levels-system` returns dynamic benchmark data
- feedback-facing support/resistance levels mapped from `levels-system` are
  filtered to levels with `daily` or `4h` in `timeframeSources`
- `1m`/`5m` historical candles remain important for trade-window measurements
  such as MFE/MAE, high/low during hold, and bounded post-exit continuation
- lower-timeframe support/resistance is deferred until a later tactical-context
  layer
- levels-system handoff docs `73` and `74` were updated so the sibling project
  knows the current contract: daily/4h levels for feedback, no VWAP/EMA
  feedback, 1m/5m only for movement facts

2026-05-04 execution-intelligence project review completed:

- created
  `src/docs/trader-execution-intelligence-project-review-2026-05-04.md`
- clarified the competitive product target: explain execution decisions in
  market/trade context, not just journal trades and show reports
- ran deterministic trade-analysis debug simulations through the current
  levels-system trade-window path
- generated artifacts under `artifacts/trade-analysis-current-review*`
- simulations completed for sample, long/short winners and losers, partial
  exits, open-position warning, rapid-fire execution cluster, inconsistent
  sizing, and repeated-add scenarios
- sample simulation produced `4` support / `2` resistance levels and `22`
  detected / `22` normalized patterns
- repeated-adds simulation produced `3` support / `8` resistance levels and
  `27` detected / `27` normalized patterns
- conclusion: the analysis engine is ready enough for the next product step;
  the main gap is surfacing prototype analysis inside `/import-dry-run`
- next implementation step remains
  `buildCsvDryRunPrototypeAnalysisPanel(...)`, then wire it into
  `/import-dry-run`

2026-05-04 first trade decision review bridge added:

- added `src/lib/trade-analysis/review/build-trade-decision-review.ts`
- `TradeAnalysisSummary` now includes `decisionReview`
- `decisionReview` converts normalized patterns into pattern scoring, behavior
  analysis, coaching output, and concrete decision insights
- current insight groups are entry, scaling, exit, market context, and
  trade-window movement
- review output explicitly records daily/4h-only level feedback and
  `vwapEmaFeedbackUsed: false`
- debug dashboard markdown now includes a Decision Review section
- CLI debug output now prints coaching focus and top insight
- repeated-adds simulation now surfaces a fix-first coaching behavior and
  insights such as chase/late-extension risk and adds after much of the move was
  already used
- `levels-system` now returns daily/4h-specific benchmark IDs
  (`nearest_daily_4h_support`, `nearest_daily_4h_resistance`) and the local
  contract test was updated to match
- verification passed:
  - `npx tsc --noEmit --pretty false`
  - `npm run verify:levels-system` with `21` files / `74` tests
  - `npm test` with `87` files / `800` tests

### 2026-05-03 Functional Readiness User Workflow Plan Created

The next planned branch is documented in:

- `src/docs/trader-functional-readiness-user-workflow-plan.md`

The short read-first handoff for a fresh chat is:

- `src/docs/trader-functional-readiness-next-handoff.md`

What changed:

- created a detailed next-branch plan for wiring the completed functional
  readiness engine into the user-facing `/import-dry-run` workflow
- created a handoff note summarizing completed work, verification, boundaries,
  files to inspect next, and GitHub status
- updated README roadmap/handoff links so the new plan and handoff are
  discoverable
- no implementation work from the new plan has started yet
- no GitHub push or PR was created because the workspace has many existing
  modified/untracked files and this request only required docs/handoff prep

Best next step:

- in the next chat, read
  `src/docs/trader-functional-readiness-next-handoff.md`, then implement Step 2
  from `src/docs/trader-functional-readiness-user-workflow-plan.md`: add the
  `/import-dry-run` prototype analysis panel view model and focused unit tests.

### 2026-05-03 Trader Functional Product Readiness Complete

The functional readiness branch is documented in:

- `src/docs/trader-functional-product-readiness-plan.md`

What changed:

- added `src/lib/trader-analytics/product/functional-readiness.ts`
- added import confidence states: `empty`, `blocked`, `needs_review`,
  `ready_for_analysis`, `prototype_saved`, and `rejected`
- added a prototype import-to-saved-analysis bridge that converts accepted CSV
  dry-run grouped trades into execution feedback summaries and an in-memory
  trader analytics report
- added deeper execution-only autopsy observations with evidence refs for
  first mistake/strength, best/worst add, best/worst reduction, giveback review,
  and position escalation
- added deterministic synthetic trader personas for overtrading, clean scalping,
  revenge-like re-entry pressure, poor exits, strong risk management, and
  inconsistent sizing
- added deterministic execution math fuzz scenarios for long/short winners and
  losers, partial exits, open leftovers, invalid exit-before-entry, rapid-fire
  fills, and rejected CSV rows
- added truth-source auditing so strong product claims must cite trade,
  execution, import row, feedback point, state, or metric evidence
- added a functional readiness dashboard and real-data calibration harness that
  stay prototype-only and avoid live broker, candle, or market-structure calls
- updated `/platform-readiness` with functional loop, behavior test harness,
  calibration, and live-readiness blocker panels
- no production persistence, auth, billing, export/download, candle fetching,
  support/resistance generation, VWAP/EMA, or market-structure scoring was added

Verification completed so far:

- `npx vitest run src/lib/trader-analytics/__tests__/trader-functional-product-readiness.test.ts`
- `npx vitest run src/lib/trader-analytics/__tests__/trader-functional-product-readiness.test.ts src/lib/trader-analytics/__tests__/platform-ready-feature-module.test.ts`
- `npm run test:e2e`
- `npx tsc --noEmit --pretty false`
- `npm run lint` with 4 existing warnings and 0 errors
- `npm run build`
- `npm run verify:all`
- `npm audit`

Best next step:

- use the new readiness dashboard and calibration harness when anonymized real
  broker CSVs become available, then inspect any false positives in the
  synthetic persona and execution-autopsy outputs.

### 2026-05-03 Trader Actual App QA Complete

The actual-app QA and visual smoke branch is documented in:

- `src/docs/trader-actual-app-qa-and-visual-regression-plan.md`

What changed:

- added `@axe-core/playwright` as the browser accessibility smoke dependency
- added `tests/e2e/app-actual-qa.spec.ts`
- added screenshot-backed visual smoke for `/`, `/first-run`,
  `/import-dry-run`, `/analytics`, `/review`, `/progress`, and
  `/trades/trade-rapid-fire`
- added critical/serious axe accessibility scans for core rough-product routes
- added deterministic import workflow stress coverage for broker switching,
  unknown mapping repair, setup/playbook tagging, grouping decision state,
  feedback reviewed state, and Schwab review-state import
- added metric-to-evidence tests proving analytics, progress, and guided review
  links open source trade detail pages with execution replay, trade quality, and
  decision autopsy evidence
- added mobile interaction coverage for rejected-row repair and trade autopsy
  readability, not just static route rendering
- added product truthfulness guards across core route visits and import workflow
  state
- added CSV torture coverage for duplicate executions, reversed timestamps,
  partial fills, short trades, open positions, mixed symbols, fees/commissions,
  weird date formats, extra unknown columns, and small share sizes
- added a rough product walkthrough from home to first-run, import repair,
  analytics, trade detail, guided review, and progress
- improved dark helper-text contrast through `app/globals.css`
- added explicit accessible names to import dry-run controls, mapping fields,
  row repair inputs, grouping/setup selects, and analytics filter selects
- hardened browser failure traps for Firefox favicon abort noise
- no candle fetching, support/resistance building, VWAP/EMA work, or market
  structure work was added in this app

Files changed:

- `tests/e2e/app-actual-qa.spec.ts`
- `app/globals.css`
- `app/import-dry-run/import-dry-run-client.tsx`
- `app/analytics/analytics-client.tsx`
- `app/page.tsx`
- `tests/e2e/app-first-user-hardening.spec.ts`
- `src/docs/trader-actual-app-qa-and-visual-regression-plan.md`
- `README.md`
- `src/docs/codex-project-log.md`
- `package.json`
- `package-lock.json`

Verification completed:

- `npx playwright test tests/e2e/app-actual-qa.spec.ts --project=chromium-desktop`
  passed with 7 tests and 1 expected mobile-scope skip
- `npx playwright test tests/e2e/app-actual-qa.spec.ts --project=chromium-mobile`
  passed with 2 tests and 6 expected desktop-scope skips
- `npx playwright test tests/e2e/app-first-user-hardening.spec.ts --project=firefox-smoke`
  passed with 1 Firefox smoke test and 7 expected skips
- `npm run test:e2e` passed with 48 Playwright browser tests and 71 expected
  viewport/project-scope skips
- `npx tsc --noEmit` passed
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings
- `npm run build` passed
- `npm run verify:all` passed with 86 Vitest files / 787 tests plus
  levels-system, Layer 2, and Layer 3 checkpoints
- `npm audit` passed with 0 vulnerabilities

Best next step:

- keep the new actual-app QA suite as the browser safety net while building new
  product surfaces; the next truly new product branch should wait for either
  real saved import batches or a deliberate UI/design-system pass

### 2026-05-03 Trader First-User Hardening Complete

The first-user and app-hardening branch is documented in:

- `src/docs/trader-first-user-and-hardening-test-plan.md`

What changed:

- added `/first-run` as the honest no-saved-trades starting point for a future
  user who has no saved imports, no analytics report, no review history, and no
  connected broker
- linked `/first-run` from the home workspace
- added `tests/e2e/app-first-user-hardening.spec.ts`
- added a narrow Playwright `firefox-smoke` project for the first-run route set
- proved a first user can go from `/first-run` to `/import-dry-run`, upload a
  synthetic CSV, repair a rejected row, and reach execution-only feedback
  preview without saved persistence
- added no-trades boundary coverage and safe missing-trade route behavior
- added a home internal-link crawler that fails on app error copy, 404 copy,
  HTTP `>= 400`, browser console errors, page errors, and failed requests
- added accessibility smoke for import controls, mapping controls, analytics
  filters, and keyboard focus through key import controls
- added local performance smoke for `/`, `/first-run`, `/import-dry-run`,
  `/analytics`, and `/trades/trade-rapid-fire`
- added CSV abuse coverage for blank, header-only, wrong-delimiter,
  duplicated-header, bad numeric, large synthetic, and mixed stock/options-like
  CSV inputs
- added truthfulness guards across core product routes for export/download,
  production persistence, auth/billing, connected-broker, and market-structure
  scoring overclaims
- no candle fetching, support/resistance building, VWAP/EMA work, or market
  structure work was added in this app

Files changed:

- `app/first-run/page.tsx`
- `app/page.tsx`
- `playwright.config.ts`
- `tests/e2e/app-first-user-hardening.spec.ts`
- `src/docs/trader-first-user-and-hardening-test-plan.md`
- `README.md`
- `src/docs/codex-project-log.md`

Verification completed:

- `npx playwright test tests/e2e/app-first-user-hardening.spec.ts --project=chromium-desktop`
  passed with 7 tests and 1 expected skip
- `npx playwright test tests/e2e/app-first-user-hardening.spec.ts --project=firefox-smoke`
  passed with 1 Firefox smoke test and 7 expected skips
- `npm run test:e2e` passed with 39 Playwright browser tests and 56 expected
  viewport/project-scope skips
- `npx tsc --noEmit` passed
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings
- `npm run build` passed and includes `/first-run`
- `npm run verify:all` passed with 86 Vitest files / 787 tests plus
  levels-system, Layer 2, and Layer 3 checkpoints
- `npm audit` passed with 0 vulnerabilities

Best next step:

- keep using the browser suites as the product safety net, then add the next
  high-value test around real saved import batches once persistence exists; no
  levels-system update is needed from this branch

### 2026-05-03 Trader App Acceptance Testing Complete

The app acceptance testing branch is documented in:

- `src/docs/trader-app-acceptance-testing-plan.md`

What changed:

- added `tests/e2e/app-acceptance.spec.ts`
- added stable acceptance-test hooks to:
  - `app/analytics/analytics-client.tsx`
  - `app/import-dry-run/import-dry-run-client.tsx`
  - `app/trades/[tradeId]/page.tsx`
  - `app/progress/page.tsx`
  - `app/review/page.tsx`
- expanded browser automation from route/panel checks into actual user-flow
  acceptance tests
- all sample saved trades now open through `/trades/{tradeId}` and prove the
  trade autopsy contract: execution replay, replay steps, review points,
  trade quality, and decision autopsy
- `/analytics` now has tested interactions for symbol/outcome filters,
  drill-down selection, filtered row counts, excluded-row removal, and opening
  filtered trade evidence
- `/import-dry-run` now has tested user recovery for unknown CSV headers via
  explicit column mappings and rejected row repair via editable cells
- `/progress` now proves execution quality trendline links open source trade
  reviews
- `/review` now proves related trade links open source trade reviews without
  persistence overclaims
- mobile Playwright now loops every sample trade detail page and guards
  page-level horizontal overflow
- product-boundary acceptance guards block export/download, debug JSON,
  production persistence, auth/billing, and market-context scoring overclaims
  on core rough product pages
- no candle fetching, support/resistance building, VWAP/EMA work, or market
  structure work was added in this app

Verification completed:

- `npm run test:e2e` passed with 31 Playwright browser tests and 32 intentional
  viewport-scope skips
- `npx tsc --noEmit` passed
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings
- `npm run verify:all` passed with 86 Vitest files / 787 tests plus
  levels-system, Layer 2, and Layer 3 checkpoints
- `npm audit` passed with 0 vulnerabilities

Best next step:

- keep adding acceptance tests only when a flow is stable enough to behave like
  a product contract; the highest-value next test target would be an empty-state
  / first-user experience once the app has a no-trades fixture

### 2026-05-03 Trader App Feature Regression QA Complete

The app-wide browser regression branch is documented in:

- `src/docs/trader-app-feature-regression-qa-plan.md`

What changed:

- added `tests/e2e/app-feature-regression.spec.ts`
- expanded Playwright from the single `/import-dry-run` route into a broader
  rough-product regression suite
- added smoke coverage for `/`, `/analytics`, `/imports`, `/import-dry-run`,
  `/review`, `/progress`, `/trades/trade-rapid-fire`, `/coach`,
  `/session-recap`, `/import-health`, `/import-trials`, `/repair-wizard`,
  `/review-cockpit`, `/calibration`, `/compare-trades`, `/onboarding`,
  `/account`, and `/platform-readiness`
- added browser failure traps for console errors, uncaught page errors, failed
  requests, and HTTP responses at status `>= 400`
- added representative broker CSV UI import coverage for IBKR, Webull,
  Robinhood, Moomoo, Schwab, and generic CSV
- added import repair coverage for missing quantity, bad timestamp, unknown
  headers, cancelled/skipped rows, open-position leftovers, duplicate-like
  fills, and low-confidence mappings
- added product-surface checks for analytics, trade detail autopsy, guided
  review, progress, behavior visuals, rule surfaces, and daily coach reporting
- added mobile route overflow coverage for `/import-dry-run`, `/analytics`,
  `/trades/trade-rapid-fire`, `/review`, and `/progress`
- added screenshot smoke attachments for the core product routes across
  desktop, tablet, and mobile projects
- added market-context overclaim guards so candle/market-structure context
  remains observational and cannot be presented as import QA, execution-only
  scoring, rule pass/fail, or final coaching evidence
- added an end-to-end demo path from home to CSV dry run, row repair,
  feedback preview, analytics, trade detail, review, and progress
- fixed a real `/analytics` mobile horizontal overflow by allowing the trade
  table grid/card containers to shrink and scroll internally

Files changed:

- `tests/e2e/app-feature-regression.spec.ts`
- `app/analytics/analytics-client.tsx`
- `src/docs/trader-app-feature-regression-qa-plan.md`
- `README.md`
- `src/docs/codex-project-log.md`

Verification completed:

- `npm run test:e2e` passed with 24 Playwright browser tests and 18 intentional
  viewport-scope skips
- `npx tsc --noEmit` passed
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings
- `npm run verify:all` passed with 86 Vitest files / 787 tests plus
  levels-system, Layer 2, and Layer 3 checkpoints
- `npm audit` passed with 0 vulnerabilities

Best next step:

- keep using the new Playwright suite as the product safety net, then add the
  next high-value browser journey only when a new route or flow becomes stable
  enough to warrant app-level regression coverage

### 2026-05-03 Trader Import Playwright E2E Harness Complete

The browser-backed import QA branch is documented in:

- `src/docs/trader-import-automated-qa-harness-plan.md`

What changed:

- added Playwright as the real browser E2E layer for `/import-dry-run`
- installed Chromium for local Playwright runs
- added `playwright.config.ts`
- added `tests/e2e/import-dry-run.spec.ts`
- added stable E2E hooks to the dry-run import UI controls that the tests touch
- updated the visual regression contract from screenshot-ready only to
  `playwright_chromium`
- changed `npm run test:e2e` to build the app and run Playwright against
  `next start` on isolated port `3100`, avoiding stale `next dev` state
- verified the route in Chromium desktop, tablet, and mobile viewports
- covered required product panels, banned unsafe surface copy, local CSV file
  input, rejected-row repair, setup/playbook tagging, feedback reviewed state,
  screenshot smoke, and page-level horizontal overflow
- fixed a duplicate React key warning in the import confidence gate reason list
  surfaced by the browser run
- kept the test branch execution/import-only; no candles, support/resistance,
  VWAP/EMA, market structure, broker credentials, persistence, auth, billing,
  export, or download flow was added

New implementation:

- `playwright.config.ts`
- `tests/e2e/import-dry-run.spec.ts`
- `app/import-dry-run/import-dry-run-client.tsx`
- `src/lib/trader-analytics/product/csv-dry-run-automated-qa.ts`
- `src/lib/trader-analytics/__tests__/trader-import-automated-qa-harness.test.ts`
- `package.json`
- `package-lock.json`

Verification completed:

- `npm run test:e2e` passed with 9 Chromium browser tests across desktop,
  tablet, and mobile
- `npx vitest run src/lib/trader-analytics/__tests__/trader-import-automated-qa-harness.test.ts`
  passed with 1 file / 8 tests
- `npx vitest run src/lib/trader-analytics/__tests__` passed with 18 files /
  126 tests
- `npx tsc --noEmit` passed
- `npm run verify:all` passed with 86 files / 787 tests plus shared-engine,
  Layer 2, and Layer 3 checkpoints
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings
- `npm run build` passed as part of `npm run test:e2e`

Follow-up dependency audit update:

- `npm audit` originally reported 2 moderate findings from `postcss` under
  Next
- `npm audit fix` could not safely clear the remaining finding and recommended
  `npm audit fix --force`, which would downgrade `next` to `9.3.3`
- instead, the repo now uses root `overrides.postcss: 8.5.13`
- `next` remains on `16.2.3`
- `npm audit --json` now reports 0 vulnerabilities
- post-override verification passed:
  - `npm run test:e2e`
  - `npx tsc --noEmit`
  - `npm run lint`
  - `npm run verify:all`

Best next step:

- add browser coverage for one more high-value end-user path only when the route
  is stable enough to justify it; likely candidates are `/analytics`,
  `/progress`, or `/trades/[tradeId]`

### 2026-05-03 Trader Import Automated QA Harness Complete

The automated import QA branch is documented in:

- `src/docs/trader-import-automated-qa-harness-plan.md`

What changed:

- added a deterministic automated QA harness for `/import-dry-run`:
  `src/lib/trader-analytics/product/csv-dry-run-automated-qa.ts`
- generated CSV mutation cases from fixture-style inputs for missing symbols,
  missing prices, renamed headers, blank rows, account activity rows, cancelled
  orders, duplicated fills, open positions, and weird timestamps
- added a broker regression matrix for IBKR, Webull, Robinhood, Moomoo, Schwab,
  and generic CSV
- added repair impact simulation around `applyCsvDryRunCellEdit`
- added an end-to-end dry-run simulation for mapping repair, row repair, setup
  tagging, decision capture, and feedback preview
- added no-market-context guard checks proving import QA stays execution/import
  only
- added route smoke and banned-surface contracts for `/import-dry-run`
- added screenshot-ready desktop/tablet/mobile visual QA targets without adding
  a new browser test dependency
- kept `levels-system` untouched and kept all import QA independent from candle,
  support/resistance, VWAP/EMA, and market-structure logic

New implementation:

- `src/lib/trader-analytics/product/csv-dry-run-automated-qa.ts`
- `src/lib/trader-analytics/__tests__/trader-import-automated-qa-harness.test.ts`
- `src/lib/trader-analytics/index.ts`
- `src/docs/trader-import-automated-qa-harness-plan.md`

Verification completed:

- focused automated QA harness test passed with 1 file / 8 tests
- `npx vitest run src/lib/trader-analytics/__tests__` passed with 18 files /
  126 tests
- `npx tsc --noEmit` passed
- `npm run verify:all` passed with 86 files / 787 tests plus shared-engine,
  Layer 2, and Layer 3 checkpoints
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings
- `npm run build` passed and produced `/import-dry-run`
- existing dev server smoke passed for
  `http://localhost:3000/import-dry-run`

Best next step:

- when a browser test dependency is intentionally added, connect
  `buildCsvDryRunVisualRegressionContract()` to real desktop/tablet/mobile
  screenshots; until then, use the mutation matrix and broker regression
  harness as the main automated safety net for import changes

### 2026-05-03 Trader Import Intelligence Workflow Expansion Complete

The active import dry-run intelligence branch is documented in:

- `src/docs/trader-import-intelligence-workflow-expansion-plan.md`

What changed:

- expanded `/import-dry-run` with nine new product workflow panels:
  before/after repair impact, P/L reconciliation assistant, readiness score
  breakdown, post-import review queue preview, feedback preview comparison,
  broker mapping learning console, import session summary, execution anomaly
  detector, and setup/playbook tagging
- added deterministic dry-run view-model contracts for all nine panels through
  `CsvDryRunImportExperience`
- added optional repair impact baseline support so local row edits can compare
  against the previous parser state
- added optional setup tag selections so future playbook labels can be captured
  in client state without persistence
- kept all conclusions execution/import-only; no candles, support/resistance,
  VWAP/EMA, or market structure are read locally, and setup tags are explicitly
  not chart-validated
- kept the no-persistence posture: no auth, billing, production storage, raw
  JSON panel, or data-removal product surface was added
- kept `levels-system` untouched

New implementation:

- `src/lib/trader-analytics/product/csv-dry-run-workflow.ts`
- `src/lib/trader-analytics/product/types.ts`
- `src/lib/trader-analytics/index.ts`
- `app/import-dry-run/import-dry-run-client.tsx`
- `src/lib/trader-analytics/__tests__/trader-import-intelligence-workflow-expansion.test.ts`
- `src/docs/trader-import-intelligence-workflow-expansion-plan.md`

Verification completed:

- focused dry-run intelligence tests passed with 3 files / 22 tests
- `npx vitest run src/lib/trader-analytics/__tests__` passed with 17 files /
  118 tests
- `npx tsc --noEmit` passed
- `npm run verify:all` passed with 85 files / 779 tests plus shared-engine,
  Layer 2, and Layer 3 checkpoints
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings
- `npm run build` passed and produced `/import-dry-run`
- existing dev server smoke passed for
  `http://localhost:3000/import-dry-run`, including all nine new workflow
  panels

Best next step:

- when real anonymized CSVs exist, use the readiness breakdown, anomaly
  detector, mapping learning console, and review queue preview to decide which
  broker mappings and repair outcomes should be promoted into production
  persistence first

### 2026-05-03 Trader Import Repair And Feedback Preview Complete

The active import dry-run deepening branch is documented in:

- `src/docs/trader-import-repair-feedback-preview-plan.md`

What changed:

- extended `/import-dry-run` from a basic preview into a fuller first-import
  workflow surface: editable row repair table, grouping decision controls,
  execution-only feedback preview, first grouped-trade replay preview, broker
  help, matched import error library, privacy notice, mobile QA notes, and
  future decision capture model
- added `applyCsvDryRunCellEdit` so row-level fixes update the current CSV text
  locally and immediately re-run the existing broker parser
- added dry-run execution feedback previews from grouped `UserTradeAnalysisRequest`
  objects without saving trades, fetching candles, or using market structure
- added replay labels for initial entry, add, trim, re-add, full exit, and risk
  direction in the import workflow
- kept all new decisions as client-state-only future persistence events; no
  auth, billing, production storage, raw JSON panel, or data-removal product
  surface was added
- kept `levels-system` untouched; candles, support/resistance, VWAP/EMA, and
  market structure remain owned by the shared engine

New implementation:

- `src/lib/trader-analytics/product/csv-dry-run-workflow.ts`
- `src/lib/trader-analytics/product/types.ts`
- `src/lib/trader-analytics/index.ts`
- `app/import-dry-run/import-dry-run-client.tsx`
- `src/lib/trader-analytics/__tests__/trader-import-repair-feedback-preview.test.ts`
- `src/docs/trader-import-repair-feedback-preview-plan.md`

Verification completed:

- focused repair/feedback dry-run tests passed with 2 files / 13 tests
- `npx vitest run src/lib/trader-analytics/__tests__` passed with 16 files /
  109 tests
- `npx tsc --noEmit` passed
- `npm run verify:all` passed with 84 files / 770 tests plus shared-engine,
  Layer 2, and Layer 3 checkpoints
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings
- `npm run build` passed and produced `/import-dry-run`
- existing dev server smoke passed for
  `http://localhost:3000/import-dry-run`, including the new row repair,
  feedback preview, replay preview, and error library surfaces

Best next step:

- test `/import-dry-run` with anonymized real broker execution CSVs when they
  become available, then use the repair/decision capture model to decide which
  broker mappings and grouping rules deserve production persistence first

### 2026-05-03 Trader CSV Dry-Run Import UI Complete

The active CSV dry-run UI branch is documented in:

- `src/docs/trader-csv-dry-run-import-ui-plan.md`

What changed:

- added a rough but usable `/import-dry-run` workflow UI where a user can choose
  a synthetic broker sample, open a local CSV, paste CSV text, select broker
  format, set account timezone, and preview the import without saving anything
- added column mapping assistant support for unknown headers, including explicit
  symbol/timestamp/date/time/side/quantity/price/status/fee mapping inputs that
  re-run the existing broker CSV parser
- added dry-run product view models for confidence gate, import session state,
  grouped trade review, first-trade walkthrough, broker coverage confidence,
  evidence drill-in, end-user copy audit, and real-import calibration queue
- wired `/import-dry-run` into home navigation, import review, platform route
  policy, no-export audit, mobile QA contracts, and public exports
- kept the workflow execution-only: no persistence, no auth, no billing, no
  export/download controls, no raw JSON panel, and no candle/market-structure
  dependency

New implementation:

- `src/lib/trader-analytics/product/csv-dry-run-workflow.ts`
- `src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts`
- `app/import-dry-run/page.tsx`
- `app/import-dry-run/import-dry-run-client.tsx`
- `src/docs/trader-csv-dry-run-import-ui-plan.md`

Verification completed:

- focused dry-run tests passed with 1 file / 7 tests
- `npx vitest run src/lib/trader-analytics/__tests__` passed with 15 files /
  103 tests
- `npx tsc --noEmit` passed
- `npm run verify:all` passed with 83 files / 764 tests plus shared-engine,
  Layer 2, and Layer 3 checkpoints
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings
- `npm run build` passed and produced `/import-dry-run`
- existing dev server smoke passed at `http://localhost:3000` for `/`,
  `/import-dry-run`, `/imports`, `/import-trials`, `/repair-wizard`,
  `/review-cockpit`, `/calibration`, `/analytics`, and
  `/trades/trade-rapid-fire`

Best next step:

- use `/import-dry-run` as the working rough UI for the first real-import
  product flow; once anonymized real CSV examples exist, compare user repair
  outcomes against the synthetic presets before adding save/analysis persistence

### 2026-05-03 Trader Import Trial And Repair Experience Complete

The active import trial and repair branch is documented in:

- `src/docs/trader-import-trial-and-repair-experience-plan.md`

What changed:

- added a deterministic synthetic broker import trial experience for
  representative IBKR, Moomoo, Webull, Robinhood, Schwab, generic CSV, and
  edge-case execution import coverage
- added an in-app repair wizard model for missing row fields, timestamp issues,
  skipped rows, options quarantine, open-position leftovers, duplicate files,
  grouping review, and P/L reconciliation mismatch
- added a review cockpit that combines import readiness, repair needs, guided
  review, rule lifecycle simulation, trade replay, and progress actions without
  using market context for priority
- added rule lifecycle simulation, trade replay visual contract, product copy
  quality audit, broker fixture library, mobile QA contract, in-app explanation
  records, and a calibration dashboard that waits for real imports
- added `/import-trials`, `/repair-wizard`, `/review-cockpit`, and
  `/calibration` as end-user no-export routes and wired them into home
  navigation, analytics, public exports, and platform route policy
- kept all new conclusions execution-only or fixture-readiness-only; candles,
  support/resistance, and market structure still belong to `levels-system`

New implementation:

- `src/lib/trader-analytics/product/import-trial-experience.ts`
- `src/lib/trader-analytics/__tests__/trader-import-trial-experience.test.ts`
- `app/import-trials/page.tsx`
- `app/repair-wizard/page.tsx`
- `app/review-cockpit/page.tsx`
- `app/calibration/page.tsx`
- `src/docs/trader-import-trial-and-repair-experience-plan.md`

Verification completed:

- focused import-trial tests passed with 1 file / 10 tests
- `npx vitest run src/lib/trader-analytics/__tests__` passed with 14 files /
  96 tests
- `npx tsc --noEmit` passed
- `npm run verify:all` passed with 82 files / 757 tests plus shared-engine,
  Layer 2, and Layer 3 checkpoints
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings
- `npm run build` passed and produced `/import-trials`, `/repair-wizard`,
  `/review-cockpit`, and `/calibration`
- existing dev server smoke passed at `http://localhost:3000` for `/`,
  `/analytics`, `/import-trials`, `/repair-wizard`, `/review-cockpit`,
  `/calibration`, `/imports`, `/review`, `/progress`, and
  `/trades/trade-rapid-fire`

Best next step:

- when real user imports exist, collect anonymized broker-header/row examples
  and real repair outcomes, then calibrate import repair rates, rule lifecycle
  conversion, review completion, and broker-specific mapping confidence

### 2026-05-03 Trader Review Habit Loop Complete

The active review habit loop branch is documented in:

- `src/docs/trader-review-habit-loop-plan.md`

What changed:

- added a deterministic execution-only review habit loop for mistake-to-rule
  conversion drafts, per-trade review checklists, behavior change tracking,
  user-facing data quality score, coach language refinement, safety-copy audit,
  execution-pattern playbook drafting, trade comparison, review habit metrics,
  and end-user onboarding path
- added `/compare-trades` and `/onboarding` as product-facing end-user routes
  with no raw JSON, CSV, spreadsheet, download, or export affordance
- enhanced `/analytics`, `/coach`, `/imports`, `/review`, `/progress`, and
  `/trades/[tradeId]` with review habit loop panels and checklists
- wired `reviewHabitLoop` into the product trader analytics view model, public
  exports, home navigation, and platform route registry
- kept all new conclusions execution-only; market context remains observational
  and does not affect rule conversion, checklist status, behavior change,
  trade comparison, onboarding, or safety-copy conclusions

New implementation:

- `src/lib/trader-analytics/product/review-habit-loop.ts`
- `src/lib/trader-analytics/__tests__/trader-review-habit-loop.test.ts`
- `app/compare-trades/page.tsx`
- `app/onboarding/page.tsx`

Verification completed:

- focused review-habit tests passed with 1 file / 7 tests
- `npx vitest run src/lib/trader-analytics/__tests__` passed with 13 files /
  86 tests
- `npx tsc --noEmit` passed
- `npm run verify:all` passed with 81 files / 747 tests plus shared-engine,
  Layer 2, and Layer 3 checkpoints
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings
- `npm run build` passed and produced `/compare-trades` and `/onboarding`
- existing dev server smoke passed at `http://localhost:3000` for `/`,
  `/analytics`, `/coach`, `/compare-trades`, `/imports`, `/onboarding`,
  `/review`, `/progress`, `/session-recap`, and
  `/trades/trade-rapid-fire`

Best next step:

- once real imports exist, calibrate the review habit loop on actual user
  behavior: which checklist items users complete, which draft rules they save,
  which onboarding steps cause drop-off, and whether behavior-change tracker
  language remains fair on real sample sizes

### 2026-05-03 Trader Product Polish And Import Trust Complete

The active product polish branch is documented in:

- `src/docs/trader-product-polish-and-import-trust-plan.md`

What changed:

- added a deterministic execution-only product-polish layer for coach evidence
  cards, trade grade explainability, first import experience, trade repair
  inbox, personal pattern memory, rule candidate lab, session recap,
  confidence calibration, execution quality trendline, and coach review queue
- added `/session-recap` as a product-facing end-user route with no raw JSON,
  CSV, spreadsheet, download, or export affordance
- enhanced `/analytics`, `/coach`, `/review`, `/progress`, `/imports`, and
  `/trades/[tradeId]` with trust/explainability and import-repair surfaces
- wired `productPolish` into the product trader analytics view model, public
  exports, home navigation, and platform route registry
- kept all new product conclusions execution-only; market context remains
  observational and does not affect queue priority, grade explainability,
  confidence calibration, trendline, repair guidance, or recap conclusions

New implementation:

- `src/lib/trader-analytics/product/product-polish.ts`
- `src/lib/trader-analytics/__tests__/trader-product-polish.test.ts`
- `app/session-recap/page.tsx`

Verification completed:

- focused product-polish tests passed with 1 file / 7 tests
- `npx vitest run src/lib/trader-analytics/__tests__` passed with 12 files /
  79 tests
- `npx tsc --noEmit` passed
- `npm run verify:all` passed with 80 files / 740 tests plus shared-engine,
  Layer 2, and Layer 3 checkpoints
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings
- `npm run build` passed and produced `/session-recap`
- existing dev server smoke passed at `http://localhost:3000` for `/`,
  `/analytics`, `/coach`, `/imports`, `/review`, `/progress`,
  `/session-recap`, and `/trades/trade-rapid-fire`

Best next step:

- when real user imports arrive, calibrate confidence thresholds, repair copy,
  rule candidate readiness, and trendline interpretation against messy broker
  CSVs and real repeated trader behavior

### 2026-05-03 Trader Coach Action Loop Complete

The active coach action-loop branch is documented in:

- `src/docs/trader-coach-action-loop-plan.md`

What changed:

- added a deterministic execution-only coach action loop that produces mistake
  timelines, rule simulations, trader archetype profile, session prep, review
  completion loop, similar-trade groups, mistake severity ladder, confidence
  language, empty states, and coach home data
- added the new `/coach` end-user route as a product-facing next-action screen
  with no raw JSON, CSV, spreadsheet, download, or export affordance
- enhanced `/trades/[tradeId]` with per-trade mistake timeline and similar
  execution-pattern panels
- wired the coach action loop into the product trader analytics view model,
  public exports, and platform module
- kept all coach conclusions execution-only; market context remains
  observational and does not affect coach scoring, severity, prep, or final
  next-action copy

New implementation:

- `src/lib/trader-analytics/product/coach-action-loop.ts`
- `src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts`
- `app/coach/page.tsx`

Verification completed:

- focused coach tests passed with 3 files / 20 tests
- `npx vitest run src/lib/trader-analytics/__tests__` passed with 11 files /
  72 tests
- `npx tsc --noEmit` passed
- `npm run verify:all` passed with 79 files / 733 tests plus shared-engine,
  Layer 2, and Layer 3 checkpoints
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings
- `npm run build` passed and produced `/coach`
- existing dev server smoke passed at `http://localhost:3000` for `/`,
  `/coach`, `/analytics`, `/review`, `/progress`, and
  `/trades/trade-rapid-fire`

Best next step:

- use real imported trade executions when available to calibrate archetype,
  severity, and confidence thresholds; until then, keep the coach loop
  deterministic, sample-size aware, and execution-only

### 2026-05-03 Trader Improvement Intelligence Deepening Complete

The active trader-improvement branch is documented in:

- `src/docs/trader-improvement-intelligence-deepening-plan.md`

What changed:

- execution replay now includes decision roles, position before/after, position
  percent of max size, average open price, realized P/L progress, risk
  direction, and linked review labels
- added execution-only per-trade quality scorecards for entry discipline, add
  discipline, exit discipline, risk control, sizing consistency, and overall
  quality
- expanded mistake observations with confidence, reason, and suggested review
  action
- strengthened rule-builder recommendations with suggested rule titles and
  expected success metrics
- added playbook/readiness buckets, latest-session coach reports, behavior
  visuals, and best/worst pattern finder output
- wired the new intelligence into `/analytics`, `/review`, `/progress`, and
  `/trades/[tradeId]`
- market structure remains observational and does not affect execution-only
  scoring, mistake cost, rule evaluation, or final coaching conclusions

New implementation:

- `src/lib/trader-analytics/product/trader-improvement.ts`
- `src/lib/trader-analytics/__tests__/trader-improvement-intelligence.test.ts`

Verification completed:

- `npx vitest run src/lib/trader-analytics/__tests__` passed with 10 files /
  65 tests
- `npx tsc --noEmit` passed
- `npm run verify:all` passed with 78 files / 726 tests plus shared-engine,
  Layer 2, and Layer 3 checkpoints
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings
- `npm run build` passed
- existing dev server smoke passed at `http://localhost:3000` for `/`,
  `/analytics`, `/review`, `/progress`, and `/trades/trade-rapid-fire`

Best next step:

- use real imported trade executions when available to calibrate quality
  thresholds and coach-report language; keep market-context promotion separate
  until real saved-trade calibration is reviewed

### 2026-05-02 End-User Trader Analytics Product Prototype Complete

The active product branch from
`src/docs/end-user-trader-analytics-product-roadmap.md` is complete for the
fixture/in-memory prototype.

End-user analytics product expansion roadmap:

- `src/docs/end-user-analytics-product-expansion-plan.md`
- this branch covers the next end-user product layer: storage readiness,
  import review inbox, saved snapshots, weekly review, behavior streaks, notes
  and journal prompts, rule compliance summary, and an experimental
  market-context add-on panel
- this branch is complete for the fixture/in-memory product prototype
- added `src/lib/trader-analytics/product/product-expansion.ts`
- added focused coverage:
  `src/lib/trader-analytics/__tests__/end-user-product-expansion.test.ts`
- `/analytics` now includes weekly review, storage readiness, import review
  inbox, saved snapshots, behavior streaks, journal prompts, rule compliance,
  and a separate observational market-context panel
- `/trades/[tradeId]` now includes saved notes and journal prompts
- `README.md` links the expansion plan

New active productization roadmap:

- `src/docs/end-user-productization-implementation-plan.md`
- this branch covers the app-side productization layer for workspace/account
  modeling, import reconciliation, review workflows, tags/setup labels, action
  plans, end-user/admin permission split, async analysis jobs, visual QA, and
  market-context calibration queue
- this branch is complete for the fixture/in-memory product prototype
- added `src/lib/trader-analytics/product/productization.ts`
- added focused coverage:
  `src/lib/trader-analytics/__tests__/end-user-productization.test.ts`
- `/analytics` now includes workspace scope, permission split, import
  reconciliation, analysis jobs, review workflow, action plan, setup tags,
  calibration queue, and visual QA panels
- `README.md` links the productization plan

Implemented product surfaces:

- `/analytics` production analytics route with no raw JSON, CSV, spreadsheet,
  or export controls
- `/trades/[tradeId]` execution-only trade review route
- saved report/trade contracts, in-memory repository boundary, fixture-backed
  saved reports, filters, metric drill-downs, report history, latest-vs-prior
  comparisons, behavior trends, focus queue, rule tracker, import preview, and
  no-export production guardrails

Verification completed:

- `npm run verify:all` passed with `71` files / `656` tests plus the focused
  shared-engine, Layer 2, and Layer 3 checkpoints
- after the product expansion branch, `npm run verify:all` passed with `72`
  files / `664` tests plus the focused shared-engine, Layer 2, and Layer 3
  checkpoints
- after the productization branch, `npm run verify:all` passed with `73` files
  / `672` tests plus the focused shared-engine, Layer 2, and Layer 3
  checkpoints
- `npm run build` passed and produced `/analytics` and `/trades/[tradeId]`
- `npm run lint` passed with `0` errors and the same `4` pre-existing warnings
- local production smoke against `next start` passed for:
  `GET /analytics`, `GET /trades/trade-rapid-fire`, and `GET /`

Best next step:

- replace the fixture/in-memory repository with real authenticated storage once
  backend/auth choices are made
- keep raw JSON and export-like affordances limited to debug/admin surfaces
- keep market-context analytics as a later calibrated add-on; execution-only
  analytics should remain valid without candles or live market data

### 2026-05-02 End-User Execution CSV Import Boundary

The active import/storage branch is now documented in:

- `src/docs/end-user-execution-import-and-storage-plan.md`

What changed:

- added broker CSV execution import parsing under
  `src/lib/execution-sources/csv/`
- added import diagnostics for detected columns, header row number, row
  outcomes, issue counts, and duplicate request fingerprint groups
- added deterministic non-security fingerprints for uploaded CSV files and
  grouped trade requests
- added timezone-aware CSV timestamp parsing with a default UTC fallback and
  optional account/broker timezone such as `America/New_York`
- imported executions can now preserve optional commission, fee, net amount,
  and currency values when broker CSV files provide them
- options rows are rejected by default, can be skipped, and are only allowed
  explicitly for future non-stock workflows
- same-file duplicate checks can now be performed through
  `previewBrokerExecutionCsvImport(..., existingFileFingerprints)`
- import reconciliation now distinguishes duplicates of existing saved trades
  from duplicates inside the same import batch
- supported import formats now include:
  - IBKR activity / Flex-style trades
  - Moomoo trade history
  - Webull order history
  - Robinhood transaction history
  - Schwab transactions
  - generic execution CSV
- parsed CSV rows map into `ProviderExecution[]`
- parsed executions group into `UserTradeAnalysisRequest[]`
- the saved-trade import preview can now consume broker CSV directly through
  `previewBrokerExecutionCsvImport(...)`
- broker CSV source is kept separate from candle-provider selection; IBKR,
  Moomoo, Webull, Robinhood, and Schwab CSV imports do not become
  `levels-system` providers
- import is input-only; no end-user export/download controls were added
- representative CSV fixtures live under
  `src/docs/trade-execution-import-fixtures/`
- the CSV preview now also returns product diagnostics:
  - import repair workflow items
  - mapping confidence
  - summary cards
  - net P/L preview
  - trade grouping diagnostics
- workspace/account contracts now carry `accountTimezone`, and broker CSV
  previews can use `accountTimezone` as the default for broker-local timestamps
- over-reduction grouping diagnostics were fixed so the closing split is
  reported as flat before the opposite-direction remainder opens
- the representative fixture pack now also covers Fidelity, E*TRADE,
  Tastytrade, TradeStation, and Thinkorswim/TDA-style exports through the
  generic execution CSV mapper
- a detailed storage schema contract now lives at:
  `src/docs/end-user-database-schema-plan.md`
- follow-up import/product hardening added:
  - explicit CSV column mapping overrides for unknown broker headers
  - optional trade grouping safety rules for max time gap and session boundary
  - import commit plan contract
  - broker/app P/L reconciliation and mismatch repair items
  - mapping learning signal for generic or low-confidence imports
  - options quarantine contract
  - import review dashboard model
  - richer account settings contract for base currency, default broker,
    supported asset classes, import defaults, and commission handling
  - analysis confidence badges
  - default no-export data retention/delete policy

Deferred product work remains:

- real authenticated storage implementation
- import UI
- onboarding
- plan/billing design
- notifications
- UI copy polish
- production security/privacy/retention decisions

Focused verification:

- `npx vitest run src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts`
  passed with 25 tests
- `npx vitest run src/lib/trader-analytics/__tests__/end-user-productization.test.ts`
  passed with 11 tests
- `npx tsc --noEmit` passed
- `npm run lint` passed with 0 errors and the same 4 pre-existing unrelated
  warnings
- `npm run verify:all` passed with 74 files / 700 tests plus the focused
  shared-engine, Layer 2, and Layer 3 checkpoints
- `npm run build` passed
- production route smoke passed for `/`, `/analytics`, and
  `/trades/trade-rapid-fire` with HTTP 200 responses

Best next step:

- keep the next real-product work centered on persistent storage plus import UI
  when the auth/database choices are ready

### 2026-05-03 End-User Product Intelligence Hardening Pass

The active product-intelligence branch is documented in:

- `src/docs/end-user-product-intelligence-hardening-plan.md`

This pass is complete for the fixture-backed product prototype.

What changed:

- added import quality scoring to broker CSV product diagnostics
- added trade reconstruction preview to broker CSV product diagnostics
- added execution-only mistake taxonomy, observations, cost estimates,
  recurrence alerts, rule-builder recommendations, unified review queue, and
  trader scorecard helpers in
  `src/lib/trader-analytics/product/product-intelligence.ts`
- added broker import fingerprint library helper for future unknown-broker
  mapping learning
- added market-context readiness gate that keeps market structure out of
  scoring until calibration is intentionally promoted
- added `TraderProductIntelligenceViewModel` and wired it into
  `buildProductTraderAnalyticsViewModel(...)`
- `/analytics` now shows execution score trend, mistake cost estimates,
  recurrence alerts, rule-builder recommendations, and a unified review queue
- `README.md` now links the product-intelligence hardening plan

Focused verification:

- `npx vitest run src/lib/trader-analytics/__tests__/end-user-product-intelligence.test.ts`
  passed with 6 tests
- `npx vitest run src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts`
  passed with 25 tests
- `npx tsc --noEmit` passed

Full verification:

- `npm run verify:all` passed with 75 files / 706 tests plus the focused
  shared-engine, Layer 2, and Layer 3 checkpoints
- `npm run lint` passed with 0 errors and the same 4 pre-existing unrelated
  warnings
- `npm run build` passed
- production route smoke passed for `/`, `/analytics`, and
  `/trades/trade-rapid-fire` with HTTP 200 responses

No `levels-system` blocker was found in this pass, so the shared `52...md`
handoff file did not need an update.

Best next step:

- continue toward real authenticated storage and import UI when those product
  architecture decisions are ready; the intelligence layer now has stable
  fixture-backed contracts to persist and render

### 2026-05-03 End-User Workflow Productization Pass

The active workflow-productization branch is documented in:

- `src/docs/end-user-workflow-productization-plan.md`

This pass is complete for the fixture-backed product workflow prototype.

What changed:

- added `src/lib/trader-analytics/product/product-workflow.ts`
- added fixture-backed workflow view models for import review UI, execution
  replay, guided review session, rule effectiveness tracking, trader progress,
  import health, broker mapping admin, in-app lesson draft, account plan
  foundation, and storage implementation boundary
- added routes:
  - `/imports`
  - `/review`
  - `/progress`
  - `/import-health`
  - `/admin/broker-mappings`
  - `/account`
- updated `/trades/[tradeId]` with execution replay
- updated `/` with links to the new workflow surfaces
- exported workflow helpers and types from `src/lib/trader-analytics/index.ts`
- `README.md` now links the workflow productization plan

Focused verification:

- `npx vitest run src/lib/trader-analytics/__tests__/end-user-workflow-productization.test.ts`
  passed with 7 tests
- `npx tsc --noEmit` passed

Full verification:

- `npm run verify:all` passed with 76 files / 713 tests plus the focused
  shared-engine, Layer 2, and Layer 3 checkpoints
- `npm run lint` passed with 0 errors and the same 4 pre-existing unrelated
  warnings
- `npm run build` passed and produced 13 static pages plus the dynamic routes
- production route smoke passed for `/`, `/analytics`, `/imports`, `/review`,
  `/progress`, `/import-health`, `/admin/broker-mappings`, `/account`, and
  `/trades/trade-rapid-fire` with HTTP 200 responses

Boundary note:

- real database, auth, and billing choices remain intentionally deferred
- this pass makes those future choices explicit through the account/plan and
  storage-boundary view models
- no `levels-system` blocker was found, so the shared `52...md` handoff file
  did not need an update

Best next step:

- once auth/database choices are made, wire the import commit flow and saved
  notes/rules into real persistent storage

### 2026-05-03 Platform-Ready Feature Module Pass

The active platform-readiness branch is documented in:

- `src/docs/platform-ready-feature-module-plan.md`

This pass is complete for demo/platform-ready module mode.

Why this branch exists:

- Trader Intelligence is intended to become one feature module inside a larger
  platform with shared login, shared account/workspace context, shared tiered
  plans, and shared navigation
- this repo should keep building features and tests without choosing real auth,
  billing, or production database yet

What changed:

- added `src/lib/trader-analytics/product/platform-module.ts`
- added contracts and helpers for:
  - demo platform context
  - plan tiers
  - entitlements
  - feature gates
  - route registry with standalone and future platform paths
  - no-export policy audit
  - feature readiness checklist
  - visual QA checklist
  - broker CSV regression fixture harness
  - module readiness view model
- added `/platform-readiness`
- updated `/` with a Platform Readiness link
- exported platform helpers and types from `src/lib/trader-analytics/index.ts`
- `README.md` now links the platform-ready feature module plan

Focused verification:

- `npx vitest run src/lib/trader-analytics/__tests__/platform-ready-feature-module.test.ts`
  passed with 7 tests
- `npx tsc --noEmit` passed

Full verification:

- `npm run verify:all` passed with 77 files / 720 tests plus the focused
  shared-engine, Layer 2, and Layer 3 checkpoints
- `npm run lint` passed with 0 errors and the same 4 pre-existing unrelated
  warnings
- `npm run build` passed and produced 14 static pages plus the dynamic routes
- production route smoke passed for `/`, `/platform-readiness`, `/analytics`,
  `/imports`, `/review`, `/progress`, `/import-health`,
  `/admin/broker-mappings`, `/account`, and `/trades/trade-rapid-fire` with
  HTTP 200 responses

Boundary note:

- real auth, billing, production database, and global platform shell remain
  intentionally deferred
- this app now has a demo platform context and platform-mount contract that can
  be replaced by the larger website later
- no `levels-system` blocker was found, so the shared `52...md` handoff file
  did not need an update

Best next step:

- continue perfecting feature behavior and UI/testing in standalone demo mode;
  when the larger platform is ready, feed real platform context into these
  module contracts

### 2026-05-02 Levels-System Shared Engine Adapter Pass

The active branch now includes the first `levels-system` integration path for
support/resistance and shared candle-derived indicators.

Current shared-source-of-truth document:

- `C:\Users\jerac\Documents\TraderLink\levels-system\docs\52_TRADER_INTELLIGENCE_V2_SHARED_ENGINE_HANDOFF_2026-05-02.md`

Important architecture correction:

- long term, `levels-system` owns candle fetching, candle preparation,
  support/resistance, and shared VWAP / EMA context
- `trader-intelligence-v2` consumes public shared outputs through the package
  boundary
- this repo should not import `levels-system` internals by path

Implemented in this pass:

- added local dependency:
  `levels-system-phase1: file:../levels-system`
- added `src/lib/support-resistance/levels-system-adapter.ts`
- the adapter calls `buildSupportResistanceContextForSymbol(...)`
- shared `FinalLevelZone` output now maps into this repo's `StructuralLevel`
  contract
- shared dynamic levels now map into this repo's `DynamicLevels` contract
- execution-to-level relations remain local for now
- existing synchronous Layer 1 support/resistance construction remains intact
- new async wrappers are available:
  - `createRawTradeTimelineWithLevelsSystem(...)`
  - `analyzeTradeWithLevelsSystem(...)`
- new app-facing facade is available:
  - `runTradeAnalysis(...)`

Current integration posture:

- use `runTradeAnalysis(...)` for new app-facing single-trade work
- `runTradeAnalysis(...)` defaults support/resistance to the shared
  `levels-system` path
- shared `context.marketStructure` is consumed as
  `rawTradeTimeline.experimentalMarketStructure`
- `experimentalMarketStructure` is observational only and is not mapped into
  PatternInput, scoring, coaching, grading, or final user-facing conclusions
- keep the existing sync path stable until callers are intentionally migrated
- do not ask `levels-system` for more API surface until a real adapter blocker
  is found

Shared-package follow-up resolved:

- `levels-system` now emits declaration files for
  `levels-system-phase1/support-resistance-engine`
- this repo reinstalled the local dependency and removed the temporary ambient
  declaration
- `npx tsc --noEmit` passes against the real shared package types

Calibration follow-up completed:

- added a sample-trade-aligned shared fetch-service fixture for tests and
  comparison work
- added `npm run verify:levels-system` for focused shared-engine coverage
- added `npm run compare:levels-system` to compare legacy local S/R with the
  shared engine on the canonical sample trade
- added `src/lib/support-resistance/levels-system-runtime-options.ts` so this
  app passes provider/lookback/as-of preferences to `levels-system` without
  owning candle fetching
- added `src/lib/trade-analysis/run-trade-analysis.ts` as the preferred
  app-facing caller
- added PatternInput and full Layer 1 -> Layer 3 integration coverage for
  `analyzeTradeWithLevelsSystem(...)`
- added regression coverage proving `runTradeAnalysis(...)` uses the shared
  engine by default and the legacy local path remains explicit
- documented runtime knobs:
  - `LEVELS_SYSTEM_PROVIDER`
  - `LEVELS_SYSTEM_DAILY_LOOKBACK_BARS`
  - `LEVELS_SYSTEM_4H_LOOKBACK_BARS`
  - `LEVELS_SYSTEM_5M_LOOKBACK_BARS`
- added observational consumption of shared `context.marketStructure` as
  `rawTradeTimeline.experimentalMarketStructure`
- added tests proving the experimental market-structure read is visible on the
  shared raw result and absent from PatternInput
- added `src/lib/raw-trade-timeline/builders/create-raw-trade-timeline-with-levels-system-candles.ts`
  to call shared `buildTradeAnalysisCandleContext(...)`, map the returned
  pre-trade / trade / post-trade candles into this app's raw timeline, and reuse
  the shared support/resistance context without a second fetch
- added `runTradeAnalysisFromLevelsSystemCandles(...)` for app-facing analysis
  requests that have symbol / session / executions but no local candles
- added `src/lib/support-resistance/market-structure-audit/build-experimental-market-structure-audit.ts`
  to summarize shared market-structure state across saved trades without
  introducing scoring, coaching, grading, or user-facing conclusions
- added `npm run audit:market-structure`; with no path it audits the sample
  fixture through the shared trade-window candle path, and with a JSON path it
  accepts one trade, an array, `{ trade }`, or `{ trades }`
- added `npm run calibrate:market-structure` and `--out-dir` support so real
  saved-trade calibration writes `market-structure-audit.json` and
  `market-structure-calibration-report.md` under ignored `/artifacts`
- the audit now accepts either full candle-supplied trades or execution-only
  trade requests; when candles are missing it asks `levels-system` for the
  trade-window candle package first
- added
  `src/docs/market-structure-calibration/sample-execution-only-trades.json` as
  the saved-trade shape template for provider-backed calibration runs that
  should fetch candles from `levels-system`
- the audit includes a PatternInput leak check so shared
  `experimentalMarketStructure` stays debug-only while real saved data is
  calibrated
- the generated Markdown calibration report now separates PASS / REVIEW /
  BLOCKER gates for PatternInput isolation, analysis completion,
  market-structure presence, confidence, unknown or insufficient structure
  reads, market-structure diagnostics, and true provider / engine warning or
  error messages; harmless fetch info remains visible as engine messages
- moved saved-trade audit JSON parsing into
  `src/lib/support-resistance/market-structure-audit/parse-market-structure-audit-trades.ts`
  with regression coverage so mixed candle-supplied / execution-only batches are
  rejected instead of silently dropping provided candles
- added `--validate-only` to `npm run audit:market-structure -- ...` so saved
  trade files can be shape-checked before any provider or shared-engine candle
  request runs
- added
  `src/lib/support-resistance/market-structure-audit/evaluate-market-structure-calibration.ts`
  so calibration gates, overall PASS / REVIEW / BLOCKER status, and the
  recommendation action are machine-readable instead of only Markdown text
- `npm run calibrate:market-structure` now writes
  `market-structure-calibration-evaluation.json` alongside the raw audit JSON
  and Markdown report
- added the app-facing user trade request boundary in
  `src/lib/trade-analysis/request/trade-analysis-request-contract.ts`
  to validate symbol, trade direction, session context, executions, provider
  options, and trade-window options before this app calls `levels-system`
- added provider/shared-engine failure classification in
  `src/lib/trade-analysis/failures/classify-trade-analysis-failure.ts`
- added the stable UI/API/debug summary contract in
  `src/lib/trade-analysis/summary/build-trade-analysis-summary.ts`
- added a deterministic synthetic calibration harness in
  `src/lib/support-resistance/market-structure-audit/synthetic-market-structure-calibration-scenarios.ts`
  for PASS / REVIEW / BLOCKER regression coverage without treating synthetic
  candles as proof of market-structure quality
- added the local CLI debug dashboard:
  `npm run debug:trade-analysis`
  - no path uses the deterministic stub fixture
  - `--validate-only` validates request JSON without provider calls
  - `--out-dir` writes `trade-analysis-debug-dashboard.json` and
    `trade-analysis-debug-dashboard.md` under ignored `/artifacts`
- added the batch trade-analysis runner:
  `src/lib/trade-analysis/batch/run-trade-analysis-batch.ts`
  - validates one request or batches through the public request contract
  - optionally runs the shared `levels-system` trade-window candle path
  - returns `batch_trade_analysis_v1` with validation, failures, stable
    summaries, market-structure observation counts, and pattern aggregates
- refactored the CLI debug dashboard to use the batch runner
- added the debug API route:
  `POST /api/trade-analysis/debug`
  - accepts one request, `{ request }`, `{ trade }`, `{ requests }`,
    `{ trades }`, or an array
  - supports `validateOnly: true`
  - returns the same `batch_trade_analysis_v1` contract
- added the internal debug page:
  `/debug/trade-analysis`
- added request fixture JSON under:
  `src/docs/trade-analysis-request-fixtures/`
- added debug dashboard comparison:
  `npm run compare:trade-debug -- left.json right.json`
- added market-structure promotion-readiness gates:
  `src/lib/support-resistance/market-structure-audit/evaluate-market-structure-promotion-readiness.ts`
  - keeps shared market structure observational/debug-only by default
  - requires enough reviewed real saved trades and clean quality gates before
    even limited internal use
  - still prohibits pattern detection, normalization, grading, scoring,
    coaching, and final user-facing conclusions
- `npm run calibrate:market-structure` now writes
  `market-structure-promotion-readiness.json` alongside the audit,
  evaluation, and Markdown report
- comparison result on the sample trade:
  - legacy local path produced `0` support and `0` resistance levels
  - shared engine path produced `5` support and `2` resistance levels
  - shared engine changed nearest-level and VWAP / EMA PatternInput fields
  - shared market structure reported `base_building`, `uptrend`, high confidence
  - shared engine added `entry_far_from_support_structure`
  - shared engine did not remove existing detected or normalized patterns

Verification completed:

- `npx vitest run src/lib/support-resistance/__tests__/levels-system-adapter.test.ts`
  passed
- `npx vitest run src/lib/__tests__/trade-analysis-engine.test.ts` passed
- `npm run verify:levels-system` passed, including the app-facing
  `runTradeAnalysis(...)` and shared trade-window candle regressions
- `npm run compare:levels-system` completed and produced the sample comparison
- `npm run audit:market-structure` completed against the sample fixture with
  `base_building` / `uptrend` / high confidence, `5` support levels, `2`
  resistance levels, shared `levels_system_trade_window` candle source, and `0`
  PatternInput leaks
- `npm run audit:market-structure -- --out-dir artifacts/market-structure-calibration-smoke`
  wrote JSON and Markdown smoke-report artifacts successfully
- `npm run calibrate:market-structure` wrote the default ignored calibration
  artifacts successfully
- `npm test` passed with 570 tests
- `npm run verify:all` passed
- `npm run verify:layer2` passed
- `npm run verify:layer3` passed
- `npx tsc --noEmit` passed
- after calibration-gate and parser hardening, `npm run verify:levels-system`
  passed with 9 files / 22 tests and `npm run calibrate:market-structure`
  regenerated the ignored Markdown report with all sample gates passing
- parser hardening added 5 focused tests for execution-only templates,
  candle-supplied trades, empty batches, mixed modes, and malformed executions
- machine-readable calibration evaluation added 3 focused tests for PASS,
  REVIEW, and BLOCKER outcomes; `npm run verify:levels-system` now covers
  10 files / 25 tests
- request/validator/failure/summary/synthetic/debug-dashboard work expanded
  `npm run verify:levels-system` to 15 files / 44 tests
- `npm run debug:trade-analysis -- --validate-only` passed against the sample
  fixture without provider analysis
- `npm run debug:trade-analysis -- --out-dir artifacts/trade-analysis-debug-smoke`
  passed and wrote ignored JSON / Markdown debug dashboard artifacts
- focused batch/API/promotion/fixture/snapshot/comparison tests passed:
  `7` files / `24` tests
- after the batch/API/debug-page pass:
  - `npm run verify:levels-system` passed with `21` files / `65` tests
  - `npm run verify:all` passed with `60` files / `591` tests plus the
    focused shared-engine, Layer 2, and Layer 3 checkpoints
  - `npx tsc --noEmit` passed
  - `npm run build` passed and produced routes for `/`,
    `/api/trade-analysis/debug`, and `/debug/trade-analysis`
  - `npm run lint` passed with `0` errors and `4` pre-existing warnings
  - `npm run debug:trade-analysis -- --validate-only` passed
  - `npm run debug:trade-analysis -- --out-dir artifacts/trade-analysis-debug-smoke`
    passed
  - `npm run compare:trade-debug -- artifacts/trade-analysis-debug-smoke/trade-analysis-debug-dashboard.json artifacts/trade-analysis-debug-smoke/trade-analysis-debug-dashboard.json`
    passed
  - `npm run calibrate:market-structure -- --out-dir artifacts/market-structure-calibration-smoke`
    passed and wrote the promotion-readiness artifact

Best next step:

- keep `runTradeAnalysis(...)` as the preferred app-facing single-trade entry
  point, while leaving the sync legacy path available for existing tests and
  explicit fallback use
- use `npm run debug:trade-analysis -- path/to/request.json --validate-only`
  as the first check for future UI/API/user-entered trade requests
- next product-value step is running `npm run calibrate:market-structure --
  path/to/saved-trades.json` against real saved trades; those saved trade JSON
  objects no longer need to include candles if they include symbol,
  tradeDirection, executions, and sessionContext
- share any confusing or low-confidence structure reads back to the
  `levels-system` handoff doc
- keep `experimentalMarketStructure` visible in debug/comparison output only;
  do not let it affect detection, normalization, scoring, coaching, grading, or
  final user-facing conclusions until it proves useful across real data
- use `/debug/trade-analysis` and `POST /api/trade-analysis/debug` as the
  first app surfaces for future user-entered trade request testing
- execution-data-only trader feedback now has its own roadmap/tracker:
  `src/docs/execution-data-feedback-plan.md`
  - this lane is for feedback from buy/sell executions, share size, sequence,
    adds, reductions, exits, and position lifecycle before candle context is
    available
  - the file is laid out as a continuous work playbook with task IDs,
    stop conditions, verification commands, phase definitions of done, open
    question defaults, and a current task pointer
  - best next step for that lane is Phase 1 inventory: identify current
    execution-derived facts and execution-only-safe pattern IDs, then decide
    whether to build on the existing raw timeline or add a smaller
    execution-only fact builder
- execution-data feedback Phase 1 is complete:
  `src/docs/execution-data-feedback-inventory.md`
  - the execution-only lane will use a dedicated fact builder in this repo
  - it will reuse the existing trade-analysis request validator, execution
    normalization, and trade-state math
  - it will not call candles, PatternInput, support/resistance, market
    structure, or `levels-system`
  - current pointer for that lane is Phase 2 / `WQ-010`: create the
    `src/lib/execution-feedback/` module and implement the stable fact contract
- execution-data feedback Phase 2 is complete:
  - added `src/lib/execution-feedback/build-execution-feedback-facts.ts`
  - added `src/lib/execution-feedback/types/execution-feedback-facts.ts`
  - added focused tests covering long/short math, scale-in/full-exit,
    partial/open-position handling, execution sorting, adverse-price adds, and
    gross realized P/L
  - the facts are execution-only and do not call `levels-system`, candles,
    support/resistance, market structure, PatternInput, or pattern detection
  - focused verification passed:
    `npx vitest run src/lib/execution-feedback/__tests__/build-execution-feedback-facts.test.ts`
    and `npx tsc --noEmit`
  - current pointer for that lane is Phase 3 / `WQ-022`: define execution
    feedback points and emit neutral context, strengths, and risks
- execution-data feedback Phase 3 is complete:
  - added `src/lib/execution-feedback/execution-behavior-patterns.ts`
  - added `src/lib/execution-feedback/types/execution-feedback-point.ts`
  - the point layer emits neutral context, strengths, and risks from
    execution facts only
  - tests cover clean exits, controlled scale-ins, repeated adverse adds,
    open-position leftovers, small first reductions, late adds, rapid-fire
    execution clusters, short-side adverse-price logic, and forbidden
    candle-dependent labels
  - focused verification passed:
    `npx vitest run src/lib/execution-feedback/__tests__/build-execution-feedback-facts.test.ts src/lib/execution-feedback/__tests__/execution-behavior-patterns.test.ts`
    and `npx tsc --noEmit`
  - current pointer for that lane is Phase 4 / `WQ-033`: build
    `execution_feedback_summary_v1` and the top-level runner
- execution-data feedback Phase 4 is complete:
  - added `src/lib/execution-feedback/summary/build-execution-feedback-summary.ts`
  - added `src/lib/execution-feedback/run-execution-feedback.ts`
  - `execution_feedback_summary_v1` now separates lifecycle, sizing,
    sequencing, gross execution-only P/L, risk facts, context points,
    strengths, risks, primary focus, warnings, and limitations
  - coaching is intentionally unchanged for now; execution feedback remains a
    separate contract until the debug/API surface and full-analysis integration
    are stable
  - focused verification passed:
    `npx vitest run src/lib/execution-feedback/__tests__/build-execution-feedback-facts.test.ts src/lib/execution-feedback/__tests__/execution-behavior-patterns.test.ts src/lib/execution-feedback/__tests__/build-execution-feedback-summary.test.ts src/lib/execution-feedback/__tests__/run-execution-feedback.test.ts`
    and `npx tsc --noEmit`
  - current pointer for that lane is Phase 5 / `WQ-041`: add the batch runner,
    debug API route, and debug page
- execution-data feedback Phase 5 is complete:
  - added `src/lib/execution-feedback/batch/run-execution-feedback-batch.ts`
  - added `app/api/execution-feedback/debug/route.ts`
  - added `app/debug/execution-feedback/page.tsx`
  - added `app/debug/execution-feedback/execution-feedback-debug-client.tsx`
  - linked `/debug/execution-feedback` from the app home page
  - focused execution-feedback tests passed with `6` files / `23` tests
  - `npm run build` passed and produced the new execution-feedback API/page
  - `npm run lint` passed with `0` errors and `4` pre-existing warnings
- execution-data feedback Phase 6 is complete:
  - `buildTradeAnalysisSummary(...)` now includes a separate
    `executionFeedback` section
  - the section uses `execution_feedback_summary_v1`, is execution-only, and
    is marked `marketContextUsed: false` /
    `separatedFromMarketContext: true`
  - support/resistance and market structure remain separate; market structure
    still reports `usedForScoring: false`
  - focused integration tests passed with `10` files / `34` tests
  - `README.md` documents `runExecutionFeedback(...)`,
    `/api/execution-feedback/debug`, and `/debug/execution-feedback`
  - current pointer for that lane is final verification and local dev-server
    smoke
- execution-data feedback final verification is complete:
  - `npm run verify:all` passed with `66` files / `615` tests, plus
    `verify:levels-system`, `verify:layer2`, and `verify:layer3`
  - `npx tsc --noEmit` passed
  - `npm run build` passed
  - `npm run lint` passed with `0` errors and the same `4` pre-existing
    warnings
  - an existing Next dev server for this repo is running at
    `http://localhost:3000`
  - smoke checks passed for:
    `GET /api/execution-feedback/debug`,
    `GET /debug/execution-feedback`, and a sample
    `POST /api/execution-feedback/debug`
  - the execution-data feedback roadmap branch in
    `src/docs/execution-data-feedback-plan.md` is complete
- execution-feedback fixture hardening is complete:
  - added `short-loser.json`,
    `repeated-adds-before-reduction.json`,
    `inconsistent-share-sizing.json`,
    `rapid-fire-execution-cluster.json`, and
    `invalid-execution-only-requests.json` under
    `src/docs/trade-analysis-request-fixtures/`
  - added execution-feedback fixture contract tests proving the fixtures run
    without candle/provider work and emit expected execution-only points
  - updated trade-analysis request fixture tests so the new examples remain on
    the public request contract
  - resolved the execution-feedback open questions for the current version:
    dedicated execution-feedback layer first, coaching kept separate, gross
    P/L labeled as fees-excluded, neutral adverse-price wording, individual
    fills preserved, and broker/order IDs preserved but optional
  - focused verification passed:
    `npx vitest run src/lib/execution-feedback/__tests__ src/lib/trade-analysis/__tests__/trade-analysis-request-fixtures.test.ts`
    with `8` files / `51` tests, and `npx tsc --noEmit`
  - full verification passed after fixture hardening:
    `npm run verify:all` with `67` files / `636` tests plus
    `verify:levels-system`, `verify:layer2`, and `verify:layer3`
  - final TypeScript/build/lint passed:
    `npx tsc --noEmit`, `npm run build`, and `npm run lint` with `0` errors
    and `4` pre-existing warnings
- trader analytics reports now have a dedicated roadmap:
  `src/docs/trader-analytics-reports-plan.md`
  - this branch is complete
  - added `src/lib/trader-analytics/` with
    `trader_analytics_report_v1`, deterministic chart data, report types,
    `buildTraderAnalyticsReport(...)`, and `runTraderAnalyticsReport(...)`
  - the lane aggregates many `execution_feedback_summary_v1` objects into
    trader-level execution analytics: sample size, gross execution-only P/L,
    lifecycle, execution behavior rates, strengths, top risks, top strengths,
    primary focus counts, category distributions, trade rows, warnings, and
    limitations
  - added `POST /api/trader-analytics/debug` and
    `GET /api/trader-analytics/debug`
  - added `/debug/trader-analytics` with fixture batch input, KPI cards,
    native SVG/CSS charts, trade rows, warnings, limitations, and raw JSON
  - linked the analytics dashboard from `app/page.tsx`
  - added `src/docs/trader-analytics-real-data-bridge.md` to keep future
    market context additive and separate from execution-only metrics
  - the API accepts raw trade request batches and prebuilt
    `execution_feedback_summary_v1` arrays
  - tests prove extra market-context fields do not change execution-only
    analytics
  - this first version does not require market hours, live data, candles,
    provider calls, or `levels-system`
  - focused verification passed:
    `npx vitest run src/lib/trader-analytics/__tests__` with `3` files /
    `11` tests and `npx tsc --noEmit`
  - `npm run build` passed and produced `/api/trader-analytics/debug` and
    `/debug/trader-analytics`
  - `npm run lint` passed with `0` errors and the same `4` pre-existing
    warnings
  - full verification passed:
    `npm run verify:all` with `70` files / `647` tests plus
    `verify:levels-system`, `verify:layer2`, and `verify:layer3`
  - local smoke checks passed for:
    `GET /api/trader-analytics/debug`,
    `POST /api/trader-analytics/debug`, and
    `GET /debug/trader-analytics`
  - best next step for this lane is using `/debug/trader-analytics` with real
    saved execution batches when available; useful follow-ups are filters,
    saved in-app report history, in-app period comparisons, and chart-bar
    drill-downs into source trades
  - product posture update:
    trader analytics is for an end-user product, so production UX should not
    offer raw JSON / CSV / spreadsheet export; raw report JSON remains
    debug/admin-only, and end-user value should come from returning to the app
    for saved history, comparisons, filters, and drill-downs
- end-user trader analytics product roadmap is now documented:
  `src/docs/end-user-trader-analytics-product-roadmap.md`
  - this is the next production-product source of truth after the completed
    `trader_analytics_report_v1` debug/report foundation
  - planned product branches include production analytics route, saved in-app
    report history, filters, metric drill-down, trade review detail pages,
    in-app comparisons, behavior trend cards, trader focus queue, rule tracker,
    onboarding sample report, import/sync boundary, privacy/admin split, and a
    later calibrated market-context add-on
  - the roadmap keeps no-export policy explicit: production users should
    return to the app for saved history, comparisons, notes, focus items, and
    drill-downs; raw JSON remains debug/admin-only
  - current pointer is Phase 0 / `EU-001`: link the roadmap from existing docs,
    add a production no-export checklist, and audit debug labels before
    starting the production `/analytics` route
- end-user trader analytics product roadmap implementation pass is complete:
  - added saved analytics product contracts in
    `src/lib/trader-analytics/product/types.ts`
  - added in-memory repository boundary:
    `src/lib/trader-analytics/product/repository.ts`
  - added fixture-backed saved trades/reports:
    `src/lib/trader-analytics/product/sample-data.ts`
  - added production no-export guardrails:
    `src/lib/trader-analytics/product/production-guardrails.ts`
  - added selectors and view helpers for filters, metric drill-down, latest vs
    prior comparison, behavior trends, focus queue, and trade detail evidence:
    `src/lib/trader-analytics/product/selectors.ts`
  - added rule tracker templates/evaluations:
    `src/lib/trader-analytics/product/rule-tracker.ts`
  - added import preview validation:
    `src/lib/trader-analytics/product/import-preview.ts`
  - added production `/analytics` route with no raw JSON and no export controls
  - added `/trades/[tradeId]` execution-only trade review route
  - linked `/analytics` from the app home page
  - added product docs:
    `src/docs/trader-analytics-production-safety-checklist.md`,
    `src/docs/trader-analytics-import-sync-plan.md`, and
    `src/docs/trader-analytics-market-context-add-on-plan.md`
  - added focused coverage:
    `src/lib/trader-analytics/__tests__/end-user-product-roadmap.test.ts`
  - focused verification passed:
    `npx vitest run src/lib/trader-analytics/__tests__/end-user-product-roadmap.test.ts`
    with `9` tests and `npx tsc --noEmit`
  - `npm run build` passed and produced `/analytics` and `/trades/[tradeId]`
  - `npm run lint` passed with `0` errors and the same `4` pre-existing
    warnings
  - full verification passed:
    `npm run verify:all` with `71` files / `656` tests plus the focused
    shared-engine, Layer 2, and Layer 3 checkpoints
  - local production smoke passed for:
    `GET /analytics`, `GET /trades/trade-rapid-fire`, and `GET /`
  - the roadmap in
    `src/docs/end-user-trader-analytics-product-roadmap.md` is marked complete
    for the fixture/in-memory product prototype
  - next real product step is replacing the fixture/in-memory repository with
    real authenticated storage once backend/auth choices are made

### 2026-04-16 Post-Merge Follow-Up Resume Point

The active roadmap branch has shifted from expansion-first work to the
maintainability-first audit order in `src/docs/audit-report-april-16.md`.

The audit-ordered maintainability pass is complete, and the first dedicated
post-merge follow-up PR is now complete too.

Completed in this session:

- Phase 1:
  `PatternInput` now has grouped context sections with a temporary flat
  compatibility layer, and `PatternMetadata` now carries richer semantics plus
  registry validation coverage.
- Phase 2:
  normalization suppression now splits safe metadata-inferred broader-lineage
  dominance from true manual exceptions, with integrity tests guarding the
  rule graph.
- Phase 3:
  the scaling-quality family was split into composition-driven lane files plus
  a final assembly guard, and the redundancy review now lives in
  `src/docs/scaling-pattern-redundancy-review-april-16.md`.
- Phase 4:
  the breakout / chase / extension entry lane was audited, a real bug was
  fixed where `breakout_chase_entry_structure` had collapsed into the same
  logic as `overextended_chase_entry_structure`, and threshold diagnostics were
  made truthful through a shared helper path.
- Phase 5:
  focused normalization invariants were added, layer-boundary audit notes were
  written, and active naming drift was cleaned toward
  `trader-improvement-system`.
- Phase 6:
  the future UI work remains intentionally deferred, with only a lightweight
  plan captured in `src/docs/future-app-surface-plan.md`.

Completed after the merge-ready audit pass:

- The temporary flat `PatternInput` compatibility layer has been fully removed.
- Layer 2 production consumers now read grouped context access only.
- Test helpers, fixtures, and the Layer 2 verify script now use grouped
  `PatternInput` shape directly.
- `buildPatternInput(...)` now returns only the grouped contract, and the
  builder regression test locks that grouped-only runtime shape.
- `pattern-suppression-rules.ts` is now a thin Layer 3 entrypoint with the
  suppression registry split into smaller modules for:
  suppression groups,
  manual entry dominance,
  manual position dominance,
  manual scaling dominance,
  manual exit dominance,
  metadata-inferred dominance assembly,
  and lookup helpers.
- Follow-up verification passed:
  `npm test`,
  `verify:layer2`,
  `verify:layer3`,
  `npx tsc --noEmit`.

Best next step from here:

- keep follow-up PRs narrow
- continue splitting large normalization registries mechanically rather than
  behaviorally, with `pattern-metadata.ts` the next likely compression target
- continue shrinking manual suppression only where metadata can prove richer
  same-lineage dominance safely

Final verification after the full audit pass:

- `npm.cmd test` passed
- `npm.cmd run verify:layer2` passed
- `npm.cmd run verify:layer3` passed
- `npx.cmd tsc --noEmit` passed

PR review follow-up on the same branch is now complete too:

- `pattern-suppression-rules.ts` no longer requires a pre-existing manual pair
  before metadata can infer safe broader-lineage suppression
- metadata-driven suppression now explicitly covers:
  legacy-calibrated broader-lineage pairs,
  repeated-cycle overlays,
  recovery overlays,
  support/resistance overlays,
  and other safe richer journey-scope overlays
- true manual exceptions remain for cross-family bridges and asymmetric
  storyline jumps that metadata still cannot prove safely
- `PatternInput` now carries an explicit TODO note for removing the temporary
  flat compatibility layer after grouped-context migration finishes
- follow-up verification passed again:
  `npm.cmd test`,
  `npm.cmd run verify:layer2`,
  `npm.cmd run verify:layer3`,
  `npx.cmd tsc --noEmit`

Best next step from here:

1. Keep the current maintainability gains stable and use the new metadata,
   invariant tests, and scaling-family structure as the baseline before adding
   more pattern families.
2. When new work resumes, prefer the current roadmap branch already described in
   `src/docs/behavior-coverage-audit.md` and the pattern catalog, but only add
   new interpretation surface if it does not reintroduce rule debt or pattern
   sprawl.

As of `2026-04-14` the repo is no longer just planning the layered architecture.

The practical state is:

- Layer 1 raw trade timeline is implemented with broad derived-signal coverage
- `PatternInput` exists as the Layer 1 -> Layer 2 contract
- Layer 2 pattern detection is implemented across multiple pattern families
- Layer 3 normalization is implemented with priority ordering, suppression, and one-primary-per-family behavior
- Layer 4 scoring is now live as a deterministic scoring, trace, and calibration layer
- the first behavior-analysis bridge now translates scoring truth into named behavior signals
- the first coaching bridge now produces deterministic structured trade-coaching output from behavior truth
- the first trader-level multi-trade profile layer now aggregates recurring behaviors, identity, session pressure, and behavior trends across trades
- the newest Layer 4 work has been strengthening scoring truth, traceability, dominance control, behavior prioritization, one-issue coaching focus enforcement, and trader-level aggregation

This means the current project is best understood as:

not a blank rebuild,
but an actively working layered detection + normalization + scoring system
with the first deterministic behavior/coaching bridge now in place.

### 2026-04-15 Trader-Behavior Modular Extraction Resume Point

The main active maintainability branch is now the safe modular extraction of:

- `src/lib/trader-behavior/builders/build-trader-behavior-profile.ts`

Latest session handoff note:

- `code-updates-april-15.md`
  - use this if a future session wants the detailed list of code/doc changes
    made during the April 15, 2026 chat before returning to the main roadmap

Completed extraction passes so far:

- `src/lib/trader-behavior/builders/profile-aggregation.ts`
  - owns:
    - `aggregatedBehaviors`
    - `behaviorHistory`
    - `mostFrequentWeaknesses`
    - `mostDestructiveBehaviors`
    - `improvingBehaviors`
    - `emergingStrengths`
    - `sessionWeaknesses`
    - `sessionStrengths`
    - `improvingTrends`
    - `deterioratingTrends`
- `src/lib/trader-behavior/builders/profile-confidence-and-identity.ts`
  - owns:
    - `buildProfileConfidence(...)`
    - `buildIdentity(...)`
- `src/lib/trader-behavior/builders/profile-development.ts`
  - owns:
    - `buildDevelopmentPriorities(...)`
    - `buildSessionDevelopmentInsights(...)`
    - `buildDevelopmentPlan(...)`
    - `buildProfileSummary(...)`
- `src/lib/trader-behavior/builders/profile-progress.ts`
  - owns:
    - analysis windows
    - behavior progress windows
    - destructive / improving streak detection
    - relapse / stabilization detection
    - regression / emerging-risk / fading-strength detection
    - progress scoring
    - intervention readiness and priority-effectiveness signals
- `src/lib/trader-behavior/builders/profile-interventions.ts`
  - owns:
    - intervention-period resolution
    - before / during / after intervention evaluation windows
    - intervention effectiveness scoring
    - focus-cycle construction
    - plan-adherence, drift, and mismatch signals
- `src/lib/trader-behavior/builders/profile-adaptive-development.ts`
  - owns:
    - adaptive development planning
    - focus continuation vs rotation decisions
    - protection / de-escalation / escalation prioritization
    - intervention summary construction

Important continuity note:

- the development extraction initially broke the main builder because
  `roundToTwo(...)` was still needed by non-development logic
- that was fixed in the same pass by restoring the shared helper and the still-used
  type imports in the main builder
- the progress extraction then moved the full progress / trend lane into
  `profile-progress.ts`
- the intervention extraction then moved the intervention / focus-cycle lane into
  `profile-interventions.ts`
- `profile-interventions.ts` intentionally reuses the exported progress-window helpers from
  `profile-progress.ts` instead of rebuilding that math in a second place
- the adaptive-planning extraction then moved the focus-rotation / next-focus /
  intervention-summary lane into `profile-adaptive-development.ts`
- the final orchestration cleanup then reduced
  `build-trader-behavior-profile.ts` to a thinner coordinator with:
  - explicit options type
  - ordered-feedback normalization helper
  - computation-vs-assembly separation
- current state after the latest pass:
  - `npm.cmd test -- src/lib/trader-behavior/__tests__/build-trader-behavior-profile.test.ts` passes
  - `npx tsc --noEmit` passes
  - `npm.cmd run build` passes

What still remains in `build-trader-behavior-profile.ts`:

- thin top-level orchestration only

Best next safe extraction step:

1. trader-behavior modular extraction is now functionally complete for this branch
2. avoid reopening the extracted modules unless a regression or real simplification opportunity appears
3. the next decision is whether to:
   - do small maintainability polish only if a concrete pain point appears, or
   - return to broader intelligence-system expansion as the higher-value lane

Current likely next implementation direction if resuming after this chat:

1. do not spend another session on trader-behavior modularization unless a real regression or design pain appears
2. resume higher-value intelligence expansion instead of more structural cleanup
3. use this order for deciding what to build next:
   - read this project log first
   - read `code-updates-april-15.md` for the detailed April 15 session handoff
   - consult `src/docs/behavior-coverage-audit.md`
   - if no regression is found, prefer the broader intelligence-expansion lane already called out in the audit/log:
     richer cross-family lifecycle stories, stronger constructive whole-trade summaries, and stronger exit-side composites

Rule for the next resume:

- do not re-open already completed aggregation / confidence / development passes
  unless a regression is found
- continue from the current modular extraction state, not from the earlier monolith

---

## Current Workspace State

As of the latest local read:

- `src/` contains major in-progress system work that is still uncommitted
- `package.json`, `package-lock.json`, and `tsconfig.json` also have local changes
- `vitest.config.ts` exists as new local test setup work

Important implication:

future sessions should treat the current local workspace,
not old assumptions,
as the source of truth.

Always inspect current files before deciding what is complete.

---

## Why This File Helps

The existing docs already explain the architecture well.

What they do not do as directly is keep one compact running record of:

- what has changed recently
- what is already strong
- what is still missing
- what the next best implementation targets are

So yes, this file is useful.

It should stay concise and practical.

Related focused planning doc:

- `src/docs/behavior-coverage-audit.md`

---

## Current System Read

### Stronger Now

- Layer 1 is no longer just basic raw trade assembly
- Layer 1 now captures much richer factual context around entries, adds, reductions, post-exit behavior, lifecycle milestones, and danger windows
- Layer 2 now includes not only isolated structural patterns but also several management-sequence patterns
- Layer 3 now has real overlap handling, family primary anchoring, canonical regression coverage, and a cleaner contract for later layers

### Still Developing

- richer positive management storylines
- more nuanced multi-step trade-management sequences
- deeper early-exit / missed-opportunity coverage
- more complete risk-management story coverage
- broader entry subtype coverage beyond the first extension vs pullback split

---

## Major Implementation Updates

### Layer 1 Additions

The following new factual builders were added or significantly expanded:

- `build-between-execution-price-behavior-signals.ts`
- `build-reduction-readd-sequence-signals.ts`
- `build-profit-protection-derived-signals.ts`
- `build-partial-exit-outcome-signals.ts`
- `build-entry-context-derived-signals.ts`
- `build-trade-lifecycle-milestone-signals.ts`
- `build-add-context-derived-signals.ts`
- `build-reduction-context-derived-signals.ts`
- `build-post-exit-derived-signals.ts` was expanded with richer full-exit aftermath facts
- `build-danger-window-derived-signals.ts`
- `build-readd-outcome-signals.ts`

Layer 1 now captures stronger factual truth around:

- pre-entry context
- add behavior
- reduction behavior
- reduction to re-add sequences
- profit protection and giveback
- partial-exit aftermath
- re-add aftermath before the next action
- full-exit aftermath
- lifecycle milestones
- danger windows between peak open profit and later drawdown

### PatternInput / Layer 1 to Layer 2 Bridge

`PatternInput` was expanded substantially so Layer 2 can use richer factual aggregates without touching raw timeline objects directly.

PatternInput now includes stronger coverage for:

- entry context
- add context
- reduction context
- re-entry-after-trim context
- post-exit continuation / adverse followthrough
- danger-window facts
- early-adversity-to-recovery facts
- giveback / peak open profit context
- re-add sequence context

### Layer 2 Additions

#### Entry / Exit / Management Patterns

Added or expanded patterns include:

- `entry_after_recent_run_up`
- `entry_after_recent_drop`
- `late_favorable_extension_entry_structure`
- `constructive_pullback_entry_structure`
- `disciplined_favorable_extension_entry_structure`
- `breakout_entry_structure`
- `measured_favorable_extension_entry_structure`
- `overextended_chase_entry_structure`
- `breakout_chase_entry_structure`
- `failed_breakout_entry_structure`
- `weak_pullback_entry_structure`
- `deep_constructive_pullback_entry_structure`
- `deep_weak_pullback_entry_structure`
- `peak_profit_giveback_structure`
- `partial_exit_with_adverse_followthrough`
- `missed_post_exit_continuation`
- `exit_avoided_adverse_followthrough`
- `defensive_exit_after_deterioration`
- `premature_final_exit_after_constructive_management`
- `fearful_exit_after_weakening`
- `revenge_adding_after_weakness`
- `revenge_adding_with_failed_profit_protection`
- `disciplined_defensive_exit`
- `stabilized_recovery_with_constructive_final_exit`
- `stabilized_recovery_with_premature_final_exit`

#### Reduction / Risk Patterns

- `reduction_into_strength`
- `reduction_into_weakness`
- `profit_protection_present`
- `timely_risk_response_after_peak_profit`
- `timely_risk_response_with_profit_protection`
- `failed_profit_protection_structure`
- `reduction_after_recent_run_up`
- `reduction_after_recent_drop`
- `held_through_danger_after_peak_profit`
- `delayed_risk_response_after_peak_profit`
- `delayed_risk_response_with_failed_profit_protection`

#### Scaling / Sequence Patterns

- `readd_after_reduction`
- `adding_above_prior_basis`
- `add_into_strength`
- `add_into_weakness`
- `add_after_recent_run_up`
- `add_after_recent_drop`
- `balanced_scaling_with_profit_protection`
- `constructive_readd_after_reduction`
- `balanced_management_with_constructive_exit`
- `recovery_with_balanced_management_and_constructive_final_exit`
- `balanced_management_with_premature_final_exit`
- `recovery_with_balanced_management_and_premature_final_exit`
- `balanced_management_with_stop_like_forced_exit_after_breakdown`
- `balanced_management_with_stop_like_forced_exit_before_rebound`
- `recovery_with_balanced_management_and_stop_like_forced_exit_after_breakdown`
- `recovery_with_balanced_management_and_stop_like_forced_exit_before_rebound`
- `trim_into_strength_with_constructive_final_exit`
- `timely_profit_protection_with_constructive_final_exit`
- `recovery_with_trim_into_strength_and_constructive_final_exit`
- `recovery_with_timely_profit_protection_and_constructive_final_exit`
- `underutilized_winner_with_constructive_exit`
- `recovery_to_underutilized_winner_with_constructive_exit`
- `underutilized_winner_with_timely_profit_protection_and_constructive_final_exit`
- `recovery_to_underutilized_winner_with_timely_profit_protection_and_constructive_final_exit`
- `underutilized_winner_with_premature_final_exit`
- `recovery_to_underutilized_winner_with_premature_final_exit`
- `underutilized_winner_with_missed_final_continuation`
- `recovery_to_underutilized_winner_with_missed_final_continuation`
- `timely_trim_into_strength_with_constructive_final_exit`
- `recovery_with_timely_trim_into_strength_and_constructive_final_exit`
- `add_into_strength_with_constructive_final_exit`
- `recovery_with_add_into_strength_and_constructive_final_exit`
- `add_into_strength_with_timely_profit_protection_and_constructive_final_exit`
- `recovery_with_add_into_strength_and_timely_profit_protection_and_constructive_final_exit`
- `add_into_strength_with_missed_final_continuation`
- `recovery_with_add_into_strength_and_missed_final_continuation`
- `timely_risk_response_with_stop_like_forced_exit_after_breakdown`
- `timely_risk_response_with_stop_like_forced_exit_before_rebound`
- `recovery_with_timely_risk_response_and_stop_like_forced_exit_after_breakdown`
- `recovery_with_timely_risk_response_and_stop_like_forced_exit_before_rebound`
- `trim_readd_with_constructive_final_exit`
- `trim_readd_with_missed_final_continuation`
- `constructive_recovery_after_early_adversity`
- `recovery_after_early_adversity_with_failed_protection`
- `recovery_after_early_adversity_with_stabilized_management`
- `repeated_trim_readd_with_constructive_management`
- `repeated_trim_readd_with_unstable_management`
- `repeated_rescue_attempts_with_renewed_deterioration`
- `late_chase_reentry_after_constructive_trim`
- `good_pullback_reentry_after_constructive_trim`
- `constructive_reentry_followthrough_after_trim`
- `constructive_reentry_with_constructive_final_exit`
- `constructive_reentry_with_premature_final_exit`
- `constructive_reentry_with_stop_like_forced_exit_after_breakdown`
- `constructive_reentry_with_stop_like_forced_exit_before_rebound`
- `recovery_with_constructive_final_exit_after_constructive_reentry`
- `recovery_with_premature_final_exit_after_constructive_reentry`
- `recovery_with_stop_like_forced_exit_after_constructive_reentry`
- `recovery_with_stop_like_forced_exit_before_rebound_after_constructive_reentry`
- `deteriorating_reentry_after_trim`
- `repeated_trim_readd_with_constructive_reentry_followthrough`
- `repeated_trim_readd_with_deteriorating_reentry`
- `repeated_constructive_reentry_with_premature_final_exit`
- `repeated_balanced_management_with_constructive_final_exit`
- `repeated_balanced_management_with_premature_final_exit`
- `repeated_balanced_management_with_stop_like_forced_exit_after_breakdown`
- `repeated_balanced_management_with_stop_like_forced_exit_before_rebound`
- `repeated_constructive_reentry_with_constructive_final_exit`
- `repeated_constructive_reentry_with_stop_like_forced_exit_after_breakdown`
- `repeated_constructive_reentry_with_stop_like_forced_exit_before_rebound`
- `repeated_deteriorating_reentry_with_defensive_final_exit`
- `repeated_rescue_attempts_with_premature_final_exit_after_constructive_reentries`
- `repeated_rescue_attempts_with_balanced_management_and_premature_final_exit`
- `repeated_rescue_attempts_with_balanced_management_and_constructive_final_exit`
- `repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_after_breakdown`
- `repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_before_rebound`
- `repeated_rescue_attempts_with_constructive_final_exit_after_constructive_reentries`
- `repeated_rescue_attempts_with_stop_like_forced_exit_after_constructive_reentries`
- `repeated_rescue_attempts_with_stop_like_forced_exit_before_rebound_after_constructive_reentries`
- `repeated_rescue_attempts_with_defensive_final_exit_after_deteriorating_reentries`
- `repeated_trim_readd_with_constructive_final_exit`
- `repeated_trim_readd_with_fearful_final_exit`
- `repeated_trim_readd_with_defensive_final_exit_after_deterioration`
- `repeated_rescue_attempts_with_defensive_final_exit_after_deterioration`
- `repeated_trim_readd_with_premature_final_exit`
- `aggressive_adding_with_failed_profit_protection`
- `readd_after_delayed_risk_response`

### Layer 3 Additions

Layer 3 was hardened in several important ways:

- pattern metadata expanded to cover many new Layer 2 patterns
- suppression rules expanded to handle newer management, repeated re-entry, rescue, and richer exit-story overlap
- single-primary-per-family behavior added
- canonical normalization regression tests added
- `primaryPatternsByFamily` added to the normalized output
- `topOverallAnchorPattern` added to the normalized output
- Layer 3 verification script upgraded into a real canonical regression checker

Most recent Layer 3 arbitration tightening focused on:

- richer repeated constructive and deteriorating re-entry storylines beating broader repeated management and final-exit variants
- recovery-aware repeated rescue storylines beating weaker non-recovery repeated variants
- stabilized-recovery exit storylines directly suppressing the broader post-exit descriptors they structurally subsume
- stop-like rebound storylines beating the broader premature-final-exit variants when the exit was genuinely stop-like rather than just early

### Layer 4 Scoring + Feedback Bridge

Layer 4 is now active and split into clear downstream slices.

What is now live:

- scoring input preparation:
  - `PatternScoringInput`
  - `buildPatternScoringInput(...)`
- scoring result building:
  - explicit polarity mapping
  - structural-level weighting
  - normalized-role weighting
  - limited family-aware influence calibration
  - family trace / dominance / suppression reporting
  - scoring stress tests and invariants
- first behavior-analysis bridge:
  - named behavior signals
  - `behaviorPriorityScore`
  - `primaryBehavior`, `secondaryBehaviors`, and `suppressedBehaviors`
  - `behaviorClass`
  - conflict resolution
  - identity-signal candidates
- first coaching bridge:
  - deterministic `fixFirst` / `fixNext`
  - structured evidence-backed coaching output
  - scenario validation for expected behavior/coaching alignment
- first multi-trade intelligence bridge:
  - trader behavior profile aggregation
  - recurring weakness / strength ranking
  - trader identity classification
  - session-segment weakness / strength summaries
  - improving vs deteriorating behavior trends

Important boundary:

- `src/lib/trade-analysis-engine.ts` still stops at Layer 3 on purpose
- scoring, behavior analysis, and coaching are currently downstream consumers, not yet merged into the trade-analysis engine contract

---

## Current Priority View

### Already Strong

- basic trade timeline assembly
- execution sequencing
- position-state tracking
- add / reduce context
- entry subtype coverage around favorable extension vs constructive pullback
- broader entry subtype coverage around constructive continuation vs weak pullback outcomes
- sharper weak-side entry extremes around stretched chase entries and deeper weak pullback entries
- profit-protection context
- post-exit factual context
- family-based Layer 3 normalization
- early sequence-level management failure patterns
- exit-quality storylines around fearful, disciplined defensive, premature, and deterioration-aware exits
- early-adversity recovery and stabilized-recovery storyline coverage
- repeated trim / re-add / re-entry outcome coverage
- recovery-aware repeated rescue plus final-exit storyline coverage
- first positive full-trade constructive storyline coverage
- one-cycle constructive re-entry plus constructive final-exit storyline coverage
- non-readd constructive whole-trade storyline coverage built around timely profit protection
- constructive trim-into-strength whole-trade storyline coverage without needing a re-add cycle
- under-pressed winner constructive storyline coverage
- under-pressed winner timely-protection constructive storyline coverage
- under-pressed winner missed-continuation storyline coverage
- timely trim-into-strength constructive whole-trade storyline coverage
- constructive add-into-strength whole-trade storyline coverage
- constructive add-into-strength timely-protection storyline coverage
- constructive add-into-strength missed-continuation storyline coverage
- deep same-family Layer 3 arbitration inside scaling and exit quality

### Missing And High Priority

- fuller positive management stories that span most of the trade lifecycle beyond the current trim / protect / under-press / add ladder
- more nuanced under-sizing / not-pressing-winners structure beyond the first constructive and timely-protected winner branches
- broader entry subtype coverage beyond the first favorable-extension vs pullback split
- sharper chase-style and weak-pullback extremes above the first entry subtype split
- richer multi-cycle rescue stories beyond the current repeated trim / re-add / re-entry stack
- more cross-family storyline composites that summarize the full management journey

### Later Nice To Have

- more session-aware context
- richer multi-cycle management patterns
- broader canonical sample coverage
- more advanced Layer 3 family arbitration
- Layer 4 scoring once Layers 1-3 feel more complete

---

## Behavior Coverage Snapshot

This section tracks how well the current system covers important trader behaviors.

### Strong

- advantaged vs disadvantaged entry structure
- late favorable extension vs constructive pullback entry subtype coverage
- disciplined favorable extension vs weak pullback entry subtype coverage
- overextended chase vs deep weak pullback extreme-entry subtype coverage
- adding into strength vs adding into weakness
- reduction into strength vs reduction into weakness
- profit protection vs failed profit protection
- post-exit continuation vs adverse followthrough basics
- danger-window risk-response failure basics
- first sequence-level management failure patterns
- fearful vs disciplined defensive vs premature final-exit structure
- stop-like breakdown exits vs fearful or defensive discretionary-style exits
- stabilized recovery with constructive vs premature final exits
- repeated re-entry quality with final-exit outcome structure
- recovery-aware repeated rescue plus final-exit outcome structure
- repeated constructive re-entry with constructive final-exit outcome structure
- trim-into-strength constructive final-exit storyline coverage
- under-pressed winner constructive final-exit storyline coverage
- timely trim-into-strength constructive final-exit storyline coverage
- under-pressed winner premature-final-exit storyline coverage
- add-into-strength premature-final-exit storyline coverage

### Partial

- re-add behavior after reduction
- partial-profit then later deterioration
- balanced constructive management storylines
- constructive trims into strength that still ended well
- deeper rescue / recovery storylines beyond the current recovery-aware repeated stack
- broader cross-family full-trade narratives
- under-sizing / not pressing winners enough

### Weak

- richer good-risk-response sequences
- broader session-aware and context-aware management narratives

### Interpretation

The current system is already much better at detecting:

- failure-side management structure
- risk-response problems
- giveback and danger patterns
- richer exit-quality hierarchy
- recovery-aware repeated rescue and re-entry stories

It is less mature on:

- constructive / positive management stories
- nuanced trade-management story quality across the whole trade lifecycle

Recent addition:

- exit quality now includes `stop_like_forced_exit_after_breakdown` and
  `stop_like_forced_exit_before_rebound`, which use breakdown severity,
  weak-side exit location, capture weakness, and post-exit path to separate
  stop-like exits from broader fearful or defensive discretionary exits
- exit quality now also includes
  `held_through_danger_with_stop_like_forced_exit_after_breakdown`
  `held_through_danger_with_stop_like_forced_exit_before_rebound`
  `delayed_risk_response_with_stop_like_forced_exit_after_breakdown`
  and `delayed_risk_response_with_stop_like_forced_exit_before_rebound`,
  which connect danger-window management failure to stop-like final exits so
  the system can distinguish "never reduced until the break" from
  "responded late, then still got forced out" instead of treating both as
  generic weak exits
- exit quality now also includes
  `stabilized_recovery_with_stop_like_forced_exit_after_breakdown`
  and `stabilized_recovery_with_stop_like_forced_exit_before_rebound`,
  which extend the stabilized-recovery branch into failure-side endings so
  the system can express "recovered from early adversity, then still ended
  in a stop-like weak-side exit" rather than flattening that trade into
  separate recovery and exit fragments
- scaling quality now includes
  `trim_into_strength_with_constructive_final_exit` and
  `recovery_with_trim_into_strength_and_constructive_final_exit`, which add
  constructive trim-into-strength whole-trade stories without requiring a
  later re-add cycle
- entry quality now includes
  `disciplined_favorable_extension_entry_structure` and
  `weak_pullback_entry_structure`, which extend the first extension-vs-pullback
  split into constructive continuation versus weak pullback outcomes
- entry quality now also includes
  `measured_favorable_extension_entry_structure` and
  `deep_constructive_pullback_entry_structure`, which sharpen the positive
  side of that same entry ladder into cleaner continuation and deeper
  pullback-winner subtypes
- entry quality now also includes explicit named breakout families:
  `breakout_entry_structure`,
  `breakout_chase_entry_structure`,
  and `failed_breakout_entry_structure`,
  which move breakout-style behavior beyond indirect proxy coverage
- entry quality now also includes
  `overextended_chase_entry_structure` and
  `deep_weak_pullback_entry_structure`, which sharpen the weak-side extremes
  above the first entry subtype split without pretending we already have full
  breakout/setup labeling
- scaling quality now also includes
  `revenge_adding_after_weakness` and
  `revenge_adding_with_failed_profit_protection`, which turn the older
  weakness-add / failed-protection proxies into explicit named
  averaging-down behavior without pretending trader emotion itself is
  observable
- scaling quality now also includes
  `underutilized_winner_with_constructive_exit` and
  `recovery_to_underutilized_winner_with_constructive_exit`, which turn the
  old raw underutilized-position fact into a real constructive under-pressed
  winner storyline
- scaling quality now also includes
  `timely_trim_into_strength_with_constructive_final_exit` and
  `recovery_with_timely_trim_into_strength_and_constructive_final_exit`,
  which sit above the broader trim-into-strength and timely-protection
  branches when both are structurally true
- scaling quality now also includes
  `timely_profit_protection_with_premature_final_exit` and
  `recovery_with_timely_profit_protection_and_premature_final_exit`, which
  extend the timely-protection branch into early-exit endings so the system
  can distinguish "protected profit in time, but still sold too early" from
  both the broader timely-protection branch and the broader premature-exit
  branch
- scaling quality now also includes
  `trim_into_strength_with_premature_final_exit` and
  `recovery_with_trim_into_strength_and_premature_final_exit`, which extend
  the trim-into-strength branch into early-exit endings so the system can
  distinguish "trimmed well, but still sold too early" from both the broader
  trim-into-strength branch and the broader premature-exit branch
- scaling quality now also includes
  `add_into_strength_with_premature_final_exit` and
  `recovery_with_add_into_strength_and_premature_final_exit`, which extend
  the pressed-winner branch into early-exit endings so the system can
  distinguish "pressed well, but still sold too early" from both the broader
  add-into-strength branch and the broader premature-exit branch
- scaling quality now also includes
  `underutilized_winner_with_premature_final_exit` and
  `recovery_to_underutilized_winner_with_premature_final_exit`, which extend
  the under-pressed winner branch into early-exit endings so the system can
  distinguish "never pressed the winner enough, then still sold too early"
  from both the broader underutilized branch and the broader
  premature-exit branch
- scaling quality now also includes
  `timely_risk_response_with_stop_like_forced_exit_after_breakdown`
  `timely_risk_response_with_stop_like_forced_exit_before_rebound`
  `recovery_with_timely_risk_response_and_stop_like_forced_exit_after_breakdown`
  and `recovery_with_timely_risk_response_and_stop_like_forced_exit_before_rebound`,
  which open a fresher cross-family lane: the trader did react during the
  danger window, but the trade still later ended in a stop-like weak-side
  exit, with separate breakdown-versus-rebound-after-exit outcomes

That means the next best work should probably keep balancing:

- richer failure-side sequence detection
- richer constructive sequence detection
- richer whole-trade journey summaries that combine constructive mid-trade
  management with a later weak finish without only cloning the current
  ladders
- richer cross-family stop-like journeys beyond the first timely-risk-response
  branch

instead of only expanding one side.

---

## Best Next Ideas

These are the strongest next candidates from here:

1. Add richer cross-family trade-journey composites

Examples:

- recovered, managed constructively, then still exited stop-like
- protected profit in time, then still gave back enough to turn the finish
  weak
- constructive build and trim sequence that still ended in a disciplined
  winner or a specific failure mode

Progress:

- the exit lane now includes stop-like journey composites for both
  held-through-danger and delayed-risk-response paths, so the system can say
  whether the forced-feeling exit came from no response at all or from a late
  but insufficient response
- the exit lane now also includes recovery-aware stop-like endings, so it can
  separate "recovered, then later still got forced out" from both the broader
  stabilized-recovery branch and the broader stop-like branch
- the repeated constructive re-entry lane now also includes stop-like
  after-breakdown and before-rebound endings, plus recovery-aware repeated
  rescue counterparts
- Layer 3 now treats the stop-like rebound versions as richer than the
  broader premature-final-exit variants when both are true
- the constructive-management lane now also includes timely-protection
  premature endings, so it can separate "protected well, but still exited too
  early" from both the broader timely-protection branch and the broader
  premature-final-exit branch
- the constructive-management lane now also includes trim-into-strength
  premature endings, so it can separate "trimmed well, but still exited too
  early" from both the broader trim-into-strength branch and the broader
  premature-final-exit branch
- the scaling lane now also includes a broader balanced-management premature
  branch, so it can summarize "managed actively, but still sold too early"
  even when the trade does not cleanly belong to the more specific
  trim/protect/add ladders
- the repeated-cycle scaling lane now also includes a broad constructive
  summary branch, so it can say "this was repeated balanced management that
  still finished constructively" without over-claiming constructive re-entry
  quality when that stronger evidence is not present
- the scaling lane now also includes the broad balanced-management stop-like
  branch, so it can summarize "managed actively, but still later got forced
  out" even when the trade does not cleanly belong to the more specific
  timely-risk-response or re-entry stop-like ladders

2. Add constructive storyline composites

Examples:

- reduced risk during danger window
- trimmed into strength then avoided adverse followthrough
- scaled constructively then protected profit

Progress:

- first constructive storyline pass now includes
  `timely_risk_response_with_profit_protection`
  `constructive_readd_after_reduction`
  and `balanced_management_with_constructive_exit`

- constructive trim-into-strength coverage now also includes
  `trim_into_strength_with_constructive_final_exit`
  and `recovery_with_trim_into_strength_and_constructive_final_exit`

- trim -> re-add -> final exit story coverage has now started with
  `trim_readd_with_constructive_final_exit`
  and `trim_readd_with_missed_final_continuation`

Examples:

- reduced late then re-added then gave back
- trimmed into strength then chased re-entry badly
- partial profit then management deteriorated

3. Expand exit-management coverage

Examples:

- better early-exit / missed continuation variants
- stronger distinction between relief exit vs weak exit vs premature exit

Progress:

- early-exit and defensive-exit coverage now includes
  `defensive_exit_after_deterioration`
  and `premature_final_exit_after_constructive_management`

- fear-vs-discipline exit coverage now also includes
  `fearful_exit_after_weakening`
  and `disciplined_defensive_exit`

5. Add constructive recovery / rescue coverage

Examples:

- recover from early open loss and still protect the trade well
- recover from early adversity but still fail later management

Progress:

- recovery-story coverage now includes
  `constructive_recovery_after_early_adversity`
  and `recovery_after_early_adversity_with_failed_protection`

6. Add multi-cycle management coverage

Examples:

- repeated trim / re-add cycles that still stayed constructive
- repeated trim / re-add cycles that kept destabilizing the trade

Progress:

- multi-cycle storyline coverage now includes
  `repeated_trim_readd_with_constructive_management`
  and `repeated_trim_readd_with_unstable_management`

7. Add sharper re-entry-after-trim coverage

Examples:

- late chase re-entry after a constructive trim
- good pullback re-entry after a constructive trim
- repeated trim / re-add cycles that still ended in a premature final exit

Progress:

- re-entry-after-trim and richer repeated-cycle coverage now includes
  `late_chase_reentry_after_constructive_trim`
  `good_pullback_reentry_after_constructive_trim`
  and `repeated_trim_readd_with_premature_final_exit`

4. Add another coverage-audit pass later

Once a few more storyline composites exist, it will make sense to review:

- what trader behaviors are now represented well
- what behaviors are still underrepresented

---

## Practical System Map

When resuming, these are the most important code entry points.

### Layer 1 Foundation

- `src/lib/raw-trade-timeline/builders/create-raw-trade-timeline.ts`
- `src/lib/raw-trade-timeline/builders/build-trade-timeline.ts`
- `src/lib/raw-trade-timeline/state/build-trade-state-series.ts`

### Layer 1 Derived Signal Expansion

- `src/lib/raw-trade-timeline/derived/build-entry-context-derived-signals.ts`
- `src/lib/raw-trade-timeline/derived/build-add-context-derived-signals.ts`
- `src/lib/raw-trade-timeline/derived/build-reduction-context-derived-signals.ts`
- `src/lib/raw-trade-timeline/derived/build-profit-protection-derived-signals.ts`
- `src/lib/raw-trade-timeline/derived/build-post-exit-derived-signals.ts`
- `src/lib/raw-trade-timeline/derived/build-danger-window-derived-signals.ts`
- `src/lib/raw-trade-timeline/derived/build-reduction-readd-sequence-signals.ts`
- `src/lib/raw-trade-timeline/derived/build-readd-outcome-signals.ts`
- `src/lib/raw-trade-timeline/derived/build-trade-lifecycle-milestone-signals.ts`

### Layer 1 -> Layer 2 Contract

- `src/lib/pattern-input/types/pattern-input.ts`
- `src/lib/pattern-input/builders/build-pattern-input.ts`

### Layer 2 Detection

- `src/lib/pattern-detection/detect-patterns.ts`
- `src/lib/pattern-detection/registry/pattern-definitions.ts`
- `src/lib/pattern-detection/patterns/`

Current Layer 2 families in the repo include:

- execution frequency
- position building
- position reduction
- position structure
- trade duration
- trade excursion
- trade closure
- entry context
- entry quality
- exit quality
- scaling quality

### Layer 3 Normalization

- `src/lib/pattern-normalization/normalize-detected-patterns.ts`
- `src/lib/pattern-normalization/pattern-metadata.ts`
- `src/lib/pattern-normalization/pattern-suppression-rules.ts`
- `src/lib/pattern-normalization/types/normalized-pattern-result.ts`

### Layer 4 Preparation

- `src/lib/pattern-scoring/types/pattern-scoring-input.ts`
- `src/lib/pattern-scoring/builders/build-pattern-scoring-input.ts`
- `src/lib/pattern-scoring/types/pattern-scoring-result.ts`
- `src/lib/pattern-scoring/builders/build-pattern-scoring-result.ts`
- `src/lib/pattern-scoring/builders/build-family-calibration-report.ts`
- `src/lib/behavior-analysis/builders/build-behavior-analysis.ts`
- `src/lib/coaching/builders/build-trade-coaching-output.ts`
- `src/lib/coaching/builders/build-trade-feedback-from-scoring.ts`
- `src/lib/trader-behavior/builders/build-trader-behavior-profile.ts`

---

## Current Testing And Verification Map

The repo already has meaningful regression coverage.

### Main automated checks

- `npm test`
- `npm run verify:layer2`
- `npm run verify:layer3`

### What they protect

- raw timeline and derived-signal builders
- `PatternInput` assembly
- Layer 2 pattern detection behavior
- Layer 3 normalization behavior
- canonical handoff expectations for downstream layers

If a future session changes behavior in Layers 1 to 4,
these checks should be run before claiming the system is still aligned.

---

## 2026-04-14 Layer 4 Resume Instructions

If a future session needs to continue from where this session left off, use this order:

1. Read this section
2. Read:
   - `src/lib/pattern-scoring/builders/build-pattern-scoring-result.ts`
   - `src/lib/pattern-scoring/builders/build-family-calibration-report.ts`
   - `src/lib/behavior-analysis/builders/build-behavior-analysis.ts`
   - `src/lib/coaching/builders/build-trade-coaching-output.ts`
   - `src/lib/coaching/builders/build-trade-feedback-from-scoring.ts`
   - `src/lib/trader-behavior/builders/build-trader-behavior-profile.ts`
3. Read the focused tests:
   - `src/lib/pattern-scoring/__tests__/pattern-scoring-stress.test.ts`
   - `src/lib/behavior-analysis/__tests__/build-behavior-analysis.test.ts`
   - `src/lib/coaching/__tests__/build-trade-coaching-output.test.ts`
   - `src/lib/coaching/__tests__/trade-feedback-scenario-validation.test.ts`
   - `src/lib/trader-behavior/__tests__/build-trader-behavior-profile.test.ts`
4. Treat these truths as stable:
   - scoring is traceable, dominance-aware, and order-independent
   - `scaling_quality` remains the main scoring watchpoint
   - `position_structure` is explicit non-directional structural context in scoring
   - behavior analysis now emits `behaviorPriorityScore`, `behaviorClass`, `primaryBehavior`, `secondaryBehaviors`, `suppressedBehaviors`, and `behaviorIdentityCandidates`
   - coaching now enforces one main directive through `fixFirst`, with optional `fixNext`
   - trade feedback now carries explicit trade context: `tradeId`, `tradeIndex`, `sessionBucket`, and `sessionSegment`
   - trader-level aggregation now exists through `buildTraderBehaviorProfile(...)`
5. Best next Layer 4 work:
   - expand behavior registry coverage beyond the first implemented set
   - widen coaching templates and conflict rules carefully
   - deepen trader-identity coverage beyond the first deterministic identity set
   - expand multi-trade aggregation and recurrence logic beyond the first profile layer

### Latest Trader-Level Update

The trader-level profile layer is now materially beyond the first aggregation pass.

What is now live in `buildTraderBehaviorProfile(...)`:

- hardened profile confidence:
  - `profileConfidence`
  - `profileConfidenceReason`
  - `profileConfidenceSupport`
- stronger recurring-issue prioritization:
  - `developmentPriorities`
  - `developmentPriorityScore`
  - `developmentPriorityReason`
- deterministic trader development planning:
  - `developmentPlan.fixFirst`
  - `developmentPlan.fixSecond`
  - `developmentPlan.protectStrength`
  - `developmentPlan.sessionFocus`
  - `developmentPlan.planReason`
- streak and relapse intelligence:
  - `destructiveStreaks`
  - `improvingStreaks`
  - `relapseSignals`
  - `stabilizationSignals`
- stronger session-specific development output:
  - `sessionDevelopmentInsights`
- reporting-ready summary output:
  - `profileSummary`

Important behavior changes from the earlier first pass:

- trader identity confidence is now capped by profile-level confidence instead of being claimed only from local identity rules
- low sample size now explicitly reduces confidence
- scattered mixed destructive signals now reduce confidence
- repeated high-priority destructive behavior now increases confidence
- recurring mistake ranking is no longer just frequency-led; it now blends frequency, severity, primary-rate, destructive weight, outcome-cost proxy, deterioration pressure, and session concentration
- `topRecurringMistake`, `secondRecurringMistake`, and `improvementPriorityOrder` now follow the stronger development-priority model rather than the old simple weakness order

Latest focused verification command:

- `npm.cmd test -- src/lib/pattern-scoring/__tests__/build-pattern-scoring-input.test.ts src/lib/pattern-scoring/__tests__/build-pattern-scoring-result.test.ts src/lib/pattern-scoring/__tests__/build-family-calibration-report.test.ts src/lib/pattern-scoring/__tests__/pattern-scoring-stress.test.ts src/lib/behavior-analysis/__tests__/build-behavior-analysis.test.ts src/lib/coaching/__tests__/build-trade-coaching-output.test.ts src/lib/coaching/__tests__/trade-feedback-scenario-validation.test.ts src/lib/trader-behavior/__tests__/build-trader-behavior-profile.test.ts`

Latest result:

- `8` files passed
- `41` tests passed

Best next Layer 4 gap after this pass:

- behavior-registry breadth is still the limiting factor
- the new trader-level planning layer is now much stronger, but it can only reason about the behavior ids the single-trade registry already emits

### Follow-up Trader-Level Update

The trader-level layer now also has explicit progress and regression measurement.

What is now live on top of the profile / planning layer:

- deterministic progress scoring:
  - `progressScore`
  - `progressLabel`
  - `progressReason`
  - `progressSupport`
- explicit comparison windows:
  - `analysisWindows.baseline`
  - `analysisWindows.recent`
  - `analysisWindows.fullHistory`
  - `analysisWindows.lowSampleCaution`
- behavior-specific progress tracking:
  - `behaviorProgress`
  - baseline vs recent frequency / severity / primary-rate windows
  - direction / confidence / recurrence-stability output
- broader regression intelligence:
  - `regressionSignals`
  - `emergingRisks`
  - `fadingStrengths`
- intervention-effectiveness foundation:
  - `interventionReadiness`
  - `priorityEffectivenessSignals`
- adaptive planning feedback loop:
  - `adaptiveDevelopmentPlan`
- upgraded summary output:
  - progress headline
  - worsening-risk headline

Important design behavior:

- progress is not a naive average; destructive regression is weighted more heavily than weak positive drift
- low-sample windows now explicitly force caution
- relapse detection remains narrower, while regression intelligence now also catches worsening recurring issues, new destructive behaviors, and fading strengths
- adaptive planning can now keep focus, de-escalate improving issues, and surface escalating risks

Latest focused verification result after this pass:

- `8` files passed
- `46` tests passed

Best next trader-level gap after this follow-up:

- progress and adaptive planning are now real, but they are still behavior-registry limited
- future value will come most from broadening the single-trade behavior set and later tying plan changes to explicit user-selected intervention periods

### Latest Intervention-Aware Trader-Level Update

The trader-development layer now also supports explicit intervention periods and focus cycles.

What is now live:

- explicit intervention-period contracts:
  - `interventionPeriods`
  - explicit `interventionId`
  - target behavior / focus key
  - intervention type
  - goal type
  - start / end trade references
- intervention effectiveness measurement:
  - `interventionEvaluations`
  - before / during / after comparison windows
  - deterministic effectiveness label / score / confidence
- focus-cycle tracking:
  - `focusCycles`
  - `currentFocusCycle`
  - `focusCycleStatus`
- plan adherence / drift intelligence:
  - `planAdherenceSignals`
  - `planDriftSignals`
  - `focusMismatchWarnings`
- intervention-aware adaptive planning:
  - `currentInterventionRecommendation`
  - `shouldContinueFocus`
  - `shouldRotateFocus`
  - `rotationReason`
  - `tooEarlyToJudge`
- reporting-ready intervention summary:
  - `interventionSummary`

Important current assumption:

- explicit intervention periods are passed into `buildTraderBehaviorProfile(...)` as structured input
- the trader-behavior layer resolves them against trade ids / indexes and evaluates them deterministically
- no UI or persistence model is assumed yet; this is the analysis contract and evaluation logic only

Latest focused verification result after this pass:

- `8` files passed
- `51` tests passed

Best next gap after this intervention-aware pass:

- intervention analytics are now explicit, but they still depend on manually supplied intervention periods
- the next likely value is better upstream behavior coverage plus future workflow support for creating and storing those periods cleanly

### Latest Behavior-Registry Coverage Expansion

The next high-value Layer 4 limiter was the single-trade behavior registry, so the latest pass expanded that registry and carried the new coverage all the way through coaching, profile logic, and intervention-aware planning.

New behavior ids now live:

- destructive:
  - `failed_breakout_chasing`
  - `averaging_down`
  - `premature_exit`
  - `undersized_winner`
- strengths:
  - `strong_loss_containment`
  - `strong_winner_management`

Why this exact set was chosen:

- it improves trader-development quality more than adding more neutral structural descriptors
- it adds both mistake-side and strength-side coverage, which matters for adaptive planning and intervention evaluation
- it hardens several real mixed-trade cases the product cares about:
  - good entry but poor winner management
  - weak add quality with disciplined damage control
  - breakout chase that explicitly fails
  - clean winner handling vs under-monetized winners
- it is a better next expansion than adding broader vague buckets, because these behaviors are directly actionable and intervention-targetable

What now flows end-to-end:

- behavior analysis:
  - deterministic detection, classification, priority, and conflict handling for the new behaviors
- coaching:
  - focused templates for each new behavior without collapsing into vague multi-issue advice
- trader profile layer:
  - recurring weakness / strength ranking
  - identity interaction where justified
  - development priorities
  - development plan / adaptive development plan
  - intervention-readiness and intervention-effectiveness signals
- intervention-aware planning:
  - explicit intervention periods can now target the new destructive behaviors and measure before/during performance

Important calibration note:

- descriptive structural context alone still should not emit directional behavior labels
- the new behaviors were wired through directional pattern combinations and conflict rules rather than through neutral structural facts by themselves

Latest focused verification result after this pass:

- `8` files passed
- `61` tests passed

Best next coverage gap after this pass:

- the system is materially stronger on breakout-chase, rescue-add, winner-management, and defensive-containment behavior
- the biggest remaining behavior gap is still broader late-management / overholding / de-risk refusal coverage plus richer add-quality subtyping beyond the current average-down lane

---

## Current Strategic Read

The system is strongest now in:

- factual trade reconstruction
- deterministic structural detection
- failure-side management patterns
- risk-response and giveback coverage
- first sequence-level storyline patterns
- initial Layer 3 prioritization and overlap handling

The system is still developing most in:

- constructive management storylines
- deeper repeated-cycle trim / re-add stories
- richer early-exit and missed-opportunity variants
- stronger full-trade storyline composites
- future scoring / coaching layers that consume the normalized outputs

Recent Layer 1 to Layer 3 update:

- added the first reclaim-entry fact bundle and named reclaim-entry family
- Layer 1 now captures recent pre-entry reference reclaim facts
- Layer 2 now detects `reclaim_entry_structure` and
  `failed_reclaim_entry_structure`
- Layer 3 now prioritizes reclaim stories above broader entry-quality overlap
- Layer 2 now also detects `mean_reversion_entry_structure` and
  `failed_mean_reversion_entry_structure` on top of the deeper pullback plus
  reclaim lane
- Layer 2 now also detects the first honest session-aware setup lane:
  `market_open_breakout_entry_structure`,
  `market_open_breakout_chase_entry_structure`, and
  `failed_market_open_breakout_entry_structure`
- Layer 2 now also detects `market_open_reclaim_entry_structure` and
  `failed_market_open_reclaim_entry_structure`
- Layer 1 now also carries a small true opening-range fact bundle for first
  entry context during `market_open` / `open`
- Layer 2 now also detects `opening_range_breakout_entry_structure`,
  `opening_range_breakout_chase_entry_structure`, and
  `failed_opening_range_breakout_entry_structure`
- Layer 1 now also captures opening-range reclaim facts above the true opening
  range boundary after the initial opening window
- Layer 2 now also detects `opening_range_reclaim_entry_structure` and
  `failed_opening_range_reclaim_entry_structure`
- Layer 2 now also detects `balanced_management_with_missed_final_continuation`
  and `recovery_with_balanced_management_and_missed_final_continuation`
- Layer 2 now also detects
  `repeated_balanced_management_with_missed_final_continuation` and
  `repeated_rescue_attempts_with_balanced_management_and_missed_final_continuation`
- Layer 2 now also detects
  `timely_risk_response_with_defensive_final_exit_after_deterioration`
  and
  `recovery_with_timely_risk_response_and_defensive_final_exit_after_deterioration`
- Layer 2 now also detects
  `balanced_management_with_defensive_final_exit_after_deterioration`
  and
  `recovery_with_balanced_management_and_defensive_final_exit_after_deterioration`
- Layer 2 now also detects `balanced_management_with_fearful_final_exit` and
  `recovery_with_balanced_management_and_fearful_final_exit`
- Layer 2 now also detects
  `repeated_balanced_management_with_defensive_final_exit_after_deterioration`
  and
  `repeated_rescue_attempts_with_balanced_management_and_defensive_final_exit_after_deterioration`
- Layer 2 now also detects `repeated_balanced_management_with_fearful_final_exit`
  and
  `repeated_rescue_attempts_with_balanced_management_and_fearful_final_exit`
- Layer 3 now distinguishes the broader active-management missed-continuation
  storyline from the stricter premature-exit branch instead of flattening both
  into the same balanced-management early-exit summary
- Layer 3 now also carries repeated-cycle and recovery-aware repeated-cycle
  versions of that broad missed-continuation summary above the raw repeated
  trim/re-add ingredients
- Layer 3 now also carries the broader active-management defensive-save
  summary above the raw defensive-exit ingredients and below the stricter
  timely-risk-response and stop-like branches
- Layer 3 now also carries repeated-cycle and recovery-aware repeated-cycle
  versions of that broader active-management defensive-save summary above the
  raw repeated defensive-exit ingredients
- Layer 3 now also carries broad fearful-exit management summaries above the
  raw fearful-exit ingredients and below the stricter stop-like weak-side exit
  branches
- Layer 3 now also expresses the â€œprotected profit in time, but later still
  needed a defensive saveâ€ branch instead of flattening it into separate timely
  protection and defensive-exit ingredients
- the system still does not support a full generic opening-range/session
  taxonomy; current session-aware coverage is strongest in the opening-range
  breakout and reclaim lanes plus the earlier broader `market_open` breakout
  and reclaim lanes
- support / resistance should be treated as a near-term Layer 1 design lane,
  but it still needs a short factual-contract pass before implementation so the
  app does not drift into vague level-detection claims
- provider-agnostic candle/session normalization is now an explicit priority
  check for this lane and for the already-built Layer 1-3 work; if hidden
  provider-specific assumptions are found, fixing those takes priority over
  deeper support / resistance feature growth
- that broader code audit has now been run across the current Layer 1-3
  implementation, and the main concrete adjustment was to centralize
  session-bucket normalization into canonical internal labels like
  `market_open`, then apply that normalization in both the top-level raw
  timeline creator and the lower-level timeline builder so future providers do
  not break opening-range and session patterns just by naming sessions
  differently
- the provider boundary is now also harder at the type level: session buckets
  are no longer treated as loose strings inside the normalized Layer 1
  contract, and unknown provider session labels now resolve to an explicit
  `unknown` state instead of leaking arbitrary values upward
- the broader candle contract still looks sound: provider adapters remain
  outside Layer 1 and the current raw candle shape is already provider-agnostic
- EMA / MA context is still useful later, but it is lower-priority than
  support / resistance for trader-facing feedback right now
- the repo now also has a concrete coding bridge for this lane in
  `src/docs/layer1-raw-data/support-resistance-implementation-plan.md`,
  including raw types, PatternInput bridge fields, file layout, and build order

---

## If A Future Session Asks "Where Did We Leave Off?"

The short answer is:

we already moved beyond architecture-only planning,
and we are in the stage of expanding and hardening
the Layer 1 -> Layer 2 -> Layer 3 pipeline.

The most likely next useful work should be one of:

1. pivot to the next strongest genuinely new Layer 1-3 family instead of adding close cousins of the current broad-summary ladders
2. continue the provider/candle-contract audit if any additional hidden session
   or data-availability assumptions appear while support / resistance work grows
3. start the support / resistance lane from the new
   implementation-plan doc by building raw types plus the structural context
   window / reference-level slice
4. if any further hidden provider assumptions are found, treat those fixes as
   immediate priority work before deeper level-engine implementation
5. sharpen Layer 3 arbitration as pattern overlap grows
6. extend verification coverage when new pattern families are added

---

## Working Rules For Future Updates

When this file is updated, prefer:

- high-signal summaries
- major architecture or pattern additions
- concrete next priorities
- one continuity log instead of multiple overlapping mini-logs

Avoid:

- low-value changelog noise
- creating a second incremental changelog file for routine Codex work when this
  project log already captures the meaningful resume state
- repeating the entire detailed architecture
- listing every tiny edit

This file should stay useful and readable.

Default documentation rule:

- use `src/docs/codex-project-log.md` as the running Codex continuity log
- only create a separate `CHANGELOG.md` if the repo later needs a true
  user-facing release history or the user explicitly asks for one

---

## Update Habit

This file should be updated when:

- a meaningful Layer 1 builder is added
- several new Layer 2 patterns are added
- Layer 3 normalization changes materially
- the recommended next priorities change

It does not need to be updated for every tiny edit.

---

## 2026-04-14 Support/Resistance Lane Progress

Support/resistance is now beyond planning and into live Layer 1-3 implementation.

What is now live in Layer 1:

- normalized raw support/resistance types
- structural context window output
- named reference levels:
  - previous day high / low / close
  - premarket high / low / base
- dynamic levels:
  - VWAP
  - EMA 9
  - EMA 20
- first factual pivot detection:
  - tight pivots
  - strict pivots
- first support/resistance ladders
- first merge / touch / reaction / filtering / scoring pass
- first gap-structure detection
- per-execution level relations
- insufficient-candle-data structural flag

What is now bridged into PatternInput:

- first-entry nearest support / resistance prices
- first-entry distance to nearest support / resistance
- first-entry near-support / near-resistance / open-air flags
- first-entry nearest reference-level label
- first-entry VWAP / EMA distance facts
- final-exit support/resistance distance and near-support / near-resistance flags
- reduction counts near support / resistance
- structure-availability flags

What is now live in Layer 2 / Layer 3:

- `entry_near_support_structure`
- `entry_far_from_support_structure`
- `entry_under_resistance_structure`
- `exit_into_support_structure`
- `exit_into_support_with_relief_after_exit`
- `add_into_resistance_structure`

Important current limitation:

- this is an honest first support/resistance-aware slice, not a full breakout-clearance or stacked-resistance engine yet
- the current relation model is strong enough for near-support / under-resistance / exit-into-support patterns
- it is not yet strong enough to claim a full â€œbreakout with room aboveâ€ family without more relation depth

Best next move from here:

1. deepen the raw factual engine with better merge / touch / reaction quality and richer execution-to-level relations
2. then add the next support/resistance-aware Layer 2 families like:
   - breakout-clearance / room-above patterns once relation semantics are stronger
   - richer add-above-resistance vs add-near-resistance split
   - richer exit-into-support variants beyond the first relief-after-exit branch

### Follow-up Update

That next pass is now partly complete too.

What deepened in the raw engine:

- merge now uses weighted level prices instead of plain averaging
- touch clustering is slightly stricter and less prone to counting one continuous probe as too many clusters
- reactions now consider closes as well as excursion extremes
- execution-level relations now include:
  - whether structure exists on both sides
  - distance between nearest support and resistance
  - room to nearest support / resistance

What broadened in PatternInput:

- first-entry bounded-structure flag
- first-entry support/resistance band width
- first-entry nearest resistance-below clearance facts
- add-level relation counts:
  - adds near support
  - adds near resistance
  - adds above resistance
  - adds below support
- add-level above-resistance-with-room counts
- average add distance to nearest support / resistance
- average add room to next resistance

What new support/resistance-aware Layer 2 patterns are now live:

- `entry_far_from_support_structure`
- `add_into_resistance_structure`
- `exit_into_support_with_relief_after_exit`

### Later Follow-up Update

The next raw-relation tightening pass is now live too.

What deepened in the raw engine:

- execution-level relations now distinguish:
  - nearest resistance below the execution
  - distance above that broken resistance
  - whether the execution truly cleared nearby resistance
  - whether room still existed above after that clearance
- this replaces the older ambiguous "above nearest resistance" idea with a
  cleaner breakout-clearance contract

What changed in PatternInput:

- first-entry resistance-clearance facts:
  - `firstEntryNearestResistanceBelowPrice`
  - `firstEntryDistanceAboveNearestResistanceBelowPct`
  - `firstEntryClearedNearestResistanceBelow`
  - `firstEntryHadRoomAboveAfterClearingResistance`
- add-level separation facts:
- `addsAboveResistanceWithRoomCount`
- `averageAddRoomToNextResistancePct`
- `firstEntryResistanceLevelsAboveWithinClusterCount`
- `firstEntryHasStackedResistanceAbove`
- `finalExitSupportLevelsBelowWithinClusterCount`
- `finalExitHasStackedSupportBelow`

What new support/resistance-aware Layer 2 patterns are now live:

- `breakout_with_room_above_structure`
- `add_above_resistance_structure`
- `breakout_into_overhead_resistance_structure`
- `exit_into_support_before_breakdown`
- `add_above_resistance_with_constructive_final_exit`
- `add_above_resistance_with_failed_profit_protection`
- `recovery_with_add_above_resistance_and_constructive_final_exit`
- `recovery_with_add_above_resistance_and_failed_profit_protection`
- `repeated_adds_above_resistance_with_constructive_final_exit`
- `repeated_adds_above_resistance_with_failed_profit_protection`
- `breakout_with_room_above_and_constructive_final_exit`
- `breakout_with_room_above_and_failed_profit_protection`
- `recovery_with_breakout_with_room_above_and_constructive_final_exit`
- `recovery_with_breakout_with_room_above_and_failed_profit_protection`
- `breakout_into_overhead_resistance_with_defensive_final_exit`
- `breakout_into_overhead_resistance_with_failed_profit_protection`
- `recovery_with_breakout_into_overhead_resistance_and_defensive_final_exit`
- `recovery_with_breakout_into_overhead_resistance_and_failed_profit_protection`
- `exit_into_stacked_support_with_relief_after_exit`
- `exit_into_thin_support_before_breakdown`
- `exit_into_resistance_with_reversal_after_exit`
- `exit_into_resistance_before_breakout`
- `trim_into_resistance_with_constructive_final_exit`
- `trim_into_resistance_with_premature_final_exit`
- `balanced_management_with_take_profit_into_resistance_and_constructive_final_exit`
- `balanced_management_with_take_profit_into_resistance_and_premature_final_exit`
- `stabilized_recovery_with_exit_into_stacked_support_and_relief`
- `stabilized_recovery_with_exit_into_resistance_and_reversal`
- `stabilized_recovery_with_exit_into_resistance_before_breakout`
- `recovery_with_trim_into_resistance_and_constructive_final_exit`
- `recovery_with_trim_into_resistance_and_premature_final_exit`
- `recovery_with_balanced_management_and_take_profit_into_resistance_and_constructive_final_exit`
- `recovery_with_balanced_management_and_take_profit_into_resistance_and_premature_final_exit`
- `stabilized_recovery_with_exit_into_thin_support_before_breakdown`
- `repeated_balanced_management_with_exit_into_stacked_support_and_relief`
- `repeated_balanced_management_with_exit_into_thin_support_before_breakdown`
- `repeated_balanced_management_with_trim_into_resistance_and_constructive_final_exit`
- `repeated_balanced_management_with_trim_into_resistance_and_premature_final_exit`
- `repeated_balanced_management_with_take_profit_into_resistance_and_constructive_final_exit`
- `repeated_balanced_management_with_take_profit_into_resistance_and_premature_final_exit`
- `repeated_rescue_attempts_with_balanced_management_and_exit_into_stacked_support_and_relief`
- `repeated_rescue_attempts_with_balanced_management_and_exit_into_thin_support_before_breakdown`
- `repeated_rescue_attempts_with_balanced_management_and_trim_into_resistance_and_constructive_final_exit`
- `repeated_rescue_attempts_with_balanced_management_and_trim_into_resistance_and_premature_final_exit`
- `repeated_rescue_attempts_with_balanced_management_and_take_profit_into_resistance_and_constructive_final_exit`
- `repeated_rescue_attempts_with_balanced_management_and_take_profit_into_resistance_and_premature_final_exit`

What got cleaner:

- `add_into_resistance_structure` now means crowding into nearby resistance
  rather than mixing together "near resistance" and "already above broken
  resistance"

Best next move from here:

1. keep deepening raw execution-to-level relation quality before adding many more named patterns
2. then add the next honest support/resistance-aware families like:
   - reduction / take-profit into resistance branches beyond the first one-cycle and repeated trim-aware slices
   - deeper breakout-into-stacked-resistance nuance beyond the first branch
   - repeated-cycle support/resistance-aware reduction or add-above-resistance branches if they still add real signal
3. hierarchy reminder:
   - the new `balanced_management_with_take_profit_into_resistance_*` summaries sit above broad balanced-management exits
   - the stricter `trim_into_resistance_*` and `recovery_with_trim_into_resistance_*` branches still outrank those broader summaries when both are present
   - the same hierarchy now applies in the repeated lane: `repeated_*_take_profit_into_resistance_*` summaries sit above broad repeated balanced-management exits, while the stricter repeated `trim_into_resistance_*` branches still outrank them

## 2026-05-05 - Prototype Analysis Panel Wired Into Import Dry Run

What changed:

- Added `buildCsvDryRunPrototypeAnalysisPanel(...)` in
  `src/lib/trader-analytics/product/functional-readiness.ts`.
- Exported the panel and lightweight decision-review snapshot types from
  `src/lib/trader-analytics/index.ts`.
- Rendered a new `Prototype Analysis` section in
  `app/import-dry-run/import-dry-run-client.tsx`.
- Updated the dry-run route smoke contract so the panel is required.
- Added unit tests for:
  - ready/prototype-generated imports
  - blocked imports
  - supplied daily/4h decision-review facts
- Added Playwright assertions that the route shows the panel and does not imply
  production writes.

Important boundary:

- The browser dry-run route does not import server-only trade-analysis or
  levels-system code.
- The panel shows execution-autopsy findings now.
- Daily/4h decision-review facts can be attached later as precomputed snapshots
  from `TradeAnalysisSummary.decisionReview`.
- VWAP/EMA feedback and lower-timeframe support/resistance coaching remain
  disabled/deferred.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/trader-functional-product-readiness.test.ts --reporter=dot`
- `npx vitest run src/lib/trader-analytics/__tests__/trader-import-automated-qa-harness.test.ts --reporter=dot`
- `npx tsc --noEmit --pretty false`
- `npm run build`
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop`
- `npm test -- --reporter=dot`

Result:

- 87 Vitest files passed, 803 tests passed.
- The import-dry-run desktop Playwright suite passed.

Best next move:

1. Add fee/commission visibility to import review without changing gross-only
   scoring.
2. Add the real CSV calibration guide.
3. Add mobile and review-warning Playwright coverage for the prototype analysis
   panel.
4. Decide whether to create a server/API bridge that transforms
   `TradeAnalysisSummary.decisionReview` into
   `CsvDryRunPrototypeDecisionReviewInput` for completed imported trades.

## 2026-05-05 - Fee And Commission Visibility Added To Import Dry Run

What changed:

- Added `CsvDryRunCostVisibilityPanel` and `CsvDryRunCostVisibilityItem` to
  `src/lib/trader-analytics/product/types.ts`.
- Added `buildCostVisibility(...)` inside
  `src/lib/trader-analytics/product/csv-dry-run-workflow.ts`.
- `CsvDryRunImportExperience` now includes `costVisibility`.
- `/import-dry-run` now renders `Fee / Commission Visibility`.
- The dry-run route smoke contract now requires that panel.
- Tests now cover a CSV with `Commission`, `Fees`, `Amount`, and `Currency`.

Important boundary:

- Fees, commissions, broker net amount, and currency are import-review context.
- Execution feedback scoring remains `gross_execution_pnl_only`.
- `execution_feedback_summary_v1` was not changed to include net P/L.
- No production persistence or export behavior was added.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts src/lib/trader-analytics/__tests__/trader-import-automated-qa-harness.test.ts --reporter=dot`
- `npx tsc --noEmit --pretty false`
- `npm run build`
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop`
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-mobile`
- `npm test -- --reporter=dot`

Result:

- 87 Vitest files passed, 804 tests passed.
- Desktop and mobile import-dry-run Playwright suites passed.

Note:

- Two levels/trade-analysis integration tests passed in isolation but timed out
  under full-suite worker load at the default 5 seconds. Their individual
  timeouts were raised to 15 seconds so full-suite verification remains
  bounded and stable.

Best next move:

1. Add review-warning Playwright coverage for `Prototype Analysis` and
   `Fee / Commission Visibility` if that state is not covered elsewhere.
2. Decide whether to add a server bridge that attaches
   `TradeAnalysisSummary.decisionReview` snapshots to the dry-run panel.

## 2026-05-05 - Real CSV Calibration Guide Added

What changed:

- Added `src/docs/trader-real-csv-calibration-guide.md`.

What it covers:

- safe anonymization for broker execution CSVs
- columns that matter for import calibration
- what not to send
- broker notes
- expected calibration outputs
- bounded non-watch verification commands
- boundary reminder that this app imports executions, while `levels-system`
  owns candles, support/resistance, VWAP, EMA, and market structure

Best next move:

1. Add review-warning Playwright coverage for `Prototype Analysis` and
   `Fee / Commission Visibility` if needed.
2. Decide whether to add a server bridge that attaches
   `TradeAnalysisSummary.decisionReview` snapshots to the dry-run panel.

## 2026-05-05 - Dry-Run Decision Review Bridge Implemented

Plan:

- Added `src/docs/trader-decision-review-bridge-implementation-plan.md`.

What changed:

- Added server-only bridge:
  `src/lib/trader-analytics/server/build-csv-dry-run-decision-review-bridge.ts`
- Added API route:
  `app/api/import-dry-run/decision-review/route.ts`
- Added deterministic CSV scenarios:
  `src/lib/trader-analytics/__fixtures__/decision-review-csv-scenarios.ts`
- Updated `/import-dry-run` so `Prototype Analysis` has a button-driven
  `Run Review` path.
- Added route/UI tests for:
  - blocked imports
  - open-position review imports
  - attached decision-review snapshots
  - fee/commission visibility
- Added boundary tests proving the browser client does not import
  levels-system or trade-analysis server modules.

Important boundary:

- The client posts dry-run input to a server route.
- The server route returns lightweight decision-review snapshots.
- The browser does not fetch candles, calculate support/resistance, calculate
  VWAP/EMA, or run market-structure analysis.
- Market-context usage only counts when the snapshot source is
  `levels_system_daily_4h`.

Verification completed during implementation:

- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot`
- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-api-route.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot`
- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-boundary.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-api-route.test.ts --reporter=dot`
- `npx tsc --noEmit --pretty false`
- `npm run build`
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop`
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-mobile`
- `npm test -- --reporter=dot`

Result:

- Focused decision-review/import Vitest: 5 files passed, 33 tests passed.
- Desktop Playwright: 7 tests passed.
- Mobile Playwright: 7 tests passed.
- Full Vitest: 90 files passed, 816 tests passed.

Note:

- Desktop and mobile Playwright should run sequentially because both use port
  `127.0.0.1:3100`.
- Post-verification process check did not show leftover `vitest`, `next build`,
  or Playwright server commands from this branch. Existing unrelated Node
  processes from sibling `levels-system` scripts were still present.

Best next move:

1. Expand decision-review scenarios as more real imported trade examples become
   available.
2. Keep improving the trader-facing wording in `Prototype Analysis`.
3. Later, promote the prototype route into the authenticated persisted import
   flow.

## 2026-05-05 - Decision Review Calibration And Level Grades Added

Plan:

- Added `src/docs/trader-decision-review-real-csv-calibration-plan.md`.

What changed:

- Expanded deterministic CSV decision-review scenarios to include:
  - entry near major daily/4h resistance with limited room
  - entry near support with premature-exit and failed-protection evidence
  - repeated adds after extension
- Added server/internal quality dashboard:
  `src/lib/trader-analytics/server/build-decision-review-quality-dashboard.ts`
- Added markdown formatter for decision-review quality dashboard output.
- Added bounded runner: `npm run calibrate:decision-review`.
- `PatternInputSupportResistanceContext` now carries nearest first-entry
  support/resistance strength bucket, exact source strength label, score, and
  reaction strength.
- `TradeDecisionReview.marketContext` now exposes nearest support/resistance
  strength bucket, exact source strength label, and score.
- Market-context insight wording/evidence now includes graded level context,
  such as `Entry was close to major daily/4h resistance`.
- Updated the real CSV calibration guide, feedback capabilities doc, and
  functional readiness handoff.

Important boundary:

- `levels-system` still owns support/resistance detection and grading.
- This app consumes the returned grade; it does not compute levels locally.
- VWAP/EMA trader-facing feedback remains disabled.
- True real CSV calibration remains gated until anonymized user examples are
  available.

Verification:

- `npx tsc --noEmit --pretty false`
- focused grade/dashboard Vitest: 5 files passed, 19 tests passed
- focused decision-review Vitest: 4 files passed, 17 tests passed
- `npm run calibrate:decision-review -- --generated-at=2026-05-05T12:00:00.000Z`
  passed with 4 deterministic scenarios, 0 review, and 0 fail.
- `npm run build`
- `npm test -- --reporter=dot`

Result:

- Full Vitest passed with 91 files and 822 tests.
- Post-verification process check did not show leftover `vitest`, `next build`,
  or Playwright runner commands from this branch. Existing unrelated Node
  processes from sibling `levels-system` scripts and manual watchlist runtime
  were still present.

Best next move:

1. Add anonymized real broker CSV examples when safe files are available.
2. Convert any real false-positive/false-negative review into a synthetic
   scenario fixture.
3. Promote the dry-run decision-review bridge only after calibration quality is
   reviewed.

### Follow-up Review Quality Tightening

What changed:

- Decision-review market context no longer emits both
  `entry_near_daily_4h_support` and `entry_far_from_daily_4h_support` for the
  same first entry.
- Support/resistance distance evidence now formats level-distance percent
  values directly instead of multiplying them by 100 again.
- Generic no-primary-behavior coaching headlines are replaced with clearer
  market-context headlines when the review has stronger daily/4h facts.
- The decision-review quality dashboard now fails if contradictory support
  insights or the generic fallback headline reappear.

Verification:

- `npx tsc --noEmit --pretty false`
- focused decision-review Vitest: 3 files passed, 14 tests passed
- `npm run calibrate:decision-review -- --generated-at=2026-05-05T12:00:00.000Z`
  passed with 4 deterministic scenarios, 0 review, and 0 fail.
- `npm run build`
- `npm test -- --reporter=dot`

Result:

- Full Vitest passed with 91 files and 822 tests.
- Post-verification process check did not show leftover `vitest`, `next build`,
  Playwright, or dashboard-runner commands from this branch. Existing unrelated
  Node processes from sibling `levels-system` scripts and manual watchlist
  runtime were still present.

### Follow-up Decision Review Runner And Arbitration

What changed:

- Added a deterministic fixture for the target feedback shape:
  first entry near major daily/4h resistance, limited clean room, and a later
  add after much of the move was already used.
- Decision-review headlines now replace stale "adds aligned with strength"
  wording when that strength insight was suppressed by stronger add-risk facts.
- The decision-review quality dashboard now checks required headline fragments
  and stale context-sensitive headline fragments.
- `npm run calibrate:decision-review` now writes
  `artifacts/decision-review-quality/latest.md` by default, or `.json` with
  `--json`.
- The same runner can inspect safe real CSV files with:
  `--csv`, `--broker`, `--max-trades`, `--account-timezone`, `--out`, and
  `--no-write`.

Verification:

- `npx tsc --noEmit --pretty false`
- focused quality dashboard Vitest: 1 file passed, 3 tests passed
- `npm run calibrate:decision-review -- --generated-at=2026-05-05T12:00:00.000Z`
  passed with 5 deterministic scenarios, 0 review, and 0 fail.
- real CSV runner smoke passed with `--csv`, `--broker`, `--max-trades`, and
  custom `--out`.
- `npm run build`
- `npm test -- --reporter=dot`

Result:

- Full Vitest passed with 91 files and 823 tests.
- Post-verification process check did not show leftover `vitest`, `next build`,
  Playwright, or dashboard-runner commands from this branch. Existing unrelated
  Node processes from sibling `levels-system` scripts and manual watchlist
  runtime were still present.

### Import Dry-Run Review Display And Report History

What changed:

- `/import-dry-run` now renders attached decision-review snapshots as
  per-trade review cards inside `Prototype Analysis`.
- Decision-review cards group evidence by market context, entry, adds/scaling,
  exit, trade-window, and other categories.
- Insight evidence now displays as compact chips, so level strength, level
  distance, trade-window MFE/MAE, and add-position facts are easier to inspect.
- Server-side decision-review diagnostics now surface directly in the prototype
  panel when trades are skipped, capped, blocked, or fail analysis.
- `npm run calibrate:decision-review` now writes both the latest report and a
  timestamped history report by default.
- `--no-history` can be used when only the latest/custom output should be
  written.

Verification:

- `npx tsc --noEmit --pretty false`
- focused functional-readiness Vitest: 1 file passed, 13 tests passed
- `npm run calibrate:decision-review -- --generated-at=2026-05-05T12:00:00.000Z`
  passed with 5 deterministic scenarios and wrote both latest and timestamped
  reports.
- `npm run build`
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop`
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-mobile`

Result:

- Desktop import-dry-run Playwright passed with 7 tests.
- Mobile import-dry-run Playwright passed with 7 tests.
- Post-verification process check did not show leftover `vitest`,
  `next build`, Playwright test, or dashboard-runner commands from
  `trader-intelligence-v2`. Existing unrelated sibling levels/watchlist Node
  and Playwright Chromium processes were still present.

### Batch CSV Calibration Added

What changed:

- `npm run calibrate:decision-review` now supports `--csv-dir` for a folder of
  anonymized CSVs.
- Batch mode recursively finds `.csv` files, runs each through the same
  server-only dry-run decision-review bridge, and produces an overall index.
- Default batch outputs:
  - `artifacts/decision-review-quality/latest-batch.md`
  - `artifacts/decision-review-quality/<timestamp>-csv-dir/index.md`
  - one per-CSV report in the timestamped batch folder
- Added `src/docs/trader-real-csv-miss-to-fixture-template.md` so real
  calibration misses can be converted into synthetic fixtures without
  committing private data.

Verification:

- `npx tsc --noEmit --pretty false`
- focused quality dashboard Vitest: 1 file passed, 3 tests passed
- `npm run calibrate:decision-review -- --csv-dir=artifacts/decision-review-quality/batch-smoke --broker=generic_execution_csv --generated-at=2026-05-05T12:30:00.000Z --max-trades=1`

Result:

- Batch smoke passed with 2 CSV files, 2 completed reviews, and 0 diagnostics.

### Decision Review Edge Fixtures Expanded

What changed:

- Deterministic decision-review calibration now covers 10 scenarios.
- Added fixture coverage for:
  - realistic IBKR activity statement import into decision review
  - failed entry near major daily/4h resistance
  - partial exit from a nearby support entry
  - completed short-trade smoke coverage
  - open-position skip diagnostics
- Major-resistance/limited-room market context now wins the coaching headline
  when it is present, even if the generic coaching layer would otherwise focus
  on an exit issue.
- The quality dashboard can now represent expected no-review/skipped-trade
  cases without marking them as failures.
- Dashboard markdown now includes import status, completed review counts, and
  diagnostics for each scenario.

Verification:

- `npx tsc --noEmit --pretty false`
- focused decision-review Vitest: 2 files passed, 15 tests passed
- `npm run calibrate:decision-review -- --generated-at=2026-05-05T12:00:00.000Z --no-history`
- `npm run build`

Result:

- Decision-review calibration passed with 10 scenarios, 0 review, and 0 fail.
- Production build passed.

### Short Trade Decision Review Wording Tightened

What changed:

- Decision-review daily/4h market context is now direction-aware for completed
  short trades.
- Long trades keep the existing support-cushion and resistance-room language.
- Short trades no longer receive long-only `entry_far_from_daily_4h_support`
  or `breakout_had_room_above` insights.
- Short entries can now surface:
  - `short_entry_near_daily_4h_support` when support below limits clean
    downside room
  - `short_entry_had_room_to_support` when the short has cleaner room before
    daily/4h support
  - `short_entry_had_nearby_daily_4h_resistance` when nearby resistance can act
    as structural cover above the entry
- Short adds near daily/4h support now surface as
  `short_adds_near_daily_4h_support` scaling risk.
- The short completed-trade smoke fixture now forbids long-biased "room above",
  "structural cushion underneath", and "upside was not especially clean"
  wording.

Verification:

- `npx tsc --noEmit --pretty false`
- focused decision-review Vitest: 2 files passed, 15 tests passed
- `npm run calibrate:decision-review -- --generated-at=2026-05-05T12:00:00.000Z --no-history`
- `npm run build`

Result:

- Decision-review calibration passed with 9 scenarios, 0 review, and 0 fail.
- Production build passed.
- Post-verification process check did not show leftover `vitest`, `next
  build`, Playwright, or dashboard-runner commands from `trader-intelligence-v2`;
  the only matching process was the process-check command itself.

### IBKR CSV Dry-Run Readiness Tightened

What changed:

- The IBKR sample dry-run preset now uses a more realistic activity statement
  shape with preamble rows, `Trades/Header`, signed quantities, `Currency`,
  `Proceeds`, and `Comm/Fee`.
- The CSV importer now recognizes `Comm/Fee` / `Comm Fee` / `CommFee` as
  commission cost evidence.
- Plain IBKR `Proceeds` is no longer treated as broker net amount. That avoids
  a false broker/app P/L mismatch because activity-statement proceeds are gross
  proceeds while `Comm/Fee` is separate.
- Added importer coverage proving the realistic IBKR shape parses as a closed
  trade with costs visible.
- Added an IBKR activity statement decision-review scenario to the calibration
  dashboard.
- The real CSV calibration guide now tells future sessions to keep `Comm/Fee`
  and not treat plain IBKR `Proceeds` as net P/L.

Verification:

- `npx tsc --noEmit --pretty false`
- focused importer/dry-run/decision-review Vitest: 4 files passed, 50 tests
  passed
- `npm run calibrate:decision-review -- --generated-at=2026-05-05T12:00:00.000Z --no-history`
- `npm run build`

Result:

- Decision-review calibration passed with 10 scenarios, 0 review, and 0 fail.
- Production build passed.

### Real IBKR Monthly CSV Calibration Smoke

What changed:

- Tested a private, git-ignored April IBKR Activity Statement CSV from
  `artifacts/real-csv-calibration/private`.
- Kept the original filename intact to exercise the same path a real user would
  take.
- No month-wide candle backfill was run. The CSV calibration used the local
  file and capped decision-review analysis to the first 5 eligible completed
  trades.
- Hardened the IBKR parser for full monthly Activity Statement shape:
  - accepts stock execution rows from the `Trades/Data/.../Stocks` section
  - skips IBKR subtotals/totals, Forex rows, repeated headers, deposits, and
    financial-instrument-info rows as non-execution rows
  - avoids treating those expected skipped rows as repair blockers
- Mapping confidence now ignores expected skipped non-execution rows and
  grouping/open-position validation warnings.
- Import quality no longer double-counts grouping/open-position review against
  the score.
- Added a synthetic regression test for full IBKR monthly statements so the
  private CSV does not need to become a fixture.

Private calibration result:

- row count: 918
- accepted stock executions: 574
- rejected rows: 0
- skipped non-execution/non-stock rows: 344
- grouped trade requests: 218
- mapping confidence: high, score 93
- import gate: needs_review, score 55
- review reason: 21 grouped trades/open-position reconstructions need review
- capped decision-review run: 5 completed reviews from 5 selected eligible
  trades, with market context source `levels_system_daily_4h`

Verification:

- `npx vitest run src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts --reporter=dot`
- private CSV calibration:
  `npm run calibrate:decision-review -- --csv=artifacts/real-csv-calibration/private/<private-ibkr-file>.csv --broker=ibkr_activity_statement --account-timezone=America/Toronto --max-trades=5 --out=artifacts/real-csv-calibration/private/ibkr-april-first-5-calibration.md --no-history`
- `npx tsc --noEmit --pretty false`
- `npm run calibrate:decision-review -- --generated-at=2026-05-05T12:00:00.000Z --no-history`
- `npm run build`

Result:

- Focused importer/dry-run tests passed with 2 files / 35 tests.
- Synthetic decision-review calibration passed with 10 scenarios, 0 review, and
  0 fail.
- Production build passed.

### IBKR Monthly Grouping Review Tightened

What changed:

- Added `src/scripts/run-ibkr-grouping-review-report.ts` for private local
  grouping diagnostics against IBKR Activity Statement CSVs.
- Generated private report:
  `artifacts/real-csv-calibration/private/ibkr-april-grouping-review.md`.
- Compared grouping rules against the April private IBKR statement:
  - current strict rule (`240m` plus session split): 218 grouped trades, 21
    open review cases
  - IBKR monthly rule (`10080m` and no session split): 208 grouped trades, 2
    open review cases
- Updated `/import-dry-run` IBKR defaults to allow stock positions to close
  across sessions and across up to 7 days. Other broker/generic dry-run imports
  keep the conservative `240m` plus session-boundary split default.
- Added dry-run test coverage proving an IBKR overnight buy/sell pair becomes
  one closed grouped trade instead of two fake open trades.

Private calibration result after grouping change:

- row count: 918
- accepted stock executions: 574
- rejected rows: 0
- skipped non-execution/non-stock rows: 344
- grouped trade requests: 208
- grouping review cases: 2
- open symbols still skipped from completed-trade decision review: 2 private
  calibration symbols
- first-25 capped decision-review calibration completed 25 reviews from 25
  selected eligible trades with market context source `levels_system_daily_4h`

Verification:

- `npx vitest run src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts --reporter=dot`
- `npx tsx src/scripts/run-ibkr-grouping-review-report.ts --csv=artifacts/real-csv-calibration/private/<private-ibkr-file>.csv --account-timezone=America/Toronto --out=artifacts/real-csv-calibration/private/ibkr-april-grouping-review.md`
- private CSV first-25 calibration:
  `npm run calibrate:decision-review -- --csv=artifacts/real-csv-calibration/private/<private-ibkr-file>.csv --broker=ibkr_activity_statement --account-timezone=America/Toronto --max-trades=25 --out=artifacts/real-csv-calibration/private/ibkr-april-first-25-calibration.md --no-history`
- `npx tsc --noEmit --pretty false`
- `npm run calibrate:decision-review -- --generated-at=2026-05-05T12:00:00.000Z --no-history`
- `npm run build`

Result:

- Focused importer/dry-run tests passed with 2 files / 36 tests.
- Synthetic decision-review calibration passed with 10 scenarios, 0 review, and
  0 fail.
- Production build passed.

### First-25 IBKR Decision Review Summary Added

What changed:

- Generated private first-25 JSON calibration report:
  `artifacts/real-csv-calibration/private/ibkr-april-first-25-calibration.json`.
- Added `src/scripts/summarize-decision-review-calibration.ts` to turn verbose
  decision-review calibration JSON into a compact private markdown dashboard.
- Generated private summary report:
  `artifacts/real-csv-calibration/private/ibkr-april-first-25-summary.md`.
- The summary reports:
  - headline counts
  - fix-first behavior counts
  - insight-id counts
  - market-context source counts
  - missing `trade_window_excursion_measured` rows
  - weak/no daily/4h level evidence rows
  - extreme excursion metrics
  - diagnostics/open skipped trades
- Tightened market-aware fallback headline copy so market-context-only reviews
  no longer show raw lowercase insight titles like
  `entry was not close to support`. They now render as a polished coaching
  sentence: `Entry was not close to daily/4h support.`

Private summary result:

- completed reviews: 25
- market context: `levels_system_daily_4h=25`
- fallback/generic headlines: 0 after the copy fix
- missing trade-window excursion insight: 3 private-symbol reviews before the
  trade-window price-alignment guard below
- weak/no level evidence rows: 14
- extreme excursion rows are concentrated in `private basis symbol D` and `private calibration symbol J`; inspect before
  increasing the calibration cap

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts --reporter=dot`
- `npx tsc --noEmit --pretty false`
- `npm run calibrate:decision-review -- --generated-at=2026-05-05T12:00:00.000Z --no-history`
- `npm run build`

Result:

- Focused tests passed with 4 files / 52 tests.
- Synthetic decision-review calibration passed with 10 scenarios, 0 review, and
  0 fail.
- Production build passed.

### Trade-Window Price Alignment Guard Added

What changed:

- Added execution-price fallback in
  `src/lib/raw-trade-timeline/derived/build-trade-derived-signals.ts` so
  completed trades still get bounded MFE/MAE facts when usable trade-window
  candles are unavailable.
- Added a price-alignment guard in
  `src/lib/raw-trade-timeline/builders/create-raw-trade-timeline-with-levels-system-candles.ts`.
  If levels-system trade-window candles are disconnected from execution prices
  by more than 60%, this app ignores those low-timeframe candles/facts for
  local trade-window excursion and falls back to execution-only movement.
- This keeps daily/4h support/resistance ownership in levels-system while
  preventing stub or mismatched 1m/5m candle windows from creating absurd
  private basis symbol D/private calibration symbol J-style excursion metrics.
- Added raw-timeline test coverage for execution-only derived MFE/MAE and
  disconnected levels-system candle windows.

Updated private first-25 summary:

- completed reviews: 25
- market context: `levels_system_daily_4h=25`
- fallback/generic headlines: 0
- missing trade-window excursion insight: 0
- extreme excursion metrics: 0
- weak/no daily/4h level evidence rows: 14

Verification:

- `npx vitest run src/lib/raw-trade-timeline/__tests__/build-trade-derived-signals.test.ts src/lib/raw-trade-timeline/__tests__/levels-system-trade-candle-context.integration.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot`
- private first-25 JSON calibration regenerated with `--max-trades=25 --json`
- `npx tsx src/scripts/summarize-decision-review-calibration.ts --json=artifacts/real-csv-calibration/private/ibkr-april-first-25-calibration.json --out=artifacts/real-csv-calibration/private/ibkr-april-first-25-summary.md`

Result:

- Focused tests passed with 3 files / 21 tests.
- First-25 private calibration completed 25 reviews and no longer reports
  missing trade-window excursion facts or extreme excursion rows.

### First-100 IBKR Decision Review Calibration

What changed:

- Decision-review snapshots now include `tradeWindowEvidenceSource` and
  `candleQualityNotes` so the app and calibration reports clearly distinguish
  aligned levels-system candle-window evidence from execution-only fallback.
- `/import-dry-run` displays the movement evidence source and any candle-quality
  notes on attached decision-review cards.
- The compact calibration summary now reports trade-window evidence counts,
  weak-level counts by symbol, and execution-only fallback counts by symbol,
  while capping long detail lists.
- Regenerated private first-100 calibration reports:
  - `artifacts/real-csv-calibration/private/ibkr-april-first-100-calibration.json`
  - `artifacts/real-csv-calibration/private/ibkr-april-first-100-summary.md`

Private first-100 result:

- requested trades: 208
- analyzable trades: 100
- completed reviews: 100
- market context: `levels_system_daily_4h=100`
- `trade_window_excursion_measured`: 100/100
- trade-window evidence source:
  - `levels_system_trade_window`: 34
  - `execution_only_fallback`: 66
- candle-quality note rows: 67
- weak/no daily/4h level evidence rows: 81
- fallback/generic headlines: 0
- extreme excursion metrics: 0
- open grouped trades still skipped from completed-review calibration:
  - private symbol A: one short sell execution left open
  - private symbol B: one 2-share buy execution left open

Interpretation:

- The review pipeline is producing stable completed-trade feedback for the
  capped private CSV.
- The remaining major calibration issue is provider/context quality, not CSV
  parsing: the current stub/incomplete trade-window data causes many
  execution-only fallbacks and many missing useful daily/4h level relations.
- Do not treat the 81 weak-level rows as final product behavior until real
  levels-system candle/provider backfill is connected.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-api-route.test.ts src/lib/trader-analytics/__tests__/trader-functional-product-readiness.test.ts --reporter=dot`
- private first-100 JSON calibration with `--max-trades=100 --json`
- `npx tsx src/scripts/summarize-decision-review-calibration.ts --json=artifacts/real-csv-calibration/private/ibkr-april-first-100-calibration.json --out=artifacts/real-csv-calibration/private/ibkr-april-first-100-summary.md`

### Fallback Honesty Safety Net Added

What changed:

- Added browser coverage proving `/import-dry-run` shows `movement:
  executions only` and the candle-quality warning when a server decision-review
  snapshot uses `execution_only_fallback`.
- Added product-panel coverage so `candleQualityNotes` and
  `tradeWindowEvidenceSource` flow into top decision-review finding evidence.
- Raised the deterministic decision-review bridge scenario timeout from 15s to
  30s because the repeated-adds levels-system scenario can exceed 15s in larger
  grouped Vitest runs.

Verification:

- `npx tsc --noEmit --pretty false`
- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-boundary.test.ts src/lib/trader-analytics/__tests__/trader-functional-product-readiness.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot`
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop`
- `npm run build`

Result:

- Focused Vitest passed with 3 files / 28 tests.
- Import dry-run desktop Playwright passed with 7 tests.
- Production build passed.

Best next step:

- Switch to the sibling `levels-system` project to improve real historical
  provider/backfill coverage, then rerun the first-100 private calibration here
  and look for a lower `execution_only_fallback` count and fewer weak/no
  daily/4h level evidence rows.

### Market-Data Readiness Tooling Added

What changed:

- Added shared readiness counting utilities in
  `src/lib/trader-analytics/server/decision-review-calibration-readiness.ts`.
- Added `src/scripts/summarize-market-data-readiness.ts` for a compact
  provider/backfill-focused report from one decision-review calibration JSON.
- Added `src/scripts/compare-decision-review-calibrations.ts` for before/after
  comparisons after `levels-system` historical backfill changes.
- Added package scripts:
  - `npm run summarize:market-data-readiness`
  - `npm run compare:decision-review-calibrations`
- Added synthetic tests so the readiness/counting logic is covered without
  private CSV data.
- Generated current private readiness artifacts:
  - `artifacts/real-csv-calibration/private/ibkr-april-first-100-market-data-readiness.md`
  - `artifacts/real-csv-calibration/private/ibkr-april-first-100-self-comparison.md`

Current first-100 baseline:

- completed reviews: 100
- `execution_only_fallback`: 66
- `levels_system_trade_window`: 34
- weak/no daily/4h level evidence rows: 81
- candle-quality note rows: 67
- missing trade-window excursion insights: 0
- extreme excursion metrics: 0
- fallback/generic headlines: 0
- open skipped trades: 2

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/decision-review-calibration-readiness.test.ts --reporter=dot`
- `npm run summarize:market-data-readiness -- --json=artifacts/real-csv-calibration/private/ibkr-april-first-100-calibration.json --out=artifacts/real-csv-calibration/private/ibkr-april-first-100-market-data-readiness.md`
- `npm run compare:decision-review-calibrations -- --baseline=artifacts/real-csv-calibration/private/ibkr-april-first-100-calibration.json --candidate=artifacts/real-csv-calibration/private/ibkr-april-first-100-calibration.json --out=artifacts/real-csv-calibration/private/ibkr-april-first-100-self-comparison.md`

Next comparison after `levels-system` changes:

```bash
npm run calibrate:decision-review -- --csv=artifacts/real-csv-calibration/private/<private-ibkr-file>.csv --broker=ibkr_activity_statement --account-timezone=America/Toronto --max-trades=100 --generated-at=2026-05-05T12:00:00.000Z --json --out=artifacts/real-csv-calibration/private/ibkr-april-first-100-after-levels-system.json --no-history
npm run summarize:market-data-readiness -- --json=artifacts/real-csv-calibration/private/ibkr-april-first-100-after-levels-system.json --out=artifacts/real-csv-calibration/private/ibkr-april-first-100-after-levels-system-readiness.md
npm run compare:decision-review-calibrations -- --baseline=artifacts/real-csv-calibration/private/ibkr-april-first-100-calibration.json --candidate=artifacts/real-csv-calibration/private/ibkr-april-first-100-after-levels-system.json --out=artifacts/real-csv-calibration/private/ibkr-april-first-100-before-after-comparison.md
```

### 2026-05-05 Levels-System 77 Rerun Completed

What changed:

- Inspected the sibling `levels-system` `77` handoff and confirmed the source
  implementation added historical as-of diagnostics and higher-timeframe
  cutoff support.
- Important build finding: `levels-system` exports `dist/`, and the new source
  changes were not present in `dist/` until the provider package was rebuilt.
- Ran `npm run build` in `levels-system`.
- Ran `npm install` in this repo so the local file dependency refreshed to the
  rebuilt provider package.
- Confirmed this repo's installed `node_modules/levels-system-phase1/dist`
  includes:
  - `historical_as_of_snapshot_built`
  - `historical_higher_timeframe_closed_candle_cutoff`
  - `historical_price_anchor_used`
  - `possible_price_adjustment_mismatch`
  - `asOfTimestampByTimeframe`

First-100 private rerun artifacts:

- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-levels-system.json`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-levels-system-summary.md`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-levels-system-readiness.md`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-before-after-comparison.md`

Before / after result:

- completed reviews: `100 -> 100`
- `execution_only_fallback`: `66 -> 67`
- `levels_system_trade_window`: `34 -> 33`
- weak/no daily/4h level evidence rows: `81 -> 81`
- candle-quality note rows: `67 -> 68`
- missing trade-window excursion insights: `0 -> 0`
- extreme excursion metrics: `0 -> 0`
- fallback/generic headlines: `0 -> 0`
- open skipped trades: `2 -> 2`

Interpretation:

- The provider-side historical as-of/cutoff build is now definitely being
  consumed by this repo.
- The first-100 calibration did not improve market-data readiness. The issue is
  likely not just source/build propagation.
- The slight fallback regression appears tied to additional candle-quality
  warnings, especially price-disconnect handling and missing pre/post windows.
- Next best step is to inspect the new after-run diagnostics/candle-quality
  notes by symbol, especially whether the new
  `possible_price_adjustment_mismatch` diagnostic is present for fallback-heavy
  symbols. That points back to adjusted/unadjusted candle basis, historical
  symbol mapping, extended-hours coverage, or provider/cache availability in
  `levels-system`, not trader coaching logic in this repo.

### 2026-05-05 Levels-System Price-Disconnect Diagnostic Pass

What changed:

- Edited the sibling `levels-system` project with a diagnostic-only provider
  improvement.
- `levels-system` now emits `possible_price_adjustment_mismatch` when the
  largest execution-to-nearest trade-window candle OHLC distance exceeds `60%`,
  matching this app's existing trade-window rejection guard.
- The provider diagnostic now includes the measured execution/candle distance,
  ratio, execution timestamp, nearest candle timestamp, and nearest candle
  OHLC.
- This does not alter candle fetching, warehouse storage, support/resistance
  ranking, or watchlist behavior in `levels-system`.
- This app's decision-review bridge now preserves those detailed
  split/adjustment/symbol-mapping warnings in `candleQualityNotes`.
- Deterministic fixture expectations were updated for the current rebuilt
  provider's support-strength output.

Provider verification:

- In `levels-system`: `npx tsx --test src\tests\support-resistance-shared-api.test.ts`
  passed with `23/23`.
- In `levels-system`: `npx tsc --noEmit --pretty false` passed.
- In `levels-system`: `npm run build` passed.
- In this repo: `npm install` refreshed the rebuilt local file dependency.
- In this repo:
  `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot`
  passed with `14/14`.

Diagnostic rerun artifacts:

- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-levels-system-diagnostic.json`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-levels-system-diagnostic-readiness.md`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-before-after-diagnostic-comparison.md`

Diagnostic result:

- first-100 readiness metrics remained effectively unchanged:
  - `execution_only_fallback`: `66 -> 67`
  - `levels_system_trade_window`: `34 -> 33`
  - weak/no daily/4h level evidence rows: `81 -> 81`
  - missing trade-window excursion insights: `0 -> 0`
  - extreme excursion metrics: `0 -> 0`
  - fallback/generic headlines: `0 -> 0`
- the new detailed notes found `62` price-disconnect rows:
  - `41` had ratio `>= 3x`
  - `21` had ratio `< 3x` but still exceeded the `60%` execution/candle
    distance guard
- largest examples:
  - `private basis symbol B`: about `27x-36x`
  - `private basis symbol A`: about `23x`
  - `private basis symbol I`: about `16x-18x`
  - multiple `private basis symbol D`, `private basis symbol E`, `private basis symbol F`, and `private basis symbol C` rows above `5x`

Current interpretation:

- The main blocker is now clearer: many historical trade-window candles are on
  a different price basis than broker executions, or are stale/wrong-symbol
  cache/provider rows.
- Do not tune trader coaching against these rows.
- Next best step is provider-side cache/provenance investigation in
  `levels-system` for fallback-heavy symbols (`private basis symbol G`, `private basis symbol H`, `private basis symbol B`, `private basis symbol I`,
  `private basis symbol D`, `private basis symbol E`, `private basis symbol F`, `private basis symbol C`, etc.), checking adjusted-vs-raw basis,
  stale warehouse rows, historical symbol mapping, and extended-hours coverage.

### 2026-05-05 Implicit Stub Provider Guard Added

Important correction:

- A quick `levels-system` storage check showed an `private basis symbol B` April 16 diagnostic
  referenced intraday candles even though the `ibkr` warehouse had no `1m` or
  `5m` file for `private basis symbol B` on that date.
- `levels-system` provider creation can fall through to its deterministic
  `stub` provider when no IBKR client is supplied.
- That means the earlier private first-100 baseline was accidentally allowing
  deterministic stub candles and stub daily/4h levels to drive some trader
  review output.

What changed in this repo:

- `createRawTradeTimelineWithLevelsSystemCandles(...)` now rejects implicit
  default `stub` provider output for production-style analysis.
- Explicit test/custom fetch services may still use stub providers so
  deterministic fixtures remain valid.
- When implicit stub is detected:
  - trade-window candles are ignored
  - levels-system trade-window facts are not attached
  - support/resistance levels are not mapped into trader-facing context
  - execution-level relations and `levelsSystemMarketFacts` are not attached
  - `hadInsufficientCandleDataForStructure` is set
  - a warning explains that a real historical provider must be configured
- The dry-run decision-review bridge now preserves that warning in
  `candleQualityNotes`.

Verification:

- `npx vitest run src/lib/raw-trade-timeline/__tests__/levels-system-trade-candle-context.integration.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot`
  passed with `2` files / `19` tests.
- `npx tsc --noEmit --pretty false` passed.

Corrected first-100 private artifact:

- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-stub-guard.json`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-stub-guard-readiness.md`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-before-after-stub-guard-comparison.md`

Corrected first-100 read:

- completed reviews: `100`
- market context source: `none=100`
- trade-window evidence: `execution_only_fallback=100`
- stub-warning rows: `100`
- detailed price mismatch rows: `62`
- missing trade-window excursion insights: `0`
- extreme excursion metrics: `0`
- fallback/generic headlines: `0`

Interpretation:

- This is a worse-looking but more truthful baseline.
- Until a real historical provider is configured and available to
  `levels-system`, this repo should not claim candle-backed trade-window or
  daily/4h support/resistance evidence for real imported broker trades.
- Next best step is to configure/pass a real provider path from the calibration
  environment into `levels-system` or run a provider-backed backfill, then rerun
  the first-100 calibration. Only after that should coaching wording be tuned.

### 2026-05-05 IBKR Warehouse Guard Rerun

What changed:

- Read the latest sibling `levels-system` doc `77`, which now says the provider
  default path was changed to IBKR plus warehouse replay:
  - default provider: `ibkr`
  - default warehouse mode: `replay`
  - no silent deterministic stub fallback for default real trade-analysis
    requests
- Ran `npm install` in this repo to refresh the rebuilt
  `levels-system-phase1` file dependency.
- Confirmed installed `dist` contains the default `ibkr` / `replay` guard.

Rerun command:

- Private decision-review calibration was rerun against a local private IBKR
  CSV. The exact private CSV path and private artifact paths are intentionally
  omitted from this public project log.

Result:

- command exited non-zero because no completed decision reviews were produced,
  but it wrote the JSON artifact
- requested trades: `208`
- analyzable cap: `100`
- completed reviews: `0`
- analysis failures: `100`
- open skipped trades: `2`
- all analysis failures were explicit IBKR durable warehouse misses for `5m`
  ranges
- no deterministic stub market data was accepted

Artifacts:

- Private JSON/readiness/comparison artifacts were written under the local
  private calibration artifact area and are intentionally not named here.

Top missing IBKR `5m` warehouse needs from the first-100 cap:

- The private top-symbol list is intentionally omitted from this public project
  log. The aggregate result was `100` failed ranges and `12030` expected `5m`
  candles.

Total first-100 missing `5m` estimate:

- `100` failed ranges
- `12030` expected `5m` candles

Interpretation:

- The latest `levels-system` guard is working: it refuses to synthesize stub
  candles for real imported-trade review.
- The immediate blocker is now concrete IBKR warehouse coverage. The first-100
  private calibration cannot complete decision reviews until the relevant IBKR
  `5m` ranges, and likely daily/4h context, are backfilled or otherwise made
  available.
- Next best step belongs in `levels-system`: backfill/check IBKR warehouse
  coverage for the listed symbols/date windows, then rerun this calibration.

### 2026-05-05 IBKR Warehouse Backfill Pass

What changed:

- Added `src/scripts/build-ibkr-warehouse-backfill-manifest.ts` and
  `npm run build:ibkr-backfill-manifest` to turn the first-100 calibration
  failures into a provider-ready IBKR warehouse manifest and levels-system
  priority report.
- Wired `LEVELS_SYSTEM_WAREHOUSE_DIRECTORY` and
  `LEVELS_SYSTEM_WAREHOUSE_MODE` through the trader consumer so real replay can
  use the levels-system-owned warehouse instead of a local empty `data/candles`
  directory.
- Added a review guard so implausible post-exit continuation metrics from
  price-disconnected candles stay diagnostic-only and do not become coaching.

Provider/backfill result:

- IBKR `5m` execute in `levels-system`: `47` planned ranges, `46` fetched,
  `1` failed (`private alias symbol M` security definition), `6783` candles stored.
- IBKR daily/4h execute in `levels-system`: `63` planned tasks, `61` fetched,
  `2` failed (`private alias symbol M` daily and 4h security definition), `71629` candles stored.
- `levels-system` was rebuilt and reinstalled into this repo after replay
  partial-hit and range-preservation changes.

Final first-100 rerun:

- requested trades: `208`
- analyzable cap: `100`
- completed reviews: `98`
- diagnostics: `5`
- open skipped trades: `2`
- remaining analysis failures: `2`, both `private alias symbol M` durable warehouse misses
- market context source: `levels_system_daily_4h=98`
- trade-window evidence: `levels_system_trade_window=78`,
  `execution_only_fallback=20`
- weak/no daily/4h evidence rows: `14`
- missing trade-window excursion insights: `0`
- extreme excursion metrics: `0`
- fallback/generic headlines: `0`

Final artifacts:

- `artifacts/real-csv-calibration/private/ibkr-april-first-100-ibkr-warehouse-backfill-manifest.json`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-ibkr-warehouse-backfill-final.json`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-ibkr-warehouse-backfill-final-readiness.md`

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts src/lib/raw-trade-timeline/__tests__/levels-system-trade-candle-context.integration.test.ts --reporter=dot` passed: `19/19`.
- `npx tsc --noEmit --pretty false` passed.

Next best step:

- Fix the levels-system backfill runner so priority reports preserve
  per-timeframe ranges instead of merging by symbol/session before timeframe.
- Investigate or map `private alias symbol M` for IBKR, since that is now the only blocker for
  `100/100` completed reviews in this capped run.

### 2026-05-05 private alias symbol M Contract Alias And Final First-100 Rerun

What changed:

- Fixed the `levels-system` priority backfill runner so selected priority tasks
  run per timeframe and preserve timeframe-specific ranges. This prevents daily
  lookbacks from widening unrelated `4h` work.
- Added a validated IBKR historical contract alias for `private alias symbol M` to the current
  `private alias symbol M2` contract, while still storing/replaying candles under requested
  symbol `private alias symbol M` for the imported trade record.
- Important contract note: the imported trade used historical symbol `private alias symbol M`,
  but IBKR no longer qualified that symbol directly. `reqMatchingSymbols`
  resolved the security as `private alias symbol M2` with primary exchange `PINK`
  (`conId=733975592`), so historical fetches use that resolved contract and
  preserve `private alias symbol M` as the requested/storage symbol for replay consistency.
- Backfilled the remaining `private alias symbol M` `5m`, daily, and `4h` warehouse gaps after the
  alias was in place, then rebuilt and reinstalled `levels-system`.

Final capped first-100 rerun:

- requested trades: `208`
- analyzable cap: `100`
- completed reviews: `100`
- diagnostics: `3`
- open skipped trades: `2`
- analysis failures: `0`
- market context source: `levels_system_daily_4h=100`
- trade-window evidence: `levels_system_trade_window=80`,
  `execution_only_fallback=20`
- weak/no daily/4h evidence rows: `14`
- missing trade-window excursion insights: `0`
- extreme excursion metrics: `0`
- fallback/generic headlines: `0`

Final artifacts:

- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-maxn-contract-fix.json`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-maxn-contract-fix-readiness.md`

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts src/lib/raw-trade-timeline/__tests__/levels-system-trade-candle-context.integration.test.ts --reporter=dot` passed: `19/19`.
- `npx tsc --noEmit --pretty false` passed.
- In `levels-system`, `npx tsx --test src\tests\ibkr-historical-candle-provider.test.ts src\tests\candle-warehouse-backfill-report.test.ts` passed: `11/11`.
- In `levels-system`, `npx tsc --noEmit --pretty false` and `npm run build` passed.

Next best step:

- Use the readiness summary's execution-only fallback list as the next focused
  branch. The completion blocker is gone; the remaining value is improving
  trade-window evidence coverage for the `20` execution-only fallback reviews
  and reducing the `14` weak/no daily/4h evidence rows without reintroducing any
  stub-derived market evidence.

### 2026-05-05 1m Fallback Backfill Pass

What changed:

- Built a narrow `1m` priority report for the `20` execution-only fallback
  reviews from the capped first-100 rerun.
- Ran a `levels-system` dry-run first; it collapsed the `20` review rows into
  `17` symbol/session `1m` tasks with about `8,690` missing one-minute slots.
- Executed the `1m` IBKR warehouse backfill in `levels-system`: `17` planned,
  `17` fetched, `0` failed.
- Reran the capped first-100 calibration against warehouse replay.

Result after `1m` backfill:

- requested trades: `208`
- analyzable cap: `100`
- completed reviews: `100`
- diagnostics: `3`
- open skipped trades: `2`
- analysis failures: `0`
- market context source: `levels_system_daily_4h=100`
- trade-window evidence: `levels_system_trade_window=90`,
  `execution_only_fallback=10`
- candle-quality note rows: `57`
- weak/no daily/4h evidence rows: `14`
- missing trade-window excursion insights: `0`
- extreme excursion metrics: `0`
- fallback/generic headlines: `0`

Leftover fallback classification:

- Price-basis/symbol-adjustment disconnects: `private basis symbol A`, `private basis symbol B` x2, `private basis symbol C` x2.
  These have 1m candles, but execution prices are still disconnected by more
  than the 60% guard, so candles are intentionally ignored.
- No candle inside actual hold after 1m replay: `private basis symbol G` x2, `private calibration symbol K` x2, `private calibration symbol L` x1.
  These have nearby pre/post evidence but zero trade candles in the hold window,
  so they remain execution-only for in-trade excursion.

Artifacts:

- `levels-system/artifacts/trader-intelligence/ibkr-april-first-100-execution-fallback-1m-priority-report.json`
- `levels-system/artifacts/trader-intelligence/ibkr-april-first-100-execution-fallback-1m-dry-run/candle-warehouse-backfill.md`
- `levels-system/artifacts/trader-intelligence/ibkr-april-first-100-execution-fallback-1m-execute/candle-warehouse-backfill.md`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-1m-fallback-backfill.json`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-1m-fallback-backfill-readiness.md`

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts src/lib/raw-trade-timeline/__tests__/levels-system-trade-candle-context.integration.test.ts --reporter=dot` passed: `19/19`.

Next best step:

- Split the remaining `10` fallbacks into two separate fixes:
  1. Provider/corporate-action handling for `private basis symbol A`, `private basis symbol B`, and `private basis symbol C`
     adjusted-vs-execution price basis.
  2. A trade-window boundary/nearest-minute review for ultra-short `private basis symbol G`,
     `private calibration symbol K`, and `private calibration symbol L` holds where 1m candles exist around the trade but none
     are counted inside the exact hold interval.

### 2026-05-05 Alias/PINK Diagnostics Consumer Filter

Shared `levels-system` doc `77` added a new provider-side section:
`Delisted/PINK Alias Fail-Safe`.

Provider update consumed:

- `levels-system` now emits and replays explicit diagnostics for validated
  historical IBKR symbol aliases:
  - `historical_symbol_alias_used`
  - `historical_symbol_resolved_to_pink`
- For `private alias symbol M`, the resolved historical path is still `private alias symbol M2`
  (`conId=733975592`) with primary exchange `PINK`.

Consumer-side follow-up:

- Updated the dry-run decision-review bridge so `validated IBKR alias`,
  `resolved through`, and `OTC/PINK data path` diagnostics are preserved in
  `candleQualityNotes`.
- Added a focused bridge test that simulates `private alias symbol M` using a validated alias to
  `private alias symbol M2` on `PINK`.
- Reran the capped first-100 calibration with the new filter.

Result:

- first-100 readiness metrics stayed stable:
  - completed reviews: `100`
  - market context source: `levels_system_daily_4h=100`
  - trade-window evidence: `levels_system_trade_window=90`,
    `execution_only_fallback=10`
- both `private alias symbol M` reviews now include the alias/PINK notes in their saved
  `candleQualityNotes`.

Artifacts:

- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-alias-diagnostics-filter.json`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-alias-diagnostics-filter-readiness.md`

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot` passed: `15/15`.
- `npx tsc --noEmit --pretty false` passed.

Next best step:

- Continue the remaining fallback split: corporate-action/price-basis handling
  for `private basis symbol A`, `private basis symbol B`, and `private basis symbol C`; boundary/nearest-minute handling for
  `private basis symbol G`, `private calibration symbol K`, and `private calibration symbol L`.

### 2026-05-05 Delisted Symbol Alias Policy And Overlap Window Fix

User policy for delisted/renamed symbols:

- Keep the simple validated alias table already added for `private alias symbol M -> private alias symbol M2`.
- Do not add a broad alias-discovery or ticker-research workflow.
- If IBKR quickly resolves a blocking high-value replay through the same
  provider workflow, add a small explicit validated alias.
- If IBKR cannot resolve it quickly, fail cleanly and let the app say market
  data is unavailable for the renamed or delisted symbol and the review uses
  executions/P&L only.
- Trader Intelligence should not need to know the new ticker and should not
  spend cycles hunting delisted symbols unless one blocks a high-value replay.

What changed:

- In `levels-system`, trade-window candle partitioning now counts candles that
  overlap the imported hold interval. This fixes ultra-short trades where a
  one-minute candle starts before the first fill but covers the hold.
- Added a `levels-system` regression test for a sub-minute hold whose candle
  timestamp is before `tradeStartTimestamp`.
- Rebuilt `levels-system` and refreshed the local file dependency here.
- Reran the capped first-100 calibration.

Result after overlap fix:

- completed reviews: `100`
- market context source: `levels_system_daily_4h=100`
- trade-window evidence: `levels_system_trade_window=92`,
  `execution_only_fallback=8`
- candle-quality note rows: `57`
- weak/no daily/4h evidence rows: `14`
- missing trade-window excursion insights: `0`
- extreme excursion metrics: `0`
- fallback/generic headlines: `0`

Remaining fallback classification:

- Price-basis/symbol-adjustment disconnects: `private basis symbol A`, `private basis symbol B` x2, `private basis symbol C` x2.
- Remaining short-hold warehouse gaps: `private basis symbol G` x2 and `private calibration symbol K` x1.

Queued but blocked:

- Built a new narrow `1m` priority report for the remaining short-hold gaps.
- Dry-run planned `2` safe-to-fetch ranges:
  - `private basis symbol G 1m`: `2026-04-08T14:38:00.000Z` to
    `2026-04-08T17:18:00.000Z`
  - `private calibration symbol K 1m`: `2026-04-09T13:01:00.000Z` to
    `2026-04-09T15:30:00.000Z`
- Execute attempt was blocked because IBKR/TWS was offline:
  `connect ECONNREFUSED 127.0.0.1:7497`.

Artifacts:

- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-overlap-window-fix.json`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-overlap-window-fix-readiness.md`
- `levels-system/artifacts/trader-intelligence/ibkr-april-first-100-remaining-short-hold-1m-priority-report.json`
- `levels-system/artifacts/trader-intelligence/ibkr-april-first-100-remaining-short-hold-1m-dry-run/candle-warehouse-backfill.md`

Verification:

- In `levels-system`, `npx tsx --test src\tests\support-resistance-shared-api.test.ts` passed: `26/26`.
- In `levels-system`, `npx tsc --noEmit --pretty false` passed.
- In `levels-system`, `npm run build` passed.
- In this repo, focused bridge/replay Vitest passed: `20/20`.
- In this repo, `npx tsc --noEmit --pretty false` passed.

Next best step:

- When IBKR/TWS is available again, execute the queued short-hold `1m` backfill
  report, rerun the capped first-100 calibration, and expect the remaining
  execution-only fallbacks to be primarily the price-basis disconnect symbols
  (`private basis symbol A`, `private basis symbol B`, `private basis symbol C`).

### 2026-05-05 Remaining Short-Hold IBKR Backfill Completed

IBKR/TWS came back online and the queued short-hold follow-up was completed.

What changed:

- Executed the `levels-system` priority backfill for the remaining non-price
  short-hold gaps.
- Backfill result: `2` planned ranges, `2` attempted, `2` fetched, `0` failed.
- Reran the capped first-100 private IBKR decision-review calibration.
- Generated the market-data readiness summary for the final artifact.

Final capped first-100 result after remaining short-hold backfill:

- requested trades: `208`
- analyzable cap: `100`
- completed reviews: `100`
- diagnostics: `3`
- open skipped trades: `2`
- market context source: `levels_system_daily_4h=100`
- trade-window evidence: `levels_system_trade_window=95`,
  `execution_only_fallback=5`
- candle-quality note rows: `54`
- weak/no daily/4h evidence rows: `14`
- missing trade-window excursion insights: `0`
- extreme excursion metrics: `0`
- fallback/generic headlines: `0`

Remaining fallback classification:

- The short-hold warehouse gaps are cleared.
- The only remaining execution-only fallbacks are price-basis/symbol-adjustment
  disconnects: `private basis symbol A` x1, `private basis symbol B` x2, and `private basis symbol C` x2.
- Each remaining row has nearby warehouse candles, but the candle prices are
  disconnected from broker execution prices by more than the `60%` guard, so
  the app correctly rejects those candles for trade-window movement evidence.

Artifacts:

- `levels-system/artifacts/trader-intelligence/ibkr-april-first-100-remaining-short-hold-1m-execute/candle-warehouse-backfill.md`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-remaining-short-hold-backfill.json`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-remaining-short-hold-backfill-readiness.md`

Verification:

- Focused bridge/replay Vitest passed: `20/20`.
- `npx tsc --noEmit --pretty false` passed.

Next best step:

- Continue only with the corporate-action/price-basis diagnostic branch for
  `private basis symbol A`, `private basis symbol B`, and `private basis symbol C`. Keep the delisted-symbol policy narrow: no broad
  alias discovery, no Trader Intelligence ticker guessing, and clean
  execution/P&L-only fallback when IBKR/warehouse data cannot be aligned.

### 2026-05-05 Price-Basis Diagnostic Sharpened

What changed:

- In `levels-system`, added a new trade-analysis diagnostic:
  `likely_price_basis_adjustment_multiple`.
- The diagnostic fires only when the execution/candle disconnect looks close to
  a whole-number price-basis adjustment multiple. Broad disconnected-candle
  cases still keep the existing `possible_price_adjustment_mismatch` warning.
- In this repo, the dry-run decision-review bridge now preserves price-basis and
  adjustment-multiple notes in `candleQualityNotes`.
- Rebuilt `levels-system`, refreshed the local file dependency with
  `npm install`, and reran the capped first-100 calibration against the
  levels-system warehouse replay.

Result:

- first-100 readiness metrics stayed stable:
  - completed reviews: `100`
  - market context source: `levels_system_daily_4h=100`
  - trade-window evidence: `levels_system_trade_window=95`,
    `execution_only_fallback=5`
  - candle-quality note rows: `54`
  - weak/no daily/4h evidence rows: `14`
  - missing trade-window excursion insights: `0`
  - extreme excursion metrics: `0`
  - fallback/generic headlines: `0`
- The remaining five fallback rows now carry explicit price-basis adjustment
  multiple notes:
  - `private basis symbol A`: near `38:1`
  - `private basis symbol B`: near `41:1` and `40:1`
  - `private basis symbol C`: near `8:1` on both rows

Provider/warehouse provenance note:

- `levels-system` requests IBKR historical candles with `WhatToShow.TRADES`.
- Warehouse rows currently carry `adjustmentMode: "raw"`.
- The remaining fallback ratios prove that the current warehouse label is not a
  sufficient safety guarantee for Trader Intelligence. The consumer should keep
  rejecting these candles until raw/adjusted basis alignment is proven.

Artifacts:

- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-price-basis-diagnostic.json`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-price-basis-diagnostic-readiness.md`

Verification:

- In `levels-system`, `npx tsx --test src\tests\support-resistance-shared-api.test.ts` passed: `26/26`.
- In `levels-system`, `npx tsc --noEmit --pretty false` passed.
- In `levels-system`, `npm run build` passed.
- In this repo, `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot` passed: `15/15`.
- In this repo, `npx tsc --noEmit --pretty false` passed.

Everything still needed from `levels-system` to support this app:

- Keep the IBKR plus `data/candles` warehouse path as the real provider path;
  do not reintroduce silent stub fallback for imported-trade review.
- Keep daily/4h support/resistance as-of historical snapshots owned by
  `levels-system`, with no future daily/4h candle leakage.
- Keep `1m` preferred and `5m` explicit fallback for trade-window facts; return
  diagnostics when either timeframe is missing, partial, stale, or unavailable.
- Keep the warehouse/backfill path able to plan, deduplicate, fetch, store, and
  replay historical candles for imported trade windows.
- Preserve clear diagnostics for provider failures, warehouse misses, fallback
  timeframes, alias/PINK paths, and price-basis/corporate-action mismatches.
- Keep the validated alias policy narrow: currently `private alias symbol M -> private alias symbol M2`; no broad
  alias discovery and no consumer-side ticker guessing.
- For the remaining first-100 blockers, decide whether the warehouse should
  store/serve a raw-price basis compatible with broker executions for `private basis symbol A`,
  `private basis symbol B`, and `private basis symbol C`, or keep returning execution/P&L-only fallback with the
  new price-basis diagnostic.
- After that decision, increase calibration beyond the capped first 100 and
  repeat the same readiness checks across all eligible completed trades.

Next best step:

- Do not fetch more candles blindly. Investigate the `private basis symbol A`, `private basis symbol B`, and `private basis symbol C`
  raw-vs-adjusted basis path in `levels-system`, then either align warehouse
  candles to broker execution prices or deliberately keep these reviews as
  execution/P&L-only with the new diagnostic.

### 2026-05-05 Price-Basis Policy Diagnostic Added

Coordination note from the sibling `levels-system` session:

- Continue targeted price-basis policy work for `private basis symbol A`, `private basis symbol B`, and `private basis symbol C`.
- Do not bulk-fetch more candles.
- Treat remaining fallbacks as basis-mismatch cases unless raw IBKR candle basis
  can be proven aligned to broker execution prices.

What changed:

- `levels-system` added a first-class diagnostic code:
  `trade_window_price_basis_unverified`.
- The diagnostic fires only when price-disconnected execution/candle evidence
  also looks like a likely whole-number adjustment multiple.
- This app preserves the resulting policy note in `candleQualityNotes`.

Rerun result:

- completed reviews: `100`
- market context source: `levels_system_daily_4h=100`
- trade-window evidence: `levels_system_trade_window=95`,
  `execution_only_fallback=5`
- all five remaining fallbacks include the explicit price-basis policy note
  saying candles are unavailable unless raw IBKR candle basis is proven aligned
  to broker execution prices

Artifacts:

- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-price-basis-policy.json`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-price-basis-policy-readiness.md`

Verification:

- In `levels-system`, focused shared API tests passed: `26/26`.
- In `levels-system`, TypeScript and build passed.
- In this repo, bridge Vitest passed: `15/15`.
- In this repo, TypeScript passed.

Next best step:

- Do not spend more cycles backfilling these five. Either prove and implement a
  raw IBKR candle basis that matches broker executions for `private basis symbol A`, `private basis symbol B`, and
  `private basis symbol C`, or accept the five execution/P&L-only reviews and move to all-eligible
  calibration.

### 2026-05-05 All-Eligible Calibration Expanded

What changed:

- Accepted the capped first-100 price-basis rows as intentional execution/P&L-only
  unless raw IBKR candle basis is later proven aligned to broker execution
  prices.
- Expanded calibration to all eligible completed private IBKR trades.
- Added `src/scripts/build-ibkr-daily-4h-backfill-manifest.ts` to generate a
  targeted daily/4h priority report from calibration diagnostics where
  support/resistance context cannot be built.
- Built and executed a `5m` IBKR warehouse backfill for the all-eligible
  calibration failures.
- Built and executed a targeted daily/4h IBKR warehouse backfill for the rows
  unlocked by the `5m` pass.

Backfill results:

- All-eligible first run after accepting price-basis policy:
  - requested trades: `208`
  - analyzable trades: `206`
  - completed reviews: `117`
  - analysis failures: `89`, all missing `5m` warehouse coverage in the back
    half of the import.
- All-eligible `5m` backfill:
  - planned tasks: `39`
  - attempted: `39`
  - fetched: `39`
  - failed: `0`
- Rerun after `5m` backfill:
  - completed reviews: `154`
  - remaining analysis failures: `52`, all daily/4h support/resistance context
    misses.
- Daily/4h manifest:
  - failed trade rows: `52`
  - symbol/session groups: `27`
  - tasks: `54`
  - symbols: `25`
  - estimated candles: `18,900`
- Daily/4h IBKR backfill:
  - dry-run: `54` planned, `54` fetchable, `0` failed
  - execute: `54` planned, `54` fetched, `0` failed

Current all-eligible result:

- requested trades: `208`
- analyzable trades: `206`
- completed reviews: `204`
- diagnostics: `4`
- open skipped trades: `2`
- remaining analysis failures: `2`
- market context source: `levels_system_daily_4h=204`
- trade-window evidence: `levels_system_trade_window=196`,
  `execution_only_fallback=8`
- missing trade-window excursion insights: `0`
- extreme excursion metrics: `3`
- fallback/generic headlines: `0`

Remaining blockers:

- `private market-data symbol N` and `private market-data symbol O` still fail daily/4h context after IBKR fetch because the
  provider returned only tiny higher-timeframe history:
  - `private market-data symbol N`: `1` daily candle and `1` 4h candle stored
  - `private market-data symbol O`: `1` daily candle and `2` 4h candles stored
- Treat these as insufficient-history/provider-data cases, not ordinary
  warehouse gaps. Do not add alias discovery or broad symbol research unless one
  becomes a high-value blocking replay.

Artifacts:

- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-price-basis-policy.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-5m-backfill.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-5m-backfill-readiness.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-daily-4h-backfill-manifest.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-daily-4h-backfill-manifest.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-daily-4h-backfill.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-daily-4h-backfill-readiness.md`
- `levels-system/artifacts/trader-intelligence/ibkr-april-all-eligible-5m-execute/candle-warehouse-backfill.md`
- `levels-system/artifacts/trader-intelligence/ibkr-april-all-eligible-daily-4h-execute/candle-warehouse-backfill.md`

Verification:

- `npx tsc --noEmit --pretty false` passed in this repo after adding the
  daily/4h manifest script.

Next best step:

- Stop broad candle fetching. Review the remaining `private market-data symbol N` and `private market-data symbol O`
  insufficient-history diagnostics and make the consumer-facing failure copy
  truthful: market data unavailable/insufficient for daily/4h context, review
  can still use executions/P&L. Keep the existing price-basis policy for the
  eight execution-only fallback reviews.

### 2026-05-05 private market-data symbol N/private market-data symbol O Insufficient Market Context Diagnostics

What changed:

- Added `insufficient_market_context` to trade-analysis failure
  classification.
- The dry-run decision-review bridge now surfaces that failure as
  `market_context_unavailable` instead of generic `analysis_failed`.
- `levels-system` now appends higher-timeframe fetch diagnostics to the
  support/resistance context error when daily/4h context cannot be built.
- The daily/4h backfill manifest generator accepts both old `analysis_failed`
  and new `market_context_unavailable` diagnostics, so future targeted
  backfills still work.

private market-data symbol N/private market-data symbol O result:

- Reran all eligible completed trades after rebuilding/reinstalling
  `levels-system`.
- Completed reviews remain `204/206`.
- `private market-data symbol N` and `private market-data symbol O` now emit `market_context_unavailable`.
- The diagnostics explain the usable higher-timeframe problem:
  - `private market-data symbol N`: daily and 4h replay found `0` usable bars before the as-of cutoff,
    even though a same-session daily and 4h candle exist in storage.
  - `private market-data symbol O`: daily replay found `0` usable bars before the as-of cutoff; 4h had
    only `1` usable bar against a `180` bar lookback.
- Interpretation: this is insufficient provider/history coverage under the
  no-future-leakage daily/4h cutoff, not another broad backfill queue.

Artifacts:

- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-avex-elmt-diagnostics.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-avex-elmt-diagnostics-readiness.md`

Verification:

- Trader focused tests passed: `22/22`.
- `levels-system` shared API tests passed: `26/26`.
- `levels-system` TypeScript and build passed.
- Trader TypeScript passed.

Next best step:

- Do not chase broad aliases for `private market-data symbol N`/`private market-data symbol O`. The product should display a
  clean unavailable/insufficient daily/4h market-context message for those
  trades and continue with execution/P&L-only information where available.

### 2026-05-06 Market Context Unavailable UI And Basis Policy Design

What changed:

- `/api/import-dry-run/decision-review` now advertises
  `market_context_unavailable` in its route contract metadata.
- `/import-dry-run` maps `market_context_unavailable` diagnostics to
  trader-facing copy:
  - daily/4h market context was unavailable or insufficient
  - support/resistance conclusions are not shown for that trade
  - execution/P&L-only review may still be used
- The raw provider detail remains available behind a details disclosure.
- Added Playwright coverage for the private market-data symbol N-style diagnostic path.
- Added `src/docs/candle-warehouse-basis-policy-design-2026-05-06.md`.

Policy design summary:

- Candle basis is part of the shared warehouse data contract.
- A `raw` label is not sufficient unless the basis has been validated against
  broker executions.
- Trader Intelligence must not guess split/reverse-split adjustments.
- Historical candle batches should be immutable or versioned rather than
  silently rewritten after future corporate actions.
- Alias handling stays narrow and provider-side.
- Insufficient daily/4h history is separate from price-basis mismatch.

Verification:

- Focused API/bridge Vitest passed: `21/21`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop`
  passed: `8/8`.

Next best step:

- Share the candle-basis policy design with the `levels-system` Codex before
  implementing warehouse metadata. The first implementation should be small:
  provider/warehouse provenance metadata plus basis-validation status, not a
  full corporate-action engine.

### 2026-05-06 Consumed Levels-System Basis Metadata Hook

What changed:

- Refreshed the local `levels-system-phase1` file dependency after the
  provider/warehouse-side metadata hook landed in `levels-system`.
- The dry-run decision-review bridge now preserves the new
  `Trade-window candle basis status: ...` diagnostic in `candleQualityNotes`.
- Added bridge coverage for `basis_aligned` and
  `basis_adjustment_multiple_likely` notes.

All-eligible replay result:

- requested trades: `208`
- analyzable completed trades: `206`
- completed reviews: `204`
- open skipped trades: `2`
- `market_context_unavailable`: `private market-data symbol N`, `private market-data symbol O`
- market context: `levels_system_daily_4h=204`
- trade-window evidence: `levels_system_trade_window=196`,
  `execution_only_fallback=8`
- basis status notes among completed reviews:
  - `basis_aligned=199`
  - `basis_adjustment_multiple_likely=5`

Interpretation:

- The five reverse-split-style rows are now explicitly marked by
  `levels-system` as `basis_adjustment_multiple_likely`:
  - `private basis symbol A`: near `38:1`
  - `private basis symbol B`: near `41:1` and `40:1`
  - `private basis symbol C`: near `8:1` and `8:1`
- Keep those as execution/P&L-only movement reviews unless raw IBKR candle basis
  can be proven aligned to broker execution prices.
- `PBM` and `XTLB` execution-only fallbacks now show `basis_aligned`; their
  remaining limitation is unavailable post-trade candles, not price-basis
  mismatch.
- `private market-data symbol N` and `private market-data symbol O` remain insufficient daily/4h history cases under the
  no-future-leakage cutoff.

Artifacts:

- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-basis-metadata-hook.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-basis-metadata-hook-readiness.md`

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot`
  passed: `16/16`.

Next best step:

- Run full TypeScript/build verification after this doc update, then decide
  whether the product UI should visually distinguish `basis_aligned` info notes
  from warning notes so every completed review does not look equally risky.

### 2026-05-06 Candle Basis Note UI Polish

What changed:

- `/import-dry-run` now separates decision-review candle quality notes by
  urgency:
  - `basis_aligned` renders as quiet verified-basis detail.
  - `basis_adjustment_multiple_likely` renders as a visible movement-review
    warning.
  - unavailable pre/post-trade candles, ignored trade-window candles, and 5m
    fallback notes remain visible warnings.
- Adjustment-multiple copy now says movement review stays execution/P&L-only
  because candle prices likely use a different split-adjusted basis than broker
  executions.
- Added Playwright coverage for aligned-basis quiet detail and
  adjustment-multiple warning presentation.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot`
  passed: `16/16`.
- `npm run build` passed.
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop`
  passed: `10/10`.

Next best step:

- Investigate `PBM` and `XTLB` post-trade candle availability. They are now
  basis-aligned, so the remaining execution-only fallback reason is candle
  window completeness rather than reverse-split/price-basis mismatch.

### 2026-05-06 PBM/XTLB Window Fixes

What changed:

- Investigated the three basis-aligned execution-only fallback rows:
  - `PBM` trade 121
  - `XTLB` trades 204 and 205
- Found that `XTLB` had usable 5m warehouse candles after both exits, but a
  tiny stale 1m replay file blocked the 5m fallback path.
- Patched `levels-system` so a partial 1m trade-window response whose newest
  candle is more than 15 minutes before the requested window end falls back to
  5m.
- Added a `levels-system` regression test for stale partial 1m replay fallback.
- Found that `PBM` was a real 5m coverage tail gap on 2026-04-17: the stored 5m
  file ended before the final-exit/post-window segment.
- Performed one targeted IBKR 5m backfill for `PBM` ending at the PBM post-window
  cutoff. IBKR returned `91` 5m candles ending at `2026-04-17T15:30:00.000Z`.

All-eligible replay result:

- requested trades: `208`
- analyzable completed trades: `206`
- completed reviews: `204`
- open skipped trades: `2`
- `market_context_unavailable`: `private market-data symbol N`, `private market-data symbol O`
- market context: `levels_system_daily_4h=204`
- trade-window evidence: `levels_system_trade_window=199`,
  `execution_only_fallback=5`
- execution-only fallback symbols:
  - `private basis symbol A=1`
  - `private basis symbol B=2`
  - `private basis symbol C=2`

Interpretation:

- `PBM` and `XTLB` are resolved as candle-window coverage/replay issues.
- The only remaining execution-only fallbacks are intentional price-basis /
  likely adjustment-multiple cases.

Artifacts:

- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-pbm-xtlb-window-fixes.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-pbm-xtlb-window-fixes-readiness.md`

Verification so far:

- `levels-system`: `npx tsx --test src\tests\support-resistance-shared-api.test.ts`
  passed: `27/27`.
- `levels-system`: TypeScript passed.
- `levels-system`: `npm run build` passed.

Next best step:

- Run final Trader verification after this doc update. Then the remaining data
  branch is not more backfill; it is policy/product handling for the five
  price-basis rows and the two insufficient daily/4h symbols.

### 2026-05-06 Handoff Sync And Readiness Warning Split

What changed:

- Updated the levels-system handoff
  `docs/77_TRADER_INTELLIGENCE_HISTORICAL_BACKFILL_AND_ASOF_PLAN_2026-05-05.md`
  with the PBM/XTLB fixes, final all-eligible replay state, and the boundary to
  avoid more bulk candle fetching on this branch.
- Split calibration readiness candle notes into:
  - actionable candle-quality warnings;
  - quiet candle-basis/provenance info.
- Kept the existing all-note count for audit continuity, but made warning-vs-info
  counts and by-symbol breakdowns available to readiness/comparison summaries.
- Regenerated the latest PBM/XTLB readiness artifact and added a companion
  decision-review summary artifact with the same warning-vs-info split.

Current replay interpretation:

- The five execution-only fallback rows remain `private basis symbol A`, `private basis symbol B`, and `private basis symbol C`, and
  should stay execution/P&L-only unless raw IBKR candle basis is proven aligned.
- `private market-data symbol N` and `private market-data symbol O` remain clean `market_context_unavailable` diagnostics.
- Quiet `basis_aligned` provider/provenance rows are no longer treated as the
  same type of readiness concern as actionable candle warnings.

Artifacts:

- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-pbm-xtlb-window-fixes-readiness.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-pbm-xtlb-window-fixes-summary.md`

Verification so far:

- `npx vitest run src/lib/trader-analytics/__tests__/decision-review-calibration-readiness.test.ts --reporter=dot`
  passed: `2/2`.
- `npx tsc --noEmit --pretty false` passed.

Next best step:

- Run build verification. Then the remaining branch is wording/product polish for
  actionable candle warnings, especially 5m fallback/stale partial 1m wording,
  not additional provider backfill.

### 2026-05-06 Market-Data Policy Product Polish

What changed:

- `/import-dry-run` now separates candle-quality presentation into:
  - true warnings for unsafe price basis and incomplete pre/post windows;
  - lower-resolution notices for `1m` unavailable / `5m` fallback cases;
  - quiet verified-basis details for `basis_aligned` provenance.
- `market_context_unavailable` copy now frames `private market-data symbol N`/`private market-data symbol O`-style failures as a
  market-data limitation, not a trade error, and says execution/P&L review can
  still proceed.
- Calibration readiness now breaks candle notes into:
  - unsafe candle-basis rows;
  - lower-resolution `5m` fallback rows;
  - incomplete trade-window rows;
  - ignored trade-window rows;
  - quiet candle-basis/provenance rows.
- Added focused synthetic coverage for:
  - reverse-split/basis mismatch staying execution-only;
  - unavailable daily/4h context;
  - `5m` fallback as a notice rather than a true movement-warning.
- Audited the `22` weak/no daily/4h level evidence rows and documented that they
  are not a broad candle-backfill lane.
- Added a compact current market-data policy status doc.

Current readiness split:

- execution-only fallback rows: `5`
- unsafe candle-basis rows: `5` across private calibration symbols
- lower-resolution `5m` fallback rows: `158`
- incomplete trade-window rows: `2` across private calibration symbols
- ignored trade-window rows: `0`
- quiet candle-basis/provenance rows: `199`
- weak/no daily/4h level evidence rows: `22`

Docs/artifacts:

- `src/docs/weak-level-evidence-audit-2026-05-06.md`
- `src/docs/market-data-policy-status-2026-05-06.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-pbm-xtlb-window-fixes-readiness.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-pbm-xtlb-window-fixes-summary.md`

Verification so far:

- `npx tsc --noEmit --pretty false` passed.
- `npx vitest run src/lib/trader-analytics/__tests__/decision-review-calibration-readiness.test.ts --reporter=dot`
  passed: `2/2`.
- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot`
  passed: `16/16`.
- `npm run build` passed.
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop`
  passed: `11/11`.

Next best step:

- If continuing this branch, inspect the `SKLZ` extreme excursion row before
  changing thresholds. Avoid more candle backfill unless a concrete replay is
  blocked and IBKR/warehouse alignment can be proven.

### 2026-05-06 SKLZ Extreme Excursion Audit

What changed:

- Audited the lone extreme excursion symbol from the latest all-eligible replay:
  `SKLZ`.
- Confirmed the row is a real small-cap intraday move, not a calculation bug or
  candle basis mismatch.
- The private broker execution row bought `35` shares at `6.12` on
  `2026-04-23 12:36:34 ET` and sold at `11.37` on `2026-04-23 13:31:07 ET`.
- Warehouse `5m` candles show a `20.00` high during the hold; the daily candle
  also has `high=20.00`.
- Metric reconciliation:
  - `tradeMfePct=226.8%` = `(20.00 - 6.12) / 6.12`
  - realized exit move = about `85.8%`
  - `favorableExcursionLeftOnTablePct=141.0%` = `226.8% - 85.8%`
  - post-exit high `14.74` supports the `29.6%` post-exit continuation metric.

Docs:

- `src/docs/sklz-extreme-excursion-audit-2026-05-06.md`
- Updated `src/docs/market-data-policy-status-2026-05-06.md`.

Next best step:

- The market-data calibration branch is clean enough to stop here. Future work
  should move to product copy for verified extreme moves or weak-context rows,
  not provider backfill.

### 2026-05-06 Decision Review Trust Badges

What changed:

- Added decision-review card status badges in `/import-dry-run`:
  - `Verified candle basis`
  - `Lower-resolution candle window`
  - `Execution/P&L only`
  - `Verified extreme move`
  - `Context present, not supportive`
- The badges are derived from existing review evidence and candle-quality notes;
  no new backend contract was added.
- SKLZ-style triple-digit excursion rows now get a product label that says the
  move is verified rather than suspicious.
- Weak-context rows now read as valid market context that was not supportive,
  instead of sounding like missing data.
- Added browser synthetic coverage for:
  - verified aligned candle basis badge;
  - unsafe price-basis execution/P&L-only badge;
  - lower-resolution 5m fallback badge;
  - verified extreme move badge;
  - weak context present-but-not-supportive badge.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npx vitest run src/lib/trader-analytics/__tests__/decision-review-calibration-readiness.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot`
  passed: `18/18`.
- `npm run build` passed.
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop`
  passed: `13/13`.

Known unrelated test status:

- Fixed after this badge/copy branch in the behavior-family calibration pass.

Next best step:

- Move to broader behavior calibration only when ready: inspect whether the
  coaching conclusions themselves are right across high-frequency headline
  families such as profit protection, premature exit, and undersized winner.

### 2026-05-06 Behavior Family Calibration - Exit Continuation Threshold

What changed:

- Fixed the deterministic dashboard fixture lane that had stale
  support/resistance and stub-context expectations.
- Found and fixed a real behavior bug in
  `src/lib/trade-analysis/review/build-trade-decision-review.ts`:
  `maxFavorableMovePctAfterExit` is stored as a ratio, but the
  `exit_left_continuation` guard compared it to `5`. The intended 5% guard now
  uses `0.05`.
- Added a stale-headline guard so the coaching headline cannot say the trade
  "exited winner potential too early" unless the visible insights still include
  `exit_left_continuation`.
- Added deterministic dashboard protection for that headline/insight coupling.
- Updated deterministic expectations where stricter continuation logic correctly
  leaves profit-protection as the visible issue.

All-eligible IBKR/warehouse replay impact:

- completed reviews stayed `204/208`.
- execution-only fallback stayed `5`.
- unsafe candle-basis rows stayed `5` (`private basis symbol A`, `private basis symbol B`, `private basis symbol C`).
- lower-resolution `5m` fallback rows stayed `158`.
- weak/no daily/4h evidence rows stayed `22`.
- missing trade-window excursion insights stayed `0`.
- `exit_left_continuation` insights dropped `59 -> 4`.
- "The trade exited winner potential too early." headlines dropped `43 -> 7`.

Docs/artifacts:

- `src/docs/behavior-family-calibration-audit-2026-05-06.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-exit-threshold-fix.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-exit-threshold-fix-readiness.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-exit-threshold-fix-summary.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-pbm-xtlb-vs-exit-threshold-fix-comparison.md`

Verification:

- `npx vitest run src/lib/trade-analysis/__tests__/build-trade-analysis-summary.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts --reporter=dot`
  passed: `7/7`.
- `npx tsc --noEmit --pretty false` passed.

Next best step:

- Completed in the follow-up fix-first alignment pass below.

### 2026-05-06 Behavior Family Calibration - Premature Fix-First Alignment

What changed:

- Audited `41` rows where `fixFirstBehaviorId=premature_exit` appeared without a
  visible `exit_left_continuation` insight after the 5% continuation threshold
  fix.
- Kept the lower-level behavior engine intact, but aligned the
  product-facing decision-review fix-first label to visible review evidence:
  - visible `profit_protection_failed` remaps to `poor_profit_protection`;
  - visible `adds_increased_risk_into_weakness` remaps to
    `adding_into_weakness`;
  - otherwise the review leaves fix-first empty instead of overclaiming
    `premature_exit`.
- Added a fallback constructive headline for stale premature-exit template rows
  that had no visible risk insight left after filtering.

All-eligible IBKR/warehouse replay impact:

- completed reviews stayed `204/208`.
- all market-data readiness counts stayed unchanged.
- `premature_exit` fix-first labels dropped `44 -> 3`.
- `poor_profit_protection` fix-first labels rose `70 -> 81`.
- `adding_into_weakness` fix-first labels rose `2 -> 6`.
- stale premature-exit headlines without `exit_left_continuation`: `0`.
- `premature_exit` fix-first labels without `exit_left_continuation`: `0`.

Docs/artifacts:

- Updated `src/docs/behavior-family-calibration-audit-2026-05-06.md`.
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-premature-fixfirst-alignment.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-premature-fixfirst-alignment-readiness.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-premature-fixfirst-alignment-summary.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-exit-threshold-vs-premature-fixfirst-alignment-comparison.md`

Verification:

- `npx vitest run src/lib/trade-analysis/__tests__/build-trade-analysis-summary.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts --reporter=dot`
  passed: `7/7`.
- `npx tsc --noEmit --pretty false` passed.

Next best step:

- Completed in the profit-protection and scaling headline alignment pass below.

### 2026-05-06 Behavior Family Calibration - Profit Protection And Scaling Alignment

What changed:

- Audited the `poor_profit_protection` family after premature-exit alignment.
- Found `8` product-facing contradictions where a review showed both
  `profit_protection_failed` and `exit_captured_trade_well`, with realized MFE
  capture as high as the high-80% range.
- Kept the underlying pattern engine intact, but changed the decision-review
  product layer so `profit_protection_failed` is not shown when the same exit
  qualifies as positive capture.
- Added stale-label guards:
  - stale profit-protection headlines fall back to the visible review evidence;
  - stale `poor_profit_protection` fix-first labels are removed, or remapped to
    `adding_into_weakness` when visible add-into-weakness evidence exists.
- Audited the scaling family and avoided overlabeling late/extended adds as
  `adding_into_weakness`. The only scaling patch was headline priority:
  visible `adds_increased_risk_into_weakness` can now lead the fallback
  headline instead of being hidden behind entry-location wording.

Final all-eligible IBKR/warehouse replay state:

- requested trades: `208`
- completed reviews: `204`
- execution-only fallback rows: `5`
- unsafe candle-basis rows: `5` (`private basis symbol A`, `private basis symbol B`, `private basis symbol C`)
- weak/no daily/4h level evidence rows: `22`
- missing trade-window excursion insights: `0`
- stale/contradictory behavior buckets:
  - `profit_protection_failed` plus `exit_captured_trade_well`: `0`
  - `poor_profit_protection` without `profit_protection_failed`: `0`
  - `premature_exit` without `exit_left_continuation`: `0`
  - `adding_into_weakness` without `adds_increased_risk_into_weakness`: `0`
- final fix-first counts:
  - none: `103`
  - `poor_profit_protection`: `71`
  - `undersized_winner`: `16`
  - `adding_into_weakness`: `10`
  - `premature_exit`: `3`
  - `flip_flopping`: `1`

Docs/artifacts:

- Updated `src/docs/behavior-family-calibration-audit-2026-05-06.md`.
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-profit-protection-alignment.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-scaling-headline-alignment.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-scaling-headline-alignment-readiness.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-scaling-headline-alignment-summary.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-premature-vs-scaling-headline-alignment-comparison.md`

Verification:

- `npx vitest run src/lib/trade-analysis/__tests__/build-trade-analysis-summary.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts --reporter=dot`
  passed: `7/7`.
- `npx tsc --noEmit --pretty false` passed.

Next best step:

- Add focused regression coverage for the final contradiction buckets above so
  future behavior-copy changes cannot reintroduce stale fix-first labels or
  contradictory exit insights. The current branch does not need more broad
  candle fetching or behavior-family rewrites.

### 2026-05-06 Behavior Family Calibration - Invariant Guards And Sizing Visibility

What changed:

- Added decision-review calibration invariant counters for stale behavior
  fix-first labels and contradictory exit insights.
- Added regression coverage for stale `poor_profit_protection`,
  `premature_exit`, `adding_into_weakness`, and `undersized_winner` labels.
- Added a visible `winner_stayed_undersized` scaling risk insight for the
  underutilized-winner behavior evidence, so the `undersized_winner` headline
  and fix-first label are backed by visible product evidence.
- Kept late-range add warnings separate from the `adding_into_weakness`
  behavior family unless explicit weakness evidence is present.

Audit outcome:

- `none` fix-first rows are mostly entry-location, late-range add, or
  constructive/no-registered-family cases.
- `Entry was not close to daily/4h support.`: `57/57` rows have visible
  `entry_far_from_daily_4h_support` evidence.
- `undersized_winner` stale visible-insight labels: `16 -> 0`.
- Late-range add rows: `34/34` have visible
  `adds_after_trade_already_used_range` evidence.

Final all-eligible IBKR/warehouse replay state:

- requested trades: `208`
- completed reviews: `204`
- execution-only fallback rows: `5`
- unsafe candle-basis rows: `5`
- weak/no daily/4h level evidence rows: `22`
- missing trade-window excursion insights: `0`
- extreme excursion metric count: `2`
- fallback/generic headlines: `0`
- stale/contradictory behavior buckets all `0`, including the new
  `undersized_winner` visibility guard.

Docs/artifacts:

- Updated `src/docs/behavior-family-calibration-audit-2026-05-06.md`.
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-behavior-invariant-guards.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-behavior-invariant-guards-readiness.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-behavior-invariant-guards-summary.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-scaling-vs-invariant-guards-comparison.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-undersized-visible-insight-v2.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-undersized-visible-insight-v2-readiness.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-undersized-visible-insight-v2-summary.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-invariant-vs-undersized-visible-insight-v2-comparison.md`

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/decision-review-calibration-readiness.test.ts src/lib/trade-analysis/__tests__/build-trade-analysis-summary.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts --reporter=dot`
  passed: `10/10`.
- `npx tsc --noEmit --pretty false` passed.

Next best step:

- The behavior-family calibration branch is stable. Highest-value next work is
  a UI/reporting pass to surface the new invariant counters and
  `winner_stayed_undersized` insight clearly in the import dry run, or a
  separate warehouse/provider pass for the remaining known data-availability
  cases without bulk-fetching more candles.

### 2026-05-06 Next Chat Handoff

Wrote the fresh next-chat handoff:

- `src/docs/trader-intelligence-next-chat-handoff-2026-05-06.md`

Also marked the May 5 handoff as superseded so future chats do not resume from
the stale first-100 baseline.

GitHub was not updated from this workspace because the branch has a large mixed
dirty state with many unrelated tracked/untracked files and private calibration
artifacts. A future push should use a deliberate commit scope that excludes
private CSV/artifact contents and unrelated work.

### 2026-05-06 External Provider Reference Cleanup

User clarified that the project should not reference the unused external
historical provider path in either `trader-intelligence-v2` or the sibling
`levels-system` project.

What changed:

- Removed stale provider mentions from Trader Intelligence docs and handoffs.
- Removed the unused provider implementation and factory path from
  `levels-system`; supported provider names are now `ibkr` and explicit `stub`.
- Removed unused provider-key plumbing from `levels-system` shared candle,
  warehouse, trade-analysis, and validation-script paths.
- Updated provider-comparison defaults/tests to use `stub` as the local
  comparison provider when needed.
- Removed stale provider references from `levels-system` README and handoff /
  changelog docs.

Verification:

- `levels-system`: `npx tsx --test src\tests\provider-factory.test.ts src\tests\provider-comparison-readiness-report.test.ts`
  passed with `4/4` tests.
- `levels-system`: `npx tsc --noEmit --pretty false` passed.
- Case-insensitive repo sweeps found no remaining references to the removed
  provider name in either project, excluding generated/cache folders.

### 2026-05-06 Import And Coaching Audit Step 1-2

Started the import/coaching user-loop audit requested by the user and created:

- `src/docs/import-and-coaching-audit-plan-2026-05-06.md`

Audit read:

- CSV import/grouping coverage is already broad for IBKR activity statement
  preambles, signed quantities, long/short grouping, partial exits,
  over-reductions, open positions, session/time-gap splits, fees/commissions,
  broker net amount, timezone handling, options quarantine, and representative
  generic broker fixtures.
- Decision-review/coaching coverage already protects execution-only fallback
  rows, unsafe candle-basis notes, market-context-unavailable diagnostics,
  short-side wording, required headline/title/evidence fragments, forbidden
  VWAP/EMA wording, and stale behavior invariant buckets.

Small hardening patch:

- `/api/import-dry-run/decision-review` now validates `columnMapping` values and
  returns a 400 contract error for malformed mapping payloads.
- Direct bridge scenario tests now enforce required headline fragments and
  forbidden text fragments from the shared decision-review scenario fixtures.

Verification:

- Focused import/coaching Vitest command passed with `5` files / `55` tests.
- `npx tsc --noEmit --pretty false` passed.

Next best step:

- Continue from the same audit plan into the `/import-dry-run` UI surface:
  confirm the user can clearly see import repair state, grouping review,
  execution/P&L-only status, decision-review evidence, and behavior invariant
  readiness without reading developer artifacts.

### 2026-05-06 Import And Coaching Audit UI Surface

Continued the import/coaching audit plan into the `/import-dry-run` product
surface.

What changed:

- Added a visible Behavior Evidence Alignment summary to the prototype-analysis
  panel when server decision-review snapshots are attached.
- The summary flags stale or contradictory fix-first behavior labels when the
  visible insights do not support the label, including protection,
  premature-exit, adding-into-weakness, and undersized-winner cases.
- Tightened import dry-run E2E expectations so the attached-review path shows
  the alignment summary and the premature-exit fixture carries visible
  `exit_left_continuation` evidence.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-api-route.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot`
  passed: `31/31`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop`
  passed: `13/13`.

Next best step:

- Continue from the same plan into a focused execution-readiness pass: verify
  that grouped buy/sell executions, open-position warnings, gross-only cost
  policy, and dry-run write-safety states remain visible and covered across the
  import route and any import-health/reporting surfaces.

### 2026-05-06 Import And Coaching Audit Execution Readiness

Continued the import/coaching audit into execution-readiness visibility on
`/import-dry-run`.

What changed:

- Added a top-level Execution Readiness summary near the import session and
  prototype panels.
- The summary shows accepted execution count, grouped trade count,
  open-position count, gross-only cost policy, and dry-run-only write safety in
  one place.
- It labels the user-facing state as `Execution ready`, `Execution review
  needed`, or `Execution blocked` based on rejected rows and open/review-needed
  grouped trades.
- Tightened import dry-run E2E coverage for ready, blocked, and open-position
  states.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts src/lib/trader-analytics/__tests__/trader-functional-product-readiness.test.ts --reporter=dot`
  passed: `22/22`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop`
  passed: `13/13`.

Next best step:

- Continue the same audit branch into import-health/reporting surfaces, checking
  whether the same dry-run write-safety and gross-only policy language appears
  wherever users review import readiness outside `/import-dry-run`.

### 2026-05-06 Import And Coaching Audit Reporting Clarity

Continued the import/coaching audit into related reporting surfaces outside
`/import-dry-run`.

What changed:

- Added safety-policy bands to `/imports`, `/import-health`, and
  `/import-trials`.
- The pages now explicitly repeat review-only/no production broker-row writes,
  gross-only feedback scoring, and fees/broker net amounts as reconciliation
  context.
- Added focused Playwright coverage that checks these policy bands on all three
  routes.
- Extended `src/docs/import-and-coaching-audit-plan-2026-05-06.md` with a
  forward work plan for contract hardening, fixture matrix coverage, coaching
  regression cases, first-user QA, and a public-safe real-data readiness
  report.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop --grep "keeps import reporting surfaces explicit"`
  passed: `1/1`.

Next best step:

- Start Step 3 from the forward plan: create a shared import-facing route
  contract that asserts write-safety, gross-only cost policy, broker support
  scope, and no-export boundaries across every import/reporting route.

### 2026-05-06 Import-Facing Route Contract Hardening

Completed Step 3 from the import/coaching audit forward plan.

What changed:

- Added `buildImportFacingRouteContract()` in
  `src/lib/trader-analytics/product/import-facing-route-contract.ts`.
- The contract covers `/import-dry-run`, `/imports`, `/import-health`,
  `/import-trials`, `/repair-wizard`, `/review-cockpit`, and `/calibration`.
- Each route now has a contract-bound policy surface with required write-safety,
  gross-only cost policy, broker/data scope, and no-export boundary copy.
- Added safety-policy bands to `/repair-wizard`, `/review-cockpit`, and
  `/calibration` to match the already-hardened import/reporting pages.
- Rewired the focused Playwright policy test to iterate the shared contract.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/trader-import-trial-experience.test.ts src/lib/trader-analytics/__tests__/platform-ready-feature-module.test.ts --reporter=dot`
  passed: `18/18`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop --grep "keeps import reporting surfaces explicit"`
  passed: `1/1`.

Next best step:

- Start Step 4 from the forward plan: build a named buy/sell execution fixture
  matrix for long win/loss, short win/loss, partial exit, over-reduction,
  same-symbol split trades, open position, rejected row, and fees/net amount.

### 2026-05-06 Buy/Sell Execution Fixture Matrix

Completed Step 4 from the import/coaching audit forward plan.

What changed:

- Added `buildBuySellExecutionFixtureMatrix()` and
  `runBuySellExecutionFixtureMatrix()`.
- The matrix now protects long win/loss, short win/loss, partial exit,
  over-reduction, same-symbol split trades, open position, rejected row, and
  fees/net amount behavior.
- The matrix asserts accepted/rejected execution counts, grouped trade count,
  confidence status, lifecycle status, grouping reason, final position,
  gross realized P/L, and cost reconciliation values where relevant.
- Captured the current intended behavior that open-position rows can show
  realized execution-only P/L for the closed portion while remaining
  review-gated.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/buy-sell-execution-fixture-matrix.test.ts src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts --reporter=dot`
  passed: `39/39`.
- `npx tsc --noEmit --pretty false` passed.

### 2026-05-06 Coaching Behavior Evidence Matrix

Completed Step 5 from the import/coaching audit forward plan.

What changed:

- Added `buildCoachingBehaviorEvidenceMatrix()` and
  `runCoachingBehaviorEvidenceMatrix()`.
- The matrix includes backed and stale cases for `poor_profit_protection`,
  `premature_exit`, `adding_into_weakness`, and `undersized_winner`.
- Added a clean captured-exit case and a contradictory captured-exit plus
  failed-protection case.
- These cases run through the same decision-review calibration readiness
  counters used by the real-data dashboards.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/buy-sell-execution-fixture-matrix.test.ts src/lib/trader-analytics/__tests__/coaching-behavior-evidence-matrix.test.ts src/lib/trader-analytics/__tests__/decision-review-calibration-readiness.test.ts --reporter=dot`
  passed: `9/9`.
- `npx vitest run src/lib/trader-analytics/__tests__/buy-sell-execution-fixture-matrix.test.ts src/lib/trader-analytics/__tests__/coaching-behavior-evidence-matrix.test.ts src/lib/trader-analytics/__tests__/trader-import-trial-experience.test.ts src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts --reporter=dot`
  passed: `26/26`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.

Next best step:

- Start Step 6 from the forward plan: run/tighten first-user workflow QA from
  onboarding through import dry run, repair, grouping review, coaching, and
  reporting, fixing concrete missing states or unclear limitations only.

### 2026-05-06 First-User Workflow QA

Completed the desktop Step 6 first-user QA pass from the import/coaching audit
forward plan.

What changed:

- Ran the existing `app-first-user-hardening` Playwright suite on
  `chromium-desktop`.
- Tightened the first-user journey from `/first-run` into `/import-dry-run` so
  it now asserts the Execution Readiness summary after row repair.
- The journey now verifies `Execution ready`, `write safety: dry-run only`, and
  `gross-only` before checking the execution feedback preview.

Verification:

- `npx playwright test tests/e2e/app-first-user-hardening.spec.ts --project=chromium-desktop`
  passed: `7/7` applicable tests with `1` Firefox-only skip.
- `npx playwright test tests/e2e/app-first-user-hardening.spec.ts --project=chromium-desktop --grep "guides a first user"`
  passed: `1/1` after the assertion tightening.

Next best step:

- Start Step 7 from the forward plan: produce a public-safe real-data readiness
  report with aggregate counts only, keeping private IBKR paths and private
  artifact contents out of docs.

### 2026-05-06 Session Time Intelligence

Implemented Eastern Time session and hourly trade intelligence for execution
imports and analytics.

What changed:

- Added shared timestamp classification for overnight, pre-market, market open,
  midday, and post-market buckets using Eastern Time boundaries.
- CSV imports now derive `sessionDate`, `sessionBucket`, entry hour, and
  held-through session exposure from execution timestamps instead of using a
  default session bucket.
- Execution-feedback summaries and trader analytics rows now carry entry-hour
  facts, held-session buckets, cross-session hold flags, and time-of-day
  aggregate metrics.
- Analytics and import dry-run surfaces now show entry session/hour and
  held-through session labels, with an analytics entry-hour filter.

Verification:

- Focused session/import/analytics tests passed: `35/35`.
- Broader session/import/feedback/analytics matrix passed: `68/68`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Private April IBKR CSV smoke check parsed `574` accepted executions into
  `207` grouped trades with session distribution covering pre-market, market
  open, midday, post-market, and overnight.

Next best step:

- Continue Step 7 public-safe real-data readiness reporting with aggregate-only
  counts, using the session/hour fields from the April smoke check.

Parked product note:

- Keep U.S. equity session classification canonical in Eastern Time. Later UI
  work can add a display preference for local/account timezone, but that should
  not change the canonical session bucket or ET hour analytics.

Follow-up plan:

- Created `src/docs/session-time-intelligence-follow-up-plan-2026-05-06.md`
  to track remaining product/reporting/coaching work for the broader time
  intelligence idea.

### 2026-05-06 Session Time Intelligence Follow-Up Completion

Completed the actionable follow-up work from
`src/docs/session-time-intelligence-follow-up-plan-2026-05-06.md`.

What changed:

- Added `src/scripts/summarize-session-time-readiness.ts` and the npm script
  `summarize:session-time-readiness`.
- Generated public-safe aggregate readiness output at
  `src/docs/session-time-real-data-readiness-2026-05-06.md`.
- Added import timezone diagnostics that distinguish broker/account timestamp
  parsing from Eastern Time market-session classification.
- Hardened analytics filtering/display against older saved rows without the new
  session-time fields.
- Polished analytics, coach, import dry-run, and trade review surfaces with
  entry-session, entry-hour, held-through, and sample-size guarded copy.
- Added Playwright coverage for analytics session/hour filtering, trade-detail
  session time display, and import dry-run session/hour labels.

Verification:

- `npx vitest run src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts src/lib/execution-sources/csv/__tests__/broker-execution-csv-session-time.test.ts src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts src/lib/trader-analytics/__tests__/build-trader-analytics-report.test.ts src/lib/trader-analytics/__tests__/trader-improvement-intelligence.test.ts src/lib/trader-analytics/__tests__/end-user-productization.test.ts` passed: `66/66`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-acceptance.spec.ts --project=chromium-desktop --grep "filters analytics|opens every sample trade"` passed: `2/2`.
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop --grep "renders the required product panels"` passed: `1/1`.

Parked:

- Local/account timezone display remains intentionally parked. Canonical U.S.
  equity session classification stays Eastern Time.

Next best step:

- Continue the broader public-safe real-data readiness/reporting roadmap outside
  the session-time branch.

### 2026-05-06 Coaching Quality And Launch Verification Branch

Started a new launch-confidence branch after the session-time work was judged
complete for the current U.S. equity / Eastern Time scope.

Plan:

- Created
  `src/docs/coaching-quality-and-launch-verification-plan-2026-05-06.md`.
- The branch focuses on coaching language quality, coaching accuracy,
  synthetic sample trade fixtures, real CSV aggregate verification, market-data
  evidence boundaries, and focused product-surface verification.
- Codex can build the needed synthetic fixture/sample trades directly in this
  repo. Private IBKR CSVs should be used only for local aggregate smoke checks;
  any real-data miss that needs a committed regression should be converted into
  a sanitized synthetic fixture.
- `levels-system`, its candle warehouse, and the local IBKR Gateway may be used
  only for local candle-backed verification when a scenario genuinely needs
  historical trade-window candles or higher-timeframe level evidence. Tests
  should not require live Gateway access.

Next best step:

- Begin Phase 1 from the plan: inventory current coaching output builders and
  add a small coaching language/readiness harness before patching language.

Phase 1 start:

- Added `buildCoachingLanguageReadinessReport(...)` and a focused test.
- First sample readiness run checked `54` coach-facing text samples.
- Hard failures: `0`.
- Warnings: `21`, mostly repeated exact copy across coach home, severity,
  review queue, and session recap surfaces.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/coaching-language-readiness.test.ts src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts --reporter=dot`
  passed: `8/8`.
- `npx tsc --noEmit --pretty false` passed.

Next best step:

- Reduce repetitive coach copy where the readiness harness warns, then add the
  fixture-specific coaching expectation matrix from Phase 2.

Coaching-language polish slice:

- Added taxonomy-specific review actions instead of one repeated generic replay
  instruction.
- Adjusted coach home, session prep, session recap, and coach review queue copy
  so the same exact phrase is not repeated across multiple surfaces.
- Tightened the readiness test so the sample coach language must pass with zero
  failures and zero warnings.
- Latest readiness result: `54` checked coach-facing text samples, `0`
  failures, `0` warnings.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/coaching-language-readiness.test.ts src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts src/lib/trader-analytics/__tests__/trader-product-polish.test.ts src/lib/trader-analytics/__tests__/trader-improvement-intelligence.test.ts --reporter=dot`
  passed: `21/21`.
- `npx tsc --noEmit --pretty false` passed.

Next best step:

- Add the Phase 2 synthetic coaching fixture/expectation matrix covering common
  end-user scenarios and expected primary coaching emphasis.

Phase 2 start:

- Added `buildCoachingFixtureExpectationMatrix(...)` and
  `runCoachingFixtureExpectationMatrix(...)`.
- The first committed matrix covers clean long winner, direction-aware short
  winner, open-position review gating, adverse-add loser, structured partial
  exits, inconsistent sizing, rapid-fire management, session-time coach text,
  and coach queue primary behavior visibility.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/coaching-fixture-expectation-matrix.test.ts src/lib/trader-analytics/__tests__/coaching-language-readiness.test.ts src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts src/lib/trader-analytics/__tests__/trader-product-polish.test.ts src/lib/trader-analytics/__tests__/trader-improvement-intelligence.test.ts --reporter=dot`
  passed: `22/22`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.

Next best step:

- Extend the fixture matrix with new builder-generated scenarios for the gaps
  not covered by the current sample set: premarket/open holds,
  market-open/midday holds, post-market/overnight holds, execution-only
  fallback, and positive full-trade management with no dominant mistake.

Extended verification completion:

- Expanded the coaching fixture expectation matrix to include generated
  execution-feedback scenarios for:
  - premarket into market open
  - market open into midday
  - midday into post-market
  - post-market into overnight
  - overnight into premarket
  - execution-only limitation copy
  - constructive full-trade management with controlled scale-in and staged exits
- Removed remaining app/source/test/README references to the unused removed
  historical provider. App request validation and env runtime validation now
  expose `ibkr`/`stub` only.
- Fixed stale import QA expectations for skipped non-trade and non-filled rows,
  and fixed the duplicate-fill mutation to duplicate an actual IBKR trade row.
- Updated stale shared-level fixture counts and snapshot expectations after the
  sibling shared engine returned richer sample support/resistance context.

Verification:

- Focused trader analytics/import/execution/trade-analysis batch passed:
  `267/267` tests across `40` files.
- Full `npm test -- --reporter=dot` passed: `865/865` tests across `98` files.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npm run verify:layer2` passed.
- `npm run verify:layer3` passed.
- `npm run verify:levels-system` passed: `79/79` tests across `21` files.
- Import dry-run focused Playwright passed: `3/3`.
- App acceptance focused Playwright passed: `2/2`.
- App feature regression Playwright passed: `11/11` applicable tests with `1`
  desktop-project skip.
- First-user hardening Playwright passed: `7/7` applicable tests with `1`
  Firefox-only skip.
- Provider-reference search across `src`, `app`, `tests`, `package.json`, and
  `README.md` returned no matches for the removed provider.

Next best step:

- Continue with real-data/private CSV aggregate calibration and convert any
  confusing real-data miss into a sanitized synthetic fixture.

### 2026-05-06 Real-Data Calibration And Synthetic Fixture Plan

Created the next branch plan:

- `src/docs/real-data-calibration-and-synthetic-fixture-plan-2026-05-06.md`

Purpose:

- run private real CSV aggregate calibration
- keep committed reports public-safe and aggregate-only
- detect import/grouping/session/coaching misses
- convert repeatable real-data misses into sanitized synthetic fixtures
- expand import and coaching regression coverage
- rerun full verification

Next best step:

- Start the plan by locating available private calibration CSVs, running
  aggregate import/session readiness, then running bounded decision-review
  calibration on completed grouped trades.

### 2026-05-06 Real-Data Calibration Public Report

Continued the real-data calibration branch from
`src/docs/real-data-calibration-and-synthetic-fixture-plan-2026-05-06.md`.

What changed:

- Added the repeatable `summarize:real-data-calibration-public` npm script.
- Generated the public-safe aggregate report at
  `src/docs/real-data-calibration-public-readiness-2026-05-06.md`.
- The report excludes private paths, account identifiers, symbols, raw rows,
  exact timestamps, prices, and share sizes.
- Private aggregate import/session calibration found `918` parsed rows, `574`
  accepted executions, `0` rejected rows, `344` skipped non-trade rows, `208`
  grouped trades, `206` closed trades, and `2` open trades.
- Session-time aggregation populated pre-market, market open, midday,
  post-market, and overnight buckets.
- Decision-review calibration completed `0` reviews because the local
  historical `5m` trade-window candle warehouse coverage was unavailable for
  the completed-trade sample.
- No synthetic fixture was added from this private run because no reproducible
  import, grouping, session-time, or coaching logic miss was found.

Current resume point:

- This branch is complete for the current app-side plan. Verification passed:
  focused import/session/calibration/coaching Vitest batch `40/40`,
  `npx tsc --noEmit --pretty false`, `npm run build`, full
  `npm test -- --reporter=dot` with `865/865`, `npm run verify:layer2`,
  `npm run verify:layer3`, `npm run verify:levels-system` with `79/79`,
  full import dry-run Playwright `13/13`, and focused app acceptance
  Playwright `2/2`.
- Best next product step: historical candle warehouse/backfill readiness in
  `levels-system` so decision reviews can run on private completed-trade
  samples.

### 2026-05-06 On-Demand Candle Hydration Bridge

Implemented the follow-up solution for the historical candle warehouse blocker.

What changed:

- In sibling `levels-system`, added an exported on-demand IBKR runtime helper
  that lazily connects to IBKR before historical candle fetches.
- The helper plugs into the existing durable warehouse `read_write` path, so
  missing candles are fetched by `levels-system` and written into the warehouse.
- In this app, `readLevelsSystemRuntimeConfigFromEnv(...)` now supports
  `LEVELS_SYSTEM_ON_DEMAND_HYDRATION=true`.
- With hydration enabled, this app passes an IBKR-backed fetch service to
  `levels-system`, forces warehouse mode to `read_write` unless `refresh` is
  explicitly requested, and keeps market-context ownership in the shared engine.
- Documented the runtime knobs in `README.md` and
  `src/docs/on-demand-candle-hydration-implementation-2026-05-06.md`.

Verification so far:

- `levels-system`: `npm run build` passed.
- `levels-system`: Node test run passed with `755/755`, including the new lazy
  IBKR on-demand fetch helper coverage.
- `trader-intelligence-v2`: focused trade-analysis / levels-system /
  decision-review bridge Vitest batch passed with `27/27`.
- `trader-intelligence-v2`: `npx tsc --noEmit --pretty false` passed.
- `trader-intelligence-v2`: `npm run build` passed.
- `trader-intelligence-v2`: `npm run verify:levels-system` passed with
  `80/80`.
- `trader-intelligence-v2`: full `npm test -- --reporter=dot` passed with
  `866/866`.
- Private on-demand hydration smoke passed with `max-trades=1`; one completed
  private trade received daily/4h market context and trade-window candle
  evidence instead of a durable warehouse miss.

Next best step:

- Rerun a larger private calibration batch with on-demand hydration enabled
  while IBKR Gateway is available, then inspect any remaining provider/basis
  misses as aggregate-safe follow-ups.

### 2026-05-07 Warehouse-Backed Real Calibration Completion

Resumed the real-data calibration branch after the sibling `levels-system`
warehouse backfill completed.

What changed:

- Rebuilt `levels-system` successfully so Trader Intelligence could consume the
  latest shared-engine package output.
- Added a `levels-system` durable warehouse regression for short but usable
  provider history, so limited-history symbols are not repeatedly refetched
  when the previous provider response already proved fewer bars were available.
- Reran private decision-review calibration in replay-only warehouse mode to
  avoid competing with live IBKR/watchlist processes.
- Regenerated the public-safe aggregate report at
  `src/docs/real-data-calibration-public-readiness-2026-05-06.md`.
- Updated `src/scripts/summarize-real-data-calibration-public.ts` so the report
  distinguishes true market-data blockers from evidence-gated limitations.

Private aggregate result:

- `918` parsed rows, `574` accepted executions, `0` rejected rows, `344`
  skipped non-trade rows, `208` grouped trades, `206` closed trades, and `2`
  open trades.
- Decision-review replay with `--max-trades 206` produced `206` analyzable
  completed-trade candidates and `204` completed reviews.
- `204` reviews used `levels_system_daily_4h`; `199` used
  `levels_system_trade_window`; `5` correctly fell back to execution-only
  because trade-window candle evidence was unavailable or unsafe.
- Remaining diagnostics were `2` open-trade skips and `2`
  market-context-unavailable rows.
- No blocker/high/medium/low import, grouping, session-time, or coaching logic
  miss was found; no new synthetic fixture was needed.

Verification:

- `levels-system`: `npm run build` passed.
- `levels-system`: touched durable warehouse/on-demand Node test run passed
  with `763/763`.
- Trader Intelligence private replay calibration passed for max-5, max-25, and
  max-206 runs.
- Trader Intelligence focused decision-review/runtime Vitest passed with
  `25/25`.
- Trader Intelligence timed-out tests from the first parallel run passed
  sequentially with `29/29`; the earlier failures were resource-contention
  timeouts from running build, shared verification, and full Vitest at once.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npm run verify:levels-system` passed with `80/80`.
- Full `npm test -- --reporter=dot` passed with `866/866`.
- Targeted privacy grep for private account/file/symbol labels in committed
  docs returned no matches after sanitizing legacy project-log ticker mentions.

Next best step:

- Close this calibration branch. Future work should move to product/UI polish
  or a new private calibration sample; convert only reproducible logic misses
  into sanitized synthetic fixtures.

## 2026-05-07 - One-Run Product Evidence Package

Current branch:

- Continue from the completed on-demand candle hydration/private calibration
  branch into product-facing evidence clarity.
- Added import dry-run decision-review evidence gates so the UI shows full
  daily/4h context, trade-window candle evidence, execution-only fallback,
  candle/data limits, unavailable market context, and open-trade skips before
  the user reads coaching.
- Tightened open-trade diagnostic language so open positions remain visibly
  excluded from completed-trade coaching until flat.
- Added `src/docs/trader-candle-runtime-operator-guide-2026-05-07.md` and linked
  it from `README.md` for replay/read-write/refresh runtime use, private CSV
  calibration flow, concurrency notes, UI evidence rules, and verification
  commands.

Next best step:

- Run focused import dry-run E2E, focused decision-review Vitest, TypeScript,
  and production build for this UI/docs package. If those pass, this one-run
  package is ready to close.

Verification:

- Focused decision-review/trade-analysis Vitest passed with `22/22` after
  rerunning the known slow repeated-add fixture with a larger timeout.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Full import dry-run Playwright on `chromium-desktop` passed with `13/13`,
  including evidence-gate UI assertions and screenshot smoke coverage.
- Full `npm test -- --reporter=dot` reached `864/866` before two known slow
  candle-context tests hit default per-test timeouts; rerunning those two files
  with `--testTimeout=45000` passed with `9/9`.

Current closeout:

- The one-run product evidence package is complete. Next useful branch is either
  a small UI layout pass on the import dry-run decision-review section or a new
  private aggregate calibration sample if fresh broker data is available.

## 2026-05-07 - Product Clarity, Coaching Fixtures, And Browser QA

Completed the requested follow-up package for steps 1-4.

What changed:

- Refined the import dry-run decision-review evidence gates so the trust state
  is easier to scan: clear/limited/blocked status pill, compact review/limit
  counts, toned daily/4h, trade-window, execution-only, and data-limit metrics,
  and mobile-friendly grid behavior.
- Tightened coach confidence wording from generic confidence phrases into
  stronger action-oriented language for strong, moderate, and limited evidence.
- Made the session prep checklist point at the priority trade, current rule, and
  session/hour prompt instead of generic review steps.
- Expanded the coaching fixture expectation matrix with synthetic
  decision-review evidence fixtures for full-context clean review,
  entry-near-resistance risk, execution-only fallback, unsafe candle basis,
  market-context unavailable diagnostics, and open-trade skips.
- Added `/coach` to the core product browser QA path and added a dedicated
  coach product-loop assertion covering coach queue, evidence cards, session
  timing/prep, rule lab, pattern memory, severity ladder, simulations,
  archetype, review completion, and confidence language.

Verification:

- Focused coaching/product Vitest passed: `16/16`.
- Focused CSV decision-review bridge/boundary Vitest passed: `18/18`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Import dry-run Playwright on `chromium-desktop` passed: `13/13`.
- App feature regression Playwright on `chromium-desktop` passed: `12` passed,
  `1` expected mobile-only skip.
- App feature regression mobile overflow/visual-smoke subset passed: `2/2`.
- App acceptance Playwright on `chromium-desktop` passed: `6` passed, `1`
  expected mobile-only skip.
- Full Vitest with slow candle fixtures allowed to finish passed:
  `npm test -- --reporter=dot --testTimeout=45000` with `866/866`.
- After the final neutral-tone tweak for diagnostic-only evidence gates,
  `npx tsc --noEmit --pretty false`, focused coaching fixture/language Vitest
  `2/2`, `npm run build`, import dry-run decision-review Playwright subset
  `4/4`, and app-feature coach/visual/market-context subset `3/3` passed.

Next best step:

- The current product clarity/coaching QA branch is complete. Best next branch
  is either a visual polish pass on the rough coach/import screens or a fresh
  aggregate-only private CSV calibration sample.

## 2026-05-07 - Visual Polish And Buy/Sell Safety Hardening

Completed the next requested package after product clarity/coaching QA.

What changed:

- Polished `/coach` first-screen hierarchy with a clearer header action,
  evidence/source pills, calmer panel treatment, and a user-facing `Data Mode`
  label instead of the rough `Empty State` metric.
- Kept all existing coach workflow sections intact: coach queue, evidence
  cards, session timing, session prep, action rail, rule lab, pattern memory,
  severity ladder, simulations, archetype, review completion, and confidence
  language.
- Expanded `buildBuySellExecutionFixtureMatrix()` beyond basic long/short,
  partial, over-reduction, same-symbol, open, rejected, and fee/net cases.
- Added committed synthetic safety fixtures for:
  - duplicate-like fill cluster
  - same-timestamp broker fill batching
  - huge size jump
  - impossible fee/commission larger than trade value
- Extended the buy/sell fixture matrix assertions so execution anomaly types
  and urgent/review anomaly counts are now part of the contract, not just UI
  copy.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/buy-sell-execution-fixture-matrix.test.ts --reporter=dot`
  passed: `4/4`.
- Focused coaching/product Vitest passed: `16/16`.
- Focused import workflow Vitest passed: `26/26`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Import dry-run focused Playwright passed: `4/4`.
- App feature regression focused coach/visual/market-context subset passed:
  `3/3`.
- Full `npm test -- --reporter=dot --testTimeout=45000` passed with
  `867/867`.
- App acceptance Playwright on `chromium-desktop` passed: `6` passed and `1`
  expected mobile-only skip.
- Full app feature regression on `chromium-desktop` passed: `12` passed and `1`
  expected mobile-only skip.
- App feature regression mobile overflow/visual-smoke subset passed: `2/2`.

Next best step:

- This branch is complete. Best next work is persistence/read-model planning
  for imported trades, decision-review snapshots, evidence-gate state, and
  coaching summaries, or a fresh private aggregate CSV calibration run if new
  real broker data is available.

## 2026-05-07 - Persistence Read Model And Import Commit Design

Completed the requested persistence/read-model planning branch.

What changed:

- Added
  `src/docs/persistence-read-model-and-import-commit-plan-2026-05-07.md`.
- The plan narrows the next productionization branch to persisted import
  batches, normalized executions, saved grouped trades, decision-review
  snapshots, evidence-gate state, analytics report snapshots, and route read
  models.
- Defined V1 write-model tables, including the new
  `decision_review_snapshots` and `decision_review_diagnostics` schema deltas
  that were not explicit in the older database schema plan.
- Defined read models for import commit, saved trade detail, analytics, coach,
  and guided review routes.
- Defined the import commit state machine from preview through
  `ready_to_commit`, `committing`, `committed`, `commit_failed`, `discarded`,
  and `superseded`.
- Defined commit preconditions, duplicate-file/trade/row handling, transaction
  steps, rollback/delete stance, repository/API boundaries, coding phases, and
  test plan.
- Linked the plan from `README.md` and added a pointer from
  `src/docs/end-user-database-schema-plan.md`.

Verification:

- Documentation-only branch. No code path or runtime behavior changed.

Next best step:

- Start Phase 1 from the new plan: add TypeScript repository/read-model
  contracts and a pure import commit planner around `CsvDryRunImportExperience`
  without choosing a database vendor yet.

## 2026-05-07 - Import Commit Phase 1 Implementation

Completed Phase 1 from the persistence/read-model and import commit plan.

What changed:

- Added a pure import commit planner at
  `src/lib/trader-analytics/product/import-commit/import-commit-planner.ts`.
- Added an in-memory import commit repository at
  `src/lib/trader-analytics/product/import-commit/in-memory-import-commit-repository.ts`.
- Exported the new planner/repository contracts from
  `src/lib/trader-analytics/index.ts`.
- Added durable-read-model planning for import batches, row outcomes, issues,
  repair items, normalized executions, saved grouped trades, execution links,
  grouping diagnostics, execution-feedback summaries, and decision-review jobs.
- Preserved the safe generic-import rule: `generic_execution_csv` can import
  mapped broker execution CSVs, but mapping review is required unless confidence
  is high; missing broker net P/L also requires explicit P/L review before
  commit.
- Added `src/lib/trader-analytics/__tests__/import-commit-planner.test.ts`
  covering mapping review, ready commit, rejected rows, open positions,
  duplicate file/trade decisions, short trades with fee/net previews, and
  over-reduction/anomaly acknowledgement.
- Updated
  `src/docs/persistence-read-model-and-import-commit-plan-2026-05-07.md` to
  mark Phase 1 complete and clarify the next branch.

Verification:

- Import commit planner Vitest passed: `7/7`.
- Focused import/coaching/product readiness Vitest passed: `43/43`.
- Full Vitest default timeout reached `871/874` passing, with 3 slow candle /
  decision-review tests timing out at default per-test limits.
- The 3 timed-out tests passed when rerun with `--testTimeout=120000`: `13/13`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.

Next best step:

- Choose the next branch:
  - durable adapter work: select database/migration tool and implement Phase 2;
  - or product-flow work: wire the in-memory commit path into a guarded import
    route/UI smoke path while keeping production writes disabled until the
    durable adapter exists.

## 2026-05-07 - Generic Execution Importer Hardening

Improved the broker-agnostic/generic execution CSV lane after confirming that
it should be the next best step before deeper persistence wiring.

What changed:

- `generic_execution_csv` now auto-detects comma, semicolon, and tab-delimited
  execution files instead of treating semicolon/tab broker exports as broken
  CSVs.
- Import diagnostics now expose the detected delimiter.
- Expanded common generic aliases for execution date/time, filled shares,
  average/fill/execution price, order number, execution id, net amount, and
  split fee columns.
- Side/action parsing now understands short-sale and cover wording in addition
  to buy/sell/BTO/BTC/STO/STC style values.
- Fee parsing now aggregates multiple split fee columns such as `SEC Fee`,
  `TAF Fee`, and `Clearing Fee` while preserving commission separately.
- Updated the first-user browser abuse case so semicolon-delimited files are
  expected to import successfully instead of fail as a wrong delimiter.

Verification:

- Focused CSV parser/session/import-commit Vitest passed: `39/39`.
- Wider generic import workflow Vitest passed: `67/67`.
- Additional buy/sell, functional readiness, and import repair Vitest passed:
  `23/23`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- First-user/import hardening Playwright on `chromium-desktop` passed:
  `7` passed, `1` expected Firefox-only skip.

Next best step:

- Continue making generic import production-grade by adding a mapped-column
  confidence preview surface and/or moving to the guarded import commit route.
  The parser is meaningfully better now, but the product should still require
  mapping review before committing best-effort generic broker files.

## 2026-05-07 - Saved Import To Coaching Loop

Implemented the launch-path feature branch where a user can paste broker
executions, review the dry run, save the import to local SQLite, and see saved
trades drive the trade list, analytics, coach, and guided review surfaces.

What changed:

- Added the live-launch plan at
  `src/docs/feature-completion-to-live-launch-plan-2026-05-07.md`.
- Added local SQLite persistence with `better-sqlite3`, defaulting to
  `data/trader-intelligence.sqlite` with `TRADER_INTELLIGENCE_DB_PATH` override.
- Added V1 migrations for import batches, rows, issues, repair items,
  normalized executions, saved trades, execution links, grouping diagnostics,
  execution-feedback summaries, decision-review jobs, report snapshots, and
  route read-model metadata.
- Added `SqliteImportCommitRepository` while keeping `buildImportCommitPlan()`
  as the pure source of import commit truth.
- Added durable preview, commit, discard, import-batch detail, saved trades,
  latest analytics, latest coach, and latest review API routes.
- Wired `/import-dry-run` with a real Save Import action that previews,
  acknowledges required review gates, commits, and routes to the saved import
  summary.
- Added `/imports/[batchId]` and `/trades` pages, and updated `/trades/[tradeId]`,
  `/analytics`, `/coach`, `/review`, and `/imports` to prefer saved SQLite data
  with sample fallback only when no saved import exists.
- Persisted committed import reports and decision-review job diagnostics; open
  trades are saved but remain blocked from completed-trade coaching.
- Marked saved-data pages as dynamic so they render fresh SQLite state after a
  commit rather than stale sample fallback.
- Updated the broker mapping learning-console test expectation to match the
  hardened generic importer: side and quantity are now detected for the
  formerly weaker preset, while the unresolved symbol mapping still keeps the
  import review-gated.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused saved import Vitest passed: `11/11`.
- Broader importer/product Vitest passed: `37/37`.
- Full Vitest with slow-test timeout passed: `881/881`.
- `npm run build` passed; saved-data routes/pages are dynamic.
- Focused Playwright saved-import loop passed: `1/1`.
- Full import dry-run Playwright on `chromium-desktop` passed: `14/14`.

Next best step:

- Continue from the saved-import feature loop by tightening real-user edges:
  duplicate/import history UX, richer import-batch repair actions, persisted
  review completion state, and more broker fixture coverage for generic mapped
  CSVs. Auth, billing, and visual redesign remain intentionally out of scope.

## 2026-05-07 - Repair Actions And Persisted Review State

Extended the saved-import launch path so messy imports and trade-review work
can be tracked after the import is saved.

What changed:

- Added SQLite V2 persistence tables for saved trade notes, per-trade checklist
  item state, and import repair action events.
- Added repository methods to save notes, mark trades as in-progress, persist
  checklist item statuses, update import repair item state, and list repair
  action events.
- Added API routes:
  - `POST /api/trades/:tradeId/notes`
  - `POST /api/trades/:tradeId/review-items/:itemId`
  - `POST /api/import-batches/:batchId/repair-items/:repairItemId`
- Extended saved trade and import batch APIs to return persisted review/repair
  state.
- Added a trade-review action panel on `/trades/[tradeId]` for saving notes and
  marking checklist steps complete/to-do.
- Added an import repair action panel on `/imports/[batchId]` for resolving or
  dismissing repair items without mutating the original CSV.
- Hardened dynamic trade route lookups by decoding encoded trade IDs before
  SQLite lookup.
- Expanded tests for repair action persistence, trade notes, checklist state,
  and browser-level import-to-review persistence across reload.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Broad library verification
  `npx vitest run src/lib/user-facing-behavior src/lib/trader-analytics src/lib/user-facing-review`
  still fails only in the existing decision-review level-context tests:
  `csv-dry-run-decision-review-bridge.test.ts` and
  `csv-dry-run-decision-review-quality-dashboard.test.ts`. The coaching
  language/readiness and fixture expectation failures encountered during this
  slice were fixed.
- Focused repair/review persistence Vitest passed: `6/6`.
- Broader importer/product Vitest passed: `39/39`.
- Full Vitest with slow-test timeout passed: `883/883`.
- Focused Playwright saved-import-to-review persistence flow passed: `1/1`.
- Full import dry-run Playwright on `chromium-desktop` passed: `14/14`.

Next best step:

- Continue launch hardening with duplicate/import-history UX and richer repair
  flows: show duplicate batches/trades clearly, let users reopen unresolved
  repair items from `/imports`, and add broker fixture coverage for partial
  exits, shorts/covers, open positions, and pre/post-market imports.

## 2026-05-07 - Duplicate Import History And Broker Fixture Coverage

Hardened the saved-import launch path so repeated import attempts are visible
and duplicate data does not silently overwrite prior history.

What changed:

- Import commit plans now create unique batch IDs for new previews instead of
  reusing the generic dry-run batch ID.
- Commit rebuilds preserve the stored preview batch ID, so preview/commit still
  validate the same import attempt.
- Encoded import batch route params are decoded before SQLite lookup across
  batch detail, commit, discard, and repair-item APIs.
- Added `listImportBatchHistory(...)` and `GET /api/import-batches` to expose
  durable history with duplicate-file, duplicate-trade, repair, blocker, review,
  saved-trade, and decision-review counts.
- Updated `/imports` into a real import-history dashboard with committed,
  needs-review, blocked, and duplicate summary counts plus row-level duplicate
  labels.
- Added generic CSV fixtures for:
  - short-sale plus buy-to-cover wording
  - adds and partial exits
  - premarket and postmarket/extended-hours trades
- Expanded tests for duplicate preview history, duplicate import API output,
  richer broker fixture parsing, and browser-level duplicate history display.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Focused duplicate/history/fixture Vitest passed: `23/23`.
- Broader importer/product Vitest passed: `40/40`.
- Full Vitest with slow-test timeout passed: `884/884`.
- Focused Playwright saved-import duplicate-history flow passed: `1/1`.
- Full import dry-run Playwright on `chromium-desktop` passed: `14/14`.

Next best step:

- Continue the same hardening lane by adding a true unresolved-repairs inbox on
  `/imports`, plus fixtures and tests for broker-specific IBKR/Webull/Moomoo
  partial fills, cancels, and multi-day open-to-close imports. After that, move
  into a coaching language quality pass over saved real/imported trades.

## 2026-05-07 - Unresolved Repairs Inbox And Synthetic Broker Fixtures

Added the next import-hardening slice after confirming that the user does not
currently have real Webull, Moomoo, or Schwab CSV exports available.

What changed:

- Added an unresolved repairs inbox to `/imports` that lists open repair items
  across non-discarded import batches with broker, row, severity, detail, and a
  direct link to the import batch.
- Extended `GET /api/import-batches` to return unresolved repair inbox items in
  addition to the durable batch history.
- Added `listUnresolvedImportRepairInbox(...)` to the SQLite repository.
- Added synthetic broker fixture presets for:
  - Webull partial fill plus cancelled order rows.
  - Moomoo split/partial fills.
  - Schwab mixed trade and non-trade account activity.
- Added matching synthetic CSV files under
  `src/docs/trade-execution-import-fixtures/` plus
  `broker-synthetic-fixture-sources.md` documenting that these are public-format
  inferred examples, not real user data.
- Expanded tests for unresolved repair inbox persistence/API/UI and synthetic
  broker fixture parsing.
- Increased the explicit timeout on the slow dry-run decision-review API route
  test to match the repo's known slow-test policy when the whole suite runs.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Focused repair inbox / broker fixture Vitest passed: `19/19`.
- Broader importer/product Vitest passed: `43/43`.
- Full Vitest with slow-test timeout passed: `887/887`.
- Full import dry-run Playwright on `chromium-desktop` passed: `14/14`.

Source notes for fixture shapes:

- Webull public help confirms order history can be exported as CSV; Webull API
  docs expose order fields such as order id, side, status, filled quantity,
  average filled price, and filled time.
- Schwab transaction export shapes were cross-checked against public exported
  transaction parser docs using `Date`, `Action`, `Symbol`, `Description`,
  `Quantity`, `Price`, `Fees & Comm`, and `Amount`.
- Moomoo public references confirm historical trade CSV download exists, but
  exact region-specific columns vary; the synthetic Moomoo fixture uses the
  conservative trade-history columns already supported by this app.

Next best step:

- Move into coaching-language quality over saved imported trades: evidence-backed
  copy, confidence wording, and no overclaiming when data is execution-only or
  market context is missing. Keep adding real anonymized broker misses as
  sanitized synthetic fixtures whenever a user import exposes a gap.

## 2026-05-07 - Coaching Language Quality Guardrails

Completed the coaching-language quality pass over saved/imported-trade coaching
copy.

What changed:

- Tightened coach home, archetype, confidence, session-prep, daily coach, and
  product evidence-card copy so coaching language names execution-only evidence,
  saved execution rows, replay confirmation, or review-prompt status.
- Kept market-context claims out of coach conclusions when the system only has
  execution data.
- Added/used coaching language quality and readiness audits to catch forbidden
  certainty phrases, missing evidence basis, unsupported market-context claims,
  empty strings, generic fallbacks, and duplicate copy.
- Fixed guardrail misses found by the new tests:
  - session repeat behavior now asks for replay confirmation
  - same-symbol cooldown language now references saved execution replays
  - import repair evidence now says it protects saved execution evidence

Verification:

- Focused coaching Vitest passed: `10/10`.
- Full trader-analytics Vitest passed: `200/200`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Full Vitest passed: `889/889`.
- Import dry-run Playwright initially had one tablet timeout under two-worker
  project concurrency; the exact failing tablet test passed on rerun.
- Import dry-run Playwright with one worker passed across desktop/tablet/mobile:
  `42/42`.

Next best step:

- Run private April CSV calibration now that the user confirmed the April file is
  available locally. Use it to compare saved-import aggregates, import repair
  issues, duplicate detection, session buckets, and coach/readiness language
  against real executions. Convert any private miss into a sanitized synthetic
  fixture before changing public tests.

## 2026-05-07 - Private April Saved-Import Calibration

Completed the saved-import calibration branch against the private IBKR April
Activity Statement CSV. The private CSV filename/path remains omitted from chat
and public docs.

What changed:

- Added `src/scripts/run-saved-import-calibration.ts`.
- Added `npm run calibrate:saved-import`.
- The script accepts `--csv` or `--csv-from-artifact`, runs the same
  `buildCsvDryRunImportExperience()` -> `buildImportCommitPlan()` ->
  `SqliteImportCommitRepository` path used by the UI, commits into a fresh
  calibration SQLite DB, builds saved analytics/coach/review outputs, runs
  coaching language readiness/quality audits, and writes private aggregate
  JSON/Markdown reports without storing raw CSV text.
- Updated `src/docs/trader-real-csv-calibration-guide.md` with the new saved
  import calibration command.
- Real-data calibration found one useful coaching-language miss: the daily coach
  fallback still said "Review the lowest-quality trade..." without naming replay
  or saved execution evidence.
- Fixed that fallback to "Replay the lowest-quality saved execution trade..."
  and tightened coach action/review-queue copy so rule simulation, review loop,
  and linked-trade actions name execution-only/replay evidence.
- Tightened the calibration audit so it requires evidence-basis wording on
  explanatory coaching text, not on short labels/titles or import-repair actions
  with no linked trade yet.
- Added a sanitized regression test so the daily coach fallback must stay tied
  to saved execution replay evidence when no specific mistake observation exists
  for the latest session.

Latest private aggregate result:

- rows parsed: `918`
- accepted executions: `574`
- skipped rows: `344`
- rejected rows: `0`
- grouped trades: `208`
- saved trades: `208`
- open positions saved: `2`
- queued decision-review jobs: `206`
- open-position blocked decision-review jobs: `2`
- duplicate second preview: duplicate file `true`, duplicate trades `208`
- coaching language readiness: `pass`, `0` warnings/failures
- coaching language quality audit: `pass`, `0` violations

Session/time calibration notes from the private aggregate:

- entry buckets: pre-market `99`, market open `52`, midday `33`,
  post-market `23`, overnight `1`
- held-through flags: premarket into open `19`, open into midday `11`,
  midday into postmarket `5`, postmarket into overnight `7`, held overnight `8`
- the strongest gross P/L bucket in this private month was midday; pre-market
  was the weakest by gross P/L

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused coaching/product Vitest passed: `17/17`.
- Private saved-import calibration v4 passed with committed import and clean
  coaching audits.
- Full trader-analytics Vitest passed: `200/200`.
- `npm run build` passed.
- Full Vitest passed: `889/889`.
- Import dry-run Playwright with one worker passed across desktop/tablet/mobile:
  `42/42`.
- Focused coaching regression rerun passed: `11/11`.

Next best step:

- Move to the next feature-completion gap: persisted decision-review snapshot
  execution for queued closed trades when market context is available, so saved
  imports can populate `/review` with durable decision-review results rather
  than queued job diagnostics only.

## 2026-05-07 - Persisted Saved Decision-Review Snapshots Complete

Completed the next feature-completion gap for saved imports: committed trades now
run persisted decision-review jobs, store completed snapshots or diagnostics in
SQLite, and expose the saved review state through the app surfaces.

What changed:

- Added persisted `decision_review_snapshots` and
  `decision_review_diagnostics` tables with repository read/write methods.
- Added `runPersistedDecisionReviewJobs()` and
  `buildSavedDecisionReviewReadModel()` as server-only services.
- Import commit now attempts saved decision review after a successful commit and
  returns a `decisionReviewRun` summary.
- `/api/import-batches/:id`, `/api/review/latest`, and `/api/trades/:id` now
  expose saved review jobs, snapshots, and diagnostics.
- `/imports/:batchId`, `/review`, and `/trades/:tradeId` now surface persisted
  saved decision-review status to the end user.
- Kept SQLite/better-sqlite3 behind server-only imports so the production client
  bundle does not pull Node filesystem modules.
- Updated the saved-import calibration script so the private April saved-import
  run also executes persisted decision review and writes aggregate snapshot /
  diagnostic counts.

Latest private April aggregate result:

- rows parsed: `918`
- accepted executions: `574`
- skipped rows: `344`
- rejected rows: `0`
- grouped trades: `208`
- saved trades: `208`
- open positions saved: `2`
- decision-review jobs: `208`
- eligible closed-trade review jobs: `206`
- completed persisted review snapshots: `204`
- blocked open-trade diagnostics: `2`
- market-context-unavailable diagnostics: `2`
- analysis-failed diagnostics: `0`
- market context source for completed snapshots:
  `levels_system_daily_4h` for `204/204`
- coaching language readiness: `pass`, `0` warnings/failures
- coaching language quality audit: `pass`, `0` violations

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused saved import / decision-review Vitest passed: `42/42`.
- `npm run build` passed.
- Import dry-run Playwright passed across desktop/tablet/mobile: `42/42`.
- Full Vitest passed: `892/892`.
- Private April saved-import calibration v5 committed successfully and produced
  persisted decision-review snapshots/diagnostics.

Next best step:

- Use the two market-context-unavailable April cases as the next calibration
  branch: inspect whether they are true missing-candle/warehouse gaps or symbol /
  session edge cases, then convert any app-side miss into a sanitized synthetic
  fixture. After that, the highest-value feature work is richer saved-review UI
  filtering/grouping by snapshot status and diagnostic type.

## 2026-05-08 - Saved Review Diagnostic Buckets And April Cleanup

Completed the calibration cleanup branch for the two remaining April
`market_context_unavailable` cases.

Findings:

- The two closed-trade diagnostics remain the known AVEX/ELMT class:
  insufficient daily/4h history under the historical no-future-leakage cutoff.
- This is not a generic app import bug, session-time bug, symbol-normalization
  miss, or trade-window 5m issue.
- The right product behavior is truthful degradation: keep execution/P&L review
  available where possible, but do not show support/resistance or daily/4h
  market-context conclusions for those trades.

What changed:

- Extended the saved decision-review read model with:
  - `statusCounts`
  - `diagnosticCodeCounts`
  - `diagnosticStatusCounts`
- Updated `/review` to separate completed snapshots, market-context gaps,
  open-trade blocks, queued jobs, skipped jobs, and other diagnostics.
- Updated `/imports/:batchId` to display decision-review job status buckets and
  diagnostic-code buckets before the latest diagnostic details.
- Added a sanitized regression test for the insufficient higher-timeframe
  history class using fake symbols, so the private AVEX/ELMT shape is covered
  without exposing private trade data.
- Updated the saved-import calibration report to write diagnostic-code and
  diagnostic-status counts.

Latest private April aggregate result:

- rows parsed: `918`
- accepted executions: `574`
- skipped rows: `344`
- rejected rows: `0`
- grouped trades: `208`
- saved trades: `208`
- decision-review jobs: `208`
- completed persisted review snapshots: `204`
- blocked open-trade diagnostics: `2`
- market-context-unavailable diagnostics: `2`
- analysis-failed diagnostics: `0`
- diagnostic buckets: `blocked_open_trade=2`,
  `market_context_unavailable=2`
- market context source for completed snapshots:
  `levels_system_daily_4h` for `204/204`
- coaching language readiness: `pass`, `0` warnings/failures
- coaching language quality audit: `pass`, `0` violations

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused saved import / decision-review Vitest passed: `11/11`.
- `npm run build` passed.
- Import dry-run Playwright passed across desktop/tablet/mobile: `42/42`.
- Full Vitest passed: `893/893`.
- Private April saved-import calibration v6 committed successfully and preserved
  the expected `204` completed snapshots plus `4` truthful diagnostics.

Next best step:

- Move to saved-review workbench polish: add end-user filters or tabs for
  completed snapshots, market-context gaps, open-trade blocks, and review
  priority; then connect those filters to `/trades` and trade detail links so a
  user can work the saved-review queue rather than only read aggregate status.

## 2026-05-08 - Public Beta Landing Page

Added a public marketing homepage for Trader Intelligence while keeping the
internal app launcher available at `/workspace`.

What changed:

- Replaced `/` with a dark-blue public landing page for the Discord beta.
- Added SEO metadata for AI trade review, broker execution import, scanner
  alerts, chart levels, and support/resistance generation.
- Added a full-bleed animated market scene using canvas for scanner rows,
  chart movement, and support/resistance level lines.
- Added beta pricing copy: Discord beta at `$30.00 USD`; public website launch
  price will increase; beta testers keep the `$30.00` rate.
- Added feature sections for execution intelligence, scanner, chart levels,
  decision review, press-release feature set, SEO topic coverage, FAQ, and
  risk/non-advice copy.
- Moved the old internal route grid to `/workspace`.
- Updated browser smoke expectations that previously treated `/` as the app
  workspace route.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Playwright smoke against the production server verified the homepage title,
  primary heading, beta pricing copy, `/first-run`, and `/workspace` links.
- Screenshot artifact: `artifacts/landing-page-home-production.png`.

Next best step:

- Replace the placeholder Discord URL with the real invite link before sharing
  the landing page publicly, then add a narrow homepage visual/SEO regression
  test so future app work does not accidentally turn `/` back into an internal
  workspace.

## 2026-05-08 - TradersLink Platform Landing Reposition

Updated the public homepage from a Trader Intelligence-only beta page into a
TradersLink trading-tools beta page.

What changed:

- Reframed TradersLink as the parent platform for scanner alerts, Press
  Release App v2, SEC filing summaries, chart levels, and the coming Trader
  Intelligence system.
- Updated hero, pricing, FAQ, SEO metadata, and JSON-LD to describe the
  Discord beta and website rollout accurately.
- Kept Trader Intelligence positioned as an upcoming tool for beta members
  rather than the only product on the homepage.
- Updated homepage route smoke expectations to the new public heading.

Next best step:

- Replace the placeholder Discord URL with the real invite link before public
  sharing, then add/keep a focused homepage regression that verifies the
  platform copy for scanner alerts, press releases, SEC filings, beta pricing,
  and Trader Intelligence coming soon.

## 2026-05-08 - Landing Page Levels-System Copy Polish

Updated the TradersLink homepage to better describe the levels-system tool as a
real-time chart follower, not only static support/resistance generation.

What changed:

- Added copy for live trade-follow updates around level breaks, failing setups,
  dip areas, support/resistance, and candle-based chart context.
- Removed noisy ticker/status text from the animated hero background so labels
  like watch/risk/level break and sample tickers no longer sit behind the hero
  calls to action.
- Updated root and page metadata to mention chart-level tooling.

## 2026-05-08 - Landing Page AI Chart-Following Reword

Adjusted the public homepage so levels-system language does not imply live
human trade calls.

What changed:

- Removed the lower-left hero scanner/bar animation entirely so there is no
  clutter behind the primary hero buttons.
- Reworded levels-system copy around software/AI market-data intelligence:
  generated support/resistance is included, while AI chart following for level
  breaks, weakening setups, and possible dip areas is positioned as coming soon.
- Expanded beta card rows to show scanner alerts, PR/SEC AI summaries, generated
  chart levels, Trader Intelligence coming soon, and AI chart following coming
  soon.
- Added press-release trading-card copy for float size, market cap, short
  interest, generated levels, and AI summary context.

## 2026-05-08 - Vercel Landing-Only Deployment

Created a minimal landing-page-only Vercel project at `vercel-landing` and
deployed it separately from the full Trader Intelligence app.

What changed:

- Installed the Vercel coding-agent plugin for Codex user scope. The installer
  reported the current agent session must restart before the plugin tools load.
- Created `vercel-landing` with only the public homepage, animated hero canvas,
  root layout, Tailwind CSS, and minimal Next dependencies.
- Avoided deploying the full app routes, API routes, SQLite persistence, and
  local `levels-system` dependency to Vercel Hobby.
- Linked and deployed the Vercel project `vercel-landing`.

Live deployment:

- Production alias: `https://vercel-landing-gules.vercel.app`
- Deployment URL:
  `https://vercel-landing-8li1pzpy4-jeremylgk20-1197s-projects.vercel.app`

Verification:

- `npm run check` passed from `vercel-landing`.
- Remote Playwright smoke verified the title, homepage heading, Discord CTA
  target, new-tab behavior, and beta card copy.

Next best step:

- Add the user's purchased domain to the Vercel project with
  `vercel domains add <domain> vercel-landing`, then complete the DNS records
  shown by Vercel at the registrar.

## 2026-05-08 - TradersLink Domain Added To Vercel

Added the user's purchased Porkbun domain to the landing-only Vercel project.

What changed:

- Added `traderslink.pro` to the `vercel-landing` project.
- Added `www.traderslink.pro` to the `vercel-landing` project.
- Vercel reported the domain is not configured until Porkbun DNS points to
  Vercel.

DNS records Vercel requested at the current authoritative DNS provider
(`porkbun.com` nameservers):

- `A traderslink.pro 76.76.21.21`
- `A www.traderslink.pro 76.76.21.21`

Next best step:

- In Porkbun DNS, add/update the root `@` A record and `www` A record to
  `76.76.21.21`, remove conflicting root/www A/AAAA/CNAME records, then rerun
  `vercel domains inspect traderslink.pro` after propagation.

## 2026-05-08 - TradersLink Apex Domain Live

Configured the landing-only Vercel project to prefer the non-www domain.

What changed:

- Updated `vercel-landing/next.config.ts` with a permanent redirect from
  `www.traderslink.pro/:path*` to `https://traderslink.pro/:path*`.
- Updated root metadata base in both the main app and landing-only project to
  `https://traderslink.pro`.
- Redeployed the landing-only project to Vercel production.

Verification:

- `npm run check` passed in `vercel-landing`.
- `npx tsc --noEmit --pretty false` passed in the main app.
- Vercel production deployment was aliased to `https://traderslink.pro`.
- DNS resolved both `traderslink.pro` and `www.traderslink.pro` to
  `76.76.21.21`.
- `curl -I https://traderslink.pro` returned `200 OK`.
- `curl -I https://www.traderslink.pro` returned `308 Permanent Redirect` to
  `https://traderslink.pro/`.

## 2026-05-08 - Saved Review Queue Workbench

Returned to the app feature branch after the landing-page/domain work and added
the first saved-review workbench layer.

What changed:

- Added `buildSavedReviewQueueReadModel()` for saved decision-review jobs,
  snapshots, diagnostics, deterministic priority labels/reasons, queue filters,
  and trade-detail links.
- Added `/review` saved queue tabs for all, completed, market gaps, open blocks,
  analysis failed, highest priority, and unresolved review work.
- Connected `/trades` to the saved review queue by showing queue lane/priority
  for saved trades and linking users back into review work.
- Connected trade detail pages back to `/review?queue=...` when opened from the
  saved review queue.
- Extended `/api/review/latest` to return the saved review queue read model.
- Added a saved-data restart test so committed trades and queue items survive a
  repository reload.
- Added generic CSV hardening coverage for unusual headers, mixed timestamp
  formats, cost columns, and non-filled row skipping.
- Extended the import-to-saved-app Playwright flow to cover saved review queue
  visibility and queue-to-trade navigation without requiring IBKR or live market
  data.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused Vitest passed: `44/44` across SQLite import commit, saved import API,
  and broker CSV import tests.
- Focused Playwright import-to-saved-review flow passed across desktop, tablet,
  and mobile: `3/3`.
- `npm run build` passed.

Next best step:

- Continue without IBKR by polishing saved queue operations: add durable queue
  status actions such as mark reviewed/ignore/resolve directly from the queue,
  then add saved queue filters to `/trades` so users can narrow the trade list by
  the same review lane.

## 2026-05-08 - Saved Queue Actions And Trade Filters

Completed the next saved-review workbench step without IBKR or live market data.

What changed:

- Widened saved import trade review status to the shared `SavedReviewStatus`
  contract so statuses like `reviewed`, `resolved`, and `ignored` persist.
- Added `SqliteImportCommitRepository.setTradeReviewStatus()` and
  `POST /api/trades/:tradeId/review-status`.
- Added queue action buttons on `/review` for mark reviewed, resolve, and
  ignore.
- Updated saved review queue filtering so reviewed/resolved/ignored trades leave
  the highest-priority and unresolved queues while still appearing in all-items
  history.
- Added `/trades?reviewLane=...` filters that mirror saved review queue lanes and
  link back to the saved review queue.
- Kept trade-detail navigation back to `/review?queue=...` when opened from the
  saved queue.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused Vitest passed: `13/13` across SQLite import commit and saved import
  API route coverage.
- `npm run build` passed.
- Focused Playwright import-to-saved-review flow passed across desktop, tablet,
  and mobile: `3/3`.

Next best step:

- Add a compact queue summary strip to `/analytics` and `/coach` so the user can
  jump from performance/coaching pages directly into the highest-priority saved
  review work.

## 2026-05-08 - Analytics And Coach Review Queue Strip

Completed the compact saved-review queue strip for the saved-data app loop.

What changed:

- Added `SavedReviewQueueSummary`, a reusable strip that shows highest-priority,
  unresolved, market-gap, and open-block counts from the saved review queue.
- Wired `/analytics` to build the saved review queue from the same SQLite
  repository as the saved analytics report.
- Wired `/coach` to show the same saved review work summary above the coaching
  KPI sections.
- Added links from analytics/coach into `/review?queue=highest_priority` and
  `/trades?reviewLane=highest_priority`.
- Extended the import-to-saved-app Playwright flow to verify that saved imports
  light up the queue strip on both analytics and coach pages.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused Vitest passed: `saved-import-api-routes.test.ts` `4/4`.
- `npm run build` passed.
- Focused Playwright import-to-saved-app flow passed across desktop, tablet, and
  mobile: `3/3`.

Next best step:

- Continue toward launch readiness by adding an import history/detail action
  lane for unresolved repair items and duplicate imports, so a user can recover
  from a failed save attempt without relying on developer logs.

## 2026-05-08 - Import Recovery Lane

Completed the import recovery/history hardening step for failed, duplicate, and
ready-to-save import attempts.

What changed:

- Added `buildImportRecoveryReadModel()` to classify import batches as saved,
  ready to save, blocked by repairs, duplicate review, acknowledgement needed,
  discarded, or blocked.
- Added SQLite lookup helpers for committed batches by file fingerprint and
  saved trades by duplicate trade fingerprint.
- Added a recovery lane to `/imports/[batchId]` with clear counts, duplicate
  details, links to original imports/trades, save-from-stored-preview, discard
  preview, and repair-section navigation.
- Added an import recovery queue to `/imports` so active failed/duplicate/review
  attempts are visible without digging through history rows.
- Extended import batch APIs to return the recovery read model and history APIs
  to return the active recovery queue.
- Added tests for duplicate recovery linking, ready stored-preview commit, and
  blocked repair recovery state.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused Vitest passed: `saved-import-api-routes.test.ts` `5/5`.
- `npm run build` passed.
- Focused Playwright import recovery flow passed across desktop, tablet, and
  mobile: `6/6`.

Note:

- One Playwright run was started in parallel with `npm run build` and failed
  because `.next` was not finished yet. The rerun after the completed build
  passed.

Next best step:

- Continue with repair workflow hardening: let users carry repaired row values
  from the dry-run UI into a new preview/save attempt, and add more synthetic
  fixtures for ugly real-world broker exports.

## 2026-05-08 - Repair Carry-Forward Hardening

Completed the first repair workflow hardening step.

What changed:

- Added a `Repair Carry-Forward` panel to `/import-dry-run` that makes the save
  source explicit after row edits.
- The panel shows repair edit count, the last edited row/header, remaining
  rejected rows, accepted executions, and whether the current save source is the
  repaired CSV text.
- Kept the privacy posture intact: edits update the in-session CSV text used for
  preview/save, while raw CSV file text is not stored by default.
- Extended the repaired-row browser flow so a missing quantity is edited,
  preview status becomes ready, the repaired CSV is saved to SQLite, and the
  repaired trade appears in `/trades`.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused Vitest passed: `saved-import-api-routes.test.ts` `5/5`.
- `npm run build` passed.
- Focused Playwright repaired-row save flow passed across desktop, tablet, and
  mobile: `3/3`.

Note:

- The first Playwright run used the previous production build and failed to find
  the new panel. Rebuilt with `npm run build`; the rerun passed.

Next best step:

- Add a nastier broker CSV fixture matrix for repair/save hardening: mixed date
  formats, blank symbols, missing quantities, non-filled rows, fee columns,
  duplicate-like fills, shorts, partial exits, and open positions.

## 2026-05-08 - Broker CSV Repair/Save Fixture Matrix

Added a focused fixture matrix for messy broker CSV repair and save readiness.

What changed:

- Added `buildBrokerCsvRepairSaveFixtureMatrix()` and
  `runBrokerCsvRepairSaveFixtureMatrix()`.
- Covered mixed date formats, split fee columns, partial exits, missing symbols,
  missing quantities, non-filled skipped rows, short open positions, and
  duplicate-like fills.
- Each case runs through dry-run preview, repaired CSV text when applicable,
  commit planning, in-memory commit, and saved-trade assertions.
- Added tests proving blocked rows can become saved trades after repair, open
  short positions remain explicit review-gated cases, duplicate-like fills stay
  anomaly-visible, and skipped non-filled rows remain visible without becoming
  hard failures.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- New focused Vitest passed:
  `broker-csv-repair-save-fixture-matrix.test.ts` `4/4`.
- Adjacent import/parser Vitest pack passed: buy/sell fixture matrix, import
  commit planner, saved import API routes, and broker execution CSV parser:
  `47/47`.
- `npm run build` passed. The first build run timed out at 3 minutes, so it was
  rerun with a longer timeout and completed successfully.

Next best step:

- Continue launch hardening with coaching language QA over saved/imported
  trades: check that execution-only, market-context-missing, open-position, and
  repair/duplicate cases use specific but conservative language.

## 2026-05-08 - Saved Import Coaching Language QA

Completed the saved/imported trade coaching language hardening lane.

What changed:

- Added `buildSavedImportCoachingLanguageQaMatrix()` and
  `runSavedImportCoachingLanguageQaMatrix()`.
- Covered clean closed saved executions, repaired import save-source language,
  duplicate-like fill review prompts, short execution review, open-position
  coaching blocks, missing market context, failed decision-review diagnostics,
  and levels-system market context.
- Extended the coaching language guardrail surface to export the quality audit
  types and to test saved/imported coaching as its own QA matrix.
- Added regression tests proving execution-only coaching cannot claim support
  held or setup failure without market context, and direct buy/sell advice is
  blocked even when market context exists.
- Kept open-trade and analysis-failed fallback wording explicit: saved open
  trades wait until flat before completed-trade coaching, and failed analysis
  routes to diagnostics with conservative execution-only language.

Verification:

- Focused Vitest passed: saved import coaching matrix, coaching language
  quality, coaching language readiness, and coaching fixture expectation matrix:
  `8/8`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.

Next best step:

- Continue launch hardening with a broader saved-import regression pass:
  exercise import save, saved trades, analytics, coach, review queue, and repair
  carry-forward together in one end-to-end flow with the current SQLite read
  models.

## 2026-05-08 - Saved Import End-To-End Regression

Completed the broader saved-import regression pass for the current SQLite
read-model loop.

What changed:

- Extended the repaired-row browser flow so a missing-quantity CSV repair proves
  more than trade persistence.
- The repaired flow now verifies saved SQLite analytics, saved coach state,
  saved review queue state, analytics and coach summary strips, and the review
  queue route after Save Import.
- Added an API-level regression that commits a repaired CSV-style payload in an
  isolated temporary SQLite database and verifies saved trades, latest analytics,
  latest coach, and review queue next-action language for failed
  decision-review diagnostics.
- Adjusted browser assertions so responsive Playwright projects can run in
  parallel against the shared local demo DB without incorrectly assuming each
  project owns the global "latest" report.

Verification:

- Focused Vitest passed: saved import API routes and saved import coaching
  language QA matrix: `10/10`.
- Focused Playwright repaired-row flow passed across Chromium desktop, tablet,
  and mobile: `3/3`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.

Next best step:

- Continue launch hardening with import-history/recovery ergonomics: make the
  user-facing imports page clearer for committed, duplicate, blocked-by-repair,
  and saved-from-repair cases, then add one route-level regression for those
  states.

## 2026-05-08 - Import History Recovery Ergonomics

Completed the import-history and recovery page hardening pass.

What changed:

- Updated `/imports` so recovery queue cards now show clearer user-facing
  state, specific next actions, duplicate-file explanation, fix-required repair
  counts, review counts, and ready-to-save previews.
- Updated import history rows to translate raw statuses into end-user labels:
  `Saved import`, `Saved after repair`, `Duplicate review`, `Repair required`,
  `Review before save`, and `Ready to save`.
- Added visible actions such as `Review saved trades`, `Open original import`,
  `Resolve repair rows`, `Review decisions`, and `Save import`.
- Kept raw status visible as secondary audit context without making it the main
  thing the user has to understand.
- Extended browser route regressions so committed imports, duplicate imports,
  blocked repair imports, and repaired-save imports all prove the `/imports`
  page is understandable after the import flow.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Focused Playwright import-history/recovery route checks passed across
  Chromium desktop, tablet, and mobile: `9/9`.

Next best step:

- Continue launch hardening with a full import-route visual and overflow pass:
  `/import-dry-run`, `/imports`, `/imports/[batchId]`, `/trades`,
  `/analytics`, `/coach`, and `/review` after a saved import, with screenshots
  retained for the currently most important routes.

## 2026-05-08 - Saved Import Visual Overflow Pass

Completed the full saved-import route visual and overflow pass.

What changed:

- Added `saved-import-visual-overflow.spec.ts`.
- The test seeds a real saved import through the import batch API, commits it,
  finds the saved trade, and then visits the key saved-data routes:
  `/import-dry-run`, `/imports`, `/imports/[batchId]`, `/trades`,
  `/trades/[tradeId]`, `/analytics`, `/coach`, and `/review`.
- Each route now gets page-health checks, broken-page phrase checks,
  horizontal overflow checks, core panel assertions, and viewport screenshots
  attached to the Playwright run.
- Covered the pass across Chromium desktop, tablet, and mobile.

Verification:

- Focused Playwright saved-import visual/overflow pass passed across Chromium
  desktop, tablet, and mobile: `3/3`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.

Next best step:

- Continue with `/imports/[batchId]` detail-page polish: make the batch detail
  page match the clearer recovery language from `/imports`, especially around
  decision-review diagnostics, duplicate details, repair actions, and saved
  trade links.

## 2026-05-08 - Import Batch Detail Polish

Completed the `/imports/[batchId]` detail-page polish pass.

What changed:

- Added a user-facing import action summary to the batch detail page.
- Replaced raw-first status presentation with clearer labels like `Saved import`
  while keeping raw status visible as secondary audit context.
- Added saved-output links for committed imports: saved trades, analytics,
  coach, and highest-priority review queue.
- Reworked decision-review status copy into a diagnostics section that explains
  why analysis failures, unavailable market context, open trades, and skipped
  review jobs should stay conservative.
- Strengthened saved-trade rows with explicit `Open trade review` calls to
  action.
- Improved duplicate detail copy so duplicate matches are clearly treated as
  review blocks, not silent failures.
- Updated repair action copy to clarify that repaired row values should come
  from a repaired CSV preview before saving.
- Extended browser assertions for committed, duplicate, blocked-by-repair, and
  repaired-save batch detail states.

Verification:

- Focused Playwright import-flow route checks passed across Chromium desktop,
  tablet, and mobile: `9/9`.
- Saved-import visual/overflow pass passed across Chromium desktop, tablet, and
  mobile: `3/3`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.

Next best step:

- Continue launch hardening with generic broker import edge-case expansion:
  add more fixture and UI coverage for odd headers, mixed timestamp formats,
  side aliases, repeated partial fills, zero/blank quantities, shorts, and open
  positions so the generic importer feels resilient beyond the known samples.

## 2026-05-08 - Generic Broker Import Edge-Case Expansion

Completed the generic broker CSV edge-case expansion pass.

What changed:

- Added product fixture coverage for generic CSVs with odd but realistic broker
  headers: `Ticker`, `Executed At`, `Action`, `Qty`, `Fill Price`,
  `Commission`, `Fees`, and `Net Amount`.
- Added generic side-alias coverage for `BOT` / `SLD` partial fills and
  `SELL SHORT` / `BUY TO COVER` closed short trades.
- Added repair-gated fixture coverage for zero and blank quantities, including
  the repaired-save path that turns the blocked preview into a valid closed
  trade.
- Extended the app feature regression browser flow so `/import-dry-run` now
  exercises odd headers, partial exits, cost visibility, short-side aliases,
  duplicate-like fills, and zero/blank quantity rejection states from the UI.

Verification:

- Focused Vitest fixture/parser coverage passed: `2` files, `36` tests.
- Focused Playwright import repair route passed on Chromium desktop: `1/1`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.

Next best step:

- Continue launch hardening with saved-data confidence checks after generic
  import save: verify these generic edge-case imports persist correctly through
  `/api/import-batches/preview`, commit, `/api/trades`, analytics, coach, and
  review read models, then add a small saved-import fixture for one generic
  long and one generic short case.

## 2026-05-08 - Short Scope Parked For Current Beta

Clarified the product scope after reviewing short-position support.

Decision:

- Do not continue building full short-trader coaching right now.
- Keep existing short parsing/math tests as defensive coverage so the importer
  does not break when a broker CSV contains sell-short / buy-to-cover style
  executions.
- Do not market Trader Intelligence as a short-seller coaching product in the
  current beta.
- Keep current beta focus on long-side day-trade execution review, saved
  imports, analytics, coach, review queues, and generic broker import trust.

Docs updated:

- `docs/content/traderslink-seo-content-plan-starting-point.md`
- `src/docs/feature-completion-to-live-launch-plan-2026-05-07.md`
- `src/docs/import-and-coaching-audit-plan-2026-05-06.md`
- `src/docs/trader-feedback-capabilities.md`

Next best step:

- Continue with the long-focused saved import confidence pass: prove generic
  long imports persist through preview, commit, `/api/trades`, analytics,
  coach, and review read models. For any short import encountered in that work,
  keep output conservative and avoid short-specific coaching claims.

## 2026-05-08 - Long-Focused Saved Import Confidence Pass

Completed the saved-data confidence pass for the current long-side launch path.

What changed:

- Added an API/read-model regression for a broker-like generic long CSV with
  odd headers, mixed timestamp formats, `BOT` / `SLD` side aliases, partial
  exits, commissions, fees, and broker net amounts.
- The regression now proves the import can preview, commit, appear in
  `/api/trades`, update latest analytics, update latest coach state, and create
  saved review queue work.
- Changed the browser saved-import flow to use the same realistic generic
  long-side shape instead of the simple Date/Time/Buy/Sell sample.
- Tightened saved-import coaching language QA so short imports are described as
  limited defensive import support, not short-seller coaching.
- Added a saved short import guardrail proving saved read models do not produce
  short-seller coaching, short-squeeze alert, locate, or short-specific trade
  signal claims.

Verification:

- Focused Vitest passed: saved import API routes and saved import coaching
  language QA matrix: `13/13`.
- Focused Playwright saved generic import flow passed on Chromium desktop:
  `1/1`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.

Next best step:

- Continue launch hardening with long-side coaching quality over saved imports:
  inspect the actual saved coach/read-model language for profitable partial
  exits, adverse adds, clean exits, open trades, and repaired imports, then add
  guardrails only where the copy is too generic or overconfident.

## 2026-05-08 - Long-Side Saved Coaching Quality Guardrails

Completed the long-side saved coaching quality pass for the current beta scope.

What changed:

- Added saved-import coaching language QA cases for long profitable partial
  exits, long adverse adds, and long clean full exits.
- Expanded the coaching language audit evidence patterns so approved copy can
  name partial exits, profitable reductions, adverse-price adds, prior average
  entry, returned-to-flat execution, and final exits without triggering false
  missing-evidence failures.
- Added API preview regressions proving saved long imports produce specific
  execution feedback for:
  - profitable partial exits,
  - clean full exits,
  - adverse adds after entry.
- Added a saved open-long import regression proving open positions can be saved
  only after acknowledgement and remain blocked from completed-trade coaching in
  the saved review queue.
- Kept the short-scope boundary intact: short imports remain defensive import
  support only, with no short-seller coaching claims.

Verification:

- Focused Vitest passed: saved import API routes and saved import coaching
  language QA matrix: `17/17`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.

Next best step:

- Continue launch hardening with repaired-import coaching/read-model polish:
  make repaired saved imports visibly carry repaired-source caution through
  analytics, coach, review, and trade-detail surfaces, then add one browser
  regression only if the UI text changes.

## 2026-05-08 - Repaired Import Source Caution Surfaces

Completed the repaired-import read-model polish pass.

What changed:

- Added durable `repairSource` tracking to import commit plans, committed
  batches, saved trades, and saved-trade analytics conversion.
- The import dry-run save payload now marks edited CSV saves as `repaired_csv`
  and unedited saves as `original_csv`.
- Added a reusable repaired-import caution read model and UI card.
- Surfaced repaired-source caution through:
  - `/api/analytics/latest`,
  - `/api/coach/latest`,
  - `/api/review/latest`,
  - `/api/trades/[tradeId]`,
  - `/analytics`,
  - `/coach`,
  - `/review`,
  - `/trades/[tradeId]`.
- Repaired-source copy stays conservative: users are told to review repaired
  row values before trusting coaching evidence.

Verification:

- Focused Vitest passed: saved import API routes, import commit planner, and
  SQLite import commit repository: `28/28`.
- `npm run build` passed.
- Focused Playwright repaired-row save flow passed on Chromium desktop: `1/1`.
- `npx tsc --noEmit --pretty false` passed.

Next best step:

- Continue launch hardening with trade-detail/review-queue polish for real
  beta use: make the saved trade page and review queue clearer around analysis
  failed, market-context unavailable, open-trade blocked, and repaired-source
  states, then run the saved-route visual overflow checks again.

## 2026-05-08 - Saved Review Queue And Trade Detail State Polish

Completed the trade-detail and saved review queue state polish pass.

What changed:

- Added user-facing state labels, details, review-scope labels, and next actions
  to saved review queue items.
- `/review` now explains why a saved item is completed, blocked as an open
  trade, missing market context, analysis-failed, skipped, or queued instead of
  relying on raw lane/status text.
- `/trades/[tradeId]` now includes a feedback-scope panel that tells the user
  whether decision review is ready, open-trade blocked, market-context
  unavailable, analysis-failed, or execution-only.
- The trade-detail state copy explicitly avoids treating market-context
  conclusions as available when decision review failed.
- Repaired-source caution remains visible on the same trade-detail page.

Verification:

- Focused Vitest passed: saved import API routes and SQLite import commit
  repository: `21/21`.
- `npm run build` passed.
- Focused Playwright repaired-row save flow passed on Chromium desktop: `1/1`.
- `npx tsc --noEmit --pretty false` passed.

Next best step:

- Run the saved-route visual overflow pass again across desktop, tablet, and
  mobile now that review/trade detail copy changed.

## 2026-05-08 - Saved Route Responsive Verification Pass

Completed the non-SEO verification pass after the saved review queue and trade
detail state-copy changes.

What changed:

- No product or SEO content was generated in this pass.
- No UI code changes were needed: the saved-route visual/overflow regression
  stayed clean across desktop, tablet, and mobile.
- Confirmed the repaired-source caution and feedback-scope surfaces still fit
  inside the saved import workflow pages after the latest copy updates.

Verification:

- Saved-route visual overflow Playwright pass completed across
  `chromium-desktop`, `chromium-tablet`, and `chromium-mobile`: `3/3`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.

Next best step:

- Continue non-SEO launch hardening by reviewing the import/trade-management
  user path for any remaining confusing beta-state copy or missing defensive
  affordances before switching back to website/SEO work.

## 2026-05-08 - Non-Auth Launch Readiness Hardening Pass

Completed the requested non-SEO launch-readiness pass with auth intentionally
deferred for controlled testing.

What changed:

- Replaced the misleading saved-mode `authenticated_persistent` label with
  `local_sqlite_single_user` storage for current saved-import beta flows.
- Updated storage readiness copy so local SQLite is treated as useful
  single-user beta persistence, not production tenant-safe storage.
- Tightened coach/review copy so saved-import coaching actions name saved
  execution or replay evidence instead of generic action language.
- Expanded the saved-import calibration output to include quality-violation
  text when a copy audit fails.
- Updated browser hardening specs for the current public homepage plus internal
  `/workspace` split and for saved-trade list/detail behavior after imports
  replace the old sample trade route.
- Documented the current controlled-beta storage boundary in the production
  safety checklist.

Verification:

- Full Vitest passed: `104` files, `914` tests.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Saved import calibration passed on `generic-execution-sample.csv`:
  preview `ready_to_commit`, commit `committed`, duplicate re-import
  `needs_user_review`, coaching readiness `pass`, coaching quality audit
  `true`, quality violations `0`.
- First-user hardening Playwright passed on Chromium desktop: `7/7`, with the
  Firefox-only smoke skipped under the desktop project.
- App feature regression Playwright passed on Chromium desktop: `12/12`, with
  the mobile-only route overflow test skipped under the desktop project.
- Saved-route responsive visual/overflow Playwright passed across desktop,
  tablet, and mobile: `3/3`.

Launch read:

- Ready for controlled single-user or trusted closed-beta testing without auth,
  as long as real multi-user/customer data is not mixed in the same environment.
- Not ready for broad paid public launch until auth, account isolation,
  authorization, backup/migration, and deletion controls are added.

Next best step:

- If staying non-SEO, run a hosted-environment smoke test after deployment using
  one clean test CSV and one repaired-row CSV, then capture any deploy-only env
  or persistence issues before inviting testers.

## 2026-05-08 - Local Browser Smoke And Deployment Target Check

Opened the current local app in the user's browser at `http://localhost:3000`
before continuing the non-SEO readiness path.

What changed:

- No SEO content was generated in this pass.
- No product code changes were needed.
- Confirmed the local dev app is reachable in the user's browser.
- Checked Vercel linkage before deploying. The repo does not have
  `.vercel/project.json`, and the discovered Vercel account currently exposes
  only the `vercel-landing` project. Treat deployment as blocked until the
  Trader Intelligence app is linked to the correct Vercel project or a new
  preview project is intentionally created.

Verification:

- Local route smoke on `localhost:3000` returned `200 OK` for `/`,
  `/workspace`, `/trades`, `/import-dry-run`, and `/platform-readiness`.
- Focused production-mode Playwright smoke passed on Chromium desktop:
  `20` passed, `2` skipped for project-specific mobile/Firefox coverage.

Launch read:

- Still acceptable for controlled local/single-user testing without auth.
- Do not invite unrelated users or import unrelated customer data into the same
  environment until auth/account isolation exists.

Next best step:

- Link the app to the intended Vercel project, then run the hosted smoke test
  against that preview URL with one clean CSV and one repaired-row CSV.

## 2026-05-08 - Handoff Clarification For App Vs Landing Page

Updated the fresh-chat handoff after the user clarified that the root homepage
at `/` is only a temporary landing page and should not be treated as the actual
Trader Intelligence app dashboard.

What changed:

- Updated `src/docs/trader-intelligence-next-chat-handoff-2026-05-06.md` with a
  May 8 resume update.
- Recorded that local app review should open `/workspace`, not `/`.
- Recorded that nothing has been uploaded to Vercel in the latest pass.
- Recorded that the only discovered Vercel project is `vercel-landing`, which
  is the landing-page-only project and must not receive the full app by
  accident.
- Reconfirmed that auth is deferred only for controlled local/single-user or
  trusted closed-beta testing.
- Reconfirmed that Trader Intelligence should not be marketed as short-seller
  coaching yet.

Verification:

- Docs-only update; no code or test run needed.

Next best step:

- Keep deployment paused. Continue local app review from `/workspace`. If the
  user later asks to deploy the full app, first link/create the intended Trader
  Intelligence Vercel project, then run the hosted smoke test with one clean CSV
  and one repaired-row CSV.

## 2026-05-08 - App Familiarization And QC Pass

Started a product-quality pass over the current app surface after the user asked
for feature completeness, improvement, and quality-control review.

What was inspected:

- current handoff and project log
- behavior coverage audit and Layer 2 pattern catalog
- Next 16 local docs for App Router pages, route handlers, and
  server/client components before touching app code
- route map under `app/`
- product/e2e coverage for import, saved trades, analytics, coach, review,
  progress, mobile overflow, accessibility smoke, and truthfulness boundaries
- live local app routes at `localhost:3000`, starting from `/workspace`

QC finding fixed:

- Internal pages labeled `Back to workspace` were linking to `/`, but `/` is
  the temporary public landing page. Updated those links to `/workspace` across
  the internal app pages and added the missing workspace return link on
  `/analytics`.

Important QC finding still open:

- Saved analytics/coach/review displayed one saved-trade diagnostic:
  `analysis failed: Cannot find module as expression is too dynamic`. Focused
  saved-import unit/API tests still pass, so this looks like a runtime/server
  bundling or local saved-data replay issue around the levels-system decision
  review path. This should be investigated before trusting the saved
  decision-review loop for beta users.

Current product read:

- The app has broad feature coverage for import dry-run, row repair, saved
  imports, saved trades, analytics, coach, review queue, progress, import
  recovery, and readiness/status surfaces.
- The main beta gap is not basic route existence; it is product coherence,
  persistence safety, and reducing fixture/prototype/admin surfaces before a
  tester uses it.
- The workspace is currently an internal launcher, not a polished persistent app
  shell.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Focused Playwright route regression passed:
  `npx playwright test tests/e2e/app-feature-regression.spec.ts -g "loads the main end-user routes" --project=chromium-desktop`.

Next best step:

- Investigate and fix the saved decision-review runtime diagnostic, then
  continue QC by pruning or gating non-user-facing routes from the beta
  workspace and tightening the first-user navigation flow.

## 2026-05-08 - Workspace Split Into End-User App And Admin Tools

Separated the mixed route launcher into clearer end-user and internal-tool
surfaces.

What changed:

- Reworked `/workspace` into a trader-facing app dashboard centered on:
  import trades, saved trades, coach, analytics, guided review, progress,
  session recap, comparison, onboarding, first-run setup, import history, and
  account/storage state.
- Added `/workspace/admin` as the internal backend/webmaster/QA control room for
  import trials, import health, repair wizard, review cockpit, calibration,
  platform readiness, broker mapping admin, and debug consoles.
- Kept the underlying internal routes available, but removed them from the main
  trader workflow so the end-user side can be polished without admin/debug
  clutter.

Product read:

- This is the right structural direction before deeper UI polish: the app can
  now be evaluated as a trader workflow instead of as one giant internal
  dashboard.
- Next end-user polish should focus on the primary loop:
  `/workspace -> /import-dry-run -> /imports -> /trades -> /coach or /review ->
  /progress`.

Verification:

- Browser render check passed for `/workspace` and `/workspace/admin` with no
  page-level horizontal overflow at desktop.
- `npx tsc --noEmit --pretty false` passed.
- Focused workspace crawler passed:
  `npx playwright test tests/e2e/app-first-user-hardening.spec.ts -g "crawls workspace internal links" --project=chromium-desktop`.
- Focused demo user path passed:
  `npx playwright test tests/e2e/app-feature-regression.spec.ts -g "completes the demo user path" --project=chromium-desktop`.
- `npm run build` passed.

Next best step:

- Fix the saved decision-review runtime diagnostic, then continue dialing in the
  end-user app by making `/workspace` feel like a real dashboard with status,
  recent import/review state, and fewer static cards.

## 2026-05-08 - Saved Decision Review Runtime Fix And Live Workspace State

Fixed the production saved-decision-review runtime failure found during the QC
pass and upgraded `/workspace` from a static route menu into a stateful
end-user dashboard.

What changed:

- Replaced the Turbopack-sensitive runtime-composed `levels-system` loaders in
  the saved decision-review analysis path with native dynamic imports marked to
  stay runtime-only.
- Added `levels-system-phase1` to `serverExternalPackages` in `next.config.ts`
  so the sibling file dependency remains server-external.
- New production saved imports no longer fail with:
  `Cannot find module as expression is too dynamic` or `require is not defined`.
- Classified saved decision-review candle/warehouse misses as
  `market_context_unavailable` instead of generic `analysis_failed`, keeping
  user-facing review copy execution-only and truthful when market context is
  missing.
- Updated saved-import API expectations for the market-context-unavailable lane.
- Made `/workspace` dynamic and added live state cards:
  data source, saved trade count, review queue count, context gaps, next best
  action, and latest import.
- Kept the primary import entry labeled `CSV Dry Run` so the first-user/demo
  path remains clear.

Verification:

- Focused Vitest passed:
  `src/lib/trade-analysis/__tests__/classify-trade-analysis-failure.test.ts`
  and `src/lib/trader-analytics/__tests__/saved-import-api-routes.test.ts`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Production-mode saved import browser flow passed:
  `npx playwright test tests/e2e/import-dry-run.spec.ts -g "saves a generic CSV import" --project=chromium-desktop`.
- Production-mode demo user path passed:
  `npx playwright test tests/e2e/app-feature-regression.spec.ts -g "completes the demo user path" --project=chromium-desktop`.
- Workspace link crawler passed:
  `npx playwright test tests/e2e/app-first-user-hardening.spec.ts -g "crawls workspace internal links" --project=chromium-desktop`.

Next best step:

- Continue end-user polishing from the now-stateful `/workspace`: tighten the
  first-run/import path, add clearer empty/saved states around market-context
  gaps, and decide which admin/readiness links should be hidden entirely for a
  closed-beta tester.

## 2026-05-08 - Closed-Beta Workspace Focus Pass

Tightened the split between the end-user Trader Intelligence app and the
internal/admin surfaces.

What changed:

- Removed account/readiness/admin cards from the main `/workspace` user grid.
- Kept `/workspace/admin` as the home for platform readiness, account/plan
  status, broker mapping admin, calibration, import QA, and debug consoles.
- Left only a small `Internal tools` escape hatch in the beta boundary panel,
  instead of presenting admin tools as a primary user action.
- Updated `/first-run` so it points a closed-beta user toward one clean saved
  import, with clearer copy around what unlocks after that import and why
  market context can be backfilled later.
- Preserved the `CSV Dry Run` wording on the primary import card so the
  existing demo/first-user path remains obvious.

Verification:

- Browser route check confirmed `/workspace` no longer links to `/account` or
  `/platform-readiness`, while `/workspace/admin` does.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- First-user Playwright flow passed:
  `npx playwright test tests/e2e/app-first-user-hardening.spec.ts -g "guides a first user" --project=chromium-desktop`.
- Demo user path passed:
  `npx playwright test tests/e2e/app-feature-regression.spec.ts -g "completes the demo user path" --project=chromium-desktop`.
- Workspace crawler passed:
  `npx playwright test tests/e2e/app-first-user-hardening.spec.ts -g "crawls workspace internal links" --project=chromium-desktop`.

Next best step:

- Continue dialing in end-user surfaces in order of user value:
  `/import-dry-run`, `/imports`, `/trades`, then `/coach` and `/review`.
  The next concrete pass should reduce import-screen density and make the
  save/review transition feel like one guided workflow rather than a tool panel.

## 2026-05-08 - Guided Import Workflow Polish

Turned the import path into a clearer end-user flow across the existing
implementation.

What changed:

- Added a shared import workflow strip for:
  `/import-dry-run`, `/imports`, `/imports/[batchId]`, and `/trades`.
- The strip frames the path as:
  upload executions -> save or repair -> review saved trades.
- Committed import batch pages now show the review step as current, making the
  saved-output links feel like the intended next action instead of an admin
  artifact.
- Saved trades now explains whether the user is in the imported-data review
  loop or still seeing sample fallback.
- Added Playwright assertions so the workflow strip is protected on the dry-run,
  committed batch, import history, and saved trades parts of the flow.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Focused Playwright import flow passed:
  `npx playwright test tests/e2e/import-dry-run.spec.ts -g "renders the required|saves a generic" --project=chromium-desktop`.

Next best step:

- Continue end-user polish on `/trades` and `/review`: make the saved trade list
  less table-like, surface the highest-priority review item more directly, and
  keep admin/diagnostic detail one click away from the normal trader workflow.

## 2026-05-08 - End-User Import Review Workflow Completion Pass

Completed the requested 1-8 workflow polish bundle around the import-to-review
path.

What changed:

- Added a saved-trades triage panel on `/trades` that surfaces the next
  highest-priority saved trade, lane counts, and direct review actions.
- Converted the saved-trade list from a dense table into scan-friendly trade
  cards with P/L, review scope, source, and lane state.
- Added a review continuation panel on `/review` so the page starts with the
  active review item, lane counts, and next action.
- Tightened `/imports/[batchId]` after a committed import with one primary
  handoff CTA: review the first saved trade or open the highest-priority queue.
- Improved empty/sample states so `/trades`, `/review`, `/coach`, and
  `/analytics` direct the user back to one clean CSV import before real saved
  review data exists.
- Reworded market-context gaps so the app says execution review is available
  now while market-context coaching waits for candle/level backfill.
- Demoted raw diagnostic/status detail on normal user pages behind technical
  review-limit disclosure, while keeping admin/import detail available.
- Added browser coverage for the guided end-user route crawl:
  `/workspace -> /import-dry-run -> /imports -> /trades -> /review -> /coach ->
  /analytics`.
- Expanded import E2E assertions to protect the committed-import handoff,
  saved-trades triage panel, review continuation panel, and market-context gap
  copy.

Verification:

- Focused Vitest passed:
  `npx vitest run src/lib/trader-analytics/__tests__/saved-import-api-routes.test.ts src/lib/trader-analytics/__tests__/sqlite-import-commit-repository.test.ts src/lib/trader-analytics/__tests__/saved-import-coaching-language-qa-matrix.test.ts --reporter=dot`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Focused import Playwright passed:
  `npx playwright test tests/e2e/import-dry-run.spec.ts -g "saves a generic|repairs a missing-quantity" --project=chromium-desktop`.
- Guided route crawl passed:
  `npx playwright test tests/e2e/app-feature-regression.spec.ts -g "walks the guided end-user path" --project=chromium-desktop`.

Next best step:

- Continue with visual/responsive QA for the updated `/trades` and `/review`
  layouts across desktop, tablet, and mobile, then polish the individual trade
  detail page if the new triage flow exposes any rough spots.

## 2026-05-08 - Analytics UI Clarity And Chart Presentation Pass

Started the broader UI/user-friendliness correction after the user called out
that the app still felt random, hard for a newer trader to understand, and weak
on analytics presentation.

What changed:

- Added a new trader-facing analytics overview at the top of `/analytics`.
- The overview now leads with:
  - gross result,
  - win rate,
  - best trade,
  - worst trade,
  - next review action,
  - biggest risk,
  - best strength.
- Restored visible chart-style presentation using the existing analytics chart
  data:
  - win/loss mix,
  - entry-session P/L,
  - gross P/L by trade,
  - entry-hour P/L,
  - key execution risk rates.
- Moved technical/internal-feeling analytics panels into an
  `Advanced setup and import diagnostics` disclosure so the main flow starts
  with trader-usable information instead of readiness/import QA details.
- Reordered the main analytics page so the user sees:
  overview -> time-of-day -> weekly review/market context -> coaching and
  improvement panels -> detailed filters/tables.
- Added Playwright assertions that require the new overview and chart cards to
  remain visible.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Focused analytics Playwright passed:
  `npx playwright test tests/e2e/app-feature-regression.spec.ts -g "shows the analytics product intelligence surfaces" --project=chromium-desktop`.
- Core desktop visual smoke passed:
  `npx playwright test tests/e2e/app-feature-regression.spec.ts -g "captures visual smoke screenshots" --project=chromium-desktop`.
- Core mobile overflow pass passed:
  `npx playwright test tests/e2e/app-feature-regression.spec.ts -g "keeps core mobile routes usable" --project=chromium-mobile`.

Next best step:

- Continue the same UI correction pass on `/coach`, `/review`, and
  `/trades/[tradeId]`: simplify the language, make the main action obvious, and
  keep advanced/internal details behind disclosure or admin surfaces.

## 2026-05-08 - Core App UI/User-Friendliness Correction Pass

Continued the one-run UI correction across the actual Trader Intelligence app
after the user clarified that the priority was not SEO, but making the product
flow clearer for a newer trader.

What changed:

- Added shared trader-facing presentation primitives in `app/app-ui.tsx`:
  primary action panels, metric cards, simple bar/mix charts, advanced
  disclosures, and plain state badges.
- Reworked `/workspace` into a product home with the explicit flow:
  import trades -> review next trade -> check analytics -> open coach.
- Reworked `/trades` around:
  review priority trade, all saved trades, needs chart context, open trades,
  simplified filters, and plain saved/sample data language.
- Rebuilt the top of `/review` as a work queue with a "Review This First"
  primary action, clearer lanes, and explicit "Open Trade Review" actions.
- Rebuilt the top of `/coach` as a plain review plan:
  "Do This Next", "Avoid This Next Session", "Repeat This", and
  "Review This Trade", backed by saved trade evidence and session timing.
- Reworked `/trades/[tradeId]` into a review workspace with:
  what happened, what to review, what to write down, what is unavailable,
  checklist progress, clearer execution replay labels, and renamed review
  sections.
- Finished the analytics language cleanup by using shared chart cards and
  renaming trader-facing sections:
  "Chart Context Status", "Find Trades Behind A Number", "Trades Matching
  Filters", and "Execution Habits To Review".
- Renamed user-facing import copy from "CSV Dry Run" to "Import Trades" and
  removed/demoted raw-feeling labels such as saved sqlite, sample fallback,
  market gaps, open blocks, analysis failed, and diagnostic buckets from the
  primary user flow.
- Updated regression and copy-safety coverage so core product routes protect
  the new flow, analytics charts, coach primary action, review queue language,
  mobile overflow, and banned product claims.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Full desktop feature regression passed:
  `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop`.
- Core mobile overflow passed:
  `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable"`.
- Import/save/trade-detail focused Playwright passed:
  `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop -g "saves a generic CSV import|shows unavailable daily/4h market context|repairs a missing-quantity"`.
- Focused route/model contract Vitest passed:
  `npx vitest run src/lib/trader-analytics/__tests__/saved-import-api-routes.test.ts src/lib/trader-analytics/__tests__/trader-import-trial-experience.test.ts --reporter=dot`.

Next best step:

- Do a visual tuning pass with screenshots open side-by-side for `/analytics`,
  `/coach`, `/review`, `/trades`, and `/trades/[tradeId]`; tighten spacing,
  reduce overlong metric-card values, and decide whether any remaining advanced
  sections should move fully under `/workspace/admin`.

## 2026-05-08 - User-Facing Review Summary And Mock Single-Trade UI

Continued the Trader Intelligence UX work from the new-user QC roadmap added on
GitHub. The focus shifted from dashboards to the product translation layer:
turning coaching/scoring output into a beginner-safe trade review summary.

What changed:

- Added `UserFacingTradeReviewSummary` under
  `src/lib/user-facing-review/types/`.
- Added `buildUserFacingTradeReviewSummary` under
  `src/lib/user-facing-review/mappers/` so the UI can consume product-ready
  summaries instead of raw engine internals.
- Added mapper tests covering chase entry, strength-first profit protection,
  mixed/moderate-confidence review, and needs-more-data review.
- Added `/trader-intelligence` as a mock single-trade review surface with eight
  representative cases from the roadmap.
- Added a homepage link to preview Trader Intelligence.
- Tightened `MetricCard` wrapping and reduced overlong first-viewport metric
  values on `/coach` and `/trades/[tradeId]`.
- Added Playwright coverage for beginner-safe Trader Intelligence mock reviews
  and included `/trader-intelligence` in core route/mobile/visual smoke checks.
- Added
  `src/docs/trader-intelligence-user-facing-review-summary-implementation.md`
  to document the new contract, route, UX rules, verification, and next step.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npx vitest run src/lib/user-facing-review/__tests__/build-user-facing-trade-review-summary.test.ts --reporter=dot` passed.
- `npm run build` passed.
- Focused desktop Playwright passed:
  `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "beginner-safe Trader Intelligence|captures visual smoke screenshots"`.
- Core mobile overflow Playwright passed:
  `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable"`.
- Desktop/mobile screenshots were captured under
  `artifacts/visual-qc/2026-05-08-user-facing-review-final/` for
  `/trader-intelligence`, `/coach`, and `/trades/[tradeId]`.

Next best step:

- Wire `UserFacingTradeReviewSummary` to real saved trade review data once the
  mock single-trade review surface feels right.

## 2026-05-08 - End-User UI Overhaul Roadmap

Added a more complete implementation roadmap after the user clarified that the
app still does not look visually strong enough and needs charts, clearer
red/green presentation, richer localhost data, and stronger new-trader UX.

What changed:

- Added
  `src/docs/trader-intelligence-end-user-ui-overhaul-plan-2026-05-08.md`.
- The roadmap explicitly separates what the prior pass improved from what still
  needs work.
- The plan prioritizes reusable chart/report components, richer demo data,
  real trade-detail integration, analytics redesign, coach/review queue
  redesign, import onboarding, beginner education, and admin/debug isolation.

Next best step:

- Start Run 1 from that roadmap: visual chart foundation plus richer sample data
  so localhost shows enough trades/executions to judge the UI as a real end
  user.

## 2026-05-09 - Competitor Dashboard Research

Reviewed dashboard/product screenshots and feature surfaces from StonkJournal,
TraderSync, Tradervue, Trademetria, TradesViz, and TradeZella after the user
asked for visual inspiration and feature gap research.

What changed:

- Added `src/docs/competitor-dashboard-research-2026-05-09.md`.
- Downloaded a small set of screenshot assets locally under
  `artifacts/competitor-research/dashboard-screenshots/` for inspection. These
  are research artifacts only and remain uncommitted.
- The research concluded that Trader Intelligence needs a much stronger visual
  report layer: P/L curve, win/loss donut, daily PnL calendar, session bars,
  entry-hour heatmap, behavior-cost chart, execution timeline, running trade
  P/L, and richer localhost demo data.

Next best step:

- Implement Run 1 from the UI overhaul: chart foundation plus richer sample
  data, then redesign `/analytics` above the fold with real red/green visual
  reporting.

## 2026-05-09 - Coach Flow, Progress Saved Data, And Trade Replay Clarity

Responded to the first real saved April IBKR import review from localhost. The
user confirmed analytics is moving in the right direction, but coach/progress
and saved-trade presentation were still confusing.

What changed:

- Reworked `/coach` so the first user-facing surface is a four-step coaching
  session:
  1. replay one trade,
  2. name the main behavior,
  3. choose one fix-first rule,
  4. check progress.
- Kept the existing coach evidence and advanced panels, but made the coaching
  process visible before the supporting data.
- Fixed `/progress` so it builds from the saved-import analytics read model
  instead of the sample product shell.
- Updated `/trades` so saved trade cards open directly to the trade replay
  section and show round-trip context.
- Fixed `/trades` P/L display by matching report rows back to the exact saved
  trade order instead of matching only by symbol/date/direction, which made
  repeated same-symbol trades look like duplicated results.
- Added user-facing handling for imported rows that start with a sell: the UI
  now labels them as position-history review instead of showing short-side
  coaching language.
- Renamed the trade-detail replay heading to "Trade Replay" and added clearer
  copy for buys, adds, reductions, and exits.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed after stopping the dev server so `.next` was not
  locked.
- Restarted localhost on port `3000` with
  `LEVELS_SYSTEM_PROVIDER=ibkr`,
  `LEVELS_SYSTEM_WAREHOUSE_DIRECTORY=..\levels-system\data\candles`, and
  `LEVELS_SYSTEM_WAREHOUSE_MODE=replay`.
- `/workspace`, `/coach`, `/progress`, `/trades`, and a saved trade-detail
  route returned `200` during smoke checks.

Important product note:

- Current grouping treats a trade as one flat-to-flat round trip. If the trader
  fully exits and later re-enters the same ticker, the importer currently starts
  a new saved trade. That is useful for round-trip analytics, but the product
  also needs a higher-level same-symbol "trade idea/thread" layer so the app can
  tell stories like "the second re-entry gave back earlier profit" and compare
  volume/market context across the re-entry.

## 2026-05-09 - Saved Trade Thread Read Model

Started the higher-level trade idea/thread layer requested after reviewing the
April IBKR import. The importer still treats a completed position as a
flat-to-flat round trip, but the UI now has a product read model above that
accounting layer.

What changed:

- Added `src/lib/trader-analytics/server/saved-trade-threads.ts`.
- The read model groups same-symbol, same-session-date saved trades into ticker
  stories while preserving each original round trip.
- The story output names beginner-friendly cases such as "Re-entry gave back
  profit", "Re-entry added profit", "Repeated attempts lost money", and
  "Multiple round trips".
- Added `/trades` "Ticker Stories" UI so users can see same-ticker re-entry
  stories before scanning the full saved trade list.
- Added `/trades/[tradeId]` ticker-story context so an individual trade review
  can show the larger same-day story, story P/L, best push, weakest push,
  giveback, and related round trips.
- Added focused tests for same-symbol same-day grouping and same-symbol
  different-date separation.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts`
  passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Restarted localhost on port `3000` with replay candle settings. `/workspace`
  returned 200, and `/trades` rendered the new "Ticker Stories" and
  "Re-entry stories" copy.

Next best step:

- Add the next layer of story evidence: volume/context comparison across
  re-entries, especially "second entry happened after volume faded" and
  "re-entry gave back the first push" language. Keep it as a product read model
  above the existing round-trip importer instead of changing the importer
  contract.

## 2026-05-09 - Trade Thread Lifecycle Classification

Extended the saved trade thread layer after the user clarified that a closed
day-trade re-entry can either close intraday again or turn into swing/overnight
exposure.

What changed:

- Added `SavedTradeThreadLifecycleClassification` with:
  `single_round_trip`, `closed_day_trade_reentry`, `open_intraday_reentry`,
  `day_trade_turned_swing`, and `multi_day_ticker_thread`.
- Added round-trip level story facts for `entrySessionDate`, `exitSessionDate`,
  `heldOvernight`, and `crossedSessionDate`.
- `/trades` now shows a lifecycle badge and lifecycle explanation on each
  ticker story card.
- `/trades/[tradeId]` now shows the same lifecycle context inside the individual
  trade review workspace.
- The model explicitly distinguishes "re-entry is still open" from "day trade
  turned swing", so open imported executions do not get over-reviewed as
  completed trades.
- Added focused tests for closed re-entry, open intraday re-entry, day-trade
  turned swing/overnight exposure, same-symbol different-date separation, and
  product-copy safety.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts`
  passed with 5 tests.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Restarted localhost on port `3000`; `/workspace` returned 200 and `/trades`
  rendered ticker-story lifecycle copy including "Closed day-trade re-entry" and
  "Day trade turned swing" where present in the saved data.

Next best step:

- Add volume/context comparison evidence across re-entries. This should answer:
  did the second entry happen after volume faded, did it happen after the main
  push, and did it give back profit from the first completed round trip.

## 2026-05-09 - Trade Thread Review Evidence

Continued the ticker-story branch so the same-symbol re-entry layer does more
than classify the trade. It now gives the user a review question, a fix-first
action, and concrete evidence cards.

What changed:

- Added thread-level review evidence to
  `src/lib/trader-analytics/server/saved-trade-threads.ts`.
- Each ticker story can now expose:
  - `primaryReviewQuestion`
  - `fixFirstAction`
  - `reviewEvidence`
- Evidence currently uses already available saved-import facts:
  execution timestamps, P/L by round trip, time between exit and re-entry,
  open/flat status, overnight/session-date crossing, and execution counts.
- Evidence cards cover cases such as:
  - later trading gave back earlier profit
  - re-entry is still open
  - re-entry changed the trade type
  - time between exit and re-entry
  - re-entry had more executions than the first push
  - chart/volume context still needs review
- `/trades` now shows the review question, fix-first action, and top evidence
  cards inside ticker-story cards.
- `/trades/[tradeId]` now shows the full evidence list for the active ticker
  story.
- Tests now assert evidence IDs, fix-first language, primary review questions,
  and copy safety across the richer thread story output.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts`
  passed with 5 tests.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Restarted localhost on port `3000`; `/workspace` returned 200 and `/trades`
  rendered `Review Question`, `Fix first`, `Chart context to check next`, and
  `Ticker Stories`.

Next best step:

- Connect the thread evidence to real chart/volume context when available from
  saved decision-review snapshots or candle summaries. Until then, the UI only
  asks the user to compare volume/context and does not claim that conclusion.

## 2026-05-09 - Continuous UX/Product Plan Added

Added a durable execution roadmap so Codex can continue the end-user app
improvement work without stopping after each small slice.

Plan file:

- `src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md`

The plan consolidates the current direction into ten continuous runs:

- re-entry story evidence and chart/volume context
- coach as a guided coaching session
- review queue as a real work queue
- trade detail as the main review workspace
- saved trades navigation and grouping
- analytics report polish
- progress page improvements
- visual design system pass
- copy QA and safety
- verification and regression harness

Current best next step:

- Start Run 1.1 by inspecting saved decision-review snapshots and candle/context
  outputs for factual chart/volume evidence that can safely enrich ticker-story
  review evidence.

## 2026-05-09 - Continuous UX Plan Run 1.1 And Coach Visual Slice

Worked from
`src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md`
without requiring additional user direction.

What changed:

- Connected saved decision-review snapshots into the ticker-story read model.
- Ticker story round trips now expose chart-context status, chart-context
  summary, and saved decision-review insight count.
- Ticker story evidence now distinguishes:
  - chart context attached,
  - market-context insights available,
  - chart context still waiting,
  - volume context still requiring comparison.
- The model does not claim volume faded or level failure unless saved evidence
  explicitly supports it.
- `/trades` now passes saved decision-review snapshots into ticker stories,
  displays evidence source labels, and adds ticker-story filters:
  All ticker stories, Gave back profit, Turned swing, Open re-entry, Added
  profit, and Needs chart context.
- `/trades/[tradeId]` now shows chart-context evidence source labels and
  round-trip chart-context summaries in the ticker-story panel.
- `/coach` now includes a visual `Behavior Cost` section using the existing
  mistake severity ladder so the fix-first coaching flow is supported by a
  simple red/amber cost chart.
- Coach visible section names were softened from internal/advanced wording:
  "Advanced Rule Details" became "Rule Ideas To Consider", and
  "Advanced Rule Tests" became "Rule Evidence Check".
- Added Playwright coverage requiring the `Behavior Cost` coach section.
- Expanded saved trade thread tests to cover chart-context evidence attachment
  without unsupported volume claims.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts`
  passed with 6 tests.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Focused Playwright coach regression passed:
  `npx playwright test tests/e2e/app-feature-regression.spec.ts -g "shows the coach product loop" --project=chromium-desktop`.
- Restarted localhost on port `3000`; `/workspace` returned 200.
- Smoke checks confirmed:
  - `/trades` renders `Chart context is attached`, `All ticker stories`, and
    `Needs chart context`.
  - `/coach` renders `Behavior Cost`, `Start here`, `Fix first`,
    `Rule Ideas To Consider`, and `Rule Evidence Check`.

Next best step:

- Continue Run 2 from the continuous plan: make `/coach` feel even more like a
  guided coaching session by reducing visible advanced panel weight and adding a
  clearer behavior-to-rule-to-progress flow.

## 2026-05-09 - Continuous Work Autonomy Plan Update

Updated
`src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md`
so future Codex runs have a stronger instruction to keep working through
multiple related implementation slices instead of stopping after one small
change.

What changed:

- Added an explicit autonomy instruction for Codex.
- Defined the expected size of a good continuous work block:
  - one read-model or data improvement,
  - one or more route/UI improvements,
  - focused tests or Playwright coverage,
  - typecheck/build,
  - localhost restart/smoke,
  - project log update.
- Added clear early-stop conditions so Codex only pauses for destructive
  actions, meaningful architecture risk, missing credentials/API access,
  verification failures, or unsafe product-copy risk.
- Expanded the long continuous run checklist into six blocks:
  - Coach Guided Session,
  - Review Queue,
  - Trade Detail Workspace,
  - Saved Trades Browser,
  - Analytics And Progress,
  - Cross-Route Polish.
- Clarified that when one item is complete and verified, Codex should
  immediately continue to the next item unless a stop condition applies.

Current best next step:

- Continue Run 2 from the plan and rebuild `/coach` into a clearer guided
  coaching session, then continue into `/review` and `/trades/[tradeId]` if the
  same flow/design work carries forward cleanly.

## 2026-05-09 - Local Blocker Bypass Added To Continuous Plan

Updated
`src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md`
again to reduce unnecessary stopping.

What changed:

- The plan now treats blockers as local by default.
- If one route, chart, test, or data field is blocked, Codex should park that
  item and continue to the next independent improvement instead of ending the
  run.
- The plan now distinguishes local blockers from true global blockers.
- True stop conditions are limited to destructive actions, shared contract risk,
  unavailable credentials/API access that blocks every useful next step,
  verification failures that make further work unsafe, or product-copy safety
  risk.
- The suggested execution order and long-run checklist now explicitly say to
  skip forward when a step is locally blocked.

Current best next step:

- Continue Run 2 from the plan, starting with `/coach`, and keep moving into
  `/review`, `/trades/[tradeId]`, `/trades`, `/analytics`, and `/progress` as
  long as each next slice can be safely completed and verified.

## 2026-05-09 - Continuous Plan Acceptance Criteria Review

Reviewed and strengthened
`src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md`
so it is more useful for long autonomous implementation runs.

What changed:

- Added a `User Levels` section so routes are designed for new traders,
  intermediate traders, and advanced users without exposing raw internals by
  default.
- Replaced duplicate/older stop guidance with a `Continuous Run Definition Of
  Done`.
- Added `Design Acceptance Criteria` covering visual hierarchy, red/green
  trading semantics, charts near the decisions they support, left-side/section
  navigation, and reduced card sprawl.
- Added `Data Correctness Acceptance Criteria` for flat-to-flat round trips,
  ticker stories, same-symbol re-entries, open/swing detection, missing
  chart/volume evidence, and neutral handling of sell-side/short-looking data.
- Added `Do Not Spend Time On Yet` to keep future runs focused away from auth,
  billing, deployment, importer rewrites, backend persistence, admin/debug
  surfaces, and SEO while the end-user UI still needs work.
- Added a `Long Run Batch Strategy` so future work runs can move through whole
  route families:
  - coaching batch,
  - data browsing batch,
  - reporting batch,
  - polish batch.

Current best next step:

- Start a coaching batch from the plan: improve `/coach`, carry the same
  evidence/review-flow language into `/review`, then improve
  `/trades/[tradeId]` where the review flow lands.

## 2026-05-09 - Second Engineer Plan Review Patch

Applied the second-engineer review findings to
`src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md`.

What changed:

- Corrected `/progress` status from completed saved-data behavior to partially
  complete pending verification against the latest saved CSV/import.
- Added a hard `/coach` acceptance rule: one concrete coaching session, one
  specific trade, one main behavior or strength, one evidence set, and one
  fix-first action.
- Added a saved-trade grouping audit before `/trades` view-mode work so future
  changes distinguish true duplicates, round trips, execution rows, re-entries,
  open trades, and grouping artifacts.
- Resolved the Run 1 vs Run 2 ambiguity: Run 1.1 is complete enough for the
  current UI pass; remaining chart/volume enrichment is parked unless it blocks
  safe wording in the coaching/review/ticker-story UI.
- Strengthened Run 10 with:
  - batch-specific Playwright expectations,
  - saved-data verification for `/trades`, `/analytics`, `/progress`, and
    `/coach`,
  - desktop/mobile screenshot review for `/coach`, `/review`, `/trades`,
    `/trades/[tradeId]`, `/analytics`, and `/progress`.
- Updated the long-run verification checklist to require saved-data and
  screenshot checks for touched routes.

Current best next step:

- Begin the coaching batch from Run 2: rebuild `/coach` around one concrete
  saved-trade coaching session, then carry the same review-flow language into
  `/review` and `/trades/[tradeId]`, with saved-data and screenshot checks at
  the end of the batch.

## 2026-05-09 - Final Engineer Plan Readiness Pass

Reviewed the continuous UX/product plan again as another engineer would and
made the final improvements needed before implementation.

What changed:

- Added `Implementation Safety Rules`:
  - do not push/commit/upload unless the user asks,
  - do not delete/reset/dedupe/rewrite saved trade data during UI work,
  - do not modify candle warehouse or imported CSV source files unless the user
    explicitly asks for data repair,
  - do not stop the dev server just because the user is clicking around,
  - preserve replay settings if the dev server must be restarted.
- Added `Data Source Priority`:
  1. current saved imports and saved review data,
  2. saved decision-review snapshots and candle/context summaries,
  3. product-safe read models derived from saved data,
  4. sample/mock data only when no saved data exists or clearly labeled.
- Added `Parked Work Format` so local blockers are recorded consistently
  without ending a long run.
- Strengthened the definition of done so touched routes must not silently fall
  back to sample/mock data when saved imports exist.
- Updated the long-run batch strategy so each route batch starts by confirming
  whether the route is using saved imports, saved review snapshots, or
  sample/mock data.
- Clarified current state wording around chart/volume context: saved
  decision-review facts can be used when present, but deeper comparison remains
  incomplete and should not produce unsupported claims.

Current best next step:

- The plan is ready to work from. Start the coaching batch from Run 2 and keep
  moving through `/coach`, `/review`, and `/trades/[tradeId]` with saved-data,
  screenshot, typecheck, build, and focused Playwright verification.

## 2026-05-09 - Continuous Planning Method Guide Added

Added `src/docs/how_to_create_plan_to_work_continuously.md`.

Purpose:

- Document how the continuous Trader Intelligence implementation plan was
  created.
- Give future Codex instances a repeatable method for turning a user's "keep
  working without making me keep prompting you" request into a durable project
  plan.
- Capture the key planning moves:
  - start from the user's frustration,
  - define the product loop,
  - write autonomy and local-blocker rules,
  - add implementation safety rules,
  - add data-source priority,
  - define done,
  - add design and data correctness criteria,
  - create implementation runs and route batches,
  - require saved-data checks, screenshots, tests, typecheck, build, and log
    updates,
  - review the plan like another engineer until it is ready to work from.

Current best next step:

- Use `src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md`
  for the next implementation run. Use
  `src/docs/how_to_create_plan_to_work_continuously.md` only as the planning
  method reference.

## 2026-05-09 - Coaching Batch Run 2 First Implementation Slice

Started the continuous UX/product implementation plan from
`src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md`.

What changed:

- Rebuilt `/coach` into a guided coaching session instead of a flat panel dump:
  one trade, one behavior or strength, one fix-first action, and one evidence
  set before the supporting detail panels.
- Added coach-side visual summaries for behavior cost and repeat pattern so the
  page reads more like a coaching workspace and less like raw analytics output.
- Moved deeper coach details, rule evidence, personal pattern memory, and
  confidence wording into a collapsed `Supporting coach details` section.
- Added a review work-order strip to `/review`: open the trade, replay the
  executions, write one lesson, then track the behavior.
- Collapsed advanced coach wording checks on `/review` so the primary queue
  remains beginner-friendly.
- Added a trade-detail writing flow to `/trades/[tradeId]` with:
  - what happened,
  - behavior or strength to name,
  - fix first,
  - evidence to check.
- Kept the new user-facing direction wording for sell-starting imports: the
  end-user UI treats these as position-history review, not short-side coaching.
- Updated the focused Playwright regression assertions for the new coach,
  review, analytics, and trade-detail language.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed after stopping the locked local Next dev process, then
  the dev server was restarted on `http://127.0.0.1:3000` with replay candle
  settings preserved.
- Focused Playwright passed:
  - `coach product loop`,
  - `guided review workflow`,
  - `saved trade routing`,
  - desktop and mobile visual smoke screenshots,
  - mobile core route usability.
- Direct route smoke passed on the running localhost app for:
  - `/coach`,
  - `/review`,
  - `/analytics`,
  - `/progress`,
  - `/trades`.
- A React best-practices sanity pass found one small trade-detail cleanup; the
  review summary label now uses a strength label for profitable trades and a
  risk/behavior label for losing trades.

Current best next step:

- Continue the same coaching/data-browsing batch with deeper `/review` queue
  presentation cleanup and a saved-trade grouping audit on `/trades`, especially
  around same-symbol same-day round trips, re-entries, open trades, and
  day-trade-to-swing detection wording.

## 2026-05-09 - Data Browsing And Progress Slice

Continued from the same continuous UX/product plan instead of stopping after
the first coaching slice.

What changed:

- Added a clearer `/trades` browsing control surface:
  - `Round Trips`,
  - `Ticker Stories`,
  - `Open/Swing`,
  - `Needs Review`.
- `/trades` now shows how many saved trades are visible under the active view
  and explains that round trips are flat-to-flat while ticker stories group
  same-symbol re-entries.
- The `/trades` list can now be filtered non-destructively by ticker-story
  membership, open/swing exposure, or needs-review state without hiding the
  underlying saved data or rewriting imports.
- Strengthened `/review` queue cards so each item explicitly shows:
  - why it is in the queue,
  - what to review,
  - what evidence exists,
  - the `Open Trade Review` action.
- Sanitized saved review queue item headlines so raw candle warehouse/backfill
  diagnostics do not dominate the beginner-facing queue cards.
- `/progress` now has a top saved-data source panel and metric strip showing:
  - saved trades,
  - completed round trips,
  - open/swing items,
  - review completion.
- `/progress` now makes the distinction between imported trade history and
  finished trade reviews explicit, which should reduce confusion when a new CSV
  import appears in analytics but review/progress completion is still low.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts`
  passed.
- `npx vitest run src/lib/trader-analytics/__tests__/sqlite-import-commit-repository.test.ts`
  passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed after restarting around locked dev output.
- Focused Playwright passed:
  - `saved trade routing`,
  - `guided review workflow`,
  - `progress and behavior`.
- Mobile Playwright passed:
  - `keeps core mobile routes usable`.
- Direct localhost smoke passed for:
  - `/coach`,
  - `/review`,
  - `/trades`,
  - `/progress`,
  - `/analytics`.
- Direct `/review` smoke confirmed the primary queue no longer renders the raw
  `Durable candle warehouse miss` diagnostic string.

Current best next step:

- Continue into the next product pass on `/trades/[tradeId]`: improve the
  visual trade replay/timeline, make realized P/L and position-size progression
  easier to understand, and keep ticker-story evidence near the writing flow.

## 2026-05-09 - Next Run Scope Expanded

Updated `src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md`
so the next continuation is broader than a single trade-detail tweak.

What changed:

- Replaced the narrow current best next step with a full **Trade Review
  Workspace Batch**.
- The next run should follow one saved trade through:
  - `/trades`,
  - `/trades/[tradeId]`,
  - `/review`,
  - `/coach`,
  - `/progress`.
- The batch now includes:
  - visual trade replay,
  - position-size and realized P/L progression,
  - writing flow,
  - ticker-story context,
  - similar-trade cards,
  - review queue anchors,
  - coach featured-trade links,
  - progress/review-completion linkage,
  - focused tests, build, mobile checks, and localhost smoke.
- The plan explicitly says not to stop if a replay field is missing; park that
  local blocker and continue with safe UI/copy improvements on adjacent routes.

Current best next step:

- Start the Trade Review Workspace Batch and carry the work through the whole
  saved-trade review loop instead of stopping after one page.

## 2026-05-09 - Engineer Review Of Next Run Plan

Reviewed `src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md`
again as another engineer would before implementation.

Findings:

- The next batch direction was good, but the plan still had stale state notes
  that made `/coach`, `/review`, and `/progress` sound less complete than they
  are after the latest run.
- The next run was broad enough, but it needed sharper execution criteria so it
  does not drift into vague UI polish.
- The plan needed a clear rule for selecting a representative saved trade
  before editing `/trades/[tradeId]`.
- The plan needed explicit hard acceptance criteria and out-of-scope items for
  the Trade Review Workspace Batch.

Changes made:

- Updated `Current State` to reflect the completed `/coach`, `/review`,
  `/trades`, and `/progress` improvements.
- Replaced stale weakness notes with the remaining real risks:
  - trade-detail replay and writing flow,
  - review/coach anchors into useful trade-detail sections,
  - behavior-trend depth after reviews are complete,
  - optional day/session/symbol filters if `/trades` remains dense.
- Updated the suggested execution order so the next priority is the Trade
  Review Workspace Batch, followed by analytics/report polish, progress trend
  depth, trade filters, visual cleanup, copy QA, and regression coverage.
- Added representative saved-trade selection criteria:
  - saved import data,
  - completed round trip,
  - saved decision-review snapshot,
  - multi-round-trip ticker story,
  - non-zero P/L,
  - multiple executions.
- Added edge-case inspection guidance for open re-entry, day-trade-to-swing,
  and sell-starting/position-history items.
- Added hard acceptance criteria for `/trades/[tradeId]`, including first-screen
  clarity, execution replay, position/P/L progression, ticker-story placement,
  note/action placement, collapsed technical limits, and review/coach anchors.
- Added explicit out-of-scope boundaries:
  - no importer rewrites,
  - no saved data repair/dedupe,
  - no new broker import behavior,
  - no auth/billing/admin work,
  - no unsupported candle/volume claims,
  - no broad analytics redesign unless required by the trade-review workflow.

Current best next step:

- The Trade Review Workspace Batch is ready to work from. Start by selecting a
  representative saved trade, then improve `/trades/[tradeId]` and carry the
  resulting anchors/language through `/review`, `/coach`, and `/progress`.

## 2026-05-09 - Final Readiness Review Of Continuous Plan

Reviewed the plan one more time specifically for whether a future Codex run can
work from it continuously without asking for another planning confirmation.

Finding:

- The plan was ready overall, but the generic `Preferred batches` section still
  did not name the newly expanded Trade Review Workspace Batch. That left a
  small risk that a future run would follow an older coaching/data-browsing
  batch instead of the current active batch.

Changes made:

- Added **Trade Review Workspace batch** as the first preferred batch:
  `/trades/[tradeId]` -> `/review` -> `/coach` -> `/progress`, with `/trades`
  as the source route.
- Added a `Ready-to-work checklist` to the current best next step so the next
  run starts by selecting a representative saved trade, inspecting the current
  trade-detail output, implementing the smallest high-value replay/writing/story
  improvement, carrying anchors into adjacent routes, and verifying.
- Added an explicit readiness decision: the next run should start
  implementation, not another planning pass, unless new information changes the
  repo state or makes representative trade selection unsafe.

Current best next step:

- Start implementation from the Trade Review Workspace Batch. Do not spend
  another turn reviewing the plan unless the repo state materially changes.

## 2026-05-09 - Trade Review Workspace Batch Implementation

Continued the active Trade Review Workspace Batch from
`src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md`.

Representative saved trade used for this pass:

- `OMEX` on `2026-04-08`
- saved import data
- completed round trip
- saved decision-review snapshot attached
- part of an 8-round-trip ticker story
- first winning push followed by re-entries that gave back some profit
- multiple executions, so replay and position movement are meaningful

What changed:

- `/trades/[tradeId]` now has a clearer review workspace flow:
  - `#writing-flow` anchor added
  - write-note/checklist actions moved near the top of the human review flow
  - side nav now points to summary, replay, ticker story, writing, notes, and
    evidence sections
  - primary action now lands on the writing flow or replay instead of a missing
    checklist anchor
- Rebuilt the trade replay presentation:
  - plain entry/add/reduce/exit labels
  - ET timestamps
  - position-before to position-after movement
  - visible position-size bars
  - execution-derived realized P/L when available
  - risk/strength labels attached to individual executions
- Improved similar-trade cards so they explain why a trade is similar, show
  outcome, and link into the review workspace.
- `/review` now sends the primary queue action to `#writing-flow`, the replay
  step to `#execution`, and evidence/completed-review links to useful trade
  sections.
- `/coach` now separates review-writing and replay anchors:
  - primary coach action opens the review workspace
  - replay actions land on `#execution`
  - evidence links land on `#evidence` when they target a trade page
- `/progress` quality links now land on the trade writing workspace.
- End-user sell-starting wording was softened on `/trades` and
  `/trades/[tradeId]` so it stays neutral position-history language instead of
  implying supported direction-specific coaching.
- Updated focused Playwright assertions for:
  - coach review/replay anchors
  - review queue writing/replay anchors
  - trade visual replay
  - trade position/P/L progression
  - moved review-note actions
  - progress trade links
- Updated stale saved-import visual-smoke expectations for the current
  analytics heading and coach `chart claims gated` copy.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts`
  passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed after stopping the locked local Next dev process.
- Localhost was restarted on `http://127.0.0.1:3000` with replay candle
  settings preserved:
  - `LEVELS_SYSTEM_PROVIDER=ibkr`
  - `LEVELS_SYSTEM_WAREHOUSE_DIRECTORY=..\levels-system\data\candles`
  - `LEVELS_SYSTEM_WAREHOUSE_MODE=replay`
- Focused Playwright passed:
  - coach product loop
  - guided review workflow
  - progress and behavior visual surfaces
  - mobile core route usability
  - desktop visual smoke screenshots for core product routes
- Direct localhost smoke returned `200` for:
  - `/analytics`
  - `/trades`
  - selected OMEX `/trades/[tradeId]#writing-flow`
  - `/review`
  - `/coach`
  - `/progress`

Implementation note:

- A saved-import visual smoke test seeded one temporary `VS...` import before
  hitting a stale expectation. That generated test batch was removed from the
  local SQLite store because it was a Codex-created test artifact, not user
  import data. Saved trade count returned to `208`.

Current best next step:

- Continue with visual tuning and report polish:
  - inspect `/trades/[tradeId]`, `/review`, `/coach`, and `/progress` in the
    browser and tighten any remaining card sprawl or long-copy issues
  - then continue into `/analytics` lower-page chart/report cleanup and
    `/progress` behavior-trend depth.

## 2026-05-09 - Coaching Plan Recentered For End-User Flow

Reviewed `src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md`
as both an engineer and an end user, with `/coach` as the current product
center of gravity.

What changed:

- Removed stale planning emphasis that still treated the first Trade Review
  Workspace pass as the active batch.
- Kept the completed trade-detail/review anchor work as the evidence foundation
  for coaching.
- Made **Coaching Product Session Batch** the active next batch:
  `/coach` -> `/trades/[tradeId]` -> `/review` -> `/progress`.
- Expanded the `/coach` plan around a human coaching flow:
  - what to work on today,
  - which trade proves it,
  - what happened,
  - why it mattered,
  - one fix-first action,
  - repeat check,
  - progress follow-through.
- Added coach-specific acceptance criteria for:
  - saved-data priority,
  - one obvious first action,
  - beginner-readable behavior language,
  - red/green/amber/neutral visual meaning,
  - collapsed advanced/internal engine details,
  - evidence-backed wording,
  - banned-claim and raw-diagnostic avoidance.
- Deprioritized broad analytics/progress polish until the coaching session path
  is easier for a real trader to understand.

Verification:

- Docs-only plan update. No build or test commands were run.

Current best next step:

- Start implementation from the Coaching Product Session Batch. Inspect
  `/coach` with saved import data, identify where it feels like a card dump or
  diagnostic report, then rebuild the first screen around one featured trade,
  one behavior/strength, one evidence path, and one fix-first action.

## 2026-05-09 - Second Engineer Readiness Review And Feature Plan Library

Reviewed the coaching-centered continuous UX/product plan again as another
engineer would.

Finding:

- The active coaching plan is ready to work from, but the same product lessons
  need to be reusable by other feature surfaces without bloating the top-level
  plan.
- Older analytics/review/coach docs are useful history, but several are marked
  complete for prototype or fixture-era work. They should not be the only future
  planning source for the saved-data end-user UI.

What changed:

- Added a `Feature-Specific Follow-Up Plans` section to
  `src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md`.
- Added `src/docs/trader-intelligence-analytics-continuous-product-plan-2026-05-09.md`
  for future `/analytics` report hierarchy, chart polish, saved-data
  correctness, drill-downs, and trader-readable metric explanations.
- Added `src/docs/trader-intelligence-review-queue-continuous-product-plan-2026-05-09.md`
  for future `/review` work-queue flow, lane language, coach handoff, trade
  anchors, and collapsed diagnostics.
- Added `src/docs/trader-intelligence-progress-continuous-product-plan-2026-05-09.md`
  for future `/progress` work around imported-vs-reviewed separation, active
  coaching focus, behavior trend honesty, and follow-through.
- Updated the top-level readiness decision to say the next run should start
  implementation from the Coaching Product Session Batch, while future
  analytics/review/progress perfection work has its own follow-up plans.

Verification:

- Docs-only plan update. No build or test commands were run.

Current best next step:

- Start implementation from the Coaching Product Session Batch. The plan is
  ready for a continuous run: inspect `/coach` with saved data, rebuild the page
  around one featured trade and one fix-first action, then carry the flow into
  `/trades/[tradeId]`, `/review`, and `/progress` before moving to the new
  analytics/review/progress feature plans.

## 2026-05-09 - Plan Index Added And Planning Method Updated

Reviewed the continuous UX/product plan again as another engineer would, with
the user's request to keep future plan files organized.

Finding:

- The active coaching plan and feature follow-up plans are ready to work from,
  but the repo needed a plan index so future Codex runs do not confuse old
  completed prototype plans with the current saved-data UX roadmap.

What changed:

- Added `src/docs/trader-intelligence-plan-index.md`.
- The index now identifies:
  - the active top-level plan,
  - the active Coaching Product Session Batch,
  - active feature plans for analytics, review queue, and progress,
  - likely future feature plans to create only when needed,
  - planning-method docs,
  - context docs,
  - historical/completed prototype plans,
  - operational and QA plans.
- Added maintenance instructions at the top of the index for future Codex:
  - read the project log first,
  - use the index as the map,
  - update the index when plans are created/retired/replaced,
  - create separate feature plans only when a feature needs its own acceptance
    criteria or verification ladder.
- Linked the active continuous UX/product plan back to the index.
- Updated `src/docs/how_to_create_plan_to_work_continuously.md` with guidance
  for creating a plan index and splitting large roadmaps into feature-specific
  plans.

Verification:

- Docs-only organization update. No build or test commands were run.

Current best next step:

- Start implementation from the Coaching Product Session Batch. Use
  `src/docs/trader-intelligence-plan-index.md` as the plan map, then work from
  `src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md`
  without another planning pass unless the repo state changes materially.

## 2026-05-09 - Coaching Session First-Screen Product Pass

Started implementation from the active Coaching Product Session Batch.

What changed:

- Rebuilt the top of `/coach` around one clear coaching session instead of a
  stack of equal-weight panels:
  - what to work on today,
  - which saved trade proves it,
  - why the behavior mattered,
  - the fix-first action,
  - the repeat/progress check.
- Added beginner-readable behavior translation for the featured coaching
  behavior so the page explains the idea before showing supporting evidence.
- Added a light `ti-coach-brief` presentation surface to reduce the older
  black-card dashboard feel on the first coaching screen.
- Moved saved review queue and import-source caution support below the guided
  coaching session so the first screen starts with the user's next action.
- Added section breaks for supporting coach checks, proof, and next-session
  planning so the lower page reads like a coaching path instead of a long panel
  dump.
- Renamed the lower evidence area from generic queue/cards language to "Proof
  Queue" and "Evidence Cards To Open".
- Mapped raw queue lane ids into user-facing lane labels inside the coach proof
  queue, including chart-context waiting, open trade, reviewed, and technical
  follow-up states.
- Linked `/review` step 4 into `/coach#coaching-session` so the review queue
  hands off to coaching after the user writes a lesson.
- Added an `/progress` "Active Coaching Focus" panel so progress can track the
  reviewed behavior, not just imported trade count.
- Updated focused Playwright assertions for the coaching session brief,
  behavior explanation, why-it-mattered copy, progress coaching focus, and the
  analytics tabbed market-context check.
- Increased copy-safety test timeouts for saved-data route scans, which are
  slower now that real saved imports are present.
- Carried the same beginner-facing vocabulary into trade detail evidence
  surfaces by mapping raw source strings such as levels-system context and
  saved storage labels into plain labels like "Chart context evidence",
  "Execution replay", and "Saved import data".
- Renamed the trade detail chart-waiting state from "Market context waiting" to
  "Chart context waiting" in the end-user review copy.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "coach product loop|progress and behavior visual surfaces|guided end-user path"`
  passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable"`
  passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "keeps banned product claims out of core product routes|keeps market context observational"`
  passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "guided review workflow|saved trade routing and review entry points|coach product loop"`
  passed after the trade detail source-label pass.

Current best next step:

- Continue the Coaching Product Session Batch by doing a visual/readability
  browser pass on `/coach`, `/trades/[tradeId]`, and `/review` side by side.
  The next high-value implementation step is to make the review queue's saved
  item cards match the same coaching order: what to review, why it matters,
  open trade review, then technical limits.

## 2026-05-09 - Coaching Plan Resume Point Review

Reviewed the active continuous UX/product plan from both an engineering and
end-user coaching perspective.

Finding:

- The plan structure was still right, but the exact resume point was stale. It
  still read as if the next run should restart the `/coach` first-screen
  rebuild, even though that work is now complete enough to use as the coaching
  pattern.
- The next coaching-focused work should continue into the adjacent surfaces
  that make coaching usable: `/review`, `/trades/[tradeId]`, and `/progress`.

What changed:

- Updated `src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md`
  so the active batch is now **Coaching Product Session Continuation**.
- Marked the completed `/coach` first-screen work as done in the plan.
- Reframed the next active implementation slice around `/review` queue cards:
  what to review, why it matters, evidence, `Open Trade Review`, then technical
  limits.
- Updated `src/docs/trader-intelligence-plan-index.md` with the current resume
  point.
- Updated `src/docs/trader-intelligence-review-queue-continuous-product-plan-2026-05-09.md`
  so it is active inside the coaching batch, not merely a later follow-up.

Verification:

- Docs-only plan update. No build or test commands were run.
- Opened the user dashboard at `http://127.0.0.1:3000/workspace`.

Current best next step:

- Implement the next coaching continuation slice in `/review`: make saved queue
  item cards follow the coaching order and link cleanly into
  `/trades/[tradeId]#writing-flow`, `/trades/[tradeId]#execution`, and
  `/coach#coaching-session` where useful.

## 2026-05-09 - Second Engineer Readiness Pass For Coaching Continuation

Reviewed the active coaching-continuation plan again as another engineer would.

Finding:

- The resume point was mostly correct, but one small block still named `/coach`
  as the primary next route. That could cause a future run to repeat the
  completed first-screen coaching work instead of moving into `/review`.

What changed:

- Updated the active plan so the next primary implementation route is `/review`
  and `/coach` remains the product center of gravity.
- Marked the older Run 2 coach section as completed enough/reference guidance
  and marked Run 3 review queue work as the active next implementation target.
- Updated the plan index route order to:
  `/review` -> `/trades/[tradeId]` -> `/coach` -> `/progress`.
- Added hard acceptance criteria that `/review` must show one obvious queue
  action and use the coaching order: what to review, why it matters, evidence,
  `Open Trade Review`, then technical limits.
- Cleaned the review-queue feature plan wording so it is active inside the
  coaching batch rather than a later follow-up.

Verification:

- Docs-only plan readiness update. No build or test commands were run.

Current best next step:

- Proceed with implementation from `/review` queue cards. Keep the work
  coaching-centered, carry useful anchors into `/trades/[tradeId]`, and link
  back into `/coach#coaching-session` only where the handoff helps the user.

## 2026-05-09 - Review Queue Coaching-Order Implementation

Continued the Coaching Product Session Continuation from the active plan, using
`/review` as the next coaching-adjacent route.

What changed:

- Rebuilt the saved review queue presentation so it appears before secondary
  chart-context status/support material.
- Each saved queue item now follows the coaching order:
  - trade symbol and gross result,
  - why the trade is in the queue,
  - what the user should review,
  - available evidence,
  - `Open Trade Review` and `Replay executions`,
  - technical review limits collapsed below the card.
- Collapsed advanced queue status and technical limits by default.
- Mapped saved chart-context source labels through user-facing copy instead of
  showing raw source values.
- Changed queue action button language from terse/internal wording to:
  `Mark reviewed`, `Mark solved`, and `Skip for now`.
- Updated the review-queue feature plan, top-level continuous plan, and plan
  index so the next continuation starts from coach/review/progress handoff work
  rather than repeating this `/review` card pass.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Focused Playwright passed:
  - `shows the coach product loop with calibrated coaching surfaces`
  - `shows the guided review workflow`
  - `shows the progress and behavior visual surfaces`
  - `keeps market context observational and out of execution-only conclusions`
  - `keeps banned product claims out of core product routes`
  - `captures visual smoke screenshots for core product routes`

Current best next step:

- Continue the Coaching Product Session Continuation from `/coach` as the
  product center of gravity. Inspect `/coach`, `/review`, and `/progress`
  together and tune the handoff from queue item to trade review note to coaching
  focus to progress follow-through. Do not redo the first `/review` queue-card
  implementation unless visual/browser QA exposes a clear issue.

## 2026-05-09 - Continuous Run Readiness Tightening

Reviewed the active plan again as another engineer would, specifically looking
for instructions that could cause Codex to stop after one small route-sized
improvement.

Finding:

- The plan was directionally correct, but it still had a stale readiness note
  pointing back to `/review` queue cards even though that implementation pass
  is already complete.
- The next run needed an explicit continuous work ladder so Codex keeps moving
  through related coaching surfaces instead of treating one route improvement as
  a natural stopping point.

What changed:

- Added a **Continuous Work Ladder For The Next Run** to
  `src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md`.
- The ladder now directs the next run through:
  - `/coach` coaching-flow audit,
  - `/coach` lower-page grouping,
  - `/review` handoff check,
  - `/trades/[tradeId]` writing-flow check,
  - `/progress` follow-through pass,
  - visual/readability sweep,
  - regression coverage,
  - verification and logging.
- Added continuation rules that tell Codex to park isolated blockers and keep
  working on independent ladder steps unless the blocker affects saved data,
  architecture, or verification reliability.
- Updated the plan index with the same continuous-run rule.
- Removed stale review-queue wording that still described the completed queue
  card pass as the first implementation slice.

Verification:

- Docs-only plan readiness update. No build or test commands were run.

Current best next step:

- Proceed with the continuous implementation ladder. Start on `/coach`, keep
  `/coach` as the product center of gravity, and continue through `/review`,
  `/trades/[tradeId]`, and `/progress` in the same run as long as the work
  remains safe and independently actionable.

## 2026-05-09 - Coach Plan Reframed Around Overall Trading Focus

Reviewed the coaching direction after the user clarified that `/coach` should
not feel like a single-trade review page. The top card currently pointing at one
trade is useful, but it should be evidence beneath a broader trading-coach
summary.

Finding:

- The active plan still treated one concrete review session and one featured
  trade as the core `/coach` experience.
- That is too narrow for the main coach page. Users may import a week or month
  of trades at once, so literal daily wording and a single "review this trade
  next" top card can make the coach feel random instead of strategic.

What changed:

- Added `src/docs/trader-intelligence-coach-continuous-product-plan-2026-05-09.md`.
- The new coach feature plan says `/coach` should lead with:
  - overall coaching focus across saved trades,
  - frequency/evidence count,
  - why it matters,
  - one fix-first action,
  - trades to review next,
  - featured evidence trade,
  - progress follow-through,
  - advanced analysis collapsed.
- Updated the top-level continuous UX/product plan so the next run starts by
  reframing `/coach` as an overall trading coach, not a single-trade review
  card.
- Added naming rules:
  - "Today's review card" -> "Current Review Plan" or "Review Session",
  - "What to work on today" -> "Current Coaching Focus",
  - "Review one trade" as the top page concept -> "Trades To Review Next" under
    the aggregate focus.
- Updated the continuous work ladder so the next run starts with:
  - aggregate coach focus first,
  - trades-to-review/evidence grouping second,
  - lower-page grouping,
  - review/trade/progress handoffs.
- Updated the plan index to include the new coach feature plan.
- Added a continuation rule to the coach feature plan: if the aggregate
  coaching read model is missing a field, park that missing field and continue
  with safe rename/reframe, review-queue preview, advanced-section demotion,
  tests, and verification.

Verification:

- Docs-only plan update. No build or test commands were run.

Current best next step:

- Proceed with the coach implementation run using
  `src/docs/trader-intelligence-coach-continuous-product-plan-2026-05-09.md`.
  Start by replacing daily/single-trade-first language on `/coach` with an
  overall coaching focus, then keep going into trades-to-review preview,
  evidence trade placement, progress follow-through, tests, and verification.

## 2026-05-09 - Second Engineer Coach Plan Readiness Pass

Reviewed the active coaching plans again as another engineer would, looking for
contradictions that could send the next run back into completed `/review` work
or the older single-trade-first coach shape.

Finding:

- The dedicated coach plan was clear, but the top-level plan still had three
  stale signals:
  - `/review` was still described as the main continuation point in the
    "Still weak" section.
  - Run 2 described itself as completed reference guidance for an old
    `/review -> trade detail -> coach` flow.
  - Run 3 still called `/review` the active next implementation target.
- The long-run batch order also still listed `/trades/[tradeId]` before
  `/review`, which conflicted with the active plan index and the new coach-first
  queue-preview direction.

What changed:

- Updated the top-level plan so `/coach` is explicitly active again, but for
  the new overall-focus pass rather than the old single-trade-first rebuild.
- Reframed `/review` as a completed first queue-card pass with follow-up handoff
  and mobile-density work after the coach overall-focus pass.
- Aligned the long-run coaching batch order to:
  `/coach` -> `/review` -> `/trades/[tradeId]` -> `/progress`.

Verification:

- Docs-only readiness update. No build or test commands were run.

Current best next step:

- The plan is ready for implementation. Start with `/coach` overall-focus
  reframing, then continue through review-backlog preview, trade-detail anchors,
  progress follow-through, visual/copy QA, tests, and verification in one
  continuous run where safe.

## 2026-05-09 - Coach Overall-Focus Implementation Pass

Implemented the first `/coach` overall-coaching pass from the active Coaching
Product Session plan.

What changed:

- Reframed `/coach` from a single-trade-first page into "Your Trading Coach".
- Changed the primary coach card to lead with "Current Coaching Focus" and the
  behavior across saved trades before the evidence trade.
- Removed literal daily wording from the default coach UI.
- Demoted the featured trade into "Featured Evidence Trade".
- Added a compact "Trades To Review Next" preview so large catch-up imports can
  move from overall focus into evidence trades.
- Updated `/review` and `/progress` handoffs to point to the coaching focus
  anchor instead of the old session-first anchor.
- Cleaned saved review queue summary lane copy so preview items map internal
  lanes into trader-facing labels.
- Updated focused Playwright assertions to lock the new coach-first contract.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Focused Playwright passed:
  - `shows the coach product loop with calibrated coaching surfaces`
  - `shows the guided review workflow`
  - `shows the progress and behavior visual surfaces`
  - `keeps market context observational and out of execution-only conclusions`
  - `keeps banned product claims out of core product routes`
  - `keeps core mobile routes usable without page-level horizontal overflow`
  - `captures visual smoke screenshots for core product routes`

Current best next step:

- Continue the coaching batch without redoing the first-screen reframe. Inspect
  `/coach` with screenshots/browser view, tighten the aggregate coaching
  read-model if the route-local translation feels too crowded, improve lower
  coach page visual rhythm, then deepen `/progress` follow-through around
  imported-vs-reviewed trades and active coaching focus.

## 2026-05-09 - Coach Progress Follow-Through And Readability Pass

Continued the active Coaching Product Session Batch after the overall-focus
implementation.

What changed:

- Added a shared coach follow-through helper in
  `src/lib/trader-analytics/product/coach-overall-focus.ts`.
- The helper now separates:
  - saved imported trades,
  - finished reviews,
  - in-progress reviews,
  - review backlog,
  - honest insufficient-data progress states,
  - next action labels and links.
- `/coach` now shows a dedicated "Progress Follow-Through" panel after the
  evidence queue so users understand that imports are history, while finished
  reviews are what make progress measurable.
- `/progress` uses the same follow-through model, so coach and progress now
  explain the same saved-trades-vs-reviewed-trades idea.
- `/progress` no longer renders every saved trade in the execution-quality
  trendline by default. It shows a focused preview and links to saved trades or
  analytics for the full list.
- Coach impact wording no longer calls positive gross P/L evidence "cost"; it
  uses evidence/impact language and asks the user to review whether the behavior
  helped or simply appeared in winners.
- Extra `/coach` tool cards for rule count, trade compare, and onboarding were
  moved behind the collapsed supporting coach details disclosure.
- The evidence trade writing surface now prompts the user to write what
  happened, what behavior mattered, and the fix-first rule instead of showing a
  generic empty note box.
- Focused tests now cover the coach follow-through helper.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/coach-overall-focus.test.ts`
  passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `git diff --check -- app/coach/page.tsx app/progress/page.tsx src/lib/trader-analytics/product/coach-overall-focus.ts src/lib/trader-analytics/__tests__/coach-overall-focus.test.ts tests/e2e/app-feature-regression.spec.ts`
  passed.
- Focused Playwright passed:
  - `shows the coach product loop with calibrated coaching surfaces`
  - `shows the guided review workflow`
  - `shows the progress and behavior visual surfaces`
  - `keeps market context observational and out of execution-only conclusions`
  - `keeps banned product claims out of core product routes`
  - `keeps core mobile routes usable without page-level horizontal overflow`
  - `captures visual smoke screenshots for core product routes`

Current best next step:

- Do not redo the `/coach` overall-focus or first follow-through pass. Continue
  with directly related coaching-loop handoffs: inspect one evidence trade from
  `/coach` into `/trades/[tradeId]#writing-flow`, tighten the writing prompt if
  needed, then make sure `/review` and `/progress` link back to the same
  evidence path without adding broad analytics redesign.

## 2026-05-09 - Engineer Readiness Pass After Coach Follow-Through

Reviewed the active coaching plans again as another engineer would.

Finding:

- The active plans were close, but the plan index and top-level plan still had
  stale wording that could make the next run repeat the completed `/coach`
  overall-focus reframe.
- The correct next implementation point is now the handoff from `/coach` to an
  evidence trade, then the trade-detail writing/checklist/review-completion
  flow, followed by `/review` and `/progress` follow-through.

What changed:

- Updated `src/docs/trader-intelligence-plan-index.md` so the route order is
  `/coach` smoke -> `/trades/[tradeId]` -> `/review` -> `/progress`.
- Updated
  `src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md` so
  the next continuous ladder starts with the evidence-trade handoff instead of
  another coach first-screen rebuild.
- Updated
  `src/docs/trader-intelligence-coach-continuous-product-plan-2026-05-09.md`
  so the current next step is review writing/completion and progress
  follow-through, not the already-completed reframe.
- Updated `src/docs/how_to_create_plan_to_work_continuously.md` with the rule
  to retire completed slices before the next run.

Verification:

- Docs-only readiness update. No build or test commands were run.

Current best next step:

- Proceed with the next implementation run from the coach evidence-trade
  handoff: smoke `/coach`, open the first real evidence/next-review trade,
  tighten `/trades/[tradeId]` replay/writing/checklist/completion if needed,
  then verify `/review` and `/progress` explain the same coaching completion
  loop.

## 2026-05-09 - Final Engineer Plan Readiness Pass

Reviewed the active plan one more time as another engineer would.

Finding:

- The active current-next-step sections were aligned, but older batch-strategy
  examples still listed the previous coaching route order. That could make a
  future run work `/review` before following the coach evidence trade into the
  trade-detail writing flow.

What changed:

- Updated the batch assertion and long-run examples in
  `src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md` to
  use the current route order:
  `/coach` smoke -> `/trades/[tradeId]` -> `/review` -> `/progress`.
- Updated `src/docs/how_to_create_plan_to_work_continuously.md` so its generic
  coaching-batch example matches the current evidence-trade handoff pattern.

Verification:

- Docs-only readiness update. No build or test commands were run.

Current best next step:

- The plan is ready to work from. Proceed with the coaching evidence-trade
  handoff and keep moving through trade-detail writing/completion, review queue
  language, and progress follow-through in one continuous implementation run.

## 2026-05-09 - Coach Evidence-Trade Handoff Implementation

Continued the active Coaching Product Session Batch from the approved plan.

What changed:

- `/coach` now selects the primary evidence trade from the active overall
  coaching focus instead of defaulting to the first unrelated saved-review queue
  item.
- Coach trade links now carry `from=coach` and the current focus label into
  `/trades/[tradeId]`, preserving the reason the user opened the trade.
- `/trades/[tradeId]` now shows a dedicated "Coach Handoff" panel when opened
  from coach. It separates the overall coaching focus from the behavior visible
  in the individual trade, then tells the user to replay, write the lesson, and
  mark checklist progress.
- The saved note/checklist client component now includes an "After Saving This
  Review" handoff back to coach, progress, review queue, and saved trades.
- `/coach` lower "Proof Queue" and "Evidence Cards To Open" now use the focused
  evidence set instead of generic proof lists, so the lower page does not drift
  away from the current coaching focus.
- `/review` work order now includes a fifth "Check progress" step, making the
  loop explicit after a saved review.
- `/progress` active coaching focus now links back to the coaching focus and
  the review queue instead of acting like a disconnected report.
- Focused tests now cover the coach -> trade detail handoff and the review
  completion return path.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/coach-overall-focus.test.ts`
  passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Local Playwright smoke confirmed `/coach` links to a focused evidence trade
  and `/trades/[tradeId]` shows the coach handoff, writing flow, and completion
  handoff.
- Focused Playwright passed:
  - `shows the coach product loop with calibrated coaching surfaces`
  - `shows the guided review workflow`
  - `shows the progress and behavior visual surfaces`
  - `keeps market context observational and out of execution-only conclusions`
  - `keeps banned product claims out of core product routes`

Current best next step:

- Do not redo the coach first-screen reframe, first follow-through model, or
  coach evidence-trade handoff. The review/progress completion loop now has
  contextual links. Continue the coaching batch with a lower-page
  visual/readability pass where browser QA shows real friction, especially on
  `/coach`, `/review`, `/trades/[tradeId]`, and `/progress`.

## 2026-05-09 - Behavior Language And Detection Audit

Reviewed the coaching plan again as another engineer and as an end-user
advocate after the "Added After Failed Premise" language concern.

Finding:

- The plan was ready structurally, but it was missing an explicit behavior
  translation pass.
- The app already has useful detection coverage for chase entries, adding into
  weakness, open-profit giveback, premature exits, profit protection,
  same-symbol re-entry clusters, overtrading, and support/resistance-aware
  context when candle/level data exists.
- The main current weakness is that some internal behavior labels can leak into
  user-facing coach or analytics surfaces.
- "Added After Failed Premise" does not prove a trader's idea objectively
  failed. In current detection terms it means the trader kept adding after the
  first entry before meaningfully reducing risk. The primary UI should say
  "Kept adding before reducing risk" or "Added multiple times before taking
  risk off."

What changed:

- Added
  `src/docs/trader-intelligence-behavior-language-and-detection-audit-2026-05-09.md`
  as the source-of-truth behavior language and detection audit.
- Updated the coach plan so Run G is now the next highest-value continuation:
  human trader language and behavior translation before more visual polish.
- Updated the analytics plan with behavior deep dives for self-review:
  winners turned losers, giveback, missed continuation, scale-out quality,
  same-symbol overtrading, day/session overtrading, support/resistance entry
  quality, and volume-fade context when available.
- Updated the top-level continuous plan and plan index so the next run starts
  with the behavior-language pass, then continues the coaching handoff and
  readability ladder.

Verification:

- Docs-only planning and audit update. No build or test commands were run.

Current best next step:

- Implement the shared trader-facing behavior language mapper and wire it into
  `/coach` first, then analytics/trade-detail/review surfaces where labels are
  reused. Add regression tests that block phrases such as "Added After Failed
  Premise", raw pattern IDs, scoring traces, and other internal wording from
  primary user UI.

## 2026-05-09 - Detection Hardening Plan Elevated

Reviewed the active plan again as another engineer after the user clarified
that partial detections should no longer drive the product.

Finding:

- The prior behavior-language plan was directionally right, but it still
  treated "partial support" as an acceptable planning concept.
- That is not good enough for the end-user app. If a behavior detection is
  uncertain, it should not appear as a firm coach or analytics conclusion.
- The product now needs a detection contract layer before additional UI polish:
  certified detection, review prompt, or internal signal.

What changed:

- Added
  `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`
  as the active prerequisite plan.
- Added root `plan.md` as the app-level planning entry point. It links to
  `src/docs/trader-intelligence-plan-index.md` and names the current detection
  hardening priority.
- Updated `src/docs/trader-intelligence-plan-index.md` so the active batch is
  now Detection And Language Hardening before returning to coach UI polish.
- Updated
  `src/docs/trader-intelligence-behavior-language-and-detection-audit-2026-05-09.md`
  with the rule that no partial detection should drive primary UI.
- Updated the coach, analytics, and top-level continuous plans so the next run
  starts with detection inventory, detection contracts, and shared language
  mapping.

Verification:

- Docs-only planning update. No build or test commands were run.

Current best next step:

- Start the Detection And Language Hardening Batch. Inventory all user-visible
  behavior labels, classify each as certified detection, review prompt, or
  internal signal, then implement the first detection contract and language
  mapper slice starting with "Added After Failed Premise" ->
  "Kept adding before reducing risk."

## 2026-05-09 - Second Engineer Review Of Detection Plans

Reviewed the newly created detection/language plan set again as another
engineer.

Finding:

- The active direction was correct, but a few doc details could still steer a
  future run too quickly into UI language mapping before detection
  certification.
- The behavior audit still used "some support" in one section, which was weaker
  than the new certified/review-prompt/internal model.
- The plan index still described active feature plans as being used alongside
  the coaching batch instead of the new detection hardening batch.
- The detection plan needed a concrete "files to inspect first" list so the
  next run can start with the real code surfaces and not wander back into
  dashboard design.

What changed:

- Updated the plan index wording to reference the active detection hardening
  batch.
- Updated the behavior audit so re-entry/ticker-story behavior is described as
  signals to certify, and its next step now points to the detection hardening
  plan before language mapping.
- Expanded the detection hardening plan with:
  - primary code paths to inspect,
  - supporting docs to compare against,
  - route surfaces to audit,
  - route/evidence-state inventory requirements,
  - a rule not to alter importer grouping, saved data, candle warehouse files,
    or lower-layer engine contracts just to make UI language easier.

Verification:

- Docs-only review update. No build or test commands were run.

Current best next step:

- The plan is ready to work from. Start with Run A in
  `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`:
  inventory every user-visible behavior label, classify it as certified,
  review prompt, or internal, then build the first product-facing detection
  contract for the highest-risk label.

## 2026-05-09 - Third Engineer Review Of Detection Plans

Reviewed the active plan files again as another engineer.

Finding:

- The plan path was correct, but the default resume order could still make a
  future run read the broad top-level plan before the active detailed detection
  plan and accidentally drift into UI polish.
- The detection plan allowed label replacement as a run step, but it needed to
  say explicitly that replacement happens only after classification.
- Review prompts needed a stronger boundary: they can ask the trader to inspect
  something, but they cannot drive top coach headlines, largest-risk cards,
  fix-first actions, or analytics warning counts.

What changed:

- Updated `src/docs/trader-intelligence-plan-index.md` so the resume order
  opens the current detailed plan named under `Current active batch`, and the
  detailed plan plus newest project-log entry win if docs conflict.
- Updated
  `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`
  so review prompts cannot drive primary conclusions, and confusing-label
  replacement happens only after classification.
- Updated root `plan.md` so if it ever disagrees with the index, future Codex
  should trust the index and latest project log.

Verification:

- Docs-only review update. No build or test commands were run.

Current best next step:

- The plan is ready to work from. Start the implementation run with Run A:
  inspect the listed code paths, inventory user-visible behavior labels, classify
  them as certified/review-prompt/internal, and only then create the first
  product-facing detection contract and language mapping slice.

## 2026-05-09 - Fourth Engineer Review Of Detection Plans

Reviewed the active plan files again as another engineer.

Finding:

- The active detailed plan and index were aligned, but the broad top-level plan
  still had one stale note saying the next active batch should prioritize
  coaching flow before broader report polish.
- The detection plan's label replacement run could still be misread as "rename
  after inventory" even when a behavior remains a primary UI conclusion.

What changed:

- Updated
  `src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md` so
  the next active batch explicitly prioritizes detection certification and
  language hardening before coaching-flow or report polish.
- Updated
  `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`
  so confusing labels that remain in primary UI as conclusions can be replaced
  only after the behavior has a product-facing detection contract.

Verification:

- Docs-only review update. No build or test commands were run.

Current best next step:

- The plan is ready to work from. Start with detection inventory, then create
  product-facing contracts before any certified behavior is renamed or wired
  into primary UI conclusions.

## 2026-05-09 - Fifth Engineer Review Of Detection Plans

Reviewed the active plan files again as another engineer.

Finding:

- The detection plan's top product rule still said "primary user-facing
  coaching", which was too narrow. The rule must apply to all primary user-
  facing conclusions across coach, analytics, review, progress, saved trades,
  and trade detail.
- Certified detection wording listed only some route surfaces.
- The broad top-level suggested execution order still started from the older UI
  pass sequence instead of explicitly starting from the active detection
  hardening batch.

What changed:

- Updated
  `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`
  so no partial, uncertain, or uncertified detection can drive any primary
  user-facing conclusion anywhere in the app.
- Expanded certified-detection route wording to include progress and saved
  trades.
- Clarified internal signals may appear only in admin or advanced/collapsed
  builder diagnostics.
- Updated
  `src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md`
  so the suggested execution order starts with the Detection And Language
  Hardening Batch, then returns to coaching, analytics, progress, trades, and
  visual polish.

Verification:

- Docs-only review update. No build or test commands were run.

Current best next step:

- The plan is ready to work from. Start with detection inventory and contract
  creation before any behavior can drive a primary UI conclusion.

## 2026-05-09 - Sixth Engineer Review Of Detection Plans

Reviewed the active plan files again as another engineer.

Finding:

- A few support docs still narrowed the certification rule to coach/analytics
  conclusions even though the active detection plan now applies app-wide.
- The detection plan's Run E rules specifically named coach headlines, but the
  same rule must apply to review, progress, saved trades, analytics, and trade
  detail primary conclusions.

What changed:

- Updated `src/docs/trader-intelligence-plan-index.md` so the current resume
  point says detections must be certified before driving any confident primary
  user-facing conclusion.
- Updated
  `src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md` so
  the continuous ladder blocks uncertain/uncertified detections from any primary
  user-facing conclusion, not only coach/analytics.
- Updated
  `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`
  so Run E says primary conclusions on `/coach`, `/analytics`, `/review`,
  `/progress`, `/trades`, and `/trades/[tradeId]` can use only certified
  detections.

Verification:

- Docs-only review update. No build or test commands were run.

Current best next step:

- The plan is ready to work from. Begin Run A detection inventory and keep the
  certification gate app-wide for every primary user-facing conclusion.

## 2026-05-09 - Seventh Engineer Review Of Detection Plans

Reviewed the active plan files again as another engineer.

Finding:

- A final grep found three remaining narrow phrases:
  - detection hardening before "coach/analytics UI polish",
  - registry coverage for "primary coach/analytics label",
  - certification before "coach or analytics conclusions".
- These phrases were not fatal, but they were weaker than the app-wide rule and
  could cause future work to miss review, progress, saved trades, or trade
  detail.

What changed:

- Updated
  `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`
  so detection hardening comes before user-facing UI polish and every primary
  user-facing behavior label must come from the registry.
- Updated
  `src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md` so
  certification gates apply to primary user-facing conclusions, not only coach
  or analytics.

Verification:

- Docs-only review update. No build or test commands were run.

Current best next step:

- The plan is ready to work from. Start Run A detection inventory and preserve
  the app-wide certification gate for all primary user-facing behavior labels
  and conclusions.

## 2026-05-09 - Eighth Engineer Review Of Detection Plans

Reviewed the active plan files again as another engineer.

Finding:

- The app-wide certification rule was now correct, but the review-prompt
  boundary still used mostly coach/analytics examples. A future run could have
  allowed uncertain prompts to drive review queue priority, progress status,
  saved-trade badges, or trade-detail summaries.
- Run A said to produce a table "in this plan or a companion catalog", but did
  not name the preferred companion artifact. That could make the inventory hard
  to find later.

What changed:

- Updated
  `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`
  so review prompts cannot drive top headlines, risk/strength cards, fix-first
  actions, review queue priority, chart warning counts, progress status,
  saved-trade badges, or trade-detail summary conclusions.
- Updated Run A with the preferred inventory artifact path:
  `src/docs/trader-intelligence-detection-contract-inventory-2026-05-09.md`.
- Updated Run E so any route can show review prompts, but only as things to
  inspect, not conclusions.
- Tightened acceptance criteria from "coach headline" to "primary coaching
  conclusion."

Verification:

- Docs-only review update. No build or test commands were run.

Current best next step:

- The plan is ready to work from. Start Run A and create or update the detection
  contract inventory artifact before changing user-facing behavior conclusions.

## 2026-05-09 - Ninth Engineer Review Of Detection Plans

Reviewed the active plan files again as another engineer.

Finding:

- One final narrow rule remained under `Research/internal signal`: it still said
  internal signals must not drive coach headlines, analytics warnings, or
  fix-first actions. That was directionally right but not broad enough for the
  app-wide certification gate.
- The acceptance criterion "Every primary coaching conclusion has evidence and
  a fix-first action" was slightly too broad for non-action observations and
  slightly too narrow for certified coaching conclusions.

What changed:

- Updated
  `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`
  so internal signals cannot drive any primary user-facing conclusion,
  priority, warning, badge, progress state, or fix-first action.
- Tightened the acceptance criterion to require every certified coaching
  conclusion to have evidence and, when action-oriented, a fix-first action.

Verification:

- Docs-only review update. No build or test commands were run.

Current best next step:

- The plan is ready to work from. Start Run A detection inventory, classify each
  visible behavior, and keep the certified/review-prompt/internal gate app-wide.

## 2026-05-09 - Tenth Engineer Review Of Detection Plans

Reviewed the active plan files and supporting audit again as another engineer.

Finding:

- The active detection plan was clean, but the supporting behavior-language
  audit still used the older examples "coach headlines, analytics warnings,
  review queue reasons, and trade-detail summaries."
- That was narrower than the current app-wide certification rule.

What changed:

- Updated
  `src/docs/trader-intelligence-behavior-language-and-detection-audit-2026-05-09.md`
  so partial support is not good enough for any confident primary user-facing
  conclusion.
- Updated the certified-detection bullet in that audit to cover primary
  user-facing conclusions across coach, analytics, review, progress, saved
  trades, and trade detail.

Verification:

- Docs-only review update. No build or test commands were run.

Current best next step:

- The plan is ready to work from. Start Run A detection inventory and use the
  app-wide certification gate in both the implementation plan and supporting
  audit.

## 2026-05-09 - Eleventh Engineer Review Of Detection Plans

Reviewed the active detection and language plan again as another engineer.

Finding:

- The plan's direction was sound, but key terms were still slightly too loose
  for implementation. In particular, `primary user-facing conclusion`,
  `primary UI`, `review prompt`, and `certified detection` needed exact
  definitions so future route work cannot interpret them differently.
- Run A named the preferred inventory artifact, but did not define the table
  columns needed to turn the inventory into a registry/contract implementation.
- The acceptance criteria still emphasized coaching evidence more than
  app-wide certified conclusions.

What changed:

- Added a `Definitions` section to
  `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`
  covering primary conclusions, primary UI, review prompts, certified
  detections, research/internal signals, and evidence sources.
- Added the required Run A inventory table columns so the next implementation
  run can create
  `src/docs/trader-intelligence-detection-contract-inventory-2026-05-09.md`
  without guessing the schema.
- Updated acceptance criteria so every certified primary user-facing conclusion
  must name or link to its evidence source, while action-oriented coaching
  conclusions also need a fix-first action.

Verification:

- Docs-only review update. No build or test commands were run.

Current best next step:

- The plan is ready to work from. Start Run A by creating the detection
  contract inventory artifact with the documented columns, then build the first
  product-facing detection contracts for the highest-risk visible labels.

## 2026-05-09 - Twelfth Engineer Review Of Detection Plans

Reviewed the active detection/language plan again as another engineer, this
time looking for route-level loopholes.

Finding:

- The plan correctly required user-facing behavior labels to come from the
  registry, but it did not explicitly say the registry must fail closed.
- Without that rule, a route could accidentally fall back to a raw engine label
  when a behavior ID is missing, unknown, or not certified.
- The supporting behavior-language audit still narrowed raw-label replacement
  to coach and analytics instead of all primary user routes.

What changed:

- Updated
  `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`
  so the shared mapper/registry must fail closed: unknown or unmapped behavior
  can become a neutral review prompt or advanced/internal diagnostic, but it
  cannot render as a primary UI conclusion.
- Added a Run B allowlist rule: the product-facing registry controls primary
  behavior conclusions, and missing/review-prompt/internal behavior must not
  fall back to raw labels.
- Expanded copy-safety and acceptance criteria to cover unmapped raw labels.
- Updated
  `src/docs/trader-intelligence-behavior-language-and-detection-audit-2026-05-09.md`
  so raw-label replacement applies across coach, analytics, review, progress,
  saved trades, and trade detail.

Verification:

- Docs-only review update. No build or test commands were run.

Current best next step:

- The plan is ready to work from. Start Run A by creating the detection
  contract inventory, then implement the registry as an allowlist/fail-closed
  mapper before wiring any behavior conclusion into primary UI.

## 2026-05-09 - Thirteenth Engineer Review Of Detection Plans

Reviewed the active plan set again as another engineer, focused on advanced
and collapsed UI surfaces.

Finding:

- The plan allowed raw/internal details in advanced or collapsed diagnostics,
  but did not explicitly treat the visible collapsed heading, summary, pill, or
  badge as primary UI.
- That was a real product-safety loophole: a route could hide raw details in a
  disclosure but still expose an internal label in the disclosure title.

What changed:

- Updated
  `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`
  so advanced disclosure titles, closed-state summaries, visible badges, and
  visible pills count as primary UI for copy-safety purposes.
- Clarified that raw/internal labels can appear only inside the expanded
  advanced detail, not in the collapsed wrapper a normal user sees.
- Updated
  `src/docs/trader-intelligence-behavior-language-and-detection-audit-2026-05-09.md`
  with the same advanced/collapsed UI rule.

Verification:

- Docs-only review update. No build or test commands were run.

Current best next step:

- The plan is ready to work from. Start Run A inventory, then implement the
  fail-closed behavior mapper and make copy-safety tests cover both normal UI
  and visible collapsed disclosure labels.

## 2026-05-09 - Comprehensive Engineer Review Of Plan Set

Reviewed the active plan set again as another engineer after the user correctly
called out that prior review passes were too narrow.

Scope reviewed:

- `plan.md`
- `src/docs/trader-intelligence-plan-index.md`
- `src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md`
- `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`
- `src/docs/trader-intelligence-behavior-language-and-detection-audit-2026-05-09.md`
- `src/docs/trader-intelligence-coach-continuous-product-plan-2026-05-09.md`
- `src/docs/trader-intelligence-review-queue-continuous-product-plan-2026-05-09.md`
- `src/docs/trader-intelligence-analytics-continuous-product-plan-2026-05-09.md`
- `src/docs/trader-intelligence-progress-continuous-product-plan-2026-05-09.md`
- `src/docs/how_to_create_plan_to_work_continuously.md`

Findings:

- Some feature plans still described themselves as active coaching-batch plans,
  even though the current active gate is Detection And Language Hardening.
- The top-level continuous plan still called the Coaching Product Session batch
  the current active batch in one section.
- The detection plan was product-safe, but it did not name concrete
  implementation artifact paths or the expected mapper/registry return shape.
- Feature plans for coach, review, analytics, and progress did not all carry
  the same fail-closed detection gate and collapsed-disclosure wrapper rule.
- The plan-creation guide did not yet tell future Codex to do a full cross-plan
  audit before saying a plan is ready, which encouraged narrow one-issue review
  passes.

What changed:

- Added implementation artifact/API direction to the active detection plan,
  including suggested `src/lib/user-facing-behavior/...` paths and an explicit
  mapper result shape with `state` and `canDrivePrimaryConclusion`.
- Added a full Run A audit checklist and search commands to the active
  detection plan so future implementation starts by finding all visible labels,
  fallback strings, route-local maps, and collapsed-wrapper labels.
- Updated the top-level continuous plan so Detection And Language Hardening is
  clearly the current active batch and the Coaching Product Session batch is
  the next product-flow batch after behavior labels are inventoried/gated.
- Updated the coach and review feature plans to mark them as secondary until
  detection hardening is complete.
- Added fail-closed mapper and collapsed-wrapper copy-safety rules to coach,
  review, analytics, progress, the behavior-language audit, and root `plan.md`.
- Updated the plan index with an explicit instruction that future plan reviews
  should audit the active plan set together rather than patching one narrow
  issue per prompt.
- Updated `src/docs/how_to_create_plan_to_work_continuously.md` with a
  full-plan audit matrix.

Verification:

- Docs-only review update. No build or test commands were run.

Current best next step:

- The plan set is ready to work from. Start implementation with Run A from the
  detection hardening plan: create the detection contract inventory, audit all
  visible behavior labels and fallback strings, then build the shared
  fail-closed mapper/registry before wiring behavior conclusions into primary
  UI.

## 2026-05-09 - Final Readiness Audit Of Plan Set

Reviewed the plan set again as another engineer to confirm it is actually ready
to work from, not just directionally correct.

Findings:

- The active entrypoints and project log agreed that Detection And Language
  Hardening is the current gate.
- The active detection plan had enough implementation detail to start Run A and
  Run B.
- A few secondary feature plans still had wording that could narrow the active
  app-wide inventory to coach labels or make `/review` sound like the current
  active batch.

What changed:

- Updated the coach plan's current-next-step section so it cannot shrink the
  active Run A inventory to coach only. It now says to complete the app-wide
  inventory first, then use the coach-specific steps as the first route slice.
- Updated the review queue plan so `/review` is clearly a continuation point
  after the active detection/language batch creates the shared fail-closed
  mapper.
- Updated the analytics and progress plans so they follow the active Detection
  And Language Hardening Batch, not an old "active coaching batch" phrase.
- Updated the plan index so feature plans are route context during detection
  hardening or next detailed plans afterward.

Verification:

- Docs-only readiness update. No build or test commands were run.

Current best next step:

- The plan set is ready to work from. Start implementation now with Run A from
  `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`.
  Create `src/docs/trader-intelligence-detection-contract-inventory-2026-05-09.md`,
  audit visible behavior labels/fallbacks across the core routes, then build
  the shared fail-closed mapper/registry.

## 2026-05-09 - Readiness Audit Cleanup

Reviewed the plan set again as another engineer to check practical
implementation friction.

Findings:

- Root `plan.md` skipped the active top-level plan in its resume order even
  though the plan index includes it.
- The active detection plan's suggested `rg` command referenced
  `src/components`, which does not currently exist in this repo.
- The verification command did not explicitly include the planned
  `src/lib/user-facing-behavior` module tests.

What changed:

- Updated root `plan.md` so the resume order matches the plan index:
  project log -> index -> active top-level plan -> active detailed plan.
- Updated the active detection plan's audit command to search existing paths
  and added a note to include any component directory if one exists.
- Updated the active detection plan's verification command to include
  `src/lib/user-facing-behavior` alongside trader analytics and user-facing
  review tests.

Verification:

- Docs-only readiness cleanup. No build or test commands were run.

Current best next step:

- The plan set is ready to work from. Start implementation with Run A from the
  detection hardening plan: create the detection contract inventory, audit
  visible behavior labels/fallbacks across the core routes, then build and test
  the shared fail-closed mapper/registry.

## 2026-05-09 - Expanded Next Implementation Run Scope

Reviewed the active detection/language plan for whether it supports the user's
goal of longer autonomous runs.

Finding:

- The next step was correct, but still too easy to execute as a short stop
  after only creating the inventory artifact.
- The plan needed an explicit minimum useful work block so future Codex can
  keep going from inventory into mapper scaffolding, first route wiring, tests,
  and the next safe route slice without asking the user to say "continue."

What changed:

- Added a `Long Continuous Implementation Run Scope` section to
  `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`.
- Updated the plan index and root `plan.md` so the next run is expected to move
  from detection inventory into the shared behavior contract/registry/mapper,
  first highest-risk behavior contracts, `/coach` wiring, focused tests, and
  then the next route slice when reuse is mechanical and safe.
- Updated `src/docs/how_to_create_plan_to_work_continuously.md` so future plans
  define a minimum useful work block and explicitly say what not to stop after.

Verification:

- Docs-only planning update. No build or app tests were run.

Current best next step:

- Start the expanded detection/language implementation run. Complete the
  inventory, scaffold and test the shared fail-closed mapper/registry, wire the
  first `/coach` route slice, and continue to the next safe route or behavior
  contract if no global blocker appears.

## 2026-05-09 - Detection Language Implementation Slice Started

Worked from the active Detection And Language Hardening plan.

What changed:

- Created `src/docs/trader-intelligence-detection-contract-inventory-2026-05-09.md`.
- Added the shared `src/lib/user-facing-behavior` contract, registry, mapper,
  and fail-closed tests.
- Mapped the first certified detections and prompt-only behaviors into
  trader-readable copy. The mapper now blocks unknown or route-disallowed
  behavior labels from primary conclusions.
- Wired the mapper into the coach action loop so top severity, coach actions,
  timeline labels, and session prep use product-safe labels.
- Wired product intelligence, improvement intelligence, and review-habit rule
  drafts so prompt-only behaviors no longer drive cost estimates, recurrence
  alerts, mistake-frequency visuals, session leak copy, best/worst repeated
  mistake copy, or mistake-to-rule drafts.
- Wired product evidence cards so prompt-only behaviors no longer become
  primary mistake evidence cards.
- Added copy-safety tests for raw labels such as "failed premise",
  "revenge-like", "Chased Entry", and "Early Winner Exit".

Verification:

- `npx vitest run src/lib/user-facing-behavior src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts src/lib/trader-analytics/__tests__/end-user-product-intelligence.test.ts src/lib/trader-analytics/__tests__/trader-improvement-intelligence.test.ts src/lib/trader-analytics/__tests__/trader-review-habit-loop.test.ts src/lib/trader-analytics/__tests__/trader-product-polish.test.ts src/lib/trader-analytics/__tests__/coach-overall-focus.test.ts`
  passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.

Current best next step:

- Continue Run E from the detection plan into route-level surfaces:
  `/trades/[tradeId]`, `/review`, `/analytics`, `/progress`, and `/trades`.
  Reuse the shared mapper and add route-facing copy-safety tests after each
  slice.

## 2026-05-09 - Coaching Evidence Model Documentation

Updated docs after clarifying the product model for coaching opportunities.

What changed:

- Added
  `src/docs/trader-intelligence-coaching-evidence-model-2026-05-09.md`.
- Updated the active Detection And Language Hardening plan so every future
  behavior contract should declare:
  - risk to reduce vs strength to repeat vs review prompt vs internal-only,
  - execution-only vs market-context vs combined evidence,
  - fallback copy when the needed evidence channel is missing.
- Updated the coach plan to make `/coach` an overall coach that can lead with a
  risk or a strength, and to require evidence-channel labeling.
- Updated the analytics plan so analytics supports self-coaching across both
  execution evidence and chart/levels market context.
- Updated the progress plan so progress can track strengths preserved as well
  as risks reduced.
- Updated the plan index and root `plan.md` to link the evidence model and
  reflect the current route-level continuation point.

Important product rule captured:

- Execution evidence comes from imported buys/sells and saved trade
  reconstruction.
- Market context evidence comes from support/resistance levels, candles, volume,
  and chart context before entry, during the trade, and after exit.
- The app must not make support/resistance, candle, volume, or post-exit
  continuation claims unless that market context is attached.
- The app should identify things the trader is doing well, not only mistakes.

Verification:

- Docs-only update. No build or test commands were run.

Current best next step:

- Continue implementation from the detection plan, using the evidence model as
  the gate for whether each behavior can be certified as execution-only,
  market-context, combined, or only a review prompt.

## 2026-05-09 - Next Continuous Implementation Run Plan Added

Created a larger execution-control plan so the next implementation run can
continue through multiple safe blocks without stopping after one small route or
label change.

What changed:

- Added
  `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`.
- Linked the new plan from `src/docs/trader-intelligence-plan-index.md`.
- Linked the new plan from root `plan.md`.
- Updated the root and index resume order so future runs explicitly open the
  next-run execution plan after the active top-level and detailed plans.
- The new plan turns the next run into a ladder:
  - reorient/search for raw language leaks,
  - strengthen the user-facing behavior contract,
  - add certified strengths,
  - wire `/trades/[tradeId]`,
  - wire `/review`,
  - wire `/analytics`,
  - wire `/progress`,
  - wire `/trades`,
  - investigate decision-review level-context failures,
  - add cross-route copy-safety tests,
  - run browser smoke and verification,
  - update docs/logs.

Verification:

- Docs-only update. No build or test commands were run.

Current best next step:

- When the user says to proceed, start from
  `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`
  Block 1 and keep moving through the implementation ladder. Do not stop after
  one small slice unless a global stop condition appears.

## 2026-05-09 - Engineer Readiness Review After Next-Run Plan

Reviewed the active plan set again as another engineer to confirm the new
next-run execution plan is actually ready to work from.

Findings:

- The new next-run plan was strong enough to control the next implementation
  run.
- The plan index still summarized the next scope as "continue Run E", which was
  too narrow because the new plan intentionally starts with leak search,
  contract hardening, and certified strengths before route wiring.
- The top-level continuous UX/product plan still had a stale `Current Best Next
  Step` section that described the coaching product batch as the next active
  run, even though the current active gate is detection/language hardening.

What changed:

- Updated `src/docs/trader-intelligence-plan-index.md` so plan precedence is
  explicit:
  newest project-log entry -> next-run execution plan -> current detailed plan
  -> active top-level plan -> route-specific feature plans.
- Updated the plan index current route order and next-run scope to point to
  `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`
  instead of the narrower Run E shortcut.
- Updated
  `src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md` so
  its stale coaching-batch "Current Best Next Step" is clearly historical
  context, and the active execution ladder is the new next-run plan.
- Updated
  `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`
  so its next implementation slice points to the new next-run plan before
  route wiring.
- Updated the top-level suggested execution order so the first item is the
  next-run execution plan, with the detection/language plan as detailed
  prerequisite context.
- Updated the next-run plan's required-reading list so it includes the active
  top-level plan and tells future Codex to open route-specific feature plans
  before editing `/coach`, `/review`, `/analytics`, or `/progress`.
- Updated the historical trade-review workspace checklist so it points to the
  active next-run plan first instead of asking future Codex to start from the
  old `Current Best Next Step` section.
- Renamed the stale top-level `Current Best Next Step` heading to historical
  product-flow context and removed the remaining `Continue Run E` shortcut from
  the active detection plan's tail.

Verification:

- Docs-only readiness review. No build or test commands were run.

Current best next step:

- The plan set is now aligned. When implementation resumes, work from
  `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`
  Block 1, then continue through contract hardening, certified strengths,
  route wiring, copy-safety tests, verification, and docs/logging without
  stopping after one small slice.

## 2026-05-09 - Historical Plan Breadcrumb Cleanup

Reviewed the plan set again as another engineer, this time including older
roadmap and handoff files that could still mislead a cold resume.

Findings:

- Active entrypoints were aligned, but several older docs still said things
  like "next implementation roadmap", "active working plan", or "read this file
  first".
- The plan index maintenance rule still named the active top-level plan instead
  of the full precedence order, which could weaken the new next-run plan's
  authority.

What changed:

- Updated the plan index maintenance rule to use the same precedence order as
  the instructions section.
- Marked these older docs as historical or superseded at the top:
  - `src/docs/trader-intelligence-end-user-ui-overhaul-plan-2026-05-08.md`
  - `src/docs/end-user-analytics-product-expansion-plan.md`
  - `src/docs/end-user-productization-implementation-plan.md`
  - `src/docs/end-user-trader-analytics-product-roadmap.md`
  - `src/docs/trader-analytics-reports-plan.md`
  - `src/docs/execution-data-feedback-plan.md`
  - `src/docs/trader-intelligence-next-chat-handoff-2026-05-05.md`
  - `src/docs/trader-intelligence-next-chat-handoff-2026-05-06.md`
- Updated `src/docs/trader-intelligence-system.md` so its old "current active
  focus" wording reads as a historical system snapshot.
- Removed remaining stale phrases from historical docs, including old
  `Current Best Next Step`, `active working plan`, `read this file first`, and
  `current active branch` wording.
- Aligned the next-run plan header with its required-reading body so it also
  names the active top-level plan before the active detailed detection plan.
- Fixed the next-run Block 9 command so the decision-review tests point at
  `src/lib/trader-analytics/__tests__`, which is where those tests actually
  live.
- Added an explicit note that `/trades` and `/trades/[tradeId]` do not need
  separate feature plans before implementation; next-run Blocks 4 and 8 are the
  controlling plans for those routes.
- Reworded the plan index resume point from "next blocker" to "next
  implementation focus" so future work does not stop unnecessarily.

Verification:

- Docs-only readiness cleanup. No build or test commands were run.

Current best next step:

- The active plan stack is ready to work from. Start from
  `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`
  Block 1 and continue through the long implementation ladder.

## 2026-05-09 - Behavior Contract And Route Copy Hardening Continuation

Continued the detection/language implementation branch from the active
next-run plan.

What changed:

- Hardened the shared user-facing behavior contract with explicit opportunity
  type and evidence channel fields.
- Added first-pass certified execution-only strengths for clean entry/full
  exit, controlled scale-in, structured partial exits, early risk reduction,
  clean full exits, consistent sizing, and profitable reductions.
- Expanded alias coverage for existing execution-feedback IDs so raw labels
  such as multiple-add, adverse-add, overbuilt-position, and reduction-sequence
  signals map into trader-readable language.
- Wired report and saved-trade selectors through the shared behavior mapper so
  trade detail, review, analytics, progress, and saved trades reuse the same
  product-safe point labels.
- Replaced primary product copy using "adverse add", "rapid-fire",
  "open leftover", and "decisive full exit" with clearer trader language.
- Fixed behavior trend narration so risk reductions and strength increases are
  described in the correct direction.
- Added a product-expansion regression test that checks trend labels stay
  human-readable and that improving clean exits say they appeared more often.
- Updated the active next-run, detection/language, and plan-index docs with the
  new resume point.

Verification:

- `npx vitest run src/lib/user-facing-behavior/__tests__/map-user-facing-behavior.test.ts src/lib/trader-analytics/__tests__/build-trader-analytics-report.test.ts src/lib/trader-analytics/__tests__/end-user-product-expansion.test.ts src/lib/trader-analytics/__tests__/end-user-product-roadmap.test.ts src/lib/trader-analytics/__tests__/trader-improvement-intelligence.test.ts src/lib/trader-analytics/__tests__/trader-review-habit-loop.test.ts src/lib/trader-analytics/__tests__/trader-product-polish.test.ts`
  passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.

Current best next step:

- Continue from the active next-run plan after Blocks 1-3. Re-run leak search
  only as a safety check, then harden route-level UI on `/trades/[tradeId]`,
  `/review`, `/analytics`, `/progress`, and `/trades`; keep review prompts
  separate from certified conclusions and keep chart/level/volume claims gated
  behind market-context evidence.

## 2026-05-09 - Continuous Run Stop-Condition Correction

Updated the active plan stack after the user correctly pointed out that the
last implementation run stopped at a clean verification checkpoint instead of
continuing into the next safe slice.

What changed:

- Updated
  `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`
  so passing focused tests, TypeScript, or build after one slice is treated as
  a checkpoint to continue from, not a stopping condition.
- Added a minimum target for the next implementation run:
  - quick leak search,
  - full route-family hardening across `/trades/[tradeId]`, `/review`,
    `/analytics`, `/progress`, and `/trades`,
  - route-facing copy-safety tests,
  - focused Vitest and TypeScript,
  - then either the next certifiable execution-only behavior family or the
    decision-review level-context investigation.
- Updated the active detection/language plan so the next pass is a completion
  run, not another one-slice hardening pass.
- Updated the plan index so future Codex does not treat one green test/build
  checkpoint as enough to report back when the next safe work is already
  defined.

Why the last run stopped:

- It reached a clean checkpoint after contract hardening, copy replacements,
  focused tests, TypeScript, build, and docs updates. That was useful, but not
  the right stopping threshold for this project because the next route and
  behavior slices were already known.

Current best next step:

- Proceed with the larger detection/language completion run: sweep the full
  route family, keep every current execution-only behavior certified/review
  prompt/internal-only, add route-facing copy-safety tests, then continue into
  market-context gating or the next certifiable detection family before
  reporting back.

## 2026-05-09 - Work Verify Continue Loop Made Explicit

Reviewed the run plan again after the user clarified that verification should
not require a handoff. Codex should do work, verify locally, keep going, and
repeat.

What changed:

- Added a `Work, Verify, Continue Loop` to
  `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`.
- Updated the active detection/language plan so the next run explicitly works
  a route or behavior family, verifies it, fixes failures, and then continues
  into the next safe route or behavior family.
- Updated the plan index with a verification rule: passing tests, typecheck,
  build, or route smoke is a checkpoint to keep going, not a reason to ask the
  user to review.
- Updated `src/docs/how_to_create_plan_to_work_continuously.md` so future plans
  include the same loop and do not accidentally turn verification into a stop.

Current best next step:

- Proceed with implementation using the work -> verify -> continue loop. The
  next run should complete a full route-family hardening pass, verify it,
  continue into the next certifiable behavior family or market-context gate,
  verify again, and only then report unless a true global blocker appears.

## 2026-05-09 - Final Continuous Run Plan Certainty Pass

Reviewed the active run plan one more time for stale wording that could make
Codex stop too early or repeat already-completed setup work.

Finding:

- Root `plan.md` still described the next run as if the behavior contract
  needed opportunity type and evidence channel added, even though that work is
  now complete.
- The next-run acceptance criteria still phrased those completed contract
  fields as future work instead of something to preserve and extend.

What changed:

- Updated root `plan.md` so the current next run expectation is explicitly:
  work -> verify -> continue; sweep the full route family; add route-family
  tests; verify locally; continue into the next certifiable behavior family or
  market-context gate before reporting back unless a true global blocker
  appears.
- Updated the next-run acceptance criteria so opportunity/evidence-channel
  fields and certified strengths are treated as existing capabilities to
  preserve and extend.

Current best next step:

- The run plan is aligned for continuous implementation. Proceed with the
  larger route-family detection/language hardening pass and continue after
  verification checkpoints.

## 2026-05-09 - Final Soft-Wording Tightening Pass

Reviewed the active run plan one more time for soft wording that could still
permit a short partial run.

What changed:

- Replaced "as many of these as practical should be true" in the next-run
  acceptance criteria with a stronger target: make all listed items true, and
  only park items with a reason when they cannot be completed safely.
- Replaced "before stopping" language in route/visual continue conditions with
  "before any final response" and "patch, re-smoke, and keep going unless the
  larger batch target has already been met."
- Replaced the continuous-plan guide's soft "continue if time/context remains"
  wording with "continue unless a true global blocker appears."
- Replaced the guide's final-readiness prompt "What do I log before stopping?"
  with "What do I log before the final response?"

Current best next step:

- Proceed with implementation. The active run plan now explicitly favors
  completing the full batch over stopping at partial success, clean
  verification, or one route-sized improvement.

## 2026-05-09 - Required Long-Run Shape Tightened

Reviewed the active run plan again for wording that could still let Codex
treat "several slices" as enough.

What changed:

- Replaced the next-run section named `Definition Of A Good Long Run` with
  `Required Shape Of The Next Long Run`.
- Removed the soft "good run" and "better target" wording.
- Made the next implementation shape explicit: full route-family pass, verify,
  behavior-family pass, verify, market-context gate or known-failure
  investigation, verify, docs/logs, then final response.
- Updated root `plan.md` so the next run must target the full route-family
  sweep instead of merely saying it should.

Current best next step:

- Proceed with implementation from
  `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`.
  The first green verification checkpoint is a midpoint, not the finish line.

## 2026-05-09 - Continuation Language Certainty Pass

Reviewed the active plan stack again for softer wording in the operating mode,
plan index, and detection/language plan.

What changed:

- Replaced "should normally trigger" with a must-level instruction: green
  verification after one slice must trigger the next independent slice unless a
  true global stop condition applies.
- Replaced the plan index's "should not stop / should keep going" wording with
  "must not stop / must keep going."
- Clarified that the detection/language plan's older ladder is context, not a
  command to restart completed inventory or mapper work. Current work resumes
  from the next-run plan and project log.
- Replaced "The user should not need to approve..." with "The user does not
  need..." and made Codex's verify-and-continue duty explicit.

Current best next step:

- Proceed with implementation. The controlling docs now agree: do the full
  route-family pass, verify it, keep going into behavior-family and
  market-context work when safe, and only final-answer after the batch target or
  a true global stop condition.

## 2026-05-09 - Must-Level Plan Language Pass

Reviewed the controlling docs and the continuous-plan guide again for remaining
"should" language that governed autonomy or product safety.

What changed:

- Updated the next-run plan so Codex must verify its own checkpoints and
  continue.
- Updated the continuous-plan guide so future plans must include the
  work-verify-continue loop, and the user does not need to approve each
  checkpoint.
- Updated the plan index and root `plan.md` so uncertain behavior must become a
  review prompt or stay internal.
- Updated the detection/language plan so it must run before additional UI
  polish, market context must use the defined windows, and unknown behaviors
  must fail closed.
- Tightened remaining product-safety wording so uncertified detections,
  behavior contracts, mapper output, route consumption, review queue items,
  market-context gates, and project-log handoffs are must-level requirements
  rather than suggestions.

Current best next step:

- Proceed with implementation. Remaining "should" language in the active docs
  is descriptive guidance, not permission to stop early or overclaim behavior.

## 2026-05-09 - Detection Language Route Family And Level Context Pass

Continued from the active next-run plan and completed the larger
detection/language hardening batch instead of stopping at the first green
checkpoint.

What changed:

- Hardened analytics/report behavior digests so unmapped or prompt-only
  behaviors fail closed and cannot drive primary risks, strengths, fix-first
  copy, category distributions, or chart counts.
- Routed analytics behavior charts, saved-trade selectors, import-preview
  labels, improvement/report copy, review queue diagnostics, import
  diagnostics, and trade-detail chart-context status through product-safe
  mapper or plain state copy.
- Added behavior metadata to analytics point digests so routes can distinguish
  certified detections, review prompts, internal-only signals, evidence
  channels, and opportunity types.
- Added current execution-feedback behavior coverage to the mapper tests,
  including certified risk-to-reduce behaviors, strength-to-repeat behaviors,
  and prompt-only rapid execution clusters.
- Added `adverse_price_adds` as a safe alias for the adverse-add execution
  behavior so trend/focus IDs can resolve to trader-readable language when they
  pass through the shared mapper.
- Fixed the deterministic decision-review CSV scenarios that had drifted away
  from the current sample daily/4h support/resistance map. The scenarios now
  use entry prices that are actually near the current generated levels, so the
  tests prove level-location insight behavior without weakening detector
  thresholds.
- Updated `plan.md`, the plan index, the next-run plan, the detection/language
  hardening plan, and the detection contract inventory with the new resume
  point.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts --reporter=dot`
  passed.
- `npx vitest run src/lib/user-facing-behavior/__tests__/map-user-facing-behavior.test.ts src/lib/trader-analytics/__tests__/build-trader-analytics-report.test.ts src/lib/trader-analytics/__tests__/end-user-product-expansion.test.ts --reporter=dot`
  passed.
- `npx vitest run src/lib/user-facing-behavior src/lib/trader-analytics src/lib/user-facing-review --reporter=dot`
  passed: 38 files, 277 tests.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.

Current best next step:

- Continue from the updated next-run plan. Do not restart the completed mapper
  or route-language sweep. The next implementation focus should be certifying
  the next market-context behavior family or tightening same-symbol
  trade-thread/day-trade-to-swing detection, then wiring those safe conclusions
  into coach, analytics, progress, saved trades, review, and trade detail.

## 2026-05-09 - Evidence Labels And Ticker Story Surfacing Pass

Continued from the active next-run plan and worked through another
detection/language product slice without stopping at the first green checkpoint.

What changed:

- Import dry-run decision-review cards now show plain evidence labels in
  primary UI, for example "Resistance strength: major" and "Later add location
  in recent range: 84.0%". Raw calculation strings remain available only inside
  collapsed calculation details.
- Saved import history and import-batch detail copy no longer exposes raw
  commit/status strings in normal user-facing text.
- The existing same-symbol trade-thread model is now surfaced in:
  - `/coach` as a Ticker Story Coach panel,
  - `/analytics` as Ticker Story Analytics,
  - `/progress` as Ticker Story Progress.
- Ticker stories now give the app a user-facing layer above flat-to-flat round
  trips for same-symbol re-entries, open re-entries, later profit giveback, and
  day-trade-to-swing/overnight transitions.
- Decision-review and coaching copy was tightened from engine wording to
  trader-readable wording:
  - "limited clean room" -> "limited room before resistance"
  - "Profit protection failed" -> "Open profit was not protected"
  - "Trade-window movement was measured" -> "During-trade movement was measured"
  - "Adds increased risk into weakness" -> "Added while price was moving
    against the trade"
  - "Entry was not close to support" -> "Entry had little nearby support"
- `/analytics` restored the P/L-by-session chart in the Charts menu after the
  menu-based layout split, preserving the intended report coverage.
- Added the first certified market-context behavior contracts to the shared
  user-facing behavior registry:
  - entry close to daily/4h resistance,
  - limited room before resistance,
  - entry close to daily/4h support,
  - entry with little nearby support,
  - post-exit continuation,
  - adding before the trade repaired.
  These contracts require market-context evidence and keep chart claims out of
  primary UI when chart context is waiting.
- Updated the active next-run plan, detection/language plan, and plan index
  with this new resume point.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts src/lib/coaching/__tests__/build-trade-coaching-output.test.ts --reporter=dot`
  passed: 3 files, 25 tests.
- `npx vitest run src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts src/lib/trader-analytics/__tests__/coach-overall-focus.test.ts src/lib/trader-analytics/__tests__/build-trader-analytics-report.test.ts src/lib/user-facing-behavior/__tests__/map-user-facing-behavior.test.ts --reporter=dot`
  passed: 4 files, 46 tests.
- `npx vitest run src/lib/trader-analytics src/lib/user-facing-behavior src/lib/user-facing-review src/lib/coaching --reporter=dot`
  passed: 40 files, 293 tests after the market-context contract additions.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop`
  passed: 14 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop`
  passed: 15 tests, 1 desktop-skipped mobile-only test.

Current best next step:

- Continue from the active next-run plan into the next certifiable behavior
  family. Highest-value options are:
  - wiring the newly certified market-context contracts into the next
    route/read-model consumers that see decision-review insight IDs,
  - extending market-context certification into volume, profit protection
    before a fade, support/resistance-aware exits, or post-exit fade/relief
    behavior not covered by the later completed after-exit continuation gate,
    or
  - deeper same-symbol/thread lifecycle detection contracts for repeated
    attempts, day-trade-to-swing transitions, and re-entry profit giveback.
- Do not restart the completed route-language, evidence-label, ticker-story
  surfacing, or first market-context contract passes. Preserve them and wire
  the next certified behavior outputs through coach, analytics, progress,
  saved trades, review, and trade detail.

## 2026-05-09 - Next.js Docs And Plan Handoff Sanity Check

Checked the project handoff chain after the user asked about the earlier note
that `node_modules/next/dist/docs` was missing.

Findings:

- The local Next.js docs do exist in this checkout at
  `node_modules/next/dist/docs/`.
- The installed package checked during this pass is `next@16.2.3`.
- The root `plan.md`, plan index, active detection/language plan, and current
  next-run execution plan all exist locally.
- The worktree is dirty because it contains intentional local implementation
  and planning changes. That is not an app runtime problem, but untracked files
  will not be included in GitHub until they are added and committed.

Docs updated:

- Added `src/docs/nextjs-local-docs-guide.md`.
- Linked it from `src/docs/trader-intelligence-plan-index.md`.

Current best next step:

- Continue implementation from
  `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`.
  Do not redo the completed handoff/planning setup. Before touching Next.js
  route or App Router behavior, use the local docs guide and then read the
  relevant files under `node_modules/next/dist/docs/`.

## 2026-05-09 - Ticker Story Detection And User Copy Hardening

Continued the active detection/language run after confirming the local Next.js
docs path and plan handoff chain.

Changes:

- Fixed same-symbol thread detection so repeated losing attempts are no longer
  classified as profit giveback when the thread never had a positive peak.
- Added explicit ticker-story kinds for single round trip, swing transition,
  open re-entry, profit giveback, re-entry adding profit, repeated losing
  attempts, and multiple round trips.
- Wired those story kinds through `/coach`, `/analytics`, `/progress`, and
  `/trades` so route logic no longer infers story type from loose P/L/lifecycle
  checks.
- Added repeated-loss story metrics to analytics and progress.
- Routed saved chart-context insight titles through the user-facing behavior
  mapper before they appear in ticker-story evidence.
- Tightened primary questions so repeated losing attempts ask whether later
  attempts happened after setup or volume had faded, instead of asking a
  profit-giveback question.
- Cleaned remaining visible copy:
  - `raw import panels` -> `import review panels`,
  - `trade-window` UI labels -> `during-trade` wording,
  - short-direction fallback label -> `position-history review`,
  - sample fixture coach copy -> `Sample data until you save an import`.
- Added `src/docs/nextjs-local-docs-guide.md` and linked it from the plan index
  so future route work knows where the local Next docs live.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts src/lib/trader-analytics/__tests__/coach-overall-focus.test.ts src/lib/user-facing-behavior/__tests__/map-user-facing-behavior.test.ts --reporter=dot`
  passed: 3 files, 48 tests.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop --grep "analytics product intelligence|coach product loop|saved trade routing|progress and behavior|guided review workflow|market context observational|banned product claims|demo user path"`
  passed: 8 tests.

Current best next step:

- Continue from the active next-run plan without restarting the completed
  route-language, evidence-label, ticker-story surfacing, or first
  thread-story hardening slices. The next highest-value work is to deepen
  same-symbol thread detection into richer session-level behavior, such as
  same-symbol overtrading, repeated losing re-entries, day-trade-to-swing
  transitions, and market-context-backed volume/level comparisons, then route
  only certified conclusions into coach, analytics, progress, trades, review,
  and trade detail.

## 2026-05-09 - Next Continuous Run Plan Readiness Check

Reviewed and updated the active planning chain after the user asked to make
sure completed plan sections were marked and the next run was ready before the
next coding batch.

Docs updated:

- `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`
  now has a completed block tracker and a new **Next Continuous Run Starts
  Here** ladder.
- `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`
  now records the completed same-symbol thread-story hardening slice and points
  the next implementation run to the new next-start section.
- `src/docs/trader-intelligence-detection-contract-inventory-2026-05-09.md`
  now includes product contracts/inventory rows for profit giveback, repeated
  losing attempts, day-trade-to-swing, and open re-entry ticker stories.
- `src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md`
  now reflects the explicit ticker-story kinds and repeated-loss/profit-giveback
  guard.
- `src/docs/trader-intelligence-coaching-evidence-model-2026-05-09.md`
  now separates completed evidence-model work from the next implementation
  requirements.

Current next-run plan:

- Do not restart completed route-language, evidence-label, ticker-story
  surfacing, first market-context, or first same-symbol hardening work.
- Start at **Next Continuous Run Starts Here** in
  `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`.
- Next coding run should work continuously through:
  1. same-symbol/session behavior contracts,
  2. market-context volume and level gates,
  3. route wiring for new certified outputs,
  4. focused verification,
  5. docs/log update.

Verification:

- Docs-only readiness pass. No code tests were run.

Current best next step:

- Check in with the user before starting the next coding run, per the user's
  request. When they say to proceed, start from the next-run plan's **Next
  Continuous Run Starts Here** section and work through the continuous
  implementation ladder.

## 2026-05-09 - Session Story Detection And Route Wiring

Continued the active continuous implementation plan from the same-symbol/session
behavior block.

Changes:

- Extended `src/lib/trader-analytics/server/saved-trade-threads.ts` with
  session-level stories above ticker stories.
- Added execution-only session story kinds for:
  - green-to-red session,
  - many attempts on one ticker,
  - high trade-count session,
  - open or swing exposure to review,
  - positive controlled session,
  - mixed session review.
- Added evidence cards for session-level facts such as cumulative P/L peak,
  final session P/L, number of round trips, number of symbols, same-symbol
  attempt counts, and open/overnight lifecycle.
- Added tests proving:
  - a positive peak followed by a red finish becomes a green-to-red session,
  - repeated same-symbol losses become many attempts on one ticker without
    using revenge-trading language,
  - high trade-count sessions require explicit counts,
  - open/overnight exposure stays a separate hold-review story.
- Wired session stories into:
  - `/analytics` through a Session Story Analytics panel,
  - `/coach` through a Session Story Coach panel,
  - `/progress` through Session Story Progress counts,
  - `/trades` through a Session Stories browse mode and panel.
- Extended focused Playwright assertions for the analytics, coach, saved trades,
  and progress route surfaces.
- Updated the active plan, plan index, root `plan.md`, detection/language plan,
  detection contract inventory, and coaching evidence model so future runs do
  not redo the completed ticker-story or first session-story layer.

Verification:

- `npm test -- --run src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts`
  passed: 1 file, 11 tests.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "shows the analytics product intelligence surfaces|shows the coach product loop|shows saved trade routing|shows the progress"`
  passed: 4 tests.

Current best next step:

- Do not rebuild route-language hardening, ticker stories, explicit ticker-story
  kinds, or first session stories.
- Continue from the active next-run plan into market-context volume/post-exit
  gates, route handoffs for certified outputs, or deeper strength-to-repeat
  behavior only when the evidence is explicit.

## 2026-05-10 - Next Run Long-Batch Setup Correction

Reviewed the active plan chain after the user correctly pointed out that the
last coding continuation still stopped too soon.

Problem found:

- The next-run plan had a long implementation ladder lower in the file, but the
  controlling "next step" wording near the top was still too compact. That made
  it easy to treat "market-context gates and route handoffs" as one small
  vertical slice instead of a longer chained batch.

Docs updated:

- `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`
  now has a **Required Long-Run Batch Shape** and **Next Run Phase Plan** before
  the older block list.
- `plan.md` now points the next coding run to those long-batch sections, not
  only the short next-block summary.
- `src/docs/trader-intelligence-plan-index.md` now includes an anti-short-run
  rule and says the next run must chain market-context evidence inventory,
  certification/downgrade, read-model bridging, route-family handoffs, focused
  verification, and at least one independent second slice before docs/logs and
  final response.
- `src/docs/how_to_create_plan_to_work_continuously.md` now records the lesson:
  the active execution plan needs a top-level minimum batch target, not only a
  buried long checklist.
- `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`
  now points to the next-run plan's **Required Long-Run Batch Shape** and
  states that a green focused test is a checkpoint, not the end of the run.

Current next-run instruction:

- When the user says to proceed, start from
  `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`
  at **Required Long-Run Batch Shape**.
- Do not stop after one mapper contract, one read-model change, one route panel,
  one green focused test, or one docs update.
- The next coding run should continue through as many phases as possible:
  1. reorientation and leak scan,
  2. market-context evidence inventory,
  3. certification or downgrade of one market-context behavior family,
  4. product read-model bridge,
  5. route-family handoffs across multiple user routes,
  6. strength-to-repeat follow-up if verification is green,
  7. focused and broader verification,
  8. docs/log update.

Verification:

- Docs-only setup correction. No code tests were run.

## 2026-05-10 - Chart Context Finding Bridge And Route Handoffs

Continued from the active long-batch plan and completed the first product-safe
chart-context finding bridge instead of stopping after one mapper or route
change.

Changes:

- Saved decision-review market-context insights now pass through the shared
  user-facing behavior mapper before route read models consume them.
- `src/lib/trader-analytics/server/saved-trade-threads.ts` now exposes
  product-ready chart-context findings with opportunity type, evidence channel,
  finding source, label, detail, review action, tone, and primary-conclusion
  eligibility.
- Chart-context finding counts now include risk, strength, review-prompt,
  post-exit, level, and volume-evidence splits.
- `/trades/[tradeId]` now shows mapped Chart Context Review cards and moves
  hidden/unmapped chart notes into a technical disclosure.
- `/review` queue reasons and evidence cards now use mapped chart-context
  findings and show risk/strength/prompt splits.
- `/coach`, `/analytics`, `/progress`, and `/trades` now consume the
  chart-context finding read model for ticker-story metrics, filters, stats,
  and story badges.
- Short-specific chart-context findings fail closed in normal user routes.
- Prompt-only during-trade measurements remain review prompts and cannot drive
  primary risk or strength counts.
- Updated the active next-run plan, plan index, root `plan.md`, detection and
  language plan, detection inventory, and coaching evidence model so future
  runs do not rebuild this completed bridge.

Verification:

- `npx vitest run src/lib/user-facing-behavior/__tests__/map-user-facing-behavior.test.ts src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts src/lib/trader-analytics/__tests__/sqlite-import-commit-repository.test.ts --reporter=dot`
  passed: 73 tests.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "analytics product intelligence|coach product loop|saved trade routing|progress and behavior|guided review workflow|market context observational|banned product claims"`
  passed: 7 tests.

Current best next step:

- Do not rebuild route-language hardening, evidence-label mapping, ticker
  stories, session stories, or the first chart-context finding bridge.
- Continue from
  `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`
  into a not-yet-covered market-context behavior family: volume fade between
  attempts, profit protection before a measured fade, support/resistance-aware
  exit behavior, post-exit fade/relief behavior not covered by the later
  completed after-exit continuation gate, or a strength-to-repeat
  session/ticker story with explicit evidence.
- If volume bars or candle windows are missing, downgrade the behavior to a
  review prompt and continue with the next independent certified route or
  behavior slice.

## 2026-05-10 - Add Quality Prompt Split And Evidence Counts

Continued the active long-batch implementation plan after the user clarified
that the old blanket add-risk wording was too easy to misread. The product
distinction is now explicit: execution-only adverse-add evidence can ask the
trader to review add quality, but it cannot call the add bad, weak, or a failed
dip buy until chart context proves that.

Changes:

- Downgraded `scaled_loser` and `add_after_adverse_move` to review prompts in
  `src/lib/user-facing-behavior`.
- Kept chart-backed add conclusions separate:
  - `adds_increased_risk_into_weakness` remains a certified risk;
  - `adds_aligned_with_strength` remains a certified strength.
- Reworded the user-facing `added_after_failed_premise` copy to
  "Added several times before reducing size" and updated the product taxonomy
  label to avoid "premise" wording by default.
- Filtered coach archetype scoring to certified observations so prompt-only
  adverse-add observations cannot inflate the main coach "current pattern."
- Extended `src/lib/trader-analytics/server/saved-trade-threads.ts` with
  aggregate add-quality, post-exit, level, and volume-evidence counts.
- Routed the new evidence splits into:
  - `/analytics`,
  - `/progress`,
  - `/trades`,
  - `/trades/[tradeId]`,
  - `/coach`.
- Added `/trades` ticker-story filters for add quality, post-exit, levels, and
  volume evidence.
- Updated the active next-run plan, detection/language plan, detection contract
  inventory, plan index, and root `plan.md`.

Verification:

- `npx vitest run src/lib/user-facing-behavior/__tests__/map-user-facing-behavior.test.ts src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts src/lib/trader-analytics/__tests__/build-trader-analytics-report.test.ts src/lib/trader-analytics/__tests__/end-user-product-expansion.test.ts src/lib/trader-analytics/__tests__/end-user-product-intelligence.test.ts src/lib/trader-analytics/__tests__/trader-review-habit-loop.test.ts src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts --reporter=dot`
  passed: 7 files / 106 tests.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "analytics product intelligence|coach product loop|saved trade routing|progress and behavior|guided review workflow|market context observational|banned product claims"`
  passed: 7 tests.

Current best next step:

- Do not rebuild the route-language pass, ticker stories, session stories,
  chart-context bridge, or the add-quality prompt/certification split.
- Continue with a new evidence-backed market-context family, preferably
  first-entry versus re-entry volume comparison, support/resistance-aware
  exit behavior, or post-exit fade/relief behavior not already covered by the
  completed after-exit continuation gate.
- If explicit candle, level, volume, or post-exit evidence is missing, keep the
  behavior as a review prompt or internal-only diagnostic and continue to the
  next certifiable slice.

## 2026-05-10 - Post-Exit And Volume Evidence Hardening

Continued the long-batch plan from the add-quality split and completed the
next safe evidence/read-model/route-language slice instead of stopping at the
first green focused test.

Changes:

- Saved trade-thread read models now split post-exit and volume evidence into
  risk, strength, and review-prompt counts at both thread and aggregate level.
- Profit-protection findings now surface as after-exit evidence instead of
  being counted silently.
- Volume evidence cards now use the actual certified finding when one exists:
  risk findings read as "Volume-backed risk is attached," strength findings
  read as "Volume-backed strength is attached," and prompt-only findings stay
  informational.
- Added explicit tests for volume-backed risk, volume-backed strength, post-exit
  risk, post-exit strength, and profit-protection after-exit evidence.
- User routes now use beginner-readable copy:
  - "After-Exit Review" / "After Exit" instead of "Post-Exit Checks";
  - "risk to review" and "strength to repeat" instead of "risk-backed" and
    "strength-backed";
  - "chart review" / "chart findings" instead of visible hyphenated
    "chart-context" wording.
- Review queue priority reasons now use "chart-backed risk/strength" and
  "trade review" wording where the user sees it.
- The core route Playwright copy-safety scan now blocks the confusing UI
  phrases that were removed in this slice.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts --reporter=dot`
  passed: 19 tests.
- `npx vitest run src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts src/lib/trader-analytics/__tests__/saved-import-api-routes.test.ts src/lib/trader-analytics/__tests__/sqlite-import-commit-repository.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot`
  passed: 4 files / 55 tests.
- `npx vitest run src/lib/user-facing-behavior/__tests__/map-user-facing-behavior.test.ts src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts src/lib/trader-analytics/__tests__/build-trader-analytics-report.test.ts src/lib/trader-analytics/__tests__/end-user-product-expansion.test.ts src/lib/trader-analytics/__tests__/end-user-product-intelligence.test.ts src/lib/trader-analytics/__tests__/trader-review-habit-loop.test.ts src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts src/lib/trader-analytics/__tests__/saved-import-api-routes.test.ts src/lib/trader-analytics/__tests__/sqlite-import-commit-repository.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot`
  passed: 10 files / 146 tests.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "analytics product intelligence|coach product loop|saved trade routing|progress and behavior|guided review workflow|market context observational|banned product claims"`
  passed: 7 tests.
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop -g "repairs a missing-quantity row"`
  passed: 1 test.

Current best next step:

- Do not rebuild post-exit/volume count splitting, route copy cleanup, or the
  new confusing-phrase copy-safety guard.
- Continue with a truly new market-context behavior family only when the input
  evidence supports a certified claim. Highest-value candidates remain:
  first-entry versus re-entry volume comparison, support/resistance-aware
  entry/exit behaviors, or post-exit fade/relief behavior not already covered
  by the completed after-exit continuation gate.
- If the available data cannot prove the claim, preserve it as a review prompt
  and move to the next independent certifiable slice.

## 2026-05-10 - After-Exit Certification Gate And Add-Repair Language

Continued the post-exit/market-context branch and completed a hardening slice
that prevents premature-exit language from becoming overconfident when
after-exit candles are missing or outside the current calibrated range.

Changes:

- `exit_left_continuation` now requires actual post-exit candles and a
  calibrated favorable after-exit move before it can appear as a certified
  continuation finding.
- Missing after-exit candle evidence now maps to the prompt-only finding
  `exit_needs_post_exit_context`.
- Oversized after-exit moves now map to the prompt-only finding
  `exit_large_post_exit_move_needs_review` until that case is calibrated
  safely.
- Saved trade-thread evidence cards surface those after-exit prompts without
  counting them as proven risk or strength.
- Chart-confirmed weak-add language was tightened to "Added before the trade
  repaired." This makes room for the legitimate dip-buy case: support can
  hold, price can reclaim, or the trade can repair before an add becomes
  constructive.
- Rule-builder recommendations for adverse-add cost drivers now suggest
  "Require repair before adding size" instead of blanket "Avoid ..." language.

Verification:

- `npx vitest run src/lib/trade-analysis/review/__tests__/build-trade-decision-review.test.ts src/lib/user-facing-behavior/__tests__/map-user-facing-behavior.test.ts src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts src/lib/trader-analytics/__tests__/end-user-product-intelligence.test.ts --reporter=dot`
  passed: 4 files / 86 tests.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "coach product loop|market context observational|banned product claims"`
  passed: 3 tests.
- `git diff --check` passed with only existing line-ending warnings for
  `.gitignore` and `src/docs/codex-project-log.md`.

Current best next step:

- Do not rebuild the after-exit certification gate, prompt-only after-exit
  contracts, saved-thread after-exit prompt card, or add-repair language.
- Continue to the next independent market-context family. Highest-value next
  candidates are support/resistance-aware exit behavior, first-entry versus
  re-entry volume comparison, or strength-to-repeat story language when
  explicit chart/level/candle evidence supports the claim.
- If the evidence only says "review this," keep it prompt-only and move to the
  next certifiable slice instead of forcing a coaching conclusion.

## 2026-05-10 - Plan Freshness Audit

Reviewed the root plan, plan index, active continuous run plan, detection and
language hardening plan, coaching evidence model, behavior language audit,
Layer 2 catalog, and this project log for stale next-work language that could
cause duplicate implementation.

Updates:

- Marked after-exit continuation certification, prompt-only missing/oversized
  after-exit findings, add-quality prompt/certification split, post-exit/volume
  evidence splitting, and add-repair language as completed work that should not
  be rebuilt.
- Replaced older "richer continuation gate" next-step wording with the current
  scope: support/resistance-aware exit behavior, first-entry versus re-entry
  volume comparison, post-exit fade/relief behavior not already covered by the
  completed after-exit gate, or strength-to-repeat story language when explicit
  evidence exists.
- Tightened remaining add-quality docs so execution-only adverse movement stays
  a review prompt and chart-confirmed weak-add copy uses "Added before the
  trade repaired."

Current best next step:

- Start the next coding run from `plan.md` ->
  `src/docs/trader-intelligence-plan-index.md` ->
  `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`.
- Preserve completed route-language, ticker-story, session-story, chart-context
  bridge, add-quality, post-exit/volume split, and after-exit gate work.
- Implement the next independent evidence-backed market-context family, with
  support/resistance-aware exit behavior or first-entry versus re-entry volume
  comparison as the cleanest next candidates.

## 2026-05-10 - Support/Resistance Exit And Re-Entry Volume Certification

Continued the next continuous implementation run without creating another plan.
This pass completed two independent evidence families and then cleaned up the
analytics review-prompt expectation so prompt-only execution evidence stays
visible without becoming a certified risk.

Changes:

- Added user-facing behavior contracts for support/resistance-aware exit
  outcomes:
  - reductions near resistance,
  - exits that avoided later adverse follow-through,
  - exits into resistance followed by reversal,
  - exits into resistance before measured breakout,
  - exits into support before measured breakdown,
  - exits into support followed by relief as a review prompt.
- Added user-facing behavior contracts for same-symbol re-entry volume
  comparison:
  - later re-entry volume faded and the outcome weakened,
  - later re-entry volume confirmed and the outcome held up.
- Extended `build-trade-decision-review` so daily/4h support and resistance
  exit insights can become risks, strengths, or prompts only when the attached
  market-context evidence supports that story.
- Extended saved trade-thread read models with first-entry versus re-entry
  volume comparison findings based on saved snapshot evidence. Missing or
  insufficient volume remains silent instead of becoming a claim.
- Updated post-exit/ticker-story evidence titles so support/resistance exit
  and re-entry volume findings use product-ready copy instead of generic
  volume or after-exit wording.
- Kept execution-only adverse-add findings as review prompts in analytics
  drilldowns. They are visible for self-review but no longer expected as the
  top proven risk in fixture expectations.

Verification:

- `npx vitest run src/lib/user-facing-behavior/__tests__/map-user-facing-behavior.test.ts src/lib/trade-analysis/review/__tests__/build-trade-decision-review.test.ts src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts --reporter=dot`
  passed: 3 files / 93 tests.
- `npx vitest run src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts src/lib/trader-analytics/__tests__/trader-product-polish.test.ts src/lib/trader-analytics/__tests__/trader-improvement-intelligence.test.ts --reporter=dot`
  passed: 3 files / 25 tests.
- `npx vitest run src/lib/trader-analytics/__tests__/coaching-fixture-expectation-matrix.test.ts --reporter=dot`
  passed: 1 test.
- `npx vitest run src/lib/trader-analytics/__tests__/end-user-product-roadmap.test.ts --reporter=dot`
  passed: 10 tests.
- `npx vitest run src/lib/user-facing-behavior src/lib/trader-analytics src/lib/user-facing-review --reporter=dot`
  passed: 38 files / 331 tests.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop`
  passed: 15 tests with the mobile-only case skipped on the desktop project.

Current best next step:

- Do not rebuild support/resistance-aware exit contracts, re-entry volume
  comparison findings, the analytics review-prompt drilldown expectation, the
  after-exit certification gate, the add-quality split, ticker stories,
  session stories, or the chart-context finding bridge.
- Continue with a new independent slice:
  - route handoffs that make the newly certified support/resistance and volume
    findings easier to act on in `/trades/[tradeId]` and `/review`,
  - strength-to-repeat ticker/session stories backed by explicit chart or
    volume evidence,
  - analytics drilldown/presentation polish that consumes the certified
    outputs already created,
  - or mobile visual regression for the routes touched by these evidence
    families.
- Keep uncertain chart, level, volume, and after-exit behavior as a review
  prompt or internal-only diagnostic until the saved evidence can prove it.

## 2026-05-10 - Certified Finding Route Handoffs

Continued the next continuous implementation run from the active plan without
creating another plan file. This pass did not rebuild the support/resistance
exit or re-entry volume detectors. It wired their certified outputs into route
handoffs so the end-user app makes the next action clearer.

Changes:

- Added `priorityMarketContextFindings` to the saved trade-thread read model so
  routes can open the most actionable certified chart, level, volume, or prompt
  finding without route-local behavior maps.
- Added explicit support/resistance exit counters to saved trade threads and
  aggregate read models:
  - `exitLevelFindingCount`,
  - `exitLevelRiskCount`,
  - `exitLevelStrengthCount`,
  - `exitLevelReviewPromptCount`,
  - thread-with-finding/risk/strength counts.
- `/trades/[tradeId]` now shows a chart-and-volume handoff for both single
  round-trip trades and multi-round-trip ticker stories when certified saved
  market-context findings exist.
- `/review` now links chart evidence queue items to the trade page's chart
  handoff anchor and removed the confusing "support panels" wording from the
  review work order.
- `/analytics`, `/coach`, `/progress`, and `/trades` now expose
  support/resistance exit counts separately from generic chart findings.
- `/analytics` adds "what to open next" handoffs for support/resistance exit
  reviews, volume comparison stories, and after-exit review stories when those
  certified read-model counts are present.
- `/trades` now has a direct support/resistance exit story filter and story
  badges so saved ticker stories can be browsed by that evidence family.
- App-feature Playwright coverage now asserts the new support/resistance exit
  copy and review work-order language.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts --reporter=dot`
  passed: 1 file / 23 tests.
- `npx vitest run src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts src/lib/user-facing-behavior/__tests__/map-user-facing-behavior.test.ts --reporter=dot`
  passed: 2 files / 86 tests.
- `npx vitest run src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts src/lib/trader-analytics/__tests__/coach-overall-focus.test.ts src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts src/lib/trader-analytics/__tests__/trader-product-polish.test.ts src/lib/user-facing-behavior/__tests__/map-user-facing-behavior.test.ts --reporter=dot`
  passed: 5 files / 112 tests.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "analytics product intelligence|coach product loop|saved trade routing|progress and behavior|guided review workflow|market context observational|banned product claims"`
  passed: 7 tests.
- `npx vitest run src/lib/user-facing-behavior src/lib/trader-analytics src/lib/user-facing-review --reporter=dot`
  passed: 38 files / 331 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop`
  passed: 15 tests, with the mobile-only case skipped on the desktop project.
- `git diff --check` passed with only existing line-ending warnings for
  `.gitignore`, `src/docs/codex-project-log.md`, and
  `src/docs/layer2-pattern-detection/layer2-implemented-pattern-catalog.md`.

Current best next step:

- Do not rebuild `priorityMarketContextFindings`, support/resistance exit
  counters, the chart handoff anchor, the `/trades` support/resistance exit
  filter, or the analytics/coach/progress support-resistance exit metric cards.
- Continue with the next independent slice:
  - profit-protection-before-later-fade behavior if the saved candle and
    after-exit evidence can certify it,
  - strength-to-repeat ticker or session stories backed by explicit execution,
    level, volume, or after-exit evidence,
  - route handoffs for session stories in `/review` or `/trades/[tradeId]` only
    where there is a clear evidence handoff,
  - mobile visual regression or overflow polish for the touched route family.

## 2026-05-10 - Protected-Profit Before Fade Certification And Handoffs

Continued the next continuous implementation run from the active plan without
creating another plan file. This pass completed the profit-protection-before-
fade slice and then wired that certified strength into the route surfaces that
already consume saved trade-thread read models.

Changes:

- Added a certified user-facing behavior contract for
  `protected_profit_before_fade`.
- Extended `build-trade-decision-review` so "Protected profit before the fade"
  appears only when:
  - realized capture clears the current capture threshold,
  - an aligned after-exit candle window exists,
  - after-exit adverse movement is larger than favorable continuation,
  - the after-exit window ends flat-to-adverse for the trade direction.
- Suppressed the older generic `exit_avoided_adverse_followthrough` card when
  the stricter protected-profit finding is available, so the user sees one
  clearer repeatable strength instead of duplicate fade language.
- Added saved trade-thread and aggregate counts:
  - `protectedProfitBeforeFadeFindingCount`,
  - `threadWithProtectedProfitBeforeFadeFindingCount`.
- Routed the count through `/analytics`, `/coach`, `/progress`,
  `/trades`, and `/trades/[tradeId]`.
- Added a `/trades` story filter for protected-before-fade stories and a
  ticker-story badge for that evidence family.
- Kept uncertain profit-protection/fade claims out of primary UI when
  after-exit candles are missing or the chart continued after the exit.

Verification:

- `npx vitest run src/lib/user-facing-behavior/__tests__/map-user-facing-behavior.test.ts src/lib/trade-analysis/review/__tests__/build-trade-decision-review.test.ts src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts --reporter=dot`
  passed: 3 files / 99 tests.
- `npx vitest run src/lib/user-facing-behavior src/lib/trader-analytics src/lib/user-facing-review --reporter=dot`
  passed: 38 files / 334 tests.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop`
  passed: 15 tests, with the mobile-only case skipped on the desktop project.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "mobile routes"`
  passed: 1 test.
- `git diff --check` passed with only existing line-ending warnings for
  `.gitignore`, `src/docs/codex-project-log.md`, and
  `src/docs/layer2-pattern-detection/layer2-implemented-pattern-catalog.md`.

Current best next step:

- Do not rebuild protected-profit-before-fade certification, the duplicate
  generic fade suppression, protected-profit saved-thread counts, or the route
  handoffs added in this pass.
- Continue with the next independent slice:
  - strength-to-repeat ticker or session stories backed by explicit execution,
    level, volume, or after-exit evidence,
  - session-story handoffs in `/review` or `/trades/[tradeId]` where a clear
    evidence action exists,
  - analytics/coach presentation polish that consumes existing certified
    read-model counts,
  - or another market-context family only if the current saved evidence can
    prove it without inference.

## 2026-05-10 - Strength-To-Repeat Session Stories And Add-Repair Copy

Continued the next continuous implementation run from the active plan. This
pass completed the first strength-to-repeat session story slice and tightened
the coaching language around adds after price moved against the trade.

Changes:

- Added `strengths_to_repeat_session` as a saved session-story kind when the
  session finished green, has certified chart/level/volume/after-exit
  strengths, and does not have higher-priority open/swing, repeated-loss, or
  profit-giveback session concerns.
- Added session-story strength counters:
  - `marketContextStrengthCount`,
  - `protectedProfitBeforeFadeFindingCount`,
  - `exitLevelStrengthCount`,
  - `volumeStrengthCount`,
  - `addQualityStrengthCount`,
  - aggregate `strengthsToRepeatSessionCount`.
- Added session-story evidence cards for strengths worth repeating, protected
  profit before a later fade, level-aware exits, volume-confirmed attempts, and
  adds that followed strength.
- Wired strength-session output through `/coach`, `/progress`, `/trades`,
  `/review`, and `/trades/[tradeId]`.
- Added a trade-detail session story handoff so an individual trade can show
  the broader trading-day story, not only its isolated execution replay.
- Updated route copy from "Protected Before Fade" and
  "protected-before-fade finding" to plainer "Protected Profit" and
  "profit-protection strength" language.
- Tightened adverse-add coaching language:
  - "Require Repair Before Adding Size" is the visible rule label.
  - Coach explanations now say execution evidence only proves size was added
    after price moved against the position.
  - The copy explicitly says this is not automatically a mistake or a bad dip
    buy; the user should check whether support held, price reclaimed, or the
    trade repaired before the add.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts --reporter=dot`
  passed: 1 file / 25 tests.
- `npx vitest run src/lib/user-facing-behavior src/lib/trader-analytics src/lib/user-facing-review --reporter=dot`
  passed: 38 files / 336 tests.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "mobile routes"`
  passed: 1 test.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop`
  passed: 15 tests, with the mobile-only case skipped on the desktop project.

Current best next step:

- Do not rebuild strength-to-repeat session story kind/counters/evidence,
  `/review` session-story handoff, `/trades/[tradeId]` session-story handoff,
  protected-profit wording, or the adverse-add repair/dip-buy copy tightening.
- Continue with the next independent slice:
  - analytics/coach presentation polish that consumes existing certified
    read-model counts,
  - another certifiable market-context behavior family only if saved chart,
    level, volume, candle, or after-exit evidence can prove it,
  - or mobile/visual polish for the touched route family.

## 2026-05-10 - Plan Architecture Audit And De-Dupe

Reviewed the active planning set from a project planner/engineer perspective:
root `plan.md`, the plan index, the next continuous implementation run, the
top-level UX plan, detection/language hardening, and the coach, analytics,
review queue, and progress feature plans.

Changes:

- Reclassified the active batch from first-pass detection hardening to
  post-hardening product presentation and evidence polish.
- Updated `plan.md` so the next-run execution plan is the immediate priority,
  while the detection/language plan remains the evidence-gating reference for
  new behavior claims.
- Marked completed slices as non-rebuild work across the plan set:
  overall coach focus, evidence-trade handoff, review-completion
  follow-through, ticker stories, session stories, chart-context bridge,
  add-quality split, after-exit certification, support/resistance exits,
  first-entry versus re-entry volume comparison, protected-profit-before-fade,
  strength-to-repeat session stories, and adverse-add repair wording.
- Updated route feature plans so the next useful work is lower-page
  coach/analytics presentation polish, mobile/visual polish, route anchor/copy
  repairs, or a new evidence family only when saved chart/level/candle/volume
  evidence proves it.
- Removed stale active-next wording that could have restarted completed
  support/resistance, volume, protected-profit, strength-session, or first
  detection inventory work.

Verification:

- Documentation consistency searches for stale active-batch wording and old
  next-slice directions were run after the edits.

Current best next step:

- Proceed from
  `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`
  using the updated Required Long-Run Batch Shape.
- Start with a quick leak/copy scan, then continue into coach/analytics
  presentation polish using certified read-model counts, visual/mobile polish,
  or a genuinely distinct evidence family only when saved evidence can prove
  it.
- Do not restart the completed detection and route-handoff slices listed
  above unless a regression is found.

## 2026-05-10 - Historical Support/Resistance Context Audit And Handoff Fix

Investigated the user concern that imported historical trades could be reviewed
with current support/resistance levels from the sibling `levels-system` app.

Findings:

- `levels-system` already has the correct historical boundary:
  `buildTradeAnalysisCandleContext(...)` accepts `asOfTimestamp`, trade bounds,
  executions, and per-timeframe cutoffs.
- `levels-system` fetches execution-time support/resistance contexts for each
  fill and has tests proving future candles are excluded.
- Trader Intelligence's modern levels-system candle path already passes
  historical trade bounds and derives `asOfTimestamp` from trade end plus the
  bounded post-trade review window when no explicit timestamp is supplied.
- Weak spot found: Trader Intelligence stored safe
  `levelsSystemExecutionRelations`, but app-facing PatternInput still read
  `executionLevelRelations` rebuilt from the broader mapped
  support/resistance snapshot.

Changes:

- Added
  `src/docs/trader-intelligence-historical-level-context-audit-2026-05-10.md`
  documenting the historical no-lookahead contract, ownership split, and
  operational notes.
- Updated `src/lib/support-resistance/levels-system-adapter.ts` with a mapper
  from levels-system execution-time relation facts to local
  `ExecutionLevelRelation` objects.
- Updated
  `src/lib/raw-trade-timeline/builders/create-raw-trade-timeline-with-levels-system-candles.ts`
  so local `executionLevelRelations` now come from
  `levelsSystemExecutionRelations`.
- Added integration coverage that local execution-level relation IDs and
  near-level booleans match the shared per-execution historical facts.
- Linked the new audit from the plan index and detection/language hardening
  plan.

Verification:

- `npx vitest run src/lib/raw-trade-timeline/__tests__/levels-system-trade-candle-context.integration.test.ts src/lib/raw-trade-timeline/__tests__/levels-system-pattern-input.integration.test.ts --reporter=dot`
  passed: 2 files / 6 tests.
- `npx tsc --noEmit --pretty false` passed.
- In `../levels-system`:
  `npx tsx --test src/tests/support-resistance-shared-api.test.ts` passed:
  28 tests.

Current best next step:

- Do not rebuild the historical level-context handoff. Treat it as a guardrail:
  all future support/resistance, candle, volume, and after-exit behavior
  families must use the levels-system historical trade-analysis context and
  saved evidence.
- Continue with the previously active next slice: coach/analytics presentation
  polish using certified read models, visual/mobile polish, route anchor/copy
  repairs, or another market-context family only when saved historical evidence
  proves it.

## 2026-05-10 - Coach And Analytics Presentation Polish

Completed a product-facing polish run focused on the user routes, not new
detection claims.

Changes:

- Added shared workflow handoff cards in `app/app-ui.tsx` and lighter shared
  metric/chart/advanced panel surfaces in `app/globals.css`.
- `/coach` now shows an explicit coaching flow below the overall focus:
  overall pattern -> evidence trade -> review queue -> progress.
- `/coach` session-plan cards now read as `Fix First`, `Repeat First`, and
  `Review Next Trade` so the page feels more like a coaching session and less
  like a card dump.
- `/analytics` chart mode is now grouped by outcome, timing, and behavior, with
  red/green/amber meaning explained and chart-to-review workflow handoffs.
- `/analytics` behavior copy now uses neutral add-review language:
  `Adds Needing Review` / `Review adds that need chart context`, because
  execution-only add evidence cannot decide whether an add was a good dip buy,
  a repaired trade, or added exposure.
- `/progress` now has a shared workflow handoff tying coach focus, review queue,
  analytics, and progress together.
- The adverse-add user-facing behavior mapper and contract inventory were
  updated so future routes do not bring back "adds after price moved against
  you" as the primary label.

Verification:

- Quick route/copy leak scan found only code constants, advanced/internal
  surfaces, or state IDs passed through plain-label mappers.
- `npx vitest run src/lib/user-facing-behavior/__tests__/map-user-facing-behavior.test.ts src/lib/trader-analytics/__tests__/coach-overall-focus.test.ts src/lib/trader-analytics/__tests__/build-trader-analytics-report.test.ts --reporter=dot`
  passed: 3 files / 79 tests.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "analytics product intelligence|coach product loop|progress and behavior|guided review workflow|banned product claims"`
  passed: 5 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable without page-level horizontal overflow"`
  passed: 1 test.

Current best next step:

- Do not rebuild the shared workflow handoff component, coach flow strip,
  analytics outcome/timing/behavior chart grouping, progress workflow handoff,
  or adverse-add primary-label cleanup.
- Continue with a browser/screenshot-guided visual refinement pass for
  `/coach`, `/analytics`, `/review`, `/progress`, and `/trades/[tradeId]`, or
  with a new market-context behavior family only if saved historical
  chart/level/volume/after-exit evidence proves it.

## 2026-05-10 - Screenshot-Guided UI Polish Pass

Completed the follow-up visual/product polish run using local Playwright
screenshots for `/coach`, `/analytics`, `/review`, `/progress`, and a saved
`/trades/[tradeId]` review workspace.

Changes:

- Lightened the shared Trader Intelligence app surfaces in `app/globals.css`
  so core dashboard cards read as slate report panels instead of near-black
  terminal panels.
- Tightened shared metric and chart components in `app/app-ui.tsx`:
  shorter KPI cards, softer chart wells, rounded red/green bars, and cleaner
  win/loss chart interiors.
- Shortened certified chart/level/volume metric copy in `/analytics`,
  `/coach`, and `/progress` so lower-page grids are less cramped.
- Replaced visible raw trade IDs in `/review` Review Flow links with plain
  `Open trade 1`, `Open trade 2`, etc., while preserving the test IDs and
  deep links.
- Replaced visible raw-looking report history labels in analytics/progress
  with `Saved report 1`, `Saved report 2`, etc.
- Tightened review/supporting copy that still looked internal, including
  workflow lane labels and hyphenated `chart-context` wording.
- Verified the trade-detail page still presents a readable review workspace
  after the shared surface changes.

Verification:

- Screenshot smoke captured:
  - `artifacts/manual-visual/coach-dev-after.png`
  - `artifacts/manual-visual/analytics-dev-after.png`
  - `artifacts/manual-visual/review-dev-after.png`
  - `artifacts/manual-visual/progress-dev-after.png`
  - `artifacts/manual-visual/trade-detail-dev-after.png`
  - mobile screenshots for coach, analytics, and review.
- Rendered-text safety scan passed for `/coach`, `/analytics`, `/review`,
  `/progress`, and the sampled `/trades/[tradeId]` route.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/saved-import-visual-overflow.spec.ts --project=chromium-mobile`
  passed: 1 test.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "analytics product intelligence|coach product loop|guided review workflow|progress and behavior|saved trade routing|banned product claims"`
  passed: 6 tests.

Current best next step:

- Do not redo the completed shared surface lightening, metric-card copy
  tightening, review-flow raw-ID cleanup, report-history label cleanup, or
  chart-context wording repair.
- Continue with either:
  - `/trades` and `/trades/[tradeId]` detail polish using the same visual
    system,
  - deeper `/coach` lower-page reduction once route-specific tests are updated
    for hidden/collapsed supporting panels,
  - or a new market-context behavior family only if saved historical evidence
    proves the claim.

## 2026-05-10 - GitHub Review Upload Prep And Browser Tooling Note

Prepared the branch for GitHub review after the screenshot-guided UI polish
pass.

Browser tooling note:

- The Browser Use skill document described a Node REPL helper command named
  `js`, but the active tool list in this Codex session did not expose a
  `node_repl` or equivalent Browser Use runtime namespace.
- Tool discovery was attempted for `node_repl js JavaScript execution` and
  `browser use node repl js`; discovery did not return a callable Node REPL
  tool. It only exposed unrelated deferred GitHub/Vercel tool groups.
- This appears to be a session/tool-runtime availability issue, not an app
  issue. The Browser Use skill instructions were present on disk, but the
  corresponding callable runtime was not registered for this session.
- Fallback used: local Playwright CLI screenshots and rendered-text checks
  against the localhost app.
- Future Codex runs should try Browser Use again when the callable tool exists,
  but Playwright CLI remains an acceptable fallback for localhost visual and
  text verification.

## 2026-05-10 - Saved Trades And Trade Detail Workflow Polish

Completed the next route-family polish run from the active plan. This run
focused on `/trades`, `/trades/[tradeId]`, and the route handoffs into those
pages. It did not add new behavior families.

Changes:

- `/trades` now has a shared saved-trade workflow panel that explains the
  review path: prioritize -> group ticker/session stories -> open the review
  workspace.
- `/trades` browse modes now show a current-view explanation and a practical
  next action, so round trips, ticker stories, session stories, open/swing
  reviews, and needs-review filters are easier for a newer trader to choose.
- `/trades` trade cards now include a `Why review this` block with a concrete
  reason and next action. The cards distinguish queue-driven priority, open or
  swing exposure, ticker-story membership, session-story membership, green
  trades, red trades, and normal execution review.
- `/trades` trade cards now open the review workspace summary instead of
  dropping directly into execution replay.
- `/trades/[tradeId]` now presents itself as a review workspace, not only a
  detail page, and includes a `Trade Review Flow` panel:
  replay executions -> compare available evidence -> write the lesson ->
  continue to the next review.
- `/trades/[tradeId]` default back navigation now returns to saved trades
  instead of analytics when the user did not arrive from coach or review.
- Trade-detail section copy was tightened from analysis/internal wording:
  `Trade Quality` -> `Execution Score Detail`,
  `Decision Autopsy` -> `Execution Decision Notes`,
  `Grade Explainability` -> `Score Explanation`,
  `Evidence Cards` -> `Supporting Evidence`,
  and `Mistake Timeline` -> `Behavior Timeline`.
- Analytics links into saved trades now use meaningful trade-detail anchors
  (`summary`, `writing-flow`, or `evidence`) instead of landing at the top of
  the page.
- Regression coverage was extended for the saved-trades workflow panel and the
  trade-detail workflow handoff.

Verification:

- Copy/leak scan for touched app routes found no primary UI hits for banned
  product claims or the old confusing phrases.
- `npx vitest run src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts src/lib/user-facing-behavior/__tests__/map-user-facing-behavior.test.ts --reporter=dot`
  passed: 2 files / 90 tests.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "saved trade routing|guided review workflow|analytics product intelligence|progress and behavior|banned product claims"`
  passed: 5 tests.
- `npx playwright test tests/e2e/saved-import-visual-overflow.spec.ts --project=chromium-mobile`
  passed: 1 test.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable without page-level horizontal overflow"`
  passed: 1 test.

Current best next step:

- Do not redo the saved-trades workflow panel, current-view browse copy,
  trade-card `Why review this` block, trade-detail review-flow handoff, or
  analytics trade-detail anchor repair.
- Next useful work is either deeper `/coach` lower-page reduction, trade-detail
  lower-section collapse/visual simplification, or another route-specific
  visual pass only when screenshots or tests show concrete defects.
- New market-context behavior families remain off-limits unless saved
  historical evidence proves the claim.

## 2026-05-10 - Coach Lower-Page Reduction And Trade Detail Support Collapse

Completed the next coach-focused presentation slice from the active plan. This
run did not add new behavior families; it used the certified read models and
route handoffs already in place.

Changes:

- `/coach` now keeps the main page focused on a clear coaching path:
  overall focus -> evidence trade -> review backlog -> ticker/session stories
  -> progress -> next-session plan.
- Added a visible `Before Next Session` panel on `/coach` with:
  - one rule to use,
  - one behavior to reduce,
  - one strength to repeat,
  - timing check,
  - short checklist,
  - one next action.
- Moved duplicate/heavier `/coach` supporting material behind one collapsed
  disclosure:
  review summary totals, behavior-impact charts, proof queue, extra evidence
  cards, rule ideas, pattern memory, score details, rule evidence checks,
  current pattern internals, review-completion detail, and confidence wording.
- Tightened featured evidence cards on `/coach` so they answer:
  `What happened`, `Why it mattered`, and `What to do next`.
- `/trades/[tradeId]` now keeps the main review workspace lighter by leaving
  replay/checklist/notes/chart/ticker/session handoffs visible while moving
  optional score explanation, supporting evidence, behavior timeline, similar
  trades, and journal prompts into a collapsed supporting-details disclosure.
- Updated Playwright coverage so tests expect the new collapsed coach and
  trade-detail support sections instead of forcing those details to be visible
  by default.

Verification:

- Copy/leak scan for `/coach`, `/trades/[tradeId]`, `/review`, `/analytics`,
  and `/progress` found no primary UI hits for banned product claims or the
  old confusing phrases. Remaining `severityScore` / `signals` hits are code
  fields inside collapsed supporting-detail rendering, not visible primary UI
  labels.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "coach product loop|guided review workflow|saved trade routing|progress and behavior|banned product claims"`
  passed: 5 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable without page-level horizontal overflow"`
  passed: 1 test.
- `npx playwright test tests/e2e/saved-import-visual-overflow.spec.ts --project=chromium-mobile`
  passed: 1 test.
- `git diff --check` passed with the existing line-ending warning for
  `src/docs/codex-project-log.md`.

Current best next step:

- Do not redo the coach lower-page collapse, coach next-session panel, coach
  evidence-card question structure, or trade-detail supporting-details
  collapse.
- Next useful work is a screenshot-guided visual/mobile polish pass for the
  newly collapsed `/coach` and `/trades/[tradeId]` surfaces, followed by
  `/analytics` lower-page polish or route copy/anchor repairs if screenshots
  show concrete defects.
- New market-context behavior families remain off-limits unless saved
  historical evidence proves the claim.

## 2026-05-10 - Screenshot-Guided Saved Trades And Analytics Lower-Page Polish

Completed the next screenshot-led presentation slice from the active plan. This
run did not add new behavior families and did not rebuild the completed coach
or trade-detail support collapse.

Screenshots captured:

- `artifacts/visual-polish-2026-05-10/`
- `artifacts/visual-polish-2026-05-10-after/`

Changes:

- `/trades` no longer renders the full saved-trade card wall at once. The trade
  list now shows 18 cards per page with previous/next controls and preserves
  the active browse mode, review lane, story filter, and active thread.
- `/trades` explains the visible card range so a trader can browse one small
  set of cards, then switch to the next page or a story filter instead of
  scrolling through hundreds of saved trades.
- `/trades` softened the `Why review this` block so the card reads more like a
  review cue and less like a heavy nested terminal panel.
- `/analytics` lower ticker-story reporting now separates the human story from
  detailed evidence counts:
  - top story counts stay visible,
  - a plain-language "How to read these stories" explanation is visible,
  - chart risks, chart strengths, and needs-review prompts are the primary
    summary,
  - detailed evidence-family counts are collapsed behind `Show chart evidence
    counts`.
- Regression coverage now checks the analytics evidence-count disclosure label
  and the saved-trade visible-card range copy.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "analytics product intelligence|saved trade routing|guided review workflow|coach product loop|progress and behavior|banned product claims"`
  passed: 6 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable without page-level horizontal overflow"`
  passed: 1 test.
- `npx playwright test tests/e2e/saved-import-visual-overflow.spec.ts --project=chromium-mobile`
  passed: 1 test.
- `git diff --check` passed with the existing line-ending warning for
  `src/docs/codex-project-log.md`.

Current best next step:

- Do not redo saved-trade pagination, the saved-trade range copy, the softened
  `Why review this` block, or the analytics ticker-story evidence-count
  collapse.
- Next useful UI/product work is either:
  - `/review` queue density and mobile tab cleanup,
  - `/progress` visual/trend follow-through once review history supports it,
  - a small route handoff/copy repair found by QA,
  - or a new market-context behavior family only when saved evidence can prove
    the claim.
- Keep uncertain market-context findings as review prompts or internal-only
  data.

## 2026-05-10 - Mobile Navigation, Review Queue, And Progress Density Polish

Completed the next route/product polish slice. This run did not add new
behavior families and did not rebuild completed coach, analytics, saved-trades,
or trade-detail structures.

Screenshots captured:

- `artifacts/review-progress-polish-2026-05-10/`

Changes:

- Shared `DashboardSideNav` now uses a collapsed `Page sections` disclosure on
  mobile instead of rendering the full desktop-style aside in the page flow.
  Desktop still keeps the sticky side menu.
- `/review` now shows queue lane tabs in a two-column mobile grid instead of a
  long one-column stack.
- `/review` now shows the first 6 queue cards in the active lane with clear
  "first batch" copy, so the page reads like a work queue instead of another
  long dashboard.
- `/progress` now keeps ticker-story progress focused on primary story counts,
  chart risks, chart strengths, and needs-review prompts.
- Detailed `/progress` chart evidence family counts remain available behind
  `Show chart evidence counts` instead of dominating the normal view.
- `/progress` workflow title was changed from an arrow-chain label to the more
  mobile-friendly `Follow the review loop`.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "guided review workflow|progress and behavior|coach product loop|analytics product intelligence|saved trade routing|banned product claims"`
  passed: 6 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable without page-level horizontal overflow"`
  passed: 1 test.
- `npx playwright test tests/e2e/saved-import-visual-overflow.spec.ts --project=chromium-mobile`
  passed: 1 test.
- `git diff --check` passed with the existing line-ending warning for
  `src/docs/codex-project-log.md`.

Current best next step:

- Do not redo the shared mobile `DashboardSideNav` collapse, `/review` queue
  first-batch limit, review mobile tab compaction, `/progress` chart evidence
  collapse, or progress workflow title cleanup.
- Next useful work is a focused `/review` or `/progress` screenshot pass only
  if new concrete issues appear, or move to another planned slice such as
  route copy/anchor repairs, import-flow trust polish, or a new
  market-context behavior family only when saved evidence can prove it.
- Keep uncertain market-context findings as review prompts or internal-only
  data.

## 2026-05-10 - Import Flow Trust Polish And Route Handoff Copy

Completed the next route/product polish slice for the import/save/repair
family. This run did not change importer contracts, persistence semantics, or
behavior detection. It focused on making the import flow understandable to a
human trader before and after saving a broker CSV.

Changes:

- Added `src/lib/trader-analytics/product/import-user-copy.ts` as the shared
  import copy layer for readable import, save, repair, direction, and chart
  review labels.
- Exported the import copy helpers through `src/lib/trader-analytics/index.ts`.
- Updated the import workflow strip into the plain three-step path:
  upload CSV -> save or repair import -> review saved trades.
- Updated `/import-dry-run` so primary UI says `Ready`, `Needs review`,
  `Chart context waiting`, `chart review items`, and `saved import store`
  instead of raw status, unavailable-data, review-job, or SQLite wording.
- Updated `/imports` and `/imports/[batchId]` so import history, recovery
  cards, batch status, saved-trade links, repair actions, and duplicate
  details use save/saved-import language instead of commit/raw-state language.
- Applied the lighter shared dashboard background and panel styling to the
  import route family so the import flow no longer returns to black
  terminal-style cards below the workflow strip.
- Added `/imports` to the core Playwright copy-safety scan and expanded the
  confusing primary-UI phrase guard to cover raw import terms:
  `ready_to_save`, `ready_to_commit`, `analysis_failed`,
  `market_context_unavailable`, `saved_sqlite`, `local sqlite`,
  `commit readiness`, and `review job`.
- Browser checks confirmed `/import-dry-run` and `/imports` have the expected
  workflow strip and no visible `ready_to`, `local SQLite`, `commit readiness`,
  or `review job` text.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "import reporting|broker CSV|banned product claims"`
  passed: 3 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "core mobile routes usable"`
  passed: 1 test.
- `npx playwright test tests/e2e/saved-import-visual-overflow.spec.ts --project=chromium-mobile`
  passed: 1 test.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "demo user path|saved trade routing|guided review workflow"`
  passed: 3 tests.
- `git diff --check` passed with the existing line-ending warning for
  `src/docs/codex-project-log.md`.

Current best next step:

- Do not redo import-flow trust polish unless QA finds a concrete regression.
- Next useful work starts with concrete user QA findings: `/coach` still has
  old black-background card sections mixed into the newer lighter dashboard
  look, and `/workspace` still uses the old dashboard style. After those visual
  migrations, continue only with focused screenshot fixes if concrete issues
  appear, or a genuinely distinct evidence family only when saved evidence can
  prove it.

## 2026-05-10 - Workspace And Coach Visual System Polish

Completed the concrete user QA slice for the dashboard surfaces that still felt
split between the old dark internal UI and the newer trader-facing report
style. This run did not add new behavior families and did not rebuild the
completed coach, analytics, review, progress, saved-trades, or trade-detail
product loops.

Screenshots captured:

- `artifacts/workspace-coach-polish-2026-05-10/`
- `artifacts/workspace-coach-polish-2026-05-10-final/`

Changes:

- `/workspace` now uses the shared lighter dashboard background and panel
  system instead of the old near-black dashboard shell.
- `/workspace` primary actions now render as one shared workflow handoff panel:
  import trades, review the next trade, open coach, and check analytics.
- `/workspace` review and coach links now land on useful anchors when possible,
  including trade-detail writing flow and the coach next-action section.
- `/workspace` latest-import copy now uses the shared import user-copy helpers,
  so primary UI says saved-import language instead of commit/SQLite language.
- The global dashboard surface now includes scoped overrides for old route-local
  near-black card classes inside `ti-dashboard-bg`. This keeps `/coach` and the
  touched dashboard route family visually aligned without changing admin/debug
  pages.
- Playwright coverage now includes `/workspace` in core user-route smoke and
  copy-safety scans.
- Added a focused regression check that `/workspace` and `/coach` do not render
  large old near-black dashboard cards in the primary route surface.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "updated dashboard surface|guided end-user path|coach product loop|banned product claims"`
  passed: 4 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "core mobile routes usable|updated dashboard surface"`
  passed: 1 test, skipped 1 desktop-only visual-surface guard.

Current best next step:

- Do not redo `/workspace` visual-system migration, `/workspace` workflow
  handoff, shared import copy on workspace, or the dashboard-scoped old-card
  visual override unless QA finds a concrete regression.
- Next useful work is route copy/anchor repair found by QA, focused screenshot
  fixes on concrete visible issues, or another market-context behavior family
  only when saved evidence can prove the claim.

## 2026-05-10 - Workspace Route Handoff And Coach Review-First Polish

Completed a focused route-copy and route-anchor polish slice after QA found two
concrete user-facing issues: the workspace still promoted secondary review
tools too strongly, and the coach could label a profitable evidence set as a
`Fix first` action.

Changes:

- `/workspace` App Areas now promote the core loop first: saved trades,
  analytics report, review queue, progress, coach, import, and import history.
- Secondary tools such as session recap, compare trades, and onboarding are now
  collapsed under `More review tools` instead of competing with the core
  workflow.
- The `/workspace` `Review next trade` workflow action now links to the actual
  next trade-review anchor when available, instead of sending every user to the
  generic saved-trades page.
- The coach overall-focus read model now separates negative, positive, and
  neutral evidence:
  - negative evidence uses `Fix first`,
  - positive evidence uses `Review first`,
  - neutral or uncertain evidence uses `Rule to test`.
- `/coach` now consumes that certified focus label/detail/tone so profitable
  evidence is not presented as a confident problem to fix.
- The coach session step copy now adapts between creating a fix-first rule and
  testing whether a positive behavior is worth repeating.
- Focused tests now cover the profitable-evidence case so a positive evidence
  set does not regress back into `Fix first` language.
- Playwright now checks that the workspace review action lands on a real review
  anchor and that secondary app-area links are not visible in the primary
  workspace route area.

Screenshots captured:

- `artifacts/route-polish-2026-05-10/`
- `artifacts/route-polish-2026-05-10-after/`

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/coach-overall-focus.test.ts --reporter=dot`
  passed: 10 tests.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "updated dashboard surface|coach product loop|guided end-user path|banned product claims"`
  passed: 4 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "core mobile routes usable"`
  passed: 1 test.
- `git diff --check` passed with the existing line-ending warning for
  `src/docs/codex-project-log.md`.

Current best next step:

- Do not redo the workspace core app-area demotion, workspace next-review
  anchor, or coach positive-evidence `Review first` split unless QA finds a
  concrete regression.
- Next useful work is another concrete route handoff/copy repair found by QA,
  focused screenshot fixes only when a visible issue is captured, or a new
  market-context behavior family only when saved evidence can prove it without
  inference.

## 2026-05-10 - Route Screenshot QA And Trade Label Copy Polish

Continued the concrete route QA pass after opening `/workspace` for browser
review. This slice did not add a new behavior family. It fixed visible route
copy and display issues found from screenshots.

Screenshots captured:

- `artifacts/route-qa-2026-05-10-next/`
- `artifacts/route-qa-2026-05-10-next-after/`
- `artifacts/trade-detail-qa-2026-05-10-next/`
- `artifacts/trade-detail-qa-2026-05-10-symbol-after/`

Changes:

- `/workspace` now uses `Trade review workflow` instead of arrow-chain copy,
  and its chart-context metric says `Chart Context Waiting` with clearer open
  trade wording.
- `/workspace` beta/admin details are collapsed under `Beta storage and admin
  notes`; the old primary `Current Beta Boundary` and `Internal tools` labels
  no longer appear in the normal page body.
- Added shared trade display copy in
  `src/lib/trader-analytics/product/trade-display-copy.ts`.
- Coach, trade detail, and saved session-story evidence now use
  `userFacingTradeSymbol(...)` so import-ID-like values such as `V516374MD`
  do not appear as if they were real ticker symbols in primary UI.
- Real ticker-looking values remain visible, including normal uppercase
  tickers and class-style symbols such as `BRK.A`.
- Playwright copy safety now guards against ID-like trade labels appearing in
  core product routes.
- Workspace regression coverage now checks that the secondary review tools
  stay collapsed and the old beta/internal labels do not return.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/trade-display-copy.test.ts src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts src/lib/trader-analytics/__tests__/coach-overall-focus.test.ts --reporter=dot`
  passed: 37 tests.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "updated dashboard surface|coach product loop|guided end-user path|banned product claims"`
  passed: 4 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "core mobile routes usable"`
  passed: 1 test.

Current best next step:

- Do not redo the workspace beta-note collapse, workspace workflow title copy,
  or shared user-facing trade-symbol helper unless QA finds a concrete
  regression.
- Next useful work remains concrete screenshot/route QA: inspect a specific
  route, fix the visible copy/layout/handoff issue, verify it, and only add a
  new market-context family if saved evidence can prove the claim.

## 2026-05-10 - Analytics Behavior Report Grouping

Completed an analytics product presentation slice in response to the request to
surface support/resistance, dip/add, profit-protection, and risk-management
behaviors as grouped trader-facing report sections.

Changes:

- Added `src/lib/trader-analytics/server/analytics-behavior-report.ts`, a
  certified read-model presentation layer that groups existing saved
  market-context findings without creating route-local detections.
- `/analytics` now shows a `Behavior Report` section above ticker/session
  story analytics.
- The behavior report groups findings into:
  - Entries Near Resistance,
  - Support-Based Entries,
  - Chase And Extension Review,
  - Dip-Buy And Add Review,
  - Profit Protection,
  - Profit Taking Near Levels,
  - Volume And Re-Entries.
- The resistance-entry group uses trader-facing language:
  "Entry was close to resistance and the trade finished red. Review whether
  there was enough room before overhead resistance."
- Dip-buy/add language stays evidence-gated: execution-only adverse adds do
  not become a bad dip-buy conclusion unless chart context proves support,
  repair, or weakness.
- Browser smoke caught and fixed a grouping mismatch where `Entry had little
  nearby support` appeared inside the resistance group; it now belongs under
  Support-Based Entries.
- Playwright analytics coverage now asserts the new behavior report and group
  labels are visible.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/analytics-behavior-report.test.ts src/lib/user-facing-behavior/__tests__/map-user-facing-behavior.test.ts --reporter=dot`
  passed: 66 tests.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Browser smoke opened `http://localhost:3000/analytics` and confirmed all
  seven behavior-report groups render.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --grep "analytics product intelligence surfaces" --project=chromium-desktop`
  passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --grep "core mobile routes usable" --project=chromium-mobile`
  passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --grep "banned product claims" --project=chromium-desktop`
  passed.
- `git diff --check` passed with the existing line-ending warning for
  `src/docs/codex-project-log.md`.

Current best next step:

- Do not rebuild the analytics behavior report, its grouping model, or the
  new `/analytics` group cards unless QA finds a concrete regression.
- Next useful work is route-specific visual/copy QA on another surface, or a
  new market-context behavior family only if saved evidence can prove it.

## 2026-05-10 - Coach Behavior Map From Analytics Report

Extended the analytics behavior-report grouping into `/coach` so the same
certified market-context groups now support coaching order instead of living
only inside analytics.

Changes:

- Added shared `app/behavior-report-panel.tsx` so analytics and coach consume
  the same grouped behavior report presentation instead of route-local copies.
- `/coach` now builds `buildAnalyticsBehaviorReport(...)` from the saved
  trade-thread read model and renders a `Behavior Coaching Map`.
- The coach version turns the groups into:
  - `Fix first` for certified risks,
  - `Repeat first` for certified strengths,
  - `Needs review` for prompt-only/uncertain chart behavior.
- `/coach` side navigation now includes `Behavior Map`.
- Analytics continues to render the same `Behavior Report`, now through the
  shared component.
- Playwright coach coverage now asserts the behavior map, fix/repeat framing,
  resistance-entry group, and dip-buy/add review group are visible.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/analytics-behavior-report.test.ts --reporter=dot`
  passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --grep "coach product loop|analytics product intelligence" --project=chromium-desktop`
  passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --grep "banned product claims" --project=chromium-desktop`
  passed.
- Browser smoke opened `http://localhost:3000/coach` and confirmed the
  `Behavior Coaching Map`, `Fix first`, `Repeat first`, `Entries Near
  Resistance`, and `Dip-Buy And Add Review` render with no console errors.
- `git diff --check` passed with the existing line-ending warning for
  `src/docs/codex-project-log.md`.

Current best next step:

- User QA after this pass correctly identified that the `/coach` presentation
  looks too much like the `/analytics` report. Treat the shared report as a
  certified evidence source only, not the final coach UX.
- Do not rebuild the analytics behavior report data grouping unless QA finds a
  concrete regression.
- This coach follow-up was completed on 2026-05-11: `/coach` now turns the
  shared report into a guided behavior sequence while analytics keeps the broad
  grouped report.

## 2026-05-11 - Product Clarity Pass From May 11 Suggestions

Completed the May 11 product pass from `src/docs/suggestions-for-codex.md`
without adding new detections. The work keeps `buildAnalyticsBehaviorReport(...)`
as the certified evidence source while making the default routes feel less like
raw analytics output.

Changes:

- Added `/coach` `Behavior Coaching Sequence`, a coach-specific guided flow
  that selects top risk, top strength, and top review prompt from the certified
  analytics behavior report, then links evidence trades into
  `/trades/[tradeId]#writing-flow`.
- Kept the old coach behavior report available only inside supporting details;
  `/analytics` remains the broad grouped report surface.
- Added shared sell-starting copy helpers so short/sell-starting items say
  `Limited sell-side review` and explain that full short-trade coaching is not
  supported yet.
- Simplified `/review` queue cards around `Why it is here`, `Do this now`, and
  `Evidence status`, with technical evidence counts collapsed.
- Tightened `/trades/[tradeId]` top workflow copy to `Replay, decide, write,
  then continue`, with steps `2. Decide` and `3. Write`.
- Simplified `/workspace` next-step language and changed active waiting-chart
  labels to `Chart data still missing`.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/trade-display-copy.test.ts --reporter=dot`
  passed.
- `npx vitest run src/lib/trader-analytics/__tests__/analytics-behavior-report.test.ts src/lib/trader-analytics/__tests__/trade-display-copy.test.ts --reporter=dot`
  passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "coach product loop|analytics product intelligence|guided review workflow|saved trade routing|progress and behavior|banned product claims|market context observational|updated dashboard surface"`
  passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable"`
  passed.
- Browser smoke against `http://127.0.0.1:3100` confirmed `/coach`,
  `/review`, `/workspace`, and a real `/trades/[tradeId]#writing-flow` route
  show the updated copy with no console errors; `/review` evidence details are
  collapsed by default.

Current best next step:

- Do not rebuild the coach behavior sequence, analytics behavior report, shared
  sell-starting limitation copy, review queue task-card simplification,
  chart-data wording, or trade-detail replay/decide/write flow unless QA finds
  a concrete regression.
- Continue with the next independent product slice: route copy/anchor repairs
  found by QA, screenshot-guided fixes if a visible issue appears, or a new
  market-context behavior family only when saved evidence can certify it.

## 2026-05-11 - Route Copy And Anchor QA Completion

Completed the follow-on route identity/copy/anchor QA pass from the May 11
plan. This was a UI/product contract pass only; it did not add new behavior
detections or new coaching claims.

Changes:

- Replaced the remaining user-visible `Chart context waiting` family of copy
  with `Chart data still missing` / `Chart Data Review` language across shared
  import status copy, saved review queue state, workspace, review, coach,
  trades, trade detail, import dry-run, import detail, and analytics.
- Tightened `/trades` chart-data filters and metric copy so saved-trade browsing
  says `Needs Chart Data` instead of chart-context-waiting language.
- Anchored remaining coach progress handoffs to
  `/progress#progress-follow-through`.
- Updated Playwright guards so the stale `chart context waiting` phrase is now
  banned from core product route copy.
- Updated import dry-run and saved-import API expectations to match the new
  chart-data language.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/saved-import-api-routes.test.ts src/lib/trader-analytics/__tests__/saved-import-coaching-language-qa-matrix.test.ts src/lib/trader-analytics/__tests__/trade-display-copy.test.ts --testTimeout=30000`
  passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Browser smoke against `http://127.0.0.1:3100` checked `/workspace`,
  `/trades`, `/review`, `/coach`, `/analytics`, `/import-dry-run`, `/imports`,
  one real `/imports/[batchId]`, and one real `/trades/[tradeId]`; no stale
  chart-context-waiting/status headings or console errors were found.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts tests/e2e/import-dry-run.spec.ts --project=chromium-desktop --grep "keeps workspace and coach|shows the coach product loop|shows saved trade routing|shows the guided review workflow|keeps market context observational|keeps banned product claims|shows unavailable daily/4h market context"`
  passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile --grep "keeps core mobile routes usable without page-level horizontal overflow|keeps banned product claims"`
  passed with the desktop-only banned-copy test skipped on mobile as expected.

Current best next step:

- Do not rebuild the route copy/anchor repairs, chart-data terminology pass,
  coach progress anchors, May 11 coach sequence, review queue simplification,
  sell-starting limitation copy, or trade-detail replay loop unless QA finds a
  concrete regression.
- If the next run continues product QA, use screenshot-guided route fixes only
  when a real visual issue appears.
- If route QA stays clean, the next evidence-family candidate is positive
  full-trade management storylines. Start by inspecting the Layer 2 catalog and
  behavior audit around balanced/constructive management, then implement only a
  deterministic certified slice.

## 2026-05-12 - Positive Constructive Management Storyline Slice

Completed the first two deterministic positive constructive-management
storylines without adding new detectors. The implementation reuses existing
certified Layer 2 patterns and routes them through the product-safe behavior
contract layer.

Changes:

- Added a decision-review insight for
  `balanced_management_with_constructive_exit` when the saved evidence already
  shows positive capture plus measured after-exit fade evidence.
- Added a decision-review insight for
  `add_into_strength_with_constructive_final_exit` and its recovery/timely
  protection variants when the saved evidence already shows constructive add
  location, controlled giveback, positive capture, and measured after-exit fade
  evidence.
- Added a user-facing behavior contract for `Managed the full trade
  constructively` with `combined` evidence, `strength_to_repeat` framing, and
  guards against perfect-exit, top-tick, buy-signal, and sell-signal claims.
- Added a user-facing behavior contract for `Added into strength and exited
  constructively` with the same copy-safety guardrails.
- Added a `Full-Trade Management` analytics behavior-report group so the
  existing analytics/coach behavior-report pipeline can surface both
  constructive management stories.
- Updated saved trade threads so the full-trade management finding becomes a
  chart-backed, repeatable strength and can appear in the post-exit evidence
  card when present.

Verification:

- `npx vitest run src/lib/user-facing-behavior/__tests__/map-user-facing-behavior.test.ts src/lib/trade-analysis/review/__tests__/build-trade-decision-review.test.ts src/lib/trader-analytics/__tests__/analytics-behavior-report.test.ts src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts --testTimeout=30000`
  passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts -g "shows the analytics product intelligence surfaces|keeps core mobile routes usable without page-level horizontal overflow|keeps banned product claims out of core product routes" --project=chromium-desktop --project=chromium-mobile --timeout=120000`
  passed with the expected mobile/desktop skips.
- `npm run lint -- src/lib/trade-analysis/review/build-trade-decision-review.ts src/lib/trade-analysis/review/__tests__/build-trade-decision-review.test.ts src/lib/user-facing-behavior/registry/user-facing-behavior-registry.ts src/lib/user-facing-behavior/__tests__/map-user-facing-behavior.test.ts src/lib/trader-analytics/server/analytics-behavior-report.ts src/lib/trader-analytics/server/saved-trade-threads.ts src/lib/trader-analytics/__tests__/analytics-behavior-report.test.ts src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts`
  passed.
- `git diff --check` passed with the existing line-ending warning for
  `src/docs/codex-project-log.md`.

Current best next step:

- Do not rebuild the balanced-management or add-into-strength constructive-exit
  storylines unless QA finds a concrete regression.
- Next safe behavior-family work is to inspect only genuinely distinct
  constructive-management variants that can map through deterministic saved
  evidence without creating broader claims. Keep them internal if their
  evidence is not deterministic.
- If no behavior slice is clear, return to screenshot-guided route fixes only
  when a concrete visual issue appears.

## 2026-05-12 - Planning Docs De-Dupe Cleanup Before GitHub Upload

Updated the active and semi-active planning docs so future runs do not restart
completed coach, route-copy, chart-data wording, balanced-management, or
add-into-strength constructive-management work.

Changes:

- Updated `behavior-coverage-audit.md` so the highest-value target is now
  genuinely distinct constructive-management coverage beyond the completed
  balanced/add-into-strength product mappings.
- Replaced stale planning guidance that still recommended visible
  `chart context waiting` wording with `Chart data still missing` in active
  guardrail and route-planning docs.
- Changed stale "next coach run" and route-anchor wording so completed May 11
  coach sequence, route copy/anchor QA, and chart-data terminology work are
  preserved unless QA finds a concrete regression.

Current best next step:

- Continue only with screenshot-guided route fixes when a concrete issue
  appears, or with a genuinely distinct evidence family that saved evidence can
  certify. Do not redo the completed May 11 product pass or the May 12
  constructive-management mappings.

## 2026-05-12 - Beginner-To-Advanced Import IA And Analytics Category Access

Continued from the refreshed `src/docs/suggestions-for-codex.md` product
direction after pulling the latest branch updates. This was a route hierarchy
and copy-safety pass, not a new behavior-detection pass.

Changes:

- `/imports` now keeps the beginner path focused on saved imports, active
  recovery work, unresolved repairs, and where to go next after saving.
  Mapping confidence, quality score breakdowns, write safety, cost policy,
  execution basis, column mapping, repair workflow, and trade reconstruction
  preview are still available behind `Advanced import details`.
- `/imports/[batchId]` no longer shows the batch ID, chart-review counts,
  technical buckets, or duplicate internals in the primary header/default path.
  The default path now leads with import state, next action, saved trades,
  repair actions, import decisions, and review links that land on
  `#writing-flow`; the technical import and chart-review data moved behind
  `Advanced import and chart details`.
- Duplicate import copy now says the import looks like a duplicate saved
  import instead of exposing fingerprint language by default.
- Import-route trade-direction copy now uses `Limited sell-side review` for
  sell-starting/short-side imports, matching the completed trade-detail copy.
- `/analytics` now has explicit category access for Results, Timing, Behavior,
  Ticker Stories, Session Stories, and Chart Evidence while preserving the
  richer report sections.
- Regression coverage now opens the relevant advanced disclosures before
  asserting advanced policy/technical panels, so future tests preserve the
  beginner-first default instead of forcing advanced details into primary UI.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npx vitest run src/lib/trader-analytics/__tests__/trade-display-copy.test.ts src/lib/trader-analytics/__tests__/saved-import-api-routes.test.ts src/lib/trader-analytics/__tests__/saved-import-coaching-language-qa-matrix.test.ts --reporter=dot --testTimeout=30000`
  passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts tests/e2e/import-dry-run.spec.ts tests/e2e/saved-import-visual-overflow.spec.ts --project=chromium-desktop --grep "keeps import reporting surfaces|shows the analytics product intelligence|walks the guided end-user path|keeps banned product claims|saves a generic CSV import|keeps saved-import routes readable"`
  passed after updating the stale coach-support test expectation and rerunning
  the affected import-save path.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile --grep "keeps core mobile routes usable" --timeout=120000`
  passed. The first combined mobile run timed out loading `/imports` under
  parallel load while the saved-import mobile route check passed; the single
  rerun completed in 32.8s.
- `npx playwright test tests/e2e/saved-import-visual-overflow.spec.ts --project=chromium-mobile --grep "keeps saved-import routes readable"`
  passed as part of the combined mobile run.
- `git diff --check` passed.

Current best next step:

- Do not redo this import IA disclosure pass, analytics category-access pass,
  May 11 coach/review/trade-detail work, route copy/anchor QA, or the May 12
  constructive-management storylines unless QA finds a concrete regression.
- Continue the beginner-to-advanced product flow with screenshot-guided fixes
  only when a route proves a real issue. The likely next UI candidates are
  `/import-dry-run` advanced-detail demotion, `/progress` follow-through
  clarity, or any concrete workspace/dashboard handoff issue found in browser
  QA.

## 2026-05-12 - Import Polish And Chart Wording Consistency

Completed the focused post-review polish pass from the latest ChatGPT prompt.
This was copy, hierarchy, and test coverage work only; no behavior detection or
evidence-gating logic was rebuilt.

Changes:

- `/imports/[batchId]` now uses `Saved Import` or `Import Details` as the
  primary route title instead of `Import Batch`; batch ID remains available only
  inside advanced import/chart details.
- `/imports` now labels the recovery area `Imports To Finish` with friendlier
  supporting copy while preserving repair, duplicate review, acknowledgement,
  and save-continuation logic.
- `/import-dry-run` now keeps P/L/cost details plus broker mapping/calibration
  details behind advanced disclosures, so mapping confidence and cost-policy
  detail are accessible without living in the beginner path.
- Primary route copy now uses chart data/evidence wording instead of chart
  context wording across analytics, coach, review, saved review summaries,
  trade detail, import dry run, and shared user-facing behavior labels.
- Analytics import-trial access inside advanced details is explicitly marked
  internal, preserving the admin/QA boundary without deleting the route.
- Playwright copy-safety now bans visible `chart context` on core product
  routes, while internal IDs remain unchanged.

Verification:

- `npx vitest run src/lib/user-facing-behavior/__tests__/map-user-facing-behavior.test.ts src/lib/trader-analytics/__tests__/build-trader-analytics-report.test.ts src/lib/trader-analytics/__tests__/coach-overall-focus.test.ts src/lib/trader-analytics/__tests__/analytics-behavior-report.test.ts src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts --reporter=dot --testTimeout=30000`
  passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Focused desktop Playwright for import dry run, saved import routes, saved
  trade routing, analytics, review, coach, progress, banned product claims, and
  market-context observational coverage passed.
- Focused mobile Playwright for core routes and saved-import route readability
  passed.

Current best next step:

- Do not redo the May 12 import IA pass, this import wording/advanced-detail
  polish, analytics category access, May 11 coach/review/trade-detail work, or
  the constructive-management storylines unless QA finds a concrete regression.
- Next safe UI candidates are `/progress` follow-through clarity or concrete
  screenshot/browser issues found on `/workspace`, `/analytics`, `/trades`, or
  saved-trade handoffs. Only move into new behavior work if saved evidence can
  certify a genuinely distinct deterministic claim.

## 2026-05-12 - Final PR Screenshot And Copy QA

Completed the PR #9 follow-up review pass from GitHub comment `4431532125`.
This was a screenshot/copy consistency pass only; it preserved the completed
route IA, detection layer, behavior mapper, coach sequence, analytics category
access, and import disclosure work.

Changes:

- Ran screenshot/DOM QA over `/workspace`, `/import-dry-run`, `/imports`,
  `/imports/[batchId]`, `/trades`, `/trades/[tradeId]`, `/review`,
  `/analytics`, `/coach`, and `/progress` with a seeded saved import/trade.
- The only concrete UI issue found was `/import-dry-run` still showing mapping
  confidence and `Copy Audit` in the primary summary cards.
- Replaced those primary cards with beginner-facing `Rows To Fix` and
  `Import Check` cards.
- Kept mapping confidence, broker mapping, calibration, P/L, and cost policy
  available behind advanced disclosures.
- Renamed the advanced disclosure summaries to `Show advanced P/L and cost
  details` and `Show technical import setup details`.
- Extended import dry-run Playwright coverage so mapping confidence and copy
  audit stay hidden from the default path while mapping confidence remains
  visible after opening technical import setup details.
- Updated stale import-route test expectations that still asserted raw
  statuses or old trade-window wording instead of the current user-facing copy.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Screenshot QA against the updated production bundle confirmed the
  `/import-dry-run` primary summary now shows `Rows To Fix` and `Import Check`
  with no visible mapping score or copy-audit card.
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop --timeout=150000`
  passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop --grep "guided end-user path|workspace and coach|analytics product intelligence|coach product loop|guided review workflow|saved trade routing|progress and behavior|banned product claims|market context observational" --timeout=150000`
  passed.
- `npx playwright test tests/e2e/saved-import-visual-overflow.spec.ts --project=chromium-desktop --timeout=150000`
  passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile --grep "keeps core mobile routes usable|mobile usability" --timeout=150000`
  passed.

Current best next step:

- No known concrete route issue remains from the PR screenshot/copy QA pass.
- Do not redo the May 12 import IA pass, import wording/advanced-detail polish,
  final import summary-card fix, analytics category access, May 11
  coach/review/trade-detail work, or constructive-management storylines unless
  new screenshots/tests reveal a real regression.

## 2026-05-12 - Normalized Analytics Conclusions Plan Added

User flagged an important analytics interpretation issue: raw total P/L by
session can be true but misleading when one large trade dominates a smaller
bucket. Created a dedicated feature plan so future analytics and coaching work
does not turn total-dollar rankings into overconfident "best/worst time"
claims.

New plan:

- `src/docs/trader-intelligence-normalized-analytics-conclusions-plan-2026-05-12.md`

Current best next step:

- When analytics work resumes, use this plan to add bucket-level normalized
  context such as average P/L, median P/L, win rate, sample-size labels, largest
  trade impact, and outlier-dominated wording before changing coach/review
  conclusions. Keep the current total P/L charts, but make broad feedback more
  careful and evidence-aware.

## 2026-05-12 - Normalized Timing Analytics Read Model And UI Slice

Started the normalized analytics conclusions plan after user QA raised the
raw-total P/L interpretation risk.

Changes:

- Time-of-day buckets now expose median P/L, absolute P/L movement, largest
  winner, largest loser, largest absolute driver trade, outlier share,
  sample-size label, and a normalized conclusion kind.
- Timing conclusions now distinguish insufficient samples,
  outlier-dominated totals, consistent weakness, consistent strength, and mixed
  evidence.
- Session-time insight copy no longer calls total-dollar buckets `Best entry
session` or `Weakest entry session`; it uses highest/lowest total-result
  language with sample-size, median, win-rate, and outlier caveats.
- `/analytics` now labels the chart `Total P/L by Session`, shows average and
  median in timing cards, and adds an `Outlier Check` in the timing panel.
- The normalized analytics plan and plan index were tightened so future work
  uses `abs(largestTradePnl) / sum(abs(eachTradePnl))`, requires driver trade
  references, and avoids turning statistical observations into trade advice.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/build-trader-analytics-report.test.ts src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts src/lib/trader-analytics/__tests__/coaching-language-readiness.test.ts --reporter=dot --testTimeout=30000`
  passed.
- `npx tsc --noEmit --pretty false` passed.
- `npx vitest run src/lib/trader-analytics/__tests__/trader-improvement-intelligence.test.ts src/lib/trader-analytics/__tests__/end-user-product-intelligence.test.ts src/lib/trader-analytics/__tests__/build-trader-analytics-report.test.ts --reporter=dot --testTimeout=30000`
  passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "analytics product intelligence|coach product loop|guided review workflow|progress and behavior|banned product claims" --timeout=150000`
  passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable|mobile usability" --timeout=150000`
  passed.

Current best next step:

- Continue the normalized analytics plan with driver-trade handoffs from timing
  conclusions into `/analytics`, `/coach`, and `/review`, then add progress
  follow-through only when review data can prove the timing issue was actually
  reviewed.

## 2026-05-12 - Beginner-First Import Dry Run Start

User walked the app like a new trader and flagged `/import-dry-run` as still
feeling too much like an import/admin QA dashboard. Simplified the default
journey so the first screen is upload/check/save oriented while preserving the
advanced evidence and operator details behind disclosures.

Changes:

- `/workspace` now describes the import step as uploading a broker CSV, letting
  the app check it, and saving clean trades for review.
- `/import-dry-run` now starts with `Upload Your CSV`, beginner upload copy,
  a local CSV picker, and the large raw CSV textarea collapsed behind
  `Paste CSV instead or view parsed text`.
- Added a simple `What happens after upload` section: app checks rows, save
  import, then review trades.
- Row repair and column mapping are only promoted in the beginner path when the
  import actually has rejected rows or a blocked confidence gate.
- Import session summary, execution readiness, grouping review, walkthrough,
  evidence drill-in, feedback preview, replay preview, P/L/cost detail,
  prototype analysis, readiness scoring, repair carry-forward, confidence gate,
  session state, technical diagnostics, broker mapping/calibration, privacy,
  decision capture, and QA notes remain available behind advanced disclosures.
- Updated Playwright coverage so tests follow the new disclosure model instead
  of expecting advanced import panels or analytics trade filters on the first
  screen.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-first-user-hardening.spec.ts --project=chromium-desktop -g "guides a first user|keeps core controls accessible|handles abusive CSV" --timeout=150000`
  passed.
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop -g "renders the required product panels|captures screenshot-ready visual smoke" --timeout=150000`
  passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "parses representative broker CSV files|guided end-user path|core mobile routes|keeps banned product claims" --timeout=150000`
  passed with the mobile-only case skipped on the desktop project.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable" --timeout=150000`
  passed.

Current best next step:

- Do not rebuild the beginner-to-advanced import IA or re-expose the dry-run
  QA console as the default import page. If import work continues, focus on the
  real save/repair handoff clarity: after a clean upload, the user should be
  sent naturally into saved trades or the first trade review; if rows need
  attention, only the needed repair fields should become prominent.
- Separately, continue the normalized analytics conclusions plan with
  driver-trade handoffs only after the import flow remains stable.

## 2026-05-12 - Import Auto-Detect And Demo/Admin Demotion

User questioned whether a trader should have to pick a broker, why `Try a
sample` was visible, and whether timezone should be a default responsibility.
The answer is that the app should detect the broker from CSV headers when it
can, keep samples as demo/admin fixtures, and treat timezone as an advanced
correction only when CSV timestamps lack timezone information.

Changes:

- `/import-dry-run` now defaults to no sample data and broker `auto` instead of
  preloading the IBKR sample.
- The default upload card shows a CSV picker; the broker selector is no longer
  part of the beginner path.
- Broker override and CSV timezone moved behind `Show advanced import
settings`, with copy that tells users to leave them alone unless the app
  asks for help.
- Sample fixtures moved behind `Show demo/admin sample files`; they remain
  available for product QA without looking like a normal trader action.
- Uploading a real local CSV resets the broker mode back to `auto` so the app
  attempts detection from the actual file.
- Focused Playwright helpers were updated to open advanced/demo controls only
  when tests intentionally need them.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop -g "renders the required product panels|captures screenshot-ready visual smoke" --timeout=150000`
  passed.
- `npx playwright test tests/e2e/app-first-user-hardening.spec.ts --project=chromium-desktop -g "guides a first user|keeps core controls accessible|handles abusive CSV" --timeout=150000`
  passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "parses representative broker CSV files|guided end-user path|core mobile routes|keeps banned product claims" --timeout=150000`
  passed with the mobile-only case skipped on desktop.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable" --timeout=150000`
  passed.

Current best next step:

- Keep import defaults automatic. Do not reintroduce sample files, broker
  selection, or timezone as first-screen trader responsibilities.
- A future import hardening slice can improve confidence messaging when broker
  auto-detection falls back to the generic mapper, but that should still be an
  app-led repair prompt rather than a required pre-upload choice.

## 2026-05-12 - Minimal CSV Upload Start Page

User reviewed the `/import-dry-run` first screen again and correctly flagged
the visible broker-detection explanation as unnecessary end-user copy. Created
a fresh minimal upload route and moved the normal import entry point there,
while keeping `/import-dry-run` available as the advanced/import QA surface.

Changes:

- Removed the visible broker auto-detect notice from `/import-dry-run`.
- Replaced the `/import-dry-run` first status tile with a plain `File` tile.
- Added `/upload-csv`, a one-card route with only a CSV file input and submit
  button before any status message appears.
- The `/upload-csv` submit path reads the selected CSV, sends it through the
  existing import preview API with broker `auto`, commits clean imports, and
  redirects to the saved import detail route. Imports that need repair/review
  redirect to their import detail page instead of exposing the advanced dry-run
  UI first.
- Updated `/workspace` and `/first-run` so the normal start action goes to
  `/upload-csv`. `/import-dry-run` remains available for advanced testing,
  repair, and QA.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop -g "renders the required product panels|captures screenshot-ready visual smoke" --timeout=150000`
  passed.
- `npx playwright test tests/e2e/app-first-user-hardening.spec.ts --project=chromium-desktop -g "guides a first user|keeps core controls accessible|handles abusive CSV" --timeout=150000`
  passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "loads the main end-user routes|guided end-user path|completes the demo user path|keeps banned product claims" --timeout=150000`
  passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable" --timeout=150000`
  passed.

Current best next step:

- Treat `/upload-csv` as the end-user first import page and `/import-dry-run`
  as the advanced/import QA page. The next import UX work should make the
  post-upload redirect feel natural after save or repair, not add more controls
  to the upload card.

## 2026-05-12 - Upload Result Alert And Skipped-Row Demotion

User tested the new `/upload-csv` route with the April CSV and correctly liked
the duplicate detection, but the immediate redirect into import details felt too
abrupt. The import detail page also showed repeated `Non-execution row skipped`
items as if the end user needed to resolve them, even though the app had already
handled those rows safely.

Changes:

- Updated `/upload-csv` so submit stays on the upload page and shows a clear
  result card after the app checks the CSV.
- Clean imports show a saved-import alert with an `Open saved import` action.
- Duplicate or repair/review cases show a needs-attention alert with an import
  details action, rather than surprise-redirecting.
- Updated `/imports/[batchId]` so default repair actions only show actionable
  open/fix-required items.
- Automatically handled informational row notes, including skipped non-execution
  rows, stay available behind `Advanced import and chart details` as traceability
  instead of default trader work.
- Updated the guided end-user Playwright path to expect the upload result alert
  before opening import details.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/saved-import-visual-overflow.spec.ts --project=chromium-desktop --timeout=150000`
  passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "completes the demo user path|guided end-user path|loads the main end-user routes" --timeout=150000`
  passed.
- `npx playwright test tests/e2e/app-first-user-hardening.spec.ts --project=chromium-desktop -g "guides a first user|keeps no-trades empty state" --timeout=150000`
  passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable" --timeout=150000`
  passed.
- `git diff --check` passed with existing CRLF warnings in docs/import tests.

Current best next step:

- Reset the local demo SQLite store after verification when the user wants a
  fresh manual upload test. Continue treating `/upload-csv` as the beginner
  start and `/import-dry-run` as the advanced/QA import surface.

## 2026-05-12 - Workspace Empty-State No Longer Looks Like Imported Data

User noticed the clean workspace could show `ABCD`/`EFGH` sample trades after
reset and reasonably worried the IBKR CSV upload had produced fake data. Local
inspection showed the live SQLite/API state was empty (`trades=0`,
`imports=0`) and the private IBKR artifact file was intact:
`artifacts/real-csv-calibration/private/U21845737_202604_202604.csv` parses as
IBKR with 574 accepted executions, 207 grouped trade requests, and 79 unique
symbols, with no `ABCD` or `EFGH`.

Changes:

- Updated `/workspace` so an empty local account shows `No saved import yet`
  and `0` saved trades instead of counting sample fallback trades.
- Empty workspace metric cards and primary actions now link to `/upload-csv`,
  not `/import-dry-run` or sample-backed trade/review routes.
- Verified the rendered `/workspace` HTML includes the empty-state copy and no
  longer includes `ABCD`, `EFGH`, or the sample fallback label.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `git diff --check` passed with existing CRLF warnings in docs/import tests.

Current best next step:

- Retry the private IBKR CSV through `/upload-csv`. If the upload succeeds, the
  saved workspace should switch from empty state to the real imported symbols
  and counts. If it does not, inspect the upload result alert before changing
  import parsing logic.

## 2026-05-12 - Coach Empty-State Matches Workspace

User noticed `/workspace` showed no trades after reset while `/coach` still
showed `ABCD`/`EFGH` sample coaching trades. Live API state was empty
(`trades=0`, `imports=0`), so this was not a reset or cache problem; `/coach`
was still using sample fallback content as the default empty state.

Changes:

- Updated `/coach` so the normal end-user route shows an honest empty coach
  state when no saved import exists: `No saved import yet`, `0 saved trades`,
  and an `Import trades` action to `/upload-csv`.
- Kept the full sample coach experience available only through
  `/coach?demo=sample` for explicit demo/testing use.
- Updated focused coach Playwright coverage to use `/coach?demo=sample` for
  deep sample-coach assertions.
- Restarted the local dev server on port `3100`.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Restarted dev server response check confirmed `/coach` contains the empty
  state and does not contain `ABCD`, `EFGH`, or `Sample data until you save an
import`.

Current best next step:

- Retry the IBKR CSV through `/upload-csv`; after a saved import, `/workspace`
  and `/coach` should both switch from empty state to the same saved local data.

## 2026-05-12 - Upload Duplicate Alert Uses Structured Import Evidence

User retried the private IBKR CSV after a local reset and `/upload-csv` still
reported `This CSV may already be saved`, even though saved trades were empty.
Inspection showed the new preview had 574 accepted executions, 217 trade
groups, `duplicateFile=false`, `duplicateTradeCount=0`, and 52 review
acknowledgements; it was not a saved duplicate.

Changes:

- Updated `/upload-csv` result classification so duplicate messaging only uses
  structured duplicate fields (`duplicateFile`, `duplicateTradeCount`, or
  duplicate-specific decision kinds), not broad text matching in review copy.
- Non-duplicate imports that need acknowledgement now show `CSV uploaded and
needs review` with an `Open import details` action.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `git diff --check` passed with existing CRLF warnings in docs/import tests.

Current best next step:

- Keep the current uploaded IBKR preview instead of deleting it. The next UX
  step is to reduce or automate the 52 import review acknowledgements so a
  normal trader can save clean broker CSVs without feeling responsible for
  technical import validation.

## 2026-05-12 - IBKR Auto-Grouping And Import Review Noise Fix

User tested `/upload-csv` with the private April IBKR CSV and found two real
UX/data issues:

- Preview trade links said `Open trade review` before the import was saved,
  which sent preview trade IDs to `/trades/[tradeId]` and produced a 404.
- Auto-detected IBKR uploads still used generic grouping rules, creating many
  false `open-position leftover` review decisions and `large size jump` save
  acknowledgements.

Changes:

- `/imports/[batchId]` now shows preview rows as `Trades Ready To Save` and
  disables individual trade-review links until the import is committed.
- CSV dry-run now reruns grouping with the resolved broker rules after
  automatic broker detection. The private IBKR file drops from 217 preview
  trades / 52 review decisions to 208 preview trades / 0 required decisions.
- `open_leftover` is now an advanced import-window note (`not flat inside this
CSV`) instead of proof the live account still has an open position.
- `huge_size_jump` and non-generic broker duplicate-like fill clusters stay
  available as advanced notes but no longer block a clean broker import.
- Discarded stale local unsaved previews created before this fix so the next
  manual upload starts from a clean recovery queue.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts src/lib/trader-analytics/__tests__/import-commit-planner.test.ts src/lib/trader-analytics/__tests__/buy-sell-execution-fixture-matrix.test.ts --reporter=dot`
  passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Live API preview of
  `artifacts/real-csv-calibration/private/U21845737_202604_202604.csv` after
  restart returned `brokerKey=ibkr_activity_statement`, `requestCount=208`,
  `requiredDecisionCount=0`, and `canCommitNow=true`.
- `/api/trades` is still empty and `/api/import-batches` has an empty active
  recovery queue after discarding the test preview.

Current best next step:

- Retry the April IBKR CSV through `/upload-csv`. It should auto-detect IBKR,
  save directly, and then show the saved import/trades instead of sending the
  user through review acknowledgements.

## 2026-05-12 - Levels-System Replay Default And IBKR Prior-Close Handling

User tested the saved April IBKR upload and found `/analytics` showing nearly
all saved reviews as `Chart data still missing` plus two open trades. The chart
failure was not an analytics display issue: persisted decision-review jobs were
failing with durable candle warehouse misses because the trader app defaulted
to its local `data/candles` stub/demo folder instead of the sibling
levels-system backfilled IBKR warehouse.

Changes:

- `readLevelsSystemRuntimeConfigFromEnv({})` now defaults to the sibling
  `../levels-system/data/candles` warehouse when it exists, with provider
  `ibkr` and warehouse mode `replay`.
- Explicit `LEVELS_SYSTEM_*` env overrides and on-demand IBKR hydration still
  win when configured.
- Avoided defaulting to the package `node_modules` candle warehouse because
  Turbopack tries to crawl its symlinked candle files during production build.
- Added IBKR position-effect parsing for the statement `Code` column so a row
  marked as closing shares from before the CSV window is not reconstructed as a
  new open short trade.
- The private April CSV smoke now reconstructs 207 trades with only one open
  trade left: SKYQ row 804 for 2 shares, matching the IBKR Open Positions line.
  The ANNA prior-position close is recorded as an advanced import issue instead
  of a false open trade.

Verification:

- Targeted runtime/import tests passed:
  `npx vitest run src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts src/lib/trade-analysis/__tests__/run-trade-analysis.test.ts -t "prior position|levels-system runtime options" --reporter=dot`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Local chart-pipeline smoke reran one previously failed saved ANNA review
  through `runBatchTradeAnalysis(...)` with the new default runtime config and
  completed with a summary instead of `market_context_unavailable`.
- Private April CSV smoke returned `broker=ibkr_activity_statement`,
  `acceptedExecutionCount=574`, `requestCount=207`, `openTrades=[SKYQ row 804]`,
  and `prior_position_close_skipped=1`.

Current best next step:

- Reset the local account, restart the dev server, and retest `/upload-csv`
  with the April IBKR CSV. Expected result: most saved reviews should complete
  with replayed chart evidence from levels-system; SKYQ may remain open unless
  a later statement row closes the 2-share position.

## 2026-05-12 - Unsupported Short Import Guard And Empty Analytics State

User clarified that short trades are not currently part of the end-user app
and that `/analytics` was still showing ABCD/EFGH sample tickers after the
local account reset.

Changes:

- Normal broker CSV imports no longer reconstruct sell-starting rows as short
  trades by default. Unmatched sell-side sequences are skipped with a plain
  import issue instead of being saved as short trades.
- Over-reducing long exits still close the long-side trade, but any leftover
  sell-side remainder is skipped unless an explicit internal fixture opt-in is
  used.
- Import commit planning now blocks an upload that has accepted executions but
  reconstructs zero saved trades, preventing empty/unsupported imports from
  being committed as ready.
- `/analytics` now shows an empty real-account state with `Upload CSV` and an
  explicit demo-preview link when there are no saved reports. Sample ABCD/EFGH
  analytics only appear through `/analytics?demo=sample`.

Verification:

- `npx vitest run src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts src/lib/trader-analytics/__tests__/import-commit-planner.test.ts src/lib/trader-analytics/__tests__/trader-functional-product-readiness.test.ts --reporter=dot`
  passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Local `/analytics` smoke after the reset rendered the empty upload state and
  did not show ABCD/EFGH sample tickers.

Current best next step:

- Retry the April IBKR CSV through `/upload-csv` and inspect the saved import
  plus `/analytics`/`/coach`. If chart evidence is still missing, inspect the
  persisted decision-review job payloads against the levels-system replay
  context rather than treating it as a UI-only issue.

## 2026-05-12 - Import Window Carryover Rows Demoted To Advanced Info

User asked whether a sell-first row could be a March-to-April carryover rather
than a short trade, and whether the importer should set that aside for normal
long-side analytics.

Changes:

- Confirmed the private April IBKR file has one IBKR-marked closing row from
  before the uploaded CSV window.
- Sell-first rows and IBKR prior-position closes now use clearer messages that
  explain the row was set aside from normal long-side analytics because the
  opening buy is outside the uploaded window or unavailable.
- Prior-window sell/close rows are `info` repair items, so they do not create
  beginner repair work, do not block save, and stay in advanced import details.
- `/imports/[batchId]` shows a compact beginner note only when carryover rows
  were set aside, with exact row details kept inside advanced import details.

Verification:

- Targeted import/commit/readiness tests passed:
  `npx vitest run src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts src/lib/trader-analytics/__tests__/import-commit-planner.test.ts src/lib/trader-analytics/__tests__/trader-functional-product-readiness.test.ts --reporter=dot`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Private April CSV smoke returned `canCommitNow=true`, `status=ready_to_commit`,
  `savedTrades=207`, and one info-level `prior_position_close_skipped` advanced
  row note.

Current best next step:

- Re-upload the April IBKR CSV through `/upload-csv`. Expected result: the CSV
  should save without a short-trade claim; the one outside-window close should
  appear only as a lightweight note/advanced import detail.

## 2026-05-12 - Non-Blocking CSV Commit And Queued Chart Review

User saw the minimal `/upload-csv` page sit on `Saving...` for several minutes
after uploading the April IBKR CSV and asked whether candle/support-resistance
work was happening during upload.

Findings:

- The commit API was saving the import and then synchronously running
  `runPersistedDecisionReviewJobs(...)` before returning to the browser.
- That meant the beginner upload card waited for chart-data review across the
  saved trades instead of returning as soon as executions/trades were saved.
- The April upload did commit before the local restart: 207 saved trades, 1
  report, 206 queued chart-review jobs, and 1 blocked-open-trade job.
- The levels-system trade-window builder currently requests candles from trade
  start through trade end plus pre/post padding. For multi-day holds this means
  the current implementation can request the full intraday gap, not only local
  candles around each buy/sell execution.

Changes:

- `/api/import-batches/[batchId]/commit` now returns immediately after the
  import is committed and schedules persisted chart-data review after the
  response with Next `after(...)`.
- The commit response reports
  `persisted_decision_review_run_scheduled_v1` with queued/open job counts
  instead of waiting for chart-review diagnostics.
- `/upload-csv` success copy now says trades are saved and chart evidence can
  keep loading in the background.
- Saved-import API tests now expect newly committed trades to start in the
  queued chart-data-review lane.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/saved-import-api-routes.test.ts --reporter=dot`
  passed.
- `npx vitest run src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts src/lib/trader-analytics/__tests__/import-commit-planner.test.ts src/lib/trader-analytics/__tests__/trader-functional-product-readiness.test.ts --reporter=dot`
  passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Restarted local dev server on `http://127.0.0.1:3100`; `/upload-csv` returns
  200 after restart.

Current best next step:

- The current local account already contains the April import. Decide whether
  to keep it and inspect the queued chart-review dashboard state, or reset the
  local account before another clean upload test.
- A follow-up levels-system/trade-analysis slice should replace full-hold
  intraday candle windows for multi-day holds with execution-local windows
  around buys/sells plus higher-timeframe support/resistance context.

## 2026-05-12 - Saved Import Chart Data Resume

User asked for the next improvement to resume chart data after the upload flow
was made non-blocking.

Changes:

- Added `/api/import-batches/[batchId]/decision-review/resume` so a saved
  import can run the next small batch of queued chart-data review jobs on
  demand.
- Added `deferRemaining` support to `runPersistedDecisionReviewJobs(...)` so a
  limited resume run leaves unprocessed queued trades queued instead of
  converting them to `skipped_limit`.
- `/imports/[batchId]` now shows a plain beginner note when chart evidence is
  still loading and exposes `Resume chart data review` only inside advanced
  chart/import details.
- Browser QA confirmed the saved import page shows the beginner note, keeps the
  resume action in advanced details, and the resume button posts successfully.
- Local API QA confirmed a resume run moves completed up and queued down while
  preserving the remaining queue.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/sqlite-import-commit-repository.test.ts --reporter=dot`
  passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Local resume API smoke returned
  `persisted_decision_review_resume_result_v1` with `mode=completed`; the
  saved import status counts changed from queued to completed for the processed
  job while the rest remained queued.

Current best next step:

- Reset the local account and re-upload the April IBKR CSV from `/upload-csv`.
  Expected result: the import save should return quickly, the saved import page
  should show chart evidence still loading when jobs remain, and advanced
  details should allow resuming queued chart data review in small batches.
- Follow-up technical slice: improve the levels-system/trade-analysis candle
  window for multi-day holds so intraday context requests focus around
  executions rather than the full hold gap.

## 2026-05-12 - Review Queue Chart Data Waiting Clarification

User noticed `/analytics` showed 207 unresolved trades, 0 chart-data-missing
trades, and no obvious chart evidence after a fresh April IBKR upload.

Findings:

- `Unresolved` meant user review status, not chart-data status. All 207 saved
  trades were unresolved because no written review/checklist item had been
  completed yet.
- `Chart data still missing` only counted jobs already marked
  `market_context_unavailable`; queued chart-data jobs were not included, which
  made the analytics strip look like nothing was waiting.
- The latest April import initially had 206 queued chart-data jobs and 1
  open-trade block. Running resume confirmed the pipeline can produce real
  levels-system evidence.
- Current local data after the queued work completed: 204 completed
  chart-evidence snapshots, 2 true higher-timeframe chart-data misses, and 1
  open trade. The completed snapshots use `levels_system_daily_4h`; 199 also
  use `levels_system_trade_window`.

Changes:

- Added a first-class `queued` saved-review-queue filter labelled
  `Chart Data Waiting`.
- `/analytics` and `/coach` saved-review summary strips now say
  `Needs Your Review` for unresolved user review work and show queued chart
  work as `Chart Data Waiting` instead of incorrectly showing 0 missing.
- `/review` now links the chart-data card to the queued lane while jobs are
  waiting.
- `/upload-csv` now starts one small chart-data resume pass immediately after a
  successful save, without blocking the CSV save result.
- The saved import resume action and resume API default to one chart-data job
  per request so the explicit action does not hang on large real imports.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/saved-import-api-routes.test.ts src/lib/trader-analytics/__tests__/sqlite-import-commit-repository.test.ts --reporter=dot`
  passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Browser smoke on `/analytics` confirmed the summary now says
  `Needs Your Review`; after chart-data completion it shows the two true
  `Chart Data Still Missing` items.
- Focused Playwright route regression could not run because the configured
  Playwright web server refuses to reuse the already-running local server on
  port 3100.

Current best next step:

- Inspect the two true chart-data misses (`AVEX`, `ELMT`) in the levels-system
  warehouse/backfill path. Both are missing enough daily/4h candles for full
  support/resistance context.
- Regenerate or refresh the saved analytics report after chart snapshots finish
  so top-level analytics limitations no longer read as execution-only when
  persisted chart evidence exists.

## 2026-05-15 - Execution-Only Trade Replay Chart

User asked whether individual trade replays could show the trade playout on a
chart, then asked to build the first version.

Changes:

- Added an execution-only SVG chart to `/trades/[tradeId]` inside the existing
  `Trade Replay` section.
- The chart plots saved fill prices over time and marks entries/adds,
  reductions, and exits using the existing execution replay model.
- The chart copy explicitly says it uses saved fills only, so it does not imply
  candle movement, support/resistance, VWAP, or EMA evidence is available.
- Focused route regression coverage now checks that the trade replay chart is
  visible on the guided review path.

Current best next step:

- Keep this as the beginner-safe replay visual while the chart-data pipeline is
  improved.
- A later candle replay should use a persisted chart payload containing
  candles, executions, support/resistance levels, and evidence markers after
  the multi-day candle-window and chart-data refresh work is complete.

## 2026-05-15 - Candle-Ready Trade Replay Payload

User asked whether the individual trade replay chart could use candles and
asked Codex to choose the best implementation path.

Changes:

- Added a factual `replayCandleWindow` payload to the trade-analysis summary
  and persisted decision-review snapshot. It stores only trusted replay chart
  data: timestamp, OHLC, volume, timeframe, and whether each candle is before,
  during, or after the trade.
- `/trades/[tradeId]` now renders candlesticks behind execution markers when a
  saved review snapshot includes that candle payload.
- Older saved review snapshots continue to use the execution-only fallback. A
  page-render attempt to recover old candle windows was intentionally removed
  because it can make the route slow or hang; candle replay should come from
  saved chart-review data, not a trade-detail page fetch.
- Updated the decision-review bridge test to prove new review snapshots carry
  the replay candle window.
- Updated the stale short-trade fixture expectation so sell-starting uploads
  stay out of long-trade coaching instead of expecting short coaching.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts`
  passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "shows the guided review workflow"`
  passed.
- Browser smoke on the current legacy saved trade confirmed the chart remains in
  execution-only fallback because its old snapshot does not yet include
  `replayCandleWindow`.

Current best next step:

- Refresh or regenerate chart-review snapshots for saved trades after the
  chart-data resume path completes so existing trades can receive the new candle
  replay payload without making the trade-detail route fetch candles on render.

## 2026-05-15 - Targeted Candle Replay Refresh

User refreshed the trade detail page but still saw the execution-only line
chart. The reason was correct but confusing: the page code was candle-ready, but
the selected saved trade still had an older completed chart-review snapshot
without `replayCandleWindow`.

Changes:

- The saved chart-data resume endpoint can now refresh completed snapshots that
  are missing the replay candle payload.
- Added a targeted `savedTradeId` refresh path so one open trade page can be
  refreshed directly instead of processing every old completed snapshot first.
- Refreshed the currently open CYCN trade snapshot locally. It now has 113
  saved 1m replay candles and the trade detail chart switches to candle mode.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npx vitest run src/lib/trader-analytics/__tests__/sqlite-import-commit-repository.test.ts src/lib/trader-analytics/__tests__/saved-import-api-routes.test.ts`
  passed.
- `npm run build` passed.
- Browser smoke on the open trade detail page confirmed `Trusted candles from
  saved chart review` and `113 1m candles`.

Current best next step:

- Add a visible user action or background maintenance path to refresh the
  remaining older completed snapshots that still lack `replayCandleWindow`.

## 2026-05-15 - Day Session Saved-Trades Hierarchy And Replay Marker Polish

User noticed clustered execution labels overlapping on the candle replay and
that repeated CYCN round-trip cards felt like unrelated trades instead of one
ticker/day story.

Changes:

- `/trades` now defaults to a Day Sessions browse mode. The saved-trade library
  starts from the trading day, then opens a ticker story, then individual
  round-trip cards.
- Saved session stories now expose ticker summaries for the day: symbol, net
  P/L, round-trip count, lifecycle/open status, review priority, and ticker
  story link. The underlying flat-to-flat round-trip math was not changed.
- `/trades` day-session cards now open a day detail section where repeated
  same-ticker activity stays grouped before the user drills into round trips.
- `/trades/[tradeId]` now shows a context trail: Day Session -> Ticker Story ->
  current Round Trip.
- The trade replay chart keeps candles and execution markers, but clustered
  marker numbers are suppressed when they would collide. A compact execution
  strip below the chart carries the readable fill order, action, time, price,
  shares, and position change.
- `/review` handoff copy now points to day sessions instead of the older
  session-stories label.
- The broad mobile route smoke helper now waits for `domcontentloaded` plus the
  expected heading instead of brittle full `networkidle`, and the mobile route
  loop has a realistic timeout for the current data-heavy saved account.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npx vitest run src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts`
  passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "saved trade routing|guided review workflow"`
  passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable|mobile usability"`
  passed.
- Browser smoke on `/trades` confirmed Day Sessions is the default and opening
  a day shows ticker stories. Browser smoke on the current trade detail
  confirmed the candle chart, execution strip, and context trail render.

Current best next step:

- Continue with the chart-data/backfill reliability path for the remaining true
  chart-data misses and older saved snapshots missing replay candles. Do not
  rebuild the saved-trades hierarchy unless route QA finds a concrete issue.

## 2026-05-15 - Dedicated Ticker Story Drilldown

User noticed that ticker story cards should open a deeper ticker-story page
showing only the round trips for that ticker/session, not just jump back into a
mixed `/trades` section.

Changes:

- Added `/trades/ticker-story/[threadId]` as a dedicated ticker-story detail
  route.
- Updated saved ticker-story hrefs so day-session ticker cards, trade-detail
  breadcrumbs, analytics/coach/progress handoffs, and saved-trade story cards
  can land on the focused ticker-story page.
- The new page keeps the beginner path simple: story summary first, then only
  that ticker's round trips, then supporting evidence.
- Added explicit `Open ticker story` actions to `/trades` ticker story cards.
- Left the underlying flat-to-flat round-trip accounting, reconstruction, chart
  evidence, and behavior mapping unchanged.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npx vitest run src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts`
  passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "saved trade routing|guided review workflow"`
  passed.
- Browser smoke confirmed `/trades?view=session_stories&session=2026-04-17#day-session`
  exposes ticker-story links and `/trades/ticker-story/PBM%3A2026-04-17`
  renders round trips with replay links.

Current best next step:

- Continue with chart-data/backfill reliability and remaining saved snapshot
  refresh work. Do not rebuild the saved-trades hierarchy or dedicated
  ticker-story drilldown unless route QA finds a concrete regression.

## 2026-05-15 - Ticker Story Hold Continuation Classification

User reviewed the CYCN ticker-story page and noted that when a day trade turns
into a late-session hold or true swing, the story needs a clear continuation
path instead of leaving the carried trade buried in the round-trip list.

Changes:

- Split same-date overnight-hours continuation from true cross-session swing
  exposure in the saved-trade-thread read model. True `Day trade turned swing`
  wording now requires a carry into another trading session/date; CYCN-style
  same-date late-session trades classify as `Extended same-day hold`.
- Added a `Hold Continuation` section to `/trades/ticker-story/[threadId]`
  whenever a round trip is open, crosses into another session, or is marked as
  an extended hold.
- The section keeps the continuation inside the ticker story instead of adding
  another page: it shows the carried round trip, open/close timestamps, hold
  span, chart evidence state, P/L, and an `Open continuation replay` link.
- Updated ticker-story, saved-trades, and trade-detail copy so same-date
  after-hours/extended holds do not say `Carried overnight`; only true
  cross-session records say `Carried into next session`.
- Updated saved-trade-thread copy to frame this as an extended-hold or
  multi-session review, not always overnight exposure.
- Follow-up wording pass removed assumptions that the trader intended a quick
  intraday idea. Extended same-day hold copy now asks whether the hold was
  planned and had invalidation, because the CSV proves exposure timing but not
  trader intent.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npx vitest run src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts`
  passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "saved trade routing|guided review workflow"`
  passed.
- Browser smoke on `/trades/ticker-story/CYCN%3A2026-04-01` confirmed the
  continuation section, `Extended hold` label, hold span, and continuation
  replay link.

Current best next step:

- Continue with chart-data/backfill reliability and older saved snapshot
  refresh work. Treat ticker-story continuation UI as completed unless QA finds
  a concrete regression.

## 2026-05-15 - Saved Trades Month Calendar View

User liked the current `/trades#session-stories` day-session page and asked for
an additional month calendar that keeps one month visible at a time, marks
green/red trading days, shows the tickers behind each day, and summarizes the
month's P/L.

Changes:

- Added a `Calendar` browse mode to `/trades` at
  `/trades?view=calendar&month=YYYY-MM#calendar`.
- Added a month summary above the calendar with Month P/L, trading days, green
  days, red days, best day, and worst day.
- Added previous/next month links plus chips for months that have saved trade
  data.
- Calendar days use the existing day-session read model and link into the
  existing day-session drilldown instead of creating a separate accounting
  model. Ticker chips are green/red based on ticker-story P/L for that day.
- Screenshot QA tightened the calendar day cells: shorter card height,
  full-width desktop grid, no repeated `Day Session`/count/open-link copy
  inside each day, smaller one-line ticker chips, and non-wrapping day P/L.
- Follow-up desktop polish changed the month grid to a market-week layout
  (`Sun` through `Fri`) because Saturdays are not trading days, widened the
  visible day columns, and balanced the day-cell height/padding so four ticker
  chips are not clipped while the bottom gap stays small.
- Kept the wide month grid inside a local horizontal-scroll container so mobile
  does not get page-level overflow.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "saved trade routing"`
  passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable|mobile usability"`
  passed.
- Browser smoke confirmed `/trades?view=calendar&month=2026-04#calendar`
  shows April 2026, Month P/L, CYCN ticker chips, and day-session links.

Current best next step:

- Continue with chart-data/backfill reliability and older saved snapshot
  refresh work. Treat the saved-trades month calendar as completed unless QA
  finds a concrete regression.

## 2026-05-16 - Workspace Dashboard Homepage And Logo Palette

User approved the logo-based dashboard palette and asked for the logged-in home
page to feel like a polished, production-ready SaaS dashboard instead of a
basic route list.

Changes:

- Rebuilt `/workspace` as the main dashboard homepage with a branded top bar,
  section navigation, hero/overview, one primary next action, real metric
  cards, product-area cards, analytics preview, recent activity, and status
  summaries.
- Copied the supplied TradersLink horizontal logo into `public/` and used it in
  the workspace top bar.
- Matched the dashboard blues to the logo navy (`#011E56`) and moved shared
  dashboard surfaces, borders, profit, and loss tones to a darker professional
  palette.
- Kept beginner actions first: Upload, Calendar, Review, Analytics, Coach,
  Progress. Supporting/admin/internal routes stay below the primary flow and
  behind demoted sections.
- Wired dashboard values to real saved data: saved trades, day sessions, ticker
  stories, gross P/L, win rate, review queue counts, chart-data gaps, latest
  import, latest day session, and next review item.
- Preserved existing workspace route-contract labels used by regression tests:
  `Trader Workspace`, `Trade review workflow`, `Your next step`, `More review
  tools`, `Beta storage and admin notes`, and `Chart data still missing`.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "guided end-user path|workspace and coach"`
  passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable|mobile usability"`
  passed.
- Browser smoke opened `/workspace` and confirmed the branded dashboard renders.
- `npm run lint` was attempted but timed out/fails on existing project lint
  issues outside this new page, including generated `vercel-landing/.next`
  files and an existing `app/app-ui.tsx` React immutability warning.

Current best next step:

- Continue with chart-data/backfill reliability and older saved snapshot
  refresh work. Treat the workspace dashboard homepage and logo palette pass as
  completed unless QA finds a concrete regression.

## 2026-05-16 - Saved Trades Subfeature Route Split

User asked to stop showing every saved-trade subfeature in one `/trades` view.
The desired hierarchy is now: `/trades` is the feature chooser, and Calendar,
Day Sessions, Ticker Stories, Round Trips, Open/Swing, and Needs Review each
have their own page.

Changes:

- Added dedicated routes:
  - `/trades/calendar`
  - `/trades/day-sessions`
  - `/trades/day-session/[sessionDate]`
  - `/trades/ticker-stories`
  - `/trades/round-trips`
  - `/trades/open-swing`
  - `/trades/review-needed`
- Kept the existing saved-trade read models, P/L math, grouping rules, ticker
  story detail page, and round-trip detail pages intact.
- Updated `/trades` so it is a category landing page with the priority panel,
  workflow, metrics, and feature cards only. It no longer renders Calendar,
  Day Sessions, Ticker Stories, and Round Trip Cards all together by default.
- Updated the calendar day click flow to land on
  `/trades/day-session/[sessionDate]`, where the user sees only that day
  session drilldown instead of the full day-session list plus the detail.
- Updated links from workspace, review, progress, coach, analytics, trade
  detail breadcrumbs, ticker-story breadcrumbs, and saved-trade thread read
  models to use the new route hierarchy.
- Added/updated regression coverage for the new flow:
  `/trades` feature chooser -> `/trades/calendar` -> day session route ->
  `/trades/ticker-stories` -> ticker story detail.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npx vitest run src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts`
  passed.
- `npm run build` passed and showed the new trade routes in the App Router
  route list.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "saved trade routing"`
  passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "guided end-user path|workspace and coach|guided review workflow"`
  passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable|mobile usability"`
  passed.

Current best next step:

- Continue the broader app IA cleanup by applying the same "category page ->
  focused subfeature page -> drilldown page" model to other crowded route
  groups only where the current UI still mixes multiple tasks into one screen.

## 2026-05-16 - Saved Trades Section Navigation Follow-Up

User caught an IA regression after the route split: `/trades` had focused
subfeature pages, but the left aside menu no longer exposed those feature
routes. That made Calendar, Day Sessions, Ticker Stories, Round Trips,
Needs Review, and Open/Swing harder to navigate from inside the Saved Trades
area.

Changes:

- Updated the shared `DashboardSideNav` to support an active page state with
  `aria-current="page"` and a stronger highlighted style.
- Updated `/trades` so the `Trades Menu` always includes route links for:
  Overview, Calendar, Day Sessions, Ticker Stories, Round Trips, Needs Review,
  and Open/Swing.
- Kept the route split intact. The menu now moves between focused pages instead
  of bringing all trade subfeatures back into one combined page.
- Added focused Playwright assertions so the `/trades` menu must keep those
  subfeature links and mark Calendar active on the Calendar page.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "saved trade routing"`
  passed.
- `git diff --check -- app\app-ui.tsx app\trades\page.tsx tests\e2e\app-feature-regression.spec.ts`
  passed.

Current best next step:

- Use the same local-section navigation pattern when Analytics and Coach are
  split into deeper subfeature pages, so each main category has its own
  persistent section menu.

## 2026-05-16 - Coach Subfeature Route Split

User asked to apply the same category/subfeature IA pattern from `/trades` to
`/coach`. The coach now keeps a clear overview page while deeper coaching work
opens on focused pages instead of stacking every panel into one scrolling view.

Changes:

- Kept `/coach` as the coaching overview with the current focus, overall
  workflow, and cards that open specific coaching views.
- Added focused routes for review session, behavior sequence, review backlog,
  ticker stories, session stories, next-session planning, progress, and more
  details.
- Updated the `Coach Menu` so it is route navigation with active page state,
  matching the Saved Trades menu pattern.
- Moved old coach anchor handoffs from workspace, review, progress, analytics,
  imports, trades, and trade detail pages to the new focused coach routes where
  appropriate.
- Preserved the existing behavior coaching sequence, evidence queue, ticker
  story coach, session story coach, next-session plan, progress summary, and
  supporting details. This was an IA/routing split, not a behavior engine
  rewrite.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed and showed the new `/coach/*` routes.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "coach product loop"`
  passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable|mobile usability"`
  passed.
- `npx playwright test tests/e2e/saved-import-visual-overflow.spec.ts --project=chromium-desktop -g "keeps saved-import routes readable"`
  passed.
- `git diff --check` passed for the coach route split files.

Current best next step:

- Apply the same focused route/navigation pattern to `/analytics` next if the
  user wants the analytics categories separated into pages instead of an
  in-page section switcher.

## 2026-05-16 - Analytics Subfeature Route Split

User asked to apply the same category/subfeature IA pattern from `/trades` and
`/coach` to `/analytics`. Analytics now keeps an overview page while the
major report categories open on their own focused pages instead of relying on
one dense in-page switcher.

Changes:

- Kept `/analytics` as the analytics overview with report-category access cards
  and a persistent `Analytics Menu`.
- Added focused analytics routes for results, timing, behavior, ticker stories,
  session stories, chart evidence, behavior review plan, trade explorer, and
  supporting details:
  - `/analytics/results`
  - `/analytics/timing`
  - `/analytics/behavior`
  - `/analytics/ticker-stories`
  - `/analytics/session-stories`
  - `/analytics/chart-evidence`
  - `/analytics/review-plan`
  - `/analytics/trade-explorer`
  - `/analytics/details`
- Updated analytics cards, side navigation, workspace handoffs, and tests to
  use route links instead of old `/analytics#...` or in-page section switching.
- Preserved the existing analytics read models and report panels. This was an
  IA/routing split, not an analytics-engine rewrite.
- Carried `demo=sample` through analytics trade-explorer links and allowed
  trade detail pages to honor sample preview mode so demo analytics rows do not
  404 when real saved data exists locally.
- Kept chart evidence, behavior reports, ticker/session story analytics, review
  planning, trade filters, and advanced details available on focused pages.
- Follow-up QA tightened the page boundaries: `/analytics/results` keeps the
  outcome views such as `Daily P/L Calendar` and `P/L by Trade`, while
  `/analytics/timing` now shows only timing/session/hour analysis instead of
  repeating the Results and Behavior chart blocks.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed and showed the new `/analytics/*` routes.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "analytics product intelligence"`
  passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "market context observational"`
  passed.
- `npx playwright test tests/e2e/app-acceptance.spec.ts --project=chromium-desktop -g "filters analytics"`
  passed.
- `npx playwright test tests/e2e/app-first-user-hardening.spec.ts --project=chromium-desktop -g "core controls accessible"`
  passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable|mobile usability"`
  passed.
- Follow-up after the timing/results boundary fix: `npx tsc --noEmit --pretty false`,
  `npm run build`, and
  `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "analytics product intelligence"`
  passed.
- `git diff --check` passed with only an unrelated line-ending warning for
  `src/lib/execution-sources/types/provider-execution.ts`.

Current best next step:

- Continue the same section-by-section IA cleanup only where a main route still
  stacks unrelated subfeatures into one page. Good candidates are `/progress`
  or `/review` if user QA says those screens feel too crowded.

## 2026-05-16 - Beginner Flow UI Polish After Expert Audit

User asked to apply the UI audit recommendations that kept the product moving
toward beginner-first pages, advanced evidence second, and admin/debug outside
the default workflow.

Changes:

- Reworked `/upload-csv` into the branded beginner entry page with the
  TradersLink logo, workspace return link, a concise explanation, and the
  existing single upload card. The card now says `Select your CSV file` and
  `Upload and save trades` instead of feeling like an isolated technical tool.
- Demoted `/import-dry-run` into `Advanced Import Check` with a clear handoff
  back to `/upload-csv`, while preserving the existing advanced diagnostics and
  import workbench below it.
- Simplified `/imports` to `Import History`, changed actions to `Upload another
  CSV`, and removed the repeated import workflow strip so the first screen is
  imports to finish plus history.
- Removed the import workflow strip from `/trades` so the saved-trades landing
  page starts with the trade menu, priority trade, and saved-trade workflow.
- Updated import workflow links and empty-review import links to route normal
  users to `/upload-csv` instead of `/import-dry-run`.
- Made analytics subpage headers route-specific. `/analytics/results` now opens
  with `Results` and compact saved-review queue context instead of the full
  generic analytics dashboard header.
- Tightened coach subpage headers by using a smaller subpage header and hiding
  the repeated data badges on narrow subpage screens.
- Refocused the trade-detail execution section by making the replay chart and
  execution strip full-width first, then demoting `Risks And Strengths` into a
  secondary disclosure below the replay.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Browser smoke passed for `/upload-csv`, `/imports`, `/import-dry-run`,
  `/trades`, `/analytics/results`, and `/coach/behavior-sequence`.
- Direct Playwright smoke against the already-running local server passed for
  `/review` -> trade detail `#execution`, confirming the replay chart,
  execution strip, execution anchor, and risk/strength text remain available.
- The configured Playwright test command could not start because port 3100 was
  already occupied and `playwright.config.ts` has `reuseExistingServer: false`.
  The direct Playwright smoke was used against the existing server instead.

Current best next step:

- Continue route-specific simplification only where user QA proves a page is
  still too crowded. Likely next candidates are `/review` and `/progress`;
  avoid further import/trades/analytics/coach rewrites unless a concrete
  regression appears.

## 2026-05-16 - UI Follow-Up Pass For Review, Imports, And Trade Replay

Pulled the latest `codex/trader-ui-product-pass` branch through commit
`2b5c5e9abe9556cc421bc53f3520420acf0e187f` and followed
`src/docs/codex-ui-followup-instructions-2026-05-16.md`. This was a targeted
beginner-first polish pass, not a rebuild of the completed IA, import,
analytics, coach, or saved-trade read-model work.

Changes:

- Simplified `/review` into a clearer beginner work queue: the top explains the
  one-trade review loop, the side nav now points to review-first, queue,
  supporting details, and lesson draft, and the main queue shows only the
  beginner lane counts by default.
- Kept the full saved review lane counts, session handoff, coach/session
  context, evidence counts, and technical limits available behind advanced or
  supporting disclosures.
- Moved the `/trades/[tradeId]` replay section directly under the
  replay/decide/write/continue handoff so traders see the candle/execution
  replay and execution strip before secondary evidence, session story panels,
  and execution score detail.
- Changed `/upload-csv` submit copy from `Upload and save trades` to
  `Check CSV and continue`, which better matches duplicate, repair, and review
  states.
- Renamed the lower `/imports` `Import History` section to `Recent imports` and
  lightly reduced the empty repair section so it does not look like active work
  when no repairs exist.
- Lightly simplified `/trades` by tucking the supporting saved-trade count cards
  behind `Show saved-trade counts`, while preserving the priority panel,
  workflow handoff, browse modes, calendar, day sessions, ticker stories, and
  round trips.
- Updated focused Playwright expectations for the current beginner upload,
  advanced import, coach, and analytics overview surfaces.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- The requested full desktop Playwright command first could not start while the
  already-running local server held port 3100, then a live-server retry timed
  out because the full spec was too broad for that mode.
- After stopping the existing server so Playwright could start the built app,
  the focused desktop route regression passed:
  `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "guided end-user path|saved trade routing|guided review workflow|banned product claims|market context observational|loads the main end-user routes"`.
- The requested mobile usability slice passed:
  `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable"`.
- Headless browser smoke passed against the restarted local server for
  `/workspace`, `/upload-csv`, `/imports`, `/review?queue=highest_priority`,
  `/trades`, and a review-queue trade detail handoff. The smoke confirmed the
  trade replay appears after the workflow handoff and before execution score
  detail.

Current best next step:

- Continue only with concrete user-reported UI crowding or route-flow issues.
  The highest-value candidates remain `/review` follow-up QA after real use and
  `/progress` if it still feels like imported-trade counting instead of review
  follow-through. Do not revisit import/trades/analytics/coach architecture
  unless screenshots or tests reveal a real regression.

## 2026-05-16 - Open/Swing False Positive Cleanup

Investigated the `/trades/open-swing#trade-list` report after user QA said the
April import showed 8 swing trades even though every trade was closed. The 8
items were closed trades that carried into another session; they were being
mixed into the open/swing lane because the UI treated overnight/next-session
holds as open/swing trades.

Changes:

- Changed the `/trades/open-swing` lane into an `Open Positions` lane that
  only shows true open-position review items, not closed overnight or
  next-session holds.
- Renamed user-facing `Open/Swing`, `Open Trades`, and swing-transition copy to
  `Open Positions`, `Hold Reviews`, `Next-session holds`, or
  `carried into another session` depending on context.
- Kept closed next-session holds in ticker/day stories as hold-plan review
  evidence, without presenting them as open swing trades.
- Aligned the open-position review queue copy with the saved-trade browse lane:
  the card now says the import has an opening execution without a matching close
  and asks the user to check whether the CSV includes the closing execution.
- Verified the current imported data now shows 1 open-position anomaly, SKYQ on
  2026-04-29 at 4:31 PM ET, instead of the prior 8 false swing/open items. The
  SKYQ item remains because the saved import contains a buy for 2 shares without
  a matching sell; do not force-close it without source evidence.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npx vitest run src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts src/lib/trader-analytics/__tests__/saved-import-api-routes.test.ts`
  passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "saved trade routing"`
  passed.
- Browser smoke passed for `/trades/open-swing#trade-list`: it now shows
  `Open Positions`, no CYCN/SIDU/SPCE/VEEE/ISPC/SPRC/FFAI/XE false swing cards,
  and one explicit SKYQ open-position anomaly with closing-execution copy.

## 2026-05-16 - Open Import-Window Positions Removed From Default Coaching

Follow-up user QA clarified that even the remaining SKYQ open-position card
should not appear in the normal saved-trade/dashboard flow because the product
is focused on completed trade review. The raw IBKR April CSV contains an
`Open Positions` row for SKYQ quantity 2 and one unmatched SKYQ buy execution,
but this should be treated as an incomplete import-window detail, not as a
saved trade to review by default.

Changes:

- Updated the import commit planner so open/incomplete position groups remain
  review-gated but are not saved into the completed-trade library and do not
  create decision-review jobs.
- Updated the SQLite saved-trade list read path to return closed trades only,
  which keeps any older open rows out of workspace, trades, analytics, coach,
  progress, and review surfaces.
- Added a saved-review-queue guard so legacy open-position jobs are ignored
  unless they belong to a closed saved trade.
- Updated open-position tests to assert that unmatched open groups are kept out
  of completed-trade coaching rather than saved as blocked open trades.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npx vitest run src/lib/trader-analytics/__tests__/import-commit-planner.test.ts src/lib/trader-analytics/__tests__/sqlite-import-commit-repository.test.ts src/lib/trader-analytics/__tests__/saved-import-api-routes.test.ts`
  passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "saved trade routing"`
  passed.
- Browser smoke passed for `/trades/open-swing#trade-list`: the lane now shows
  `Open Positions 0`, no SKYQ card, and no false open/swing trade cards.

## 2026-05-16 - Swing Trades Restored With User Close Override

User clarified the intended product behavior: import-window positions should be
called swing trades, not hidden, and the trader should be able to mark a
detected swing trade closed if the import window made it look open by mistake.
This supersedes the previous "hide open positions" interpretation.

Changes:

- Restored open import-window groups as saved swing-trade candidates with
  `blocked_open_trade` decision-review jobs instead of dropping them from saved
  trades.
- Renamed the default user-facing lane from `Open Positions` to `Swing Trades`
  across saved trades, review, coach, progress, import dry run, workspace, and
  shared queue labels.
- Added `POST /api/trades/[tradeId]/mark-closed` and a `/trades/open-swing`
  card action so the user can mark a detected swing trade closed. The override
  persists `userLifecycleOverride`, sets the trade to closed/ignored, and
  removes it from the swing-trade review queue.
- Kept completed overnight/next-session holds discoverable as hold-plan review
  evidence while the swing lane now also includes true blocked swing candidates.
- Updated execution-feedback wording so the import dry-run no longer shows
  `Open Position Leftover` in the visible execution autopsy; it now presents the
  case as a swing trade.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npx vitest run src/lib/execution-feedback/__tests__/execution-behavior-patterns.test.ts src/lib/trader-analytics/__tests__/import-commit-planner.test.ts src/lib/trader-analytics/__tests__/saved-import-api-routes.test.ts src/lib/trader-analytics/__tests__/sqlite-import-commit-repository.test.ts`
  passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "saved trade routing"`
  passed.
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop -g "swing-trade imports"`
  passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable"`
  passed.

Current best next step:

- Resume from user-facing QA on `/trades/open-swing#trade-list` with real April
  data. Confirm the swing-trade lane contains the expected candidates, the
  `Mark as closed` action removes mistaken candidates, and completed
  next-session holds remain in ticker/day stories rather than being confused
  with unresolved swing trades.

## 2026-05-16 - Fresh Chat Handoff Created

Created a new fresh-chat handoff for the next UI review pass:

- `src/docs/trader-intelligence-new-chat-handoff-2026-05-16.md`

Also linked it from `plan.md` and
`src/docs/trader-intelligence-plan-index.md` so the next chat has one obvious
resume document after reading the project log.

Current best next step:

- Start the next chat from the handoff file and run a screenshot-led UI review
  from `/workspace` through upload, imports, saved trades, review, analytics,
  coach, and progress. Preserve the completed beginner-first IA and fix only
  concrete route/copy/layout issues found in the review.

## 2026-05-22 - Academy Progress Preservation Guard

Added explicit protection for live Academy lesson progress after the Academy
launch work. Progress rows are keyed by `discord_user_id` and `lesson_slug`, so
future lesson URL changes must preserve old saved slugs.

Changes:

- Added `academy/_data/progress-slug-baseline.json` for the current launch
  Course 1 and Course 2 lesson slugs.
- Added `academy/_data/progress-slug-aliases.json` for future old-to-current
  slug mappings.
- Updated `npm run validate:academy-registry` so a protected launch lesson slug
  cannot disappear without an alias.
- Added runtime progress slug expansion so old saved completions count toward
  their current replacement lesson when an alias exists.
- Added `docs/academy-progress-preservation.md` and AGENTS notes for future
  Academy routing, slug, database, and deploy work.

Current best next step:

- Before any Academy deploy, run `npm run validate:academy-registry`.
- If renaming a live Academy lesson, add the new slug to the baseline and add an
  alias from the old slug to the new slug before deploy.

## 2026-05-23 - Clean Live Academy News Merge Candidate

Reconciled the production news work onto a clean source base instead of the
dirty local `trader-intelligence-v2` tree.

Source safety result:

- Created clean live base worktree
  `C:\Users\jerac\Documents\TraderLink\deploy-candidates\traderslink-live-academy-base-20260523`
  on branch `codex/live-academy-news-base` from
  `origin/codex/trader-ui-product-pass` at `d36cf0fa`.
- Confirmed its Academy registry output matches the current Vercel production
  build log: 15 courses, 105 modules, 326 memberships, 264 registered
  lesson/path slugs, 4 path hubs.
- Created separate news candidate worktree
  `C:\Users\jerac\Documents\TraderLink\deploy-candidates\traderslink-news-on-live-academy-20260523`
  on branch `codex/news-on-live-academy`.
- Merged only the news article feature onto that restored live base: public
  `/news/[ticker]`, `/news/[ticker]/[slug]`, and `POST /api/news/articles`.
- Reused the live `AcademyShell` topbar for news pages so the current Academy
  header/mobile menu/theme/auth controls stay identical.
- Did not carry forward the overlay `next.config.ts` fallback rewrite to
  `https://traderslink.pro`, avoiding a promotion loop.
- Did not modify `app/academy`, `app/page.tsx`, `next.config.ts`,
  `package.json`, `package-lock.json`, or `.vercelignore` in the news candidate.

Verification:

- `npm run validate:academy-registry` passed with the same counts as production.
- `npx tsc --noEmit --pretty false` passed.
- Focused ESLint for the new news route/API/store files passed.
- `npm run build:webpack` passed and surfaced `/news/[ticker]`,
  `/news/[ticker]/[slug]`, and `/api/news/articles` as dynamic routes while
  keeping the Academy static generation count at 136 pages.
- Local smoke test published an isolated FJET article to
  `http://localhost:3020/api/news/articles`; `/news/FJET/...`, `/news/FJET`,
  `/academy`, and `/` returned 200.
- Playwright checked desktop and mobile header behavior: Academy and News pages
  share the same `academy-topbar` height, brand label, login control, mobile
  menu display behavior, and no horizontal overflow.

Current best next step:

- Review the clean news candidate diff, configure/confirm production
  `NEWS_PUBLISH_TOKEN` and production database URL in Vercel, then deploy from
  `traderslink-news-on-live-academy-20260523` only after confirming the file
  list remains limited to the news feature and project log.

## 2026-05-23 - Academy Logged-In Save Prompt Fix

Fixed the Academy home hero so the `Save your place as you learn` prompt only
shows for visitors without an Academy session. Logged-in Discord users can still
see the `You are logged in` success notice after OAuth redirect, but the
signed-out save-progress prompt no longer appears underneath it.

Verification:

- `npm run validate:academy-registry` passed.
- `npx eslint app/academy/page.tsx` passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build:webpack` passed with the existing support-resistance dynamic
  dependency warning.
- Local smoke test with an isolated SQLite Academy session confirmed:
  anonymous `/academy` still shows the save prompt, while
  `/academy?auth=connected` with a valid `tl_academy_session` cookie shows
  `You are logged in` and does not show the save prompt.

Current best next step:

- Deploy from the clean
  `traderslink-news-on-live-academy-20260523` worktree after confirming
  production env vars and the final file list.

## 2026-05-23 - Academy OAuth Success Prompt Edge Case

Adjusted the Academy home save-progress prompt so it also stays hidden while
the Discord OAuth success notice is active. This covers the live redirect case
where `/academy?auth=connected` renders the `You are logged in` card before the
server-rendered session state is available, preventing the signed-out
`Save your place as you learn` card from appearing beneath it.

Verification:

- `npx eslint app/academy/page.tsx` passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run validate:academy-registry` passed.
- `npm run build:webpack` passed with the existing support-resistance dynamic
  dependency warning.
- Deployed production from the clean
  `traderslink-news-on-live-academy-20260523` worktree. Vercel deployment
  `dpl_7LdWZtVfkpvkRnEaUXfExMF6GmWN` is Ready and aliased to
  `https://traderslink.pro`.
- Live smoke confirmed `/academy?auth=connected` returns `You are logged in`
  without `Save your place as you learn`, while anonymous `/academy` still
  shows the save-progress prompt.

Current best next step:

- If a user still has to authorize Discord on every Academy visit, inspect
  whether the `tl_academy_session` first-party cookie is being retained for
  `traderslink.pro` and whether `/api/me` returns `authenticated: true`.

## 2026-05-23 - Academy Discord Login Persistence QA

Ran an engineering pass on the Academy Discord login system after a report that
Discord authorization was appearing on repeated visits in the same browser.

Findings and changes:

- The login route always started Discord OAuth, even if the browser already had
  a valid `tl_academy_session`. It now checks the current Academy session first
  and redirects straight back to `/academy/` when already signed in.
- Academy OAuth/session cookies were host-scoped. They now use
  `.traderslink.pro` on the apex and `www` hosts, while remaining host-scoped
  on localhost and Vercel preview URLs. This prevents losing session/state when
  a user crosses between `traderslink.pro` and `www.traderslink.pro`.
- Discord OAuth now requests `prompt=none` first so prior Discord consent can be
  reused without another authorization screen. If Discord says silent reuse is
  unavailable, the callback retries once with `prompt=consent`.
- Logout now clears both the domain cookie and any legacy host-only session
  cookie.
- Vitest now resolves the repo `@` alias so route-handler auth tests can import
  app routes directly.
- Live header QA on the first auth deploy showed Next's response cookie helper
  collapsed duplicate same-name cleanup cookies. The Academy cookie helper now
  appends explicit `Set-Cookie` headers so the `.traderslink.pro` cookie and
  old host-only cookie cleanup both reach the browser.

Verification:

- Focused Academy auth Vitest suite passed:
  `npx vitest run src/lib/academy/__tests__/discord-oauth.test.ts src/lib/academy/__tests__/academy-auth-cookies.test.ts src/lib/academy/__tests__/discord-auth-routes.test.ts`
- Focused ESLint for the touched auth routes/helpers/tests passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build:webpack` passed with the existing support-resistance dynamic
  dependency warning.
- After the explicit `Set-Cookie` cleanup adjustment, the focused Academy auth
  Vitest suite, focused ESLint, and `npx tsc --noEmit --pretty false` passed
  again.
- `npm run build:webpack` passed again after the explicit `Set-Cookie` cleanup
  adjustment, with the existing support-resistance dynamic dependency warning.
- Deployed production from the clean
  `traderslink-news-on-live-academy-20260523` worktree. Final Vercel
  deployment `dpl_9Y7mK5qExbnBGXxsHqAwQhRvbuLG` is Ready and aliased to
  `https://traderslink.pro`.
- Live `/api/auth/discord/login` returns Discord OAuth with `prompt=none`,
  writes `.traderslink.pro` OAuth cookies, and emits host-only cleanup cookies
  for prior stale state/prompt cookies.
- Live OAuth callback simulation for `error=consent_required` redirects to
  `/api/auth/discord/login?prompt=consent` and clears both domain and host-only
  OAuth cookies.
- Live `www.traderslink.pro/api/auth/discord/login` redirects to the apex
  `traderslink.pro` login route.

Current best next step:

- If the same browser still shows Discord authorization on repeated Academy
  visits, test after one fresh login on `https://traderslink.pro/academy/`, then
  inspect whether `tl_academy_session` is present for `.traderslink.pro` and
  whether `/api/me` returns `authenticated: true`.

## 2026-05-23 - Academy SVG Learner-Language Audit

Re-audited Academy course SVG copy after the live stock-trade mechanics graphic
included system-style text: "A quote is context for execution quality. It is not
a prediction or instruction."

Findings and changes:

- Replaced that line in
  `public/academy/images/trading-foundations/stock-trade-mechanics.svg` with
  the learner-facing sentence "Bid, ask, spread, depth, and order type shape the
  fill."
- Removed or rewrote visible SVG phrasing that used generic/system wording such
  as context, prediction, instruction, guarantee, promise, automatic, example
  only, context prompt, and execution quality.
- Kept useful trader-facing terms such as plan, rules, decision, invalidation,
  and fill quality where the text teaches a concrete lesson concept.

Verification:

- Regex audit found no remaining visible `<text>` nodes containing `context`.
- Regex audit found no remaining SVG hits for the bad disclaimer/system terms:
  prediction, predict, instruction, guarantee, promise, certain, example only,
  automatic, automatically, not a, not an, does not, trade instructions, context
  prompt, context-not phrasing, execution quality, level quality, or
  contextable.
- Parsed all `public/academy/images/**/*.svg` files as XML successfully.
- `npm run validate:academy-registry` passed with the expected non-Academy-ready
  markdown warnings.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build:webpack` passed with the existing support-resistance dynamic
  dependency warning.
- Deployed production from the clean
  `traderslink-news-on-live-academy-20260523` worktree. Vercel deployment
  `dpl_Bc9BwoUCAYiUMCWTCvoGJWwCDqUo` is Ready and aliased to
  `https://traderslink.pro`.
- Live direct-asset verification confirmed
  `/academy/images/trading-foundations/stock-trade-mechanics.svg` returns the
  replacement line and no longer returns the removed "A quote is context..."
  sentence.
- Live scan fetched all 89 changed Academy SVG assets from `traderslink.pro`
  and found no remaining visible `context` text or bad disclaimer/system terms.

Current best next step:

- Continue the news article storage/deploy work from the clean
  `traderslink-news-on-live-academy-20260523` worktree once the production
  database details are available.

## 2026-05-24 - Shared Site Shell And Workspace Route Uptime

Reconciled the shared website top navigation onto the current live-source
worktree without changing the workspace app URL structure.

Changes:

- Added `src/components/site/site-shell.tsx` as the shared client shell for
  top-nav, theme, auth status, social links, and mobile menu behavior.
- Kept `app/site-shell.tsx` as a compatibility export for routes or future
  work that still expects the app-level shell module.
- Reduced `app/academy/academy-shell.tsx` to a thin Academy wrapper around the
  shared shell, and moved News pages to import `SiteShell` directly.
- Kept the existing Academy CSS class contract so the live Academy topbar visual
  system is not forked or recreated.
- Kept the current workspace app URLs as-is: `/workspace`, `/analytics`,
  `/review`, `/trades`, `/imports`, `/coach`, and related nested pages.
- Fixed the Vercel-only workspace crash by changing the default SQLite fallback
  path from `process.cwd()/data/trader-intelligence.sqlite` to the writable OS
  temp directory when running on Vercel or production without an explicit
  `TRADER_INTELLIGENCE_DB_PATH`.

Important storage note:

- The temp-directory SQLite fallback is an uptime fix for the current Vercel
  deployment, not durable production user storage. Trader Intelligence still
  needs a real durable database adapter/configuration for saved workspace data.

Verification:

- `npm run validate:academy-registry` passed with the expected non-Academy-ready
  markdown warnings.
- Focused lint for touched shell/news/storage files passed.
- `npx tsc --noEmit --pretty false` passed.
- Focused Vitest suite for SQLite import commit, saved import API routes, and
  Academy Discord auth passed: 5 files, 33 tests.
- `npm run build:webpack` passed with the existing support-resistance dynamic
  dependency warning.
- Production deploy from this clean worktree completed, and live route smoke
  returned 200 for `/`, `/academy`,
  `/academy/what-is-a-stock-and-how-does-a-trade-work`, `/news/FJET`,
  `/workspace`, `/upload-csv`, `/imports`, `/review`, `/analytics`, `/coach`,
  `/progress`, `/trades`, `/account`, and `/platform-readiness`.
- A post-smoke Vercel 500-log query found no new 500 logs.

Current best next step:

- Replace the temp-directory SQLite fallback with a durable Trader Intelligence
  database adapter/configuration while keeping the current workspace app URLs
  stable.

## 2026-05-24 - Academy Secondary Button Hover Contrast

Fixed the Academy course listing secondary button hover contrast.

Changes:

- Updated the shared Academy button transition to include border and text color.
- Added an explicit `.academy-button-secondary:hover` and focus-visible color
  rule so the "Academy Home" secondary button switches to the theme's
  `--academy-on-primary` text color when the hover background becomes primary.
- This makes light mode use white text on the blue hover background while dark
  mode keeps the theme-correct dark text on its light-blue hover background.

Verification:

- `npm run build:webpack` passed with the existing support-resistance dynamic
  dependency warning.

## 2026-05-25 - Trader Intelligence Route Namespace

Moved the Trader Journal / Trader Intelligence product into a single
professional website namespace under `/intelligence`.

Changes:

- Moved the former top-level product routes under `app/intelligence`, including
  the workspace dashboard, upload/import flow, review queue, analytics, coach,
  progress, trades, import health/trials, review cockpit, calibration,
  onboarding, session recap, compare trades, debug pages, and broker mapping
  admin.
- `/intelligence` is now the product home that replaces the old `/workspace`
  page.
- Added `app/intelligence/layout.tsx` so Intelligence uses the shared website
  `SiteShell` while keeping `src/components/site/site-shell.tsx` as the
  website-owned nav component.
- Added a `SiteShell` wrapper element option so app/product pages can keep their
  own `<main>` landmarks without nesting them inside another `<main>`.
- Rewrote app/product links and Trader Intelligence route contracts to point at
  `/intelligence/...`.
- Kept API routes stable under `/api/...`; this pass changed user-facing page
  routes, not API contracts.
- Added Next redirects for the old public routes:
  `/workspace`, `/analytics`, `/trades`, `/review`, `/imports`, `/coach`,
  `/progress`, `/upload-csv`, `/trader-intelligence`, import diagnostics,
  debug routes, and related workflow pages now redirect into `/intelligence`.

Verification:

- `npm run validate:academy-registry` passed with the expected non-Academy-ready
  markdown warnings.
- `npx tsc --noEmit --pretty false` passed after clearing stale generated
  `.next` route type files.
- Focused route/product tests passed:
  `platform-ready-feature-module`, `map-user-facing-behavior`,
  `saved-import-api-routes`, and `saved-trade-threads` passed 116 tests.
- `npm run build:webpack` passed and the route table now shows the Intelligence
  product under `/intelligence/...`, with the existing support-resistance
  dynamic dependency warning.

Known non-routing test caveat:

- The broader `trader-import-automated-qa-harness` suite still has CSV fixture
  expectation failures around missing-symbol/missing-price/open-leftover
  handling and generic short grouping. Those failures are unrelated to the route
  namespace migration and were not changed in this structural pass.

Current best next step:

- Deploy the `/intelligence` route namespace migration, smoke-test new routes
  and old redirects live, then continue the durable Trader Intelligence database
  adapter work separately.

# 2026-06-08 Trader Intelligence v2 candle/coaching handoff package

- Added `src/docs/trader-intelligence-v2-candle-coach-analytics-handoff-2026-06-08.md`
  to `main` as the handoff package for the completed local Trader Intelligence
  v2 candle/levels/coaching/analytics QA work.
- The app implementation package remains committed on
  `codex/trader-ui-product-pass` through `8641300e`.
- A direct local merge into `main` was attempted in a clean temporary worktree,
  but was aborted because `main` has the newer `/intelligence` route namespace
  and journal-level-analysis UI work; resolving that safely requires a
  deliberate port/merge pass rather than accepting one side wholesale.
- The next chat should run a fresh isolated IBKR statement-period calibration
  using a different/smaller statement and the handoff prompt in the new doc.

# 2026-05-25 whole-site source-of-truth audit

- Verified the pre-audit Vercel production deployment for `vercel-landing` was `dpl_5kdq544VSxoobgEsy1ftv52VVYfD` and pointed at commit `81e175909c6f0ad68481fbfc800259c32485251d` (`Move Trader Intelligence under intelligence namespace`).
- Verified `C:\Users\jerac\Documents\TraderLink` is only a parent workspace; the live-aligned website worktree before permanent promotion was `deploy-candidates/traderslink-news-on-live-academy-20260523` on `codex/news-on-live-academy`.
- Added source-of-truth docs in `docs/site-architecture.md`, `docs/routes.md`, `docs/deployment.md`, `docs/auth.md`, and `docs/codex-project-log.md`.
- Added the missing `/news` index page under the shared site shell and added a recent News article listing API in `src/lib/news/news-article-store.ts`.
- Replaced visible legacy "workspace" labels in the Intelligence app with "Intelligence" or "review hub" wording while preserving route compatibility and test ids.
- Removed the empty local `app/workspace` directory.
- Initially kept production undeployed until the source tree was clean and verified; the follow-up deploy promoted commit `7e6c5a4e50ef8f988fdbc2c43d5f985047853ace`.

# 2026-05-25 permanent website repo promotion

- Promoted the clean production-aligned website into
  `C:\Users\jerac\Documents\TraderLink\traderslink.pro`.
- Cloned from `origin/codex/news-on-live-academy` and copied the Vercel project
  link so CLI commands in the permanent repo target `vercel-landing`.
- Verified the latest production deployment after the source-of-truth deploy is
  `dpl_EKrvi1wn3BZvGt48xhr3xQFPDV2f`, created by Vercel CLI from commit
  `7e6c5a4e50ef8f988fdbc2c43d5f985047853ace`.
- Verified the current branch tracks `origin/codex/news-on-live-academy` and
  the deployed commit exists on the remote.
- Added warning README files for the parent workspace and stale sibling folders.
- Best next operational step: decide whether to keep CLI production deploys from
  `codex/news-on-live-academy` short term or merge/promote this branch to
  `main` and configure Vercel production to track `main`.

# 2026-05-25 site QA follow-up

- Added a shared primary navigation row to `src/components/site/site-shell.tsx`
  for Academy, News, Intelligence, Account, and Readiness.
- Put `/account` and `/platform-readiness` inside the shared site shell so they
  no longer sit outside the site-wide topbar.
- Corrected News ticker/article shell context to `sectionHref="/news"` and
  `sectionLabel="News"`.
- Used `shellElement="div"` on News index/ticker pages to avoid nested `<main>`
  landmarks.
- Mirrored the primary site destinations in the homepage hero nav.

# 2026-06-09 v2 levels/candle shared-behavior port to main worktree

- Continued the deliberate port on
  `C:\Users\jerac\Documents\TraderLink\trader-intelligence-v2-main-merge`
  branch `codex/port-v2-candle-analytics-main`; this is not a direct merge from
  `codex/trader-ui-product-pass`.
- Preserved main's `/intelligence` route namespace and journal-level-analysis
  work; no files under `app/intelligence`, `src/lib/level-analysis`, or the
  level-analysis API routes were changed in this shared-behavior pass.
- Ported the v2-only levels integration to active shared libraries:
  `levels-system-v2/support-resistance-engine` is the package dependency and
  `serverExternalPackages` entry, while the old tracked
  `vendor/levels-system-phase1` tree is removed.
- Added the warehouse/IBKR-aware v2 support-resistance path that uses stored
  daily/4h candles when present and treats missing 5m/trade-window data as
  fetch-required rather than paid evidence.
- Carried v2 level quality metadata through PatternInput and decision-review
  market context: importance, freshness, extension flags, synthetic-extension
  flags, zone width, source strength, reaction strength, and score are preserved
  only when a real v2 level exists.
- Updated levels/summary/audit tests so support/resistance evidence can be
  present without claiming formal market structure; market-structure calibration
  now blocks promotion when the v2 adapter has no market-structure read.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run verify:levels-system -- --reporter=dot` passed: 21 files, 84 tests.
- Focused trader analytics/coach/review Vitest passed: 5 files, 54 tests.
- `npm run build:webpack` passed and confirmed the `/intelligence/...` route
  table and level-analysis APIs remain present.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop` ran against the built app but failed 12 tests
  because that spec still hard-codes the pre-main `/workspace`, `/coach`,
  `/trades`, and `/analytics` route contracts and href expectations. Four tests
  passed. The next UI-port step should update the E2E spec and product-pass UI
  route assumptions to main's `/intelligence` namespace rather than changing app
  routes backward.

Best next step:

- Commit this shared v2 candle/levels behavior port if the route-namespace
  Playwright caveat is accepted, then do a second deliberate UI/test port that
  adapts product-pass pages and Playwright expectations to `/intelligence` while
  preserving journal-level-analysis.

# 2026-06-09 `/intelligence` feature-regression spec port

- Continued the deliberate main port on
  `C:\Users\jerac\Documents\TraderLink\trader-intelligence-v2-main-merge`
  branch `codex/port-v2-candle-analytics-main`.
- Updated `tests/e2e/app-feature-regression.spec.ts` to exercise main's current
  `/intelligence` route namespace instead of the older top-level
  `/workspace`, `/coach`, `/trades`, `/analytics`, `/imports`, and
  `/import-dry-run` route assumptions.
- Preserved the app route shape; this pass changes the QA contract, not product
  routes. It keeps the journal-level-analysis work and `/intelligence`
  namespace intact.
- Aligned the spec with current main UI copy and fixture behavior:
  `/intelligence/upload-csv` uses "Upload your broker CSV",
  `/intelligence/imports` uses "Import History" and the import recovery queue,
  `/intelligence/import-dry-run` uses "Advanced Import Check", coach overview
  uses the current coaching-focus panel, analytics uses the report categories
  panel, and ticker-story navigation is conditional when no same-day re-entry
  story exists.
- Kept market-context QA focused on the paid-tier rule: candle/level claims only
  count when real chart evidence exists; execution-only paths remain
  observational.

Verification:

- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.
- `npx tsc --noEmit --pretty false` passed.
- `npm run verify:levels-system -- --reporter=dot` passed: 21 files, 83 tests.
- Focused trader analytics/coach/review Vitest passed: 5 files, 54 tests.

Best next step:

- Commit this scoped E2E namespace port, then continue the deliberate UI port
  from `codex/trader-ui-product-pass` in small pieces: shared behavior first,
  UI components second, always adapted to main's `/intelligence` routes and
  without restoring old levels-system v1/phase1.

# 2026-06-09 analytics chart-tier gate port

- Continued the deliberate port from `codex/trader-ui-product-pass` by taking
  only a route-safe analytics behavior improvement and adapting it to main's
  `/intelligence` namespace.
- Added a chart-tier/evidence gate to
  `app/intelligence/analytics/analytics-client.tsx`:
  chart-evidence counts, support/resistance handoff links, the chart-evidence
  report section, and market-context review panel now render only when
  `chartTierEnabled` is true.
- Kept execution-only analytics available for the free tier: results, timing,
  behavior, ticker/session story execution summaries, review planning, trade
  explorer, and details remain reachable without chart evidence.
- Added an execution-only fallback panel for
  `/intelligence/analytics/chart-evidence` so the page explains that candle,
  support, and resistance summaries require saved chart context instead of
  making unsupported claims.
- Derived `chartTierEnabled` in `app/intelligence/analytics/page.tsx` from
  demo/sample mode or at least one persisted completed decision-review snapshot.
  Queued/failed hydration does not count as paid chart evidence.
- Did not port product-pass route rollbacks to top-level `/analytics` or
  `/trades`; all links remain under `/intelligence`.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused analytics/product Vitest passed: 4 files, 40 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.
- `npm run verify:levels-system -- --reporter=dot` passed: 21 files, 83 tests.

Best next step:

- Continue the product-pass inventory one surface at a time, starting with
  saved-trades or coach UI deltas, and port only changes that preserve
  `/intelligence`, journal-level-analysis, and levels-system-v2-only evidence
  rules.

# 2026-06-09 saved-trades coach ticker-story handoff port

- Continued the saved-trades product-pass inventory without direct-merging
  `codex/trader-ui-product-pass`.
- Ported the route-safe ticker-story coach handoff behavior into main's current
  `/intelligence` route shape:
  - `app/intelligence/coach/page.tsx` now builds ticker-story links with
    `from=coach` and an optional focus label while keeping
    `/intelligence/trades/ticker-story/...` URLs.
  - `app/intelligence/trades/ticker-story/[threadId]/page.tsx` now accepts
    coach handoff query params and shows a focused coach handoff panel when
    opened from coach.
- Preserved main's existing hold-continuation ticker-story section and did not
  delete or replace `trade-detail-level-facts.tsx`.
- Kept the paid/free evidence rule in the handoff panel: chart context is shown
  only as saved findings when present; otherwise the page says execution replay
  only and explicitly avoids support/resistance claims.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused saved-thread/coach Vitest passed: 3 files, 49 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.
- `npm run verify:levels-system -- --reporter=dot` passed: 21 files, 83 tests.

Best next step:

- Continue saved-trades porting with `app/intelligence/trades/page.tsx`, taking
  only route-safe UI/product improvements from product-pass and avoiding any
  top-level `/trades` route rollback or journal-level-analysis deletion.

# 2026-06-09 saved-trades chart-evidence gate port

- Continued the saved-trades product-pass port in main's
  `app/intelligence/trades/page.tsx` without importing the product-pass
  top-level `/trades` route structure.
- Added the same concrete chart evidence gate used by analytics: saved chart
  context is enabled for sample preview or when at least one persisted completed
  decision-review snapshot exists. Queued or failed hydration does not count.
- When chart context is not enabled, the saved-trades page now:
  - builds ticker/session story context without decision-review snapshots,
  - hides chart-specific story filters,
  - hides chart findings, add-quality, after-exit, protected-before-fade,
    support/resistance, level, volume, and needs-chart-data counts,
  - hides per-story chart/support/resistance/volume badges.
- Execution-only browsing remains available for the free tier: round trips,
  calendar, day sessions, ticker stories, open trades, and review navigation
  still render.
- Did not port product-pass swing-trade closure actions or route rollbacks; that
  requires a separate deliberate pass.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused saved-trade Vitest passed: 2 files, 40 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.
- `npm run verify:levels-system -- --reporter=dot` passed: 21 files, 83 tests.

Best next step:

- Continue with the saved-trade detail page diff, carefully preserving
  `app/intelligence/trades/[tradeId]/trade-detail-level-facts.tsx` and the
  journal-level-analysis panels while porting only route-safe UI improvements.

# 2026-06-09 trade-detail chart-evidence gate port

- Continued the saved-trade detail product-pass port manually in
  `app/intelligence/trades/[tradeId]/page.tsx`.
- Preserved main's journal-level-analysis work:
  `trade-detail-level-facts.tsx`, its imports, availability line, and supporting
  detail panel remain intact.
- Changed trade-detail ticker/session story context to use this trade's own
  completed decision-review snapshot before rendering chart/support-resistance
  claims. If the trade has no completed snapshot, the page keeps the review
  execution-only and filters chart evidence cards, priority market-context
  findings, support/resistance metrics, volume metrics, add-quality chart
  metrics, and after-exit/protected-profit chart metrics out of the main trade
  detail context.
- Kept queued/failed chart review diagnostics visible as chart-data-needs-review
  style copy, but with explicit execution-replay-only scope until evidence is
  attached.
- Tightened replay/status copy so saved fills are the source of truth unless
  this trade has saved chart evidence.
- Did not port the product-pass rewrite that removes level-facts or rolls links
  back to top-level `/trades`.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused trade-detail/review Vitest passed: 3 files, 52 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.
- `npm run verify:levels-system -- --reporter=dot` passed: 21 files, 83 tests.

Best next step:

- Continue the deliberate saved-trades/detail port with smaller UI polish from
  product-pass only after checking it does not delete journal-level-analysis or
  reintroduce top-level route assumptions.

# 2026-06-09 trade-detail candle-basis diagnostics port

- Continued the deliberate `codex/trader-ui-product-pass` port without a direct
  merge.
- Kept main's `/intelligence/trades/[tradeId]` route shape and preserved the
  journal-level-analysis trade-detail facts panel.
- Ported the trade-detail candle basis/provider warning copy into
  `app/intelligence/trades/[tradeId]/page.tsx`:
  - completed decision-review snapshots still unlock paid chart context,
  - free/execution-only or no-snapshot trades stay fill-only,
  - snapshots with candle price-basis warnings now say to use broker execution
    P/L for movement conclusions until the basis is reconciled,
  - saved chart/level context can still be shown as supporting context, but the
    page avoids treating candle movement as settled evidence when basis is
    unsafe.
- Aligned the trade-detail chart-tier inference with analytics/saved-trades:
  sample mode or at least one persisted completed saved decision-review snapshot
  enables chart-context tier UI, while the current trade still requires its own
  completed snapshot before chart/support-resistance claims render.
- Did not restore or import old levels-system v1/phase1; levels work remains on
  `levels-system-v2/support-resistance-engine`.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run verify:levels-system -- --reporter=dot` passed: 21 files, 83 tests.
- Focused trader/level Vitest passed: 5 files, 109 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.

Best next step:

- Continue the product-pass inventory with another small, route-safe slice.
  Candidate: compare review/coach route UI deltas, port shared behavior only,
  and avoid any top-level route rollback or journal-level-analysis deletion.

# 2026-06-09 review queue candle-basis warning port

- Continued the review/coach product-pass inventory and manually ported only the
  route-safe review queue behavior.
- Preserved main's `/intelligence/review` namespace and preserved
  journal-level-analysis review queue level-facts fields/read model.
- Added `candleBasisStatus` to saved review queue items and a
  `candle_basis_warning` queue filter/tab when a completed decision-review
  snapshot carries unsafe candle basis notes.
- Updated `/intelligence/review` evidence copy so completed chart reviews with
  basis warnings say "Basis check needed" and keep movement conclusions anchored
  to broker execution P/L until candle basis is reconciled.
- Added a SQLite saved-review queue regression that persists a completed
  snapshot with an unsafe basis note and confirms the warning lane/filter.
- Did not port product-pass changes that remove level-facts, roll hrefs back to
  top-level `/review`, or add a separate tier-config module.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused repository/review queue Vitest passed: 2 files, 17 tests.
- `npm run verify:levels-system -- --reporter=dot` passed: 21 files, 83 tests.
- Focused trader/level Vitest passed: 7 files, 126 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.

Best next step:

- Continue with coach page product-pass deltas next, porting only behavior that
  preserves `/intelligence` routes and the paid/free evidence gate. Skip any
  route rollback or journal-level-analysis deletion.

# 2026-06-09 coach review-summary basis lane label

- Added the route-safe coach follow-up for the new review queue
  `candle_basis_warning` lane.
- `app/intelligence/coach/page.tsx` now labels that lane as "Candle basis
  check" instead of relying on generic fallback casing.
- `app/saved-review-queue-summary.tsx` now prefers a "Candle Basis Check" card
  linking to `/intelligence/review?queue=candle_basis_warning` when that queue
  has items.
- Preserved all `/intelligence` routes and did not port the larger product-pass
  coach rewrite because it includes stale top-level route assumptions.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused coach/repository Vitest passed: 2 files, 21 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.

Best next step:

- Continue the coach product-pass inventory only after isolating route-safe
  helper/scoring changes from stale `/coach` and `/trades` href changes.

# 2026-06-09 coach evidence-status copy gate

- Continued the coach product-pass inventory with a small route-safe copy gate
  in `app/intelligence/coach/page.tsx`.
- The coach route menu now says the behavior sequence is chart-supported only
  when completed decision-review snapshots exist. When chart jobs are queued,
  missing, or failed, it says the path is execution-supported while chart data
  needs review.
- The coach header status badge now says:
  - "chart evidence checked" when completed chart snapshots exist,
  - "chart data needs review" when pending/problem chart data exists,
  - "execution evidence checked" when no chart evidence is available.
- Added a calm link to `/intelligence/review?queue=candle_basis_warning` when
  the saved review queue has candle-basis warning items.
- Did not port the larger product-pass coach scoring/UI rewrite because it
  depends on queue story-link fields that need a separate route-safe contract
  port and the product-pass file still contains stale top-level hrefs.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused coach/repository Vitest passed: 2 files, 21 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.

Best next step:

- If continuing the coach product-pass port, next isolate the saved-review queue
  ticker-story linkage fields (`tickerStoryKey`, story review count, lead item)
  while preserving level-facts and `/intelligence` routes. That unlocks the
  smarter coach ticker-story focus selection without direct-merging product-pass.

# 2026-06-09 review queue ticker-story linkage contract

- Ported the route-safe saved-review queue ticker-story linkage fields from the
  product-pass branch without taking the stale route or level-facts deletions.
- `SavedReviewQueueItem` now carries:
  - `sessionDate`,
  - `tickerStoryKey`,
  - `tickerStoryHref` under `/intelligence/trades/ticker-story/...`,
  - `tickerStoryReviewCount`,
  - `tickerStoryLead`.
- The highest-priority queue now collapses repeated same-symbol same-session
  review items to the first lead item while `allItems` still preserves every
  trade. This gives coach a clean story-level focus hook without hiding saved
  trade detail data.
- Preserved journal-level-analysis `levelFacts` on queue items and preserved the
  `/intelligence/review` and `/intelligence/trades` route namespace.
- Added a SQLite regression for two same-symbol same-day review jobs to verify
  story metadata, story lead behavior, and highest-priority collapse.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused repository/level review queue Vitest passed: 2 files, 18 tests.
- `npm run verify:levels-system -- --reporter=dot` passed: 21 files, 83 tests.
- Focused trader/level Vitest passed: 7 files, 127 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.

Best next step:

- Use the new queue ticker-story fields to port the coach ticker-story focus
  selection helpers from product-pass, keeping all generated hrefs under
  `/intelligence` and preserving the paid/free evidence gate.

# 2026-06-09 coach ticker-story focus selection

- Used the new saved-review queue ticker-story linkage fields to port the
  route-safe coach ticker-story focus selector into
  `app/intelligence/coach/page.tsx`.
- The coach now prefers a multi-round-trip ticker story tied to the current
  coaching behavior or highest-priority review queue story before falling back
  to the generic priority ticker story.
- Kept the existing `/intelligence/coach/ticker-stories` panel and
  `/intelligence/trades/ticker-story/...` links; did not port the larger
  product-pass overview/review-session layout rewrite.
- Preserved the paid/free evidence gate: the selector can prioritize saved
  execution stories and chart-risk counts already present in the thread model,
  but chart claims still depend on completed decision-review snapshots.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused coach/repository Vitest passed: 2 files, 22 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.

Best next step:

- Continue reviewing the remaining coach product-pass UI deltas, but port only
  isolated route-safe pieces. Avoid the stale top-level `/coach`, `/review`, and
  `/trades` hrefs unless adapting them to `/intelligence`.

# 2026-06-09 coach copy helper polish

- Ported a small route-safe coach copy/helper polish slice from product-pass into
  `app/intelligence/coach/page.tsx`.
- Added helper copy functions for:
  - singular/plural route count labels,
  - avoiding repeated focus lead wording,
  - cleaner trade review titles.
- Updated coach route count labels to avoid text like "1 trades" and adjusted
  the primary action copy so repeated focus labels do not read redundantly.
- Preserved all `/intelligence` routes and did not change data contracts,
  chart-evidence gates, or level-analysis behavior.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused coach/repository Vitest passed: 2 files, 22 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.

Best next step:

- Continue remaining coach product-pass review manually. Larger layout changes
  should only be ported if their hrefs are adapted to `/intelligence` and their
  evidence claims stay gated by completed chart snapshots.

# 2026-06-09 coach ticker-story focus overview panel

- Added a route-safe overview panel to `app/intelligence/coach/page.tsx` that
  surfaces the focused ticker story selected by the coach ticker-story focus
  helper.
- The panel links to `/intelligence/trades/ticker-story/...` and
  `/intelligence/review?queue=highest_priority`, preserving main's route
  namespace.
- Kept the primary coach action pointed at the evidence trade/review flow so
  existing review-session behavior and Playwright expectations stay stable.
- Did not change data contracts, chart-evidence gates, level-analysis behavior,
  or levels-system-v2 usage.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused coach/repository Vitest passed: 2 files, 22 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.

Best next step:

- Continue manual coach UI inventory. Candidate: review-session page copy can
  acknowledge the focused ticker story, but only if links remain under
  `/intelligence` and the single-trade replay path remains available.

# 2026-06-09 coach review-session ticker-story link

- Added a small route-safe review-session handoff inside
  `app/intelligence/coach/page.tsx`.
- The existing `Featured Evidence Trade` panel now shows a related ticker-story
  link when the coach has selected a focused ticker story.
- Preserved the single-trade replay path and the tested
  `coach-featured-trade-session` copy contract.
- Kept the ticker-story link under `/intelligence/trades/ticker-story/...` and
  did not change chart-evidence gates, level-analysis behavior, or
  levels-system-v2 usage.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused coach/repository Vitest passed: 2 files, 22 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.

Best next step:

- Continue the remaining product-pass inventory only if the next UI delta can be
  isolated from stale top-level route assumptions. Otherwise move to final
  branch-level verification and prepare the port branch for review.

# 2026-06-09 coach/product-pass port branch verification

- Ran a branch-level verification pass after the route-safe coach/review queue
  product-pass slices.
- Current branch state keeps:
  - `/intelligence` route namespace,
  - journal-level-analysis trade detail and review queue level-facts,
  - levels-system-v2-only support/resistance behavior,
  - free/execution-only versus paid/completed-snapshot chart evidence gates.
- Remaining direct diffs against `codex/trader-ui-product-pass` are still large
  and should not be merged blindly. The largest remaining areas include coach
  and review layout rewrites with stale top-level route assumptions, plus
  product-pass queue changes that would remove or bypass main's level-facts
  read model unless adapted manually.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run verify:levels-system -- --reporter=dot` passed: 21 files, 83 tests.
- Focused trader/coach/level Vitest passed: 8 files, 137 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.

Best next step:

- Prepare this port branch for review or continue only with manually isolated
  product-pass deltas. Do not direct-merge product-pass into main; keep adapting
  individual changes to `/intelligence` and preserving journal-level-analysis.

# 2026-06-09 saved review queue loss-aware priority port

- Ported the route-safe saved-review-queue loss-priority slice from
  `codex/trader-ui-product-pass` into main's current read model.
- Completed chart-risk review items now get a bounded priority bump when the
  saved trade has a meaningful realized loss.
- Queue sorting now uses realized loss as a tie-breaker after priority score so
  larger losing chart-risk items surface first.
- Improved saved-review queue P/L lookup to prefer the analytics report's
  `sourceTradeIds` mapping before falling back to symbol/session/direction,
  which keeps same-symbol same-session ticker-story items from inheriting the
  wrong P/L row.
- Preserved `/intelligence` routes, journal-level-analysis queue level-facts,
  completed-snapshot chart evidence gates, and levels-system-v2-only behavior.
- Added a regression covering two completed same-symbol chart-risk trades where
  the losing trade becomes the collapsed ticker-story lead.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused saved-import repository Vitest passed: 1 file, 13 tests.
- Focused trader/coach/level Vitest passed: 8 files, 142 tests.
- `npm run verify:levels-system -- --reporter=dot` passed: 21 files, 83 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.

Best next step:

- Commit this scoped queue-priority slice, then continue remaining
  product-pass inventory only for isolated behavior that can be adapted to
  `/intelligence` without removing level-facts or weakening chart-evidence
  gates.

# 2026-06-09 free-vs-chart tier gate port

- Ported the product-pass Trader Intelligence tier contract into main:
  - `free_execution` keeps execution analytics enabled and chart context off.
  - `chart_context` keeps execution analytics plus candle/chart context on.
  - AI remains a separate add-on flag and is not treated as a base tier.
- Added server-level chart-context gates for:
  - analytics behavior reports,
  - saved review queue read models.
- Wired the gate into the current `/intelligence` namespace instead of the
  stale top-level product-pass routes:
  - `/intelligence`,
  - `/intelligence/analytics`,
  - `/intelligence/coach`,
  - `/intelligence/progress`,
  - `/intelligence/review`,
  - `/intelligence/trades`,
  - `/intelligence/trades/[tradeId]`,
  - `/api/review/latest`.
- Free tier mode now keeps saved chart snapshots in storage but does not pass
  them into chart-evidence behavior/thread/queue read models for those routes.
- Trade-detail journal-level-analysis facts and review-queue level-facts now
  stay hidden/feature-disabled when chart context is not allowed.
- Preserved journal-level-analysis code paths for chart-context mode and
  levels-system-v2-only support/resistance behavior.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused tier/queue/behavior Vitest passed: 4 files, 24 tests.
- Focused trader/coach/level Vitest passed: 9 files, 146 tests.
- `npm run verify:levels-system -- --reporter=dot` passed: 21 files, 83 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.

Best next step:

- Add a small Playwright or route-handler regression that runs with
  `TRADER_INTELLIGENCE_TIER=free_execution` and asserts chart-evidence panels
  stay gated while execution-only analytics remain visible.

# 2026-06-09 free-tier latest review API regression

- Added a route-handler regression for `/api/review/latest` using an isolated
  saved-import SQLite database.
- The test commits a closed trade, completes persisted chart review with
  levels-system-v2 sample support/resistance context, and verifies:
  - `chart_context` exposes the completed saved decision-review snapshot and
    completed queue item,
  - `free_execution` keeps the guided review payload available,
  - `free_execution` returns `savedDecisionReview: null`,
  - `free_execution` hides the completed chart-review queue item.
- This proves the free tier remains execution-only even when paid-tier chart
  snapshots exist in storage.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused tier/API/queue/behavior/level-facts Vitest passed: 5 files, 37 tests.

Best next step:

- Continue remaining product-pass inventory only for isolated behavior that can
  be adapted to `/intelligence` without direct-merging stale top-level routes or
  removing journal-level-analysis.

# 2026-06-09 chart review retry and diagnostic cleanup port

- Ported the isolated decision-review retry behavior from product-pass without
  the larger background `after()` scheduling route rewrite.
- `provider_timeout` now maps to `market_context_unavailable` instead of a hard
  analysis failure, so user-facing copy remains "market data missing/retry"
  rather than implying chart analysis is complete or trusted.
- `runPersistedDecisionReviewJobs(...)` now accepts
  `retryFailedChartDataReview` and can explicitly retry
  `analysis_failed`/`market_context_unavailable` jobs.
- Successful retry now deletes stale decision-review diagnostics for the saved
  trade before saving the completed snapshot.
- The import-batch decision-review resume route now detects retryable failed
  jobs and reports `mode: "retry_failed_chart_data"` when those jobs are the
  selected work pool.
- Added a regression covering:
  - initial provider timeout,
  - persisted market-context diagnostic,
  - explicit retry after market data is available,
  - completed snapshot persistence,
  - stale diagnostic cleanup.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused repository/API Vitest passed: 2 files, 27 tests.
- Focused trader/API/coach/level Vitest passed: 10 files, 160 tests.
- `npm run verify:levels-system -- --reporter=dot` passed: 21 files, 83 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.

Best next step:

- Continue product-pass inventory only for narrow server/read-model behavior.
  Leave the larger background resume scheduling and top-level route rewrites for
  a separate deliberate pass.

# 2026-06-09 chart review status route port

- Ported the isolated decision-review status API from product-pass into the
  current import-batch API namespace:
  `/api/import-batches/[batchId]/decision-review/status`.
- The route reports saved-trade count, execution count, job status counts,
  snapshot/diagnostic counts, retryable failed count, pending work count, and a
  calm next action.
- The status read model aligns with the retry semantics from the prior slice:
  queued jobs and retryable failed chart-data jobs count as pending work, and
  completed chart snapshots are reported separately.
- Added a saved-import API regression proving a newly committed import exposes
  queued chart-review status and `canResume: true`.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused saved-import API route Vitest passed: 1 file, 13 tests.

Best next step:

- Continue product-pass inventory only for narrow behavior/read-model slices.
  Avoid the stale top-level import page rewrites unless intentionally adapting
  them into `/intelligence`.

# 2026-06-09 chart review retry copy port

- Ported the remaining narrow saved-decision-review copy from product-pass while
  preserving main's `/intelligence` routes and journal-level-analysis work.
- The saved decision-review read model now tells the user to retry chart data
  review after market data is connected and explicitly says support/resistance
  conclusions stay hidden until that succeeds.
- Left stale product-pass route rewrites (`/imports`, `/trades`,
  `/analytics`) unported because main owns the newer `/intelligence`
  namespace.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused repository Vitest passed: 1 file, 14 tests.

Best next step:

- Continue inventorying product-pass server/product diffs for behavior that
  improves chart evidence gating without changing route namespaces.

# 2026-06-09 review queue chart-data wording port

- Ported the low-risk saved-review-queue wording improvements from
  product-pass while preserving main's `/intelligence` links and
  journal-level-analysis level-facts read model.
- Missing market context now says execution review is available but candle and
  level evidence is still missing, with an execution-replay-only scope.
- Analysis failures now say chart data needs another check before candle or
  level feedback is trusted, instead of using vague technical-follow-up copy.
- Pinned the market-context-unavailable queue item copy in the existing SQLite
  saved review queue regression.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused saved-import/review queue Vitest passed: 2 files, 27 tests.

Best next step:

- Continue the product-pass inventory without stale route rewrites; prioritize
  behavior/read-model slices that reinforce execution-only versus chart-evidence
  boundaries.

# 2026-06-09 analytics behavior chart-confirmed copy port

- Ported the low-risk analytics behavior report wording from product-pass while
  preserving main's `/intelligence/trades` fallback link.
- Empty states now say "chart-confirmed" rather than "certified", keeping paid
  chart evidence language closer to the actual requirement: completed candle and
  support/resistance context must exist before the app makes those calls.
- Add-quality copy now asks what confirmation was present before adding size.
- Pinned the chart-confirmed empty-state language in the analytics behavior
  report regression.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused analytics behavior Vitest passed: 1 file, 2 tests.

Best next step:

- Continue product-pass inventory for narrow behavior/copy/read-model slices
  that can be adapted without stale route changes.

# 2026-06-09 product-pass port verification checkpoint

- Completed a broader verification pass after the latest manual port slices:
  - chart review retry copy,
  - review queue chart-data state copy,
  - analytics behavior chart-confirmed copy.
- Remaining product-pass diffs are intentionally not direct-merged because they
  mostly rewrite current `/intelligence` paths back to stale top-level routes,
  remove or bypass journal-level-analysis level-facts, add broad customer-data
  filtering, or change unrelated import grouping behavior.
- The branch is still preserving:
  - levels-system-v2 only,
  - free tier execution-only gating,
  - paid chart-context behavior only when completed saved decision-review
    snapshots exist,
  - main's `/intelligence` namespace,
  - journal-level-analysis work.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run verify:levels-system -- --reporter=dot` passed: 21 files, 83 tests.
- Focused trader analytics/import/coach/level Vitest passed: 5 files, 60 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.

Best next step:

- If continuing the port, inspect remaining product-pass diffs one at a time and
  only port behavior that can be adapted to `/intelligence` without changing
  level-facts or execution-only versus chart-evidence gates.

# 2026-06-09 background chart review resume port

- Deliberately ported the background chart-review resume behavior into main's
  current `/api/import-batches/[batchId]/decision-review/resume` route.
- Used the existing guarded `next/server` `after(...)` scheduling pattern from
  the import commit route, after checking the local Next docs for `after`.
- The resume endpoint remains synchronous by default, but accepts
  `runInBackground: true` to return `202` with `background: true` and `run:
  null` while chart review continues after the response.
- Updated the `/intelligence/imports/[batchId]` action to request background
  resume and show the API's calm background message.
- Added an API regression proving background resume does not immediately mark
  chart evidence complete in test mode.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused saved-import API route Vitest passed: 1 file, 13 tests.
- `npm run verify:levels-system -- --reporter=dot` passed: 21 files, 83 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.

Best next step:

- Continue remaining product-pass inventory only for behavior that can be
  adapted to `/intelligence`; do not port stale top-level routes or remove
  journal-level-analysis level-facts.

# 2026-06-10 import detail chart hydration polling

- Expanded the `/intelligence/imports/[batchId]` chart review action from a
  one-shot background start into a small status-polling hydration loop.
- The client now starts background batches with `runInBackground: true`, polls
  `/api/import-batches/[batchId]/decision-review/status`, waits for completed
  or failed work to move before starting another batch, and exposes a stop
  action after the current progress check.
- The panel shows completed, waiting, retryable, and ready counts so users can
  keep reviewing executions without assuming candle/level evidence is complete.
- The import details page now shows the hydration action for retryable
  chart-data failures as well as queued jobs, and uses "chart data needs another
  check" copy instead of vague technical-follow-up language.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused saved-import API route Vitest passed: 1 file, 13 tests.
- `npm run verify:levels-system -- --reporter=dot` passed: 21 files, 83 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.
- Browser check on a temporary local dev server at `127.0.0.1:3101` passed:
  a committed import with one queued chart-review job showed the hydration
  panel, progress counts, start/refresh controls, and transitioned to
  `Hydrating...` after clicking start. The status endpoint then reported one
  completed snapshot and no pending work.

Best next step:

- Commit this polling slice, then continue with a real May IBKR hydration pass
  against the isolated QA database to confirm the same progress behavior on the
  larger statement.

# 2026-06-10 May IBKR isolated chart-evidence QA

- Ran the May IBKR activity statement through the saved-import path in an
  isolated local DB:
  `artifacts/may-ibkr-ui-qa/may-ui-qa.sqlite`.
- Source file:
  `C:\Users\jerac\Documents\IBKR activity statments\U21845737_202605_202605.csv`.
- Import result:
  - 523 statement rows,
  - 244 accepted executions,
  - 93 saved trades,
  - 93 decision-review jobs,
  - 0 open positions.
- Temporary QA server used `LEVELS_SYSTEM_PROVIDER=ibkr`,
  `LEVELS_SYSTEM_ON_DEMAND_HYDRATION=true`, and
  `LEVELS_SYSTEM_WAREHOUSE_DIRECTORY=C:\Users\jerac\Documents\TraderLink\levels-system-post-mtf-handoff-stability\.validation-cache\candles`.
  This kept the run on levels-system-v2-backed candle storage and avoided old
  levels-system v1/phase1 data.
- The import detail polling hydrator progressed through background UI batches
  first, then the remaining queue was completed through direct 5-trade resume
  API batches after the UI loop stalled at 25 completed jobs.
- Final chart-review status:
  - 93 completed,
  - 0 queued,
  - 0 retryable,
  - 0 diagnostics,
  - 93 distinct snapshots,
  - 0 duplicate snapshots.
- Persisted snapshot evidence:
  - 93/93 snapshots use `levels_system_daily_4h` market context,
  - 83/93 snapshots use `levels_system_trade_window`,
  - 10/93 snapshots are explicitly `execution_only_fallback` for trade-window
    evidence rather than overclaiming missing intraday context,
  - replay windows are present for every completed snapshot.
- Representative trade-detail API checks:
  - ISPC trade 0 has a completed snapshot, v2 daily/4h market context,
    `levels_system_trade_window`, 56 replay candles, and 7 insights.
  - GME trade 2 has a completed snapshot, v2 daily/4h market context,
    `execution_only_fallback`, 192 replay candles, and 3 insights.
  - Before full hydration, queued DXF trade 50 had no snapshot, no diagnostics,
    no market-context source, and no trade-window evidence source.
- Re-checked live `/intelligence` pages with the isolated May DB:
  - import detail,
  - completed trade detail pages for ISPC, GME, and ADTX,
  - `/intelligence/review?queue=highest_priority`,
  - `/intelligence/analytics/chart-evidence`,
  - `/intelligence/analytics/behavior`,
  - `/intelligence/coach`,
  - `/intelligence/coach/review-session`.
- The live route scrape confirmed the active pages no longer show
  "technical follow-up" wording. Behavior analytics can show support/resistance
  language after this run because completed saved chart-evidence snapshots exist.
- Replaced remaining active user-facing "technical follow-up" labels with
  calmer "chart data needs another check" / "chart-data checks" wording across
  review, trade detail, import dry-run diagnostics, coach lane labels, saved
  review summaries, app state labels, and the matching language QA matrix.
- Stabilized the app-feature Playwright problem collector so blocked
  Google Analytics / Tag Manager requests do not fail app-surface regression
  checks; app request failures still fail the test.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run verify:levels-system -- --reporter=dot` passed: 21 files, 83 tests.
- Focused trader analytics/import/coach Vitest passed: 6 files, 55 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed after ignoring only
  external GA/GTM request failures: 16 passed, 1 skipped.
- `npx playwright test tests/e2e/import-dry-run.spec.ts
  --project=chromium-desktop --reporter=dot` is not currently a reliable
  verification target on this branch: 9 passed, 5 failed before the changed
  diagnostic assertion because the spec still depends on older top-level routes
  and stale visibility/copy assumptions.

Best next step:

- Commit the May QA/copy-stability slice, then either clean up the stale
  `tests/e2e/import-dry-run.spec.ts` route assumptions or continue the
  deliberate product-pass port one behavior/read-model slice at a time while
  preserving `/intelligence`, journal-level-analysis, and levels-system-v2 only.

# 2026-06-10 import dry-run Playwright route cleanup

- Cleaned up `tests/e2e/import-dry-run.spec.ts` so it targets the current
  `/intelligence` route namespace instead of relying on top-level redirects.
- Updated the Playwright webServer health URL to
  `/intelligence/import-dry-run`.
- Aligned import dry-run expectations with the current advanced import UI:
  - the page heading is `Advanced Import Check`,
  - the workflow strip is not part of this advanced page,
  - local CSV uploads reset broker override to `auto`, so generic CSV tests
    now reselect the broker after upload,
  - open-position checks use the current readiness summary instead of an old
    exact final-position sentence,
  - saved review queue checks use completed chart-evidence lanes when the
    background review completes,
  - repaired-import trade detail expects `Chart evidence ready` when a saved
    snapshot exists.
- Isolated the guided review app-feature regression from stale per-item queue
  wording by asserting the current queue shell and lane controls.

Verification:

- `npx playwright test tests/e2e/import-dry-run.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 14 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.
- Focused trader import Vitest passed: 2 files, 21 tests.
- `npx tsc --noEmit --pretty false` passed.

Best next step:

- Continue the deliberate product-pass port one behavior/read-model slice at a
  time, keeping `/intelligence`, journal-level-analysis, levels-system-v2 only,
  and the free execution-only versus paid chart-evidence boundary intact.

# 2026-06-11 tier chart-evidence boundary port

- Ported the useful tier-boundary behavior from `codex/trader-ui-product-pass`
  without taking its route rewrites or journal-level-analysis removals.
- Kept `/intelligence` links and the existing journal level-facts read model.
- Made shared analytics/coach behavior panels tier-aware:
  - chart-context/sample or completed-snapshot paths can say
    chart-supported/chart evidence,
  - free/no-chart paths say execution-supported/execution evidence.
- Made saved review summary cards tier-aware:
  - chart tier keeps chart-data queue cards,
  - free tier shows a saved trading baseline/open-or-carried follow-up instead
    of chart-review backlog claims.
- Tightened `buildSavedReviewQueueReadModel()` so
  `includeChartContext: false` no longer returns chart-only tabs such as
  `completed`, `market_context_unavailable`, `analysis_failed`,
  `candle_basis_warning`, or `queued`.
- Added `tests/e2e/tier-chart-evidence.spec.ts` for the free execution-only vs
  paid chart-context route matrix on `/intelligence` URLs.
- Updated the app-feature regression for the calmer coach CTA copy
  (`Open saved example`).

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed after edits. Existing Turbopack warnings remain about
  broad dynamic file patterns in academy/news stores.
- `npm run verify:levels-system -- --reporter=dot` passed: 21 files, 83 tests.
- Focused trader tier/behavior/saved-import Vitest passed: 4 files, 32 tests.
- Focused saved review queue/level-analysis Vitest passed: 3 files, 33 tests.
- `TRADER_INTELLIGENCE_TIER=free_execution npx playwright test
  tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop
  --reporter=dot` passed: 1 passed, 1 skipped.
- `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test
  tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop
  --reporter=dot` passed: 1 passed, 1 skipped.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.

Best next step:

- Review this tier-boundary slice, then commit it as the next deliberate
  product-pass port. After that, continue with another small read-model/UI slice
  only if it preserves `/intelligence`, journal-level-analysis, and
  levels-system-v2-only constraints.

# 2026-06-11 customer-facing synthetic data filter port

- Ported the non-route product-pass customer-data filter slice without taking
  product-pass route rewrites.
- Added `src/lib/trader-analytics/product/customer-data-filter.ts` to identify
  local synthetic tickers matching `E2E...`.
- Filtered local synthetic trades/reports before building customer-facing
  analytics, coach, review, progress, trades, ticker-story, and intelligence
  read models.
- Filtered saved review queue jobs by customer-visible saved trades so local
  synthetic E2E jobs do not appear as review backlog.
- Hid direct synthetic trade detail routes with `notFound()`.
- Added focused unit coverage for trade/report filtering and a Playwright
  guard that coach details do not surface `E2E...` symbols.
- Kept `/intelligence`, journal-level-analysis, and levels-system-v2-only
  constraints intact.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused customer-data/saved-import Vitest passed: 3 files, 30 tests.
- `npm run build` passed. Existing Turbopack warnings remain about broad
  dynamic file patterns in academy/news stores.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.
- `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test
  tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop
  --reporter=dot` passed: 1 passed, 1 skipped.
- `TRADER_INTELLIGENCE_TIER=free_execution npx playwright test
  tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop
  --reporter=dot` passed: 1 passed, 1 skipped.
- `npm run verify:levels-system -- --reporter=dot` passed: 21 files, 83 tests.

Best next step:

- Commit this customer-data filter slice. Then continue inspecting remaining
  product-pass diffs for another narrow read-model or copy improvement; skip
  route rewrites, academy/news deletions, and any changes that remove
  journal-level-analysis.

# 2026-06-11 open-or-swing review lane copy pass

- Continued the deliberate product-pass inspection and skipped stale route
  rewrites from `codex/trader-ui-product-pass`.
- Kept `/intelligence`, journal-level-analysis, levels-system-v2-only, and the
  free execution-only versus paid chart-evidence boundary intact.
- Aligned blocked open-position review language across shared read models and
  route pages:
  - queue/tab status now says `Open or Swing Trades`,
  - trade detail, import detail, review, coach, import dry-run diagnostics, and
    saved review summary use `open or swing`/`open or carried` consistently,
  - navigation actions such as `Open trade review` remain action labels, not
    status claims.
- Preserved the underlying behavior: open/carrying trades stay execution-only
  and do not produce completed-trade coaching or chart evidence claims until the
  position is flat and evidence exists.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused saved-import/review/coach language Vitest passed: 4 files, 42 tests.
- `npm run build` passed. Existing Turbopack warnings remain about broad
  dynamic file patterns in academy/news stores.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.
- `TRADER_INTELLIGENCE_TIER=free_execution npx playwright test
  tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop
  --reporter=dot` passed: 1 passed, 1 skipped.
- `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test
  tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop
  --reporter=dot` passed: 1 passed, 1 skipped.
- `npm run verify:levels-system -- --reporter=dot` passed: 21 files, 83
  tests.

Best next step:

- Review and commit this open-or-swing lane copy pass. Then continue porting
  another narrow product-pass slice only where it preserves `/intelligence`,
  journal-level-analysis, levels-system-v2-only, and the tier evidence boundary.

# 2026-06-11 open-or-swing mark-closed action pass

- Continued the deliberate product-pass port without taking stale route rewrites.
- Kept `/intelligence`, journal-level-analysis, levels-system-v2-only, and the
  free execution-only versus paid chart-evidence boundary intact.
- Added `POST /api/trades/[tradeId]/mark-closed` for saved open/swing trades.
- Added an open/swing list action to mark a blocked carried position as closed
  by the user without creating chart evidence or support/resistance claims.
- Persisted the user lifecycle override on the saved trade, set the saved trade
  review status to `ignored`, and moved blocked open/swing decision-review jobs
  to `skipped_limit`.
- Filtered ignored saved trades out of the saved review queue so the item is
  removed after the user marks it closed.
- Added focused API coverage for the mark-closed route, persisted trade detail,
  and review queue removal.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused saved-import/repository Vitest passed: 2 files, 27 tests.
- `npm run build` passed. Existing Turbopack warnings remain about broad
  dynamic file patterns in academy/news stores.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.
- `TRADER_INTELLIGENCE_TIER=free_execution npx playwright test
  tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop
  --reporter=dot` passed: 1 passed, 1 skipped.
- `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test
  tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop
  --reporter=dot` passed: 1 passed, 1 skipped.

Best next step:

- Commit this open/swing mark-closed slice. Then continue inspecting remaining
  product-pass diffs for another narrow behavior/read-model improvement that
  preserves `/intelligence`, journal-level-analysis, levels-system-v2-only, and
  the tier evidence boundary.

# 2026-06-11 chart evidence analytics examples pass

- Continued the deliberate product-pass port without taking stale top-level
  route rewrites.
- Kept `/intelligence`, journal-level-analysis, levels-system-v2-only, and the
  free execution-only versus paid chart-evidence boundary intact.
- Ported the chart-evidence example story cards into the current
  `/intelligence/analytics` route.
- The examples are built only from ticker stories with saved chart-context
  findings and render only inside the existing chart-evidence panel, so free
  execution-only mode still shows the tier gate instead of support/resistance
  or candle claims.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused analytics/saved-import Vitest passed: 2 files, 15 tests.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.
- `TRADER_INTELLIGENCE_TIER=free_execution npx playwright test
  tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop
  --reporter=dot` passed: 1 passed, 1 skipped.
- `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test
  tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop
  --reporter=dot` passed: 1 passed, 1 skipped.
- `npm run build` passed. Existing Turbopack warnings remain about broad
  dynamic file patterns in academy/news stores.

Best next step:

- Commit this analytics examples slice. Then continue comparing product-pass
  route pages against current `/intelligence` pages for small UI/read-model
  improvements, skipping route rewrites and anything that weakens the tier
  evidence boundary.

# 2026-06-11 review queue candle-basis visibility pass

- Continued the deliberate product-pass comparison against the current
  `/intelligence/review` route without taking stale top-level route rewrites.
- Restored per-item candle-basis visibility in saved review queue technical
  details for chart-evidence queue cards.
- Kept the display conservative: chart findings can show `Candle basis`, with
  `Needs review`, `Checked`, or `Not reported`; execution-only/free-tier paths
  remain gated by the existing tier read model.
- Added a Playwright regression assertion that the completed chart-data sample
  review queue exposes the candle-basis field.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused saved-import/repository Vitest passed: 2 files, 27 tests.
- `npm run build` passed. Existing Turbopack warnings remain about broad
  dynamic file patterns in academy/news stores.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.
- `TRADER_INTELLIGENCE_TIER=free_execution npx playwright test
  tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop
  --reporter=dot` passed: 1 passed, 1 skipped.
- `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test
  tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop
  --reporter=dot` passed: 1 passed, 1 skipped.

Best next step:

- Commit this candle-basis visibility slice. Then continue with another small
  coach/review product-pass comparison only where it preserves `/intelligence`,
  journal-level-analysis, levels-system-v2-only, and the tier evidence boundary.

# 2026-06-11 coach behavior sequence tier-copy pass

- Continued the small product-pass comparison on shared coach behavior sequence
  copy.
- Tightened the coach review-path explanation so free execution-only mode does
  not mention chart evidence.
- Paid chart-context mode still keeps chart evidence in the review explanation
  when chart evidence is allowed.
- Preserved `/intelligence`, journal-level-analysis, levels-system-v2-only, and
  the tier evidence boundary.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused analytics/saved-import Vitest passed: 2 files, 15 tests.
- `npm run build` passed. Existing Turbopack warnings remain about broad
  dynamic file patterns in academy/news stores.
- `TRADER_INTELLIGENCE_TIER=free_execution npx playwright test
  tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop
  --reporter=dot` passed: 1 passed, 1 skipped.
- `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test
  tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop
  --reporter=dot` passed: 1 passed, 1 skipped.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.

Best next step:

- Commit this coach tier-copy slice. Then continue with another narrow
  product-pass comparison only if it does not weaken the free execution-only
  versus paid chart-evidence boundary.

# 2026-06-11 Intelligence overview tier-copy pass

- Continued the evidence-wording audit after the product-pass comparison.
- Made the `/intelligence` overview tier-aware:
  - free execution-only mode now uses review-follow-up/execution-evidence copy
    in the primary metrics, workflow card, product-area cards, and attention
    area,
  - paid chart-context mode keeps chart-data/chart-evidence wording.
- Made the `/intelligence/analytics` empty state tier-aware so free mode says
  execution evidence instead of chart evidence.
- Extended the tier Playwright matrix to cover `/intelligence` and
  `/intelligence/analytics` entry points.
- Preserved `/intelligence`, journal-level-analysis, levels-system-v2-only, and
  the free execution-only versus paid chart-evidence boundary.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused tier/behavior Vitest passed: 2 files, 5 tests.
- `npm run build` passed. Existing Turbopack warnings remain about broad
  dynamic file patterns in academy/news stores.
- `TRADER_INTELLIGENCE_TIER=free_execution npx playwright test
  tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop
  --reporter=dot` passed: 1 passed, 1 skipped.
- `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test
  tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop
  --reporter=dot` passed: 1 passed, 1 skipped.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.

Best next step:

- Commit this overview tier-copy slice. Then continue with another small
  evidence-wording or read-model pass only if it preserves the tier boundary.

# 2026-06-11 ticker-story direct-route tier gate pass

- Continued the end-user evidence-wording audit beyond the main dashboard.
- Gated `/intelligence/trades/ticker-story/[threadId]` decision-review
  snapshots by the active tier so direct ticker-story URLs do not expose
  chart findings in free execution-only mode.
- Updated ticker-story menu/summary badges and coach-handoff copy so free mode
  says execution-only/evidence basis while paid chart-context mode keeps chart
  evidence language.
- Extended the tier Playwright matrix to visit ticker stories and, when a
  story link exists, a direct ticker-story detail page.
- Preserved `/intelligence`, journal-level-analysis, levels-system-v2-only, and
  the free execution-only versus paid chart-evidence boundary.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused saved-trade-thread/tier Vitest passed: 2 files, 31 tests.
- `npm run build` passed. Existing Turbopack warnings remain about broad
  dynamic file patterns in academy/news stores.
- `TRADER_INTELLIGENCE_TIER=free_execution npx playwright test
  tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop
  --reporter=dot` passed: 1 passed, 1 skipped.
- `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test
  tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop
  --reporter=dot` passed: 1 passed, 1 skipped.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.

Best next step:

- Commit this ticker-story tier-gate slice. Then continue with another direct
  route audit for chart/candle/support-resistance wording if needed.

# 2026-06-11 coach ticker-story panel tier gate pass

- Continued the direct-route chart/candle wording audit on the coach ticker-story
  view.
- Gated the coach ticker-story chart metric cards behind the active paid
  chart-context tier:
  - free execution-only mode now shows an execution-only note instead of chart
    findings, support/resistance exits, chart risks, chart strengths, or volume
    evidence,
  - paid chart-context mode still shows the chart metric cards when chart
    evidence is allowed.
- Extended the tier Playwright matrix to visit
  `/intelligence/coach/ticker-stories?demo=sample` in both free and paid modes.
- Preserved `/intelligence`, journal-level-analysis, levels-system-v2-only, and
  the free execution-only versus paid chart-evidence boundary.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused tier/behavior Vitest passed: 2 files, 5 tests.
- `npm run build` passed. Existing Turbopack warnings remain about broad
  dynamic file patterns in academy/news stores.
- `TRADER_INTELLIGENCE_TIER=free_execution npx playwright test
  tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop
  --reporter=dot` passed: 1 passed, 1 skipped.
- `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test
  tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop
  --reporter=dot` passed: 1 passed, 1 skipped.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.
- `npm run verify:levels-system -- --reporter=dot` passed: 21 files, 83 tests.

Best next step:

- Commit this coach ticker-story tier-gate slice. Then continue the deliberate
  product-pass port with another small route audit for chart/candle/support-
  resistance wording while preserving `/intelligence`, journal-level-analysis,
  and levels-system-v2-only.

# 2026-06-11 progress route tier gate pass

- Continued the route-level tier audit on `/intelligence/progress`.
- Kept the ticker-story progress execution metrics visible in both tiers.
- Gated progress chart metric groups behind the effective paid chart-context
  tier:
  - free execution-only mode now shows an execution-only progress note and
    "Study the execution report",
  - paid chart-context mode keeps "Study the chart set" plus chart risks,
    chart strengths, chart findings, support/resistance exits, and volume
    evidence counts.
- Extended the tier Playwright matrix to cover `/intelligence/progress` in both
  free and paid modes.
- Preserved `/intelligence`, journal-level-analysis, levels-system-v2-only, and
  the free execution-only versus paid chart-evidence boundary.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused tier/behavior Vitest passed: 2 files, 5 tests.
- `npm run build` passed. Existing Turbopack warnings remain about broad
  dynamic file patterns in academy/news stores.
- `TRADER_INTELLIGENCE_TIER=free_execution npx playwright test
  tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop
  --reporter=dot` passed: 1 passed, 1 skipped.
- `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test
  tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop
  --reporter=dot` passed: 1 passed, 1 skipped.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.

Best next step:

- Commit this progress tier-gate slice. Then continue the deliberate product-pass
  port with another small direct-route audit for chart/candle/support-resistance
  wording, or package the branch if the route audit is clean enough for handoff.

# 2026-06-11 trade detail tier-copy pass

- Continued the direct-route tier audit on individual trade detail pages.
- Made the trade detail decision-review status helper tier-aware:
  - free execution-only mode now describes the page as saved executions, P/L,
    notes, and checklist evidence,
  - paid chart-context mode keeps chart-ready, chart-missing, and chart-data
    diagnostic copy.
- Made the trade detail workflow handoff tier-aware so free mode does not ask the
  user to use chart evidence, while paid mode keeps the chart-evidence workflow
  when allowed.
- Updated the summary card so free mode reports unavailable paid evidence rather
  than missing chart data.
- Extended the tier Playwright matrix to open a direct trade detail page from the
  saved-trades list when a trade link is present.
- Preserved `/intelligence`, journal-level-analysis, levels-system-v2-only, and
  the free execution-only versus paid chart-evidence boundary.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused saved-thread/tier Vitest passed: 2 files, 31 tests.
- `npm run build` passed. Existing Turbopack warnings remain about broad
  dynamic file patterns in academy/news stores.
- `TRADER_INTELLIGENCE_TIER=free_execution npx playwright test
  tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop
  --reporter=dot` passed: 1 passed, 1 skipped.
- `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test
  tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop
  --reporter=dot` passed: 1 passed, 1 skipped.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.

Best next step:

- Commit this trade-detail tier-copy slice. Then scan imports/import-dry-run and
  analytics route copy for any remaining free-tier chart/candle/support-
  resistance wording before packaging the branch for handoff.

# 2026-06-11 upload and import detail tier gate pass

- Continued the import route tier audit.
- Made `/intelligence/upload-csv` pass the active tier into the upload client.
- Gated post-save chart-data auto-start:
  - paid chart-context mode still starts the first chart-data review job after a
    clean save,
  - free execution-only mode saves the import and sends the user to saved import
    or review queue without promising chart hydration.
- Made saved import detail copy tier-aware:
  - free mode describes saved trades with executions, notes, checklist state,
    session timing, and P/L evidence,
  - paid mode keeps chart evidence notes, chart review status, diagnostics, and
    resume controls.
- Added an execution-only advanced import status panel for free mode and kept
  chart diagnostics hidden from the free import detail surface.
- Extended the free-tier Playwright matrix to visit `/intelligence/upload-csv`
  and assert the entry screen does not promise chart data/evidence.
- Preserved `/intelligence`, journal-level-analysis, levels-system-v2-only, and
  the free execution-only versus paid chart-evidence boundary.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused import/tier Vitest passed: 2 files, 17 tests.
- `npm run build` passed. Existing Turbopack warnings remain about broad
  dynamic file patterns in academy/news stores.
- `TRADER_INTELLIGENCE_TIER=free_execution npx playwright test
  tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop
  --reporter=dot` passed: 1 passed, 1 skipped.
- `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test
  tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop
  --reporter=dot` passed: 1 passed, 1 skipped.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.

Best next step:

- Commit this upload/import tier-gate slice. Then run one final route-copy scan
  for free-tier chart/candle/support-resistance wording and package the branch
  for deliberate handoff/port review.

# 2026-06-11 import dry-run tier gate pass

- Continued the final route-copy scan on `/intelligence/import-dry-run`.
- Made `/intelligence/import-dry-run` dynamic so runtime tier configuration is
  honored instead of using a build-time default.
- Made `/intelligence/upload-csv` dynamic for the same reason; its post-save
  chart-data auto-start depends on the active tier.
- Passed the active tier into the advanced import dry-run client.
- Gated the dry-run chart-data review request button, chart-data KPIs, evidence
  gate summaries, detailed decision-review results, chart-data notes, and
  chart-specific limitation copy behind the paid chart-context tier.
- Free execution-only mode now shows import readiness, grouping, repairs, P/L,
  save readiness, and review queue context without exposing chart/candle/support-
  resistance controls.
- Paid chart-context mode keeps the existing chart-data review controls and
  diagnostics.
- Extended the tier Playwright matrix to cover `/intelligence/import-dry-run` in
  both free and paid modes.
- Preserved `/intelligence`, journal-level-analysis, levels-system-v2-only, and
  the free execution-only versus paid chart-evidence boundary.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused import/tier Vitest passed: 2 files, 17 tests.
- `npm run build` passed. Existing Turbopack warnings remain about broad
  dynamic file patterns in academy/news stores.
- `TRADER_INTELLIGENCE_TIER=free_execution npx playwright test
  tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop
  --reporter=dot` passed: 1 passed, 1 skipped.
- `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test
  tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop
  --reporter=dot` passed: 1 passed, 1 skipped.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts
  --project=chromium-desktop --reporter=dot` passed: 16 passed, 1 skipped.

Known current failure:

- `npx vitest run
  src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts
  --reporter=verbose` currently fails before/independent of this UI tier slice:
  the deterministic dashboard reports `failCount: 3` where the test expects
  `0`. This should be handled as a calibration follow-up, not as part of the
  import dry-run route-copy gate.

Best next step:

- Commit this import dry-run tier-gate slice. Then package the branch for
  deliberate handoff/port review, with the decision-review quality dashboard
  failure called out as a separate calibration task.

# 2026-06-11 port handoff package

- Added `src/docs/trader-intelligence-v2-port-handoff-2026-06-11.md`.
- The handoff captures the current branch, non-negotiable levels-system-v2-only
  rule, recent tier-boundary commits, verification commands, known calibration
  test failure, and deliberate port guidance.
- It explicitly separates the free execution-only versus paid chart-context
  boundary from the separate decision-review quality dashboard calibration
  failure.

Best next step:

- Use the handoff doc to prepare the deliberate port/review package. Do not
  blindly merge; preserve `/intelligence`, journal-level-analysis, and the
  levels-system-v2-only path.

# 2026-06-11 decision-review resistance calibration

- Resolved the deterministic decision-review quality dashboard calibration
  failure that previously reported `failCount: 3`.
- Root cause: three synthetic `ABCD` resistance scenarios still used a first
  entry at `1.2767`, but the current levels-system-v2 fixture produces the
  nearest major overhead resistance at `1.3100`; the entry was 2.61% below that
  level, so the UI correctly refused to claim "near resistance" or "limited
  room" evidence.
- Updated only the synthetic scenario CSV prices so those scenarios now place
  the first fill at `1.3097`, which is about `0.02%` below the actual v2
  `1.3100` major resistance level. No product logic was loosened.
- The late-add scenario was adjusted to keep the intended "adds after much of
  the move was already used" evidence while preserving the major-resistance
  setup.
- levels-system-v2-only remains intact; no levels-system v1 / phase1 path was
  restored or imported.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts --reporter=verbose` passed: 1 file, 3 tests.
- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot` passed: 1 file, 16 tests.
- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts --reporter=dot` passed: 2 files, 19 tests.
- `npx tsc --noEmit --pretty false` passed.
- `npm run verify:levels-system -- --reporter=dot` passed: 21 files, 83 tests.

Best next step:

- Commit this focused synthetic calibration fix, then continue the deliberate
  port/review package with `/intelligence`, journal-level-analysis, tier
  boundaries, and levels-system-v2-only constraints preserved.

# 2026-06-11 calibration handoff refresh

- Committed the focused synthetic resistance calibration as `a13de83e`.
- Updated `src/docs/trader-intelligence-v2-port-handoff-2026-06-11.md` so it
  no longer lists the decision-review quality dashboard as a current known
  failure.
- The handoff now calls out the resolved calibration separately from the
  tier-boundary work.

Best next step:

- Prepare the review/PR package with three separate review threads: tier
  boundary behavior, the resolved synthetic calibration follow-up, and the
  broader levels-system-v2/vendor cleanup history.

# 2026-06-11 trader-ui-product-pass port planning

- Compared `codex/trader-ui-product-pass` against
  `codex/port-v2-candle-analytics-main` without merging.
- Confirmed a direct merge is unsafe because the source branch moves many
  `/intelligence/*` routes to root-level `app/*` routes and deletes
  journal-level-analysis files that must be preserved.
- Added `src/docs/trader-ui-product-pass-deliberate-port-plan-2026-06-11.md`
  with explicit source/target branches, direct-merge risks, port-first areas,
  adapt-before-porting route families, do-not-port-wholesale areas, and
  verification requirements.

Best next step:

- Start a read-only review of `src/lib/trader-analytics/*` differences from
  `codex/trader-ui-product-pass`; port only product logic that still matches the
  current tier/evidence model before touching route UI.

# 2026-06-11 trader-analytics port review pass 1

- Reviewed `src/lib/trader-analytics/*` differences from
  `codex/trader-ui-product-pass` without merging or applying code.
- Result: most remaining source hunks should not be ported as-is because they
  rewrite `/intelligence/*` links to root-level routes, remove saved review
  queue journal-level facts, remove open/swing trade handling, or remove
  customer-data filtering.
- Confirmed warehouse-backed candle hydration, saved import chart hydration
  status, and tier config are already represented in the target branch.
- Scanned for old `levels-system` v1 / phase1 imports; matches were prose
  strings only, not v1 code imports.
- Updated `src/docs/trader-ui-product-pass-deliberate-port-plan-2026-06-11.md`
  with these review findings.

Best next step:

- Continue source-only function-level review for saved review priority wording
  and ticker-story grouping, accepting only behavior that preserves
  `/intelligence`, tier gates, journal-level-analysis, and open-swing handling.

# 2026-06-11 saved review priority port slice

- Accepted one small behavior slice from `codex/trader-ui-product-pass`:
  the saved-review `highest_priority` lane now requires `priorityScore >= 90`
  instead of `>= 75`.
- Rationale: the default urgent lane should surface urgent chart-data gaps and
  high-loss chart-risk reviews, while lower-priority open/swing reminders remain
  available through their own lane.
- Preserved target-branch `/intelligence` links, journal-level facts, tier-aware
  filtering, customer-data filtering, and open/swing trade handling.
- Added/updated focused tests for larger-loss priority ordering and urgent
  ticker-story grouping.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/sqlite-import-commit-repository.test.ts --reporter=dot` passed: 1 file, 15 tests.
- `npx vitest run src/lib/trader-analytics/__tests__/saved-import-api-routes.test.ts --reporter=dot` passed: 1 file, 13 tests.
- `npx vitest run src/lib/trader-analytics/__tests__/tier-config.test.ts src/lib/trader-analytics/__tests__/sqlite-import-commit-repository.test.ts src/lib/trader-analytics/__tests__/saved-import-api-routes.test.ts --reporter=dot` passed: 3 files, 31 tests.
- `npx tsc --noEmit --pretty false` passed.

Best next step:

- Continue source-only function-level review, but skip root-route and
  journal-level-analysis deletion hunks. The next useful candidates are
  calm chart-basis diagnostics and saved-import source caution copy.

# 2026-06-11 candle-basis port review

- Reviewed `codex/trader-ui-product-pass` commits `28a6310d` and `6b4bc3c6`.
- Result: no code port needed. The current branch already has the candle-basis
  queue lane, review/trade detail copy, replay gating, stale-diagnostic cleanup,
  and focused tests adapted to `/intelligence`.
- Updated `src/docs/trader-ui-product-pass-deliberate-port-plan-2026-06-11.md`
  to mark the candle-basis candidate as reviewed and closed.

Best next step:

- Continue function-level source review with saved-import source caution copy
  and automated QA/product-readiness wording. Keep rejecting root-route rewrites
  and journal-level-analysis deletions.

# 2026-06-12 import/product readiness port review

- Reviewed saved-import source caution, import user copy, CSV dry-run workflow,
  automated QA, import trial, product intelligence, product polish,
  productization, and platform-module diffs from `codex/trader-ui-product-pass`.
- Result: no code port accepted.
- The source diffs mainly rewrote `/intelligence/*` contracts and links to
  root-level routes, downgraded "open or swing trade" wording to "open trade",
  and removed generic/auto sell-starting trade grouping support.
- Kept the target branch behavior because it preserves `/intelligence`, current
  open/swing handling, short/opening-sell import support, tier gates, and
  journal-level-analysis.
- Updated `src/docs/trader-ui-product-pass-deliberate-port-plan-2026-06-11.md`
  with this reviewed/rejected slice.

Best next step:

- Continue deliberate source review with shared levels-system-v2/support-
  resistance diffs. Do not accept any v1/phase1 or route-namespace churn.

# 2026-06-12 shared levels-system port review

- Reviewed shared support/resistance, raw-trade-timeline, trade-analysis, and
  pattern-input diffs from `codex/trader-ui-product-pass`.
- Result: no code port accepted.
- The source branch would restore
  `levels-system-phase1/support-resistance-engine` in shared adapter/types and
  strip v2 level-quality evidence fields including importance, freshness,
  extension/synthetic-extension flags, and zone width fields.
- Kept the target branch implementation because it preserves
  `levels-system-v2/support-resistance-engine`, warehouse-backed candle
  hydration/runtime options, and the paid chart-context evidence model.
- Updated
  `src/docs/trader-ui-product-pass-deliberate-port-plan-2026-06-11.md` with the
  reviewed/rejected levels-system slice.

Best next step:

- Continue deliberate source review with user-facing behavior and route-local UI
  changes, accepting only patches that can be adapted into `/intelligence`
  without weakening tier gates, journal-level-analysis, or levels-system-v2
  evidence.

# 2026-06-12 user-facing behavior and route UI port review

- Reviewed `src/lib/user-facing-behavior/*`, route-local Trader Intelligence
  UI diffs, and focused Playwright spec diffs from
  `codex/trader-ui-product-pass`.
- Result: no code port accepted.
- The user-facing behavior diff only rewrites route contracts from
  `/intelligence/*` to root-level routes, which must be rejected for this
  branch.
- The route UI diff mostly renames or deletes `app/intelligence/*` files in
  favor of root-level routes.
- Feature-marker review confirmed the target route files already contain the
  important current behavior under `/intelligence`: tier-aware chart evidence
  gates, candle-basis warnings, ticker-story coach/review links, saved chart
  hydration status, and execution-only free-tier copy.
- Kept current trade detail level facts and open/swing mark-closed files because
  the source branch deletes them and they preserve journal-level/open-swing
  review behavior.
- Updated
  `src/docs/trader-ui-product-pass-deliberate-port-plan-2026-06-11.md` with the
  reviewed/rejected user-facing behavior and route UI slice.

Best next step:

- Finish the deliberate port package by checking whether any remaining test-only
  changes add coverage that can be adapted to `/intelligence`; otherwise run
  targeted verification and leave the branch ready for review.

# 2026-06-12 test-only port review

- Reviewed remaining test-only diffs from `codex/trader-ui-product-pass`.
- Result: no broad test port accepted.
- The source branch deletes journal-level-analysis tests, follows rejected
  root-route assumptions in several Playwright specs, and includes
  levels-system test diffs tied to the rejected phase1 adapter changes.
- Kept the target branch's existing tier/evidence Playwright checks and focused
  unit tests as the review baseline.
- Updated
  `src/docs/trader-ui-product-pass-deliberate-port-plan-2026-06-11.md` with the
  reviewed/rejected test-only slice.

Best next step:

- Run targeted verification for the final deliberate-port package:
  `npx tsc --noEmit --pretty false`, `npm run verify:levels-system -- --reporter=dot`,
  focused trader analytics/import/coach tests, and route Playwright checks when
  a dev server is available.

# 2026-06-12 final port verification pass

- Ran the final deliberate-port verification package after rejecting the unsafe
  source-branch route, levels-system, and journal-level-analysis hunks.
- Fixed one Playwright fixture in `tests/e2e/import-dry-run.spec.ts`:
  - changed the generated saved-import ticker from `E2E########` to
    `QA########` because `E2E########` symbols are intentionally blocked from
    customer-facing trade detail routes by the local synthetic-data filter,
  - followed the import detail page's own "Open trade review" link instead of
    reconstructing a trade-detail URL in the test.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run verify:levels-system -- --reporter=dot` passed: 21 files, 83 tests.
- Focused trader analytics/import/coach Vitest groups passed: 11 files, 101
  tests.
- `npm run build` passed. Existing Turbopack warnings remain for broad
  academy/news file tracing.
- `TRADER_INTELLIGENCE_TIER=free_execution npx playwright test tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop`
  passed: 1 passed, 1 skipped.
- `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop`
  passed: 1 passed, 1 skipped.
- `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop`
  passed: 14 tests.
- `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop`
  passed: 16 passed, 1 skipped.

Best next step:

- Review the final diff/commit stack, then prepare a PR/review summary for this
  deliberate port branch. Keep any future source-branch UI ideas as manual
  `/intelligence` ports only.

# 2026-06-12 deliberate port PR packaging

- Added
  `src/docs/trader-intelligence-v2-deliberate-port-review-summary-2026-06-12.md`
  as the PR/review package for `codex/port-v2-candle-analytics-main`.
- The summary records accepted scope, rejected source-branch hunks, preserved
  requirements, verification results, residual risks, and recommended review
  focus.
- Branch status before packaging was clean.

Best next step:

- Open a review/PR from `codex/port-v2-candle-analytics-main` after confirming
  the intended target branch. Continue treating any remaining
  `codex/trader-ui-product-pass` UI ideas as manual `/intelligence` ports only.

# 2026-06-12 origin main merge for PR readiness

- Fetched `origin` and merged current `origin/main` into
  `codex/port-v2-candle-analytics-main`.
- The merge brought in journal-level-analysis CI hardening, the seeded
  level-analysis trade-detail Playwright flow, week-ahead article updates, and
  related docs/workflow files.
- Preserved this branch's Trader Intelligence v2 route namespace,
  levels-system-v2-only implementation, tier gates, warehouse-backed candle
  hydration, and open/swing review files.
- Confirmed no `levels-system-phase1` code matches remain and
  `vendor/levels-system-phase1` is still absent.
- Adapted the merged level-analysis Playwright config/spec from root routes to
  `/intelligence` routes:
  - `playwright.level-analysis.config.ts`,
  - `tests/e2e/level-analysis-trade-detail-seeded-flow.spec.ts`.
- Cleared an old local `node` process on port 3101 before rerunning the seeded
  level-analysis browser check.

Post-merge verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run verify:levels-system -- --reporter=dot` passed: 21 files, 83 tests.
- Focused trader analytics/import/coach Vitest groups passed: 11 files, 101
  tests.
- `npm run test:e2e:level-analysis` built successfully; Playwright initially
  could not start because port 3101 was already in use.
- `npx playwright test --config=playwright.level-analysis.config.ts` passed: 1
  test.
- `TRADER_INTELLIGENCE_TIER=free_execution npx playwright test tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop`
  passed: 1 passed, 1 skipped.
- `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop`
  passed: 1 passed, 1 skipped.
- `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop`
  passed: 14 tests.
- `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop`
  passed: 16 passed, 1 skipped.

Best next step:

- Commit the `/intelligence` route adaptation for the merged level-analysis E2E
  flow, then open the review/PR package from this branch if remote push/PR is
  approved.

# 2026-06-12 draft PR opened

- Pushed `codex/port-v2-candle-analytics-main` to `origin`.
- Opened draft PR #59:
  https://github.com/traderslink-bot/traderslink-trader-improvement-system/pull/59
- PR body uses
  `src/docs/trader-intelligence-v2-deliberate-port-review-summary-2026-06-12.md`.
- Branch was clean and `origin/main` was an ancestor before push.

Best next step:

- Watch PR #59 checks. If CI fails, fix on
  `codex/port-v2-candle-analytics-main` while preserving `/intelligence`,
  journal-level-analysis, and levels-system-v2-only constraints.

# 2026-06-12 PR 59 CI install fix

- PR #59 initial CI failed before tests during `npm ci`.
- Root cause: the lockfile had `@rolldown/binding-wasm32-wasi` requiring exact
  `@emnapi/core@1.9.2` and `@emnapi/runtime@1.9.2`, but the nested optional
  package entries were missing for Linux npm 10 lock validation.
- Added the missing nested optional lockfile entries under
  `node_modules/@rolldown/binding-wasm32-wasi/node_modules/@emnapi/*`.
- Verified locally with CI's npm major:
  `npx -p npm@10.9.8 npm ci` passed.
- Re-ran `npx tsc --noEmit --pretty false`; passed.

Best next step:

- Push the lockfile fix and recheck PR #59 CI.

# 2026-06-12 PR 59 vendored levels-system-v2 CI fix

- PR #59 CI passed the npm lock validation after the first lockfile fix, then
  failed during verification because `levels-system-v2` resolved to the local
  sibling path `file:../levels-system-post-mtf-handoff-stability`, which is not
  present in GitHub Actions.
- Vendored the compiled v2 package into `vendor/levels-system-v2` and changed
  the app dependency to `levels-system-v2: file:vendor/levels-system-v2`.
- Kept the public import path as
  `levels-system-v2/support-resistance-engine`; no old levels-system v1 /
  phase1 dependency was restored.
- Removed the runtime auto-discovery fallback to
  `../levels-system/data/candles`.
- Runtime candle warehouse discovery now uses explicit
  `LEVELS_SYSTEM_WAREHOUSE_DIRECTORY` first, then v2-owned locations only:
  the vendored v2 warehouse if present, or the local
  `levels-system-post-mtf-handoff-stability` v2 data/cache folders for local
  IBKR/backfill QA.
- This preserves the intended paid-tier behavior: stored v2 daily/4h candle
  data can be used when configured/available, and IBKR on-demand hydration can
  fetch missing candles such as 5m without treating stub candles as paid chart
  evidence.

Verification:

- `npx -p npm@10.9.8 npm ci` passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run verify:levels-system -- --reporter=dot` passed: 21 files, 83 tests.
- `npx vitest run src/lib/trader-analytics/__tests__ src/lib/coaching/__tests__ --reporter=dot`
  passed: 42 files, 306 tests.
- `npm run build` passed. Only the pre-existing academy/news Turbopack file
  tracing warnings remain.
- `npx playwright test --config=playwright.level-analysis.config.ts` passed: 1
  test.
- `TRADER_INTELLIGENCE_TIER=free_execution npx playwright test tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop --reporter=dot`
  passed: 1 passed, 1 skipped.
- `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop --reporter=dot`
  passed: 1 passed, 1 skipped.
- `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop --reporter=dot`
  passed: 14 tests.

Best next step:

- Commit and push the vendored v2 package portability fix, then recheck PR #59
  CI. If CI is green, continue PR review for the deliberate `/intelligence`
  port rather than merging any source branch wholesale.

# 2026-06-12 PR 59 deliberate port merged to main

- Marked PR #59 ready for review after both required checks passed.
- Merged PR #59 into `main` with merge commit
  `f31ba4d4b69ad2005fc3098e59aa2090202ee5f2`.
- GitHub checks on the merged PR head were green before merge:
  - `CI / test-and-verify`
  - `Level Analysis Trade Detail Facts / Seeded trade detail level facts flow`
- Fast-forwarded local `main` in the merge checkout to `origin/main`.
- Confirmed the merged tree keeps `vendor/levels-system-v2`, does not contain
  `vendor/levels-system-phase1`, and has no code references to
  `levels-system-phase1`, `levels-system-v1`,
  `levels-system/support-resistance-engine`, or the old
  `../levels-system/data/candles` auto-discovery path.
- No production deploy was run.

Current best next step:

- Continue Trader Intelligence work from updated `main`.
- Treat any remaining `codex/trader-ui-product-pass` ideas as manual,
  reviewable `/intelligence` ports only.
- Keep the tier boundary intact: free tier is execution-only; paid chart-context
  tier may use candle/level evidence only when real saved chart evidence exists.

# 2026-06-12 May IBKR v2 warehouse-cache hydration fix

- Continued May IBKR QA on updated `main` with isolated DB
  `.codex-dev-server/may-ibkr-main-qa-20260612/may-ibkr-main.sqlite` and May
  statement
  `C:\Users\jerac\Documents\IBKR activity statments\U21845737_202605_202605.csv`.
- Root cause of the all-failed first May chart run: the Trader Intelligence v2
  fetch-client resolver opened the IBKR socket before constructing the
  warehouse-backed reader. With no listener on `127.0.0.1:7497`, jobs failed
  before stored candles were checked.
- Added a lazy levels-system-v2 delegate so configured warehouse/cache candles
  are read before live IBKR is contacted.
- Added support for the levels-system-v2 validation-cache layout
  `ibkr/SYMBOL/timeframe/lookback-endTime.json`, while preserving the existing
  date-keyed `.jsonl` write-through warehouse format for newly fetched candles.
- Kept all support/resistance imports on
  `levels-system-v2/support-resistance-engine`; no old levels-system v1 /
  phase1 path was restored.
- Retried the May import chart-review queue from the saved import API in small
  batches. Final isolated DB status:
  - 93 saved trades, 244 accepted executions.
  - 65 completed chart snapshots.
  - 8 `market_context_unavailable`.
  - 20 `analysis_failed`.
  - 65 persisted decision-review snapshots and 36 diagnostics.
- Remaining retryable rows are not evidence claims. They still need live IBKR
  connectivity for missing 5m windows or missing daily/4h symbols. This shell
  had no listener on `7496`, `7497`, `4001`, or `4002` during QA.
- UI post-fix smoke on `http://localhost:3027` loaded:
  - saved import detail and import history,
  - review highest-priority and completed queues,
  - analytics chart-evidence and behavior,
  - coach and coach review-session,
  - completed ISPC trade detail,
  - unavailable JTAI trade detail.
- Completed ISPC correctly showed chart evidence. JTAI stayed execution replay
  only. Aggregate support/resistance mentions were either chart-evidence pages
  backed by completed snapshots or navigation/supporting-detail labels; failed
  trade pages did not make support/resistance claims.

Verification:

- `npx vitest run src/lib/support-resistance/__tests__/levels-system-warehouse-fetch-service.test.ts src/lib/raw-trade-timeline/__tests__/levels-system-trade-candle-context.integration.test.ts --reporter=dot`
  passed: 2 files, 9 tests.
- `npx tsc --noEmit --pretty false` passed.
- `npm run verify:levels-system -- --reporter=dot` passed: 21 files, 85 tests.
- `npx vitest run src/lib/trader-analytics/__tests__/saved-import-coaching-language-qa-matrix.test.ts src/lib/trader-analytics/__tests__/saved-import-api-routes.test.ts src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts --reporter=dot`
  passed: 4 files, 57 tests.
- `npx eslint src/lib/raw-trade-timeline/builders/create-raw-trade-timeline-with-levels-system-candles.ts src/lib/support-resistance/levels-system-warehouse-fetch-service.ts src/lib/support-resistance/__tests__/levels-system-warehouse-fetch-service.test.ts src/lib/raw-trade-timeline/__tests__/levels-system-trade-candle-context.integration.test.ts`
  passed.
- `npx playwright test tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop --reporter=dot`
  passed: 1 passed, 1 skipped.

Current best next step:

- Commit the v2 warehouse-cache hydration fix.
- Then retry the 28 remaining May chart jobs only after IBKR API is reachable on
  the configured port or the runtime env is pointed at the actual API port.

# 2026-06-12 May IBKR final connected retry

- After IBKR API login, `7497` was listening locally and matched the current QA
  server env.
- Retried the remaining May chart-review jobs through the saved import API in
  bounded batches.
- Final isolated DB status:
  - 93 saved trades.
  - 244 accepted executions.
  - 93 completed chart snapshots.
  - 0 `analysis_failed`.
  - 0 `market_context_unavailable`.
  - 0 diagnostics.
- Final route smoke on `http://localhost:3027` loaded:
  - saved import detail,
  - highest-priority review queue,
  - completed review queue,
  - analytics chart-evidence,
  - analytics behavior,
  - coach,
  - coach review-session,
  - first completed trade detail `ISPC`,
  - last completed trade detail `ADTX`.
- The analytics surfaces showed `0 chart data still missing`.
- The sampled ISPC and ADTX trade detail pages both showed chart evidence.
- Browser console checks were clean during the final smoke.

Current best next step:

- Push/open the local commit containing the v2 cache-before-IBKR hydration fix
  if this `main` checkout is being used for a GitHub review branch.
- Continue product QA on the completed May snapshot set: spot-check basis-check
  trades, chart-evidence analytics counts, and coach wording against saved
  snapshots.

# 2026-06-12 PR 61 opened and May basis-check QA

- Pushed branch `codex/v2-candle-cache-before-ibkr`.
- Opened draft PR #61:
  https://github.com/traderslink-bot/traderslink-trader-improvement-system/pull/61
- PR #61 targets `main` and contains the v2 cache-before-IBKR hydration fix.
- Identified the 6 May candle-basis-check trades:
  - HAO trade 42.
  - LNKS trade 46.
  - HUBC trades 54, 55, 56, and 57.
- Basis-check UI smoke loaded the basis review lane and sampled LNKS, HAO, and
  HUBC trade details.
- The basis lane and sampled trade pages showed calm basis-warning copy:
  chart context is attached, candle movement is unavailable, and broker
  execution P/L stays the movement source of truth until basis is reconciled.
- The first basis-check smoke surfaced a React duplicate-key warning in the
  trade-detail behavior timeline for repeated mistake observations.
- Fixed `buildCoachMistakeTimeline` so item IDs include the observation index
  and selected execution index.
- Added a focused coach-action-loop assertion that mistake timeline IDs are
  unique.
- Reran the basis-check smoke after the key fix; no browser console warnings
  remained.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts --reporter=dot`
  passed: 1 file, 11 tests.
- `npx tsc --noEmit --pretty false` passed.
- `npx eslint src/lib/trader-analytics/product/coach-action-loop.ts src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts`
  passed.

Current best next step:

- Amend and push PR #61 with the duplicate-key fix and this QA log update.
- Watch PR #61 CI. If green, mark ready for review or merge after final review.

# 2026-06-12 completed May chart-evidence QA after PR 61 merge

- PR #61 was merged into `main` as
  `20309cbcc5eddd5398b6785b25494728c15878e5`.
- Rechecked the isolated May QA DB after the merge:
  - 93 saved trades.
  - 244 accepted executions.
  - 93 completed decision-review snapshots.
  - 0 chart-data failures or diagnostics.
  - 87 basis-aligned trades.
  - 6 candle-basis-check trades.
- Reconciled the analytics chart-finding count:
  - The raw snapshots contain 512 saved insights.
  - The chart-evidence read model exposes 510 chart findings.
  - The 2 excluded insights are both on trade 19 and map to
    `execution_only` fallback (`entry_chase_or_late_extension` and
    `entry_breakout_failed`), so they are intentionally blocked from
    chart-evidence analytics.
  - No synthetic findings were added by the thread model.
- Fresh local smoke on `http://localhost:3027` loaded:
  - `/intelligence/imports`
  - `/intelligence/review?queue=highest_priority`
  - `/intelligence/review?queue=candle_basis_warning`
  - `/intelligence/analytics?view=chart_evidence`
  - `/intelligence/analytics?view=behavior`
  - `/intelligence/coach`
  - `/intelligence/coach/review-session`
  - `/intelligence/coach/behavior-sequence`
  - `/intelligence/coach/review-backlog`
- The smoked pages returned 200 with no browser console warnings or errors.
- Chart-context pages showed `0 chart data still missing`, `6 candle basis
  checks`, and chart-supported coaching/analytics copy only because the May DB
  now has completed snapshots for all 93 saved trades.

Current best next step:

- Continue final-product QA with a focused free-tier vs paid-tier language pass:
  execution-only surfaces must avoid chart/levels claims, while chart-context
  surfaces may use candle and support/resistance evidence only from completed
  snapshots.

# 2026-06-12 free-tier ticker-story evidence wording fix

- Ran the focused tier Playwright matrix against the rebuilt app with the May
  isolated DB.
- The free-tier pass found a real language leak on
  `/intelligence/trades/ticker-story/[threadId]`:
  - The page header said `chart evidence`.
  - Round trips and hold-continuation evidence state said
    `Chart data still missing`.
  - The story evidence list included the paid-tier missing-chart prompt
    `Chart data to check next`.
- Fixed the ticker-story detail page so:
  - free/execution-only tier copy says `saved executions` and
    `Execution replay only`;
  - paid/chart-context tier keeps chart-evidence and missing-chart-data states;
  - paid-tier chart-context review prompts are hidden only in the free tier.
- This preserves the two-tier behavior: free tier remains execution-only, while
  paid tier can use saved candle/levels evidence when completed snapshots exist.

Verification:

- Opened draft PR #62:
  https://github.com/traderslink-bot/traderslink-trader-improvement-system/pull/62
- PR #62 CI passed:
  - `test-and-verify`.
  - `Seeded trade detail level facts flow`.
- `npm run build` passed. Existing Turbopack warnings remain for broad
  academy/news file-tracing paths and are unrelated to this change.
- `TRADER_INTELLIGENCE_TIER=free_execution npx playwright test tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop --reporter=dot`
  passed: 1 passed, 1 skipped.
- `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop --reporter=dot`
  passed: 1 passed, 1 skipped.
- `npx eslint "app/intelligence/trades/ticker-story/[threadId]/page.tsx"`
  passed.

Current best next step:

- Commit the scoped ticker-story tier-language fix and log update, then continue
  a broader free-tier vs chart-context pass on saved-trade detail and review
  queue pages.

# 2026-06-12 PR 62 merged and broader free-tier sweep

- Merged PR #62 into `main` as
  `50c7e8fcd814882ff348beac665225fc911f38b6`.
- Continued the broader free-tier vs paid-tier language sweep against the May
  isolated DB.
- Found remaining free-tier chart-context wording leaks in:
  - saved trade ticker-story cards on `/intelligence/trades/ticker-stories`;
  - ticker-thread context cards inside saved trade detail pages;
  - guided review summary/status cards on `/intelligence/review`.
- Fixed those surfaces so free tier stays execution-only:
  - story cards hide chart-context review evidence prompts;
  - round-trip summaries say `Execution replay only` instead of
    `Chart data still missing`;
  - review summary cards show execution-review follow-up instead of
    candle-basis or chart-data queues;
  - the advanced chart-data review disclosure is hidden in free tier.
- Paid/chart-context mode still keeps chart evidence and chart-data status
  language when chart context is enabled.

Verification:

- Broad free-tier production sweep on `http://127.0.0.1:3132` checked
  import detail, saved trade lists, saved trade details, review queues,
  behavior analytics, coach pages, and progress pages. Result: 0 forbidden
  chart/level/candle phrase hits and no browser console warnings.
- `npx eslint app/intelligence/trades/page.tsx "app/intelligence/trades/[tradeId]/page.tsx" app/intelligence/review/page.tsx`
  passed.
- `npm run build` passed. Existing Turbopack warnings remain for broad
  academy/news file-tracing paths and are unrelated to this change.
- `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop --reporter=dot`
  passed: 1 passed, 1 skipped.
- `TRADER_INTELLIGENCE_TIER=free_execution npx playwright test tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop --reporter=dot`
  passed: 1 passed, 1 skipped.

Current best next step:

- Commit this broader free-tier evidence wording sweep, open a new PR, and let
  CI verify it before merging.

# 2026-06-13 import/resume and coach/analytics edge tier sweep

- After PR #63 merged into `main`, continued the focused tier-language QA on
  the remaining edge surfaces:
  - saved import history and import detail/resume route;
  - analytics subroutes and query-tab views;
  - coach overview, details, review-session, behavior-sequence, backlog,
    ticker-stories, session-stories, next-session, and progress;
  - progress route.
- Free-tier production sweep initially found one remaining paid-term leak:
  `/intelligence/coach/session-stories` said
  `Execution-only facts stay separate from chart findings`.
- Fixed coach session-story copy so:
  - free tier says review stays anchored to execution-only facts;
  - chart-context tier may say chart findings stay separate from execution-only
    facts;
  - the coach header always says `execution evidence checked` in free tier and
    only shows candle-basis links in chart-context tier.
- Rechecked paid/chart-context mode on May saved data:
  - chart evidence page still shows chart findings, support/resistance exits,
    and `0 chart data still missing`;
  - coach still shows chart evidence checked and candle-basis checks;
  - candle-basis review queue still exposes the basis-check lane.

Verification:

- `npx eslint app/intelligence/coach/page.tsx` passed with the existing coach
  page unused-variable warnings only.
- `npm run build` passed. Existing Turbopack warnings remain for broad
  academy/news file-tracing paths and are unrelated to this change.
- Free-tier production edge sweep on `http://127.0.0.1:3133` checked 26 import,
  analytics, coach, and progress pages. Result: 0 forbidden paid-evidence
  phrase hits and no browser console warnings.
- Chart-context production sanity sweep on `http://127.0.0.1:3134` loaded the
  same May DB and confirmed paid chart evidence/count surfaces still render.
- `TRADER_INTELLIGENCE_TIER=free_execution npx playwright test tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop --reporter=dot`
  passed: 1 passed, 1 skipped.
- `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop --reporter=dot`
  passed: 1 passed, 1 skipped.

Deliberate port/merge note:

- Do not directly merge `codex/trader-ui-product-pass` into `main`.
- Next port pass should compare that branch against current `main`, then port
  only shared v2 candle/levels/coaching/analytics behavior first.
- UI changes should be ported second and adapted to the current `/intelligence`
  route namespace while preserving journal-level-analysis work.

Current best next step:

- Commit this coach edge wording fix and log update, open a scoped PR, and let
  CI verify it before merging.

# 2026-06-13 product-pass branch reconnaissance after tier QA

- PR #64 merged into `main` as
  `e0d2a0947e3bf323f95a5ae16ea720bcb4cec57f`.
- Compared current `main` to `origin/codex/trader-ui-product-pass` without
  merging.
- Current unique product-pass diff is small and not a Trader Intelligence v2
  payload:
  - `AGENTS.md` adds stale production-deployment rules that name
    `origin/codex/trader-ui-product-pass` as the canonical production branch.
    This conflicts with current project instructions that production handoff
    belongs in `C:\Users\jerac\Documents\TraderLink\traderslink.pro` on
    `main`.
  - `app/academy/page.tsx` removes the academy course `display_model` line.
- `git merge-tree` still reports both `AGENTS.md` and
  `app/academy/page.tsx` as changed on both sides, so a direct merge remains
  inappropriate.
- No remaining unique `/intelligence` route, v2 candle/levels/coaching, or
  journal-level-analysis code was found on `codex/trader-ui-product-pass` after
  the PR #59/#61/#62/#63/#64 port work already merged to `main`.

Current best next step:

- Do not merge `codex/trader-ui-product-pass`.
- Treat the branch as stale for Trader Intelligence v2 porting unless a future
  diff shows new `/intelligence` or v2 behavior work.
- If the academy `display_model` removal is desired, port it separately as a
  tiny academy UI change; do not take the stale `AGENTS.md` production rules.

# 2026-06-13 final main verification and May route sweep

- Ran the final verification pack on current `main`
  (`21d8e95e692c5275fc542c8b641554c7bec50ad5` at start of the pass).
- Found one final free-tier copy leak during the May route sweep:
  `/intelligence/analytics/ticker-stories` said a ticker story could
  `need chart data before the lesson is written`.
- Fixed that analytics ticker-story helper copy so:
  - chart-context tier keeps `needs chart data before the lesson is written`;
  - free/execution-only tier says it may need a saved execution replay before
    the lesson is written.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run verify:levels-system -- --reporter=dot` passed: 21 files, 85 tests.
- Focused trader analytics suite passed: 6 files, 74 tests.
  - `saved-import-coaching-language-qa-matrix.test.ts`
  - `saved-import-api-routes.test.ts`
  - `saved-trade-threads.test.ts`
  - `analytics-behavior-report.test.ts`
  - `trader-coach-action-loop.test.ts`
  - `sqlite-import-commit-repository.test.ts`
- `npx eslint app/intelligence/analytics/analytics-client.tsx` passed.
- `npm run build` passed after the analytics copy fix. Existing Turbopack
  warnings remain for broad academy/news file-tracing paths and are unrelated
  to this Trader Intelligence change.
- Final free-tier production May route sweep on `http://127.0.0.1:3135`
  checked 29 import, review, saved-trade, analytics, coach, and progress pages.
  Result: 0 forbidden paid-evidence phrase hits and no browser console warnings.
- Final chart-context production sanity sweep on `http://127.0.0.1:3136`
  confirmed:
  - import detail still shows saved May data;
  - chart evidence analytics still shows chart findings, support/resistance
    exits, `0 chart data still missing`, and `6 candle basis checks`;
  - analytics ticker stories keep paid chart-data wording;
  - coach keeps chart evidence checked and candle-basis checks;
  - review exposes the candle-basis lane;
  - progress keeps paid `Study the chart set` language.
- Final tier Playwright matrix:
  - `TRADER_INTELLIGENCE_TIER=free_execution npx playwright test tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop --reporter=dot`
    passed: 1 passed, 1 skipped.
  - `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop --reporter=dot`
    passed: 1 passed, 1 skipped.

Current best next step:

- Commit this final analytics ticker-story wording fix and verification log,
  open a scoped PR, and let CI verify it before merging.

# 2026-06-13 production repo handoff verification

- Fetched and inspected `C:\Users\jerac\Documents\TraderLink\traderslink.pro`
  before changing it.
- Local production `main` was behind `origin/main`
  (`391f3552` -> `4c390583`) and had pre-existing dirty work only in:
  - `AGENTS.md`
  - `app/news/[ticker]/[slug]/page.tsx`
  - `app/news/[ticker]/page.tsx`
  - `app/news/page.tsx`
  - `src/lib/news/__tests__/news-date-format.test.ts`
  - `src/lib/news/news-date-format.ts`
- Confirmed those dirty files had no path overlap with the incoming verified
  Trader Intelligence diff, then fast-forwarded production `main` to
  `4c390583` with `git merge --ff-only origin/main`.
- Refreshed production dependencies with `npm ci` because the first local
  verification used stale `node_modules` and could not resolve
  `levels-system-v2/support-resistance-engine`.
- Kept the existing dirty news/AGENTS work uncommitted and untouched.

Production-local verification:

- `npx tsc --noEmit --pretty false` passed after `npm ci`.
- `npm run verify:levels-system -- --reporter=dot` passed: 21 files, 85 tests.
- Focused trader analytics suite passed: 6 files, 74 tests.
- `TRADER_INTELLIGENCE_TIER=free_execution npm run build:webpack` passed,
  including academy registry validation.
- `TRADER_INTELLIGENCE_TIER=free_execution npx playwright test tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop --reporter=dot`
  passed after rebuilding the production bundle for the free tier: 1 passed, 1
  skipped.
- `TRADER_INTELLIGENCE_TIER=chart_context npm run build:webpack` passed,
  including academy registry validation.
- `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop --reporter=dot`
  passed: 1 passed, 1 skipped.
- `npm ci` reported 2 high-severity audit findings; no dependency changes were
  made in this pass.

Current best next step:

- Do not deploy yet from `traderslink.pro` while it has dirty news/AGENTS work.
- Preserve that dirty production work on its own branch/commit or stash, rerun
  the full production pre-deploy checklist from a clean `main` checkout, and
  deploy only after the user explicitly asks for production deployment.

# 2026-06-13 production clean-main checklist after handoff

- Preserved the pre-existing production news/AGENTS dirty work on
  `codex/preserve-production-news-date-work` at
  `62b3a7f0d3a2a268e5f3f81c7f6ac8c796f1d3c2` and pushed the branch to
  `origin/codex/preserve-production-news-date-work`.
- The preserved branch contains:
  - the `AGENTS.md` Trader Intelligence design-baseline reconciliation note;
  - the centralized `formatNewsPublishedDate(...)` helper;
  - the three News page imports/call sites;
  - `src/lib/news/__tests__/news-date-format.test.ts`.
- While running the clean-main production checklist, `npm run lint` exposed an
  existing `no-explicit-any` blocker in level-analysis fixture/test aliases.
- Fixed that blocker in PR #68 by replacing the mutable JSON fixture aliases
  with `unknown`-backed records and narrow typed mutable fixture sections for
  `safety` and `levelEngineOutput`.
- PR #68 merged into `main` as
  `22f6874679009683bbc680a860e607da9e62006b`.

Clean production `main` verification:

- `npm run validate:academy-registry` passed. The existing warning remains:
  19 academy markdown files are not represented in the registry.
- `npx tsc --noEmit` passed.
- `npm run lint` passed with warnings only; no lint errors remain.
- `npm test -- --reporter=dot` passed: 146 files, 1330 tests.
- `npm run build:webpack` passed and generated 138 static pages.
- Deployment safety checks confirmed:
  - `traderslink.pro` is on clean `main` at `22f68746`;
  - `origin/main` points to the same commit;
  - the remote is `git@github.com:traderslink-bot/traderslink-trader-improvement-system.git`;
  - `.vercel/project.json` points to Vercel project `vercel-landing`
    (`prj_TFzKcdj4dS6BHv2maWsy7M5AEv2a`) with Node `24.x`.

Current best next step:

- Production code is locally verified on clean `main`, but no deployment was
  run. If deployment is requested, first confirm the intentional target commit
  is still `22f68746` or newer on `origin/main`, then deploy only from
  `C:\Users\jerac\Documents\TraderLink\traderslink.pro`.

# 2026-06-13 production deployment from clean main

- User requested proceeding after the clean-main production checklist.
- Deployed from `C:\Users\jerac\Documents\TraderLink\traderslink.pro` on clean
  `main` at `c0131f5eb6bdaaad1a1b05704f226eca34f84651`.
- Confirmed before deploy:
  - `origin/main` pointed to the same commit;
  - the repo remote was
    `git@github.com:traderslink-bot/traderslink-trader-improvement-system.git`;
  - `.vercel/project.json` pointed to Vercel project `vercel-landing`
    (`prj_TFzKcdj4dS6BHv2maWsy7M5AEv2a`);
  - `npm run validate:academy-registry` passed;
  - `npx tsc --noEmit --pretty false` passed;
  - `npm run lint` passed with warnings only.
- Ran `npx vercel deploy --prod --yes`.
- Vercel deployment:
  - id: `dpl_57zRqHc2b92DWykcpZv7gg5RqnXa`;
  - production URL:
    `https://vercel-landing-udt4hn61c-jeremylgk20-1197s-projects.vercel.app`;
  - aliases: `https://traderslink.pro` and `https://www.traderslink.pro`;
  - ready state: `READY`.
- Vercel build passed:
  - `npm ci` completed with the existing 2 high-severity audit findings;
  - `npm run build:webpack` passed;
  - academy registry validation passed with the existing 19 markdown registry
    warning;
  - Next generated 138 static pages.
- Post-deploy verification:
  - `npx vercel inspect vercel-landing-udt4hn61c-jeremylgk20-1197s-projects.vercel.app`
    reported production status `Ready`;
  - `https://traderslink.pro/` returned 200;
  - `https://www.traderslink.pro/` returned 308 then 200 at the canonical
    domain;
  - `https://traderslink.pro/intelligence` returned 200;
  - `https://traderslink.pro/news` returned 200;
  - `https://traderslink.pro/academy` returned 200.

Current best next step:

- Monitor the live site and Vercel logs for runtime issues. The preserved
  news-date branch `codex/preserve-production-news-date-work` remains available
  separately and was not deployed in this pass.

# 2026-06-13 post-deploy live smoke excluding News

- User requested a live production smoke pass but explicitly said not to check
  News because it is not part of the Intelligence app yet.
- No `/news` route was checked in this smoke pass.

HTTP checks:

- `https://traderslink.pro/` returned 200.
- `https://www.traderslink.pro/` returned 308 to
  `https://traderslink.pro/`, then 200.
- `https://traderslink.pro/academy` returned 200.
- `https://traderslink.pro/account` returned 200.
- `https://traderslink.pro/intelligence` returned 200.
- `https://traderslink.pro/intelligence/analytics` returned 200.
- `https://traderslink.pro/intelligence/review` returned 200.
- `https://traderslink.pro/intelligence/coach` returned 200.
- `https://traderslink.pro/intelligence/progress` returned 200.
- `https://traderslink.pro/intelligence/upload-csv` returned 200.

Browser checks:

- Headless Chromium loaded the homepage, Academy, Account, Intelligence home,
  Analytics, Review, Coach, Progress, and Upload CSV routes.
- All checked routes returned 200 and rendered expected page title/body text.
- No browser console errors were observed.
- No page runtime errors were observed.
- The initial browser assertion for Analytics was too strict because the body
  renders `ANALYTICS` uppercase while the title is `Analytics | Trader
  Intelligence`; reran with case-insensitive title/body checks and the pass
  succeeded.

Vercel log checks:

- `npx vercel logs dpl_57zRqHc2b92DWykcpZv7gg5RqnXa --level error --since 30m`
  found no logs.
- `npx vercel logs dpl_57zRqHc2b92DWykcpZv7gg5RqnXa --level warning --since 30m`
  found no logs.
- `npx vercel logs dpl_57zRqHc2b92DWykcpZv7gg5RqnXa --status-code 500,501,502,503,504 --since 30m`
  found no logs.

Current best next step:

- Keep monitoring production after real user traffic. News remains intentionally
  outside this Intelligence smoke pass.

# 2026-07-10 watchlist V2 card trial

- Implemented a trial `/watchlist` V2 surface on branch
  `codex/watchlist-v2-cards` from a clean worktree.
- Replaced the live watchlist table with ticker cards focused only on curated
  support and resistance levels from `levelMap.supportLevels` and
  `levelMap.resistanceLevels`.
- Kept the live watchlist API, SSE updates, polling fallback, archive pages,
  auth, and storage contracts unchanged.
- Changed `/watchlist/[symbol]` to redirect back to `/watchlist` so live ticker
  cards no longer click through to detail pages.
- Added unit coverage for preserving every curated support/resistance level and
  marking nearest levels without imposing a UI cap.

Verification:

- `npm test -- src/lib/live-watchlist/__tests__/watchlist-v2-levels.test.ts src/lib/live-watchlist/__tests__/live-watchlist-labels.test.ts src/lib/live-watchlist/__tests__/live-watchlist-store.test.ts`
  passed.
- `npm run build:webpack` passed.
- Local smoke seeded one ticker through `/api/live-watchlist/ingest` and
  verified `/watchlist` rendered one V2 card with 8 level rows, zero old table
  rows, and zero `/watchlist/V2QA` detail links. `/watchlist/ZBAO` returned
  `307 Location: /watchlist`.

Current best next step:

- Open the PR for review, then deploy only after approval by merging to clean
  `main` and using the standard production Vercel workflow.
