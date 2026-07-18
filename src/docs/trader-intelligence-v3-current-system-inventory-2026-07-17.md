# Trader Intelligence v3 Current-System Inventory

Date: 2026-07-17
Gate: GA0-A1 containment and architecture boundaries
Branch: `agent/trader-intelligence-v3-ga0-a1-containment`

## Scope and conclusion

The current Trader Intelligence implementation is a useful local single-owner prototype, not a hosted or production-ready v3 system. GA0-A1 preserves working code behind a fail-closed exact-loopback owner boundary and records what must later be adapted, replaced, or retired. It does not promote legacy calculations, demo identity, SQLite persistence, provider coupling, chart values, or coaching output to v3 authority.

Trader Intelligence and Academy are separate applications. GA0-A1 does not modify Academy code or use Academy progress, roles, products, or entitlements. The provisional Discord session adapter remains isolated future code, but `private_hosted` is non-operational and no accepted runtime profile can reach it.

## Machine-readable route inventory

`src/lib/trader-intelligence-v3/contracts/route-containment.ts` is the authoritative per-route GA0-A1 inventory. Every entry records:

- module and route path;
- allowed methods and containment classification;
- authentication, authorization, mutation, cache, and repository policies;
- current responsibility and consumers;
- present source-of-truth layer and deployment assumptions;
- private-alpha readiness;
- `preserve`, `adapt`, `legacy_provider`, `retire`, or `out_of_scope` disposition;
- migration or adapter requirement;
- known risks, test reference, and replacement condition.

The matrix contains exactly 82 modules:

| Surface | Count | GA0-A1 classification | Action |
|---|---:|---|---|
| Owner-facing `/intelligence` pages | 43 | `owner_read` | Require exact owner access and private no-store rendering. |
| Local diagnostic/admin pages | 8 | `internal_diagnostics` | Permit only in explicit `local_only`; return not found in private-hosted mode. |
| Owner-facing `/api` handlers | 19 | `owner_read` or `owner_mutation` | Authorize before handler/repository access; check Origin for mutations. |
| Diagnostic `/api` handlers | 6 | `internal_diagnostics` | Permit only in explicit `local_only`. |
| Legacy level-delivery provider APIs | 6 | `local_only_or_disabled` | Keep local provider compatibility; disable in private-hosted mode. |

`route-containment.test.ts` and the architecture script scan every App Router API with TypeScript AST inspection, discover Trader Intelligence and legacy journal dependencies plus static `/api` references from Intelligence client code, and compare the result with the matrix. Exported methods, wrapper calls, and wrapper module paths must match exactly, so a new journal prefix cannot silently escape classification.

## Current-system component inventory

