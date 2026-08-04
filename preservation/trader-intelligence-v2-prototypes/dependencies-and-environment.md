# Dependencies and environment inventory

No secret values are recorded here.

## Identified V2 package versions

| Package | V2 value |
| --- | --- |
| Next.js | `16.2.3` |
| React | `19.2.4` |
| Vitest | `^4.1.4` |
| better-sqlite3 | `^12.9.0` |
| @whop/sdk | `^0.0.40` |
| @mui/material | `^9.0.1` |
| @mui/icons-material | `^9.0.1` |

The complete V2 `package.json` is preserved as a snapshot-only Real Coach integration artifact because it is mixed with unrelated V2 dependency changes. The lockfile was not preserved: the package version needed for later inspection is recorded above, while copying the mixed lock would add unrelated work.

## Environment-variable names

- `NODE_ENV`
- `OPENAI_API_KEY`
- `OPENAI_REFLECTION_MODEL`
- `OPENAI_REFLECTION_PRICING_SOURCE`
- `OPENAI_RESPONSES_ENDPOINT`
- `TRADER_INTELLIGENCE_DB_PATH`
- `TRADER_INTELLIGENCE_TIER`
- `WHOP_WEBHOOK_SECRET`

The V2 tests delete or replace model configuration and mock `fetch`; no live OpenAI request is made. Real Coach tests call the local verified-event processor with synthetic objects; they do not instantiate the Whop SDK or call Whop.

## Prototype routes and APIs

Manual entry:

- Page: `/manual-entry`
- Intended handoff: existing CSV import/commit flow

AI period reflections:

- API: `/api/trader-reflections/generate`
- UI components: period reflection panel and regenerate button
- Admin concept: `/admin/reflection-usage`
- V2 integration concepts: `/workspace` and `/coach`

Real Coach / Whop:

- API: `/api/real-coach/whop-webhook`
- Pages: `/coaches`, `/coaches/[coachId]`, `/coach-dashboard`, `/coach-human`, `/real-coach-session`, and `/admin/coaches`

These are V2 intended paths, not accepted V3 routes. Current main uses the `/intelligence` route family and deny-by-default containment matrix.

## Storage assumptions

- Manual entry serializes a user-entered execution into the existing broker-shaped import boundary; this is a V2 convenience, not canonical V3 execution provenance.
- AI period reflections assume V2 SQLite tables, repository methods, generated-reflection records, append-only generation events, saved trade notes, and session notes.
- Real Coach assumes V2 SQLite tables for coach profiles, access passes, relationships, private notes, published reports, action items, and processed payment events.
- The original tests create isolated synthetic SQLite files beneath the operating-system temporary directory.
- GA0-A1 current main rejects those legacy test paths for real-owner mode and requires explicit `TRADER_INTELLIGENCE_DATA_MODE`; this is an expected reconstruction incompatibility, not a reason to weaken V3 persistence controls.

## Login, entitlement, and provider assumptions

- `app/real-coach-auth.ts` uses a provisional local cookie/role model and demo identities.
- That model is not Trader Intelligence production authentication, tenancy, or authorization.
- Academy Discord authentication is not proof of Trader Intelligence user/account readiness.
- The webhook route expects `WHOP_WEBHOOK_SECRET`; the preserved tests bypass the live SDK and exercise synthetic normalized payment events.
- Only explicit synthetic `payment.succeeded` cases with required metadata grant prototype access; unrelated or incomplete events fail closed.

## Known current-main incompatibilities

- GA0-A1 requires an explicit data mode and rejects the V2 tests' temporary real-owner database paths.
- Current main does not export V2's `canUseAiPeriodReflections` tier helper.
- AI reflection types, repository migrations/methods, view-model wiring, and exports live in mixed modified V2 files; complete snapshots are preserved under `snapshots/ai-period-reflections/integration/` for selective porting.
- V2 top-level UI routes conflict architecturally with current `/intelligence` routing and route-containment policy.
- Current main does not declare `@whop/sdk`; the V2 package snapshot records its prototype version.
- Direct application of snapshot-only integration files would overwrite newer V3 code and is prohibited.

## Test commands

```powershell
npm ci
npx vitest run src/lib/trader-analytics/__tests__/manual-execution-entry.test.ts src/lib/trader-analytics/__tests__/period-reflection-api-route.test.ts src/lib/trader-analytics/__tests__/period-reflection-generation.test.ts src/lib/trader-analytics/__tests__/period-reflection-usage-report.test.ts src/lib/trader-analytics/__tests__/real-coach-marketplace.test.ts --reporter=dot
```
