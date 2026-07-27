# v3 Execution Analytics Dashboard Operationalization Plan

## Status

Milestone 0 was completed locally on 2026-07-27. The direction lock, legacy
runtime inventory, and disposable-data reset procedure are recorded here and in
[the Milestone 0 inventory](./v3-legacy-execution-runtime-inventory.md). No
legacy route, database, import, or dashboard consumer was changed. Milestone 1
is the next implementation milestone.

## Decision

The Trade Execution Analytics Engine v3 is the only planned authority for
execution-derived analytics. The existing SQLite saved-trade/analytics store is
disposable test data. Do not migrate it, convert it to v3, preserve it as a
fallback, or use it to fill a missing v3 result.

The eventual runtime has one path:

~~~text
raw broker CSV
  -> v3 source-document and execution authority
  -> v3 FIFO and analytical dataset authority
  -> v3 deterministic query engine
  -> authenticated server-only dashboard adapter
  -> normal dashboard panels and stricter embedded-AI tool wrapper
~~~

Until the v3 import-to-dashboard smoke path succeeds, the old SQLite path
remains temporarily operational but is a retirement target, not an alternative
execution-analytics owner. Normal panels and embedded chat are parallel
consumers of the same server-only v3 adapter. Neither calculates financial
analytics.

## Scope and boundaries

This work connects v3 broker import, durable authority, verified dataset and
partition resolution, a server-only dashboard adapter, normal dashboard panels,
and a governed embedded-AI consumer. It does not implement candle, market-data,
VWAP, setup/optimal-exit, Coach, simulation expansion, LLM-memory,
notifications, deployment, or a second analytics engine.

| Layer | Owns | Must not do |
| --- | --- | --- |
| v3 ingestion | Raw broker bytes, source identity, validation, accepted/rejected coverage | Infer incomplete rows or use the legacy importer |
| v3 persistence | Documents, canonical executions, FIFO inputs, receipts | Store duplicate dashboard totals |
| v3 query engine | Exact evidence-linked analytics and unavailable states | Render UI or trust browser owner scope |
| Dashboard adapter | Authorization, scope/dataset resolution, validation, packet serialization | Recalculate analytics or expose unrestricted raw data |
| Dashboard UI | Formatting and rendering packets | Calculate from displayed rows or suppress limitations |
| Embedded AI | Governed requests and explanations | Estimate, infer, or fabricate analytics |

## Required runtime contracts

Every v3 import must preserve a source-document receipt/digest; attempted,
accepted, and rejected counts; canonical executions and correction/bust
relationships; owner/account/broker/source/currency/timestamp authority; charge
coverage; and dataset/partition receipts. Rejected rows are quality facts, not
financial authority. Local-time rows remain unavailable until a governed
timezone/DST policy exists. Combined charges remain combined; a named commission
metric requires complete reconciled charge-kind allocation.

The one server-only resolver accepts authenticated owner scope plus account,
currency, and date scope, and returns a 'VerifiedTradeQueryDatasetSource' with
a compatible 'AnalyticalPartitionReceipt'. It enforces isolation, uses only
persisted v3 authority, isolates currencies, returns honest empty/unavailable
states, and binds responses to authority receipts. It has no SQLite or legacy
migration fallback.

The server-only adapter exposes generic query-plan-backed operations:

| Operation | Dashboard use |
| --- | --- |
| 'getCapabilities' | Enable/disable views and explain missing authority |
| 'getOverview' | Headline P/L, outcomes, fees, sample/data quality |
| 'getPerformanceSeries' | Period chart and period table |
| 'getBreakdown' | Ticker, time, session, direction, price, size, hold-time, sequence, repeat-attempt views |
| 'getDistribution' | Histogram, quartiles, tails, outliers |
| 'getAttribution' | Contribution and period comparison |
| 'getEvidencePage' | Bounded drill-down evidence |
| 'getFindings' | Evidence-backed optional insights and later AI tools |

Each response retains metric key, exact value/ratio, unit, availability, query,
result, and evidence identity, sample disclosures, limitations, and unsupported
codes. Presets compile to generic v3 query plans; a card never owns a second
calculation. Browser code must not import 'analytics/query/' internals.

