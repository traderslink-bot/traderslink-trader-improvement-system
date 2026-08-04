# Analytics Agent v1 Project Plan and Progress

## Product boundary

Analytics Agent v1 is the user-facing, deterministic consumer of the Trade
Execution Analytics Engine. It translates supported plain-English execution
questions into governed query plans and returns only engine-backed answers.
It does not read raw trade history, calculate metrics, give trading advice, or
infer market/candle/setup/exit-quality/planned-risk claims.

## Delivery sequence

1. **Foundation — complete on this branch.** Deterministic request and answer
   contracts, question router, capability-to-plan mapping, scope enforcement,
   bounded engine execution, unsupported responses, safe wording, and focused
   fixtures.
2. Execution Question Coverage — expand the supported inventory using only
   verified engine capabilities and governed presets.
3. Answer Quality and Evidence UX — richer display hints and evidence review.
4. Dashboard / Chat Integration — application service and rendering surface.
5. User Review Reports — daily, weekly, monthly, and custom reviews.
6. Guardrails and Final Hardening — representative, authority, and scale
   acceptance coverage.

## Foundation acceptance record

- Agent code lives in `src/lib/trader-intelligence-v3/analytics/agent` and is
  separate from `analytics/query`, `analytics/coach`, and `analytics/simulation`.
- The router is deterministic and model-free. It recognizes core performance,
  time, ticker, price, prior outcome, sequence, repeat attempt, giveback,
  fees, and data-quality questions.
- Every supported intent issues a content-addressed query plan to the existing
  read-only engine. The answer packet preserves plan, result, and execution
  receipt identities plus bounded evidence.
- The caller owner scope and account scope must each exactly match the
  partition authority. Foundation does not silently narrow a broader partition.
- Market/setup, exit-quality, planned-risk, and unknown questions return a
  structured unsupported packet with the required data and a safe alternative.
- Fewer than three completed matching trades return `insufficient_sample` and
  retain the verified result rather than promoting a pattern.

## Current resume point

## 2026-07-27 integrated completion record

Foundation and the complete supported execution-question inventory are now
implemented across the merged Foundation, Coverage Pack A, Coverage Pack B,
and this integrated completion branch. The supported deterministic inventory
includes performance, time/session, ticker, price, prior outcomes and streaks,
sequence/repeat behavior, holding time, direction, size, explicit period
comparison, daily/weekly/monthly review, pre-entry daily state/path, daily
transitions, best/worst day and price range, a limited ticker P/L summary,
drawdown, fees, and data quality.

The focused session extension adds deterministic session comparison and explicit
premarket, regular-session, and after-hours/post-market execution questions.
It reuses only the engine's existing `session` grouping and filter; it does not
introduce market-data session analysis or change hourly time-of-day semantics.

The completion branch adds a typed composition contract for caller-supplied
execution filters, groupings, metrics, and P/L ranking. It is bounded and may
not inject account, currency, or date filters: owner/account authority stays
exact, dates remain explicit request context, and the existing engine validates
every final query plan. Missing primary or comparison ranges return a
content-addressed `needs_clarification` packet rather than inferred dates.

Answer packets now expose supporting and counterexample evidence separately,
explicit execution-only not-proven boundaries, deterministic drill-down
contracts, replay identities, and a digest-bound review scorecard. Focused
golden questions protect the deterministic intent and plan behavior.

Dashboard/chat UI, model parsing, Coach, candle/market authority, simulations,
reports/scheduling, notifications, ingestion, deployment, and financial advice
remain deliberately outside this completed engine-consumer boundary.

The previous Stage 2 wording below is superseded by the integrated completion
record above. Period comparison still requires explicit primary and baseline
date ranges; the agent does not infer either range from prose. UI, chat/model
routing, reports, market/candle authority, and Coach behavior remain out of
scope.
