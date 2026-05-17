# TradersLink Learn Learning Journey Implementation Plan

## Purpose

This document turns the TradersLink `/learn/` content library into a structured educational journey for real users.

This is **not** another SEO writing queue and it is **not** a production website implementation file. It is a Codex-ready planning document that explains how the existing and planned Learn content should be organized into guided learning paths on the website.

The goal is to prevent users from seeing a massive list of disconnected articles. Instead, the Learn section should feel like a guided education system where a trader can choose a starting point, follow a logical sequence, and understand what to read next.

## Scope

This plan is for:

- Learn hub strategy.
- Learning journey structure.
- Article grouping.
- Suggested navigation.
- Suggested lesson ordering.
- Internal linking logic.
- User-path design for Codex to later build into the website.

This plan is not for:

- Writing new SEO articles.
- Editing production website files.
- Building React components.
- Creating Next.js routes.
- Creating schemas.
- Adding CSS or UI code.

## Source Context

The Learn content system is documented in:

```text
docs/content/trader-intelligence-seo-master-plan.md
docs/content/HANDOFF_2026-05-08.md
docs/content/content-production-queue-*.md
docs/content/drafts/learn/
docs/content/drafts/glossary/
```

The SEO master plan defines TradersLink as a trader tools and trader education brand, with Trader Intelligence as the main product anchor. The Learn section should support that goal by educating users on trading basics, chart reading, filings, catalysts, risk, trade review, and trader improvement.

## Core Product/Education Principle

The Learn section should teach users in this order:

```text
Understand the market -> read the chart -> understand why stocks move -> manage risk -> avoid common mistakes -> review your trades -> improve with Trader Intelligence
```

This creates a natural bridge from education into the product without making the education feel like a sales pitch.

## Recommended Public Learn Hub Structure

Primary public hub:

```text
/learn/
```

The Learn page should not be a flat article index. It should be a guided navigation hub with clear paths.

Suggested top-level sections:

1. Start Here.
2. Learn Chart Reading.
3. Learn Candlestick Patterns.
4. Learn Volume, Liquidity, And Order Flow.
5. Learn News, Catalysts, And Filings.
6. Learn Risk, Discipline, And Psychology.
7. Learn Day Trading And Swing Trading.
8. Learn Trade Review And Journaling.
9. Practice And Improve.
10. Trading Glossary Support.

## User Experience Goal

A user should be able to answer:

1. Where should I start?
2. What should I read next?
3. What articles are beginner-friendly?
4. What articles are advanced?
5. What applies to the type of trading I do?
6. How does this connect to reviewing my own trades?
7. How does Trader Intelligence help me apply this?

## Learning Journey Model

Each learning journey should have four stages:

1. **Foundation**: Learn the basic idea.
2. **Application**: Learn how traders use it.
3. **Risk/Failure**: Learn what can go wrong.
4. **Review**: Learn how to review it in a journal or Trader Intelligence.

Every article card in the website should ideally expose:

```text
Level: Beginner | Practical | Advanced | Review
Track: Chart Reading | Catalysts | Risk | Trade Review | etc.
Estimated reading order
Suggested previous article
Suggested next article
Supporting glossary terms
Trader Intelligence connection
```

## Journey 1: Start Here For New Traders

### Purpose

This path is for users who do not yet have a strong trading process. It should reduce overwhelm by teaching the basic operating system of trading before patterns, filings, or fast strategies.

### Audience

- Beginner traders.
- Users new to trading journals.
- Users who need basic structure.
- Users who are overwhelmed by scanners, alerts, and market terminology.

### Recommended Order

