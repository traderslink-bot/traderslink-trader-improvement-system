# Trader Intelligence SEO Master Content Plan

## Purpose

This document is the master SEO content plan for the Trader Intelligence side of TradersLink.

The goal is to build a large, organized SEO footprint before the public website is fully created. This plan is for content strategy and markdown draft production only. Codex or the website build system can later turn these markdown files into production pages.

This plan focuses only on Trader Intelligence, not the full TradersLink platform homepage, scanner pages, press release tools, Discord beta pages, or chart-following platform pages.

## Working Roles

### ChatGPT Role

ChatGPT is the SEO and content system.

Responsibilities:

- Build SEO content strategy.
- Create keyword clusters.
- Write markdown drafts with frontmatter.
- Maintain topical structure.
- Avoid unsupported product claims.
- Keep all pages aligned with Trader Intelligence positioning.
- Write clear, useful content for active traders.
- Produce markdown only unless explicitly asked otherwise.

### Codex Role

Codex is the coder and website builder.

Responsibilities:

- Build the website.
- Convert markdown content into production pages.
- Handle Next.js, routing, components, styling, schema rendering, and content ingestion.
- Keep the content-driven setup clean.
- Avoid changing SEO intent unless requested.

## Product Focus

Trader Intelligence is a coming trade review and trader improvement tool inside TradersLink.

It should be positioned as:

- A trading journal app.
- A day trading journal.
- A trade review tool.
- An execution analysis system.
- A trading mistake tracker.
- A trader improvement system.
- A performance insights tool.
- A broker execution import and review system.
- A support and resistance based trade review tool when market context is available.

It should not be positioned as:

- A stock alert service.
- A buy or sell signal tool.
- A trade-calling room.
- Financial advice.
- A guaranteed profit system.
- A fully automated trading system.
- A tool that tells traders what to buy.

## Core SEO Positioning

Trader Intelligence helps active traders review trades with more structure, context, and evidence.

The main SEO position:

> A smarter trading journal for active day traders who want to review executions, analyze entries and exits, track repeated mistakes, and understand trade management behavior.

Supporting positioning:

> Trader Intelligence goes beyond manual notes by turning broker executions and trade context into structured review data, helping traders study how they entered, managed, scaled, exited, and repeated behavior across trades.

## Audience

Primary audience:

- Active day traders.
- Small-cap traders.
- Penny stock traders.
- Low-float momentum traders.
- Traders who already take trades but struggle with review discipline.
- Traders who need more than basic P&L tracking.
- Traders who want structured review of entries, exits, adds, reductions, timing, and mistakes.

Secondary audience:

- Newer day traders learning how to journal.
- Traders comparing trading journal apps.
- Traders searching for a better trade review workflow.
- Traders who currently use spreadsheets and want more automation.

## Claims To Avoid

Avoid saying:

- Trader Intelligence gives buy and sell signals.
- Trader Intelligence guarantees better results.
- Trader Intelligence guarantees profitable trades.
- Trader Intelligence replaces trader judgment.
- Trader Intelligence provides financial advice.
- Trader Intelligence automatically knows every setup.
- Trader Intelligence calls live trades.
- Trader Intelligence is a human trading room.
- Trader Intelligence prevents losses.
- Trader Intelligence predicts the market.

Use careful wording:

- Helps review.
- Helps organize.
- Helps analyze.
- Helps identify patterns.
- Helps surface behavior.
- Helps traders study execution.
- Can support.
- Designed to.
- Coming soon.
- When data is available.
- Based on imported executions and available market context.

## Markdown Draft Rules

All pages should be written as markdown files with YAML frontmatter.

Do not write:

- JSX
- HTML
- CSS
- Next.js files
- React components

Codex will handle the website build.

## Standard Frontmatter Template

```yaml
---
title: ""
slug: ""
primary_keyword: ""
secondary_keywords: []
search_intent: ""
status: "draft"
product_area: "Trader Intelligence"
availability: "coming_soon"
content_type: ""
funnel_stage: ""
priority: ""
cta: "Join the TradersLink beta"
internal_links: []
schema:
  - "FAQPage"
last_reviewed: "2026-05-08"
meta_title: ""
meta_description: ""
---
```

## Content Types

Use these content_type values:

- product_page
- feature_page
- comparison_page
- blog_article
- guide
- glossary
- cluster_hub

## Funnel Stages

Use these funnel_stage values:

- awareness
- consideration
- conversion
- retention

## Main SEO Clusters

Trader Intelligence should be planned as a large SEO cluster, not a small starter set.

Primary clusters:

1. Trading journal app
2. Day trading journal
3. Trade review
4. Execution analysis
5. Trading mistake tracking
6. Broker execution import
7. Trade management review
8. Entry and exit analysis
9. Session timing analysis
10. Support and resistance trade review
11. Small-cap and penny stock journaling
12. Trader improvement and coaching
13. Trading psychology and behavior mistakes
14. Comparisons and alternatives
15. Glossary and beginner education

## Phase Overview

### Phase 1: Core Commercial Pages

Goal: build the main product and conversion pages.

Estimated pages: 10 to 12.

### Phase 2: Feature Support Pages

Goal: explain individual product capabilities and build long-tail SEO around specific trade review features.

