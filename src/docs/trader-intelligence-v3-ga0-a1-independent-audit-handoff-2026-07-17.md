# Trader Intelligence v3 GA0-A1 Independent Audit Handoff

Date: 2026-07-17

## Remediation re-audit update

The independent audit of head `28d992a0c280e4282fad3692a60a8d767a989393` returned required fixes. Those fixes and the complete local verification set are implemented on the same branch and draft PR. The exact pushed head is recorded in the PR update because a Git commit cannot contain its own SHA. Status remains **audit remediation in progress** until independent re-review accepts the new head.

Binding decisions reflected by the remediation:

- only `private_owner_alpha + local_only + local_sqlite` is operational;
- `private_hosted`, `private_database`, invited, beta, and production profiles are declared but not operational;
- local owner authorization requires a verified exact loopback request first;
- mutations require an explicit normalized loopback Origin allowlist;
- real-owner SQLite requires an explicit durable path outside Git and OS temp, while sample mode is isolated in memory;
- route and architecture enforcement use TypeScript AST inspection;
- private-data enforcement covers exact fixture hashes, final-tree state, and all added/modified PR-history blobs;
- the global test Request replacement is removed;
- mutation logging is only a non-durable local diagnostic;
- the committed V2 product engine was reconciled against `main`; uncommitted
  manual-entry, AI-reflection, and real-coach/Whop prototypes are documented as
  external legacy sources and are not merged into A1;
- the mixed V2 stash is prohibited as a port source because it includes a
  private SQLite artifact;
- no deployment, merge, or GA0-A2 work is authorized.

The final revised head, file list, remaining deferred risks, and audit-finding map are reported on PR #102. Exact local command results are recorded below. The auditor should treat all implementation claims as navigation evidence, not as proof of the remediation.

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

1. only `private_owner_alpha + local_only + local_sqlite` is operational;
2. hosted, invited, beta, public, and private-database configurations fail with stable not-operational reasons;
3. the raw local listener binds only to `127.0.0.1` and rejects non-loopback peers and client-supplied forwarded/proxy/tunnel evidence;
4. App Router pages and APIs verify exact loopback Host/URL evidence before local owner authority;
5. owner authorization occurs before reachable legacy repository or handler execution;
6. every unsafe method requires an exact Origin from an explicitly configured normalized loopback allowlist;
7. real-owner mode requires an explicit durable SQLite path outside the repository and OS temporary directory;
8. sample mode cannot select or read the owner's real database;
9. all relevant current and future Intelligence APIs are discovered and classified exactly once;
10. route and architecture checks cannot be bypassed by simple import, re-export, require, dynamic-import, or const-handler syntax changes;
11. final-tree and PR-history private-data checks cannot be bypassed through fixture placement or later deletion/rename;
12. all success and error responses remain private/no-store without leaking private identifiers;
13. tests declare unsafe-request Origin evidence explicitly;
14. no GA0-A2/later authority, hosted support, deployment, or live provider call was added;
15. PR #102 remains draft and unmerged.

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

`local_only` maps explicit configuration to one internal owner without a login session, but only after the central loopback boundary succeeds. `private_hosted` is declared and non-operational. The provisional Discord adapter remains isolated future compatibility code; no accepted runtime profile can reach it.

The only permitted v3 import from an Academy path is the named provisional Discord-session adapter. The architecture guard rejects other v3/Academy coupling.

Audit questions:

- Can any request reach local owner mapping before raw-listener and App Router/API loopback checks succeed?
- Can any accepted runtime profile reach the provisional Discord adapter?
- Does the exact Academy exception expose any role, progress, lesson, entitlement, or product behavior symbol?
- Can the adapter later be replaced by Intelligence-owned identity without changing domain contracts?

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