| Order | Article/Term | Preferred URL | Level | Why It Belongs Here | Next Step |
|---:|---|---|---|---|---|
| 1 | Beginner Trader | `/glossary/beginner-trader/` | Foundation | Defines the starting user and sets expectations around learning, risk, and process. | Trading Plan |
| 2 | Trading Plan | `/glossary/trading-plan/` or `/learn/trading-plan/` | Foundation | Teaches that trading should have structure before action. | Trade Rules |
| 3 | Trade Rules | `/glossary/trade-rules/` | Foundation | Shows how a plan becomes actual behavior rules. | Trading Checklist |
| 4 | Trading Checklist | `/glossary/trading-checklist/` | Practical | Gives the user a practical pre-trade decision tool. | Risk Management |
| 5 | Risk Management | `/glossary/risk-management/` or `/learn/risk-management/` | Foundation | Teaches that protecting downside comes before chasing upside. | Position Sizing |
| 6 | Position Sizing | `/glossary/position-sizing/` | Practical | Introduces size as a risk decision. | Stop Order |
| 7 | Stop Order | `/glossary/stop-order/` | Practical | Introduces trade invalidation and exits. | Trading Journal |
| 8 | Trading Journal | `/glossary/trading-journal/` | Review | Shows how learning becomes reviewable. | Trade Review |
| 9 | Trade Review | `/glossary/trade-review/` | Review | Introduces reviewing decisions, not just P&L. | Execution Review |
| 10 | Execution Review | `/glossary/execution-review/` | Review | Bridges directly into Trader Intelligence. | Trader Intelligence |

### Website Treatment

This should be the first visible path on `/learn/`:

```text
New to trading? Start here.
Build a basic trading process before learning advanced setups.
```

CTA should be soft:

```text
When you are ready to review your own trades, Trader Intelligence is being built to help you study execution, mistakes, and repeated behavior patterns.
```

## Journey 2: Chart Reading And Market Structure

### Purpose

Teach users how price behaves around levels before they learn advanced chart patterns.

### Audience

- New chart readers.
- Day traders.
- Swing traders.
- Traders using support/resistance levels.
- Users of TradersLink levels/scanner content.

### Recommended Order

| Order | Article/Term | Preferred URL | Level | Why It Belongs Here | Next Step |
|---:|---|---|---|---|---|
| 1 | Support And Resistance | `/learn/support-and-resistance/` | Foundation | Core chart concept. | How To Draw Support And Resistance |
| 2 | How To Draw Support And Resistance | `/learn/how-to-draw-support-and-resistance/` | Practical | Shows how to apply the concept. | Support Level |
| 3 | Support Level | `/glossary/support-level/` | Foundation | Reinforces support as a reviewable level. | Resistance Level |
| 4 | Resistance Level | `/glossary/resistance-level/` | Foundation | Reinforces resistance as a reviewable level. | Pivot Level |
| 5 | Pivot Level | `/glossary/pivot-level/` | Practical | Introduces decision areas. | Breakout |
| 6 | Breakout | `/glossary/breakout/` | Practical | First major level behavior. | Breakdown |
| 7 | Breakdown | `/glossary/breakdown/` | Practical | Opposite major level behavior. | Reclaim |
| 8 | Reclaim | `/glossary/reclaim/` | Practical | Teaches level recovery. | Rejection |
| 9 | Rejection | `/glossary/rejection/` | Practical | Teaches level failure. | Fakeout |
| 10 | Fakeout | `/glossary/fakeout/` | Advanced | Teaches failed confirmation. | Trade Review |
| 11 | High Of Day | `/glossary/high-of-day/` | Practical | Adds intraday level context. | Low Of Day |
| 12 | Low Of Day | `/glossary/low-of-day/` | Practical | Adds downside intraday context. | Opening Range |
| 13 | Opening Range | `/glossary/opening-range/` | Practical | Introduces early-session structure. | Opening Range Breakout |
| 14 | Opening Range Breakout | `/glossary/opening-range-breakout/` | Advanced | Connects levels, timing, and breakout behavior. | Execution Review |

### Website Treatment

This should become a major course-style track:

```text
Learn how to read price levels and market structure.
Start with support and resistance, then learn breakouts, breakdowns, reclaims, fakeouts, and intraday levels.
```

### Codex Implementation Notes

On the public Learn page, this path should visually appear before candlestick patterns. Users should understand levels before interpreting candles.

