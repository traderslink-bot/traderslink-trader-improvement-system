# Data Decisions Import Repair Beta Progress — 2026-07-29

Status: steps 1-4 implemented and isolated-runtime verified; connected UI approval pending

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

## 2026-07-30 clean main integration and runtime checkpoint

Completed:

- Created a clean main-based integration worktree on
  `codex/import-repair-main-integration` without modifying or stashing the
  dirty Day Session workspace.
- Brought the complete Import Repair commit into that worktree and resolved
  only the Data Decisions add/add conflict.
- Focused ESLint, repository TypeScript, the three focused mutation checks,
  and the production build passed in the clean integration worktree.
- Added the Import Repair GET/POST/DELETE route to the V3 owner-containment
  inventory after runtime verification exposed the missing classification.
- Verified the connected Data Decisions page in a browser with HTTP 200, the
  expected navigation/table, exact broker row 1, and no console error after
  the isolated account binding was configured.
- Imported an isolated statement with missing fees and confirmed its exact row
  and plain-language fee limitation appeared in Data Decisions.
- Saved an exact fee correction into a new verified source digest and confirmed
  the immutable original broker values remained available.
- Fixed and verified reset so original issue evidence is retained after a
  correction, corrected rows leave the active table, and reset restores both
  the original broker values and the original explanation.
- Verified deletion with two isolated statements: deleting the selected
  statement retained the other statement and rebuilt the binding; deleting the
  final statement returned an empty verified selection.
- Reverted the temporary local-listener compatibility adjustment used only to
  run the review; it is not part of the Import Repair slice.
- Added the approved Imported statements selector. It shows every retained
  statement, puts statements with review rows first, discloses the statement
  date range and exact review count, and marks the selected statement.
- Browser verification with two isolated statements confirmed that selecting a
  statement changes only the selected card and the repair rows below. The
  flagged statement showed one row needing review, the clean statement showed
  zero, and the browser reported no console errors.
- Replaced parser-only `custom` statement wording with the neutral
  `Imported statement`.
- Completed the Analytics language handoff without changing its authority or
  adapters. Analytics now translates limitation codes into trader-facing
  explanations, sends fee limitations to Data Decisions, and no longer shows
  internal reason codes in unavailable metric captions.

Still active:

1. [Complete] Trader approved the connected table and Imported statements
   selector. Parser-only `custom` labels are presented as the neutral
   `Imported statement`; known broker names remain visible.
2. [Complete] Analytics limitation-language handoff.
3. [Complete] Focused ESLint, repository TypeScript, `git diff --check`, and
   the final production build passed. The complete integration slice was
   committed on `codex/import-repair-main-integration`.
4. Open the pull request, allow GitHub CI to be the final safety gate, and
   integrate only this reviewed feature into `main`.
5. Start only clean `main` on port 3010 and verify Data Decisions, importing,
   Trades, Analytics, and Analytics Lab from that one app.
6. Remove the temporary workspaces only after integrated confirmation and
   explicit approval.

Current external blocker:

- `gh auth status` reports that the saved `traderslink-bot` token is invalid.
  Re-authenticate GitHub CLI before pushing the branch or opening the pull
  request.

## Later slices

1. [Backend and UI connected; verification pending] Connect
   isolated-test-data statement deletion after confirmation.
2. Finish connected UI states and the analytics language handoff.
3. Review and verify every action using isolated V3 test data.
4. Build the complete file inventory and integrate the reviewed slice into
   `main` together.

## Main integration status

- Row correction, keep, exclude, and persisted reset: implemented; correction
  and reset verified with isolated runtime data.
- Shared-authority rebuild after a repair: connected through the one shared
  catalog/binding writer; focused type/runtime verification pending.
- Confirmed statement deletion: backend and UI connected; two-statement and
  final-statement isolated runtime behavior verified.
- Connected loading/success/validation/failure states: complete for the
  reviewed slice.
- Analytics limitation-language handoff: complete.
- Fully connected table review: approved.
- Isolated-data action verification: correction, reset, statement selection,
  and deletion complete; forced-failure rollback remains for final acceptance.
- Complete required-file inventory: complete; listed below.
- Integrated verification from `main` on port 3010: not started.
- Temporary-workspace removal: blocked until integration is confirmed and the
  user approves removal.

## Next feature after Import Repair

- Change V3 import and dashboard eligibility to a visibility-first model:
  every source row remains visible in Data Decisions. Rows that cannot support
  analytics are restricted there with their exact reason; metric-specific
  limitations stay disclosed in the relevant dashboard view. Do not silently
  drop a row.

## Complete Import Repair integration inventory

1. `app/(dashboard)/data-decisions/data-decisions-repair-preview.tsx`
2. `app/analytics-server-page.tsx`
3. `app/api/intelligence/broker-csv-import/v1/route.ts`
4. `app/api/intelligence/import-repair/v1/route.ts`
5. `src/docs/data-decisions-import-repair-beta-plan-2026-07-29.md`
6. `src/docs/data-decisions-import-repair-beta-progress-2026-07-29.md`
7. `src/lib/trader-intelligence-v3/__tests__/import-repair-mutation.test.ts`
8. `src/lib/trader-intelligence-v3/contracts/route-containment.ts`
9. `src/lib/trader-intelligence-v3/ingestion/configured-import-catalog.ts`
10. `src/lib/trader-intelligence-v3/ingestion/import-repair-mutation.ts`
11. `src/lib/trader-intelligence-v3/ingestion/import-repair-record.ts`
12. `src/lib/trader-intelligence-v3/ingestion/index.ts`
13. `src/lib/trader-intelligence-v3/ingestion/local-execution-source-document-store.ts`
14. `src/lib/trader-intelligence-v3/ingestion/server-raw-broker-csv-import.ts`
15. `src/docs/codex-project-log.md`

## Verification boundary

The layout is preserved for review. During active implementation, use only
small checks for the changed files. Do not run a production build, broad test
suite, full regression, or browser/E2E verification until the review or
acceptance checkpoint.
