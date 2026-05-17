# TradersLink SEO Content Production Queue 030

## Purpose

This is the continuation queue after `docs/content/content-production-queue-029.md` reached a fully drafted `needs_review` state.

This queue continues the SEC filings and dilution/offering education cluster from the master plan, expanding into share structure, runway, going concern, and shareholder approval topics.

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

Before drafting Queue 030, each target draft path was checked on branch `audit-refactor-apr16`.

No existing draft files were found for these Queue 030 items, so all five drafts were created as new markdown content drafts.

## Queue Table

| ID | Priority | Status | Draft Path | Slug | Type | Primary Keyword | Product Area | Notes |
|---|---:|---|---|---|---|---|---|---|
| OFFERING-020 | 3 | needs_review | docs/content/drafts/learn/float-vs-shares-outstanding.md | /learn/float-vs-shares-outstanding/ | comparison | float vs shares outstanding | Education | New Queue 030 draft. Checklist passed for frontmatter, H1, H2 structure, internal links, FAQ, educational disclaimer, and non-financial-advice language. |
| OFFERING-021 | 3 | needs_review | docs/content/drafts/learn/market-cap-vs-fully-diluted-market-cap.md | /learn/market-cap-vs-fully-diluted-market-cap/ | comparison | market cap vs fully diluted market cap | Education | New Queue 030 draft. Checklist passed for frontmatter, H1, H2 structure, internal links, FAQ, educational disclaimer, and non-financial-advice language. |
| OFFERING-022 | 3 | needs_review | docs/content/drafts/learn/cash-runway.md | /learn/cash-runway/ | guide | cash runway | Education | New Queue 030 draft. Checklist passed for frontmatter, H1, H2 structure, internal links, FAQ, educational disclaimer, and non-financial-advice language. |
| OFFERING-023 | 3 | needs_review | docs/content/drafts/learn/going-concern.md | /learn/going-concern/ | guide | going concern | Education | New Queue 030 draft. Checklist passed for frontmatter, H1, H2 structure, internal links, FAQ, educational disclaimer, and non-financial-advice language. |
| OFFERING-024 | 3 | needs_review | docs/content/drafts/learn/shareholder-approval-for-dilution.md | /learn/shareholder-approval-for-dilution/ | guide | shareholder approval for dilution | Education | New Queue 030 draft. Checklist passed for frontmatter, H1, H2 structure, internal links, FAQ, educational disclaimer, and non-financial-advice language. |

## Queue 030 Completion Notes

All currently queued Queue 030 items are drafted and marked `needs_review`.

Each draft includes:

1. YAML frontmatter.
2. Clear H1.
3. Useful H2 sections.
4. Natural internal links.
5. FAQ section.
6. Educational disclaimer.
7. Careful non-financial-advice language.
8. No buy or sell signals.
9. No claims that float, shares outstanding, fully diluted market cap, cash runway, going concern language, shareholder approval, or related financing structures guarantee price moves, dilution, selling pressure, or trading outcomes.

## Next Run Instruction

All currently queued Queue 030 items are drafted and marked `needs_review`.

Next step options:

1. Review and approve existing drafts.
2. Start a new master plan cluster.
3. Good next Queue 031 options include comparison pages such as trading journal app vs spreadsheet, glossary library expansion, or broker/tools/scanner/workflow guides.
