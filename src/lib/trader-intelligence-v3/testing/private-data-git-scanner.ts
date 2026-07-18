import { execFileSync } from "node:child_process";
import {
  closeSync,
  existsSync,
  lstatSync,
  openSync,
  readlinkSync,
  readSync,
} from "node:fs";
import { resolve } from "node:path";

import type { TraderIntelligencePrivateDataRecord } from "./private-data-guard";

const MAX_PRIVATE_DATA_SCAN_BYTES = 8 * 1024 * 1024;

function git(
  args: readonly string[],
  cwd: string,
  encoding: BufferEncoding | "buffer" = "utf8",
): string | Buffer {
  return execFileSync("git", [...args], {
    cwd,
    encoding: encoding === "buffer" ? null : encoding,
    maxBuffer: MAX_PRIVATE_DATA_SCAN_BYTES + 1024 * 1024,
  });
}

function nulValues(args: readonly string[], cwd: string): readonly string[] {
  return String(git([...args, "-z"], cwd))
    .split("\0")
    .filter(Boolean);
}

function recordFromBuffer(args: {
  path: string;
  buffer: Buffer;
  sourceKind: TraderIntelligencePrivateDataRecord["sourceKind"];
  commit?: string;
}): TraderIntelligencePrivateDataRecord {
  const binary = args.buffer.subarray(0, 8192).includes(0);
  return {
    path: args.path,
    content: binary ? "" : args.buffer.toString("utf8"),
    sourceKind: args.sourceKind,
    commit: args.commit,
    scanStatus: binary ? "binary" : "text",
  };
}

function worktreeRecord(
  path: string,
  cwd: string,
): TraderIntelligencePrivateDataRecord {
  const absolutePath = resolve(cwd, path);
  const status = lstatSync(absolutePath);
  if (status.isSymbolicLink()) {
    return {
      path,
      content: readlinkSync(absolutePath),
      sourceKind: "worktree",
      scanStatus: "text",
    };
  }
  const size = status.size;
  if (size > MAX_PRIVATE_DATA_SCAN_BYTES) {
    return {
      path,
      content: "",
      sourceKind: "worktree",
      scanStatus: "oversized",
    };
  }
  const descriptor = openSync(absolutePath, "r");
  try {
    const buffer = Buffer.alloc(size);
    readSync(descriptor, buffer, 0, size, 0);
    return recordFromBuffer({ path, buffer, sourceKind: "worktree" });
  } finally {
    closeSync(descriptor);
  }
}

function gitBlobRecord(args: {
  object: string;
  path: string;
  cwd: string;
  sourceKind: "staged" | "pr_history";
  commit?: string;
}): TraderIntelligencePrivateDataRecord {
  const size = Number(String(git(["cat-file", "-s", args.object], args.cwd)).trim());
  if (size > MAX_PRIVATE_DATA_SCAN_BYTES) {
    return {
      path: args.path,
      content: "",
      sourceKind: args.sourceKind,
      commit: args.commit,
      scanStatus: "oversized",
    };
  }
  const buffer = git(["cat-file", "blob", args.object], args.cwd, "buffer") as Buffer;
  return recordFromBuffer({
    path: args.path,
    buffer,
    sourceKind: args.sourceKind,
    commit: args.commit,
  });
}

export function collectTraderIntelligenceFinalTreeRecords(
  cwd = process.cwd(),
): readonly TraderIntelligencePrivateDataRecord[] {
  const cachedPaths = nulValues(["ls-files", "--cached"], cwd);
  const untrackedPaths = nulValues(
    ["ls-files", "--others", "--exclude-standard"],
    cwd,
  );
  const records = cachedPaths.map((path) =>
    existsSync(resolve(cwd, path))
      ? worktreeRecord(path, cwd)
      : gitBlobRecord({ object: `:${path}`, path, cwd, sourceKind: "staged" }),
  );
  records.push(...untrackedPaths.map((path) => worktreeRecord(path, cwd)));
  for (const path of nulValues(
    ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
    cwd,
  )) {
    records.push(
      gitBlobRecord({
        object: `:${path}`,
        path,
        cwd,
        sourceKind: "staged",
      }),
    );
  }
  return records;
}

function changedBlobPaths(parent: string, commit: string, cwd: string) {
  const values = nulValues(
    [
      "diff-tree",
      "--no-commit-id",
      "--name-status",
      "-r",
      "--diff-filter=AMCR",
      parent,
      commit,
    ],
    cwd,
  );
  const paths: string[] = [];
  for (let index = 0; index < values.length; ) {
    const status = values[index++];
    if (status.startsWith("R") || status.startsWith("C")) {
      index += 1;
      paths.push(values[index++]);
    } else {
      paths.push(values[index++]);
    }
  }
  return paths;
}

export function collectTraderIntelligencePrHistoryRecords(args: {
  cwd?: string;
  baseRef?: string;
  headRef?: string;
} = {}): readonly TraderIntelligencePrivateDataRecord[] {
  const cwd = args.cwd ?? process.cwd();
  const baseRef = args.baseRef ?? "origin/main";
  const headRef = args.headRef ?? "HEAD";
  const commits = String(
    git(["rev-list", "--reverse", `${baseRef}..${headRef}`], cwd),
  )
    .split(/\r?\n/)
    .filter(Boolean);
  const records: TraderIntelligencePrivateDataRecord[] = [];
  const seen = new Set<string>();

  for (const commit of commits) {
    const parents = String(git(["show", "-s", "--format=%P", commit], cwd))
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    for (const parent of parents) {
      for (const path of changedBlobPaths(parent, commit, cwd)) {
        const key = `${commit}:${path}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        records.push(
          gitBlobRecord({
            object: `${commit}:${path}`,
            path,
            cwd,
            sourceKind: "pr_history",
            commit,
          }),
        );
      }
    }
  }
  return records;
}
