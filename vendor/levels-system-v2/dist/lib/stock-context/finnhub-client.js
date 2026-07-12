export class FinnhubClient {
    options;
    fetchImpl;
    timeoutMs;
    baseUrl;
    constructor(options) {
        this.options = options;
        this.fetchImpl = options.fetchImpl ?? fetch;
        this.timeoutMs = options.timeoutMs ?? 15_000;
        this.baseUrl = options.baseUrl ?? "https://finnhub.io/api/v1";
    }
    async requestJson(path, query) {
        const url = new URL(`${this.baseUrl}${path}`);
        for (const [key, value] of Object.entries(query)) {
            url.searchParams.set(key, value);
        }
        url.searchParams.set("token", this.options.apiKey);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const response = await this.fetchImpl(url, {
                method: "GET",
                signal: controller.signal,
            });
            if (!response.ok) {
                const body = await response.text();
                throw new Error(`Finnhub request failed (${response.status} ${response.statusText}) for ${path}: ${body}`.trim());
            }
            return (await response.json());
        }
        finally {
            clearTimeout(timeout);
        }
    }
    async getQuote(symbol) {
        return this.requestJson("/quote", {
            symbol,
        });
    }
    async getCompanyProfile(symbol) {
        return this.requestJson("/stock/profile2", {
            symbol,
        });
    }
    async getThreadPreview(symbolInput) {
        const symbol = symbolInput.trim().toUpperCase();
        if (!symbol) {
            throw new Error("A ticker symbol is required.");
        }
        const [quote, profile] = await Promise.all([
            this.getQuote(symbol),
            this.getCompanyProfile(symbol),
        ]);
        return {
            symbol,
            quote,
            profile,
        };
    }
}
export function createFinnhubClientFromEnv(env = process.env, fetchImpl) {
    const apiKey = env.FINNHUB_API_KEY?.trim();
    if (!apiKey) {
        return null;
    }
    return new FinnhubClient({
        apiKey,
        fetchImpl,
    });
}
