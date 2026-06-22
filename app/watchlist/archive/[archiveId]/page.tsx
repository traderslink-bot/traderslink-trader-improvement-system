import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AcademyShell } from "@/app/academy/academy-shell";
import { getCurrentAcademySession } from "@/app/academy/academy-server-session";
import {
  hasPremiumWatchlistAccess,
  isLocalWatchlistAuthBypassEnabled,
} from "@/src/lib/live-watchlist/live-watchlist-auth";
import { LiveWatchlistStore } from "@/src/lib/live-watchlist/live-watchlist-store";
import { LiveWatchlistArchiveDetailClient } from "../../live-watchlist-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ archiveId: string }>;
}): Promise<Metadata> {
  const { archiveId } = await params;
  return {
    title: `${archiveId.toUpperCase()} Archived Watchlist | TradersLink`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function LiveWatchlistArchiveDetailPage({
  params,
}: {
  params: Promise<{ archiveId: string }>;
}) {
  const { archiveId } = await params;
  const session = await getCurrentAcademySession();
  const authBypass = isLocalWatchlistAuthBypassEnabled();
  if ((!session && !authBypass) || (session && !hasPremiumWatchlistAccess(session))) {
    const returnTo = `/watchlist/archive/${encodeURIComponent(archiveId.toUpperCase())}`;
    return (
      <AcademyShell>
        <div className="academy-container">
          <section className="academy-hero">
            <div className="academy-card watchlist-access-card">
              <p className="academy-eyebrow">Premium Watchlist</p>
              <h1 className="academy-title">
                {session ? "Premium access required" : "Log in to view archived ticker details"}
              </h1>
              <p className="academy-lede">
                {session
                  ? "The watchlist archive is available to Discord members with the premium role."
                  : "Log in with your TradersLink Discord account to view this archived ticker."}
              </p>
              <Link
                href={
                  session
                    ? "/watchlist/archive"
                    : `/api/auth/discord/login?returnTo=${encodeURIComponent(returnTo)}`
                }
                className="academy-card-action"
              >
                {session ? "Back to archive" : "Log in with Discord"}
              </Link>
            </div>
          </section>
        </div>
      </AcademyShell>
    );
  }

  const archive = await new LiveWatchlistStore().getArchive(archiveId);
  if (!archive) {
    notFound();
  }

  return (
    <AcademyShell>
      <div className="academy-container">
        <LiveWatchlistArchiveDetailClient archive={archive} />
      </div>
    </AcademyShell>
  );
}
