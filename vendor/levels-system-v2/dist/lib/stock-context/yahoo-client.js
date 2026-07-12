function rawNumber(value) {
    const raw = typeof value === "object" && value !== null && "raw" in value ? value.raw : value;
    const numberValue = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
    return Number.isFinite(numberValue) ? numberValue : undefined;
}
function rawString(value) {
    const raw = typeof value === "object" && value !== null && "raw" in value ? value.raw : value;
    const stringValue = typeof raw === "string" ? raw.trim() : undefined;
    return stringValue && stringValue.length > 0 ? stringValue : undefined;
}
function isSameLocalDate(timestampSeconds, timestampMs) {
    if (typeof timestampSeconds !== "number" || !Number.isFinite(timestampSeconds)) {
        return false;
    }
    const left = new Date(timestampSeconds * 1000);
    const right = new Date(timestampMs);
    return (left.getFullYear() === right.getFullYear() &&
        left.getMonth() === right.getMonth() &&
        left.getDate() === right.getDate());
}
function readNumber(primary, key, fallback) {
    return rawNumber(primary?.[key]) ?? fallback;
}
function readString(primary, key, fallback) {
    return rawString(primary?.[key]) ?? fallback;
}
function latestFiniteBarValue(timestamps, values) {
    if (!values) {
        return null;
    }
    for (let index = Math.min(timestamps.length, values.length) - 1; index >= 0; index -= 1) {
        const value = values[index];
        const timestamp = timestamps[index];
        if (typeof value === "number" &&
            Number.isFinite(value) &&
            typeof timestamp === "number" &&
            Number.isFinite(timestamp)) {
            return { value, timestamp };
        }
    }
    return null;
}
function sessionForTimestamp(timestamp, periods) {
    const pre = periods?.pre;
    const regular = periods?.regular;
    const post = periods?.post;
    if (typeof pre?.start === "number" && typeof pre.end === "number" && timestamp >= pre.start && timestamp <= pre.end) {
        return "premarket";
    }
    if (typeof regular?.start === "number" && typeof regular.end === "number" && timestamp >= regular.start && timestamp <= regular.end) {
        return "regular";
    }
    if (typeof post?.start === "number" && typeof post.end === "number" && timestamp >= post.start && timestamp <= post.end) {
        return "postmarket";
    }
    return "unknown";
}
function mergeYahooQuotes(quote, chartQuote) {
    if (!quote) {
        return chartQuote;
    }
    if (!chartQuote) {
        return quote;
    }
    return {
        ...chartQuote,
        ...quote,
        regularMarketPrice: quote.regularMarketPrice ?? chartQuote.regularMarketPrice,
        regularMarketOpen: quote.regularMarketOpen ?? chartQuote.regularMarketOpen,
        regularMarketDayHigh: quote.regularMarketDayHigh ?? chartQuote.regularMarketDayHigh,
        regularMarketDayLow: quote.regularMarketDayLow ?? chartQuote.regularMarketDayLow,
        regularMarketPreviousClose: quote.regularMarketPreviousClose ?? chartQuote.regularMarketPreviousClose,
        regularMarketVolume: quote.regularMarketVolume ?? chartQuote.regularMarketVolume,
        preMarketPrice: quote.preMarketPrice ?? chartQuote.preMarketPrice,
        preMarketTime: quote.preMarketTime ?? chartQuote.preMarketTime,
        postMarketPrice: quote.postMarketPrice ?? chartQuote.postMarketPrice,
        postMarketTime: quote.postMarketTime ?? chartQuote.postMarketTime,
        currency: quote.currency ?? chartQuote.currency,
        exchange: quote.exchange ?? chartQuote.exchange,
        priceSource: quote.priceSource ?? chartQuote.priceSource,
    };
}
export class YahooClient {
    fetchImpl;
    timeoutMs;
    quoteBaseUrl;
    summaryBaseUrl;
    constructor(options = {}) {
        this.fetchImpl = options.fetchImpl ?? fetch;
        this.timeoutMs = options.timeoutMs ?? 15_000;
        this.quoteBaseUrl = options.quoteBaseUrl ?? "https://query1.finance.yahoo.com/v7/finance/quote";
        this.summaryBaseUrl = options.summaryBaseUrl ?? "https://query1.finance.yahoo.com/v10/finance/quoteSummary";
    }
    async getPreviousDayRange(symbolInput) {
        const symbol = symbolInput.trim().toUpperCase();
        const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`);
        url.searchParams.set("range", "10d");
        url.searchParams.set("interval", "1d");
        url.searchParams.set("includePrePost", "false");
        const data = await this.requestJson(url);
        const result = data.chart?.result?.[0];
        const timestamps = result?.timestamp ?? [];
        const quote = result?.indicators?.quote?.[0];
        const highs = quote?.high ?? [];
        const lows = quote?.low ?? [];
        const lastIndex = Math.min(timestamps.length, highs.length, lows.length) - 1;
        const startIndex = isSameLocalDate(timestamps[lastIndex], Date.now()) ? lastIndex - 1 : lastIndex;
        for (let index = startIndex; index >= 0; index -= 1) {
            const high = highs[index];
            const low = lows[index];
            if (typeof high === "number" && Number.isFinite(high) && typeof low === "number" && Number.isFinite(low)) {
                return {
                    source: "Yahoo",
                    high,
                    low,
                    timestamp: timestamps[index],
                };
            }
        }
        throw new Error(`Yahoo previous day range unavailable for ${symbol}.`);
    }
    async getChartQuote(symbolInput) {
        const symbol = symbolInput.trim().toUpperCase();
        const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`);
        url.searchParams.set("range", "1d");
        url.searchParams.set("interval", "1m");
        url.searchParams.set("includePrePost", "true");
        const data = await this.requestJson(url);
        const result = data.chart?.result?.[0];
        if (!result) {
            throw new Error(`Yahoo chart quote unavailable for ${symbol}.`);
        }
        const timestamps = result.timestamp ?? [];
        const quote = result.indicators?.quote?.[0];
        const latestClose = latestFiniteBarValue(timestamps, quote?.close);
        const latestHigh = latestFiniteBarValue(timestamps, quote?.high);
        const latestLow = latestFiniteBarValue(timestamps, quote?.low);
        const latestVolume = latestFiniteBarValue(timestamps, quote?.volume);
        const meta = result.meta;
        if (!latestClose && typeof meta?.regularMarketPrice !== "number") {
            throw new Error(`Yahoo chart quote has no usable price for ${symbol}.`);
        }
        const latestPrice = latestClose?.value ?? meta?.regularMarketPrice;
        const latestTime = latestClose?.timestamp;
        const session = typeof latestTime === "number"
            ? sessionForTimestamp(latestTime, meta?.currentTradingPeriod)
            : "regular";
        return {
            source: "Yahoo",
            symbol,
            exchange: meta?.fullExchangeName ?? meta?.exchangeName,
            currency: meta?.currency,
            regularMarketPrice: session === "regular" || session === "unknown" ? latestPrice : meta?.regularMarketPrice,
            regularMarketDayHigh: latestHigh?.value,
            regularMarketDayLow: latestLow?.value,
            regularMarketPreviousClose: meta?.previousClose ?? meta?.chartPreviousClose,
            regularMarketVolume: latestVolume?.value,
            regularMarketTime: session === "regular" || session === "unknown" ? latestTime : undefined,
            preMarketPrice: session === "premarket" ? latestPrice : undefined,
            preMarketTime: session === "premarket" ? latestTime : undefined,
            postMarketPrice: session === "postmarket" ? latestPrice : undefined,
            postMarketTime: session === "postmarket" ? latestTime : undefined,
            priceSource: "chart",
        };
    }
    async requestJson(url) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const response = await this.fetchImpl(url, {
                method: "GET",
                signal: controller.signal,
                headers: {
                    "User-Agent": "Mozilla/5.0 TraderLink levels-system",
                    Accept: "application/json",
                },
            });
            if (!response.ok) {
                const body = await response.text();
                throw new Error(`Yahoo request failed (${response.status} ${response.statusText}) for ${url.pathname}: ${body}`.trim());
            }
            return (await response.json());
        }
        finally {
            clearTimeout(timeout);
        }
    }
    async getQuote(symbolInput) {
        const symbol = symbolInput.trim().toUpperCase();
        const url = new URL(this.quoteBaseUrl);
        url.searchParams.set("symbols", symbol);
        const data = await this.requestJson(url);
        const quote = data.quoteResponse?.result?.[0];
        if (!quote) {
            throw new Error(`Yahoo quote unavailable for ${symbol}.`);
        }
        return {
            source: "Yahoo",
            symbol,
            longName: quote.longName,
            shortName: quote.shortName,
            exchange: quote.fullExchangeName ?? quote.exchange,
            quoteSourceName: quote.quoteSourceName,
            currency: quote.currency,
            marketCap: quote.marketCap,
            regularMarketPrice: quote.regularMarketPrice,
            regularMarketOpen: quote.regularMarketOpen,
            regularMarketDayHigh: quote.regularMarketDayHigh,
            regularMarketDayLow: quote.regularMarketDayLow,
            regularMarketPreviousClose: quote.regularMarketPreviousClose,
            regularMarketVolume: quote.regularMarketVolume,
            averageDailyVolume10Day: quote.averageDailyVolume10Day,
            averageDailyVolume3Month: quote.averageDailyVolume3Month,
            preMarketPrice: quote.preMarketPrice,
            preMarketChange: quote.preMarketChange,
            preMarketChangePercent: quote.preMarketChangePercent,
            postMarketPrice: quote.postMarketPrice,
            postMarketChange: quote.postMarketChange,
            postMarketChangePercent: quote.postMarketChangePercent,
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
            regularMarketTime: quote.regularMarketTime,
            preMarketTime: quote.preMarketTime,
            postMarketTime: quote.postMarketTime,
            priceSource: "quote",
        };
    }
    async getSummary(symbolInput) {
        const symbol = symbolInput.trim().toUpperCase();
        const url = new URL(`${this.summaryBaseUrl.replace(/\/+$/g, "")}/${encodeURIComponent(symbol)}`);
        url.searchParams.set("modules", [
            "price",
            "assetProfile",
            "summaryDetail",
            "defaultKeyStatistics",
            "financialData",
        ].join(","));
        const data = await this.requestJson(url);
        const summary = data.quoteSummary?.result?.[0];
        if (!summary) {
            throw new Error(`Yahoo quote summary unavailable for ${symbol}.`);
        }
        return {
            source: "Yahoo",
            sector: readString(summary.assetProfile, "sector"),
            industry: readString(summary.assetProfile, "industry"),
            country: readString(summary.assetProfile, "country"),
            website: readString(summary.assetProfile, "website"),
            description: readString(summary.assetProfile, "longBusinessSummary"),
            fullTimeEmployees: readNumber(summary.assetProfile, "fullTimeEmployees"),
            marketCap: readNumber(summary.price, "marketCap", readNumber(summary.summaryDetail, "marketCap")),
            floatShares: readNumber(summary.defaultKeyStatistics, "floatShares"),
            sharesOutstanding: readNumber(summary.defaultKeyStatistics, "sharesOutstanding"),
            sharesShort: readNumber(summary.defaultKeyStatistics, "sharesShort"),
            sharesShortPriorMonth: readNumber(summary.defaultKeyStatistics, "sharesShortPriorMonth"),
            shortPercentOfFloat: readNumber(summary.defaultKeyStatistics, "shortPercentOfFloat"),
            shortRatio: readNumber(summary.defaultKeyStatistics, "shortRatio"),
            totalCash: readNumber(summary.financialData, "totalCash"),
            totalDebt: readNumber(summary.financialData, "totalDebt"),
            totalRevenue: readNumber(summary.financialData, "totalRevenue"),
            grossProfits: readNumber(summary.financialData, "grossProfits"),
            ebitda: readNumber(summary.financialData, "ebitda"),
            freeCashflow: readNumber(summary.financialData, "freeCashflow"),
            profitMargins: readNumber(summary.financialData, "profitMargins"),
            operatingMargins: readNumber(summary.financialData, "operatingMargins"),
            grossMargins: readNumber(summary.financialData, "grossMargins"),
            revenueGrowth: readNumber(summary.financialData, "revenueGrowth"),
        };
    }
    async getStockContext(symbolInput) {
        const symbol = symbolInput.trim().toUpperCase();
        if (!symbol) {
            throw new Error("A ticker symbol is required.");
        }
        const [quoteResult, chartQuoteResult, summaryResult, previousDayResult] = await Promise.allSettled([
            this.getQuote(symbol),
            this.getChartQuote(symbol),
            this.getSummary(symbol),
            this.getPreviousDayRange(symbol),
        ]);
        const errors = [];
        if (quoteResult.status === "rejected") {
            errors.push(quoteResult.reason instanceof Error ? quoteResult.reason.message : String(quoteResult.reason));
        }
        if (chartQuoteResult.status === "rejected") {
            errors.push(chartQuoteResult.reason instanceof Error ? chartQuoteResult.reason.message : String(chartQuoteResult.reason));
        }
        if (summaryResult.status === "rejected") {
            errors.push(summaryResult.reason instanceof Error ? summaryResult.reason.message : String(summaryResult.reason));
        }
        if (previousDayResult.status === "rejected") {
            errors.push(previousDayResult.reason instanceof Error ? previousDayResult.reason.message : String(previousDayResult.reason));
        }
        return {
            source: "Yahoo",
            symbol,
            fetchedAt: Date.now(),
            quote: mergeYahooQuotes(quoteResult.status === "fulfilled" ? quoteResult.value : undefined, chartQuoteResult.status === "fulfilled" ? chartQuoteResult.value : undefined),
            summary: summaryResult.status === "fulfilled" ? summaryResult.value : undefined,
            previousDay: previousDayResult.status === "fulfilled" ? previousDayResult.value : undefined,
            errors,
        };
    }
}
export function createYahooClientFromEnv(env = process.env, fetchImpl) {
    const enabled = env.YAHOO_STOCK_CONTEXT_ENABLED?.trim().toLowerCase();
    if (enabled === "0" || enabled === "false" || enabled === "no" || enabled === "off") {
        return null;
    }
    return new YahooClient({ fetchImpl });
}
