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
