import type { LevelEngineOutput } from "./level-types.js";
export type LevelQualityAuditFindingSeverity = "info" | "watch" | "action";
export type LevelQualityAuditFinding = {
    severity: LevelQualityAuditFindingSeverity;
    side: "support" | "resistance";
    code: "no_forward_levels" | "wide_first_gap" | "wide_internal_gap" | "thin_forward_ladder" | "extension_only_forward_ladder" | "healthy_forward_ladder";
    message: string;
    evidence: Record<string, unknown>;
};
export type LevelQualityAuditReport = {
    symbol: string;
    referencePrice: number | null;
    generatedAt: number;
    dataQualityFlags: string[];
    support: {
        displayedCount: number;
        extensionCount: number;
        nearestLevel: number | null;
        nearestDistancePct: number | null;
    };
    resistance: {
        displayedCount: number;
        extensionCount: number;
        nearestLevel: number | null;
        nearestDistancePct: number | null;
    };
    findings: LevelQualityAuditFinding[];
};
export declare function buildLevelQualityAuditReport(output: LevelEngineOutput): LevelQualityAuditReport;
export declare function formatLevelQualityAuditReport(report: LevelQualityAuditReport): string;
//# sourceMappingURL=level-quality-audit.d.ts.map