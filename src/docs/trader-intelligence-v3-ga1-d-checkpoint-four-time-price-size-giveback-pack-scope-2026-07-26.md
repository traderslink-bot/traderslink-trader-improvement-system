# GA1-D checkpoint four: Coach Time, Price, Size, Hold-Time, and Giveback Analytics Pack scope

## Branch and base

- Branch: `agent/trader-intelligence-v3-ga1-d-coach-time-price-size-giveback-pack`
- Starting main commit: `0ff79487bf5b62c6f7ddeea527411b4c0014154b`
- Controlling source: `src/docs/source-specifications/GA1-D Coach Trading Intelligence Foundation.docx` (retained unchanged)

## Current project focus

- Complete the Analytics Engine and the one user-facing Coach intelligence path first; do not distribute work across incomplete agents or half-built engines.
- Expand Coach only through verified current trade-data capabilities: analytics, behaviour findings, trends, evidence, limitations, unsupported-data responses, and Coach-ready structured findings.
- Build in data-authority order. Missing data remains deferred or blocked rather than inferred.
- Simulations are near-term support only for `rules_to_test` or accepted GA1-C functionality. Notifications, market context, candle/setup detection, memory/profile, dashboards, and extra agent surfaces remain lower priority.

## Selected analytics pack

This checkpoint composes existing GA1-A query authority and GA1-B presets into one related Coach analytics pack:

- time-of-day and session performance, including best/worst windows from bounded metric tables;
- price-bucket performance, with existing verified low-price boundaries extended to include the useful `$2` boundary;
- position-size and hold-time bucket performance, including quick-scalp versus longer-hold buckets;
- profit giveback and maximum intraday drawdown grouped by day;
- green/red day consistency from existing aggregate daily metrics;
- top-leak and top-strength intent routing across these existing capability results;
- existing deterministic rule keys only, emitted solely as `rule_to_test` candidates.

Every supported result retains its existing plan/result/evidence/digest identity and withholds findings below its minimum sample.

## Explicit unsupported boundary

- `losers_held_too_long` requires an exit-quality/alternative-outcome authority beyond realised hold-time and realised P/L.
- `winners_cut_too_early` requires the same absent exit-quality/alternative-outcome authority.

Neither capability is inferred from a hold-time bucket. They return structured unsupported responses with the missing authority named.

## Non-goals

- No second analytics calculator, UI, LLM/chat, notifications, market/candle/setup work, memory/profile, dashboard, extra agent, or production/deployment work.
- No simulation expansion beyond labeling existing candidate keys as `rule_to_test`.
- No full suite, browser/E2E, or production build.

## Acceptance evidence

- Focused checkpoint-four Coach coverage only, followed at the checkpoint boundary by TypeScript, changed-path ESLint, and `git diff --check`.
- The branch stops after a draft PR opens for independent audit. It must not merge, deploy, start checkpoint five, or start GA1-E.
