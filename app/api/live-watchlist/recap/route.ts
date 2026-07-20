import { NextResponse, type NextRequest } from "next/server";

import { LiveWatchlistStore } from "@/src/lib/live-watchlist/live-watchlist-store";
import {
  buildWatchlistDailyRecapTickers,
  newYorkDateKey,
} from "@/src/lib/live-watchlist/watchlist-daily-recap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function expectedToken(): string | null {
  return process.env.TRADERSLINK_WATCHLIST_PUBLISHER_TOKEN?.trim() || null;
}

function getBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization") ?? "";
  return header.toLowerCase().startsWith("bearer ")
    ? header.slice("bearer ".length).trim() || null
    : null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = expectedToken();
  if (!token) {
    return NextResponse.json(
      { error: "Live watchlist publisher token is not configured." },
      { status: 503 },
    );
  }
  if (getBearerToken(request) !== token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const requestedDate = new URL(request.url).searchParams.get("date");
  if (requestedDate && !DATE_KEY_PATTERN.test(requestedDate)) {
    return NextResponse.json(
      { error: "date must use YYYY-MM-DD format." },
      { status: 400 },
    );
  }

  const date = requestedDate ?? newYorkDateKey(Date.now());
  const store = new LiveWatchlistStore();
  const [state, archives] = await Promise.all([
    store.listSymbols(),
    store.listArchives(),
  ]);
  const tickers = buildWatchlistDailyRecapTickers({
    dateKey: date,
    symbols: state.symbols,
    archives,
  });

  return NextResponse.json({
    generatedAt: Date.now(),
    date,
    minimumGainPctExclusive: 5,
    tickers,
  });
}
