# ADR: GA1-B Evidence Retrieval, Similar Trade Search, and Execution-Only Analytics Pack 1

**Date:** 2026-07-25 America/Toronto  
**Status:** implementation candidate for independent audit  
**Base:** `da5f40f5217f0c6501086c8fead55b3dd6ae4c6b`  
**Branch:** `agent/trader-intelligence-v3-ga1-b-evidence-analytics-pack`

## Decision

GA1-B extends the accepted GA1-A generic query gateway without adding a second
query, financial-calculation, evidence, comparison, or replay system. The
implementation is domain-only and read-only.

It adds three content-addressed result families:

- bounded evidence retrieval over an already verified GA1-A result;
- deterministic similar-trade search over GA1-A row semantics;
- ten governed execution-only presets that compile to GA1-A plans and, for
  `compare_periods`, GA1-A comparison.

## Authority and boundaries

Every GA1-B result is bound to GA1-A's query plan, verified result, dataset
derivation, partition, owner/account/currency scope, and metric registry.
Evidence retrieval additionally binds a selected result/group/metric/evidence/
trade target and never manufactures trade or execution references. Similarity
uses only verified execution-only row semantics; it uses no embedding, model,
subjective score, raw database handle, or broker CSV.

The application adapter accepts only the existing read-only snapshot authority
source and delegates to GA1-A's gateway source contract. It exposes no write
capability, database handle, parser, credential, browser API, route, or model
authority.

## Presets

The governed v1 presets are `analyze_performance_by_price_range`,
`analyze_time_of_day`, `analyze_trade_sequence_performance`,
`analyze_after_loss_behavior`, `analyze_after_win_behavior`,
`analyze_ticker_repeat_attempts`, `analyze_holding_time`,
`analyze_long_vs_short`, `analyze_position_size_performance`, and
`compare_periods`.

Each provides a content digest, one or two validated GA1-A plans, bounded
evidence, exact metrics, declared minimum sample/unavailable/outlier policy,
and structured-only wording boundaries. No preset makes causal, predictive, or
trading recommendation claims.

## Limits and honesty

Evidence references are bounded by trade and execution limits. Similar matches
and near misses are bounded and deterministically ordered. Missing row
semantics remain explicitly unavailable; zero-match output is a valid exact
result. Source exclusions remain sourced by GA1-A and are not reassigned to a
group when no exact group membership exists.

## Registry follow-up

The existing metric registry now distinguishes direct analytical-row fields
from derived semantics for daily aggregation, attempts-per-symbol, and
repeat-attempt chronology. This correction changes metadata only; shared
accumulator calculations remain GA1-A-owned.

## Exclusions

No simulation engine, market/candle integration, Levels System, EODHD/Yahoo,
AI/model call, UI, route, chart, broker execution, database write/migration,
payment, auth redesign, Academy work, deployment, or production operation is
part of GA1-B.
