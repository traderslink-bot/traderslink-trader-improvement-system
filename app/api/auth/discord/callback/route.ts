import { NextResponse, type NextRequest } from "next/server";

import {
  deleteAcademyCookie,
  setAcademyCookie,
} from "@/src/lib/academy/academy-auth-cookies";
import {
  ACADEMY_OAUTH_PROMPT_COOKIE,
  ACADEMY_OAUTH_RETURN_TO_COOKIE,
  ACADEMY_OAUTH_STATE_COOKIE,
  ACADEMY_SESSION_COOKIE,
  ACADEMY_SESSION_TTL_MS,
  AcademyProgressStore,
} from "@/src/lib/academy/academy-progress-store";
import {
  buildDiscordAuthResultUrl,
  isWatchlistAuthReturnTo,
  normalizeDiscordAuthReturnTo,
} from "@/src/lib/academy/discord-auth-return";
import {
  exchangeDiscordCode,
  fetchDiscordCurrentUserGuilds,
  fetchDiscordCurrentUser,
  getSafeDiscordAuthErrorMessage,
  getDiscordOAuthConfig,
  resolveDiscordCurrentGuildMembership,
  shouldRetryDiscordOAuthWithConsent,
} from "@/src/lib/academy/discord-oauth";
import {
  hasPremiumWatchlistAccess,
  isPremiumWatchlistRoleConfigured,
} from "@/src/lib/live-watchlist/live-watchlist-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authRedirect(
  request: NextRequest,
  returnTo: string,
  status: string,
): NextResponse {
  return NextResponse.redirect(
    buildDiscordAuthResultUrl({
      origin: request.nextUrl.origin,
      returnTo,
      status,
    }),
  );
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get("code");
  const oauthError = request.nextUrl.searchParams.get("error");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(ACADEMY_OAUTH_STATE_COOKIE)?.value;
  const prompt = request.cookies.get(ACADEMY_OAUTH_PROMPT_COOKIE)?.value;
  const returnTo = normalizeDiscordAuthReturnTo(
    request.cookies.get(ACADEMY_OAUTH_RETURN_TO_COOKIE)?.value,
  );

  if (!state || !expectedState || state !== expectedState) {
    const response = authRedirect(request, returnTo, "invalid-state");
    clearDiscordOAuthCookies(response, request);
    return response;
  }

  if (oauthError) {
    if (shouldRetryDiscordOAuthWithConsent({ error: oauthError, prompt })) {
      const response = NextResponse.redirect(
        new URL(
          `/api/auth/discord/login?prompt=consent&returnTo=${encodeURIComponent(returnTo)}`,
          request.nextUrl.origin,
        ),
      );
      clearDiscordOAuthCookies(response, request);
      return response;
    }

    const response = authRedirect(request, returnTo, "failed");
    clearDiscordOAuthCookies(response, request);
    return response;
  }

  if (!code) {
    const response = authRedirect(request, returnTo, "invalid-state");
    clearDiscordOAuthCookies(response, request);
    return response;
  }

  try {
    const config = getDiscordOAuthConfig(request.nextUrl.origin);
    const token = await exchangeDiscordCode({ config, code });
    const [discordUser, guildMember] = await Promise.all([
      fetchDiscordCurrentUser(token.access_token),
      resolveDiscordCurrentGuildMembership({
        accessToken: token.access_token,
        guildId: config.guildId,
      }),
    ]);

    if (!guildMember) {
      const response = authRedirect(request, returnTo, "join-discord");
      clearDiscordOAuthCookies(response, request);
      return response;
    }

    const watchlistReturn = isWatchlistAuthReturnTo(returnTo);
    let resolvedGuildMember = guildMember;
    if (watchlistReturn) {
      try {
        const guilds = await fetchDiscordCurrentUserGuilds(token.access_token);
        const currentGuild = guilds.find((guild) => guild.id === config.guildId);
        if (currentGuild?.owner === true) {
          resolvedGuildMember = { ...guildMember, guild_owner: true };
        }
      } catch {
        // The member endpoint still provides the role-based access decision.
      }
    }

    let sessionToken: string;
    let hasPremiumAccess = false;

    try {
      const store = new AcademyProgressStore();
      await store.upsertUser({
        discordUserId: discordUser.id,
        username: discordUser.username,
        globalName: discordUser.global_name ?? null,
        avatar: discordUser.avatar ?? null,
        guildId: config.guildId,
        joinedAt: resolvedGuildMember.joined_at ?? null,
        rawUser: discordUser,
        rawMember: resolvedGuildMember,
      });
      const session = await store.createSession(discordUser.id);
      sessionToken = session.token;
      hasPremiumAccess = hasPremiumWatchlistAccess(session.session);
    } catch (error) {
      console.error(
        "Discord Academy progress session failed",
        getSafeDiscordAuthErrorMessage(error),
      );

      const response = authRedirect(
        request,
        returnTo,
        "progress-storage-failed",
      );
      clearDiscordOAuthCookies(response, request);
      return response;
    }

    let authStatus = "connected";
    if (
      watchlistReturn &&
      process.env.NODE_ENV === "production" &&
      !isPremiumWatchlistRoleConfigured()
    ) {
      authStatus = "premium-config";
    } else if (watchlistReturn && !hasPremiumAccess) {
      authStatus = "premium-required";
    }
    const response = authRedirect(request, returnTo, authStatus);

    clearDiscordOAuthCookies(response, request);
    setAcademyCookie(
      response,
      request,
      ACADEMY_SESSION_COOKIE,
      sessionToken,
      Math.floor(ACADEMY_SESSION_TTL_MS / 1000),
    );

    return response;
  } catch (error) {
    console.error(
      "Discord Academy login failed",
      getSafeDiscordAuthErrorMessage(error),
    );

    const response = authRedirect(request, returnTo, "failed");
    clearDiscordOAuthCookies(response, request);
    return response;
  }
}

function clearDiscordOAuthCookies(
  response: NextResponse,
  request: NextRequest,
): void {
  deleteAcademyCookie(response, request, ACADEMY_OAUTH_STATE_COOKIE);
  deleteAcademyCookie(response, request, ACADEMY_OAUTH_PROMPT_COOKIE);
  deleteAcademyCookie(response, request, ACADEMY_OAUTH_RETURN_TO_COOKIE);
}
