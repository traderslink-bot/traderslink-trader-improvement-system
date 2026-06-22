import type { NextRequest } from "next/server";

import {
  ACADEMY_SESSION_COOKIE,
  AcademyProgressStore,
  type AcademySession,
} from "@/src/lib/academy/academy-progress-store";

export type PremiumWatchlistAuthResult =
  | { ok: true; session: AcademySession | null; authBypass: boolean }
  | { ok: false; status: 401 | 403 | 503; error: string };

function premiumRoleId(): string | null {
  return (
    process.env.TRADERSLINK_PREMIUM_DISCORD_ROLE_ID?.trim() ||
    process.env.DISCORD_PREMIUM_ROLE_ID?.trim() ||
    null
  );
}

export function isPremiumWatchlistRoleConfigured(): boolean {
  return Boolean(premiumRoleId());
}

export function isLocalWatchlistAuthBypassEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.LIVE_WATCHLIST_REQUIRE_LOCAL_AUTH !== "1"
  );
}

export function hasPremiumWatchlistAccess(session: AcademySession): boolean {
  const roleId = premiumRoleId();
  if (!roleId) {
    return process.env.NODE_ENV !== "production";
  }
  return session.user.roleIds.includes(roleId);
}

export async function authorizePremiumWatchlistRequest(
  request: NextRequest,
): Promise<PremiumWatchlistAuthResult> {
  const token = request.cookies.get(ACADEMY_SESSION_COOKIE)?.value;
  const session = await new AcademyProgressStore().getSessionByToken(token);
  if (!session) {
    if (isLocalWatchlistAuthBypassEnabled()) {
      return { ok: true, session: null, authBypass: true };
    }
    return {
      ok: false,
      status: 401,
      error: "Discord login is required to view the live watchlist.",
    };
  }
  if (!isPremiumWatchlistRoleConfigured() && process.env.NODE_ENV === "production") {
    return {
      ok: false,
      status: 503,
      error: "Premium watchlist role is not configured.",
    };
  }
  if (!hasPremiumWatchlistAccess(session)) {
    return {
      ok: false,
      status: 403,
      error: "Premium TradersLink membership is required to view the live watchlist.",
    };
  }
  return { ok: true, session, authBypass: false };
}
