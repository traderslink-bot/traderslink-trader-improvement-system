import type { CandleProviderName } from "../support-resistance/index.js";
type EvidenceExample = {
    label: string;
    timestampIso?: string | null;
    reason: string;
    excerpt?: string | null;
};
export type SymbolVerdictLabel = "good" | "watch" | "needs_work" | "needs_candle_audit";
export type EndOfDaySymbolVerdict = {
    symbol: string;
    overall: SymbolVerdictLabel;
    reviewQuestions: {
        firstPostGaveGoodMap: boolean | null;
        postedTooMuch: boolean;
        missedMeaningfulMove: boolean | null;
        levelsCompleteEnough: boolean | null;
        traderWordingClear: boolean;
        needsCacheOrProviderWork: boolean;
        advancedContextTrusted: boolean | null;
    };
    firstPostTradeMap: {
        verdict: SymbolVerdictLabel;
        reason: string;
        excerpt: string | null;
    };
    postVolume: {
        verdict: SymbolVerdictLabel;
        reason: string;
        postCount: number;
        expectedMax: number;
    };
    missedMeaningfulMove: {
        verdict: SymbolVerdictLabel;
        reason: string;
    };
    levelCompleteness: {
        verdict: SymbolVerdictLabel;
        reason: string;
    };
    traderWording: {
        verdict: SymbolVerdictLabel;
        reason: string;
    };
    candleEvidence?: {
        firstSnapshotScore: number | null;
        executionRelationUsefulContext: number;
        executionRelationMissingEvidence: number;
        missingForwardResistance: number;
        missedMeaningfulMoves: number;
        majorMissedMeaningfulMoves: number;
        volumeMayHelp: number;
        volumeShouldStayHidden: number;
        firstSnapshotFullTraderMap: boolean | null;
        firstSnapshotMapFailures: string[];
        marketStructureVerdict: string | null;
        marketStructureSameRepeats: number;
        marketStructureReasons: string[];
        advancedContextStatus: string | null;
        advancedContextMissingFacts: string[];
        providerReadinessWarnings: string[];
    };
    evidenceExamples?: EvidenceExample[];
    actionItems: string[];
};
export type EndOfDaySymbolVerdictReport = {
    generatedAt: string;
    sourceAuditPath: string;
    totals: {
        symbols: number;
        good: number;
        watch: number;
        needsWork: number;
        needsCandleAudit: number;
    };
    symbols: EndOfDaySymbolVerdict[];
};
export type BuildEndOfDaySymbolVerdictWithEvidenceOptions = {
    auditPath: string;
    cacheDirectoryPath?: string;
    provider?: CandleProviderName;
    comparisonProvider?: CandleProviderName;
};
export type WriteEndOfDaySymbolVerdictWithEvidenceOptions = BuildEndOfDaySymbolVerdictWithEvidenceOptions & {
    jsonPath: string;
    markdownPath: string;
};
export declare function buildEndOfDaySymbolVerdictReport(auditPath: string): EndOfDaySymbolVerdictReport;
export declare function buildEndOfDaySymbolVerdictReportWithEvidence(options: BuildEndOfDaySymbolVerdictWithEvidenceOptions): Promise<EndOfDaySymbolVerdictReport>;
export declare function formatEndOfDaySymbolVerdictMarkdown(report: EndOfDaySymbolVerdictReport): string;
export declare function writeEndOfDaySymbolVerdict(params: {
    auditPath: string;
    jsonPath: string;
    markdownPath: string;
}): EndOfDaySymbolVerdictReport;
export declare function writeEndOfDaySymbolVerdictWithEvidence(params: WriteEndOfDaySymbolVerdictWithEvidenceOptions): Promise<EndOfDaySymbolVerdictReport>;
export {};
//# sourceMappingURL=end-of-day-symbol-verdict.d.ts.map