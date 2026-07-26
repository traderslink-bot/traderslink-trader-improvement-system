# GA1-C Verification Ledger

## Final 10,000-row executable proof

| Proof item | Result |
| --- | --- |
| command | `npm run verify:ti-v3:ga1-c -- --scale-only` |
| fixture | `ti_v3_ga1_c_fixed_seed_20260726_v1` |
| accepted rows / outcomes | 10,000 / 10,000 |
| generic and governed presets | generic plus all 14 governed presets passed |
| replay / reconstruction | result, envelope, and receipt replay passed |
| bounds | evidence bounded; 10,001 source rows fail closed |
| permutation | reversed source storage preserved plan/result identity |
| final proof | 1 file / 2 tests; 1,003.63 seconds test time |

The first proof exposed the canonical key ceiling at outcome 5,349. After that
bounded correction, replay issuance exposed the matching runtime validator
ceiling. A subsequent assertion-complete run exceeded its 10-minute harness
timeout after 901 seconds; raising only the proof timeout to 20 minutes produced
the final clean run without changing rows, assertions, or seeds.

The first GitHub run then exposed one GA0-B2 hostile-input fixture that encoded
the former aggregate-string ceiling as a fixed attack size. The fixture now
derives one property key beyond the exported ceiling. The CI-equivalent local
suite passed 208 files / 2,144 tests, with 2 files / 4 tests intentionally
skipped.

## Focused fee-authority remediation

Independent audit identified that a complete row-level authority containing an
unknown/undecomposed component could retain an `exact` authority label while
simulated charges and net were null. The executor now derives unavailable
resized authority for that case. Focused assertions cover complete broker,
account-policy, explicit-zero, partial, estimated, not-included, unavailable,
and legacy undecomposed authority; exact/unavailable summary populations,
evidence routing, and correctly re-digested result rejection are semantic rather
than snapshot-only.

| Remediation check | Result |
| --- | --- |
| focused fee-authority and replay tests | passed: 2 files / 35 tests |
| all GA1-C | passed: 3 files / 47 tests |
| affected GA0-B3 / GA1-A / GA1-B | passed: 4 files / 47 tests |
| combined required semantic population | 7 files / 94 tests |
| isolated GA1-B rerun after one load-sensitive timeout | passed: 1 file / 15 tests |
| TypeScript and targeted ESLint | passed |
| architecture and `git diff --check` | passed |

## Fee-aware resizing checkpoint

Committed starting head:
`d2fb09c683b9009f34100d7dfefb4253cbbd8ebb`

Recovered state: seven modified files and no untracked files on
`agent/trader-intelligence-v3-ga1-c-counterfactual-simulation`. The preserved
scaffold was retained and completed in place.

This checkpoint adds the final governed `simulate_reduce_size_after_loss`
preset, exact rational post-floor economics, fee-component authority, explicit
limited-net dispositions, centralized dependencies/snapshots, reconciled resize
summaries/evidence, and governed replay reconstruction. Exact final command
counts, commit SHA, push, and GitHub CI are recorded in the external completion
report because the commit cannot contain its own identity.

| Check | Result |
| --- | --- |
| focused resize and fee-authority scenarios | passed during development |
| all GA1-C | passed: 3 files / 45 tests |
| strict/equal completion, skipped/filter isolation | passed |
| even/odd/zero/missing/fractional/negative quantity | passed |
| explicit-zero, complete, partial, estimated, missing, legacy fees | passed |
| gross exact while net limited | passed |
| downstream completed-net failure | passed |
| generic/governed reconstruction and replay | passed |
| affected GA0-B3 / GA1-A / GA1-B | passed: 4 files / 47 tests |
| combined required tests | passed: 7 files / 92 tests |
| TypeScript | passed |
| targeted ESLint | passed with zero warnings |
| architecture | passed: 488 files, 43 API routes, 82 classified routes |
| `git diff --check` | passed |
| final 10,000-row proof | deliberately not run |
| browser / E2E / deployment | deliberately not run |

## Checkpoint 1

Base: `183f6d44e1289a646d22fefb82f1d8c589b5e1b4`
Branch: `agent/trader-intelligence-v3-ga1-c-counterfactual-simulation`
Executable checkpoint: `52f86bcc8235aa7c52d251b1edbb0fd413dd5244`
Draft PR: `#162`

| Check | Result |
| --- | --- |
| exact base / local main / origin main | confirmed equal before branch creation |
| initial worktree | clean |
| focused GA1-C test | passed in combined run: 1 file / 7 tests |
| affected GA0-B3 regression | passed in combined run |
| affected GA1-A regression | passed in combined run |
| affected GA1-B regression | passed in combined run |
| combined focused/regression result | 5 files / 54 tests passed |
| TypeScript | `npx --no-install tsc --noEmit --pretty false` passed |
| targeted ESLint | changed simulation/test/export/identity paths passed |
| `git diff --check` | passed |
| 10,000-row final proof | deliberately not run at first checkpoint |
| build / browser / e2e | deliberately not run; no route or UI change |
| private data | not used |
| deployment | not run |

The final 10,000-row proof is intentionally reserved for the final executable
checkpoint, as directed. CI status is tracked on draft PR #162.

## Checkpoint-one chronology remediation

Starting head: `21eb0477284cafb7007aa4a8b7dd9afa4eaa5bac`

