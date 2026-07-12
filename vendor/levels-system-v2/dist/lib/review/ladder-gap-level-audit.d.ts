export type LadderGapLevelAuditOptions = {
    inputPath: string;
    warehouseDirectoryPath?: string;
    provider?: string;
    outputDirectory: string;
    allSessions?: boolean;
    minGapPct?: number;
    maxGapDistancePct?: number;
    maxFindings?: number;
};
export type LadderGapLevelFinding = {
    kind: "hidden_gap_zone" | "near_wrong_side_level";
    session: string;
    symbol: string;
    side: "support" | "resistance";
    price: number;
    severity: "major" | "watch";
    score: number;
    summary: string;
    evidence: string[];
    postedGap?: {
        from: string;
        to: string;
        gapPct: number;
    };
    candidateZone?: {
        low: number;
        high: number;
        center: number;
        relativePct: number;
    };
};
export type LadderGapLevelAuditReport = {
    generatedAt: string;
    inputPath: string;
    warehouseDirectoryPath: string;
    totals: {
        auditFiles: number;
        snapshots: number;
        symbols: number;
        hiddenGapZones: number;
        nearWrongSideLevels: number;
    };
    findings: LadderGapLevelFinding[];
};
export declare function writeLadderGapLevelAudit(options: LadderGapLevelAuditOptions): LadderGapLevelAuditReport;
//# sourceMappingURL=ladder-gap-level-audit.d.ts.map