# Excluded private and unsafe artifacts

No excluded artifact content was opened, copied, hashed into this package, printed, or committed.

| Artifact category | Sanitized source-location description | Exclusion reason | Source-code reference |
| --- | --- | --- | --- |
| SQLite database backup | Untracked backup area in the contaminated V2 stash/worktree | Contains owner-local persisted data and is not source code | V2 repository code references a configurable SQLite path |
| SQLite WAL/SHM and database sidecars | V2 persistence and backup areas | May contain recoverable owner transactions or database pages | SQLite repository implementation can create sidecars at runtime |
| Real broker CSV/export files | V2 local import and backup areas | May contain account identifiers and real executions | Manual entry intentionally targets the import contract, but no CSV artifact is preserved |
| Environment/credential files | Local repository configuration areas | May contain API keys, tokens, cookies, webhook secrets, or database paths | Preserved code records environment-variable names only |
| Screenshots and browser traces | TraderLink screenshot, test-output, and browser-artifact areas | May expose account, trade, session, or identity data | No runtime dependency |
| Generated owner reports and logs | Local development/test-output areas | May include real symbols, trade IDs, notes, or import IDs | Reflection code can generate reports, but only source and synthetic tests are preserved |

The contaminated V2 stash is `stash@{2026-05-19 17:58:53 -0400}` at object `5abbb7ce7ec9784a8bd71c4994590e168838c9e3`. It remains unchanged. Only its metadata, file list, and sanitized patch structure were inspected.
