# TradersLink Learn Visual Content Plan

## Purpose

This document defines the visual content strategy for the TradersLink `/learn/` education library.

The goal is to make educational content easier to understand, easier to follow, and more visually useful for traders. This plan is for Codex and future image-generation work. It is **not** a production implementation file and it does **not** create image assets by itself.

The Learn section should not feel like a wall of text. The user should see simple, consistent visuals that help explain chart behavior, filings, risk, execution, and trader improvement concepts.

## Scope

This plan covers:

- Image types needed for Learn content.
- Visual style rules.
- Naming conventions.
- Alt text standards.
- Suggested image placement.
- Priority image batches.
- Track-by-track visual requirements.
- Codex implementation notes.
- Future image generation prompt direction.

This plan does not include:

- Actual PNG/JPG/SVG files.
- React components.
- CSS.
- Next.js routes.
- Production image imports.
- Final design implementation.

## Relationship To Learning Journey Plan

This plan supports:

```text
docs/content/learn-learning-journey-implementation-plan.md
```

The learning journey plan explains how users move through `/learn/`. This visual plan explains what images, diagrams, and educational graphics should support those journeys.

## Core Visual Principle

Every Learn image should make a concept easier to understand.

Avoid images that are only decorative. A good TradersLink Learn visual should do at least one of these:

1. Explain a chart behavior.
2. Show a decision workflow.
3. Show a filing or dilution process.
4. Show a risk or psychology loop.
5. Show how trade review works.
6. Help a beginner understand what to look for.
7. Help Codex build a consistent user learning experience.

## Visual Style Direction

Use one consistent visual language across the Learn section.

Recommended style:

- Clean trading dashboard aesthetic.
- Dark background or neutral light card variants depending on final website theme.
- TradersLink blue accent.
- Simple line charts and candles.
- Clear labels.
- Minimal clutter.
- No fake trading platform screenshots.
- No realistic account balances.
- No profit claims.
- No buy/sell calls.
- No ticker-specific recommendations.
- No giant red/green hype graphics.
- Mobile-readable text.
- Beginner-friendly structure.

## Visual Claim Rules

Do not create visuals that imply:

- A pattern guarantees a move.
- A candle guarantees reversal.
- A filing guarantees price direction.
- A short squeeze is guaranteed.
- Trader Intelligence guarantees profits.
- Any setup is a buy or sell signal.

Use careful labels such as:

- Possible breakout area.
- Failed breakout example.
- Support area.
- Volume confirmation context.
- Risk review point.
- Example only.
- Educational illustration.

## Recommended Asset Folder Structure

When Codex later wires images into the website, use a simple public asset structure such as:

```text
public/images/learn/
  chart-reading/
  candlesticks/
  volume-liquidity/
  catalysts-filings/
  risk-discipline/
  trade-review/
  practice/
  halts-volatility/
  trading-styles/
```

Alternative if the content pipeline keeps assets beside content:

```text
docs/content/assets/learn/
```

Codex should choose based on the website architecture.

## File Naming Rules

Use lowercase kebab-case.

Good:

```text
support-resistance-levels-diagram.png
breakout-fakeout-comparison.png
shelf-registration-offering-flow.png
risk-management-checklist.png
trade-review-workflow.png
```

Avoid:

```text
image1.png
chart-final-final.png
trading-profit-example.png
buy-signal-breakout.png
```

## Alt Text Rules

Alt text should explain what the visual teaches.

Good alt text:

```text
Simple chart diagram showing price bouncing from support and rejecting near resistance.
```

Bad alt text:

```text
Cool trading chart.
```

Alt text should:

1. Describe the visual.
2. Include the educational concept.
3. Avoid hype.
4. Avoid trade recommendations.
5. Stay under roughly 150 characters when possible.

## Image Metadata Recommendation

Future markdown frontmatter can optionally support:

