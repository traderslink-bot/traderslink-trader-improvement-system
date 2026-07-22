import { createHash, randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { neon } from "@neondatabase/serverless";
import type Database from "better-sqlite3";

import {
  expandCompletedLessonSlugs,
  getCanonicalProgressLessonSlug,
} from "./academy-progress-slugs";

type SqliteDatabase = Database.Database;
type NeonSql = ReturnType<typeof neon>;

export const ACADEMY_SESSION_COOKIE = "tl_academy_session";
export const ACADEMY_OAUTH_STATE_COOKIE = "tl_academy_oauth_state";
export const ACADEMY_OAUTH_PROMPT_COOKIE = "tl_academy_oauth_prompt";
export const ACADEMY_OAUTH_RETURN_TO_COOKIE = "tl_academy_oauth_return_to";
export const ACADEMY_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export interface AcademyUser {
  discordUserId: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  guildId: string;
  roleIds: string[];
  guildOwner: boolean;
  joinedAt: string | null;
  lastLoginAt: string;
}

export interface AcademySession {
  id: string;
  discordUserId: string;
  expiresAt: string;
  user: AcademyUser;
}

export interface UpsertAcademyUserInput {
  discordUserId: string;
  username: string;
  globalName?: string | null;
  avatar?: string | null;
  guildId: string;
  joinedAt?: string | null;
  rawUser: unknown;
  rawMember: unknown;
}

let sharedSqliteDatabase: SqliteDatabase | null = null;
let sharedNeonSql: NeonSql | null = null;
let sharedNeonSchemaPromise: Promise<void> | null = null;

function academyDatabaseUrl(): string | undefined {
  return process.env.ACADEMY_DATABASE_URL ?? process.env.DATABASE_URL;
}

function shouldUseSqliteFallback(): boolean {
  if (process.env.ACADEMY_PROGRESS_STORAGE === "sqlite") {
    return true;
  }

  if (academyDatabaseUrl()) {
    return false;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Academy progress storage requires ACADEMY_DATABASE_URL or DATABASE_URL in production.",
    );
  }

  return true;
}

function databasePath(): string {
  const configured = process.env.TRADER_INTELLIGENCE_DB_PATH;

  if (configured) {
    return isAbsolute(configured)
      ? configured
      : join(process.cwd(), configured);
  }

  return join(process.cwd(), "data", "trader-intelligence.sqlite");
}

function getNeonSql(): NeonSql {
  const databaseUrl = academyDatabaseUrl();

  if (!databaseUrl) {
    throw new Error(
      "Academy progress storage requires ACADEMY_DATABASE_URL or DATABASE_URL in production.",
    );
  }

  if (!sharedNeonSql) {
    sharedNeonSql = neon(databaseUrl);
  }

  return sharedNeonSql;
}

async function getSqliteDatabase(): Promise<SqliteDatabase> {
  if (sharedSqliteDatabase) {
    return sharedSqliteDatabase;
  }

  const { default: Database } = await import("better-sqlite3");
  const filePath = databasePath();
  mkdirSync(dirname(filePath), { recursive: true });
  sharedSqliteDatabase = new Database(filePath);
  runAcademySqliteMigrations(sharedSqliteDatabase);
  return sharedSqliteDatabase;
}

