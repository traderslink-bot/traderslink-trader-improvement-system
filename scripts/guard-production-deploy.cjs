#!/usr/bin/env node
"use strict";

const { existsSync, realpathSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { spawnSync } = require("node:child_process");

const EXPECTED_PROJECT_ID = "prj_TFzKcdj4dS6BHv2maWsy7M5AEv2a";
const EXPECTED_ORG_ID = "team_D1yNeyNl1qTvK0pAWMu5nTWY";
const EXPECTED_PROJECT_NAME = "vercel-landing";
const EXPECTED_REMOTE_FRAGMENT = "traderslink-trader-improvement-system";

function fail(message, details = []) {
  console.error(`\n[deploy:prod:guard] BLOCKED: ${message}`);
  for (const detail of details) {
    console.error(`- ${detail}`);
  }
  process.exit(1);
}

function info(message) {
  console.log(`[deploy:prod:guard] ${message}`);
}

function runGit(args, options = {}) {
  const result = spawnSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: options.stdio ?? ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    throw new Error(`git ${args.join(" ")} failed${stderr ? `: ${stderr}` : ""}`);
  }
  return result.stdout.trimEnd();
}

function parseArgs(rawArgs) {
  const options = {
    allow: [],
    preflightOnly: false,
    vercelArgs: ["deploy", "--prod", "--yes"],
  };

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (arg === "--") {
      options.vercelArgs = rawArgs.slice(index + 1);
      break;
    }
    if (arg === "--allow" || arg === "--path") {
      const value = rawArgs[index + 1];
      if (!value) {
        fail(`${arg} requires a path value.`);
      }
      options.allow.push(value);
      index += 1;
      continue;
    }
    if (arg.startsWith("--allow=")) {
      options.allow.push(arg.slice("--allow=".length));
      continue;
    }
    if (arg.startsWith("--path=")) {
      options.allow.push(arg.slice("--path=".length));
      continue;
    }
    if (arg === "--preflight-only") {
      options.preflightOnly = true;
      continue;
    }
    fail(`Unknown argument: ${arg}`);
  }

  return options;
}

function normalizePath(value) {
  return value.replace(/\\/g, "/").replace(/^\.\/+/, "").replace(/\/+$/, "");
}

function statusPath(line) {
  if (line.startsWith("?? ")) {
    return normalizePath(line.slice(3));
  }
  const rawPath = line.slice(3);
  const renameSeparator = " -> ";
  const renamedPath = rawPath.includes(renameSeparator)
    ? rawPath.slice(rawPath.indexOf(renameSeparator) + renameSeparator.length)
    : rawPath;
  return normalizePath(renamedPath.trim());
}

function assertCorrectRepo() {
  const cwd = realpathSync(process.cwd());
  const gitRoot = realpathSync(runGit(["rev-parse", "--show-toplevel"]));
  if (gitRoot !== cwd) {
    fail("production deploy must run from the git root of the canonical website repo.", [
      `cwd: ${cwd}`,
      `git root: ${gitRoot}`,
    ]);
  }

  const remoteUrl = runGit(["remote", "get-url", "origin"]);
  if (!remoteUrl.includes(EXPECTED_REMOTE_FRAGMENT)) {
    fail("git origin does not look like the TradersLink production website repo.", [
      `origin: ${remoteUrl}`,
      `expected fragment: ${EXPECTED_REMOTE_FRAGMENT}`,
    ]);
  }
}

function assertVercelProject() {
  const projectPath = resolve(process.cwd(), ".vercel", "project.json");
  if (!existsSync(projectPath)) {
    fail("missing .vercel/project.json; refusing to guess the production project.");
  }

  const project = JSON.parse(readFileSync(projectPath, "utf8"));
  const problems = [];
  if (project.projectId !== EXPECTED_PROJECT_ID) {
    problems.push(`projectId=${project.projectId ?? "(missing)"}`);
  }
  if (project.orgId !== EXPECTED_ORG_ID) {
    problems.push(`orgId=${project.orgId ?? "(missing)"}`);
  }
  if (project.projectName !== EXPECTED_PROJECT_NAME) {
    problems.push(`projectName=${project.projectName ?? "(missing)"}`);
  }
  if (problems.length > 0) {
    fail("Vercel project link is not the expected TradersLink production project.", problems);
  }
}

function assertBranchAndRemoteSync() {
  const branch = runGit(["branch", "--show-current"]);
  if (branch !== "main") {
    fail("production deploy must run from main.", [`current branch: ${branch || "(detached)"}`]);
  }

  try {
    runGit(["fetch", "--quiet", "origin", "main"], { stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    fail("could not fetch origin/main before deploy.", [error.message]);
  }

  const counts = runGit(["rev-list", "--left-right", "--count", "HEAD...origin/main"])
    .split(/\s+/)
    .map((value) => Number.parseInt(value, 10));
  const ahead = counts[0] ?? 0;
  const behind = counts[1] ?? 0;
  if (behind > 0) {
    fail("local main is behind origin/main; deploying it could restore old pages.", [
      `behind origin/main by ${behind} commit(s)`,
      "pull/rebase or deliberately reconcile current production before deploying",
    ]);
  }
  if (ahead > 0) {
    fail("local main has commits not on origin/main; push/merge first so production has a traceable source.", [
      `ahead of origin/main by ${ahead} commit(s)`,
    ]);
  }
}

function assertDirtyScope(allowedPaths) {
  const statusOutput = runGit(["status", "--porcelain=v1", "-uall"]);
  const lines = statusOutput.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) {
    info("working tree is clean.");
    return;
  }

  const normalizedAllowed = allowedPaths.map(normalizePath);
  const changedPaths = lines.map(statusPath);
  fail("production deploys require a completely clean working tree.", [
    "Vercel publishes the entire application snapshot, so path-scoped dirty deploys can restore old unrelated pages.",
    "commit the intended files, merge them through a green PR, and deploy clean synchronized main",
    ...(normalizedAllowed.length > 0 ? [`requested scope: ${normalizedAllowed.join(", ")}`] : []),
    ...changedPaths.map((filePath) => `uncommitted: ${filePath}`),
  ]);
}

function runVercelDeploy(vercelArgs) {
  const command = process.platform === "win32" ? "npm.cmd" : "npm";
  info(`running: npm exec --yes -- vercel ${vercelArgs.join(" ")}`);
  const result = spawnSync(command, ["exec", "--yes", "--", "vercel", ...vercelArgs], {
    cwd: process.cwd(),
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const options = parseArgs(process.argv.slice(2));

assertCorrectRepo();
assertVercelProject();
assertBranchAndRemoteSync();
assertDirtyScope(options.allow);

if (options.preflightOnly) {
  info("preflight passed; not deploying because --preflight-only was supplied.");
  process.exit(0);
}

runVercelDeploy(options.vercelArgs);
