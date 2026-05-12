# TradersLink SEO Content Production Queue 018

## Purpose

This is the continuation queue after `docs/content/content-production-queue-017.md` reached a fully drafted `needs_review` state.

This queue starts the press release and catalyst education cluster from the master plan.

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

## Pre-Draft Existence Check

Before drafting Queue 018, each target draft path was checked on branch `audit-refactor-apr16`.

No existing draft files were found for these Queue 018 items, so all five drafts were created as new markdown content drafts.

## Queue Table

| ID | Priority | Status | Draft Path | Slug | Type | Primary Keyword | Product Area | Notes |
|---|---:|---|---|---|---|---|---|---|
| CATALYST-001 | 3 | needs_review | docs/content/drafts/learn/press-releases.md | /learn/press-releases/ | guide | stock press releases | Education | New Queue 018 draft. Checklist passed for frontmatter, H1, H2 structure, internal links, FAQ, educational disclaimer, and non-financial-advice language. |
| CATALYST-002 | 3 | needs_review | docs/content/drafts/learn/how-to-read-stock-press-releases.md | /learn/how-to-read-stock-press-releases/ | guide | how to read stock press releases | Education | New Queue 018 draft. Checklist passed for frontmatter, H1, H2 structure, internal links, FAQ, educational disclaimer, and non-financial-advice language. |
| CATALYST-003 | 3 | needs_review | docs/content/drafts/learn/stock-catalysts.md | /learn/stock-catalysts/ | guide | stock catalysts | Education | New Queue 018 draft. Checklist passed for frontmatter, H1, H2 structure, internal links, FAQ, educational disclaimer, and non-financial-advice language. |
| CATALYST-004 | 3 | needs_review | docs/content/drafts/learn/clinical-trial-news.md | /learn/clinical-trial-news/ | guide | clinical trial news | Education | New Queue 018 draft. Checklist passed for frontmatter, H1, H2 structure, internal links, FAQ, educational disclaimer, and non-financial-advice language. |
| CATALYST-005 | 3 | needs_review | docs/content/drafts/learn/fda-news-stocks.md | /learn/fda-news-stocks/ | guide | FDA news stocks | Education | New Queue 018 draft. Checklist passed for frontmatter, H1, H2 structure, internal links, FAQ, educational disclaimer, and non-financial-advice language. |

## Queue 018 Completion Notes

All currently queued Queue 018 items are drafted and marked `needs_review`.

Each draft includes:

1. YAML frontmatter.
2. Clear H1.
3. Useful H2 sections.
4. Natural internal links.
5. FAQ section.
6. Educational disclaimer.
7. Careful non-financial-advice language.
8. No buy or sell signals.
9. No claims that news, catalysts, FDA updates, clinical trial updates, or press releases guarantee price moves.

## Next Run Instruction

All currently queued Queue 018 items are drafted and marked `needs_review`.

Next step options:

1. Review and approve existing drafts.
2. Continue the press release and catalyst education cluster.
3. Good next Queue 019 starter items include earnings news, revenue guidance, contract news stocks, merger news stocks, and partnership news stocks.
