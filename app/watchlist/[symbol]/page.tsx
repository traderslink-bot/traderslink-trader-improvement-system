import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

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
import { LiveWatchlistDetailClient } from "../live-watchlist-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
  const { symbol } = await params;
  return buildWatchlistPreviewMetadata(`/watchlist/${symbol.toUpperCase()}`);
}

export default async function LiveWatchlistSymbolPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ auth?: string | string[] }>;
}) {
  const { symbol } = await params;
  const authStatus = normalizeSearchParam((await searchParams).auth);
  const requestHeaders = await headers();
  const isPreviewCrawler = isWatchlistPreviewCrawlerUserAgent(
    requestHeaders.get("user-agent"),
  );
  const session = await getCurrentAcademySession();
  const authBypass = isLocalWatchlistAuthBypassEnabled();
  if ((!session && !authBypass) || (session && !hasPremiumWatchlistAccess(session))) {
    const returnTo = `/watchlist/${encodeURIComponent(symbol.toUpperCase())}`;
    if (!session && !authBypass && !authStatus && !isPreviewCrawler) {
      redirect(`/api/auth/discord/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
    return (
      <AcademyShell forcedTheme="light">
        <div className="academy-container">
          <section className="academy-hero">
            <div className="academy-card watchlist-access-card">
              <p className="academy-eyebrow">Premium Watchlist</p>
              <h1 className="academy-title">Premium access required</h1>
              <p className="academy-lede">
                Log in with your premium TradersLink Discord account to view ticker details.
              </p>
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

  const state = await new LiveWatchlistStore().getSymbol(symbol);
  if (!state) {
    notFound();
  }
  if (state.status === "deactivated") {
    const latestArchive = await new LiveWatchlistStore().getLatestArchiveForSymbol(symbol);
    return (
      <AcademyShell forcedTheme="light">
        <div className="academy-container">
          <div className="watchlist-page">
            <section className="watchlist-detail-hero">
              <div className="watchlist-detail-heading">
                <div>
                  <p className="academy-eyebrow">Live Watchlist</p>
                  <h1 className="academy-title">{state.symbol}</h1>
                </div>
                <Link href="/watchlist" className="academy-card-action watchlist-back-action">
                  Back to watchlist
                </Link>
              </div>
            </section>
            <section className="academy-card watchlist-empty">
              <h2>This ticker is no longer active</h2>
              <p className="academy-card-text">
                {latestArchive
                  ? "This ticker was removed from the live watchlist. View the latest archived snapshot to see the last saved information from when it was active."
                  : "This ticker was removed from the live watchlist and no complete archive snapshot is available."}
              </p>
              {latestArchive ? (
                <Link
                  href={`/watchlist/archive/${latestArchive.archiveId}`}
                  className="academy-card-action"
                >
                  View latest archive
                </Link>
              ) : null}
            </section>
          </div>
        </div>
      </AcademyShell>
    );
  }
  const health = await new LiveWatchlistStore().getHealth();

  return (
    <AcademyShell forcedTheme="light">
      <div className="academy-container watchlist-container">
        <LiveWatchlistDetailClient
          initialMarketDataStatus={health.marketDataStatus}
          initialSymbol={state}
        />
      </div>
    </AcademyShell>
  );
}

function normalizeSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
