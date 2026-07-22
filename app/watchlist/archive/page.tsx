import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AcademyShell } from "@/app/academy/academy-shell";
import { getCurrentAcademySession } from "@/app/academy/academy-server-session";
import {
  hasPremiumWatchlistAccess,
  isLocalWatchlistAuthBypassEnabled,
} from "@/src/lib/live-watchlist/live-watchlist-auth";
import { LiveWatchlistStore } from "@/src/lib/live-watchlist/live-watchlist-store";
import { LiveWatchlistArchiveIndex } from "../live-watchlist-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Archived Watchlist | TradersLink",
  description: "Premium TradersLink archive of deactivated watchlist tickers.",
  robots: {
    index: false,
    follow: false,
  },
};

const archivePageSize = 25;

export default async function LiveWatchlistArchivePage({
  searchParams,
}: {
  searchParams: Promise<{
    auth?: string | string[];
    page?: string | string[];
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const authStatus = normalizeSearchParam(resolvedSearchParams.auth);
  const session = await getCurrentAcademySession();
  const authBypass = isLocalWatchlistAuthBypassEnabled();
  if ((!session && !authBypass) || (session && !hasPremiumWatchlistAccess(session))) {
    if (!session && !authBypass && !authStatus) {
      redirect(`/api/auth/discord/login?returnTo=${encodeURIComponent("/watchlist/archive")}`);
    }
    return (
      <AcademyShell forcedTheme="light">
        <div className="academy-container">
          <section className="academy-hero">
            <div className="academy-card watchlist-access-card">
              <p className="academy-eyebrow">Premium Watchlist</p>
              <h1 className="academy-title">
                {session ? "Premium access required" : "Log in to view archived tickers"}
              </h1>
              <p className="academy-lede">
                {session
                  ? "The watchlist archive is available to Discord members with the premium role."
                  : "Log in with your TradersLink Discord account to view archived tickers."}
              </p>
              <Link
                href={`/api/auth/discord/login?returnTo=${encodeURIComponent("/watchlist/archive")}`}
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

  const store = new LiveWatchlistStore();
  const totalArchives = await store.countArchives();
  const totalPages = Math.max(1, Math.ceil(totalArchives / archivePageSize));
  const currentPage = Math.min(
    normalizePageNumber(normalizeSearchParam(resolvedSearchParams.page)),
    totalPages,
  );
  const archives = await store.listArchives({
    limit: archivePageSize,
    offset: (currentPage - 1) * archivePageSize,
  });
  return (
    <AcademyShell forcedTheme="light">
      <div className="academy-container">
        <LiveWatchlistArchiveIndex
          archives={archives}
          currentPage={currentPage}
          totalArchives={totalArchives}
          totalPages={totalPages}
        />
      </div>
    </AcademyShell>
  );
}

function normalizeSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizePageNumber(value: string | undefined): number {
  if (!value || !/^\d+$/.test(value)) return 1;
  const page = Number.parseInt(value, 10);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}
