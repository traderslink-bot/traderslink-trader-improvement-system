# Trader Intelligence v3 GA0-A1 Independent Audit Handoff

Date: 2026-07-17

## Why this file exists

This file gives an independent AI auditor a precise map of the GA0-A1 work, the claims made by the implementation engineer, the evidence already collected, and the areas most likely to hide a defect.

It is not proof that the implementation is correct. It is not an architecture authority. The auditor must use it to understand the intended change and then independently compare those claims with the controlling documents, source diff, tests, and runtime behavior.

The audit is requested because GA0-A1 introduces the access boundary protecting private trade/import data before later exact-financial or analytical work begins. A mistake here could expose owner data, allow an unauthorized mutation, make local development unusable, or create unintended coupling between Trader Intelligence and another application.

## Repository and review target

- Repository: `traderslink-bot/traderslink-trader-improvement-system`
- Base: `origin/main`
- Audit branch: `agent/trader-intelligence-v3-ga0-a1-containment`
- Draft pull request: `https://github.com/traderslink-bot/traderslink-trader-improvement-system/pull/102`
- Implementation head before adding this handoff document: `41f7ee1e407859247d7099d2cefa109db0ba36ed`
- Local linked worktree: `C:\Users\jerac\Documents\TraderLink\trader-intelligence-v3-ga0-a1-containment`
- Canonical implementation commit: `a4a728eb9e379a284320dd97d8f411dd71f1f5dd`
- Documentation follow-up: `38ae82188ae38c765f6a1ff9ff9cc246880956ec`
- Explicit local-owner test fix: `41f7ee1e407859247d7099d2cefa109db0ba36ed`

Before auditing, confirm that the checked-out head still matches the PR. If the branch has moved, treat this document's commit-specific results as historical and audit the new diff.

## How to access this file

### On the same Windows computer

Open this exact file:

`C:\Users\jerac\Documents\TraderLink\trader-intelligence-v3-ga0-a1-containment\src\docs\trader-intelligence-v3-ga0-a1-independent-audit-handoff-2026-07-17.md`

Use this worktree for read-only inspection and verification:

```powershell
Set-Location 'C:\Users\jerac\Documents\TraderLink\trader-intelligence-v3-ga0-a1-containment'
git status --short
git branch --show-current
git rev-parse HEAD
```

### Through GitHub

Open draft PR #102 and inspect the branch files. After this file is pushed, its branch URL is:

`https://github.com/traderslink-bot/traderslink-trader-improvement-system/blob/agent/trader-intelligence-v3-ga0-a1-containment/src/docs/trader-intelligence-v3-ga0-a1-independent-audit-handoff-2026-07-17.md`

With GitHub CLI:

```powershell
gh pr checkout 102
Get-Content -LiteralPath 'src/docs/trader-intelligence-v3-ga0-a1-independent-audit-handoff-2026-07-17.md'
```

If PR checkout would disturb an existing dirty worktree, create a separate clean clone or linked worktree. Do not reset, clean, or overwrite the user's existing changes.

## Required authority read order

Read these completely before deciding whether the implementation satisfies GA0-A1:

1. `AGENTS.md`
2. `plan.md`
3. `src/docs/trader-intelligence-v3-project-log.md`
4. `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`
5. `src/docs/trader-intelligence-v3-ga0-a-control-and-exact-truth-implementation-plan-2026-07-17.md`
6. `src/docs/trader-intelligence-v3-current-system-inventory-2026-07-17.md`
7. `src/docs/trader-intelligence-v3-legacy-hazard-register-2026-07-17.md`
8. this handoff

This handoff is last because it describes what the implementer believes was delivered. Earlier files control the intended architecture and scope.

## User decisions that constrain the audit

