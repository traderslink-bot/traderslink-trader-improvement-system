# TradersLink Learn Image Asset Manifest

## Purpose

This manifest tracks educational SVG and image assets created for the TradersLink Learn section.

The Learn section is an educational learning journey, not just an SEO article library. Visuals should support real learning, reduce confusion, and help users follow concepts from beginner to practical review.

## Source Documents

Use this manifest with:

```text
docs/content/learn-visual-content-plan.md
docs/content/learn-editorial-upgrade-process.md
docs/content/learn-editorial-upgrade-tracker.md
docs/content/learn-learning-journey-implementation-plan.md
```

## Asset Status Values

```text
planned
created
wired_to_content
editor_verified
needs_revision
paused
```

## Visual Type Values

```text
realistic_candlestick_chart
filing_flow_diagram
risk_loop_diagram
workflow_diagram
checklist_graphic
comparison_graphic
journey_map
```

## Asset Table

| Asset File | Related Article/Slug | Learning Track | Visual Type | Purpose | Suggested Placement | Alt Text | Status | Editor Verification | Commit SHA |
|---|---|---|---|---|---|---|---|---|---|
| `public/images/learn/chart-reading/support-resistance-candlestick-diagram.svg` | `/learn/support-and-resistance/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show price moving between support and resistance zones with recognizable red/green candles and volume. | Intro visual after quick definition. | Candlestick chart showing price bouncing near support and rejecting near resistance. | editor_verified | Supports the article topic, uses realistic candles and volume, avoids buy/sell language, and uses support/resistance as educational zones. | `8b7d4b28f20c90adf0d3301887dbf67b17c9ca08` |
| `public/images/learn/chart-reading/support-breaks-becomes-resistance.svg` | `/learn/support-and-resistance/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show how a broken support zone can later act as resistance during a retest. | Body section explaining support becoming resistance. | Candlestick chart showing broken support later acting as resistance during a retest. | editor_verified | Supports the lesson’s support/resistance role-reversal concept, avoids predictive language, and uses realistic candles. | `9594e68325fcacc512d2f772f2d69dd024c0a8eb` |
| `public/images/learn/chart-reading/resistance-breaks-becomes-support.svg` | `/learn/support-and-resistance/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show how a broken resistance zone can later act as support during a pullback. | Body section explaining resistance becoming support. | Candlestick chart showing broken resistance later acting as support during a pullback. | editor_verified | Supports the lesson’s role-reversal concept, avoids guarantee language, and shows realistic price behavior around a zone. | `f0febdfd9eab7b3a5a9ce68595f1787cd7f1c9e4` |
| `public/images/learn/chart-reading/bad-support-resistance-example.svg` | `/learn/support-and-resistance/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show the difference between cluttered exact-line drawing and cleaner support/resistance zones. | Common mistakes section. | Chart diagram comparing cluttered support and resistance lines with cleaner decision zones. | editor_verified | Supports the common mistakes section, improves user learning, and helps beginners understand why too many levels create confusion. | `003b0bbc79cafc546696b32312f6bc83e147bcf4` |
| `public/images/learn/chart-reading/support-resistance-zones-vs-lines.svg` | `/learn/how-to-draw-support-and-resistance/` | Chart Reading And Market Structure | realistic_candlestick_chart | Compare exact support/resistance lines with cleaner zones that capture real candle reactions. | Step 1 section about zones, not exact lines. | Educational chart comparing exact support and resistance lines with cleaner support and resistance zones. | editor_verified | Supports the article’s zones-vs-lines teaching point, uses recognizable candles, and avoids false precision or buy/sell language. | `1bc433405e7f8ad4aaa8f4dd615f22926bcbf839` |
| `public/images/learn/chart-reading/mark-obvious-reaction-levels.svg` | `/learn/how-to-draw-support-and-resistance/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show how to start with obvious repeated reaction areas instead of minor candle noise. | Step 2 section about obvious reactions. | Candlestick chart showing how to mark only obvious support and resistance reaction areas. | editor_verified | Supports the article’s level selection process, teaches pre-trade visibility, and avoids hindsight-based level drawing. | `8773da36c3f09bf66724314fa855e360d967345f` |
| `public/images/learn/chart-reading/near-price-actionable-levels.svg` | `/learn/how-to-draw-support-and-resistance/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show keeping the closest actionable support and resistance while leaving far-away levels for later. | Step 4 section about keeping current-plan levels. | Chart showing nearest actionable support and resistance levels around current price. | editor_verified | Supports the article’s practical workflow, reduces chart clutter, and keeps level drawing tied to the current trade plan. | `578247cbce1d0abd0245fa87c998b38533685618` |

## Editor Verification Summary

Initial support/resistance SVG batch verification:

- All four visuals support the actual support and resistance lesson.
- Chart-based visuals use recognizable red and green candlesticks.
- Volume is included where useful.
- Labels use educational language, not buy/sell signals.
- No visual claims support or resistance guarantees a bounce, rejection, breakout, or continuation.
- Each visual has a specific article placement and alt text.
- The batch is appropriate for the gold-standard support/resistance article upgrade.

How-to-draw support/resistance SVG batch verification:

- All three visuals support the actual drawing-levels lesson.
- Visuals explain zones versus exact lines, obvious reaction areas, and actionable near-price levels.
- Chart-based visuals use recognizable red and green candlesticks.
- Labels avoid buy/sell signal language and avoid guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.
- The batch is appropriate for the second Chart Reading And Market Structure upgrade.

## Next Asset Batch Candidates

After the first two Chart Reading articles, the next high-value SVG batch should likely support one of these:

1. Support Levels article: clean support hold, support break, support reclaim.
2. Resistance Levels article: clean resistance rejection, resistance break, failed breakout.
3. Breakout article: clean breakout, failed breakout, breakout with volume confirmation.
4. SEC filings hub: filing map, shelf-to-offering flow, dilution risk flow.
5. Risk discipline path: FOMO loop, revenge trading loop, overtrading spiral.
6. Trade review path: trade timeline, planned vs actual risk, execution review timeline.