Estimated pages: 15 to 25.

### Phase 3: Blog Education Cluster

Goal: answer common trading journal, trade review, and trader improvement searches.

Estimated articles: 30 to 50.

### Phase 4: Small-Cap Trade Review Cluster

Goal: own a niche around reviewing volatile small-cap and penny stock trades.

Estimated articles: 15 to 25.

### Phase 5: Comparison and Alternative Pages

Goal: capture commercial investigation searches.

Estimated pages: 10 to 20.

Total long-term target: 80 to 130 pages and articles.

## Phase 1: Core Commercial Pages

### 1. Trader Intelligence

Slug: `/trader-intelligence/`

Primary keyword: `trader intelligence`

Secondary keywords:

- trader improvement system
- trade review tool
- execution analysis tool
- trading journal app

Search intent: Learn what Trader Intelligence is and whether it fits the trader's review workflow.

Funnel stage: conversion

Page type: product_page

Purpose: Main overview page for the Trader Intelligence app.

Internal links:

- `/trading-journal-app/`
- `/day-trading-journal/`
- `/trade-review-app/`
- `/features/execution-analysis/`
- `/features/trading-mistake-tracker/`
- `/features/broker-execution-import/`

### 2. Trading Journal App

Slug: `/trading-journal-app/`

Primary keyword: `trading journal app`

Secondary keywords:

- day trading journal
- trade review tool
- execution analysis
- trading mistake tracker

Search intent: Find a trading journal or review tool for improving trade execution.

Funnel stage: conversion

Page type: product_page

Purpose: Main SEO money page for the broad trading journal app keyword.

### 3. Day Trading Journal

Slug: `/day-trading-journal/`

Primary keyword: `day trading journal`

Secondary keywords:

- trading journal for day traders
- day trader journal
- intraday trading journal
- trade review for day traders

Search intent: Find a journal specifically for active intraday traders.

Funnel stage: conversion

Page type: product_page

Purpose: Capture day trading journal intent separately from the broader trading journal app page.

### 4. Trade Review App

Slug: `/trade-review-app/`

Primary keyword: `trade review app`

Secondary keywords:

- trade review tool
- review trades
- analyze trades
- trading performance review

Search intent: Find a tool to review trades after execution.

Funnel stage: conversion

Page type: product_page

Purpose: Position Trader Intelligence as a review system, not just a note-taking journal.

### 5. Execution Analysis Tool

Slug: `/features/execution-analysis/`

Primary keyword: `trade execution analysis`

Secondary keywords:

- execution analysis tool
- analyze trade entries and exits
- trading execution review
- trading performance analysis

Search intent: Understand or find a tool for analyzing entries, exits, adds, reductions, and trade management.

Funnel stage: consideration

Page type: feature_page

Purpose: Explain execution analysis as a core feature.

### 6. Trading Mistake Tracker

Slug: `/features/trading-mistake-tracker/`

Primary keyword: `trading mistake tracker`

Secondary keywords:

- track trading mistakes
- trading mistakes journal
- trading behavior tracker
- repeated trading mistakes

Search intent: Find a way to track repeated trading mistakes and behavior patterns.

Funnel stage: consideration

Page type: feature_page

Purpose: Explain mistake tracking and repeated behavior detection.

### 7. Broker Execution Import

Slug: `/features/broker-execution-import/`

Primary keyword: `broker execution import`

Secondary keywords:

- import trades from broker
- broker CSV trading journal
- trading journal CSV import
- execution import trading journal

Search intent: Find a journal that can import broker executions or CSV files.

Funnel stage: consideration

Page type: feature_page

Purpose: Explain how imported executions improve review quality compared with manual journaling.

### 8. Support and Resistance Trade Review

Slug: `/features/support-resistance-trade-review/`

Primary keyword: `support and resistance trade review`

Secondary keywords:

- review trades with support and resistance
- trading journal support resistance
- bought near resistance
- sold near support

Search intent: Learn how to review trades around support and resistance levels.

Funnel stage: consideration

Page type: feature_page

Purpose: Explain how market context and generated levels can support review when available.

### 9. Session Time Analysis

Slug: `/features/session-time-analysis/`

Primary keyword: `session time analysis trading`

Secondary keywords:

- premarket trade review
- market open trade review
- hourly trading performance
- trading journal time of day

Search intent: Understand how trading performance changes by session or time of day.

Funnel stage: consideration

Page type: feature_page

Purpose: Explain review by premarket, open, midday, afternoon, after-hours, and overnight behavior.

### 10. Trade Management Feedback

Slug: `/features/trade-management-feedback/`

Primary keyword: `trade management feedback`

Secondary keywords:

- review trade management
- trade management mistakes
- scaling in and out trading
- profit protection review

Search intent: Find feedback on how trades were managed after entry.

Funnel stage: consideration

Page type: feature_page

Purpose: Explain review of holding behavior, scaling, reductions, adds, exits, and profit protection.

### 11. Performance Insights

Slug: `/features/performance-insights/`

Primary keyword: `trading performance insights`

Secondary keywords:

- trading performance analysis
- trading analytics
- trade review analytics
- trading journal performance metrics

Search intent: Find analytics that help traders understand performance beyond P&L.