## Journey 3: Candlestick Patterns In Context

### Purpose

Teach candle patterns as context tools, not signals.

### Audience

- New technical traders.
- Chart pattern learners.
- Traders searching candle definitions.

### Recommended Order

| Order | Article/Term | Preferred URL | Level | Why It Belongs Here | Next Step |
|---:|---|---|---|---|---|
| 1 | Candlestick Patterns Hub | `/learn/candlestick-patterns/` | Foundation | Introduces the family. | Doji |
| 2 | Doji | `/learn/candlestick-patterns/doji/` | Foundation | Teaches indecision. | Spinning Top |
| 3 | Spinning Top | `/learn/candlestick-patterns/spinning-top/` | Foundation | Similar indecision concept. | Long Wick Candle |
| 4 | Long Wick Candle | `/learn/candlestick-patterns/long-wick-candle/` | Practical | Introduces rejection/wicks. | Hammer |
| 5 | Hammer | `/learn/candlestick-patterns/hammer/` | Practical | Bullish reversal context. | Inverted Hammer |
| 6 | Inverted Hammer | `/learn/candlestick-patterns/inverted-hammer/` | Practical | Related reversal candle. | Shooting Star |
| 7 | Shooting Star | `/learn/candlestick-patterns/shooting-star/` | Practical | Bearish rejection context. | Engulfing Candle |
| 8 | Engulfing Candle | `/learn/candlestick-patterns/engulfing-candle/` | Foundation | Parent concept. | Bullish Engulfing |
| 9 | Bullish Engulfing | `/learn/candlestick-patterns/bullish-engulfing/` | Practical | Bullish context. | Bearish Engulfing |
| 10 | Bearish Engulfing | `/learn/candlestick-patterns/bearish-engulfing/` | Practical | Bearish context. | Topping Tail |
| 11 | Topping Tail | `/learn/candlestick-patterns/topping-tail/` | Practical | Rejection at highs. | Bottoming Tail |
| 12 | Bottoming Tail | `/learn/candlestick-patterns/bottoming-tail/` | Practical | Rejection at lows. | Red To Green Move |
| 13 | Red To Green Move | `/learn/candlestick-patterns/red-to-green-move/` | Advanced | Connects candle behavior and intraday momentum. | Green To Red Move |
| 14 | Green To Red Move | `/learn/candlestick-patterns/green-to-red-move/` | Advanced | Opposite intraday shift. | Candle Volume Confirmation |
| 15 | Candle Volume Confirmation | `/learn/candlestick-patterns/candle-volume-confirmation/` | Review | Teaches volume confirmation and review. | Trade Review |

### Website Treatment

Every candle article should eventually include a small warning box:

```text
Candles are context, not guarantees. Review location, volume, trend, and nearby levels before acting.
```

### Codex Implementation Notes

Create a candlestick learning path UI where users can filter by:

- Reversal candles.
- Indecision candles.
- Continuation candles.
- Intraday candle behavior.
- Confirmation concepts.

## Journey 4: Volume, Liquidity, And Order Flow

### Purpose

Teach users why volume, liquidity, spread, and execution conditions matter before they trade fast-moving stocks.

### Audience

- Day traders.
- Momentum traders.
- Scalpers.
- Scanner users.
- Small-cap traders.

### Recommended Order