- Trader Intelligence and Academy are separate applications.
- No Academy feature, page, lesson, progress record, role, entitlement, or product workflow is part of Trader Intelligence.
- Trader Intelligence may ultimately support Discord login and possibly a normal login.
- GA0-A1 temporarily reads the Discord subject from the existing session record through one replaceable compatibility adapter.
- That compatibility lookup must not turn Academy authorization or product behavior into a Trader Intelligence dependency.
- The application is currently built and tested by one owner on the owner's computer.
- No Vercel preview or production deployment is needed or authorized.
- The GitHub branch and draft PR exist for source review and CI, not deployment.
- GA0-A2 and all later analytics, chart, AI, exact-financial, support/resistance, migration, and public-user work remain out of scope.

## Intended GA0-A1 outcome

The branch is intended to contain the existing single-user prototype behind a fail-closed owner boundary without claiming that the legacy data model is production-ready v3 authority.

The key claims to audit are:

1. only `private_owner_alpha` is operational;
2. the mode must explicitly be `local_only` or `private_hosted`;
3. real hosted-environment signals cannot claim `local_only`;
4. an optimized local `next start` can still run in `local_only` when no hosted signal exists;
5. private-hosted mode requires an exact configured Discord subject and internal owner ID;
6. private-hosted mode rejects local bypass and local SQLite configuration;
7. owner authorization occurs before reachable legacy repository access;
8. all relevant Intelligence pages and APIs are classified exactly once;
9. diagnostic and legacy level-provider routes are unavailable in private-hosted mode;
10. unsafe HTTP methods require an approved Origin before handler execution;
11. private pages and API responses are dynamic and private/no-store;
12. unauthorized responses do not reveal requested private resource identifiers;
13. no GA0-A2/later authority was added;
14. no Academy files were changed;
15. no Vercel deployment was performed.

## Work performed

### Deployment contract

Implemented in `src/lib/trader-intelligence-v3/deployment/`.

The contract defines:

- deployment profile;
- hosting mode;
- storage mode;
- sample/real data mode;
- internal owner ID;
- configured Discord subject for private-hosted mode;
- approved mutation origins;
- hosted-environment signals;
- stable fail-closed reason codes.

Future profiles are declared but rejected as non-operational.

Audit question: the implementation validates configuration on protected access rather than through a process-start instrumentation hook. Decide whether that satisfies the plan's startup/fail-closed intent or whether a separate startup assertion is required later.

### Owner authorization and provisional Discord adapter

Implemented primarily in:

- `src/lib/trader-intelligence-v3/auth/owner-authorization.ts`
- `src/lib/trader-intelligence-v3/auth/next-owner-boundary.ts`
- `src/lib/trader-intelligence-v3/auth/provisional-discord-session-adapter.ts`
- `src/lib/trader-intelligence-v3/domain/owner-identity.ts`

`local_only` maps explicit configuration to one internal owner without a login session. `private_hosted` resolves a Discord subject, compares it exactly with configuration, and maps it to the internal Intelligence owner.

The only permitted v3 import from an Academy path is the named provisional Discord-session adapter. The architecture guard rejects other v3/Academy coupling.

Audit questions:

- Can any request bypass this adapter or supply its own owner identity?
- Does any role, progress, entitlement, or other Academy state influence authorization?
- Are token/session failures generic and fail closed?
- Is the existing session-store lookup safe enough as a temporary compatibility boundary?
- Can the adapter be replaced by an Intelligence-owned Discord/normal-login implementation without changing domain contracts?

### Route containment

Implemented in `src/lib/trader-intelligence-v3/contracts/route-containment.ts` and applied across the Intelligence route tree.

The matrix contains 82 modules:

- 43 owner pages;
- 8 local diagnostic/admin pages;
- 19 owner APIs;
- 6 diagnostic APIs;
- 6 local-only legacy level-provider APIs.

`app/intelligence/layout.tsx` protects the route tree. Repository-backed pages also call the page guard directly because Next.js layouts do not guarantee that authorization completes before parallel child rendering. The repository-backed ticker-story metadata function is also guarded before its data load.

All 31 relevant API modules use `withTraderIntelligenceOwnerRoute` before their legacy handler body runs.

