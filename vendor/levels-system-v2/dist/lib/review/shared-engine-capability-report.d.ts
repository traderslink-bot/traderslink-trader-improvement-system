export type SharedEngineCapabilityReport = {
    generatedAt: string;
    packageName: string;
    publicSubpath: string | null;
    publicExportCount: number;
    publicExports: string[];
    scripts: string[];
    dataDependencies: string[];
    implementedCapabilities: string[];
    partialCapabilities: string[];
    plannedCapabilities: string[];
};
export declare function buildSharedEngineCapabilityReport(params?: {
    packageJsonPath?: string;
    publicIndexPath?: string;
}): Promise<SharedEngineCapabilityReport>;
export declare function formatSharedEngineCapabilityReport(report: SharedEngineCapabilityReport): string;
export declare function writeSharedEngineCapabilityReport(params: {
    report: SharedEngineCapabilityReport;
    outDir?: string;
}): Promise<{
    jsonPath: string;
    markdownPath: string;
}>;
//# sourceMappingURL=shared-engine-capability-report.d.ts.map