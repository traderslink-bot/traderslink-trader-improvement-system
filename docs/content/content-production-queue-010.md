# TradersLink SEO Content Production Queue 010

## Purpose

This is the continuation queue after `docs/content/content-production-queue-009.md` reached a fully drafted `needs_review` state.

This queue starts the risk management and trading psychology expansion cluster from the master plan.

Important note: `risk-management.md` and `position-sizing.md` already existed from an earlier content batch and were preserved. Queue 010 adds the missing companion drafts and records the full first risk-management set together.

When the user says `continue the SEO content queue`, ChatGPT should:

1. Check this continuation queue first.
2. Pick the next batch of items marked `not_started`.
3. Write complete markdown drafts with YAML frontmatter.
4. Save drafts under `docs/content/drafts/`.
5. Update those queue items to `needs_review` only after the quality checklist passes.
6. Report completed files and commit SHA.

Do not write JSX, HTML, CSS, React, or Next.js files.

## Status Values

- `not_started`
- `drafting`
- `needs_review`
- `approved`
- `published`
- `paused`

## Queue Table

| ID | Priority | Status | Draft Path | Slug | Type | Primary Keyword | Product Area | Notes |
|---|---:|---|---|---|---|---|---|---|
| RISK-001 | 3 | needs_review | docs/content/drafts/learn/risk-management.md | /learn/risk-management/ | guide | trading risk management | Education | Existing draft preserved from earlier batch |
| RISK-002 | 3 | needs_review | docs/content/drafts/learn/risk-reward-ratio.md | /learn/risk-reward-ratio/ | guide | risk reward ratio | Education | New Queue 010 draft |
| RISK-003 | 3 | needs_review | docs/content/drafts/learn/position-sizing.md | /learn/position-sizing/ | guide | position sizing | Education | Existing draft preserved from earlier batch |
| RISK-004 | 3 | needs_review | docs/content/drafts/learn/stop-loss.md | /learn/stop-loss/ | guide | stop loss | Education | New Queue 010 draft |
| RISK-005 | 3 | needs_review | docs/content/drafts/learn/max-loss.md | /learn/max-loss/ | guide | max loss trading | Education | New Queue 010 draft |

## Next Run Instruction

All currently queued Queue 010 items are drafted and marked `needs_review`.

Next step options:

1. Review and approve existing drafts.
2. Continue the risk management and trading psychology cluster.
3. Good next Queue 011 starter items include daily loss limit, overtrading, revenge trading, FOMO trading, and chasing stocks.
