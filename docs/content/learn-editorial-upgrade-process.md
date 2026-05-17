# TradersLink Learn Editorial Upgrade Process

## Purpose

This document defines the full editorial workflow for turning the TradersLink `/learn/` content library into a guided educational learning journey.

The Learn section is no longer only an SEO content library. It should become a structured education experience that helps an end user move from beginner concepts to practical trading context, risk awareness, trade review, and eventually Trader Intelligence.

The goal is not to publish isolated articles. The goal is to build a learning product.

## Core Principle

Every Learn content piece should help the user move forward in a clear journey.

The intended user flow is:

```text
Start with the basics -> understand chart structure -> understand why stocks move -> understand risk -> avoid common mistakes -> practice and review -> improve with Trader Intelligence
```

## Source Planning Files

Future ChatGPT or Codex sessions should read these first:

```text
docs/content/learn-learning-journey-implementation-plan.md
docs/content/learn-visual-content-plan.md
docs/content/learn-editorial-upgrade-process.md
docs/content/learn-editorial-upgrade-tracker.md
```

Supporting source files:

```text
docs/content/trader-intelligence-seo-master-plan.md
docs/content/seo-writing-system-prompt.md
docs/content/seo-quality-checklist.md
docs/content/HANDOFF_2026-05-08.md
```

## What This Workflow Allows

This workflow allows ChatGPT or Codex to:

1. Review existing Learn articles as an editor.
2. Improve article structure for better learning.
3. Add learning-path context.
4. Add examples, checklists, review prompts, and next-step sections.
5. Add SVG educational diagrams when useful.
6. Add supporting metadata recommendations.
7. Identify gaps in the user learning journey.
8. Create new complete markdown articles when a gap blocks the journey.
9. Track each upgraded article from pre-review to complete.
10. Verify every upgraded article as an editor before marking it complete.

## What This Workflow Does Not Allow Unless Explicitly Requested

Do not create or edit JSX, HTML, CSS, React components, Next.js pages, production routes, production schemas, or production website files.

This is a content, education, editorial, planning, and asset-preparation workflow. Website implementation should happen only when explicitly requested.

## Learn Section Product Vision

The Learn section should feel like a guided trading education library built for active traders, small-cap traders, and Trader Intelligence users.

It should not feel like a flat blog archive or random glossary dump.

## Learning Journey Tracks

The editorial workflow should organize content into these major tracks:

1. Start Here For New Traders.
2. Chart Reading And Market Structure.
3. Candlestick Patterns In Context.
4. Volume, Liquidity, And Order Flow.
5. News, Catalysts, Filings, And Dilution.
6. Small-Cap, Float, And Short Squeeze Context.
7. Day Trading Workflow.
8. Trading Styles.
9. Risk, Discipline, And Psychology.
10. Execution And Trade Review.
11. Practice And Improvement.
12. Halts And High-Volatility Events.

Each article should be assigned to a primary learning track and, when useful, one or more secondary tracks.

## Content Levels

Each content piece should be tagged conceptually as one of these levels:

```text
Foundation
Practical
Advanced
Review
```

Foundation teaches the basic concept. Practical shows how traders use it. Advanced explains nuance, failure cases, edge cases, or market mechanics. Review shows how to review the concept in a journal, trade log, performance review, or Trader Intelligence.

## Pre-Editor Review

Before editing any article, perform a pre-editor review.

For each content piece, answer:

1. What is the article supposed to teach?
2. Which learning track does it belong to?
3. What level is it: Foundation, Practical, Advanced, or Review?
4. Is the article beginner-friendly enough for its place in the journey?
5. Does the article assume knowledge the user may not have yet?
6. Does the article need a previous lesson and next lesson?
7. Does the article need supporting glossary terms?
8. Does the article need one or more SVG visuals?
9. Does the article need a realistic example?
10. Does the article need a common mistakes section?
11. Does the article need a journal/trade review section?
12. Does the article need a soft Trader Intelligence bridge?
13. Does the article avoid buy/sell signals?
14. Does the article avoid guaranteed-outcome language?
15. Does the article fit the user journey or is there a gap before it?

## Upgrade Decision Types

After pre-editor review, assign one of these decisions:

```text
no_change_needed
light_upgrade
full_upgrade
gap_article_needed
visual_only_upgrade
metadata_only_upgrade
```

Use `gap_article_needed` when a new complete article should be created because the learning journey has a missing bridge.

## Allowed Article Enhancements

When improving a Learn article, add only useful learning value.

Allowed enhancements include:

1. Learning path placement note.
2. What to know before reading this.
3. Key takeaway section.
4. Realistic educational example.
5. Common mistakes section.
6. How traders use this concept section.
7. What can go wrong section.
8. How to review this in your journal section.
9. Trader Intelligence review bridge.
10. Previous/next lesson block.
11. Related glossary terms.
12. Simple checklist.
13. SVG educational diagram references.
14. Educational disclaimer updates.

Avoid filler, hype, unsupported claims, or promotional language.

## Recommended Article Structure For Upgraded Learn Content

A strong upgraded Learn article should generally follow this structure:

```text
YAML frontmatter
H1
Short plain-English intro
Learning path note
What this concept means
Why it matters
Realistic example
How traders use it
What can go wrong
Common mistakes
How to review it in your journal
Trader Intelligence connection
Related lessons
Related glossary terms
FAQ
Educational disclaimer
```

Not every article needs every section. Use editorial judgment.

## Learning Path Note Template

```text
This lesson is part of the [Track Name] learning path. It builds on [Previous Lesson] and leads into [Next Lesson].
```

## Previous/Next Lesson Template