| Check | Result |
| --- | --- |
| direct GA1-C dependency/chronology suite | 1 file / 12 tests passed |
| mixed tie ignored by direction-only | passed |
| mixed tie ignored by maximum-trades | passed |
| mixed tie rejected by consecutive-loss | passed |
| economically equivalent tied losses | passed |
| equal/prior completion boundary | passed |
| skipped-trade completion isolation | passed |
| dependency/order and three-preset permutation | passed |
| combined focused and affected regression | 5 files / 59 tests passed |
| TypeScript | `npx --no-install tsc --noEmit --pretty false` passed |
| targeted ESLint | simulation, GA1-C test, and synthetic authority paths passed |
| `git diff --check` | passed |

Commit, push, and CI identities are recorded after the focused correction is
published. The final 10,000-row proof, browser, build, private calibration, and
unrelated suites remain deliberately unrun.

## Checkpoint two: remaining preserve-or-exclude preset pack

Starting head: `b3655471a99af685a86908a5ef8a21936dc60d1f`

| Check | Result |
| --- | --- |
| ten new preset compilers and reconstruction | passed |
| full focused GA1-C suite | 2 files / 27 tests passed |
| daily drawdown / profit giveback exact state | passed |
| cutoff / cooldown / attempt boundaries | passed |
| mixed material and equivalent completion ties | passed |
| session/account/currency/stable-instrument isolation | passed |
| skipped and source-filter state isolation | passed |
| all-ten-preset source permutation | passed |
| bounded classification-derived evidence | passed, including max plus one |
| preset and result replay | passed |
| unknown/accessor/class/polluted/foreign authority | passed |
| correctly re-digested preset/result tampering | passed |
| combined GA0-B3 / GA1-A / GA1-B / GA1-C regressions | final run: 6 files / 74 tests passed |
| TypeScript | passed |
| targeted ESLint | passed |
| `git diff --check` | passed |
| final post-correction local checkpoint | passed |
| GitHub CI | tracked on draft PR #162 after push |

The final 10,000-row proof, production build, browser/E2E, private CSV
calibration, deployment, and unrelated suites remain deliberately unrun.

## Checkpoint-two affected-population audit correction

Starting head: `6b7bf67d35fc4b203bc315ab715db81a75566f60`

Final correction commit: the single focused commit containing this ledger
section; its external SHA is recorded on draft PR #162 and in the final
execution report because a commit cannot content-address its own SHA.

The prior per-rule aggregation counted every responsible non-unchanged outcome,
including conservatively retained `unavailable_required_authority` trades. It
now uses the same authoritative exclusion predicate as `skippedCount` and the
economic affected summaries. Unavailable evaluations remain separately
counted, classified, reasoned, and limited.

| Check | Result |
| --- | --- |
| direct corrected GA1-C pack | 1 file / 16 tests passed |
| full focused GA1-C plus affected GA0-B3 / GA1-A / GA1-B regressions | 6 files / 75 tests passed |
| TypeScript | `npx --no-install tsc --noEmit --pretty false` passed |
| targeted ESLint | corrected engine and focused test passed |
| architecture guard | passed: 485 architecture files, 43 API routes, 82 classified Trader Intelligence routes |
| `git diff --check` | passed |
| GitHub CI | observe after push |
| 10,000-row / browser / E2E / deployment | deliberately not run |

## Standalone persisted replay envelope and receipt checkpoint

Starting head: `ad3a8597df9fccd60d8eca69d63e082bc755c9b9`

Final executable commit: the single checkpoint commit containing this ledger;
its external SHA is recorded on draft PR #162 and in the final execution report
because a commit cannot include its own content-addressed identity.

| Check | Result |
| --- | --- |
| focused replay-envelope suite | development run: 1 file / 7 tests passed |
| generic and all 13 preset replay | passed |
| authority/plan/preset/result/envelope/receipt rejection | passed |
| deterministic stages, max-plus-one, and permutation | passed |
| all GA1-C plus affected GA0-B3 / GA1-A / GA1-B | 7 files / 82 tests passed |
| TypeScript | `npx --no-install tsc --noEmit --pretty false` passed |
| targeted ESLint | replay, identity, exports, and focused test passed |
| architecture guard | passed: 487 architecture files, 43 API routes, 82 classified Trader Intelligence routes |
| `git diff --check` | passed |
| GitHub CI | observe after push |
| final 10,000-row / browser / E2E / deployment | deliberately not run |

## Governed-preset origin downgrade remediation

Required starting head:
`a97ce351ae13f9168e9a0dc3d4a7c218bd34fc2d`

The independent audit found that omitting optional `compiledPreset` could issue
a generic envelope for a governed execution. The correction binds explicit
`generic_plan` or `governed_preset` origin into the simulation plan and replay
envelope. Generic issuance/replay permits no preset and requires seven ordered
references. Governed issuance/replay requires the reconstructed preset and
eight ordered references.

| Check | Result |
| --- | --- |
| focused replay-envelope suite | development run: 1 file / 8 tests passed |
| explicit generic and governed issuance/replay | passed |
| all 13 governed presets and direct generic replay | passed |
| origin omission/unknown/extra and preset mismatch/foreign authority | passed |
| correctly re-digested origin/reference downgrade and upgrade | passed |
| full GA1-C and affected GA0-B3 / GA1-A / GA1-B regressions | 7 files / 83 tests passed |
| TypeScript | `npx --no-install tsc --noEmit --pretty false` passed |
| targeted ESLint | changed simulation contracts, preset, replay, and focused tests passed |
| architecture guard | passed: 487 architecture files, 43 API routes, 82 classified Trader Intelligence routes |
| `git diff --check` | passed |
| GitHub CI | observe after push |
| final 10,000-row / browser / E2E / build / deployment | deliberately not run |
