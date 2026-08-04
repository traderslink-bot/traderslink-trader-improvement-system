import type {
  AnalyticsAgentIntent,
  AnalyticsAgentIntentResolution,
} from "./contracts";

function normalize(question: string): string {
  return question.toLowerCase().replace(/[^a-z0-9$.:]+/g, " ").replace(/\s+/g, " ").trim();
}

function hasAny(question: string, phrases: readonly string[]): boolean {
  return phrases.some((phrase) => question.includes(phrase));
}

function priceRange(question: string): AnalyticsAgentIntentResolution["priceRange"] {
  const match = question.match(/(?:under|below|less than|above|over|greater than)\s*\$?([0-9]+(?:\.[0-9]+)?)/);
  if (match === null) return null;
  const value = match[1];
  return Object.freeze({
    minimum: hasAny(question, ["above", "over", "greater than"]) ? value : null,
    maximum: hasAny(question, ["under", "below", "less than"]) ? value : null,
  });
}

function result(
  intent: AnalyticsAgentIntent,
  previousOutcome: "gain" | "loss" | null = null,
  range: AnalyticsAgentIntentResolution["priceRange"] = null,
  priorStreak: AnalyticsAgentIntentResolution["priorStreak"] = null,
  preEntryDailyState: AnalyticsAgentIntentResolution["preEntryDailyState"] = null,
  preEntryDailyPath: AnalyticsAgentIntentResolution["preEntryDailyPath"] = null,
  ranking: AnalyticsAgentIntentResolution["ranking"] = null,
  session: AnalyticsAgentIntentResolution["session"] = null,
): AnalyticsAgentIntentResolution {
  return Object.freeze({ intent, previousOutcome, priceRange: range, priorStreak, preEntryDailyState, preEntryDailyPath, ranking, session });
}

function requestedSession(question: string): AnalyticsAgentIntentResolution["session"] {
  if (hasAny(question, ["premarket", "pre market", "pre-market"])) return "premarket";
  if (hasAny(question, ["after hours", "after-hours", "post market", "post-market", "postmarket"])) return "after_hours";
  if (hasAny(question, ["regular session", "regular market", "regular hours", "market hours"])) return "regular";
  return null;
}

/**
 * Deliberately deterministic. Natural-language model interpretation belongs at
 * a later boundary; this router only recognizes the governed v1 vocabulary.
 */
