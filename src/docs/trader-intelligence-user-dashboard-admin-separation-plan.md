# Trader Intelligence User Dashboard And Admin Separation Plan

Branch: `pm/user-dashboard-admin-separation`

## Goal

Make Trader Intelligence easier for a new trader to use while keeping advanced operator tools available in admin areas.

This pass should focus on product flow, UI clarity, and user/admin separation. It should not change core analytics, scoring, billing, auth, or review-ranking logic.

## Main Product Direction

The first user flow should be:

1. Upload a broker CSV.
2. Let the app detect the broker, date range, symbols, closed trades, open trades, and import issues.
3. Save clean execution data.
4. Send the user to a simple analytics-first dashboard.
5. Keep review tools visible, but not as the main first-step pressure.

The user should not manually choose the date range during upload. The system should detect it from the CSV.

## User Dashboard

The dashboard should feel more like a clean analytics dashboard.

Above the fold, prioritize:

- gross P/L
- win rate
- total saved trades
- date range covered
- current plan state
- one primary next action

Main sections should be:

1. Results overview
2. Trading activity
3. Behavior snapshot
4. Charts
5. Review tools
6. Advanced tools

Review stays in the app, but should be framed as a tool for studying individual trades instead of a requirement to review every historical trade.

## Admin Dashboard

Admin and operator features should live in `/intelligence/admin` or admin-only subroutes.

Admin should contain or link to:

- candle lookback settings
- chart processing caps
- feature flags
- plan controls
- import diagnostics
- broker parser status
- candle data queue status
- calibration tools
- failed chart-data jobs
- manual rerun controls
- copy audit tools
- storage/readiness status
- debug tools

## Candle Lookback Admin Settings

Add or scaffold admin settings for candle data lookback.

Recommended settings:

- default candle lookback days
- maximum candle lookback days
- whether older trades can request candle data
- whether candle processing is limited by plan
- max chart jobs per import
- max chart jobs per account
- run mode
- historical backfill on/off

Suggested first policy:

- Execution tier: execution data only.
- Chart tier: recent candle data plus admin-allowed older trades.
- AI add-on: uses the data available from the user's base tier.

Do not overbuild production persistence unless the app already supports it.

## Tier Direction

Use two base tiers plus optional AI add-on.

### Execution Intelligence

Uses execution data only. Includes CSV import, P/L analytics, win rate, time of day, symbol stats, hold time, trade frequency, scaling behavior, and basic coaching from executions.

### Chart Intelligence

Includes Execution Intelligence plus candle/chart-derived context. Preserve the rule that `levels-system` owns candle fetching, support/resistance, and market-context logic.

### AI Add-On

Can attach to either base tier. Execution tier plus AI explains execution-only analytics. Chart tier plus AI explains execution plus chart context.

## User-Facing Language

Normal user pages should avoid internal system terms.

Replace technical wording with plain wording. Examples:

- market context unavailable -> Chart data is not ready yet
- decision review snapshot -> Chart review
- blocked open trade -> Open trade still active
- diagnostics -> Import issues
- queued -> Waiting for chart data

## Files To Inspect

- `app/intelligence/page.tsx`
- `app/intelligence/admin/page.tsx`
- `app/intelligence/upload-csv/page.tsx`
- `app/intelligence/upload-csv/upload-csv-client.tsx`
- `app/intelligence/analytics/page.tsx`
- `app/intelligence/analytics/analytics-client.tsx`
- `app/intelligence/review/page.tsx`
- `app/app-ui.tsx`
- `app/globals.css`
- `docs/routes.md`
- `docs/site-architecture.md`
- `src/docs/trader-functional-readiness-next-handoff.md`

## Scope

Include:

1. Simplify user dashboard messaging and hierarchy.
2. Keep review visible but secondary.
3. Move internal/admin panels into admin areas.
4. Add or scaffold admin candle-lookback settings.
5. Improve upload wording around automatic CSV date detection.
6. Replace user-facing system terms with plain language.

Do not include:

1. Do not rewrite review selection logic.
2. Do not claim the app selects the most important trades for review.
3. Do not remove review from the app.
4. Do not change analytics or scoring behavior.
5. Do not add billing or auth production behavior.
6. Do not move candle fetching into this repo.

## Checks

Verify key routes still load:

- `/intelligence`
- `/intelligence/upload-csv`
- `/intelligence/admin`
- `/intelligence/analytics`
- `/intelligence/review`

Recommended commands:

```bash
npx tsc --noEmit --pretty false
npm run lint
npm run build
```
