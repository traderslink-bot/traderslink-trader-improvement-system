# TradersLink SEO Content Production Queue 005

## Purpose

This is the continuation queue after `docs/content/content-production-queue-004.md` reached a fully drafted `needs_review` state.

This queue starts the next major SEO expansion cluster from the master plan: volume, liquidity, and order-flow concepts.

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
| VOL-001 | 3 | needs_review | docs/content/drafts/learn/volume.md | /learn/volume/ | guide | stock volume | Education | Core volume concept |
| VOL-002 | 3 | needs_review | docs/content/drafts/learn/relative-volume-rvol.md | /learn/relative-volume-rvol/ | guide | relative volume RVOL | Education | RVOL guide |
| VOL-003 | 3 | needs_review | docs/content/drafts/learn/liquidity.md | /learn/liquidity/ | guide | stock liquidity | Education | Liquidity guide |
| VOL-004 | 3 | needs_review | docs/content/drafts/learn/spread.md | /learn/spread/ | guide | bid ask spread | Education | Spread guide |
| VOL-005 | 3 | needs_review | docs/content/drafts/learn/bid-and-ask.md | /learn/bid-and-ask/ | guide | bid and ask | Education | Bid ask guide |
| VOL-006 | 3 | not_started | docs/content/drafts/learn/level-2.md | /learn/level-2/ | guide | Level 2 trading | Education | Level 2 guide |
| VOL-007 | 3 | not_started | docs/content/drafts/learn/time-and-sales.md | /learn/time-and-sales/ | guide | time and sales | Education | Tape reading guide |
| VOL-008 | 3 | not_started | docs/content/drafts/learn/market-orders-vs-limit-orders.md | /learn/market-orders-vs-limit-orders/ | guide | market orders vs limit orders | Education | Order type guide |
| VOL-009 | 3 | not_started | docs/content/drafts/learn/slippage.md | /learn/slippage/ | guide | trading slippage | Education | Slippage guide |
| VOL-010 | 3 | not_started | docs/content/drafts/learn/volume-spike.md | /learn/volume-spike/ | guide | volume spike | Education | Volume spike guide |

## Next Run Instruction

Draft VOL-006 through VOL-010 next, then update those rows to `needs_review` after checking against `docs/content/seo-quality-checklist.md`.

VOL-001 through VOL-005 are drafted and ready for review.
