import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GET as callbackGET } from "../../../../app/api/auth/discord/callback/route";
import { GET as loginGET } from "../../../../app/api/auth/discord/login/route";
import {
  ACADEMY_OAUTH_PROMPT_COOKIE,
  ACADEMY_OAUTH_RETURN_TO_COOKIE,
  ACADEMY_OAUTH_STATE_COOKIE,
  ACADEMY_SESSION_COOKIE,
  AcademyProgressStore,
} from "../academy-progress-store";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Discord Academy auth routes", () => {
  it("keeps users with an active Academy session out of Discord OAuth", async () => {
    vi.stubEnv("ACADEMY_PROGRESS_STORAGE", "sqlite");
    vi.stubEnv(
      "TRADER_INTELLIGENCE_DB_PATH",
      join(tmpdir(), `traderslink-academy-auth-${randomUUID()}.sqlite`),
    );

    const store = new AcademyProgressStore();
    await store.upsertUser({
      discordUserId: "discord-1",
      username: "academy-user",
      globalName: "Academy User",
      avatar: null,
      guildId: "guild-1",
      joinedAt: null,
      rawUser: {},
      rawMember: {},
    });
    const session = await store.createSession("discord-1");

    const response = await loginGET(
      new NextRequest(
        "https://traderslink.pro/api/auth/discord/login?returnTo=%2Facademy%2F",
        {
          headers: {
            cookie: `${ACADEMY_SESSION_COOKIE}=${session.token}`,
          },
        },
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://traderslink.pro/academy/",
    );
  });

  it("starts Discord OAuth silently and shares state across TradersLink hosts", async () => {
    vi.stubEnv("DISCORD_CLIENT_ID", "client-id");
    vi.stubEnv("DISCORD_CLIENT_SECRET", "client-secret");

    const response = await loginGET(
      new NextRequest("https://traderslink.pro/api/auth/discord/login"),
    );
    const location = response.headers.get("location");
    const redirectUrl = new URL(location ?? "");

    expect(redirectUrl.origin).toBe("https://discord.com");
    expect(redirectUrl.searchParams.get("prompt")).toBe("none");

    const setCookieHeader = getSetCookieHeaders(response).join("\n");
    expect(setCookieHeader).toContain(ACADEMY_OAUTH_STATE_COOKIE);
    expect(setCookieHeader).toContain(`${ACADEMY_OAUTH_PROMPT_COOKIE}=none`);
    expect(setCookieHeader).toContain(
      `${ACADEMY_OAUTH_RETURN_TO_COOKIE}=%2Fwatchlist`,
    );
    expect(setCookieHeader).toContain("Domain=.traderslink.pro");
    expect(setCookieHeader).toContain(
      `${ACADEMY_OAUTH_STATE_COOKIE}=; Path=/; Max-Age=0`,
    );
  });

  it("refreshes Discord roles when an Academy member without Premium requests the watchlist", async () => {
    vi.stubEnv("ACADEMY_PROGRESS_STORAGE", "sqlite");
    vi.stubEnv(
      "TRADER_INTELLIGENCE_DB_PATH",
      join(tmpdir(), `traderslink-role-refresh-${randomUUID()}.sqlite`),
    );
    vi.stubEnv("TRADERSLINK_PREMIUM_DISCORD_ROLE_ID", "premium-role");
    vi.stubEnv("DISCORD_CLIENT_ID", "client-id");
    vi.stubEnv("DISCORD_CLIENT_SECRET", "client-secret");

    const store = new AcademyProgressStore();
    await store.upsertUser({
      discordUserId: "discord-basic",
      username: "basic-member",
      globalName: "Basic Member",
      avatar: null,
      guildId: "guild-1",
      joinedAt: null,
      rawUser: {},
      rawMember: { roles: [] },
    });
    const session = await store.createSession("discord-basic");

    const response = await loginGET(
      new NextRequest(
        "https://traderslink.pro/api/auth/discord/login?returnTo=%2Fwatchlist%2FALBT",
        {
          headers: {
            cookie: `${ACADEMY_SESSION_COOKIE}=${session.token}`,
          },
        },
      ),
    );

    expect(new URL(response.headers.get("location") ?? "").origin).toBe(
      "https://discord.com",
    );
  });

  it("reuses a Premium member session for the requested watchlist page", async () => {
    vi.stubEnv("ACADEMY_PROGRESS_STORAGE", "sqlite");
    vi.stubEnv(
      "TRADER_INTELLIGENCE_DB_PATH",
      join(tmpdir(), `traderslink-role-reuse-${randomUUID()}.sqlite`),
    );
    vi.stubEnv("TRADERSLINK_PREMIUM_DISCORD_ROLE_ID", "premium-role");

    const store = new AcademyProgressStore();
    await store.upsertUser({
      discordUserId: "discord-premium",
      username: "premium-member",
      globalName: "Premium Member",
      avatar: null,
      guildId: "guild-1",
      joinedAt: null,
      rawUser: {},
      rawMember: { roles: ["premium-role"] },
    });
    const session = await store.createSession("discord-premium");

    const response = await loginGET(
      new NextRequest(
        "https://traderslink.pro/api/auth/discord/login?returnTo=%2Fwatchlist%2FALBT",
        {
          headers: {
            cookie: `${ACADEMY_SESSION_COOKIE}=${session.token}`,
          },
        },
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://traderslink.pro/watchlist/ALBT",
    );
  });

  it("falls back to a consent prompt when silent Discord OAuth is unavailable", async () => {
    const response = await callbackGET(
      new NextRequest(
        "https://traderslink.pro/api/auth/discord/callback?error=consent_required&state=state-1",
        {
          headers: {
            cookie: [
              `${ACADEMY_OAUTH_STATE_COOKIE}=state-1`,
              `${ACADEMY_OAUTH_PROMPT_COOKIE}=none`,
              `${ACADEMY_OAUTH_RETURN_TO_COOKIE}=/watchlist/ALBT`,
            ].join("; "),
          },
        },
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://traderslink.pro/api/auth/discord/login?prompt=consent&returnTo=%2Fwatchlist%2FALBT",
    );

    const setCookieHeader = getSetCookieHeaders(response).join("\n");
    expect(setCookieHeader).toContain(
      `${ACADEMY_OAUTH_STATE_COOKIE}=; Path=/; Max-Age=0; Domain=.traderslink.pro`,
    );
    expect(setCookieHeader).toContain(
      `${ACADEMY_OAUTH_STATE_COOKIE}=; Path=/; Max-Age=0`,
    );
  });

  it("rejects external return targets instead of creating an open redirect", async () => {
    vi.stubEnv("DISCORD_CLIENT_ID", "client-id");
    vi.stubEnv("DISCORD_CLIENT_SECRET", "client-secret");

    const response = await loginGET(
      new NextRequest(
        "https://traderslink.pro/api/auth/discord/login?returnTo=https%3A%2F%2Fevil.example%2Fsteal",
      ),
    );

    const setCookieHeader = getSetCookieHeaders(response).join("\n");
    expect(setCookieHeader).toContain(
      `${ACADEMY_OAUTH_RETURN_TO_COOKIE}=%2Fwatchlist`,
    );
  });

  it("allows every server member into Academy without requiring Premium", async () => {
    stubDiscordOAuth({ roles: [] });
    const storagePath = join(
      tmpdir(),
      `traderslink-academy-member-${randomUUID()}.sqlite`,
    );
    vi.stubEnv("ACADEMY_PROGRESS_STORAGE", "sqlite");
    vi.stubEnv("TRADER_INTELLIGENCE_DB_PATH", storagePath);
    vi.stubEnv("TRADERSLINK_PREMIUM_DISCORD_ROLE_ID", "premium-role");

    const response = await callbackGET(
      callbackRequest("/academy/getting-started"),
    );

    expect(response.headers.get("location")).toBe(
      "https://traderslink.pro/academy/getting-started?auth=connected",
    );
    expect(getSetCookieHeaders(response).join("\n")).toContain(
      ACADEMY_SESSION_COOKIE,
    );
  });

  it("creates a site session but blocks a non-Premium member from the watchlist", async () => {
    stubDiscordOAuth({ roles: [] });
    vi.stubEnv("ACADEMY_PROGRESS_STORAGE", "sqlite");
    vi.stubEnv(
      "TRADER_INTELLIGENCE_DB_PATH",
      join(tmpdir(), `traderslink-watchlist-basic-${randomUUID()}.sqlite`),
    );
    vi.stubEnv("TRADERSLINK_PREMIUM_DISCORD_ROLE_ID", "premium-role");

    const response = await callbackGET(callbackRequest("/watchlist/ALBT"));

    expect(response.headers.get("location")).toBe(
      "https://traderslink.pro/watchlist/ALBT?auth=premium-required",
    );
    expect(getSetCookieHeaders(response).join("\n")).toContain(
      ACADEMY_SESSION_COOKIE,
    );
  });

  it("returns a Premium server member to the requested watchlist page", async () => {
    stubDiscordOAuth({ roles: ["premium-role"] });
    vi.stubEnv("ACADEMY_PROGRESS_STORAGE", "sqlite");
    vi.stubEnv(
      "TRADER_INTELLIGENCE_DB_PATH",
      join(tmpdir(), `traderslink-watchlist-premium-${randomUUID()}.sqlite`),
    );
    vi.stubEnv("TRADERSLINK_PREMIUM_DISCORD_ROLE_ID", "premium-role");

    const response = await callbackGET(callbackRequest("/watchlist/ALBT"));

    expect(response.headers.get("location")).toBe(
      "https://traderslink.pro/watchlist/ALBT?auth=connected",
    );
    expect(getSetCookieHeaders(response).join("\n")).toContain(
      ACADEMY_SESSION_COOKIE,
    );
  });
});

function callbackRequest(returnTo: string): NextRequest {
  return new NextRequest(
    "https://traderslink.pro/api/auth/discord/callback?code=oauth-code&state=state-1",
    {
      headers: {
        cookie: [
          `${ACADEMY_OAUTH_STATE_COOKIE}=state-1`,
          `${ACADEMY_OAUTH_PROMPT_COOKIE}=consent`,
          `${ACADEMY_OAUTH_RETURN_TO_COOKIE}=${encodeURIComponent(returnTo)}`,
        ].join("; "),
      },
    },
  );
}

function stubDiscordOAuth({ roles }: { roles: string[] }): void {
  vi.stubEnv("DISCORD_CLIENT_ID", "client-id");
  vi.stubEnv("DISCORD_CLIENT_SECRET", "client-secret");
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          access_token: "access-token",
          token_type: "Bearer",
          expires_in: 3600,
          scope: "identify guilds guilds.members.read",
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          id: "discord-member",
          username: "server-member",
          global_name: "Server Member",
          avatar: null,
        }),
      )
      .mockResolvedValueOnce(
        Response.json({ joined_at: "2026-07-21T00:00:00.000Z", roles }),
      ),
  );
}

function getSetCookieHeaders(response: Response): string[] {
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[];
  };

  return headers.getSetCookie?.() ?? [response.headers.get("set-cookie") ?? ""];
}
