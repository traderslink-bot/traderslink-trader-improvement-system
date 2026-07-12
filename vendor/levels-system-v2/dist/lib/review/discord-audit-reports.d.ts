type AuditFindingSeverity = "blocker" | "major" | "watch" | "historical_only" | "data_quality_only";
type SnapshotAuditLevel = {
    id: string;
    side: "support" | "resistance";
    bucket: "surfaced" | "extension";
    representativePrice: number;
    zoneLow: number;
    zoneHigh: number;
    strengthLabel: string;
    strengthScore: number;
    confluenceCount: number;
    sourceEvidenceCount: number;
    timeframeBias: string;
    timeframeSources: string[];
    sourceTypes: string[];
    freshness: string;
    isExtension: boolean;
    displayed: boolean;
    omittedReason: string;
};
export type ThreadPostPolicyReport = {
    generatedAt: string;
    sourceAuditPath: string;
    totals: {
        posted: number;
        failed: number;
        traderCritical: number;
        traderHelpfulOptional: number;
        operatorOnly: number;
        repeatedStoryClusters: number;
    };
    topFindings: string[];
    perSymbol: Array<{
        symbol: string;
        posted: number;
        failed: number;
        traderCritical: number;
        traderHelpfulOptional: number;
        operatorOnly: number;
        optionalDensity: number;
        maxPostsInFiveMinutes: number;
        maxPostsInTenMinutes: number;
        byMessageKind: Record<string, number>;
        repeatedStoryClusters: Array<{
            storyKey: string;
            messageKind: string;
            count: number;
            firstTimestamp: number;
            lastTimestamp: number;
            latestDirectionalReturnPct?: number | null;
            latestRawReturnPct?: number | null;
        }>;
        dominantRisk: "controlled" | "repeated_story" | "optional_density" | "post_burst" | "delivery_failure";
        recommendations: string[];
        threadTrustScore: number;
    }>;
};
export type SnapshotAuditReport = {
    generatedAt: string;
    sourceAuditPath: string;
    snapshots: Array<{
        symbol: string;
        timestamp: number;
        referencePrice: number;
        forwardResistanceLimit: number;
        displayedSupportCount: number;
        displayedResistanceCount: number;
        omittedSupportCount: number;
        omittedResistanceCount: number;
        omittedByReason: Record<string, number>;
        omittedSupportLevels: SnapshotAuditLevel[];
        omittedResistanceLevels: SnapshotAuditLevel[];
    }>;
    perSymbol: Array<{
        symbol: string;
        snapshotCount: number;
        latestTimestamp: number;
        latestReferencePrice: number;
        displayedSupportCount: number;
        displayedResistanceCount: number;
        omittedByReason: Record<string, number>;
        compactedLevels: number[];
        wrongSideLevels: number[];
        outsideForwardRangeLevels: number[];
    }>;
};
export type TradingDayEvidenceReport = {
    generatedAt: string;
    sourceAuditPath: string;
    severityRubric: Record<AuditFindingSeverity, string>;
    criticalDeliveryFailures: Array<{
        symbol: string;
        timestamp: number;
        title?: string;
        messageKind?: string;
        eventType?: string;
        traderCritical: boolean;
        equivalentLaterPost: boolean;
        equivalentLaterTimestamp?: number;
        equivalentLaterTitle?: string;
        retryProven: boolean;
        severity: AuditFindingSeverity;
        error?: string;
        excerpt: string;
    }>;
    staleCriticalDeliveries: Array<{
        symbol: string;
        timestamp: number;
        title?: string;
        messageKind?: string;
        eventType?: string;
        deliveryLagMs: number;
        sendDurationMs?: number;
        severity: AuditFindingSeverity;
        excerpt: string;
    }>;
    roleFlipCandidates: Array<{
        symbol: string;
        timestamp: number;
        scenario: "broken_support_as_resistance" | "reclaimed_resistance_as_support" | "false_clear_certainty";
        level?: number;
        title?: string;
        explainedClearly: boolean;
        severity: AuditFindingSeverity;
        evidence: string;
    }>;
    clusterCrossCandidates: Array<{
        symbol: string;
        firstTimestamp: number;
        lastTimestamp: number;
        side: "support" | "resistance" | "mixed";
        levels: number[];
        postCount: number;
        likelyOverExplained: boolean;
        preferClusterStory: boolean;
        severity: AuditFindingSeverity;
        titles: string[];
    }>;
    traderLanguageEvidence: {
        goodExamples: Array<TraderLanguageEvidenceExample>;
        badHistoricalExamples: Array<TraderLanguageEvidenceExample>;
        borderlineAdviceExamples: Array<TraderLanguageEvidenceExample>;
    };
    volumeActivityEvidence: {
        reliableSymbols: string[];
        unreliableSymbols: string[];
        shownExamples: Array<TraderLanguageEvidenceExample>;
        suppressedExamples: Array<TraderLanguageEvidenceExample>;
    };
    practicalStructureEvidence: {
        statesBySymbol: Array<{
            symbol: string;
            postCount: number;
            states: Record<string, number>;
            practicalZones: string[];
            materialChanges: number;
        }>;
        rangeBoundExamples: Array<TraderLanguageEvidenceExample>;
        materialChangeExamples: Array<TraderLanguageEvidenceExample>;
    };
    stableMarketStructureEvidence: {
        statesBySymbol: Array<{
            symbol: string;
            postCount: number;
            states: Record<string, number>;
            structureKeys: string[];
            materialChanges: number;
        }>;
        rangeBoundExamples: Array<TraderLanguageEvidenceExample>;
        materialChangeExamples: Array<TraderLanguageEvidenceExample>;
    };
};
type TraderLanguageEvidenceExample = {
    symbol: string;
    timestamp: number;
    title?: string;
    severity: AuditFindingSeverity;
    reason: string;
    excerpt: string;
};
export declare function buildThreadPostPolicyReport(auditPath: string): ThreadPostPolicyReport;
export declare function buildSnapshotAuditReport(auditPath: string): SnapshotAuditReport;
export declare function buildTradingDayEvidenceReport(auditPath: string): TradingDayEvidenceReport;
export declare function writeJsonReport(path: string, value: unknown): void;
export declare function writeTextReport(path: string, value: string): void;
export declare function formatThreadPostPolicyMarkdown(report: ThreadPostPolicyReport): string;
export declare function formatSnapshotAuditMarkdown(report: SnapshotAuditReport): string;
export declare function formatTradingDayEvidenceMarkdown(report: TradingDayEvidenceReport): string;
export declare function defaultReportPaths(sessionDirectory: string): {
    auditPath: string;
    policyReportPath: string;
    snapshotReportPath: string;
    policyMarkdownPath: string;
    snapshotMarkdownPath: string;
    tuningJsonPath: string;
    tuningMarkdownPath: string;
    replaySimulationJsonPath: string;
    replaySimulationMarkdownPath: string;
    profileComparisonJsonPath: string;
    profileComparisonMarkdownPath: string;
    runnerStoryJsonPath: string;
    runnerStoryMarkdownPath: string;
    evidenceJsonPath: string;
    evidenceMarkdownPath: string;
    traderPostQualityJsonPath: string;
    traderPostQualityMarkdownPath: string;
    postReasonAuditJsonPath: string;
    postReasonAuditMarkdownPath: string;
    knownBadPostPatternsJsonPath: string;
    knownBadPostPatternsMarkdownPath: string;
};
export {};
//# sourceMappingURL=discord-audit-reports.d.ts.map