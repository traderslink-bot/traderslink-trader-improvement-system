import {
  TRADER_INTELLIGENCE_ROUTE_CONTAINMENT_MATRIX as BASE_ROUTE_CONTAINMENT_MATRIX,
} from "./route-containment";

export {
  findTraderIntelligenceRouteContainment,
  type TraderIntelligenceInventoryClassification,
  type TraderIntelligenceRouteClassification,
  type TraderIntelligenceRouteContainmentEntry,
} from "./route-containment";

export const TRADER_INTELLIGENCE_ROUTE_CONTAINMENT_MATRIX = [
  ...BASE_ROUTE_CONTAINMENT_MATRIX,
  {
    modulePath: "app/intelligence/csv-mapping-review/page.tsx",
    routePath: "/intelligence/csv-mapping-review",
    methods: ["GET"],
    realOwnerDataMethods: [],
    classification: "owner_read",
    authenticationRequirement: "v3 owner guard in the Intelligence layout",
    authorizationRequirement: "exact configured owner; local adapter only in explicit local_only mode",
    mutationProtectionRequirement: "no state-changing page render",
    cachePolicy: "force-dynamic, private, no-store",
    repositoryAccessPolicy: "owner authorization must complete before repository-backed page data access",
    currentLegacyHazard: "prototype page assumed a trusted single local user and demo identity",
    ga0A1Action: "guard in layout and before repository-backed page access",
    testReference: "src/lib/trader-intelligence-v3/__tests__/route-containment.test.ts",
    currentResponsibility: "review and correct inferred mappings for unknown broker CSV formats",
    currentConsumers: "product owner through the App Router",
    sourceOfTruthLayer: "hardened execution CSV parser and mapping-review contracts",
    deploymentAndSecurityAssumptions: "owner-contained private Trader Intelligence surface",
    privateAlphaReadiness: "contained owner page; preview only and does not commit imported trades",
    inventoryClassification: "adapt",
    migrationOrAdapterRequirement: "persist mapping templates through the owner-scoped repository when storage is promoted",
    knownRisks: "browser-local template persistence is temporary and account context remains sample-backed",
    existingTestCoverage: "generic CSV inference tests plus GA0-A1 route containment coverage",
    replacementOrRetirementCondition: "replace browser-local template storage when owner-scoped persistence is accepted",
  },
] as const;
