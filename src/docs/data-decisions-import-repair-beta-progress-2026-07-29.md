# Data Decisions Import Repair Beta Progress — 2026-07-29

Status: steps 1-4 implemented; isolated verification pending

## Completed

- Preserved `/data-decisions` as the existing Data Decisions route.
- Added the non-saving Import Repair layout preview in the actual V3 app.
- Included an editable-row table, plain-language issue column, row-action
  selector, reset control, Save and recheck preview action, and a separately
  confirmed Delete statement preview.
- Kept all preview actions local to the browser; no statement, V3 authority,
  analytics result, or production data is changed.
- Confirmed that accepted V3 executions retain a normalized-import row locator,
  not a guaranteed broker-statement row. The first real-data slice needs a
  companion repair record saved from the original broker CSV at import time.
- Added the companion-record builder and isolated file store in the feature
  workspace. New imports now receive their original CSV, broker row numbers,
  parsed values, and import issues alongside the existing V3 record.
- Added a read-only owner/account-scoped endpoint for those companion records.
- Connected the approved Import Repair table to the read-only packet. It now
  shows real flagged broker rows, and clearly asks for a one-time re-import
  when an older statement has no companion repair record.
- Added the first plain-language financial-data rule: a row with neither a
  commission nor fee states that fee-based results are omitted until it is
  corrected from the broker statement.
- Added plain-language explanations for invalid or missing trade time, symbol,
  side, quantity, price, currency, commission/fees, duplicate rows, and
  non-stock rows. Unknown importer messages now fail closed to a concise
  compare-correct-or-exclude instruction instead of exposing parser wording.
- Reviewed the wording against the importer’s actual issue catalog. Non-trade
  rows, unfilled orders, options, prior-period closes, unmatched sells,
  execution splits, and grouping boundaries now explain whether the row is
  restricted or informational and whether a broker value was changed.
- Added a scoped source-record removal primitive for the later replace/delete
  flow. It verifies the V3 owner, account, and statement digest before removal;
  it is not yet callable from the user interface.

## Current slice

Work from the complete integration checklist in
`src/docs/data-decisions-import-repair-beta-plan-2026-07-29.md`.

Current checkpoint:

1. [Complete] Add narrow server-side validation for editable row values and
   actions.
2. [Implemented; verification pending] Save corrections, keep/exclude decisions, and reset-to-source by replacing
   the selected statement with a new verified V3 source record.
3. [Backend connected; verification pending] Rebuild the one shared V3
   authority after replacement without adding another dashboard data source.

Detailed active work:

1. Extend the companion record with persisted current values and row decisions
   while retaining immutable original broker values.
2. Build a replacement normalized statement from verified executions plus the
   validated correction/keep/exclude/reset actions.
3. Support corrected rejected rows only when all required execution fields
   become valid.
4. Persist the replacement V3 source and companion record without activating
   both the old and new statement.
5. Rebuild the shared binding from the replacement statement plus every other
   current owner/account statement.
6. Remove the superseded record pair only after the replacement binding is
   valid; restore the previous selection if cleanup fails.
7. Connect Save and recheck to the mutation endpoint and refresh using the
   returned replacement digest/packet.
8. Finish Delete statement verification, rollback proof, final-statement
   behavior, and next-statement refresh.

Implementation completed in the current batch:

- Companion records now retain immutable original values, persisted current
  values, and needs-attention/corrected/kept/excluded decisions. Legacy v1
  companion records are upgraded in memory.
- The replacement builder preserves untouched verified executions, applies
  validated correction/keep/exclude/reset actions, and admits a rejected row
  only through a complete validated correction.
- The mutation endpoint writes a new content-addressed source and companion,
  builds the proposed shared binding, removes the superseded pair only after
  the binding succeeds, and attempts restoration/cleanup on failure.
- Save and recheck is connected with saving/error/success state and refreshes
  to the replacement statement digest.