Funnel stage: consideration

Page type: feature_page

Purpose: Explain performance breakdowns by behavior, session, trade type, and execution patterns.

### 12. Evidence-Backed Coaching

Slug: `/features/evidence-backed-coaching/`

Primary keyword: `trading coaching app`

Secondary keywords:

- evidence backed trading feedback
- trading improvement app
- trade review coaching
- trader behavior coaching

Search intent: Find a tool that gives feedback based on trade evidence.

Funnel stage: consideration

Page type: feature_page

Purpose: Explain coaching carefully as review feedback, not financial advice or trade instruction.

## Phase 2: Feature Support Pages

### Entry Review

Slug: `/features/entry-review/`

Primary keyword: `trade entry review`

Secondary keywords:

- analyze trading entries
- review stock entries
- bad trade entry
- late trade entry

Purpose: Review entry timing, extension, support/resistance context, and what happened after entry.

### Exit Review

Slug: `/features/exit-review/`

Primary keyword: `trade exit review`

Secondary keywords:

- analyze trading exits
- sold too early trading
- missed exit trading
- exit timing review

Purpose: Review exits, missed continuation, defensive exits, late exits, and exits into weakness.

### Scaling Analysis

Slug: `/features/scaling-analysis/`

Primary keyword: `scaling in and out trading`

Secondary keywords:

- scale in trading journal
- scale out trade review
- trading position sizing review
- partial exits trading

Purpose: Explain how adds, trims, reductions, and position changes can be reviewed.

### Average Down Tracking

Slug: `/features/average-down-tracking/`

Primary keyword: `average down trading mistake`

Secondary keywords:

- averaging down stocks
- average down journal
- adverse adds trading
- adding to losing trades

Purpose: Target a high-pain trading behavior and explain how review can surface it.

### Re-Entry Review

Slug: `/features/re-entry-review/`

Primary keyword: `trade re-entry review`

Secondary keywords:

- re-entering trades
- trading re-entry mistakes
- re-add after exit
- trade re-entry analysis

Purpose: Review whether re-entries improved or damaged trade outcomes.

### Profit Protection Review

Slug: `/features/profit-protection-review/`

Primary keyword: `profit protection trading`

Secondary keywords:

- gave back profits trading
- protect trading profits
- trading journal profit giveback
- trade management review

Purpose: Review whether traders protected gains or gave back open profit.

### Holding Behavior Review

Slug: `/features/holding-behavior-review/`

Primary keyword: `holding losers too long`

Secondary keywords:

- holding winners too short
- trade holding behavior
- holding behavior trading journal
- trade duration analysis

Purpose: Review whether holding time helped or hurt the trade.

### Open Position Review

Slug: `/features/open-position-review/`

Primary keyword: `open position review`

Secondary keywords:

- open trades trading journal
- review open trades
- position review trading
- trade risk review

Purpose: Explain review for active or unresolved positions when supported.

### Trade Timing Review

Slug: `/features/trade-timing-review/`

Primary keyword: `trade timing review`

Secondary keywords:

- timing trades
- entry timing analysis
- exit timing analysis
- trading journal timing

Purpose: Broader feature page around timing quality.

### Risk Behavior Review

Slug: `/features/risk-behavior-review/`

Primary keyword: `trading risk behavior`

Secondary keywords:

- risk management journal
- trading risk review
- position risk analysis
- risk behavior trading

Purpose: Explain review of risk decisions and repeated risk patterns.

### Trade Outcome Analysis

Slug: `/features/trade-outcome-analysis/`

Primary keyword: `trade outcome analysis`

Secondary keywords:

- post trade analysis
- trading outcome review
- outcome based trading review
- trade result analysis

Purpose: Explain outcome-based validation, not judging a trade only by P&L.

### Pattern Detection

Slug: `/features/pattern-detection/`

Primary keyword: `trading pattern detection`

Secondary keywords:

- trader behavior patterns
- repeated trading patterns
- trading journal patterns
- trade review patterns

Purpose: Explain repeated behavior patterns carefully without overclaiming setup detection.

### Review Queue

Slug: `/features/trade-review-queue/`

Primary keyword: `trade review queue`

Secondary keywords:

- saved trade reviews
- trading journal workflow
- trade review workflow
- review trades later

Purpose: Explain saved reviews and organized review workflow.

### Rule Candidate Tracking

Slug: `/features/rule-candidate-tracking/`

Primary keyword: `trading rules journal`

Secondary keywords:

- trading rule tracker
- trading rule candidates
- build trading rules
- review trading rules

Purpose: Explain turning repeated issues into possible personal rules.

### Trade Notes With Evidence

Slug: `/features/evidence-backed-trade-notes/`

Primary keyword: `trade notes`

Secondary keywords:

- trading journal notes
- evidence backed trade notes
- execution notes trading
- trade review notes

Purpose: Explain notes supported by execution and market context.

## Phase 3: Blog Education Cluster

### How To Review Your Trades

Slug: `/blog/how-to-review-your-trades/`

Primary keyword: `how to review your trades`

Secondary keywords:

- trade review process
- post trade review
- how to analyze trades
- trading journal review