```text
Continue The Learning Path
Previous: [Previous article]
Next: [Next article]
Related terms: [Term 1], [Term 2], [Term 3]
Review skill: [Trade review / execution review / risk review]
```

## Trader Intelligence Bridge Rules

The Trader Intelligence bridge should be helpful, not pushy.

Good example:

```text
Trader Intelligence is being built to help traders review how this type of setup showed up in their own trade history, including entries, exits, risk, and repeated behavior patterns.
```

Avoid anything that sounds like guaranteed profits, signals, or financial advice.

## Visual Enhancement Rules

Use `docs/content/learn-visual-content-plan.md` as the source of truth for visuals.

A content piece can have more than one SVG if multiple visuals improve learning.

Examples:

- Support and resistance may need a basic chart, support-becomes-resistance chart, resistance-becomes-support chart, and bad-level example.
- Breakout may need a clean breakout, failed breakout, and breakout-with-volume example.
- Dilution may need share-count before/after, offering flow, and warrant/convertible flow.
- Trade review may need a trade timeline, planned vs actual risk, and mistake pattern loop.

## SVG Quality Rules

Every SVG should:

1. Support the actual content.
2. Use realistic and recognizable trading visuals when the topic is chart-based.
3. Use red/green candlesticks for chart examples when appropriate.
4. Use volume bars where volume matters.
5. Use flowcharts for filings, dilution, and process topics.
6. Use loops/checklists for psychology and risk topics.
7. Avoid buy/sell signal language.
8. Avoid guarantee language.
9. Include title and desc tags when possible.
10. Have matching alt text in the asset manifest.
11. Be readable on mobile.
12. Use consistent TradersLink styling.

## Image Asset Manifest

When visual assets are created, track them in:

```text
docs/content/learn-image-asset-manifest.md
```

Recommended manifest columns:

```text
Asset file
Article/slug
Learning track
Visual type
Purpose
Suggested placement
Alt text
Status
Editor verification
Commit SHA
```

## Gap Article Rules

The assistant may create complete new markdown content pieces when the learning journey has a clear gap.

A gap article is justified when:

1. Users need a bridge between two concepts.
2. A learning path jumps from beginner to advanced too quickly.
3. A hub page is needed to guide a track.
4. A topic is referenced repeatedly but no article explains it.
5. The Learn page needs a start-here or path overview article.

Potential high-value gap articles:

```text
/learn/start-here/
/learn/how-to-use-traderslink-learn/
/learn/chart-reading-path/
/learn/news-and-filings-path/
/learn/trade-review-path/
/learn/risk-discipline-path/
/learn/practice-and-improvement-path/
```

The user has approved creating complete articles/content pieces when a gap is found in the end-user learning journey. Still, explain the gap in the tracker, mark the new article as a gap article, keep it educational, avoid production website implementation, and update the handoff if the article count changes.

## Post-Edit Verification

After editing or creating a content piece, perform an editor verification pass.

Confirm:

1. The content teaches the concept clearly.
2. The article fits its learning track.
3. The article level is appropriate.
4. The previous/next flow makes sense.
5. Examples are realistic and educational.
6. Visuals support the lesson.
7. No visual is decorative filler.
8. No buy/sell signals were added.
9. No guaranteed-outcome claims were added.
10. Internal links support the journey.
11. The Trader Intelligence bridge is useful and not pushy.
12. The article remains educational and non-financial-advice.
13. Mobile readability is considered.
14. The tracker was updated.
15. The handoff was updated if needed.

## Tracking Status Values

Use these statuses in `docs/content/learn-editorial-upgrade-tracker.md`:

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

## Recommended Upgrade Order

Upgrade the Learn section in this order:

1. Start Here For New Traders.
2. Chart Reading And Market Structure.
3. News, Catalysts, Filings, And Dilution.
4. Risk, Discipline, And Psychology.
5. Execution And Trade Review.
6. Volume, Liquidity, And Order Flow.
7. Day Trading Workflow.
8. Practice And Improvement.
9. Candlestick Patterns.
10. Trading Styles.
11. Halts And High-Volatility Events.

## Gold Standard Article First

Before upgrading many articles, create one gold-standard upgraded article.

Recommended first model article:

```text
/learn/support-and-resistance/
```

Why:

- It is beginner-friendly.
- It supports chart reading.
- It can use multiple realistic SVGs.
- It connects to breakouts, fakeouts, reclaims, and trade review.
- It can become the template for future Learn upgrades.

Alternative model article:

```text
/learn/sec-filings/
```

## Full Workflow From Start To Finish

### Phase 1: Planning Foundation

Required files:

```text
docs/content/learn-learning-journey-implementation-plan.md
docs/content/learn-visual-content-plan.md
docs/content/learn-editorial-upgrade-process.md
docs/content/learn-editorial-upgrade-tracker.md
```

### Phase 2: Pre-Editor Review

Review articles by learning track and update the tracker with current status, learning path, level, needed upgrades, visual needs, and gap article needs.

### Phase 3: Gold Standard Upgrade

Upgrade one key article completely, recommended `/learn/support-and-resistance/`.

### Phase 4: Track-Based Upgrades

For each track: pre-review all articles, identify gaps, create needed gap articles, add visuals where useful, add learning flow sections, verify as editor, update tracker, and update handoff.

### Phase 5: Codex Website Build Support

After planning and content upgrades are stable, Codex can build the `/learn/` guided hub, learning path cards, path selector, track hub pages, previous/next article components, optional visual rendering, and optional metadata-driven navigation.

## Important Final Instruction

Do not treat this as only SEO work.

From this point forward, the Learn section work should be treated as:

```text
Educational learning journey design + editorial improvement + visual learning support + Codex-ready website planning.
```

SEO still matters, but it should support the end-user learning journey, not replace it.