async function ensureNeonSchema(): Promise<void> {
  if (sharedNeonSchemaPromise) {
    return sharedNeonSchemaPromise;
  }

  const sql = getNeonSql();

  sharedNeonSchemaPromise = (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS academy_users (
        discord_user_id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        global_name TEXT,
        avatar TEXT,
        guild_id TEXT NOT NULL,
        joined_at TEXT,
        last_login_at TEXT NOT NULL,
        json TEXT NOT NULL
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS academy_sessions (
        id TEXT PRIMARY KEY,
        discord_user_id TEXT NOT NULL REFERENCES academy_users(discord_user_id),
        token_hash TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        revoked_at TEXT
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS academy_sessions_user_expires
      ON academy_sessions(discord_user_id, expires_at)
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS academy_lesson_completions (
        discord_user_id TEXT NOT NULL REFERENCES academy_users(discord_user_id),
        lesson_slug TEXT NOT NULL,
        completed_at TEXT NOT NULL,
        PRIMARY KEY (discord_user_id, lesson_slug)
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS academy_lesson_completions_user
      ON academy_lesson_completions(discord_user_id, completed_at)
    `;
  })();

  return sharedNeonSchemaPromise;
}

export async function getAcademyDatabase(): Promise<SqliteDatabase> {
  return getSqliteDatabase();
}

export function resetAcademyDatabaseForTests(): void {
  sharedSqliteDatabase?.close();
  sharedSqliteDatabase = null;
  sharedNeonSql = null;
  sharedNeonSchemaPromise = null;
}

export function runAcademySqliteMigrations(db: SqliteDatabase): void {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS academy_users (
      discord_user_id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      global_name TEXT,
      avatar TEXT,
      guild_id TEXT NOT NULL,
      joined_at TEXT,
      last_login_at TEXT NOT NULL,
      json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS academy_sessions (
      id TEXT PRIMARY KEY,
      discord_user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      revoked_at TEXT,
      FOREIGN KEY (discord_user_id) REFERENCES academy_users(discord_user_id)
    );

    CREATE INDEX IF NOT EXISTS academy_sessions_user_expires
      ON academy_sessions(discord_user_id, expires_at);

    CREATE TABLE IF NOT EXISTS academy_lesson_completions (
      discord_user_id TEXT NOT NULL,
      lesson_slug TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      PRIMARY KEY (discord_user_id, lesson_slug),
      FOREIGN KEY (discord_user_id) REFERENCES academy_users(discord_user_id)
    );

    CREATE INDEX IF NOT EXISTS academy_lesson_completions_user
      ON academy_lesson_completions(discord_user_id, completed_at);
  `);
}

export const runAcademyMigrations = runAcademySqliteMigrations;

export function createAcademySessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashAcademySessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function extractRoleIds(row: Record<string, unknown>): string[] {
  const rawJson = row.json;
  if (typeof rawJson !== "string") {
    return [];
  }
  try {
    const parsed = JSON.parse(rawJson) as { member?: { roles?: unknown } };
    return Array.isArray(parsed.member?.roles)
      ? parsed.member.roles.filter((role): role is string => typeof role === "string")
      : [];
  } catch {
    return [];
  }
}

function extractRoleIdsFromMember(rawMember: unknown): string[] {
  if (typeof rawMember !== "object" || rawMember === null) {
    return [];
  }
  const roles = (rawMember as { roles?: unknown }).roles;
  return Array.isArray(roles)
    ? roles.filter((role): role is string => typeof role === "string")
    : [];
}

function extractGuildOwnerFromMember(rawMember: unknown): boolean {
  return (
    typeof rawMember === "object" &&
    rawMember !== null &&
    (rawMember as { guild_owner?: unknown }).guild_owner === true
  );
}

function extractGuildOwner(row: Record<string, unknown>): boolean {
  const rawJson = row.json;
  if (typeof rawJson !== "string") {
    return false;
  }
  try {
    const parsed = JSON.parse(rawJson) as {
      member?: { guild_owner?: unknown };
    };
    return parsed.member?.guild_owner === true;
  } catch {
    return false;
  }
}

function rowToUser(row: Record<string, unknown>): AcademyUser {
  return {
    discordUserId: String(row.discord_user_id),
    username: String(row.username),
    globalName:
      typeof row.global_name === "string" ? String(row.global_name) : null,
    avatar: typeof row.avatar === "string" ? String(row.avatar) : null,
    guildId: String(row.guild_id),
    roleIds: extractRoleIds(row),
    guildOwner: extractGuildOwner(row),
    joinedAt: typeof row.joined_at === "string" ? String(row.joined_at) : null,
    lastLoginAt: String(row.last_login_at),
  };
}

function rowToSession(row: Record<string, unknown>): AcademySession {
  return {
    id: String(row.id),
    discordUserId: String(row.discord_user_id),
    expiresAt: String(row.expires_at),
    user: rowToUser(row),
  };
}

export class AcademyProgressStore {
  async upsertUser(input: UpsertAcademyUserInput): Promise<AcademyUser> {
    const now = new Date().toISOString();

    if (!shouldUseSqliteFallback()) {
      await ensureNeonSchema();
      const sql = getNeonSql();
      await sql`
        INSERT INTO academy_users (
          discord_user_id,
          username,
          global_name,
          avatar,
          guild_id,
          joined_at,
          last_login_at,
          json
        )
        VALUES (
          ${input.discordUserId},
          ${input.username},
          ${input.globalName ?? null},
          ${input.avatar ?? null},
          ${input.guildId},
          ${input.joinedAt ?? null},
          ${now},
          ${JSON.stringify({ user: input.rawUser, member: input.rawMember })}
        )
        ON CONFLICT (discord_user_id) DO UPDATE SET
          username = EXCLUDED.username,
          global_name = EXCLUDED.global_name,
          avatar = EXCLUDED.avatar,
          guild_id = EXCLUDED.guild_id,
          joined_at = EXCLUDED.joined_at,
          last_login_at = EXCLUDED.last_login_at,
          json = EXCLUDED.json
      `;

      return {
        discordUserId: input.discordUserId,
        username: input.username,
        globalName: input.globalName ?? null,
        avatar: input.avatar ?? null,
        guildId: input.guildId,
        roleIds: extractRoleIdsFromMember(input.rawMember),
        guildOwner: extractGuildOwnerFromMember(input.rawMember),
        joinedAt: input.joinedAt ?? null,
        lastLoginAt: now,
      };
    }

    const db = await getSqliteDatabase();
    db.prepare(
      `
        INSERT INTO academy_users (
          discord_user_id,
          username,
          global_name,
          avatar,
          guild_id,
          joined_at,
          last_login_at,
          json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(discord_user_id) DO UPDATE SET
          username = excluded.username,
          global_name = excluded.global_name,
          avatar = excluded.avatar,
          guild_id = excluded.guild_id,
          joined_at = excluded.joined_at,
          last_login_at = excluded.last_login_at,
          json = excluded.json
      `,
    ).run(
      input.discordUserId,
      input.username,
      input.globalName ?? null,
      input.avatar ?? null,
      input.guildId,
      input.joinedAt ?? null,
      now,
      JSON.stringify({
        user: input.rawUser,
        member: input.rawMember,
      }),
    );

    return {
      discordUserId: input.discordUserId,
      username: input.username,
      globalName: input.globalName ?? null,
      avatar: input.avatar ?? null,
      guildId: input.guildId,
      roleIds: extractRoleIdsFromMember(input.rawMember),
      guildOwner: extractGuildOwnerFromMember(input.rawMember),
      joinedAt: input.joinedAt ?? null,
      lastLoginAt: now,
    };
  }

  async createSession(discordUserId: string): Promise<{
    token: string;
    session: AcademySession;
  }> {
    const token = createAcademySessionToken();
    const tokenHash = hashAcademySessionToken(token);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ACADEMY_SESSION_TTL_MS);
    const id = randomBytes(16).toString("hex");

    if (!shouldUseSqliteFallback()) {
      await ensureNeonSchema();
      const sql = getNeonSql();
      await sql`
        INSERT INTO academy_sessions (
          id,
          discord_user_id,
          token_hash,
          created_at,
          expires_at,
          revoked_at
        )
        VALUES (
          ${id},
          ${discordUserId},
          ${tokenHash},
          ${now.toISOString()},
          ${expiresAt.toISOString()},
          NULL
        )
      `;
    } else {
      const db = await getSqliteDatabase();
      db.prepare(
        `
          INSERT INTO academy_sessions (
            id,
            discord_user_id,
            token_hash,
            created_at,
            expires_at,
            revoked_at
          )
          VALUES (?, ?, ?, ?, ?, NULL)
        `,
      ).run(
        id,
        discordUserId,
        tokenHash,
        now.toISOString(),
        expiresAt.toISOString(),
      );
    }

    const session = await this.getSessionByToken(token);

    if (!session) {
      throw new Error("Academy session could not be created.");
    }

    return { token, session };
  }

  async getSessionByToken(
    token: string | undefined,
  ): Promise<AcademySession | null> {
    if (!token) {
      return null;
    }

    if (!shouldUseSqliteFallback()) {
      await ensureNeonSchema();
      const sql = getNeonSql();
      const rows = (await sql`
        SELECT
          s.id,
          s.discord_user_id,
          s.expires_at,
          u.username,
          u.global_name,
          u.avatar,
          u.guild_id,
          u.joined_at,
          u.last_login_at,
          u.json
        FROM academy_sessions s
        JOIN academy_users u ON u.discord_user_id = s.discord_user_id
        WHERE s.token_hash = ${hashAcademySessionToken(token)}
          AND s.revoked_at IS NULL
          AND s.expires_at > ${new Date().toISOString()}
        LIMIT 1
      `) as Array<Record<string, unknown>>;

      return rows[0] ? rowToSession(rows[0]) : null;
    }

    const db = await getSqliteDatabase();
    const row = db
      .prepare(
        `
          SELECT
            s.id,
            s.discord_user_id,
            s.expires_at,
            u.username,
            u.global_name,
            u.avatar,
            u.guild_id,
            u.joined_at,
            u.last_login_at,
            u.json
          FROM academy_sessions s
          JOIN academy_users u ON u.discord_user_id = s.discord_user_id
          WHERE s.token_hash = ?
            AND s.revoked_at IS NULL
            AND s.expires_at > ?
        `,
      )
      .get(hashAcademySessionToken(token), new Date().toISOString()) as
      | Record<string, unknown>
      | undefined;

    return row ? rowToSession(row) : null;
  }

  async revokeSessionToken(token: string | undefined): Promise<void> {
    if (!token) {
      return;
    }

    if (!shouldUseSqliteFallback()) {
      await ensureNeonSchema();
      const sql = getNeonSql();
      await sql`
        UPDATE academy_sessions
        SET revoked_at = ${new Date().toISOString()}
        WHERE token_hash = ${hashAcademySessionToken(token)}
      `;
      return;
    }

    const db = await getSqliteDatabase();
    db.prepare(
      `
        UPDATE academy_sessions
        SET revoked_at = ?
        WHERE token_hash = ?
      `,
    ).run(new Date().toISOString(), hashAcademySessionToken(token));
  }

  async listCompletedLessonSlugs(discordUserId: string): Promise<string[]> {
    if (!shouldUseSqliteFallback()) {
      await ensureNeonSchema();
      const sql = getNeonSql();
      const rows = (await sql`
        SELECT lesson_slug
        FROM academy_lesson_completions
        WHERE discord_user_id = ${discordUserId}
        ORDER BY completed_at
      `) as Array<{ lesson_slug: string }>;

      return expandCompletedLessonSlugs(rows.map((row) => row.lesson_slug));
    }

    const db = await getSqliteDatabase();
    const rows = db
      .prepare(
        `
          SELECT lesson_slug
          FROM academy_lesson_completions
          WHERE discord_user_id = ?
          ORDER BY completed_at
        `,
      )
      .all(discordUserId) as Array<{ lesson_slug: string }>;

    return expandCompletedLessonSlugs(rows.map((row) => row.lesson_slug));
  }

  async isLessonCompleted(
    discordUserId: string,
    lessonSlug: string,
  ): Promise<boolean> {
    const completedLessonSlugs = await this.listCompletedLessonSlugs(
      discordUserId,
    );

    return completedLessonSlugs.includes(
      getCanonicalProgressLessonSlug(lessonSlug),
    );
  }

  async setLessonCompleted(args: {
    discordUserId: string;
    lessonSlug: string;
    completed: boolean;
  }): Promise<void> {
    const lessonSlug = getCanonicalProgressLessonSlug(args.lessonSlug);

    if (!shouldUseSqliteFallback()) {
      await ensureNeonSchema();
      const sql = getNeonSql();

      if (args.completed) {
        await sql`
          INSERT INTO academy_lesson_completions (
            discord_user_id,
            lesson_slug,
            completed_at
          )
          VALUES (
            ${args.discordUserId},
            ${lessonSlug},
            ${new Date().toISOString()}
          )
          ON CONFLICT (discord_user_id, lesson_slug) DO UPDATE SET
            completed_at = EXCLUDED.completed_at
        `;
        return;
      }

      await sql`
        DELETE FROM academy_lesson_completions
        WHERE discord_user_id = ${args.discordUserId}
          AND lesson_slug = ${lessonSlug}
      `;
      return;
    }

    const db = await getSqliteDatabase();

    if (args.completed) {
      db.prepare(
        `
          INSERT INTO academy_lesson_completions (
            discord_user_id,
            lesson_slug,
            completed_at
          )
          VALUES (?, ?, ?)
          ON CONFLICT(discord_user_id, lesson_slug) DO UPDATE SET
            completed_at = excluded.completed_at
        `,
      ).run(args.discordUserId, lessonSlug, new Date().toISOString());
      return;
    }

    db.prepare(
      `
        DELETE FROM academy_lesson_completions
        WHERE discord_user_id = ?
          AND lesson_slug = ?
      `,
    ).run(args.discordUserId, lessonSlug);
  }
}
