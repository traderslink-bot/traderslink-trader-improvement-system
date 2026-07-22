import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { setAcademyCookie } from "@/src/lib/academy/academy-auth-cookies";
import {
  ACADEMY_OAUTH_PROMPT_COOKIE,
  ACADEMY_OAUTH_RETURN_TO_COOKIE,
  ACADEMY_OAUTH_STATE_COOKIE,
  ACADEMY_SESSION_COOKIE,
  AcademyProgressStore,
  type AcademySession,
} from "@/src/lib/academy/academy-progress-store";
import {
  buildDiscordAuthResultUrl,
  isWatchlistAuthReturnTo,
  normalizeDiscordAuthReturnTo,
} from "@/src/lib/academy/discord-auth-return";
import {
  buildDiscordAuthorizeUrl,
  type DiscordOAuthPrompt,
  getDiscordOAuthConfig,
} from "@/src/lib/academy/discord-oauth";
import { hasPremiumWatchlistAccess } from "@/src/lib/live-watchlist/live-watchlist-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const origin = request.nextUrl.origin;
  const returnTo = normalizeDiscordAuthReturnTo(
    request.nextUrl.searchParams.get("returnTo"),
  );
  let currentSession: AcademySession | null = null;

  try {
    currentSession = await new AcademyProgressStore().getSessionByToken(
      request.cookies.get(ACADEMY_SESSION_COOKIE)?.value,
    );
  } catch (error) {
    console.warn("Academy session reuse check failed", error);
  }

  if (
    currentSession &&
    (!isWatchlistAuthReturnTo(returnTo) ||
      hasPremiumWatchlistAccess(currentSession))
  ) {
    return NextResponse.redirect(new URL(returnTo, origin));
  }

  try {
    const config = getDiscordOAuthConfig(origin);
    const prompt =
      currentSession &&
      isWatchlistAuthReturnTo(returnTo) &&
      !hasPremiumWatchlistAccess(currentSession)
        ? "consent"
        : getDiscordOAuthPrompt(request);
    const state = randomBytes(24).toString("base64url");
    const response = NextResponse.redirect(
      buildDiscordAuthorizeUrl({ config, prompt, state }),
    );

    setAcademyCookie(response, request, ACADEMY_OAUTH_STATE_COOKIE, state, 600);
    setAcademyCookie(
      response,
      request,
      ACADEMY_OAUTH_PROMPT_COOKIE,
      prompt,
      600,
    );
    setAcademyCookie(
      response,
      request,
      ACADEMY_OAUTH_RETURN_TO_COOKIE,
      returnTo,
      600,
    );

    return response;
  } catch {
    return NextResponse.redirect(
      buildDiscordAuthResultUrl({
        origin,
        returnTo,
        status: "missing-config",
      }),
    );
  }
}

function getDiscordOAuthPrompt(request: NextRequest): DiscordOAuthPrompt {
  return request.nextUrl.searchParams.get("prompt") === "consent"
    ? "consent"
    : "none";
}