| Path or area | Responsibility and current consumers | Current source of truth and assumptions | Private-alpha readiness | Disposition | Adapter or migration requirement | Known risks and evidence |
|---|---|---|---|---|---|---|
| `app/intelligence/**` | 51 product, admin, calibration, and debug pages consumed by the owner in the App Router. | Legacy v2 read models, demo scope, and trusted-local rendering. | Owner pages are contained; eight diagnostic pages are local-only. The data contracts are not v3 authority. | `adapt` | Replace each repository-backed read with an owner-scoped v3 query after its contract is accepted. | Parallel server rendering can start child work before a layout completes, so direct data pages also guard before repository access. Exact route coverage is tested. |
| `app/api/analytics`, `coach`, `review`, and `trader-analytics` | Returns saved analytical and coaching presentation models to Intelligence pages. | `saved-trader-analytics-data.ts` and legacy report/read-model logic. | Owner-contained or local-only, depending on the route. | `adapt` | Introduce v3 query services accepting server-derived owner context. | Current claims, denominators, evidence, and number semantics are prototype-grade. Legacy tests plus containment tests remain. |
| `app/api/import-batches/**` and `app/api/import-dry-run/**` | Preview, inspect, commit, discard, repair, and resume imports. | Route-created SQLite repository plus legacy import services and demo scope. | Contained for one owner; unsafe methods require an approved exact Origin. | `adapt` | Move construction behind an owner-scoped repository/service port in GA0-A2/A3. | Direct repository construction and request-lifecycle work remain. Existing saved-import route tests cover behavior; GA0-A1 tests cover pre-handler denial. |
| `app/api/trades/**` | Lists, reads, annotates, reviews, and manually closes trades. | Direct SQLite access with `DEMO_USER_ID`. | Contained, not tenant-correct. | `adapt` | Pass internal owner identity into a v3 service and replace lifecycle override semantics. | Demo identity and review/lifecycle coupling remain. Owner and mutation negative tests cover the new boundary. |
| `app/api/level-analysis/**` and `app/api/admin/level-analysis/**` | Receives and inspects level-delivery and trade-link records for legacy analysis. | Local `levels-system-v2` delivery/link services. | Disabled in private-hosted mode; local compatibility only. | `legacy_provider` | Define a later provider adapter only after the v3 support/resistance gate. | Caller-supplied scope and provider coupling are unsafe for hosted authority. Existing level-analysis tests remain; matrix tests enforce disablement. |
| `src/lib/execution-sources/csv/broker-execution-csv-import.ts` | Detects and parses IBKR, Moomoo, Webull, Robinhood, Schwab, and generic execution CSVs. Used by preview/import flows and fixtures. | One large heuristic parser using string/number conversion and broker-column mappings. | Preserved behind containment only. | `adapt` | Split broker adapters behind a canonical exact execution ingestion contract in GA0-A2. | Ambiguous formats, locale/timezone behavior, unsafe numeric authority, parser limits, and private-data handling require hardening. Parser fixtures and import tests exist. |
| `src/lib/execution-sources/import-fingerprints.ts` | Produces batch/execution fingerprints for import behavior. | Small non-cryptographic 32-bit stable hash. | Not acceptable as v3 identity. | `retire` | Replace with canonical serialization plus cryptographic digest and explicit collision/duplicate states in GA0-A2. | Collision risk and insufficient identity semantics. Current import tests only preserve legacy behavior. |
| `src/lib/raw-trade-timeline/**` | Normalizes executions/candles, reconstructs position state, segments timelines, and derives execution/trade signals. Consumed by pattern detection and analysis. | JavaScript numbers and legacy lifecycle/reconstruction policy. | Useful migration evidence, not v3 financial truth. | `adapt` | Rebuild canonical execution, inventory, temporal, and correction layers in GA0-A2/A3; then selectively port deterministic derivations. | Exactness, short/flip handling, prior inventory, corrections, bitemporal truth, and lifecycle authority remain unresolved. Extensive unit/integration coverage exists. |
| `src/lib/pattern-detection/**` | Detects entry, exit, position, frequency, duration, closure, and scaling patterns from timelines. | Deterministic legacy pattern rules and registry. | Preserved as calibration evidence only. | `adapt` | Rebase eligible patterns on accepted v3 facts/manifests after GA0-A3. | Threshold calibration and evidence capability may overstate meaning. Layer 2 verification guards current behavior. |
| Legacy pattern normalization/scoring modules under `src/lib/**` | Normalizes detections, resolves conflicts, scores confidence/priority, and prepares user-facing behavior. | Legacy deterministic rules, registries, and thresholds. | Not v3 authority. | `adapt` | Port only patterns that pass coverage, evidence, and usefulness gates. | Fixed thresholds and confidence language can over-certify incomplete data. Layer 3 verification and unit tests exist. |
| `src/lib/execution-feedback/**` | Creates execution-feedback facts, summaries, batches, and debug output. | Legacy timeline and pattern inputs with JavaScript numbers. | Debug route is local-only. | `adapt` | Rebuild on accepted exact facts and evidence references. | Summary language can imply causal certainty; debug contracts may expose detail. Existing execution-feedback tests remain. |
| `src/lib/user-facing-behavior/**` | Maps internal pattern results to owner-facing labels and coaching-like explanations. | Fixed mapping registry and templates. | Contained legacy presentation only. | `adapt` | Require calibrated v3 claims, capability, exclusions, limitations, and evidence before reuse. | Wording may exceed underlying evidence and must not become AI grounding yet. Mapping tests exist. |
| `src/lib/trader-analytics/product/import-commit/**` | Defines commit planner, SQLite persistence, migrations, saved trades/reports/imports, and demo constants. | Local SQLite file; temp-directory fallback in production/serverless; `DEMO_WORKSPACE_ID`, `DEMO_USER_ID`, and `DEMO_ACCOUNT_ID`. | Local prototype only. Private-hosted deployment contract requires a private database, but the legacy repository is not promoted. | `legacy_provider` | Add a v3 repository port, owner scope, durable private persistence, migration/backup contract, and exact types. | Direct database driver, temp persistence, demo tenancy, JavaScript-number financial fields, and mixed responsibilities. Repository tests are extensive but prototype-scoped. |
| `src/lib/trader-analytics/server/**` | Builds saved dashboards, review queues, decisions, source cautions, and import services. | Often defaults to demo IDs and creates the SQLite repository indirectly. | Contained but not server-derived tenancy. | `adapt` | Accept required owner/account scope from a v3 application service; eliminate defaults. | Hidden default scope can cross boundaries if the application becomes multi-user. Existing service and API tests cover legacy behavior. |
| `src/lib/trader-analytics/product/selectors.ts` and `product/types.ts` | Filters current analytics by symbol, direction, session, entry hour, outcome, and lifecycle. | Browser/presentation-oriented legacy selector state. | Prototype display utility only. | `retire` | Replace with server-authoritative, content-addressed canonical filters in GA0-A3. | Missing date/time basis, timezone, cutoff, coverage, comparisons, currency, and capability. Selector tests preserve existing UI behavior only. |
| `src/lib/trader-analytics/charts/build-trader-analytics-chart-data.ts` and chart types/components | Builds labels and numeric series rendered by current dashboard charts. | JavaScript-number presentation data without evidence manifests. | Not v3 visual evidence. | `retire` | GA0-B creates validated series; GA1 creates accessible approved-template rendering. | No units/currency/timezone/filter digest/evidence/exclusions/coverage or exact table alternative. Existing chart tests are presentation tests. |
| `src/lib/market-data-sources/**` | Maps provider candles, currently including Yahoo shapes. | Provider-specific types and number values. | Not imported by v3 core and not authorized as runtime truth. | `out_of_scope` | A later provider registry must validate provenance, freshness, adjustment, coverage, and capability. | Provider drift, missing provenance, corporate actions, malformed candles, and network availability. Existing mapping tests apply only to the legacy adapter. |
| `src/lib/support-resistance/**` and vendored `levels-system-v2` | Builds structural context, pivots, ladders, relations, comparisons, and calibration reports. | Legacy provider/runtime adapter plus saved warehouse access. | Explicitly outside GA0-A1 and disabled at hosted provider routes. | `legacy_provider` | Preserve one detector; add a qualified v3 adapter only in the later market-enrichment gate. | Stale/weak levels, provider/cache quality, congestion, basis, and usefulness need separate acceptance. Dedicated level-system verification exists. |
| `src/scripts/run-saved-import-calibration.ts` and related calibration/debug scripts | Local calibration and diagnostics using saved/imported data. | Local files, SQLite, demo scope, and operator-provided inputs. | Local-only operational tooling. | `legacy_provider` | Keep real private inputs outside Git; later accept signed manifests or sanitized reports. | Private broker exports, account identifiers, screenshots, and generated artifacts can leak. Private-data guard and ignore rules now provide a minimum repository barrier. |
| Existing test fixtures and snapshots | Preserve broker parsing, timeline, pattern, repository, level, and UI contracts. | Mostly synthetic data with legacy demo identifiers. | Suitable only where demonstrably synthetic. | `preserve` | Keep narrowly located synthetic fixtures; migrate expected values when new canonical contracts are accepted. | Accidental real exports can resemble fixtures. GA0-A1 private-data scanning uses a narrow allowlist and reports only path/code/line. |
| `.github/workflows/ci.yml` and package verification scripts | Runs tests and Layer 2/3 guards. | Repository CI with no prior v3 boundary/private-data enforcement. | GA0-A1 adds both guards. | `adapt` | Later add migration, reconciliation, determinism, and deployment-profile suites as their gates arrive. | Build success alone does not prove private-alpha readiness. |
| `src/lib/trader-intelligence-v3/**` | New deployment contract, route matrix, owner boundary, provisional Discord-session adapter, cache/mutation policy, and architecture/private-data guards. | Server configuration plus exact configured owner; no v3 financial or analytical authority. | GA0-A1 containment candidate pending full verification and review. | `preserve` | Replace the provisional Discord adapter with Intelligence-owned auth when selected; replace legacy handlers incrementally behind stable ports. | Misconfiguration fails closed. This layer deliberately does not calculate trades, analytics, charts, levels, or AI output. Focused tests and CI guards are included. |

