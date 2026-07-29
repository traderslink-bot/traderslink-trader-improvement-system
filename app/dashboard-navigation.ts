export type DashboardNavigationIconKey =
  | "analytics"
  | "calendar"
  | "data"
  | "execution"
  | "import"
  | "lab"
  | "manualEntry"
  | "overview"
  | "performance"
  | "reflection"
  | "results"
  | "rules"
  | "ticker"
  | "timing"
  | "tradeGroup"
  | "trades"
  | "workspace";

export type DashboardNavigationItem = Readonly<{
  href: string;
  label: string;
  icon: DashboardNavigationIconKey;
}>;

export type DashboardNavigationGroup = Readonly<{
  id: "trades" | "analytics" | "data";
  label: string;
  icon: DashboardNavigationIconKey;
  items: readonly DashboardNavigationItem[];
}>;

export const DASHBOARD_HOME_ITEM: DashboardNavigationItem = Object.freeze({
  href: "/workspace",
  label: "Workspace",
  icon: "workspace",
});

export const DASHBOARD_MAIN_NAVIGATION_GROUPS: readonly DashboardNavigationGroup[] =
  Object.freeze([
    Object.freeze({
      id: "trades" as const,
      label: "Trades",
      icon: "tradeGroup" as const,
      items: Object.freeze([
        Object.freeze({
          href: "/trades/roundtrips",
          label: "Round Trips",
          icon: "trades" as const,
        }),
        Object.freeze({
          href: "/trades/day-sessions",
          label: "Day Sessions",
          icon: "calendar" as const,
        }),
        Object.freeze({
          href: "/trades/ticker",
          label: "Trades by Ticker",
          icon: "ticker" as const,
        }),
        Object.freeze({
          href: "/trades/open",
          label: "Open Positions",
          icon: "data" as const,
        }),
      ]),
    }),
    Object.freeze({
      id: "analytics" as const,
      label: "Analytics",
      icon: "analytics" as const,
      items: Object.freeze([
        Object.freeze({
          href: "/analytics",
          label: "Overview",
          icon: "overview" as const,
        }),
        Object.freeze({
          href: "/analytics/performance",
          label: "Performance",
          icon: "performance" as const,
        }),
        Object.freeze({
          href: "/analytics/results",
          label: "Results",
          icon: "results" as const,
        }),
        Object.freeze({
          href: "/analytics/timing",
          label: "Timing",
          icon: "timing" as const,
        }),
        Object.freeze({
          href: "/analytics/execution",
          label: "Execution",
          icon: "execution" as const,
        }),
        Object.freeze({
          href: "/analytics/lab",
          label: "Analytics Lab",
          icon: "lab" as const,
        }),
      ]),
    }),
  ]);

export const DASHBOARD_STANDALONE_ITEMS: readonly DashboardNavigationItem[] =
  Object.freeze([
    Object.freeze({
      href: "/reflection-loop",
      label: "Reflection Loop",
      icon: "reflection" as const,
    }),
    Object.freeze({
      href: "/rules",
      label: "Trading Rules",
      icon: "rules" as const,
    }),
    Object.freeze({
      href: "/charts",
      label: "Market Charts",
      icon: "analytics" as const,
    }),
  ]);

export const DASHBOARD_DATA_NAVIGATION_GROUP: DashboardNavigationGroup =
  Object.freeze({
    id: "data",
    label: "Data",
    icon: "import",
    items: Object.freeze([
      Object.freeze({
        href: "/imports",
        label: "Import Trades",
        icon: "import" as const,
      }),
      Object.freeze({
        href: "/manual-entry",
        label: "Manual Entry",
        icon: "manualEntry" as const,
      }),
    ]),
  });

export const DASHBOARD_ROUTE_TITLES: Readonly<Record<string, string>> =
  Object.freeze({
    "/workspace": "Workspace",
    "/trades/roundtrips": "Round Trips",
    "/trades/day-sessions": "Day Sessions",
    "/trades/day-session": "Trading Day",
    "/trades/ticker": "Trades by Ticker",
    "/trades/open": "Open Positions",
    "/analytics": "Analytics Overview",
    "/analytics/performance": "Performance",
    "/analytics/results": "Results",
    "/analytics/timing": "Timing",
    "/analytics/execution": "Execution",
    "/analytics/lab": "Analytics Lab",
    "/charts": "Market Charts",
    "/reflection-loop": "Reflection Loop",
    "/rules": "Trading Rules",
    "/imports": "Import Trades",
    "/manual-entry": "Manual Entry",
  });

export const DASHBOARD_NAVIGATION_HREFS: readonly string[] = Object.freeze([
  DASHBOARD_HOME_ITEM.href,
  ...DASHBOARD_MAIN_NAVIGATION_GROUPS.flatMap((group) =>
    group.items.map((item) => item.href),
  ),
  ...DASHBOARD_STANDALONE_ITEMS.map((item) => item.href),
  ...DASHBOARD_DATA_NAVIGATION_GROUP.items.map((item) => item.href),
]);
