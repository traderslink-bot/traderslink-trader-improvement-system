import { type SignalCategoryKey, type SignalSurfaceKey } from "./signal-category-config.js";
export type SignalCategoryLayer = "level_map" | "structure" | "activity" | "interpretation" | "operator";
export type SignalCategoryLiveBehavior = "standalone_allowed" | "enrichment_only" | "operator_only";
export type SignalCategoryRolloutPosture = "active" | "quiet_first" | "audit_only";
export type SignalCategoryContract = {
    key: SignalCategoryKey;
    label: string;
    layer: SignalCategoryLayer;
    description: string;
    primaryTimeframes: string[];
    liveBehavior: SignalCategoryLiveBehavior;
    defaultSurfaces: SignalSurfaceKey[];
    standaloneDiscordAllowed: boolean;
    quietPersistenceRequired: boolean;
    rolloutPosture: SignalCategoryRolloutPosture;
};
export declare const SIGNAL_CATEGORY_CONTRACTS: Record<SignalCategoryKey, SignalCategoryContract>;
export declare function getSignalCategoryContract(category: SignalCategoryKey): SignalCategoryContract;
export declare function validateSignalCategoryContracts(): string[];
//# sourceMappingURL=signal-category-contracts.d.ts.map