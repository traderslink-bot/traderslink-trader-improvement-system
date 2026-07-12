import { type LadderGapLevelFinding } from "./ladder-gap-level-audit.js";
export type TraderStoryQualityReviewOptions = {
    inputPath: string;
    outputDirectory?: string;
    warehouseDirectoryPath?: string;
    provider?: string;
    minGapPct?: number;
    maxGapDistancePct?: number;
    maxFindings?: number;
};
export type TraderStoryQualityReviewReport = {
    generatedAt: string;
    inputPath: string;
    auditPath: string;
    outputDirectory: string;
    verdict: "clean" | "watch" | "needs_review";
    totals: {
        symbols: number;
        posts: number;
        overBudgetSymbols: number;
        watchBudgetSymbols: number;
        storyRiskSymbols: number;
        ladderFindings: number;
        majorLadderFindings: number;
    };
    storyRisks: TraderStoryQualitySymbolRisk[];
    ladderRisks: LadderGapLevelFinding[];
    cleanSymbols: string[];
};
export type TraderStoryQualitySymbolRisk = {
    symbol: string;
    severity: "major" | "watch";
    score: number;
    summary: string;
    evidence: string[];
};
export declare function writeTraderStoryQualityReview(options: TraderStoryQualityReviewOptions): TraderStoryQualityReviewReport;
//# sourceMappingURL=trader-story-quality-review.d.ts.map