export type TraderIntelligenceRouteClassification =
  | "public_safe_informational"
  | "owner_read"
  | "owner_mutation"
  | "internal_diagnostics"
  | "local_only_or_disabled";

export type TraderIntelligenceInventoryClassification =
  | "preserve"
  | "adapt"
  | "legacy_provider"
  | "retire"
  | "out_of_scope";

export interface TraderIntelligenceRouteContainmentEntry {
  modulePath: string;
  routePath: string;
  methods: readonly string[];
  realOwnerDataMethods: readonly string[];
  classification: TraderIntelligenceRouteClassification;
  authenticationRequirement: string;
  authorizationRequirement: string;
  mutationProtectionRequirement: string;
  cachePolicy: string;
  repositoryAccessPolicy: string;
  currentLegacyHazard: string;
  ga0A1Action: string;
  testReference: string;
  currentResponsibility: string;
  currentConsumers: string;
  sourceOfTruthLayer: string;
  deploymentAndSecurityAssumptions: string;
  privateAlphaReadiness: string;
  inventoryClassification: TraderIntelligenceInventoryClassification;
  migrationOrAdapterRequirement: string;
  knownRisks: string;
  existingTestCoverage: string;
  replacementOrRetirementCondition: string;
}

const OWNER_PAGE_MODULES = [
  "app/intelligence/analytics/behavior/page.tsx",
  "app/intelligence/analytics/chart-evidence/page.tsx",
  "app/intelligence/analytics/details/page.tsx",
  "app/intelligence/analytics/page.tsx",
  "app/intelligence/analytics/results/page.tsx",
  "app/intelligence/analytics/review-plan/page.tsx",
  "app/intelligence/analytics/session-stories/page.tsx",
  "app/intelligence/analytics/ticker-stories/page.tsx",
  "app/intelligence/analytics/timing/page.tsx",
  "app/intelligence/analytics/trade-explorer/page.tsx",
  "app/intelligence/coach/behavior-sequence/page.tsx",
  "app/intelligence/coach/details/page.tsx",
  "app/intelligence/coach/next-session/page.tsx",
  "app/intelligence/coach/page.tsx",
  "app/intelligence/coach/progress/page.tsx",
  "app/intelligence/coach/review-backlog/page.tsx",
  "app/intelligence/coach/review-session/page.tsx",
  "app/intelligence/coach/session-stories/page.tsx",
  "app/intelligence/coach/ticker-stories/page.tsx",
  "app/intelligence/compare-trades/page.tsx",
  "app/intelligence/first-run/page.tsx",
  "app/intelligence/import-dry-run/page.tsx",
  "app/intelligence/imports/[batchId]/page.tsx",
  "app/intelligence/imports/page.tsx",
  "app/intelligence/onboarding/page.tsx",
  "app/intelligence/page.tsx",
  "app/intelligence/progress/page.tsx",
  "app/intelligence/repair-wizard/page.tsx",
  "app/intelligence/review/page.tsx",
  "app/intelligence/review-cockpit/page.tsx",
  "app/intelligence/session-recap/page.tsx",
  "app/intelligence/trader-intelligence/page.tsx",
  "app/intelligence/trades/[tradeId]/page.tsx",
  "app/intelligence/trades/calendar/page.tsx",
  "app/intelligence/trades/day-session/[sessionDate]/page.tsx",
  "app/intelligence/trades/day-sessions/page.tsx",
  "app/intelligence/trades/open-swing/page.tsx",
  "app/intelligence/trades/page.tsx",
  "app/intelligence/trades/review-needed/page.tsx",
  "app/intelligence/trades/round-trips/page.tsx",
  "app/intelligence/trades/ticker-stories/page.tsx",
  "app/intelligence/trades/ticker-story/[threadId]/page.tsx",
  "app/intelligence/upload-csv/page.tsx",
] as const;

const LOCAL_PAGE_MODULES = [
  "app/intelligence/admin/broker-mappings/page.tsx",
  "app/intelligence/admin/page.tsx",
  "app/intelligence/calibration/page.tsx",
  "app/intelligence/debug/execution-feedback/page.tsx",
  "app/intelligence/debug/trade-analysis/page.tsx",
  "app/intelligence/debug/trader-analytics/page.tsx",
  "app/intelligence/import-health/page.tsx",
  "app/intelligence/import-trials/page.tsx",
] as const;