Purpose: Foundational educational post that links to trading journal app, trade review, and execution analysis pages.

### Trading Journal For Day Traders

Slug: `/blog/trading-journal-for-day-traders/`

Primary keyword: `trading journal for day traders`

Secondary keywords:

- day trading journal
- day trader journal
- intraday trading journal
- trading journal app

Purpose: Educational post for day traders comparing what a journal should track.

### How To Analyze Trade Entries And Exits

Slug: `/blog/how-to-analyze-trade-entries-and-exits/`

Primary keyword: `how to analyze trade entries and exits`

Secondary keywords:

- entry and exit analysis
- trade execution analysis
- review entries and exits
- trading execution review

Purpose: Support execution analysis and entry/exit feature pages.

### How To Track Trading Mistakes

Slug: `/blog/how-to-track-trading-mistakes/`

Primary keyword: `how to track trading mistakes`

Secondary keywords:

- trading mistakes journal
- track trading errors
- repeated trading mistakes
- trading mistake tracker

Purpose: Support the mistake tracker feature page.

### Why P&L Alone Is Not Enough

Slug: `/blog/why-p-and-l-alone-is-not-enough/`

Primary keyword: `p&l trading journal`

Secondary keywords:

- trading journal beyond profit and loss
- review trades beyond P&L
- execution quality vs P&L
- trading performance review

Purpose: Explain the philosophy behind Trader Intelligence.

### How To Review Trade Management

Slug: `/blog/how-to-review-trade-management/`

Primary keyword: `how to review trade management`

Secondary keywords:

- trade management review
- trade management mistakes
- scaling in and out review
- profit protection trading

Purpose: Support trade management feedback page.

### Broker Execution Import Vs Manual Journaling

Slug: `/blog/broker-execution-import-vs-manual-journaling/`

Primary keyword: `broker execution import vs manual journaling`

Secondary keywords:

- broker CSV trading journal
- manual trading journal
- execution import trading journal
- trading journal CSV import

Purpose: Support broker execution import feature page.

### How To Use Support And Resistance In Trade Review

Slug: `/blog/how-to-use-support-and-resistance-in-trade-review/`

Primary keyword: `how to use support and resistance in trade review`

Secondary keywords:

- support and resistance trade review
- review trades around levels
- bought near resistance
- sold near support

Purpose: Support support/resistance review feature page.

### Premarket Vs Market Open Trade Review

Slug: `/blog/premarket-vs-market-open-trade-review/`

Primary keyword: `premarket vs market open trading`

Secondary keywords:

- premarket trade review
- market open trading review
- session time analysis trading
- trading journal time of day

Purpose: Support session time analysis.

### What To Include In A Trading Journal

Slug: `/blog/what-to-include-in-a-trading-journal/`

Primary keyword: `what to include in a trading journal`

Secondary keywords:

- trading journal fields
- day trading journal template
- trading journal checklist
- trade review notes

Purpose: Awareness post for people starting a trading journal.

### How To Keep A Trading Journal

Slug: `/blog/how-to-keep-a-trading-journal/`

Primary keyword: `how to keep a trading journal`

Secondary keywords:

- trading journal process
- trade journaling
- day trading journal
- trading journal app

Purpose: Beginner guide with soft product tie-in.

### Trading Journal Template For Day Traders

Slug: `/blog/trading-journal-template-for-day-traders/`

Primary keyword: `trading journal template for day traders`

Secondary keywords:

- day trading journal template
- trade review template
- trading journal spreadsheet
- trading journal fields

Purpose: Capture template searches and explain limitations of templates.

### How To Improve Trade Execution

Slug: `/blog/how-to-improve-trade-execution/`

Primary keyword: `how to improve trade execution`

Secondary keywords:

- improve trading execution
- trade execution analysis
- review trade execution
- trading mistakes

Purpose: Support execution analysis and trade review pages.

### How To Analyze A Losing Trade

Slug: `/blog/how-to-analyze-a-losing-trade/`

Primary keyword: `how to analyze a losing trade`

Secondary keywords:

- review losing trades
- trading loss review
- losing trade journal
- trade review process

Purpose: Help traders separate bad outcome from bad process.

### How To Analyze A Winning Trade

Slug: `/blog/how-to-analyze-a-winning-trade/`

Primary keyword: `how to analyze a winning trade`

Secondary keywords:

- review winning trades
- trading win review
- did I trade well
- trading journal review

Purpose: Explain why winning trades still need review.

### How To Build A Trade Review Routine

Slug: `/blog/trade-review-routine/`

Primary keyword: `trade review routine`

Secondary keywords:

- post trade review routine
- trading journal routine
- weekly trade review
- day trading review process

Purpose: Support repeat use and workflow content.

### Daily Trade Review Checklist

Slug: `/blog/daily-trade-review-checklist/`

Primary keyword: `daily trade review checklist`

Secondary keywords:

- trading journal checklist
- day trading checklist
- post trade checklist
- trade review checklist

Purpose: Checklist style blog post for practical SEO.

### Weekly Trading Review Process

Slug: `/blog/weekly-trading-review-process/`

Primary keyword: `weekly trading review`

Secondary keywords:

- weekly trade review
- trading performance review
- trading journal weekly review
- trader improvement process

