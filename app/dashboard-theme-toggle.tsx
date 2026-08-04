"use client";

import { usePathname } from "next/navigation";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import Fab from "@mui/material/Fab";
import Tooltip from "@mui/material/Tooltip";
import { useColorScheme } from "@mui/material/styles";

const dashboardRoutePrefixes = [
  "/workspace",
  "/analytics",
  "/coach",
  "/coaching",
  "/review",
  "/trades",
  "/progress",
  "/upload-csv",
  "/imports",
];

function isDashboardRoute(pathname: string | null): boolean {
  if (!pathname) {
    return false;
  }

  return dashboardRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function DashboardThemeToggle() {
  const pathname = usePathname();
  const { mode, setMode } = useColorScheme();

  if (mode === undefined || !isDashboardRoute(pathname)) {
    return null;
  }

  const isDark = mode === "dark";
  const nextMode = isDark ? "light" : "dark";

  return (
    <Tooltip
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      placement="left"
    >
      <Fab
        aria-label={isDark ? "Switch dashboard to light mode" : "Switch dashboard to dark mode"}
        className="ti-theme-toggle"
        color="primary"
        onClick={() => setMode(nextMode)}
        size="medium"
        sx={{
          bottom: { xs: 16, sm: 24 },
          boxShadow:
            "0 18px 48px rgba(1, 30, 86, 0.24), 0 4px 12px rgba(1, 30, 86, 0.18)",
          position: "fixed",
          right: { xs: 16, sm: 24 },
          zIndex: 1400,
        }}
      >
        {isDark ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
      </Fab>
    </Tooltip>
  );
}
