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
| `public/images/learn/chart-reading/support-resistance-candlestick-diagram.svg` | `/learn/support-and-resistance/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show price moving between support and resistance zones with recognizable red/green candles and volume. | Intro visual after quick definition. | Candlestick chart showing price bouncing near support and rejecting near resistance. | created | Supports the article topic, uses realistic candles and volume, avoids buy/sell language, and uses support/resistance as educational zones. | `8b7d4b28f20c90adf0d3301887dbf67b17c9ca08` |
| `public/images/learn/chart-reading/support-breaks-becomes-resistance.svg` | `/learn/support-and-resistance/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show how a broken support zone can later act as resistance during a retest. | Body section explaining support becoming resistance. | Candlestick chart showing broken support later acting as resistance during a retest. | created | Supports the lesson’s support/resistance role-reversal concept, avoids predictive language, and uses realistic candles. | `9594e68325fcacc512d2f772f2d69dd024c0a8eb` |
| `public/images/learn/chart-reading/resistance-breaks-becomes-support.svg` | `/learn/support-and-resistance/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show how a broken resistance zone can later act as support during a pullback. | Body section explaining resistance becoming support. | Candlestick chart showing broken resistance later acting as support during a pullback. | created | Supports the lesson’s role-reversal concept, avoids guarantee language, and shows realistic price behavior around a zone. | `f0febdfd9eab7b3a5a9ce68595f1787cd7f1c9e4` |
| `public/images/learn/chart-reading/bad-support-resistance-example.svg` | `/learn/support-and-resistance/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show the difference between cluttered exact-line drawing and cleaner support/resistance zones. | Common mistakes section. | Chart diagram comparing cluttered support and resistance lines with cleaner decision zones. | created | Supports the common mistakes section, improves user learning, and helps beginners understand why too many levels create confusion. | `003b0bbc79cafc546696b32312f6bc83e147bcf4` |

## Editor Verification Summary

Initial support/resistance SVG batch verification:

- All four visuals support the actual support and resistance lesson.
- Chart-based visuals use recognizable red and green candlesticks.
- Volume is included where useful.
- Labels use educational language, not buy/sell signals.
- No visual claims support or resistance guarantees a bounce, rejection, breakout, or continuation.
- Each visual has a specific article placement and alt text.
- The batch is appropriate for the gold-standard support/resistance article upgrade.

## Next Asset Batch Candidates

After the support/resistance article is verified, the next high-value SVG batch should likely support one of these:

1. Breakout article: clean breakout, failed breakout, breakout with volume confirmation.
2. SEC filings hub: filing map, shelf-to-offering flow, dilution risk flow.
3. Risk discipline path: FOMO loop, revenge trading loop, overtrading spiral.
4. Trade review path: trade timeline, planned vs actual risk, execution review timeline.