```yaml
featured_image: "/images/learn/chart-reading/support-resistance-levels-diagram.png"
featured_image_alt: "Simple chart diagram showing support and resistance levels."
visual_type: "chart_diagram"
learning_track: "Chart Reading And Market Structure"
```

Codex should not assume this metadata exists yet. It can be added later through a content migration.

## Image Types

### 1. Chart Diagrams

Used for:

- Support and resistance.
- Breakouts.
- Breakdowns.
- Reclaims.
- Rejections.
- Fakeouts.
- High of day.
- Low of day.
- Opening range.

Style:

- Simple line chart or candle chart.
- One or two labeled levels.
- Minimal candles.
- Clear arrows showing behavior.
- No exact ticker or real stock prices.

### 2. Candlestick Illustrations

Used for:

- Doji.
- Hammer.
- Shooting star.
- Engulfing candles.
- Topping tail.
- Bottoming tail.
- Red-to-green move.
- Green-to-red move.

Style:

- Simple candle bodies and wicks.
- Clear labels.
- Context line when needed.
- Avoid implying the candle alone is a signal.

### 3. Process Flow Diagrams

Used for:

- SEC filings.
- Offerings.
- Dilution.
- Resale registration.
- ATM offering.
- PIPE.
- Convertible notes.
- News catalyst review.

Style:

- Box-and-arrow flow.
- Plain language.
- Risk context callouts.
- No panic language.

### 4. Workflow Diagrams

Used for:

- Trading journal.
- Trade log.
- Trade review.
- Execution review.
- Performance review.
- Trader Intelligence bridge concepts.

Style:

- Step-by-step workflow.
- Show data moving from trade to review.
- Soft product connection.

### 5. Checklist Graphics

Used for:

- Trading checklist.
- Setup checklist.
- Risk management.
- Trading plan.
- Trade criteria.
- Trade rules.

Style:

- Simple checklist card.
- 4 to 6 concise items.
- No tiny text.

### 6. Psychology Loop Diagrams

Used for:

- FOMO trading.
- Revenge trading.
- Overtrading.
- Trading discipline.

Style:

- Circular or step-loop diagram.
- Show trigger -> behavior -> consequence -> review.
- Coaching tone.
- No shame language.

### 7. Comparison Graphics

Used for:

- Market order vs limit order.
- Stop market vs stop limit.
- Backtesting vs forward testing.
- Paper trading vs simulator trading.
- Day trader vs swing trader.

Style:

- Two-column or side-by-side.
- Simple differences.
- Avoid declaring one always better.

## Priority Image Batches

### Batch 1: Core Learning Journey Hero Images

These images support the main `/learn/` hub and learning path cards.

| Priority | Track | Suggested Filename | Image Type | Purpose | Alt Text |
|---:|---|---|---|---|---|
| 1 | Start Here | `start-here-trading-foundation.png` | Workflow diagram | Show plan -> risk -> journal -> review. | Trading foundation workflow showing plan, risk, journal, and review steps. |
| 1 | Chart Reading | `chart-reading-levels-path.png` | Chart diagram | Show support, resistance, breakout, fakeout path. | Simple chart education path showing support, resistance, breakout, and fakeout concepts. |
| 1 | Catalysts And Filings | `news-filings-dilution-path.png` | Process flow | Show news -> filing -> dilution review -> trade review. | Flow diagram showing news, filings, dilution review, and trade review. |
| 1 | Risk And Discipline | `risk-discipline-review-loop.png` | Psychology loop | Show emotion -> rule -> risk -> review loop. | Loop diagram showing trading emotion, rules, risk management, and review. |
| 1 | Trade Review | `trade-review-workflow.png` | Workflow diagram | Show trade log -> execution review -> performance review. | Workflow showing trade log, execution review, and performance review. |
| 1 | Practice | `practice-improvement-path.png` | Workflow diagram | Show paper trading -> replay -> backtesting -> forward testing. | Practice path showing paper trading, replay trading, backtesting, and forward testing. |

