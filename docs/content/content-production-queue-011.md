# TradersLink SEO Content Production Queue 011

## Purpose

This is the continuation queue after `docs/content/content-production-queue-010.md` reached a fully drafted `needs_review` state.

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
| RISK-006 | 3 | needs_review | docs/content/drafts/learn/daily-loss-limit.md | /learn/daily-loss-limit/ | guide | daily loss limit | Education | Daily loss limit guide |
| RISK-007 | 3 | needs_review | docs/content/drafts/learn/overtrading.md | /learn/overtrading/ | guide | overtrading | Education | Overtrading guide |
| RISK-008 | 3 | needs_review | docs/content/drafts/learn/revenge-trading.md | /learn/revenge-trading/ | guide | revenge trading | Education | Revenge trading guide |
| RISK-009 | 3 | needs_review | docs/content/drafts/learn/fomo-trading.md | /learn/fomo-trading/ | guide | FOMO trading | Education | FOMO trading guide |
| RISK-010 | 3 | needs_review | docs/content/drafts/learn/chasing-stocks.md | /learn/chasing-stocks/ | guide | chasing stocks | Education | Chasing stocks guide |

## Next Run Instruction

All currently queued Queue 011 items are drafted and marked `needs_review`.

Next step options:

1. Review and approve existing drafts.
2. Continue the risk management and trading psychology cluster.
3. Good next Queue 012 starter items include averaging down, cutting winners too early, holding losers too long, trading discipline, and trading plan.
