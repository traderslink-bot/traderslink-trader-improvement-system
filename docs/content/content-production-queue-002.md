# TradersLink SEO Content Production Queue 002

## Purpose

This is the continuation queue after `docs/content/content-production-queue.md` reached a fully drafted `needs_review` state.

This queue starts the next major SEO expansion cluster from the master plan: day trading education.

When the user says `continue the SEO content queue`, ChatGPT should:

1. Check this continuation queue first.
2. Pick the next batch of items marked `not_started`.
3. Write complete markdown drafts with YAML frontmatter.
4. Save drafts under `docs/content/drafts/`.
5. Update those queue items to `needs_review`.
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
| DT-001 | 3 | needs_review | docs/content/drafts/learn/day-trading.md | /learn/day-trading/ | guide | day trading | Education | Day trading hub |
| DT-002 | 3 | needs_review | docs/content/drafts/learn/day-trading-for-beginners.md | /learn/day-trading-for-beginners/ | guide | day trading for beginners | Education | Beginner guide |
| DT-003 | 3 | needs_review | docs/content/drafts/learn/premarket-trading.md | /learn/premarket-trading/ | guide | premarket trading | Education | Session guide |
| DT-004 | 3 | needs_review | docs/content/drafts/learn/after-hours-trading.md | /learn/after-hours-trading/ | guide | after hours trading | Education | Session guide |
| DT-005 | 3 | needs_review | docs/content/drafts/learn/market-open-trading.md | /learn/market-open-trading/ | guide | market open trading | Education | Session guide |
| DT-006 | 3 | needs_review | docs/content/drafts/learn/midday-trading.md | /learn/midday-trading/ | guide | midday trading | Education | Session guide |
| DT-007 | 3 | needs_review | docs/content/drafts/learn/power-hour-trading.md | /learn/power-hour-trading/ | guide | power hour trading | Education | Session guide |
| DT-008 | 3 | needs_review | docs/content/drafts/learn/scalping-stocks.md | /learn/scalping-stocks/ | guide | scalping stocks | Education | Strategy guide |
| DT-009 | 3 | needs_review | docs/content/drafts/learn/momentum-trading.md | /learn/momentum-trading/ | guide | momentum trading | Education | Strategy guide |
| DT-010 | 3 | needs_review | docs/content/drafts/learn/breakout-trading.md | /learn/breakout-trading/ | guide | breakout trading | Education | Strategy guide |

## Next Run Instruction

All currently queued items are drafted and marked `needs_review`.

Next step options:

1. Review and approve existing drafts.
2. Expand the queue with another SEO cluster from `docs/content/trader-intelligence-seo-master-plan.md`.
3. Start a new content production queue for another cluster.