## Track Visual Plans

## Track 1: Start Here For New Traders

### Visual Goal

Make the learning path feel calm, structured, and beginner-friendly.

### Recommended Images

| Article/Concept | Suggested Filename | Type | Placement | Purpose | Priority |
|---|---|---|---|---|---:|
| Beginner Trader | `beginner-trader-learning-path.png` | Workflow diagram | Article intro | Show beginner path from basics to review. | 2 |
| Trading Plan | `trading-plan-framework.png` | Checklist graphic | Near H2 about plan contents | Show setup, risk, entry, exit, review. | 1 |
| Trade Rules | `trade-rules-decision-card.png` | Checklist graphic | Article intro | Show examples of rules. | 2 |
| Risk Management | `risk-management-framework.png` | Checklist graphic | Article intro | Show risk, size, stop, daily limit. | 1 |
| Trading Journal | `trading-journal-review-flow.png` | Workflow diagram | Article intro | Show trade -> log -> review -> lesson. | 1 |
| Execution Review | `execution-review-decision-points.png` | Workflow diagram | Article intro | Show entry, fill, add, reduce, exit. | 1 |

## Track 2: Chart Reading And Market Structure

### Visual Goal

Use simple chart examples so users understand behavior around levels.

### Recommended Images

| Article/Concept | Suggested Filename | Type | Placement | Purpose | Priority |
|---|---|---|---|---|---:|
| Support And Resistance | `support-resistance-levels-diagram.png` | Chart diagram | Article intro | Show price bouncing and rejecting. | 1 |
| Breakout | `breakout-above-resistance-diagram.png` | Chart diagram | Article intro | Show price breaking above resistance. | 1 |
| Breakdown | `breakdown-below-support-diagram.png` | Chart diagram | Article intro | Show price breaking below support. | 1 |
| Reclaim | `level-reclaim-diagram.png` | Chart diagram | Article intro | Show lost level regained. | 1 |
| Rejection | `price-rejection-level-diagram.png` | Chart diagram | Article intro | Show price rejecting at resistance. | 1 |
| Fakeout | `breakout-fakeout-diagram.png` | Chart diagram | Article intro | Show breakout failure. | 1 |
| Opening Range | `opening-range-high-low-diagram.png` | Chart diagram | Article intro | Show first range high and low. | 2 |
| Opening Range Breakout | `opening-range-breakout-diagram.png` | Chart diagram | Article intro | Show break above opening range. | 2 |

## Track 3: Candlestick Patterns

### Visual Goal

Help users recognize candle shapes while understanding context.

### Recommended Images

| Article/Concept | Suggested Filename | Type | Placement | Purpose | Priority |
|---|---|---|---|---|---:|
| Doji | `doji-candle-example.png` | Candlestick illustration | Article intro | Show indecision candle. | 2 |
| Hammer | `hammer-candle-example.png` | Candlestick illustration | Article intro | Show long lower wick. | 2 |
| Shooting Star | `shooting-star-candle-example.png` | Candlestick illustration | Article intro | Show long upper wick. | 2 |
| Bullish Engulfing | `bullish-engulfing-candle-example.png` | Candlestick illustration | Article intro | Show engulfing structure. | 2 |
| Bearish Engulfing | `bearish-engulfing-candle-example.png` | Candlestick illustration | Article intro | Show bearish engulfing structure. | 2 |
| Topping Tail | `topping-tail-candle-example.png` | Candlestick illustration | Article intro | Show upper rejection wick. | 2 |
| Bottoming Tail | `bottoming-tail-candle-example.png` | Candlestick illustration | Article intro | Show lower rejection wick. | 2 |
| Candle Volume Confirmation | `candle-volume-confirmation-diagram.png` | Mixed chart/candle | Article body | Show candle plus volume confirmation. | 1 |

## Track 4: Volume, Liquidity, And Order Flow

### Visual Goal

