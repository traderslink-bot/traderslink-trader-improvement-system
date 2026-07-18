import { existsSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import {
  dirname,
  isAbsolute,
  relative,
  resolve,
  sep,
} from "node:path";

import type { TraderIntelligenceEnvironment } from "./deployment-contract";

export type TraderIntelligencePersistenceReasonCode =
  | "ti_v3_db_path_missing"
  | "ti_v3_db_path_empty"
  | "ti_v3_db_path_relative_ambiguous"
  | "ti_v3_private_data_root_invalid"
  | "ti_v3_db_path_temp_forbidden"
  | "ti_v3_db_path_repository_forbidden"
  | "ti_v3_sample_data_db_path_forbidden";

export type TraderIntelligenceLocalPersistenceResolution =
  | { ok: true; kind: "in_memory"; databaseTarget: ":memory:" }
  | { ok: true; kind: "file"; databaseTarget: string; parentPath: string }
  | { ok: false; code: TraderIntelligencePersistenceReasonCode };

function comparablePath(path: string): string {
  const resolved = resolve(path);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function isWithinOrEqual(path: string, parent: string): boolean {
  const candidate = comparablePath(path);
  const boundary = comparablePath(parent);
  return candidate === boundary || candidate.startsWith(`${boundary}${sep}`);
}

function canonicalizeUsingExistingAncestor(path: string): string {
  const suffix: string[] = [];
  let cursor = resolve(path);
  while (!existsSync(cursor)) {
    const parent = dirname(cursor);
    if (parent === cursor) {
      return resolve(path);
    }
    suffix.unshift(cursor.slice(parent.length + 1));
    cursor = parent;
  }
  return resolve(realpathSync.native(cursor), ...suffix);
}

export function resolveTraderIntelligenceLocalPersistence(args: {
  environment: TraderIntelligenceEnvironment;
  dataMode: "sample_data" | "real_owner_data";
  repositoryRoot?: string;
  temporaryRoot?: string;
}): TraderIntelligenceLocalPersistenceResolution {
  const rawPath = args.environment.TRADER_INTELLIGENCE_DB_PATH;
  if (args.dataMode === "sample_data") {
    if (rawPath !== undefined) {
      return { ok: false, code: "ti_v3_sample_data_db_path_forbidden" };
    }
    return { ok: true, kind: "in_memory", databaseTarget: ":memory:" };
  }

  if (rawPath === undefined) {
    return { ok: false, code: "ti_v3_db_path_missing" };
  }
  const configuredPath = rawPath.trim();
  if (!configuredPath) {
    return { ok: false, code: "ti_v3_db_path_empty" };
  }

  let candidatePath: string;
  if (isAbsolute(configuredPath)) {
    candidatePath = resolve(configuredPath);
  } else {
    const rawPrivateRoot =
      args.environment.TRADER_INTELLIGENCE_PRIVATE_DATA_ROOT?.trim();
    if (!rawPrivateRoot) {
      return { ok: false, code: "ti_v3_db_path_relative_ambiguous" };
    }
    if (!isAbsolute(rawPrivateRoot)) {
      return { ok: false, code: "ti_v3_private_data_root_invalid" };
    }
    const privateRoot = canonicalizeUsingExistingAncestor(rawPrivateRoot);
    candidatePath = canonicalizeUsingExistingAncestor(
      resolve(privateRoot, configuredPath),
    );
    if (!isWithinOrEqual(candidatePath, privateRoot)) {
      return { ok: false, code: "ti_v3_db_path_relative_ambiguous" };
    }
  }

  candidatePath = canonicalizeUsingExistingAncestor(candidatePath);
  const repositoryRoot = canonicalizeUsingExistingAncestor(
    args.repositoryRoot ?? process.cwd(),
  );
  if (isWithinOrEqual(candidatePath, repositoryRoot)) {
    return { ok: false, code: "ti_v3_db_path_repository_forbidden" };
  }

  const temporaryRoot = canonicalizeUsingExistingAncestor(
    args.temporaryRoot ?? tmpdir(),
  );
  if (isWithinOrEqual(candidatePath, temporaryRoot)) {
    return { ok: false, code: "ti_v3_db_path_temp_forbidden" };
  }

  const relativeToRepository = relative(repositoryRoot, candidatePath);
  if (
    relativeToRepository === "" ||
    (!relativeToRepository.startsWith("..") &&
      !isAbsolute(relativeToRepository))
  ) {
    return { ok: false, code: "ti_v3_db_path_repository_forbidden" };
  }

  return {
    ok: true,
    kind: "file",
    databaseTarget: candidatePath,
    parentPath: dirname(candidatePath),
  };
}
