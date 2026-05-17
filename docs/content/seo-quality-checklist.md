# TradersLink SEO Quality Checklist

## Purpose

Use this checklist before marking any SEO draft as `needs_review` in `docs/content/content-production-queue.md`.

The goal is to keep the content useful, accurate, SEO-focused, and safe for a trading education/tool website.

## Required Source Files

Before reviewing a draft, compare it against:

- `docs/content/trader-intelligence-seo-master-plan.md`
- `docs/content/content-production-queue.md`
- `docs/content/seo-writing-system-prompt.md`

## Frontmatter Checklist

Every draft must include:

- `title`
- `slug`
- `primary_keyword`
- `secondary_keywords`
- `search_intent`
- `status`
- `product_area`
- `availability`
- `content_type`
- `funnel_stage`
- `priority`
- `cta`
- `internal_links`
- `schema`
- `last_reviewed`
- `meta_title`
- `meta_description`

Confirm:

- The slug matches the content production queue.
- The primary keyword matches the content production queue.
- Product pages use `product_area: "Trader Intelligence"` where relevant.
- Educational pages use `product_area: "Education"`.
- Trader Intelligence pages use `availability: "coming_soon"` unless the product status changes.
- Educational pages use `availability: "educational"`.

## SEO Checklist

Confirm:

- The primary keyword appears naturally in the title.
- The primary keyword appears naturally in the H1.
- The primary keyword appears in the intro.
- The primary keyword appears in the meta title.
- The search intent is answered in the first 150 words.
- The page has useful H2 sections.
- The meta title is concise and not clickbait.
- The meta description explains the value clearly.
- The FAQ section includes real search-style questions.
- The article is not keyword-stuffed.

## Content Quality Checklist

Confirm:

- The draft is useful even if the reader never buys anything.
- The content is specific to traders.
- The content avoids generic filler.
- The content explains why the topic matters.
- The content explains common mistakes or risk considerations where relevant.
- The content includes examples or review questions where useful.
- The content connects naturally to trade review or journaling where relevant.
- The content does not repeat the exact same language from other drafts.

## Product Claim Checklist

Confirm:

- The draft does not claim Trader Intelligence gives buy or sell signals.
- The draft does not claim Trader Intelligence guarantees profits.
- The draft does not claim Trader Intelligence prevents losses.
- The draft does not claim Trader Intelligence replaces trader judgment.
- The draft does not claim Trader Intelligence automatically identifies every setup.
- The draft clearly marks Trader Intelligence as coming soon where relevant.
- The draft explains the product as a review, organization, and analysis tool.

## Financial Safety Checklist

Confirm:

- No financial advice is given.
- No ticker-specific recommendation is given.
- No buy or sell instruction is given.
- No claim says a chart pattern guarantees a move.
- No claim says an SEC filing guarantees dilution or a price move.
- No claim says a press release guarantees a stock will run.
- No language encourages reckless trading.
- Educational disclaimers are included where needed.

## Internal Linking Checklist

Confirm:

- Product pages link to at least 3 related product or feature pages.
- Feature pages link to `/trader-intelligence/` and `/trading-journal-app/`.
- Blog articles link to at least 2 relevant product or feature pages.
- Educational guides link to related guides or glossary terms.
- SEC filing pages link to `/learn/sec-filings/`.
- Chart and candle pages link to the relevant hub page.
- Internal links are natural and not forced.

## FAQ Checklist

Confirm:

- The FAQ section has 4 to 7 questions.
- FAQ answers are concise but useful.
- FAQ questions match realistic searches.
- FAQs do not repeat the exact same answer.
- FAQs do not make product claims that the page body avoids.

## Structure Checklist

Confirm:

- There is one clear H1.
- H2s follow a logical order.
- Paragraphs are short and readable.
- Bullets are used where they improve scanning.
- The conclusion or CTA does not overpromise.

## Draft Status Rule

Only update a queue item to `needs_review` after the draft passes this checklist.

If a draft is incomplete or uncertain, leave the queue status as `drafting` and add a note under the relevant queue item.

## Review Notes Template

When reporting completed drafts to the user, include:

```text
Completed SEO batch:

- Draft path
- Slug
- Primary keyword
- Status set to needs_review
- Any concerns or notes

Commit SHA:
```