Purpose: Build recurring review workflow content.

### Trading Journal Metrics That Matter

Slug: `/blog/trading-journal-metrics-that-matter/`

Primary keyword: `trading journal metrics`

Secondary keywords:

- trading performance metrics
- trading journal statistics
- trading analytics
- trade review metrics

Purpose: Explain metrics beyond win rate and P&L.

### Execution Quality Vs Profit And Loss

Slug: `/blog/execution-quality-vs-profit-and-loss/`

Primary keyword: `execution quality vs profit and loss`

Secondary keywords:

- execution quality trading
- P&L trading journal
- trade review analysis
- trading performance review

Purpose: Reinforce core philosophy.

## Phase 4: Small-Cap And Penny Stock Review Cluster

### Penny Stock Trading Journal

Slug: `/blog/penny-stock-trading-journal/`

Primary keyword: `penny stock trading journal`

Secondary keywords:

- small cap trading journal
- low float trading journal
- penny stock trade review
- day trading journal

Purpose: Target the niche audience most aligned with TradersLink.

### Small-Cap Trading Journal

Slug: `/blog/small-cap-trading-journal/`

Primary keyword: `small cap trading journal`

Secondary keywords:

- small cap trade review
- trading journal for small cap stocks
- low float trading journal
- volatile stock trade review

Purpose: Broader version of penny stock journaling.

### How To Review Low Float Stock Trades

Slug: `/blog/how-to-review-low-float-stock-trades/`

Primary keyword: `how to review low float stock trades`

Secondary keywords:

- low float stock trading
- low float trade review
- penny stock journal
- volatile stock trading review

Purpose: Niche educational article.

### How To Journal Small-Cap Momentum Trades

Slug: `/blog/how-to-journal-small-cap-momentum-trades/`

Primary keyword: `small cap momentum trading journal`

Secondary keywords:

- momentum trade review
- small cap momentum trades
- day trading journal
- trade management review

Purpose: Target active momentum traders.

### How To Review Trades After A Press Release

Slug: `/blog/how-to-review-trades-after-a-press-release/`

Primary keyword: `review trades after press release`

Secondary keywords:

- news trading journal
- press release trading review
- small cap press release trading
- catalyst trade review

Purpose: Connect journal content to news-driven small-cap behavior.

### How To Review Trades Around High Volume Spikes

Slug: `/blog/review-trades-around-volume-spikes/`

Primary keyword: `review trades around volume spikes`

Secondary keywords:

- high volume stock trade review
- volume spike trading
- small cap volume review
- momentum trade review

Purpose: Target volatile intraday behavior.

### How To Review Premarket Small-Cap Trades

Slug: `/blog/review-premarket-small-cap-trades/`

Primary keyword: `premarket small cap trading review`

Secondary keywords:

- premarket trade review
- small cap premarket trading
- premarket trading journal
- day trading review

Purpose: Support session analysis and small-cap niche content.

### Float And Volume In Trade Review

Slug: `/blog/float-and-volume-in-trade-review/`

Primary keyword: `float and volume trade review`

Secondary keywords:

- low float stock volume
- float trading journal
- volume trading journal
- small cap trade review

Purpose: Explain why market context matters when reviewing trades.

### How To Review Failed Breakout Trades

Slug: `/blog/how-to-review-failed-breakout-trades/`

Primary keyword: `failed breakout trade review`

Secondary keywords:

- failed breakout trading
- breakout chase mistake
- trade review breakout
- trading journal breakout trades

Purpose: Capture common small-cap mistake intent.

### How To Review Gap Up Trades

Slug: `/blog/how-to-review-gap-up-trades/`

Primary keyword: `gap up trade review`

Secondary keywords:

- gap up trading journal
- review gap trades
- small cap gap up trading
- premarket gap trade review

Purpose: Support premarket/open trade content.

### How To Review Halted Stock Trades

Slug: `/blog/how-to-review-halted-stock-trades/`

Primary keyword: `halted stock trade review`

Secondary keywords:

- stock halt trading journal
- review halt trades
- small cap halt trading
- volatile stock review

Purpose: Small-cap specific behavior and risk review.

### How To Review Dilution Risk Trades

Slug: `/blog/how-to-review-dilution-risk-trades/`

Primary keyword: `dilution risk trade review`

Secondary keywords:

- offering risk trading
- small cap dilution risk
- penny stock offering risk
- review trades after offering

Purpose: Niche article for small-cap traders without making specific trading advice claims.

## Phase 5: Mistake And Behavior Cluster

### How To Stop Chasing Stocks

Slug: `/blog/how-to-stop-chasing-stocks/`

Primary keyword: `how to stop chasing stocks`

Secondary keywords:

- chasing stocks
- trading FOMO
- chasing breakouts
- trading mistake tracker

Purpose: High-pain behavior article linking to mistake tracker and execution analysis.

### How To Stop Averaging Down Bad Trades

Slug: `/blog/how-to-stop-averaging-down-bad-trades/`

Primary keyword: `how to stop averaging down`

Secondary keywords:

- averaging down mistake
- adding to losing trades
- adverse adds trading
- trading mistake tracker

Purpose: Support average down tracking.

### How To Stop Cutting Winners Too Early