Server components may call the adapter directly. Interactive controls may use a
versioned authenticated namespace such as
'/api/intelligence/execution-analytics/v1/...'. Every request derives owner
identity from authentication, validates account/currency/date/filters/grouping/
metrics/ordering/pagination against v3 registries, retains v3 limits (or
stricter ones), and rejects arbitrary expressions, SQL, paths, and unbounded
evidence requests. No client-side currency conversion or fee-label inference is
allowed.

The eventual AI wrapper is stricter than dashboard rendering: capability
discovery first, packet identity stored in tool state, no raw execution rows,
no metric calculation, no unsupported inference or causal claim, no
chart/candle answer from execution data, preserved limitations/sample state,
and date-scope clarification. It only begins after the owner accepts the tested
Milestone 4 dashboard design.

## Milestones

### Milestone 0 — Direction lock and disposable SQLite retirement rule — complete

- Record that v3 has no SQLite conversion, fallback, or parallel runtime.
- Inventory the legacy execution routes solely to plan later retirement.
- Define the reversible disposable-data reset procedure.
- Keep the store and routes untouched until v3 import-to-dashboard proof.

Exit: v3 is the documented future execution-analytics owner; the legacy SQLite
path is explicitly temporary and has no migration/fallback role.

### Milestone 1 — v3 import, persistence, and restart proof

- Connect an import entrypoint to v3 parsing and durable v3 authority.
- Import a disposable broker CSV through v3, restart, and resolve the same
  dataset/partition/query identities.
- Cover corrections, rejected receipts, charge coverage, owner/account
  isolation, and multi-currency behavior.

Exit: fresh broker data is durable v3 source authority readable without legacy
data.

### Milestone 2 — Dataset/partition resolver and server-only adapter foundation

- Implement the owner/account/currency/date resolver.
- Implement capabilities, overview, and generic grouped breakdowns.
- Return client-safe, identity-bound packets and cover authorization, invalid
  requests, empty data, unsupported metrics, and bounded limits.

Exit: server code can render core execution analytics from v3 only.

### Milestone 3 — Stable dashboard contract and formatting-only view models

- Add period series, distributions, attribution, evidence pagination, and
  findings operations.
- Add typed client-safe contracts, fixtures, and formatting-only table/chart/
  limitation/evidence view models.

Exit: dashboard work can proceed without touching v3 internals.

### Milestone 4 — Normal dashboard panels

- Build overview, period chart, ticker/time/session views, limitations, and
  evidence drill-down first; add remaining execution-only panels incrementally.
- Keep candle and Coach panels behind their own providers.

Exit: every execution value is traceable to a v3 packet and the owner has
tested and accepted the design.

### Milestone 5 — Embedded dashboard AI consumer

- Start only after Milestone 4 acceptance.
- Add the stricter server-only wrapper over the shared adapter and verify all
  packet identity, limitation, unsupported-claim, raw-row, calculation,
  causation, and chart/candle guardrails.

Exit: chat explains the same governed v3 packets without becoming an engine.

### Milestone 6 — Legacy SQLite/test-store retirement

- Confirm imports, reads, drill-downs, and AI tools use v3 only.
- Remove legacy execution-analytics read paths, then reset/delete disposable
  SQLite test data and dead UI dependencies.

Exit: one v3 execution import/read/query path remains.

## Verification

At each milestone, run focused import, adapter, or dashboard-contract tests and
the relevant v3 engine gate. A rendered card alone is not proof of financial
correctness. Completion evidence must prove raw-byte ingestion, restart identity,
owner/account isolation, packet equality, honest unavailable/limited states,
bounded evidence identity, and (when applicable) AI-wrapper guardrails.

## Dashboard handoff rule

At Milestone 3, hand the dashboard session this plan, the capability catalog,
adapter contracts, and fixtures. The dashboard must not import query internals,
use legacy execution calculations, calculate displayed values, use
chart/candle/Coach data to fill execution metrics, or hide unavailable,
insufficient-sample, or limitation states.