Audit questions:

- Does the filesystem completeness test really include every private Intelligence page/API consumer?
- Are any private endpoints outside the selected API prefixes used by Intelligence?
- Can module initialization or metadata access reach private storage before authorization?
- Does every mutation's declared method match the exported handler?
- Does the handler-name method inference introduce a fragile or bypassable assumption?
- Does the test-only optional Request compatibility path remain impossible in production?

### Mutation and cache protection

Implemented in:

- `src/lib/trader-intelligence-v3/auth/mutation-origin.ts`
- `src/lib/trader-intelligence-v3/auth/private-response.ts`
- `next.config.ts`

Unsafe methods require a normalized Origin matching the request origin or an explicitly configured approved origin. The seeded local optimized-server test declares `http://127.0.0.1:3101` because Next's internal canonical request origin can differ from the browser address.

API responses receive browser/CDN/Vercel no-store headers. `/intelligence/:path*` pages receive private/no-store headers and forced dynamic rendering.

Audit questions:

- Is request URL origin safe behind the intended proxy/host stack?
- Should private-hosted mode require an explicit origin allowlist rather than permitting request-origin fallback?
- Are malformed origins, credentials in URLs, `null`, missing headers, and alternate ports rejected correctly?
- Does setting `Vary: Cookie` preserve rather than damage any framework-required `Vary` values?
- Do all success and error responses retain private/no-store behavior?
- Is the structured `console.info` mutation event sufficient only as a containment diagnostic, and clearly not represented as a durable production audit log?

### Local-only optimized testing

The final change removed `NODE_ENV=production` as proof of hosted deployment. A local optimized `next start` uses production mode but is not necessarily deployed. Actual hosting signals such as Vercel, AWS Lambda, Cloud Run, Fly, Railway, Render, Heroku, or the explicit deployed-environment flag still reject `local_only`.

The seeded Playwright configuration explicitly sets the local owner contract and approved origin. Its synthetic API POSTs also supply Origin.

Audit question: are the hosted signals broad and stable enough to prevent an accidental exposed `local_only` deployment without blocking legitimate local builds?

### Architecture guard

Implemented in:

- `src/lib/trader-intelligence-v3/testing/architecture-boundary-guard.ts`
- `src/scripts/verify-trader-intelligence-v3-architecture.ts`

It is intended to reject:

- v3 domain/contracts importing App Router or Next.js;
- v3 core directly importing database drivers, AI/model SDKs, levels-system, or market providers;
- Academy coupling outside the provisional adapter;
- legacy coaching importing v3 internals;
- authoritative calculation functions being added to route handlers.

Audit the import parser and path filters for false negatives, aliases, dynamic imports, multiline imports, re-exports, renamed calculation functions, and files excluded by the scan.

### Private-data guard

Implemented in:

- `src/lib/trader-intelligence-v3/testing/private-data-guard.ts`
- `src/scripts/verify-trader-intelligence-v3-private-data.ts`
- `.gitignore`

It scans worktree and staged content for private paths, broker export names, likely broker CSV rows, account/personal identifiers, screenshots, and common secret/token shapes. Findings contain code/path/line but not the suspected secret value. Synthetic fixture allowlists are narrow.

Audit for false negatives, unsafe binary handling, oversized files, alternate credential formats, renamed broker exports, Unicode/encoded identifiers, allowlist abuse, and whether ignored untracked private files are still adequately protected by the intended workflow.

### CI and legacy compatibility

The standard CI workflow now runs both v3 guards. Legacy handler tests continue to call wrapped routes through a test-only synthetic request. `src/test/setup.ts` installs explicit synthetic local-owner configuration and supplies same-origin Origin for unsafe legacy test requests.

The seeded level-analysis browser workflow was updated to use explicit local-owner configuration and explicit Origin evidence. This is test compatibility, not a production bypass.

Audit that the test setup cannot mask a missing production requirement and that negative tests explicitly remove or change Origin/session/configuration when testing denial.