Slug: `/blog/how-to-stop-cutting-winners-too-early/`

Primary keyword: `cutting winners too early`

Secondary keywords:

- selling winners too soon
- trading profit taking mistakes
- trade exit review
- profit protection review

Purpose: Support exit review and profit protection content.

### How To Stop Holding Losers Too Long

Slug: `/blog/how-to-stop-holding-losers-too-long/`

Primary keyword: `holding losers too long`

Secondary keywords:

- holding losing trades
- trading loss mistake
- trade exit review
- risk behavior review

Purpose: Support holding behavior and risk behavior review.

### How To Stop Revenge Trading

Slug: `/blog/how-to-stop-revenge-trading/`

Primary keyword: `how to stop revenge trading`

Secondary keywords:

- revenge trading
- trading psychology mistakes
- trading mistake tracker
- trader improvement

Purpose: Awareness post for trading psychology search intent.

### How To Stop Overtrading

Slug: `/blog/how-to-stop-overtrading/`

Primary keyword: `how to stop overtrading`

Secondary keywords:

- overtrading
- trading too much
- trading journal mistakes
- trader behavior tracker

Purpose: Support behavior tracking and session review.

### How To Review Missed Exits

Slug: `/blog/how-to-review-missed-exits/`

Primary keyword: `missed exit trading`

Secondary keywords:

- bad exits trading
- exit review trading
- sold too late trading
- trade management review

Purpose: Support exit review.

### How To Review Bad Entries

Slug: `/blog/how-to-review-bad-entries/`

Primary keyword: `bad trade entry`

Secondary keywords:

- bad entries trading
- entry review trading
- bought too high trading
- chasing stocks

Purpose: Support entry review and chasing article.

### How To Know If You Sold Too Early

Slug: `/blog/how-to-know-if-you-sold-too-early/`

Primary keyword: `sold too early trading`

Secondary keywords:

- selling too early stocks
- exit review trading
- missed continuation trading
- trade review

Purpose: Exit behavior article.

### How To Know If You Entered Too Late

Slug: `/blog/how-to-know-if-you-entered-too-late/`

Primary keyword: `entered too late trading`

Secondary keywords:

- late entry trading
- chasing stocks
- entry timing review
- trade execution analysis

Purpose: Entry behavior article.

### Why Traders Repeat The Same Mistakes

Slug: `/blog/why-traders-repeat-the-same-mistakes/`

Primary keyword: `repeated trading mistakes`

Secondary keywords:

- trading behavior patterns
- trading mistake tracker
- trading journal mistakes
- trader improvement

Purpose: Support mistake tracker and behavior pattern pages.

### How To Turn Trading Mistakes Into Rules

Slug: `/blog/turn-trading-mistakes-into-rules/`

Primary keyword: `trading rules from mistakes`

Secondary keywords:

- trading rule tracker
- trading mistake journal
- trading improvement system
- trading journal rules

Purpose: Support rule candidate tracking.

## Phase 6: Comparison And Alternatives Cluster

### Trading Journal App Vs Spreadsheet

Slug: `/blog/trading-journal-app-vs-spreadsheet/`

Primary keyword: `trading journal app vs spreadsheet`

Secondary keywords:

- trading journal spreadsheet
- trading journal app
- trading journal software
- broker execution import

Purpose: Commercial comparison article.

### Manual Trading Journal Vs Execution Import

Slug: `/blog/manual-trading-journal-vs-execution-import/`

Primary keyword: `manual trading journal vs execution import`

Secondary keywords:

- broker execution import
- trading journal CSV import
- manual trade journal
- execution analysis

Purpose: Support broker execution import.

### Trade Review App Vs Trading Journal

Slug: `/blog/trade-review-app-vs-trading-journal/`

Primary keyword: `trade review app vs trading journal`

Secondary keywords:

- trade review app
- trading journal app
- trade analysis software
- trading performance review

Purpose: Explain why Trader Intelligence is more than notes.

### Best Trading Journal Features For Day Traders

Slug: `/blog/best-trading-journal-features-for-day-traders/`

Primary keyword: `best trading journal features for day traders`

Secondary keywords:

- trading journal features
- day trading journal app
- execution analysis
- trading mistake tracker

Purpose: Commercial investigation post.

### What Makes A Good Trading Journal App

Slug: `/blog/what-makes-a-good-trading-journal-app/`

Primary keyword: `good trading journal app`

Secondary keywords:

- trading journal app features
- trade review tool
- day trading journal
- trading analytics

Purpose: Consideration stage post.

### Why Execution Data Matters In A Trading Journal

Slug: `/blog/why-execution-data-matters-in-a-trading-journal/`

Primary keyword: `execution data trading journal`

Secondary keywords:

- broker executions
- trade execution analysis
- trading journal import
- trade review app

Purpose: Support execution import and execution analysis.

### Trading Journal Software For Active Traders

Slug: `/blog/trading-journal-software-for-active-traders/`

Primary keyword: `trading journal software for active traders`

Secondary keywords:

- active trader journal
- day trading journal app
- trade review software
- execution analysis tool

Purpose: Commercial SEO page.

### Trading Journal For Small Accounts

Slug: `/blog/trading-journal-for-small-accounts/`

