# V3 Day Session Manual Entry Preview Progress

## Status

Checkpoint 0 hosted functional slice is complete on
`codex/v3-journal-preview`. The separate Neon project, Vercel Preview-only
database secret, Vercel Authentication protection, protected page, and
execution write/read path have been verified.

The execution-entry UI direction was approved on 2026-07-29. The hosted
functional slice must use only a branch-scoped Neon test database and Vercel
Preview. Production data and the homepage, Watchlist, and Academy are outside
this work.

## Approved Flow

1. Enter every Buy and Sell execution for the selected trading day.
2. Add another row with the full-width `Add execution` action.
3. Save executions without manually entering P/L or round-trip groupings.
4. Reconstruct the Day Session through governed V3 authority.
5. Review completed trades, tags, notes, screenshots, and rule check-ins.

## Current Boundary

- The preview branch now includes the committed V3 persistence, analytics, and
  Material dashboard foundation.
- Added `/trades/day-session/[sessionDate]` under the shared V3 dashboard
  layout.
- Added the approved buy/sell execution-entry card with removable rows and a
  full-width `Add execution` action.
- Added a narrowly scoped V3 manual-execution endpoint.
- Manual symbols receive deterministic preview instrument keys, and entered
  New York session times are converted server-side to canonical UTC before
  ingestion.
- Added an async Neon preview source-document store that preserves the existing
  canonical persisted-record format.
- The store refuses to initialize unless the Vercel environment, exact Git
  branch, database purpose, Neon host, and database name all prove the isolated
  test target.
- Vercel contains `V3_JOURNAL_DATABASE_URL` as a sensitive Preview variable
  linked only to `vercel-landing`. The shared-variable link did not inject the
  value into CLI Preview deployments, so the same Neon test connection is
  also attached directly to the project as a sensitive Preview-only variable.
  The store retains the exact branch, Neon host, purpose, and `neondb`
  identity checks.
- Vercel Authentication is enabled with Standard Protection. The hosted
  preview owner adapter is permitted only for the exact preview branch and
  explicit `vercel_authentication` mode; it does not read Academy or
  production identity data.
- Because `vercel-landing` is not Git-connected, CLI Preview deployments do
  not receive `VERCEL_GIT_COMMIT_REF`. The boundary accepts the deployment-
  specific `TRADER_INTELLIGENCE_V3_PREVIEW_SOURCE_REF` only as a fallback when
  the native Vercel Git ref is absent; both must equal the isolated branch.
  The same rule applies to
  `TRADER_INTELLIGENCE_V3_PREVIEW_TARGET=preview` when the CLI deployment does
  not expose `VERCEL_ENV` at runtime, and to
  `TRADER_INTELLIGENCE_V3_PREVIEW_RUNTIME=vercel` when Vercel's CLI runtime
  omits its native runtime-identification variables.

## Required Preview Variables

- `V3_JOURNAL_DATABASE_URL` (sensitive, Preview, linked only to
  `vercel-landing`)
- Optional explicit overrides:
  `TRADER_INTELLIGENCE_V3_PREVIEW_DATABASE_NAME=neondb` and
  `TRADER_INTELLIGENCE_V3_DATABASE_PURPOSE=v3_journal_preview_test`
- Existing authenticated V3 owner/account declarations. An explicit
  instrument map may override manual symbol identities but is not required for
  ordinary manual entry.

These variables must be scoped only to the
`codex/v3-journal-preview` Vercel Preview branch.

## Verification

- Focused ESLint passed for the new page, client form, API route, and Neon
  store.
- Repository TypeScript passed with `--noEmit --incremental false`.
- `git diff --check` passed.
- Vercel Preview build completed successfully.
- Protected Day Session route returned HTTP 200.
- Authenticated Preview database smoke persisted and read back two executions:
  accepted `2`, rejected `0`, with canonical persistence digest
  `ti_v3:canonical_content:v1:sha256:e915a062e6a42c6371857d2a4d81cb13dc3279f629172e80118875a209f14636`.
- Current protected Preview:
  `https://vercel-landing-ees8v1g7y-jeremylgk20-1197s-projects.vercel.app/trades/day-session/2026-07-29`
- No Vitest, broad browser/E2E suite, production deployment, live-domain
  promotion, or production-data write was run.
