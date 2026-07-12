import type { CandleFetchTimeframe } from "../market-data/candle-types.js";
export type IbkrSmallCapProbeStatus = "completed" | "timeout" | "error";
export type IbkrSmallCapReadinessStatus = "ready" | "thin_history" | "provider_unavailable";
export type IbkrSmallCapReadinessProbe = {
    symbol: string;
    timeframe: CandleFetchTimeframe;
    status: IbkrSmallCapProbeStatus;
    barsReceived: number;
    firstBar: unknown;
    lastBar: unknown;
    durationMs: number;
    details: unknown;
};
export type IbkrSmallCapReadinessSymbol = IbkrSmallCapReadinessProbe & {
    readiness: IbkrSmallCapReadinessStatus;
    reason: string;
};
export type IbkrSmallCapReadinessReport = {
    generatedAt: string;
    timeframe: CandleFetchTimeframe;
    requestedLookbackBars: number;
    minimumReadyBars: number;
    timeoutMs: number;
    totals: {
        symbols: number;
        ready: number;
        thinHistory: number;
        providerUnavailable: number;
        completed: number;
        timeout: number;
        error: number;
    };
    symbols: IbkrSmallCapReadinessSymbol[];
};
export type BuildIbkrSmallCapReadinessReportOptions = {
    probes: IbkrSmallCapReadinessProbe[];
    timeframe: CandleFetchTimeframe;
    requestedLookbackBars: number;
    timeoutMs: number;
    minimumReadyBars?: number;
    generatedAt?: string;
};
export type WriteIbkrSmallCapReadinessReportOptions = {
    report: IbkrSmallCapReadinessReport;
    jsonPath: string;
    markdownPath: string;
};
export declare function buildIbkrSmallCapReadinessReport(options: BuildIbkrSmallCapReadinessReportOptions): IbkrSmallCapReadinessReport;
export declare function formatIbkrSmallCapReadinessMarkdown(report: IbkrSmallCapReadinessReport): string;
export declare function writeIbkrSmallCapReadinessReport(options: WriteIbkrSmallCapReadinessReportOptions): IbkrSmallCapReadinessReport;
//# sourceMappingURL=ibkr-small-cap-readiness-report.d.ts.map