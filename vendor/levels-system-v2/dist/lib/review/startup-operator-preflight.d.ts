export type StartupOperatorPreflightInput = {
    artifactsRoot?: string;
    now?: string;
};
export type StartupOperatorPreflightArtifactStatus = "present" | "missing";
export type StartupOperatorPreflightArtifact = {
    name: string;
    path: string;
    status: StartupOperatorPreflightArtifactStatus;
};
export type StartupOperatorPreflightResult = {
    generatedAt: string;
    latestLongRunSession: string | null;
    latestLongRunSessionName: string | null;
    artifacts: StartupOperatorPreflightArtifact[];
    checklist: string[];
};
export declare function generateStartupOperatorPreflight(input?: StartupOperatorPreflightInput): StartupOperatorPreflightResult;
export declare function renderStartupOperatorPreflightMarkdown(result: StartupOperatorPreflightResult): string;
export declare function writeStartupOperatorPreflightArtifacts(result: StartupOperatorPreflightResult, outputDir?: string): string;
//# sourceMappingURL=startup-operator-preflight.d.ts.map