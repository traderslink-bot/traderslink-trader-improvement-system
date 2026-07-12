import type { CandleBackfillPriorityLevel, CandleBackfillPriorityTask } from "./candle-backfill-priority-report.js";
export type CandleBackfillStageManifest = {
    generatedAt: string;
    priorityReportPath: string;
    priorityReportGeneratedAt: string;
    warehouseDirectoryPath: string;
    selectedStageIndex: number | null;
    selectedPriority: CandleBackfillPriorityLevel;
    taskCount: number;
    estimatedCandleCount: number;
    symbols: string[];
    timeframes: string[];
    tasks: CandleBackfillPriorityTask[];
    safeDryRunCommand: string;
    executeCommand: string;
    notes: string[];
};
export type BuildCandleBackfillStageManifestOptions = {
    priorityReportPath: string;
    stageIndex?: number;
    priority?: CandleBackfillPriorityLevel;
    warehouseDirectoryPath?: string;
    outputDirectory?: string;
};
export type WriteCandleBackfillStageManifestOptions = BuildCandleBackfillStageManifestOptions & {
    jsonPath: string;
    markdownPath: string;
};
export declare function buildCandleBackfillStageManifest(options: BuildCandleBackfillStageManifestOptions): CandleBackfillStageManifest;
export declare function formatCandleBackfillStageManifest(manifest: CandleBackfillStageManifest): string;
export declare function writeCandleBackfillStageManifest(options: WriteCandleBackfillStageManifestOptions): CandleBackfillStageManifest;
//# sourceMappingURL=candle-backfill-stage-manifest.d.ts.map