### Inventory, hazards, and synthetic cleanup

Added:

- `src/docs/trader-intelligence-v3-current-system-inventory-2026-07-17.md`
- `src/docs/trader-intelligence-v3-legacy-hazard-register-2026-07-17.md`

Realistic-looking synthetic broker account values were renamed to `SYNTHETIC-ACCOUNT` in existing fixtures/presets so the private-data guard can remain strict.

The branch intentionally does not fix the registered legacy hazards, including demo identity defaults, direct SQLite construction, temporary production persistence behavior, 32-bit fingerprints, JavaScript-number financial fields, lifecycle overrides, browser-authoritative filters, chart evidence gaps, request-lifecycle jobs, JSON query authority, nearest-level coaching, or fixed coaching templates.

## Files and surfaces most important to inspect

Prioritize:

1. `src/lib/trader-intelligence-v3/deployment/deployment-contract.ts`
2. `src/lib/trader-intelligence-v3/auth/owner-authorization.ts`
3. `src/lib/trader-intelligence-v3/auth/next-owner-boundary.ts`
4. `src/lib/trader-intelligence-v3/auth/provisional-discord-session-adapter.ts`
5. `src/lib/trader-intelligence-v3/auth/mutation-origin.ts`
6. `src/lib/trader-intelligence-v3/auth/private-response.ts`
7. `src/lib/trader-intelligence-v3/contracts/route-containment.ts`
8. `src/lib/trader-intelligence-v3/testing/architecture-boundary-guard.ts`
9. `src/lib/trader-intelligence-v3/testing/private-data-guard.ts`
10. `app/intelligence/layout.tsx` and repository-backed pages
11. all wrapped `app/api/**/route.ts` modules in the matrix
12. `next.config.ts`
13. `src/test/setup.ts`
14. `playwright.level-analysis.config.ts`
15. `tests/e2e/level-analysis-trade-detail-seeded-flow.spec.ts`
16. `.github/workflows/ci.yml`

## Verification already reported

These are implementer-reported results. Re-run them; do not accept them as independent evidence.

- `npm ci`: passed; 603 packages; audit reported 5 existing vulnerabilities (2 low, 1 moderate, 2 high).
- TypeScript: passed.
- Changed-path ESLint: zero errors; two pre-existing unused-variable warnings in `app/intelligence/coach/page.tsx`.
- Focused v3 tests: 5 files, 50 tests passed.
- Route compatibility tests: 12 files, 87 tests passed.
- Full Vitest suite: 162 files, 1,437 tests passed.
- Layer 2 verification: passed with 13 canonical patterns.
- Layer 3 verification: canonical regression passed.
- Architecture guard: passed, scanning 69 relevant source files.
- Private-data guard: passed; the fully staged implementation scan covered 23,614 worktree/index records.
- Production build: passed with five existing broad filesystem-tracing warnings around legacy stores/provider code.
- Seeded Playwright trade-detail flow: one scenario passed locally and on GitHub.
- Current-head GitHub CI and seeded browser workflow: passed.
- PR state when reported: draft, open, mergeable, clean.
- No live model or external market-data call was made.
- No Vercel command or deployment was run.

## Independent audit commands

Run from the clean audit checkout:

```powershell
git fetch origin --prune
git status --short
git branch --show-current
git rev-parse HEAD
git diff --name-status origin/main...HEAD
git diff --stat origin/main...HEAD
git diff --check origin/main...HEAD

npm ci
npx tsc --noEmit
npx vitest run src/lib/trader-intelligence-v3/__tests__ --reporter=dot
npm test
npm run verify:ti-v3:architecture
npm run verify:ti-v3:private-data
npm run verify:layer2
npm run verify:layer3
npm run build
npm run test:e2e:level-analysis

gh pr checks 102
gh pr view 102 --json url,isDraft,state,mergeable,mergeStateStatus,headRefOid,statusCheckRollup
```

