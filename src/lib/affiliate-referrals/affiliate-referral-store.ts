import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { neon } from "@neondatabase/serverless";
import type Database from "better-sqlite3";

type SqliteDatabase = Database.Database;
type NeonSql = ReturnType<typeof neon>;

export interface AffiliateInviteRecord {
  active: boolean;
  affiliateCode: string;
  affiliateName: string | null;
  createdAt: string;
  inviteCode: string;
  updatedAt: string;
}

export interface AffiliateReferralRecord {
  affiliateCode: string;
  createdAt: string;
  discordUserId: string;
  firstSeenAt: string;
  inviteCode: string | null;
  joinedAt: string | null;
  lastSeenAt: string;
  source: string;
}

let sharedSqliteDatabase: SqliteDatabase | null = null;
let sharedNeonSql: NeonSql | null = null;
let sharedNeonSchemaPromise: Promise<void> | null = null;

export function normalizeAffiliateCode(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    const affiliateParam = parsed.searchParams.get("a");
    if (affiliateParam) {
      return normalizeAffiliateCode(affiliateParam);
    }
  } catch {
    const match = raw.match(/[?&]a=([^&#\s]+)/i);
    if (match?.[1]) {
      return normalizeAffiliateCode(decodeURIComponent(match[1]));
    }
  }

  return raw
    .trim()
    .replace(/^@+/, "")
    .replace(/^\?a=/i, "")
    .replace(/[^a-zA-Z0-9_.-]/g, "")
    .slice(0, 80);
}

export function normalizeInviteCode(value: string | null | undefined): string {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";

  try {
    const parsed = new URL(trimmed);
    const parts = parsed.pathname.split("/").filter(Boolean);
    return String(parts[parts.length - 1] ?? "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 96);
  } catch {
    return trimmed.replace(/^https?:\/\/(www\.)?(discord\.gg|discord(app)?\.com\/invite)\//i, "")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 96);
  }
}

export function buildWhopCheckoutUrl(args: {
  affiliateCode?: string | null;
  baseUrl?: string | null;
}): string {
  const fallback = "https://whop.com/traderslink-app/filtered-news-momentum-scanner-access/";
  const baseUrl = String(args.baseUrl || process.env.TRADERSLINK_WHOP_PRODUCT_URL || fallback).trim();
  const affiliateCode = normalizeAffiliateCode(args.affiliateCode);

  const url = new URL(baseUrl || fallback);
  if (affiliateCode) {
    url.searchParams.set("a", affiliateCode);
  }
  return url.toString();
}

function referralDatabaseUrl(): string | undefined {
  return (
    process.env.AFFILIATE_REFERRAL_DATABASE_URL ??
    process.env.ACADEMY_DATABASE_URL ??
    process.env.DATABASE_URL
  );
}

function shouldUseSqliteFallback(): boolean {
  if (process.env.AFFILIATE_REFERRAL_STORAGE === "sqlite") {
    return true;
  }

  if (referralDatabaseUrl()) {
    return false;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Affiliate referral storage requires AFFILIATE_REFERRAL_DATABASE_URL, ACADEMY_DATABASE_URL, or DATABASE_URL in production.",
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
  const databaseUrl = referralDatabaseUrl();
  if (!databaseUrl) {
    throw new Error("Affiliate referral database URL is not configured.");
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
  runAffiliateReferralSqliteMigrations(sharedSqliteDatabase);
  return sharedSqliteDatabase;
}

async function ensureNeonSchema(): Promise<void> {
  if (sharedNeonSchemaPromise) {
    return sharedNeonSchemaPromise;
  }

  const sql = getNeonSql();
  sharedNeonSchemaPromise = (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS affiliate_invites (
        invite_code TEXT PRIMARY KEY,
        affiliate_code TEXT NOT NULL,
        affiliate_name TEXT,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        json TEXT NOT NULL
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS affiliate_invites_affiliate_code
      ON affiliate_invites(affiliate_code)
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS affiliate_discord_referrals (
        discord_user_id TEXT PRIMARY KEY,
        affiliate_code TEXT NOT NULL,
        invite_code TEXT,
        joined_at TEXT,
        first_seen_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        source TEXT NOT NULL,
        created_at TEXT NOT NULL,
        json TEXT NOT NULL
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS affiliate_discord_referrals_affiliate_code
      ON affiliate_discord_referrals(affiliate_code, first_seen_at)
    `;
  })();

  return sharedNeonSchemaPromise;
}

export function runAffiliateReferralSqliteMigrations(db: SqliteDatabase): void {
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS affiliate_invites (
      invite_code TEXT PRIMARY KEY,
      affiliate_code TEXT NOT NULL,
      affiliate_name TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS affiliate_invites_affiliate_code
      ON affiliate_invites(affiliate_code);

    CREATE TABLE IF NOT EXISTS affiliate_discord_referrals (
      discord_user_id TEXT PRIMARY KEY,
      affiliate_code TEXT NOT NULL,
      invite_code TEXT,
      joined_at TEXT,
      first_seen_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      source TEXT NOT NULL,
      created_at TEXT NOT NULL,
      json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS affiliate_discord_referrals_affiliate_code
      ON affiliate_discord_referrals(affiliate_code, first_seen_at);
  `);
}

export function resetAffiliateReferralStoreForTests(): void {
  sharedSqliteDatabase?.close();
  sharedSqliteDatabase = null;
  sharedNeonSql = null;
  sharedNeonSchemaPromise = null;
}

function rowToInvite(row: Record<string, unknown>): AffiliateInviteRecord {
  return {
    active: Boolean(Number(row.active ?? 0)),
    affiliateCode: String(row.affiliate_code),
    affiliateName: typeof row.affiliate_name === "string" ? row.affiliate_name : null,
    createdAt: String(row.created_at),
    inviteCode: String(row.invite_code),
    updatedAt: String(row.updated_at),
  };
}

function rowToReferral(row: Record<string, unknown>): AffiliateReferralRecord {
  return {
    affiliateCode: String(row.affiliate_code),
    createdAt: String(row.created_at),
    discordUserId: String(row.discord_user_id),
    firstSeenAt: String(row.first_seen_at),
    inviteCode: typeof row.invite_code === "string" ? row.invite_code : null,
    joinedAt: typeof row.joined_at === "string" ? row.joined_at : null,
    lastSeenAt: String(row.last_seen_at),
    source: String(row.source),
  };
}

function safeJson(value: unknown): string {
  return JSON.stringify(value ?? {});
}

export class AffiliateReferralStore {
  async upsertInvite(args: {
    affiliateCode: string;
    affiliateName?: string | null;
    active?: boolean;
    inviteCode: string;
    metadata?: unknown;
  }): Promise<AffiliateInviteRecord> {
    const affiliateCode = normalizeAffiliateCode(args.affiliateCode);
    const inviteCode = normalizeInviteCode(args.inviteCode);
    if (!affiliateCode || !inviteCode) {
      throw new Error("affiliate_code_and_invite_code_required");
    }

    const now = new Date().toISOString();
    const active = args.active ?? true;
    const json = safeJson({
      affiliateCode,
      affiliateName: args.affiliateName ?? null,
      inviteCode,
      metadata: args.metadata ?? null,
    });

    if (!shouldUseSqliteFallback()) {
      await ensureNeonSchema();
      const sql = getNeonSql();
      await sql`
        INSERT INTO affiliate_invites (
          invite_code, affiliate_code, affiliate_name, active, created_at, updated_at, json
        )
        VALUES (
          ${inviteCode}, ${affiliateCode}, ${args.affiliateName ?? null}, ${active},
          ${now}, ${now}, ${json}
        )
        ON CONFLICT (invite_code) DO UPDATE SET
          affiliate_code = EXCLUDED.affiliate_code,
          affiliate_name = EXCLUDED.affiliate_name,
          active = EXCLUDED.active,
          updated_at = EXCLUDED.updated_at,
          json = EXCLUDED.json
      `;
      return {
        active,
        affiliateCode,
        affiliateName: args.affiliateName ?? null,
        createdAt: now,
        inviteCode,
        updatedAt: now,
      };
    }

    const db = await getSqliteDatabase();
    db.prepare(
      `INSERT INTO affiliate_invites (
        invite_code, affiliate_code, affiliate_name, active, created_at, updated_at, json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(invite_code) DO UPDATE SET
        affiliate_code = excluded.affiliate_code,
        affiliate_name = excluded.affiliate_name,
        active = excluded.active,
        updated_at = excluded.updated_at,
        json = excluded.json`,
    ).run(inviteCode, affiliateCode, args.affiliateName ?? null, active ? 1 : 0, now, now, json);

    return {
      active,
      affiliateCode,
      affiliateName: args.affiliateName ?? null,
      createdAt: now,
      inviteCode,
      updatedAt: now,
    };
  }

  async findInvite(inviteCode: string): Promise<AffiliateInviteRecord | null> {
    const normalized = normalizeInviteCode(inviteCode);
    if (!normalized) return null;

    if (!shouldUseSqliteFallback()) {
      await ensureNeonSchema();
      const sql = getNeonSql();
      const rows = (await sql`
        SELECT * FROM affiliate_invites
        WHERE invite_code = ${normalized}
        LIMIT 1
      `) as Array<Record<string, unknown>>;
      return rows[0] ? rowToInvite(rows[0]) : null;
    }

    const db = await getSqliteDatabase();
    const row = db
      .prepare("SELECT * FROM affiliate_invites WHERE invite_code = ? LIMIT 1")
      .get(normalized) as Record<string, unknown> | undefined;
    return row ? rowToInvite(row) : null;
  }

  async recordDiscordReferral(args: {
    affiliateCode?: string | null;
    discordUserId: string;
    inviteCode?: string | null;
    joinedAt?: string | null;
    metadata?: unknown;
    source?: string | null;
  }): Promise<AffiliateReferralRecord> {
    const discordUserId = String(args.discordUserId ?? "").trim();
    const inviteCode = normalizeInviteCode(args.inviteCode);
    let affiliateCode = normalizeAffiliateCode(args.affiliateCode);

    if (!affiliateCode && inviteCode) {
      const invite = await this.findInvite(inviteCode);
      if (invite?.active) {
        affiliateCode = invite.affiliateCode;
      }
    }

    if (!discordUserId || !affiliateCode) {
      throw new Error("discord_user_id_and_affiliate_code_required");
    }

    const now = new Date().toISOString();
    const joinedAt = args.joinedAt?.trim() || null;
    const source = args.source?.trim() || "discord_invite";
    const json = safeJson({
      discordUserId,
      affiliateCode,
      inviteCode: inviteCode || null,
      joinedAt,
      metadata: args.metadata ?? null,
      source,
    });

    if (!shouldUseSqliteFallback()) {
      await ensureNeonSchema();
      const sql = getNeonSql();
      await sql`
        INSERT INTO affiliate_discord_referrals (
          discord_user_id, affiliate_code, invite_code, joined_at,
          first_seen_at, last_seen_at, source, created_at, json
        )
        VALUES (
          ${discordUserId}, ${affiliateCode}, ${inviteCode || null}, ${joinedAt},
          ${now}, ${now}, ${source}, ${now}, ${json}
        )
        ON CONFLICT (discord_user_id) DO UPDATE SET
          last_seen_at = EXCLUDED.last_seen_at
      `;
      const existing = await this.findReferralByDiscordUserId(discordUserId);
      if (existing) return existing;
    } else {
      const db = await getSqliteDatabase();
      db.prepare(
        `INSERT INTO affiliate_discord_referrals (
          discord_user_id, affiliate_code, invite_code, joined_at,
          first_seen_at, last_seen_at, source, created_at, json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(discord_user_id) DO UPDATE SET
          last_seen_at = excluded.last_seen_at`,
      ).run(
        discordUserId,
        affiliateCode,
        inviteCode || null,
        joinedAt,
        now,
        now,
        source,
        now,
        json,
      );

      const existing = await this.findReferralByDiscordUserId(discordUserId);
      if (existing) return existing;
    }

    return {
      affiliateCode,
      createdAt: now,
      discordUserId,
      firstSeenAt: now,
      inviteCode: inviteCode || null,
      joinedAt,
      lastSeenAt: now,
      source,
    };
  }

  async findReferralByDiscordUserId(
    discordUserId: string | null | undefined,
  ): Promise<AffiliateReferralRecord | null> {
    const normalized = String(discordUserId ?? "").trim();
    if (!normalized) return null;

    if (!shouldUseSqliteFallback()) {
      await ensureNeonSchema();
      const sql = getNeonSql();
      const rows = (await sql`
        SELECT * FROM affiliate_discord_referrals
        WHERE discord_user_id = ${normalized}
        LIMIT 1
      `) as Array<Record<string, unknown>>;
      return rows[0] ? rowToReferral(rows[0]) : null;
    }

    const db = await getSqliteDatabase();
    const row = db
      .prepare(
        "SELECT * FROM affiliate_discord_referrals WHERE discord_user_id = ? LIMIT 1",
      )
      .get(normalized) as Record<string, unknown> | undefined;
    return row ? rowToReferral(row) : null;
  }
}

export function createReferralIngestId(): string {
  return `affiliate_referral_${randomBytes(10).toString("base64url")}`;
}
