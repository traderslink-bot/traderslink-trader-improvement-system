import type { FinalLevelZone } from "../levels/level-types.js";
import type { LevelSnapshotDisplayZone } from "../alerts/alert-types.js";
export type LevelImportanceLabel = "major_decision" | "active_trade_boundary" | "useful_reference" | "minor_noise" | "extension_context" | "unknown";
export type LevelImportanceContext = {
    label: LevelImportanceLabel;
    score: number;
    reasons: string[];
};
type AssessParams = {
    price: number;
    side: "support" | "resistance";
    strengthLabel?: FinalLevelZone["strengthLabel"];
    sourceLabel?: string;
    timeframeBias?: FinalLevelZone["timeframeBias"];
    timeframeSources?: FinalLevelZone["timeframeSources"];
    zoneCount?: number;
    isExtension?: boolean;
    lowPrice?: number;
    highPrice?: number;
    representativePrice: number;
};
export declare function assessLevelImportance(params: AssessParams): LevelImportanceContext;
export declare function assessFinalLevelImportance(params: {
    zone: FinalLevelZone;
    price: number;
    side?: "support" | "resistance";
}): LevelImportanceContext;
export declare function assessSnapshotDisplayLevelImportance(params: {
    zone: LevelSnapshotDisplayZone;
    price: number;
    side: "support" | "resistance";
    zoneCount?: number;
}): LevelImportanceContext;
export {};
//# sourceMappingURL=level-importance.d.ts.map