| Order | Article/Term | Preferred URL | Level | Why It Belongs Here | Next Step |
|---:|---|---|---|---|---|
| 1 | Volume | `/learn/volume/` | Foundation | Basic market participation concept. | Relative Volume |
| 2 | Relative Volume | `/glossary/relative-volume/` or `/learn/relative-volume/` | Practical | Shows unusual attention. | Volume Spike |
| 3 | Volume Spike | `/glossary/volume-spike/` or `/learn/volume-spike/` | Practical | Teaches sudden activity. | Liquidity |
| 4 | Liquidity | `/glossary/liquidity/` | Foundation | Explains ability to enter/exit. | Spread |
| 5 | Spread | `/glossary/spread/` | Practical | Shows hidden execution cost. | Bid |
| 6 | Bid | `/glossary/bid/` | Foundation | Explains buyer side. | Ask |
| 7 | Ask | `/glossary/ask/` | Foundation | Explains seller side. | Slippage |
| 8 | Slippage | `/glossary/slippage/` | Practical | Shows execution risk. | Order Book |
| 9 | Order Book | `/glossary/order-book/` | Advanced | Introduces depth. | Level 2 |
| 10 | Level 2 | `/glossary/level-2/` | Advanced | Shows visible depth. | Time And Sales |
| 11 | Time And Sales | `/glossary/time-and-sales/` | Advanced | Shows prints. | Tape Reading |
| 12 | Tape Reading | `/glossary/tape-reading/` | Advanced | Interprets prints. | Order Flow |
| 13 | Order Flow | `/glossary/order-flow/` | Advanced | Pulls it together. | Execution Review |

### Website Treatment

This should be positioned as:

```text
Before you trade fast movers, learn what volume, liquidity, spread, and order flow actually mean.
```

### Codex Implementation Notes

This path should be connected to scalper, momentum trader, day trader, and execution review pages.

## Journey 5: News, Catalysts, Filings, And Dilution

### Purpose

This is the key TradersLink small-cap education path. It teaches users how to understand why stocks move and what hidden risks can exist behind headlines.

### Audience

- Small-cap traders.
- Penny stock traders.
- News-driven traders.
- Catalyst traders.
- Discord/community traders.
- Users of PR/news monitors.

### Recommended Order

| Order | Article/Term | Preferred URL | Level | Why It Belongs Here | Next Step |
|---:|---|---|---|---|---|
| 1 | Catalyst | `/glossary/catalyst/` | Foundation | Defines why a stock may move. | News Catalyst |
| 2 | News Catalyst | `/glossary/news-catalyst/` | Foundation | Teaches headline context. | Stock Catalysts |
| 3 | Stock Catalysts | `/learn/stock-catalysts/` | Practical | Broader catalyst guide. | Contract News |
| 4 | Contract News | `/glossary/contract-news/` | Practical | Common PR catalyst. | Earnings Catalyst |
| 5 | Earnings Catalyst | `/glossary/earnings-catalyst/` | Practical | Financial catalyst. | FDA Catalyst |
| 6 | FDA Catalyst | `/glossary/fda-catalyst/` | Practical | Biotech/small-cap catalyst. | News Alert |
| 7 | News Alert | `/glossary/news-alert/` | Practical | Teaches monitoring. | SEC Filings |
| 8 | SEC Filings Hub | `/learn/sec-filings/` | Foundation | Introduces filings. | Current Report |
| 9 | Current Report | `/glossary/current-report/` | Practical | Event filing. | Quarterly Report |
| 10 | Quarterly Report | `/glossary/quarterly-report/` | Practical | Financial filing. | Annual Report |
| 11 | Annual Report | `/glossary/annual-report/` | Practical | Full-year context. | Offering |
| 12 | Offering | `/glossary/offering/` | Practical | Introduces financing risk. | Dilution |
| 13 | Dilution | `/glossary/dilution/` | Practical | Core small-cap risk. | Warrant |
| 14 | Warrant | `/glossary/warrant/` | Advanced | Future dilution. | Shelf Registration |
| 15 | Shelf Registration | `/glossary/shelf-registration/` | Advanced | Future raise capacity. | Resale Registration |
| 16 | Resale Registration | `/glossary/resale-registration/` | Advanced | Selling holder supply. | ATM Offering |
| 17 | ATM Offering | `/glossary/atm-offering/` | Advanced | Ongoing supply risk. | PIPE |
| 18 | PIPE | `/glossary/pipe/` | Advanced | Private financing. | Convertible Note |
| 19 | Convertible Note | `/glossary/convertible-note/` | Advanced | Conversion/dilution risk. | Prospectus Supplement |
| 20 | Prospectus Supplement | `/glossary/prospectus-supplement/` | Advanced | Specific offering terms. | Trade Review |

