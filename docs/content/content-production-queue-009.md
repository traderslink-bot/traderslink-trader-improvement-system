# TradersLink SEO Content Production Queue 009

## Purpose

This is the continuation queue after `docs/content/content-production-queue-008.md` reached a fully drafted `needs_review` state.

This queue finishes the swing trading education cluster from the master plan.

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
| SWING-011 | 3 | needs_review | docs/content/drafts/learn/gap-fill-trading.md | /learn/gap-fill-trading/ | guide | gap fill trading | Education | Gap fill swing guide |
| SWING-012 | 3 | needs_review | docs/content/drafts/learn/multi-day-runner.md | /learn/multi-day-runner/ | guide | multi-day runner | Education | Multi-day runner guide |
| SWING-013 | 3 | needs_review | docs/content/drafts/learn/overnight-risk.md | /learn/overnight-risk/ | guide | overnight risk | Education | Overnight risk guide |
| SWING-014 | 3 | needs_review | docs/content/drafts/learn/holding-through-news.md | /learn/holding-through-news/ | guide | holding through news | Education | Holding through news guide |
| SWING-015 | 3 | needs_review | docs/content/drafts/learn/swing-trade-journal.md | /learn/swing-trade-journal/ | guide | swing trade journal | Education | Swing trade journal guide |

## Next Run Instruction

All currently queued Queue 009 items are drafted and marked `needs_review`.

Next step options:

1. Review and approve existing drafts.
2. Start the next major SEO cluster from the master plan.
3. Good next cluster options include risk management and trading psychology expansion, more chart patterns, more candlestick patterns, SEC filing expansion, comparison pages, or glossary expansion.