Show users that volume and execution conditions affect trade quality.

### Recommended Images

| Article/Concept | Suggested Filename | Type | Placement | Purpose | Priority |
|---|---|---|---|---|---:|
| Volume Spike | `volume-spike-chart-diagram.png` | Chart diagram | Article intro | Show volume expansion under price. | 1 |
| Relative Volume | `relative-volume-comparison.png` | Comparison graphic | Article intro | Compare normal volume vs high RVOL. | 1 |
| Liquidity | `liquidity-spread-depth-example.png` | Concept diagram | Article intro | Show liquid vs illiquid order book. | 1 |
| Spread | `bid-ask-spread-diagram.png` | Concept diagram | Article intro | Show bid, ask, spread. | 1 |
| Slippage | `slippage-fill-price-diagram.png` | Concept diagram | Article body | Show expected vs actual fill. | 1 |
| Level 2 | `level-2-depth-illustration.png` | Order book diagram | Article intro | Show depth without real platform UI. | 2 |
| Time And Sales | `time-and-sales-print-flow.png` | Concept diagram | Article intro | Show trade prints over time. | 2 |
| Order Flow | `order-flow-pressure-diagram.png` | Flow diagram | Article intro | Show buying and selling pressure. | 2 |

## Track 5: News, Catalysts, Filings, And Dilution

### Visual Goal

Make hard small-cap concepts easier to understand through flows.

### Recommended Images

| Article/Concept | Suggested Filename | Type | Placement | Purpose | Priority |
|---|---|---|---|---|---:|
| Catalyst | `stock-catalyst-review-flow.png` | Process flow | Article intro | Show event -> volume -> price reaction -> review. | 1 |
| News Catalyst | `news-catalyst-quality-check.png` | Checklist graphic | Article body | Show headline, details, volume, levels. | 1 |
| FDA Catalyst | `fda-catalyst-stage-flow.png` | Process flow | Article intro | Show clinical/regulatory event stages. | 2 |
| Contract News | `contract-news-quality-check.png` | Checklist graphic | Article body | Show customer, terms, materiality. | 2 |
| Offering | `offering-dilution-flow.png` | Process flow | Article intro | Show company sells securities -> supply changes. | 1 |
| Dilution | `dilution-share-count-diagram.png` | Process flow | Article intro | Show new shares increasing total supply. | 1 |
| Shelf Registration | `shelf-registration-to-offering-flow.png` | Process flow | Article intro | Show shelf -> supplement -> possible offering. | 1 |
| Resale Registration | `resale-registration-selling-holder-flow.png` | Process flow | Article intro | Show private shares -> registration -> possible resale. | 1 |
| ATM Offering | `atm-offering-market-sales-flow.png` | Process flow | Article intro | Show gradual sales into market. | 1 |
| PIPE | `pipe-financing-resale-flow.png` | Process flow | Article intro | Show private investment -> registration rights. | 2 |
| Convertible Note | `convertible-note-dilution-flow.png` | Process flow | Article intro | Show debt -> conversion -> possible shares. | 2 |

## Track 6: Risk, Discipline, And Psychology

### Visual Goal

Make behavior patterns visible without shaming the trader.

### Recommended Images

| Article/Concept | Suggested Filename | Type | Placement | Purpose | Priority |
|---|---|---|---|---|---:|
| Risk Management | `risk-management-checklist-card.png` | Checklist graphic | Article intro | Show risk, stop, size, daily limit. | 1 |
| Trading Discipline | `trading-discipline-rule-loop.png` | Psychology loop | Article intro | Show plan -> rule -> action -> review. | 1 |
| Overtrading | `overtrading-spiral-diagram.png` | Psychology loop | Article intro | Show boredom/loss -> extra trades -> worse decisions. | 1 |
| Revenge Trading | `revenge-trading-loop.png` | Psychology loop | Article intro | Show loss -> frustration -> forced trade -> review. | 1 |
| FOMO Trading | `fomo-trading-chase-loop.png` | Psychology loop | Article intro | Show fast move -> fear -> chase -> risk. | 1 |
| Average Down | `average-down-risk-diagram.png` | Chart/process | Article intro | Show adding while invalidation breaks. | 2 |
| Daily Risk Limit | `daily-risk-limit-stop-rule.png` | Checklist graphic | Article intro | Show stop trading after max risk. | 2 |