Primary keyword: `trading journal for small accounts`

Secondary keywords:

- small account trading journal
- day trading journal
- trading mistake tracker
- risk management journal

Purpose: Awareness and consideration content for newer traders.

### Free Trading Journal Vs Paid Trading Journal

Slug: `/blog/free-trading-journal-vs-paid-trading-journal/`

Primary keyword: `free trading journal vs paid trading journal`

Secondary keywords:

- free trading journal
- paid trading journal app
- trading journal software
- trading journal features

Purpose: Commercial comparison content.

### Trading Journal App For Penny Stocks

Slug: `/blog/trading-journal-app-for-penny-stocks/`

Primary keyword: `trading journal app for penny stocks`

Secondary keywords:

- penny stock trading journal
- small cap trading journal
- low float trading journal
- day trading journal

Purpose: Commercial niche article.

## Phase 7: Glossary And Beginner Education

### Trading Journal

Slug: `/learn/trading-journal/`

Primary keyword: `trading journal`

Secondary keywords:

- what is a trading journal
- trading journal meaning
- trade journal
- day trading journal

Purpose: Glossary and beginner SEO.

### Trade Review

Slug: `/learn/trade-review/`

Primary keyword: `trade review`

Secondary keywords:

- what is trade review
- review trades
- post trade review
- trading review

Purpose: Define trade review and link to product pages.

### Execution Analysis

Slug: `/learn/execution-analysis/`

Primary keyword: `execution analysis trading`

Secondary keywords:

- trade execution analysis
- trading execution
- analyze entries and exits
- execution quality trading

Purpose: Define execution analysis.

### Risk Management Journal

Slug: `/learn/risk-management-journal/`

Primary keyword: `risk management journal trading`

Secondary keywords:

- trading risk journal
- risk management trading
- trading mistake tracker
- trade review

Purpose: Educational support content.

### Average Down

Slug: `/learn/average-down/`

Primary keyword: `average down trading`

Secondary keywords:

- averaging down stocks
- average down mistake
- adding to losing trades
- trading journal

Purpose: Define average down behavior and link to mistake tracking.

### Scaling In And Out

Slug: `/learn/scaling-in-and-out-trading/`

Primary keyword: `scaling in and out trading`

Secondary keywords:

- scaling into trades
- scaling out trades
- partial exits trading
- trade management

Purpose: Define scaling and link to scaling analysis.

### Profit Giveback

Slug: `/learn/profit-giveback/`

Primary keyword: `profit giveback trading`

Secondary keywords:

- gave back profits trading
- profit protection
- trade management review
- exit review

Purpose: Define profit giveback behavior.

### Chasing Stocks

Slug: `/learn/chasing-stocks/`

Primary keyword: `chasing stocks`

Secondary keywords:

- chasing breakouts
- trading FOMO
- late entry trading
- trade entry mistakes

Purpose: Define chasing and link to mistake content.

## Internal Linking Strategy

### Main Product Hub

`/trader-intelligence/` should link to:

- `/trading-journal-app/`
- `/day-trading-journal/`
- `/trade-review-app/`
- `/features/execution-analysis/`
- `/features/trading-mistake-tracker/`
- `/features/broker-execution-import/`
- `/features/session-time-analysis/`
- `/features/support-resistance-trade-review/`
- `/features/trade-management-feedback/`
- `/features/performance-insights/`

### Trading Journal App Page

`/trading-journal-app/` should link to:

- `/day-trading-journal/`
- `/trade-review-app/`
- `/features/execution-analysis/`
- `/features/broker-execution-import/`
- `/features/trading-mistake-tracker/`
- `/blog/what-to-include-in-a-trading-journal/`
- `/blog/trading-journal-app-vs-spreadsheet/`

### Execution Analysis Page

`/features/execution-analysis/` should link to:

- `/features/entry-review/`
- `/features/exit-review/`
- `/features/scaling-analysis/`
- `/features/trade-management-feedback/`
- `/blog/how-to-analyze-trade-entries-and-exits/`
- `/blog/how-to-improve-trade-execution/`

### Trading Mistake Tracker Page

`/features/trading-mistake-tracker/` should link to:

- `/features/average-down-tracking/`
- `/features/risk-behavior-review/`
- `/blog/how-to-track-trading-mistakes/`
- `/blog/how-to-stop-chasing-stocks/`
- `/blog/how-to-stop-averaging-down-bad-trades/`
- `/blog/why-traders-repeat-the-same-mistakes/`

### Support And Resistance Review Page

`/features/support-resistance-trade-review/` should link to:

- `/blog/how-to-use-support-and-resistance-in-trade-review/`
- `/blog/how-to-review-failed-breakout-trades/`
- `/blog/how-to-know-if-you-entered-too-late/`
- `/features/entry-review/`
- `/features/exit-review/`

### Blog Articles

Every blog article should link to at least two relevant product or feature pages.

Common product links:

- `/trading-journal-app/`
- `/trade-review-app/`
- `/features/execution-analysis/`
- `/features/trading-mistake-tracker/`
- `/features/broker-execution-import/`
- `/features/trade-management-feedback/`

## Suggested Draft Storage Structure

