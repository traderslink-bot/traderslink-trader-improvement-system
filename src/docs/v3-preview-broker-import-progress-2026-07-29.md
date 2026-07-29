# Isolated V3 Preview Broker CSV Import

## Scope

Repair the broker CSV importer only for the isolated `codex/v3-journal-preview`
Vercel Preview deployment. Persist imports and import history in the dedicated
Neon test database. Do not change production, the live website, or the local
file-backed import workflow.

## Plan

- [x] Identify the Preview-only failure boundary and confirm its Neon cause.
- [x] Add a Neon-backed broker-import persistence and history path.
- [x] Keep the existing local file-backed importer unchanged.
- [x] Rebuild the V3 analytics authority directly from the Neon import records.
- [ ] Deploy to Vercel Preview and smoke-test a synthetic CSV against only the
      dedicated Neon test database.
- [ ] Record the result and the next handoff point.

## Current finding

The Preview deployment is correctly configured with
`persistence.kind = private_database`, while the broker CSV route currently
rejects every non-file persistence mode before parsing the upload. The Day
Session manual-entry route already uses the same isolated Neon store.
