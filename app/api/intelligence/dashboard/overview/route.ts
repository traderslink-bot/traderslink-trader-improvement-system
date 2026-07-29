import {
  authorizeTraderIntelligenceOwner,
  withTraderIntelligenceOwnerRoute,
} from "@/src/lib/trader-intelligence-v3/auth";
import { buildDashboardTableViewModel } from "@/src/lib/trader-intelligence-v3/analytics/dashboard";
import {
  buildConfiguredDashboardQueryPlan,
  resolveConfiguredDashboardAnalytics,
} from "@/src/lib/trader-intelligence-v3/analytics/dashboard/configured-dashboard-analytics";
import { validateTraderIntelligenceDeployment } from "@/src/lib/trader-intelligence-v3/deployment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_PATH = "app/api/intelligence/dashboard/overview/route.ts";

const WORKSPACE_METRICS = [
  ["Net realized P/L", "net_pnl", "Completed trades"],
  ["Gross P/L", "gross_pnl", "Before trading costs"],
  ["Expectancy", "expectancy", "Per completed trade"],
  ["Win rate", "win_rate", "Completed round trips"],
  ["Profit factor", "profit_factor", "Gross wins divided by losses"],
  ["Round trips", "included_count", "Selected period"],
] as const;

async function GETHandler(request: Request): Promise<Response> {
  const authorization = await authorizeTraderIntelligenceOwner({
    environment: process.env,
    modulePath: ROUTE_PATH,
    localRequest: { headers: request.headers, requestUrl: request.url },
  });
  const deployment = validateTraderIntelligenceDeployment(process.env);
  if (!authorization.ok || !deployment.ok) {
    return Response.json({ status: "unavailable" });
  }
  const analytics = await resolveConfiguredDashboardAnalytics({
    owner: authorization.owner,
    config: deployment.config,
    environment: process.env,
  });
  if (!analytics.ok) return Response.json({ status: "unavailable" });
  const currency = analytics.value.currencies[0];
  const plan = buildConfiguredDashboardQueryPlan(analytics.value, currency, {
    grouping: { kind: "aggregate" },
    metrics: WORKSPACE_METRICS.map(([, key]) => key),
  });
  if (!plan.ok) return Response.json({ status: "unavailable" });
  const packet = analytics.value.adapter.getOverview(currency, plan.value);
  if (!packet.ok) return Response.json({ status: "unavailable" });
  const row = buildDashboardTableViewModel(packet.value).rows[0];
  if (!row) return Response.json({ status: "unavailable" });
  return Response.json({
    status: "ready",
    metrics: WORKSPACE_METRICS.map(([label, key, caption]) => ({
      label,
      caption,
      value:
        row.metrics.find((metric) => metric.metricKey === key)?.displayValue ??
        "Unavailable",
    })),
  });
}

export const GET = withTraderIntelligenceOwnerRoute(ROUTE_PATH, GETHandler);
