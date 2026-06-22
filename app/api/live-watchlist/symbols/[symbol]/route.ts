import { NextResponse, type NextRequest } from "next/server";

import { authorizePremiumWatchlistRequest } from "@/src/lib/live-watchlist/live-watchlist-auth";
import { LiveWatchlistStore } from "@/src/lib/live-watchlist/live-watchlist-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ symbol: string }> },
): Promise<NextResponse> {
  const auth = await authorizePremiumWatchlistRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { symbol } = await context.params;
  const state = await new LiveWatchlistStore().getSymbol(symbol);
  if (!state) {
    return NextResponse.json({ error: "Ticker was not found." }, { status: 404 });
  }
  return NextResponse.json({ generatedAt: Date.now(), symbol: state });
}
