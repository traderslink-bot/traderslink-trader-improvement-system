import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { buildWatchlistPreviewMetadata } from "@/src/lib/live-watchlist/watchlist-preview";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
  const { symbol } = await params;
  return buildWatchlistPreviewMetadata(`/watchlist/${symbol.toUpperCase()}`);
}

export default function LiveWatchlistSymbolPage() {
  redirect("/watchlist");
}
