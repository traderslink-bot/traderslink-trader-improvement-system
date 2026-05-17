# TradersLink Learn Editorial Upgrade Tracker

## Purpose

This tracker is used to manage the full Learn editorial upgrade workflow from start to finish.

The Learn section is now treated as an educational learning journey, not just SEO content. This tracker helps ChatGPT and Codex track which content has been reviewed, what needs upgrading, where visuals are needed, where new gap articles are needed, and what has passed editor verification.

## Source Workflow

Use this tracker with:

```text
docs/content/learn-editorial-upgrade-process.md
docs/content/learn-learning-journey-implementation-plan.md
docs/content/learn-visual-content-plan.md
docs/content/learn-image-asset-manifest.md
```

## Status Values

```text
not_started
pre_review_done
needs_light_upgrade
needs_full_upgrade
gap_article_needed
visuals_needed
in_progress
needs_editor_verification
complete
paused
```

## Upgrade Decision Values

```text
no_change_needed
light_upgrade
full_upgrade
gap_article_needed
visual_only_upgrade
metadata_only_upgrade
```

## Content Levels

```text
Foundation
Practical
Advanced
Review
```

## Current Overall Status

| Area | Status | Notes |
|---|---|---|
| Learning journey implementation plan | complete | Created `docs/content/learn-learning-journey-implementation-plan.md`. |
| Visual content plan | complete | Created `docs/content/learn-visual-content-plan.md`. |
| Editorial upgrade process | complete | Created `docs/content/learn-editorial-upgrade-process.md`. |
| Editorial upgrade tracker | in_progress | This file tracks the editorial upgrade system. |
| Image asset manifest | complete | Created `docs/content/learn-image-asset-manifest.md` during the first SVG batch and updated after the second SVG batch. |
| Gold standard article upgrade | complete | `/learn/support-and-resistance/` was upgraded as the first model article. |
| Chart Reading article upgrade 2 | complete | `/learn/how-to-draw-support-and-resistance/` upgraded using the gold-standard model. |
| Learn hub website build | not_started | Codex should not build until explicitly requested. |

## Track Upgrade Order

| Order | Learning Track | Status | Priority | Notes |
|---:|---|---|---:|---|
| 1 | Start Here For New Traders | not_started | 1 | Foundation path for new users. |
| 2 | Chart Reading And Market Structure | in_progress | 1 | Support/resistance and how-to-draw support/resistance articles complete. Continue with support levels and resistance levels. |
| 3 | News, Catalysts, Filings, And Dilution | not_started | 1 | High-value TradersLink differentiator. |
| 4 | Risk, Discipline, And Psychology | not_started | 1 | Important coaching/retention path. |
| 5 | Execution And Trade Review | not_started | 1 | Strongest Trader Intelligence bridge. |
| 6 | Volume, Liquidity, And Order Flow | not_started | 2 | Important for day traders and scalpers. |
| 7 | Day Trading Workflow | not_started | 2 | Practical user workflow path. |
| 8 | Practice And Improvement | not_started | 2 | Helps users train before increasing risk. |
| 9 | Candlestick Patterns In Context | not_started | 3 | Needs visuals and context warnings. |
| 10 | Trading Styles | not_started | 3 | Useful selector path. |
| 11 | Halts And High-Volatility Events | not_started | 3 | Risk education path. |
| 12 | Small-Cap, Float, And Short Squeeze Context | not_started | 2 | Should stay educational and non-hype. |

## Completed Model Article

Completed first model article:

```text
/learn/support-and-resistance/
```

This is now the model for future Learn article upgrades.

Alternative future gold-standard article:

```text
/learn/sec-filings/
```

## Article Upgrade Tracker Table

