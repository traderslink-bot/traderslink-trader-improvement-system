<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
## Codex Autonomy Rules

- Continue with the highest-value next implementation step unless blocked by meaningful ambiguity, architectural risk, or a destructive operation.
- After completing meaningful work, run the relevant tests and verification commands before closing out the task.
- Keep `src/docs/codex-project-log.md` updated when the current resume point, roadmap branch, or best next step changes materially.
- Prefer continuing the current roadmap branch before starting a new pattern family or broader refactor.
- Use `src/docs/behavior-coverage-audit.md` and `src/docs/layer2-pattern-detection/layer2-implemented-pattern-catalog.md` as the main calibration docs for deciding what to build next.
- Only pause for user confirmation when a choice would materially affect architecture, contracts, safety, or destructive filesystem or git actions.
- When resuming cold, first read `src/docs/codex-project-log.md`, then consult the behavior audit and pattern catalog before making new roadmap decisions.

## Academy Progress Preservation

- Academy progress is production user data. Do not reset, truncate, recreate, or switch the production progress database unless the user explicitly asks for a migration.
- Live Academy progress is keyed by lesson slug. Do not rename, delete, or move launch lesson slugs without updating `academy/_data/progress-slug-baseline.json` and adding an alias in `academy/_data/progress-slug-aliases.json`.
- Run `npm run validate:academy-registry` before deploying Academy content or route changes; it is expected to fail if a protected live slug disappears without an alias.
- See `docs/academy-progress-preservation.md` before changing Academy routing, lesson slugs, progress storage, or Vercel database environment variables.

## Whole Site Source Of Truth

- The permanent local source-of-truth repo is `C:\Users\jerac\Documents\TraderLink\traderslink.pro`.
- Do not deploy from the parent folder or stale siblings such as `website`, `trader-intelligence-v2`, `trader-intelligence-v2-svg-qa`, or `deploy-candidates/*` unless explicitly reconciled against this repo and production.
- Current source branch: `main`, tracking `origin/main`.
- Remote: `git@github.com:traderslink-bot/traderslink-trader-improvement-system.git`.
- On 2026-05-26, production Vercel deployment `dpl_H1tehMKTuB3uSxCHHkVk73WabBD8` was deployed from clean `main` at commit `48f0fb8178ff513e229a16eb7ebd7d446aa40a6a`.
- The Vercel project is `vercel-landing` (`prj_TFzKcdj4dS6BHv2maWsy7M5AEv2a`, org/team `team_D1yNeyNl1qTvK0pAWMu5nTWY`) with production aliases `traderslink.pro` and `www.traderslink.pro`.
- Production deploys are currently Vercel CLI deploys (`source: cli`), not verified Git-connected auto-deploys. Until a formal Git production branch is configured, deploy production only from a clean `traderslink.pro` checkout on `main` after the intended commit exists on `origin/main`.
- Do not run raw production Vercel deploy commands such as `npx vercel deploy --prod --yes` from Codex. Use `npm run deploy:prod` from `C:\Users\jerac\Documents\TraderLink\traderslink.pro` so the deploy guard can verify the repo, Vercel project, branch, remote sync, and dirty-file scope.
- If the user asks to deploy a specific page or feature, treat that as a path-scoped deploy request. Before production deploy, run `npm run deploy:prod:check -- --allow <path>` with every intended route/API/library/style path listed. If `git status --short` contains any changed or untracked file outside those paths, stop and reconcile instead of deploying.
- Examples: homepage-only deploys must allow only `app/page.tsx` plus explicitly required shared assets; scanner access deploys must allow only `app/filtered-news-momentum-scanner-access`; watchlist deploys must allow only `app/watchlist`, `app/api/live-watchlist`, `src/lib/live-watchlist`, and any explicitly required watchlist CSS in `app/globals.css`.
- GitHub ruleset `Protect main` requires PRs and blocks deletion/non-fast-forward updates. The required approving review count is `0` because this repo currently has only the `traderslink-bot` maintainer account; CI must still be green before merge/deploy.
- Feature work completed in sibling folders should be handed off through `C:\Users\jerac\Documents\TraderLink\WEBSITE_DEPLOY_HANDOFF.md` or equivalent chat notes. Do not deploy sibling-folder work directly; port only the intended files into this repo and follow the branch/PR policy before deploying.
- The shared top navigation lives in `src/components/site/site-shell.tsx` and is re-exported by `app/site-shell.tsx`. Do not create separate Academy, News, or Intelligence topbars.
- Canonical feature roots are `app/academy`, `app/news`, and `app/intelligence`. Former workspace routes should redirect in `next.config.ts`; do not recreate duplicate top-level app pages for them.
- Read `docs/site-architecture.md`, `docs/routes.md`, `docs/deployment.md`, and `docs/auth.md` before structural, deployment, route, or auth changes.