```text
docs/content/
  trader-intelligence-seo-master-plan.md
  drafts/
    trader-intelligence.md
    trading-journal-app.md
    day-trading-journal.md
    trade-review-app.md
    execution-analysis.md
    trading-mistake-tracker.md
    broker-execution-import.md
    support-resistance-trade-review.md
    session-time-analysis.md
    trade-management-feedback.md
    performance-insights.md
    evidence-backed-coaching.md
  drafts/blog/
    how-to-review-your-trades.md
    trading-journal-for-day-traders.md
    how-to-analyze-trade-entries-and-exits.md
    how-to-track-trading-mistakes.md
    why-p-and-l-alone-is-not-enough.md
    how-to-review-trade-management.md
```

## Page Draft Structure

Each product or feature page should use this general structure:

```markdown
# H1

Short intro that targets the primary keyword naturally.

## What This Page Covers

Briefly define the problem and product promise.

## What Trader Intelligence Does

Explain the feature or product clearly.

## Why This Matters For Active Traders

Explain the pain point and value.

## How The Review Works

Plain-language description of inputs and outputs.

## Key Features

Bulleted feature list.

## What This Is Not

Guardrail section to avoid financial advice and signal claims.

## Related Trader Intelligence Features

Internal links.

## FAQ

SEO-focused FAQ.

## Call To Action

Careful beta or coming-soon CTA.
```

## Blog Draft Structure

Each blog article should use this general structure:

```markdown
# H1

Intro that answers the search intent quickly.

## Direct Answer

Give the user the practical answer early.

## Why This Matters

Explain the trading review problem.

## Step-By-Step Review Process

Actionable guidance.

## Common Mistakes

List the mistakes related to the topic.

## How A Trading Journal Helps

Natural connection to Trader Intelligence.

## FAQ

Search-focused FAQ.

## Conclusion

Simple summary and CTA.
```

## FAQ Topics To Reuse

Use only when relevant:

- What is Trader Intelligence?
- Is Trader Intelligence live yet?
- Is Trader Intelligence a trading journal?
- How is Trader Intelligence different from a normal trading journal?
- Does Trader Intelligence provide financial advice?
- Does Trader Intelligence give buy or sell signals?
- Can I import broker executions?
- What is execution analysis?
- What is trade review?
- What is a trading mistake tracker?
- Why is P&L alone not enough?
- How can support and resistance help trade review?
- What kind of traders is Trader Intelligence built for?
- Is Trader Intelligence useful for small-cap traders?
- Can Trader Intelligence help me review premarket trades?

## Schema Suggestions

Use only when the page content supports it.

Product and feature pages:

- `SoftwareApplication`
- `FAQPage`

Blog articles:

- `BlogPosting`
- `FAQPage`

Glossary pages:

- `Article`
- `FAQPage`

Do not use review or rating schema unless real reviews exist.

## Priority Production Order

### Priority 1

1. `/trading-journal-app/`
2. `/trader-intelligence/`
3. `/trade-review-app/`
4. `/features/execution-analysis/`
5. `/features/trading-mistake-tracker/`
6. `/features/broker-execution-import/`
7. `/features/trade-management-feedback/`
8. `/features/support-resistance-trade-review/`

### Priority 2

1. `/day-trading-journal/`
2. `/features/session-time-analysis/`
3. `/features/entry-review/`
4. `/features/exit-review/`
5. `/features/scaling-analysis/`
6. `/features/average-down-tracking/`
7. `/features/profit-protection-review/`
8. `/features/performance-insights/`

### Priority 3

1. `/blog/how-to-review-your-trades/`
2. `/blog/trading-journal-for-day-traders/`
3. `/blog/how-to-analyze-trade-entries-and-exits/`
4. `/blog/how-to-track-trading-mistakes/`
5. `/blog/why-p-and-l-alone-is-not-enough/`
6. `/blog/how-to-review-trade-management/`
7. `/blog/broker-execution-import-vs-manual-journaling/`
8. `/blog/how-to-use-support-and-resistance-in-trade-review/`

### Priority 4

1. Small-cap and penny stock cluster.
2. Trading behavior mistake cluster.
3. Comparison cluster.
4. Glossary cluster.

## First Draft Batch Recommendation

The first writing batch should include:

1. `/trading-journal-app/`
2. `/trader-intelligence/`
3. `/trade-review-app/`
4. `/features/execution-analysis/`

The second writing batch should include:

1. `/features/trading-mistake-tracker/`
2. `/features/broker-execution-import/`
3. `/features/trade-management-feedback/`
4. `/features/support-resistance-trade-review/`

The third writing batch should include:

1. `/blog/how-to-review-your-trades/`
2. `/blog/trading-journal-for-day-traders/`
3. `/blog/how-to-analyze-trade-entries-and-exits/`
4. `/blog/how-to-track-trading-mistakes/`

## Final Editorial Rules

Keep the writing:

- Plain.
- Direct.
- Useful.
- SEO-focused.
- Honest about coming-soon status.
- Focused on trader review and improvement.
- Free of profit promises.
- Free of trade-call language.
- Free of financial-advice claims.

Do not over-hype the product.

The best content angle is:

> Trader Intelligence helps traders review how they actually traded, not just whether the trade made or lost money.
