# V3 Day Session Manual Entry Preview Progress

## Status

Checkpoint 0 implementation complete locally on `codex/v3-journal-preview`.
The separate Neon project and the Vercel Preview-only database secret have
been verified. Hosted authorization configuration and Vercel Preview
deployment are still pending.

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
- Added an async Neon preview source-document store that preserves the existing
  canonical persisted-record format.
- The store refuses to initialize unless the Vercel environment, exact Git
  branch, database purpose, Neon host, and database name all prove the isolated
  test target.
- Vercel already contains `V3_JOURNAL_DATABASE_URL` as a sensitive Preview
  variable linked only to `vercel-landing`; the store accepts that established
  name while retaining the exact branch, Neon host, and `neondb` identity
  checks.

## Required Preview Variables

- `V3_JOURNAL_DATABASE_URL` (sensitive, Preview, linked only to
  `vercel-landing`)
- Optional explicit overrides:
  `TRADER_INTELLIGENCE_V3_PREVIEW_DATABASE_NAME=neondb` and
  `TRADER_INTELLIGENCE_V3_DATABASE_PURPOSE=v3_journal_preview_test`
- Existing authenticated V3 owner/account and instrument declarations.

These variables must be scoped only to the
`codex/v3-journal-preview` Vercel Preview branch.

## Verification

- Focused ESLint passed for the new page, client form, API route, and Neon
  store.
- Repository TypeScript passed with `--noEmit --incremental false`.
- `git diff --check` passed.
- No Vitest, browser/E2E, production build, database smoke test, or deployment
  was run.
