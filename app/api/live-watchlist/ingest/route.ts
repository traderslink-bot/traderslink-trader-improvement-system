import { NextResponse, type NextRequest } from "next/server";

import {
  broadcastLiveWatchlistHealth,
  broadcastLiveWatchlistUpdate,
} from "@/src/lib/live-watchlist/live-watchlist-events";
import { LiveWatchlistStore } from "@/src/lib/live-watchlist/live-watchlist-store";
import type {
  LiveWatchlistCardPatch,
  LiveWatchlistHealthPatch,
  LiveWatchlistTickerDataPatch,
} from "@/src/lib/live-watchlist/live-watchlist-types";

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

function isPatch(value: unknown): value is LiveWatchlistCardPatch {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as LiveWatchlistCardPatch).symbol === "string" &&
    typeof (value as LiveWatchlistCardPatch).updatedAt === "number" &&
    typeof (value as LiveWatchlistCardPatch).cards === "object" &&
    (value as LiveWatchlistCardPatch).cards !== null
  );
}

function isHealthPatch(value: unknown): value is LiveWatchlistHealthPatch {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as LiveWatchlistHealthPatch).type === "health" &&
    (
      (value as LiveWatchlistHealthPatch).marketDataStatus === "live" ||
      (value as LiveWatchlistHealthPatch).marketDataStatus === "stale" ||
      (value as LiveWatchlistHealthPatch).marketDataStatus === "offline" ||
      (value as LiveWatchlistHealthPatch).marketDataStatus === "starting"
    ) &&
    typeof (value as LiveWatchlistHealthPatch).marketDataUpdatedAt === "number"
  );
}

function isTickerDataPatch(value: unknown): value is LiveWatchlistTickerDataPatch {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as LiveWatchlistTickerDataPatch).type === "tickerData" &&
    typeof (value as LiveWatchlistTickerDataPatch).symbol === "string" &&
    typeof (value as LiveWatchlistTickerDataPatch).updatedAt === "number" &&
    typeof (value as LiveWatchlistTickerDataPatch).latestPrice === "number" &&
    (
      (value as LiveWatchlistTickerDataPatch).nearestSupport === null ||
      typeof (value as LiveWatchlistTickerDataPatch).nearestSupport === "number"
    ) &&
    (
      (value as LiveWatchlistTickerDataPatch).nearestResistance === null ||
      typeof (value as LiveWatchlistTickerDataPatch).nearestResistance === "number"
    ) &&
    (
      (value as LiveWatchlistTickerDataPatch).nearestSupportLabel === undefined ||
      (value as LiveWatchlistTickerDataPatch).nearestSupportLabel === null ||
      typeof (value as LiveWatchlistTickerDataPatch).nearestSupportLabel === "string"
    ) &&
    (
      (value as LiveWatchlistTickerDataPatch).nearestResistanceLabel === undefined ||
      (value as LiveWatchlistTickerDataPatch).nearestResistanceLabel === null ||
      typeof (value as LiveWatchlistTickerDataPatch).nearestResistanceLabel === "string"
    )
  );
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

  const body = (await request.json()) as unknown;
  if (isHealthPatch(body)) {
    const health = await new LiveWatchlistStore().upsertHealth(body);
    broadcastLiveWatchlistHealth(health);
    return NextResponse.json({ ok: true, health });
  }

  if (isTickerDataPatch(body)) {
    const state = await new LiveWatchlistStore().upsertTickerData(body);
    broadcastLiveWatchlistUpdate(state);
    return NextResponse.json({ ok: true, symbol: state.symbol, state });
  }

  if (!isPatch(body)) {
    return NextResponse.json({ error: "Invalid live watchlist patch." }, { status: 400 });
  }

  const state = await new LiveWatchlistStore().upsertPatch(body);
  broadcastLiveWatchlistUpdate(state);
  return NextResponse.json({ ok: true, symbol: state.symbol, state });
}