- Delete statement locks against saving, rebuilds the shared binding, restores
  on failure, refetches the next statement, and reaches the empty state when
  the final statement is deleted.

Verification completed:

- Source whitespace/conflict-marker check passed for tracked changes.
- Search confirmed the old route-local `sourceRecords` and
  `writeCurrentBinding` implementations are no longer active.
- Search confirmed preview-only/not-connected copy was removed from the
  connected Import Repair surface.
- Targeted TypeScript syntax transpilation passed for the seven changed
  TypeScript/TSX implementation files using the canonical workspace's compiler
  without starting the app or resolving feature dependencies.

Verification still required:

- Focused lint could not run because this isolated workspace has no
  `node_modules`. Invoking the canonical app's ESLint binary still failed when
  this workspace's `eslint.config.mjs` resolved its missing local `eslint`
  package.
- Focused type checking and mutation/replacement/delete tests require an
  isolated dependency install or integration into the dependency-complete
  reviewed workspace.
- Isolated-data runtime proof for correction, keep, exclude, reset, rollback,
  deleting one of two statements, and deleting the final statement has not
  been run.

## 2026-07-29 focused verification checkpoint

Completed:

- Installed the workspace's locked dependencies with `npm ci --ignore-scripts`.
  The install reported 10 dependency-audit findings (2 low and 8 high);
  automatic audit fixes were intentionally not applied because they are
  outside this feature slice.
- Focused ESLint passed for the seven Import Repair/import binding files.
- Repository TypeScript `--noEmit` passed.
- Added
  `src/lib/trader-intelligence-v3/__tests__/import-repair-mutation.test.ts`.
- The focused test passed 3/3 cases covering stale-digest refusal, verified
  correction with immutable originals, and retained evidence for exclusion.

Integration blocker:

- The canonical `C:\Users\jerac\Documents\TraderLink\traderslink.pro`
  workspace is currently on `codex/day-session-visual-review`, not `main`.
- That workspace has modified and untracked Day Session, dashboard, route,
  documentation, ingestion, and analytics files.
- Import Repair cannot be safely brought into that dirty workspace without
  mixing unfinished slices or overwriting another feature. Do not switch,
  clean, stash, or replace those user/agent-owned changes without explicit
  coordination.
- Steps requiring connected UI review, acceptance from `main` on port 3010,
  final integration, commit, and temporary-workspace removal remain blocked
  until a clean canonical `main` integration workspace is available or the
  user directs how the existing Day Session work should be handled.

## Later slices

1. [Backend and UI connected; verification pending] Connect
   isolated-test-data statement deletion after confirmation.
2. Finish connected UI states and the analytics language handoff.
3. Review and verify every action using isolated V3 test data.
4. Build the complete file inventory and integrate the reviewed slice into
   `main` together.

## Main integration status

- Row correction, keep, exclude, and persisted reset: implemented; focused
  type/runtime verification pending.
- Shared-authority rebuild after a repair: connected through the one shared
  catalog/binding writer; focused type/runtime verification pending.
- Confirmed statement deletion: backend and UI connected with scoped
  owner/account/digest checks and binding rollback; isolated-data verification
  not complete.
- Connected loading/success/validation/failure states: not complete.
- Analytics limitation-language handoff: not complete.
- Fully connected table review: not complete.
- Isolated-data action verification: not complete.
- Complete required-file inventory: not complete.
- Integrated verification from `main` on port 3010: not started.
- Temporary-workspace removal: blocked until integration is confirmed and the
  user approves removal.

## Next feature after Import Repair

- Change V3 import and dashboard eligibility to a visibility-first model:
  every source row remains visible in Data Decisions. Rows that cannot support
  analytics are restricted there with their exact reason; metric-specific
  limitations stay disclosed in the relevant dashboard view. Do not silently
  drop a row.

## Verification boundary

The layout is preserved for review. During active implementation, use only
small checks for the changed files. Do not run a production build, broad test
suite, full regression, or browser/E2E verification until the review or
acceptance checkpoint.