### Website Treatment

This should be one of the main featured tracks:

```text
Trade small caps? Learn how news, filings, offerings, and dilution risk work before reacting to headlines.
```

### Codex Implementation Notes

This path should be visually distinct because it is a major differentiator for TradersLink. It should have a warning-style educational tone:

```text
A press release can move a stock, but filings often explain the hidden risk.
```

## Journey 6: Small-Cap, Float, And Short Squeeze Context

### Purpose

Teach users why float, liquidity, market cap, short interest, and borrow data matter for volatile small-cap trading.

### Recommended Order

| Order | Article/Term | Preferred URL | Level | Why It Belongs Here | Next Step |
|---:|---|---|---|---|---|
| 1 | Small-Cap Stocks | `/learn/small-cap-stocks/` | Foundation | Introduces small-cap context. | Penny Stocks |
| 2 | Penny Stocks | `/learn/penny-stocks/` | Foundation | High-risk low-priced context. | Float |
| 3 | Float | `/glossary/float/` | Foundation | Tradable supply. | Shares Outstanding |
| 4 | Shares Outstanding | `/glossary/shares-outstanding/` | Foundation | Total share count. | Market Cap |
| 5 | Market Cap | `/glossary/market-cap/` | Foundation | Company size context. | Liquidity |
| 6 | Liquidity | `/glossary/liquidity/` | Practical | Tradeability. | Relative Volume |
| 7 | Relative Volume | `/glossary/relative-volume/` | Practical | Attention/volume. | Short Interest |
| 8 | Short Interest | `/glossary/short-interest/` | Practical | Bearish positioning. | Short Volume |
| 9 | Short Volume | `/glossary/short-volume/` | Practical | Reported short activity. | Days To Cover |
| 10 | Days To Cover | `/glossary/days-to-cover/` | Advanced | Squeeze context. | Borrow Fee |
| 11 | Borrow Fee | `/glossary/borrow-fee/` | Advanced | Borrow pressure. | Short Squeeze |
| 12 | Short Squeeze | `/glossary/short-squeeze/` | Advanced | Pulls context together. | Risk Management |

### Website Treatment

This path should not hype short squeezes. It should explicitly teach:

```text
Short interest is context, not a guarantee.
```

## Journey 7: Day Trading Workflow

### Purpose

Teach a practical day-trading workflow from preparation to scanner/watchlist to levels, risk, execution, and review.

### Recommended Order

| Order | Article/Term | Preferred URL | Level | Why It Belongs Here | Next Step |
|---:|---|---|---|---|---|
| 1 | Day Trader | `/glossary/day-trader/` | Foundation | Defines user type. | Active Trader |
| 2 | Active Trader | `/glossary/active-trader/` | Foundation | Broader category. | Watchlist |
| 3 | Watchlist | `/glossary/watchlist/` | Practical | Organizes candidates. | Scanner |
| 4 | Scanner | `/glossary/scanner/` | Practical | Finds activity. | Alert |
| 5 | Alert | `/glossary/alert/` | Practical | Monitors conditions. | Price Alert |
| 6 | Price Alert | `/glossary/price-alert/` | Practical | Monitors levels. | News Alert |
| 7 | News Alert | `/glossary/news-alert/` | Practical | Monitors catalysts. | Premarket Trading |
| 8 | Premarket Trading | `/glossary/premarket-trading/` | Practical | Early activity. | Market Open |
| 9 | Market Open | `/glossary/market-open/` | Practical | Volatile open. | Opening Range |
| 10 | Opening Range | `/glossary/opening-range/` | Practical | Early range. | High Of Day |
| 11 | High Of Day | `/glossary/high-of-day/` | Practical | Intraday strength. | Low Of Day |
| 12 | Low Of Day | `/glossary/low-of-day/` | Practical | Intraday weakness. | Trade Review |

### Codex Implementation Notes

This path should be presented as a workflow, not a topic category:

```text
Prepare -> Watch -> Alert -> Trade -> Review
```