export function resolveAnalyticsAgentIntent(
  question: string,
  hint?: AnalyticsAgentIntent,
): AnalyticsAgentIntentResolution {
  if (hint !== undefined) return result(hint);
  const normalized = normalize(question);
  if (hasAny(normalized, ["vwap", "ema", "candle", "breakout", "setup", "float", "market cap", "relative volume", "news", "catalyst", "dilution", "support", "resistance"])) {
    return result("unsupported_market_or_setup");
  }
  if (hasAny(normalized, ["sell too early", "cut winners", "held losers too long", "optimal exit", "high of day", "mfe", "mae"])) {
    return result("unsupported_exit_quality");
  }
  if (hasAny(normalized, ["planned risk", "risk reward", "daily goal", "max loss", "followed my stop", "broke my risk"])) {
    return result("unsupported_planned_risk");
  }
  if (hasAny(normalized, ["fee", "fees", "commission", "gross vs net", "gross versus net"])) return result("fee_impact");
  if (hasAny(normalized, ["green to red", "green then red", "red to green", "red then green", "recover from red days"])) return result("daily_transition_summary");
  if (hasAny(normalized, ["after two losses", "after 2 losses"])) return result("prior_streak_behavior", null, null, { outcome: "loss", minimum: "2" });
  if (hasAny(normalized, ["after three losses", "after 3 losses"])) return result("prior_streak_behavior", null, null, { outcome: "loss", minimum: "3" });
  if (hasAny(normalized, ["after two wins", "after 2 wins"])) return result("prior_streak_behavior", null, null, { outcome: "gain", minimum: "2" });
  if (hasAny(normalized, ["after three wins", "after 3 wins"])) return result("prior_streak_behavior", null, null, { outcome: "gain", minimum: "3" });
  if (hasAny(normalized, ["longest losing streak", "longest winning streak", "current streak", "show my streaks", "streaks affect"])) return result("streak_summary");
  if (hasAny(normalized, ["already red", "when i am already red"])) return result("pre_entry_daily_state_behavior", null, null, null, "red");
  if (hasAny(normalized, ["already green", "when i am already green"])) return result("pre_entry_daily_state_behavior", null, null, null, "green");
  if (hasAny(normalized, ["after first win"])) return result("pre_entry_daily_path_behavior", null, null, null, null, "after_first_win");
  if (hasAny(normalized, ["after first loss"])) return result("pre_entry_daily_path_behavior", null, null, null, null, "after_first_loss");
  if (hasAny(normalized, ["after giving back profit"])) return result("pre_entry_daily_path_behavior", null, null, null, null, "after_peak_profit_giveback");
  if (hasAny(normalized, ["best trading day", "best day"])) return result("best_worst_day", null, null, null, null, null, "descending");
  if (hasAny(normalized, ["worst trading day", "worst day"])) return result("best_worst_day", null, null, null, null, null, "ascending");
  if (hasAny(normalized, ["best price range", "price range is best", "price range works best"])) return result("best_worst_price_range", null, null, null, null, null, "descending");
  if (hasAny(normalized, ["worst price range", "price range is worst", "price range works worst"])) return result("best_worst_price_range", null, null, null, null, null, "ascending");
  if (hasAny(normalized, ["biggest weakness", "top leaks", "losing the most money", "biggest strength", "top strengths", "what should i review next"])) return result("limited_category_summary", null, null, null, null, null, hasAny(normalized, ["strength", "strengths"]) ? "descending" : "ascending");
  if (hasAny(normalized, ["how did i do today", "review today", "daily review", "what happened today", "trading day"])) return result("daily_review");
  if (hasAny(normalized, ["how did i do this week", "review this week", "weekly review", "what changed this week", "trading week"])) return result("weekly_review");
  if (hasAny(normalized, ["how did i do this month", "review this month", "monthly review", "what changed this month", "trading month"])) return result("monthly_review");
  if (hasAny(normalized, ["give back", "giving back", "giveback", "drawdown", "green then red", "red then green"])) return result("giveback_drawdown");
  if (hasAny(normalized, ["after a loss", "after loss", "revenge trade"])) return result("prior_outcome_behavior", "loss");
  if (hasAny(normalized, ["after a win", "after win", "after wins"])) return result("prior_outcome_behavior", "gain");
  const session = requestedSession(normalized);
  if (session !== null || hasAny(normalized, ["market session", "trading session", "session performance"])) {
    const sessionRanking: AnalyticsAgentIntentResolution["ranking"] = hasAny(normalized, ["least profitable", "worst session"])
      ? "ascending"
      : hasAny(normalized, ["most profitable", "best session"])
        ? "descending"
        : null;
    return result("session_performance", null, null, null, null, null, sessionRanking, session);
  }
  if (hasAny(normalized, ["compare periods", "compare this period", "compare this month with last month", "compare this week with last week", "compare this month to last month", "compare this week to last week", "this month compared with last month", "this week compared with last week", "versus last period", "vs last period", "this week vs", "this month vs", "period over period"])) return result("period_comparison");
  if (hasAny(normalized, ["hold time", "holding time", "how long do i hold", "quick trades", "scalps", "longer holds"])) return result("holding_time_performance");
  if (hasAny(normalized, ["long vs short", "long versus short", "shorts versus longs", "longs versus shorts", "longs compare with shorts", "short vs long", "direction performance"])) return result("direction_performance");
  if (hasAny(normalized, ["position size", "share size", "size performance", "sizing performance", "large size", "small size"])) return result("position_size_performance");
  if (hasAny(normalized, ["fourth", "later trades", "first trade", "trade sequence", "stop after three"])) return result("trade_sequence_behavior");
  if (hasAny(normalized, ["repeat attempt", "same ticker", "same symbol", "overtrade"])) return result("repeat_attempt_behavior");
  const range = priceRange(normalized);
  if (range !== null || hasAny(normalized, ["price range", "low priced", "penny stock"])) return result("price_range_performance", null, range);
  if (hasAny(normalized, ["ticker", "tickers", "symbol", "stocks hurt", "stocks help"])) {
    const tickerRanking: AnalyticsAgentIntentResolution["ranking"] = hasAny(normalized, [
      "lost the most money", "biggest loser", "worst ticker", "tickers hurt", "stocks hurt",
    ])
      ? "ascending"
      : hasAny(normalized, ["made the most money", "make the most money", "most money on", "best ticker", "strongest ticker", "top winner", "tickers help", "stocks help"])
        ? "descending"
        : null;
    return result("ticker_performance", null, null, null, null, null, tickerRanking);
  }
  if (hasAny(normalized, ["time of day", "times of day", "time do i", "market open", "late day", "opening"])) return result("time_of_day_performance");
  if (hasAny(normalized, ["data quality", "missing data", "can this result be trusted", "manual trades incomplete"])) return result("data_quality");
  if (hasAny(normalized, ["p l", "p/l", "profit factor", "expectancy", "win rate", "how am i doing", "overall", "net pnl", "net p l"])) return result("core_performance");
  return result("unsupported_unknown");
}
