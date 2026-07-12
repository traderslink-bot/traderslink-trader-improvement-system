type FetchLike = typeof fetch;
export type TraderCommentaryResult = {
    text: string;
    model: string;
};
export type SymbolRecapCommentaryInput = {
    symbol: string;
    deterministicRecap: string;
    operatorNote?: string;
    topOpportunity?: Record<string, unknown> | null;
    latestProgress?: Record<string, unknown> | null;
    latestEvaluation?: Record<string, unknown> | null;
};
export type SignalCommentaryInput = {
    symbol: string;
    title: string;
    deterministicBody: string;
    eventType?: string;
    severity?: string;
    confidence?: string;
    score?: number;
    operatorNote?: string;
    metadata?: Record<string, unknown> | null;
};
export type ThreadCommentaryInput = {
    symbol: string;
    deterministicRecap: string;
    operatorNote?: string;
    threadSummary?: Record<string, unknown> | null;
    topOpportunity?: Record<string, unknown> | null;
    latestProgress?: Record<string, unknown> | null;
    latestEvaluation?: Record<string, unknown> | null;
};
export type SessionCommentaryInput = {
    sessionSummary: Record<string, unknown>;
    threadSummaries: unknown[];
    threadClutterReport?: Record<string, unknown> | unknown[] | null;
};
export interface TraderCommentaryService {
    enhanceSymbolRecap(input: SymbolRecapCommentaryInput): Promise<TraderCommentaryResult | null>;
    explainSignal(input: SignalCommentaryInput): Promise<TraderCommentaryResult | null>;
    summarizeSymbolThread(input: ThreadCommentaryInput): Promise<TraderCommentaryResult | null>;
    summarizeSession(input: SessionCommentaryInput): Promise<TraderCommentaryResult | null>;
    identifyNoisyFamilies(input: SessionCommentaryInput): Promise<TraderCommentaryResult | null>;
}
export type OpenAITraderCommentaryServiceOptions = {
    apiKey: string;
    model?: string;
    fetchImpl?: FetchLike;
    timeoutMs?: number;
};
type ResponsesApiOutputItem = {
    content?: Array<{
        type?: string;
        text?: string;
    }>;
};
type ResponsesApiResponse = {
    output_text?: string;
    output?: ResponsesApiOutputItem[];
    error?: {
        message?: string;
    };
};
declare function extractResponseText(response: ResponsesApiResponse): string | null;
export declare function validateTraderCommentaryText(text: string): string | null;
export declare class OpenAITraderCommentaryService implements TraderCommentaryService {
    private readonly options;
    private readonly model;
    private readonly fetchImpl;
    private readonly timeoutMs;
    constructor(options: OpenAITraderCommentaryServiceOptions);
    private requestCommentary;
    enhanceSymbolRecap(input: SymbolRecapCommentaryInput): Promise<TraderCommentaryResult | null>;
    explainSignal(input: SignalCommentaryInput): Promise<TraderCommentaryResult | null>;
    summarizeSymbolThread(input: ThreadCommentaryInput): Promise<TraderCommentaryResult | null>;
    summarizeSession(input: SessionCommentaryInput): Promise<TraderCommentaryResult | null>;
    identifyNoisyFamilies(input: SessionCommentaryInput): Promise<TraderCommentaryResult | null>;
}
export declare function createOpenAITraderCommentaryServiceFromEnv(env?: NodeJS.ProcessEnv, fetchImpl?: FetchLike): OpenAITraderCommentaryService | null;
export { extractResponseText };
//# sourceMappingURL=trader-commentary-service.d.ts.map