## Journey 8: Trading Styles

### Purpose

Help users understand different trader identities and direct them to relevant learning paths.

### Recommended Order

| Order | Trader Type | Preferred URL | Best Related Track |
|---:|---|---|---|
| 1 | Beginner Trader | `/glossary/beginner-trader/` | Start Here |
| 2 | Active Trader | `/glossary/active-trader/` | Day Trading Workflow |
| 3 | Day Trader | `/glossary/day-trader/` | Day Trading Workflow |
| 4 | Swing Trader | `/glossary/swing-trader/` | Swing Trading And Multi-Day Risk |
| 5 | Momentum Trader | `/glossary/momentum-trader/` | Volume And Momentum |
| 6 | Scalper | `/glossary/scalper/` | Volume, Liquidity, Execution |
| 7 | Breakout Trader | `/glossary/breakout-trader/` | Chart Reading And Market Structure |
| 8 | Dip Buyer | `/glossary/dip-buyer/` | Support/Resistance And Risk |
| 9 | Technical Trader | `/glossary/technical-trader/` | Chart Reading |
| 10 | Catalyst Trader | `/glossary/catalyst-trader/` | News, Catalysts, Filings |

### Website Treatment

This should appear as a guided selector on `/learn/`:

```text
What type of trader are you trying to become?
```

Clicking a trader type should lead to a focused pathway.

## Journey 9: Risk, Discipline, And Psychology

### Purpose

Teach common behavioral issues after the user understands basic risk.

### Recommended Order

| Order | Article/Term | Preferred URL | Level | Why It Belongs Here | Next Step |
|---:|---|---|---|---|---|
| 1 | Risk Management | `/glossary/risk-management/` | Foundation | Starts with capital protection. | Trading Discipline |
| 2 | Trading Discipline | `/glossary/trading-discipline/` | Foundation | Teaches rule-following. | Overtrading |
| 3 | Overtrading | `/glossary/overtrading/` | Practical | Common behavior issue. | Revenge Trading |
| 4 | Revenge Trading | `/glossary/revenge-trading/` | Practical | Loss-triggered issue. | FOMO Trading |
| 5 | FOMO Trading | `/glossary/fomo-trading/` | Practical | Chase-entry issue. | Average Down |
| 6 | Average Down | `/glossary/average-down/` | Practical | Risky management behavior. | Daily Risk Limit |
| 7 | Daily Risk Limit | `/glossary/daily-risk-limit/` | Practical | Hard stopping rule. | Trading Journal |
| 8 | Trading Journal | `/glossary/trading-journal/` | Review | Track behavior. | Performance Review |

### Website Treatment

This path should feel like coaching:

```text
Struggling with mistakes? Start here.
Learn the behaviors that damage trading accounts and how to review them.
```

## Journey 10: Execution And Trade Review

### Purpose

Bridge education into Trader Intelligence product value.

### Recommended Order

| Order | Article/Term | Preferred URL | Level | Why It Belongs Here | Next Step |
|---:|---|---|---|---|---|
| 1 | Trading Journal | `/glossary/trading-journal/` | Foundation | Introduces logging. | Trade Log |
| 2 | Trade Log | `/glossary/trade-log/` | Foundation | Structured data. | Trade Review |
| 3 | Trade Review | `/glossary/trade-review/` | Practical | Analyzing decisions. | Execution Review |
| 4 | Execution Review | `/glossary/execution-review/` | Practical | Entries/exits/fills. | Fill Price |
| 5 | Fill Price | `/glossary/fill-price/` | Practical | Actual execution. | Slippage |
| 6 | Slippage | `/glossary/slippage/` | Practical | Execution cost. | Partial Fill |
| 7 | Partial Fill | `/glossary/partial-fill/` | Practical | Order behavior. | Market Order |
| 8 | Market Order | `/glossary/market-order/` | Practical | Speed vs control. | Limit Order |
| 9 | Limit Order | `/glossary/limit-order/` | Practical | Control vs missed fill. | Performance Review |
| 10 | Performance Review | `/glossary/performance-review/` | Review | Broader analytics. | Trader Intelligence |

