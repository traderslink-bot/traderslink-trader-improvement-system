# Trader Intelligence v3 GA0-B3 — Consecutive-Loss Daily-Stop Simulation Proof

## 1. Implementer-evidence warning

This is an implementer handoff, not independent proof. The tests and checks
below establish what was run locally; an independent auditor must inspect the
contracts, source, persisted graph, and adversarial behavior before this draft
PR can be accepted. No audit review thread was resolved by this work.

## 2. Repository and exact branch state

- Repository: `traderslink-bot/traderslink-trader-improvement-system`
- Remote: `git@github.com:traderslink-bot/traderslink-trader-improvement-system.git`
- Branch: `agent/trader-intelligence-v3-ga0-b3-daily-stop-proof`
- Draft PR: [#156](https://github.com/traderslink-bot/traderslink-trader-improvement-system/pull/156)
- PR target: `main`
- Accepted B2 merge SHA: `4338cab7d46b8a0548b22346f81b42db5fec3bf0`
- Current `origin/main`: `4338cab7d46b8a0548b22346f81b42db5fec3bf0`
- B3 merge base: `4338cab7d46b8a0548b22346f81b42db5fec3bf0`
- Tested executable head: `51c7b421f33b872be69f9ce4a1c34cbda29881e5`
- Executable parent: `4338cab7d46b8a0548b22346f81b42db5fec3bf0`
- Documentation/current head: `da9ad60563c27a6cc06d83a0e582913c70c45dbd`
  (later Markdown-only handoff commit).

## 3. Commit chronology

1. `4338cab7d46b8a0548b22346f81b42db5fec3bf0` — accepted GA0-B2 merge and
   B3 merge base.
2. `51c7b421f33b872be69f9ce4a1c34cbda29881e5` — executable B3 implementation,
   tests, ADR, and status updates; parent is the B2 SHA above.
3. `da9ad60563c27a6cc06d83a0e582913c70c45dbd` — later Markdown-only handoff
   commit; parent is the executable head and no executable files changed.

## 4. Changed-file inventory

Executable implementation:

- `src/lib/trader-intelligence-v3/analytics/tools/daily-stop/daily-stop-analysis.ts`
- `src/lib/trader-intelligence-v3/analytics/tools/daily-stop/daily-stop-exact-math.ts`
- `src/lib/trader-intelligence-v3/analytics/tools/daily-stop/daily-stop-execution-authority-contract.ts`
- `src/lib/trader-intelligence-v3/analytics/tools/daily-stop/daily-stop-execution-replay.ts`
- `src/lib/trader-intelligence-v3/analytics/tools/daily-stop/daily-stop-policy.ts`
- `src/lib/trader-intelligence-v3/analytics/tools/daily-stop/daily-stop-reference.ts`
- `src/lib/trader-intelligence-v3/analytics/tools/daily-stop/daily-stop-simulation.ts`
- `src/lib/trader-intelligence-v3/analytics/tools/daily-stop/index.ts`
- `src/lib/trader-intelligence-v3/analytics/tools/index.ts`
- `src/lib/trader-intelligence-v3/domain/identity/content-digest.ts`

Tests and governing/status documentation:

- `src/lib/trader-intelligence-v3/__tests__/ga0-b3/daily-stop-analysis.test.ts`
- `src/docs/trader-intelligence-v3-adr-ga0-b3-daily-stop-proof-v1.md`
- `plan.md`
- `src/docs/codex-project-log.md`
- `src/docs/trader-intelligence-v3-project-log.md`
- This handoff file.

No dependency manifest, lockfile, route, UI, database migration, market-data
adapter, deployment configuration, or hosted production repo was changed.

## 5. Requirement-to-file-and-test map

| Requirement | Implementation / evidence |
| --- | --- |
| Exact tool identity, canonical arguments, registry | `daily-stop-policy.ts`; argument-bound tests |
| Partition and session ordering | `daily-stop-simulation.ts`; completion, overlap, and caller-order tests |
| Loss streak, flat reset, stop timestamp, strict suffix | `daily-stop-simulation.ts`; streak/suffix tests |
| Exact equations and reconciliation | `daily-stop-exact-math.ts`, analysis aggregate/session rows; exact-difference test |
| Exclusion ledger and limitation behavior | analysis exclusion table and explicit unavailable excluded-session metric |
| Evidence/table/series/claim/diagnostic/receipt graph | `daily-stop-analysis.ts`; artifact-graph test |
| Persisted execution authority and semantic replay | authority/replay files; replay mutation/tool/argument/order tests |
| Independent differential oracle | `daily-stop-reference.ts`; production/reference parity test |
| ADR and scope boundary | `trader-intelligence-v3-adr-ga0-b3-daily-stop-proof-v1.md` and status logs |

## 6. Tool identity and argument policy

The registered tool is `simulate_daily_stop_rule:v1`. Its normalized argument
schema is content-addressed and requires the canonical policy literals plus
`consecutiveLossThreshold`. The default threshold is canonical string `"2"`.
Unknown fields, numbers, fractions, signs, leading-zero forms, and values
outside the closed range are rejected. Supported threshold strings are exact
integers `"1"` through `"16"`.

## 7. Partition and session policy

Rows are grouped by canonical owner, canonical account, currency, authoritative
session date, timezone, and date basis. The supported currencies are CAD and
USD; accepted timezones include `America/New_York` and `UTC`. Within each
partition, rows use authoritative first-entry ordering with the B1 sequence as
the deterministic tie-break. The simulation consumes verified B1 dataset,
derivation, and currency-partition receipts.

## 8. Daily-stop semantics

- Only completed trades with exact negative completed net P/L advance the loss
  streak.
- A completed flat trade resets the streak to zero.
- The stop timestamp is the final exit timestamp of the completion that reaches
  the threshold.
- Removed trades are exactly the first-entry suffix satisfying
  `firstEntryAt > stopFinalExitAt`.
- Entries at or before the stop timestamp are retained, including already-open
  overlap positions; they are disclosed in the session artifact.
- A same-timestamp completion group that could change the threshold trigger
  ordering fails closed with a limitation. Only unambiguous groups may select
  a trigger.

## 9. Exact equations and artifacts

All financial values remain canonical decimal strings and are added/subtracted
with exact decimal arithmetic. For every included session:

```text
actual net P/L = simulated retained net P/L + removed net P/L
difference = simulated net P/L - actual net P/L
```

The session table contains actual, retained/simulated, and removed trade
counts; gross P/L, charges, net P/L, difference, classification, trigger,
overlap, evidence, and limitation fields. The aggregate table contains
candidate/included/excluded population state, threshold/help/harm/unchanged
counts, exact totals, leave-one-session sensitivity, largest contribution,
outlier state, and limitations. The result also emits an exclusion table when
needed, three chart-ready series, diagnostics, optional claims, a final receipt,
and content-addressed execution authority.

## 10. Sample, claim, outlier, and exclusion policies

Fewer than 10 threshold-reached sessions is descriptive-only and claim-limited;
5–9 is an intermediate descriptive sample and fewer than 5 is explicitly
insufficient. A tentative claim requires at least 10 threshold-reached sessions,
no genuine limitation, and stable direction after removing both the largest
helped and largest harmed session. No high-confidence claim is emitted. Any
direction-changing outlier sensitivity blocks claims.

Exclusion candidates remain explicit and preserve candidate key, reason, and
limitation codes. Because an excluded candidate lacks included session identity,
`excluded_session_count` is unavailable with
`ti_v3_daily_stop_excluded_session_scope_unavailable` when the exclusion ledger
is non-empty; candidate count is not silently presented as session count.

## 11. Evidence and replay graph

Evidence bundles cover actual rows, retained rows, removed rows, the trigger,
aggregate population, and excluded candidates. Table cells and series points
reference their source evidence. The final receipt binds run context,
normalized arguments, registry, tables, series, claims, diagnostics, evidence,
and authority. Replay first validates the persisted graph, rehydrates the
verified B1 source authority, rebuilds the partition, reruns B3, and compares
the canonical graph. Mutated metrics, foreign tool identity, argument changes,
and reordered tables are rejected by tests.

## 12. Independent reference simulator

`daily-stop-reference.ts` implements a separate completion-sweep algorithm. It
does not import or call the production streak, trigger, retention, or suffix
selection loop. It independently handles flat resets, threshold crossing,
strict suffix membership, overlap retention, and ambiguous same-time groups.
Focused tests compare production and reference rows, stop state, retained and
removed membership, and exact P/L/count results.

## 13. Tested commands and results

Final executable checkpoint, run at exact head `51c7b421f33b872be69f9ce4a1c34cbda29881e5`:

- `node_modules/.bin/tsc.cmd --noEmit --pretty false --project tsconfig.json` —
  passed.
- `node_modules/.bin/vitest.cmd run src/lib/trader-intelligence-v3/__tests__/ga0-b3/daily-stop-analysis.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-b2 src/lib/trader-intelligence-v3/__tests__/ga0-b1 src/lib/trader-intelligence-v3/__tests__/architecture-boundary-guard.test.ts --reporter=dot` — 6 files, 108 tests passed, 55.65 seconds.
- `npm run verify:ti-v3:architecture` — passed; 437 architecture files, 43
  API routes, 82 classified Trader Intelligence routes.
- `npm run verify:ti-v3:private-data` — passed with `ok:true`; 23,715 records
  scanned, 23,700 final-tree records, 15 PR-history blobs.

The prescribed `npm run verify:ti-v3:ga0-a2` reached 13 passing files, 306
passing tests, and 2 failing SQLite binding tests in 64.51 seconds. The two
failures are the existing `better-sqlite3` native-binding lookup failure, not a
B3 assertion failure; the chained architecture/private-data subcommands did
not run in that failed chain and were run separately above.

## 14. TypeScript, lint, build, CI, and deliberately unrun commands

TypeScript passed at the executable head. ESLint was attempted for all changed
TypeScript files but was blocked before linting by the existing shared
dependency failure `Cannot find module './xhtml'` from `acorn-jsx/index.js`.
No build was required: this is a local analytics-contract/tool addition with
no route, UI, Next configuration, dependency, or production artifact change.

Executable-head CI is pending, not passed:

- Workflow `CI`, run `30131239211`, job `89605997240`, `test-and-verify` —
  in progress at handoff preparation.
- Documentation-head CI — no check was reported for `da9ad60563c27a6cc06d83a0e582913c70c45dbd`
  after the Markdown-only push. This is not a pass.

Deliberately unrun: production deployment, Vercel commands, merge, readiness
promotion, full Playwright/browser pass, market-data refresh, database
migration, B4 work, AI/UI/chart-rendering work, and any independent audit
commands beyond the focused local checkpoint. `npm ci` was not run because no
dependency files changed.

## 15. Failures, corrections, limitations, and deferred work

The first lint attempt exposed the pre-existing `acorn-jsx/xhtml` dependency
problem. The A2 verifier exposed the pre-existing Node 24 / shared
`better-sqlite3` native-binding problem. The aggregate exclusion count was
corrected before the executable commit so it cannot guess a session count from
candidate count. No owner worktree was reset, cleaned, stashed, or modified;
the implementation used an isolated linked worktree.

Deferred to independent audit or a later approved phase: native dependency
repair, CI result review, production handoff, confidence calibration beyond
the GA0-B3 tentative policy, future UI/rendering, market-data integration,
and any B4 expansion.

## 16. Explicit scope confirmation

No B4, AI, UI, chart rendering, market data, support/resistance, Academy,
migration, hosted-user, production, deployment, merge, or unrelated product
work entered this branch. No independent audit thread was resolved or altered.

## 17. Exact independent audit commands

From the repository root, after checking out the branch and confirming the
exact heads above:

```powershell
git status -sb
git diff 4338cab7d46b8a0548b22346f81b42db5fec3bf0..HEAD --check
node_modules/.bin/tsc.cmd --noEmit --pretty false --project tsconfig.json
node_modules/.bin/vitest.cmd run src/lib/trader-intelligence-v3/__tests__/ga0-b3/daily-stop-analysis.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-b2 src/lib/trader-intelligence-v3/__tests__/ga0-b1 src/lib/trader-intelligence-v3/__tests__/architecture-boundary-guard.test.ts --reporter=dot
npm run verify:ti-v3:architecture
npm run verify:ti-v3:private-data
npm run verify:ti-v3:ga0-a2
```

The last command is expected to require a repaired compatible
`better-sqlite3` binding in this environment. Independently inspect every B3
source file, rerun the reference differential cases, add exclusion-ledger
fixtures, and verify the persisted authority/replay graph and claim suppression
under every limitation.

## 18. Ready-to-paste independent-auditor prompt

> Audit GA0-B3 in repository `traderslink-bot/traderslink-trader-improvement-system`, branch `agent/trader-intelligence-v3-ga0-b3-daily-stop-proof`, draft PR #156 (`https://github.com/traderslink-bot/traderslink-trader-improvement-system/pull/156`). Accepted B2 merge SHA and B3 merge base are `4338cab7d46b8a0548b22346f81b42db5fec3bf0`; tested executable head is `51c7b421f33b872be69f9ce4a1c34cbda29881e5`; documentation/current head is `da9ad60563c27a6cc06d83a0e582913c70c45dbd`; handoff path is `src/docs/trader-intelligence-v3-ga0-b3-daily-stop-proof-implementation-and-audit-handoff-2026-07-19.md`. Independently inspect the production/reference split, exact decimal authority, canonical arguments and registry, owner/account/currency/sessionDate/timezone/date-basis partitioning, completed-loss streak, flat reset, final-exit stop timestamp, strict later-entry suffix, overlap retention, same-time fail-closed behavior, exclusion ledger, exact reconciliation, evidence/table/series/diagnostic/receipt/replay graph, claim/sample/outlier policy, and all B1/B2 contract boundaries. Run the exact commands in section 17, distinguish passed, pending, blocked, and unrun results, and do not infer proof from implementer evidence. Stop at audit findings: do not merge, deploy, mark ready, resolve audit threads, begin B4, or broaden into AI, UI, chart rendering, market data, support/resistance, Academy, migration, or hosted-user work.

## 19. Stop boundary

This branch remains a single draft PR targeting current `main`. The requested
implementation is complete and handed off for independent audit. Do not merge,
deploy, mark ready, resolve audit threads, begin B4, or expand scope.