For changed-path lint in PowerShell:

```powershell
$files = git diff --name-only origin/main...HEAD | Where-Object { $_ -match '\.(ts|tsx|js|jsx|mjs|cjs)$' }
npx eslint -- $files
```

Do not call live models, external market-data providers, Vercel, or production services during this audit.

## Required audit output

Return:

1. an executive verdict: accept, accept with required fixes, or reject;
2. findings ordered by severity;
3. for every finding: severity, exact file/line, violated contract, concrete failure or attack path, reproducible evidence, and minimal remediation;
4. a route-containment completeness assessment;
5. an authorization-before-repository assessment;
6. a mutation/CSRF and cache-isolation assessment;
7. an Intelligence/Academy separation assessment;
8. an architecture/private-data guard quality assessment, including likely bypasses;
9. test gaps and misleading tests;
10. confirmation that no later-phase work or deployment entered the branch;
11. residual risks that are intentionally deferred;
12. exact commands run and their results.

Do not change code, merge the PR, or deploy anything unless the user separately authorizes remediation after reviewing the audit.

## Ready-to-paste prompt for another AI

```text
You are the independent senior security, architecture, implementation, and QA auditor for Trader Intelligence v3 GA0-A1. You did not author this change. Treat every claim by the implementation engineer as untrusted until you verify it from the controlling documents, source diff, tests, and runtime behavior.

Repository: traderslink-bot/traderslink-trader-improvement-system
Base: origin/main
Audit branch: agent/trader-intelligence-v3-ga0-a1-containment
Draft PR: https://github.com/traderslink-bot/traderslink-trader-improvement-system/pull/102
Implementation head before the handoff document commit: 41f7ee1e407859247d7099d2cefa109db0ba36ed

First access and read this audit handoff file completely:
C:\Users\jerac\Documents\TraderLink\trader-intelligence-v3-ga0-a1-containment\src\docs\trader-intelligence-v3-ga0-a1-independent-audit-handoff-2026-07-17.md

If you are on the same Windows computer, work read-only from:
C:\Users\jerac\Documents\TraderLink\trader-intelligence-v3-ga0-a1-containment

If you only have GitHub access, use PR #102 or run `gh pr checkout 102`, then read:
src/docs/trader-intelligence-v3-ga0-a1-independent-audit-handoff-2026-07-17.md

The reason you are reading that file is to obtain the intended scope, implementation map, claimed verification, known weaknesses, and high-risk audit questions. The file is evidence supplied by the implementer, not proof or architecture authority. Independently validate it.

Read AGENTS.md and the controlling v3 documents in the exact order listed in the handoff. Compare the complete `origin/main...HEAD` diff against GA0-A1 requirements. Inspect authorization before repository access, the 82-entry route matrix, mutation Origin protection, cache isolation, fail-closed configuration, local-only optimized runtime behavior, the provisional Discord-session adapter, Intelligence/Academy separation, architecture guard bypasses, private-data scanner bypasses, and test setup that might mask production failures.

Important scope decisions:
- Trader Intelligence and Academy are separate apps.
- No Academy feature, role, progress, entitlement, lesson, or workflow belongs to Trader Intelligence.
- The single provisional session adapter may only resolve an existing Discord subject and must remain replaceable.
- The app is currently tested locally by one owner.
- Do not deploy to Vercel or any production host.
- Do not merge the PR.
- Do not implement fixes during the audit.
- Do not expand into GA0-A2, analytics, charting, AI, support/resistance, migrations, public users, or deployment.

Re-run the relevant commands listed in the handoff without live model, market-data, Vercel, or production calls. Report an executive verdict and evidence-backed findings ordered by severity. Each finding must include an exact file/line, violated contract, concrete failure/attack path, reproduction evidence, and minimal remediation. Also report test gaps, guard bypass opportunities, residual deferred risks, exact commands/results, and explicit confirmation of whether the branch preserves the Intelligence/Academy and local-only boundaries.
```
