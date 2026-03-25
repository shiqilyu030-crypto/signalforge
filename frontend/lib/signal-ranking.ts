import type { IndicatorsResponse, PricesResponse, StrategyResponse, BacktestResponse } from "@/lib/api";

export type SignalLeaderboardEntry = {
  symbol: string;
  trend: string;
  momentum: string;
  signal: string;
  latestClose: number | null;
  rsi: number | null;
  summary: string;
  source: string;
  score: number;
};

export function buildSignalEntry(args: {
  backtest: BacktestResponse | null;
  indicators: IndicatorsResponse | null;
  prices: PricesResponse | null;
  strategy: StrategyResponse | null;
  symbol: string;
}): SignalLeaderboardEntry | null {
  const { backtest, indicators, prices, strategy, symbol } = args;

  if (!backtest || !indicators || !prices || !strategy) {
    return null;
  }

  const latestPrice = prices.data.at(-1);
  const latestIndicator = indicators.data.at(-1);
  return {
    symbol,
    trend: strategy.trend,
    momentum: strategy.momentum,
    signal: strategy.signal,
    latestClose: latestPrice?.Close ?? null,
    rsi: latestIndicator?.RSI ?? null,
    summary: strategy.summary,
    source: prices.source,
    score: strategy.score
  };
}

export function filterSignalEntries(entries: SignalLeaderboardEntry[], filter: SignalFilter) {
  if (filter === "All") {
    return entries;
  }
  if (filter === "Bullish") {
    return entries.filter(
      (entry) =>
        entry.trend === "Bullish" ||
        entry.trend === "Positive" ||
        entry.signal === "Constructive" ||
        entry.signal === "High Conviction"
    );
  }
  if (filter === "Neutral") {
    return entries.filter(
      (entry) =>
        entry.trend === "Neutral" ||
        entry.momentum === "Balanced" ||
        entry.signal === "Watch"
    );
  }
  return entries.filter(
    (entry) =>
      entry.momentum === "Weak" ||
      entry.momentum === "Fading" ||
      entry.signal === "Cautious" ||
      entry.signal === "Defensive"
  );
}

export type SignalFilter = "All" | "Bullish" | "Neutral" | "Weak";