- Does AST discovery scan every `app/api/**/route.ts` and every static API path used from `app/intelligence`, without relying on a route-prefix allowlist?
- Does it identify v3 and relevant legacy journal/data/service imports regardless of API prefix?
- Can module initialization or metadata access reach private storage before authorization?
- Does every exported HTTP method exist in the matrix, use the wrapper, and pass the exact real module path?
- Are unused wrapper imports and unwrapped function/const exports rejected?

### Mutation and cache protection

Implemented in:

- `src/lib/trader-intelligence-v3/auth/mutation-origin.ts`
- `src/lib/trader-intelligence-v3/auth/private-response.ts`
- `next.config.ts`

Unsafe methods require a normalized Origin matching an explicitly configured approved loopback origin. `Request.url` and Host never become implicit approved origins. Missing, `null`, malformed, credentialed, non-loopback, alternate-scheme, and unapproved-port origins fail closed before handler work.

API responses receive browser/CDN/Vercel no-store headers. `/intelligence/:path*` pages receive private/no-store headers and forced dynamic rendering.

Audit questions:

- Can an attacker-controlled request URL or Host make an Origin valid?
- Does every configured approved origin validate as loopback before any request is accepted?
- Are malformed origins, credentials in URLs, `null`, missing headers, and alternate ports rejected correctly?
- Does setting `Vary: Cookie` preserve rather than damage any framework-required `Vary` values?
- Do all success and error responses retain private/no-store behavior?
- Is the structured `console.info` mutation event sufficient only as a containment diagnostic, and clearly not represented as a durable production audit log?

### Local-only optimized testing

Supported development and optimized scripts use `src/scripts/run-trader-intelligence-local-server.ts`. The raw Node listener binds explicitly to `127.0.0.1`, rejects non-loopback socket peers and any client-supplied forwarded/proxy/tunnel evidence, strips client assertions, and stamps a random per-process listener assertion before handing the request to Next. The framework boundary accepts Next's synthesized loopback forwarding tuple only when that assertion is valid; this accommodates Next 16's internal header synthesis without trusting external forwarding evidence.

The seeded Playwright configuration uses an explicit external durable test database, starts the optimized server twice, and verifies the second process reads the same persisted record. Synthetic API POSTs supply an exact approved Origin.

Audit questions: can a client forge the listener assertion, preserve forwarded evidence through the raw listener, exploit a loopback alias with a different port, or make a supported script listen beyond `127.0.0.1`?

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

Local mode scans tracked, staged, and non-ignored untracked final-tree content. PR/CI mode scans every added or modified blob in every commit in `origin/main...HEAD`, including content later deleted or renamed. Findings contain stable path/commit/finding codes without printing the suspected value, row, identifier, or secret. Synthetic fixture approval is file-specific and SHA-256-specific, and approved files still undergo broker-shaped content inspection. Binary and oversized files are read through bounded probes rather than unbounded memory loads.

Audit for false negatives, unsafe binary handling, oversized-file gaps, alternate credential formats, renamed broker exports, Unicode/encoded identifiers, hash-manifest abuse, merge-base/fetch-depth mistakes, and whether ignored untracked private files remain outside the intentionally defined pre-commit threat boundary.

### CI and legacy compatibility

The standard CI workflow fetches full history and runs both v3 guards. Legacy handler tests call wrapped routes through explicit request helpers. `src/test/setup.ts` no longer replaces global `Request` and no longer inserts Origin evidence.

The seeded level-analysis browser workflow was updated to use explicit local-owner configuration and explicit Origin evidence. This is test compatibility, not a production bypass.

Audit that every unsafe test explicitly selects valid, missing, malformed, invalid, or approved-alternate Origin evidence and that global setup cannot mask a production requirement.

### Inventory, hazards, and synthetic cleanup

Added:

- `src/docs/trader-intelligence-v3-current-system-inventory-2026-07-17.md`
- `src/docs/trader-intelligence-v3-legacy-hazard-register-2026-07-17.md`

Realistic-looking synthetic broker account values were renamed to `SYNTHETIC-ACCOUNT` in existing fixtures/presets so the private-data guard can remain strict.

