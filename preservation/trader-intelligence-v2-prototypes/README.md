# Trader Intelligence V2 prototype preservation

This package preserves the recoverable, uncommitted V2 prototypes for manual trade entry, AI period reflections, and Real Coach / Whop. Trader Intelligence V3 GA0-A1 was already completed and merged at `4f9e440116258c9548a2d13f7ea057a9075101c6` before this branch was created.

Nothing in this directory is active V3 runtime code. Source and tests use `.source` suffixes, the patches are inert text artifacts, and no runtime file imports this directory. This branch does not implement GA0-A2, port a prototype, change a route, or deploy anything.

## Provenance

The verified 32-test snapshot came from the dirty sibling worktree at `C:/Users/jerac/Documents/TraderLink/trader-intelligence-v2`, branch `codex/trader-ui-product-pass`, HEAD `6dca4dc05dce6310a79beef53019212a56d5a9d5`. The feature-owned source and test files were untracked; a small set of complete mixed integration files was also preserved as snapshot-only evidence because later engineers need their wiring, persistence, type, and package context.

The V2 stash dated 2026-05-19 was inspected read-only. It predates these prototypes, contains a private SQLite backup, contributed no preserved source, and remains untouched. The canonical `traderslink.pro` stash dated 2026-07-15 was also inspected read-only; it contains a separate, heavily entangled production-port lineage and was not substituted for the verified V2 snapshot. Other V2 sibling worktrees contained older committed baselines but not these three prototypes.

## Package layout

- `manifest.json` records provenance, SHA-256, dependencies, environment-variable names, conflicts, tests, and porting notes for every snapshot.
- `source-map.json` maps each intended V2 path to its non-runtime snapshot and feature patch.
- `patches/` contains one source patch per feature and one patch for the five focused test files.
- `snapshots/` contains exact file bytes under non-runtime suffixes. Files under `integration/` are complete mixed V2 files preserved for selective comparison; they are deliberately not in the directly applicable patches.
- `feature-decisions.md` records binding future V3 boundaries.
- `dependencies-and-environment.md` records dependencies and incompatibilities without secret values.
- `test-results.md` records both the verified V2 result and the clean-main reconstruction result.
- `excluded-private-artifacts.md` records excluded categories without sensitive content.

## Feature inventory

| Feature | Core source snapshots | Integration snapshots | Focused tests |
| --- | ---: | ---: | ---: |
| Manual trade entry | 3 | 3 | 1 file / 2 tests |
| AI period reflections | 9 | 7 | 3 files / 19 tests |
| Real Coach / Whop | 11 | 3 | 1 file / 11 tests |
| Total | 23 | 13 | 5 files / 32 tests |

`app/workspace/page.tsx` is intentionally snapshotted once for manual-entry integration and once for AI-reflection integration. The manifest therefore contains 41 snapshot records for 40 distinct original paths.

## Inspecting the package

Review the applicable V2 additions without touching runtime code:

```powershell
git show HEAD:preservation/trader-intelligence-v2-prototypes/patches/manual-trade-entry.patch
git show HEAD:preservation/trader-intelligence-v2-prototypes/patches/ai-period-reflections.patch
git show HEAD:preservation/trader-intelligence-v2-prototypes/patches/real-coach-whop.patch
git show HEAD:preservation/trader-intelligence-v2-prototypes/patches/focused-tests.patch
```

Verify every committed snapshot against `manifest.json` using raw Git blob bytes, avoiding Windows checkout line-ending conversion:

```powershell
node -e "const fs=require('node:fs'),crypto=require('node:crypto'),cp=require('node:child_process');const m=JSON.parse(fs.readFileSync('preservation/trader-intelligence-v2-prototypes/manifest.json','utf8'));let bad=0;for(const f of m.files){const b=cp.spawnSync('git',['show','HEAD:'+f.preservedSnapshotPath],{encoding:null}).stdout;const h=crypto.createHash('sha256').update(b).digest('hex');if(h!==f.sha256){console.error(f.preservedSnapshotPath);bad++;}}console.log('verified='+String(m.files.length-bad)+' mismatches='+String(bad));process.exitCode=bad?1:0"
```

## Disposable reconstruction

Use a disposable clone. Do not apply these patches to the canonical checkout.

1. Clone the repository into a temporary path under the TraderLink project directory.
2. Check out detached base `4f9e440116258c9548a2d13f7ea057a9075101c6`.
3. Obtain the four patch blobs from this preservation branch.
4. Apply the three feature patches, then `focused-tests.patch`.
5. Run `npm ci` and the focused Vitest command in `test-results.md`.

The patches apply cleanly to the GA0-A1 base and recover all five test files. They are not a supported V3 port: the exact legacy tests currently produce 12 passing and 20 failing tests on current main because GA0-A1 correctly requires an explicit data mode/durable path and current main does not expose the V2 `canUseAiPeriodReflections` tier function. The original V2 worktree result is 32/32. Later engineers must port the preserved integration snapshots selectively; they must not weaken GA0-A1 to make legacy tests green.

## Future V3 placement

- Manual trade entry: rebuild after canonical execution and correction contracts exist, retaining explicit user-entered provenance. This preservation task does not start GA0-A2.
- AI period reflections: rebuild only after deterministic analytics and evidence eligibility are authoritative; AI may explain validated results but may not calculate financial truth.
- Real Coach / Whop: defer to a later identity, authorization, evidence-sharing, entitlement, and hosted-audit foundation. Whop is commercial access only, never financial truth authority.

## Safety statement

No SQLite, WAL, SHM, database, broker CSV, screenshot, environment file, secret, token, account value, real trade row, browser trace, or generated owner report is present in this package. No live AI, Whop, payment, login, broker, market-data, Vercel, deployment, or production call was made. The original V2 worktree and both inspected stashes remain untouched.
