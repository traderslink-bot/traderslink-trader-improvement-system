<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
## Codex Autonomy Rules

- Continue with the highest-value next implementation step unless blocked by meaningful ambiguity, architectural risk, or a destructive operation.
- After completing meaningful work, run the relevant tests and verification commands before closing out the task.
- For narrowly scoped display-only changes, such as copy, labels, styling, or simple rendering conditions, run focused tests, targeted lint, and TypeScript checks locally. Do not run a redundant local production build when required remote CI and the Vercel deployment will perform full builds. Run a local full build when changing routes, dependencies, build configuration, server behavior, authentication, or data contracts, or when remote CI will not provide equivalent verification.
- Keep `src/docs/codex-project-log.md` updated when the current resume point, roadmap branch, or best next step changes materially.
- Prefer continuing the current roadmap branch before starting a new pattern family or broader refactor.
- Use `src/docs/behavior-coverage-audit.md` and `src/docs/layer2-pattern-detection/layer2-implemented-pattern-catalog.md` as the main calibration docs for deciding what to build next.
- Only pause for user confirmation when a choice would materially affect architecture, contracts, safety, or destructive filesystem or git actions.
- When resuming cold, first read `src/docs/codex-project-log.md`, then consult the behavior audit and pattern catalog before making new roadmap decisions.

## Trader Intelligence Dashboard Baseline And Parallel Work

- The current approved design baseline is the light, Material-style dashboard on the `/workspace` route. Preserve that visual language and shell unless the user explicitly approves a replacement.
- Every Trader Intelligence dashboard page must live under `app/(dashboard)` and inherit `app/(dashboard)/layout.tsx`. That layout must render `V3DashboardTemplate`; pages must not rebuild the application frame locally.
- `app/dashboard-template.tsx` is the public dashboard UI contract. Import `DashboardPage`, `DashboardPanel`, `DashboardMetricCard`, `DashboardPrimaryAction`, and `DashboardSecondaryAction` from it instead of creating local page containers, card conventions, or action styles.
- `app/dashboard-shell.tsx` exclusively owns the header, TradersLink logo, responsive collapsible sidebar, and full-width page container. Dashboard pages must not create or import their own `AppBar`, `Toolbar`, `Drawer`, logo, `<main>`, or `DashboardShell`.
- `app/dashboard-navigation.ts` exclusively owns dashboard navigation groups, links, icon keys, and route titles. Add or change dashboard navigation there rather than duplicating navigation arrays in pages or the shell.
- The primary-action contract is deep navy `#011E56`, white text, 8px radius, 40px minimum height, bold sentence-case labels, and no elevation or shadow. Secondary actions use the same navy as an outlined treatment. These styles belong in `app/mui-theme.ts`, not page-level `sx`.
- Run `npm run verify:ti-v3:dashboard-template` after adding or structurally changing a dashboard page. The architecture test rejects local shell reconstruction and missing configured routes.
- Read `src/docs/trade-execution-analytics/v3-dashboard-template-contract.md` before creating or redesigning a Trader Intelligence dashboard page.
- The active review instance is commonly `http://127.0.0.1:3010/workspace`. Treat port `3010` as belonging to the worktree that started it; do not stop, restart, or replace that process from another worktree without coordinating first.
- Agents may inspect the `3010` instance read-only. An agent making parallel dashboard changes must use its own Git worktree, branch, and port such as `3011`.
- Divide parallel work by isolated pages or feature areas. Coordinate before editing shared shell or configuration files, especially `app/dashboard-shell.tsx`, `app/mui-theme.ts`, `app/mui-provider.tsx`, `next.config.ts`, or the main dashboard plan and progress documents.
- Changes made in another worktree do not automatically appear on the `3010` instance. Merge or cherry-pick the completed branch into the dashboard baseline worktree, resolve shared-file changes deliberately, then verify the integrated result on `3010`.
- Do not treat older `/intelligence` pages, a server on port `3000`, or the production website as the approved visual baseline for this dashboard.

## Academy Progress Preservation