### Website Treatment

This should be the strongest product bridge:

```text
Want to understand your own trades? Learn how trade review, execution review, and performance review work.
```

## Journey 11: Practice And Improvement

### Purpose

Teach users how to practice and test ideas before increasing risk.

### Recommended Order

| Order | Article/Term | Preferred URL | Level | Why It Belongs Here | Next Step |
|---:|---|---|---|---|---|
| 1 | Paper Trading | `/glossary/paper-trading/` | Foundation | Practice without real money. | Simulator Trading |
| 2 | Simulator Trading | `/glossary/simulator-trading/` | Foundation | Tool-based practice. | Replay Trading |
| 3 | Replay Trading | `/glossary/replay-trading/` | Practical | Practice historical action. | Backtesting |
| 4 | Backtesting | `/glossary/backtesting/` | Practical | Historical strategy research. | Forward Testing |
| 5 | Forward Testing | `/glossary/forward-testing/` | Advanced | Test current conditions. | Trading Journal |
| 6 | Trading Journal | `/glossary/trading-journal/` | Review | Track practice results. | Performance Review |

### Website Treatment

This should be framed as:

```text
Practice before increasing risk.
```

## Journey 12: Halts And High-Volatility Events

### Purpose

Teach users what happens when trading pauses, resumes, or becomes disorderly.

### Recommended Order

| Order | Article/Term | Preferred URL | Level | Why It Belongs Here | Next Step |
|---:|---|---|---|---|---|
| 1 | Halt | `/glossary/halt/` | Foundation | Parent concept. | Volatility Halt |
| 2 | Volatility Halt | `/glossary/volatility-halt/` | Practical | Common fast-mover halt. | News Pending Halt |
| 3 | News Pending Halt | `/glossary/news-pending-halt/` | Practical | News-related pause. | Trade Resumption |
| 4 | Trade Resumption | `/glossary/trade-resumption/` | Practical | Reopen behavior. | Circuit Breaker |
| 5 | Circuit Breaker | `/glossary/circuit-breaker/` | Advanced | Market or rule-based pause. | Risk Management |

### Website Treatment

This should be a risk-focused path:

```text
Learn what happens when trading pauses and why resumption can be risky.
```

## Recommended `/learn/` Page Layout For Codex

### 1. Hero Section

Content intent:

```text
Learn trading step by step.
Choose a path based on what you need to understand next: chart reading, catalysts, filings, risk, trade review, or practice.
```

CTA options:

- Start with Trading Foundations.
- Learn Chart Reading.
- Learn News And Filings.
- Learn Trade Review.

### 2. Start Here Section

Show the first journey as a highlighted beginner path.

Card title:

```text
Start Here: Build A Trading Foundation
```

Description:

```text
Learn the basic process behind trading plans, risk management, journaling, and trade review before moving into advanced setups.
```

### 3. Learning Path Grid

Show cards for each major path:

1. Chart Reading And Market Structure.
2. Candlestick Patterns In Context.
3. Volume, Liquidity, And Order Flow.
4. News, Catalysts, Filings, And Dilution.
5. Small-Cap, Float, And Short Squeeze Context.
6. Day Trading Workflow.
7. Trading Styles.
8. Risk, Discipline, And Psychology.
9. Execution And Trade Review.
10. Practice And Improvement.
11. Halts And High-Volatility Events.

Each card should show:

- Track name.
- Who it is for.
- Difficulty.
- Number of lessons.
- Suggested first article.
- Main product connection.

### 4. Recommended Path Selector

A user can choose:

```text
I am new to trading -> Start Here
I want to read charts -> Chart Reading
I trade small caps/news -> News, Catalysts, Filings
I chase or overtrade -> Risk, Discipline, Psychology
I want to review my trades -> Execution And Trade Review
I want to practice -> Practice And Improvement
```

### 5. Article Cards

Each article card should eventually support this metadata:

