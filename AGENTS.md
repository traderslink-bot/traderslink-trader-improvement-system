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

## Production Deployment Rules

- The canonical live website deployment target is the Vercel project linked by `.vercel/project.json` for `vercel-landing`, serving `https://traderslink.pro` and `https://www.traderslink.pro`.
- Until the user explicitly changes this, the canonical production source branch is `origin/codex/trader-ui-product-pass`.
- Do not deploy production from a dirty worktree, a stale branch, or an unrelated feature branch.
- Before any production deploy, run `git fetch origin codex/trader-ui-product-pass` and confirm the intended live fix exists on that branch.
- If the active workspace has unrelated local changes, create a clean temporary worktree from `origin/codex/trader-ui-product-pass`, apply only the intended production fix there, test it, commit it, push it back to `origin/codex/trader-ui-product-pass`, and deploy from that clean worktree.
- Prefer Git-backed production changes over ad hoc direct deploys. If a direct `vercel deploy --prod` is necessary, it must be run only from a clean checkout of the canonical production branch containing the intended commit.
- After deploying or promoting production, verify `https://traderslink.pro` directly with a cache-busting request and confirm the specific user-facing change is present.
- Never overwrite production with broad local work just to "upload all pages." Production is last-known-good plus the specific reviewed change.

## Academy Progress Preservation

- Academy progress is production user data. Do not reset, truncate, recreate, or switch the production progress database unless the user explicitly asks for a migration.
- Live Academy progress is keyed by lesson slug. Do not rename, delete, or move launch lesson slugs without updating `academy/_data/progress-slug-baseline.json` and adding an alias in `academy/_data/progress-slug-aliases.json`.
- Run `npm run validate:academy-registry` before deploying Academy content or route changes; it is expected to fail if a protected live slug disappears without an alias.
- See `docs/academy-progress-preservation.md` before changing Academy routing, lesson slugs, progress storage, or Vercel database environment variables.
