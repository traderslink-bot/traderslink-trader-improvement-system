# TradersLink SEO Content Production Queue

## Purpose

This file controls the semi-automated SEO writing workflow for TradersLink.

When the user says `continue the SEO content queue`, ChatGPT should:

1. Read this queue.
2. Pick the next batch of items marked `not_started`.
3. Write complete markdown drafts with YAML frontmatter.
4. Save drafts under `docs/content/drafts/`.
5. Update those queue items to `needs_review`.
6. Report the completed files and commit SHA.

Do not write JSX, HTML, CSS, React, or Next.js files.

## Status Values

- `not_started`
- `drafting`
- `needs_review`
- `approved`
- `published`
- `paused`

## Batch Rules

- Product pages: write 2 to 4 per batch.
- Feature pages: write 4 to 6 per batch.
- Blog articles: write 5 to 8 per batch.
- Glossary pages: write 10 to 20 per batch.
- SEC filing pages: write 5 to 8 per batch.
- Chart and candle pages: write 5 to 10 per batch.

Default batch size: 5 drafts unless the user requests a different number.

## Required Source Files

Before writing drafts, read:

- `docs/content/trader-intelligence-seo-master-plan.md`
- `docs/content/seo-writing-system-prompt.md`
- `docs/content/seo-quality-checklist.md`

## Draft Output Rules

Every draft must include YAML frontmatter with:

- title
- slug
- primary_keyword
- secondary_keywords
- search_intent
- status
- product_area
- availability
- content_type
- funnel_stage
- priority
- cta
- internal_links
- schema
- last_reviewed
- meta_title
- meta_description

Every draft must include:

- H1
- intro that answers search intent early
- useful H2 sections
- practical examples where relevant
- common mistakes or risk considerations where relevant
- connection to trade review where relevant
- internal links section
- FAQ section
- educational disclaimer where relevant

## Queue Table