## External V2 feature-preservation inventory

The separate `C:\Users\jerac\Documents\TraderLink\trader-intelligence-v2`
worktree is not a newer clean foundation. Its branch is 297 commits behind
current `origin/main`, has 26 unique committed candle/review commits, and has a
large dirty/untracked tree. PR #59 and later follow-ups deliberately ported the
accepted deterministic behavior into `main` while retaining the newer
`/intelligence` namespace, journal-level-analysis contracts, and
`levels-system-v2` boundary.

| External source | Current evidence | V3 disposition |
|---|---|---|
| Manual stock entry: `app/manual-entry/**` and `src/lib/trader-analytics/product/manual-execution-entry.ts` | Uncommitted V2 prototype; focused tests pass. Current `main` retains manual execution mapping primitives but not this save UI/workflow. | `preserve_external`; evaluate behind canonical execution/import contracts after GA0-A2 is accepted. Do not copy into A1. |
| AI period reflections: `app/api/trader-reflections/**`, `app/period-reflection-*.tsx`, `src/lib/trader-analytics/product/period-reflections.ts`, and `src/lib/trader-analytics/server/period-reflection-*.ts` | Uncommitted V2 prototype with deterministic daily/weekly/monthly reflection data, OpenAI narrative generation/fallback, usage reporting, and a paid-tier API/UI gate. Focused tests pass. | `preserve_external`; later adapt only after exact facts, claims/evidence, AI policy, and GA2 evaluation gates. No model call or route is authorized in A1. |
| Real-coach/Whop: `app/api/real-coach/**`, `app/coach-human/**`, and `src/lib/trader-analytics/product/real-coach-*.ts` | Uncommitted local prototype. Focused repository/webhook tests pass, but the prototype uses demo/local role assumptions and Whop/auth/account production foundations were never accepted. | `preserve_external`; require a separate identity/account/payment foundation decision. Not a production or hosted capability. |
| Academy Discord login: `app/api/auth/**`, `app/api/me/**`, and `src/lib/academy/**` session/auth files | Committed on `main` with focused route/cookie/OAuth tests. | `legacy_provider`; local-only v3 does not reach the provisional adapter. Future hosted Intelligence requires an Intelligence-owned identity and account-linking contract. |
| V2 stash | Contains a private SQLite backup among a broad mixed source/artifact snapshot. | `prohibited_source`; never apply or commit wholesale. Any later preservation must select explicit non-private source/test files and pass the private-data guard. |