- Academy progress is production user data. Do not reset, truncate, recreate, or switch the production progress database unless the user explicitly asks for a migration.
- Live Academy progress is keyed by lesson slug. Do not rename, delete, or move launch lesson slugs without updating `academy/_data/progress-slug-baseline.json` and adding an alias in `academy/_data/progress-slug-aliases.json`.
- Run `npm run validate:academy-registry` before deploying Academy content or route changes; it is expected to fail if a protected live slug disappears without an alias.
- See `docs/academy-progress-preservation.md` before changing Academy routing, lesson slugs, progress storage, or Vercel database environment variables.

## Whole Site Source Of Truth

- The permanent local source-of-truth repo is `C:\Users\jerac\Documents\TraderLink\traderslink.pro`.
- Work on branches inside this repository. Do not make a sibling folder or a Codex visualization preview the active application just to work on a feature.
- Codex visualization folders and extra worktrees are temporary review copies only. Before relying on, restarting, or deleting one, save its intended changes to a GitHub branch and bring that branch back into this repository.
- Run the local dashboard from this repository once its branch has been integrated. Do not leave the user dependent on a temporary preview server or its private `.env.local` file.
- Before removing any duplicate project folder, show the user the exact folder, confirm its intended changes are safely on GitHub or already in this repository, and receive explicit approval.
- Do not deploy from the parent folder or stale siblings such as `website`, `trader-intelligence-v2`, `trader-intelligence-v2-svg-qa`, or `deploy-candidates/*` unless explicitly reconciled against this repo and production.
- Current source branch: `main`, tracking `origin/main`.
- Remote: `https://github.com/traderslink-bot/traderslink-trader-improvement-system.git`.
- On 2026-05-26, production Vercel deployment `dpl_H1tehMKTuB3uSxCHHkVk73WabBD8` was deployed from clean `main` at commit `48f0fb8178ff513e229a16eb7ebd7d446aa40a6a`.
- The Vercel project is `vercel-landing` (`prj_TFzKcdj4dS6BHv2maWsy7M5AEv2a`, org/team `team_D1yNeyNl1qTvK0pAWMu5nTWY`) with production aliases `traderslink.pro` and `www.traderslink.pro`.
- Production deploys must come from a completely clean `main` checkout synchronized exactly with `origin/main`. Dirty or uncommitted production deploys are forbidden even when the requested change is path-scoped, because Vercel publishes the entire application snapshot.
- Do not run raw production Vercel deploy commands such as `npx vercel deploy --prod --yes` from Codex. Use `npm run deploy:prod` from a clean clone or worktree linked to the expected project so the deploy guard can verify the repository, Vercel project, branch, remote sync, and clean state.
- If the user asks to deploy a specific page or feature, treat that as path-scoped intent for review and smoke testing. Before production, commit only the intended files, merge them through a green PR, then run `npm run deploy:prod:check -- --allow <path>` from clean synchronized `main`. The `--allow` paths document intent; they never authorize dirty deployment.
- Examples: homepage-only changes should include only `app/page.tsx` plus explicitly required shared assets; scanner access changes should include only `app/filtered-news-momentum-scanner-access` and required libraries; watchlist changes should include only `app/watchlist`, `app/api/live-watchlist`, `src/lib/live-watchlist`, and explicitly required watchlist CSS in `app/globals.css`.
- GitHub ruleset `Protect main` requires PRs and blocks deletion/non-fast-forward updates. The required approving review count is `0` because this repo currently has only the `traderslink-bot` maintainer account; CI must still be green before merge/deploy.
- Feature work completed in sibling folders should be handed off through `C:\Users\jerac\Documents\TraderLink\WEBSITE_DEPLOY_HANDOFF.md` or equivalent chat notes. Do not deploy sibling-folder work directly; port only the intended files into this repo and follow the branch/PR policy before deploying.
- The shared top navigation lives in `src/components/site/site-shell.tsx` and is re-exported by `app/site-shell.tsx`. Do not create separate Academy, News, or Intelligence topbars.
- Canonical feature roots are `app/academy`, `app/news`, and `app/intelligence`. Former workspace routes should redirect in `next.config.ts`; do not recreate duplicate top-level app pages for them.
- Read `docs/site-architecture.md`, `docs/routes.md`, `docs/deployment.md`, and `docs/auth.md` before structural, deployment, route, or auth changes.
