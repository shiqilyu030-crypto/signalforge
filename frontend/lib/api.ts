export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

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
    sharpe_ratio: number;
    max_drawdown: number;
  };
  data: BacktestRecord[];
};

export type StrategyResponse = {
  symbol: string;
  source: string;
  trend: string;
  momentum: string;
  signal: string;
  confidence: string;
  score: number;
  summary: string;
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
  const url = new URL(`${apiBaseUrl}${path}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

function symbolPath(route: "prices" | "indicators" | "backtest" | "strategy", symbol: string) {
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

export async function fetchHealth(): Promise<HealthResponse | null> {
  return requestJson<HealthResponse>("/health");
}

export async function fetchPrices(
  symbol: string,
  options: SymbolRequestOptions = {}
): Promise<PricesResponse | null> {
  const request = { ...DEFAULT_REQUEST_OPTIONS, ...options };

  return requestJson<PricesResponse>(symbolPath("prices", symbol), {
    period: request.period,
    interval: request.interval
  });
}

export async function fetchIndicators(
  symbol: string,
  options: SymbolRequestOptions = {}
): Promise<IndicatorsResponse | null> {
  const request = { ...DEFAULT_REQUEST_OPTIONS, ...options };

  return requestJson<IndicatorsResponse>(symbolPath("indicators", symbol), {
    period: request.period,
    interval: request.interval,
    short_window: request.short_window,
    long_window: request.long_window
  });
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
