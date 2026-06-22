import Link from "next/link";
import type { Metadata } from "next";

import { AcademyShell } from "@/app/academy/academy-shell";
import { getCurrentAcademySession } from "@/app/academy/academy-server-session";
import {
  hasPremiumWatchlistAccess,
  isLocalWatchlistAuthBypassEnabled,
} from "@/src/lib/live-watchlist/live-watchlist-auth";
import { LiveWatchlistStore } from "@/src/lib/live-watchlist/live-watchlist-store";
import { LiveWatchlistIndexClient } from "./live-watchlist-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Live Watchlist | TradersLink",
  description: "Premium TradersLink live watchlist with ticker levels and trader reads.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LiveWatchlistPage({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string | string[] }>;
}) {
  const authStatus = normalizeSearchParam((await searchParams).auth);
  const session = await getCurrentAcademySession();
  const authBypass = isLocalWatchlistAuthBypassEnabled();
  if (!session && !authBypass) {
    return <WatchlistAccessMessage authStatus={authStatus} kind="login" returnTo="/watchlist" />;
  }
  if (session && !hasPremiumWatchlistAccess(session)) {
    return <WatchlistAccessMessage authStatus={authStatus} kind="premium" returnTo="/watchlist" />;
  }

  const state = await new LiveWatchlistStore().listSymbols();
  return (
    <AcademyShell>
      <div className="academy-container watchlist-container">
        <LiveWatchlistIndexClient initialState={state} />
      </div>
    </AcademyShell>
  );
}

function WatchlistAccessMessage({
  authStatus,
  kind,
  returnTo,
}: {
  authStatus?: string;
  kind: "login" | "premium";
  returnTo: string;
}) {
  const notice = getWatchlistAuthNotice(authStatus);
  return (
    <AcademyShell>
      <div className="academy-container">
        <section className="academy-hero">
          <div className="academy-card watchlist-access-card">
            <p className="academy-eyebrow">Premium Watchlist</p>
            <h1 className="academy-title">
              {kind === "login" ? "Log in to view the live watchlist" : "Premium access required"}
            </h1>
            <p className="academy-lede">
              {kind === "login"
                ? "Log in with your TradersLink Discord account to view the live watchlist."
                : "The live watchlist is available to Discord members with the premium role."}
            </p>
            {notice ? (
              <div className="academy-auth-alert academy-auth-alert-warning" role="alert">
                <p className="academy-auth-alert-title">{notice.title}</p>
                <p>{notice.body}</p>
              </div>
            ) : null}
            <Link
              href={
                kind === "login"
                  ? `/api/auth/discord/login?returnTo=${encodeURIComponent(returnTo)}`
                  : "/academy/"
              }
              className="academy-card-action"
            >
              {kind === "login" ? "Log in with Discord" : "Back to Academy"}
            </Link>
          </div>
        </section>
      </div>
    </AcademyShell>
  );
}

function normalizeSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getWatchlistAuthNotice(authStatus: string | undefined) {
  switch (authStatus) {
    case "missing-config":
      return {
        title: "Discord login is not configured locally",
        body: "Set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET for this localhost app, then retry Discord login.",
      };
    case "failed":
      return {
        title: "Discord login failed",
        body: "Try logging in again. If it keeps failing, the Discord app callback or credentials may need attention.",
      };
    case "join-discord":
      return {
        title: "Discord membership required",
        body: "Join the TradersLink Discord first, then return here and log in again.",
      };
    case "invalid-state":
      return {
        title: "Login session expired",
        body: "Start Discord login again from this page.",
      };
    default:
      return null;
  }
}
