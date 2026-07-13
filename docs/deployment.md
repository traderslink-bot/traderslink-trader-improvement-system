# TradersLink Deployment

Last audited: 2026-05-26.

## Source Repo

- Permanent local repo: `C:\Users\jerac\Documents\TraderLink\traderslink.pro`
- Git remote: `git@github.com:traderslink-bot/traderslink-trader-improvement-system.git`
- Current source branch: `main`
- Upstream tracking branch: `origin/main`
- Production app deployment commit at audit time: `48f0fb8178ff513e229a16eb7ebd7d446aa40a6a`
- Remote verification: that commit exists in `origin/main`. `main` may include
  later docs-only merge commits after the production app deployment.

Do not deploy from `C:\Users\jerac\Documents\TraderLink` directly. It is a
parent workspace. Sibling folders such as `website`, `trader-intelligence-v2`,
`trader-intelligence-v2-svg-qa`, and `deploy-candidates/*` are historical unless
they have been reconciled against the permanent repo and current production.

## Vercel Project

- Project name: `vercel-landing`
- Project id: `prj_TFzKcdj4dS6BHv2maWsy7M5AEv2a`
- Org/team id: `team_D1yNeyNl1qTvK0pAWMu5nTWY`
- Framework: Next.js
- Node version: `24.x`
- Root directory: project root (`.`). In `.vercel/project.json`, `settings.rootDirectory` is `null`, which maps to the repo root.
- Production aliases: `traderslink.pro`, `www.traderslink.pro`
- Current production deployment at audit time: `dpl_H1tehMKTuB3uSxCHHkVk73WabBD8`

The local `.vercel/project.json` link contains:

- `projectId`: `prj_TFzKcdj4dS6BHv2maWsy7M5AEv2a`
- `orgId`: `team_D1yNeyNl1qTvK0pAWMu5nTWY`
- `projectName`: `vercel-landing`
- `settings.rootDirectory`: `null`

## Feature Handoffs

Feature work may be drafted in sibling folders or Codex worktrees, but those
folders are not production deploy sources. When a feature agent says a page is
ready to make live, use the central handoff note at:

`C:\Users\jerac\Documents\TraderLink\WEBSITE_DEPLOY_HANDOFF.md`

The website manager should port only the intended files into this repo, preserve
unrelated dirty work, follow the branch/PR policy, and deploy only from a clean
`main` checkout.

## Deployment Mode

Production deployments are whole-site snapshots. Vercel does not deploy only one
route or page from a Next.js app. A Codex chat that deploys from a stale checkout
can replace unrelated live pages with old code.

Use the guarded deploy wrapper for every Codex-triggered production deploy:

```bash
npm run deploy:prod -- --allow app/page.tsx
npm run deploy:prod -- --allow app/filtered-news-momentum-scanner-access
npm run deploy:prod -- --allow app/watchlist --allow app/api/live-watchlist --allow src/lib/live-watchlist --allow app/globals.css
```

The wrapper verifies the canonical repo, Vercel project, `main`, remote sync,
and dirty-file scope before it runs `npx vercel deploy --prod --yes`. Do not run
raw `npx vercel deploy --prod --yes` from Codex; it bypasses the deploy guard.

The latest audited production deployment was created from a clean `main` checkout by the Vercel CLI:

- Deployment source: `cli`
- Deployment command used: `npx vercel deploy --prod --yes`
- Deployment commit metadata:
  - local branch: `main`
  - sha: `48f0fb8178ff513e229a16eb7ebd7d446aa40a6a`
  - message: `Align main with live TradersLink website`

Vercel did not create a new production deployment automatically when PR #10
merged into `main`. Treat production deploys as CLI-controlled until the Vercel
dashboard is explicitly configured and verified for Git-connected deploys from
`main`.

Branch and repository policy:

- `main` is the source-of-truth branch.
- GitHub ruleset `Protect main` requires pull requests, blocks deletion, and
  blocks non-fast-forward updates.
- The ruleset approval count is `0` because the repo currently has only the
  `traderslink-bot` maintainer account; a one-review rule made `main`
  unmergeable.
- GitHub CI runs on PRs and `main` pushes. Do not merge or deploy unless CI is
  green.
- Production deploys should be made only through `npm run deploy:prod` from a
  clean or explicitly path-scoped local `main` checkout after the intended
  commit exists on `origin/main`, until Git-connected Vercel production deploys
  from `main` are confirmed.

## Build

`vercel.json` sets:

- install: `npm ci`
- build: `npm run build:webpack`

Local verification before production-impacting changes:

```bash
npm run validate:academy-registry
npx tsc --noEmit
npm run lint
npm test
npm run build:webpack
```

## Safety Checklist

Before production deployment:

1. Work from `C:\Users\jerac\Documents\TraderLink\traderslink.pro`.
2. Confirm `git status --short --branch` is clean except for intentional changes.
3. Confirm `git remote -v` points at the expected GitHub repo.
4. Confirm the current branch and upstream are intended.
5. Confirm the intended commit exists on the remote with `git ls-remote`.
6. Confirm `.vercel/project.json` points to `vercel-landing`.
7. Confirm local HEAD is based on the intended production commit.
8. Confirm no stale top-level legacy Intelligence pages were recreated.
9. Confirm Academy progress slug validation passes.
10. Confirm required production env vars exist in Vercel without printing secret values.
11. Run `npm run deploy:prod:check -- --allow <path>` for the exact requested page/feature paths. If any unrelated changed or untracked file is reported, stop and reconcile before deploy.
12. Deploy with `npm run deploy:prod -- --allow <path>` only after the preflight passes.
13. Do not deploy from a dirty or ambiguous worktree, and do not run raw `npx vercel deploy --prod --yes` from Codex.

## Environment Dependencies

Production currently has these env var keys configured in Vercel. Values were
not printed or copied:

- `ACADEMY_DATABASE_URL`
- `DATABASE_URL`
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_INVITE_URL`
- `DISCORD_REDIRECT_URI`
- `NEWS_PUBLISH_TOKEN`

The app may also read these optional keys when present:

- `DISCORD_GUILD_ID`
- `NEWS_DATABASE_URL`
- `NEWS_PUBLIC_BASE_URL`

Never paste secret values into docs or chat transcripts.