The focused reconciliation run passed 32 tests across the uncommitted manual
entry, period-reflection, and real-coach prototype suites, and 11 tests across
the committed Discord cookie/route/OAuth suites. Passing prototype tests prove
recoverable behavior, not v3 readiness.

## Direct repository construction and demo identity inventory

Direct `SqliteImportCommitRepository` construction currently occurs in:

- import-batch APIs for preview, read, commit, discard, repair, decision-review resume/status, and history;
- trade APIs for list/read/notes/review status/review items/manual close;
- Intelligence import/detail/root pages;
- `saved-trader-analytics-data.ts` and the saved-import calibration script;
- repository, API, and level-analysis tests.

Demo identity use currently occurs in:

- import commit planning/service defaults;
- saved analytics, review queue, import source caution, and decision-review services;
- trade and import APIs/pages;
- level-analysis delivery/link defaults and fixtures;
- calibration and repository tests.

GA0-A1 does not rewrite those paths. It ensures external page/API access is authorized before they run, disables unsafe local providers in private-hosted mode, and records demo scope as mandatory migration work. GA0-A2/A3 must remove demo defaults from authoritative execution.

## Deployment and security state during GA0-A1 audit remediation

- Only `private_owner_alpha` is operational.
- `local_only` is the only operational hosting mode and rejects common hosted-environment signals.
- Supported local scripts bind explicitly to `127.0.0.1`; owner authorization requires exact loopback Host/URL and rejects forwarded, proxy, and tunnel evidence.
- `private_hosted` and `private_database` return stable not-operational reasons.
- Every classified owner page/API fails closed when deployment or owner resolution fails.
- Unsafe methods require an exact explicitly configured loopback Origin before handler invocation; the request URL is not an approval source.
- Sample mode is in-memory and cannot select the owner database. Real-owner mode requires an explicit durable database outside Git and OS temp paths.
- Intelligence pages and API responses are private, dynamic, and no-store at browser and CDN layers.
- Errors do not reveal requested private resource identifiers.
- No route accepts caller-provided owner scope as authorization.
- No client receives owner secrets or configured Discord subject.
- Real broker exports, private screenshots, and private fixture paths are ignored and scanned before commit/CI. Exact fixture hashes and full PR-history blob scanning prevent directory-prefix and delete-later bypasses.

## Explicitly not delivered by this inventory slice

GA0-A1 does not implement exact financial types, canonical execution identity, migration, canonical filters, analytics, chart evidence, support/resistance modernization, AI, durable jobs, public access, invited users, deployment, or production readiness. Those remain gated by the controlling specification and active plan.
