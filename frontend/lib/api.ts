export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://quant-data-platform-api-production.up.railway.app";

export type PriceRecord = {
  Date: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  "Adj Close"?: number | null;
  Volume: number;
  Ticker?: string;
  CreatedAt?: string;
};

export type IndicatorRecord = PriceRecord & {
  MA5?: number | null;
  MA20?: number | null;
  RSI?: number | null;
  MACD?: number | null;
  MACDSignal?: number | null;
  MACDHistogram?: number | null;
};

export type BacktestRecord = IndicatorRecord & {
  MarketReturn?: number | null;
  Signal?: number | null;
  Position?: number | null;
  StrategyReturn?: number | null;
  CumulativeMarketReturn?: number | null;
  CumulativeStrategyReturn?: number | null;
};

export type HealthResponse = {
  api_status: string;
  database_status: string;
  timestamp: string;
};

export type PricesResponse = {
  symbol: string;
  source: string;
  rows: number;
  data: PriceRecord[];
};

export type IndicatorsResponse = {
  symbol: string;
  source: string;
  rows: number;
  data: IndicatorRecord[];
};

export type BacktestResponse = {
  symbol: string;
  source: string;
  rows: number;
  metrics: {
    cumulative_return: number;
    buy_and_hold_return: number;
    cagr: number;
    sharpe_ratio: number;
    max_drawdown: number;
    buy_and_hold_cagr?: number;
  };
  data: BacktestRecord[];
};

export type SignalBreakdown = {
  trend: number;
  rsi: number;
  macd: number;
};

export type StrategyResponse = {
  symbol: string;
  ticker: string;
  source: string;
  price?: number | null;
  label: string;
  breakdown: SignalBreakdown;
  trend: string;
  momentum: string;
  signal: string;
  confidence: string;
  score: number;
  rsi?: number | null;
  macd?: number | null;
  ma50?: number | null;
  explanation: string;
  summary: string;
  cumulative_return?: number | null;
  buy_and_hold_return?: number | null;
  metrics: BacktestResponse["metrics"];
};

export type SignalRecord = {
  rank: number;
  symbol: string;
  ticker: string;
  source: string;
  price?: number | null;
  score: number;
  label: string;
  breakdown: SignalBreakdown;
  trend: string;
  momentum: string;
  confidence: string;
  rsi?: number | null;
  macd?: number | null;
  explanation: string;
  summary: string;
  metrics: BacktestResponse["metrics"];
};

export type SignalsResponse = {
  rows: number;
  data: SignalRecord[];
};

type RequestParams = Record<string, string | number | undefined>;
type SymbolRequestOptions = {
  interval?: string;
  long_window?: number;
  period?: string;
  short_window?: number;
};

const DEFAULT_REQUEST_OPTIONS: Required<SymbolRequestOptions> = {
  interval: "1d",
  long_window: 20,
  period: "1y",
  short_window: 5
};

function buildUrl(path: string, params?: RequestParams) {
  const url = new URL(`${API_BASE}${path}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

function symbolPath(route: "prices" | "indicators" | "backtest" | "strategy" | "signals", symbol: string) {
  return `/${route}/${encodeURIComponent(symbol.toUpperCase())}`;
}

async function requestJson<T>(path: string, params?: RequestParams): Promise<T | null> {
  try {
    const response = await fetch(buildUrl(path, params), {
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

type RawPricesResponse = {
  symbol: string;
  source?: string;
  rows: number;
  data?: PriceRecord[];
  prices?: PriceRecord[];
};

type RawIndicatorsResponse = {
  symbol: string;
  source?: string;
  rows: number;
  data?: IndicatorRecord[];
  indicators?: IndicatorRecord[];
};

function normalizePricesResponse(payload: RawPricesResponse | null): PricesResponse | null {
  if (!payload) {
    return null;
  }

  return {
    symbol: payload.symbol,
    source: payload.source ?? "yahoo_finance",
    rows: payload.rows,
    data: payload.data ?? payload.prices ?? []
  };
}

function normalizeIndicatorsResponse(payload: RawIndicatorsResponse | null): IndicatorsResponse | null {
  if (!payload) {
    return null;
  }

  return {
    symbol: payload.symbol,
    source: payload.source ?? "yahoo_finance",
    rows: payload.rows,
    data: payload.data ?? payload.indicators ?? []
  };
}

export async function fetchHealth(): Promise<HealthResponse | null> {
  return requestJson<HealthResponse>("/health");
}

export async function fetchPrices(
  symbol: string,
  options: SymbolRequestOptions = {}
): Promise<PricesResponse | null> {
  const request = { ...DEFAULT_REQUEST_OPTIONS, ...options };

  const payload = await requestJson<RawPricesResponse>(symbolPath("prices", symbol), {
    period: request.period,
    interval: request.interval
  });

  return normalizePricesResponse(payload);
}

export async function fetchIndicators(
  symbol: string,
  options: SymbolRequestOptions = {}
): Promise<IndicatorsResponse | null> {
  const request = { ...DEFAULT_REQUEST_OPTIONS, ...options };

  const payload = await requestJson<RawIndicatorsResponse>(symbolPath("indicators", symbol), {
    period: request.period,
    interval: request.interval,
    short_window: request.short_window,
    long_window: request.long_window
  });

  return normalizeIndicatorsResponse(payload);
}

export async function fetchBacktest(
  symbol: string,
  options: SymbolRequestOptions = {}
): Promise<BacktestResponse | null> {
  const request = { ...DEFAULT_REQUEST_OPTIONS, ...options };

  return requestJson<BacktestResponse>(symbolPath("backtest", symbol), {
    period: request.period,
    interval: request.interval,
    short_window: request.short_window,
    long_window: request.long_window
  });
}

export async function fetchStrategy(
  symbol: string,
  options: SymbolRequestOptions = {}
): Promise<StrategyResponse | null> {
  const request = { ...DEFAULT_REQUEST_OPTIONS, ...options };

  return requestJson<StrategyResponse>(symbolPath("strategy", symbol), {
    period: request.period,
    interval: request.interval,
    short_window: request.short_window,
    long_window: request.long_window
  });
}

export async function fetchSignals(
  options: Pick<SymbolRequestOptions, "period" | "interval"> = {}
): Promise<SignalsResponse | null> {
  const request = { ...DEFAULT_REQUEST_OPTIONS, ...options };

  return requestJson<SignalsResponse>("/signals", {
    period: request.period,
    interval: request.interval
  });
}

export async function fetchSignal(
  symbol: string,
  options: Pick<SymbolRequestOptions, "period" | "interval"> = {}
): Promise<SignalRecord | null> {
  const request = { ...DEFAULT_REQUEST_OPTIONS, ...options };

  return requestJson<SignalRecord>(symbolPath("signals", symbol), {
    period: request.period,
    interval: request.interval
  });
}