const OWNER_API_ROUTES = [
  ["app/api/analytics/latest/route.ts", ["GET"], "owner_read"],
  ["app/api/coach/latest/route.ts", ["GET"], "owner_read"],
  ["app/api/import-batches/[batchId]/commit/route.ts", ["POST"], "owner_mutation"],
  ["app/api/import-batches/[batchId]/decision-review/resume/route.ts", ["POST"], "owner_mutation"],
  ["app/api/import-batches/[batchId]/decision-review/status/route.ts", ["GET"], "owner_read"],
  ["app/api/import-batches/[batchId]/discard/route.ts", ["POST"], "owner_mutation"],
  ["app/api/import-batches/[batchId]/repair-items/[repairItemId]/route.ts", ["POST"], "owner_mutation"],
  ["app/api/import-batches/[batchId]/route.ts", ["GET"], "owner_read"],
  ["app/api/import-batches/preview/route.ts", ["POST"], "owner_mutation"],
  ["app/api/import-batches/route.ts", ["GET"], "owner_read"],
  ["app/api/review/latest/route.ts", ["GET"], "owner_read"],
  ["app/api/trades/[tradeId]/level-analysis/facts/route.ts", ["GET"], "owner_read"],
  ["app/api/trades/[tradeId]/level-analysis/route.ts", ["GET"], "owner_read"],
  ["app/api/trades/[tradeId]/mark-closed/route.ts", ["POST"], "owner_mutation"],
  ["app/api/trades/[tradeId]/notes/route.ts", ["POST"], "owner_mutation"],
  ["app/api/trades/[tradeId]/review-items/[itemId]/route.ts", ["POST"], "owner_mutation"],
  ["app/api/trades/[tradeId]/review-status/route.ts", ["POST"], "owner_mutation"],
  ["app/api/trades/[tradeId]/route.ts", ["GET"], "owner_read"],
  ["app/api/trades/route.ts", ["GET"], "owner_read"],
] as const;

const INTERNAL_API_ROUTES = [
  "app/api/admin/level-analysis/deliveries/[deliveryId]/raw/route.ts",
  "app/api/admin/level-analysis/trade-links/[linkId]/route.ts",
  "app/api/execution-feedback/debug/route.ts",
  "app/api/import-dry-run/decision-review/route.ts",
  "app/api/trade-analysis/debug/route.ts",
  "app/api/trader-analytics/debug/route.ts",
] as const;

const LEGACY_PROVIDER_API_ROUTES = [
  "app/api/level-analysis/deliveries/latest/route.ts",
  "app/api/level-analysis/deliveries/latest/symbols/[symbol]/route.ts",
  "app/api/level-analysis/deliveries/route.ts",
  "app/api/level-analysis/deliveries/validate/route.ts",
  "app/api/level-analysis/trade-links/resolve/route.ts",
  "app/api/level-analysis/trade-links/route.ts",
] as const;

function routePathFromModule(modulePath: string): string {
  return modulePath
    .replace(/^app/, "")
    .replace(/\/(?:page|route)\.tsx?$/, "") || "/";
}

function pageEntry(
  modulePath: string,
  classification: "owner_read" | "internal_diagnostics",
): TraderIntelligenceRouteContainmentEntry {
  const localOnly = classification === "internal_diagnostics";
  return {
    modulePath,
    routePath: routePathFromModule(modulePath),
    methods: ["GET"],
    realOwnerDataMethods: [],
    classification,
    authenticationRequirement: "v3 owner guard in the Intelligence layout",
    authorizationRequirement: "exact configured owner; local adapter only in explicit local_only mode",
    mutationProtectionRequirement: "no state-changing page render",
    cachePolicy: "force-dynamic, private, no-store",
    repositoryAccessPolicy: "owner authorization must complete before repository-backed page data access",
    currentLegacyHazard: localOnly
      ? "prototype diagnostic surface was reachable without a v3 deployment boundary"
      : "prototype page assumed a trusted single local user and demo identity",
    ga0A1Action: localOnly
      ? "guard and disable outside local_only"
      : "guard in layout and before repository-backed page access",
    testReference: "src/lib/trader-intelligence-v3/__tests__/route-containment.test.ts",
    currentResponsibility: "legacy Trader Intelligence page rendering",
    currentConsumers: "product owner through the App Router",
    sourceOfTruthLayer: "legacy v2 read models and presentation contracts",
    deploymentAndSecurityAssumptions: "trusted local single-user prototype",
    privateAlphaReadiness: localOnly
      ? "local diagnostics only after GA0-A1 guard"
      : "contained legacy page after GA0-A1 guard; not v3 domain authority",
    inventoryClassification: localOnly ? "legacy_provider" : "adapt",
    migrationOrAdapterRequirement: "replace legacy demo scope with future server-derived v3 tenancy after GA0-A1",
    knownRisks: "legacy JavaScript-number, demo identity, and prototype evidence semantics remain contained hazards",
    existingTestCoverage: "legacy route/build tests plus GA0-A1 containment coverage",
    replacementOrRetirementCondition: "retire or adapt when the corresponding v3 read model is accepted",
  };
}

