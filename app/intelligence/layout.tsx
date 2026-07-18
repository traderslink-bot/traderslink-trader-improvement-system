import type { ReactNode } from "react";

import { SiteShell } from "@/src/components/site/site-shell";
import { requireTraderIntelligenceOwnerPageAccess } from "@/src/lib/trader-intelligence-v3/auth";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function IntelligenceLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireTraderIntelligenceOwnerPageAccess();

  return (
    <SiteShell
      sectionHref="/intelligence"
      sectionLabel="Intelligence"
      shellElement="div"
    >
      {children}
    </SiteShell>
  );
}