| Article/Slug | Draft Path | Primary Track | Secondary Tracks | Level | Status | Upgrade Decision | Visuals Needed | Gap Article? | Priority | Editor Notes | Last Commit |
|---|---|---|---|---|---|---|---|---|---:|---|---|
| /learn/support-and-resistance/ | docs/content/drafts/learn/support-and-resistance.md | Chart Reading And Market Structure | Start Here For New Traders, Execution And Trade Review | Foundation | complete | full_upgrade | 4 realistic SVG chart diagrams created and wired to content | No | 1 | Gold-standard article complete. Added learning path note, visual assets, realistic examples, support/resistance role reversal sections, bad-level example, checklist, journal review prompts, Trader Intelligence bridge, related terms, and editor-safe language. | `7c46572524af559e42a53a34531272bd3154dd6f` |
| /learn/how-to-draw-support-and-resistance/ | docs/content/drafts/learn/how-to-draw-support-and-resistance.md | Chart Reading And Market Structure | Start Here For New Traders | Practical | complete | full_upgrade | 3 realistic SVG chart diagrams created and wired to content | No | 1 | Upgraded as second Chart Reading article. Added learning path metadata, previous/next metadata, zones-vs-lines visual, obvious reaction visual, actionable near-price levels visual, step-by-step process, checklist, journal review prompts, Trader Intelligence bridge, and editor-safe language. | `26daa98458b746ca447a59f593ee5eda6380cffe` |
| /learn/support-levels/ | docs/content/drafts/learn/support-levels.md | Chart Reading And Market Structure | Start Here For New Traders | Practical | not_started | full_upgrade | 2 to 3 realistic SVG chart diagrams | No | 1 | Should teach clean support hold, support break, support reclaim, and risk review. |  |
| /learn/resistance-levels/ | docs/content/drafts/learn/resistance-levels.md | Chart Reading And Market Structure | Start Here For New Traders | Practical | not_started | full_upgrade | 2 to 3 realistic SVG chart diagrams | No | 1 | Should teach rejection, resistance break, failed breakout, and chase-risk review. |  |
| /learn/sec-filings/ | docs/content/drafts/learn/sec-filings.md | News, Catalysts, Filings, And Dilution | Small-Cap, Float, And Short Squeeze Context | Foundation | not_started | full_upgrade | 2 to 3 filing flow diagrams | No | 1 | Alternative gold-standard article. Needs beginner path, filing map, risk warnings, and links to dilution/offering concepts. |  |
| /learn/start-here/ | docs/content/drafts/learn/start-here.md | Start Here For New Traders | All Tracks | Foundation | not_started | gap_article_needed | 1 journey map SVG | Yes | 1 | Gap article likely needed to introduce the learning system and guide new users. |  |
| /learn/how-to-use-traderslink-learn/ | docs/content/drafts/learn/how-to-use-traderslink-learn.md | Start Here For New Traders | All Tracks | Foundation | not_started | gap_article_needed | 1 navigation diagram | Yes | 1 | Gap article likely needed to teach users how to move through learning paths. |  |
| /learn/chart-reading-path/ | docs/content/drafts/learn/chart-reading-path.md | Chart Reading And Market Structure | Candlestick Patterns In Context, Volume Liquidity And Order Flow | Foundation | not_started | gap_article_needed | 1 path diagram | Yes | 2 | Track hub article for chart reading learning path. |  |
| /learn/news-and-filings-path/ | docs/content/drafts/learn/news-and-filings-path.md | News, Catalysts, Filings, And Dilution | Small-Cap, Float, And Short Squeeze Context | Foundation | not_started | gap_article_needed | 1 filing/catalyst path diagram | Yes | 1 | High-value small-cap education hub. |  |
| /learn/trade-review-path/ | docs/content/drafts/learn/trade-review-path.md | Execution And Trade Review | Practice And Improvement | Foundation | not_started | gap_article_needed | 1 review workflow SVG | Yes | 1 | Important product education bridge. |  |
| /learn/risk-discipline-path/ | docs/content/drafts/learn/risk-discipline-path.md | Risk, Discipline, And Psychology | Start Here For New Traders | Foundation | not_started | gap_article_needed | 1 psychology/risk loop SVG | Yes | 1 | Coaching-style risk and behavior path. |  |
| /learn/practice-and-improvement-path/ | docs/content/drafts/learn/practice-and-improvement-path.md | Practice And Improvement | Execution And Trade Review | Foundation | not_started | gap_article_needed | 1 practice ladder SVG | Yes | 2 | Useful for safer learning. |  |

## Visual Asset Tracker Table

Canonical image tracking now lives in:

```text
docs/content/learn-image-asset-manifest.md
```

Summary of completed Chart Reading SVG batches:

