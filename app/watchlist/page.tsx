import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AcademyShell } from "@/app/academy/academy-shell";
import { getCurrentAcademySession } from "@/app/academy/academy-server-session";
import {
  hasPremiumWatchlistAccess,
  isLocalWatchlistAuthBypassEnabled,
} from "@/src/lib/live-watchlist/live-watchlist-auth";
import { LiveWatchlistStore } from "@/src/lib/live-watchlist/live-watchlist-store";
import {
  buildWatchlistPreviewMetadata,
  isWatchlistPreviewCrawlerUserAgent,
} from "@/src/lib/live-watchlist/watchlist-preview";
import { LiveWatchlistIndexClient } from "./live-watchlist-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildWatchlistPreviewMetadata("/watchlist");

export default async function LiveWatchlistPage({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string | string[] }>;
}) {
  const authStatus = normalizeSearchParam((await searchParams).auth);
  const requestHeaders = await headers();
  const isPreviewCrawler = isWatchlistPreviewCrawlerUserAgent(
    requestHeaders.get("user-agent"),
  );
  const session = await getCurrentAcademySession();
  const authBypass = isLocalWatchlistAuthBypassEnabled();
  if (!session && !authBypass) {
    if (!authStatus && !isPreviewCrawler) {
      redirect(`/api/auth/discord/login?returnTo=${encodeURIComponent("/watchlist")}`);
    }
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
              href={`/api/auth/discord/login?returnTo=${encodeURIComponent(returnTo)}`}
              className="academy-card-action"
            >
              Log in with Discord
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
    case "premium-required":
      return {
        title: "Premium membership required",
        body: "Your Discord login worked, but this account does not currently have the Premium member role.",
      };
    case "premium-config":
      return {
        title: "Premium access is temporarily unavailable",
        body: "The website cannot verify the Premium member role right now. Please try again later.",
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
