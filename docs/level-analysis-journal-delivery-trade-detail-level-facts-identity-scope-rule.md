# Level Analysis Trade Detail Facts Identity Scope Rule

Gate `journal_level_analysis_delivery_trade_detail_level_facts_identity_scope_hardening`.

## Rule

Trade detail level-analysis facts must be read in the saved journal context:

- `workspaceId`
- `accountId`
- `userId`
- `savedTradeId`

`savedTradeId` alone is not a safe cross-user, cross-workspace, or cross-account
identifier. In the local SQLite journal database, `saved_trades.id` is a table
primary key. Duplicate saved trade detection is keyed separately by
`(account_id, trade_fingerprint)`. That means a facts route must first resolve
the current journal context for the saved trade, then read the latest
`journal_level_analysis_trade_links` row through that same context.

## Current Local Demo Context

The current Intelligence app is still a local single-user journal surface. The
trade detail route and facts route resolve saved trades through the existing
demo identity constants:

- `DEMO_WORKSPACE_ID`
- `DEMO_ACCOUNT_ID`
- `DEMO_USER_ID`

Those constants are appropriate only at the local demo/auth-context boundary.
They are not proof that `savedTradeId` is globally unique.

## Route Behavior

`GET /api/trades/[tradeId]/level-analysis/facts` now requires a saved trade in
the current journal context before returning facts.

- If the saved trade exists, the route reads the latest scoped trade link.
- If the saved trade exists but no scoped trade link exists, the route returns
  the existing `not_checked` facts read model.
- If the saved trade cannot be resolved in the current journal context, the
  route rejects the request instead of reading by `savedTradeId` alone.

The route still does not resolve candidates on read, change LevelEngine
behavior, expose raw payloads in UI/read models, or add recommendations,
coaching, grading, P/L, giveback, behavior scoring, trade advice, or
buy/sell/hold decisions.