## Track 7: Execution And Trade Review

### Visual Goal

Connect education directly to the Trader Intelligence product value: reviewing actual decisions.

### Recommended Images

| Article/Concept | Suggested Filename | Type | Placement | Purpose | Priority |
|---|---|---|---|---|---:|
| Trading Journal | `trading-journal-workflow.png` | Workflow diagram | Article intro | Show trade -> log -> notes -> review. | 1 |
| Trade Log | `trade-log-data-fields.png` | Concept diagram | Article intro | Show ticker, entry, exit, size, P&L. | 2 |
| Trade Review | `trade-review-process-flow.png` | Workflow diagram | Article intro | Show thesis, entry, exit, mistake, lesson. | 1 |
| Execution Review | `execution-review-timeline.png` | Timeline diagram | Article intro | Show entry, fill, add, reduce, exit. | 1 |
| Performance Review | `performance-review-metrics-dashboard.png` | Dashboard concept | Article intro | Show win rate, profit factor, drawdown. | 1 |
| Fill Price | `fill-price-example-diagram.png` | Concept diagram | Article intro | Show expected vs actual fill. | 2 |
| Partial Fill | `partial-fill-order-diagram.png` | Concept diagram | Article intro | Show partial execution. | 2 |

## Track 8: Practice And Improvement

### Visual Goal

Show a safe improvement ladder before live risk increases.

### Recommended Images

| Article/Concept | Suggested Filename | Type | Placement | Purpose | Priority |
|---|---|---|---|---|---:|
| Paper Trading | `paper-trading-practice-flow.png` | Workflow diagram | Article intro | Show simulated trade -> journal -> review. | 1 |
| Simulator Trading | `simulator-trading-environment.png` | Workflow diagram | Article intro | Show practice environment and feedback. | 2 |
| Replay Trading | `replay-trading-session-flow.png` | Workflow diagram | Article intro | Show historical replay -> decisions -> review. | 2 |
| Backtesting | `backtesting-rules-history-flow.png` | Process flow | Article intro | Show rules tested on historical data. | 1 |
| Forward Testing | `forward-testing-live-sample-flow.png` | Process flow | Article intro | Show current market testing over time. | 1 |

## Track 9: Halts And High-Volatility Events

### Visual Goal

Teach risk during pauses and reopenings.

### Recommended Images

| Article/Concept | Suggested Filename | Type | Placement | Purpose | Priority |
|---|---|---|---|---|---:|
| Halt | `trading-halt-pause-diagram.png` | Process diagram | Article intro | Show price move -> halt -> resumption. | 2 |
| Volatility Halt | `volatility-halt-fast-move-diagram.png` | Chart diagram | Article intro | Show fast move triggering pause. | 2 |
| News Pending Halt | `news-pending-halt-flow.png` | Process flow | Article intro | Show halt -> news -> resumption. | 2 |
| Trade Resumption | `trade-resumption-reopen-risk.png` | Chart diagram | Article intro | Show reopen gap and spread. | 2 |
| Circuit Breaker | `circuit-breaker-market-pause.png` | Process diagram | Article intro | Show market-wide pause concept. | 3 |

## Track 10: Trading Styles

### Visual Goal

Help users self-identify without locking them into one identity.

### Recommended Images

