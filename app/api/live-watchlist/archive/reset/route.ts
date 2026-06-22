import { NextResponse, type NextRequest } from "next/server";

import { LiveWatchlistStore } from "@/src/lib/live-watchlist/live-watchlist-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function expectedToken(): string | null {
  return process.env.TRADERSLINK_WATCHLIST_PUBLISHER_TOKEN?.trim() || null;
}

function getBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1]?.trim() || null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
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

  const deletedCount = await new LiveWatchlistStore().clearArchives();
  return NextResponse.json({ ok: true, deletedCount });
}
