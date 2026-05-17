# TradersLink SEO Content Production Queue 026

## Purpose

This is the continuation queue after `docs/content/content-production-queue-025.md` reached a fully drafted `needs_review` state.

This queue continues the SEC filings and dilution/offering education cluster from the master plan, moving from SEC filing explainers into offering and financing explainers.

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

Before drafting Queue 026, each target draft path was checked on branch `audit-refactor-apr16`.

No existing draft files were found for these Queue 026 items, so all five drafts were created as new markdown content drafts.

## Queue Table

| ID | Priority | Status | Draft Path | Slug | Type | Primary Keyword | Product Area | Notes |
|---|---:|---|---|---|---|---|---|---|
| SEC-028 | 3 | needs_review | docs/content/drafts/learn/sec-filings/effect-notice.md | /learn/sec-filings/effect-notice/ | guide | EFFECT notice | Education | New Queue 026 draft. Checklist passed for frontmatter, H1, H2 structure, internal links, FAQ, educational disclaimer, and non-financial-advice language. |
| OFFERING-001 | 3 | needs_review | docs/content/drafts/learn/stock-offerings.md | /learn/stock-offerings/ | guide | stock offering | Education | New Queue 026 draft. Checklist passed for frontmatter, H1, H2 structure, internal links, FAQ, educational disclaimer, and non-financial-advice language. |
| OFFERING-002 | 3 | needs_review | docs/content/drafts/learn/public-offering.md | /learn/public-offering/ | guide | public offering stock | Education | New Queue 026 draft. Checklist passed for frontmatter, H1, H2 structure, internal links, FAQ, educational disclaimer, and non-financial-advice language. |
| OFFERING-003 | 3 | needs_review | docs/content/drafts/learn/registered-direct-offering.md | /learn/registered-direct-offering/ | guide | registered direct offering | Education | New Queue 026 draft. Checklist passed for frontmatter, H1, H2 structure, internal links, FAQ, educational disclaimer, and non-financial-advice language. |
| OFFERING-004 | 3 | needs_review | docs/content/drafts/learn/private-placement.md | /learn/private-placement/ | guide | private placement stock | Education | New Queue 026 draft. Checklist passed for frontmatter, H1, H2 structure, internal links, FAQ, educational disclaimer, and non-financial-advice language. |

## Queue 026 Completion Notes

All currently queued Queue 026 items are drafted and marked `needs_review`.

Each draft includes:

1. YAML frontmatter.
2. Clear H1.
3. Useful H2 sections.
4. Natural internal links.
5. FAQ section.
6. Educational disclaimer.
7. Careful non-financial-advice language.
8. No buy or sell signals.
9. No claims that EFFECT notices, stock offerings, public offerings, registered direct offerings, private placements, or financing filings guarantee price moves, dilution impact, selling pressure, or trading outcomes.

## Next Run Instruction

All currently queued Queue 026 items are drafted and marked `needs_review`.

Next step options:

1. Review and approve existing drafts.
2. Continue the SEC filings and dilution/offering education cluster.
3. Good next Queue 027 starter items include at-the-market offering, shelf registration, resale registration statement, warrants, and pre-funded warrants.
