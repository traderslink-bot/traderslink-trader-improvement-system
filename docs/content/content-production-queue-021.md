# TradersLink SEO Content Production Queue 021

## Purpose

This is the continuation queue after `docs/content/content-production-queue-020.md` reached a fully drafted `needs_review` state.

This queue finishes the remaining press release and catalyst education items from the current master plan catalyst cluster.

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

Before drafting Queue 021, each target draft path was checked on branch `audit-refactor-apr16`.

No existing draft files were found for these Queue 021 items, so all five drafts were created as new markdown content drafts.

## Queue Table

| ID | Priority | Status | Draft Path | Slug | Type | Primary Keyword | Product Area | Notes |
|---|---:|---|---|---|---|---|---|---|
| CATALYST-016 | 3 | needs_review | docs/content/drafts/learn/orphan-drug-designation.md | /learn/orphan-drug-designation/ | guide | orphan drug designation | Education | New Queue 021 draft. Checklist passed for frontmatter, H1, H2 structure, internal links, FAQ, educational disclaimer, and non-financial-advice language. |
| CATALYST-017 | 3 | needs_review | docs/content/drafts/learn/pdufa-date.md | /learn/pdufa-date/ | guide | PDUFA date | Education | New Queue 021 draft. Checklist passed for frontmatter, H1, H2 structure, internal links, FAQ, educational disclaimer, and non-financial-advice language. |
| CATALYST-018 | 3 | needs_review | docs/content/drafts/learn/news-fade.md | /learn/news-fade/ | guide | news fade trading | Education | New Queue 021 draft. Checklist passed for frontmatter, H1, H2 structure, internal links, FAQ, educational disclaimer, and non-financial-advice language. |
| CATALYST-019 | 3 | needs_review | docs/content/drafts/learn/sell-the-news.md | /learn/sell-the-news/ | guide | sell the news | Education | New Queue 021 draft. Checklist passed for frontmatter, H1, H2 structure, internal links, FAQ, educational disclaimer, and non-financial-advice language. |
| CATALYST-020 | 3 | needs_review | docs/content/drafts/learn/how-to-review-news-trades.md | /learn/how-to-review-news-trades/ | guide | how to review news trades | Education | New Queue 021 draft. Checklist passed for frontmatter, H1, H2 structure, internal links, FAQ, educational disclaimer, and non-financial-advice language. |

## Queue 021 Completion Notes

All currently queued Queue 021 items are drafted and marked `needs_review`.

Each draft includes:

1. YAML frontmatter.
2. Clear H1.
3. Useful H2 sections.
4. Natural internal links.
5. FAQ section.
6. Educational disclaimer.
7. Careful non-financial-advice language.
8. No buy or sell signals.
9. No claims that orphan drug designation, PDUFA dates, news fades, sell-the-news reactions, news trade review, or any catalyst guarantees price moves or trading outcomes.

## Next Run Instruction

All currently queued Queue 021 items are drafted and marked `needs_review`.

Next step options:

1. Review and approve existing drafts.
2. Start a new master plan cluster.
3. Good next Queue 022 options include more SEC filings and dilution/offering pages, comparison pages such as trading journal app vs spreadsheet, glossary library expansion, or broker/tools/scanner/workflow guides.
