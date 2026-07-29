"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";
import { DashboardThemeToggle } from "./dashboard-theme-toggle";
import { traderMaterialTheme } from "./mui-theme";

export function MuiProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      defaultMode="light"
      disableTransitionOnChange
      theme={traderMaterialTheme}
    >
      <CssBaseline />
      {children}
      <DashboardThemeToggle />
    </ThemeProvider>
  );
}