function apiEntry(
  modulePath: string,
  methods: readonly string[],
  classification: Exclude<
    TraderIntelligenceRouteClassification,
    "public_safe_informational"
  >,
): TraderIntelligenceRouteContainmentEntry {
  const localOnly =
    classification === "internal_diagnostics" ||
    classification === "local_only_or_disabled";
  return {
    modulePath,
    routePath: routePathFromModule(modulePath),
    methods,
    realOwnerDataMethods:
      modulePath === "app/api/import-batches/preview/route.ts" ||
      modulePath === "app/api/import-dry-run/decision-review/route.ts"
        ? ["POST"]
        : [],
    classification,
    authenticationRequirement: "v3 server-side owner guard",
    authorizationRequirement: "exact configured owner before handler and repository access",
    mutationProtectionRequirement: methods.some((method) => method !== "GET")
      ? "approved Origin required for every unsafe method"
      : "state-changing GET prohibited",
    cachePolicy: "private, no-store response headers; no shared route cache",
    repositoryAccessPolicy: "handler wrapper authorizes before invoking legacy implementation",
    currentLegacyHazard: localOnly
      ? "legacy diagnostic/provider route lacked owner containment"
      : "legacy route used demo identities or trusted caller input",
    ga0A1Action: localOnly
      ? "guard and disable outside local_only"
      : "guard, protect unsafe methods, and force private no-store responses",
    testReference: "src/lib/trader-intelligence-v3/__tests__/route-containment.test.ts",
    currentResponsibility: "legacy Trader Intelligence HTTP boundary",
    currentConsumers: localOnly
      ? "local diagnostics or local level-delivery tooling"
      : "owner-facing Trader Intelligence clients",
    sourceOfTruthLayer: "legacy route/service adapter",
    deploymentAndSecurityAssumptions: "trusted local prototype caller",
    privateAlphaReadiness: localOnly
      ? "local-only after containment"
      : "contained after GA0-A1; legacy data model remains non-authoritative for v3",
    inventoryClassification:
      classification === "local_only_or_disabled" ? "legacy_provider" : "adapt",
    migrationOrAdapterRequirement: "future v3 service adapter must accept server-derived owner context",
    knownRisks: "demo scope, direct repository construction, or legacy provider coupling",
    existingTestCoverage: "legacy handler tests plus GA0-A1 positive and negative containment tests",
    replacementOrRetirementCondition: "replace when v3 owner-scoped repository and service contracts are accepted",
  };
}

function methodsForLocalApi(modulePath: string): readonly string[] {
  if (
    modulePath.endsWith("execution-feedback/debug/route.ts") ||
    modulePath.endsWith("import-dry-run/decision-review/route.ts") ||
    modulePath.endsWith("trade-analysis/debug/route.ts") ||
    modulePath.endsWith("trader-analytics/debug/route.ts")
  ) {
    return ["GET", "POST"];
  }
  return ["GET"];
}

function methodsForProviderApi(modulePath: string): readonly string[] {
  return modulePath.includes("deliveries/latest") ? ["GET"] : ["POST"];
}

export const TRADER_INTELLIGENCE_ROUTE_CONTAINMENT_MATRIX = [
  ...OWNER_PAGE_MODULES.map((modulePath) => pageEntry(modulePath, "owner_read")),
  ...LOCAL_PAGE_MODULES.map((modulePath) =>
    pageEntry(modulePath, "internal_diagnostics"),
  ),
  ...OWNER_API_ROUTES.map(([modulePath, methods, classification]) =>
    apiEntry(modulePath, methods, classification),
  ),
  ...INTERNAL_API_ROUTES.map((modulePath) =>
    apiEntry(modulePath, methodsForLocalApi(modulePath), "internal_diagnostics"),
  ),
  ...LEGACY_PROVIDER_API_ROUTES.map((modulePath) =>
    apiEntry(
      modulePath,
      methodsForProviderApi(modulePath),
      "local_only_or_disabled",
    ),
  ),
] as const satisfies readonly TraderIntelligenceRouteContainmentEntry[];

export function findTraderIntelligenceRouteContainment(
  modulePath: string,
): TraderIntelligenceRouteContainmentEntry | null {
  return (
    TRADER_INTELLIGENCE_ROUTE_CONTAINMENT_MATRIX.find(
      (entry) => entry.modulePath === modulePath.replaceAll("\\", "/"),
    ) ?? null
  );
}
