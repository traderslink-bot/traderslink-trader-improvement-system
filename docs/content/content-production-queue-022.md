# TradersLink SEO Content Production Queue 022

## Purpose

This is the continuation queue after `docs/content/content-production-queue-021.md` reached a fully drafted `needs_review` state.

This queue starts a new SEC filings continuation batch from the master plan, avoiding SEC filing drafts already created in earlier queues.

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

Before drafting Queue 022, each target draft path was checked on branch `audit-refactor-apr16`.

No existing draft files were found for these Queue 022 items, so all five drafts were created as new markdown content drafts.

Queue 001 already covered the SEC hub, Form 8-K, Form S-1, Form S-3, Form 424B5, reverse split, and dilution-risk pages, so those were not duplicated.

## Queue Table

| ID | Priority | Status | Draft Path | Slug | Type | Primary Keyword | Product Area | Notes |
|---|---:|---|---|---|---|---|---|---|
| SEC-008 | 3 | needs_review | docs/content/drafts/learn/sec-filings/form-10-k.md | /learn/sec-filings/form-10-k/ | guide | Form 10-K | Education | New Queue 022 draft. Checklist passed for frontmatter, H1, H2 structure, internal links, FAQ, educational disclaimer, and non-financial-advice language. |
| SEC-009 | 3 | needs_review | docs/content/drafts/learn/sec-filings/form-10-q.md | /learn/sec-filings/form-10-q/ | guide | Form 10-Q | Education | New Queue 022 draft. Checklist passed for frontmatter, H1, H2 structure, internal links, FAQ, educational disclaimer, and non-financial-advice language. |
| SEC-010 | 3 | needs_review | docs/content/drafts/learn/sec-filings/form-s-4.md | /learn/sec-filings/form-s-4/ | guide | Form S-4 | Education | New Queue 022 draft. Checklist passed for frontmatter, H1, H2 structure, internal links, FAQ, educational disclaimer, and non-financial-advice language. |
| SEC-011 | 3 | needs_review | docs/content/drafts/learn/sec-filings/form-f-1.md | /learn/sec-filings/form-f-1/ | guide | Form F-1 | Education | New Queue 022 draft. Checklist passed for frontmatter, H1, H2 structure, internal links, FAQ, educational disclaimer, and non-financial-advice language. |
| SEC-012 | 3 | needs_review | docs/content/drafts/learn/sec-filings/form-f-3.md | /learn/sec-filings/form-f-3/ | guide | Form F-3 | Education | New Queue 022 draft. Checklist passed for frontmatter, H1, H2 structure, internal links, FAQ, educational disclaimer, and non-financial-advice language. |

## Queue 022 Completion Notes

All currently queued Queue 022 items are drafted and marked `needs_review`.

Each draft includes:

1. YAML frontmatter.
2. Clear H1.
3. Useful H2 sections.
4. Natural internal links.
5. FAQ section.
6. Educational disclaimer.
7. Careful non-financial-advice language.
8. No buy or sell signals.
9. No claims that SEC filings guarantee price moves, dilution, merger completion, or trading outcomes.

## Next Run Instruction

All currently queued Queue 022 items are drafted and marked `needs_review`.

Next step options:

1. Review and approve existing drafts.
2. Continue the SEC filings and dilution/offering education cluster.
3. Good next Queue 023 starter items include Form 424B3, Form 424B4, DEF 14A proxy statement, PRE 14A proxy statement, and Schedule 13D.
