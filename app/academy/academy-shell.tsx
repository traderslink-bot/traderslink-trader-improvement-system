import type { ReactNode } from "react";

import { SiteShell } from "@/src/components/site/site-shell";

export function AcademyShell({
  children,
  forcedTheme,
}: {
  children: ReactNode;
  forcedTheme?: "light" | "dark";
}) {
  return (
    <SiteShell forcedTheme={forcedTheme}>
      <main>{children}</main>
    </SiteShell>
  );
}
