# GA1-D checkpoint five: Coach Summary, Ranking, and Actionable Findings Pack scope

## Branch and base

- Branch: `agent/trader-intelligence-v3-ga1-d-coach-summary-ranking-findings-pack`
- Starting main commit: `52dc5f509b3c052ff501dd2c9056aaddf188b096`
- Controlling source: `src/docs/source-specifications/GA1-D Coach Trading Intelligence Foundation.docx` (retained unchanged)

## Current project focus

- Complete the Analytics Engine and one user-facing Coach intelligence path first; do not spread work across incomplete agents or half-built engines.
- Expand Coach through verified current trade-data analytics, behaviour findings, trends, evidence, limitations, unsupported-data responses, and Coach-ready structured findings.
- Build in data-authority order. Missing data remains deferred or blocked rather than inferred.
- Simulations are near-term support only for `rules_to_test` or accepted GA1-C functionality. Notifications, market context, candle/setup detection, memory/profile, dashboards, and extra agent surfaces remain lower priority.

## Selected composition layer

Checkpoint five composes freshly executed, existing verified Coach capability
results into one versioned deterministic summary result. It adds no analytics
calculator, LLM reasoning, or unverified cross-metric score.

The summary returns source capability/result identities, top negative and
positive performance findings, highest-confidence selection, weak/insufficient
and unsupported-data summaries, limitation warnings, bounded evidence coverage,
next-focus selection, and `rule_to_test` ranking from existing candidate keys.

## Ranking and confidence policy

- Findings are eligible for actionable promotion only when the source result is
  `verified_execution_only`, meets the capability minimum sample, has a primary
  finding, and has bounded evidence.
- Confidence is a deterministic category, not a numeric score: `strong` is an
  eligible result with no limitations; `qualified` is an eligible result with
  limitations; `weak` has limited authority, insufficient sample, or no
  evidence; `unsupported` has a missing-data response.
- P/L performance findings are ranked only against other P/L findings in the
  same verified currency partition. Giveback money, drawdown money, and
  day-consistency ratio findings are returned in their own ranked categories;
  they are never naively compared against P/L or each other.
- Ties use capability key, result digest, then group identity ordering. Rules
  are ranked by deterministic confidence category and identity only; none is
  described as a proven improvement.

## Explicit boundary

The summary does not turn unsupported or insufficient source results into
actionable findings. It reports them in structured weak/unsupported sections.
It does not infer facts absent from source Coach results or create natural-
language coaching paragraphs.

## Non-goals

- No new analytics calculator, UI, LLM/chat, notifications, market/candle/setup work, memory/profile, dashboard, extra agent, simulation expansion, production/deployment, full suite, browser/E2E, or production build.

## Acceptance evidence

- Focused checkpoint-five Coach tests, then TypeScript, changed-path ESLint,
  and `git diff --check` at the checkpoint boundary.
- The branch stops after a draft PR opens for independent audit. It must not
  merge, deploy, start checkpoint six, or start GA1-E.
