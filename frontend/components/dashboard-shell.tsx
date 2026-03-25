"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import {
  fetchBacktest,
  fetchIndicators,
  fetchPrices,
  fetchStrategy,
  type BacktestResponse,
  type IndicatorsResponse,
  type PricesResponse,
  type StrategyResponse
} from "@/lib/api";
import { DEFAULT_WATCHLIST } from "@/lib/watchlist";

import { MiniChart } from "@/components/mini-chart";

type DashboardState = {
  backtest: BacktestResponse | null;
  indicators: IndicatorsResponse | null;
  prices: PricesResponse | null;
  strategy: StrategyResponse | null;
};

const DEFAULT_SYMBOL = "AAPL";
export function DashboardShell() {
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [query, setQuery] = useState(DEFAULT_SYMBOL);
  const [state, setState] = useState<DashboardState>({
    backtest: null,
    indicators: null,
    prices: null,
    strategy: null
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = useMemo(() => {
    const normalized = query.trim().toUpperCase();
    if (!normalized) {
      return DEFAULT_WATCHLIST;
    }

    return DEFAULT_WATCHLIST.filter((item) => item.includes(normalized));
  }, [query]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      const [prices, indicators, backtest, strategy] = await Promise.all([
        fetchPrices(symbol),
        fetchIndicators(symbol),
        fetchBacktest(symbol),
        fetchStrategy(symbol)
      ]);

      if (!active) {
        return;
      }

      if (!prices || !indicators || !backtest || !strategy) {
        setState({
          prices: null,
          indicators: null,
          backtest: null,
          strategy: null
        });
        setError(
          `We could not load data for ${symbol}. Try a watchlist ticker like ${DEFAULT_WATCHLIST.join(", ")}.`
        );
      } else {
        setState({ prices, indicators, backtest, strategy });
      }
      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [symbol]);

  const latestClose = useMemo(() => {
    const rows = state.prices?.data ?? [];
    return rows.length ? rows[rows.length - 1].Close : null;
  }, [state.prices]);

  const indicatorRows = state.indicators?.data ?? [];
  const backtestRows = state.backtest?.data ?? [];
  const metrics = state.backtest?.metrics;
  const strategy = state.strategy;

  function applySymbol(nextSymbol: string) {
    const normalized = nextSymbol.trim().toUpperCase();
    if (!normalized) {
      setError("Enter a ticker symbol to load SignalForge data.");
      return;
    }

    setQuery(normalized);
    setSymbol(normalized);
    setShowSuggestions(false);
  }

  return (
    <main className="min-h-screen bg-canvas">
      <div className="section-shell py-8">
        <div className="glass-panel rounded-[2rem] px-6 py-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-200/70">SignalForge Dashboard</p>
              <h1 className="mt-2 font-[var(--font-heading)] text-4xl font-semibold text-white">
                {symbol} signal workspace
              </h1>
            </div>

            <div className="flex flex-col gap-4 xl:items-end">
              <form
                className="relative w-full max-w-xl"
                onSubmit={(event) => {
                  event.preventDefault();
                  applySymbol(query);
                }}
              >
                <div className="flex flex-col gap-3 md:flex-row">
                  <div className="relative flex-1">
                    <input
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value.toUpperCase());
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="Search ticker, e.g. AAPL"
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/40 focus:bg-white/[0.06]"
                    />
                    {showSuggestions && suggestions.length > 0 ? (
                      <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-20 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-halo backdrop-blur-xl">
                        {suggestions.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => applySymbol(item)}
                            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-white/[0.05]"
                          >
                            <span>{item}</span>
                            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Watchlist</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="submit"
                    className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-100"
                  >
                    {loading ? "Loading..." : "Load Symbol"}
                  </button>
                </div>
              </form>

              <div className="flex flex-wrap gap-2">
                {DEFAULT_WATCHLIST.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => applySymbol(item)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      symbol === item
                        ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
                        : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/signals"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Signals
                </Link>
                <Link
                  href="/strategy"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Strategy
                </Link>
                <Link
                  href="/"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Back Home
                </Link>
                <span className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200">
                  {error ? "Backend issue" : "Backend connected"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-[1.75rem] border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MetricCard label="Latest Close" value={loading ? "Loading..." : formatCurrency(latestClose)} />
          <MetricCard
            label="Cumulative Return"
            value={loading ? "Loading..." : formatPercent(metrics?.cumulative_return)}
          />
          <MetricCard
            label="Buy and Hold"
            value={loading ? "Loading..." : formatPercent(metrics?.buy_and_hold_return)}
          />
          <MetricCard label="CAGR" value={loading ? "Loading..." : formatPercent(metrics?.cagr)} />
          <MetricCard label="Sharpe Ratio" value={loading ? "Loading..." : formatDecimal(metrics?.sharpe_ratio)} />
          <MetricCard label="Max Drawdown" value={loading ? "Loading..." : formatPercent(metrics?.max_drawdown)} />
        </div>

        <div className="mt-6">
          <Panel
            title="Signal Summary"
            subtitle={`A simple, rule-based read on ${symbol} built from indicators and backtest context`}
          >
            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-cyan-300/10 via-white/[0.04] to-violet-400/10 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/70">Signal Score</p>
                <div className="mt-4 flex items-end gap-3">
                  <p className="font-[var(--font-heading)] text-5xl font-semibold text-white">
                    {loading ? "..." : strategy?.score ?? "--"}
                  </p>
                  <p className="pb-1 text-sm text-slate-400">/ 100</p>
                </div>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 transition-all duration-500"
                    style={{ width: `${loading ? 8 : strategy?.score ?? 0}%` }}
                  />
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <SignalBadge label="Label" value={loading ? "Loading..." : strategy?.label ?? "Unavailable"} />
                  <SignalBadge
                    label="Confidence"
                    value={loading ? "Loading..." : strategy?.confidence ?? "Unavailable"}
                  />
                  <SignalBadge label="Signal" value={loading ? "Loading..." : strategy?.signal ?? "Unavailable"} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <SignalBadge label="Trend" value={loading ? "Loading..." : strategy?.trend ?? "Unavailable"} />
                  <SignalBadge
                    label="RSI"
                    value={loading ? "Loading..." : formatDecimal(strategy?.rsi)}
                  />
                  <SignalBadge
                    label="MACD"
                    value={loading ? "Loading..." : formatDecimal(strategy?.macd)}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <BreakdownPill label="Trend" value={strategy?.breakdown?.trend} total={30} />
                  <BreakdownPill label="RSI" value={strategy?.breakdown?.rsi} total={30} />
                  <BreakdownPill label="MACD" value={strategy?.breakdown?.macd} total={40} />
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Explanation</p>
                  <p className="mt-4 text-sm leading-7 text-slate-200">
                    {loading
                      ? "Building a plain-English market read from the latest backend data..."
                      : strategy?.explanation ?? strategy?.summary ?? "No summary is available for this symbol right now."}
                  </p>
                  <p className="mt-5 text-xs uppercase tracking-[0.22em] text-slate-500">
                    Informational only. Not investment advice.
                  </p>
                </div>
              </div>
            </div>
          </Panel>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel
            title="Price and Moving Averages"
            subtitle="SignalForge streams daily close, MA5, and MA20 directly from the FastAPI backend"
          >
            <MiniChart data={indicatorRows.map((row) => row.Close)} color="#7dd3fc" />
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Legend label="Close" swatch="bg-cyan-300" />
              <Legend label="MA5" swatch="bg-amber-300" />
              <Legend label="MA20" swatch="bg-violet-300" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <StatPill label="MA5" value={formatCurrency(latestValue(indicatorRows, "MA5"))} />
              <StatPill label="MA20" value={formatCurrency(latestValue(indicatorRows, "MA20"))} />
            </div>
          </Panel>

          <Panel title="Momentum Layer" subtitle="A modern signal readout for RSI and MACD from the analytics API">
            <div className="grid gap-6">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-white">RSI</p>
                  <p className="text-sm text-slate-400">{formatDecimal(latestValue(indicatorRows, "RSI"))}</p>
                </div>
                <MiniChart data={indicatorRows.map((row) => row.RSI)} color="#f472b6" height={170} />
              </div>
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-white">MACD</p>
                  <p className="text-sm text-slate-400">{formatDecimal(latestValue(indicatorRows, "MACD"))}</p>
                </div>
                <MiniChart data={indicatorRows.map((row) => row.MACD)} color="#60a5fa" height={170} />
              </div>
            </div>
          </Panel>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Panel
            title="Strategy Equity Curve"
            subtitle="Compare the model strategy against buy-and-hold using the current backtest feed"
          >
            <MiniChart
              data={backtestRows.map((row) => row.CumulativeStrategyReturn)}
              secondaryData={backtestRows.map((row) => row.CumulativeMarketReturn)}
              color="#6ee7b7"
              height={260}
              secondaryColor="#7dd3fc"
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Legend label="Strategy return" swatch="bg-emerald-300" />
              <Legend label="Market return" swatch="bg-cyan-300" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <StatPill
                label="Strategy curve"
                value={formatDecimal(latestValue(backtestRows, "CumulativeStrategyReturn"))}
              />
              <StatPill
                label="Market curve"
                value={formatDecimal(latestValue(backtestRows, "CumulativeMarketReturn"))}
              />
            </div>
          </Panel>

          <Panel
            title="Recent Snapshot"
            subtitle={`Live product metrics and latest backend-derived readings for ${symbol}`}
          >
            <div className="space-y-3">
              {[
                ["Data source", state.prices?.source ?? "Loading..."],
                ["Rows returned", state.prices?.rows ? String(state.prices.rows) : "Loading..."],
                ["Signal label", strategy?.label ?? "Loading..."],
                ["Latest RSI", formatDecimal(latestValue(indicatorRows, "RSI"))],
                ["Latest MACD", formatDecimal(latestValue(indicatorRows, "MACD"))],
                ["Buy and hold", formatPercent(metrics?.buy_and_hold_return)]
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <span className="text-sm text-slate-400">{label}</span>
                  <span className="text-sm font-medium text-white">{value}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel
            title="Indicator Rows"
            subtitle={`Recent payload entries powering the SignalForge ${symbol} analytics feed`}
          >
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
              <div className="grid grid-cols-5 bg-white/[0.04] px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                <span>Date</span>
                <span>Close</span>
                <span>MA5</span>
                <span>RSI</span>
                <span>MACD</span>
              </div>
              <div className="divide-y divide-white/8">
                {indicatorRows.slice(-8).reverse().map((row) => (
                  <div key={row.Date} className="grid grid-cols-5 px-4 py-3 text-sm text-slate-200">
                    <span>{formatDate(row.Date)}</span>
                    <span>{formatCurrency(row.Close)}</span>
                    <span>{formatCurrency(row.MA5)}</span>
                    <span>{formatDecimal(row.RSI)}</span>
                    <span>{formatDecimal(row.MACD)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </main>
  );
}

function Panel({
  children,
  subtitle,
  title
}: {
  children: ReactNode;
  subtitle: string;
  title: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      className="glass-panel rounded-[2rem] p-6"
    >
      <p className="text-sm text-slate-400">{subtitle}</p>
      <h2 className="mt-1 font-[var(--font-heading)] text-2xl font-semibold text-white">{title}</h2>
      <div className="mt-6">{children}</div>
    </motion.section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      className="glass-panel rounded-[1.7rem] p-5"
    >
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 font-[var(--font-heading)] text-3xl font-semibold text-white">{value}</p>
    </motion.div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-2 text-base font-medium text-white">{value}</p>
    </div>
  );
}

function Legend({ label, swatch }: { label: string; swatch: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <span className={`h-3 w-3 rounded-full ${swatch}`} />
      <span className="text-sm text-slate-300">{label}</span>
    </div>
  );
}

function SignalBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-3 font-[var(--font-heading)] text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function BreakdownPill({
  label,
  total,
  value
}: {
  label: string;
  total: number;
  value?: number | null;
}) {
  const safeValue = typeof value === "number" ? value : 0;

  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
        <p className="text-sm font-medium text-white">
          {safeValue}/{total}
        </p>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400"
          style={{ width: `${(safeValue / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

function latestValue(rows: any[], key: string) {
  if (!rows.length) {
    return null;
  }

  const value = rows[rows.length - 1][key];
  return typeof value === "number" ? value : null;
}

function formatCurrency(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "Unavailable";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);
}

function formatPercent(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "Unavailable";
  }

  return `${(value * 100).toFixed(2)}%`;
}

function formatDecimal(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "Unavailable";
  }

  return value.toFixed(2);
}

function formatScore(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "Unavailable";
  }

  return `${value}/100`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
}
