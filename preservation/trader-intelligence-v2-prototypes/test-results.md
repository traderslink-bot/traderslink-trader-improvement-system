# Focused test recovery and results

## Recovered files and test counts

| Test file | Tests | Feature | Preserved as snapshot | Preserved in patch |
| --- | ---: | --- | --- | --- |
| `manual-execution-entry.test.ts` | 2 | Manual trade entry | Yes | Yes |
| `period-reflection-api-route.test.ts` | 10 | AI period reflections | Yes | Yes |
| `period-reflection-generation.test.ts` | 7 | AI period reflections | Yes | Yes |
| `period-reflection-usage-report.test.ts` | 2 | AI period reflections | Yes | Yes |
| `real-coach-marketplace.test.ts` | 11 | Real Coach / Whop | Yes | Yes |
| Total | 32 | | | |

## Exact test names

Manual trade entry:

1. builds a generic execution CSV that the importer can save as a closed trade
2. blocks incomplete manual rows before they reach the import pipeline

AI period reflections:

1. rejects invalid requested period kinds
2. rejects AI generation for the free execution tier
3. saves deterministic fallback period reflections when OpenAI is not configured
4. allows daily reflection before close but blocks repeat generation until evidence changes
5. caps daily reflection generation at three attempts per trading day
6. does not require a post-close finalization click after a day-so-far review
7. rejects a weekly reflection before Friday market close
8. saves generated OpenAI reflections and exposes them through the product view model
9. marks generated reflections stale after a related trade note changes
10. returns a no-saved-report response before the user imports trades
11. saves deterministic fallback when no OpenAI API key is configured
12. increments generation attempts when updating the same period
13. calls the OpenAI Responses API with structured output and saves generated narrative
14. saves failed OpenAI attempts with fallback reflection text
15. includes weekly memory when preparing a monthly reflection
16. builds request bodies with the default OpenAI model
17. estimates OpenAI cost for known reflection model usage
18. aggregates append-only generation events by model and period kind
19. surfaces configured provider readiness without exposing the API key

Real Coach / Whop:

1. seeds one approved prototype coach idempotently
2. only lists approved visible coaches in the public directory
3. reserves capacity for requested students before coach payment is confirmed
4. requires a current one-month app access pass before requesting a coach
5. allows a new monthly request after an older request expires
6. allows read-only student trade access only after relationship activation
7. keeps private coach notes out of the student view while exposing published feedback
8. lets the assigned student complete coach action items
9. grants app access from an idempotent Whop payment succeeded event
10. ignores unrelated Whop payments instead of granting app access
11. fails closed when app-access Whop metadata is incomplete or coach is not approved

## Exact command

```powershell
npx vitest run src/lib/trader-analytics/__tests__/manual-execution-entry.test.ts src/lib/trader-analytics/__tests__/period-reflection-api-route.test.ts src/lib/trader-analytics/__tests__/period-reflection-generation.test.ts src/lib/trader-analytics/__tests__/period-reflection-usage-report.test.ts src/lib/trader-analytics/__tests__/real-coach-marketplace.test.ts --reporter=dot
```

## Result in the source V2 worktree

- Date: 2026-07-18
- Test files: 5 passed / 5
- Tests: 32 passed / 32
- Vitest duration: 35.52 seconds
- No live model or Whop call occurred. Provider behavior was mocked or locally normalized.

## Result in the disposable GA0-A1 reconstruction

Reconstruction base: `4f9e440116258c9548a2d13f7ea057a9075101c6`

- All four sanitized patches applied cleanly.
- `npm ci --no-audit --no-fund`: passed; 603 packages installed.
- Test files: 3 passed, 2 failed, 5 total.
- Tests: 12 passed, 20 failed, 32 total.
- Vitest duration: 38.98 seconds.
- Failure breakdown: 19 tests encountered `ti_v3_data_mode_invalid` because the exact V2 tests do not declare GA0-A1 data-mode/durable-path evidence; one test encountered missing V2 helper `canUseAiPeriodReflections` on current main.
- Passing coverage included both manual-entry tests, all seven isolated reflection-generation tests, both usage-report tests, and the invalid-period API rejection.

This result is intentionally not described as 32/32 reconstruction success. The exact recovered tests are preserved unchanged. A later V3 port must adapt test setup and integration contracts without weakening GA0-A1.

## Preservation-branch repository verification

- `npm ci`: passed; 603 packages installed from the unchanged lockfile. `npm audit` reported the repository's existing five advisories (two low, one moderate, two high).
- `npx tsc --noEmit --pretty false`: passed.
- `npx eslint "preservation/trader-intelligence-v2-prototypes/**/*.{js,jsx,ts,tsx,mjs,cjs}" --no-error-on-unmatched-pattern`: passed; zero active code/config paths matched because preserved code uses `.source` suffixes.
- `npm run verify:ti-v3:private-data`: passed before commit; 23,645 final-tree records scanned with zero findings. It is rerun after commit so PR-history blobs are also counted.
- `npm run verify:ti-v3:architecture`: passed; 75 architecture files, 42 API routes, and 82 classified Trader Intelligence routes.
- `npm test -- --reporter=dot`: passed; 164 test files and 1,523 tests.
- `npm run build`: passed; Academy registry validation passed and Next.js generated 127 routes. The unchanged application emitted 19 known Academy registry notices and five existing broad-file-tracing warnings.

No command called a live AI model, Whop, payment system, broker, market-data provider, Vercel, or deployment service.
