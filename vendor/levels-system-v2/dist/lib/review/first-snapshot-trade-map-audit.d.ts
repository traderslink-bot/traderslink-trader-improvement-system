import { type FirstPostTradeMapScore } from "./session-behavior-audit.js";
export type FirstSnapshotTradeMapAuditSymbol = {
    symbol: string;
    title?: string;
    timestamp: number | null;
    timestampIso: string | null;
    operation?: string;
    score: FirstPostTradeMapScore;
    mapChecks: FirstSnapshotTradeMapChecks;
    suggestedImprovements: string[];
};
export type FirstSnapshotTradeMapChecks = {
    hasCurrentPrice: boolean;
    hasCurrentRead: boolean;
    hasClosestLevels: boolean;
    hasFullLadder: boolean;
    hasLineByLineLevels: boolean;
    hasSupportStrength: boolean;
    hasResistanceStrength: boolean;
    hasPracticalSupport: boolean;
    hasPracticalResistance: boolean;
    hasRoomOrRangeContext: boolean;
    hasAdvisoryLanguage: boolean;
    hasPennyRiskLanguage: boolean;
    hasUnsupportedNoResistanceLanguage: boolean;
};
export type FirstSnapshotTradeMapAuditReport = {
    generatedAt: string;
    sourceAuditPath: string;
    sourceAuditPaths: string[];
    totals: {
        symbols: number;
        strong: number;
        usable: number;
        weak: number;
        missing: number;
        averageScore: number;
        fullTraderMapCount: number;
        advisoryRiskCount: number;
        pennyRiskCount: number;
        unsupportedNoResistanceCount: number;
        lineByLineLevelCount: number;
    };
    symbols: FirstSnapshotTradeMapAuditSymbol[];
};
export type GenerateFirstSnapshotTradeMapAuditOptions = {
    auditPath: string;
};
export type WriteFirstSnapshotTradeMapAuditOptions = GenerateFirstSnapshotTradeMapAuditOptions & {
    jsonPath: string;
    markdownPath: string;
};
export declare function generateFirstSnapshotTradeMapAudit(options: GenerateFirstSnapshotTradeMapAuditOptions): FirstSnapshotTradeMapAuditReport;
export declare function formatFirstSnapshotTradeMapAudit(report: FirstSnapshotTradeMapAuditReport): string;
export declare function writeFirstSnapshotTradeMapAudit(options: WriteFirstSnapshotTradeMapAuditOptions): FirstSnapshotTradeMapAuditReport;
//# sourceMappingURL=first-snapshot-trade-map-audit.d.ts.map