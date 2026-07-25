# GA1-C Verification Ledger

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
