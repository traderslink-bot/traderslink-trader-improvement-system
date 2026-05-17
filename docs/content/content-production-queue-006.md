# TradersLink SEO Content Production Queue 006

## Purpose

This is the continuation queue after `docs/content/content-production-queue-005.md` reached a fully drafted `needs_review` state.

This queue finishes the volume, liquidity, and order-flow concepts cluster from the master plan.

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
| VOL-011 | 3 | needs_review | docs/content/drafts/learn/dollar-volume.md | /learn/dollar-volume/ | guide | dollar volume | Education | Dollar volume guide |
| VOL-012 | 3 | needs_review | docs/content/drafts/learn/float-rotation.md | /learn/float-rotation/ | guide | float rotation | Education | Float rotation guide |
| VOL-013 | 3 | needs_review | docs/content/drafts/learn/volume-by-price.md | /learn/volume-by-price/ | guide | volume by price | Education | Volume by price guide |
| VOL-014 | 3 | needs_review | docs/content/drafts/learn/accumulation-and-distribution.md | /learn/accumulation-and-distribution/ | guide | accumulation distribution | Education | Accumulation and distribution guide |
| VOL-015 | 3 | needs_review | docs/content/drafts/learn/unusual-volume.md | /learn/unusual-volume/ | guide | unusual volume stocks | Education | Unusual volume guide |

## Next Run Instruction

All currently queued Queue 006 items are drafted and marked `needs_review`.

Next step options:

1. Review and approve existing drafts.
2. Start the next major SEO cluster from the master plan.
3. Good next cluster options include swing trading education, risk management and trading psychology, additional chart patterns, additional candlestick patterns, SEC filing expansion, comparison pages, or glossary expansion.