| Article/Concept | Suggested Filename | Type | Placement | Purpose | Priority |
|---|---|---|---|---|---:|
| Beginner Trader | `beginner-trader-path-card.png` | Journey card | Article intro | Show learning path. | 2 |
| Day Trader | `day-trader-workflow-card.png` | Workflow card | Article intro | Show premarket -> open -> review. | 2 |
| Swing Trader | `swing-trader-multiday-flow.png` | Workflow card | Article intro | Show entry -> hold -> catalyst/risk -> exit. | 2 |
| Momentum Trader | `momentum-trader-volume-breakout.png` | Chart diagram | Article intro | Show volume-supported move. | 2 |
| Scalper | `scalper-execution-focus-card.png` | Workflow card | Article intro | Show spread, fill, quick exit. | 2 |
| Catalyst Trader | `catalyst-trader-news-review-card.png` | Workflow card | Article intro | Show news -> verify -> trade plan. | 2 |

## Image Prompt System For Future Generation

When generating images, use prompts based on this template:

```text
Create a clean educational trading diagram for TradersLink Learn.
Style: modern trading dashboard, dark neutral background, blue accent, simple labels, minimal clutter, mobile readable.
Topic: [topic]
Show: [specific concept]
Avoid: real ticker symbols, profit claims, buy/sell signals, realistic account balances, hype language.
Text labels: [short labels only]
Purpose: help beginner traders understand [concept].
```

Example prompt:

```text
Create a clean educational trading diagram for TradersLink Learn.
Style: modern trading dashboard, dark neutral background, blue accent, simple labels, minimal clutter, mobile readable.
Topic: support and resistance.
Show price bouncing from a support area and rejecting near a resistance area on a simple line chart.
Avoid real ticker symbols, profit claims, buy/sell signals, and hype language.
Text labels: Support Area, Resistance Area, Example Price Path.
Purpose: help beginner traders understand support and resistance levels.
```

## Recommended First Image Generation Batch

Start with these 15 images because they support the most important learning paths:

1. `start-here-trading-foundation.png`
2. `support-resistance-levels-diagram.png`
3. `breakout-above-resistance-diagram.png`
4. `breakout-fakeout-diagram.png`
5. `volume-spike-chart-diagram.png`
6. `relative-volume-comparison.png`
7. `stock-catalyst-review-flow.png`
8. `offering-dilution-flow.png`
9. `shelf-registration-to-offering-flow.png`
10. `risk-management-checklist-card.png`
11. `fomo-trading-chase-loop.png`
12. `revenge-trading-loop.png`
13. `trading-journal-workflow.png`
14. `execution-review-timeline.png`
15. `trade-review-workflow.png`

## Codex Implementation Notes

Codex should use this plan to prepare for visual integration, but should not assume images exist yet.

Recommended implementation flow:

1. Add optional image metadata support to markdown content only after the asset folder strategy is confirmed.
2. Build Learn article templates that can display an optional featured educational image.
3. Build Learn hub cards that can display a track icon or hero image.
4. Keep image rendering accessible with alt text.
5. Keep images responsive for mobile.
6. Do not hardcode missing image paths.
7. Do not use image assets as required content until they exist.

## Suggested Future Metadata Fields

Add later if useful:

```yaml
learning_track: "Chart Reading And Market Structure"
learning_stage: "Foundation"
featured_image: "/images/learn/chart-reading/support-resistance-levels-diagram.png"
featured_image_alt: "Simple chart diagram showing support and resistance levels."
visual_type: "chart_diagram"
visual_priority: "high"
```

## Accessibility Requirements

Every image needs:

1. Meaningful alt text.
2. Visible text large enough for mobile.
3. No color-only meaning.
4. Labels that explain the key concept.
5. No unnecessary decoration if the image is educational.

If an image is purely decorative, it should not be used in Learn content.

## Final Direction

The Learn section should become a guided educational product.

Images should make each path easier to follow:

```text
Learning path -> Concept image -> Article explanation -> Supporting glossary -> Trade review connection
```

The priority is clarity, trust, and user education. Visuals should help traders understand concepts without creating hype, false certainty, or financial-advice language.
