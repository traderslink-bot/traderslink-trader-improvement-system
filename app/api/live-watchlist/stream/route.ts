import { NextResponse, type NextRequest } from "next/server";

import { authorizePremiumWatchlistRequest } from "@/src/lib/live-watchlist/live-watchlist-auth";
import { createLiveWatchlistStream } from "@/src/lib/live-watchlist/live-watchlist-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  const auth = await authorizePremiumWatchlistRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  return new Response(createLiveWatchlistStream(), {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "text/event-stream; charset=utf-8",
      Connection: "keep-alive",
    },
  });
}
