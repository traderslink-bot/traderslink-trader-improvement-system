import {
  SqliteImportCommitRepository,
  type PersistedOwnerWorkspaceAccount,
} from "../product/import-commit/sqlite-import-commit-repository";

interface AuthorizedOwnerIdentity {
  identity: { ownerId: string };
}

/**
 * The only tenancy adapter used by owner-facing import routes.  The owner id
 * comes from the already-authorized v3 boundary; account identifiers are never
 * accepted from the browser.
 */
export interface OwnerWorkspaceImportContext {
  ownerId: string;
  workspaceId: string;
  account: PersistedOwnerWorkspaceAccount;
}

export function resolveOwnerWorkspaceImportContext(args: {
  owner: AuthorizedOwnerIdentity;
  repository?: SqliteImportCommitRepository;
}): OwnerWorkspaceImportContext {
  const repository = args.repository ?? new SqliteImportCommitRepository();
  const account = repository.getOrCreateOwnerWorkspaceAccount(
    args.owner.identity.ownerId,
  );
  return {
    ownerId: args.owner.identity.ownerId,
    workspaceId: account.workspaceId,
    account,
  };
}

/** Call only after withTraderIntelligenceOwnerRoute has authorized the request. */
export function resolveConfiguredOwnerWorkspaceImportContext(args: {
  repository?: SqliteImportCommitRepository;
}): OwnerWorkspaceImportContext {
  const ownerId = process.env.TRADER_INTELLIGENCE_OWNER_ID?.trim();
  if (!ownerId) throw new Error("ti_v3_owner_id_missing");
  return resolveOwnerWorkspaceImportContext({
    owner: { identity: { ownerId } },
    repository: args.repository,
  });
}
