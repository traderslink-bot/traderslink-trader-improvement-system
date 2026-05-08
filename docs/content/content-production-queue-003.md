# TradersLink SEO Content Production Queue 003

## Purpose

This is the continuation queue after `docs/content/content-production-queue.md` and `docs/content/content-production-queue-002.md` reached a fully drafted `needs_review` state.

This queue starts the next major SEO expansion cluster from the master plan: support and resistance education.

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
| SR-001 | 3 | needs_review | docs/content/drafts/learn/support-and-resistance.md | /learn/support-and-resistance/ | guide | support and resistance | Education | Support and resistance hub |
| SR-002 | 3 | needs_review | docs/content/drafts/learn/how-to-draw-support-and-resistance.md | /learn/how-to-draw-support-and-resistance/ | guide | how to draw support and resistance | Education | Practical level drawing guide |
| SR-003 | 3 | needs_review | docs/content/drafts/learn/resistance-levels.md | /learn/resistance-levels/ | guide | resistance levels | Education | Resistance concept guide |
| SR-004 | 3 | needs_review | docs/content/drafts/learn/support-levels.md | /learn/support-levels/ | guide | support levels | Education | Support concept guide |
| SR-005 | 3 | needs_review | docs/content/drafts/learn/swing-highs-and-swing-lows.md | /learn/swing-highs-and-swing-lows/ | guide | swing highs and swing lows | Education | Market structure guide |
| SR-006 | 3 | not_started | docs/content/drafts/learn/pivot-levels.md | /learn/pivot-levels/ | guide | pivot levels | Education | Pivot level guide |
| SR-007 | 3 | not_started | docs/content/drafts/learn/key-levels-trading.md | /learn/key-levels-trading/ | guide | key levels trading | Education | Key level guide |
| SR-008 | 3 | not_started | docs/content/drafts/learn/previous-day-high-low.md | /learn/previous-day-high-low/ | guide | previous day high low | Education | Previous day levels guide |
| SR-009 | 3 | not_started | docs/content/drafts/learn/premarket-high-low.md | /learn/premarket-high-low/ | guide | premarket high low | Education | Premarket levels guide |
| SR-010 | 3 | not_started | docs/content/drafts/learn/high-of-day.md | /learn/high-of-day/ | guide | high of day | Education | HOD concept guide |

## Next Run Instruction

Draft SR-006 through SR-010 next, then update those rows to `needs_review` after checking against `docs/content/seo-quality-checklist.md`.

SR-001 through SR-005 are drafted and ready for review.