```yaml
learning_track: "Chart Reading And Market Structure"
learning_stage: "Foundation"
learning_order: 1
recommended_previous: null
recommended_next: "/learn/how-to-draw-support-and-resistance/"
supporting_glossary:
  - "/glossary/support/"
  - "/glossary/resistance/"
product_connection: "Trade Review"
```

This metadata can be added later. Codex should not assume it exists yet unless the content pipeline adds it.

## Recommended Article Footer Navigation

Eventually, every Learn article should have a learning footer:

```text
Continue The Lesson
Previous: [Previous article]
Next: [Next article]
Related glossary: [Term 1], [Term 2], [Term 3]
Review this in Trader Intelligence: [Relevant feature]
```

For glossary pages, use:

```text
Learn this in context
This term appears in: [Learning Path Name]
Read next: [Practical article]
Related terms: [Term 1], [Term 2], [Term 3]
```

## Recommended Navigation Model

### Primary Learn Navigation

```text
/learn/
  /learn/start-here/
  /learn/chart-reading/
  /learn/candlestick-patterns/
  /learn/volume-liquidity-order-flow/
  /learn/news-catalysts-filings/
  /learn/risk-discipline/
  /learn/day-trading-workflow/
  /learn/trade-review/
  /learn/practice-and-improvement/
```

These can be hub pages later. For now, this document defines the intended structure.

### Relationship Between `/learn/` And `/glossary/`

Use `/learn/` for guided explanations and learning paths.

Use `/glossary/` for definitions and supporting concepts.

A user journey should flow like:

```text
Learn hub -> Learning path -> Lesson article -> Supporting glossary terms -> Next lesson -> Trade review/product connection
```

Do not make the glossary the main beginner journey. Glossary should support the journey.

## Codex Build Priorities

### Phase 1: Planning/Content Navigation Only

Codex should build or prepare data structures for:

- Learning track definitions.
- Ordered article lists.
- Article card grouping.
- Track descriptions.
- Suggested previous/next logic.

No article rewriting is required for Phase 1.

### Phase 2: Learn Hub UI

Codex should create a `/learn/` page that shows:

- Start Here hero.
- Track cards.
- Path selector.
- Beginner-friendly order.
- Links to existing markdown content.

### Phase 3: Track Hub Pages

Codex can later create dedicated path pages such as:

```text
/learn/chart-reading/
/learn/news-catalysts-filings/
/learn/risk-discipline/
/learn/trade-review/
```

### Phase 4: Previous/Next Lesson Blocks

After paths are stable, Codex or the content workflow can add previous/next learning blocks to article templates or content metadata.

## Content Gaps To Consider Later

The existing content is strong, but the learning journey would benefit from bridge pages such as:

1. `/learn/start-here/` | Start Here For New Traders.
2. `/learn/how-to-use-this-learning-library/` | How to use TradersLink Learn.
3. `/learn/chart-reading-path/` | Chart reading learning path.
4. `/learn/news-and-filings-path/` | News and filings learning path.
5. `/learn/trade-review-path/` | Trade review learning path.
6. `/learn/risk-discipline-path/` | Risk and discipline learning path.
7. `/learn/trading-practice-path/` | Practice and improvement learning path.

These should be treated as hub/guide pages, not glossary definitions.

## Success Criteria

The Learn section is successful if:

1. A beginner knows where to start.
2. A small-cap trader can find the filing/dilution path quickly.
3. A technical trader can follow chart concepts in order.
4. A struggling trader can find risk and psychology lessons quickly.
5. A Trader Intelligence user can understand how education connects to trade review.
6. Articles are grouped by learning intent, not just keywords.
7. Users are guided to the next lesson instead of abandoned at the end of each article.

## Important Instruction For Future Codex Work

Do not turn the Learn section into a flat blog index.

The website should feel like a guided education product:

```text
Learning paths first.
Articles second.
Glossary support third.
Trader Intelligence connection where relevant.
```

The goal is not just SEO traffic. The goal is to help a trader move through a clear learning journey without being overwhelmed.