| ID | Priority | Status | Draft Path | Slug | Type | Primary Keyword | Product Area | Notes |
|---|---:|---|---|---|---|---|---|---|
| TI-001 | 1 | not_started | docs/content/drafts/product/trading-journal-app.md | /trading-journal-app/ | product_page | trading journal app | Trader Intelligence | Main money page |
| TI-002 | 1 | not_started | docs/content/drafts/product/trader-intelligence.md | /trader-intelligence/ | product_page | trader intelligence | Trader Intelligence | Main product hub |
| TI-003 | 1 | not_started | docs/content/drafts/product/trade-review-app.md | /trade-review-app/ | product_page | trade review app | Trader Intelligence | Review-focused product page |
| TI-004 | 1 | not_started | docs/content/drafts/features/execution-analysis.md | /features/execution-analysis/ | feature_page | trade execution analysis | Trader Intelligence | Core feature |
| TI-005 | 1 | not_started | docs/content/drafts/features/trading-mistake-tracker.md | /features/trading-mistake-tracker/ | feature_page | trading mistake tracker | Trader Intelligence | Core feature |
| TI-006 | 1 | not_started | docs/content/drafts/features/broker-execution-import.md | /features/broker-execution-import/ | feature_page | broker execution import | Trader Intelligence | Import feature |
| TI-007 | 1 | not_started | docs/content/drafts/features/trade-management-feedback.md | /features/trade-management-feedback/ | feature_page | trade management feedback | Trader Intelligence | Trade management feature |
| TI-008 | 1 | not_started | docs/content/drafts/features/support-resistance-trade-review.md | /features/support-resistance-trade-review/ | feature_page | support and resistance trade review | Trader Intelligence | Levels-based review |
| TI-009 | 2 | not_started | docs/content/drafts/product/day-trading-journal.md | /day-trading-journal/ | product_page | day trading journal | Trader Intelligence | Commercial page |
| TI-010 | 2 | not_started | docs/content/drafts/features/session-time-analysis.md | /features/session-time-analysis/ | feature_page | session time analysis trading | Trader Intelligence | Session review |
| TI-011 | 2 | not_started | docs/content/drafts/features/entry-review.md | /features/entry-review/ | feature_page | trade entry review | Trader Intelligence | Entry analysis |
| TI-012 | 2 | not_started | docs/content/drafts/features/exit-review.md | /features/exit-review/ | feature_page | trade exit review | Trader Intelligence | Exit analysis |
| TI-013 | 2 | not_started | docs/content/drafts/features/scaling-analysis.md | /features/scaling-analysis/ | feature_page | scaling in and out trading | Trader Intelligence | Scaling review |
| TI-014 | 2 | not_started | docs/content/drafts/features/average-down-tracking.md | /features/average-down-tracking/ | feature_page | average down tracking | Trader Intelligence | Adverse add behavior |
| TI-015 | 2 | not_started | docs/content/drafts/features/profit-protection-review.md | /features/profit-protection-review/ | feature_page | profit protection trading | Trader Intelligence | Profit giveback review |
| TI-016 | 2 | not_started | docs/content/drafts/features/performance-insights.md | /features/performance-insights/ | feature_page | trading performance insights | Trader Intelligence | Performance review |
| BLOG-001 | 3 | not_started | docs/content/drafts/blog/how-to-review-your-trades.md | /blog/how-to-review-your-trades/ | blog_article | how to review your trades | Education | Foundational blog |
| BLOG-002 | 3 | not_started | docs/content/drafts/blog/trading-journal-for-day-traders.md | /blog/trading-journal-for-day-traders/ | blog_article | trading journal for day traders | Education | Supports journal pages |
| BLOG-003 | 3 | not_started | docs/content/drafts/blog/how-to-analyze-trade-entries-and-exits.md | /blog/how-to-analyze-trade-entries-and-exits/ | blog_article | how to analyze trade entries and exits | Education | Supports execution analysis |
| BLOG-004 | 3 | not_started | docs/content/drafts/blog/how-to-track-trading-mistakes.md | /blog/how-to-track-trading-mistakes/ | blog_article | how to track trading mistakes | Education | Supports mistake tracker |
| BLOG-005 | 3 | not_started | docs/content/drafts/blog/why-p-and-l-alone-is-not-enough.md | /blog/why-p-and-l-alone-is-not-enough/ | blog_article | why P&L alone is not enough | Education | Core philosophy |
| BLOG-006 | 3 | not_started | docs/content/drafts/blog/how-to-review-trade-management.md | /blog/how-to-review-trade-management/ | blog_article | how to review trade management | Education | Supports trade management |
| BLOG-007 | 3 | not_started | docs/content/drafts/blog/trading-journal-template-for-day-traders.md | /blog/trading-journal-template-for-day-traders/ | blog_article | trading journal template for day traders | Education | Template intent |
| BLOG-008 | 3 | not_started | docs/content/drafts/blog/daily-trade-review-checklist.md | /blog/daily-trade-review-checklist/ | checklist | daily trade review checklist | Education | Checklist intent |
| LEARN-001 | 3 | not_started | docs/content/drafts/learn/small-cap-stocks.md | /learn/small-cap-stocks/ | guide | small cap stocks | Education | Small-cap hub |
| LEARN-002 | 3 | not_started | docs/content/drafts/learn/penny-stocks.md | /learn/penny-stocks/ | guide | penny stocks | Education | Penny stock hub |
| LEARN-003 | 3 | not_started | docs/content/drafts/learn/low-float-stocks.md | /learn/low-float-stocks/ | guide | low float stocks | Education | Float education |
| LEARN-004 | 3 | not_started | docs/content/drafts/learn/stock-float.md | /learn/stock-float/ | guide | stock float | Education | Core term |
| LEARN-005 | 3 | not_started | docs/content/drafts/learn/relative-volume.md | /learn/relative-volume/ | guide | relative volume | Education | Scanner concept |
| SEC-001 | 3 | not_started | docs/content/drafts/learn/sec-filings.md | /learn/sec-filings/ | cluster_hub | SEC filings | Education | SEC hub |
| SEC-002 | 3 | not_started | docs/content/drafts/learn/sec-filings/form-8-k.md | /learn/sec-filings/form-8-k/ | guide | Form 8-K | Education | Filing explainer |
| SEC-003 | 3 | not_started | docs/content/drafts/learn/sec-filings/form-s-1.md | /learn/sec-filings/form-s-1/ | guide | Form S-1 | Education | Filing explainer |
| SEC-004 | 3 | not_started | docs/content/drafts/learn/sec-filings/form-s-3.md | /learn/sec-filings/form-s-3/ | guide | Form S-3 | Education | Filing explainer |
| SEC-005 | 3 | not_started | docs/content/drafts/learn/sec-filings/form-424b5.md | /learn/sec-filings/form-424b5/ | guide | Form 424B5 | Education | Filing explainer |
| SEC-006 | 3 | not_started | docs/content/drafts/learn/reverse-split.md | /learn/reverse-split/ | guide | reverse stock split | Education | Dilution/risk education |
| SEC-007 | 3 | not_started | docs/content/drafts/learn/how-to-spot-dilution-risk.md | /learn/how-to-spot-dilution-risk/ | guide | how to spot dilution risk | Education | Dilution education |
| CHART-001 | 4 | not_started | docs/content/drafts/learn/chart-patterns.md | /learn/chart-patterns/ | cluster_hub | chart patterns | Education | Chart hub |
| CHART-002 | 4 | not_started | docs/content/drafts/learn/chart-patterns/bull-flag.md | /learn/chart-patterns/bull-flag/ | guide | bull flag pattern | Education | Pattern guide |
| CHART-003 | 4 | not_started | docs/content/drafts/learn/chart-patterns/ascending-triangle.md | /learn/chart-patterns/ascending-triangle/ | guide | ascending triangle pattern | Education | Pattern guide |
| CHART-004 | 4 | not_started | docs/content/drafts/learn/chart-patterns/double-top.md | /learn/chart-patterns/double-top/ | guide | double top pattern | Education | Pattern guide |
| CANDLE-001 | 4 | not_started | docs/content/drafts/learn/candlestick-patterns.md | /learn/candlestick-patterns/ | cluster_hub | candlestick patterns | Education | Candle hub |
| CANDLE-002 | 4 | not_started | docs/content/drafts/learn/candlestick-patterns/doji.md | /learn/candlestick-patterns/doji/ | guide | doji candle | Education | Candle guide |
| CANDLE-003 | 4 | not_started | docs/content/drafts/learn/candlestick-patterns/hammer.md | /learn/candlestick-patterns/hammer/ | guide | hammer candlestick | Education | Candle guide |
| CANDLE-004 | 4 | not_started | docs/content/drafts/learn/candlestick-patterns/engulfing-candle.md | /learn/candlestick-patterns/engulfing-candle/ | guide | engulfing candle | Education | Candle guide |
| RISK-001 | 4 | not_started | docs/content/drafts/learn/risk-management.md | /learn/risk-management/ | guide | trading risk management | Education | Risk hub |
| RISK-002 | 4 | not_started | docs/content/drafts/learn/position-sizing.md | /learn/position-sizing/ | guide | position sizing | Education | Risk guide |
| RISK-003 | 4 | not_started | docs/content/drafts/learn/revenge-trading.md | /learn/revenge-trading/ | guide | revenge trading | Education | Psychology guide |
| RISK-004 | 4 | not_started | docs/content/drafts/learn/overtrading.md | /learn/overtrading/ | guide | overtrading | Education | Psychology guide |

## Next Run Instruction

When continuing the queue, start with the lowest priority number and earliest table order where `Status` is `not_started`.

Default first batch:

1. TI-001
2. TI-002
3. TI-003
4. TI-004
5. TI-005
