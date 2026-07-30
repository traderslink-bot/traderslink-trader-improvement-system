# Data Decisions Import Repair Beta Plan — 2026-07-29

## Beta boundary and purpose

**Purpose:** Add Import Repair to the existing `/data-decisions` page. A trader
can see why a V3 broker import needs attention, identify the exact statement
rows involved, fix simple values, exclude a row, or delete an entire statement
from isolated V3 test data.

This is an addition to Data Decisions, not a replacement for its existing
financial-data rule cards.

### Included

- Plain-language import issues and no `ti_v3` labels in the user interface.
- A spreadsheet-style table with statement row, parsed trade values, issue,
  effect, and row action.
- Editable date/time, symbol, side, quantity, price, commission, fees,
  currency, and execution order when present in the source statement.
- `Save correction`, `Keep as imported`, `Exclude row`, and reset-to-source.
- A separately confirmed whole-statement delete action that affects only the
  isolated V3 test-data store.
- One recheck that rebuilds the V3 authority consumed by Trades, Analytics,
  and Analytics Lab.

### Excluded

- Audit-history screens, approval workflows, or compliance records.
- A second importer, second analytics engine, or browser-calculated results.
- Silent estimates for fees, price, time, execution order, or P&L.
- Production data, production routes, homepage, Watchlist, and Academy.

## Follow-on rule: visibility before restriction

After Import Repair is complete, every source row is retained and visible in
Data Decisions. A row that cannot support analytics is restricted to Data
Decisions, where the trader sees the exact statement row and plain-language
reason. It is not forced into Trades or Analytics and the system never invents
a missing financial value.

Rows that are usable with a metric-specific limitation remain visible in the
relevant dashboard views with that limitation disclosed. Rows requiring a
trader choice remain in Data Decisions until that choice is made. Nothing is
silently dropped.

The original source is retained only to reset an edit safely. It is not a
user-facing audit feature in this beta.

## Delivery slices

1. **Layout preview — complete.** Preserve current Data Decisions content
   and add a non-saving Import Repair table, row controls, and delete-statement
   confirmation for trader review.
2. **Source-row read model — complete for new imports.** Save a companion import-repair record at import
   time containing the original broker CSV row locator and parsed source values.
   The existing V3 execution locator is for the normalized import CSV, so it is
   not presented as an exact broker-statement row. Render exact rows for new
   imports; identify older imports that need re-importing for this repair view.
3. **Row repair — in progress.** Add current-value corrections, keep/exclude actions, reset,
   validation, and V3 recheck.
4. **Delete statement.** Delete one selected source document only after
   confirmation, rebuild the remaining V3 authority, and refresh the shared
   V3 pages.
5. **Language handoff.** Remove raw internal limitation labels from analytics
   and replace them with a concise link to the relevant Data Decisions item.

## Completion checklist for integration into `main`

This is the controlling target list. Checkpoint boundaries control what is
implemented next; they do not reduce or replace this full scope.

### 1. Row repair

- Validate every editable value without estimating or inventing a missing
  financial value.
- Save a correction by replacing the selected statement with a new verified V3
  source record.
- Connect `Keep as imported` and preserve the trader's decision.
- Connect `Exclude row` while keeping the exact broker row visible in Data
  Decisions.
- Reset a corrected row to the original broker value retained by the companion
  record.
- Keep rows requiring a choice in Data Decisions until that choice is saved.

#### Active row-repair implementation details

1. Build the replacement statement from the existing verified normalized V3
   record, the retained original broker-row companion record, and the validated
   row-action request.
2. Match accepted normalized executions back to their exact broker rows without
   presenting a normalized CSV row number as a broker-statement row number.
3. For `Save correction`, replace only the selected row values. Require exact
   timestamp, symbol, side, quantity, price, and currency; retain commission,
   fees, order ID, and execution ID only when explicitly supplied or preserved
   from the verified source.
4. For a previously rejected row, add it to the replacement V3 source only
   when the corrected values satisfy the complete execution contract.
5. For `Keep as imported`, preserve the broker row and the trader's decision.
   If the row cannot support analytics, keep it restricted to Data Decisions
   rather than forcing it into the V3 execution set.
6. For `Exclude row`, omit the row from the replacement execution source while
   retaining its exact original broker row and saved exclusion decision in the
   companion record.
