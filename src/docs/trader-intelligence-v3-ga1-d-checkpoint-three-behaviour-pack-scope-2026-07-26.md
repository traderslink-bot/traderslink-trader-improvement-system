# GA1-D checkpoint three: Coach Behaviour Analytics Pack scope

## Branch and base

- Branch: `agent/trader-intelligence-v3-ga1-d-coach-behaviour-pack`
- Starting main commit: `17c299deaee25c7c8d82ebd73ee815f8c1ec6ad7`
- Controlling source: `src/docs/source-specifications/GA1-D Coach Trading Intelligence Foundation.docx` (retained unchanged)

## Current project focus

- Complete the Analytics Engine and the one user-facing Coach intelligence path first; do not spread work across incomplete agents or half-built engines.
- Coach expands only through verified current trade-data capabilities: analytics, behaviour findings, trends, evidence, limitations, unsupported-data responses, and Coach-ready structured findings.
- Build in the order current data can truthfully support. Missing data stays deferred or blocked rather than being approximated.
- Simulations are near-term support only for `rules_to_test` or already accepted GA1-C functionality. Notifications, market context, candle/setup detection, memory/profile, dashboards, and extra agent surfaces remain lower priority.

## Selected behaviour slice

This checkpoint composes existing GA1-A query authority and GA1-B presets into a bounded Coach behaviour pack. It will cover, with structured findings, bounded evidence, limitations, digest/replay identity, and minimum-sample handling:

- after-loss and after-win performance through the accepted GA1-B presets;
- first-trade, later-trade, and fourth-and-later sequence buckets through the accepted trade-sequence preset;
- repeat-ticker attempt performance through the accepted repeat-attempt preset;
- an explicit overtrading proxy limited to governed sequence buckets, not an invented daily threshold;
- the Coach behaviour-leak and behaviour-rule-to-test intent routes, composed only from the above verified results and existing rule-candidate keys.

The inventory also calls for after two losses, after three losses, and trading after a daily green or red state. Current query authority has no verified consecutive-loss-streak filter or pre-entry realised daily-state filter. This checkpoint will return explicit unsupported/blocked responses for those capabilities; it will not manufacture a proxy.

## Non-goals

- No new analytics calculator or query engine.
- No UI, LLM/chat, notifications, market/candle/setup work, memory/profile, dashboard, extra agent, or production/deployment work.
- No simulation expansion beyond existing `rules_to_test` keys.
- No full suite, browser/E2E, or production build.

## Acceptance evidence

- Focused Coach behaviour-pack coverage only, followed at the checkpoint boundary by TypeScript, changed-path ESLint, and `git diff --check`.
- The branch stops after a draft PR opens for independent audit. It must not merge, deploy, start checkpoint four, or start GA1-E.
