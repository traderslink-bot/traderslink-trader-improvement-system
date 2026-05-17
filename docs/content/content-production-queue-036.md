# TradersLink SEO Content Production Queue 036

## Purpose

This is the continuation queue after `docs/content/content-production-queue-035.md` reached a fully drafted `needs_review` state.

This queue starts the glossary library expansion cluster. The goal is to create short, useful glossary pages that support internal linking across trade review, execution analysis, risk management, and Trader Intelligence product-intent content.

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

Before drafting Queue 036, each target draft path was checked on branch `audit-refactor-apr16`.

No existing draft files were found for these Queue 036 items, so all five drafts were created as new markdown content drafts.

## Queue Table

| ID | Priority | Status | Draft Path | Slug | Type | Primary Keyword | Product Area | Notes |
|---|---:|---|---|---|---|---|---|---|
| GLOSSARY-001 | 3 | needs_review | docs/content/drafts/glossary/trade-execution.md | /glossary/trade-execution/ | glossary | trade execution | Education | New Queue 036 draft. Checklist passed for frontmatter, H1, H2 structure, internal links, FAQ, educational disclaimer, and careful non-financial-advice language. |
| GLOSSARY-002 | 3 | needs_review | docs/content/drafts/glossary/trade-management.md | /glossary/trade-management/ | glossary | trade management | Education | New Queue 036 draft. Checklist passed for frontmatter, H1, H2 structure, internal links, FAQ, educational disclaimer, and careful non-financial-advice language. |
| GLOSSARY-003 | 3 | needs_review | docs/content/drafts/glossary/trading-setup.md | /glossary/trading-setup/ | glossary | trading setup | Education | New Queue 036 draft. Checklist passed for frontmatter, H1, H2 structure, internal links, FAQ, educational disclaimer, and careful non-financial-advice language. |
| GLOSSARY-004 | 3 | needs_review | docs/content/drafts/glossary/risk-reward-ratio.md | /glossary/risk-reward-ratio/ | glossary | risk reward ratio | Education | New Queue 036 draft. Checklist passed for frontmatter, H1, H2 structure, internal links, FAQ, educational disclaimer, and careful non-financial-advice language. |
| GLOSSARY-005 | 3 | needs_review | docs/content/drafts/glossary/position-sizing.md | /glossary/position-sizing/ | glossary | position sizing | Education | New Queue 036 draft. Checklist passed for frontmatter, H1, H2 structure, internal links, FAQ, educational disclaimer, and careful non-financial-advice language. |

## Queue 036 Completion Notes

All currently queued Queue 036 items are drafted and marked `needs_review`.

Each draft includes:

1. YAML frontmatter.
2. Clear H1.
3. Short, useful glossary definition.
4. Practical trading context.
5. Natural internal links.
6. FAQ section.
7. Educational disclaimer.
8. Careful non-financial-advice language.
9. No buy or sell signals.
10. No claims that glossary concepts, Trader Intelligence, or trade review tools guarantee profitability, better decisions, or reduced losses.

## Next Run Instruction

All currently queued Queue 036 items are drafted and marked `needs_review`.

Next step options:

1. Review and approve existing drafts.
2. Continue the glossary library expansion cluster.
3. Good next Queue 037 starter items include stop loss, daily loss limit, average win, average loss, and profit factor.