| Asset File | Related Article/Slug | Learning Track | Visual Type | Purpose | Suggested Placement | Alt Text | Status | Editor Verification | Commit SHA |
|---|---|---|---|---|---|---|---|---|---|
| public/images/learn/chart-reading/support-resistance-candlestick-diagram.svg | /learn/support-and-resistance/ | Chart Reading And Market Structure | realistic candlestick chart | Show price moving between support and resistance zones. | Intro visual | Candlestick chart showing price bouncing near support and rejecting near resistance. | editor_verified | Supports the article topic, uses realistic candles and volume, avoids buy/sell language, and treats levels as educational zones. | `8b7d4b28f20c90adf0d3301887dbf67b17c9ca08` |
| public/images/learn/chart-reading/support-breaks-becomes-resistance.svg | /learn/support-and-resistance/ | Chart Reading And Market Structure | realistic candlestick chart | Show support breaking and later acting as resistance. | Body section | Candlestick chart showing broken support later acting as resistance. | editor_verified | Supports role-reversal concept, uses realistic candles, and avoids predictive language. | `9594e68325fcacc512d2f772f2d69dd024c0a8eb` |
| public/images/learn/chart-reading/resistance-breaks-becomes-support.svg | /learn/support-and-resistance/ | Chart Reading And Market Structure | realistic candlestick chart | Show resistance breaking and later acting as support. | Body section | Candlestick chart showing broken resistance later acting as support. | editor_verified | Supports role-reversal concept, uses realistic candles, and avoids guarantee language. | `f0febdfd9eab7b3a5a9ce68595f1787cd7f1c9e4` |
| public/images/learn/chart-reading/bad-support-resistance-example.svg | /learn/support-and-resistance/ | Chart Reading And Market Structure | realistic candlestick chart | Show common bad level drawing mistakes. | Common mistakes section | Chart diagram showing support and resistance levels drawn too randomly or too precisely. | editor_verified | Supports the common mistakes section and helps users understand chart clutter. | `003b0bbc79cafc546696b32312f6bc83e147bcf4` |
| public/images/learn/chart-reading/support-resistance-zones-vs-lines.svg | /learn/how-to-draw-support-and-resistance/ | Chart Reading And Market Structure | realistic candlestick chart | Compare exact lines with cleaner zones. | Step 1: zones, not exact lines. | Educational chart comparing exact support and resistance lines with cleaner support and resistance zones. | editor_verified | Supports zones-vs-lines teaching point and avoids false precision. | `1bc433405e7f8ad4aaa8f4dd615f22926bcbf839` |
| public/images/learn/chart-reading/mark-obvious-reaction-levels.svg | /learn/how-to-draw-support-and-resistance/ | Chart Reading And Market Structure | realistic candlestick chart | Show obvious repeated reaction areas. | Step 2: obvious reactions. | Candlestick chart showing how to mark only obvious support and resistance reaction areas. | editor_verified | Supports level selection process and teaches pre-trade visibility. | `8773da36c3f09bf66724314fa855e360d967345f` |
| public/images/learn/chart-reading/near-price-actionable-levels.svg | /learn/how-to-draw-support-and-resistance/ | Chart Reading And Market Structure | realistic candlestick chart | Show keeping closest actionable levels. | Step 4: current-plan levels. | Chart showing nearest actionable support and resistance levels around current price. | editor_verified | Supports practical workflow and reduces chart clutter. | `578247cbce1d0abd0245fa87c998b38533685618` |

## Gap Article Tracker

| Proposed Article | Reason For Gap | Learning Track | Priority | Status | Notes | Commit SHA |
|---|---|---|---:|---|---|---|
| /learn/start-here/ | Users need a clear first step before entering topic-specific paths. | Start Here For New Traders | 1 | not_started | Should introduce the whole learning journey. |  |
| /learn/how-to-use-traderslink-learn/ | Users need guidance on how to use paths, glossary, and Trader Intelligence bridges. | Start Here For New Traders | 1 | not_started | Could be combined with Start Here or separate. |  |
| /learn/chart-reading-path/ | Chart reading needs a hub that orders support/resistance, breakouts, fakeouts, and candles. | Chart Reading And Market Structure | 2 | not_started | Track hub article. |  |
| /learn/news-and-filings-path/ | News and filings need a guided path because the topic can overwhelm users. | News, Catalysts, Filings, And Dilution | 1 | not_started | High-value small-cap education hub. |  |
| /learn/trade-review-path/ | Trade review needs a hub to bridge education to Trader Intelligence. | Execution And Trade Review | 1 | not_started | Important product education bridge. |  |
| /learn/risk-discipline-path/ | Risk and psychology concepts need a coaching-style path. | Risk, Discipline, And Psychology | 1 | not_started | Good user retention path. |  |
| /learn/practice-and-improvement-path/ | Practice concepts need a sequence from paper trading to forward testing. | Practice And Improvement | 2 | not_started | Useful for safer learning. |  |

## Editor Verification Log

| Date | Article/Asset | Work Completed | Editor Verification Result | Commit SHA |
|---|---|---|---|---|
| 2026-05-17 | Tracker initialization | Created the editorial upgrade tracker. | Pending first content upgrade. |  |
| 2026-05-17 | /learn/support-and-resistance/ | Completed gold-standard Learn article upgrade and created four supporting realistic SVG assets. | Passed. The article teaches the concept clearly, follows the Chart Reading learning path, includes realistic examples and relevant SVGs, avoids buy/sell signals and guarantee language, includes common mistakes, review questions, checklist, and a soft Trader Intelligence bridge. | `7c46572524af559e42a53a34531272bd3154dd6f` |
| 2026-05-17 | /learn/how-to-draw-support-and-resistance/ | Completed second Chart Reading article upgrade and created three supporting realistic SVG assets. | Passed. The article now teaches a practical level-drawing workflow, adds zones-vs-lines coaching, obvious reaction selection, actionable level filtering, journal review prompts, and a soft Trader Intelligence bridge. Visuals support the exact lesson and avoid predictive or signal language. | `26daa98458b746ca447a59f593ee5eda6380cffe` |

## Next Recommended Action

Continue the Chart Reading And Market Structure track:

1. Fetch `/learn/support-levels/` draft.
2. Perform pre-editor review.
3. Upgrade it using the completed support/resistance and how-to-draw articles as the model.
4. Create 2 to 3 realistic SVGs focused on support holds, support breaks, and support reclaims.
5. Run editor verification.
6. Update this tracker.
7. Update the handoff.

## Important Reminder

This tracker is for educational learning journey work.

Do not treat this as only SEO production.

The purpose is to help an end user move through a clean learning flow from start to finish without being overwhelmed.