The branch intentionally does not fix the registered legacy hazards, including demo identity defaults, direct SQLite construction, temporary production persistence behavior, 32-bit fingerprints, JavaScript-number financial fields, lifecycle overrides, browser-authoritative filters, chart evidence gaps, request-lifecycle jobs, JSON query authority, nearest-level coaching, or fixed coaching templates.

## Files and surfaces most important to inspect

Prioritize:

1. `src/lib/trader-intelligence-v3/deployment/deployment-contract.ts`
2. `src/lib/trader-intelligence-v3/deployment/local-network-boundary.ts`
3. `src/scripts/run-trader-intelligence-local-server.ts`
4. `src/lib/trader-intelligence-v3/deployment/local-persistence-path.ts`
5. `src/lib/trader-intelligence-v3/auth/owner-authorization.ts`
6. `src/lib/trader-intelligence-v3/auth/next-owner-boundary.ts`
7. `src/lib/trader-intelligence-v3/auth/provisional-discord-session-adapter.ts`
8. `src/lib/trader-intelligence-v3/auth/mutation-origin.ts`
9. `src/lib/trader-intelligence-v3/auth/private-response.ts`
10. `src/lib/trader-intelligence-v3/contracts/route-containment.ts`
11. `src/lib/trader-intelligence-v3/testing/route-containment-ast.ts`
12. `src/lib/trader-intelligence-v3/testing/architecture-boundary-guard.ts`
13. `src/lib/trader-intelligence-v3/testing/typescript-source-analysis.ts`
14. `src/lib/trader-intelligence-v3/testing/private-data-guard.ts`
15. `src/lib/trader-intelligence-v3/testing/private-data-git-scanner.ts`
16. `src/lib/trader-intelligence-v3/testing/synthetic-fixture-manifest.ts`
17. `app/intelligence/layout.tsx` and repository-backed pages
18. all wrapped `app/api/**/route.ts` modules in the matrix
19. `src/test/setup.ts` and `src/test/trader-intelligence-request.ts`
20. `playwright.level-analysis.config.ts`
21. `tests/e2e/level-analysis-trade-detail-seeded-flow.spec.ts`
22. `.github/workflows/ci.yml`

## Verification already reported

These are implementer-reported results. Re-run them; do not accept them as independent evidence.

- `npm ci`: passed; 603 packages; audit reported 5 existing vulnerabilities (2 low, 1 moderate, 2 high).
- `npx tsc --noEmit --pretty false`: passed.
- Changed-path ESLint: zero errors; two pre-existing unused-variable warnings in `app/intelligence/coach/page.tsx`.
- Focused v3 tests: 7 files, 133 tests passed.
- Affected legacy route/UI compatibility tests: 10 files, 101 tests passed.
- Full Vitest suite: 164 files, 1,523 tests passed.
- Layer 2 verification: passed with 13 canonical patterns.
- Layer 3 verification: canonical regression passed.
- Architecture guard: passed across 75 architecture files, 42 API routes, and 82 classified routes.
- Staged private-data guard: passed across 23,684 records: 23,590 worktree/index records and 94 added/modified pre-remediation PR-history blobs. Re-run after checkout so the remediation commit itself is counted in PR history.
- Cross-platform fixture hashing: the first Linux CI run identified CRLF-derived Windows manifest hashes; the implementation now hashes canonical LF text and the focused test exercises both CRLF and LF representations without weakening content-change rejection.
- Optimized build: passed with 127 generated routes, 19 known Academy registry notices, and five existing broad filesystem-tracing warnings around legacy stores/provider code.
- Process-restart persistence test: passed after separate optimized Node processes wrote and reopened the same explicit external owner database.
- Optimized persistent-SQLite Playwright flow: one scenario passed against the external database and asserted private/no-store plus merged `Vary` headers on the rendered page.
- PR state and current-head GitHub checks must be re-read after the remediation push.
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
