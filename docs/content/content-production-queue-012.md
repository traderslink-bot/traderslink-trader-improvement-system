# TradersLink SEO Content Production Queue 012

## Purpose

This is the continuation queue after `docs/content/content-production-queue-011.md` reached a fully drafted `needs_review` state.

This queue continues the risk management and trading psychology expansion cluster from the master plan.

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
| RISK-011 | 3 | needs_review | docs/content/drafts/learn/averaging-down.md | /learn/averaging-down/ | guide | averaging down | Education | Averaging down guide |
| RISK-012 | 3 | needs_review | docs/content/drafts/learn/cutting-winners-too-early.md | /learn/cutting-winners-too-early/ | guide | cutting winners too early | Education | Cutting winners too early guide |
| RISK-013 | 3 | needs_review | docs/content/drafts/learn/holding-losers-too-long.md | /learn/holding-losers-too-long/ | guide | holding losers too long | Education | Holding losers too long guide |
| RISK-014 | 3 | needs_review | docs/content/drafts/learn/trading-discipline.md | /learn/trading-discipline/ | guide | trading discipline | Education | Trading discipline guide |
| RISK-015 | 3 | needs_review | docs/content/drafts/learn/trading-plan.md | /learn/trading-plan/ | guide | trading plan | Education | Trading plan guide |

## Next Run Instruction

All currently queued Queue 012 items are drafted and marked `needs_review`.

Next step options:

1. Review and approve existing drafts.
2. Continue the risk management and trading psychology cluster.
3. Good next Queue 013 starter items include trading rules, trade management, profit protection, mental stop vs hard stop, and trade risk review.