7. For `Reset to source`, restore the original values from the retained broker
   row, re-evaluate whether that original row can support V3, and clear the
   correction decision only after the replacement record is verified.
8. Persist decision/current-value state in the replacement companion record so
   a later reset never depends on browser state.
9. Write the replacement source and companion records before removing the old
   pair. If any verification or write fails, keep the old statement active.
10. Remove the old source and companion only after the replacement record and
    shared authority binding are complete. Prevent both versions from becoming
    active together.

### 2. Shared V3 authority

- Replace the selected source record without leaving duplicate statements or a
  partially applied correction.
- Rebuild the one shared V3 authority after a correction, reset, exclusion, or
  statement deletion.
- Keep Trades, Analytics, and Analytics Lab on that shared authority path.
- Do not add an Import Repair analytics engine, browser-calculated results, or
  a second dashboard data source.

#### Active shared-authority implementation details

1. Use `readConfiguredImportCatalog` and
   `writeConfiguredImportAuthorityBinding`, which are now shared by normal
   imports and Import Repair.
2. Build the replacement authority selection from every current owner/account
   statement except the old version, plus the verified replacement version.
3. Write one new `current-authority.json` binding only after its attachment can
   be built from the complete replacement selection.
4. Treat a failed attachment build or binding write as a failed repair. Do not
   remove the old source record or report success.
5. After the binding succeeds, remove the superseded source and companion
   records. If cleanup fails, restore the previous binding and keep or restore
   the old verified record.
6. Return the new persistence digest and refreshed repair statement packet so
   the client can replace stale row state without guessing.
7. Confirm the configured dashboard adapters continue reading this one binding;
   do not modify the engine-to-dashboard analytical contracts in this feature.

### 3. Delete statement

- Connect the existing separately confirmed Delete statement control.
- Delete only the selected isolated-test-data statement and its companion
  Import Repair record.
- Rebuild the shared authority from the remaining statements.
- Fail safely with a clear message if replacement, deletion, or rebuild cannot
  complete.

#### Active Delete statement completion details

1. The confirmed UI request and scoped API deletion are connected.
2. Complete narrow verification that a foreign owner, foreign account,
   malformed digest, missing companion record, or missing source record cannot
   delete anything.
3. Verify deletion with at least two isolated statements: delete one, retain
   the other, rebuild the binding, and confirm the deleted digest is absent.
4. Verify deleting the final isolated statement removes the current binding so
   V3 fails closed to no verified data.
5. Verify the rollback path by forcing source removal or companion removal to
   fail and confirming the previous source and binding remain usable.
6. After successful deletion, return/refetch the next available statement
   instead of always emptying the client when other statements remain.
7. Keep the Delete control disabled while saving or deleting another statement
   and show a plain-language failure without claiming that no change occurred
   unless rollback was confirmed.

### 4. Connected interface

- Remove preview-only and not-connected messaging once each action is real.
- Show saving, validation, success, and failure states.
- Refresh the statement and repair rows after every completed action.
- Keep informational rows distinct from rows that require a correction or
  decision.

### 5. Language handoff

- Replace raw internal limitation labels in affected analytics surfaces with
  concise trader-facing language.
- Link the affected result to the relevant Data Decisions item.

### 6. Review and isolated verification

- Review the fully connected table before integration.
- Verify correction, reset, keep, exclude, and Delete statement using only
  isolated V3 test data.
- Confirm exact broker-row numbers and original values remain available.
- Confirm restricted rows remain visible, metric-specific limitations are
  disclosed, and nothing is silently dropped or forced into analytics.
- Run targeted checks during implementation and broader acceptance checks only
  at the final review checkpoint.

### 7. Complete-slice integration

- Inventory every file required by Import Repair.
- Bring the complete reviewed slice into `main` together; do not copy
  individual files as emergency fixes.
- Resolve conflicts with the shared engine-to-dashboard repair deliberately.
- Run only `main` on port 3010.
- Verify Data Decisions, importing, Trades, Analytics, and Analytics Lab from
  that one app.
- Remove the temporary Import Repair workspace only after the integrated
  feature is confirmed and the user approves its removal.

## Review gate

Do not connect saving, deletion, or V3 rebuild behavior until the trader has
approved the Import Repair table design. No broad tests are run at this gate.

Progress is tracked in
`src/docs/data-decisions-import-repair-beta-progress-2026-07-29.md`.
