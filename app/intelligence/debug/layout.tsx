import type { ReactNode } from "react";

import { requireTraderIntelligenceOwnerPageAccess } from "@/src/lib/trader-intelligence-v3/auth";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function IntelligenceDebugLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireTraderIntelligenceOwnerPageAccess(
    "app/intelligence/debug/trade-analysis/page.tsx",
  );
  return children;
}
