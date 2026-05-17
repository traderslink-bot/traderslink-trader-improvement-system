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

Use only these statuses:

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

Use only these decision values:

```text
no_change_needed
light_upgrade
full_upgrade
gap_article_needed
visual_only_upgrade
metadata_only_upgrade
```

## Content Levels

Use these conceptual content levels:

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
| Editorial upgrade tracker | in_progress | This file starts the tracking system. |
| Image asset manifest | not_started | Create when first SVG batch is created. |
| Gold standard article upgrade | not_started | Recommended first model article: `/learn/support-and-resistance/`. |
| Learn hub website build | not_started | Codex should not build until explicitly requested. |

## Track Upgrade Order

| Order | Learning Track | Status | Priority | Notes |
|---:|---|---|---:|---|
| 1 | Start Here For New Traders | not_started | 1 | Foundation path for new users. |
| 2 | Chart Reading And Market Structure | not_started | 1 | Recommended first full upgrade track. |
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

## Gold Standard Article Candidate

Recommended first article to upgrade:

```text
/learn/support-and-resistance/
```

Reason:

- Beginner-friendly.
- Central to chart reading.
- Supports multiple realistic SVGs.
- Connects naturally to breakouts, fakeouts, reclaims, risk, and trade review.
- Can become the template for future Learn upgrades.

Alternative:

```text
/learn/sec-filings/
```

Reason:

- Strong small-cap educational value.
- Differentiates TradersLink.
- Supports flowcharts and risk education.
- Connects to catalysts, offerings, dilution, and filing review.

## Article Upgrade Tracker Table

Use this table for individual content pieces as they are reviewed and upgraded.

| Article/Slug | Draft Path | Primary Track | Secondary Tracks | Level | Status | Upgrade Decision | Visuals Needed | Gap Article? | Priority | Editor Notes | Last Commit |
|---|---|---|---|---|---|---|---|---|---:|---|---|
| /learn/support-and-resistance/ | docs/content/drafts/learn/support-and-resistance.md | Chart Reading And Market Structure | Start Here For New Traders, Execution And Trade Review | Foundation | not_started | full_upgrade | 3 to 4 realistic SVG chart diagrams | No | 1 | Recommended gold-standard article. Add realistic candle examples, common mistakes, journal review prompts, previous/next path, and Trader Intelligence bridge. |  |
| /learn/how-to-draw-support-and-resistance/ | docs/content/drafts/learn/how-to-draw-support-and-resistance.md | Chart Reading And Market Structure | Start Here For New Traders | Practical | not_started | full_upgrade | 3 realistic SVG chart diagrams | No | 1 | Should teach zones vs exact lines, good and bad examples, and common beginner mistakes. |  |
| /learn/sec-filings/ | docs/content/drafts/learn/sec-filings.md | News, Catalysts, Filings, And Dilution | Small-Cap, Float, And Short Squeeze Context | Foundation | not_started | full_upgrade | 2 to 3 filing flow diagrams | No | 1 | Alternative gold-standard article. Needs beginner path, filing map, risk warnings, and links to dilution/offering concepts. |  |
| /learn/start-here/ | docs/content/drafts/learn/start-here.md | Start Here For New Traders | All Tracks | Foundation | not_started | gap_article_needed | 1 journey map SVG | Yes | 1 | Gap article likely needed to introduce the learning system and guide new users. |  |
| /learn/how-to-use-traderslink-learn/ | docs/content/drafts/learn/how-to-use-traderslink-learn.md | Start Here For New Traders | All Tracks | Foundation | not_started | gap_article_needed | 1 navigation diagram | Yes | 1 | Gap article likely needed to teach users how to move through learning paths. |  |
| /learn/chart-reading-path/ | docs/content/drafts/learn/chart-reading-path.md | Chart Reading And Market Structure | Candlestick Patterns In Context, Volume Liquidity And Order Flow | Foundation | not_started | gap_article_needed | 1 path diagram | Yes | 2 | Hub/guide article for chart reading learning path. |  |
| /learn/news-and-filings-path/ | docs/content/drafts/learn/news-and-filings-path.md | News, Catalysts, Filings, And Dilution | Small-Cap, Float, And Short Squeeze Context | Foundation | not_started | gap_article_needed | 1 filing/catalyst path diagram | Yes | 1 | Hub/guide article for small-cap news, filings, dilution path. |  |
| /learn/trade-review-path/ | docs/content/drafts/learn/trade-review-path.md | Execution And Trade Review | Practice And Improvement | Foundation | not_started | gap_article_needed | 1 review workflow SVG | Yes | 1 | Hub/guide article for trade review and Trader Intelligence bridge. |  |
| /learn/risk-discipline-path/ | docs/content/drafts/learn/risk-discipline-path.md | Risk, Discipline, And Psychology | Start Here For New Traders | Foundation | not_started | gap_article_needed | 1 psychology/risk loop SVG | Yes | 1 | Hub/guide article for risk, discipline, and behavior. |  |
| /learn/practice-and-improvement-path/ | docs/content/drafts/learn/practice-and-improvement-path.md | Practice And Improvement | Execution And Trade Review | Foundation | not_started | gap_article_needed | 1 practice ladder SVG | Yes | 2 | Hub/guide article for paper trading, replay, backtesting, forward testing. |  |

## Visual Asset Tracker Table

Use this section until `docs/content/learn-image-asset-manifest.md` exists.

| Asset File | Related Article/Slug | Learning Track | Visual Type | Purpose | Suggested Placement | Alt Text | Status | Editor Verification | Commit SHA |
|---|---|---|---|---|---|---|---|---|---|
| public/images/learn/chart-reading/support-resistance-candlestick-diagram.svg | /learn/support-and-resistance/ | Chart Reading And Market Structure | realistic candlestick chart | Show price moving between support and resistance zones. | Intro visual | Candlestick chart showing price bouncing near support and rejecting near resistance. | not_started | Not reviewed yet. |  |
| public/images/learn/chart-reading/support-breaks-becomes-resistance.svg | /learn/support-and-resistance/ | Chart Reading And Market Structure | realistic candlestick chart | Show support breaking and later acting as resistance. | Body section | Candlestick chart showing broken support later acting as resistance. | not_started | Not reviewed yet. |  |
| public/images/learn/chart-reading/resistance-breaks-becomes-support.svg | /learn/support-and-resistance/ | Chart Reading And Market Structure | realistic candlestick chart | Show resistance breaking and later acting as support. | Body section | Candlestick chart showing broken resistance later acting as support. | not_started | Not reviewed yet. |  |
| public/images/learn/chart-reading/bad-support-resistance-example.svg | /learn/support-and-resistance/ | Chart Reading And Market Structure | realistic candlestick chart | Show common bad level drawing mistakes. | Common mistakes section | Chart diagram showing support and resistance levels drawn too randomly or too precisely. | not_started | Not reviewed yet. |  |

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

Add a new row after each completed upgrade.

| Date | Article/Asset | Work Completed | Editor Verification Result | Commit SHA |
|---|---|---|---|---|
| 2026-05-17 | Tracker initialization | Created the editorial upgrade tracker. | Pending first content upgrade. |  |

## Next Recommended Action

Start the gold-standard upgrade workflow:

1. Fetch `/learn/support-and-resistance/` draft.
2. Perform pre-editor review.
3. Decide exact upgrades.
4. Create the needed SVG assets or references.
5. Upgrade the article.
6. Run editor verification.
7. Update this tracker.
8. Update the handoff.

## Important Reminder

This tracker is for educational learning journey work.

Do not treat this as only SEO production.

The purpose is to help an end user move through a clean learning flow from start to finish without being overwhelmed.
